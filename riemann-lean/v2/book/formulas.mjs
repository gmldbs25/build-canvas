// Presentation MathML for display equations. Short references within prose stay inline.
const tag = (name, body) => `<${name}>${body}</${name}>`;
const variable = value => tag('mi', value);
const number = value => tag('mn', value);
const op = value => tag('mo', value);
const row = value => tag('mrow', value);
const power = (base, exponent) => tag('msup', base + row(exponent));
const sub = (base, index) => tag('msub', base + row(index));
const fraction = (a, b) => tag('mfrac', row(a) + row(b));
const bound = (symbol, low, high) => tag('munderover', op(symbol) + row(low) + row(high));
const bracket = (contents, left = '(', right = ')') => op(left) + contents + op(right);
const v = variable;
const n = number;
const minus = op('−');
const plus = op('+');
const eq = op('=');
const x = v('x');
const s = v('s');
const ln = v('ln');
const rho = v('ρ');
const p = v('p');
const psi = v('ψ');
const zeta = v('ζ');
const rootX = tag('msqrt', x);
const logX = bracket(ln + x);
const gammaLogX = bracket(v('γ') + ln + x);
const fracZeta = minus + fraction(v('ζ′') + bracket(s), zeta + bracket(s));
const f = (fn, argument) => v(fn) + bracket(argument);
const sum = (symbol, condition) => tag('munder', op(symbol) + row(condition));
const betaGammaSquares = power(v('β'), n(2)) + plus + power(v('γ'), n(2));
const domains = new Map([
  ['x^s=x^σ[cos(γ ln x)+i sin(γ ln x)].',
    power(x, s) + eq + power(x, v('σ')) + bracket(v('cos') + gammaLogX + plus + v('i') + v('sin') + gammaLogX, '[', ']')],
  ['ζ(s)=∏_{p prime}(1−p^(−s))^(−1).',
    zeta + bracket(s) + eq + sum('∏', p + tag('mtext', ' 소수')) + power(row(bracket(n(1) + minus + power(p, minus + s))), minus + n(1))],
  ['ψ₀(x)=x−Σρ x^ρ/ρ−ln(2π)−½ln(1−x^(−2)).',
    sub(psi, n(0)) + bracket(x) + eq + x + minus + sum('∑', rho) + fraction(power(x, rho), rho) +
    minus + ln + bracket(n(2) + v('π')) + minus + fraction(n(1), n(2)) + ln + bracket(n(1) + minus + power(x, minus + n(2)))],
  ['Re(x^ρ/ρ)=x^β[β cos(γ ln x)+γ sin(γ ln x)]/(β²+γ²)',
    f('Re', fraction(power(x, rho), rho)) + eq + fraction(
      power(x, v('β')) + bracket(v('β') + v('cos') + gammaLogX + plus + v('γ') + v('sin') + gammaLogX, '[', ']'),
      betaGammaSquares)],
  ['ψ(x)=x+O(√x(ln x)²).', psi + bracket(x) + eq + x + plus + f('O', rootX + power(row(logX), n(2)))],
  ['π(x)=li(x)+O(√x ln x).', f('π', x) + eq + f('li', x) + plus + f('O', rootX + ln + x)],
  ['−ζ′(s)/ζ(s)=s∫₁∞ ψ(x)x^(−s−1) dx.',
    fracZeta + eq + s + bound('∫', n(1), op('∞')) + psi + bracket(x) + power(x, minus + s + minus + n(1)) + v('d') + x],
]);

export function displayFormula(line) {
  const math = domains.get(line.trim());
  return math ? `<div class="formula" tabindex="0" role="region" aria-label="수식 · 필요시 가로 스크롤"><math display="block">${math}</math></div>` : '';
}
