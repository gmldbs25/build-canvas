# FROM TRANSFORMER TO AGENT SYSTEMS

Transformer 기반 LLM의 예측이 Tool Request, Agent Runtime, 실제 실행과 Feedback Loop로 이어지는 과정을 설명하는 인터랙티브 웹 자료입니다.

## First release

- Opening
- Prologue: Production 500 incident
- Core Question: Model vs. Agent System
- From Classification to Language
- Next-token Prediction
- Appendix / Visual Reading

Presentation과 Article은 동일한 Page·Beat 상태를 공유하며, URL query에 `mode`, `page`, `beat`를 기록합니다.

## Build

```bash
npm run install:ci
npm run build:pages
```

GitHub Pages 통합 경로는 `/build-canvas/transformer-to-agent/`입니다.
