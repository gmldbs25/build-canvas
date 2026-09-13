# Work 4 — Content & Design Outline

## 1. 프로젝트 주제

**컴퓨터가 데이터를 기억하는 방식: NAND Flash의 동작 원리**

Work 4는 `build-canvas` 프로젝트의 네 번째 Work다. 목표는 NAND Flash의 구조와 동작 원리를 일반적인 줄글 아티클이나 슬라이드가 아니라, **웹 환경의 스크롤·애니메이션·hover/click·간단한 시뮬레이션을 활용해 사용자가 직접 탐색하며 이해하는 인터랙티브 설명 자료**로 만드는 것이다.

이 문서는 전체 내용 흐름과 디자인 방향만 정의한다. 세부 원고와 각 Scene의 최종 카피는 이후 별도 단계에서 개발한다.

---

## 2. 전체 콘텐츠 방향

핵심 흐름은 **거시적인 SSD 수준에서 시작해 점점 더 작은 NAND 내부 구조로 들어갔다가, 다시 Software/Firmware 관점으로 올라오는 구조**다.

기본 탐색 흐름:

`SSD → NAND Package → Die → Block → Page → Cell → Program / Read / Erase → FTL → Garbage Collection / Wear Leveling → ECC → 전체 Read/Write 흐름`

중심 메시지는 다음과 같다.

> NAND는 데이터를 단순히 '적어두는' 장치가 아니다. 물리적인 제약과 오류 가능성을 가진 저장 매체이며, SSD Controller와 Firmware가 이를 관리하고 추상화하기 때문에 사용자는 안정적인 저장장치처럼 사용할 수 있다.

---

## 3. 전체 Scene 흐름 초안

아래 Scene 수와 분할 방식은 고정안이 아니라 전체 흐름을 잡기 위한 초안이다. 아스트라가 세부 내용 개발 시 필요에 따라 합치거나 나눌 수 있다.

### Scene 01 — 질문에서 시작

핵심 질문:

**컴퓨터는 전원을 꺼도 어떻게 데이터를 기억할까?**

역할:
- Work 4의 문제의식 제시
- SSD를 탐험 대상으로 제시
- 긴 설명 없이 시각적으로 탐험을 시작하게 함

---

### Scene 02 — SSD 내부

핵심 내용:
- SSD 내부에는 Controller와 여러 NAND Flash package가 존재한다.
- 실제 비휘발성 데이터 저장은 NAND Flash가 담당한다.

주요 전환:
- SSD 전체를 보다가 NAND Package 하나가 강조됨
- 스크롤하면 해당 Package 쪽으로 확대

---

### Scene 03 — NAND Package

핵심 내용:
- 하나의 Package 내부에는 하나 이상의 Die가 존재한다.
- 사용자는 Package 외형에서 실제 반도체 Die 수준으로 진입한다.

주요 전환:
- Package 외곽이 점차 화면 밖으로 밀려남
- 내부 Die가 다음 주인공으로 등장

---

### Scene 04 — Die에서 Block / Page로

핵심 내용:
- NAND 내부는 계층 구조를 가진다.
- Die → Plane → Block → Page → Cell 구조를 직관적으로 이해한다.
- 모든 계층을 한 화면에 동시에 크게 나열하지 않고, 스크롤에 따라 한 단계씩 보여준다.

핵심 이해:
- `Page`는 Read / Program의 기본 단위
- `Block`은 Erase의 기본 단위

---

### Scene 05 — Cell로 진입

핵심 질문:

**NAND Cell은 실제로 무엇을 기억하는가?**

핵심 내용:
- NAND는 물리적으로 전하 상태를 이용해 데이터를 저장한다.
- Floating Gate 또는 Charge Trap 구조를 개념적으로 설명한다.
- 저장된 전하 상태는 Threshold Voltage(`Vth`)에 영향을 준다.

표현 방향:
- 복잡한 반도체 단면도 대신 단순화된 Cell 개념도
- 전자 이동을 작은 particle/점으로 표현

---

### Scene 06 — SLC / MLC / TLC / QLC

핵심 내용:
- 하나의 Cell이 하나 이상의 bit를 저장할 수 있다.
- SLC에서 QLC로 갈수록 여러 `Vth` 상태를 더 세밀하게 구분한다.

핵심 이해:
- 용량 증가와 상태 구분 난이도의 trade-off

인터랙션 후보:
- SLC / TLC / QLC toggle
- `Vth` 상태 구간 변화 시각화

---

### Scene 07 — Program

핵심 질문:

**데이터를 쓴다는 것은 Cell에서 어떤 일이 일어나는 것인가?**

핵심 내용:
- Program 동작에서 전하 상태가 변한다.
- 전하 상태 변화가 `Vth` 변화를 만든다.

표현 방향:
- 전자 이동
- Cell 상태 전환
- Program 전/후 비교

---

### Scene 08 — Read

핵심 질문:

**저장된 값을 어떻게 다시 읽는가?**

핵심 내용:
- NAND는 저장된 전자 수를 직접 세는 것이 아니라 전기적 상태를 판별한다.
- 기준 전압과 Cell의 `Vth` 관계를 이용해 상태를 읽는다.

표현 방향:
- Reference voltage
- Channel conduction 여부
- 상태 판별 애니메이션

---

### Scene 09 — Erase와 NAND의 제약

핵심 내용:
- Program / Read는 Page 단위이지만 Erase는 Block 단위다.
- NAND는 일반 RAM처럼 원하는 위치를 자유롭게 overwrite할 수 없다.

핵심 질문:

**그런데 우리는 파일을 자유롭게 수정하는데, SSD는 이 제약을 어떻게 숨길까?**

이 질문을 다음 Software 영역으로 연결한다.

---

### Scene 10 — Host가 보는 주소와 실제 NAND

핵심 내용:
- Host는 논리 주소(`LBA`)를 본다.
- 실제 NAND에는 물리적인 Page 위치가 존재한다.
- 두 세계 사이에 변환 계층이 필요하다.

주요 개념:
- `LBA`
- Physical Page / `PPA`
- Mapping

---

### Scene 11 — FTL과 Out-of-place Update

핵심 내용:
- 같은 `LBA`의 데이터가 수정되더라도 기존 Page를 바로 덮어쓰지 않는다.
- 새로운 Page에 데이터를 쓰고 Mapping을 갱신한다.
- 기존 Page는 invalid가 된다.

인터랙션 후보:
- `데이터 수정` 버튼
- Mapping line이 기존 Page에서 새 Page로 이동
- 기존 Page invalid 처리

---

### Scene 12 — Garbage Collection

핵심 내용:
- invalid Page가 쌓이면 사용 가능한 공간이 줄어든다.
- valid 데이터를 다른 곳으로 옮기고 Block을 Erase해 Free Block을 확보한다.

표현 방향:
- Valid / Invalid / Free Page grid
- 데이터 이동
- Block Erase
- Free Block 생성

---

### Scene 13 — Wear Leveling / Bad Block

핵심 내용:
- NAND는 무한히 Program / Erase할 수 없다.
- 특정 Block만 반복 사용하면 수명이 편중된다.
- Firmware는 Wear Leveling과 Bad Block Management를 통해 NAND를 관리한다.

핵심 메시지:

**SSD Firmware는 데이터를 저장하는 것뿐 아니라 NAND의 수명도 관리한다.**

---

### Scene 14 — 오류와 ECC

핵심 내용:
- NAND의 저장 상태는 완벽하게 유지되지 않는다.
- Retention, Read Disturb 등으로 bit error가 발생할 수 있다.
- ECC와 Read Retry 등을 통해 이를 보완한다.

표현 방향:
- `Vth` 분포가 조금씩 흐트러지는 모습
- 일부 bit error 발생
- ECC correction

수학적 세부 구현보다 직관적 이해를 우선한다.

---

### Scene 15 — 하나의 Write 요청 전체 흐름

지금까지 나온 개념을 하나의 실제 요청으로 연결한다.

예시 흐름:

`Application → File System → Block I/O → NVMe Command → SSD Controller → FTL → ECC → NAND Program`

SSD 내부에서는:

`Host Write → LBA 확인 → Mapping → Free Page 선택 → ECC → Program → Mapping 갱신 → 기존 Page invalid`

이 Scene의 목적은 앞에서 본 개념들이 서로 독립된 기능이 아니라 하나의 실제 시스템 안에서 연결된다는 것을 보여주는 것이다.

---

### Scene 16 — 하나의 Read 요청 전체 흐름

예시 흐름:

`Host Read → LBA → FTL Mapping → Physical Page → NAND Read → ECC Decode → 필요 시 Read Retry → Host 반환`

Write와 Read를 나란히 비교하거나 짧은 시퀀스로 정리한다.

---

### Scene 17 — 엔딩

처음의 SSD 수준으로 다시 시점을 올린다.

최종 메시지:

- Cell 수준에서는 전하 상태를 저장한다.
- NAND는 Page / Block 제약과 수명, 오류 가능성을 가진다.
- FTL, Garbage Collection, Wear Leveling, ECC 등 Software/Firmware 계층이 이 제약을 숨긴다.
- 그 결과 Host는 SSD를 안정적인 저장장치처럼 사용할 수 있다.

처음 질문인 **"컴퓨터는 어떻게 데이터를 기억하는가?"**에 다시 답하며 끝낸다.

---

### Article / Appendix — 자세히 공부하기

본편 이후 별도의 학습용 Article 영역을 둔다.

여기서는 본편에서 짧게 다룬 내용을 보다 자세한 줄글 형식으로 설명한다.

예상 항목:
- NAND Flash 기본 구조
- Floating Gate / Charge Trap
- `Vth`
- SLC / MLC / TLC / QLC
- Program / Read / Erase
- Page / Block 제약
- FTL
- Mapping
- Garbage Collection
- Wear Leveling
- Bad Block Management
- ECC / Read Retry
- SSD Controller와 Firmware 역할

Article 원고는 본편 Scene 구조가 확정된 뒤 작성한다.

---

## 4. 디자인 철학

Work 4의 비주얼 기준은 `docs/nand-flash/work4-master-spec.md`를 우선하며, 현재 1차 기준 이미지는 다음 파일이다.

`docs/nand-flash/references/work4-visual-reference-01.webp`

### 핵심 디자인 원칙

- 실제 웹 viewport에서 보이는 화면처럼 설계한다.
- 컨셉 아트나 포스터가 아니라 **구현 가능한 인터랙티브 웹 화면**이어야 한다.
- 다크 배경을 기본으로 한다.
- 현재 축척의 핵심 오브젝트 하나를 화면의 주인공으로 둔다.
- 공학 오브젝트는 실사보다 **단순화된 2.5D 인포그래픽 / 개념도**로 표현한다.
- 넓은 여백을 유지한다.
- 화면에 항상 모든 정보를 노출하지 않는다.
- 필요 정보는 hover / click / toggle 시 추가 노출한다.
- 색은 장식보다 구조, 상태, 선택, 데이터 흐름을 구분하는 용도로 사용한다.
- 기본 구조는 저채도 회색 / 청회색 계열, 강조는 cyan / blue 계열을 우선한다.
- 지나친 네온, 고광택, cinematic lighting, particle effect, cyberpunk UI는 피한다.

### 언어 규칙

- 사용자에게 보이는 일반 설명은 **한글**을 기본으로 한다.
- 기술적으로 통용되는 고유 용어와 약어만 영어를 유지한다.
- 예: `NAND Flash`, `SSD`, `Die`, `Block`, `Page`, `Cell`, `Program`, `Read`, `Erase`, `FTL`, `ECC`, `LBA`, `PPA`, `Vth`
- 장식용 영어 카피는 사용하지 않는다.

---

## 5. 스크롤 / 인터랙션 원칙

### Scroll as Camera / Timeline

스크롤은 단순한 페이지 이동이 아니라 **카메라 이동 또는 animation timeline의 진행 값**으로 사용한다.

예:

`SSD → NAND Package → Die → Block → Page → Cell`

각 구간에서 이전 오브젝트와 다음 오브젝트가 일정 부분 겹쳐 나타나며, abrupt한 화면 교체는 피한다.

전환에 사용할 수 있는 요소:
- scale
- opacity
- blur
- clip / mask
- layer reveal
- subtle depth change

### Zoom → Settle → Interact

전체 경험은 무한 줌만 이어지는 방식으로 만들지 않는다.

권장 리듬:

`Zoom / Transition → 장면 정착 → 사용자 Interaction → 다음 Transition`

예:
- SSD에서 NAND Package로 zoom
- Package 장면에서 hover로 설명 확인
- 다시 Die로 zoom
- Cell 장면에서 Program / Read toggle 조작

### 인터랙션은 이해를 위해 사용

모든 애니메이션과 인터랙션은 단순한 장식이 아니라 개념 전달 목적을 가져야 한다.

- zoom: 구조 계층 이해
- hover: 부위별 추가 설명
- toggle: 상태 비교
- animation: 물리적 변화 이해
- simulation: 원리를 직접 조작하며 이해

---

## 6. 아스트라가 이후 개발할 내용

이 문서의 Scene 흐름은 전체 방향을 위한 골격이다.

아스트라는 이후 각 Scene에 대해 다음 항목을 구체화한다.

- 해당 Scene의 핵심 질문
- 반드시 전달해야 할 기술적 개념
- 사용자가 Scene을 보고 얻어야 할 한 가지 핵심 이해
- 화면에 실제로 보이는 최소한의 한글 문구
- 주요 오브젝트
- 스크롤 전환 방식
- hover / click / toggle / loop animation 여부
- 다음 Scene으로 이어지는 질문 또는 시각적 연결

단, 세부 내용을 개발하면서도 **긴 설명을 본편 화면에 직접 넣지 않는다.**

본편은 시각적 이해가 우선이며, 상세 설명은 Article 영역으로 분리한다.

---

## 7. 현재 단계의 우선순위

1. 이 전체 흐름을 기준으로 Scene별 내용 개발
2. 각 Scene의 시각적 핵심 오브젝트와 인터랙션 정의
3. Scene별 화면 시안 검토
4. 전체 스크롤 경험 연결
5. 본편 구조 확정 후 Article 원고 작성
6. 실제 Work4 구현 및 배포

현재는 **내용과 화면 설계를 구체화하는 단계**이며, 전체 구현을 서두르지 않는다.
