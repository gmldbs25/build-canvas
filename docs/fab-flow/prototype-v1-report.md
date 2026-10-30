# Work6 — 대표 3장면 실시간 3D 프로토타입 결과

> 기준일 2026-10-30 · 상태: **3장면 프로토타입 구축/정적 배포 확인**, 전체 11장면 미구현, 사용자 시각 승인 미수신.

## 소스와 배포

- Build Canvas: `gmldbs25/build-canvas`.
- 구현: `projects/fab-flow/` (독립 React/TypeScript/Vite 정적 사이트).
- **배포: `https://gmldbs25.github.io/build-canvas/fab-flow-preview/`** (GitHub Pages 배포 워크플로우 성공). 포트폴리오 홈의 Work6 목록에는 아직 등록하지 않음.
- 실제 FAB FLOW Native/3D 소스 원본: `gmldbs25/fab_flow`의 **`3e11f55d14a8fefea5a93f2e82389110e1961d2d`**에 고정.
- 원본 그대로 복사한 모듈: `src/sim/*`의 엔진·데이터·경로·모션 관련 필수 파일, `src/components/ThreeFacilityScene.tsx`, `FacilityScene.tsx`, `FacilityAssets.tsx`, 경로/주석/카메라·호환 모듈, 원본 `src/app/tycoon.css`. React Three.js 모델과 상태 로직을 재작성하지 않음.
- Work6 전용 코드: `src/work6.tsx`, `src/work6.css`, Vite 설정·프로토타입 검증 스크립트.

## 구현한 것 (완성 11장면 아님)

1. **Scene 03 — 한 건의 운송**: FAB FLOW 원본 Native `Engine`과 `TutorialCommandLayer`를 사용한 실제 단계별 요청·배차·빈 차량 이동·픽업·경로 탐색·적재 운송·하역 명령. 원본 `ThreeFacilityScene` 렌더러. 프로토타입에서는 Large V6 맵과 원본 엔진을 사용하는 실험 시나리오이며, 원본 `createTutorialWorld`의 Small 맵과는 별도로 설정한 Work6 전용 시드다. 실제 최종 여정까지의 브라우저 검증은 아직 남음.
2. **Scene 04 — 보이지 않던 전체**: 동일 Native 3D 시설을 원본 카메라 명령 `follow/bay/overview`로 전환. 전체 규모는 Large V6 교육용 가상 시설이지 삼성 평택의 내부 재현이 아님.
3. **Scene 06 — MCS의 판단**: 원본 엔진의 `inspectDecision`/route candidate를 실제 directed rail 위에 오버레이. 해당 운송에서 실제 결정이 나오기 전에는 데이터를 창작하지 않고 운송 Scene으로 안내.
4. **공통**: 좌우 방향키/버튼, H 홈, 관찰형 짧은 본문, 원본 렌더러 카메라 조작, Work6만의 편집형 UI. 정식 홈 Works 목록에는 미노출.

## 검증 증거

- 독립 Work6 Github Actions: [Work6 3D prototype validation](https://github.com/gmldbs25/build-canvas/actions/runs/41025901983) **PASS**.
- GitHub Pages: [Deploy to GitHub Pages](https://github.com/gmldbs25/build-canvas/actions/runs/41025902053) **빌드/배포 PASS**, 기준 SHA `8cbed44e4fb0b23b4ffd47f6c43987cefecf4f11`.
- TypeScript 검사 PASS; Vite 정적 빌드 PASS, 경로 `/build-canvas/fab-flow-preview/`로 실제 배포와 동일하게 테스트.
- Headless Chromium/SwiftShader, 1440×900 + 390×844: 실제 WebGL 캔버스 표시, Native 운송 요청 버튼을 눌렀을 때 Native Tick 0→1 증가, Scene03→04→06 장면 전환, 두 화면에서 page JS/console error 0.
- 스크린샷 아티팩트는 위 독립 Work6 CI의 `work6-browser-evidence`에 보관 (GitHub Actions 아티팩트).
- 별도의 검색/페이지 열람 도구로 외부 GitHub Pages URL 자체를 다시 열지는 못했다. **배포 파이프라인 성공과 브라우저 CI 통과는 확인했지만 원격 단말 실제 시각 승인은 주장하지 않음.**

## 남은 문제/작업

- 실제 원본 렌더러의 OHT/FOUP 인계 **전체 여정 request→dropoff**를 브라우저에서 끝까지 따라가며 영상/좌표/상태·시각적 품질 확인. 현재 자동 검증은 transport request 첫 Native tick까지.
- Scene04의 시네마틱 줌아웃 구성, Scene06의 경로 설명·다중 후보 시각화를 실제 화면으로 보고 반복 개선.
- 원본 `ThreeFacilityScene`과 다른 FAB FLOW 모듈을 소스 복사로 분리했기 때문에, 이후 업스트림을 최신화할 때는 **원본 SHA/사본 diff/fixture**를 함께 검증. 임의 수정하거나 모듈을 가짜 경량 재구현으로 바꾸지 않는다.
- 카메라·Scene 전환 시 현재 Native 상태를 어떻게 유지하고 되돌릴지 결정. 실시간 애니메이션 Tick과 React 리렌더 성능, Low-End 모바일 검증.
- 완성형 디자인 11개 Scene의 본문·인터랙션은 추가 개발. 검증된 3장면이 나머지 8장면의 완성/승인을 의미하지 않음.
- 구현 시 원본 FAB FLOW 레포를 직접 수정하지 않았음. Build Canvas 원래 Work1~5 홈 등록/소스는 변경하지 않았고 빌드 스크립트에 미리보기 출력만 추가함.

## 다음 단계 권장

1. 사용자가 위 배포본에서 데스크톱/모바일 구도, OHT 상세 품질, 애니메이션, 카메라 이동을 육안으로 검토.
2. 도출된 3장면 폴리시와 실데이터 결함을 수정한 뒤 Work6 본편(나머지 8장면) 확장.
3. 본편 완성·검증 후 사용자 승인 하에 Work6를 Build Canvas 홈 Works 목록 06번으로 공개.
