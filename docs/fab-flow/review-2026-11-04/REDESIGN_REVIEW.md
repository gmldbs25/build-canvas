# Work 6 redesign · 2026-11-04

## Scope and source freeze

- Build Canvas remote main checked before implementation: `a2ceb263557d4fa589110069f16d59c76b44081b`.
- FAB FLOW local HEAD and GitHub remote main independently match `7cfb6c58073a80df5c3d310c6ce9584679edc277`. Source repository remains read only.
- Existing three design documents were read; this request authorizes implementation and direct main deployment, superseding their old proposal approval gates.
- Preserve 3 Parts, 11 chapters, Vite/React, Pages route, H shortcut, source app links, image enlargement and native disclosures. Do not modify portfolio home or Works 1–5.

## Current state audit and design response

The original desktop 1440×900 Hero starts its image around y=557: display type and whitespace occupy most of the initial viewport. The redesigned desktop composition places compact title/intro/CTA beside the real factory image; mobile keeps copy and CTA before media. The original recurring text-plus-screen layouts gain source-specific network, architecture, transport, routing and time diagrams in chapters 06–09.

All 12 PNGs have genuine-capture provenance in the existing manifest. Hero is native 2560×1440 at DPR1; other exports are 3600px wide from DPR2 captures. These are November 3 captures, not newly captured November 4 media; deployed source SHA remains unknown. UI text inside a full overview remains too small to use as article text. Captions and nearby prose carry the explanation; original-size viewing remains available. No artificial upscaling or generated game images.

`media-audit.json` records dimensions, bytes and original SHA256 for every image. Full-resolution lossless RGB WebP was checked pixel-for-pixel against every PNG. Original PNG total 12,013,289 bytes; full WebP total 5,940,406 bytes. Responsive 800/1600px quality-92 previews (Hero 1280px) avoid sending full captures to small displays; enlargement retains the original PNG. These are delivery improvements, not a claim of newly captured content.

## Previous video failure investigation

Relevant history: `42c0b35` fullscreen capture changes, `388a528` eight-second presentation, `3308cfd` static restoration, `cf0b508` removal, `6d25203` native QHD still replacement. Inspected the retired capture script and decoded the actual prior MP4 from `cf0b508^`.

- ffprobe: 2560×1440, 30fps, 240 frames, 8 seconds, 2,849,405 bytes. Metadata alone passed the old gate.
- Contact sheet: see `previous-video-contact.png`. For most of the clip the application occupies a small upper-left rectangle with a gray remainder. The last portion finally fills the frame.
- Grayscale analysis at 320×180: at integer seconds 0–6, only 13.2% of pixels differ from gray 128 by more than 6; at second 7 this rises to 99.6%.
- 232 of 239 consecutive decoded frame pairs have mean absolute grayscale difference below 0.1. This is a near-static diagnostic, not a literal duplicate-frame count; lossy encoding can change pixel hashes without meaningful movement.
- The script waited for the live WebGL canvas and checked first/last canvas hashes, then cut the tail of a Playwright page recording. Those checks did not prove that the encoded clip itself contained the full live viewport throughout. Exact recorder-internal root cause is unverified. The observed recording/output mismatch precedes final encoding; increasing bitrate cannot reconstruct missing content.
- Rejected remedies: upscaling the small active rectangle loses detail; trimming to the final roughly one second cannot supply a natural 6–12-second transport; repeating/interpolating it would disguise insufficient footage. Re-encoding the same file cannot repair this.

Decision: retain the verified static Hero. New live recording requires source-domain access. The current environment explicitly denies CONNECT to `fabflow-yoon.vercel.app` and `gmldbs25.github.io` (403); no bypass attempted. Available environment tools expose status/diagnostics, not an allowlist mutation. User authorized trying to configure access; no supported mutation tool was available. This is not a claim of a successful new recording or remote UX verification.

Future recording gate: lock the final viewport before recording; verify compositor frame dimensions and content bounds throughout the encoded interval, not just canvas screenshots before/after. Inspect consecutive movement at OHT scale, full-size extracted frames and loop boundary; count repeated/near-static intervals. Require a genuinely continuous 6–12 seconds of full-frame real gameplay before publishing. Poster, muted inline controls, reduced-motion/data-saver behavior and failed-playback fallback are necessary if a future clip passes.

## Technical review

See `ENGINEERING_EVIDENCE.md` for source paths/functions and implementation limits. Root review independently checked `tickOperational`, `buildOperationalEdgeCosts`, `dispatchOperational`, `handleNodeOperational`, `admitOperational`, `v2BestPath`, `v2PathsToTarget`, `PlaybackScheduler` and V6 `link` generation. Key corrections: default CBR uses estimated delay converted to distance, dispatch and movement are distinct, waiting is not an OHT phase, and wall-clock debt resets do not skip native state transitions. Diagrams are explanatory schematics, not runtime exports or exact V6 geometry.

## Editorial passes

1. Technical reviewer: separate request phases from OHT phases; distinguish routing from admission and UI publication from persistence; retain bounded historical benchmark and regression.
2. Technical editor: introduce terms in Discover; connect configuration → congestion → analysis; give engineering concepts visible figures and secondary implementation notes.
3. Korean copy pass: simplify abstract hooks and repeated caveats; keep adjacent provenance where it affects interpretation.
4. Visual pass: inspect original and redesigned browser captures at desktop/mobile; correct diagram connections, typography, page overflow, Hero composition and modal behavior when found.
5. Final reader: perform the regression/viewport suite and a second rendered review after integration. Actual commands, outcomes and remaining limits are recorded in the delivery report.

## Architecture deepening follow-up

After the editorial redesign reached main, Work 6 chapters 06–09 were deepened from its updated base (`d4c6c395f9f0ed3342aed2ac2aa2d20218a090b8`) against the unchanged FAB FLOW source `7cfb6c58073a80df5c3d310c6ce9584679edc277`. New architecture views distinguish static Layout/topology, Engine-owned SimulationState and temporary route results; show actual module interfaces and data-flow direction; trace dispatch, admission, link movement and pickup/dropoff state mutation across Tick boundaries; and separate view publication, snapshot restore and input replay.

Five article ADR summaries identify fixed-step ownership, directed V6 graph and shared path geometry, route cost versus movement admission, UI publication versus persistence, and the historical rationale for keeping ordinary live playback in the app execution context. `../ARCHITECTURE_DECISIONS.md` separates current-code behavior from historical design intent. A quality evidence table distinguishes source-verified structure, historical performance measurements and unverified production claims. The diagrams are source-based schematics, not captured runtime traces.
