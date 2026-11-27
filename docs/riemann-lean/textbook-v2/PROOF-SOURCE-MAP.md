# Work 08 V2 — 실제 증명 논증 지도 (source-read seed)

## 범위와 증거
2026-11-27에 lsernau/grh-lean commit 72fead102f663d5c7a407964a13dc0cf9d977207의 compact 판본 세 파일을 직접 읽었다. 아래는 읽은 선언 본문에서 확인한 선별 의존 관계이며 Lean export를 기계적으로 완전 추출한 DAG가 아니다. 읽은 파일의 blob SHA도 기록한다. 노드 단위로 독립 커널을 실행한 것이 아니며, 전체 compact 판본의 검증 상태는 MIT 보고에 귀속한다.
- Statements.lean: 1cd1bce93344065936b2b392b23306254e0785ef
  https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Statements.lean
- Main.lean: a5d8389131c985a0b54ce5b0e778ee5c8126a997
  https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean
- New/Main.lean: 198ed5bf26aa294898931e0649bc2b88f1389f65
  https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean

## Chapter 12.4에 추가할 본문: 핵심 논증을 실제 소스에서 읽다

단축본의 핵심은 디리클레 L-함수에서 실수부가 1/2보다 큰 영점이 존재하지 않음을 보이는 정리 New.grh다. 실제 Main.lean의 다섯 끝점은 이 하나의 반평면 결과와 이를 영점 위치 명제로 변환하는 정리에 연결된다. 예컨대 일반적인 제타 함수에 관한 리만 가설은 New.zeta_zeros_on_line New.grh의 형태로 만들어진다. 따라서 독자는 Chapter 07에서 배운 함수 방정식의 대칭이 마지막 단계에서 어떻게 쓰이는지 볼 수 있다.

그렇다면 오른쪽 반평면 결과는 어디에서 오는가? New/Main.lean은 최종 논증의 뼈대를 직접 설명하고 있다. 산술·기하적 대상으로부터 얻는 부피 및 높이의 상한과 하한을 비교하면 큰 주항이 상쇄되고 소수합의 나머지에 대한 한쪽 부등식이 남는다. 실제 코드의 star_inequality는 admissible data D에서 D.m * D.remainder ≤ D.logB ^ 2 * D.budget을 보인다. 이 부등식에 데이터 존재와 특정 구간 선택에 관한 논증을 결합하여 eventually_primeError_le_rpow가 나온다. 해당 정리는 충분히 큰 x에 대해 primeError P.d P.N₀ x ≤ x^(8ε−1/2)를 얻는 형태다. 이 primeError는 그 소스에서 정의한 정규화된 산술적 오차 함수이지 Chapter 10의 ψ(x)−x와 동일한 함수가 아니다. 정의를 읽지 않고 두 식을 동일시하지 않는다.

마지막 New.grh는 특정 L-함수의 영점이 오른쪽 반평면에 있다고 가정한 뒤, 해당 오차 상한을 entireL_ne_zero_of_primeError_le에 전달하여 모순을 얻는다. 소스 주석은 이 기준을 Landau의 보조정리와 연결한다. 그 기준의 전문적인 해석학 증명과 앞부분의 산술·기하 논증은 원본 링크로 제공한다. 이 책에서는 증명의 전체 골격을 설명하되, 그 구성 요소의 정당화를 직접 재현했다고 주장하지 않는다.

이 경로는 앞 장의 명시적 공식 실험과 다르다. 명시적 공식은 왜 영점이 소수에 영향을 주는지를 설명하는 학습 도구다. 실제 형식 증명은 별도의 깊은 논증을 통해 영점이 있을 수 없는 영역을 확보한다.

## Source-read edges (from theorem to directly named dependency)
각 행은 위 세 파일의 선언 본문에서 실제 등장한 이름을 눈으로 확인한 선별 간선이다. Lean Meta/export로 추출한 전체 그래프가 아니며 모든 implicit dependency를 포함하지 않는다. 링크는 고정 commit의 해당 source line으로 간다. 표기된 이름과 간선 방향은 정리 → 직접 참조 의존 항목이다.

| from | to | evidence |
|---|---|---|
| riemannHypothesis | New.zeta_zeros_on_line | [compact Main.lean L5](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L5) |
| riemannHypothesis | New.grh | [compact Main.lean L5](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L5) |
| riemannZeta_eq_zero_re | riemannHypothesis | [compact Main.lean L7](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L7) |
| LFunction_ne_zero_of_half_lt_re | New.grh | [compact Main.lean L8](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L8) |
| LFunction_eq_zero_re | New.zeros_on_line | [compact Main.lean L10](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L10) |
| LFunction_eq_zero_re | New.grh | [compact Main.lean L10](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L10) |
| LFunction_eq_zero_re_of_isPrimitive | LFunction_eq_zero_re | [compact Main.lean L12](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/Main.lean#L12) |
| New.grh | eventually_primeError_le_rpow | [compact New/Main.lean L172](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L172) |
| New.grh | entireL_ne_zero_of_primeError_le | [compact New/Main.lean L163](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L163) |
| eventually_primeError_le_rpow | star_inequality | [compact New/Main.lean L149](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L149) |
| eventually_primeError_le_rpow | exists_data | [compact New/Main.lean L135](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L135) |
| eventually_primeError_le_rpow | IsPolar.exists_window_sub_mul_le | [compact New/Main.lean L138](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L138) |
| star_inequality | exists_family_covolumeSq_le | [compact New/Main.lean L107](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L107) |
| star_inequality | integral_forms_long | [compact New/Main.lean L119](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L119) |
| star_inequality | abs_mainHeight_add_remainder_le | [compact New/Main.lean L114](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L114) |
| New.zeros_on_line | LFunction_one_sub_eq_zero | [compact New/Main.lean L176](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L176) |
| New.zeta_zeros_on_line | completedRiemannZeta_one_sub | [compact New/Main.lean L184](https://github.com/lsernau/grh-lean/blob/72fead102f663d5c7a407964a13dc0cf9d977207/grh-compact/src/New/Main.lean#L184) |

Important: New.zeros_on_line and New.zeta_zeros_on_line accept nonvanishing as a hypothesis; they do not directly depend on New.grh as global declaration. Endpoint applications connect the proof. Do not draw fabricated direct edges between these generic lemmas and New.grh. The named dependencies below New/Main.lean are reference occurrences, not yet inspected at their own definition locations. Display source occurrence permalink and 'definition pending' until resolved.

## UI seed
View 1: five exact endpoints, select and read mathematical statements from Statements.lean and endpoint body.
View 2: compact proof spine (conceptual direction opposite direct dependency): geometric/arithmetic comparison → one-sided prime-error bound → analytic nonvanishing criterion → right-half-plane GRH → RH/GRH on line. Distinguish the conceptual chain from direct edges above.
View 3: direct named dependency graph, select node to see code statement, explanation, source occurrence/definition, status.
View 4: verification ledger, separate MIT original and compact/readable snapshots. Source-read vs independently reported whole-proof checks vs locally checked declarations must not be collapsed into one badge.

## Evidence links
- MIT original verification (2026-11-25 22:05 UTC): https://math.mit.edu/~drew/grh/
- MIT shorter proof verification (latest page snapshot checked 2026-11-26 20:46 UTC): https://math.mit.edu/~drew/shortgrh/
- Lean community statement: https://leanprover-community.github.io/blog/posts/riemann-hypothesis/
- Human-reading resources: https://rh-lean-roadmap.github.io/rh-lean-roadmap/ and https://nasqret.github.io/riemann-rev/book/intro.html
- Original proof is a different revision and structure; do not reuse compact names as original edges. The original archive was published without an upstream Git commit; the frozen mirror pin and endpoint-only use are documented below.

### Original five targets — pinned source mirror checked 2026-11-27
Alpöge's first release was an archive, not an author Git commit. The frozen community mirror `homeowmorphism/riemann-hypothesis-original` states that it preserves the 2026-11-20 source exactly as published. Its mirror commit is `545e2b54604508ae6845a05d431a9c966cfe7276`. Use that mirror only for the five endpoint declarations and statement source, not as evidence for a dependency graph:
- Main declarations: https://github.com/homeowmorphism/riemann-hypothesis-original/blob/545e2b54604508ae6845a05d431a9c966cfe7276/src/Main.lean (`riemannHypothesis` L5, `riemannZeta_eq_zero_re` L7, `LFunction_ne_zero_of_half_lt_re` L9, `LFunction_eq_zero_re` L10, `LFunction_eq_zero_re_of_isPrimitive` L12).
- Four custom statement definitions: https://github.com/homeowmorphism/riemann-hypothesis-original/blob/545e2b54604508ae6845a05d431a9c966cfe7276/src/Statements.lean (L3, L6, L10, L14). `RiemannHypothesis` is Mathlib's definition at `Mathlib/NumberTheory/LSeries/RiemannZeta.lean` L185, pinned to original Mathlib commit `0df444a360eaa60ab8c11dca51a86af692955474`.
- Provenance: mirror README says it preserves the source exactly as published and notes that the author's release had no source repository commit. MIT's original whole-proof report remains separate: https://math.mit.edu/~drew/grh/ (last updated 2026-11-25 22:05 UTC).

## Acceptance
17 edges above are manually source-read seed, not complete dependency extraction. Verify them against fixed revision in implementation, resolve missing source declarations, preserve statements and provenance. Do not use uninspected/third-party hints as actual dependencies. If the original view cannot be backed by genuine source, show original verification summary and compact verified-source graph only. Do not block a usable educational view on importing entire proof. Additional deep graph expansion requires mathematical/source review.
