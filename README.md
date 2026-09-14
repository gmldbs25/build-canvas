# build _ canvas

생각, 그림, 개발, 기록.

개인 바이브 코딩 결과물을 한곳에 모아 GitHub Pages로 배포하는 인터랙티브 포트폴리오입니다.

## Works

- **Work 4 — 컴퓨터가 데이터를 기억하는 방식**: SSD부터 NAND Cell까지 탐험하고 FTL·GC·ECC를 직접 조작하는 인터랙티브 자료
- **Work 3 — FROM TRANSFORMER TO AGENT SYSTEMS**: LLM의 예측이 Agent Runtime의 실제 행동으로 이어지는 과정을 설명하는 인터랙티브 자료
- **Work 2 — ORCA**: 월드 모델과 ORCA를 설명하는 인터랙티브 프레젠테이션
- **Work 1 — Texas Trace**: Austin과 Houston의 여정을 따라가는 인터랙티브 지도

## Repository Structure

```text
app/                           # Build Canvas 홈
projects/                      # 각 Work의 실제 소스
  nand-flash/                  # Work 4
  transformer-to-agent/        # Work 3
  orca/                        # Work 2
  texas-trace/                 # Work 1
docs/                          # Work별 설계·콘텐츠 문서
scripts/                       # 개발·검증·GitHub Pages 빌드 스크립트
tests/                         # 저장소 단위 테스트
.github/workflows/             # GitHub Actions / Pages 배포
AGENTS.md                      # Codex 에이전트 운영·위임 규칙
README.md                      # 프로젝트 개요·구조·공통 개발 규칙
```

## Repository Conventions

새 Work를 추가할 때는 다음 규칙을 따릅니다.

1. `projects/<slug>/` 아래에 새 프로젝트를 추가합니다.
2. `app/page.tsx`의 `works` 배열 맨 위에 목록을 추가하고, 기존 최댓값 다음 번호를 부여합니다. 최신 작업이 항상 위에 표시됩니다.
3. `scripts/build-pages.sh`에서 결과물이 `dist-pages/<slug>/`로 포함되도록 합니다.
4. 모든 Work는 `H` 키 입력 시 Build Canvas 홈으로 돌아갈 수 있어야 합니다. 단, `input`, `textarea`, `contenteditable` 등 사용자가 텍스트를 입력 중일 때는 동작하지 않아야 합니다.
5. 이미지는 긴 변 1,280px 이하의 WebP를 기본으로 사용하고, 대표 이미지는 가능하면 한 장당 220KB 안쪽으로 유지합니다.

특정 Work에만 필요한 디자인·콘텐츠·인터랙션 규칙은 `docs/<work>/` 아래에 기록합니다. Work 전용 규칙은 명시적으로 공통 규칙으로 승격하지 않는 한 다른 Work에 자동으로 적용하지 않습니다.

## Local Development

Node.js `22.13.0` 이상을 사용합니다.

```bash
npm ci
npm run dev
```

Docker로 GitHub Pages와 가까운 통합 프리뷰를 실행하려면:

```bash
docker compose up --build
```

기본 통합 프리뷰 경로:

```text
http://localhost:4173/build-canvas/
```

## Verification & Build

주요 저장소 명령은 다음과 같습니다.

```bash
npm run lint
npm test
npm run build:pages
```

`npm run build:pages`의 통합 결과물은 `dist-pages/`에 생성됩니다.

## Deployment

GitHub Pages 배포 자동화는 `.github/workflows/`에서 관리합니다.

새 Work를 추가하거나 기존 Work의 빌드 방식을 변경할 때는 로컬 통합 빌드뿐 아니라 Pages 배포 경로도 함께 확인합니다.

## Documentation Roles

- `README.md`: 프로젝트를 이해하고 실행·확장하기 위한 사람 중심의 저장소 가이드
- `AGENTS.md`: Codex가 저장소에서 작업할 때 따르는 역할 분담, 위임, Git 안전 규칙
- `docs/<work>/`: 개별 Work의 설계, 콘텐츠, UX 및 구현 의도

Codex 작업 지침은 `AGENTS.md`를 따르되, 실제 프로젝트 구조와 공통 개발 규칙의 기준은 이 `README.md`입니다.
