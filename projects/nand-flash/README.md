# Work 04 · 컴퓨터가 기억하는 방식

컴퓨터 → SSD → NAND → Cell → Software → 컴퓨터를 잇는 인터랙티브 학습 자료입니다. 1차 구현의 SSD 벡터와 스크롤 카메라, FTL/GC 공유 상태, ECC 모델을 유지하면서 22개 장면과 13개 Article 절로 완성했습니다. 별도 프레임워크·런타임 의존성·외부 이미지·글꼴 요청 없이 HTML/CSS/SVG/ES modules로 동작합니다.

각 장면에는 입문자를 위한 배경 설명과 현재 상태에 맞는 조작 안내가 있습니다. 명확한 실행 버튼, 선택 묶음, 전압 값이 보이는 슬라이더와 도식 안의 이동 표식으로 조작을 찾을 수 있습니다. 모바일에서는 설명 → 조작 → 그림 순서로 읽습니다. 컴퓨터 내부 기판, Die의 배열·주변 회로, Page의 Cell 판정·읽기 회로 연결을 기능적 도식으로 표현합니다.

## 이야기와 실험

1. `기억.txt` 저장 → 정상 종료 → 다시 켜기. RAM과 저장장치를 구분하고 SSD의 Controller / NAND 역할을 찾습니다.
2. SSD → NAND Package → Die → Plane → Block → Page → Cell을 연속적으로 탐험합니다.
3. 전하 → Vth → 판정, SLC/MLC/TLC/QLC 분포 비교, Program 펄스와 Read 기준 전압을 직접 조작합니다.
4. Page 수정의 제약에서 LBA / PPA와 FTL로 이어집니다. 새 Page Program → Mapping 이동 → 옛 Page Invalid가 실제 모델 상태에 반영됩니다.
5. FTL과 같은 공간에서 GC의 Valid 복사 → Mapping 갱신 → Block Erase → Free 확보를 관찰합니다.
6. P/E 분산, Bad Block 제외, Retention / Disturb, ECC의 1 bit 복구 / 2 bit 검출, Read Retry를 비교합니다.
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
- O: 전체 목차. Escape: 목차·툴팁 닫기, 자동 재생 중단.
- 클릭·Enter·Space: 의미 있는 구조 선택과 실험. 장면 이동 완료 후 제목에 포커스를 옮깁니다.
- 자동 재생은 직접 휠·터치·키보드·실험 조작을 하면 멈춥니다. 동작 줄임 설정에서는 사용하지 않습니다.
- `prefers-reduced-motion`: 카메라 보간, SVG/CSS 전환, 반복 움직임과 지연 애니메이션을 생략합니다.
- FTL/GC/Erase/ECC 결과는 실제 상태 메시지가 live region으로 안내됩니다. 오류·무효·선택 상태는 색상만으로 구분하지 않습니다.
- 모바일과 세로 태블릿은 별도 배치와 읽기 크기를 사용합니다. 매우 짧은 화면은 장면 내부를 스크롤할 수 있으며, 다음/이전 장면은 항상 위에서 시작합니다.

## 구현

- `content.mjs`: 장면 순서·문구·정착 비율·길이, 장면별 입문 설명과 조작 안내(`sceneLearning`), 요청 흐름, 출처를 포함한 Article 원고.
- `index.html`: sticky viewport, 원본 SSD 벡터, 목차 dialog와 사전 렌더링된 Article.
- `diagrams.mjs`: 계층 SVG와 컴퓨터·Cell·Page·Mapping·마모·ECC·전체 흐름 오브젝트.
- `model.mjs`: 가변 길이의 역방향 타임라인, 단계별 FTL/GC, 마모 분산, SECDED, 전압 재판정.
- `main.js`: 카메라·스크롤·키보드·포커스·트랜잭션·최소 DOM 갱신.
- `style.css`: 기존 청회색 디자인과 장면별 구성, 반응형 실험 화면.

장면별 정착 구간은 56–75%입니다. 구조 장면은 확대와 겹침으로, 중후반은 오브젝트의 상태 변화로 설명합니다. 업데이트 중 장면을 떠나면 이미 시작한 트랜잭션을 일관되게 완료합니다. FTL과 GC는 같은 저장 상태를 쓰고, 마지막 전체 흐름은 재생 가능한 별도 작은 저장 모델을 사용합니다.

## 공학적 범위

전압·전자 점 개수·용량·치수·횟수·분포는 설명용입니다. 특정 SSD의 속도, 내구 수명, retention 또는 전원 차단 보장을 예측하지 않습니다. 논리 Page와 물리 Cell, 3D 구조, Floating Gate / Charge Trap, Flush / FUA의 차이는 Article에서 보충합니다.

ECC는 확장 Hamming (8,4) SECDED를 실제 계산하며, 현대 SSD의 BCH/LDPC 전체 구현은 아닙니다. Read Retry는 같은 Cell 상태를 다른 전압 기준으로 다시 판정합니다. 임의로 뒤집은 bit를 무조건 되돌리지 않습니다.

원본 비주얼 기준과 Scene A는 `docs/nand-flash/`에 그대로 보존합니다. 기존 Work 1–3, 홈, 의존성, 통합 빌드 설정은 변경하지 않았습니다. 상세 검증 기록은 `docs/nand-flash/work4-implementation.md`에 있습니다.
