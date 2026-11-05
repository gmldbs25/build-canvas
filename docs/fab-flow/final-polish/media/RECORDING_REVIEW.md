# Real gameplay recording review

Source: public deployed https://fabflow-yoon.vercel.app/ in clean GitHub Actions Chromium. No original engine changes, synthetic preview, AI media, image panning or upscaling. Local requests to both production domains returned CONNECT 403; only the ordinary Actions runner accessed the game.

## Attempt 1 — page recorder (rejected)

Run: https://github.com/gmldbs25/build-canvas/actions/runs/41937680889

Artifact ID: 13374468266 (`work6-gameplay-review-required`, 14-day retention). Script commit: `65dbabcaca32671330e1183bc8f191e42261e464`.

- Browser viewport, recorder size, stage and WebGL drawing buffer were all 2560×1440; stage bounds remained (0,0,2560,1440).
- The actual native simulation advanced from 36.5 to 80.5 seconds during the capture interval.
- Encoded H.264: 10 seconds, 25 fps, 250 frames, no audio, 1,078,784 bytes; SHA256 `5ce16f6e5863a496b5dbc4886dde9a752d78eba22662eee06938950a923543c4`.
- The final MP4 was downloaded and decoded at 1-second intervals. Full-resolution decoded frames 1 and 10 and the 10-frame contact sheet were visually inspected. The first frames contain an 800×600 upper-left game surface and gray remainder; the final sampled frame fills the output. Canvas-size checks did not predict recorder output.
- Adjacent-frame audit of all 250 decoded delivery frames at 640×360 grayscale: 241/249 pairs have mean absolute difference below 0.1; 244/249 below 0.5 (8-bit scale). This supports the observed lack of continuous useful motion; it is not a standalone OHT-motion detector. Full values are in `page-recorder-motion.json`.
- Rejected for release. Metadata and advancing simulation counters do not establish usable footage. Exact Chromium recorder internals remain unverified. This reproduces the prior failure despite a fixed page/recorder size.

Evidence: `page-recorder-report.json`, `rejected-page-recorder-contact.png`, `page-recorder-decoded-audit.json`. Near-gray fraction is only a supporting pixel statistic, not an independent content-quality gate.

## Reproduction and release gates

Run from repository root after installing Work6 dependencies, Playwright Chromium and ffmpeg:

```sh
node projects/fab-flow/scripts/capture-gameplay.mjs
```

The current recorder captures the actual deployed Three.js canvas via `captureStream(30)` and browser MediaRecorder after the final fullscreen geometry stabilizes. It saves VP9 source plus H.264 delivery candidate, extracts decoded PNG frames, and records source, geometry, simulation time, codec and SHA256. This records the original renderer; it does not replace the game or create simulation movement.

The workflow `.github/workflows/work6-gameplay.yml` can be re-run with workflow_dispatch in GitHub. It has read-only repository permissions and only uploads review artifacts. It never replaces article media automatically.

Before release, play the encoded final file and inspect full-size frames at multiple times, canvas coverage, OHT-scale movement, repeated frames, stutter and loop seam. Then check mobile playback, poster/error fallback, reduced motion, data-saver behavior and initial network transfer. Reject any clip that is not clearly better than the existing static image. A successful capture job alone is not a release approval.

## Native-canvas attempt — accepted for user-initiated Chapter 02 playback

Source run: https://github.com/gmldbs25/build-canvas/actions/runs/41938470560 (commit `73bf5d0`). Compact review package: https://github.com/gmldbs25/build-canvas/actions/runs/41939363178, artifact `13375651139`.

The deployed Three.js canvas stream removed the stale page-recorder surface. The final encoded frames fill 2560×1440 throughout the sampled interval. No game code was changed. UI overlays outside the canvas are naturally excluded from this recording.

The first H.264 candidate inherited a 1000fps time base from the VP9 source and duplicated frames (9,593 frames / 15,002,272 bytes). It was not used for delivery. Re-encoding with `-vf fps=30 -an -c:v libx264 -preset fast -crf 21 -pix_fmt yuv420p -movflags +faststart` preserves native pixel dimensions and real timing while removing container-induced duplicates. No invented intermediate motion or upscaling is used. The recording script now explicitly normalizes delivery to 30fps too.

Final shipped file:

- 2560×1440 H.264, 9.6 seconds, 30fps delivery, 288 decoded frames, no audio.
- 2,376,445 bytes; SHA256 `165c651d9fbe4a21bf6988a9791252c9e4726203cb6a50953757ce2763e3fc57`.
- Extracted final delivery frames at every second; viewed the 10-time contact sheet and full-size seconds 1 and 6. Multiple green OHTs and orange loaded FOUPs change positions along stable rails while the factory/camera stay fixed. No gray remainder or small source rectangle. Detail varies somewhat with real rendering/encoding; this is native QHD capture, not a guarantee of QHD sharpness for every object at phone scale.
- Actual final file played in local Chromium at 1440 and 390 CSS pixels: currentTime advances to ~2.014s after two wall seconds; 65–66 reported video frames and zero dropped frames over that initial interval. This is desktop Chromium with a mobile viewport, not an on-device Safari test.
- All adjacent final-frame differences were measured at 640×360 grayscale: median 0.01270 (8-bit units); 58/287 pairs below 0.001; 242/287 below 0.1. The OHTs occupy a small fraction of a stable factory image, so whole-frame differences are small. These values supplement direct decoded-frame and playback inspection; nominal 30fps does not prove 30 unique source frames per second.
- Start/end differ (seam MAE 1.512 at the same analysis scale), so no automatic loop is shipped.

Decision: keep the sharper established static Hero and offer the real 9.6-second clip as a user-initiated Chapter 02 video with native controls/fullscreen. `preload=none` and no autoplay protect the initial transfer and reduced-motion/data-saver experience. A 1280px WebP poster is a static fallback; video failure retains an image. Playback on a physical mobile device and mobile Safari remains unverified.

Evidence: `capture-report.json` (source candidate metadata), `final-metadata.json` (30fps delivery), `final-motion-audit.json`, and `contact.png`. The full raw/source and decoded PNG collection are in Actions artifacts with 14-day retention; shipped MP4, poster and persistent review evidence remain in Git.
