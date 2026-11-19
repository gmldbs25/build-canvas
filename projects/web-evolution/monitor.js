const newsEndpoint = 'https://api.spaceflightnewsapi.net/v4/articles/';
const weatherEndpoint = 'https://api.open-meteo.com/v1/forecast';
const referencePlaces = {
  north: { name: 'Yosemite Valley, California', latitude: 37.746, longitude: -119.594 },
  coast: { name: 'Point Reyes, California', latitude: 38.069, longitude: -122.807 },
  desert: { name: 'Flagstaff, Arizona', latitude: 35.198, longitude: -111.651 },
};
const clockFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});
const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  timeZoneName: 'short',
});

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function timeNode(date, formatter = timeFormat) {
  const time = element('time', formatter.format(date));
  time.dateTime = date.toISOString();
  return time;
}

function sourceLink(label, url) {
  const link = element('a', label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

async function fetchJson(endpoint, parameters, signal) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams(parameters);
  const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('Feed request failed');
  return response.json();
}

async function fetchNews(topic, signal) {
  const data = await fetchJson(newsEndpoint, { limit: '3', news_site: 'NASA', search: topic, ordering: '-published_at' }, signal);
  if (!Array.isArray(data.results)) throw new Error('Unexpected news feed');
  return data.results.slice(0, 3).flatMap((item) => {
    if (typeof item?.title !== 'string' || !item.title.trim() || typeof item.published_at !== 'string') return [];
    const published = new Date(item.published_at);
    const url = typeof item.url === 'string' ? URL.parse(item.url) : null;
    if (!url || !['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
        !/(^|\.)nasa\.gov$/i.test(url.hostname) || !Number.isFinite(published.getTime())) return [];
    const summary = typeof item.summary === 'string' ? item.summary.replace(/<[^>]+>/g, '').trim().split(/\s+/).slice(0, 22).join(' ') : '';
    const excerpt = summary.length < 145 ? summary : `${summary.slice(0, 145).replace(/\s+\S*$/, '')}…`;
    return [{ title: item.title.trim().slice(0, 240), url: url.href, published, excerpt }];
  });
}

async function fetchWeather(place, signal) {
  const { current } = await fetchJson(weatherEndpoint, {
    latitude: place.latitude, longitude: place.longitude,
    current: 'temperature_2m,cloud_cover', timeformat: 'unixtime', timezone: 'GMT',
  }, signal);
  if (!Number.isFinite(current?.time) || !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.cloud_cover) || current.cloud_cover < 0 || current.cloud_cover > 100) {
    throw new Error('Unexpected forecast response');
  }
  const validAt = new Date(current.time * 1000);
  if (!Number.isFinite(validAt.getTime())) throw new Error('Unexpected forecast time');
  return { validAt, temperature: current.temperature_2m, clouds: current.cloud_cover };
}

function newsItem(article, includeExcerpt = false) {
  const item = element('li', undefined, 'monitor-news-item');
  const metadata = element('p', 'NASA · Published ');
  metadata.append(timeNode(article.published));
  item.append(sourceLink(article.title, article.url), metadata);
  if (includeExcerpt && article.excerpt) item.append(element('p', article.excerpt, 'monitor-excerpt'));
  return item;
}

function newsMarkup(articles) {
  const output = document.createDocumentFragment();
  const latest = element('ul', undefined, 'monitor-news');
  latest.append(newsItem(articles[0], true));
  output.append(latest);
  if (articles.length > 1) {
    const details = element('details', undefined, 'monitor-more');
    const more = element('ul', undefined, 'monitor-news');
    more.append(...articles.slice(1).map((article) => newsItem(article)));
    details.append(element('summary', `${articles.length - 1} more NASA updates`), more);
    output.append(details);
  }
  const attribution = element('p', 'Delivered by ', 'monitor-attribution');
  attribution.append(sourceLink('Spaceflight News API', 'https://www.spaceflightnewsapi.net/'));
  output.append(attribution);
  return output;
}

function weatherMarkup(data, place) {
  const output = document.createDocumentFragment();
  const valid = element('p', 'Model estimate for ');
  valid.append(timeNode(data.validAt));
  const attribution = element('p', 'Forecast data by ', 'monitor-attribution');
  attribution.append(sourceLink('Open-Meteo', 'https://open-meteo.com/'), ` · Reference location: ${place.name}`);
  output.append(
    element('p', `${data.clouds}% cloud cover · ${data.temperature.toFixed(1)} °C`, 'monitor-weather'),
    valid,
    attribution,
  );
  return output;
}

function assignedTasks(region, interests) {
  const tasks = [];
  if (interests.includes('moon')) {
    const place = referencePlaces[region];
    tasks.push({
      label: 'Sky conditions', source: place.name,
      load: (signal) => fetchWeather(place, signal),
      render: (data) => weatherMarkup(data, place),
    });
  }
  if (interests.includes('iss')) {
    tasks.push({ label: 'Station updates', source: 'NASA · International Space Station', load: (signal) => fetchNews('international space station', signal), render: newsMarkup });
  }
  if (interests.includes('research')) {
    tasks.push({ label: 'Moon research', source: 'NASA · Moon', load: (signal) => fetchNews('moon', signal), render: newsMarkup });
  }
  return tasks;
}

function showTask(job) {
  const item = element('li', undefined, 'monitor-task');
  const header = element('div', undefined, 'monitor-task-heading');
  const identity = element('div');
  const badge = element('span', 'Checking', 'monitor-task-status');
  const output = element('div', undefined, 'monitor-task-output');
  item.dataset.monitorTask = 'checking';
  identity.append(element('h4', job.label), element('p', job.source));
  header.append(identity, badge);
  item.append(header, output);
  return { item, badge, output };
}

export function createMonitor() {
  let active;
  function cancel() {
    active?.abort();
    active = undefined;
  }

  function mount(root, region, interests) {
    cancel();
    const panel = root.querySelector('[data-live-monitor]');
    if (!panel) return;
    const lifetime = new AbortController();
    active = lifetime;
    const localClock = root.querySelector('[data-monitor-clock]');
    const status = panel.querySelector('[data-monitor-status]');
    const tasksList = panel.querySelector('.monitor-tasks');
    const refreshButton = panel.querySelector('[data-monitor-refresh]');
    const jobs = assignedTasks(region, interests);
    let running = false;

    function showClock() {
      const now = new Date();
      localClock.textContent = clockFormat.format(now);
      localClock.dateTime = now.toISOString();
    }

    async function refresh() {
      if (running || lifetime.signal.aborted) return;
      if (jobs.length === 0) {
        status.textContent = 'Choose a briefing interest to assign a feed.';
        refreshButton.disabled = true;
        return;
      }
      running = true;
      panel.dataset.monitorState = 'checking';
      refreshButton.setAttribute('aria-disabled', 'true');
      status.textContent = `Checking ${jobs.length} public ${jobs.length === 1 ? 'source' : 'sources'}…`;
      const timeout = AbortSignal.timeout(8500);
      const signal = AbortSignal.any([timeout, lifetime.signal]);
      const tasks = jobs.map(showTask);
      tasksList.replaceChildren(...tasks.map(({ item }) => item));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let completed = 0;
      await Promise.all(jobs.map(async (job, index) => {
        const { item, badge, output } = tasks[index];
        // Keep quick responses distinguishable while longer requests use actual network timing.
        const reveal = new Promise((resolve) => {
          const onCancel = () => {
            clearTimeout(delay);
            resolve();
          };
          const delay = setTimeout(() => {
            lifetime.signal.removeEventListener('abort', onCancel);
            resolve();
          }, reducedMotion ? 0 : 550 + index * 400);
          lifetime.signal.addEventListener('abort', onCancel, { once: true });
        });
        try {
          const data = await job.load(signal);
          const receivedAt = new Date();
          await reveal;
          if (lifetime.signal.aborted) return;
          item.dataset.monitorTask = 'checked';
          badge.textContent = 'Checked';
          output.append(Array.isArray(data) && !data.length ? element('p', 'This feed returned no usable articles.') : job.render(data));
          const checked = element('p', 'Checked ', 'monitor-check-time');
          checked.append(timeNode(receivedAt));
          output.append(checked);
          completed += 1;
        } catch {
          if (lifetime.signal.aborted) return;
          const timedOut = timeout.aborted;
          await reveal;
          if (lifetime.signal.aborted) return;
          item.dataset.monitorTask = 'unavailable';
          badge.textContent = timedOut ? 'Timed out' : 'Unavailable';
          output.append(element('p', timedOut ? 'The source did not respond in time.' : 'The source could not be reached or returned unreadable data.'));
        }
      }));

      if (lifetime.signal.aborted) return;
      running = false;
      refreshButton.removeAttribute('aria-disabled');
      panel.dataset.monitorState = completed === jobs.length ? 'complete' : completed ? 'partial' : 'unavailable';
      status.textContent = completed === jobs.length ? 'Source check complete.' : `${completed} of ${jobs.length} sources checked. Try again for unavailable sources.`;
    }

    const clockInterval = setInterval(showClock, 15000);
    const feedInterval = setInterval(() => {
      if (!document.hidden) refresh();
    }, 5 * 60 * 1000);
    lifetime.signal.addEventListener('abort', () => {
      clearInterval(clockInterval);
      clearInterval(feedInterval);
    }, { once: true });
    refreshButton.addEventListener('click', refresh, { signal: lifetime.signal });
    showClock();
    refresh();
  }

  return { mount, cancel };
}
