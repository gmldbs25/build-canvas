import { primesInRange } from '../core/primes.mjs';
import { PRIME_ZERO_HEIGHTS } from '../core/explicit-formula.mjs';

export function leastCommonMultiple(m) {
  if (!Number.isInteger(m) || m < 1 || m > 50) throw new RangeError('m은 1부터 50까지의 정수입니다.');
  let exact = 1n;
  let logarithm = 0;
  const factors = primesInRange(1, m).map(prime => {
    let power = prime, exponent = 1;
    while (power * prime <= m) {
      power *= prime;
      exponent += 1;
    }
    exact *= BigInt(power);
    logarithm += exponent * Math.log(prime);
    return { prime, exponent, power };
  });
  return { factors, exact, logarithm };
}

export function logarithmicDerivative(s, kMax, primes) {
  if (!Number.isFinite(s) || s < 1.1 || s > 4 || !Number.isInteger(kMax) || kMax < 1 || kMax > 6) {
    throw new RangeError('s는 1.1–4, k의 최댓값은 1–6을 사용하세요.');
  }
  const terms = [];
  let finiteSum = 0;
  let factorsSum = 0;
  for (const prime of primes) {
    const ln = Math.log(prime);
    const denominator = Math.expm1(ln * s);
    factorsSum += ln / denominator;
    for (let k = 1; k <= kMax; k += 1) {
      const z = Math.exp(-ln * k * s);
      const derivative = ln * z;
      finiteSum += derivative;
      terms.push({ prime, k, term: z / k, derivative });
    }
  }
  return { terms, finiteSum, factorsSum };
}

export function modelWave(log10X, beta, index = 0) {
  if (!Number.isFinite(log10X) || log10X < 2 || log10X > 16 ||
      !Number.isFinite(beta) || beta < .5 || beta > .95 ||
      !Number.isInteger(index) || index < 0 || index >= PRIME_ZERO_HEIGHTS.length) {
    throw new RangeError('log₁₀ x는 2–16, β는 0.5–0.95, 높이는 참조 목록에서 선택합니다.');
  }
  const gamma = PRIME_ZERO_HEIGHTS[index];
  const u = log10X * Math.LN10;
  const amplitudeAt = sigma => 2 * Math.exp(sigma * u) / Math.hypot(sigma, gamma);
  const contribution = sigma => -amplitudeAt(sigma) * Math.cos(gamma * u - Math.atan2(gamma, sigma));
  const actual = amplitudeAt(.5);
  const amplitude = amplitudeAt(beta);
  const paired = contribution(beta);
  const reflection = beta === .5 ? 0 : contribution(1 - beta);
  return {
    gamma, amplitude, actual, ratio: amplitude / actual,
    normalized: amplitude / (Math.exp(.5 * u) * u ** 2),
    paired, reflection, combined: paired + reflection,
  };
}
