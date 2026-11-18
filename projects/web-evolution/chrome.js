const menuSets = {
  '1993': [
    ['File', [['Open URL…', 'open-address'], ['Save this page', 'save-page']]],
    ['Options', [['Larger text', 'zoom-in'], ['Smaller text', 'zoom-out'], ['Normal text', 'zoom-reset']]],
    ['Navigate', [['Back', 'back'], ['Forward', 'forward'], ['Home', 'home'], ['Reload', 'reload']]],
    ['Annotate', [['Copy document address', 'copy-address'], ['About this exhibit', 'info']]],
    ['Hotlist', [['Add to hotlist', 'bookmark'], ['Open hotlist', 'bookmarks']]],
  ],
  '1998': [
    ['File', [['Open location…', 'open-address'], ['Save this page', 'save-page']]],
    ['Edit', [['Copy address', 'copy-address'], ['Select all text', 'select-all']]],
    ['View', [['Larger text', 'zoom-in'], ['Smaller text', 'zoom-out'], ['Normal text', 'zoom-reset'], ['Refresh', 'reload']]],
    ['Favorites', [['Add to Favorites', 'bookmark'], ['Show Favorites', 'bookmarks']]],
    ['Help', [['About this exhibit', 'info']]],
  ],
  '2001': [
    ['File', [['Open Web Location…', 'open-address'], ['Save Page As…', 'save-page']]],
    ['Edit', [['Copy address', 'copy-address'], ['Select All', 'select-all']]],
    ['View', [['Text Zoom In', 'zoom-in'], ['Text Zoom Out', 'zoom-out'], ['Normal Size', 'zoom-reset'], ['Reload', 'reload']]],
    ['Go', [['Back', 'back'], ['Forward', 'forward'], ['Home', 'home']]],
    ['Bookmarks', [['Bookmark This Page', 'bookmark'], ['Show Bookmarks', 'bookmarks']]],
    ['Help', [['About this exhibit', 'info']]],
  ],
  'modern': [
    ['File', [['New tab', 'new-tab'], ['Close tab', 'close-tab'], ['Save this page', 'save-page']]],
    ['Edit', [['Copy address', 'copy-address'], ['Select all text', 'select-all']]],
    ['View', [['Zoom in', 'zoom-in'], ['Zoom out', 'zoom-out'], ['Reset zoom', 'zoom-reset'], ['Reload', 'reload']]],
    ['Bookmarks', [['Bookmark this page', 'bookmark'], ['Show bookmarks', 'bookmarks']]],
    ['History', [['Back', 'back'], ['Forward', 'forward'], ['Home', 'home']]],
    ['Help', [['About this exhibit', 'info']]],
  ],
};

function menuMarkup(menus) {
  return `<nav class="period-menu" aria-label="Browser menus">${menus.map(([label, items]) => `
    <div class="chrome-menu" data-menu>
      <button type="button" class="menu-trigger" aria-haspopup="menu" aria-expanded="false">${label}</button>
      <div class="menu-popup" role="menu" hidden>${items.map(([name, action]) => `<button type="button" role="menuitem" data-action="${action}">${name}</button>`).join('')}</div>
    </div>`).join('')}</nav>`;
}

function toolbarAction(action, icon, label, disabled = false) {
  return `<button type="button" data-action="${action}" aria-label="${label}" title="${label}" ${disabled ? 'disabled' : ''}><span aria-hidden="true">${icon}</span><span class="tool-label">${label}</span></button>`;
}

export function pageAddress(base, path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  return `${base}${path}`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function createChrome({ root, status, onAction, onAddress, onTab }) {
  function closeMenus() {
    const open = root.querySelector('.menu-trigger[aria-expanded="true"]');
    if (!open) return null;
    open.setAttribute('aria-expanded', 'false');
    open.closest('[data-menu]').querySelector('.menu-popup').hidden = true;
    return open;
  }

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) closeMenus();
  });

  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('.menu-trigger');
    if (trigger) {
      const menu = trigger.closest('[data-menu]');
      const wasOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeMenus();
      if (!wasOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        menu.querySelector('.menu-popup').hidden = false;
        menu.querySelector('.menu-popup button')?.focus();
      }
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action && root.contains(action)) {
      const command = action.dataset.action;
      closeMenus()?.focus();
      onAction(command, { id: action.dataset.closeId });
      return;
    }
    const tab = event.target.closest('[data-tab-id]');
    if (tab) onTab(tab.dataset.tabId);
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenus()?.focus();
      return;
    }
    const item = event.target.closest('[role="menuitem"]');
    if (item && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      const items = [...item.closest('[role="menu"]').querySelectorAll('[role="menuitem"]')];
      const index = items.indexOf(item);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      event.preventDefault();
      items[next]?.focus();
    }
  });
  root.addEventListener('submit', (event) => {
    if (event.target.matches('.address-form')) {
      event.preventDefault();
      onAddress(new FormData(event.target).get('address'));
    }
  });

  function render(options) {
    const { era, base, path, page, index, length, tabs = [], activeTab = 'tab-1' } = options;
    const title = escapeHtml(options.title);
    const modern = Number(era) >= 2005;
    const menus = menuMarkup(menuSets[era] || menuSets[modern ? 'modern' : '1998']);
    const back = toolbarAction('back', '←', 'Back', index <= 0);
    const forward = toolbarAction('forward', '→', 'Forward', index >= length - 1);
    const home = toolbarAction('home', '⌂', 'Home', page === 'home');
    const reload = toolbarAction('reload', '⟳', 'Reload');
    const address = `<form class="address-form"><label for="browser-address">${era === '1993' ? 'Document URL:' : 'Address'}</label><input id="browser-address" name="address" aria-label="Simulated address" value="${escapeHtml(pageAddress(base, path))}" spellcheck="false" autocomplete="off"><button type="submit" aria-label="Go to address">↵</button></form>`;
    const info = toolbarAction('info', '?', 'About this exhibit');
    const tabMarkup = tabs.map((tab) => `<button type="button" role="tab" data-tab-id="${escapeHtml(tab.id)}" aria-selected="${tab.id === activeTab}" class="sim-tab ${tab.id === activeTab ? 'is-active' : ''}"><span class="sim-tab-icon" aria-hidden="true">◈</span><span class="sim-tab-title">${escapeHtml(tab.title || 'New tab')}</span>${tabs.length > 1 ? `<span class="sim-tab-close" aria-label="Close ${escapeHtml(tab.title || 'tab')}" data-action="close-tab" data-close-id="${escapeHtml(tab.id)}">×</span>` : ''}</button>`).join('');
    const addTabButton = `<button type="button" data-action="new-tab" class="sim-tab-add" aria-label="New tab">+</button>`;
    const tabsBar = modern ? String(era) === '2005'
      ? `<div class="sim-tabs" role="tablist" aria-label="Exhibit browser tabs">${tabMarkup}${addTabButton}</div>`
      : `<div class="chrome-tabs-row"><div class="sim-tabs" role="tablist" aria-label="Exhibit browser tabs">${tabMarkup}</div>${addTabButton}</div>`
      : '';
    if (era === '1993') {
      root.innerHTML = `<div class="mosaic-title"><span class="motif-mark" aria-hidden="true"></span><span>NCSA Mosaic · ${title}</span><span class="motif-mark motif-end" aria-hidden="true"></span></div>${menus}<div class="mosaic-location"><div><div class="address-row"><span>Document Title:</span><strong>${title}</strong></div>${address}</div><span class="mosaic-globe" aria-hidden="true"><i></i></span></div><div class="browser-tools">${back}${forward}${home}${reload}${info}</div>`;
      status.innerHTML = `<span class="status-text">Document Done</span><span> ${index + 1} of ${length}</span>`;
    } else if (era === '1998') {
      root.innerHTML = `<div class="ie-title"><span class="ie-mark" aria-hidden="true">e</span><span>${title} – Explorer</span><span class="window-buttons" aria-hidden="true"><b>_</b><b>□</b><b>×</b></span></div>${menus}<div class="browser-tools">${back}${forward}${home}${reload}${info}</div>${address}`;
      status.innerHTML = '<span class="status-text">Done</span><span aria-hidden="true">◉ Internet zone</span>';
    } else if (era === '2001') {
      root.innerHTML = `<div class="navigator-title"><span class="navigator-mark" aria-hidden="true">N</span><span>${title} — Netscape</span></div>${menus}<div class="navigator-location"><div class="browser-tools">${back}${forward}${reload}${home}</div>${address}<div class="browser-tools">${info}</div></div>`;
      status.innerHTML = '<span class="status-text">Document: Done</span><span aria-hidden="true">Navigator</span>';
    } else {
      const location = `<div class="chrome-location"><div class="browser-tools">${back}${forward}${reload}</div>${address}<div class="browser-tools">${home}${info}</div></div>`;
      root.innerHTML = era === '2005'
        ? `<div class="firefox-title"><span aria-hidden="true">◉</span> ${title} — Firefox</div>${menus}${location}${tabsBar}`
        : `${tabsBar}${menus}${location}`;
      status.innerHTML = `<span>${title}</span><span>${Math.round((options.zoom || 1) * 100)}%</span>`;
    }
    if (modern && String(era) !== '2005') {
      const strip = root.querySelector('.sim-tabs');
      const selected = strip?.querySelector('.sim-tab[aria-selected="true"]');
      if (strip && selected) {
        const stripRect = strip.getBoundingClientRect();
        const tabRect = selected.getBoundingClientRect();
        if (tabRect.left < stripRect.left) strip.scrollLeft -= stripRect.left - tabRect.left;
        else if (tabRect.right > stripRect.right) strip.scrollLeft += tabRect.right - stripRect.right;
      }
    }
  }
  return { render };
}
