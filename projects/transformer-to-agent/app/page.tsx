"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  FileSearch,
  FileText,
  FlaskConical,
  LockKeyhole,
  MessageSquareText,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  TerminalSquare,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "presentation" | "article";
type PageId =
  | "opening"
  | "prologue"
  | "core-question"
  | "classification-language"
  | "next-token"
  | "appendix";
type SourceLink = { label: string; href: string };
type PageDefinition = { id: PageId; template: string; title: string; beats: string[] };

const PAGES: PageDefinition[] = [
  {
    id: "opening",
    template: "Opening",
    title: "FROM TRANSFORMER TO AGENT SYSTEMS",
    beats: ["예측에서 실행까지, 모델 안과 모델 밖을 하나의 흐름으로 연결합니다."],
  },
  {
    id: "prologue",
    template: "Prologue / Runtime Incident",
    title: "코드는 실제로 바뀌었다",
    beats: [
      "배포 직후, 일부 사용자 조회 요청에서만 500 오류가 발생합니다.",
      "개발자는 로그와 함께 Coding Agent에게 원인 분석과 수정을 요청합니다.",
      "Agent는 로그를 읽고, 관련 코드를 찾고, 실패를 재현한 뒤 수정과 테스트를 이어갑니다.",
      "로컬 검증은 끝났습니다. 그런데 다음 Token 예측기가 어떻게 Repository를 바꿨을까요?",
    ],
  },
  {
    id: "core-question",
    template: "Question / System Boundary",
    title: "더 강한 언어 모델은 왜 아직 Agent가 아닌가?",
    beats: [
      "언어 모델은 Context를 바탕으로 다음 출력을 예측합니다.",
      "파일 접근과 터미널 실행은 Model의 계산 경계 밖에 있습니다.",
      "Agent System은 LLM 주변에 Context·Tool·Runtime·Permission·Feedback를 결합합니다.",
    ],
  },
  {
    id: "classification-language",
    template: "Visual Explainer / Shared Prediction Shape",
    title: "분류에서 언어로 — 무엇이 같고 무엇이 다른가?",
    beats: [
      "이미지 분류 모델에 하나의 입력이 들어옵니다. 결과는 아직 계산 전입니다.",
      "모델은 정해진 Class 후보에 점수를 매기고 ORCA를 선택합니다.",
      "언어 모델도 현재 Context에서 가능한 다음 Token 후보에 점수를 매깁니다.",
      "공통점은 후보 점수화입니다. 입력·후보 공간·모델 구조가 같다는 뜻은 아닙니다.",
    ],
  },
  {
    id: "next-token",
    template: "Visual Explainer / Autoregressive Loop",
    title: "다음 Token 예측은 어떻게 문장이 되는가?",
    beats: [
      "문장은 Token 단위의 Context로 Model에 들어갑니다.",
      "Model은 Vocabulary 전체에 대한 점수를 만들고 확률 분포로 바꿉니다.",
      "선택 규칙에 따라 하나의 Token이 선택되어 출력에 추가됩니다.",
      "늘어난 Context로 같은 과정을 반복하면 한 번의 예측이 문장 생성이 됩니다.",
    ],
  },
  {
    id: "appendix",
    template: "Appendix / Visual Reading",
    title: "THE HANDOFF — MODEL OUTPUT TO RUNTIME",
    beats: ["Model Output → Tool Request → System Boundary → Local Runtime 삽화를 정적으로 읽습니다."],
  },
];

const ARTICLE_COPY: Record<PageId, { lead: string; note: string; sources: SourceLink[] }> = {
  opening: {
    lead: "Coding Agent를 하나의 거대한 AI로 보지 않고, 확률적 언어 모델과 실행 환경이 역할을 나누는 소프트웨어 시스템으로 해부합니다.",
    note: "중심 질문 · Transformer 기반 LLM의 예측은 어떻게 도구와 실행 환경을 거쳐 실제 작업으로 이어지는가?",
    sources: [{ label: "Attention Is All You Need", href: "https://arxiv.org/abs/1706.03762" }],
  },
  prologue: {
    lead: "출발점은 설명용 장난감 문제가 아니라, 개발자가 실제로 Coding Agent에게 맡길 법한 운영 오류 조사입니다.",
    note: "주의 · Agent가 운영 서버에 직접 접속한 장면이 아닙니다. 사용자가 제공한 로그와 로컬 Repository 안에서 조사하고 검증한 상황입니다.",
    sources: [],
  },
  "core-question": {
    lead: "모델의 능력이 커지는 것과 모델이 파일·프로세스·네트워크에 대한 실행 권한을 갖는 것은 서로 다른 변화입니다.",
    note: "핵심 · Transformer가 Agent로 변한 것이 아니라, Transformer 기반 LLM을 중심으로 Agent System이 구성됩니다.",
    sources: [
      { label: "Transformer 원문", href: "https://arxiv.org/abs/1706.03762" },
      { label: "Claude Tool Use", href: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview" },
    ],
  },
  "classification-language": {
    lead: "이미지 분류와 다음 Token 예측은 모두 현재 입력에 대해 가능한 후보들을 점수화한다는 공통된 관점으로 설명할 수 있습니다.",
    note: "주의 · 공통점은 예측 문제의 형태입니다. 이미지 분류기가 LLM과 같은 입력·Architecture·Vocabulary를 사용한다는 뜻은 아닙니다.",
    sources: [{ label: "GPT-3 Paper", href: "https://arxiv.org/abs/2005.14165" }],
  },
  "next-token": {
    lead: "LLM은 문장을 한 번에 완성된 덩어리로 꺼내지 않습니다. 현재 Context에서 다음 Token을 고르고, 그 결과를 다시 Context에 포함하는 과정을 반복합니다.",
    note: "단순화 · 화면은 읽기 쉬운 어절 단위로 표시합니다. 실제 Token 경계와 후보는 Tokenizer 및 Model에 따라 달라집니다.",
    sources: [{ label: "GPT-3 Paper", href: "https://arxiv.org/abs/2005.14165" }],
  },
  appendix: {
    lead: "이 삽화는 LLM의 구조화된 출력이 실행 권한을 가진 Runtime에 전달되는 경계를 물리적인 작업대로 비유합니다.",
    note: "핵심 · Model은 Tool을 직접 실행하지 않습니다. 구조화된 요청을 만들고, Runtime이 이를 검증해 실행합니다.",
    sources: [{ label: "Claude Tool Use", href: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview" }],
  },
};

const ARTICLE_BEAT_COPY: Record<PageId, string[]> = {
  opening: [
    "이 자료는 Transformer 논문만 설명하거나 특정 Coding Agent의 사용법만 나열하지 않습니다. Model 내부의 Token·Attention·Probability와 Model 주변의 Context·Tool·Runtime·Permission을 연결해, 예측이 실제 행동이 되는 전체 왕복 구조를 따라갑니다.",
  ],
  prologue: [
    "배포 직후 사용자 조회 API의 5xx 비율이 상승했지만 모든 요청이 실패한 것은 아닙니다. 일부 Legacy User에서만 발생한다는 단서가 있습니다. 이 시점에는 증상만 알고 있으며, 원인을 미리 확정하지 않습니다.",
    "개발자는 production-error.log를 Workspace에 제공하고 ‘원인을 찾고 수정한 뒤 테스트해 달라’고 요청합니다. Agent가 볼 수 있는 근거는 사용자 요청, 제공된 로그, 허용된 Repository와 Tool뿐입니다.",
    "Agent Runtime은 Model의 다음 판단에 따라 로그 읽기, 코드 검색, 파일 열기, 테스트 실행, 패치 적용을 반복합니다. 각 단계의 결과는 다음 판단의 Context로 돌아가며, 읽지 않은 파일까지 한 번에 이해했다고 가정하지 않습니다.",
    "실패 재현, Patch, 관련 Test 통과는 로컬 검증의 세 단계입니다. 실제 재배포와 운영 장애 해소 확인은 아직 남아 있습니다. 이 장면이 남기는 질문은 단순합니다. 확률적으로 Token을 고르는 Model의 출력이 어떻게 파일 수정과 테스트 실행으로 이어졌을까요?",
  ],
  "core-question": [
    "Transformer 기반 LLM의 직접 산출물은 Token으로 표현된 출력입니다. 더 정확한 설명과 더 나은 수정 계획을 만들 수 있어도, 그 계산 자체가 로컬 파일 시스템을 여는 행위는 아닙니다.",
    "‘이 파일을 읽어야 한다’는 문장을 생성하는 것과 실제 파일을 읽는 것은 다른 사건입니다. 요청 형식 검증, 경로 제한, 사용자 승인, 실행, Timeout, 결과 변환은 Model 바깥의 Runtime 책임입니다.",
    "Agent는 LLM의 새 이름이 아니라 소프트웨어 시스템입니다. Runtime은 사용 가능한 Tool Schema와 현재 Context를 Model에 제공하고, 구조화된 요청을 검증·실행한 뒤 결과를 다시 Context에 넣습니다. Permission과 User Approval은 이 Loop가 환경에 미치는 범위를 통제합니다.",
  ],
  "classification-language": [
    "첫 장면은 익숙한 분류 문제입니다. 하나의 이미지가 들어왔지만 아직 후보 점수는 계산되지 않았습니다. 입력의 존재와 예측 결과의 존재를 분리해야 입력 → 계산 → 선택의 인과관계가 보입니다.",
    "분류 모델은 ORCA, DOLPHIN, SHARK처럼 미리 정의된 클래스마다 점수를 만들고 정규화된 분포를 계산합니다. 화면의 91%는 현재 후보 집합에서 ORCA에 가장 큰 확률 질량이 배정됐다는 교육용 예시입니다.",
    "언어 모델에서는 후보 집합이 고정된 동물 클래스가 아니라 Vocabulary의 Token들입니다. 현재 Context가 달라지면 같은 Token의 점수도 달라집니다. 화면은 읽기 쉽게 단어 후보로 보여주지만 실제 Model은 Token ID와 수치 표현을 다룹니다.",
    "두 문제는 ‘현재 입력을 바탕으로 후보들을 점수화하고 목표와 비교해 학습한다’는 틀로 연결됩니다. 그러나 이미지의 픽셀과 텍스트 Token은 입력이 다르고, 후보 공간과 Architecture도 동일하다고 볼 수 없습니다. 이 연결은 언어 생성을 분류 관점에서 이해하기 위한 다리입니다.",
  ],
  "next-token": [
    "문자열은 Tokenizer를 거쳐 Token ID의 열로 바뀌고 Embedding으로 변환됩니다. Transformer는 Attention을 이용해 현재 Context 안의 관계를 반영한 표현을 계산합니다. 화면의 어절 칸은 이 흐름을 읽기 쉽게 단순화한 것입니다.",
    "Model의 마지막 계산은 Vocabulary의 각 Token 후보에 대한 Logit을 만듭니다. Softmax 같은 변환을 거치면 후보 간 상대적인 확률 분포로 읽을 수 있습니다. 실제 Vocabulary는 화면의 네 후보보다 훨씬 큽니다.",
    "생성 시에는 확률이 가장 높은 Token을 항상 고를 수도 있고, Temperature·Top-p 같은 Sampling 설정을 적용할 수도 있습니다. 여기서는 인과관계를 선명하게 보여주기 위해 가장 높은 ‘확인한다’를 선택하는 단순한 예시를 사용합니다.",
    "선택된 Token은 기존 Context 뒤에 붙고, 늘어난 Context로 다음 분포를 다시 계산합니다. 이 자기회귀 Loop가 반복되면서 여러 번의 작은 선택이 문장이 됩니다. 다음 장에서는 이와 닮은 판단 → Tool → Result Loop가 행동을 만드는 과정을 확장합니다.",
  ],
  appendix: [
    "여러 출력 후보 가운데 하나의 구조화된 Tool Request가 선택되고, 명확한 System Boundary를 통과해 Local Agent Runtime으로 전달됩니다. 그림 오른쪽의 파일·터미널·검증 도구는 Model이 아니라 Runtime에만 연결되어 있습니다.",
  ],
};

function useAnimatedNumber(target: number, shouldShow: boolean, animate: boolean) {
  const [value, setValue] = useState(shouldShow && !animate ? target : 0);
  useEffect(() => {
    let raf = 0;
    if (!shouldShow || !animate) {
      raf = requestAnimationFrame(() => setValue(shouldShow ? target : 0));
      return () => cancelAnimationFrame(raf);
    }
    let startedAt = 0;
    const tick = (time: number) => {
      if (!startedAt) startedAt = time;
      const elapsed = time - startedAt;
      if (elapsed < 24) setValue(0);
      if (elapsed < 320) { raf = requestAnimationFrame(tick); return; }
      const progress = Math.min(1, (elapsed - 320) / 760);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, shouldShow, animate]);
  return value;
}

function TemplateHeader({ page, index, mode }: { page: PageDefinition; index: number; mode: Mode }) {
  if (page.id === "opening") return <header className="template-header opening-template-header"><div className="template-kicker"><span className="mono">01</span><span>Opening / Question</span></div></header>;
  return <header className="template-header"><div className="template-kicker"><span className="mono">{String(index + 1).padStart(2, "0")}</span><span>{page.template}</span></div><h1 className={mode === "article" ? "article-title" : "page-title"}>{page.title}</h1></header>;
}

function OpeningScene({ animate }: { animate: boolean }) {
  return <div className={`opening-scene ${animate ? "is-animating" : "is-complete"}`}>
    <figure className="opening-hero-art" aria-hidden="true"><img src="./agent-runtime-handoff.webp" alt="" loading="eager" /><figcaption className="mono"><span>MODEL OUTPUT</span><i /><span>TOOL REQUEST</span><i /><span>LOCAL RUNTIME</span></figcaption></figure>
    <div className="opening-title-lockup" aria-label="From Transformer to Agent Systems"><span className="mono opening-from">FROM</span><div className="opening-title-line"><strong>TRANSFORMER</strong><span className="opening-bridge" aria-hidden="true"><i /><em>TO</em></span><strong>AGENT SYSTEMS</strong></div></div>
    <p className="opening-question">Transformer 기반 LLM의 예측은<br />어떻게 도구와 실행 환경을 거쳐 실제 작업으로 이어지는가?</p>
    <div className="opening-stages" aria-label="Architecture에서 Agent System까지의 개념 단계">
      <div className="opening-stage"><span className="mono">01 · ARCHITECTURE</span><strong>Transformer</strong><p>Attention 기반 모델 구조</p></div><div className="stage-connector" aria-hidden="true"><i /><span>학습</span></div>
      <div className="opening-stage"><span className="mono">02 · MODEL</span><strong>LLM</strong><p>확률적 Token 생성</p></div><div className="stage-connector" aria-hidden="true"><i /><span>실행 환경 결합</span></div>
      <div className="opening-stage is-system"><span className="mono">03 · SYSTEM</span><strong>Agent System</strong><p>LLM + Tool + Runtime + Permission</p></div>
    </div>
  </div>;
}

function Sparkline() {
  return <div className="incident-sparkline" aria-label="5xx 요청 비율 상승 그래프">{[12, 18, 13, 20, 17, 27, 34, 52, 71, 66, 82, 76].map((height, index) => <i key={index} style={{ "--h": `${height}%` } as CSSProperties} />)}</div>;
}

const TRACE_STEPS = [
  { icon: FileSearch, label: "READ LOG", sub: "stack trace" },
  { icon: Search, label: "SEARCH", sub: "UserMapper:42" },
  { icon: FlaskConical, label: "REPRODUCE", sub: "failing test" },
  { icon: Wrench, label: "PATCH", sub: "null handling" },
  { icon: Check, label: "VERIFY", sub: "test suite" },
];

function PrologueScene({ beat, animate }: { beat: number; animate: boolean }) {
  return <div className={`prologue-scene beat-${beat} ${animate ? "is-animating" : "is-complete"}`}>
    <section className="incident-card"><div className="incident-heading"><span className="mono">PRODUCTION · USER API</span><span className="incident-live"><i />LIVE</span></div><div className="incident-body"><div><span className="mono">GET /users/{`{id}`}</span><strong>500</strong><small>SOME USERS · AFTER DEPLOY</small></div><Sparkline /></div><div className="incident-evidence"><span>증상은 확인됨</span><span>원인은 아직 모름</span></div></section>
    <section className={`developer-request ${beat >= 1 ? "is-visible" : ""}`}><div className="request-avatar"><MessageSquareText /></div><div><span className="mono">DEVELOPER → CODING AGENT</span><p>오늘 배포 이후 일부 사용자 조회 요청이 500으로 실패해.<br />로그를 확인해서 원인을 찾고, 수정한 뒤 테스트해줘.</p><span className="request-attachment"><FileText /> production-error.log · provided context</span></div></section>
    <section className={`agent-trace ${beat >= 2 ? "is-visible" : ""}`} aria-label="Coding Agent의 조사와 수정 흐름"><div className="trace-heading"><span className="mono">LOCAL AGENT LOOP · PREVIEW</span><small>각 결과가 다음 판단의 Context로 돌아감</small></div><div className="trace-steps">{TRACE_STEPS.map(({ icon: Icon, label, sub }, index) => <div className={`trace-step ${beat >= 3 ? "is-done" : ""}`} style={{ "--i": index } as CSSProperties} key={label}><span><Icon /></span><strong>{label}</strong><small>{sub}</small>{index < TRACE_STEPS.length - 1 && <i className="trace-link" />}</div>)}</div></section>
    <div className={`verification-strip ${beat >= 3 ? "is-visible" : ""}`}><span><Check />REPRODUCED</span><span><Check />PATCHED</span><span><Check />VERIFIED LOCALLY</span><span className="is-pending"><Circle />PRODUCTION CONFIRMATION</span></div>
    <p className={`prologue-question ${beat >= 3 ? "is-visible" : ""}`}>다음 Token을 예측하는 Model이 어떻게 Repository를 바꿨을까?</p>
  </div>;
}

const DIRECT_ACTIONS = [
  { icon: FileText, label: "파일 열기" },
  { icon: TerminalSquare, label: "터미널 실행" },
  { icon: FlaskConical, label: "테스트 실행" },
];
const SYSTEM_PARTS = ["CONTEXT", "TOOLS", "RUNTIME", "PERMISSION", "FEEDBACK"];

function CoreQuestionScene({ beat, animate }: { beat: number; animate: boolean }) {
  return <div className={`core-question-scene beat-${beat} ${animate ? "is-animating" : "is-complete"}`}>
    <div className={`agent-system-frame ${beat >= 2 ? "is-visible" : ""}`}><span className="mono">AGENT SYSTEM</span><div className="system-parts">{SYSTEM_PARTS.map((part) => <i key={part}>{part}</i>)}</div></div>
    <section className="model-card"><span className="mono">TRANSFORMER-BASED LLM</span><strong>다음 출력을<br />예측한다</strong><div className="model-output"><span className="mono">MODEL OUTPUT</span><code>read_file 요청을<br />구조화해 생성</code></div></section>
    <div className="system-wall" aria-hidden="true"><span>SYSTEM BOUNDARY</span><i /></div>
    <section className="environment-card"><div className="environment-heading"><span className="mono">EXECUTION ENVIRONMENT</span><small>{beat >= 2 ? "Runtime이 연결하고 통제" : "Model의 직접 접근 없음"}</small></div><div className="direct-actions">{DIRECT_ACTIONS.map(({ icon: Icon, label }, index) => <div key={label} style={{ "--i": index } as CSSProperties}><Icon /><span>{label}</span>{beat >= 2 ? <ShieldCheck className="allowed" /> : <X />}</div>)}</div></section>
    <div className={`handoff-request ${beat >= 2 ? "is-visible" : ""}`}><code>{`{ name: "read_file", input: { path } }`}</code><ChevronRight /></div>
    <p className={`boundary-caption ${beat >= 1 ? "is-visible" : ""}`}>{beat >= 2 ? "Model의 요청을 Runtime이 검증하고 실행한다" : "좋은 문장을 만드는 것 ≠ 환경에서 행동하는 것"}</p>
  </div>;
}

function ProbabilityRow({ label, value, show, selected = false, animate = false }: { label: string; value: number; show: boolean; selected?: boolean; animate?: boolean }) {
  const rendered = useAnimatedNumber(value, show, animate);
  return <div className={`probability-row ${selected ? "is-selected" : ""}`}><div className="probability-label"><span>{label}</span><strong>{rendered}%</strong></div><div className="probability-track"><span style={{ "--target": show ? `${value}%` : "0%" } as CSSProperties} /></div><span className="selection-mark">{selected ? <Check /> : <Circle />}</span></div>;
}

function ClassificationLanguageScene({ beat, animate }: { beat: number; animate: boolean }) {
  const language = beat >= 2;
  const computed = beat >= 1;
  return <div className={`classification-language-scene beat-${beat} ${language ? "is-language" : "is-image"} ${animate ? "is-animating" : "is-complete"}`}>
    <div className="prediction-kind"><span className="mono">{language ? "LANGUAGE MODEL" : "IMAGE CLASSIFIER"}</span><strong>{language ? "다음 Token 후보" : "고정 Class 후보"}</strong></div>
    <div className="prediction-pipeline">
      <section className="prediction-input"><span className="mono scene-label">INPUT</span>{!language ? <figure><img src="./orca-classification.webp" alt="수면 위로 떠오른 범고래" /><figcaption>IMAGE · 1672 × 941</figcaption></figure> : <div className="language-context"><span className="mono">CURRENT CONTEXT</span><p>에이전트는<br />오류 로그를</p><div><i>에이전트</i><i>는</i><i>오류</i><i>로그를</i></div></div>}</section>
      <div className="prediction-path" aria-hidden="true"><i /><ChevronRight /></div>
      <section className="shared-model"><span className="mono scene-label">SCORE CANDIDATES</span><div className="model-layers">{[0, 1, 2, 3, 4].map((n) => <i key={n} style={{ "--i": n } as CSSProperties} />)}<strong>{language ? "LLM" : "CLASSIFIER"}</strong></div><small>{language ? "context-dependent scores" : "learned class scores"}</small></section>
      <div className="prediction-path" aria-hidden="true"><i /><ChevronRight /></div>
      <section className="candidate-board"><span className="mono scene-label">{language ? "TOKEN PROBABILITY" : "CLASS PROBABILITY"}</span>{!language ? <><ProbabilityRow label="ORCA" value={91} show={computed} selected={beat >= 1} animate={animate && beat === 1} /><ProbabilityRow label="DOLPHIN" value={6} show={computed} /><ProbabilityRow label="SHARK" value={3} show={computed} /></> : <><ProbabilityRow label="확인한다" value={46} show selected={beat >= 2} animate={animate && beat === 2} /><ProbabilityRow label="분석한다" value={31} show /><ProbabilityRow label="남긴다" value={13} show /></>}</section>
    </div>
    <div className={`shared-shape ${beat >= 3 ? "is-visible" : ""}`}><span>현재 입력</span><ChevronRight /><span>후보별 점수</span><ChevronRight /><span>분포</span><ChevronRight /><span>선택</span></div>
    <p className={`concept-caution ${beat >= 3 ? "is-visible" : ""}`}><LockKeyhole /> 같은 것은 <strong>예측 문제의 형태</strong>입니다. 입력·후보 공간·Architecture까지 같다는 뜻은 아닙니다.</p>
  </div>;
}

const TOKEN_CANDIDATES = [
  { label: "확인한다", value: 48 },
  { label: "분석한다", value: 27 },
  { label: "읽는다", value: 16 },
  { label: "남긴다", value: 9 },
];

function TokenCandidate({ candidate, index, distribution, selected, animate }: { candidate: { label: string; value: number }; index: number; distribution: boolean; selected: boolean; animate: boolean }) {
  const value = useAnimatedNumber(candidate.value, distribution, animate);
  return <div className={`token-candidate ${selected && index === 0 ? "is-selected" : ""}`}><span className="mono">{String(index + 1).padStart(2, "0")}</span><strong>{candidate.label}</strong><div><i style={{ "--target": distribution ? `${candidate.value}%` : "0%" } as CSSProperties} /></div><em>{value}%</em>{selected && index === 0 && <Check />}</div>;
}

function NextTokenScene({ beat, animate }: { beat: number; animate: boolean }) {
  const distribution = beat >= 1;
  const selected = beat >= 2;
  const loop = beat >= 3;
  return <div className={`next-token-scene beat-${beat} ${animate ? "is-animating" : "is-complete"}`}>
    <div className="token-context-panel"><div className="token-panel-heading"><span className="mono">CURRENT CONTEXT</span><small>읽기 쉬운 단위로 단순화</small></div><div className="token-sequence">{["에이전트", "는", "오류", "로그를"].map((token, index) => <span key={`${token}-${index}`}><i className="mono">{index + 241}</i>{token}</span>)}<span className={`chosen-token ${selected ? "is-visible" : ""}`}><i className="mono">?</i>확인한다</span><span className={`next-slot ${loop ? "is-visible" : ""}`}><i className="mono">NEXT</i>…</span></div><p className="tokenizer-note mono">READABLE WORD UNITS · ACTUAL TOKENIZATION VARIES BY TOKENIZER</p></div>
    <div className="token-compute-path" aria-hidden="true"><span>Transformer blocks</span><i /><ChevronRight /></div>
    <section className="vocabulary-panel"><div className="token-panel-heading"><span className="mono">NEXT OUTPUT DISTRIBUTION</span><small>화면에는 4개 후보만 표시</small></div><div className="candidate-list">{TOKEN_CANDIDATES.map((candidate, index) => <TokenCandidate candidate={candidate} index={index} distribution={distribution} selected={selected} animate={animate && beat === 1} key={candidate.label} />)}</div></section>
    <div className={`selection-transfer ${selected ? "is-visible" : ""}`} aria-hidden="true"><span>SELECT</span><ArrowLeft /></div>
    <div className={`autoregressive-loop ${loop ? "is-visible" : ""}`}><Play /><span><strong>APPEND TO CONTEXT</strong><small>늘어난 Context로 다음 분포를 다시 계산</small></span><RotateCcw /></div>
  </div>;
}

function AppendixScene() {
  return <figure className="appendix-scene"><div className="appendix-artwork"><img src="./agent-runtime-handoff-appendix.webp" alt="여러 출력 후보에서 선택된 Tool Request가 System Boundary를 지나 파일, 터미널, 검증 도구가 놓인 Local Agent Runtime으로 전달되는 기술 삽화" /></div><figcaption className="appendix-flow mono"><span>MODEL OUTPUT</span><i /><span>TOOL REQUEST</span><i /><span>SYSTEM BOUNDARY</span><i /><span>LOCAL RUNTIME</span></figcaption></figure>;
}

function SourceLinks({ sources }: { sources: SourceLink[] }) {
  if (!sources.length) return null;
  return <div className="source-links"><span className="mono">PRIMARY SOURCES</span>{sources.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>{source.label} ↗</a>)}</div>;
}

function AppendixArticle({ hidden }: { hidden: boolean }) {
  return <article className="article-copy-panel appendix-article" aria-label="부록 삽화 해설" aria-hidden={hidden}><span className="mono article-label">APPENDIX · VISUAL READING</span><p className="article-lead">LLM의 출력이 Agent Runtime에 전달되는 과정을 물리적인 작업대로 비유한 삽화입니다.</p><div className="appendix-reading-list">
    <section><span className="mono">01 · MODEL OUTPUT</span><p>왼쪽 상자 안의 종이와 가느다란 선은 Token으로 표현된 출력 후보와 각각의 경로를 뜻합니다. LLM의 직접 산출물은 이 경계 안에서 생성됩니다.</p></section>
    <section><span className="mono">02 · SELECTED PATH</span><p>여러 회색 경로 가운데 Green 경로 하나가 중앙으로 모입니다. 지금 Runtime에 전달할 구조화된 요청 하나가 선택됐다는 뜻입니다.</p></section>
    <section><span className="mono">03 · TOOL REQUEST</span><p>중앙의 카드는 <code>{`{ name: "read_file", input: { path } }`}</code> 같은 Tool Request입니다. 이것은 실행 결과가 아니라 실행해 달라는 구조화된 요청입니다.</p></section>
    <section><span className="mono">04 · SYSTEM BOUNDARY</span><p>두꺼운 벽은 Model과 Runtime의 경계입니다. Runtime은 요청 형식, 허용된 Tool, 경로, 권한, 승인 여부와 Timeout을 이 경계에서 확인합니다.</p></section>
    <section><span className="mono">05 · LOCAL AGENT RUNTIME</span><p>오른쪽의 파일함·모니터·체크리스트는 Repository 접근, Terminal 실행, Test와 결과 변환을 뜻합니다. 실제 실행 권한은 Model이 아닌 Runtime에 있습니다.</p></section>
  </div><aside>한 문장으로 읽으면 · LLM은 구조화된 Tool Request를 생성하고, 경계 밖의 Runtime이 이를 검증한 뒤 실제 도구를 실행합니다.</aside><SourceLinks sources={ARTICLE_COPY.appendix.sources} /></article>;
}

function SceneForPage({ pageIndex, beat, animate }: { pageIndex: number; beat: number; animate: boolean }) {
  switch (PAGES[pageIndex].id) {
    case "opening": return <OpeningScene animate={animate} />;
    case "prologue": return <PrologueScene beat={beat} animate={animate} />;
    case "core-question": return <CoreQuestionScene beat={beat} animate={animate} />;
    case "classification-language": return <ClassificationLanguageScene beat={beat} animate={animate} />;
    case "next-token": return <NextTokenScene beat={beat} animate={animate} />;
    case "appendix": return <AppendixScene />;
  }
}

function ModeToggle({ mode, onChange, onPrevious, onNext }: { mode: Mode; onChange: (mode: Mode) => void; onPrevious: () => void; onNext: () => void }) {
  return <Tabs value={mode} onValueChange={(value) => onChange(value as Mode)} className="mode-tabs"><TabsList aria-label="보기 방식" className="mode-toggle" onKeyDownCapture={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); if (event.key === "ArrowLeft") onPrevious(); else onNext(); } }}><TabsTrigger value="presentation">Presentation</TabsTrigger><TabsTrigger value="article">Article</TabsTrigger></TabsList></Tabs>;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("presentation");
  const [pageIndex, setPageIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressAnimationRef = useRef(false);
  const currentPage = PAGES[pageIndex];
  const totalBeats = useMemo(() => PAGES.reduce((sum, page) => sum + page.beats.length, 0), []);
  const completedBeats = PAGES.slice(0, pageIndex).reduce((sum, page) => sum + page.beats.length, 0) + beatIndex + 1;

  const writeUrl = (nextMode: Mode, nextPage: number, nextBeat: number, push: boolean) => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode); url.searchParams.set("page", PAGES[nextPage].id); url.searchParams.set("beat", String(nextBeat + 1)); url.hash = "";
    window.history[push ? "pushState" : "replaceState"]({}, "", url);
  };
  const commitState = (nextMode: Mode, nextPage: number, nextBeat: number, push = true, animate = true) => {
    suppressAnimationRef.current = !animate; setMode(nextMode); setPageIndex(nextPage); setBeatIndex(nextBeat); writeUrl(nextMode, nextPage, nextBeat, push);
  };

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    updateMotion(); motionQuery.addEventListener("change", updateMotion);
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const nextMode = params.get("mode") === "article" ? "article" : "presentation";
      const foundPage = PAGES.findIndex((page) => page.id === params.get("page"));
      const nextPage = foundPage >= 0 ? foundPage : 0;
      const parsedBeat = Number(params.get("beat") || "1") - 1;
      const nextBeat = Math.max(0, Math.min(PAGES[nextPage].beats.length - 1, parsedBeat));
      suppressAnimationRef.current = true; setMode(nextMode); setPageIndex(nextPage); setBeatIndex(nextBeat);
    };
    readUrl(); window.addEventListener("popstate", readUrl);
    return () => { motionQuery.removeEventListener("change", updateMotion); window.removeEventListener("popstate", readUrl); };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (mode === "article" || reducedMotion || suppressAnimationRef.current || currentPage.id === "appendix") { suppressAnimationRef.current = false; setIsAnimating(false); return; }
    setIsAnimating(true);
    const duration = currentPage.id === "opening" ? 1650 : currentPage.id === "prologue" ? 1350 : currentPage.id === "next-token" ? 1300 : 1150;
    timerRef.current = setTimeout(() => setIsAnimating(false), duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pageIndex, beatIndex, animationKey, reducedMotion, currentPage.id, mode]);

  const next = () => {
    if (isAnimating) { if (timerRef.current) clearTimeout(timerRef.current); setIsAnimating(false); return; }
    if (beatIndex < currentPage.beats.length - 1) return commitState(mode, pageIndex, beatIndex + 1);
    if (pageIndex < PAGES.length - 1) commitState(mode, pageIndex + 1, 0);
  };
  const previous = () => {
    if (isAnimating) { if (timerRef.current) clearTimeout(timerRef.current); setIsAnimating(false); return; }
    if (beatIndex > 0) return commitState(mode, pageIndex, beatIndex - 1, true, false);
    if (pageIndex > 0) commitState(mode, pageIndex - 1, PAGES[pageIndex - 1].beats.length - 1, true, false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.repeat) return; if (event.key === "ArrowRight") { event.preventDefault(); next(); } else if (event.key === "ArrowLeft") { event.preventDefault(); previous(); } };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  });

  const changeMode = (nextMode: Mode) => {
    if (nextMode === mode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAnimating(false); commitState(nextMode, pageIndex, beatIndex, true, false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const replay = () => { suppressAnimationRef.current = false; setAnimationKey((key) => key + 1); };
  const isAtStart = pageIndex === 0 && beatIndex === 0 && !isAnimating;
  const isAtEnd = pageIndex === PAGES.length - 1 && beatIndex === currentPage.beats.length - 1 && !isAnimating;

  return <main className={`site-shell mode-${mode}`}>
    <a className="skip-link" href="#main-content">본문으로 이동</a>
    <div className="brand-lockup" aria-label="프로젝트 이름"><span className="mono">WORK 03 · BUILD CANVAS</span><strong>TRANSFORMER → AGENT SYSTEMS</strong></div>
    <ModeToggle mode={mode} onChange={changeMode} onPrevious={previous} onNext={next} />
    <section className="experience-shell" id="main-content" aria-live="polite"><TemplateHeader page={currentPage} index={pageIndex} mode={mode} /><div className="experience-grid"><div className="visual-column"><div className={`experience-stage ${currentPage.id === "appendix" ? "appendix-stage" : ""}`} key={`${pageIndex}-${beatIndex}-${animationKey}`}><SceneForPage pageIndex={pageIndex} beat={beatIndex} animate={currentPage.id !== "appendix" && mode === "presentation" && isAnimating && !reducedMotion} /></div>{currentPage.id !== "appendix" && <div className="beat-caption" aria-hidden={mode === "article"}><span className="mono">BEAT {beatIndex + 1}</span><p>{currentPage.beats[beatIndex]}</p><Button variant="ghost" size="sm" onClick={replay} tabIndex={mode === "article" ? -1 : 0} aria-label="현재 Beat 다시 재생"><RotateCcw /> 다시 재생</Button></div>}</div>
      {currentPage.id === "appendix" ? <AppendixArticle hidden={mode === "presentation"} /> : <article className="article-copy-panel" aria-label="현재 장면 해설" aria-hidden={mode === "presentation"}><span className="mono article-label">ARTICLE NOTE · BEAT {beatIndex + 1}/{currentPage.beats.length}</span><p className="article-lead">{ARTICLE_COPY[currentPage.id].lead}</p><div className="article-beat-summary"><span className="mono">현재 장면</span><strong>{currentPage.beats[beatIndex]}</strong><p>{ARTICLE_BEAT_COPY[currentPage.id][beatIndex]}</p></div><aside>{ARTICLE_COPY[currentPage.id].note}</aside><SourceLinks sources={ARTICLE_COPY[currentPage.id].sources} />{currentPage.beats.length > 1 && <div className="article-beat-index" aria-label="Beat 진행 상태">{currentPage.beats.map((_, index) => <i className={index <= beatIndex ? "is-reached" : ""} key={index} />)}</div>}</article>}
    </div></section>
    <nav className="page-navigation" aria-label="Page와 Beat 이동"><div className="progress-copy"><span className="mono">PAGE {String(pageIndex + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}</span>{currentPage.beats.length > 1 && <span className="mono">BEAT {beatIndex + 1} / {currentPage.beats.length}</span>}</div><div className="progress-line" aria-label={`전체 진행도 ${completedBeats}/${totalBeats}`}><span style={{ width: `${(completedBeats / totalBeats) * 100}%` }} /></div><Button variant="ghost" size="icon-sm" onClick={previous} disabled={isAtStart} aria-label="이전 Beat 또는 Page"><ArrowLeft /></Button><Button variant="ghost" size="icon-sm" onClick={next} disabled={isAtEnd} aria-label="다음 Beat 또는 Page"><ArrowRight /></Button></nav>
  </main>;
}
