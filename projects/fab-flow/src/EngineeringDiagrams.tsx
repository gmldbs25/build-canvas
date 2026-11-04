import type { ReactNode } from 'react';
import './engineering-diagrams.css';
import { ArchitectureExecutionView, ArchitectureModelView, ArchitecturePersistenceView, ArchitectureRuntimeView } from './ArchitectureViews';

const SHA = '7cfb6c58';

function Notes({ title, children }: { title: string; children: ReactNode }) {
  return <details className="ed-notes"><summary>Native 근거 · {title}</summary><div>{children}</div></details>;
}

function Panel({ kicker, title, children, notes }: { kicker: string; title: string; children: ReactNode; notes: ReactNode }) {
  return <div className="ed-panel"><div className="ed-heading"><span>{kicker}</span><h3>{title}</h3></div>{children}<Notes title={title}>{notes}</Notes></div>;
}

function Scroll({ label, children }: { label: string; children: ReactNode }) {
  return <div className="ed-scroll" tabIndex={0} role="region" aria-label={label}>{children}</div>;
}

function Architecture() {
  return <div className="ed-system">
    <h4>MCS가 들어 있는 실제 시스템 경계</h4>
    <p>아래는 코드 모듈과 데이터 흐름을 정리한 개념도입니다. MCS는 별도 서버가 아니라 Native Engine 안의 배차·경로·진입 제어 로직입니다.</p>
    <div className="ed-system-input"><b>입력 · Input</b><span>Scenario · Seed · 정책 · 수요 / 고장 일정</span><span>사용자 조작 · OHT 수 / 수요 개입</span><span>layouts.ts + topology-default-v6.ts → Node / Link / Port 그래프</span></div>
    <div className="ed-system-arrow" aria-hidden="true"><span>검증된 시나리오와 예정된 이벤트</span><b>↓</b></div>
    <div className="ed-system-core"><b>Native Engine · 물류 상태의 권위</b><code>src/sim/engine.ts</code><div className="ed-system-modules"><span>요청 방출<br/>releaseDemand</span><span>차량 배정<br/>dispatchOperational</span><span>경로 비용·탐색<br/>v2BestPath</span><span>점유·진입 허가<br/>admitOperational</span><span>이동·서비스·완료<br/>tickOperational</span><span>KPI·분석 집계<br/>analysis.ts</span></div><small>배차는 목적지 저장·예약 용량을 먼저 확보합니다. 경로를 계산한 뒤에도 admission guard가 통과해야 link에 진입합니다.</small></div>
    <div className="ed-system-arrow" aria-hidden="true"><span>화면 전달과 저장은 Engine 상태에서 갈라지는 별도 경로</span><b>↙　　↘</b></div>
    <div className="ed-system-outputs"><div><b>화면 전달 · Publication</b><span>publicationCopy → React state</span><span>ThreeFacilityScene / 2D SVG fallback</span><small>Renderer는 확인된 상태 사이를 보간하고 차량·대기 표현을 그립니다. 물류 상태 전이를 소유하지 않습니다.</small></div><div><b>저장·복원 · Persistence</b><span>Engine.snapshot → IndexedDB</span><span>storage/repository.ts → Engine.restore</span><small>Versioned scenario/state를 검증한 뒤 이어갑니다. Render object와 임시 route scratch는 다시 구성합니다.</small></div></div>
  </div>;
}

function TransportSequence() {
  const rows = [
    ['수요 → 요청','releaseDemand','pending 요청을 등록하고 생성 시각·ID 순으로 검토'],
    ['요청 → 배차','dispatchOperational','목적지 용량과 idle 차량의 도달 가능한 경로 확인'],
    ['배차 → OHT','assigned / empty','요청 소유 차량 지정 · 해당 Tick의 이동은 생략'],
    ['OHT → 출발 Port','pickup','접근 후 Port 서비스가 비면 1.5초 픽업'],
    ['Port → OHT','loaded','FOUP 적재 · 목적지 경로 선택 · 매 링크 진입 검사'],
    ['OHT → 목적 Port','dropoff','목적 dock에서 1.5초 하역 후 완료 시각 기록'],
    ['Port → 기록·분석','completed','FOUP는 목적지 저장 영역에 남고 완료·운송 시간을 집계'],
  ];
  const lanes=['수요','Engine / MCS','OHT','Port','분석'];
  const messages=[[0,1,'요청 등록'],[1,2,'배차 / empty'],[2,3,'출발 dock 접근'],[3,2,'픽업 완료 / loaded'],[2,3,'목적 dock 하역'],[3,1,'운송 완료'],[1,4,'완료·운송 시간 집계']] as const;
  return <div className="ed-sequence"><h4>한 요청을 따라가는 처리 시퀀스</h4><p className="ed-caption">소스 기반 논리적 상호작용 · 여러 Tick에 걸친 요청이며 네트워크 API 호출을 나타내지 않습니다.</p>
    <Scroll label="수요, Engine, OHT, Port, 분석 사이의 운송 처리 시퀀스"><svg className="ed-svg ed-sequence-svg" viewBox="0 0 900 520" role="img" aria-label="수요가 Engine에 요청을 등록하고 배차, 픽업, 하역을 거쳐 분석에 완료가 반영되는 시퀀스">
      <defs><marker id="ed-seq-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#39836c"/></marker></defs>
      {lanes.map((lane,i)=><g key={lane}><rect x={20+i*180} y="20" width="140" height="42" rx="3" fill="#e0ead8"/><text x={90+i*180} y="46" textAnchor="middle">{lane}</text><path d={`M${90+i*180} 65V500`} stroke="#b6cbb8" strokeDasharray="6 7"/></g>)}
      {messages.map(([from,to,label],i)=><g key={label}><path d={`M${90+from*180} ${110+i*58}H${90+to*180}`} stroke="#39836c" strokeWidth="2" markerEnd="url(#ed-seq-arrow)"/><text x={90+(from+to)*90} y={100+i*58} textAnchor="middle">{label}</text></g>)}
    </svg></Scroll>
    <Notes title="단계별 상태와 소유권"><ol>{rows.map(([actor,phase,detail])=><li key={phase}><span>{actor}</span><code>{phase}</code><p>{detail}</p></li>)}</ol><p>FOUP는 매 순간 독립 엔티티 상태를 갖지 않습니다. 요청 단계와 차량의 적재 여부에서 소유 위치를 해석하고, 하역 뒤에는 목적 Port 저장 기록으로 이동합니다. <code>releaseAt</code>에 저장 점유가 해제됩니다. 다음 수요는 독립 외생 일정에서 생성되며, 같은 FOUP를 연쇄 재운송하는 모델은 아닙니다.</p></Notes></div>;
}

function VehicleStates() {
  return <div className="ed-vehicle"><h4>OHT 상태 전이</h4><Scroll label="OHT 상태 전이. idle부터 하역 후 idle로 복귀합니다."><div className="ed-state-machine">{[['idle','요청 배정'],['empty','출발 dock 도착'],['pickup','서비스 완료'],['loaded','목적 dock 도착'],['dropoff','하역 완료 → idle']].map(([phase,event])=><div key={phase}><b>{phase}</b><span>{event} →</span></div>)}</div></Scroll><p className="ed-small">대기는 별도의 phase가 아니라 wait reason과 blocking resource로 기록됩니다. FOUP도 독립 상태 객체가 아닙니다. 요청 phase와 OHT의 <code>loaded</code> 여부로 source → vehicle → destination storage 소유를 해석합니다. 요청의 <code>assigned</code>·<code>completed</code>와 차량의 <code>idle/empty/pickup/loaded/dropoff</code>는 서로 다른 상태 축입니다.</p></div>;
}

function RoutingStudy() {
  return <><Scroll label="같은 방향 그래프의 직행과 우회 경로 비교"><svg className="ed-svg ed-route-svg" viewBox="0 0 760 230" role="img" aria-label="출발과 목적지를 잇는 직행 10미터 경로와 우회 14미터 경로. 직행 예상 지체 5초, 우회 1초의 개념 예시">
    <defs><marker id="ed-route-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#39836c"/></marker></defs>
    <path d="M90 82H665" stroke="#bd8845" strokeWidth="4" fill="none" markerEnd="url(#ed-route-arrow)"/><path d="M90 82V170H665V90" stroke="#39836c" strokeWidth="4" fill="none" markerEnd="url(#ed-route-arrow)"/>
    <circle cx="90" cy="82" r="12" fill="#fffdf6" stroke="#234d3e" strokeWidth="3"/><circle cx="665" cy="82" r="12" fill="#fffdf6" stroke="#234d3e" strokeWidth="3"/>
    <text x="90" y="43" textAnchor="middle">출발</text><text x="665" y="43" textAnchor="middle">목적지</text><text x="375" y="65" textAnchor="middle">직행 · 10m / 예상 지체 5s</text><text x="375" y="200" textAnchor="middle">우회 · 14m / 예상 지체 1s</text>
  </svg></Scroll><div className="ed-example-grid"><div><span>DBR · 거리만 비교</span><b>직행 10 &lt; 우회 14</b><em>직행 선택</em></div><div><span>CBR · 기본 가중치 예시</span><b>직행 60 &gt; 우회 24</b><em>우회 선택</em></div></div><p className="ed-small">설명용 수치 · w<sub>d</sub>=1, w<sub>c</sub>=2.5, 속도 4m/s를 적용한 경로 합계입니다. 실제 런타임 측정이나 V6 지형을 나타내지 않습니다. 혼잡이 작으면 두 정책은 같은 길을 선택할 수 있습니다.</p></>;
}

function TrafficStudy() {
  return <div className="ed-traffic"><h4>경로가 있어도 기다려야 하는 이유</h4><div className="ed-traffic-cases"><div><span className="ed-oht">B · loaded</span><b>→ 대기</b><span className="ed-section-busy">다음 section · A가 점유</span><p>B의 경로는 유효합니다. 하지만 section 점유나 도착 노드 보호가 남아 있으면 진입하지 못합니다.</p></div><div><span className="ed-oht">B · loaded</span><b>→ 진입 허가 검사</b><span className="ed-section-free">section 해제</span><p>자원이 비어도 FIFO 선두, 보호 영역, 폐쇄·고장, 순환 대기 위험을 확인한 뒤 진입합니다.</p></div></div><p className="ed-small">개념도 · 대기 중에는 phase를 보존하고 wait reason과 blocking resources를 기록합니다. 경로 탐색은 비용을 비교하고, Traffic Control은 지금 이동할 수 있는지를 판단합니다.</p></div>;
}

export function NetworkDeepDive() {
  return (<Panel kicker="01 / V6 NETWORK" title="Port는 방향이 있는 레일 그래프에 접속합니다" notes="V6 port마다 dock node가 있고 접근 entry→dock·이탈 dock→exit 유향 link로 레일에 연결됩니다. Link capacity=1. 곡선 path의 길이를 geometry 단위 8로 나누어 m로 환산합니다. 3D 레일과 차량 위치도 이 path 기하를 사용합니다. V6는 service lane과 forward/return spine, 제한된 연결·회차로 구성되며 임의 U턴을 허용하지 않습니다. 근거: src/sim/topology-default-v6.ts link/generateDefaultTopologyV6, src/sim/types.ts Node/Link/Port. Verified SHA: 7cfb6c58073a80df5c3d310c6ce9584679edc277.">
      <p className="ed-deck">교차해 보이는 선은 자동으로 연결되지 않습니다. 그래프에 있는 유향 link만 경로 후보가 됩니다.</p>
      <Scroll label="V6 service lane과 port dock 연결 개념도. 실제 좌표를 재현하지 않습니다."><svg className="ed-svg ed-network" viewBox="0 0 760 290" role="img" aria-label="방향이 있는 service lane과 forward, return spine, port entry-dock-exit 접속을 보여주는 관계도">
        <defs><marker id="ed-n-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#39836c"/></marker><marker id="ed-a-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#bc8844"/></marker></defs>
        <text x="45" y="31">NORTH SERVICE LANE</text><path d="M45 51H710" stroke="#39836c" strokeWidth="4" markerEnd="url(#ed-n-arrow)"/>
        <text x="45" y="104">CENTRAL FORWARD SPINE</text><path d="M45 121H710" stroke="#39836c" strokeWidth="4" markerEnd="url(#ed-n-arrow)"/>
        <text x="45" y="178">CENTRAL RETURN SPINE</text><path d="M710 195H45" stroke="#557894" strokeWidth="4" markerEnd="url(#ed-a-arrow)"/>
        <text x="45" y="246">SOUTH SERVICE LANE</text><path d="M710 263H45" stroke="#557894" strokeWidth="4" markerEnd="url(#ed-a-arrow)"/>
        <circle cx="252" cy="121" r="9" fill="#fffdf6" stroke="#234d3e" strokeWidth="3"/><circle cx="500" cy="121" r="9" fill="#fffdf6" stroke="#234d3e" strokeWidth="3"/>
        <path d="M252 121V145M500 121V145" stroke="#39836c" strokeWidth="3" markerEnd="url(#ed-n-arrow)"/><path d="M286 164H467" stroke="#bc8844" strokeWidth="3" markerEnd="url(#ed-a-arrow)"/>
        <rect x="286" y="148" width="181" height="35" rx="5" fill="#efca8a"/><text x="376" y="170" textAnchor="middle">Port dock node</text>
        <text x="235" y="154" textAnchor="end">entry → dock</text><text x="490" y="154">dock → exit</text>
        <path d="M350 121V195" stroke="#9a6b9c" strokeWidth="2" strokeDasharray="5 5"/><text x="358" y="211">중앙 bay 연결*</text>
      </svg></Scroll><p className="ed-caption">관계도이며 실제 V6 좌표·축척이나 전체 topology를 재현하지 않습니다. *중앙 bay 횡단 연결은 Medium·Large에 있고 Small에는 없습니다. Link는 단위 용량 resource로 모델링되며 이 도식은 전체 Node·Link를 생략합니다.</p>
      <ArchitectureModelView />
    </Panel>
  );
}

export function McsDeepDive() {
  return (<Panel kicker="02 / DISPATCH & ROUTE" title="배차, 경로 선택, 진입 허가는 각각 다른 단계입니다" notes="dispatchOperational은 생성 시각/ID 순 pending 요청, destination capacity, idle vehicle, legal route를 기준으로 배차합니다. 같은 tick에 배차된 차량은 이동 처리에서 skip됩니다. 이후 admitOperational이 진입 guard를 적용합니다. 비용은 기본 delay model 기준. 근거 함수: buildOperationalEdgeCosts, handleNodeOperational, admitOperational (src/sim/engine.ts). Verified SHA: 7cfb6c58073a80df5c3d310c6ce9584679edc277.">
      <Architecture />
      <ArchitectureRuntimeView />
      <ArchitectureExecutionView />
      <TransportSequence />
      <VehicleStates />
      <h4>DBR / CBR · 같은 그래프, 다른 경로 비용</h4>
      <p className="ed-deck">기본 delay 모델은 점유 차량의 남은 이동 거리, section FIFO 대기열, 하류 노드 차량의 서비스·이동 지체를 추정합니다. CBR은 이 시간을 거리 단위로 바꿔 비용에 더합니다.</p>
      <div className="ed-costs"><div><b>DBR</b><code>w<sub>d</sub> × L</code><span>이동 거리 비용</span></div><div className="ed-plus">→</div><div><b>CBR</b><code>w<sub>d</sub> × L + w<sub>c</sub> × (4 × D)</code><span>L: 링크 길이(m) · D: 추정 지체(s)</span></div></div>
      <RoutingStudy />
      <Notes title="탐색·배차·진입 guard·우회 조건"><p><code>v2BestPath</code>는 StableMinHeap과 재사용 typed-array scratch로 유향 outgoing link를 탐색합니다. 고장 link와 통과 제한 transit node를 제외하고, 같은 비용이면 node 이름과 삽입 순서로 정렬해 선택을 안정화합니다. 배차는 생성 시각·ID순 pending 요청을 검토하고 목적지의 저장+예약 용량을 확인한 뒤, 설정된 nearest / fifo / eta 정책에 따라 idle 차량과 도달 가능한 경로를 고릅니다. 경로가 없으면 요청은 대기합니다.</p><p>목적지별 reverse search는 탐색 결과를 각 도달 가능한 출발점의 경로 배열로 materialize하므로, 전체 dispatch 비용을 단순히 O(E log V)라고 요약할 수 없습니다. 후보 차량의 경로를 공유해 반복 탐색은 줄이지만, 경로 저장량은 그래프와 경로 길이에 따라 증가합니다.</p><p>기본 delay 비용은 Tick 시작 구간에서 계산합니다. 노드에 도착했을 때 경로가 없거나 목적지가 달라지면 재탐색하고, 다음 link 고장 또는 대기 중 재계산 간격(기본 5초)에 도달하면 우회를 검토합니다. 기본 임계값은 15%이며 충분한 비용 개선이 있을 때 바꿉니다. admission은 FIFO 선두, section 점유, tick 보호, 폐쇄·고장, 순환 대기 위험을 검사하고 link 점유를 획득합니다. 교착/기아를 일반적으로 제거하거나 보장하지 않습니다.</p><p>기본 delay 식과 과거 저장 호환용 legacy 혼잡식은 다릅니다. CBR의 처리량 우위는 보장하지 않습니다. 근거: engine.ts의 <code>dispatchOperational</code>, <code>buildOperationalEdgeCosts</code>, <code>v2BestPath</code>, <code>v2PathsToTarget</code>, <code>admitOperational</code>. 분석 기준 {SHA}.</p></Notes>
      <TrafficStudy />
    </Panel>
  );
}

export function EngineDeepDive() {
  return (<Panel kicker="03 / FIXED TICK" title="Native가 상태를 갱신하고 publication이 화면으로 전달합니다" notes="tickOperational: time/tick 증가 → failure·release·demand → 보호/점유·비용 → dispatch → vehicle ID 순 이동/service/admission → 회계·queue·cycle → fleet 변경 → intervention → 선택적 analysis. 이동 4m/s, 0.5초 tick당 최대 2m; pickup/dropoff 각 1.5초. Engine.snapshot/restore는 versioned state/scenario를 검증하고 publicationCopy는 별도 UI copy 경로입니다. 근거: src/sim/engine.ts, publication.ts, playback.ts. SHA: 7cfb6c58073a80df5c3d310c6ce9584679edc277.">
      <p className="ed-deck">Simulation time은 고정 간격입니다. 실제 wall-clock scheduler가 다음 tick을 예약하고, renderer는 공개된 Native 상태를 그립니다.</p>
      <Scroll label="Native 0.5초 Tick 한 번의 순서. 모바일에서는 가로로 스크롤합니다."><div className="ed-timeline">
        {['시각·tick 증가','고장·저장 release·수요','보호·점유·비용·배차','ID순 이동·service·admission','회계·timing 확인·queue','cycle hook·fleet·개입'].map((v,i)=><div key={v}><small>{String(i+1).padStart(2,'0')}</small><b>{v}</b></div>)}
      </div></Scroll>
      <div className="ed-tick-callout"><b>배차와 첫 이동은 분리됩니다.</b><span>이번 Tick에서 새로 배차된 차량은 같은 Tick의 차량 이동 loop에서 건너뛰고 다음 Tick부터 처리됩니다. 기존 차량은 ID 순으로 한 번씩 처리됩니다.</span></div>
      <div className="ed-boundary"><span>WALL CLOCK</span><i>500ms simulation credit</i><span>Native Engine · fixed tick</span><b>→</b><span>publicationCopy</span><b>→</b><span>React → Three.js / 2D fallback</span></div>
      <div className="ed-state"><b>요청</b><span>pending → assigned → pickup → loaded → dropoff → completed</span><b>FOUP</b><span>source → vehicle → destination storage</span></div>
      <div className="ed-example-grid"><div><span>SNAPSHOT · 현재 상태를 이어가기</span><b>Scenario + state + 선택적 analysis</b><p>저장된 Tick 경계와 상태 불변식을 검증한 뒤 이어갑니다. 화면 캡처와는 다릅니다.</p></div><div><span>REPLAY · 입력으로 다시 실행하기</span><b>초기 조건 + Seed + 개입 일정</b><p>같은 엔진 버전에서 같은 입력과 난수·개입 순서를 통제해 상태 결과를 비교합니다.</p></div></div>
      <p className="ed-small">60FPS라면 화면은 초당 약 60번 그려질 수 있지만, 엔진 상태는 0.5 시뮬레이션 초 단위로 바뀝니다. 렌더러는 확인된 이동 상태 사이를 보간합니다. 1×/2×/4× 표시는 목표 4/8/16 simsec/wallsec에 대응하며 기기 성능에 따라 달라집니다.</p>
      <Notes title="실제 시간·UI 전달·저장의 경계"><p>PlaybackScheduler는 단조 증가 wall-clock credit으로 Native Tick을 예약하고, catch-up 중 task 하나마다 한 Tick을 처리한 뒤 양보합니다. 숨김 탭과 긴 event-loop 공백에서는 쌓인 wall-clock debt를 버려 목표 배속을 낮출 수 있으며 이미 시작한 Native 상태 전이를 건너뛰지는 않습니다.</p><p><code>publicationCopy</code>는 UI 구독자에게 보낼 독립 데이터 복사입니다. 매 프레임 persistence snapshot을 생성하는 것과 다릅니다. React 화면은 각 Native Tick 이후 publication을 받으며, Three.js/2D 뷰는 확인된 연속 상태 사이만 보간합니다. <code>Engine.snapshot</code>은 versioned scenario/state와 선택적 analysis를 저장하고 restore에서 스키마·시간·정합성을 검사합니다. IndexedDB 경로와 view publication은 목적과 데이터가 다른 두 경계입니다.</p><p>Replay는 임의 시점에서 프레임을 다시 재생하는 기능이 아닙니다. 기록된 intervention history가 완전할 때 초기 scenario/policy와 난수 seed, 개입 순서를 사용해 새 Engine을 재실행합니다. Seed만 같고 정책·입력·개입·엔진 버전이 다르면 결과 동일성을 보장하지 않습니다. 전체 fleet invariant 검사는 매 Tick마다 실행되지 않으며 생성·restore·fleet mutation 경계에서 실행되고, 매 Tick에는 요청 timing 보존 등 제한된 conservation check가 수행됩니다. 각 Tick 후반에는 fleet 변경 → intervention → 선택적 analysis 집계 순으로 반영합니다.</p></Notes>
      <p className="ed-small">Native Engine이 물류 상태의 권위입니다. Browser frame은 운송 상태 전이의 원인이 아닙니다. Pickup/dropoff service는 모델상 각각 1.5초이며, 차량이 dock에 도착해 service를 시작한 뒤 이후 Tick에서 감소합니다.</p>
      <ArchitecturePersistenceView />
    </Panel>
  );
}

export function PerformanceDeepDive() {
 return <Panel kicker="04 / MEASUREMENT BOUNDARY" title="평균 뒤에 있는 긴 Tick도 함께 봅니다" notes={<p>출처: docs/operations-analysis/1.1/FINAL_REPORT.md, NATIVE_VALIDATION.md, PERFORMANCE_AUDIT.md. 실제 baseline 168e981489ebdc7a1695a255ce7291442503eb75와 1.1 개선 측정. 새 아티클 벤치마크가 아닌 과거 개발 기록입니다. 해당 보고서는 300 OHT의 모든 성능 목표 충족을 주장하지 않습니다.</p>}>
  <div className="ed-scroll" tabIndex={0} role="region" aria-label="Large 300대 Native Tick p95 성능 표"><table className="ed-bench-table"><caption>위 평균 그래프와 같은 Operations Analysis 1.1 기록 · ms/tick</caption><thead><tr><th>Large / congested / 300 OHT</th><th>이전 p95</th><th>개선 후 p95</th></tr></thead><tbody><tr><th>DBR</th><td>55.781</td><td>35.173</td></tr><tr><th>CBR</th><td>60.495</td><td>34.474</td></tr></tbody></table></div>
  <p className="ed-deck">경로 탐색에서는 typed-array scratch를 재사용하고 같은 목적지 탐색을 공유합니다. 렌더러는 반복 모델을 InstancedMesh로 묶고 레일 분석 표시도 배치로 제출합니다. React 패널의 memo와 publication 복사 최적화는 또 다른 층의 작업입니다.</p>
  <p className="ed-small">Native Tick은 CPU의 엔진 처리 비용입니다. 이 수치로 GPU 시간이나 브라우저 FPS를 계산할 수 없습니다. 보고서의 가상화 호스트·시나리오·버전에 한정된 측정이며, 작은 부하의 회귀와 300대 SVG fallback 성능 미달도 남았습니다. React commit 단독 절감량과 보편적인 재생 속도 향상은 입증하지 않았습니다.</p>
  <QualityEvidence />
  <Notes title="Architecture Decision Records · 결정 근거와 trade-off"><ol>
    <li><b>ADR 01 · Native fixed-step Engine</b><p>현재 Engine이 고정 0.5 sim-second Tick의 상태 전이를 소유합니다. 고정 경계와 외생 input 기록은 반복 실험·상태 비교를 가능하게 하지만, 실제 진행 속도는 wall-clock 처리량에 제한됩니다. 현재 구현 확인; 전체 불변식이 매 Tick 검증된다는 뜻은 아닙니다.</p></li>
    <li><b>ADR 02 · 방향 그래프와 공유 path geometry</b><p>경로 후보는 Node/Link의 명시적 유향 연결로 제한하고, 곡선 path 샘플은 이동 거리와 렌더 위치에 사용합니다. Port에는 dock node가 있고 entry→dock, dock→exit로 접속합니다. topology/geometry 구현에서 확인한 설계이며 산업 FAB 토폴로지를 복제했다는 뜻은 아닙니다.</p></li>
    <li><b>ADR 03 · 경로 비용과 진입 허가 분리</b><p>DBR은 거리 비용을, 기본 CBR은 추정 downstream delay를 거리로 환산해 더한 비용을 사용합니다. 두 방식은 후보 경로를 ranking하지만 고장·FIFO·section 점유·tick protection·cycle risk는 admission 단계에서 별도로 판정합니다. 구현에서 확인한 separation이며 어느 정책도 throughput·fairness·deadlock freedom을 보장하지 않습니다.</p></li>
    <li><b>ADR 04 · UI publication과 persistence 분리</b><p>Native 상태는 UI용 publication copy로 전달하고 저장은 별도 versioned snapshot/restore 경로를 탑니다. 렌더러에 물류 전이 권한을 주지 않지만, Engine.state가 타입 수준에서 immutable/private로 강제되지는 않습니다. 경계는 호출 규약·테스트로 지키며 별도 service encapsulation은 아닙니다.</p></li>
    <li><b>ADR 05 · Live playback은 same-thread Engine</b><p>과거 성능 검토는 Small backlog workload에서 clone/publication과 timer coupling이 추가될 Worker 경계를 보류하는 근거를 기록했습니다. 이는 검토 당시 설계 의도입니다. Worker 비교 벤치마크나 prototype 속도 향상을 증명하지 않았습니다. 정책 비교용 Worker 경로는 이 live playback 경계와 구분합니다.</p></li>
  </ol><p>전체 decision context, 근거 경로와 신뢰도는 <code>docs/fab-flow/ARCHITECTURE_DECISIONS.md</code>에 기록했습니다. 코드에서 관찰한 경계와 당시 문서의 설계 의도를 구분합니다.</p></Notes>
 </Panel>;
}

function QualityEvidence() {
  return <div className="ed-quality">
    <h4>품질 축마다 증거의 시점이 다릅니다</h4>
    <div className="ed-scroll" tabIndex={0} role="region" aria-label="결정성, 정확성, 성능, 확장성, 테스트 가능성, 관측성, 유지보수성, 복구성 근거 표">
      <table className="ed-bench-table ed-quality-table"><caption>코드 근거는 FAB FLOW source SHA 7cfb6c58073a80df5c3d310c6ce9584679edc277 기준</caption><thead><tr><th>Quality attribute</th><th>확인된 구조·증거</th><th>범위 / 제한</th></tr></thead><tbody>
        <tr><th>결정성</th><td>Fixed tick, seeded inputs, recorded schedules와 interventions.</td><td>같은 Engine version과 전체 입력 조건이 필요합니다. Seed 단독으로 동등성을 보장하지 않습니다.</td></tr>
        <tr><th>정확성</th><td>매 Tick 요청 timing conservation check; restore/fleet mutation 경계의 invariant 검사; transport, replay, publication 테스트 모듈.</td><td>전체 fleet invariants는 매 Tick 실행되지 않습니다. 검토는 코드 구조이며 이 표 자체가 새 테스트 통과 기록은 아닙니다.</td></tr>
        <tr><th>성능</th><td>Operations Analysis 1.1에 특정 Large/congested/300 OHT mean과 p95를 기록.</td><td>과거 host/build/workload 측정입니다. GPU/FPS 또는 현재 main의 새 benchmark로 해석할 수 없습니다.</td></tr>
        <tr><th>확장성</th><td>Reusable typed-array route scratch, destination reverse-search reuse, renderer instancing/LOD.</td><td>경로 materialization은 출발점별 경로 저장을 추가하며 worst case O(V²) 규모로 늘 수 있습니다. SVG 300 OHT 성능 문제도 남아 있습니다.</td></tr>
        <tr><th>테스트 가능성</th><td>Engine, playback, motion, publication용 단위 테스트 분리.</td><td>Native transition, scheduler, interpolation, publication을 검증할 수 있지만 실제 기기·원격 배포를 대신하지 않습니다.</td></tr>
        <tr><th>관측성</th><td>Queue, occupancy, completion, throughput, transport timing, intervention 기록과 analysis view.</td><td>이는 시뮬레이션 내부 계기판이며 production telemetry나 실제 fab 계측이 아닙니다.</td></tr>
        <tr><th>유지보수성</th><td>논리적 경계는 engine/control, publication, storage, renderer 모듈에 나타납니다.</td><td><code>engine.ts</code>는 여러 역할을 담고 <code>Engine.state</code>도 public입니다. 경계는 TS private/immutable 보장이 아니라 호출 규약과 테스트에 의존합니다.</td></tr>
        <tr><th>복구성</th><td>Versioned snapshot + scenario를 restore 때 검증하고 schedule/topology를 재구성합니다.</td><td>IndexedDB 저장이 내구성·backup·자동 crash recovery를 보장하는 것은 아닙니다. Render object와 transient route scratch는 snapshot이 아닙니다.</td></tr>
      </tbody></table>
    </div>
    <p className="ed-small">표의 “확인된 구조”는 고정 source SHA에서 읽은 구현·테스트 구성입니다. 측정 열은 저장된 과거 보고서입니다. 현재 브라우저 성능과 production 응답은 이 작업의 local build 결과로 대체하지 않습니다.</p>
  </div>;
}
