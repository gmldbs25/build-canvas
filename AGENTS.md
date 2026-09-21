# Build Canvas Agent Instructions

## Scope

- These instructions apply repository-wide unless a more specific instruction file exists deeper in the tree.
- Follow the repository conventions in `README.md`.
- Before changing an existing Work, inspect its relevant source under `projects/` and any Work-specific documentation under `docs/`.
- Keep Work-specific design decisions local to that Work unless they are explicitly documented as repository-wide conventions.

## Agent Roles

The primary agent owns planning, important implementation decisions, integration, final verification, and the final result.

When the corresponding models are available and configured, prefer:

- **Astra** as the lead for end-to-end work, architecture, integration, and context-sensitive decisions.
- **Terra** for clearly scoped implementation that still requires normal coding judgment, such as UI changes, feature work, content integration, and ordinary bug fixes.
- **Luna** for lightweight, mechanical, repetitive, or routine execution.
- **Sol** for independent review or deeper analysis of substantial, ambiguous, or high-impact changes.

Delegation is optional. Keep it proportional to the task. Do not force every task through multiple agents when direct execution is simpler.

## Delegation

Astra should remain responsible for the overall task and may delegate when work can be separated cleanly.

Prefer Terra when the scope and acceptance criteria are clear but the implementation still requires engineering judgment.

Prefer Luna for clearly scoped, low-risk work, including:

- repository exploration and file lookup
- repetitive or mechanical edits
- routine build, lint, test, and verification commands
- routine Git operations when Git work is part of the task

Routine Git work includes `status`, `diff`, staging, routine commits, fetch, safe pull/rebase, push, remote synchronization checks, and routine post-push CI/deployment checks.

The primary agent must verify important delegated results before accepting them. Do not delegate architectural or context-sensitive decisions solely to a lightweight worker.

## Git Safety

Escalate Git work to the primary agent when it involves:

- meaningful merge or rebase conflicts
- force pushes or history rewriting
- destructive reset or clean operations
- deleting branches or tags
- reverting substantial work
- any ambiguity that could discard user changes

Do not perform destructive or history-rewriting Git operations without explicit user authorization.

## Independent Review

For substantial implementation changes, prefer an independent Sol review after implementation and basic verification.

Review should focus on bugs, regressions, missed requirements, broken interactions, architectural or maintainability issues, meaningful UX problems, technical accuracy, and missing verification.

The reviewer reports findings; the primary agent decides which findings require changes and remains responsible for the final result.

Do not invoke independent review for trivial changes.

## Working Principle

Use Astra where overall judgment matters, Terra for normal scoped implementation, Luna for routine execution, and Sol for independent review or deeper analysis. Keep delegation proportional to the task.
