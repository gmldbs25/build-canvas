# World Models × ORCA

소프트웨어 개발자가 월드 모델의 필요성과 ORCA의 Next-State Prediction을
직관적으로 이해할 수 있도록 만든 인터랙티브 웹 프레젠테이션입니다.

## Live

- GitHub Pages: <https://gmldbs25.github.io/world-model-orca/>
- ChatGPT Sites: <https://world-model-orca.gmldbs25.chatgpt.site>

## Interaction

- `←` / `→`: 슬라이드 이동
- `N`: 발표자 노트 열기
- 화면 하단의 점: 원하는 슬라이드로 바로 이동
- 모바일: 좌우 스와이프

## Local development

Node.js 22.13 이상과 Linux 환경이 필요합니다.

```bash
npm ci
npm run dev
```

## Build

```bash
# ChatGPT Sites용 Worker 빌드
npm run build

# GitHub Pages용 정적 빌드
npm run build:pages
```

`main` 브랜치에 변경이 반영되면 GitHub Actions가 `dist-pages` 산출물을
GitHub Pages에 자동으로 배포합니다.

## Primary sources

- [ORCA project](https://orca-wm.github.io/)
- [ORCA paper on arXiv](https://arxiv.org/abs/2606.30534)
