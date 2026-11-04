# FAB FLOW Work6 polish report — 2026-11-04

## Scope

Updated the existing three-part, eleven-chapter article in `projects/fab-flow/src/work6.tsx`, its stylesheet, and `projects/fab-flow/scripts/browser-smoke.mjs`. Existing app screenshots and technical caveats remain the evidence base. Added media references match the concurrently generated WebP set; PNG originals remain the image-viewer source.

## Korean editorial pass 1 — reading order and voice

- Reworked chapter leads to state each reader question in plain Korean and make the transition from transport basics (01–02), user choices and observation (03–05), and implementation (06–09) more direct.
- Replaced abstract or repetitive phrases with concrete actions: requests arrive, an empty OHT travels to a Port, it loads a FOUP, then delivers it.
- Tightened the closing invitation so it follows the engineering story and leads naturally to play.

## Korean editorial pass 2 — technical precision and scope

- Kept the warning that high fleet counts do not guarantee slower operations and that the congestion image is not a controlled A/B comparison.
- Clarified that a route calculation does not itself authorize movement; occupancy, reservation, and waiting still matter.
- Kept simulation Tick time distinct from browser rendering time, and retained the distinction between observed analysis and matched policy experiments.
- Preserved the educational-simulation scope, historical benchmark labels, and regression caveat. No new performance or live-deployment claims were added.

## Hero, responsive media, and viewer

- Rebalanced desktop Hero into a compact title/CTA column beside the genuine factory still, bringing the image into the first viewport. At widths up to 900px the title, CTA, and image return to a single column.
- Added responsive WebP `src`/`srcSet` references for article figures and the Hero. Full PNG originals remain linked inside the modal for inspection.
- Raised mobile figure captions to 14px, used a Korean-capable sans face, and improved line spacing for source notes.
- On modal open, record the triggering element and page scroll. On Escape, close button, or backdrop close, restore focus and scroll position.

## Browser smoke updates

- Added checks for the generated WebP assets, responsive Hero source, and responsive figure source.
- Added 1920, 1024, and 768 viewport sizes to the existing matrix.
- Allow `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for the system Chromium binary.
- After Escape, assert the modal trigger receives focus and the page returns to its prior scroll position.

## Validation status

- `git diff --check` passed.
- Build and browser smoke have not been run by this worker because root is running the integrated build and diagram integration. Their result should be recorded after that run; this report does not claim they passed.
- The current deployed FAB FLOW site was not re-captured or independently verified during this work.
