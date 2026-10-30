import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.resolve(project, 'evidence');
await fs.mkdir(evidence, { recursive: true });

const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-static-'));
const deploymentDir = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deploymentDir, { recursive: true });
await fs.cp(path.join(project,'dist-pages'),deploymentDir,{recursive:true});
const server = spawn('python3',
  ['-m','http.server','4179','--bind','127.0.0.1','--directory',sandbox],
  { cwd: project, stdio: ['ignore','pipe','pipe'] });
const logs = [];
server.stdout.on('data', data => logs.push(data.toString()));
server.stderr.on('data', data => logs.push(data.toString()));

async function ready() {
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error('Vite preview exited: ' + logs.join(''));
    try {
      const response = await fetch('http://127.0.0.1:4179/build-canvas/fab-flow-preview/');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Vite preview did not start: ' + logs.join(''));
}
let browser;
try {
  await ready();
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
  });
  for (const [width,height] of [[1440,900],[390,844]]) {
    const page = await browser.newPage({ viewport: { width,height }, deviceScaleFactor: 1 });
    const faults=[];
    page.on('pageerror',e=>faults.push(String(e)));
    page.on('console',msg=>{ if(msg.type()==='error') faults.push(msg.text()); });
    page.on('response',response=>{if(response.status()>=400)faults.push('HTTP '+response.status()+' '+response.url());});
    const response = await page.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/', { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(1100);
    console.log('initial-debug',JSON.stringify({viewport:[width,height],status:response?.status(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,350),errors:faults.slice(0,8)}));
    await page.screenshot({path:path.join(evidence,'initial-'+width+'.png')});
    await expect(page.getByRole('heading', {name:'하나의 운송은 어떻게 완성될까?'})).toBeVisible({timeout:5000});
    await expect(page.locator('[data-renderer="three-webgl"]')).toBeVisible({timeout:30000});
    await expect(page.locator('.three-scene-host canvas')).toBeVisible({timeout:30000});
    const startTick = Number(await page.locator('[data-simulation-tick]').getAttribute('data-simulation-tick'));
    await expect(page.getByText('왜 옮겨야 할까요?')).toBeVisible();
    await expect(page.getByText(/웨이퍼를 담은 보호 용기/)).toBeVisible();
    await page.getByRole('button',{name:/다음 장비로 보내기/}).click();
    await expect(page.getByText('누가 옮겨 줄까요?')).toBeVisible({timeout:12000});
    await expect(page.getByText(/아직 차량은 움직이지 않았어요/)).toBeVisible({timeout:12000});
    if (await page.locator('[data-simulation-tick]').count() !== 1) throw new Error('Native engine view disappeared after first transfer request');
    const nextTick=Number(await page.locator('[data-simulation-tick]').getAttribute('data-simulation-tick'));
    if(nextTick <= startTick) throw new Error('No real Native Tick after request action');
    await page.screenshot({path:path.join(evidence, 'scene03-'+width+'.png')});
    await page.getByRole('button',{name:/SCENE 04/}).click();
    await expect(page.getByRole('heading',{name:'지금까지 본 건 공장의 극히 일부였다.'})).toBeVisible();
    await page.waitForTimeout(4500);
    await page.screenshot({path:path.join(evidence, 'scene04-'+width+'.png')});
    await page.getByRole('button',{name:/SCENE 06/}).click();
    await expect(page.getByRole('heading',{name:'누가 이 운송을 맡고, 어느 길로 갈까?'})).toBeVisible();
    await page.screenshot({path:path.join(evidence, 'scene06-'+width+'.png')});
    const renderer=await page.locator('[data-renderer="three-webgl"]').count();
    if(renderer!==1) throw new Error('Native 3D renderer unexpectedly unmounted');
    if(faults.length) throw new Error('Browser JS/console errors: '+faults.join('\n').slice(0,3000));
    console.log(JSON.stringify({viewport:[width,height],nativeTick:nextTick,renderer:'three-webgl',scenes:[3,4,6],errors:0}));
    await page.close();
  }
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox, {recursive:true,force:true});
}
