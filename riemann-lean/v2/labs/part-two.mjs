import { createLab, field, choice, format, html, figures, table, plot } from './ui.mjs';
import { zetaCandidate } from '../core/zeta.mjs';
import {
  complexPlayground, dirichletPartialSums, eulerProductBuilder,
  eulerWaveState, geometricComplexSeries, riemannLogWave, zetaContinuationState,
} from './complex-models.mjs';

const fmt = (value, digits = 6) => format(value, digits);
const coordinate = (value, digits = 4) => `${value < 0 ? '−' : ''}${fmt(Math.abs(value), digits)}`;
const valuePair = ({ re, im }, digits = 6) => `${coordinate(re, digits)} ${im < 0 ? '−' : '+'} ${fmt(Math.abs(im), digits)}i`;

function complexSvg({ vectors, extent = 3, title, circle = false, path = [] }) {
  const limit = Math.max(1, extent);
  const scale = 126 / limit;
  const point = (re, im) => [180 + re * scale, 180 - im * scale];
  const axes = '<path d="M25 180H335M180 25V335" stroke="#5E5B4E" stroke-width="1.3"/><text x="338" y="185">Re</text><text x="185" y="20">Im</text>';
  const unit = circle ? `<circle cx="180" cy="180" r="${scale}" fill="none" stroke="#C9C4B0" stroke-dasharray="4 5"/>` : '';
  const pathMarkup = path.length ? `<polyline points="${path.map(({ re, im }) => point(re, im).join(',')).join(' ')}" fill="none" stroke="#7A2838" stroke-width="2.5"/>` : '';
  const vectorMarkup = vectors.map(({ label, re, im, color, dashed = false }, index) => {
    const [x, y] = point(re, im);
    return `<g><line x1="180" y1="180" x2="${x}" y2="${y}" stroke="${color}" stroke-width="${index === vectors.length - 1 ? 3 : 2}" ${dashed ? 'stroke-dasharray="6 4"' : ''}/><circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/><text x="${Math.max(12, Math.min(310, x + 7))}" y="${Math.max(18, Math.min(323, y - 7))}">${html(label)}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${html(title)}" style="display:block;width:min(100%, 360px);height:auto;aspect-ratio:1;max-height:none;margin-inline:auto">${axes}${unit}${pathMarkup}${vectorMarkup}</svg>`;
}

function mountComplexPlayground(root, params) {
  return createLab(root, {
    fields: [field('ar', 'Re(a)', 1, -3, 3, .1), field('ai', 'Im(a)', 1, -3, 3, .1), field('br', 'Re(b)', 0, -3, 3, .1), field('bi', 'Im(b)', 1, -3, 3, .1), choice('operation', '연산', 'multiply', [['add', '덧셈 a+b'], ['multiply', '곱셈 a·b'], ['conjugate-a', 'a의 켤레'], ['conjugate-b', 'b의 켤레']])], params,
    presets: { '기본 1+i, i': { ar: 1, ai: 1, br: 0, bi: 1, operation: 'multiply' }, '3+4i 길이': { ar: 3, ai: 0, br: 0, bi: 0, operation: 'add' } },
    render: ({ ar, ai, br, bi, operation }, { figure }) => {
      const a = { re: ar, im: ai }, b = { re: br, im: bi };
      const result = complexPlayground(a, b, operation).result;
      const extent = Math.max(3, Math.abs(result.re), Math.abs(result.im)) * 1.08;
      const vectors = [
        { label: 'a', ...a, color: '#17243A' },
        { label: 'b', ...b, color: '#0D766E', dashed: true },
        { label: '결과', re: result.re, im: result.im, color: '#7A2838' },
      ];
      figure.innerHTML = `<p>복소수를 좌표평면의 벡터로 보세요. 두 축은 같은 단위 길이이며 결과가 입력 영역을 벗어나면 축 범위를 확장합니다.</p>
        ${complexSvg({ vectors, extent, title: `a=${valuePair(a)}, b=${valuePair(b)}, 결과 ${valuePair(result)}` })}`;
      return `${figures([['복소식', valuePair(result)], ['실수부', result.re], ['허수부', result.im], ['절댓값', fmt(result.magnitude, 8)], ['편각 (rad)', result.argumentRadians === null ? '정의되지 않음' : fmt(result.argumentRadians, 8)], ['편각 (°)', result.argumentDegrees === null ? '정의되지 않음' : fmt(result.argumentDegrees, 6)]])}
        <p class="lab-equation">(a+bi)(c+di) = (ac−bd) + (ad+bc)i</p>
        <p>0의 편각은 정의하지 않습니다. (1+i)i=−1+i이고, |3+4i|=5입니다.</p>`;
    },
  }, params);
}

function mountEulerWave(root, params) {
  let api;
  let timer = null;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'wave-step') {
      stop();
      const theta = api.controls.theta.valueAsNumber;
      const unit = api.controls.unit.value;
      const step = unit === 'deg' ? 15 : Math.PI / 12;
      const max = unit === 'deg' ? 360 : 2 * Math.PI;
      api.set({ theta: (theta + step) % (max + Number.EPSILON) });
    }
    if (action === 'wave-play') {
      if (timer !== null) { stop(); event.target.textContent = '재생'; return; }
      if (reduced) return;
      event.target.textContent = '일시정지';
      timer = setInterval(() => {
        const unit = api.controls.unit.value;
        const step = unit === 'deg' ? 3 : Math.PI / 60;
        const max = unit === 'deg' ? 360 : 2 * Math.PI;
        api.set({ theta: (api.controls.theta.valueAsNumber + step) % (max + Number.EPSILON) });
      }, 100);
    }
  });
  api = createLab(root, {
    fields: [field('theta', '회전각 θ', 0, 0, 360, 'any'), choice('unit', '각도 단위', 'rad', [['rad', '라디안'], ['deg', '도']]), field('omega', '각주파수 ω (rad/u)', 1, .5, 4, .1), choice('view', '보기', 'circle', [['circle', '단위원과 실수 파동'], ['logwave', 'x^σ exp(iγ ln x) 미리보기']]), field('sigma', 'σ', .5, -2, 2, .1), field('gamma', 'γ', 10, .5, 80, .1), field('x', 'x', 2, .01, 1_000_000, 'any')], params,
    presets: { 'π/2': { theta: Math.PI / 2, unit: 'rad', omega: 1 }, 'π': { theta: Math.PI, unit: 'rad', omega: 1 }, '2π': { theta: 2 * Math.PI, unit: 'rad', omega: 1 } },
    init: stop,
    render: (values, { figure }) => {
      if (values.view === 'logwave') {
        stop();
        const wave = riemannLogWave(values.x, values.sigma, values.gamma);
        const points = Array.from({ length: 161 }, (_, i) => {
          const u = Math.log(values.x) * i / 160;
          const magnitude = Math.exp(values.sigma * u);
          return [u, magnitude * Math.sin(values.gamma * u)];
        });
        figure.innerHTML = `<p>u=ln x 위에서 점은 x^σ exp(iγ ln x)의 위상을 따라갑니다. 각 x는 양수여야 합니다.</p>
          ${complexSvg({ vectors: [{ label: '현재 복소값', ...wave.point, color: '#7A2838' }], extent: Math.max(2, wave.magnitude), title: `x=${fmt(values.x)}, 위상=${fmt(wave.phase)} rad` })}
          ${plot({ title: '허수부 Im(x^σ exp(iγ ln x))', xLabel: 'u=ln x', yLabel: '허수부', series: [{ label: 'x^σ sin(γ ln x)', points }], markers: [[wave.u, wave.point.im]] })}`;
        return `${figures([['현재 x', fmt(wave.x, 5)], ['u=ln x', fmt(wave.u, 6)], ['위상 γu', fmt(wave.phase, 6)], ['진폭 x^σ', fmt(wave.magnitude, 6)], ['복소값', valuePair(wave.point, 7)]])}<p>π/2, π, 2π의 기준 각도와 같은 실수축·허수축 해석을 로그 입력 u에 적용합니다.</p>`;
      }
      const state = eulerWaveState(values.theta, values.omega, values.unit);
      figure.innerHTML = `<p>단위원의 점과 사인·코사인 그래프의 커서는 같은 phase θ를 사용합니다. 재생은 기본적으로 꺼져 있습니다.</p>
        ${complexSvg({ vectors: [{ label: 'e^{iθ}', ...state.point, color: '#7A2838' }], extent: 1.15, circle: true, title: `단위원 θ=${fmt(state.phase, 6)} rad, 점 ${valuePair(state.point, 6)}` })}
        ${plot({ title: '단위원 회전의 실수 파동', xLabel: '시간 u', yLabel: 'cos(ωu), sin(ωu)', series: [{ label: 'cos(ωu)', points: state.samples.map(item => [item.time, item.cosine]) }, { label: 'sin(ωu)', points: state.samples.map(item => [item.time, item.sine]) }], markers: [[state.time, state.cosineValue], [state.time, state.waveValue]] })}
        <div class="lab-buttons" role="group" aria-label="회전 재생 조작"><button type="button" data-action="wave-step">한 단계</button>${reduced ? '<span>동작 감소 설정: 단계 조작을 사용하세요.</span>' : '<button type="button" data-action="wave-play">재생</button>'}</div>`;
      return `${figures([['회전각 θ', `${fmt(state.phase, 6)} rad · ${fmt(state.phaseDegrees, 4)}°`], ['각주파수 ω', `${fmt(state.omega, 3)} rad/u`], ['시간 u=θ/ω', fmt(state.time, 6)], ['cos θ', fmt(state.cosineValue, 8)], ['sin θ', fmt(state.waveValue, 8)], ['단위원 점', `(${fmt(state.point.re, 8)}, ${fmt(state.point.im, 8)})`]])}
        <p>수학 변수 ω는 라디안/시간 단위입니다. 화면 재생 속도는 이 수학적 각주파수와 별개입니다.</p>`;
    },
  }, params);
  return { ...api, reset: () => { stop(); api.reset(); } };
}

function mountDirichlet(root, params) {
  return createLab(root, {
    fields: [field('s', '실수 s', 2, .25, 4, .01), field('logN', '항 개수 log₁₀ N', 1, 1, 4, .1, 'range'), choice('scale', '세로축', 'linear', [['linear', '선형 눈금'], ['log', '로그 눈금']])], params,
    presets: { 's=0.5': { s: .5, logN: 2 }, 's=1': { s: 1, logN: 2 }, 's=1.5': { s: 1.5, logN: 2 }, 's=2': { s: 2, logN: 1 } },
    render: ({ s, logN, scale }, { figure }) => {
      const terms = Math.max(10, Math.min(10_000, Math.round(10 ** logN)));
      const result = dirichletPartialSums(s, terms);
      const stride = Math.max(1, Math.ceil(terms / 320));
      const transformY = value => scale === 'log' ? Math.log10(value) : value;
      const yTick = scale === 'log' ? value => fmt(10 ** value, 4) : fmt;
      const selected = result.partial.map((value, i) => i % stride === 0 || i === terms - 1 ? [i + 1, transformY(value)] : null).filter(Boolean);
      const termPoints = result.termValues.map((value, i) => i % stride === 0 || i === terms - 1 ? [i + 1, transformY(value)] : null).filter(Boolean);
      figure.innerHTML = `<p>Sₖ=Σₙ₌₁ᵏn⁻ˢ의 계단식 부분합을 확인합니다. 표본은 균등한 항 간격으로 최대 320개를 그립니다. 조작부 바로 아래에서 항의 크기와 기준값을 추가로 비교할 수 있습니다.</p>
        ${plot({ title: `급수 부분합 Sₖ · ${scale === 'log' ? '로그 y' : '선형 y'}`, xLabel: '항 번호 k', yLabel: scale === 'log' ? 'log₁₀(Sₖ)' : 'Sₖ', series: [{ label: scale === 'log' ? 'log₁₀(Sₖ)' : '부분합 Sₖ', points: selected }], xDomain: [1, terms], yTick })}`;
      const reference = result.zetaReference === null ? (result.referenceStatus === 'near-pole' ? 's=1 근처: 안정된 기준값 없음' : '발산 영역: ζ 기준값 없음') : fmt(result.zetaReference, 9);
      const tail = result.tailBounds ? `[${fmt(result.tailBounds.lower, 8)}, ${fmt(result.tailBounds.upper, 8)}]` : 's≤1이므로 이 수렴 꼬리 구간을 적용하지 않습니다.';
      return `${figures([['s', fmt(s, 4)], ['항 수 N', terms.toLocaleString('ko-KR')], ['Sₙ', fmt(result.sum, 12)], ['급수의 이론적 상태', result.converges ? 's>1에서 수렴' : 's≤1에서 발산'], ['ζ(s) 수치 기준', reference], ['절단 tail 범위', tail]])}
        ${plot({ title: `각 항의 크기 · ${scale === 'log' ? '로그 y' : '선형 y'}`, xLabel: '항 번호 n', yLabel: scale === 'log' ? 'log₁₀(n⁻ˢ)' : 'n⁻ˢ', series: [{ label: scale === 'log' ? 'log₁₀(n⁻ˢ)' : 'n⁻ˢ', points: termPoints }], xDomain: [1, terms], yTick })}
        <p>부분합은 s≤1에서 발산합니다. 해석적으로 연속된 ζ(s)의 값과 혼동하지 마세요. 기준 알고리즘: ${html(result.referenceAlgorithm ?? '해당 없음')}.</p>`;
    },
  }, params);
}

function mountEulerProduct(root, params) {
  return createLab(root, {
    fields: [field('s', '실수 s', 2, 1.1, 4, .01), field('primeCount', '선택한 처음 K개 소수', 2, 0, 20, 1, 'range'), field('maxN', '자연수 표의 끝', 60, 1, 120, 1, 'range')], params,
    presets: { 'p=2,3': { s: 2, primeCount: 2, maxN: 60 }, 'p=2,3,5': { s: 2, primeCount: 3, maxN: 60 }, '인자 없음': { primeCount: 0, maxN: 60 } },
    render: ({ s, primeCount, maxN }, { figure }) => {
      const result = eulerProductBuilder(s, primeCount, maxN);
      const bars = [result.product, result.finiteNaturalSum];
      const maximum = Math.max(...bars, 1);
      figure.innerHTML = `<p>선택한 소수의 유한 곱은 각 선택 소수의 모든 거듭제곱을 포함합니다. 자연수 표는 n≤${maxN}만 합산하므로 두 수가 같을 이유가 없습니다.</p>
        <svg viewBox="0 0 620 185" role="img" aria-label="유한 소수 곱 ${fmt(bars[0], 8)}, 유한 자연수 합 ${fmt(bars[1], 8)}" style="display:block;width:100%;height:auto">
          <path d="M170 20V155H600" fill="none" stroke="currentColor"/>
          <text x="8" y="65">선택 소수의 유한 곱</text><rect x="170" y="42" width="${400 * bars[0] / maximum}" height="34" fill="#7A2838"/><text x="${180 + 400 * bars[0] / maximum}" y="63">${fmt(bars[0], 8)}</text>
          <text x="8" y="127">n≤${maxN} 표의 유한 합</text><rect x="170" y="104" width="${400 * bars[1] / maximum}" height="34" fill="#0D766E"/><text x="${180 + 400 * bars[1] / maximum}" y="125">${fmt(bars[1], 8)}</text>
        </svg>`;
      const rows = result.rows.map(row => [String(row.n), row.factors.length ? row.factors.map(([p, k]) => k === 1 ? String(p) : `${p}^${k}`).join('·') : '1', fmt(row.value, 8)]);
      const reference = result.zetaReference === null ? (result.referenceStatus === 'near-pole' ? '근방에서 기준값 없음' : '값을 표시할 수 없음') : fmt(result.zetaReference, 9);
      return `${figures([['s', fmt(s, 3)], ['선택 소수', result.selectedPrimes.join(', ') || '없음'], ['유한 소수 곱 Pₖ', fmt(result.product, 12)], ['표의 자연수 부분합', fmt(result.finiteNaturalSum, 12)], ['ζ(s) 별도 기준값', reference]])}
        ${table(`선택한 모든 소인수가 K개 소수 안에 있는 n≤${maxN}`, ['n', '소인수', 'n⁻ˢ'], rows)}
        <p>곱 계산에는 log1p를 사용했습니다. 같은 n은 한 번만 표기합니다. 기준 수치: ${html(result.referenceAlgorithm ?? '해당 없음')}.</p>`;
    },
  }, params);
}

function mountGeometric(root, params) {
  return createLab(root, {
    fields: [field('re', 'Re(z)', .5, -2, 2, .05), field('im', 'Im(z)', 0, -2, 2, .05), field('terms', '부분합 항 수 N', 10, 1, 50, 1)], params,
    presets: { 'z=0.5': { re: .5, im: 0, terms: 10 }, 'z=−1': { re: -1, im: 0, terms: 10 }, 'z=2': { re: 2, im: 0, terms: 4 }, 'z=1 pole': { re: 1, im: 0, terms: 10 } },
    render: ({ re, im, terms }, { figure }) => {
      const result = geometricComplexSeries({ re, im }, terms);
      const points = result.points.map(item => ({ re: item.re, im: item.im }));
      const extent = Math.max(1.15, Math.abs(re), Math.abs(im), ...points.map(item => Math.max(Math.abs(item.re), Math.abs(item.im)))) * 1.08;
      const vectors = result.value ? [{ label: 'F=1/(1−z)', ...result.value, color: '#0D766E', dashed: true }] : [];
      figure.innerHTML = `<p>파란 원은 |z|=1 경계, 붉은 경로는 유한 부분합의 순서입니다. 축의 단위 길이는 같습니다.</p>
        ${complexSvg({ vectors, extent, circle: true, path: points, title: `z=${valuePair({ re, im })}; ${terms}개 부분합 항` })}
        ${table('부분합 궤적의 마지막 단계', ['항 수', 'Re(Sₖ)', 'Im(Sₖ)'], result.points.filter((item, i) => i >= Math.max(0, result.points.length - 8) || i === 0).map(item => [String(item.k), fmt(item.re, 7), fmt(item.im, 7)]))}`;
      return `${figures([['z', valuePair({ re, im }, 5)], ['|z|', fmt(result.magnitude, 7)], ['판정', result.convergence], ['항 수 N', terms], ['유한 부분합 Sₙ', valuePair(result.partialSum, 9)], ['유리함수 F', result.pole ? 'z=1에서 극' : valuePair(result.value, 9)]])}
        <p>z=1이면 F는 극이지만 유한합 Sₙ=N으로 계산됩니다. z=−1에서는 부분합 1과 0이 번갈아 움직이며 수렴하지 않습니다. |z|≥1에서는 유한 부분합과 F 값을 구분해서 보세요.</p>`;
    },
  }, params);
}

function mountZetaContinuation(root, params) {
  return createLab(root, {
    fields: [field('s', '실수 s', .5, -2, 3, .01), field('terms', '원래 급수 항 수 N', 100, 10, 10_000, 1)], params,
    presets: { 's=−2': { s: -2 }, 's=−1': { s: -1 }, 's=0': { s: 0 }, 's=0.5': { s: .5 }, 's=1': { s: 1 }, 's=2': { s: 2 } },
    render: ({ s, terms }, { figure }) => {
      const state = zetaContinuationState(s, terms);
      const left = Array.from({ length: 141 }, (_, i) => -2 + 2.94 * i / 140);
      const right = Array.from({ length: 91 }, (_, i) => 1.06 + 1.94 * i / 90);
      const zetaPoints = values => values.map(value => {
        const answer = zetaCandidate(value, 0);
        return answer.status === 'numeric' ? [value, answer.re] : null;
      });
      const partials = [];
      let sum = 0;
      const stride = Math.max(1, Math.ceil(terms / 240));
      for (let n = 1; n <= terms; n += 1) {
        sum += n ** -s;
        if (n % stride === 0 || n === terms) partials.push([n, sum]);
      }
      figure.innerHTML = `<p>위쪽은 수치적으로 연속된 ζ(s) 기준 그래프입니다. s=1을 가로지르지 않도록 선을 분리하고, |s−1|<0.06의 큰 pole 인근은 그래프에서 띄워 보입니다. 아래는 원래 급수의 부분합입니다.</p>
        ${plot({ title: '해석적으로 연속된 ζ(s) · 수치 후보', xLabel: 's', yLabel: 'ζ(s)', series: [{ label: 's<1 구간', points: zetaPoints(left) }, { label: 's>1 구간', points: zetaPoints(right) }], xDomain: [-2, 3], markers: state.zeta === null ? [] : [[s, state.zeta]] })}
        ${plot({ title: `원래 급수의 부분합 · s=${fmt(s, 3)}`, xLabel: '항 수 N', yLabel: 'Σ n⁻ˢ', series: [{ label: '원래 부분합', points: partials }], xDomain: [1, terms] })}`;
      const status = state.status === 'numeric' ? fmt(state.zeta, 12) : state.status === 'pole' ? 's=1의 단순극' : state.status === 'near-pole' ? '수치 근접 pole · 기준값 생략' : state.status;
      return `${figures([['현재 s', fmt(s, 5)], ['Euler–Maclaurin ζ(s)', status], ['원래 급수 Sₙ', fmt(state.rawSum, 12)], ['원래 급수 상태', state.rawConverges ? 's>1에서 수렴' : 's≤1에서 발산'], ['항 수 N', terms]])}
        <p>${state.interpretation}. 기준 계산은 Euler–Maclaurin N=64, m=10의 제한된 Float64 수치 후보입니다. 수치 근접 pole에서 ζ값을 0이나 일반 수치로 표시하지 않습니다.</p>
        <p>실수 기준값: ζ(−2)=0, ζ(−1)=−1/12, ζ(0)=−1/2, ζ(0.5)≈−1.46035451, ζ(2)≈1.64493407. 수치 후보의 검증 범위는 −2≤s≤3입니다.</p>`;
    },
  }, params);
}

const handlers = {
  '04-a': mountComplexPlayground, '04-b': mountEulerWave,
  '05-a': mountDirichlet, '05-b': mountEulerProduct,
  '06-a': mountGeometric, '06-b': mountZetaContinuation,
};

export function mount(root, id, params = new URLSearchParams()) {
  if (!(root instanceof Element)) throw new TypeError('mount(root) expects a DOM element.');
  const handler = handlers[String(id).toLowerCase()];
  if (!handler) throw new RangeError(`Part II has no lab ${id}.`);
  return handler(root, params);
}
