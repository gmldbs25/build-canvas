# Build Canvas Agent Instructions

## Scope

- These instructions apply repository-wide unless a more specific instruction file exists deeper in the tree.
- Follow the repository conventions in `README.md`.
- Before changing an existing Work, inspect its relevant source under `projects/` and any Work-specific documentation under `docs/`.
- Keep Work-specific design decisions local to that Work unless they are explicitly documented as repository-wide conventions.

## Agent Roles

Use a simple three-role model when the corresponding models are available and configured:

- **Astra — Lead / Orchestrator**  
  Owns planning, task decomposition, architecture, context-sensitive decisions, integration, final verification, and the final result.

- **Luna Max — Worker**  
  Executes clearly scoped implementation and routine work from Astra. This includes normal feature edits, UI changes, repetitive changes, repository exploration, build/test/lint commands, and routine Git operations.

- **Sol — Reviewer**  
  Provides an independent review of substantial changes, focusing on bugs, regressions, missed requirements, technical accuracy, maintainability, and meaningful UX issues.

Do not add another model tier unless a future task demonstrates a clear recurring need for it.

## Delegation

Astra should delegate work only when the task can be scoped clearly enough that a worker can execute it without making architectural decisions.

When delegating to Luna Max, Astra should provide:
- the concrete goal
- the relevant files or area when known
- important constraints
- clear completion or verification criteria

Luna Max may handle implementation that requires ordinary coding judgment as long as the scope is clear.

If Luna Max encounters ambiguity, architectural trade-offs, unexpected conflicts, or work outside the delegated scope, it should stop and return the decision to Astra rather than expanding the task on its own.

Astra reviews important delegated results before accepting or integrating them.

## Git Operations

Routine Git work should preferably be delegated to Luna Max when Git work is part of the task.

This includes:
- `status` and `diff`
- staging and routine commits
- fetch and safe pull/rebase operations
- push and remote synchronization checks
- routine post-push CI or deployment checks

Escalate Git work to Astra when it involves:
- meaningful merge or rebase conflicts
- force pushes or history rewriting
- destructive reset or clean operations
- deleting branches or tags
- reverting substantial work
- any ambiguity that could discard user changes

Do not perform destructive or history-rewriting Git operations without explicit user authorization.

## Independent Review

For substantial implementation changes, prefer a Sol review after implementation and basic verification.

Sol should report findings rather than take ownership of the implementation. Astra evaluates the findings, decides what should change, and remains responsible for the final result.

Do not invoke Sol for trivial changes where independent review adds little value.

## Working Principle

Astra thinks, scopes, and integrates.  
Luna Max executes clearly defined work.  
Sol independently reviews meaningful changes.

If Luna Max cannot complete a task safely within its scope, return it directly to Astra rather than escalating through additional model tiers.
