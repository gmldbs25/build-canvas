import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1800,height:1000},deviceScaleFactor:2});
const page=await ctx.newPage();
page.setDefaultTimeout(30000);
page.on('pageerror',error=>console.error('PAGE_ERROR',String(error).slice(0,500)));
try {
  await page.goto('https://fabflow-yoon.vercel.app/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click({timeout:60000});
  await page.getByTestId('sandbox-setup').waitFor();
  await page.getByRole('group',{name:'운영 프리셋'}).getByRole('button',{name:/활발한 운송/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption('small');
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill('8');
  await page.getByTestId('sandbox-setup').getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await page.getByTestId('sandbox-setup').waitFor({state:'detached'});
  await page.getByRole('button',{name:/실험 패널 열기/}).click();
  const settings=page.locator('.sandbox-settings');
  await settings.locator('summary').first().click();
  await settings.getByRole('button',{name:/고급 설정/}).click();
  const changeField=async (name,value)=>{
    const input=settings.locator('label.field').filter({hasText:name}).locator('input').first();
    await input.fill(value);
    await input.press('Tab');
    await page.waitForTimeout(900);
    console.log('SETTING_UPDATED',name,value,'setupVisible',await page.getByTestId('sandbox-setup').isVisible());
  };
  await changeField('수요 발생 시간 (s)','120');
  await changeField('관찰 시간 (s)','120');
  if(await page.getByTestId('sandbox-setup').isVisible()) {
    await page.getByTestId('sandbox-setup').getByRole('button',{name:/시뮬레이션 시작하기/}).click();
    await page.getByTestId('sandbox-setup').waitFor({state:'detached'});
  }
  if(!await page.locator('.policy-details').isVisible()) await page.getByRole('button',{name:/실험 패널 열기/}).click();
  const policy=page.locator('.policy-details');
  if((await policy.getAttribute('open')) === null) await policy.locator('summary').click();
  console.log('POLICY_START',await page.locator('.sandbox-settings').innerText().then(x=>x.slice(0,500)).catch(()=>'unavailable'));
  await page.locator('.compare-button').click();
  await page.locator('.comparison-interpretation').waitFor({state:'visible',timeout:120000});
  console.log('POLICY_COMPARISON_READY');
  const world=page.locator('.policy-world-disclosure > summary');
  if(await world.count()) {
    await world.click();
    await page.waitForTimeout(1400);
  } else {
    console.log('WORLD_DISCLOSURE_ABSENT; screenshot actual KPI comparison card');
  }
  const file=path.resolve('projects/fab-flow/public/media/policy-comparison.png');
  await page.screenshot({path:file,fullPage:false,scale:'device',animations:'disabled'});
  const b=await fs.readFile(file);
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20);
  if(width<3000||height<1500||b.length<50000)throw new Error('Invalid capture '+width+'x'+height+' bytes='+b.length);
  console.log('POLICY_CAPTURED',width,height,b.length);
  const manifestFile=path.resolve('projects/fab-flow/public/media/manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
  const asset=manifest.assets.find(x=>x.id==='policy-comparison');
  const now=new Date().toISOString();
  asset.source_path='https://fabflow-yoon.vercel.app/';
  asset.source_reference='Live application / matched DBR-CBR small experiment / high-DPI Chromium';
  asset.source_sha=null;
  asset.captured_at_utc=now;
  asset.scenario='Small V6 / 8 OHT / active preset / matched DBR vs CBR / observation 120 seconds';
  asset.viewport={css_width:1800,css_height:1000,device_pixel_ratio:2,png_width:width,png_height:height};
  asset.status='live_capture';
  asset.privacy_review='Public Vercel app; clean isolated browser profile';
  manifest.capture_summary.updated=[...new Set([...(manifest.capture_summary.updated||[]),'policy-comparison'])];
  manifest.capture_summary.not_refreshed=manifest.assets.filter(x=>x.status!=='live_capture').map(x=>x.id);
  await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
} finally {
  await browser.close();
}