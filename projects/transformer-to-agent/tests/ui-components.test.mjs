import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const contentSource = await readFile(new URL("../content/pages.ts", import.meta.url), "utf8");
const sceneSource = await readFile(new URL("../components/scene.tsx", import.meta.url), "utf8");
const artworkSource = await readFile(new URL("../components/artwork.tsx", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const sceneIds = [
  "intro", "incident", "focus-llm", "next-token", "generation", "context-growth",
  "evidence-context", "access-context", "model-requests", "execution-acts",
  "result-context", "one-pass", "agent-loop", "npe-run", "patch-revise",
  "task-complete", "agent-system", "conclusion", "appendix",
];

function functionBlock(name, nextName) {
  const start = sceneSource.indexOf(`function ${name}`);
  const end = nextName ? sceneSource.indexOf(`function ${nextName}`, start + 1) : sceneSource.length;
  assert.notEqual(start, -1, `${name} is missing`);
  return sceneSource.slice(start, end === -1 ? sceneSource.length : end);
}

test("keeps one canonical 19-screen sequence", () => {
  for (const sceneId of sceneIds) {
    assert.match(contentSource, new RegExp(`id: "${sceneId}"`));
    assert.match(sceneSource, new RegExp(`case "${sceneId}"`));
  }
  assert.equal((contentSource.match(/\bid: "/g) ?? []).length, 19);
  assert.match(contentSource, /TOTAL_SCENES = scenes\.length/);
  assert.match(contentSource, /number: "16"[\s\S]*number: "19"[\s\S]*number: "A1"/);
  assert.doesNotMatch(contentSource, /number: "17"|number: "18"|number: "20"/);
  assert.doesNotMatch(sceneSource, /different-agent|developer-questions|incident-return|synthesis/);
  assert.doesNotMatch(cssSource, /scene-different-agent|scene-developer-questions|scene-incident-return|scene-synthesis/);
});

test("locks the minimal Scene 00 intro and scene-specific composition", () => {
  const intro = functionBlock("IntroScene", "IncidentScene");
  assert.match(intro, /WORK 03 · BUILD CANVAS/);
  assert.match(intro, /LLM <span>to<\/span><br \/>AGENT/);
  assert.match(intro, /다음 Token 예측에서<br \/>AGENT가 되기까지/);
  assert.doesNotMatch(intro, /Coding Agent가 되기까지|다음 Token 예측 Model은 어떻게|intro-question/);
  assert.doesNotMatch(sceneSource, /scene-flow|scene-footer|scene-focus-flow|scene-split-flow/);
  assert.doesNotMatch(cssSource, /\.scene-flow|\.scene-focus-flow|\.scene-split-flow/);
});

test("preserves keyboard navigation, Details scrolling, Overview, and Home", () => {
  assert.match(pageSource, /event\.key === "ArrowLeft"/);
  assert.match(pageSource, /event\.key === "ArrowRight"/);
  assert.match(pageSource, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(pageSource, /event\.key\.toLowerCase\(\) === "d"/);
  assert.match(pageSource, /event\.key\.toLowerCase\(\) === "o"/);
  assert.match(pageSource, /event\.key\.toLowerCase\(\) === "h"/);
  assert.match(pageSource, /data-motion-paused=\{detailsOpen \|\| overviewOpen\}/);
  assert.match(pageSource, /motionPaused=\{detailsOpen \|\| overviewOpen\}/);
  assert.match(pageSource, /\{index \+ 1\} \/ \{TOTAL_SCENES\}/);
});

test("implements the required causal Presentation sequence", () => {
  assert.match(sceneSource, /"READ LOG", "SEARCH CODE", "READ FILE", "TRACE", "PATCH", "TEST", "VERIFY"/);
  assert.match(sceneSource, /NullPointerException/);
  assert.match(sceneSource, /UserMapper\.java:42/);
  assert.match(sceneSource, /NEXT FOCUS → LLM/);

  assert.match(sceneSource, /LLM은 실제로/);
  assert.match(sceneSource, /NEXT TOKEN \?/);
  assert.match(sceneSource, /VOCABULARY LOGITS/);
  assert.match(sceneSource, /SOFTMAX →/);
  assert.match(sceneSource, /\["Exception", "8\.7", "72%"\]/);
  assert.match(sceneSource, /ONE TOKEN GENERATED/);
  assert.match(sceneSource, /PREDICT → APPEND/);
  assert.match(sceneSource, /PREDICT → APPEND → REPEAT/);

  const contextGrowth = functionBlock("ContextGrowthScene", "EvidenceContextScene");
  assert.doesNotMatch(contextGrowth, /read_file|grep|shell|Tool Schema|JSON Tool Call/);
  assert.match(contextGrowth, /MODEL CONTEXT #1/);
  assert.match(contextGrowth, /MODEL CONTEXT #2/);

  const modelRequests = functionBlock("ModelRequestsScene", "ExecutionActsScene");
  assert.match(modelRequests, /NEED SOURCE/);
  assert.match(modelRequests, /REQUEST 수신 · 아직 실행 전/);
  assert.doesNotMatch(modelRequests, /TOOL RESULT/);

  const resultContext = functionBlock("ResultContextScene", "OnePassScene");
  assert.match(resultContext, /FILTER.*SELECT.*SUMMARIZE.*COMPRESS/s);
  assert.match(resultContext, /MODEL 실행 전/);

  const onePass = functionBlock("OnePassScene", "AgentLoopScene");
  assert.match(onePass, /그다음은\?/);
  assert.doesNotMatch(onePass, /DECIDE → ACT → OBSERVE → UPDATE → DECIDE AGAIN/);
  assert.match(sceneSource, /DECIDE → ACT → OBSERVE → UPDATE → DECIDE AGAIN/);
});

test("enforces NPE reveal timing and observable reasoning labels", () => {
  const beforeNpeIterations = sceneSource.slice(0, sceneSource.indexOf("const npeIterations"));
  const beforeScene14 = sceneSource.slice(0, sceneSource.indexOf("function PatchCode"));
  assert.doesNotMatch(beforeNpeIterations, /profile == null/);
  assert.doesNotMatch(beforeScene14, /Unknown/);
  assert.match(sceneSource, /profile == null이 원인일 가능성이 높다/);
  assert.match(sceneSource, /expected: <b>&quot;Unknown&quot;<\/b>/);
  assert.match(sceneSource, /OBSERVATION/);
  assert.match(sceneSource, /CURRENT ASSESSMENT/);
  assert.match(sceneSource, /WORKING HYPOTHESIS/);
  assert.match(sceneSource, /NEXT ACTION/);
  assert.doesNotMatch(sceneSource, /CHAIN[- ]OF[- ]THOUGHT|hidden chain/i);
});

test("keeps Scene 16 integration and Scene 19 conclusion distinct", () => {
  const system = functionBlock("AgentSystemScene", "ConclusionScene");
  const conclusion = functionBlock("ConclusionScene", "AppendixScene");
  assert.match(sceneSource, /"CONTROL", "허용된 행동의 범위"/);
  assert.match(sceneSource, /"VALIDATION", "Result가 올바른지 검증"/);
  assert.match(system, /구성 요소가/);
  assert.match(conclusion, /The model predicts\./);
  assert.match(conclusion, /The system turns predictions into actions\./);
  assert.doesNotMatch(conclusion, /NullPointerException|UserMapper|Patch|TESTS|UserService|NPE/);
});

test("applies Korean-first Presentation copy while preserving technical theses", () => {
  for (const copy of [
    "LLM은 실제로", "다음 Token은 어떻게", "작업이 진행되며", "그럼 코드는 어떻게",
    "필요한 행동은", "실제 실행은", "첫 출력이", "이 반복이",
    "실제 NPE를 Agent Loop로", "실패가 다음", "검증이 끝나면",
  ]) {
    assert.match(sceneSource, new RegExp(copy));
  }
  for (const oldCopy of [
    "WHAT DOES THE LLM", "HOW THE NEXT TOKEN", "CONTEXT GROWS", "HOW DOES THE CODE GET IN",
    "THE MODEL REQUESTS", "THE EXECUTION LAYER", "WHAT IF THE FIRST OUTPUT", "TASK COMPLETE<br",
  ]) {
    assert.doesNotMatch(sceneSource, new RegExp(oldCopy));
  }
  assert.match(sceneSource, /ACCESS <em>≠<\/em> CONTEXT/);
  assert.match(sceneSource, /REQUEST <em>≠<\/em> EXECUTION/);
  assert.match(sceneSource, /MODEL CONTEXT ≠ ENTIRE AGENT STATE/);
  assert.match(sceneSource, /The model predicts\./);
  assert.match(sceneSource, /The system turns predictions into actions\./);
  assert.match(contentSource, /"03": "다음 Token은 어떻게 결정될까\?"/);
  assert.match(contentSource, /title: presentationTitles\[meta\.number\]/);
});

test("uses a complete uncropped A1 artwork without competing copy", async () => {
  await Promise.all([
    access(new URL("../public/agent-runtime-handoff-full.png", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
  ]);
  assert.match(artworkSource, /agent-runtime-handoff-full\.png/);
  assert.match(cssSource, /\.scene-appendix \.agent-artwork img[\s\S]*object-fit: contain/);
  const appendix = functionBlock("AppendixScene", "Scene");
  assert.match(appendix, /<AgentArtwork variant="appendix" \/>/);
  assert.doesNotMatch(appendix, /처음에는 질문|APPENDIX · A1|<h2>/);
  assert.match(contentSource, /number: "A1"[\s\S]*hideCaption: true/);
});

test("uses finite explanatory motion and a stable reduced-motion frame", () => {
  assert.doesNotMatch(cssSource, /\binfinite\b/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /\.npe-state-3 \{ opacity: 1 !important; \}/);
  assert.match(cssSource, /\.conclusion-dim, \.conclusion-thesis \{ opacity: 1 !important/);
});

test("keeps heading and visual zones structurally separated", () => {
  for (const [name, nextName] of [
    ["NextTokenScene", "GenerationScene"],
    ["ContextGrowthScene", "EvidenceContextScene"],
    ["EvidenceContextScene", "AccessContextScene"],
    ["NpeRunScene", "PatchCode"],
    ["PatchReviseScene", "TaskCompleteScene"],
    ["TaskCompleteScene", "AgentSystemScene"],
  ]) {
    const scene = functionBlock(name, nextName);
    assert.match(scene, /scene-safe-stack/);
    assert.match(scene, /header-safe-stage/);
  }

  assert.match(cssSource, /\.scene-safe-stack \{[^}]*grid-template-rows: max-content minmax\(0, 1fr\)/);
  assert.match(cssSource, /--scene-header-gap: clamp\(32px, 4vh, 44px\)/);
});

test("removes redundant request and result-path ornaments", () => {
  assert.doesNotMatch(sceneSource, /direct-access-rejected|execution-return-path/);
  assert.doesNotMatch(cssSource, /direct-access-rejected|execution-return-path/);
});

test("locks the NPE Agent Run title to exactly two intentional lines", () => {
  const npeRun = functionBlock("NpeRunScene", "PatchCode");
  assert.match(
    npeRun,
    /scene-title-line scene-title-line-nowrap">실제 NPE를 Agent Loop로<\/span>[\s\S]*scene-title-line"><em>따라가보자<\/em><\/span>/,
  );
  assert.match(cssSource, /\.scene-title-line-nowrap \{ white-space: nowrap; \}/);
});
