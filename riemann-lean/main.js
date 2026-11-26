import { CODE_WALL, FACTS, GAMMA, PALETTE } from './data.js';
import { initLab, psiTrue, psiApprox, rmsError } from './psi.js';
import { initLean, step as leanStep, getState } from './lean.js';
import { initExperience, openExperience, closeExperience, isExperienceOpen,
  PI_ANCHORS, piExact, psiExact, isPrime, firstPrimeAtOrAbove, previousPrime,
  density, li, amplitude, envelope, crossingX } from './experience.js?v=field-notes';

const root = document.documentElement;
const seam = document.getElementById('seam');
const seamRule = document.querySelector('.seam-rule');
const eraBadge = document.getElementById('era');
const metaTheme = document.getElementById('metaTheme');
const modeToggle = document.getElementById('modeToggle');
const progress = document.getElementById('progress');
const shortcutHelp = document.getElementById('shortcuts');
const sections = [...document.querySelectorAll('main > section[id]')];
const chapterLinks = [...document.querySelectorAll('.chapters a')];
const notes = [...document.querySelectorAll('.note')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const inlineNotes = matchMedia('(min-width: 768px)');
const query = new URLSearchParams(location.search);
const number = new Intl.NumberFormat('ko-KR');
const bridgeLayers = [...seam.querySelectorAll('[data-layer]')];
const pageCounter = document.getElementById('pageCounter');
const lineCounter = document.getElementById('lineCounter');
let positions;
let lastMorph = -1;
let lastBridge = -1;
let activeChapter;
let frame = 0;
let shortcutTimer;

export function formatInt(n) {
  return number.format(n);
}

const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (start, end, t) => start + (end - start) * t;
const ease = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function lerpRGB(start, end, t) {
  return `rgb(${start.map((value, index) => Math.round(lerp(value, end[index], t))).join(' ')})`;
}

function measure() {
  const sticky = seam.firstElementChild;
  positions = {
    seamTop: seam.getBoundingClientRect().top + scrollY,
    seamTravel: Math.max(1, seam.offsetHeight - sticky.offsetHeight),
    maximumScroll: Math.max(1, root.scrollHeight - innerHeight),
    chapters: sections.map(section => ({ id: section.id, y: section.getBoundingClientRect().top + scrollY }))
  };
}

function seamProgress() {
  if (!positions) measure();
  return clamp((scrollY - positions.seamTop) / positions.seamTravel);
}

export function readMorph() {
  const p = seamProgress();
  return reduced.matches ? Number(p >= 0.5) : ease(0.10, 0.88, p);
}

export function setEra(era) {
  const terminal = era === 'terminal';
  const changed = root.dataset.era !== era;
  root.dataset.era = era;
  eraBadge.firstElementChild.textContent = terminal ? '2026' : '1859';
  eraBadge.lastChild.textContent = terminal ? ' · LEAN' : ' · PAPER';
  metaTheme.content = terminal ? '#0B0F14' : '#E4E1D2';
  if (changed) document.dispatchEvent(new CustomEvent('w8:era', { detail: era }));
}

function openNotes() {
  for (const note of notes) note.open = inlineNotes.matches || root.dataset.mode === 'math';
}

export function setMode(mode) {
  mode = mode === 'math' ? mode : 'intuition';
  root.dataset.mode = mode;
  modeToggle.setAttribute('aria-pressed', mode === 'math');
  openNotes();
  document.dispatchEvent(new Event('w8:mode'));
  try {
    localStorage.setItem('w8:mode', mode);
  } catch {
    // The current document can still change modes when storage is unavailable.
  }
}

function renderFacts() {
  const formats = {
    gb: value => `${(value / 1e9).toFixed(2)}GB`,
    length: value => formatInt(value.length),
    tenThousands: value => formatInt(Math.floor(value / 10000)),
    roundedTenThousands: value => formatInt(Math.round(value / 100000) * 10),
    date: value => {
      const [year, month, day] = value.split('-');
      return `${year}년 ${Number(month)}월 ${Number(day)}일`;
    }
  };
  for (const element of document.querySelectorAll('[data-fact]')) {
    const value = element.dataset.fact.split('.').reduce((object, key) => object[key], FACTS);
    const formatter = formats[element.dataset.format];
    element.textContent = formatter ? formatter(value) : typeof value === 'number' ? formatInt(value) : value;
  }
}

function renderSieve() {
  const sieve = document.getElementById('sieve');
  const gaps = document.getElementById('primeGaps');
  const cells = document.createDocumentFragment();
  const marks = document.createDocumentFragment();
  const primes = [];
  const intervals = [];
  let largest = { gap: 0, previous: 0, current: 0 };
  for (let n = 1; n <= 100; n++) {
    const prime = n > 1 && !primes.some(p => p * p <= n && n % p === 0);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.textContent = n;
    cell.tabIndex = n === 1 ? 0 : -1;
    let factorDetail = '';
    if (prime) {
      cell.className = 'is-prime';
      const previous = primes.at(-1);
      if (previous) {
        const gap = n - previous;
        const mark = document.createElement('button');
        mark.type = 'button';
        mark.className = 'prime-gap';
        mark.style.setProperty('--gap-height', `${gap * 4}px`);
        mark.dataset.tooltip = `${previous} → ${n} · ${gap}칸 공백`;
        mark.setAttribute('aria-label', `${previous}에서 ${n}까지 ${gap}칸 공백`);
        mark.dataset.gap = `${previous}-${n}`;
        mark.addEventListener('click', () => {
          document.getElementById('sieveCaption').textContent = `소수 ${primes.length}개 · 선택한 간격 ${previous} → ${n} · ${gap}칸 공백`;
          document.querySelectorAll('.prime-gap.is-selected').forEach(item => item.classList.remove('is-selected'));
          mark.classList.add('is-selected');
        });
        marks.append(mark);
        intervals.push(mark);
        if (gap > largest.gap) largest = { gap, previous, current: n };
      }
      primes.push(n);
    } else {
      const divisor = n === 1 ? null : primes.find(p => p * p <= n && n % p === 0);
      cell.className = n === 1 ? 'is-one' : 'is-composite';
      if (divisor) factorDetail = ` · ${divisor}의 배수`;
    }
    const pi = primes.length;
    const psi = psiTrue(n).toFixed(3);
    cell.dataset.tooltip = `${cell.className === 'is-prime' ? '소수' : n === 1 ? '소수 아님' : '합성수'}${factorDetail} · π(${n})=${pi} · ψ(${n})≈${psi}`;
    cell.setAttribute('aria-label', `${n}, ${cell.className === 'is-prime' ? '소수' : '소수가 아님'}, π(${n})=${pi}, ψ(${n}) 약 ${psi}`);
    cell.addEventListener('click', () => {
      document.getElementById('sieveCaption').textContent = cell.dataset.tooltip;
      document.querySelectorAll('#sieve .is-selected').forEach(item => item.classList.remove('is-selected'));
      cell.classList.add('is-selected');
    });
    cell.addEventListener('keydown', event => {
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -10, ArrowDown: 10 };
      if (!offsets[event.key]) return;
      event.preventDefault();
      const next = Math.max(1, Math.min(100, n + offsets[event.key]));
      sieve.querySelectorAll('button').forEach(item => { item.tabIndex = Number(item.textContent) === next ? 0 : -1; });
      sieve.querySelector(`button:nth-child(${next})`)?.focus();
    });
    cells.append(cell);
  }
  sieve.replaceChildren(cells);
  gaps.replaceChildren(marks);
  const { gap, previous, current } = largest;
  document.getElementById('sieveCaption').textContent = `소수 ${primes.length}개 · 가장 넓은 빈 구간 ${gap}칸 (${previous} → ${current})`;
  const largestGap = intervals.find(mark => mark.dataset.gap === `${previous}-${current}`);
  largestGap?.classList.add('is-largest');
  if (largestGap) largestGap.dataset.tooltip = `${previous} → ${current} · ${gap}칸 공백 · 1–100에서 가장 넓은 간격`;
}

function buildCodeWalls() {
  for (const wall of document.querySelectorAll('.code-wall')) {
    const repetitions = wall.classList.contains('seam__code') ? 50 : 16;
    for (let i = 0; i < 3; i++) {
      const column = document.createElement('pre');
      column.textContent = (CODE_WALL + '\n').repeat(repetitions);
      wall.append(column);
    }
  }
}

function applyMorph() {
  const t = readMorph();
  if (t === lastMorph || (t > 0 && t < 1 && Math.abs(t - lastMorph) < 0.002)) return;
  lastMorph = t;
  root.style.setProperty('--m', t.toFixed(4));
  seam.style.setProperty('--seam-bg', lerpRGB(PALETTE.paper.deep, PALETTE.term.deep, t));
  seamRule.style.setProperty('--rule-c', lerpRGB(PALETTE.paper.margin, PALETTE.term.margin, t));
  seamRule.style.setProperty('--rule-alpha', lerp(0.35, 0.24, t));
  seam.style.setProperty('--seam-readable', t < 0.46 ? '#070A0D' : '#FFFFFF');
  setEra(t >= 0.55 ? 'terminal' : 'paper');
}

function applyBridge() {
  const p = seamProgress();
  if (p === lastBridge) return;
  lastBridge = p;
  const aFade = ease(0.25, 0.30, p);
  const bFade = ease(0.58, 0.62, p);
  const opacity = reduced.matches
    ? [Number(p < 0.28), Number(p >= 0.28 && p < 0.60), Number(p >= 0.60)]
    : [1 - aFade, aFade * (1 - bFade), bFade];
  const offsets = reduced.matches ? [0, 0, 0] : [-20 * aFade, 24 * (1 - aFade), 0];
  bridgeLayers.forEach((layer, index) => {
    layer.style.setProperty('--alpha', opacity[index]);
    layer.style.setProperty('--offset', `${offsets[index]}px`);
  });
  const pages = reduced.matches ? 1 : ease(0.25, 0.55, p);
  const lines = reduced.matches ? 1 : ease(0.58, 0.93, p);
  pageCounter.textContent = formatInt(Math.round(FACTS.pagesEquivalent * pages));
  lineCounter.textContent = formatInt(Math.round(FACTS.proof.lines * lines));
  seam.style.setProperty('--seam-code-opacity', opacity[2]);
  seam.style.setProperty('--code-shift', reduced.matches ? '0%' : `${-8 * lines}%`);
  seam.style.setProperty('--scale-progress', `${(lines * 100).toFixed(1)}%`);
}

function renderScroll() {
  frame = 0;
  applyMorph();
  applyBridge();
  progress.style.width = `${clamp(scrollY / positions.maximumScroll) * 100}%`;
  let current = '';
  const marker = scrollY + Math.min(innerHeight * 0.40, 320);
  for (const { id, y } of positions.chapters) {
    if (y > marker) break;
    if (id !== 'seam') current = id;
  }
  if (current === activeChapter) return;
  activeChapter = current;
  for (const link of chapterLinks) {
    if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function scheduleScroll() {
  if (!frame) frame = requestAnimationFrame(renderScroll);
}

function refreshLayout() {
  measure();
  scheduleScroll();
}

function toggleMode() {
  setMode(root.dataset.mode === 'math' ? 'intuition' : 'math');
}

function handleKeyboard(event) {
  if (root.dataset.xp === 'open') return;
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey
    || event.target.closest('input, textarea, select, [contenteditable]')) return;
  if (event.key === 'Escape') {
    shortcutHelp.hidden = true;
    clearTimeout(shortcutTimer);
  } else if (event.key === '?') {
    shortcutHelp.hidden = false;
    clearTimeout(shortcutTimer);
    shortcutTimer = setTimeout(() => { shortcutHelp.hidden = true; }, 3000);
  } else if (event.key.toLowerCase() === 'h') {
    location.assign('../');
  } else if (event.key.toLowerCase() === 'm') {
    toggleMode();
  } else if (/^[1-4]$/.test(event.key)) {
    document.getElementById('act' + event.key).scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  }
}

let storedMode;
try { storedMode = localStorage.getItem('w8:mode'); } catch { storedMode = 'intuition'; }
setMode(query.get('mode') === 'math' ? 'math' : storedMode);
root.classList.remove('no-js');
renderFacts();
renderSieve();
buildCodeWalls();
seam.style.setProperty('--scale-paper', `${FACTS.paper.pages / FACTS.pagesEquivalent * 100}%`);
initLean(document.getElementById('lean'));
initLab(document.getElementById('act2'));
initExperience();

modeToggle.addEventListener('click', toggleMode);
inlineNotes.addEventListener('change', openNotes);
document.addEventListener('keydown', handleKeyboard);
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', refreshLayout);
addEventListener('pageshow', refreshLayout);
reduced.addEventListener('change', () => {
  lastBridge = -1;
  scheduleScroll();
});
new ResizeObserver(refreshLayout).observe(document.body);
measure();
renderScroll();

export function runSelfTest() {
  const report = [];
  function check(actual, expected, tolerance = 0) {
    const pass = tolerance ? Math.abs(actual - expected) <= tolerance : actual === expected;
    report.push({ test: `T${report.length + 1}`, actual, expected, tolerance, result: pass ? 'PASS' : 'FAIL' });
  }
  const sigmas = n => Array(n).fill(0.5);
  const rms = [1, 15, 50].map(n => rmsError(sigmas(n)));
  check(GAMMA.length, 60);
  check(GAMMA[0], 14.134725, 1e-6);
  check(GAMMA.every((value, i) => i === 0 || GAMMA[i - 1] < value), true);
  check(psiTrue(10), 7.832014, 0.001);
  check(psiTrue(50), 49.485381, 0.001);
  check(psiTrue(100), 94.045311, 0.001);
  check(psiApprox(100, sigmas(1)), 97.1042, 0.01);
  check(psiApprox(100, sigmas(15)), 95.5945, 0.01);
  check(psiApprox(100, sigmas(50)), 94.4488, 0.01);
  check(psiApprox(100, [0.85, ...sigmas(14)]), 91.474, 0.01);
  check(rms[0], 1.3367, 0.01);
  check(rms[1], 0.8918, 0.01);
  check(rms[2], 0.6733, 0.01);
  check(rms[0] > rms[1] && rms[1] > rms[2], true);
  check(100 ** (0.85 - 0.5), 5.0119, 0.001);
  leanStep('reset');
  for (const action of ['intro', 'rw', 'exact']) leanStep(action);
  check(getState().state === 3 && getState().kernel === 'pass', true);
  leanStep('reset');
  leanStep('intro');
  leanStep('wrong');
  check(getState().state === 1 && getState().error === 'mismatch', true);
  leanStep('reset');
  check(getState().state === 0 && getState().error === 'none', true);
  const initialMode = root.dataset.mode;
  toggleMode();
  check(root.dataset.mode !== initialMode, true);
  setMode(initialMode);
  check(root.scrollWidth <= innerWidth + 1, true);

  const checkRel = (actual, expected, relTol) => Math.abs(actual - expected) <= Math.abs(expected) * relTol;
  check(PI_ANCHORS.length === 15 && PI_ANCHORS[5].pi === 78498 &&
    PI_ANCHORS[11].pi === 37607912018 && PI_ANCHORS[14].pi === 29844570422669 &&
    piExact(1e6) === 78498, true);
  check(isPrime(999999999989n) && isPrime(1000000000039n) &&
    !isPrime(1000000000000n) && !isPrime(3215031751n), true);
  check(firstPrimeAtOrAbove(10n ** 12n), 1000000000039n);
  check(10n ** 12n - previousPrime(10n ** 12n), 11n);
  check(Math.abs(density(1e2) - 0.21715) <= 2e-4 &&
    Math.abs(density(1e12) - 0.036191) <= 5e-5 && Math.abs(density(1e15) - 0.028952) <= 5e-5, true);
  check(Math.abs(li(100) - 30.126) <= 0.02 && Math.abs(li(1e6) - 78627.5) <= 2 &&
    checkRel(li(1e12), 3.76079502808e10, 1e-9), true);
  const a = amplitude(1e12, 0.9, GAMMA[0]);
  const band = envelope(1e12);
  check(checkRel(a, 8909719740.454672, 1e-6) &&
    checkRel(band, 763473327.9088893, 1e-9) && Math.abs(a / band - 11.67) <= 0.02, true);
  check(checkRel(crossingX(0.9, GAMMA[0]), 4.092e8, 0.01), true);
  check(Math.abs(psiExact(400) - 397.830846) <= 0.001 &&
    Math.abs(rmsError(sigmas(60), 2, 400, 0.25) - 1.2767) <= 0.01, true);
  const xpRoot = document.getElementById('xpRoot');
  const deepLink = query.get('xp') === '1' && isExperienceOpen() ? location.href : null;
  openExperience(4);
  const opened = root.dataset.xp === 'open' && !xpRoot.hidden &&
    xpRoot.querySelectorAll('.xp__steps [data-xp-step]').length === 4 &&
    xpRoot.scrollWidth <= innerWidth + 1;
  closeExperience();
  check(opened && !('xp' in root.dataset) && xpRoot.hidden && !document.getElementById('main').inert, true);
  if (deepLink) {
    history.replaceState(history.state, '', deepLink);
    openExperience(Number(query.get('step')) || 1);
  }

  const failed = report.filter(entry => entry.result === 'FAIL');
  const panel = document.getElementById('selftest');
  panel.hidden = false;
  panel.dataset.result = failed.length ? 'fail' : 'pass';
  const count = document.createElement('strong');
  count.textContent = `${report.length - failed.length}/${report.length} ${failed.length ? 'FAIL' : 'PASS'}`;
  panel.replaceChildren(count);
  if (failed.length) {
    const table = document.createElement('table');
    const header = table.createTHead().insertRow();
    for (const text of ['검사', '결과', '실제', '기대', '허용']) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = text;
      header.append(cell);
    }
    const body = table.createTBody();
    for (const entry of failed) {
      const row = body.insertRow();
      for (const key of ['test', 'result', 'actual', 'expected', 'tolerance']) {
        row.insertCell().textContent = entry[key];
      }
    }
    panel.append(table);
  }
  console.table(report);
  return report;
}

if (query.get('selftest') === '1') requestAnimationFrame(runSelfTest);
