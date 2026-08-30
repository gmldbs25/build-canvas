export type DetailSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string[];
};

export type SceneDefinition = {
  id: string;
  number: string;
  title: string;
  act: number | null;
  actTitle?: "MODEL" | "CONTEXT" | "BOUNDARY" | "LOOP" | "AGENT";
  actPosition?: number;
  actQuestion?: string;
  details?: DetailSection[];
  references?: { label: string; url: string }[];
};

const refs = {
  transformer: {
    label: "Vaswani et al. — Attention Is All You Need (2017)",
    url: "https://arxiv.org/abs/1706.03762",
  },
  agents: {
    label: "OpenAI Agents SDK — Agents",
    url: "https://openai.github.io/openai-agents-python/agents/",
  },
  running: {
    label: "OpenAI Agents SDK — Running agents",
    url: "https://openai.github.io/openai-agents-python/running_agents/",
  },
  context: {
    label: "OpenAI Agents SDK — Context management",
    url: "https://openai.github.io/openai-agents-python/context/",
  },
  tools: {
    label: "OpenAI Agents SDK — Tools",
    url: "https://openai.github.io/openai-agents-python/tools/",
  },
  safety: {
    label: "OpenAI — Running Codex safely",
    url: "https://openai.com/index/running-codex-safely/",
  },
};

export const scenes: SceneDefinition[] = [
  {
    id: "intro",
    number: "00",
    title: "LLM to AGENT",
    act: null,
  },
  {
    id: "incident",
    number: "01",
    title: "The Incident",
    act: 1,
    actTitle: "MODEL",
    actPosition: 1,
    actQuestion: "복잡해 보이는 Agent 행동에서 Model 자체는 무엇을 하는가?",
    details: [
      {
        title: "Scene Summary",
        paragraphs: [
          "운영 서버에서 NullPointerException이 발생했다. Coding Agent에게 로그를 주고 원인 분석부터 수정, 테스트까지 요청하면 Agent는 여러 단계를 거쳐 문제를 해결하는 것처럼 보인다.",
          "이 자료에서는 이 하나의 Incident를 처음부터 끝까지 계속 사용한다.",
        ],
        code: ["READ LOG\n→ SEARCH CODE\n→ READ FILE\n→ PATCH\n→ TEST\n→ VERIFY"],
      },
      {
        title: "Incident Definition",
        paragraphs: [
          "일부 Legacy User는 profile이 존재하지 않을 수 있지만 현재 Mapper는 이를 처리하지 않는다.",
          "이 예제는 Agent 동작을 설명하기 위해 만든 교육용 Scenario다.",
        ],
        code: [
          "public UserResponse toResponse(User user) {\n    return new UserResponse(\n        user.getId(),\n        user.getProfile().getDisplayName()\n    );\n}",
          "java.lang.NullPointerException\n    at UserMapper.toResponse(UserMapper.java:42)\n    at UserService.getUser(UserService.java:87)\n    at UserController.getUser(UserController.java:51)",
        ],
      },
      {
        title: "Why start here?",
        paragraphs: [
          "먼저 Agent가 실제로 수행하는 복잡한 행동을 보고, 이후 주변 시스템을 하나씩 제거하며 Model 자체의 역할을 찾는다.",
        ],
      },
    ],
  },
  {
    id: "strip",
    number: "02",
    title: "Strip It Down",
    act: 1,
    actTitle: "MODEL",
    actPosition: 2,
    details: [
      {
        title: "What does the model actually produce?",
        paragraphs: [
          "Language Model은 현재 입력을 바탕으로 다음 위치에 올 Token에 대한 값을 계산한다. 이를 반복하면서 긴 출력이 만들어진다.",
          "Presentation의 THE MODEL GENERATES TOKENS.는 이 핵심을 단순화한 표현이다.",
        ],
        code: ["Context\n   ↓\nLanguage Model\n   ↓\nNext-token scores"],
      },
      {
        title: "Token ≠ Word",
        paragraphs: [
          "Token은 자연어 단어와 동일하지 않다. Tokenizer에 따라 하나의 단어가 여러 Token으로 분리될 수도 있고, 단어 일부·공백·문장부호 등이 Tokenization에 영향을 줄 수도 있다.",
          "Presentation의 Token 표시는 사람이 읽기 쉽게 단순화한 예시다.",
        ],
      },
      {
        title: "Important distinction",
        paragraphs: [
          "Coding Agent가 파일을 읽고 Shell을 실행했다고 자연스럽게 말할 수 있지만, 이것을 LLM inference 자체가 File System이나 OS side effect를 직접 수행했다는 뜻으로 해석하지 않는다.",
        ],
      },
    ],
  },
  {
    id: "next-token",
    number: "03",
    title: "Next Token",
    act: 1,
    actTitle: "MODEL",
    actPosition: 3,
    details: [
      {
        title: "From logits to the next token",
        paragraphs: [
          "Language Model은 가능한 Vocabulary Token 각각에 대해 logit이라고 부르는 score를 출력한다.",
          "Softmax를 적용하면 score를 확률 분포로 해석할 수 있다. 실제 생성에서는 설정에 따라 greedy decoding, temperature, top-p sampling 등 여러 decoding strategy가 사용될 수 있다.",
          "따라서 엄밀히는 ‘Model이 하나의 Token을 직접 선택한다’보다 ‘Model이 다음 Token을 위한 score를 생성하고 decoding 과정에서 다음 Token이 결정된다’가 더 정확하다.",
        ],
        code: ["Context\n   ↓\nModel\n   ↓\nLogits\n   ↓\nDecoding\n   ↓\nNext Token"],
      },
      {
        title: "About the visual example",
        paragraphs: [
          "Exception 72% 등의 문자열, Token 경계, 숫자는 실제 특정 Model을 측정한 값이 아니다. Tokenization과 분포는 tokenizer, Model, Context에 따라 달라진다.",
        ],
      },
    ],
  },
  {
    id: "generation",
    number: "04",
    title: "Generation Is Repetition",
    act: 1,
    actTitle: "MODEL",
    actPosition: 4,
    details: [
      {
        title: "Autoregressive generation",
        paragraphs: [
          "결정된 Token이 sequence에 추가되고 그 sequence가 다음 예측의 조건이 된다.",
        ],
        code: ["Input\n↓\nPredict next token\n↓\nAppend token\n↓\nPredict next token\n↓\nAppend token\n↓\n..."],
      },
      {
        title: "Does everything recalculate from scratch?",
        paragraphs: [
          "개념적으로 이전 sequence가 다음 예측의 조건이 되지만 실제 inference에서는 KV cache 같은 최적화로 이전 계산의 일부를 재사용할 수 있다. 따라서 모든 Token에서 전체 Context를 완전히 처음부터 다시 계산한다고 이해할 필요는 없다.",
        ],
      },
      {
        title: "ACT 1 Summary",
        paragraphs: [
          "아무리 복잡한 코드나 문장을 생성하더라도 Language Model의 기본 생성 과정은 Token 단위 autoregressive generation이다.",
          "그렇다면 Model은 무엇을 근거로 다음 Token을 계산할까?",
        ],
      },
    ],
  },
  {
    id: "model-input",
    number: "05",
    title: "What Enters the Model",
    act: 2,
    actTitle: "CONTEXT",
    actPosition: 1,
    actQuestion: "Model은 무엇을 근거로 판단하는가?",
    details: [
      {
        title: "What do we mean by Context?",
        paragraphs: [
          "이 자료의 Presentation에서 CONTEXT는 주로 ‘현재 Model Call에서 LLM이 볼 수 있는 정보’를 의미한다.",
        ],
        bullets: ["system instructions", "user request", "previous messages", "code", "tool results"],
      },
      {
        title: "Context is overloaded",
        paragraphs: [
          "실제 Agent Framework에서 context는 Application code가 사용하는 local runtime state를 뜻하기도 한다. LLM-visible context와 local application context는 같지 않을 수 있다.",
          "이 자료의 Presentation CONTEXT는 기본적으로 LLM-visible information을 의미한다.",
        ],
      },
      {
        title: "Context Window",
        paragraphs: [
          "Model은 한 번의 호출에서 처리할 수 있는 입력량에 한계가 있다. 큰 Repository 전체를 항상 한 번에 넣는 방식은 현실적이지 않을 수 있으며, 이것이 Agent의 Context Management가 필요한 이유 중 하나다.",
        ],
      },
      {
        title: "Important distinction",
        paragraphs: [
          "‘UserMapper.java가 Repository에 존재한다’와 ‘UserMapper.java 내용이 현재 Model Input에 포함되어 있다’는 서로 다른 사실이다.",
        ],
      },
    ],
    references: [refs.context],
  },
  {
    id: "attention",
    number: "06",
    title: "Attention Is Relation",
    act: 2,
    actTitle: "CONTEXT",
    actPosition: 2,
    details: [
      {
        title: "Why Attention matters here",
        paragraphs: [
          "Transformer의 Self-Attention에서는 Context 내 접근 가능한 위치들이 서로의 representation에 영향을 줄 수 있다. Presentation의 두 코드 위치 연결은 이 직관을 단순화한 표현이다.",
        ],
      },
      {
        title: "What the line does NOT mean",
        paragraphs: [
          "연결선은 Model이 인간처럼 ‘이 변수의 의미를 명시적으로 이해했다’거나 실제 Attention Head 하나가 정확히 이 두 Token만 선택했다는 뜻이 아니다.",
        ],
      },
      {
        title: "Q, K, V — simplified",
        paragraphs: [
          "실제 Transformer에는 multi-head attention, projections, residual connections, normalization, feed-forward layers 등이 함께 존재한다. Coding Agent의 동작을 이해하는 데 필수적이지 않으므로 Presentation에서는 생략한다.",
        ],
        code: ["Query\n   ↓\ncompare with Keys\n   ↓\nattention weights\n   ↓\nweighted combination of Values"],
      },
      {
        title: "Causal attention",
        paragraphs: [
          "Autoregressive decoder Language Model에서는 causal masking 때문에 현재 위치가 아직 생성되지 않은 미래 위치를 볼 수 없다.",
        ],
      },
    ],
    references: [refs.transformer],
  },
  {
    id: "repository-context",
    number: "07",
    title: "Repository → Context",
    act: 2,
    actTitle: "CONTEXT",
    actPosition: 3,
    details: [
      {
        title: "Repository exists. Context is selected.",
        paragraphs: [
          "프로젝트에 수천 개의 파일이 있어도 현재 Model Call에 제공되는 정보는 그중 일부일 수 있다. Agent 시스템은 현재 Task에 맞는 정보를 찾고 Model에게 제공할 수 있다.",
        ],
      },
      {
        title: "Search is not automatically Context",
        paragraphs: [
          "Search Tool이 파일 목록을 반환했다고 해서 모든 파일 전체가 반드시 Model Input에 포함되는 것은 아니다. 구현에 따라 search result 일부, 추가 read 결과, 파일 일부, 요약된 결과 등을 사용할 수 있다.",
          "Presentation의 이동 animation은 개념적 정보 선택 과정이다.",
        ],
      },
      {
        title: "More context is not always better",
        paragraphs: [
          "무조건 많은 Context가 좋은 것은 아니다. 불필요한 정보는 token budget을 사용하고 중요한 정보의 비율을 낮출 수 있다. 중요한 것은 현재 Task에 적절한 Context를 구성하는 것이다.",
        ],
      },
      {
        title: "Possible context-management techniques",
        bullets: ["repository search", "file selection", "retrieval", "session history", "summarization", "compaction", "tool-result selection"],
        paragraphs: [
          "제품마다 방법은 다르다. Model은 Repository 전체를 자동으로 알고 있는 것이 아니라 현재 Model Call에 제공된 Context를 바탕으로 판단한다.",
        ],
      },
    ],
    references: [refs.context],
  },
  {
    id: "boundary",
    number: "08",
    title: "Request Stops at the Boundary",
    act: 3,
    actTitle: "BOUNDARY",
    actPosition: 1,
    actQuestion: "Model은 어떻게 실제 Environment와 연결되는가?",
    details: [
      {
        title: "Model output vs side effect",
        paragraphs: [
          "MODEL OUTPUT인 read_file(\"src/UserMapper.java\")와 실제로 File System을 읽는 것은 같은 사건이 아니다.",
        ],
      },
      {
        title: "What is a Tool Request?",
        paragraphs: [
          "Tool-capable systems can provide a model with information about available tools and their inputs. 교육용 화면에서는 읽기 쉬운 JSON으로 요청을 표현할 수 있다.",
          "이것은 모든 Tool Call이 JSON 문자열이라는 뜻이 아니다. 중요한 개념은 structured action-request output이다.",
        ],
        code: ["{\n  \"tool\": \"read_file\",\n  \"arguments\": {\n    \"path\": \"src/UserMapper.java\"\n  }\n}"],
      },
      {
        title: "Why the boundary matters",
        paragraphs: ["MODEL DECISION ≠ EXECUTION AUTHORITY"],
        bullets: ["executed", "rejected", "require approval", "fail validation", "fail during execution"],
      },
    ],
    references: [refs.tools],
  },
  {
    id: "execution-layer",
    number: "09",
    title: "Execution Layer",
    act: 3,
    actTitle: "BOUNDARY",
    actPosition: 2,
    details: [
      {
        title: "What we mean by Execution Layer",
        paragraphs: [
          "이 자료에서 Execution Layer는 Model이 생성한 행동 요청을 해석하고 필요한 검증을 거쳐 실제 Environment 기능과 연결한 뒤 결과를 Agent workflow에 전달하는 시스템 책임을 의미한다.",
        ],
      },
      {
        title: "Not a universal product name",
        paragraphs: [
          "모든 Coding Agent에 ExecutionLayer나 AgentRuntime이라는 단일 컴포넌트가 존재한다는 뜻이 아니다. 실제 역할은 Runner, Orchestrator, Controller, Tool Runtime, host application, hosted service 등으로 나뉠 수 있다.",
        ],
      },
      {
        title: "Runtime ≠ Tool",
        paragraphs: [
          "Tool은 실제 capability다. Execution/Runtime responsibility는 요청을 실제 Tool과 연결하고 실행 흐름을 관리한다.",
        ],
        bullets: ["search_code", "read_file", "apply_patch", "run_shell", "run_tests"],
      },
      {
        title: "Simplified execution path",
        paragraphs: [
          "REQUEST → VALIDATE → PERMISSION → EXECUTE는 개념적 설명이다. 실제 제품이 정확히 이 네 단계를 같은 순서로 수행한다고 주장하지 않는다.",
          "Tool availability와 execution authority는 별개일 수 있다. Sandbox는 실행 가능한 범위를 제한하는 control mechanism의 한 예이며 모든 Agent의 정의 요건은 아니다.",
        ],
      },
    ],
    references: [refs.tools, refs.safety],
  },
  {
    id: "requests-executes",
    number: "10",
    title: "Model Requests. System Executes.",
    act: 3,
    actTitle: "BOUNDARY",
    actPosition: 3,
    details: [
      {
        title: "Why separate them?",
        paragraphs: [
          "Model이 행동을 요청했다고 해서 반드시 실행되는 것은 아니다. Tool Request는 실행될 수도 있고, 거부될 수도 있고, 승인을 기다릴 수도 있고, Error가 발생할 수도 있다.",
        ],
      },
      {
        title: "Control is part of the broader system",
        paragraphs: [
          "Model capability와 System capability/permission은 별개의 문제다. 매우 강한 Model이라도 read-only 권한만 있다면 파일 수정은 수행하지 못할 수 있다. 반대로 권한을 넓힌다고 Model의 판단 능력이 높아지는 것도 아니다.",
          "Model의 Tool Request와 실제 Tool Execution은 다른 책임이다.",
        ],
      },
    ],
    references: [refs.safety],
  },
  {
    id: "result-returns",
    number: "11",
    title: "Result Returns",
    act: 4,
    actTitle: "LOOP",
    actPosition: 1,
    actQuestion: "한 번의 Tool Call은 어떻게 지속적인 개발 작업이 되는가?",
    details: [
      {
        title: "The context changes",
        paragraphs: [
          "중요한 변화는 subsequent reasoning/generation에 사용할 수 있는 정보가 달라졌다는 것이다.",
        ],
        code: ["Before\nUSER REQUEST\nMODEL TOOL REQUEST", "After\nUSER REQUEST\nMODEL TOOL REQUEST\nTOOL RESULT"],
      },
      {
        title: "Tool Result ≠ Training",
        paragraphs: [
          "파일을 읽었다고 Model의 parameters가 업데이트되는 것은 아니다. 현재 Agent Run/Session에 새로운 정보가 생긴 것이다.",
        ],
      },
      {
        title: "Implementations vary",
        paragraphs: [
          "Tool output은 직접 포함되거나, wrapping·filtering·summarization을 거치거나, 별도로 저장된 뒤 선택된 내용만 나중에 노출될 수 있다. Presentation의 TOOL RESULT → CONTEXT는 개념적 단순화다.",
        ],
      },
    ],
    references: [refs.running, refs.context],
  },
  {
    id: "agent-loop",
    number: "12",
    title: "The Agent Loop",
    act: 4,
    actTitle: "LOOP",
    actPosition: 2,
    details: [
      {
        title: "Minimal Agent Loop",
        code: ["GOAL + CURRENT CONTEXT\n          ↓\n        MODEL\n          ↓\n     TOOL REQUEST\n          ↓\n       EXECUTION\n          ↓\n      TOOL RESULT\n          ↓\n   UPDATED CONTEXT\n          ↓\n        MODEL\n          ↺"],
      },
      {
        title: "This is not every Agent architecture",
        paragraphs: [
          "실제 시스템은 multiple/parallel tool calls, handoffs, sub-agents, planning, persistent state, approval, background work 등을 포함할 수 있다. 이 그림은 repeated Model–Environment interaction을 위한 minimal conceptual model이다.",
        ],
      },
      {
        title: "Model Call vs Agent Run",
        paragraphs: [
          "Model Call은 한 번의 invocation이다. Agent Run은 하나의 User Goal을 추구하면서 여러 Model Call과 Tool execution을 포함할 수 있다.",
        ],
      },
    ],
    references: [refs.running],
  },
  {
    id: "follow-npe",
    number: "13",
    title: "Follow the NPE",
    act: 4,
    actTitle: "LOOP",
    actPosition: 3,
    details: [
      {
        title: "Read log",
        paragraphs: ["Stack trace가 현재 유용한 정보에 UserMapper.java:42를 추가한다."],
      },
      {
        title: "Search repository",
        code: ["search_code(\"UserMapper\")", "src/main/java/.../UserMapper.java\nsrc/test/java/.../UserMapperTest.java"],
      },
      {
        title: "Read file",
        code: ["read_file(\"src/main/java/.../UserMapper.java\")", "user.getProfile().getDisplayName()"],
      },
      {
        title: "Trace cause",
        paragraphs: [
          "시스템이 profile == null을 유력한 원인으로 찾았다고 말할 수 있지만 hidden reasoning을 렌더링하지 않는다. Presentation은 Context item, Tool Request, Tool Result, file/diff/test state처럼 관찰 가능한 workflow만 보여준다.",
        ],
      },
      {
        title: "Patch and test",
        paragraphs: [
          "Model이 생성한 patch content와 실제 file modification은 개념적으로 분리된다. run_tests(\"UserMapperTest\")는 사용 가능한 환경/도구를 통해 실제 테스트 실행을 일으키며, 반환된 결과가 다음 단계의 feedback이 된다.",
        ],
      },
    ],
    references: [refs.tools, refs.running],
  },
  {
    id: "failure-context",
    number: "14",
    title: "Failure Is Context",
    act: 4,
    actTitle: "LOOP",
    actPosition: 4,
    details: [
      {
        title: "Failure does not mean training",
        paragraphs: [
          "Model이 재학습되거나 영구적으로 학습한 것이 아니다. 실패 결과가 현재 Agent Run의 Context/State에 반영되고 다음 Model Call이 그 정보를 근거로 새로운 행동을 생성할 수 있다.",
        ],
      },
      {
        title: "Before / After",
        code: ["Before\nNPE Log\nUserMapper.java\nCurrent Patch", "After\nNPE Log\nUserMapper.java\nCurrent Patch\n\nTEST RESULT\nexpected: \"Unknown\"\nactual: null"],
      },
      {
        title: "Next action",
        paragraphs: ["관련 test를 읽고, null fallback을 계약에 맞게 수정한 뒤 test를 다시 실행한다."],
        code: ["assertEquals(\n    \"Unknown\",\n    result.displayName()\n);", "profile != null\n    ? profile.getDisplayName()\n    : \"Unknown\""],
      },
      {
        title: "Why validation matters",
        paragraphs: [
          "중요한 성취는 patch를 생성한 것만이 아니다. 시스템은 실제 Environment feedback을 얻고 그것을 다음 단계에 사용할 수 있다.",
        ],
      },
    ],
  },
  {
    id: "stop",
    number: "15",
    title: "When Does It Stop?",
    act: 4,
    actTitle: "LOOP",
    actPosition: 5,
    details: [
      {
        title: "Successful completion",
        paragraphs: [
          "시스템은 final output을 생성하거나 더 이상 Tool action이 필요하지 않을 때 멈출 수 있다.",
        ],
        code: ["PATCH\n↓\nTEST PASS\n↓\nVERIFY\n↓\nTASK COMPLETE"],
      },
      {
        title: "Other stop conditions",
        bullets: ["user approval", "permission denial", "max turns/iterations", "unrecoverable errors", "time/cost/resource limits"],
        paragraphs: ["구체적인 메커니즘은 framework마다 다르다."],
      },
      {
        title: "Agent ≠ infinite autonomy",
        paragraphs: [
          "이 자료에서 Agent는 현재 상태를 바탕으로 다음 행동을 선택하고, 결과를 다시 상태에 반영하며, 목표 또는 종료 조건에 도달할 때까지 반복할 수 있는 시스템이다.",
          "Agent는 한 번 Tool을 호출하는 Model이 아니라 결과를 다시 보고 다음 행동을 선택할 수 있는 반복 시스템이다.",
        ],
      },
    ],
  },
  {
    id: "build-agent",
    number: "16",
    title: "Build the Agent",
    act: 5,
    actTitle: "AGENT",
    actPosition: 1,
    actQuestion: "Model과 Loop를 실제 Coding Agent로 만드는 전체 시스템은 무엇인가?",
    details: [
      {
        title: "Model is central, but not alone",
        paragraphs: [
          "Model은 Agent의 판단과 출력 생성에서 핵심 역할을 한다. 하지만 실제 Repository side effect, test execution, permission control 등은 broader system responsibilities다.",
        ],
      },
      { title: "CONTEXT", paragraphs: ["현재 Model 판단에 사용할 정보와 그 관리 책임."] },
      {
        title: "REPOSITORY / TOOLS",
        paragraphs: ["Search, read, edit, patch, shell, tests 같은 external capabilities. Tool execution location과 implementation은 제품마다 다르다."],
      },
      {
        title: "EXECUTION",
        paragraphs: ["Structured request를 actual capability에 연결하고 필요에 따라 result/error를 다룬다. 이는 책임 영역이며 universal component name이 아니다."],
      },
      {
        title: "CONTROL",
        paragraphs: ["Permissions, sandbox, approval, guardrails, validation이 대표적이다. 모든 Agent가 정확히 같은 집합을 사용하는 것은 아니다."],
      },
      {
        title: "Validation",
        paragraphs: ["‘수정했다’는 text를 믿는 대신 실제 결과를 검사한다."],
        bullets: ["unit test", "integration test", "build", "lint", "type check", "diff review"],
      },
      {
        title: "What is an Agent Harness?",
        paragraphs: [
          "Agent Harness는 Model을 working Agent experience로 만드는 broader surrounding system을 가리키는 유용한 shorthand다. 표준화된 필수 architecture term은 아니며 framework마다 Agent, Runner, Runtime, Harness의 경계가 다르다.",
        ],
      },
    ],
    references: [refs.agents, refs.tools, refs.safety],
  },
  {
    id: "different-agent",
    number: "17",
    title: "Same Model, Different Agent",
    act: 5,
    actTitle: "AGENT",
    actPosition: 2,
    details: [
      {
        title: "What the comparison means",
        paragraphs: [
          "이 장면은 Model capability가 중요하지 않다는 뜻이 아니다. Model의 reasoning/coding ability는 Agent quality에 강하게 영향을 줄 수 있다.",
          "핵심은 실제 Agent experience가 instructions, Context quality, available Tools, Tool quality, environment, permissions, validation, loop orchestration에도 좌우될 수 있다는 것이다.",
        ],
      },
      {
        title: "Tool quality matters",
        paragraphs: [
          "search_code라는 이름의 Tool도 단순 text search일 수도 있고 richer symbol/semantic system일 수도 있다. Tool이 존재한다는 사실만으로 같은 품질이 보장되지는 않는다.",
        ],
      },
      {
        title: "Context quality matters",
        paragraphs: ["MORE CONTEXT와 BETTER CONTEXT는 동의어가 아니다."],
      },
      {
        title: "Validation changes outcomes",
        paragraphs: [
          "두 시스템이 같은 첫 patch를 만들더라도 한쪽만 실제 test와 revision을 수행한다면 결과는 달라질 수 있다.",
        ],
      },
      {
        title: "Comparison caveat",
        paragraphs: [
          "이는 conceptual comparison이며 empirical benchmark나 특정 상용 제품에 관한 주장이 아니다.",
        ],
      },
    ],
  },
  {
    id: "developer-questions",
    number: "18",
    title: "What Should Developers Look At?",
    act: 5,
    actTitle: "AGENT",
    actPosition: 3,
    details: [
      {
        title: "WHAT DOES IT SEE?",
        paragraphs: ["현재 AI가 어떤 정보를 근거로 판단하고 있는가?"],
        bullets: ["working directory", "project instructions", "files read", "search results", "logs", "previous tool results", "conversation history"],
      },
      {
        title: "WHAT CAN IT DO?",
        paragraphs: ["Tool scope는 도달 가능한 Task scope에 영향을 준다."],
        bullets: ["Search", "Read", "Edit", "Shell", "Test", "Browser/API", "Git"],
      },
      {
        title: "WHAT IS IT ALLOWED TO DO?",
        paragraphs: ["Permission이 더 많다고 자동으로 더 좋은 것은 아니다."],
        bullets: ["workspace write boundary", "Shell restrictions", "network access", "external paths", "approval requirements"],
      },
      {
        title: "HOW IS IT VERIFIED?",
        paragraphs: ["Agent가 ‘수정했습니다’라고 말하는 것만으로는 충분한 검증이 아니다."],
        bullets: ["Test", "Build", "Lint", "Type Check", "Diff", "Human Review"],
      },
    ],
  },
  {
    id: "incident-return",
    number: "19",
    title: "Back to the Incident",
    act: 5,
    actTitle: "AGENT",
    actPosition: 4,
    details: [
      { title: "READ LOG", code: ["TOOL EXECUTION → TOOL RESULT → CURRENT CONTEXT"] },
      { title: "SEARCH", code: ["CURRENT CONTEXT → MODEL CALL → TOOL REQUEST → EXECUTION"] },
      { title: "READ FILE", code: ["MODEL REQUEST → FILE TOOL → TOOL RESULT → UPDATED CONTEXT"] },
      { title: "PATCH", code: ["MODEL OUTPUT → EDIT/PATCH REQUEST → EXECUTION → WORKSPACE CHANGE"] },
      { title: "TEST FAILED", code: ["TEST EXECUTION → FAILURE RESULT → UPDATED CONTEXT"] },
      { title: "RETRY", code: ["UPDATED CONTEXT → NEXT MODEL CALL → NEXT ACTION"] },
      { title: "VERIFY", code: ["TEST PASS → VALIDATION → COMPLETE"] },
      {
        title: "What changed?",
        paragraphs: [
          "행동은 Scene 01과 같다. 처음에는 하나의 불투명한 AI ACTION처럼 보였다. 이제 MODEL / CONTEXT / REQUEST / EXECUTION / RESULT / LOOP / VALIDATION으로 분해할 수 있다.",
          "화면보다 Viewer의 해석이 달라졌다.",
        ],
      },
    ],
  },
  {
    id: "synthesis",
    number: "20",
    title: "Final Synthesis",
    act: 5,
    actTitle: "AGENT",
    actPosition: 5,
    details: [
      {
        title: "The statement does not mean the Model is unimportant",
        paragraphs: [
          "Model은 Coding Agent의 핵심 구성요소다. 하지만 Agent의 실제 행동은 Model 단독으로 만들어지지 않는다.",
          "Model은 Context를 받고 output/Tool Request를 생성하며, system을 통해 새로운 result를 받고 다음 action을 선택할 수 있다.",
          "주변 시스템 책임에는 execution, tools, permissions, sandbox, validation, approval, loop control 등이 포함될 수 있다.",
        ],
      },
      {
        title: "Conceptual definition used in this work",
        paragraphs: [
          "Coding Agent는 Language Model을 실제 개발 Environment와 연결하여, 현재 상태를 바탕으로 필요한 행동을 선택하고 그 실행 결과를 다시 다음 판단에 사용할 수 있도록 구성된 시스템이다.",
          "이는 이 학습 자료에서 사용하는 conceptual definition이며 모든 framework가 정확히 같은 formal definition을 쓴다는 주장은 아니다.",
        ],
      },
      {
        title: "Why definitions differ",
        paragraphs: [
          "Agent, Runner, Runtime, Harness, Orchestrator는 framework마다 서로 다른 경계를 가리킬 수 있다. 이 자료는 하나의 universal naming scheme보다 responsibilities를 가르친다.",
        ],
      },
      {
        title: "Final mental model",
        code: ["CURRENT CONTEXT\n      ↓\n    MODEL\n      ↓\n TOOL REQUEST\n      ↓\n  EXECUTION\n      ↓\n     TOOL\n      ↓\n ENVIRONMENT\n      ↓\n TOOL RESULT\n      ↓\nUPDATED CONTEXT\n      ↺", "PERMISSIONS / SANDBOX / APPROVAL / VALIDATION / LOOP CONTROL"],
      },
    ],
    references: [refs.agents, refs.running, refs.context, refs.tools, refs.safety],
  },
  {
    id: "appendix",
    number: "A1",
    title: "LLM to AGENT Artwork",
    act: null,
    details: [
      {
        title: "About the artwork",
        paragraphs: [
          "이 삽화는 특정 Coding Agent 제품의 실제 내부 Architecture Diagram이 아니다. 자료 전체에서 설명한 개념을 하나의 시각적 장면으로 압축한 Conceptual Artwork다.",
          "각 요소는 실제 Component를 1:1로 복제하기보다 책임과 관계를 상징한다.",
        ],
      },
      { title: "MODEL", paragraphs: ["현재 Context를 입력받고 출력을 생성하는 핵심 Model을 상징한다. THE MODEL GENERATES TOKENS.의 출발점이지만 전체 화면을 독점하지 않는다."] },
      { title: "CONTEXT", paragraphs: ["User Goal, Instructions, Code, Log, Tool Results 등 현재 판단에 사용되는 정보 흐름을 상징한다. Repository 전체가 이미 Model 내부에 있다는 뜻은 아니다."] },
      { title: "TOOL REQUEST", paragraphs: ["Model에서 Environment 방향으로 나가는 signal은 행동 그 자체가 아니라 행동 요청을 나타낸다. MODEL REQUESTS."] },
      { title: "BOUNDARY", paragraphs: ["Model output과 실제 side effect 사이의 책임 경계를 상징한다. Requested와 Executed는 다르다."] },
      { title: "EXECUTION", paragraphs: ["요청이 실제 capability와 연결되는 시스템 책임을 나타낸다. SYSTEM EXECUTES."] },
      { title: "ENVIRONMENT", paragraphs: ["Repository, File System, Shell, Test Runner, external services 등 실제 개발 작업이 발생하고 feedback을 얻는 외부 환경을 나타낸다."] },
      { title: "TOOL RESULT", paragraphs: ["Environment의 결과가 다음 판단에 사용할 수 있는 정보로 돌아오는 흐름을 의미한다. Model parameter retraining을 의미하지 않는다."] },
      { title: "LOOP", paragraphs: ["MODEL → REQUEST → EXECUTION → RESULT → UPDATED CONTEXT → MODEL의 반복적 interaction을 상징한다. 모든 Agent 제품의 실제 내부 순서를 그대로 묘사하는 것은 아니다."] },
      { title: "CONTROL", paragraphs: ["Permission, Sandbox, Approval, Validation 등의 제한과 검증 책임을 상징한다."] },
      {
        title: "Final interpretation",
        paragraphs: ["Coding Agent를 Model과 Environment 사이의 상태·행동·Feedback Loop로 바라보는 개념적 Mental Model을 한 장에 압축한 작품."],
      },
    ],
  },
];

export const TOTAL_SCENES = scenes.length;
