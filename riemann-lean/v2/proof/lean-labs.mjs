const fixtures = [
  {
    id: 'identity', label: 'P → P', declaration: 'identity_demo',
    source: 'theorem identity_demo (P : Prop) : P → P := by\n  trace_state\n  intro h\n  trace_state\n  exact h',
    stages: [
      { label: '시작 · 실제 trace_state', text: 'P : Prop\n⊢ P → P', tactic: 'intro h' },
      { label: 'intro 뒤 · 실제 trace_state', text: 'P : Prop\nh : P\n⊢ P', tactic: 'exact h' },
    ],
    error: null,
  },
  {
    id: 'and', label: 'P ∧ Q → Q ∧ P', declaration: 'conjunction_demo',
    source: 'theorem conjunction_demo (P Q : Prop) : P ∧ Q → Q ∧ P := by\n  trace_state\n  intro h\n  trace_state\n  exact ⟨h.2, h.1⟩',
    stages: [
      { label: '시작 · 실제 trace_state', text: 'P Q : Prop\n⊢ P ∧ Q → Q ∧ P', tactic: 'intro h' },
      { label: 'intro 뒤 · 실제 trace_state', text: 'P Q : Prop\nh : P ∧ Q\n⊢ Q ∧ P', tactic: 'exact ⟨h.2, h.1⟩' },
    ], error: { text: 'P Q : Prop\nh : P ∧ Q\n⊢ Q', invocation: 'exact h.1', output: 'Type mismatch\n  h.left\nhas type\n  P\nbut is expected to have type\n  Q', source: 'import Mathlib.Basic.Real.Basic\n\ntheorem conjunction_wrong_projection (P Q : Prop) (h : P ∧ Q) : Q := by\n  trace_state\n  exact h.1', sourcePath: 'FailureWrongProjection.lean', sha256: 'e2edc61c903d5265e6c65eb20335d506a370fa7a2c0c2876e730bfbb5c480c69', exitCode: 1 },
  },
  {
    id: 'eq', label: 'a = b → b = a', declaration: 'equality_demo',
    source: 'theorem equality_demo (a b : ℝ) : a = b → b = a := by\n  trace_state\n  intro h\n  trace_state\n  exact h.symm',
    stages: [
      { label: '시작 · 실제 trace_state', text: 'a b : ℝ\n⊢ a = b → b = a', tactic: 'intro h' },
      { label: 'intro 뒤 · 실제 trace_state', text: 'a b : ℝ\nh : a = b\n⊢ b = a', tactic: 'exact h.symm' },
    ], error: null,
  },
  {
    id: 'positive', label: '등식으로 양수 전달', declaration: 'positive_of_equal',
    source: 'theorem positive_of_equal (a b : ℝ) : a = b → 0 < b → 0 < a := by\n  trace_state\n  intro h\n  trace_state\n  intro hab\n  trace_state\n  rw [h]\n  trace_state\n  exact hab',
    stages: [
      { label: '시작 · 실제 trace_state', text: 'a b : ℝ\n⊢ a = b → 0 < b → 0 < a', tactic: 'intro h' },
      { label: 'intro h 뒤 · 실제 trace_state', text: 'a b : ℝ\nh : a = b\n⊢ 0 < b → 0 < a', tactic: 'intro hab' },
      { label: 'intro hab 뒤 · 실제 trace_state', text: 'a b : ℝ\nh : a = b\nhab : 0 < b\n⊢ 0 < a', tactic: 'rw [h]' },
      { label: 'rewrite 뒤 · 실제 trace_state', text: 'a b : ℝ\nh : a = b\nhab : 0 < b\n⊢ 0 < b', tactic: 'exact hab' },
    ],
    error: { text: 'a b : ℝ\nh : a = b\n⊢ 0 < a', invocation: 'exact h', output: 'Type mismatch\n  h\nhas type\n  a = b\nbut is expected to have type\n  0 < a', source: 'import Mathlib.Basic.Real.Basic\n\ntheorem positive_of_equal_wrong (a b : ℝ) (h : a = b) : 0 < a := by\n  trace_state\n  exact h', sourcePath: 'FailureWrongType.lean', sha256: '356c2ef1a89a1a045c187d29d94b133a655096d9b3f54a22cd349c4bc40b8078', exitCode: 1 },
  },
  {
    id: 'zero', label: '0 + n = n', declaration: 'zero_add_demo',
    source: 'theorem zero_add_demo (n : ℕ) : 0 + n = n := by\n  trace_state\n  simp',
    stages: [{ label: '시작 · 실제 trace_state', text: 'n : ℕ\n⊢ 0 + n = n', tactic: 'simp' }], error: null,
  },
];

const successSha = 'c1c61670b924d36cc371ed16a7cd4ad8541f2a44d10a6e8218ef26643faf03c5';

const logicPuzzles = [
  {
    prompt: '“n > 2이고 n은 소수이면 n은 홀수다”의 근거와 “홀수이면 소수다”라는 역명제의 반례를 함께 고르자.',
    answers: [
      ['짝수 소수는 2뿐이라는 사실로 n은 홀수임을 보이고, 9로 역명제를 반박한다.', true, '짝수인 n>2는 2를 자기 자신과 다른 약수로 가지므로 소수가 아니다. 반대로 9는 홀수지만 3×3이므로 소수가 아니다.'],
      ['확인한 소수가 모두 홀수였고 9는 홀수 소수다.', false, '표본은 일반 증명이 아니며 9는 3×3인 합성수다.'],
      ['홀수이면 소수라는 역명제를 쓰면 된다.', false, '역명제는 거짓이며 9가 반례다.'],
    ],
  },
  {
    prompt: 'P → Q와 P가 주어졌을 때 Q를 얻는 유효한 추론을 고르자.',
    answers: [['전건 P가 참이므로 조건문에 따라 Q를 결론낸다.', true, '전건 긍정(modus ponens)은 P → Q, P에서 Q를 얻는 유효한 규칙이다.'], ['Q가 참이므로 P도 참이라고 결론낸다.', false, '결과에서 원인을 거꾸로 추론하는 것은 일반적으로 타당하지 않다.'], ['P와 Q를 모두 가정으로 추가한다.', false, 'Q는 주어진 가정이 아니라 조건문과 P에서 도출하는 결론이다.']],
  },
  {
    prompt: 'P ∧ Q로부터 P를 얻는 직접 근거는?',
    answers: [['논리곱의 첫 성분 h.1을 꺼낸다.', true, 'h : P ∧ Q에서 h.1 : P가 바로 나온다.'], ['Q를 가정하고 P를 추측한다.', false, 'P와 Q 사이에 별도 관계가 주어지지 않았다.'], ['P → Q를 역으로 적용한다.', false, '전제에는 P → Q가 없고, 역방향 추론도 일반적으로 유효하지 않다.']],
  },
  {
    prompt: 'P → Q와 Q를 알고 있을 때 P라고 결론내릴 수 없는 오류를 가장 잘 보여 주는 것은?',
    answers: [['비가 오면 땅이 젖는다. 땅이 젖었다. 그러므로 비가 왔다.', true, '스프링클러 등 다른 원인도 땅을 적실 수 있다. 결과에서 원인을 거꾸로 확정할 수 없다.'], ['비가 오면 땅이 젖는다. 비가 왔다. 그러므로 땅이 젖었다.', false, '전건 긍정은 유효한 추론 규칙이다.'], ['P와 Q가 모두 참이면 Q를 결론낸다.', false, '논리곱 제거는 유효한 규칙이다.']],
  },
];

const leanNodes = [
  { id: 'and.intro', label: 'And.intro', description: 'P와 Q의 증명을 받아 P ∧ Q를 만든다.', source: 'conjunction_demo: ⟨h.2, h.1⟩' },
  { id: 'and.right', label: 'And.right', description: 'h : P ∧ Q에서 Q 성분을 꺼낸다.', source: 'conjunction_demo: h.2' },
  { id: 'and.left', label: 'And.left', description: 'h : P ∧ Q에서 P 성분을 꺼낸다.', source: 'conjunction_demo: h.1' },
  { id: 'h', label: 'h : P ∧ Q', description: '전제로 주어진 논리곱 증명 항이다.', source: 'conjunction_demo: intro h' },
  { id: 'identity', label: 'identity_demo', description: 'P의 증명을 입력받아 같은 P의 증명을 돌려준다.', source: 'identity_demo: intro h; exact h' },
];

function mountLogic(root) {
  const panel = element('div', 'proof-panel');
  const prompt = element('p', 'proof-card');
  const choices = element('div', 'proof-choice-grid');
  const feedback = element('p', 'proof-card proof-feedback');
  const controls = element('div', 'proof-controls');
  const previous = element('button', '', '이전 문제');
  const next = element('button', '', '다음 문제');
  const position = element('span', 'proof-note');
  controls.append(previous, position, next);
  panel.append(element('p', 'proof-note', '논리 모형입니다. Lean 커널은 실행하지 않습니다. 선택은 모두 키보드로 조작할 수 있습니다.'), prompt, choices, feedback, controls);
  root.replaceChildren(panel);
  let current = 0;
  function render() {
    const puzzle = logicPuzzles[current];
    prompt.textContent = puzzle.prompt;
    choices.replaceChildren();
    feedback.textContent = '근거 카드를 선택하면 이유가 여기에 표시됩니다.';
    feedback.dataset.kind = '';
    puzzle.answers.forEach(([answer, correct, explanation]) => {
      const button = element('button', 'proof-choice', answer);
      button.type = 'button';
      button.addEventListener('click', () => {
        feedback.textContent = `${correct ? '맞았습니다. ' : '다시 생각해 봅시다. '}${explanation}`;
        feedback.dataset.kind = correct ? 'correct' : 'incorrect';
      });
      choices.append(button);
    });
    previous.disabled = current === 0;
    next.disabled = current === logicPuzzles.length - 1;
    position.textContent = `문제 ${current + 1} / ${logicPuzzles.length}`;
  }
  previous.addEventListener('click', () => { current -= 1; render(); });
  next.addEventListener('click', () => { current += 1; render(); });
  render();
  return {};
}

function mountDependencies(root) {
  const panel = element('div', 'proof-panel');
  const tabs = element('div', 'proof-tabs');
  const modelTab = element('button', '', '논리 규칙 모형');
  const leanTab = element('button', '', 'Lean 본문 참조');
  modelTab.type = leanTab.type = 'button';
  tabs.append(modelTab, leanTab);
  const detail = element('section', 'proof-card');
  const nodeList = element('div', 'proof-node-list');
  const caveat = element('p', 'proof-note', '원문에 보이는 참조를 수동으로 읽은 범위입니다. Lean Meta/export로 추출한 전체 전이 의존성 그래프가 아닙니다.');
  panel.append(element('p', 'proof-note', '논리 규칙 모형과 실제 소스에 보이는 참조를 분리합니다.'), tabs, nodeList, detail, caveat);
  root.replaceChildren(panel);
  let mode = 'logic';
  let selected = 'and.intro';
  const logical = [
    { id: 'premise', label: '전제 P ∧ Q', description: '두 명제가 모두 참이라는 가정이다.' },
    { id: 'projection', label: '성분 선택', description: '왼쪽에서 P, 오른쪽에서 Q를 꺼낸다.' },
    { id: 'pair', label: '도입', description: '필요한 순서로 두 증명을 짝지어 Q ∧ P를 만든다.' },
    { id: 'goal', label: '결론 Q ∧ P', description: '전제의 성분 순서를 바꾼 결론이다.' },
  ];
  function render() {
    modelTab.setAttribute('aria-pressed', String(mode === 'logic'));
    leanTab.setAttribute('aria-pressed', String(mode === 'lean'));
    const nodes = mode === 'logic' ? logical : leanNodes;
    nodeList.replaceChildren(...nodes.map(node => {
      const button = element('button', 'proof-node', node.label);
      button.type = 'button';
      button.setAttribute('aria-current', String(node.id === selected));
      button.addEventListener('click', () => { selected = node.id; render(); });
      return button;
    }));
    const node = nodes.find(item => item.id === selected) ?? nodes[0];
    selected = node.id;
    detail.replaceChildren(element('h4', '', node.label), element('p', '', node.description));
    if (mode === 'logic') {
      detail.append(element('p', 'proof-note', '유형: 교육용 논리 도식 · Lean 선언 의존성으로 해석하지 않습니다.'));
    } else {
      detail.append(element('p', 'proof-code', node.source), element('p', 'proof-note', '증거 수준: 실행한 Success.lean 원문에서 직접 이름을 확인했습니다. 축약된 코드 참조이며 Lean elaborator가 만든 전체 선언 관계는 추출하지 않았습니다.'));
    }
  }
  modelTab.addEventListener('click', () => { mode = 'logic'; selected = logical[0].id; render(); });
  leanTab.addEventListener('click', () => { mode = 'lean'; selected = leanNodes[0].id; render(); });
  render();
  return {};
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mount(root, id) {
  const labId = id.toLowerCase();
  if (labId === '11-a') return mountLogic(root);
  if (labId === '11-c') return mountDependencies(root);
  const rootNode = element('div', 'proof-panel');
  const status = element('p', 'proof-note', '기록된 검증 결과를 재생합니다. 페이지에서 자유 입력하거나 Lean 커널을 실행하지 않습니다.');
  const choose = element('label', 'proof-controls');
  choose.append(element('span', '', '예제'));
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Lean 예제 선택');
  fixtures.forEach(fixture => {
    const option = document.createElement('option');
    option.value = fixture.id;
    option.textContent = fixture.label;
    select.append(option);
  });
  choose.append(select);
  const stage = element('section', 'proof-card');
  stage.setAttribute('aria-live', 'polite');
  const stageTitle = element('h4', '', 'Goal State');
  const state = element('pre', 'proof-state');
  const tactic = element('code', 'proof-code');
  const controls = element('div', 'proof-controls');
  const back = element('button', '', '이전 상태');
  const next = element('button', '', '다음 단계');
  const fail = element('button', '', '의도적으로 실패한 제출 보기');
  const reset = element('button', '', '처음으로');
  const result = element('p', 'proof-result');
  const error = element('pre', 'proof-state');
  const source = element('pre', 'proof-code');
  const sourcePath = element('p', 'proof-note');
  const hash = element('p', 'proof-note');
  controls.append(back, next, fail, reset);
  stage.append(stageTitle, state, tactic, controls, result, error, element('h5', '', '실행한 Lean 코드'), source);
  rootNode.append(status, choose, stage, element('div', 'proof-source'));
  rootNode.lastChild.append(sourcePath, hash, element('p', 'proof-note', 'Lean 4.35.0 · Mathlib 56a005855ea17e0b0958f73ec801ae140b0a1679 · 실행 로그는 docs/riemann-lean/textbook-v2/evidence/lean-fixtures.md에 기록되어 있습니다.'));
  root.replaceChildren(rootNode);

  let fixture = fixtures.find(item => item.id === (labId === '11-b' ? 'identity' : 'and'));
  if (!fixture) fixture = fixtures[0];
  let index = 0;
  function render(errorMode = false) {
    const item = fixture.stages[index];
    stageTitle.textContent = errorMode ? '실패 fixture · 기대된 오류' : item.label;
    state.textContent = errorMode ? fixture.error?.text ?? '이 예제에는 저장된 실패 fixture가 없습니다.' : item.text;
    tactic.textContent = errorMode ? fixture.error ? `입력: ${fixture.error.invocation}\nexit code: ${fixture.error.exitCode}` : '' : `선택된 전술: ${item.tactic}`;
    result.textContent = errorMode ? fixture.error ? '기록된 Lean 오류' : '오류 fixture 없음' : index === fixture.stages.length - 1 ? '실제 Lean 컴파일 성공 · exit code 0' : '다음 저장 상태가 있습니다.';
    error.textContent = errorMode && fixture.error ? fixture.error.output : '';
    error.hidden = !(errorMode && fixture.error);
    source.textContent = errorMode && fixture.error ? fixture.error.source : fixture.source;
    sourcePath.textContent = `원본: docs/riemann-lean/textbook-v2/evidence/lean/${errorMode && fixture.error ? fixture.error.sourcePath : 'Success.lean'}`;
    hash.textContent = `SHA-256: ${errorMode && fixture.error ? fixture.error.sha256 : successSha}`;
    back.disabled = errorMode || index === 0;
    next.disabled = errorMode || index >= fixture.stages.length - 1;
    fail.disabled = !fixture.error;
    result.dataset.kind = errorMode ? 'incorrect' : 'correct';
    result.className = `proof-result proof-feedback`;
    stage.dataset.mode = errorMode ? 'error' : 'success';
  }
  select.addEventListener('change', () => {
    fixture = fixtures.find(item => item.id === select.value);
    index = 0;
    render();
  });
  back.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
  next.addEventListener('click', () => { index = Math.min(fixture.stages.length - 1, index + 1); render(); });
  fail.addEventListener('click', () => render(true));
  reset.addEventListener('click', () => { index = 0; render(); });
  render();
  return {};
}
