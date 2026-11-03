import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = 'https://fabflow-yoon.vercel.app/';
const media = path.resolve('projects/fab-flow/public/media');
const browser = await chromium.launch({ headless:true, args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
]});
const ctx=await browser.newContext({viewport:{width:1800,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
const page=await ctx.newPage();
page.setDefaultTimeout(30000);
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text())});
try {
  console.log('POLICY_START_URL',url);
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click();
  const setup=page.getByTestId('sandbox-setup');
  await setup.waitFor();
  await page.getByRole('group',{name:'운영 프리셋'}).getByRole('button',{name:/활발한 운송/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption('small');
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill('8');
  await page.getByRole('button',{name:'실험 패널 열기'}).click();
  const settings=page.locator('.sandbox-settings');
  await settings.locator(':scope > summary').click();
  await settings.getByRole('button',{name:/고급 설정/}).click();
  const demandWindow=page.getByRole('spinbutton',{name:'수요 발생 시간 (s)'});
  await demandWindow.waitFor({state:'visible'});
  await demandWindow.fill('120');
  await demandWindow.press('Tab');
  const duration=page.getByRole('spinbutton',{name:'관찰 시간 (s)'});
  await duration.waitFor({state:'visible'});
  await duration.fill('120');
  await duration.press('Tab');
  console.log('POLICY_DURATION',await duration.inputValue());
  await setup.getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await setup.waitFor({state:'detached',timeout:30000});
  await page.locator('canvas').first().waitFor({timeout:25000});
  await page.waitForTimeout(1500);
  // The experiment drawer may be reset by the simulation handoff.
  const open=page.getByRole('button',{name:'실험 패널 열기'});
  if(await open.isVisible().catch(()=>false))await open.click();
  const policyDetails=page.locator('.policy-details');
  await policyDetails.waitFor({state:'visible'});
  if(!(await policyDetails.evaluate(e=>e.open)))await policyDetails.locator('summary').click();
  const compare=page.locator('.compare-button');
  await compare.click();
  console.log('POLICY_COMPARE_STARTED');
  await page.locator('.comparison-interpretation').waitFor({state:'visible',timeout:120000});
  console.log('POLICY_COMPARE_DONE');
  await page.locator('.policy-world-disclosure > summary').click();
  const dialog=page.getByRole('dialog',{name:/DBR · CBR 물류 현장/});
  await dialog.waitFor({state:'visible',timeout:15000});
  await dialog.locator('canvas').first().waitFor({state:'visible',timeout:30000});
  await page.waitForTimeout(1700);
  const file=path.join(media,'policy-comparison.png');
  await dialog.screenshot({path:file,scale:'device',animations:'disabled',timeout:45000});
  const b=await fs.readFile(file);
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20);
  if(b.subarray(1,4).toString()!=='PNG'||width<1800||height<700||b.length<75000)
    throw new Error('Policy screenshot quality gate failed '+width+'x'+height+' / '+b.length+' bytes');
  console.log('POLICY_CAPTURED',width+'x'+height,b.length);
  const fileManifest=path.join(media,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(fileManifest,'utf8'));
  const asset=manifest.assets.find(a=>a.id==='policy-comparison');
  if(!asset)throw new Error('Missing policy-comparison manifest entry');
  const now=new Date().toISOString();
  Object.assign(asset,{source_path:url,source_reference:'Live FAB FLOW DBR/CBR comparison computed with same scenario inputs',source_sha:null,captured_at_utc:now,
    scenario:'Small V6 / 8 OHT / active preset / comparison duration 120 simulation seconds / two identical-input policy worlds',
    viewport:{css_width:1800,css_height:1000,device_pixel_ratio:2,png_width:width,png_height:height},
    privacy_review:'Public Vercel application in an isolated unauthenticated browser',status:'live_capture'});
  manifest.capture_summary={...(manifest.capture_summary||{}),policy_comparison_updated_at_utc:now,
    updated:[...new Set([...(manifest.capture_summary?.updated||[]),'policy-comparison'])],
    not_refreshed:manifest.assets.filter(a=>a.status!=='live_capture').map(a=>a.id)};
  manifest.note='All 11 Work6 captures are real screenshots from the public FAB FLOW application, not AI-generated. Different screenshots depict different scenarios and are not matched-condition performance comparisons. Deployment SHA is not independently attested.';
  await fs.writeFile(fileManifest,JSON.stringify(manifest,null,2)+'\n');
  console.log('POLICY_DONE all 11 assets live_capture');
} catch(error){
  console.error('POLICY_FAILED',String(error?.stack||error));
  console.error('POLICY_BROWSER_ERRORS',JSON.stringify(errors.slice(-20)));
  process.exitCode=1;
} finally {
  await browser.close();
}