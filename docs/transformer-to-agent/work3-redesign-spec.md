# Work 3 Redesign Specification — LLM to AGENT

> **Repository:** `gmldbs25/build-canvas`  
> **Work:** Work 3 only  
> **Target directory:** `projects/transformer-to-agent`  
> **Primary deployment:** GitHub Pages  
> **Document role:** Authoritative design specification for Work 3 structure, Presentation, motion, interaction, UX, and technical guardrails  
> **Status:** Consolidated current specification

---

# 0. DOCUMENT AUTHORITY

Work 3 now has two complementary authoritative documents.

## 0.1 This document — design authority

`docs/transformer-to-agent/work3-redesign-spec.md`

This file is authoritative for:

- overall Scene structure and order,
- Presentation composition,
- visual hierarchy,
- motion and interaction,
- navigation and Details drawer behavior,
- desktop layout constraints,
- technical-accuracy guardrails,
- NPE scenario canon,
- acceptance criteria.

It intentionally no longer contains duplicated Scene-by-Scene Details article copy.

## 0.2 Details article authority

`docs/transformer-to-agent/work3-details-article-v3.md`

This file is authoritative for:

- all current Details wording,
- Details narrative and article flow,
- Scene-to-Scene editorial transitions,
- explanation depth,
- information reveal timing,
- Glossary, Learning Check, and Appendix explanatory copy.

When implementing Details, do **not** rewrite, summarize, or reinterpret that manuscript unless explicitly instructed.

Web readability may change only the structural representation: headings, paragraphs, bullets, code blocks, and section grouping.

## 0.3 Conflict rule

If the two documents appear to conflict:

1. **Technical correctness and the guardrails in this specification always apply.**
2. **Details wording, narrative order, and reveal timing → `work3-details-article-v3.md` wins.**
3. **Presentation, layout, motion, interaction, navigation, and visual behavior → this redesign specification wins.**
4. **Current explicit implementation deltas recorded in this document override older historical language.**

Codex must read both documents before a Work 3 implementation pass that affects Details or Presentation.

---

# 1. PROJECT DEFINITION

## Title

# **LLM to AGENT**

The current Presentation subtitle direction is:

> **다음 Token 예측이 실제 행동으로 이어지기까지**

The wording should not imply that the Language Model itself literally transforms into the Agent.

## Project statement

> **다음 Token을 생성하는 Language Model을 중심으로, Context·Tools·Execution·Control·Validation·Loop가 결합되어 Coding Agent의 실제 작업 경험이 만들어지는 과정을 Web-native하게 설명한다.**

This is not a PowerPoint deck copied into a browser and not merely an article rendered as cards.

The browser should help explain through:

- **State** — what the system currently knows or has done,
- **Time** — sequence and causality,
- **Space** — meaningful separation of Model, Context, Boundary, and Environment,
- **Depth** — concise Presentation plus detailed article-quality Details,
- **Interaction** — only where state changes reveal an important conceptual difference.

---

# 2. AUDIENCE AND LEARNING GOAL

Primary viewers are software developers, especially developers already using Coding Agents such as Claude Code, Codex, or similar tools.

They are not assumed to be AI researchers.

The final viewer should be able to explain:

> **다음 Token을 생성하는 Model을 중심으로, Repository를 읽고 코드를 수정하고 테스트하는 Coding Agent는 어떻게 만들어지는가?**

The final mental model is:

> **Model은 Coding Agent의 핵심 구성요소지만 Agent 전체는 아니다. Context, Tools, Execution, Control, Validation과 반복적인 Feedback Loop가 결합되어 실제 작업이 가능해진다.**

Memorable conclusion:

# **THE MODEL IS NOT THE AGENT.**

Supporting interpretation:

> **THE MODEL IS THE CORE. THE SYSTEM MAKES IT AN AGENT.**

This must never be presented as “the Model is unimportant.”

---

# 3. LEARNING ARC

The work contains Intro + five Acts + Appendix.

## ACT 1 — MODEL

Question:

> **복잡해 보이는 Agent 행동에서 Model 자체는 무엇을 하는가?**

Exit understanding:

> Language Model의 기본 생성 과정은 Token 단위 autoregressive generation이다.

## ACT 2 — CONTEXT

Question:

> **Model은 무엇을 근거로 판단하는가?**

Exit understanding:

> Model은 Repository 전체를 자동으로 알고 있는 것이 아니라 현재 Model Call에 제공된 Context를 바탕으로 판단한다.

## ACT 3 — BOUNDARY

Current canonical question:

> **Model은 Context 밖의 Environment와 어떻게 연결되는가?**

This supersedes the older retrieval-only wording `Context에 없는 정보는 어떻게 실제 Environment에서 가져오는가?` because the Act covers both reading and mutating the Environment.

Exit understanding:

> Model의 Tool Request와 실제 Tool Execution은 서로 다른 책임이다.

Memorable statement:

# **MODEL REQUESTS. SYSTEM EXECUTES.**

## ACT 4 — LOOP

Question:

> **한 번의 Tool Call은 어떻게 지속적인 개발 작업이 되는가?**

Exit understanding:

> 실행 결과가 상태에 반영되고 다음 Model Call의 Context가 다시 구성되면서 반복적인 Agent Run이 만들어질 수 있다.

Important distinction:

> **MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE.**

## ACT 5 — AGENT

Question:

> **Model과 Loop를 실제 Coding Agent로 만드는 전체 시스템은 무엇인가?**

Exit understanding:

> Model, Context, Tools, Execution, Control, Validation, Loop가 함께 Coding Agent의 작업 경험을 만든다.

---

# 4. TECHNICAL ACCURACY GUARDRAILS

Presentation may simplify implementation detail for intuition, but simplification must not become false information.

## 4.1 Next Token

- Autoregressive LMs produce scores/logits for candidate next tokens.
- Softmax can convert logits to a probability distribution.
- Decoding determines the next token.
- Displayed percentages are illustrative, not measurements of a real model.

Presentation may say:

> **다음 Token의 가능성을 계산한다.**

## 4.2 Token ≠ Word

Never equate Token with a natural-language word.

Token boundaries vary by tokenizer.

## 4.3 Context

For this work, Presentation `CONTEXT` primarily means:

> **information visible to the LLM for the current Model Call.**

Application/runtime state may also be called context in real frameworks and may not be visible to the Model.

## 4.4 Attention

Attention is only a short bridge in this work, not a Transformer lecture.

Presentation may show relationships between distant code locations, but must not imply:

- human-like semantic understanding,
- that one Attention Head explicitly “found” the intended relation,
- that the visualization is a literal trace of a production model.

Do not expand Presentation with Q/K/V, multi-head internals, residuals, or causal-mask detail unless a future explicit redesign requests it.

## 4.5 Tool Request

A Tool Request is a structured model output indicating a requested external capability/action.

Do not claim all Tool Calls are literal JSON strings.

## 4.6 Model output vs Environment side effect

LLM inference itself must not be described as directly opening a local file, modifying an OS, or executing a shell command.

Conceptual responsibility:

`MODEL OUTPUT → SYSTEM / TOOL EXECUTION → ENVIRONMENT RESULT`

## 4.7 Execution Layer

`EXECUTION LAYER` is a conceptual responsibility label, not a universal mandatory component name.

Actual systems may distribute this role across Runner, Runtime, Orchestrator, Controller, host application, hosted service, MCP/remote services, etc.

## 4.8 Agent Loop

The loop shown in this work is a minimal conceptual model.

Real systems may include:

- multiple or parallel Tool Calls,
- planning,
- handoffs,
- sub-agents,
- persistent state,
- approvals,
- asynchronous/background work.

## 4.9 Tool Result ≠ Training

Never imply that reading a file or receiving a Test Failure retrains the Model.

The result becomes information/state available to subsequent work in the current run/session; Model parameters are not updated.

## 4.10 Agent state vs Model Context

The Agent can maintain execution state and the Environment can retain Workspace state that are not fully copied into every Model Context.

Do not portray an Agent Run as one Prompt that grows forever.

## 4.11 Control vs Validation

These are separate conceptual responsibilities throughout the work.

**CONTROL** answers:

> 무엇이 허용되는가?

Representative examples:

- permissions,
- sandbox,
- approval,
- guardrails.

**VALIDATION** answers:

> 결과가 실제로 맞는가?

Representative examples:

- tests,
- build,
- lint,
- type check,
- diff review,
- human review.

Do not nest Validation under Control in the final mental model.

## 4.12 Naming

`Agent`, `Runner`, `Runtime`, `Harness`, and `Orchestrator` have different boundaries across products/frameworks.

Teach responsibilities, not a fictional universal naming scheme.

---

# 5. OFFICIAL NPE INCIDENT

The educational scenario remains canonical and consistent throughout Work 3.

## User request

> 운영 서버에서 NullPointerException이 발생했다. 원인을 확인하고 수정한 뒤 테스트까지 검증해줘.

## Production stack trace

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

## Broken code

```java
public UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(),
        user.getProfile().getDisplayName()
    );
}
```

## Canonical scenario truth

For authors/implementation only:

- some legacy users may have `profile == null`,
- the first defensive patch returns `null`,
- the application contract actually requires `displayName = "Unknown"`,
- Test Failure reveals that contract,
- the corrected patch returns `"Unknown"` for a missing profile.

## Reader reveal timing — mandatory

Canonical scenario truth is **not** the same as what the reader knows at each Scene.

### Scene 01

Reveal only:

- the NPE,
- Stack Trace,
- `UserMapper.java:42`,
- the expression `user.getProfile().getDisplayName()`,
- the user request and high-level workflow.

Do **not** reveal yet:

- that `profile` can be null,
- why the data condition exists,
- that `"Unknown"` is required,
- the final correct patch.

The Incident must remain a real problem to investigate, not an example whose answer is already supplied.

### Scene 13

As Repository information is gathered, reveal that some existing data/users can have no profile and therefore `profile == null` is a well-supported likely cause of the NPE.

The reader should experience the cause emerging from new Context.

### Scene 14

Reveal the `"Unknown"` fallback contract through the failed test:

```text
expected: "Unknown"
actual: null
```

This is the second information discovery in the Incident.

### Scene 19 / 20

Only after the learning journey should the whole Incident be read as one decoded Model–Context–Execution–Feedback Loop.

## Canonical workflow

```text
READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY
```

Failure path:

```text
... → PATCH → TEST FAILED → READ TEST → PATCH → TEST PASS → VERIFY
```

---

# 6. SCREEN INDEX — 22 SCREENS

## Intro
- 00 — LLM to AGENT

## ACT 1 — MODEL
- 01 — The Incident
- 02 — Strip It Down
- 03 — Next Token
- 04 — Generation Is Repetition

## ACT 2 — CONTEXT
- 05 — What Enters the Model
- 06 — Attention Is Relation
- 07 — Repository → Context

## ACT 3 — BOUNDARY
- 08 — Request Stops at the Boundary
- 09 — Execution Layer
- 10 — Model Requests. System Executes.

## ACT 4 — LOOP
- 11 — Result Returns
- 12 — The Agent Loop
- 13 — Follow the NPE
- 14 — Failure Is Context
- 15 — When Does It Stop?

## ACT 5 — AGENT
- 16 — Build the Agent
- 17 — Same Model, Different Agent
- 18 — What Should Developers Look At?
- 19 — Back to the Incident
- 20 — Final Synthesis

## Appendix
- A1 — LLM to AGENT Artwork

---

# 7. ONE SCENE = ONE LEARNING MOMENT

Every Scene should have one primary fact a first-time viewer can state after seeing it.

Current conceptual sequence:

- **00** — What question is this work answering?
- **01** — A Coding Agent appears to perform a complete development workflow; the cause is not yet known.
- **02** — The Model itself performs token generation, not direct filesystem/OS side effects.
- **03** — The Model produces next-token scores; decoding determines the next token.
- **04** — Repeated autoregressive generation produces longer output.
- **05** — Model judgment is based on information visible in the current Model Call.
- **06** — Information at different positions inside Context can influence the Model’s calculation.
- **07** — Repository existence is not the same as Model Context.
- **08** — A Tool Request is not the executed action.
- **09** — A separate execution responsibility connects a request to Environment capability.
- **10** — MODEL REQUESTS. SYSTEM EXECUTES.
- **11** — Environment results can become new information for subsequent Model Calls.
- **12** — Repeated calls + execution + feedback create the minimal Agent Loop; Model Context is not total Agent state.
- **13** — The abstract Loop can be followed through one possible NPE investigation, and the cause emerges from gathered information.
- **14** — Failed validation can reveal new information and change the next action.
- **15** — Agent Loops need Stop Conditions.
- **16** — A complete Coding Agent requires responsibilities around the Model; Tool Calling alone is not enough.
- **17** — The same Model can participate in different Agent systems with different outcomes.
- **18** — Developers can evaluate Agents using four durable questions.
- **19** — The opening Incident can now be decomposed into Model / Context / Request / Execution / Result / Control / Validation / Loop.
- **20** — THE MODEL IS NOT THE AGENT; the Model is the core of a broader system.
- **A1** — The conceptual Artwork compresses the complete mental model into one visual.

A paused screenshot of every Presentation Scene must communicate its learning moment without relying on presenter narration alone.

---

# 8. PRESENTATION UX

## 8.1 Target

Desktop-first.

Verify at minimum:

- 1280×720,
- 1440×900,
- 1920×1080.

Presentation must fit within `100svh` with no vertical page scroll.

Do not solve overflow by shrinking meaningful text until it becomes unreadable.

## 8.2 Navigation

Primary:

- `ArrowLeft`
- `ArrowRight`

Current additional controls:

- bottom-right previous/next controls,
- `D` / Details,
- `O` / Overview,
- `H` / Build Canvas home.

Scene navigation must continue working predictably when Details or Overview has been used.

## 8.3 Persistent chrome

Current implementation may include:

- top-left ACT position,
- five-segment ACT rail,
- Details affordance,
- compact `N / 22` Scene position,
- restrained previous/next arrows.

Do not reintroduce a large top navigation bar, large permanent work title, or oversized page numbers.

## 8.4 Scene transition

Use one restrained horizontal transition system across the work.

Scene transition and Scene-internal motion are separate concerns.

---

# 9. DETAILS DRAWER

Details opens from the right as an overlay and must not reflow the full Presentation composition.

Details may scroll internally.

The reading surface should feel like a technical article, not a tooltip or a metadata panel.

Opening Details should pause looping explanatory motion where applicable.

The current article manuscript is `work3-details-article-v3.md`.

Every Scene 00–20 and A1 now has meaningful Details/article content, including Intro.

The old rule “Intro does not require Details” is retired.

Do not re-add Presentation-dependent prose such as `화면에서 보듯이`, `Presentation의 선은...` unless technically unavoidable. Details should remain independently readable.

---

# 10. TYPOGRAPHY AND READABILITY

Meeting-room readability remains a hard requirement.

General starting scale:

- Hero Statement: `clamp(64px, 7vw, 120px)`
- Main Scene concept/title: `clamp(42px, 4.5vw, 76px)`
- Important code: `clamp(24px, 2.2vw, 38px)`
- Supporting Presentation copy: `clamp(18px, 1.4vw, 26px)`
- Persistent chrome: approximately `14–16px`

Do not use tiny explanatory labels as essential Presentation content.

If an explanation requires paragraphs, it belongs in Details.

Use Korean for explanatory communication and English for concise canonical technical labels/statements where useful.

---

# 11. MOTION SYSTEM

Core rule:

# **MOTION IS EXPLANATION, NOT DECORATION.**

Use motion only to explain:

1. sequence,
2. relationship,
3. state change,
4. result of a choice.

Critical information must remain understandable in a paused state.

Respect reduced-motion behavior.

Avoid hard resets, excessive particles, random gradients, fake neural-network backgrounds, and decorative “AI” motion.

---

# 12. SCENE-SPECIFIC PRESENTATION DIRECTION

This section defines current Presentation intent only. Details wording lives exclusively in `work3-details-article-v3.md`.

## 00 — Intro

- Editorial opening, minimal and confident.
- No unnecessary microcopy.
- Subtitle must not imply the Model literally becomes the Agent.
- Intro has Details.

## 01 — The Incident

- Show NPE, line 42, problematic expression, and workflow.
- Preserve the mystery.
- Do not visually reveal `profile == null` or the `"Unknown"` contract.
- Workflow includes `TRACE`.

## 02 — Strip It Down

- Remove surrounding Agent capabilities until Model generation remains.
- Current canonical strong statement:

# **THE MODEL PREDICTS THE NEXT TOKEN.**

- One-shot then stable is preferred.

## 03 — Next Token

- Show readable illustrative candidate distribution.
- Values remain illustrative.
- Viewer should understand score/probability intuition without a dashboard aesthetic.

## 04 — Generation Is Repetition

- Emphasize sequence growth, not typing animation.
- `PREDICT → APPEND → PREDICT → APPEND`.

## 05 — What Enters the Model

- Clearly separate current Model Call Context from the larger Repository outside it.
- Avoid duplicate CONTEXT labels.

## 06 — Attention Is Relation

- Keep as a short bridge.
- Large readable code; one or two conceptual relations maximum.
- Do not turn this into a Transformer internals lecture.
- If the visual uses a code variant that represents a later patched form, do not imply it is the current Incident file state.

## 07 — Repository → Context

- Repository must feel much larger than Model Context.
- Strong statement: `EXISTS ≠ IN CONTEXT`.
- Show selection, not magical transfer of an entire repository.

## 08 — Request Stops at the Boundary

- Model and Environment occupy distinct semantic spaces.
- Tool Request reaches/stops at a visible boundary.
- Strong statement: `REQUESTED ≠ EXECUTED`.

## 09 — Execution Layer

- Continue the semantic space from Scene 08.
- Show the request crossing into actual Environment work through a restrained execution path.
- `REQUEST → VALIDATE → PERMISSION → EXECUTE` is conceptual, not literal universal architecture.

## 10 — Model Requests. System Executes.

- Deliberately simple statement Scene.
- Almost static.
- No need to fill the screen with additional explanation.

## 11 — Result Returns

- Result returns toward Agent state/Context rather than flying into a “brain.”
- Viewer should see that available information changes.

## 12 — The Agent Loop

- Major Anchor Scene.
- Whole loop remains visible when paused.
- Active stage changes emphasis.
- Avoid generic circular-card infographic.
- Conceptually distinguish `UPDATED STATE` from `NEXT MODEL CONTEXT`.

## 13 — Follow the NPE

- Return to the Incident Workspace.
- Show one possible observable Agent Run, not hidden chain-of-thought.
- The cause should emerge here through gathered Repository information.
- Do not imply all Agents must use exactly this sequence.

## 14 — Failure Is Context

- Default FAIL path should make Test Failure visibly change the next action.
- Required compact `FAIL | PASS` state control remains.
- Do not describe failure as training.

## 15 — When Does It Stop?

- Make the loop visibly exit to `TASK COMPLETE`.
- Other stop conditions remain secondary.

## 16 — Build the Agent

Current conceptual responsibilities:

- MODEL
- CONTEXT
- TOOLS
- EXECUTION
- CONTROL
- VALIDATION
- LOOP

Control and Validation are peers, not one nested inside the other.

The Model is central but must not visually occupy the whole system.

### Deferred Presentation polish task — after Details v3 rollout

After the Details article has been implemented and verified, revisit this Scene as a dedicated Presentation task.

Desired animation concept:

1. begin with the central LLM / MODEL clearly visible,
2. surrounding responsibilities progressively resolve around it,
3. each addition should explain why Model alone is insufficient,
4. Context, Tools, Execution, Control, Validation, and Loop should accumulate into one coherent system,
5. the final state should resolve as a single **CODING AGENT SYSTEM** rather than a collection of cards.

This must not become a generic “components pop in one by one” feature animation. The motion itself should communicate:

> **Model 하나에 필요한 책임들이 연결되면서 Agent System이 완성된다.**

Do **not** implement this deferred polish as part of the Details-only rewrite unless explicitly requested.

## 17 — Same Model, Different Agent

- Same underlying Model, different surrounding systems.
- Required A/B comparison remains.
- Model quality still matters; system design also matters.

## 18 — What Should Developers Look At?

Four durable questions:

1. `WHAT DOES IT SEE?`
2. `WHAT CAN IT DO?`
3. `WHAT IS IT ALLOWED TO DO?`
4. `HOW IS IT VERIFIED?`

`Working directory` is **not** automatically an example of what the Model sees.

Use Model-visible examples under the first question: project instructions, selected files, logs, search results, previous tool results, conversation history.

Workspace boundary/access paths belong under permission/control when relevant.

## 19 — Back to the Incident

- Reuse Scene 01 visually as closely as practical.
- Preserve the failure/retry pivot: `TEST FAILED → CONTEXT/STATE → RETRY`.
- The payoff is that the same workflow can now be decomposed into system responsibilities.

## 20 — Final Synthesis

- Central LLM with Context, Tools, Execution, Control, Validation, Loop around it.
- Final system boundary: `CODING AGENT`.
- Final statement: `THE MODEL IS NOT THE AGENT.`
- Do not visually or verbally diminish the Model’s importance.

## A1 — Artwork

- Static visual/artistic closure.
- Same conceptual Artwork can function as a question at the beginning and an answer at the end.
- No required animation.

---

# 13. FOUR DEVELOPER QUESTIONS — CANONICAL MAPPING

Use this mapping consistently.

## WHAT DOES IT SEE?

Model-visible information such as:

- project instructions,
- selected/read files,
- logs,
- search results,
- prior Tool Results,
- conversation history.

## WHAT CAN IT DO?

Model-exposed capabilities such as:

- Search,
- Read,
- Edit,
- Shell,
- Test,
- Browser/API,
- Git.

## WHAT IS IT ALLOWED TO DO?

Control/execution boundaries such as:

- workspace write boundary,
- accessible paths,
- shell restrictions,
- network access,
- approval requirements.

## HOW IS IT VERIFIED?

Validation such as:

- tests,
- build,
- lint,
- type check,
- diff review,
- human review.

---

# 14. INTERACTION POLICY

Intentional conceptual interactions remain rare.

Required:

1. `FAIL | PASS` in Scene 14 — Failure Is Context.
2. A/B comparison in Scene 17 — Same Model, Different Agent.

Overview navigation is utility interaction, not conceptual interaction.

Do not invent interactions for every Scene.

---

# 15. IMPLEMENTATION ARCHITECTURE GUIDANCE

Keep the Presentation shell responsible for:

- current Scene,
- keyboard navigation,
- overview state,
- Details state,
- motion pause state,
- Scene transitions,
- ACT/Scene position.

Scene components own their actual visual compositions.

Use shared primitives for typography, navigation, Details, ACT indicator, code rendering, transitions, accessibility, and semantic visual tokens.

Do not force every Scene into one reusable card/grid silhouette.

Use real text/code rather than rasterized screenshots.

Avoid heavy libraries for decorative effects.

---

# 16. DETAILS IMPLEMENTATION CONTRACT

When implementing `work3-details-article-v3.md` into `projects/transformer-to-agent/content/pages.ts` or its successor:

## Allowed

- split long text into readable Detail sections,
- create useful section titles,
- convert enumerations into bullets,
- move literal code/flows into code blocks,
- preserve/add official references where they support the same content,
- adjust paragraph boundaries for drawer readability.

## Not allowed without explicit approval

- summarize the manuscript,
- delete explanations because Presentation already shows them,
- add new technical claims,
- reorder Scene narrative,
- expose the NPE cause in Scene 01,
- expose the `"Unknown"` contract before Scene 14,
- merge Control and Validation,
- remove the Agent State vs Model Context distinction,
- restore Q/K/V-heavy Attention detail to the article body,
- rewrite Details as Presentation annotations,
- change Presentation composition or animation as part of a Details-only pass.

The Details implementation is complete only when a reader can read 00 → 20 → A1 sequentially as one coherent technical article without needing presenter narration.

---

# 17. CURRENT IMPLEMENTATION DELTAS / SETTLED DECISIONS

These are deliberate current decisions and should not be reopened accidentally.

## 17.1 Scene 02 statement

Use:

# **THE MODEL PREDICTS THE NEXT TOKEN.**

rather than the older `THE MODEL GENERATES TOKENS.` wording.

## 17.2 Intro

The old optional hook line is absent from Presentation.

Intro **does** have Details/article content.

## 17.3 ACT 3 question

Use:

> **Model은 Context 밖의 Environment와 어떻게 연결되는가?**

The older retrieval-only question is retired.

## 17.4 Chrome

Current additions are accepted:

- ACT rail,
- compact `N / 22`,
- `O` Overview,
- `H` home shortcut.

## 17.5 NPE line numbers

`UserMapper.java:42` must remain consistent between Stack Trace and code focus.

## 17.6 Scene 19 retry

The recap must include failure → feedback/state → retry, not a falsely clean linear success path.

## 17.7 Details authority

All old Scene-specific Details copy formerly embedded in this redesign spec is retired.

The authoritative current manuscript is:

`work3-details-article-v3.md`

---

# 18. QA AND ACCEPTANCE

## Content

- [ ] 22 screens remain in the canonical order.
- [ ] Scene 01 does not reveal the cause.
- [ ] Scene 13 reveals the likely `profile == null` cause through gathered information.
- [ ] Scene 14 reveals the `"Unknown"` contract through Test Failure.
- [ ] Control and Validation remain distinct.
- [ ] Agent State and Model Context remain distinct.
- [ ] Final statement preserves Model importance.

## Presentation

- [ ] 1280×720 works without Presentation vertical scroll.
- [ ] 1440×900 works without Presentation vertical scroll.
- [ ] 1920×1080 works without Presentation vertical scroll.
- [ ] core text is readable at presentation distance.
- [ ] no essential explanation is hidden behind tiny labels.
- [ ] every Scene communicates its Core Message when animation is paused.
- [ ] motion explains sequence, relation, state change, or outcome.

## Details

- [ ] Details opens as overlay.
- [ ] Details scrolls internally.
- [ ] looping motion pauses while reading where applicable.
- [ ] every Scene 00–20 and A1 contains complete v3 content.
- [ ] reading Details sequentially works as a standalone article.
- [ ] no obsolete Scene 01 cause reveal remains in implemented Details.
- [ ] Glossary / Learning Check / Simplification Notes are available in A1.

## Interaction / Navigation

- [ ] left/right keyboard navigation works.
- [ ] bottom arrow navigation works.
- [ ] `D` works.
- [ ] `O` works.
- [ ] `H` works.
- [ ] Scene 14 FAIL/PASS interaction remains meaningful.
- [ ] Scene 17 A/B comparison remains meaningful.

## Technical accuracy

- [ ] illustrative probabilities are identified as illustrative.
- [ ] Token is not equated with word.
- [ ] Context is scoped to Model-visible information for current Call.
- [ ] Attention visualization remains conceptual.
- [ ] Tool Request is not guaranteed execution.
- [ ] JSON is not universalized as Tool Call representation.
- [ ] Execution Layer is not universalized as a component name.
- [ ] Tool Result / Test Failure does not imply training.
- [ ] Agent Loop is presented as a minimal conceptual model.
- [ ] permissions/sandbox/control examples are not universal formal requirements.

## Repository safety

- [ ] only Work 3 / Work 3 documentation changed for this workstream.
- [ ] no credentials, account data, or secrets introduced.
- [ ] GitHub Pages build remains compatible when implementation changes occur.

---

# 19. REFERENCE BASELINE

Primary reference families for technical verification:

- Vaswani et al., **Attention Is All You Need** (2017)
- OpenAI Agents SDK — Agents / Running Agents / Context / Tools
- OpenAI Codex safety documentation for sandbox/approval examples
- Anthropic official Tool Use documentation for cross-vendor Tool Request / Tool Result behavior

References support technical verification; they do not override the editorial learning arc unless a factual correction is required.

---

# 20. FINAL DESIGN INTENT

At the beginning, the NPE workflow should feel like:

> **“Agent가 알아서 문제를 해결한다.”**

At the end, the same workflow should be readable as:

> 필요한 정보가 Context로 구성되고, Model이 다음 행동을 요청하고, 실행 가능한 시스템이 Environment에서 Tool을 수행하며, Result와 Validation Feedback이 다음 판단에 반영되어 Loop가 이어지는구나.

The learning goal is complete when the viewer can move from the first interpretation to the second.

The web experience should also demonstrate that state, space, time, interaction, and layered explanation can teach this concept more effectively than a dense static architecture slide.

---

# END OF SPECIFICATION

For Details implementation, always read this file together with:

`docs/transformer-to-agent/work3-details-article-v3.md`

Do not restore retired duplicated Details copy into this document.
