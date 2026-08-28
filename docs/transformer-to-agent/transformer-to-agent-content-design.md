# TRANSFORMER TO AGENT — 내용 설계서

> 상태: 내용 구조 확정 후보 v0.8  
> 목적: 웹 자료를 개발하기 전에 전체 설명 구조와 핵심 질문을 충분히 검토하고 확정한다.

## 1. 자료의 정체성

### 가제

**TRANSFORMER TO AGENT**

### 중심 질문

> 다음 토큰을 예측하는 Transformer 기반 모델은 어떻게 코드를 읽고, 도구를 사용하고, 실제 작업을 수행하는 Agent가 되었을까?

### 최상위 학습 목표

> 앞으로 소프트웨어 엔지니어가 함께할 수밖에 없는 AI Agent를 마법이나 단순한 Chat UI가 아니라, 이해하고 분석할 수 있는 하나의 소프트웨어 시스템으로 바라본다.

이 목표는 두 층을 함께 이해할 때 달성된다.

```text
INSIDE THE MODEL
Token · Embedding · Attention · Transformer · Probability · Reasoning

AROUND THE MODEL
Context · Tool · Runtime · Session · Memory · Permission · Evaluation
```

모델 내부 원리만 설명하거나 Claude Code 사용법만 소개하지 않는다. 확률적 언어 모델의 출력이 Agent Runtime을 통해 실제 환경의 행동으로 바뀌는 전체 연결 구조를 학습한다.

### 제작 목적

- 제작자가 Transformer와 LLM, Coding Agent의 작동 원리를 심화 학습한다.
- LLM을 사용하지만 내부 구조는 익숙하지 않은 소프트웨어 개발자가 직관적으로 이해할 수 있는 자료를 만든다.
- 단독으로 읽을 수 있으면서, 발표 시에도 활용할 수 있는 인터랙티브 웹 자료를 완성한다.
- 기술의 역사만 나열하지 않고, 각 변화가 왜 필요했는지와 다음 단계로 어떻게 이어졌는지를 설명한다.

### 핵심 대상

- Codex, Claude Code, OpenCode 같은 Coding Agent를 사용하는 개발자
- AI 전문가는 아니지만 작동 원리를 제대로 이해하고 싶은 소프트웨어 개발자

### 본편의 기대 학습 성과

20~30분 공유를 본 개발자는 다음 다섯 가지를 자신의 언어로 설명할 수 있어야 한다.

- 다음 토큰 예측과 일반적인 머신러닝 분류가 어떻게 연결되는지
- Self-Attention이 Context 안의 Token 관계를 이용해 새 표현을 만드는 이유
- LLM이 더 강해져도 파일·터미널·테스트에 직접 접근한 것은 아니라는 점
- Model API와 Claude Code의 Local Agent Runtime이 어떤 역할을 나누는지
- Tool Call과 Tool Result의 반복이 어떻게 검색·수정·테스트라는 실제 작업으로 이어지는지

READ 모드와 Deep Dive에서는 다음 심화 학습까지 지원한다.

- Scaled Dot-Product, Multi-Head, Position, Mask, FFN, Residual, Normalization의 역할
- Context Window, Session Transcript, Compaction, `CLAUDE.md`, Auto Memory의 차이
- Agent 실패를 Model, Context, Tool, Harness, Permission, Evaluation 단위로 진단하는 관점

### 전달 모드와 본편 범위

- `PRESENT`: 20~30분 공유를 위한 핵심 장면과 큰 문장 중심. 기본 진행은 22~25분을 목표로 하고, 발표자의 설명이 세부 내용을 보완한다.
- `READ`: 같은 장면과 핵심 개념을 유지하되, 발표자의 설명을 본문·용어·출처로 제공한다.
- `DEEP DIVE`: 수식, 전체 API Payload, 저장 구조처럼 본편의 흐름을 끊을 수 있는 심화 내용을 선택적으로 펼친다.

`PRESENT / READ`는 전달 방식의 차이이며, `CORE / DEEP DIVE`는 내용 깊이의 차이다. 두 모드가 서로 다른 목차나 개념을 갖지 않게 한다.

## 2. 내용 설계 원칙

1. 기술 용어의 순서가 아니라 **궁금증이 다음 궁금증을 낳는 순서**로 설명한다.
2. 직관적인 설명에서 시작하되, 학습 가치가 있는 심화 내용은 과도하게 제거하지 않는다.
3. `Transformer`, `LLM`, `GPT`, `Agent`를 동일한 개념처럼 섞지 않는다.
4. 각 파트는 하나의 질문에 답하고, 다음 파트의 질문을 남긴다.
5. 논문과 제품의 주장, 후대에 추가된 해석을 구분한다.
6. 웹 표현 방식보다 내용의 정확성과 흐름을 먼저 확정한다.

## 3. 전체 이야기 설계

### 3.1 중심 서사와 보조 서사

자료에는 두 개의 흐름이 함께 존재하지만, 비중은 같지 않다.

```text
중심 서사
확률적 다음 토큰 예측기
→ 언어 모델
→ 도구 호출
→ 환경 피드백
→ Coding Agent

보조 서사
Transformer
→ Pretraining Scale
→ Post-training
→ Inference-time Reasoning
→ Agent System
```

중심 서사는 “확률 모델이 어떻게 실제 행동을 수행하게 되었는가”를 끝까지 추적한다. 모델 발전사는 별도 연표로 길게 분리하지 않고, 각 기술적 변화가 등장한 이유와 당시 경쟁의 중심이 무엇이었는지를 설명하는 짧은 배경선으로 사용한다.

### 3.2 전체 흐름

#### PROLOGUE. It Changed the Code

```text
PRODUCTION ERROR
일부 사용자 조회 요청이 500으로 실패한다.
```

사용자가 Claude Code에 다음과 같이 요청한다.

> 오늘 배포 이후 사용자 조회 API의 일부 요청이 500으로 실패하고 있어. 제공한 로그를 확인해서 원인을 찾고 수정해줘.

첫 장면에서는 원인을 공개하지 않는다. Coding Agent가 로그를 읽고, 관련 코드를 찾고, 실패를 재현하고, 코드를 수정한 뒤 테스트하는 결과만 빠르게 보여준다.

> 다음 토큰을 확률적으로 선택하는 모델이 어떻게 실제 Repository를 바꿨을까?

이 질문을 남기고 가장 단순한 머신러닝 분류 문제로 되돌아간다.

#### ACT 1. FROM CLASSIFICATION TO LANGUAGE

| 파트 | 질문 | 기술 내용 | 발전 흐름의 역할 |
|---|---|---|---|
| 01. Cat or Dog? | 머신러닝 모델은 무엇을 학습할까? | 입력, 클래스 점수, 손실, 역전파, 가중치 | 공통 학습 원리의 출발점 |
| 02. The Next Token | 단어 예측도 분류로 볼 수 있을까? | Token, Vocabulary, Logit, Softmax, Cross-Entropy | 언어 모델의 학습 목표 |
| 03. Prediction Becomes Generation | 분류가 어떻게 문장 생성이 될까? | 자기회귀 생성, 출력의 재입력, Sampling | 확률 모델이라는 정체성 확립 |

ACT 1의 결론:

> LLM의 출력은 매 순간 Vocabulary 전체에 대한 확률 분포이며, 생성은 이 예측을 반복한 결과다.

다음 질문:

> 다음 토큰을 잘 맞히려면 이전 토큰들의 관계를 어떻게 계산해야 할까?

#### ACT 2. BUILDING A SCALABLE LANGUAGE MODEL

| 파트 | 질문 | 기술 내용 | 발전 흐름의 역할 |
|---|---|---|---|
| 04. Before Transformer | 기존 순차 모델에는 어떤 제약이 있었을까? | RNN·LSTM의 순차 처리와 장거리 의존성 | 새로운 아키텍처가 필요했던 배경 |
| 05. Self-Attention | Token은 Context 안의 관계를 어떻게 반영할까? | Token→Embedding, Q·K·V의 직관, Attention 가중치, Value의 가중합 | 수식 전체 계산보다 입력 표현이 바뀌는 과정을 이해 |
| 06. The Transformer | 원 논문은 무엇을 바꾸고, 현대 LLM에는 무엇이 남았을까? | Decoder Block 개요, Causal Mask, Self-Attention 중심 구조, 병렬화, Encoder–Decoder와 Decoder-only 구분 | 원 논문은 한 장면에 통합하고 구성요소의 역할만 설명 |
| 07. Scaling Language Models | 왜 거대 모델과 GPU 경쟁이 시작됐을까? | Parameter·Data·Training Compute, 분산 학습, Scaling의 효과와 한계 | 대표 모델은 변화의 사례로만 짧게 배치 |

ACT 2에서 역사적 흐름은 제품 연표가 아니라 “무엇을 확장했는가”로 정리한다.

```text
Architecture Scale
→ 더 병렬화하기 좋은 구조

Pretraining Scale
→ 더 많은 Parameter + Data + Training Compute
```

ACT 2의 결론:

> Transformer는 거대 LLM 그 자체가 아니라, 거대 학습을 현실적인 전략으로 만들 수 있었던 기반 아키텍처 중 하나였다.

ACT 2의 PRESENT 모드에서는 Attention 수식을 화면에 보여주되 숫자를 대입해 끝까지 계산하지 않는다. Multi-Head, Position, FFN, Residual, Normalization의 세부는 READ 또는 Deep Dive에서 확장한다.

다음 질문:

> 더 큰 다음 토큰 예측 모델을 만들었다고 해서 사용자의 지시를 따르고 일을 수행할 수 있을까?

#### ACT 3. A BETTER MODEL IS STILL NOT AN AGENT

| 파트 | 질문 | 기술 내용 | 발전 흐름의 역할 |
|---|---|---|---|
| 08. From Base Model to Assistant | 문장 완성 모델은 어떻게 지시를 따르게 되었을까? | Instruction Tuning, Preference Learning, System Instruction | Pretraining만으로 부족한 이유 |
| 09. Give It More Time | 학습 규모 외에 추론 시점의 연산은 무엇을 바꿨을까? | Inference-time Compute, 중간 추론과 검토, 응답 전 계산량 조절 | 비공개 내부 사고를 단정하지 않고 경쟁 중심이 Training Scale 밖으로 확장됐음을 설명 |
| 10. Prediction Is Not Action | 똑똑한 답변과 실제 행동의 차이는 무엇일까? | 지식의 시점, 파일 접근 불가, 실행 불가, 검증 불가 | LLM과 Agent의 경계 명확화 |

ACT 3에서 대표 모델의 발전은 다음 변화만 선별한다.

```text
더 큰 Pretraining
→ 더 잘 따르는 Post-training
→ 더 오래 계산하는 Inference-time Reasoning
```

모델명과 기업은 각 변화를 구체화하는 사례로만 사용하며, 모든 버전의 성능과 출시일을 나열하지 않는다.

ACT 3의 결론:

> 모델은 더 강력해졌지만, 여전히 파일을 직접 열거나 터미널을 실행한 것은 아니다.

다음 질문:

> 모델의 텍스트 출력을 현실의 행동과 연결하려면 모델 주변에 무엇이 필요할까?

#### ACT 4. FROM TOKENS TO ACTIONS

| 파트 | 질문 | 기술 내용 | 발전 흐름의 역할 |
|---|---|---|---|
| 11. One Tool Call | 모델 출력은 어떻게 실행 요청이 될까? | 실제 Messages API, Tool Schema, `tool_use`, Local Runtime 실행, `tool_result` | `read_file` 한 번의 완전한 왕복을 실제 JSON으로 확인 |
| 12. From Call to Loop | 한 번의 요청이 어떻게 여러 단계의 작업이 될까? | Claude Code CLI, 원격 Model API, Local Runtime, 판단→Tool→Feedback 반복, Permission | Runtime 구조와 Agent Loop를 하나의 장면으로 통합 |
| 13. How the Agent Reads Code | Agent는 Repository 전체를 어떻게 다룰까? | Stack Trace, 검색, 파일 선택, Current Context 구성, 읽지 않은 파일의 한계 | 프로덕션 오류 탐색 과정 안에서 설명 |
| 14. How Claude Code Remembers | 어제의 작업을 오늘 어떻게 이어갈까? | 본편: Context 재구성의 개념. 심화: Transcript, Compaction, CLAUDE.md, Auto Memory | PRESENT에서는 60~90초만 사용하고 저장 구조는 Deep Dive로 이동 |
| 15. Fix the Production Error | 500 오류는 실제로 어떻게 수정되고 검증될까? | 로그 확인, 실패 재현, Regression Test, 수정, 관련 Test Suite | 앞의 개념을 하나의 Claude Code Trace로 통합 |
| 16. Did It Really Fix It? | 무엇이 좋은 Agent 결과를 결정할까? | Reproduced·Patched·Verified 구분, 검증 범위, 운영 확인, Human Review | 평가 단위를 Model에서 전체 System으로 확장하며 결론과 통합 |

ACT 4에서 발전의 중심은 다음처럼 바뀐다.

```text
Model Quality
→ Model + Context + Tools + Harness + Feedback + Evaluation
```

최종 결론:

> Coding Agent는 Transformer가 직접 행동하는 존재가 아니다. 확률적으로 토큰을 생성하는 모델을 도구와 실행 환경에 연결하고, 행동의 결과를 다시 Context로 제공하는 반복 시스템이다.

### 3.3 발전사를 포함하는 규칙

1. 모델 발전사는 독립된 역사 강의로 만들지 않는다.
2. 한 기술적 변화가 등장할 때 당시의 대표 모델과 기업 사례를 함께 보여준다.
3. 대표 모델의 회사는 **OpenAI와 Anthropic 두 곳으로 한정**한다.
4. 두 회사를 매 변곡점마다 억지로 하나씩 배치하지 않는다. 해당 기술 변화를 실제로 설명하는 데 필요한 모델만 등장시킨다.
5. 모든 모델 이정표에는 `YYYY.MM · COMPANY · MODEL` 형식으로 연도와 월을 표시한다.
6. 날짜는 모델의 Knowledge Cutoff나 Model ID 날짜가 아니라, 공식 발표 또는 최초 공개일을 기준으로 한다.
7. 모델과 제품을 구분한다. ChatGPT, Codex, Claude Code처럼 제품이 필요한 경우 `PRODUCT`임을 별도로 표기한다.
8. Parameter 수치와 Benchmark 순위를 길게 나열하지 않는다.
9. 공개되지 않은 모델 구조와 학습 규모를 추측하지 않는다.
10. 각 시대를 완전히 교체된 단계로 표현하지 않는다. Training Scale, Post-training, Reasoning, Agent System은 현재도 함께 중요하다.
11. “모델 크기가 중요하지 않아졌다”가 아니라 “평가 단위가 모델에서 전체 시스템으로 넓어졌다”고 설명한다.
12. 짧은 기간에 변화가 연속적으로 일어났다는 사실이 보이도록 이정표 사이의 시간 간격을 시각적으로 유지한다.
13. 제품 연표보다 다음 네 질문을 반복해서 사용한다.

```text
무엇을 확장했는가?
무엇을 새로 할 수 있게 되었는가?
그래도 아직 무엇을 할 수 없었는가?
다음 단계에는 무엇이 필요했는가?
```

이 구조를 내용 설계의 기준안으로 사용한다. Storyboard 과정에서 인접 장면을 합칠 수는 있지만, CORE와 DEEP DIVE의 경계는 유지한다.

### 3.4 모델 이정표의 역할

모델은 기술 설명을 대신하지 않는다. 먼저 한계를 이해시킨 뒤, 그 한계를 해결하거나 경쟁의 중심을 바꾼 실제 사례로 등장시킨다.

```text
기술적 한계
→ 해결 아이디어
→ 핵심 작동 원리
→ YYYY.MM · COMPANY · MODEL
→ 새롭게 가능해진 것
→ 아직 남은 한계
```

본편에 사용할 이정표는 다음 다섯 개로 제한한다.

| 이정표 | 등장 위치 | 대표하는 변화 |
|---|---|---|
| `2018.06 · OPENAI · GPT` | ACT 2 후반 | Transformer 기반 Generative Pre-training이 다양한 언어 과제로 확장될 가능성 |
| `2020.05 · OPENAI · GPT-3` | Scaling Language Models | Parameter·Data·Compute 확대와 Few-shot 능력의 상징적 사례 |
| `2022.11 · OPENAI · ChatGPT · PRODUCT` | From Base Model to Assistant | 대화형 Instruction Following이 대중적인 제품 경험이 된 시점 |
| `2024.09 · OPENAI · o1-preview` | Give It More Time | 응답 전 더 많은 추론 연산을 사용하는 Test-time Compute의 전환점 |
| `2025.02 · ANTHROPIC · Claude 3.7 Sonnet + Claude Code · MODEL / PRODUCT` | ACT 3→4 경계 | Extended Thinking 모델과 Agentic Coding Runtime이 같은 발표에서 연결된 사례 |

`2025.08 · OPENAI · GPT-5`는 “모델 하나의 크기”에서 Model Routing·Reasoning·Tool Needs를 포함한 **System 단위**로 설명이 확장되는 보조 이정표로만 사용한다. 발표 시간이 부족하면 제외해도 중심 서사에는 영향이 없다.

이 제한은 제품·모델 발전 이정표에만 적용한다. Transformer 원 논문의 연구 배경과 저자는 회사 범위와 무관하게 정확히 설명한다.

### 3.5 Coding Agent 사례의 범위

ACT 4의 Agent 구조는 **Claude Code를 주 사례**로 설명한다. PRESENT에서는 익숙한 Terminal 경험과 Model API·Local Runtime·Tool Loop의 관계를 중심으로 해부한다. Session Resume, `CLAUDE.md`, Auto Memory, Context Compaction의 저장·동작 세부는 READ와 Deep Dive에서 다룬다.

OpenCode는 동일한 비중의 비교 대상이 아니라, Claude Code에서 관찰한 개념이 오픈소스 Harness에서는 어떤 모듈과 데이터 구조로 구현되는지 확인하는 보조 사례로 사용한다.

```text
MAIN CASE
Claude Code
→ 실제 사용자 경험
→ 공식 문서로 확인 가능한 동작
→ Session·Memory·Tool Loop 중심 설명

OPEN IMPLEMENTATION NOTE
OpenCode
→ 공개된 Runtime 구조
→ Session Store·Local Server·Compaction·AGENTS.md 확인
→ 일반 Agent 구조의 구현 근거
```

용어는 다음처럼 구분한다.

| 표현 | 의미 |
|---|---|
| Proprietary Harness | Agent Runtime의 전체 구현 소스가 공개되지 않은 제품. Claude Code의 주 사례 표기 |
| Open-source Harness | Agent Runtime의 소스를 확인할 수 있는 제품. OpenCode의 보조 사례 표기 |
| Model | 원격 추론을 수행하는 Claude 등 LLM |
| Product | Claude Code와 OpenCode처럼 Model, Tools, Runtime, UI를 결합한 프로그램 |

이 구분은 제품의 우열이나 모델 성능 비교를 위한 것이 아니다. Claude Code라는 익숙한 제품을 통해 Agent의 일반 구조를 이해하고, 필요한 부분만 OpenCode 소스로 교차 확인하기 위한 장치다.

### 3.6 실제 API Trace의 범위

개발자 청중에게 `Tool Calling`을 추상적인 개념으로만 설명하지 않는다. Anthropic의 공개 Messages API 형식을 바탕으로 다음 한 번의 왕복을 본편의 핵심 장면으로 사용한다.

```text
1. Runtime → Model API
   사용자 메시지 + 사용할 수 있는 Tool Schema

2. Model API → Runtime
   tool_use { name, input }

3. Runtime → Local Environment
   실제 검색·파일 읽기·명령 실행

4. Runtime → Model API
   tool_result { tool_use_id, content }
```

최소 예시는 첫 행동인 `read_file` 하나로 제한한다.

```json
{
  "model": "<claude-model>",
  "max_tokens": 1024,
  "messages": [
    { "role": "user", "content": "일부 사용자 조회 요청의 500 오류 원인을 찾아줘" }
  ],
  "tools": [
    {
      "name": "read_file",
      "description": "Read a UTF-8 text file from the workspace",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        },
        "required": ["path"]
      }
    }
  ]
}
```

모델은 직접 검색하지 않고, 실행 요청을 구조화해 반환한다.

```json
{
  "stop_reason": "tool_use",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01...",
      "name": "read_file",
      "input": { "path": "production-error.log" }
    }
  ]
}
```

Runtime이 로컬에서 파일을 읽은 뒤, 같은 `tool_use_id`에 결과를 연결해 다음 요청의 `user` 메시지 안에 돌려준다.

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01...",
      "content": "NullPointerException at UserMapper.toResponse(UserMapper.java:42)"
    }
  ]
}
```

이 장면의 핵심 결론은 다음과 같다.

> Model은 Tool을 실행하지 않는다. 실행할 Tool과 인자를 토큰으로 생성하고, Runtime이 이를 검증·실행한 뒤 결과를 다시 Context에 넣는다.

이 결과를 받은 다음 호출에서 모델이 `search_code("UserMapper")`를 요청하면서 한 번의 Tool Call이 Agent Loop로 확장된다.

주의 사항:

- 위 예시는 공개 API를 이용해 Agent의 일반 구조를 설명하는 교육용 최소 Trace다.
- Claude Code의 비공개 내부 Payload가 위와 완전히 동일하다고 주장하지 않는다.
- 본편에서는 핵심 필드만 보여주고, 전체 요청·응답과 에러·병렬 호출은 `DEEP DIVE`로 둔다.
- JSON 문법 자체보다 `누가 생성하고, 누가 실행하며, 결과가 어디로 돌아가는가`를 강조한다.

### 3.7 대표 사례: 일부 사용자에게만 발생하는 프로덕션 500 오류

전체 자료를 관통하는 Coding Agent 사례는 다음 상황으로 확정한다.

> 오늘 배포 이후 사용자 조회 API의 일부 요청이 500으로 실패하고 있어. 제공한 로그를 확인해서 원인을 찾고 수정해줘.

#### 사례의 기본 조건

- Agent는 프로덕션 서버에 직접 접속하지 않는다.
- 사용자가 전달한 Sanitized Log와 로컬 Repository 안에서 조사한다.
- 이번 배포에서 사용자 응답에 `displayName`을 추가했고, 정상 사용자는 성공하지만 일부 오래된 사용자 데이터에서만 실패한다.
- 로그의 Stack Trace는 `UserMapper.toResponse()`를 가리킨다.
- 오래된 사용자는 `profile`이 없을 수 있는데 새 Mapper 코드가 이를 고려하지 않았고, 기존 테스트는 정상 사용자만 포함한다.
- 다음 코드는 사례를 설명하기 위한 잠정적인 Root Cause이며, 실제 데모 Repository를 만들 때 과도하게 작위적이지 않은지 다시 검토한다.

```java
response.setDisplayName(user.getProfile().getDisplayName());
```

#### 전체 작업 Trace

```text
1. 장애 요청과 Sanitized Log 수신
2. Stack Trace에서 UserMapper 후보 발견
3. Repository에서 UserMapper와 관련 Test 검색
4. Mapper·Domain Model·Test를 Context에 구성
5. profile이 없는 Legacy User 조건 추론
6. 실패하는 Regression Test를 먼저 추가
7. 로컬 테스트로 오류 재현
8. Null 조건을 고려해 Mapper 수정
9. 대상 테스트와 관련 테스트를 다시 실행
10. 수정 내용·검증 범위·남은 불확실성 보고
```

#### 각 개념과 사례의 연결

| 개념 | 사례에서 보이는 순간 |
|---|---|
| Tool Calling | 로그·코드 검색이나 테스트 실행을 구조화된 요청으로 생성 |
| Local Runtime | 실제 파일 읽기, 검색, 테스트 명령 수행 |
| Agent Loop | Tool 결과를 받은 뒤 다음 행동을 다시 선택 |
| Context | 현재까지 읽은 로그, Mapper, Domain, Test가 모델 입력에 포함 |
| Codebase Navigation | Stack Trace의 한 줄에서 관련 파일과 테스트로 범위를 확장 |
| Evaluation | 코드 생성 여부가 아니라 실패 재현과 Regression Test 통과로 판단 |
| Permission | 프로덕션 직접 접근 없이 허용된 로컬 환경에서만 행동 |
| Human Role | 제공된 로그만으로 확정할 수 없는 운영 조건과 검증 범위를 확인 |

#### 자료 안에서의 등장 방식

```text
PROLOGUE
증상과 요청만 공개

ACT 1–3
이 Agent의 두뇌인 확률 모델이 만들어진 과정 설명

ACT 4 전반
첫 번째 로그 읽기를 API·Tool Calling 단위로 분해

ACT 4 후반
전체 검색 → 재현 → 수정 → 검증 Trace를 연결

CONCLUSION
수정은 Model 하나가 아니라 전체 Agent System의 결과였음을 정리
```

### 3.8 20~30분 본편의 시간 흐름

| 구간 | 예상 시간 | 중심 질문 | 대표 사례의 위치 |
|---|---:|---|---|
| Prologue | 1~2분 | 확률 모델이 어떻게 Repository를 바꿨을까? | 프로덕션 500 증상과 최종 수정 결과를 먼저 제시 |
| ACT 1 | 약 3분 | 다음 토큰 예측도 분류 문제일까? | 사례에서 잠시 벗어나 공통 학습 원리 설명 |
| ACT 2 | 5~6분 | Transformer는 Context의 관계를 어떻게 계산할까? | Q·K·V의 직관과 Scaling의 연결까지만 본편에서 설명 |
| ACT 3 | 3~4분 | 더 강한 Model은 왜 아직 Agent가 아닐까? | 모델만으로 로그·파일·테스트에 접근할 수 없음을 확인 |
| ACT 4 | 8~10분 | Tool과 Runtime은 어떻게 예측을 행동으로 바꿀까? | 500 오류 안에서 API·Loop·Context·검증을 통합 |
| Conclusion | 약 1분 | 좋은 Coding Agent는 무엇으로 구성될까? | `Did It Really Fix It?` 장면과 결론을 통합 |

기본 진행은 21~26분이며, 질의나 장면별 추가 설명을 포함해도 30분 안에 끝내는 것을 목표로 한다.

### 3.9 CORE와 DEEP DIVE의 최종 구분

| 구간 | PRESENT CORE | READ / DEEP DIVE |
|---|---|---|
| ACT 1 | 분류→Vocabulary→자기회귀 생성 | Cross-Entropy, 역전파, Sampling 전략 |
| ACT 2 | Embedding, Q·K·V 직관, Attention 수식의 의미, Causal Mask, 병렬화 | 수치 계산, Multi-Head 상세, Position, FFN, Residual, Norm, Encoder–Decoder 전체 |
| ACT 3 | Pretraining→Instruction Following→Inference-time Compute→행동의 한계 | Preference Learning 방법, Reasoning 학습 세부, 공개되지 않은 내부 구현에 대한 논의 |
| ACT 4 | 한 번의 API 왕복, Runtime 경계, Agent Loop, Current Context, 오류 수정과 검증 | 전체 Payload, 병렬·오류 Tool Call, Session 저장 경로, Compaction, Auto Memory, OpenCode 구현 Note |

OpenCode는 PRESENT CORE에서 제외한다. READ 모드나 Deep Dive에서 Claude Code의 비공개 Harness를 오픈소스 구현과 교차 확인하는 보조 자료로만 제공한다.

## 4. 확정된 첫 번째 설명 흐름

### 4.1 출발점: 개와 고양이 분류

익숙한 지도학습 예시에서 출발한다.

```text
이미지 픽셀
→ 신경망
→ 내부 특징
→ 개와 고양이 각각의 점수
→ 가장 가능성 높은 클래스
```

모델은 처음부터 귀나 꼬리의 의미를 아는 것이 아니다. 많은 입력과 정답을 보면서 손실을 줄이는 방향으로 가중치를 수정하고, 분류에 유용한 내부 표현을 학습한다.

### 4.2 분류 문제를 다음 토큰 예측으로 확장

언어 모델도 입력을 받아 가능한 정답 후보에 점수를 매긴다.

```text
입력: 나는 아침에 밥을

먹었다  0.61
마셨다  0.09
갔다    0.04
...
```

두 문제의 연결:

| 이미지 분류 | 자기회귀 언어 모델 |
|---|---|
| 입력은 이미지 픽셀 | 입력은 이전까지의 토큰 |
| 후보는 개·고양이 등의 클래스 | 후보는 Vocabulary의 전체 토큰 |
| 클래스별 점수를 출력 | 다음 토큰별 점수를 출력 |
| 정답 클래스와 예측의 오차를 계산 | 실제 다음 토큰과 예측의 오차를 계산 |
| 역전파로 가중치를 수정 | 역전파로 가중치를 수정 |

### 4.3 텍스트는 스스로 학습 문제를 제공한다

하나의 문장에서 여러 입력·정답 쌍을 만들 수 있다.

```text
나는             → 오늘
나는 오늘        → 학교에
나는 오늘 학교에 → 갔다
```

사람이 모든 문장에 별도 레이블을 붙이지 않아도 방대한 텍스트를 학습 데이터로 사용할 수 있다는 점을 설명한다.

### 4.4 분류의 반복이 생성이 된다

예측한 토큰을 다시 입력 뒤에 붙여 다음 토큰을 예측한다.

```text
다음 토큰 예측
→ 선택한 토큰을 입력에 추가
→ 다시 다음 토큰 예측
→ 반복
→ 문장 생성
```

이 지점에서 이미지 분류와 언어 생성이 달라 보이는 가장 큰 이유를 설명한다. 언어 모델은 한 번의 분류로 끝나지 않고 자신의 출력을 다시 입력으로 사용한다.

### 4.5 Transformer로 이어지는 질문

> 다음 토큰을 맞히려면, 이전 토큰 중 무엇을 어떻게 참고해야 할까?

이 질문을 통해 Transformer와 Self-Attention으로 진입한다.

## 5. Transformer 파트에서 해결할 질문

### PRESENT CORE

1. Transformer는 하나의 모델인가, 여러 모델이 사용할 수 있는 아키텍처인가?
2. 기존 순차 모델은 왜 대규모 병렬 학습에 불리했을까?
3. Query, Key, Value는 현재 Token의 표현을 Context에 맞게 바꾸는 데 어떤 역할을 할까?
4. Decoder Mask는 왜 미래 Token을 가려야 할까?
5. 원 논문의 구조와 현대 Decoder-only LLM은 어떻게 연결될까?

### READ / DEEP DIVE

1. Scaled Dot-Product Attention의 내적, Scale, Softmax, Value 가중합은 각각 무슨 역할을 할까?
2. Multi-Head Attention은 한 번의 Attention과 무엇이 다를까?
3. Position 정보는 어떻게 추가되는가?
4. Residual Connection, Layer Normalization, Feed-Forward Network는 왜 필요한가?
5. Attention은 원 논문에서 처음 발명된 것인가?
6. “Attention Is All You Need”라는 제목과 달리 실제 모델에는 무엇이 더 들어 있을까?

## 6. 현재까지 확정된 기술적 구분

- Transformer는 신경망 **아키텍처**다.
- 모든 Transformer가 LLM인 것은 아니다.
- 다음 토큰 예측은 GPT 계열 자기회귀 언어 모델의 대표적인 **학습 목표**다.
- 원 논문의 Transformer는 기계 번역을 위한 Encoder–Decoder 구조였다.
- GPT 계열은 원형 Transformer의 Decoder 계열을 바탕으로 발전했다.
- Attention 자체가 원 논문에서 최초로 등장한 것은 아니다.
- 원 논문의 핵심 기여는 순환 및 합성곱 계층을 중심에 두지 않고, Self-Attention을 중심으로 전체 Sequence Transduction 구조를 설계한 것이다.
- “Attention Is All You Need”는 문자 그대로 Attention 연산만 사용했다는 뜻이 아니다.

## 7. 이후 상세 검토가 필요한 쟁점

- 이미지 분류와 다음 토큰 예측의 공통점을 어디까지 강조해야 정확한가?
- 다음 토큰 예측만으로 복잡한 능력이 형성되는 과정을 어느 깊이까지 설명할 것인가?
- Transformer 설명에 사용할 하나의 문장 또는 코드 예시를 확정한다.
- 프로덕션 오류 사례의 가상 Repository와 Log가 실제 개발자가 보기에 자연스러운지 구현 단계에서 검증한다.
- 각 장면의 정확한 발표 문장과 READ 모드 본문 분량을 Storyboard에서 확정한다.
- 공식 문서가 변경될 수 있는 Claude Code 저장·Memory 세부는 구현 직전에 다시 확인한다.

## 8. 범위 밖 또는 지양할 방향

- AI 전체 역사를 연도순으로 나열하는 구성
- Transformer 논문 수식만을 순서대로 해설하는 구성
- Codex·Claude Code·OpenCode의 성능 순위 비교
- “모델이 인간처럼 이해한다”는 검증되지 않은 단정
- 인터랙션을 위해 핵심 설명을 지나치게 단순화하는 것

## 9. 참고 원문

- Vaswani et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), 2017
- OpenAI, [Improving language understanding with unsupervised learning](https://openai.com/index/language-unsupervised/), 2018-06-11
- Brown et al., [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165), 2020-05-28
- OpenAI, [Introducing ChatGPT](https://openai.com/index/chatgpt/), 2022-11-30
- OpenAI, [Introducing OpenAI o1-preview](https://openai.com/index/introducing-openai-o1-preview/), 2024-09-12
- Anthropic, [Claude 3.7 Sonnet and Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet), 2025-02-24
- OpenAI, [Introducing GPT-5](https://openai.com/index/introducing-gpt-5/), 2025-08-07

---

## 변경 기록

- v0.8: 가벼운 20~30분 공유에 맞춰 PRESENT CORE를 21~26분으로 압축. ACT 2의 수식·Block 세부를 Deep Dive로 이동하고, ACT 4를 프로덕션 오류 사례 안에서 API·Runtime·Loop·Context·Evaluation으로 통합. 첫 Tool Call을 `read_file`로 교정하고 배포 변경과 Legacy Data의 인과관계를 보강. 본편 모델 이정표를 최소 목록으로 확정.
- v0.7: 전체를 관통하는 사례를 “일부 사용자에게만 발생하는 프로덕션 500 오류”로 확정. Sanitized Log → Stack Trace → 코드 탐색 → 실패 재현 → 수정 → Regression Test의 전체 Trace와 각 Act의 연결, 20~30분 시간 흐름을 추가.
- v0.6: 20~30분 본편을 위한 `PRESENT / READ` 전달 모드와 별도 `DEEP DIVE` 축을 정의. Tool Calling을 실제 Anthropic Messages API 형식의 최소 JSON 왕복으로 보여주고, Model의 요청 생성과 Runtime의 로컬 실행을 명확히 분리.
- v0.5: 최상위 학습 목표를 “AI Agent를 이해 가능한 소프트웨어 시스템으로 바라보는 것”으로 명문화. Model 내부와 Model 주변의 두 층을 함께 학습하고, 개발자가 최종적으로 설명할 수 있어야 할 학습 성과 정의.
- v0.4: ACT 4의 주 사례를 Claude Code로 확정. Agent Runtime·Session·Compaction·CLAUDE.md·Auto Memory를 별도 심화 흐름으로 추가하고, OpenCode는 Open-source Harness 구현을 확인하는 보조 사례로 한정.
- v0.3: 발전사에 사용할 회사를 OpenAI와 Anthropic으로 한정. 모든 모델 이정표에 공식 공개 기준 `YYYY.MM`을 표시하고, 기술적 한계가 해결되는 순간에만 대표 모델을 등장시키는 규칙 확정.
- v0.2: 모델 발전사를 독립 연표가 아닌 보조 서사로 정의. 전체 흐름을 네 개의 Act로 재구성하고, Training Scale에서 Inference Scale과 Agent System으로 평가 단위가 확장되는 과정을 중심 서사에 통합.
- v0.1: 전체 목적과 질문 중심 골격 수립. 개·고양이 분류에서 다음 토큰 예측과 Transformer로 이어지는 첫 설명 흐름 기록.