# Work 7 — Exhibit Workspace (Option B)

## Scope and source

Applies only to the seven `?era=...` exhibits under `projects/web-evolution/`. It does not change the reading article or its separately implemented interactive-reading improvements.

The workspace uses the original historical browser DOM (`#window > #chrome + #screen + #status`) and original `main.js` routing/history/storage model. The article and exhibit remain separate views.

## Layout contract

- Desktop: a left column of 216px when expanded and 64px when collapsed, plus a fluid browser viewer.
- Initial default: expanded only at viewport width >=1400px and height >=800px; collapsed on other desktop sizes.
- Compact mode: width below 1000px or height below 560px uses the **same** seven era links in a two-row horizontal top navigation. No duplicate timeline.
- UI preference is session-scoped using `build-canvas:web-evolution:sidebar`; blocked sessionStorage leaves a memory-only preference.
- Collapsing the sidebar changes CSS layout and ARIA labels only: it must not call `renderPage()`, trigger requests or mutate the URL, page/scroll, tab, or form state.
- `#screen` is the scroll container and CSS inline-size container named `exhibit-page`. Era-specific width breakpoints are based on this container instead of the full viewport.
- The active era indicator follows the actual selected link offset, updates after era changes, resizing and layout transitions, and falls back to the selected link styling if animation is unavailable.
- `prefers-reduced-motion: reduce` disables workspace transitions.

## Shared controls

Expanded: seven complete era names, short contextual scene hint, article return, home and H shortcut. Collapsed: seven full four-digit years, info-to-expand, article and home icons with accessible names. Mobile: visible four-digit horizontal years, compact return/home controls. The original `aria-current`, `data-era`, `#intro-link`, `#article-return`, and H shortcut remain.

Favorites panel and status Toast use viewer-relative position, preserving existing page events. Native dialogs remain top-layer centered on the viewport and historical menu popovers remain within their chrome.

## Required QA

At 1920x1080, 1600x900, 1440x900, 1366x768, 1280x720, 1024x768, 768x1024, 390x844 and 844x390, verify all seven eras, selected indicator, viewer scroll, no horizontal document overflow, and keyboard focus. Measure the baseline and redesigned `#window` and `#screen` client rects. Check desktop collapsed and expanded separately, plus boundaries at 999/1000px, 1399/1400px and heights 559/560px, 799/800px.

Functional smoke tests: `?era=1998&page=guestbook`, `?era=2026&from=action`, `?era=2025` alias; article return, Home/H with editable focus exception; browser back/forward/refresh, tabs, bookmarks, zoom, reload, dialogs and scroll. Confirm the sidebar toggle preserves the same `#screen` node, scrollTop and in-progress text input.

Automated structural tests are in `tests/web-evolution-workspace.test.mjs`. Browser screenshot and rect measurements must be reported separately; passing structural tests alone is not a claim of visual validation.

## Changed files

- `index.html`: exhibit sidebar DOM (article markup unchanged)
- `exhibit.css`, `style.css`: shell, responsive layout and animations
- `main.js`: UI-only sidebar preference and active lens synchronization
- `chrome.css`: viewer-relative bookmark and toast positioning
- `modern.css`, `historical.css`, `pacebook.css`, `poster.css`: local content-width breakpoints
