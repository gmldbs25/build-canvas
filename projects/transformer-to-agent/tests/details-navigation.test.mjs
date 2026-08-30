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
  assert.match(pageSource, /isEditing\s*\|\|\s*\(!detailsOpen\s*&&\s*isInteractive\)/);
  assert.match(pageSource, /aria-keyshortcuts="D"/);
  assert.match(pageSource, /<kbd>D<\/kbd>/);
});

test("resets the persistent Drawer scroll position when its scene changes", () => {
  assert.match(drawerSource, /scrollRef\.current\.scrollTop\s*=\s*0/);
  assert.match(drawerSource, /\[open, scene\.id\]/);
  assert.match(drawerSource, /ArrowDown:\s*48/);
  assert.match(drawerSource, /PageDown:\s*pageDistance/);
  assert.match(drawerSource, /id="scene-details"/);
  assert.match(drawerSource, /aria-hidden=\{!open\}/);
});
