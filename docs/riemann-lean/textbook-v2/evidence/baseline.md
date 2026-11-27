# Work 08 baseline record

Captured for the local `work8-textbook-v2` branch on 2026-11-27 before any Work 08 source edits.

## Git state

- `origin/main`: `5450fa5fb8ef86a8009828eb669342c21c860a3b` (`fix(work8): explain the logarithmic staircase and pace the film`)
- Preparation source: `origin/work8-textbook-preparation` at `514619e969b16855959c4718d86f9734ba1a0e01`
- Local branch: `work8-textbook-v2`, created from `origin/main`
- Preparation import: only `docs/riemann-lean/textbook-v2/` (nine files)
- Work 08 source files remain unchanged from `origin/main`.

## Existing implementation and deployment

- Work 08 source root is `riemann-lean/` (not `projects/riemann-lean/`).
- The page is a single static `index.html` with four acts: `#act1` through `#act4`. The existing navigation exposes the four acts, and the site path is `/build-canvas/riemann-lean/`.
- JavaScript is dependency-free browser ES modules. `main.js` imports `data.js`, `psi.js`, `lean.js`, and `experience.js`; `experience.js` imports `data.js` and `psi.js`.
- Styles are split across `style.css`, `paper.css`, `terminal.css`, and `experience.css`. The page also references a local favicon and three remote font stylesheets (Pretendard, JetBrains Mono, and Noto Serif KR).
- `scripts/build-pages.sh` copies the 11 files in the Work 08 source root and `share/work-08.png` into `dist-pages/riemann-lean/` and `dist-pages/share/` respectively.
- No Work 08 source package or dedicated dependency manifest exists. The repository root uses Node `>=22.13.0`; the observed runtime is Node `v24.22.3`, npm `11.19.1`.
- Root `node_modules/` is absent in this checkout.

## Screenshot capture attempt

The available `/usr/bin/chromium` cannot start in this sandbox. Both direct headless Chromium and the installed Playwright Python package failed before page rendering with `setsockopt: Operation not permitted` from Crashpad; Chromium exited with SIGTRAP. A local HTTP server also could not bind to loopback (`PermissionError: [Errno 1] Operation not permitted`). Consequently, no desktop or mobile screenshot was produced. Re-capture the baseline when a browser environment with Chromium process/socket support is available, before changing `riemann-lean/`.
