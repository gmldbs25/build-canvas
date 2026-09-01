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
  claudeTools: {
    label: "Anthropic — Tool use with Claude",
    url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview",
  },
};

export const scenes: SceneDefinition[] = [
  {
    id: "intro",
    number: "00",
    title: "LLM to AGENT",
    act: null,
    details: [
      {
        title: "하나의 질문",
        paragraphs: [
          "Coding Agent에게 운영 서버에서 발생한 오류 로그를 주고 이렇게 요청했다고 해보자.",
          "“원인을 확인하고 코드를 수정한 뒤, 테스트까지 검증해줘.”",
          "잠시 뒤 Agent는 로그를 확인하고, Repository에서 관련 코드를 찾고, 파일을 읽고, 수정안을 적용하고, 테스트를 실행한다.",
        ],
      },
      {
        title: "겉으로 보이는 행동",
        paragraphs: [
          "첫 번째 수정이 실패하면 결과를 확인해 다시 코드를 고치기도 한다.",
          "겉으로 보면 하나의 AI가 Repository를 이해하고 직접 여러 행동을 수행하는 것처럼 보인다.",
          "그런데 여기서 한 가지 질문이 생긴다.",
        ],
      },
      {
        title: "다음 Token에서 Coding Agent까지",
        paragraphs: [
          "Language Model의 기본 생성 과정은 현재 입력을 바탕으로 다음 Token을 생성하고, 그 과정을 반복해 출력을 만드는 것이다.",
          "그렇다면 다음 Token을 생성하는 Model을 중심으로, Repository를 읽고 코드를 수정하고 테스트하는 Coding Agent는 어떻게 만들어질까?",
          "이 글은 그 질문을 다섯 단계로 나누어 살펴본다.",
        ],
      },
      {
        title: "다섯 단계",
        paragraphs: ["먼저 MODEL에서 Language Model 자체가 무엇을 생성하는지 본다."],
        bullets: [
          "그다음 CONTEXT에서 Model이 무엇을 보고 판단하는지 살펴본다.",
          "BOUNDARY에서는 Model의 출력과 실제 Environment의 행동을 구분한다.",
          "LOOP에서는 한 번의 행동과 그 결과가 어떻게 다음 행동으로 이어지는지 본다.",
          "마지막으로 AGENT에서 지금까지 분리한 책임을 다시 하나의 시스템으로 조립한다.",
        ],
      },
      {
        title: "출발점",
        paragraphs: ["출발점은 Coding Agent가 해결해야 할 하나의 운영 장애다."],
      },
    ],
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
        title: "운영 장애",
        paragraphs: ["운영 서버에서 다음 오류가 발생했다."],
        code: [
          "java.lang.NullPointerException\n    at UserMapper.toResponse(UserMapper.java:42)\n    at UserService.getUser(UserService.java:87)\n    at UserController.getUser(UserController.java:51)",
        ],
      },
      {
        title: "현재까지의 단서",
        paragraphs: ["Stack Trace가 가리키는 `UserMapper.java:42`에는 다음 코드가 있다."],
        code: ["user.getProfile().getDisplayName()"],
      },
      {
        title: "아직 알 수 없는 것",
        paragraphs: [
          "지금 알고 있는 것은 여기까지다.",
          "어떤 값이 `null`인지, 왜 이런 데이터가 들어왔는지, 어떤 수정이 올바른지는 아직 알 수 없다.",
          "사용자는 Coding Agent에게 요청한다.",
        ],
      },
      {
        title: "사용자의 요청",
        paragraphs: [
          "“원인을 확인하고 수정한 뒤 테스트까지 검증해줘.”",
        ],
      },
      {
        title: "Agent Workflow",
        paragraphs: ["이 예제에서 관찰할 Agent Workflow는 다음과 같다."],
        code: ["READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY"],
      },
      {
        title: "가장 안쪽의 Model",
        paragraphs: [
          "처음 이 흐름을 보면 하나의 지능적인 프로그램이 처음부터 끝까지 모든 일을 직접 수행하는 것처럼 느껴진다.",
          "하지만 이 행동을 이해하려면 가장 안쪽의 Language Model과 그 주변 시스템을 분리해서 볼 필요가 있다.",
          "Repository도, File System도, Test Runner도 잠시 제거해보자.",
        ],
      },
      {
        title: "Model 자체의 역할",
        paragraphs: [
          "Model 자체는 실제로 무엇을 할까?",
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
        title: "Language Model만 남기기",
        paragraphs: [
          "Language Model만 남겨 놓으면 구조는 훨씬 단순해진다.",
          "Model은 입력을 받고 출력을 생성한다.",
          "일반적인 autoregressive Language Model의 생성 과정을 가장 기본적인 수준에서 보면, 현재 입력을 바탕으로 다음 위치에 올 Token에 대한 값을 계산하는 과정이라고 볼 수 있다.",
        ],
      },
      {
        title: "Token ≠ Word",
        paragraphs: [
          "여기서 Token은 자연어의 단어와 정확히 같은 개념이 아니다.",
          "Tokenizer에 따라 하나의 단어가 여러 Token으로 나뉠 수도 있고, 단어 일부나 공백, 문장부호 등이 Tokenization에 영향을 줄 수도 있다.",
          "따라서 사람이 하나의 단어라고 생각하는 문자열과 Model이 실제로 처리하는 Token의 경계는 항상 일치하지 않는다.",
        ],
      },
      {
        title: "LLM inference와 행동의 구분",
        paragraphs: [
          "여기서 중요한 구분이 하나 있다.",
          "우리는 흔히 “Agent가 파일을 읽었다”, “Agent가 Shell을 실행했다”, “Agent가 코드를 수정했다”고 말한다.",
          "하지만 이것이 LLM inference 자체가 File System을 열거나 OS 명령을 직접 실행했다는 뜻은 아니다.",
        ],
      },
      {
        title: "다음 질문",
        paragraphs: [
          "우선 더 안쪽으로 들어가 보자.",
          "Model이 ‘다음 Token을 예측한다’는 것은 실제로 무엇을 의미할까?",
        ],
      },
    ],
    references: [refs.transformer],
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
        title: "Score와 Logit",
        paragraphs: [
          "현재 입력이 Model에 들어오면 Model은 가능한 Vocabulary Token 각각에 대해 하나의 score를 생성한다.",
          "이 값을 일반적으로 `logit`이라고 부른다.",
          "Softmax를 적용하면 이러한 score를 다음 Token에 대한 확률 분포로 해석할 수 있다.",
        ],
      },
      {
        title: "단순화한 예",
        paragraphs: ["예를 들어 현재 입력이 다음과 같다고 하자."],
        code: ["java.lang.NullPointer ___"],
      },
      {
        title: "예시 값의 범위",
        paragraphs: [
          "설명을 위해 단순화하면 `Exception`, `Error`, `Reference` 같은 여러 후보가 서로 다른 값을 가질 수 있다.",
          "화면에 표시되는 Token 경계와 확률 값은 특정 Model을 실제로 측정한 결과가 아니다.",
          "실제 값은 Model, Tokenizer, 현재 Context에 따라 달라진다.",
        ],
      },
      {
        title: "Decoding",
        paragraphs: [
          "그리고 다음 Token이 항상 가장 높은 score의 후보로 결정되는 것도 아니다.",
          "생성 설정에 따라 가장 높은 score를 선택할 수도 있고, 확률 분포를 이용해 sampling할 수도 있다.",
          "따라서 조금 더 정확하게 표현하면 다음과 같다.",
        ],
      },
      {
        title: "더 정확한 표현",
        paragraphs: [
          "Model은 다음 Token을 위한 score를 생성하고, decoding 과정을 통해 실제 다음 Token이 결정된다.",
        ],
      },
      {
        title: "다음 예측의 조건",
        paragraphs: [
          "하지만 하나의 Token이 결정되었다고 출력이 끝나는 것은 아니다.",
          "결정된 Token은 다시 다음 예측의 조건이 된다.",
        ],
      },
    ],
    references: [refs.transformer],
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
        title: "Autoregressive repetition",
        paragraphs: [
          "하나의 Token이 결정되면 그 Token은 현재 Sequence에 추가된다.",
          "그리고 늘어난 Sequence를 조건으로 다시 다음 Token을 계산한다.",
          "개념적으로 생성 과정은 다음과 같이 반복된다.",
        ],
        code: ["CURRENT SEQUENCE\n→ NEXT-TOKEN SCORES\n→ DECODING\n→ NEXT TOKEN\n→ APPEND\n→ NEXT PREDICTION"],
      },
      {
        title: "긴 출력이 만들어지는 방식",
        paragraphs: [
          "이 반복을 통해 한 문장을 만들 수도 있고, 긴 설명이나 여러 줄의 코드도 생성할 수 있다.",
          "실제 inference에서는 KV Cache 같은 최적화를 통해 이전 계산의 일부를 재사용할 수 있기 때문에 매 Token마다 모든 계산을 완전히 처음부터 반복한다고 이해할 필요는 없다.",
          "하지만 지금 필요한 핵심은 구현 최적화가 아니다.",
        ],
      },
      {
        title: "Model 자체에 대한 첫 번째 답",
        paragraphs: [
          "아무리 복잡한 출력을 만들더라도 Language Model의 기본 생성 과정은 Token 단위의 autoregressive generation이다.",
          "여기까지가 Model 자체에 대한 첫 번째 답이다.",
          "그렇다면 다음 질문이 생긴다.",
        ],
      },
      {
        title: "다음 질문",
        paragraphs: [
          "Model은 무엇을 근거로 다음 Token을 계산할까?",
        ],
      },
    ],
    references: [refs.transformer],
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
        title: "Context의 범위",
        paragraphs: [
          "이 글에서 Context는 기본적으로 현재 한 번의 Model Call에서 LLM이 볼 수 있도록 제공된 정보를 의미한다.",
          "Coding Agent의 한 Model Call에는 예를 들어 다음과 같은 정보가 포함될 수 있다.",
        ],
        bullets: [
          "System Instructions",
          "User Request",
          "Previous Messages",
          "Error Log",
          "Source Code",
          "Previous Tool Results",
        ],
      },
      {
        title: "EXISTS ≠ IN CONTEXT",
        paragraphs: [
          "여기서 매우 중요한 구분이 하나 있다.",
          "`UserMapper.java`라는 파일이 Repository에 존재한다는 사실과, 그 파일의 내용이 현재 Model Call에 포함되어 있다는 사실은 서로 다르다.",
          "EXISTS ≠ IN CONTEXT",
        ],
      },
      {
        title: "Context Window",
        paragraphs: [
          "Repository에 파일이 존재한다고 해서 Model이 그 내용을 자동으로 보고 있는 것은 아니다.",
          "Model은 한 번의 호출에서 처리할 수 있는 입력 범위에도 한계가 있다.",
          "따라서 수천 개의 파일을 가진 Repository 전체가 항상 한 번의 Model Input에 들어간다고 생각해서는 안 된다.",
        ],
      },
      {
        title: "이 글에서 사용하는 CONTEXT",
        paragraphs: [
          "실제 Agent Framework에서 `context`라는 단어는 Application이 관리하는 Runtime State를 의미하기도 한다.",
          "하지만 이 글에서 CONTEXT라고 할 때는 우선 현재 Model Call에서 LLM이 볼 수 있는 정보라는 의미로 이해하면 된다.",
          "그렇다면 Context 안에 여러 정보가 들어왔을 때 Model은 그 정보를 어떻게 함께 사용할까?",
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
        title: "Context 안의 관계",
        paragraphs: [
          "Context는 서로 독립된 Token을 한곳에 모아 둔 단순한 목록이 아니다.",
          "Transformer의 Self-Attention을 통해 현재 접근 가능한 위치들의 representation은 서로의 내용에 영향을 받을 수 있다.",
          "코드에서도 비슷하게 생각할 수 있다.",
        ],
      },
      {
        title: "Attention의 핵심 직관",
        paragraphs: [
          "변수의 선언 위치와 그 변수를 사용하는 위치가 서로 멀리 떨어져 있더라도 두 정보가 현재 Context 안에 있다면 Model의 계산에서 서로 관련된 정보로 작용할 수 있다.",
          "이 장에서 Attention의 모든 내부 구조를 이해할 필요는 없다.",
          "핵심은 이것이다.",
        ],
      },
      {
        title: "서로 떨어진 정보의 영향",
        paragraphs: [
          "Context 안에서는 서로 떨어진 정보도 Model의 계산에 영향을 줄 수 있다.",
        ],
      },
      {
        title: "과도한 해석을 피하기",
        paragraphs: [
          "다만 이를 인간의 이해와 동일하게 해석해서는 안 된다.",
          "두 코드 위치를 선으로 연결했다고 해서 Model이 인간처럼 그 관계의 의미를 명시적으로 이해했다거나, 특정 Attention Head 하나가 정확히 그 관계만을 표현했다고 단정할 수는 없다.",
          "여기서는 이 정도의 직관이면 충분하다.",
        ],
      },
      {
        title: "Repository와의 구분",
        paragraphs: [
          "그리고 이 설명은 더 중요한 사실로 이어진다.",
          "Context 안의 정보를 활용할 수 있다는 것과 Repository 전체를 이미 알고 있다는 것은 전혀 다른 문제다.",
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
        title: "Repository 전체가 Context는 아니다",
        paragraphs: [
          "실제 프로젝트에는 수천 개의 파일이 존재할 수 있다.",
          "하지만 그 파일들이 전부 현재 Model Call의 Context에 들어가는 것은 아니다.",
          "예를 들어 Repository에 2,418개의 파일이 있다고 해도 현재 장애를 분석하는 데 필요한 정보는 그중 일부뿐일 수 있다.",
        ],
      },
      {
        title: "필요한 정보의 선택",
        paragraphs: [
          "그래서 Agent 시스템에서는 현재 Task에 필요한 정보를 찾고 선택해 Model에게 제공하는 과정이 필요하다.",
          "Repository Search를 통해 후보 파일을 찾을 수 있고, 필요한 파일을 다시 읽을 수도 있다.",
          "긴 파일에서 특정 부분만 선택하거나, 이전 History와 Tool Result를 요약하거나 압축할 수도 있다.",
        ],
      },
      {
        title: "Context Management",
        paragraphs: [
          "이런 과정들을 넓게 Context Management의 일부로 볼 수 있다.",
        ],
      },
      {
        title: "Search Result ≠ Model Context",
        paragraphs: [
          "Search Result와 실제 Model Context 역시 같은 것은 아니다.",
          "Search Tool이 여러 파일 이름을 반환했다고 해서 그 파일의 전체 내용이 모두 Model Input에 들어갔다는 뜻은 아니다.",
          "추가 File Read를 수행한 뒤 필요한 내용만 다음 Model Call에 포함할 수도 있다.",
        ],
      },
      {
        title: "MORE CONTEXT ≠ BETTER CONTEXT",
        paragraphs: [
          "그래서 단순히 가능한 한 많은 정보를 넣는 것이 목표가 되어서는 안 된다.",
          "MORE CONTEXT ≠ BETTER CONTEXT",
          "더 많은 Context가 항상 더 좋은 Context를 의미하는 것은 아니다.",
        ],
      },
      {
        title: "불필요한 정보의 비용",
        paragraphs: [
          "불필요한 정보는 Token Budget을 사용하고 중요한 정보의 비율을 낮출 수도 있다.",
        ],
      },
      {
        title: "현재 Task에 적절한 Context",
        paragraphs: [
          "중요한 것은 현재 Task를 해결하는 데 필요한 정보가 적절하게 선택되어 있는가다.",
          "ACT 2의 결론은 다음과 같다.",
          "Model은 Repository 전체를 자동으로 알고 판단하는 것이 아니다. 현재 Model Call에 제공된 Context를 바탕으로 판단한다.",
        ],
      },
      {
        title: "Context 밖의 Environment",
        paragraphs: [
          "그렇다면 필요한 정보가 아직 Context 밖의 Repository에 있다면 어떻게 해야 할까?",
          "Model은 Context 밖의 Environment와 어떻게 연결될까?",
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
    actQuestion: "Context에 없는 정보는 어떻게 실제 Environment에서 가져오는가?",
    details: [
      {
        title: "구조화된 행동 요청",
        paragraphs: [
          "Model이 다음 행동으로 특정 파일을 읽을 필요가 있다고 판단했다고 하자.",
          "Tool을 사용할 수 있는 시스템에서는 Model이 다음과 같은 구조화된 행동 요청을 생성할 수 있다.",
        ],
        code: ["read_file(\"src/UserMapper.java\")"],
      },
      {
        title: "REQUESTED ≠ EXECUTED",
        paragraphs: [
          "하지만 이 출력이 만들어졌다고 해서 `UserMapper.java`가 이미 읽힌 것은 아니다.",
          "파일 내용이 자동으로 Context에 들어온 것도 아니다.",
          "REQUESTED ≠ EXECUTED",
        ],
      },
      {
        title: "서로 다른 두 사건",
        paragraphs: [
          "Tool Request와 실제 Environment의 Side Effect는 서로 다른 사건이다.",
        ],
      },
      {
        title: "표현 형식보다 중요한 것",
        paragraphs: [
          "Tool을 지원하는 시스템은 Model에게 사용할 수 있는 Tool과 각 Tool이 받을 수 있는 입력 형식을 알려줄 수 있다.",
          "Model은 그 정보에 맞춰 어떤 Tool을 어떤 입력과 함께 사용하고 싶은지를 나타내는 structured action request를 생성할 수 있다.",
          "설명을 쉽게 하기 위해 이런 요청을 JSON이나 함수 호출과 비슷한 형태로 표현할 수 있다.",
        ],
      },
      {
        title: "표준 문자열 형식은 아니다",
        paragraphs: [
          "하지만 모든 Model과 Agent 제품에서 Tool Call이 반드시 같은 문자열 형식으로 만들어진다는 뜻은 아니다.",
        ],
      },
      {
        title: "Request는 Action이 아니다",
        paragraphs: [
          "중요한 것은 표현 형식이 아니다.",
          "Model이 외부 행동을 요청하는 구조화된 출력을 만들 수 있다는 것이다.",
          "그리고 행동을 요청했다고 해서 반드시 실행되는 것도 아니다.",
        ],
      },
      {
        title: "MODEL DECISION ≠ EXECUTION AUTHORITY",
        paragraphs: [
          "요청은 실행될 수도 있고, 거부될 수도 있고, 사용자 승인을 기다릴 수도 있으며, 권한 검증이나 실제 실행 과정에서 실패할 수도 있다.",
          "따라서 다음 두 사건을 구분해야 한다.",
          "MODEL DECISION ≠ EXECUTION AUTHORITY",
        ],
      },
      {
        title: "요청과 실제 행동",
        paragraphs: [
          "Model이 행동을 요청했다는 것과 실제 Environment에서 행동이 일어났다는 것은 다르다.",
          "그렇다면 누가 그 요청을 실제 행동으로 바꿀까?",
        ],
      },
    ],
    references: [refs.tools, refs.claudeTools],
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
        title: "Execution 책임",
        paragraphs: [
          "이 글에서는 Model이 만든 행동 요청을 실제 Environment의 Capability와 연결하는 책임을 Execution이라고 부른다.",
          "Model이 다음 요청을 생성했다고 하자.",
        ],
        code: ["read_file(\"src/UserMapper.java\")"],
      },
      {
        title: "개념적인 실행 경로",
        paragraphs: [
          "시스템은 이 요청을 해석하고 실행 가능한 요청인지 확인한 뒤 실제 File Read Capability와 연결할 수 있다.",
          "설명을 위해 다음과 같은 경로로 표현할 수 있다.",
        ],
        code: ["REQUEST → VALIDATE → PERMISSION → EXECUTE"],
      },
      {
        title: "Component 이름보다 책임의 분리",
        paragraphs: [
          "하지만 실제 모든 Coding Agent가 정확히 네 단계의 Pipeline을 같은 순서로 구현한다는 뜻은 아니다.",
          "중요한 것은 구체적인 Component 이름이 아니라 책임의 분리다.",
          "`read_file`은 하나의 Tool Capability다.",
        ],
      },
      {
        title: "요청과 Tool을 연결하는 시스템",
        paragraphs: [
          "반면 Model의 요청을 실제 Tool에 전달하고, 실행 가능 여부를 판단하고, 실행 결과나 Error를 Agent Workflow에 반환하는 것은 별도의 시스템 책임이다.",
          "제품이나 Framework에 따라 이 책임은 Runner, Runtime, Orchestrator, Controller, Host Application 또는 Hosted Service 등 여러 곳에 나뉠 수 있다.",
          "따라서 `Execution Layer`라는 말을 모든 Agent가 반드시 가지고 있는 표준 Component 이름으로 이해할 필요는 없다.",
        ],
      },
      {
        title: "기억해야 할 사실",
        paragraphs: [
          "기억해야 할 사실은 하나다.",
          "Model의 요청과 실제 Environment의 행동 사이에는 별도의 실행 책임이 존재한다.",
        ],
      },
    ],
    references: [refs.tools, refs.claudeTools, refs.safety],
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
        title: "ACT 3의 핵심",
        paragraphs: [
          "ACT 3에서 기억해야 할 핵심은 아주 짧다.",
          "Model은 현재 Context를 바탕으로 행동을 요청할 수 있다.",
          "그러나 실제 File System을 읽고, Workspace를 수정하고, Shell이나 Test Runner를 실행하는 Side Effect는 실행 가능한 시스템에서 발생한다.",
        ],
      },
      {
        title: "MODEL REQUESTS. SYSTEM EXECUTES.",
        paragraphs: [
          "즉,",
          "MODEL REQUESTS.",
          "SYSTEM EXECUTES.",
        ],
      },
      {
        title: "서로 다른 책임",
        paragraphs: [
          "Model의 출력과 Environment의 행동은 서로 다른 책임이다.",
        ],
      },
      {
        title: "다음 질문",
        paragraphs: [
          "이제 실제 Environment에서 행동이 일어났다고 하자.",
          "그 실행 결과는 어떻게 다시 Model의 다음 판단으로 이어질까?",
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
        title: "새로운 정보",
        paragraphs: [
          "Execution을 통해 `UserMapper.java`가 실제로 읽히면 Tool은 결과를 반환한다.",
          "이 결과는 이후 판단에 사용할 수 있는 새로운 정보가 될 수 있다.",
          "파일을 읽기 전에는 다음 정도의 정보만 있었다고 하자.",
        ],
        code: ["USER REQUEST\nMODEL TOOL REQUEST"],
      },
      {
        title: "Tool Result가 돌아옴",
        paragraphs: ["파일을 읽은 뒤에는 다음 정보가 새롭게 생길 수 있다."],
        code: ["TOOL RESULT: UserMapper.java contents"],
      },
      {
        title: "TOOL RESULT ≠ TRAINING",
        paragraphs: [
          "즉 Environment에 있던 정보가 Tool Result 형태로 Agent Workflow에 돌아온 것이다.",
          "여기서 중요한 구분이 있다.",
          "TOOL RESULT ≠ TRAINING",
        ],
      },
      {
        title: "현재 Run에 생긴 정보",
        paragraphs: [
          "파일을 읽었다고 Model Parameter가 업데이트되는 것은 아니다.",
          "Model이 이 Repository의 내용을 영구적으로 학습한 것도 아니다.",
          "현재 Agent Run에 새로운 정보가 생겼고, 이후 Model Call에서 그 정보를 사용할 수 있게 된 것이다.",
        ],
      },
      {
        title: "다음 Model Context",
        paragraphs: [
          "실제 구현에서는 Tool Result 전체가 항상 그대로 Model Input에 들어가는 것도 아니다.",
          "필요에 따라 Result를 필터링하거나 요약하고 일부 정보만 다음 Model Context에 포함할 수 있다.",
          "핵심은 다음과 같다.",
        ],
      },
      {
        title: "다음 판단에 사용할 정보",
        paragraphs: [
          "Environment에서 얻은 결과는 다음 판단에 사용할 수 있는 정보가 될 수 있다.",
          "이 정보를 반영해 Model을 다시 호출하면 한 번의 Tool Call이 다음 행동으로 이어질 수 있다.",
        ],
      },
    ],
    references: [refs.running, refs.context, refs.claudeTools],
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
        title: "반복 구조",
        paragraphs: [
          "이제 지금까지의 요소를 하나의 반복 구조로 연결할 수 있다.",
          "사용자에게 하나의 Goal이 있다.",
          "현재 Context와 Goal이 Model에 들어간다.",
        ],
      },
      {
        title: "행동과 결과",
        paragraphs: [
          "Model은 다음 행동을 위한 Tool Request를 생성할 수 있다.",
          "Execution System은 요청을 실제 Tool과 연결한다.",
          "Tool은 Environment에서 작업하고 Result를 반환한다.",
        ],
      },
      {
        title: "State와 다음 Context",
        paragraphs: [
          "그 결과가 Agent의 현재 상태에 반영된다.",
          "그리고 다음 Model Call에 필요한 Context가 구성된다.",
          "개념적으로는 다음과 같다.",
        ],
        code: [
          "GOAL + CURRENT CONTEXT\n→ MODEL\n→ TOOL REQUEST\n→ EXECUTION\n→ TOOL RESULT\n→ UPDATED STATE\n→ NEXT MODEL CONTEXT\n→ NEXT MODEL CALL",
        ],
      },
      {
        title: "Model Call과 Agent Run",
        paragraphs: [
          "여기서 Model Call과 Agent Run을 구분하면 구조가 더 명확해진다.",
          "Model Call은 Model에 대한 한 번의 호출이다.",
          "Agent Run은 하나의 User Goal을 수행하기 위해 여러 Model Call과 여러 Tool Execution을 포함할 수 있는 전체 작업 단위다.",
        ],
      },
      {
        title: "MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE.",
        paragraphs: [
          "그리고 또 하나 중요한 구분이 있다.",
          "MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE.",
          "Agent Run이 진행되는 동안 시스템에는 Tool History, Approval 상태, Iteration 정보 같은 실행 상태가 유지될 수 있다.",
        ],
      },
      {
        title: "Prompt 하나가 끝없이 길어지는 구조가 아니다",
        paragraphs: [
          "Workspace 자체에도 수정된 파일처럼 Environment State가 남아 있을 수 있다.",
          "하지만 이러한 모든 정보가 매 Model Call마다 그대로 Context Window에 들어가는 것은 아니다.",
          "시스템은 다음 판단에 필요한 정보만 선택하거나, 이전 정보를 요약·압축하여 제공할 수 있다.",
        ],
      },
      {
        title: "Agent Loop에 대한 오해",
        paragraphs: [
          "따라서 Agent Loop를 하나의 Prompt가 끝없이 길어지는 과정으로 이해하는 것은 정확하지 않다.",
        ],
      },
      {
        title: "최소 Mental Model",
        paragraphs: [
          "실제 Agent Architecture에는 Parallel Tool Call, Planning, Handoff, Sub-agent, Persistent State 등 더 복잡한 구조가 존재할 수도 있다.",
          "하지만 지금 필요한 최소 Mental Model은 단순하다.",
          "Model이 행동을 요청하고, Environment의 결과가 돌아오며, 그 결과를 반영해 다시 다음 행동을 선택할 수 있다.",
        ],
      },
      {
        title: "NPE에 적용하기",
        paragraphs: [
          "이제 이 추상적인 Loop를 처음의 NullPointerException에 적용해보자.",
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
        title: "출발점은 운영 Log",
        paragraphs: [
          "하나의 가능한 Agent Run을 따라가 보자.",
          "출발점은 운영 Log다.",
          "현재 알고 있는 가장 직접적인 단서는 다음과 같다.",
        ],
        code: ["UserMapper.java:42"],
      },
      {
        title: "Repository Search",
        paragraphs: [
          "먼저 Repository에서 관련 코드를 찾는다.",
          "Model은 다음과 같은 Search 행동을 요청할 수 있다.",
        ],
        code: ["search_code(\"UserMapper\")"],
      },
      {
        title: "Search Result",
        paragraphs: ["Search Tool을 실행하면 다음과 같은 후보를 찾을 수 있다."],
        code: ["src/main/java/.../UserMapper.java\nsrc/test/java/.../UserMapperTest.java"],
      },
      {
        title: "Mapper 구현 읽기",
        paragraphs: ["다음 Model Call에서는 실제 Mapper 구현을 확인하기 위해 파일 읽기를 요청할 수 있다."],
        code: ["read_file(\"src/main/java/.../UserMapper.java\")"],
      },
      {
        title: "line 42의 코드",
        paragraphs: ["파일이 읽히면 Stack Trace가 가리킨 line 주변에서 다음 코드를 확인할 수 있다."],
        code: ["user.getProfile().getDisplayName()"],
      },
      {
        title: "추가 조사",
        paragraphs: [
          "이제 처음보다 정보가 많아졌다.",
          "하지만 이 코드 한 줄만 보고 바로 원인을 확정할 필요는 없다.",
          "`user`, `profile`, 또는 그 이후 접근 과정에서 어떤 값이 `null`인지 확인해야 한다.",
        ],
      },
      {
        title: "타입·생성 경로·Fixture 추적",
        paragraphs: [
          "따라서 관련 타입이나 사용 위치를 추가로 추적할 수 있다.",
          "예를 들어 `User`의 Profile 관련 정의와 생성 경로, Fixture 또는 관련 코드를 검색해보자.",
          "그 과정에서 일부 기존 데이터에서는 `profile`이 존재하지 않을 수 있다는 사실을 확인했다고 하자.",
        ],
      },
      {
        title: "profile == null 가설",
        paragraphs: [
          "이제 두 정보를 함께 볼 수 있다.",
          "첫 번째는 Stack Trace가 `UserMapper.java:42`를 가리킨다는 것이다.",
          "두 번째는 해당 line에서 `user.getProfile().getDisplayName()`을 호출하고 있으며, `profile`이 없는 User가 실제로 존재할 수 있다는 것이다.",
        ],
      },
      {
        title: "유력한 NPE 원인",
        paragraphs: [
          "이제 `profile == null`이 현재 NullPointerException의 유력한 원인이라는 가설에 충분한 근거가 생긴다.",
        ],
      },
      {
        title: "원인은 Context를 통해 발견된다",
        paragraphs: [
          "문제의 원인은 처음부터 Model이 알고 있던 것이 아니다.",
          "Log와 Repository에서 필요한 정보를 차례로 Context에 추가하면서 원인을 좁혀간 것이다.",
        ],
      },
      {
        title: "최소 Patch와 실제 검증",
        paragraphs: [
          "이 Run에서는 우선 NPE를 방어하는 최소 Patch를 적용하고 실제 Test로 검증하는 경로를 택했다고 하자.",
          "Model은 `profile == null`을 처리하는 Patch 내용을 생성하고 Edit 또는 Patch 행동을 요청할 수 있다.",
          "Execution을 통해 요청이 적용되면 실제 Workspace의 파일이 변경된다.",
        ],
      },
      {
        title: "Test Runner",
        paragraphs: [
          "하지만 작업은 여기서 끝나지 않는다.",
          "사용자의 Goal은 코드를 바꾸는 것이 아니라 문제를 수정하고 그 결과까지 검증하는 것이다.",
          "따라서 Test Runner를 실행한다.",
        ],
        code: ["run_tests(\"UserMapperTest\")"],
      },
      {
        title: "또 하나의 새로운 사실",
        paragraphs: [
          "그리고 Test Result가 Agent Workflow에 돌아온다.",
          "여기서 또 하나의 새로운 사실이 드러난다.",
          "NPE를 없애는 것만으로는 올바른 수정이 아닐 수 있다.",
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
        title: "첫 번째 Patch",
        paragraphs: [
          "첫 번째 Patch에서 `profile == null`이면 `displayName`에 `null`을 반환하도록 수정했다고 하자.",
          "이 변경은 NullPointerException 자체를 막을 수 있다.",
          "하지만 실제 Test를 실행했더니 다음 결과가 나왔다.",
        ],
        code: ["expected: \"Unknown\"\nactual: null"],
      },
      {
        title: "Test Failure가 공개한 계약",
        paragraphs: [
          "Test는 실패했다.",
          "여기서 중요한 것은 Agent가 처음부터 `\"Unknown\"`이라는 요구사항을 알고 있었던 것이 아니라는 점이다.",
          "Test Failure를 통해 새로운 계약이 드러났다.",
        ],
      },
      {
        title: "Unknown fallback",
        paragraphs: [
          "`profile`이 없는 경우 단순히 `null`을 반환하는 것이 아니라 `\"Unknown\"`을 사용해야 한다.",
        ],
      },
      {
        title: "실패도 새로운 정보다",
        paragraphs: [
          "앞에서 Environment의 Tool Result가 다음 판단에 사용할 수 있는 정보가 될 수 있다고 보았다.",
          "Test Failure도 마찬가지다.",
          "실패 결과가 현재 Agent Run에 새로운 정보를 추가한다.",
        ],
      },
      {
        title: "달라지는 다음 행동",
        paragraphs: [
          "이제 다음 행동은 달라질 수 있다.",
        ],
      },
      {
        title: "Patch 수정과 재검증",
        paragraphs: ["관련 Test를 직접 읽어 요구되는 동작을 확인하고 Patch를 다시 수정한다."],
        code: ["profile != null ? profile.getDisplayName() : \"Unknown\""],
      },
      {
        title: "PASS",
        paragraphs: [
          "그리고 Test를 다시 실행한다.",
          "이번에는 PASS 결과를 얻는다.",
          "앞에서 본 것처럼 이 과정도 Model을 재학습시키는 것은 아니다.",
        ],
      },
      {
        title: "Feedback이 다음 판단을 바꾼다",
        paragraphs: [
          "새로운 Feedback이 다음 Model Call의 판단 근거가 된 것이다.",
          "Agent Loop의 중요한 가치 중 하나는 첫 번째 출력이 항상 정답이라는 데 있지 않다.",
          "Environment의 Feedback을 다음 행동에 반영할 수 있다는 데 있다.",
        ],
      },
      {
        title: "Loop의 종료",
        paragraphs: [
          "하지만 결과를 계속 받아볼 수 있다고 해서 Loop가 끝없이 반복되어야 하는 것은 아니다.",
        ],
      },
    ],
    references: [refs.running, refs.tools],
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
        title: "Goal에 도달하면 멈춘다",
        paragraphs: [
          "Agent Loop의 목적은 가능한 한 오래 반복하는 것이 아니다.",
          "Goal에 도달하면 멈춰야 한다.",
          "현재 Incident에서는 다음과 같이 끝날 수 있다.",
        ],
        code: ["PATCH\n→ TEST PASS\n→ VERIFY\n→ TASK COMPLETE"],
      },
      {
        title: "성공적인 종료",
        paragraphs: [
          "Test가 통과하고 필요한 검증까지 완료되었다면 더 이상 추가 Tool Action이 필요하지 않을 수 있다.",
          "성공만이 종료 조건인 것도 아니다.",
        ],
      },
      {
        title: "다른 Stop Condition",
        paragraphs: [
          "Agent Run은 사용자 승인을 기다리기 위해 멈출 수도 있다.",
          "필요한 Permission이 거부될 수도 있고, 최대 Iteration에 도달하거나 복구하기 어려운 Error가 발생할 수도 있다.",
          "시간·비용·리소스 제한 역시 종료 조건이 될 수 있다.",
        ],
      },
      {
        title: "Agent Loop의 범위",
        paragraphs: [
          "구체적인 메커니즘은 Framework와 제품마다 다르다.",
          "중요한 것은 이것이다.",
          "Agent Loop에는 Stop Condition이 존재한다.",
        ],
      },
      {
        title: "ACT 4의 답",
        paragraphs: [
          "이 글에서 Agent Loop는 현재 상태를 바탕으로 다음 행동을 선택하고, 실행 결과를 다시 상태에 반영하며, Goal 또는 종료 조건에 도달할 때까지 반복할 수 있는 구조다.",
          "ACT 4의 질문에도 이제 답할 수 있다.",
          "한 번 Tool을 호출하는 것만으로 지속적인 Agent 작업이 만들어지는 것은 아니다.",
        ],
      },
      {
        title: "Agent Run을 만드는 반복 구조",
        paragraphs: [
          "Result를 다시 보고 다음 행동을 선택할 수 있는 반복 구조가 Agent Run을 만든다.",
        ],
      },
      {
        title: "마지막 질문",
        paragraphs: [
          "이제 마지막 질문이 남는다.",
          "이 Loop를 실제 Coding Agent로 만들려면 어떤 시스템이 필요할까?",
        ],
      },
    ],
    references: [refs.running],
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
        title: "MODEL",
        paragraphs: [
          "지금까지 하나씩 분리한 책임을 다시 하나의 시스템 안에 모아보자.",
          "가운데에는 MODEL이 있다.",
          "Model은 현재 Context를 바탕으로 Text Output이나 Tool Request를 생성하는 핵심 역할을 한다.",
        ],
      },
      {
        title: "Model 하나만으로는 부족하다",
        paragraphs: [
          "하지만 Model 하나만으로 Coding Agent 전체가 되지는 않는다.",
        ],
      },
      {
        title: "CONTEXT",
        paragraphs: [
          "먼저 CONTEXT가 필요하다.",
          "Context는 현재 Model Call에서 Model이 무엇을 볼 수 있는지를 결정한다.",
          "User Goal, Instructions, Source Code, Log, Search Result, Tool Result 같은 정보가 어떻게 선택되고 구성되는지는 Model의 다음 판단에 영향을 준다.",
        ],
      },
      {
        title: "TOOLS",
        paragraphs: [
          "다음은 TOOLS다.",
          "Model에게 노출된 Tool Set은 Model이 어떤 외부 행동을 요청할 수 있는지에 영향을 준다.",
          "Search, Read, Edit, Patch, Shell, Test 같은 Capability가 여기에 포함될 수 있다.",
        ],
      },
      {
        title: "EXECUTION",
        paragraphs: [
          "EXECUTION은 Model의 Tool Request를 실제 Capability와 연결한다.",
          "요청을 실제 Environment에서 수행하고 Result 또는 Error를 Workflow에 전달한다.",
        ],
      },
      {
        title: "CONTROL",
        paragraphs: [
          "CONTROL은 무엇이 허용되는지를 관리한다.",
          "Permission, Sandbox, Approval, Guardrail 등이 대표적인 예다.",
          "Control은 다음 질문과 연결된다.",
        ],
      },
      {
        title: "Control의 질문",
        paragraphs: [
          "“이 Agent는 어디까지 행동해도 되는가?”",
        ],
      },
      {
        title: "VALIDATION",
        paragraphs: [
          "반면 VALIDATION은 다른 질문에 답한다.",
          "“Agent가 만든 결과가 실제로 맞는가?”",
          "Test, Build, Lint, Type Check, Diff Review, Human Review 등을 통해 실제 결과를 확인할 수 있다.",
        ],
      },
      {
        title: "Control과 Validation의 차이",
        paragraphs: [
          "Control과 Validation은 서로 관련이 있지만 같은 책임은 아니다.",
          "Control은 행동의 허용 범위를 관리한다.",
          "Validation은 작업 결과의 정확성과 완료 여부를 확인한다.",
        ],
      },
      {
        title: "LOOP",
        paragraphs: [
          "그리고 LOOP가 있다.",
          "Execution Result와 Validation Result를 다음 판단으로 연결하면서 하나의 Model Call이 지속적인 Agent Run으로 이어질 수 있게 한다.",
        ],
      },
      {
        title: "이름보다 책임",
        paragraphs: [
          "이러한 Model 주변의 broader system을 편의상 Agent Harness라고 부르기도 한다.",
          "하지만 Agent, Runner, Runtime, Harness, Orchestrator 같은 이름과 경계는 Framework마다 다를 수 있다.",
          "그래서 이름보다 어떤 책임을 담당하고 있는가를 보는 편이 더 안전하다.",
        ],
      },
      {
        title: "Tool Calling만으로는 부족하다",
        paragraphs: ["여기까지 오면 중요한 결론 하나가 나온다.", "Tool Calling만으로 Coding Agent 전체를 설명할 수는 없다."],
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
        title: "첫 번째 시스템",
        paragraphs: [
          "같은 Language Model을 서로 다른 두 Agent System에 넣었다고 생각해보자.",
          "첫 번째 시스템에서는 오류 Log 정도만 Model에게 제공한다.",
          "사용 가능한 Tool이 적고 Repository에서 필요한 정보를 찾는 기능도 제한적이다.",
        ],
      },
      {
        title: "PATCH GENERATED",
        paragraphs: [
          "Patch 이후 실제 Test와 Validation도 수행하지 않는다.",
          "Model은 주어진 정보만으로 수정안을 생성할 수 있다.",
          "하지만 Workflow는 `PATCH GENERATED` 수준에서 끝날 수 있다.",
        ],
      },
      {
        title: "두 번째 시스템",
        paragraphs: [
          "두 번째 시스템에서는 같은 Model을 사용하지만 환경이 다르다.",
          "Task와 관련된 파일을 찾아 적절한 Context를 구성할 수 있고, Search·Read·Edit·Test Tool을 사용할 수 있다.",
          "Workspace Write 범위가 관리되고 있으며, Patch 이후 실제 Test와 Validation도 수행한다.",
        ],
      },
      {
        title: "Failure Feedback",
        paragraphs: [
          "Test가 실패하면 그 결과를 다음 Model Call에 반영할 수 있다.",
        ],
      },
      {
        title: "PATCH VERIFIED",
        paragraphs: [
          "두 시스템이 같은 첫 번째 Patch를 만들더라도 두 번째 시스템은 Test Failure를 확인하고 다시 수정할 수 있다.",
          "결과적으로 `PATCH GENERATED`와 `PATCH VERIFIED`는 서로 다른 Agent Experience가 된다.",
        ],
      },
      {
        title: "Model Capability도 중요하다",
        paragraphs: [
          "이 비교의 목적은 Model Capability가 중요하지 않다고 주장하는 것이 아니다.",
          "Model의 Reasoning과 Coding Capability는 Agent Quality에 매우 큰 영향을 줄 수 있다.",
          "하지만 실제 Agent Experience는 Model 하나만으로 결정되지 않는다.",
        ],
      },
      {
        title: "주변 시스템이 만드는 차이",
        paragraphs: [
          "Context의 품질, Tool의 설계와 품질, Execution Environment, Permission, Validation, Loop Orchestration 역시 결과에 영향을 줄 수 있다.",
          "즉,",
          "같은 Model을 사용하더라도 주변 시스템의 설계에 따라 서로 다른 Agent Experience가 만들어질 수 있다.",
        ],
      },
      {
        title: "개발자가 확인할 것",
        paragraphs: [
          "그렇다면 실제 Coding Agent를 사용할 때 개발자는 무엇을 확인하면 좋을까?",
        ],
      },
    ],
    references: [refs.agents, refs.tools],
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
        title: "네 가지 질문",
        paragraphs: ["지금까지의 구조를 특정 제품이나 Framework 이름이 아니라 개발자가 사용할 수 있는 질문으로 바꾸면 네 가지로 압축할 수 있다."],
      },
      {
        title: "WHAT DOES IT SEE?",
        paragraphs: [
          "현재 Model은 어떤 정보를 근거로 판단하고 있는가?",
          "예를 들어 다음을 확인할 수 있다.",
        ],
        bullets: [
          "Project Instructions",
          "Selected Files",
          "Logs",
          "Search Results",
          "Previous Tool Results",
          "Conversation History",
        ],
      },
      {
        title: "Context에 들어 있는가?",
        paragraphs: ["Repository에 정보가 존재하는 것과 현재 Context에 그 정보가 들어 있는 것은 다르다."],
      },
      {
        title: "WHAT CAN IT DO?",
        paragraphs: [
          "Model에게 어떤 Tool과 Capability가 노출되어 있는가?",
          "예를 들어 다음과 같은 범위를 확인할 수 있다.",
        ],
        bullets: ["Search", "Read", "Edit", "Shell", "Test", "Browser / API", "Git"],
      },
      {
        title: "Tool Scope",
        paragraphs: ["Tool Scope는 Agent가 요청할 수 있는 행동의 범위에 영향을 준다."],
      },
      {
        title: "WHAT IS IT ALLOWED TO DO?",
        paragraphs: [
          "Capability가 존재하는 것과 실제 실행 권한이 존재하는 것은 같은 문제가 아니다.",
          "다음과 같은 Control을 확인할 수 있다.",
        ],
        bullets: [
          "Workspace Write Boundary",
          "Accessible Paths",
          "Shell Restrictions",
          "Network Access",
          "Approval Requirements",
        ],
      },
      {
        title: "Permission의 범위",
        paragraphs: ["Permission이 많다고 자동으로 더 좋은 Agent가 되는 것은 아니다."],
      },
      {
        title: "HOW IS IT VERIFIED?",
        paragraphs: [
          "Agent가 “수정했습니다”라고 말하는 것만으로 작업이 검증된 것은 아니다.",
          "실제 결과를 확인해야 한다.",
        ],
        bullets: ["Test", "Build", "Lint", "Type Check", "Diff", "Human Review"],
      },
      {
        title: "제품을 넘어서는 체크리스트",
        paragraphs: [
          "이 네 질문은 특정 Agent 제품에만 적용되는 체크리스트가 아니다.",
          "Agent가 어떤 Model을 사용하는지만 보는 대신,",
          "무엇을 보고, 무엇을 할 수 있고, 어디까지 허용되며, 결과를 어떻게 검증하는가",
        ],
      },
      {
        title: "함께 보는 네 가지 축",
        paragraphs: [
          "를 함께 보게 만든다.",
        ],
      },
      {
        title: "Incident로 돌아가기",
        paragraphs: [
          "이제 이 네 질문을 가지고 처음의 NPE Incident로 돌아가보자.",
          "처음과는 다른 구조가 보인다.",
        ],
      },
    ],
    references: [refs.context, refs.tools, refs.safety],
  },
  {
    id: "incident-return",
    number: "19",
    title: "Back to the Incident",
    act: 5,
    actTitle: "AGENT",
    actPosition: 4,
    details: [
      {
        title: "처음의 Workflow",
        paragraphs: ["처음 이 Incident를 보았을 때 Agent의 행동은 다음처럼 보였다."],
        code: ["READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY"],
      },
      {
        title: "이제 보이는 책임",
        paragraphs: [
          "하나의 AI가 처음부터 끝까지 모든 작업을 수행하는 연속된 행동처럼 느껴졌다.",
          "하지만 이제 각각의 단계를 분리해서 볼 수 있다.",
          "운영 Log가 문제 해결을 위한 첫 Context가 된다.",
        ],
      },
      {
        title: "Context를 추가하며 원인을 발견",
        paragraphs: [
          "Model은 현재 정보만으로 원인을 이미 알고 있는 것이 아니다.",
          "Repository Search를 요청하고, Search Result를 받아 관련 파일을 찾는다.",
          "필요한 Source Code를 읽으면서 Stack Trace만으로는 알 수 없었던 정보를 Context에 추가한다.",
        ],
      },
      {
        title: "원인을 판단할 근거",
        paragraphs: [
          "관련 코드와 데이터 조건을 더 확인하면서 `profile == null`이 NPE의 유력한 원인이라는 판단에 필요한 근거를 확보한다.",
        ],
      },
      {
        title: "Patch와 Workspace 변경",
        paragraphs: [
          "Model은 그 정보를 바탕으로 Patch를 생성하고 수정 행동을 요청한다.",
          "Execution을 통해 실제 Workspace가 변경된다.",
        ],
      },
      {
        title: "Test Failure → Feedback → Retry",
        paragraphs: [
          "하지만 첫 Patch는 NPE만 막았을 뿐, 실제 시스템이 요구하는 `\"Unknown\"`이라는 fallback 계약까지 만족하지 못한다.",
          "Test Failure가 그 사실을 새로운 Feedback으로 알려준다.",
          "다음 Model Call에서는 그 결과를 바탕으로 Test를 확인하고 Patch를 다시 수정할 수 있다.",
        ],
      },
      {
        title: "종료 조건",
        paragraphs: [
          "Test가 통과하고 필요한 Validation이 완료되면 Agent Run은 종료 조건에 도달한다.",
        ],
      },
      {
        title: "처음부터 주어지지 않은 정답",
        paragraphs: [
          "중요한 점은 문제의 원인과 정답이 처음부터 주어져 있지 않았다는 것이다.",
          "Agent Run이 진행되면서 Environment에서 필요한 정보를 가져왔고, 그 정보가 다음 판단을 바꿨다.",
          "처음의 Workflow 자체가 달라진 것은 아니다.",
        ],
      },
      {
        title: "AI ACTION을 책임으로 분해하기",
        paragraphs: [
          "달라진 것은 우리가 그 Workflow를 해석하는 방식이다.",
          "처음에는 하나의 불투명한 `AI ACTION`처럼 보였다.",
          "이제 같은 행동을 다음 책임으로 분해할 수 있다.",
        ],
        code: ["MODEL\nCONTEXT\nTOOL REQUEST\nEXECUTION\nENVIRONMENT\nTOOL RESULT\nCONTROL\nVALIDATION\nLOOP"],
      },
      {
        title: "달라진 해석",
        paragraphs: [
          "Agent가 갑자기 단순해진 것은 아니다.",
          "우리가 그 행동을 구성하는 책임과 정보의 흐름을 구분해서 볼 수 있게 된 것이다.",
          "Workflow가 달라진 것이 아니라, 우리가 Workflow를 해석하는 방식이 달라졌다.",
        ],
      },
      {
        title: "처음의 질문으로",
        paragraphs: [
          "이제 처음의 질문에 답할 수 있다.",
        ],
      },
    ],
    references: [refs.running],
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
        title: "처음의 질문",
        paragraphs: [
          "처음의 질문은 이것이었다.",
          "다음 Token을 생성하는 Model을 중심으로, Repository를 읽고 코드를 수정하고 테스트하는 Coding Agent는 어떻게 만들어질까?",
          "여기까지의 내용을 가장 짧게 압축하면 다음과 같다.",
        ],
      },
      {
        title: "THE MODEL IS NOT THE AGENT.",
        paragraphs: [
          "THE MODEL IS NOT THE AGENT.",
        ],
      },
      {
        title: "Model은 핵심 판단 엔진이다",
        paragraphs: [
          "이 문장은 Model이 중요하지 않다는 뜻이 아니다.",
          "Model은 Coding Agent의 핵심 판단 엔진이다.",
          "현재 Context를 입력받고 Text Output이나 Tool Request를 생성한다.",
        ],
      },
      {
        title: "새로운 Result와 다음 행동",
        paragraphs: [
          "새로운 Result가 제공되면 그 정보를 바탕으로 다음 행동을 생성할 수도 있다.",
        ],
      },
      {
        title: "Model 주변의 책임",
        paragraphs: [
          "하지만 Model 단독으로 Repository의 파일을 열거나 Workspace를 수정하거나 Test Runner를 실행하는 것은 아니다.",
          "Coding Agent의 실제 동작에는 Model 주변의 다른 책임이 함께 필요하다.",
        ],
        bullets: [
          "Context는 Model이 무엇을 볼 수 있는지를 결정한다.",
          "Tools는 어떤 외부 행동을 요청할 수 있는지에 영향을 준다.",
          "Execution은 Model의 요청을 실제 Environment의 행동과 연결한다.",
          "Control은 어디까지 행동하도록 허용할지를 관리한다.",
          "Validation은 실제 결과가 올바른지 확인한다.",
          "Loop는 Environment의 결과를 다시 다음 판단으로 연결한다.",
        ],
      },
      {
        title: "Coding Agent Mental Model",
        paragraphs: [
          "따라서 이 글에서는 Coding Agent를 다음과 같은 Mental Model로 이해할 수 있다.",
          "Coding Agent는 Language Model을 실제 개발 Environment와 연결하여, 현재 상태를 바탕으로 필요한 행동을 선택하고 그 실행 결과를 다시 다음 판단에 사용할 수 있도록 구성된 시스템이다.",
        ],
      },
      {
        title: "이름보다 책임",
        paragraphs: [
          "이것이 모든 Agent Framework가 사용하는 하나의 공식 정의라는 뜻은 아니다.",
          "Agent, Runner, Runtime, Harness, Orchestrator 같은 이름과 Component Boundary는 제품마다 다를 수 있다.",
          "하지만 이름보다 책임을 보면 구조는 훨씬 명확해진다.",
        ],
      },
      {
        title: "Incident가 보여준 것",
        paragraphs: [
          "이번 Incident에서도 Model은 처음부터 문제의 원인이나 올바른 Patch를 알고 있지 않았다.",
          "Log를 출발점으로 필요한 Source Code를 읽고, Repository에서 추가 정보를 찾고, Test Failure라는 Feedback을 받아가며 다음 판단에 사용할 정보를 계속 바꿔갔다.",
        ],
      },
      {
        title: "Model에서 Agent System으로",
        paragraphs: [
          "다음 Token을 생성하는 Model 자체가 어느 순간 File System과 Shell을 가진 Agent로 변한 것이 아니다.",
          "Model 주변에 Context를 구성하고, 행동 요청을 실제 Environment에서 실행하고, 결과를 검증하고, 그 Feedback을 다시 다음 판단으로 연결하는 시스템이 만들어진 것이다.",
          "그래서 우리는 하나의 Model을 넘어 Coding Agent라는 작업 경험을 얻는다.",
        ],
      },
      {
        title: "Final closure",
        paragraphs: [
          "THE MODEL IS NOT THE AGENT.",
          "Model은 핵심이다.",
          "THE MODEL IS THE CORE. THE SYSTEM MAKES IT AN AGENT.",
        ],
      },
    ],
    references: [refs.agents, refs.running, refs.context, refs.tools, refs.claudeTools, refs.safety],
  },
  {
    id: "appendix",
    number: "A1",
    title: "LLM to AGENT Artwork",
    act: null,
    details: [
      {
        title: "Conceptual Artwork",
        paragraphs: [
          "마지막 Artwork는 특정 Coding Agent 제품의 실제 내부 Architecture를 그대로 옮긴 Diagram이 아니다.",
          "이 글에서 설명한 책임과 관계를 하나의 장면으로 압축한 Conceptual Artwork다.",
          "각 요소는 실제 Component를 1:1로 복제하기보다 하나의 책임을 상징한다.",
        ],
      },
      {
        title: "MODEL",
        paragraphs: [
          "현재 Context를 입력받고 Output을 생성하는 핵심 Language Model을 나타낸다.",
          "Model은 Agent의 핵심이지만 Agent 전체를 의미하지 않는다.",
        ],
      },
      {
        title: "CONTEXT",
        paragraphs: [
          "User Goal, Instructions, Source Code, Log, Tool Results 등 현재 Model 판단에 사용할 수 있는 정보를 나타낸다.",
          "Repository 전체가 이미 Model 내부에 존재한다는 뜻은 아니다.",
        ],
      },
      {
        title: "TOOL REQUEST",
        paragraphs: [
          "Model이 Environment 방향으로 생성하는 구조화된 행동 요청을 나타낸다.",
          "행동 그 자체가 아니다.",
          "MODEL REQUESTS.",
        ],
      },
      {
        title: "BOUNDARY",
        paragraphs: [
          "Model Output과 실제 Environment Side Effect 사이의 책임 경계를 나타낸다.",
          "REQUESTED ≠ EXECUTED",
        ],
      },
      {
        title: "EXECUTION",
        paragraphs: [
          "Model의 요청을 실제 Capability와 연결하는 시스템 책임을 나타낸다.",
          "SYSTEM EXECUTES.",
        ],
      },
      {
        title: "ENVIRONMENT",
        paragraphs: [
          "Repository, File System, Shell, Test Runner, External Service처럼 실제 개발 작업이 일어나고 결과를 얻는 외부 환경을 나타낸다.",
        ],
      },
      {
        title: "TOOL RESULT",
        paragraphs: [
          "Environment에서 얻은 결과가 다시 Agent Workflow로 돌아오는 흐름을 나타낸다.",
          "Tool Result는 Model Parameter Retraining을 의미하지 않는다.",
        ],
      },
      {
        title: "LOOP",
        paragraphs: ["다음과 같은 반복적 Interaction을 나타낸다."],
        code: ["MODEL → REQUEST → EXECUTION → RESULT → UPDATED STATE / CONTEXT → MODEL"],
      },
      {
        title: "LOOP의 범위",
        paragraphs: ["모든 Agent 제품의 실제 내부 실행 순서가 정확히 동일하다는 뜻은 아니다."],
      },
      {
        title: "CONTROL",
        paragraphs: [
          "Permission, Sandbox, Approval, Guardrail처럼 Agent가 어디까지 행동할 수 있는지를 관리하는 책임을 나타낸다.",
        ],
      },
      {
        title: "VALIDATION",
        paragraphs: [
          "Test, Build, Lint, Type Check, Diff Review처럼 실제 작업 결과가 올바른지를 확인하는 책임을 나타낸다.",
          "Control과 Validation은 관련되어 있지만 서로 다른 책임이다.",
        ],
      },
      {
        title: "Final Interpretation",
        paragraphs: [
          "이 Artwork는 Coding Agent를 Model과 실제 개발 Environment 사이에 행동과 Feedback의 반복 구조를 만든 시스템으로 바라보는 Mental Model을 한 장에 압축한 것이다.",
        ],
      },
      {
        title: "Glossary · Token",
        paragraphs: ["Language Model이 처리하는 단위다. 자연어 단어와 항상 1:1로 대응하지는 않는다."],
      },
      {
        title: "Glossary · Context",
        paragraphs: [
          "이 글에서는 기본적으로 현재 Model Call에서 LLM이 볼 수 있도록 제공된 정보를 의미한다. Application의 Runtime State 전체와 같은 개념은 아니다.",
        ],
      },
      {
        title: "Glossary · Context Window",
        paragraphs: ["Model이 한 번의 Call에서 처리할 수 있는 입력 범위다."],
      },
      {
        title: "Glossary · Tool Request",
        paragraphs: ["Model이 생성하는 구조화된 행동 요청이다. 요청이 생성되었다고 실제 실행이 보장되는 것은 아니다."],
      },
      {
        title: "Glossary · Tool Execution",
        paragraphs: ["Tool Request를 실제 Capability로 수행하는 별개의 책임이다."],
      },
      {
        title: "Glossary · Execution Layer",
        paragraphs: [
          "Model의 요청을 실제 Tool과 연결하고 Result를 Workflow에 반환하는 책임을 이 글에서 편의상 부르는 표현이다. 보편적인 Component 이름은 아니다.",
        ],
      },
      {
        title: "Glossary · Model Call",
        paragraphs: ["Model에 대한 한 번의 호출이다."],
      },
      {
        title: "Glossary · Agent Run",
        paragraphs: ["하나의 User Goal을 수행하기 위해 여러 Model Call과 Tool Execution을 포함할 수 있는 전체 작업 단위다."],
      },
      {
        title: "Glossary · Agent State",
        paragraphs: [
          "Agent Run이 진행되는 동안 시스템과 Environment가 유지하는 작업 관련 상태를 넓게 표현한 말이다. 이 전체 상태가 항상 Model Context에 그대로 포함되는 것은 아니다.",
        ],
      },
      {
        title: "Glossary · Control",
        paragraphs: ["Permission, Sandbox, Approval처럼 Agent가 어떤 행동을 실행하도록 허용할지를 관리하는 책임이다."],
      },
      {
        title: "Glossary · Validation",
        paragraphs: ["Test, Build, Lint, Diff 등의 실제 결과를 통해 작업의 정확성과 완료 여부를 확인하는 책임이다."],
      },
      {
        title: "Glossary · Agent Harness",
        paragraphs: [
          "Model을 실제로 동작하는 Agent Experience로 만들기 위한 주변 시스템을 편의상 가리킬 때 사용할 수 있는 표현이다. 표준화된 필수 Architecture 용어는 아니다.",
        ],
      },
      {
        title: "Learning Check",
        paragraphs: ["이 글을 읽은 뒤 다음 질문에 답할 수 있다면 핵심 Mental Model을 이해한 것이다."],
        bullets: [
          "1. Language Model 자체의 기본 생성 과정은 무엇인가?",
          "2. Repository에 정보가 존재하는 것과 현재 Model Context에 정보가 들어 있는 것은 왜 다른가?",
          "3. Tool Request와 실제 Tool Execution을 왜 구분해야 하는가?",
          "4. Environment에서 얻은 Tool Result는 어떻게 다음 Model 판단에 영향을 줄 수 있는가?",
          "5. Model Call과 Agent Run은 어떻게 다른가?",
          "6. 이번 NPE Incident에서 문제의 원인은 어떤 정보가 추가되면서 드러났는가?",
          "7. Test Failure가 Agent Loop에서 유용한 Feedback이 될 수 있는 이유는 무엇인가?",
          "8. THE MODEL IS NOT THE AGENT.라는 문장은 정확히 무엇을 의미하는가?",
        ],
      },
      {
        title: "Simplification Notes",
        paragraphs: [
          "이 글과 Presentation에 등장하는 Token 경계와 확률 값은 특정 Model을 실제 측정한 결과가 아니라 개념 설명을 위한 예시다.",
          "Tool Request를 JSON이나 함수 호출과 비슷한 형태로 표현하더라도 모든 Model과 Agent 제품이 동일한 문자열 형식을 사용한다는 뜻은 아니다.",
          "`REQUEST → VALIDATE → PERMISSION → EXECUTE` 같은 Execution Flow 역시 책임 관계를 설명하기 위해 단순화한 예시다.",
        ],
      },
      {
        title: "가능한 Agent Run 하나",
        paragraphs: [
          "NullPointerException Incident에서 보여주는 작업 순서 역시 가능한 Agent Run 하나를 교육 목적으로 단순화한 것이다.",
          "실제 Agent는 다른 순서로 Tool을 사용하거나 여러 Tool을 병렬로 호출하고 추가 Planning이나 Approval 절차를 사용할 수도 있다.",
          "Agent, Runner, Runtime, Harness, Orchestrator 같은 용어와 실제 Component Boundary는 Framework와 제품마다 다를 수 있다.",
        ],
      },
      {
        title: "책임과 정보의 흐름",
        paragraphs: [
          "이 글의 목적은 하나의 Universal Architecture 이름을 정의하는 것이 아니라 Coding Agent를 구성하는 책임과 정보의 흐름을 이해하는 것이다.",
        ],
      },
    ],
  },
];

export const TOTAL_SCENES = scenes.length;
