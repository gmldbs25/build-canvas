import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);

test("Work 5 compiles a readable article with unique navigation, Human slots and local assets", async (t) => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "build-canvas-work5-"));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  const script = new URL("../projects/kotomachi/scripts/build-article.mjs", import.meta.url);
  await execFileAsync(process.execPath, [script.pathname, `--output=${outputDir}`]);

  const html = await readFile(path.join(outputDir, "index.html"), "utf8");
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description?.length > 80, "the article deck should populate its search description");
  assert.match(html, /<h1>KotoMachi를 만들며<\/h1>/);

  const sectionIds = [...html.matchAll(/<section aria-labelledby="([^"]+)"><h2 id="([^"]+)"/g)];
  const tocIds = [...html.matchAll(/<li><a href="#([^"]+)">/g)].map(([, id]) => id);
  assert.ok(sectionIds.length >= 8, "major article sections should be compiled");
  assert.deepEqual(sectionIds.map(([, labelledBy, headingId]) => [labelledBy, headingId]).every(([a, b]) => a === b), true);
  assert.equal(new Set(tocIds).size, tocIds.length, "TOC anchors should be unique");
  assert.deepEqual(tocIds, sectionIds.map(([, , headingId]) => headingId), "the TOC should map every major section in order");

  assert.ok((html.match(/class="human-note"/g) ?? []).length >= 1);
  assert.ok((html.match(/class="human-answer"/g) ?? []).length >= 1);

  const images = [...html.matchAll(/<img src="assets\/([^"]+)"/g)].map(([, name]) => name);
  assert.ok(images.length >= 1);
  for (const image of images) {
    const imageInfo = await stat(path.join(outputDir, "assets", image));
    assert.ok(imageInfo.size > 0, `${image} should be copied into the standalone article`);
    assert.ok(imageInfo.size < 220 * 1024, `${image} should stay lightweight`);
  }
});
