import assert from 'node:assert/strict';
import test from 'node:test';
import { leastCommonMultiple, logarithmicDerivative, modelWave } from '../labs/counting-models.mjs';
import { reflectedZeros, zetaColor } from '../labs/zeta-models.mjs';
import { PRIME_ZERO_HEIGHTS } from '../core/explicit-formula.mjs';
import { zetaCandidate } from '../core/zeta.mjs';
import { vonMangoldt } from '../core/counting.mjs';

const near = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} differs from ${expected}`);

test('von Mangoldt selects exactly the prime powers', () => {
  assert.equal(vonMangoldt(1), 0);
  assert.equal(vonMangoldt(12), 0);
  near(vonMangoldt(27), Math.log(3));
  near(vonMangoldt(1009), Math.log(1009));
  assert.throws(() => vonMangoldt(4.5), RangeError);
});

test('LCM changes precisely at a prime power, with exact large values', () => {
  assert.equal(leastCommonMultiple(1).exact, 1n);
  assert.equal(leastCommonMultiple(5).exact, 60n);
  assert.equal(leastCommonMultiple(6).exact, 60n);
  assert.equal(leastCommonMultiple(10).exact, 2520n);
  assert.equal(leastCommonMultiple(50).exact, 3099044504245996706400n);
  near(leastCommonMultiple(8).logarithm - leastCommonMultiple(7).logarithm, Math.log(2));
  near(leastCommonMultiple(9).logarithm - leastCommonMultiple(8).logarithm, Math.log(3));
  assert.throws(() => leastCommonMultiple(51), RangeError);
  assert.throws(() => leastCommonMultiple(3.5), RangeError);
});

test('finite logarithmic derivative approaches the selected factors, with the proper sign', () => {
  const k3 = logarithmicDerivative(2, 3, [2, 3, 5]);
  const k6 = logarithmicDerivative(2, 6, [2, 3, 5]);
  near(k3.terms.find(term => term.prime === 2 && term.k === 3).derivative, Math.log(2) / 64);
  assert.ok(k3.finiteSum < k6.finiteSum);
  assert.ok(k6.finiteSum < k6.factorsSum);
  assert.deepEqual(logarithmicDerivative(1.1, 1, []), { terms: [], finiteSum: 0, factorsSum: 0 });
  assert.throws(() => logarithmicDerivative(1, 1, [2]), RangeError);
});

test('hypothetical β scaling and reflection are independent of actual zero calculations', () => {
  const center = modelWave(12, .5);
  near(center.ratio, 1);
  assert.equal(center.combined, center.paired);
  assert.equal(center.reflection, 0);
  const moved = modelWave(12, .9);
  near(moved.normalized, 11.669981551126638);
  near(moved.combined, moved.paired + moved.reflection);
  assert.ok(modelWave(16, .95).amplitude > modelWave(2, .95).amplitude);
  assert.throws(() => modelWave(16, 1), RangeError);
});

test('symmetry models deduplicate the critical line and reject unsupported inputs', () => {
  assert.deepEqual(reflectedZeros(.3, 14), [[.3, 14], [.3, -14], [.7, 14], [.7, -14]]);
  assert.deepEqual(reflectedZeros(.5, 80), [[.5, 80], [.5, -80]]);
  assert.throws(() => reflectedZeros(0, 14), RangeError);
  assert.throws(() => reflectedZeros(.5, -14), RangeError);
});

test('known heights, finite ranges, and the pole produce distinct evaluations', () => {
  for (const t of PRIME_ZERO_HEIGHTS.filter(height => height <= 80)) {
    const z = zetaCandidate(.5, t);
    assert.equal(z.status, 'numeric');
    near(Math.hypot(z.re, z.im), 0, 1e-8);
  }
  const normal = zetaCandidate(.5, 14);
  near(Math.hypot(normal.re, normal.im), .1056262677799, 1e-10);
  assert.equal(zetaCandidate(.5, 81).status, 'out-of-domain');
  assert.equal(zetaCandidate(1, 0).status, 'pole');
  assert.equal(zetaCandidate(1, 1e-7).status, 'near-pole');
  assert.deepEqual(zetaColor(zetaCandidate(1, 0)), [38, 42, 49]);
  const conjugate = zetaCandidate(.5, -14);
  near(normal.re, conjugate.re);
  near(normal.im, -conjugate.im);
  assert.notDeepEqual(zetaColor(normal), zetaColor(conjugate));
});
