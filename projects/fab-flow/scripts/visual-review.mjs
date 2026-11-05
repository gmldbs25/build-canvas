import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(project, '../../docs/fab-flow/final-polish/round-2');
await fs.mkdir(output, { recursive:true });
const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'fab-flow-visual-review-'));
const deployed = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deployed, { recursive:true });
await fs.cp(path.join(project, 'dist-pages'), deployed, { recursive:true });
const server = spawn('python3', ['-m', 'http.server', '4180', '--bind', '127.0.0.1', '--directory', sandbox], {stdio:['ignore','pipe','pipe']});
const logs=[];
server.stdout.on('data', value=>logs.push(value.toString()));
server.stderr.on('data', value=>logs.push(value.toString()));
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Server exited: '+logs.join(''));
    try{const response=await fetch('http://127.0.0.1:4180/build-canvas/fab-flow-preview/');if(response.status===200){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!ready)throw Error('Server did not start: '+logs.join(''));
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:4180/build-canvas/fab-flow-preview/',{waitUntil:'networkidle'});
    await page.locator('#chapter-06 .chapter-head').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
    await page.screenshot({path:path.join(output,`engineering-${label}-inline.png`)});
    const opener=page.locator('#chapter-06 .ed-visual-tools button').first();
    await opener.evaluate(el=>{el.focus({preventScroll:true});el.click()});
    const dialog=page.getByRole('dialog',{name:'V6 service lane과 port dock 연결 개념도. 실제 좌표를 재현하지 않습니다.'});
    await dialog.waitFor({state:'visible'});
    const expectedMode=width<640?'is-original':'is-fit';
    await dialog.locator('.diagram-viewer-scroll').waitFor({state:'visible'});
    const mode=await dialog.locator('.diagram-viewer-scroll').getAttribute('class');
    if(!mode?.includes(expectedMode))throw Error(`${label} viewer mode mismatch: ${mode}`);
    await page.screenshot({path:path.join(output,`diagram-viewer-${label}-${width<640?'original':'fit'}.png`)});
    await page.keyboard.press('Escape');
    await page.close();
  }
  console.log('visual-review-round-2','1440x900,390x844,inline+viewer screenshots captured');
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox,{recursive:true,force:true});
}
