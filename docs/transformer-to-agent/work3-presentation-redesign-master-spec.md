# Build Canvas Work 3 — LLM to Agent
## Presentation Redesign Master Spec — Recovery Consolidated

> **Status:** Latest / highest-authority Work 3 specification  
> **Repository:** `gmldbs25/build-canvas`  
> **Target:** `projects/transformer-to-agent`

---

# 0. AUTHORITY

This file is the **single highest-authority specification for Work 3 Presentation**.

Authoritative files are intentionally limited to:

1. `docs/transformer-to-agent/work3-presentation-redesign-master-spec.md`
   - Scene structure, Presentation composition, motion, language policy, interaction, recovery, implementation behavior.
2. `docs/transformer-to-agent/work3-details-article-v4.md`
   - Details prose, narrative depth, scene explanation, A1 interpretation, glossary.

Do not create another competing design/recovery specification.

Obsolete and non-authoritative:

- `work3-redesign-spec.md`
- `work3-details-article-v3.md`
- current code when it conflicts with this master

Conflict order:

1. technical/reveal guardrails in this master;
2. Presentation structure/composition/language/motion/recovery in this master;
3. Details prose in Details v4;
4. implementation/history.

Codex must always: **sync latest `main` → read this master → read Details v4 → inspect code**.

---

# 1. CURRENT RECOVERY DECISION

The currently deployed Work 3 contains regressions from the recent Global Layout Pass and Korean Pass.

Do **not** keep adding ad-hoc CSS to the current deployed state.

Recovery strategy:

```text
restore intended Scene-specific composition
→ keep finalized story/content
→ restore approved Korean copy selectively
→ remove unapproved added copy
→ fix overlap Scene-by-Scene
→ viewport/interaction/build QA
→ only then merge/deploy
```

Work 3 Presentation is a slide-like fixed canvas. `position:absolute` is allowed when it serves intentional Scene composition. The goal is **no uncontrolled overlap**, not elimination of absolute positioning.

A universal `heading / 1fr main / footer` layout must not be forced across all Scenes.

---

# 2. HISTORICAL REFERENCES — LIMITED ROLES

Historical SHAs are references, not authority.

## Scene 00 reference

`e83ab3684237404a1893a11d97cc67671026ba7a`

Use only for the approved minimal Intro.

Visible content must be exactly:

```text
WORK 03 · BUILD CANVAS

LLM to
AGENT

다음 Token 예측에서
AGENT가 되기까지
```

No question paragraph below it.

Delete and do not replace:

```text
다음 Token 예측 Model은 어떻게 코드를 읽고,
파일을 수정하고 테스트하는 System에 참여할까?
```

Do not use `Coding Agent가 되기까지`.

## Main redesign composition reference

`23a2b2f8f8d0517d659252ceb840cb92e4f54f35`

Primary visual-composition reference for `01–16`, `19`, `A1`.

Use its Scene-specific spatial ideas and animation intent. It is **not** language authority and is **not** assumed overlap-free.

## Rejected Global Layout approach

`712e4a138231d9a94b25a217b673f012b249402b`

Do not reapply its universal `.scene-flow` 3-row model as the architecture for all Scenes.

The rejected pattern is effectively:

```css
.scene-flow {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
```

CSS Grid itself is not forbidden. What is rejected is forcing all distinct Presentation compositions into the same vertically compressible structure.

Also do not mass-apply `overflow-wrap:anywhere`, tiny text, or aggressive component shrinking simply to make that global layout fit.

## Current Korean-copy reference

`084086e37fb55488061700fa8a8273cd39c61767`

Use only as a **selective Korean copy reference**.

Do not use its layout/CSS changes as recovery authority.

Scene 00's added question is specifically rejected.

---

# 3. CURRENT SCENE SEQUENCE

```text
00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 19 → A1
```

19 navigable screens total.

Scenes `17`, `18`, `20` are removed from Presentation, Details mapping, navigation, Overview, progress, registry, keyboard transitions, and dead Scene code.

Never restore `N / 22`.

---

# 4. GLOBAL PRESENTATION RULES

- One Scene = one primary learning moment.
- Viewer should know where to look within about one second.
- Presentation is not a copy of Details.
- Avoid tiny low-value captions and dashboard-like density.
- Important code/log text remains readable.
- Animation explains causality, not decoration.
- Stable final frame remains understandable after animation finishes.
- First repeated cycle is readable; later cycles may accelerate.
- Presentation has no page-level vertical scroll.

## Layout / safe-area rule

Persistent chrome needs shared top/bottom safe areas, but Scene content keeps Scene-specific composition.

For each Scene separately protect:

```text
top chrome
heading region
main visual region
optional thesis/question region
bottom chrome/navigation
```

These regions must not collide, but do not need identical geometry.

Do not globally compress all Main Visuals into a shrinking `1fr` center.

## Text wrapping

- Korean prose: natural wrapping; prefer `word-break: keep-all` when appropriate.
- Short technical labels: keep intact where possible.
- Code/stack traces: wrap only at deliberate readable points.
- Do not globally use `overflow-wrap:anywhere`.
- Do not hide essential content with ellipsis just to pass layout.

---

# 5. LANGUAGE POLICY

Presentation is **Korean-first**.

```text
Scene title / question / explanation → Korean
technical component labels / canonical keywords → English where natural
Scene 19 final thesis → English
```

English technical labels may include:

`LLM`, `MODEL`, `TOKEN`, `CONTEXT`, `REQUEST`, `EXECUTION`, `EXECUTION LAYER`, `ENVIRONMENT`, `RESULT`, `REPOSITORY`, `PATCH`, `TEST`, `PASS`, `FAIL`, `CONTROL`, `VALIDATION`, `AGENT LOOP`, `SOFTMAX`, `LOGITS`, `DECODING`.

Avoid unnecessary mixed-language sentences.

Final Scene 19 remains:

```text
LLM → AGENT

The model predicts.
The system turns predictions into actions.
```

Details v4 is not rewritten by this recovery.

---

# 6. TECHNICAL / REVEAL GUARDRAILS

Mandatory:

- Token ≠ word.
- Logits ≠ probabilities.
- Correct conceptual flow: `input tokens → model calculation → vocabulary logits → softmax probabilities → decoding → next token`.
- Example probability/logit values are illustrative.
- Model ≠ execution.
- Request ≠ environment action.
- Repository access ≠ Repository contents in current Model Context.
- Model Context ≠ entire Agent State.
- Tool Result ≠ training.
- Later Context may be selected, filtered, summarized, compressed, or omitted.
- Long-context scroll is a visual metaphor.
- No hidden Chain-of-Thought UI; only observable summaries.
- `Execution Layer` is a conceptual responsibility label.
- Control ≠ Validation.

NPE canon:

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

Failing expression:

```java
user.getProfile().getDisplayName()
```

Reveal timing:

- Scene 00–12: do not reveal `profile == null` or `"Unknown"`.
- Scene 13: reveal `profile == null` only after enough evidence.
- Scene 14: first reveal `"Unknown"` via existing test failure:

```text
expected: "Unknown"
actual: null
```

Never leak these earlier in hidden text or captions.

---

# 7. SCENE REQUIREMENTS

## 00 — Intro

Locked minimal Intro exactly as defined in Section 2. No extra question/explanation.

## 01 — Incident → Agent

`NPE → Stack Trace → UserMapper.java:42 → handoff → READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY`.

No root-cause reveal.

## 02 — Focus on LLM

Surrounding Agent components fade/blur/move away. End on `INPUT → LLM → NEXT TOKEN ?`.

Primary question is Korean-first: `LLM은 실제로 무엇을 할까?`

## 03 — Next Token

Show one accurate conceptual calculation:

`INPUT TEXT → TOKENS → MODEL CALCULATION → LOGITS → SOFTMAX → PROBABILITIES → DECODING → NEXT TOKEN`.

End `ONE TOKEN GENERATED`.

## 04 — Generation repetition

Do not re-teach Scene 03. Focus on `PREDICT → APPEND → REPEAT` with at least two cycles.

## 05 — Later Model Context

Initial `USER REQUEST + ERROR LOG`; later Model Calls may receive richer relevant snapshots. Not one infinite Prompt.

## 06 — Evidence across Context

Long Context visual; distant relevant blocks can jointly matter. Scroll is metaphor; signal lines are not production attention traces.

## 07 — ACCESS ≠ CONTEXT

Large Repository vs smaller Model Context. End with Korean-first hook such as `그럼 코드는 어떻게 Context에 들어올까?`

## 08 — Model Request

Model emits a compact request such as `READ UserMapper.java`. Model does not directly read Repository. Core: `REQUEST ≠ EXECUTION`.

## 09 — Execution

Execution responsibility performs one external action and returns Result. No Loop yet.

## 10 — Result → next Model Context

Relevant Result information may become part of a later Context. Keep Model as destination but stop before next Model Output.

## 11 — First output may not be final

Contrast simple final-answer expectation with Agent first pass. End with `그다음은?`. Do not draw full Loop yet.

## 12 — Agent Loop

Prefer readable linear flow + return path:

`MODEL → REQUEST → EXECUTION → RESULT → CONTEXT UPDATE → MODEL`.

Show changing Context/state beside it.

## 13 — Real NPE Agent Run

Primary focus: current Context + observable assessment + next action. No hidden CoT. First reveal of `profile == null` occurs here after evidence.

## 14 — Patch / Test / Revise

`PATCH #1 → NPE RESOLVED → EXISTING TEST → FAIL → RESULT → NEXT CONTEXT → RE-EVALUATE → PATCH #2`.

First reveal of `"Unknown"` is through failed existing validation. Failure is Feedback, not retraining.

## 15 — Task Complete

`PATCH #2 → RUN TESTS → PASS → VERIFY → OBJECTIVE SATISFIED → FINAL RESPONSE → STOP`. No return path after completion.

## 16 — Agent is a System

Integrate `MODEL`, `CONTEXT`, `TOOLS`, `EXECUTION`, `ENVIRONMENT`, `CONTROL`, `VALIDATION`, `RESULT/FEEDBACK`, `LOOP`. Do not create another dense enterprise architecture diagram.

## 17 / 18 — Removed

Do not restore.

## 19 — Final Conclusion

Do not replay NPE/UserMapper/Patch/Test history. Run one compact recap, then freeze/dim and leave the final English thesis.

## 20 — Removed

Do not restore.

## A1 — Artwork

Artwork-first. Remove and never restore on Presentation:

- `처음에는 질문이고, 마지막에는 답이 된다.`
- `appendix`
- `A1`

No replacement heading. Full uncropped artwork, centered large like a framed illustration.

---

# 8. INTERACTION

Preserve:

- `ArrowLeft` / `ArrowRight`: Scene navigation
- `D`: Details toggle
- Details open: `ArrowUp` / `ArrowDown`: Details scroll
- `O`: Overview if supported
- `H`: Build Canvas home
- stable keyboard behavior after Details toggle
- reduced-motion/accessibility behavior

---

# 9. FINAL RECOVERY EXECUTION PLAN

## Phase 0 — sync first

```bash
git status
git branch --show-current
git remote -v
git fetch origin
git pull origin main
```

Preserve local modifications. Do not use destructive reset/clean commands blindly.

Create a local recovery branch from freshly synced main before implementation, e.g.:

```bash
git switch -c work3-recovery
```

Do not merge to `main` before visual QA.

## Phase 1 — audit only

Read this master and Details v4, then inspect current Work 3 code.

Use `git show` to compare:

- Scene 00: `e83ab368...`
- Scene 01–16/19/A1 composition: `23a2b2f...`
- rejected global layout: `712e4a...`
- Korean copy: `084086e...`

Create a Scene-by-Scene delta map before editing.

## Phase 2 — remove rejected global-reflow assumptions

Do not blindly revert whole commits.

Remove/refactor only the changes that force visually different Scenes into the universal 3-row layout or otherwise distort the intended composition.

Restore the intended Scene-specific composition from `23a2...` as a reference while keeping useful current story/logic changes.

Do not modify other Works.

## Phase 3 — restore Scene 00 exactly

Apply the locked Intro copy from Section 2. Delete the added question completely. No substitute text.

## Phase 4 — apply Korean copy selectively

Use `084086e...` only as copy reference. Apply Korean-first policy without importing its layout restructuring. Do not rewrite Details v4.

## Phase 5 — fix overlap Scene-by-Scene

For each Scene separately:

1. identify heading bounds;
2. identify main visual bounds;
3. identify optional thesis/question bounds;
4. reserve persistent chrome bounds;
5. adjust Scene-local spacing/grid ratios/wrapping only as needed.

Shared CSS variables may define chrome safe areas, but must not erase Scene-specific composition.

## Phase 6 — viewport QA

Mandatory:

```text
1280×720
1440×900
1920×1080
```

1280×720 is the strictest target.

Every Scene must pass:

- no Heading/Main overlap;
- no Main/Footer overlap;
- no content/navigation/chrome collision;
- no critical clipping from `overflow:hidden`;
- readable code/log text;
- natural Korean line breaks;
- stable animation final state.

Do not solve 720p by shrinking all important typography into tiny UI text.

## Phase 7 — interaction/build QA

Verify `ArrowLeft`, `ArrowRight`, `D`, Details `ArrowUp/ArrowDown`, `O`, `H`.

Run appropriate build/lint/type/tests and integrated GitHub Pages preview.

## Phase 8 — user visual approval before main

Successful build is not visual acceptance.

Preview the recovery branch locally. Only after the complete Presentation is visually reviewed should it be merged/pushed to `main` and deployed.

---

# 10. ACCEPTANCE CHECKLIST

- This file remains the only Presentation/recovery authority.
- Details v4 remains Details authority.
- Scene 00 contains only the approved minimal Intro.
- No universal 3-row `.scene-flow` architecture is forced across all Scenes.
- Scene-specific compositions are preserved.
- No text/component/chrome overlap at all three target viewports.
- Korean-first copy is used for titles/questions/explanations.
- Technical labels remain English where useful.
- Scene 19 final thesis remains English.
- No unnecessary newly invented explanatory copy.
- `profile == null` first appears in Scene 13.
- `"Unknown"` first appears in Scene 14 validation.
- Model never appears to directly execute Repository/Shell/Test operations.
- Scenes 17/18/20 remain removed.
- Keyboard interaction is intact.
- A1 is full, uncropped, centered, with no Presentation caption.
- Build/tests pass.
- Recovery is visually approved before merge to `main`.

---

# 11. FINAL DECISION RULE

When implementation convenience conflicts with design, use this order:

```text
story clarity
→ technical correctness
→ Scene-specific visual composition
→ readability
→ stable viewport behavior
→ implementation convenience
```

Do not redesign the whole Presentation to make CSS easier.

Do not invent additional copy to make a screen feel fuller.

Do not preserve a regression merely because it is currently deployed.

Final audience takeaway:

> **The model predicts. The system turns predictions into actions.**
