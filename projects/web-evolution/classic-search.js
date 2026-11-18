const DEFAULT_QUERY = 'lunar eclipse';
const LEGACY_QUERY = 'North Ridge public observing night';
const eventDate = 'Saturday, October 13, 2001';
const eventTime = '8:00 p.m.';
const eventPlace = 'West Terrace, North Ridge Observatory';

export const classicSearchEra = {
  caption: 'Netscape Navigator 6 · Google Web Search',
  hint: '“lunar eclipse” 또는 “North Ridge public observing night”를 검색해 보세요. 결과가 차례로 나타나고, 각 보관 문서 링크는 전시 안에서 열립니다.',
  notes: '2001년 Google Web Search는 성장하던 웹 검색 서비스 중 하나였습니다. Yahoo는 2000년에 Google을 기본 검색 공급자로 선택했습니다. 이 장면은 Google의 일반 텍스트 출처 표기와 당시 검색 결과 목록을 참고해 새로 구성했습니다. 결과는 전시용 로컬 검색 색인에서 만들어지며 검색어가 외부로 전송되지 않습니다.',
  sources: [
    ['Google · Search history', 'https://www.google.com/search/howsearchworks/our-history/'],
    ['Google Press · Yahoo selects Google (2000)', 'https://googlepress.blogspot.com/2000/06/yahoo-selects-google-as-its-default.html'],
    ['NASA · Lunar Eclipses, 2001–2010', 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2001.html'],
    ['NASA · Total Lunar Eclipse, 9 January 2001', 'https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2001Jan09T.pdf'],
  ],
  base: 'http://www.google.com/',
  pages: {
    home: ['Web Search', ''],
    results: ['Search results', 'search'],
    bulletin: ['Observing Night Bulletin · North Ridge Observatory', 'http://www.northridge.example/observatory/bulletins/2001-10-13.html'],
    club: ['Public Observing Nights · North Ridge Astronomy Club', 'http://www.northridgeastro.example/events/2001-calendar.html'],
    'eclipse-jan': ['Total Lunar Eclipse · 9 January 2001', 'https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2001Jan09T.pdf'],
    'eclipse-catalog': ['Lunar Eclipses · 2001–2010', 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2001.html'],
    'eclipse-july': ['Partial Lunar Eclipse · 5 July 2001', 'https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2001Jul05P.pdf'],
    'time-jan': ['January 2001 Lunar Eclipse · Visibility', 'https://www.timeanddate.com/eclipse/lunar/2001-january-9'],
    'time-july': ['July 2001 Lunar Eclipse · Visibility', 'https://www.timeanddate.com/eclipse/lunar/2001-july-5'],
    'lunar-basics': ['How a Lunar Eclipse Works', 'https://www.britannica.com/science/lunar-eclipse'],
    'eclipse-library': ['Lunar Eclipse Learning Center', 'https://www.exploratorium.edu/eclipse'],
    'moon-gallery': ['Lunar Eclipse Images · Astronomy Picture Archive', 'https://apod.nasa.gov/apod/archivepix.html'],
  },
};

const index = [
  {
    page: 'eclipse-jan', title: 'Total Lunar Eclipse of 2001 January 9', host: 'eclipse.gsfc.nasa.gov', path: '/LEplot/LEplot2001/LE2001Jan09T.pdf',
    snippet: 'NASA’s eclipse table records a total lunar eclipse on 9 January 2001. The diagrams show the Moon’s path through Earth’s shadow.',
    keywords: 'lunar eclipse total january 9 2001 nasa earth shadow umbra visibility', rank: 1,
  },
  {
    page: 'eclipse-catalog', title: 'Lunar Eclipses: 2001–2010', host: 'eclipse.gsfc.nasa.gov', path: '/LEdecade/LEdecade2001.html',
    snippet: 'NASA’s decade catalog lists the dates, type and visibility maps for lunar eclipses from 2001 through 2010.',
    keywords: 'lunar eclipse eclipses calendar dates 2001 2010 nasa catalog', rank: 2,
  },
  {
    page: 'time-jan', title: 'January 9, 2001 Lunar Eclipse: dates and visibility', host: 'timeanddate.com', path: '/eclipse/lunar/2001-january-9',
    snippet: 'An event page for the 9 January lunar eclipse, with local viewing circumstances and eclipse stages.',
    keywords: 'lunar eclipse total january 9 2001 visibility event timeanddate', rank: 3,
  },
  {
    page: 'eclipse-july', title: 'Partial Lunar Eclipse of 2001 July 5', host: 'eclipse.gsfc.nasa.gov', path: '/LEplot/LEplot2001/LE2001Jul05P.pdf',
    snippet: 'A second 2001 lunar eclipse entry shows part of the Moon crossing Earth’s dark umbral shadow.',
    keywords: 'lunar eclipse partial july 5 2001 nasa shadow', rank: 4,
  },
  {
    page: 'time-july', title: 'July 5, 2001 Lunar Eclipse: dates and visibility', host: 'timeanddate.com', path: '/eclipse/lunar/2001-july-5',
    snippet: 'A lunar event listing with local times and a visibility map for the partial eclipse of 5 July 2001.',
    keywords: 'lunar eclipse partial july 5 2001 visibility event timeanddate', rank: 5,
  },
  {
    page: 'lunar-basics', title: 'Lunar eclipse: umbra, penumbra and the Moon', host: 'britannica.com', path: '/science/lunar-eclipse',
    snippet: 'A lunar eclipse occurs when the Moon moves into Earth’s shadow. The umbra and penumbra explain the different eclipse appearances.',
    keywords: 'lunar eclipse earth shadow umbra penumbra moon astronomy guide', rank: 6,
  },
  {
    page: 'eclipse-library', title: 'Eclipse science and observing activities', host: 'exploratorium.edu', path: '/eclipse',
    snippet: 'An astronomy learning collection introduces eclipse geometry and ways to observe the changing shadow.',
    keywords: 'lunar eclipse earth shadow astronomy education observatory activity', rank: 7,
  },
  {
    page: 'moon-gallery', title: 'Lunar eclipse images in the astronomy archive', host: 'apod.nasa.gov', path: '/apod/archivepix.html',
    snippet: 'Browse astronomy image captions that explain the Moon’s copper color during totality and the geometry of an eclipse.',
    keywords: 'lunar eclipse moon images red copper totality nasa astronomy picture archive', rank: 8,
  },
  {
    page: 'bulletin', title: 'Observing Night Bulletin — North Ridge Observatory', host: 'www.northridge.example', path: '/observatory/bulletins/2001-10-13.html',
    snippet: 'The local bulletin gives the North Ridge public observing night date, start time, terrace location and a cloud backup plan.',
    keywords: 'north ridge public observing night bulletin moon lunar eclipse october 2001', rank: 9,
  },
  {
    page: 'club', title: 'Public observing nights — North Ridge Astronomy Club', host: 'www.northridgeastro.example', path: '/events/2001-calendar.html',
    snippet: 'The club calendar lists the local public night and a lunar viewing program with volunteer telescopes.',
    keywords: 'north ridge public observing night astronomy club calendar lunar eclipse moon 2001', rank: 10,
  },
];

const stopWords = new Set(['a', 'an', 'and', 'are', 'for', 'in', 'of', 'on', 'the', 'to', 'with']);
const stageCounts = [0, 3, 5, 8, 10];
const stageMessages = [
  'Searching the local web index…',
  'Reading page titles and keyword matches…',
  'Checking archive descriptions…',
  'Sorting the most relevant pages…',
  'Search complete. These pages are from the exhibit archive.',
];
const stageLabels = [
  'Send the query to the local index',
  'Match page titles and keywords',
  'Read archived descriptions',
  'Sort results by relevance',
];

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function internalLink(page, label, className = '') {
  return `<a href="?era=2001&amp;page=${encodeURIComponent(page)}" data-page="${escapeHtml(page)}"${className ? ` class="${className}"` : ''}>${label}</a>`;
}

function searchForm(query, searchId = 'classic-search-query') {
  return `<form class="classic-search-form" role="search">
    <label class="sr-only" for="${searchId}">Search the exhibit’s local Web index</label>
    <input id="${searchId}" name="query" type="search" value="${escapeHtml(query)}" maxlength="120" autocomplete="off" required>
    <button type="submit">Search</button>
  </form>`;
}

function tokensFor(value) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g) || [])].filter((word) => !stopWords.has(word));
}

function findResults(query) {
  const terms = tokensFor(query);
  if (!terms.length) return [];
  const scored = index.map((item) => {
    const title = item.title.toLowerCase();
    let score = 0;
    let matched = 0;
    for (const term of terms) {
      let termScore = 0;
      if (title.includes(term)) termScore += 6;
      if (item.keywords.toLowerCase().includes(term)) termScore += 4;
      if (item.snippet.toLowerCase().includes(term)) termScore += 2;
      if (item.host.toLowerCase().includes(term)) termScore += 1;
      if (termScore) matched += 1;
      score += termScore;
    }
    return { ...item, score, matched };
  });
  const threshold = terms.length < 3 ? terms.length : Math.ceil(terms.length * .6);
  return scored.filter((item) => item.score > 0 && item.matched >= threshold)
    .sort((a, b) => b.score - a.score || a.rank - b.rank);
}

function progressStepsMarkup(progress, status) {
  const stage = status === 'loading' ? Math.min(progress, stageLabels.length - 1) : stageLabels.length;
  return `<ol class="classic-progress-steps" aria-label="Search progress">${stageLabels.map((label, index) => {
    const state = stage > index ? 'is-done' : stage === index ? 'is-current' : '';
    return `<li data-step="${index}" class="${state}"${stage === index ? ' aria-current="step"' : ''}><span class="classic-step-dot" aria-hidden="true">${stage > index ? '✓' : index + 1}</span>${label}</li>`;
  }).join('')}</ol>`;
}

function resultRowMarkup(item) {
  return `<li class="classic-result" data-result-id="${escapeHtml(item.page)}">
    <span class="classic-result-url">${escapeHtml(item.host)}<small>${escapeHtml(item.path)}</small></span>
    ${internalLink(item.page, escapeHtml(item.title), 'classic-result-title')}
    <p>${escapeHtml(item.snippet)}</p>
  </li>`;
}

function noResultsMarkup() {
  return `<div class="classic-no-results"><strong>No matching pages found.</strong><p>Try “lunar eclipse” or “North Ridge public observing night”.</p><div class="classic-query-examples"><button type="button" data-fill-query="lunar">lunar eclipse</button><button type="button" data-fill-query="local">North Ridge public observing night</button></div></div>`;
}

function resultsAreaMarkup(matches, progress, status) {
  const shownCount = status === 'loading' ? Math.min(matches.length, stageCounts[progress]) : matches.length;
  if (status === 'complete' && !matches.length) return noResultsMarkup();
  return `<ol class="classic-result-list" aria-label="Search results" aria-busy="${status === 'loading'}">${matches.slice(0, shownCount).map(resultRowMarkup).join('')}</ol>`;
}

function resultPageMarkup(query, status, progress) {
  const matches = findResults(query);
  const shown = status === 'loading' ? Math.min(matches.length, stageCounts[progress]) : matches.length;
  const count = status === 'loading' ? (matches.length ? `${shown} of ${matches.length} results` : 'Searching…') : `${matches.length} results`;
  return `<article class="classic-search-page classic-results">
    <header class="classic-results-header">
      ${internalLink('home', '<span class="classic-logo-small">Google Web Search</span><span class="classic-attribution">Archive edition · 2001</span>', 'classic-brand')}
      ${searchForm(query, 'classic-results-query')}
      <span class="classic-results-count" data-result-count="${status === 'loading' ? shown : matches.length}">${count}</span>
    </header>
    <p class="classic-results-query-label">Search results for <strong>${escapeHtml(query)}</strong></p>
    <div class="classic-search-progress" aria-label="Search activity" data-searching="${status === 'loading'}">
      <p id="classic-search-status" class="classic-search-status" role="status" aria-live="polite" aria-atomic="true">${stageMessages[progress]}</p>
      <div class="classic-progress-detail">${status === 'loading' ? '<span class="classic-loader" aria-hidden="true"></span>' : '<span class="classic-done-mark" aria-hidden="true">✓</span>'}<span>${status === 'loading' ? 'local archive search in progress' : 'local archive search complete'}</span></div>
      ${progressStepsMarkup(progress, status)}
    </div>
    <section class="classic-results-area" aria-label="Matching pages">${resultsAreaMarkup(matches, progress, status)}</section>
    <footer class="classic-search-footer">Google Web Search · local exhibit archive · 2001</footer>
  </article>`;
}

function homeMarkup(query) {
  return `<article class="classic-search-page classic-home">
    <nav class="classic-home-nav" aria-label="Search index sections"><a href="#directory">Directory</a><a href="#help">Help</a><a href="#about">About</a></nav>
    <section class="classic-search-center">
      <div class="classic-wordmark"><span>Google Web Search</span><small>Archive edition · 2001</small></div>
      <p>Search the web, then follow the archived pages.</p>
      ${searchForm(query)}
      <p class="classic-home-suggestion">Example: <button type="button" class="classic-example" data-fill-query="lunar">lunar eclipse</button></p>
      <p class="classic-search-disclosure">Local reconstruction · searches stay inside this exhibit</p>
    </section>
    <section id="directory" class="classic-directory"><h2>Browse the local index</h2><ul><li>${internalLink('bulletin', 'Observatory bulletin')}</li><li>${internalLink('club', 'Astronomy Club calendar')}</li><li>${internalLink('eclipse-catalog', 'NASA eclipse catalog')}</li></ul></section>
    <section id="help" class="classic-secondary"><h2>Search help</h2><p>Enter a few words from a page title or subject. Try an event, an eclipse date, or the Moon.</p></section>
    <section id="about" class="classic-secondary"><h2>About this index</h2><p>Google Web Search attribution places this scene in the early search era. The result index is simulated and curated for this exhibit.</p></section>
    <footer class="classic-search-footer">Web Search · local archive · 2001</footer>
  </article>`;
}

const documents = {
  'eclipse-jan': { organization: 'NASA Eclipse Web Site', title: 'Total Lunar Eclipse of 2001 January 9', date: 'NASA eclipse record · 9 January 2001', text: 'The NASA record describes the first total lunar eclipse of 2001. During a lunar eclipse, the Moon passes into Earth’s shadow. The catalog includes a path diagram and event circumstances for the eclipse.', source: 'NASA eclipse event table', url: 'https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2001Jan09T.pdf' },
  'eclipse-catalog': { organization: 'NASA Eclipse Web Site', title: 'Lunar Eclipses: 2001–2010', date: 'NASA eclipse catalog · decade table', text: 'The decade table lists lunar eclipse dates, types and visibility diagrams from 2001 to 2010. The 2001 entries include the total eclipse in January and a partial eclipse in July.', source: 'NASA eclipse catalog', url: 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2001.html' },
  'eclipse-july': { organization: 'NASA Eclipse Web Site', title: 'Partial Lunar Eclipse of 2001 July 5', date: 'NASA eclipse record · 5 July 2001', text: 'NASA’s catalog classifies the 5 July 2001 event as partial. The Moon passed through part of Earth’s umbral shadow; the NASA diagram records the contacts and visibility region.', source: 'NASA eclipse event diagram', url: 'https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2001Jul05P.pdf' },
  'time-jan': { organization: 'timeanddate.com', title: 'January 9, 2001 Lunar Eclipse: dates and visibility', date: 'Event page · 9 January 2001', text: 'This event listing shows the local viewing circumstances and stages for the January 2001 lunar eclipse. Visibility depends on the Moon being above the horizon during the event.', source: 'timeanddate.com · January 2001 lunar eclipse', url: 'https://www.timeanddate.com/eclipse/lunar/2001-january-9' },
  'time-july': { organization: 'timeanddate.com', title: 'July 5, 2001 Lunar Eclipse: dates and visibility', date: 'Event page · 5 July 2001', text: 'This event listing covers the July 2001 partial lunar eclipse and provides local times and a visibility map.', source: 'timeanddate.com · July 2001 lunar eclipse', url: 'https://www.timeanddate.com/eclipse/lunar/2001-july-5' },
  'lunar-basics': { organization: 'Encyclopaedia Britannica', title: 'Lunar eclipse: umbra, penumbra and the Moon', date: 'Astronomy reference · lunar eclipse', text: 'A lunar eclipse occurs when the Moon passes through Earth’s shadow. A total lunar eclipse happens when the Moon enters the umbra; a penumbral eclipse involves the lighter outer shadow.', source: 'Encyclopaedia Britannica · Lunar eclipse', url: 'https://www.britannica.com/science/lunar-eclipse' },
  'eclipse-library': { organization: 'Exploratorium', title: 'Eclipse science and observing activities', date: 'Science learning collection · Eclipses', text: 'This collection introduces eclipse geometry and activities for exploring shadows. A lunar eclipse is safe to view directly because it is reflected moonlight, unlike an unfiltered solar eclipse.', source: 'Exploratorium · Eclipse', url: 'https://www.exploratorium.edu/eclipse' },
  'moon-gallery': { organization: 'Astronomy Picture of the Day', title: 'Lunar eclipse images in the astronomy archive', date: 'Image archive · NASA Astronomy Picture of the Day', text: 'Browse astronomy image captions about lunar eclipses, including the copper-red appearance the Moon can take on during totality.', source: 'NASA Astronomy Picture of the Day archive', url: 'https://apod.nasa.gov/apod/archivepix.html' },
};

function documentMarkup(page) {
  if (page === 'bulletin') {
    return `<article class="classic-search-page classic-document"><header class="classic-document-top"><span>North Ridge Observatory</span><small>Events &amp; Public Programs · local archive</small></header><p class="classic-breadcrumb">${internalLink('home', 'Web Search')} / ${internalLink('results', 'Search results')}</p><h2>Observing Night Bulletin</h2><p class="classic-document-date">Published 8 October 2001 · North Ridge Observatory</p><hr><p><strong>${eventDate}</strong></p><p>Public observing begins at <strong>${eventTime}</strong> on the <strong>${eventPlace}</strong>.</p><p>Enter at the north gate on Ridge Road. Bring a warm coat; a volunteer will have a telescope trained on the Moon after dusk.</p><p>In case of heavy cloud, the program moves to the indoor lecture room. Call the observatory desk after 6 p.m. for a recorded update.</p><p class="classic-related">Related page: ${internalLink('club', 'North Ridge Astronomy Club calendar')}</p><address>North Ridge Observatory · Ridge Road · Public Information Office</address></article>`;
  }
  if (page === 'club') {
    return `<article class="classic-search-page classic-document"><header class="classic-document-top"><span>North Ridge Astronomy Club</span><small>Members &amp; Community · local archive</small></header><p class="classic-breadcrumb">${internalLink('home', 'Web Search')} / ${internalLink('results', 'Search results')}</p><h2>Public Observing Nights</h2><p class="classic-document-date">Club calendar · October 2001</p><hr><table class="classic-event-table"><tbody><tr><th>Date</th><td>${eventDate}</td></tr><tr><th>Time</th><td>${eventTime}</td></tr><tr><th>Place</th><td>${eventPlace}, Ridge Road</td></tr><tr><th>Program</th><td>Moon craters, Saturn and telescope setup for new members</td></tr></tbody></table><p>Visitors are welcome. The club brings a 6-inch reflector and a small refractor for the public viewing line.</p><p>Meet at the north gate ten minutes before the program starts. Cloud updates are posted on the observatory bulletin page.</p><p class="classic-related">${internalLink('bulletin', 'Read the observatory bulletin')}</p><address>North Ridge Astronomy Club · October 2001 Calendar</address></article>`;
  }
  const document = documents[page];
  return `<article class="classic-search-page classic-document"><header class="classic-document-top"><span>${escapeHtml(document.organization)}</span><small>Archived result · 2001 Web Search study</small></header><p class="classic-breadcrumb">${internalLink('home', 'Web Search')} / ${internalLink('results', 'Search results')}</p><h2>${escapeHtml(document.title)}</h2><p class="classic-document-date">${escapeHtml(document.date)}</p><hr><p>${escapeHtml(document.text)}</p><p class="classic-document-disclosure">This page is a locally reproduced archive excerpt. The original factual reference is listed below.</p><p class="classic-related"><a href="${document.url}" target="_blank" rel="noopener">${escapeHtml(document.source)} ↗</a></p><p>${internalLink('results', 'Return to the search results')}</p></article>`;
}

export function createClassicSearch() {
  let query = DEFAULT_QUERY;
  let currentPage = 'home';
  let searchStatus = 'idle';
  let searchProgress = 0;
  let generation = 0;
  let timers = [];
  let activeResultsRoot = null;
  const clickBoundRoots = new WeakSet();

  function cancelTimers() {
    generation += 1;
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  }

  function renderProgress(root) {
    const target = root?.isConnected ? root : activeResultsRoot;
    if (!target?.isConnected) return;
    const status = target.querySelector('#classic-search-status');
    const count = target.querySelector('.classic-results-count');
    const progress = target.querySelector('.classic-progress-steps');
    const detail = target.querySelector('.classic-progress-detail');
    const area = target.querySelector('.classic-results-area');
    if (!status || !area) return;
    const matches = findResults(query);
    const total = matches.length;
    const shown = searchStatus === 'loading' ? Math.min(total, stageCounts[searchProgress]) : total;
    status.textContent = stageMessages[searchProgress];
    status.dataset.searchStage = searchStatus === 'loading' ? `loading-${searchProgress}` : 'complete';
    status.parentElement.dataset.searching = String(searchStatus === 'loading');
    if (count) {
      count.textContent = searchStatus === 'loading' ? (total ? `${shown} of ${total} results` : 'Searching…') : `${total} results`;
      count.dataset.resultCount = String(shown);
    }
    if (detail) detail.innerHTML = searchStatus === 'loading'
      ? `<span class="classic-loader" aria-hidden="true"></span><span>local archive search in progress · step ${Math.min(searchProgress + 1, stageLabels.length)} of ${stageLabels.length}</span>`
      : '<span class="classic-done-mark" aria-hidden="true">✓</span><span>local archive search complete</span>';
    if (progress) progress.outerHTML = progressStepsMarkup(searchProgress, searchStatus);
    if (searchStatus === 'complete' && matches.length === 0) {
      area.innerHTML = noResultsMarkup();
      return;
    }
    let list = area.querySelector('.classic-result-list');
    if (!list) {
      area.innerHTML = '<ol class="classic-result-list" aria-label="Search results"></ol>';
      list = area.querySelector('.classic-result-list');
    }
    for (const item of matches.slice(list.children.length, shown)) {
      list.insertAdjacentHTML('beforeend', resultRowMarkup(item));
    }
    list.setAttribute('aria-busy', searchStatus === 'loading' ? 'true' : 'false');
  }

  function finishSearch() {
    cancelTimers();
    activeResultsRoot = null;
    if (searchStatus === 'loading') {
      searchStatus = 'complete';
      searchProgress = 4;
    }
  }

  function beginSearch(root) {
    searchStatus = 'loading';
    searchProgress = 0;
    activeResultsRoot = root;
    renderProgress(root);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      searchStatus = 'complete';
      searchProgress = 4;
      renderProgress(root);
      return;
    }
    const run = generation;
    const stages = [[420, 1], [950, 2], [1540, 3], [2300, 4]];
    timers = stages.map(([delay, stage]) => setTimeout(() => {
      if (run !== generation || searchStatus !== 'loading') return;
      searchProgress = stage;
      if (stage === 4) {
        searchStatus = 'complete';
        timers = [];
      }
      renderProgress(activeResultsRoot || root);
    }, delay));
  }

  function markup(page) {
    currentPage = page;
    if (page === 'results') {
      if (searchStatus === 'idle') {
        searchStatus = 'complete';
        searchProgress = 4;
      }
      return resultPageMarkup(query, searchStatus, searchProgress);
    }
    if (page === 'home') return homeMarkup(query);
    return documentMarkup(page);
  }

  function searchAgain(root, navigate, nextQuery) {
    cancelTimers();
    query = String(nextQuery || '').trim() || DEFAULT_QUERY;
    searchStatus = 'loading';
    searchProgress = 0;
    if (currentPage === 'results') {
      root.innerHTML = markup('results');
      init(root, navigate);
    } else {
      navigate('results');
    }
  }

  function init(root, navigate) {
    if (currentPage !== 'results') {
      finishSearch();
    } else {
      activeResultsRoot = root;
      if (searchStatus === 'loading' && timers.length === 0) beginSearch(root);
      if (searchStatus === 'loading') root.querySelector('#classic-results-query')?.focus({ preventScroll: true });
    }
    for (const form of root.querySelectorAll('.classic-search-form')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        searchAgain(root, navigate, form.elements.query.value);
      });
    }
    if (!clickBoundRoots.has(root)) {
      clickBoundRoots.add(root);
      root.addEventListener('click', (event) => {
        const example = event.target.closest('[data-fill-query]');
        if (!example) return;
        const nextQuery = example.dataset.fillQuery === 'local' ? LEGACY_QUERY : DEFAULT_QUERY;
        const input = root.querySelector('.classic-search-form input[name="query"]');
        if (input) {
          input.value = nextQuery;
          input.focus();
        }
      });
    }
  }

  return { markup, init, cancel: finishSearch };
}
