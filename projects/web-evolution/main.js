import { eras, mosaicPage, orbitPage } from './eras.js';
import { createBoard } from './board.js';

const screen = document.querySelector('#screen');
const chrome = document.querySelector('#chrome');
const status = document.querySelector('#status');
const display = document.querySelector('#display');
const board = createBoard();
const timeline = document.querySelector('.timeline');
const trails = new Map();
let era;
let trail;

function readRoute() {
  const search = new URLSearchParams(window.location.search);
  const id = search.get('era');
  const era = Object.hasOwn(eras, id) ? id : '1993';
  const page = search.get('page');
  return { era, page: Object.hasOwn(eras[era].pages, page) ? page : 'home' };
}

function pageUrl(page) {
  return `?era=${era}${page === 'home' ? '' : `&page=${page}`}`;
}

function tool(action, icon, label, enabled = true) {
  return `<button type="button" data-action="${action}" aria-label="${label}" title="${label}" ${enabled ? '' : 'disabled'}>
    <span aria-hidden="true">${icon}</span><span class="tool-label">${label}</span>
  </button>`;
}

function renderChrome() {
  const { base, pages } = eras[era];
  const page = trail.pages[trail.index];
  const [title, path] = pages[page];
  const back = tool('back', '←', 'Back', trail.index > 0);
  const forward = tool('forward', '→', 'Forward', trail.index + 1 < trail.pages.length);
  const reload = tool('reload', '⟳', 'Reload');
  const home = tool('home', '⌂', 'Home', page !== 'home');
  const info = tool('info', '?', 'About this exhibit');
  const address = (label) => `<div class="address-row"><span>${label}</span><span class="address" aria-label="Simulated address">${base}${path}</span></div>`;

  if (era === '1993') {
    chrome.innerHTML = `
      <div class="mosaic-title"><span class="motif-mark" aria-hidden="true"></span><span>NCSA Mosaic</span><span class="motif-mark motif-end" aria-hidden="true"></span></div>
      <div class="period-menu" aria-hidden="true"><span><u>F</u>ile</span><span><u>O</u>ptions</span><span><u>N</u>avigate</span><span><u>A</u>nnotate</span><span><u>H</u>otlist</span></div>
      <div class="mosaic-location"><div>
        <div class="address-row"><span>Document Title:</span><span class="address">${title}</span></div>
        ${address('Document URL:')}
      </div><span class="mosaic-globe" aria-hidden="true"><i></i></span></div>`;
    status.innerHTML = `<div class="browser-tools">${back}${forward}${home}${reload}${info}</div><span class="status-text">Document Done</span>`;
  } else if (era === '1998') {
    chrome.innerHTML = `
      <div class="ie-title"><span class="ie-mark" aria-hidden="true">e</span><span>${title} – Internet Explorer</span><span class="window-buttons" aria-hidden="true"><b>_</b><b>□</b><b>×</b></span></div>
      <div class="period-menu" aria-hidden="true"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span>F<u>a</u>vorites</span><span><u>H</u>elp</span></div>
      <div class="browser-tools">${back}${forward}${reload}${home}${info}</div>
      ${address('Address')}`;
    status.innerHTML = '<span class="status-text">Done</span><span aria-hidden="true">◉ Internet zone</span>';
  } else {
    chrome.innerHTML = `
      <div class="chrome-tabs"><span class="chrome-tab"><span aria-hidden="true">▥</span> ${title}</span><span class="tab-outline" aria-hidden="true"></span></div>
      <div class="chrome-location"><div class="browser-tools">${reload}</div>${address('◈')}<div class="browser-tools">${info}</div></div>`;
    status.replaceChildren();
  }
}

function renderNotes() {
  const { caption, notes, prompt, sources } = eras[era];
  document.querySelector('#era-caption').textContent = `${era} / ${caption}`;
  document.querySelector('#try-it').textContent = prompt;
  document.querySelector('#field-notes').innerHTML = `
    <h2 class="eyebrow" id="notes-title" tabindex="-1">FIELD NOTES</h2>
    <p>${notes}</p>
    <details><summary>역사 자료</summary>
      <ul>${sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${label} ↗</a></li>`).join('')}</ul>
    </details>`;
}

function renderPage(focusPage = false) {
  const page = trail.pages[trail.index];
  renderChrome();
  const content = document.createElement('div');
  if (era === '1993') content.innerHTML = mosaicPage(page);
  if (era === '1998') content.innerHTML = orbitPage(page);
  if (era === '2013') content.innerHTML = board.markup();
  screen.replaceChildren(content);
  screen.scrollTop = 0;
  screen.scrollLeft = 0;
  if (era === '2013') board.init(content);
  if (era === '1998' && page === 'home') showVisitorCount();
  if (era === '1998' && page === 'guestbook') initGuestbook();
  if (focusPage) {
    const heading = screen.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function selectEra(id, page, restore = false) {
  era = id;
  const previous = trails.get(era);
  if (!previous || (restore && page !== previous.pages[previous.index])) {
    const pages = page === 'home' ? ['home'] : ['home', page];
    trails.set(era, { pages, index: pages.length - 1 });
  }
  trail = trails.get(era);
  display.dataset.era = era;
  for (const link of timeline.querySelectorAll('[data-era]')) {
    if (link.dataset.era === era) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  renderNotes();
  renderPage();
}

function goTo(page) {
  if (trail.pages[trail.index] === page) return;
  trail.pages.splice(trail.index + 1, Infinity, page);
  trail.index += 1;
  window.history.replaceState(null, '', pageUrl(page));
  renderPage(true);
}

function browserAction(action) {
  if (action === 'info') {
    document.querySelector('#field-notes details').open = true;
    document.querySelector('#notes-title').focus();
  } else if (action === 'home') {
    goTo('home');
  } else if (action === 'reload') {
    renderPage(true);
  } else {
    trail.index += action === 'back' ? -1 : 1;
    window.history.replaceState(null, '', pageUrl(trail.pages[trail.index]));
    renderPage(true);
  }
}

let visitorCount;
function showVisitorCount() {
  if (visitorCount === undefined) {
    visitorCount = 1287;
    try {
      const key = 'build-canvas:web-evolution:visitors';
      const previous = Number(localStorage.getItem(key));
      if (Number.isSafeInteger(previous) && previous >= 1287 && previous < 999999) {
        visitorCount = previous + 1;
      }
      localStorage.setItem(key, visitorCount);
    } catch {
      // Show the starting value if browser storage is unavailable.
    }
  }
  screen.querySelector('.visitor strong').textContent = String(visitorCount).padStart(6, '0');
}

let guestbook = [];
const guestbookKey = 'build-canvas:web-evolution:guestbook';
try {
  const saved = JSON.parse(localStorage.getItem(guestbookKey));
  if (Array.isArray(saved)) {
    guestbook = saved.filter((entry) => typeof entry?.name === 'string' && typeof entry.message === 'string').slice(0, 20);
  }
} catch {
  // The guestbook still works for the current visit if storage is unavailable.
}

function initGuestbook() {
  const form = document.querySelector('#guestbook-form');
  const list = document.querySelector('#guestbook-entries');

  function showEntries() {
    const entries = [...guestbook, { name: 'Stargazer42', message: 'Cool Saturn! See you in Area51.' }];
    list.replaceChildren(...entries.map(({ name, message }) => {
      const item = document.createElement('li');
      const author = document.createElement('b');
      author.textContent = name;
      item.append(author, document.createTextNode(` wrote: ${message}`));
      return item;
    }));
  }

  showEntries();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim();
    const message = data.get('message').trim();
    if (!name || !message) return;
    guestbook = [{ name, message }, ...guestbook].slice(0, 20);
    try {
      localStorage.setItem(guestbookKey, JSON.stringify(guestbook));
    } catch {
      // Keep the entry in memory for this visit.
    }
    form.reset();
    showEntries();
  });
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

timeline.addEventListener('click', (event) => {
  const link = event.target.closest('[data-era]');
  if (!link || isModifiedClick(event)) return;
  event.preventDefault();
  if (link.dataset.era === era) return;
  selectEra(link.dataset.era, 'home');
  window.history.pushState(null, '', pageUrl(trail.pages[trail.index]));
});

window.addEventListener('popstate', () => {
  const { era, page } = readRoute();
  selectEra(era, page, true);
});

display.addEventListener('click', (event) => {
  const link = event.target.closest('[data-page]');
  const control = event.target.closest('[data-action]');
  if (link && !isModifiedClick(event)) {
    event.preventDefault();
    goTo(link.dataset.page);
  } else if (control) {
    browserAction(control.dataset.action);
  }
});

for (const radio of document.querySelectorAll('input[name="view"]')) {
  radio.addEventListener('change', () => {
    display.classList.toggle('page-only', radio.value === 'page');
  });
}
display.classList.toggle('page-only', document.querySelector('input[name="view"]:checked').value === 'page');

function isEditingTarget(target) {
  return target instanceof Element &&
    Boolean(target.closest('input, textarea, select, [contenteditable], [role="textbox"], [data-code-editor], .monaco-editor, .CodeMirror'));
}

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'h' &&
      !event.metaKey && !event.ctrlKey && !event.altKey && !event.isComposing &&
      !isEditingTarget(event.target) && !event.defaultPrevented) {
    const homeUrl = new URL('../', window.location.href);
    window.location.assign(homeUrl.href);
  }
});

const initial = readRoute();
selectEra(initial.era, initial.page);
