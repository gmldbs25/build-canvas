import type { ReactNode } from 'react';
import './engineering-diagrams.css';

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
    <div className="ed-system-input"><b>Scenario · Seed · 외생 수요 일정</b><span>사용자 설정 / 정책·수요·차량 개입 → 엔진 입력</span><span>layouts.ts · topology-default-v6.ts → Node / Link / Port 그래프</span></div>
    <div className="ed-system-core"><b>Engine · 상태의 원본</b><code>src/sim/engine.ts</code><div className="ed-system-modules"><span>요청 방출<br/>releaseDemand</span><span>배차<br/>dispatchOperational</span><span>경로 비용·탐색<br/>v2BestPath</span><span>점유·진입 허가<br/>admitOperational</span><span>이동·서비스·완료<br/>tickOperational</span><span>KPI·분석 집계<br/>analysis.ts</span></div></div>
    <div className="ed-system-outputs"><div><b>↓ 화면에 전달</b><span>publicationCopy → React UI</span><span>ThreeFacilityScene.tsx / SVG fallback</span><small>위치·방향·FOUP 소유 상태를 표시합니다. 렌더러가 운송 완료를 만들지 않습니다.</small></div><div><b>↕ 저장·복원</b><span>Engine.snapshot / restore</span><span>IndexedDB · storage/repository.ts</span><small>시나리오와 상태를 저장하고 검증 후 Tick을 이어갑니다.</small></div></div>
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
    <Notes title="단계별 상태와 소유권"><ol>{rows.map(([actor,phase,detail])=><li key={phase}><span>{actor}</span><code>{phase}</code><p>{detail}</p></li>)}</ol></Notes></div>;
}

function VehicleStates() {
  return <div className="ed-vehicle"><h4>OHT 상태 전이</h4><Scroll label="OHT 상태 전이. idle부터 하역 후 idle로 복귀합니다."><div className="ed-state-machine">{[['idle','요청 배정'],['empty','출발 dock 도착'],['pickup','서비스 완료'],['loaded','목적 dock 도착'],['dropoff','하역 완료 → idle']].map(([phase,event])=><div key={phase}><b>{phase}</b><span>{event} →</span></div>)}</div></Scroll><p className="ed-small">대기는 별도의 phase가 아닙니다. 예를 들어 loaded 차량도 레일 자원을 기다릴 수 있습니다. 요청의 <code>assigned</code>와 <code>completed</code>는 차량 phase와 구분합니다.</p></div>;
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
      <Scroll label="V6 port dock 연결도. 오른쪽으로 스크롤해 전체 네트워크를 볼 수 있습니다."><svg className="ed-svg ed-network" viewBox="0 0 760 238" role="img" aria-label="service lane을 따라 port entry로 진입하고 dock을 거쳐 exit로 이탈하는 방향 그래프">
        <defs><marker id="ed-n-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#39836c"/></marker><marker id="ed-a-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#bc8844"/></marker></defs>
        <path d="M55 75H705" stroke="#8cb6a4" strokeWidth="2" strokeDasharray="6 8"/><text x="58" y="46">FORWARD SERVICE LANE / directed links</text>
        <path d="M100 75H270M270 75H500M500 75H685" stroke="#39836c" strokeWidth="4" markerEnd="url(#ed-n-arrow)"/>
        <path d="M270 75L320 162" stroke="#bc8844" strokeWidth="4" markerEnd="url(#ed-a-arrow)"/><path d="M320 181L500 75" stroke="#bc8844" strokeWidth="4" strokeDasharray="5 5" markerEnd="url(#ed-a-arrow)"/>
        <g fill="#fffdf6" stroke="#234d3e" strokeWidth="3"><circle cx="100" cy="75" r="11"/><circle cx="270" cy="75" r="11"/><circle cx="500" cy="75" r="11"/><circle cx="685" cy="75" r="11"/></g>
        <rect x="252" y="161" width="136" height="42" rx="5" fill="#efca8a"/><text x="320" y="187" textAnchor="middle">PORT / DOCK NODE</text>
        <text x="155" y="110">link</text><text x="254" y="132">approach</text><text x="387" y="139">depart</text><text x="600" y="110">link</text>
        <text x="100" y="215" textAnchor="middle">Node</text><text x="270" y="215" textAnchor="middle">Entry</text><text x="500" y="215" textAnchor="middle">Exit</text><text x="685" y="215" textAnchor="middle">Node</text>
      </svg></Scroll><p className="ed-caption">개념도 · 실제 V6 bay 배치 비율이나 전체 노드 수를 나타내지 않습니다.</p>
    </Panel>
  );
}

export function McsDeepDive() {
  return (<Panel kicker="02 / DISPATCH & ROUTE" title="배차, 경로 선택, 진입 허가는 각각 다른 단계입니다" notes="dispatchOperational은 생성 시각/ID 순 pending 요청, destination capacity, idle vehicle, legal route를 기준으로 배차합니다. 같은 tick에 배차된 차량은 이동 처리에서 skip됩니다. 이후 admitOperational이 진입 guard를 적용합니다. 비용은 기본 delay model 기준. 근거 함수: buildOperationalEdgeCosts, handleNodeOperational, admitOperational (src/sim/engine.ts). Verified SHA: 7cfb6c58073a80df5c3d310c6ce9584679edc277.">
      <Architecture />
      <TransportSequence />
      <VehicleStates />
      <h4>DBR / CBR · 같은 그래프, 다른 경로 비용</h4>
      <p className="ed-deck">기본 delay 모델은 점유 차량의 남은 이동 거리, section FIFO 대기열, 하류 노드 차량의 서비스·이동 지체를 추정합니다. CBR은 이 시간을 거리 단위로 바꿔 비용에 더합니다.</p>
      <div className="ed-costs"><div><b>DBR</b><code>w<sub>d</sub> × L</code><span>이동 거리 비용</span></div><div className="ed-plus">→</div><div><b>CBR</b><code>w<sub>d</sub> × L + w<sub>c</sub> × (4 × D)</code><span>L: 링크 길이(m) · D: 추정 지체(s)</span></div></div>
      <RoutingStudy />
      <Notes title="탐색·비용 갱신·우회 조건"><p>유향 outgoing link에서 StableMinHeap을 사용하는 다익스트라 탐색은 고장 링크와 통과 제한 노드를 제외합니다. 배차에서는 같은 출발 Port를 향하는 차량들의 경로를 역방향 탐색으로 공유합니다. 도달할 수 없으면 경로는 undefined이며 요청은 대기합니다. 작업 중인 차량을 새 요청에 중복 배차하지 않습니다.</p><p>기본 delay 비용은 Tick 초반에 계산합니다. 노드에서 경로가 없거나 목적지가 다르면 재탐색하고, 다음 링크 고장 또는 대기 중 재계산 간격(기본 5초)에 도달하면 우회를 검토합니다. 기본 임계값은 15%이며 새 비용이 기존보다 충분히 작아야 바꿉니다. 기본식과 과거 저장 호환용 legacy 혼잡식은 다릅니다. CBR의 처리량 우위는 보장하지 않습니다.</p><p>근거: engine.ts의 buildOperationalEdgeCosts, v2BestPath, v2PathsToTarget, handleNodeOperational. 분석 기준 {SHA}.</p></Notes>
      <TrafficStudy />
    </Panel>
  );
}

export function EngineDeepDive() {
  return (<Panel kicker="03 / FIXED TICK" title="Native가 상태를 갱신하고 publication이 화면으로 전달합니다" notes="tickOperational: time/tick 증가 → failure·release·demand → 보호/점유·비용 → dispatch → vehicle ID 순 이동/service/admission → 회계·queue·cycle → intervention/fleet 변경. 이동 4m/s, 0.5초 tick당 최대 2m; pickup/dropoff 각 1.5초. Engine.snapshot/restore는 versioned state/scenario를 검증하고 publicationCopy는 별도 UI copy 경로입니다. 근거: src/sim/engine.ts, publication.ts, playback.ts. SHA: 7cfb6c58073a80df5c3d310c6ce9584679edc277.">
      <p className="ed-deck">Simulation time은 고정 간격입니다. 실제 wall-clock scheduler가 다음 tick을 예약하고, renderer는 공개된 Native 상태를 그립니다.</p>
      <Scroll label="Native tick에서 화면까지의 흐름도. 모바일에서는 가로로 스크롤할 수 있습니다."><div className="ed-timeline">
        {['시간 +0.5s','고장·수요·release','점유·비용·배차','차량 이동·service·admission','회계·queue·개입'].map((v,i)=><div key={v}><small>{String(i+1).padStart(2,'0')}</small><b>{v}</b></div>)}
      </div></Scroll>
      <div className="ed-boundary"><span>WALL CLOCK</span><i>500ms simulation credit</i><span>Native Engine · fixed tick</span><b>→</b><span>publicationCopy</span><b>→</b><span>React → Three.js / 2D fallback</span></div>
      <div className="ed-state"><b>요청</b><span>pending → assigned → pickup → loaded → dropoff → completed</span><b>FOUP</b><span>source → vehicle → destination storage</span></div>
      <div className="ed-example-grid"><div><span>SNAPSHOT · 현재 상태를 이어가기</span><b>Scenario + state + 선택적 analysis</b><p>저장된 Tick 경계와 상태 불변식을 검증한 뒤 이어갑니다. 화면 캡처와는 다릅니다.</p></div><div><span>REPLAY · 입력으로 다시 실행하기</span><b>초기 조건 + Seed + 개입 일정</b><p>같은 엔진 버전에서 같은 입력과 난수·개입 순서를 통제해 상태 결과를 비교합니다.</p></div></div>
      <p className="ed-small">60FPS라면 화면은 초당 약 60번 그려질 수 있지만, 엔진 상태는 0.5 시뮬레이션 초 단위로 바뀝니다. 렌더러는 확인된 이동 상태 사이를 보간합니다. 1×/2×/4× 표시는 목표 4/8/16 simsec/wallsec에 대응하며 기기 성능에 따라 달라집니다.</p>
      <Notes title="실제 시간·UI 전달·저장의 경계"><p>PlaybackScheduler는 단조 증가하는 실제 시간의 credit으로 한 task당 Tick 하나를 예약합니다. 따라잡을 때는 16ms yield하며, 숨김 탭이나 1초를 넘는 event-loop 지연에서는 실제 시간 debt를 버립니다. 이는 Native 상태를 건너뛰는 것이 아니라 목표 속도를 달성하지 못할 수 있다는 뜻입니다.</p><p>publicationCopy는 UI에 전달할 일반 데이터를 독립 복사하는 경로입니다. 매 렌더 프레임마다 전체 persistence snapshot을 만드는 구조와 구분합니다. snapshot/restore는 저장 스키마·시간·정책·상태 정합성을 검사합니다. Seed만 같아도 다른 정책·개입·엔진 버전이면 결과가 같다는 보장은 없습니다.</p></Notes>
      <p className="ed-small">Native 상태가 권위입니다. 화면 프레임은 운송 상태 전이의 원인이 아닙니다. 요청이 tick 초반에 배차되면 해당 차량은 그 tick 이동 단계에서 건너뛰고 다음 tick부터 처리됩니다.</p>
    </Panel>
  );
}

export function PerformanceDeepDive() {
 return <Panel kicker="04 / MEASUREMENT BOUNDARY" title="평균 뒤에 있는 긴 Tick도 함께 봅니다" notes={<p>출처: docs/operations-analysis/1.1/FINAL_REPORT.md, NATIVE_VALIDATION.md, PERFORMANCE_AUDIT.md. 실제 baseline 168e981489ebdc7a1695a255ce7291442503eb75와 1.1 개선 측정. 새 아티클 벤치마크가 아닌 과거 개발 기록입니다. 해당 보고서는 300 OHT의 모든 성능 목표 충족을 주장하지 않습니다.</p>}>
  <div className="ed-scroll" tabIndex={0} role="region" aria-label="Large 300대 Native Tick p95 성능 표"><table className="ed-bench-table"><caption>위 평균 그래프와 같은 Operations Analysis 1.1 기록 · ms/tick</caption><thead><tr><th>Large / congested / 300 OHT</th><th>이전 p95</th><th>개선 후 p95</th></tr></thead><tbody><tr><th>DBR</th><td>55.781</td><td>35.173</td></tr><tr><th>CBR</th><td>60.495</td><td>34.474</td></tr></tbody></table></div>
  <p className="ed-deck">경로 탐색에서는 typed-array scratch를 재사용하고 같은 목적지 탐색을 공유합니다. 렌더러는 반복 모델을 InstancedMesh로 묶고 레일 분석 표시도 배치로 제출합니다. React 패널의 memo와 publication 복사 최적화는 또 다른 층의 작업입니다.</p>
  <p className="ed-small">Native Tick은 CPU의 엔진 처리 비용입니다. 이 수치로 GPU 시간이나 브라우저 FPS를 계산할 수 없습니다. 보고서의 가상화 호스트·시나리오·버전에 한정된 측정이며, 작은 부하의 회귀와 300대 SVG fallback 성능 미달도 남았습니다. React commit 단독 절감량과 보편적인 재생 속도 향상은 입증하지 않았습니다.</p>
 </Panel>;
}
