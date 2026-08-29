import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const contentSource = await readFile(new URL("../content/pages.ts", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("keeps the fifteen-page narrative and URL state contract", () => {
  for (const pageId of [
    "boundary", "learning", "probability", "generation", "context", "attention", "transformer", "scale", "runtime", "tool", "execution", "result", "loop", "harness", "incident",
  ]) {
    assert.match(contentSource, new RegExp(`id:"${pageId}"`));
  }

  assert.match(pageSource, /searchParams\.set\("mode"/);
  assert.match(pageSource, /searchParams\.set\("page"/);
});

test("routes toggle arrow keys to page navigation", () => {
  assert.match(pageSource, /event\.key === "ArrowLeft"/);
  assert.match(pageSource, /event\.key === "ArrowRight"/);
  assert.match(pageSource, /navigate\(index - 1\)/);
  assert.match(pageSource, /navigate\(index \+ 1\)/);
});

test("preserves Korean word boundaries and static appendix assets", async () => {
  assert.match(cssSource, /word-break:\s*keep-all/);
  assert.match(pageSource, /isAppendix/);

  await Promise.all([
    access(new URL("../public/agent-runtime-handoff.webp", import.meta.url)),
    access(new URL("../public/agent-runtime-handoff-appendix.webp", import.meta.url)),
    access(new URL("../public/dog-classification.webp", import.meta.url)),
  ]);
});
