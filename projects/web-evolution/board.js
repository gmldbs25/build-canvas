const lanes = ['To do', 'In progress', 'Done'];
const labels = { planning: 'Planning', design: 'Design', research: 'Research' };

const initialCards = [
  { id: 1, lane: 0, title: 'Interview beta testers', label: 'research', owner: 'AL' },
  { id: 2, lane: 0, title: 'Write the launch post', label: 'planning' },
  { id: 3, lane: 0, title: 'Make a feedback form', label: 'design' },
  { id: 4, lane: 1, title: 'Sketch the landing page', label: 'design', owner: 'MK' },
  { id: 5, lane: 1, title: 'Collect early feedback', label: 'research' },
  { id: 6, lane: 2, title: 'Set up the project board', label: 'planning', owner: 'AL' },
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

  function renderCards(screen) {
    for (const [index, lane] of lanes.entries()) {
      const visibleCards = cards.filter(({ lane, title }) => lane === index && title.toLowerCase().includes(filter));
      screen.querySelector(`[data-lane="${index}"] .cards`).innerHTML = visibleCards.map((card) => `
        <button type="button" class="board-card" draggable="true" data-card="${card.id}">
          ${card.label ? `<span class="card-tag ${card.label}">${labels[card.label]}</span>` : ''}
          <span>${escapeHtml(card.title)}</span>
          ${card.owner ? `<span class="card-owner" aria-label="Assigned to ${card.owner}">${card.owner}</span>` : ''}
        </button>`).join('');
      screen.querySelector(`[data-lane="${index}"] .card-count`).textContent = visibleCards.length;
      screen.querySelector(`[data-lane="${index}"]`).setAttribute('aria-label', lane);
    }
    screen.querySelector('.board-empty').hidden = !filter || cards.some(({ title }) => title.toLowerCase().includes(filter));
  }

  function moveCard(screen, id, lane) {
    const card = cards.find((entry) => entry.id === id);
    if (!card || card.lane === lane) return;
    card.lane = lane;
    cards.splice(cards.indexOf(card), 1);
    cards.push(card);
    renderCards(screen);
    screen.querySelector('.board-feedback').textContent = `${card.title} moved to ${lanes[lane]}.`;
  }

  function init(screen) {
    const dialog = screen.querySelector('dialog');
    const laneSelect = dialog.querySelector('select');
    const search = screen.querySelector('input[type="search"]');
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
      dialog.querySelector('h3').textContent = activeCard.title;
      laneSelect.value = activeCard.lane;
      dialog.showModal();
    });
    laneSelect.addEventListener('change', () => moveCard(screen, activeCard.id, Number(laneSelect.value)));
    dialog.addEventListener('close', () => screen.querySelector(`[data-card="${activeCard.id}"]`)?.focus());

    for (const form of screen.querySelectorAll('.add-card')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.elements.title;
        const title = input.value.trim();
        if (!title) return;
        const lane = Number(form.closest('[data-lane]').dataset.lane);
        cards.push({ id: nextId++, lane, title });
        form.reset();
        filter = '';
        search.value = '';
        renderCards(screen);
        screen.querySelector('.board-feedback').textContent = `${title} added to ${lanes[lane]}.`;
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
      <div class="board-heading"><h2>Launch board</h2><p>Studio workspace</p></div>
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
      <dialog class="card-dialog" aria-labelledby="card-title">
        <form method="dialog"><button type="submit" aria-label="Close card">×</button></form>
        <h3 id="card-title"></h3>
        <label>Move to list <select>${lanes.map((lane, index) => `<option value="${index}">${lane}</option>`).join('')}</select></label>
      </dialog>
    </article>`;
  }

  return { init, markup };
}
