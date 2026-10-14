# Work 05 · KotoMachi development journal

The public article lives in [`content/article.md`](content/article.md). The byline identifies repository-grounded prose as AI Agent narration, while pale green panels contain the developer's own first-person notes and interview answers. Keep article prose and these developer-authored passages in the Markdown; the renderer, reading styles, and behavior are separate. `npm run build:pages` compiles the Markdown into semantic static HTML under `dist-pages/kotomachi/` and copies the images used by the article.

## Editing the article

Use ordinary Markdown headings and paragraphs. Level-two headings are the article sections shown in the desktop sticky table of contents; give each one a stable ID in braces, such as `## 첫 장면 {#beginning}`. Level-three headings, lists, emphasis, links, blockquotes, and images are supported.

Put Agent-sourced prose in ordinary paragraphs and add a short `> 기록:` blockquote at the end of a section to link to commits or source documents. Keep these references close to the claims they support.

Mark a developer note with the existing `:::human-note` Markdown directive (the internal marker is retained for compatibility):

```md
:::human-note
**개발자 노트 · 직접 작성한 기록**  
여기에 개발자가 직접 작성한 경험과 생각이 들어갑니다.
:::
```

The pale green panels identify passages written by the developer, not AI Agent narration. Existing first-person notes and interview answers are complete and must not be rewritten without the developer's request. Keep the internal `:::human-note` and `:::human-answer` markers for compatibility; they render as **개발자 노트** and **개발자의 답변**. For any new, unanswered interview question, use a clear placeholder rather than inventing a first-person reply.

Each major development section can include **one optional technical appendix**. It uses a reusable `:::technical-details | label | subtitle` directive and closes with `:::`. Both metadata fields are plain text and must not contain the `|` separator. The old bare `:::technical-details` syntax still renders the original TTS title and subtitle for backward compatibility. Every block becomes an independent, initially closed, keyboard-accessible native HTML `<details>` element.

```md
:::technical-details | 비주얼 재설계 과정 자세히 보기 | Pixel baseline → renderer → Golden Scene
### 01. The original limitation

Technical explanations grounded in code, design milestones, and actual results.

### 02. Revised implementation

Continue inside the same expanded story; include compact source references.
:::
```

Use level-three headings for the chronology, but never nest `:::` directives inside this block. Keep main article prose concise and preserve developer-authored notes and interview answers verbatim. These headings do not create additional desktop TOC entries. The reader's progress indicator recalculates on each toggle. The current Work 5 has four technical appendices in total: platform/save architecture, visual rework, Agent orchestration, and TTS voice production; it intentionally does not expand the learning section.

Add a figure with a Markdown image and one italic caption:

```md
:::figure
![이미지에 보이는 내용](assets/example.webp)
*캡션은 장면과 개발 과정에서의 의미를 짧게 설명합니다.*
:::
```

Store only the images used in `assets/`; keep the long edge at or below 1,280 px and prefer WebP under 220 KB. The original KotoMachi screenshots remain in that repository; this Work contains optimized copies so it can build independently.

## Reading behavior

`article.css` owns the article layout. `reading.js` owns the progress bar, active TOC section, smooth anchor navigation, and `H` to Home shortcut. Keep the article comfortable to read on mobile; the TOC is desktop-only. The article has no Work 1–5 navigation.

The local evidence record is [`docs/kotomachi/work5-source-notes.md`](../../docs/kotomachi/work5-source-notes.md). It records the final Chapter 1 voice-production checkpoint at `d8e8e53` on 2026-10-07 (app 1.2.8, 414/414 eligible utterances deployed), with human/device validation limits distinguished from feature completion. KotoMachi is private and has no license; the article's commit/document links may require repository access, so the article explains the project and technical decisions in place. Update the notes' baseline and review each factual statement against KotoMachi history when refreshing the article.

## Build

```sh
node projects/kotomachi/scripts/build-article.mjs --output=/tmp/kotomachi-article
npm run build:pages
```
