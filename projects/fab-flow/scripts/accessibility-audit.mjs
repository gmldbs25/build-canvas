import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import net from 'node:net';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'fab-flow-axe-'));
const deployed = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deployed, { recursive:true });
await fs.cp(path.join(project, 'dist-pages'), deployed, { recursive:true });
const portProbe=net.createServer();
await new Promise(resolve=>portProbe.listen(0,'127.0.0.1',resolve));
const port=portProbe.address().port;
await new Promise((resolve,reject)=>portProbe.close(error=>error?reject(error):resolve()));
const baseUrl=`http://127.0.0.1:${port}/build-canvas/fab-flow-preview/`;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', sandbox], {stdio:['ignore','pipe','pipe']});
const logs=[];
server.stdout.on('data', value=>logs.push(value.toString()));
server.stderr.on('data', value=>logs.push(value.toString()));
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Server exited: '+logs.join(''));
    try{const response=await fetch(baseUrl);if(response.status===200){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  if(!ready)throw Error('Server did not start: '+logs.join(''));
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.goto(baseUrl,{waitUntil:'networkidle'});
    await page.addScriptTag({path:path.resolve(project,'../../node_modules/axe-core/axe.min.js')});
    const defaultAudit=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    const issues=[];
    for(const violation of defaultAudit.violations){issues.push(`${label}: ${violation.id} (${violation.nodes.length} nodes)`)}
    const opener=page.locator('#chapter-06 .ed-visual-tools button').first();
    await opener.evaluate(el=>{el.focus({preventScroll:true});el.click()});
    const dialog=page.getByRole('dialog',{name:'V6 service lane과 port dock 연결 개념도. 실제 좌표를 재현하지 않습니다.'});
    await dialog.waitFor({state:'visible'});
    const viewerAudit=await page.evaluate(async()=>await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    for(const violation of viewerAudit.violations){issues.push(`${label} viewer: ${violation.id} (${violation.nodes.length} nodes)`)}
    console.log('axe-audit',JSON.stringify({viewport:`${width}x${height}`,pageViolations:defaultAudit.violations.length,viewerViolations:viewerAudit.violations.length}));
    if(issues.length)throw Error(issues.join('\n'));
    await page.close();
  }
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox,{recursive:true,force:true});
}
