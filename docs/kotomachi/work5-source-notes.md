# KotoMachi Work 5 — Source Notes

Internal fact sheet for the Work 5 development article. Statements below are grounded in the current KotoMachi tree and the commit history through `d8e8e53` (2026-10-07). This is evidence, not a reconstruction of the developer's private thoughts. The repository does not itself establish the developer's personal motivations or first-person reactions; those are provided by the developer-authored notes and interview included in Work 5.

## Project overview

KotoMachi is a React 19 + TypeScript + Vite web game: a warm, story-driven 2D top-down chibi RPG set in autumn Sapporo, with Japanese learning woven into the story. The current source declares app `1.2.8`, content `chapter-1.6`, and save schema `4`. Chapter 1 connects Sapporo, home, Otaru, and Autumn Fest; its named cast includes Seoyeon, Sachiko, Hiroshi, Ayaka, and Momo. The playable build is hosted at `https://kotomachi-yoon.vercel.app`.

Evidence: `README.md`, `package.json`, `src/content/chapter1.ts`, `src/game/maps.ts`, `src/storage/SaveService.ts`, `docs/CURRENT_STATUS.md`.

## From first plan to current shape

The repository begins with a concept and learning design on 2026-09-23 (`c5e854a`, `9e5d9aa`, `bcfdb7b`), followed by Chapter 1 story plans. The initial concept was an autumn Sapporo RPG. By the first implemented vertical slice, the app was explicitly a React Native / Apps in Toss project with one station scene, an NPC, Japanese dialogue, and a save/continue proof (`79a625c`, 2026-09-25). The repository's own README says real Toss iOS/Android compatibility had not yet been verified.

On 2026-09-25, the infrastructure plan changed to PWA-first (`d48a6a4`); a later commit implemented an installable Vite PWA platform proof (`2e61b9f`). On 2026-09-27, the project moved to a playable Sapporo Chapter 1 in a web runtime with local durable progress (`2dc446b`). The app continued growing through authored learning, world, story, art, and persistence milestones rather than shipping the initial one-scene proof unchanged.

The sequence records product changes, not the developer's private reasons for starting or choosing the project. Those reasons have since been added in the developer's own note; distinguish that firsthand testimony from repository evidence.

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

## Technical appendices added to Work 5 (2026-10-14)

The public article includes three additional optional, collapsed engineering stories. These summarize documented decisions and implementation, not new claims of personal experience or complete subjective testing:

- **Platform / local-first save:** First vertical slice was React Native / Apps in Toss-oriented but Toss iOS/Android compatibility was not established (`79a625c`). The PWA pivot and Vercel direction are documented in `d48a6a4` / `2e61b9f` and `docs/INFRASTRUCTURE.md`. Platform isolation via `SaveService`, `SpeechService`, `AudioService` interfaces, single primary IndexedDB save with ordered schema v1→v4 migrations, recovery copies, write queue and competing-tab protection are documented in `src/storage/IndexedDbSaveService.ts`, `src/storage/SaveService.ts`, and `docs/UPDATE_POLICY.md`. `vite.config.ts` documents PWA install/cache/update settings including `skipWaiting: false` and excluded generated MP3 precache. Avoid asserting data automatically syncs between browser and installed PWA or that every physical-iPhone Chapter 1 scenario passed.
- **Visual redesign:** M4-A succeeded as structural map/world polishing; M4-B was technically functional but rejected for visual-quality reasons. `docs/M4_VISUAL_FOUNDATION_GOLDEN_SCENE_SPEC.md` documents the smooth chibi M4-R reset, decoupling the logical 480×270 gameplay coordinates from the DPR-aware Canvas backing resolution, smoothing high-res sprites and revising animation/feet-anchor expectations. Golden Scene `shopping` + `hiroshi-shop` acceptance precedes M5's rollout to 18 Chapter 1 map families (`docs/M5_CHAPTER1_VISUAL_ROLLOUT_SPEC.md`). Do not conflate representative-scene acceptance with full Chapter 1 owner visual-review acceptance.
- **Agent routing:** September 27 initial Astra-first / Sol reviewer / Luna routine approach (`a0bac26`), Luna-first refactor (`1597802`), Sol root-orchestration (`f22d151`), and configuration updates (`4c5e5f4`) appear in the history. The actual `.codex/config.toml` records `gpt-6.1-sol` medium, default `gpt-6-luna` high, and max two concurrent agent threads; `AGENTS.md` controls independent work, same-file concurrency guardrails, escalation, scoped validation and Git policy. Do not claim attribution of all past commits by exact agent or quantitative cost/speed improvements without direct metrics.

## TTS and audio: from device speech to completed Chapter 1 voice production

The 2026-09-24 docs explored device TTS and defined a lightweight runtime approach (`d4157cb`, `f610173`, `637b578`). The first playable slice used seven pre-generated Japanese voice files because the official Toss device TTS route was not confirmed (`79a625c`; historical README at that commit). After the PWA pivot, V1.1 selected browser/device Web Speech with character-specific voice profiles (`6576661`, `src/services/WebSpeechTtsService.ts`, `src/services/VoiceProfiles.ts`). The early Work 5 article recorded M7/M8 as deferred based on the 2026-10-05/06 snapshot; that state is no longer current.

On 2026-10-07 the owner heard an actual CPU-produced AivisSpeech morioki sample and authorized final casting, generation, and release. M7 implemented CPU-local synthesis with AivisSpeech Engine 1.2.0, voice license/provenance checks, incremental production scripts, manifest identities, runtime playback and a Web Speech fallback (`5bbbf05`). M8 produced and automatically verified **414/414 (100%) eligible Japanese spoken utterances** across five batches (25 / 199 / 54 / 84 / 52). The final inventory is Seoyeon 232, Sachiko 53, Hiroshi 10, Ayaka 59, other NPCs 60, totaling 12,040,680 MP3 bytes (~11.48 MiB). Original BGM, SFX and music-box assets remain.

All 414 current assets were deployed on Vercel from GitHub main; the production probe verified the manifest and each MP3 by HTTP 200, size, and hash. The final combined Playwright suite passed 34/34 tests. Generated voice is loaded on demand with bounded caching, and browser Web Speech remains the fallback. **Physical-iPhone end-to-end audio checks, subjective pronunciation listening, and broader visual/learning owner acceptance are not asserted complete.** These are follow-up validation items, distinct from shipped Chapter 1 voice production.

### Evidence for the expanded technical story

- **Initial default-voice limitation:** `6576661` and `src/services/VoiceProfiles.ts` show device-selected `ja-JP` Web Speech voice slots and rate/pitch profiles. Device variance is grounded in the user's reported iPhone/Mac observations; do not present it as an objective voice-quality benchmark.
- **Open-model search:** `docs/review/m7/tts-feasibility.md` records AivisSpeech Engine 1.2.0 successfully installed and run on CPU, while VOICEVOX Engine 0.25.2 was researched but not installed or benchmarked. Selected models were `morioki` 1.0.0, `阿井田 茂` 1.0.0, `まお` 1.2.0, with separate engine/model/output license review (`docs/review/m7/license-ledger.json`).
- **MacBook resource decision:** the developer's contemporaneous note says voice polish was deferred due to computer-resource concerns. It is a personal decision record, **not evidence of a failed MacBook CPU benchmark**. Docker was an early candidate, not the final synthesis runtime.
- **Codex Cloud breakthrough:** `docs/review/m7/tts-feasibility.md` records Linux x86_64, quota equivalent to 2 CPU, memory ceiling 8 GiB, no GPU, AivisSpeech `/audio_query` and `/synthesis` producing WAV. `docs/review/m7/casting.md` records approved fixed profiles; Sachiko shares morioki with Seoyeon at slower/lower settings, not a separately trained elderly voice.
- **Production integration:** `src/content/spokenCatalog.ts` extracts actual dialogue/choices/constructions, `scripts/voice/pipeline.mjs` implements fingerprinting, retries, resumable staging, pronunciation overrides and FFmpeg conversion, `voice/pronunciation-dictionary.json` fixes 小樽→オタル, and `voice/pronunciation-overrides.json` fixes 幸子→サチコ only in synthesis input. `src/services/GeneratedAudioSpeechService.ts` falls back to Web Speech; `vite.config.ts` excludes voice from install precache and caches clips on demand.
- **Verified delivery, not subjective acceptance:** `docs/review/m8/production-report.md` and `docs/review/m8/capacity-and-deployment.md` record 414/414, 11.48 MiB, 34/34 browser tests, plus pending human pronunciation/prosody and actual iPhone testing. Public sample MP3s are linked directly in the article's collapsible section.

Evidence: `docs/CURRENT_STATUS.md`, `docs/M7_M8_VOICE_PRODUCTION_SPEC.md`, `docs/review/m7/`, `docs/review/m8/production-report.md`, `docs/review/m8/production-ledger.json`, `public/audio/voice/`, `5bbbf05`, `2d29421`, `d8e8e53`.

## PWA, offline, deployment, and local save

Current runtime is React + TypeScript + Vite with `vite-plugin-pwa` / Workbox (`package.json`, `vite.config.ts`). The manifest declares standalone display, landscape orientation, and Sapporo-inspired colors. Workbox precaches core built assets and the existing BGM/SFX/music-box audio, while Chapter 1 generated dialogue voice assets are excluded from precache and fetched on demand with bounded runtime caching. Navigation uses `index.html` as a fallback. Update registration is prompt-based; `skipWaiting` is false, so the user applies an available update through the app's safe update flow (`src/pwa/usePwa.ts`, `src/pwa/activatePreparedUpdate.ts`, `docs/UPDATE_POLICY.md`). Vercel is the production host (`vercel.json`); the stable URL is `https://kotomachi-yoon.vercel.app`.

Player state is a single IndexedDB record (`kotomachi-pwa`, store `saves`, key `primary`). The current save schema is v4. Save code validates payloads, serializes writes, retains recovery copies, detects competing windows, and migrates versions 1→2→3→4 without silently deleting unrecognized data (`src/storage/IndexedDbSaveService.ts`, `src/storage/SaveService.ts`). Browser Cache Storage holds app assets; IndexedDB holds progress. These are intentionally separate. There is no backend/cloud save in the current baseline.

Evidence: `docs/INFRASTRUCTURE.md`, `docs/UPDATE_POLICY.md`, `docs/PWA_VALIDATION.md`, `vercel.json`, `vite.config.ts`, `src/pwa/`, `src/storage/`.

## Agent harness changes

The project initially captured agent delegation guidance on 2026-09-27 (`a0bac26`). It was later trimmed/refactored to route routine implementation to Luna while giving the primary agent task ownership (`1597802`). On 2026-09-30 it was made explicitly Sol-orchestrated (`f22d151`) and `.codex/config.toml` set Sol as the model with Luna as default subagent (`4c5e5f4`). Current `AGENTS.md` assigns Sol planning/integration/final decisions, Luna most exploration and bounded implementation, and Astra critical escalation only. This current harness is repository configuration, not evidence about every earlier task's exact agent participation.

## Current checkpoint and open work

`docs/CURRENT_STATUS.md` now records the 2026-10-07 checkpoint: Chapter 1 story, visuals, learning implementation and generated speech are shipped; app `1.2.8`, content `chapter-1.6`, save `4`. M7 and M8 are implemented and 414/414 eligible spoken lines were automatically validated and deployed. M5, M6, and M6-LS owner visual/learning review, subjective Japanese audio review, and physical iPhone testing are still listed as outstanding validation, not unimplemented core features. Work 5 may describe Chapter 1 production as complete without misrepresenting those reviews as passed.

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
| `5bbbf05` / `2d29421` / `d8e8e53` | Oct 7 | M7 voice pipeline; complete M8 Chapter 1 dialogue audio; final deployment and automated QA checks |
