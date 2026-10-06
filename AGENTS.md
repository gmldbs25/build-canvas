# Build Canvas Agent Instructions

## Purpose

This file defines the repository-wide operating rules for AI coding agents working on Build Canvas.

Keep repository-wide agent routing and guardrails here. Work-specific design, content, interaction, and implementation decisions belong under `docs/<work>/`.

Follow the repository conventions in `README.md`. When working on an existing Work, inspect its source under `projects/` and the relevant Work-specific documents under `docs/` before changing it.

## Agent routing

Use a **Sol-orchestrated, Luna-executed** workflow.

- **GPT-6.1 Sol — root orchestrator.** Own task understanding, decomposition, coordination, integration, and final decisions. Keep orchestration lightweight. Read only enough code and documentation to define the work; avoid duplicating repository exploration that a worker can do.
- **GPT-6 Luna — primary worker.** Delegate most bounded implementation, repository exploration, UI work, targeted debugging, tests, documentation edits, build verification, and routine Git operations to Luna. Use High reasoning by default. Use XHigh only when the bounded implementation itself is unusually difficult.
- Sol may perform trivial one-step changes directly when delegation would cost more than doing the work.
- Prefer one Luna worker for a normal implementation task. Use a second worker only for genuinely independent workstreams. Never have multiple agents edit the same files or mutable state concurrently.
- Give workers a clear goal, relevant constraints, and acceptance criteria. Do not duplicate large amounts of context when the worker can read the relevant repository files directly.
- A successful bounded worker task does not require a mandatory second review. Use the worker's final diff summary and validation results for completion unless risk, uncertainty, or failed validation warrants deeper inspection.
- If Luna is blocked or uncertain, Sol should investigate, narrow the task, retry with stronger reasoning when useful, or handle the difficult portion directly.
- **Astra — critical escalation only.** Reserve Astra for fundamental architecture decisions, high-risk compatibility changes, or structurally unresolved problems after Sol analysis.

Escalate because reasoning difficulty requires it, not because a task feels important.
Optimize for total work and token efficiency, not agent count.

## Work-specific context loading

Do **not** read every Work document before every task. Load only the documents relevant to the requested change.

- Repository structure, shared conventions, local development, validation, and Pages deployment → `README.md`
- Repository-wide agent behavior and Git guardrails → this `AGENTS.md`
- Work-specific design, content, UX, interaction, or implementation intent → the relevant `docs/<work>/` files
- Existing implementation details → the relevant `projects/<slug>/` source

Keep Work-specific design decisions local to that Work unless they are explicitly promoted to repository-wide conventions.

If a Work document and the current implementation conflict, do not silently invent a new design decision. Use the authoritative Work document where one exists, and surface a real unresolved conflict when necessary.

## Repository-wide guardrails

- GitHub `origin/main` is the source of truth.
- Before substantial work, verify that the working state is based on the current `origin/main`. Never discard uncommitted work merely to synchronize.
- Avoid destructive reset/clean operations unless they are explicitly justified and safe.
- Routine Git status/sync/commit/push work should be handled by Luna where practical.
- Prefer small, testable changes over broad rewrites.
- Preserve existing Works unless the task explicitly requires changing them.
- Do not apply one Work's design language or implementation rules to another Work unless that reuse is intentional and documented.
- New Works must follow the repository conventions in `README.md`, including project placement, home registration, Pages build integration, asset guidance, and `H` key navigation.
- Do not introduce a new major framework, deployment path, or repository-wide convention without an explicit architectural reason.

## Git operations

Routine Git work should preferably be delegated to Luna when Git work is part of the task.

This includes:
- `status` and `diff`
- staging and routine commits
- fetch and safe pull/rebase operations
- push and remote synchronization checks
- routine post-push CI or deployment checks

Sol should take over or make the decision when Git work involves:
- meaningful merge or rebase conflicts
- force pushes or history rewriting
- destructive reset or clean operations
- deleting branches or tags
- reverting substantial work
- any ambiguity that could discard user changes

Do not perform destructive or history-rewriting Git operations without explicit user authorization.

## Validation

Run the smallest validation that gives reasonable confidence for the current change.

- mechanical/docs-only change → inspect the final content and diff
- normal code/UI change → targeted checks when useful plus the relevant build
- repository-wide or new Work integration → validate the Build Canvas integration path and production Pages build
- behavior covered by focused tests → run those tests
- browser or deployment validation unavailable in the current environment → report what could not be verified instead of pretending it passed

For substantial Work additions or structural changes, use the repository commands documented in `README.md` as appropriate, including:

- `npm run lint`
- `npm test`
- `npm run build:pages`

Do not run expensive broad regression solely because a suite exists when a narrower validation is sufficient.

## Completion

Before finishing:

- confirm the requested behavior is implemented
- inspect the final diff for unintended changes
- run the minimum meaningful validation
- clearly report any skipped validation that still matters
- update Work-specific documentation when the implementation changes a documented decision
- commit/push to `origin/main` when the task explicitly includes remote integration or deployment
- leave the working tree clean after Git/remote operations

## Working principle

**Sol orchestrates. Luna executes. Astra escalates only when genuinely necessary.**

Use the lightest process that safely completes the task.
