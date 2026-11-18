const lanes = ['To do', 'In progress', 'Done'];
const labels = { planning: 'Planning', design: 'Design', research: 'Research' };

const initialCards = [
  { id: 1, key: 'confirm-meeting-time', lane: 0, title: 'Confirm the meeting time', description: 'Agree on a start time with everyone coming to the ridge. Check sunset and the last bus back.', due: '2013-10-18T18:00', label: 'planning', owner: 'AL' },
  { id: 2, key: 'check-weather', lane: 0, title: 'Check the weekend forecast', description: 'Look for cloud cover and wind before we pack the telescope.', due: '2013-10-18T12:00', label: 'research' },
  { id: 3, key: 'print-star-chart', lane: 0, title: 'Print a star chart', description: 'Bring a chart for the northern sky and mark the planets visible this month.', due: '', label: 'design' },
  { id: 4, key: 'charge-camera', lane: 1, title: 'Charge the camera batteries', description: 'Pack the spare battery and memory card for moon photos.', due: '2013-10-19T16:00', label: 'planning', owner: 'MK' },
  { id: 5, key: 'borrow-binoculars', lane: 1, title: 'Borrow binoculars', description: 'Ask the astronomy club if a second pair is available.', due: '', label: 'research' },
  { id: 6, key: 'choose-site', lane: 2, title: 'Choose a dark-sky site', description: 'Ridge pull-off has a clear view and room to set up.', due: '', label: 'planning', owner: 'AL' },
];

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

export function createBoard() {
  const cards = initialCards.map((card) => ({ ...card }));
  let nextId = cards.length + 1;
  let filter = '';
  let draggedId;
  let activeCard;
  let activity = 'Observing Night board is ready.';

  function snapshot() {
    return cards.map((card) => ({ ...card }));
  }

  function updateProgress(screen) {
    const done = cards.filter(({ lane }) => lane === 2).length;
    const progress = screen.querySelector('.board-progress');
    progress.value = done;
    progress.max = Math.max(cards.length, 1);
    progress.setAttribute('aria-label', `${done} of ${cards.length} tasks complete`);
    screen.querySelector('.progress-label').textContent = `${done} of ${cards.length} done`;
    screen.querySelector('.board-activity').textContent = activity;
  }

  function renderCards(screen) {
    for (const [index] of lanes.entries()) {
      const visibleCards = cards.filter(({ lane, title }) => lane === index && title.toLowerCase().includes(filter));
      screen.querySelector(`[data-lane="${index}"] .cards`).innerHTML = visibleCards.map((card) => `
        <button type="button" class="board-card" draggable="true" data-card="${card.id}" aria-label="Open ${escapeHtml(card.title)}">
          ${card.label ? `<span class="card-tag ${card.label}">${labels[card.label]}</span>` : ''}
          <span class="card-title">${escapeHtml(card.title)}</span>
          ${card.description ? `<span class="card-description">${escapeHtml(card.description)}</span>` : ''}
          ${card.due ? `<time class="card-due" datetime="${escapeHtml(card.due)}">${new Date(card.due).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>` : ''}
          ${card.owner ? `<span class="card-owner" aria-label="Assigned to ${escapeHtml(card.owner)}">${escapeHtml(card.owner)}</span>` : ''}
        </button>`).join('');
      screen.querySelector(`[data-lane="${index}"] .card-count`).textContent = cards.filter(({ lane }) => lane === index).length;
      screen.querySelector(`[data-lane="${index}"]`).setAttribute('aria-label', lanes[index]);
    }
    screen.querySelector('.board-empty').hidden = !filter || cards.some(({ title }) => title.toLowerCase().includes(filter));
    updateProgress(screen);
  }

  function record(message, screen) {
    activity = message;
    updateProgress(screen);
  }

  function moveCard(screen, id, lane) {
    const card = cards.find((entry) => entry.id === id);
    if (!card || card.lane === lane) return;
    card.lane = lane;
    cards.splice(cards.indexOf(card), 1);
    cards.push(card);
    renderCards(screen);
    record(`${card.title} moved to ${lanes[lane]}.`, screen);
  }

  function addCard({ title, description = '', key } = {}) {
    const cleanTitle = String(title || '').trim();
    const cleanKey = key ? String(key).trim() : '';
    if (!cleanTitle || cards.some((card) => (cleanKey && card.key === cleanKey) || card.title.toLocaleLowerCase() === cleanTitle.toLocaleLowerCase())) return false;
    cards.push({ id: nextId++, key: cleanKey || `custom-${Date.now()}-${nextId}`, lane: 0, title: cleanTitle, description: String(description || '').trim() });
    return true;
  }

  function init(screen) {
    const dialog = screen.querySelector('dialog');
    const laneSelect = dialog.querySelector('[name="lane"]');
    const search = screen.querySelector('input[type="search"]');
    const detailForm = dialog.querySelector('.detail-form');
    search.value = filter;
    renderCards(screen);
    search.addEventListener('input', () => {
      filter = search.value.trim().toLowerCase();
      renderCards(screen);
    });
    screen.addEventListener('click', (event) => {
      const button = event.target.closest('[data-card]');
      if (!button) return;
      activeCard = cards.find(({ id }) => id === Number(button.dataset.card));
      if (!activeCard) return;
      detailForm.elements.title.value = activeCard.title;
      detailForm.elements.description.value = activeCard.description || '';
      detailForm.elements.due.value = activeCard.due || '';
      laneSelect.value = activeCard.lane;
      dialog.showModal();
    });
    detailForm.addEventListener('submit', (event) => {
      if (event.submitter?.value === 'close') return;
      event.preventDefault();
      const title = detailForm.elements.title.value.trim();
      if (!activeCard || !title) return;
      const previousTitle = activeCard.title;
      activeCard.title = title;
      activeCard.description = detailForm.elements.description.value.trim();
      activeCard.due = detailForm.elements.due.value;
      activeCard.lane = Number(laneSelect.value);
      cards.splice(cards.indexOf(activeCard), 1);
      cards.push(activeCard);
      renderCards(screen);
      record(`${previousTitle === title ? title : `${previousTitle} renamed to ${title}`} updated.`, screen);
      dialog.close();
    });
    laneSelect.addEventListener('change', () => moveCard(screen, activeCard.id, Number(laneSelect.value)));
    dialog.addEventListener('close', () => {
      if (activeCard) screen.querySelector(`[data-card="${activeCard.id}"]`)?.focus();
    });

    for (const form of screen.querySelectorAll('.add-card')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.elements.title;
        const title = input.value.trim();
        if (!title) return;
        const lane = Number(form.closest('[data-lane]').dataset.lane);
        const added = addCard({ title, key: `visit-${Date.now()}-${nextId}` });
        if (!added) {
          screen.querySelector('.board-feedback').textContent = `${title} is already on this board.`;
          record(`${title} is already on this board; no duplicate was added.`, screen);
          return;
        }
        form.reset();
        filter = '';
        search.value = '';
        renderCards(screen);
        const card = cards[cards.length - 1];
        card.lane = lane;
        renderCards(screen);
        record(`${title} added to ${lanes[lane]}.`, screen);
      });
    }

    screen.addEventListener('dragstart', (event) => {
      const card = event.target.closest('[data-card]');
      if (!card) return;
      draggedId = Number(card.dataset.card);
      event.dataTransfer.setData('text/plain', card.dataset.card);
      event.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    screen.addEventListener('dragend', (event) => {
      event.target.closest('[data-card]')?.classList.remove('dragging');
      draggedId = undefined;
      screen.querySelector('.drop-target')?.classList.remove('drop-target');
    });
    screen.addEventListener('dragover', (event) => {
      const lane = event.target.closest('[data-lane]');
      if (!lane || draggedId === undefined) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      screen.querySelector('.drop-target')?.classList.remove('drop-target');
      lane.classList.add('drop-target');
    });
    screen.addEventListener('dragleave', (event) => {
      const lane = event.target.closest('[data-lane]');
      if (lane && !lane.contains(event.relatedTarget)) lane.classList.remove('drop-target');
    });
    screen.addEventListener('drop', (event) => {
      const lane = event.target.closest('[data-lane]');
      if (!lane || draggedId === undefined) return;
      event.preventDefault();
      lane.classList.remove('drop-target');
      const id = draggedId;
      draggedId = undefined;
      screen.querySelector('.dragging')?.classList.remove('dragging');
      moveCard(screen, id, Number(lane.dataset.lane));
    });
  }

  function markup() {
    return `<article class="board-page">
      <header class="app-top">
        <span class="app-logo"><span aria-hidden="true">▥</span> fieldwork</span>
        <label class="board-search"><span aria-hidden="true">⌕</span><span class="sr-only">Find cards</span><input type="search" placeholder="Find cards"></label>
        <span class="app-profile" title="Alex Lee">AL</span>
      </header>
      <div class="board-heading"><div><h2>Observing Night</h2><p>Ridge Observatory · Saturday, October 19</p></div><div class="progress-wrap"><progress class="board-progress" value="0" max="1" aria-label="0 of 6 tasks complete"></progress><span class="progress-label">0 of 6 done</span></div></div>
      <p class="board-activity" aria-live="polite">${escapeHtml(activity)}</p>
      <p class="board-empty" hidden>No matching cards.</p>
      <div class="lanes">
        ${lanes.map((lane, index) => `<section class="lane" data-lane="${index}">
          <h3>${lane}<span class="card-count"></span></h3>
          <div class="cards"></div>
          <form class="add-card">
            <label class="sr-only" for="card-title-${index}">New card in ${lane}</label>
            <input id="card-title-${index}" name="title" placeholder="Add a card…" maxlength="64" required>
            <button type="submit" aria-label="Add card to ${lane}">+</button>
          </form>
        </section>`).join('')}
      </div>
      <p class="board-feedback sr-only" aria-live="polite"></p>
      <dialog class="card-dialog" aria-labelledby="card-dialog-heading">
        <form method="dialog" class="dialog-close"><button type="submit" value="close" aria-label="Close card">×</button></form>
        <form class="detail-form">
          <h3 id="card-dialog-heading">Edit task</h3>
          <label>Title <input name="title" required maxlength="90"></label>
          <label>Notes <textarea name="description" rows="3" maxlength="280"></textarea></label>
          <label>Due <input type="datetime-local" name="due"></label>
          <label>Move to list <select name="lane">${lanes.map((lane, index) => `<option value="${index}">${lane}</option>`).join('')}</select></label>
          <button class="save-details" type="submit">Save changes</button>
        </form>
      </dialog>
    </article>`;
  }

  return { init, markup, addCard, snapshot };
}
