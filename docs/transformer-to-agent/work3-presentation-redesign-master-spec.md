# Build Canvas Work 3 — LLM to Agent
## Presentation Redesign Master Spec

> **Status:** Latest / highest-authority Work 3 design specification  
> **Repository:** `gmldbs25/build-canvas`  
> **Target:** `projects/transformer-to-agent`  
> **Scope:** Presentation scene structure, visual composition, motion, scene transitions, scene removal, technical guardrails, and interaction preservation

---

# 0. DOCUMENT AUTHORITY

This document is the **highest-authority design specification for Work 3**.

Current document set:

1. `docs/transformer-to-agent/work3-presentation-redesign-master-spec.md`
   - highest authority for Scene structure, Presentation composition, animation, visual hierarchy, navigation, removal, technical guardrails, and implementation behavior.
2. `docs/transformer-to-agent/work3-details-article-v4.md`
   - authoritative source for current Details wording, narrative depth, and explanatory copy.

The former `work3-redesign-spec.md` and `work3-details-article-v3.md` are obsolete and must not be used.

If the two current documents appear to conflict:

1. technical guardrails in this master always apply;
2. Presentation structure / motion / interaction → this master wins;
3. Details prose → Details v4 wins, as long as it does not contradict this master.

**Codex must read this master first and Details v4 second before implementation.**

## Current navigable sequence

Legacy IDs are retained for traceability with the current codebase.

```text
00
01
02
03
04
05
06
07
08
09
10
11
12
13
14
15
16
19
A1
```

Legacy Scenes **17, 18, and 20 are removed from both Presentation and current Details structure.**

This results in:

- 18 main screens: `00`, `01–16`, `19`
- 1 artwork screen: `A1`
- **19 navigable screens total including A1**

Progress/index UI must reflect the real sequence rather than `N / 22`.

---

# 1. REDESIGN GOAL

The current Details storyline and the Scene redesign decisions are complete.

The implementation goal is not to add more explanation. It is to translate the story into a Presentation where **time, causality, focus, and changing state are immediately legible**.

The causal chain is:

1. Production NPE occurs.
2. Focus moves from the apparent Agent workflow to the LLM itself.
3. One next Token is calculated.
4. Token generation repeats.
5. We switch from output generation to the Model Context.
6. Later Model Calls can receive richer relevant Context.
7. Repository access is separated from Repository contents being in Context.
8. The Model emits a request.
9. An external execution responsibility performs the action and returns a Result.
10. Relevant Result information becomes part of a later Model Context.
11. We ask why one Model Output is not necessarily the final answer.
12. We close the path into an Agent Loop.
13. We run the Loop through the real NPE case.
14. A failed Patch becomes Feedback and causes revision.
15. The Task reaches a valid Stop condition.
16. The previously separated responsibilities assemble into an Agent system.
17. The work ends on the final thesis: **LLM → AGENT**.

Scene 00 is retained as the existing introduction and should only receive global polish needed for consistency unless a specific delta below requires otherwise.

---

# 2. GLOBAL PRESENTATION RULES

## 2.1 One scene, one learning moment

Every Scene must have one primary fact a first-time viewer can state after seeing it.

Avoid repeating a concept simply because it appeared in the Details article.

## 2.2 Details are not Presentation copy

Presentation must not reproduce long Details paragraphs.

Prefer:

- one obvious focal point
- large readable labels
- meaningful spatial relationships
- visible state changes
- short code/log fragments only when necessary

Remove low-value tiny captions.

## 2.3 Animation explains causality

Animation is not decorative.

Preferred structure:

```text
initial state
→ active process
→ changed state
→ result
→ stable final frame
```

The final frame must remain understandable even if the viewer missed the animation.

Important information must not permanently disappear.

## 2.4 Reuse visual language

Keep components visually consistent:

- `LLM / MODEL`
- `MODEL CONTEXT`
- `REQUEST`
- `EXECUTION LAYER`
- `ENVIRONMENT / REPOSITORY`
- `RESULT / FEEDBACK`
- `CONTROL`
- `VALIDATION`

New information may briefly highlight before settling.

Current workflow step gets the strongest emphasis.

## 2.5 Context snapshots, not one infinite prompt

When the task progresses, visualize **successive Model Context snapshots**.

Do not imply one literal Prompt always grows forever.

Agent State, Workspace State, Tool History, approval state, etc. may exist outside a particular Model Context.

Later Model Calls can receive selected, summarized, filtered, compressed, or newly added relevant information.

## 2.6 Technical accuracy

Mandatory:

- Token ≠ natural-language word.
- Do not show `one input token → one logit`.
- Use:
  `input tokens → model calculation → vocabulary logits → softmax probabilities → decoding → next token`.
- Probability/logit values shown in Presentation are illustrative.
- The next Token need not always be the highest-probability candidate; decoding may sample.
- Long-context vertical movement is a Presentation metaphor, not literal sequential scrolling cognition.
- Never claim to expose hidden Chain-of-Thought.
- Use observable summaries only:
  `OBSERVATION`, `CURRENT ASSESSMENT`, `WORKING HYPOTHESIS`, `NEXT ACTION`.
- The Model requests; external execution performs side effects.
- Repository access ≠ Repository inside Model Context.
- Tool Result ≠ Model training.
- `Execution Layer` is a conceptual responsibility label, not a universal mandatory component name.
- `CONTROL` and `VALIDATION` are peers:
  - Control: what is allowed?
  - Validation: is the result correct/complete?

---

# 3. NPE CASE CANON AND REVEAL TIMING

## User request

> 운영 서버에서 NullPointerException이 발생했다. 원인을 확인하고 수정한 뒤 테스트까지 검증해줘.

## Initial stack trace

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

## Failing expression

```java
user.getProfile().getDisplayName()
```

## Canonical truth for implementation

- some existing users may have `profile == null`;
- first defensive Patch prevents NPE but uses `null` as the `displayName` fallback;
- the existing contract/test expects `"Unknown"`;
- failed validation reveals that contract;
- revised Patch uses `"Unknown"` when profile is absent.

## Mandatory reveal timing

### Early Scenes

May reveal:

- NPE
- Stack Trace
- `UserMapper.java:42`
- failing expression
- User Request
- high-level Workflow

Must not reveal:

- `profile == null`
- `"Unknown"`
- final correct Patch

### Scene 13

Only after Repository evidence is gathered, reveal that `profile == null` is the well-supported likely cause.

### Scene 14

Reveal the fallback contract through validation:

```text
expected: "Unknown"
actual: null
```

---

# 4. SCENE SPECIFICATIONS

# SCENE 00 — INTRO

Retain the current opening role.

The Intro should establish:

> How does a next-token-predicting Model participate in a Coding Agent that reads repositories, edits code, and runs tests?

Do not overload the Intro with later answers.

---

# SCENE 01 — FROM INCIDENT TO AGENT

## Purpose

Presentation must show the chronology:

**NPE → Stack Trace → handoff to Agent → Agent Workflow**

## Composition

Use a simplified developer workspace rather than a giant code panel appearing without context.

Possible structure:

```text
Application        Logs / Stack Trace        Agent
   ERROR      →     NPE / line 42      →    task handoff
                                               ↓
                                         Agent Workflow
```

This is a Presentation abstraction, not a detailed IDE clone.

## Animation

1. Normal workspace.
2. Error state.
3. NPE focus.
4. Stack Trace focus, highlight `UserMapper.java:42`.
5. User Request goes to Agent.
6. Sequential workflow:
   `READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY`.

Only current stage strongly highlights.

Prepare focus toward the LLM for Scene 02.

---

# SCENE 02 — FOCUS ON THE LLM

## Purpose

Strip away the surrounding Agent system and inspect the LLM.

## Transition

Begin with a simplified Agent structure.

Fade / blur / move away non-LLM elements.

Leave `LLM` centered.

Then show:

```text
INPUT → LLM → NEXT TOKEN ?
```

Main question:

**WHAT DOES THE LLM ACTUALLY DO?**

---

# SCENE 03 — HOW THE NEXT TOKEN IS CHOSEN

## Purpose

Show one next-token calculation accurately.

## Flow

```text
INPUT TEXT
→ TOKENS
→ MODEL CALCULATION
→ VOCABULARY LOGITS
→ SOFTMAX
→ PROBABILITIES
→ DECODING
→ NEXT TOKEN
```

Use conceptual input:

`java.lang.NullPointer`

Example token chunks may be simplified.

Example illustrative candidates:

```text
Exception    8.7
Error        4.2
Method       1.8
Object       0.9
```

then:

```text
Exception    72%
Error        15%
Method        7%
Object        3%
```

Decoding resolves to `Exception`.

Final result:

`java.lang.NullPointerException`

Final message:

**ONE TOKEN GENERATED**

Do not turn Scene 03 into a Transformer architecture lecture.

---

# SCENE 04 — GENERATION IS REPETITION

## Purpose

Scene 03 explained one token. Scene 04 explains repetition only.

## Concept

```text
CONTEXT → LLM → NEXT TOKEN
   ↑                │
   └──── APPEND ────┘
```

Show at least two cycles; later cycles can accelerate.

Final message:

**GENERATION IS REPETITION**

or:

**PREDICT → APPEND → REPEAT**

---

# SCENE 05 — CONTEXT GROWS WITH THE TASK

## Purpose

Move from output generation to the information visible to later Model Calls.

## Initial Context

```text
USER REQUEST
ERROR LOG
```

## Later Context snapshot

May contain non-spoiler information such as:

- relevant Source Code
- prior Tool Result
- investigation note
- relevant call site

Do not yet explain the Tool mechanism.

Do not reveal root cause, Patch result, Test result, or `"Unknown"`.

Core message:

**THE CONTEXT GROWS WITH THE TASK**

Interpret this as richer successive Context snapshots, not an infinite Prompt.

---

# SCENE 06 — EVIDENCE ACROSS CONTEXT

## Purpose

Show that relevant information at distant positions in the current Context can jointly influence Model calculation.

## Composition

Use one visibly long Context snapshot:

```text
USER REQUEST
ERROR LOG
UserMapper.java snippet
UserService call site
related type/declaration
neutral prior result
```

A viewport may move vertically as a visual metaphor.

Selectively highlight relevant pieces.

Connect them lightly to the active LLM.

Do not reveal the root cause yet.

Do not imply perfect retrieval or human-like understanding.

---

# SCENE 07 — ACCESS IS NOT CONTEXT

## Purpose

Break the misconception that repository access means the full repository is already in the LLM Context.

Core message:

**ACCESS ≠ CONTEXT**

## Composition

Large Repository versus small Context.

Briefly suggest the wrong mental model of the entire Repository entering Context, then reject it with `≠`.

Only a few selected pieces move into Context.

Final hook:

**HOW DOES THE CODE GET IN?**

---

# ACT 3 — MODEL REQUESTS, THE SYSTEM ACTS

Act thesis:

**The model requests. The execution system acts. Results can become information for later Model Context.**

Do not make the word `BOUNDARY` the visual subject.

---

# SCENE 08 — THE MODEL REQUESTS

## Purpose

Show what the Model does when current Context is insufficient.

Current Context activates Model.

Need appears:

```text
NEED SOURCE
UserMapper.java
```

Reject:

```text
MODEL ── X ──> REPOSITORY
```

Introduce Execution Layer.

Model emits compact Request:

```text
READ
UserMapper.java
```

End on outbound Request.

Core:

**THE MODEL REQUESTS**

**REQUEST ≠ EXECUTION**

---

# SCENE 09 — THE EXECUTION LAYER ACTS

## Purpose

Complete one real external action.

Flow:

```text
MODEL REQUEST
    ↓
EXECUTION LAYER
    ↓
REPOSITORY
    ↓
RESULT
    ↑
EXECUTION LAYER
    ↑
AGENT STATE / TOOL RESULT
```

Show Repository File Read.

Produce a compact relevant Result.

Do not loop yet.

Do not imply raw Tool Result must be copied verbatim into Model Context.

---

# SCENE 10 — RESULT BECOMES NEXT MODEL CONTEXT

## Purpose

Show relevant returned information being represented in a **new Context snapshot**.

Example:

```text
NEXT MODEL CONTEXT

USER REQUEST
ERROR LOG
RELEVANT UserMapper.java RESULT  ← NEW
```

Make clear:

- this is a later Model Context;
- it is not the whole Agent State;
- Result may be selected/summarized.

Keep Model visible as destination.

**Stop before the next Model Output is generated.**

This avoids duplicating Scene 11 and Scene 12.

---

# ACT 4 — THE AGENT LOOP

# SCENE 11 — ONE PASS IS NOT THE FINAL ANSWER

## Purpose

Ask the question that motivates the Loop.

Simplified normal expectation:

```text
CONTEXT → MODEL → FINAL ANSWER
```

Agent case:

```text
CONTEXT → MODEL → REQUEST FOR MORE INFORMATION/ACTION
```

Use a compact recap of the previous pass rather than replaying everything.

End with the new Context ready for another Model Call.

Core question:

**WHAT IF THE FIRST OUTPUT ISN'T THE FINAL ANSWER?**

Then:

**NOW WHAT?**

Do not draw the complete Loop yet.

---

# SCENE 12 — THE AGENT LOOP IN MOTION

## Purpose

Replace dense circular-loop graphics with a readable linear workflow + return path.

## Layout

Left:

```text
MODEL
 ↓
REQUEST
 ↓
EXECUTION
 ↓
RESULT
 ↓
CONTEXT UPDATE
 └────────→ MODEL
```

Right:

`CURRENT / NEXT MODEL CONTEXT` snapshot.

Current active stage gets strongest highlight.

## Animation

First Iteration:

1. Model reads Context.
2. Request.
3. Execution.
4. Result.
5. Context update.
6. Return to Model.

Second Iteration repeats faster with a Details-consistent action.

Core message:

**DECIDE → ACT → OBSERVE → UPDATE → DECIDE AGAIN**

Final:

**THIS IS THE AGENT LOOP**

The changing Context/state is as important as the loop path.

---

# SCENE 13 — RUN THE LOOP ON THE NPE CASE

## Purpose

Move from abstract Loop to the real NPE run.

Primary screen focus:

- current Model Context
- observable Model Assessment
- Next Action
- state change across Iterations

Do not make the architecture diagram the main visual anymore.

## Iteration 1

Context:

```text
USER REQUEST
ERROR LOG
UserMapper.java:42
```

Observable summary:

```text
OBSERVATION
Stack Trace points to UserMapper.java:42

NEXT ACTION
Locate relevant implementation
```

Request Search.

Then read the relevant `UserMapper.java`.

## Iteration 2

Context now includes the failing source.

Assessment remains cautious:

```text
The failing expression contains multiple dereferences.
Current evidence does not prove which value is null.
```

Next Action: inspect related type/data path.

## Iteration 3

After additional Repository evidence enters Context, reveal:

```text
WORKING HYPOTHESIS
profile == null is the likely cause
```

Only now progress toward Patch.

Optional small observable output history:

```text
01 Search code
02 Read source
03 Inspect related path
04 Patch null handling
05 Run tests
```

No hidden Chain-of-Thought.

Core:

**THE LOOP CHANGES THE STATE EACH TIME**

---

# SCENE 14 — PATCH, TEST, REVISE

## Purpose

Show failure as Feedback that changes the next action.

First Patch prevents the NPE but uses a `null` fallback for `displayName`.

Apply via Execution.

Show:

```text
NPE → RESOLVED
```

Then run existing Repository Test/Validation.

Default path:

```text
expected: "Unknown"
actual: null
```

Test fails.

Failure becomes a Result / new evidence.

Next Model Context incorporates the relevant failure information.

Observable summary:

```text
OBSERVATION
NPE is gone.

NEW EVIDENCE
null fallback breaks expected behavior.

NEXT ACTION
Revise Patch.
```

Generate `PATCH #2`.

Core:

**PATCH. TEST. REVISE.**

Secondary:

**FAILURE IS FEEDBACK**

Do not portray Test Failure as retraining.

---

# SCENE 15 — TASK COMPLETE

## Purpose

Close the NPE Agent Run.

Flow:

```text
PATCH #2
→ RUN TESTS
→ PASS
→ VERIFY
→ OBJECTIVE SATISFIED
→ FINAL RESPONSE
→ STOP
```

Keep `NPE RESOLVED` and validation success visible.

The crucial visual difference from Scene 14:

- Scene 14 Result re-enters another Iteration.
- Scene 15 valid Result satisfies the goal and no return path activates.

Other stop reasons such as human input / permission can appear only as secondary information.

Core:

**TASK COMPLETE**

---

# ACT 5 — WRAP-UP

Keep Act 5 short.

Retained:

- Scene 16 — structural integration
- Scene 19 — final thesis

Removed:

- 17
- 18
- 20

---

# SCENE 16 — AN AGENT IS A SYSTEM OF PARTS

## Purpose

Gather the previously explained responsibilities into one system.

Start with LLM centered.

Add in order:

1. LLM
2. Context
3. Tools / Execution
4. Environment / Repository
5. Control
6. Validation
7. Result / Feedback / Loop
8. overall `AGENT` identity

Keep `CONTROL` and `VALIDATION` visually distinct.

Audience takeaway:

> Agent is not one magical LLM. It is a system assembled around an LLM.

Core:

**AN AGENT IS A SYSTEM**

Optional:

**MORE THAN A MODEL**

Do not build a dense enterprise architecture diagram.

---

# SCENE 17 — REMOVE

Deleted from current Presentation and Details structure.

Do not revive it or migrate its content automatically.

---

# SCENE 18 — REMOVE

Deleted from current Presentation and Details structure.

Do not revive it or migrate its content automatically.

---

# SCENE 19 — FINAL CONCLUSION: LLM TO AGENT

## Purpose

Answer the opening thesis without replaying the NPE case.

Scene 16 answers:

> What is an Agent made of?

Scene 19 answers:

> What fundamentally changed from LLM to Agent?

## Animation

1. Briefly return to:
   `CONTEXT → LLM → TOKEN`.
2. Output becomes generic `REQUEST`.
3. Completed surrounding system appears quickly.
4. Run exactly one compact recap:

```text
LLM
 ↓
REQUEST
 ↓
SYSTEM ACTS
 ↓
RESULT
 ↓
CONTEXT UPDATE
 ↓
LLM
```

5. Freeze.
6. Dim architecture.
7. Leave the thesis.

Final frame:

```text
                 LLM → AGENT

          The model predicts.
The system turns predictions into actions.
```

Do not show:

- NPE
- UserMapper
- Patch/Test history
- another multi-cycle Loop
- new products/vendors

This must feel minimal and final.

---

# SCENE 20 — REMOVE

Deleted from current Presentation and Details structure.

Scene 19 is the final main thesis.

---

# APPENDIX A1 — ARTWORK

## Presentation role

A1 is an artwork screen.

Remove Presentation text:

- `처음에는 질문이고, 마지막에는 답이 된다.`
- `appendix`
- `A1`

Do not replace them with another heading.

## Artwork asset

The current artwork is cropped on the right.

Create/use a full-composition version with the complete right side visible.

Place it large and centered like a framed illustration inside the browser viewport.

Desired:

- one dominant image
- full composition visible
- centered
- controlled margins
- optional restrained frame/shadow
- no competing captions

Do not use it as a cropped background.

A1 Details v4 contains the conceptual interpretation and Glossary.

---

# 5. CROSS-SCENE NARRATIVE MAP

```text
00  Opening question
 ↓
01  NPE incident / Agent workflow
 ↓
02  Focus on the LLM
 ↓
03  One next Token
 ↓
04  Generation repeats
 ↓
05  Later Model Context becomes richer
 ↓
06  Distant evidence inside Context can jointly matter
 ↓
07  Repository access ≠ Model Context
 ↓
08  Model requests
 ↓
09  External execution acts
 ↓
10  Result → later Model Context
 ↓
11  First Model Output may not be final
 ↓
12  Agent Loop
 ↓
13  Real NPE run
 ↓
14  Failure → Feedback → Revision
 ↓
15  Pass / Verify / Stop
 ↓
16  Responsibilities assemble into Agent
 ↓
19  LLM → AGENT final thesis
 ↓
A1  Artwork
```

---

# 6. INTERACTION / UX PRESERVATION

Do not break established Work 3 keyboard interaction.

Preserve:

- `ArrowLeft` / `ArrowRight`: previous / next Scene
- `D`: toggle Details
- when Details is open and vertically scrollable, `ArrowUp` / `ArrowDown`: scroll Details
- `O`: existing Overview behavior if present
- `H`: Build Canvas home
- stable keyboard behavior after opening/closing Details
- established Presentation / Details behavior
- reduced-motion/accessibility behavior

Desktop-first verification:

- 1280×720
- 1440×900
- 1920×1080

Presentation must fit intended viewport without page-level vertical scroll.

Do not solve overflow by shrinking key text to unreadable sizes.

## Removal implementation

Update all structures affected by the legacy removals:

- Scene arrays/data
- navigation sequence
- Details mapping
- progress/index
- overview/index if applicable
- component registries
- keyboard transitions
- dead Presentation/Details-only CSS and animation

No orphan routes or stale `N / 22` indicator.

---

# 7. QUALITY / ACCEPTANCE CHECKLIST

## Story

- Each Scene has one primary learning moment.
- Each Scene answers or creates the next question.
- Scene 10 does not start the next Model Pass.
- Scene 11 creates the Loop question.
- Scene 12 is the first complete Loop.
- Scene 13 reveals `profile == null` only after evidence.
- Scene 14 reveals `"Unknown"` only through Test Failure.
- Scene 16 integrates instead of re-teaching.
- Scene 19 concludes instead of replaying the NPE.
- 17/18/20 do not appear.

## Layout

- Focal point obvious within one second.
- No unnecessary tiny text.
- Key code/log fragments readable.
- Full viewport used confidently.
- Stable final frames.

## Animation

- Motion shows time/causality.
- Active stage obvious.
- Repeated cycles accelerate after pattern is understood.
- Final state readable with animation finished.

## Technical

- Logits ≠ probabilities.
- Token ≠ word.
- Model ≠ Execution.
- Repository access ≠ Context.
- Model Context ≠ Agent State.
- Tool Result ≠ training.
- Long-context scroll is metaphor.
- No hidden Chain-of-Thought representation.
- Control ≠ Validation.

## Appendix

- Artwork full, uncropped, centered.
- No `appendix`, `A1`, or removed sentence on Presentation.
- Details interpretation remains available in Details v4.

---

# 8. FINAL THESIS

The LLM remains a predictive model at the center.

Moving from **LLM** to **AGENT** means surrounding that Model with a system that can:

- construct relevant Context;
- interpret outputs as requests when appropriate;
- perform actions outside the Model;
- capture external Results;
- construct later Model Context from relevant state and Results;
- invoke the Model again;
- validate outcomes;
- use Feedback to change later actions;
- stop when the task reaches an appropriate completion condition.

Final audience takeaway:

> **The model predicts. The system turns predictions into actions.**