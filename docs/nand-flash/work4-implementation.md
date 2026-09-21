# Work4 최종 구현 및 검토 기록

2026-09-14. 기존 1차본을 기반으로 한 완성본. 작업 시작 전에 깨끗한 `main`의 `git status`를 확인하고 `git pull`로 원격 `e67689b`까지 fast-forward했습니다. master spec, content outline, 기존 구현 기록, 레퍼런스 이미지와 Scene A를 검토했습니다.

## 2026-09-21 · 입문 독자를 위한 최종 Polish

- 22개 Scene, 13개 Article, 카메라·모델·15개 자동 루프의 동작을 유지했다. 본편에서는 기존 문구를 고쳐 Vth·Vref·LBA·PPA·ECC·Read Retry를 한 문장으로 정의하고, FTL·Mapping과 P/E·Retention·Read Disturb의 배경 설명을 정리했다. 주소 도식에는 Valid / Invalid / Free의 한국어 범례를 붙였다.
- 후반의 장 표시는 공간 문제 → 마모 문제 → 신뢰성 문제로 이어진다. 새 Page 기록 → Mapping 변경 → Invalid → Valid 보존·주소 갱신 → Block Erase → Free 확보의 순서와 자동 관찰 시간을 유지했다.
- Article에 핵심 한 문장과 네이티브 `details` 심화 영역을 적용했다. 01절은 RAM과 NAND의 차이 및 정상 종료 가정을 먼저 읽은 다음 Flush / FUA를 펼친다. 논리 Page·Cell의 세부 관계, 실제 Mapping·metadata, Write Amplification, Dynamic / Static Wear Leveling, BCH / LDPC, 병렬 처리도 구분했다. 모든 기존 문단과 출처가 사전 렌더링 HTML에 남는다.
- 기존 엔딩 다음 Article 입구에 전하→bit, Page/Block 단위, 수정→GC, 마모·읽기 오류의 네 가지 복습을 넣었다. 데스크톱은 2열, 모바일은 1열이다. 작은 화면에서 제목의 어절과 Page 상태 라벨이 잘리지 않도록 줄바꿈·행 높이를 조정했다.
- Sol 독립 리뷰에서 지적한 두 모델 한계는 기본 본문에도 유지했다: TLC의 같은 Cell 집합이 여러 논리 Page를 표현할 수 있다는 점, 작은 SECDED 모델이 실제 SSD ECC 전체가 아니라는 점. 원고 보존·기본 본문 경계 조건 검증에 두 항목을 포함했다.
- KIOXIA Cell / GC / Wear / ECC, Linux Kernel Flush / FUA, USENIX LDPC와 Read Retry 연구를 재확인했다. Read와 Retry의 `Vref > Vth → 1`, Retry의 고정 전하, 같은 초기 상태·같은 6회 P/E 비교, FTL→GC 상태 연결, SECDED 전체 1·2 bit 오류 조합은 기존 모델·루프 테스트로 재검증했다.

현재 검증: Work4 20개 / 통합 Node 46개 / `npm test` 5개 통과, Article 동기화 검사·Work4 ESLint·Pages 통합 빌드 통과. 전체 `npm run lint`는 27개 오류로 실패했다. 2개는 변경하지 않은 Work3 `carousel.tsx`, `use-mobile.ts`의 기존 React hook 오류이며, 나머지 25개는 생성된 빌드 파일이다. 다른 Work와 공통 lint 설정은 이번 범위에서 수정하지 않았다.

브라우저에서는 1280×720·390×844·320×568에서 22개 장면을 확인했다. 수평 넘침과 실행 오류 없음. 자동 진행·일시정지·재개, 좌우 이동·제목 포커스, O/Escape, scrubber, 입력 중 H 보호·홈 복귀, Article 왕복·키보드 펼치기, 직접 조작의 FTL/GC 공유 상태, Wear 동일 조건, ECC/Retry, 모바일 내부 스크롤·장면 변경 시 초기화, 동작 줄임 환경의 정지·직접 조작을 확인했다. Article의 심화 펼치기와 13개 본문은 JavaScript를 꺼도 읽을 수 있다. 상세한 초기 구현·검증 기록은 아래에 보존한다.

## 최종 구성

대표 제목은 **컴퓨터가 기억하는 방식**, 부제는 **NAND Flash의 동작 원리**입니다. 컴퓨터의 저장 경험에서 출발하여 Cell의 물리까지 내려가고, Software의 관리와 오류 복구를 거쳐 처음의 문서로 돌아옵니다.

| 장면 | 핵심 오브젝트와 학습 행동 |
|---|---|
| 01. 컴퓨터가 기억하는 방식 | 기억.txt 저장 → 정상 종료 → 다시 켜기 |
| 02. 화면이 꺼져도, 저장은 남습니다 | 컴퓨터 내부의 RAM / SSD 구분 |
| 03. 관리하는 칩, 기억하는 칩 | 기존 SSD 기판. Controller 관리 / NAND 저장 |
| 04. 작은 패키지 안으로 | 기존 NAND Package 카메라, 덮개 개방, Die 선택 |
| 05. 칩 안의 작은 구획들 | Die 안의 Plane |
| 06. 많은 Block이 모여 있는 곳 | Plane을 크게 펼치고 Block 선택 |
| 07. 지울 때는 한 묶음씩 | Block / Page 동작 단위 |
| 08. 함께 읽고 쓰는 데이터의 단위 | Page bit를 표현하는 Cell 상태. 논리 Page 관계 보충 |
| 09. 기억은, 전하의 상태 | 전하 상태와 Vth, 전원을 꺼도 남는 물리적 차이 |
| 10. 같은 공간, 더 촘촘한 경계 | SLC / MLC / TLC / QLC와 2 / 4 / 8 / 16 상태 |
| 11. 목표 상태까지, 조금씩 | Program 펄스와 목표 Vth 도달 |
| 12. 전자를 세지 않고, 전류를 봅니다 | Vref slider와 도통·비도통. 직전 Program 상태도 비교 |
| 13. 파일은 고치는데, Page는? | Page 선택 / Read / Program / Block 전체 Erase |
| 14. 같은 주소, 다른 자리 | LBA → FTL → 현재 PPA 선택 |
| 15. 수정은, 새 자리에 쓰는 일 | 새 Page 기록 → Mapping 이동 → 옛 Page Invalid |
| 16. 이 공간을 다시 쓰려면 | 공유 상태에서 Valid 복사 → Mapping → Erase → Free |
| 17. 한곳만 닳지 않도록 | P/E 횟수 분산과 Bad Block 제외 |
| 18. 기억의 경계가 흔들릴 때 | Retention / Read Disturb와 Vth 분포 변화 |
| 19. 여분의 bit가 기억을 지킵니다 | SECDED 단일 오류 복구 / 이중 오류 검출 / 전압 재판정 |
| 20. 한 번의 저장 뒤에서 | 실제 작은 모델을 따라 Host / Controller / NAND의 Write |
| 21. 다시 여는 문서의 여정 | 같은 PPA·버전의 Read, 필요 시 Retry |
| 22. 작은 상태를 만들고, 함께 기억하는 일 | 처음의 컴퓨터와 다시 열린 문서 |

## 유지한 구현과 개선한 부분

원본 SSD 벡터, Package 내부 개방, 계층 SVG, sticky viewport와 가역 타임라인, FTL/GC 공유 상태, SECDED 및 Read Retry 모델을 유지했습니다. 프레임워크나 의존성을 추가하지 않았습니다. Work 1–3과 공통 배포 설정도 변경하지 않았습니다.

장면을 숫자로 연결하던 부분을 의미 있는 ID로 바꾸었습니다. 장면마다 길이와 정착 구간(56–75%)을 다르게 두어 복잡한 실험에는 시간을 더 줍니다. 구조 장면은 확대·겹침을 유지하고, 관계없는 후반 오브젝트는 동시에 겹쳐 읽히지 않도록 순차적으로 전환합니다.

Program / Read는 같은 소자와 전압축을 조작합니다. Erase는 실제 Page 행과 전체 Block 상태가 바뀝니다. FTL/GC는 넓은 저장 공간 작업 화면, Wear는 막대, ECC는 직접 뒤집는 bit 배열, 전체 Write/Read는 세 계층 사이의 요청으로 구성했습니다. 모든 장면을 동일한 좌우 설명 슬라이드로 만들지 않았습니다.

FTL에는 Program 완료 후 Mapping 대기 상태가 있습니다. GC 역시 복사와 Mapping 단계를 구분합니다. 새 복사본을 만들기 전에 원본을 지우지 않으며, 작업 중 장면 이동도 안전하게 완료합니다. 마지막 Write/Read는 별도의 재생 가능한 작은 모델에서 실제 PPA와 데이터 버전을 함께 갱신합니다.

## Article과 정확성

13개 절에 SSD와 RAM·캐시, NAND 계층, 3D 구조, 전하와 Floating Gate / Charge Trap, Vth, 다중 상태, 동작 단위, LBA / PPA / FTL, Out-of-place Update, GC, Wear / Bad Block, Retention / Disturb, ECC, Read Retry와 전체 요청 흐름을 담았습니다.

KIOXIA의 소자·다중 상태·3D NAND·GC·Wear·ECC 기술 자료, Linux Kernel의 Flush / FUA 설명, DSN·FAST·Read Retry 연구를 직접 확인했습니다. 주제별 출처 이름과 직접 링크를 각 절에 붙였습니다. 출처를 알 수 없는 제품별 수치를 추가하지 않았습니다.

- Page는 논리 I/O 단위이며 TLC/QLC에서는 같은 Cell 집합에 여러 논리 Page가 대응할 수 있음을 본편과 Article에서 명시합니다.
- 구조 도식은 실제 3D 단면이나 적층 수가 아닙니다.
- 전압, 전하 점 개수와 분포는 설명용 상대값입니다.
- ECC는 확장 Hamming (8,4) SECDED이며 실제 SSD의 BCH/LDPC 전체가 아닙니다.
- 전원 도입은 저장과 정상 종료를 마친 상황입니다. 캐시의 쓰기 완료와 영속화, 갑작스러운 전원 차단은 구분합니다.
- Read Retry는 전하를 바꾸지 않고 기준 전압을 바꾸며, 복구를 항상 보장하지 않습니다.

Article HTML을 원고에서 생성하는 도구를 추가했고, 원고와 HTML의 일치를 테스트합니다. JavaScript를 꺼도 전체 글과 기술 출처를 읽을 수 있습니다.

## 검증

- `npm run build:pages`: 홈과 Work 1–4의 통합 출력 성공.
- 저장소·기존 Work·Work4 Node 테스트: 40개 통과. 기존 Work 소스 변경 없음.
- Work4 ESLint: 오류·경고 없음.
- 저장소 전체 `npm run lint`: 생성된 `dist-pages`와 기존 Work의 hook 등으로 실패. 이 작업에서 기존 Work나 공통 lint 설정을 수정하지 않았으며, 전체 lint가 통과했다고 주장하지 않습니다.
- 모델: 180회 반복 FTL/GC의 데이터 보존, 공간 부족 거부, 단계별 Program / Mapping / GC, stale plan 거부, 모든 4 bit 입력의 1 / 2 bit 오류 조합, Retry의 재판정, Bad Block 제외, 가변 길이 타임라인 왕복.
- 브라우저: 22개 장면 정방향·역방향 및 빠른 scrub. 구조 경계의 중복 ID 없음.
- 핵심 조작: 문서 저장·정상 종료·재시작, Package 개방, SLC–QLC, Program 목표 도달, Read 판정, Page overwrite 거부, Block Erase 후 Page 기록, FTL 수정, GC 네 단계, 동작 중 다른 장면 이동, 마모 분산·불량 제외, ECC 1 / 2 bit, Read Retry, Write / Read의 같은 PPA·버전.
- 키보드: 좌우 이동, 장면 제목 포커스, 목차와 Escape, Article 왕복, 입력 중 방향키·H 보호, H로 Build Canvas 홈 복귀. 자동 재생은 사용자 스크롤로 중단됨.
- 화면: 1920×1080, 1280×720, 1024×1366, 768×1024, 390×844, 320×568. 작은 화면의 수평 넘침 없음. 짧은 화면의 내부 스크롤과 다음 장면 상단 초기화 확인. 모바일 Article에서 본편의 고정 UI가 남지 않음.
- 동작 줄임: 카메라 보간, CSS 이동·반복 애니메이션, 시뮬레이션 지연을 생략하고 자동 재생을 비활성화하도록 코드·스타일 검토.
- 브라우저 실행 오류 및 경고: 검토 시 0.

독립 코드 검토에서 찾은 모바일 내부 스크롤, 장면 이동 포커스, 첫 저장 상태, 전체 흐름 PPA, 부분 Program 후 Read 선택 상태, live region, SVG 정의 ID 문제를 수정한 뒤 해당 행동을 다시 검증했습니다. 마지막 Write 개요에서도 Mapping 이동과 옛 Page의 Invalid 표시가 각각의 단계에서 나타남을 확인했습니다.

## 배포 경로

기존 GitHub Pages 빌드는 `projects/nand-flash/`의 7개 정적 파일(자동 설명용 `demos.mjs` 포함)을 `dist-pages/nand-flash/`로 복사합니다. 외부 런타임 요청은 없습니다. 정적 미리보기에서도 실제 `/build-canvas/nand-flash/` 경로와 ES module MIME 타입을 사용합니다.
