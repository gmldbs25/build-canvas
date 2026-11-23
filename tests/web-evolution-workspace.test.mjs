import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL('../projects/web-evolution/' + name, import.meta.url), 'utf8');
const html = read('index.html');
const shell = read('exhibit.css');
const css = read('style.css');
const js = read('main.js');

test('exhibit uses one seven-era navigation and a separate browser stage', () => {
  const exhibit = html.split('<div id="exhibit-view"')[1].split('<dialog id="field-notes"')[0];
  assert.ok(exhibit.includes('id="exhibit-sidebar"'));
  assert.ok(exhibit.includes('id="sidebar-toggle"'));
  assert.ok(exhibit.includes('id="era-timeline"'));
  const eraLinks = exhibit.split('id="era-timeline"')[1].split('</nav>')[0];
  assert.deepEqual([...eraLinks.matchAll(/data-era="(1993|1998|2001|2005|2013|2023|2026)"/g)].map((match) => match[1]),
    ['1993', '1998', '2001', '2005', '2013', '2023', '2026']);
  assert.equal((exhibit.match(/id="screen"/g) || []).length, 1);
  assert.equal((exhibit.match(/id="article-return"/g) || []).length, 1);
  assert.equal((exhibit.match(/id="intro-link"/g) || []).length, 1);
  assert.ok(exhibit.indexOf('id="exhibit-sidebar"') < exhibit.indexOf('id="display"'));
  assert.ok(exhibit.includes('aria-keyshortcuts="H"'));
});

test('layout supports expanded, collapsed and mobile, without historical chrome rewrite', () => {
  assert.match(shell, /--sidebar-width:\s*216px/);
  assert.match(shell, /data-sidebar="collapsed"\]\s*\{\s*--sidebar-width:\s*64px/);
  assert.match(shell, /max-width:\s*999px/);
  assert.match(shell, /max-height:\s*559px/);
  assert.match(shell, /container-name:\s*exhibit-page/);
  assert.match(shell, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /\.exhibit-bar\s*\{/);
  assert.doesNotMatch(shell, /\.exhibit-bar\s*\{/);
});

test('sidebar toggling does not render pages or rewrite URLs', () => {
  const fn = js.split('function chooseSidebarMode(mode) {')[1].split('sidebarToggle?.addEventListener')[0];
  assert.ok(fn.includes('syncSidebarLayout()'));
  assert.doesNotMatch(fn, /renderPage\(|selectEra\(|pushState\(|replaceState\(|history\./);
  assert.match(js, /sessionStorage\.setItem\(sidebarStorageKey/);
  assert.match(js, /timelineTrack\.dataset\.indicatorReady/);
  assert.match(js, /\.timeline a\[data-era\]/);
  assert.match(js, /window\.addEventListener\('popstate'/);
  assert.match(js, /'h' && !event\.metaKey/);
});

test('page-width-dependent era layouts use the viewer container', () => {
  for (const name of ['modern.css', 'historical.css', 'pacebook.css', 'poster.css']) {
    assert.match(read(name), /@container exhibit-page/);
  }
  assert.match(read('chrome.css'), /--viewer-bookmark-x/);
  assert.match(read('chrome.css'), /--viewer-center-x/);
});
