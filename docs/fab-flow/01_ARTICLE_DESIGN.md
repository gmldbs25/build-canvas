# FAB FLOW — Work6 Article Design

> 2026-11-04 redesign implementation: see [review and evidence](review-2026-11-04/REDESIGN_REVIEW.md) and [delivery validation](review-2026-11-04/DELIVERY.md). Current engine analysis is based on `7cfb6c58`; media retain their original November 3 provenance. The current user request explicitly authorizes implementation and direct main deployment; old proposal approval gates below are historical.

> Status: **Published 1st article implementation / live iteration authorized** · 2026-11-03  
> Scope: `gmldbs25/build-canvas` · `projects/fab-flow/` · public URL `/build-canvas/fab-flow-preview/`  
> Source of truth: this document + [02_CONTENT_STRUCTURE.md](02_CONTENT_STRUCTURE.md) + [03_DEVELOPMENT_PLAN.md](03_DEVELOPMENT_PLAN.md). Historical Scene plans in [archive/](archive/) are **not** implementation instructions.

## 0. Design brief / decision boundary

**FAB FLOW — 반도체 물류 세상.** Work6 is a polished project showcase that **becomes** an evidence-based engineering article as the visitor scrolls. It is not a simulator, an eight-scene slide deck, or a clone of the FAB FLOW application. Present the real product, then reveal the engineering behind it.

- Design vocabulary: **Miniature / Editorial / Engineering**.
- Reading order: **DISCOVER → EXPLORE → BEHIND THE SIMULATION → PLAY**.
- Interaction: ordinary vertical document scrolling, optional lightweight native disclosure and image viewing. No scene locks, step gates, 3D runtime, or scroll hijacking.
- Fidelity rule: only media captured from real FAB FLOW or diagrams constructed faithfully from verified source models. No AI/fake screenshots, recreated game HUD, decorative fake metrics, or stock 3D factories.
- Content ownership: all factual assertions are governed by 02, including version/source labels. Art direction never overrides technical truth.
- This was the original design proposal. The user subsequently authorized direct main deployment and live feedback; see 03_DEVELOPMENT_PLAN.md for the 2026-11-03 implementation override.

## 1. Reading experience and page anatomy

One semantic article, 11 numbered chapters (00–10), divided into 3 parts. Each chapter has a unique visual rhythm, not a repeating card grid.

| Position | Intent | Primary visual composition | Text treatment |
|---|---|---|---|
| 00 · FAB FLOW | Game landing / decisive invitation | Full-bleed deep green Hero; prominent **authentic** factory overview or short capture, not a fake render | Giant heading, Korean subtitle, one-line hook, primary Play CTA above fold |
| 01 · 작은 반도체 공장 | Scale & orientation | Bright, expansive isometric overview; Small/Medium/Large genuine frame strip | Concise definition + three size captions |
| 02 · 물류가 움직이는 순간 | One meaningful transport | Horizontal sequence of 5–6 documentary frames, or one muted loop with readable transcript | Plain-language micro-captions; never recreate tutorial buttons |
| 03 · 나만의 FAB 운영하기 | User agency | Screenshot of actual Sandbox controls alongside wide factory frame | Four concrete settings; no fake controls |
| 04 · 공장이 막히기 시작하면 | Cause, effect, observation | Documented before/after demand comparison; optional layered split image | Strong question heading and interpretation caveat |
| 05 · 운영을 분석하고 실험하다 | Measurement & alternatives | Full-width Operations Analysis screenshot, smaller policy comparison proof | Small editorial caption table; distinct observed vs matched experiments |
| 06 · 3D 공장을 코드로 표현하는 방법 | Visual world to graph | Clean schematic connected to annotated real map crop | Node → directed link → Port explainer; code disclosure |
| 07 · OHT를 움직이는 물류 제어 시스템 | Decision machinery | Route diagram / annotated actual route + MCS decision flow | DBR vs CBR in honest terms; expandable technical details |
| 08 · 시뮬레이션 엔진의 내부 | Time & reproducibility | Tick timeline with state snapshots, minimal code excerpt | Carefully separate sim time and wall-clock time |
| 09 · 수백 대의 차량을 브라우저에서 움직이기까지 | Performance craft | Real dense fleet image + labeled **measured** before/after graphic | One bounded benchmark, environment/baseline/limitations adjacent |
| 10 · 프로젝트를 마치며 | Meaning and invitation | Distinctive final real factory image, deep green closing field | Limits, learned choices, final Play CTA |

**Rhythm:** 00 cinematic (dark) → 01–03 bright/photographic → 04 dramatic amber interruption → 05 journalistic white → 06–09 quieter technical magazine → 10 dark/closing. Avoid four consecutive sections with the same two-column pattern.

## 2. Hero — specification for implementation

**Desktop reference frame (1440 × 900 design target, not a fixed canvas):**
- Top: minimal local return-to-portfolio text link; do not invent a standalone product navigation.
- Main H1: `FAB FLOW`, oversized, strong horizontal measure; subtitle `반도체 물류 세상` in clearly subordinate size.
- Proposed hook, pending copy review: **“작은 공장 안에서, 수백 개의 물류 판단이 움직인다.”** Validate that scale phrasing fits selected media; if not, choose “작은 공장 안에서, 물류가 살아 움직인다.”
- One primary high-contrast `FAB FLOW 플레이하기` action, links to `https://fabflow-yoon.vercel.app/`. It must be visible in initial viewport on 1366×768 without scrolling; do not make it visible only on hover/animation.
- Real video/still occupies dominant visual area (suggest 60–70% of Hero visual weight), unobstructed by text or gradient darker than needed for readability. Prefer a **static preloadable WebP poster** with a click-to-play video or a carefully throttled muted optional loop.
- Tiny `SCROLL TO DISCOVER` may be below CTA as secondary direction; never required to proceed. No mandatory down button.
- The Hero must still look complete if video fails, data saver is active, or JavaScript is off.

**Mobile reference 390 × 844:** title → subtitle → hook → primary CTA → factory image, in that order; a visible edge of media/next content should suggest continued reading. Do not stack headings on top of tiny moving OHTs. On 320/360px widths avoid horizontal scrolling or cropped CTA. Tablet may switch to an asymmetric split.

**Hero asset preference:** latest source-matched V6 high-quality overview from captured current app. Repository screenshot artifacts are **candidates**, not approved current production captures: `gmldbs25/fab_flow/docs/operations-analysis/1.1/evidence/visual-release-fixed/1920x1080-off.png` or a fresh capture with explicit SHA/version. Do not call archive imagery current without matching source/configuration.

## 3. Design tokens (proposed values, adjust only after reviewing real captures)

| Role | Proposed token | Usage |
|---|---|---|
| Canvas | `#F5F2E9` | warm editorial page |
| Paper | `#FFFEFA` | technical reading surface |
| Ink | `#203E33` | deep green text |
| Hero / footer | `#102D25` | rich dark chapters |
| Secondary ink | `#637269` | captions, metadata |
| Mint | `#BFE9D2` | subtle linework, diagrams, hover |
| Amber | `#E4AA57` | OHT/FOUP storytelling and highlighted observation |
| Divider | `#D9E0D5` | light thin chapter rules |

These are **design proposals**, not claims about exact current FAB FLOW CSS color values. Confirm against screenshots before implementation. Colors must meet WCAG AA for normal text; do not place mint-on-cream body copy or amber-on-white small text.

Typography: Korean-capable locally/system available sans (e.g. `Pretendard` only if license/asset actually present, otherwise system fallbacks), editorial English display with supported fallback; **do not fetch external fonts merely for aesthetics**. Desktop Hero `clamp(4rem, 10vw, 9rem)`; desktop chapter H2 `clamp(2rem, 4.5vw, 4.5rem)`; body `clamp(1.0625rem, 1.3vw, 1.1875rem)`, line-height 1.65–1.8; caption 0.875rem minimum when important. Mobile body 16–18px, chapter headings 28–40px. Engineering code 14px minimum with horizontal overflow for long lines. Keep Korean line breaks intentional; no narrow 12-character columns or arbitrary clipped captions.

Grid: body max-width around 1200–1360px; main reading column max 700–760px; imagery may escape reading width to full bleed. Desktop 12-col flexible grid, side annotations as needed; tablet 2-col selectively; mobile single column. Section padding desktop 96–160px, mobile 64–88px. Major boundaries use title, space, or tone shift rather than recurring bordered cards.

## 4. Media and figure grammar

- Photos/video are **evidence**, not wallpaper. Each has a visible caption (state, purpose, screenshot build/source where important) and meaningful `alt` text or transcript.
- 16:9 hero/current full map; 3:2/4:3 diagrams and analysis; portrait crops for mobile should be **separately curated**, not blindly scaled and illegible. Real HUD text too small? Pair annotated crop with nearby human-readable prose instead of a huge unhelpful screenshot.
- For one-transport chapter, arrange a storyboard with time points: Request → Dispatch → Empty → Pickup → Loaded → Drop-off. Keep timing labels scenario-based, not fabricated.
- For before/after congestion, freeze **same layout/seed/fleet/policy/elapsed tick and camera** when varying demand; record difference and caveats. If no matched media exists, do not visually imply controlled comparison; use a single observation instead.
- Technical diagrams are SVG/HTML created from verified model semantics and link direction; visually distinct from real gameplay. Label `개념도 / schematic`. Never present diagrams as literal exported FAB topology unless data-derived.
- Charts: choose one real bounded benchmark (not a collage of impressive numbers); annotate unit, workload, SHA, host, browser/GPU, and observed regressions in the adjacent caption.
- Video: poster, `preload="none"` or `metadata`, `muted playsInline controls`, lazy loading; no sound autoplay. Include transcript/storyboard fallback. Avoid many simultaneous WebM players.
- Asset export budget (initial targets, verify actual quality): Hero still ~200–350KB WebP, other images ~100–250KB (occasionally larger for legibility), total initial above-fold transfer roughly <1MB excluding framework; do not deliberately downsample screenshot text beyond legibility. Prefer WebP/AVIF source-verified, keep original provenance privately; thumbnail + optional high-res view.

## 5. Scroll, navigation, and microinteraction

- One standard document scroll, `<main><article><section>` with named anchor ids (`#discover`, `#explore`, `#behind` and `#chapter-06` etc.).
- Optional sticky tiny chapter progress indicator **only on desktop when useful**; never obstruct content or the first CTA. Ordinary anchors remain functional without JS.
- Chapter reveal effects limited to opacity/translate of decoration, duration <350ms; never hide required text if IntersectionObserver is unavailable. `prefers-reduced-motion: reduce` disables decorative motion and smooth scrolling.
- Technical deep dives as native `<details><summary>`: closed by default only for truly secondary derivations/code. Main causal explanation is always visible. Keyboard Enter/Space, focus ring, target size ~44px.
- External Play actions (Hero and end) are real anchors, optionally open new tab with safety attributes and clear text. Primary button must not be obscured by video overlays.
- Maintain common **H key** home shortcut, except when typing in input/textarea/contenteditable, when focus is in controls where shortcut conflicts, or modifier keys are pressed. Use existing Build Canvas destination `/build-canvas/`, keyboard-only and mobile navigation.
- No modal onboarding, hover-only labels, autoplay sound, forced horizontal carousel, or 3D canvas in Work6.

## 6. Responsive / accessibility review matrix

| Viewport | Specific acceptance |
|---|---|
| 1920×1080 | Hero has clear focal media and CTA, text width restrained, no empty-feeling card grid |
| 1440×900 | Primary art direction reference; varied rhythms across 11 chapters |
| 1366×768 | Entire main CTA visible; no overlap with top link |
| 1024×768 | Media/caption remains readable; engineering figures scroll or reflow |
| 768×1024 | Two-column media blocks collapse when necessary |
| 390×844 / 375×667 / 360×740 | One column; readable Korean body; no horizontal overflow |
| 844×390 landscape mobile | No full-viewport sticky overlays; meaningful reading still possible |

- Explicit `lang="ko"`, H1 once, H2 chapter hierarchy, meaningful link names, contrast check, focus visibility, native video controls/captions or equivalent textual alternative.
- `prefers-reduced-motion` and `prefers-reduced-data`/bandwidth-aware image choices where supportable; stable image aspect-ratio containers to avoid layout shift.
- Verify with both pointer and keyboard: Play, home, figure anchors, disclosures, tab order, browser back/forward, skipped media.
- Source code excerpts must be select-and-copy readable, syntax-highlighted only if lightweight and accessible.

## 7. Design acceptance / explicit rejection criteria

**Accept when:** (1) Hero communicates “play a real game” in 5 seconds; (2) visitor understands OHT/FOUP before acronym-heavy sections; (3) each of chapters 03–05 shows genuine app evidence; (4) article deepens into credible implementation diagrams and citations; (5) long scroll stays visually varied; (6) phone text remains legible; (7) both Play CTAs work; (8) no runtime simulator was smuggled into the new page.

**Reject when:** mock 3D replaces real gameplay, synthetic KPI graphs are shown as results, a scene-by-scene wizard reappears, microtext is used to fit cards, content depends on animation to become visible, or screenshots are sourced from an old map version without labeling.

## 8. Approval gate

Before Phase 4, review a static Hero specimen, one DISCOVER mid-page sample, one EXPLORE screenshot layout, and one ENGINEERING diagram/long-form specimen (desktop/mobile). Select actual media and confirm copy. No public main deployment until these are accepted.

For what to say and media/provenance see [02_CONTENT_STRUCTURE.md](02_CONTENT_STRUCTURE.md). For implementation/CI and preservation see [03_DEVELOPMENT_PLAN.md](03_DEVELOPMENT_PLAN.md).
