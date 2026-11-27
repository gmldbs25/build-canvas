import { zetaCandidate } from '../core/zeta.mjs';
import { factorize, primesInRange } from '../core/primes.mjs';

function inRange(value, min, max, name) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be a finite value in [${min}, ${max}].`);
  return value;
}

export function complex(re = 0, im = 0) {
  inRange(re, -Number.MAX_VALUE, Number.MAX_VALUE, 'real part');
  inRange(im, -Number.MAX_VALUE, Number.MAX_VALUE, 'imaginary part');
  return { re, im };
}

export function addComplex(a, b) {
  return complex(a.re + b.re, a.im + b.im);
}

export function multiplyComplex(a, b) {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

export function conjugateComplex(z) { return complex(z.re, -z.im); }

export function complexMagnitude(z) { return Math.hypot(z.re, z.im); }

export function complexArgument(z) {
  if (z.re === 0 && z.im === 0) return null;
  return Math.atan2(z.im, z.re);
}

export function complexSummary(z) {
  const argument = complexArgument(z);
  return { ...z, magnitude: complexMagnitude(z), argumentRadians: argument,
    argumentDegrees: argument === null ? null : argument * 180 / Math.PI };
}

// 04-A — inputs have a teaching-window bound; the result may extend past it.
export function complexPlayground(a, b, operation = 'multiply') {
  for (const [name, z] of [['a', a], ['b', b]]) {
    inRange(z.re, -3, 3, `${name}.real`);
    inRange(z.im, -3, 3, `${name}.imaginary`);
  }
  let result;
  if (operation === 'add') result = addComplex(a, b);
  else if (operation === 'multiply') result = multiplyComplex(a, b);
  else if (operation === 'conjugate-a') result = conjugateComplex(a);
  else if (operation === 'conjugate-b') result = conjugateComplex(b);
  else throw new RangeError('Choose addition, multiplication, or a conjugate.');
  return { a: { ...a }, b: { ...b }, operation, result: complexSummary(result),
    axis: { xMin: Math.min(-3, result.re), xMax: Math.max(3, result.re), yMin: Math.min(-3, result.im), yMax: Math.max(3, result.im) } };
}

// 04-B — θ is the mathematical phase, ω is in radians per unit. The animated
// clock speed is deliberately not part of the returned math state.
export function eulerWaveState(theta, omega = 1, unit = 'rad') {
  inRange(omega, .5, 4, 'ω');
  let phase;
  if (unit === 'rad') phase = inRange(theta, 0, 2 * Math.PI, 'θ');
  else if (unit === 'deg') phase = inRange(theta, 0, 360, 'θ') * Math.PI / 180;
  else throw new RangeError('Choose radians or degrees.');
  const time = phase / omega;
  return { phase, phaseDegrees: phase * 180 / Math.PI, omega, time,
    point: { re: Math.cos(phase), im: Math.sin(phase) },
    waveValue: Math.sin(omega * time), cosineValue: Math.cos(omega * time),
    samples: Array.from({ length: 81 }, (_, i) => {
      const t = 2 * Math.PI * i / (80 * omega);
      return { time: t, phase: omega * t, cosine: Math.cos(omega * t), sine: Math.sin(omega * t), current: Math.abs(omega * t - phase) < 1e-10 };
    }) };
}

export function riemannLogWave(x, sigma = .5, gamma = 10) {
  inRange(x, .01, 1e6, 'x');
  if (!Number.isFinite(sigma) || sigma < -2 || sigma > 2) throw new RangeError('σ must be in [−2, 2].');
  inRange(gamma, .5, 80, 'γ');
  const u = Math.log(x);
  const magnitude = Math.exp(sigma * u);
  const phase = gamma * u;
  return { x, u, sigma, gamma, magnitude, phase,
    point: { re: magnitude * Math.cos(phase), im: magnitude * Math.sin(phase) } };
}

// 05-A — raw Dirichlet partial sums. Tail integral bounds are shown only for
// s>1; analytic continuation is a separate experiment/chapter.
export function dirichletPartialSums(s = 2, terms = 10) {
  inRange(s, .25, 4, 's');
  if (!Number.isInteger(terms) || terms < 10 || terms > 10_000) throw new RangeError('N must be an integer in [10, 10000].');
  const partial = [];
  const termValues = [];
  let sum = 0;
  for (let n = 1; n <= terms; n += 1) {
    const value = n ** -s;
    termValues.push(value);
    sum += value;
    partial.push(sum);
  }
  const converges = s > 1;
  const tailBounds = converges ? {
    lower: (terms + 1) ** (1 - s) / (s - 1),
    upper: terms ** (1 - s) / (s - 1),
  } : null;
  const reference = zetaReferenceForReal(s);
  return { s, terms, termValues, partial, sum, converges,
    convergence: converges ? 'convergent' : 'divergent', tailBounds,
    zetaReference: reference.value, referenceStatus: reference.status, referenceAlgorithm: reference.algorithm };
}

function zetaEulerMaclaurinReal(s) {
  const N = 16_384;
  let sum = 0;
  for (let n = 1; n < N; n += 1) sum += n ** -s;
  let value = sum + N ** (1 - s) / (s - 1) + .5 * N ** -s;
  const rising = [
    [1/12, 1], [-1/720, 3], [1/30240, 5], [-1/1209600, 7],
    [1/47900160, 9], [-691/1307674368000, 11],
  ];
  for (const [coefficient, order] of rising) {
    let product = 1;
    for (let k = 0; k < order; k += 1) product *= s + k;
    value += coefficient * product * N ** (-s - order);
  }
  return value;
}

function zetaReferenceForReal(s) {
  if (s <= 1) return { value: null, status: 'not-convergent-series-domain', algorithm: null };
  if (s <= 3) {
    const result = zetaCandidate(s, 0);
    return result.status === 'numeric'
      ? { value: result.re, status: 'numeric', algorithm: result.algorithm }
      : { value: null, status: result.status, algorithm: result.algorithm ?? null };
  }
  return { value: zetaEulerMaclaurinReal(s), status: 'numeric-bounded-positive', algorithm: 'real Euler–Maclaurin, 16384 terms + 6 Bernoulli corrections' };
}

// 05-B — finite Euler product and its deliberately different finite n table.
export function eulerProductBuilder(s = 2, primeCount = 2, maxN = 60) {
  inRange(s, 1.1, 4, 's');
  if (!Number.isInteger(primeCount) || primeCount < 0 || primeCount > 20) throw new RangeError('Choose 0–20 primes.');
  if (!Number.isInteger(maxN) || maxN < 1 || maxN > 120) throw new RangeError('The natural-number table ends between 1 and 120.');
  const selectedPrimes = primeCount ? primesInRange(2, 100).slice(0, primeCount) : [];
  const primeSet = new Set(selectedPrimes);
  let logProduct = 0;
  for (const p of selectedPrimes) logProduct -= Math.log1p(-Math.exp(-s * Math.log(p)));
  const rows = [];
  for (let n = 1; n <= maxN; n += 1) {
    const factors = n === 1 ? [] : factorize(n).map(({ prime, exponent }) => [prime, exponent]);
    const included = factors.every(([p]) => primeSet.has(p));
    if (included) rows.push({ n, factors, value: n ** -s });
  }
  const reference = zetaReferenceForReal(s);
  return { s, primeCount, selectedPrimes, maxN, product: Math.exp(logProduct), logProduct,
    rows, finiteNaturalSum: rows.reduce((sum, row) => sum + row.value, 0),
    zetaReference: reference.value, referenceStatus: reference.status, referenceAlgorithm: reference.algorithm,
    explanation: 'Finite prime product includes all powers of selected primes; the table stops at maxN.' };
}

// 06-A — N is an exact count of terms k=0,…,N−1. At z=1, the finite sum
// remains N while the rational continuation is a pole.
export function geometricComplexSeries(z, terms = 10) {
  inRange(z.re, -2, 2, 'Re(z)');
  inRange(z.im, -2, 2, 'Im(z)');
  if (!Number.isInteger(terms) || terms < 1 || terms > 50) throw new RangeError('N must be an integer in [1, 50].');
  const points = [];
  let re = 1, im = 0, sumRe = 0, sumIm = 0;
  for (let k = 0; k < terms; k += 1) {
    sumRe += re;
    sumIm += im;
    points.push({ k: k + 1, re: sumRe, im: sumIm });
    [re, im] = [re * z.re - im * z.im, re * z.im + im * z.re];
  }
  const pole = z.re === 1 && z.im === 0;
  const denominator = (1 - z.re) ** 2 + z.im ** 2;
  const value = pole ? null : { re: (1 - z.re) / denominator, im: z.im === 0 ? 0 : z.im / denominator };
  const magnitude = Math.hypot(z.re, z.im);
  return { z: { ...z }, terms, partialSum: { re: sumRe, im: sumIm === 0 ? 0 : sumIm }, points, value,
    pole, convergence: magnitude < 1 ? 'converges' : magnitude === 1 ? 'boundary; inspect partial sums' : 'diverges', magnitude };
}

// 06-B — ζ(s) is the bounded Euler–Maclaurin candidate; the plotted raw
// series is a separate quantity and is never labeled as ζ for s≤1.
export function zetaContinuationState(s = .5, terms = 100) {
  inRange(s, -2, 3, 's');
  if (!Number.isInteger(terms) || terms < 10 || terms > 10_000) throw new RangeError('N must be an integer in [10, 10000].');
  let rawSum = 0;
  for (let n = 1; n <= terms; n += 1) rawSum += n ** -s;
  const evaluation = zetaCandidate(s, 0);
  return { s, terms, rawSum, rawConverges: s > 1, zeta: evaluation.status === 'numeric' ? evaluation.re : null,
    status: evaluation.status, algorithm: evaluation.algorithm ?? null,
    interpretation: s > 1 ? 'raw series converges to ζ(s)' : 'raw partial sum is not the analytically continued ζ(s)' };
}
