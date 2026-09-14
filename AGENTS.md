# Build Canvas Agent Instructions

## Scope

- These instructions apply repository-wide unless a more specific instruction file exists deeper in the tree.
- Follow the repository conventions in `README.md`.
- Before changing an existing Work, inspect its relevant source under `projects/` and any Work-specific documentation under `docs/`.
- Keep Work-specific design decisions local to that Work unless they are explicitly documented as repository-wide conventions.

## Agent Roles

The primary agent owns planning, important implementation decisions, integration, final verification, and the final result.

When the corresponding models are available and configured, prefer:

- **Astra** for primary implementation, architecture, and context-sensitive decisions.
- **Luna** for lightweight, mechanical, or routine delegated work.
- **Sol** for independent review of substantial changes.

Delegation is optional. Keep it proportional to the task and do not create subagents when direct execution is simpler.

## Worker Delegation

Prefer delegating clearly scoped, low-risk work to Luna, including:

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

Review should focus on bugs, regressions, missed requirements, broken interactions, architectural or maintainability issues, meaningful UX problems, and missing verification.

The reviewer reports findings; the primary agent decides which findings require changes and remains responsible for the final result.

Do not invoke independent review for trivial changes.

## Working Principle

Use strong reasoning where judgment matters. Use lightweight agents for routine execution. Keep delegation proportional to the task.
