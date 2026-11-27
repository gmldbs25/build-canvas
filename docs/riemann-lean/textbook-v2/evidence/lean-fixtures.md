# Work08 Lean replay fixtures

Recorded 2026-11-27 UTC from the pinned small exercise environment. These runs cover the textbook mini examples only; the 2026 RH/GRH proof was not built locally.

## Toolchain and invocation

- Lean: `4.35.0`, commit `eb6cafb7290e8bd5f2937522d8d804f58f02bafc`.
- Mathlib: `56a005855ea17e0b0958f73ec801ae140b0a1679`.
- Import for each fixture: `Mathlib.Basic.Real.Basic`.
- Command: `PATH=/tmp/work8-lean/bin:$PATH XDG_CACHE_HOME=/tmp/work8-mathlib-cache lake env lean <fixture.lean>` from the pinned Mathlib checkout.
- The cached build covered the selected small Mathlib import. `import Mathlib` was not used, and the large proof archive was not downloaded or built.

## Successful source and real `trace_state`

[`Success.lean`](lean/Success.lean) exited 0. Lean printed these states during the successful invocation:

```text
P : Prop
⊢ P → P
P : Prop
h : P
⊢ P
P Q : Prop
⊢ P ∧ Q → Q ∧ P
P Q : Prop
h : P ∧ Q
⊢ Q ∧ P
a b : ℝ
⊢ a = b → b = a
a b : ℝ
h : a = b
⊢ b = a
a b : ℝ
⊢ a = b → 0 < b → 0 < a
a b : ℝ
h : a = b
⊢ 0 < b → 0 < a
a b : ℝ
h : a = b
hab : 0 < b
⊢ 0 < a
a b : ℝ
h : a = b
hab : 0 < b
⊢ 0 < b
n : ℕ
⊢ 0 + n = n
```

The command also printed:

```text
'identity_demo' does not depend on any axioms
'conjunction_demo' does not depend on any axioms
'equality_demo' depends on axioms: [propext, Classical.choice, Quot.sound]
'positive_of_equal' depends on axioms: [propext, Classical.choice, Quot.sound]
'zero_add_demo' depends on axioms: [propext]
```

SHA-256: `c1c61670b924d36cc371ed16a7cd4ad8541f2a44d10a6e8218ef26643faf03c5`.

## Expected failures

[`FailureWrongType.lean`](lean/FailureWrongType.lean) exited 1:

```text
error: Type mismatch
  h
has type
  a = b
but is expected to have type
  0 < a
```

The same invocation printed the actual pre-error goal:

```text
a b : ℝ
h : a = b
⊢ 0 < a
```

SHA-256: `356c2ef1a89a1a045c187d29d94b133a655096d9b3f54a22cd349c4bc40b8078`.

[`FailureWrongProjection.lean`](lean/FailureWrongProjection.lean) exited 1:

```text
error: Type mismatch
  h.left
has type
  P
but is expected to have type
  Q
```

The same invocation printed the actual pre-error goal:

```text
P Q : Prop
h : P ∧ Q
⊢ Q
```

SHA-256: `e2edc61c903d5265e6c65eb20335d506a370fa7a2c0c2876e730bfbb5c480c69`.

The UI reproduces these exact captured Goal State/error fixtures. It does not parse free-form Lean or imitate an online compiler.

## Larger proof source and verification provenance

The compact source-read seed is pinned to `lsernau/grh-lean` commit `72fead102f663d5c7a407964a13dc0cf9d977207`. The manually reviewed file blobs are:

| File | Git blob |
|---|---|
| `grh-compact/src/Statements.lean` | `1cd1bce93344065936b2b392b23306254e0785ef` |
| `grh-compact/src/Main.lean` | `a5d8389131c985a0b54ce5b0e778ee5c8126a997` |
| `grh-compact/src/New/Main.lean` | `198ed5bf26aa294898931e0649bc2b88f1389f65` |

The 17 rows in [`PROOF-SOURCE-MAP.md`](../PROOF-SOURCE-MAP.md) are selected named source occurrences, read by hand from those pinned files; they are not a complete dependency extraction. Definition locations for several intermediate declarations remain pending.

MIT’s shorter-proof record was checked at its latest page timestamp, 2026-11-26 20:46 UTC: <https://math.mit.edu/~drew/shortgrh/>. It reports that compact and readable both compile, use only `propext`, `Classical.choice`, and `Quot.sound` for the five targets, and pass whole-proof checks. Compact paranoid comparator passed on two machines. Readable paranoid comparator passed on the larger machine; a separate run on the smaller machine stopped for memory limits, without a verdict. These are MIT-reported results, not local Work08 results.

MIT’s original-proof record was checked at 2026-11-25 22:05 UTC: <https://math.mit.edu/~drew/grh/>. It reports 175,187 modules, standard axioms, per-module replay, independent checker results, and paranoid comparator acceptance. Alpöge’s original public release was archive-only and did not name an upstream Git commit. The frozen community mirror `homeowmorphism/riemann-hypothesis-original` says it preserves the submission exactly as published; its source links are pinned at mirror commit `545e2b54604508ae6845a05d431a9c966cfe7276`: [`src/Main.lean`](https://github.com/homeowmorphism/riemann-hypothesis-original/blob/545e2b54604508ae6845a05d431a9c966cfe7276/src/Main.lean) and [`src/Statements.lean`](https://github.com/homeowmorphism/riemann-hypothesis-original/blob/545e2b54604508ae6845a05d431a9c966cfe7276/src/Statements.lean). The original Mathlib dependency is pinned at `0df444a360eaa60ab8c11dca51a86af692955474`. These links support the five endpoint statements, but we did not derive an original dependency graph.
