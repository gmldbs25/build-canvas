# LLM to AGENT

다음 Token 예측부터 실제 개발 Environment와 연결되는 Coding Agent까지를 설명하는 22개 Scene의 Web-native learning experience입니다.

## Experience

- Intro + ACT 1–5 + Appendix, 총 22개 화면
- `ArrowLeft` / `ArrowRight` 및 화면 우측 하단 탐색
- Scene별 기술 원고를 담은 오른쪽 `Details` overlay
- Details가 열리면 Presentation motion pause
- `Failure Is Context`의 `FAIL / PASS` 비교
- `Same Model, Different Agent`의 `MINIMAL / FULL` 비교
- Desktop presentation target: 1280×720, 1440×900, 1920×1080

## Docker development

```bash
docker compose up --build
```

Local URL: `http://localhost:5173/`

## Verification

```bash
npm run lint
npm run build:pages
npm test
```

GitHub Pages 통합 경로는 `/build-canvas/transformer-to-agent/`입니다.
