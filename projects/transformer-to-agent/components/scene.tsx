import type { ArticlePage } from "@/content/pages";

type SceneProps = { page: ArticlePage; phase: number };
const classFor = (phase: number) => "scene scene-" + phase;

function Label({ children }: { children: React.ReactNode }) {
  return <span className="scene-label">{children}</span>;
}

function BoundaryScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " boundary-scene"}>
    <section className="system-column model-column"><Label>MODEL</Label><strong>다음 Token<br />출력 생성</strong><code>read_file(path)</code><small>문장 · 코드 · 구조화된 요청</small></section>
    <section className="system-column runtime-column"><Label>RUNTIME</Label><strong>요청 검증<br />실행 통제</strong><small>Schema · Permission · Result</small></section>
    <section className="system-column environment-column"><Label>ENVIRONMENT</Label><strong>Repository<br />Terminal · Tests</strong><small>파일 · 명령어 · 브라우저 · API</small></section>
    <div className="system-boundary"><span>SYSTEM BOUNDARY</span></div>
    <p className="scene-caption">LLM의 출력 생성과, 실행 권한을 가진 시스템의 행동은 서로 다른 책임이다.</p>
  </div>;
}

function LearningScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " learning-scene"}>
    <figure><img src="./dog-classification.webp" alt="분류 입력으로 쓰이는 골든 리트리버 개" /><figcaption>INPUT IMAGE</figcaption></figure>
    <div className="learning-arrow">→</div>
    <section className="learning-model"><Label>PREDICTION</Label><div className="feature-grid">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div><small>입력을 처리해 클래스별 점수를 계산</small></section>
    <div className="learning-arrow">→</div>
    <section className="learning-result"><Label>COMPARE WITH TARGET</Label><div className="class-row"><span>CAT</span><b>{phase >= 2 ? "14%" : "0%"}</b></div><div className="class-row selected"><span>DOG</span><b>{phase >= 2 ? "86%" : "0%"}</b></div><p>정답: DOG</p><div className="loss">LOSS <strong>{phase >= 3 ? "0.14" : "—"}</strong></div><small>{phase >= 4 ? "Weight Update → 다음 예측의 오차를 줄이는 방향" : "예측과 정답의 차이를 계산"}</small></section>
  </div>;
}

function ProbabilityScene({ phase }: { phase: number }) {
  const bars = [["오류", 54], ["응답", 28], ["상태", 18]];
  return <div className={classFor(phase) + " probability-scene"}>
    <section className="context-box"><Label>CURRENT CONTEXT</Label><strong>서버가 요청을<br />처리하지 못해 500</strong><small>Token 단위의 입력</small></section>
    <div className="probability-arrow">→</div>
    <section className="logit-box"><Label>VOCABULARY · LOGIT</Label>{bars.map(([token, value], index) => <div className="prob-row" key={String(token)}><span>{token}</span><i style={{ "--probability": phase >= 2 ? value + "%" : "0%" } as React.CSSProperties} /><b>{phase >= 2 ? value + "%" : "0"}</b><small>logit {phase >= 1 ? [2.1, 1.3, 0.8][index] : "—"}</small></div>)}</section>
    <div className="probability-arrow">→</div>
    <section className="candidate-box"><Label>NEXT TOKEN</Label><strong>{phase >= 4 ? "오류" : "선택 대기"}</strong><small>{phase >= 3 ? "확률 분포에서 하나의 후보를 선택" : "Softmax로 Logit을 확률 분포로 변환"}</small></section>
  </div>;
}

function GenerationScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " generation-scene"}>
    <section className="generation-context"><Label>CONTEXT</Label><div className="token-line"><i>서버가</i><i>요청을</i><i>처리하지</i><i>못해</i><i>500</i>{phase >= 3 && <i className="added">오류</i>}</div><small>{phase >= 3 ? "선택된 Token이 실제 Context 뒤에 추가됨" : "현재 Context"}</small></section>
    <section className="generation-compute"><Label>NEXT TOKEN DISTRIBUTION</Label><div className="mini-probs"><span>오류 <i /></span><span>응답 <i /></span><span>상태 <i /></span></div><strong>{phase >= 2 ? "오류 선택" : "후보별 점수 계산"}</strong><small>Temperature와 Sampling 설정에 따라 후보를 선택할 수 있음</small></section>
    <div className="generation-return"><span>늘어난 Context</span><b>→</b><span>다음 Token 예측</span><b>→</b><span>문장 · 코드 생성</span></div>
  </div>;
}

function ContextScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " context-scene"}>
    <div className="code-pair"><section><Label>FAR DECLARATION</Label><code>const profile = user.profile;</code></section><section><Label>CURRENT USE</Label><code>return profile.displayName;</code></section></div>
    <div className="rnn-lane"><Label>SEQUENTIAL STATE</Label><div>{Array.from({ length: 7 }, (_, i) => <i className={i === 0 || i === 6 ? "important" : ""} key={i}>{i === 0 ? "profile" : i === 6 ? "displayName" : "…"}</i>)}</div><small>순차 상태를 전달하면 멀리 떨어진 정보의 영향이 약해질 수 있다.</small></div>
    <div className="direct-relation"><span>직접 관계 계산</span><b className={phase >= 3 ? "shown" : ""}>profile → displayName</b><small>Transformer가 필요한 문제</small></div>
  </div>;
}

function AttentionScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " attention-scene"}>
    <div className="attention-input"><Label>INPUT TOKENS</Label><div className="attention-tokens"><i>user</i><i>.</i><i className="relevant">profile</i><i>.</i><i className="focus">displayName</i></div><small>현재 해석 대상: displayName</small></div>
    <div className="qkv-grid"><section className={phase >= 1 ? "active" : ""}><Label>QUERY</Label><strong>무엇을 찾는가</strong><small>displayName의 Query</small></section><section className={phase >= 2 ? "active" : ""}><Label>KEY</Label><strong>어디와 연결되는가</strong><small>profile의 Key</small></section><section className={phase >= 3 ? "active" : ""}><Label>VALUE</Label><strong>어떤 정보를 반영하는가</strong><small>profile의 Value</small></section></div>
    <div className="attention-result"><Label>UPDATED REPRESENTATION</Label><strong>{phase >= 4 ? "profile 정보를 반영한 displayName" : "관련도에 따라 Value를 가중합"}</strong></div>
  </div>;
}

function TransformerScene({ phase }: { phase: number }) {
  const words = ["서버", "가", "500", "오류", "를"];
  return <div className={classFor(phase) + " transformer-scene"}>
    <section className="parallel-row"><Label>PARALLEL TOKEN POSITIONS</Label><div>{words.map((word, index) => <i className={index === 3 ? "current" : ""} key={word}>{word}<small>position {index + 1}</small></i>)}</div></section>
    <section className="decoder-lane"><Label>DECODER-ONLY LANGUAGE MODEL</Label><div className="mask-grid">{words.map((word, row) => <div key={word}>{words.map((_, column) => <i className={column > row ? "masked" : column === row && phase >= 3 ? "available current" : "available"} key={column}>{column > row ? "×" : "•"}</i>)}</div>)}</div><small>Causal Mask: 현재 위치는 뒤에 있는 정답 Token을 미리 보지 못한다.</small></section>
    <p>2017년의 Encoder–Decoder Transformer와 달리, GPT 계열은 주로 Decoder 중심의 자기회귀 구조를 사용한다.</p>
  </div>;
}

function ScaleScene({ phase }: { phase: number }) {
  const items = [["Pretraining Scale", "Parameter · Data · Training Compute"], ["언어 작업 확장", "요약 · 번역 · 질의응답 · 코드"], ["Post-training", "지시 준수와 응답 형식"], ["추론 시점 계산", "응답 전 더 많은 계산"]];
  return <div className={classFor(phase) + " scale-scene"}>{items.map(([title, detail], index) => <section className={phase >= index + 1 ? "active" : ""} key={title}><span>{String(index + 1).padStart(2, "0")}</span><Label>{title}</Label><strong>{detail}</strong><small>{index === 3 ? "직접 출력은 여전히 Token" : "사용 범위를 넓히는 변화"}</small></section>)}</div>;
}

function RuntimeScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " runtime-scene"}>
    <section className="runtime-model"><Label>MODEL</Label><strong>코드와 명령어를<br />텍스트로 생성</strong><code>{'{ tool: "read_file" }'}</code></section>
    <div className="runtime-boundary"><span>SYSTEM BOUNDARY</span></div>
    <section className={phase >= 2 ? "runtime-step active" : "runtime-step"}><Label>RUNTIME</Label><strong>등록 · 형식 · 권한 확인</strong><small>통과한 요청만 실행</small></section>
    <section className={phase >= 3 ? "runtime-step active" : "runtime-step"}><Label>ENVIRONMENT</Label><strong>File · Shell · Browser · API</strong><small>{phase >= 4 ? "실행 결과를 Runtime에 반환" : "Model의 직접 접근 없음"}</small></section>
  </div>;
}

function ToolScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " tool-scene"}>
    <section className="schema-card"><Label>TOOL SCHEMA IN CONTEXT</Label><code>read_file(path: string)</code><small>이름 · 기능 · 입력 형식</small></section>
    <section className="json-card"><Label>MODEL OUTPUT</Label><pre>{'{\n  "tool": "read_file",\n  "arguments": {\n    "path": "src/UserService.java"\n  }\n}'}</pre><div className="json-status"><span className={phase >= 3 ? "visible" : ""}>GENERATED</span><span>{phase >= 4 ? "NOT EXECUTED" : "Runtime에 전달 전"}</span></div></section>
    <section className="plain-card"><Label>GENERAL TEXT</Label><p>“관련 파일을 확인하겠습니다.”</p><small>일반 문장과 구조화된 실행 요청은 구분된다.</small></section>
  </div>;
}

function ExecutionScene({ phase }: { phase: number }) {
  const items = [["Tool Call", "read_file"], ["Schema Validation", "path: string"], ["Permission", "workspace read"], ["Execute", "open file"], ["Result", "content | error"]];
  return <div className={classFor(phase) + " execution-scene"}>{items.map(([title, detail], index) => <section className={phase === index + 1 || phase >= 4 && index === 4 ? "active" : ""} key={title}><b>{String(index + 1).padStart(2, "0")}</b><Label>{title}</Label><strong>{detail}</strong>{index === 2 && <small>승인이 거부되면 실행하지 않는다.</small>}</section>)}</div>;
}

function ResultScene({ phase }: { phase: number }) {
  return <div className={classFor(phase) + " result-scene"}>
    <section className="context-stack"><Label>UPDATED CONTEXT</Label><i>user: 오류 원인을 확인해줘</i><i>assistant: read_file(...)</i><i className={phase >= 3 ? "new" : ""}>tool_result: NullPointerException at line 42</i></section>
    <section className="result-runtime"><Label>RUNTIME</Label><strong>Environment 결과를<br />Context 항목으로 변환</strong><small>Model 출력으로 되돌리는 것이 아님</small></section>
    <section className="next-call"><Label>NEXT MODEL CALL</Label><strong>{phase >= 4 ? "search_code(\"UserMapper\")" : "갱신된 Context 전체를 입력"}</strong><small>실패 결과도 다음 선택의 근거가 된다.</small></section>
  </div>;
}

function LoopScene({ phase }: { phase: number }) {
  const items = ["Goal + Context", "Model", "Tool Call", "Runtime", "Tool Result", "Updated Context", "Complete"];
  return <div className={classFor(phase) + " loop-scene"}><div className="loop-track">{items.map((item, index) => <section className={phase === index + 1 || phase >= 4 && index === 6 ? "active" : ""} key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></section>)}</div><p>의미 있는 한두 번의 왕복 뒤, 완료 조건·비용·반복 횟수를 확인하고 멈춘다.</p></div>;
}

function HarnessScene({ phase }: { phase: number }) {
  const items = ["Repository", "Search", "File Tools", "Shell", "Tests", "Context Manager", "Permissions", "Sandbox", "Validation"];
  return <div className={classFor(phase) + " harness-scene"}><section className="harness-model"><Label>MODEL</Label><strong>다음 요청 선택</strong></section><div className="harness-parts">{items.map((item, index) => <i className={phase >= 3 && index === 8 ? "active" : ""} key={item}>{item}</i>)}</div><p>Model 하나가 Agent가 되는 것이 아니라, 개발 작업용 Harness가 도구·Context·권한·검증을 결합한다.</p></div>;
}

function IncidentScene({ phase }: { phase: number }) {
  const steps = ["READ LOG", "SEARCH CODE", "REPRODUCE", "PATCH", "TEST", "VERIFY"];
  return <div className={classFor(phase) + " incident-scene"}><section className="incident-log"><Label>production-error.log</Label><code>NullPointerException<br />UserMapper.toResponse:42</code><small>sanitized log · local repository only</small></section><div className="incident-steps">{steps.map((step, index) => <section className={phase >= 3 && index >= 3 ? "active" : index === phase ? "active" : ""} key={step}><Label>{step}</Label><strong>{index === 0 ? "Stack Trace" : index === 1 ? "UserMapper" : index === 2 ? "failing test" : index === 3 ? "null guard" : index === 4 ? "test suite" : "local result"}</strong><small>{index < 3 ? "Model 선택 → Runtime 실행" : "검증 가능한 작업 상태"}</small></section>)}</div><div className="incident-status"><span>REPRODUCED</span><span>PATCHED</span><span>VERIFIED LOCALLY</span><span>PRODUCTION CONFIRMATION PENDING</span></div></div>;
}

export function Scene({ page, phase }: SceneProps) {
  switch (page.scene) {
    case "boundary": return <BoundaryScene phase={phase} />;
    case "learning": return <LearningScene phase={phase} />;
    case "probability": return <ProbabilityScene phase={phase} />;
    case "generation": return <GenerationScene phase={phase} />;
    case "context": return <ContextScene phase={phase} />;
    case "attention": return <AttentionScene phase={phase} />;
    case "transformer": return <TransformerScene phase={phase} />;
    case "scale": return <ScaleScene phase={phase} />;
    case "runtime": return <RuntimeScene phase={phase} />;
    case "tool": return <ToolScene phase={phase} />;
    case "execution": return <ExecutionScene phase={phase} />;
    case "result": return <ResultScene phase={phase} />;
    case "loop": return <LoopScene phase={phase} />;
    case "harness": return <HarnessScene phase={phase} />;
    case "incident": return <IncidentScene phase={phase} />;
  }
}
