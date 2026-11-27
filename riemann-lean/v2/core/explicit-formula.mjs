import { psi0 } from './counting.mjs';

export const PRIME_ZERO_HEIGHTS = Object.freeze([
  14.13472514173469379,21.02203963877155499,25.01085758014568876,30.42487612585951321,32.93506158773918969,37.58617815882567126,
  40.91871901214749519,43.32707328091499952,48.00515088116715973,49.77383247767230218,52.97032147771446064,56.4462476970633948,
  59.34704400260235308,60.83177852460980984,65.11254404808160666,67.07981052949417371,69.54640171117397925,72.06715767448190758,
  75.70469069908393317,77.14484006887480537,79.33737502024936792,82.91038085408603018,84.73549298051705011,87.42527461312522941,
  88.80911120763446542,92.4918992705584843,94.65134404051988697,95.87063422824530976,98.83119421819369223,101.3178510057313912,
  103.7255380404783394,105.4466230523260945,107.1686111842764075,111.0295355431696745,111.8746591769926371,114.3202209154527128,
  116.2266803208575544,118.7907828659762173,121.3701250024206459,122.9468292935525882,124.2568185543457672,127.5166838795964951,
  129.578704199956051,131.0876885309326567,133.4977372029975865,134.7565097533738713,138.1160420545334432,139.736208952121389,
  141.1237074040211238,143.1118458076206327,146.0009824867655185,147.422765342559602,150.0535204207848804,150.9252576122414668,
  153.0246938111988962,156.1129092942378676,157.5975918175940599,158.8499881714204987,161.1889641375960275,163.0307096871819872
]);

function validateN(N) {
  if (!Number.isInteger(N) || N < 0 || N > PRIME_ZERO_HEIGHTS.length) throw new RangeError('N must be an integer from 0 to 60');
}

export function explicitFormulaBase(x) {
  if (!Number.isFinite(x) || x <= 1 || x > 1000) throw new RangeError('explicit formula supports 1 < x ≤ 1000');
  return x - Math.log(2 * Math.PI) - 0.5 * Math.log1p(-(x ** -2));
}

export function waveContribution(x, index, beta = 0.5) {
  if (!Number.isFinite(x) || x <= 1 || x > 1000) throw new RangeError('wave supports 1 < x ≤ 1000');
  if (!Number.isInteger(index) || index < 0 || index >= PRIME_ZERO_HEIGHTS.length) throw new RangeError('index must select one of the 60 reference heights');
  if (!Number.isFinite(beta) || beta !== 0.5) throw new RangeError('the explicit-formula data mode fixes beta at 1/2');
  const gamma = PRIME_ZERO_HEIGHTS[index];
  const denominator = beta * beta + gamma * gamma;
  return -2 * Math.sqrt(x) * (beta * Math.cos(gamma * Math.log(x)) + gamma * Math.sin(gamma * Math.log(x))) / denominator;
}

export function explicitFormula(x, N = 15) {
  validateN(N);
  let sum = explicitFormulaBase(x);
  for (let index = 0; index < N; index++) sum += waveContribution(x, index);
  return sum;
}

export function explicitFormulaMetrics(N = 15, { start = 2, end = 100, step = 0.25 } = {}) {
  validateN(N);
  if (![start, end, step].every(Number.isFinite) || start < 2 || end < start || end > 1000 || step <= 0) {
    throw new RangeError('metric grid must satisfy 2 ≤ start ≤ end ≤ 1000 and step > 0');
  }
  const count = Math.floor((end - start) / step + 1e-10) + 1;
  let squared = 0, maxAbsolute = 0;
  const samples = [];
  for (let i = 0; i < count; i++) {
    const x = start + i * step;
    const approximation = explicitFormula(x, N);
    const target = psi0(x);
    const error = approximation - target;
    squared += error * error;
    maxAbsolute = Math.max(maxAbsolute, Math.abs(error));
    samples.push({ x, target, approximation, error });
  }
  return { rmse: Math.sqrt(squared / count), maxAbsolute, sampleCount: count, start, end: start + (count - 1) * step, step, convention: 'psi0; uniform x grid; exact jumps use midpoint value', samples };
}
