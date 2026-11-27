import { createLab, field, choice, toggle, format, html, figures, table, plot } from './ui.mjs';
import { factorize } from '../core/primes.mjs';
import {
  buildUlamGrid, createFactorTree, createSieveState, factorTreeSummary,
  inspectPrimeGaps, inspectPrimeRange, inspectUlamDiagonal, primeCountingAt,
  primeCountingCurve, primeCountingError, sieveBack, sieveStep, sieveSummary,
  splitFactorLeaf,
} from './prime-models.mjs';

const fmt = (value, digits = 6) => format(value, digits);
const cellKey = (x, y) => `${x},${y}`;

function mountFactorTree(root, params) {
  const makeTrees = n => {
    let a = createFactorTree(n);
    let b = createFactorTree(n);
    if (n === 3600) {
      a = splitFactorLeaf(a, 'r', 2);
      b = splitFactorLeaf(b, 'r', 3);
    }
    return { a, b };
  };
  let trees = makeTrees(3600);
  let chosenPaths = { a: 'rR', b: 'rR' };
  let previousN = 3600;
  let api;
  const fields = [field('n', '분해할 자연수 n', 3600, 2, 1_000_000), choice('tree', '분해 경로 선택', 'a', [['a', '경로 A'], ['b', '경로 B']]), field('divisor', '선택한 합성수의 약수', 2, 2, 999_999)];
  root.addEventListener('click', event => {
    const leafButton = event.target.closest('[data-factor-leaf]');
    if (leafButton) {
      const treeId = leafButton.dataset.factorTree;
      chosenPaths[treeId] = leafButton.dataset.factorLeaf;
      api?.set({ tree: treeId });
      return;
    }
    const divisorButton = event.target.closest('[data-factor-divisor]');
    if (divisorButton) {
      api?.set({ divisor: Number(divisorButton.dataset.factorDivisor) });
      return;
    }
    if (!event.target.closest('[data-factor-split]')) return;
    try {
      const treeId = api.controls.tree.value;
      const tree = trees[treeId];
      const path = chosenPaths[treeId];
      const leaf = tree.leaves.find(item => item.path === path);
      if (!leaf) throw new RangeError('Choose an existing composite leaf first.');
      trees[treeId] = splitFactorLeaf(tree, path, api.controls.divisor.valueAsNumber);
      const newPaths = [`${path}L`, `${path}R`];
      chosenPaths[treeId] = newPaths.find(nextPath => {
        const value = trees[treeId].leaves.find(item => item.path === nextPath)?.value;
        return value && factorize(value).length > 1;
      }) ?? newPaths.find(nextPath => trees[treeId].leaves.some(item => item.path === nextPath)) ?? '';
      api.update();
    } catch (error) {
      const message = root.querySelector('.lab-error');
      message.hidden = false;
      message.textContent = error.message;
    }
  });
  api = createLab(root, {
    fields, params,
    init: () => { trees = makeTrees(3600); chosenPaths = { a: 'rR', b: 'rR' }; previousN = 3600; },
    presets: { '12': { n: 12, divisor: 2 }, '84': { n: 84, divisor: 2 }, '3600': { n: 3600, divisor: 2 } },
    render: (values, { figure }) => {
      if (values.n !== previousN) { trees = { a: createFactorTree(values.n), b: createFactorTree(values.n) }; chosenPaths = { a: 'r', b: 'r' }; previousN = values.n; }
      const activeId = values.tree;
      const tree = trees[activeId];
      const chosenPath = chosenPaths[activeId];
      const selected = tree.leaves.find(item => item.path === chosenPath);
      const summaries = { a: factorTreeSummary(trees.a), b: factorTreeSummary(trees.b) };
      const divisors = selected && selected.value > 3
        ? Array.from({ length: Math.min(24, selected.value - 2) }, (_, i) => i + 2).filter(n => selected.value % n === 0 && n < selected.value)
        : [];
      const powerRows = ['a', 'b'].flatMap(treeId => summaries[treeId].complete
        ? summaries[treeId].primePowers.map(({ prime, exponent }) => [`경로 ${treeId.toUpperCase()}`, String(prime), String(exponent)]) : []);
      const panel = treeId => {
        const pathTree = trees[treeId];
        const currentSelection = chosenPaths[treeId];
        return `<section aria-label="분해 경로 ${treeId.toUpperCase()}" style="min-width:0;border:1px solid var(--border);padding:.65rem">
          <h4>경로 ${treeId.toUpperCase()}</h4>
          <div class="lab-factor-leaves" style="display:flex;flex-wrap:wrap;gap:.4rem">${pathTree.leaves.map(leaf => {
            const prime = factorize(leaf.value).length === 1 && factorize(leaf.value)[0].prime === leaf.value;
            return `<button type="button" data-factor-tree="${treeId}" data-factor-leaf="${html(leaf.path)}" aria-pressed="${treeId === activeId && leaf.path === currentSelection}" class="${treeId === activeId && leaf.path === currentSelection ? 'chosen' : ''}" style="flex:0 1 auto;min-width:min(100%,10rem);white-space:nowrap;padding:.4rem .55rem">${html(leaf.path)}: ${leaf.value} · ${prime ? '소수' : '합성수'}</button>`;
          }).join('')}</div>
          <p class="lab-note">잎의 곱 ${pathTree.leaves.map(leaf => leaf.value).join(' × ')} = ${pathTree.leaves.reduce((product, leaf) => product * leaf.value, 1)}${summaries[treeId].complete ? ' · 완료' : ' · 분해가 더 필요함'}</p>
          ${pathTree.splits.length ? `<details><summary>분해 순서 ${pathTree.splits.length}회</summary><ol>${pathTree.splits.map(item => `<li>${item.value} = ${item.left} × ${item.right}</li>`).join('')}</ol></details>` : ''}
        </section>`;
      };
      figure.innerHTML = `<section aria-label="곱셈 트리">
        <p>두 경로를 나란히 비교합니다. 어느 잎이든 선택한 뒤 실제 약수를 입력하세요. 선택된 현재 경로는 조작부에서 표시됩니다.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.7rem">${panel('a')}${panel('b')}</div>
        <p class="lab-note">현재 선택: 경로 ${activeId.toUpperCase()} · 잎 <strong>${selected ? `${selected.value} (${selected.path})` : '없음'}</strong> · 각 경로에서 잎의 곱은 n=${values.n}을 유지합니다.</p>
        <div class="lab-buttons" role="group" aria-label="선택한 잎의 약수 예시">${divisors.map(n => `<button type="button" data-factor-divisor="${n}">${n}으로 나누기</button>`).join('') || '<span>이 잎은 더 나눌 수 없습니다.</span>'}</div>
        <button type="button" data-factor-split ${!selected || divisors.length === 0 ? 'disabled' : ''}>선택한 약수로 분해 · 경로 ${activeId.toUpperCase()}</button>
      </section>`;
      return `<h4>${summaries.a.complete && summaries.b.complete ? '두 경로의 소수 지수표가 같습니다' : '완성된 경로의 소수 지수표 비교'}</h4>
        ${powerRows.length ? table('경로별 최종 소인수분해', ['분해 순서', '소수 p', '지수 k'], powerRows) : `<p>경로 A와 B를 각각 소수 잎으로 끝까지 나누어 표를 비교하세요.</p>`}
        <p>산술의 기본정리는 두 경로가 같은 소수와 지수에 도착한다고 말합니다.</p>
        <p class="lab-note">유일한 분해는 경로가 아니라 최종 소수 지수표를 비교해 확인합니다. 소인수 계산은 n≤1,000,000에서 정확한 정수 trial division을 사용합니다.</p>`;
    },
  }, params);
  return api;
}

function mountSieve(root, params) {
  let state = createSieveState(100);
  let currentLimit = 100;
  let api;
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'sieve-step') { state = sieveStep(state); api.update(); }
    if (action === 'sieve-back') { state = sieveBack(state); api.update(); }
  });
  api = createLab(root, {
    fields: [choice('limit', '상한 N', 100, [[30, '30'], [100, '100'], [200, '200'], [400, '400']])], params,
    init: () => { state = createSieveState(100); currentLimit = 100; },
    presets: { 'N=30': { limit: 30 }, 'N=100': { limit: 100 }, 'N=200': { limit: 200 }, 'N=400': { limit: 400 } },
    render: ({ limit }) => {
      if (limit !== currentLimit) { currentLimit = limit; state = createSieveState(limit); }
      const { primes, currentPrime, nextCandidate, count, removedBy } = sieveSummary(state);
      const isPrimeNumber = new Set(primes);
      const cells = Array.from({ length: limit }, (_, i) => i + 1).map(n => {
        const removed = state.composite[n] === 1;
        const label = n === 1 ? '1: 소수가 아님' : removed ? `${n}: ${removedBy[n]}의 배수 단계에서 제외` : `${n}: 소수 후보`;
        return `<span class="${removed ? 'excluded' : isPrimeNumber.has(n) ? 'prime' : ''}" aria-label="${label}" title="${label}">${n}</span>`;
      }).join('');
      return `<p>단계 버튼으로 p², p²+p, …를 지웁니다. 격자 클릭은 필요 없습니다. 첫 제거 원인을 기록합니다.</p>
        <div class="lab-tiles" aria-label="1부터 ${limit}까지의 에라토스테네스 체 격자">${cells}</div>
        <div class="lab-buttons" role="group" aria-label="체 진행"><button type="button" data-action="sieve-back" ${state.stages.length ? '' : 'disabled'}>한 단계 되돌리기</button><button type="button" data-action="sieve-step" ${state.complete ? 'disabled' : ''}>${state.complete ? '체 완성' : `다음 소수 p=${currentPrime} 단계`}</button></div>
        <p class="lab-note">남은 후보 ${count}개 · 현재 p=${currentPrime ?? '완료'} · 다음 제거 시작 ${nextCandidate ?? '없음'}${currentPrime ? ` · √${limit}=${fmt(Math.sqrt(limit), 3)}까지의 후보만 확인` : ''}</p>
        <p>예: 49는 p=7 단계에서 처음 지워집니다. p 자신은 남고, 격자에서 1은 소수로 세지 않습니다.</p>`;
    },
  }, params);
  return api;
}

function mountMicroscope(root, params) {
  return createLab(root, {
    fields: [field('start', '구간 시작 a', 1, 1, 999_981), field('end', '구간 끝 b', 100, 20, 1_000_000)], params,
    presets: {
      '[1, 100]': { start: 1, end: 100 },
      '[999900, 1000000]': { start: 999900, end: 1_000_000 },
      '같은 폭 100개': { start: 999901, end: 1_000_000 },
    },
    render: ({ start, end }, { figure }) => {
      const result = inspectPrimeRange(start, end);
      if (result.integerCount < 20) throw new RangeError('구간에는 20개 이상의 정수가 필요합니다. 빈 구간 계산 [14,16]은 순수 계산 검수에 포함됩니다.');
      const markers = result.primes.map(prime => [prime, 1]);
      figure.innerHTML = `<p>소수의 위치를 한 점씩 표시합니다. 구간 밖 이웃 소수와의 간격은 표본에 포함하지 않습니다.</p>
        ${plot({ title: '선택한 정수 구간 안의 소수 위치', xLabel: '정수 p', yLabel: '소수 표시', series: [], xDomain: [start, end], yDomain: [0, 2], markers, xTick: value => String(Math.round(value)), yTick: () => '' })}
        <p class="lab-note">${result.count ? `표시한 소수: ${result.primes.join(', ')}` : '이 구간 안에 소수가 없습니다.'}</p>`;
      return `${figures([
        ['정수 구간 길이', result.integerCount], ['소수 개수', result.count], ['첫 소수', result.first ?? '없음'], ['마지막 소수', result.last ?? '없음'],
        ['내부 간격 평균', result.meanGap === null ? '정의되지 않음' : fmt(result.meanGap, 4)], ['내부 최대 간격', result.maxGap ?? '정의되지 않음'], ['정수 대비 밀도', `${fmt(100 * result.density, 3)}%`],
      ])}<p>간격 표본 ${result.gapCount}개는 두 끝 소수가 모두 [a,b] 안에 있을 때만 계산했습니다.</p>`;
    },
  }, params);
}

function mountUlam(root, params) {
  const gridCache = new Map();
  let api;
  const getGrid = size => {
    if (!gridCache.has(size)) {
      const grid = buildUlamGrid(size);
      gridCache.set(size, new Map(grid.cells.map(cell => [cellKey(cell.x, cell.y), cell])));
    }
    return gridCache.get(size);
  };
  root.addEventListener('click', event => {
    const canvas = event.target.closest('canvas[data-ulam]');
    if (!canvas || !api) return;
    const rect = canvas.getBoundingClientRect();
    const size = api.controls.size.valueAsNumber;
    const radius = (size - 1) / 2;
    const x = Math.floor((event.clientX - rect.left) / rect.width * size) - radius;
    const y = radius - Math.floor((event.clientY - rect.top) / rect.height * size);
    api.set({ x, y });
    root.querySelector('canvas[data-ulam]')?.focus();
  });
  root.addEventListener('keydown', event => {
    if (!event.target.matches('canvas[data-ulam]')) return;
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
    if (!delta) return;
    event.preventDefault();
    api?.set({ x: api.controls.x.valueAsNumber + delta[0], y: api.controls.y.valueAsNumber + delta[1] });
    root.querySelector('canvas[data-ulam]')?.focus();
  });
  api = createLab(root, {
    fields: [field('size', '홀수 격자 크기', 51, 11, 201, 2, 'range'), field('x', '열 x', 1, -100, 100), field('y', '행 y (위쪽이 양수)', 0, -100, 100), choice('diagonal', '대각선', 'main', [['main', '주대각선 y=x'], ['anti', '반대각선 y=−x']])], params,
    presets: { '11×11': { size: 11 }, '51×51': { size: 51 }, '201×201': { size: 201 } },
    render: ({ size, x, y, diagonal }, { figure }) => {
      const radius = (size - 1) / 2;
      const cells = getGrid(size);
      const chosen = cells.get(cellKey(x, y));
      const line = inspectUlamDiagonal(size, diagonal);
      const totalPrimeCount = [...cells.values()].filter(cell => cell.prime).length;
      figure.innerHTML = `<p>중심 1에서 오른쪽, 위, 왼쪽, 아래 순서로 반시계 방향입니다. 격자는 실제 정수와 소수 체 결과로 그립니다. 좌표 입력 또는 방향키로 값을 읽을 수 있습니다.</p>
        <canvas data-ulam width="804" height="804" tabindex="0" role="img" style="display:block;width:min(100%,560px);height:auto;aspect-ratio:1;margin-inline:auto;cursor:crosshair" aria-label="${size} by ${size} Ulam spiral, selected coordinate (${x}, ${y}). Arrow keys change the coordinate."></canvas>
        <p class="lab-note">어두운 칸은 소수, 밝은 칸은 합성수 또는 1입니다. 색만으로 값을 해석하지 말고 선택 좌표와 아래 표를 사용하세요.</p>
        ${table(`${diagonal === 'main' ? '주대각선' : '반대각선'} 좌표와 실제 값`, ['(x,y)', 'n', '분류'], line.cells.map(cell => [`(${cell.x}, ${cell.y})`, String(cell.value), cell.prime ? '소수' : '합성수/1']))}`;
      const canvas = figure.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const cellSize = canvas.width / size;
      for (const cell of cells.values()) {
        const px = (cell.x + radius) * cellSize;
        const py = (radius - cell.y) * cellSize;
        ctx.fillStyle = cell.x === x && cell.y === y ? '#0D766E' : cell.prime ? '#7A2838' : '#F5F2E9';
        ctx.fillRect(px, py, Math.ceil(cellSize), Math.ceil(cellSize));
        if (size <= 51) {
          ctx.strokeStyle = '#C9C4B0'; ctx.lineWidth = .6; ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
      ctx.strokeStyle = '#17243A'; ctx.lineWidth = Math.max(2, cellSize * .14);
      ctx.strokeRect((x + radius) * cellSize, (radius - y) * cellSize, cellSize, cellSize);
      if (size <= 51) {
        ctx.fillStyle = chosen?.prime ? '#fff' : '#17243A';
        ctx.font = `${Math.max(9, Math.min(14, cellSize * .5))}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const cell of cells.values()) ctx.fillText(String(cell.value), (cell.x + radius + .5) * cellSize, (radius - cell.y + .5) * cellSize);
      }
      return `${figures([['선택 좌표', `(${x}, ${y})`], ['나선 값 n', chosen?.value ?? '현재 격자 밖'], ['분류', chosen ? chosen.prime ? '소수' : '합성수 또는 1' : '격자 밖'], [`${diagonal === 'main' ? '주' : '반'}대각선 소수`, `${line.primeCount} / ${line.cells.length}`], ['격자 전체 밀도', `${fmt(100 * totalPrimeCount / cells.size, 2)}%`]])}
        <p>표시된 유한 대각선은 소수가 무한하다는 증명이 아닙니다. 창 크기를 바꿔도 선택 좌표 (x,y)를 유지합니다.</p>`;
    },
  }, params);
  return api;
}

function mountPrimeGaps(root, params) {
  return createLab(root, {
    fields: [field('start', '구간 시작 a', 2, 1, 999_999), field('end', '구간 끝 b', 10_000, 2, 1_000_000), toggle('rates', '막대를 비율로 표시', false)], params,
    presets: { '[2, 10000]': { start: 2, end: 10_000 }, '[2, 1000000]': { start: 2, end: 1_000_000 }, '[999900, 1000000]': { start: 999_900, end: 1_000_000 } },
    render: ({ start, end, rates }, { figure }) => {
      const result = inspectPrimeGaps(start, end);
      if (end - start + 1 < 2) throw new RangeError('구간에는 두 개 이상의 정수가 필요합니다.');
      const gaps = Object.keys(result.histogram).map(Number).sort((a, b) => a - b);
      const max = Math.max(1, ...gaps.map(gap => result.histogram[gap]));
      const axisMax = rates ? 1 : max;
      const ticks = Array.from({ length: 5 }, (_, i) => axisMax * i / 4);
      const bars = gaps.length ? `<svg viewBox="0 0 620 260" role="img" aria-label="소수 간격의 ${rates ? '비율' : '개수'} 히스토그램">
        ${ticks.map(value => { const y = 205 - value / axisMax * 180; return `<g><path d="M72 ${y}H600" stroke="currentColor" opacity=".14"/><text x="64" y="${y + 4}" text-anchor="end">${rates ? fmt(100 * value, 0) + '%' : fmt(value, 0)}</text></g>`; }).join('')}
        ${gaps.map((gap, i) => { const width = 520 / Math.max(1, gaps.length); const value = rates ? result.histogram[gap] / result.sampleCount : result.histogram[gap]; const height = value / axisMax * 180; const label = gaps.length <= 20 || i % 2 === 0; return `<g><rect x="${72 + i * width}" y="${205 - height}" width="${Math.max(1, width - 3)}" height="${height}" fill="var(--accent)"><title>간격 ${gap}: ${rates ? fmt(100 * value, 3) + '%' : result.histogram[gap] + '개'}</title></rect>${label ? `<text x="${72 + i * width + width / 2}" y="225" text-anchor="middle">${gap}</text>` : ''}</g>`; }).join('')}
        <path d="M72 205H600M72 25V205" fill="none" stroke="currentColor"/><text x="330" y="253" text-anchor="middle">간격 g = 다음 소수 − 이전 소수</text>
      </svg>` : '<p>이 구간에는 내부 간격 표본이 없습니다.</p>';
      figure.innerHTML = `<p>구간 내부의 연속한 소수 쌍만 집계합니다. 기대 밀도 ln(midpoint)는 특정 간격을 예측하는 값이 아닙니다.</p>${bars}`;
      return `${figures([['표본 구간', `[${start}, ${end}]`], ['내부 간격 표본', result.sampleCount], ['평균 간격', result.mean === null ? '정의되지 않음' : fmt(result.mean, 4)], ['중앙값', result.median ?? '정의되지 않음'], ['최대 간격', result.max ?? '정의되지 않음']])}
        ${table('간격별 빈도', ['간격 g', rates ? '표본 비율' : '개수'], Object.entries(result.histogram).sort(([a], [b]) => Number(a) - Number(b)).map(([gap, count]) => [String(gap), rates ? `${fmt(100 * count / result.sampleCount, 3)}%` : String(count)]))}`;
    },
  }, params);
}

function mountPrimeCounting(root, params) {
  return createLab(root, {
    fields: [field('maxLog', '최대 범위 log₁₀(x)', 4, 1, 6, 1, 'range'), field('x', '평가할 x', 100, 10, 1_000_000, .1), choice('axis', '가로축', 'linear', [['linear', '선형 x'], ['log', '로그 x']]), toggle('showPi', '실제 π(x)', true), toggle('showXln', 'x/ln x', true), toggle('showLi2', 'Li₂(x)', true), toggle('showLi', '표준 li(x)', false)], params,
    presets: { 'xmax=100': { maxLog: 2, x: 100 }, 'xmax=10000': { maxLog: 4, x: 100 }, 'xmax=1000000': { maxLog: 6, x: 100 } },
    render: (values, { figure }) => {
      const xMax = 10 ** values.maxLog;
      const x = Math.min(xMax, Math.max(10, values.x));
      const row = primeCountingAt(x);
      const curve = primeCountingCurve(xMax, { xMin: 2, width: 520, samples: 160, axis: values.axis });
      const transform = value => values.axis === 'log' ? Math.log(value) : value;
      const series = [];
      if (values.showPi) series.push({ label: '실제 π(x), 정확한 소수 점프를 픽셀 구간에 합산', points: curve.piPoints.map(([a, b]) => [transform(a), b]), step: true });
      if (values.showXln) series.push({ label: 'x/ln x', points: curve.approximationPoints.map(([a]) => [transform(a), primeCountingAt(a).xOverLogX]) });
      if (values.showLi2) series.push({ label: 'Li₂(x)=li(x)−li(2)', points: curve.approximationPoints.map(([a]) => [transform(a), primeCountingAt(a).li2]) });
      if (values.showLi) series.push({ label: '표준 li(x)', points: curve.approximationPoints.map(([a]) => [transform(a), primeCountingAt(a).li]) });
      const plottedSeries = series.length ? series : [{ label: '표시할 곡선을 선택하세요', points: [] }];
      figure.innerHTML = `<p>초기 화면은 전체 점프를 가로축의 ${520}개 픽셀 구간으로 모아 그립니다. 이는 표시 단순화이며 π(x) 수치 출력은 정확한 소수 계수로 계산합니다. 확대 구간에서는 각 정수 소수 점프를 따로 살펴보세요.</p>
        ${plot({ title: '소수 계량과 로그 적분 근사', xLabel: values.axis === 'log' ? 'ln x' : 'x', yLabel: '소수 개수', series: plottedSeries, xDomain: values.axis === 'log' ? [Math.log(2), Math.log(xMax)] : [2, xMax], xTick: value => values.axis === 'log' ? fmt(Math.exp(value), 0) : fmt(value, 0) })}`;
      return `${figures([['최대 범위', xMax.toLocaleString('ko-KR')], ['평가 위치 x', fmt(x, 3)], ['실제 π(x)', row.pi], ['x/ln x', fmt(row.xOverLogX, 6)], ['Li₂(x)', fmt(row.li2, 6)], ['표준 li(x)', fmt(row.li, 6)]])}
        <p class="lab-note">Li₂(2)=0이며 하한은 2입니다. 표준 li(x)=Li₂(x)+li(2)입니다. x=2에서 Li₂는 0이므로 로그 y축에서는 표시할 수 없습니다.</p>
        ${table('대표 표본에서 실제 계단과 근사값', ['x', 'π(x)', 'x/ln x', 'Li₂(x)'], [10, 100, 1000, 10_000, 100_000, 1_000_000].filter(sample => sample <= xMax).map(sample => { const v = primeCountingAt(sample); return [String(sample), String(v.pi), fmt(v.xOverLogX, 4), fmt(v.li2, 4)]; }))}`;
    },
  }, params);
}

function mountErrorExplorer(root, params) {
  return createLab(root, {
    fields: [field('x', '평가할 x', 10, 10, 1_000_000, .1), choice('approximation', '선택한 근사', 'xOverLogX', [['xOverLogX', 'x/ln x'], ['li2', 'Li₂(x)'], ['li', '표준 li(x)']]), choice('view', '오차 보기', 'signed', [['signed', '부호 있는 오차 π−f'], ['absolute', '절대오차 |π−f|'], ['relative', '상대오차 (π−f)/π'], ['ratio', '비율 π/f']])], params,
    presets: { 'x=100': { x: 100 }, 'x=1000000': { x: 1_000_000 } },
    render: ({ x, approximation, view }, { figure }) => {
      const current = primeCountingError(x, approximation);
      const xSamples = Array.from({ length: 180 }, (_, i) => 10 * (100_000) ** (i / 179));
      const metric = item => view === 'signed' ? item.signedError : view === 'absolute' ? item.absoluteError : view === 'relative' ? item.signedRelativeError : item.ratio;
      const points = xSamples.map(value => {
        const item = primeCountingError(value, approximation);
        const y = metric(item);
        return y === null || !Number.isFinite(y) ? null : [Math.log(value), y];
      });
      const name = { signed: 'π(x)−f(x)', absolute: '|π(x)−f(x)|', relative: '(π(x)−f(x))/π(x)', ratio: 'π(x)/f(x)' }[view];
      figure.innerHTML = `<p>오차는 실제 계단 π(x)에서 선택한 근사 f(x)를 뺍니다. 부호를 유지해 근사가 과대인지 과소인지 확인하세요.</p>
        ${plot({ title: `${name} · ${approximation}`, xLabel: 'ln x', yLabel: name, series: [{ label: name, points }], xDomain: [Math.log(10), Math.log(1_000_000)] })}`;
      return `${figures([['평가 x', fmt(x, 3)], ['정확한 π(x)', current.pi], ['근사 f(x)', fmt(current.estimate, 8)], ['signed error π−f', fmt(current.signedError, 8)], ['absolute error', fmt(current.absoluteError, 8)], ['signed relative error', current.signedRelativeError === null ? 'N/A' : fmt(current.signedRelativeError, 8)], ['ratio π/f', current.ratio === null ? 'N/A' : fmt(current.ratio, 8)]])}
        <p class="lab-note">분모가 0이면 비율을 N/A로 둡니다. 상대오차의 부호는 실제에서 근사를 뺀 정의를 따릅니다.</p>`;
    },
  }, params);
}

const handlers = {
  '01-a': mountFactorTree, '01-b': mountSieve,
  '02-a': mountMicroscope, '02-b': mountUlam, '02-c': mountPrimeGaps,
  '03-a': mountPrimeCounting, '03-b': mountErrorExplorer,
};

export function mount(root, id, params = new URLSearchParams()) {
  if (!(root instanceof Element)) throw new TypeError('mount(root) expects a DOM element.');
  const slug = String(id).toLowerCase();
  const handler = handlers[slug];
  if (!handler) throw new RangeError(`Part I has no lab ${id}.`);
  return handler(root, params);
}
