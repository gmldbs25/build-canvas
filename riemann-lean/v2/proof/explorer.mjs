const commit = '72fead102f663d5c7a407964a13dc0cf9d977207';
const base = `https://github.com/lsernau/grh-lean/blob/${commit}`;
const sourceFiles = {
  statements: { path: 'grh-compact/src/Statements.lean', blob: '1cd1bce93344065936b2b392b23306254e0785ef' },
  main: { path: 'grh-compact/src/Main.lean', blob: 'a5d8389131c985a0b54ce5b0e778ee5c8126a997' },
  newMain: { path: 'grh-compact/src/New/Main.lean', blob: '198ed5bf26aa294898931e0649bc2b88f1389f65' },
  mathlib: { path: 'Mathlib/NumberTheory/LSeries/RiemannZeta.lean', blob: 'e95eeb3463f021e719c6318dc346dca28d9522b9', repo: 'https://github.com/leanprover-community/mathlib4', commit: '56a005855ea17e0b0958f73ec801ae140b0a1679' },
  originalMain: { path: 'src/Main.lean', commit: '545e2b54604508ae6845a05d431a9c966cfe7276', repo: 'https://github.com/homeowmorphism/riemann-hypothesis-original' },
  originalStatements: { path: 'src/Statements.lean', commit: '545e2b54604508ae6845a05d431a9c966cfe7276', repo: 'https://github.com/homeowmorphism/riemann-hypothesis-original' },
  readableMain: { path: 'grh/src/Main.lean', commit, repo: 'https://github.com/lsernau/grh-lean' },
  readableStatements: { path: 'grh/src/Statements.lean', commit, repo: 'https://github.com/lsernau/grh-lean' },
  originalMathlib: { path: 'Mathlib/NumberTheory/LSeries/RiemannZeta.lean', commit: '0df444a360eaa60ab8c11dca51a86af692955474', repo: 'https://github.com/leanprover-community/mathlib4' },
};

const nodes = [
  {
    id: 'riemannHypothesis', group: 'endpoint',
    type: 'Mathlib.RiemannHypothesis',
    declaration: 'theorem riemannHypothesis : RiemannHypothesis',
    statement: '모든 비자명한 제타 영점의 실수부는 1/2이다. (Mathlib의 RiemannHypothesis)',
    explanation: 'Mathlib에 정의된 고전적 리만 가설이다. 제타 함수의 자명한 음의 짝수 영점은 이 명제의 대상에서 제외된다.',
    file: 'main', statementFile: 'mathlib', declarationPending: false,
    originalLine: 5, compactLine: 5, statementLine: 185,
  },
  {
    id: 'riemannZeta_eq_zero_re', group: 'endpoint',
    type: 'RiemannZetaZerosOnLine',
    declaration: 'theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine',
    statement: '복소수 s에서 ζ(s)=0이고 s가 자명한 음의 짝수 영점이 아니며 s≠1이면 Re(s)=1/2이다.',
    explanation: 'Mathlib의 약칭을 쓰지 않고 제타 영점 위치를 직접 표현한 형식 명제다.',
    file: 'main', statementFile: 'statements', declarationPending: false,
    originalLine: 7, compactLine: 7, statementLine: 3,
  },
  {
    id: 'LFunction_ne_zero_of_half_lt_re', group: 'endpoint',
    type: 'DirichletLNonvanishingRightOfHalf',
    declaration: 'theorem LFunction_ne_zero_of_half_lt_re : DirichletLNonvanishingRightOfHalf',
    statement: '모든 디리클레 문자 χ와 s에 대해 Re(s)>1/2이면 L(χ,s)≠0이다. 단 χ가 주문자이고 s=1인 경우는 제외한다.',
    explanation: '오른쪽 반평면 비영점성의 형식 명제다. 주문자의 s=1 극을 명제에서 제외한다.',
    file: 'main', statementFile: 'statements', declarationPending: false,
    originalLine: 9, compactLine: 8, statementLine: 6,
  },
  {
    id: 'LFunction_eq_zero_re', group: 'endpoint',
    type: 'DirichletLZerosOnLine',
    declaration: 'theorem LFunction_eq_zero_re : DirichletLZerosOnLine',
    statement: '0<Re(s)<1인 띠에서 L(χ,s)=0이면 Re(s)=1/2이다.',
    explanation: '모든 디리클레 문자에 대한 임계 띠 영점 위치 명제다.',
    file: 'main', statementFile: 'statements', declarationPending: false,
    originalLine: 10, compactLine: 10, statementLine: 10,
  },
  {
    id: 'LFunction_eq_zero_re_of_isPrimitive', group: 'endpoint',
    type: 'PrimitiveDirichletLZerosOnLine',
    declaration: 'theorem LFunction_eq_zero_re_of_isPrimitive : PrimitiveDirichletLZerosOnLine',
    statement: '원시 디리클레 문자 χ에 대해 0<Re(s)<1이고 L(χ,s)=0이면 Re(s)=1/2이다.',
    explanation: '원시 문자 조건을 명시한 임계 띠 영점 위치 명제다.',
    file: 'main', statementFile: 'statements', declarationPending: false,
    originalLine: 12, compactLine: 12, statementLine: 14,
  },
  { id: 'New.zeta_zeros_on_line', group: 'middle', type: 'New.zeta_zeros_on_line', statement: '오른쪽 반평면 비영점성과 대칭성을 이용해 제타 영점 위치 결론을 얻는 보조 정리.', explanation: 'compact Main.lean에서 최종 제타 명제로 가는 보조 선언 이름을 확인했다. 정확한 정의 본문 위치는 이번 조사 범위 밖이다.', file: 'main', declarationPending: true },
  { id: 'New.grh', group: 'middle', type: 'New.grh', declaration: 'lemma New.grh : DirichletLNonvanishingRightOfHalf', statement: '디리클레 L-함수에 대해 Re(s)>1/2인 영점이 없음을 보이는 핵심 정리.', explanation: '이 lemma의 정확한 타입과 소스 docstring을 확인했다. 증명은 정규화된 primeError 추정과 해석학적 비영점 기준을 결합한다.', file: 'newMain', sourceLine: 156, declarationPending: false },
  { id: 'LFunction_one_sub_eq_zero', group: 'middle', type: 'LFunction_one_sub_eq_zero', statement: '함수 방정식의 대칭 위치에서 영점 조건을 연결하는 보조 선언.', explanation: '원문에서 이름이 등장하는 것은 확인했지만 이 선언 자체의 정의는 별도 조사 대기다.', file: 'newMain', declarationPending: true },
  { id: 'New.zeros_on_line', group: 'middle', type: 'New.zeros_on_line', statement: '일반 L-함수 임계선 결론을 표현하는 보조 선언.', explanation: '일반 보조 정리 자체에는 New.grh가 전역 의존성으로 들어가지 않는다. 최종 적용 단계에서 연결된다.', file: 'newMain', declarationPending: true },
  { id: 'completedRiemannZeta_one_sub', group: 'middle', type: 'completedRiemannZeta_one_sub', statement: '완성 제타 함수의 대칭 관계를 이용하는 보조 선언.', explanation: '원문에서 이름이 등장하는 것은 확인했지만 선언 정의는 별도 조사 대기다.', file: 'newMain', declarationPending: true },
  { id: 'eventually_primeError_le_rpow', group: 'middle', type: 'eventually_primeError_le_rpow', declaration: '∀ᶠ x in atTop, primeError P.d P.N₀ x ≤ x ^ (8 * ε + 2⁻¹ - 1)', statement: '충분히 큰 x에서 정규화된 primeError P.d P.N₀ x ≤ x^(8ε−1/2)를 보인다.', explanation: '이 primeError는 해당 소스의 정규화된 산술 오차 함수다. ψ(x)−x와 같은 함수라고 간주하지 않는다. 타입·가정과 source line을 확인했다.', file: 'newMain', sourceLine: 133, declarationPending: false },
  { id: 'entireL_ne_zero_of_primeError_le', group: 'middle', type: 'entireL_ne_zero_of_primeError_le', statement: 'primeError 상한으로 entire L 함수의 비영점성을 얻는 해석학적 기준.', explanation: '소스 주석은 이 기준을 Landau 보조정리와 연결한다. 전문 해석학 증명은 원문을 참조한다.', file: 'newMain', declarationPending: true },
  { id: 'star_inequality', group: 'middle', type: 'star_inequality', declaration: 'lemma star_inequality {P} {D : Data P} : D.m * D.remainder ≤ D.logB ^ 2 * D.budget', statement: 'admissible data D에서 D.m · D.remainder ≤ D.logB² · D.budget.', explanation: '소스 docstring은 weighted non-split primes의 상한과 admissible data의 주 부등식으로 설명한다.', file: 'newMain', sourceLine: 106, declarationPending: false },
  { id: 'exists_data', group: 'middle', type: 'exists_data', statement: '특정 구간 추정에 사용할 적절한 데이터를 존재시킨다.', explanation: '정의 내용 전체는 아직 수동 확인 목록에 포함되지 않았다.', file: 'newMain', declarationPending: true },
  { id: 'IsPolar.exists_window_sub_mul_le', group: 'middle', type: 'IsPolar.exists_window_sub_mul_le', statement: '극성 조건에서 부등식을 만족하는 창을 선택한다.', explanation: '원문에서 이름이 등장하는 것은 확인했다. 상세 정의와 가정은 미확인이다.', file: 'newMain', declarationPending: true },
  { id: 'exists_family_covolumeSq_le', group: 'middle', type: 'exists_family_covolumeSq_le', statement: '격자의 기본 영역 부피(covolume) 제곱에 상한을 갖는 family의 존재를 다루는 보조 선언.', explanation: '원문에서 이름이 등장하는 것은 확인했다. 전체 모듈과 정의 위치는 미확인이다.', file: 'newMain', declarationPending: true },
  { id: 'integral_forms_long', group: 'middle', type: 'integral_forms_long', statement: '정수형의 긴 적분 표현에 관한 보조 결과.', explanation: '원문에서 이름이 등장하는 것은 확인했다. 전체 정의의 의미는 미확인이다.', file: 'newMain', declarationPending: true },
  { id: 'abs_mainHeight_add_remainder_le', group: 'middle', type: 'abs_mainHeight_add_remainder_le', statement: 'mainHeight와 remainder의 관계를 제한하는 보조 선언.', explanation: '이름만으로 부등식의 정확한 형태를 추론하지 않는다. 원문에서 이름이 등장하는 것은 확인했지만 정의는 미확인이다.', file: 'newMain', declarationPending: true },
];

const edges = [
  ['riemannHypothesis', 'New.zeta_zeros_on_line', 'main'],
  ['riemannHypothesis', 'New.grh', 'main'],
  ['riemannZeta_eq_zero_re', 'riemannHypothesis', 'main'],
  ['LFunction_ne_zero_of_half_lt_re', 'New.grh', 'main'],
  ['LFunction_eq_zero_re', 'New.zeros_on_line', 'main'],
  ['LFunction_eq_zero_re', 'New.grh', 'main'],
  ['LFunction_eq_zero_re_of_isPrimitive', 'LFunction_eq_zero_re', 'main'],
  ['New.grh', 'eventually_primeError_le_rpow', 'newMain'],
  ['New.grh', 'entireL_ne_zero_of_primeError_le', 'newMain'],
  ['eventually_primeError_le_rpow', 'star_inequality', 'newMain'],
  ['eventually_primeError_le_rpow', 'exists_data', 'newMain'],
  ['eventually_primeError_le_rpow', 'IsPolar.exists_window_sub_mul_le', 'newMain'],
  ['star_inequality', 'exists_family_covolumeSq_le', 'newMain'],
  ['star_inequality', 'integral_forms_long', 'newMain'],
  ['star_inequality', 'abs_mainHeight_add_remainder_le', 'newMain'],
  ['New.zeros_on_line', 'LFunction_one_sub_eq_zero', 'newMain'],
  ['New.zeta_zeros_on_line', 'completedRiemannZeta_one_sub', 'newMain'],
].map(([from, to, file], index) => ({
  from, to, file, kind: 'direct', provenance: '수동 원문 확인 · 선언 본문에 이름이 직접 등장 · 2026-11-27', sourceBlob: sourceFiles[file].blob,
  sourceLine: [5, 5, 7, 8, 10, 10, 12, 172, 163, 149, 135, 138, 107, 119, 114, 176, 184][index],
}));

const endpoints = nodes.filter(node => node.group === 'endpoint');
const conceptual = [
  ['산술·기하 비교', '한쪽 primeError 상한', 'conceptual'],
  ['한쪽 primeError 상한', 'L 함수 비영점 기준', 'conceptual'],
  ['L 함수 비영점 기준', '오른쪽 반평면 GRH', 'conceptual'],
  ['오른쪽 반평면 GRH', '함수 방정식·대칭 적용', 'conceptual'],
  ['함수 방정식·대칭 적용', 'RH/GRH 영점 임계선 결론', 'conceptual'],
];

const verifications = {
  original: {
    title: 'Original · 2026-11-20 공개본', asOf: '2026-11-25 22:05 UTC',
    source: 'MIT Andrew Sutherland verification page · first release',
    url: 'https://math.mit.edu/~drew/grh/',
    mainFile: 'originalMain', statementsFile: 'originalStatements', mathlibFile: 'originalMathlib',
    status: 'MIT에 귀속된 검증 보고',
    summary: '175,187개 모듈 컴파일, 다섯 정리의 표준 공리 세 개만 확인, 각 모듈 Lean 커널 재생, nanoda·con-leche·con-ron 및 Lean checker 수락을 보고했다. canonical challenge 비교와 paranoid comparator도 통과했다고 기록했다.',
    caveat: '알포게 공개물은 원래 Git commit 없이 archive로 배포됐다. 공개 당시 소스를 보존한다고 명시한 homeowmorphism/riemann-hypothesis-original의 mirror commit 545e2b54604508ae6845a05d431a9c966cfe7276을 통해 다섯 목표 정리와 명제 정의 파일을 연결했다. 원본 의존 관계 지도는 별도로 검토하지 않았다.',
  },
  compact: {
    title: 'Compact · commit 72fead1', asOf: '2026-11-26 20:46 UTC',
    source: 'MIT Andrew Sutherland verification page · shorter proof',
    url: 'https://math.mit.edu/~drew/shortgrh/',
    mainFile: 'main', statementsFile: 'statements', mathlibFile: 'mathlib',
    status: 'MIT 전체 검증 보고 + 수동 원문 확인 일부',
    summary: '794개 파일·약 76,000줄. Lean v4.35.0, Mathlib 56a00585. 두 머신에서 sandbox build, 모듈별 커널 재생, 독립 checker와 challenge 비교, paranoid comparator 통과가 보고됐다. 다섯 정리는 propext, Classical.choice, Quot.sound만 사용한다.',
    caveat: '17개 간선은 세 pinned source file의 선언 본문에서 이름을 직접 읽은 선별 관계다. 전체 dependency extraction이 아니며, 일부 목적지 선언의 정의 위치는 보류다. MIT 보고는 외부 검증 결과이고 이 사이트에서 전체 프로젝트를 재실행하지 않았다.',
  },
  readable: {
    title: 'Readable · commit 72fead1', asOf: '2026-11-26 20:46 UTC',
    source: 'MIT Andrew Sutherland verification page · shorter proof',
    url: 'https://math.mit.edu/~drew/shortgrh/',
    mainFile: 'readableMain', statementsFile: 'readableStatements', mathlibFile: 'mathlib',
    status: 'MIT 전체 검증 보고',
    summary: '803개 파일·약 300,000줄. 큰 머신의 paranoid comparator가 통과했다. 작은 머신의 재실행은 lean4lean에 332 GB가 필요해 메모리 한계로 중단됐으며 그 실행은 판정이 없다. 개별 checker 및 모듈 재생도 MIT 표에 각각 기록되어 있다.',
    caveat: 'compact 판본의 일부 의존 관계를 readable 판본에 재사용하지 않았다. 두 판본은 같은 다섯 명제를 증명하지만 실제 증명 구조는 다를 수 있다.',
  },
};

const proofReport = 'https://github.com/gmldbs25/build-canvas/blob/514619e969b16855959c4718d86f9734ba1a0e01/docs/riemann-lean/textbook-v2/PROOF-SOURCE-MAP.md';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function badge(label, status) {
  const item = el('span', 'proof-badge', label);
  item.dataset.status = status;
  return item;
}

export function mount(root) {
  const panel = el('div', 'proof-panel');
  const tabs = el('div', 'proof-tabs');
  const buttons = ['endpoints', 'map', 'graph', 'ledger'].map((key, index) => {
    const button = el('button', '', ['다섯 정리', '논증 지도', '직접 의존 관계', '검증 상태'][index]);
    button.type = 'button';
    button.dataset.view = key;
    tabs.append(button);
    return button;
  });
  const versionRow = el('div', 'proof-controls');
  const versionLabel = el('label', 'proof-controls');
  versionLabel.append(el('span', '', '판본'));
  const version = document.createElement('select');
  version.setAttribute('aria-label', '증명 판본 선택');
  for (const key of ['original', 'compact', 'readable']) {
    const option = document.createElement('option'); option.value = key; option.textContent = verifications[key].title; version.append(option);
  }
  versionLabel.append(version);
  versionRow.append(versionLabel);
  const content = el('div', 'proof-card');
  content.setAttribute('aria-live', 'polite');
  panel.append(el('p', 'proof-note', 'MIT의 전체 검증 보고, 원문에서 직접 읽은 부분 그래프, 교육용 논증 도식을 각기 다른 증거 유형으로 표시합니다.'), tabs, versionRow, content);
  root.replaceChildren(panel);
  let view = 'endpoints';
  let selected = 'riemannHypothesis';
  let depth = 'all';
  let endpointFilter = 'riemannHypothesis';

  function sourceLink(fileKey, line) {
    const file = sourceFiles[fileKey];
    const ref = file.commit ?? commit;
    const anchor = el('a', '', file.blob ? `${file.path} · Git blob ${file.blob}` : `${file.path} · ${ref}`);
    anchor.href = `${file.repo ?? 'https://github.com/lsernau/grh-lean'}/blob/${ref}/${file.path}${line ? `#L${line}` : ''}`;
    anchor.target = '_blank'; anchor.rel = 'noreferrer';
    if (line) anchor.textContent += ` · L${line}`;
    return anchor;
  }
  function nodeDepths(start) {
    const depths = new Map([[start, 0]]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of edges) {
        if (!depths.has(edge.from)) continue;
        const d = depths.get(edge.from) + 1;
        if (!depths.has(edge.to) || d < depths.get(edge.to)) { depths.set(edge.to, d); changed = true; }
      }
    }
    return depths;
  }

  function renderEndpoints() {
    content.replaceChildren(el('h4', '', '다섯 개의 검증 목표'));
    const list = el('div', 'proof-node-list');
    endpoints.forEach(node => {
      const button = el('button', 'proof-node', node.id);
      button.type = 'button'; button.setAttribute('aria-current', String(node.id === selected));
      button.addEventListener('click', () => { selected = node.id; render(); });
      list.append(button);
    });
    const node = nodes.find(item => item.id === selected && item.group === 'endpoint') ?? endpoints[0];
    selected = node.id;
    const card = el('article', 'proof-card');
    const meta = el('p', 'proof-meta');
    meta.append(badge('MIT 보고의 목표 정리', 'reported'), el('span', 'proof-note', node.type));
    card.append(meta);
    card.append(el('h4', '', node.id), el('p', '', node.statement), el('p', 'proof-note', node.explanation));
    card.append(badge(node.declarationPending ? 'proof/Main 선언 위치 확인 · Statements 정의 대조 대기' : '선언·정의 확인', 'reported'));
    const source = el('div', 'proof-source');
    const edition = verifications[version.value];
    const statementKey = node.group === 'endpoint'
      ? (node.id === 'riemannHypothesis' ? edition.mathlibFile : edition.statementsFile)
      : node.file;
    const proofKey = node.group === 'endpoint' ? edition.mainFile : node.file;
    source.append(el('span', 'proof-note', '명제 정의:'), sourceLink(statementKey, node.statementLine), el('span', 'proof-note', '증명 선언:'), sourceLink(proofKey, version.value === 'compact' ? node.compactLine : version.value === 'original' ? node.originalLine : null), el('p', 'proof-note', 'Original은 공개 archive가 아니라 공개 당시 코드를 보존한다고 명시한 community mirror commit 545e2b54604508ae6845a05d431a9c966cfe7276을 가리킵니다. Compact/readable은 grh-lean commit 72fead102f663d5c7a407964a13dc0cf9d977207입니다.'));
    card.append(source);
    content.append(list, card);
  }

  function renderMap() {
    content.replaceChildren(el('h4', '', '논증 지도 · 개념적 흐름'));
    content.append(badge('conceptual · 직접 Lean 의존 간선 아님', 'reported'));
    const list = el('ol', 'proof-steps');
    conceptual.forEach(([from, to]) => {
      const li = document.createElement('li');
      li.append(el('span', '', `${from}  →  ${to}`)); list.append(li);
    });
    content.append(list, el('p', 'proof-note', '이 학습 경로는 New/Main.lean의 증명 흐름을 요약한 개념 도식입니다. 코드에 직접 적힌 선언 참조 간선과 혼합하지 않습니다.'));
    const summary = el('p', '');
    summary.textContent = 'primeError는 소스가 정의한 정규화된 산술 오차 함수입니다. ψ(x)−x와 동일시하지 않습니다. 오른쪽 반평면 결과가 얻어진 뒤 함수 방정식 대칭을 적용하는 단계만 직관적으로 연결합니다.';
    content.append(summary);
  }

  function renderGraph() {
    if (version.value !== 'compact') {
      content.replaceChildren(el('h4', '', '선택한 판본의 의존 관계 없음'), badge('수동 원문 확인 간선은 compact만 있음', 'reported'), el('p', '', `${verifications[version.value].title}의 실제 의존 관계를 이 Work에서 별도로 읽거나 추출하지 않았습니다.`), el('p', 'proof-note', 'Compact 판본을 선택하면 17개의 수동 원문 확인 관계를 볼 수 있습니다.'));
      return;
    }
    content.replaceChildren(el('h4', '', '직접 이름 참조 · compact 판본'));
    content.append(badge('수동 원문 확인 부분집합 · 17개 간선 · 정리 → 의존 항목', 'reported'));
    const controls = el('div', 'proof-controls');
    const endpointSelectLabel = el('label', 'proof-controls'); endpointSelectLabel.append(el('span', '', '시작 정리'));
    const startSelect = document.createElement('select'); startSelect.setAttribute('aria-label', '간선 그래프 시작 정리');
    endpoints.forEach(node => { const option = document.createElement('option'); option.value = node.id; option.textContent = node.id; startSelect.append(option); });
    startSelect.value = endpointFilter;
    endpointSelectLabel.append(startSelect);
    const depthLabel = el('label', 'proof-controls'); depthLabel.append(el('span', '', '깊이'));
    const depthSelect = document.createElement('select'); depthSelect.setAttribute('aria-label', '의존성 그래프 깊이');
    [['all', '확인한 간선 전체'], ['1', '1 단계'], ['2', '2 단계'], ['3', '3 단계']].forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; depthSelect.append(option); });
    depthSelect.value = depth;
    depthLabel.append(depthSelect);
    controls.append(endpointSelectLabel, depthLabel);
    const edgeList = el('div', 'proof-edge-list');
    const detail = el('article', 'proof-card');
    function drawEdges() {
      endpointFilter = startSelect.value; depth = depthSelect.value;
      const depths = nodeDepths(endpointFilter);
      const visible = depth === 'all' ? edges : edges.filter(edge => depths.has(edge.from) && depths.get(edge.from) < Number(depth) && depths.has(edge.to) && depths.get(edge.to) <= Number(depth));
      edgeList.replaceChildren();
      visible.forEach(edge => {
        const button = el('button', 'proof-edge'); button.type = 'button';
        button.append(el('code', '', edge.from), el('span', '', '→'), el('code', '', edge.to));
        button.setAttribute('aria-current', String(selected === edge.from || selected === edge.to));
        button.addEventListener('click', () => { selected = edge.from; drawEdges(); renderEdge(edge); });
        edgeList.append(button);
      });
      if (!visible.length) edgeList.append(el('p', 'proof-note', '이 시작점과 깊이에서 확인한 간선이 없습니다.'));
      content.replaceChildren(el('h4', '', '직접 이름 참조 · compact 판본'), badge(`표시 ${visible.length} / 17`, 'verified'), controls, edgeList, detail);
      renderNode(selected);
    }
    function renderNode(id) {
      const node = nodes.find(item => item.id === id);
      if (!node) return;
      detail.replaceChildren(el('h4', '', node.id), badge(node.group === 'endpoint' ? 'MIT 목표 정리' : '원문에서 이름 확인', 'reported'), el('p', '', node.statement), el('p', 'proof-note', node.explanation));
      const source = el('div', 'proof-source');
    source.append(sourceLink(node.file, node.sourceLine), el('p', 'proof-note', `${sourceFiles[node.file].blob ? `Git blob ${sourceFiles[node.file].blob}` : '고정 commit permalink'} · 원문에서 해당 선언 본문을 확인. ${node.declarationPending ? '더 넓은 정의/의존 관계 확인은 대기 중.' : ''}`));
      if (node.declaration) detail.append(el('pre', 'proof-code', node.declaration));
      detail.append(source);
    }
    function renderEdge(edge) {
      detail.replaceChildren(el('h4', '', `${edge.from}  →  ${edge.to}`), badge('수동 원문 확인 · 직접 이름 참조', 'reported'), el('p', 'proof-note', '이 이름이 선언 본문에 직접 적힌 것을 확인했습니다. 전체 전이 의존성을 뜻하지 않습니다.'));
      const source = el('div', 'proof-source');
      source.append(el('span', 'proof-note', '간선 근거:'), sourceLink(edge.file, edge.sourceLine), el('p', 'proof-note', `파일 blob ${edge.sourceBlob}${edge.sourceLine ? ` · L${edge.sourceLine}에서 이름을 확인` : ' · 파일에서 해당 선언 본문을 확인'}`));
      detail.append(source);
    }
    startSelect.addEventListener('change', drawEdges);
    depthSelect.addEventListener('change', drawEdges);
    drawEdges();
  }

  function renderLedger() {
    const key = version.value;
    const record = verifications[key];
    content.replaceChildren(el('h4', '', record.title), badge(record.status, key === 'compact' ? 'verified' : 'reported'));
    content.append(el('p', '', record.summary), el('p', 'proof-note', `기준 시각: ${record.asOf}`), el('p', 'proof-note', record.caveat));
    const source = el('div', 'proof-source');
    const mit = el('a', '', record.source); mit.href = record.url; mit.target = '_blank'; mit.rel = 'noreferrer';
    source.append(mit);
    if (key !== 'original') {
      const edition = key === 'compact' ? 'grh-compact' : 'grh';
      const repo = el('a', '', `고정 upstream source · ${edition}/src/Main.lean`);
      repo.href = `${base}/${edition}/src/Main.lean`; repo.target = '_blank'; repo.rel = 'noreferrer'; source.append(repo);
    } else {
      const archive = el('a', '', '원본 Lean archive verification record'); archive.href = 'https://alpo.ge/remark.pdf'; archive.target = '_blank'; archive.rel = 'noreferrer'; source.append(archive);
      const mirrorMain = sourceLink('originalMain');
      mirrorMain.textContent = '원본 보존 mirror · src/Main.lean · 545e2b54604508ae6845a05d431a9c966cfe7276';
      const mirrorStatements = sourceLink('originalStatements');
      mirrorStatements.textContent = '원본 보존 mirror · src/Statements.lean · 545e2b54604508ae6845a05d431a9c966cfe7276';
      source.append(mirrorMain, mirrorStatements);
    }
    source.append(el('a', '', 'Work08의 17개 직접 참조 기록'), Object.assign(el('a', '', 'PROOF-SOURCE-MAP.md'), { href: proofReport }));
    content.append(source, el('p', 'proof-note', '여기에 표시한 MIT 상태는 외부 검사 보고입니다. 이 프로젝트가 whole proof를 빌드하거나 재검사했다는 뜻이 아닙니다.'));
  }

  function render() {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    versionRow.hidden = false;
    if (view === 'endpoints') renderEndpoints();
    else if (view === 'map') renderMap();
    else if (view === 'graph') renderGraph();
    else renderLedger();
  }
  buttons.forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
  version.addEventListener('change', render);
  render();
  return {};
}
