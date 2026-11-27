"""Independent mpmath/SymPy oracle for the Work 08 V2 pure numerical core.

Requires Python mpmath==1.3.0, SymPy==1.14.0, and Node >=22.
Run from the repository root:
    python riemann-lean/v2/tests/check-core-oracle.py

The original 404 cases plus new cases probe the bounded domain at sampled points.
"""
import json
import random
import subprocess
from pathlib import Path

import mpmath as mp
from sympy import primerange

mp.mp.dps = 45
rng = random.Random(20261127)
reals = [-2, -1.75, -1.5, -1, -.5, 0, .1, .25, .5, .75, .9, .99, 1, 1.001, 1.5, 2, 3]
imags = [-80, -40, -14.134725141734693, -1, 0, .001, .1, 1, 9.064720283654388, 14,
         14.134725141734693, 21.02203963877155, 40, 60, 80]
points = [(a, b) for a in reals for b in imags if (a, b) != (1, 0)]
points += [(rng.uniform(-2, 3), rng.uniform(-80, 80)) for _ in range(150)]
original_count = len(points)
extension = random.Random(394087)
points += [(extension.uniform(-2, 3), extension.uniform(-80, 80)) for _ in range(64)]
points += [(1.0 + offset, height) for offset in [-.00001, .00001] for height in [-.004, 0, .004]]
points += [(-2, 79.95), (3, -79.95), (.5, 79.999), (.5, -79.999), (-1.99, .01), (1, -9.064720283654388)]
zeta_expected = []
for re, im in points:
    value = mp.zeta(mp.mpc(re, im))
    zeta_expected.append([re, im, float(value.real), float(value.imag)])

# Recompute the heights rather than reuse the JavaScript constants.
gammas = [mp.im(mp.zetazero(k)) for k in range(1, 61)]

formula_expected = []
for x in [4, 5.5, 10, 100]:
    base = x - mp.log(2 * mp.pi) - mp.mpf("0.5") * mp.log(1 - mp.mpf(x) ** -2)
    for n in [0, 1, 3, 15, 60]:
        total = base
        for gamma in gammas[:n]:
            rho = mp.mpc(mp.mpf("0.5"), gamma)
            total -= 2 * mp.re(mp.power(x, rho) / rho)
        formula_expected.append([x, n, float(total)])

xs = [2, 4, 5, 5.5, 8, 10, 20, 100, 1000, 1_000_000]
count_expected = []
for x in xs:
    ps = int(mp.floor(x))
    primes = list(primerange(1, ps + 1))
    events = []
    prime_only = 0.0
    for p in primes:
        prime_only += mp.log(p)
        power = p
        while power <= ps:
            events.append((power, mp.log(p)))
            power *= p
    psi_right = sum((jump for point, jump in events if point <= x), mp.mpf(0))
    psi_mid = psi_right
    if x.is_integer():
        for point, jump in events:
            if point == int(x):
                psi_mid -= jump / 2
                break
    li2 = mp.mpf(0) if x == 2 else mp.li(x) - mp.li(2)
    count_expected.append([x, int(mp.primepi(ps)), float(prime_only), float(psi_right), float(psi_mid), float(li2)])

request = {"zeta": zeta_expected, "formula": formula_expected, "counts": count_expected}
js = r"""
import fs from 'node:fs';
import { primePi, theta, psi, psi0, li2, explicitFormula, zetaCandidate, PRIME_ZERO_HEIGHTS } from './riemann-lean/v2/core/index.mjs';
const q=JSON.parse(fs.readFileSync(0,'utf8'));
const zeta=q.zeta.map(([re,im])=>zetaCandidate(re,im));
const formula=q.formula.map(([x,n])=>explicitFormula(x,n));
const counts=q.counts.map(([x])=>[primePi(x),theta(x),psi(x),psi0(x),li2(x)]);
console.log(JSON.stringify({zeta,formula,counts,heights: PRIME_ZERO_HEIGHTS,statuses:[zetaCandidate(1).status,zetaCandidate(1+1e-8).status,zetaCandidate(-3,20).status,zetaCandidate(NaN,0).status]}));
"""
process = subprocess.run(
    ["node", "--input-type=module", "-e", js],
    input=json.dumps(request), text=True, capture_output=True, check=True,
    cwd=Path(__file__).resolve().parents[3],
)
result = json.loads(process.stdout)
worst = 0.0
worst_absolute = 0.0
for expected, actual in zip(zeta_expected, result["zeta"]):
    re, im, er, ei = expected
    if actual["status"] != "numeric":
        raise SystemExit(f"unexpected ζ status at ({re},{im}): {actual['status']}")
    error = ((actual["re"] - er) ** 2 + (actual["im"] - ei) ** 2) ** .5
    worst = max(worst, error / max(1, (er * er + ei * ei) ** .5))
    worst_absolute = max(worst_absolute, error)
    if error / max(1, (er * er + ei * ei) ** .5) > 1e-8:
        raise SystemExit(f"ζ tolerance failed at ({re},{im})")

if len(result["heights"]) != len(gammas):
    raise SystemExit("Wrong number of reference heights")
height_error = max(abs(mp.mpf(actual) - expected) for actual, expected in zip(result["heights"], gammas))
if height_error > mp.mpf("1e-12"):
    raise SystemExit(f"Height tolerance failed: {height_error}")
for (x, n, expected), actual in zip(formula_expected, result["formula"]):
    if abs(expected - actual) > 1e-8:
        raise SystemExit(f"F{n}({x}) mismatch: got {actual}, expected {expected}")
for expected, actual in zip(count_expected, result["counts"]):
    x, pi, th, ps, mid, li = expected
    toler = 1e-6 if x == 1_000_000 else 1e-8
    if actual[0] != pi or any(abs(got - want) > toler for got, want in zip(actual[1:], [th, ps, mid, li])):
        raise SystemExit(f"counting mismatch at x={x}: {actual} vs {[pi, th, ps, mid, li]}")
if result["statuses"] != ["pole", "near-pole", "out-of-domain", "out-of-domain"]:
    raise SystemExit(f"status contract failed: {result['statuses']}")

print(f"PASS: {original_count} original plus {len(zeta_expected) - original_count} new mpmath zeta points; "
      f"worst scaled {worst:.8g}, absolute {worst_absolute:.8g}. "
      f"{len(gammas)} freshly computed heights (maximum difference {mp.nstr(height_error, 5)}), "
      f"{len(formula_expected)} mpmath explicit-formula values, {len(count_expected)} SymPy/mpmath counting fixtures.")
