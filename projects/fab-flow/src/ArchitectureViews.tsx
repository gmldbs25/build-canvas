import type { ReactNode } from 'react';
import { DiagramViewer } from './DiagramViewer';
import './architecture-views.css';

function View({ id, title, purpose, children, source }: { id: string; title: string; purpose: string; children: ReactNode; source: string }) {
  return <section className="av-view" aria-labelledby={`av-${id}`}><div className="av-label">ARCHITECTURE VIEW {id} · SOURCE VERIFIED</div><h4 id={`av-${id}`}>{title}</h4><p>{purpose}</p>{children}<p className="av-source">근거 · {source} · FAB FLOW 7cfb6c58. 실제 구현을 설명하는 도식이며 런타임 추적 캡처는 아닙니다.</p></section>;
}
function Table({ label, headings, rows }: { label: string; headings: string[]; rows: ReactNode[][] }) {
  return <div className="av-scroll" role="region" aria-label={`${label} · 가로 스크롤 가능`} tabIndex={0}><table><caption>{label}</caption><thead><tr>{headings.map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function ArchitectureModelView() {
  return <View id="C" title="타입의 관계와 상태의 소유권" purpose="정적인 Layout, 엔진이 바꾸는 SimulationState, 탐색 중에만 존재하는 경로 결과를 구분합니다." source="src/sim/types.ts · topology-default-v6.ts link / generateDefaultTopologyV6 · engine.ts RouteCandidate / sectionKey">
    <DiagramViewer label="Layout과 SimulationState 데이터 관계도 · 오른쪽으로 스크롤"><svg className="av-svg av-model-svg" viewBox="0 0 940 410" role="img" aria-labelledby="av-model-title av-model-desc"><title id="av-model-title">Core data model · actual types</title><desc id="av-model-desc">Layout이 Node, Link, Port 배열을 소유합니다. Link는 두 Node를 참조하고 Port는 dock Node를 참조합니다. Engine 소유 Vehicle과 Request는 서로 ID를 참조하며 완료 후 StoredFoup가 Port를 참조합니다.</desc><defs><marker id="av-model-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#39836c"/></marker></defs>
      <g className="av-box"><rect x="20" y="20" width="260" height="88" rx="5"/><rect x="340" y="20" width="260" height="88" rx="5"/><rect x="660" y="20" width="260" height="88" rx="5"/><rect x="20" y="180" width="260" height="88" rx="5"/><rect x="340" y="180" width="260" height="88" rx="5"/><rect x="660" y="180" width="260" height="88" rx="5"/><rect x="340" y="320" width="260" height="66" rx="5"/></g>
      <g className="av-lines"><path d="M280 64H340"/><path d="M660 64H600"/><path d="M150 180V108"/><path d="M600 200H625V128H790V108"/><path d="M280 224H340"/><path d="M340 248H280"/><path d="M600 224H660"/><path d="M470 268V320"/></g>
      <g textAnchor="middle"><text x="150" y="49">Link · Layout.links[]</text><text x="150" y="78">from / to · length(m) · path[]</text><text x="470" y="49">Node · Layout.nodes[]</text><text x="470" y="78">id · x / y · floor · area</text><text x="790" y="49">Port · Layout.ports[]</text><text x="790" y="78">node · kind · capacity</text><text x="310" y="43">2 refs</text><text x="630" y="43">1 ref</text><text x="150" y="211">Vehicle · state.vehicles[]</text><text x="150" y="241">node · link? · route: Node ID[]</text><text x="470" y="211">Request · state.requests[]</text><text x="470" y="241">source / destination: Port ID</text><text x="790" y="211">Port reservation / storage</text><text x="790" y="241">getPortOccupancy → derived</text><text x="470" y="347">StoredFoup · storedFoups[]</text><text x="470" y="372">requestId · portId · releaseAt</text><text x="157" y="148">link? → 0..1 Link</text><text x="730" y="155">source / destination → Port</text><text x="470" y="302">completed → storage record</text></g>
    </svg></DiagramViewer>
    <p className="av-small">화살표는 참조와 파생 관계입니다. completed → storage는 레코드 생성 관계입니다. Vehicle과 Request는 활성 운송 중 서로의 ID를 보유합니다.</p>
    <Table label="데이터 모델의 경계" headings={['구조','계약과 관계','변경 권한 / 한계']} rows={[
      ['Layout / Node / Link / Port','Layout은 각 배열을 소유합니다. V6 Port마다 1개 dock node와 접근·이탈 유향 link가 있습니다.','엔진 생성 시 그래프 인덱스를 구성합니다. 화면에서 선이 교차해도 연결은 생기지 않습니다.'],
      ['Link.resource / capacity','resource는 선택적 문자열 키입니다. sectionKey는 resource → 역방향 pair → 개별 link 순서로 자원을 구분합니다.','독립 Resource 클래스는 없습니다. V6 link capacity=1이며 operational admission은 section을 배타 점유합니다.'],
      ['Link.path / length','path는 샘플링된 Point[]입니다. 곡선의 pathLength / 8이 미터 단위 length가 됩니다.','같은 기하가 레일 표시·위치 계산·제어 보호에 쓰입니다. 렌더 프레임이 물류 거리를 추가하지 않습니다.'],
      ['Vehicle.route / RouteCandidate','vehicle.route는 남은 Node ID 배열입니다. 탐색 결과는 nodes / links / distance / cost를 포함합니다.','RouteCandidate는 engine.ts의 탐색 결과 타입입니다. 별도 영속 Route 서비스나 객체 저장소가 아닙니다.'],
      ['Request / Vehicle / StoredFoup','활성 요청 1개 ↔ 소유 차량 1대. 완료 후 StoredFoup가 requestId와 목적 portId를 보유합니다.','FOUP.phase enum은 없습니다. 적재 전후의 소유 위치는 요청 phase와 vehicle.loaded에서 해석합니다.'],
    ]}/>
  </View>;
}

export function ArchitectureRuntimeView() {
 return <View id="A–B" title="하나의 브라우저, 실제 파일들의 의존관계" purpose="화살표는 호출 또는 데이터 전달 방향입니다. Engine 안의 책임 분리는 논리적 구분이며 별도 서버·서비스 클래스가 아닙니다." source="components/FabFlow.tsx viewSnapshot / playback effect · sim/engine.ts imports / Engine · sim/control.ts · storage/repository.ts">
  <div className="av-runtime">
   <div className="av-node"><b>User → FabFlow.tsx</b><span>설정 검증 · Engine ref · 실행/정지 · 정책/수요/차량 변경 명령</span></div>
   <div className="av-arrow">↓ new Engine / step(1) / 명시적 개입 메서드</div>
   <div className="av-runtime-grid"><div className="av-node"><b>playback.ts</b><span>PlaybackScheduler → tick callback</span><small>wall-clock credit · 일반 실행을 스케줄링</small></div><div className="av-node av-owner"><b>engine.ts · 상태 변경의 중심</b><span>SimulationState · Scenario · schedule</span><small>요청 방출 → 배차 → 경로 → 진입 → 이동/서비스 → 집계</small></div><div className="av-node"><b>layouts.ts → topology-default-v6.ts</b><span>getLayout → Node / Link / Port</span><small>Engine이 읽는 정적 그래프</small></div></div>
   <div className="av-arrow">Engine → control.ts: 보호 질의·획득 / analysis.ts: 수집·보고</div>
   <div className="av-runtime-grid"><div className="av-node"><b>control.ts</b><span>createTickProtection / getControlGeometry</span><small>blockers · acquire · arrive / Tick 임시 보호</small></div><div className="av-node"><b>analysis.ts</b><span>collectAnalysisTick / makeAnalysisReport</span><small>Engine 내부 분석 상태를 수집·투영</small></div><div className="av-node"><b>publication.ts</b><span>publicationCopy → FabFlow React state</span><small>표시용 독립 복사본 / 물류 변경 명령 없음</small></div></div>
   <div className="av-arrow">확정 상태 ↓ ThreeFacilityScene.tsx → motion.ts confirmedMotion → render frame</div>
   <div className="av-node"><b>별도 저장 경로: Engine.snapshot ↔ storage/repository.ts ↔ IndexedDB</b><span>load → Engine.restore → 검증된 새 Engine · 렌더 객체는 다시 구성</span></div>
  </div>
  <details className="av-details"><summary>모듈 인터페이스 상세 · 입력, 출력, 상태 변경 권한</summary><Table label="실제 컴포넌트의 책임과 인터페이스" headings={['모듈','입력 → 출력 / 주요 진입점','상태 권한과 의존성']} rows={[
   ['FabFlow.tsx','사용자 설정·명령 → new Engine / setPolicy / setDemandInterval / addVehicles / injectFailure','Engine ref를 보유하고 UI 상태를 게시합니다. 물류 상태의 직접 변경 대신 엔진 진입점을 사용합니다.'],
   ['playback.ts','host.now / speed / tick callback → callback 실행 여부 / achieved rate','타이머·credit·generation을 변경합니다. SimulationState나 차량 위치를 직접 바꾸지 않습니다.'],
   ['engine.ts','Scenario / step(ticks) / live intervention → state / snapshot / getAnalysis','차량·요청·저장 FOUP·대기열·KPI 원본과 분석 상태를 변경합니다. control / layouts / analysis / publication에 의존합니다.'],
   ['control.ts','Layout / Vehicle[] → TickProtection.blockers / acquire / arrive','정적 제어 기하와 Tick 보호 상태. 요청 완료나 차량 phase의 소유자는 아닙니다.'],
   ['analysis.ts / getKpis','엔진의 실제 생성·완료·점유·대기 → 분석 report / KPI','collectAnalysisTick은 분석 집계를 갱신합니다. getKpis는 engine.ts에서 원본을 읽습니다.'],
   ['publication.ts / ThreeFacilityScene.tsx','scenario/state 복사 → React props → 확정 이동의 시각 보간','장면·카메라·GPU 객체만 변경합니다. 완료/적재/배차를 새로 결정하지 않습니다.'],
   ['storage/repository.ts','saveEngine / load → Snapshot / 검증 실패','브라우저 저장소를 변경합니다. load는 Engine.restore 검증을 거칩니다. 호환 불가 저장을 조용히 대체하지 않습니다.'],
  ]}/>
</details>  <p className="av-small">상태 소유권은 현재 호출 구조의 규약입니다. <code>Engine.state</code>는 public이므로 TypeScript의 private/immutable 경계가 쓰기를 강제 차단하지는 않습니다. MCS의 물리적 모듈은 여전히 큰 <code>engine.ts</code>이며 유지보수 비용도 이 파일에 모입니다.</p>
 </View>;
}

export function ArchitectureExecutionView() {
 return <View id="D–F" title="함수 호출과 상태 변경을 Tick 경계로 읽기" purpose="기존 논리적 운송 시퀀스의 Level 2입니다. 아래 행들은 하나의 호출 스택에서 끝나지 않으며 이동 거리·서비스·대기를 거치며 반복됩니다." source="engine.ts tickOperational / dispatchOperational / handleNodeOperational / admitOperational / waitOperational">
  <DiagramViewer label="Engine 실행 시퀀스 · Tick 경계를 포함한 함수 호출과 상태 변경"><svg className="av-svg av-execution-svg" viewBox="0 0 940 590" role="img" aria-labelledby="av-exec-title av-exec-desc"><title id="av-exec-title">Level 2 · Engine execution sequence</title><desc id="av-exec-desc">Tick n에서 수요를 방출하고 배차합니다. 새 배차 차량은 이동에서 제외됩니다. 후속 Tick에서 진입, 이동, 픽업, 적재 운송, 하역 완료가 이어집니다. 대기 시 phase를 유지하고 다음 Tick에서 다시 처리합니다. 모든 helper는 같은 Engine 내부 함수입니다.</desc><defs><marker id="av-exec-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#39836c"/></marker></defs>
   <g className="av-box"><rect x="20" y="15" width="210" height="45"/><rect x="290" y="15" width="310" height="45"/><rect x="650" y="15" width="270" height="45"/></g><g className="av-exec-head" textAnchor="middle"><text x="125" y="43">tickOperational</text><text x="445" y="43">Engine private helpers</text><text x="785" y="43">state mutation</text></g>
   <g stroke="#b5c8b1" strokeDasharray="5 6"><path d="M125 60V575M445 60V575M785 60V575"/><path d="M20 195H920M20 330H920M20 455H920"/></g>
   <g fill="none" stroke="#39836c" strokeWidth="2" markerEnd="url(#av-exec-arrow)"><path d="M125 100H445"/><path d="M445 123H785"/><path d="M125 155H445"/><path d="M445 180H785"/><path d="M125 244H445"/><path d="M445 270H785"/><path d="M125 310H785"/><path d="M125 372H445"/><path d="M445 398H785"/><path d="M125 438H785"/><path d="M125 506H445"/><path d="M445 536H785"/></g>
   <g className="av-exec-labels" textAnchor="middle"><text x="280" y="91">releaseDemand()</text><text x="615" y="114">pending</text><text x="280" y="147">dispatchOperational()</text><text x="615" y="171">assigned / empty · skip movement</text><text x="470" y="218">↓ 후속 Tick / subsequent ticks</text><text x="280" y="236">admitOperational()</text><text x="615" y="262">link / progress=0 OR wait</text><text x="455" y="301">link branch → progress / node arrival</text><text x="710" y="352">↓ source dock / service ticks</text><text x="280" y="363">handleNodeOperational()</text><text x="615" y="390">pickup → loaded / picked</text><text x="455" y="430">v2BestPath → loaded transport over ticks</text><text x="710" y="478">↓ destination dock / service ticks</text><text x="280" y="498">handleNodeOperational()</text><text x="615" y="528">dropoff → completed / storedFoups</text><text x="470" y="573">wait: phase 유지 · queue/blockers 기록 → 후속 Tick 재처리</text></g>
  </svg></DiagramViewer>
  <details className="av-details"><summary>실행 단계 상세 · 입력, 상태 변경, 대기 조건</summary><Table label="Engine execution sequence · 시간은 아래로 진행" headings={['실행 경계 / 함수','읽는 데이터와 상태 변경','다음 단계 조건 / 대기 분기']} rows={[
   ['Tick n · releaseDemand','schedule의 at ≤ state.time → Request pending 등록, demandIndex 증가','차량 할당과 별개입니다. 수요 생성 시각은 일정의 event.at입니다.'],
   ['Tick n · dispatchOperational','pending 생성 시각/ID 정렬 → 목적지 stored+reserved 확인 → idle 경로 평가 → req assigned / vehicle empty / route','용량 부족·후보 없음·경로 없음이면 pending 유지. 성공 차량은 dispatchedThisTick에 등록되어 이 Tick의 이동에서 제외됩니다.'],
   ['이후 node Tick · admitOperational','다음 link / FIFO 선두 / section 점유 / 보호 / 고장 / projected cycle 검사 → link 지정, progress=0, 점유 획득','불허하면 waitOperational이 waitReason·blockingResources·대기열을 기록합니다. phase는 유지됩니다. 진입 자체는 이동 거리를 늘리지 않습니다.'],
   ['이후 link Tick · tickOperational','4m/s × 0.5s만큼 progress·distance 갱신. 도착 시 node 갱신, link 해제, route.shift, 점유 감소','고장 중에는 현재 위치를 유지합니다. 도착한 Tick에 다음 link나 Port 서비스까지 연속 처리하지 않습니다.'],
   ['출발 dock의 node Tick · handleNodeOperational','Port service / node 보호 확인 → req pickup / vehicle pickup / serviceRemaining=1.5','Port 또는 보호 조건이 막으면 대기합니다. 서비스 시작과 서비스 완료는 다른 Tick입니다.'],
   ['후속 service Tick · handleNodeOperational','serviceRemaining을 0.5씩 감소 → 완료 시 vehicle.loaded=true / req loaded / picked 기록 → v2BestPath 목적지 경로','고장 시 서비스 진행을 멈춥니다. 경로가 없으면 빈 route로 남고 후속 node Tick에서 재탐색합니다.'],
   ['목적지까지 · node / link Tick 반복','loaded 상태로 경로 진입·이동을 반복. 합법 경로가 있어도 admission은 다시 검사','다음 link 고장 또는 대기 중 재계산 주기에 node에서 대안을 평가합니다. 진행 중 link에서 임의 우회하지 않습니다.'],
   ['목적 dock · handleNodeOperational','dropoff 서비스 시작 → 후속 서비스 완료 시 req completed / completed 시각 / StoredFoup 등록','차량은 request를 해제하고 idle / loaded=false / parkingPending=true. 목적지 저장 점유는 releaseAt까지 남습니다.'],
   ['Tick 후반 · lifecycle / queues / analysis','요청 시간 bucket 보존 검사 → 대기열·cycle 갱신 → 선택적 복구 → fleet / interventions → 분석 집계','완료 여부는 엔진이 판정합니다. collectAnalysisTick이나 렌더러가 완료 요청을 만들어내지 않습니다.'],
  ]}/>
</details>  <Table label="세 가지 상태 축과 유지 조건" headings={['Request phase','OHT phase / 동작','FOUP 소유 위치 해석']} rows={[
   ['pending','할당 차량 없음','출발지의 운송 대상이라는 논리적 표현. 별도 출발 FOUP 재고 객체는 없습니다.'],
   ['assigned','empty · 출발 dock으로 이동 / 대기','아직 vehicle.loaded=false. 배차는 적재 완료가 아닙니다.'],
   ['pickup','pickup · serviceRemaining > 0','픽업 중에도 loaded=false. 서비스 완료 경계에서 적재 권한이 넘어갑니다.'],
   ['loaded','loaded · 목적지 이동 / 대기','vehicle.loaded=true. Request.vehicle ↔ Vehicle.request가 서로 일치해야 합니다.'],
   ['dropoff','dropoff · 목적 dock 서비스','서비스 완료 전까지 차량 적재를 유지합니다.'],
   ['completed','차량은 idle로 해제 / 주차 또는 다음 배차','StoredFoup가 목적 Port 점유를 나타냅니다. releaseStored는 점유만 해제하고 연쇄 수요를 만들지 않습니다.'],
  ]}/>
  <div className="av-split"><div className="av-node"><b>Route Planning · 어디로 갈 것인가</b><span>Graph → 거리/지체 비용 → heap search → Node 경로</span><small>유향 경로·고장·통과 제한 검사. 경로 선택은 진입 예약이 아닙니다.</small></div><div className="av-node av-owner"><b>Movement Admission · 지금 갈 수 있는가</b><span>현재 node → next link → FIFO / 점유 / 보호 / cycle → admit 또는 wait</span><small>wait은 새 phase가 아닙니다. 매 node 처리에서 현재 자원을 다시 확인합니다.</small></div></div>
  <p className="av-small">복구는 일반 admission 조건을 통과하는 합법 우회입니다. 매 20 Tick에 10초 이상 지속된 cycle을 검토하며 2.2는 예방 정책의 정체 영역도 다룹니다. 모든 입력의 교착 해소·기아 방지를 증명한 알고리즘은 아닙니다.</p>
 </View>;
}

export function ArchitecturePersistenceView() {
 return <View id="H" title="저장, Replay, Publication은 서로 다른 경로" purpose="무엇을 보존하고 무엇을 재구성하는지 구분해야 같은 상태의 이어하기와 처음부터의 재실행을 혼동하지 않습니다." source="engine.ts snapshot / restore / validateRestoredState · publication.ts · storage/repository.ts · FabFlow.tsx Replay 경로 · motion.ts">
  <div className="av-persistence">
   <div className="av-node av-owner"><b>Source of truth · Engine</b><span>Scenario + SimulationState + optional AnalysisState</span></div>
   <div className="av-arrow">↓ 세 경로는 목적과 payload가 다릅니다</div>
   <div className="av-runtime-grid"><div className="av-node"><b>Snapshot → IndexedDB → Restore</b><span>schema version=1 · scenario/state · 선택적 analysis</span><small>생성자에서 layout·schedule 재구성 → 저장 state 대입 → version·이력·시간·소유권·분석 검증 → continuation</small></div><div className="av-node"><b>Scenario → 새 Engine → Replay</b><span>seed · 수요/고장 일정 · 초기 정책 · 개입 이력 · 엔진 버전</span><small>처음부터 native Tick을 재실행합니다. 개입 초기 기록이 불완전하면 UI에서 Replay를 거절합니다.</small></div><div className="av-node"><b>publicationCopy → UI → frame</b><span>FabFlow.viewSnapshot: scenario/state 전체의 독립 복사</span><small>React 표시 상태 → confirmedMotion → Three 장면. 일반 게시에는 전체 분석 이력을 넣지 않습니다.</small></div></div>
  </div>
  <Table label="복원과 결정성의 계약" headings={['보존 또는 재구성','구체적인 내용','검증과 한계']} rows={[
   ['Snapshot에 보존','요청 이력·차량 위치/route·demandIndex·storedFoups·linkQueues·개입/통계, 선택적 분석','validateScenario / validateRestoredState / assertInvariants로 잘못된 값을 거절합니다. 임의 버전 간 복원을 보장하지 않습니다.'],
   ['재구성','Layout과 그래프 인덱스, seeded schedule, heap scratch, 비용 cache, Tick 보호, Three 장면/GPU 객체','순간 Tick 임시 객체와 렌더 객체는 영속 상태가 아닙니다. restore 뒤 wall-clock anchor도 새로 시작합니다.'],
   ['반복 실행의 입력','같은 Scenario·Seed·외생 일정·개입 시점/순서·엔진/레이아웃 버전','Seed만 같아서는 충분하지 않습니다. localeCompare 정렬과 동일 실행 구현도 결과의 조건입니다. wall-clock 배속은 native 전이를 바꾸지 않습니다.'],
   ['실패의 경계','형식/버전/소유권/시간 정합성 실패, IndexedDB 사용 불가 또는 transaction 실패','기존 데이터를 조용히 대체하지 않고 오류를 표시합니다. 브라우저 저장 자체의 영구 보존이나 모든 손상 자동 복구를 보장하지 않습니다.'],
  ]}/>
  <details className="av-details"><summary>불변식 검증 상세 · 유지 위치와 테스트 계약</summary><Table label="유지하는 제약과 실제 검사 위치" headings={['일관성 조건','유지 / 검사 위치','소스에서 확인한 검증 범위']} rows={[
   ['요청 시간 보존','tickOperational: 시간 bucket의 합 = completed 또는 현재 시각 − created','이 식은 매 Tick 검사합니다. operational-engine.test.ts는 lifecycle과 고장 대기 시간 분류를 검증합니다.'],
   ['활성 요청 ↔ 소유 차량','dispatchOperational / handleNodeOperational이 양쪽 참조·phase·loaded를 함께 갱신','assertInvariants가 대응 관계와 적재 상태를 검사합니다. pending 또는 completed 요청은 활성 차량 소유와 구분합니다.'],
   ['Port 저장 + 예약 ≤ 용량','dispatchOperational이 저장 FOUP와 활성 요청의 목적지 예약을 합산한 뒤 할당','getPortOccupancy / assertInvariants가 점유 합계와 Port 서비스 중복을 검사합니다. source FOUP 전체 재고 보존을 뜻하지는 않습니다.'],
   ['합법 유향 이동과 배타 자원','v2BestPath / admitOperational / TickProtection이 경로·점유·도착 보호를 유지','assertInvariants는 불법 route step·진입 중 route 불일치·section/보호 충돌 등을 검사합니다. 고부하 진행성 보장과는 별개입니다.'],
   ['Snapshot이 실제 일정과 일치','restore → validateRestoredState: 요청 순서/생성 시각·demandIndex·버전·시간·분석 대조','위조 시간/위치/도착 보호·cycle 메타데이터를 거절하는 engine / operational-engine 테스트가 있습니다.'],
  ]}/>
</details>  <p className="av-small">전체 <code>assertInvariants</code>는 생성·Restore·특정 fleet 변경 경계 등에서 호출됩니다. 일반 실행의 모든 Tick마다 전체 검사를 하는 구조는 아닙니다. 테스트·검증 스크립트가 매 Tick 전체 검사를 추가할 수 있습니다. 여기서 테스트 이름은 소스에 존재하는 검증 계약이며, 이번 아티클 작업에서 원본 엔진 테스트 전체를 새로 실행했다는 주장은 아닙니다.</p>
 </View>;
}
