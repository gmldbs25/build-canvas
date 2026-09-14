# Work 04 · 컴퓨터가 데이터를 기억하는 방식

NAND Flash 전체 1차본. 기존 build-canvas 저장소와 GitHub Pages 안에서 동작하는 정적 Work입니다. 20개 본편 장면과 9개 학습용 Article 절로 구성합니다. 별도 프레임워크, 런타임 의존성, 외부 이미지·글꼴 요청 없이 HTML/CSS/SVG/ES modules로 동작합니다.

## 탐험

SSD → NAND Package → Die / Plane → Block → Page → Cell → SLC/MLC/TLC/QLC → Program → Read → Erase → LBA/PPA → FTL → GC → Wear Leveling / Bad Block → Retention / Disturb → ECC / Read Retry → 전체 Write / Read → SSD 엔딩 → Article.

초반에는 같은 SSD 카메라로 Package를 확대하고, 내부 구조를 드러내며 다음 축척과 겹쳐 전환합니다. 각 장면의 앞쪽 54%는 정착 구간입니다. 이후에는 상태 변경과 시뮬레이션을 중심으로 리듬을 바꿉니다. 원래 Scene A 디자인은 `docs/nand-flash/designs/scene-a/`에 보관합니다.

## 실행

저장소 루트에서 기존 통합 명령을 사용합니다.

```sh
npm run build:pages
node scripts/serve-pages.mjs --port 4175
```

- 홈: `http://localhost:4175/build-canvas/`
- Work4: `http://localhost:4175/build-canvas/nand-flash/`

Work4만 빠르게 확인할 때는 `python3 -m http.server 4174 --bind 127.0.0.1 --directory projects/nand-flash`를 사용할 수 있습니다. 이때 홈 복귀와 다른 Work는 통합 프리뷰에서 검증해야 합니다. ES modules를 사용하므로 file://로 직접 열지 않습니다.

## 조작

- 스크롤 / 트랙패드 / 터치: 장면 진행과 역방향 복귀.
- 하단 진행 막대: 어느 지점이든 이동; 키보드 화살표로도 사용 가능.
- 상단 축척: 구조 장면으로 이동. 목차는 전체 20개 장면과 Article을 연결합니다.
- 좌우 화살표: 이전/다음 Scene. O: 목차. Esc: 목차·툴팁 닫기와 자동 재생 정지.
- H: Build Canvas 홈. 입력 필드·편집기·IME 조합 중에는 동작하지 않습니다.
- 자동 재생: 전체 흐름을 살펴보는 보조 기능. 버튼을 다시 누르거나 휠·터치·키보드로 직접 스크롤하면 정지합니다.
- 시스템 동작 줄임 설정: 확대 이동, pulse, 데이터 흐름 애니메이션을 생략합니다.

## 핵심 구현

- `content.mjs`: 모든 Scene의 질문·핵심 이해·오브젝트·인터랙션·다음 연결 및 Article.
- `index.html`: 고정 관찰 화면, 원본 SSD 벡터, 목차, 사전 렌더링된 Article.
- `diagrams.mjs`: Die/Plane, Page/Cell, 전하/Vth, 분포, Mapping, Wear, ECC와 요청 흐름을 그리는 SVG 컴포넌트.
- `model.mjs`: 스크롤 타임라인, FTL/GC 저장 상태, 마모 분산, 확장 Hamming SECDED와 전압 재판정 모델.
- `main.js`: 스크롤·포커스·키보드·사용자 조작·단계별 GC 연결.
- `style.css`: 청회색 디자인, 넓은 여백, 반응형 레이아웃과 제한된 의미 있는 motion.

FTL과 GC는 같은 Mapping·Page 상태를 공유합니다. GC는 Valid migration과 Mapping 갱신 후에만 Erase합니다. 공간이 가득 찬 경우 쓰기를 거부하고 GC로 안내합니다. 장면을 이동하며 GC 애니메이션을 중단해도 이미 시작한 상태 변경은 일관되게 완료합니다.

## 모델의 범위

구조와 전압은 설명용 상대값입니다. 실제 제품의 치수·용량·속도·P/E 한계를 예측하지 않습니다. 물리 Cell/논리 Page의 관계, Floating Gate/Charge Trap의 차이, 실제 3D NAND 구조와 교육용 단면의 차이는 Article에 설명합니다.

ECC는 실제 확장 Hamming (8,4)을 계산합니다. 1 bit 오류를 고치고 2 bit 오류를 검출하며, 임의 오류 실험은 2 bit까지 제한합니다. 현대 SSD의 BCH/LDPC와 동일한 구현은 아닙니다. Read Retry 예시는 같은 셀 상태를 달라진 기준 전압으로 다시 판정합니다. 임의로 뒤집은 bit를 무조건 되돌리지 않습니다.

## 검증

```sh
node --test projects/nand-flash/tests/model.test.mjs
node --test tests/*.test.mjs projects/orca/tests/*.test.mjs projects/transformer-to-agent/tests/*.test.mjs
```

모델 검사는 반복 FTL/GC, 데이터 보존, 공간 부족, 모든 4 bit 입력의 모든 1/2 bit 오류 조합, Bad Block 제외, 역방향 타임라인을 포함합니다. 브라우저 검토 기록과 요구사항 대응은 `docs/nand-flash/work4-implementation.md`를 참고합니다.

기존 Work 1~3 소스는 변경하지 않았습니다. 홈에 Work 04를 추가하고 기존 Pages 빌드에 정적 결과물을 복사합니다. 프리뷰 서버에는 `.mjs` MIME 타입을 추가했습니다. 외부 배포는 별도로 수행하지 않았습니다.
