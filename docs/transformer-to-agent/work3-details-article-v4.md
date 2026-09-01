# Work 3 Details Article v4 — LLM to AGENT

> **Repository:** `gmldbs25/build-canvas`  
> **Work:** Work 3 only  
> **Target:** `projects/transformer-to-agent`  
> **Document role:** Authoritative source for current Details article copy  
> **Status:** Reconciled with the latest Presentation master specification  
>
> This document defines the Details narrative, wording, explanation depth, and reveal timing for the current Work 3 sequence: `00`, `01–16`, `19`, and Appendix `A1`.
>
> Presentation composition, motion, scene removal, interaction, and visual behavior are governed by `work3-presentation-redesign-master-spec.md`.
>
> Legacy Scenes `17`, `18`, and `20` have been removed from the current experience and are intentionally absent from this manuscript.

---

# 00 — LLM to AGENT

Coding Agent에게 운영 서버에서 발생한 오류 로그를 주고 이렇게 요청했다고 해보자.

**“원인을 확인하고 코드를 수정한 뒤, 테스트까지 검증해줘.”**

잠시 뒤 Agent는 로그를 확인하고, Repository에서 관련 코드를 찾고, 필요한 파일을 읽고, 수정안을 적용하고, 테스트까지 실행한다. 첫 번째 수정이 실패하면 그 결과를 보고 다시 판단해 코드를 고칠 수도 있다.

겉으로 보면 하나의 AI가 Repository를 이해하고 직접 여러 행동을 수행하는 것처럼 보인다.

그런데 Language Model의 기본 생성 과정은 현재 입력을 바탕으로 다음 Token을 생성하고, 그 과정을 반복해 출력을 만드는 것이다.

그렇다면 질문은 이것이다.

**다음 Token을 생성하는 Model을 중심으로, Repository를 읽고 코드를 수정하고 테스트하는 Coding Agent는 어떻게 만들어질까?**

이 글은 그 과정을 다섯 단계로 나누어 본다.

먼저 **MODEL**에서 Language Model 자체가 무엇을 생성하는지 본다.

그다음 **CONTEXT**에서 Model이 무엇을 보고 판단하는지 살펴본다.

**MODEL ↔ ENVIRONMENT** 구간에서는 Model의 요청과 실제 외부 실행을 분리한다.

**LOOP**에서는 한 번의 Model Call과 실행 결과가 어떻게 다음 Model Call로 이어지는지 본다.

마지막으로 **AGENT**에서 지금까지 분리한 책임을 하나의 시스템으로 다시 조립한다.

출발점은 하나의 운영 장애다.

---

# 01 — The Incident

운영 서버에서 다음 오류가 발생했다.

```text
java.lang.NullPointerException
    at UserMapper.toResponse(UserMapper.java:42)
    at UserService.getUser(UserService.java:87)
    at UserController.getUser(UserController.java:51)
```

Stack Trace가 가리키는 `UserMapper.java:42`에는 다음 표현식이 있다.

```java
user.getProfile().getDisplayName()
```

지금 알고 있는 것은 여기까지다.

어떤 값이 `null`인지, 왜 그런 데이터가 들어왔는지, 어떤 수정이 올바른지는 아직 알 수 없다.

사용자는 Coding Agent에게 요청한다.

**“원인을 확인하고 수정한 뒤 테스트까지 검증해줘.”**

이 예제에서 관찰할 전체 Workflow는 대략 다음과 같다.

```text
READ LOG → SEARCH CODE → READ FILE → TRACE → PATCH → TEST → VERIFY
```

처음 보면 하나의 지능적인 프로그램이 처음부터 끝까지 모든 일을 직접 수행하는 것처럼 느껴진다.

하지만 이 행동을 이해하려면 가장 안쪽의 Language Model과 그 주변 시스템을 분리해서 볼 필요가 있다.

Repository도, File System도, Test Runner도 잠시 치워두자.

**Model 자체는 실제로 무엇을 할까?**

---

# 02 — Focus on the LLM

Language Model만 남겨 놓으면 구조는 훨씬 단순해진다.

Model은 입력을 받고 출력을 생성한다.

일반적인 autoregressive Language Model의 생성 과정을 가장 기본적인 수준에서 보면, 현재 입력을 바탕으로 **다음 위치에 올 Token에 대한 값을 계산하고 다음 Token을 결정하는 과정**이라고 볼 수 있다.

여기서 Token은 자연어의 단어와 정확히 같은 개념이 아니다.

Tokenizer에 따라 하나의 단어가 여러 Token으로 나뉠 수도 있고, 단어 일부나 공백, 문장부호가 별도의 Token 경계에 영향을 줄 수도 있다.

따라서 사람이 하나의 단어라고 생각하는 문자열과 Model이 실제로 처리하는 Token의 경계는 항상 일치하지 않는다.

또 하나 중요한 구분이 있다.

우리는 흔히 “Agent가 파일을 읽었다”, “Agent가 Shell을 실행했다”, “Agent가 코드를 수정했다”고 말한다.

하지만 이것이 **LLM inference 자체가 File System을 열거나 OS 명령을 직접 실행했다는 뜻은 아니다.**

우선 Model 안쪽의 생성 과정부터 보자.

**Model이 ‘다음 Token을 예측한다’는 것은 실제로 무엇을 의미할까?**

---

# 03 — Next Token

현재 입력은 먼저 Token 단위의 Sequence로 표현되고 Model 계산에 사용된다.

Model은 현재 Context를 바탕으로 다음 위치에 올 수 있는 Vocabulary Token 각각에 대해 score를 만든다. 이런 score를 일반적으로 `logit`이라고 부른다.

중요한 점은 **입력 Token 하나하나가 각각 하나의 logit으로 변환되는 것이 아니라**, 현재 Context 전체에 대한 Model 계산 결과로 다음 Token 후보들의 Vocabulary logits가 만들어진다는 것이다.

개념적으로는 다음과 같이 볼 수 있다.

```text
INPUT TEXT
→ TOKENS
→ MODEL CALCULATION
→ VOCABULARY LOGITS
→ SOFTMAX
→ PROBABILITIES
→ DECODING
→ NEXT TOKEN
```

예를 들어 현재 Sequence가 다음과 같다고 하자.

```text
java.lang.NullPointer ___
```

설명을 위해 단순화하면 다음 Token 후보가 이런 score를 가질 수 있다.

```text
Exception    8.7
Error        4.2
Method       1.8
Object       0.9
```

Softmax를 적용하면 이 score들을 다음 Token에 대한 확률 분포로 해석할 수 있다.

```text
Exception    72%
Error        15%
Method        7%
Object        3%
```

여기서 Token 경계와 숫자는 특정 Model을 실제 측정한 값이 아니라 **개념 설명용 예시**다.

그리고 다음 Token이 언제나 가장 높은 확률의 후보로 결정되는 것도 아니다. 생성 설정에 따라 가장 높은 후보를 선택할 수도 있고, 확률 분포를 이용해 sampling할 수도 있다.

따라서 더 정확하게 말하면 다음과 같다.

**Model은 다음 Token 후보들의 score를 생성하고, decoding 과정을 통해 실제 다음 Token이 결정된다.**

이 예시에서는 `Exception`이 선택되어 다음과 같은 Sequence가 될 수 있다.

```text
java.lang.NullPointerException
```

하지만 Token 하나가 결정되었다고 출력이 끝나는 것은 아니다.

---

# 04 — Generation Is Repetition

하나의 Token이 결정되면 그 Token은 현재 Sequence 뒤에 추가된다.

그리고 늘어난 Sequence를 조건으로 다시 다음 Token을 계산한다.

개념적으로 생성 과정은 다음과 같이 반복된다.

```text
CURRENT SEQUENCE
→ NEXT-TOKEN SCORES
→ DECODING
→ NEXT TOKEN
→ APPEND
→ NEXT PREDICTION
```

즉 Model은 `Exception`을 한 번 생성한 뒤 멈추는 것이 아니라, 방금 생성된 Token까지 포함한 Sequence를 조건으로 다시 다음 Token을 생성한다.

이 반복을 통해 한 문장을 만들 수도 있고, 긴 설명이나 여러 줄의 코드도 생성할 수 있다.

실제 inference에서는 KV Cache 같은 최적화를 통해 이전 계산의 일부를 재사용할 수 있기 때문에 매 Token마다 모든 연산을 완전히 처음부터 반복한다고 이해할 필요는 없다.

하지만 지금 필요한 핵심은 구현 최적화가 아니다.

**긴 출력도 결국 Token 단위 autoregressive generation의 반복으로 만들어진다.**

그렇다면 이 계산을 할 때 Model이 참고하는 **Context**에는 무엇이 들어 있을까?

---

# 05 — Context Grows with the Task

이 글에서 **Context**는 기본적으로 **현재 한 번의 Model Call에서 LLM이 볼 수 있도록 제공된 정보**를 의미한다.

Agent에게 처음 NPE 작업을 전달했을 때 Model Context는 비교적 단순할 수 있다.

```text
USER REQUEST
“이 NPE 원인을 찾아서 수정해줘.”

ERROR LOG
java.lang.NullPointerException
...
```

이것이 초기 Context다.

하지만 Agent 작업이 계속되면 이후 Model Call은 처음보다 더 많은 관련 정보를 받을 수 있다.

예를 들어 나중의 Model Context에는 다음과 같은 정보가 포함될 수 있다.

- User Request
- Error Log
- 관련 Source Code
- 이전 Tool Result
- 이전 작업에서 얻은 새로운 근거
- 필요한 경우 이전 대화나 요약된 상태

즉 작업이 진행될수록 Model이 판단에 사용할 수 있는 정보가 더 풍부해질 수 있다.

다만 이것을 **하나의 Prompt가 끝없이 그대로 길어지는 과정**으로 이해하면 안 된다.

각 Model Call마다 시스템은 현재 판단에 필요한 정보를 선택할 수 있고, 긴 History나 Tool Result를 요약하거나 일부만 포함할 수도 있다.

그래서 여기서 말하는 “Context가 커진다”는 것은 더 정확히 말하면:

> **작업이 진행되면서 이후 Model Call이 사용할 수 있는 관련 정보가 늘어나고, 그에 따라 더 풍부한 Context snapshot이 구성될 수 있다.**

라는 뜻이다.

지금은 이 새로운 정보가 **어떻게** 들어왔는지는 잠시 미뤄두자.

먼저 긴 Context 안의 여러 정보가 Model 계산에서 어떻게 함께 영향을 줄 수 있는지 보자.

---

# 06 — Evidence Across Context

Context 안의 정보는 단순히 독립된 문장이나 코드 조각을 한곳에 쌓아 둔 목록이 아니다.

Transformer의 Self-Attention을 통해 현재 Context 안의 서로 다른 위치에 있는 representation들은 Model 계산에서 서로 영향을 줄 수 있다.

코드에서도 비슷하게 생각할 수 있다.

예를 들어 한 위치에는 Stack Trace가 있고, 다른 위치에는 관련 Source Code가 있으며, 더 아래에는 호출 지점이나 관련 타입 정보가 있을 수 있다.

이 정보들이 모두 현재 Context 안에 있다면 서로 멀리 떨어져 있더라도 Model의 현재 출력 계산에 함께 영향을 줄 수 있다.

핵심은 이것이다.

**Context 안에서는 서로 떨어진 관련 근거들도 현재 Model 계산에 함께 사용될 수 있다.**

다만 이를 인간의 이해와 동일하게 해석해서는 안 된다.

Presentation에서 서로 떨어진 코드 조각 사이에 선을 그어 보여주더라도, 특정 Attention Head 하나가 그 관계를 정확히 “이해했다”거나 Model이 인간처럼 명시적인 의미 관계를 읽어냈다고 단정할 수는 없다.

또 화면에서 Context가 위아래로 스크롤되는 것처럼 보이더라도 그것은 **긴 Context의 서로 다른 위치를 시각화하기 위한 표현**이지, Model이 사람이 문서를 읽듯 순차적으로 스크롤한다는 뜻은 아니다.

여기서 더 중요한 질문으로 이어진다.

**Agent가 Repository에 접근할 수 있다는 것과 Repository 전체가 이미 Context에 들어 있다는 것은 같은 말일까?**

---

# 07 — Access Is Not Context

아니다.

실제 프로젝트에는 수천 개의 파일이 존재할 수 있다.

하지만 그 파일들이 전부 현재 Model Call의 Context에 들어가는 것은 아니다.

```text
REPOSITORY EXISTS
≠
IN MODEL CONTEXT
```

Agent System이 Repository에 접근할 수 있다는 것은 **필요한 정보를 가져올 수 있는 Capability가 있다**는 뜻이지, Repository 전체가 Model 내부에 항상 들어 있다는 뜻이 아니다.

현재 장애를 분석하는 데 필요한 정보는 그중 일부뿐일 수 있다.

실제 시스템은 Search를 통해 후보 파일을 찾고, 필요한 파일을 읽고, 긴 파일에서 관련 부분만 선택하거나, 이전 History와 Tool Result를 요약·압축할 수 있다.

Search Result와 Model Context도 같은 것이 아니다.

Search Tool이 파일 이름 몇 개를 반환했다고 해서 그 파일 전체 내용이 자동으로 Model Input에 들어온 것은 아니다. 이후 별도의 File Read가 필요할 수도 있고, 읽은 결과 중 일부만 다음 Context에 포함될 수도 있다.

따라서 목표는 가능한 한 모든 정보를 한 번에 집어넣는 것이 아니다.

**MORE CONTEXT ≠ BETTER CONTEXT**

중요한 것은 현재 Task를 해결하는 데 필요한 정보가 적절하게 선택되어 있는가다.

그렇다면 Context 밖의 Repository에 필요한 코드가 있다면, 그 정보는 실제로 어떻게 Model 쪽으로 들어올까?

---

# 08 — The Model Requests

현재 Context를 본 Model이 `UserMapper.java`의 내용을 더 확인해야 한다고 판단했다고 하자.

Tool을 사용할 수 있는 Agent System에서는 Model이 다음과 같은 의미의 구조화된 요청을 출력할 수 있다.

```text
READ
UserMapper.java
```

실제 시스템에서는 함수 호출, Tool Call, 구조화된 객체 등 다양한 형태가 사용될 수 있다. 모든 Agent가 동일한 JSON 문자열을 출력한다고 생각할 필요는 없다.

중요한 것은 **Model이 외부 행동을 직접 수행하는 것이 아니라, 외부 행동을 요청하는 출력을 만들 수 있다는 점**이다.

즉:

```text
MODEL REQUEST
≠
ENVIRONMENT ACTION
```

Model이 `UserMapper.java`를 읽고 싶다는 요청을 만들었다고 해서 파일이 이미 열린 것은 아니다.

파일 내용이 자동으로 Context에 추가된 것도 아니다.

Model은 현재 Context를 바탕으로 “무엇이 더 필요한가” 또는 “어떤 행동이 필요한가”를 출력할 수 있다.

하지만 실제 File System에 접근하는 권한과 실행 책임은 Model 밖에 있다.

**MODEL REQUESTS.**

그렇다면 실제 행동은 누가 수행할까?

---

# 09 — The Execution Layer Acts

이 글에서는 Model의 요청을 실제 Environment의 Capability와 연결하는 책임을 편의상 **Execution Layer**라고 부른다.

예를 들어 Model이 다음 요청을 만들었다고 하자.

```text
READ UserMapper.java
```

Execution 책임을 담당하는 시스템은 이 요청을 받아 실제로 수행 가능한지 확인하고, 필요한 Tool이나 File System Capability를 호출한다.

개념적으로는 다음과 같은 경로가 될 수 있다.

```text
MODEL REQUEST
→ EXECUTION RESPONSIBILITY
→ REPOSITORY / FILE SYSTEM
```

실제 제품에서는 이 역할이 Runner, Runtime, Orchestrator, Controller, Host Application, Hosted Service 등 여러 Component에 나뉠 수 있다.

따라서 `Execution Layer`를 모든 Agent가 반드시 가진 표준 Component 이름으로 이해해서는 안 된다.

중요한 것은 **책임의 분리**다.

Model은 파일을 읽고 싶다는 요청을 만든다.

실제 File Read는 Model 밖의 시스템이 Repository에 접근해 수행한다.

그리고 실행 결과가 생성된다.

```text
REQUEST
→ EXECUTE
→ RESULT
```

여기까지가 한 번의 외부 행동이다.

그렇다면 이 Result가 어떻게 다시 Model의 다음 판단에 사용될까?

---

# 10 — Result Becomes Next Model Context

Execution을 통해 `UserMapper.java`가 실제로 읽히면 Tool Result가 생긴다.

예를 들어 Agent System에는 다음과 같은 새로운 정보가 생긴다.

```text
TOOL RESULT
UserMapper.java contents
```

이 결과는 이후 Model Call에 사용할 수 있는 새로운 정보가 될 수 있다.

하지만 여기에도 중요한 구분이 있다.

**TOOL RESULT ≠ TRAINING**

파일을 읽었다고 Model Parameter가 업데이트되는 것은 아니다.

Model이 Repository를 영구적으로 학습한 것도 아니다.

현재 Agent Run에 새로운 정보가 생긴 것이고, 시스템은 그 정보를 이후 Model Call의 Context에 포함할 수 있다.

또한 Tool Result 전체가 반드시 그대로 Context에 복사되는 것도 아니다.

Result가 길다면 필요한 부분만 선택하거나 요약할 수 있다.

예를 들어 다음 Model Call의 Context는 이렇게 구성될 수 있다.

```text
NEXT MODEL CONTEXT

USER REQUEST
ERROR LOG
RELEVANT UserMapper.java RESULT
```

이때 `NEXT MODEL CONTEXT`는 Agent가 가진 전체 상태와도 같지 않다.

Agent System에는 Tool History, 승인 상태, Iteration 정보 등이 별도로 남아 있을 수 있고, Workspace에는 실제 수정된 파일 같은 Environment State가 존재할 수 있다.

그 전체가 매번 Model Context에 복사되는 것은 아니다.

핵심은 다음과 같다.

**Environment의 Result가 새로운 Agent 정보가 되고, 필요한 정보가 다음 Model Context로 구성될 수 있다.**

그런데 여기에서 한 가지 중요한 의문이 생긴다.

---

# 11 — One Pass Is Not the Final Answer

보통 가장 단순한 LLM 사용을 생각하면 다음 구조를 떠올리기 쉽다.

```text
CONTEXT
→ MODEL
→ FINAL ANSWER
```

하지만 Agent 작업에서는 Model을 한 번 호출했다고 반드시 작업이 끝나는 것은 아니다.

앞에서 초기 Context를 본 Model은 바로 최종 수정 결과를 말하는 대신 다음과 같은 Output을 만들었다.

```text
READ UserMapper.java
```

즉 첫 번째 Model Output은 **Final Answer가 아니라 다음 행동을 위한 Request**였다.

그리고 실제 시스템이 그 요청을 실행한 뒤 새로운 Result가 생겼다.

이제 이전보다 더 풍부한 다음 Model Context를 구성할 수 있다.

여기서 질문이 생긴다.

**첫 번째 Output이 Final Answer가 아니었고, 새로운 Context가 생겼다면 그다음에는 어떻게 될까?**

다시 Model을 호출할 수 있다.

그리고 새로운 Context를 받은 Model은 이전과 다른 다음 행동을 선택할 수 있다.

이 지점에서 단순한 한 번의 Tool Call이 아니라 **반복적인 Agent 작업 구조**가 필요해진다.

---

# 12 — The Agent Loop

지금까지의 요소를 하나의 반복 구조로 연결해보자.

하나의 User Goal이 있다.

현재 Model Context가 Model에 들어간다.

Model은 Text를 생성하거나 다음 행동을 위한 Tool Request를 만들 수 있다.

Execution System은 요청을 실제 Capability와 연결한다.

Tool은 Environment에서 작업하고 Result를 반환한다.

Result는 Agent의 상태에 반영된다.

그리고 시스템은 다음 판단에 필요한 정보를 선택해 **다음 Model Context**를 구성한다.

다시 Model을 호출한다.

개념적으로는 다음과 같다.

```text
GOAL + CURRENT MODEL CONTEXT
→ MODEL
→ REQUEST
→ EXECUTION
→ RESULT
→ UPDATED AGENT / ENVIRONMENT STATE
→ NEXT MODEL CONTEXT
→ MODEL AGAIN
```

이 구조에서 중요한 점은 같은 일을 기계적으로 반복하는 것이 아니라는 것이다.

매 Iteration마다 새로운 Result가 생길 수 있고, 그 Result가 다음 판단에 사용할 정보를 바꾼다.

그래서 Model의 다음 Output도 달라질 수 있다.

여기서 **Model Call**과 **Agent Run**을 구분하면 구조가 더 명확하다.

Model Call은 Model에 대한 한 번의 호출이다.

Agent Run은 하나의 User Goal을 수행하기 위해 여러 Model Call과 여러 Tool Execution을 포함할 수 있는 전체 작업 단위다.

그리고 다시 강조할 점이 있다.

**MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE.**

Agent Run이 진행되는 동안 시스템에는 Tool History, Approval 상태, Iteration 정보 같은 실행 상태가 유지될 수 있다.

Workspace에는 변경된 파일 같은 Environment State도 남아 있을 수 있다.

이 전체를 매 Model Call에 그대로 넣는 것은 아니다.

시스템은 다음 판단에 필요한 Context를 선택하고, 필요하면 요약하거나 압축한다.

이제 이 추상적인 Loop를 실제 NullPointerException 문제에 적용해보자.

---

# 13 — Follow the NPE Through the Loop

하나의 가능한 Agent Run을 따라가 보자.

출발점은 다음 두 정보다.

```text
USER REQUEST
“이 NPE 원인을 찾아서 수정한 뒤 테스트까지 검증해줘.”

ERROR LOG
java.lang.NullPointerException
at UserMapper.java:42
```

첫 번째 Model Call에서 가장 직접적인 단서는 `UserMapper.java:42`다.

Model의 관찰 가능한 판단을 짧게 요약하면 다음과 같다.

```text
OBSERVATION
Stack Trace가 UserMapper.java:42를 가리킨다.

NEXT ACTION
Repository에서 관련 구현을 찾는다.
```

Model은 Search를 요청할 수 있다.

```text
search_code("UserMapper")
```

Execution을 통해 Repository Search가 수행되고 후보 경로가 Result로 돌아온다.

다음 Model Context에는 이 Search Result가 필요한 형태로 포함될 수 있다.

Model은 실제 구현을 확인하기 위해 `UserMapper.java` 읽기를 요청한다.

파일을 읽으면 Stack Trace가 가리킨 위치에서 다음 코드를 확인할 수 있다.

```java
user.getProfile().getDisplayName()
```

이제 처음보다 정보가 많아졌다.

하지만 이 표현식만 보고 어떤 값이 `null`인지 바로 확정하면 안 된다.

`user`가 `null`일 수도 있고, `profile`이 없을 수도 있다.

따라서 관련 타입, 생성 경로, Fixture 또는 호출 지점을 추가로 확인할 수 있다.

이 과정에서 기존 데이터 중 일부 User는 `profile`이 존재하지 않을 수 있다는 근거를 얻었다고 하자.

이제 다음 두 사실이 함께 Context에 들어올 수 있다.

1. Stack Trace는 `UserMapper.java:42`를 가리킨다.
2. 해당 위치에서 `user.getProfile().getDisplayName()`을 호출하고 있으며, 기존 데이터에는 `profile == null`인 User가 존재할 수 있다.

이 시점에서야 다음과 같은 판단에 충분한 근거가 생긴다.

```text
WORKING HYPOTHESIS
profile == null 이 현재 NPE의 유력한 원인이다.
```

중요한 점은 **원인이 처음부터 Model에게 주어져 있지 않았다는 것**이다.

Log와 Repository에서 필요한 정보를 차례로 얻고, 다음 Model Call의 Context가 달라지면서 원인을 좁혀간 것이다.

이 Run에서는 우선 NPE를 방어하는 첫 번째 Patch를 적용하고 실제 Test로 검증해보자.

Model은 Patch 내용을 생성하고 Edit/Patch 행동을 요청할 수 있다.

Execution을 통해 실제 Workspace가 변경된다.

하지만 수정했다고 작업이 끝나는 것은 아니다.

사용자의 Goal에는 **테스트 검증**까지 포함되어 있다.

따라서 기존 Test/Validation을 실행한다.

그리고 여기에서 새로운 정보가 등장한다.

---

# 14 — Patch, Test, Revise

첫 번째 Patch에서 `profile == null`인 경우 `displayName`에 단순히 `null`을 사용하도록 수정했다고 하자.

이 변경은 NullPointerException 자체는 막을 수 있다.

```text
NPE
→ RESOLVED
```

잠깐 보면 문제가 해결된 것처럼 보인다.

하지만 Repository에 이미 존재하는 관련 Test를 실행하자 다음 결과가 나온다.

```text
expected: "Unknown"
actual: null
```

Test는 실패했다.

여기서 중요한 것은 Agent가 처음부터 `"Unknown"`이라는 계약을 알고 있었던 것이 아니라는 점이다.

**Test Failure가 새로운 요구사항을 드러냈다.**

NPE만 제거하는 것이 목표가 아니라, `profile`이 없는 경우에도 기존 Contract에 맞는 `displayName`을 반환해야 했다.

이 실패는 단순히 빨간 Error 화면이 아니다.

다음 판단에 사용할 수 있는 **새로운 Result / Feedback**이다.

```text
PATCH #1
→ TEST
→ FAIL
→ NEW EVIDENCE
→ NEXT MODEL CONTEXT
```

다음 Model Call에서 관찰 가능한 판단을 요약하면 다음처럼 표현할 수 있다.

```text
OBSERVATION
NPE는 사라졌다.

NEW EVIDENCE
null 반환은 기존 Test Contract를 깨뜨린다.

NEXT ACTION
Patch를 수정한다.
```

Model은 필요하다면 관련 Test를 읽어 기대 동작을 확인하고 Patch를 다시 수정할 수 있다.

예를 들어 최종 의미는 다음과 같다.

```java
profile != null ? profile.getDisplayName() : "Unknown"
```

그리고 Test를 다시 실행한다.

이 과정은 Model을 재학습시키는 것이 아니다.

**Environment의 실패 Feedback이 다음 Model Call의 판단 근거가 된 것**이다.

Agent Loop의 중요한 가치는 첫 번째 출력이 항상 정답이라는 데 있지 않다.

**실행 결과를 관찰하고, 실패까지 새로운 근거로 받아들여 다음 행동을 수정할 수 있다는 데 있다.**

---

# 15 — Task Complete

두 번째 Patch를 적용한 뒤 다시 Test를 실행한다.

이번에는 관련 Test가 통과했다고 하자.

```text
PATCH #2
→ RUN TESTS
→ PASS
→ VERIFY
```

NPE는 해결되었고, 기존 Contract도 만족한다.

이제 처음 User Goal과 현재 상태를 비교할 수 있다.

```text
GOAL
원인을 확인하고 수정한 뒤 테스트까지 검증

CURRENT STATE
NPE RESOLVED
PATCH VERIFIED
TESTS PASSED
```

목표가 충족되었다면 더 이상 새로운 Tool Action을 계속 만들 필요가 없다.

```text
OBJECTIVE SATISFIED
→ FINAL RESPONSE
→ STOP
```

이 점이 중요하다.

Agent Loop의 목적은 가능한 한 오래 반복하는 것이 아니다.

**필요한 행동을 반복하다가 적절한 종료 조건에 도달하면 멈추는 것**이다.

현재 NPE 사례에서는 성공적인 수정과 검증 완료가 가장 자연스러운 종료 조건이다.

다른 작업에서는 사용자 승인이나 추가 입력이 필요해서 멈출 수도 있고, 권한이 없거나 복구하기 어려운 Error, 시간·비용·Iteration 제한 때문에 종료될 수도 있다.

하지만 이 사례에서 기억해야 할 것은 단순하다.

Scene 14에서는:

```text
PATCH → TEST → FAIL → UPDATE → REVISE
```

였고,

Scene 15에서는:

```text
PATCH → TEST → PASS → COMPLETE
```

가 되었다.

이렇게 하나의 Agent Run이 끝난다.

---

# 16 — An Agent Is a System

지금까지 하나씩 분리했던 책임을 다시 하나의 시스템으로 모아보자.

가운데에는 **MODEL**이 있다.

Model은 현재 Context를 입력받고 Text Output이나 Tool Request를 생성하는 핵심 계산 엔진이다.

하지만 Model 하나만으로 Coding Agent 전체가 되지는 않는다.

## CONTEXT

현재 Model Call에서 무엇을 볼 수 있는지를 결정한다.

User Goal, Instructions, Logs, Source Code, Search Result, Tool Result 등이 어떤 형태로 선택되고 구성되는지가 다음 판단에 영향을 준다.

## TOOLS

Model이 어떤 외부 행동을 요청할 수 있는지에 영향을 준다.

Search, Read, Edit, Patch, Shell, Test 같은 Capability가 여기에 포함될 수 있다.

## EXECUTION

Model의 Tool Request를 실제 Capability와 연결한다.

실제 Environment에서 행동을 수행하고 Result 또는 Error를 Agent Workflow에 반환한다.

## ENVIRONMENT

Repository, File System, Workspace, Shell, Test Runner처럼 실제 작업 대상과 상태가 존재하는 곳이다.

Model Context와 Environment 자체는 같은 것이 아니다.

## CONTROL

**무엇이 허용되는가?**

Permission, Sandbox, Approval, Guardrail처럼 행동 가능 범위를 관리한다.

## VALIDATION

**결과가 실제로 맞는가?**

Test, Build, Lint, Type Check, Diff Review, Human Review 등을 통해 작업 결과의 정확성과 완료 여부를 확인한다.

Control과 Validation은 서로 관련이 있지만 같은 책임이 아니다.

## FEEDBACK / LOOP

Execution Result와 Validation Result를 이후 상태와 다음 Model Context에 연결한다.

이 구조를 통해 한 번의 Model Call이 여러 행동과 Feedback을 포함하는 Agent Run으로 이어질 수 있다.

이러한 Model 주변의 broader system을 편의상 Agent Harness라고 부르기도 한다.

하지만 Agent, Runner, Runtime, Harness, Orchestrator 같은 이름과 Component Boundary는 제품과 Framework마다 다르다.

그래서 이름보다 **어떤 책임을 담당하는가**를 보는 편이 더 안전하다.

여기까지 오면 중요한 결론이 나온다.

**Agent는 하나의 마법 같은 Model이 아니라, Model을 중심으로 여러 책임이 결합된 시스템이다.**

그리고 Tool Calling 하나만으로 Coding Agent 전체를 설명할 수도 없다.

이제 처음의 질문에 가장 짧게 답할 수 있다.

---

# 19 — LLM to AGENT

처음의 질문은 이것이었다.

**다음 Token을 생성하는 Model을 중심으로, Repository를 읽고 코드를 수정하고 테스트하는 Coding Agent는 어떻게 만들어질까?**

여기까지 본 뒤에는 답을 더 짧게 말할 수 있다.

**LLM → AGENT**

Language Model 자체의 핵심 역할은 여전히 현재 Context를 바탕으로 출력을 생성하는 것이다.

그 Output은 자연어 답변일 수도 있고, Agent System 안에서는 외부 행동을 위한 Request를 표현할 수도 있다.

하지만 Prediction이 만들어졌다고 실제 행동이 일어난 것은 아니다.

Model 밖의 시스템이 그 요청을 실제 Capability와 연결하고 Environment에서 행동을 수행한다.

그 결과는 Agent의 새로운 정보가 된다.

시스템은 그 상태와 Result에서 다음 판단에 필요한 Context를 구성해 다시 Model을 호출할 수 있다.

Validation은 실제 결과가 올바른지 확인하고, 실패는 다음 행동을 바꾸는 Feedback이 될 수 있다.

목표에 도달하면 Loop는 종료되고 최종 결과가 사용자에게 돌아간다.

즉 다음 Token을 생성하는 Model 자체가 어느 순간 File System과 Shell을 가진 존재로 변한 것이 아니다.

**Model의 Prediction을 Context, Execution, Environment, Feedback, Validation, 반복 호출과 연결하는 시스템이 만들어진 것이다.**

전체 내용을 가장 짧게 압축하면 다음과 같다.

**The model predicts.**

**The system turns predictions into actions.**

Model은 Agent의 핵심이다.

하지만 Agent는 Model 하나가 아니다.

---

# A1 — Reference & Artwork

## Conceptual Artwork

마지막 Artwork는 특정 Coding Agent 제품의 실제 내부 Architecture를 그대로 옮긴 Diagram이 아니다.

이 글에서 설명한 책임과 관계를 하나의 장면으로 압축한 **Conceptual Artwork**다.

각 요소는 실제 Component를 1:1로 복제하기보다 하나의 책임을 상징한다.

### MODEL

현재 Context를 입력받고 Output을 생성하는 핵심 Language Model을 나타낸다.

Model은 Agent의 핵심이지만 Agent 전체를 의미하지 않는다.

### CONTEXT

User Goal, Instructions, Source Code, Log, Tool Results 등 현재 Model 판단에 사용할 수 있도록 한 Model Call에 제공된 정보를 나타낸다.

Repository 전체나 Agent State 전체가 그대로 Model 안에 존재한다는 뜻은 아니다.

### TOOL REQUEST

Model이 외부 행동을 원할 때 생성할 수 있는 구조화된 Output을 나타낸다.

행동 그 자체가 아니다.

**MODEL REQUESTS.**

### EXECUTION

Model의 요청을 실제 Capability와 연결하는 시스템 책임을 나타낸다.

**SYSTEM EXECUTES.**

`Execution Layer`는 이 책임을 설명하기 위한 개념적 이름이며 모든 제품의 표준 Component 이름은 아니다.

### ENVIRONMENT

Repository, File System, Workspace, Shell, Test Runner, External Service처럼 실제 개발 작업이 일어나고 상태가 존재하는 외부 환경을 나타낸다.

### RESULT / FEEDBACK

Environment에서 얻은 결과가 다시 Agent Workflow로 돌아오는 흐름을 나타낸다.

Tool Result나 Test Failure가 돌아온다고 Model Parameter가 재학습되는 것은 아니다.

### LOOP

다음과 같은 반복적 Interaction을 나타낸다.

```text
MODEL
→ REQUEST
→ EXECUTION
→ RESULT
→ UPDATED STATE
→ NEXT MODEL CONTEXT
→ MODEL
```

모든 Agent 제품의 실제 내부 실행 순서가 정확히 동일하다는 뜻은 아니다.

### CONTROL

Permission, Sandbox, Approval, Guardrail처럼 Agent가 어디까지 행동하도록 허용할지를 관리하는 책임을 나타낸다.

### VALIDATION

Test, Build, Lint, Type Check, Diff Review, Human Review처럼 실제 결과가 올바른지를 확인하는 책임을 나타낸다.

Control과 Validation은 서로 다른 책임이다.

### Final Interpretation

이 Artwork는 Coding Agent를 **Language Model을 실제 개발 Environment와 연결하고, 실행 결과와 Feedback을 다시 이후 판단에 사용할 수 있도록 구성한 시스템**으로 바라보는 Mental Model을 한 장에 압축한 것이다.

---

## Glossary

### Token

Language Model이 처리하는 단위다. 자연어 단어와 항상 1:1로 대응하지 않는다.

### Logit

다음 Token 후보에 대해 Model이 생성하는 score다. Softmax를 통해 확률 분포로 해석할 수 있다.

### Decoding

Model이 만든 다음 Token 후보 분포에서 실제 다음 Token을 결정하는 과정이다. Greedy selection이나 sampling 등 설정에 따라 방식이 달라질 수 있다.

### Context

이 글에서는 기본적으로 현재 한 번의 Model Call에서 LLM이 볼 수 있도록 제공된 정보를 의미한다. Agent Runtime State 전체와 같은 개념은 아니다.

### Context Window

Model이 한 번의 Call에서 처리할 수 있는 입력 범위다.

### Tool Request

Model이 생성할 수 있는 구조화된 행동 요청이다. 요청이 생성되었다고 실제 실행이 보장되는 것은 아니다.

### Tool Execution

Tool Request를 실제 Capability로 수행하는 별개의 시스템 책임이다.

### Execution Layer

Model의 요청을 실제 Tool/Capability와 연결하고 Result를 Workflow에 반환하는 책임을 이 글에서 편의상 부르는 표현이다. 보편적인 필수 Component 이름은 아니다.

### Environment

Repository, File System, Workspace, Shell, Test Runner 등 Agent가 실제로 읽거나 변경하거나 실행 결과를 얻는 외부 작업 영역을 말한다.

### Model Call

Model에 대한 한 번의 호출이다.

### Agent Run

하나의 User Goal을 수행하기 위해 여러 Model Call과 Tool Execution을 포함할 수 있는 전체 작업 단위다.

### Agent State

Agent Run이 진행되는 동안 시스템과 Environment가 유지하는 작업 관련 상태를 넓게 표현한 말이다. 이 전체 상태가 항상 Model Context에 그대로 포함되는 것은 아니다.

### Control

Permission, Sandbox, Approval처럼 Agent가 어떤 행동을 실행하도록 허용할지를 관리하는 책임이다.

### Validation

Test, Build, Lint, Diff 등의 실제 결과를 통해 작업의 정확성과 완료 여부를 확인하는 책임이다.

### Feedback

Tool Result, Test Result, Execution Error처럼 이후 판단이나 행동을 바꿀 수 있는 실행 결과 정보를 말한다.

### Agent Harness

Model을 실제로 동작하는 Agent Experience로 만들기 위한 주변 시스템을 편의상 가리킬 때 사용할 수 있는 표현이다. 표준화된 필수 Architecture 용어는 아니다.
