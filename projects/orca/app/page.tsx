"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const TOTAL_SLIDES = 15;

function isEditingTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest([
    "input",
    "textarea",
    "select",
    '[contenteditable]:not([contenteditable="false"])',
    '[role="textbox"]',
    "[data-code-editor]",
    ".monaco-editor",
    ".CodeMirror",
  ].join(", ")));
}

const notes = [
  "오늘은 모델 구조보다 먼저, 왜 연구자들이 다시 ‘세계’를 이야기하는지부터 시작합니다. 방향키로 장면을 넘길 수 있습니다.",
  "Hugging Face 투표는 학술적 우열 그 자체가 아니라 커뮤니티 관심의 신호입니다. 5월부터 7월까지 월간 1위 제목에 월드 모델 계열 연구가 이어졌다는 점을 봅니다.",
  "월드 모델도 입력과 출력이 있는 학습된 함수입니다. 현재 관찰과 ‘오른쪽으로 민다’는 행동이 들어오면, 내부 상태에서 시간을 앞으로 굴려 물체가 이동하고 떨어지는 다음 상태를 예측합니다. 출력은 이미지가 아니라 압축된 잠재 벡터일 수도 있습니다.",
  "월드 모델은 하나의 고정된 신경망 이름이 아닙니다. 초기 연구처럼 VAE·RNN·Controller를 분리할 수도 있고, ORCA처럼 Transformer 기반 백본 안에서 잠재 상태를 학습할 수도 있습니다. 공통점은 데이터로 학습된 가중치가 상태 변화를 근사한다는 점입니다.",
  "LLM과 월드 모델을 적으로 비교하려는 슬라이드가 아닙니다. 언어적 설명과 상태 변화 예측이 서로 다른 학습 중심을 가진다는 직관을 만드는 장면입니다.",
  "월드 모델은 2026년에 갑자기 만들어진 용어가 아닙니다. 2018년에는 작은 게임 환경을 꿈속에서 학습했고, Dreamer는 그 아이디어를 다양한 제어 문제로 넓혔습니다. ORCA는 이를 범용 기반 모델의 잠재 공간으로 확장하려 합니다.",
  "ORCA의 핵심 전환은 출력 형식이 아니라 내부 상태를 먼저 학습하자는 것입니다. 다음 장부터 논문의 문제의식과 방법을 해부합니다.",
  "각각의 다음 출력을 잘 맞히는 것만으로는 세계의 일관성을 보장하기 어렵다는 것이 ORCA 팀의 문제의식입니다. 이 실패 예시는 특정 모델 전체를 단정하는 것이 아니라 학습 목표의 한계를 설명합니다.",
  "ORCA는 이미지나 문장 자체를 최종 목표로 삼지 않습니다. 관찰을 내부 상태로 추상화하고, 보이지 않는 동역학과 명시적 조건 아래 다음 상태를 예측합니다.",
  "무의식 학습은 영상의 촘촘한 변화에서 물리적 규칙을 얻고, 의식 학습은 언어로 묘사된 사건과 질문을 통해 의미와 인과를 정리합니다. 둘 중 하나만으로는 균형 잡힌 잠재 공간을 만들기 어렵다는 것이 절제 실험의 결론입니다.",
  "핵심 검증은 백본을 고정했다는 점입니다. 텍스트·이미지·행동용 가벼운 출력부만 따로 학습했는데도 세 방향이 함께 개선됐다면, 공통 잠재 공간에 유용한 정보가 들어갔다는 증거가 됩니다.",
  "반도체 팹은 이미 고도로 자동화되어 있습니다. 이 장면의 핵심은 자동화가 부족하다는 이야기가 아니라, 수천 단계와 수백 장비의 상호작용을 하나의 미래 상태로 연결하는 일이 어렵다는 점입니다.",
  "가상의 장비 정지 상황을 실제 팹 AMHS 구조를 참고한 넓은 운영 화면에서 봅니다. 대응 전략을 바꾸면 개별 OHT 경로, 구간 점유율, 운송 시간, stocker 적체가 함께 달라집니다. 수치는 개념 전달을 위한 예시입니다.",
  "월드 모델의 가치는 기존 MES·스케줄러·AMHS를 대체하는 데 있지 않습니다. 여러 시스템 위에서 공통 상태를 만들고, 행동의 파급효과를 미리 비교하며, 사람과 안전 규칙이 검토할 수 있는 설명을 제공하는 데 있습니다.",
  "ORCA는 완성된 범용 세계 시뮬레이터가 아닙니다. 현재 입력은 주로 시각과 언어이고, 모델 크기와 평가 범위도 제한적입니다. 이 논문의 가치는 최종 성능보다 ‘무엇을 예측할 것인가’를 바꾼 연구 방향에 있습니다.",
];

type FragmentLens = "token" | "frame" | "action";
type LearningMode = "unconscious" | "conscious";
type ReadoutMode = "language" | "vision" | "action";
type AnatomyMode = "classic" | "foundation";
type FabStrategy = "reroute" | "balance" | "throttle";

const fabStrategyCopy: Record<
  FabStrategy,
  {
    label: string;
    kicker: string;
    description: string;
    outcome: string;
    throughput: string;
    deliveryRisk: string;
    congestion: string;
    tone: string;
  }
> = {
  reroute: {
    label: "가까운 장비로 모두 우회",
    kicker: "FAST RELIEF",
    description: "정지 장비의 대기 물량을 가장 가까운 대체 장비 한 곳으로 보냅니다.",
    outcome: "초기 대기열은 빠르게 줄지만, 두 시간 뒤 대체 장비와 동쪽 AMHS 구간에 새로운 병목이 생깁니다.",
    throughput: "91%",
    deliveryRisk: "32%",
    congestion: "높음",
    tone: "coral",
  },
  balance: {
    label: "두 장비 분산 + 우선순위",
    kicker: "RECOMMENDED",
    description: "긴급 제품은 장비 B, 일반 제품은 장비 C로 나누고 운송 우선순위를 조정합니다.",
    outcome: "즉시 효과는 조금 느리지만, 한 교대 뒤 생산량과 납기 위험이 가장 균형 잡힌 상태로 수렴합니다.",
    throughput: "96%",
    deliveryRisk: "9%",
    congestion: "낮음",
    tone: "blue",
  },
  throttle: {
    label: "앞 공정 투입을 20분 감속",
    kicker: "STABILIZE FLOW",
    description: "새 물량 유입을 잠시 줄여 공장 안의 재공품과 운송량을 안정시킵니다.",
    outcome: "단기 생산량은 낮아지지만 혼잡의 확산을 막고, 장비 복구 이후 빠르게 정상 흐름으로 돌아갑니다.",
    throughput: "88%",
    deliveryRisk: "15%",
    congestion: "매우 낮음",
    tone: "violet",
  },
};

const fabOpsMetrics: Record<
  FabStrategy,
  {
    status: string;
    activeOht: string;
    segment: string;
    transport: string;
    buffer: string;
    summary: string;
    timeline: [string, string, string, string];
  }
> = {
  reroute: {
    status: "HOT SEGMENT",
    activeOht: "12 / 14",
    segment: "86%",
    transport: "+41s",
    buffer: "92%",
    summary: "TOOL B 진입 구간과 STK-03에 부하가 집중됩니다.",
    timeline: ["Tool A down", "3 lots reassigned", "STK-03 fills", "new bottleneck"],
  },
  balance: {
    status: "FLOW STABLE",
    activeOht: "10 / 14",
    segment: "58%",
    transport: "+12s",
    buffer: "61%",
    summary: "우선순위 LOT과 일반 LOT이 두 intrabay loop로 분산됩니다.",
    timeline: ["Tool A down", "priority split", "loops balanced", "steady flow"],
  },
  throttle: {
    status: "INPUT HELD",
    activeOht: "6 / 14",
    segment: "34%",
    transport: "+28s",
    buffer: "7 FOUP",
    summary: "신규 요청은 upstream stocker에 보관하고 dispatch 간격을 늘립니다.",
    timeline: ["Tool A down", "release paused", "7 FOUP held", "flow recovers"],
  },
};

type FabToolState = "normal" | "stopped" | "hot" | "balanced";

function FabCarrier({
  path,
  duration,
  begin,
  variant = "blue",
  loaded = true,
  muted = false,
}: {
  path: string;
  duration: number;
  begin: number;
  variant?: "blue" | "coral" | "violet" | "neutral";
  loaded?: boolean;
  muted?: boolean;
}) {
  return (
    <g className={`twin-carrier carrier-${variant}${loaded ? " is-loaded" : " is-empty"}${muted ? " is-muted" : ""}`}>
      <path className="carrier-shadow" d="M-14 -7 H9 L14 -2 V7 H-14 Z" />
      <path className="carrier-body" d="M-14 -9 H9 L14 -4 V6 H-14 Z" />
      <rect className="carrier-window" x="-7" y="-5" width="11" height="7" rx="2" />
      {loaded && <rect className="carrier-foup" x="-5" y="0" width="12" height="9" rx="2" />}
      <circle className="carrier-wheel" cx="-8" cy="8" r="2.4" />
      <circle className="carrier-wheel" cx="8" cy="8" r="2.4" />
      <animateMotion
        path={path}
        dur={`${duration}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
        rotate="auto"
      />
    </g>
  );
}

function FabOpsTool({
  x,
  y,
  label,
  state = "normal",
}: {
  x: number;
  y: number;
  label: string;
  state?: FabToolState;
}) {
  return (
    <g className={`ops-tool ops-tool-${state}`} transform={`translate(${x} ${y})`}>
      <rect className="ops-tool-shadow" x="-42" y="-22" width="84" height="48" rx="8" />
      <rect className="ops-tool-body" x="-42" y="-25" width="84" height="48" rx="8" />
      <rect className="ops-tool-screen" x="-31" y="-14" width="42" height="15" rx="3" />
      <path d="M-25 -9 H5 M-25 -4 H-2" />
      <circle className="ops-tool-led" cx="29" cy="-12" r="3.5" />
      <text x="-31" y="15">{label}</text>
    </g>
  );
}

function FabOpsStocker({
  x,
  y,
  label,
  state = "normal",
}: {
  x: number;
  y: number;
  label: string;
  state?: "normal" | "hot" | "held";
}) {
  return (
    <g className={`ops-stocker stocker-${state}`} transform={`translate(${x} ${y})`}>
      <rect className="stocker-body" x="-28" y="-27" width="56" height="54" rx="9" />
      {[-16, 0, 16].map((offset) => <rect key={offset} className="stocker-slot" x={offset - 5} y="-13" width="10" height="22" rx="2" />)}
      <circle cx="19" cy="18" r="3" />
      <text x="0" y="42" textAnchor="middle">{label}</text>
    </g>
  );
}

function FabOpsMap({ strategy }: { strategy: FabStrategy }) {
  const upperOne = "M220 318 V126 Q220 90 256 90 H464 Q500 90 500 126 V318";
  const lowerOne = "M220 318 V510 Q220 546 256 546 H464 Q500 546 500 510 V318";
  const upperTwo = "M560 318 V126 Q560 90 596 90 H804 Q840 90 840 126 V318";
  const lowerTwo = "M560 318 V510 Q560 546 596 546 H804 Q840 546 840 510 V318";
  const upperThree = "M900 318 V126 Q900 90 936 90 H1144 Q1180 90 1180 126 V318";
  const lowerThree = "M900 318 V510 Q900 546 936 546 H1144 Q1180 546 1180 510 V318";
  const spine = "M92 318 H1305";
  const routeToB = "M840 180 V318 H900 V126 Q900 90 936 90 H1144 Q1180 90 1180 126 V180";
  const routeToC = "M840 180 V318 H900 V510 Q900 546 936 546 H1144 Q1180 546 1180 510 V464";
  const throttleRoute = "M220 318 H530";
  const railPaths = [upperOne, lowerOne, upperTwo, lowerTwo, upperThree, lowerThree, spine];

  return (
    <svg className="fab-ops-map" viewBox="0 0 1400 640" aria-hidden="true">
      <defs>
        <pattern id="opsGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgba(156, 190, 216, .07)" strokeWidth="1" />
        </pattern>
        <filter id="opsGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect className="ops-floor" x="18" y="18" width="1364" height="604" rx="22" />
      <rect x="18" y="18" width="1364" height="604" rx="22" fill="url(#opsGrid)" />

      <g className="ops-bay-zones">
        <rect x="178" y="55" width="364" height="231" rx="18" />
        <rect x="518" y="55" width="364" height="231" rx="18" />
        <rect x="858" y="55" width="364" height="231" rx="18" />
        <rect x="178" y="350" width="364" height="231" rx="18" />
        <rect x="518" y="350" width="364" height="231" rx="18" />
        <rect x="858" y="350" width="364" height="231" rx="18" />
        <text x="196" y="78">BAY 01 · LITHOGRAPHY</text>
        <text x="536" y="78">BAY 02 · ETCH</text>
        <text x="876" y="78">BAY 03 · DEPOSITION</text>
        <text x="196" y="373">BAY 04 · CLEAN / CMP</text>
        <text x="536" y="373">BAY 05 · DIFFUSION</text>
        <text x="876" y="373">BAY 06 · METROLOGY</text>
      </g>

      <g className="ops-rail-shadow">
        {railPaths.map((path) => <path key={path} d={path} />)}
      </g>
      <g className="ops-rail-live">
        {railPaths.map((path) => <path key={path} d={path} />)}
      </g>
      <g className="ops-spine-label">
        <rect x="92" y="298" width="1213" height="40" rx="20" />
        <text x="112" y="306">INTERBAY SPINE · ONE-WAY TRANSFER NETWORK</text>
        {[310, 650, 990, 1240].map((x) => <path key={x} d={`M${x} 313 l12 5 -12 5`} />)}
      </g>

      <g className="ops-tools">
        <FabOpsTool x={292} y={165} label="LITHO 01" />
        <FabOpsTool x={426} y={165} label="LITHO 02" />
        <FabOpsTool x={292} y={464} label="CMP 01" />
        <FabOpsTool x={426} y={464} label="CLEAN 02" />
        <FabOpsTool x={632} y={165} label="ETCH 02" />
        <FabOpsTool x={780} y={180} label="TOOL A" state="stopped" />
        <FabOpsTool x={632} y={464} label="DIFF 03" />
        <FabOpsTool x={780} y={464} label="DIFF 04" />
        <FabOpsTool x={972} y={165} label="DEP 07" />
        <FabOpsTool x={1120} y={180} label="TOOL B" state={strategy === "reroute" ? "hot" : strategy === "balance" ? "balanced" : "normal"} />
        <FabOpsTool x={972} y={464} label="MET 05" />
        <FabOpsTool x={1120} y={464} label="TOOL C" state={strategy === "balance" ? "balanced" : "normal"} />
      </g>

      <g className="ops-tool-links">
        <path d="M334 165 H350 V90 M468 165 H480 V90" />
        <path d="M334 464 H350 V546 M468 464 H480 V546" />
        <path d="M674 165 H690 V90 M822 180 H840" />
        <path d="M674 464 H690 V546 M822 464 H840" />
        <path d="M1014 165 H1030 V90 M1162 180 H1180" />
        <path d="M1014 464 H1030 V546 M1162 464 H1180" />
      </g>

      <FabOpsStocker x={220} y={318} label="STK-01" />
      <FabOpsStocker x={560} y={318} label="STK-02" state={strategy === "throttle" ? "held" : "normal"} />
      <FabOpsStocker x={900} y={318} label="STK-03" state={strategy === "reroute" ? "hot" : "normal"} />
      <FabOpsStocker x={1240} y={318} label="STK-04" />

      <g className="ops-ambient-traffic">
        <FabCarrier path={upperOne} duration={19} begin={-3} variant="neutral" loaded={false} muted />
        <FabCarrier path={lowerOne} duration={22} begin={-11} variant="neutral" muted />
        <FabCarrier path={lowerTwo} duration={18} begin={-7} variant="neutral" loaded={false} muted />
        <FabCarrier path={upperThree} duration={21} begin={-12} variant="neutral" muted />
        <FabCarrier path={lowerThree} duration={23} begin={-5} variant="neutral" loaded={false} muted />
        <FabCarrier path={spine} duration={25} begin={-6} variant="neutral" muted />
        <FabCarrier path={spine} duration={25} begin={-18} variant="neutral" loaded={false} muted />
      </g>

      <g className="ops-incident" transform="translate(840 180)">
        <circle r="28" /><circle r="45" />
        <text x="0" y="-56" textAnchor="middle">TOOL A DOWN</text>
      </g>

      {strategy === "reroute" && (
        <g className="ops-selected-flow ops-flow-reroute">
          <path className="ops-route ops-route-coral" d={routeToB} />
          {[0, -3.5, -7].map((begin) => (
            <FabCarrier key={begin} path={routeToB} duration={10.5} begin={begin} variant="coral" />
          ))}
          <g className="ops-zone-heat" transform="translate(900 318)">
            <circle r="48" /><circle r="72" />
          </g>
          <g className="ops-buffer-lots" transform="translate(900 265)">
            {[0, 1, 2, 3, 4].map((item) => <rect key={item} x={item * 14 - 32} width="10" height="16" rx="2" />)}
            <text x="0" y="-10" textAnchor="middle">BUFFER 92%</text>
          </g>
          <text className="ops-route-note note-hot" x="1015" y="302">SEGMENT OCCUPANCY 86%</text>
        </g>
      )}

      {strategy === "balance" && (
        <g className="ops-selected-flow ops-flow-balance">
          <path className="ops-route ops-route-blue" d={routeToB} />
          <path className="ops-route ops-route-violet" d={routeToC} />
          {[0, -5.7].map((begin) => <FabCarrier key={`b-${begin}`} path={routeToB} duration={11.4} begin={begin} variant="blue" />)}
          {[0, -6].map((begin) => <FabCarrier key={`c-${begin}`} path={routeToC} duration={12} begin={begin} variant="violet" />)}
          <g className="ops-dispatch-node" transform="translate(900 318)"><circle r="20" /><path d="M-8 0 H8 M2 -7 L9 0 2 7" /></g>
          <text className="ops-route-note note-blue" x="988" y="115">PRIORITY LOTS → TOOL B</text>
          <text className="ops-route-note note-violet" x="988" y="576">STANDARD LOTS → TOOL C</text>
        </g>
      )}

      {strategy === "throttle" && (
        <g className="ops-selected-flow ops-flow-throttle">
          <path className="ops-route ops-route-violet" d={throttleRoute} />
          <FabCarrier path={throttleRoute} duration={12} begin={-4} variant="violet" />
          <g className="ops-release-gate" transform="translate(500 318)">
            <rect x="-22" y="-32" width="44" height="64" rx="8" />
            <path d="M-9 -15 V15 M0 -15 V15 M9 -15 V15" />
            <text x="0" y="-43" textAnchor="middle">RELEASE / 20m</text>
          </g>
          <g className="ops-held-foups" transform="translate(560 260)">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => (
              <rect key={item} x={(item % 4) * 15 - 25} y={Math.floor(item / 4) * -19} width="11" height="15" rx="2" />
            ))}
            <text x="0" y="-31" textAnchor="middle">7 FOUP HELD</text>
          </g>
          <g className="ops-stable-field" transform="translate(890 318)"><circle r="74" /><circle r="108" /></g>
        </g>
      )}

      <g className="ops-map-legend" transform="translate(68 590)">
        <rect x="0" y="-17" width="350" height="35" rx="10" />
        <circle className="legend-loaded" cx="18" cy="0" r="5" /><text x="30" y="4">LOADED OHT</text>
        <circle className="legend-empty" cx="128" cy="0" r="5" /><text x="140" y="4">EMPTY OHT</text>
        <circle className="legend-stocker" cx="226" cy="0" r="5" /><text x="238" y="4">STOCKER</text>
        <circle className="legend-down" cx="309" cy="0" r="5" /><text x="321" y="4">DOWN</text>
      </g>
    </svg>
  );
}

function WorldModelIntuitionLoop() {
  return (
    <div
      className="wm-intuition-machine"
      role="img"
      aria-label="테이블 위 물체의 현재 상태와 오른쪽으로 미는 행동이 월드 모델에 들어가고, 모델이 내부에서 시간을 전개해 물체가 움직이다 테이블 아래로 떨어지는 다음 상태를 자동으로 예측하는 반복 애니메이션"
    >
      <div className="wm-loop-phases" aria-hidden="true">
        <span className="phase-observe"><i>01</i><b>현재를 본다</b><em>OBSERVE</em></span>
        <span className="phase-act"><i>02</i><b>행동을 넣는다</b><em>CONDITION</em></span>
        <span className="phase-imagine"><i>03</i><b>내부에서 굴린다</b><em>ROLL FORWARD</em></span>
        <span className="phase-predict"><i>04</i><b>미래를 내놓는다</b><em>PREDICT</em></span>
      </div>

      <div className="wm-intuition-grid">
        <section className="wm-now-panel">
          <header><small>INPUT · NOW</small><strong>지금의 세계</strong><span>t = 0.0s</span></header>
          <svg viewBox="0 0 460 280" aria-hidden="true">
            <defs>
              <linearGradient id="wmTableTop" x1="0" x2="1">
                <stop offset="0" stopColor="#284c68" />
                <stop offset="1" stopColor="#1b3851" />
              </linearGradient>
              <filter id="wmPuckGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect className="wm-scene-grid" x="18" y="16" width="424" height="246" rx="20" />
            <path className="wm-table-side" d="M50 178 H386 L420 204 H84 Z" />
            <path className="wm-table-top" d="M50 88 H386 V178 H50 Z" fill="url(#wmTableTop)" />
            <path className="wm-table-edge" d="M386 88 V178 L420 204" />
            <ellipse className="wm-puck-shadow" cx="139" cy="153" rx="32" ry="11" />
            <g className="wm-input-puck" filter="url(#wmPuckGlow)">
              <ellipse cx="139" cy="136" rx="28" ry="11" />
              <rect x="111" y="116" width="56" height="20" rx="4" />
              <ellipse cx="139" cy="116" rx="28" ry="11" />
              <circle cx="139" cy="116" r="7" />
            </g>
            <g className="wm-action-vector">
              <path d="M183 126 H292" />
              <path d="M278 112 L296 126 278 140" />
              <text x="237" y="105" textAnchor="middle">ACTION · PUSH RIGHT</text>
            </g>
            <g className="wm-observation-scan">
              <rect x="64" y="75" width="310" height="115" rx="12" />
              <path d="M78 112 H360" />
              <text x="79" y="99">ENCODING POSITION · VELOCITY · SUPPORT</text>
            </g>
          </svg>
          <div className="wm-input-facts">
            <span><i className="fact-dot coral" />물체는 테이블 위</span>
            <span><i className="fact-dot blue" />행동: 오른쪽으로 밀기</span>
          </div>
        </section>

        <section className="wm-latent-core">
          <header><small>LEARNED WORLD MODEL</small><strong>머릿속 세계</strong></header>
          <svg viewBox="0 0 330 330" aria-hidden="true">
            <defs>
              <radialGradient id="wmCoreFill">
                <stop offset="0" stopColor="#d8d8ff" stopOpacity=".82" />
                <stop offset=".42" stopColor="#8495df" stopOpacity=".54" />
                <stop offset="1" stopColor="#4b5a91" stopOpacity=".04" />
              </radialGradient>
            </defs>
            <g className="wm-core-orbits">
              <circle cx="165" cy="165" r="116" />
              <circle cx="165" cy="165" r="88" />
              <circle cx="165" cy="165" r="59" />
            </g>
            <g className="wm-core-links">
              <path d="M54 165 C88 165 101 98 134 116 S184 227 218 203 246 144 276 165" />
              <path d="M74 97 C110 116 109 208 149 212 S203 82 250 108" />
              <path d="M78 232 C120 212 121 73 172 87 S202 229 260 220" />
            </g>
            <g className="wm-core-nodes">
              {[
                [72, 97], [54, 165], [78, 232], [134, 116], [149, 212],
                [172, 87], [218, 203], [250, 108], [276, 165], [260, 220],
              ].map(([cx, cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 3 === 0 ? 6 : 4} />)}
            </g>
            <circle className="wm-core-halo" cx="165" cy="165" r="53" fill="url(#wmCoreFill)" />
            <g className="wm-core-label">
              <text x="165" y="151" textAnchor="middle">LATENT STATE</text>
              <text x="165" y="181" textAnchor="middle">s<tspan baselineShift="sub">t</tspan> → s<tspan baselineShift="sub">t+1</tspan></text>
              <text className="wm-core-clock" x="165" y="204" textAnchor="middle">＋1.2 sec</text>
            </g>
            <g className="wm-core-particles">
              <circle r="4"><animateMotion path="M54 165 C88 165 101 98 134 116 S184 227 218 203 246 144 276 165" dur="2.2s" repeatCount="indefinite" /></circle>
              <circle r="3"><animateMotion path="M74 97 C110 116 109 208 149 212 S203 82 250 108" dur="1.8s" begin="-.7s" repeatCount="indefinite" /></circle>
              <circle r="3"><animateMotion path="M78 232 C120 212 121 73 172 87 S202 229 260 220" dur="2.5s" begin="-1.2s" repeatCount="indefinite" /></circle>
            </g>
          </svg>
          <p><span>위치</span><span>속도</span><span>마찰</span><span>중력</span></p>
        </section>

        <section className="wm-future-panel">
          <header><small>OUTPUT · FUTURE</small><strong>예측한 다음 상태</strong><span>t ＋ 1.2s</span></header>
          <svg viewBox="0 0 520 280" aria-hidden="true">
            <rect className="wm-scene-grid" x="18" y="16" width="484" height="246" rx="20" />
            <path className="wm-table-side" d="M48 178 H360 L394 204 H82 Z" />
            <path className="wm-table-top" d="M48 88 H360 V178 H48 Z" fill="url(#wmTableTop)" />
            <path className="wm-table-edge" d="M360 88 V178 L394 204" />
            <path className="wm-prediction-path" d="M120 128 C196 128 260 128 330 128 C374 128 395 170 409 224" />
            <g className="wm-ghost-frames">
              <circle cx="190" cy="128" r="12" />
              <circle cx="270" cy="128" r="12" />
              <circle cx="338" cy="128" r="12" />
              <circle cx="385" cy="178" r="12" />
            </g>
            <g className="wm-future-puck">
              <ellipse cx="120" cy="145" rx="27" ry="9" />
              <rect x="94" y="111" width="52" height="18" rx="4" />
              <ellipse cx="120" cy="111" rx="26" ry="10" />
              <circle cx="120" cy="111" r="6" />
            </g>
            <g className="wm-impact-ring" transform="translate(410 224)">
              <circle r="14" /><circle r="30" />
            </g>
            <g className="wm-time-marks">
              <text x="116" y="77">NOW</text>
              <text x="256" y="77">＋0.6s</text>
              <text x="385" y="77">＋1.2s</text>
            </g>
            <g className="wm-future-readout">
              <rect x="345" y="26" width="138" height="36" rx="10" />
              <circle cx="361" cy="44" r="4" />
              <text x="372" y="47">FALLING · 0.82</text>
            </g>
          </svg>
          <div className="wm-future-facts">
            <strong>물체가 이동하고, 지지면을 벗어나 떨어진다.</strong>
            <span>‘문장’이 아니라 변한 세계의 상태를 예측</span>
          </div>
        </section>
      </div>

      <div className="wm-intuition-equation">
        <span><small>관찰</small>지금 무엇이 어디에 있는가</span>
        <b>＋</b>
        <span><small>행동</small>무엇을 해볼 것인가</span>
        <b>→</b>
        <strong><small>예측</small>그 뒤 세계는 어떻게 달라지는가</strong>
      </div>
    </div>
  );
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showNotes, setShowNotes] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<"language" | "world">(
    "world",
  );
  const [fragmentLens, setFragmentLens] = useState<FragmentLens>("token");
  const [learningMode, setLearningMode] = useState<LearningMode>("unconscious");
  const [readoutMode, setReadoutMode] = useState<ReadoutMode>("language");
  const [anatomyMode, setAnatomyMode] = useState<AnatomyMode>("classic");
  const [fabStrategy, setFabStrategy] = useState<FabStrategy>("balance");
  const touchStart = useRef<number | null>(null);

  const chapterLabel = current <= 4
    ? "01 · 월드 모델 이해"
    : current <= 10
      ? "02 · ORCA 해부"
      : current <= 13
        ? "03 · 미래 적용"
        : "04 · 핵심 정리";

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, next));
    setCurrent((previous) => {
      if (clamped === previous) return previous;
      setDirection(clamped > previous ? 1 : -1);
      return clamped;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.isComposing &&
        event.key.toLowerCase() === "h" &&
        !isEditingTarget(event.target)
      ) {
        event.preventDefault();
        const homeUrl = new URL("../", window.location.href);
        const isLocalHost = ["localhost", "127.0.0.1", "[::1]", "terminal.local"].includes(
          window.location.hostname,
        );
        if (isLocalHost && window.location.pathname === "/" && document.title !== "build _ canvas") {
          homeUrl.port = "5173";
        }
        window.location.assign(homeUrl.href);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goTo(current + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goTo(current - 1);
      }
      if (event.key.toLowerCase() === "n") setShowNotes((value) => !value);
      if (event.key === "Escape") setShowNotes(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, goTo]);

  return (
    <main
      className="deck"
      data-slide={current}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 48) goTo(current + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="ambient" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
        <span className="current-line line-one" />
        <span className="current-line line-two" />
      </div>

      <header className="topbar">
        <button className="wordmark" onClick={() => goTo(0)} aria-label="처음으로">
          <span className="wordmark-dot" />
          WORLD MODELS <b>× ORCA</b>
        </button>
        <span className="chapter-label">{chapterLabel}</span>
        <div className="top-actions">
          <a className="portfolio-home" href="../">
            ← canvas
          </a>
          <button
            className="quiet-button"
            onClick={() => setShowNotes((value) => !value)}
            aria-pressed={showNotes}
          >
            발표자 노트 <kbd>N</kbd>
          </button>
          <span className="slide-count">
            {String(current + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
          </span>
        </div>
      </header>

      <section
        className={`stage direction-${direction > 0 ? "next" : "prev"}`}
        key={current}
        aria-live="polite"
      >
        {current === 0 && (
          <article className="slide slide-cover">
            <div className="cover-copy reveal">
              <p className="eyebrow">HUGGING FACE · JULY 2026 #1 PAPER</p>
              <h1>
                세상을 <span>말하는</span> AI에서,
                <br />
                세상을 <em>그려보는</em> AI로.
              </h1>
              <p className="lead">
                월드 모델은 왜 필요해졌을까? 그리고 ORCA는 왜
                <strong> “다음 상태”</strong>를 예측하려 할까?
              </p>
              <button className="primary-button" onClick={() => goTo(1)}>
                이야기 시작하기 <span>→</span>
              </button>
            </div>
            <div className="cover-visual reveal delay-one" aria-hidden="true">
              <span className="hero-state hero-state-a">OBSERVE</span>
              <span className="hero-state hero-state-b">WORLD LATENT</span>
              <span className="hero-state hero-state-c">POSSIBLE FUTURES</span>
            </div>
            <p className="interaction-hint">
              <span>←</span> 방향키로 탐험하세요 <span>→</span>
            </p>
          </article>
        )}

        {current === 1 && (
          <article className="slide slide-trend">
            <div className="slide-heading reveal">
              <p className="eyebrow dark">SIGNAL · COMMUNITY ATTENTION</p>
              <h2>
                최근 석 달, 연구자들의 시선은
                <br />
                계속 <em>‘세계’</em>로 향했다.
              </h2>
              <p>Hugging Face 월간 투표 1위 논문을 이어 놓으면 보이는 흐름입니다.</p>
            </div>
            <div className="ranking-track reveal delay-one">
              <article className="rank-card may">
                <span className="month">MAY</span>
                <span className="rank">#1</span>
                <h3>Gamma-World</h3>
                <p>Generative Multi-Agent World Modeling</p>
                <b>433 votes</b>
              </article>
              <span className="track-arrow">→</span>
              <article className="rank-card june">
                <span className="month">JUNE</span>
                <span className="rank">#1</span>
                <h3>ABot-Earth 0.5</h3>
                <p>Generative 3D Earth Model</p>
                <b>488 votes</b>
              </article>
              <span className="track-arrow">→</span>
              <article className="rank-card july featured">
                <span className="month">JULY</span>
                <span className="rank">#1</span>
                <h3>ORCA</h3>
                <p>The World is in Your Mind</p>
                <b>474 votes</b>
              </article>
            </div>
            <p className="source-line reveal delay-two">
              투표 수는 현재 표시값 기준 · 출처: Hugging Face Daily Papers Monthly
            </p>
          </article>
        )}

        {current === 2 && (
          <article className="slide slide-intuition">
            <div className="intuition-heading reveal">
              <div>
                <p className="eyebrow">FIRST PRINCIPLES · INPUT → MODEL → FUTURE</p>
                <h2>월드 모델도 결국,<br /><em>입력을 받아 미래를 내놓는 함수</em>다.</h2>
              </div>
              <p><strong>현재 세계</strong>와 <strong>해볼 행동</strong>을 넣으면, 내부에서 다음 상태를 먼저 계산합니다.</p>
            </div>
            <WorldModelIntuitionLoop />
            <div className="wm-loop-hint reveal delay-two">
              <code>p(s<sub>t+1</sub> | s<sub>t</sub>, a<sub>t</sub>, c<sub>t</sub>)</code>
              <p><strong>출력은 꼭 이미지나 문장이 아닙니다.</strong> 다음 세계를 압축한 잠재 상태일 수 있습니다.</p>
              <span><i /> 자동 반복</span>
            </div>
          </article>
        )}

        {current === 3 && (
          <article className="slide slide-anatomy">
            <div className="anatomy-heading reveal">
              <div>
                <p className="eyebrow">INSIDE THE BOX · NO SINGLE BLUEPRINT</p>
                <h2>‘월드 모델’은<br /><em>고정된 아키텍처 이름</em>이 아니다.</h2>
              </div>
              <p>모듈을 나눌 수도, 하나의 큰 신경망으로 연결할 수도 있습니다.</p>
            </div>
            <div className="anatomy-switch reveal delay-one" role="tablist" aria-label="월드 모델 구조 예시 선택">
              <button
                role="tab"
                className={anatomyMode === "classic" ? "active" : ""}
                onClick={() => setAnatomyMode("classic")}
                aria-selected={anatomyMode === "classic"}
              >
                <small>2018 STYLE</small> 모듈형
              </button>
              <button
                role="tab"
                className={anatomyMode === "foundation" ? "active" : ""}
                onClick={() => setAnatomyMode("foundation")}
                aria-selected={anatomyMode === "foundation"}
              >
                <small>FOUNDATION STYLE</small> 통합형
              </button>
            </div>
            <div className={`anatomy-pipeline anatomy-${anatomyMode} reveal delay-two`} key={anatomyMode}>
              {(anatomyMode === "classic"
                ? [
                    ["OBSERVATION", "Pixels", "환경을 본다"],
                    ["ENCODER", "VAE", "관찰을 latent z로 압축"],
                    ["DYNAMICS", "MDN–RNN", "z와 action으로 다음 z 예측"],
                    ["CONTROLLER", "Policy", "예측을 바탕으로 행동 선택"],
                  ]
                : [
                    ["WORLD SIGNALS", "Video + Language", "여러 신호를 함께 입력"],
                    ["BACKBONE", "Transformer / VLM", "신호를 가중치 공간에서 결합"],
                    ["WORLD LATENT", "State Transition", "공통 상태와 변화를 학습"],
                    ["READOUTS", "Text · Image · Action", "필요한 형태로 다시 꺼냄"],
                  ]
              ).map(([label, title, detail], index) => (
                <div className="anatomy-step" key={label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{label}</small>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                  {index < 3 && <i className="anatomy-connector" aria-hidden="true">→</i>}
                </div>
              ))}
            </div>
            <div className="anatomy-facts reveal delay-two">
              <span><b>공통점</b> 모두 역전파로 학습된 신경망 가중치</span>
              <span><b>차이점</b> 모듈 경계·입력 신호·예측 목표</span>
              <span><b>정리</b> 모듈형일 수 있지만 MoE가 필수는 아님</span>
            </div>
          </article>
        )}

        {current === 4 && (
          <article className="slide slide-compare">
            <div className="slide-heading reveal">
              <p className="eyebrow dark">A DIFFERENT CENTER OF GRAVITY</p>
              <h2>LLM을 넘어, 왜 ‘월드 모델’일까?</h2>
              <p>둘은 경쟁자가 아니라, 서로 다른 질문에 중심을 둡니다.</p>
            </div>
            <div className="compare-switch reveal delay-one" role="group" aria-label="모델 관점 선택">
              <button
                className={comparisonMode === "language" ? "active" : ""}
                onClick={() => setComparisonMode("language")}
              >
                LLM의 중심
              </button>
              <button
                className={comparisonMode === "world" ? "active" : ""}
                onClick={() => setComparisonMode("world")}
              >
                월드 모델의 중심
              </button>
            </div>
            <div className={`comparison-scene ${comparisonMode} reveal delay-two`}>
              <div className="question-card">
                <span>현재 장면</span>
                <div className="table-scene" aria-hidden="true">
                  <span className="table-top" />
                  <span className="cup" />
                  <span className="push-vector">PUSH →</span>
                </div>
                <p>“컵을 오른쪽으로 밀면 어떻게 될까?”</p>
              </div>
              <div className="thinking-path" aria-hidden="true">
                <span />
                <i>→</i>
                <span />
              </div>
              <div className="answer-card" key={comparisonMode}>
                <small>{comparisonMode === "language" ? "NEXT TOKEN" : "NEXT STATE"}</small>
                <h3>
                  {comparisonMode === "language"
                    ? "‘컵이 움직일 것이다’라고 설명"
                    : "컵·손·테이블의 다음 상태를 내부에서 예측"}
                </h3>
                <p>
                  {comparisonMode === "language"
                    ? "언어 패턴을 바탕으로 가장 그럴듯한 설명을 이어갑니다."
                    : "현재 상태와 행동 조건을 함께 보고, 세계가 어떻게 변할지 모델링합니다."}
                </p>
              </div>
            </div>
            <p className="nuance-note reveal delay-two">
              <strong>여기서 볼 것:</strong> 둘의 경계가 아니라, 학습 목표가 ‘그럴듯한 설명’과 ‘일관된 상태 변화’ 중 어디에 중심을 두는가.
            </p>
          </article>
        )}

        {current === 6 && (
          <article className="slide slide-orca-intro">
            <div className="orca-intro-copy reveal">
              <p className="eyebrow">THE PAPER’S BET</p>
              <h2>
                ORCA의 제안:
                <br />
                출력보다 먼저 <em>세계 상태</em>를 배워라.
              </h2>
              <p>
                텍스트, 이미지, 행동을 각각 잘 만드는 모델 대신,
                하나의 공통된 세계 잠재 공간을 먼저 만들 수 있다면?
              </p>
              <div className="prediction-pills">
                <span>Next Token</span>
                <span>Next Frame</span>
                <span>Next Action</span>
                <b>Next State</b>
              </div>
              <button className="primary-button light" onClick={() => goTo(7)}>
                ORCA의 문제의식 보기 <span>→</span>
              </button>
            </div>
            <div className="state-core reveal delay-one" aria-hidden="true">
              <span className="core-ring ring-one" />
              <span className="core-ring ring-two" />
              <span className="core-ring ring-three" />
              <strong>STATE</strong>
              <i className="signal signal-one">text</i>
              <i className="signal signal-two">vision</i>
              <i className="signal signal-three">action</i>
            </div>
          </article>
        )}

        {current === 5 && (
          <article className="slide slide-history">
            <div className="slide-heading reveal">
              <p className="eyebrow dark">A SHORT HISTORY · FROM DREAM TO FOUNDATION</p>
              <h2>‘머릿속 시뮬레이터’는 이렇게 커져 왔다.</h2>
              <p>작은 게임의 꿈에서 시작해, 현실 세계의 공통 상태 공간을 향하는 흐름입니다.</p>
            </div>
            <div className="history-flow reveal delay-one">
              <article className="history-card">
                <span className="history-year">2018</span>
                <div className="dream-window" aria-hidden="true">
                  <span className="dream-road" />
                  <span className="dream-car" />
                  <span className="dream-cloud cloud-a" />
                  <span className="dream-cloud cloud-b" />
                </div>
                <h3>World Models</h3>
                <p>환경을 압축해 배우고, 에이전트를 모델이 만든 ‘꿈’ 안에서 훈련.</p>
              </article>
              <span className="history-connector">→</span>
              <article className="history-card">
                <span className="history-year">2023 → 2025</span>
                <div className="dream-window dream-grid" aria-hidden="true">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <i key={index} />
                  ))}
                  <span className="diamond">◆</span>
                </div>
                <h3>DreamerV3</h3>
                <p>상상한 미래에서 행동을 개선해 150개가 넘는 다양한 제어 과제로 확장.</p>
              </article>
              <span className="history-connector">→</span>
              <article className="history-card history-orca">
                <span className="history-year">2026</span>
                <div className="dream-window mini-latent" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <strong>STATE</strong>
                </div>
                <h3>ORCA</h3>
                <p>영상과 언어에서 세계 상태를 배우고, 텍스트·이미지·행동이 공유하는 기반으로.</p>
              </article>
            </div>
            <div className="history-thesis reveal delay-two">
              <span>초기의 질문</span>
              <p>“에이전트가 환경을 머릿속에 압축할 수 있을까?”</p>
              <b>→</b>
              <span>ORCA의 질문</span>
              <p>“모든 출력이 공유하는 세계 상태를 만들 수 있을까?”</p>
            </div>
          </article>
        )}

        {current === 7 && (
          <article className="slide slide-fragments">
            <div className="slide-heading reveal">
              <p className="eyebrow dark">THE GAP · LOCALLY PLAUSIBLE, GLOBALLY WRONG</p>
              <h2>각자의 ‘다음’을 잘 맞혀도, 세계는 틀릴 수 있다.</h2>
              <p>카드를 눌러 ORCA가 지적한 분절된 예측 목표의 빈틈을 확인해 보세요.</p>
            </div>
            <div className="fragment-layout reveal delay-one">
              <div className="fragment-tabs" role="tablist" aria-label="예측 목표 선택">
                <button
                  role="tab"
                  className={fragmentLens === "token" ? "active" : ""}
                  onClick={() => setFragmentLens("token")}
                  aria-selected={fragmentLens === "token"}
                >
                  <small>LANGUAGE</small>
                  Next Token
                </button>
                <button
                  role="tab"
                  className={fragmentLens === "frame" ? "active" : ""}
                  onClick={() => setFragmentLens("frame")}
                  aria-selected={fragmentLens === "frame"}
                >
                  <small>VIDEO</small>
                  Next Frame
                </button>
                <button
                  role="tab"
                  className={fragmentLens === "action" ? "active" : ""}
                  onClick={() => setFragmentLens("action")}
                  aria-selected={fragmentLens === "action"}
                >
                  <small>ROBOT</small>
                  Next Action
                </button>
              </div>
              <div className={`fragment-demo demo-${fragmentLens}`} key={fragmentLens}>
                <div className="fragment-visual" aria-hidden="true">
                  {fragmentLens === "token" && (
                    <>
                      <span className="token-chip">컵이</span>
                      <span className="token-chip">위로</span>
                      <span className="token-chip impossible">떨어졌다</span>
                    </>
                  )}
                  {fragmentLens === "frame" && (
                    <>
                      <span className="frame frame-now"><i /></span>
                      <b>→</b>
                      <span className="frame frame-broken"><i /></span>
                    </>
                  )}
                  {fragmentLens === "action" && (
                    <>
                      <span className="robot-arm" />
                      <span className="action-path" />
                      <span className="target-cup" />
                    </>
                  )}
                </div>
                <div className="fragment-copy">
                  <span>OUTPUT CAN LOOK RIGHT</span>
                  <h3>
                    {fragmentLens === "token" && "문장은 자연스럽지만 물리적으로 불가능할 수 있다."}
                    {fragmentLens === "frame" && "한 장면은 선명하지만 물체의 정체성과 접촉이 깨질 수 있다."}
                    {fragmentLens === "action" && "동작은 그럴듯하지만 그 행동 이후의 결과를 모를 수 있다."}
                  </h3>
                  <p>
                    {fragmentLens === "token" && "언어의 그럴듯함과 실제 상태 변화의 일관성은 같은 문제가 아닙니다."}
                    {fragmentLens === "frame" && "보기 좋은 생성과 지속 가능한 세계 시뮬레이션 사이에는 간극이 있습니다."}
                    {fragmentLens === "action" && "시연을 모방하는 것과 세계를 변화시키는 원리를 아는 것은 다릅니다."}
                  </p>
                </div>
              </div>
            </div>
            <p className="fragment-answer reveal delay-two">
              ORCA의 답: 출력 형태가 아니라, 그 아래에서 공유되는 <strong>상태 변화</strong>를 학습하자.
            </p>
          </article>
        )}

        {current === 8 && (
          <article className="slide slide-architecture">
            <div className="architecture-copy reveal">
              <p className="eyebrow">ORCA · NEXT-STATE PREDICTION</p>
              <h2>
                먼저 세계를 <em>하나의 상태</em>로 압축한다.
              </h2>
              <p>
                ORCA는 현재 관찰에서 보이지 않는 동역학과 명시적인 조건을 함께 고려해
                다음 또는 이전 상태를 잠재 공간에서 예측합니다.
              </p>
              <div className="architecture-equation">
                <span>S<sub>t</sub></span>
                <b>＋</b>
                <span>z<sub>t</sub></span>
                <b>＋</b>
                <span>c<sub>t</sub></span>
                <b>→</b>
                <strong>S<sub>t+Δ</sub></strong>
              </div>
              <div className="equation-legend">
                <span><i className="legend-state" /> 현재 세계 상태</span>
                <span><i className="legend-dynamics" /> 물리·장면의 숨은 동역학</span>
                <span><i className="legend-condition" /> 언어 지시·사건 조건</span>
              </div>
            </div>
            <div className="architecture-orbit reveal delay-one" aria-hidden="true">
              <div className="input-signal signal-vision"><span />VISION</div>
              <div className="input-signal signal-language"><span />LANGUAGE</div>
              <div className="world-core">
                <span className="world-core-ring ring-a" />
                <span className="world-core-ring ring-b" />
                <i>UNIFIED</i>
                <strong>WORLD<br />LATENT</strong>
              </div>
              <div className="next-state-card">
                <small>NEXT STATE</small>
                <span className="next-object before" />
                <b>→</b>
                <span className="next-object after" />
              </div>
              <span className="flow flow-a" />
              <span className="flow flow-b" />
              <span className="flow flow-c" />
            </div>
          </article>
        )}

        {current === 9 && (
          <article className="slide slide-learning">
            <div className="slide-heading reveal">
              <p className="eyebrow dark">HOW IT LEARNS · TWO COMPLEMENTARY MODES</p>
              <h2>보고 익히고, 말로 의미를 붙인다.</h2>
              <p>ORCA는 ‘무의식’과 ‘의식’이라는 두 학습 경로를 함께 사용합니다.</p>
            </div>
            <div className="learning-switch reveal delay-one" role="group" aria-label="학습 방식 선택">
              <button
                className={learningMode === "unconscious" ? "active" : ""}
                onClick={() => setLearningMode("unconscious")}
              >
                <small>01 · DENSE</small>
                무의식 학습
              </button>
              <button
                className={learningMode === "conscious" ? "active" : ""}
                onClick={() => setLearningMode("conscious")}
              >
                <small>02 · MEANINGFUL</small>
                의식 학습
              </button>
            </div>
            <div className={`learning-stage learning-${learningMode} reveal delay-two`} key={learningMode}>
              <div className="learning-visual" aria-hidden="true">
                {learningMode === "unconscious" ? (
                  <div className="film-strip">
                    <span><i className="rolling-ball ball-one" /></span>
                    <b>→</b>
                    <span><i className="rolling-ball ball-two" /></span>
                    <b>→</b>
                    <span><i className="rolling-ball ball-three" /></span>
                  </div>
                ) : (
                  <div className="event-strip">
                    <span className="event-instruction">“컵을 들어 선반에 놓는다”</span>
                    <div className="event-scenes">
                      <span><i className="event-cup event-start" /></span>
                      <b>→</b>
                      <span><i className="event-cup event-end" /></span>
                    </div>
                    <span className="event-question">왜 컵의 높이가 달라졌을까?</span>
                  </div>
                )}
              </div>
              <div className="learning-copy">
                <span>{learningMode === "unconscious" ? "OBSERVATION ONLY" : "LANGUAGE CONDITIONED"}</span>
                <h3>
                  {learningMode === "unconscious"
                    ? "연속 영상에서 촘촘하고 자연스러운 변화를 흡수"
                    : "사건 설명과 질문으로 의미 있는 변화를 조직"}
                </h3>
                <p>
                  {learningMode === "unconscious"
                    ? "별도 라벨 없이 인접한 미래 프레임의 잠재 표현을 예측하며 움직임, 가림, 접촉, 장면 변화를 배웁니다."
                    : "언어로 묘사된 다음·이전 사건을 조건으로 상태를 예측하고, VQA를 통해 상식과 인과적 의미를 연결합니다."}
                </p>
                <div className="learning-tags">
                  {(learningMode === "unconscious"
                    ? ["motion", "occlusion", "contact", "natural dynamics"]
                    : ["event", "intention", "causality", "VQA"]
                  ).map((tag) => <i key={tag}>{tag}</i>)}
                </div>
              </div>
            </div>
          </article>
        )}

        {current === 10 && (
          <article className="slide slide-evidence">
            <div className="evidence-heading reveal">
              <div>
                <p className="eyebrow dark">EVIDENCE · FREEZE THE CORE, TEST THE READOUTS</p>
                <h2>세계 상태가 정말 유용한지, 세 방향으로 꺼내 봤다.</h2>
              </div>
              <div className="data-stats">
                <span><strong>125K</strong> hours video</span>
                <span><strong>160M</strong> events</span>
                <span><strong>11.5M</strong> VQA</span>
              </div>
            </div>
            <div className="evidence-layout reveal delay-one">
              <div className="frozen-core">
                <span className="snow">✦</span>
                <small>FROZEN BACKBONE</small>
                <strong>ORCA<br />WORLD LATENT</strong>
                <p>공통 백본은 고정</p>
              </div>
              <div className="readout-panel">
                <div className="readout-tabs" role="tablist" aria-label="출력 평가 선택">
                  {(["language", "vision", "action"] as ReadoutMode[]).map((mode) => (
                    <button
                      key={mode}
                      role="tab"
                      className={readoutMode === mode ? "active" : ""}
                      onClick={() => setReadoutMode(mode)}
                      aria-selected={readoutMode === mode}
                    >
                      {mode === "language" ? "Text" : mode === "vision" ? "Image" : "Action"}
                    </button>
                  ))}
                </div>
                <div className={`readout-result result-${readoutMode}`} key={readoutMode}>
                  <div className="readout-number">
                    <small>{readoutMode === "language" ? "OVERALL" : readoutMode === "vision" ? "PRICE AVG." : "RULE-BASED OVERALL"}</small>
                    <strong>{readoutMode === "language" ? "51.8" : readoutMode === "vision" ? "59.8" : "32.4"}</strong>
                  </div>
                  <div className="bar-compare">
                    <span style={{ "--bar": readoutMode === "language" ? "90%" : readoutMode === "vision" ? "93%" : "86%" } as CSSProperties}>
                      <i>
                        {readoutMode === "language"
                          ? "ORCA-4B · 51.8"
                          : readoutMode === "vision"
                            ? "ORCA · 4+2B · 59.8"
                            : "ORCA · 32.4"}
                      </i><b />
                    </span>
                    <span style={{ "--bar": readoutMode === "language" ? "77%" : readoutMode === "vision" ? "87%" : "78%" } as CSSProperties}>
                      <i>
                        {readoutMode === "language"
                          ? "Qwen3.5-4B · 46.7"
                          : readoutMode === "vision"
                            ? "FLUX.2 klein · 56.1"
                            : "π₀.₅ · 29.4"}
                      </i><b />
                    </span>
                  </div>
                  <p>
                    {readoutMode === "language" && "동일 4B 규모 VLM보다 시간·상태 변화 중심 벤치마크의 전체 평균이 높았습니다."}
                    {readoutMode === "vision" && "예쁜 그림이 아니라 지시 이후의 실제 상태를 예측하는 PRICE 평가에서 가장 높은 평균을 기록했습니다."}
                    {readoutMode === "action" && "규칙 기반 로봇 실험의 전체 평균은 높았지만, Object-OOD 조건에서는 π₀.₅가 더 강했습니다."}
                  </p>
                </div>
              </div>
            </div>
            <div className="evidence-foot reveal delay-two">
              <p><strong>핵심:</strong> 출력부만 바꿔도 세 능력이 함께 좋아졌다 → 공통 잠재 공간에 실제로 재사용 가능한 정보가 있다.</p>
              <span>※ 구축한 영상 데이터 중 이번 버전 학습에 사용한 양은 약 1/10</span>
            </div>
          </article>
        )}

        {current === 11 && (
          <article className="slide slide-fab-context">
            <div
              className="fab-immersive reveal delay-one"
              role="img"
              aria-label="천장 자동 운송 레일과 웨이퍼 공정 장비가 연결된 미래형 반도체 팹"
            >
              <span className="fab-camera-glow" />
              <span className="fab-scan-line" />
              <svg className="fab-overhead-flow" viewBox="0 0 1000 620" aria-hidden="true">
                <path className="fab-rail-shadow" d="M18 170 C210 72 350 106 510 178 S785 256 982 116" />
                <path className="fab-rail-live" d="M18 170 C210 72 350 106 510 178 S785 256 982 116" />
                <path className="fab-rail-shadow rail-lower" d="M85 455 C260 365 430 412 560 474 S805 520 955 384" />
                <path className="fab-rail-live rail-lower" d="M85 455 C260 365 430 412 560 474 S805 520 955 384" />
              </svg>
              <span className="fab-pod pod-a"><i /></span>
              <span className="fab-pod pod-b"><i /></span>
              <span className="fab-pod pod-c"><i /></span>
              <span className="fab-pod pod-d"><i /></span>
              <span className="fab-status-node node-a" />
              <span className="fab-status-node node-b" />
              <span className="fab-status-node node-c" />
              <div className="fab-live-hud">
                <span><b>1,284</b> LOTS IN MOTION</span>
                <span><b>96.2%</b> TOOL AVAILABILITY</span>
                <span><b>417</b> ACTIVE ROUTES</span>
              </div>
            </div>
            <div className="fab-context-copy reveal">
              <p className="eyebrow">IDEAL FUTURE CASE · AUTONOMOUS FAB</p>
              <h2>
                이미 자동화된 공장에,
                <br />
                왜 <em>월드 모델</em>이 필요할까?
              </h2>
              <p>
                첨단 반도체 팹은 1,000개가 넘는 공정과 수백 대의 장비,
                웨이퍼를 실어 나르는 AMHS가 하나의 거대한 흐름으로 연결된 공간입니다.
              </p>
              <div className="fab-analogy">
                <span><b>장비</b> 도시의 목적지</span>
                <span><b>FOUP</b> 움직이는 승객</span>
                <span><b>AMHS</b> 공장의 도로망</span>
                <span><b>DISPATCH</b> 실시간 교통 신호</span>
              </div>
              <blockquote>
                자동화가 공장을 움직인다면,
                <strong> 월드 모델은 움직이기 전에 여러 미래를 비교합니다.</strong>
              </blockquote>
              <p className="fab-source">
                현실의 복잡성에 기반한 미래 적용 시나리오 · Sources: NIST, Intel, Daifuku
              </p>
            </div>
          </article>
        )}

        {current === 12 && (
          <article className={`slide slide-fab-operations strategy-${fabStrategy}`}>
            <div className="fab-ops-heading reveal">
              <div>
                <p className="eyebrow">COUNTERFACTUAL FACTORY · FULL FAB VIEW</p>
                <h2>핵심 장비가 멈췄다. 세 가지 미래를 공장 전체에서 재생한다.</h2>
                <p>대응책을 바꾸며 <strong>강조된 경로 → 오른쪽 KPI → 하단 2시간 타임라인</strong> 순서로 보세요.</p>
              </div>
              <div className="fab-ops-strategies" role="tablist" aria-label="전체 팹 대응 전략 선택">
                {(Object.keys(fabStrategyCopy) as FabStrategy[]).map((strategy, index) => (
                  <button
                    key={strategy}
                    role="tab"
                    className={fabStrategy === strategy ? "active" : ""}
                    onClick={() => setFabStrategy(strategy)}
                    aria-selected={fabStrategy === strategy}
                  >
                    <small>0{index + 1}</small>
                    <span>{strategy === "reroute" ? "한 곳 우회" : strategy === "balance" ? "두 loop 분산" : "투입 보류"}</span>
                  </button>
                ))}
              </div>
            </div>

            <section className="fab-ops-console reveal delay-one" aria-label="가상 반도체 팹 AMHS 운영 시뮬레이터">
              <header className="ops-console-bar">
                <div className="ops-console-title">
                  <i />
                  <span>FAB AMHS DIGITAL TWIN</span>
                  <b>SCENARIO · TOOL_A_DOWN</b>
                </div>
                <div className="ops-mode-tabs" aria-label="시뮬레이션 모드">
                  <span>LIVE</span>
                  <span>PLAYBACK</span>
                  <strong>SIMULATION</strong>
                </div>
                <div className="ops-clock"><span>SIM TIME</span><b>＋02:00:00</b><em>×32</em></div>
              </header>

              <div className="ops-console-workspace">
                <div className="ops-map-pane">
                  <FabOpsMap key={fabStrategy} strategy={fabStrategy} />
                </div>
                <aside className="ops-kpi-panel" key={`kpi-${fabStrategy}`}>
                  <div className={`ops-health health-${fabStrategy}`}>
                    <small>NETWORK STATE</small>
                    <strong>{fabOpsMetrics[fabStrategy].status}</strong>
                    <span>{fabOpsMetrics[fabStrategy].summary}</span>
                  </div>
                  <div className="ops-kpi-grid">
                    <span><small>ACTIVE OHT</small><b>{fabOpsMetrics[fabStrategy].activeOht}</b></span>
                    <span><small>MAX SEGMENT OCC.</small><b>{fabOpsMetrics[fabStrategy].segment}</b></span>
                    <span><small>AVG. TRANSPORT</small><b>{fabOpsMetrics[fabStrategy].transport}</b></span>
                    <span><small>BUFFER STATE</small><b>{fabOpsMetrics[fabStrategy].buffer}</b></span>
                  </div>
                  <div className="ops-kpi-bars">
                    <div><span>INTERBAY SPINE</span><i><b style={{ width: fabStrategy === "reroute" ? "86%" : fabStrategy === "balance" ? "58%" : "34%" }} /></i></div>
                    <div><span>BAY 03 LOOP</span><i><b style={{ width: fabStrategy === "reroute" ? "92%" : fabStrategy === "balance" ? "62%" : "38%" }} /></i></div>
                    <div><span>EMPTY TRAVEL</span><i><b style={{ width: fabStrategy === "reroute" ? "74%" : fabStrategy === "balance" ? "39%" : "28%" }} /></i></div>
                  </div>
                  <p className="ops-safety"><i /> HUMAN APPROVAL REQUIRED</p>
                </aside>
              </div>

              <footer className="ops-event-timeline">
                {(["NOW", "+08m", "+37m", "+2h"] as const).map((time, index) => (
                  <div key={time} className={index === 3 ? "active" : ""}>
                    <span>{time}</span>
                    <i />
                    <b>{fabOpsMetrics[fabStrategy].timeline[index]}</b>
                  </div>
                ))}
              </footer>
            </section>

            <div className="fab-ops-sources reveal delay-two">
              <span>동작·레이아웃 참고</span>
              <a href="https://www.daifuku.com/daifuku-square/article/000999/" target="_blank" rel="noreferrer">Daifuku Cleanway ↗</a>
              <a href="https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2023-07/intel-sony-advance-digital-twin-technology-for-manufacturing-case-study.pdf" target="_blank" rel="noreferrer">Intel Factory Recon ↗</a>
              <a href="https://informs-sim.org/wsc13papers/includes/files/344.pdf" target="_blank" rel="noreferrer">WSC · AMHS simulation ↗</a>
              <em>※ 공장·수치는 설명을 위한 가상 시나리오</em>
            </div>
          </article>
        )}

        {current === 13 && (
          <article className="slide slide-fab-value">
            <div className="fab-value-heading reveal">
              <p className="eyebrow dark">THE VALUE · AN IMAGINATION LAYER ABOVE AUTOMATION</p>
              <h2>
                자동화를 대체하는 것이 아니라,
                <br />
                그 위에 <em>‘상상 계층’</em>을 더한다.
              </h2>
              <p>기존 시스템이 실제 공장을 움직이고, 월드 모델은 행동의 파급효과를 먼저 비교합니다.</p>
            </div>
            <div className="fab-value-layout reveal delay-one">
              <div className="fab-world-loop">
                <div className="loop-node signals">
                  <small>WORLD SIGNALS</small>
                  <strong>장비 · 웨이퍼 · 물류 · 일정</strong>
                  <span>실시간 데이터와 사건 기록</span>
                </div>
                <span className="loop-arrow">→</span>
                <div className="loop-node latent">
                  <small>UNIFIED STATE</small>
                  <strong>현재 공장의 공통 상태</strong>
                  <span>S<sub>t</sub> · learned fab latent</span>
                  <i className="latent-pulse" />
                </div>
                <span className="loop-arrow">→</span>
                <div className="loop-node futures">
                  <small>NEXT STATES</small>
                  <strong>행동마다 달라지는 미래</strong>
                  <span>＋30분 · ＋2시간 · 한 교대</span>
                </div>
                <span className="loop-arrow">→</span>
                <div className="loop-node action">
                  <small>GUARDED ACTION</small>
                  <strong>설명 가능한 실행 제안</strong>
                  <span>규칙 검증 · 사람 승인 · 자동화 실행</span>
                </div>
              </div>
              <div className="fab-value-cards">
                <article>
                  <span>01</span>
                  <div>
                    <small>SYSTEM-WIDE</small>
                    <h3>국소 판단의 연쇄 효과를 본다</h3>
                    <p>장비 한 대의 결정이 대기열·물류·납기까지 어떻게 번지는지 하나의 상태로 연결합니다.</p>
                  </div>
                </article>
                <article>
                  <span>02</span>
                  <div>
                    <small>COUNTERFACTUAL</small>
                    <h3>실행 전에 여러 선택을 경험한다</h3>
                    <p>우회·분산·감속 같은 대응책을 실제 공장에 적용하기 전에 가상으로 비교합니다.</p>
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <small>MULTIPLE READOUTS</small>
                    <h3>같은 미래를 지도·수치·언어로 설명한다</h3>
                    <p>운영자는 병목 지도를 보고, 관리자는 납기 위험을 보고, 엔지니어는 근거와 불확실성을 확인합니다.</p>
                  </div>
                </article>
              </div>
            </div>
            <div className="fab-human-loop reveal delay-two">
              <span><b>1</b> 월드 모델이 미래 비교</span>
              <i>→</i>
              <span><b>2</b> 기존 안전 규칙이 위험 행동 제거</span>
              <i>→</i>
              <span><b>3</b> 엔지니어 승인</span>
              <i>→</i>
              <span><b>4</b> MES·AMHS가 실행하고 결과를 다시 학습</span>
            </div>
          </article>
        )}

        {current === 14 && (
          <article className="slide slide-finale">
            <div className="finale-main reveal">
              <p className="eyebrow">SO, WHAT CHANGED?</p>
              <h2>
                더 잘 말하는 AI에서,
                <br />
                <em>행동 전에 세계를 돌려보는 AI</em>로.
              </h2>
              <p>
                ORCA는 완성된 범용 시뮬레이터가 아니라 첫 구현입니다.
                하지만 AI의 중심 질문을 “무엇을 출력할까?”에서
                <strong> “세계가 어떻게 변할까?”</strong>로 옮겼습니다.
              </p>
              <div className="takeaways">
                <span><b>01</b> 출력보다 상태</span>
                <span><b>02</b> 하나의 잠재 공간, 여러 인터페이스</span>
                <span><b>03</b> 말하기를 넘어 예측하고 행동하기</span>
              </div>
            </div>
            <div className="finale-side reveal delay-one">
              <article className="limits-card">
                <small>DON’T OVERCLAIM</small>
                <h3>아직 남아 있는 한계</h3>
                <ul>
                  <li>입력 신호가 주로 시각과 언어에 한정</li>
                  <li>0.8B·4B 규모, 전체 데이터의 일부만 사용</li>
                  <li>독립적인 세계 공간이 아닌 고정 ViT 잠재 공간으로 감독</li>
                  <li>실세계 예측 벤치마크의 규모와 다양성 제한</li>
                </ul>
              </article>
              <article className="sources-card">
                <small>PRIMARY SOURCES</small>
                <a href="https://arxiv.org/abs/2606.30534" target="_blank" rel="noreferrer">ORCA technical report <span>↗</span></a>
                <a href="https://orca-wm.github.io/" target="_blank" rel="noreferrer">ORCA project page <span>↗</span></a>
                <a href="https://worldmodels.github.io/" target="_blank" rel="noreferrer">World Models (2018) <span>↗</span></a>
                <a href="https://www.nature.com/articles/s41586-025-08744-2" target="_blank" rel="noreferrer">DreamerV3 · Nature <span>↗</span></a>
                <a href="https://www.nist.gov/system/files/documents/2024/02/14/CHIPS-MFG-USA-IndustryDay-12Feb2024.pdf" target="_blank" rel="noreferrer">NIST · Digital Twin Fab <span>↗</span></a>
                <a href="https://newsroom.intel.com/press-kit/global-manufacturing" target="_blank" rel="noreferrer">Intel · Automated Fab <span>↗</span></a>
                <a href="https://www.daifuku.com/daifuku-square/article/000999/" target="_blank" rel="noreferrer">Daifuku · Cleanroom AMHS <span>↗</span></a>
                <a href="https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2023-07/intel-sony-advance-digital-twin-technology-for-manufacturing-case-study.pdf" target="_blank" rel="noreferrer">Intel · Factory Recon <span>↗</span></a>
              </article>
            </div>
            <button className="restart-button" onClick={() => goTo(0)}>처음부터 다시 보기 ↺</button>
          </article>
        )}
      </section>

      <nav className="deck-nav" aria-label="슬라이드 이동">
        <button onClick={() => goTo(current - 1)} disabled={current === 0} aria-label="이전 슬라이드">
          ←
        </button>
        <div className="progress-dots">
          {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
            <button
              key={index}
              className={index === current ? "active" : ""}
              onClick={() => goTo(index)}
              aria-label={`${index + 1}번 슬라이드`}
              aria-current={index === current ? "step" : undefined}
            />
          ))}
        </div>
        <button
          onClick={() => goTo(current + 1)}
          disabled={current === TOTAL_SLIDES - 1}
          aria-label="다음 슬라이드"
        >
          →
        </button>
      </nav>

      {showNotes && (
        <aside className="notes-panel" role="dialog" aria-label="발표자 노트">
          <div>
            <span>발표자 노트 · {current + 1}</span>
            <button onClick={() => setShowNotes(false)} aria-label="노트 닫기">
              ×
            </button>
          </div>
          <p>{notes[current]}</p>
        </aside>
      )}
    </main>
  );
}
