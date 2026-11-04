# FAB FLOW architecture decisions and evidence

Review baseline: FAB FLOW source commit `7cfb6c58073a80df5c3d310c6ce9584679edc277`. This note separates decisions visible in current code from intent recorded in historical engineering documents. It does not claim these are formal product ADRs committed in the FAB FLOW source repository.

## ADR 01 — Native fixed-step simulation owns logistics transitions

**Status:** Current implementation; rationale inferred from code and validation documents.

**Decision:** Advance logistics state in `Engine.tickOperational()` on fixed 0.5 simulation-second boundaries. Playback scheduling grants work to the Engine; browser frame count does not define simulation time.

**Evidence:** `src/sim/engine.ts` (`tickOperational`, `step`) and `src/sim/playback.ts` (`PlaybackScheduler`). `FabFlow.tsx` calls one Engine step per scheduler task. Transport and playback tests cover separate parts of the boundary.

**Trade-offs and limits:** A long Engine tick lowers achieved playback speed and can delay UI input because the Engine runs in the application thread. Catch-up yields between task callbacks; hidden tabs and long event-loop gaps discard wall-clock debt. The Engine still processes native state transitions it has started. Same-seed behavior is meaningful only with the same Engine version, scenario, policy, schedules, intervention history, and starting state.

## ADR 02 — Model guideways as a directed graph with shared path geometry

**Status:** Current V6 implementation; design rationale inferred from source.

**Decision:** Route over explicit directed Node/Link edges. Keep sampled curve points on each Link for distance and rendering. In V6, a Port has a dock node and one-way approach/exit links; an apparent crossing does not create a connection by itself.

**Evidence:** `src/sim/topology-default-v6.ts`, `src/sim/types.ts`, `src/sim/engine.ts` (`v2BestPath`), and `src/components/ThreeFacilityScene.tsx`. Link length is derived from sampled path length divided by eight geometry units per meter. Medium/Large central bays have an added cross transfer that Small lacks.

**Trade-offs and limits:** This makes route legality explicit and keeps displayed rail geometry aligned with simulated path positions. V6 is an educational topology, not a verified representation of an industrial fab or an industry standard. The topology is not an unrestricted bidirectional grid.

## ADR 03 — Rank routes separately from admitting a vehicle to a link

**Status:** Current implementation; the separation is inferred from the Engine flow.

**Decision:** DBR ranks routes by distance. The default CBR model adds estimated downstream delay converted to distance. After a route is selected, admission separately checks failure/closure, FIFO order, section occupancy, tick protection, and projected cycle risk before acquiring the resource.

**Evidence:** `src/sim/engine.ts` (`buildOperationalEdgeCosts`, `v2BestPath`, `dispatchOperational`, `admitOperational`). See the source equation and caveats in `review-2026-11-04/ENGINEERING_EVIDENCE.md`.

**Trade-offs and limits:** A route with a good estimated cost may still wait at admission. The reverse search shares destination work but materializes paths for reachable sources, so total dispatch work is not only the heap search bound. Cycle prevention and recovery do not guarantee global deadlock or starvation freedom. DBR/CBR do not promise a throughput winner.

## ADR 04 — Publish view data separately from persistence snapshots

**Status:** Current implementation; boundary is a calling convention, not a type-enforced encapsulation.

**Decision:** Copy view data with `publicationCopy()` for React. Save and load a versioned `Engine.snapshot()` through `storage/repository.ts` and validate it with `Engine.restore()`.

**Evidence:** `src/sim/publication.ts`, `src/components/FabFlow.tsx`, `src/sim/engine.ts` (`snapshot`, `restore`), and `src/storage/repository.ts`.

**Trade-offs and limits:** The UI receives detached publication data and does not create transport transitions. Persistence retains scenario/state and optional analysis; route scratch, renderer objects, and transient controls are rebuilt. `Engine.state` is public, so the ownership boundary is not enforced by a private immutable type. IndexedDB use does not establish backup, durability, or crash-recovery guarantees.

## ADR 05 — Keep the Engine in the current execution context; defer a Worker boundary

**Status:** Worker deferral is documented historical intent. The ordinary live playback path in `FabFlow.tsx` uses the same-thread Engine; comparison-worker utilities in other paths are outside that live boundary.

**Decision:** Keep the ordinary live Engine and scheduler in the app execution context. A historical performance review documented that for its Small backlog workload, the expected clone/publication and timer coupling made a Worker boundary unattractive. That is the review rationale, not a measured Worker-versus-main-thread comparison.

**Evidence:** Current `src/sim/engine.ts`, `src/sim/playback.ts`, and `src/components/FabFlow.tsx`; historical analysis in `docs/V3_5_PERFORMANCE_REPORT.md`.

**Trade-offs and limits:** This avoids adding a message protocol and another state-copy boundary to the live path, while a long tick remains main-thread work. No live Engine Worker prototype or Worker speed-up was established. Re-evaluate if measured workloads, input responsiveness, or engine isolation needs change.

## Evidence grades used by the article

- **Source verified:** behavior inspected at the pinned source commit above.
- **Historical measurement:** a saved report result with its workload, build, and host limits retained. It is not a new measurement of this article commit.
- **Current local validation:** checks run against the Build Canvas checkout for this article revision; it does not imply remote deployment or engine production performance.
- **Unverified:** exact deployed source parity, current production response, real-fab behavior, or any claim not supported by the two source repositories.

The Work 6 article keeps these grades visible in its quality table. Performance numbers are labeled historical; simulation throughput, hardware-independent performance, industrial safety, and standards equivalence are not inferred from the diagrams or tests.
