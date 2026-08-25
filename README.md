# build _ canvas

생각, 그림, 개발, 기록.

개인 바이브 코딩 결과물을 한곳에 모아 GitHub Pages로 배포하는 포트폴리오입니다.

## Projects

- **ORCA** — 월드 모델과 ORCA 논문을 설명하는 인터랙티브 프레젠테이션
- **Texas Trace** — Austin과 Houston의 여정을 따라가는 인터랙티브 지도

## Structure

```text
app/                    # 엔트리 페이지
projects/orca/          # ORCA 소스
projects/texas-trace/   # Texas Trace 정적 소스
scripts/build-pages.sh  # 통합 Pages 빌드
.github/workflows/      # GitHub Pages 배포
```

## Add a project

1. `projects/<slug>/` 아래에 새 프로젝트를 추가합니다.
2. `app/page.tsx`의 `works` 배열 맨 위에 목록을 추가하고, 기존 최댓값 다음 번호를 부여합니다. 최신 작업이 항상 위에 표시됩니다.
3. `scripts/build-pages.sh`에서 결과물을 `dist-pages/<slug>/`로 복사합니다.

이미지는 긴 변 1,280px 이하의 WebP를 기본으로 사용하고, 대표 이미지는 가능하면
한 장당 220KB 안쪽으로 유지합니다.

## Local build

```bash
npm ci
chmod +x scripts/*.sh projects/orca/scripts/*.sh
npm run build:pages
```

통합 결과물은 `dist-pages/`에 생성됩니다.
