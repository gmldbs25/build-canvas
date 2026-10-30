# Work6 — FAB FLOW Runtime Reuse Contract

> Status: PLANNING · implementation acceptance contract · 2026-10-30
>
> 이 계약은 `work6-master-plan.md`의 필수 구현 규칙을 구체화한다. 현재 시점에 통합 완료·실행 검증이 되었다는 의미는 아니다.

## 핵심 원칙

**Work6에는 FAB FLOW와 닮은 가짜 OHT를 새로 만드는 것이 아니라, 기존 FAB FLOW에서 사용 중인 모델·장면·운송 상태·모션 계산을 그대로 활용해 실제로 움직이는 콘텐츠를 만든다.**

### 반드시 동일한 원본을 사용할 것
- OHT 차체, 램프/윈도우, 운반 FOUP, 장비, Port, Floor, Rail의 실제 Three.js Geometry/Materials 및 시각적 관계.
- 레일의 canonical Path, Heading/Curve, OHT 위치/보간, 픽업/적재/하역 상태 전환과 FOUP 소유권.
- 필요한 장면에서는 Native Engine의 실제 0.5초 Tick, MCS 배차/경로 의사결정, Tutorial 명령 흐름.
- Close/Follow/Bay/Whole 등의 카메라 동작도 원본 구현을 우선 재사용하고 Work6 고유 연출은 별도 제어 계층으로 한정한다.

### 금지
- SVG/CSS 원·사각형이나 매우 단순한 새 3D 박스를 실제 OHT·FOUP·장비 애니메이션의 대체물로 사용.
- 기존 FAB FLOW 모델과 동작이 다른 독립 제작 OHT/레일 시뮬레이터.
- 네이티브 엔진 없이 사전에 정한 동작을 실제 계산 결과인 것처럼 표현.
- 녹화 영상을 기본 구현으로 대체하는 편법.
- Work6 요구와 무관하게 FAB FLOW 전체 제품 UI를 통째로 이식하고 그 위에 설명문을 붙이기.
- 실제 공개 자료에 없는 삼성 평택 내부 레일 설계/실제 운용 수치의 단정.

### 허용
- 관람자에게 실제 상태를 읽기 쉽게 만드는 2D 제목/설명/버튼/주석/정적인 개념도/운영 그래프.
- 엔진 정지 상태의 실제 Three.js 모델을 보며 구성 요소를 관찰하는 Scene.
- 기존 카메라/모션 데이터 위에 Work6의 스토리 목적에 맞는 UI 연출·강조·타이밍 제어를 추가.
- 교육용 가상 레이아웃과 현실 규모를 구분해 설명하는 단순한 개념적 확대도.

## 실제 코드 확인에 근거한 재사용 후보

Source repository: `gmldbs25/fab_flow` (후속 개발 시작 시 기준 커밋 확정).

| 역할 | 기존 구현 |
|---|---|
| 기존 단층 3D | `src/components/ThreeFacilityScene.tsx` |
| 다층 3D (개발 중) | `src/components/MultiLargeFacilityScene.tsx` |
| 정확한 이동/위치 | `src/sim/motion.ts`, `src/sim/geometry.ts` |
| 엔진·MCS | `src/sim/engine.ts` |
| 튜토리얼 연속 명령 | `src/sim/tutorial.ts` |
| 카메라 프레이밍/제어 | `src/components/fabCamera.ts` |
| 애플리케이션 연결 참고 | `src/components/FabFlow.tsx` |

이는 현재 저장소에서 확인한 **후보 경계**이며, 모듈을 그대로 복사·import해서 컴파일되는지 또는 재사용 가능한 인터페이스로 분리해야 하는지는 기술 Spike로 검증할 사항이다. Next.js/React/경로 alias/CSS/Three.js/정적 빌드 의존성을 반드시 조사한다.

## Work6 아키텍처 책임 경계

### Work6: Narrative / Presentation
- 4 chapters, 11 scenes, 진행/복귀/재생/질문/설명/팝오버/CTA.
- 명시적인 시퀀스 명령으로 **실제 FAB FLOW runtime**의 입력·카메라 상태를 제어한다.
- FAB FLOW renderer 자체를 독립적으로 새로 작성하지 않는다.

### Reused FAB FLOW: Domain / Native Runtime
- 실제 Transport Request, MCS, Engine Tick, Vehicle/FOUP의 lifecycle.
- 시나리오의 Seed, Request/Vehicle 식별자, 재현성.
- Scene의 시각적 요구를 위해 엔진 상태를 위조하거나 운송 규칙을 바꾸지 않는다.

### Reused FAB FLOW: Three.js World
- 실제 모델·조명·레일·카메라/LOD·OHT/FOUP 모션.
- 해당 Scene에 필요한 상태를 표현하고 장면 전환 시 리소스를 적절히 정리한다.
- Reduced Motion은 화면 보간을 줄일 수 있지만, 네이티브 상태를 임의로 건너뛰거나 바꾸지 않는다.

## Scene별 의존성

| Scene | 필요 기능 |
|---:|---|
| 01 | 실제 OHT/FOUP 모델, 주행, 근접 Follow |
| 02 | 원본 장비·Port·FOUP 정적 관찰/강조 |
| 03 | `TutorialCommandLayer` + Engine + 실제 픽업/적재 운송/하역 3D |
| 04 | 원본 Whole/Bay/Follow 카메라 프레이밍 + 실제 시설 |
| 05 | 실제 directed Graph/경로 표시 |
| 06 | 실제 MCS 배차·경로 선택 결과 + 동기화된 하이라이트 |
| 07 | 실제 점유·대기/장애와 차량 정지 |
| 08 | 실제 KPI/분석 수치 |
| 09 | 실제 네이티브 비교·동일 입력 조건 결과 (비교 모델의 한계 표시) |
| 10 | 실제 Tick·Engine/Renderer 관계를 보여주는 교육용 뷰 |
| 11 | 배포 확인된 실제 FAB FLOW 웹앱 진입 |

## 필수 Proof of Concept / 수용 기준

1. **Scene 03**: 녹화 재생이 아닌 실제 엔진/원본 렌더러로 FOUP의 단일 소유권과 운송 단계 전환을 재현.
2. **Scene 04**: OHT의 실물 3D Follow→Bay→Full Facility 전환. 장면/카메라가 원본 세계와 일치하며 하드 컷/리셋으로 위장하지 않음.
3. **Scene 06**: 실제 Engine Decision 데이터에서 경로를 선택하고 **동일한 레일** 위에 표시. 데모용 가짜 경로 금지.
4. **코드 출처 검증**: 원본 파일·버전/기준 SHA 및 재사용한 로직·수정 범위를 기록. 가능한 범위에서 원본과 좌표·상태 및 픽업/하역 과정의 일치 검사.
5. **배포 제약 확인**: Build Canvas의 GitHub Pages 정적 결과물에서 DOM/Three.js/자산 경로·압축/초기화가 정상이어야 함. 런타임 별도 서버 의존성 도입은 설계 검토 대상.
6. **UX/성능**: 1440×900, 1366×768, 모바일 가로/세로에서 객체와 문구 가독성, 실제 런타임 진행, Pause, 시야 전환, 홈 단축키, 터치, Reduced Motion 검증.
7. **기존 프로젝트 불변**: Work1~5 회귀 없을 것. FAB FLOW 원본 별도 수정은 필요성과 영향을 명시하고 사전 결정.

## 구현 시작 전 미결정

- 사용 가능한 실제 모듈 경계와 코드 공유 방식 (원본에서 재사용 인터페이스 추출, 버전 고정 소스 동기화 등).
- 시나리오/Scene 복귀·상태 복원 전략과 성능상 필요한 동적 로딩 전략.
- 멀티레이어 레퍼런스 화면을 본편에 포함할 조건.
- FAB FLOW 공식 Vercel 진입 URL과 최종 화면 시각 승인.
- 실사용기기/브라우저 검증 범위 및 별도 GitHub Pages 배포 승인 시점.
