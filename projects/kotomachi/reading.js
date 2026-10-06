const article = document.querySelector('.article-body');
const progress = document.querySelector('.reading-progress');
const progressFill = progress?.querySelector('span');
const sections = [...(article?.querySelectorAll(':scope > section') ?? [])];
const links = [...document.querySelectorAll('.toc a')];

function isEditingTarget(target) {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="code"], [data-code-editor], .monaco-editor, .CodeMirror, .cm-content',
  ));
}

function markActive(id) {
  for (const link of links) {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function updateProgress() {
  if (!progress || !progressFill) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  const percent = Math.round(ratio * 100);
  progressFill.style.width = `${percent}%`;
  progress.setAttribute('aria-valuenow', String(percent));
}

function updateActiveSection() {
  if (!sections.length) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (window.scrollY >= maxScroll - 2) {
    markActive(sections.at(-1).querySelector('h2')?.id ?? '');
    return;
  }
  const current = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= 180) ?? sections[0];
  markActive(current.querySelector('h2')?.id ?? '');
}

let scheduled = false;
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    updateProgress();
    updateActiveSection();
    scheduled = false;
  });
}

for (const link of links) {
  link.addEventListener('click', () => {
    const id = decodeURIComponent(link.hash.slice(1));
    markActive(id);
  });
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('hashchange', scheduleUpdate);
window.addEventListener('popstate', scheduleUpdate);
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'h' && !event.metaKey && !event.ctrlKey && !event.altKey &&
      !event.shiftKey && !event.isComposing && !event.defaultPrevented && !isEditingTarget(event.target)) {
    const currentPage = new URL(window.location.href);
    if (!currentPage.pathname.endsWith('/') && !currentPage.pathname.endsWith('/index.html')) currentPage.pathname += '/';
    const homeUrl = new URL('../', currentPage.href);
    window.location.assign(homeUrl.href);
  }
});

scheduleUpdate();
