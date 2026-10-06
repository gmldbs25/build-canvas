# Work 05 · KotoMachi development journal

The public article lives in [`content/article.md`](content/article.md). The byline identifies the repository-grounded prose as AI Agent narration; green panels identify the places where heeyoon can add personal context. Keep prose and Human-authored answers there; the page renderer, reading styles, and behavior are separate. `npm run build:pages` compiles the Markdown into semantic static HTML under `dist-pages/kotomachi/` and copies the images used by the article.

## Editing the article

Use ordinary Markdown headings and paragraphs. Level-two headings are the article sections shown in the desktop sticky table of contents; give each one a stable ID in braces, such as `## 첫 장면 {#beginning}`. Level-three headings, lists, emphasis, links, blockquotes, and images are supported.

Put Agent-sourced prose in ordinary paragraphs and add a short `> 기록:` blockquote at the end of a section to link to commits or source documents. Keep these references close to the claims they support.

Mark an open Human Note with this block syntax:

```md
:::human-note
**Human Note · 직접 작성할 자리**  
여기에 heeyoon이 본인의 생각이나 경험을 직접 작성합니다.
:::
```

The pale green panel marks Human-authored material. Its current prose explicitly says it is a placeholder. Replace that prose only with heeyoon's own words; keep the `:::human-note` marker and do not add a first-person answer on his behalf. Use `:::human-answer` for each Developer Interview response. The renderer labels it as a Human answer space. Until heeyoon writes the answer, leave a clear placeholder in the block.

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

The local evidence record is [`docs/kotomachi/work5-source-notes.md`](../../docs/kotomachi/work5-source-notes.md). It records a KotoMachi snapshot at `791170e` on 2026-10-06. KotoMachi is private and has no license; the article's commit/document links may require repository access, so the article explains the project and technical decisions in place. Update the notes' baseline and review each factual statement against KotoMachi history when refreshing the article.

## Build

```sh
node projects/kotomachi/scripts/build-article.mjs --output=/tmp/kotomachi-article
npm run build:pages
```
