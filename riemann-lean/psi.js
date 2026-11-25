import { GAMMA } from './data.js';

export const LENS = Object.freeze({ xMin: 2, xMax: 100, yMax: 105, residual: 10 });

const TWO_PI_LOG = Math.log(2 * Math.PI);
const PRIME_LIMIT = 1000;
const GRID_SIZE = 420;
const STATS_SIZE = Math.round((LENS.xMax - LENS.xMin) / 0.25) + 1;
const SIGMA_MIN = 0.5;
const SIGMA_STEP = 0.005;
const SIGMA_STEPS = Math.round((0.85 - SIGMA_MIN) / SIGMA_STEP) + 1;
const MAX_DPR = 2;

function sievePrimes(limit) {
  const composite = new Uint8Array(limit + 1);
  const primes = [];
  for (let n = 2; n <= limit; n += 1) {
    if (composite[n]) continue;
    primes.push(n);
    if (n * n <= limit) {
      for (let multiple = n * n; multiple <= limit; multiple += n) composite[multiple] = 1;
    }
  }
  return primes;
}

// The sieve is intentionally built once: ψ is queried repeatedly while the chart moves.
const PRIMES = sievePrimes(PRIME_LIMIT);
const X100_COS = Float64Array.from(GAMMA, (gamma) => Math.cos(gamma * Math.log(100)));
const X100_SIN = Float64Array.from(GAMMA, (gamma) => Math.sin(gamma * Math.log(100)));

function normalizeSigmas(sigmas = 0.5) {
  if (typeof sigmas === 'number') {
    return { values: null, length: GAMMA.length, valueAt: () => sigmas };
  }
  if (sigmas && typeof sigmas.length === 'number') {
    const length = Math.max(0, Math.min(GAMMA.length, Math.floor(sigmas.length)));
    return { values: sigmas, length, valueAt: (index) => Number(sigmas[index]) };
  }
  return { values: null, length: GAMMA.length, valueAt: () => 0.5 };
}

export function psiTrue(x) {
  if (!Number.isFinite(x) || x < 2) return 0;
  let sum = 0;
  for (const p of PRIMES) {
    if (p > x) break;
    let power = p;
    while (power <= x) {
      sum += Math.log(p);
      if (power > x / p) break;
      power *= p;
    }
  }
  return sum;
}

export function psiApprox(x, sigmas = 0.5) {
  if (!(x > 1) || !Number.isFinite(x)) return Number.NaN;
  const normalized = normalizeSigmas(sigmas);
  const logX = Math.log(x);
  let sum = 0;
  for (let k = 0; k < normalized.length; k += 1) {
    const sigma = normalized.valueAt(k);
    const gamma = GAMMA[k];
    if (!Number.isFinite(sigma)) continue;
    sum += 2 * (x ** sigma) * (sigma * Math.cos(gamma * logX) + gamma * Math.sin(gamma * logX))
      / (sigma * sigma + gamma * gamma);
  }
  return x - sum - TWO_PI_LOG - 0.5 * Math.log(1 - (x ** -2));
}

export function waveAmplitude(x, sigma, gamma) {
  if (!(x > 0) || !Number.isFinite(x) || !Number.isFinite(sigma) || !Number.isFinite(gamma)) {
    return Number.NaN;
  }
  return 2 * (x ** sigma) / Math.hypot(sigma, gamma);
}

export function rmsError(sigmas, x0 = LENS.xMin, x1 = LENS.xMax, step = 0.25) {
  if (!(step > 0) || !Number.isFinite(step) || !Number.isFinite(x0) || !Number.isFinite(x1) || x1 < x0) {
    return Number.NaN;
  }
  let sumSquares = 0;
  let count = 0;
  for (let x = x0; x <= x1 + step * 1e-9; x += step) {
    const error = psiApprox(x, sigmas) - psiTrue(x);
    if (!Number.isFinite(error)) return Number.NaN;
    sumSquares += error * error;
    count += 1;
  }
  return count ? Math.sqrt(sumSquares / count) : Number.NaN;
}

function makeStepEvents() {
  const events = new Map();
  for (const p of PRIMES) {
    if (p > LENS.xMax) break;
    for (let power = p; power <= LENS.xMax; power *= p) {
      events.set(power, (events.get(power) || 0) + Math.log(p));
      if (power > LENS.xMax / p) break;
    }
  }
  return [...events.entries()].sort((a, b) => a[0] - b[0]);
}

const STEP_EVENTS = makeStepEvents();

function makeGrid(size = GRID_SIZE) {
  const xs = new Float32Array(size);
  const lnXs = new Float32Array(size);
  const sqrtXs = new Float32Array(size);
  const truths = new Float32Array(size);
  const cosines = new Float32Array(size * GAMMA.length);
  const sines = new Float32Array(size * GAMMA.length);
  const powers = new Float32Array(size * SIGMA_STEPS);
  for (let i = 0; i < size; i += 1) {
    const x = LENS.xMin + (LENS.xMax - LENS.xMin) * i / (size - 1);
    xs[i] = x;
    lnXs[i] = Math.log(x);
    sqrtXs[i] = Math.sqrt(x);
    truths[i] = psiTrue(x);
    for (let s = 0; s < SIGMA_STEPS; s += 1) powers[i * SIGMA_STEPS + s] = x ** (SIGMA_MIN + s * SIGMA_STEP);
    const offset = i * GAMMA.length;
    for (let k = 0; k < GAMMA.length; k += 1) {
      const phase = GAMMA[k] * lnXs[i];
      cosines[offset + k] = Math.cos(phase);
      sines[offset + k] = Math.sin(phase);
    }
  }
  return { xs, lnXs, sqrtXs, truths, cosines, sines, powers };
}

// Trigonometric values are shared by the curve, residual, and spectrum views.
const GRID = makeGrid();
const STATS_GRID = makeGrid(STATS_SIZE);

function sigmasForCount(count, sigmaValues) {
  const length = Math.min(GAMMA.length, Math.max(0, count));
  return Array.from({ length }, (_, index) => sigmaValues[index] ?? 0.5);
}

function sampleApproxAt(index, sigmas, grid = GRID) {
  const x = grid.xs[index];
  const logX = grid.lnXs[index];
  let sum = 0;
  const offset = index * GAMMA.length;
  for (let k = 0; k < sigmas.length; k += 1) {
    const sigma = sigmas[k];
    const gamma = GAMMA[k];
    const sigmaIndex = Math.max(0, Math.min(SIGMA_STEPS - 1, Math.round((sigma - SIGMA_MIN) / SIGMA_STEP)));
    const denominator = sigma * sigma + gamma * gamma;
    sum += 2 * grid.powers[index * SIGMA_STEPS + sigmaIndex] * (sigma * grid.cosines[offset + k] + gamma * grid.sines[offset + k]) / denominator;
  }
  return x - sum - TWO_PI_LOG - 0.5 * Math.log(1 - Math.exp(-2 * logX));
}

function computeStats(sigmas) {
  let squares = 0;
  let maxAbs = 0;
  for (let i = 0; i < STATS_SIZE; i += 1) {
    const error = sampleApproxAt(i, sigmas, STATS_GRID) - STATS_GRID.truths[i];
    squares += error * error;
    maxAbs = Math.max(maxAbs, Math.abs(error));
  }
  return { rms: Math.sqrt(squares / STATS_SIZE), maxAbs };
}

function fmt(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

export function initLab(root = document) {
  const scope = root || document;
  const query = (selector) => scope.querySelector(selector);
  const all = (selector) => [...scope.querySelectorAll(selector)];
  const plate = query('#labPlate');
  const psiCanvas = query('#psiCanvas');
  const planeCanvas = query('#planeCanvas');
  const nRange = query('#nRange');
  const sigmaRange = query('#sigmaRange');
  const nValue = query('#nValue');
  const sigmaValue = query('#sigmaValue');
  const spectrum = query('#spectrum');
  if (!plate || !psiCanvas || !planeCanvas || !nRange || !sigmaRange) return () => {};

  const ctx = psiCanvas.getContext('2d');
  const planeCtx = planeCanvas.getContext('2d');
  if (!ctx || !planeCtx) return () => {};
  planeCanvas.style.touchAction = 'pan-y';

  let count = Math.max(1, Math.min(GAMMA.length, Number(nRange.value) || 15));
  const sigmaValues = new Float64Array(GAMMA.length);
  sigmaValues.fill(Number(sigmaRange.value) || 0.5);
  let sigma = sigmaValues[0];
  let allTogether = Boolean(query('#allTogether')?.checked);
  let selectedIndex = 0;
  let activeTab = 'wave';
  let currentEra = document.documentElement.dataset.era || 'paper';
  let isInView = false;
  let isDragging = false;
  let criticalSnap = false;
  let statusTimer = 0;
  let drawFrame = 0;
  let tweenFrame = 0;
  let lastTweenMetricsAt = -Infinity;
  let pointerX = null;
  let destroyed = false;
  const aborter = new AbortController();
  const signal = aborter.signal;
  const steps = all('.step[data-step]');
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function readTheme() {
    const style = getComputedStyle(plate);
    const value = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    const terminal = currentEra === 'terminal' || currentEra === 'term';
    return {
      ink: value('--c-ink', terminal ? '#d8e3f0' : '#17243a'),
      muted: value('--c-muted', terminal ? '#8395a7' : '#5e5b4e'),
      rule: value('--c-line', value('--c-rule', terminal ? '#1e2a36' : '#c9c4b0')),
      accent: value('--c-accent', terminal ? '#7fd8ff' : '#1b3b6f'),
      margin: value('--c-bad', terminal ? '#ff7a7a' : '#962830'),
      paper: value('--c-surface', terminal ? '#101720' : '#efebda'),
    };
  }
  let colors = readTheme();
  const waveValues = new Float32Array(GRID_SIZE);
  const waveResiduals = new Float32Array(GRID_SIZE);

  function snapDraggedSigma(value) {
    const bounded = Math.max(0.5, Math.min(0.85, value));
    if (!criticalSnap && bounded <= 0.515) criticalSnap = true;
    else if (criticalSnap && bounded >= 0.52) criticalSnap = false;
    return criticalSnap ? 0.5 : 0.5 + Math.round((bounded - 0.5) / 0.005) * 0.005;
  }

  function resizeCanvas(canvas, context) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || canvas.clientWidth || 640);
    const height = Math.max(1, rect.height || canvas.clientHeight || 340);
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function drawWave() {
    if (destroyed || document.hidden || !isInView || !psiCanvas.getClientRects().length) return;
    const { width, height } = resizeCanvas(psiCanvas, ctx);
    if (width < 10 || height < 10) return;
    const plot = { x: 42, y: 14, w: width - 54, h: (height - 48) * 0.62 };
    const residual = { x: plot.x, y: plot.y + plot.h + 26, w: plot.w, h: Math.max(1, height - (plot.y + plot.h + 35)) };
    const xPos = (x) => plot.x + (x - LENS.xMin) / (LENS.xMax - LENS.xMin) * plot.w;
    const yPos = (y) => plot.y + plot.h - y / LENS.yMax * plot.h;
    const residualY = (value) => residual.y + residual.h - (value + LENS.residual) / (2 * LENS.residual) * residual.h;
    const sigmas = sigmasForCount(count, sigmaValues);
    const values = waveValues;
    const errors = waveResiduals;
    for (let i = 0; i < GRID_SIZE; i += 1) {
      values[i] = sampleApproxAt(i, sigmas);
      errors[i] = values[i] - GRID.xs[i];
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, width, height);
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.rule;
    ctx.fillStyle = colors.muted;

    // Main plot axes and reference grid.
    for (const y of [0, 25, 50, 75, 100]) {
      const py = yPos(y);
      ctx.beginPath();
      ctx.moveTo(plot.x, py);
      ctx.lineTo(plot.x + plot.w, py);
      ctx.stroke();
      ctx.fillText(String(y), 8, py + 3);
    }
    for (const x of [2, 20, 40, 60, 80, 100]) {
      const px = xPos(x);
      ctx.beginPath();
      ctx.moveTo(px, plot.y);
      ctx.lineTo(px, plot.y + plot.h);
      ctx.stroke();
      ctx.fillText(String(x), px - 7, plot.y + plot.h + 13);
    }

    // The main term x is shown as a restrained dashed guide.
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.muted;
    ctx.beginPath();
    ctx.moveTo(xPos(LENS.xMin), yPos(LENS.xMin));
    ctx.lineTo(xPos(LENS.xMax), yPos(LENS.xMax));
    ctx.stroke();
    ctx.restore();

    // Exact Chebyshev staircase, with a vertical jump at each prime power.
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    let current = psiTrue(LENS.xMin);
    ctx.moveTo(xPos(LENS.xMin), yPos(current));
    for (const [power, jump] of STEP_EVENTS) {
      if (power <= LENS.xMin || power > LENS.xMax) continue;
      ctx.lineTo(xPos(power), yPos(current));
      current += jump;
      ctx.lineTo(xPos(power), yPos(current));
    }
    ctx.lineTo(xPos(LENS.xMax), yPos(current));
    ctx.stroke();

    // Selected truncated explicit formula.
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < GRID_SIZE; i += 1) {
      const px = xPos(GRID.xs[i]);
      const py = yPos(Math.max(0, Math.min(LENS.yMax, values[i])));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Residual plot, symmetric around zero with clipping markers at ±10.
    ctx.strokeStyle = colors.rule;
    ctx.lineWidth = 1;
    for (const level of [-10, 0, 10]) {
      const py = residualY(level);
      ctx.beginPath();
      ctx.moveTo(residual.x, py);
      ctx.lineTo(residual.x + residual.w, py);
      ctx.stroke();
      ctx.fillStyle = colors.muted;
      ctx.fillText(String(level), 9, py + 3);
    }
    ctx.fillStyle = colors.muted;
    ctx.fillText('ψ(x) − x', 8, residual.y - 8);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let residualValue = psiTrue(LENS.xMin);
    ctx.moveTo(xPos(LENS.xMin), residualY(residualValue - LENS.xMin));
    for (const [power, jump] of STEP_EVENTS) {
      if (power <= LENS.xMin) continue;
      ctx.lineTo(xPos(power), residualY(residualValue - power));
      residualValue += jump;
      ctx.lineTo(xPos(power), residualY(residualValue - power));
    }
    ctx.lineTo(xPos(LENS.xMax), residualY(residualValue - LENS.xMax));
    ctx.stroke();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (let i = 0; i < GRID_SIZE; i += 1) {
      const x = xPos(GRID.xs[i]);
      const y = residualY(Math.max(-LENS.residual, Math.min(LENS.residual, errors[i])));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = colors.margin;
    for (let i = 0; i < GRID_SIZE; i += 1) {
      if (errors[i] > LENS.residual && (i === 0 || errors[i - 1] <= LENS.residual)) {
        const x = xPos(GRID.xs[i]);
        const y = residual.y + 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 7);
        ctx.lineTo(x + 4, y + 7);
        ctx.closePath();
        ctx.fill();
      } else if (errors[i] < -LENS.residual && (i === 0 || errors[i - 1] >= -LENS.residual)) {
        const x = xPos(GRID.xs[i]);
        const y = residual.y + residual.h - 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y - 7);
        ctx.lineTo(x + 4, y - 7);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (pointerX !== null) {
      const localX = Math.max(plot.x, Math.min(plot.x + plot.w, pointerX));
      const x = LENS.xMin + (localX - plot.x) / plot.w * (LENS.xMax - LENS.xMin);
      const index = Math.max(0, Math.min(GRID_SIZE - 1, Math.round((x - LENS.xMin) / (LENS.xMax - LENS.xMin) * (GRID_SIZE - 1))));
      const exact = psiTrue(x);
      const approx = sampleApproxAt(index, sigmas);
      const pointX = xPos(x);
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = colors.margin;
      ctx.beginPath();
      ctx.moveTo(pointX, plot.y);
      ctx.lineTo(pointX, residual.y + residual.h);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      ctx.arc(pointX, yPos(Math.max(0, Math.min(LENS.yMax, approx))), 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.margin;
      ctx.beginPath();
      ctx.arc(pointX, residualY(Math.max(-LENS.residual, Math.min(LENS.residual, approx - x))), 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.fillText(`x ${fmt(x, 1)} · ψ ${fmt(exact, 2)} · 근사 ${fmt(approx, 2)}`, plot.x + 4, plot.y + 12);
    }
  }

  function drawPlane() {
    if (destroyed || document.hidden || !isInView || !planeCanvas.getClientRects().length) return;
    const { width, height } = resizeCanvas(planeCanvas, planeCtx);
    if (width < 10 || height < 10) return;
    const plot = { x: 36, y: 14, w: width - 48, h: height - 44 };
    const px = (re) => plot.x + re * plot.w;
    const py = (im) => plot.y + plot.h - im / 170 * plot.h;
    planeCtx.clearRect(0, 0, width, height);
    planeCtx.fillStyle = colors.paper;
    planeCtx.fillRect(0, 0, width, height);
    planeCtx.save();
    planeCtx.globalAlpha = 0.04;
    planeCtx.fillStyle = colors.accent;
    planeCtx.fillRect(plot.x, plot.y, plot.w, plot.h);
    planeCtx.restore();
    planeCtx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    planeCtx.strokeStyle = colors.rule;
    planeCtx.fillStyle = colors.muted;
    for (const re of [0, 0.25, 0.5, 0.75, 1]) {
      planeCtx.beginPath();
      planeCtx.moveTo(px(re), plot.y);
      planeCtx.lineTo(px(re), plot.y + plot.h);
      planeCtx.stroke();
      planeCtx.fillText(re.toFixed(re === 0 || re === 1 ? 0 : 2), px(re) - 10, plot.y + plot.h + 14);
    }
    for (const im of [0, 40, 80, 120, 160]) {
      planeCtx.beginPath();
      planeCtx.moveTo(plot.x, py(im));
      planeCtx.lineTo(plot.x + plot.w, py(im));
      planeCtx.stroke();
      planeCtx.fillText(String(im), 4, py(im) + 3);
    }
    planeCtx.save();
    planeCtx.setLineDash([4, 4]);
    planeCtx.strokeStyle = colors.accent;
    planeCtx.lineWidth = 1.5;
    planeCtx.beginPath();
    planeCtx.moveTo(px(0.5), plot.y);
    planeCtx.lineTo(px(0.5), plot.y + plot.h);
    planeCtx.stroke();
    planeCtx.restore();
    planeCtx.fillStyle = colors.muted;
    planeCtx.fillText('실수부 Re(ρ)', plot.x + plot.w - 72, plot.y + plot.h + 30);
    planeCtx.fillText('허수부 Im(ρ)', 4, plot.y + 10);

    for (let i = 0; i < GAMMA.length; i += 1) {
      const active = i < count;
      const x = px(sigmaValues[i]);
      const y = py(GAMMA[i]);
      planeCtx.beginPath();
      planeCtx.arc(x, y, i === selectedIndex ? 5 : 3.5, 0, Math.PI * 2);
      planeCtx.fillStyle = active ? colors.accent : colors.muted;
      planeCtx.globalAlpha = active ? (i === selectedIndex ? 1 : 0.76) : 0.25;
      planeCtx.fill();
      planeCtx.globalAlpha = 1;
      if (i === selectedIndex) {
        planeCtx.beginPath();
        planeCtx.arc(x, y, 7.2, 0, Math.PI * 2);
        planeCtx.strokeStyle = colors.ink;
        planeCtx.lineWidth = 1;
        planeCtx.stroke();
      }
      if (i < 3) {
        planeCtx.fillStyle = colors.ink;
        const label = document.documentElement.dataset.mode === 'math'
          ? `γ${i + 1} ${fmt(GAMMA[i], 2)}`
          : `γ${i + 1}`;
        planeCtx.fillText(label, Math.min(x + 9, width - planeCtx.measureText(label).width - 3), y - 4 - i * 5);
      }
    }
  }

  function draw() {
    if (drawFrame || destroyed || document.hidden || !isInView) return;
    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      drawWave();
      drawPlane();
    });
  }

  function updateSpectrum() {
    if (!spectrum) return;
    while (spectrum.children.length > count) spectrum.lastElementChild.remove();
    while (spectrum.children.length < count) {
      const index = spectrum.children.length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spectrum__bar';
      button.dataset.index = String(index);
      button.dataset.gamma = String(GAMMA[index]);
      const bar = document.createElement('i');
      bar.setAttribute('aria-hidden', 'true');
      button.append(bar);
      const tooltip = document.createElement('span');
      tooltip.className = 'spectrum__tooltip';
      button.append(tooltip);
      spectrum.append(button);
    }
    let maxAbs = 0;
    const contributions = GAMMA.slice(0, count).map((gamma, index) => {
      const termSigma = sigmaValues[index];
      const value = 2 * (100 ** termSigma) * (termSigma * X100_COS[index] + gamma * X100_SIN[index]) / (termSigma * termSigma + gamma * gamma);
      maxAbs = Math.max(maxAbs, Math.abs(value));
      return value;
    });
    const scale = maxAbs || 1;
    for (let i = 0; i < count; i += 1) {
      const button = spectrum.children[i];
      const gamma = GAMMA[i];
      const phaseDegrees = Math.atan2(gamma, sigmaValues[i]) * 180 / Math.PI;
      const sign = contributions[i] < 0 ? 'negative' : 'positive';
      button.dataset.sign = sign;
      button.toggleAttribute('data-selected', i === selectedIndex);
      button.setAttribute('aria-pressed', String(i === selectedIndex));
      button.setAttribute('aria-label', `영점 ${i + 1}, 감마 ${gamma.toFixed(6)}, 위상 ${fmt(phaseDegrees, 1)}도, 부호 있는 기여 ${fmt(contributions[i], 4)}`);
      const bar = button.firstElementChild;
      bar.style.setProperty('--height', `${Math.max(1, Math.abs(contributions[i]) / scale * 44)}px`);
      const escaped = sigmaValues[i] > 0.5;
      bar.style.setProperty('--bar-color', escaped ? 'var(--c-warn)' : contributions[i] < 0 ? 'var(--c-muted)' : 'var(--c-accent)');
      button.lastElementChild.textContent = `γ ${gamma.toFixed(6)} · φ ${fmt(phaseDegrees, 1)}° · ${contributions[i] >= 0 ? '+' : ''}${fmt(contributions[i], 2)}${escaped ? ' · 이탈' : ''}`;
    }
  }

  function updateMetrics() {
    const sigmas = sigmasForCount(count, sigmaValues);
    const stats = computeStats(sigmas);
    const activeCount = sigmas.length;
    const selectedGamma = GAMMA[Math.min(selectedIndex, GAMMA.length - 1)];
    const amplitude = waveAmplitude(100, sigmaValues[selectedIndex], selectedGamma);
    const referenceAmplitude = waveAmplitude(100, 0.5, selectedGamma);
    const ratio = amplitude / Math.max(referenceAmplitude, 1e-9);
    const escapedCount = sigmas.filter(value => value > 0.5).length;
    const scopeLabel = escapedCount ? `이탈 ${escapedCount}/${activeCount} · ` : '';
    const readout = `${scopeLabel}N = ${activeCount} · σ = ${sigma.toFixed(3)} · RMS ${fmt(stats.rms, 2)} · 최대 오차 ${fmt(stats.maxAbs, 2)} · 진폭 ×${fmt(ratio, 2)}`;
    setText(query('#labReadout'), readout);
    setText(query('#labModelN'), String(activeCount));
    const summary = `ψ(x) 소수 계단과 영점 근사. N ${activeCount}, 선택한 σ ${sigma.toFixed(3)}, RMS ${fmt(stats.rms, 2)}, 최대 오차 ${fmt(stats.maxAbs, 2)}.`;
    psiCanvas.setAttribute('aria-label', summary);
    setText(query('#planeSummary'), `선택한 영점 γ${selectedIndex + 1} = ${selectedGamma.toFixed(6)}, 실수부 σ = ${sigma.toFixed(3)}. 임계선은 Re(ρ) = 1/2입니다.`);
    const badge = query('#labBadge');
    if (badge) {
      badge.dataset.regime = Math.abs(sigma - 0.5) < 0.02 ? 'critical' : 'escaped';
      badge.textContent = `N ${activeCount} · γ${selectedIndex + 1} σ ${sigma.toFixed(2)}`;
    }
    updateSpectrum();
    draw();
    queueStatus(stats, escapedCount, summary);
  }

  function queueStatus(stats, escapedCount, summary) {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      const state = escapedCount ? `△ 이탈 · 영점 ${escapedCount}개가 임계선 밖` : '✓ 조율됨 · 모든 영점이 임계선 위';
      const endpoint = count === 1 ? ' · 영점 1개 · 가장 낮은 음만' : count === GAMMA.length ? ' · 영점 60개 · 화면의 근사 한계' : '';
      const error = stats.rms < 1 ? '계단과의 평균 오차 1.0 미만' : '계단과의 평균 오차 1.0 이상';
      setText(query('#labStatus'), `${state}${endpoint} · ${error}`);
      setText(query('#psiSummary'), summary);
    }, 400);
  }

  function updateControls(refreshMetrics = true) {
    count = Math.max(1, Math.min(GAMMA.length, Math.round(count)));
    selectedIndex = Math.max(0, Math.min(count - 1, selectedIndex));
    const sigmaMin = Number(sigmaRange.min) || 0.5;
    const sigmaStep = Number(sigmaRange.step) || 0.005;
    sigma = Math.max(sigmaMin, Math.min(Number(sigmaRange.max) || 0.85, sigmaValues[selectedIndex]));
    sigma = sigmaMin + Math.round((sigma - sigmaMin) / sigmaStep) * sigmaStep;
    nRange.value = String(count);
    sigmaRange.value = String(sigma);
    setText(nValue, String(count));
    setText(sigmaValue, sigma.toFixed(3));
    nRange.setAttribute('aria-valuetext', `영점 ${count}개`);
    const criticalLabel = sigma === 0.5 ? '임계선 위' : `임계선에서 ${(sigma - 0.5).toFixed(3)} 이탈`;
    sigmaRange.setAttribute('aria-valuetext', `${sigma.toFixed(3)}, ${criticalLabel}`);
    const allTogetherInput = query('#allTogether');
    if (allTogetherInput) allTogetherInput.checked = allTogether;
    if (plate) {
      plate.dataset.labView = activeTab;
      plate.dataset.sigmaState = Math.abs(sigma - 0.5) < 0.02 ? 'critical' : 'escaped';
    }
    for (const tab of all('.lab-tabs [data-lab-tab]')) {
      const selected = tab.dataset.labTab === activeTab;
      tab.setAttribute('aria-pressed', String(selected));
      tab.classList.toggle('is-active', selected);
    }
    for (const button of all('[data-preset]')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.preset) === count));
    }
    if (refreshMetrics) updateMetrics();
    else draw();
  }

  function cancelTween() {
    if (tweenFrame) cancelAnimationFrame(tweenFrame);
    tweenFrame = 0;
  }

  function animateTo(nextCount, nextSigma, sigmaMode = 'preserve') {
    cancelTween();
    const fromCount = count;
    const fromSigmas = sigmaValues.slice();
    const targetSigmas = fromSigmas.slice();
    if (sigmaMode === 'first') {
      allTogether = false;
      selectedIndex = 0;
      targetSigmas.fill(0.5);
      targetSigmas[0] = nextSigma;
    } else if (sigmaMode === 'all') {
      targetSigmas.fill(nextSigma);
    }

    function apply(eased, refreshMetrics) {
      count = Math.round(fromCount + (nextCount - fromCount) * eased);
      if (sigmaMode !== 'preserve') {
        for (let i = 0; i < GAMMA.length; i += 1) {
          sigmaValues[i] = fromSigmas[i] + (targetSigmas[i] - fromSigmas[i]) * eased;
        }
      }
      updateControls(refreshMetrics);
    }

    if (motionReduced.matches) {
      apply(1, true);
      return;
    }

    const start = performance.now();
    lastTweenMetricsAt = start;
    const tick = now => {
      const t = Math.min(1, (now - start) / 320);
      const refreshMetrics = t >= 1 || now - lastTweenMetricsAt >= 100;
      if (refreshMetrics) lastTweenMetricsAt = now;
      apply(1 - (1 - t) ** 3, refreshMetrics);
      tweenFrame = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    tweenFrame = requestAnimationFrame(tick);
  }

  function applyStep(step) {
    const targetCount = Number(step.dataset.n);
    const targetSigma = Number(step.dataset.sigma);
    const sigmaMode = step.dataset.onlyZero === '0' || step.dataset.firstOnly === 'true' || step.dataset.step === '4' ? 'first' : 'all';
    if (Number.isFinite(targetCount) && Number.isFinite(targetSigma)) animateTo(targetCount, targetSigma, sigmaMode);
  }

  const stepObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const step of steps) step.classList.toggle('is-active', step === entry.target);
      if (plate) plate.dataset.highlight = entry.target.dataset.step;
      if (!isDragging) applyStep(entry.target);
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 }) : null;
  if (stepObserver) for (const step of steps) stepObserver.observe(step);
  else if (steps[0]) {
    steps[0].classList.add('is-active');
    if (plate) plate.dataset.highlight = steps[0].dataset.step;
    applyStep(steps[0]);
  }

  for (const button of all('[data-preset]')) {
    button.addEventListener('click', () => {
      const presetCount = Number(button.dataset.preset);
      if (Number.isFinite(presetCount)) {
        cancelTween();
        animateTo(presetCount, sigma, 'preserve');
      }
    }, { signal });
  }

  nRange.addEventListener('pointerdown', () => { isDragging = true; cancelTween(); }, { signal });
  sigmaRange.addEventListener('pointerdown', () => { isDragging = true; cancelTween(); }, { signal });
  window.addEventListener('pointerup', () => { isDragging = false; }, { signal });
  nRange.addEventListener('input', () => {
    cancelTween();
    count = Number(nRange.value);
    updateControls();
  }, { signal });
  sigmaRange.addEventListener('input', () => {
    cancelTween();
    sigma = Number(sigmaRange.value);
    if (allTogether) sigmaValues.fill(sigma, 0, count);
    else sigmaValues[selectedIndex] = sigma;
    updateControls();
  }, { signal });
  sigmaRange.addEventListener('keydown', (event) => {
    if (!event.shiftKey || !['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const direction = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : -1;
    cancelTween();
    sigma = Math.max(0.5, Math.min(0.85, sigma + direction * 0.05));
    if (allTogether) sigmaValues.fill(sigma, 0, count);
    else sigmaValues[selectedIndex] = sigma;
    updateControls();
  }, { signal });
  query('#resetSigma')?.addEventListener('click', () => {
    cancelTween();
    sigmaValues.fill(0.5);
    selectedIndex = 0;
    sigma = 0.5;
    updateControls();
  }, { signal });
  query('#allTogether')?.addEventListener('change', (event) => {
    cancelTween();
    allTogether = Boolean(event.currentTarget.checked);
    updateControls();
  }, { signal });
  for (const tab of all('.lab-tabs [data-lab-tab]')) {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.labTab === 'plane' ? 'plane' : 'wave';
      updateControls();
    }, { signal });
  }
  spectrum?.addEventListener('click', (event) => {
    const button = event.target.closest('.spectrum__bar');
    if (!button || !spectrum.contains(button)) return;
    cancelTween();
    selectedIndex = Math.max(0, Math.min(GAMMA.length - 1, Number(button.dataset.index) || 0));
    count = Math.max(count, selectedIndex + 1);
    sigma = sigmaValues[selectedIndex];
    updateControls();
  }, { signal });

  psiCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const rect = psiCanvas.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    draw();
  }, { signal });
  psiCanvas.addEventListener('pointerleave', () => {
    pointerX = null;
    draw();
  }, { signal });
  planeCanvas.addEventListener('pointerdown', (event) => {
    const rect = planeCanvas.getBoundingClientRect();
    const plot = { x: 36, y: 14, w: rect.width - 48, h: rect.height - 44 };
    const handleX = rect.left + plot.x + sigmaValues[selectedIndex] * plot.w;
    const handleY = rect.top + plot.y + (1 - GAMMA[selectedIndex] / 170) * plot.h;
    if (Math.hypot(event.clientX - handleX, event.clientY - handleY) > 11) return;
    criticalSnap = sigmaValues[selectedIndex] <= 0.52;
    const targetSigma = snapDraggedSigma((event.clientX - rect.left - plot.x) / plot.w);
    isDragging = true;
    cancelTween();
    planeCanvas.setPointerCapture(event.pointerId);
    sigma = targetSigma;
    if (allTogether) sigmaValues.fill(sigma, 0, count);
    else sigmaValues[selectedIndex] = sigma;
    updateControls();
  }, { signal });
  planeCanvas.addEventListener('pointermove', (event) => {
    if (!isDragging || !planeCanvas.hasPointerCapture(event.pointerId)) return;
    const rect = planeCanvas.getBoundingClientRect();
    const targetSigma = snapDraggedSigma((event.clientX - rect.left - 36) / (rect.width - 48));
    sigma = targetSigma;
    if (allTogether) sigmaValues.fill(sigma, 0, count);
    else sigmaValues[selectedIndex] = sigma;
    updateControls();
  }, { signal });
  planeCanvas.addEventListener('pointerup', () => { isDragging = false; }, { signal });
  planeCanvas.addEventListener('pointercancel', () => { isDragging = false; criticalSnap = false; }, { signal });

  const plateObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    isInView = entries.some((entry) => entry.isIntersecting);
    if (isInView) draw();
    else if (drawFrame) cancelAnimationFrame(drawFrame);
    if (!isInView) drawFrame = 0;
  }, { rootMargin: '120px 0px', threshold: 0 }) : null;
  if (plateObserver) plateObserver.observe(plate);
  else isInView = true;

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => draw()) : null;
  if (resizeObserver) {
    resizeObserver.observe(psiCanvas);
    resizeObserver.observe(planeCanvas);
  }
  window.addEventListener('resize', draw, { passive: true, signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && drawFrame) {
      cancelAnimationFrame(drawFrame);
      drawFrame = 0;
    } else if (isInView) draw();
  }, { signal });
  motionReduced.addEventListener?.('change', () => draw(), { signal });

  function refreshTheme() {
    currentEra = document.documentElement.dataset.era;
    colors = readTheme();
    draw();
  }

  document.addEventListener('w8:era', refreshTheme, { signal });
  document.addEventListener('w8:mode', draw, { signal });
  updateControls();

  return () => {
    destroyed = true;
    aborter.abort();
    stepObserver?.disconnect();
    plateObserver?.disconnect();
    resizeObserver?.disconnect();
    window.clearTimeout(statusTimer);
    cancelTween();
    if (drawFrame) cancelAnimationFrame(drawFrame);
  };
}
