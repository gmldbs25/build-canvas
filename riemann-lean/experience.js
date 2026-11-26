import { GAMMA } from './data.js';
import { psiApprox, psiTrue, rmsError, waveAmplitude } from './psi.js';

const root = document.documentElement;
const xpRoot = document.getElementById('xpRoot');
const xpBody = document.getElementById('xpBody');
const xpClose = document.getElementById('xpClose');
const previous = document.getElementById('xpPrev');
const next = document.getElementById('xpNext');
const stepButtons = [...xpRoot.querySelectorAll('.xp__steps button')];
const mobile = matchMedia('(max-width: 899px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const state = { step: 1, tab: 0, logX: 12, N: 15, sel: 0, sigma: 0.9, playing: false, sound: false };
const C = {};
const copyTemplates = document.getElementById('xpCopy').content.children;
const background = [...document.querySelectorAll('body > header, body > main, body > footer, body > .skip')];
let initialized = false;
let saved;
let returning = false;
let historyPushed = false;
let frame = 0;
let renderFrame;
let cleanupStage;
let announceTimer;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = new Intl.NumberFormat('ko-KR');
const fmt = value => number.format(value);
const superscript = value => String(value).replace(/[\d.+-]/g, char => '⁰¹²³⁴⁵⁶⁷⁸⁹·⁺⁻'['0123456789.+-'.indexOf(char)]);
const power = exponent => `10${superscript(Number(exponent.toFixed(2)))}`;
const sci = (value, significant = 3) => {
  const [coefficient, exponent] = value.toExponential(significant - 1).split('e');
  return Number(exponent) === 0 ? coefficient : `${coefficient}×${power(Number(exponent))}`;
};
const currentX = () => Math.floor(10 ** state.logX);

function make(parent, tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  parent.append(element);
  return element;
}

function button(parent, label, onclick) {
  const element = make(parent, 'button', '', label);
  element.type = 'button';
  element.addEventListener('click', onclick);
  return element;
}

const visual = (stage, className) => make(stage, 'div', ['xp__visual', className].filter(Boolean).join(' '));
const controls = stage => make(stage, 'div', 'xp__controls');

const resizeCanvas = new ResizeObserver(() => invalidate());

function canvas(parent, label) {
  const plate = make(parent, 'div', 'xp__canvas');
  const element = make(plate, 'canvas');
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', label);
  resizeCanvas.observe(plate);
  return element;
}

function draw(element) {
  const { width: w, height: h } = element.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio);
  const width = Math.max(1, Math.round(w * dpr));
  const height = Math.max(1, Math.round(h * dpr));
  if (element.width !== width) element.width = width;
  if (element.height !== height) element.height = height;
  const ctx = element.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function graph(element, [xmin, xmax], [ymin, ymax], { xTicks = [], yTicks = [] } = {}) {
  const { ctx, w, h } = draw(element);
  const left = 44;
  const right = Math.max(left + 1, w - 16);
  const top = 19;
  const bottom = Math.max(top + 1, h - 24);
  const x = value => left + (right - left) * (value - xmin) / (xmax - xmin);
  const y = value => bottom - (bottom - top) * (value - ymin) / (ymax - ymin);
  const line = (points, color, dash = [], width = 1.5) => {
    ctx.beginPath();
    points.forEach(([a, b], index) => {
      if (index) ctx.lineTo(x(a), y(b));
      else ctx.moveTo(x(a), y(b));
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const cursor = (k, color, dash = []) => line([[k, ymin], [k, ymax]], color, dash, 1);
  const dot = (a, b, color, r) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(a), y(b), r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (const [value, label] of yTicks) {
    line([[xmin, value], [xmax, value]], C.rule, [], 1);
    ctx.fillStyle = C.muted;
    ctx.fillText(label, left - 7, y(value));
  }
  ctx.textAlign = 'center';
  for (const [value, label] of xTicks) {
    line([[value, ymin], [value, ymax]], C.rule, [], 1);
    ctx.fillStyle = C.muted;
    ctx.fillText(label, x(value), bottom + 12);
  }
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, right - left, bottom - top);
  return { ctx, w, x, y, line, cursor, dot, clip() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
  }, end() { ctx.restore(); } };
}

function xSlider(parent, onInput) {
  const label = make(parent, 'label', 'xp__range');
  const range = rangeControl(label, 'x의 로그 눈금', XP.xMin, XP.xMax, 0.01, state.logX, value => {
    state.logX = value;
    range.setAttribute('aria-valuetext', power(value));
    onInput();
  });
  const ticks = make(label, 'span', 'xp__ticks');
  ticks.setAttribute('aria-hidden', 'true');
  for (const k of [2, 4, 6, 9, 12, 15]) {
    make(ticks, 'span', '', power(k)).style.left = `${(k - 2) * 100 / 13}%`;
  }
  range.setAttribute('aria-valuetext', power(state.logX));
  range.addEventListener('keydown', event => {
    if (!event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 0.25 : -0.25;
    range.value = clamp(Number(range.value) + delta, XP.xMin, XP.xMax).toFixed(2);
    range.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return range;
}

function announce(text, delay = 400) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { document.getElementById('xpAnnounce').textContent = text; }, delay);
}

function stopLoop() {
  cancelAnimationFrame(frame);
  frame = 0;
}

function invalidate() {
  if (frame || !renderFrame || document.hidden || !isExperienceOpen()) return;
  frame = requestAnimationFrame(now => {
    frame = 0;
    if (!document.hidden && isExperienceOpen() && renderFrame?.(now)) invalidate();
  });
}

function clearStage() {
  stopLoop();
  resizeCanvas.disconnect();
  cleanupStage?.();
  cleanupStage = renderFrame = null;
  togglePlayback = toggleBalance = () => {};
  clearTimeout(announceTimer);
  xpBody.replaceChildren();
}

function syncStepUrl() {
  const url = new URL(location.href);
  url.searchParams.set('step', String(state.step));
  history.replaceState(history.state, '', url);
}

function renderStage() {
  clearStage();
  const stage = make(xpBody, 'div', 'xp__stage');
  const copy = make(xpBody, 'div', 'xp__copy');
  const [title, lead, ...captions] = copyTemplates[state.step - 1].children;
  copy.append(title.cloneNode(true), lead.cloneNode(true));
  xpBody.dataset.step = String(state.step);
  renderFrame = [renderStep1, renderStep2, renderStep3, renderStep4][state.step - 1](stage, copy);
  copy.append(...captions.map(node => node.cloneNode(true)));
  announce(title.textContent, 0);
  invalidate();
}

function emitExperience(open) {
  document.dispatchEvent(new CustomEvent('w8:xp', {
    detail: open ? { open, step: state.step } : { open }
  }));
}

const stepNumber = step => clamp(Math.round(Number(step) || 1), 1, 4);
function setStep(step, { user = false, opening = false } = {}) {
  step = stepNumber(step);
  const changed = step !== state.step;
  if (changed && user) state.playing = false;
  state.step = step;
  stepButtons.forEach((item, index) => item.setAttribute('aria-pressed', String(index + 1 === step)));
  previous.disabled = step === 1;
  next.disabled = step === 4;
  if (changed || !xpBody.firstChild) renderStage();
  syncStepUrl();
  if (changed && !opening) emitExperience(true);
}

export function isExperienceOpen() {
  return root.dataset.xp === 'open';
}

export function openExperience(step = 1, trigger = null) {
  if (returning) return;
  if (isExperienceOpen()) {
    setStep(step);
    return;
  }

  saved = { y: scrollY, behavior: root.style.scrollBehavior,
    restoration: history.scrollRestoration, trigger: trigger || document.activeElement };
  const url = new URL(location.href);
  historyPushed = url.searchParams.get('xp') === '1' && history.state?.w8Experience === true;
  if (url.searchParams.get('xp') !== '1') {
    url.searchParams.set('xp', '1');
    url.searchParams.set('step', String(stepNumber(step)));
    history.pushState({ w8Experience: true }, '', url);
    historyPushed = true;
  }
  history.scrollRestoration = 'manual';
  root.style.scrollBehavior = 'auto';
  root.style.setProperty('--xp-top', `-${saved.y}px`);
  root.dataset.xp = 'open';
  background.forEach(el => { el.inert = true; });

  xpRoot.hidden = false;
  const palette = getComputedStyle(xpRoot);
  for (const name of ['bg', 'ink', 'muted', 'cyan', 'green', 'amber', 'red', 'violet', 'rule', 'dim']) {
    C[name] = palette.getPropertyValue('--x-' + name).trim();
  }
  ensureData();
  setStep(step, { opening: true });
  if (trigger) (stepButtons[state.step - 1] || xpClose).focus({ preventScroll: true });
  emitExperience(true);
}

export function closeExperience() {
  dismissExperience(false);
}

function dismissExperience(popped) {
  if (!isExperienceOpen()) return;
  clearStage();
  xpRoot.hidden = true;
  document.getElementById('xpAnnounce').textContent = '';
  const snapshot = saved;
  saved = null;
  root.style.removeProperty('--xp-top');
  background.forEach(el => { el.inert = false; });
  delete root.dataset.xp;
  const restoreScroll = () => window.scrollTo({ top: snapshot.y, behavior: 'instant' });
  restoreScroll();
  root.style.scrollBehavior = snapshot.behavior;
  snapshot.trigger?.focus({ preventScroll: true });

  const settle = () => requestAnimationFrame(() => { if (!isExperienceOpen()) restoreScroll(); });
  if (popped) settle();
  else if (historyPushed) {
    returning = true;
    addEventListener('popstate', () => {
      returning = false;
      settle();
    }, { once: true });
    history.back();
  } else {
    const url = new URL(location.href);
    url.searchParams.delete('xp');
    url.searchParams.delete('step');
    history.replaceState(history.state, '', url);
  }
  history.scrollRestoration = snapshot.restoration;
  historyPushed = false;
  emitExperience(false);
}

function trapTab(event) {
  const focusable = [...xpRoot.querySelectorAll('button, input, select, a[href], [tabindex]')]
    .filter(el => el.tabIndex >= 0 && !el.disabled && el.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);
  const active = document.activeElement;
  const destination = !xpRoot.contains(active) ? first :
    event.shiftKey && active === first ? last : !event.shiftKey && active === last ? first : null;
  if (destination) {
    event.preventDefault();
    destination.focus();
  }
}

function onKeydown(event) {
  if (!isExperienceOpen() || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target instanceof Element ? event.target : null;
  const key = event.key;
  if (key === 'Tab') {
    trapTab(event);
    return;
  }
  const ownsKeys = target?.closest('input, select, textarea, [contenteditable], [role="tablist"], [role="tab"], [role="slider"], [data-xp-keys]');
  const onControl = target?.closest('button, a[href], [role="button"]');
  if (key === 'Escape') closeExperience();
  else if (ownsKeys) return;
  else if (/^[1-4]$/.test(key)) setStep(Number(key), { user: true });
  else if (key === 'ArrowRight' || key === 'ArrowLeft') {
    setStep(state.step + (key === 'ArrowRight' ? 1 : -1), { user: true });
  } else if (key === ' ' && !onControl && state.step >= 3) {
    if (state.step === 3) togglePlayback();
    else toggleBalance();
  } else return;
  event.preventDefault();
  event.stopPropagation();
}

export function initExperience() {
  if (initialized) return;
  initialized = true;
  for (const trigger of document.querySelectorAll('[data-xp-open]')) {
    trigger.addEventListener('click', () => openExperience(Number(trigger.dataset.xpStep), trigger));
  }
  for (const control of stepButtons) {
    control.addEventListener('click', () => setStep(Number(control.dataset.xpStep), { user: true }));
  }
  previous.addEventListener('click', () => setStep(state.step - 1, { user: true }));
  next.addEventListener('click', () => setStep(state.step + 1, { user: true }));
  xpClose.addEventListener('click', closeExperience);
  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else invalidate();
  });
  mobile.addEventListener('change', () => { if (isExperienceOpen()) renderStage(); });
  reduced.addEventListener('change', invalidate);
  addEventListener('popstate', () => {
    if (returning) return;
    const query = new URLSearchParams(location.search);
    if (query.get('xp') === '1') openExperience(Number(query.get('step')) || 1);
    else dismissExperience(true);
  });

  const query = new URLSearchParams(location.search);
  if (query.get('xp') === '1') openExperience(Number(query.get('step')) || 1);
}

export const XP = Object.freeze({ xMin: 2, xMax: 15, sigmaMin: 0.5, sigmaMax: 0.99, window: 240 });
// OEIS A006880, π(10^k). Through 10^6 the page also counts directly.
export const PI_ANCHORS = [4, 25, 168, 1229, 9592, 78498, 664579, 5761455,
  50847534, 455052511, 4118054813, 37607912018, 346065536839, 3204941750802, 29844570422669]
  .map((pi, i) => ({ k: i + 1, x: 10 ** (i + 1), pi }));
export const amplitude = waveAmplitude;
export const density = x => 1 / Math.log(x);
export const envelope = x => Math.sqrt(x) * Math.log(x) ** 2;

export function li(x) {
  if (!(x > 1)) return Number.NaN;
  const L = Math.log(x);
  let sum = 0.5772156649015329 + Math.log(L);
  let term = 1;
  for (let k = 1; k <= 220; k++) {
    term *= L / k;
    const add = term / k;
    sum += add;
    if (k > L && Math.abs(add) < 1e-15 * Math.abs(sum)) break;
  }
  return sum;
}

export function crossingX(sigma, gamma) {
  const excess = u => (sigma - 0.5) * u - 2 * Math.log(u) + Math.log(2 / Math.hypot(sigma, gamma));
  let lo = Math.log(1e2);
  let hi = Math.log(1e30);
  if (excess(lo) >= 0) return 1e2;
  if (excess(hi) < 0) return Infinity;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (excess(mid) >= 0) hi = mid;
    else lo = mid;
  }
  return Math.exp(hi);
}

const PRIME_LIMIT = 1n << 64n;
const SMALL = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
const MR64 = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n];

function modPow(base, exp, mod) {
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = result * base % mod;
    base = base * base % mod;
    exp >>= 1n;
  }
  return result;
}

export function isPrime(n) {
  if (n < 2n || n >= PRIME_LIMIT) return false;
  for (const p of SMALL) if (n % p === 0n) return n === p;
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) { d >>= 1n; s++; }
  for (const base of MR64) {
    const a = base % n;
    if (!a) continue;
    let value = modPow(a, d, n);
    if (value === 1n) continue;
    for (let r = 1; r < s && value !== n - 1n; r++) value = value * value % n;
    if (value !== n - 1n) return false;
  }
  return true;
}

const ceilBig = x => typeof x === 'bigint' ? x : BigInt(Math.ceil(x));
export function firstPrimeAtOrAbove(x) {
  for (let n = x < 2 ? 2n : ceilBig(x); n < PRIME_LIMIT; n++) if (isPrime(n)) return n;
  return null;
}
export function previousPrime(x) {
  for (let n = ceilBig(x) - 1n; n >= 2n && n < PRIME_LIMIT; n--) if (isPrime(n)) return n;
  return null;
}
export function primesInWindow(start, span) {
  const lo = typeof start === 'bigint' ? start : BigInt(Math.floor(start));
  const primes = [];
  for (let i = 0; i <= span; i++) {
    const n = lo + BigInt(i);
    if (isPrime(n)) primes.push(n);
  }
  return primes;
}

let primes;
let psi;
let psiLimit = 0;
function ensureSieve() {
  if (primes) return;
  const composite = new Uint8Array(1e6 + 1);
  primes = [];
  for (let p = 2; p <= 1e6; p++) {
    if (composite[p]) continue;
    primes.push(p);
    for (let n = p * p; n <= 1e6; n += p) composite[n] = 1;
  }
}
function upperBound(values, x) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
export function piExact(x) {
  ensureSieve();
  return x <= 1e6 ? upperBound(primes, x) : NaN;
}
export function buildPsi(limit = 1e6) {
  limit = clamp(Math.floor(limit), 1, 1e6);
  ensureSieve();
  if (psiLimit >= limit) return psi;
  const events = [];
  for (const p of primes) {
    if (p > limit) break;
    const weight = Math.log(p);
    for (let n = p; n <= limit; n *= p) events.push([n, weight]);
  }
  events.sort((a, b) => a[0] - b[0]);
  const breaks = Uint32Array.from(events, event => event[0]);
  let sum = 0;
  const sums = Float64Array.from(events, event => sum += event[1]);
  psiLimit = limit;
  psi = x => x <= limit ? sums[upperBound(breaks, x) - 1] ?? 0 : NaN;
  return psi;
}
export const psiExact = x => buildPsi()(x);
const samples = (count, min, max, fn) => Array.from({ length: count }, (_, i) => {
  const x = min + (max - min) * i / (count - 1);
  return [x, fn(x)];
});
let curves;
function ensureData() {
  if (curves) return;
  buildPsi();
  curves = {
    pi: steps(samples(600, 1, 6, k => Math.log10(piExact(10 ** k)))),
    li: samples(600, 1, 15, k => Math.log10(li(10 ** k))),
    pnt: samples(600, 1, 15, k => Math.log10(10 ** k / Math.log(10 ** k))),
    psi: samples(700, 1, 6, k => (psiExact(10 ** k) - 10 ** k) / 10 ** (k / 2)),
    wave: samples(540, 6, 15, k => (psiApprox(10 ** k) - 10 ** k) / 10 ** (k / 2))
  };
}
function steps(points) {
  return points.flatMap((point, i) => i ? [[point[0], points[i - 1][1]], point] : [point]);
}
const decimal = (value, digits = 1) => value.toFixed(digits);
const caption = (parent, text) => make(parent, 'p', 'xp__caption', text);
const readout = parent => make(parent, 'p', 'xp__readout');
const decadeTicks = values => values.map(k => [k, power(k)]);

function renderStep1(stage, copy) {
  const view = visual(stage, 'xp__stage1');
  const chart = canvas(view, '');
  chart.parentElement.id = 'xpPrimeView';
  chart.parentElement.setAttribute('role', 'tabpanel');
  const row = controls(stage);
  const tablist = make(row, 'div', 'xp__tabs');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', '소수 세기 보기');
  const tabs = ['체', '계단', '밀도'].map((name, i) => {
    const tab = button(tablist, name, () => select(i));
    tab.id = 'xpPrimeTab' + i;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'xpPrimeView');
    tab.addEventListener('keydown', event => {
      const k = { ArrowLeft: (i + 2) % 3, ArrowRight: (i + 1) % 3, Home: 0, End: 2 }[event.key];
      if (k === undefined) return;
      event.preventDefault();
      select(k);
      tabs[k].focus();
    });
    return tab;
  });
  const out = readout(copy);
  const note = caption(copy);
  const toScale = button(copy, '이 비율이 1,000조에서도 유지되는지 보기 →', () => setStep(2, { user: true }));
  const actions = tabs.map(() => make(row, 'div', 'xp__actions'));

  const small = primes.slice(0, piExact(400));
  const sieveSteps = small.filter(p => p * p <= 400);
  const eliminated = new Map();
  for (const p of sieveSteps) {
    const batch = [];
    for (let n = p * p; n <= 400; n += p) {
      if (!eliminated.has(n)) {
        batch.push(n);
        eliminated.set(n, [p, batch.length]);
      }
    }
    batch.forEach(n => { eliminated.get(n)[1] /= batch.length; });
  }
  const gap = small.reduce((i, p, j) => p - small[j - 1] >= small[i] - small[i - 1] ? j : i, 1);
  const sieveLabel = `1–400 · 소수 ${small.length}개 · 가장 넓은 빈 구간 ${small[gap] - small[gap - 1]}칸 (${small[gap - 1]} → ${small[gap]})`;
  const sieveTime = sieveSteps.length * 700;
  let start = null;
  let settled = sieveTime + 300;
  function play(age, animate = false) {
    settled = age;
    start = animate ? performance.now() : null;
    invalidate();
  }
  button(actions[0], '재생', () => reduced.matches ? play(sieveTime + 300) : play(0, true));
  button(actions[0], '처음', () => play(0));
  button(actions[0], '건너뛰기', () => play(sieveTime + 300));

  let walkAt = performance.now();
  const exact = steps([[1, 0], ...small.map((p, i) => [p, i + 1]), [400, small.length]]);
  const estimates = [[li, 'Li(x) 근사', C.cyan], [x => x / Math.log(x), 'x/ln x 근사', C.muted]]
    .map(([fn, label, color]) => {
      const chip = button(actions[1], label, () => {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') === 'false'));
        invalidate();
      });
      chip.setAttribute('aria-pressed', 'true');
      return [samples(280, 2, 400, fn), chip, color];
    });
  let exponent = 12;
  const presets = [2, 6, 12, 15].map(k => [k, button(actions[2], power(k), () => { exponent = k; invalidate(); })]);

  function select(i) {
    state.tab = i;
    if (i === 1) walkAt = performance.now();
    tabs.forEach((tab, index) => {
      tab.tabIndex = i === index ? 0 : -1;
      tab.setAttribute('aria-selected', String(i === index));
      actions[index].hidden = i !== index;
    });
    chart.parentElement.setAttribute('aria-labelledby', tabs[i].id);
    toScale.hidden = i !== 2;
    invalidate();
  }
  select(state.tab);

  function sieve(now) {
    const { ctx, w, h } = draw(chart);
    const age = reduced.matches ? sieveTime + 300 : start === null ? settled : Math.max(0, now - start);
    const index = Math.floor(age / 700);
    const p = sieveSteps[index];
    const size = Math.min(28, (Math.min(w, h) - 12) / 20);
    const left = (w - 20 * size) / 2;
    const top = (h - 20 * size) / 2;
    ctx.font = `${Math.max(6, Math.min(11, size * 0.5))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let n = 1; n <= 400; n++) {
      const x = left + ((n - 1) % 20) * size;
      const y = top + Math.floor((n - 1) / 20) * size;
      const [via, order] = eliminated.get(n) || [0, 0];
      const dead = n === 1 || via && (!p || via < p || via === p && age % 700 >= 200 + 380 * order);
      const pulse = age >= sieveTime && age < sieveTime + 300 && !dead;
      const inset = pulse ? 0.5 : 1;
      ctx.globalAlpha = dead ? 0.22 : 1;
      ctx.fillStyle = dead ? C.rule : n === p && age % 700 < 200 ? C.amber : pulse ? C.green : C.cyan;
      ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
      if (size >= 7) {
        ctx.fillStyle = dead ? C.ink : C.bg;
        ctx.fillText(n, x + size / 2, y + size / 2);
        if (dead) ctx.fillRect(x + 3, y + size / 2, size - 6, 0.6);
      }
    }
    ctx.globalAlpha = 1;
    out.textContent = p && start !== null ? `지우는 수: ${p}` : sieveLabel;
    chart.setAttribute('aria-label', out.textContent);
    note.textContent = `1–400에서 소수 ${small.length}개가 남았습니다. 가장 넓은 빈 구간은 ${small[gap] - small[gap - 1]}칸입니다. (${small[gap - 1]} → ${small[gap]})`;
    return start !== null && age < sieveTime + 300;
  }

  return now => {
    if (state.tab === 0) return sieve(now);
    if (state.tab === 1) {
      const point = reduced.matches ? 400 : Math.min(400, 1 + 399 * (now - walkAt) / 2500);
      const g = graph(chart, [1, 400], [0, 90], { xTicks: ticks([1, 100, 200, 300, 400]), yTicks: ticks([0, 30, 60, 90]) });
      g.clip();
      g.line(exact, C.muted);
      g.line([...exact.filter(([x]) => x <= point), [point, piExact(point)]], C.ink);
      for (const [points, chip, color] of estimates) if (chip.getAttribute('aria-pressed') === 'true') g.line(points, color, approximationDash);
      g.dot(point, piExact(point), C.green, 4);
      g.end();
      out.textContent = `π(400)=${small.length} · 400/ln400=${decimal(400 / Math.log(400))} · Li(400)=${decimal(li(400))} — 참값은 두 근사 사이에 있다.`;
      note.textContent = '계단은 소수에서만 오른다. 매끄러운 곡선은 그 계단을 흉내 내는 근사다.';
      chart.setAttribute('aria-label', `x=${Math.floor(point)}, π(x)=${piExact(point)}. ${out.textContent}`);
      return point < 400;
    }
    const { ctx, w, h } = draw(chart);
    const x = 10 ** exponent;
    const spacing = Math.log(x);
    const length = Math.ceil(spacing);
    const cell = Math.min(28, (w - 24) / length);
    for (let i = 0; i < length; i++) {
      ctx.fillStyle = i ? C.rule : C.cyan;
      ctx.fillRect((w - cell * length) / 2 + i * cell, (h - cell) / 2, cell - 1, cell - 1);
    }
    out.textContent = `${decimal(spacing)}칸에 하나 · ${fmt(x)}`;
    note.textContent = '수를 세는 대신 간격을 세면 이렇게 된다. 평균 간격 ≈ ln x. 10² 4.6칸, 10⁶ 13.8칸, 10¹² 27.6칸, 10¹⁵ 34.5칸.';
    chart.setAttribute('aria-label', `밀도 근사 1/ln x. ${out.textContent}`);
    for (const [k, chip] of presets) chip.setAttribute('aria-pressed', String(k === exponent));
    return false;
  };
}

function renderStep2(stage, copy) {
  const v = visual(stage, 'xp__stage2');
  const main = canvas(v, '');
  const windowPanel = make(v, 'div', 'xp__window');
  const title = make(windowPanel, 'h3');
  const detail = make(windowPanel, 'p', 'xp__window-detail');
  const grid = make(windowPanel, 'div', 'xp__prime-grid');
  grid.dataset.xpKeys = '';
  grid.setAttribute('aria-label', '실제 소수 240칸');
  const head = make(copy, 'div', 'xp__headline');
  const scale = make(head, 'strong');
  const integer = make(head, 'span');
  const densityLine = make(copy, 'p');
  const out = readout(copy);
  const windowOut = make(copy, 'p', 'xp__window-summary');
  const errorPanel = visual(mobile.matches ? copy : v, 'xp__error-panel');
  const error = canvas(errorPanel, '');
  caption(errorPanel, '영점 60개로 자른 근사 · 실제 ψ 아님');
  const row = controls(stage);
  xSlider(row, () => { schedule(); invalidate(); });
  let hideTrend = false;
  const toggle = button(row, '매끄러운 추세 감추기', () => {
    hideTrend = !hideTrend;
    toggle.setAttribute('aria-pressed', String(hideTrend));
    errorPanel.classList.toggle('is-large', hideTrend);
    invalidate();
  });
  toggle.setAttribute('aria-pressed', 'false');
  let timer;
  let selected = 0;
  let cols;
  const maxY = Math.log10(4e13);
  const anchors = PI_ANCHORS.slice(5).map(({ k, pi }) => [k, Math.log10(pi)]);
  const xTicks = decadeTicks([1, 3, 6, 9, 12, 15]);

  function fitGrid() {
    const cell = matchMedia('(max-width: 639px)').matches ? 12 : 14;
    cols = clamp(Math.floor((grid.clientWidth + 1) / (cell + 1)), 12, 60);
    grid.style.setProperty('--grid-cols', cols);
  }
  function schedule() {
    clearTimeout(timer);
    grid.dataset.pending = '';
    windowOut.textContent = '계산 중';
    timer = setTimeout(updateWindow, 80);
  }
  cleanupStage = () => clearTimeout(timer);

  function updateWindow() {
    const start = BigInt(currentX());
    const found = primesInWindow(start, XP.window - 1);
    const set = new Set(found);
    const extra = found.length < 6 ? primesInWindow(start + 240n, 359).length : 0;
    const gap = found.slice(1).reduce((max, n, i) => Math.max(max, Number(n - found[i])), 0);
    title.textContent = power(state.logX) + ' 근처 240칸';
    detail.textContent = `${fmt(start)} – ${fmt(start + 239n)}`;
    const cells = Array.from({ length: XP.window }, (_, i) => {
      const n = start + BigInt(i);
      const prime = set.has(n);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'xp__prime-cell' + (prime ? ' is-prime' : '');
      cell.textContent = prime ? '●' : '';
      cell.tabIndex = i === selected ? 0 : -1;
      cell.title = `${fmt(n)} · ${prime ? '소수' : '소수 아님'}`;
      cell.setAttribute('aria-label', cell.title);
      return cell;
    });
    grid.replaceChildren(...cells);
    delete grid.dataset.pending;
    windowOut.textContent = `실제 소수 ${found.length}개 · 가장 긴 빈 구간 ${gap}칸 · 이 구간의 밀도로 본 평균 간격 ${decimal(Math.log(Number(start)))}칸${extra ? ` · 창 밖 ${extra}개` : ''}`;
    announce(windowOut.textContent);
    invalidate();
  }
  grid.addEventListener('focusin', e => { detail.textContent = e.target.title; });
  grid.addEventListener('pointerover', e => { if (e.target.title) detail.textContent = e.target.title; });
  grid.addEventListener('keydown', event => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols, Home: -selected, End: 239 - selected }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    grid.children[selected].tabIndex = -1;
    selected = clamp(selected + delta, 0, 239);
    grid.children[selected].tabIndex = 0;
    grid.children[selected].focus();
  });
  schedule();
  return () => {
    fitGrid();
    const k = state.logX;
    const x = currentX();
    scale.textContent = power(k);
    const unit = x >= 1e12 ? `${fmt(x / 1e12)}조` : x >= 1e8 ? `${fmt(x / 1e8)}억` : x >= 1e4 ? `${fmt(x / 1e4)}만` : '';
    integer.textContent = fmt(x) + (unit ? ' · ' + unit : '');
    densityLine.textContent = `이 근처에서 소수는 평균 ${decimal(Math.log(x))}칸에 하나입니다.`;
    const pi = x <= 1e6 ? piExact(x) : PI_ANCHORS.find(anchor => anchor.k === k)?.pi;
    const lv = Math.round(li(x));
    out.textContent = `π(${power(k)}) = ${pi === undefined ? '앵커 사이' : fmt(pi)}\nLi(x) 근사 = ${fmt(lv)}${pi === undefined ? '' : `\n차이 = ${fmt(pi - lv).replace('-', '−')}`}`;
    const g = graph(main, [1, 15], [0, maxY], { xTicks, yTicks: decadeTicks([0, 3, 6, 9, 12]) });
    g.line(curves.pi, C.ink);
    g.line(anchors, C.muted, [2, 4]);
    anchors.forEach(([a, b]) => g.dot(a, b, C.ink, 3.5));
    if (!hideTrend) {
      g.line(curves.li, C.cyan, approximationDash);
      g.line(curves.pnt, C.muted, [2, 4]);
    }
    g.cursor(k, C.green);
    if (pi !== undefined) g.dot(k, Math.log10(pi), C.green, 4);
    main.setAttribute('aria-label', `로그 눈금의 소수 계단과 근사. ${out.textContent}`);
    const r = graph(error, [1, 15], [-3, 3], { xTicks, yTicks: ticks([-3, -1, 0, 1, 3]) });
    r.clip();
    for (const y of [-1, 0, 1]) r.line([[1, y], [15, y]], C.muted, y ? [2, 4] : [], 1);
    r.line(curves.psi, C.ink);
    r.line(curves.wave, C.cyan, approximationDash);
    r.cursor(k, C.green);
    r.end();
    error.setAttribute('aria-label', `정규화한 ψ 오차. 현재 x는 ${power(k)}. 10⁶ 초과 구간은 영점 60개 근사.`);
    return false;
  };
}

let togglePlayback = () => {};
let toggleBalance = () => {};
const approximationDash = [5, 4];
const psiTicks = [2, 100, 200, 300, 400].map(x => [x, String(x)]);
const ticks = values => values.map(value => [value, String(value)]);

function rangeControl(parent, name, min, max, step, value, update) {
  const input = make(parent, 'input');
  Object.assign(input, { type: 'range', min, max, step, value });
  input.setAttribute('aria-label', name);
  input.addEventListener('input', () => update(Number(input.value)));
  return input;
}

function spectrum(plane, min, top, count, sigma, selected, active) {
  const g = graph(plane, [min, 1], [0, top], {
    xTicks: ticks(min === 0 ? [0, 0.5, 1] : [0.5, 0.75, 1]),
    yTicks: ticks(top === 170 ? [0, 50, 100, 150] : [0, 10, 20, 30, 40])
  });
  const { ctx, x, y } = g;
  ctx.fillStyle = C.dim;
  ctx.fillRect(x(min), y(top), x(1) - x(min), y(0) - y(top));
  g.line([[0.5, 0], [0.5, top]], C.violet, approximationDash, 1);
  for (let k = 0; k < count; k++) {
    ctx.globalAlpha = k < active ? 1 : 0.22;
    g.dot(k === selected ? sigma : 0.5, GAMMA[k], C.violet, k < active ? 3.5 : 2);
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x(sigma), y(GAMMA[selected]), 7, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = sigma === 0.5 ? C.violet : C.amber;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'left';
  ctx.fillText(`ρ = ${sigma.toFixed(3)} + ${GAMMA[selected].toFixed(2)}i`, 10, 9);
  return g;
}

let zeroCurves;
function reconstruction() {
  if (zeroCurves) return zeroCurves;
  const xs = Float64Array.from({ length: 480 }, (_, i) => 2 + 398 * i / 479);
  const terms = GAMMA.map(() => new Float64Array(xs.length));
  const sums = GAMMA.map(() => new Float64Array(xs.length));
  xs.forEach((x, i) => {
    const u = Math.log(x);
    let total = psiApprox(x, []);
    GAMMA.forEach((gamma, k) => {
      const basis = 0.5 * Math.cos(gamma * u) + gamma * Math.sin(gamma * u);
      terms[k][i] = 2 * Math.sqrt(x) * basis / (0.25 + gamma * gamma);
      total -= terms[k][i];
      sums[k][i] = total;
    });
  });
  const exact = [[2, psiTrue(2)]];
  for (let x = 3; x <= 400; x++) {
    const prior = exact.at(-1)[1];
    const next = psiTrue(x);
    if (prior !== next) exact.push([x, prior], [x, next]);
  }
  exact.push([400, exact.at(-1)[1]]);
  zeroCurves = { xs, terms, sums, exact, errors: [] };
  return zeroCurves;
}

function renderStep3(stage, copy) {
  const v = visual(stage, 'xp3');
  const plane = canvas(v, '');
  plane.tabIndex = 0;
  plane.dataset.xpKeys = '';
  const stairs = canvas(v, '');
  const readout = make(copy, 'p', 'xp__readout');
  const harmonic = canvas(mobile.matches ? copy : v, '');

  const c = controls(stage);
  const play = button(c, '▶ 재생', () => togglePlayback());
  const slider = rangeControl(c, '영점 개수 N', 1, 60, 1, state.N, setN);
  const presets = make(c, 'div', 'xp3__presets');
  for (const n of [1, 5, 15, 30, 60]) button(presets, String(n), () => setN(n));
  button(presets, '+1', () => setN(Math.min(60, state.N + 1)));

  let started = state.playing;
  let lastTick = 0;
  let projection;
  const { xs, terms, sums, exact, errors } = reconstruction();

  function setN(n) {
    state.N = n;
    state.playing = false;
    started = false;
    invalidate();
  }
  togglePlayback = () => {
    if (reduced.matches) return setN(60);
    state.playing = !state.playing;
    if (state.playing && !started) {
      started = true;
      state.N = 1;
    }
    lastTick = 0;
    invalidate();
  };

  function select(index) {
    if (index === state.sel) return;
    state.sel = index;
    announce(`영점 γ${index + 1} = ${GAMMA[index].toFixed(6)} 선택`);
    invalidate();
  }
  function pointAt(event) {
    if (!projection) return;
    const bounds = plane.getBoundingClientRect();
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    if (Math.abs(px - projection.x(0.5)) > 22) return;
    const index = GAMMA.reduce((best, gamma, k) =>
      Math.abs(projection.y(gamma) - py) < Math.abs(projection.y(GAMMA[best]) - py) ? k : best, 0);
    if (Math.abs(projection.y(GAMMA[index]) - py) <= 12) select(index);
  }
  plane.addEventListener('pointermove', pointAt);
  plane.addEventListener('click', pointAt);
  plane.addEventListener('keydown', event => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    select(clamp(state.sel + delta, 0, GAMMA.length - 1));
  });

  return now => {
    if (state.playing) {
      if (reduced.matches) setN(60);
      if (!lastTick) lastTick = now;
      if (now - lastTick >= 200) {
        state.N++;
        lastTick += 200;
        if (state.N === 60) setN(60);
      }
    }
    const { N, sel } = state;
    slider.value = N;
    play.textContent = state.playing ? '⏸ 일시정지' : '▶ 재생';
    if (!errors[N]) {
      const sigmas = Array(N).fill(0.5);
      let max = 0;
      for (let x = 2; x <= 400; x += 0.25) max = Math.max(max, Math.abs(psiApprox(x, sigmas) - psiTrue(x)));
      errors[N] = [rmsError(sigmas, 2, 400, 0.25).toFixed(2), max.toFixed(2)];
    }
    const [rms, max] = errors[N];
    const label = `N=${N} · RMS ${rms} · 최대 오차 ${max} (2 ≤ x ≤ 400)`;
    if (readout.textContent !== label) {
      readout.textContent = label;
      if (!state.playing) announce(label);
    }
    projection = spectrum(plane, 0, 170, 60, 0.5, sel, N);
    const g = graph(stairs, [2, 400], [0, 420], { xTicks: psiTicks, yTicks: ticks([0, 100, 200, 300, 400]) });
    g.line(exact, C.ink);
    g.line(Array.from(xs, (x, i) => [x, sums[N - 1][i]]), C.cyan, approximationDash);
    const h = graph(harmonic, [2, 400], [-1.15, 1.15], { xTicks: psiTicks, yTicks: ticks([-1, 0, 1]) });
    const peak = terms[sel].reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    h.line([[2, 0], [400, 0]], C.rule);
    h.line(Array.from(xs, (x, i) => [x, terms[sel][i] / peak]), C.amber);
    plane.setAttribute('aria-label', `영점 60개 중 ${N}개 활성. γ${sel + 1} = ${GAMMA[sel]} 선택. 화살표 키로 영점을 선택합니다.`);
    stairs.setAttribute('aria-label', `ψ(x) 계단과 영점 근사. ${label}`);
    harmonic.setAttribute('aria-label', `γ${sel + 1}의 개별 파동. 최대 진폭으로 정규화했습니다.`);
    return state.playing;
  };
}

function renderStep4(stage, copy) {
  const gamma = GAMMA[0];
  const v = visual(stage, 'xp4');
  const plane = canvas(v, '');
  const chart = canvas(v, '');
  make(v, 'p', 'xp4__notice', 'σ는 고정된 γ에 실수부만 바꾼 모형입니다. 실제 제타의 비자명한 영점은 임계 띠(0 < Re(s) < 1) 안에만 있을 수 있고, 이 화면은 반례 실험이 아닙니다.');
  const read = make(copy, 'p', 'xp__readout');
  const crossingLabel = make(copy, 'p', 'xp__caption');
  const sigmaInput = rangeControl(make(copy, 'label', 'xp4__sigma', '실수부 σ'), '영점 실수부 σ', 0.5, 0.99, 0.005, state.sigma, setSigma);

  const c = controls(stage);
  const presets = make(c, 'div', 'xp4__presets');
  const chips = [[0.5, '0.50 리만'], [0.75, '0.75'], [0.85, '0.85'], [0.9, '0.90 가설 깨뜨리기'], [0.99, '0.99']]
    .map(([sigma, label]) => [sigma, button(presets, label, () => {
      setSigma(sigma);
      if (sigma === 0.9) jumpTo(8);
    })]);
  const slider = xSlider(c, () => { tween = null; invalidate(); });
  let tween;
  let projection;
  let dragging = null;
  let snapped = state.sigma === 0.5;
  let previousSigma;
  let crossing;
  const maxY = Math.log10(3e14);
  const band = Array.from({ length: 180 }, (_, i) => {
    const logX = 2 + 13 * i / 179;
    return [logX, Math.log10(envelope(10 ** logX))];
  });

  function setSigma(sigma) {
    state.sigma = sigma;
    snapped = sigma === 0.5;
    tween = null;
    invalidate();
  }
  function jumpTo(value) {
    if (reduced.matches) state.logX = value;
    else tween = { from: state.logX, to: value, start: performance.now() };
    invalidate();
  }
  toggleBalance = () => {
    const riemann = state.sigma === 0.5;
    setSigma(riemann ? 0.9 : 0.5);
    jumpTo(riemann ? 8 : 12);
  };

  plane.addEventListener('pointerdown', event => {
    if (!projection) return;
    const bounds = plane.getBoundingClientRect();
    if (Math.hypot(event.clientX - bounds.left - projection.x(state.sigma),
      event.clientY - bounds.top - projection.y(gamma)) > 16) return;
    dragging = event.pointerId;
    plane.setPointerCapture(dragging);
  });
  plane.addEventListener('pointermove', event => {
    if (dragging !== event.pointerId) return;
    const px = event.clientX - plane.getBoundingClientRect().left;
    const s = 0.5 + 0.5 * (px - projection.x(0.5)) / (projection.x(1) - projection.x(0.5));
    setSigma(s <= (snapped ? 0.52 : 0.515) ? 0.5 : clamp(s, 0.5, 0.99));
  });
  plane.addEventListener('lostpointercapture', () => { dragging = null; });

  return now => {
    if (tween) {
      const t = reduced.matches ? 1 : clamp((now - tween.start) / 600, 0, 1);
      state.logX = tween.from + t * (tween.to - tween.from);
      if (t === 1) tween = null;
    }
    const { sigma, logX } = state;
    const value = 10 ** logX;
    const amp = amplitude(value, sigma, gamma);
    const limit = envelope(value);
    const ratio = amp / limit;
    const verdict = ratio <= 0.5 ? '✓ 띠 안' : ratio <= 1 ? '띠에 근접' : '▲ 띠 밖';
    const ratioLabel = ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(ratio >= 0.01 ? 2 : 4);
    const label = `x = ${power(logX)} · 이 항의 진폭 ${sci(amp)}\n허용 띠 √x ln²x = ${sci(limit)}\n비율 ${ratioLabel}배 · ${verdict}`;
    read.textContent = label;
    read.style.borderColor = ratio <= 0.5 ? C.green : ratio <= 1 ? C.amber : C.red;
    if (!tween) announce(label);
    slider.value = logX;
    slider.setAttribute('aria-valuetext', power(logX));
    sigmaInput.value = sigma;
    for (const [s, chip] of chips) chip.setAttribute('aria-pressed', String(s === sigma));
    projection = spectrum(plane, 0.45, 40, 5, sigma, 0, 5);
    plane.setAttribute('aria-label', `첫 다섯 영점의 높이. 첫 점의 실수부 σ = ${sigma.toFixed(3)}인 모형.`);

    const g = graph(chart, [2, 15], [0, maxY], {
      xTicks: [2, 6, 9, 12, 15].map(k => [k, power(k)]),
      yTicks: [0, 4, 8, 12].map(k => [k, power(k)])
    });
    const { ctx, x, y } = g;
    g.clip();
    ctx.fillStyle = 'rgba(255,122,122,.1)';
    ctx.beginPath();
    ctx.moveTo(x(2), y(0));
    for (const [k, a] of band) ctx.lineTo(x(k), y(a));
    ctx.lineTo(x(15), y(0));
    ctx.fill();
    g.line(band, C.red, approximationDash);
    const ampColor = sigma === 0.5 ? C.cyan : C.amber;
    g.line(band.map(([k]) => [k, Math.log10(amplitude(10 ** k, sigma, gamma))]), ampColor);
    g.cursor(logX, C.muted, [2, 3]);
    g.dot(logX, Math.log10(amp), ampColor, 4);
    g.dot(logX, Math.log10(limit), C.red, 3);
    if (previousSigma !== sigma) {
      crossing = crossingX(sigma, gamma);
      previousSigma = sigma;
    }
    const k = Math.log10(crossing);
    if (k <= 15) {
      g.cursor(k, C.red, [2, 4]);
      g.dot(k, Math.log10(envelope(crossing)), C.red, 4);
    }
    g.end();
    const message = !Number.isFinite(k) ? sigma === 0.5 ?
      '이 항은 √x만큼만 자란다. 허용 띠 안에 머문다.' : '10³⁰까지 교차점이 없습니다.' :
      `${k <= 15 ? '여기서 넘는다' : '표시 범위 밖 교차점'} · ${sci(crossing, 2)}`;
    crossingLabel.textContent = message;
    if (k <= 15) {
      ctx.fillStyle = C.red;
      ctx.textAlign = 'left';
      ctx.fillText(sci(crossing, 2), clamp(x(k) + 4, 16, g.w - 58), 9);
    }
    chart.setAttribute('aria-label', `영점 한 항의 진폭과 허용 띠. ${label}. ${message}`);
    return Boolean(tween);
  };
}
