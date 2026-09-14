# Work4 전체 1차 구현 및 검토 기록

2026-09-14. 현재 Scene A의 디자인 언어와 초기 연결 시안을 유지하여 전체 Work4로 확장했습니다.

## 요구사항 대응

| 요청 항목 | 구현 및 검증 근거 |
|---|---|
| 1. 필수 자료 | master spec, content outline, visual reference를 원격 5649323에서 읽고 로컬 docs/nand-flash에 보존. 기존 Scene A와 연결 시안 코드를 기준으로 확장. |
| 2–4. 주제와 전체 이야기 | 20개 본편: 비휘발성 저장 질문 → 구조 → Cell → 동작 → 주소/FTL → GC → 수명 → 오류 복구 → 전체 요청 → 엔딩. content.mjs의 모든 Scene을 브라우저에서 순방향과 역방향으로 확인. |
| 5–6. 전체 Scene 및 Scene 설계 | 20개 모두 실제 SVG/조작 화면. 아래 Scene별 질문·이해·오브젝트·인터랙션·연결 표와 runtime 구현이 대응. placeholder 없음. |
| 7–8. 스크롤과 리듬 | 하나의 sticky viewport. Scene 간 앞 54% 정착, 뒤 46% 전환. SSD 카메라와 내부 SVG 레이어 확대·겹침·소거. 역방향 계산은 순수 timeline 모델. 뒤쪽은 상태 조작과 전환 중심. |
| 9–11. 디자인과 컴포넌트·색 | 원본 SSD 벡터 계승. 청회색 면, 얕은 입체감, cyan 선택 강조. Die, Block, Page, Cell, Vth, Mapping, 상태 Page, 오류 bit를 개별 SVG 그룹/컴포넌트로 렌더링. Invalid는 색과 hatch로 함께 구분. |
| 12–13. 언어와 텍스트 | 일반 설명은 한글. 본편은 제목·짧은 설명·조작·결과로 제한. 일반 광고 문구와 장식 영문 없음. 기술 용어는 유지. |
| 14. Article | 실제 원고가 있는 9개 절, 주제별 이동과 기술 출처 링크. 구조·전하·다중 bit·동작·FTL·GC·마모·ECC·종합 흐름 포함. HTML 사전 렌더링으로 JS 없이도 본문 이용 가능. |
| 15. 핵심 인터랙션 | NAND/계층 hover 및 키보드 탐색, 저장 구조/bit toggle, Program 펄스, Read 기준 전압, Page 선택과 Block Erase, FTL 수정, 단계별 GC, 마모 분산과 불량 제외, 오류 주입/ECC/Read Retry, Read/Write 순차 조작. |
| 16. 제한된 loop | 선택 구조의 stroke pulse, 전하 강조, 채널 도통, Mapping과 GC 경로의 데이터 흐름. CSS 애니메이션이며 동작 줄임·목차·비활성 탭에서는 정지. 장식 particle 없음. |
| 17. 축척 | 구조 탐험에는 SSD→NAND Package→Die→Block→Page→Cell와 상대 눈금. Software 구간에서는 숨기고 엔딩에 SSD 축척으로 복원. 실제 계측값 아님. |
| 18. 금지 방향 | 제품 사진/광고 렌더/강한 glow/배경 particle/대형 카드 UI 없이 SVG 공학 개념도 사용. 모든 본편 스크린샷의 동일 팔레트·타이포·여백 검토. |
| 19. Build Canvas | 홈 맨 위 Work 04. scripts/build-pages.sh가 /build-canvas/nand-flash/ 정적 출력 포함. 기존 Work 1–3 소스 변경 없음. H는 상대 홈 경로 사용, 입력·편집·IME에서는 무시. |
| 20. 반응형과 안정성 | 1920×1080, 1280×720, 390×844에서 확인. 페이지 수평 넘침 없음. 목차·하단 진행 막대·기본 스크롤·자동 재생 중 사용자 입력·정방향/역방향 확인. 모바일 도형은 축소되며 상세 설명은 Article에서 읽을 수 있음. |
| 21–22. 판단과 1차 완성 | 시각적 개념 이해를 우선하며 특정 제품 수치/소자 구조를 과장하지 않음. 실제 동작 가능한 20개 본편과 Article로 전체 피드백을 시작할 수 있는 상태. 전체 본편 누락 없음. |
| 23. 완료 검사 | 통합 Pages 빌드 성공, 기존 Work 검사를 포함한 Node 테스트 30개 통과, 변경 코드 ESLint 경고/오류 없음. 브라우저 전체 Scene 및 핵심 인터랙션, 경로/MIME/홈 복귀 검사. 외부 배포는 별도 수행하지 않음. |

## Scene별 설계

### 01 · 컴퓨터가 데이터를 기억하는 방식

- 질문: 전원을 꺼도 어떻게 기억할까?
- 핵심 이해: 전원과 저장 상태는 다르다.
- 화면: structure · 전원을 꺼도 남아 있는 데이터. 그 기억은 SSD 어디에 있을까요?
- 조작: 전원 켜기·끄기
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: SSD 내부에서 저장 영역 찾기

### 02 · 컴퓨터가 데이터를 기억하는 방식

- 질문: SSD 안에서 누가 저장을 담당할까?
- 핵심 이해: Controller는 관리하고 NAND Flash는 비휘발성 저장을 담당한다.
- 화면: structure · SSD 내부로 들어가며 데이터가 실제로 저장되는 구조를 살펴봅니다.
- 조작: NAND hover·확대
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: NAND Package

### 03 · 작은 패키지 안으로

- 질문: Package 안에는 무엇이 있을까?
- 핵심 이해: Package와 내부 Die는 다른 계층이다.
- 화면: structure · NAND Package에는 하나 이상의 Die가 있습니다. 덮개 안의 반도체 칩을 따라 들어갑니다.
- 조작: 덮개 열기·Die hover
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: Die와 Plane

### 04 · 칩 안에도 구획이 있습니다

- 질문: 칩 안의 공간은 어떻게 나뉠까?
- 핵심 이해: Die 안에 Plane, Plane 안에 Block이 있다.
- 화면: structure · 하나의 Die는 Plane으로 나뉩니다. 각 Plane에는 많은 Block이 있습니다.
- 조작: Plane·Block hover
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: Block

### 05 · 지울 때는 한 묶음씩

- 질문: 무엇을 한꺼번에 지울까?
- 핵심 이해: Block이 지우는 단위다.
- 화면: structure · Block은 여러 Page를 묶은 영역입니다. Erase는 이 Block 전체에 적용됩니다.
- 조작: Page 선택·hover
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: Page

### 06 · 읽고 쓰는 단위, Page

- 질문: 데이터는 어느 단위로 오갈까?
- 핵심 이해: Page 단위 I/O와 Cell의 상태를 연결한다.
- 화면: structure · 많은 Cell의 상태를 함께 읽고 기록합니다. Read와 Program의 기본 단위는 Page입니다.
- 조작: Cell hover·확대
- 움직임: 대상 중심으로 카메라 이동, 외곽 소거, 내부 레이어 공개
- 다음 연결: Cell

### 07 · 기억은 전하의 상태

- 질문: Cell은 무엇을 기억할까?
- 핵심 이해: 전하 → Vth → 구분 가능한 상태로 이어진다.
- 화면: cell · 절연층에 둘러싸인 저장 영역이 전하를 유지합니다. 이 전하가 전류가 흐르기 시작하는 전압, Vth를 바꿉니다.
- 조작: Floating Gate / Charge Trap·전원 toggle
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: 상태 수와 bit

### 08 · 더 잘게 나누면, 더 많이 담습니다

- 질문: 한 Cell에 여러 bit를 어떻게 저장할까?
- 핵심 이해: SLC/MLC/TLC/QLC는 2/4/8/16개 상태를 구분한다.
- 화면: density · 같은 Cell에서 더 많은 Vth 상태를 구분합니다. 용량은 늘지만 상태 사이의 여유는 좁아집니다.
- 조작: SLC·MLC·TLC·QLC toggle
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Program

### 09 · 쓴다는 것은 전하를 옮기는 일

- 질문: 기록할 때 Cell에서 무엇이 변할까?
- 핵심 이해: Program이 전하 상태와 Vth를 바꾼다.
- 화면: cell · Program 전압을 가하면 저장 영역으로 전하가 이동합니다. 반복한 펄스와 확인으로 목표 Vth에 접근합니다.
- 조작: Program 펄스·초기화
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Read

### 10 · 전자를 세지 않고, 전류를 봅니다

- 질문: 저장한 상태는 어떻게 읽을까?
- 핵심 이해: 기준 전압이 Vth보다 높으면 채널이 도통한다.
- 화면: cell · 기준 전압을 가하고 전류가 흐르는지 확인합니다. Vth와 기준 전압의 관계로 저장 상태를 판별합니다.
- 조작: 기준 전압 slider·저장 상태 toggle
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Erase와 overwrite 제약

### 11 · 한 Page만 다시 쓸 수는 없습니다

- 질문: 파일 수정은 어떻게 가능할까?
- 핵심 이해: Page 단위 Read/Program과 Block 단위 Erase의 차이다.
- 화면: erase · 사용한 Page를 자유롭게 덮어쓸 수 없습니다. 다시 사용하려면 Block 전체를 Erase해야 합니다.
- 조작: Page 선택·Read·Program·Block Erase
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: 논리 주소와 물리 주소

### 12 · 같은 주소, 다른 자리

- 질문: Host가 아는 주소가 실제 저장 위치일까?
- 핵심 이해: 논리 주소와 물리 주소를 FTL Mapping이 잇는다.
- 화면: mapping · Host는 LBA를 사용합니다. FTL이 LBA를 실제 NAND 위치인 PPA로 연결합니다.
- 조작: LBA 선택
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Out-of-place Update

### 13 · 고치는 대신, 새 자리에 씁니다

- 질문: 같은 LBA를 수정하면 무엇이 바뀔까?
- 핵심 이해: 새 Page 기록 → Mapping 갱신 → 기존 Page invalid.
- 화면: mapping · 새 Page에 기록하고 Mapping을 옮깁니다. 이전 Page는 더 이상 유효하지 않은 Invalid 상태가 됩니다.
- 조작: LBA 100 수정·초기화
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Garbage Collection

### 14 · 남길 것만 옮기고, 한꺼번에 비웁니다

- 질문: Invalid Page로 가득 찬 공간은 어떻게 되찾을까?
- 핵심 이해: migration과 Mapping 갱신이 Erase보다 먼저다.
- 화면: mapping · Valid Page를 먼저 옮겨 보존합니다. 그 다음 Block을 지워 다시 쓸 공간을 확보합니다.
- 조작: 수정 반복·GC 실행·단계별 이동 표시
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Wear Leveling

### 15 · 사용 횟수를 나누는 일

- 질문: 특정 Block만 닳으면 어떻게 될까?
- 핵심 이해: 웨어 분산과 불량 블록 제외로 수명을 관리한다.
- 화면: wear · Program / Erase가 반복되면 Cell이 마모됩니다. 덜 사용한 Block을 선택하고 Bad Block은 제외합니다.
- 조작: 분산 켜기·끄기·P/E 반복·Bad Block 지정
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Retention / Disturb

### 16 · 기억의 경계는 조금씩 흔들립니다

- 질문: 저장 상태가 변하면 무엇이 달라질까?
- 핵심 이해: Retention과 Read Disturb가 읽기 판정을 어렵게 한다.
- 화면: reliability · 시간이 흐르거나 주변 Cell이 반복해서 읽히면 Vth 분포가 달라져 읽는 값에 오류가 생길 수 있습니다.
- 조작: Retention / Read Disturb·변화량 slider
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: ECC와 Read Retry

### 17 · 여분의 bit로 오류를 찾아냅니다

- 질문: 틀린 bit를 어떻게 바로잡을까?
- 핵심 이해: 검사 부호의 제한된 복구 능력과 Read Retry의 역할이다.
- 화면: ecc · 데이터와 함께 저장한 검사 bit로 오류를 찾습니다. 복구 한계를 넘으면 다시 읽거나 실패를 보고합니다.
- 조작: bit 뒤집기·ECC 실행·Read Retry
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: 전체 Write 흐름

### 18 · 한 번의 저장에 많은 일이 일어납니다

- 질문: 파일 저장 요청은 어디로 갈까?
- 핵심 이해: 애플리케이션 요청과 NAND Program을 하나로 연결한다.
- 화면: flow · Host의 요청이 FTL과 ECC를 거쳐 NAND로 갑니다. 새 Page 기록이 끝나면 Mapping을 확정합니다.
- 조작: Write 단계 진행·다시 실행
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: 전체 Read 흐름

### 19 · 읽을 때도 확인하며 돌아옵니다

- 질문: 읽기 요청은 어떤 경로로 돌아올까?
- 핵심 이해: Mapping·물리 읽기·ECC·필요 시 Retry가 연결된다.
- 화면: flow · FTL이 위치를 찾고 NAND가 Page를 읽습니다. ECC 확인을 거친 데이터가 Host로 돌아옵니다.
- 조작: Read 단계 진행·Retry 경로 toggle
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: SSD로 돌아가기

### 20 · 작은 전하와, 그것을 관리하는 기술

- 질문: 컴퓨터는 어떻게 데이터를 기억하는가?
- 핵심 이해: 전하의 저장과 이를 관리하는 계층이 합쳐져 SSD가 된다.
- 화면: ending · NAND의 물리적 제약을 Controller와 Software가 관리합니다. 그래서 우리는 SSD를 안정적인 저장장치처럼 사용합니다.
- 조작: 처음으로·자세히 읽기
- 움직임: 정착 후 상태 변화와 다음 개념으로 연결
- 다음 연결: Article / Appendix

## 검증 범위

- `npm run build:pages`: 홈과 Work 1–4 통합 출력 성공.
- `node --test tests/*.test.mjs projects/nand-flash/tests/*.test.mjs projects/orca/tests/*.test.mjs projects/transformer-to-agent/tests/*.test.mjs`: 30개 통과.
- Work4 모델 테스트: 180회 반복 수정/GC 후 모든 값 보존, 공간 부족 시 상태 보존, Migration 이전 Erase 차단, 모든 4 bit 입력에 대한 모든 1/2 bit 오류 조합, Read Retry 재판정, Bad Block 제외, 정방향/역방향 타임라인.
- 실제 Chrome: 20개 Scene 순/역방향, 전원, 덮개, QLC, Program, Read, Erase, FTL/GC, 마모, ECC, Retry, 요청 순서, 목차/Esc, 3개 viewport, 동작 줄임, Article 9개 절. 리소스 로딩 실패와 실행 오류 0.
- 통합 경로: 홈과 네 Work HTTP 200, `.mjs` JavaScript MIME, 홈 정렬 04→03→02→01, Work4 진입과 H 복귀, 입력 중 H 무시.

## 유지보수와 범위

원본 참고 이미지와 문서, 정적 Scene A는 docs 아래에 보존합니다. Work4는 projects/nand-flash 아래에 있으며 새 저장소·별도 프레임워크·의존성을 추가하지 않았습니다. 모델의 단순화와 실제 제품과의 차이는 본문 Article에 표시했습니다. GitHub Pages 배포를 위한 출력은 준비했으며 원격 게시 작업은 수행하지 않았습니다.
