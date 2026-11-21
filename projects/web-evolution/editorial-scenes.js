const sceneSelector = '.story-scene[data-story-scene]';
const stepSelector = '.story-step[data-story-step]';
const figureSelector = 'figure.step-figure';
const wideScene = window.matchMedia('(min-width: 1160px) and (min-height: 720px)');

function introIsHidden() {
  const intro = document.querySelector('.intro-view');
  return !intro || intro.hidden;
}

function captureScrollAnchor() {
  const readingLine = Math.max(120, Math.min(window.innerHeight * 0.43, window.innerHeight - 120));
  const steps = [...document.querySelectorAll('.story-step')]
    .filter((element) => element.getClientRects().length > 0);
  let nearestAnchor = null;
  let nearestDistance = 120;
  for (const element of steps) {
    const rect = element.getBoundingClientRect();
    const distance = readingLine < rect.top ? rect.top - readingLine : readingLine > rect.bottom ? readingLine - rect.bottom : 0;
    if (rect.height > 0 && distance < nearestDistance) {
      nearestDistance = distance;
      nearestAnchor = { element, offset: readingLine - rect.top, line: readingLine };
    }
  }
  if (nearestAnchor) return nearestAnchor;
  const chapters = [...document.querySelectorAll('.editorial-chapter')]
    .filter((element) => element.getClientRects().length > 0);
  let chapterAnchor = null;
  nearestDistance = 120;
  for (const element of chapters) {
    const rect = element.getBoundingClientRect();
    const distance = readingLine < rect.top ? rect.top - readingLine : readingLine > rect.bottom ? readingLine - rect.bottom : 0;
    if (rect.height > 0 && distance < nearestDistance) {
      nearestDistance = distance;
      chapterAnchor = { element, offset: readingLine - rect.top, line: readingLine };
    }
  }
  return chapterAnchor;
}

function restoreScrollAnchor(anchor, fallbackY) {
  if (!anchor || !anchor.element.isConnected) {
    window.scrollTo(window.scrollX, fallbackY);
    return;
  }
  const rect = anchor.element.getBoundingClientRect();
  const withinElement = Math.max(0, Math.min(anchor.offset, Math.max(0, rect.height - 1)));
  const desiredTop = anchor.line - withinElement;
  const scrollDelta = rect.top - desiredTop;
  if (Math.abs(scrollDelta) > 0.5) window.scrollBy({ top: scrollDelta, behavior: 'instant' });
}

let rememberedScrollAnchor = null;
let rememberFrame = null;

function rememberReadingPosition() {
  if (rememberFrame !== null) return;
  rememberFrame = requestAnimationFrame(() => {
    rememberFrame = null;
    rememberedScrollAnchor = captureScrollAnchor();
  });
}

function createSceneController(scene) {
  const steps = [...scene.querySelectorAll(stepSelector)];
  const records = steps.map((step, index) => {
    if (!step.id) step.id = `${scene.id || 'archive-scene'}-step-${index + 1}`;
    const figure = step.querySelector(figureSelector);
    const label = step.dataset.storyLabel?.trim() || `장면 ${index + 1}`;
    return {
      step,
      figure,
      originalNextSibling: figure?.nextSibling || null,
      label,
      index,
    };
  });
  if (!records.some(({ figure }) => figure)) return null;

  let stage = null;
  let nav = null;
  let activeIndex = -1;
  let frame = null;

  function setActive(index) {
    if (!stage || !records[index] || index === activeIndex) return;
    activeIndex = index;
    const active = records[index];
    stage.dataset.activeStep = active.step.id;
    for (const record of records) {
      if (record.figure) record.figure.hidden = record.index !== index;
      const link = nav.querySelector(`a[href="#${CSS.escape(record.step.id)}"]`);
      if (record.index === index) link?.setAttribute('aria-current', 'step');
      else link?.removeAttribute('aria-current');
    }
  }

  function updateFromPosition() {
    frame = null;
    if (!stage || introIsHidden()) return;
    const readingLine = Math.max(120, Math.min(window.innerHeight * 0.43, window.innerHeight - 120));
    let chosen = -1;
    let nearestDistance = Infinity;
    for (const record of records) {
      const rect = record.step.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (rect.top <= readingLine && rect.bottom > readingLine) {
        chosen = record.index;
        break;
      }
      const distance = Math.abs(midpoint - readingLine);
      if (rect.height > 0 && distance < nearestDistance) {
        nearestDistance = distance;
        chosen = record.index;
      }
    }
    if (chosen >= 0) setActive(chosen);
  }

  function scheduleUpdate() {
    if (frame === null) frame = requestAnimationFrame(updateFromPosition);
  }

  function mountStage() {
    if (stage) return;
    stage = document.createElement('div');
    stage.className = 'story-stage';
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', '아카이브 장면');

    nav = document.createElement('nav');
    nav.className = 'story-step-nav';
    nav.setAttribute('aria-label', '장면 선택');
    stage.append(nav);

    for (const record of records) {
      const link = document.createElement('a');
      link.href = `#${record.step.id}`;
      link.textContent = record.label;
      link.addEventListener('click', () => setActive(record.index));
      nav.append(link);
    }

    scene.prepend(stage);
    for (const record of records) {
      if (record.figure) stage.append(record.figure);
    }
    scene.dataset.sceneEnhanced = 'true';
    activeIndex = -1;
    updateFromPosition();
    scheduleUpdate();
  }

  function unmountStage() {
    if (!stage) return;
    for (const record of records) {
      if (!record.figure) continue;
      record.figure.hidden = false;
      const anchor = record.originalNextSibling?.parentNode === record.step ? record.originalNextSibling : null;
      record.step.insertBefore(record.figure, anchor);
    }
    stage.remove();
    scene.removeAttribute('data-scene-enhanced');
    delete scene.dataset.activeStep;
    stage = null;
    nav = null;
    activeIndex = -1;
    scheduleUpdate();
  }

  function syncViewport() {
    if (wideScene.matches) mountStage();
    else unmountStage();
    scheduleUpdate();
  }

  function onHashChange() {
    let id = window.location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* Ignore malformed fragments. */ }
    const index = records.findIndex(({ step }) => step.id === id);
    if (index >= 0) setActive(index);
    scheduleUpdate();
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);

  const intro = document.querySelector('.intro-view');
  const visibilityObserver = intro ? new MutationObserver(() => {
    if (!intro.hidden) updateFromPosition();
  }) : null;
  visibilityObserver?.observe(intro, { attributes: true, attributeFilter: ['hidden'] });

  return {
    syncViewport,
    updateFromPosition,
  };

}

const sceneControllers = [];

function syncAllScenes() {
  const scrollY = window.scrollY;
  const anchor = captureScrollAnchor();
  const scrollAnchor = rememberedScrollAnchor?.element?.isConnected ? rememberedScrollAnchor : anchor;
  const rootStyle = document.documentElement.style;
  const previousOverflowAnchor = rootStyle.overflowAnchor;
  rootStyle.overflowAnchor = 'none';
  for (const controller of sceneControllers) controller.syncViewport();
  restoreScrollAnchor(scrollAnchor, scrollY);
  for (const controller of sceneControllers) controller.updateFromPosition();
  requestAnimationFrame(() => {
    restoreScrollAnchor(scrollAnchor, scrollY);
    requestAnimationFrame(() => {
      restoreScrollAnchor(scrollAnchor, scrollY);
      if (rootStyle.overflowAnchor === 'none') rootStyle.overflowAnchor = previousOverflowAnchor;
      requestAnimationFrame(() => {
        restoreScrollAnchor(scrollAnchor, scrollY);
        rememberedScrollAnchor = captureScrollAnchor();
        for (const controller of sceneControllers) controller.updateFromPosition();
      });
    });
  });
}

let syncFrame = null;

function scheduleSyncAllScenes() {
  if (syncFrame !== null) return;
  syncFrame = requestAnimationFrame(() => {
    syncFrame = null;
    syncAllScenes();
  });
}

function initEditorialScenes(root = document) {
  for (const scene of root.querySelectorAll(sceneSelector)) {
    const controller = createSceneController(scene);
    if (controller) sceneControllers.push(controller);
  }
  // Let the browser position an initial fragment after the plates are mounted.
  for (const controller of sceneControllers) controller.syncViewport();
}

wideScene.addEventListener('change', scheduleSyncAllScenes);
window.addEventListener('resize', scheduleSyncAllScenes, { passive: true });
window.addEventListener('scroll', rememberReadingPosition, { passive: true });
initEditorialScenes();
