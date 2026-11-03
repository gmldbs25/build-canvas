import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const URL = process.env.FAB_FLOW_URL || 'https://fabflow-yoon.vercel.app/';
const OUTPUT = path.resolve('projects/fab-flow/public/media');
const EVIDENCE = path.resolve('projects/fab-flow/evidence');
const VIEWPORT = { width: 2560, height: 1440 }; // Native QHD WebGL render; no upscaling
await fs.mkdir(EVIDENCE,{recursive:true});

const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
]});
try {
  const ctx=await browser.newContext({viewport:VIEWPORT,deviceScaleFactor:1,reducedMotion:'no-preference'});
  const page=await ctx.newPage();
  page.setDefaultTimeout(30000);
  const faults=[];
  page.on('pageerror',e=>faults.push(String(e)));
  console.log('CAPTURE_SOURCE',URL);
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click();
  const setup=page.getByTestId('sandbox-setup');
  await setup.waitFor({state:'visible'});
  await page.getByRole('group',{name:'운영 프리셋'}).getByRole('button',{name:/혼잡 실험/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption('medium');
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill('32');
  await page.getByRole('combobox',{name:'MCS policy'}).selectOption('DBR');
  await setup.getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await setup.waitFor({state:'detached',timeout:30000});
  const stage=page.locator('.map-stage[data-renderer="three-webgl"].renderer-ready');
  await stage.waitFor({state:'visible',timeout:60000});
  await page.locator('.view-switch').getByRole('button',{name:'전체',exact:true}).click();
  await page.locator('.focus-toggle').click();
  await page.locator('.map-column.focus-mode').waitFor({state:'visible',timeout:15000});
  await stage.locator('select[aria-label="3D 품질"]').selectOption('high');
  const live=page.locator('[data-testid="sandbox-demand-live"][data-simulation-time]');
  await live.waitFor({state:'attached'});
  const begin=Number(await live.getAttribute('data-simulation-time'));
  await page.waitForTimeout(4500);
  const ready=await stage.evaluate(element=>{
    const canvas=element.querySelector('canvas');
    const r=element.getBoundingClientRect();
    return {renderer:element.getAttribute('data-renderer'),ready:element.classList.contains('renderer-ready'),
      canvasWidth:canvas?.width||0,canvasHeight:canvas?.height||0,
      stageWidth:Math.round(r.width),stageHeight:Math.round(r.height)};
  });
  console.log('NATIVE_RENDER',JSON.stringify(ready));
  if(!ready.ready||ready.renderer!=='three-webgl'||
    ready.canvasWidth<2500||ready.canvasHeight<1300||
    ready.stageWidth<2500||ready.stageHeight<1300)
    throw Error('Actual native QHD 3D renderer is not ready: '+JSON.stringify(ready));

  const zoomIn=stage.getByRole('button',{name:'확대',exact:true});
  for(let i=0;i<2;i++) await zoomIn.click();
  await page.mouse.move(10,10);
  await page.waitForTimeout(3100);
  const candidate=path.join(EVIDENCE,'hero-overview-zoom2-qhd.png');
  await page.screenshot({path:candidate,animations:'disabled',timeout:60000});
  console.log('CANDIDATE_ZOOM2',JSON.stringify({path:candidate,bytes:(await fs.stat(candidate)).size}));

  await zoomIn.click();
  await page.mouse.move(10,10);
  await page.waitForTimeout(3100);
  const output=path.join(OUTPUT,'hero-overview.png');
  await page.screenshot({path:output,animations:'disabled',timeout:60000});
  const buf=await fs.readFile(output);
  if(buf.subarray(1,4).toString()!=='PNG')throw Error('Actual capture is not PNG');
  const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20);
  if(width!==VIEWPORT.width||height!==VIEWPORT.height||buf.length<350000)
    throw Error('Captured image is not native QHD: '+JSON.stringify({width,height,bytes:buf.length}));

  const end=Number(await live.getAttribute('data-simulation-time'));
  const active=await page.locator('[data-testid="sandbox-demand-live"]').getAttribute('data-simulation-time');
  if(!Number.isFinite(begin)||!Number.isFinite(end)||end-begin<8)
    throw Error('Native simulator not running: '+JSON.stringify({begin,end,active}));
  if(faults.length) throw Error('3D runtime errors: '+faults.slice(0,4).join(' | '));
  const hash=createHash('sha256').update(buf).digest('hex');
  console.log('REAL_QHD_STILL_SUCCESS',JSON.stringify({
    width,height,bytes:buf.length,sha256:hash,timeStart:begin,timeEnd:end,renderer:ready.renderer,
  }));
  const manifestPath=path.join(OUTPUT,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  const next={
    id:'hero-overview',
    media_path:'media/hero-overview.png',
    source_path:URL,
    source_reference:'Native QHD Playwright screenshot of real FAB FLOW 3D full-screen renderer; not resized or AI-generated',
    source_sha:null,
    captured_at_utc:new Date().toISOString(),
    scenario:'Medium V6 / 32 OHT / congested demand / DBR / native 3D fullscreen / 3 zoom clicks',
    viewport:{css_width:VIEWPORT.width,css_height:VIEWPORT.height,
      device_pixel_ratio:1,png_width:width,png_height:height},
    screenshot_sha256:hash,
    screenshot_bytes:buf.length,
    privacy_review:'Public deployed app in isolated Chromium profile; no account data',
    status:'live_capture'
  };
  const index=manifest.assets.findIndex(x=>x.id==='hero-overview');
  if(index<0)throw Error('hero-overview asset missing in manifest');
  manifest.assets[index]=next;
  manifest.hero_motion=undefined; // old 8-second video is retired
  await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  await ctx.close();
}finally{await browser.close();}
