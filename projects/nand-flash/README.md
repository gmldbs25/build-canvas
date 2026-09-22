# Work 04 · 컴퓨터가 기억하는 방식

컴퓨터 → SSD → NAND → Cell → Software → 컴퓨터를 잇는 인터랙티브 학습 자료입니다. 1차 구현의 SSD 벡터와 스크롤 카메라, FTL/GC 공유 상태, ECC 모델을 유지하면서 22개 장면과 13개 Article 절로 완성했습니다. 별도 프레임워크·런타임 의존성·외부 이미지·글꼴 요청 없이 HTML/CSS/SVG/ES modules로 동작합니다.

15개 동작 장면은 들어가면 설명 애니메이션이 자동 반복됩니다. 시작 상태 → 변화 → 결과를 단계별 캡션과 함께 보여주며, 장면 이동은 사용자의 스크롤에 맡깁니다. 화면에는 선택적인 `직접 살펴보기`만 남겨 실행 버튼과 슬라이더를 접어 둡니다. 모바일에서는 짧은 설명 → 그림 → 현재 단계 해설 → 선택적 조작 → 배경 설명 순서로 읽습니다. 컴퓨터 내부 기판, Die의 배열·주변 회로, Page의 Cell 판정·읽기 회로 연결을 기능적 도식으로 표현합니다.

기준 독자는 RAM·SSD·bit는 알지만 NAND 내부는 처음 접하는 기술 독자입니다. Vth·Vref·LBA·PPA·ECC·Read Retry는 첫 장면의 짧은 설명에서, FTL·Mapping·P/E·Retention·Read Disturb는 배경 설명과 관찰 캡션에서 풀어 씁니다. Valid / Invalid / Free의 뜻은 주소 도식의 범례에 함께 표시합니다. 후반은 공간 문제 → 마모 문제 → 읽기 오류로 이어집니다. 기존 엔딩 뒤 Article 입구에는 네 가지 핵심 복습이 있습니다.

Article 13개 절은 `핵심` 한 문장부터 읽습니다. Flush / FUA, 논리 Page·Cell 관계의 세부사항, 실제 Mapping·metadata, Write Amplification, Dynamic / Static Wear Leveling, BCH / LDPC, Controller 병렬 처리 등은 `조금 더 정확히`에서 펼칩니다. 필수 모델 한계는 기본 본문에도 남기며, 접기·펼치기는 JavaScript 없이도 키보드와 터치로 동작합니다.

## 이야기와 실험

1. `기억.txt` 저장 → 정상 종료 → 다시 켜기. RAM과 저장장치를 구분하고 SSD의 Controller / NAND 역할을 찾습니다.
2. SSD → NAND Package → Die → Plane → Block → Page → Cell을 연속적으로 탐험합니다.
3. 전하 → Vth → 판정, SLC/MLC/TLC/QLC 분포 비교, Program 펄스와 Read 기준 전압의 변화를 자동으로 관찰합니다. 직접 살펴보기에서는 기존 조작도 사용할 수 있습니다.
4. Page 수정의 제약에서 LBA / PPA와 FTL로 이어집니다. 새 Page Program → Mapping 이동 → 옛 Page Invalid가 실제 모델 상태에 반영됩니다.
5. FTL과 같은 공간에서 GC의 Valid 복사 → Mapping 갱신 → Block Erase → Free 확보를 관찰합니다.
6. 같은 초기값·같은 6회의 P/E로 분산 전후를 나란히 비교합니다. Retention / Disturb, ECC의 1 bit 복구 / 2 bit 검출, Read Retry도 반복 재생합니다. Bad Block 제외는 직접 살펴보기에서 조작합니다.
7. 전체 Write / Read 경로에서 같은 물리 주소와 데이터 버전을 추적하고, 처음의 컴퓨터와 문서로 돌아옵니다.

## 실행과 검증

저장소 루트의 기존 GitHub Pages 흐름을 사용합니다.

```sh
npm run build:pages
node scripts/serve-pages.mjs --port 4175
```

- 홈: `http://localhost:4175/build-canvas/`
- Work4: `http://localhost:4175/build-canvas/nand-flash/`

```sh
node --test projects/nand-flash/tests/*.test.mjs
node --test tests/*.test.mjs projects/orca/tests/*.test.mjs projects/transformer-to-agent/tests/*.test.mjs projects/nand-flash/tests/*.test.mjs
node_modules/.bin/eslint projects/nand-flash/main.js projects/nand-flash/*.mjs projects/nand-flash/tests/*.mjs projects/nand-flash/scripts/*.mjs
```

Article의 원고는 `content.mjs`가 기준입니다. 수정 후 아래 명령으로 JavaScript 없이도 읽을 수 있는 HTML을 동기화합니다. 테스트는 원고와 사전 렌더링 결과가 달라지면 실패합니다.

```sh
node projects/nand-flash/scripts/render-article.mjs
node projects/nand-flash/scripts/render-article.mjs --check
```

## 조작과 접근성

- 스크롤·트랙패드·터치, 하단 scrubber, 좌우 화살표: 장면 진행과 역방향 이동.
- H: Build Canvas 홈. 입력 필드·편집기·IME 조합에서는 무시합니다.
- O: 전체 목차. Escape: 목차·툴팁 닫기, 현재 장면 애니메이션 중단.
- 클릭·Enter·Space: 의미 있는 구조 선택과 실험. 장면 이동 완료 후 제목에 포커스를 옮깁니다.
- 상단 일시정지는 장면 안의 움직임을 멈추고, 재생은 같은 지점에서 이어갑니다. 자동으로 다음 장면으로 이동하지 않습니다. Tab·Escape는 현재 장면을 멈추지만 다음 장면은 다시 재생됩니다. 사용자가 상단 버튼으로 지정한 일시정지는 장면을 바꿔도 유지합니다.
- 목차, 비활성 탭, Article, 화면 밖 도식, 장면 전환 중에는 반복 시계를 멈춥니다. 직접 살펴보기에서는 루프와 분리된 실험 상태를 사용합니다. 자동으로 보기를 누르면 루프를 다시 시작합니다.
- `prefers-reduced-motion`: 카메라 보간, SVG/CSS 전환, 반복 움직임과 지연 애니메이션을 생략합니다.
- 자동 반복은 스크린리더에 결과를 계속 알리지 않습니다. 직접 조작한 FTL/GC/Erase/ECC 결과는 live region으로 안내합니다. 오류·무효·선택 상태는 색상만으로 구분하지 않습니다.
- 모바일과 세로 태블릿은 별도 배치와 읽기 크기를 사용합니다. 매우 짧은 화면은 장면 내부를 스크롤할 수 있으며, 다음/이전 장면은 항상 위에서 시작합니다.

## 구현

- `content.mjs`: 장면 순서·문구·정착 비율·길이, 장면별 입문 설명과 조작 안내(`sceneLearning`), 요청 흐름, 출처를 포함한 Article 원고와 핵심·심화 구분(`articleReading`).
- `index.html`: sticky viewport, 원본 SSD 벡터, 목차 dialog와 사전 렌더링된 Article.
- `diagrams.mjs`: 계층 SVG와 컴퓨터·Cell·Page·Mapping·마모·ECC·전체 흐름 오브젝트.
- `model.mjs`: 가변 길이의 역방향 타임라인, 단계별 FTL/GC, 마모 분산, SECDED, 전압 재판정.
- `demos.mjs`: 실제 모델에서 만든 단계별 독립 스냅샷, 반복 시간, 관찰용 캡션. FTL 마지막 상태가 GC 첫 상태로 이어지며, 반복할 때 같은 초기 상태로 돌아갑니다.
- `main.js`: 카메라·스크롤·키보드·포커스·트랜잭션·최소 DOM 갱신.
- `style.css`: 기존 청회색 디자인과 장면별 구성, 반응형 실험 화면.

설명·실험 장면의 정착 구간은 56–75%이며, SSD부터 Cell까지의 물리 탐험 연결은 정착 구간 없이 진행합니다. 구조 장면은 확대와 겹침으로, 중후반은 오브젝트의 상태 변화로 설명합니다. 자동 설명은 관찰용 스냅샷만 재생하므로 반복하거나 장면을 이동해도 직접 실험의 데이터를 바꾸지 않습니다. 직접 실험 중 장면을 떠나면 시작한 트랜잭션을 일관되게 완료합니다. 직접 조작의 FTL과 GC는 같은 저장 상태를 쓰고, 마지막 전체 흐름은 재생 가능한 별도 작은 저장 모델을 사용합니다.

## 공학적 범위

전압·전자 점 개수·용량·치수·횟수·분포는 설명용입니다. 특정 SSD의 속도, 내구 수명, retention 또는 전원 차단 보장을 예측하지 않습니다. 논리 Page와 물리 Cell, 3D 구조, Floating Gate / Charge Trap, Flush / FUA의 차이는 Article에서 보충합니다.

ECC는 확장 Hamming (8,4) SECDED를 실제 계산하며, 현대 SSD의 BCH/LDPC 전체 구현은 아닙니다. Read Retry는 같은 Cell 상태를 다른 전압 기준으로 다시 판정합니다. 임의로 뒤집은 bit를 무조건 되돌리지 않습니다.

원본 비주얼 기준과 Scene A는 `docs/nand-flash/`에 그대로 보존합니다. 기존 Work 1–3, 홈, 의존성, 통합 빌드 설정은 변경하지 않았습니다. 상세 검증 기록은 `docs/nand-flash/work4-implementation.md`에 있습니다.

## 연속적인 스크롤과 데모 렌더링

SSD → Package → Die → Plane → Block → Page → Cell의 물리 탐험은 정착 구간 없이 스크롤 위치에 직접 대응합니다. 설명·실험 장면은 기존 읽기 구간을 유지합니다. 두 도식은 전환 중 같은 DOM을 유지하고, 현재 장면이 바뀌는 중간점에서도 재사용합니다.

`main.js`의 단일 rAF 스케줄러는 스크롤 갱신과 데모 시계를 조율합니다. 브라우저가 전달한 타임스탬프를 그대로 사용하며 고정 FPS, interval, 90ms 그래픽 제한을 두지 않습니다. `demos.mjs`는 논리 스냅샷과 별도의 시각 보간 값을 반환하고, `motion.mjs`는 캐시한 노드의 transform·opacity·SVG attribute만 갱신합니다. 그래픽 HTML 비교는 단계 전환이나 실제 판정 변경 때만 수행합니다. 진행선은 단계 수가 아니라 전체 반복의 실제 경과 시간에 비례합니다.

도식의 화면 진입은 IntersectionObserver로 감지하고, 경로 좌표는 장면·단계·크기 변경 뒤 다음 프레임의 읽기 구간에서 측정합니다. 자동 모드의 CSS transition/keyframe은 데모 시계와 중복 실행하지 않습니다. 동작 줄임 설정에서는 최종 논리 상태를 표시하고 반복을 실행하지 않습니다. Program과 마모 비교의 반복 초기화는 짧은 fade로 구분하여 전하나 마모가 저절로 줄어드는 것으로 표현하지 않습니다.

선택적 브라우저 회귀 검증은 별도 설치된 Playwright와 Chromium으로 실행합니다. 프로젝트 런타임 의존성은 추가하지 않습니다.

```sh
WORK4_URL=http://localhost:4175/build-canvas/nand-flash/ \
WORK4_PLAYWRIGHT=/absolute/path/to/playwright/index.mjs \
WORK4_CHROMIUM=/absolute/path/to/chrome \
node projects/nand-flash/scripts/check-motion.mjs
```

이 검증은 실제 rAF 중 그래픽 갱신·DOM 재사용, 순방향/역방향 스크롤, 주요 조작, 모바일, 동작 줄임을 확인합니다. 별도의 60/120/144Hz 타임스탬프 주입 검증은 애플리케이션이 전달받은 프레임을 버리지 않는지 확인하는 회귀 테스트이며, 실제 모니터에서 그 FPS로 표시되었다는 뜻은 아닙니다. 실제 표시 주사율은 디스플레이·브라우저·GPU에 따라 달라집니다.

### 2026-09-22 검증 기록

Chromium headless, 1280×720, 관측 rAF 중앙값 약 16.7ms 환경에서 이전 HEAD와 같은 시나리오를 비교했습니다. 아래 수치는 계측 콜백을 포함한 해당 실행의 결과이며 기기 성능 보장이 아닙니다.

| 측정 | 이전 | 개선 |
|---|---:|---:|
| Read ramp 2.6초: 그래픽 갱신 / rAF | 26 / 156 | 156 / 156 |
| Read 프레임 콜백 비용 p95 | 2.6ms | 1.0ms |
| Reliability 프레임 콜백 비용 p95 | 2.7ms | 1.0ms |
| 물리 탐험 5초 왕복: 프레임 콜백 비용 p95 | 9.1ms | 5.2ms |
| Read ramp의 getBoundingClientRect 호출 | 312 | 0 |

개선본의 60초 Read 반복에서 3,601개 rAF 콜백, 콜백 p95 1.2ms, Long Task 0건, 새 그래픽 element 0개, getBoundingClientRect 호출 0회를 관측했습니다. DevTools trace에 script stack을 동반한 Layout은 없었습니다. SVG 위치와 숫자 갱신에 따른 일반 Layout·paint는 남아 있으며, GPU·실제 고주사율 모니터에서의 표시 성능까지 보장하는 측정은 아닙니다.

Work4 Node 테스트 26개, 저장소·각 Work 통합 테스트 52개, `npm test` 5개, Work4 ESLint, Article 원고 동기화, Pages 빌드를 통과했습니다. 전체 `npm run lint`는 수정하지 않은 Work3 소스 2개와 생성 파일 25개 오류로 실패하며 이번 변경 범위에서 그대로 두었습니다. 브라우저에서는 데스크톱 22개 장면, 390×844·320×568, 양방향 스크롤과 DOM 인계, scrubber drag, wheel에 의한 자동 이동 취소, 키보드·포커스, 수동 FTL/GC, Article 왕복, 네이티브 터치, 동작 줄임 및 실행 중 설정 변경을 검증합니다. 독립 리뷰에서 지적한 Retry 전압 라벨 동기화와 분포 초기화 경계를 보완했습니다.
