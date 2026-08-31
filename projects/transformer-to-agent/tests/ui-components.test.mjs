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
  assert.match(pageSource, /data-motion-paused=\{detailsOpen \|\| overviewOpen\}/);
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

test("keeps the ACT 1 second-pass learning sequence explicit", () => {
  assert.doesNotMatch(sceneSource, /우리가 매일 쓰는 Coding Agent 안에서는/);
  assert.match(sceneSource, /다음 Token 예측에서/);
  assert.match(sceneSource, /AGENT가 되기까지/);
  assert.match(sceneSource, /CURRENT INPUT \/ CONTEXT/);
  assert.match(sceneSource, /THE MODEL PREDICTS/);
  assert.match(sceneSource, /DECODING RESULT/);
  assert.match(sceneSource, /하나가 결정되면/);
  assert.match(cssSource, /workflow-connector/);
  assert.match(cssSource, /grid-template-columns:\s*minmax\(180px/);
});

test("keeps the NPE incident internally consistent", () => {
  // The stack trace points at UserMapper.java:42, so the highlighted expression must be line 42.
  assert.match(contentSource, /UserMapper\.toResponse\(UserMapper\.java:42\)/);
  assert.match(sceneSource, /<span className="code-error"><i>42<\/i>    user\.getProfile\(\)\.getDisplayName\(\)<\/span>/);
  // The canonical workflow has seven steps in both the Scene and its Details.
  assert.match(sceneSource, /"READ LOG", "SEARCH CODE", "READ FILE", "TRACE", "PATCH", "TEST", "VERIFY"/);
  assert.match(contentSource, /READ LOG\\n→ SEARCH CODE\\n→ READ FILE\\n→ TRACE\\n→ PATCH\\n→ TEST\\n→ VERIFY/);
  // Details must not quote a statement the Presentation never shows.
  assert.doesNotMatch(contentSource, /THE MODEL GENERATES TOKENS/);
  assert.match(sceneSource, /THE MODEL PREDICTS/);
});

test("frames every ACT with its own question", () => {
  for (const sceneId of ["incident", "model-input", "boundary", "result-returns", "build-agent"]) {
    assert.match(sceneSource, new RegExp(`<ActLead sceneId="${sceneId}" />`));
  }
  // The lead reads from content, so the questions are declared exactly once.
  assert.doesNotMatch(sceneSource, /ActLead act=\{/);
  for (const summary of ["ACT 1 Summary", "ACT 2 Summary", "ACT 3 Summary", "ACT 4 Summary"]) {
    assert.match(contentSource, new RegExp(summary));
  }
});

test("orients the viewer across the 22 scenes", () => {
  // Intro carries a reading guide, which also makes the Details affordance discoverable.
  assert.match(contentSource, /이 자료를 읽는 법/);
  assert.match(contentSource, /다섯 개의 질문/);
  // Overview overlay, its shortcut, and the persistent position indicators.
  assert.match(pageSource, /OverviewOverlay/);
  assert.match(pageSource, /event\.key\.toLowerCase\(\) === "o"/);
  assert.match(pageSource, /act-rail/);
  assert.match(pageSource, /\{index \+ 1\} \/ \{TOTAL_SCENES\}/);
  assert.match(cssSource, /\.overview-overlay/);
});

test("closes the loop on the incident it opened with", () => {
  // Scene 13 shows a full observable transcript, not a single tool call.
  assert.match(sceneSource, /observableWorkflow/);
  assert.match(sceneSource, /run_tests/);
  // Scene 19's recap keeps the failure-and-retry pivot that ACT 4 taught.
  assert.match(sceneSource, /TEST FAILED → CONTEXT → RETRY/);
  assert.match(cssSource, /\.retry-arc/);
});

test("keeps technical claims traceable to references", () => {
  assert.match(contentSource, /claudeTools/);
  const sceneBlocks = contentSource.split(/\n  \{\n    id: "/).slice(1);
  const withoutRefs = sceneBlocks
    .filter((block) => !block.includes("references:"))
    .map((block) => block.slice(0, block.indexOf('"')));
  assert.deepEqual(withoutRefs, ["intro", "incident", "appendix"]);
});
