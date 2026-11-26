import { GAMMA } from './data.js';
import { psiApprox, psiTrue, waveAmplitude } from './psi.js';

const root = document.documentElement;
const xpRoot = document.getElementById('xpRoot');
const xpBody = document.getElementById('xpBody');
const xpClose = document.getElementById('xpClose');
const previous = document.getElementById('xpPrev');
const next = document.getElementById('xpNext');
const stepButtons = [...xpRoot.querySelectorAll('.xp__steps button')];
const state = { step: 1 };
let filmPlay;
let filmTimer = 0;
let playing = false;
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

  if (changed) stopFilm();
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
  setStep(step, { opening: true });
  xpBody.querySelector('h2').focus({ preventScroll: true });
  emitExperience(true);
}

export function closeExperience() {
  dismissExperience(false);
}

function dismissExperience(popped) {
  if (!isExperienceOpen()) return;
  stopFilm();
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
  const focusable = [...xpRoot.querySelectorAll('button, input, select, summary, a[href], [tabindex]')]
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
  else if (state.step >= 3 && (key === 'ArrowRight' || key === 'ArrowLeft')) {
    (key === 'ArrowRight' ? next : previous).click();
  } else if (state.step >= 3 && key === ' ' && !target?.closest('button, summary')) {
    filmPlay.click();
  } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
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
  filmPlay = document.createElement('button');
  filmPlay.type = 'button';
  filmPlay.id = 'xpFilmPlay';
  filmPlay.hidden = true;
  next.before(filmPlay);
  filmPlay.addEventListener('click', toggleFilm);
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) toggleFilm(); });
  previous.addEventListener('click', () => {
    stopFilm();
    if (progress[state.step - 1]) {
      progress[state.step - 1]--;
      renderStage(true);
      if (previous.disabled) next.focus();
    } else setStep(state.step - 1);
  });
  next.addEventListener('click', () => {
    const i = state.step - 1;
    stopFilm();
    if (i >= 2 && progress[i] < films[i - 2].length - 1) {
      progress[i]++;
      renderStage(true, { action: true });
    } else if (i < 2 && progress[i] < pages[i].actions.length) {
      progress[i]++;
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
    actions: ['100만까지 세기'], forward: '소수로 계단 그리기',
    notes: ['막대 전체가 세어 본 모든 수예요. 색칠한 길이는 그중 소수가 차지하는 몫입니다.',
      '100만까지 소수는 78,498개예요. 개수는 늘었지만 비율은 25%에서 약 7.85%로 줄었어요.'],
    figure: '범위별 소수의 비율', render: drawDensity
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
  if (i >= 2) renderFilm(spread, i - 2, phase, action);
  else {
    renderNotebook(spread, page, phase, i, action);
    previous.disabled = !phase && !i;
    previous.textContent = phase ? '↶ 한 번 되돌리기' : '← 이전 관찰';
    next.textContent = (page.actions[phase] || page.forward) + ' →';
  }
  filmPlay.hidden = i < 2;
  xpRoot.classList.toggle('xp--film', i >= 2);
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
  document.getElementById('xpHint').textContent = (i + 1) + ' / 4';
  if (announceChange) document.getElementById('xpAnnounce').textContent =
    i >= 2 ? films[i - 2][phase].title + '. ' + films[i - 2][phase].caption : page.notes[phase];
}

function renderNotebook(spread, page, phase, i, action) {
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
  if (action && allowsMotion()) note.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
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
    const counting = index === 1 && revealed && action && allowsMotion();
    const row = make(plate, 'div', 'xp__density');
    make(row, 'span', '', fmt(limit) + '까지');
    const count = revealed ? piExact(limit) : 0;
    const percent = 100 * count / limit;
    const value = make(row, 'b', '', revealed ? (counting ? '0.00' : fmt(+percent.toFixed(2))) + '%' : '?');
    const track = make(row, 'div', 'xp__track');
    if (revealed) {
      const bar = make(track, 'i');
      bar.style.width = percent + '%';
      if (counting) {
        const fill = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
          { duration: 600, easing: 'cubic-bezier(.2,.7,.15,1)', fill: 'both' });
        function updatePercentage() {
          if (!value.isConnected) return;
          const progress = fill.effect.getComputedTiming().progress ?? 0;
          value.textContent = (percent * progress).toFixed(2) + '%';
          if (progress < 1) requestAnimationFrame(updatePercentage);
        }
        requestAnimationFrame(updatePercentage);
      }
    }
    make(row, 'small', '', revealed ? '소수 ' + fmt(count) + '개 / 전체 ' + fmt(limit) + '개' : '아직 세지 않은 범위');
  }
}

function svgElement(parent, name, attributes, content) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (content !== undefined) el.textContent = content;
  parent.append(el);
  return el;
}

// Each frame couples one spoken-style caption to one change on the drawing.
const films = [
  [
    { view: 'count', x: 1, title: '세는 과정을 그림에 남겨요.', caption: '앞에서 100까지 소수 25개를 셌죠. 이번엔 1부터 한 수씩 세어 볼게요. 몇까지 봤는지는 가로로, 찾은 소수 개수는 세로로 표시해요. 1에서는 아직 0개예요.' },
    { view: 'count', x: 2, title: '2에서 첫 칸을 올라요.', caption: '1에서 오른쪽으로 한 칸 가면 2예요. 2는 첫 소수니까 개수도 0에서 1로 올라요. 점 (2, 1)은 “2까지 소수 1개”라는 뜻이에요.' },
    { view: 'count', x: 3, title: '3도 소수예요.', caption: '오른쪽으로 가서 3을 확인해요. 소수 목록에 3을 보태면 2, 3으로 두 개죠. 선을 한 칸 올려 (3, 2)에 점을 찍어요.' },
    { view: 'count', x: 4, title: '4에서는 옆으로만 가요.', caption: '4는 2×2로 나뉘므로 소수가 아니에요. 가로 위치는 4가 되지만 소수는 여전히 2개예요. (3, 2)와 (4, 2)를 이으면 평평한 단이 생겨요.' },
    { view: 'count', x: 5, title: '소수를 만날 때만 올라요.', caption: '5는 소수라서 누적 개수가 3이 돼요. 이렇게 한 수씩 오른쪽으로 가다가 소수에서만 올라선 자취가 바로 소수 계단이에요.' },
    { view: 'weight', x: 2, title: '파동과 비교할 두 번째 계단이에요.', caption: '리만의 공식으로 물결을 그리려면 소수의 개수 대신 점수를 쌓아요. 소수 p에서 더할 점수는 자연로그 ln p예요. 먼저 2에서 ln 2, 약 0.69만큼 올라가요.' },
    { view: 'weight', x: 3, title: '3의 몫은 약 1.10이에요.', caption: '3은 2보다 큰 소수여서 오르는 높이도 달라요. 앞서 쌓은 ln 2 위에 ln 3을 더하면 지금까지 쌓은 높이가 약 1.79가 돼요.' },
    { view: 'weight', x: 4, title: '같은 소수를 곱한 수도 세요.', caption: '아까 4에서는 옆으로만 갔죠. 새 규칙은 4 = 2×2도 세요. 밑이 2이므로 ln 2를 한 번 더 얹어요. 이제 높이는 약 2.48이에요.' },
    { view: 'weight', x: 5, title: '5에서 높이 4.094에 닿아요.', caption: '소수 5의 몫 ln 5를 보태요. 검은 계단은 5를 지난 뒤에도 다음 점프까지 높이 약 4.094를 유지해요. 이제 이 높이를 파동으로 얼마나 가깝게 그릴 수 있는지 볼게요.' },
    { view: 'gap', count: 0, title: '같은 자리에서 두 높이를 재요.', caption: '5와 6 사이인 5.5에 자를 세워요. 계단의 높이는 그대로 4.094인데, 파동을 아직 더하지 않은 붉은 밑그림은 3.679예요. 두 점 사이의 세로 거리 약 0.415가 여기서의 오차예요.' },
    { view: 'gap', count: 60, title: '5.5에서 두 점이 가까워져요.', caption: '영점은 제타 함수의 값이 0이 되는 점이에요. 그런 점 한 쌍에서 물결 하나가 나와요. 60개를 겹친 붉은 선은 5.5에서 4.118이 돼요. 같은 자리에서 잰 오차가 약 0.024로 줄었어요.' }
  ],
  [
    { view: 'wave', moved: false, title: '파동 하나만 꺼내 볼까요?', caption: '앞에서 겹친 물결 중 하나예요. 수를 10까지 봤을 때, 첫 영점 쌍의 가로 위치가 0.50이면 이 물결의 진폭은 0.45예요. 진폭은 가운데 0선에서 꼭대기까지의 높이예요.' },
    { view: 'wave', moved: true, title: '같은 10에서 점만 옮겨요.', caption: '영점의 세로 위치와 우리가 세어 본 수 10을 그대로 두고, 가로 위치만 0.90으로 바꾼 모형이에요. 점선 물결의 진폭이 1.12가 돼요. 원래 물결과 같은 눈금에서 비교해 보세요.' },
    { view: 'distance', title: '10에서 100으로 멀리 가 봐요.', caption: '이번엔 두 점의 위치를 고정하고 세어 본 수만 늘려요. 100에서 원래 물결은 높이 1.41, 옮긴 물결은 8.91이에요. 두 그림의 세로 눈금이 같아서 꼭대기 높이를 그대로 비교할 수 있어요.' },
    { view: 'scale', title: '1조까지 가면 왜 차이가 클까요?', caption: '리만 가설은 가중 계단의 높이가 직선 x에서 얼마나 벗어날 수 있는지와 연결돼요. 1조에서 그 오차의 기준 규모를 1로 놓으면 원래 물결의 진폭은 약 0.00019배, 옮긴 물결은 11.67배예요.' },
    { view: 'ending', title: '실험에서 본 것과 증명이 필요한 것', caption: '리만 가설은 모든 비자명한 영점의 가로 위치가 ½이라는 주장이에요. 오른쪽으로 옮긴 모형에서는 한 물결이 기준보다 빠르게 자랐어요. 실제 영점 전체의 위치를 밝히려면 이 실험을 넘어서는 증명이 필요해요.' }
  ]
];

function stopFilm() {
  clearTimeout(filmTimer);
  filmTimer = 0;
  playing = false;
}

function updatePlayButton() {
  const last = progress[state.step - 1] === films[state.step - 3].length - 1;
  filmPlay.textContent = playing ? 'Ⅱ 일시정지' : last ? '↻ 다시 재생' : '▷ 연속 재생';
  filmPlay.setAttribute('aria-label', playing ? '장면 일시정지' : last ? '첫 장면부터 다시 재생' : '이 장면부터 연속 재생');
}

function scheduleFrame() {
  clearTimeout(filmTimer);
  const frames = films[state.step - 3];
  const i = progress[state.step - 1];
  if (i === frames.length - 1) {
    stopFilm();
    updatePlayButton();
    return;
  }
  // Let the drawing finish and leave time to read the entire caption.
  filmTimer = setTimeout(() => {
    if (!playing || !isExperienceOpen()) return;
    progress[state.step - 1]++;
    renderStage(true, { action: true });
    scheduleFrame();
  }, Math.max(5200, frames[i].caption.length * 105));
}

function toggleFilm() {
  const scene = xpBody.querySelector('.xp__film:not(.is-exiting)');
  const ink = scene?.querySelector('.xp__film-chart');
  if (playing) {
    stopFilm();
    ink?.getAnimations({ subtree: true }).forEach(animation => animation.pause());
  } else {
    playing = true;
    if (progress[state.step - 1] === films[state.step - 3].length - 1) {
      progress[state.step - 1] = 0;
      renderStage(true, { action: true });
    } else ink?.getAnimations({ subtree: true }).forEach(animation => {
      if (animation.playState === 'paused') animation.play();
    });
    scheduleFrame();
  }
  updatePlayButton();
}

function renderFilm(spread, chapter, i, animate) {
  const frames = films[chapter];
  const frame = frames[i];
  spread.classList.add('xp__film');
  spread.dataset.filmFrame = String(i + 1);
  const words = make(spread, 'div', 'xp__words');
  make(words, 'p', 'xp__kicker', '관찰 0' + (chapter + 3) + '  /  ' + (chapter ? '가설 실험' : '계단 그리기'));
  const heading = make(words, 'h2', 'xp__frame-title', frame.title);
  heading.tabIndex = -1;
  make(words, 'p', 'xp__subtitle', frame.caption);
  const plate = make(spread, 'figure', 'xp__plate xp__film-plate');
  const strip = make(plate, 'figcaption', 'xp__strip');
  const section = { count: '소수 세기', weight: '높이 더하기', gap: '오차 재기', wave: '한 물결의 진폭', distance: '같은 눈금으로 비교', scale: '기준과 비교', ending: '관찰의 결론' };
  make(strip, 'span', '', section[frame.view]);
  make(strip, 'small', '', '장면 ' + (i + 1) + ' / ' + frames.length);
  const timeline = make(plate, 'div', 'xp__timeline');
  timeline.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < frames.length; k++) make(timeline, 'i', k <= i ? 'seen' : '');
  const chart = make(plate, 'div', 'xp__film-chart');
  if (frame.view === 'count' || frame.view === 'weight') drawCountingFrame(chart, frame, animate);
  else if (frame.view === 'gap') drawGapFrame(chart, frame, animate);
  else if (frame.view === 'wave' || frame.view === 'distance') drawWaveFrame(chart, frame, animate);
  else drawScaleFrame(chart, frame, 0.9, animate && frame.view === 'scale');
  if (i === frames.length - 1) exploreLastFrame(plate, chart, chapter, frame);
  previous.disabled = false;
  previous.textContent = i ? '← 이전 장면' : '← 이전 관찰';
  next.textContent = i < frames.length - 1 ? '다음 장면 →' : chapter ? '본문으로 →' : '가설 실험 →';
  updatePlayButton();
}

function diagram(parent, width, height, label) {
  return svgElement(parent, 'svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': label });
}
function line(svg, x1, y1, x2, y2, className = 'film-rule') {
  return svgElement(svg, 'line', { x1, y1, x2, y2, class: className });
}
function lettering(svg, x, y, content, anchor = 'start', className = '') {
  return svgElement(svg, 'text', { x, y, 'text-anchor': anchor, class: className }, content);
}
function trace(svg, d, className, animate = false) {
  const path = svgElement(svg, 'path', { d, class: className, fill: 'none' });
  if (animate && allowsMotion()) {
    const length = path.getTotalLength();
    path.animate([{ strokeDasharray: length, strokeDashoffset: length },
      { strokeDasharray: length, strokeDashoffset: 0 }], { duration: 1450, easing: 'ease-in-out' });
  }
  return path;
}
function pin(svg, x, y, red = false) {
  return svgElement(svg, 'circle', { cx: x, cy: y, r: 4, class: red ? 'film-pin red' : 'film-pin' });
}
function formula(parent, text) { make(parent, 'p', 'xp__formula-line', text); }

function drawCountingFrame(chart, frame, animate) {
  const weighted = frame.view === 'weight';
  const x = frame.x;
  const score = weighted ? psiTrue : piExact;
  const amount = score(x);
  const svg = diagram(chart, 400, 205, (weighted ? '가중 계단' : '소수 개수 계단') + ', ' + x + '까지의 높이 ' + amount.toFixed(weighted ? 3 : 0));
  const X = n => 38 + (n - 1) * 73;
  const Y = y => 150 - y * (weighted ? 26 : 33);
  lettering(svg, 10, 14, weighted ? '↑ 더해 온 높이' : '↑ 지금까지의 소수 개수', 'start', 'film-axis-title');
  for (let y = 0; y <= (weighted ? 4 : 3); y++) {
    line(svg, X(1), Y(y), X(5) + 18, Y(y));
    lettering(svg, X(1) - 10, Y(y) + 4, y, 'end');
  }
  for (let n = 1; n <= 5; n++) {
    line(svg, X(n), Y(0), X(n), Y(0) + 5);
    lettering(svg, X(n), Y(0) + 21, n, 'middle');
  }
  lettering(svg, 355, 199, '어디까지 셌나 (x) →', 'end', 'film-axis-title');
  let d = 'M' + X(1) + ' ' + Y(0);
  for (let n = 2; n < x; n++) d += ' H' + X(n) + ' V' + Y(score(n));
  trace(svg, d, 'film-ink');
  if (x > 1) {
    const newSegment = 'M' + X(x - 1) + ' ' + Y(score(x - 1)) + ' H' + X(x) + ' V' + Y(amount);
    trace(svg, newSegment, 'film-highlight', animate);
  }
  for (let n = 1; n <= x; n++) {
    const point = pin(svg, X(n), Y(score(n)), n === x);
    if (n === x && animate && allowsMotion()) point.animate([{ opacity: 0 }, { opacity: 0, offset: .8 }, { opacity: 1 }], { duration: 1450 });
  }
  const digits = weighted ? 3 : 0;
  lettering(svg, X(x) + (x > 3 ? -8 : 8), Y(amount) - 10,
    '(' + x + ', ' + amount.toFixed(digits) + ')', x > 3 ? 'end' : 'start', 'film-label');
  if (weighted) {
    const p = x === 4 ? 2 : x;
    formula(chart, '이전 높이 ' + score(x - 1).toFixed(3) + ' + ln ' + p + ' ≈ ' + amount.toFixed(3));
  } else {
    const primesSeen = [2, 3, 5].filter(p => p <= x);
    formula(chart, '찾은 소수　' + (primesSeen.join(', ') || '없음') + '　·　누적 ' + amount + '개');
  }
}

function drawGapFrame(chart, frame, animate) {
  const count = frame.count;
  const exact = psiTrue(5.5);
  const terms = Array(count).fill(0.5);
  const estimate = psiApprox(5.5, terms);
  const x = v => 31 + (v - 4.5) * 153;
  const y = v => 173 - (v - 2.35) * 63;
  const svg = diagram(chart, 400, 226, '가로 위치 5.5에서 검은 계단과 붉은 근사선의 세로 거리 ' + Math.abs(exact - estimate).toFixed(3));
  lettering(svg, 11, 15, '↑ 더해 온 높이', 'start', 'film-axis-title');
  for (const v of [2.5, 3, 3.5, 4, 4.5]) {
    line(svg, x(4.5), y(v), x(6), y(v));
    lettering(svg, x(4.5) - 6, y(v) + 4, v, 'end');
  }
  for (const v of [4.5, 5, 5.5, 6]) lettering(svg, x(v), 195, v, 'middle');
  lettering(svg, x(6), 216, '어디까지 셌나 (x) →', 'end', 'film-axis-title');
  trace(svg, 'M' + x(4.5) + ' ' + y(psiTrue(4.5)) + ' H' + x(5) + ' V' + y(exact) + ' H' + x(6), 'film-ink');
  const points = [];
  for (let i = 0; i <= 240; i++) {
    const at = 4.5 + 1.5 * i / 240;
    points.push((i ? 'L' : 'M') + x(at).toFixed(2) + ' ' + y(psiApprox(at, terms)).toFixed(2));
  }
  trace(svg, points.join(' '), 'film-approx', animate);
  line(svg, x(5.5), 27, x(5.5), 180, 'film-guide');
  pin(svg, x(5.5), y(exact));
  pin(svg, x(5.5), y(estimate), true);
  // The guided frames share a scale. Allow room for larger exploratory values.
  const rulerTop = Math.max(4.18, estimate + 0.08);
  const rulerY = value => 164 - (value - 3.64) * 132 / (rulerTop - 3.64);
  const rulerX = 317;
  lettering(svg, 337, 24, '5.5에서 확대', 'middle', 'film-axis-title');
  line(svg, rulerX, 32, rulerX, 164);
  line(svg, rulerX, rulerY(exact), rulerX, rulerY(estimate), 'film-bracket');
  pin(svg, rulerX, rulerY(exact)).setAttribute('r', 2.5);
  pin(svg, rulerX, rulerY(estimate), true).setAttribute('r', 2.5);
  lettering(svg, rulerX + 9, rulerY(exact) + (estimate > exact ? 14 : -6), exact.toFixed(3), 'start', 'film-label-ink');
  lettering(svg, rulerX + 9, rulerY(estimate) + (estimate > exact ? -5 : 13), estimate.toFixed(3), 'start', 'film-label');
  make(chart, 'p', 'xp__chart-key', '● 실제 계단　 ○ 붉은 근사선 · 파동 ' + count + '개');
  formula(chart, '두 높이의 차이　|' + exact.toFixed(3) + ' − ' + estimate.toFixed(3) + '| ≈ ' + Math.abs(exact - estimate).toFixed(3));
}

function zeroRuler(svg, moved, animate) {
  const x = v => 33 + 330 * v;
  line(svg, x(0), 41, x(1), 41);
  for (const v of [0, 0.5, 1]) {
    line(svg, x(v), 38, x(v), 46);
    lettering(svg, x(v), 61, v === 0.5 ? '½' : v, 'middle');
  }
  lettering(svg, 13, 14, '점의 가로 위치', 'start', 'film-axis-title');
  pin(svg, x(0.5), 41);
  if (moved) {
    const dot = pin(svg, x(0.9), 41, true);
    if (animate && allowsMotion()) dot.animate([{ transform: 'translateX(-132px)' }, { transform: 'translateX(0)' }], { duration: 1100, easing: 'ease-in-out' });
    lettering(svg, x(0.9), 27, '0.90', 'middle', 'film-label');
  }
}

function drawWaveFrame(chart, frame, animate) {
  const near = frame.view === 'wave';
  const moved = frame.moved || !near;
  const svg = diagram(chart, 400, near ? 236 : 203, near ? '수를 10까지 봤을 때, 영점 위치와 진폭' : '같은 세로 눈금에서 10과 100의 물결 진폭 비교');
  if (near) zeroRuler(svg, moved, animate);
  const baseline = near ? 158 : 101;
  const scale = near ? 49 : 7;
  const maximum = near ? 1 : 10;
  const panels = near ? [[10, 36, 365]] : [[10, 39, 184], [100, 226, 370]];
  lettering(svg, 12, near ? 87 : 14, '↑ 물결의 높이', 'start', 'film-axis-title');
  for (const [x, left, right] of panels) {
    const y = v => baseline - v * scale;
    for (const level of [-maximum, 0, maximum]) {
      line(svg, left, y(level), right, y(level), level ? 'film-rule' : 'film-midline');
      lettering(svg, left - 5, y(level) + 4, level > 0 ? '+' + level : level, 'end');
    }
    for (const sigma of moved ? [0.5, 0.9] : [0.5]) {
      const amp = amplitude(x, sigma, GAMMA[0]);
      const coords = [];
      for (let k = 0; k <= 100; k++) {
        const t = k / 100;
        coords.push((k ? 'L' : 'M') + (left + (right - left) * t).toFixed(2) + ' ' + y(amp * Math.sin(2 * Math.PI * t)).toFixed(2));
      }
      trace(svg, coords.join(' '), sigma === 0.5 ? 'film-ink' : 'film-approx', animate && (!near || sigma === 0.9));
      const crestX = left + (right - left) / 4;
      pin(svg, crestX, y(amp), sigma !== 0.5);
      if (near && (sigma !== 0.5 || !moved)) {
        line(svg, crestX, baseline, crestX, y(amp), 'film-bracket');
        lettering(svg, crestX + 9, y(amp) - 5, '진폭 ' + amp.toFixed(2), 'start', 'film-label');
      }
    }
    if (!near) lettering(svg, (left + right) / 2, 194, '수를 ' + x + '까지 봤을 때', 'middle', 'film-axis-title');
  }
  if (near) lettering(svg, 365, 232, '한 주기의 진행 →', 'end', 'film-axis-title');
  make(chart, 'p', 'xp__chart-key', '━ 가로 위치 0.50' + (moved ? '　┄ 가로 위치 0.90' : '') + '　·　시작점을 맞춘 한 주기');
  if (near) formula(chart, moved ? '10에서 진폭　0.45 → 1.12' : '10에서 진폭　0 → 꼭대기까지 0.45');
  else formula(chart, '10에서　0.45 / 1.12　　100에서　1.41 / 8.91');
}

function drawScaleFrame(chart, frame, shifted = 0.9, animate = false) {
  const size = 1e12;
  const band = envelope(size);
  const svg = diagram(chart, 400, 164, '1조에서 가로 위치 0.50과 ' + shifted.toFixed(2) + '의 진폭을 기준 규모로 나눈 값');
  const max = Math.max(12, Math.ceil(amplitude(size, shifted, GAMMA[0]) / band / 10) * 10);
  const extent = shifted <= 0.9 ? 12 : max;
  const X = v => 26 + 336 * v / extent;
  lettering(svg, 12, 14, '1조에서의 진폭 ÷ 기준 규모', 'start', 'film-axis-title');
  line(svg, X(1), 24, X(1), 136, 'film-guide');
  for (const [sigma, row] of [[0.5, 53], [shifted, 106]]) {
    const ratio = amplitude(size, sigma, GAMMA[0]) / band;
    lettering(svg, 26, row - 6, '위치 ' + sigma.toFixed(2) + '　' + ratio.toFixed(ratio < 0.01 ? 5 : 2) + '배', 'start', row === 53 ? 'film-label-ink' : 'film-label');
    line(svg, X(0), row + 5, X(extent), row + 5);
    trace(svg, 'M' + X(0) + ' ' + (row + 5) + ' H' + X(ratio),
      row === 53 ? 'film-ink' : 'film-highlight', animate && row === 106);
    const tip = pin(svg, X(ratio), row + 5, row === 106);
    if (animate && row === 106 && allowsMotion()) {
      tip.animate([{ transform: 'translateX(' + (X(0) - X(ratio)) + 'px)' }, { transform: 'translateX(0)' }],
        { duration: 1450, easing: 'ease-in-out' });
    }
  }
  for (const tick of (extent === 12 ? [0, 1, 5, 10, 12] : [1, extent / 2, extent])) lettering(svg, X(tick), 151, tick === 1 ? '1배' : tick, 'middle');
  if (frame.view === 'ending') {
    const growth = make(chart, 'p', 'xp__formula-line', '원래 진폭은 √x에, 비교 진폭은 x');
    make(growth, 'sup', '', shifted.toFixed(2));
    growth.append('에 비례해요.');
  } else formula(chart, '1배 = √x (ln x)²　·　x = 1조');
  make(chart, 'p', 'xp__chart-key', '1배는 오차의 성장 속도를 비교하기 위한 눈금이에요. 실제 오차가 매번 1배 이하여야 한다는 뜻은 아니에요.');
}

function exploreLastFrame(plate, chart, chapter, frame) {
  const details = make(plate, 'details', 'xp__film-explore');
  make(details, 'summary', '', chapter ? '직접 점의 위치 바꾸기' : '직접 파동 개수 바꾸기');
  const label = make(details, 'label', 'xp__slider');
  make(label, 'span', '', chapter ? '비교할 점의 가로 위치' : '겹칠 파동의 개수');
  const initial = chapter ? 0.9 : 60;
  const value = make(label, 'b');
  const input = make(label, 'input');
  input.type = 'range';
  Object.assign(input, chapter ? { min: 0.5, max: 0.99, step: 0.01 } : { min: 0, max: 60, step: 1 });
  input.value = initial;
  const update = () => {
    const n = Number(input.value);
    const text = chapter ? n.toFixed(2) : n + '개';
    value.textContent = text;
    input.setAttribute('aria-valuetext', text);
  };
  update();
  const paint = () => {
    update();
    chart.replaceChildren();
    if (chapter) drawScaleFrame(chart, frame, Number(input.value));
    else drawGapFrame(chart, { count: Number(input.value) }, false);
  };
  input.addEventListener('input', paint);
  details.addEventListener('toggle', () => {
    if (!details.open) {
      input.value = initial;
      paint();
    }
  });
}
