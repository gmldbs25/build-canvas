# FAB FLOW — Work6 Development Plan

> Status: **Phase 2 implementation plan / NOT an implementation authorization** · 2026-11-03  
> Repository `gmldbs25/build-canvas` · starting main `457e9e895673b175ab7ed319b5fa27385f4c7751`  
> Separate evidence-only source `gmldbs25/fab_flow` main `7a1ad9b36ccbf2c173a3676d85b7f790111378f7` (private; **must not edit**).  
> Work branch `work6/editorial-showcase-plan-20261103`. Public app must remain untouched until user approves Phase 3 direction.  
> **Only current instructions:** [01_ARTICLE_DESIGN.md](01_ARTICLE_DESIGN.md), [02_CONTENT_STRUCTURE.md](02_CONTENT_STRUCTURE.md), this document. Six former 11/8-Scene plans are in [archive/](archive/) for history only.

## 0. Baseline & boundaries

**Phase 1 source audit completed:** GitHub main tree inspected on 2026-11-03. Work6 is a separate Vite/React static subsite, built through `scripts/build-pages.sh` at `/build-canvas/fab-flow-preview/`. The portfolio front page and Work1–5 are independently built in the same Pages pipeline. There are two old Work6 CI workflows, `work6-ci.yml` and `work6-prototype.yml`. Work6 source currently imports a full engine and Three.js render loop.

**Known baseline files:**

| Path | Phase 2 | Target Phase 4 action | Reason |
|---|---|---|---|
| `projects/fab-flow/index.html` | keep | update title/description/OG metadata | New article title, current title is old “MCS Today & Tomorrow” |
| `projects/fab-flow/package.json` | keep | remove `three`, `@types/three` if no article dependencies; keep React/Vite/TS/Playwright only if used | Remove runtime weight |
| `projects/fab-flow/vite.config.ts` | keep | retain Vite + `base` handling; confirm `/build-canvas/fab-flow-preview/` | Stable public URL |
| `projects/fab-flow/src/main.tsx` | keep | render `ArticlePage` and new article styles, remove `original-tycoon.css` import | Clear entry point |
| `projects/fab-flow/src/work6.tsx` | keep | replace Scene runtime with article composition; may rename/alias to `ArticlePage.tsx` | No stateful simulator |
| `projects/fab-flow/src/work6-scenes.ts` | keep | delete | Superseded Scene model |
| `projects/fab-flow/src/components/ThreeFacilityScene.tsx` | keep | delete | 3D canvas renderer not used |
| `projects/fab-flow/src/components/FacilityScene.tsx`, `MultiLargeFacilityScene.tsx`, `FacilityAssets.tsx` | keep | delete **if** import graph proves unused | Old facility preview/fallback |
| `projects/fab-flow/src/components/` other helpers and CSS | keep | delete only orphaned dependencies after graph/grep | 3D camera, rail, material utilities |
| `projects/fab-flow/src/sim/` (native engine, graph, state, tutorials, experiments, layouts) | keep | remove after no imports; **do not embed runtime** | Content now uses static evidence |
| `projects/fab-flow/src/routeStudy.ts`, `nativeGraphExample.ts`, `introScenario.ts`, `scene7Traffic.ts` | keep | delete | Interactive studies |
| `projects/fab-flow/src/useAmbientIntro.ts`, `usePressureWorld.ts`, `useFutureFab.ts` | keep | delete | Old simulation hooks |
| `projects/fab-flow/src/original-tycoon.css` | keep | delete | Old tycoon/Three.js UI |
| `projects/fab-flow/src/work6.css` | keep | replace with editorial tokens/layout | Design system |
| `projects/fab-flow/scripts/browser-smoke.mjs` | keep | replace with accessible article smoke and link/media tests | Current smoke tests real WebGL/ticks |
| `.github/workflows/work6-ci.yml` | keep | convert to article TS/build/Playwright smoke | New purpose |
| `.github/workflows/work6-prototype.yml` | keep | remove or merge into single new CI after testing | Avoid duplicate old 3D smoke |
| `scripts/build-pages.sh` | keep | preserve stable destination; update obsolete Work6 comments | Aggregate Pages |
| `app/page.tsx` / other projects | keep | NO functional change | Preserve Works/home |
| `docs/fab-flow/archive/` | move six docs now | permanent historical archive | Avoid old instructions taking precedence |

**Out-of-scope (never change as part of this work):** `gmldbs25/fab_flow` source/config, authenticated app state, Work1–5 content, portfolio home list order, deployment route, Git history, other workflows except direct Work6 CI and necessary shared build integration.

## 1. Critical build/deployment facts

Current root `scripts/build-pages.sh` runs primary portfolio build, packages ORCA/Transformer/other Works, then runs Work6:
1. `npm install --prefix projects/fab-flow --package-lock=false --no-audit --no-fund` on Linux, local node_modules check otherwise.
2. `npm run typecheck --prefix projects/fab-flow`.
3. `GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/fab-flow-preview npm run build --prefix projects/fab-flow`.
4. Copies `projects/fab-flow/dist-pages/.` → `dist-pages/fab-flow-preview/`.

`projects/fab-flow/vite.config.ts` consumes `PAGES_BASE_PATH` with trailing slash. Ensure images are emitted via Vite public directory / imported assets and have correct basename; **no root-absolute `/media/foo`** URLs on Pages. Use `import.meta.env.BASE_URL` or equivalent for `public/media/*` references. Retain article URL exactly `https://gmldbs25.github.io/build-canvas/fab-flow-preview/`; do not rename it to `/fab-flow/` just because Vite's fallback base mentions it.

Main Pages deployment occurs on pushes to `main` via `.github/workflows/deploy-pages.yml`. A topic branch **does not publish automatically** through that workflow. Never push a half-built article to main.

**Baseline acceptance before deletion:** capture current main SHA, full file inventory, current scripts, `npm run typecheck`/`build`/smoke baseline after local install if available. A source audit alone is not a claim of passing build. Review Git diff and asset sizes at each step.

## 2. Target architecture (static editorial site)

Suggested minimal tree after the user signs off (names may change if equivalent responsibilities remain clear):

`
projects/fab-flow/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  public/media/
    manifest.json                 # asset provenance, scenario metadata, verified captions
    hero-factory.webp
    transport-sequence.webm       # only if approved; poster/transcript alongside
    ...
  src/
    main.tsx
    ArticlePage.tsx
    article.css                   # tokens, layout, mobile, reduced motion, print
    content/
      chapters.ts                 # 00–10 text, captions, source references
    components/
      Hero.tsx                    # title, actual media, primary CTA
      Chapter.tsx                 # semantic sections, anchored headers
      Figure.tsx                  # lazy responsive picture, attribution/caption
      MediaPlayer.tsx             # poster/controls/fallback, never game runtime
      TechnicalDisclosure.tsx     # native details/summary, source excerpt text
      ArticleNav.tsx              # optional lightweight section anchors
      diagrams/                   # static SVG diagrams only
  scripts/
    browser-smoke.mjs             # article tests, no native transport
docs/fab-flow/
  01_ARTICLE_DESIGN.md
  02_CONTENT_STRUCTURE.md
  03_DEVELOPMENT_PLAN.md
  archive/                         # historical docs
`

Keep the generated article mostly data-driven for content updates, but do **not** force visually identical chapter templates. A single chapter component can provide semantic structure; specialized layouts choose visual treatments. Render the Korean prose directly from a reviewed content source, not runtime-generated guesses. No frontend API, no data fetch to private GitHub repo, no FAB simulation worker, no Three.js, no login/storage state.

**Semantic structure:** document with `<header>` hero, `<main><article>` and `<section id="chapter-00">` through `chapter-10`, clear `h1/h2/h3`. Figures with `<figure><figcaption>`, code in `<pre><code>`, optional native `<details><summary>`, end CTA external anchor. Use link `href` to actual app; support `H` home except text entry and modifiers, document `lang=ko`. Progressive enhancement; lack of JS must not hide text.

## 3. Source facts and media ingestion workflow

FAB FLOW is **private**, so the public build must not link asset URLs hosted in a private repository or require users to authenticate. Do **not** vendor the entire private project or lift its entire source tree into a public article. A **small, reviewed, rights-cleared, optimized export** of genuine media and a few hand-audited *explanatory* code snippets is sufficient.

**Before capture**:
1. Verify remote app loads on desktop and mobile, and record the **actual deployed** Vercel SHA/build (GitHub status/release receipt or deployment metadata); current source main alone is insufficient to prove parity. If a browser cannot reach it, report the blocker and do not call historical screenshots “live”.
2. Select layout V6 `small/medium/large`, seed, initial fleet, policy and demand; record all values. Choose one clean cinematic Hero scene with OHT/FOUP visible.
3. Collect screenshot/video candidates from `fab_flow/docs/operations-analysis/1.1/evidence/`, `docs/screenshots/3d-tycoon/after/` and `docs/operations/default-fab/`. Treat all as *historical candidates* until the configuration and source version match.
4. Check for sensitive information, private URLs, account names, browser chrome, debug overlays or personal data in every frame before copying to the public Build Canvas repo.
5. Capture real browser screenshots at 1920×1080 and 1440×900, plus mobile framing at 390×844 (other sizes for validation); prefer video recorded from the real application and trim only narrative time. Never simulate missing gameplay with fabricated design.
6. Export responsive images as WebP/AVIF and optional larger click-through; use readable captions, meaningful alt text, video poster and transcript. Keep exact asset hash, source path and capture metadata in `public/media/manifest.json`; use clearly labeled historical media if current capture unavailable. Never export secret or bulk internal report artifacts.

**Controlled demand visual experiment for Chapter 04:** same main commit, layout, seed, policy, fleet, graphics, camera, fixed simulation elapsed time; alter one demand control only, record complete scenario and KPI. It may represent two controlled executions, not a one-session before/after with different elapsed durations. Confirm there are no implicit changes from random state/other interventions. If impossible: use two separate observational screenshots and label them as such.

**Diagram delivery:** use in-repo SVG or small React-rendered SVG components with accessible title/description; graph arrows match directed Link semantics. Distinguish conceptual Node/Link/Port diagram from exact sampled V6 path. No static pseudo-3D code geometry. Code excerpt attribution should cite repository SHA/path/function, optionally line span after freeze. No code listing of a private module at full length.

**Performance panel:** annotate chosen historical evidence `docs/operations-analysis/1.1/FINAL_REPORT.md`. Native `ms/tick` is *not* FPS or wall-clock playback. Native Large300 DBR 20.248→14.912 mean, p95 55.781→35.173; CBR 18.623→14.694 mean, p95 60.495→34.474; Small8 DBR 0.102→0.123 regression. Include both context and regression, explicit test methodology/host limitations. Do not recompute percentage then claim universal improvement; consult report and raw evidence if used in infographic.

## 4. Implementation phases / exit gates

### P0 — Snapshot & inventory (read-only, completed at source level)

- Verify connected `build-canvas/main` and `fab_flow/main`, exact SHAs, 6 historical docs, Work6 project files and workflows.
- Run baseline commands on actual checkout when available; record any missing environment. Audit Git references to legacy document names.
- Produce deletion list based on **import graph**, not mere filename matches. Check path usages in tests and build scripts.
- **Gate:** report facts, ambiguous feature flags, deployment verification unavailable; no destructive edits.

### P1 — Documentation-only proposal (**current phase**)

- Move the 6 legacy documents into `docs/fab-flow/archive/`, preserving Git objects/history; no archived Scene design is active.
- Create three official documents with chapter copy, layout and verifiable facts.
- Commit only docs to a new topic branch. **Do not modify `projects/fab-flow`, Build Canvas `main`, `fab_flow` or Actions in P1.**
- **Gate:** three docs cross-link correctly, target app/Pages routes accurate, source paths reviewed, open decisions enumerated; user receives review link. Phase 3+ require user approval.

### P2 — Content & media freeze (**after approval**)

- Decide Hero copy/visual angle, 11 chapter headlines and paragraphs, desktop/mobile sample frames.
- Confirm live deployed SHA and capture script; select authentic M01–M12 media as defined in 02; audit permissions/privacy and versions.
- Verify MCS DBR/CBR wording, topology counts, Native Tick scheduling, persistence limitations and one reproducible benchmark figure.
- Produce static design specimens for desktop Hero, mobile Hero, a feature spread, and a technical figure. Reject generic repeated cards.
- **Gate:** source-backed copy + asset manifest + approved visual direction. No implementation before content is stable enough.

### P3 — Article scaffold in branch

- Implement semantic article sections, basic CSS tokens/type/grid, responsive typography and primary CTA at Hero/end.
- Preserve H shortcut and home link, current site base URL and portfolio integration.
- Add minimal Figure/Disclosure components; **no Native Engine import**.
- Use only approved media; if missing, mark development-only placeholder text and **do not deploy** placeholder.
- **Gate:** all 11 chapters readable with JS on/off where possible; static build functional with no missing assets.

### P4 — Media, diagrams and technical polish

- Insert genuine screenshots/video, captions, provenance and two/three source-based SVG diagrams; cover Chapter 04 controlled evidence and Chapter 09 bounded metrics.
- Improve mobile crops, wide displays, slow network behavior, video failure fallback, keyboard/focus and accessible disclosure.
- Check build output for accidental `three` / simulation engine inclusion. Use bundle analyzer/grep or Vite output stats; no need to retain 3D just to make a technical figure.
- **Gate:** chapter-to-evidence consistency and asset manifest audited.

### P5 — Legacy removal and CI migration

- From successful lightweight article import graph, delete old Scene source, `sim/`, hooks, renderer helper modules, old CSS, and obsolete scene tests. Keep files only if justified by new article dependency.
- Remove Three.js dependency and types once build/typecheck confirm no imports; keep React if meaningful.
- Replace `browser-smoke.mjs` with new article accessibility/link/responsive smoke. Consolidate duplicate CI after confirming parity; rename workflow according to new article purpose.
- **Gate:** clear diff with deletion inventory; build and article smoke passing, old scene tests intentionally removed not silently skipped.

### P6 — Full integration + preview

- Branch build: `npm run typecheck --prefix projects/fab-flow`, `GITHUB_PAGES=true PAGES_BASE_PATH=/build-canvas/fab-flow-preview npm run build --prefix projects/fab-flow`; inspect `dist-pages` asset paths. Root `npm run build:pages` and `npm test`/`npm run lint` as supported by environment.
- Browser smoke against built static output, not only Vite dev server. Check real URLs.
- Test modern Chromium/WebKit where available, 1920/1440/1366/1024/768/390/375/360 widths. Check keyboard, touch and reduced motion. Compare portfolio home + Works1–5 for any break.
- Capture actual article screenshots for visual review; if preview cannot be provided without deployment, provide static artifact screenshots/temporary local preview without touching public main.
- **Gate:** user final approval, no critical regression, all media and hyperlinks verified.

### P7 — Controlled release (**only after explicit approval**)

- Rebase/update branch against latest main; resolve conflicts without overwriting unrelated work.
- Review diff and CI; merge/safe fast-forward to main (never force push). Ensure one main update triggers Pages and stable `/fab-flow-preview/` retains reachability.
- Observe GitHub Actions build and deploy status; check exact output URL and media links on real desktop/mobile. Report final commit/SHA, checks, media versions and any limitations.
- No claim of deployment completion without successful workflow and a verified page response.

## 5. Browser and static acceptance tests

**Minimum automated validations, run after code exists:**

1. Loaded article has one `h1` = FAB FLOW, visible subtitle “반도체 물류 세상”, unique 00–10 `h2` anchors in expected order, and no old Scene `Next/Previous` mechanics.
2. Two visible Play links both navigate to `https://fabflow-yoon.vercel.app/`; link labels are descriptive, never empty/disabled.
3. H key returns to `/build-canvas/` when body focused; H doesn't navigate while input/textarea/contenteditable focused or modifier held. Other works unchanged.
4. JS console has no critical errors; no requests to private GitHub source or third-party auto-generated gameplay data; no request to `/media/` missing base.
5. All `img` have alt/width/height or aspect-ratio reservation; videos show poster and controls, transcript/fallback text available; loading below fold is lazy.
6. Keyboard Tab reachability/visible focus, `details` opens via Enter/Space, links and anchor skips; verify no focus trap.
7. At 360×740, 390×844, 844×390, 1024×768, 1440×900 and 1920×1080 no horizontal scrolling, clipped H2, 12px critical labels or overlapped CTA.
8. `prefers-reduced-motion: reduce` disables reveal/motion without hiding any body text.
9. On slow simulated network/video error, Hero remains usable; no video blocks page interaction.
10. Compare build output to ensure `three` and old `sim/engine` are absent after cleanup; check visible media is from approved manifest.
11. Main homepage Work6 link to `fab-flow-preview/` is unchanged; independent Work1–5 links and local builds still work.
12. 404/refresh behavior for Pages root link remains valid; verify trailing slash and internal `#chapter` anchors.

**Quality targets (targets, not measured P1 outcomes):** >0.9 visual stability for hero, zero critical a11y violations in automated scan plus manual review, no offscreen video decoding work by default, avoid CLS with known media ratios, roughly under 1MB initial media transfer if visuals remain readable, no mandatory 3D/WebGL. Do not invent Lighthouse scores; measure and report them after implementation.

## 6. Failure handling and revert

- Branch work is isolated; current Work6 public page remains live throughout Phase 1–3.
- Keep archive blobs and original commit SHA; never rewrite Git history or delete history of old Scene approach.
- If current Vercel media cannot be verified, explicitly mark CAPTURE REQUIRED and stop before fake assets or misleading claims are introduced.
- If GitHub Pages build unexpectedly alters Work1–5, halt release and repair branch instead of pushing.
- Recovery after release: revert **only the Work6 article commit(s)** after checking integrated changes; do not overwrite concurrent main commits. Historical snapshot available via Git SHA.
- Do not modify `fab_flow`, even to create captures; use app UI or read-only scripts/access in separate ephemeral workspace.

## 7. Document alignment and open decisions

| Decision | Current default | Approval required? |
|---|---|---|
| Article type | One long standard scroll, no game runtime | Already decided in brief |
| Page URL | Keep `/build-canvas/fab-flow-preview/` | Fixed |
| Visual theme | Miniature / Editorial / Engineering, cream/deep-green/mint/amber | Review actual design specimens |
| Hook | “작은 공장 안에서, 물류가 살아 움직인다.” | Yes, final wording |
| Hero media | Source-matched V6 real factory | Yes, chosen screenshot/video |
| Congestion demonstration | Controlled matched demand comparison or separately labeled observations | Evidence-dependent |
| Main benchmark | Historic 1.1 bounded Native Tick case + contrasting regression | Yes, copy/environment check |
| Optional motion | Nearly none; real gameplay media as primary movement | Review |
| Native engine in article | **No** | Fixed |
| Release | Explicit Phase 3–5 user approval required | Fixed |

When designing, **01** governs layout/accessibility, **02** governs chapter text/media/technical claims and **03** governs code/deletion/tests/release. In a conflict, stop and reconcile the three **new** documents—never revive archived 8/11-Scene requirements by default.
