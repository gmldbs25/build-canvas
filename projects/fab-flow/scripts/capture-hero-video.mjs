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
  if (stat.size < 70_000 || stat.size > 12_000_000 ||
      probe.duration < 4.6 || probe.duration > 5.25 ||
      probe.width !== 1440 || probe.height !== 810 ||
      (probe.frames > 0 && probe.frames < 75)) {
    throw new Error('Video quality gate failed: ' + JSON.stringify({file, bytes: stat.size, ...probe}));
  }
  const frameHashes=command('ffmpeg', ['-hide_banner','-loglevel','error','-i',file,
    '-vf','fps=2,scale=180:100','-f','framemd5','-'])
    .split('\n').filter(line=>line.trim() && !line.startsWith('#'))
    .map(line=>line.trim().split(',').at(-1));
  if(new Set(frameHashes).size<3)throw Error('Encoded video appears static: '+file);
  return {file: path.basename(file), bytes: stat.size, ...probe,
    distinct_motion_samples:new Set(frameHashes).size,
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
  await page.getByRole('button',{name:/EXPERIENCE 시작/}).click({timeout:60000});
  const intro=page.getByTestId('fab-experience-intro');
  await intro.waitFor({state:'visible',timeout:60000});
  await intro.locator('.w6-viewport canvas').first().waitFor({state:'visible',timeout:30000});
  await page.waitForTimeout(2300); // allow the native experience camera to settle
  const moving=Number(await intro.getAttribute('data-opening-moving'));
  const nearby=Number(await intro.getAttribute('data-opening-local-moving'));
  const canvas=await intro.locator('.w6-viewport canvas').first();
  const size=await canvas.evaluate(c=>({width:c.width,height:c.height}));
  if(!Number.isFinite(moving)||moving<1||size.width<700||size.height<350)
    throw Error('Native Experience opening is not initialized: '+JSON.stringify({moving,nearby,size}));
  console.log('LIVE_RECORDING_BEGIN',JSON.stringify({experience:'Scene 01 native ambient world',moving,nearby,canvas:size}));
  const firstCanvasFrame=await canvas.screenshot({timeout:45000});
  await page.waitForTimeout(6900);
  const lastCanvasFrame=await canvas.screenshot({timeout:45000});
  const firstSha=createHash('sha256').update(firstCanvasFrame).digest('hex');
  const lastSha=createHash('sha256').update(lastCanvasFrame).digest('hex');
  console.log('LIVE_RECORDING_MOTION',JSON.stringify({firstSha,lastSha,changed:firstSha!==lastSha}));
  if(firstSha===lastSha)throw Error('3D canvas remained static: refusing to publish fake animation.');
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
  command('ffmpeg',[...common,'-c:v','libvpx-vp9','-b:v','0','-crf','28',
    '-deadline','good','-cpu-used','4','-pix_fmt','yuv420p',webm]);
  const poster=path.join(TMP,'hero-motion-poster.jpg');
  command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',mp4,'-frames:v','1','-q:v','3',poster]);
  const posterInfo=await fs.stat(poster);
  if(posterInfo.size<35_000||posterInfo.size>1_500_000)throw Error('Motion poster invalid: '+posterInfo.size);
  const videos=[await verifyVideo(mp4),await verifyVideo(webm)];
  for(const item of videos){
    await fs.copyFile(path.join(TMP,item.file),path.join(OUTPUT,item.file));
  }
  await fs.copyFile(poster,path.join(OUTPUT,'hero-motion-poster.jpg'));
  const manifestPath=path.join(OUTPUT,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  manifest.hero_motion={
    source_url:URL,
    capture_type:'actual live FAB FLOW Chromium recording, not AI-generated animation',
    captured_at_utc:new Date().toISOString(),
    application_deployment_sha:'not independently verified',
    scenario:{mode:'Experience Intro / Scene 01',layout:'Large V6 native simulation',
      fleet:32,seed:47,distribution:'hotspot',camera:'native fixed tableau',
      opening_moving_vehicles:moving,opening_local_vehicles:nearby},
    viewport:{width:VIEWPORT.width,height:VIEWPORT.height,device_pixel_ratio:1},
    clip:{seconds:TARGET_SECONDS,fps:FPS,width:1440,height:810,muted:true,loop:true},
    videos,
    poster:{file:'hero-motion-poster.jpg',bytes:posterInfo.size}
  };
  await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log('LIVE_HERO_VIDEO_SUCCESS',JSON.stringify(videos));
} finally {
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  await fs.rm(TMP,{recursive:true,force:true}).catch(()=>{});
}
