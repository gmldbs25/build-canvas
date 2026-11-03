import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL = process.env.FAB_FLOW_URL || 'https://fabflow-yoon.vercel.app/';
const MEDIA_DIR = path.resolve('projects/fab-flow/public/media');
const VIEWPORT = { width: 1800, height: 1000 };
const DPR = 2;
const captured = [];
const failures = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function newPage() {
  const context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: DPR,
    reducedMotion: 'reduce', colorScheme: 'light',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: /새 물류 시뮬레이션 시작/ }).first().waitFor({ timeout: 60000 });
  return page;
}
async function settle(page) {
  await page.locator('canvas').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  const size = await page.locator('canvas').first().evaluate(c => ({width:c.width,height:c.height}));
  if (size.width < 100 || size.height < 100) throw new Error('Unrendered canvas: ' + JSON.stringify(size));
}
async function save(name, page, selector, scenario) {
  await settle(page);
  const file = path.join(MEDIA_DIR, name + '.png');
  const target = selector ? page.locator(selector).first() : page;
  if (selector) await target.waitFor({ state:'visible', timeout:15000 });
  await target.screenshot({ path:file, animations:'disabled', timeout:45000, scale:'device' });
  const b=await fs.readFile(file);
  if (b.subarray(1,4).toString()!=='PNG') throw new Error(name + ': not PNG');
  const width=b.readUInt32BE(16), height=b.readUInt32BE(20);
  if (width<1800 || height<700 || b.length<50000) {
    await fs.unlink(file); throw new Error(name + ': insufficient image quality ' + width + 'x' + height + ', ' + b.length + ' bytes');
  }
  console.log('CAPTURED',name,width + 'x' + height,b.length,scenario);
  captured.push({name,scenario,width,height,bytes:b.length});
}
async function attempt(name, cb) {
  console.log('CAPTURE_START',name);
  try { await cb(); } catch(e) {
    const msg=name+': '+(e?.stack || String(e));
    console.error('CAPTURE_FAILED',msg.slice(0,1700));
    failures.push(msg);
  }
}
async function setup(layout, fleet, preset='active') {
  const page=await newPage();
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click();
  await page.getByTestId('sandbox-setup').waitFor();
  await page.getByRole('group',{name:'운영 프리셋'}).getByRole('button',{name: preset==='congested' ? /혼잡 실험/ : preset==='relaxed' ? /여유롭게 운영/ : /활발한 운송/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption(layout);
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill(String(fleet));
  await page.getByRole('combobox',{name:'MCS policy'}).selectOption('DBR');
  await settle(page);
  return page;
}
async function start(page) {
  await page.getByTestId('sandbox-setup').getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await page.getByTestId('sandbox-setup').waitFor({state:'detached',timeout:25000});
  await settle(page);
  await page.waitForTimeout(2800);
}
async function close(page) { await page.context().close().catch(()=>{}); }

await attempt('sandbox-setup',async()=>{
  const p=await setup('medium',24,'active');
  try { await save('sandbox-setup',p,'.map-column','Medium layout / setup before starting'); }
  finally { await close(p); }
});
await attempt('fab-small',async()=>{
  const p=await setup('small',8,'active');
  try { await start(p); await save('fab-small',p,'.map-card','Small V6 / 8 OHT / active preset'); }
  finally { await close(p); }
});
await attempt('fab-medium-and-operational-views',async()=>{
  const p=await setup('medium',32,'congested');
  try {
    await start(p);
    await save('fab-medium',p,'.map-card','Medium V6 / 32 OHT / congested preset');
    await save('hero-overview',p,null,'Medium V6 actual live simulator full viewport');
    await p.locator('.analysis-toggle').click();
    await p.locator('[data-analysis-panel="true"]').waitFor({state:'visible'});
    await save('operations-analysis',p,null,'Medium V6 live Operations Analysis panel');
    await p.locator('.analysis-toggle').click();
    await p.getByRole('button',{name:/실험 패널 열기/}).click();
    await p.locator('.policy-details > summary').click();
    await p.locator('.compare-button').click();
    await p.locator('.comparison-interpretation').waitFor({state:'visible',timeout:120000});
    await p.locator('.policy-world-disclosure > summary').click();
    await p.waitForTimeout(1000);
    await save('policy-comparison',p,null,'Actual DBR vs CBR computation and policy worlds');
  } finally { await close(p); }
});
await attempt('fab-large',async()=>{
  const p=await setup('large',80,'active');
  try { await start(p); await save('fab-large',p,'.map-card','Large V6 / 80 OHT / active preset'); }
  finally { await close(p); }
});
await attempt('congestion-observation',async()=>{
  const p=await setup('large',120,'congested');
  try {
    await start(p);
    await p.locator('.view-switch button').filter({hasText:'트래픽'}).click();
    await p.waitForTimeout(7000);
    await save('congestion-observation',p,'.map-card','Large V6 / 120 OHT / 1 request per second congestion observation');
  } finally { await close(p); }
});
await attempt('fleet-high-load',async()=>{
  const p=await setup('large',300,'congested');
  try { await start(p); await save('fleet-high-load',p,'.map-card','Large V6 / 300 OHT high-fleet demonstration'); }
  finally { await close(p); }
});
await attempt('tutorial-transport-stages',async()=>{
  const p=await newPage();
  try {
    await p.getByRole('button',{name:/EXPERIENCE 시작/}).click();
    await p.getByTestId('fab-experience-intro').waitFor({state:'visible'});
    await p.getByRole('button',{name:/Scene 03/}).click();
    async function nextStep() {
      const stage=await p.getByTestId('fab-experience-intro').getAttribute('data-tutorial-stage');
      await p.locator('.w6-action-row .tutorial-primary').click({timeout:60000});
      await p.waitForFunction(before=>{
        const e=document.querySelector('[data-testid="fab-experience-intro"]');
        return e && e.getAttribute('data-tutorial-stage')!==before;
      },stage,{timeout:90000});
      await p.waitForTimeout(850);
    }
    await nextStep(); // real request created
    await save('trip-request',p,'.w6-viewport','Native Experience Scene 03 / request registered');
    await nextStep(); // dispatch
    await nextStep(); // empty travel
    await nextStep(); // pickup; FOUP loaded
    await save('transport-loaded',p,'.w6-viewport','Native Experience Scene 03 / FOUP loaded');
    await nextStep(); // route
    await nextStep(); // loaded travel
    await nextStep(); // dropoff
    await save('trip-dropoff',p,'.w6-viewport','Native Experience Scene 03 / transport completed');
  } finally { await close(p); }
});

await browser.close();
const manifestFile=path.join(MEDIA_DIR,'manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
const now=new Date().toISOString();
for(const c of captured) {
  const asset=manifest.assets.find(a=>a.id===c.name);
  if (!asset) throw new Error('Unregistered Work6 asset: ' + c.name);
  asset.source_path=SOURCE_URL;
  asset.source_reference='Live application capture / GitHub Actions Chromium / high DPI';
  asset.source_sha=null;
  asset.captured_at_utc=now;
  asset.scenario=c.scenario;
  asset.viewport={css_width:VIEWPORT.width,css_height:VIEWPORT.height,device_pixel_ratio:DPR,png_width:c.width,png_height:c.height};
  asset.status='live_capture';
  asset.privacy_review='Public Vercel app; clean isolated browser profile, no account logged in';
}
manifest.note='Work6 images are direct screenshots from the actual public FAB FLOW application. Scene metadata is noted per image; captures from different runs are NOT matched-condition performance comparisons. Deployment SHA is not independently attested.';
manifest.capture_summary={source_url:SOURCE_URL,captured_at_utc:now,updated:captured.map(c=>c.name),not_refreshed:manifest.assets.filter(a=>!captured.some(c=>c.name===a.id)).map(a=>a.id)};
await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log('CAPTURE_SUMMARY',JSON.stringify({ok:captured.map(x=>x.name),failures:failures.map(x=>x.split(':')[0])}));
if(captured.length<8) throw new Error('Quality gate: only '+captured.length+' of 11 real captures succeeded; do not publish partial refresh.');
if(failures.length) console.warn('PARTIAL_REFRESH',failures.map(x=>x.slice(0,140)).join(' | '));