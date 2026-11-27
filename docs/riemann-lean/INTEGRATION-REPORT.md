# Work 08 이야기와 심화 교과서 통합 검증

2026-11-27 · 기준 main `c3227683f67a2448f0ce2cf8f7965b7d392e7738` · 이야기 비교 기준 `5450fa5fb8ef86a8009828eb669342c21c860a3b`

## 공개 구조

| 경로 | 내용 |
| --- | --- |
| `/riemann-lean/` | 기존 Hero와 4막, 종이에서 터미널로 이어지는 스크롤 연출, 소수 관찰 노트, 파동 실험, Mini Lean |
| `/riemann-lean/textbook/` | 프롤로그, 4부 12장, 실험 25개, 확인 문제와 해설 52개 |
| `/riemann-lean/textbook/chapter-01/`–`chapter-12/` | 각 장의 본문, 실험, 확인 문제, 이전·다음 장 탐색 |
| `/riemann-lean/textbook/epilogue/`, `glossary/` | 에필로그, 용어집과 검증 자료 |

Work 08의 기존 홈 항목에서 이야기로 들어간다. 이야기 상단의 **심화 교과서 ↗**와 기존 엔딩 뒤의 **리만 가설, 깊이 읽기**가 교과서로 이어진다. 연결부는 ACT 04의 터미널 색과 서체를 이어받고 가로 구분선 안에 전체 링크를 둔다. 교과서 헤더의 이야기 복귀 링크, 차례 탐색, Build Canvas 홈은 각각의 목적지로 연결된다. 두 자료의 H 키는 포트폴리오 홈으로 이동한다.

Pages 빌드는 이야기의 정적 파일 11개를 명시적으로 복사하고 교과서 HTML과 실행 파일을 `textbook/` 아래 생성한다. 기존 12개 챕터, 에필로그, 용어집의 상위 주소 14개는 새 주소로 이동하면서 쿼리와 해시를 유지한다. 스크립트를 끈 경우 이동 링크를 표시한다. 사이트맵에는 이야기와 교과서의 정식 주소 16개가 들어간다. 호환 페이지는 새 주소를 canonical로 가리키며 `noindex`를 선언한다.

`#act1`–`#act4` 및 `?xp=1&step=1`–`4`는 이야기에서 처리한다. 예전 `?mode=math`와 `w8:mode` 값은 화면에 영향을 주지 않는다. 교과서의 `build-canvas.work-08.study.v2` 키와 이어 읽기 형식은 기존과 같다.

## 콘텐츠와 수치 검토

- 이야기의 기존 Hero, 4막 순서, ACT 04 엔딩 본문과 마지막 문장을 유지했다. 직관 본문을 기본으로 남기고 수학과 모드의 버튼, M 키, 저장 상태, 이벤트, 스타일과 숨겨진 분기를 제거했다.
- V1 파동의 검은 계단과 잔차에는 오른쪽 연속 ψ를 사용한다. 명시적 공식의 극한은 점프에서 좌우 평균 ψ₀를 준다. 유한 절단은 모든 지점에서 오차를 단조롭게 줄인다고 가정하지 않는다. ACT 02의 파동 실험은 x=2–100을 보여 주며 σ 이동은 고정된 영점 높이를 사용하는 가상 모형이다.
- V1의 영점 높이 60개를 교과서에서 사용한 고정밀 참조값에 맞췄다. V2 수치 엔진의 범위는 기존의 −2≤Re(s)≤3, |Im(s)|≤80이다. 이 범위 밖의 영점 높이는 참조 데이터로 제공한다.
- 기존 수학과 모드의 설명을 5–11장과 대조했다. 소수 역수 합, 리만의 계단과 현대 ψ의 가중치 차이, 점프 근처 유한 합, 무조건부 오차와 RH 아래 짧은 구간의 소수 존재, Lean의 정의적 동등성은 해당 장에 짧게 보강했다. 리만의 독일어 인용과 원문 링크는 12장에 연결했다.
- V1 Mini Lean은 전술별 상태를 보여 주는 교육용 시뮬레이션으로 표시했다. V2는 기존 Lean 실행 기록의 성공 및 실패 상태를 재생하고 Proof Explorer에서 최초 공개본, 단축본과 후속 판본의 검증 근거를 제공한다.

## 검증 기록

| 범위 | 결과 |
| --- | --- |
| 저장소 | `npm run lint` 오류 0건, 기존 경고 14건. `npm test` 29개 통과. `npm run build:pages` 통과 |
| V1 | 320·390·768·1024·1440·1920px에서 자체 검사, 4막과 테마 전환, 관찰 노트 4단계, 파동·복소평면, Mini Lean 실행 흐름, 링크, 단축키 검증 |
| V2 | 같은 6개 화면 폭에서 각 장과 실험 25개 로딩, 가로 넘침 및 콘솔·요청 오류 검사. 390px에서 해설 52개 토글과 실험 전체화면을 조작 |
| 수치 | V2 Node 테스트 파일 3개 통과. 고정밀 비교에서 제타 480점, 영점 높이 60개, 명시적 공식 20개, 계량 함수 10개 통과 |
| 탐색 | 이전 주소 14개, 9장 쿼리와 해시, JS를 끈 경우의 이동 링크, 기존 학습 기록, 직접 접근, 새로고침, 이전·다음 기록, 이야기와 교과서의 왕복 검증 |
| Pages 산출물 | Work 08 HTML 30개, 내부 링크·앵커·정적 파일, canonical·사이트맵 검사. 포트폴리오 홈과 Work 1–7의 경로를 직접 열어 확인 |

재현에 사용하는 도구는 Python Playwright, Chromium, Pillow 및 수치 검사용 mpmath와 SymPy다.

```sh
npm run lint
npm test
npm run build:pages
node --test riemann-lean/v2/tests/*.test.mjs
python riemann-lean/v2/tests/check-core-oracle.py
python docs/riemann-lean/textbook-v2/reference/check-zeta.py
python docs/riemann-lean/textbook-v2/reference/check-browser.py --story-only --output=/tmp/work08-story
python docs/riemann-lean/textbook-v2/reference/check-browser.py --output=/tmp/work08-textbook
```

브라우저 검수는 Chromium에서 수행했다. 기본 검수에서는 클라우드 Chromium의 인증서 신뢰 설정으로 외부 글꼴 일부가 대체 글꼴로 렌더링됐다. 캡처를 다시 수행할 때는 작업 환경의 인증서를 신뢰하는 HTTPS 클라이언트로 기존 글꼴 응답을 받아 사용했다. Lean 검수 범위는 기존 실행 기록의 재생과 출처 확인이다. 전체 증명 아카이브는 외부 검증 기록을 참조하며, 이번 작업에서는 다시 컴파일하지 않았다.

## 실제 화면

1440px Chromium 캡처다. 이야기의 Hero와 ACT 04 섹션 마크업은 V1 기준본과 일치하며, 390px와 1440px에서 변경 전후 화면도 비교했다.

[V1 Hero](integration-evidence/story-hero.webp) · [ACT 04 엔딩](integration-evidence/story-ending.webp) · [교과서 연결부](integration-evidence/story-textbook-link.webp) · [V2 교과서 첫 화면](integration-evidence/textbook-home.webp)
