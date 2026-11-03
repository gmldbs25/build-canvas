import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = [
  'hero-overview.png', 'operations-analysis.png', 'fab-small.png', 'fab-medium.png',
  'fab-large.png', 'sandbox-setup.png', 'transport-loaded.png', 'trip-request.png',
  'trip-dropoff.png', 'congestion-observation.png', 'policy-comparison.png', 'fleet-high-load.png'
];
for (const name of images) {
  const info = await fs.stat(path.join(project, 'dist-pages', 'media', name));
  if (info.size < 1000) throw Error('Missing/empty production image: ' + name);
}
const motionFiles = ['hero-overview.mp4', 'hero-overview.webm', 'hero-motion-poster.jpg'];
for (const name of motionFiles) {
  const info = await fs.stat(path.join(project, 'dist-pages', 'media', name));
  if (info.size < 50000) throw Error('Missing/undersized hero motion asset: ' + name);
}
const screenshots = path.join(project, 'evidence');
await fs.mkdir(screenshots, { recursive:true });
const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-article-'));
const deployed = path.join(sandbox, 'build-canvas', 'fab-flow-preview');
await fs.mkdir(deployed, { recursive:true });
await fs.cp(path.join(project, 'dist-pages'), deployed, { recursive:true });
const server = spawn('python3', ['-m', 'http.server', '4179', '--bind', '127.0.0.1', '--directory', sandbox], {stdio:['ignore','pipe','pipe']});
const logs=[];
server.stdout.on('data', value=>logs.push(value.toString()));
server.stderr.on('data', value=>logs.push(value.toString()));
let browser;
try {
  let ready=false;
  for (let i=0;i<60;i++) {
    if(server.exitCode!==null)throw Error('Server exited: '+logs.join(''));
    try{const r=await fetch('http://127.0.0.1:4179/build-canvas/fab-flow-preview/');if(r.status===200){ready=true;break;}}catch{}
    await new Promise(r=>setTimeout(r,200));
  }
  if(!ready)throw Error('Server timeout: '+logs.join(''));
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for (const [width,height] of [[1440,900],[1366,768],[390,844],[360,740]]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const faults=[];
    page.on('pageerror',e=>faults.push('JS '+String(e)));
    page.on('response',r=>{if(r.status()>=400)faults.push('HTTP '+r.status()+' '+r.url())});
    const response=await page.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/',{waitUntil:'networkidle'});
    if(response?.status()!==200)throw Error('Page HTTP: '+response?.status());
    await expect(page.locator('html')).toHaveAttribute('lang','ko');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('section[id^="chapter-"]')).toHaveCount(11);
    await expect(page.getByRole('link',{name:/FAB FLOW 플레이하기/})).toHaveCount(2);
    await expect(page.getByRole('heading',{name:'작은 반도체 공장'})).toHaveCount(1);
    await expect(page.getByRole('heading',{name:'수백 대의 차량을 브라우저에서 움직이기까지'})).toHaveCount(1);
    if(await page.locator('canvas').count())throw Error('Legacy simulation canvas remains');
    const hero=page.locator('.hero-motion-surface video');
    await expect(hero).toBeVisible();
    const motionSources=await hero.locator('source').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')));
    if(motionSources.length!==2||motionSources.some(url=>!url?.startsWith('/build-canvas/fab-flow-preview/media/')))
      throw Error('Hero video source base mismatch: '+JSON.stringify(motionSources));
    await page.waitForFunction(()=>{
      const video=document.querySelector('.hero-motion-surface video');
      return video && video.readyState>=2 && video.videoWidth>0 && video.videoHeight>0;
    },null,{timeout:15000});
    const videoProps=await hero.evaluate(video=>({muted:video.muted,loop:video.loop,autoplay:video.autoplay,playsInline:video.playsInline,width:video.videoWidth,height:video.videoHeight}));
    if(!videoProps.muted||!videoProps.loop||!videoProps.autoplay||!videoProps.playsInline||videoProps.width<720)
      throw Error('Hero playback setup invalid: '+JSON.stringify(videoProps));
    await hero.evaluate(video=>video.play());
    await expect(page.getByRole('button',{name:'메인 영상 일시 정지'})).toBeVisible();
    await page.getByRole('button',{name:'메인 영상 일시 정지'}).click();
    await expect(hero).toHaveJSProperty('paused',true);
    await page.getByRole('button',{name:'메인 영상 재생'}).click();
    await expect(hero).toHaveJSProperty('paused',false);
    if(width===1440) {
      await page.emulateMedia({reducedMotion:'reduce'});
      await expect(hero).toHaveJSProperty('paused',true);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await expect(hero).toHaveJSProperty('paused',false);
    }
    const state=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,ctas:[...document.querySelectorAll('.play-link')].map(a=>a.getAttribute('href')),base:[...document.querySelectorAll('.article-figure img')].slice(0,3).map(i=>i.getAttribute('src'))}));
    if(state.scrollWidth>state.viewport+1)throw Error('Horizontal overflow: '+JSON.stringify({width,state}));
    if(state.ctas.some(href=>href!=='https://fabflow-yoon.vercel.app/'))throw Error('Play link mismatch: '+JSON.stringify(state.ctas));
    if(state.base.some(src=>!src?.startsWith('/build-canvas/fab-flow-preview/media/')))throw Error('Pages asset base mismatch: '+JSON.stringify(state.base));
    await page.locator('#chapter-07 details').scrollIntoViewIfNeeded();
    const disclosure=page.locator('#chapter-07 details');
    await expect(disclosure).not.toHaveAttribute('open','');
    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveAttribute('open','');
    await page.locator('#chapter-00').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(screenshots,'fab-flow-article-'+width+'.png'),fullPage:true});
    if(faults.length)throw Error('Console/network errors: '+faults.join(' | '));
    console.log('article-smoke',JSON.stringify({width,height,chapters:11,image:'ok',heroVideo:'ok',overflow:false,errors:0}));
    await page.close();
  }
  const homePage=await browser.newPage();
  await homePage.route('**/build-canvas/',route=>route.fulfill({status:200,contentType:'text/html',body:'<html lang="ko"><body>home</body></html>'}));
  await homePage.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/', { waitUntil: 'networkidle' });
  await expect(homePage.locator('.article-page')).toBeVisible();
  // Give the document (rather than a currently focused link/control) keyboard focus.
  // Work6 intentionally ignores the H shortcut when the focused target is interactive.
  await homePage.evaluate(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
  });
  const focusTag = await homePage.evaluate(() => document.activeElement?.tagName);
  if (focusTag !== 'BODY') throw Error('Home shortcut smoke could not focus document: ' + focusTag);
  await homePage.keyboard.press('h');
  await homePage.waitForURL('**/build-canvas/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  console.log('home-shortcut','ok');
  await homePage.close();
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox,{recursive:true,force:true});
}
