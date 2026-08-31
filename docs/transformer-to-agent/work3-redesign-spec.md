# Work 3 Redesign Specification — LLM to AGENT

> **Repository:** `gmldbs25/build-canvas`  
> **Work:** Work 3 only  
> **Target directory:** `projects/transformer-to-agent`  
> **Primary deployment:** GitHub Pages  
> **Document role:** Single Source of Truth for the complete Work 3 redesign  
> **Status:** Final design specification after editorial and technical review

---

# 0. CODEX EXECUTION CONTRACT

This document is not an idea memo or a loose collection of suggestions.

It is the **implementation specification for the complete first redesign of Work 3**.

Codex must read this document from beginning to end before changing the implementation.

## 0.1 Scope

Work only inside:

`projects/transformer-to-agent`

Do not modify Texas Trace, ORCA, the Build Canvas portfolio shell, or any other work unless a change is strictly required for Work 3 to build and the reason is documented.

Preserve compatibility with the existing Build Canvas repository and GitHub Pages deployment.

Do not migrate the project to a different framework merely for convenience. Inspect the current implementation and refactor it in place unless an actual blocker exists.

---

## 0.2 Complete the entire redesign

The phases later in this document describe **implementation order**, not separate approval checkpoints.

Do not implement only the first few Scenes and stop.

The first redesign is complete only when:

- all 22 screens in this specification exist,
- the Presentation experience is complete,
- the Details drawer works for every applicable Scene,
- the full technical Details content is implemented,
- all intended motion and interactions are implemented,
- desktop presentation constraints are satisfied,
- build/static export succeeds,
- the final visual and functional QA has been completed.

Do not declare completion because a template, common component, or a subset of Scenes exists.

---

## 0.3 Priority order

When two instructions appear to conflict, use this priority:

1. **Learning accuracy and technical correctness**
2. **Scene-specific Core Message**
3. **Presentation readability on a meeting-room screen**
4. **Web-native explanatory value**
5. **Global UX consistency**
6. **Visual polish**
7. **Implementation convenience**

Never sacrifice the first four for component reuse.

---

## 0.4 Scene-first implementation rule

Do not build this project by inventing one generic `CardScene` or `GridScene` and replacing text 22 times.

The main redesign exists specifically to remove the current repeated technical-dashboard feeling.

Each Scene must be composed according to what it needs to explain.

Shared primitives are encouraged for:

- typography,
- navigation,
- Details drawer,
- ACT indicator,
- color tokens,
- code rendering,
- boundary lines,
- animation state,
- accessibility,
- transitions.

Shared primitives must **not** force all Scenes into the same silhouette.

---

## 0.5 No hidden critical content

Animations may explain sequence or state, but critical Presentation content must not remain invisible until an animation finishes.

A paused screenshot of a Scene must still communicate its Core Message.

---

## 0.6 Required QA before completion

Codex must inspect the finished experience as an actual desktop presentation, not only verify TypeScript compilation.

At minimum verify:

- 1280×720,
- 1440×900,
- 1920×1080.

The main Presentation viewport must never vertically scroll at these target sizes.

Details may scroll internally.

---

# 1. PROJECT DEFINITION

## Title

# **LLM to AGENT**

Recommended subtitle:

**다음 Token 예측에서 Coding Agent까지**

---

## Project statement

> **LLM이 Coding Agent가 되는 과정을 상태·시간·공간·깊이·상호작용을 이용해 이해시키는 Web-native learning experience.**

This is not simply an article implemented in HTML and it is not a PowerPoint slide deck reproduced in a browser.

The browser itself is part of the explanation.

The material should use:

- **State** — what the system currently knows or has done,
- **Time** — sequence and causality,
- **Space** — Model, Context, Boundary and Environment occupy meaningful locations,
- **Depth** — intuitive Presentation first, technical Details on demand,
- **Interaction** — only when changing a state reveals a useful conceptual difference.

Not every Scene must move or be interactive.

Static is preferred when static communicates the idea more strongly.

---

# 2. AUDIENCE AND LEARNING GOAL

## Audience

Primary viewers are software developers, especially backend developers, who already use Coding Agents such as Claude Code, Codex, or similar tools in practical development.

They are not assumed to be AI researchers.

They know what agents feel like to use, but may not have a clear mental model of what is happening between the LLM, tools, repository and execution environment.

---

## Primary learning goal

After the material, the viewer should be able to answer:

> **AI Agent의 정체와 동작 흐름에 대해 명확하게 이해하고 설명할 수 있는가?**

More specifically:

> **다음 Token을 생성하는 LLM이 어떻게 Repository를 읽고, 코드를 수정하고, 테스트까지 수행하는 Coding Agent가 되는가?**

---

## Final mental model

The final viewer should understand:

> **Model은 Coding Agent의 핵심 구성요소지만, 사용자가 경험하는 Coding Agent의 행동은 Model 단독으로 만들어지지 않는다. Context, Tools, Execution, Control, Validation과 반복적인 feedback loop가 결합되어 실제 작업이 가능해진다.**

The memorable final statement is:

# **THE MODEL IS NOT THE AGENT.**

This must **not** imply that the Model is unimportant.

It means the Model is a core part of a broader working system.

---

# 3. LEARNING ARC

The entire work follows five Acts.

## ACT 1 — MODEL

Question:

**복잡해 보이는 Agent 행동에서 Model 자체는 무엇을 하는가?**

Exit understanding:

> 아무리 복잡한 결과를 만들어도 Language Model의 기본 생성 과정은 Token 단위의 autoregressive generation이다.

---

## ACT 2 — CONTEXT

Question:

**Model은 무엇을 근거로 판단하는가?**

Exit understanding:

> Model은 Repository 전체를 자동으로 알고 있는 것이 아니라, 현재 Model Call에 제공된 Context를 기반으로 판단한다.

---

## ACT 3 — BOUNDARY

Question:

**Context에 없는 정보는 어떻게 실제 Environment에서 가져오는가?**

Exit understanding:

> Model의 Tool Request와 실제 Tool Execution은 다른 책임이다.

Memorable statement:

# **MODEL REQUESTS. SYSTEM EXECUTES.**

---

## ACT 4 — LOOP

Question:

**한 번의 Tool Call은 어떻게 지속적인 개발 작업이 되는가?**

Exit understanding:

> Agent는 실행 결과를 다시 현재 상태에 반영하고 다음 행동을 선택할 수 있는 반복 시스템이다.

---

## ACT 5 — AGENT

Question:

**Model과 Loop를 실제 Coding Agent로 만드는 전체 시스템은 무엇인가?**

Exit understanding:

> Model은 핵심이지만 우리가 경험하는 Coding Agent는 Model, Context, Tools, Execution, Control, Validation, Loop가 함께 만드는 시스템이다.

---

# 4. TECHNICAL ACCURACY PRINCIPLE

Presentation must be concise enough to work on a meeting-room screen.

Therefore conceptual simplification is expected.

However simplified wording must never become technically false information.

Use this rule throughout the project:

> **Presentation은 개념적 직관을 위해 구현 세부사항을 단순화할 수 있지만, 실제 시스템에서 달라질 수 있는 구현 방식이나 용어를 보편적 사실처럼 표현하지 않는다. Details에서 정확한 기술적 정의와 범위를 보충한다.**

---

## 4.1 Next Token

Presentation may say:

> **다음 Token의 가능성을 계산한다.**

Technical meaning for Details:

- an autoregressive language model produces scores/logits for candidate next tokens,
- decoding determines the next token,
- softmax can convert logits into a probability distribution,
- sampling/temperature/top-p or other decoding methods may affect selection.

Do not claim that the displayed percentages are measurements from a real model.

---

## 4.2 Token is not a word

Do not equate Token with a natural-language word.

Token boundaries vary by tokenizer.

All human-readable token examples in Presentation are conceptual simplifications.

---

## 4.3 Context

For Presentation, `CONTEXT` means primarily:

> **information visible to the LLM for the current Model Call.**

The word context is overloaded in real frameworks.

Application-local runtime state may also be called context and may not be visible to the model.

Details must make this distinction explicit.

---

## 4.4 Attention

Presentation may visually connect two distant code locations.

Do not imply that an Attention line proves the model has explicitly identified a human-level semantic relationship.

The line is a conceptual visualization of content-dependent attention between accessible token representations.

For autoregressive decoder models, causal masking limits access to future positions.

---

## 4.5 Tool Call / Tool Request

Presentation may display JSON because it is readable.

Do not claim Tool Calling is universally JSON text.

Technical definition in this material:

> **a structured model output that indicates a requested external capability/action.**

---

## 4.6 Model vs Environment side effect

The LLM inference itself should not be described as directly opening a local file or modifying the OS.

A Coding Agent product may naturally be described as “reading a file,” but the conceptual responsibility is:

`Model output → system/tool execution → environment result`.

---

## 4.7 Execution Layer / Agent Runtime

`EXECUTION LAYER` is the preferred Presentation term.

`Agent Runtime` may appear in Details.

Neither is presented as a mandatory universal component name.

Actual products may distribute this responsibility across:

- Runner,
- Orchestrator,
- Controller,
- Tool runtime,
- host application,
- hosted service,
- local process,
- MCP or remote service.

Explain responsibilities, not fictional standardized component names.

---

## 4.8 Agent Loop

The loop in this work is a **minimal conceptual model**.

Real agents may support:

- multiple tool calls,
- parallel execution,
- handoffs,
- sub-agents,
- planning,
- persistent state,
- asynchronous/background work,
- human approval.

Do not present the simplified sequential loop as every product’s exact internal architecture.

---

## 4.9 Failure is Context, not model training

Never communicate:

> “Agent failed and retrained itself.”

The intended meaning is:

> **the failure result becomes information available to a subsequent step/model call in the current run/session.**

The model’s parameters are not being updated.

---

## 4.10 Permissions, Sandbox, Validation

These are representative and important control mechanisms for Coding Agents.

Do not define them as formal mandatory properties of every system called an Agent.

---

## 4.11 Agent / Harness terminology

`Agent`, `Runner`, `Runtime`, `Harness`, `Orchestrator` have different boundaries in different products/frameworks.

This work teaches **responsibility boundaries**, not a universal naming standard.

---

# 5. WEB-NATIVE DESIGN PRINCIPLES

Before designing or coding an element, ask:

> **이 개념을 가장 빨리 이해시키려면 화면에서 무엇이 일어나야 하지?**

Do not begin with:

> “Which cards should contain this text?”

---

## 5.1 One Scene = one Learning Moment

A Scene should normally have one primary conceptual outcome.

A Scene may contain multiple states when those states form one causal explanation.

---

## 5.2 Space has semantic meaning

Examples:

- Model and Repository should be visibly separate when teaching the boundary.
- Repository should look much larger than current Context when explaining Context selection.
- Tool results should visibly return toward the current state rather than magically appear inside the model.
- Control can occupy a boundary/guarding region instead of becoming another feature card.

---

## 5.3 Time explains causality

Use motion when it clarifies:

1. sequence,
2. relationship,
3. state change,
4. result of a choice.

If motion explains none of those, remove it.

---

## 5.4 Depth belongs in Details

Presentation owns intuition.

Details owns accuracy.

> **Presentation은 직관을 책임지고, Details는 정확성을 책임진다.**

Do not shrink Presentation text to fit paragraphs that belong in Details.

---

## 5.5 Interaction is rare

Only two conceptual interactions are intentionally required:

1. `FAIL / PASS` in **Failure Is Context**
2. A/B comparison in **Same Model, Different Agent**

Do not invent interactions for every Scene merely because this is a web experience.

---

# 6. GLOBAL PRESENTATION UX

## 6.1 Target platform

Desktop only.

Primary use:

- personal desktop/laptop viewing,
- meeting-room presentation screen.

Mobile is out of scope.

Optimize for wide screens, including:

- 1280×720 minimum functional target,
- 1440×900,
- 1920×1080.

If a very narrow/mobile viewport is encountered, graceful degradation or a desktop-only notice is acceptable.

Do not spend redesign effort creating a mobile layout.

---

## 6.2 Presentation viewport

Presentation must fit inside `100svh`.

**No vertical page scrolling is allowed in Presentation.**

Do not solve overflow by making text tiny.

Recompose the Scene instead.

---

## 6.3 Persistent chrome

Keep only:

### Top-left
Current position:

`ACT 3 · 1`

Intro and Appendix may omit the ACT indicator.

### Top-right
`Details`

### Bottom-right
Previous / next arrow controls.

No persistent giant work title.

No large page numbers.

No large top navigation bar.

---

## 6.4 Navigation

Primary:

- `ArrowLeft`
- `ArrowRight`

Secondary:

- clickable previous/next arrows at bottom-right.

No swipe requirement.

No scroll-based Scene navigation.

The arrow keys change Scenes only.

---

## 6.5 Scene transition

Use one restrained horizontal Scene transition system.

Recommended feel:

- approximately 300–450 ms,
- smooth translation with mild opacity support,
- consistent across the work.

Do not use a different page transition effect for every Scene.

Scene transition and Scene internal animation are separate concerns.

---

# 7. DETAILS DRAWER

## Behavior

`Details` opens from the right as an overlay.

Do **not** push or reflow the full-screen Scene.

This avoids damaging carefully composed Presentation layouts.

---

## Recommended desktop width

Use approximately:

`clamp(460px, 38vw, 720px)`

Adjust only if actual typography proves a nearby value works better.

The panel must be comfortable for technical reading.

---

## Scrolling

Presentation itself never scrolls vertically.

Details **may and should scroll internally** when content is long.

---

## Motion pause

When Details opens:

- pause looping Scene motion,
- freeze the visual state so the viewer can read against a stable Scene.

When Details closes:

- motion may resume naturally.

For one-shot animation Scenes, it is acceptable to remain at the current/final state after Details closes rather than restarting unexpectedly.

---

## Details content structure

Use as appropriate:

1. **Scene Summary**
2. **Technical Deep Dive**
3. **Code / Mini Diagram**
4. **Important Distinction**
5. **References**

Not every Scene needs all five headings.

Details should read as a coherent technical article, not a tooltip dump.

---

## Details visual tone

Use a neutral, highly readable document surface independent of the Scene’s dramatic palette.

Prefer restrained typography and strong hierarchy.

Small technical diagrams and code snippets are allowed.

---

# 8. TYPOGRAPHY AND READABILITY

The presentation must work from the back of a meeting room.

Avoid tiny explanatory text.

Recommended starting scale:

- Hero Statement: `clamp(64px, 7vw, 120px)`
- Main Scene concept/title: `clamp(42px, 4.5vw, 76px)`
- Important code: `clamp(24px, 2.2vw, 38px)`
- Supporting Presentation copy: `clamp(18px, 1.4vw, 26px)`
- Persistent chrome: approximately `14–16px`

Do not use sub-12px information as meaningful Presentation content.

If an explanation requires small text, move it to Details.

---

## Typography language

Use Korean for explanatory communication.

Use English for canonical technical labels and strong Statements when they are more concise and visually effective.

Examples:

- `MODEL`
- `CONTEXT`
- `REQUEST`
- `EXECUTION`
- `RESULT`
- `LOOP`
- `REQUESTED ≠ EXECUTED`
- `MODEL REQUESTS. SYSTEM EXECUTES.`
- `THE MODEL IS NOT THE AGENT.`

Do not turn the whole presentation into English merely for style.

---

# 9. COLOR AND VISUAL DNA

Scene-specific color is allowed.

However the work must still feel like one designed experience.

## Basic character

**Precise / Technical / Spatial / Quiet / Bold**

Avoid:

- decorative AI orbs,
- fake neural-network backgrounds,
- excessive shadow cards,
- random gradients,
- glassmorphism for its own sake,
- admin-dashboard aesthetics.

---

## Color grammar

Base surfaces may use:

- off-white / pale neutral,
- charcoal,
- deep navy.

Suggested semantic accents:

- Model / Context: cool blue family
- active execution / success: green family
- boundary / permission / caution: amber family
- failure / NPE: coral-red family
- neutral system structure: gray family

These are not rigid brand colors.

Within one Scene, use **one primary accent, maximum two active accents** unless a real semantic need exists.

Do not recolor every ACT with unrelated palettes.

---

## ACT atmosphere

Each ACT may have a default atmosphere, with Scene-specific exceptions.

Suggested direction:

- ACT 1 MODEL — restrained, clear, relatively light
- ACT 2 CONTEXT — structural / analytical
- ACT 3 BOUNDARY — stronger contrast, darker or sharper boundary language
- ACT 4 LOOP — dynamic state/feedback readability
- ACT 5 AGENT — increasingly resolved/systemic, stronger final synthesis

---

# 10. MOTION SYSTEM

## Core rule

# **MOTION IS EXPLANATION, NOT DECORATION.**

---

## Default timing

Most looping explanatory animations:

approximately 5 seconds plus a short visual rest before repeating.

The central Agent Loop may use approximately 7 seconds.

Do not reset with a hard flash or full disappearance.

---

## Looping Scenes

Good candidates:

- Next Token
- Generation Is Repetition
- The Agent Loop
- Failure Is Context
- Same Model, Different Agent

---

## Slow state-focus Scenes

Good candidates:

- Attention Is Relation
- Repository → Context
- Result Returns

---

## One-shot then stable Scenes

Good candidates:

- Strip It Down
- Execution Layer
- Build the Agent
- Final Synthesis

---

## Mostly static Scenes

- Model Requests. System Executes.
- What Should Developers Look At?
- Intro artwork if static works better
- Appendix artwork

---

# 11. OFFICIAL NPE INCIDENT

This exact educational scenario should remain consistent throughout the work.

Do not substitute an HTTP 500 example.

## User request

> 운영 서버에서 NullPointerException이 발생했다. 원인을 확인하고 수정한 뒤 테스트까지 검증해줘.

---

## Production stack trace

Presentation may reduce this to the two strongest lines.

Full educational version:

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

Do not depend on Java’s version-specific helpful-NPE wording.

---

## Broken code

```java
public UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(),
        user.getProfile().getDisplayName()
    );
}
```

Scenario assumption:

Some legacy users can have `profile == null`.

This is an educational application rule, not a Java/Spring standard behavior.

---

## First patch

```java
public UserResponse toResponse(User user) {
    UserProfile profile = user.getProfile();

    return new UserResponse(
        user.getId(),
        profile != null
            ? profile.getDisplayName()
            : null
    );
}
```

---

## Test failure

The application contract requires users without a profile to return:

`displayName = "Unknown"`

Test result:

```text
UserMapperTest

FAILED
expected: "Unknown"
actual: null
```

Representative test:

```java
assertEquals(
    "Unknown",
    result.displayName()
);
```

---

## Corrected patch

```java
public UserResponse toResponse(User user) {
    UserProfile profile = user.getProfile();

    return new UserResponse(
        user.getId(),
        profile != null
            ? profile.getDisplayName()
            : "Unknown"
    );
}
```

Final result:

```text
TEST PASS
VERIFY
COMPLETE
```

---

## Canonical workflow

`READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY`

When the first test fails, the loop expands:

`... → PATCH → TEST FAILED → READ TEST → PATCH → TEST PASS → VERIFY`

---

# 12. FINAL SCREEN INDEX — 22 SCREENS

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

# 13. SCENE 00 — INTRO / LLM TO AGENT

## Presentation Core Message

Introduce the subject and the artistic identity of the work.

Do not teach technical architecture yet.

### Text

# **LLM to AGENT**

**다음 Token 예측에서 Coding Agent까지**

Optional single line:

> 우리가 매일 쓰는 Coding Agent 안에서는 실제로 무슨 일이 일어날까?

---

## Composition

The approved conceptual artwork is the hero.

Use almost the entire viewport as an editorial poster.

Do not put the illustration inside a card.

Do not center a standard title block above a small image.

Use image negative space intentionally for the title.

Intro may omit ACT indicator and Details button.

Bottom-right next arrow remains available.

---

## Artwork dependency rule

If an already-approved Work 3 illustration asset exists in the repository, reuse it.

If it does not exist, do **not** substitute stock art or a generic AI brain.

Create an original code-native SVG/Canvas/CSS illustration based on the conceptual artwork brief in the Appendix section.

Keep the artwork implementation isolated so a later approved asset can replace it without changing Scene layout.

---

## Motion

Static is acceptable and may be preferred.

If motion is used, it should be extremely restrained:

- one small signal,
- a subtle directional flow,
- no particles,
- no “living poster” noise.

---

## Details

Intro does not require Details.

---

# 14. SCENE 01 — ACT 1 · 1 / THE INCIDENT

## Core Message

A Coding Agent appears to perform a complete development workflow.

Do not explain the architecture yet.

The viewer should first experience the mystery.

---

## 5-second impression

The viewer should immediately notice:

1. `NullPointerException`
2. `UserMapper.java : 42`
3. the problematic Java expression
4. a development workflow progressing toward verification.

---

## Composition

One broad development Incident Workspace.

Not a fake VS Code window.

### Left / upper-left
Large simplified stack trace.

### Center
Large Java code.

Focus:

```java
user.getProfile().getDisplayName()
```

### Right/lower trajectory
A thin workflow trace:

`READ LOG → SEARCH CODE → READ FILE → PATCH → TEST → VERIFY`

Do not make six workflow cards.

---

## Motion

Approximately 5 seconds:

1. NPE focus
2. line 42 focus
3. code line focus
4. workflow advances through patch/test
5. verification state

Then a short visual rest and subtle reset.

---

## Closing question

> **그런데 이 모든 행동을 실제로 하는 것은 무엇일까?**

---

## Details copy

### Scene Summary

운영 서버에서 `NullPointerException`이 발생했다.

Coding Agent에게 로그를 주고 원인 분석부터 수정, 테스트까지 요청하면 Agent는 여러 단계를 거쳐 문제를 해결하는 것처럼 보인다.

```text
READ LOG
→ SEARCH CODE
→ READ FILE
→ PATCH
→ TEST
→ VERIFY
```

이 자료에서는 이 하나의 Incident를 처음부터 끝까지 계속 사용한다.

### Incident Definition

```java
public UserResponse toResponse(User user) {
    return new UserResponse(
        user.getId(),
        user.getProfile().getDisplayName()
    );
}
```

일부 Legacy User는 `profile`이 존재하지 않을 수 있지만 현재 Mapper는 이를 처리하지 않는다.

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

이 예제는 Agent 동작을 설명하기 위해 만든 교육용 Scenario다.

### Why start here?

먼저 Agent가 실제로 수행하는 복잡한 행동을 보고, 이후 주변 시스템을 하나씩 제거하며 Model 자체의 역할을 찾는다.

---

# 15. SCENE 02 — ACT 1 · 2 / STRIP IT DOWN

## Core Message

A Coding Agent and an LLM are not the same scope of system.

Remove external capabilities and the Model’s basic direct output remains token generation.

Strong statement:

# **THE MODEL GENERATES TOKENS.**

Korean support:

> Model 자체의 직접적인 출력은 Token 단위로 생성된다.

---

## Composition

Start visually from Scene 01’s environment.

Sequentially remove:

- test,
- repository artifacts,
- patch/diff,
- workflow/tool trace.

End with:

`MODEL → token output`

and large intentional empty space.

The empty space is part of the explanation.

---

## Motion

One-shot, approximately 2–3 seconds.

Do not loop continuously.

Remain at the final stable state.

---

## Details copy

### What does the model actually produce?

Language Model은 현재 입력을 바탕으로 다음 위치에 올 Token에 대한 값을 계산한다.

```text
Context
   ↓
Language Model
   ↓
Next-token scores
```

이를 반복하면서 긴 출력이 만들어진다.

Presentation의 `THE MODEL GENERATES TOKENS.`는 이 핵심을 단순화한 표현이다.

### Token ≠ Word

Token은 자연어 단어와 동일하지 않다.

Tokenizer에 따라 하나의 단어가 여러 Token으로 분리될 수도 있고, 단어 일부·공백·문장부호 등이 Tokenization에 영향을 줄 수도 있다.

Presentation의 Token 표시는 사람이 읽기 쉽게 단순화한 예시다.

### Important distinction

Coding Agent가 파일을 읽고 Shell을 실행했다고 자연스럽게 말할 수 있지만, 이것을 LLM inference 자체가 File System이나 OS side effect를 직접 수행했다는 뜻으로 해석하지 않는다.

---

# 16. SCENE 03 — ACT 1 · 3 / NEXT TOKEN

## Core Message

The Model produces scores for possible next tokens and decoding determines the next token.

Presentation wording:

> **다음 Token의 가능성을 계산한다.**

---

## Composition

Large upper prompt:

```text
java.lang.NullPointer ___
```

Large readable candidate distribution:

```text
Exception   ━━━━━━━━━━━━━━━━━━━━━━━ 72%
Error       ━━━━━                   17%
Reference   ━━━                     11%
```

These values are illustrative.

Do not use pie charts or dashboard cards.

`Exception` is the single primary accent.

---

## Motion

Approximately 5-second loop plus pause.

- initial values are already readable,
- distribution subtly changes,
- `Exception` becomes the focus,
- it is appended,
- a next prediction state begins,
- settle/reset.

Do not animate probabilities from zero just to create spectacle.

---

## Details copy

### From logits to the next token

Language Model은 가능한 Vocabulary Token 각각에 대해 `logit`이라고 부르는 score를 출력한다.

```text
Context
   ↓
Model
   ↓
Logits
   ↓
Decoding
   ↓
Next Token
```

Softmax를 적용하면 score를 확률 분포로 해석할 수 있다.

실제 생성에서는 설정에 따라 greedy decoding, temperature, top-p sampling 등 여러 decoding strategy가 사용될 수 있다.

따라서 엄밀히는:

> Model이 하나의 Token을 직접 선택한다

보다는

> Model이 다음 Token을 위한 score를 생성하고 decoding 과정에서 다음 Token이 결정된다

가 더 정확하다.

### About the visual example

`Exception 72%` 등의 문자열, Token 경계, 숫자는 실제 특정 Model을 측정한 값이 아니다.

Tokenization과 분포는 tokenizer, Model, Context에 따라 달라진다.

---

# 17. SCENE 04 — ACT 1 · 4 / GENERATION IS REPETITION

## Core Message

A selected token extends the current sequence, and next-token prediction repeats.

---

## Composition

Use one long context/generation lane.

Do not display four stacked cards.

The same sequence grows in place.

Example:

`java.lang.NullPointer`

→ `java.lang.NullPointerException`

→ next pieces.

Small support:

`PREDICT → APPEND → PREDICT → APPEND`

---

## Motion

Approximately 5 seconds with short rest.

Use only 3–4 generated steps.

Do not make it a typing animation.

The conceptual focus is **state growth**, not keystrokes.

---

## Details copy

### Autoregressive generation

```text
Input
↓
Predict next token
↓
Append token
↓
Predict next token
↓
Append token
↓
...
```

결정된 Token이 sequence에 추가되고 그 sequence가 다음 예측의 조건이 된다.

### Does everything recalculate from scratch?

개념적으로 이전 sequence가 다음 예측의 조건이 되지만 실제 inference에서는 KV cache 같은 최적화로 이전 계산의 일부를 재사용할 수 있다.

따라서 모든 Token에서 전체 Context를 완전히 처음부터 다시 계산한다고 이해할 필요는 없다.

### ACT 1 summary

> 아무리 복잡한 코드나 문장을 생성하더라도 Language Model의 기본 생성 과정은 Token 단위 autoregressive generation이다.

Transition question:

> 그렇다면 Model은 무엇을 근거로 다음 Token을 계산할까?

---

# 18. SCENE 05 — ACT 2 · 1 / WHAT ENTERS THE MODEL

## Core Message

The Model bases a call on information actually made visible to it.

---

## Composition

Right side:

`MODEL`

Left/center:

one continuous `CONTEXT` stream, not message cards.

Representative readable items:

- `SYSTEM`
- `USER REQUEST`
- `CODE`
- `TOOL RESULT`

A faint Repository exists outside the main Model input relationship.

Do not connect the full Repository directly to the Model.

---

## Motion

Slow focus movement within the Context stream.

Avoid suction/portal effects.

---

## Details copy

### What do we mean by Context?

이 자료의 Presentation에서 `CONTEXT`는 주로:

> **현재 Model Call에서 LLM이 볼 수 있는 정보**

를 의미한다.

예:

- system instructions,
- user request,
- previous messages,
- code,
- tool results.

### Context is overloaded

실제 Agent Framework에서 `context`는 Application code가 사용하는 local runtime state를 뜻하기도 한다.

`LLM-visible context`와 `local application context`는 같지 않을 수 있다.

이 자료의 Presentation `CONTEXT`는 기본적으로 LLM-visible information을 의미한다.

### Context Window

Model은 한 번의 호출에서 처리할 수 있는 입력량에 한계가 있다.

큰 Repository 전체를 항상 한 번에 넣는 방식은 현실적이지 않을 수 있으며, 이것이 Agent의 Context Management가 필요한 이유 중 하나다.

### Important distinction

`UserMapper.java가 Repository에 존재한다.`

와

`UserMapper.java 내용이 현재 Model Input에 포함되어 있다.`

는 서로 다른 사실이다.

---

# 19. SCENE 06 — ACT 2 · 2 / ATTENTION IS RELATION

## Core Message

Self-Attention lets token representations incorporate information from accessible positions in the context.

Presentation simplification:

> **멀리 떨어진 코드도 관계를 계산할 수 있다.**

---

## Composition

Give 70–80% of the Scene to large actual Java code.

No IDE chrome.

Example:

```java
public UserResponse toResponse(User user) {
    UserProfile profile = user.getProfile();

    // ...
    // spatial distance

    return new UserResponse(
        user.getId(),
        profile.getDisplayName()
    );
}
```

Focus on the distant declaration and use of `profile`.

Use one or two meaningful visual relationships only.

Do not display a neural-network mesh.

---

## Motion

Approximately 5 seconds:

- focus later use,
- briefly evaluate/indicate candidate relationships,
- emphasize the distant relevant location,
- settle.

The full code remains readable throughout.

---

## Details copy

### Why Attention matters here

Transformer의 Self-Attention에서는 Context 내 접근 가능한 위치들이 서로의 representation에 영향을 줄 수 있다.

Presentation의 두 코드 위치 연결은 이 직관을 단순화한 표현이다.

### What the line does NOT mean

연결선은 Model이 인간처럼 “이 변수의 의미를 명시적으로 이해했다”거나 실제 Attention Head 하나가 정확히 이 두 Token만 선택했다는 뜻이 아니다.

### Q, K, V — simplified

```text
Query
   ↓
compare with Keys
   ↓
attention weights
   ↓
weighted combination of Values
```

실제 Transformer에는 multi-head attention, projections, residual connections, normalization, feed-forward layers 등이 함께 존재한다.

Coding Agent의 동작을 이해하는 데 필수적이지 않으므로 Presentation에서는 생략한다.

### Causal attention

Autoregressive decoder Language Model에서는 causal masking 때문에 현재 위치가 아직 생성되지 않은 미래 위치를 볼 수 없다.

---

# 20. SCENE 07 — ACT 2 · 3 / REPOSITORY → CONTEXT

## Core Message

Information existing in the Repository is not automatically information in the current Model Context.

Strong statement:

# **EXISTS ≠ IN CONTEXT**

---

## Composition

Large two-space layout.

### Left: REPOSITORY — about 55%
A broad project tree.

### Right: MODEL CONTEXT — about 30–35%
Only:

- NPE log
- user request
- current relevant code/test snippets.

Repository should feel significantly larger than Context.

---

## Motion

Slow state-selection sequence:

`UserMapper.java → Context`

then:

`UserMapperTest.java → Context`

Everything else remains in the Repository.

Do not animate dozens of files.

---

## Details copy

### Repository exists. Context is selected.

프로젝트에 수천 개의 파일이 있어도 현재 Model Call에 제공되는 정보는 그중 일부일 수 있다.

Agent 시스템은 현재 Task에 맞는 정보를 찾고 Model에게 제공할 수 있다.

### Search is not automatically Context

Search Tool이 파일 목록을 반환했다고 해서 모든 파일 전체가 반드시 Model Input에 포함되는 것은 아니다.

구현에 따라:

- search result 일부,
- 추가 read 결과,
- 파일 일부,
- 요약된 결과

등을 사용할 수 있다.

Presentation의 이동 animation은 **개념적 정보 선택 과정**이다.

### More context is not always better

무조건 많은 Context가 좋은 것은 아니다.

불필요한 정보는 token budget을 사용하고 중요한 정보의 비율을 낮출 수 있다.

중요한 것은 현재 Task에 적절한 Context를 구성하는 것이다.

### Possible context-management techniques

- repository search,
- file selection,
- retrieval,
- session history,
- summarization,
- compaction,
- tool-result selection.

제품마다 방법은 다르다.

### ACT 2 summary

> Model은 Repository 전체를 자동으로 알고 있는 것이 아니다. 현재 Model Call에 제공된 Context를 바탕으로 판단한다.

Transition:

> 필요한 파일이 아직 Context에 없다면 어떻게 가져올까?

---

# 21. SCENE 08 — ACT 3 · 1 / REQUEST STOPS AT THE BOUNDARY

## Core Message

A Tool Request is Model output, not the completed external action.

Strong statement:

# **REQUESTED ≠ EXECUTED**

---

## Composition

Left:

`MODEL`

Right:

`REPOSITORY / ENVIRONMENT`

Center:

one tall, unmistakable `SYSTEM BOUNDARY`.

A readable request:

```text
read_file("src/UserMapper.java")
```

or a restrained structured representation travels toward the boundary and stops.

This Scene combines the old “The Wall” and “Tool Request” ideas.

---

## Motion

Approximately 5-second loop:

- Model output / request becomes clear,
- moves toward Environment,
- stops at Boundary,
- `REQUESTED ≠ EXECUTED`,
- short rest/reset.

Do not show execution yet.

---

## Details copy

### Model output vs side effect

```text
MODEL OUTPUT
read_file("src/UserMapper.java")
```

and actually reading a File System are not the same event.

### What is a Tool Request?

Tool-capable systems can provide a model with information about available tools and their inputs.

For teaching, the request may be displayed as:

```json
{
  "tool": "read_file",
  "arguments": {
    "path": "src/UserMapper.java"
  }
}
```

This does **not** mean all Tool Calls are JSON strings.

The important concept is structured action-request output.

### Why the boundary matters

A request may be:

- executed,
- rejected,
- require approval,
- fail validation,
- fail during execution.

Therefore:

`MODEL DECISION ≠ EXECUTION AUTHORITY`

---

# 22. SCENE 09 — ACT 3 · 2 / EXECUTION LAYER

## Core Message

An external execution/orchestration responsibility turns an allowed Tool Request into real environment work.

---

## Composition

Preserve the semantic left/right space from Scene 08.

Path:

`MODEL → REQUEST → BOUNDARY → EXECUTION → ENVIRONMENT`

The execution path may briefly show:

`VALIDATE → PERMISSION → EXECUTE`

as a flow, not three dashboard cards.

At the end `UserMapper.java` is actually opened/read.

---

## Motion

One-shot, approximately 4–5 seconds:

1. request waits,
2. validation indicator,
3. permission indicator,
4. execution crosses into Environment,
5. file opens,
6. stable final state.

Do not loop continuously.

---

## Details copy

### What we mean by Execution Layer

이 자료에서 Execution Layer는:

> Model이 생성한 행동 요청을 해석하고 필요한 검증을 거쳐 실제 Environment 기능과 연결한 뒤 결과를 Agent workflow에 전달하는 시스템 책임

을 의미한다.

### Not a universal product name

모든 Coding Agent에 `ExecutionLayer`나 `AgentRuntime`이라는 단일 컴포넌트가 존재한다는 뜻이 아니다.

실제 역할은 Runner, Orchestrator, Controller, Tool Runtime, host application, hosted service 등으로 나뉠 수 있다.

### Runtime ≠ Tool

Tool은 실제 capability다.

예:

- `search_code`
- `read_file`
- `apply_patch`
- `run_shell`
- `run_tests`

Execution/Runtime responsibility는 해당 요청을 실제 Tool과 연결하고 실행 흐름을 관리한다.

### Simplified execution path

`REQUEST → VALIDATE → PERMISSION → EXECUTE`

는 개념적 설명이다.

실제 제품이 정확히 이 네 단계를 같은 순서로 수행한다고 주장하지 않는다.

### Permission and Sandbox

Tool availability와 execution authority는 별개일 수 있다.

Sandbox는 실행 가능한 범위를 제한하는 control mechanism의 한 예다.

모든 Agent의 정의 요건이라고 일반화하지 않는다.

---

# 23. SCENE 10 — ACT 3 · 3 / MODEL REQUESTS. SYSTEM EXECUTES.

## Core Message

Model decision/output and execution authority are separate responsibilities.

---

## Composition

A deliberately simple Statement Scene.

Left half:

# **MODEL**
## **REQUESTS**

Right half:

# **SYSTEM**
## **EXECUTES**

A single vertical Boundary divides them.

Small Korean support:

> Model은 행동을 요청하고, 실행 가능한 시스템이 실제 Environment의 행동으로 연결한다.

---

## Motion

Almost static.

A subtle one-time signal across the boundary is enough.

---

## Details copy

### Why separate them?

Model이 행동을 요청했다고 해서 반드시 실행되는 것은 아니다.

Tool Request는 실행될 수도 있고, 거부될 수도 있고, 승인을 기다릴 수도 있고, Error가 발생할 수도 있다.

### Control is part of the broader system

Model capability와 System capability/permission은 별개의 문제다.

매우 강한 Model이라도 read-only 권한만 있다면 파일 수정은 수행하지 못할 수 있다.

반대로 권한을 넓힌다고 Model의 판단 능력이 높아지는 것도 아니다.

### ACT 3 summary

> Model의 Tool Request와 실제 Tool Execution은 다른 책임이다.

Transition:

> 실제로 읽은 파일의 결과는 그 다음에 어디로 갈까?

---

# 24. SCENE 11 — ACT 4 · 1 / RESULT RETURNS

## Core Message

Tool results can become new information for the next model call.

---

## Composition

Use three semantic areas:

`CONTEXT ← EXECUTION ← ENVIRONMENT`

Start with `UserMapper.java` result on the Environment side.

The result becomes a clearly labeled:

`TOOL RESULT`

and is appended/represented in the current Context state.

Do not show it flying directly into a “brain.”

---

## Motion

Slow state transition, approximately 5 seconds:

1. environment result,
2. result returns,
3. `TOOL RESULT`,
4. Context changes,
5. Model becomes ready for another call.

---

## Details copy

### The context changes

Before:

```text
USER REQUEST
MODEL TOOL REQUEST
```

After:

```text
USER REQUEST
MODEL TOOL REQUEST
TOOL RESULT
```

The important change is the information available to subsequent reasoning/generation.

### Tool Result ≠ Training

The Model’s parameters are not updated because a file was read.

The current Agent Run/Session has new information.

### Implementations vary

Tool output may be:

- included directly,
- wrapped,
- filtered,
- summarized,
- stored separately with selected content exposed later.

Presentation’s `TOOL RESULT → CONTEXT` is a conceptual simplification.

---

# 25. SCENE 12 — ACT 4 · 2 / THE AGENT LOOP

## Core Message

Repeated Model Calls plus external execution and feedback create the basic agentic workflow.

---

## Composition

This is one of the most important Anchor Scenes.

Use the browser’s full rectangle as the loop.

Do **not** use a circular infographic with seven cards.

Suggested semantic path:

- top: `MODEL`
- right: `TOOL REQUEST / EXECUTION`
- bottom: `TOOL RESULT`
- left: `UPDATED CONTEXT`
- return to top.

Initial goal remains visible:

> `NPE 원인을 확인하고 수정해줘.`

The whole loop is visible even when paused.

Only the active stage changes emphasis.

---

## Motion

Approximately 7 seconds plus short rest.

Example loop:

1. Model receives current context
2. `search_code("UserMapper")`
3. search executes
4. file candidates return
5. Context updates
6. Model is called again
7. next request becomes `read_file(...)`

Then settle/repeat.

---

## Details copy

### Minimal Agent Loop

```text
GOAL + CURRENT CONTEXT
          ↓
        MODEL
          ↓
     TOOL REQUEST
          ↓
       EXECUTION
          ↓
      TOOL RESULT
          ↓
   UPDATED CONTEXT
          ↓
        MODEL
          ↺
```

### This is not every Agent architecture

Real systems may include multiple/parallel tool calls, handoffs, sub-agents, planning, persistent state, approval, background work, etc.

This figure is the minimal conceptual model for repeated Model–Environment interaction.

### Model Call vs Agent Run

A Model Call is one invocation.

An Agent Run can contain multiple Model Calls and Tool executions while pursuing one user Goal.

---

# 26. SCENE 13 — ACT 4 · 3 / FOLLOW THE NPE

## Core Message

The abstract Agent Loop maps directly onto a realistic coding workflow.

---

## Composition

Return to the Incident Workspace from Scene 01.

This time the workflow is explained using the internal concepts learned so far.

Keep one workspace rather than turning steps into timeline cards.

Flow:

`READ LOG → SEARCH → READ → TRACE → PATCH → TEST`

The first test leads into Scene 14.

---

## Motion

Approximately 7 seconds.

Focus moves through the same workspace:

- log,
- repository search,
- file,
- relevant expression,
- patch,
- test.

Do not replace the entire screen for every step.

---

## Observable-state rule

Never fake hidden Chain-of-Thought.

Do not show:

- `AI THINKING...`
- private reasoning paragraphs,
- internal monologue.

Show only observable/teachable workflow information:

- Context items,
- Tool Requests,
- Tool Results,
- file/diff/test state.

---

## Details copy

### Read log

The stack trace adds:

`UserMapper.java:42`

to the current useful information.

### Search repository

Representative request:

```text
search_code("UserMapper")
```

Representative result:

```text
src/main/java/.../UserMapper.java
src/test/java/.../UserMapperTest.java
```

### Read file

Representative request:

```text
read_file("src/main/java/.../UserMapper.java")
```

Relevant code:

```java
user.getProfile().getDisplayName()
```

### Trace cause

The material may say the system identifies `profile == null` as the likely cause, but it must not render hidden reasoning.

### Patch

Model-generated patch content and actual file modification are conceptually separate.

### Test

`run_tests("UserMapperTest")` causes actual test execution through the available environment/tooling.

The returned test result becomes feedback for the next step.

---

# 27. SCENE 14 — ACT 4 · 4 / FAILURE IS CONTEXT

## Core Message

A failed validation result can change the next action.

Strong concept:

> **실패 결과도 다음 판단을 위한 정보다.**

---

## Composition

Large central Test Result:

```text
UserMapperTest

FAILED
expected: "Unknown"
actual: null
```

Current patch remains visible nearby.

Updated Context / next action occupies a separate meaningful region.

Use red/coral as focused failure accent, not a full-screen alarm.

---

## Required interaction

Provide a compact `FAIL | PASS` state control.

Default presentation automatically demonstrates the FAIL path.

### FAIL
Failure result returns → relevant test/requirement is read → patch changes → test runs again.

### PASS
Show the path toward verify/complete.

Interaction must work without making the Scene feel like a game.

---

## Motion

Approximately 7 seconds for default FAIL flow.

---

## Details copy

### Failure does not mean training

Do not say the Model is retrained or permanently learns.

More accurate:

> 실패 결과가 현재 Agent Run의 Context/State에 반영되고 다음 Model Call이 그 정보를 근거로 새로운 행동을 생성할 수 있다.

### Before

```text
NPE Log
UserMapper.java
Current Patch
```

### After

```text
NPE Log
UserMapper.java
Current Patch

TEST RESULT
expected: "Unknown"
actual: null
```

### Next action

Read the relevant test:

```java
assertEquals(
    "Unknown",
    result.displayName()
);
```

Then correct:

```java
profile != null
    ? profile.getDisplayName()
    : "Unknown"
```

Then rerun the test.

### Why validation matters

The important achievement is not merely generating a patch.

The system can obtain real Environment feedback and use it in another step.

---

# 28. SCENE 15 — ACT 4 · 5 / WHEN DOES IT STOP?

## Core Message

Agent loops need termination conditions.

An Agent is not valuable because it repeats forever.

---

## Composition

Re-use the Agent Loop visual language, but add clear exit paths.

Primary successful path:

`TEST PASS → VERIFY → TASK COMPLETE`

Secondary exit concepts may appear subtly:

- approval required,
- permission denied,
- max turns/iterations,
- error.

Do not give all exits equal visual weight.

---

## Motion

Approximately 5 seconds.

One loop segment completes and exits to `DONE`.

The loop visibly stops.

---

## Details copy

### Successful completion

```text
PATCH
↓
TEST PASS
↓
VERIFY
↓
TASK COMPLETE
```

A system may stop when a final output is produced or when no additional tool action is required.

### Other stop conditions

- user approval,
- permission denial,
- max turns/iterations,
- unrecoverable errors,
- time/cost/resource limits.

Specific mechanisms vary by framework.

### Agent ≠ infinite autonomy

For this material:

> **Agent는 현재 상태를 바탕으로 다음 행동을 선택하고, 결과를 다시 상태에 반영하며, 목표 또는 종료 조건에 도달할 때까지 반복할 수 있는 시스템이다.**

### ACT 4 summary

> Agent는 한 번 Tool을 호출하는 Model이 아니라, 결과를 다시 보고 다음 행동을 선택할 수 있는 반복 시스템이다.

---

# 29. SCENE 16 — ACT 5 · 1 / BUILD THE AGENT

## Core Message

Tool Calling alone does not describe the complete Coding Agent experience.

Build the broader system around the Model.

This Scene combines the old “Tool Calling Is Not Enough” and “Agent Anatomy” Scenes.

---

## Composition

Start with:

`MODEL + read_file()`

inside a very large intentionally incomplete space.

Then resolve the empty system into four large responsibility regions:

1. `CONTEXT`
2. `REPOSITORY / TOOLS`
3. `EXECUTION`
4. `CONTROL`

Model stays central but not oversized.

Do not produce nine component cards.

The regions themselves are the architecture.

---

## Motion

One-shot, approximately 5 seconds.

The overall system is faintly perceptible from the beginning.

Focus/definition resolves in order:

`MODEL → CONTEXT → TOOLS → EXECUTION → CONTROL`

Then remain stable.

Do not pop components into existence like a feature list.

---

## Presentation detail limit

Do not put every subcomponent on screen.

Presentation may show only a few representative capability words.

Move these to Details:

- context manager,
- shell,
- browser/API,
- permissions,
- sandbox,
- approval,
- guardrails,
- validation,
- session management,
- loop control.

---

## Details copy

### Model is central, but not alone

Model은 Agent의 판단과 출력 생성에서 핵심 역할을 한다.

하지만 실제 Repository side effect, test execution, permission control 등은 broader system responsibilities다.

### CONTEXT

현재 Model 판단에 사용할 정보와 그 관리 책임.

### REPOSITORY / TOOLS

External capabilities such as:

- search,
- read,
- edit,
- patch,
- shell,
- tests.

Tool execution location and implementation vary.

### EXECUTION

Connects structured requests to actual capabilities and handles results/errors as required.

This is a responsibility area, not a universal component name.

### CONTROL

Representative responsibilities:

- permissions,
- sandbox,
- approval,
- guardrails,
- validation.

Not every Agent uses the exact same set.

### Validation

Validation means checking actual results rather than trusting “I changed it” text.

Examples:

- unit test,
- integration test,
- build,
- lint,
- type check,
- diff review.

### What is an Agent Harness?

`Agent Harness` is useful shorthand for the broader surrounding system that turns a Model into a working Agent experience.

Do not present it as a standardized mandatory architecture term.

Different frameworks draw the `Agent`, `Runner`, `Runtime`, `Harness` boundaries differently.

---

# 30. SCENE 17 — ACT 5 · 2 / SAME MODEL, DIFFERENT AGENT

## Core Message

The same underlying Model can participate in different Agent systems with different capabilities and outcomes.

This does **not** mean Model quality is irrelevant.

---

## Composition

The same `MODEL` is visibly shared.

Below/around it, two different Agent environments diverge.

### A — Minimal system
- NPE log only
- few tools
- weak/no validation

Outcome:

`PATCH GENERATED`

### B — Better-equipped task system
- targeted context
- repository search
- read/edit
- tests
- scoped permissions
- validation

Outcome:

`PATCH VERIFIED`

Do not use a business comparison table.

Make them feel like two real system spaces.

---

## Required interaction

Compact A/B state selector.

Suggested labels:

`MINIMAL | FULL`

or simply `A | B`.

Default auto sequence must still explain the comparison without interaction.

---

## Details copy

### What the comparison means

The message is **not** “Model capability does not matter.”

Model reasoning/coding ability can strongly affect Agent quality.

The point is that actual Agent experience can also depend on:

- instructions,
- Context quality,
- available Tools,
- Tool quality,
- environment,
- permissions,
- validation,
- loop orchestration.

### Tool quality matters

A tool named `search_code` may be simple text search or a richer symbol/semantic system.

The existence of a Tool does not guarantee equal quality.

### Context quality matters

`MORE CONTEXT` and `BETTER CONTEXT` are not synonyms.

### Validation changes outcomes

Two systems may produce the same first patch but diverge when only one actually tests and revises it.

### Comparison caveat

This is a conceptual comparison, not an empirical benchmark or a claim about specific commercial products.

---

# 31. SCENE 18 — ACT 5 · 3 / WHAT SHOULD DEVELOPERS LOOK AT?

## Core Message

Give developers four durable questions for evaluating and using Coding Agents.

---

## Composition

Large typography, generous space.

Four quadrants may be used, but **not four cards**.

### 1
# **WHAT DOES IT SEE?**
무엇을 Context로 보고 있는가?

### 2
# **WHAT CAN IT DO?**
어떤 Tool을 사용할 수 있는가?

### 3
# **WHAT IS IT ALLOWED TO DO?**
어디까지 실행할 수 있는가?

### 4
# **HOW IS IT VERIFIED?**
결과를 어떻게 검증하는가?

---

## Motion

Static or very slow focus shift.

The presenter should be able to point at each question.

---

## Details copy

### WHAT DOES IT SEE?

Examples:

- working directory,
- project instructions,
- files read,
- search results,
- logs,
- previous tool results,
- conversation history.

Question:

> 현재 AI가 어떤 정보를 근거로 판단하고 있는가?

### WHAT CAN IT DO?

Examples:

- Search
- Read
- Edit
- Shell
- Test
- Browser/API
- Git

Tool scope affects reachable task scope.

### WHAT IS IT ALLOWED TO DO?

Examples:

- workspace write boundary,
- Shell restrictions,
- network access,
- external paths,
- approval requirements.

More permission is not automatically better.

### HOW IS IT VERIFIED?

Examples:

- Test
- Build
- Lint
- Type Check
- Diff
- Human Review

An Agent saying “수정했습니다” is not itself sufficient validation.

---

# 32. SCENE 19 — ACT 5 · 4 / BACK TO THE INCIDENT

## Core Message

Return to the exact opening Incident.

The workflow is the same.

The viewer’s mental model has changed.

---

## Composition

Reuse Scene 01’s layout as closely as possible.

The same:

- stack trace,
- Java code,
- workflow.

This time only the currently relevant internal concept appears as a restrained label.

Examples during the sequence:

`TOOL RESULT → CONTEXT`

`MODEL REQUEST`

`EXECUTION`

`RESULT → UPDATED CONTEXT`

`NEXT MODEL CALL`

Do not label everything simultaneously.

---

## Motion

Approximately 7 seconds.

Replay the same NPE development sequence, now exposing the conceptual layers.

This is the main narrative return.

---

## Details copy

### READ LOG

`TOOL EXECUTION → TOOL RESULT → CURRENT CONTEXT`

### SEARCH

`CURRENT CONTEXT → MODEL CALL → TOOL REQUEST → EXECUTION`

### READ FILE

`MODEL REQUEST → FILE TOOL → TOOL RESULT → UPDATED CONTEXT`

### PATCH

`MODEL OUTPUT → EDIT/PATCH REQUEST → EXECUTION → WORKSPACE CHANGE`

### TEST FAILED

`TEST EXECUTION → FAILURE RESULT → UPDATED CONTEXT`

### RETRY

`UPDATED CONTEXT → NEXT MODEL CALL → NEXT ACTION`

### VERIFY

`TEST PASS → VALIDATION → COMPLETE`

### What changed?

The behavior is the same as Scene 01.

At the beginning it looked like one opaque `AI ACTION`.

Now it can be decomposed into:

`MODEL / CONTEXT / REQUEST / EXECUTION / RESULT / LOOP / VALIDATION`

The viewer’s interpretation has changed.

---

# 33. SCENE 20 — ACT 5 · 5 / FINAL SYNTHESIS

## Core Message

Assemble the complete conceptual system.

Final statement:

# **THE MODEL IS NOT THE AGENT.**

Korean explanation:

> **Model은 Agent의 핵심이지만, Model을 실제 Environment와 연결하고 결과를 다시 판단하게 만드는 주변 시스템과 Loop가 함께 우리가 경험하는 Coding Agent를 만든다.**

---

## Composition

Start with central:

`LLM`

Around it, already-faint system regions gradually become clear:

- `CONTEXT`
- `TOOLS`
- `EXECUTION`
- `CONTROL`
- `VALIDATION`
- `LOOP`

At the end a single enclosing boundary/label resolves:

`CODING AGENT`

Avoid a dense enterprise-architecture diagram.

The final visual should feel resolved, not crowded.

---

## Motion

One-shot, approximately 5 seconds.

Do not have every component pop in.

Reveal clarity rather than existence:

1. Model
2. Context
3. Tools / Execution
4. Control / Validation
5. Loop
6. overall Coding Agent boundary.

Remain stable afterward.

---

## Final questions

Small but readable closing echo:

- `What does it see?`
- `What can it do?`
- `What is it allowed to do?`
- `How is it verified?`

---

## Details copy

### The statement does not mean the Model is unimportant

Model은 Coding Agent의 핵심 구성요소다.

하지만 Agent의 실제 행동은 Model 단독으로 만들어지지 않는다.

The Model:

- receives Context,
- produces outputs/Tool Requests,
- receives new results through the system,
- may choose another next action.

Broader system responsibilities can include:

- execution,
- tools,
- permissions,
- sandbox,
- validation,
- approval,
- loop control.

### Conceptual definition used in this work

> **Coding Agent는 Language Model을 실제 개발 Environment와 연결하여, 현재 상태를 바탕으로 필요한 행동을 선택하고 그 실행 결과를 다시 다음 판단에 사용할 수 있도록 구성된 시스템이다.**

This is the conceptual definition used in this learning material, not a claim that all frameworks use exactly the same formal definition.

### Why definitions differ

`Agent`, `Runner`, `Runtime`, `Harness`, `Orchestrator` may denote different boundaries across frameworks.

The work intentionally teaches **responsibilities**, not one universal naming scheme.

### Final mental model

```text
CURRENT CONTEXT
      ↓
    MODEL
      ↓
 TOOL REQUEST
      ↓
  EXECUTION
      ↓
     TOOL
      ↓
 ENVIRONMENT
      ↓
 TOOL RESULT
      ↓
UPDATED CONTEXT
      ↺
```

Possible surrounding controls:

`PERMISSIONS / SANDBOX / APPROVAL / VALIDATION / LOOP CONTROL`

---

# 34. APPENDIX A1 — LLM TO AGENT ARTWORK

## Purpose

A final artwork page for visual/artistic closure.

No ACT number.

Optional tiny label:

`APPENDIX`

Presentation should show the artwork almost by itself.

No animation.

---

## Relationship to Intro

The same artwork appears at the beginning and the end.

At the beginning it is a question.

At the end it can be read as an answer.

> **처음에는 질문이고, 마지막에는 답이 된다.**

This is an intentional artistic and learning structure.

---

## Artwork conceptual brief

The image should **not** look like a conventional architecture diagram.

It should be an editorial conceptual illustration that can be appreciated as artwork even before the labels are understood.

It should suggest:

- a Model core/origin,
- information entering as Context,
- a requested action leaving,
- a meaningful boundary,
- execution/environment outside the Model,
- feedback returning,
- a loop rather than a one-way pipeline,
- visible control/constraint.

Avoid:

- literal robot,
- AI brain,
- humanoid,
- glowing cyberpunk mesh,
- random circles connected by lines,
- product logos,
- screenshot collage.

The visual language should be sophisticated, geometric/editorial, restrained and consistent with Build Canvas.

---

## Appendix Details copy

### About the artwork

이 삽화는 특정 Coding Agent 제품의 실제 내부 Architecture Diagram이 아니다.

자료 전체에서 설명한 개념을 하나의 시각적 장면으로 압축한 Conceptual Artwork다.

각 요소는 실제 Component를 1:1로 복제하기보다 책임과 관계를 상징한다.

### MODEL

현재 Context를 입력받고 출력을 생성하는 핵심 Model을 상징한다.

`THE MODEL GENERATES TOKENS.`의 출발점이다.

그러나 전체 화면을 독점하지 않는다.

### CONTEXT

User Goal, Instructions, Code, Log, Tool Results 등 현재 판단에 사용되는 정보 흐름을 상징한다.

Repository 전체가 이미 Model 내부에 있다는 뜻이 아니다.

### TOOL REQUEST

Model에서 Environment 방향으로 나가는 signal은 행동 그 자체가 아니라 행동 요청을 나타낸다.

`MODEL REQUESTS.`

### BOUNDARY

Model output과 실제 side effect 사이의 책임 경계를 상징한다.

Requested와 Executed는 다르다.

### EXECUTION

요청이 실제 capability와 연결되는 시스템 책임을 나타낸다.

`SYSTEM EXECUTES.`

### ENVIRONMENT

Repository, File System, Shell, Test Runner, external services 등 실제 개발 작업이 발생하고 feedback을 얻는 외부 환경을 나타낸다.

### TOOL RESULT

Environment의 결과가 다음 판단에 사용할 수 있는 정보로 돌아오는 흐름을 의미한다.

Model parameter retraining을 의미하지 않는다.

### LOOP

`MODEL → REQUEST → EXECUTION → RESULT → UPDATED CONTEXT → MODEL`

의 반복적 interaction을 상징한다.

모든 Agent 제품의 실제 내부 순서를 그대로 묘사하는 것은 아니다.

### CONTROL

Permission, Sandbox, Approval, Validation 등의 제한과 검증 책임을 상징할 수 있다.

### Final interpretation

> Coding Agent를 Model과 Environment 사이의 상태·행동·Feedback Loop로 바라보는 개념적 Mental Model을 한 장에 압축한 작품.

---

# 35. ACT TRANSITIONS

Do not add separate full chapter slides unless actual implementation proves one is necessary.

On the first Scene of a new ACT, integrate:

- small `ACT N`,
- larger ACT name,
- one short framing question.

Example:

`ACT 3`

`BOUNDARY`

`Model은 어떻게 실제 Environment와 연결되는가?`

This information should settle into the actual first Scene rather than becoming a long title animation.

The viewer must notice a new chapter without feeling that the presentation stopped.

---

# 36. SCENE SILHOUETTE CHECK

When all Scenes are shown as thumbnails, the visual silhouettes must differ.

Expected rhythm:

```text
ARTWORK

INCIDENT
MINIMAL MODEL
PROBABILITY
TOKEN FLOW

CONTEXT STREAM
FULL-SCREEN CODE
REPOSITORY VS CONTEXT

BOUNDARY
EXECUTION PATH
GIANT STATEMENT

RETURNING RESULT
FULL-SCREEN LOOP
INCIDENT WORKSPACE
TEST FAILURE
LOOP EXIT

EMPTY-TO-SYSTEM BUILD
A/B ENVIRONMENTS
GIANT QUESTIONS
INCIDENT RETURN
FINAL SYSTEM

ARTWORK
```

If several consecutive Scenes look like “header + 3 cards + footer,” redesign them.

---

# 37. IMPLEMENTATION ARCHITECTURE GUIDANCE

This section is guidance, not permission to ignore the Scene specifications.

## Suggested separation

Keep a small presentation shell responsible for:

- current Scene,
- keyboard navigation,
- bottom arrow navigation,
- Details open/close state,
- motion pause state,
- Scene transition,
- ACT position.

Each Scene should own its actual composition.

Use data structures for:

- scene metadata,
- ACT labels,
- Details content,
- references.

Do not force the Presentation composition itself into data-driven card templates.

---

## Animation pause

Expose a single application-level concept such as:

`isPresentationMotionPaused`

Scenes with animation should respect it.

Opening Details sets pause.

Closing Details resumes where reasonable.

Avoid every Scene inventing unrelated pause logic.

---

## Reduced motion

Even though desktop presentation is the main target, respect `prefers-reduced-motion`.

The Scene must remain fully understandable without motion.

---

## Code rendering

Use real text/code, not rasterized screenshots of code.

Prefer semantic code blocks that can scale cleanly.

IDE chrome is unnecessary.

---

## Performance

Avoid heavy libraries solely for decorative effects.

Use CSS/SVG/React animation techniques appropriate to the existing stack.

Animations should remain smooth on an ordinary presentation laptop.

---

# 38. IMPLEMENTATION PHASES

Again: these are one continuous Codex assignment.

Do not stop for approval between phases.

## Phase 0 — Audit

Before editing:

1. inspect existing Work 3 code,
2. understand current routing/static export,
3. identify reusable safe primitives,
4. identify old Presentation/Article structures that should be removed,
5. confirm no changes are required outside Work 3.

---

## Phase 1 — Global shell

Implement first:

- 100svh Presentation shell,
- Scene state/navigation,
- `ACT N · M`,
- Details button,
- bottom-right arrows,
- horizontal Scene transition,
- Details overlay,
- internal Details scroll,
- motion pause behavior,
- desktop sizing.

Do not spend excessive time polishing this before actual Scenes exist.

---

## Phase 2 — Intro + ACT 1 + ACT 2

Build Scenes 00–07 completely.

Establish visual quality and typography.

Do not treat these as a prototype that leaves later Acts unfinished.

---

## Phase 3 — ACT 3 + ACT 4

Build Scenes 08–15.

This is the most important functional/educational core.

Special QA for:

- Boundary semantics,
- Tool Request vs execution,
- Result return,
- 7-second Agent Loop,
- NPE workflow,
- FAIL/PASS interaction,
- termination.

---

## Phase 4 — ACT 5 + Appendix

Build Scenes 16–20 and Appendix A1.

Special QA for:

- Build the Agent not becoming a card architecture,
- A/B interaction,
- return to initial Incident,
- Final Synthesis clarity,
- artwork reuse.

---

## Phase 5 — Details content

Implement all Details copy from this document.

Details must not be placeholder lorem ipsum or one-sentence summaries.

Use readable:

- headings,
- paragraphs,
- code,
- mini diagrams,
- references.

---

## Phase 6 — Final editorial polish

Review the whole work as one experience.

Remove:

- duplicate explanatory labels,
- unnecessary microcopy,
- repeated UI patterns,
- decorative motion.

Check 20–30 minute presentation rhythm.

---

## Phase 7 — Build and QA

Run project build/static-export procedures appropriate to the existing repository.

Verify:

- TypeScript/lint/build as available,
- no Presentation vertical scroll,
- no essential text hidden by motion,
- keyboard navigation,
- arrow navigation,
- Details pause,
- Details scrolling,
- two interactions,
- GitHub Pages compatibility.

---

# 39. DO NOT DO

The following are explicit anti-requirements.

Do not:

- preserve the old repeated topbar/title/boxed-scene layout merely because it already exists,
- build a generic admin/SaaS dashboard aesthetic,
- use cards as the default visual grammar,
- fill empty space just because it exists,
- add decorative AI animations,
- create hidden content that only appears after a long animation,
- require the user to press keys to advance internal animation steps,
- add Replay buttons everywhere,
- introduce Presentation vertical scrolling,
- shrink Presentation text until it becomes unreadable in a meeting room,
- make Details constrain Presentation width,
- make every Scene interactive,
- show hidden model Chain-of-Thought,
- describe test feedback as model retraining,
- describe Tool Request as guaranteed execution,
- imply every Agent has an identically named Runtime/Harness,
- turn Attention into a misleading human-semantic “mind map,”
- compare commercial Agent products without evidence,
- modify other Build Canvas works as part of this redesign.

---

# 40. ACCEPTANCE TESTS

The redesign is not complete until all criteria below are satisfied.

## 40.1 Content completeness

- [ ] Intro exists
- [ ] ACT 1 has 4 complete Scenes
- [ ] ACT 2 has 3 complete Scenes
- [ ] ACT 3 has 3 complete Scenes
- [ ] ACT 4 has 5 complete Scenes
- [ ] ACT 5 has 5 complete Scenes
- [ ] Appendix artwork Scene exists
- [ ] every applicable Scene has completed Details content
- [ ] official NPE scenario remains consistent

---

## 40.2 5-Second Test

For every Scene:

> A first-time viewer should know what to look at and approximately what the Scene is explaining within five seconds.

If not, simplify.

---

## 40.3 Focus Test

Each Scene has one primary focal point.

Elements must not compete equally for attention.

---

## 40.4 Static Test

Pause every animation.

The Scene must remain a complete explanation.

---

## 40.5 Motion Test

For every animation, identify whether it explains:

- sequence,
- relationship,
- state change,
- result of a choice.

If none apply, remove the motion.

---

## 40.6 Web-native Test

The work uses State, Time, Space, Depth or Interaction where they materially improve explanation.

Do not force Web-native features into scenes where a static statement is stronger.

---

## 40.7 Template Test

Neighboring Scenes must not look like the same reusable cards with new content.

---

## 40.8 Learning Test

After each Scene, the viewer should be able to state the Core Message in their own words.

---

## 40.9 Medium Test

Ask:

> Would this communicate identically as a static PowerPoint slide?

If yes, determine whether web can improve the concept with state/time/space.

If not, keep it static rather than adding meaningless motion.

---

## 40.10 Meeting-room readability

At desktop target sizes:

- [ ] core text is readable at distance,
- [ ] code focus is readable,
- [ ] Stack Trace is intentionally simplified,
- [ ] no critical tiny labels,
- [ ] Details carries long explanations.

---

## 40.11 Navigation/Details

- [ ] Left/right keyboard navigation works
- [ ] Bottom-right arrow navigation works
- [ ] Presentation never vertically scrolls
- [ ] Details opens as overlay
- [ ] Details scrolls internally
- [ ] opening Details pauses Scene motion
- [ ] closing Details restores a sensible state
- [ ] Scene navigation does not break when Details is used

---

## 40.12 Interaction

- [ ] Failure Is Context has meaningful FAIL/PASS state
- [ ] Same Model, Different Agent has meaningful A/B comparison
- [ ] both remain understandable without interaction

---

## 40.13 Technical accuracy

- [ ] illustrative probabilities are identified as illustrative in Details
- [ ] Token is not equated with word
- [ ] Context definition is scoped to LLM-visible input
- [ ] Attention visualization is identified as conceptual
- [ ] Tool Request is not described as guaranteed execution
- [ ] JSON is not described as the universal Tool Call format
- [ ] Execution Layer is not presented as a universal component name
- [ ] Tool Result does not imply training
- [ ] Agent Loop is labeled a minimal conceptual model
- [ ] Permissions/Sandbox/Validation are examples, not formal universal requirements
- [ ] “THE MODEL IS NOT THE AGENT.” is explained without diminishing Model importance

---

## 40.14 Repository safety

Before completion:

- [ ] `git diff` has been reviewed
- [ ] unrelated works have not been changed
- [ ] no credentials/secrets/account information were introduced
- [ ] static assets are repository-safe
- [ ] GitHub Pages build remains compatible

---

# 41. PRESENTATION TIMING TARGET

The work should naturally support approximately 20–30 minutes.

Suggested rhythm:

- Intro — ~30 sec
- ACT 1 — ~3–4 min
- ACT 2 — ~4 min
- ACT 3 — ~4 min
- ACT 4 — ~7–8 min
- ACT 5 / Ending — ~5–6 min

Details are **not** intended to be read during the default presentation flow.

They support:

- individual review,
- follow-up questions,
- deeper technical study.

---

# 42. FINAL LEARNING CHECK

After the work, the viewer should be able to answer:

1. LLM 자체가 생성하는 직접적인 출력은 무엇인가?
2. Token과 자연어 단어는 왜 정확히 같은 개념이 아닌가?
3. Repository에 존재하는 정보와 현재 Model Context는 왜 다른가?
4. Self-Attention을 이 자료에서는 어떤 수준으로 이해해야 하는가?
5. Tool Request와 실제 Tool Execution은 왜 구분해야 하는가?
6. Execution Layer라는 말은 이 자료에서 무엇을 뜻하는가?
7. Tool Result는 어떻게 다음 Model 판단에 영향을 줄 수 있는가?
8. Agent Loop는 무엇인가?
9. Test Failure가 왜 유용한 Feedback이 될 수 있는가?
10. Loop는 왜 종료 조건을 필요로 하는가?
11. 왜 Tool Calling 하나만으로 Coding Agent 전체를 설명하기 어려운가?
12. 같은 Model이라도 Agent Experience가 달라질 수 있는 이유는 무엇인가?
13. Coding Agent를 사용할 때 개발자는 어떤 네 질문을 확인해야 하는가?
14. `THE MODEL IS NOT THE AGENT.`라는 문장의 정확한 뜻은 무엇인가?

---

# 43. REFERENCE BASELINE

Use these as the primary technical reference baseline when implementation copy needs verification.

## Transformer / Attention

**Vaswani et al., “Attention Is All You Need” (2017)**  
https://arxiv.org/abs/1706.03762

---

## OpenAI Agents SDK — Agents

Useful for understanding one contemporary framework’s separation of Agent configuration and orchestration.

https://openai.github.io/openai-agents-python/agents/

---

## OpenAI Agents SDK — Running Agents

Useful for the Runner lifecycle and the basic model/tool/result loop.

https://openai.github.io/openai-agents-python/running_agents/

JavaScript guide:

https://openai.github.io/openai-agents-js/guides/running-agents/

---

## OpenAI Agents SDK — Context Management

Useful because it explicitly distinguishes local application context and LLM-visible context.

https://openai.github.io/openai-agents-python/context/

---

## OpenAI Agents SDK — Tools

Useful for understanding that tools can have hosted, local/runtime, function and other execution models.

https://openai.github.io/openai-agents-python/tools/

---

## OpenAI — Running Codex safely

Useful as a concrete example of sandbox and approval policies controlling an actual Coding Agent execution boundary.

https://openai.com/index/running-codex-safely/

---

## Anthropic Claude documentation

Use official Claude Platform documentation when cross-checking Tool Use / Tool Result behavior so the material does not accidentally imply that one vendor’s exact API structure is universal.

---

# 44. FINAL DESIGN INTENT

The first time the viewer sees the NPE Incident, the reaction should be:

> **“Agent가 알아서 문제를 해결한다.”**

After the work, seeing the same Incident should produce a different interpretation:

> 로그와 코드가 Context를 구성하고, Model이 다음 행동을 요청하고, 실행 가능한 시스템이 Tool을 수행하며, 그 결과가 다시 다음 판단에 사용되고, 테스트 실패까지 Feedback이 되어 Loop가 계속되는구나.

At that moment the primary educational goal is complete.

The secondary goal is equally important:

> **“이런 개념을 웹에서는 이런 방식으로 설명할 수도 있구나.”**

That second reaction is part of the identity of Build Canvas.

---

# END OF SPECIFICATION

This file is the Single Source of Truth for the Work 3 redesign.

Implementation phases are sequencing instructions, not partial deliverables.

Complete the entire specification before declaring the first redesign finished.

---

# 45. IMPLEMENTATION DELTAS

The build intentionally differs from earlier sections in the places below. They are
recorded here so this document stays the Single Source of Truth and future reviews do
not re-open settled decisions.

## 45.1 Scene 02 statement

Section 15 proposes `THE MODEL GENERATES TOKENS.`

The implementation uses:

# **THE MODEL PREDICTS THE NEXT TOKEN.**

Reason: it matches the work's subtitle (`다음 Token 예측에서 Coding Agent까지`) and sets up
Scene 03, which then refines prediction into `scores + decoding`. Details for Scene 03
still carry the precise wording. Every reference to the statement — Appendix A1 included —
must quote this form.

## 45.2 Scene 00 hook line

The optional line in section 13 (`우리가 매일 쓰는 Coding Agent 안에서는 …`) is deliberately
absent from the Presentation, so the Intro stays an editorial poster. A test asserts it
stays out of the Scene source.

## 45.3 Scene 00 Details

Section 13 states the Intro does not require Details. The implementation gives it a
reading guide (structure, shortcuts, the five ACT questions, and the simplification
notice). This is what makes the Details affordance discoverable at all — without it the
first screen has no `Details` button and the accuracy layer can go unnoticed.

## 45.4 ACT 3 question

The framing question used everywhere is section 3's wording:

`Context에 없는 정보는 어떻게 실제 Environment에서 가져오는가?`

It bridges from ACT 2's unresolved problem. `actQuestion` in `content/pages.ts` is the
only place any ACT question is declared; the ACT lead reads from it.

## 45.5 Persistent chrome additions

Section 6.3 lists the minimum chrome. Two additions sit inside the existing chrome scale
and do not introduce a navigation bar or large page numbers:

- a five-segment ACT rail beside `ACT N · M`,
- `N / 22` beside the bottom-left Scene caption.

## 45.6 Overview overlay

`O` opens a full-screen index of all 22 Scenes grouped by ACT, each ACT showing its
framing question; selecting a Scene navigates through the existing history handling.
Section 6.4 forbids scroll-based and swipe Scene navigation, not a deliberate index.
Opening the overview pauses Scene motion, like Details.

## 45.7 NPE line numbers

The Java renderings are anchored so the highlighted expression is line 42, matching
`at UserMapper.toResponse(UserMapper.java:42)` in the stack trace. The broken file runs
39–44, the patched file 39–48, and Scene 06's relational variant 39–49. Scene 06 shows the
patched shape before the story patches it, so its Details name it as a variant rather than
the current state of the file.

## 45.8 Scene 19 recap

The recap keeps Scene 01's seven-step workflow, but the `TEST` step now carries
`TEST FAILED → CONTEXT → RETRY` with a loop-back arc to `PATCH`, so the recap contains the
failure-and-retry pivot ACT 4 taught rather than a clean linear success.
