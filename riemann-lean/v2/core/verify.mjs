import { primePi, primesInRange, factorize } from './primes.mjs';
import { theta, psi, psi0, li2 } from './counting.mjs';
import { explicitFormula } from './explicit-formula.mjs';
import { zetaCandidate } from './zeta.mjs';

const countFixtures = [
  [2,1,0.6931471805599453,0.6931471805599453,0.3465735902799727,0],
  [4,2,1.791759469228055,2.484906649788,2.138333059508028,1.922421314921558],
  [5,3,3.401197381662155,4.094344562222101,3.28962560600505,2.589424529915159],
  [5.5,3,3.401197381662155,4.094344562222101,4.094344562222101,2.891103106388134],
  [8,4,5.347107530717469,6.733401891837359,6.386828301557387,4.208554519441438],
  [10,4,5.347107530717469,7.832014180505469,7.832014180505469,5.120435724669805],
  [20,8,16.08760448420003,19.26565831454798,19.26565831454798,8.860136197515328],
  [100,25,83.72839039906392,94.04531122935739,94.04531122935739,29.08097780396214],
  [1000,168,956.2452651200589,996.6809122471752,996.6809122471752,176.5644942100347],
  [1e6,78498,998484.1750256343,999586.5974956329,999586.5974956329,78626.50399568206]
];
const zetaFixtures = [
  [2,0,1.64493406684822644,0], [0,0,-.5,0], [-1,0,-.0833333333333333333,0], [-2,0,0,0],
  [.5,0,-1.46035450880958681,0], [.5,14,.0222411426099935892,-.103258123266450058],
  [.5,14.134725141734693,0,0], [.5,21.02203963877155,0,0], [.5,50,-.081712108320979975,.330792194038661296],
  [1,9.064720283654388,1.3465795428363171,.1098831367962695], [1.001,0,1000.57728847601163,0]
];
const formulaFixtures = [
  [4,0,2.1943921941594401],[4,1,1.9953555722324776],[4,3,2.1649348909762443],[4,15,2.0776023285137369],[4,60,2.1476846783469808],
  [5.5,0,3.678931238990147],[5.5,1,3.9582086909939486],[5.5,3,4.3552127326017273],[5.5,15,4.04093646446871],[5.5,60,4.1184983999845323],
  [10,0,8.1671481015174052],[10,1,7.7561468838344679],[10,3,7.8256798733663008],[10,15,7.9087257575597096],[10,60,7.8029034532540321],
  [100,0,98.162172936090821],[100,1,97.104233963285909],[100,3,95.913271067220865],[100,15,95.5944703929319],[100,60,94.182322662564693]
];

function close(actual, expected, tolerance, name, failures) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) failures.push(`${name}: got ${actual}, expected ${expected} ± ${tolerance}`);
}

export function verifyNumericalFixtures() {
  const failures = [];
  for (const [x, pi, th, ps, mid, li] of countFixtures) {
    if (primePi(x) !== pi) failures.push(`π(${x})=${primePi(x)}, expected ${pi}`);
    close(theta(x), th, x === 1e6 ? 1e-6 : 1e-8, `θ(${x})`, failures);
    close(psi(x), ps, x === 1e6 ? 1e-6 : 1e-8, `ψ(${x})`, failures);
    close(psi0(x), mid, x === 1e6 ? 1e-6 : 1e-8, `ψ₀(${x})`, failures);
    close(li2(x), li, x === 1e6 ? 1e-6 : 1e-8, `Li₂(${x})`, failures);
  }
  if (primePi(1) !== 0 || primePi(1e4) !== 1229 || primePi(1e5) !== 9592) failures.push('prime count boundary fixtures failed');
  if (primesInRange(1,100).length !== 25 || primesInRange(999900,1e6).length !== 8 || primesInRange(14,16).length !== 0) failures.push('prime interval fixtures failed');
  if (JSON.stringify(factorize(84)) !== JSON.stringify([{prime:2,exponent:2},{prime:3,exponent:1},{prime:7,exponent:1}])) failures.push('factorize(84) fixture failed');
  for (const [re, im, er, ei] of zetaFixtures) {
    const got = zetaCandidate(re, im);
    if (got.status !== 'numeric') { failures.push(`ζ(${re}+${im}i) status ${got.status}`); continue; }
    const scaled = Math.hypot(got.re-er, got.im-ei) / Math.max(1, Math.hypot(er,ei));
    if (scaled > 1e-8) failures.push(`ζ(${re}+${im}i) scaled error ${scaled}`);
  }
  for (const [x,n,expected] of formulaFixtures) close(explicitFormula(x,n), expected, 1e-8, `F${n}(${x})`, failures);
  const statuses = [zetaCandidate(1).status,zetaCandidate(1+1e-8).status,zetaCandidate(-3,20).status,zetaCandidate(NaN,0).status];
  if (statuses.join(',') !== 'pole,near-pole,out-of-domain,out-of-domain') failures.push(`zeta statuses ${statuses.join(',')}`);
  if (zetaCandidate(.5,14).im !== -zetaCandidate(.5,-14).im) failures.push('zeta conjugation fixture failed');
  return { passed: failures.length === 0, counts: { counting: countFixtures.length, zeta: zetaFixtures.length, explicitFormula: formulaFixtures.length }, failures };
}
