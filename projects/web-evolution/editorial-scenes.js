const sceneSelector = '.story-scene[data-story-scene]';
const stepSelector = '.story-step[data-story-step]';
const figureSelector = 'figure.step-figure';
const wideScene = window.matchMedia('(min-width: 1160px) and (min-height: 720px)');

function introIsHidden() {
  const intro = document.querySelector('.intro-view');
  return !intro || intro.hidden;
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
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
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
    window.scrollTo(scrollX, scrollY);
    scheduleUpdate();
  }

  function unmountStage() {
    if (!stage) return;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
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
    window.scrollTo(scrollX, scrollY);
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

  wideScene.addEventListener('change', syncViewport);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);

  const intro = document.querySelector('.intro-view');
  const visibilityObserver = intro ? new MutationObserver(() => {
    if (!intro.hidden) updateFromPosition();
  }) : null;
  visibilityObserver?.observe(intro, { attributes: true, attributeFilter: ['hidden'] });

  syncViewport();

}

function initEditorialScenes(root = document) {
  for (const scene of root.querySelectorAll(sceneSelector)) createSceneController(scene);
}

initEditorialScenes();
