import { GAMMA } from './data.js';
import { psiApprox, psiTrue, rmsError, waveAmplitude } from './psi.js';

const root = document.documentElement;
const xpRoot = document.getElementById('xpRoot');
const xpBody = document.getElementById('xpBody');
const xpClose = document.getElementById('xpClose');
const previous = document.getElementById('xpPrev');
const next = document.getElementById('xpNext');
const stepButtons = [...xpRoot.querySelectorAll('.xp__steps button')];
const state = { step: 1, waves: 60, sigma: 0.9 };
const progress = [0, 0, 0, 0];
const background = [...document.querySelectorAll('body > header, body > main, body > footer, body > .skip')];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const fmt = value => value.toLocaleString('ko-KR');
const allowsMotion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
let initialized = false;
let saved;
let returning = false;
let historyPushed = false;
function make(parent, tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  parent.append(element);
  return element;
}

function syncStepUrl() {
  const url = new URL(location.href);
  url.searchParams.set('step', String(state.step));
  history.replaceState(history.state, '', url);
}

function emitExperience(open) {
  document.dispatchEvent(new CustomEvent('w8:xp', {
    detail: open ? { open, step: state.step } : { open }
  }));
}

const stepNumber = step => clamp(Math.round(Number(step) || 1), 1, 4);
function setStep(step, { opening = false } = {}) {
  step = stepNumber(step);
  const changed = step !== state.step;

  state.step = step;
  stepButtons.forEach((item, index) => item.setAttribute('aria-pressed', String(index + 1 === step)));

  if (changed || !xpBody.firstChild) {
    renderStage(false, { transition: changed && !opening });
    if (changed && !opening) xpBody.querySelector('.xp__spread:not(.is-exiting) h2').focus({ preventScroll: true });
  }
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
  progress.fill(0);
  state.waves = 60;
  state.sigma = 0.9;
  setStep(step, { opening: true });
  xpBody.querySelector('h2').focus({ preventScroll: true });
  emitExperience(true);
}

export function closeExperience() {
  dismissExperience(false);
}

function dismissExperience(popped) {
  if (!isExperienceOpen()) return;
  xpBody.replaceChildren();
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
  if (key === 'Escape') closeExperience();
  else if (ownsKeys) return;
  else if (/^[1-4]$/.test(key)) setStep(Number(key));
  else if (key === 'ArrowRight' || key === 'ArrowLeft') {
    setStep(state.step + (key === 'ArrowRight' ? 1 : -1));
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
    control.addEventListener('click', () => setStep(Number(control.dataset.xpStep)));
  }
  previous.addEventListener('click', () => {
    if (progress[state.step - 1]) {
      progress[state.step - 1]--;
      renderStage(true);
      if (previous.disabled) next.focus();
    } else setStep(state.step - 1);
  });
  next.addEventListener('click', () => {
    const i = state.step - 1;
    if (progress[i] < pages[i].actions.length) {
      progress[i]++;
      if (i === 2) state.waves = 60;
      if (i === 3) state.sigma = 0.9;
      renderStage(true, { action: true });
    } else if (state.step === 4) closeExperience();
    else setStep(state.step + 1);
  });
  xpClose.addEventListener('click', closeExperience);
  document.addEventListener('keydown', onKeydown, true);
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

const pages = [
  {
    topic: '소수 찾기', title: '어떤 수가 남을까요?',
    intro: '소수는 1보다 크고, 1과 자기 자신으로만 나누어떨어지는 수예요. 1부터 20까지, 다른 수의 배수를 지워서 찾아봅시다.',
    actions: ['2의 배수 지우기', '3의 배수 지우기'], forward: '소수의 비율 비교하기',
    notes: ['아래 ‘2의 배수 지우기’를 누르면 2는 남고, 4·6·8처럼 2로 나뉘는 더 큰 수에 빗금이 그어져요.',
      '4, 6, 8처럼 2로 나뉘는 수를 지웠어요. 이번에는 3을 남기고 그보다 큰 3의 배수를 지워 보세요.',
      '남은 수는 2, 3, 5, 7, 11, 13, 17, 19. 20까지는 2와 3의 배수만 걸러도 소수 8개가 드러나요.'],
    figure: '1부터 20까지의 숫자판', render: drawSieve
  },
  {
    topic: '비율 비교', title: '멀리 세면 소수가 더 드물까요?',
    intro: '100까지 세면 소수는 25개예요. 네 수에 하나꼴이죠. 100만까지 세어도 같은 비율일까요?',
    actions: ['100만까지 세기'], forward: '파동으로 계단 그리기',
    notes: ['막대 전체가 세어 본 모든 수예요. 색칠한 길이는 그중 소수가 차지하는 몫입니다.',
      '100만까지 소수는 78,498개예요. 개수는 늘었지만 비율은 25%에서 약 7.85%로 줄었어요.'],
    figure: '범위별 소수의 비율', render: drawDensity
  },
  {
    topic: '계단 그리기', title: '파동으로 계단을 그릴 수 있을까요?',
    intro: '이번에는 소수를 세는 방법을 조금 바꿔요. 소수와 그 거듭제곱에서 계단을 올리되, 소수마다 높이를 달리하면 물결을 겹쳐 그 모양을 따라갈 수 있어요.',
    actions: ['파동 60개 겹치기'], forward: '파동 하나 옮겨 보기',
    notes: ['검은 계단은 직접 계산한 값이에요. 붉은 선은 아직 파동을 하나도 더하지 않은 밑그림입니다.',
      '60개를 겹치니 붉은 선이 계단의 모서리를 따라갔어요. 물결 하나하나는 제타 함수의 값이 0이 되는 점, 곧 ‘영점’ 한 쌍에서 왔어요.'],
    figure: '실제 계단과 파동으로 그린 선', render: drawStairs
  },
  {
    topic: '가설 실험', title: '점 하나가 자리를 벗어나면?',
    intro: '앞에서 파동을 정해 준 점들을 ‘비자명한 영점’이라고 해요. 리만 가설은 이 점들이 모두 가로 좌표 ½인 선 위에 있다는 주장이에요. 한 점만 옮겨 볼까요?',
    actions: ['점을 0.90으로 옮기기'], forward: '본문으로 돌아가기',
    notes: ['같은 높이의 점을 오른쪽으로 옮기면, 멀리서 그 파동이 얼마나 커질까요?',
      '0.90으로 옮겼을 때 파동은 기준 크기의 약 11.67배였어요. 실제 영점이 모두 이 선 위에 있다는 결론에는 모든 영점을 다루는 증명이 필요해요.'],
    figure: '영점의 위치와 파동의 크기', render: drawBalance
  }
];

function renderStage(announceChange = false, { transition = false, action = false } = {}) {
  const i = state.step - 1;
  const page = pages[i];
  const phase = progress[i];
  // A later chapter supersedes any unfinished transition. The current chapter
  // becomes the outgoing layer and the new one is laid out immediately below it.
  xpBody.querySelectorAll('.xp__spread.is-exiting').forEach(el => {
    el.getAnimations().forEach(animation => animation.cancel());
    el.remove();
  });
  const outgoing = transition && allowsMotion() ? xpBody.querySelector('.xp__spread') : null;
  const exitBox = outgoing?.getBoundingClientRect();
  const bodyBox = outgoing && xpBody.getBoundingClientRect();
  const exitOpacity = outgoing && getComputedStyle(outgoing).opacity;
  if (!outgoing) xpBody.replaceChildren();
  else {
    outgoing.getAnimations().forEach(animation => animation.cancel());
    // Keep the outgoing content at the same viewport position when resetting
    // a scrolled chapter, so the fade starts without a visible snap.
    outgoing.style.setProperty('--exit-x', `${exitBox.left - bodyBox.left + xpBody.scrollLeft}px`);
    outgoing.style.setProperty('--exit-y', `${exitBox.top - bodyBox.top}px`);
    outgoing.style.setProperty('--exit-width', `${exitBox.width}px`);
    outgoing.classList.add('is-exiting');
    outgoing.inert = true;
    outgoing.setAttribute('aria-hidden', 'true');
  }
  if (transition) xpBody.scrollTop = 0;
  const spread = make(xpBody, 'div', 'xp__spread');
  const words = make(spread, 'div', 'xp__words');
  make(words, 'p', 'xp__kicker', '관찰 ' + String(i + 1).padStart(2, '0') + '  /  ' + page.topic);
  const heading = make(words, 'h2', '', page.title);
  heading.tabIndex = -1;
  make(words, 'p', 'xp__intro', page.intro);
  const note = make(spread, 'aside', 'xp__note');
  make(note, 'strong', '', phase ? '관찰 기록' : '해 보는 법');
  make(note, 'p', '', page.notes[phase]);
  const plate = make(spread, 'figure', 'xp__plate');
  make(plate, 'figcaption', '', page.figure);
  page.render(plate, phase, action);
  if (action && allowsMotion()) {
    note.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }
  if (outgoing) {
    outgoing.animate([
      { opacity: exitOpacity, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-8px)' }
    ], { duration: 190, easing: 'ease-out' }).onfinish = () => outgoing.remove();
    spread.animate([
      { opacity: 0, transform: 'translateY(9px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 250, easing: 'ease-out' });
  }
  previous.disabled = !phase && !i;
  previous.textContent = phase ? '↶ 한 번 되돌리기' : '← 이전 관찰';
  next.textContent = (page.actions[phase] || page.forward) + ' →';
  document.getElementById('xpHint').textContent = (i + 1) + ' / 4';
  if (announceChange) document.getElementById('xpAnnounce').textContent = page.notes[phase];
}

function drawSieve(plate, phase, action = false) {
  const grid = make(plate, 'div', 'xp__numbers');
  for (let n = 1; n <= 20; n++) {
    const erased = (phase >= 1 && n > 2 && n % 2 === 0) || (phase >= 2 && n > 3 && n % 3 === 0);
    const newlyErased = action && ((phase === 1 && n > 2 && n % 2 === 0) ||
      (phase === 2 && n > 3 && n % 3 === 0 && n % 2 !== 0));
    const newlyCircled = action && phase === 2 && n > 1 && !erased;
    const cell = make(grid, 'span', [n === 1 || erased ? 'erased' : phase === 2 ? 'prime' : '',
      newlyErased ? 'is-newly-erased' : '', newlyCircled ? 'is-newly-circled' : ''].filter(Boolean).join(' '), String(n));
    if (n === 1 || erased) cell.setAttribute('aria-label', n + ' 제외');
  }
  make(plate, 'p', 'xp__legend', ['1은 약수가 하나뿐이어서 처음부터 제외해요.',
    '빗금 친 수는 제외했어요. 아직 남은 후보는 10개예요.', '동그라미 친 수가 소수예요.'][phase]);
}

function drawDensity(plate, phase, action = false) {
  for (const [index, limit] of [100, 1e6].entries()) {
    const revealed = index === 0 || phase;
    const row = make(plate, 'div', 'xp__density');
    make(row, 'span', '', fmt(limit) + '까지');
    const ratio = revealed ? piExact(limit) / limit : 0;
    make(row, 'b', '', revealed ? fmt(+(100 * ratio).toFixed(2)) + '%' : '?');
    const track = make(row, 'div', 'xp__track');
    if (revealed) {
      const bar = make(track, 'i');
      bar.style.width = ratio * 100 + '%';
      if (action && index === 1) bar.classList.add('is-revealing');
    }
    make(row, 'small', '', revealed ? '소수 ' + fmt(piExact(limit)) + '개 / 전체 ' + fmt(limit) + '개' : '아직 세지 않은 범위');
  }
}

function svgElement(parent, name, attributes, content) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (content !== undefined) el.textContent = content;
  parent.append(el);
  return el;
}

function explorationSlider(parent, label, min, max, step, value, format, update) {
  const control = make(parent, 'label', 'xp__slider');
  make(control, 'span', '', label);
  const output = make(control, 'b', '', format(value));
  const input = make(control, 'input');
  input.type = 'range';
  Object.assign(input, { min, max, step, value });
  input.setAttribute('aria-label', label);
  input.setAttribute('aria-valuetext', format(value));
  input.addEventListener('input', () => {
    const current = Number(input.value);
    output.textContent = format(current);
    input.setAttribute('aria-valuetext', format(current));
    update(current);
  });
}

function drawStairs(plate, phase, action = false) {
  const graph = make(plate, 'div');
  const paint = (count, reveal = false) => {
    graph.replaceChildren();
    plotStairs(graph, count, reveal);
  };
  paint(phase ? state.waves : 0, action);
  if (phase) explorationSlider(plate, '파동 개수 바꿔 보기', 0, 60, 1, state.waves, n => n + '개', count => {
    state.waves = count;
    paint(count);
  });
}

function plotStairs(plate, count, animateWave = false) {
  const terms = Array(count).fill(0.5);
  const svg = svgElement(plate, 'svg', { viewBox: '0 0 430 207', role: 'img', 'aria-label': count ? '파동 ' + count + '개를 합친 붉은 선과 직접 계산한 검은 계단' : '밋밋한 붉은 선과 울퉁불퉁한 검은 계단' });
  const X = x => 29 + (x - 8) * 19;
  const Y = y => 180 - (y - 5) * 7;
  for (const y of [10, 20, 30]) {
    svgElement(svg, 'line', { x1: 29, x2: 410, y1: Y(y), y2: Y(y), class: 'xp__grid-line' });
    svgElement(svg, 'text', { x: 22, y: Y(y) + 4, 'text-anchor': 'end' }, y);
  }
  for (const x of [8, 13, 18, 23, 28]) svgElement(svg, 'text', { x: X(x), y: 201, 'text-anchor': 'middle' }, x);
  let stairs = 'M29 ' + Y(psiTrue(8));
  for (let x = 9; x <= 28; x++) stairs += ' H' + X(x) + ' V' + Y(psiTrue(x));
  svgElement(svg, 'path', { d: stairs, class: 'xp__stair' });
  const wave = Array.from({ length: 401 }, (_, i) => {
    const x = 8 + i / 20;
    return (i ? 'L' : 'M') + X(x).toFixed(2) + ' ' + Y(psiApprox(x, terms)).toFixed(2);
  }).join(' ');
  svgElement(svg, 'path', { d: wave, class: 'xp__wave' + (animateWave ? ' is-drawing' : '') });
  make(plate, 'p', 'xp__legend', '━ 실제 계단　┄ 파동 ' + terms.length + '개를 쓴 근사선');
  make(plate, 'p', 'xp__metric', '평균적인 어긋남 ' + rmsError(terms, 8, 28).toFixed(2));
  make(plate, 'small', 'xp__fine', '계단은 소수 p의 거듭제곱에서 ln p만큼 올라요. 오차는 8부터 28까지 0.25 간격으로 잰 제곱평균제곱근 값이에요.');
}

function drawBalance(plate, phase, action = false) {
  const sigma = phase ? state.sigma : 0.5;
  const axis = make(plate, 'div', 'xp__axis');
  const dot = make(axis, 'span', 'xp__dot', sigma.toFixed(2));
  const ticks = make(plate, 'div', 'xp__ticks');
  for (const label of ['0', '½', '1']) make(ticks, 'span', '', label);
  const metric = make(plate, 'div', 'xp__balance-value');
  make(metric, 'small', '', '1조까지 갔을 때 파동의 최대 크기');
  const number = make(metric, 'b');
  make(plate, 'p', 'xp__legend', '1배는 리만 가설이 예측하는 계단 오차의 성장 규모예요. 여기서는 영점 한 쌍에서 나온 물결의 진폭을 그 크기와 비교해요.');
  make(plate, 'small', 'xp__fine', '첫 영점 쌍의 높이를 고정한 모형 · 기준 √x (ln x)²');
  const update = value => {
    dot.textContent = value.toFixed(2);
    dot.style.left = value * 100 + '%';
    const ratio = amplitude(1e12, value, GAMMA[0]) / envelope(1e12);
    number.textContent = ratio.toFixed(ratio < 0.01 ? 5 : 2) + '배';
  };
  update(sigma);
  const movement = action && allowsMotion() && dot.animate(
    [{ left: '50%' }, { left: dot.style.left }],
    { duration: 550, easing: 'cubic-bezier(.2,.75,.2,1)' }
  );
  if (phase) explorationSlider(plate, '점의 가로 위치 바꿔 보기', 0.5, 0.99, 0.01, sigma, n => n.toFixed(2), value => {
    if (movement) movement.cancel();
    state.sigma = value;
    update(value);
  });
}
