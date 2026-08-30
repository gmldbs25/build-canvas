import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const contentSource = await readFile(new URL("../content/pages.ts", import.meta.url), "utf8");
const sceneSource = await readFile(new URL("../components/scene.tsx", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("keeps the complete 22-screen narrative", () => {
  for (const sceneId of [
    "intro", "incident", "strip", "next-token", "generation", "model-input", "attention",
    "repository-context", "boundary", "execution-layer", "requests-executes", "result-returns",
    "agent-loop", "follow-npe", "failure-context", "stop", "build-agent", "different-agent",
    "developer-questions", "incident-return", "synthesis", "appendix",
  ]) {
    assert.match(contentSource, new RegExp(`id: "${sceneId}"`));
    assert.match(sceneSource, new RegExp(`case "${sceneId}"`));
  }
  assert.match(contentSource, /TOTAL_SCENES = scenes\.length/);
});

test("supports keyboard navigation, Details pause, and overlay semantics", () => {
  assert.match(pageSource, /event\.key === "ArrowLeft"/);
  assert.match(pageSource, /event\.key === "ArrowRight"/);
  assert.match(pageSource, /data-motion-paused=\{detailsOpen\}/);
  assert.match(pageSource, /DetailsDrawer/);
  assert.match(cssSource, /details-drawer/);
  assert.match(cssSource, /height:\s*100svh/);
});

test("implements the two required state comparisons and approved artwork", async () => {
  assert.match(sceneSource, /FAIL/);
  assert.match(sceneSource, /PASS/);
  assert.match(sceneSource, /MINIMAL/);
  assert.match(sceneSource, /FULL/);
  assert.match(sceneSource, /AgentArtwork/);

  await Promise.all([
    access(new URL("../public/agent-runtime-handoff.webp", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
  ]);
});
