import { eras as historicalEras, mosaicPage, orbitPage } from './eras.js';
import { photoPage, initPhoto } from './photo.js';
import { classicSearchEra, createClassicSearch } from './classic-search.js';
import { modernEras, createModern } from './modern.js';
import { createPacebook } from './pacebook.js';
import { createPoster } from './poster.js';
import { createChrome, pageAddress } from './chrome.js';

const eras = { ...historicalEras, 2001: classicSearchEra, ...modernEras };
const intro = document.querySelector('#intro-view');
const exhibit = document.querySelector('#exhibit-view');
const screen = document.querySelector('#screen');
const chromeRoot = document.querySelector('#chrome');
const status = document.querySelector('#status');
const display = document.querySelector('#display');
const stage = display.querySelector('.browser-window');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let sceneAnimation;
let redrawState = null;
const classicSearch = createClassicSearch();
const pacebook = createPacebook();
const poster = createPoster();
const modern = createModern(poster);
const notesDialog = document.querySelector('#field-notes');
const browserStates = new Map();
const bookmarks = new Map();
const chrome = createChrome({ root: chromeRoot, status, onAction: browserAction, onAddress: navigateAddress, onTab: switchTab });
let era;
let trail;
let browserState;

function route() {
  const url = new URL(window.location.href);
  const requestedEra = url.searchParams.get('era');
  const id = requestedEra === '2025' ? '2026' : requestedEra;
  if (!id || !Object.hasOwn(eras, id)) return { intro: true };
  if (id !== requestedEra) {
    url.searchParams.set('era', id);
    window.history.replaceState(window.history.state, '', url);
  }
  const requested = url.searchParams.get('page');
  return { intro: false, era: id, page: Object.hasOwn(eras[id].pages, requested) ? requested : 'home', tab: window.history.state?.tab };
}

function pageUrl(page = trail.pages[trail.index]) {
  return `?era=${era}${page === 'home' ? '' : `&page=${encodeURIComponent(page)}`}`;
}

function isModernEra(id = era) {
  return Number(id) >= 2005;
}

function showIntro() {
  sceneAnimation?.cancel();
  cancelRedraw();
  classicSearch.cancel();
  modern.cancelMonitor();
  modern.cancelLiveSearch();
  if (intro) intro.hidden = false;
  if (exhibit) exhibit.hidden = true;
  document.body.dataset.view = 'intro';
}

function showExhibit() {
  if (intro) intro.hidden = true;
  if (exhibit) exhibit.hidden = false;
  document.body.dataset.view = 'exhibit';
}

function currentTab() {
  return browserState?.tabs.find((tab) => tab.id === browserState.activeTab);
}

function setCurrentPage(page) {
  if (isModernEra() && currentTab()) {
    const tab = currentTab();
    trail = tab.trail;
    tab.title = eras[era].pages[page]?.[0] || 'New tab';
  }
  if (isModernEra() && currentTab()) currentTab().trail = trail;
}

function renderChrome() {
  const page = trail.pages[trail.index];
  const [title, path] = eras[era].pages[page];
  setCurrentPage(page);
  chrome.render({ era, title, base: eras[era].base, path, page, index: trail.index, length: trail.pages.length, zoom: browserState?.zoom || 1, tabs: browserState?.tabs, activeTab: browserState?.activeTab });
}

function showNotes() {
  const data = eras[era];
  document.querySelector('#notes-title').textContent = `${era} · ${data.caption}`;
  document.querySelector('#notes-copy').textContent = data.notes;
  const guide = document.querySelector('#notes-guide');
  if (guide) {
    guide.textContent = data.hint || '';
    guide.hidden = !data.hint;
  }
  document.querySelector('#notes-sources').replaceChildren(...data.sources.map(([label, url]) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `${label} ↗`;
    item.append(link);
    return item;
  }));
  notesDialog.showModal();
}

function renderPage(focusPage = false) {
  cancelRedraw();
  renderChrome();
  renderPageBody(focusPage);
}

function renderPageBody(focusPage = false, preserveScroll = false) {
  modern.cancelMonitor();
  const page = trail.pages[trail.index];
  const scrollTop = preserveScroll ? screen.scrollTop : 0;
  const scrollLeft = preserveScroll ? screen.scrollLeft : 0;
  const content = document.createElement('div');
  content.className = 'page-content';
  if (era === '1993') content.innerHTML = mosaicPage(page);
  else if (era === '1998') content.innerHTML = orbitPage(page);
  else if (era === '2001') content.innerHTML = classicSearch.markup(page);
  else if (era === '2005') content.innerHTML = photoPage(page);
  else if (era === '2013') content.innerHTML = page === 'poster' ? poster.markup() : pacebook.markup();
  else content.innerHTML = modern.markup(era, page);
  const zoom = browserState?.zoom || 1;
  content.style.zoom = `${Math.round(zoom * 100)}%`;
  screen.replaceChildren(content);
  if (era === '2001') classicSearch.init(content, goTo);
  if (era === '2013') {
    if (page === 'poster') poster.init(content);
    else pacebook.init(content);
  }
  if (era === '2005') initPhoto(content, page);
  if (Object.hasOwn(modernEras, era)) modern.init(content, era, page, goTo);
  if (era === '1998' && page === 'home') showVisitorCount();
  if (era === '1998' && page === 'guestbook') initGuestbook();
  screen.scrollTop = scrollTop;
  screen.scrollLeft = scrollLeft;
  if (focusPage) {
    const heading = screen.querySelector('h2');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  return content;
}

const reloadTiming = {
  1993: { blank: 180, step: 92, steps: 10 },
  1998: { blank: 140, step: 95, steps: 8 },
  2001: { blank: 115, step: 94, steps: 7 },
  2005: { blank: 90, step: 96, steps: 5 },
  2013: { blank: 60, step: 68, steps: 4 },
  2023: { blank: 32, step: 56, steps: 3 },
  2026: { blank: 32, step: 56, steps: 3 },
};

function cancelRedraw() {
  if (!redrawState) return;
  redrawState.timers.forEach(clearTimeout);
  redrawState = null;
  delete screen.dataset.reloadPhase;
  delete screen.dataset.reloadStep;
}

function scheduleRedraw(state, delay, callback) {
  const timer = setTimeout(() => {
    state.timers = state.timers.filter((pending) => pending !== timer);
    if (redrawState === state) callback();
  }, delay);
  state.timers.push(timer);
}

function blankPageCanvas(pageContent, height) {
  const canvas = document.createElement('div');
  canvas.className = 'page-content reload-blank';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.minHeight = `${Math.max(screen.clientHeight, height)}px`;
  const source = pageContent?.firstElementChild;
  const style = source ? getComputedStyle(source) : getComputedStyle(screen);
  for (const property of ['backgroundColor', 'backgroundImage', 'backgroundPosition', 'backgroundSize', 'backgroundRepeat', 'color']) {
    canvas.style[property] = style[property];
  }
  return canvas;
}

function reloadPage() {
  cancelRedraw();
  modern.cancelMonitor();
  if (reducedMotion.matches) {
    renderPageBody(false, true);
    return;
  }

  const oldContent = screen.querySelector('.page-content');
  const savedHeight = oldContent?.scrollHeight || screen.clientHeight;
  const savedScrollTop = screen.scrollTop;
  const savedScrollLeft = screen.scrollLeft;
  const state = { timers: [], scrollTop: savedScrollTop, scrollLeft: savedScrollLeft };
  redrawState = state;
  screen.replaceChildren(blankPageCanvas(oldContent, savedHeight));
  screen.scrollTop = savedScrollTop;
  screen.scrollLeft = savedScrollLeft;
  screen.dataset.reloadPhase = 'blank';
  screen.dataset.reloadStep = '0';
  const timing = reloadTiming[era] || reloadTiming[2023];

  scheduleRedraw(state, timing.blank, () => {
    screen.dataset.reloadPhase = 'reveal';
    screen.scrollTop = state.scrollTop;
    screen.scrollLeft = state.scrollLeft;
    const content = renderPageBody(false, true);
    content.inert = true;
    content.dataset.reloadContent = '';
    const revealStep = (step) => {
      if (!content.isConnected) {
        cancelRedraw();
        return;
      }
      screen.dataset.reloadStep = String(step);
      const totalHeight = content.scrollHeight;
      const visibleBottom = Math.min(totalHeight, screen.scrollTop + screen.clientHeight * (step / timing.steps));
      const bottomInset = Math.max(0, totalHeight - visibleBottom);
      content.style.clipPath = `inset(0 0 ${bottomInset}px 0)`;
      if (step >= timing.steps) {
        content.style.clipPath = '';
        content.inert = false;
        delete content.dataset.reloadContent;
        delete screen.dataset.reloadPhase;
        delete screen.dataset.reloadStep;
        redrawState = null;
        screen.scrollTop = state.scrollTop;
        screen.scrollLeft = state.scrollLeft;
      } else scheduleRedraw(state, timing.step, () => revealStep(step + 1));
    };
    content.style.clipPath = `inset(0 0 ${Math.max(0, content.scrollHeight - screen.scrollTop)}px 0)`;
    revealStep(0);
  });
}

function selectEra(id, page = 'home', restore = false, navigate = false, tabId = null) {
  if (!Object.hasOwn(eras, id)) return;
  if (era === '2001' && id !== '2001') classicSearch.cancel();
  if (era === '2023' && id !== '2023') modern.cancelLiveSearch();
  const entering = exhibit.hidden;
  const changingEra = id !== era;
  const fromIntroControl = entering && intro.contains(document.activeElement);
  era = id;
  const bookmarkPanel = document.querySelector('#bookmark-panel');
  if (bookmarkPanel) bookmarkPanel.hidden = true;
  let state = browserStates.get(era);
  if (!state) {
    const firstTrail = { pages: page === 'home' ? ['home'] : ['home', page], index: page === 'home' ? 0 : 1 };
    state = { trail: firstTrail, tabs: [{ id: 'tab-1', title: eras[era].pages[page]?.[0] || 'New tab', trail: firstTrail }], activeTab: 'tab-1', zoom: 1 };
    browserStates.set(era, state);
  }
  browserState = state;
  if (tabId && browserState.tabs.some((tab) => tab.id === tabId)) browserState.activeTab = tabId;
  if (restore && page !== currentTab().trail.pages[currentTab().trail.index]) {
    trail = currentTab().trail;
    const existingIndex = trail.pages.lastIndexOf(page);
    if (existingIndex >= 0) trail.index = existingIndex;
    else {
      trail.pages = page === 'home' ? ['home'] : ['home', page];
      trail.index = trail.pages.length - 1;
    }
  } else trail = currentTab().trail;
  if (navigate && trail.pages[trail.index] !== page) {
    trail.pages.splice(trail.index + 1, Infinity, page);
    trail.index += 1;
    if (isModernEra() && currentTab()) {
      currentTab().trail = trail;
      currentTab().title = eras[era].pages[page][0];
    }
  }
  display.dataset.era = era;
  exhibit.dataset.era = era;
  for (const link of exhibit.querySelectorAll('.timeline a[data-era]')) {
    if (link.dataset.era === era) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  const hint = document.querySelector('#scene-hint');
  if (hint) hint.textContent = eras[era].hint || 'Explore the page links and browser menus in this scene.';
  showExhibit();
  renderPage();
  if (fromIntroControl) exhibit.querySelector('.timeline a[aria-current]').focus({ preventScroll: true });
  if ((entering || changingEra) && !reducedMotion.matches && typeof stage.animate === 'function') {
    sceneAnimation?.cancel();
    sceneAnimation = stage.animate([
      { opacity: .55, transform: 'translateY(6px) scale(.997)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: entering ? 500 : 345, easing: 'cubic-bezier(.2, .82, .25, 1)' });
  }
}

function goTo(page, focusPage = true) {
  if (!Object.hasOwn(eras[era].pages, page) || trail.pages[trail.index] === page) return;
  trail.pages.splice(trail.index + 1, Infinity, page);
  trail.index += 1;
  if (isModernEra() && currentTab()) {
    currentTab().trail = trail;
    currentTab().title = eras[era].pages[page][0];
  }
  window.history.replaceState({ era, page }, '', pageUrl(page));
  renderPage(focusPage);
}

function navigateAddress(value) {
  const address = String(value || '').trim();
  if (!address) return;
  const info = eras[era];
  let absolute;
  try {
    absolute = new URL(address, info.base).href;
  } catch {
    showToast('This exhibit only opens its featured pages.');
    return;
  }
  const found = Object.entries(info.pages).find(([, [, path]]) => (
    absolute === new URL(pageAddress(info.base, path)).href
  ));
  if (found) goTo(found[0]);
  else showToast('This exhibit only opens its featured pages.');
}

function switchTab(id) {
  const next = browserState?.tabs.find((tab) => tab.id === id);
  if (!next || next.id === browserState.activeTab) return;
  browserState.activeTab = id;
  trail = next.trail;
  window.history.replaceState({ era, page: trail.pages[trail.index], tab: id }, '', pageUrl());
  renderPage();
}

function browserAction(action, detail = {}) {
  if (action === 'info') return showNotes();
  if (action === 'open-address') {
    const target = document.querySelector('#browser-address');
    target.focus();
    target.select();
    return;
  }
  if (action === 'back' || action === 'forward') {
    const nextIndex = trail.index + (action === 'back' ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= trail.pages.length) return;
    trail.index = nextIndex;
    const page = trail.pages[nextIndex];
    if (isModernEra() && currentTab()) currentTab().trail = trail;
    window.history.replaceState({ era, page }, '', pageUrl(page));
    return renderPage(true);
  }
  if (action === 'home') return goTo('home');
  if (action === 'reload') return reloadPage();
  if (action === 'zoom-in' || action === 'zoom-out' || action === 'zoom-reset') {
    browserState.zoom = action === 'zoom-reset' ? 1 : Math.min(1.5, Math.max(.7, browserState.zoom + (action === 'zoom-in' ? .1 : -.1)));
    return renderPage();
  }
  if (action === 'new-tab') {
    if (!isModernEra()) return showToast('New windows are represented by exhibit tabs in this scene.');
    const id = `tab-${Date.now()}`;
    const newTrail = { pages: ['home'], index: 0 };
    browserState.tabs.push({ id, title: 'New tab', trail: newTrail });
    browserState.activeTab = id;
    trail = newTrail;
    window.history.replaceState({ era, page: 'home', tab: id }, '', pageUrl('home'));
    return renderPage();
  }
  if (action === 'close-tab') {
    if (!isModernEra() || browserState.tabs.length < 2) return showToast('Keep one exhibit tab open to continue exploring.');
    const id = detail.id || browserState.activeTab;
    const index = browserState.tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    browserState.tabs.splice(index, 1);
    if (id === browserState.activeTab) browserState.activeTab = browserState.tabs[Math.max(0, index - 1)].id;
    trail = currentTab().trail;
    window.history.replaceState({ era, page: trail.pages[trail.index], tab: browserState.activeTab }, '', pageUrl());
    return renderPage();
  }
  if (action === 'bookmark') {
    const list = bookmarks.get(era) || [];
    const page = trail.pages[trail.index];
    if (!list.some((item) => item.page === page)) list.push({ page, title: eras[era].pages[page][0] });
    bookmarks.set(era, list);
    return showToast(`Saved “${eras[era].pages[page][0]}” to this browser’s favorites.`);
  }
  if (action === 'bookmarks') {
    return showBookmarks();
  }
  if (action === 'copy-address') {
    const { base, pages } = eras[era];
    const address = pageAddress(base, pages[trail.pages[trail.index]][1]);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(address).then(() => showToast('Simulated address copied.')).catch(() => showToast(address));
    } else {
      showToast(address);
    }
    return;
  }
  if (action === 'save-page') return saveCurrentPage();
  if (action === 'select-all') return selectPageText();
}

function showToast(message) {
  let toast = document.querySelector('#browser-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'browser-toast';
    toast.className = 'browser-toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function showBookmarks() {
  let panel = document.querySelector('#bookmark-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'bookmark-panel';
    panel.className = 'bookmark-panel';
    panel.setAttribute('aria-labelledby', 'bookmark-title');
    panel.innerHTML = '<div class="bookmark-heading"><h2 id="bookmark-title">Favorites</h2><button type="button" data-bookmark-close aria-label="Close favorites">×</button></div><div class="bookmark-list"></div>';
    panel.addEventListener('click', (event) => {
      if (event.target.closest('[data-bookmark-close]')) panel.hidden = true;
    });
    document.body.append(panel);
  }
  const list = panel.querySelector('.bookmark-list');
  const items = bookmarks.get(era) || [];
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No saved pages yet. Choose Add to Favorites from a browser menu.';
    list.append(empty);
  } else {
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.bookmarkPage = item.page;
      button.textContent = item.title;
      list.append(button);
    }
  }
  panel.hidden = false;
  panel.querySelector('.bookmark-list button')?.focus();
}

function saveCurrentPage() {
  const page = trail.pages[trail.index];
  const title = eras[era].pages[page][0];
  const contents = `${title}\n${'='.repeat(title.length)}\n\n${screen.innerText.trim()}\n`;
  const file = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${era}-${page}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Saved “${title}” as a text file.`);
}

function selectPageText() {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(screen);
  selection.removeAllRanges();
  selection.addRange(range);
  showToast('Page text selected. Copy it with your keyboard shortcut.');
}

let visitorCount;
function showVisitorCount() {
  if (visitorCount === undefined) {
    visitorCount = 1287;
    try {
      const key = 'build-canvas:web-evolution:visitors';
      const previous = Number(localStorage.getItem(key));
      if (Number.isSafeInteger(previous) && previous >= 1287 && previous < 999999) visitorCount = previous + 1;
      localStorage.setItem(key, visitorCount);
    } catch { /* Storage is optional in the exhibit. */ }
  }
  screen.querySelector('.visitor strong').textContent = String(visitorCount).padStart(6, '0');
}

let guestbook = [];
const guestbookKey = 'build-canvas:web-evolution:guestbook';
try {
  const saved = JSON.parse(localStorage.getItem(guestbookKey));
  if (Array.isArray(saved)) guestbook = saved.filter((entry) => typeof entry?.name === 'string' && typeof entry.message === 'string').slice(0, 20);
} catch { /* The guestbook still works during this visit. */ }

function initGuestbook() {
  const form = screen.querySelector('#guestbook-form');
  const list = screen.querySelector('#guestbook-entries');
  const showEntries = () => {
    const entries = [...guestbook, { name: 'Stargazer42', message: 'The same bright edge showed up in my binoculars. Clear skies!' }];
    list.replaceChildren(...entries.map(({ name, message }) => {
      const item = document.createElement('li');
      const author = document.createElement('b');
      author.textContent = name;
      item.append(author, document.createTextNode(` wrote: ${message}`));
      return item;
    }));
  };
  showEntries();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim();
    const message = data.get('message').trim();
    if (!name || !message) return;
    guestbook = [{ name, message }, ...guestbook].slice(0, 20);
    try { localStorage.setItem(guestbookKey, JSON.stringify(guestbook)); } catch { /* Keep this visit's entry in memory. */ }
    form.reset();
    showEntries();
  });
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

document.addEventListener('click', (event) => {
  const savedPage = event.target.closest('#bookmark-panel [data-bookmark-page]');
  if (savedPage) {
    const panel = document.querySelector('#bookmark-panel');
    if (panel) panel.hidden = true;
    goTo(savedPage.dataset.bookmarkPage);
    return;
  }
  const link = event.target.closest('a[data-era]');
  if (link && !isModifiedClick(event)) {
    event.preventDefault();
    const targetEra = link.dataset.era;
    const targetPage = link.dataset.page || 'home';
    if (targetEra === era && exhibit && !exhibit.hidden) {
      if (link.dataset.page) goTo(targetPage);
      return;
    }
    selectEra(targetEra, targetPage, false, Boolean(link.dataset.page));
    window.history.pushState({ era, page: trail.pages[trail.index], tab: browserState.activeTab }, '', pageUrl());
    return;
  }
  const pageLink = event.target.closest('#screen [data-page]');
  if (pageLink && !isModifiedClick(event)) {
    event.preventDefault();
    goTo(pageLink.dataset.page);
  }
});

window.addEventListener('popstate', () => {
  const next = route();
  if (next.intro) return showIntro();
  selectEra(next.era, next.page, true, false, next.tab);
});

function isEditingTarget(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable], [role="textbox"], [data-code-editor], .monaco-editor, .CodeMirror'));
}

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'h' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.isComposing && !isEditingTarget(event.target) && !event.defaultPrevented) {
    const homeUrl = new URL('../', window.location.href);
    window.location.assign(homeUrl.href);
  }
});

document.querySelector('#intro-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  window.history.pushState({}, '', './');
  showIntro();
  intro.querySelector('.cover-start').focus({ preventScroll: true });
});
const initial = route();
if (initial.intro) showIntro();
else selectEra(initial.era, initial.page);
