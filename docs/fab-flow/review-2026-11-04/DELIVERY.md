# Work 6 redesign delivery

## Result

Preserved 3 Parts / chapters 00–10, the green/cream miniature editorial language, normal scrolling, React/Vite and the existing Pages URL. No home or Work 1–5 source changes; FAB FLOW source remains unchanged.

- Desktop Hero moves the authentic factory capture from below the oversized masthead into the first screen beside compact copy and CTA. Mobile retains title → introduction → CTA → image.
- Reviewed all chapter copy in two editorial passes, then performed rendered reviews and corrections. Fixed an implicit CSS grid column that initially made the Hero too narrow, corrected network arrows, removed redundant notes, increased captions, and repaired measured contrast failures.
- Added source-based architecture, transport sequence, OHT state machine, DBR/CBR route comparison, admission/wait examples and a Tick/publication pipeline. Main diagrams stay visible; implementation detail uses native disclosures.
- Explained default delay costs, legal-route dispatch, reroute conditions, request versus OHT phases, storage ownership, snapshot versus replay, wall-clock versus simulation time and rendering/publication boundaries. Added historical p95 with bounded performance claims and retained the Small8 regression.
- Added responsive WebP delivery for all 12 existing screenshots, retaining PNG originals in the zoom viewer. Lossless originals were checked for pixel equality. See `media-audit.json` and the capture manifest for metadata; unknown Seed/time/deployment SHA are explicitly recorded.
- Restored focus and scroll after image viewing, locked background scrolling, guarded H while the modal is open, and retained source-app/home links.

## Media decision

No new live screenshots or video were captured in this environment. Existing source captures are November 3, with Hero 2560×1440 and other captures 3600px wide. Full-resolution lossless WebP totals 5,940,406 bytes versus original PNG 12,013,289 bytes; smaller previews serve ordinary reading.

The previous QHD video was actually decoded and visually reviewed: most of its eight seconds contain a small upper-left app view and gray remainder; 232/239 frame pairs are nearly static at the audit threshold. It does not meet the visual/motion bar. Re-encoding cannot repair missing detail; static Hero retained. See `REDESIGN_REVIEW.md` and the frame contact sheet. New filming and remote interactive verification remain blocked by explicit source-domain network policy. No fake or reconstructed gameplay was made.

## Validation

- Work 6 TypeScript and production build: passed.
- Full `npm run build:pages`: passed, including existing home/other Works and stable Work6 path.
- `npm test`: 7/7 passed.
- `npm run lint`: no errors; 7 warnings (3 Next image recommendations in the standalone Vite article, 4 existing warnings in other Works).
- Chromium 151 browser smoke: 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 844×390, 390×844, 360×740, 320×720. Passed 11 chapters, images, source links, keyboard disclosure, original-size viewing, ESC, focus/scroll restoration, above-fold CTA and page overflow checks.
- Mobile touch, Reduced Motion, typing H guard and modal H guard: passed.
- axe WCAG 2 A/AA and 2.1 AA: 0 violations at 1440px and 390px, both default and all-disclosures-expanded states. Automated checks do not certify every accessibility requirement.
- Local cold-context initial viewport CLS: 0 at both measured widths. No Lighthouse or real-user score is claimed. Local unthrottled measurements are not a remote loading guarantee.
- Original and redesigned desktop/mobile screenshots were inspected in multiple passes. Selected before/after Hero images are in `screenshots/`; complete viewport screenshots are produced by browser smoke/CI artifacts.

## Remaining limits

- Fresh deployment captures, a new continuous real-game recording, a distinct new ending camera and exact deployed source parity were not obtained. Original screenshots are reused and honestly dated.
- The runtime cannot directly reach the two production domains: CONNECT returns policy 403. Available tools do not provide a supported allowlist update. No access-policy bypass was attempted.
- Production Pages response and live browser interaction must be distinguished from GitHub Actions deployment status. The final response records exact commit/workflow outcomes; successful local tests alone do not establish live verification.
- Engine performance values come from historical project reports, not new engine benchmarks or FPS measurements. The original game's known performance/liveness issues were not modified.

## Git and release

Work is based on remote main `a2ceb263557d4fa589110069f16d59c76b44081b`. Engine evidence was independently checked against remote `7cfb6c58073a80df5c3d310c6ce9584679edc277`. Changes are committed in bounded media and article units, followed by normal direct main push without history rewriting. Exact delivered commit and Actions run links are recorded in the final task report.
