import { createMonitor } from './monitor.js';
import { getLocale, formatMessage, translateText, bindMessage } from './i18n.js';

export const modernEras = {
  2023: {
    caption: 'Google Search Labs · Generative AI Search',
    hint: '한국어 관측회 예시를 눌러 전시 자료를 보거나, 월식·제임스 웹 같은 천문 검색어를 입력해 공개 검색 결과를 불러오세요.',
    notes: '2023년 Search Labs에서 생성형 AI 검색 경험(SGE)이 실험됐습니다. Orbit Search의 관측회 질문은 전시용 요약과 내부 출처를 사용하고, 다른 천문 검색어는 NASA Image and Video Library와 Spaceflight News의 공개 검색 API를 조회해 결과를 구성합니다. 짧은 개요는 반환된 기록을 바탕으로 이 페이지에서 생성합니다.',
    sources: [
      ['Google · Generative AI in Search (Search Labs)', 'https://blog.google/products-and-platforms/products/search/generative-ai-search/'],
      ['NASA · Image and Video Library API', 'https://images-api.nasa.gov/'],
      ['Spaceflight News API', 'https://api.spaceflightnewsapi.net/'],
    ],
    base: 'https://orbitsearch.example/',
    pages: {
      home: ['Orbit Search', ''],
      result: ['AI answer · Orbit Search', 'answers/observing-night'],
      live: ['Live astronomy search · Orbit Search', 'search/live'],
      notice: ['Observing Night · Observatory Bulletin', 'https://observatory.example/news/2023-observing-night'],
      archive: ['November Schedule · Observatory Calendar', 'https://calendar.example/2023/november'],
    },
  },
  2026: {
    caption: 'Modern browser · Proactive sky briefing',
    hint: '에이전트가 관심사에 맞춰 출처를 확인하는 모습을 보고, 관측 시나리오에서 계획을 만들어 보세요.',
    notes: '브리핑을 열면 설정된 관심사에 따라 NASA 소식과 Open-Meteo의 실시간 예보 모델 값을 확인합니다. 활동 목록에는 실제로 요청한 출처와 결과가 표시됩니다. North Ridge의 지역 예보, ISS 통과 시각, 관측회 일정은 별도로 표시된 전시용 시나리오입니다. 캘린더 파일은 기기에서 만들고 2013년 포스터는 별도 선택을 했을 때만 변경합니다.',
    sources: [
      ['OpenAI · ChatGPT agent in 2025', 'https://openai.com/index/introducing-chatgpt-agent/'],
      ['Google · Chrome auto browse in 2026', 'https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/'],
      ['Chrome for Developers · WebMCP origin trial', 'https://developer.chrome.com/blog/ai-webmcp-origin-trial'],
      ['Spaceflight News API · NASA news feed', 'https://www.spaceflightnewsapi.net/'],
      ['Open-Meteo · Model forecast data', 'https://open-meteo.com/'],
    ],
    base: 'https://observatory.example/',
    pages: {
      home: ['North Ridge Observatory', ''],
      bulletin: ['Observing Night · Event Bulletin', 'events/observing-night'],
      schedule: ['Public Nights · Community Calendar', 'https://calendar.example/2026/november'],
      board: ['Observing Plan · Fieldwork archive', 'https://fieldwork.example/b/observing-night'],
      tools: ['Field Notes · A web for agents', 'journal/2026-tools'],
      plan: ['My Observing Plan · North Ridge', 'plans/current'],
      'source-moon': ['Moon and sky conditions · Source notes', 'briefing/sources/moon'],
      'source-weather': ['Local forecast · Source notes', 'briefing/sources/weather'],
      'source-iss': ['ISS pass · Source notes', 'briefing/sources/iss'],
      'source-image': ['Space image · Source notes', 'briefing/sources/image'],
      'source-event': ['Official observing notice · Source notes', 'briefing/sources/event'],
    },
  },
};

const combinedQuestion = 'When and where is the North Ridge observing night?';
const timeQuestion = "What time is this week's observing night?";
const placeQuestion = 'Where is the observing night held?';
const defaultLiveQuestion = 'James Webb Space Telescope';
const koreanQuestions = {
  both: '노스리지 관측회는 언제 어디서 열려?',
  time: '이번 주 관측회는 몇 시야?',
  place: '관측회는 어디서 열려?',
  live: '제임스 웹 우주망원경',
};
function exampleQuestion(kind) {
  if (getLocale() === 'ko') return koreanQuestions[kind];
  return kind === 'both' ? combinedQuestion : kind === 'time' ? timeQuestion : kind === 'place' ? placeQuestion : defaultLiveQuestion;
}
const agentStorageKey = 'build-canvas:web-evolution:agent-briefing';
const agentInterests = [
  ['moon', 'Moon & sky'],
  ['iss', 'ISS passes'],
  ['research', 'Space research & images'],
];
const regions = {
  north: {
    label: 'North Ridge Observatory', location: 'West Terrace · Ridge Road', timeZone: 'America/Los_Angeles',
    forecasts: ['Clouds thin after 8:10 p.m.; a clear western gap follows.', 'Low clouds linger through 9 p.m.; the eastern horizon stays open.', 'Mostly clear after 8:45 p.m., with a cool breeze on the terrace.'],
    moonNotes: ['Waxing gibbous · 67% lit · best before moonrise glare.', 'Waxing gibbous · 76% lit · bright enough for lunar detail.', 'Waxing gibbous · 84% lit · high contrast near the terminator.'],
    moonTimes: ['8:30 p.m.', '9:15 p.m.', '8:50 p.m.'], issTimes: ['9:17–9:22 p.m.', '7:48–7:53 p.m.', '8:41–8:46 p.m.'], imageTimes: ['7:40 p.m.', '7:30 p.m.', '7:35 p.m.'],
  },
  coast: {
    label: 'Coastline Bluff Field Station', location: 'South overlook · Bluff Road', timeZone: 'America/Los_Angeles',
    forecasts: ['Marine haze clears near 9 p.m.; face inland for the first window.', 'Thin high cloud after 8:30 p.m.; wind stays light at the overlook.', 'A clear start, with coastal fog possible near midnight.'],
    moonNotes: ['Waxing gibbous · 67% lit · try the inland horizon first.', 'Waxing gibbous · 76% lit · bright enough for lunar detail.', 'Waxing gibbous · 84% lit · high contrast near the terminator.'],
    moonTimes: ['9:00 p.m.', '8:45 p.m.', '9:10 p.m.'], issTimes: ['9:20–9:25 p.m.', '7:51–7:56 p.m.', '8:44–8:49 p.m.'], imageTimes: ['7:45 p.m.', '7:35 p.m.', '7:40 p.m.'],
  },
  desert: {
    label: 'High Desert Mesa', location: 'North pad · Mesa Access Road', timeZone: 'America/Phoenix',
    forecasts: ['Clear and dry after sunset; bring a warm layer for the mesa.', 'A few thin clouds pass before 8 p.m.; visibility improves later.', 'Clear sky expected, with a steady breeze from the west.'],
    moonNotes: ['Waxing gibbous · 67% lit · the ridge gives a clean eastern view.', 'Waxing gibbous · 76% lit · bright enough for lunar detail.', 'Waxing gibbous · 84% lit · high contrast near the terminator.'],
    moonTimes: ['8:15 p.m.', '8:40 p.m.', '8:20 p.m.'], issTimes: ['8:58–9:03 p.m.', '7:32–7:37 p.m.', '8:22–8:27 p.m.'], imageTimes: ['7:25 p.m.', '7:20 p.m.', '7:25 p.m.'],
  },
};

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function sceneLink(era, page, label, current = false) {
  return `<a href="?era=${era}&amp;page=${page}" data-page="${page}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
}

function searchAnswer(topic, progress) {
  const time = topic === 'time';
  const place = topic === 'place';
  const first = time
    ? 'North Ridge Observatory’s next public Observing Night is <strong>Saturday, 18 November 2023</strong>.'
    : place
      ? 'The public Observing Night takes place on the <strong>West Terrace at North Ridge Observatory</strong>.'
      : 'North Ridge Observatory’s public Observing Night is on <strong>Saturday, 18 November 2023</strong> at the <strong>West Terrace</strong>.';
  const second = time
    ? 'The event begins at <strong>8:30 p.m.</strong>; the terrace opens at 8:15 p.m.'
    : place
      ? 'Use the <strong>north entrance on Ridge Road</strong> to reach the terrace.'
      : 'The program begins at <strong>8:30 p.m.</strong> and the terrace opens at 8:15 p.m. Use the north entrance on Ridge Road.';
  const third = time
    ? 'The official notice and community calendar agree on the start time.'
    : place
      ? 'The observatory notice and public calendar both list the West Terrace.'
      : 'The observatory notice and public calendar confirm the date, time and West Terrace location.';
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
  const time = topic === 'time';
  const place = topic === 'place';
  const firstSnippet = time
    ? 'Public observing begins Saturday, 18 November at 8:30 p.m. The terrace opens at 8:15 p.m.'
    : place
      ? 'Find the West Terrace using the north entrance on Ridge Road. Doors open before the program.'
      : 'Saturday, 18 November 2023 · 8:30 p.m. · West Terrace at North Ridge Observatory. Terrace opens at 8:15 p.m.';
  const secondSnippet = time
    ? 'This month’s calendar lists North Ridge Observatory’s public program for Saturday evening.'
    : place
      ? 'The observatory calendar lists the public program and points visitors to the official notice for updates.'
      : 'The November calendar confirms the Saturday program and West Terrace venue; check the observatory notice for updates.';
  return `<section class="web-results" aria-label="Web results">
    <h3>Web results</h3>
    <article class="web-result">
      <span class="result-domain">observatory.example <small>› news › 2023-observing-night</small></span>
      ${sceneLink(2023, 'notice', time ? 'Observing Night · North Ridge Observatory' : place ? 'Visit the West Terrace · North Ridge Observatory' : 'Observing Night details · North Ridge Observatory')}
      <p>${firstSnippet}</p>
    </article>
    <article class="web-result">
      <span class="result-domain">calendar.example <small>› 2023 › november</small></span>
      ${sceneLink(2023, 'archive', time ? 'November public nights calendar' : place ? 'Directions and public nights calendar' : 'November date, time and venue calendar')}
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

function liveSearchMarkup(state) {
  const busy = state.status === 'loading';
  const { results } = state;
  const top = results[0];
  const providers = [...new Set(results.map(({ providerLabel }) => providerLabel))].join(', ');
  const summary = state.summaryStage > 0 && top
    ? `<article class="live-ai-summary" aria-labelledby="live-summary-title">
        <div class="live-ai-label"><span aria-hidden="true">✦</span> Orbit Search synthesis <span>from live sources</span></div>
        <h3 id="live-summary-title" data-no-translate>${escapeHtml(state.query)}</h3>
        <div class="live-summary-copy">
          <p>I found <strong>${results.length}</strong> ${results.length === 1 ? 'record' : 'records'} from <span data-no-translate lang="en">${escapeHtml(providers)}</span>.</p>
          ${state.summaryStage >= 2 ? `<p>One source to start with: <strong data-no-translate lang="en">${escapeHtml(top.title)}</strong>${top.published ? ` · <span>${top.provider === 'nasa' ? 'archived' : 'published'}</span> <span data-no-translate lang="en">${escapeHtml(top.published)}</span>` : ''}.</p>` : ''}
          ${state.summaryStage >= 3 ? `<p><span data-no-translate lang="en">${escapeHtml(top.summary || top.title)}</span> <a href="${escapeHtml(top.url)}" target="_blank" rel="noopener noreferrer">Open this source ↗</a></p>` : ''}
        </div>
        <p class="live-summary-note">A short generated orientation based on the linked records below; verify details on the source pages.</p>
      </article>` : '';
  const rows = state.resultsRevealed > 0
    ? `<section class="live-web-results" aria-label="Live astronomy web results">
        <h3>Web results <span>${results.length} live matches</span></h3>
        <div class="live-result-list">${results.slice(0, state.resultsRevealed).map((item) => `<article class="live-result" data-provider="${escapeHtml(item.provider)}">
          <span class="live-result-domain">${escapeHtml(item.domain)} <small>· ${escapeHtml(item.providerLabel)}</small></span>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)} <span aria-hidden="true">↗</span></a>
          <p>${escapeHtml(item.summary || 'Open the source record for details.')}</p>
          <time>${item.published ? `${item.provider === 'nasa' ? 'Archive date' : 'Published'} ${escapeHtml(item.published)}` : `Retrieved ${escapeHtml(item.retrieved)}`}</time>
        </article>`).join('')}</div>
      </section>` : '';
  const nasaImages = state.results.slice(0, state.resultsRevealed).filter((item) => item.provider === 'nasa' && item.thumbnail).slice(0, 4);
  const imageGallery = nasaImages.length
    ? `<section class="live-image-results" aria-label="NASA image results">
        <h3>Images from NASA <span>NASA Image and Video Library</span></h3>
        <div class="live-image-grid">${nasaImages.map((item) => `<article class="live-image-card" data-nasa-id="${escapeHtml(item.id)}">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open NASA source: ${escapeHtml(item.title)}">
            <span class="live-image-frame"><img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-live-preview><span class="live-image-fallback">Preview unavailable</span></span>
            <strong>${escapeHtml(item.title)}</strong>
          </a><time>${item.published ? `Archive date ${escapeHtml(item.published)}` : `Retrieved ${escapeHtml(item.retrieved)}`}</time>
        </article>`).join('')}</div>
      </section>` : '';
  const retry = state.status === 'error' || (state.status === 'complete' && !results.length)
    ? '<div class="live-search-error"><button type="button" data-live-retry>Try again</button></div>' : '';
  const statusText = state.messageKey ? formatMessage(state.messageKey,state.messageParams||{}) : state.message || 'Search live NASA and Spaceflight News sources for astronomy records.';
  const attrs=state.messageKey ? ` data-i18n-message="${escapeHtml(state.messageKey)}" data-i18n-params="${escapeHtml(JSON.stringify(state.messageParams||{}))}"` : '';
  const progress = `<p class="live-search-status" id="live-search-status" role="status" aria-live="polite" aria-atomic="true"${attrs}>${escapeHtml(statusText)}</p>`;
  const waiting = busy && !state.summaryStage ? `<div class="live-search-wait" aria-hidden="true"><span></span><span></span><span></span></div>` : '';
  return `<div class="live-search-results" data-live-stage="${state.status}">
    <p class="live-source-language">External source text is shown in its original language.</p>
    ${progress}${waiting}${summary}${imageGallery}${rows}${retry}
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

function searchMarkup(page, question, topic, searchStatus, searchProgress, liveState) {
  if (page === 'notice' || page === 'archive') return searchSourcePage(page);
  const landing = page === 'home';
  const livePage = page === 'live';
  return `<article class="search-page${landing ? ' is-landing' : ''}">
    <header class="search-header">
      ${sceneLink(2023, 'home', '<span class="orbit-search-mark" aria-hidden="true">◈</span> Orbit Search')}
      <nav aria-label="Search navigation">
        ${sceneLink(2023, 'home', 'Search', landing)}
      </nav>
    </header>
    <section class="search-body">
      <div class="search-heading">
        <h2>${landing ? '<span class="orbit-search-mark" aria-hidden="true">◈</span> Orbit Search' : livePage ? 'Live astronomy search' : 'Search results'}</h2>
        ${landing ? '<p>Search the web, then explore a generated overview.</p>' : ''}
      </div>
      <form class="search-form">
        <label class="sr-only" for="search-question">Search the web</label>
        <input id="search-question" name="question" type="search" value="${escapeHtml(livePage ? liveState.query || exampleQuestion('live') : landing ? exampleQuestion('live') : question)}" ${landing || (livePage && !liveState.query) ? 'data-locale-default="live"' : ''} maxlength="160" placeholder="Try ‘James Webb telescope’ or ‘lunar eclipse’" required>
        <button type="submit"><span aria-hidden="true">⌕</span> Search</button>
      </form>
      <p id="search-message" class="search-message" lang="ko" role="status"></p>
      ${landing ? `<div class="search-suggestions" lang="ko"><span>예시 질문</span>
        <button type="button" data-search="both">${exampleQuestion('both')}</button>
        <button type="button" data-search="time">${exampleQuestion('time')}</button>
        <button type="button" data-search="place">${exampleQuestion('place')}</button>
        <button type="button" data-search-query="lunar-eclipse">${getLocale()==='ko' ? '월식' : 'lunar eclipse'}</button>
      </div><p class="search-hint" lang="ko">관측회 예시 질문은 전시 자료를 사용하고, 다른 천문 검색어는 NASA와 Spaceflight News의 공개 검색 API를 조회합니다.</p>` : `<div class="search-result-shell">
        ${livePage ? liveSearchMarkup(liveState) : `<p id="search-status" class="search-status" lang="ko" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(searchStatusMessage(searchStatus, searchProgress))}</p>
        <div class="search-output">${searchOutputMarkup(searchStatus, searchProgress, topic)}</div>`}
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
  const aboutEvent = /관측회|관측 행사|공개 관측|observing night|star party|north ridge/.test(text);
  const followUp = /^(?:몇\s*시(?:야|예요)?|언제(?:야|예요)?|어디(?:야|예요)?|when|where)[?.!\s]*$/.test(text);
  if (!aboutEvent && !(followUp && ['both', 'time', 'place'].includes(fallback))) return 'live';
  const asksPlace = /어디|장소|\bwhere\b|location|address/.test(text);
  const asksTime = /시간|몇\s*시|언제|\bwhen\b|\btime\b|\bstart/.test(text);
  if (asksPlace && asksTime) return 'both';
  if (asksPlace) return 'place';
  if (asksTime) return 'time';
  return fallback;
}

function agentDay(state) {
  const date = new Date(Date.UTC(2026, 10, 18 + state.dayOffset, 20));
  const region = regions[state.region];
  const dateIso = date.toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: region.timeZone }).format(date);
  const shortDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: region.timeZone }).format(date);
  return { date, dateIso, dateLabel, shortDate };
}

function agentDayKey(state) {
  return `${state.region}:${state.dayOffset}`;
}

function calendarDateTime(dateIso, minutes) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCMinutes(minutes);
  return date.toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

function escapeIcs(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
}

function foldIcs(lines) {
  const encoder = new TextEncoder();
  return `${lines.map((line) => {
    let result = '';
    let chunk = '';
    let bytes = 0;
    for (const char of line) {
      const size = encoder.encode(char).length;
      if (bytes + size > 73) {
        result += `${chunk}\r\n `;
        chunk = '';
        bytes = 0;
      }
      chunk += char;
      bytes += size;
    }
    return result + chunk;
  }).join('\r\n')}\r\n`;
}

function calendarZoneLines(timeZone, dateIso) {
  const instant = new Date(`${dateIso}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, timeZoneName: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const zoneName = parts.find((part) => part.type === 'timeZoneName')?.value || timeZone;
  const localHour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const localMinute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  const localAsUtc = Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate(), localHour, localMinute);
  const offsetMinutes = Math.round((localAsUtc - instant.getTime()) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}${String(absolute % 60).padStart(2, '0')}`;
  const label = zoneName.replace(/[^A-Za-z0-9+-]/g, '') || timeZone;
  return ['BEGIN:VTIMEZONE', `TZID:${timeZone}`, 'BEGIN:STANDARD', `DTSTART:${dateIso.replaceAll('-', '')}T000000`, `TZOFFSETFROM:${offset}`, `TZOFFSETTO:${offset}`, `TZNAME:${label}`, 'END:STANDARD', 'END:VTIMEZONE'];
}

function makeInitialAgentState() {
  return { region: 'north', interests: ['moon', 'iss', 'research'], dayOffset: 0, selectedByDay: {}, approvedPlans: {}, posterUpdates: {}, syncPoster: false, updateNote: '', updateCode: '' };
}

const agentNoteCodes = new Set(['settings','advance','posterSaved','posterFailed','planSaved']);
function legacyAgentNoteCode(value){
  if(typeof value!=='string')return '';
  if(value.startsWith('Scenario settings updated for '))return 'settings';
  if(value.startsWith('Scenario advanced to '))return 'advance';
  if(value.includes('three approved schedule fields'))return 'posterSaved';
  if(value.includes('poster schedule could not be updated'))return 'posterFailed';
  if(value.includes('2013 poster was left unchanged'))return 'planSaved';
  return '';
}
function agentNotice(state){
  const code=state.updateCode||legacyAgentNoteCode(state.updateNote);
  if(!agentNoteCodes.has(code))return null;
  const region=regions[state.region];
  const day=agentDay(state),event=officialEvent(state);
  const dateFmtEn=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:region.timeZone});
  const dateFmtKo=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:region.timeZone});
  const eventInstant=new Date(event.dateIso+'T20:00:00Z');
  const slot=state.dayOffset%3;
  const koreanTime=value=>String(value).replace(/(\d{1,2}):(\d{2})\s*p\.m\./g,(_m,h,minutes)=>'오후 '+h+'시 '+Number(minutes)+'분');
  const params={
    region:region.label,
    dateEn:dateFmtEn.format(day.date),dateKo:dateFmtKo.format(day.date),
    forecastEn:region.forecasts[slot],forecastKo:translateText(region.forecasts[slot],'ko'),
    issEn:region.issTimes[slot],issKo:koreanTime(region.issTimes[slot]),
    eventDateEn:dateFmtEn.format(eventInstant),eventDateKo:dateFmtKo.format(eventInstant),
    eventTimeEn:event.time,eventTimeKo:koreanTime(event.time)
  };
  return {key:'agent.note.'+code,params};
}
function setAgentNotice(state,code){state.updateCode=code;state.updateNote='';}
function loadAgentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(agentStorageKey));
    if (!saved || typeof saved !== 'object') return makeInitialAgentState();
    const state = makeInitialAgentState();
    if (Object.hasOwn(regions, saved.region)) state.region = saved.region;
    if (Array.isArray(saved.interests)) state.interests = [...new Set(saved.interests.filter((id) => agentInterests.some(([key]) => key === id)))];
    if (Number.isInteger(saved.dayOffset) && saved.dayOffset >= 0 && saved.dayOffset <= 60) state.dayOffset = saved.dayOffset;
    if (saved.selectedByDay && typeof saved.selectedByDay === 'object') state.selectedByDay = saved.selectedByDay;
    if (saved.approvedPlans && typeof saved.approvedPlans === 'object') state.approvedPlans = saved.approvedPlans;
    if (saved.posterUpdates && typeof saved.posterUpdates === 'object') state.posterUpdates = saved.posterUpdates;
    state.syncPoster = saved.syncPoster === true;
    state.updateNote = typeof saved.updateNote === 'string' ? saved.updateNote.slice(0, 240) : '';
    state.updateCode = agentNoteCodes.has(saved.updateCode) ? saved.updateCode : legacyAgentNoteCode(state.updateNote);
    return state;
  } catch {
    return makeInitialAgentState();
  }
}

function persistAgentState(state) {
  try { localStorage.setItem(agentStorageKey, JSON.stringify(state)); } catch { /* Keep the briefing usable for this visit. */ }
}

function briefingItems(state) {
  const region = regions[state.region];
  const day = agentDay(state);
  const slot = state.dayOffset % 3;
  const stamp = `Checked ${day.shortDate} · 2:00 p.m. local`;
  const issWindow = region.issTimes[slot];
  const issStart = issWindow.split('–')[0];
  const items = [
    {
      id: 'moon', interest: 'moon', category: 'MOON + LOCAL SKY', title: 'Moon window & cloud gap',
      summary: `${region.moonNotes[slot]} ${region.forecasts[slot]}`,
      note: 'Moon phase and local weather values in this briefing are a curated simulation.',
      time: region.moonTimes[slot], startMinutes: parseTime(region.moonTimes[slot]), start: timeTo24(region.moonTimes[slot]), duration: 35,
      location: region.location, sourcePages: ['source-moon', 'source-weather'], sourceLabels: ['Moon phase', 'Local forecast'], checked: stamp,
    },
    {
      id: 'iss', interest: 'iss', category: 'ISS PASS', title: 'International Space Station pass',
      summary: 'Look southwest after sunset for the brightest pass in the current viewing window.',
      note: 'NASA’s Spot the Station service provides real location-specific pass times.',
      time: issWindow, startMinutes: parseTime(issStart), start: timeTo24(issStart), duration: 5,
      location: region.location, sourcePages: ['source-iss'], sourceLabels: ['NASA · Spot the Station'], checked: stamp,
    },
    {
      id: 'research', interest: 'research', category: 'SPACE RESEARCH + IMAGES', title: 'Webb reveals Jupiter’s auroras',
      summary: `A Webb near-infrared view shows auroral emission above Jupiter’s cloud tops. Charged particles guided by the planet’s magnetic field excite gases in the upper atmosphere; compare the bright polar arcs with Jupiter’s moons in the image.`,
      note: `NASA image release · 22 August 2022. Selected again for the ${region.imageTimes[slot]} sky-talk slot; local agenda timing is simulated.`,
      time: region.imageTimes[slot], startMinutes: parseTime(region.imageTimes[slot]), start: timeTo24(region.imageTimes[slot]), duration: 15,
      location: 'Briefing room · North Ridge', sourcePages: ['source-image'], sourceLabels: ['NASA · Webb image release'], checked: stamp,
    },
  ];
  return items.filter((item) => state.interests.includes(item.interest)).map((item) => ({ ...item, date: day.dateIso, dateLabel: day.shortDate }));
}

function parseTime(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(a|p)\.?m?\.?)?$/i);
  if (!match) return 0;
  let hour = Number(match[1]) % 12;
  if ((match[3] || 'p').toLowerCase() === 'p') hour += 12;
  return hour * 60 + Number(match[2]);
}

function timeTo24(value) {
  const minutes = parseTime(value);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function ensureAgentSelection(state, carrySelection) {
  const key = agentDayKey(state);
  if (!Array.isArray(state.selectedByDay[key])) {
    const available = new Set(briefingItems(state).map(({ id }) => id));
    state.selectedByDay[key] = Array.isArray(carrySelection) ? carrySelection.filter((id) => available.has(id)) : [...available];
  }
}

function officialEvent(state) {
  const region = regions[state.region];
  const date = new Date(Date.UTC(2026, 10, 21 + state.dayOffset, 20));
  const dateIso = date.toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: region.timeZone }).format(date);
  const shortDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: region.timeZone }).format(date);
  return { dateIso, dateLabel, shortDate, time: ['7:30 p.m.', '8:00 p.m.', '8:30 p.m.'][state.dayOffset % 3], location: `${region.location} · North Ridge Observatory` };
}

function selectedAgentItems(state) {
  ensureAgentSelection(state);
  const selected = new Set(state.selectedByDay[agentDayKey(state)]);
  return briefingItems(state).filter(({ id }) => selected.has(id)).sort((a, b) => a.startMinutes - b.startMinutes);
}

function agentNav(page) {
  const links = [
    ['home', 'Briefing'], ['plan', 'My plan'], ['bulletin', 'Bulletin'], ['schedule', 'Calendar'],
  ];
  return `<nav class="briefing-nav" aria-label="Observatory pages">${links.map(([id, label]) => sceneLink(2026, id, label, page === id)).join('')}</nav>`;
}

function briefingItemCard(item, selected) {
  return `<article class="briefing-card briefing-card-${item.id}">
    <div class="briefing-card-top"><span class="briefing-category">${item.category}</span><label class="plan-pick"><input type="checkbox" data-plan-item="${item.id}" ${selected ? 'checked' : ''}><span>Add to plan</span></label></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p class="briefing-time"><time datetime="${item.date}T${item.start}">${item.dateLabel} · ${escapeHtml(item.time)}</time></p>
    <p>${escapeHtml(item.summary)}</p>
    <p class="briefing-item-note">${escapeHtml(item.note)}</p>
    <div class="briefing-card-foot"><span>${escapeHtml(item.location)}</span><span>${escapeHtml(item.checked)}</span></div>
    <div class="briefing-sources">${item.sourcePages.map((source, index) => sceneLink(2026, source, `Source: ${item.sourceLabels[index]}`)).join('')}</div>
  </article>`;
}

function preferencesMarkup(state) {
  const regionOptions = Object.entries(regions).map(([id, region]) => `<option value="${id}" ${state.region === id ? 'selected' : ''}>${escapeHtml(region.label)}</option>`).join('');
  const interests = agentInterests.map(([id, label]) => `<label class="interest-option"><input type="checkbox" name="interest" value="${id}" ${state.interests.includes(id) ? 'checked' : ''}><span>${label}</span></label>`).join('');
  return `<form class="briefing-preferences" id="briefing-preferences">
    <h3>Your interests</h3>
    <label class="region-field">Viewing region<select name="region">${regionOptions}</select></label>
    <fieldset><legend>Include in my briefing</legend>${interests}</fieldset>
    <button type="submit" class="preference-submit">Update briefing</button>
    <p class="preferences-note">Your region sets the scenario and the forecast reference location. No account is needed.</p>
  </form>`;
}

function selectedCountMarkup(state) {
  const count = selectedAgentItems(state).length;
  return `<strong data-plan-count data-i18n-message="agent.planCount" data-i18n-params='{"count":${count},"noun":"${count===1?'item':'items'}"}' aria-live="polite">${formatMessage('agent.planCount',{count,noun:count===1?'item':'items'})}</strong>`;
}

function briefingUpdateNote(state) {
  const note=agentNotice(state);
  if(note)return `<p class="briefing-update-note" id="briefing-update-note" role="status" aria-live="polite" data-i18n-message="${note.key}" data-i18n-params="${escapeHtml(JSON.stringify(note.params))}">${escapeHtml(formatMessage(note.key,note.params))}</p>`;
  return state.updateNote ? `<p class="briefing-update-note" id="briefing-update-note" role="status" aria-live="polite" lang="en" data-no-translate>${escapeHtml(state.updateNote)}</p>` : '<p class="briefing-update-note" id="briefing-update-note" role="status" aria-live="polite"></p>';
}

function homeBriefingMarkup(state, scenarioOpen) {
  const day = agentDay(state);
  const region = regions[state.region];
  const items = briefingItems(state);
  const selected = new Set(state.selectedByDay[agentDayKey(state)] || []);
  const event = officialEvent(state);
  return `<section class="briefing-head monitor-head">
      <div><h2>Your sky briefing</h2><p class="briefing-deck">Your local time · <time data-monitor-clock></time></p></div>
    </section>
    <section class="monitor-panel" aria-labelledby="monitor-title" data-live-monitor>
      <header class="monitor-header"><div><p class="briefing-eyebrow">ASSIGNED MONITOR</p><h3 id="monitor-title">Monitor the sky for me</h3></div><button class="monitor-refresh" type="button" data-monitor-refresh>Check again</button></header>
      <p class="monitor-description">Checks your saved interests when you open the briefing and every five minutes while it stays open and visible.</p>
      <p class="monitor-status" data-monitor-status role="status" aria-live="polite"></p>
      <ol class="monitor-tasks" aria-label="Source checks"></ol>
    </section>
    <details class="briefing-scenario" ${scenarioOpen ? 'open' : ''}>
      <summary><span>Explore the observing scenario</span><span class="scenario-label">SIMULATED</span></summary>
      <div class="scenario-content">
    <section class="briefing-head scenario-head"><div><h3>North Ridge observing plan</h3><p class="briefing-deck">${day.dateLabel} · ${escapeHtml(region.label)}</p></div>
      <button type="button" class="advance-day" data-agent-action="advance-day"><span aria-hidden="true">↻</span> Advance to next day</button></section>
    ${briefingUpdateNote(state)}
    <section class="briefing-event-strip" aria-label="Observing night scenario notice"><span class="briefing-category">OBSERVING NIGHT NOTICE</span><div><strong>${event.dateLabel} · ${event.time}</strong><span>${escapeHtml(event.location)}</span></div>${sceneLink(2026, 'source-event', 'Open notice →')}</section>
    <div class="briefing-summary-row"><div><span class="briefing-summary-label">Tonight’s window</span><strong>${escapeHtml(region.forecasts[state.dayOffset % 3])}</strong></div><div class="briefing-summary-count">${selectedCountMarkup(state)}${sceneLink(2026, 'plan', 'Review plan →')}</div></div>
    ${items.length ? `<div class="briefing-cards" aria-label="Suggested briefing items">${items.map((item) => briefingItemCard(item, selected.has(item.id))).join('')}</div>` : '<p class="no-briefing-items">Choose at least one interest to build your sky briefing.</p>'}
    <div class="briefing-actions">${sceneLink(2026, 'plan', 'Review selected plan →')}</div>
      </div>
    </details>`;
}

function sourceDetails(page, state) {
  const region = regions[state.region];
  const checked = `${agentDay(state).shortDate} · 2:00 p.m. local (curated demo check time)`;
  const sourceMap = {
    'source-moon': { tag: 'MOON PHASES', title: 'Moon and sky conditions', source: 'NASA Moon phases', url: 'https://science.nasa.gov/moon/moon-phases/', body: `The Moon percentage and viewing note shown in the ${escapeHtml(region.label)} briefing are simulated values. NASA’s Moon pages explain the real lunar phase cycle and how sunlight creates the phases.` },
    'source-weather': { tag: 'WEATHER', title: 'Local cloud outlook', source: 'National Weather Service', url: 'https://www.weather.gov/', body: `The cloud window shown for ${escapeHtml(region.label)} is a fictional local scenario, not a live forecast. The National Weather Service provides real forecasts and radar for US locations; check it before making an actual outing.` },
    'source-iss': { tag: 'ORBITAL TRACKING', title: 'International Space Station pass', source: 'NASA · Spot the Station', url: 'https://spotthestation.nasa.gov/', body: `The pass time and direction in this briefing are illustrative local data. NASA’s Spot the Station service can calculate real ISS sighting opportunities for a location.` },
    'source-image': { tag: 'SPACE RESEARCH + IMAGES', title: 'Webb’s first images of Jupiter', source: 'NASA · Webb’s Jupiter Images Showcase Auroras, Hazes', url: 'https://science.nasa.gov/blogs/webb/2022/08/22/webbs-jupiter-images-showcase-auroras-hazes/', body: `Published 22 August 2022. Webb’s near-infrared observations show Jupiter’s auroras in detail alongside its rings and small moons. Charged particles guided by Jupiter’s magnetic field excite gases in the upper atmosphere, producing the auroral glow. The ${escapeHtml(region.imageTimes[state.dayOffset % 3])} local sky-talk slot is part of the fictional observatory schedule.` },
    'source-event': { tag: 'OFFICIAL BULLETIN', title: 'Observing Night · North Ridge Observatory', source: 'North Ridge Observatory · local demo bulletin', url: '', body: `This event notice is simulated for the exhibit. The current listing is ${officialEvent(state).dateLabel} at ${officialEvent(state).time}, at ${officialEvent(state).location}. The date and start time change as the briefing advances to its next day.` },
  };
  const source = sourceMap[page];
  const reference = source.url ? `<a href="${source.url}" target="_blank" rel="noopener">Open the real reference ↗</a>` : '<span>Local fictional notice · simulated</span>';
  return `<article class="source-note-page"><p class="briefing-eyebrow">SOURCE NOTE / ${source.tag}</p><h2>${source.title}</h2><p class="source-note-check">Reference used · ${checked}</p><p>${source.body}</p><div class="source-reference-card"><strong>${source.source}</strong>${reference}</div><p class="source-local-label">Local briefing data: simulated for the North Ridge scene and not fetched from the reference site.</p>${sceneLink(2026, 'home', '← Back to briefing')}</article>`;
}

function bulletinMarkup(state) {
  const day = agentDay(state);
  const region = regions[state.region];
  const event = officialEvent(state);
  const selected = selectedAgentItems(state);
  return `<article class="briefing-document"><p class="briefing-eyebrow">NORTH RIDGE OBSERVATORY / DAILY BULLETIN</p><h2>Observing Night update</h2><p class="bulletin-issued">Issued ${day.dateLabel} · 2:00 p.m. local · Simulated bulletin</p><p>${escapeHtml(region.forecasts[state.dayOffset % 3])} The local sky note is a curated scenario, not a live forecast.</p><div class="bulletin-facts"><strong>${event.dateLabel} · ${event.time}</strong><span>${escapeHtml(event.location)}</span><span>${selected.length ? `${selected.length} plan item${selected.length === 1 ? '' : 's'} selected` : 'No plan items selected yet'}</span></div><ul class="bulletin-source-list"><li>${sceneLink(2026, 'source-event', 'Official event notice and date/time update')}</li><li>${sceneLink(2026, 'source-weather', 'Weather reference and simulation note')}</li><li>${sceneLink(2026, 'source-iss', 'ISS pass reference and simulation note')}</li><li>${sceneLink(2026, 'source-moon', 'Moon phase reference and simulation note')}</li></ul>${sceneLink(2026, 'plan', 'Review tonight’s plan →')}</article>`;
}

function scheduleMarkup(state) {
  const day = agentDay(state);
  const region = regions[state.region];
  const items = briefingItems(state).sort((a, b) => a.startMinutes - b.startMinutes);
  return `<article class="briefing-document"><p class="briefing-eyebrow">COMMUNITY CALENDAR / NORTH RIDGE</p><h2>Public observing schedule</h2><p>${day.dateLabel} · local scenario for ${escapeHtml(region.label)}</p><ol class="schedule-list">${items.map((item) => `<li><time datetime="${item.date}T${item.start}">${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.location)}</span></div>${sceneLink(2026, item.sourcePages[0], 'Source note ↗')}</li>`).join('')}</ol><p class="simulation-disclosure">Event timing and local conditions are curated demo data.</p>${sceneLink(2026, 'plan', 'Select items for my plan →')}</article>`;
}

function posterSnapshot(poster) {
  try { return poster.snapshot(); } catch { return { title: 'Observing Night poster', date: '—', time: '—', location: '—' }; }
}

function scheduleProposal(items, state) {
  const event = officialEvent(state);
  return {
    date: event.dateLabel,
    time: event.time,
    location: event.location,
  };
}

function planMarkup(state, poster) {
  const day = agentDay(state);
  const region = regions[state.region];
  const items = selectedAgentItems(state);
  const key = agentDayKey(state);
  const approved = state.approvedPlans[key] || null;
  const matchesSaved = approved && approved.length === items.length && approved.every((id, index) => id === items[index]?.id);
  const currentPoster = posterSnapshot(poster);
  const proposal = scheduleProposal(items, state);
  const posterHasUpdate = Boolean(state.posterUpdates[key]);
  return `<article class="plan-review-page"><p class="briefing-eyebrow">MY OBSERVING PLAN / ${day.shortDate.toUpperCase()}</p><h2>Review the evening</h2><p class="plan-intro">${escapeHtml(region.label)} · ${escapeHtml(region.location)} · ${items.length} selected item${items.length === 1 ? '' : 's'}</p>
    ${matchesSaved ? '<p class="plan-saved" role="status">This plan is saved on this device.</p>' : approved ? '<p class="plan-changed" role="status">Your selections changed after the last save. Save again to update this plan.</p>' : ''}
    ${items.length ? `<ol class="plan-timeline">${items.map((item) => `<li><time datetime="${item.date}T${item.start}">${escapeHtml(item.time)}</time><div><span class="plan-kind">${item.category}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><span>${escapeHtml(item.location)}</span><div class="briefing-sources">${item.sourcePages.map((source, index) => sceneLink(2026, source, `Source: ${item.sourceLabels[index]}`)).join('')}</div></div><label class="plan-pick"><input type="checkbox" data-plan-item="${item.id}" checked><span>Keep</span></label></li>`).join('')}</ol>` : '<p class="no-briefing-items">No items are selected. Return to the briefing and choose at least one idea.</p>'}
    <section class="poster-proposal" aria-labelledby="poster-proposal-title"><div><p class="briefing-eyebrow">OPTIONAL / 2013 FIELDWORK POSTER</p><h3 id="poster-proposal-title">Proposed schedule change</h3><p>Proposal from the official notice, separate from your selected sky-plan activities. Only date, time, and location fields are proposed. Existing poster edits stay in place. ${sceneLink(2026, 'source-event', 'Open the notice →')}</p></div>
      <dl class="poster-diff"><div><dt>Date</dt><dd><span>${escapeHtml(currentPoster.date || '—')}</span><b>→</b><strong>${escapeHtml(proposal.date || '—')}</strong></dd></div><div><dt>Time</dt><dd><span>${escapeHtml(currentPoster.time || '—')}</span><b>→</b><strong>${escapeHtml(proposal.time || 'Select an item first')}</strong></dd></div><div><dt>Location</dt><dd><span>${escapeHtml(currentPoster.location || '—')}</span><b>→</b><strong>${escapeHtml(proposal.location || '—')}</strong></dd></div></dl>
      <label class="poster-opt-in"><input type="checkbox" name="sync-poster" data-sync-poster ${state.syncPoster ? 'checked' : ''}><span>Also update the 2013 Fieldwork poster when saving this plan</span></label>
      ${posterHasUpdate ? `<p class="poster-updated" role="status">Poster schedule updated for ${escapeHtml(day.shortDate)}. ${sceneLink(2026, 'board', 'View the poster archive →')}</p>` : ''}
    </section>
    <div class="plan-actions"><button type="button" class="plan-primary" data-agent-action="approve-plan" ${items.length ? '' : 'disabled'}>Save this observing plan</button><button type="button" class="plan-secondary" data-agent-action="download-ics" ${items.length ? '' : 'disabled'}>Download .ics calendar</button><a href="?era=2013&amp;page=poster" data-era="2013" data-page="poster">Open the 2013 poster editor →</a></div><p id="plan-feedback" class="plan-feedback" role="status" aria-live="polite"></p>
  </article>`;
}

function boardArchiveMarkup(state, poster) {
  const snapshot = posterSnapshot(poster);
  const key = agentDayKey(state);
  const approved = state.approvedPlans[key] || [];
  const items = selectedAgentItems(state).filter((item) => approved.includes(item.id));
  return `<article class="briefing-document"><p class="briefing-eyebrow">FIELDWORK / POSTER</p><h2>Observing Night poster</h2><p>Current poster schedule and the items saved from this evening’s briefing.</p><dl class="poster-current"><div><dt>Date</dt><dd>${escapeHtml(snapshot.date || '—')}</dd></div><div><dt>Time</dt><dd>${escapeHtml(snapshot.time || '—')}</dd></div><div><dt>Location</dt><dd>${escapeHtml(snapshot.location || '—')}</dd></div></dl>${items.length ? `<h3>Saved plan</h3><ul>${items.map((item) => `<li>${escapeHtml(item.time)} · ${escapeHtml(item.title)}</li>`).join('')}</ul>` : '<p>No plan from this day has been approved yet.</p>'}<a href="?era=2013&amp;page=poster" data-era="2013" data-page="poster">Open the 2013 poster editor →</a></article>`;
}

function toolsMarkup() {
  return `<article class="briefing-document"><p class="briefing-eyebrow">FIELD NOTES / 2026</p><h2>A web prepared for agents</h2><p>A browser-side monitor checks public sources for your saved interests while the briefing is visible. The activity shows requests and results. It uses fixed source rules. The observing scenario lets you review a plan, save it here, and approve a local poster update.</p><p>WebMCP is one experiment in giving browser agents structured ways to interact with a page.</p><a href="https://developer.chrome.com/blog/ai-webmcp-origin-trial" target="_blank" rel="noopener">Chrome for Developers · WebMCP origin trial ↗</a>${sceneLink(2026, 'home', '← Back to proactive briefing')}</article>`;
}

function agentPageContent(page, state, poster, scenarioOpen) {
  if (page === 'home') return homeBriefingMarkup(state, scenarioOpen);
  if (page === 'plan') return planMarkup(state, poster);
  if (page === 'bulletin') return bulletinMarkup(state);
  if (page === 'schedule') return scheduleMarkup(state);
  if (page === 'board') return boardArchiveMarkup(state, poster);
  if (page === 'tools') return toolsMarkup();
  if (page.startsWith('source-')) return sourceDetails(page, state);
  return homeBriefingMarkup(state, scenarioOpen);
}

function agentMarkup(page, state, poster, scenarioOpen) {
  const day = agentDay(state);
  const region = regions[state.region];
  return `<article class="briefing-workspace">
    <header class="briefing-site-header"><a class="briefing-brand" href="?era=2026" data-page="home"><span aria-hidden="true">✦</span><span>North Ridge</span></a>${agentNav(page)}<span class="briefing-date">${page === 'home' ? 'Live briefing' : `Scenario · ${day.shortDate}`} · ${escapeHtml(region.label)}</span></header>
    <div class="briefing-layout"><main class="briefing-main">${agentPageContent(page, state, poster, scenarioOpen)}</main>
      <aside class="briefing-rail" aria-label="Briefing settings and selected plan">
        ${preferencesMarkup(state)}
        <section class="rail-plan"><div class="rail-plan-heading"><h3>Scenario plan</h3>${selectedCountMarkup(state)}</div><p>Items stay on this device until you choose to save or download them.</p>${sceneLink(2026, 'plan', 'Review plan →')}</section>
        <section class="rail-sources"><h3>Scenario reference notes</h3><ul><li>${sceneLink(2026, 'source-moon', 'Moon phase')}</li><li>${sceneLink(2026, 'source-weather', 'Weather')}</li><li>${sceneLink(2026, 'source-iss', 'ISS pass')}</li><li>${sceneLink(2026, 'source-image', 'Space image')}</li></ul></section>
        <p class="briefing-simulation-note">Region forecasts and pass times are scenarios for this exhibit, not live service data.</p>
      </aside>
    </div>
    <footer class="briefing-footer"><span>Public source checks · No account connected</span>${sceneLink(2026, 'tools', 'How this web works →')}</footer>
  </article>`;
}

export function createModern(poster) {
  let question = combinedQuestion;
  let topic = 'both';
  let searchStatus = 'complete';
  let searchProgress = 3;
  let searchGeneration = 0;
  let searchTimers = [];
  let activeSearchRoot = null;
  let liveState = { query: '', status: 'idle', message: '', results: [], summaryStage: 0, resultsRevealed: 0 };
  let liveGeneration = 0;
  let liveController = null;
  let liveTimers = [];
  let activeLiveRoot = null;
  let scenarioOpen = false;
  const monitor = createMonitor();
  const agentState = loadAgentState();
  ensureAgentSelection(agentState);
  persistAgentState(agentState);

  function clearSearchTimers() {
    searchGeneration += 1;
    searchTimers.forEach(clearTimeout);
    searchTimers = [];
  }

  function cancelLiveSearch() {
    liveGeneration += 1;
    liveController?.abort();
    liveController = null;
    activeLiveRoot = null;
    liveTimers.forEach(clearTimeout);
    liveTimers = [];
    if (liveState.status === 'loading') {
      liveState.status = liveState.results.length ? 'complete' : 'error';
      liveState.message = liveState.results.length ? 'Showing the sources already found.' : 'Search paused. Try again when you are back in Orbit Search.';
      liveState.messageKey=liveState.results.length?'live.existing':'live.paused';
      liveState.messageParams={};
      liveState.summaryStage = liveState.results.length ? 3 : 0;
      liveState.resultsRevealed = liveState.results.length;
    }
  }

  function renderLiveState() {
    const root = activeLiveRoot;
    const target = root?.isConnected ? root.querySelector('.live-search-results') : null;
    if (target) target.outerHTML = liveSearchMarkup(liveState);
  }

  function apiQuery(query) {
    const translations = [
      [/^(?:월식|달\s*식)$/, 'lunar eclipse'],
      [/^(?:제임스\s*웹(?:\s*(?:우주\s*)?망원경)?|웹\s*망원경)$/, 'James Webb Space Telescope'],
      [/^화성$/, 'Mars'],
      [/^목성$/, 'Jupiter'],
      [/^토성$/, 'Saturn'],
      [/^(?:국제\s*)?우주\s*정거장$/, 'International Space Station'],
      [/^달$/, 'Moon'],
    ];
    for (const [pattern, replacement] of translations) if (pattern.test(query)) return replacement;
    return query;
  }

  function displayDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }

  async function fetchLiveSource(url, signal, getItems) {
    const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('Search API request failed');
    const payload = await response.json();
    const items = getItems(payload);
    if (!Array.isArray(items)) throw new Error('Search API returned unreadable results');
    return payload;
  }

  function normalizeLiveResults(nasaPayload, flightPayload) {
    const retrieved = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const records = [];
    const nasaItems = nasaPayload?.collection?.items || [];
    const seenNasaTitles = new Set();
    for (const item of nasaItems) {
      const data = item?.data?.[0];
      const id = data?.nasa_id;
      const url = id ? `https://images.nasa.gov/details/${encodeURIComponent(id)}` : safeHttpUrl(item?.href);
      if (typeof data?.title !== 'string' || !data.title.trim() || !url) continue;
      const titleKey = data.title.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      if (seenNasaTitles.has(titleKey)) continue;
      seenNasaTitles.add(titleKey);
      const preview = typeof id === 'string' && id.trim() && Array.isArray(item?.links)
        ? item.links.find((link) => link?.render === 'image' && link?.rel === 'preview')?.href
        : '';
      let thumbnail = '';
      if (preview) {
        const validPreview = safeHttpUrl(preview);
        if (validPreview && new URL(validPreview).hostname === 'images-assets.nasa.gov') thumbnail = validPreview;
      }
      records.push({
        provider: 'nasa', providerLabel: 'NASA Image and Video Library', domain: 'images.nasa.gov',
        id: String(id || ''), thumbnail, title: data.title, summary: String(data.description || '').replace(/\s+/g, ' ').trim().slice(0, 360),
        published: displayDate(data.date_created), retrieved, url,
      });
      if (seenNasaTitles.size >= 6) break;
    }
    for (const item of flightPayload?.results || []) {
      const url = safeHttpUrl(item?.url);
      if (typeof item?.title !== 'string' || !item.title.trim() || !url) continue;
      const domain = new URL(url).hostname.replace(/^www\./, '');
      records.push({
        provider: 'spaceflight', providerLabel: item.news_site || 'Spaceflight News', domain,
        title: item.title, summary: String(item.summary || '').replace(/\s+/g, ' ').trim().slice(0, 360),
        published: displayDate(item.published_at), retrieved, url,
      });
    }
    return records;
  }

  async function startLiveSearch(root, value = liveState.query) {
    cancelLiveSearch();
    const generation = liveGeneration;
    const query = value.trim();
    if (!query) return;
    liveState = { query, status: 'loading', message: 'Searching live NASA and Spaceflight News sources…', messageKey:'live.searching', messageParams:{}, results: [], summaryStage: 0, resultsRevealed: 0 };
    activeLiveRoot = root;
    renderLiveState();
    const controller = new AbortController();
    liveController = controller;
    const q = encodeURIComponent(apiQuery(query));
    let timeout;
    try {
      timeout = setTimeout(() => controller.abort(new Error('The live search timed out.')), 9000);
      const requests = await Promise.allSettled([
        fetchLiveSource(`https://images-api.nasa.gov/search?q=${q}&media_type=image&page_size=24`, controller.signal, (json) => json?.collection?.items),
        fetchLiveSource(`https://api.spaceflightnewsapi.net/v4/articles/?search=${q}&limit=6&ordering=-published_at`, controller.signal, (json) => json?.results),
      ]);
      if (generation !== liveGeneration) return;
      const results = normalizeLiveResults(requests[0].value, requests[1].value);
      const failed = requests.flatMap((request, index) => request.status === 'rejected' ? [index === 0 ? 'NASA' : 'Spaceflight News'] : []);
      if (failed.length === requests.length) {
        throw new Error(`${failed.join(' and ')} could not be loaded. Try the search again.`);
      }
      liveState.results = results;
      const sourceNote = failed.length ? ` ${failed.join(' and ')} could not be loaded.` : '';
      const readyMessage = `Showing ${results.length} live source records for “${query}”.${sourceNote}`;
      liveState.message = results.length
        ? `${results.length} live records found. Preparing a source-based overview…${sourceNote}`
        : `No live results found for “${query}”.${sourceNote}`;
      liveState.messageKey=results.length?(failed.length?'live.foundPartial':'live.found'):(failed.length?'live.nonePartial':'live.none');
      liveState.messageParams={count:results.length,query,source:failed.join(' and ')};
      liveController = null;
      if (!results.length) {
        liveState.status = 'complete';
        renderLiveState();
        return;
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finalKey=failed.length?'live.readyPartial':'live.ready';
      const steps = reduced
        ? [[0, 3, results.length, readyMessage,finalKey]]
        : [[240, 0, 0, liveState.message,liveState.messageKey], [600, 1, 0, 'Identifying useful sources…','live.identifying'], [1030, 2, 0, 'Reading the first source summary…','live.reading'], [1460, 3, Math.min(2, results.length), 'Showing the first source links…','live.links'], [1900, 3, results.length, readyMessage,finalKey]];
      for (const [delay, summaryStage, revealed, message,messageKey] of steps) {
        liveTimers.push(setTimeout(() => {
          if (generation !== liveGeneration) return;
          liveState.summaryStage = summaryStage;
          liveState.resultsRevealed = Math.max(liveState.resultsRevealed, revealed);
          liveState.message = message;
          liveState.messageKey=messageKey;
          liveState.messageParams={count:results.length,query,source:failed.join(' and ')};
          if (delay === steps.at(-1)[0]) {
            liveState.status = 'complete';
            liveTimers = [];
          }
          renderLiveState();
        }, delay));
      }
    } catch (error) {
      if (generation !== liveGeneration) return;
      liveController = null;
      liveState.status = 'error';
      liveState.message = controller.signal.reason?.message || error.message || 'The live sources could not be reached.';
      liveState.messageKey=controller.signal.aborted?'live.timedOut':'live.failed';
      liveState.messageParams={};
      renderLiveState();
    } finally {
      clearTimeout(timeout);
    }
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

  function markup(era, page) {
    return String(era) === '2023' ? searchMarkup(page, question, topic, searchStatus, searchProgress, liveState) : agentMarkup(page, agentState, poster, scenarioOpen);
  }

  function updatePlanCount(root) {
    const selected = new Set(agentState.selectedByDay[agentDayKey(agentState)] || []);
    const valid = new Set(briefingItems(agentState).map(({ id }) => id));
    const count = [...selected].filter((id) => valid.has(id)).length;
    root.querySelectorAll('[data-plan-count]').forEach((node) => {
      bindMessage(node,'agent.planCount',{count,noun:count===1?'item':'items'});
    });
    const save = root.querySelector('[data-agent-action="approve-plan"]');
    const download = root.querySelector('[data-agent-action="download-ics"]');
    if (save) save.disabled = count === 0;
    if (download) download.disabled = count === 0;
  }

  function rerenderAgentRoot(root, page, focusSelector, retainMonitor = false) {
    const livePanel = retainMonitor ? root.querySelector('[data-live-monitor]') : null;
    const clock = retainMonitor ? root.querySelector('[data-monitor-clock]') : null;
    root.innerHTML = agentMarkup(page, agentState, poster, scenarioOpen);
    if (livePanel && clock) {
      root.querySelector('[data-live-monitor]').replaceWith(livePanel);
      root.querySelector('[data-monitor-clock]').replaceWith(clock);
    } else {
      monitor.mount(root, agentState.region, agentState.interests);
    }
    const focusTarget = focusSelector ? root.querySelector(focusSelector) : null;
    if (focusTarget) {
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  }

  function updatePlanSelection(root, itemId, checked) {
    ensureAgentSelection(agentState);
    const key = agentDayKey(agentState);
    const current = new Set(agentState.selectedByDay[key]);
    if (checked) current.add(itemId);
    else current.delete(itemId);
    agentState.selectedByDay[key] = [...current];
    persistAgentState(agentState);
    updatePlanCount(root);
    const feedback = root.querySelector('#plan-feedback');
    if (feedback) feedback.textContent = '';
  }

  function updatePreferences(root, form, page, goTo) {
    const data = new FormData(form);
    const previousSelection = new Set(agentState.selectedByDay[agentDayKey(agentState)] || []);
    agentState.region = Object.hasOwn(regions, data.get('region')) ? data.get('region') : 'north';
    agentState.interests = agentInterests.map(([id]) => id).filter((id) => data.getAll('interest').includes(id));
    const available = new Set(briefingItems(agentState).map(({ id }) => id));
    agentState.selectedByDay[agentDayKey(agentState)] = [...previousSelection].filter((id) => available.has(id));
    setAgentNotice(agentState,'settings');
    persistAgentState(agentState);
    if (page !== 'home') {
      goTo('home');
      return;
    }
    rerenderAgentRoot(root, 'home', '.briefing-head h2');
    updatePlanCount(root);
  }

  function advanceBriefing(root, page, goTo) {
    const previousSelection = [...(agentState.selectedByDay[agentDayKey(agentState)] || [])];
    agentState.dayOffset = Math.min(60, agentState.dayOffset + 1);
    ensureAgentSelection(agentState, previousSelection);
    const day = agentDay(agentState);
    const region = regions[agentState.region];
    const slot = agentState.dayOffset % 3;
    const passTime = region.issTimes[slot];
    const event = officialEvent(agentState);
    setAgentNotice(agentState,'advance');
    persistAgentState(agentState);
    if (page !== 'home') {
      goTo('home');
      return;
    }
    scenarioOpen = true;
    rerenderAgentRoot(root, 'home', '.scenario-head h3', true);
    updatePlanCount(root);
  }

  function savePlan(root, page, goTo) {
    const items = selectedAgentItems(agentState);
    if (!items.length) return;
    const key = agentDayKey(agentState);
    agentState.approvedPlans[key] = items.map(({ id }) => id);
    const syncPoster = root.querySelector('[data-sync-poster]')?.checked === true;
    agentState.syncPoster = syncPoster;
    const proposal = scheduleProposal(items, agentState);
    if (syncPoster) {
      try {
        if (typeof poster.updateSchedule !== 'function') throw new Error('The Fieldwork poster editor is not available.');
        poster.updateSchedule(proposal);
        agentState.posterUpdates[key] = { ...proposal, savedAt: Date.now() };
        setAgentNotice(agentState,'posterSaved');
      } catch {
        setAgentNotice(agentState,'posterFailed');
      }
    } else {
      setAgentNotice(agentState,'planSaved');
    }
    agentState.syncPoster = false;
    persistAgentState(agentState);
    if (page !== 'plan') {
      goTo('plan');
      return;
    }
    rerenderAgentRoot(root, 'plan', '.plan-review-page h2');
    updatePlanCount(root);
  }

  function downloadCalendar(root) {
    const items = selectedAgentItems(agentState);
    if (!items.length) return;
    const day = agentDay(agentState);
    const region = regions[agentState.region];
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Build Canvas//Work 7 Sky Briefing//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      ...calendarZoneLines(region.timeZone, day.dateIso),
    ];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    for (const item of items) {
      const start = calendarDateTime(item.date, item.startMinutes);
      const end = calendarDateTime(item.date, item.startMinutes + item.duration);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.id}-${item.date}@build-canvas.local`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${region.timeZone}:${start}`,
        `DTEND;TZID=${region.timeZone}:${end}`,
        `SUMMARY:${escapeIcs(item.title)}`,
        `LOCATION:${escapeIcs(`${item.location}, ${region.label}`)}`,
        `DESCRIPTION:${escapeIcs(`${item.summary} Reference notes are inside the Work 7 briefing. Local event details are simulated.`)}`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    const blob = new Blob([foldIcs(lines)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `north-ridge-plan-${day.dateIso}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const feedback = root.querySelector('#plan-feedback');
    if (feedback) bindMessage(feedback,'agent.calendar',{count:items.length,noun:items.length===1?'event':'events'});
  }

  const agentPageBindings = new WeakMap();

  function bindAgentPage(root, page, goTo) {
    const existing = agentPageBindings.get(root);
    if (existing) {
      existing.page = page;
      existing.goTo = goTo;
      return;
    }
    const binding = { page, goTo };
    agentPageBindings.set(root, binding);
    root.addEventListener('change', (event) => {
      const pick = event.target.closest('[data-plan-item]');
      if (pick) updatePlanSelection(root, pick.dataset.planItem, pick.checked);
      const sync = event.target.closest('[data-sync-poster]');
      if (sync) {
        agentState.syncPoster = sync.checked;
        persistAgentState(agentState);
      }
    });
    root.addEventListener('submit', (event) => {
      if (!event.target.matches('#briefing-preferences')) return;
      event.preventDefault();
      updatePreferences(root, event.target, binding.page, binding.goTo);
    });
    root.addEventListener('toggle', (event) => {
      if (event.target.matches('.briefing-scenario')) scenarioOpen = event.target.open;
    }, true);
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-agent-action]')?.dataset.agentAction;
      if (action === 'advance-day') advanceBriefing(root, binding.page, binding.goTo);
      if (action === 'approve-plan') savePlan(root, binding.page, binding.goTo);
      if (action === 'download-ics') downloadCalendar(root);
    });
  }

  function init(root, era, page, goTo) {
    if (String(era) === '2023') {
      if (page !== 'result') {
        activeSearchRoot = null;
        finishInterruptedSearch();
      } else activeSearchRoot = root;
      if (page === 'live') {
        activeLiveRoot = root;
        if (liveState.status === 'loading' && !liveController && !liveTimers.length) startLiveSearch(root, liveState.query);
      } else {
        activeLiveRoot = null;
        if (liveState.status === 'loading') cancelLiveSearch();
      }
      const form = root.querySelector('.search-form');
      if (!form) return;
      root.addEventListener('error', (event) => {
        const image = event.target;
        if (image instanceof HTMLImageElement && image.matches('[data-live-preview]')) {
          image.hidden = true;
          image.closest('.live-image-frame')?.setAttribute('data-image-error', 'true');
        }
      }, true);
      const search = form.elements.question;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = search.value.trim();
        const match = classifyQuestion(value, topic);
        if (!match) return;
        root.querySelector('#search-message').textContent = '';
        if (match === 'live') {
          liveState = { query: value, status: 'loading', message: 'Connecting to live astronomy sources…', results: [], summaryStage: 0, resultsRevealed: 0 };
          if (page === 'live') startLiveSearch(root, value);
          else goTo('live');
        } else {
          topic = match;
          question = value;
          cancelLiveSearch();
          if (page === 'result') animateSearch(root);
          else {
            clearSearchTimers();
            searchStatus = 'loading';
            searchProgress = 0;
            goTo('result');
          }
        }
      });
      for (const button of root.querySelectorAll('[data-search]')) {
        button.addEventListener('click', () => {
          search.value = exampleQuestion(button.dataset.search);
          form.requestSubmit();
        });
      }
      for (const button of root.querySelectorAll('[data-search-query]')) {
        button.addEventListener('click', () => {
          search.value = getLocale() === 'ko' ? '월식' : 'lunar eclipse';
          form.requestSubmit();
        });
      }
      root.addEventListener('click', (event) => {
        if (event.target.closest('[data-live-retry]')) startLiveSearch(root, liveState.query || search.value);
      });
      if (page === 'result' && searchStatus === 'loading' && searchTimers.length === 0) animateSearch(root);
      return;
    }

    activeSearchRoot = null;
    finishInterruptedSearch();
    activeLiveRoot = null;
    if (liveState.status === 'loading') cancelLiveSearch();

    bindAgentPage(root, page, goTo);
    monitor.mount(root, agentState.region, agentState.interests);
  }

  return { markup, init, cancelMonitor: monitor.cancel, cancelLiveSearch };
}
