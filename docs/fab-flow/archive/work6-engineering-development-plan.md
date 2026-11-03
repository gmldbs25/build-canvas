# Work6 — Behind the Simulation / 최종 개발 실행 계획
> Status: implementation-ready planning · 2026-11-02  
> Scope: `gmldbs25/build-canvas`의 **Work 06만**. 원본 `gmldbs25/fab_flow`는 완료된 별도 제품으로 취급한다.  
> 콘텐츠·디자인의 단일 기준: [work6-engineering-rework-v3.md](work6-engineering-rework-v3.md) (v3.1).  
> Native 보존 계약: [reuse-contract.md](reuse-contract.md).  
> **이 문서는 구현 실행 허가가 아니다.** 현재는 설계·개발 계획만 저장하고 실제 Work6 코드는 수정하지 않는다.

## 0. 한눈에 보는 결정
- **삭제 후 재개발하지 않는다.** 2026-11-02에 완성되어 있는 11 Scene Work6를 구현 자산으로 취급한다. 4 Act / 8 Scene은 **기존 기능과 시각화의 재편집** 목표이다.
- 우선순위: **FAB FLOW Native 3D 자산 보존 > 진짜 엔진 상태·경로·운송 정확성 > 관람자 이해 > 인터랙션 간결성 > 화면 수/코드 양**.
- 별도의 FAB FLOW 앱, 엔진 또는 OHT/FOUP/레일/장비 렌더러를 다시 만들지 않는다. FAB FLOW는 Work6의 **소스와 설명 대상**이지 새로 개발할 타깃이 아니다.
- 시연의 세계와 실험 결과를 혼동하지 않는다. Scene 07의 역사적 operational 2.1 벤치마크 수치는 현재 Large V6 라이브 3D의 실측치가 아니다.
- 독자가 보는 1차 본문은 가볍고, 기술적 엄밀성은 실제 코드 근거를 가진 선택적 심화로 제공한다.
- 구현은 **작은 단위 감사 → 연결 → 검증 → 변경** 순서다. 아직 유용한 코드를 통째로 지우지 않는다.

## 1. Baseline 및 Scope Freeze
### 1.1 확인된 기준
- 기존 Work6 실행 코드의 마지막 확인 커밋: `230803867355423382cd0003d95dc8bfee709e6b` (2026-11-02; Scene7 실제 Native fleet 회귀 테스트). 이후 내용/계획 문서 커밋이 이어졌다.
- 내용 설계 v3.0: `0d49db8fedbecfeb4c5d9094db54acbc005e51f1`. v3.1 갱신과 본 실행 계획은 docs-only 후속 작업이다.
- 개발 착수 당일 **반드시** `origin/main` HEAD와 Work6 관련 실제 diff를 다시 확인한다. 위 SHA는 감사 기준일 뿐, 작업 시작 시점의 HEAD 고정값이 아니다.
- 기존 공개 프리뷰 경로: `/build-canvas/fab-flow-preview/`; 이 경로는 리워크에서도 유지하며 링크·base path를 변경하지 않는다.
- 주요 Native 의존: `projects/fab-flow/src/sim/`, `components/ThreeFacilityScene.tsx`, `components/fabCamera.ts`, `useAmbientIntro.ts`, `usePressureWorld.ts`, `routeStudy.ts`, `introScenario.ts`.
- 렌더링 스타일: `src/original-tycoon.css` 및 `src/work6.css`; 3D 시각적 정체성 유지.

### 1.2 작업 경계
**수정 허용:** `gmldbs25/build-canvas/projects/fab-flow/`, `docs/fab-flow/`에서 Work6의 내러티브, 카메라 연결, Native state presentation, 필요한 작은 UI/테스트.  
**수정 금지:** `gmldbs25/fab_flow` 원본 레포, Work1~5 코드/자산, 무관한 공통 빌드 도구, GitHub Pages 공개 URL.  
**기술 불가피 예외:** 변경 전에 diff/위험/대안과 이유를 문서로 제시하며, 임의로 금지 범위 변경하지 않는다.  
**Git:** 현재 배포본을 유지하기 위해 구현은 안전한 **전용 작업 브랜치**에서 수행하는 것을 기본으로 한다. 매 단계 검증 가능한 커밋으로 누적하고, 전체 품질 게이트를 통과한 뒤 main 통합을 진행한다. PR/직접 통합 방식은 실제 저장소 권한과 사용자 지시에 맞추되 force push/reset/clean으로 작업을 버리지 않는다. **문서만 업데이트하는 현재 단계와 코드 배포는 구분**한다.

## 2. 기존 → 새 Scene 재사용 지도
| 신규 Scene | 기존 Work6 재사용 근거 | 해야 할 최소 변경 | 보존할 확인 사항 |
|---|---|---|---|
| 01 작은 공장이 움직인다 | 기존 01~02 `useAmbientIntro`, Native 전체/근접 3D | 질문·인트로 리듬 재편집, 한 차량에 짧게 집중 | 실제 다수 차량의 움직임/원본 세계와 안정된 카메라 |
| 02 공장을 그래프로 바꾸면 | 기존 04 규모 공개, 05 레일 방향성, Native `network` view | 원본 실제 Directed Link와 객체 라벨을 엮는 토글 | 원본 레일·Port·경로와 주석 일치 |
| 03 한 건의 운송 | 기존 03 `TutorialCommandLayer`, 7 native commands | 7 필수 버튼 대신 4 관찰 묶음·자동/단계별/재관람 구성 | Request → Dispatch → Empty → Pickup → Route → Loaded → Dropoff의 **모든 가드** |
| 04 시간의 규칙 | 기존 `Engine`, `publicationCopy`, Snapshot, camera | 진짜 0.5s step, Pause/Step/Replay를 **안전한 엔진 제어 경계**에 추가 | native tick·state만 노출, 튜토리얼 명령 가드 우회 금지 |
| 05 경로 선택 | 기존 06·10, `routeStudy`, `inspectDecision`, Native route highlight | 선택/대안/함께 보기 정리 및 비용 설명 | 실제 선택 경로와 대안의 법적·시나리오적 구분 |
| 06 혼잡과 대기 | 기존 07~09, `usePressureWorld`, `scene7Traffic`, original Traffic view | 전체 흐름/확정 대기 시점에만 집중, 지표 축소 | 실제 레일 대기만 표현, Deadlock 허위 판정 금지 |
| 07 정책 비교 | 기존 Native 비교 기능/운영 보고서 자료, Large 3D | 검증된 비교 카드·출처 설명 추가 | DBR/CBR 동일 조건·완료/미완료 값, 이전 모델 출처 |
| 08 역할 분리·마무리 | 기존 10 기술 구조·11 FAB FLOW CTA, 동일 3D 모델 | Engine→State→Three 역할 주석, 단일 CTA | 원본 FAB FLOW 연결, 디지털 트윈 오해 방지 |

### 보존 우선 기능
- 실제 OHT·FOUP의 픽업/하역, 동일 소유권, 2.7초 카메라 규모 공개, Close/Follow/Bay/Whole, 방향성 레일, 실제 경로 강조, Large 고혼잡 Native rail wait, OHT 회전/헤딩 seam 회귀, 수치 진위.
- 과거에 잘 된 장면을 새 Scene 안의 짧은 비트로 옮길 수 있다. **8개를 만들기 위해 작동하던 핵심 연출을 삭제하지 않는다.**
- 구버전 MCS 미래 AI/다층 콘셉트는 본편에서 **제외**하되, Git 이력 및 기존 설계 문서를 보존한다.

## 3. 구조 및 코드 변경 정책
### 3.1 역할 경계
- `work6-scenes.ts`: 단일 Scene 정의/카피/순서/메타데이터. Scene 11개로 하드코딩된 부분을 감사한 뒤 8개로 줄인다.
- `work6.tsx`: Narrative Controller. Scene 선택, 사용자 제어, Native 엔진 선택, 카메라 명령, 상황 해설/심화/CTA. **가능하면 분리된 하위 컴포넌트로 복잡도를 줄이되 한 번에 대규모 재작성하지 않는다.**
- `ThreeFacilityScene.tsx`, `sim/*`: 기술적 진실의 소유자. 기본적으로 수정하지 않으며, 상태 관찰이 필요하면 비파괴적 읽기 경계만 추가한다.
- `useAmbientIntro`, `usePressureWorld`, `routeStudy`: 이미 입증된 Native 사례의 소유자. 단순 장면용 임의 차량 배치·가짜 경로·무리한 시나리오 변경 금지.
- `work6.css`: 텍스트·Drawer·반응형만 재구성. `original-tycoon.css` / 원본 레일·OHT 재질은 재디자인하지 않는다.

### 3.2 Native Engine 간 이동
- 같은 Large V6 3D 레이아웃을 그리더라도 Scene 01 ambient / 03 tutorial / 05 route study / 06 pressure / 07 historical benchmark는 **동일한 상태가 아니다**.
- 가능한 경우 `ThreeFacilityScene` 인스턴스와 원본 자산을 재사용하되, 서로 다른 Engine/시나리오 전환을 UI로 명확하게 알린다.
- Scene 03 원본 튜토리얼은 command-own Tick이다. **Scene 04의 1-Tick 동작을 이를 임의로 step()하여 만드는 방법은 금지**. 실제로 정상 조작 가능한 Snapshot/별도 Native Engine을 준비해 state, 시간, 결정성을 검증한다.
- Scene 간 빠르게 이전/다음/재시작할 때 timer, async warm-up, browser worker, stale render callback은 취소/epoch guard를 적용한다. 이전 Scene 엔진이 새로운 Scene을 진행시키면 P0.
- 고혼잡 장면의 Warmup은 UI를 잠그지 않는 bounded batch/yield를 유지. 시뮬레이션 step skip/teleport 불가.
- 07에서 3D가 실제 정책 실험의 Snapshot이 아니라면 배경은 **장면의 맥락**으로만 표시하고, 실험 결과와 시각적으로/문구상 분리한다.

## 4. 단계별 개발 (한 번에 전면 교체 금지)
### P0 — 원본 인벤토리·기준선 확보
**작업:** Git 최신 확인, Work6 실행·빌드·test:browser 현 상태 실행, 주요 11 Scenes/카메라/Native 전이의 스크린샷과 기능 목록. 현재 Main 코드 SHA/실행환경/기존 Known Issues 기록.  
**수정:** 실행 기능 수정 없음. `docs/fab-flow/implementation-audit.md`와 evidence 원본 기록만.  
**통과:** 기존 페이지가 살아 있고 기존 테스트 결과와 P0 결함/환경 제한을 재현 가능하게 문서화. **기준선이 없으면 대규모 변경 시작 금지.**

### P1 — 콘텐츠 재편집·내비게이션
**작업:** `work6-scenes.ts`를 최종 8개 카피/Act로 재배열; Scene title/body/심화 데이터 분리. 기존 원본 canvas를 그대로 유지하며 기본 레이아웃/시야/좌우 이전·다음/H/반응형 구현. 오래된 11개 라우팅/상태/테스트 하드코딩 교체.  
**검증:** 장면 8개 모두 접속, 이미지/장비 누락·Canvas 크기 변경 없음, H/화살표 안전.  
**통과:** 8개 Scene 탐색과 텍스트 기본 구조가 작동하며 기존 Native 3D가 보인다.

### P2 — 기존 3D 연출 재연결 (Scenes 01/02/05)
**작업:** `useAmbientIntro`, Network, `routeStudy`, 기존 카메라 명령을 새 Scene에 연결. 선택 경로/대안 라벨 명확히 하고 카메라 연출 재사용.  
**검증:** 01의 실제 이동, 02의 Directed Link·Port 동일성, 05의 Engine 유효 경로, 시나리오 로딩 실패 시 안내.  
**통과:** 원본 3D/경로·카메라 재사용을 실제 스냅샷·엔진 상태로 입증.

### P3 — 운송 이야기 압축 (Scene 03)
**작업:** 기존 7 command는 유지하면서 4개의 관찰 묶음으로 presentation orchestration. **자동 관람/단계별 관람/다시 보기**; 중지/재시작/cancel tokens; Hoist 마지막 보간과 FPS 보호.  
**검증:** Native Request·FOUP 소유권·Port·OHT·일시정지/복귀·최종 Completed, 실제 운송 영상.  
**통과:** 강제 7번 클릭 없이 이해 가능하고, 단계별 조작도 가능하며 마지막 하역까지 실제 Native 상태 정확.

### P4 — 결정적 Tick 시각화 (Scene 04)
**작업:** 시연 가능한 Native Engine/Snapshot을 명시적으로 분리, 0.5s Step, Pause, Resume, Restart, State/time readout, seed/동일 조건 재현 검사.  
**검증:** 1 step당 Engine time 정확히 +0.5s, Pause 시 시뮬레이션 상태 불변, Reset 후 동일 seeded schedule/실제 핵심 상태 일치. UI interpolation을 Engine.step으로 착각시키지 않는다.  
**통과:** 임의 상태 조작 없이 실제 Tick 원리를 짧게 관찰 가능.

### P5 — Native 혼잡과 실측 정책 비교 (Scenes 06/07)
**작업:** 기존 실제 Large rail wait를 06에 연결, traffic 토글/실제 표시. 07에 operational 결과를 **버전·실험 기간·시드·Fleet·정책 조건까지 붙여** 설명. 필요하면 검증된 V6 matched 실험 데이터를 추가 측정하되, 시간/비용이 크면 이전 결과임을 명확히 밝히고 진행.  
**검증:** rail wait는 실제 차단/점유; Deadlock 아닌 상태를 Deadlock이라 표시하지 않음. 07 DBR 131/240·CBR 130/240의 출처 정합성, Live 3D와 별개라는 표시.  
**통과:** 시각적으로 흥미롭고 지표 해설은 간결하며 오해 없는 관찰.

### P6 — 역할 분리·결말 (Scene 08), 심화 및 Polish
**작업:** 원본 3D 위에 Engine/State/Three 역할 주석, 심화 Drawer 내용 실제 `sim`/렌더러 근거 검수, CTA와 홈/다시 보기. 모바일 가로·세로/작은 화면, 텍스트/3D overlap, 카메라 전환, 키보드·터치·Reduced Motion.  
**검증:** 기본 화면 본문이 짧고 읽히며, 펼치기 없이 결론 이해. Scene 08 CTA는 정확한 Vercel URL.  
**통과:** 8 Scenes 전체 리듬/디자인 일관성과 인지 부하 통과.

### P7 — 품질 게이트·릴리스
**작업:** 배포 전 품질표 및 실제 브라우저 결과·원본 코드 변경 범위·예외, 빌드/정적 Pages 경로 회귀.  
**통과:** 모든 P0~P6 acceptance + no fabricated state + Work1~5 unaffected. 사용자에게 실제 화면 기준 검토 가능하도록 샘플/배포 방식 보고하고, 동의된 방법으로 main 통합·배포. 배포/CI 성공과 실 브라우저 결과를 구분해 기록.

**단계별 공통 규칙:** 각 단계는 작은 diff, 단위 테스트, 최소 관련 브라우저 확인, 원인/Before→After, 검증 기록, 커밋으로 종료한다. P 단계 하나를 마치기 전에 다음 P의 기능을 무분별하게 선행 개발하지 않는다.

## 5. 실제 테스트 계획
### 5.1 기존 smoke suite 주의사항
`projects/fab-flow/scripts/browser-smoke.mjs`는 **구버전 11장면**의 이름/버튼/데이터 속성 및 `data-scene-count=11`을 가정한다. **예전 기대값을 삭제해서 Green으로 만드는 방식은 금지.**
- 테스트를 새 8 Scene에 맞게 다시 작성하면서 다음 보호 계약을 계속 포함한다.
- `oht-heading-seam-regression`, Native FOUP 픽업/하역, 실제 선택 경로 유효성, 안정된 카메라, 혼잡이 진짜 Rail Wait인지 여부, 렌더러 WebGL, 각 Scene 진입/다시 보기/다른 Scene 돌아오기.
- 신규로 04 Tick/seed 및 07 벤치마크 출처/해설, Drawer·키보드/터치/CTA를 추가.
- 기존 테스트에만 있던 기능이 본편에서 사라진다면 **구기능 보존 근거**를 명시. 중요한 Native 계약은 Scene 수와 관계없이 별도 테스트로 유지.

### 5.2 명령 (실제 환경에서 실행 후 결과를 보고)
```bash
git status --short
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
npm install --prefix projects/fab-flow --package-lock=false --no-audit --no-fund
npm run typecheck --prefix projects/fab-flow
GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/fab-flow-preview npm run build --prefix projects/fab-flow
npm run test:browser --prefix projects/fab-flow
# 통합 종료 게이트 (필요한 설치/환경 세팅 후)
npm run lint
npm test
npm run build:pages
```
- Work6 browser smoke는 내부적으로 `projects/fab-flow/dist-pages`의 **실제 정적 Pages 결과물을** `/build-canvas/fab-flow-preview/`에 서빙해 검증한다.
- baseline 혹은 네이티브 Worker 계산으로 테스트가 길어지면 작업을 병렬 난사하기보다 비용을 기록하고 타깃 검증→전체 검증 순서로 실행한다.
- 현재 문서 작성 과정에서 위 명령을 실행한 적은 없다. 테스트 수행/통과를 추정해 적지 않는다.

### 5.3 수동 검토 필수 시나리오
- 1440×900 / 1366×768 / 390×844 / 844×390 또는 동급 가로 모바일; Chrome/Chromium과 실제 가능한 모바일 브라우저.
- 단일 scene 동작, Scene 전환/뒤로가기/빠르게 왕복, 재시작/Skip/Reduced Motion, 고혼잡 로딩 중 다른 scene으로 이동, 팝업 열린 채 키보드, CTA.
- 모든 Scene에 하나 이상의 **진짜 FAB FLOW 3D 관찰 근거**가 있는가. OHT/FOUP이 작거나 가려지지 않는가.
- 실제 화면 캡처와 03 픽업~하역, 05 경로 강조, 06 Rail Wait, 04 Tick 등 짧은 동작 증거를 남긴다. 자동 smoke 성공만으로 디자인 승인 주장 금지.

## 6. P0 / P1 Blockers, Fail-safe
**P0 — 배포 및 데이터 거짓/손상**
- 실제가 아닌 운송/시뮬레이션을 Native라 주장, 임의 State/time 점프, FOUP 중복/소유권 위반, 렌더러/엔진 분리 위반, P0 JS Error로 Work6 접근 불가, Work1~5 회귀, 원본 FAB FLOW 변경.
- 발생 시 해당 변경을 main에 통합하지 않고 브랜치에서 원인 해결.

**P1 — UX·디자인 실패**
- 원본 FAB FLOW와 무관한 가짜 그래픽으로 대체, 3D가 텍스트에 가려짐, 작은 글씨로만 설명, Scene 이동이 자동으로 강제, 6~8분 목표를 무시한 긴 필수 인터랙션, 여전히 11-scene 구버전 테스트만 실행.
- P1 해결 전 최종 완료로 보고하지 않는다.

**의도된 한계 표시**
- FAB FLOW는 교육용/공개 연구 기반 모델이며 실제 산업 공정의 기밀 layout이나 calibrated Digital Twin이 아님.
- 이전 operational 2.1 결과를 현재 V6의 결과로 포장하지 않음.
- Dijkstra 비용은 ETA 보장이 아니고 CBR 우월도 보장하지 않음.
- waiting/stalled와 확인된 deadlock cycle을 구분한다.

## 7. 개발 착수 시 Orchestrator 체크리스트
- [ ] 현재 origin/main과 작업 트리 확인, 충돌/기존 작업 보존
- [ ] 새 기준 SHA 및 native source/hash 기록, baseline browser evidence 확보
- [ ] 위 v3.1 최종 설계/이 계획/Native reuse contract/AGENTS.md 읽고 충돌 없음 확인
- [ ] 구현용 분리 브랜치/작은 커밋 전략 수립, 기존 배포본 보존
- [ ] Source 파일별 재사용/축소/신규 항목 표와 Phase별 예상 위험 기록
- [ ] 단계별 테스트 및 실패·보류 사항 보고
- [ ] 전체 8 Scene 품질/원본 시각화/시나리오 정합성 최종 검토
- [ ] main 통합 또는 배포 전 사용자가 결과를 살펴볼 수 있는 구체적 검증 근거 준비
- [ ] 다른 repo/Work 변경이 없음을 확인하고 완료 보고

## 8. 문서/커밋 관리
- Content authority: `docs/fab-flow/work6-engineering-rework-v3.md` (v3.1)
- Implementation authority: **이 파일**
- Runtime truth: `projects/fab-flow/src/`의 실제 Native 코드 + 테스트
- Historical rationale: `work6-master-plan.md`, 과거 11 Scene Git commit
- Source reuse: `reuse-contract.md`
- Audit/evidence: 개발 개시 후 `docs/fab-flow/implementation-audit.md`와 작업 단계별 결과 보고서
- 사용자 검토 결과로 제목/장면 수/보여줄 현상 자체가 바뀌면 문서 변경 이유를 먼저 남긴다.
