export const format = (value, digits = 6) => Number.isFinite(value)
  ? (Math.abs(value) > 1e12 || (value !== 0 && Math.abs(value) < 10 ** -digits)
    ? value.toExponential(Math.min(digits, 6))
    : value.toLocaleString('ko-KR', { maximumFractionDigits: digits }))
  : '해당 없음';

export const html = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function field(name, label, value, min, max, step = 1, type = 'number') {
  return { name, label, value, min, max, step, type };
}

export function choice(name, label, value, options) {
  return { name, label, value, options, type: 'select' };
}

export function toggle(name, label, value = true) {
  return { name, label, value, type: 'checkbox' };
}

export function buttonRow(buttons, label = '빠른 선택') {
  return `<div class="lab-buttons" role="group" aria-label="${html(label)}">${buttons.map(([action, title]) =>
    `<button type="button" data-action="${html(action)}">${html(title)}</button>`).join('')}</div>`;
}

function control(spec) {
  const { name, label, value, min, max, step, type } = spec;
  if (type === 'select') return `<label>${html(label)}<select name="${html(name)}">${spec.options.map(option => {
    const [key, title] = Array.isArray(option) ? option : [option, option];
    return `<option value="${html(key)}"${key === value ? ' selected' : ''}>${html(title)}</option>`;
  }).join('')}</select></label>`;
  if (type === 'checkbox') return `<label class="lab-check"><input type="checkbox" name="${html(name)}"${value ? ' checked' : ''}>${html(label)}</label>`;
  return `<label>${html(label)}${type === 'range' ? `<output data-for="${html(name)}">${html(value)}</output>` : ''}
    <input type="${type}" name="${html(name)}" value="${value}" min="${min}" max="${max}" step="${step}" required>
  </label>`;
}

/**
 * Fields remain mounted during updates, so changing values preserves keyboard focus.
 * A render may return a string or update the figure/readout through their DOM nodes.
 */
export function createLab(root, options, params = options.params ?? new URLSearchParams()) {
  const { fields = [], presets = {}, render, init, aside = '' } = options;
  root.classList.add('interactive');
  root.innerHTML = `<div class="lab-figure"></div>
    <form class="lab-inputs" aria-label="실험 조작부" novalidate>
      <div class="lab-fields">${fields.map(control).join('')}</div>
      <div class="lab-buttons">${Object.keys(presets).map(title => `<button type="button" data-preset="${html(title)}">${html(title)}</button>`).join('')}
      <button type="reset">초기화</button></div>
      <p class="lab-error" role="status" hidden></p>
    </form><div class="lab-readout"></div>${aside}`;
  const form = root.querySelector('form');
  const error = root.querySelector('.lab-error');
  const figure = root.querySelector('.lab-figure');
  const result = root.querySelector('.lab-readout');
  const controls = Object.fromEntries(fields.map(spec => [spec.name, form.elements.namedItem(spec.name)]));
  function set(values, redraw = true) {
    for (const [key, value] of Object.entries(values)) {
      const input = controls[key];
      if (!input) continue;
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = value;
    }
    if (redraw) update();
  }

  function update() {
    const values = {};
    for (const { name, label, min, max, options: choices } of fields) {
      const input = controls[name];
      if (!input.validity.valid) {
        error.hidden = false;
        error.textContent = `${label}에 ${min}부터 ${max}까지 허용된 값을 입력하세요. 실험 결과에는 마지막 유효 입력이 남아 있습니다.`;
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');
      if (input.type === 'checkbox') values[name] = input.checked;
      else if (['range', 'number'].includes(input.type)) values[name] = input.valueAsNumber;
      else {
        const keys = choices.map(option => Array.isArray(option) ? option[0] : option);
        values[name] = keys.find(key => String(key) === input.value) ?? input.value;
      }
      const output = form.querySelector(`[data-for="${name}"]`);
      if (output) output.textContent = format(values[name]);
    }
    error.hidden = true;
    try {
      const content = render(values, { figure, result, set, controls });
      if (typeof content === 'string') result.innerHTML = content;
    } catch (failure) {
      if (!(failure instanceof RangeError)) throw failure;
      error.hidden = false;
      error.textContent = failure.message;
    }
  }

  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  form.addEventListener('input', update);
  form.addEventListener('reset', event => {
    event.preventDefault();
    init?.();
    set(Object.fromEntries(fields.map(spec => [spec.name, spec.value])));
  });
  form.addEventListener('click', event => {
    const name = event.target.closest('[data-preset]')?.dataset.preset;
    if (name) set(presets[name]);
  });
  const sectionId = root.closest('[data-lab]')?.dataset.lab;
  let invalidQuery = false;
  for (const spec of fields) {
    const value = params.get(`${sectionId}-${spec.name}`);
    if (value === null) continue;
    if (spec.type === 'checkbox') {
      if (value === '1' || value === '0') controls[spec.name].checked = value === '1';
      else invalidQuery = true;
      continue;
    }
    const input = controls[spec.name];
    const numeric = spec.type !== 'select';
    if (numeric && (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < spec.min || Number(value) > spec.max)) {
      invalidQuery = true;
      continue;
    }
    input.value = value;
    if (input.value === '' || !input.validity.valid) {
      input.value = spec.value;
      invalidQuery = true;
    }
  }
  update();
  if (invalidQuery) {
    error.hidden = false;
    error.textContent = '링크의 일부 값이 허용 범위를 벗어나 기본값을 표시합니다.';
  }
  return { update, set, figure, result, controls, reset: () => form.reset() };
}

export function figures(entries) {
  return `<dl class="lab-values">${entries.map(([name, value]) =>
    `<div><dt>${html(name)}</dt><dd>${html(value)}</dd></div>`).join('')}</dl>`;
}

export function table(caption, headers, rows) {
  return `<div class="lab-table" tabindex="0" role="region" aria-label="${html(caption)}"><table>
    <caption>${html(caption)}</caption><thead><tr>${headers.map(name => `<th scope="col">${html(name)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map((cell, index) => index === 0
      ? `<th scope="row">${html(cell)}</th>` : `<td>${html(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

const palette = ['var(--ink)', 'var(--accent)', 'var(--teal)', '#825619'];
const dash = ['', '8 4', '3 5', '11 4 3 4'];

// Paths and readout are generated from the same samples. null opens a gap in a path.
export function plot({ title, xLabel, yLabel, series, xDomain, yDomain, markers = [], xTick = format, yTick = format }) {
  const points = series.flatMap(item => item.points.filter(pair => pair && pair.every(Number.isFinite)));
  if (!points.length && !markers.length) return `<p>${html(title)}에 표시할 값이 없습니다.</p>`;
  const xs = [...points.map(([x]) => x), ...markers.map(([x]) => x)];
  const ys = [...points.map(([, y]) => y), ...markers.map(([, y]) => y)];
  const w = 620, h = 238, left = 72, right = w - 20, top = 10, bottom = h - 46;
  const extent = values => values.reduce(([min, max], value) => [Math.min(min, value), Math.max(max, value)], [Infinity, -Infinity]);
  const [xmin, xmax] = xDomain ?? extent(xs);
  const [ymin, ymax] = yDomain ?? extent(ys);
  const x = value => left + (right - left) * (value - xmin) / (xmax - xmin || 1);
  const y = value => bottom - (bottom - top) * (value - ymin) / (ymax - ymin || 1);
  const ticks = (a, b, count) => Array.from({ length: count + 1 }, (_, i) => a + (b - a) * i / count);
  const path = (pairs, step) => {
    let connected = false;
    return pairs.map(pair => {
      if (!pair || !pair.every(Number.isFinite)) { connected = false; return ''; }
      const [px, py] = pair;
      const sx = x(px).toFixed(2), sy = y(py).toFixed(2);
      const part = !connected ? `M${sx},${sy}` : step ? `H${sx}V${sy}` : `L${sx},${sy}`;
      connected = true;
      return part;
    }).join('');
  };
  return `<figure class="lab-plot">
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${html(`${title}. 가로축 ${xLabel}, 세로축 ${yLabel}`)}">
    ${ticks(ymin, ymax, 4).map(value => `<path class="lab-grid" d="M${left},${y(value)}H${right}"/><text class="axis-y" x="${left - 8}" y="${y(value)}">${html(yTick(value, 2))}</text>`).join('')}
    ${ticks(xmin, xmax, 4).map(value => `<text x="${x(value)}" y="${bottom + 25}" text-anchor="${value === xmax ? 'end' : 'middle'}">${html(xTick(value, 2))}</text>`).join('')}
    ${ymin < 0 && ymax > 0 ? `<path class="lab-axis" d="M${left},${y(0)}H${right}"/>` : ''}
    <path class="lab-axis" d="M${left},${top}V${bottom}H${right}"/>
    ${series.map((item, index) => `<path d="${path(item.points, item.step)}" fill="none" stroke="${palette[index % 4]}" stroke-dasharray="${dash[index % 4]}" stroke-width="2.2" vector-effect="non-scaling-stroke"/>`).join('')}
    ${markers.map(([px, py], index) => `<circle cx="${x(px)}" cy="${y(py)}" r="${index ? 4 : 6}" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.5"/>`).join('')}
    <text x="${(left + right) / 2}" y="${h - 2}" text-anchor="middle">${html(xLabel)}</text>
    </svg>
    <figcaption><strong>${html(title)} · ${html(yLabel)}</strong><ul>${series.map((item, index) => `<li><svg width="25" height="8" aria-hidden="true"><path d="M0 4H25" stroke-width="2" stroke="${palette[index % 4]}" stroke-dasharray="${dash[index % 4]}"/></svg>${html(item.label)}</li>`).join('')}</ul></figcaption>
  </figure>`;
}

export function samples(a, b, size, fn) {
  return Array.from({ length: size }, (_, index) => {
    const x = index === size - 1 ? b : a + (b - a) * index / (size - 1);
    return [x, fn(x)];
  });
}
