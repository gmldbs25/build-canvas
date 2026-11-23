import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const article = readFileSync(new URL('../projects/web-evolution/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../projects/web-evolution/interactive-reading.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../projects/web-evolution/reading-interactions.css', import.meta.url), 'utf8');

test('interactive reading module has valid JavaScript syntax', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', 'projects/web-evolution/interactive-reading.js']));
});

test('HTML loads the Work 7-only reading assets', () => {
  assert.match(article, /href="\.\/reading-interactions\.css"/);
  assert.match(article, /src="\.\/interactive-reading\.js"/);
  assert.match(style, /prefers-reduced-motion/);
  assert.match(style, /:focus-visible/);
});

test('exactly 16 glossary triggers have matching safe content entries', () => {
  const ids = [...article.matchAll(/data-glossary="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 16);
  assert.equal(new Set(ids).size, 16);
  for (const id of ids) {
    assert.match(script, new RegExp('\\b' + id + ': \\[', 'u'));
  }
  assert.match(script, /Escape/);
  assert.match(script, /aria-expanded/);
  assert.match(script, /focus\(\{preventScroll:true\}\)/);
});

test('editorial emphasis and contextual sources are restrained', () => {
  assert.equal((article.match(/class="reading-emphasis"/g) || []).length, 12);
  assert.equal((article.match(/class="history-source"/g) || []).length, 12);
  assert.match(article, /blog\.flickr\.net\/en\/2004\/05\/09/);
  assert.match(article, /1994년에 출발한 Beverly Hills Internet/);
  assert.match(article, /퍼블릭 도메인으로 공개했다/);
  assert.match(article, /정적 재구성/);
});

test('PageRank illustration and optional accessible detail view are present', () => {
  assert.match(article, /id="pagerank-explainer"/);
  assert.match(article, /id="pagerank-diagram-desc"/);
  assert.match(article, /data-reading-detail="pagerank" hidden/);
  assert.match(article, /<dialog id="reading-detail"/);
  assert.match(article, /data-reading-close/);
  assert.match(script, /showModal\(\)/);
  assert.match(script, /detail\.close\(\)/);
});

test('original story scenes and all seven exhibit links are preserved', () => {
  for (const id of ['prologue','connection','discovery','participation','accumulation','action','epilogue','role-scene','learning-scene','data-retrieve','role-work']) {
    assert.ok(article.includes('id="' + id + '"'), id);
  }
  for (const year of ['1993','1998','2001','2005','2013','2023','2026']) {
    assert.match(article, new RegExp('data-era="' + year + '"'));
  }
});
