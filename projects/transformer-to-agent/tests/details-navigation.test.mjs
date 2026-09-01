import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const drawerSource = await readFile(new URL("../components/details-drawer.tsx", import.meta.url), "utf8");

test("keeps Details open across scenes that have content and closes it for empty scenes", () => {
  assert.match(pageSource, /\(isOpen\)\s*=>\s*isOpen\s*&&\s*Boolean\(scenes\[safeIndex\]\.details\?\.length\)/);
  assert.match(pageSource, /\(isOpen\)\s*=>\s*isOpen\s*&&\s*Boolean\(scenes\[nextIndex\]\.details\?\.length\)/);
});

test("supports a non-editing D shortcut and horizontal navigation while Details is open", () => {
  assert.match(pageSource, /event\.key\.toLowerCase\(\)\s*===\s*"d"/);
  assert.match(pageSource, /\[contenteditable\]/);
  assert.match(pageSource, /\.details-trigger, \.scene-navigation/);
  assert.match(pageSource, /isEditing\s*\|\|\s*\(!detailsOpen\s*&&\s*isInteractive\s*&&\s*!isSceneNavigationControl\)/);
  assert.match(pageSource, /aria-keyshortcuts="D"/);
  assert.match(pageSource, /<kbd>D<\/kbd>/);
});

test("scrolls the actual Details container vertically from the shared keyboard layer", () => {
  assert.match(pageSource, /const DETAIL_SCROLL_STEP = 64/);
  assert.match(pageSource, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(pageSource, /detailsScrollRef\.current\?\.scrollBy/);
  assert.match(pageSource, /event\.key === "ArrowDown" \? DETAIL_SCROLL_STEP : -DETAIL_SCROLL_STEP/);
  assert.match(pageSource, /behavior: "auto"/);
  assert.match(pageSource, /scrollRef=\{detailsScrollRef\}/);
  assert.doesNotMatch(drawerSource, /onKeyDown=/);
  assert.equal(pageSource.match(/addEventListener\("keydown"/g)?.length, 1);
});

test("prevents viewport scrolling outside editing controls and resets Details at scene boundaries", () => {
  assert.match(pageSource, /!isEditing && \(event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"\)/);
  assert.match(pageSource, /event\.preventDefault\(\);\s*if \(detailsOpen\)/);
  assert.match(drawerSource, /scrollRef\.current\.scrollTop\s*=\s*0/);
  assert.match(drawerSource, /\[open, scene\.id, scrollRef\]/);
  assert.match(drawerSource, /id="scene-details"/);
  assert.match(drawerSource, /aria-hidden=\{!open\}/);
});
