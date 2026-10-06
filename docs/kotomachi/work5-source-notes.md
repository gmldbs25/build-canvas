# KotoMachi Work 5 — Source Notes

Internal fact sheet for the Work 5 development article. Statements below are grounded in the current KotoMachi tree and the commit history through `791170e` (2026-10-06). This is evidence, not a reconstruction of the developer's private thoughts. The repository does not record a personal origin story or first-person reactions; those belong in later Human Notes.

## Project overview

KotoMachi is a React 19 + TypeScript + Vite web game: a warm, story-driven 2D top-down chibi RPG set in autumn Sapporo, with Japanese learning woven into the story. The current source declares app `1.2.2`, content `chapter-1.6`, and save schema `4`. Chapter 1 connects Sapporo, home, Otaru, and Autumn Fest; its named cast includes Seoyeon, Sachiko, Hiroshi, Ayaka, and Momo. The playable build is hosted at `https://kotomachi-yoon.vercel.app`.

Evidence: `README.md`, `package.json`, `src/content/chapter1.ts`, `src/game/maps.ts`, `src/storage/SaveService.ts`, `docs/CURRENT_STATUS.md`.

## From first plan to current shape

The repository begins with a concept and learning design on 2026-09-23 (`c5e854a`, `9e5d9aa`, `bcfdb7b`), followed by Chapter 1 story plans. The initial concept was an autumn Sapporo RPG. By the first implemented vertical slice, the app was explicitly a React Native / Apps in Toss project with one station scene, an NPC, Japanese dialogue, and a save/continue proof (`79a625c`, 2026-09-25). The repository's own README says real Toss iOS/Android compatibility had not yet been verified.

On 2026-09-25, the infrastructure plan changed to PWA-first (`d48a6a4`); a later commit implemented an installable Vite PWA platform proof (`2e61b9f`). On 2026-09-27, the project moved to a playable Sapporo Chapter 1 in a web runtime with local durable progress (`2dc446b`). The app continued growing through authored learning, world, story, art, and persistence milestones rather than shipping the initial one-scene proof unchanged.

The sequence records product changes, but not the developer's private reasons for starting or choosing the project. The article should invite the Human to add those reasons.

## Milestones and decisions visible in the record

- **2026-09-23 — concept and story:** game concept, Japanese-learning design, Chapter 1 storyline, and map design were authored before the playable slice (`c5e854a`, `9e5d9aa`, `8a5abc2`, `281eac8`). Stable narrative locations and recurring daily-life scenes appear early.
- **2026-09-24 to 25 — speech and platform proof:** docs first define spoken-Japanese TTS rules and a lightweight device TTS approach (`d4157cb`, `f610173`, `637b578`). The first vertical slice bundled generated Japanese speech (`79a625c`). The infrastructure direction then pivots to PWA-first (`d48a6a4`) and the PWA proof follows (`2e61b9f`).
- **2026-09-27 — playable Chapter 1:** original autumn art and chapter audio were added (`4931653`); the chapter runtime, local save behavior, learning help, story and world were implemented (`2dc446b`).
- **2026-09-29 — V1.1:** dialogue learning, history and notebook were added (`d654117`), followed by character-specific system TTS profiles (`6576661`).
- **2026-09-27 to 30 — agent routing:** delegation guidance first appeared on Sep 27 (`a0bac26`), was trimmed/refactored Sep 29 (`1597802`), made explicitly Sol-orchestrated Sep 30 (`f22d151`), and gained project orchestration config (`4c5e5f4`).
- **2026-09-30 to Oct 1 — learning retrofit and visual reset:** M1 first-day slice (`bab243e`), M2 reusable learning-authoring model (`c7effa1`), then phased M3 Chapter 1 retrofit (`4cca12a`, `82e963f`, `feb9375`, `8cd0226`, `40b99c9`). The first M4 visual pass was superseded after the visual direction was reset from coarse pixel art to smooth illustrated 2D chibi (`176926c`, `b12367b`). M4-R's Golden Scene was accepted (`fb9033f`, `2c5e474`), then M5 rolled that visual bar through Chapter 1 (`84d9505`).
- **Oct 2 to 5 — learning experience and retrieval:** the M6 pass added active learning in ordinary dialogue plus a replayable bedtime phone game, Today Kotoba (`f17de80`, `a2e8c7e`). M6-LS then clarified first-encounter support and retrieval-first reuse; it is implemented but awaiting owner playtest (`6d1c30e`, `2a198c3`). Current docs deliberately leave M5 visual and M6 learning owner reviews open (`docs/CURRENT_STATUS.md`, `docs/DEVELOPMENT_ROADMAP.md`).

## Learning design evolution

The early plan connected Japanese learning to in-world context, NPC conversation, word help, and short activities (`LEARNING_DESIGN.md`, `M1_FIRST_DAY_LEARNING_SPEC.md`). V1.1 added dialogue-linked exercises, dialogue history, and a notebook (`d654117`). M2 gave authored learning targets stable IDs and metadata for encounter role, interaction type, and support level (`c7effa1`, `src/content/learningAuthoring.ts`). M3 applied that model across first day, neighborhood, Otaru, and Autumn Fest (`4cca12a` through `40b99c9`).

M6 made active use more explicit: contextual cloze, natural responses, sentence construction from meaningful chunks, world action, later reuse, and a daily recall game. The M6-LS follow-up added episode-level primary/supporting targets, a first-encounter contract, support fade, and recall-first cloze (`a2e8c7e`, `2a198c3`). These are authored progression and interactions; the current status does not claim owner playtest acceptance.

Evidence: `docs/LEARNING_DESIGN.md`, `docs/CHAPTER1_LEARNING_CURRICULUM.md`, `docs/M1_FIRST_DAY_LEARNING_SPEC.md`, `docs/M2_LEARNING_AUTHORING_FRAMEWORK_SPEC.md`, `docs/M3_CHAPTER1_LEARNING_RETROFIT_SPEC.md`, `docs/M6_CHAPTER1_LEARNING_EXPERIENCE_SPEC.md`, `docs/M6_LEARNING_STRUCTURE_POLISH_SPEC.md`, `src/content/learningAuthoring.ts`, `src/content/chapter1LearningM6.ts`, `src/components/TodayKotobaGame.tsx`.

## Visual development

The project first produced original autumn pixel art (`4931653`). M4-A improved world structure, scale, traversal, collision, and camera. M4-B created a Golden Scene but the roadmap documents that the visual bar was rejected: higher-resolution replacements rendered under the old pixel-oriented assumptions did not meet the desired style. The visual direction was explicitly reset to smooth illustrated 2D chibi (`176926c`, `b12367b`). M4-R adapted high-DPI rendering and rebuilt the shopping street / Hiroshi's store; it was accepted as the production bar (`fb9033f`, `2c5e474`). M5 then applied it across 18 Chapter 1 map families (`84d9505`), with touch, layering, and keepsake/save follow-up work. M5 remains pending owner visual review.

Evidence: `docs/DEVELOPMENT_ROADMAP.md`, `docs/M4_VISUAL_FOUNDATION_GOLDEN_SCENE_SPEC.md`, `docs/M5_CHAPTER1_VISUAL_ROLLOUT_SPEC.md`, `docs/ART_DIRECTION.md`, `docs/review/m4r/`, `docs/review/m5/`, `art/source/m4r/generation-briefs.md`, `art/source/m5/asset-decisions.md`.

## TTS and audio: experiment, shipped fallback, deferred production

The 2026-09-24 docs explored device TTS and defined a lightweight runtime approach (`d4157cb`, `f610173`, `637b578`). The first playable slice used seven pre-generated Japanese voice files because the official Toss device TTS route was not confirmed (`79a625c`; historical README at that commit). After the PWA pivot, V1.1 selected browser/device Web Speech with character-specific voice profiles (`6576661`, `src/services/WebSpeechTtsService.ts`, `src/services/VoiceProfiles.ts`). The current code requests a Japanese system voice where available and reports unsupported/error states; actual voice availability and sound vary by device.

Original BGM, SFX, and music-box assets are generated by `scripts/generate-audio.mjs` and listed in `public/audio/manifest.json`. The current repo explicitly says there are no pre-produced character dialogue assets; M7/M8 voice pipeline/casting and bulk dialogue production are deferred until the learning content is reviewed/stable (`docs/AUDIO_PRODUCTION.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/CURRENT_STATUS.md`). This is the recorded status; do not claim a particular personal reason for deferring it.

## PWA, offline, deployment, and local save

Current runtime is React + TypeScript + Vite with `vite-plugin-pwa` / Workbox (`package.json`, `vite.config.ts`). The manifest declares standalone display, landscape orientation, and Sapporo-inspired colors. Workbox precaches built HTML/JS/CSS, images, webmanifest and MP3 files and uses `index.html` as navigation fallback. Update registration is prompt-based; `skipWaiting` is false, so the user applies an available update through the app's safe update flow (`src/pwa/usePwa.ts`, `src/pwa/activatePreparedUpdate.ts`, `docs/UPDATE_POLICY.md`). Vercel is the production host (`vercel.json`); the stable URL is `https://kotomachi-yoon.vercel.app`.

Player state is a single IndexedDB record (`kotomachi-pwa`, store `saves`, key `primary`). The current save schema is v4. Save code validates payloads, serializes writes, retains recovery copies, detects competing windows, and migrates versions 1→2→3→4 without silently deleting unrecognized data (`src/storage/IndexedDbSaveService.ts`, `src/storage/SaveService.ts`). Browser Cache Storage holds app assets; IndexedDB holds progress. These are intentionally separate. There is no backend/cloud save in the current baseline.

Evidence: `docs/INFRASTRUCTURE.md`, `docs/UPDATE_POLICY.md`, `docs/PWA_VALIDATION.md`, `vercel.json`, `vite.config.ts`, `src/pwa/`, `src/storage/`.

## Agent harness changes

The project initially captured agent delegation guidance on 2026-09-27 (`a0bac26`). It was later trimmed/refactored to route routine implementation to Luna while giving the primary agent task ownership (`1597802`). On 2026-09-30 it was made explicitly Sol-orchestrated (`f22d151`) and `.codex/config.toml` set Sol as the model with Luna as default subagent (`4c5e5f4`). Current `AGENTS.md` assigns Sol planning/integration/final decisions, Luna most exploration and bounded implementation, and Astra critical escalation only. This current harness is repository configuration, not evidence about every earlier task's exact agent participation.

## Current checkpoint and open work

`docs/CURRENT_STATUS.md` and `docs/DEVELOPMENT_ROADMAP.md` date the checkpoint to 2026-10-05: Chapter 1 core is implemented through M6-LS; app `1.2.2`, content `chapter-1.6`, save `4`. M5, M6, and M6-LS are technically implemented but still await owner visual/learning review. No implementation milestone is active. M7/M8 pre-produced voice work is deferred / not started. The docs say the project can pause at this checkpoint.

## Work 5 screenshot candidates

Use screenshots from the original repo as record of the playable artifact, copy only the chosen files into Build Canvas, and preserve a caption that states what each image shows. Candidate captures include:

- `docs/review/m4r/m4r-phone3x-shopping-screen.png` — revised Golden Scene, warm shopping street and readable character art; visual direction proof.
- `docs/review/m4r/m4r-phone3x-hiroshi-dialogue-screen.png` or `...-hiroshi-learning-beat-screen.png` — the Golden Scene at a dialogue/learning moment.
- `docs/review/m6/learning-structure-polish/captures/chromium-667x375-first-momo-model.png` and `...-first-momo-primer.png` — first-encounter explanation/support sequence.
- `docs/review/m6/learning-structure-polish/captures/chromium-667x375-story-builder-correction.png` — retrieval and sentence construction feedback.
- `docs/review/m6/learning-structure-polish/captures/chromium-667x375-touch-dpr3-day1-builder.png` or `...-day1-cloze.png` — Today Kotoba on a phone-shaped viewport.
- `docs/review/m6/captures/full-chapter/chapter-1-ending.png` — Chapter 1 ending / current journey context.

Use two or three distinct images, not a gallery: a Golden Scene, an ordinary learning interaction, and (optionally) the daily phone game. The implementation should check image dimensions and file weight before copying.

## Primary historical anchors

| Commit | Date | Evidence in history |
| --- | --- | --- |
| `c5e854a` / `9e5d9aa` | Sep 23 | initial game concept, learning design |
| `79a625c` | Sep 25 | first Apps in Toss vertical slice; bundled Japanese speech |
| `d48a6a4` / `2e61b9f` | Sep 25 | PWA-first pivot and installable platform proof |
| `2dc446b` | Sep 27 | playable Chapter 1 with local durable progress |
| `4931653` | Sep 27 | original autumn pixel art and chapter audio |
| `d654117` / `6576661` | Sep 29 | dialogue learning/notebook; character-specific Web Speech profiles |
| `4c5e5f4` / `f22d151` | Sep 30 | configured Sol/Luna harness |
| `bab243e` / `c7effa1` / `4cca12a`–`40b99c9` | Sep 30–Oct 1 | M1–M3 learning architecture and Chapter 1 retrofit |
| `176926c` / `fb9033f` / `84d9505` | Oct 1 | visual reset, accepted M4-R Golden Scene, M5 rollout |
| `a2e8c7e` / `2a198c3` | Oct 2–5 | M6 learning experience and retrieval-first M6-LS |
