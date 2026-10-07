import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
const outputDir = path.resolve(outputArg ?? path.join(projectDir, 'dist'));
const markdown = await readFile(path.join(projectDir, 'content/article.md'), 'utf8');

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function safeUrl(value) {
  const url = value.trim();
  if (/^https?:/i.test(url) || /^(\.\.?\/|\/|#)/.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.includes('\\')) return '#';
  return url;
}

function inline(text) {
  const tokens = [];
  const hold = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  let source = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) =>
    hold(`<img src="${escapeHtml(safeUrl(url))}" alt="${escapeHtml(alt)}" width="1280" height="720" loading="lazy" decoding="async">`));
  source = escapeHtml(source);
  source = source.replace(/\[([^\]]+)\]\((https?:[^\s)]+|\.\.?\/[^\s)]+|\/[^\s)]+|#[^\s)]+)\)/g, (_match, label, url) => {
    const href = escapeHtml(safeUrl(url));
    const external = /^https?:/i.test(url);
    return hold(`<a href="${href}"${external ? ' target="_blank" rel="noreferrer noopener"' : ''}>${label}</a>`);
  });
  source = source.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  source = source.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  source = source.replace(/`([^`]+)`/g, '<code>$1</code>');
  return source.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)]);
}

function renderBlocks(source) {
  const lines = source.split(/\r?\n/);
  const rendered = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i += 1; continue; }

    const blockStart = line.match(/^:::(human-note|human-answer|figure)$/);
    if (blockStart) {
      const body = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
      i += 1;
      const type = blockStart[1];
      if (type === 'figure') {
        const img = body.find((entry) => entry.trim().startsWith('!['));
        const caption = body.find((entry) => entry.trim().startsWith('*') && entry.trim().endsWith('*'));
        rendered.push(`<figure>${img ? `<div class="article-figure-image">${inline(img.trim())}</div>` : ''}${caption ? `<figcaption>${inline(caption.trim().slice(1, -1))}</figcaption>` : ''}</figure>`);
      } else {
        const className = type === 'human-note' ? 'human-note' : 'human-answer';
        const label = type === 'human-note' ? 'Human Note' : 'Human의 답변';
        const ariaLabel = type === 'human-note' ? 'Human이 작성하는 코멘트' : 'Human이 작성하는 인터뷰 답변';
        rendered.push(`<aside class="${className}" aria-label="${ariaLabel}"><p class="speaker-label">${label}</p>${renderBlocks(body.join('\n'))}</aside>`);
      }
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?$/i);
    if (heading) {
      const level = heading[1].length;
      const tag = `h${level}`;
      const id = heading[3] ? ` id="${heading[3]}"` : '';
      rendered.push(`<${tag}${id}>${inline(heading[2])}</${tag}>`);
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
      rendered.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i++].trim().replace(/^[-*]\s+/, ''))}</li>`);
      rendered.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    const paragraph = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() &&
      !/^(#{1,6})\s|^:::(human-note|human-answer|figure)$|^>\s?|^[-*]\s+/.test(lines[i].trim())) {
      paragraph.push(lines[i++].trim());
    }
    rendered.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return rendered.join('\n');
}

const lines = markdown.split(/\r?\n/);
const titleLine = lines.find((line) => line.startsWith('# '));
if (!titleLine) throw new Error('Article needs a level-one title.');
const title = titleLine.slice(2).trim();
const titleIndex = lines.indexOf(titleLine);
let deckStart = titleIndex + 1;
while (deckStart < lines.length && !lines[deckStart].trim()) deckStart += 1;
const deckLines = [];
for (let i = deckStart; i < lines.length && lines[i].trim() && !lines[i].startsWith('#'); i += 1) deckLines.push(lines[i].trim());
const deck = deckLines.join(' ');
let contentStart = deckStart + deckLines.length;
while (contentStart < lines.length && !lines[contentStart].trim()) contentStart += 1;
const rawArticleBody = renderBlocks(lines.slice(contentStart).join('\n'));
const articleBody = rawArticleBody.split(/(?=<h2 id=")/).filter(Boolean)
  .map((section) => {
    const id = section.match(/^<h2 id="([^"]+)">/)?.[1];
    return id ? `<section aria-labelledby="${escapeHtml(id)}">${section}</section>` : section;
  }).join('\n');

const sections = [...articleBody.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
if (!sections.length) throw new Error('Article needs at least one level-two section for the table of contents.');

const toc = sections.map(([, id, label]) => `<li><a href="#${escapeHtml(id)}">${label}</a></li>`).join('\n');
const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f6f3ec">
    <meta name="description" content="${escapeHtml(deck)}">
    <title>${escapeHtml(title)} — KotoMachi 개발 기록 · Build Canvas</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23f6f0e5'/%3E%3Cpath d='M25 6.5C17.5 7 10.4 10.1 7.4 18.9c3.9-2.8 7.2-3.8 11.5-3.7-3.6 1.5-6.7 4.2-8.8 8.6 8.9-.2 15.2-7.6 14.9-17.3Z' fill='%23d98662'/%3E%3Cpath d='M7.6 25.1c4.1-5 8.2-8.5 13.3-11.5' stroke='%2387604a' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E">
    <link rel="stylesheet" href="./article.css">
    <script type="module" src="./reading.js"></script>
  </head>
  <body>
    <a class="skip-link" href="#article-content">본문으로 건너뛰기</a>
    <div class="reading-progress" role="progressbar" aria-label="읽기 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
    <header class="site-header">
      <a class="brand" href="../" aria-label="Build Canvas 홈">build <span>_</span> canvas</a>
      <a class="home-hint" href="../"><kbd>H</kbd> 홈</a>
    </header>
    <main id="article-content">
      <header class="article-header">
        <p class="article-eyebrow">WORK 05 <span>·</span> DEVELOPMENT JOURNAL</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="article-deck">${escapeHtml(deck)}</p>
        <p class="article-meta"><span>AI Agent의 저장소 기반 기록</span><span aria-hidden="true">/</span><span>Human Note와 인터뷰 답변은 작성 대기 중</span><span aria-hidden="true">/</span><span>2026.10.06</span></p>
      </header>
      <div class="reading-layout">
        <aside class="toc-rail">
          <nav class="toc" aria-label="이 글의 목차">
            <p class="toc-label">이 글의 순서</p>
            <ol>${toc}</ol>
          </nav>
        </aside>
        <article class="article-body">${articleBody}</article>
      </div>
    </main>
    <footer class="article-footer">
      <a href="../">← Build Canvas로 돌아가기</a>
    </footer>
  </body>
</html>`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'index.html'), html);
await cp(path.join(projectDir, 'article.css'), path.join(outputDir, 'article.css'));
await cp(path.join(projectDir, 'reading.js'), path.join(outputDir, 'reading.js'));
await cp(path.join(projectDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true });
console.log(`Built Work 5 article to ${outputDir}`);
