# Work 08 V2 — Numerical contract, reference fixtures, Lean verification

## Status
2026-11-27. This is preparation, not production implementation. Independent checks were run in Node v22.16.0 and Python mpmath 1.3.0 (45 decimal digits) / SymPy 1.14.0. The candidate in reference/zeta-reference.mjs was checked on 404 points (254 fixed grid + 150 seeded random). All 404 met |computed-reference|/max(1,|reference|)≤1e−8; worst scaled error 7.71793e−11 at −2−i; worst absolute error 3.60977e−10. These sampled results are not a rigorous bound over the full domain. The app must rerun fixtures and browser integration tests. Lean/lake were not installed in the preparation environment.

## Algorithms and contracts
1. Prime table: sieve once to 10^6, sorted primes and prefix counts; binary search for x, integer-domain validation. For factorization n≤10^6, trial division until p²>remaining. Any future larger exact count must use a separately validated algorithm or labeled table; do not silently extrapolate.
2. Theta/psi: build sorted distinct prime-power events for p^k≤limit, jump ln p, prefix sums Float64; p^k loop stops before overflow. For x∈[1,limit], upper-bound search gives right-continuous psi; at an exact event, psi0 subtracts half the jump. Out-of-domain error. Floating result is a numerical logarithmic sum, not integer-exact.
3. Li₂: define as integral from 2 to x. Use verified adaptive quadrature or li(x)=Ei(ln x) for x>1, Li₂=li−li(2); do not integrate across 1 with ordinary quadrature. For x≥2, convergent expansion Ei(L)=γ_E+ln L+Σ_{k≥1} L^k/(k·k!) with termination by residual/tail criterion. At x=2 use exactly 0 for Li₂. Test at 2,4,100,10⁶.
4. Complex arithmetic: Re/Im double, hypot, atan2; zero phase undefined, division by zero guarded. For x>0 use exp(s ln x).
5. Zeta: Euler–Maclaurin, valid away from s=1; candidate N=64,m=10. Formula:
   ζ(s)≈Σ_{n=1}^{N−1}n^(−s)+N^(1−s)/(s−1)+½N^(−s)+Σ_{k=1}^m [B_{2k}/(2k)!](s)_{2k−1} N^(1−s−2k).
   (s)_r=s(s+1)…(s+r−1). DLMF §25.2(iii), §25.18. Compensated summation of real/imag parts independently. Numeric domain only −2≤Re(s)≤3, |Im(s)|≤80. Exact s=1 returns pole; distance <1e−6 returns near-pole (not another pole), outside domain returns out-of-domain. No general precision guarantee from grid tests. Do not extrapolate to Re(s)=−4: trial Python direct summation showed cancellation can worsen with larger N. At ζ(−2) display near-zero numerical evaluation plus separately known exact theorem. For broader domain use reflection with validated gamma or a higher precision algorithm and expand tests. Eta ratio is pedagogical only: its denominator also vanishes at 1+2πik/ln2, k≠0, where ζ remains finite.
6. Zeta heatmap: evaluate actual numeric core, cache keyed by domain/grid/algorithm version. Worker chunks, abort stale results, initial small grid, refine selected window. No expensive data on first paint. Dataset positive γ extends to 163, beyond direct zeta support 80; do not evaluate outside domain and fake values.
7. Explicit formula: F_N=B+sum W_j, B=x−ln(2π)−.5log1p(−x^−2), W=−2 exp(β ln x)(β cos(γ ln x)+γ sin(γ ln x))/(β²+γ²). In actual approximation β=.5; model separate. N=0 valid. ψ₀ benchmark at jumps; right-continuous ψ as separate comparison. RMSE on fixed same grid, unit and sample count. Use actual γ precision (not six decimals).
8. Hypothesis experiment: compute log-amplitude log A=ln2+β ln x−ln hypot(β,γ); ratios in log-space; β≤.95, x≤10¹⁶. No exact prime count claim at 10¹⁶. Do not plot log 0 or claim normalized unit is a fixed bound.
9. Performance: report sampling and accuracy independently; numeric test tolerance cannot substitute for UX measurement. JS worker messages include request ID, input domain, status. Verify stale response rejection.

## Independent count fixtures (mpmath/SymPy, computed 2026-11-27)
Absolute tolerance 1e−8 for x≤1000 and 1e−6 at 10⁶ for sums; integer counts exact. Columns x,pi,theta,psi,psi0,Li2.

    2,1,0.6931471805599453,0.6931471805599453,0.3465735902799727,0
    4,2,1.791759469228055,2.484906649788,2.138333059508028,1.922421314921558
    5,3,3.401197381662155,4.094344562222101,3.28962560600505,2.589424529915159
    5.5,3,3.401197381662155,4.094344562222101,4.094344562222101,2.891103106388134
    8,4,5.347107530717469,6.733401891837359,6.386828301557387,4.208554519441438
    10,4,5.347107530717469,7.832014180505469,7.832014180505469,5.120435724669805
    20,8,16.08760448420003,19.26565831454798,19.26565831454798,8.860136197515328
    100,25,83.72839039906392,94.04531122935739,94.04531122935739,29.08097780396214
    1000,168,956.2452651200589,996.6809122471752,996.6809122471752,176.5644942100347
    1000000,78498,998484.1750256343,999586.5974956329,999586.5974956329,78626.50399568206

π(1)=0; π(10^4)=1229, π(10^5)=9592. [1,100] 25 primes, [999900,1000000] 8 primes. LCM(1..5)=60, LCM(1..10)=2520. β=.9, γ=14.134725141734693, x=10¹²: A/(√x ln²x)=11.669981551126646.

## Zeta fixtures
Columns re, im, ζ.re, ζ.im. Scaled tolerance |err|/max(1,|expected|)≤1e−8. Do not use relative-only at zeros.

    2,0,1.64493406684822644,0
    0,0,-0.5,0
    -1,0,-0.0833333333333333333,0
    -2,0,0,0
    0.5,0,-1.46035450880958681,0
    0.5,14,0.0222411426099935892,-0.103258123266450058
    0.5,14.134725141734693,0,0
    0.5,21.02203963877155,0,0
    0.5,50,-0.081712108320979975,0.330792194038661296
    1,9.064720283654388,1.34657954283631710,0.109883136796269501
    1.001,0,1000.57728847601163,0

Oracle correction during V2 implementation: the previous row above was inconsistent with its stated mpmath 1.3.0 / 45 dps source. Re-evaluation gives the corrected values shown; the reference candidate and production Euler–Maclaurin implementation agree with the corrected independent result. The 404-point reproducible check remains the acceptance oracle.

At the two rounded zeros the reference residual is approximately 10⁻¹⁵, so zero in the fixture is intentional within tolerance. Also test exact pole (1,0), near-pole (1+1e−8,0), out-of-domain (−3,20), nonfinite input, conjugation. For near-pole status do not display ζ as 0.

## Verified γ data: first 60 positive zero heights
Generated with mpmath.zetazero(k) at 45 dps; these values locate known zeros numerically, not a proof that all zeros lie on the line. Use decimal strings as source and Float64 in browser.

    14.13472514173469379, 21.02203963877155499, 25.01085758014568876, 30.42487612585951321, 32.93506158773918969, 37.58617815882567126,
    40.91871901214749519, 43.32707328091499952, 48.00515088116715973, 49.77383247767230218, 52.97032147771446064, 56.4462476970633948,
    59.34704400260235308, 60.83177852460980984, 65.11254404808160666, 67.07981052949417371, 69.54640171117397925, 72.06715767448190758,
    75.70469069908393317, 77.14484006887480537, 79.33737502024936792, 82.91038085408603018, 84.73549298051705011, 87.42527461312522941,
    88.80911120763446542, 92.4918992705584843, 94.65134404051988697, 95.87063422824530976, 98.83119421819369223, 101.3178510057313912,
    103.7255380404783394, 105.4466230523260945, 107.1686111842764075, 111.0295355431696745, 111.8746591769926371, 114.3202209154527128,
    116.2266803208575544, 118.7907828659762173, 121.3701250024206459, 122.9468292935525882, 124.2568185543457672, 127.5166838795964951,
    129.578704199956051, 131.0876885309326567, 133.4977372029975865, 134.7565097533738713, 138.1160420545334432, 139.736208952121389,
    141.1237074040211238, 143.1118458076206327, 146.0009824867655185, 147.422765342559602, 150.0535204207848804, 150.9252576122414668,
    153.0246938111988962, 156.1129092942378676, 157.5975918175940599, 158.8499881714204987, 161.1889641375960275, 163.0307096871819872

## Explicit formula fixtures
Independent evaluation with mpmath complex powers, no reuse of the JS real-trig expression. Rows x,N,F_N. Absolute tolerance 1e−8 in this window.

    4,0,2.1943921941594401
    4,1,1.9953555722324776
    4,3,2.1649348909762443
    4,15,2.0776023285137369
    4,60,2.1476846783469808
    5.5,0,3.678931238990147
    5.5,1,3.9582086909939486
    5.5,3,4.3552127326017273
    5.5,15,4.04093646446871
    5.5,60,4.1184983999845323
    10,0,8.1671481015174052
    10,1,7.7561468838344679
    10,3,7.8256798733663008
    10,15,7.9087257575597096
    10,60,7.8029034532540321
    100,0,98.162172936090821
    100,1,97.104233963285909
    100,3,95.913271067220865
    100,15,95.5944703929319
    100,60,94.182322662564693

For x=4 compare to ψ₀=2.138333059508028; for 5.5 compare to 4.094344562222101. At x=100, ψ=ψ₀=94.04531122935739. N=15 need not always beat N=3: x=10 provides an example. Keep selected sample fixed.

## Lean candidate exercises
Use a pinned toolchain and Mathlib commit (e.g. v4.35.0 + 56a005855ea17e0b0958f73ec801ae140b0a1679 for compatibility with compact proof, after confirming build). Do not install 17M lines into the Work build. The following are candidates, not yet run in preparation.

    import Mathlib
    theorem identity_demo (P : Prop) : P → P := by
      intro h
      exact h
    theorem conjunction_demo (P Q : Prop) : P ∧ Q → Q ∧ P := by
      intro h
      exact ⟨h.2, h.1⟩
    theorem equality_demo (a b : ℝ) : a = b → b = a := by
      intro h
      exact h.symm
    theorem positive_of_equal (a b : ℝ) : a = b → 0 < b → 0 < a := by
      intro h hab
      rw [h]
      exact hab
    theorem zero_add_demo (n : ℕ) : 0 + n = n := by
      simp

Separate intentionally failing files: exact h at goal 0<a with h:a=b; exact h.1 at goal Q when h:P∧Q, generic P,Q; wrong constructor. Assert expected nonzero process exit and exact toolchain output. Capture intermediate goals using trace_state or LSP/Lean tooling; record actual invocation, exit code, output, hash, version and source. A simulator fixture must correspond to a real successful or failed Lean invocation. Validate allowed transitions; not a fake freeform interpreter. Print axioms of successful examples and document the actual result. Use test environment or CI not a browser backend. For Proof Explorer, read original/shorter repository source at pinned revisions without running untrusted build scripts by default; cite third-party full-proof check records rather than claiming local full-proof verification. Full original proof recreation is out of scope for ordinary CI.
