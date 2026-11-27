import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { displayFormula } from './formulas.mjs';
import { primePowerEvents } from '../core/counting.mjs';
import { labs, legacy, parts, questions, terms, title } from './contents.mjs';

const base = fileURLToPath(new URL('../', import.meta.url));
const work = dirname(base.slice(0, -1));
const docs = resolve(work, '../docs/riemann-lean/textbook-v2');
const output = resolve(process.argv.find(arg => arg.startsWith('--output='))?.slice(9) ?? join(work, 'dist'));
const origin = 'https://gmldbs25.github.io/build-canvas/riemann-lean/';
const manuscript = (await Promise.all(
  ['MANUSCRIPT-01-07.md', 'MANUSCRIPT-08-12.md'].map(file => readFile(join(docs, file), 'utf8')),
)).join('\n\n');
const chapters = new Map();
let prologue;
let epilogue;
const references = [];
const seenLabs = new Set();
let questionCount = 0;
for (const [, heading, text] of manuscript.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^#{1,2} |$(?![\s\S]))/gm)) {
  const chapter = heading.match(/^Chapter (\d\d)\. (.*)$/);
  if (chapter) chapters.set(chapter[1], { id: chapter[1], label: chapter[2], text: text.trim() });
  if (heading.startsWith('Prologue')) prologue = { label: heading.split(' — ')[1], text: text.trim() };
  if (heading.startsWith('Epilogue')) epilogue = { label: '증명한다는 것과 이해한다는 것', text: text.trim() };
  if (heading.startsWith('출처')) references.push(text.trim());
}
if (chapters.size !== 12 || !prologue || !epilogue) throw new Error('Incomplete textbook manuscript');

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function inline(value) {
  return escape(value)
    .replace(/https?:\/\/[^\s<&]+/g, match => {
      const url = match.replace(/[;.,]+$/, '');
      return `<a href="${url}">${url.replace(/^https?:\/\//, '')}</a>${match.slice(url.length)}`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\x60([^\x60]+)\x60/g, '<code>$1</code>')
    .replace(/(x|p|n|e|z|2)\^\(([^()]+)\)/g, '$1<sup>$2</sup>')
    .replace(/Chapter (\d{2})/g, '<a class="cross-ref" href="../chapter-$1/">$1장</a>');
}

function lab(id, prompt) {
  const entry = labs[id];
  if (!entry || seenLabs.has(id)) throw new Error(`Unexpected lab ${id}`);
  seenLabs.add(id);
  const [label, example, kind] = entry;
  const slug = id.toLowerCase();
  // The wave controls include a guided sequence, so keep the full manuscript list beside those controls as a reference.
  const list = id === '09-A' ? prompt.indexOf('<ul>') : -1;
  const longModel = id === '10-A' && prompt.match(/^<p>(.*?움직이지 않는다\.)(.+)<\/p>$/);
  const intro = longModel ? `<p>${longModel[1]}</p>` : list < 0 ? prompt : prompt.slice(0, list);
  const guide = longModel ? `<details class="lab-context lab-guide"><summary>가상 모형의 조건과 한계</summary><p>${longModel[2].trim()}</p></details>`
    : list < 0 ? '' : `<details class="lab-context lab-guide"><summary>실험 순서와 관찰 질문</summary>${prompt.slice(list)}</details>`;
  return `<section class="lab wide" id="${slug}" data-lab="${slug}" aria-labelledby="label-${slug}">
    <div class="lab-top"><div><span class="lab-kind">${kind}</span><h3 id="label-${slug}">${label}</h3></div>
    <div class="lab-actions"><a href="#${slug}" aria-label="${label} 바로가기">링크</a><button hidden type="button" data-expand>확대</button></div></div>
    <div class="lab-context">${intro}</div>
    <div class="lab-workspace">
      <div data-lab-mount><p class="example"><strong>대표 관찰</strong> ${example}</p>
      <noscript><p>스크립트를 켜면 실험의 값을 바꿔 볼 수 있습니다.</p></noscript></div>
    </div>
    ${guide}
  </section>`;
}

function renderBlocks(source, { inChapter = false } = {}) {
  return source.trim().split(/\n\s*\n/).filter(Boolean).map(block => {
    const trimmed = block.trim();
    if (trimmed.startsWith('**확인 문제와 해설**')) {
      const problems = trimmed.split('\n').slice(1).map(line => {
        const match = line.match(/^(\d+)\. (.*?) — (.+)$/);
        if (!match) throw new Error(`Invalid assessment: ${line}`);
        questionCount += 1;
        return `<li><p>${inline(match[2])}</p><details><summary>해설 보기</summary><p>${inline(match[3])}</p></details></li>`;
      });
      return `<section class="review" id="review"><h2>확인 문제</h2><ol>${problems.join('')}</ol></section>`;
    }
    if (trimmed.startsWith('**다음 질문:**')) {
      return `<aside class="next-question"><span>다음 질문</span><p>${inline(trimmed.slice('**다음 질문:**'.length).trim())}</p></aside>`;
    }
    if (trimmed.startsWith('**학습 목표:**')) {
      return `<aside class="objectives"><strong>학습 목표</strong><p>${inline(trimmed.slice('**학습 목표:**'.length).trim())}</p></aside>`;
    }
    if (block.startsWith('    ')) return `<pre tabindex="0"><code>${escape(block.replace(/^ {4}/gm, ''))}</code></pre>`;
    const markers = [...trimmed.matchAll(/\[(\d{2}-[A-C])(?: [^\]]+)?\]/g)];
    if (inChapter && markers.length) {
      const intro = trimmed.slice(0, markers[0].index).trim();
      return (intro ? renderBlocks(intro) : '') + markers.map((match, n) => {
        const prompt = trimmed.slice(match.index + match[0].length, markers[n + 1]?.index).trim();
        return lab(match[1], renderBlocks(prompt));
      }).join('\n');
    }
    if (trimmed.startsWith('- ')) {
      return `<ul>${trimmed.split('\n').map(line => `<li>${inline(line.replace(/^- /, ''))}</li>`).join('')}</ul>`;
    }
    const listStart = trimmed.indexOf('\n- ');
    if (listStart > -1) return renderBlocks(trimmed.slice(0, listStart)) + renderBlocks(trimmed.slice(listStart + 1));
    const rendered = [];
    let paragraph = [];
    for (const line of trimmed.split('\n')) {
      const formula = displayFormula(line);
      if (!formula) {
        paragraph.push(inline(line));
        continue;
      }
      if (paragraph.length) rendered.push(`<p>${paragraph.join('<br>')}</p>`);
      rendered.push(formula);
      paragraph = [];
    }
    if (paragraph.length) rendered.push(`<p>${paragraph.join('<br>')}</p>`);
    return rendered.join('');
  }).join('\n');
}

const sourceMap = await readFile(join(docs, 'PROOF-SOURCE-MAP.md'), 'utf8');
const proofSupplement = sourceMap.split(/^## Chapter 12\.4[^\n]*\n/m)[1].split(/^## /m)[0].trim();
const byChapter = id => parts.find(part => part.chapters.includes(id));
const chapterHref = (id, up = './') => `${up}chapter-${id}/`;
const chapterLink = (id, up, current) => {
  const { label } = chapters.get(id);
  return `<a href="${chapterHref(id, up)}"${id === current ? ' aria-current="page"' : ''} data-chapter-link="${id}"><span class="chapter-num">${id}</span><span>${label}</span></a>`;
};

function tableOfContents(up, current) {
  return `<nav class="toc" aria-label="전체 차례">
    <a class="toc-start" href="${up}#prologue">프롤로그</a>
    ${parts.map(part => `<section><h2><span>${part.numeral}</span> ${part.title}</h2><ol>${part.chapters.map(id => `<li>${chapterLink(id, up, current)}</li>`).join('')}</ol></section>`).join('')}
    <a href="${up}epilogue/">에필로그</a><a href="${up}glossary/">용어집 · 출처</a>
  </nav>`;
}

function page({ label, up = './', slug = '', id = '', body, chapter = false, heading, wave = false }) {
  const isDark = Number(id) >= 11 && chapter;
  const canonical = origin + slug;
  const description = id ? questions[id] : '소수의 분포에서 리만 가설과 Lean 형식 증명까지, 열두 장과 스물다섯 실험으로 읽는 인터랙티브 교과서.';
  return `<!doctype html>
<html lang="ko"${isDark ? ' data-paper="terminal"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${isDark ? '#11161d' : '#f7f3e9'}">
<meta name="description" content="${escape(description)}">
<title>${escape(label ? `${label} · ${title}` : title)} | Build Canvas</title>
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(label ?? title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://gmldbs25.github.io/build-canvas/share/work-08.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}v2/book/style.css">
${wave ? `<link rel="stylesheet" href="${up}v2/wave/style.css">` : ''}
${chapter && !wave && !isDark ? `<link rel="stylesheet" href="${up}v2/labs/style.css">` : ''}
${isDark ? `<link rel="stylesheet" href="${up}v2/proof/style.css">` : ''}
<script type="module" src="${up}v2/book/reading.mjs"></script>
</head>
<body data-page="${id || slug || 'home'}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="masthead">
  <a class="brand" data-home href="${up}../" aria-label="Build Canvas 홈 (H)">build <b>_</b> canvas</a>
  <a class="work-id" href="${up}">Work 08</a>
  <a class="mast-title" href="${up}">${title}</a>
  <a class="mast-glossary" href="${up}glossary/">용어집</a>
  <details class="mast-contents">
    <summary>차례</summary>
    <div class="mast-panel">${tableOfContents(up, id)}</div>
  </details>
</header>
${chapter ? `<div class="book-frame"><aside class="book-sidebar">${tableOfContents(up, id)}</aside><main id="main" tabindex="-1" class="chapter">${heading}${body}</main></div>` :
`<main id="main" tabindex="-1">${body}</main>`}
<footer class="site-footer"><a href="${up}">Work 08 · ${title}</a><a href="${up}../">Build Canvas ↗</a></footer>
</body></html>`;
}

function renderChapter({ id, label, text }) {
  const part = byChapter(id);
  const num = Number(id);
  const sections = text.split(/^### /m);
  const objectives = renderBlocks(sections.shift());
  const content = sections.map(section => {
    const newline = section.indexOf('\n');
    const header = section.slice(0, newline).match(/^(\d+)\.(\d+) (.+)$/);
    if (!header) throw new Error(`Invalid section in chapter ${id}`);
    const [, a, b, name] = header;
    const hash = `${a}-${b}`;
    const body = section.slice(newline + 1);
    const trailing = body.indexOf('**확인 문제와 해설**');
    const extra = trailing < 0 ? '' : renderBlocks(body.slice(trailing));
    let raw = trailing < 0 ? body : body.slice(0, trailing);
    if (hash === '12-4') raw = raw.replace('[12-A]', `${proofSupplement}\n\n[12-A]`);
    let html = renderBlocks(raw, { inChapter: true });
    if (hash === '7-3') {
      html += '<details class="deep"><summary>심화 · 감마 함수 Γ</summary><p>Re(z)&gt;0에서 Γ(z)=∫₀∞ tᶻ⁻¹e⁻ᵗ dt로 정의하고 Γ(z+1)=zΓ(z)를 이용해 확장한다. 양의 정수 n에서 Γ(n)=(n−1)!이다.</p><p><a href="https://dlmf.nist.gov/5.2">NIST DLMF §5.2</a></p></details>';
    }
    const sectionHead = `<span class="section-num">${a}.${b}</span> ${escape(name.replace(/ \(심화\)$/, ''))}`;
    if (name.endsWith('(심화)')) return `<details class="deep" id="${hash}"><summary>${sectionHead} <span>심화</span></summary>${html}</details>${extra}`;
    return `<section class="lesson" id="${hash}"><h2>${sectionHead}</h2>${html}</section>${extra}`;
  }).join('\n');
  const prev = num === 1 ? ['../#prologue', '프롤로그'] : [chapterHref(String(num - 1).padStart(2, '0'), '../'), chapters.get(String(num - 1).padStart(2, '0')).label];
  const next = num === 12 ? ['../epilogue/', '증명한다는 것과 이해한다는 것'] : [chapterHref(String(num + 1).padStart(2, '0'), '../'), chapters.get(String(num + 1).padStart(2, '0')).label];
  return page({
    up: '../', label, slug: `chapter-${id}/`, id, chapter: true, wave: id === '09',
    heading: `<header class="chapter-head"><p class="eyebrow"><a href="../#part-${part.numeral.toLowerCase()}">제${part.numeral}부 · ${part.title}</a><span>${id} / 12</span></p><h1>${label}</h1><p class="lede">${questions[id]}</p></header>`,
    body: `${objectives}${content}
      ${id === '10' ? `<aside class="paper-terminal"><div><span>제IV부</span><h2>명제에서 증명 코드로</h2><p>“P이면 P다”를 Lean의 타입과 증명 항으로 읽어 본다.</p><a href="../chapter-11/">11장으로 →</a></div><pre aria-label="Lean 예제"><code>example (P : Prop) : P → P :=
  fun h =&gt; h</code></pre></aside>` : ''}
      <div class="study-actions"><button type="button" hidden data-complete>학습 완료 표시</button><a href="../glossary/">용어와 참고문헌</a></div>
      <nav class="chapter-pagination" aria-label="이전 장과 다음 장"><a href="${prev[0]}"><span>← 이전</span>${prev[1]}</a><a href="${next[0]}"><span>다음 →</span>${next[1]}</a></nav>`,
  });
}

function heroFigure() {
  const x = value => 28 + value * 3.18;
  const y = value => 226 - value * 1.86;
  let stair = `M${x(0)},${y(0)}`;
  for (const { n, prefix } of primePowerEvents(100)) {
    stair += `H${x(n).toFixed(2)}V${y(prefix).toFixed(2)}`;
  }
  return `<figure class="hero-graph"><svg viewBox="0 0 380 260" role="img" aria-label="x가 100까지 증가할 때, 소수 거듭제곱에서만 올라가는 ψ(x) 계단과 직선 x">
    <defs><pattern id="paper-grid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="currentColor" opacity=".15"/></pattern></defs>
    <rect x="10" y="12" width="360" height="232" fill="url(#paper-grid)" stroke="currentColor" stroke-opacity=".25"/>
    <path d="M28 31V226H346" fill="none" stroke="currentColor" stroke-opacity=".5"/>
    <path d="M28 226L346 40" fill="none" stroke="currentColor" stroke-dasharray="5 6" opacity=".7"/>
    <path d="${stair}H346" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    <text x="38" y="42">ψ(x)</text><text x="24" y="242">0</text>
    <text x="178" y="242">50</text><text x="330" y="242">100</text>
    <text x="348" y="221">x</text>
  </svg><figcaption><span></span> 소수 거듭제곱의 계단 ψ(x) <i></i> 기준선 x</figcaption></figure>`;
}

const homeBody = `<section class="hero">
  <div><p class="eyebrow">인터랙티브 수학 교과서</p><h1>소수의 <em>파동</em>,<br>기계가 쓴 증명</h1>
  <p class="lede">작은 소수에서 시작해 제타 함수의 영점을 지나, Lean이 증명을 검사하는 곳까지.</p>
  <div class="hero-actions"><a class="primary" href="#prologue">읽기 시작</a><a href="#contents">전체 차례 ↓</a><a hidden data-resume href="#prologue">이어 읽기</a></div>
  </div>${heroFigure()}
</section>
<article id="prologue" class="front-prose"><p class="eyebrow">프롤로그</p><h2>${prologue.label}</h2>${renderBlocks(prologue.text).replaceAll('../chapter-', './chapter-')}
<a class="text-link" href="chapter-01/">첫 장으로 →</a></article>
<section class="front-contents" id="contents"><div class="contents-head"><h2 tabindex="-1">차례</h2><p>4부 · 12장 · 실험 25개</p></div>
${parts.map(part => `<section id="part-${part.numeral.toLowerCase()}" class="part-index ${part.numeral === 'IV' ? 'part-terminal' : ''}">
  <div><p class="eyebrow">제${part.numeral}부</p><h3>${part.title}</h3></div>
  <ol>${part.chapters.map(id => `<li>${chapterLink(id, './')}<p>${questions[id]}</p></li>`).join('')}</ol>
</section>`).join('')}
<nav class="back-matter" aria-label="부록"><a href="./epilogue/">에필로그 →</a><a href="./glossary/">용어집 · 출처 →</a></nav>
<p class="study-status" hidden data-study-status></p><button data-clear hidden type="button">이 브라우저의 학습 기록 지우기</button>
</section>
<nav class="legacy-links" aria-label="이전 Work 08 링크">
${Object.entries(legacy).map(([key, target]) => {
  const [id, section] = target.split('#');
  return `<p id="${key}"><a href="${chapterHref(id)}#${section}">${chapters.get(id).label}으로 이동</a></p>`;
}).join('')}</nav>`;

await mkdir(output, { recursive: true });
for (const dir of ['book', 'core', 'wave', 'labs', 'proof']) {
  const input = join(base, dir);
  let entries;
  try {
    entries = await readdir(input, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  await mkdir(join(output, 'v2', dir), { recursive: true });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.(mjs|css|json)$/.test(entry.name) || ['build.mjs', 'formulas.mjs', 'verify.mjs'].includes(entry.name)) continue;
    await cp(join(input, entry.name), join(output, 'v2', dir, entry.name));
  }
}
await cp(join(work, 'favicon.svg'), join(output, 'favicon.svg'));
for (const chapter of chapters.values()) {
  const dir = join(output, `chapter-${chapter.id}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), renderChapter(chapter));
}
if (questionCount !== 52 || seenLabs.size !== Object.keys(labs).length) {
  throw new Error(`Textbook coverage: ${questionCount} questions, ${seenLabs.size} labs`);
}
await writeFile(join(output, 'index.html'), page({ body: homeBody }));
await mkdir(join(output, 'epilogue'), { recursive: true });
await writeFile(join(output, 'epilogue/index.html'), page({
  up: '../', slug: 'epilogue/', label: epilogue.label,
  body: `<article class="front-prose standalone"><p class="eyebrow">에필로그</p><h1>${epilogue.label}</h1>
  ${renderBlocks(epilogue.text)}<a href="../">차례로 돌아가기 →</a></article>`,
}));
await mkdir(join(output, 'glossary'), { recursive: true });
await writeFile(join(output, 'glossary/index.html'), page({
  up: '../', slug: 'glossary/', label: '용어집과 출처',
  body: `<article class="front-prose standalone"><h1>용어집과 출처</h1><dl class="glossary">${terms.map(([word, definition, id, hash]) =>
    `<dt><a href="${chapterHref(id, '../')}#${hash}">${word}</a></dt><dd>${definition}</dd>`).join('')}</dl>
  <h2 id="sources">참고문헌 및 검증 자료</h2><p>공개 기록 확인 기준일 2026-11-27</p>${references.map(text => renderBlocks(text)).join('')}</article>`,
}));
console.log(`Work 08 · ${chapters.size} chapters, ${seenLabs.size} labs, ${questionCount} answered questions → ${output}`);
