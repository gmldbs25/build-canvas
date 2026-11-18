export const modernEras = {
  2023: {
    caption: 'Google Search Labs · Generative AI Search',
    hint: '한국어 예시 질문을 검색하고, AI 요약이 나타난 뒤 아래 웹 결과도 열어 보세요.',
    notes: '2023년 Search Labs에서 생성형 AI 검색 경험(SGE)이 실험됐습니다. 이 장면은 검색 결과 위에 요약과 출처를 보여 주던 방식을 가상의 Orbit Search로 재구성했습니다. 응답과 링크는 이 전시 안에서 동작하는 시뮬레이션입니다.',
    sources: [['Google · Generative AI in Search (Search Labs)', 'https://blog.google/products-and-platforms/products/search/generative-ai-search/']],
    base: 'https://orbitsearch.example/',
    pages: {
      home: ['Orbit Search', ''],
      result: ['AI answer · Orbit Search', 'answers/observing-night'],
      notice: ['Observing Night · Observatory Bulletin', 'https://observatory.example/news/2023-observing-night'],
      archive: ['November Schedule · Observatory Calendar', 'https://calendar.example/2023/november'],
    },
  },
  2025: {
    caption: 'Modern browser · Agent workspace',
    hint: '작업을 맡기고 에이전트가 확인한 공지를 살펴보세요. 승인하면 2013년 보드에도 카드가 추가됩니다.',
    notes: '브라우저 에이전트는 웹 문서를 읽고 화면의 버튼과 입력란을 사용해 작업할 수 있습니다. 이 장면에서는 가상 관측회 공지와 보드로 작업 과정과 승인 시점을 체험합니다.',
    sources: [
      ['OpenAI · ChatGPT agent in 2025', 'https://openai.com/index/introducing-chatgpt-agent/'],
      ['Google · Chrome auto browse in 2026', 'https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/'],
      ['Chrome for Developers · WebMCP origin trial', 'https://developer.chrome.com/blog/ai-webmcp-origin-trial'],
    ],
    base: 'https://observatory.example/',
    pages: {
      home: ['North Ridge Observatory', ''],
      bulletin: ['Observing Night · Event Bulletin', 'events/observing-night'],
      schedule: ['Public Nights · Community Calendar', 'https://calendar.example/2025/november'],
      board: ['Observing Night · Fieldwork', 'https://fieldwork.example/b/observing-night'],
      tools: ['Field Notes · A web for agents', 'journal/2026-tools'],
    },
  },
};

const timeQuestion = '이번 주 관측회는 몇 시야?';
const placeQuestion = '관측회는 어디서 열려?';
const request = '관측회 시간을 찾아 준비 보드에 추가해 줘.';
const draft = {
  key: 'observing-night-agent-date',
  title: 'Add Saturday observing time',
  description: 'Saturday, 15 November 2025 at 8:30 p.m. · North Ridge Observatory, West Terrace. Verified against the event bulletin and public calendar.',
};

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function sceneLink(era, page, label, current = false) {
  return `<a href="?era=${era}&amp;page=${page}" data-page="${page}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
}

function searchAnswer(topic, progress) {
  const time = topic !== 'place';
  const first = time
    ? 'North Ridge Observatory’s next public Observing Night is <strong>Saturday, 18 November 2023</strong>.'
    : 'The public Observing Night takes place on the <strong>West Terrace at North Ridge Observatory</strong>.';
  const second = time
    ? 'The event begins at <strong>8:30 p.m.</strong>; the terrace opens at 8:15 p.m.'
    : 'Use the <strong>north entrance on Ridge Road</strong> to reach the terrace.';
  const third = time
    ? 'The official notice and community calendar agree on the start time.'
    : 'The observatory notice and public calendar both list the West Terrace.';
  return `<article class="ai-overview" aria-labelledby="ai-overview-title">
    <div class="ai-overview-heading"><div><span class="answer-label"><span aria-hidden="true">✦</span> Orbit Search AI overview</span><span class="experiment-label">Search Labs experiment · simulated</span></div><span class="overview-spark" aria-hidden="true">✧</span></div>
    <h3 id="ai-overview-title">Observing Night</h3>
    <div class="answer-copy">
      ${progress >= 1 ? `<p>${first}</p>` : ''}
      ${progress >= 2 ? `<p>${second}</p>` : ''}
      ${progress >= 3 ? `<p>${third} <sup>${sceneLink(2023, 'notice', '<span class="sr-only">Source </span>1')} ${sceneLink(2023, 'archive', '<span class="sr-only">Source </span>2')}</sup></p>` : ''}
    </div>
    ${progress >= 3 ? `<div class="overview-sources" aria-label="Cited sources">
      ${sceneLink(2023, 'notice', '<span>1</span> North Ridge Observatory')}
      ${sceneLink(2023, 'archive', '<span>2</span> Community Calendar')}
    </div><p class="overview-disclaimer">AI-generated summary · Check the source pages for details.</p>` : ''}
  </article>`;
}

function webResults(topic) {
  const time = topic !== 'place';
  const firstSnippet = time
    ? 'Public observing begins Saturday, 18 November at 8:30 p.m. The terrace opens at 8:15 p.m.'
    : 'Find the West Terrace using the north entrance on Ridge Road. Doors open before the program.';
  const secondSnippet = time
    ? 'This month’s calendar lists North Ridge Observatory’s public program for Saturday evening.'
    : 'The observatory calendar lists the public program and points visitors to the official notice for updates.';
  return `<section class="web-results" aria-label="Web results">
    <h3>Web results</h3>
    <article class="web-result">
      <span class="result-domain">observatory.example <small>› news › 2023-observing-night</small></span>
      ${sceneLink(2023, 'notice', time ? 'Observing Night · North Ridge Observatory' : 'Visit the West Terrace · North Ridge Observatory')}
      <p>${firstSnippet}</p>
    </article>
    <article class="web-result">
      <span class="result-domain">calendar.example <small>› 2023 › november</small></span>
      ${sceneLink(2023, 'archive', time ? 'November public nights calendar' : 'Directions and public nights calendar')}
      <p>${secondSnippet}</p>
    </article>
  </section>`;
}

function searchOutputMarkup(status, progress, topic) {
  if (status === 'loading' && progress === 0) {
    return `<div class="search-loading" data-search-stage="loading">
      <div class="loading-title"><span class="search-loader" aria-hidden="true"></span><strong>Searching the web</strong></div>
      <p>Finding useful pages for this question…</p>
      <progress id="search-progress" max="100" value="4" aria-label="Search progress"></progress>
    </div>`;
  }
  if (status === 'loading') {
    return `<div class="search-generation" data-search-stage="answer-${progress}">
      <progress id="search-progress" max="100" value="${progress * 27}" aria-label="Answer generation progress"></progress>
      ${searchAnswer(topic, progress)}
    </div>`;
  }
  return `<div class="search-ready" data-search-stage="complete">
    ${searchAnswer(topic, 3)}
    ${webResults(topic)}
  </div>`;
}

function searchSourcePage(page) {
  const official = page === 'notice';
  return `<article class="search-document">
    <header><span>${official ? 'North Ridge Observatory' : 'Community Calendar'}</span>
      ${sceneLink(2023, 'result', '← Back to AI answer')}</header>
    <div class="search-document-body">
      <p class="site-kicker">${official ? 'PUBLIC PROGRAMS / NOVEMBER 2023' : 'COMMUNITY EVENTS / NOVEMBER 2023'}</p>
      <h2>${official ? 'Observing Night' : 'November Schedule'}</h2>
      <p class="source-datetime"><time datetime="2023-11-18T20:30">Saturday, 18 November 2023 · 8:30 p.m.</time></p>
      <p>Bring a warm layer and join local volunteers at the <strong>West Terrace, North Ridge Observatory</strong>. Use the north entrance on Ridge Road.</p>
      <p>${official ? 'The terrace opens at 8:15 p.m. Telescopes will be available, and visitors are welcome to bring a red flashlight.' : 'Calendar entry supplied by North Ridge Observatory. Please check the observatory notice for weather changes.'}</p>
      ${sceneLink(2023, official ? 'archive' : 'notice', official ? 'View the calendar listing →' : 'Read the official event notice →')}
    </div>
  </article>`;
}

function searchMarkup(page, question, topic, searchStatus, searchProgress) {
  if (page === 'notice' || page === 'archive') return searchSourcePage(page);
  const landing = page === 'home';
  return `<article class="search-page${landing ? ' is-landing' : ''}">
    <header class="search-header">
      ${sceneLink(2023, 'home', '<span class="orbit-search-mark" aria-hidden="true">◈</span> Orbit Search')}
      <nav aria-label="Search navigation">
        ${sceneLink(2023, 'home', 'Search', landing)}
      </nav>
    </header>
    <section class="search-body">
      <div class="search-heading">
        <h2>${landing ? '<span class="orbit-search-mark" aria-hidden="true">◈</span> Orbit Search' : 'Search results'}</h2>
        ${landing ? '<p>Search the web, then explore a generated overview.</p>' : ''}
      </div>
      <form class="search-form">
        <label class="sr-only" for="search-question">Search the web</label>
        <input id="search-question" name="question" type="search" value="${escapeHtml(question)}" maxlength="160" required>
        <button type="submit"><span aria-hidden="true">⌕</span> Search</button>
      </form>
      <p id="search-message" class="search-message" lang="ko" role="status"></p>
      ${landing ? `<div class="search-suggestions" lang="ko"><span>예시 질문</span>
        <button type="button" data-search="time">${timeQuestion}</button>
        <button type="button" data-search="place">${placeQuestion}</button>
      </div><p class="search-hint" lang="ko">전시 자료로 검색 동작을 재현합니다.</p>` : `<div class="search-result-shell">
        <p id="search-status" class="search-status" lang="ko" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(searchStatusMessage(searchStatus, searchProgress))}</p>
        <div class="search-output">${searchOutputMarkup(searchStatus, searchProgress, topic)}</div>
      </div>`}
    </section>
  </article>`;
}

function searchStatusMessage(status, progress) {
  if (status === 'loading' && progress === 0) return '웹에서 이 질문과 관련된 페이지를 검색하고 있습니다.';
  if (status === 'loading' && progress === 1) return 'AI 개요에 날짜 정보를 정리하고 있습니다.';
  if (status === 'loading' && progress === 2) return '시작 시간과 장소 정보를 더하고 있습니다.';
  if (status === 'loading') return '출처를 확인하고 요약을 마무리하고 있습니다.';
  return 'AI 개요와 웹 검색 결과가 준비됐습니다.';
}

function classifyQuestion(value, fallback) {
  const text = value.toLowerCase();
  const aboutEvent = /관측(?:회| 행사|소)|observing night|star party|observatory/.test(text);
  const followUp = /^(?:몇\s*시(?:야|예요)?|언제(?:야|예요)?|어디(?:야|예요)?|when|where)[?.!\s]*$/.test(text);
  if (!aboutEvent && !followUp) return null;
  if (/어디|장소|\bwhere\b|location|address/.test(text)) return 'place';
  if (/시간|몇\s*시|언제|\bwhen\b|\btime\b|\bstart/.test(text)) return 'time';
  return fallback;
}

function boardLane(board) {
  const cards = board.snapshot().filter((card) => card.lane === 0);
  return `<h3>To do <span>${cards.length}</span></h3>
    <ul>${cards.map((card) => `<li><strong>${escapeHtml(card.title)}</strong>${card.description ? `<span>${escapeHtml(card.description)}</span>` : ''}</li>`).join('')}</ul>`;
}

function observatoryPage(page, board) {
  if (page === 'board') {
    return `<div class="observatory-article modern-board">
      <p class="site-kicker">FIELDWORK / COMMUNITY TEAM</p>
      <h2>Observing Night Board</h2>
      <div class="modern-board-lane">${boardLane(board)}</div>
      <a href="?era=2013" data-era="2013">Open the 2013 Fieldwork board →</a>
    </div>`;
  }
  if (page === 'tools') {
    return `<div class="observatory-article">
      <p class="site-kicker">FIELD NOTES / 2026</p>
      <h2>A web for agents</h2>
      <div lang="ko" class="future-note">
        <p>2026년에는 에이전트가 브라우저 안에 들어오고, 웹사이트가 에이전트에 사용할 기능을 직접 알려주는 방식이 실험되기 시작했습니다.</p>
        <p>WebMCP 같은 실험에서는 웹페이지가 ‘행사 조회’나 ‘카드 초안 만들기’처럼 기능의 이름과 입력 항목을 브라우저에 전달합니다.</p>
        <p><a href="https://developer.chrome.com/blog/ai-webmcp-origin-trial" target="_blank" rel="noopener">Chrome의 WebMCP 실험 자료 ↗</a></p>
      </div>
    </div>`;
  }
  if (page === 'bulletin' || page === 'schedule') {
    const isBulletin = page === 'bulletin';
    return `<div class="observatory-article">
      <p class="site-kicker">${isBulletin ? 'NORTH RIDGE OBSERVATORY / EVENT BULLETIN' : 'COMMUNITY CALENDAR / NOVEMBER 2025'}</p>
      <h2>${isBulletin ? 'Observing Night' : 'Public Nights Schedule'}</h2>
      <div class="event-facts"><span>Sat, 15 Nov 2025</span><strong>8:30 p.m.</strong><span>West Terrace</span></div>
      <p>${isBulletin
        ? 'Join the observatory team for the November public observing night. The terrace opens at 8:15 p.m. and observing begins at 8:30 p.m.'
        : 'North Ridge Observatory confirmed that observing begins at 8:30 p.m. on Saturday, 15 November. This entry was updated after the event bulletin was published.'}</p>
      <p>Meet at the West Terrace, using the Ridge Road entrance. Bring a warm layer and a red flashlight.</p>
      ${sceneLink(2025, isBulletin ? 'schedule' : 'bulletin', isBulletin ? 'Check the community calendar →' : 'Read the event bulletin →')}
    </div>`;
  }
  return `<div class="observatory-home">
    <div class="observatory-hero">
      <span class="site-kicker">NORTH RIDGE · PUBLIC OBSERVATORY</span>
      <h2>Look up.<br>Stay curious.</h2>
      ${sceneLink(2025, 'bulletin', 'Explore our next public night →')}
    </div>
    <div class="observatory-visit">
      <h3>Observing Night</h3>
      <p>Join a volunteer astronomer on our West Terrace for an evening under the stars.</p>
      ${sceneLink(2025, 'schedule', 'View public calendar →')}
    </div>
  </div>`;
}

function taskLog(includeCalendar = true) {
  return `<ol class="agent-log">
    <li><span aria-hidden="true">✓</span><div><strong>행사 공지에서 시작 시간 확인</strong>${sceneLink(2025, 'bulletin', 'Observing Night 공지 ↗')}</div></li>
    ${includeCalendar ? `<li><span aria-hidden="true">✓</span><div><strong>공개 일정표의 시간과 비교</strong>${sceneLink(2025, 'schedule', 'Public Nights 일정표 ↗')}</div></li>` : ''}
  </ol>`;
}

function agentPanel(phase) {
  if (phase === 'idle') {
    return `<p class="agent-intro">웹의 공지와 일정표를 대조해 준비 보드에 넣을 정보를 찾아봅니다.</p>
      <p class="agent-prompt">${request}</p>
      <button type="button" class="agent-primary" data-agent="run">작업 맡기기 <span aria-hidden="true">→</span></button>`;
  }
  if (phase === 'reading' || phase === 'comparing') {
    return `<div class="agent-request">${request}</div>
      ${phase === 'comparing' ? taskLog(false) : ''}
      <p class="agent-reading"><span aria-hidden="true"></span>${phase === 'reading' ? '관측소의 행사 공지를 읽고 있습니다.' : '공개 일정표와 비교하고 있습니다.'}</p>
      <button type="button" class="agent-secondary" data-agent="cancel">작업 중지</button>`;
  }
  if (phase === 'applied') {
    return `<div class="agent-request">${request}</div>
      ${taskLog()}
      <div class="agent-review"><strong>준비 보드에 카드가 추가됐습니다.</strong><p lang="en">${draft.title}</p>
        ${sceneLink(2025, 'board', '추가한 카드 보기 →')}</div>
      <p class="agent-epilogue">${sceneLink(2025, 'tools', '2026년: 에이전트에 맞춰 바뀌는 웹 →')}</p>`;
  }
  return `<div class="agent-request">${request}</div>
    ${taskLog()}
    <div class="agent-review"><p>두 출처에 같은 시간이 적혀 있어요. 아래 카드를 추가할까요?</p>
      <strong lang="en">${draft.title}</strong><p lang="en">Sat, 15 Nov · 8:30 p.m. · West Terrace</p>
    </div>
    <div class="agent-buttons">
      <button type="button" class="agent-primary" data-agent="approve">카드 추가 승인</button>
      <button type="button" class="agent-secondary" data-agent="cancel">취소</button>
    </div>`;
}

function agentMarkup(page, board, phase) {
  return `<article class="agent-workspace">
    <section class="observatory" aria-label="Observatory website">
      <header class="observatory-header">
        ${sceneLink(2025, 'home', '<span aria-hidden="true">✦</span> North Ridge')}
        <nav aria-label="Observatory navigation">
          ${sceneLink(2025, 'bulletin', 'Bulletin', page === 'bulletin')}
          ${sceneLink(2025, 'schedule', 'Calendar', page === 'schedule')}
          ${sceneLink(2025, 'board', 'Fieldwork', page === 'board')}
        </nav>
      </header>
      ${observatoryPage(page, board)}
    </section>
    <aside class="agent-side" lang="ko" aria-labelledby="agent-title" data-phase="${phase}">
      <div class="agent-title"><span aria-hidden="true">✦</span><h3 id="agent-title">브라우저 에이전트</h3></div>
      <div class="agent-panel" aria-live="polite">${agentPanel(phase)}</div>
    </aside>
  </article>`;
}

export function createModern(board) {
  let question = timeQuestion;
  let topic = 'time';
  let searchStatus = 'complete';
  let searchProgress = 3;
  let searchGeneration = 0;
  let searchTimers = [];
  let activeSearchRoot = null;
  let phase = 'idle';
  let taskTimer;

  function clearSearchTimers() {
    searchGeneration += 1;
    searchTimers.forEach(clearTimeout);
    searchTimers = [];
  }

  function finishInterruptedSearch() {
    clearSearchTimers();
    if (searchStatus === 'loading') {
      searchStatus = 'complete';
      searchProgress = 3;
    }
  }

  function updateSearchOutput(root) {
    const status = root.querySelector('#search-status');
    const output = root.querySelector('.search-output');
    if (!status || !output) return;
    status.textContent = searchStatusMessage(searchStatus, searchProgress);
    output.innerHTML = searchOutputMarkup(searchStatus, searchProgress, topic);
  }

  function completeSearchOutput(root) {
    const status = root.querySelector('#search-status');
    const output = root.querySelector('.search-output');
    const generation = output?.querySelector('.search-generation');
    if (!status || !output || !generation || searchProgress < 3) {
      updateSearchOutput(root);
      return;
    }
    status.textContent = searchStatusMessage(searchStatus, searchProgress);
    generation.dataset.searchStage = 'complete';
    generation.querySelector('#search-progress')?.remove();
    generation.insertAdjacentHTML('beforeend', webResults(topic));
  }

  function animateSearch(root) {
    clearSearchTimers();
    searchStatus = 'loading';
    searchProgress = 0;
    updateSearchOutput(root);
    const generation = searchGeneration;
    const stages = [
      [450, 1],
      [900, 2],
      [1410, 3],
      [1850, 4],
    ];
    for (const [delay, stage] of stages) {
      searchTimers.push(setTimeout(() => {
        if (generation !== searchGeneration || searchStatus !== 'loading') return;
        if (stage === 4) {
          searchStatus = 'complete';
          searchProgress = 3;
          searchTimers = [];
        } else searchProgress = stage;
        const target = activeSearchRoot?.isConnected ? activeSearchRoot : root;
        if (stage === 4) completeSearchOutput(target);
        else updateSearchOutput(target);
      }, delay));
    }
  }

  function updateSidebar(focus = false) {
    const sidebar = document.querySelector('#exhibit-view:not([hidden]) [data-era="2025"] .agent-side');
    if (!sidebar) return;
    const panel = sidebar.querySelector('.agent-panel');
    const shouldFocus = focus || panel.contains(document.activeElement);
    sidebar.dataset.phase = phase;
    panel.innerHTML = agentPanel(phase);
    if (shouldFocus) {
      panel.querySelector('[data-agent="approve"], [data-agent="run"], [data-agent="cancel"], .agent-review a')?.focus({ preventScroll: true });
    }
  }

  function beginTask() {
    phase = 'reading';
    taskTimer = setTimeout(() => {
      phase = 'comparing';
      updateSidebar();
      taskTimer = setTimeout(() => {
        phase = 'review';
        updateSidebar();
      }, 680);
    }, 520);
  }

  function markup(era, page) {
    return String(era) === '2023' ? searchMarkup(page, question, topic, searchStatus, searchProgress) : agentMarkup(page, board, phase);
  }

  function init(root, era, page, goTo) {
    if (String(era) === '2023') {
      if (page !== 'result') {
        activeSearchRoot = null;
        finishInterruptedSearch();
      } else activeSearchRoot = root;
      const form = root.querySelector('.search-form');
      if (!form) return;
      const search = form.elements.question;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = search.value.trim();
        const match = classifyQuestion(value, topic);
        if (!match) {
          root.querySelector('#search-message').textContent = '이 전시에서는 관측회 시간이나 장소를 물어볼 수 있어요.';
          return;
        }
        topic = match;
        question = value;
        root.querySelector('#search-message').textContent = '';
        if (page === 'result') animateSearch(root);
        else {
          clearSearchTimers();
          searchStatus = 'loading';
          searchProgress = 0;
          goTo('result');
        }
      });
      for (const button of root.querySelectorAll('[data-search]')) {
        button.addEventListener('click', () => {
          search.value = button.dataset.search === 'place' ? placeQuestion : timeQuestion;
          form.requestSubmit();
        });
      }
      if (page === 'result' && searchStatus === 'loading' && searchTimers.length === 0) animateSearch(root);
      return;
    }

    activeSearchRoot = null;
    finishInterruptedSearch();

    const sidebar = root.querySelector('.agent-side');
    sidebar.addEventListener('click', (event) => {
      const action = event.target.closest('[data-agent]')?.dataset.agent;
      if (!action) return;
      let destination = page;
      if (action === 'run') {
        beginTask();
        destination = 'bulletin';
      } else if (action === 'approve') {
        board.addCard(draft);
        phase = 'applied';
        destination = 'board';
      } else {
        clearTimeout(taskTimer);
        phase = 'idle';
      }

      if (destination !== page) {
        goTo(destination, false);
      } else if (phase === 'applied') {
        root.querySelector('.modern-board-lane').innerHTML = boardLane(board);
      }

      updateSidebar(true);
    });
  }

  return { markup, init };
}
