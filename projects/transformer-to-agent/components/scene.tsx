"use client";

import { useEffect, useState } from "react";
import { AgentArtwork } from "@/components/artwork";
import { scenes } from "@/content/pages";

type SceneProps = {
  sceneId: string;
  motionPaused: boolean;
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function ActLead({ sceneId }: { sceneId: string }) {
  const scene = scenes.find((candidate) => candidate.id === sceneId);
  if (!scene?.act || !scene.actTitle || !scene.actQuestion) return null;

  return (
    <div className="act-lead">
      <span>ACT {scene.act}</span>
      <strong>{scene.actTitle}</strong>
      <p>{scene.actQuestion}</p>
    </div>
  );
}

function JavaCode({ patched = false, corrected = false }: { patched?: boolean; corrected?: boolean }) {
  return (
    <pre className="java-code" aria-label={corrected ? "수정 완료 코드" : patched ? "첫 번째 수정 코드" : "문제가 있는 Java 코드"}>
      <code>
        <span><i>39</i><b>public UserResponse</b> toResponse(User user) {'{'}</span>
        {patched ? <span><i>40</i>  UserProfile profile = user.getProfile();</span> : <span><i>40</i>  return new UserResponse(</span>}
        {patched && <span><i>41</i> </span>}
        {patched && <span><i>42</i>  return new UserResponse(</span>}
        <span><i>{patched ? "43" : "41"}</i>    user.getId(),</span>
        {patched ? (
          <>
            <span className={corrected ? "code-success" : "code-risk"}><i>44</i>    profile != null</span>
            <span className={corrected ? "code-success" : "code-risk"}><i>45</i>      ? profile.getDisplayName()</span>
            <span className={corrected ? "code-success" : "code-risk"}><i>46</i>      : {corrected ? '"Unknown"' : "null"}</span>
          </>
        ) : (
          <span className="code-error"><i>42</i>    user.getProfile().getDisplayName()</span>
        )}
        <span><i>{patched ? "47" : "43"}</i>  );</span>
        <span><i>{patched ? "48" : "44"}</i>{'}'}</span>
      </code>
    </pre>
  );
}

const incidentSteps = ["READ LOG", "SEARCH CODE", "READ FILE", "TRACE", "PATCH", "TEST", "VERIFY"];

// Observable workflow only — Tool Request, Tool Result and workspace state.
// Never hidden reasoning. See the observable-state rule in the Work 3 specification.
const observableWorkflow: { step: string; request: string; result: string }[] = [
  { step: "READ LOG", request: "NPE LOG → CONTEXT", result: "UserMapper.java : 42" },
  { step: "SEARCH CODE", request: "search_code(\"UserMapper\")", result: "2 file candidates" },
  { step: "READ FILE", request: "read_file(\".../UserMapper.java\")", result: "line 42 in context" },
  { step: "TRACE", request: "UPDATED CONTEXT", result: "log + file + test 계약" },
  { step: "PATCH", request: "apply_patch(\"UserMapper.java\")", result: "workspace changed" },
  { step: "TEST", request: "run_tests(\"UserMapperTest\")", result: "FAILED · expected \"Unknown\"" },
  { step: "VERIFY", request: "—", result: "아직 충족되지 않음" },
];

function IncidentWorkspace({ mode = "mystery" }: { mode?: "mystery" | "follow" | "decoded" }) {
  return (
    <div className={`incident-workspace incident-mode-${mode}`}>
      {mode === "mystery" ? (
        <div className="incident-narrative">
          <strong>운영 서버에서 NullPointerException이 발생했다.</strong>
          <div>
            <Eyebrow>USER REQUEST</Eyebrow>
            <p>원인을 확인하고 수정한 뒤 테스트까지 검증해줘.</p>
          </div>
        </div>
      ) : null}
      <div className="stack-focus">
        <Eyebrow>PRODUCTION LOG</Eyebrow>
        <strong>NullPointerException</strong>
        <span>UserMapper.java : 42</span>
      </div>
      <div className="incident-code"><JavaCode /></div>
      <div className="incident-trace" aria-label="NPE 처리 과정">
        {incidentSteps.map((step, index) => (
          <div className="incident-trace-step" style={{ "--step": index } as React.CSSProperties} key={step}>
            <i><b /></i>
            <span>{step}</span>
            {mode === "decoded" && (
              <small>
                {[
                  "TOOL RESULT → CONTEXT",
                  "MODEL CALL → TOOL REQUEST",
                  "EXECUTION → TOOL RESULT",
                  "UPDATED CONTEXT",
                  "MODEL OUTPUT → WORKSPACE",
                  "TEST FAILED → CONTEXT → RETRY",
                  "VALIDATION → COMPLETE",
                ][index]}
              </small>
            )}
            {mode === "decoded" && step === "TEST" && (
              <em className="retry-arc" aria-label="테스트 실패 결과가 다시 PATCH 단계로 돌아간다" />
            )}
          </div>
        ))}
      </div>
      {mode === "mystery" && <p className="incident-question">그런데 이 모든 행동을 실제로 하는 것은 무엇일까?</p>}
      {mode === "follow" && (
        <div className="observable-log">
          <Eyebrow>OBSERVABLE WORKFLOW STATE</Eyebrow>
          <ol>
            {observableWorkflow.map((entry, index) => (
              <li
                className={index === observableWorkflow.length - 1 ? "observable-pending" : undefined}
                style={{ "--step": index } as React.CSSProperties}
                key={entry.step}
              >
                <b>{entry.step}</b>
                <code>{entry.request}</code>
                <span>{entry.result}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function IntroScene() {
  return (
    <section className="scene scene-intro">
      <AgentArtwork />
      <div className="intro-copy">
        <Eyebrow>WORK 03 · BUILD CANVAS</Eyebrow>
        <h1>LLM <span>to</span><br />AGENT</h1>
        <p className="intro-subtitle"><span>다음 Token 예측에서</span><span>AGENT가 되기까지</span></p>
      </div>
    </section>
  );
}

function IncidentScene() {
  return (
    <section className="scene scene-incident">
      <ActLead sceneId="incident" />
      <IncidentWorkspace />
    </section>
  );
}

function StripScene() {
  return (
    <section className="scene scene-strip">
      <div className="strip-remnants" aria-hidden="true">
        <span>REPOSITORY</span><span>PATCH</span><span>TEST</span><span>TOOLS</span>
      </div>
      <div className="strip-pipeline" aria-label="현재 입력에서 다음 Token 예측까지의 흐름">
        <div className="strip-input">
          <Eyebrow>CURRENT INPUT / CONTEXT</Eyebrow>
          <code>java.lang.NullPointer</code>
        </div>
        <div className="strip-arrow" aria-hidden="true"><i /><span>→</span></div>
        <div className="strip-model">
          <Eyebrow>LANGUAGE MODEL</Eyebrow>
          <strong>LLM</strong>
        </div>
        <div className="strip-arrow" aria-hidden="true"><i /><span>→</span></div>
        <div className="strip-next">
          <Eyebrow>NEXT TOKEN</Eyebrow>
          <code>Exception</code>
        </div>
      </div>
      <div className="strip-statement">
        <h2>THE MODEL PREDICTS<br /><em>THE NEXT TOKEN.</em></h2>
        <p>LLM은 현재 입력을 바탕으로 다음 Token을 예측한다.</p>
      </div>
    </section>
  );
}

function NextTokenScene() {
  const candidates = [
    ["Exception", "72%", 72],
    ["Error", "17%", 17],
    ["Reference", "11%", 11],
  ] as const;
  return (
    <section className="scene scene-next-token">
      <header>
        <Eyebrow>NEXT TOKEN · ILLUSTRATIVE VALUES</Eyebrow>
        <h2>다음 Token의 가능성을 계산한다.</h2>
      </header>
      <div className="token-prompt">java.lang.NullPointer <span>___</span></div>
      <div className="prediction-outcome">
        <div className="candidate-distribution" aria-label="다음 Token 후보별 예시 가능성">
          <div className="candidate-columns" aria-hidden="true"><span>TOKEN</span><span>CANDIDATE SCORE</span><span>VALUE</span></div>
          {candidates.map(([token, value, width], index) => (
            <div className={index === 0 ? "candidate candidate-primary" : "candidate"} key={token}>
              <strong>{token}</strong>
              <i><b style={{ width: `${width}%` }} /></i>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <div className="decoding-result">
          <Eyebrow>DECODING RESULT</Eyebrow>
          <span>NEXT TOKEN</span>
          <i aria-hidden="true">→</i>
          <strong>Exception</strong>
        </div>
      </div>
    </section>
  );
}

function GenerationScene() {
  return (
    <section className="scene scene-generation">
      <div className="generation-title">
        <Eyebrow>AUTOREGRESSIVE GENERATION</Eyebrow>
        <h2>하나가 결정되면,<br />다시 다음을 예측한다.</h2>
      </div>
      <div className="generation-lane">
        <div className="generation-decision"><Eyebrow>DECIDED NEXT TOKEN</Eyebrow><strong>Exception</strong><i>↓</i></div>
        <Eyebrow>CURRENT SEQUENCE</Eyebrow>
        <div className="generation-sequence">
          <span className="generation-base">java.lang.NullPointer</span>
          <span className="generation-appended">Exception</span>
          <span className="generation-next-state"><b>NEXT</b> ___</span>
        </div>
        <div className="generation-cycle">
          {["PREDICT", "APPEND", "PREDICT", "APPEND"].map((step, index) => (
            <span style={{ "--cycle-index": index } as React.CSSProperties} key={`${step}-${index}`}>{step}</span>
          ))}
        </div>
      </div>
      <p className="generation-summary">결정된 Token이 늘어난 sequence의 일부가 되고, 다음 예측의 조건이 된다.</p>
    </section>
  );
}

function ModelInputScene() {
  const context = ["SYSTEM", "USER REQUEST", "NPE LOG", "CODE", "TOOL RESULT"];
  return (
    <section className="scene scene-model-input">
      <ActLead sceneId="model-input" />
      <div className="context-stream">
        <Eyebrow>CURRENT MODEL CALL</Eyebrow>
        {context.map((item, index) => <span style={{ "--context-index": index } as React.CSSProperties} key={item}>{item}</span>)}
        <i className="context-flow" />
      </div>
      <div className="context-to-model">→</div>
      <div className="model-core"><Eyebrow>INFERENCE</Eyebrow><strong>MODEL</strong><p>지금 보이는 정보로<br />다음 출력을 계산</p></div>
      <div className="model-input-message">
        <strong>CONTEXT</strong>
        <p>현재 Model Call에서<br />LLM에게 실제로 보이는 정보</p>
      </div>
    </section>
  );
}

function AttentionScene() {
  return (
    <section className="scene scene-attention">
      <header>
        <Eyebrow>SELF-ATTENTION · CONCEPTUAL VIEW</Eyebrow>
        <h2><span>멀리 떨어진 코드도</span><span>관계를 계산할 수 있다.</span></h2>
      </header>
      <div className="attention-code">
        <pre><code>
          <span><i>39</i>public UserResponse toResponse(User user) {'{'}</span>
          <span className="attention-source"><i>40</i>  UserProfile <b>profile</b> = user.getProfile();</span>
          <span><i>41</i></span>
          <span><i>42</i>{"  // ..."}</span>
          <span><i>43</i>{"  // spatial distance"}</span>
          <span><i>44</i></span>
          <span><i>45</i>  return new UserResponse(</span>
          <span><i>46</i>    user.getId(),</span>
          <span className="attention-target"><i>47</i>    <b>profile</b>.getDisplayName()</span>
          <span><i>48</i>  );</span>
          <span><i>49</i>{'}'}</span>
        </code></pre>
        <div className="attention-relation"><i /></div>
      </div>
    </section>
  );
}

function RepositoryContextScene() {
  const files = ["src/", "main/", "UserController.java", "UserService.java", "UserMapper.java", "User.java", "test/", "UserMapperTest.java", "build.gradle", "README.md"];
  return (
    <section className="scene scene-repository-context">
      <div className="repository-space">
        <header><Eyebrow>REPOSITORY</Eyebrow><strong>2,418 files</strong></header>
        <div className="repository-tree">
          {files.map((file, index) => <span className={file.includes("UserMapper") ? "selected-file" : ""} style={{ "--file-index": index } as React.CSSProperties} key={file}>{file}</span>)}
        </div>
      </div>
      <div className="selection-bridge"><strong>일부만 선택</strong><i>→</i><i>→</i></div>
      <div className="model-context-space">
        <header><Eyebrow>MODEL CONTEXT</Eyebrow><strong>현재 필요한 일부</strong></header>
        <div className="context-items"><span>NPE LOG</span><span>USER REQUEST</span><span className="context-selected">UserMapper.java</span><span className="context-selected delayed">UserMapperTest.java</span></div>
      </div>
      <h2>EXISTS <em>≠</em> IN CONTEXT</h2>
    </section>
  );
}

function BoundaryScene() {
  return (
    <section className="scene scene-boundary">
      <ActLead sceneId="boundary" />
      <div className="boundary-side boundary-model"><Eyebrow>MODEL</Eyebrow><strong>다음 행동을<br />요청하는 출력</strong></div>
      <div className="boundary-wall"><span>SYSTEM BOUNDARY</span></div>
      <div className="boundary-side boundary-environment"><Eyebrow>REPOSITORY / ENVIRONMENT</Eyebrow><strong>UserMapper.java</strong><span>아직 읽히지 않음</span></div>
      <code className="boundary-request">read_file(&quot;src/UserMapper.java&quot;)</code>
      <h2>REQUESTED <em>≠</em> EXECUTED</h2>
    </section>
  );
}

function ExecutionLayerScene() {
  const stages = ["REQUEST", "VALIDATE", "PERMISSION", "EXECUTE"];
  return (
    <section className="scene scene-execution-layer">
      <div className="execution-model"><Eyebrow>MODEL REQUEST</Eyebrow><code>read_file(<br />&quot;src/UserMapper.java&quot;)</code></div>
      <div className="execution-boundary"><span>BOUNDARY</span></div>
      <div className="execution-path">
        <Eyebrow>EXECUTION LAYER · RESPONSIBILITY</Eyebrow>
        {stages.map((stage, index) => (
          <span className="execution-stage-cell" style={{ "--execution-index": index } as React.CSSProperties} key={stage}>
            {stage}
          </span>
        ))}
        <i className="execution-signal" />
      </div>
      <div className="execution-environment"><Eyebrow>ENVIRONMENT</Eyebrow><div className="file-open"><span>UserMapper.java</span><b>OPEN / READ</b></div></div>
      <p><strong>시스템이 요청을 실제 행동으로 연결한다.</strong><span>검증 · 권한 · 실행은 Model 밖의 책임이다.</span></p>
    </section>
  );
}

function RequestsExecutesScene() {
  return (
    <section className="scene scene-requests-executes">
      <div className="statement-half statement-model"><span>MODEL</span><strong>REQUESTS</strong></div>
      <div className="statement-divider" aria-label="System boundary"><i /></div>
      <div className="statement-half statement-system"><span>SYSTEM</span><strong>EXECUTES</strong></div>
      <p>Model은 행동을 요청하고, 실행 가능한 시스템이 실제 Environment의 행동으로 연결한다.</p>
    </section>
  );
}

function ResultReturnsScene() {
  return (
    <section className="scene scene-result-returns">
      <ActLead sceneId="result-returns" />
      <div className="result-context"><Eyebrow>UPDATED CONTEXT</Eyebrow><span>USER REQUEST</span><span>MODEL TOOL REQUEST</span><span className="returned-context">TOOL RESULT · UserMapper.java</span></div>
      <div className="result-execution"><Eyebrow>EXECUTION</Eyebrow><strong>결과를 현재<br />workflow로 반환</strong></div>
      <div className="result-environment"><Eyebrow>ENVIRONMENT</Eyebrow><strong>UserMapper.java</strong><code>profile.getDisplayName()</code></div>
      <div className="return-path"><i /><span>RESULT → CONTEXT</span></div>
      <h2>결과가 돌아오면,<br /><em>Context가 달라진다.</em></h2>
    </section>
  );
}

function AgentLoopScene() {
  return (
    <section className="scene scene-agent-loop">
      <div className="loop-goal"><Eyebrow>GOAL</Eyebrow><span>NPE 원인을 확인하고 수정해줘.</span></div>
      <div className="loop-node loop-model"><Eyebrow>01</Eyebrow><strong>MODEL</strong><code>search_code(&quot;UserMapper&quot;)</code></div>
      <div className="loop-node loop-execution"><Eyebrow>02</Eyebrow><strong>TOOL REQUEST<br />/ EXECUTION</strong><span>Repository search</span></div>
      <div className="loop-node loop-result"><Eyebrow>03</Eyebrow><strong>TOOL RESULT</strong><span>2 file candidates</span></div>
      <div className="loop-node loop-context"><Eyebrow>04</Eyebrow><strong>UPDATED CONTEXT</strong><span>다음 Model Call 준비</span></div>
      <div className="loop-border" aria-hidden="true"><i className="loop-pulse" /></div>
      <div className="loop-center"><span>RESULT</span><i>↺</i><span>NEXT CALL</span></div>
    </section>
  );
}

function FollowNpeScene() {
  return <section className="scene scene-follow-npe"><IncidentWorkspace mode="follow" /></section>;
}

function FailureContextScene() {
  const [state, setState] = useState<"fail" | "pass">("fail");
  return (
    <section className={`scene scene-failure scene-failure-${state}`}>
      <div className="state-control" aria-label="Test result state">
        <button aria-pressed={state === "fail"} onClick={() => setState("fail")}>FAIL</button>
        <button aria-pressed={state === "pass"} onClick={() => setState("pass")}>PASS</button>
      </div>
      <div className="failure-patch"><Eyebrow>CURRENT PATCH</Eyebrow><JavaCode patched corrected={state === "pass"} /></div>
      {state === "fail" ? (
        <div className="test-result test-failed"><Eyebrow>UserMapperTest</Eyebrow><strong>FAILED</strong><p>expected: <b>&quot;Unknown&quot;</b><br />actual: <b>null</b></p></div>
      ) : (
        <div className="test-result test-passed"><Eyebrow>UserMapperTest</Eyebrow><strong>TEST PASS</strong><p>VERIFY<br />COMPLETE</p></div>
      )}
      <div className="failure-next">
        <Eyebrow>{state === "fail" ? "UPDATED CONTEXT → NEXT ACTION" : "VALIDATION → EXIT"}</Eyebrow>
        <strong>{state === "fail" ? "READ TEST → PATCH → TEST" : "TEST PASS → VERIFY → COMPLETE"}</strong>
        <p>{state === "fail" ? "실패 결과도 다음 판단을 위한 정보다." : "실제 결과가 종료 조건을 충족했다."}</p>
      </div>
    </section>
  );
}

function StopScene() {
  return (
    <section className="scene scene-stop">
      <header><Eyebrow>TERMINATION CONDITION</Eyebrow><h2>반복의 목적은<br />끝없이 반복하는 것이 아니다.</h2></header>
      <div className="stop-loop"><span>PATCH</span><i>→</i><span>TEST</span><i>↺</i></div>
      <div className="stop-exit"><span>TEST PASS</span><i>→</i><span>VERIFY</span><i>→</i><strong>TASK COMPLETE</strong></div>
    </section>
  );
}

function BuildAgentScene() {
  return (
    <section className="scene scene-build-agent">
      <ActLead sceneId="build-agent" />
      <div className="agent-region agent-context"><Eyebrow>CONTEXT</Eyebrow><strong>현재 무엇을 보는가</strong><span>GOAL · CODE · RESULTS</span></div>
      <div className="agent-region agent-tools"><Eyebrow>REPOSITORY / TOOLS</Eyebrow><strong>무엇을 할 수 있는가</strong><span>SEARCH · READ · EDIT · TEST</span></div>
      <div className="agent-region agent-execution"><Eyebrow>EXECUTION</Eyebrow><strong>요청을 실제 행동으로</strong><span>REQUEST → RESULT</span></div>
      <div className="agent-region agent-control"><Eyebrow>CONTROL</Eyebrow><strong>어디까지, 어떻게 검증하는가</strong><span>PERMISSION · SANDBOX · VALIDATION</span></div>
      <div className="agent-center"><Eyebrow>CORE</Eyebrow><strong>MODEL</strong><code>read_file()</code></div>
      <p>Tool Calling만으로 Coding Agent 전체를 설명할 수는 없다.</p>
    </section>
  );
}

function DifferentAgentScene({ motionPaused }: { motionPaused: boolean }) {
  const [state, setState] = useState<"minimal" | "full">("full");
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (motionPaused || manual) return;
    const timer = window.setInterval(() => setState((current) => current === "minimal" ? "full" : "minimal"), 5200);
    return () => window.clearInterval(timer);
  }, [motionPaused, manual]);

  const choose = (value: "minimal" | "full") => {
    setManual(true);
    setState(value);
  };

  return (
    <section className={`scene scene-different-agent compare-${state}`}>
      <div className="state-control compare-control" aria-label="Agent environment comparison">
        <button aria-pressed={state === "minimal"} onClick={() => choose("minimal")}>MINIMAL</button>
        <button aria-pressed={state === "full"} onClick={() => choose("full")}>FULL</button>
      </div>
      <div className="shared-model"><Eyebrow>SAME UNDERLYING MODEL</Eyebrow><strong>MODEL</strong></div>
      <div className="agent-comparison comparison-a">
        <Eyebrow>A · MINIMAL SYSTEM</Eyebrow>
        <h3>NPE LOG</h3>
        <div><span>few tools</span><span>weak context</span><span>no validation</span></div>
        <strong>PATCH GENERATED</strong>
      </div>
      <div className="agent-comparison comparison-b">
        <Eyebrow>B · TASK-EQUIPPED SYSTEM</Eyebrow>
        <h3>TARGETED CONTEXT</h3>
        <div><span>search / read / edit</span><span>scoped permission</span><span>tests + validation</span></div>
        <strong>PATCH VERIFIED</strong>
      </div>
      <p>같은 Model도 Context · Tools · Validation에 따라 결과가 달라진다.</p>
    </section>
  );
}

function DeveloperQuestionsScene() {
  const questions = [
    ["01", "WHAT DOES IT SEE?", "무엇을 Context로 보고 있는가?"],
    ["02", "WHAT CAN IT DO?", "어떤 Tool을 사용할 수 있는가?"],
    ["03", "WHAT IS IT ALLOWED TO DO?", "어디까지 실행할 수 있는가?"],
    ["04", "HOW IS IT VERIFIED?", "결과를 어떻게 검증하는가?"],
  ];
  return (
    <section className="scene scene-developer-questions">
      {questions.map(([number, question, copy]) => <div className="developer-question" key={number}><span>{number}</span><strong>{question}</strong><p>{copy}</p></div>)}
    </section>
  );
}

function IncidentReturnScene() {
  return <section className="scene scene-incident-return"><IncidentWorkspace mode="decoded" /></section>;
}

function SynthesisScene() {
  const regions = ["CONTEXT", "TOOLS", "EXECUTION", "CONTROL", "VALIDATION", "LOOP"];
  return (
    <section className="scene scene-synthesis">
      <div className="synthesis-system">
        <div className="synthesis-model"><Eyebrow>CORE</Eyebrow><strong>LLM</strong></div>
        {regions.map((region, index) => <span className={`synthesis-region region-${index + 1}`} style={{ "--region-index": index } as React.CSSProperties} key={region}>{region}</span>)}
        <div className="agent-boundary"><span>CODING AGENT</span></div>
      </div>
      <div className="synthesis-copy">
        <h2><span>THE MODEL IS</span><em>NOT THE AGENT.</em></h2>
        <p>Model은 Agent의 핵심이다. Context, Tools, Execution, Control, Validation과 Loop가 함께 우리가 경험하는 Coding Agent를 만든다.</p>
      </div>
      <div className="final-questions"><span>What does it see?</span><span>What can it do?</span><span>What is it allowed to do?</span><span>How is it verified?</span></div>
    </section>
  );
}

function AppendixScene() {
  return (
    <section className="scene scene-appendix">
      <AgentArtwork variant="appendix" />
      <div className="appendix-copy"><Eyebrow>APPENDIX · A1</Eyebrow><h2>처음에는 질문이고,<br /><em>마지막에는 답이 된다.</em></h2></div>
    </section>
  );
}

export function Scene({ sceneId, motionPaused }: SceneProps) {
  switch (sceneId) {
    case "intro": return <IntroScene />;
    case "incident": return <IncidentScene />;
    case "strip": return <StripScene />;
    case "next-token": return <NextTokenScene />;
    case "generation": return <GenerationScene />;
    case "model-input": return <ModelInputScene />;
    case "attention": return <AttentionScene />;
    case "repository-context": return <RepositoryContextScene />;
    case "boundary": return <BoundaryScene />;
    case "execution-layer": return <ExecutionLayerScene />;
    case "requests-executes": return <RequestsExecutesScene />;
    case "result-returns": return <ResultReturnsScene />;
    case "agent-loop": return <AgentLoopScene />;
    case "follow-npe": return <FollowNpeScene />;
    case "failure-context": return <FailureContextScene />;
    case "stop": return <StopScene />;
    case "build-agent": return <BuildAgentScene />;
    case "different-agent": return <DifferentAgentScene motionPaused={motionPaused} />;
    case "developer-questions": return <DeveloperQuestionsScene />;
    case "incident-return": return <IncidentReturnScene />;
    case "synthesis": return <SynthesisScene />;
    case "appendix": return <AppendixScene />;
    default: return null;
  }
}
