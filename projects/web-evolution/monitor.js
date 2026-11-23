import { createAgentReport } from './agent-report.js';

import { getLocale, bindMessage, formatMessage, subscribeLocale } from './i18n.js';
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
const clockFormatKo = new Intl.DateTimeFormat('ko-KR',{
  weekday:'long',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'
});
const timeFormatKo = new Intl.DateTimeFormat('ko-KR',{
  month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'
});

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function timeNode(date, formatter = timeFormat) {
  const time = element('time', (getLocale()==='ko'?timeFormatKo:formatter).format(date));
  time.dateTime = date.toISOString();
  time.dataset.monitorTime='true';
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
  const metadata = element('p');
  metadata.append(bindMessage(element('span'), 'monitor.published'),document.createTextNode(' '),timeNode(article.published));
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
    details.append(bindMessage(element('summary'),'monitor.more',{count:articles.length-1}), more);
    output.append(details);
  }
  const attribution = element('p', 'Delivered by ', 'monitor-attribution');
  attribution.append(sourceLink('Spaceflight News API', 'https://www.spaceflightnewsapi.net/'));
  output.append(attribution);
  return output;
}

function weatherMarkup(data, place) {
  const output = document.createDocumentFragment();
  const valid = element('p');
  valid.append(bindMessage(element('span'),'monitor.estimate'),document.createTextNode(' '));
  valid.append(timeNode(data.validAt));
  const attribution = element('p', undefined, 'monitor-attribution');
  attribution.append(bindMessage(element('span'),'monitor.forecastBy'),document.createTextNode(' '));
  attribution.append(sourceLink('Open-Meteo', 'https://open-meteo.com/'), ` · Reference location: ${place.name}`);
  output.append(
    element('p', getLocale()==='ko' ? `구름량 ${data.clouds}% · 기온 ${data.temperature.toFixed(1)} °C` : `${data.clouds}% cloud cover · ${data.temperature.toFixed(1)} °C`, 'monitor-weather'),
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
      id: 'weather', label: 'Sky conditions', source: place.name,
      load: (signal) => fetchWeather(place, signal),
      render: (data) => weatherMarkup(data, place),
    });
  }
  if (interests.includes('iss')) {
    tasks.push({ id: 'iss', label: 'Station updates', source: 'NASA · International Space Station', load: (signal) => fetchNews('international space station', signal), render: newsMarkup });
  }
  if (interests.includes('research')) {
    tasks.push({ id: 'research', label: 'Moon research', source: 'NASA · Moon', load: (signal) => fetchNews('moon', signal), render: newsMarkup });
  }
  return tasks;
}

function showTask(job) {
  const item = element('li', undefined, 'monitor-task');
  const header = element('div', undefined, 'monitor-task-heading');
  const identity = element('div');
  const badge = bindMessage(element('span', undefined, 'monitor-task-status'),'monitor.checkingLabel');
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
    const report = createAgentReport(root, status, refresh, lifetime.signal);
    let running = false;

    function showClock() {
      const now = new Date();
      localClock.textContent = (getLocale()==='ko'?clockFormatKo:clockFormat).format(now);
      localClock.dateTime = now.toISOString();
    }

    async function refresh() {
      if (running || lifetime.signal.aborted) return;
      if (jobs.length === 0) {
        status.textContent = 'Choose a briefing interest to assign a feed.';
        refreshButton.disabled = true;
        report.unassigned();
        return;
      }
      running = true;
      panel.dataset.monitorState = 'checking';
      refreshButton.setAttribute('aria-disabled', 'true');
      bindMessage(status,'monitor.checking',{count:jobs.length,noun:jobs.length===1?'source':'sources'});
      report.pending();
      const timeout = AbortSignal.timeout(8500);
      const signal = AbortSignal.any([timeout, lifetime.signal]);
      const tasks = jobs.map(showTask);
      tasksList.replaceChildren(...tasks.map(({ item }) => item));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const results = await Promise.all(jobs.map(async (job, index) => {
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
          bindMessage(badge,'monitor.checked');
          output.append(Array.isArray(data) && !data.length ? bindMessage(element('p'),'monitor.noArticles') : job.render(data));
          const checked = element('p', 'Checked ', 'monitor-check-time');
          checked.append(timeNode(receivedAt));
          output.append(checked);
          return { id: job.id, source: job.source, data };
        } catch {
          if (lifetime.signal.aborted) return;
          const timedOut = timeout.aborted;
          await reveal;
          if (lifetime.signal.aborted) return;
          item.dataset.monitorTask = 'unavailable';
          bindMessage(badge,timedOut?'monitor.timedOut':'monitor.unavailableLabel');
          output.append(bindMessage(element('p'),timedOut?'monitor.timeout':'monitor.unavailable'));
        }
      }));

      if (lifetime.signal.aborted) return;
      const checked = results.filter(Boolean);
      const completed = checked.length;
      running = false;
      refreshButton.removeAttribute('aria-disabled');
      panel.dataset.monitorState = completed === jobs.length ? 'complete' : completed ? 'partial' : 'unavailable';
      if(completed===jobs.length)bindMessage(status,'monitor.complete');
      else bindMessage(status,'monitor.partial',{done:completed,count:jobs.length});
      report.write(checked, jobs.length, reducedMotion);
    }

    // Update displayed dates without remounting the monitor or repeating an API request.
    const unsubscribeLocale=subscribeLocale(()=>{
      if(lifetime.signal.aborted)return;
      showClock();
      for(const time of panel.querySelectorAll('time[data-monitor-time]')){
        const date=new Date(time.dateTime);
        if(Number.isFinite(date.getTime()))time.textContent=(getLocale()==='ko'?timeFormatKo:timeFormat).format(date);
      }
    });
    lifetime.signal.addEventListener('abort',unsubscribeLocale,{once:true});
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
