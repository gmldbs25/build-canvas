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
const PLANE_TOP = 170;
const SPECTRUM_TICKS = [0, 7, 15, 23, 31, 39, 47, 55, 59];
const CHART_FONT = '10px "JetBrains Mono", "Pretendard Variable", monospace';

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

function sampleZeroAt(index, k, sigma, grid) {
  const gamma = GAMMA[k];
  const sigmaIndex = Math.max(0, Math.min(SIGMA_STEPS - 1, Math.round((sigma - SIGMA_MIN) / SIGMA_STEP)));
  const offset = index * GAMMA.length + k;
  const power = grid.powers[index * SIGMA_STEPS + sigmaIndex];
  return 2 * power * (sigma * grid.cosines[offset] + gamma * grid.sines[offset]) / (sigma * sigma + gamma * gamma);
}

function sampleApproxAt(index, sigmas, grid = GRID) {
  const x = grid.xs[index];
  const logX = grid.lnXs[index];
  let sum = 0;
  for (let k = 0; k < sigmas.length; k += 1) {
    sum += sampleZeroAt(index, k, sigmas[k], grid);
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
  const planeCoordinate = query('#planeCoordinate');
  const waveKey = query('#waveKey');
  const spectrumDetail = query('#spectrumDetail');
  const labStatus = query('#labStatus');
  planeCanvas.style.touchAction = 'pan-y';
  const spectrumTicks = SPECTRUM_TICKS.map((index) => {
    const tick = document.createElement('span');
    tick.className = 'spectrum__tick';
    tick.style.gridColumn = String(index + 1);
    tick.style.gridRow = '1';
    tick.dataset.gammaTick = String(Math.round(GAMMA[index]));
    tick.setAttribute('aria-hidden', 'true');
    return tick;
  });
  spectrum?.append(...spectrumTicks);
  const spectrumButtons = [];
  const spectrumContributions = [];
  let previewIndex = null;
  let planePointer = null;
  let rangePointer = null;

  let count = Math.max(1, Math.min(GAMMA.length, Number(nRange.value) || 15));
  const sigmaValues = new Float64Array(GAMMA.length);
  sigmaValues.fill(Number(sigmaRange.value) || 0.5);
  let sigma = sigmaValues[0];
  let allTogether = Boolean(query('#allTogether')?.checked);
  let selectedIndex = 0;
  let activeTab = 'wave';
  let currentEra = document.documentElement.dataset.era || 'paper';
  let isInView = false;
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
      accent: value('--c-accent-2', terminal ? '#7fd8ff' : '#1b3b6f'),
      margin: value('--c-bad', terminal ? '#ff7a7a' : '#962830'),
      highlight: value('--c-warn', terminal ? '#f9ba78' : '#a05a12'),
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
    const plot = { x: 32, y: 13, w: width - 59, h: Math.round((height - 65) * 0.65) };
    const residual = { x: plot.x, y: plot.y + plot.h + 31, w: plot.w, h: height - plot.h - 65 };
    const xPos = (x) => plot.x + (x - LENS.xMin) / (LENS.xMax - LENS.xMin) * plot.w;
    const yPos = (y) => plot.y + plot.h - y / LENS.yMax * plot.h;
    const residualY = (value) => residual.y + residual.h - (value + LENS.residual) / (2 * LENS.residual) * residual.h;
    const sigmas = sigmasForCount(count, sigmaValues);
    const preview = previewIndex !== null && previewIndex < count ? previewIndex : selectedIndex;
    const escaped = sigmas.some(value => value > SIGMA_MIN);
    const values = waveValues;
    const errors = waveResiduals;
    for (let i = 0; i < GRID_SIZE; i += 1) {
      values[i] = sampleApproxAt(i, sigmas);
      errors[i] = values[i] - GRID.xs[i];
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, width, height);
    ctx.font = CHART_FONT;
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
    ctx.textAlign = 'center';
    for (const x of [2, 20, 40, 60, 80, 100]) {
      const px = xPos(x);
      ctx.beginPath();
      ctx.moveTo(px, plot.y);
      ctx.lineTo(px, plot.y + plot.h);
      ctx.stroke();
      ctx.fillText(String(x), px, height - 5);
    }

    ctx.textAlign = 'left';
    ctx.fillText('x', width - 10, height - 5);

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

    if (escaped) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < GRID_SIZE; i += 1) {
        const py = yPos(Math.max(0, Math.min(LENS.yMax, values[i])));
        ctx.lineTo(xPos(GRID.xs[i]), py);
      }
      for (let i = GRID_SIZE - 1; i >= 0; i -= 1) ctx.lineTo(xPos(GRID.xs[i]), yPos(GRID.truths[i]));
      ctx.closePath();
      ctx.globalAlpha = 0.19;
      ctx.fillStyle = colors.margin;
      ctx.fill();
      ctx.restore();
    }

    // Selected truncated explicit formula.
    ctx.strokeStyle = escaped ? colors.margin : colors.accent;
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
    for (const level of [-LENS.residual, 0, LENS.residual]) {
      const py = residualY(level);
      ctx.beginPath();
      ctx.moveTo(residual.x, py);
      ctx.lineTo(residual.x + residual.w, py);
      ctx.strokeStyle = level === 0 ? colors.muted : colors.rule;
      ctx.stroke();
      ctx.fillStyle = colors.muted;
      ctx.fillText(String(level), 4, py + 3);
    }
    ctx.fillStyle = colors.muted;
    ctx.fillText('ψ(x) − x', residual.x, residual.y - 10);
    ctx.save();
    ctx.beginPath();
    ctx.rect(residual.x, residual.y, residual.w, residual.h);
    ctx.clip();
    if (escaped) {
      const shade = ctx.createLinearGradient(residual.x, 0, residual.x + residual.w, 0);
      shade.addColorStop(0, 'transparent');
      shade.addColorStop(1, colors.margin);
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(xPos(LENS.xMin), residualY(0));
      for (let i = 0; i < GRID_SIZE; i += 1) ctx.lineTo(xPos(GRID.xs[i]), residualY(errors[i]));
      ctx.lineTo(xPos(LENS.xMax), residualY(0));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
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
    ctx.strokeStyle = escaped ? colors.margin : colors.accent;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    for (let i = 0; i < GRID_SIZE; i += 1) {
      const x = xPos(GRID.xs[i]);
      const y = residualY(Math.max(-LENS.residual, Math.min(LENS.residual, errors[i])));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = previewIndex === null ? 1.2 : 1.8;
    ctx.globalAlpha = previewIndex === null ? 0.75 : 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i < GRID_SIZE; i += 1) {
      ctx.lineTo(xPos(GRID.xs[i]), residualY(-sampleZeroAt(i, preview, sigmas[preview], GRID)));
    }
    ctx.stroke();
    ctx.restore();

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
      const label = `x ${fmt(x, 1)} · ψ ${fmt(exact, 2)} · 근사 ${fmt(approx, 2)}`;
      ctx.fillStyle = colors.paper;
      ctx.fillRect(plot.x + 3, plot.y + 3, ctx.measureText(label).width + 9, 17);
      ctx.fillStyle = colors.ink;
      ctx.fillText(label, plot.x + 7, plot.y + 15);
    }
  }

  function planePlot(width, height) {
    return { x: 31, y: 25, w: width - 48, h: height - 51 };
  }

  function planePoint(plot, index) {
    return [plot.x + sigmaValues[index] * plot.w, plot.y + (1 - GAMMA[index] / PLANE_TOP) * plot.h];
  }

  function drawPlane() {
    if (destroyed || document.hidden || !isInView || !planeCanvas.getClientRects().length) return;
    const { width, height } = resizeCanvas(planeCanvas, planeCtx);
    if (width < 70 || height < 70) return;
    const plot = planePlot(width, height);
    const px = (re) => plot.x + re * plot.w;
    const py = (im) => plot.y + plot.h - im / PLANE_TOP * plot.h;
    planeCtx.fillStyle = colors.paper;
    planeCtx.fillRect(0, 0, width, height);
    planeCtx.save();
    planeCtx.globalAlpha = 0.045;
    planeCtx.fillStyle = colors.accent;
    planeCtx.fillRect(plot.x, plot.y, plot.w, plot.h);
    planeCtx.restore();
    planeCtx.font = CHART_FONT;
    planeCtx.lineWidth = 1;
    planeCtx.strokeStyle = colors.rule;
    planeCtx.fillStyle = colors.muted;
    planeCtx.fillText('Im(ρ)', 6, 15);
    planeCtx.textAlign = 'center';
    for (const [re, label] of [[0, '0'], [0.5, '½'], [1, '1']]) {
      planeCtx.beginPath();
      planeCtx.moveTo(px(re), plot.y);
      planeCtx.lineTo(px(re), plot.y + plot.h);
      planeCtx.stroke();
      planeCtx.fillText(label, px(re), plot.y + plot.h + 15);
    }
    planeCtx.textAlign = 'right';
    for (const im of [0, 40, 80, 120, 160]) {
      planeCtx.beginPath();
      planeCtx.moveTo(plot.x, py(im));
      planeCtx.lineTo(plot.x + plot.w, py(im));
      planeCtx.stroke();
      planeCtx.fillText(String(im), plot.x - 5, py(im) + 3);
    }
    planeCtx.fillText('Re(ρ)', width - 6, plot.y + plot.h + 24);
    planeCtx.save();
    planeCtx.setLineDash([3, 4]);
    planeCtx.strokeStyle = colors.accent;
    planeCtx.globalAlpha = 0.6;
    planeCtx.beginPath();
    planeCtx.moveTo(px(0.5), plot.y);
    planeCtx.lineTo(px(0.5), plot.y + plot.h);
    planeCtx.stroke();
    planeCtx.restore();

    for (let i = 0; i < GAMMA.length; i += 1) {
      const active = i < count;
      const [x, y] = planePoint(plot, i);
      const distanceBefore = GAMMA[i] - (GAMMA[i - 1] ?? 0);
      const distanceAfter = (GAMMA[i + 1] ?? PLANE_TOP) - GAMMA[i];
      const spacing = Math.min(distanceBefore, distanceAfter) / PLANE_TOP * plot.h;
      const radius = active ? Math.max(0.85, Math.min(2.6, spacing * 0.43)) : 0.8;
      planeCtx.beginPath();
      planeCtx.arc(x, y, radius, 0, Math.PI * 2);
      planeCtx.fillStyle = active ? (sigmaValues[i] > SIGMA_MIN ? colors.margin : colors.accent) : colors.muted;
      planeCtx.globalAlpha = active ? 1 : 0.26;
      planeCtx.fill();
    }
    planeCtx.globalAlpha = 1;
    planeCtx.textAlign = 'left';
    const target = previewIndex !== null && previewIndex < count ? previewIndex : selectedIndex;
    const [targetX, targetY] = planePoint(plot, target);
    const targetColor = sigmaValues[target] > SIGMA_MIN ? colors.margin : colors.accent;
    planeCtx.save();
    planeCtx.fillStyle = targetColor;
    planeCtx.globalAlpha = 0.14;
    planeCtx.beginPath();
    planeCtx.arc(targetX, targetY, planePointer === null ? 10 : 13, 0, Math.PI * 2);
    planeCtx.fill();
    planeCtx.restore();
    planeCtx.strokeStyle = targetColor;
    planeCtx.lineWidth = 1;
    planeCtx.beginPath();
    planeCtx.arc(targetX, targetY, 7, 0, Math.PI * 2);
    planeCtx.stroke();
    planeCtx.fillStyle = targetColor;
    planeCtx.beginPath();
    planeCtx.arc(targetX, targetY, 3.2, 0, Math.PI * 2);
    planeCtx.fill();

    // Stagger the first markers around the line; the target always gets its own label.
    for (const i of [0, 1, 2]) {
      if (i >= count || i === target) continue;
      labelPoint(i, i === 1);
    }
    labelPoint(target, target === 1);

    function labelPoint(index, left) {
      const [x, y] = planePoint(plot, index);
      const label = `γ${index + 1}`;
      const textWidth = planeCtx.measureText(label).width;
      const placeLeft = left || x + 11 + textWidth > width - 3;
      const labelX = placeLeft ? x - 11 - textWidth : x + 11;
      const labelY = y + (index === 0 ? 6 : -1);
      planeCtx.fillStyle = colors.paper;
      planeCtx.fillRect(labelX - 1, labelY - 10, textWidth + 2, 13);
      planeCtx.fillStyle = index === target ? targetColor : colors.muted;
      planeCtx.fillText(label, labelX, labelY);
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

  function updatePreview() {
    const index = previewIndex !== null && previewIndex < count ? previewIndex : selectedIndex;
    const gamma = GAMMA[index];
    const value = sigmaValues[index];
    const coordinate = `ρ = ${fmt(value, 3)} + ${fmt(gamma, 2)}i`;
    setText(planeCoordinate, coordinate);
    if (planeCoordinate) planeCoordinate.dataset.regime = value > SIGMA_MIN ? 'escaped' : 'critical';
    setText(waveKey, `γ${index + 1}의 파동`);
    const contribution = spectrumContributions[index];
    if (Number.isFinite(contribution)) {
      const phase = Math.atan2(gamma, value) * 180 / Math.PI;
      setText(spectrumDetail, `γ${index + 1} = ${fmt(gamma, 6)} · φ ${fmt(phase, 1)}° · 항 ${contribution >= 0 ? '+' : ''}${fmt(contribution, 2)}`);
    }
    draw();
  }

  function updateSpectrum() {
    if (!spectrum) return;
    const slots = Math.min(60, Math.max(16, Math.ceil(count / 8) * 8));
    spectrum.style.setProperty('--spectrum-slots', slots);
    for (const tick of spectrumTicks) {
      tick.toggleAttribute('data-mobile-hidden', Number(tick.style.gridColumn) > slots);
    }
    while (spectrumButtons.length > count) spectrumButtons.pop().remove();
    while (spectrumButtons.length < count) {
      const index = spectrumButtons.length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spectrum__bar';
      button.dataset.index = String(index);
      button.dataset.gamma = String(GAMMA[index]);
      button.style.gridColumn = String(index + 1);
      button.style.gridRow = '1';
      const bar = document.createElement('i');
      bar.setAttribute('aria-hidden', 'true');
      button.append(bar);
      spectrum.append(button);
      spectrumButtons.push(button);
    }
    let maxAbs = 0;
    for (let i = 0; i < count; i += 1) {
      const gamma = GAMMA[i];
      const termSigma = sigmaValues[i];
      const value = 2 * (100 ** termSigma) * (termSigma * X100_COS[i] + gamma * X100_SIN[i]) / (termSigma * termSigma + gamma * gamma);
      spectrumContributions[i] = value;
      maxAbs = Math.max(maxAbs, Math.abs(value));
    }
    const scale = maxAbs || 1;
    for (let i = 0; i < count; i += 1) {
      const button = spectrumButtons[i];
      const gamma = GAMMA[i];
      const contribution = spectrumContributions[i];
      const phaseDegrees = Math.atan2(gamma, sigmaValues[i]) * 180 / Math.PI;
      const negative = contribution < 0;
      const escaped = sigmaValues[i] > SIGMA_MIN;
      button.dataset.sign = negative ? 'negative' : 'positive';
      button.toggleAttribute('data-selected', i === selectedIndex);
      button.setAttribute('aria-pressed', String(i === selectedIndex));
      button.setAttribute('aria-label', `영점 ${i + 1}, 감마 ${gamma.toFixed(6)}, 위상 ${fmt(phaseDegrees, 1)}도, 부호 있는 기여 ${fmt(contribution, 4)}${escaped ? ', 임계선 이탈' : ''}`);
      const bar = button.firstElementChild;
      bar.style.setProperty('--height', `${Math.max(2, Math.abs(contribution) / scale * 25)}px`);
      bar.style.setProperty('--bar-color', escaped ? 'var(--c-bad)' : negative ? 'var(--c-muted)' : 'var(--c-accent-2)');
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
      badge.dataset.regime = sigma === SIGMA_MIN ? 'critical' : 'escaped';
      badge.textContent = `N ${activeCount} · γ${selectedIndex + 1} σ ${sigma.toFixed(2)}`;
    }
    updateSpectrum();
    updatePreview();
    queueStatus(stats, escapedCount, summary);
  }

  function queueStatus(stats, escapedCount, summary) {
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      const state = escapedCount ? `△ 이탈 · 영점 ${escapedCount}개가 임계선 밖` : '✓ 조율됨 · 모든 영점이 임계선 위';
      const endpoint = count === 1 ? ' · 영점 1개 · 가장 낮은 음만' : count === GAMMA.length ? ' · 영점 60개 · 화면의 근사 한계' : '';
      const error = stats.rms < 1 ? '계단과의 평균 오차 1.0 미만' : '계단과의 평균 오차 1.0 이상';
      if (labStatus) labStatus.dataset.regime = escapedCount ? 'escaped' : 'critical';
      setText(labStatus, `${state}${endpoint} · ${error}`);
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
      plate.dataset.sigmaState = sigmaValues.subarray(0, count).some(value => value > SIGMA_MIN) ? 'escaped' : 'critical';
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
    else updatePreview();
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

  let activeStep;
  let appliedStepNumber;

  function applyStep(step) {
    if (!step || rangePointer !== null || planePointer !== null) return;
    const stepNumber = step.dataset.step;
    // Continuations share a preset and preserve adjustments made by the reader.
    if (appliedStepNumber === stepNumber) return;
    const targetCount = Number(step.dataset.n);
    const targetSigma = Number(step.dataset.sigma);
    if (!Number.isFinite(targetCount) || !Number.isFinite(targetSigma)) return;
    const sigmaMode = step.dataset.onlyZero === '0' || step.dataset.firstOnly === 'true' || stepNumber === '4' ? 'first' : 'all';
    appliedStepNumber = stepNumber;
    animateTo(targetCount, targetSigma, sigmaMode);
  }

  const stepObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      activeStep = entry.target;
      for (const step of steps) step.classList.toggle('is-active', step === activeStep);
      if (plate) plate.dataset.highlight = activeStep.dataset.step;
      applyStep(activeStep);
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

  for (const range of [nRange, sigmaRange]) {
    range.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      rangePointer = event.pointerId;
      cancelTween();
    }, { signal });
  }
  function finishRangeDrag(event) {
    if (event.pointerId !== rangePointer) return;
    rangePointer = null;
    applyStep(activeStep);
  }
  window.addEventListener('pointerup', finishRangeDrag, { signal });
  window.addEventListener('pointercancel', finishRangeDrag, { signal });
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
  function previewBar(target) {
    const bar = target instanceof Element ? target.closest('.spectrum__bar') : null;
    previewIndex = bar && spectrum.contains(bar) ? Number(bar.dataset.index) : null;
    updatePreview();
  }

  spectrum?.addEventListener('pointerover', (event) => previewBar(event.target), { signal });
  spectrum?.addEventListener('pointerleave', () => previewBar(document.activeElement), { signal });
  spectrum?.addEventListener('focusin', (event) => previewBar(event.target), { signal });
  spectrum?.addEventListener('focusout', (event) => previewBar(event.relatedTarget), { signal });
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
  function movePlanePoint(event) {
    const rect = planeCanvas.getBoundingClientRect();
    const plot = planePlot(rect.width, rect.height);
    sigma = snapDraggedSigma((event.clientX - rect.left - plot.x) / plot.w);
    if (allTogether) sigmaValues.fill(sigma, 0, count);
    else sigmaValues[selectedIndex] = sigma;
    updateControls();
  }

  planeCanvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = planeCanvas.getBoundingClientRect();
    const plot = planePlot(rect.width, rect.height);
    let nearest = -1;
    let distance = event.pointerType === 'touch' ? 18 : 10;
    for (let i = 0; i < count; i += 1) {
      const [x, y] = planePoint(plot, i);
      const next = Math.hypot(event.clientX - rect.left - x, event.clientY - rect.top - y);
      if (next >= distance) continue;
      nearest = i;
      distance = next;
    }
    if (nearest < 0) return;
    cancelTween();
    selectedIndex = nearest;
    previewIndex = null;
    criticalSnap = sigmaValues[selectedIndex] <= 0.52;
    planePointer = event.pointerId;
    planeCanvas.setPointerCapture(event.pointerId);
    planeCanvas.setAttribute('data-dragging', '');
    updateControls();
  }, { signal });
  planeCanvas.addEventListener('pointermove', (event) => {
    if (planePointer === event.pointerId) movePlanePoint(event);
  }, { signal });
  planeCanvas.addEventListener('lostpointercapture', () => {
    planePointer = null;
    criticalSnap = false;
    planeCanvas.removeAttribute('data-dragging');
    applyStep(activeStep);
    draw();
  }, { signal });

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
  document.fonts?.ready.then(draw);
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
