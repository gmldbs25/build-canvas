import { getFavoritePhotoIds, getPhotoRecords } from './photo.js';

const OUTPUT = { width: 1200, height: 1320, photoHeight: 730 };
const BASELINE = { title: 'Observing Night', date: 'Saturday, October 19, 2013', time: '8:30 p.m.', location: 'West Terrace · North Ridge Observatory' };
const STORAGE_KEY = 'web-evolution-fieldwork-poster-v1';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function attribution(photo) {
  return photo.license === 'Public domain'
    ? `${photo.credit} · image cropped and color-adjusted`
    : `${photo.credit} · ${photo.license} · image cropped and color-adjusted${photo.shareAlike ? ' · edited poster should also be shared under CC BY-SA 2.0' : ''}`;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

export function createPoster() {
  const photos = getPhotoRecords();
  const initialPhoto = photos.find(({ id }) => id === 'eclipse-a') || photos[0];
  const state = {
    ...BASELINE,
    photoId: initialPhoto?.id || 'eclipse-a',
    cropX: 50,
    cropY: 50,
    zoom: 100,
    brightness: 100,
  };
  const maxLengths = { title: 42, date: 64, time: 32, location: 72 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const key of Object.keys(maxLengths)) {
        if (typeof saved[key] === 'string') state[key] = saved[key].trimStart().slice(0, maxLengths[key]);
      }
      if (photos.some(({ id }) => id === saved.photoId)) state.photoId = saved.photoId;
      for (const [key, min, max, fallback] of [['cropX', 0, 100, 50], ['cropY', 0, 100, 50], ['zoom', 100, 230, 100], ['brightness', 55, 145, 100]]) {
        const value = Number(saved[key]);
        state[key] = Number.isFinite(value) ? clamp(Math.round(value), min, max) : fallback;
      }
    }
  } catch { /* Use the default poster when local storage is unavailable. */ }
  let activeRoot = null;
  let showingBefore = false;

  const photoById = (id) => photos.find((photo) => photo.id === id) || photos[0];

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { /* Keep edits in memory for this visit. */ }
  }

  function snapshot() {
    const photo = photoById(state.photoId);
    return {
      title: state.title || 'Observing Night',
      date: state.date || 'Date to be announced',
      time: state.time || 'Time to be announced',
      location: state.location || 'Location to be announced',
      photoId: state.photoId,
      photo: photo?.image || '',
      credit: photo?.credit || 'Photo credit unavailable',
      license: photo?.license || 'License information unavailable',
      cropX: state.cropX,
      cropY: state.cropY,
      zoom: state.zoom,
      brightness: state.brightness,
      fallback: `${state.title || 'Observing Night'} · ${state.date || 'Date to be announced'} · ${state.time || 'Time to be announced'} · ${state.location || 'Location to be announced'}`,
    };
  }

  function imageOptions() {
    const favorites = getFavoritePhotoIds();
    return photos.map((photo) => `<option value="${escapeHtml(photo.id)}" ${photo.id === state.photoId ? 'selected' : ''}>${favorites.has(photo.id) ? '★ Favorite · ' : ''}${escapeHtml(photo.title)} — ${escapeHtml(photo.author)} · ${escapeHtml(photo.license)}</option>`).join('');
  }

  function markup() {
    const photo = photoById(state.photoId);
    return `<article class="poster-editor" aria-label="Observing Night poster editor">
      <header class="poster-editor-header"><div class="poster-app-mark" aria-hidden="true">▧</div><div><span class="poster-app-kicker">FIELDWORK / DESIGN STUDIO</span><h2>Observing Night Poster</h2></div><span class="poster-save-state" aria-live="polite">All changes saved</span></header>
      <div class="poster-editor-layout">
        <section class="poster-preview-column" aria-label="Poster preview">
          <div class="poster-preview-toolbar"><strong>Live preview</strong><button type="button" data-before aria-pressed="false">Show original</button></div>
          <figure class="poster-artboard">
            <div class="poster-art-image" data-image-frame tabindex="0" role="group" aria-label="Photo crop. Drag the image or use arrow keys to reposition it.">
              <img class="poster-source-image" data-source-image src="${escapeHtml(photo?.image || './media/eclipse-2004-a.webp')}" alt="${escapeHtml(photo?.alt || 'Lunar eclipse photograph')}" draggable="false">
              <div class="poster-photo-shade" aria-hidden="true"></div>
              <div class="poster-art-brand">NORTH RIDGE OBSERVATORY</div>
            </div>
            <figcaption class="poster-art-copy">
              <p class="poster-small-label">PUBLIC PROGRAM</p>
              <h3 data-poster-title data-no-translate>${escapeHtml(state.title)}</h3>
              <p class="poster-date-line"><span data-poster-date data-no-translate>${escapeHtml(state.date)}</span><span aria-hidden="true"> · </span><span data-poster-time data-no-translate>${escapeHtml(state.time)}</span></p>
              <p class="poster-location-line" data-poster-location data-no-translate>${escapeHtml(state.location)}</p>
              <p class="poster-credit-line" data-poster-credit>${escapeHtml(attribution(photo || { credit: 'Photo credit unavailable', license: '' }))}</p>
            </figcaption>
          </figure>
          <p class="poster-download-status" role="status" aria-live="polite"></p>
          <div class="poster-export-row"><button class="poster-download" type="button" data-download>Download PNG</button><span>1200 × 1320 px</span></div>
          <p class="poster-image-source">${photo ? `<a href="${escapeHtml(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open photo source ↗</a> · ${photo.licenseUrl ? `<a href="${escapeHtml(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license)}</a>` : escapeHtml(photo.license)}</p>` : ''}
        </section>
        <section class="poster-controls" aria-label="Poster editing controls">
          <fieldset class="poster-control-set"><legend>Poster text</legend>
            <label>Title <input type="text" name="title" maxlength="42" value="${escapeHtml(state.title)}"></label>
            <label>Date <input type="text" name="date" maxlength="64" value="${escapeHtml(state.date)}"></label>
            <label>Time <input type="text" name="time" maxlength="32" value="${escapeHtml(state.time)}"></label>
            <label>Location <input type="text" name="location" maxlength="72" value="${escapeHtml(state.location)}"></label>
          </fieldset>
          <fieldset class="poster-control-set"><legend>Photo</legend>
            <label>Choose an eclipse photograph <select name="photo">${imageOptions()}</select></label>
            <p class="poster-license-warning" data-license-warning>${photo?.shareAlike ? 'This image is CC BY-SA 2.0. The edited poster export must retain the same license.' : 'The export includes a visible photo credit and license line.'}</p>
            <label class="poster-range-label">Zoom <output data-output="zoom">${state.zoom}%</output><input type="range" name="zoom" min="100" max="230" step="1" value="${state.zoom}"></label>
            <label class="poster-range-label">Horizontal crop <output data-output="cropX">${state.cropX}%</output><input type="range" name="cropX" min="0" max="100" step="1" value="${state.cropX}"></label>
            <label class="poster-range-label">Vertical crop <output data-output="cropY">${state.cropY}%</output><input type="range" name="cropY" min="0" max="100" step="1" value="${state.cropY}"></label>
            <label class="poster-range-label">Brightness <output data-output="brightness">${state.brightness}%</output><input type="range" name="brightness" min="55" max="145" step="1" value="${state.brightness}"></label>
            <p class="poster-crop-hint">Drag the photo, or focus it and use arrow keys. Shift + arrow moves farther.</p>
          </fieldset>
        </section>
      </div>
      <p class="poster-next-scene"><a href="?era=2013" data-page="home">← Return to Pacebook</a><a href="?era=2023" data-era="2023">Find the next Observing Night →</a></p>
    </article>`;
  }

  function renderPreview(root = activeRoot) {
    if (!root) return;
    const photo = photoById(state.photoId);
    const displayState = showingBefore ? BASELINE : state;
    const frame = root.querySelector('[data-image-frame]');
    const image = root.querySelector('[data-source-image]');
    if (frame && image && photo) {
      image.src = photo.image;
      image.alt = photo.alt;
      image.style.objectPosition = `${state.cropX}% ${state.cropY}%`;
      image.style.transform = `scale(${state.zoom / 100})`;
      image.style.filter = `brightness(${state.brightness}%)`;
    }
    root.querySelector('[data-poster-title]')?.replaceChildren(document.createTextNode(displayState.title || 'Observing Night'));
    root.querySelector('[data-poster-date]')?.replaceChildren(document.createTextNode(displayState.date || 'Date to be announced'));
    root.querySelector('[data-poster-time]')?.replaceChildren(document.createTextNode(displayState.time || 'Time to be announced'));
    root.querySelector('[data-poster-location]')?.replaceChildren(document.createTextNode(displayState.location || 'Location to be announced'));
    root.querySelector('[data-poster-credit]')?.replaceChildren(document.createTextNode(attribution(photo || { credit: 'Photo credit unavailable', license: '' })));
    root.querySelector('[data-license-warning]')?.replaceChildren(document.createTextNode(photo?.shareAlike
      ? 'This image is CC BY-SA 2.0. The edited poster export must retain the same license.'
      : 'The export includes a visible photo credit and license line.'));
    for (const key of ['zoom', 'cropX', 'cropY', 'brightness']) {
      const output = root.querySelector(`[data-output="${key}"]`);
      if (output) output.value = `${state[key]}%`;
    }
    const creditLink = root.querySelector('.poster-image-source');
    if (creditLink && photo) {
      creditLink.innerHTML = `<a href="${escapeHtml(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open photo source ↗</a> · ${photo.licenseUrl ? `<a href="${escapeHtml(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license)}</a>` : escapeHtml(photo.license)}`;
    }
    const before = root.querySelector('[data-before]');
    if (before) {
      before.setAttribute('aria-pressed', String(showingBefore));
      before.textContent = showingBefore ? 'Show edited poster' : 'Show original';
      root.querySelector('.poster-artboard')?.classList.toggle('is-before', showingBefore);
    }
  }

  function updateStateFromControl(control) {
    if (control.name === 'photo') {
      state.photoId = control.value;
      state.cropX = 50;
      state.cropY = 50;
      state.zoom = 100;
      state.brightness = 100;
    } else if (['cropX', 'cropY', 'zoom', 'brightness'].includes(control.name)) {
      const bounds = { cropX: [0, 100], cropY: [0, 100], zoom: [100, 230], brightness: [55, 145] }[control.name];
      state[control.name] = clamp(Math.round(Number(control.value)), bounds[0], bounds[1]);
    } else if (['title', 'date', 'time', 'location'].includes(control.name)) {
      state[control.name] = control.value.trimStart().slice(0, maxLengths[control.name]);
    }
    showingBefore = false;
    persist();
    renderPreview();
  }

  function init(root) {
    activeRoot = root;
    renderPreview(root);
    root.addEventListener('input', (event) => {
      const control = event.target.closest('input[name], select[name]');
      if (control) updateStateFromControl(control);
    });
    root.addEventListener('change', (event) => {
      const control = event.target.closest('select[name], input[name]');
      if (control) updateStateFromControl(control);
    });
    root.querySelector('[data-before]')?.addEventListener('click', () => {
      showingBefore = !showingBefore;
      renderPreview(root);
    });
    const frame = root.querySelector('[data-image-frame]');
    if (frame) {
      let pointer = null;
      frame.addEventListener('pointerdown', (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        frame.setPointerCapture(event.pointerId);
        frame.classList.add('is-dragging');
      });
      frame.addEventListener('pointermove', (event) => {
        if (!pointer) return;
        const box = frame.getBoundingClientRect();
        state.cropX = clamp(Math.round(state.cropX - ((event.clientX - pointer.x) / box.width) * 100), 0, 100);
        state.cropY = clamp(Math.round(state.cropY - ((event.clientY - pointer.y) / box.height) * 100), 0, 100);
        pointer = { x: event.clientX, y: event.clientY };
        const x = root.querySelector('[name="cropX"]');
        const y = root.querySelector('[name="cropY"]');
        if (x) x.value = state.cropX;
        if (y) y.value = state.cropY;
        showingBefore = false;
        persist();
        renderPreview(root);
      });
      const stop = () => { pointer = null; frame.classList.remove('is-dragging'); };
      frame.addEventListener('pointerup', stop);
      frame.addEventListener('pointercancel', stop);
      frame.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const amount = event.shiftKey ? 8 : 2;
        if (event.key === 'ArrowLeft') state.cropX = clamp(state.cropX - amount, 0, 100);
        if (event.key === 'ArrowRight') state.cropX = clamp(state.cropX + amount, 0, 100);
        if (event.key === 'ArrowUp') state.cropY = clamp(state.cropY - amount, 0, 100);
        if (event.key === 'ArrowDown') state.cropY = clamp(state.cropY + amount, 0, 100);
        const x = root.querySelector('[name="cropX"]');
        const y = root.querySelector('[name="cropY"]');
        if (x) x.value = state.cropX;
        if (y) y.value = state.cropY;
        showingBefore = false;
        persist();
        renderPreview(root);
      });
    }
    root.querySelector('[data-download]')?.addEventListener('click', () => downloadPoster(root));
  }

  async function downloadPoster(root = activeRoot) {
    const photo = photoById(state.photoId);
    const image = root?.querySelector('[data-source-image]');
    const status = root?.querySelector('.poster-download-status');
    if (!photo || !image || !status) return;
    status.textContent = 'Preparing PNG…';
    try {
      if (!image.complete) await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
      if (!image.naturalWidth) throw new Error('Photo did not load.');
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT.width;
      canvas.height = OUTPUT.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');
      context.fillStyle = '#f4f0e8';
      context.fillRect(0, 0, OUTPUT.width, OUTPUT.height);
      const scale = Math.max(OUTPUT.width / image.naturalWidth, OUTPUT.photoHeight / image.naturalHeight) * (showingBefore ? 1 : state.zoom / 100);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const overX = Math.max(0, drawWidth - OUTPUT.width);
      const overY = Math.max(0, drawHeight - OUTPUT.photoHeight);
      const cropX = showingBefore ? 50 : state.cropX;
      const cropY = showingBefore ? 50 : state.cropY;
      context.save();
      context.filter = `brightness(${showingBefore ? 100 : state.brightness}%)`;
      context.drawImage(image, -overX * cropX / 100, -overY * cropY / 100, drawWidth, drawHeight);
      context.restore();
      const shade = context.createLinearGradient(0, OUTPUT.photoHeight * .56, 0, OUTPUT.photoHeight);
      shade.addColorStop(0, 'rgba(5, 12, 23, 0)');
      shade.addColorStop(1, 'rgba(5, 12, 23, .68)');
      context.fillStyle = shade;
      context.fillRect(0, 0, OUTPUT.width, OUTPUT.photoHeight);
      context.fillStyle = '#f5f1e8';
      context.font = 'bold 23px Arial, sans-serif';
      context.fillText('NORTH RIDGE OBSERVATORY', 72, 74);
      context.font = 'bold 86px Georgia, serif';
      const titleLines = wrapText(context, showingBefore ? 'Observing Night' : (state.title || 'Observing Night'), OUTPUT.width - 150).slice(0, 2);
      const bodyTop = OUTPUT.photoHeight + 50;
      titleLines.forEach((line, index) => context.fillText(line, 72, bodyTop + 90 + index * 94));
      const afterTitle = bodyTop + 90 + titleLines.length * 94;
      context.fillStyle = '#52677d';
      context.font = 'bold 30px Arial, sans-serif';
      context.fillText(showingBefore ? 'Saturday, October 19, 2013 · 8:30 p.m.' : `${state.date || 'Date to be announced'} · ${state.time || 'Time to be announced'}`, 75, afterTitle + 6);
      context.font = '28px Arial, sans-serif';
      wrapText(context, showingBefore ? 'West Terrace · North Ridge Observatory' : (state.location || 'Location to be announced'), OUTPUT.width - 150).slice(0, 2).forEach((line, index) => context.fillText(line, 75, afterTitle + 58 + index * 35));
      context.fillStyle = '#54616e';
      context.font = '16px Arial, sans-serif';
      const credit = attribution(photo);
      const creditLines = wrapText(context, credit, OUTPUT.width - 150).slice(0, 2);
      creditLines.forEach((line, index) => context.fillText(line, 75, OUTPUT.height - 43 - (creditLines.length - index - 1) * 19));
      if (photo.shareAlike) {
        context.font = 'bold 16px Arial, sans-serif';
        context.fillText('Edited poster: share under CC BY-SA 2.0', 75, OUTPUT.height - 12);
      }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('The PNG could not be created.');
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'north-ridge-observing-night.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      status.textContent = 'Poster PNG downloaded with photo attribution.';
    } catch {
      status.textContent = 'Could not create the PNG. Try another photo or reload this page.';
    }
  }

  function updateSchedule({ date, time, location } = {}) {
    if (date !== undefined) state.date = String(date).trimStart().slice(0, maxLengths.date);
    if (time !== undefined) state.time = String(time).trimStart().slice(0, maxLengths.time);
    if (location !== undefined) state.location = String(location).trimStart().slice(0, maxLengths.location);
    persist();
    if (activeRoot?.isConnected) {
      for (const [name, value] of Object.entries({ date: state.date, time: state.time, location: state.location })) {
        const input = activeRoot.querySelector(`[name="${name}"]`);
        if (input) input.value = value;
      }
      renderPreview(activeRoot);
    }
    return snapshot();
  }

  return { markup, init, snapshot, updateSchedule };
}
