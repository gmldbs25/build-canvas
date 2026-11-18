const gallery = [
  { id: 'harbor', page: 'photo', author: 'REDONCE', place: 'Prishtina Observatory · Prishtina, Kosovo', date: 'Sep 7, 2025', title: 'Lunar eclipse at Prishtina Observatory', image: './media/moon-harbor.webp', width: 1280, height: 853, alt: 'Visitors gather around a telescope inside Prishtina Observatory during a total lunar eclipse.', notes: 'Visitors observe the total lunar eclipse during a public astronomy event.', credit: 'Photo by REDONCE · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Total_lunar_eclipse_observed_from_Prishtina_Observatory_07.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Total_lunar_eclipse_observed_from_Prishtina_Observatory_07.jpg' },
  { id: 'roof', page: 'roof', author: 'Bagorws', place: 'Glazov, Russia', date: 'Jul 28, 2018', title: 'Blood Moon through a Dobsonian', image: './media/moon-roof.webp', width: 853, height: 1280, alt: 'A dark red lunar eclipse against a black sky, photographed through a telescope.', notes: 'Total lunar eclipse photographed through a Sky-Watcher Dob 8 telescope.', credit: 'Photo by Bagorws · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunar_eclipse_through_a_telescope._Glazov._28.07.2018_01.21.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lunar_eclipse_through_a_telescope._Glazov._28.07.2018_01.21.jpg' },
  { id: 'desert', page: 'desert', author: 'D. Schreiner and S. Degezelle / ESO', place: 'Paranal Observatory · Atacama Desert, Chile', date: 'Apr 15, 2014', title: 'Eclipsed Moon over Paranal', image: './media/moon-desert.webp', width: 853, height: 1280, alt: 'The red eclipsed Moon glows above the Very Large Telescope at Paranal Observatory.', notes: 'A total lunar eclipse above the Very Large Telescope, photographed from the Atacama Desert.', credit: 'Photo by D. Schreiner and S. Degezelle / ESO', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eclipse_from_Paranal_Observatory_(VLT).jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Eclipse_from_Paranal_Observatory_(VLT).jpg' },
];
const FAVORITES_KEY = 'web-evolution-moonstream-favorites';
const uploadedPhotos = [];
const favoriteIds = (() => {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
  catch { return new Set(); }
})();

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function photoLink(page, label, extra = '') {
  return `<a href="?era=2005&amp;page=${page}" data-page="${page}" ${extra}>${label}</a>`;
}

function saveFavorites() {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds])); }
  catch { /* Keep favorites for this visit. */ }
}

function photoTiles(photos) {
  return `<div class="moon-grid">${photos.map((photo) => photo.page ? `<a class="moon-card" href="?era=2005&amp;page=${photo.page}" data-page="${photo.page}"><img src="${photo.image}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}"><span class="moon-caption"><strong>${escapeHtml(photo.title)}</strong><span>by ${escapeHtml(photo.author)}</span><small>${escapeHtml(photo.place)}</small></span></a>` : `<figure class="moon-card"><img src="${photo.image}" alt="${escapeHtml(photo.alt)}" width="${photo.width || 1024}" height="${photo.height || 768}"><figcaption class="moon-caption"><strong>${escapeHtml(photo.title)}</strong><span>by ${escapeHtml(photo.author)}</span><small>${escapeHtml(photo.place)}</small></figcaption></figure>`).join('')}</div>`;
}

export function photoPage(page) {
  if (['photo', 'roof', 'desert'].includes(page)) {
    const photo = gallery.find((entry) => entry.page === page) || gallery[0];
    const isFavorite = favoriteIds.has(photo.id);
    return `<article class="photo-page">
      <div class="flickr-breadcrumb">${photoLink('home', '← Your photostream')} <span>›</span> Photo detail</div>
      <div class="photo-detail-grid">
        <figure class="photo-large"><img src="${photo.image}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}"><figcaption>${escapeHtml(photo.title)}</figcaption></figure>
        <aside class="photo-info"><h2>${escapeHtml(photo.title)}</h2>
          <p class="photo-byline">by <strong>${photo.author}</strong></p>
          <p>${photo.place} · ${photo.date}</p><p>${photo.notes}</p>
          <p class="photo-credit"><strong>${escapeHtml(photo.credit)}</strong>. <a href="${photo.sourceUrl}" target="_blank" rel="noopener noreferrer">Source record</a> · <a href="${photo.originalUrl}" target="_blank" rel="noopener noreferrer">Download original</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></p>
          <div class="photo-tags"><strong>Tags</strong> ${photoLink('moon', 'moon', 'class="tag-chip"')}</div>
          <button class="photo-fave" type="button" data-favorite="${photo.id}" aria-pressed="${isFavorite}">${isFavorite ? '♥ In favorites' : '♡ Add to favorites'}</button>
          <div class="photo-comments"><h3>2 comments</h3><p><strong>stargazer:</strong> What a view!</p><p><strong>bluehour:</strong> Thanks for sharing this moment.</p></div>
        </aside>
      </div>
      <p class="photo-next">Want more? Follow the ${photoLink('moon', 'moon tag')} to see everyone’s photos.</p>
    </article>`;
  }
  if (page === 'moon') {
    return `<article class="photo-page moon-page">
      <div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Explore tags</div>
      <h2>Photos tagged <span class="tag-chip">moon</span></h2>
      <p class="photo-intro">A little moonlight from photographers around the world. Open a photo to read its story and photo credit.</p>
      ${photoTiles(gallery)}
    </article>`;
  }
  if (page === 'sets') {
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Sets</div><h2>Set: Lunar eclipses</h2><p class="photo-intro">Three views of total lunar eclipses, from a backyard telescope to an observatory outreach night.</p>${photoTiles(gallery)}</article>`;
  }
  if (page === 'favorites') {
    const savedPhotos = gallery.filter(({ id }) => favoriteIds.has(id));
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Your photostream')} <span>›</span> Favorites</div><h2>Your favorites</h2><p class="photo-intro">Photos you have saved on this device.</p>${savedPhotos.length ? photoTiles(savedPhotos) : '<p class="empty-favorites">Nothing saved yet. Open a photo and choose “Add to favorites” to keep it here.</p>'}</article>`;
  }

  const photos = [...uploadedPhotos, ...gallery];
  return `<article class="photo-page photostream-page">
    <header class="photo-community-head"><div><p class="photo-kicker">moonstream · photos from people like you</p><h2>Your photostream</h2><p>Little moments, shared with friends.</p></div><button class="upload-button" type="button" data-upload-open>↑ Upload</button></header>
    <div class="photo-tabs">${photoLink('home', 'Photostream', 'aria-current="page"')}${photoLink('sets', 'Sets')}${photoLink('favorites', 'Favorites')}</div>
    <p class="photo-intro">A Flickr-inspired community, imagined in 2005. These licensed photographs were actually taken from 2014 to 2025. Open one for its source and credit, or browse the <a href="?era=2005&amp;page=moon" data-page="moon">moon tag →</a></p>
    ${photoTiles(photos)}
    <dialog class="upload-dialog"><form method="dialog" class="upload-close"><button type="submit" aria-label="Close upload">×</button></form><form class="upload-form"><h3>Share a photograph</h3><label>Photo <input type="file" name="photo" accept="image/*" required></label><label>Caption <input name="caption" maxlength="70" placeholder="A note about this moment"></label><p class="upload-feedback" aria-live="polite"></p><button type="submit">Add to photostream</button></form></dialog>
    <p class="stream-note">${photos.length} photos in your photostream · shared with friends</p>
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
    if (count) count.textContent = `${gallery.length + uploadedPhotos.length} photos in your photostream · shared with friends`;
  });
}
