// Genuine deployed WebGL footage only. Outputs evidence, never publishes media.
// Run from repository root; ffmpeg/ffprobe and Playwright Chromium required.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out = path.resolve(process.env.GAMEPLAY_OUTPUT || 'projects/fab-flow/evidence/gameplay');
const url = process.env.FAB_FLOW_URL || 'https://fabflow-yoon.vercel.app/';
const viewport = { width: 2560, height: 1440 };
await fs.mkdir(out, { recursive: true });
const report = { source: url, capturedAt: new Date().toISOString(), viewport, published: false,
  reviewRequired: 'Inspect decoded frames and play final file. Metadata and frame differences alone do not prove OHT motion or quality.' };
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  // Fix both viewport AND recorder dimensions before creating the page. Never resize.
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
    reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const faults = [];
  page.on('pageerror', e => faults.push(String(e)));
  page.setDefaultTimeout(60000);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /새 물류 시뮬레이션 시작/ }).first().click();
  const setup = page.getByTestId('sandbox-setup');
  await setup.waitFor();
  await page.getByRole('group', { name: '운영 프리셋' }).getByRole('button', { name: /혼잡 실험/ }).click();
  await page.getByRole('combobox', { name: 'FAB layout' }).selectOption('medium');
  await page.getByRole('spinbutton', { name: '준비 OHT 수' }).fill('32');
  await page.getByRole('combobox', { name: 'MCS policy' }).selectOption('DBR');
  await setup.getByRole('button', { name: /시뮬레이션 시작하기/ }).click();
  await setup.waitFor({ state: 'detached' });
  const stage = page.locator('.map-stage[data-renderer="three-webgl"].renderer-ready');
  await stage.waitFor();
  await page.locator('.view-switch').getByRole('button', { name: '전체', exact: true }).click();
  await page.locator('.focus-toggle').click();
  await page.locator('.map-column.focus-mode').waitFor();
  await stage.locator('select[aria-label="3D 품질"]').selectOption('high');
  for (let n = 0; n < 3; n++) await stage.getByRole('button', { name: '확대', exact: true }).click();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(6000);
  async function dimensions() {
    return stage.evaluate(el => { const c = el.querySelector('canvas'); const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bufferWidth: c?.width, bufferHeight: c?.height }; });
  }
  const before = await dimensions();
  if (before.width < 2500 || before.height < 1300 || before.bufferWidth < 2500 || before.bufferHeight < 1300)
    throw Error('Native QHD canvas does not fill frame: ' + JSON.stringify(before));
  const live = page.locator('[data-testid="sandbox-demand-live"][data-simulation-time]');
  const start = Number(await live.getAttribute('data-simulation-time'));
  await page.screenshot({ path: path.join(out, 'ready.png') });
  // Capture the genuine WebGL canvas directly. Chromium page-video may retain a
  // stale 800x600 compositor surface despite correct QHD page/canvas dimensions.
  await stage.locator('canvas').evaluate(canvas => {
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
    const chunks = [];
    window.__gameplayRecording = new Promise(resolve => {
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        const bytes = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
        let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        stream.getTracks().forEach(track => track.stop());
        resolve(btoa(binary));
      };
    });
    recorder.start(1000);
    setTimeout(() => recorder.stop(), 10000);
  });
  const encoded = await page.evaluate(() => window.__gameplayRecording);
  const raw = path.join(out, 'native-canvas.webm');
  await fs.writeFile(raw, Buffer.from(encoded, 'base64'));
  report.recordingMethod = 'HTMLCanvasElement.captureStream(30) / MediaRecorder VP9 of deployed Three.js canvas';
  const end = Number(await live.getAttribute('data-simulation-time'));
  const after = await dimensions();
  await page.screenshot({ path: path.join(out, 'end.png') });
  if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('Canvas geometry changed while recording');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 6) throw Error('Native simulation did not advance sufficiently');
  if (faults.length) throw Error('Runtime errors: ' + faults.join('; '));
  await context.close();
  // Keep final 10 seconds, removing all navigation/setup/warm-up; no scaling.
  execFileSync('ffmpeg', ['-y', '-i', raw, '-an', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, 'gameplay.mp4')]);
  const clip = path.join(out, 'gameplay.mp4');
  report.metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', clip], { encoding: 'utf8' }));
  report.geometry = { before, after }; report.simulationTime = { start, end };
  report.sha256 = createHash('sha256').update(await fs.readFile(clip)).digest('hex');
  // Decode final encoded media, not the source screenshots.
  execFileSync('ffmpeg', ['-y', '-i', clip, '-vf', 'fps=1', path.join(out, 'decoded-%02d.png')]);
  execFileSync('ffmpeg', ['-y', '-i', clip, '-vf', 'fps=1,scale=640:-1,tile=5x2', '-frames:v', '1', path.join(out, 'contact.png')]);
  report.status = 'captured-awaiting-visual-review';
} catch (e) {
  report.status = 'failed'; report.error = String(e); process.exitCode = 1;
} finally {
  await browser.close();
  await fs.writeFile(path.join(out, 'capture-report.json'), JSON.stringify(report, null, 2) + '\n');
}
