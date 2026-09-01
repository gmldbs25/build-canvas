"use client";

import type { CSSProperties, ReactNode } from "react";
import { AgentArtwork } from "@/components/artwork";

type SceneProps = {
  sceneId: string;
  motionPaused: boolean;
};

type ContextItem = {
  label: string;
  value?: string;
  accent?: boolean;
};

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function SceneHeading({
  label,
  title,
  note,
  align = "left",
}: {
  label: string;
  title: ReactNode;
  note?: ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <header className={`scene-heading scene-heading-${align}`}>
      <Eyebrow>{label}</Eyebrow>
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </header>
  );
}

function Panel({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`scene-panel ${className}`.trim()}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

function FlowArrow({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flow-arrow ${className}`.trim()} aria-hidden="true">
      {label && <span>{label}</span>}
      <i />
      <b>→</b>
    </div>
  );
}

function ContextSnapshot({
  label,
  meta,
  items,
  className = "",
}: {
  label: string;
  meta?: string;
  items: ContextItem[];
  className?: string;
}) {
  return (
    <div className={`context-snapshot ${className}`.trim()}>
      <header>
        <Eyebrow>{label}</Eyebrow>
        {meta && <span>{meta}</span>}
      </header>
      <div className="context-snapshot-items">
        {items.map((item, index) => (
          <div
            className={item.accent ? "context-item context-item-accent" : "context-item"}
            style={{ "--i": index } as CSSProperties}
            key={`${item.label}-${index}`}
          >
            <b>{item.label}</b>
            {item.value && <span>{item.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelNode({ label = "MODEL", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`model-node ${className}`.trim()}>
      <Eyebrow>LANGUAGE MODEL</Eyebrow>
      <strong>{label}</strong>
    </div>
  );
}

function IntroScene() {
  return (
    <section className="scene scene-intro">
      <AgentArtwork />
      <div className="intro-wash" />
      <div className="intro-copy">
        <Eyebrow>WORK 03 · BUILD CANVAS</Eyebrow>
        <h1>LLM <span>to</span><br />AGENT</h1>
        <p className="intro-subtitle">다음 Token 예측에서<br />Coding Agent가 되기까지</p>
        <p className="intro-question">
          다음 Token 예측 Model은 어떻게 코드를 읽고,<br />파일을 수정하고 테스트하는 System에 참여할까?
        </p>
      </div>
    </section>
  );
}

const incidentSteps = ["READ LOG", "SEARCH CODE", "READ FILE", "TRACE", "PATCH", "TEST", "VERIFY"];

function IncidentScene() {
  return (
    <section className="scene scene-flow scene-incident">
      <SceneHeading
        label="01 · INCIDENT → AGENT"
        title={<>운영 장애에서<br /><em>Agent Workflow까지</em></>}
      />

      <div className="incident-stage">
        <Panel label="APPLICATION" className="incident-application reveal" >
          <div className="application-toolbar"><i /><span>production · /users/42</span></div>
          <div className="application-normal"><b>200</b><span>Application 정상</span></div>
          <div className="application-error"><b>ERROR</b><span>요청 실패</span></div>
        </Panel>

        <Panel label="LOGS / STACK TRACE" className="incident-stack reveal">
          <strong>NullPointerException</strong>
          <code>
            at UserMapper.toResponse(<mark>UserMapper.java:42</mark>)<br />
            at UserService.getUser(UserService.java:87)<br />
            at UserController.getUser(UserController.java:51)
          </code>
          <pre><span>42</span> user.getProfile().getDisplayName()</pre>
        </Panel>

        <FlowArrow label="HAND OFF" className="incident-handoff" />

        <Panel label="AGENT" className="incident-agent reveal">
          <div className="agent-task">
            <b>USER TASK</b>
            <p>원인을 확인하고 수정한 뒤<br />테스트까지 검증해줘.</p>
          </div>
          <div className="agent-mini-system">
            <span>CONTEXT</span>
            <strong>LLM</strong>
            <span>TOOLS</span>
          </div>
        </Panel>
      </div>

      <div className="scene-footer incident-workflow" aria-label="Agent workflow">
        {incidentSteps.map((step, index) => (
          <div
            className={index === incidentSteps.length - 1 ? "workflow-step workflow-step-final" : "workflow-step"}
            style={{ "--i": index } as CSSProperties}
            key={step}
          >
            <i>{String(index + 1).padStart(2, "0")}</i>
            <strong>{step}</strong>
          </div>
        ))}
        <span className="workflow-focus">NEXT FOCUS → LLM</span>
      </div>
    </section>
  );
}

function FocusLlmScene() {
  const parts = ["CONTEXT", "TOOLS", "EXECUTION", "ENVIRONMENT"];
  return (
    <section className="scene scene-focus-flow scene-focus-llm">
      <div className="focus-main">
        <div className="agent-dissolve" aria-hidden="true">
          {parts.map((part, index) => (
            <span className={`dissolve-part dissolve-part-${index + 1}`} key={part}>{part}</span>
          ))}
          <div className="dissolve-boundary">AGENT</div>
        </div>

        <div className="focus-pipeline">
          <Panel label="INPUT" className="focus-input"><code>current context</code></Panel>
          <FlowArrow />
          <ModelNode label="LLM" className="focus-model" />
          <FlowArrow />
          <Panel label="OUTPUT" className="focus-output"><strong>NEXT TOKEN ?</strong></Panel>
        </div>
      </div>

      <SceneHeading
        align="center"
        label="02 · LLM"
        title={<>LLM은 실제로<br /><em>무엇을 할까?</em></>}
        note="주변 시스템을 잠시 치우고 Model 자체만 본다."
      />
    </section>
  );
}

const tokenCandidates = [
  ["Exception", "8.7", "72%"],
  ["Error", "4.2", "15%"],
  ["Method", "1.8", "7%"],
  ["Object", "0.9", "3%"],
] as const;

function NextTokenScene() {
  return (
    <section className="scene scene-flow scene-next-token">
      <SceneHeading
        label="03 · NEXT TOKEN"
        title={<>다음 Token은 어떻게<br /><em>결정될까?</em></>}
        note="개념적인 Token 분할과 예시 값을 사용한다."
      />

      <div className="token-calculation">
        <Panel label="INPUT TEXT" className="token-input stage-card">
          <code>java.lang.NullPointer</code>
          <div className="token-chunks" aria-label="Conceptual token chunks">
            {["java", ".", "lang", ".", "Null", "Pointer"].map((token, index) => (
              <span style={{ "--i": index } as CSSProperties} key={`${token}-${index}`}>{token}</span>
            ))}
          </div>
          <small>CONCEPTUAL TOKENS</small>
        </Panel>

        <FlowArrow />

        <Panel label="MODEL CALCULATION" className="token-model stage-card">
          <strong>CONTEXT<br />REPRESENTATION</strong>
          <span>현재 Sequence → 다음 위치</span>
        </Panel>

        <FlowArrow />

        <div className="candidate-table stage-card">
          <header>
            <span>VOCABULARY LOGITS</span>
            <i>SOFTMAX →</i>
            <span>PROBABILITIES</span>
          </header>
          {tokenCandidates.map(([token, logit, probability], index) => (
            <div className={index === 0 ? "candidate-row candidate-row-selected" : "candidate-row"} key={token}>
              <strong>{token}</strong>
              <code>{logit}</code>
              <i aria-hidden="true" />
              <b>{probability}</b>
            </div>
          ))}
          <small>예시 점수와 확률</small>
        </div>

        <FlowArrow />

        <Panel label="DECODING" className="token-decoding stage-card">
          <span>SELECTED TOKEN</span>
          <strong>Exception</strong>
          <code>java.lang.NullPointer<mark>Exception</mark></code>
          <b>ONE TOKEN GENERATED</b>
        </Panel>
      </div>
    </section>
  );
}

const generationCycles = [
  { number: "01", context: "java.lang.NullPointer", token: "Exception", pace: "FIRST CYCLE" },
  { number: "02", context: "java.lang.NullPointerException", token: ":", pace: "NEXT CYCLE · FASTER" },
];

function GenerationScene() {
  return (
    <section className="scene scene-flow scene-generation">
      <SceneHeading
        label="04 · GENERATION"
        title={<>Token 생성은<br /><em>반복이다</em></>}
        note="선택된 Token은 다음 Sequence의 일부가 된다."
      />

      <div className="generation-main">
        <div className="generation-loop" aria-label="Context to next-token append loop">
          <div className="generation-loop-row">
            <Panel label="CONTEXT" className="generation-node"><strong>CURRENT SEQUENCE</strong></Panel>
            <FlowArrow />
            <ModelNode label="LLM" />
            <FlowArrow />
            <Panel label="OUTPUT" className="generation-node"><strong>NEXT TOKEN</strong></Panel>
          </div>
          <div className="append-return"><span>APPEND</span><i /><b>↖</b></div>
        </div>
        <div className="generation-thesis">PREDICT → APPEND → REPEAT</div>
      </div>

      <div className="scene-footer generation-cycles">
        {generationCycles.map((cycle, index) => (
          <div className="generation-cycle" style={{ "--i": index } as CSSProperties} key={cycle.number}>
            <i>{cycle.number}</i>
            <div><span>CURRENT CONTEXT</span><code>{cycle.context}</code></div>
            <b>+</b>
            <div className="cycle-token"><span>NEXT TOKEN</span><code>{cycle.token}</code></div>
            <strong>{cycle.pace}</strong>
          </div>
        ))}
      </div>

    </section>
  );
}

function ContextGrowthScene() {
  return (
    <section className="scene scene-flow scene-context-growth">
      <SceneHeading
        label="05 · MODEL CONTEXT"
        title={<>작업이 진행되며<br /><em>Context도 달라진다</em></>}
        note="하나의 Prompt가 계속 커지는 것이 아니라, Model Call마다 Context가 달라질 수 있다."
      />

      <div className="context-growth-stage">
        <ContextSnapshot
          label="MODEL CONTEXT #1"
          meta="INITIAL CALL"
          items={[
            { label: "USER REQUEST", value: "이 NPE 원인을 찾아서 수정해줘" },
            { label: "ERROR LOG", value: "NullPointerException · UserMapper.java:42" },
          ]}
        />
        <div className="task-progress-arrow"><span>작업 진행</span><i>→</i></div>
        <ContextSnapshot
          label="MODEL CONTEXT #2"
          meta="LATER CALL · SELECTED SNAPSHOT"
          className="later-context"
          items={[
            { label: "USER REQUEST" },
            { label: "ERROR LOG" },
            { label: "RELEVANT SOURCE", accent: true },
            { label: "PREVIOUS RESULT", accent: true },
            { label: "NEW EVIDENCE", accent: true },
          ]}
        />
      </div>

      <div className="scene-footer context-growth-footer">
        <div className="context-growth-guardrail">
          SELECTION · FILTERING · SUMMARY · COMPRESSION · OMISSION
        </div>
        <h3 className="context-growth-question">새로운 정보는 어떻게 Context에 들어왔을까?</h3>
      </div>
    </section>
  );
}

const evidenceBlocks = [
  ["USER REQUEST", "원인을 확인하고 수정한 뒤 테스트까지 검증"],
  ["ERROR LOG", "NullPointerException · UserMapper.java:42"],
  ["RELEVANT SOURCE", "user.getProfile().getDisplayName()"],
  ["CALL SITE", "UserService.getUser(…)"],
  ["RELATED DECLARATION", "UserProfile · displayName"],
  ["PRIOR NEUTRAL RESULT", "Candidate implementation located"],
] as const;

function EvidenceContextScene() {
  return (
    <section className="scene scene-flow scene-evidence-context">
      <SceneHeading
        label="06 · LONG CONTEXT"
        title={<>멀리 떨어진 정보도<br /><em>같은 판단에 영향을 준다</em></>}
        note="Context 안의 관련 정보를 함께 활용한다."
      />

      <div className="evidence-stage">
        <div className="long-context-window">
          <header><Eyebrow>CURRENT MODEL CONTEXT</Eyebrow><span>SCROLL MOTION = 표현을 위한 비유</span></header>
          <div className="long-context-track">
            {evidenceBlocks.map(([label, value], index) => (
              <div className={[1, 2, 4].includes(index) ? "evidence-block evidence-relevant" : "evidence-block"} style={{ "--i": index } as CSSProperties} key={label}>
                <b>{label}</b><code>{value}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="evidence-signals" aria-hidden="true"><i /><i /><i /></div>
        <ModelNode label="MODEL" className="evidence-model" />
      </div>

      <p className="scene-footer evidence-disclaimer">CONCEPTUAL SIGNALS · NOT A PRODUCTION ATTENTION TRACE</p>
    </section>
  );
}

function AccessContextScene() {
  return (
    <section className="scene scene-flow scene-access-context">
      <SceneHeading
        label="07 · REPOSITORY ACCESS"
        title={<>ACCESS <em>≠</em> CONTEXT</>}
        note="가져올 수 있는 정보와 현재 Model Call에 들어온 정보는 다르다."
      />

      <div className="access-stage">
        <Panel label="LARGE CODEBASE" className="repository-grid-panel">
          <div className="repository-grid" aria-label="Large repository represented by file tiles">
            {Array.from({ length: 42 }, (_, index) => (
              <i className={[9, 17, 31].includes(index) ? "repo-file repo-file-selected" : "repo-file"} key={index} />
            ))}
          </div>
          <strong>수천 개의 파일</strong>
        </Panel>

        <div className="access-not-equal">
          <div className="wrong-model"><span>ENTIRE REPO</span><i>→</i></div>
          <strong>≠</strong>
          <span>관련 부분만</span>
        </div>

        <ContextSnapshot
          label="MODEL CONTEXT"
          className="access-context-card"
          items={[
            { label: "USER REQUEST" },
            { label: "ERROR LOG" },
            { label: "RELEVANT SOURCE A", accent: true },
            { label: "RELEVANT SOURCE B", accent: true },
          ]}
        />
      </div>

      <h3 className="scene-footer access-question">그럼 코드는 어떻게 Context에 들어올까?</h3>
    </section>
  );
}

function ModelRequestsScene() {
  return (
    <section className="scene scene-flow scene-model-requests">
      <SceneHeading
        label="08 · MODEL REQUEST"
        title={<>필요한 행동은<br /><em>Model이 요청한다</em></>}
        note="Request는 행동을 설명할 뿐, 직접 실행하지 않는다."
      />

      <div className="request-stage">
        <ContextSnapshot
          label="CURRENT CONTEXT"
          className="request-context"
          items={[{ label: "USER REQUEST" }, { label: "ERROR LOG" }]}
        />
        <FlowArrow />
        <div className="request-model-stack">
          <ModelNode />
          <div className="model-need"><span>NEED SOURCE</span><strong>UserMapper.java</strong></div>
        </div>
        <div className="direct-access-rejected" aria-label="Model cannot directly read repository">
          <span>MODEL</span><i /><b>×</b><i /><span>REPOSITORY</span>
        </div>
        <FlowArrow label="OUTBOUND OUTPUT" />
        <div className="execution-gate">
          <Eyebrow>EXECUTION LAYER</Eyebrow>
          <div className="request-card"><span>READ</span><strong>UserMapper.java</strong></div>
          <small>REQUEST 수신 · 아직 실행 전</small>
        </div>
        <Panel label="ENVIRONMENT" className="request-repository"><strong>REPOSITORY</strong><span>아직 읽지 않음</span></Panel>
      </div>

      <div className="scene-footer request-thesis">REQUEST <em>≠</em> EXECUTION</div>
    </section>
  );
}

function ExecutionActsScene() {
  return (
    <section className="scene scene-flow scene-execution-acts">
      <SceneHeading
        label="09 · EXECUTION"
        title={<>실제 실행은<br /><em>Execution Layer가 맡는다</em></>}
        note="보편적인 구성 요소 이름이 아니라, 개념적인 책임을 뜻한다."
      />

      <div className="execution-stage">
        <div className="execution-endpoint execution-request">
          <Eyebrow>MODEL REQUEST</Eyebrow>
          <strong>READ</strong><code>UserMapper.java</code>
        </div>

        <div className="execution-lane">
          <span>REQUEST ↓</span>
          <div className="execution-layer-box">
            <Eyebrow>EXECUTION LAYER</Eyebrow>
            <strong>REQUEST를 실행 기능에<br />연결한다</strong>
          </div>
          <span>↓ FILE READ</span>
        </div>

        <div className="execution-endpoint execution-repository">
          <Eyebrow>REPOSITORY</Eyebrow>
          <div className="repository-files">
            <span>UserController.java</span>
            <span>UserService.java</span>
            <strong>UserMapper.java <b>READ</b></strong>
            <span>UserProfile.java</span>
          </div>
        </div>

        <div className="execution-return-path" aria-hidden="true"><span>RESULT</span><i /><b>↑</b></div>

        <div className="execution-result">
          <Eyebrow>TOOL RESULT / AGENT STATE</Eyebrow>
          <code>user.getProfile().getDisplayName()</code>
          <span>관련 Result를 간결하게 반환</span>
        </div>
      </div>
    </section>
  );
}

function ResultContextScene() {
  return (
    <section className="scene scene-flow scene-result-context">
      <SceneHeading
        label="10 · MODEL CONTEXT"
        title={<>Result는 다음<br /><em>Context에 반영될 수 있다</em></>}
        note="반환된 Result는 선별하거나 요약·압축할 수 있다."
      />

      <div className="result-context-stage">
        <Panel label="RETURNED RESULT" className="raw-result-card">
          <strong>UserMapper.java</strong>
          <code>… user.getProfile().getDisplayName() …</code>
          <span>더 긴 원본 Result가 있을 수 있음</span>
        </Panel>

        <div className="context-construction">
          {['FILTER', 'SELECT', 'SUMMARIZE', 'COMPRESS'].map((step, index) => (
            <span style={{ "--i": index } as CSSProperties} key={step}>{step}</span>
          ))}
          <i>→</i>
        </div>

        <ContextSnapshot
          label="NEXT MODEL CONTEXT"
          meta="NEW SNAPSHOT"
          className="next-context-card"
          items={[
            { label: "USER REQUEST" },
            { label: "ERROR LOG" },
            { label: "RELEVANT UserMapper.java RESULT", value: "NEW", accent: true },
          ]}
        />

        <FlowArrow label="다음 MODEL CALL 준비" />
        <ModelNode label="MODEL" className="model-not-run" />
      </div>

      <p className="scene-footer result-context-guardrail">MODEL CONTEXT ≠ ENTIRE AGENT STATE · TOOL RESULT 전체 아님 · MODEL 실행 전</p>
    </section>
  );
}

function OnePassScene() {
  return (
    <section className="scene scene-flow scene-one-pass">
      <SceneHeading
        align="center"
        label="11 · FIRST OUTPUT"
        title={<>첫 출력이<br /><em>최종 답이 아니라면?</em></>}
      />

      <div className="one-pass-comparison">
        <div className="simple-pass">
          <Eyebrow>SIMPLE EXPECTATION</Eyebrow>
          <div><span>CONTEXT</span><i>→</i><span>MODEL</span><i>→</i><strong>FINAL ANSWER</strong></div>
        </div>
        <div className="agent-first-pass">
          <Eyebrow>AGENT · FIRST PASS</Eyebrow>
          <div className="first-pass-flow">
            {['INITIAL CONTEXT', 'MODEL', 'REQUEST', 'EXECUTION / RESULT', 'NEXT MODEL CONTEXT'].map((step, index) => (
              <div style={{ "--i": index } as CSSProperties} key={step}>
                <span>{step}</span>{index < 4 && <i>→</i>}
              </div>
            ))}
          </div>
          <p>첫 출력 = NEXT ACTION / 추가 CONTEXT REQUEST</p>
        </div>
      </div>

      <div className="scene-footer now-what"><span>NEXT CONTEXT 준비 완료</span><strong>그다음은?</strong></div>
    </section>
  );
}

const loopStages = ["MODEL", "REQUEST", "EXECUTION", "RESULT", "CONTEXT UPDATE"];

function AgentLoopScene() {
  return (
    <section className="scene scene-flow scene-agent-loop">
      <SceneHeading
        label="12 · AGENT LOOP"
        title={<>이 반복이<br /><em>Agent Loop다</em></>}
      />

      <div className="agent-loop-stage">
        <div className="linear-loop">
          {loopStages.map((stage, index) => (
            <div className={index === 0 ? "linear-loop-node loop-node-model" : "linear-loop-node"} style={{ "--i": index } as CSSProperties} key={stage}>
              <i>{String(index + 1).padStart(2, "0")}</i><strong>{stage}</strong>
              {index < loopStages.length - 1 && <b>↓</b>}
            </div>
          ))}
          <div className="loop-return" aria-hidden="true"><span>다음 판단은 달라진다</span><i /><b>↖</b></div>
        </div>

        <div className="loop-context-state">
          <ContextSnapshot
            label="CURRENT / NEXT MODEL CONTEXT"
            meta="CHANGING STATE"
            items={[
              { label: "USER REQUEST", value: "이 NPE를 수정해줘." },
              { label: "ERROR LOG", value: "NullPointerException · line 42" },
              { label: "+ SOURCE RESULT", value: "UserMapper.java", accent: true },
              { label: "+ RELATED PATH", value: "새로운 근거", accent: true },
            ]}
          />
          <div className="iteration-cards">
            <div><span>ITERATION 01</span><strong>READ UserMapper.java</strong></div>
            <i>→</i>
            <div><span>ITERATION 02</span><strong>INSPECT RELATED PATH</strong></div>
          </div>
          <p>NEW RESULT → 상태 변화 → 다음 판단 변화</p>
        </div>
      </div>

      <div className="scene-footer agent-loop-thesis">DECIDE → ACT → OBSERVE → UPDATE → DECIDE AGAIN</div>
    </section>
  );
}

const npeIterations = [
  {
    number: "01",
    context: ["USER REQUEST", "ERROR LOG", "UserMapper.java:42"],
    summaries: [
      ["OBSERVATION", "Stack Trace는 UserMapper.java:42를 가리킨다."],
      ["NEXT ACTION", "관련 구현을 찾는다."],
    ],
    output: "SEARCH CODE · UserMapper",
  },
  {
    number: "02",
    context: ["USER REQUEST", "ERROR LOG", "SOURCE · user.getProfile().getDisplayName()"],
    summaries: [
      ["OBSERVATION", "실패한 식에는 여러 단계의 참조가 있다."],
      ["CURRENT ASSESSMENT", "현재 근거만으로는 어떤 값이 null인지 확정할 수 없다."],
      ["NEXT ACTION", "관련 데이터 경로를 확인한다."],
    ],
    output: "INSPECT RELATED PATH",
  },
  {
    number: "03",
    context: ["USER REQUEST", "ERROR LOG", "SOURCE CODE", "REPOSITORY EVIDENCE · profile may be absent"],
    summaries: [
      ["OBSERVATION", "기존 사용자 데이터에는 profile이 없을 수 있다."],
      ["WORKING HYPOTHESIS", "profile == null이 원인일 가능성이 높다."],
      ["NEXT ACTION", "null 처리를 Patch한 뒤 검증한다."],
    ],
    output: "PATCH NULL HANDLING",
  },
] as const;

function NpeRunScene() {
  return (
    <section className="scene scene-flow scene-npe-run">
      <SceneHeading
        label="13 · NPE AGENT RUN"
        title={<>실제 NPE를 Agent Loop로<br /><em>따라가보자</em></>}
        note="숨겨진 추론이 아니라, 관찰 가능한 요약만 보여준다."
      />

      <div className="npe-run-stage">
        <div className="iteration-rail">
          {npeIterations.map((iteration, index) => (
            <div style={{ "--i": index } as CSSProperties} key={iteration.number}>
              <i>{iteration.number}</i><span>{index === 0 ? "SEARCH" : index === 1 ? "INSPECT" : "HYPOTHESIS"}</span>
            </div>
          ))}
        </div>

        <div className="npe-state-stack">
          {npeIterations.map((iteration, iterationIndex) => (
            <div className={`npe-state npe-state-${iterationIndex + 1}`} key={iteration.number}>
              <ContextSnapshot
                label={`CURRENT MODEL CONTEXT · ITERATION ${iteration.number}`}
                items={iteration.context.map((label, index) => ({ label, accent: index >= 2 }))}
              />
              <div className="model-assessment">
                <header><Eyebrow>MODEL · OBSERVABLE SUMMARY</Eyebrow></header>
                {iteration.summaries.map(([label, value]) => (
                  <div key={label}><span>{label}</span><strong>{value}</strong></div>
                ))}
                <code>{iteration.output}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PatchCode({ revised = false }: { revised?: boolean }) {
  return (
    <pre className={revised ? "patch-code patch-code-revised" : "patch-code"}>
      <code>
        <span>UserProfile profile =</span>
        <span>  user.getProfile();</span>
        <span>String displayName =</span>
        <span>  profile != null</span>
        <span>    ? profile.getDisplayName()</span>
        <mark>    : {revised ? '"Unknown"' : "null"};</mark>
      </code>
    </pre>
  );
}

const revisionSteps = ["PATCH #1", "NPE RESOLVED", "RUN EXISTING TEST", "FAIL", "FEEDBACK", "RE-EVALUATE", "PATCH #2"];

function PatchReviseScene() {
  return (
    <section className="scene scene-flow scene-patch-revise">
      <SceneHeading
        label="14 · VALIDATION"
        title={<>실패가 다음<br /><em>수정을 만든다</em></>}
        note="실패는 재학습이 아니라 새로운 근거다."
      />

      <div className="revision-main">
        <div className="revision-timeline">
          {revisionSteps.map((step, index) => (
            <div className={step === "FAIL" ? "revision-step revision-step-fail" : "revision-step"} style={{ "--i": index } as CSSProperties} key={step}>
              <i>{String(index + 1).padStart(2, "0")}</i><strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="revision-stage">
          <Panel label="PATCH #1 · NPE RESOLVED" className="first-patch-card">
            <PatchCode />
          </Panel>

          <Panel label="EXISTING REPOSITORY TEST" className="test-failure-card">
            <strong>FAIL</strong>
            <code>expected: <b>&quot;Unknown&quot;</b><br />actual: <b>null</b></code>
            <span>실패도 다음 판단을 위한 Feedback이다</span>
          </Panel>

          <div className="revision-summary">
            <Eyebrow>NEXT MODEL CONTEXT · OBSERVABLE SUMMARY</Eyebrow>
            <div><span>OBSERVATION</span><strong>NPE는 해결됐다.</strong></div>
            <div><span>NEW EVIDENCE</span><strong>null 반환은 기대 동작을 깨뜨린다.</strong></div>
            <div><span>NEXT ACTION</span><strong>Patch를 다시 고친다.</strong></div>
          </div>

          <Panel label="PATCH #2" className="second-patch-card">
            <PatchCode revised />
          </Panel>
        </div>
      </div>
    </section>
  );
}

const completionSteps = ["PATCH #2", "RUN TESTS", "PASS", "VERIFY", "OBJECTIVE SATISFIED", "FINAL RESPONSE", "STOP"];

function TaskCompleteScene() {
  return (
    <section className="scene scene-flow scene-task-complete">
      <SceneHeading
        label="15 · STOP CONDITION"
        title={<>검증이 끝나면<br /><em>작업도 끝난다</em></>}
        note="이 결과가 목표를 충족해, 다시 Model로 돌아가지 않는다."
      />

      <div className="completion-stage">
        <div className="task-complete-card">
          <Eyebrow>AGENT RUN</Eyebrow>
          <h3>TASK COMPLETE</h3>
          <ul>
            <li><i>✓</i><span>NPE 해결</span></li>
            <li><i>✓</i><span>Patch 검증</span></li>
            <li><i>✓</i><span>Test 통과</span></li>
          </ul>
        </div>

        <div className="completion-flow">
          {completionSteps.map((step, index) => (
            <div className={step === "STOP" ? "completion-step completion-stop" : "completion-step"} style={{ "--i": index } as CSSProperties} key={step}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <strong>{step}</strong>
              {index < completionSteps.length - 1 && <b>→</b>}
            </div>
          ))}
          <p>PASS → COMPLETE <span>·</span> MODEL로 돌아가지 않음</p>
        </div>
      </div>
    </section>
  );
}

const agentParts = [
  ["CONTEXT", "Model에 제공되는 정보"],
  ["TOOLS", "사용할 수 있는 기능"],
  ["EXECUTION", "Request를 행동으로 전환"],
  ["ENVIRONMENT", "Repository / Workspace"],
  ["CONTROL", "허용된 행동의 범위"],
  ["VALIDATION", "Result가 올바른지 검증"],
  ["RESULT / FEEDBACK", "외부에서 얻은 근거"],
  ["LOOP", "다시 판단"],
] as const;

function AgentSystemScene() {
  return (
    <section className="scene scene-split-flow scene-agent-system">
      <SceneHeading
        label="16 · AGENT SYSTEM"
        title={<>구성 요소가<br /><em>Agent를 만든다</em></>}
        note="나뉘어 있던 책임이 Model 주변에서 하나의 System을 이룬다."
      />

      <div className="agent-system-stage">
        <div className="agent-system-grid">
          {agentParts.map(([part, note], index) => (
            <div className={`system-part system-part-${index + 1}`} style={{ "--i": index } as CSSProperties} key={part}>
              <strong>{part}</strong><span>{note}</span>
            </div>
          ))}
          <ModelNode label="LLM" className="system-core" />
          <div className="system-connections" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="agent-identity"><span>AGENT</span></div>
        </div>
      </div>
    </section>
  );
}

function ConclusionScene() {
  const flow = ["LLM", "REQUEST", "SYSTEM ACTS", "RESULT", "CONTEXT UPDATE", "LLM"];
  return (
    <section className="scene scene-conclusion">
      <div className="conclusion-origin">
        <span>CONTEXT</span><i>→</i><strong>LLM</strong><i>→</i><span className="origin-output"><b>TOKEN</b><em>REQUEST</em></span>
      </div>

      <div className="conclusion-flow" aria-label="One compact system cycle">
        {flow.map((step, index) => (
          <div style={{ "--i": index } as CSSProperties} key={`${step}-${index}`}>
            <span>{step}</span>{index < flow.length - 1 && <i>↓</i>}
          </div>
        ))}
      </div>

      <div className="conclusion-dim" />
      <div className="conclusion-thesis">
        <h2><span>LLM</span><i>→</i><strong>AGENT</strong></h2>
        <p><span>The model predicts.</span><strong>The system turns predictions into actions.</strong></p>
      </div>
    </section>
  );
}

function AppendixScene() {
  return (
    <section className="scene scene-appendix">
      <AgentArtwork variant="appendix" />
    </section>
  );
}

export function Scene({ sceneId }: SceneProps) {
  switch (sceneId) {
    case "intro": return <IntroScene />;
    case "incident": return <IncidentScene />;
    case "focus-llm": return <FocusLlmScene />;
    case "next-token": return <NextTokenScene />;
    case "generation": return <GenerationScene />;
    case "context-growth": return <ContextGrowthScene />;
    case "evidence-context": return <EvidenceContextScene />;
    case "access-context": return <AccessContextScene />;
    case "model-requests": return <ModelRequestsScene />;
    case "execution-acts": return <ExecutionActsScene />;
    case "result-context": return <ResultContextScene />;
    case "one-pass": return <OnePassScene />;
    case "agent-loop": return <AgentLoopScene />;
    case "npe-run": return <NpeRunScene />;
    case "patch-revise": return <PatchReviseScene />;
    case "task-complete": return <TaskCompleteScene />;
    case "agent-system": return <AgentSystemScene />;
    case "conclusion": return <ConclusionScene />;
    case "appendix": return <AppendixScene />;
    default: return null;
  }
}
