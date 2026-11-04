# FAB FLOW 엔진 근거 메모 — Work6 아티클 개선용

검토 기준: `/workspace/fab_flow`의 읽기 전용 소스, `HEAD = 7cfb6c58073a80df5c3d310c6ce9584679edc277` (연결된 GitHub main과 독립 대조). `AGENTS.md`와 PRODUCT/VALIDATION, 엔진·토폴로지·렌더러 코드, 성능 보고서 및 보존된 감사 문서를 대조했다. 소스 트리에는 변경을 가하지 않았다. 아래 줄 번호는 해당 SHA의 파일 기준이다.

## 아티클에서 말할 수 있는 구현 사실

### V6 노드·링크·포트 구조

- 공식 단층 제품은 V6 Small/Medium/Large다. `src/sim/topology-default-v6.ts:15–19,181–206`은 프리셋을 정의하며 각각 bay 1×2, 2×2, 3×3; bay당 포트 8, 10, 12개로 구성한다. 따라서 구조상 총 포트는 Small 16, Medium 40, Large 108이다. 토폴로지 코드는 현재 환경에서 실행하지 못해 노드/링크 총계는 여기서 주장하지 않는다.
- 각 장비 포트는 자체 dock 노드(`port.node`)를 가지며 양방향이 아닌 유향 링크 두 개, `entry → dock` 접근과 `dock → exit` 이탈로 레일에 붙는다 (`topology-default-v6.ts:227–245`). 설명은 “Port가 rail에 그려진 점”보다 “Port의 dock node와 단방향 접근/이탈 link”가 정확하다.
- 일반 링크는 `from`, `to`, 단위 용량 1, 자원키 `v6-${id}`, 곡선 경로 및 경로 길이(geometry 단위를 8로 나눠 meter 환산)를 가진다 (`topology-default-v6.ts:12,38–41`). 넓은 횡단과 베이는 여러 section link/node로 나뉜다 (`:61–84`). 링크 하나를 무한 수용 가능한 도로로 묘사하지 말 것.
- V6는 양방향 고리 하나가 아니라 방향이 정해진 북/남 서비스 레인, 중앙 전진/복귀 spine과 제한된 연결·터미널 회전으로 만든다 (`:218–225,248–299`). Medium/Large 중앙 bay에는 추가 횡단 연결이 있지만 Small에는 없다 (`:284–294`). “모든 곳에서 자유롭게 U턴”은 잘못된 설명이다.
- 생성 뒤 V6 topology validation 및 장비/레일 간격 검사가 수행된다 (`:158–178`, 생성 경로 후반). 장비 배치 시에도 floor 경계, 기능 장비 간 여유, 레일 clearance와 장비 겹침을 확인한다 (`:113–155`). 공개 설명은 layout data에서 유효한 유향 그래프와 곡선 레일을 생성한다고 표현하고 산업 표준/실 FAB 등가성은 주장하지 않는다.

### 결정적 0.5초 Tick과 순서

`src/sim/engine.ts:23–26`에서 tick은 0.5초, 이동 속도는 4m/s, 포트 픽업/하역 service는 각각 1.5초다. 한 일반 rail tick에서 차량은 최대 `4 × 0.5 = 2m`를 진행하며, 더 짧게 남은 링크는 해당 남은 길이만큼 이동해 다음 node에 도착한다 (`:1175–1185`). Dock 도착 시 serviceRemaining을 1.5초로 설정하고 이후 node 처리 tick에서 이를 감소시킨다. 따라서 service duration을 도착·진입 tick까지 포함한 고정 세 tick으로 표현하지 않는다. 이 값은 공개 교육용 모델 가정이지 현장 속도/서비스 측정이 아니다.

한 native tick의 핵심 순서는 코드상 다음과 같다 (`engine.ts:1118–1142,1154–1187,1189–1224`):

1. Native 시각을 다음 0.5초 경계로 올리고 tick 증가; 2.3 failure event 경계 처리.
2. 차량 고장 상태 계산, 저장 FOUP release와 고정 demand schedule의 요청 방출.
3. Tick protection/점유 현황 및 혼잡 비용 계산, pending 요청 dispatch.
4. 차량 ID 정렬 순서로 각 차량 1회 처리: 기존 link에서 이동/대기하거나 node에서 서비스·경로·link admission.
5. busy/waiting 회계, 요청 timing 합계 보존 검사, FIFO queue와 operational cycle 갱신; 20번째 tick마다 cycle recovery hook.
6. transient protection 정리 뒤 fleet 변경과 intervention 반영 및 fleet accounting.

주의: dispatch된 차량은 그 tick의 이동 루프에서 건너뛴다 (`:1154–1157`). 따라서 그림에서 배차와 첫 이동을 동일 순간으로 그리지 말고, “이번 tick에 배차 → 이후 tick에서 이동 처리”로 표시한다. 시뮬레이션 논리는 브라우저 프레임율에 종속되지 않고 fixed step을 실행한다.

### 요청 수명주기·FOUP 소유권·상태

- `src/sim/types.ts:37–41`의 요청 단계: `pending → assigned → pickup → loaded → dropoff → completed`. 차량 상태는 `idle/empty/pickup/loaded/dropoff`이며 link/node/progress, 요청 소유, route, loaded, waiting 등을 갖는다 (`:38–41`).
- 배차 시 pending 요청을 생성시각/ID 순으로 정렬하고, 목적지의 저장+예약 load가 port capacity 미만인지 확인한다. 사용 가능한 idle 차량과 유효 경로 중 선택하며 `nearest`는 경로 cost 최저, `fifo`는 가능한 차량 정렬순, `eta`는 경로 ranking이다. 위치/요청/route 할당 후 tickProtection에 launch node 도착을 기록한다 (`engine.ts:1296–1323`). 공개 설명은 “가장 가까운 OHT”라고 일반화하지 말고 설정 가능한 정책과 합법 경로 기준을 함께 명시한다.
- 배차 단계는 차량을 source까지 빈차로 보낸다. source dock에서 port service가 비었고 node guard가 통과해야 `pickup`에 들어간다 (`engine.ts:1362–1365`). 1.5초 픽업 서비스 뒤 차량 loaded, 요청 `loaded`가 되고 destination 방향 경로를 계산한다 (`:1348–1357`). 목적지 서비스가 끝나면 요청 완료, FOUP를 destination의 stored 목록에 두고 release 시간을 설정한다 (`:1353–1357`). 완료와 FOUP 즉시 제거를 같은 상태로 그리지 말 것: destination storage dwell도 존재한다 (기본 24초, `:26`).
- Engine은 port capacity 및 저장/예약 occupancy를 관리하고, UI는 실제 요청·저장 FOUP 소유를 바탕으로 표현한다. Three scene의 `foupOwners`가 source/vehicle/stocker ownership을 구성하는 코드가 `ThreeFacilityScene.ts:1861–1865`에 있다. 렌더러가 이송·완료 상태를 만들어내지 않는다 (AGENTS 제품 불변식과 부합).
- 차단 시 vehicle wait reason/resources와 queue를 Native가 갱신한다. 진행 불가를 화면 애니메이션으로 추정해서는 안 된다.

### DBR / CBR 정확 비용식과 범위

기본 MCS 설정은 `distanceWeight=1`, `congestionWeight=2.5`, reroute threshold 0.15, recalculation interval 5s, dispatch policy `nearest`이며 config 필드 정의는 `engine.ts:30` 및 `types.ts:31`이다. 기본 `congestionModel`은 `delay` (`engine.ts:1250–1251`). 이 모드에서, 각 유향 edge/link `e`의 거리 비용은 `distanceWeight × link.length`; DBR은 이 값만 사용한다 (`:1253–1255`). CBR은

`cost(e) = distanceWeight × length(e) + congestionWeight × (4 m/s × estimatedDelaySeconds(e))`

이고 `estimatedDelaySeconds`의 현재 모델은 남은 점유 section 거리/속도 + 같은 section FIFO 대기열 길이×링크 길이/속도 + downstream 점유 owner의 service/movement chain delay를 포함한다 (`:1256–1278`). 이것은 시간으로 추정한 지체를 4m/s로 거리 단위에 환산해 거리비용과 합치는 route ranking cost다. CBR을 단순 “차량 수가 많은 edge에 고정 penalty”라거나 실제 교통 simulation으로 표현하지 않는다. 재계산은 실패 edge일 때 또는 차량이 대기 중이고 configured interval tick에 도달했을 때; 새 경로가 현재보다 threshold만큼 나아야 우회한다 (`:1372–1378`).

레거시 `congestionModel: 'legacy'`를 쓰면 비용식이 다르다: `distanceWeight×length + (CBR일 때) congestionWeight×length×(2.5×min(1,used)+0.75×min(1,queue))` (`engine.ts:1282–1294`). 문서/다이어그램에 식을 적을 때 제품 기본 delay model과 이 compatibility 경로를 혼동하지 않는다. `comparePolicies()`는 같은 scenario clone에서 DBR/CBR 두 Engine을 만들고 둘 다 duration까지 같은 tick 수만큼 수행한다 (`:2041–2047`). “matched inputs”는 동일 scenario/demand seed·fleet·schedule의 비교를 뜻하며 정책에 따라 궤적/상태가 같다는 뜻은 아니다.

### Snapshot / restore / replay

- `Engine.snapshot()`은 `version:1`, scenario, state의 clone과 analysis 활성 시 복사된 analysis를 내보낸다 (`engine.ts:1024–1026`). `Engine.restore()`는 snapshot version/schema, 정책·scenario time 일치, 시간/tick 정합성, analysis event 일치 및 복원 invariant를 검사하며 last completed tick 경계를 재설정한다 (`:1033–1068`, `:1077–1079`).
- Replay와 restore는 다르다. Restore는 저장된 Tick 경계의 state에서 계속하고, replay는 `interventionHistoryComplete`가 true일 때만 초기 scenario/policy와 난수 seed, 기록된 개입을 사용해 새 Engine을 실행한다. 이는 renderer frame을 재생하지 않는다. 동일 조건 비교에는 scenario, seed, policy, schedules, intervention history, engine version이 같아야 한다.
- UI publication은 `publicationCopy`로 valid plain data를 독립 복사해 React에 건네며, JSON stringify/parse를 쓰지 않는다 (`src/sim/publication.ts:1–19`; `FabFlow.tsx:41–43`). `Engine.snapshot` 및 저장/restore 검증과는 별개의 경로다. IndexedDB 저장은 full state structured clone을 계속 사용한다 (`docs/V3_5_PERFORMANCE_REPORT.md:73,81`).
- scheduler는 monotonic wall-time credit만 관리한다. 500ms simulation credit당 native 0.5s tick 1회이며 task callback 하나에 tick 하나, catch-up 때 16ms yield, 지연 debt는 최대 3 full ticks+fraction으로 제한한다. 숨김 탭과 >1s event-loop gap에서는 debt를 버리고 새 시각 기준으로 재개한다 (`src/sim/playback.ts:1–2,81–123`). 따라서 selected playback speed는 목표이고 보장 속도가 아니다. Native time은 scheduler가 frame 수로 보정하지 않는다.

### Renderer와 traffic 표시의 해석

- 시각화 경로는 WebGL Three.js 장면이며 렌더마다 3D world를 그린다. WebGL 초기화 실패 시 accessible 2D `FacilityScene` fallback이 표시된다 (`src/components/ThreeFacilityScene.tsx:19,2137`). animation은 Native state의 연속된 확인 tick 사이에서 보간하며, 누락/비연속 endpoint 사이를 가짜 경로로 만들지 않는 adjacency/semantic guard가 있다 (`docs/V3_5_PERFORMANCE_REPORT.md:83`).
- rail traffic 수는 렌더 측에서 `vehicle.link`를 세고, 대기열은 Native `state.linkQueues`에서 가져온다 (`ThreeFacilityScene.tsx:1800–1802`). 뷰는 현재 vehicle traffic, queue, closure, selection, 분석 모드에 따라 rail 색상/opacity를 갱신한다 (`:1808–1834`). 이 색상은 순간 차량/대기 현황 시각화이며 엔진 cost 그 자체, 예측 미래 점유, 정책 승리 판정이 아니다. Analysis mode에서는 분석 데이터를 사용해 색을 정한다.
- native 엔진은 OHT 위치, FOUP/request 상태 및 이동 권위다. Three renderer는 those state를 draw/interpolate하고 traffic visualization을 만든다. 아티클 다이어그램은 화살표를 UI에서 Engine 방향으로 두기보다 Engine state → React publication → renderer; user command → Engine input으로 분리한다.

### 타입 관계와 모듈 경계

- `Layout`은 `nodes[]`, `links[]`, `ports[]`를 담는다. 각 `Link.from/to`는 Node 하나를 참조하고 선택적 `path: Point[]`와 resource key를 포함한다. Link resource는 독립 Resource 객체/table이 아니다 (`src/sim/types.ts`, `topology-default-v6.ts`). V6 Port의 `node`는 dock node이며 Equipment는 `portId`로 Port를 참조한다.
- Vehicle은 현재 Node와 optional Link/progress를 보유한다. `route: string[]`는 남은 Node ID 경로다. `RouteCandidate { nodes, links, distance, cost, selected }`는 경로 계산 결과이며 persistent Route 서비스/엔티티가 아니다 (`engine.ts` route type 근처).
- `control.ts`는 tick protection과 static control geometry를 제공합니다. `analysis.ts`는 simulation 내부 KPI/집계를 관리합니다. `FabFlow.tsx`가 Engine ref와 UI publication 경계를 연결하고 `PlaybackScheduler`가 Tick callback을 예약합니다. 이 모듈들은 독립 process/서비스가 아닙니다.
- `Engine.state`는 public입니다. Native Engine이 권위이고 React에 detached publication을 전달하는 호출 규약은 확인했지만, TypeScript private/immutable encapsulation을 주장하지 않습니다. `engine.ts`에는 여러 책임이 함께 있어 유지보수성은 module name만으로 과장하지 않습니다.

## 성능 자료: 인용 가능 범위와 제한

1. `docs/V3_5_PERFORMANCE_REPORT.md:28–47`: 프로파일 상 Small backlog native tick 2.31ms 평균/4.17ms p95, dispatch 약 0.15ms/tick. Large/300 diagnostic 30.14ms 평균/155.53ms p95이며 합법 경로검색, movement wait, admission, cycle 검사에 집중. 별도 6 input×3 repeat×240 tick phase diagnostic에서 Large300 stress는 movement/service/route/admission 10.031ms, request lifecycle 1.607ms, queues/cycles 1.447ms/tick. 해당 run의 진단 instrumentation은 결과를 교란할 수 있고, 중첩 method wrapper 시간은 합산 불가. 실제 알고리즘/환경 한정 값으로 인용하고 전 기기 성능이라 주장하지 않는다.
2. 같은 보고서 `:32`: recursive valid-domain publication copy ablation 300 samples에서 JSON round-trip 4.93ms mean/9.4 p95, structuredClone 6.29/10.4, recursive copy 2.10/4.0. 여기서 약 57% 빠르다는 것은 해당 copy 실험에 한정되고 통합 simulation 전체가 57% 빨라졌다는 뜻이 아니다.
3. 같은 보고서 `:91–95`: desktop 1440, exact backlog workload, 8× 설정, 3 repetitions에서 achieved mean rate 4.2829× → 7.7228× (+80.32%), conservative clock gain +79.59%, pairwise gains 78.26–82.13%. 평균은 선택한 속도의 96.5%여서 8× 보장 아님. 이는 V3.5 playback/publication 개선의 보고 결과이므로 현재 SHA/Work6 자체의 새 벤치 결과로 라벨링하면 안 된다.
4. `docs/stability-audit/PERFORMANCE.md:53–64`에서 congestion된 Large300/CBR checkpoint 브라우저 대조는 analysis off에서 1.347→1.521 simsec/wallsec, on에서 1.520→1.073. 서로 반대인 단일 pair이며 build 차이도 있다. 성능이 모든 경우 개선됐다는 표현은 부정확하다.
5. 동일 문서 `:66–80`은 같은 900.5s/300 CBR checkpoint 200 tick의 nested wrapper phase를 기록하고 full snapshot equality를 보고한다. 전체 native total은 4642.40→4715.01ms, 단순 나누면 약 23.21→23.58ms/tick (instrumentation 포함). Inclusive phase 합은 중첩되어 합산할 수 없다. `transport-liveness/FINAL_REPORT.md`/`04_REVIEW.md`에 남은 SVG 20 FPS 미달 10.107 FPS도 제품 제한으로 적합하다. 이것은 모든 화면의 renderer 성능을 대표하지 않는다.

모든 숫자는 가상화 Linux/Chromium/SwiftShader 등의 측정 조건, 입력, 횟수를 함께 적는다. 산업 FAB의 처리량·충돌안전·SEMI 준수·하드웨어 독립 성능 증거로 전용하지 않는다. 제품 문서와 `AGENTS.md`가 명시한 교육용 공개 근거 모델 한계를 유지한다.

## Work6 아티클에 넣기 좋은 정확한 표현

> FAB FLOW의 Native Engine은 방향이 정해진 V6 guideway 그래프 위에서 0.5초마다 요청·배차·OHT 이동·포트 service·대기·KPI를 갱신한다. 각 port는 rail의 dock node에 접근/이탈 link로 접속하며, 경로 선택은 합법 유향 경로와 link 점유·queue를 반영한다. DBR은 기본 거리 비용을, CBR은 같은 거리 비용에 현재 모델의 추정 downstream 지체 비용을 더해 경로를 비교한다. OHT와 FOUP의 실제 상태는 Engine이 보유하고 Three.js 또는 접근 가능한 2D fallback이 확인된 state를 보여준다. 같은 scenario·seed·외생 schedule·snapshot 경계는 tick 단위 재생과 비교를 가능하게 한다. 이는 교육/설명용 모델이며 실제 FAB 설비 성능이나 산업 규격 동등성을 주장하지 않는다.

이 문안에서 “합법”은 그래프/용량/대기/점유/admission guard 준수라는 구현 의미다. “산업 인증 안전”으로 확장하면 안 된다.

## Implemented architecture views

The original proposal below has been replaced with source-linked diagrams and tables in `projects/fab-flow/src/ArchitectureViews.tsx` and `architecture-views.css`. The source is still not modified; Build Canvas explains the pinned Engine behavior.

- **A–B · Module ownership and interfaces:** `FabFlow.tsx`, `playback.ts`, `engine.ts`, `control.ts`, `analysis.ts`, `publication.ts`, Three/2D scene and storage responsibilities with input/output direction. The diagram says these are same-app module boundaries, not independent services. `Engine.state` is public; the ownership rule is a current calling convention, not TS-enforced immutability.
- **C · Data model:** `Layout` owns Node/Link/Port arrays; links reference two Nodes and carry optional sampled paths/resource keys. Vehicles keep optional current Link/progress and remaining Node IDs. `RouteCandidate` is temporary. `StoredFoup` records request/port/release time; no general `Foup.phase` entity exists.
- **D–F · Tick execution and transport state:** Source order comes from `engine.ts:1118–1248`, with request dispatch at `1296+`, node handling at `1326+`, admission at `1562+`, and waiting at `1605+`. The table distinguishes dispatch, zero-progress link admission, later movement, arrival, dock service, loaded routing, destination storage and post-Tick accounting. A newly dispatched vehicle skips same-Tick movement; admission does not add distance; link arrival does not also execute next-node service.
- **Routing and admission view:** `buildOperationalEdgeCosts`, `v2BestPath`, `v2PathsToTarget`, `dispatchOperational` and `admitOperational` separate cost ranking, legal route availability, destination reservation and resource entry. Reverse search materializes routes for reachable starts, so the route phase is not summarized solely by the heap bound. Cycle mitigation does not guarantee global liveness.
- **H · Persistence / replay / publication:** `snapshot()/restore()` continues a validated saved state; Replay starts a new Engine only when intervention history is complete; `publicationCopy()` is a per-Tick UI payload; `confirmedMotion` only interpolates confirmed endpoints. These paths are displayed separately.
- **Existing chapter figures:** `EngineeringDiagrams.tsx` retains a V6 service-lane/Port dock relationship sketch, DBR/CBR estimated-cost example, wait/admission example and fixed-Tick context. These are explanatory schematics, not runtime captures or exact V6 coordinates.

The views were reviewed at desktop and mobile widths; their accessible tables and horizontally scrollable diagrams preserve detail without turning the entire page into a wide canvas. The detailed five-lens evidence/visual review and browser results are in `ARCHITECTURE_2_REVIEW.md`. The broader evidence and historical performance limits in this memo remain applicable.

## 확인 한계

- `HEAD`가 원격 main과 일치했다. `/workspace/fab_flow/AGENTS.md` 읽었다.
- 실행 환경에 `tsx` 패키지가 없어 topology runtime count probe는 실패했다. 그래서 구조상 포트 총수만 preset 수식으로 기재했고 node/link total은 생략했다.
- 성능 수치는 기존 저장된 V3.5/stability audit 문서 근거로만 적었다. 이번 검토에서 simulation benchmark/browser capture를 새로 돌리지 않았다.
- FAB FLOW source repository was not modified. Build Canvas article and evidence documentation link back to this pinned read-only source SHA.
