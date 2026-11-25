export const LEAN = {
  initialState: 0,
  context: ['a b : ℝ', 'h : a = b', 'hab : 0 < b'],
  goals: ['a = b → 0 < b → 0 < a', '0 < a', '0 < b', 'Goals accomplished 🎉'],
  hints: [
    '가정을 꺼내려면 intro가 필요합니다.',
    'h : a = b를 써서 목표의 a를 b로 바꿔 보세요.',
    '가정 hab가 목표와 정확히 같은 타입입니다.',
    '타입 검사 통과. 이 정리는 이제 증명됐습니다.'
  ],
  tactics: ['intro', 'rw', 'exact']
};

let state = LEAN.initialState;
let error = 'none';
let view;

export function getState() {
  return { state, error, kernel: state === 3 ? 'pass' : 'pending' };
}

export function step(action) {
  if (action === 'reset') {
    state = LEAN.initialState;
    error = 'none';
  } else if (action === 'wrong' && (state === 1 || state === 2)) {
    error = 'mismatch';
  } else if (state < 3 && action === LEAN.tactics[state]) {
    state += 1;
    error = 'none';
  } else {
    return getState();
  }
  view?.render();
  return getState();
}

function create(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function decorateCode(pre) {
  const originalLines = pre.textContent.split('\n');
  const tokenClasses = {
    theorem: 'syn-key', by: 'syn-key',
    intro: 'syn-tactic', rw: 'syn-tactic', exact: 'syn-tactic', 'ℝ': 'syn-type'
  };
  const code = document.createElement('code');
  const lines = originalLines.map((text, index) => {
    const line = create('span', '', 'code-line');
    const number = create('span', index + 1, 'line-no');
    const check = create('span', '✓', 'line-check');
    number.setAttribute('aria-hidden', 'true');
    check.setAttribute('aria-hidden', 'true');
    line.append(number, check);
    if (index === 0) {
      line.append(create('span', text, 'syn-comment'));
    } else {
      for (const part of text.split(/(\btheorem\b|\bby\b|\bintro\b|\brw\b|\bexact\b|ℝ)/)) {
        line.append(tokenClasses[part] ? create('span', part, tokenClasses[part]) : document.createTextNode(part));
      }
    }
    code.append(line);
    if (index < originalLines.length - 1) code.append('\n');
    return line;
  });
  pre.replaceChildren(code);
  return lines;
}

export function initLean(root) {
  const lines = decorateCode(root.querySelector('#leanCode'));
  const goal = root.querySelector('#goal');
  const errorPane = root.querySelector('#leanError');
  const hint = root.querySelector('#leanHint');
  const progress = root.querySelector('#progressTxt');
  const status = root.querySelector('#kernelStatus');
  const kernel = root.querySelector('#kernelTxt');
  const tactics = [...root.querySelectorAll('.lean__tactics [data-step]')];
  const wrong = root.querySelector('#wrongBtn');
  const reset = root.querySelector('#resetLean');
  const tabs = [...root.querySelectorAll('[data-lean-tab]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 639px)');
  let hintTimer;
  let previousState;
  let completionHintShown = false;

  function selectPane(pane) {
    root.dataset.leanView = pane;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', tab.dataset.leanTab === pane));
  }

  function render() {
    const complete = state === 3;
    if (!complete) completionHintShown = false;
    const stateChanged = previousState !== state;
    if (stateChanged || !goal.childNodes.length) {
      const context = state ? LEAN.context : LEAN.context.slice(0, 1);
      goal.replaceChildren(
        create('p', 'Context', 'lean__label'),
        create('pre', context.join('\n')),
        create('p', 'Goal', 'lean__label'),
        create('pre', complete ? LEAN.goals[state] : '⊢ ' + LEAN.goals[state], complete ? 'lean__complete' : '')
      );
    }
    if (error === 'mismatch') {
      errorPane.replaceChildren(
        create('strong', '✗ Lean 커널이 거부했습니다'),
        create('pre', `type mismatch\n  h\nhas type\n  a = b : Prop\nbut is expected to have type\n  ${LEAN.goals[state]} : Prop`),
        create('p', 'h는 등식이고, 목표는 부등식입니다. exact는 목표와 정확히 같은 타입의 항만 받습니다.')
      );
    } else {
      errorPane.replaceChildren();
    }
    root.dataset.kernel = complete ? 'pass' : 'pending';
    progress.textContent = `${state} / 3 전술`;
    status.textContent = complete ? '✓ 커널 통과' : '커널 대기';
    kernel.textContent = complete ? '✓ 통과' : '대기';
    clearTimeout(hintTimer);
    const announceHint = () => {
      hint.textContent = LEAN.hints[state];
      completionHintShown = complete;
    };
    if (complete && !reduced.matches && !completionHintShown) {
      hint.textContent = '';
      hintTimer = setTimeout(announceHint, 300);
    } else {
      announceHint();
    }
    tactics.forEach((button, index) => {
      button.disabled = index !== state;
      lines[index + 3].classList.toggle('is-current', index === state);
      lines[index + 3].classList.toggle('is-complete', index < state);
    });
    wrong.disabled = state !== 1 && state !== 2;
    previousState = state;
  }

  tabs.forEach(tab => tab.addEventListener('click', () => selectPane(tab.dataset.leanTab)));
  tactics.forEach((button, index) => button.addEventListener('click', () => {
    const focused = document.activeElement === button;
    if (mobile.matches) selectPane('goal');
    step(LEAN.tactics[index]);
    if (mobile.matches && state === 3) goal.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    if (focused) (tactics[state] ?? reset).focus({ preventScroll: true });
  }));
  wrong.addEventListener('click', () => {
    if (mobile.matches) selectPane('goal');
    step('wrong');
    if (mobile.matches) errorPane.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
  reset.addEventListener('click', () => {
    selectPane('code');
    step('reset');
  });

  view = { render };
  render();
}
