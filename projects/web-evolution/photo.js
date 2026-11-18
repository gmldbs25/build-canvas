const gallery = [
  { id: 'harbor', page: 'photo', author: 'Mira Chen', place: 'Port Townsend, WA', date: 'Aug 12, 2005', title: 'Moon over the harbor', image: './media/moon-harbor.webp', alt: 'A bright full moon hangs above a quiet harbor and dark blue water.', notes: 'The moon came up just as the last ferry crossed the bay. A 200 mm lens, tripod, and a very cold deck.' },
  { id: 'roof', page: 'roof', author: 'Daniel Price', place: 'Bristol, UK', date: 'Aug 9, 2005', title: 'First quarter from the roof', image: './media/moon-roof.webp', alt: 'A first-quarter moon above old rooftops and a brick chimney.', notes: 'Clear patch between the clouds at 10:43 pm. Handheld, through the kitchen window.' },
  { id: 'desert', page: 'desert', author: 'Asha Patel', place: 'Tucson, AZ', date: 'Aug 6, 2005', title: 'Desert moonrise', image: './media/moon-desert.webp', alt: 'A low orange moon rising above a dark desert ridge.', notes: 'The hills went violet before the sky did. I stayed until the coyotes started up.' },
];
const FAVORITES_KEY = 'web-evolution-moonstream-favorites';
const uploadedPhotos = [];
const favoriteIds = (() => {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
  catch { return new Set(); }
})();

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function photoLink(page, label, extra = '') {
  return `<a href="?era=2005&amp;page=${page}" data-page="${page}" ${extra}>${label}</a>`;
}

function saveFavorites() {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds])); }
  catch { /* Keep favorites for this visit. */ }
}

function photoTiles(photos) {
  return `<div class="moon-grid">${photos.map((photo) => photo.page ? `<a class="moon-card" href="?era=2005&amp;page=${photo.page}" data-page="${photo.page}"><img src="${photo.image}" alt="${photo.alt}" width="1024" height="768"><span class="moon-caption"><strong>${escapeHtml(photo.title)}</strong><span>by ${escapeHtml(photo.author)}</span><small>${escapeHtml(photo.place)}</small></span></a>` : `<figure class="moon-card"><img src="${photo.image}" alt="${photo.alt}" width="1024" height="768"><figcaption class="moon-caption"><strong>${escapeHtml(photo.title)}</strong><span>by ${escapeHtml(photo.author)}</span><small>${escapeHtml(photo.place)}</small></figcaption></figure>`).join('')}</div>`;
}

export function photoPage(page) {
  if (['photo', 'roof', 'desert'].includes(page)) {
    const photo = gallery.find((entry) => entry.page === page) || gallery[0];
    const isFavorite = favoriteIds.has(photo.id);
    return `<article class="photo-page">
      <div class="flickr-breadcrumb">${photoLink('home', '← Your photostream')} <span>›</span> Photo detail</div>
      <div class="photo-detail-grid">
        <figure class="photo-large"><img src="${photo.image}" alt="${photo.alt}" width="1024" height="768"><figcaption>${escapeHtml(photo.title)}</figcaption></figure>
        <aside class="photo-info"><h2>${escapeHtml(photo.title)}</h2>
          <p class="photo-byline">by <strong>${photo.author}</strong></p>
          <p>${photo.place} · ${photo.date}</p><p>${photo.notes}</p>
          <div class="photo-tags"><strong>Tags</strong> ${photoLink('moon', 'moon', 'class="tag-chip"')}</div>
          <button class="photo-fave" type="button" data-favorite="${photo.id}" aria-pressed="${isFavorite}">${isFavorite ? '♥ In favorites' : '♡ Add to favorites'}</button>
          <div class="photo-comments"><h3>2 comments</h3><p><strong>orbit_jane:</strong> That reflection is beautiful!</p><p><strong>mossy:</strong> Ferry lights and moonlight — perfect.</p></div>
        </aside>
      </div>
      <p class="photo-next">Want more? Follow the ${photoLink('moon', 'moon tag')} to see everyone’s photos.</p>
    </article>`;
  }
  if (page === 'moon') {
    return `<article class="photo-page moon-page">
      <div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Explore tags</div>
      <h2>Photos tagged <span class="tag-chip">moon</span></h2>
      <p class="photo-intro">A little moonlight from photographers around the world. Open a photo to read its story.</p>
      ${photoTiles(gallery)}
    </article>`;
  }
  if (page === 'sets') {
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Sets</div><h2>Set: Night walks</h2><p class="photo-intro">A small collection of evening skies and late walks.</p>${photoTiles(gallery)}</article>`;
  }
  if (page === 'favorites') {
    const savedPhotos = gallery.filter(({ id }) => favoriteIds.has(id));
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Favorites</div><h2>Your favorites</h2><p class="photo-intro">Photos you have saved on this device.</p>${savedPhotos.length ? photoTiles(savedPhotos) : '<p class="empty-favorites">Nothing saved yet. Open a photo and choose “Add to favorites” to keep it here.</p>'}</article>`;
  }

  const photos = [...uploadedPhotos, ...gallery];
  return `<article class="photo-page photostream-page">
    <header class="photo-community-head"><div><p class="photo-kicker">moonstream · photos from people like you</p><h2>Your photostream</h2><p>Little moments, shared with friends.</p></div><button class="upload-button" type="button" data-upload-open>↑ Upload</button></header>
    <div class="photo-tabs">${photoLink('home', 'Photostream', 'aria-current="page"')}${photoLink('sets', 'Sets')}${photoLink('favorites', 'Favorites')}</div>
    <p class="photo-intro">A few frames from the last week. Open one, or browse the <a href="?era=2005&amp;page=moon" data-page="moon">moon photos everyone is sharing →</a></p>
    ${photoTiles(photos)}
    <dialog class="upload-dialog"><form method="dialog" class="upload-close"><button type="submit" aria-label="Close upload">×</button></form><form class="upload-form"><h3>Share a photograph</h3><label>Photo <input type="file" name="photo" accept="image/*" required></label><label>Caption <input name="caption" maxlength="70" placeholder="A note about this moment"></label><p class="upload-feedback" aria-live="polite"></p><button type="submit">Add to photostream</button></form></dialog>
    <p class="stream-note">Viewing ${photos.length} recent photos · shared with friends</p>
  </article>`;
}

export function initPhoto(content) {
  content.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      const id = favorite.dataset.favorite;
      const saved = !favoriteIds.has(id);
      if (saved) favoriteIds.add(id); else favoriteIds.delete(id);
      saveFavorites();
      favorite.setAttribute('aria-pressed', String(saved));
      favorite.textContent = saved ? '♥ In favorites' : '♡ Add to favorites';
      return;
    }
    if (event.target.closest('[data-upload-open]')) content.querySelector('.upload-dialog')?.showModal();
  });
  content.querySelector('.upload-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.photo.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const title = form.elements.caption.value.trim() || file.name.replace(/\.[^.]+$/, '');
    const image = URL.createObjectURL(file);
    uploadedPhotos.unshift({ id: `upload-${Date.now()}`, author: 'You', place: 'Your photostream', date: 'Just now', title, image, alt: `Photo uploaded by you: ${title}.`, notes: 'Shared in this local Moonstream exhibit.' });
    form.reset();
    content.querySelector('.upload-dialog')?.close();
    content.querySelector('.moon-grid')?.insertAdjacentHTML('afterbegin', `<figure class="moon-card"><img src="${image}" alt="Photo uploaded by you: ${escapeHtml(title)}"><figcaption class="moon-caption"><strong>${escapeHtml(title)}</strong><span>by You</span><small>Your photostream</small></figcaption></figure>`);
    const count = content.querySelector('.stream-note');
    if (count) count.textContent = `Viewing ${gallery.length + uploadedPhotos.length} recent photos · shared with friends`;
  });
}
