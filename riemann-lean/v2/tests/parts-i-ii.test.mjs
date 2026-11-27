import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUlamGrid, createFactorTree, createSieveState,
  factorTreeFromFactors, factorTreeSummary,
  inspectPrimeGaps, inspectPrimeRange, inspectUlamDiagonal, primeCountingAt,
  primeCountingCurve, primeCountingError, sieveBack, sieveReset, sieveStep,
  sieveSummary, splitFactorLeaf, ulamCoordinates, ulamValueAt,
} from '../labs/prime-models.mjs';
import {
  addComplex, complexPlayground, complexSummary, conjugateComplex,
  dirichletPartialSums, eulerProductBuilder, eulerWaveState, geometricComplexSeries,
  multiplyComplex, riemannLogWave,
  zetaContinuationState,
} from '../labs/complex-models.mjs';

test('01-A factor trees preserve product and converge to the unique prime powers', () => {
  let tree = createFactorTree(84);
  tree = splitFactorLeaf(tree, 'r', 4);
  tree = splitFactorLeaf(tree, 'rL', 2);
  tree = splitFactorLeaf(tree, 'rR', 3);
  assert.equal(tree.leaves.reduce((product, leaf) => product * leaf.value, 1), 84);
  assert.deepEqual(factorTreeSummary(tree), { complete: true, unfinished: [], primePowers: [
    { prime: 2, exponent: 2 }, { prime: 3, exponent: 1 }, { prime: 7, exponent: 1 },
  ] });
  assert.deepEqual(factorTreeFromFactors(3600), [
    { prime: 2, exponent: 4 }, { prime: 3, exponent: 2 }, { prime: 5, exponent: 2 },
  ]);
  assert.throws(() => createFactorTree(1), RangeError);
  assert.throws(() => createFactorTree(1.5), RangeError);
  assert.throws(() => createFactorTree(1_000_001), RangeError);
  assert.throws(() => splitFactorLeaf(createFactorTree(12), 'r', 5), RangeError);
});

test('01-B sieve advances by p², records the first cause, and resets/backtracks', () => {
  let state = createSieveState(100);
  assert.equal(sieveSummary(state).currentPrime, 2);
  state = sieveStep(state);
  state = sieveStep(state);
  state = sieveStep(state);
  state = sieveStep(state);
  assert.equal(state.reasons[49], 7);
  assert.equal(state.composite[1], 1);
  assert.equal(state.composite[97], 0);
  assert.equal(sieveSummary(state).count, 25);
  assert.equal(sieveSummary(state).currentPrime, null);
  state = sieveBack(state);
  assert.equal(state.reasons[49], null);
  assert.equal(state.stages.length, 3);
  assert.equal(sieveSummary(sieveReset(100)).count, 99);
  const final400 = (() => { let s = createSieveState(400); while (!s.complete) s = sieveStep(s); return sieveSummary(s).primes; })();
  assert.deepEqual(final400, sieveSummary((() => { let s = createSieveState(400); while (!s.complete) s = sieveStep(s); return s; })()).primes);
  assert.throws(() => createSieveState(401), RangeError);
});

test('02-A prime microscope counts inclusive ranges and reports gaps only inside them', () => {
  const low = inspectPrimeRange(1, 100);
  const high = inspectPrimeRange(999_900, 1_000_000);
  assert.equal(low.integerCount, 100);
  assert.equal(low.count, 25);
  assert.equal(high.integerCount, 101);
  assert.equal(high.count, 8);
  assert.deepEqual(inspectPrimeRange(14, 16).primes, []);
  assert.equal(inspectPrimeRange(14, 16).meanGap, null);
  assert.throws(() => inspectPrimeRange(1, 2001), RangeError);
  assert.throws(() => inspectPrimeRange(2, 1), RangeError);
});

test('02-B Ulam spiral agrees with reference coordinates and is a grid bijection', () => {
  assert.deepEqual(ulamCoordinates(1), { x: 0, y: 0 });
  assert.deepEqual(ulamCoordinates(2), { x: 1, y: 0 });
  assert.deepEqual(ulamCoordinates(3), { x: 1, y: 1 });
  assert.deepEqual(ulamCoordinates(9), { x: 1, y: -1 });
  assert.equal(ulamValueAt(1, -1), 9);
  const seen = new Set();
  for (let n = 1; n <= 201 ** 2; n += 1) {
    const { x, y } = ulamCoordinates(n);
    assert.equal(ulamValueAt(x, y), n);
    seen.add(`${x},${y}`);
  }
  assert.equal(seen.size, 201 ** 2);
  assert.equal(buildUlamGrid(11).cells.length, 121);
  assert.throws(() => buildUlamGrid(12), RangeError);
  assert.ok(inspectUlamDiagonal(11, 'main').values.length === 11);
  assert.throws(() => inspectUlamDiagonal(11, 'invalid'), RangeError);
});

test('02-C gap sample uses consecutive primes strictly inside the interval', () => {
  const result = inspectPrimeGaps(2, 13);
  assert.deepEqual(result.gaps, [1, 2, 2, 4, 2]);
  assert.equal(Object.values(result.histogram).reduce((sum, n) => sum + n, 0), result.sampleCount);
  assert.equal(result.mean, 2.2);
  assert.equal(result.median, 2);
  assert.equal(result.max, 4);
  const empty = inspectPrimeGaps(14, 16);
  assert.equal(empty.sampleCount, 0);
  assert.equal(empty.mean, null);
  assert.throws(() => inspectPrimeGaps(2, 1_000_001), RangeError);
});

test('03-A exact count and approximation fixtures include Li₂ anchor and million endpoint', () => {
  assert.equal(primeCountingAt(100).pi, 25);
  assert.equal(primeCountingAt(1_000_000).pi, 78_498);
  assert.equal(primeCountingAt(2).li2, 0);
  assert.ok(Math.abs(primeCountingAt(100).li2 - 29.08097780396214) < 1e-10);
  assert.equal(primeCountingCurve(100, { width: 100 }).piPoints[0][1], 1);
  assert.equal(primeCountingCurve(100, { width: 100 }).piPoints.at(-1)[1], 25);
  assert.throws(() => primeCountingAt(1), RangeError);
  assert.throws(() => primeCountingCurve(1_000_001), RangeError);
});

test('03-B signed and relative error preserve sign and guard zero denominators', () => {
  const result = primeCountingError(10, 'xOverLogX');
  assert.equal(result.pi, 4);
  assert.ok(Math.abs(result.estimate - 4.342944819032518) < 1e-12);
  assert.ok(Math.abs(result.signedError + .342944819032518) < 1e-12);
  assert.ok(result.signedRelativeError < 0);
  assert.equal(primeCountingError(2, 'li2').ratio, null);
  assert.throws(() => primeCountingError(10, 'unsupported'), RangeError);
});

test('04-A complex operations preserve exact structure and undefined zero argument', () => {
  const product = complexPlayground({ re: 1, im: 1 }, { re: 0, im: 1 }, 'multiply').result;
  assert.equal(product.re, -1);
  assert.ok(Math.abs(product.im - 1) < 1e-15);
  assert.equal(complexSummary({ re: 3, im: 4 }).magnitude, 5);
  assert.equal(complexSummary({ re: 0, im: 0 }).argumentRadians, null);
  assert.deepEqual(addComplex({ re: 1, im: 2 }, { re: 3, im: 4 }), { re: 4, im: 6 });
  assert.deepEqual(multiplyComplex({ re: 1, im: 1 }, { re: 0, im: 1 }), { re: -1, im: 1 });
  assert.deepEqual(conjugateComplex({ re: 2, im: -3 }), { re: 2, im: 3 });
  assert.equal(complexPlayground({ re: 3, im: 3 }, { re: 3, im: 3 }).axis.yMax, 18);
  assert.throws(() => complexPlayground({ re: 4, im: 0 }, { re: 0, im: 1 }), RangeError);
});

test('04-B Euler rotation and wave cursor share the same phase', () => {
  const quarter = eulerWaveState(Math.PI / 2, 1, 'rad');
  assert.ok(Math.abs(quarter.point.re) < 1e-15);
  assert.ok(Math.abs(quarter.point.im - 1) < 1e-15);
  assert.equal(quarter.waveValue, quarter.point.im);
  assert.equal(eulerWaveState(180, 2, 'deg').point.re, -1);
  assert.throws(() => eulerWaveState(361, 1, 'deg'), RangeError);
  assert.ok(Math.abs(riemannLogWave(Math.exp(2 * Math.PI / 10), .5, 10).phase - 2 * Math.PI) < 1e-12);
});

test('05-A Dirichlet partial sums and tail interval follow the convergence boundary', () => {
  const s2 = dirichletPartialSums(2, 10);
  assert.ok(Math.abs(s2.sum - 1.54976773116654) < 1e-13);
  assert.equal(s2.converges, true);
  assert.ok(s2.tailBounds.lower < s2.tailBounds.upper);
  const s1 = dirichletPartialSums(1, 10);
  assert.ok(Math.abs(s1.sum - 2.92896825396825) < 1e-13);
  assert.equal(s1.converges, false);
  assert.equal(s1.tailBounds, null);
  assert.throws(() => dirichletPartialSums(.2, 10), RangeError);
  assert.throws(() => dirichletPartialSums(2, 9), RangeError);
});

test('05-B finite Euler product and natural-number truncation are distinct', () => {
  const firstTwo = eulerProductBuilder(2, 2, 60);
  assert.ok(Math.abs(firstTwo.product - 1.5) < 1e-14);
  assert.ok(firstTwo.rows.some(row => row.n === 12));
  assert.ok(firstTwo.rows.some(row => row.n === 18));
  assert.ok(!firstTwo.rows.some(row => row.n === 5 || row.n === 10));
  const firstThree = eulerProductBuilder(2, 3, 60);
  assert.ok(firstThree.rows.some(row => row.n === 10));
  assert.equal(eulerProductBuilder(2, 0, 60).product, 1);
  assert.deepEqual(eulerProductBuilder(2, 0, 60).rows.map(row => row.n), [1]);
  assert.ok(Math.abs(firstTwo.zetaReference - 1.6449340668482264) < 1e-12);
  assert.throws(() => eulerProductBuilder(1, 2, 60), RangeError);
});

test('06-A complex geometric partial sum stays distinct from rational continuation', () => {
  const negativeOne = geometricComplexSeries({ re: -1, im: 0 }, 4);
  assert.deepEqual(negativeOne.points.map(point => point.re), [1, 0, 1, 0]);
  assert.deepEqual(negativeOne.value, { re: .5, im: 0 });
  const two = geometricComplexSeries({ re: 2, im: 0 }, 4);
  assert.deepEqual(two.partialSum, { re: 15, im: 0 });
  assert.deepEqual(two.value, { re: -1, im: 0 });
  const pole = geometricComplexSeries({ re: 1, im: 0 }, 4);
  assert.equal(pole.pole, true);
  assert.equal(pole.partialSum.re, 4);
  assert.equal(pole.value, null);
  const imaginary = geometricComplexSeries({ re: 0, im: 1 }, 4);
  assert.deepEqual(imaginary.value, { re: .5, im: .5 });
  assert.throws(() => geometricComplexSeries({ re: 3, im: 0 }, 4), RangeError);
});

test('06-B analytic continuation does not relabel the raw divergent partial sum', () => {
  const atZero = zetaContinuationState(0, 10);
  assert.equal(atZero.zeta, -.5);
  assert.equal(atZero.rawSum, 10);
  assert.equal(atZero.rawConverges, false);
  const atHalf = zetaContinuationState(.5, 10);
  assert.ok(Math.abs(atHalf.zeta - -1.4603545088095868) < 1e-12);
  const pole = zetaContinuationState(1, 10);
  assert.equal(pole.status, 'pole');
  assert.equal(pole.zeta, null);
  assert.ok(zetaContinuationState(2, 10).rawConverges);
  assert.throws(() => zetaContinuationState(-3, 10), RangeError);
});
