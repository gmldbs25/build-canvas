# Work 6 architecture deepening · delivery record

## Implemented

- Kept the three Parts and eleven chapters and placed the new views in chapters 06–09.
- Added source-based module/interface and state-relation diagrams, a Tick-level transport execution table, route-planning/admission separation, and distinct snapshot/restore, Replay and UI publication paths. See `ARCHITECTURE_2_REVIEW.md` for the traceability matrix and review corrections.
- Added five ADR summaries in the article and full context in `docs/fab-flow/ARCHITECTURE_DECISIONS.md`. Current implementation observations, inferred design rationales, and historical decisions are identified separately.
- Added an eight-attribute quality evidence table. Historical performance results remain labeled by their original report and workload; no new engine, GPU or real-factory benchmark is claimed.
- FAB FLOW source remains unchanged at `7cfb6c58073a80df5c3d310c6ce9584679edc277`.

## Validation

- `npm run lint`: passed with no errors and 7 repository warnings (3 existing standalone article `<img>` recommendations; 4 warnings in other Works).
- `npm test`: passed across all 3 test files (7 test cases).
- `npm run build:pages`: passed, including the home, existing Works and Work 6 TypeScript check and production Vite build.
- `npm run typecheck --prefix projects/fab-flow` and `npm run build --prefix projects/fab-flow`: passed.
- Built artifact route smoke: served `dist-pages` with the Pages project-base alias and fetched `/build-canvas/fab-flow-preview/`, its JavaScript and CSS assets; all returned HTTP 200.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser --prefix projects/fab-flow`: passed the production Pages artifact at nine widths (1920, 1440, 1366, 1024, 844, 768, 390, 360, 320); eleven chapters, image/lightbox focus and scroll restoration, H shortcut, touch, reduced motion, no console errors or document overflow. Captured full-page smoke screenshots are retained outside the repository in `/workspace/scratch/final-browser-evidence/`.
- Local Playwright/Chromium browser round one at 1440×900, 390×844 and 320×844: eleven chapters present, no horizontal document overflow, no console or network errors. axe WCAG 2 A/AA and 2.1 AA reported zero violations at those widths with disclosures collapsed and expanded.
- Final browser/axe round repeated all three widths and disclosure states after visual corrections: zero violations, errors or document overflow; all eleven chapters remained present. SVG text bounds stayed inside their viewBoxes. On mobile, keyboard focus plus ArrowRight moved the diagram scroller. The JSON report and representative closeups are in `screenshots/architecture-2/`.

## Limits and release state

- Production Pages and FAB FLOW game URLs returned CONNECT 403 under the available network policy. No bypass was attempted. Local build and browser results do not establish deployed content parity or live production interaction.
- No new FAB FLOW screenshot, simulation benchmark, or gameplay video was captured. Historical screenshots and performance figures retain their original dates and test conditions.
- Direct main push completed as commit `b86133dae48070ffa55322f3bb73b0b4a7132d5b`; a post-push fetch confirmed `origin/main` points to that exact SHA.
- GitHub Actions run status could not be retrieved: GitHub combined status had no reported status checks, and `gh run list` returned HTTP 403 from the Actions API. The Pages and game host requests also returned the environment's CONNECT 403. The direct push is confirmed; successful production deployment and remote interaction remain unverified.
