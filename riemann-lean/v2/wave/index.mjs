import {
  PRIME_ZERO_HEIGHTS, explicitFormula, explicitFormulaBase, explicitFormulaMetrics,
  psi, psi0, primePowerEvents, waveContribution
} from '../core/index.mjs';

const PRESETS = [0, 1, 3, 15, 30, 60];
const DEFAULTS = { n: 15, x: 5.5, start: 2, end: 100, truth: 'midpoint', panel: 'overview', guide: 0, selected: 0 };
const fmt = (value, digits = 5) => Number.isFinite(value) ? new Intl.NumberFormat('ko-KR', { maximumFractionDigits: digits }).format(value) : '—';
const escapeText = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function makePlot({ series, start, end, width = 760, height = 260, zero = false, cursor = null, labels = [] }) {
  const margin = width < 480
    ? { left: 52, right: 10, top: 20, bottom: 48 }
    : { left: 66, right: 18, top: 20, bottom: 48 };
  const values = series.flatMap(line => line.points.map(point => point.y)).filter(Number.isFinite);
  if (zero) values.push(0);
  let min = Math.min(...values), max = Math.max(...values);
  const pad = Math.max((max - min) * 0.1, 0.25); min -= pad; max += pad;
  const x = value => margin.left + (value - start) / (end - start || 1) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - min) / (max - min || 1) * (height - margin.top - margin.bottom);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const grid = ticks.map(t => {
    const v = min + (max - min) * t;
    return `<g><line class="w08-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y(v)}" y2="${y(v)}"/><text class="w08-tick" x="${margin.left - 7}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 2)}</text></g>`;
  }).join('');
  const xTicks = ticks.map(t => {
    const value = start + (end - start) * t;
    return `<g><line class="w08-x-tick" x1="${x(value)}" x2="${x(value)}" y1="${height-margin.bottom}" y2="${height-margin.bottom+4}"/><text class="w08-tick" x="${x(value)}" y="${height-margin.bottom+17}" text-anchor="${t === 1 ? 'end' : 'middle'}">${fmt(value,2)}</text></g>`;
  }).join('');
  const paths = series.map(line => {
    const d = line.points.map((point, index) => `${index ? 'L' : 'M'}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`).join(' ');
    return `<path class="w08-series ${line.className}" d="${d}" aria-label="${escapeText(line.label)}"/>`;
  }).join('');
  const jumpDots = labels.map(point => `<circle class="w08-jump-dot" cx="${x(point.x)}" cy="${y(point.y)}" r="3.1"><title>${escapeText(point.label)}</title></circle>`).join('');
  const cross = cursor == null ? '' : `<g class="w08-cursor"><line x1="${x(cursor)}" x2="${x(cursor)}" y1="${margin.top}" y2="${height-margin.bottom}"/><text x="${Math.min(width-80, x(cursor)+6)}" y="${margin.top+12}">x=${fmt(cursor,2)}</text></g>`;
  return `<svg class="w08-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(series.map(line=>line.label).join(', '))}"><title>${escapeText(series.map(line=>line.label).join(' · '))}</title>${grid}<line class="w08-axis" x1="${margin.left}" x2="${width-margin.right}" y1="${height-margin.bottom}" y2="${height-margin.bottom}"/><line class="w08-axis" x1="${margin.left}" x2="${margin.left}" y1="${margin.top}" y2="${height-margin.bottom}"/>${zero ? `<line class="w08-zero" x1="${margin.left}" x2="${width-margin.right}" y1="${y(0)}" y2="${y(0)}"/>` : ''}${grid ? xTicks : ''}${paths}${jumpDots}${cross}<text class="w08-axis-label" x="${margin.left}" y="13">함숫값</text><text class="w08-axis-label" x="${width/2}" y="${height-4}" text-anchor="middle">x (실수 · 선형 축)</text></svg>`;
}

function pathPoints(fn, start, end) {
  // Uniform in u=ln(x): at least sixteen samples per highest supplied cycle.
  const count = Math.max(2, Math.ceil(Math.log(end / start) * PRIME_ZERO_HEIGHTS.at(-1) * 16 / (2 * Math.PI)) + 1);
  const capped = Math.min(count, 12000);
  return Array.from({ length: capped }, (_, i) => {
    const x = i === capped - 1 ? end : start * (end / start) ** (i / (capped - 1));
    return { x, y: fn(x) };
  });
}

function stepPoints(start, end) {
  const events = primePowerEvents(1000).filter(event => event.n >= start && event.n <= end);
  const points = [{ x: start, y: psi(start - 1e-8) }];
  for (const event of events) points.push({ x: event.n, y: psi(event.n - 1e-8) }, { x: event.n, y: psi(event.n) });
  points.push({ x: end, y: psi(end) });
  return points;
}

export function mount(root, id = '09-a', params = new URLSearchParams()) {
  if (!(root instanceof Element)) throw new TypeError('mount(root) expects a DOM element');
  let state = { ...DEFAULTS };
  let warning = '';
  for (const [name, min, max, whole] of [['start', 2, 999, true], ['end', 3, 1000, true], ['n', 0, 60, true], ['x', 2, 1000, false]]) {
    const raw = params.get(`${id}-${name}`);
    const number = Number(raw);
    if (raw === null) continue;
    if (raw.trim() && Number.isFinite(number) && number >= min && number <= max && (!whole || Number.isInteger(number))) state[name] = number;
    else warning = '링크에 허용 범위를 벗어난 값이 있어 기본값을 사용합니다.';
  }
  if (state.end <= state.start) {
    state.start = DEFAULTS.start;
    state.end = DEFAULTS.end;
    warning = '구간의 시작은 끝보다 작아야 합니다. 기본 구간을 사용합니다.';
  }
  if (params.get(`${id}-truth`) === 'right') state.truth = 'right';
  state.x = clamp(state.x, state.start, state.end);
  let geometry;
  let geometryKey;
  root.classList.add('w08-wave-lab');

  function render() {
    const focused = root.contains(document.activeElement) ? document.activeElement : null;
    const focusSelector = focused?.dataset.control != null ? `[data-control="${focused.dataset.control}"]`
      : focused?.dataset.panel != null ? `[data-panel="${focused.dataset.panel}"]`
      : focused?.dataset.nPreset != null ? `[data-n-preset="${focused.dataset.nPreset}"]`
      : focused?.dataset.window != null ? `[data-window="${focused.dataset.window}"]`
      : focused?.classList.contains('w08-next') ? '.w08-next'
      : focused?.classList.contains('w08-reset') ? '.w08-reset' : '';
    const tableOpen = root.querySelector('.w08-table')?.open;
    const n = state.n;
    const x = state.x;
    const left = state.start;
    const right = state.end;
    const target = state.truth === 'right' ? psi : psi0;
    const selectedIndex = n > 0 ? Math.min(state.selected, n - 1) : -1;
    const actual = target(x);
    const approx = explicitFormula(x, n);
    const base = explicitFormulaBase(x);
    const contribution = selectedIndex >= 0 ? waveContribution(x, selectedIndex) : null;
    const gamma = selectedIndex >= 0 ? PRIME_ZERO_HEIGHTS[selectedIndex] : null;
    const chartWidth = Math.max(320, root.clientWidth);
    const amplitude = gamma == null ? null : 2 * Math.sqrt(x) / Math.hypot(0.5, gamma);
    const period = gamma == null ? null : 2 * Math.PI / gamma;
    const phase = gamma == null ? null : Math.atan2(gamma, 0.5);
    const key = `${n}:${left}:${right}`;
    if (geometryKey !== key) {
      const jumps = primePowerEvents(1000).filter(event => event.n >= left && event.n <= right);
      const truthPoints = stepPoints(left, right);
      const formulaPoints = pathPoints(value => explicitFormula(value, n), left, right);
      const basePoints = formulaPoints.map(({ x }) => ({ x, y: explicitFormulaBase(x) }));
      const powerPoints = jumps.flatMap(event => {
        const approximation = explicitFormula(event.n, n);
        return [{ x: event.n, y: approximation - event.prefix + event.jump }, { x: event.n, y: approximation - event.prefix }];
      });
      const jumpPositions = new Set(jumps.map(event => event.n));
      const errorPoints = formulaPoints.filter(({ x }) => !jumpPositions.has(x)).map(({ x, y }) => ({ x, y: y - psi0(x) }))
        .concat(powerPoints).sort((a, b) => a.x - b.x);
      geometry = {
        metrics: explicitFormulaMetrics(n, { start: left, end: right, step: 0.25 }),
        jumps, truthPoints, formulaPoints, basePoints, errorPoints,
      };
      geometryKey = key;
    }
    const { metrics, jumps, truthPoints, basePoints, formulaPoints, errorPoints } = geometry;
    const residualTarget = truthPoints.map(({ x, y }) => ({ x, y: y - x }));
    const residualApprox = formulaPoints.map(({ x, y }) => ({ x, y: y - x }));
    const wavePoints = state.panel === 'wave' && selectedIndex >= 0
      ? formulaPoints.map(({ x }) => ({ x, y: waveContribution(x, selectedIndex) }))
      : [{ x: left, y: 0 }, { x: right, y: 0 }];
    const combinedPoints = formulaPoints.map(({ x, y }, index) => ({ x, y: y - basePoints[index].y }));
    const contributions = Array.from({ length: n }, (_, index) => ({ index, gamma: PRIME_ZERO_HEIGHTS[index], value: waveContribution(x, index) }));
    const guideText = [
      '먼저 N=0을 고르세요. 영점 파동 없이 주항과 두 보정항만 봅니다. x=5.5의 실제 높이와 밑그림의 차이를 예상해 보세요.',
      'N=1: 첫 파동을 켰습니다. 아래에서 γ와 로그축 주기를 확인하고 x=10과 100에서 진폭을 비교하세요.',
      'N=3: 각 파동의 부호 있는 기여을 읽으세요. 더해지는 항과 상쇄되는 항이 함께 있습니다.',
      'N=60: 5, 8의 점프를 중간값 규약과 오른쪽 연속 규약으로 비교하고, 창을 확대해 링잉을 살펴보세요.',
      '완료: 구간과 N을 바꾸어 같은 균일 x 눈금에서 RMSE와 최대 오차를 비교하세요. 절단 수가 커져도 모든 지점에서 오차가 줄지는 않습니다.'
    ];
    const series = [
      { label: state.truth === 'right' ? '실제 ψ(x), 오른쪽 연속 계단' : '실제 ψ₀(x), 점프에서 중간값', className: 'is-truth', points: truthPoints },
      { label: '주항 x', className: 'is-reference', points: [{ x: left, y: left }, { x: right, y: right }] },
      { label: '밑그림 B(x)', className: 'is-base', points: basePoints },
      { label: `유한 근사 F${n}(x)`, className: 'is-approx', points: formulaPoints }
    ];
    const residualSeries = [
      { label: '실제 ψ(x)−x', className: 'is-truth', points: residualTarget },
      { label: `근사 F${n}(x)−x`, className: 'is-approx', points: residualApprox }
    ];
    const waveSeries = [
      { label: '포함된 모든 파동의 합', className: 'is-approx', points: combinedPoints },
      { label: '선택한 파동의 기여', className: 'is-base', points: wavePoints },
    ];
    const chartTitles = {
      overview: '실제 계단과 유한 파동 근사', residual: '주항을 뺀 실제 및 근사 잔차',
      error: 'ψ₀ 기준의 근사 오차', wave: '선택한 파동과 합성 파동',
    };
    const chartSeries = {
      overview: series, residual: residualSeries, wave: waveSeries,
      error: [{ label: `F${n}(x)−ψ₀(x), 근사 오차`, className: 'is-error', points: errorPoints }],
    };
    const labels = jumps.flatMap(event => {
      if (state.panel === 'wave' || (state.panel !== 'error' && state.truth === 'right')) return [];
      const midpoint = event.prefix - event.jump / 2;
      const y = state.panel === 'error' ? explicitFormula(event.n, n) - midpoint
        : state.panel === 'residual' ? midpoint - event.n : midpoint;
      return [{ x: event.n, y, label: `x=${event.n} 점프 중간값` }];
    });
    const selectedPanel = makePlot({ series: chartSeries[state.panel], start: left, end: right, width: chartWidth, zero: state.panel !== 'overview', cursor: x, labels });
    const legend = chartSeries[state.panel].map(line => `<span class="legend-${line.className.slice(3)}">${line.label}</span>`).join('');
    const tableRows = [...new Set([left, x, 2, 4, 5, 5.5, 8, 10, 20, 50, 100, right])]
      .filter(value => value >= left && value <= right).sort((a, b) => a - b)
      .map(value => `<tr><th scope="row">${fmt(value, 8)}</th><td>${fmt(psi0(value), 8)}</td><td>${fmt(explicitFormula(value, n), 8)}</td><td>${fmt(explicitFormula(value, n) - psi0(value), 8)}</td></tr>`).join('');
    const peak = Math.max(1e-12, ...contributions.map(item => Math.abs(item.value)));
    const spectrum = contributions.map(item => `<li class="w08-spectrum-item ${item.value >= 0 ? 'positive' : 'negative'}">
      <span>γ${item.index+1}=${fmt(item.gamma,6)}</span>
      <span class="w08-bar" aria-hidden="true"><i style="width:${Math.abs(item.value) / peak * 50}%"></i></span>
      <b>${item.value >= 0 ? '+' : '−'}${fmt(Math.abs(item.value),6)}</b>
    </li>`).join('');
    root.innerHTML = `
      <section class="w08-lab-intro" aria-labelledby="w08-lab-title">
        <p id="w08-lab-title">먼저 예상해 보세요. 영점 파동을 더할수록 소수 거듭제곱 계단에 가까워질까요?</p>
        <p class="w08-lab-limit">β=1/2 고정 · 출처가 표시된 처음 60개 높이를 사용한 유한 절단입니다. 이 계산은 RH 증명이 아닙니다.</p>
      </section>
      <div class="w08-controls" aria-label="파동 실험 조작">
        <label>포함한 영점 쌍 N<select data-control="n">${Array.from({length:61},(_,v)=>`<option value="${v}" ${n===v?'selected':''}>${v}</option>`).join('')}</select></label>
        <button type="button" class="w08-reset">초기화</button>
      </div>
      <div class="w08-presets" aria-label="영점 쌍 수 프리셋">${PRESETS.map(v=>`<button type="button" data-n-preset="${v}" aria-pressed="${n===v}">N=${v}</button>`).join('')}</div>
      <nav class="w08-panel-tabs" aria-label="그래프 보기">
        <button type="button" data-panel="overview" aria-pressed="${state.panel==='overview'}">계단과 근사</button><button type="button" data-panel="residual" aria-pressed="${state.panel==='residual'}">잔차 ψ−x</button><button type="button" data-panel="error" aria-pressed="${state.panel==='error'}">근사 오차</button><button type="button" data-panel="wave" aria-pressed="${state.panel==='wave'}">파동 분리</button>
      </nav>
      <section class="w08-plot-card" aria-label="실제 계산 그래프">
        <div class="w08-chart-head"><h3>${chartTitles[state.panel]}</h3><div class="w08-legend">${legend}</div></div>
        ${selectedPanel}
        <label class="w08-xstep">그래프에서 읽을 x <input data-control="x-slider" type="range" min="${left}" max="${right}" step="0.25" value="${x}" aria-label="평가할 x 위치"></label>
        <p class="w08-chart-note">수평축은 선형 x, 수직축 범위는 현재 데이터에 맞춰 계산했습니다. 표시된 점은 ψ₀가 적용되는 실제 점프의 대표값입니다.</p>
      </section>
      <div class="w08-secondary-controls" aria-label="평가 위치와 확대 구간">
        <label>평가 x<input data-control="x" type="number" min="${left}" max="${right}" step="any" value="${x}" inputmode="decimal"></label>
        <label>구간 시작<input data-control="start" type="number" min="2" max="999" step="1" value="${left}" inputmode="numeric"></label>
        <label>구간 끝<input data-control="end" type="number" min="3" max="1000" step="1" value="${right}" inputmode="numeric"></label>
        <label>점프 규약<select data-control="truth"><option value="midpoint" ${state.truth==='midpoint'?'selected':''}>ψ₀ · 중간값</option><option value="right" ${state.truth==='right'?'selected':''}>ψ · 오른쪽 연속</option></select></label>
      </div>
      <div class="w08-window" aria-label="그래프 구간 이동">
        <button type="button" data-window="left">← 왼쪽</button><button type="button" data-window="zoom">선택점 확대</button>
        <button type="button" data-window="right">오른쪽 →</button><button type="button" data-window="home">기본 구간</button></div>
      <p class="w08-warning" role="status"${warning ? '' : ' hidden'}>${warning}</p>
      <div class="w08-readouts" aria-live="polite">
        <article><span>실제 ${state.truth==='right'?'ψ(x)':'ψ₀(x)'}</span><b>${fmt(actual,8)}</b><small>${state.truth==='midpoint' && jumps.some(item=>item.n===x) ? '정수 점프에서 좌우 높이의 중간값' : state.truth==='right' ? '오른쪽 연속 규약' : '점프가 아닌 곳에서는 ψ와 동일'}</small></article>
        <article><span>유한 근사 F${n}(x)</span><b>${fmt(approx,8)}</b><small>B(x)=${fmt(base,8)}, 합성 파동 ${fmt(approx-base,8)}</small></article>
        <article><span>근사 − ψ₀</span><b>${fmt(approx-psi0(x),8)}</b><small>부호를 보존한 지점별 오차</small></article>
      </div>
      <p class="w08-note">밑그림 B(x)는 주항 x=${fmt(x)}에 상수 보정 ${fmt(-Math.log(2 * Math.PI), 8)}와 자명한 영점 보정 +${fmt(-.5 * Math.log1p(-(x ** -2)), 8)}을 더한 값입니다.</p>
      <div class="w08-detail-grid">
        <section class="w08-detail-card"><h3>선택한 파동 쌍</h3><label>영점 높이 선택<select data-control="selected" ${n===0?'disabled':''}>${Array.from({length:n},(_,i)=>`<option value="${i}" ${i===selectedIndex?'selected':''}>γ${i+1} = ${fmt(PRIME_ZERO_HEIGHTS[i],6)}</option>`).join('')}${n===0?'<option>선택 가능한 파동 없음</option>':''}</select></label>
          ${selectedIndex<0?'<p>먼저 N을 1 이상으로 올리면 포함된 영점 쌍의 정보를 볼 수 있습니다.</p>':`<dl><dt>높이 γ</dt><dd>${fmt(gamma,12)}</dd><dt>현재 진폭 A(x)</dt><dd>${fmt(amplitude,8)}</dd><dt>로그축 주기 2π/γ</dt><dd>${fmt(period,8)} · u=ln x</dd><dt>위상 φ=atan2(γ, 1/2)</dt><dd>${fmt(phase,8)} rad</dd><dt>x=${fmt(x,3)}에서 부호 있는 기여</dt><dd class="${contribution>=0?'is-positive':'is-negative'}">${contribution>=0?'+':''}${fmt(contribution,10)}</dd></dl>`}
          <p class="w08-note">양수/음수 부호가 실제 합에서 더해짐·상쇄됨을 뜻합니다. 진폭은 절댓값, 순간 기여에는 부호가 있습니다.</p>
        </section>
        <section class="w08-detail-card"><h3>현재 x의 기여 스펙트럼</h3><p>선택한 첫 ${n}개 켤레쌍의 기여를 크기와 부호로 표시합니다.</p>${n===0?'<p>영점 쌍이 포함되지 않았습니다.</p>':`<ol class="w08-spectrum">${spectrum}</ol>`}</section>
      </div>
      <section class="w08-metrics" aria-label="구간 오차 지표"><h3>같은 균일 x 눈금에서 구간 비교</h3><p>${metrics.start}부터 ${fmt(metrics.end,2)}까지 0.25 간격 · ψ₀를 기준으로 ${metrics.sampleCount}개 표본</p><div><article><span>RMSE</span><b>${fmt(metrics.rmse,8)}</b></article><article><span>최대 절대 오차</span><b>${fmt(metrics.maxAbsolute,8)}</b></article></div></section>
      <div class="w08-guide"><div><span class="w08-eyebrow">단계별 탐구 · ${state.guide+1}/5</span><p>${guideText[state.guide]}</p></div><button type="button" class="w08-next">${state.guide===4?'처음부터':'다음 관찰'}</button></div>
      <details class="w08-table"${tableOpen ? ' open' : ''}><summary>표로 그래프 값 확인하기</summary><div class="w08-table-scroll"><table><caption>고정된 x 표본에서 ψ₀, Fₙ 및 부호 있는 오차</caption><thead><tr><th scope="col">x</th><th scope="col">ψ₀(x)</th><th scope="col">Fₙ(x)</th><th scope="col">Fₙ−ψ₀</th></tr></thead><tbody>${tableRows}</tbody></table></div></details>
      <aside class="w08-interpretation"><h3>관찰을 해석해 봅시다</h3><ul><li>ψ는 x와 비슷한 크기지만 소수 거듭제곱에서만 점프합니다. θ의 소수 점프와 달리 ψ는 모든 pᵏ를 포함합니다.</li><li>각 켤레 영점 쌍은 실수 기여 Wⱼ(x)=−2x<sup>1/2</sup>[(1/2)cos(γⱼ ln x)+γⱼ sin(γⱼ ln x)]/[(1/2)²+γⱼ²]를 만듭니다.</li><li>영점 수가 늘어도 유한 절단이 모든 점에서 더 가까워지지는 않습니다. 링잉과 절단 오차를 함께 보세요.</li><li>명시적 공식은 모든 비자명 영점의 기여를 더해 ψ₀를 표현합니다. RH는 그 영점의 실수부가 1/2이라는 정리입니다. 이 계산은 그 무한 명제를 검증하지 않습니다.</li></ul></aside>
      <p class="w08-source">영점 높이: mpmath 1.3.0 zetazero(k), 45 decimal digits; 60개 양의 높이의 소수 17자리 근사. 높이 자료의 수치 출처는 실제 영점의 완전성 또는 RH 증명을 뜻하지 않습니다.</p>`;
    bind();
    if (focusSelector) root.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function update(key, value) {
    warning = '';
    if (key === 'n') {
      state.n = Number(value);
      state.selected = Math.min(state.selected, Math.max(0, state.n - 1));
    } else if (key === 'selected') state.selected = Number(value);
    else if (key === 'truth' || key === 'panel') state[key] = value;
    else {
      const field = key === 'x-slider' ? 'x' : key;
      const limits = field === 'x' ? [state.start, state.end] : field === 'start' ? [2, state.end - 1] : [state.start + 1, 1000];
      const number = Number(value);
      if (!value.trim() || !Number.isFinite(number) || number < limits[0] || number > limits[1] || (field !== 'x' && !Number.isInteger(number))) {
        warning = `${limits[0]}부터 ${limits[1]}까지 허용됩니다. 마지막 유효값을 복원했습니다.`;
      } else state[field] = number;
      state.x = clamp(state.x, state.start, state.end);
    }
    render();
  }

  function changeWindow(action) {
    warning = '';
    if (action === 'home') {
      state.start = DEFAULTS.start;
      state.end = DEFAULTS.end;
    } else {
      const span = state.end - state.start;
      const width = action === 'zoom' ? Math.max(1, Math.ceil(span / 2)) : span;
      const offset = Math.max(1, Math.floor(span / 4));
      const start = action === 'zoom' ? Math.floor(state.x - width / 2) : state.start + (action === 'left' ? -offset : offset);
      state.start = clamp(start, 2, 1000 - width);
      state.end = state.start + width;
    }
    state.x = clamp(state.x, state.start, state.end);
    render();
  }

  function bind() {
    root.querySelectorAll('[data-control]').forEach(control =>
      control.addEventListener('change', event => update(event.currentTarget.dataset.control, event.currentTarget.value)));
    root.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => update('panel', button.dataset.panel)));
    root.querySelectorAll('[data-n-preset]').forEach(button => button.addEventListener('click', () => update('n', button.dataset.nPreset)));
    root.querySelectorAll('[data-window]').forEach(button => button.addEventListener('click', () => changeWindow(button.dataset.window)));
    root.querySelector('.w08-reset').addEventListener('click', reset);
    root.querySelector('.w08-next').addEventListener('click', () => {
      warning = '';
      state.guide = (state.guide + 1) % 5;
      const presets = [
        { n: 0, x: 5.5, start: 2, end: 100, panel: 'overview' },
        { n: 1, x: 10, start: 2, end: 100, panel: 'wave' },
        { n: 3, x: 10, start: 2, end: 40, panel: 'wave' },
        { n: 60, x: 5.5, start: 4, end: 10, panel: 'overview' },
        { n: 15, x: 100, start: 2, end: 100, panel: 'error' },
      ];
      Object.assign(state, presets[state.guide], { selected: 0 });
      render();
    });
  }

  function reset() { state = { ...DEFAULTS }; warning = ''; render(); }
  render();
  return { reset, resize: render };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
