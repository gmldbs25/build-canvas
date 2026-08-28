import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("keeps the six-page narrative and URL state contract", () => {
  for (const pageId of [
    "opening",
    "prologue",
    "core-question",
    "classification-language",
    "next-token",
    "appendix",
  ]) {
    assert.match(pageSource, new RegExp(`id: "${pageId}"`));
  }

  assert.match(pageSource, /searchParams\.set\("mode"/);
  assert.match(pageSource, /searchParams\.set\("page"/);
  assert.match(pageSource, /searchParams\.set\("beat"/);
});

test("routes toggle arrow keys to Page and Beat navigation", () => {
  assert.match(pageSource, /event\.key === "ArrowLeft"/);
  assert.match(pageSource, /event\.key === "ArrowRight"/);
  assert.match(pageSource, /onPrevious\(\)/);
  assert.match(pageSource, /onNext\(\)/);
});

test("preserves Korean word boundaries and static appendix assets", async () => {
  assert.match(cssSource, /word-break:\s*keep-all/);
  assert.match(pageSource, /currentPage\.id !== "appendix"/);

  await Promise.all([
    access(new URL("../public/agent-runtime-handoff.webp", import.meta.url)),
    access(new URL("../public/agent-runtime-handoff-appendix.webp", import.meta.url)),
    access(new URL("../public/orca-classification.webp", import.meta.url)),
  ]);
});
