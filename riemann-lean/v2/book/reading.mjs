import { legacy, oldExperience } from './contents.mjs';

const body = document.body;
const current = body.dataset.page;
const studyKey = 'build-canvas.work-08.study.v2';
const chapterId = /^0[1-9]$|^1[0-2]$/;
const editable = 'input, textarea, select, button, [contenteditable], [role="slider"], [role="spinbutton"]';

function readStudy() {
  try {
    const data = JSON.parse(localStorage.getItem(studyKey));
    if (data && Array.isArray(data.completed) && Array.isArray(data.visited)) {
      const keepIds = ids => [...new Set(ids.filter(id => typeof id === 'string' && chapterId.test(id)))];
      const resume = data.resume;
      return {
        visited: keepIds(data.visited),
        completed: keepIds(data.completed),
        resume: chapterId.test(resume?.id ?? '') ? {
          id: resume.id, section: /^#[\da-z-]+$/.test(resume.section) ? resume.section : '',
        } : null,
      };
    }
  } catch {
    // Browser storage can be disabled.
  }
  return { visited: [], completed: [], resume: null };
}

const study = readStudy();
function saveStudy() {
  try {
    localStorage.setItem(studyKey, JSON.stringify(study));
  } catch {
    // The current page stays usable without persistent storage.
  }
}

function updateStudy() {
  document.querySelectorAll('[data-chapter-link]').forEach(link => {
    const complete = study.completed.includes(link.dataset.chapterLink);
    link.toggleAttribute('data-finished', complete);
    if (complete) link.setAttribute('aria-label', `${link.textContent.trim()} · 학습 완료`);
    else link.removeAttribute('aria-label');
  });
  const status = document.querySelector('[data-study-status]');
  const clear = document.querySelector('[data-clear]');
  if (status && clear) {
    status.textContent = `방문한 장 ${study.visited.length} / 12 · 학습 완료로 표시한 장 ${study.completed.length} / 12`;
    status.hidden = clear.hidden = study.visited.length === 0;
  }
  const resume = document.querySelector('[data-resume]');
  if (resume) {
    const last = study.resume;
    resume.hidden = !chapterId.test(last?.id ?? '');
    if (!resume.hidden) resume.href = `chapter-${last.id}/${last.section || ''}`;
  }
  const mark = document.querySelector('[data-complete]');
  if (mark) {
    const complete = study.completed.includes(current);
    mark.hidden = false;
    mark.textContent = complete ? '학습 완료로 표시됨 · 취소' : '학습 완료 표시';
    mark.setAttribute('aria-pressed', String(complete));
  }
}

if (chapterId.test(current)) {
  if (!study.visited.includes(current)) study.visited.push(current);
  const remember = hash => {
    study.resume = { id: current, section: /^#[\da-z-]+$/.test(hash) ? hash : '' };
    saveStudy();
  };
  remember(location.hash);
  addEventListener('hashchange', () => remember(location.hash));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      // An explicit fragment remains the resume point until the reader moves on.
      const entry = entries.find(item => item.isIntersecting && item.boundingClientRect.top >= 0);
      if (entry) remember(`#${entry.target.id}`);
    }, { rootMargin: '-65px 0px -68% 0px' });
    document.querySelectorAll('.lesson[id], .review[id]').forEach(section => observer.observe(section));
  }
  document.querySelector('[data-complete]')?.addEventListener('click', () => {
    if (study.completed.includes(current)) study.completed = study.completed.filter(id => id !== current);
    else study.completed.push(current);
    saveStudy();
    updateStudy();
  });
}

document.querySelector('[data-clear]')?.addEventListener('click', () => {
  study.visited = [];
  study.completed = [];
  study.resume = null;
  saveStudy();
  updateStudy();
  document.querySelector('#contents h2')?.focus();
});

if (current === 'home') {
  const query = new URLSearchParams(location.search);
  const step = /^[1-4]$/.test(query.get('step')) ? Number(query.get('step')) : 1;
  const oldHash = location.hash.slice(1);
  const destination = query.get('xp') === '1' ? oldExperience[step - 1] : Object.hasOwn(legacy, oldHash) && legacy[oldHash];
  if (destination) {
    const [id, section] = destination.split('#');
    location.replace(`chapter-${id}/#${section}`);
  }
}

const mastContents = document.querySelector('.mast-contents');
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key === 'Escape' && mastContents?.open && !document.querySelector('dialog[open]')) {
    mastContents.open = false;
    mastContents.querySelector('summary').focus();
  }
  if (event.key.toLowerCase() === 'h' && !event.target.closest?.(editable) && !document.querySelector('dialog[open]')) {
    location.href = document.querySelector('[data-home]').href;
  }
});
document.addEventListener('pointerdown', event => {
  if (mastContents?.open && !mastContents.contains(event.target)) mastContents.open = false;
});

function enableExpand(section, workspace, api) {
  const trigger = section.querySelector('[data-expand]');
  if (typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'lab-dialog';
  dialog.setAttribute('aria-labelledby', 'expanded-title');
  const label = section.querySelector('h3').textContent;
  dialog.innerHTML = '<div class="dialog-bar"><h2 id="expanded-title"></h2><button type="button">닫기</button></div>';
  dialog.querySelector('h2').textContent = label;
  const close = dialog.querySelector('button');
  const home = workspace.parentElement;
  trigger.hidden = false;
  let scrollX, scrollY;
  trigger.addEventListener('click', () => {
    scrollX = window.scrollX;
    scrollY = window.scrollY;
    dialog.append(workspace);
    document.body.append(dialog);
    dialog.showModal();
    close.focus();
    api?.resize?.();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    home.append(workspace);
    dialog.remove();
    trigger.focus({ preventScroll: true });
    api?.resize?.();
    window.scrollTo(scrollX, scrollY);
  });
}

const modules = {
  '01': () => import('../labs/part-one.mjs'),
  '02': () => import('../labs/part-one.mjs'),
  '03': () => import('../labs/part-one.mjs'),
  '04': () => import('../labs/part-two.mjs'),
  '05': () => import('../labs/part-two.mjs'),
  '06': () => import('../labs/part-two.mjs'),
  '07': () => import('../labs/zeta-labs.mjs'),
  '08': () => import('../labs/part-three.mjs'),
  '09': () => import('../wave/index.mjs'),
  '10': () => import('../labs/part-three.mjs'),
  '11': () => import('../proof/lean-labs.mjs'),
  '12': () => import('../proof/explorer.mjs'),
};

async function startLab(section) {
  if (section.dataset.started) return;
  section.dataset.started = 'true';
  const mountPoint = section.querySelector('[data-lab-mount]');
  const fallback = [...mountPoint.childNodes];
  try {
    const id = section.dataset.lab;
    const experiment = await modules[id.slice(0, 2)]();
    const api = await experiment.mount(mountPoint, id, new URLSearchParams(location.search));
    enableExpand(section, mountPoint.closest('.lab-workspace'), api);
    section.dataset.ready = 'true';
  } catch {
    mountPoint.replaceChildren(...fallback);
    const status = document.createElement('p');
    status.textContent = '실험을 불러오지 못했습니다. 페이지를 새로고침하여 다시 시도할 수 있습니다.';
    mountPoint.append(status);
  }
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      startLab(entry.target);
    }
  }, { rootMargin: '240px 0px' });
  document.querySelectorAll('[data-lab]').forEach(section => observer.observe(section));
} else document.querySelectorAll('[data-lab]').forEach(startLab);

updateStudy();
