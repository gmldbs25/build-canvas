# FAB FLOW — Work6 Content Structure & Evidence Register

> Status: **Published article copy v1 / historical screenshots remain version-labeled** · 2026-11-03  
> Product: **FAB FLOW / 반도체 물류 세상** · Deep-dive theme: **Behind the Simulation**  
> Build Canvas baseline `gmldbs25/build-canvas@457e9e895673b175ab7ed319b5fa27385f4c7751` · FAB FLOW source baseline `gmldbs25/fab_flow@7a1ad9b36ccbf2c173a3676d85b7f790111378f7`.  
> The public Work6 now uses locally exported historical images with a source manifest. These are real source captures, not verified exact-current live screenshots. The FAB FLOW repository is **private**. Paths below identify evidence for implementers; an eventual public-facing article must use exported/approved media and accessible public reference captions rather than expecting readers to open private GitHub links. The GitHub combined commit status for FAB FLOW source main **7a1ad9b** reports **Vercel: success** ([deployment receipt](https://vercel.com/hanauma-yoon/fab_flow/GRLk5fkfEEHtWzeYMdQctjbRxmK1)); this indicates an exact-SHA deployment success but **does not independently verify the live page appearance or user-visible controls**. Main source and internal release reports were inspected.

## 0. Editorial contract

**Progression:** “무슨 게임이지?” → “무엇을 조작하고 관찰하지?” → “이 현상을 어떻게 코드로 구현했지?” → “직접 해볼까?”  
**Contents:** 00–10, 3 parts (DISCOVER 00–02, EXPLORE 03–05, BEHIND THE SIMULATION 06–10). Every part is one uninterrupted vertically scrollable article. The Chapter IDs are heading/anchor metadata, **not** interactive Scene steps.

Claim labels for internal authoring:
- **[SOURCE]** current `fab_flow/main` code directly inspected on 2026-11-03; does **not** prove Vercel exact SHA.
- **[REPORT]** documented test or historical screenshot, potentially a different production checkpoint.
- **[CAPTURE REQUIRED]** fresh current-product screenshot or recording needed before publication.
- **[ILLUSTRATIVE]** intentionally simplified schematic, not a physically exact FAB map.
- **[DO NOT CLAIM]** planned idea, unsupported speed, real-fab physical equivalence, or a speculative performance cause.

Scope: the product simulates **FAB transport logistics**, not actual wafer processing, semiconductor yield, full commercial MCS, or a calibrated real facility. OHT means Overhead Hoist Transport; FOUP means Front Opening Unified Pod, the wafer carrier transported between equipment ports. Introduce them in plain language before abbreviations.

## PART 01 — DISCOVER

### 00. FAB FLOW

**Purpose:** an inviting game front page; not an engineering abstract.

**Working title/copy (editable):**

> **FAB FLOW**  
> 반도체 물류 세상  
> 작은 공장 안에서, 물류가 살아 움직인다.  
> 천장 레일을 따라 달리는 운반 차량, 끊임없이 들어오는 요청, 그리고 매 순간 달라지는 운영의 선택. 직접 움직여 보며 나만의 FAB을 운영해 보세요.

**Action:** `FAB FLOW 플레이하기` → `https://fabflow-yoon.vercel.app/` (prominent, accessible; repeat in chapter 10). Tiny companion `Behind the Simulation ↓` directs scroll but is not a competing CTA.

**Visual:** hero-worthy current V6 three-dimensional FAB overview, preferably wide dark-green framing with real gameplay visible. Motion is optional; genuine screenshot still is sufficient. **[CAPTURE REQUIRED]** candidate prior `docs/operations-analysis/1.1/evidence/visual-release-fixed/1920x1080-off.png`. Verify map, UI layout and exact current build before adopting.

**Do not use:** fake 3D trailer, fabricated OHT physics, unverified “세계 최초/산업용” claim.

### 01. 작은 반도체 공장

**Reader question:** “공장에서 무엇이 움직이나요?”

**Working body:**

> 반도체 공정의 여러 장비 사이에서는 웨이퍼를 안전하게 옮기는 일이 반복됩니다. FAB FLOW는 이 이동을 작은 3D 공장 안에 담았습니다. 천장 레일을 달리는 OHT가 FOUP라는 운반 용기를 출발 장비에서 받아 다음 장비의 Port까지 옮깁니다.
>
> 겉으로는 아기자기한 공장처럼 보이지만, 차량은 정해진 애니메이션을 반복하지 않습니다. 경로와 대기, 픽업과 하역은 시뮬레이션의 상태에 따라 달라집니다.
>
> Small에서 전체 흐름을 익히고 Medium과 Large에서는 더 많은 경로와 차량이 만나는 장면을 관찰할 수 있습니다.

**Subcaptions:** `OHT — 레일을 따라 이동하는 운송 차량` / `FOUP — 웨이퍼를 담는 운반 용기` / `Port — 장비와 운송 시스템이 물건을 주고받는 지점`. Optional size row: V6 source topology defines **Small 2 Bay / 16 Port, Medium 4 Bay / 40 Port, Large 9 Bay / 108 Port**; label **“V6 authored layout counts, not real-world fab capacities”** and confirm generated outputs before final static caption. [SOURCE] `src/sim/topology-default-v6.ts` `PRESETS` and `src/sim/layouts.ts`.

**Visual:** same-camera current overview triptych [CAPTURE REQUIRED], optional real 3D OHT/FOUP close-up `docs/screenshots/3d-tycoon/after/transport-loaded-29s.png` [REPORT—historical, check geometry version].

### 02. 물류가 움직이는 순간

**Reader question:** “운송 요청 하나는 어떻게 끝나나요?”

**Working body:**

> 이동 요청이 생겼다고 FOUP가 곧바로 움직이는 것은 아닙니다. 먼저 담당 OHT를 정하고, 빈 차량이 출발지로 향합니다. 출발 Port에 도착하면 FOUP를 들어 올리고, 방향이 정해진 레일을 따라 목적지로 운송합니다. 도착 후 FOUP를 내려놓으면 한 건의 이동이 완료됩니다.
>
> 이 작은 여정에는 서로 다른 판단이 숨어 있습니다. 어느 차를 배차할지, 어느 경로로 갈지, 앞에 차량이 있을 때 언제 멈출지. 뒤쪽의 기술 아티클에서는 각각의 판단을 뜯어봅니다.

**Sequence labels (microcopy):** ① 요청 생성 → ② OHT 배차 → ③ 빈 차 이동 → ④ 픽업 → ⑤ 적재 운송 → ⑥ 하역 완료. The product's tutorial internally also has route, Bay and connected views; the **article is not obliged to copy every tutorial step**.

**Visual:** existing browser video candidate `docs/screenshots/3d-tycoon/after/first-transport.webm` and consecutive source frames `trip-request.png`, `trip-dispatch.png`, `trip-empty-travel.png`, `trip-pickup.png`, `trip-loaded-travel.png`, `trip-dropoff.png` [REPORT]. Prefer a **fresh single-take 12–25s current replay** [CAPTURE REQUIRED] using fixed seed/config and phase annotations. If animation unclear, static strip with captions is better. [SOURCE] `src/sim/tutorial.ts`, `src/sim/engine.ts` (request/vehicle phases).

## PART 02 — EXPLORE

### 03. 나만의 FAB 운영하기

**Reader question:** “사용자는 무엇을 바꿀 수 있나요?”

**Working body:**

> FAB 크기를 선택하고 OHT 수와 물류 요청량을 정하면 새로운 운영 실험이 시작됩니다. 작은 공장에서 천천히 관찰할 수도, 더 많은 차량과 요청을 투입해 혼잡을 만들어 볼 수도 있습니다.
>
> 시뮬레이션이 시작된 뒤에도 수요의 흐름을 바꾸거나 차량을 추가하고, 실행 속도를 조절하며 결과를 지켜볼 수 있습니다. 정답을 맞히는 대신, 어떤 선택이 어떤 현상으로 이어지는지 관찰하는 자유로운 실험실입니다.

**Actual controls, check per screenshot:**
- Size `small/medium/large`, fleet **1–300** initial OHT, policy `DBR/CBR` and demand presets/custom options [SOURCE] `src/components/SandboxSetup.tsx`, `src/sim/engine.ts` validation. The separate `multi-large` preview code exists but **do not advertise it as normal selectable size**.
- Live OHT addition and live demand controls [SOURCE] `src/components/FleetControls.tsx` and `src/components/FabFlow.tsx`; verify exact button labels and supported mode on current deployment.
- Speed UI **1× / 2× / 4× displayed**, mapped internally to target **4/8/16 simulated seconds per wall second**; actual achieved rate depends on device and load. [SOURCE] `src/sim/playback-speed.ts`. Never call displayed 4× a guaranteed real-time 16× achievement.
- Mission mode is not evidenced as a public Work6 subject; **[DO NOT CLAIM]** it exists.

**Visual:** actual `SandboxSetup` desktop crop + wide sandbox image [CAPTURE REQUIRED]; prior `docs/operations/default-fab/browser/small-setup.png` [REPORT] for design reference, not automatic production truth.

### 04. 공장이 막히기 시작하면

**Reader question:** “차량만 더 넣으면 빨라질까요?”

**Working body:**

> 이동 요청이 늘어나는 순간, 공장에는 이전과 다른 풍경이 나타납니다. 더 많은 OHT가 레일을 공유하고, 앞 차량이나 Port를 기다리는 시간이 쌓이며, 아직 완료되지 않은 요청이 남기 시작합니다.
>
> FAB FLOW의 혼잡은 화면에 덧씌운 무작위 효과가 아닙니다. 실제 엔진이 이동과 자원 점유, 대기, 경로 선택을 계산한 결과입니다. 다만 **차량이 많다 = 반드시 느리다** 같은 단정도 피해야 합니다. 배치와 수요, 정책에 따라 결과가 달라지기 때문입니다.

**Illustration method:** matched two-state comparison: same layout V6, seed, initial fleet, policy, graphics/camera and observation duration; only demand rate differs. Capture request counts, completed/pending and waiting units, record observation time. If the matching condition is not reproducible, show two **clearly labeled separate examples** rather than a false A/B proof. [SOURCE] `src/sim/control.ts`, `src/sim/engine.ts`, `src/components/OperationsAnalysis.tsx`. [REPORT] `docs/operations-analysis/evidence/browser/webgl-large-on.png` or `docs/screenshots/3d-tycoon/after/performance-stress-t1800-1440-low-overview.png` are candidate frames, version-tagged.

**Do not claim:** occupied link always means congestion or that a route overlay establishes causality; the analysis defines waiting and occupancy separately.

### 05. 운영을 분석하고 실험하다

**Reader question:** “느낌이 아니라 숫자로 비교하면?”

**Working body:**

> 공장의 상태는 단지 차량이 움직이는 모습만으로는 설명되지 않습니다. 완료한 운송 건수, 아직 남은 요청, 최근 완료 속도, 운송에 걸린 시간을 함께 보아야 운영이 보입니다.
>
> 운영 분석 화면은 최근 흐름과 주목할 레일을 보여줍니다. DBR과 CBR은 서로 다른 경로 비용 정책이며, 동일한 입력 조건으로 실행한 별도 정책 비교 실험에서 결과를 나란히 살펴볼 수 있습니다.
>
> 하지만 관찰된 전후 차이가 반드시 하나의 조작 때문에 발생했다고 단정할 수는 없습니다. 그래서 FAB FLOW는 비교의 조건과 관찰 범위도 중요하게 다룹니다.

**Distinguish the feature set:**
- KPI HUD [SOURCE] `src/components/FabFlow.tsx`.
- Analysis history: 5s buckets × max 180 (up to 15min), event cap 2,000; graph windows 120/300/600s; rail waiting, throughput, completed-transport mean, intervention history. [SOURCE] `src/sim/analysisTypes.ts`, `src/components/OperationsAnalysis.tsx`; detailed definitions [REPORT] `docs/operations-analysis/06_FINAL_REPORT.md`.
- Policy comparison `PolicyWorldComparison`, `src/sim/comparison.worker.ts`, `src/sim/experiments.ts`: matched separate policy worlds, not changing one ongoing session and claiming causal equivalence.
- Save/restore `src/storage/repository.ts` and `src/components/FabFlow.tsx`; replay meaning depends on scenario intervention history completeness; distinguish exact snapshot continuation and source-from-zero replay. [REPORT] `docs/operations-analysis/06_FINAL_REPORT.md` ``운영 이벤트 저장·Replay 방식``.
- Current deployment requires a fresh verification before claiming a specific visible panel or export button.

**Visual:** primary `docs/operations-analysis/1.1/evidence/visual-release-fixed/1920x1080-on.png` candidate, policy comparison `docs/operations-analysis/evidence/browser/webgl-large-comparison.png` candidate, fresh current UI capture [CAPTURE REQUIRED].

## PART 03 — BEHIND THE SIMULATION

The reader is now familiar with the vocabulary. Switch from game screenshots to carefully documented model explanations. Every chapter has: **the observable behavior → its implementation model → what trade-off it creates → optional deep dive**.

### 06. 3D 공장을 코드로 표현하는 방법

**Working body:**

> 화면 속 공장은 입체적인 레일과 장비의 풍경입니다. 그러나 경로를 계산하는 엔진에게 중요한 것은 예쁜 모양이 아니라 ‘어디서 어디로 이동할 수 있는가’입니다.
>
> FAB FLOW는 공장을 Node, 방향이 있는 Link, 장비와 연결된 Port로 표현합니다. 차량이 왼쪽으로 보여도 그 방향으로 진입하는 Link가 없다면 실제 이동은 허용되지 않습니다. 이 연결 관계가 경로 탐색의 출발점이 됩니다.
>
> 이때 화면과 계산을 별도의 세계로 만들어서는 안 됩니다. 렌더링 경로와 시뮬레이션의 위치·길이가 같은 기하 데이터를 읽도록 유지해야 차량이 공중을 가로지르거나 레일 밖을 달리는 일을 막을 수 있습니다.

**Diagram specification:** two synchronized panels: actual V6 factory crop (left) and **simplified [ILLUSTRATIVE] directed graph** (right). One Node, one directed Link with arrow, one service Port; optional link path curve. If diagram is exact-data derived, explicitly document generation/IDs; otherwise mark `개념도`. [SOURCE] `src/sim/types.ts` (Node/Link/Port/Layout), `src/sim/topology-default-v6.ts`, `src/sim/geometry.ts`, `src/sim/layouts.ts`, [REPORT] `docs/operations/DEFAULT_FAB_REPORT.md`.

**Optional technical disclosure:** stable node/link IDs, link length from geometry samples, directional edges and topology validation; why a visually crossed line need not mean a navigable junction.

### 07. OHT를 움직이는 물류 제어 시스템

**Working body:**

> 운송 요청을 처리하기 위해서는 먼저 어떤 OHT가 맡을지 결정해야 합니다. 그 다음 차량이 빈 상태로 픽업 지점까지 가는 경로, FOUP를 싣고 목적지까지 이동하는 경로가 필요합니다.
>
> FAB FLOW의 MCS 로직은 방향성 레일 그래프에서 도달 가능한 경로를 찾고, 거리뿐 아니라 다른 차량의 점유와 대기 비용을 반영할 수 있습니다. DBR은 거리 중심, CBR은 혼잡 비용까지 보는 정책으로 비교할 수 있습니다.
>
> 그러나 경로를 찾았다고 바로 전진할 수 있는 것은 아닙니다. 다른 차량이 자원을 사용 중이라면 대기해야 하고, 레일 점유와 예약, 안전한 진입 순서가 경로 계획만큼 중요해집니다.

**Diagram:** 4-stage pipeline `request → dispatch → shortest-path/alternatives → resource admission/wait → movement` and small map showing two directed candidate routes (no fabricated exact paths). Label Dijkstra as shortest-path family used by **implementation**, not “every route decision always recomputes Dijkstra.” [SOURCE] `src/sim/engine.ts` (typed-array route scratch, occupancy cost, dispatch, admission), `src/sim/topology-routing.ts` (candidate routes), `src/sim/control.ts` (movement control), `src/sim/liveness.ts` (cycle/liveness), [REPORT] `docs/MCS.md` and `docs/operations-analysis/1.1/FINAL_REPORT.md`.

**Optional disclosure:** nearest/FIFO/ETA dispatch types exposed in scenario model are **not all necessarily enabled as current public UI options**; mention as internal strategy only if actual selection UI checked. Define DBR/CBR from actual implementation before writing formulas. Stalls and prevention/recovery policies must have mode/version caveats.

### 08. 시뮬레이션 엔진의 내부

**Working body:**

> FAB FLOW의 가상 시간은 브라우저가 화면을 몇 번 그렸는지로 결정되지 않습니다. 엔진은 고정된 **0.5초 Tick**을 진행하며, 그 경계에서 새로운 요청과 차량 이동, 서비스 및 대기 상태를 갱신합니다.
>
> 동일한 초기 조건과 Seed, 정책, 개입 일정이라면 같은 과정이 다시 실행되어야 합니다. 이 결정성은 서로 다른 운영 실험을 비교하고, 저장된 상태가 정확히 이어지는지 검사하는 토대입니다.
>
> 반면 실제 브라우저 시간은 그 Tick을 ‘언제 실행할지’ 예약할 뿐입니다. 렌더링이 느려져도 0.5초 상태 전이를 임의로 건너뛰어 실제 결과를 바꿔서는 안 됩니다.

**Diagram:** one row of `t = 0.0 → 0.5 → 1.0 → …` discrete states; another separately labeled wall-clock scheduling lane; arrows for demand, assign, move/service, analysis collection, snapshot/publication. Do **not** invent a strict intra-Tick order: confirm exact `Engine` call sequence before drawing arrows. [SOURCE] `src/sim/engine.ts` `TICK_SECONDS=0.5` / `snapshot()` / `restore()`, `src/sim/playback.ts` / `playback-speed.ts`, `src/sim/analysis.ts`, `src/storage/repository.ts`. [REPORT] `docs/V3_5_PERFORMANCE_REPORT.md`, `docs/operations-analysis/06_FINAL_REPORT.md`.

**Optional disclosure:** deterministic seeded RNG and save contract; explain “snapshot continuation” versus “replay from an initial scenario with a complete intervention schedule.” Include version compatibility warnings, not universal legacy compatibility.

### 09. 수백 대의 차량을 브라우저에서 움직이기까지

**Working body:**

> 차량이 몇 대일 때는 보이지 않던 비용이, 수백 대가 되면 중요한 병목으로 드러납니다. 물류 경로를 계산하는 비용과 3D 장면을 그리는 비용, React가 상태를 전달하는 비용은 서로 다른 층에서 발생합니다.
>
> FAB FLOW에서는 엔진과 렌더링을 분리하고, OHT 표시에는 InstancedMesh와 거리별 상세도를 활용했습니다. 레일 분석 화면에서는 반복되는 그래픽 제출을 줄이고, 필요한 시각 정보만 갱신하는 방법을 검증했습니다.
>
> 이런 개선이 모든 조건에서 빨라진다는 뜻은 아닙니다. 어떤 부하에서는 분명히 좋아졌고, 다른 부하에서는 비용이 남거나 회귀했습니다. 그래서 좋은 그래프 하나보다 테스트 조건을 함께 공개하는 일이 중요했습니다.

**Required two visual evidences:** genuine high-fleet screen with actor count caption (not “300 always on rail”); small comparison chart with at least one **validated and explicitly bounded historic measurement**.

**Candidate benchmark, label HISTORICAL — Operations Analysis 1.1:** `large/congested/300/DBR` native Tick **mean 20.248 → 14.912 ms/tick**, `p95 55.781 → 35.173`; `CBR` mean **18.623 → 14.694 ms/tick**, `p95 60.495 → 34.474`. In same report `small/relaxed/8/DBR` mean **0.102 → 0.123 ms/tick** (regression). These are **different measured scenarios**, not FPS and not device-independent performance. [REPORT] `docs/operations-analysis/1.1/FINAL_REPORT.md` `Native 측정`. Before publishing compare report build, exact host specs, source code release provenance and caption. Note reported 300 OHT / 20ms native goal **not universally met**, and the 1.1 browser regression suite has one known legacy SVG failure (149/150 split coverage) rather than claiming 100% pass.

**Other evidence:** [SOURCE] `src/components/ThreeFacilityScene.tsx` (`THREE.InstancedMesh`, LOD/merging and pixel ratio caps), `src/components/railAnalysisBatch.ts`, `src/sim/engine.ts` (typed-array route scratch), `src/sim/playback.ts`, [REPORT] `docs/V3_5_PERFORMANCE_REPORT.md` and `docs/operations-analysis/1.1/FINAL_REPORT.md`. Clearly distinguish Native Tick timing, simulated seconds per wall second, rAF/frame metrics, GPU draw calls, and user input responsiveness.

**Optional disclosure:** a bounded V3.5 story on publication-copy/scheduler overhead with precise measured test basis, or 1.1 overlay draw-call reduction (CBR 385→63 in paused matched context). Do not mix versions in a single unlabeled “before/after”.

### 10. 프로젝트를 마치며

**Working body:**

> FAB FLOW에서 가장 중요했던 선택은 ‘공장이 움직이는 것처럼 보이게 하는 일’이 아니라, 실제로 움직이는 규칙을 먼저 만드는 것이었습니다. 레일을 그래프로 만들고, 운송 상태를 시간에 따라 갱신하고, 그 결과를 3D 세계에 보여주는 일은 서로 연결되어 있습니다.
>
> 이 프로젝트는 실제 FAB 운영 시스템을 대체하지 않습니다. 물류의 핵심 현상을 직접 바꿔 보고 관찰하며 이해할 수 있도록 만든 교육용 시뮬레이션입니다. 동시에 결정적 엔진, 운영 분석, 브라우저 렌더링 사이의 트레이드오프를 실험한 개발 기록이기도 합니다.
>
> 이제 설명을 내려놓고, 직접 공장을 움직여 볼 차례입니다.

**Visual:** final authentic large factory frame (same family as Hero, fresh angle or meaningful dense operational state). **CTA** `FAB FLOW 플레이하기` → `https://fabflow-yoon.vercel.app/`. Tiny `Back to Build Canvas` should remain subordinate. **Do not declare the product feature-complete or performance-complete**.

## Evidence / media shot list (Phase 3 production order)

Use unique article asset names `projects/fab-flow/public/media/` for implementation; **not committed in Phase 2**. Capture from controlled product session with exact Vercel commit/build, V6 layout, seed, OHT, demand, policy, graphics and screenshot resolution. Archive originals and export optimized versions with a manifest.

| ID | Chapters | Deliverable | Candidate source for scouting | Evidence status |
|---|---|---|---|---|
| M01 | 00, 10 | `hero-factory.webp` + `hero-poster.webp` (wide overview) | `docs/operations-analysis/1.1/evidence/visual-release-fixed/1920x1080-off.png` | REPORT; fresh CAPTURE REQUIRED |
| M02 | 01 | `sizes-small/medium/large.webp` (same camera/scale guidance) | `docs/operations-analysis/evidence/browser/webgl-{small,medium,large}-off.png` | REPORT; fresh CAPTURE REQUIRED |
| M03 | 01 | `oht-foup-closeup.webp` | `docs/screenshots/3d-tycoon/after/transport-loaded-29s.png` | historical; replace if visually obsolete |
| M04 | 02 | `transport-sequence.webm` + poster + timed six-frame storyboard | `docs/screenshots/3d-tycoon/after/first-transport.webm` and `trip-*.png` | historical; fresh recording preferred |
| M05 | 03 | `sandbox-controls.webp` | `docs/operations/default-fab/browser/small-setup.png` | REPORT; CAPTURE REQUIRED |
| M06 | 04 | `demand-low.webp` / `demand-high.webp` + config.json | `docs/screenshots/3d-tycoon/after/performance-stress-t1800-1440-low-overview.png` | CAPTURE REQUIRED controlled pair |
| M07 | 05 | `analysis.webp` | `docs/operations-analysis/1.1/evidence/visual-release-fixed/1920x1080-on.png` | REPORT; CAPTURE REQUIRED |
| M08 | 05 | `policy-comparison.webp` | `docs/operations-analysis/evidence/browser/webgl-large-comparison.png` | REPORT; CAPTURE REQUIRED |
| M09 | 06 | `factory-graph.svg` + source note | Types + V6 topology from `src/sim/` | ILLUSTRATIVE; audit direction/labels |
| M10 | 07 | `mcs-route.svg` + actual path crop | `src/sim/engine.ts`, `topology-routing.ts` | ILLUSTRATIVE + CAPTURE REQUIRED |
| M11 | 08 | `tick-pipeline.svg` | `src/sim/engine.ts`, `playback.ts` | ILLUSTRATIVE; review order |
| M12 | 09 | `fleet-high-load.webp` + `benchmark-1.1.svg` with footnotes | Operations Analysis 1.1 evidence/report | HISTORICAL REPORT; verify caption |

**Capture metadata manifest schema (required per asset):** `id`, `source_repo`, `source_sha`, `deployment_sha` (or explicitly unknown), `captured_at_utc`, `scenario.layoutId/layoutVersion`, `seed`, `fleet`, `policy`, `demand`, `sim_time`, `graphics`, `viewport`, `media_path`, `source_reference`, `caption`, `rights_reviewed`, `status`. For videos also `duration` and `transcript_path`. Do not silently “upgrade” a historical image label to current.

## Source audit / safeguards

| Topic | Verified main source | Verification to perform in Phase 3 |
|---|---|---|
| Supported single-floor layouts / V6 | `src/sim/layouts.ts`, `topology-default-v6.ts` | Confirm current app selection and counts |
| Sandbox initial controls | `src/components/SandboxSetup.tsx`, `src/sim/types.ts` | Capture actual UI; verify labels |
| Live interventions & playback | `src/components/FabFlow.tsx`, `FleetControls.tsx`, `src/sim/playback-speed.ts` | Live 1×/2×/4× labels, demand pause/+OHT behavior |
| Vehicle/FOUP lifecycle | `src/sim/engine.ts`, `tutorial.ts` | Same-seed complete trip recording |
| Graph and routing | `src/sim/types.ts`, `topology-routing.ts`, `engine.ts` | Extract limited source-backed exact diagram |
| Analysis / policy comparison | `src/sim/analysis.ts`, `OperationsAnalysis.tsx`, `PolicyWorldComparison.tsx` | UI visible in deployed experience; comparison interpretation |
| Replay / save | `src/storage/repository.ts`, `src/sim/engine.ts` | Confirm scenario versus snapshot UX and unsupported saves |
| Renderer / measured limits | `src/components/ThreeFacilityScene.tsx`, `docs/operations-analysis/1.1/FINAL_REPORT.md` | Provenance and environment of numeric figure |
| Product live parity | `https://fabflow-yoon.vercel.app/` | **Open and record exact deployed SHA** before any current-production claim |

**Current known caveats:** source includes multi-large preview branches, but this story is the ordinary Small/Medium/Large FAB. Performance release reports are **not universal guarantees**. Analysis reports explicitly separate waiting from occupancy and observation from causality. Historical reports may be from older commits. Current deployed site was not independently retrieved in this audit.

## Copy/style QA checklist

- First two sections explain OHT, FOUP, Port without expecting industry knowledge.
- No arbitrary simulation metrics, fake screenshot UI, or unverified “real industrial accuracy.”
- Every acronym expanded once; no dense jargon in DISCOVER/EXPLORE.
- Each diagram's status is visible: real screenshot / source-derived geometry / concept sketch.
- Each benchmark states unit, test environment, workload, version and at least one limitation.
- Each chapter has a reader question, narrative answer, visual evidence and appropriate source.
- No Scene system, play-in-Work6 mechanic, mission content, or partial legacy implementation language.
- User reviews Hero copy/media, 11-chapter text and benchmark figure at Phase 3 before coding.
