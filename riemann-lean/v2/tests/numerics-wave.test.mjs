import test from 'node:test';
import assert from 'node:assert/strict';
import { primePi, primesInRange, factorize, theta, psi, psi0, li2, explicitFormula, explicitFormulaMetrics, zetaCandidate } from '../core/index.mjs';
import { verifyNumericalFixtures } from '../core/verify.mjs';

test('shared numerical fixture registry passes count, zeta, and explicit formula fixtures', () => {
  const result = verifyNumericalFixtures();
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.counts, { counting: 10, zeta: 11, explicitFormula: 20 });
});

test('prime helpers enforce exact integer bounds and factorization', () => {
  assert.equal(primePi(1), 0);
  assert.equal(primePi(1e6), 78498);
  assert.deepEqual(primesInRange(1, 10), [2,3,5,7]);
  assert.deepEqual(factorize(3600), [{prime:2,exponent:4},{prime:3,exponent:2},{prime:5,exponent:2}]);
  assert.throws(() => factorize(1), RangeError);
  assert.throws(() => primesInRange(2, 1e6 + 1), RangeError);
});

test('theta and psi distinguish prime events from prime-power events', () => {
  assert.equal(theta(1), 0);
  assert.equal(psi(6), psi(5));
  assert.ok(Math.abs((psi(4)-theta(4))-Math.log(2)) < 1e-12);
  assert.ok(Math.abs(psi0(4)-2.138333059508028) < 1e-12);
  assert.ok(Math.abs(psi0(5)-((psi(4)+psi(5))/2)) < 1e-12);
});

test('Li₂ has its defined anchor and rejects unsupported domain', () => {
  assert.equal(li2(2), 0);
  assert.ok(Math.abs(li2(100)-29.08097780396214) < 1e-10);
  assert.throws(() => li2(1.5), RangeError);
});

test('explicit formula metric samples stay fixed when N changes', () => {
  const a = explicitFormulaMetrics(1, { start: 2, end: 10, step: .25 });
  const b = explicitFormulaMetrics(3, { start: 2, end: 10, step: .25 });
  assert.equal(a.sampleCount, 33);
  assert.equal(a.sampleCount, b.sampleCount);
  assert.equal(explicitFormula(4, 60) > 2.14, true);
  assert.equal(explicitFormula(5.5, 0), 3.678931238990147);
});

test('zeta status contract distinguishes poles, near-poles, and unsupported points', () => {
  assert.equal(zetaCandidate(1,0).status, 'pole');
  assert.equal(zetaCandidate(1+1e-8,0).status, 'near-pole');
  assert.equal(zetaCandidate(-3,20).status, 'out-of-domain');
  assert.equal(zetaCandidate(Infinity,0).status, 'out-of-domain');
});
