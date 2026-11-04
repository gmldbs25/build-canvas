# FAB FLOW Architecture Deep Dive 2.0 — verification and review

## Baselines and scope

Build Canvas remote main at start: d4c6c395f9f0ed3342aed2ac2aa2d20218a090b8. FAB FLOW remote main and read-only local source: 7cfb6c58073a80df5c3d310c6ce9584679edc277. GitHub connector commit lookup confirmed the original engine has no changes after the supplied reference. Original engine working tree remains unchanged.

Views are explanatory renderings of inspected code, not exported runtime traces. Public content uses identifiers and summarized contracts, not private source listings. No credentials, environment configuration, or original implementation code were copied. The three Parts and eleven chapters remain; integration is through the existing EngineeringDiagrams components in chapters06–09.

## Claim traceability

All rows were checked against the full FAB FLOW SHA above. Locations identify the inspected source, not the public article's line numbers. Method: source/type inspection plus cross-check of call order and test definitions. Historical benchmark results are explicitly separate from current article checks.

|View|Claim|Implementation evidence|Status and limits|
|---|---|---|---|
|A–B runtime/module|FabFlow owns the live Engine reference; playback schedules ordinary native steps; MCS is internal|components/FabFlow.tsx:41–43,304–339; sim/playback.ts PlaybackScheduler; sim/engine.ts:567–646 imports/constructor|Verified. Ordinary live path is same-thread; comparison Workers are a separate path. No invented backend or service classes.|
|A–B interfaces|Engine owns logistics mutations; control owns transient guards; analysis collects actual results|engine.ts tickOperational1118, dispatchOperational1296, handleNodeOperational1326, admitOperational1562; control.ts createTickProtection148; analysis.ts collectAnalysisTick|Verified runtime convention. Engine.state is public, not type-enforced immutable/private.|
|C data|Layout arrays, directed link/node/port references, remaining route Node IDs, sampled geometry|types.ts Node/Link/Port/Vehicle/Request/StoredFoup; topology-default-v6.ts link37–41, linkEllipseQuarter43–59, dock234–245; engine.ts RouteCandidate31/sectionKey1840|Verified. Resource is a string key. No standalone FOUP phase or Resource entity. Link length is pathLength/8 meters.|
|D transport|New assignments are excluded from the current Tick vehicle movement loop|engine.ts:1144 dispatch result;1157 dispatchedThisTick check;1296–1323 assignment;1326–1381 node services|Verified. Service, arrival, route selection and later admission span multiple ticks. Diagram is a condensed sequence, not a fixed-duration trace.|
|E state|Request phase differs from vehicle phase; loaded ownership changes only after pickup service|types.ts RequestPhase/Vehicle/StoredFoup; engine.ts:1348–1370; assertInvariants2050 onward|Verified. Waiting/failure is orthogonal. Stored FOUP release removes occupancy; demand remains an independent schedule, not a recycled object flow.|
|F routing/admission|Delay-model CBR cost combines distance with speed times estimated delay; admission separately checks current resource safety|engine.ts:1250–1294 cost model;1562–1620 admission/wait;1785–1838 forward/reverse heap search|Verified. Legacy cost is distinct. Reverse search materializes each reachable source path, potentially quadratic storage; heap bounds alone do not bound dispatch.|
|F recovery|Cycle recovery uses legal alternate admission, with additional2.2 prevention-cone logic|engine.ts:1220 recovery hook;1678–1750 recoverOperationalCycle/recoverPreventionCone; docs/transport-liveness/FINAL_REPORT.md|Verified limited mechanism. Residual SCC and long waits exist in historical validation; no global deadlock/starvation freedom claim.|
|G Tick|Clock/events → protection/cost/dispatch → ID-ordered vehicle work → accounting/queue/cycles → fleet → interventions → optional analysis|engine.ts:1118–1248 tickOperational|Verified. Full assertInvariants is not an every-Tick call. Request timing conservation is checked every Tick; fleet accounting has its own checks.|
|H persistence|Snapshot, Replay and UI publication have different payloads/purposes|engine.ts:1024–1113 snapshot/restore/validation; publication.ts; storage/repository.ts saveEngine/load; FabFlow.tsx:597 onward Replay; motion.ts confirmedMotion|Verified. Layout/schedule/scratch/render objects are reconstructed. Incomplete intervention history prevents from-start Replay. General durability and arbitrary version compatibility are not guaranteed.|
|I quality/ADR|Performance values are historical measurements, separated from article build/browser checks|docs/operations-analysis/1.1/{FINAL_REPORT,NATIVE_VALIDATION,PERFORMANCE_AUDIT}.md; docs/V3_5_PERFORMANCE_REPORT.md; docs/VALIDATION.md|Historical. No new native-engine benchmark, GPU measurement, or release-readiness certification is claimed. Worker deferral is documented rationale; other rationales are labeled source inference.|

## Reviews and actual corrections

These are five review perspectives applied by the root reviewer, alongside the implementation worker. They are not five separate human or model reviewers.

- **A / Software architect:** Added actual module/input/output/ownership table and explicit engine/control/analysis/publication/storage dependencies. Distinguished logical MCS responsibilities from physical modules; disclosed public mutable Engine.state and monolithic engine maintenance cost.
- **B / Simulation engineer:** Rechecked exact Tick order, same-Tick assignment exclusion, arrival/service separation, destination reservations, phase mapping, and derived FOUP ownership. Corrected misleading recycled-FOUP wording and stale fleet/intervention order. Scoped full invariant checks to actual call sites.
- **C / Technical editor:** Preserved existing logical sequence and network overview; added a separate Level2 view. Aligned ADR numbers between article and document. Separated current source facts, inferred rationale and historical reports. Scoped Worker discussion to live playback rather than all comparison execution.
- **D / Visual/UX:** Inspected desktop and mobile rendered chapters plus model/module/sequence/persistence closeups. Corrected missing intermediate SVG arrowheads caused by a multi-subpath path, separated overlapping sequence labels, and expanded the six-stage Tick grid from five columns. Focusable horizontal scroll preserves diagram text size on phones. Long interface, per-stage execution and invariant test-contract tables use native disclosures while core diagrams, state relationships and persistence contracts remain visible.
- **E / Final architecture:** A reader can locate runtime entry points, mutable owners, route versus admission, the lifecycle across ticks and persistence boundaries without inventing services. The article is a source-grounded reference, not a reimplementation specification, commercial control system or industrial safety proof.

## Browser rounds

Round1: local Chromium,1440×900,390×844,320×844.11 chapters; zero page/network errors; document width equals viewport width, both default and all disclosures expanded. axe WCAG2A/AA and2.1AA: zero violations for all six width/disclosure combinations. Automated accessibility checks are not a complete certification.

Round2 passed the same six viewport/disclosure combinations after the actual SVG/label/grid corrections. SVG text bounds stayed within both new SVG viewBoxes; keyboard ArrowRight moved the focused phone diagram40px. A final repeat covers the three added detail disclosures. Final results and build gates are recorded in ARCHITECTURE_2_DELIVERY.md. Representative before/after and new-view screenshots are under screenshots/architecture-2/. Browser checks use the local article; production domain access is a separate gate.

## External access and media

On2026-11-04, permitted-network HEAD requests to the requested Pages and original game domains returned CONNECT403 policy denial. No bypass attempted. No new game still or moving footage was captured; the verified static Hero and existing dated media remain. GitHub Actions/Pages deployment status does not establish live production interaction.
