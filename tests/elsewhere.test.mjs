import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mediaEntries } from "../extras/elsewhere/entries.js";

test("elsewhere cards stay data-driven and valid", () => {
  assert.ok(mediaEntries.length >= 1);
  assert.equal(new Set(mediaEntries.map((entry) => entry.id)).size, mediaEntries.length);
  for (const entry of mediaEntries) {
    assert.ok(entry.id && entry.title && entry.review && entry.image);
    assert.match(entry.image, /^https:\/\//);
  }
});

test("elsewhere is a static, isolated, mobile-first Pages route", async () => {
  const [page, stylesheet, buildFile, home] = await Promise.all([
    readFile(new URL("../extras/elsewhere/index.html", import.meta.url), "utf8"),
    readFile(new URL("../extras/elsewhere/style.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-pages.sh", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /<h1>elsewhere\.<\/h1>/);
  assert.match(page, /한 문장씩 기록하기\./);
  assert.match(page, /name="viewport"/);
  assert.match(page, /noindex/);
  assert.match(stylesheet, /grid-template-columns:\s*94px/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(buildFile, /cp -R extras\/elsewhere\/\. dist-pages\/elsewhere\//);
  assert.match(home, /href="\.\/elsewhere\//);
  const renderer = await readFile(new URL("../extras/elsewhere/main.js", import.meta.url), "utf8");
  assert.match(renderer, /frame\.className = "poster-frame"/);
  assert.doesNotMatch(renderer, /document\.createElement\("a"\)/);
  assert.doesNotMatch(stylesheet, /\.poster-link/);
  assert.doesNotMatch(home, /index:\s*["']07["']/);
});
