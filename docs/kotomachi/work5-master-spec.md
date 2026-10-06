# Work 5 Master Spec — KotoMachi Development Article

## 목적

Work 5는 **KotoMachi를 제품처럼 소개하거나 홍보하는 페이지가 아니다.**

KotoMachi라는 개인 토이 프로젝트를 기획하고, AI Agent와 함께 구현하고, 직접 플레이하면서 문제를 발견하고, 반복적으로 개선해 간 경험을 기록하는 **개발 아티클 / 개발 후기**다.

완성된 기능 목록보다 다음 질문에 더 집중한다.

- 처음 무엇을 만들고 싶었는가
- 실제로 만들면서 어떤 판단이 바뀌었는가
- 현재 상황과 프로젝트 규모에 맞춰 어떤 기술과 배포 방식을 선택했는가
- 플레이 결과를 보고 무엇을 다시 고쳤는가
- AI Agent와 일하는 방식과 harness가 어떻게 발전했는가
- 이 경험을 통해 사람인 개발자가 무엇을 느끼고 배웠는가

KotoMachi 자체는 글의 소재이며, Work 5의 중심은 **“기획하고 만들어보고 개선해 본 경험”**이다.

---

## 프로젝트 위치와 역할

### KotoMachi

`/Users/heeyoon/workspace/kotomachi`

- KotoMachi 원본 프로젝트
- Work 5 콘텐츠 조사를 위한 **Source of Truth**
- 코드, 문서, assets, 설정, AGENTS.md, Git history와 주요 commit을 참고한다.
- 현재 상태만 보지 말고 개발 과정에서 무엇이 어떻게 바뀌었는지도 조사한다.
- Work 5 작업에서는 원칙적으로 수정하지 않는다.

### Build Canvas

`/Users/heeyoon/workspace/build-canvas`

- Work 5의 실제 구현 대상
- Work 5 관련 설계 문서와 콘텐츠도 이 repository에서 관리한다.
- Build Canvas의 공통 규칙은 `README.md`와 `AGENTS.md`를 따른다.

---

## 콘텐츠의 두 화자

Work 5에는 **AI Agent와 Human 두 관점**이 함께 등장한다.

### AI Agent

KotoMachi repository의 실제 코드와 개발 기록을 근거로 다음을 정리한다.

- 프로젝트가 어떻게 시작되고 변화했는지
- 중요한 기획 및 제품 방향의 변화
- 기술 선택과 그 배경
- 학습 구조, 게임 구조, 비주얼, 음성, 저장/배포 등의 개선 과정
- Agent 협업 방식과 harness의 변화
- 잘 되지 않았던 시도와 남은 과제

과장된 제품 홍보 문구보다 사실 기반의 개발 기록에 가깝게 작성한다.

### heeyoon / Human

본문 중 필요한 지점에 1인칭 코멘트를 짧게 삽입한다.

- 당시의 기획 의도
- 선택을 내린 이유
- 기대와 실제 결과의 차이
- 직접 플레이하면서 느낀 문제
- Agent와 일하면서 느낀 점과 판단

Human Note는 모든 섹션에 기계적으로 넣지 않는다. 사람의 관점이 실제로 의미를 더하는 위치에만 사용한다.

핵심 원칙은 다음과 같다.

> **Agent가 무슨 일이 있었는지를 설명하고, Human이 왜 그런 판단을 했는지를 덧붙인다.**

글 후반에는 별도의 **Developer Interview** 섹션을 두고, AI Agent가 만든 질문에 대한 heeyoon의 비교적 순수한 답변을 Q&A 형식으로 남긴다. 인터뷰 답변은 이후 별도로 작성하며, 현재 설계 단계에서는 임의로 만들어 넣지 않는다.

---

## 예상 콘텐츠 흐름

아래 구조는 초기 골격이며, KotoMachi repository 조사 결과와 실제 글의 흐름에 따라 제목과 순서는 조정할 수 있다.

1. **Hero — KotoMachi를 만들며**
2. **시작하게 된 이유**
3. **처음 생각한 것과 실제로 만든 것**
4. **기획과 게임 설계**
5. **현재 상황에 맞는 기술을 선택하기**
6. **만들고, 플레이하고, 다시 고치기**
7. **Agent와 개발한다는 것**
8. **잘 되지 않았던 것과 남은 과제**
9. **Developer Interview**
10. **Play KotoMachi**

끝에는 현재 Vercel 배포본으로 이동할 수 있는 링크를 둔다. 제품 CTA보다는 **“글을 읽은 뒤 실제 결과물을 확인해 보는 링크”** 정도의 톤을 유지한다.

---

## 디자인 가드레일

Work 5는 세부 화면 시안을 고정하지 않는다. 실제 레이아웃, 타이포그래피, 여백, 이미지 배치, Human Note 표현 방식 등은 구현 시 자율적으로 설계한다.

다만 다음 방향은 유지한다.

- **Medium / Notion 계열의 가벼운 개발 아티클**을 기본 인상으로 한다.
- 제품 Landing Page처럼 만들지 않는다.
- KotoMachi의 따뜻한 pastel tone을 포인트로 가볍게 차용한다.
- 글과 실제 개발 기록이 화면의 주인공이어야 한다.
- Feature Card, 제품 장점 나열, 강한 CTA 등 제품 소개형 UI를 남발하지 않는다.
- 실제 KotoMachi 게임 화면과 기존 asset을 우선 활용한다.
- 새 장식 일러스트는 꼭 필요할 때만 최소한으로 사용한다.
- Human Note와 Agent 본문은 읽는 사람이 두 관점을 쉽게 구분할 수 있도록 시각적 차이를 둔다.
- heeyoon을 캐릭터로 표현해야 하는 경우 남성 캐릭터로 표현한다.

위 항목은 디자인을 세세하게 고정하기 위한 요구사항이 아니라 **방향성을 위한 가드레일**이다. 기존 Work UI를 기계적으로 복제하지 말고, 긴 개발 아티클을 읽는 경험에 가장 적합한 구성을 자율적으로 제안하고 구현한다.

---

## 읽기 UX

- viewport 최상단에 얇은 **Reading Progress Bar**를 둔다.
- Desktop에서는 본문 좌측 또는 우측에 **sticky TOC**를 둔다.
- TOC에는 대제목만 표시한다.
- 현재 읽고 있는 섹션을 은은하게 강조하고, 클릭하면 해당 섹션으로 이동한다.
- Mobile에서는 본문 가독성을 해치지 않도록 TOC를 축소하거나 숨길 수 있다.
- Work 1~5를 나열하는 별도 상단 navigation은 추가하지 않는다.
- Build Canvas 공통 규칙에 따라 **`H` 키로 Home으로 복귀**할 수 있어야 한다.

---

## 콘텐츠 관리

긴 아티클 본문을 React/JSX 컴포넌트 안에 직접 하드코딩하지 않는다.

Markdown/MDX 또는 현재 Build Canvas 구조에 적합한 콘텐츠 분리 방식을 사용해, 이후 사람이 문장과 인터뷰 답변을 쉽게 수정할 수 있도록 한다.

화면 컴포넌트와 콘텐츠 원문은 가능한 한 역할을 분리한다.

---

## KotoMachi 조사 원칙

Work 5 본문을 작성하기 전에 KotoMachi repository를 직접 조사한다.

최소한 다음을 확인한다.

- README 및 주요 docs
- AGENTS.md와 Agent 관련 설정/문서
- 실제 source 구조
- 주요 assets와 design reference
- PWA / save / offline / deployment 관련 설정
- Git history와 주요 commit
- 개발 단계별 변화가 남아 있는 문서

현재 코드만 보고 과거 개발 과정을 추측하지 않는다. 문서와 Git history를 함께 보고, 확인 가능한 사실을 기준으로 개발 흐름을 재구성한다.

조사 결과는 필요하면 Build Canvas 내부에 다음과 같은 별도 자료 문서로 정리한다.

`docs/kotomachi/work5-source-notes.md`

이 문서는 아티클 본문이 아니라 구현을 위한 내부 fact sheet 역할을 한다.

---

## 최종 목표

완성된 Work 5는

> “KotoMachi라는 게임을 소개하는 페이지”

보다는

> **“한 개발자가 AI Agent와 함께 작은 게임을 기획하고 만들어보고, 시행착오를 거치며 프로젝트와 개발 방식 자체를 개선해 간 기록”**

으로 읽혀야 한다.

기술적인 내용과 프로젝트 변화는 Agent가 사실 기반으로 정리하고, 그 사이에 Human의 의도와 경험이 자연스럽게 교차하는 것이 Work 5의 가장 중요한 편집 콘셉트다.
