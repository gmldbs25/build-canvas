# TRANSFORMER TO AGENT — 디자인·인터랙션 설계서

> 상태: 구현 기준안 v1.0  
> 목적: 확정된 내용을 웹에서 직관적으로 이해시키기 위한 시각 언어, 장면, 인터랙션과 모션 원칙을 정의한다.

## 1. 디자인 목표

- 웹을 보는 순간 핵심 관계와 변화가 눈에 들어와야 한다.
- 텍스트 설명을 읽기 전에 애니메이션만으로도 개념의 큰 흐름을 추론할 수 있어야 한다.
- 애니메이션은 장식이 아니라 **입력·연산·상태 변화·반복 구조를 설명하는 수단**이어야 한다.
- 한 장면에서는 하나의 핵심 변화에만 집중한다.
- 전체적으로 미니멀한 화면을 유지하되, 핵심 장면은 충분한 크기와 시각적 완성도를 갖춘다.
- 발표자가 없어도 이해할 수 있도록 시각 요소와 짧은 설명이 함께 작동해야 한다.

## 2. 전체 경험의 방향

### 언어 원칙

- 화면 제목, 본문, 질문, 안내 문구는 **한글을 기본 언어**로 사용한다.
- 프로젝트 제목 `TRANSFORMER TO AGENT`와 코드·API 필드명은 원문 표기를 유지한다.
- `Self-Attention`, `Tool Calling`, `Agent Loop`, `Context`처럼 개발자에게 영어가 더 익숙한 기술 용어는 억지로 번역하지 않는다.
- 필요한 경우 첫 등장에만 `도구 호출(Tool Calling)`처럼 한글 설명과 영어 원어를 함께 쓰고, 이후에는 하나의 표기로 통일한다.
- 영어 대문자 Label을 장식적으로 남발하지 않는다. 영어는 브랜드·제품명·기술 용어·실제 코드에 필요한 경우에만 사용한다.
- 발표 모드는 짧고 말하기 쉬운 한글 문구를, 아티클 모드는 자연스러운 한글 설명을 우선한다.

### 기본 성격

`TRANSFORMER TO AGENT`는 하나의 콘텐츠를 발표와 독립적인 읽기 경험 모두에 사용할 수 있는 **시각적 설명 웹**을 지향한다.

확정된 기본 구조:

```text
Presentation: Page 진입 → Beat 자동 재생 → 발표자 방향키 진행
Article: 자연스러운 Scroll → 본문 속 동일 Animation 개별 재생
```

Presentation은 Page·Beat 기반 진행을, Article은 Scroll 기반 읽기를 사용한다. 두 모드는 같은 콘텐츠와 의미 상태를 공유한다.

### 두 가지 전달 모드

모든 장면은 하나의 콘텐츠와 애니메이션 의미 상태를 공유하고, Layout과 표시 밀도만 전환한다.

| 요소 | PRESENTATION | ARTICLE |
|---|---|---|
| 목적 | 20~30분 발표와 화면 집중 | 발표 없이 독립적으로 읽기 |
| 화면 | 핵심 시각을 화면 대부분에 배치 | 시각 자료와 본문을 함께 배치 |
| 텍스트 | 제목, 질문, 핵심 결론만 | 설명, 용어, 출처, 주의 사항 포함 |
| 진행 | 키보드·클릭·단계별 재생 | 자연스러운 스크롤·개별 재생 |

화면 우측 상단의 `[ Presentation | Article ]` 전환은 새 페이지를 여는 기능이 아니다. 전환 시 다음 상태를 보존한다.

- 현재 Page ID
- 현재 Beat와 완료 여부
- 아티클의 대응 Section Anchor와 읽기 위치
- 펼쳐 둔 Deep Dive 상태

`PRESENTATION / ARTICLE`은 전달 방식이고 `CORE / DEEP DIVE`는 깊이이므로 하나의 Toggle로 합치지 않는다.

#### 모드 전환 구조

두 모드는 별도의 콘텐츠를 복제하지 않고 하나의 콘텐츠 모델과 상태를 공유한다.

```text
Page Content + Beat Definition + Shared Animation
                    ↓
           Shared Semantic State
                    ↓
      Presentation Layout / Article Layout
```

공유 상태의 기본 형태:

```text
mode
pageId
beatIndex
beatCompleted
articleAnchor
deepDiveState
```

- Presentation과 Article은 같은 Animation Component와 Beat 정의를 사용한다.
- 모드 전환은 Layout만 바꾸며 현재 Page와 Beat를 초기화하지 않는다.
- 아티클에서 특정 애니메이션을 보다가 발표 모드로 전환하면 해당 Page·Beat를 큰 Stage로 확장한다.
- 발표 모드에서 아티클로 전환하면 동일 Page의 대응 Section과 Animation 위치로 이동한다.
- 전환 시 애니메이션의 정확한 밀리초 진행률보다 `Beat 2 완료` 같은 의미 상태를 보존한다. Layout 크기가 달라져도 안정적으로 복원하기 위해서다.
- 애니메이션 도중 전환하면 현재 Beat의 완료 상태로 정리한 뒤 Layout을 바꾼다.
- Article의 Scroll 위치와 Presentation의 Page 위치는 별도로 기억해 다시 전환했을 때 사용자가 보던 흐름을 복원한다.
- URL에는 최소한 Mode와 Page ID를 반영해 새로고침·공유·브라우저 뒤로가기가 예상대로 동작하게 한다.
- Article 모드의 아래쪽 애니메이션은 Viewport 근처에서만 초기화해 긴 문서에서도 성능을 유지한다.

#### Mode Toggle UI

- 화면 우측 상단의 고정된 위치에 하나의 Segmented Toggle을 배치한다.

```text
[ Presentation | Article ]
```

- 두 개의 독립 버튼이나 On/Off Switch로 보이지 않게 하나의 연결된 Control로 표현한다.
- 화면 Label은 영어 `Presentation / Article`을 사용하며 별도의 `Mode` 문구는 반복하지 않는다.
- 선택된 Segment는 중립적인 배경과 높은 Text 대비로 표시하고, 선택되지 않은 Segment는 투명하거나 낮은 대비로 둔다.
- 선택 Surface가 과도하게 미끄러지는 장식 모션은 사용하지 않는다. 색상과 대비가 짧고 부드럽게 전환되는 정도로 제한한다.
- Presentation과 Article 어디에서나 같은 위치와 크기를 유지해 사용자가 찾을 필요가 없게 한다.
- 발표 중에는 시선을 방해하지 않도록 낮은 시각적 우선순위를 유지하되 완전히 숨기지는 않는다.
- `Tab`으로 Control에 접근하고 좌우 방향키 또는 각 Segment 선택으로 모드를 바꿀 수 있게 한다.
- 접근성 상태는 `aria-pressed` Button Group 또는 동등한 단일 선택 구조로 명확하게 제공한다.

내부 설계 명칭도 `Presentation / Article`로 통일한다.

### 기준 화면과 비율

- 발표 모드의 기준은 모바일 카드가 아니라 **데스크톱 브라우저의 넓은 가로 화면**이다.
- 핵심 장면은 16:9에 가까운 하나의 Stage 안에서 구성하며, 우선 검토 해상도는 `1440×900`, 최소 발표 환경은 `1280×720`로 둔다.
- 입력 → 모델 → 출력처럼 인과관계가 중요한 장면은 가로 흐름을 우선한다.
- 아티클 모드에서는 본문을 읽기 위해 세로로 확장될 수 있지만, 핵심 애니메이션 자체의 구도는 가능한 한 유지한다.
- 모바일은 발표 화면을 그대로 축소하기보다 핵심 정보가 읽히는 별도 축약 상태를 제공한다. 모바일 구도가 전체 디자인을 결정하게 하지 않는다.

### 내비게이션 계층

조작 단위를 `Page → Beat → Micro Motion`의 세 단계로 구분한다.

| 단위 | 의미 | 사용자 조작 |
|---|---|---|
| Page | 하나의 질문 또는 핵심 개념 | 방향키로 이동 |
| Beat | 설명을 멈추고 짚을 의미 있는 상태 | 복잡한 Page에서만 방향키로 진행 |
| Micro Motion | 값 증가, 경로 반응, 요소 정렬 등 Beat 내부의 세부 동작 | Beat 진입 시 자동 재생 |

기본 규칙:

- Page에 진입하면 현재 Beat의 Micro Motion이 자동으로 한 번 재생되고 완료 상태에서 멈춘다.
- 단순한 Page는 Beat 하나로 구성한다. 사용자는 Page당 방향키를 한 번만 누르면 된다.
- 단계별 설명이 필요한 Attention, Tool Calling, Agent Loop 장면만 2~4개의 Beat로 나눈다.
- 하나의 Page는 원칙적으로 4 Beat 이하, 예외적으로도 5 Beat를 넘지 않는다.
- 값이 0%에서 증가하거나 경로가 밝아지는 개별 프레임을 각각 Beat로 만들지 않는다. 이런 변화는 하나의 자동 Micro Motion으로 묶는다.
- 시간에 따라 다음 Page로 자동 이동하지 않는다. 발표자가 설명을 마친 뒤 직접 넘긴다.

#### 방향키 동작

- `→`: 다음 Beat가 있으면 다음 Beat로, 없으면 다음 Page로 이동한다.
- `←`: 이전 Beat가 있으면 이전 Beat의 완료 상태로, 없으면 이전 Page로 이동한다.
- 자동 애니메이션 실행 중 `→`를 누르면 현재 Beat를 즉시 완료 상태로 만든다. 다음 입력에서 다음 Beat 또는 Page로 이동한다.
- Page를 다시 방문하면 해당 Page의 첫 Beat부터 자동 재생한다.
- 키를 길게 눌렀을 때 여러 Page가 빠르게 넘어가지 않도록 반복 입력을 제한한다.

#### 화면 내 조작 UI

- 발표 모드 우측 하단에 작은 `이전 / 다음` 방향 버튼을 항상 제공한다.
- 버튼 옆에는 `Page 05 · Beat 2/3`처럼 Page 진행도와 내부 Beat 진행도를 구분해 표시한다.
- Beat가 하나인 Page에서는 Beat 표기를 숨겨 불필요한 복잡도를 줄인다.
- 조작 UI는 평소 낮은 대비로 유지하되 Hover, Focus, 키보드 입력 시에만 명확히 드러난다.
- 아티클 모드에서는 전역 Page 버튼보다 각 애니메이션의 로컬 재생·단계 조작을 우선한다.

## 3. 디자인 시스템 v1.0

### Light Theme

초기 구현은 Light Theme만 지원한다. Dark Mode는 전체 내용과 Light Theme가 완성된 후 별도 작업으로 검토하며, 현재 컴포넌트 구현 범위에는 포함하지 않는다.

기본 Palette:

| Token | 기준값 | 역할 |
|---|---:|---|
| `background` | `#F3F2ED` | 전체 배경 |
| `surface` | `#FCFCF9` | 제한적으로 사용하는 콘텐츠 표면 |
| `foreground` | `#171915` | 제목·본문·핵심 정보 |
| `muted` | `#6D7169` | 보조 설명·날짜·비활성 정보 |
| `line` | `#D7D9D1` | 구조선·경계·비활성 경로 |
| `signal` | `#2F6A4B` | 선택·활성 경로·핵심 확률 |
| `error` | `#B64336` | 오류·실패·위험 상태 |
| `code-surface` | `#171917` | Terminal·긴 Code Block |
| `code-foreground` | `#E9ECE6` | 어두운 코드 표면의 본문 |

색상 역할은 고정하되 정확한 명도와 채도는 대표 템플릿 검토 후 소폭 조정할 수 있다.

- Gradient는 정보의 연속 변화나 경로의 미세한 명도 반응에만 제한적으로 사용한다.
- Shadow로 계층을 과장하지 않고 여백·Typography·얇은 구조선으로 영역을 구분한다.
- `signal`은 한 화면에서 가장 중요한 활성 상태 하나에 우선 사용한다.
- `error`는 실제 오류 상태에만 사용하며 장식적인 강조색으로 사용하지 않는다.

### Typography

| 용도 | Font | Weight |
|---|---|---|
| 한글 제목·본문·UI | `Pretendard` | 400 / 500 / 600 |
| 코드·API·날짜·모델명 | `IBM Plex Mono` | 400 / 500 |
| 한글 Fallback | `Noto Sans KR`, `sans-serif` | - |
| Mono Fallback | `ui-monospace`, `SFMono-Regular`, `monospace` | - |

권장 Type Scale:

| 역할 | Presentation | Article |
|---|---:|---:|
| Display / Opening | 72~104px | 48~64px |
| Page Title | 48~64px | 32~40px |
| Key Question | 32~44px | 24~30px |
| Body | 필요한 경우에만 20~24px | 18~20px |
| Label / Caption | 14~18px | 14~16px |
| Code | 18~22px | 15~17px |

- Presentation에서는 작은 본문을 길게 배치하지 않는다.
- Article 본문은 `line-height 1.65~1.75`, 한 줄 55~75자 범위를 우선한다.
- 영어 대문자 Mono Label은 짧은 분류·날짜·API 경계에만 사용한다.
- 지나치게 굵은 제목보다 크기·여백·행갈이로 계층을 만든다.

### Layout Tokens

| 항목 | 기준 |
|---|---|
| Presentation 기준 해상도 | `1440×900` |
| 최소 발표 환경 | `1280×720` |
| Presentation 안전 여백 | 좌우 56~72px, 상하 40~56px |
| 주요 콘텐츠 최대 폭 | 약 1320px |
| Article 본문 폭 | 720~780px |
| Article Wide Visual | 최대 약 1120px |
| 기본 간격 단위 | 8px |

- Presentation의 핵심 Stage는 한 화면 안에서 잘리지 않아야 한다.
- Article의 본문과 Wide Visual은 같은 중앙축을 공유한다.
- Mode Toggle은 우측 상단, Page·Beat Navigation은 우측 하단의 고정된 위치를 사용한다.
- Article은 모바일까지 반응형으로 제공하고, Presentation의 복잡한 장면은 데스크톱을 우선한다.

### Page Template

초기 구현에서 모든 Page는 다음 네 가지 Template 중 하나를 기반으로 한다.

| Template | Presentation | Article |
|---|---|---|
| `Question / Transition` | 큰 질문·짧은 전환·한 개의 핵심 시각 | 질문의 배경과 다음 Section 연결 설명 |
| `Visual Explainer` | 애니메이션이 Stage 대부분을 사용 | 본문 사이 또는 Wide Visual로 같은 애니메이션 배치 |
| `Code / Runtime Trace` | 현재 필드·명령·결과만 단계적으로 강조 | 전체 코드·JSON·필드 설명·주의 사항 포함 |
| `Timeline / Milestone` | 현재 기술 변화와 대표 모델 이정표만 표시 | 앞뒤 맥락·날짜·출처·상세 변화 포함 |

Template 공통 규칙:

- 같은 Template 안에서는 제목, Stage, Navigation의 기본 위치를 유지한다.
- 특별한 페이지를 만들기 전에 기존 Template 조합으로 해결할 수 있는지 먼저 검토한다.
- Presentation과 Article은 같은 Page ID·Beat·Animation Component를 공유한다.
- Template 시안 검토 후 실제 콘텐츠를 Mapping하며 필요한 예외만 추가한다.

### 공통 Component

구현 전에 다음 Component의 기본 상태를 한 번씩 정의한다.

- `[ Presentation | Article ]` Segmented Toggle
- Page·Beat Progress와 이전·다음 버튼
- Token, 선택된 Token, Context Frame·Tray
- 확률 막대와 선택 상태
- Code Block, Terminal, Log, Stack Trace
- `MODEL API / LOCAL AGENT RUNTIME` 경계
- Tool Call·Tool Result 연결 ID
- 모델·제품 Milestone과 날짜 Label
- `CORE / DEEP DIVE`, Source·Reference
- `RUNNING / FAILED / PASSED`, `REPRODUCED / PATCHED / VERIFIED` 상태

상태 변화는 색상만으로 표현하지 않고 Label, Icon, 값 또는 구조 변화와 함께 전달한다.

## 4. 모션 설계 원칙

1. **Continuity**  
   앞 장면의 요소가 사라지고 새 화면이 나타나는 것보다, 같은 요소가 다음 개념으로 변형되도록 한다.

2. **Cause and Effect**  
   입력, 계산, 출력의 순서를 모션으로 분명히 보여준다. 결과가 이유 없이 나타나지 않게 한다.

   - 입력 전에는 출력값을 미리 노출하지 않는다.
   - 확률 계산 장면은 `0% 또는 빈 상태 → 연산 → 값의 변화 → 선택` 순서를 지킨다.
   - 다음 상태의 결과를 먼저 그려둔 뒤 연산 효과만 덧붙이는 방식은 사용하지 않는다.

3. **One Change at a Time**  
   여러 값과 도형을 동시에 움직이지 않는다. 사용자가 현재 무엇을 봐야 하는지 분명해야 한다.

4. **Meaningful Repetition**  
   반복 구조는 실제 반복 애니메이션으로 보여준다. 단, 충분히 이해한 후에는 사용자가 멈추거나 넘길 수 있어야 한다.

5. **Controlled Pace**  
   발표용 자동 재생과 개인 학습용 수동 탐색 모두를 고려한다. 핵심 단계는 사용자가 직접 진행할 수 있어야 한다.

6. **Visual Consistency**  
   입력, 모델, 확률, 선택, Context, Tool, 실행 결과 등 같은 역할의 요소는 전체 자료에서 동일한 시각 문법을 사용한다.

7. **Accessibility**  
   `prefers-reduced-motion`을 지원하고, 색상 하나에만 의미를 의존하지 않는다. 애니메이션이 없어도 핵심 정보를 읽을 수 있어야 한다.

### 모션 렌더링 품질 기준

- 원·사각형·화살표 같은 기본 도형이 경로를 따라 이동하는 전형적인 슬라이드 애니메이션을 사용하지 않는다.
- 화면을 이동하는 객체는 선택된 Token, Tool Call JSON처럼 **실제로 상태가 이동하는 대상**일 때만 허용한다.
- 연산 진행은 별도 장식 객체보다 기존 입력 경로·모델 경계·출력 영역의 명도와 색감이 연속적으로 반응하는 방식으로 표현한다.
- 기본 목표는 대상 발표 환경에서 체감상 끊김 없는 60fps다. `transform`·`opacity`, Web Animations API, `requestAnimationFrame` 등 브라우저 합성에 유리한 방식을 우선한다.
- 반복적인 Layout 측정과 Reflow, 큰 영역의 Blur·Shadow 변화, 동시에 많은 DOM 요소를 갱신하는 구현을 피한다.
- 기본 CSS `linear`, 과도한 Bounce·Elastic 효과를 사용하지 않고 장면의 인과관계에 맞는 Easing Curve를 설계한다.
- 초기 등장, 연산, 선택, 다음 상태 전환은 하나의 타이밍처럼 연결하되 모든 요소를 동시에 움직이지 않는다.
- 무한 반복 모션은 기본적으로 사용하지 않는다. 사용자가 다시 재생할 수 있는 한 번의 정교한 시퀀스를 우선한다.
- Motion Study 단계에서 실제 목표 해상도로 재생하며 프레임 드롭, 잔상, 시선 분산을 검토한다.

### Motion Tokens

| Token | 기준 시간 | 사용 범위 |
|---|---:|---|
| `ui-fast` | 180~240ms | Toggle, Hover, Focus, 작은 상태 전환 |
| `micro` | 280~420ms | Label, Token 강조, 짧은 값 변화 |
| `concept` | 700~1,100ms | 확률 계산, Context 변화, Tool Call 이동 |
| `page` | 420~600ms | Page·Layout 전환 |

기본 Easing:

```text
standard: cubic-bezier(.22, .61, .36, 1)
emphasis: cubic-bezier(.20, .80, .20, 1)
```

- 실제 시간은 Scene의 정보량에 따라 범위 안에서 조정한다.
- Micro Motion이 여러 개 연결될 때는 각 요소의 Duration을 늘리기보다 시작 시점을 60~180ms 정도 엇갈리게 한다.
- 자동 재생은 현재 Beat 안에서 한 번만 실행하고 완료 상태에서 멈춘다.
- 사용자가 Skip하면 남은 모션을 생략하고 동일한 완료 상태를 즉시 적용한다.

## 5. 첫 번째 핵심 시퀀스: 분류에서 언어 생성으로

이 시퀀스는 전체 자료의 첫 학습 경험이며, 이후 복잡한 Transformer 설명을 받아들일 수 있는 직관을 만든다.

### Scene 1. Cat or Dog?

화면 중심에 고품질 개 또는 고양이 이미지가 나타난다.

```text
이미지
→ 모델
→ CAT 0% / DOG 0%
→ 연산
→ CAT 92% / DOG 8%
```

#### 표현 목표

- 입력 이미지가 작은 픽셀 또는 특징 단위로 변환되어 모델 안으로 들어간다.
- 모델 내부를 사실과 다르게 구체적인 귀·꼬리 판별기로 묘사하지 않는다.
- 입력과 연산 이전에는 결과 확률을 미리 보여주지 않는다.
- 최종 출력은 두 개의 확률 막대 또는 점수 카드로 즉시 읽히게 한다.

### Scene 2. More Classes

두 개였던 출력 후보가 부드럽게 열 개 숫자 클래스 또는 여러 객체 클래스로 확장된다.

```text
CAT / DOG
→ 0 / 1 / 2 / ... / 9
→ 가장 높은 점수의 클래스 선택
```

#### 표현 목표

- 분류의 본질이 “가능한 후보 전체에 점수를 매기는 것”임을 보여준다.
- 새로운 다이어그램을 띄우기보다 이전 출력 영역이 확장되는 연속성을 유지한다.

### Scene 3. From Classes to Vocabulary

이미지 입력이 텍스트 Prefix로 변형되고, 출력 후보가 단어 또는 토큰 목록으로 전환된다.

```text
나는 아침에 밥을

먹었다  61%
마셨다   9%
갔다     4%
...
```

#### 핵심 전환

```text
두 개의 클래스
→ 열 개의 숫자
→ 수만 개의 토큰
```

후보의 수는 크게 늘어나지만, 입력에 따라 후보별 점수를 계산한다는 기본 구조가 이어진다는 점을 시각적으로 강조한다.

### Scene 4. The Text Labels Itself

하나의 문장이 여러 학습 샘플로 펼쳐진다.

```text
나는 오늘 학교에 갔다

나는             → 오늘
나는 오늘        → 학교에
나는 오늘 학교에 → 갔다
```

#### 애니메이션 아이디어

- 문장의 토큰이 순서대로 정렬된다.
- Prefix 영역과 정답 토큰 영역을 가르는 커서가 한 칸씩 이동한다.
- 커서가 이동할 때마다 하나의 학습 문제가 만들어져 아래에 쌓인다.
- “텍스트 안에 다음 정답이 이미 존재한다”는 사실을 별도 설명 없이도 느낄 수 있게 한다.

### Scene 5. Prediction Becomes Generation

선택된 다음 토큰이 출력 카드에서 빠져나와 입력 문장 끝에 붙는다.

```text
입력
→ 후보별 점수
→ 토큰 선택
→ 입력 끝에 추가
→ 다시 예측
```

#### 대표 모션

1. `먹었다`가 선택된다.
2. 선택된 토큰이 입력 문장의 끝으로 이동한다.
3. 확률 목록이 새 Context에 맞게 다시 계산된다.
4. 다음 토큰이 선택된다.
5. 두세 번 반복한 뒤 전체 Loop가 시각적으로 드러난다.

이 애니메이션은 전체 자료에서 처음 등장하는 **피드백 루프**다. 이후 Agent Loop를 설명할 때 같은 시각 문법을 더 큰 규모로 재사용한다.

### Scene 6. What Should the Model Look At?

생성된 문장 속 특정 토큰이 선택되고, 이전 토큰들과의 관계선 또는 가중치가 나타난다.

```text
다음 토큰을 맞히려면
이전 토큰 중 무엇을 참고해야 할까?
```

이 질문과 함께 다음 챕터의 Self-Attention으로 전환한다.

## 6. 시각적 연결 장치

자료 전체에서 재사용할 시각 문법의 초기 후보:

| 개념 | 시각 표현 후보 |
|---|---|
| 입력 | 화면 왼쪽 또는 상단에서 진입하는 원본 요소 |
| 내부 표현 | 원본 요소가 작은 벡터·셀·토큰 블록으로 변환됨 |
| 모델 연산 | 고정된 블랙박스보다 여러 계층을 통과하며 상태가 바뀌는 표현 |
| 후보와 확률 | 정렬 가능한 막대, 숫자, 밝기 차이 |
| 선택된 토큰 | 입력으로 되돌아가는 하나의 강조 블록 |
| 관계·Attention | 굵기 또는 밝기가 다른 연결선과 행렬 표현 |
| 반복 | 동일 요소가 되돌아오는 원형 동선 또는 단계 재생 |
| Context | 현재 모델이 볼 수 있는 범위를 감싸는 프레임 |
| Tool Call | 모델 출력이 외부 실행 영역으로 이동하는 구조화된 명령 블록 |
| 실행 결과 | 환경에서 모델 Context로 돌아오는 결과 블록 |

색상·서체·도형 스타일은 `디자인 시스템 v1.0`의 Token과 Component 규칙을 따른다. Template 시안 검토에서는 이 기준을 바꾸기보다 대비, 크기, 간격처럼 실제 화면에서 드러나는 값을 조정한다.

### 모델 이정표 표현

모델 이정표는 별도의 긴 연표 화면으로 분리하지 않고, 해당 기술적 한계가 해결되는 순간에 짧게 등장한다.

기본 표기 형식:

```text
2025.08 · OPENAI · GPT-5
2025.05 · ANTHROPIC · Claude Opus 4
```

표현 원칙:

- 연도와 월을 모델명보다 먼저 보여 시간 흐름을 즉시 인식하게 한다.
- OpenAI와 Anthropic은 동일한 정보 구조를 사용하되, 작은 색상 또는 Symbol 차이로 구분한다.
- 회사 로고와 브랜드 컬러가 기술 내용보다 강하게 보이지 않게 한다.
- 등장한 이정표는 화면 한쪽의 누적 Timeline에 남겨 짧은 기간에 변화가 연속되었음을 보여줄 수 있다.
- Timeline의 간격은 단순 균등 배치보다 실제 월 간격을 반영하는 방향을 우선 검토한다.
- 모델과 ChatGPT·Codex·Claude Code 같은 제품을 동일한 표기로 섞지 않는다. 제품은 `PRODUCT` Label을 추가한다.
- 두 회사의 모델을 항상 쌍으로 배치하지 않고, 해당 변화를 가장 잘 설명하는 이정표만 표시한다.
- 날짜와 모델 선정은 공식 발표 자료를 기준으로 하며, 화면 하단 또는 출처 패널에서 확인할 수 있게 한다.

### Coding Agent 사례 표현

ACT 4의 기본 화면과 동작 사례는 Claude Code를 중심으로 구성한다.

- 익숙한 Claude Code Terminal 흐름을 사용해 프로덕션 500 오류 요청, 로그 확인, Tool Call, 파일 수정, 테스트, Session Resume를 보여준다.
- Claude 모델과 Claude Code 프로그램을 시각적으로 분리한다. `MODEL API`와 `LOCAL AGENT RUNTIME`을 같은 Box에 넣지 않는다.
- Claude Code 내부 구현을 공식 자료 이상으로 추측하지 않는다. 공개된 동작과 저장 구조만 시각화한다.
- OpenCode는 동일 비중의 좌우 비교 화면으로 만들지 않는다.
- 구현 근거가 필요한 장면에서만 작은 `OPEN IMPLEMENTATION NOTE` 패널로 등장시킨다.
- 해당 패널에서는 OpenCode의 Local Server, Session Store, Compaction, `AGENTS.md` 등 실제 공개된 구조를 짧게 연결한다.
- 표기는 `Proprietary Harness — Claude Code`, `Open-source Harness — OpenCode`를 사용한다.
- 이 구분을 제품 우열이나 Model 성능 비교처럼 보이게 만들지 않는다.

### Tool Calling API Trace

ACT 4의 핵심 장면 하나는 실제 JSON이 흐르는 모습을 보여준다. 코드를 정적인 큰 블록으로 한 번에 노출하지 않고, 의미 단위별로 확장한다.

1. `messages`에 사용자 요청이 들어온다.
2. `tools[].input_schema`가 모델이 선택할 수 있는 행동의 형태를 정의한다.
3. 응답에 `tool_use`가 나타나고 `name`, `input`, `id`가 강조된다.
4. JSON 블록이 `MODEL API` 영역에서 `LOCAL AGENT RUNTIME` 영역으로 이동한다.
5. Runtime이 실제 로컬 검색을 실행한다.
6. 검색 결과가 `tool_result`로 변환되고 동일한 `tool_use_id`로 연결된다.
7. 결과 블록이 다시 Context에 합류하면서 다음 모델 호출이 시작된다.

#### 시각적 핵심

- API 경계는 화면 중앙의 분명한 선으로 유지한다.
- `tool_use`는 **실행 결과**가 아니라 **실행 요청**임을 이동 방향으로 보여준다.
- 로컬 명령은 JSON 바깥의 Terminal 영역에서만 실행된다.
- `tool_use.id`와 `tool_result.tool_use_id`는 동일한 색과 연결선으로 대응시킨다.
- ARTICLE 모드에서는 축약 전·후 JSON과 필드 설명을 제공한다.
- PRESENTATION 모드에서는 현재 설명 중인 3~5개 필드 외에는 흐리거나 접는다.
- 화면 하단에 `PUBLIC API SHAPE — NOT CLAUDE CODE INTERNAL PAYLOAD`를 작게 표시한다.

이 장면은 다음 `Agent Loop`로 그대로 확장된다. 한 번의 API 왕복이 여러 번 반복되면서 검색 → 읽기 → 수정 → 테스트 흐름이 만들어지는 모습을 동일한 시각 문법으로 보여준다.

### 대표 사례 시퀀스: Production 500

전체를 관통하는 사례는 “일부 사용자 조회 요청에서만 발생하는 프로덕션 500 오류”로 구성한다.

#### Prologue 상태

화면에는 원인을 보여주지 않고 운영 증상과 사용자 요청만 표시한다.

```text
PRODUCTION ERROR
GET /users/{id} · 500
Affected requests · SOME USERS
```

- 과한 경고음, 붉은 Flash, 가짜 위기 연출을 사용하지 않는다.
- 짧은 5xx 증가 그래프나 실패 요청 몇 건으로 실제 운영 화면 같은 밀도만 만든다.
- 사용자가 제공한 `production-error.log`가 Claude Code 입력 옆에 놓인다.
- Agent가 프로덕션에 직접 연결된 것처럼 표현하지 않는다.

#### Agent 조사 시퀀스

1. `production-error.log`에서 Stack Trace 한 줄이 선택된다.
2. `UserMapper.toResponse:42`가 검색 Query로 변환된다.
3. Repository Map에서 `UserMapper.java`, `User.java`, `UserMapperTest.java`만 Context 영역에 들어온다.
4. 정상 User와 Legacy User 데이터가 나란히 나타나고, Legacy User의 `profile`이 비어 있음을 확인한다.
5. 기존 테스트에 Legacy User 조건이 없다는 사실이 드러난다.
6. Regression Test를 추가하고 실패 상태를 재현한다.
7. Mapper 수정 후 동일 테스트가 통과한다.
8. 관련 Test Suite를 실행하고 최종 검증 범위를 보고한다.

#### 시각적 연결 원칙

- 화면 한쪽에 `CURRENT CONTEXT` Tray를 유지해 Agent가 지금 실제로 본 자료만 표시한다.
- 읽지 않은 Repository 파일은 흐리게 남겨 “전체를 한 번에 이해하지 않는다”는 점을 보여준다.
- Stack Trace의 파일명·행 번호가 Repository 파일로 이동하는 모션을 사용한다.
- `profile: null`은 원인 후보일 뿐, 실패 테스트가 재현되기 전에는 `ROOT CAUSE`로 확정 표시하지 않는다.
- 테스트 실패에서 성공으로 바뀌는 상태는 색상뿐 아니라 Icon과 문구도 함께 바꾼다.
- 최종 화면에는 `FIXED`만 표시하지 않고 `REPRODUCED`, `PATCHED`, `VERIFIED` 세 상태를 분리한다.
- 운영 재배포와 실제 장애 해소 확인은 로컬 Agent 작업의 바깥에 남아 있음을 명시한다.

#### 전체 자료에서의 재등장

| 위치 | 보이는 범위 |
|---|---|
| Prologue | 증상 → Claude Code 요청 → 수정 완료의 짧은 Preview |
| Give It Tools | 첫 번째 로그·코드 검색 한 번을 실제 API JSON으로 확대 |
| Agent Loop | 검색 → 결과 → 파일 읽기 → 결과 → 테스트의 반복 |
| How Agents Read Code | Stack Trace에서 관련 파일 세 개를 찾아 Context로 구성 |
| Evaluation | 실패 재현, Regression Test, 관련 Test Suite로 검증 |
| Conclusion | 같은 수정 과정을 Model과 Runtime의 역할로 다시 분해 |

## 7. 이미지·그래픽 자산 원칙

- 개·고양이 예시는 즉시 인식 가능하고 배경이 복잡하지 않은 고품질 이미지를 사용한다.
- 서로 다른 출처의 이미지가 혼재해 전체 톤이 흔들리지 않도록 한다.
- 숫자·토큰·행렬·네트워크 구조는 가능한 한 코드 기반 그래픽으로 제작해 해상도와 일관성을 유지한다.
- 실제 정보 관계를 보여주는 다이어그램에는 생성형 이미지를 사용하지 않는다.
- 장식용 3D 오브젝트나 입자는 핵심 개념보다 시선을 빼앗지 않는 경우에만 사용한다.
- 외부 이미지 사용 시 라이선스와 출처를 기록한다.
- 핵심 장면에 적합한 이미지가 없으면 장면의 실제 표시 크기와 Crop 비율을 먼저 정한 뒤 전용 이미지를 생성한다.
- 생성 이미지는 필요 이상으로 고해상도로 만들지 않고, 화면 배율을 고려한 1.5~2배 크기로 준비해 용량과 선명도를 함께 관리한다.
- 이미지 생성 Prompt에는 자연광, 평범한 구도, 절제된 색감, 실제 제품·다큐멘터리 사진에 가까운 질감을 명시한다.

### 과도한 ‘AI 스타일’ 배제

자료가 AI를 설명하더라도 흔한 AI 홍보 페이지처럼 보이지 않게 한다.

- 네온 보라·파랑 Gradient, 과도한 Glow, Glassmorphism을 기본 문법으로 사용하지 않는다.
- 의미 없는 빛 입자, 떠다니는 구체, 뇌·회로·신경망 장식, 반짝이는 3D 오브젝트를 피한다.
- 생성 이미지 특유의 과도하게 매끈한 질감, 영화적인 역광, 비현실적인 심도와 완벽하게 중앙 정렬된 구도를 피한다.
- 실제 개발자가 보는 Terminal, 코드, Log, 문서, API 데이터의 구조 자체를 주요 시각 소재로 사용한다.
- 중립적인 배경, 단단한 Typography, 얇은 구조선, 제한된 강조색을 중심으로 Editorial·Engineering 문서에 가까운 톤을 유지한다.
- 움직임도 ‘AI가 생각하는 것처럼 보이는 효과’보다 실제 데이터가 이동하고 상태가 바뀌는 과정을 정직하게 보여준다.

## 8. 애니메이션 품질 기준

각 핵심 애니메이션은 다음 질문을 통과해야 한다.

- 정지 화면보다 개념을 더 잘 이해하게 하는가?
- 무엇이 입력이고 무엇이 출력인지 한눈에 보이는가?
- 움직임의 시작과 결과 사이에 인과관계가 있는가?
- 너무 많은 요소가 동시에 움직이지 않는가?
- 한 번 본 후 사용자가 직접 다시 재생하거나 단계별로 볼 수 있는가?
- 모바일과 큰 발표 화면 모두에서 핵심 요소가 읽히는가?
- 애니메이션이 실행되지 않아도 내용이 전달되는가?

## 9. 현재 확정된 디자인 결정

- 초기 버전은 Light Theme만 구현하고 Dark Mode는 전체 내용 완성 후 별도 범위로 검토한다.
- 기본 Font는 `Pretendard`, 코드·API·날짜는 `IBM Plex Mono`를 사용한다.
- Palette는 따뜻한 밝은 배경, Charcoal Text, Green Signal, 제한적인 Error Red를 중심으로 구성한다.
- Page는 `Question / Transition`, `Visual Explainer`, `Code / Runtime Trace`, `Timeline / Milestone` 네 Template을 기반으로 한다.
- 전체 자료는 시각적 애니메이션을 핵심 전달 수단으로 사용한다.
- 첫 번째 대표 애니메이션은 개·고양이 분류에서 다음 토큰 생성으로 이어지는 변형 시퀀스다.
- 장면 전환보다 동일한 요소가 다음 개념으로 바뀌는 연속성을 우선한다.
- 다음 토큰 생성 Loop와 Agent Loop는 유사한 시각 문법을 공유한다.
- 실제 페이지 구현은 이 설계서와 네 가지 대표 Template 시안을 검토한 뒤 진행한다.
- 미니멀한 화면을 유지하되, 핵심 시각 요소를 작게 만들지 않는다.
- 모델 이정표는 OpenAI와 Anthropic으로 한정하고 `YYYY.MM · COMPANY · MODEL` 형식으로 표시한다.
- 모델 이정표는 독립된 역사 챕터보다 기술적 한계가 해결되는 장면에 결합한다.
- 이전 이정표를 누적해 AI 산업 변화의 빠른 시간 간격을 체감시키는 Timeline 표현을 검토한다.
- ACT 4의 Coding Agent 주 사례는 Claude Code로 통일한다.
- OpenCode는 Claude Code의 동작을 구현 수준에서 교차 확인하는 `OPEN IMPLEMENTATION NOTE`로만 사용한다.
- Model API와 Local Agent Runtime은 항상 별개의 시각 요소로 표현한다.
- `PRESENTATION / ARTICLE`은 동일 Page·Beat·애니메이션 의미 상태를 공유하고 표시 밀도와 Layout만 바꾼다.
- 모드 전환 시 동일 Page의 대응 위치를 유지하며, 정확한 재생 시간보다 Beat의 의미 상태를 보존한다.
- 모드 전환 UI는 우측 상단의 단일 `[ Presentation | Article ]` Segmented Toggle로 통일한다.
- 실제 API JSON은 Tool Calling 장면에서 한 번의 완전한 왕복으로 보여준다.
- API Payload는 한 번에 전부 노출하지 않고, 현재 의미가 있는 필드만 단계적으로 강조한다.
- 대표 사례는 “일부 사용자에게만 발생하는 프로덕션 500 오류”로 통일한다.
- 장애 증상과 Root Cause를 처음부터 함께 공개하지 않고, Agent가 수집한 증거에 따라 단계적으로 드러낸다.
- 로컬 검증 완료와 실제 프로덕션 장애 해소를 동일한 상태로 표현하지 않는다.
- 문서와 화면 문구는 한글을 기본으로 하고, 기술 용어·제품명·코드만 필요한 범위에서 영어를 유지한다.
- 배경 전체를 덮는 격자무늬는 사용하지 않는다. 구분선은 API 경계, 패널 분할 등 실제 구조를 설명하는 곳에만 사용한다.
- 발표 장면은 데스크톱 가로 Stage를 기본으로 하고, 16:9에 가까운 화면에서 가시성과 가독성을 우선한다.
- 계산 결과는 입력과 연산 이전에 노출하지 않는다. 확률은 0% 또는 빈 상태에서 실제 결과값으로 변화하도록 표현한다.
- 전체 시각 톤은 흔한 AI 홍보 페이지의 네온·Glow·Glass·추상 입자 표현을 피하고 Editorial Engineering 방향을 유지한다.
- 연산 효과는 이동하는 장식 도형이 아니라 입력 경로와 모델·출력 경계의 미세한 명도 변화로 표현한다.
- 애니메이션은 목표 환경에서 부드러운 프레임을 최우선 품질 조건으로 삼고, 실제 의미가 없는 도형 이동은 배제한다.
- 조작 계층은 `Page → Beat → Micro Motion`으로 구성하고, 사용자는 의미 있는 Beat만 방향키로 진행한다.
- Page 진입 시 Micro Motion은 자동으로 한 번 재생하며, 시간 기반의 자동 Page 전환은 사용하지 않는다.
- 발표 모드 우측 하단에는 Page·Beat 진행도와 작은 이전·다음 버튼을 배치한다.

## 10. Template 검토 후 조정할 항목

다음 항목은 구현 전의 미결정 사항이 아니라 대표 Template을 실제로 본 뒤 미세 조정할 대상이다.

- 기본 Palette의 정확한 명도·채도
- 제목과 본문 Type Scale의 최종값
- 복잡한 Attention·Repository Map의 모바일 축약 방식
- 각 Scene에서 실제 사진과 코드 기반 그래픽의 최종 비율
- 장면별 생성 이미지의 Crop과 Art Direction
- Canvas, SVG, DOM, WebGL 중 개별 애니메이션에 적합한 렌더링 방식

Dark Mode는 이 목록에 포함하지 않는다. Light Theme와 전체 내용 완성 후 별도의 범위로 다시 결정한다.

## 11. 다음 산출물

1. 네 가지 Page Template의 Presentation 시안
2. 동일 Template의 Article 변환 시안
3. 공통 Component 상태표
4. 핵심 애니메이션 Motion Study
5. 전체 Storyboard와 Template Mapping
6. 실제 웹 구현
7. 데스크톱·모바일·발표 환경 검토

---

## 변경 기록

- v1.0: Light Theme 단일 지원을 확정하고 Palette, Pretendard·IBM Plex Mono Typography, Layout Token, 네 가지 Page Template, 공통 Component를 구현 기준으로 정리. 기존 미정 사항을 해소하고 Template 시안 후 조정 항목과 다음 산출물로 재구성.
- v0.12: 모드 선택 UI를 우측 상단의 단일 `[ Presentation | Article ]` Segmented Toggle로 확정. 선택 상태, 시각적 우선순위, 전환 모션과 키보드 접근성 원칙 추가.
- v0.11: 모드 명칭을 `Presentation / Article`로 정리하고 화면 Label은 `발표 모드 / 아티클 모드`로 확정. Page·Beat·Animation을 공유하는 단일 콘텐츠 구조, 양방향 위치 Mapping, 의미 상태 보존, URL·Scroll·Lazy Initialization 원칙 추가.
- v0.10: `Page → Beat → Micro Motion` 내비게이션 계층 확정. 단순 Page는 자동 재생 한 번, 복잡한 장면만 2~4 Beat로 분리. 방향키 동작, 실행 중 Skip 규칙, 우측 하단 이전·다음 버튼과 Page·Beat 진행도 표시 원칙 추가.
- v0.9: 슬라이드식 기본 도형 이동을 배제하고, 연산 경로 자체의 미세한 명도·색감 반응을 기본 문법으로 확정. 60fps 체감, GPU 친화 속성, Easing, Reflow 회피 등 모션 구현 품질 기준 추가.
- v0.8: 데스크톱 가로 Stage와 기준 해상도를 명시. 확률값은 0%에서 연산 후 변화하도록 인과관계 규칙을 강화. 생성 이미지의 크기·Crop·자연스러운 질감 기준과 과도한 AI 스타일을 배제하는 시각 원칙 추가.
- v0.7: 한글 중심의 언어 원칙을 확정. 영어는 기술 용어·제품명·코드에 필요한 경우로 제한하고, 장식적인 배경 격자를 제거하는 방향을 디자인 결정에 반영.
- v0.6: 대표 사례를 프로덕션 사용자 조회 API의 간헐적 500 오류로 확정. Log → Stack Trace → Context 구성 → 실패 재현 → Patch → Verification의 시각 시퀀스와 Prologue·Tool Calling·Agent Loop·Evaluation 간 재사용 규칙 추가.
- v0.5: Tool Calling을 실제 API JSON 왕복으로 시각화하는 장면 추가. `tool_use`와 `tool_result`, Model API와 Local Runtime, 요청과 실행을 분리하는 모션 규칙 정의.
- v0.4: 동일 Scene과 애니메이션 상태를 공유하는 `PRESENT / READ` 전달 모드 확정. `CORE / DEEP DIVE`를 별도 깊이 축으로 구분.
- v0.3: ACT 4의 시각적 주 사례를 Claude Code로 확정. OpenCode는 Open-source Harness 구현을 보여주는 보조 패널로 한정하고, Model API와 Local Agent Runtime을 분리해 표현하는 원칙 추가.
- v0.2: 모델 이정표의 회사 범위를 OpenAI와 Anthropic으로 한정. 연도·월 우선 표기, 모델과 제품의 구분, 실제 시간 간격을 반영하는 누적 Timeline 원칙 추가.
- v0.1: 전체 디자인 목표와 모션 원칙 수립. 개·고양이 분류에서 다음 토큰 생성과 Self-Attention 질문으로 이어지는 첫 핵심 시퀀스 기록.