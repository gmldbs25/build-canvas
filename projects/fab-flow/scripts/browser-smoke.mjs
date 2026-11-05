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
  'trip-dropoff.png', 'congestion-observation.png', 'policy-comparison.png', 'fleet-high-load.png',
  'hero-overview.webp', 'hero-overview-1280.webp', 'gameplay-overview.mp4', 'gameplay-poster.webp', ...[
    'operations-analysis', 'fab-small', 'fab-medium', 'fab-large', 'sandbox-setup',
    'transport-loaded', 'trip-request', 'trip-dropoff', 'congestion-observation',
    'policy-comparison', 'fleet-high-load'
  ].flatMap(name => [`${name}.webp`, `${name}-800.webp`, `${name}-1600.webp`])
];
for (const name of images) {
  const info = await fs.stat(path.join(project, 'dist-pages', 'media', name));
  if (info.size < 1000) throw Error('Missing/empty production image: ' + name);
}
const stillFile=await fs.readFile(path.join(project,'dist-pages','media','hero-overview.png'));
if(stillFile.subarray(1,4).toString()!=='PNG') throw Error('Hero file is not PNG');
const stillWidth=stillFile.readUInt32BE(16),stillHeight=stillFile.readUInt32BE(20);
if(stillWidth<2560||stillHeight<1440||stillFile.length<150_000)
  throw Error('Hero screenshot must be real QHD or higher: '+stillWidth+'x'+stillHeight);
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
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})});
  for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768],[768,1024],[844,390],[390,844],[360,740],[320,720]]) {
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    if(width===320)await page.route('**/gameplay-overview.mp4',route=>route.abort('failed'));
    const faults=[];
    const videoRequests=[];
    page.on('pageerror',e=>faults.push('JS '+String(e)));
    page.on('response',r=>{if(r.status()>=400)faults.push('HTTP '+r.status()+' '+r.url())});
    page.on('request',r=>{if(/gameplay-overview\.mp4(?:$|\?)/.test(r.url()))videoRequests.push(r.url())});
    const response=await page.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/',{waitUntil:'networkidle'});
    if(response?.status()!==200)throw Error('Page HTTP: '+response?.status());
    await expect(page.locator('html')).toHaveAttribute('lang','ko');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('section[id^="chapter-"]')).toHaveCount(11);
    await expect(page.getByRole('link',{name:/FAB FLOW 플레이하기/})).toHaveCount(2);
    await expect(page.getByRole('heading',{name:'작은 반도체 공장'})).toHaveCount(1);
    await expect(page.getByRole('heading',{name:'수백 대의 차량을 브라우저에서 움직이기까지'})).toHaveCount(1);
    if(await page.locator('canvas').count())throw Error('Legacy simulation canvas remains');
    const hero=page.locator('.hero-visual > img.hero-still');
    await expect(hero).toBeVisible();
    const gameplayVideo=page.locator('.gameplay-clip video');
    await expect(gameplayVideo).toHaveCount(1);
    await expect(gameplayVideo).toHaveAttribute('preload','none');
    await expect(gameplayVideo).toHaveAttribute('playsinline','');
    await expect(gameplayVideo).toHaveJSProperty('muted',true);
    await page.waitForFunction(()=>{
      const image=document.querySelector('.hero-visual > img.hero-still');
      return image && image.complete && image.naturalWidth>0 && image.naturalHeight>0;
    },null,{timeout:15000});
    if(videoRequests.length)throw Error('Gameplay video was transferred before a play request: '+videoRequests.join(', '));
    const natural=await hero.evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight,src:image.currentSrc}));
    if(!natural.src?.startsWith('http://127.0.0.1:4179/build-canvas/fab-flow-preview/media/hero-overview'))
      throw Error('Hero still source base mismatch: '+JSON.stringify(natural));
    if(await page.locator('.hero-visual video,.hero-visual canvas').count())
      throw Error('Hero video or dynamic canvas remains');
    const state=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,ctas:[...document.querySelectorAll('.play-link')].map(a=>a.getAttribute('href')),base:[...document.querySelectorAll('.article-figure img')].slice(0,3).map(i=>i.getAttribute('src'))}));
    if(state.scrollWidth>state.viewport+1)throw Error('Horizontal overflow: '+JSON.stringify({width,state}));
    if(state.ctas.some(href=>href!=='https://fabflow-yoon.vercel.app/'))throw Error('Play link mismatch: '+JSON.stringify(state.ctas));
    if(state.base.some(src=>!src?.startsWith('/build-canvas/fab-flow-preview/media/')))throw Error('Pages asset base mismatch: '+JSON.stringify(state.base));
    const ctaBox=await page.locator('.hero .play-link').boundingBox();
    if(!ctaBox || ctaBox.y+ctaBox.height>height) throw Error('Hero CTA outside first viewport at '+width);

    const endingImage = page.locator('.ending-shot img');
    await expect(endingImage).toHaveAttribute('src', /fab-large-1600\.webp/);
    const opener = page.locator('.size-figure .figure-zoom-button').first();
    await opener.scrollIntoViewIfNeeded();
    const beforeModal = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    await opener.click();
    const lightbox = page.getByRole('dialog', { name: 'FAB FLOW 실제 화면 확대' });
    await expect(lightbox).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('overflow','hidden');
    await expect(lightbox.getByRole('link', { name: /원본 열기/ })).toHaveAttribute('href', /fab-small\.png/);
    await lightbox.getByRole('button', { name: '원본 크기 보기' }).click();
    await expect(lightbox.locator('.lightbox-image-scroll')).toHaveClass(/is-actual/);
    await lightbox.getByRole('button', { name: '화면에 맞추기' }).click();
    await expect(lightbox.locator('.lightbox-image-scroll')).not.toHaveClass(/is-actual/);
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
    await expect(opener).toBeFocused();
    const afterModal = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    if (Math.abs(afterModal.x - beforeModal.x) > 1 || Math.abs(afterModal.y - beforeModal.y) > 1)
      throw Error('Lightbox did not restore page scroll: ' + JSON.stringify({ beforeModal, afterModal }));

    const diagramOpener = page.locator('#chapter-06 .ed-visual-tools button').first();
    await diagramOpener.scrollIntoViewIfNeeded();
    await diagramOpener.evaluate(el => { el.focus({ preventScroll: true }); el.click(); });
    const diagramDialog = page.getByRole('dialog', { name: 'V6 service lane과 port dock 연결 개념도. 실제 좌표를 재현하지 않습니다.' });
    await expect(diagramDialog).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    const originalDiagram = diagramDialog.locator('.diagram-viewer-scroll');
    await diagramDialog.getByRole('button', { name: '원본 크기' }).click();
    await expect(originalDiagram).toHaveClass(/is-original/);
    await diagramDialog.getByRole('button', { name: '화면에 맞추기' }).click();
    await expect(originalDiagram).toHaveClass(/is-fit/);
    const duplicateIds = await diagramDialog.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    if (duplicateIds.length) throw Error('Diagram viewer duplicated DOM ids: ' + duplicateIds.join(', '));
    await page.keyboard.press('Escape');
    await expect(diagramDialog).toBeHidden();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await expect(diagramOpener).toBeFocused();
    if (width <= 640) {
      await diagramOpener.evaluate(el => { el.focus({ preventScroll: true }); el.click(); });
      const mobileDialog = page.getByRole('dialog', { name: 'V6 service lane과 port dock 연결 개념도. 실제 좌표를 재현하지 않습니다.' });
      const mobileRegion = mobileDialog.locator('.diagram-viewer-scroll');
      await expect(mobileRegion).toHaveClass(/is-original/);
      await mobileRegion.focus();
      const scrollBefore = await mobileRegion.evaluate(el => el.scrollLeft);
      await page.keyboard.press('ArrowRight');
      const mobileScrollState = await mobileRegion.evaluate(el => ({ before:el.scrollLeft,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,childWidth:el.firstElementChild?.getBoundingClientRect().width }));
      const scrollAfter = mobileScrollState.before;
      if (scrollAfter <= scrollBefore) throw Error('ArrowRight did not scroll the original-size diagram: '+JSON.stringify(mobileScrollState));
      await page.keyboard.press('Escape');
      await expect(mobileDialog).toBeHidden();
      await expect(diagramOpener).toBeFocused();
      await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    }
    const captionPx = await page.locator('.size-figure figcaption').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    if (captionPx < 13) throw Error('Small screenshot caption font: ' + captionPx);
    if (width <= 390) {
      const timeline = await page.locator('.tick-diagram').evaluate(el => ({viewport:el.clientWidth, content:el.scrollWidth}));
      if (timeline.content <= timeline.viewport) throw Error('Mobile tick timeline must be inspectable via horizontal scroll: ' + JSON.stringify(timeline));
    }
    if(width===320){
      await gameplayVideo.evaluate(video=>video.play().catch(()=>{}));
      await expect(page.locator('.gameplay-fallback')).toBeVisible({timeout:10000});
      await expect(page.locator('.gameplay-clip video')).toHaveCount(0);
    }
    await page.locator('#chapter-07 details').first().scrollIntoViewIfNeeded();
    const disclosure=page.locator('#chapter-07 details').first();
    await expect(disclosure).not.toHaveAttribute('open','');
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('open','');
    for(const img of await page.locator('.article-figure img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty('complete',true);
      if(!await img.evaluate(el=>el.naturalWidth>0))throw Error('Article image failed to decode');
    }
    await page.locator('#chapter-00').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(screenshots,'fab-flow-article-'+width+'.png'),fullPage:true});
    if(faults.length)throw Error('Console/network errors: '+faults.join(' | '));
    console.log('article-smoke',JSON.stringify({width,height,chapters:11,image:'responsive-webp',zoom:'focus-and-scroll-restored',caption:'ok',overflow:false,errors:0}));
    await page.close();
  }
  const homePage=await browser.newPage();
  await homePage.route('**/build-canvas/',route=>route.fulfill({status:200,contentType:'text/html',body:'<html lang="ko"><body>home</body></html>'}));
  await homePage.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/', { waitUntil: 'networkidle' });
  await expect(homePage.locator('.article-page')).toBeVisible();
  await homePage.evaluate(() => {
    const input=document.createElement('input');input.setAttribute('aria-label','shortcut guard probe');document.body.append(input);input.focus();
  });
  await homePage.keyboard.press('h');
  await expect(homePage).toHaveURL(/fab-flow-preview\/$/);
  await homePage.locator('input[aria-label="shortcut guard probe"]').evaluate(el=>el.remove());
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
  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const touchVideoRequests=[];
  touch.on('request',request=>{if(/gameplay-overview\.mp4(?:$|\?)/.test(request.url()))touchVideoRequests.push(request.url())});
  await touch.goto('http://127.0.0.1:4179/build-canvas/fab-flow-preview/',{waitUntil:'networkidle'});
  await expect(touch.locator('html')).toHaveCSS('scroll-behavior','auto');
  const touchVideo=touch.locator('.gameplay-clip video');
  await expect(touchVideo).toHaveAttribute('preload','none');
  if(touchVideoRequests.length)throw Error('Mobile video transferred before interaction');
  await touchVideo.evaluate(video=>video.play());
  await touch.waitForFunction(()=>{const video=document.querySelector('.gameplay-clip video');return video && video.currentTime>0.25},null,{timeout:10000});
  if(!touchVideoRequests.length)throw Error('Mobile playback did not request the MP4');
  console.log('mobile-gameplay-playback','ok');
  await touch.locator('.hero-expand').tap();
  const dialog=touch.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'원본 크기 보기'}).tap();
  const scrollRegion=dialog.locator('.lightbox-image-scroll');
  await scrollRegion.focus();await touch.keyboard.press('h');
  await expect(touch).toHaveURL(/fab-flow-preview\/$/);
  await dialog.getByRole('button',{name:'확대 화면 닫기'}).tap();
  await expect(dialog).toBeHidden();
  await touch.close();console.log('touch-reduced-motion-shortcut-guards','ok');
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
  await fs.rm(sandbox,{recursive:true,force:true});
}
