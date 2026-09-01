# LLM to AGENT

다음 Token 예측부터 실제 개발 Environment와 연결되는 Coding Agent까지를 설명하는 19개 Scene의 Web-native learning experience입니다.

## Experience

- Intro + ACT 1–5 + Appendix, 총 19개 화면 (`00`, `01–16`, `19`, `A1`)
- `ArrowLeft` / `ArrowRight` 및 화면 우측 하단 탐색
- `O` — ACT별로 묶인 전체 Scene 목차 overlay
- `D` — Scene별 기술 원고를 담은 오른쪽 `Details` overlay
- `H` — Build Canvas 홈
- Details 또는 목차가 열리면 Presentation motion pause
- 좌측 상단 ACT rail과 좌측 하단 `N / 19`로 현재 위치 표시
- Model Request와 외부 Execution의 분리, Result에서 다음 Model Context로 이어지는 흐름
- 실제 NPE Run의 `PATCH → TEST → FEEDBACK → REVISE → COMPLETE` Storytelling
- Desktop presentation target: 1280×720, 1440×900, 1920×1080

## Local development

Docker preview는 저장소 루트의 단일 Compose 구성으로 통합되어 있습니다.

Local URL: `http://localhost:4173/build-canvas/transformer-to-agent/`

## Verification

```bash
npm run lint
npm run build:pages
npm test
```

GitHub Pages 통합 경로는 `/build-canvas/transformer-to-agent/`입니다.
