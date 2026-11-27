import { factorize, primePi, primesInRange } from '../core/primes.mjs';
import { li2 } from '../core/counting.mjs';

const MAX = 1_000_000;

function requireFinite(value, name) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

function requireInteger(value, min, max, name) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}].`);
  }
}

function requireReal(value, min, max, name) {
  requireFinite(value, name);
  if (value < min || value > max) throw new RangeError(`${name} must be in [${min}, ${max}].`);
}

function isPrime(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let p = 3; p * p <= n; p += 2) if (n % p === 0) return false;
  return true;
}

// 01-A — factor tree state is immutable. Splitting a leaf preserves the
// product invariant; `primePowers` is null until every leaf is prime.
export function createFactorTree(n = 3600) {
  requireInteger(n, 2, MAX, 'n');
  return { target: n, leaves: [{ path: 'r', value: n }], splits: [] };
}

export function splitFactorLeaf(tree, path, divisor) {
  if (!tree || !Array.isArray(tree.leaves) || !Array.isArray(tree.splits)) throw new TypeError('A factor tree state is required.');
  const index = tree.leaves.findIndex(leaf => leaf.path === path);
  if (index < 0) throw new RangeError('Choose an existing leaf.');
  const leaf = tree.leaves[index];
  if (!Number.isSafeInteger(divisor) || divisor <= 1 || divisor >= leaf.value || leaf.value % divisor !== 0) {
    throw new RangeError(`${divisor} is not a proper divisor of ${leaf.value}.`);
  }
  const right = leaf.value / divisor;
  const leaves = [...tree.leaves.slice(0, index),
    { path: `${path}L`, value: divisor }, { path: `${path}R`, value: right },
    ...tree.leaves.slice(index + 1)];
  const next = { target: tree.target, leaves, splits: [...tree.splits, { path, value: leaf.value, left: divisor, right }] };
  if (leaves.reduce((product, item) => product * item.value, 1) !== tree.target) throw new Error('Factor tree product invariant failed.');
  return next;
}

export function factorTreeSummary(tree) {
  const unfinished = tree.leaves.filter(({ value }) => !isPrime(value));
  if (unfinished.length) return { complete: false, unfinished: unfinished.map(leaf => ({ ...leaf })), primePowers: null };
  const counts = new Map();
  for (const { value } of tree.leaves) counts.set(value, (counts.get(value) ?? 0) + 1);
  return { complete: true, unfinished: [], primePowers: [...counts].sort(([a], [b]) => a - b).map(([prime, exponent]) => ({ prime, exponent })) };
}

export function factorTreeFromFactors(n) {
  return factorize(n);
}

// 01-B — a sieve stage means one p and all not-yet-marked multiples from p².
// The first p that removes a composite remains its recorded cause.
export function createSieveState(limit = 100) {
  requireInteger(limit, 30, 400, 'N');
  const composite = new Uint8Array(limit + 1);
  composite[0] = 1;
  composite[1] = 1;
  const primes = [];
  for (let n = 2; n <= limit; n += 1) if (isPrime(n)) primes.push(n);
  return { limit, composite, reasons: Array(limit + 1).fill(null), primes, primeIndex: 0, stages: [], complete: false };
}

export function sieveStep(state) {
  if (!state || !Number.isInteger(state.limit) || !(state.composite instanceof Uint8Array)) throw new TypeError('A sieve state is required.');
  if (state.complete) return state;
  let index = state.primeIndex;
  while (index < state.primes.length && state.primes[index] ** 2 > state.limit) index += 1;
  if (index >= state.primes.length) return { ...state, primeIndex: index, complete: true };
  const p = state.primes[index];
  const composite = state.composite.slice();
  const reasons = state.reasons.slice();
  const newlyMarked = [];
  for (let n = p * p; n <= state.limit; n += p) {
    if (!composite[n]) {
      composite[n] = 1;
      reasons[n] = p;
      newlyMarked.push(n);
    }
  }
  let nextIndex = index + 1;
  while (nextIndex < state.primes.length && state.primes[nextIndex] ** 2 > state.limit) nextIndex += 1;
  return { ...state, composite, reasons, primeIndex: index + 1, stages: [...state.stages, { prime: p, newlyMarked }], complete: nextIndex >= state.primes.length };
}

export function sieveBack(state) {
  if (!state || !Array.isArray(state.stages)) throw new TypeError('A sieve state is required.');
  if (!state.stages.length) return state;
  const stages = state.stages.slice(0, -1);
  const restored = createSieveState(state.limit);
  let next = restored;
  for (let i = 0; i < stages.length; i += 1) next = sieveStep(next);
  return next;
}

export function sieveReset(limit = 100) { return createSieveState(limit); }

export function sieveSummary(state) {
  const candidates = [];
  for (let n = 2; n <= state.limit; n += 1) if (!state.composite[n]) candidates.push(n);
  return { limit: state.limit, currentPrime: state.complete ? null : state.primes[state.primeIndex] ?? null,
    nextCandidate: state.complete ? null : (state.primes[state.primeIndex] ** 2 || null),
    primes: candidates, count: candidates.length, removedBy: state.reasons };
}

// 02-A — inclusive integer intervals; a gap is only counted when both
// consecutive endpoints lie inside the selected interval.
export function inspectPrimeRange(start, end) {
  requireInteger(start, 1, MAX, 'a');
  requireInteger(end, start, MAX, 'b');
  const length = end - start + 1;
  if (length > 2000) throw new RangeError('The interval may contain at most 2000 integers.');
  const primes = primesInRange(start, end);
  const gaps = primes.slice(1).map((prime, index) => prime - primes[index]);
  return { start, end, integerCount: length, primes, count: primes.length,
    first: primes[0] ?? null, last: primes.at(-1) ?? null,
    gaps, gapCount: gaps.length,
    meanGap: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    maxGap: gaps.length ? Math.max(...gaps) : null,
    density: primes.length / length };
}

// 02-B — Ulam spiral with y increasing upward. Values follow 1 at center,
// then right, up, left, down (counterclockwise).
export function ulamCoordinates(n) {
  requireInteger(n, 1, 201 ** 2, 'n');
  if (n === 1) return { x: 0, y: 0 };
  const r = Math.ceil((Math.sqrt(n) - 1) / 2);
  const maximum = (2 * r + 1) ** 2;
  if (n >= maximum - 2 * r) return { x: r - (maximum - n), y: -r };
  if (n >= maximum - 4 * r) return { x: -r, y: -r + (maximum - 2 * r - n) };
  if (n >= maximum - 6 * r) return { x: -r + (maximum - 4 * r - n), y: r };
  return { x: r, y: r - (maximum - 6 * r - n) };
}

export function ulamValueAt(x, y) {
  requireInteger(x, -100, 100, 'column');
  requireInteger(y, -100, 100, 'row');
  if (x === 0 && y === 0) return 1;
  const r = Math.max(Math.abs(x), Math.abs(y));
  let n;
  if (y === -r) n = (2 * r + 1) ** 2 - (r - x);
  else if (x === -r) n = (2 * r + 1) ** 2 - 2 * r - (y + r);
  else if (y === r) n = (2 * r + 1) ** 2 - 4 * r - (x + r);
  else n = (2 * r + 1) ** 2 - 6 * r - (r - y);
  return n;
}

export function buildUlamGrid(size = 51) {
  requireInteger(size, 11, 201, 'grid size');
  if (size % 2 !== 1) throw new RangeError('The Ulam grid size must be odd.');
  const radius = (size - 1) / 2;
  const cells = [];
  for (let y = radius; y >= -radius; y -= 1) {
    for (let x = -radius; x <= radius; x += 1) {
      const value = ulamValueAt(x, y);
      cells.push({ x, y, value, prime: isPrime(value) });
    }
  }
  return { size, radius, cells, primeCount: cells.reduce((n, cell) => n + Number(cell.prime), 0) };
}

export function inspectUlamDiagonal(size = 51, diagonal = 'main') {
  const grid = buildUlamGrid(size);
  if (!['main', 'anti'].includes(diagonal)) throw new RangeError('Choose the main or anti diagonal.');
  const cells = grid.cells.filter(({ x, y }) => diagonal === 'main' ? x === y : x === -y);
  return { ...grid, diagonal, cells, values: cells.map(cell => cell.value), primeCount: cells.filter(cell => cell.prime).length,
    density: cells.length ? cells.filter(cell => cell.prime).length / cells.length : 0 };
}

// 02-C — consecutive prime gaps with both primes inside [a,b].
export function inspectPrimeGaps(start = 2, end = 10_000) {
  requireInteger(start, 1, MAX, 'a');
  requireInteger(end, start, MAX, 'b');
  if (end - start + 1 < 2) throw new RangeError('The selected interval needs at least two integers.');
  const primes = primesInRange(start, end);
  const gaps = primes.slice(1).map((prime, i) => prime - primes[i]);
  const ordered = [...gaps].sort((a, b) => a - b);
  const histogram = Object.fromEntries([...new Set(ordered)].map(gap => [gap, ordered.filter(value => value === gap).length]));
  const middle = Math.floor(ordered.length / 2);
  const median = !ordered.length ? null : ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  return { start, end, primes, gaps, sampleCount: gaps.length,
    mean: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    median, max: gaps.length ? Math.max(...gaps) : null, histogram };
}

// 03-A — exact integer count plus the chapter's named approximations.
export function primeCountingAt(x) {
  requireReal(x, 2, MAX, 'x');
  const pi = primePi(x);
  const logarithmic = x / Math.log(x);
  const offsetLi = li2(x);
  return { x, pi, xOverLogX: logarithmic, li2: offsetLi,
    li: offsetLi + 1.0451637801174928 };
}

export function primeCountingCurve(xMax, { xMin = 2, width = 620, approximation = 'li2', samples = 240, axis = 'linear' } = {}) {
  requireReal(xMin, 2, MAX, 'x minimum');
  requireReal(xMax, xMin, MAX, 'x maximum');
  requireInteger(width, 100, 3000, 'plot width');
  requireInteger(samples, 10, 1000, 'sample count');
  if (!['xOverLogX', 'li2', 'li'].includes(approximation)) throw new RangeError('Choose a supported approximation.');
  if (!['linear', 'log'].includes(axis)) throw new RangeError('Choose a linear or logarithmic x axis.');
  const toAxis = value => axis === 'log' ? Math.log(value) : value;
  const fromAxis = value => axis === 'log' ? Math.exp(value) : value;
  const firstPrimeAfterStart = Math.floor(xMin) + 1;
  const primes = firstPrimeAfterStart <= Math.floor(xMax)
    ? primesInRange(firstPrimeAfterStart, Math.floor(xMax)) : [];
  const aMin = toAxis(xMin), aMax = toAxis(xMax);
  const binWidth = (aMax - aMin) / width || 1;
  const bins = new Map();
  for (const prime of primes) {
    const bin = Math.min(width - 1, Math.max(0, Math.floor((toAxis(prime) - aMin) / binWidth)));
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }
  const piPoints = [[xMin, primePi(xMin)]];
  let count = primePi(xMin);
  for (let bin = 0; bin < width; bin += 1) {
    const hi = fromAxis(Math.min(aMax, aMin + (bin + 1) * binWidth));
    const added = bins.get(bin) ?? 0;
    if (!added) continue;
    count += added;
    piPoints.push([hi, count]);
  }
  if (piPoints.at(-1)[0] < xMax) piPoints.push([xMax, count]);
  const approximationPoints = Array.from({ length: samples }, (_, i) => {
    const x = xMin * (xMax / xMin) ** (i / (samples - 1));
    const row = primeCountingAt(x);
    return [x, row[approximation]];
  });
  return { xMin, xMax, axis, binWidth, simplification: `prime jumps grouped into ${width} horizontal pixel bins`,
    piPoints, approximation, approximationPoints };
}

export function primeCountingError(x, approximation = 'xOverLogX') {
  const row = primeCountingAt(x);
  if (!['xOverLogX', 'li2', 'li'].includes(approximation)) throw new RangeError('Choose a supported approximation.');
  const estimate = row[approximation];
  const signedError = row.pi - estimate;
  return { ...row, approximation, estimate, signedError, absoluteError: Math.abs(signedError),
    signedRelativeError: row.pi === 0 ? null : signedError / row.pi,
    ratio: estimate === 0 ? null : row.pi / estimate };
}
