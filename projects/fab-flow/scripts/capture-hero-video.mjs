import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const URL = 'https://fabflow-yoon.vercel.app/';
const OUTPUT = path.resolve('projects/fab-flow/public/media');
const TMP = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-hero-motion-'));
const VIEWPORT = { width: 1600, height: 900 };
const FPS = 20;
const TARGET_SECONDS = 5;
const MIN_SIM_ADVANCE = 8;

function command(exe, args) {
  const result = execFileSync(exe, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 150000 });
  return String(result).trim();
}
function mediaInfo(file) {
  const raw = command('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,nb_frames,r_frame_rate:format=duration',
    '-of', 'json', file]);
  const parsed = JSON.parse(raw);
  return { duration: Number(parsed.format?.duration || 0),
    width: parsed.streams?.[0]?.width, height: parsed.streams?.[0]?.height,
    frames: Number(parsed.streams?.[0]?.nb_frames || 0) };
}
async function verifyVideo(file) {
  const stat = await fs.stat(file);
  const probe = mediaInfo(file);
  if (stat.size < 130_000 || stat.size > 12_000_000 ||
      probe.duration < 4.6 || probe.duration > 5.25 ||
      probe.width !== 1440 || probe.height !== 810 ||
      (probe.frames > 0 && probe.frames < 75)) {
    throw new Error('Video quality gate failed: ' + JSON.stringify({file, bytes: stat.size, ...probe}));
  }
  return {file: path.basename(file), bytes: stat.size, ...probe,
    sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex')};
}
let browser;
let context;
try {
  browser = await chromium.launch({headless: true, args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]});
  context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'no-preference',
    recordVideo: {dir: TMP, size: VIEWPORT}
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  console.log('LIVE_RECORDING_SOURCE', URL);
  await page.goto(URL, {waitUntil:'domcontentloaded', timeout:60000});
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click();
  await page.getByTestId('sandbox-setup').waitFor();
  await page.getByRole('group',{name:'운영 프리셋'})
    .getByRole('button',{name:/활발한 운송/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption('medium');
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill('32');
  await page.getByRole('combobox',{name:'MCS policy'}).selectOption('DBR');
  await page.getByTestId('sandbox-setup').getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await page.getByTestId('sandbox-setup').waitFor({state:'detached',timeout:30000});
  await page.locator('canvas').first().waitFor({state:'visible',timeout:30000});
  await page.locator('.view-switch').getByRole('button',{name:'전체',exact:true}).click();
  await page.waitForTimeout(4300); // camera has completed its overview transition

  const hud=page.getByTestId('sandbox-hud-kpis');
  const begin=Number(await hud.getAttribute('data-simulation-time'));
  const canvas=await page.locator('canvas').first().evaluate(c=>({width:c.width,height:c.height}));
  if(!Number.isFinite(begin)||canvas.width < 700||canvas.height < 350)
    throw Error('Live simulation not initialized: '+JSON.stringify({begin,canvas}));
  console.log('LIVE_RECORDING_BEGIN',JSON.stringify({begin,canvas,layout:'medium',fleet:32,policy:'DBR',preset:'active'}));
  await page.waitForTimeout(6700);
  const end=Number(await hud.getAttribute('data-simulation-time'));
  console.log('LIVE_RECORDING_END',JSON.stringify({end,simulationAdvance:end-begin}));
  if (!Number.isFinite(end)||end-begin < MIN_SIM_ADVANCE)
    throw Error('Real simulator did not advance enough while video was recorded.');
  if (pageErrors.length) throw Error('Browser errors: '+pageErrors.slice(0,5).join(' | '));

  const raw=await page.video().path();
  await context.close();
  context=null;
  const rawInfo=mediaInfo(raw);
  console.log('RAW_RECORDING',JSON.stringify({...rawInfo,bytes:(await fs.stat(raw)).size}));
  if(rawInfo.duration < 5.3 || rawInfo.width < 1000 || rawInfo.height < 500)
    throw Error('Raw Playwright recording is incomplete: '+JSON.stringify(rawInfo));

  const cut=(rawInfo.duration-TARGET_SECONDS-0.08).toFixed(3);
  const common=['-hide_banner','-loglevel','error','-y','-i',raw,'-ss',cut,'-t',String(TARGET_SECONDS),
    '-vf','fps='+FPS+',scale=1440:810:flags=lanczos','-an','-map_metadata','-1'];
  const mp4=path.join(TMP,'hero-overview.mp4');
  const webm=path.join(TMP,'hero-overview.webm');
  command('ffmpeg',[...common,'-c:v','libx264','-preset','medium','-crf','22',
    '-pix_fmt','yuv420p','-movflags','+faststart',mp4]);
  command('ffmpeg',[...common,'-c:v','libvpx-vp9','-b:v','0','-crf','34',
    '-deadline','good','-cpu-used','4','-pix_fmt','yuv420p',webm]);
  const videos=[await verifyVideo(mp4),await verifyVideo(webm)];
  for(const item of videos){
    await fs.copyFile(path.join(TMP,item.file),path.join(OUTPUT,item.file));
  }
  const manifestPath=path.join(OUTPUT,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  manifest.hero_motion={
    source_url:URL,
    capture_type:'actual live FAB FLOW Chromium recording, not AI-generated animation',
    captured_at_utc:new Date().toISOString(),
    application_deployment_sha:'not independently verified',
    scenario:{layout:'Medium V6',fleet:32,policy:'DBR',demand_preset:'active',
      camera:'overview',simulation_time_start:begin,simulation_time_end:end},
    viewport:{width:VIEWPORT.width,height:VIEWPORT.height,device_pixel_ratio:1},
    clip:{seconds:TARGET_SECONDS,fps:FPS,width:1440,height:810,muted:true,loop:true},
    videos
  };
  await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log('LIVE_HERO_VIDEO_SUCCESS',JSON.stringify(videos));
} finally {
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  await fs.rm(TMP,{recursive:true,force:true}).catch(()=>{});
}
