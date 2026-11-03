import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const SOURCE_URL = 'https://fabflow-yoon.vercel.app/';
const OUTPUT = path.resolve('projects/fab-flow/public/media');
const TMP = await fs.mkdtemp(path.join(os.tmpdir(), 'work6-hero-1080p-'));
const VIEWPORT = { width: 2560, height: 1440 };
const VIDEO = { width: 1920, height: 1080, fps: 30, seconds: 5 };
const MIN_SIM_ADVANCE = 8;

function command(program, args) {
  return String(execFileSync(program, args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000
  })).trim();
}
function mediaInfo(file) {
  const raw = command('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,nb_frames,r_frame_rate:format=duration',
    '-of', 'json', file]);
  const parsed = JSON.parse(raw);
  return {
    duration: Number(parsed.format?.duration ?? 0),
    width: parsed.streams?.[0]?.width,
    height: parsed.streams?.[0]?.height,
    frames: Number(parsed.streams?.[0]?.nb_frames ?? 0)
  };
}
async function verifyVideo(file) {
  const stat = await fs.stat(file), probe = mediaInfo(file);
  if (stat.size < 100_000 || stat.size > 25_000_000 ||
      probe.duration < 4.65 || probe.duration > 5.30 ||
      probe.width !== VIDEO.width || probe.height !== VIDEO.height ||
      (probe.frames && probe.frames < 110)) {
    throw Error('Final encode quality gate failed: '+JSON.stringify({
      file,bytes:stat.size,...probe
    }));
  }
  const hashes = command('ffmpeg', ['-hide_banner','-loglevel','error','-i',file,
    '-vf','fps=2,scale=240:135','-f','framemd5','-'])
    .split('\n').filter(line=>line.trim()&&!line.startsWith('#'))
    .map(line=>line.trim().split(',').at(-1));
  if (new Set(hashes).size < 5)
    throw Error('Encoded video does not contain enough real motion: '+file);
  return {
    file:path.basename(file), bytes:stat.size, ...probe,
    distinct_motion_samples:new Set(hashes).size,
    sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')
  };
}
let browser,context;
try {
  browser=await chromium.launch({
    headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
      '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  });
  context=await browser.newContext({
    viewport:VIEWPORT,deviceScaleFactor:1,reducedMotion:'no-preference',
    recordVideo:{dir:TMP,size:VIEWPORT}
  });
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  console.log('LIVE_RECORDING_SOURCE',SOURCE_URL);
  await page.goto(SOURCE_URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:/새 물류 시뮬레이션 시작/}).first().click();
  const setup=page.getByTestId('sandbox-setup');
  await setup.waitFor({state:'visible'});
  await page.getByRole('group',{name:'운영 프리셋'})
    .getByRole('button',{name:/혼잡 실험/}).click();
  await page.getByRole('combobox',{name:'FAB layout'}).selectOption('medium');
  await page.getByRole('spinbutton',{name:'준비 OHT 수'}).fill('32');
  await page.getByRole('combobox',{name:'MCS policy'}).selectOption('DBR');
  await setup.getByRole('button',{name:/시뮬레이션 시작하기/}).click();
  await setup.waitFor({state:'detached',timeout:30000});
  const canvas=page.locator('.map-card canvas').first();
  await canvas.waitFor({state:'visible',timeout:30000});
  const live=page.locator('[data-testid="sandbox-demand-live"][data-simulation-time]');
  await live.waitFor({state:'attached'});
  // Keep the original full-map perspective and avoid automatic camera-follow.
  await page.locator('.view-switch').getByRole('button',{name:'전체',exact:true}).click();
  await page.waitForTimeout(5500);
  const begin=Number(await live.getAttribute('data-simulation-time'));
  const firstCanvas=await canvas.screenshot({timeout:60000});
  const size=await canvas.evaluate(c=>({width:c.width,height:c.height}));
  const firstSHA=createHash('sha256').update(firstCanvas).digest('hex');
  console.log('LIVE_RECORDING_BEGIN',JSON.stringify({
    time:begin,canvas:size,layout:'medium',fleet:32,
    demand:'congested',policy:'DBR',viewport:VIEWPORT
  }));
  if (!Number.isFinite(begin)||size.width<1400||size.height<550)
    throw Error('Simulator not ready for high-resolution capture.');

  await page.waitForTimeout(6200);
  const end=Number(await live.getAttribute('data-simulation-time'));
  const lastCanvas=await canvas.screenshot({timeout:60000});
  const lastSHA=createHash('sha256').update(lastCanvas).digest('hex');
  console.log('LIVE_RECORDING_END',JSON.stringify({
    time:end,advance:end-begin,motion:firstSHA!==lastSHA
  }));
  if(!Number.isFinite(end)||end-begin<MIN_SIM_ADVANCE||firstSHA===lastSHA)
    throw Error('Motion validation failed; no static or stalled video may be published.');
  if(errors.length)throw Error('Runtime error: '+errors.slice(0,5).join(' | '));

  const raw=await page.video().path();
  await context.close();
  context=null;
  const rawInfo=mediaInfo(raw);
  console.log('RAW_RECORDING',JSON.stringify({
    ...rawInfo,bytes:(await fs.stat(raw)).size
  }));
  if(rawInfo.duration < 5.4 || rawInfo.width !== VIEWPORT.width ||
      rawInfo.height !== VIEWPORT.height)
    throw Error('Invalid source recording: '+JSON.stringify(rawInfo));

  const cut=Math.max(0,rawInfo.duration-VIDEO.seconds-0.12).toFixed(3);
  const common=['-hide_banner','-loglevel','error','-y','-i',raw,
    '-ss',cut,'-t',String(VIDEO.seconds),
    '-vf','fps='+VIDEO.fps+',scale='+VIDEO.width+':'+VIDEO.height+':flags=lanczos',
    '-an','-map_metadata','-1'];
  const mp4=path.join(TMP,'hero-overview.mp4');
  const webm=path.join(TMP,'hero-overview.webm');
  command('ffmpeg',[...common,'-c:v','libx264','-preset','slow','-crf','15',
    '-pix_fmt','yuv420p','-movflags','+faststart',mp4]);
  command('ffmpeg',[...common,'-c:v','libvpx-vp9','-b:v','0','-crf','19',
    '-deadline','good','-cpu-used','3','-pix_fmt','yuv420p',webm]);

  const poster=path.join(TMP,'hero-motion-poster.jpg');
  command('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',mp4,
    '-frames:v','1','-q:v','2',poster]);
  const posterInfo=await fs.stat(poster);
  if(posterInfo.size<40_000||posterInfo.size>2_500_000)
    throw Error('Invalid first-frame poster: '+posterInfo.size);
  const videos=[await verifyVideo(mp4),await verifyVideo(webm)];
  for(const asset of videos)
    await fs.copyFile(path.join(TMP,asset.file),path.join(OUTPUT,asset.file));
  await fs.copyFile(poster,path.join(OUTPUT,'hero-motion-poster.jpg'));

  const manifestPath=path.join(OUTPUT,'manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  manifest.hero_motion={
    source_url:SOURCE_URL,
    capture_type:'real-time screen recording of public FAB FLOW native simulator (not a GIF or AI animation)',
    captured_at_utc:new Date().toISOString(),
    application_deployment_sha:'not independently verified',
    scenario:{mode:'Sandbox',layout:'Medium V6',fleet:32,
      policy:'DBR',demand_preset:'congested',camera:'full FAB overview',
      simulation_time_begin:begin,simulation_time_end:end},
    viewport:{...VIEWPORT,device_pixel_ratio:1,source_canvas:size},
    clip:{seconds:VIDEO.seconds,fps:VIDEO.fps,width:VIDEO.width,
      height:VIDEO.height,muted:true,loop:true,encoding:'high quality'},
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
