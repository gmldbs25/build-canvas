# Build Canvas Work 3 — LLM to Agent
## Presentation Redesign Master Spec

**Status:** Latest / highest-authority Work 3 design specification  
**Repository:** `gmldbs25/build-canvas`  
**Target:** `projects/transformer-to-agent`  
**Scope:** Presentation scene structure, visual composition, motion, scene transitions, scene removal, technical guardrails, and interaction preservation  

---

# 0. DOCUMENT AUTHORITY

This document is the **latest and highest-authority design specification for Work 3**.

It supersedes the former:

`docs/transformer-to-agent/work3-redesign-spec.md`

That older design document is obsolete and should not be used as an implementation source.

Authority order:

1. **`work3-presentation-redesign-master-spec.md` — highest authority.**  
   Scene structure, Presentation composition, animation, visual hierarchy, scene removal, technical guardrails, NPE reveal timing used by Presentation, and interaction preservation in this document win over older Work 3 design language.
2. **`work3-details-article-v3.md` — Details copy authority only.**  
   Use it for finalized Details wording and explanation depth. Do not allow stale structural references in that manuscript to revive removed Presentation scenes or override this master specification.
3. Any older Work 3 design note is obsolete when it conflicts with this document.

**Codex must read this master specification first.** Read the Details manuscript second only when finalized Details prose is needed.

## Scene deletion scope

Scenes **17, 18, and 20 are removed from the Presentation sequence**.

Their existing Details manuscript sections are not silently rewritten or deleted in this Presentation redesign pass. If the current implementation couples one visual scene to one Details section, preserve the Details source while ensuring the Presentation sequence skips those removed scenes.

Legacy IDs remain in this document for traceability with the current codebase.

Final Presentation sequence:

`00 → 01 → 02 → ... → 16 → 19 → A1`

This results in:

- 18 main screens: `00`, `01–16`, `19`
- 1 artwork screen: `A1`
- **19 navigable Presentation screens total including A1**

Progress/index UI must reflect the real sequence rather than continuing to show `N / 22`.

---

# 1. REDESIGN GOAL

The Details storyline has already been finalized.

This pass is not about adding more explanation. It is about translating that story into a Presentation where **time, causality, focus, and state changes are obvious visually**.

The final narrative should feel like one continuous causal chain:

1. A production NPE occurs.
2. We isolate the LLM from the larger Agent system.
3. We show how one next token is calculated.
4. We show that generation is repetition of that process.
5. We shift from output generation to the Context the model receives.
6. We show that Context changes as the task progresses.
7. We show that repository access is not the same as repository contents being in Context.
8. We introduce the model request → execution → result path.
9. We show the result becoming information for a later Model Call.
10. We ask why one Model Call is not necessarily the final answer.
11. We close the path into an Agent Loop.
12. We run the loop through the real NPE case.
13. We show a failed patch becoming feedback and causing revision.
14. We stop the loop when the task is complete.
15. We assemble the pieces into the Agent system.
16. We end on the thesis: **LLM → AGENT**.

---

# 2. GLOBAL PRESENTATION RULES

## 2.1 Details are not Presentation copy

For retained material, the finalized Details manuscript remains the source for prose.

Presentation should not reproduce Details paragraphs.

Presentation should communicate with:

- one clear focal point
- large readable labels
- meaningful component relationships
- state changes
- animation that expresses sequence and causality

Avoid scattered small captions and multiple competing focal points.

## 2.2 Animation must explain

Animation is not decoration.

Preferred structure:

`initial state → active process → changed state → result → stable final frame`

Every scene must remain understandable after its animation finishes.

Important content must not permanently disappear after motion.

## 2.3 Consistent visual language

Reuse the same visual identity across scenes:

- `MODEL / LLM` — same core component
- `CONTEXT` — same container/block language
- `REQUEST` — consistent outbound visual
- `EXECUTION LAYER` — consistent external-action responsibility
- `RESULT` — consistent return visual
- new information — short highlight before settling
- active workflow stage — strongest visual emphasis

Successive Model Calls should be shown as **context snapshots** when appropriate. Do not imply that one single prompt simply grows forever.

## 2.4 Technical accuracy guardrails

- Do not imply each input token individually becomes a logit.
- Use: `input tokens → model calculation → vocabulary logits → softmax probabilities → decoding → next token`.
- Token is not necessarily a word.
- Displayed logit/probability numbers are illustrative.
- Long-context scrolling is a Presentation metaphor only. Do not imply the model literally scrolls sequentially through Context.
- Do not expose or claim to show hidden chain-of-thought. Use observable summaries such as `OBSERVATION`, `CURRENT ASSESSMENT`, `WORKING HYPOTHESIS`, `NEXT ACTION`.
- The model requests actions. The execution system performs external actions.
- Repository access does not mean the entire repository is present in the current Model Context.
- Model Context is not the entire Agent State.
- Tool History, approvals, workspace changes, runtime state, etc. may exist outside a particular Model Call.
- Later Model Context can include new relevant evidence, but information can also be summarized, filtered, compressed, or omitted.
- Tool Result does not retrain model parameters.
- `Execution Layer` is a conceptual responsibility label, not a claim that every Agent framework has a component with that exact name.
- `CONTROL` and `VALIDATION` are separate responsibilities.
  - Control: what is allowed?
  - Validation: is the result actually correct/complete?

## 2.5 NPE reveal timing

The NPE case must remain a real investigation rather than revealing the answer too early.

Early scenes may reveal:

- `NullPointerException`
- stack trace
- `UserMapper.java:42`
- the failing expression
- user request
- high-level Agent workflow

Do **not** reveal early:

- that `profile == null` is the cause
- the final correct patch
- the `"Unknown"` fallback contract

`profile == null` should emerge only when the later repository/context investigation provides enough evidence in Scene 13.

The `"Unknown"` contract should emerge through the failed validation/test in Scene 14.

---

# ACT 1 — FROM INCIDENT TO TOKEN GENERATION

# SCENE 1 — FROM INCIDENT TO AGENT

## Purpose

Follow the chronological story:

**NPE 발생 → Stack Trace 확인 → Agent에게 업무 전달 → Agent Workflow**

The existing large code panel should not suddenly dominate the scene.

## Screen concept

Use a simplified **Developer Workspace / computer screen**.

Suggested regions:

```text
┌────────────────────────────────────────────────────────┐
│ Developer Workspace                                    │
│                                                        │
│ Application      Logs / Stack Trace       Agent        │
│                                                        │
│   ERROR     →    NullPointerException  →  Investigate │
│                 UserMapper.java:42                    │
│                                             ↓          │
│                                      Agent Workflow    │
└────────────────────────────────────────────────────────┘
```

It should feel like a Presentation abstraction of a developer's screen, not a detailed IDE reproduction.

## Animation

1. Normal workspace.
2. Application changes to error state.
3. `NullPointerException` becomes the focal point.
4. Stack Trace becomes active; `UserMapper.java:42` is highlighted.
5. User task is handed to the Agent.
6. Agent workflow appears sequentially:

`READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY`

Only the current step receives strong emphasis.

## Final frame

```text
NPE
 ↓
STACK TRACE
 ↓
HAND OFF
 ↓
AGENT WORKFLOW
```

Prepare visual focus for the LLM inside the Agent.

---

# SCENE 2 — FOCUS ON THE LLM

## Purpose

Make the audience feel that we are temporarily stripping away the rest of the Agent to inspect the LLM itself.

## Screen / transition

Begin with a simplified Agent structure.

Then non-LLM elements:

- fade
- blur
- scale down
- move away

The `LLM` remains and moves toward center.

The scenes do not need a literal shared DOM transition; visual continuity is enough.

## Animation

1. Agent structure briefly visible.
2. Surrounding components lose emphasis.
3. LLM remains alone.
4. `INPUT` appears.
5. Empty output slot appears.
6. Resolve to:

`NEXT TOKEN → ?`

Final question:

**What does the LLM actually do?**

---

# SCENE 3 — HOW THE NEXT TOKEN IS CHOSEN

## Purpose

Animate one next-token calculation clearly and accurately.

## Conceptual flow

```text
Input Text
   ↓
Tokens
   ↓
Model Calculation
   ↓
Context Representation
   ↓
Vocabulary Logits
   ↓
Softmax
   ↓
Probabilities
   ↓
Decoding
   ↓
Next Token
```

## Example

Use a conceptual NPE-connected input:

`java.lang.NullPointer`

Token chunks may be visually simplified, e.g.:

`[java] [.] [lang] [.] [Null] [Pointer]`

Do not claim those exact boundaries are from a particular tokenizer unless they really are.

## Animation

1. Raw input appears.
2. Input separates into token blocks.
3. Tokens enter a compact model-calculation region.
4. Candidate vocabulary logits appear as scores, e.g. illustrative only:

```text
Exception    8.7
Error        4.2
Method       1.8
Object       0.9
```

5. Softmax transforms them into an illustrative probability distribution:

```text
Exception    72%
Error        15%
Method        7%
Object        3%
```

6. Decoding selects `Exception`.
7. The selected token moves to output and forms:

`java.lang.NullPointerException`

## Final message

**ONE TOKEN GENERATED**

Avoid a full Transformer architecture lesson here.

---

# SCENE 4 — GENERATION IS REPETITION

## Purpose

Scene 3 already explained one calculation. Scene 4 must not repeat that detail.

The only major idea:

> The next-token process repeats.

## Screen concept

Compress Scene 3 to:

`CONTEXT → LLM → NEXT TOKEN`

Then append the generated token and repeat.

## Animation

Show at least two cycles.

```text
CONTEXT → LLM → TOKEN
   ↑               │
   └── APPEND ─────┘
```

Later cycles can run faster once the pattern is understood.

## Final message

**GENERATION IS REPETITION**

or

**PREDICT → APPEND → REPEAT**

---

# ACT 2 — CONTEXT: WHAT THE MODEL RECEIVES

# SCENE 5 — CONTEXT GROWS WITH THE TASK

## Purpose

Move from output generation to what information the LLM is currently working with.

Use **successive Model Context snapshots** rather than implying one prompt grows forever.

## Initial state

```text
INITIAL CONTEXT

USER REQUEST
"이 NPE 원인을 찾아서 수정해줘"

ERROR LOG
java.lang.NullPointerException
...
```

## Core message

**THE CONTEXT GROWS WITH THE TASK**

## Animation

1. Show small initial Context.
2. Indicate work continuing without showing tool internals.
3. Later Context receives additional generic relevant information:
   - relevant source code
   - `UserMapper.java` or another relevant file
   - previous result
   - new evidence / investigation note
4. Transition to a visibly richer `MODEL CONTEXT #2 / LATER CONTEXT`.

Do not preview Patch/Test failure details yet.

Do not yet explain how the new information was obtained.

Avoid explicit `read_file()`, grep, shell, tool schema, function-call JSON.

## Final hook

**HOW DID THE NEW INFORMATION GET HERE?**

---

# SCENE 6 — USING EVIDENCE ACROSS A GROWN CONTEXT

## Purpose

Show that the model can use relevant information located at different positions in the current Context when producing the next output.

## Core message

**THE MODEL CAN USE EVIDENCE ACROSS THE CONTEXT**

## Screen concept

Use a visibly long Context snapshot with non-spoiler information:

```text
MODEL CONTEXT — LATER CALL
──────────────────────────
USER REQUEST
ERROR LOG
UserMapper.java snippet
UserService call site
Related type / declaration
Prior neutral tool result
──────────────────────────
```

Do not show final root cause, Patch Result, Test Failure, or the `"Unknown"` contract.

The Context can move vertically like a scrolling viewport.

This is only a visual metaphor for distant positions becoming relevant.

## Animation

1. Long Context appears.
2. Viewport/focus moves through distant portions.
3. Relevant blocks are selectively highlighted.
4. Thin visual connections indicate those pieces jointly influence the current computation.
5. LLM becomes active.
6. A concise non-final assessment/output appears.

Do not imply perfect retrieval or human-like understanding.

---

# SCENE 7 — ACCESS IS NOT CONTEXT

## Purpose

Break the misconception:

> If the Agent can access the repository, is the whole repository already inside the LLM Context?

No.

## Core message

**ACCESS ≠ CONTEXT**

## Screen concept

Contrast a very large codebase with a much smaller context container:

```text
CODEBASE
▦ ▦ ▦ ▦ ▦ ▦ ▦ ▦
▦ ▦ ▦ ▦ ▦ ▦ ▦ ▦
▦ ▦ ▦ ▦ ▦ ▦ ▦ ▦

        ≠

CONTEXT
┌────────────────────┐
│ User Request       │
│ Error Log          │
│ Relevant File A    │
│ Relevant File B    │
└────────────────────┘
```

## Animation

1. Large repository appears.
2. Briefly suggest the wrong idea of the entire repo moving into Context.
3. Reject it with a strong `≠`.
4. Highlight only a few pieces.
5. Move selected pieces into Context.

Do not explain the retrieval mechanism yet.

## Final hook

**HOW DOES THE CODE GET IN?**

---

# ACT 3 — MODEL REQUESTS, THE SYSTEM ACTS

## Act goal

Do not make `BOUNDARY` the main subject.

The information/action flow is the subject.

Core roles:

```text
MODEL
   ↕
EXECUTION LAYER
   ↕
ENVIRONMENT
```

### MODEL

- sees current Context
- determines what information/action is needed
- emits a request
- does not directly operate the repository/file system/shell

### EXECUTION LAYER

- receives/interprets request
- performs external work
- returns a result

### ENVIRONMENT

- Repository
- Source files
- Shell/runtime
- Test runner
- Logs

Act thesis:

**The model requests. The execution layer acts. The result can become information for the next Model Context.**

---

# SCENE 8 — THE MODEL REQUESTS

## Purpose

Show what the model itself does when current Context is insufficient.

## Core message

**THE MODEL REQUESTS**

Secondary:

**REQUEST ≠ EXECUTION**

## Animation

1. Current Context activates the model.
2. Information need appears:

```text
NEED SOURCE
UserMapper.java
```

3. Briefly reject direct access:

`MODEL ─── X ───> REPOSITORY`

4. Introduce Execution Layer.
5. Model emits compact request:

```text
READ
UserMapper.java
```

6. Request travels from model to Execution Layer.

End on the outbound request. Do not complete the return path yet.

---

# SCENE 9 — THE EXECUTION LAYER ACTS

## Purpose

Complete one concrete external action.

## Core message

**THE EXECUTION LAYER ACTS**

## Animation

1. Request arrives at Execution Layer.
2. Execution Layer accesses Repository.
3. `UserMapper.java` is highlighted/read.
4. Compact relevant result is produced.
5. Result returns through the execution boundary as Tool Result.
6. Make clear that new information is now available to the Agent.
7. Hand the result toward Scene 10, where the next Model Context is constructed.

Do not imply raw Tool Result must always be copied verbatim into the model input.

Conceptual flow:

```text
MODEL
  │ REQUEST
  ↓
EXECUTION LAYER
  │ EXECUTE
  ↓
REPOSITORY
  │ RESULT
  ↑
EXECUTION LAYER
  │ RETURN
  ↑
TOOL RESULT / AGENT STATE
```

Do not turn this into a repeated loop yet.

---

# SCENE 10 — RESULT BECOMES NEXT MODEL CONTEXT

## Purpose

Show how a returned result can be selected/represented in the **next Model Call**.

## Core message

**NEW RESULT → NEXT MODEL CONTEXT**

## Screen

```text
NEXT MODEL CONTEXT

USER REQUEST
ERROR LOG
UserMapper.java result   ← NEW / SELECTED
```

Keep the model visible as the destination, but **do not start a second Model Pass yet**.

## Animation

1. New information is briefly highlighted.
2. Show it becoming part of a new Context snapshot.
3. Make clear this Context is not the entire Agent State.
4. Show a connection toward the model as a possible next input.
5. Stop before the model creates another output.

This is intentionally separated from Scene 11 and Scene 12 to avoid duplicate explanations.

---

# ACT 4 — THE AGENT LOOP

# SCENE 11 — ONE PASS IS NOT THE FINAL ANSWER

## Purpose

Create the question that motivates the Agent Loop.

A simplified mental model is:

`CONTEXT → LLM → FINAL ANSWER`

But an Agent workflow can produce a Model Output that is instead a request for more information or an action.

## Core question

**WHAT IF THE FIRST OUTPUT ISN'T THE FINAL ANSWER?**

Alternative:

**ONE PASS. NOT DONE.**

## Screen concept

Do not rewind/replay all prior scenes.

Show a compact trace:

```text
INITIAL CONTEXT
      ↓
    MODEL
      ↓
 REQUEST FOR MORE CONTEXT
      ↓
 EXECUTION / RESULT
      ↓
NEXT MODEL CONTEXT
```

Then isolate the first Model Output.

Contrast:

`MODEL OUTPUT = FINAL ANSWER`

with:

`MODEL OUTPUT = NEXT ACTION / MORE CONTEXT REQUEST`

Highlight the newly constructed Context at the end and place:

**NOW WHAT?**

Do not close the loop yet.

---

# SCENE 12 — THE AGENT LOOP IN MOTION

## Purpose

Replace the current visually dense circular loop with a readable **linear flowchart + explicit return path**, while showing Context changes alongside it.

## Core message

**DECIDE → ACT → OBSERVE → UPDATE → DECIDE AGAIN**

## Main layout

### Left — workflow

```text
[ MODEL ]
    ↓
[ REQUEST ]
    ↓
[ EXECUTION ]
    ↓
[ RESULT ]
    ↓
[ CONTEXT UPDATE ]
    └────────────→ [ MODEL ]
```

Only the active step gets strongest emphasis.

### Right — current Model Context

```text
CURRENT CONTEXT

USER REQUEST
Fix this NPE.

ERROR LOG
NullPointerException
UserMapper.java:42
```

## First iteration

1. Model active.
2. Request: `READ UserMapper.java`.
3. Execution reads file outside the model.
4. Result arrives.
5. Context updates.
6. Return path activates back to model.

## Second iteration

Repeat faster with a Details-consistent next action.

The audience should see Context and model decision/state evolve together.

## Key idea

The loop does not mean “repeat the exact same thing.”

Each result changes state; changed state influences the next decision.

## Final frame

Full flowchart + current next-model-context snapshot.

**THIS IS THE AGENT LOOP**

---

# SCENE 13 — RUN THE LOOP ON THE REAL NPE CASE

## Purpose

Apply the abstract loop to the real NPE incident.

The visual focus should move away from architecture and toward:

1. the actual current Model Context snapshot
2. observable model assessment / next action
3. how both change from iteration to iteration

## Main layout

```text
┌──────────────────────────────┬──────────────────────────────┐
│ MODEL CONTEXT — CURRENT      │ MODEL                        │
│                              │                              │
│ User Request                 │ CURRENT ASSESSMENT           │
│ Error Log                    │ WORKING HYPOTHESIS           │
│ Source Code                  │ NEXT ACTION                  │
│ Tool Result                  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

Execution Layer may appear as a short transit/action strip only.

## Iteration 1

Initial Context:

```text
USER REQUEST
"이 NPE 원인을 찾아서 수정해줘."

ERROR LOG
java.lang.NullPointerException
at UserMapper.java:42
```

Observable summary:

```text
OBSERVATION
Stack trace points to UserMapper.java:42

NEXT STEP
Locate the relevant source in the repository
```

Model output:

`SEARCH CODE — UserMapper`

Execution returns candidate paths; next model decision requests relevant implementation file.

## Iteration 2

Context now includes relevant `UserMapper.java` source.

Assessment should remain cautious:

```text
OBSERVATION
The failing line contains multiple dereferences.
Current evidence does not yet prove which value is null.

NEXT STEP
Inspect related type / data path
```

## Iteration 3

Additional repository evidence enters Context.

Only now, once supported by evidence, reveal that `profile == null` is the likely root cause.

Progress toward Patch action.

A small Model Output History may show observable actions only, e.g.:

```text
01 Search code
02 Read relevant source
03 Inspect related path
04 Patch null handling
05 Run tests
```

Do not display hidden Chain-of-Thought.

## Key message

**THE LOOP CHANGES THE STATE EACH TIME**

---

# SCENE 14 — PATCH, TEST, REVISE

## Purpose

Show that the loop can act, observe failure, and use failure as new evidence for correction.

Human-developer analogy:

`modify → test → observe failure → reassess → modify again`

## Case

First Patch prevents the NPE but returns/handles `null` in a way that violates the real contract.

Unless Details explicitly say otherwise, treat the test as an **existing repository test/validation**, not a newly generated test.

## Core message

**PATCH. TEST. REVISE.**

Secondary:

**FAILURE IS FEEDBACK**

Retain compact `FAIL | PASS` state control if it exists, but do not let it dominate.

Default Scene 14 narrative is FAIL.

## Animation

1. `PATCH #1` is applied through execution.
2. `NPE` changes to `RESOLVED`.
3. Allow a brief sense of success.
4. Run existing tests.
5. `TEST FAILED` appears.
6. Failure becomes structured `TEST RESULT`.
7. Reveal contract through the failure:

```text
expected: "Unknown"
actual: null
```

8. Failure becomes new Agent information / next Model Context input.
9. Model re-evaluates using observable summary:

```text
OBSERVATION
NPE is gone.

NEW EVIDENCE
Returning null breaks expected behavior.

NEXT ACTION
Revise patch.
```

10. `PATCH #2` emerges.

Use Details-consistent final patch semantics. Do not invent unrelated business logic.

## Key visual

```text
PATCH #1
   ↓
TEST
   ↓
FAIL
   │
   └────────→ CONTEXT
                  ↓
                MODEL
                  ↓
              PATCH #2
```

---

# SCENE 15 — TASK COMPLETE

## Purpose

Close the NPE task and the Agent Loop story.

Do not turn this into a theoretical list of all stop conditions.

## Core flow

```text
PATCH #2
   ↓
RUN TESTS
   ↓
PASS
   ↓
VERIFY
   ↓
OBJECTIVE SATISFIED
   ↓
FINAL RESPONSE
   ↓
STOP
```

## Animation

1. Apply revised Patch.
2. Run existing tests/validation.
3. Tests pass.
4. Represent final `VERIFY`.
5. Keep `NPE RESOLVED` visible.
6. Connect verified state to original request.
7. Show `OBJECTIVE SATISFIED`.
8. Crucially: do not activate another return path.
9. Produce concise final status:

```text
TASK COMPLETE

NPE resolved
Patch verified
Tests passed
```

Other stop reasons such as user input/permission may appear only as secondary small information.

Key contrast:

`Scene 14: PATCH → TEST → FAIL → UPDATE → REVISE`

`Scene 15: PATCH → TEST → PASS → COMPLETE`

---

# ACT 5 — WRAP-UP

Act 5 should be short.

It must not replay the NPE case or re-teach every prior concept.

Retained Presentation scenes:

- Scene 16 — structural integration
- Scene 19 — final thesis

Removed:

- Scene 17
- Scene 18
- Scene 20

---

# SCENE 16 — AN AGENT IS A SYSTEM OF PARTS

## Purpose

Gather all previously explained responsibilities into one integrated visual.

Audience impression:

> Agent is not one magical LLM. It is a system assembled around an LLM.

## Core message

**AN AGENT IS A SYSTEM**

Optional supporting phrase:

**MORE THAN A MODEL**

## Screen concept / assembly order

Begin with LLM alone at center.

Then add familiar responsibilities in presentation order:

1. LLM
2. Context
3. Tools + Execution Layer
4. Environment / Repository
5. Control
6. Validation
7. Result / Feedback / Loop
8. overall `AGENT` system identity

`CONTROL` and `VALIDATION` stay visually distinct.

### Control

Permission / sandbox / approval / guardrails.

### Validation

Test / build / lint / diff / human review.

## Animation

- LLM alone
- Context attaches
- Execution Layer appears
- External Environment attaches
- Control + Validation appear as separate responsibilities
- Result/Feedback returns into the next-decision path
- entire structure is grouped/labeled `AGENT`

## Final impression

**LLM + Context + Tools/Execution + Environment + Control + Validation + Feedback/Loop = Agent System**

Do not build a dense enterprise architecture diagram.

---

# SCENE 17 — REMOVE

Remove Scene 17 from Presentation navigation and rendering.

Do not mechanically move its repeated Presentation content into another scene.

Its existing Details manuscript copy is not rewritten in this pass.

---

# SCENE 18 — REMOVE

Remove Scene 18 from Presentation navigation and rendering.

Act 5 should remain compressed.

Its existing Details manuscript copy is not rewritten in this pass.

---

# SCENE 19 — FINAL CONCLUSION: LLM TO AGENT

## Purpose

Answer the opening thesis question without replaying the NPE case.

Do not reassemble all components one by one again.

## Final thesis

# **LLM → AGENT**

**The model predicts.**  
**The system turns predictions into actions.**

Scene 16 answers:

> What is an Agent made of?

Scene 19 answers:

> What fundamentally changed from LLM to Agent?

## Animation

### 1. Brief return to the LLM

Show familiar minimal cue:

`CONTEXT → LLM → TOKEN`

### 2. Output becomes a request

The output slot becomes generic `REQUEST`.

Do not use NPE-specific file names here.

### 3. Completed surrounding system appears

Show minimal completed system quickly. Do not repeat Scene 16's assembly.

### 4. One fast interaction

Run exactly one compact recap:

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

### 5. Freeze

Stop motion. Dim architecture.

### 6. Final frame

```text
                 LLM → AGENT

          The model predicts.
The system turns predictions into actions.
```

Do not show:

- NullPointerException
- UserMapper.java
- Patch/Test history
- detailed tool schemas
- another multi-cycle loop
- new products/vendors/technologies

This is a minimal ending.

---

# SCENE 20 — REMOVE

Remove Scene 20 from Presentation navigation and rendering.

Scene 19 is the final thesis conclusion.

Transition directly from Scene 19 to Appendix A1 when appropriate.

Existing Details copy is not rewritten in this pass.

---

# APPENDIX A1 — ARTWORK

## Purpose

A1 is an artwork Presentation screen, not another explanation-heavy slide.

The artwork itself is the main object.

## Remove from Presentation

Remove:

- `처음에는 질문이고, 마지막에는 답이 된다.`
- `appendix`
- `A1`

Do not replace them with another explanatory heading/caption.

## Artwork asset

The current image is cropped on the right.

Create/use a **full-composition version including the complete right side**.

The new artwork should preserve the intended visual narrative while fitting the web viewport cleanly.

## Screen composition

Place the artwork large and centered, like a framed illustration hanging inside the web page.

Desired impression:

- one dominant image
- full artwork visible
- centered
- generous controlled margins
- optional restrained frame/card/shadow
- no competing title/caption

Conceptually:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                [ FULL ARTWORK ]              │
│                                              │
└──────────────────────────────────────────────┘
```

Do not make it look like a cropped background image.

Existing Appendix explanatory/interpretation Details content remains intact unless separately requested.

---

# 3. CROSS-SCENE NARRATIVE MAP

```text
SCENE 1
Production NPE occurs
    ↓
SCENE 2
Focus from Agent → LLM
    ↓
SCENE 3
How one next token is chosen
    ↓
SCENE 4
Generation = repeated next-token prediction
    ↓
SCENE 5
Context changes/grows with task progress
    ↓
SCENE 6
Relevant evidence across Context can influence the model
    ↓
SCENE 7
Repository access ≠ repository inside Context
    ↓
SCENE 8
Model requests information/action
    ↓
SCENE 9
Execution Layer performs it and returns Result
    ↓
SCENE 10
Result becomes information for the next Model Context
    ↓
SCENE 11
One Model Output may not be the final answer
    ↓
SCENE 12
Therefore: Agent Loop
    ↓
SCENE 13
Run the loop on the real NPE case
    ↓
SCENE 14
Patch fails → Failure becomes Feedback / new evidence
    ↓
SCENE 15
Patch succeeds → Objective satisfied → Loop stops
    ↓
SCENE 16
These responsibilities together form an Agent System
    ↓
SCENE 19
LLM → AGENT
The model predicts; the system turns predictions into actions
    ↓
APPENDIX A1
Artwork
```

---

# 4. INTERACTION / IMPLEMENTATION PRESERVATION

This Presentation redesign must not break the established Work 3 interaction model.

Preserve:

- `ArrowLeft` / `ArrowRight`: previous / next Presentation scene
- `D`: toggle Details panel
- When Details is open and vertically scrollable, `ArrowUp` / `ArrowDown`: scroll Details content
- `O`: preserve existing Overview behavior if present
- `H`: return to Build Canvas home
- existing Presentation / Details mode behavior
- stable keyboard behavior after opening/closing Details
- reduced-motion/accessibility behavior already present

Presentation is desktop-first.

Verify at least:

- 1280×720
- 1440×900
- 1920×1080

Presentation must fit the intended viewport without page-level vertical scrolling.

Do not solve overflow by shrinking important text into unreadable sizes.

Stable final frames are mandatory.

## Scene removal implementation

Removing Presentation Scenes 17/18/20 requires updating all relevant structures:

- scene/navigation arrays
- Presentation sequence data
- progress indicators
- index-based transitions
- Presentation component registries
- dead Presentation-only CSS/animations

Progress UI should represent **19 navigable Presentation screens including A1**.

Do not leave orphaned Presentation paths for Scenes 17/18/20.

---

# 5. PRESENTATION QUALITY CHECKLIST

## Story

- Does each scene communicate one primary learning moment?
- Does it naturally answer or create the next scene's question?
- Is it repeating something already demonstrated better elsewhere?

## Layout

- Is the focal element obvious within one second?
- Is unnecessary small text removed?
- Are important code/log fragments readable?
- Is the viewport used confidently rather than clustering everything in a narrow center column?

## Animation

- Does motion explain sequence/causality?
- Is the active state obvious?
- Is the scene understandable after motion finishes?
- Are repeated cycles accelerated after the pattern is understood?

## Technical accuracy

- Model and execution responsibility separated?
- Repository access and Model Context separated?
- Logits and probabilities separated?
- Example numeric outputs clearly illustrative?
- Long Context not portrayed as literal scrolling cognition?
- Reasoning UI limited to observable summaries rather than hidden Chain-of-Thought?
- Model Context not portrayed as entire Agent State?

## Wrap-up

- Scene 16 integrates rather than re-teaches?
- Scene 19 states the thesis rather than replaying the case?
- Scenes 17/18/20 removed from Presentation?
- A1 artwork shown full and centered without unnecessary labels?

---

# 6. FINAL DESIGN THESIS

The Presentation should progressively reveal that the LLM remains a predictive model at the center of the story.

Moving from **LLM** to **AGENT** means building the surrounding system that:

- constructs relevant Context
- lets model outputs represent requests/actions
- performs external actions outside the model
- returns external results as Agent information
- constructs later Model Context from relevant state/results
- calls the model again
- validates outcomes
- repeats until an appropriate stopping condition is reached

Final audience takeaway:

> **The model predicts. The system turns predictions into actions.**
