// Read-only review of the public deployed Work6 route after Pages succeeds.
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const out = 'projects/fab-flow/evidence/live-pages';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const report = { url: 'https://gmldbs25.github.io/build-canvas/fab-flow-preview/', checkedAt: new Date().toISOString(), results: [] };
try {
  for (const [width, height] of [[1440,900],[390,844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    const videoRequests = [];
    page.on('request', r => { if (r.url().endsWith('.mp4')) videoRequests.push(r.url()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(report.url, { waitUntil: 'networkidle' });
    await expect(page.locator('section[id^="chapter-"]')).toHaveCount(11);
    await expect(page.locator('.hero-still')).toBeVisible();
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('.ed-visual-tools button').first()).toBeAttached();
    const clip = page.locator('.gameplay-clip video');
    await expect(clip).toHaveAttribute('preload', 'none');
    expect(videoRequests).toHaveLength(0);
    await clip.scrollIntoViewIfNeeded();
    await clip.evaluate(v => v.play());
    await page.waitForFunction(() => document.querySelector('.gameplay-clip video')?.currentTime > 1);
    await clip.evaluate(v => v.pause());
    await page.screenshot({ path: `${out}/gameplay-${width}.png` });
    await page.locator('#chapter-07').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/architecture-${width}.png` });
    await page.locator('#chapter-00').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/hero-${width}.png` });
    if (errors.length) throw Error(errors.join('; '));
    report.results.push({width,height,chapters:11,images:'decoded',gameplay:'played-after-user-intent',initialVideoRequests:0,overflow:false,errors});
    await page.close();
  }
} catch (e) { report.error = String(e); process.exitCode = 1; }
finally { await browser.close(); await fs.writeFile(`${out}/report.json`, JSON.stringify(report,null,2)+'\n'); }
