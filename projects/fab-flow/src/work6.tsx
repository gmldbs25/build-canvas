import { Suspense, lazy, useEffect } from 'react';

const HOME_URL = '/build-canvas/';
const PLAY_URL = 'https://fabflow-yoon.vercel.app/';
const IMAGE_ROOT = import.meta.env.BASE_URL + 'media/';
const NativeFabPreview = lazy(() => import('./NativeFabPreview'));
const evidenceNote = 'FAB FLOW의 원본 V6 지도·엔진·OHT 이동 보간 코드를 사용하는 실시간 경량 2D 미리보기입니다. 전체 3D 시뮬레이터와 운영 분석 기능은 ‘FAB FLOW 플레이하기’에서 확인할 수 있습니다.';

type FigureProps = {
  file: string;
  alt: string;
  caption: string;
  className?: string;
  eager?: boolean;
};
function Figure({ file, alt, caption, className = '', eager = false }: FigureProps) {
  return <figure className={'article-figure ' + className}>
    <div className="article-image-wrap"><img src={IMAGE_ROOT + file + '?v=20261103-2x'} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" /></div>
    <figcaption><span className="figure-dot" aria-hidden="true" />{caption}</figcaption>
  </figure>;
}
function ChapterHead({ index, eyebrow, title, lead }: { index: string; eyebrow: string; title: string; lead?: string }) {
  return <div className="chapter-head">
    <div className="chapter-meta"><span>{index} / 10</span><span>{eyebrow}</span></div>
    <h2>{title}</h2>{lead && <p className="chapter-lead">{lead}</p>}
  </div>;
}
function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="tech-detail"><summary><span className="detail-prefix">ENGINEERING NOTE</span><span>{title}</span><span className="detail-plus" aria-hidden="true">+</span></summary><div className="detail-body">{children}</div></details>;
}
const steps = [
  { no: '01', name: '요청 생성', detail: 'FOUP를 다음 장비로 옮겨 달라는 요청' },
  { no: '02', name: 'OHT 배차', detail: '운송을 담당할 차량 결정' },
  { no: '03', name: '빈 차 이동', detail: '출발 Port로 차량 이동' },
  { no: '04', name: '픽업', detail: 'FOUP를 차량에 적재' },
  { no: '05', name: '적재 운송', detail: '방향이 있는 레일 경로를 따라 이동' },
  { no: '06', name: '하역 완료', detail: '목적 Port에 FOUP를 내려놓음' },
];
function GraphDiagram() {
  return <div className="diagram-frame"><div className="diagram-caption-top">CONCEPT DIAGRAM / 실제 FAB 연결망을 단순화한 개념도</div>
    <svg className="graph-svg" viewBox="0 0 760 340" role="img" aria-label="방향이 있는 레일 링크가 세 개의 노드를 연결하고, 가운데 노드에서 장비 포트로 이어지는 개념도">
      <defs><marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#29816b" /></marker></defs>
      <path d="M110 175 H340 H585" fill="none" stroke="#7bbba8" strokeWidth="14" strokeLinecap="round" opacity=".2" />
      <path d="M110 175 H340 H585" fill="none" stroke="#29816b" strokeWidth="3" strokeDasharray="12 12" markerEnd="url(#graph-arrow)" />
      <path d="M340 175 V270" stroke="#ba8748" strokeWidth="3" strokeDasharray="6 8" />
      <g fill="#fffef9" stroke="#285648" strokeWidth="3"><circle cx="110" cy="175" r="15" /><circle cx="340" cy="175" r="15" /><circle cx="585" cy="175" r="15" /></g>
      <rect x="282" y="267" width="116" height="49" rx="8" fill="#e1b16c" />
      <text x="340" y="297" textAnchor="middle" fill="#213e33" fontSize="17" fontWeight="700">PORT</text>
      <text x="110" y="127" textAnchor="middle" fill="#203e33" fontSize="15" fontWeight="700">NODE A</text>
      <text x="340" y="127" textAnchor="middle" fill="#203e33" fontSize="15" fontWeight="700">NODE B</text>
      <text x="585" y="127" textAnchor="middle" fill="#203e33" fontSize="15" fontWeight="700">NODE C</text>
      <text x="450" y="145" textAnchor="middle" fill="#29816b" fontSize="14" fontWeight="700">DIRECTED LINK →</text>
      <text x="380" y="39" textAnchor="middle" fill="#68756b" fontSize="14">보이는 선이 아니라, 실제로 이동 가능한 방향을 계산한다</text>
    </svg>
    <p className="diagram-bottom">교차해 보이는 레일도 연결된 Node가 없으면 진입할 수 없습니다. 이 그림은 실측 V6 지도 데이터가 아닌 설명용 개념도입니다.</p>
  </div>;
}
function PlayLink({ closing = false }: { closing?: boolean }) {
  return <a className={closing ? 'play-link play-link-light' : 'play-link'} href={PLAY_URL} target="_blank" rel="noopener noreferrer">
    <span>FAB FLOW 플레이하기</span><span aria-hidden="true">↗</span>
  </a>;
}
function AppHeader() {
  return <header className="site-header"><a className="site-brand" href={HOME_URL} aria-label="Build Canvas 홈으로 이동">build <span>_</span> canvas</a>
    <nav className="site-nav" aria-label="아티클 목차">
      <a href="#chapter-01">DISCOVER</a><a href="#chapter-03">EXPLORE</a><a href="#chapter-06">ENGINEERING</a>
    </nav><a className="header-play" href={PLAY_URL} target="_blank" rel="noopener noreferrer">PLAY <span aria-hidden="true">↗</span></a>
  </header>;
}
export default function Work6() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (event.key.toLowerCase() !== 'h' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (element && (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY'].includes(element.tagName))) return;
      window.location.assign(HOME_URL);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <div className="article-page">
    <a className="skip-link" href="#chapter-01">본문으로 건너뛰기</a>
    <AppHeader />
    <main id="main-content"><article>
      <section id="chapter-00" className="hero" aria-labelledby="hero-title">
        <div className="hero-background-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-topline"><span>BUILD CANVAS / WORK 06</span><span>AN INTERACTIVE LOGISTICS WORLD</span></div>
          <div className="hero-copy"><p className="hero-eyebrow">A MINIATURE FAB SIMULATION</p>
            <h1 id="hero-title">FAB<span className="hero-title-break"> </span>FLOW<span className="hero-period">.</span></h1>
            <div className="hero-intro"><div><strong>반도체 물류 세상</strong><p>작은 공장 안에서,<br/>물류가 살아 움직인다.</p></div>
              <div className="hero-action"><PlayLink /><a className="hero-scroll" href="#chapter-01">SCROLL TO DISCOVER <span aria-hidden="true">↓</span></a></div>
            </div>
          </div>
          <div className="hero-visual"><div className="hero-visual-top"><span><i aria-hidden="true" /> NATIVE ENGINE / LIVE</span><span>SMALL V6 / 2D PREVIEW</span></div>
            <Suspense fallback={<img src={IMAGE_ROOT + 'hero-overview.png?v=20261103-2x'} alt="FAB FLOW 실제 운영 화면. 실시간 미리보기를 준비하고 있습니다." fetchPriority="high" />}><NativeFabPreview /></Suspense>
            <div className="hero-visual-bottom"><span>01 — THE WORLD</span><span>REAL FOOTAGE / 5S LOOP</span></div>
          </div>
          <p className="hero-footnote">{evidenceNote}</p>
        </div>
      </section>

      <section className="part-marker" aria-label="Part 1: Discover"><span>PART ONE</span><strong>DISCOVER</strong><span>작은 공장에서 시작하는 이야기</span></section>

      <section id="chapter-01" className="chapter chapter-intro"><div className="content-wide">
        <ChapterHead index="01" eyebrow="MEET THE WORLD" title="작은 반도체 공장" lead="레일 위 작은 차량 한 대에서 시작되는, 커다란 물류 시스템의 이야기." />
        <div className="copy-columns"><div className="prose"><p>반도체 공정의 여러 장비 사이에서는 웨이퍼를 안전하게 옮기는 일이 반복됩니다. FAB FLOW는 이 이동을 작은 3D 공장 안에 담았습니다. 천장 레일을 달리는 OHT가 FOUP라는 운반 용기를 출발 장비에서 받아 다음 장비의 Port까지 옮깁니다.</p>
          <p>겉으로는 아기자기한 공장처럼 보이지만, 차량은 정해진 애니메이션을 반복하지 않습니다. 경로와 대기, 픽업과 하역은 시뮬레이션의 상태에 따라 달라집니다.</p></div>
          <div className="glossary"><div><b>OHT</b><span>Overhead Hoist Transport<br/>레일을 따라 이동하는 운송 차량</span></div><div><b>FOUP</b><span>Front Opening Unified Pod<br/>웨이퍼를 담는 운반 용기</span></div><div><b>PORT</b><span>장비와 운송 시스템이 물건을 주고받는 지점</span></div></div></div>
        <div className="size-gallery">
          <Figure file="fab-small.png" alt="Small FAB의 실제 실행 캡처" caption="SMALL · V6 설계 기준 2 Bay / 16 Port" className="size-figure" />
          <Figure file="fab-medium.png" alt="Medium FAB의 실제 실행 캡처" caption="MEDIUM · V6 설계 기준 4 Bay / 40 Port" className="size-figure" />
          <Figure file="fab-large.png" alt="Large FAB의 실제 실행 캡처" caption="LARGE · V6 설계 기준 9 Bay / 108 Port" className="size-figure" />
        </div><p className="source-note">V6 코드에 정의된 레이아웃 구성 수치이며 실제 반도체 공장의 규모나 처리 능력을 나타내지 않습니다. 비교 이미지는 과거 실행 캡처입니다.</p>
      </div></section>

      <section id="chapter-02" className="chapter chapter-transport"><div className="content-wide">
        <ChapterHead index="02" eyebrow="ONE TRANSPORT" title="물류가 움직이는 순간" lead="요청 하나가 완료되기까지, 보이지 않는 판단이 이어집니다." />
        <div className="prose prose-narrow"><p>이동 요청이 생겼다고 FOUP가 곧바로 움직이는 것은 아닙니다. 먼저 담당 OHT를 정하고, 빈 차량이 출발지로 향합니다. 출발 Port에 도착하면 FOUP를 들어 올리고, 방향이 정해진 레일을 따라 목적지로 운송합니다. 도착 후 FOUP를 내려놓으면 한 건의 이동이 완료됩니다.</p>
          <p>어느 차를 배차할지, 어떤 길로 갈지, 앞에 차량이 있을 때 언제 멈출지. 이 작은 여정 뒤에는 서로 다른 판단이 숨어 있습니다.</p></div>
        <div className="transport-sequence" aria-label="운송 과정 여섯 단계">{steps.map(step => <div className="transport-step" key={step.no}><span>{step.no}</span><b>{step.name}</b><small>{step.detail}</small></div>)}</div>
        <div className="transport-gallery">
          <Figure file="trip-request.png" alt="실제 FAB FLOW 튜토리얼에서 물류 운송 요청이 등록된 장면" caption="REQUEST / 요청이 만들어지다" />
          <Figure file="transport-loaded.png" alt="OHT가 노란 FOUP를 싣고 실제 레일 위로 이동하는 확대 화면" caption="IN TRANSIT / FOUP를 실은 OHT" className="transport-feature" />
          <Figure file="trip-dropoff.png" alt="실제 FAB FLOW 튜토리얼에서 도착 포트에 운송을 완료한 장면" caption="DROPOFF / 운송 한 건이 완료되다" />
        </div><p className="source-note">세 장면은 제품 개발 과정에서 기록한 실제 운송 화면이며, 하나의 연속 촬영이나 현행 배포의 동일 조건 실험을 의미하지 않습니다.</p>
      </div></section>

      <section className="part-marker part-marker-light" aria-label="Part 2: Explore"><span>PART TWO</span><strong>EXPLORE</strong><span>사용자의 선택이 운영을 바꾸는 곳</span></section>
      <section id="chapter-03" className="chapter chapter-sandbox"><div className="content-wide">
        <ChapterHead index="03" eyebrow="YOUR FAB, YOUR RULES" title="나만의 FAB 운영하기" lead="정답을 맞히는 게임보다, 선택의 결과를 관찰하는 실험실." />
        <div className="feature-split"><div className="feature-side"><div className="prose"><p>FAB 크기를 선택하고 OHT 수와 물류 요청량을 정하면 새로운 운영 실험이 시작됩니다. 작은 공장에서 천천히 관찰할 수도, 더 많은 차량과 요청을 투입해 혼잡을 만들어 볼 수도 있습니다.</p>
          <p>시뮬레이션이 시작된 뒤에도 수요의 흐름을 바꾸거나 차량을 추가하고, 실행 속도를 조절하며 결과를 지켜볼 수 있습니다.</p></div>
          <div className="setting-list"><div><span>01</span><b>FAB SIZE</b><small>Small · Medium · Large</small></div><div><span>02</span><b>FLEET</b><small>초기 OHT 1–300대</small></div><div><span>03</span><b>DEMAND</b><small>요청량과 운영 중 수요 변경</small></div><div><span>04</span><b>POLICY & TIME</b><small>DBR / CBR · 표시 속도 1× / 2× / 4×</small></div></div>
        </div><Figure file="sandbox-setup.png" alt="FAB FLOW의 새 시뮬레이션 설정 창. FAB 크기, OHT 수, MCS 정책을 선택할 수 있는 실제 UI" caption="ACTUAL UI / 실제 FAB FLOW의 새 시뮬레이션 설정" className="feature-shot" /></div>
        <p className="source-note">표시 속도와 실제 진행 속도는 다를 수 있습니다. 엔진 목표 매핑은 4 / 8 / 16 시뮬레이션 초/실제 초이며 기기 부하에 따라 달라집니다.</p>
      </div></section>

      <section id="chapter-04" className="chapter chapter-pressure"><div className="content-wide"><div className="pressure-heading">
        <ChapterHead index="04" eyebrow="WHEN THE SYSTEM GETS BUSY" title="공장이 막히기 시작하면" lead="차량을 더 넣으면, 물류는 언제나 더 빨라질까요?" />
        <div className="prose"><p>이동 요청이 늘어나는 순간, 더 많은 OHT가 레일을 공유하고 앞 차량이나 Port를 기다리는 시간이 쌓입니다. 아직 완료되지 않은 요청도 남기 시작합니다.</p>
          <p>FAB FLOW의 혼잡은 화면에 덧씌운 무작위 효과가 아닙니다. 이동과 자원 점유, 대기, 경로 선택을 실제 엔진이 계산한 결과입니다. 하지만 차량이 많다고 언제나 느려지는 것은 아닙니다. 배치와 수요, 정책에 따라 결과는 달라집니다.</p></div></div>
        <Figure file="congestion-observation.png" alt="FAB FLOW Large 고부하 시뮬레이션에서 운송 차량과 레일을 관찰한 실제 화면" caption="STRESS SCENARIO / Large · 120 OHT 실행 장면 · 저부하와 동일 조건의 통제 A/B 비교는 아닙니다" className="pressure-figure" />
        <div className="observation-line"><span>LOOK FOR</span><b>레일 대기</b><b>미완료 요청</b><b>최근 처리 속도</b><b>운송 시간</b></div>
      </div></section>

      <section id="chapter-05" className="chapter chapter-analysis"><div className="content-wide">
        <ChapterHead index="05" eyebrow="OPERATIONS ANALYSIS" title="운영을 분석하고 실험하다" lead="움직임을 보는 것에서, 결과를 읽는 것으로." />
        <div className="prose prose-narrow"><p>공장의 상태는 단지 차량이 움직이는 모습만으로는 설명되지 않습니다. 완료한 운송 건수, 아직 남은 요청, 최근 완료 속도, 운송에 걸린 시간을 함께 보아야 운영이 보입니다.</p>
          <p>운영 분석 화면은 최근 흐름과 주목할 레일을 보여줍니다. DBR과 CBR은 서로 다른 경로 비용 정책이며, 동일한 입력 조건으로 실행한 별도 정책 비교 실험에서 결과를 나란히 살펴볼 수 있습니다.</p>
          <p>관찰된 전후 차이가 반드시 하나의 조작 때문에 생겼다고 단정할 수는 없습니다. 그래서 비교의 조건과 관찰 범위도 중요합니다.</p></div>
        <Figure file="operations-analysis.png" alt="FAB FLOW의 실제 운영 분석 패널. 레일 대기와 미완료 요청, 완료 속도, 운송 시간, 추세 그래프가 보임" caption="ANALYSIS / 실제 FAB FLOW 운영 분석 화면" className="analysis-wide" />
        <div className="analysis-lower"><div className="policy-card"><span>ROUTING POLICIES</span><div><b>DBR</b><p>Distance Based Routing<br/>이동 거리 중심의 경로 비용</p></div><div><b>CBR</b><p>Congestion Based Routing<br/>혼잡 비용을 함께 고려하는 경로</p></div><small>CBR이 항상 더 좋은 처리량을 보장하는 것은 아닙니다.</small></div>
          <Figure file="policy-comparison.png" alt="FAB FLOW에서 두 경로 정책을 나란히 비교하는 실제 실험 화면" caption="POLICY WORLDS / Small · 동일 입력 조건 DBR·CBR 실행 비교" /></div>
        <DeepDive title="분석 수치와 정책 비교는 무엇이 다른가요?"><p>운영 분석은 하나의 실행에서 최근 레일 대기, 완료 속도, 평균 운송 시간, 개입 이력을 관찰합니다. 정책 비교는 동일한 초기 조건의 별도 시뮬레이션 세계를 구성해 DBR과 CBR을 살펴봅니다. 관찰 기록과 통제된 실험 결과를 동일하게 취급하지 않는 것이 중요합니다.</p></DeepDive>
      </div></section>

      <section className="part-marker part-marker-engineering" aria-label="Part 3: Behind the simulation"><span>PART THREE</span><strong>BEHIND THE SIMULATION</strong><span>이 작은 세계를 실제로 움직이는 규칙들</span></section>
      <section id="chapter-06" className="chapter chapter-engineering"><div className="content-wide">
        <ChapterHead index="06" eyebrow="THE NETWORK" title="3D 공장을 코드로 표현하는 방법" lead="보이는 레일과 이동 가능한 레일은 같은 말이 아닙니다." />
        <div className="prose prose-narrow"><p>화면 속 공장은 입체적인 레일과 장비의 풍경입니다. 그러나 경로를 계산하는 엔진에게 중요한 것은 예쁜 모양이 아니라 ‘어디서 어디로 이동할 수 있는가’입니다.</p>
          <p>FAB FLOW는 공장을 Node, 방향이 있는 Link, 장비와 연결된 Port로 표현합니다. 차량이 왼쪽으로 보여도 그 방향으로 진입하는 Link가 없다면 실제 이동은 허용되지 않습니다. 이 연결 관계가 경로 탐색의 출발점입니다.</p>
          <p>렌더링 경로와 시뮬레이션은 같은 기하 데이터를 읽도록 연결되어야 차량이 레일 밖을 달리는 일을 막을 수 있습니다.</p></div>
        <div className="graph-pair"><Figure file="fab-small.png" alt="실제 FAB FLOW의 Small 레일 및 설비가 드러난 화면" caption="REAL GAMEPLAY / 실제 레일 네트워크" /><GraphDiagram /></div>
        <DeepDive title="Node, Link, Port를 구분하는 이유"><p><strong>Node</strong>는 이동 가능한 위치의 접속점, <strong>Link</strong>는 이동 방향과 길이를 가진 연결, <strong>Port</strong>는 장비와 운송 작업의 접점을 의미합니다. 교차해 보이는 레일도 그래프상 연결되지 않았다면 진입할 수 없습니다. 경로 탐색과 3D 표시는 같은 지형·기하 정의를 참조하도록 설계합니다.</p><p className="source-note">검증 기반: FAB FLOW src/sim/types.ts, topology-default-v6.ts, geometry.ts, layouts.ts.</p></DeepDive>
      </div></section>

      <section id="chapter-07" className="chapter chapter-engineering chapter-route"><div className="content-wide">
        <ChapterHead index="07" eyebrow="MATERIAL CONTROL SYSTEM" title="OHT를 움직이는 물류 제어 시스템" lead="최단 경로를 찾는 것과 실제로 이동할 수 있는 것은 다른 문제입니다." />
        <div className="prose prose-narrow"><p>운송 요청을 처리하려면 어떤 OHT가 맡을지 먼저 결정해야 합니다. 그다음 빈 차량이 픽업 지점까지 가는 길과 FOUP를 실어 목적지까지 이동하는 경로가 필요합니다.</p>
          <p>FAB FLOW의 MCS 로직은 방향성 레일 그래프에서 도달 가능한 경로를 찾고, 거리뿐 아니라 차량의 점유와 대기 비용을 반영할 수 있습니다. DBR은 거리 중심, CBR은 혼잡 비용까지 보는 정책입니다.</p>
          <p>경로를 찾았다고 바로 전진할 수 있는 것은 아닙니다. 다른 차량이 자원을 사용 중이라면 기다려야 하고, 레일의 점유와 예약, 안전한 진입 순서가 중요해집니다.</p></div>
        <div className="routing-flow" aria-label="운송 제어의 네 가지 개념적 단계">
          <div><span>INPUT</span><b>운송 요청</b><small>출발지 · 목적지</small></div>
          <div><span>01 / DISPATCH</span><b>차량 배차</b><small>담당 OHT 선택</small></div>
          <div><span>02 / ROUTE</span><b>경로 탐색</b><small>방향 그래프 · 비용</small></div>
          <div><span>03 / ADMISSION</span><b>점유 판단</b><small>예약 · 대기 · 이동</small></div>
        </div><p className="source-note">개념적 결정 구조입니다. 한 Tick 내부의 실제 호출 순서를 그대로 도식화한 것은 아닙니다.</p>
        <DeepDive title="다익스트라 탐색만으로 해결되지 않는 이유"><p>엔진은 방향성을 가진 Link의 경로 비용을 대상으로 다익스트라 계열 최단 경로 탐색을 사용합니다. 실제 주행에는 차량 점유, 링크 예약, 대기 및 이동 가능 조건이 더해집니다. ‘경로를 계산했다’는 사실은 곧바로 ‘전진이 허용됐다’는 뜻이 아닙니다. 모든 결정에서 탐색을 매번 처음부터 수행한다고 단정하지 않습니다.</p></DeepDive>
      </div></section>

      <section id="chapter-08" className="chapter chapter-engineering chapter-tick"><div className="content-wide">
        <ChapterHead index="08" eyebrow="THE ENGINE" title="시뮬레이션 엔진의 내부" lead="브라우저가 몇 번 그렸는지와 관계없이, 가상 세계의 시간은 별도로 흐릅니다." />
        <div className="prose prose-narrow"><p>FAB FLOW의 가상 시간은 브라우저가 화면을 몇 번 그렸는지로 결정되지 않습니다. 엔진은 고정된 <strong>0.5초 Tick</strong>을 진행하며, 그 경계에서 새로운 요청과 차량 이동, 서비스 및 대기 상태를 갱신합니다.</p>
          <p>동일한 초기 조건과 Seed, 정책, 개입 일정이라면 같은 과정이 다시 실행되어야 합니다. 이 결정성은 서로 다른 운영 실험을 비교하고, 저장된 상태가 정확히 이어지는지 검사하는 토대입니다.</p>
          <p>실제 브라우저 시간은 그 Tick을 언제 실행할지 예약할 뿐입니다. 렌더링이 느려져도 상태 전이를 임의로 건너뛰어 결과를 바꾸어서는 안 됩니다.</p></div>
        <div className="tick-diagram" role="img" aria-label="시뮬레이션 시간은 0, 0.5, 1, 1.5, 2초의 균일한 Tick으로 진행하고 별도로 브라우저가 화면을 그리는 시간 축이 존재한다">
          <div className="tick-heading"><span>SIMULATION TIME</span><strong>Fixed 0.5s Tick</strong></div>
          <div className="tick-track">{['0.0','0.5','1.0','1.5','2.0'].map((t,i)=><div key={t}><b>{t}s</b><span>TICK {String(i).padStart(2,'0')}</span></div>)}</div>
          <div className="tick-wall"><span>WALL-CLOCK & RENDER</span><div className="wall-rects" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div><span>실제 실행 간격은 기기 부하에 영향을 받음</span></div>
        </div>
        <DeepDive title="Seed, Snapshot, Replay는 무엇을 보장하나?"><p>동일한 엔진 버전과 조건에서 Seed를 고정하면 난수에 의존하는 입력을 재현할 수 있습니다. 저장된 Snapshot으로 상태를 이어가는 일과 처음부터 같은 시나리오 및 운영 개입 기록을 재실행하는 일은 서로 다른 복원 방식입니다. 버전 간 모든 과거 저장 데이터의 호환성을 보장한다는 의미는 아닙니다.</p></DeepDive>
      </div></section>

      <section id="chapter-09" className="chapter chapter-engineering chapter-performance"><div className="content-wide">
        <ChapterHead index="09" eyebrow="PERFORMANCE & TRADE-OFFS" title="수백 대의 차량을 브라우저에서 움직이기까지" lead="엔진이 계산하는 시간과 화면을 그리는 시간, 그 둘을 따로 살펴보기." />
        <div className="prose prose-narrow"><p>차량이 몇 대일 때는 보이지 않던 비용이 수백 대가 되면 병목으로 드러납니다. 물류 경로 계산과 3D 렌더링, React 상태 전달은 서로 다른 층의 비용입니다.</p>
          <p>FAB FLOW는 엔진과 렌더링을 분리하고, OHT 표시에는 InstancedMesh와 거리별 상세도를 활용했습니다. 레일 분석 화면에서도 필요한 시각 정보만 갱신하는 접근을 검증했습니다.</p>
          <p>개선이 모든 조건에서 빠르다는 뜻은 아닙니다. 어떤 부하에서는 나아졌고 다른 부하에서는 비용이 남거나 회귀했습니다.</p></div>
        <Figure file="fleet-high-load.png" alt="FAB FLOW Large 크기에서 300대 차량을 사용하는 테스트 설정의 실제 실행 화면" caption="HIGH-FLEET TEST / Large · 300 OHT 테스트 캡처 · 실제 화면에 전 차량이 동시에 보인다는 뜻은 아닙니다" className="performance-shot" />
        <div className="benchmark">
          <div className="benchmark-intro"><span>MEASURED / HISTORICAL</span><h3>Native Tick 성능 측정</h3><p>Operations Analysis 1.1 검증 기록. Large · congested · 300 OHT 조건의 평균 엔진 Tick 비용이며, FPS나 실제 브라우저 화면 속도가 아닙니다.</p></div>
          <div className="benchmark-bars">
            <div className="bench-row"><div><b>DBR</b><span>20.248 → 14.912 ms/tick</span></div><div className="bar-pair"><span style={{width:'100%'}}/><span style={{width:'73.65%'}}/></div></div>
            <div className="bench-row"><div><b>CBR</b><span>18.623 → 14.694 ms/tick</span></div><div className="bar-pair"><span style={{width:'91.97%'}}/><span style={{width:'72.57%'}}/></div></div>
            <div className="bench-key"><span><i/>이전 측정</span><span><i/>개선 후 측정</span></div>
            <p className="bench-regression"><b>함께 기록된 회귀</b> · Small · relaxed · 8 OHT · DBR에서는 평균 0.102 → 0.123 ms/tick으로 증가했습니다.</p>
          </div>
        </div><p className="source-note">출처: FAB FLOW 개발 저장소 docs/operations-analysis/1.1/FINAL_REPORT.md. 특정 테스트 환경·버전의 기록입니다. 모든 기기에서 300 OHT / 20ms 목표를 달성했다는 뜻이 아니며, 브라우저 회귀 검증도 일부 알려진 실패가 포함됩니다.</p>
        <DeepDive title="왜 InstancedMesh와 상태 갱신을 나눴을까?"><p>동일한 모양의 차량이 늘어날 때 메쉬마다 별도의 제출 비용을 발생시키는 대신 InstancedMesh로 묶을 수 있습니다. 하지만 모델을 그리는 비용만 줄여도 엔진 경로 탐색, 분석 집계, UI 갱신의 비용이 남습니다. 엔진 Tick, 브라우저 프레임, 입력 반응성을 서로 다른 측정값으로 관리해야 합니다.</p></DeepDive>
      </div></section>

      <section id="chapter-10" className="ending"><div className="content-wide ending-inner"><div className="ending-copy"><div className="chapter-meta"><span>10 / 10</span><span>KEEP BUILDING</span></div>
        <h2>이제 직접,<br/><em>공장을 움직일 차례.</em></h2>
        <p>FAB FLOW에서 중요했던 선택은 공장이 움직이는 것처럼 보이게 하는 일이 아니라, 실제로 움직이는 규칙을 먼저 만드는 것이었습니다.</p><p>이 프로젝트는 산업용 물류 제어 시스템의 대체재가 아닙니다. 물류의 핵심 현상을 바꾸고 관찰할 수 있도록 만든 교육용 시뮬레이션이자, 결정적 엔진과 운영 분석, 브라우저 렌더링 사이의 선택을 기록한 개발 프로젝트입니다.</p>
        <PlayLink closing /><a className="ending-back" href={HOME_URL}>BACK TO BUILD CANVAS ↗</a></div>
        <Figure file="hero-overview.png" alt="FAB FLOW 공장 전체를 내려다보는 실제 실행 캡처" caption="FAB FLOW · 실제 실행 기록 이미지" className="ending-shot" />
      </div></section>
    </article></main>
    <footer className="page-footer"><span>BUILD _ CANVAS / WORK 06</span><span>FAB FLOW — 반도체 물류 세상</span><a href={HOME_URL}>HOME (H) ↗</a></footer>
  </div>;
}
