import { zetaCandidate } from '../core/zeta.mjs';
import { PRIME_ZERO_HEIGHTS } from '../core/explicit-formula.mjs';
import { reflectedZeros, zetaColor } from './zeta-models.mjs';
import { buttonRow, choice, createLab, field, figures, format as f, plot, samples, table } from './ui.mjs';

const note = text => `<p class="lab-note">${text}</p>`;
const known = PRIME_ZERO_HEIGHTS.filter(t => t <= 80);
const bounded = (x, a, b) => Math.max(a, Math.min(b, x));
const signed = value => `${value < 0 ? '−' : '+'} ${f(Math.abs(value), 9)}i`;

function zetaExplorer(root, params) {
  let worker;
  let request = 0;
  let key = '';
  let initialized = false;
  const original = [-.25, 1.25, 0, 40];
  let bounds = original;
  let previousView;
  let lastValues;
  const setupMap = () => {
    worker = new Worker(new URL('zeta-worker.mjs', import.meta.url), { type: 'module' });
    worker.addEventListener('message', event => {
      if (event.data.request !== request) return;
      const { width, height, pixels } = event.data;
      const canvas = root.querySelector('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
      canvas.dataset.ready = 'true';
      root.querySelector('[data-map-status]').textContent = '지도를 눌러 점을 고르거나 방향키로 이동하세요.';
    });
    worker.addEventListener('error', () => {
      root.querySelector('[data-map-status]').textContent = '복소평면을 계산할 수 없습니다. 좌표별 제타 값은 아래에서 확인할 수 있습니다.';
    });
  };
  const zoomTo = (re, im) => {
    const centerRe = bounded(re, -1.25, 2.25);
    const centerIm = bounded(im, -70, 70);
    return [centerRe - .75, centerRe + .75, centerIm - 10, centerIm + 10].map(value => Number(value.toFixed(7)));
  };
  function draw(re, im) {
    const [a, b, c, d] = bounds;
    const canvas = root.querySelector('canvas');
    const marker = root.querySelector('[data-map-point]');
    const ruler = root.querySelector('[data-map-line]');
    marker.hidden = re < a || re > b || im < c || im > d;
    marker.style.left = `${(re - a) / (b - a) * 100}%`;
    marker.style.top = `${(d - im) / (d - c) * 100}%`;
    ruler.hidden = .5 < a || .5 > b;
    ruler.style.left = `${(.5 - a) / (b - a) * 100}%`;
    root.querySelector('[data-map-axis]').textContent = `가로 실수부 ${f(a, 3)}–${f(b, 3)} · 세로 허수부 ${f(c, 3)}–${f(d, 3)}`;
    if (key === bounds.join(',')) return;
    key = bounds.join(',');
    delete canvas.dataset.ready;
    root.querySelector('[data-map-status]').textContent = worker ? '지도 계산 중…' : '이 브라우저에서는 복소평면 워커를 사용할 수 없습니다. 좌표별 값은 표시됩니다.';
    worker?.postMessage({ request: ++request, bounds });
  }

  const api = createLab(root, {
    fields: [field('re', '실수부 σ', .5, -2, 3, 'any'), field('im', '허수부 t', 14, -80, 80, 'any'),
      choice('view', '복소평면 범위', 'strip', [['strip', '임계 띠 · 0≤t≤40'], ['full', '전체 계산 범위'], ['zoom', '선택 좌표 부근']])],
    presets: { 's = 1 · 극': { re: 1, im: 0, view: 'strip' }, 's = −2 · 자명한 영점': { re: -2, im: 0, view: 'full' },
      '첫 알려진 영점': { re: .5, im: known[0], view: 'strip' } },
    init() { previousView = undefined; bounds = original; },
    render({ re, im, view }, { figure }) {
      lastValues = { re, im };
      if (!initialized) {
        figure.innerHTML = `<figure class="zeta-map">
          <div class="zeta-plane"><canvas width="96" height="160" tabindex="0" aria-label="제타 함수 영역 색칠 지도. 방향키로 입력점을 이동합니다."></canvas>
          <span data-map-line class="zeta-line" aria-hidden="true"></span><span data-map-point class="zeta-point" aria-hidden="true"></span></div>
          <figcaption><strong>복소평면에서 계산한 ζ(s)</strong><p data-map-axis></p><p data-map-status role="status"></p>
          <p>가로는 σ, 위쪽은 큰 t입니다. 점선은 임계선 σ=½입니다. 색상은 출력의 편각, 밝기는 출력 크기입니다. 극이 들어 있는 표본 칸은 어두운 회색으로 표시합니다.</p>
          <ul class="zeta-key" aria-label="편각의 색상 예">${[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => {
            const color = zetaColor({ status: 'numeric', re: Math.cos(angle), im: Math.sin(angle) });
            return `<li><i style="background:rgb(${color.join(' ')})"></i>${['0', 'π/2', 'π', '−π/2'][i]}</li>`;
          }).join('')}</ul></figcaption></figure>
          ${buttonRow([['recenter', '현재 점을 중심으로 확대']], '지도 확대')}`;
        if (typeof Worker !== 'undefined') setupMap();
        initialized = true;
      }
      if (view !== previousView) {
        bounds = view === 'strip' ? original : view === 'full' ? [-2, 3, -80, 80] : zoomTo(re, im);
        previousView = view;
      }
      draw(re, im);
      const result = zetaCandidate(re, im);
      const domain = note('수치 평가 범위 −2≤σ≤3, |t|≤80. 이 범위에서 404개 기준 표본은 스케일 오차 10⁻⁸ 이하였으며 표본 검증은 전 범위의 엄밀한 오차 보증과 구별합니다.');
      if (result.status === 'pole') return figures([['ζ(1)', '단순극']]) + domain;
      if (result.status === 'near-pole') return figures([['계산 상태', '극과의 거리가 10⁻⁶ 미만']]) + note('정확한 ζ 값 대신 극 근처로 표시합니다.') + domain;
      if (result.status !== 'numeric') return figures([['계산 상태', '지원 범위 밖']]) + domain;
      const magnitude = Math.hypot(result.re, result.im);
      const exactTrivial = re === -2 && im === 0;
      const argument = exactTrivial || magnitude === 0 ? '정의되지 않음' : `${f(Math.atan2(result.im, result.re), 6)} rad`;
      const color = zetaColor(result);
      const outputLimit = Math.max(1, Math.abs(result.re), Math.abs(result.im)) * 1.15;
      const outputX = 70 + 57 * result.re / outputLimit;
      const outputY = 70 - 57 * result.im / outputLimit;
      return `<div class="zeta-result">
        <svg viewBox="0 0 140 140" role="img" aria-label="출력 복소평면, 좌표 ${f(result.re, 9)} ${signed(result.im)}">
          <path d="M8 70H132M70 8V132" fill="none" stroke="var(--muted)"/>
          <text x="108" y="84">실수부</text><text x="75" y="14">허수부</text>
          <circle cx="${outputX}" cy="${outputY}" r="5" fill="rgb(${color.join(' ')})" stroke="var(--ink)" stroke-width="1.5"/>
        </svg>${figures([
        ['입력 s', `${f(re, 9)} ${signed(im)}`], ['출력 ζ(s)', `${f(result.re, 9)} ${signed(result.im)}`],
        ['크기 |ζ(s)|', f(magnitude, 9)], ['편각', argument],
      ])}</div>` +
        note(exactTrivial ? 's=−2는 정확히 알려진 자명한 영점입니다. 숫자로 표시한 ζ에는 반올림 오차가 남을 수 있습니다.'
          : magnitude < 1e-5 ? '수치적으로 0에 가까운 값입니다. 수치 평가만으로 영점의 정확한 좌표를 증명할 수는 없습니다.'
            : '지도의 한 칸은 그 중심에서 계산한 값입니다. 위의 숫자는 고른 입력점에서 직접 계산한 값입니다.') + domain;
    },
  }, params);

  root.querySelector('[data-action="recenter"]').addEventListener('click', () => {
    bounds = zoomTo(lastValues.re, lastValues.im);
    previousView = 'zoom';
    api.set({ view: 'zoom' });
  });
  const canvas = root.querySelector('canvas');
  canvas.addEventListener('pointerdown', event => {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    const [a, b, c, d] = bounds;
    api.set({ re: f(bounded(a + (b - a) * (event.clientX - left) / width, a, b), 5).replaceAll(',', ''),
      im: f(bounded(d - (d - c) * (event.clientY - top) / height, c, d), 5).replaceAll(',', '') });
  });
  canvas.addEventListener('keydown', event => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const [a, b, c, d] = bounds;
    api.set({
      re: bounded(lastValues.re + direction[0] * (b - a) / 48, a, b),
      im: bounded(lastValues.im + direction[1] * (d - c) / 80, c, d),
    });
  });
  return api;
}

function zeroHunter(root, params) {
  let fixedSeries;
  let zoomSeries;
  let center;
  const calculate = (start, end, size) => samples(start, end, size, t => zetaCandidate(.5, t))
    .map(([t, z]) => ({ t, modulus: Math.hypot(z.re, z.im), real: z.re, imaginary: z.im }));
  const api = createLab(root, {
    fields: [field('t', '허수부 t', 14, 0, 80, 'any'), field('slider', '0부터 80까지 탐색', 14, 0, 80, .01, 'range'),
      choice('show', '그래프 성분', 'modulus', [['modulus', '|ζ| 크기'], ['real', '실수부'], ['imaginary', '허수부']]),
      choice('zoom', '범위', 'full', [['full', '0–80 전체'], ['near', '선택점 주변 ±0.2']])],
    presets: { '첫 영점': { t: known[0], slider: known[0], zoom: 'near' },
      '둘째 영점': { t: known[1], slider: known[1], zoom: 'near' }, '셋째 영점': { t: known[2], slider: known[2], zoom: 'near' },
      't = 14': { t: 14, slider: 14 }, 't = 50': { t: 50, slider: 50 } },
    aside: `<details><summary>처음 60개 참조 높이</summary>${table('mpmath 1.3.0, zetazero(k) · 초기 비자명 영점', ['순서', 'γ', '이 실험의 범위'],
      PRIME_ZERO_HEIGHTS.map((t, i) => [i + 1, f(t, 11), t <= 80 ? '직접 평가 가능' : '참조 전용']))}</details>`,
    render({ t, show, zoom }, { figure }) {
      let data;
      if (zoom === 'near') {
        if (center !== t) zoomSeries = calculate(Math.max(0, t - .2), Math.min(80, t + .2), 101);
        center = t;
        data = zoomSeries;
      } else {
        fixedSeries ??= calculate(0, 80, 681);
        data = fixedSeries;
      }
      const point = zetaCandidate(.5, t);
      const get = { modulus: Math.hypot(point.re, point.im), real: point.re, imaginary: point.im };
      const label = { modulus: '|ζ(½+it)|', real: 'Re ζ(½+it)', imaginary: 'Im ζ(½+it)' }[show];
      const nearest = known.reduce((a, b) => Math.abs(t - b) < Math.abs(t - a) ? b : a);
      const nearPoints = known.filter(at => at >= data[0].t && at <= data.at(-1).t);
      const markerLine = nearPoints.flatMap(at => {
        const z = zetaCandidate(.5, at);
        return [[at, show === 'modulus' ? Math.hypot(z.re, z.im) : show === 'real' ? z.re : z.im]];
      });
      figure.innerHTML = plot({ title: '임계선 위의 제타 함수', xLabel: '허수부 t', yLabel: label, series: [{ label, points: data.map(row => [row.t, row[show]]) }],
        markers: [[t, get[show]], ...markerLine] });
      return figures([['현재 t', f(t, 11)], ['크기 |ζ|', f(get.modulus, 9)], ['실수부', f(get.real, 9)], ['허수부', f(get.imaginary, 9)],
        ['가장 가까운 참조 γ', f(nearest, 11)]]) + note('그래프의 원은 현재 점과 창 안의 알려진 높이입니다. 낮은 국소 최솟값은 수치 후보입니다. 임계선 하나의 유한 탐색은 임계 띠 전체 영점을 세지 않습니다.');
    },
  }, params);
  api.controls.slider.addEventListener('input', event => api.set({ t: event.target.valueAsNumber }));
  api.controls.t.addEventListener('input', event => {
    if (event.target.validity.valid) api.set({ slider: event.target.valueAsNumber }, false);
  });
  if (params.has('07-b-t') && api.controls.t.validity.valid) api.set({ slider: api.controls.t.valueAsNumber }, false);
  return api;
}

function symmetry(root, params) {
  return createLab(root, {
    fields: [field('beta', '실수부 β', .3, .05, .95, .01, 'range'), field('gamma', '높이 γ', 14, 5, 80, .01, 'range'),
      choice('mode', '표시할 점', 'model', [['model', '가상의 대칭점'], ['data', '실제 알려진 영점']])],
    presets: { 'β = 0.3': { beta: .3, mode: 'model' }, 'β = ½': { beta: .5, mode: 'model' }, '실제 초기 영점': { mode: 'data' } },
    render({ beta, gamma, mode }, { figure, controls }) {
      const model = mode === 'model';
      controls.beta.disabled = controls.gamma.disabled = !model;
      const points = model ? reflectedZeros(beta, gamma) : known.slice(0, 6).flatMap(t => [[.5, t], [.5, -t]]);
      const limit = (model ? gamma : known[5]) * 1.08;
      figure.innerHTML = plot({ title: model ? '한 가상 영점이 정하는 대칭점' : '실제 영점의 켤레 대칭 · 참조 데이터',
        xLabel: '실수부 σ', yLabel: '허수부 t',
        series: [{ label: '실수축 t=0', points: [[0, 0], [1, 0]] }, { label: '임계선 σ=½', points: [[.5, -limit], [.5, limit]] }],
        xDomain: [0, 1], yDomain: [-limit, limit], markers: points });
      return table(model ? '가정에서 얻은 좌표' : 'mpmath zetazero(k) 높이 · 처음 여섯 쌍', ['순서', '실수부', '허수부'],
        points.map(([re, im], i) => [i + 1, f(re), f(im, 9)])) + note(model
        ? '켤레 대칭은 t의 부호를, 임계선 대칭은 β를 1−β로 바꿉니다. β=½에서 좌우 반사는 같은 점입니다. 가상 좌표를 제타 함수에 대입한 결과가 아닙니다.'
        : '실제 참조 데이터의 실수부는 모두 ½입니다. 표시한 초기 여섯 쌍은 임계 띠 전체를 대표하는 증명이 아닙니다.');
    },
  }, params);
}

const mountLab = { '07-a': zetaExplorer, '07-b': zeroHunter, '07-c': symmetry };
export const mount = (root, id, params) => mountLab[id](root, params);
