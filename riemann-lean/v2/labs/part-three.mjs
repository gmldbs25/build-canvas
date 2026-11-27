import { factorize, primePi } from '../core/primes.mjs';
import { primePowerEvents, theta, psi, vonMangoldt } from '../core/counting.mjs';
import { PRIME_ZERO_HEIGHTS } from '../core/explicit-formula.mjs';
import { leastCommonMultiple, logarithmicDerivative, modelWave } from './counting-models.mjs';
import { choice, createLab, field, figures, format as f, plot, samples, table, toggle } from './ui.mjs';

const note = text => `<p class="lab-note">${text}</p>`;

function counting(root, params) {
  return createLab(root, {
    fields: [field('x', '읽을 위치 x', 10, 1, 10000, 'any'), field('end', '그래프의 오른쪽 끝', 20, 2, 10000),
      toggle('pi', 'π 개수'), toggle('theta', 'θ 로그 합'), toggle('psi', 'ψ 로그 합')],
    presets: { 'x = 4': { x: 4, end: 12 }, 'x = 5.5': { x: 5.5, end: 12 }, 'x = 10': { x: 10, end: 20 }, '100까지': { x: 100, end: 100 } },
    render({ x, end, ...visible }, { figure }) {
      const events = primePowerEvents(end);
      const primePoints = [[1, 0]], thetaPoints = [[1, 0]], psiPoints = [[1, 0]];
      let count = 0, weighted = 0;
      for (const { n, prime, jump, prefix } of events) {
        if (n === prime) {
          weighted += jump;
          count += 1;
          primePoints.push([n, count]);
          thetaPoints.push([n, weighted]);
        }
        psiPoints.push([n, prefix]);
      }
      primePoints.push([end, count]);
      thetaPoints.push([end, weighted]);
      psiPoints.push([end, events.at(-1)?.prefix ?? 0]);
      const values = [primePi(x), theta(x), psi(x)];
      const series = [
        { label: 'π · 소수 개수', points: primePoints, step: true, enabled: visible.pi },
        { label: 'θ · 소수에 ln p', points: thetaPoints, step: true, enabled: visible.theta },
        { label: 'ψ · 모든 pᵏ에 ln p', points: psiPoints, step: true, enabled: visible.psi },
      ].map(item => ({ ...item, points: item.enabled ? item.points : [] })).filter(item => item.enabled);
      const markers = values.filter((_, i) => [visible.pi, visible.theta, visible.psi][i]).map(value => [x, value]);
      figure.innerHTML = plot({ title: '세 가지 오른쪽 연속 계단', xLabel: '실수 x', yLabel: '개수 또는 로그 가중합', series,
        xDomain: [1, end], markers: x <= end ? markers : [] });
      const jump = Number.isInteger(x) ? vonMangoldt(x) : 0;
      const jumpPrime = jump ? factorize(x)[0].prime : null;
      return figures([['π(x)', values[0]], ['θ(x)', f(values[1])], ['ψ(x)', f(values[2])], ['x에서 점프 Λ', f(jump)]]) +
        note(jump ? `${x}의 밑인 소수는 ${jumpPrime}입니다. ψ는 여기서 ln ${jumpPrime}만큼 올라갑니다.`
          : `x=${f(x)}에서는 ψ가 뛰지 않습니다. 소수 또는 소수 거듭제곱에서만 새 항을 더합니다.`) +
        (x > end ? note('읽을 위치는 그래프 오른쪽 끝보다 큽니다. 계단에서 보려면 그래프 끝을 늘려 보세요.') : '') +
        `<details><summary>그래프의 점프 표</summary>${table('그래프에 그린 처음 50개 소수 거듭제곱', ['pᵏ', 'p', 'Λ(pᵏ)', 'ψ(pᵏ)'],
          events.slice(0, 50).map(({ n, prime, jump: height, prefix }) => [n, prime, f(height), f(prefix)]))}</details>`;
    },
  }, params);
}

function lcm(root, params) {
  return createLab(root, {
    fields: [field('m', '끝 자연수 m', 5, 1, 50, 1, 'range')],
    presets: { 'm = 1': { m: 1 }, 'm = 6': { m: 6 }, 'm = 8': { m: 8 }, 'm = 9': { m: 9 }, 'm = 50': { m: 50 } },
    render({ m }, { figure }) {
      const current = leastCommonMultiple(m);
      const previous = m === 1 ? current : leastCommonMultiple(m - 1);
      const multiplier = current.exact / previous.exact;
      const increased = current.factors.find(({ prime }) => BigInt(prime) === multiplier)?.prime;
      figure.innerHTML = figures([
        ['최소공배수 · 정확한 정수', current.exact.toLocaleString('ko-KR')],
        ['ln(최소공배수) · 수치 근사', f(current.logarithm)],
        ['이전 단계에 곱할 수', multiplier],
      ]);
      return note(increased ? `m=${m}에서 ${increased}의 지수가 하나 늘어납니다. 로그의 증가량은 ln ${increased} ≈ ${f(Math.log(increased))}입니다.`
        : m === 1 ? '첫 단계의 최소공배수는 1이고 로그는 0입니다.' : `m=${m}에 필요한 인수가 이미 포함되어 있습니다. 이번 단계에서 변하는 지수는 없습니다.`) +
        table('최소공배수를 구성하는 최대 소수 지수', ['소수 p', '지수 e', 'pᵉ', '직전 단계와 비교'],
          current.factors.map(({ prime, exponent, power }) => [prime, exponent, power, prime === increased ? '+1' : '같음']));
    },
  }, params);
}

function logDerivative(root, params) {
  const primes = [2, 3, 5, 7];
  return createLab(root, {
    fields: [field('s', '실수 s', 2, 1.1, 4, .1, 'range'), field('k', '절단 지수 K', 3, 1, 6, 1, 'range'),
      ...primes.map(prime => toggle(`p${prime}`, `소수 ${prime}`, prime < 7)),
      choice('stage', '미분 단계', 'derivative', [['log', '로그 급수'], ['derivative', '음의 로그 미분']])],
    presets: { '2의 세 항': { s: 2, k: 3, p2: true, p3: false, p5: false, p7: false }, '네 소수의 여섯 항': { k: 6, p2: true, p3: true, p5: true, p7: true } },
    render({ s, k, stage, ...settings }, { figure }) {
      const active = primes.filter(prime => settings[`p${prime}`]);
      const { terms, finiteSum, factorsSum } = logarithmicDerivative(s, k, active);
      const derivative = stage === 'derivative';
      figure.innerHTML = `<p class="lab-equation">${derivative ? '(ln p) · p⁻ᵏˢ' : 'p⁻ᵏˢ / k'}</p>` + figures([
        ['선택한 소수', active.join(', ') || '없음'], ['유한 K의 음의 로그 미분 합', f(finiteSum, 8)],
        ['선택한 인자의 전체 로그 미분', f(factorsSum, 8)], ['k 절단으로 남은 차이', f(factorsSum - finiteSum, 8)],
      ]);
      return note(derivative ? '지수 −ks를 미분하면 −k ln p가 곱해집니다. 바깥의 음수와 1/k를 적용하면 양의 항 (ln p)p⁻ᵏˢ가 남습니다.'
        : '−ln(1−z)에 들어 있는 k번째 항은 zᵏ/k입니다. z=p⁻ˢ를 대입하고 음의 로그 미분 단계에서 k가 사라지는지 확인하세요.') +
        table('같은 p와 k에 대한 로그 항과 미분 항', ['p', 'k', 'p⁻ᵏˢ / k', '(ln p)p⁻ᵏˢ'],
          terms.map(term => [term.prime, term.k, f(term.term, 8), f(term.derivative, 8)])) +
        note('두 합은 고른 소수의 인자에 대한 계산입니다. 제타 함수 전체의 로그 미분은 Re(s)>1에서 모든 소수의 인자를 포함합니다.');
    },
  }, params);
}

function hypothesis(root, params) {
  return createLab(root, {
    fields: [field('beta', '가상 영점의 실수부 β', .75, .5, .95, .005, 'range'),
      field('x', '가로 위치 log₁₀ x', 12, 2, 16, .01, 'range'),
      choice('zero', '기준 높이 γ', '0', PRIME_ZERO_HEIGHTS.slice(0, 8).map((height, i) => [String(i), `γ${i + 1} ≈ ${f(height, 5)}`])),
      choice('mode', '비교 보기', 'amplitude', [['amplitude', '한 켤레쌍의 진폭'], ['quartet', '네 대칭점의 파동 합']])],
    presets: { 'β = ½': { beta: .5 }, 'β = 0.9': { beta: .9 }, 'x = 1조': { x: 12 } },
    render({ x, beta, zero, mode }, { figure }) {
      const index = Number(zero);
      const result = modelWave(x, beta, index);
      const tickX = value => `10^${f(value, 1)}`;
      const amplitudePlot = mode === 'amplitude';
      if (amplitudePlot) {
        const rows = samples(2, 16, 81, power => modelWave(power, beta, index)).map(([power, point]) =>
          [power, Math.log10(point.actual), Math.log10(point.amplitude)]);
        figure.innerHTML = plot({ title: '켤레쌍의 진폭 · 두 축 모두 로그', xLabel: 'x (로그 눈금)', yLabel: 'log₁₀ 진폭',
          series: [
            { label: '실수부 ½ · 기울기 ½', points: rows.map(([t, a]) => [t, a]) },
            { label: `가상 β=${f(beta, 3)} · 기울기 ${f(beta, 3)}`, points: rows.map(([t, , b]) => [t, b]) },
          ], markers: [[x, Math.log10(result.amplitude)]], xTick: tickX });
      } else {
        const period = 2 * Math.PI / (result.gamma * Math.LN10);
        const start = Math.max(2, x - 2 * period), end = Math.min(16, x + 2 * period);
        const rows = samples(start, end, 181, power => modelWave(power, beta, index));
        figure.innerHTML = plot({ title: '선택한 x 부근의 켤레 파동 합', xLabel: 'x (로그 눈금)', yLabel: '부호 있는 파동 기여',
          series: [
            { label: 'β에 있는 켤레쌍', points: rows.map(([t, p]) => [t, p.paired]) },
            ...(beta === .5 ? [] : [{ label: '1−β에 있는 켤레쌍', points: rows.map(([t, p]) => [t, p.reflection]) }]),
            { label: '대칭점의 합성', points: rows.map(([t, p]) => [t, p.combined]) },
          ], markers: [[x, result.combined]], xTick: value => `10^${f(value, 3)}` });
      }
      return (amplitudePlot ? figures([
        ['기준 쌍 진폭', f(result.actual)], ['가상 쌍 진폭', f(result.amplitude)],
        ['가상 진폭 / 기준 진폭', f(result.ratio)], ['가상 진폭 / (√x ln²x)', f(result.normalized)],
      ]) : figures([
        ['β 켤레쌍 기여', f(result.paired)], ['반사 켤레쌍 기여', beta === .5 ? '중복 생략' : f(result.reflection)],
        ['합성 파동 기여', f(result.combined)], ['대칭점 개수', beta === .5 ? 2 : 4],
      ])) + note(amplitudePlot
        ? '높이 γ는 고정합니다. 기울기가 큰 직선의 진폭이 더 빠르게 자랍니다. 정규화한 값은 한 쌍의 진폭 규모이며, 빅오의 상수 C는 임의로 1로 고정하지 않습니다.'
        : '반사한 실수부 1−β를 함께 평가합니다. 각 쌍의 기여에는 부호가 있어 합성 파동에서 서로 더해지거나 상쇄됩니다. β=½이면 두 쌍이 겹쳐 한 번만 계산합니다.') +
        note('실제 영점 데이터는 기준 높이 γ를 고르는 데 사용합니다. 움직이는 점들은 가상 모형이며 실제 제타 영점이나 소수 계단의 값을 계산하지 않습니다.');
    },
  }, params);
}

const mountLab = { '08-a': counting, '08-b': lcm, '08-c': logDerivative, '10-a': hypothesis };
export const mount = (root, id, params) => mountLab[id](root, params);
