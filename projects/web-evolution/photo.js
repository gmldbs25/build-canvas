import { communityTags, observingPhoto, referencePhotos } from './moonstream-posts.js';

import { formatMessage, bindMessage } from './i18n.js';
const gallery = [
  { id: 'eclipse-a', page: 'eclipse-a', author: 'Auvo Korpi', place: 'Location not listed', date: 'Oct 28, 2004', title: 'A copper-red lunar eclipse', image: './media/eclipse-2004-a.webp', width: 1600, height: 1584, alt: 'A close view of the Moon in deep copper-red shadow during the 28 October 2004 lunar eclipse.', notes: 'The source title is “2004.10.28 Pimennys.” The image record does not identify the capture location; Huhtamo, Finland is the photographer’s base, not a confirmed photo location.', tags: ['lunar-eclipse', 'red-moon', 'close-up'], comments: [['stargazer', 'The copper colour came through even on a small screen.'], ['bluehour', 'I was watching the same eclipse from a cloudy patch of sky.']], credit: 'Photo by Auvo Korpi · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:2004.10.28_Pimennys_(28866343308).jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/2004.10.28_Pimennys_(28866343308).jpg', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  { id: 'eclipse-b', page: 'eclipse-b', author: 'J.C. Rojas', place: 'A Coruña, Spain', date: 'Oct 28, 2004', title: 'Stages of a lunar eclipse', image: './media/eclipse-2004-b.webp', width: 1094, height: 944, alt: 'A composite showing successive phases of the 28 October 2004 lunar eclipse.', notes: 'A composite of successive lunar eclipse phases photographed in A Coruña, Spain.', tags: ['lunar-eclipse', 'sequence', 'red-moon'], comments: [['moonwatcher', 'The sequence makes the change in colour easier to follow.'], ['celeste', 'A Coruña had a clear view that night.']], credit: 'Photo by J.C. Rojas · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:J.C._Rojas_-_Lunar_Eclipse_(by-sa).jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/J.C._Rojas_-_Lunar_Eclipse_(by-sa).jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', shareAlike: true },
  { id: 'eclipse-c', page: 'eclipse-c', author: 'Epukas', place: 'Estonia', date: 'Oct 28, 2004', title: 'The Moon crossing into shadow', image: './media/eclipse-2004-c.webp', width: 1600, height: 1081, alt: 'Several frames show the Moon gradually entering Earth’s shadow during the October 2004 eclipse.', notes: 'A sequence of the eclipse phases photographed in Estonia. The photographer released the image into the public domain.', tags: ['lunar-eclipse', 'sequence', 'phases'], comments: [['nightowl', 'I like how the bright edge moves across each frame.'], ['polaris', 'This is a great one to compare with the red totality shots.']], credit: 'Photo by Epukas · public domain release', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunar_eclipse_October_28_2004.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lunar_eclipse_October_28_2004.jpg', license: 'Public domain' },
  { id: 'eclipse-d', page: 'eclipse-d', author: 'Kari Tikkanen', place: 'Kiuruvesi, Finland', date: 'Oct 28, 2004 · 6:21 AM', title: 'Eclipse in the morning sky', image: './media/eclipse-2004-d.webp', width: 162, height: 165, alt: 'A small, grainy amber Moon during the 28 October 2004 lunar eclipse.', notes: 'Shot with an Olympus C-765 UZ using 10× optical zoom. The low-resolution original preserves the look of a compact camera record.', tags: ['lunar-eclipse', 'red-moon', 'point-and-shoot'], comments: [['startrail', 'That little orange Moon looks just like it did through my binoculars.']], credit: 'Photo by Kari Tikkanen · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunar_eclipse_28102004.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lunar_eclipse_28102004.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', shareAlike: true },
  { id: 'eclipse-e', page: 'eclipse-e', author: 'Jon Sullivan · PD Photo.org', place: 'Location not listed', date: 'Oct 28, 2004', title: 'A bright edge on the Moon', image: './media/eclipse-2004-e.webp', width: 1024, height: 768, alt: 'A narrow bright edge of the Moon stands out against a dark sky during the 2004 lunar eclipse.', notes: 'A point-and-shoot view released to the public domain by its photographer. The source record does not list a location.', tags: ['lunar-eclipse', 'phases', 'point-and-shoot'], comments: [['skyline', 'The dark sky makes that thin bright edge stand out.']], credit: 'Image by Jon Sullivan · PD Photo.org · public domain release', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunar_eclipse01.JPEG', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lunar_eclipse01.JPEG', license: 'Public domain' },
];
const legacyGallery = [
  { id: 'harbor', page: 'photo', author: 'REDONCE', place: 'Prishtina Observatory · Prishtina, Kosovo', date: 'Sep 7, 2025', title: 'Lunar eclipse at Prishtina Observatory', image: './media/moon-harbor.webp', width: 1280, height: 853, alt: 'Visitors gather around a telescope inside Prishtina Observatory during a total lunar eclipse.', notes: 'Visitors observe the total lunar eclipse during a public astronomy event.', credit: 'Photo by REDONCE · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Total_lunar_eclipse_observed_from_Prishtina_Observatory_07.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Total_lunar_eclipse_observed_from_Prishtina_Observatory_07.jpg' },
  { id: 'roof', page: 'roof', author: 'Bagorws', place: 'Glazov, Russia', date: 'Jul 28, 2018', title: 'Blood Moon through a Dobsonian', image: './media/moon-roof.webp', width: 853, height: 1280, alt: 'A dark red lunar eclipse against a black sky, photographed through a telescope.', notes: 'Total lunar eclipse photographed through a Sky-Watcher Dob 8 telescope.', credit: 'Photo by Bagorws · Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lunar_eclipse_through_a_telescope._Glazov._28.07.2018_01.21.jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lunar_eclipse_through_a_telescope._Glazov._28.07.2018_01.21.jpg' },
  { id: 'desert', page: 'desert', author: 'D. Schreiner and S. Degezelle / ESO', place: 'Paranal Observatory · Atacama Desert, Chile', date: 'Apr 15, 2014', title: 'Eclipsed Moon over Paranal', image: './media/moon-desert.webp', width: 853, height: 1280, alt: 'The red eclipsed Moon glows above the Very Large Telescope at Paranal Observatory.', notes: 'A total lunar eclipse above the Very Large Telescope, photographed from the Atacama Desert.', credit: 'Photo by D. Schreiner and S. Degezelle / ESO', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eclipse_from_Paranal_Observatory_(VLT).jpg', originalUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Eclipse_from_Paranal_Observatory_(VLT).jpg' },
];
const memberPhotos = [observingPhoto, ...gallery];
const communityStream = [...memberPhotos, ...referencePhotos];
const FAVORITES_KEY = 'web-evolution-moonstream-favorites';
const uploadedPhotos = [];
const favoriteIds = (() => {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
  catch { return new Set(); }
})();

export function getFavoritePhotoIds() {
  return new Set(favoriteIds);
}

export function getPhotoRecords() {
  return gallery.map((photo) => ({ ...photo }));
}

function renderPhotoDetail(photo) {
  const isFavorite = favoriteIds.has(photo.id);
  const tags = photo.tags || ['lunar-eclipse'];
  const comments = photo.comments || (photo.reference ? [] : [['stargazer', 'What a view!'], ['bluehour', 'Thanks for sharing this moment.']]);
  return `<article class="photo-page">
    <div class="flickr-breadcrumb">${photoLink('home', '← Community photostream')} <span>›</span> Photo detail</div>
    <div class="photo-detail-grid">
      <figure class="photo-large"><img src="${photo.image}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}"><figcaption>${escapeHtml(photo.title)}</figcaption></figure>
      <aside class="photo-info">${photo.reference ? '<p class="photo-kicker">Shared reference image</p>' : ''}<h2>${escapeHtml(photo.title)}</h2>
        <p class="photo-byline">by <strong>${escapeHtml(photo.author)}</strong></p>
        <p>${photo.place ? `${escapeHtml(photo.place)} · ` : ''}${escapeHtml(photo.date)}</p>
        ${photo.notes ? `<p>${escapeHtml(photo.notes)}</p>` : ''}
        <p class="photo-credit"><strong>${escapeHtml(photo.credit)}</strong>. <a href="${photo.sourceUrl}" target="_blank" rel="noopener noreferrer">Source record</a>${photo.originalUrl ? ` · <a href="${photo.originalUrl}" target="_blank" rel="noopener noreferrer">Download original</a>` : ''}${photo.licenseUrl ? ` · <a href="${photo.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.license)}</a>` : ''}</p>
        <div class="photo-tags"><strong>Tags</strong> ${tags.map((tag) => photoLink(photoTagPages[tag] || 'moon', tagLabels[tag] || tag, 'class="tag-chip"')).join('')}</div>
        <button class="photo-fave" type="button" data-favorite="${photo.id}" aria-pressed="${isFavorite}">${isFavorite ? '♥ ' + formatMessage('photo.favorite.saved') : '♡ ' + formatMessage('photo.favorite.add')}</button>
        ${comments.length ? `<div class="photo-comments"><h3>${comments.length} comments</h3>${comments.map(([name, comment]) => `<p><strong>${escapeHtml(name)}:</strong> ${escapeHtml(comment)}</p>`).join('')}</div>` : ''}
      </aside>
    </div>
    <p class="photo-next">See more photos tagged ${photoLink(photoTagPages[tags[0]], tagLabels[tags[0]])}.</p>
  </article>`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function photoLink(page, label, extra = '') {
  return `<a href="?era=2005&amp;page=${page}" data-page="${page}" ${extra}>${label}</a>`;
}

const tagLabels = {
  'lunar-eclipse': 'lunar eclipse',
  'red-moon': 'red moon',
  'sequence': 'sequence',
  'close-up': 'close-up',
  'phases': 'phases',
  'point-and-shoot': 'point-and-shoot',
  ...communityTags,
};

const photoTagPages = Object.fromEntries(Object.keys(tagLabels).map((tag) => [tag, tag === 'lunar-eclipse' ? 'moon' : `tag-${tag}`]));

function tagLink(tag, label, activePage) {
  const page = photoTagPages[tag];
  const selected = activePage === page ? ' aria-current="true"' : '';
  return photoLink(page, label, `class="tag-chip"${selected}`);
}

function saveFavorites() {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIds])); }
  catch { /* Keep favorites for this visit. */ }
}

function photoTile(photo) {
  const details = [photo.place, photo.date].filter(Boolean).map(escapeHtml).join(' · ');
  const dimensions = photo.width && photo.height ? ` width="${photo.width}" height="${photo.height}"` : '';
  const image = `<img src="${photo.image}" alt="${escapeHtml(photo.alt)}"${dimensions}>`;
  const caption = `<strong ${String(photo.id).startsWith('upload-') ? 'data-no-translate' : ''}>${escapeHtml(photo.title)}</strong><span>by ${escapeHtml(photo.author)}</span><small>${details}</small>`;
  return photo.page
    ? photoLink(photo.page, `${image}<span class="moon-caption">${caption}</span>`, 'class="moon-card"')
    : `<figure class="moon-card">${image}<figcaption class="moon-caption">${caption}</figcaption></figure>`;
}

function photoTiles(photos) {
  return `<div class="moon-grid">${photos.map(photoTile).join('')}</div>`;
}

export function photoPage(page) {
  const currentPhoto = communityStream.find((entry) => entry.page === page);
  if (currentPhoto) return renderPhotoDetail(currentPhoto);
  const legacyPhoto = legacyGallery.find((entry) => entry.page === page);
  if (legacyPhoto) return renderPhotoDetail(legacyPhoto);
  if (page === 'moon' || Object.values(photoTagPages).includes(page)) {
    const activeTag = Object.entries(photoTagPages).find(([, tagPage]) => tagPage === page)?.[0] || '';
    const photos = communityStream.filter(({ tags }) => tags.includes(activeTag));
    const tagGroup = activeTag in communityTags ? Object.keys(communityTags) : Object.keys(tagLabels).filter((tag) => !(tag in communityTags));
    const counts = tagGroup.map((tag) => [tag, communityStream.filter(({ tags }) => tags.includes(tag)).length]);
    return `<article class="photo-page moon-page">
      <div class="flickr-breadcrumb">${photoLink('home', 'Community photostream')} <span>›</span> Explore tags</div>
      <header class="moon-heading"><div><p class="photo-kicker">moonstream · explore</p><h2>Photos tagged <span class="tag-chip">${escapeHtml(activeTag ? tagLabels[activeTag] || activeTag : 'lunar eclipse')}</span></h2></div><span class="moon-result-count">${photos.length} photos</span></header>
      <p class="photo-intro">${activeTag in communityTags ? 'Browse observation photos and reference images by topic.' : 'Compare photographs of the October 2004 eclipse. Open a photo for its capture details and source record.'}</p>
      <nav class="photo-tag-nav" aria-label="Browse by tag">
        ${photoLink('home', 'All community photos', 'class="tag-chip"')}
        ${counts.map(([tag, count]) => tagLink(tag, `${tagLabels[tag]} · ${count}`, page)).join('')}
      </nav>
      ${photos.length ? photoTiles(photos) : '<p class="empty-favorites">No photos match this tag yet.</p>'}
      <p class="archive-note">Moonstream is a 2005 community-site reconstruction. Images link to archival source records. Comments are exhibit reconstructions.</p>
    </article>`;
  }
  if (page === 'sets') {
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Community photostream')} <span>›</span> Sets</div><p class="photo-kicker">moonstream · set</p><h2>October 2004 lunar eclipse</h2><p class="photo-intro">A shared set gathers different records of the same eclipse: the red total phase, gradual sequences, and two small-camera views. Compare the photos or open a source record for more detail.</p>${photoTiles(gallery)}</article>`;
  }
  if (page === 'favorites') {
    const savedPhotos = [...communityStream, ...legacyGallery].filter(({ id }) => favoriteIds.has(id));
    return `<article class="photo-page moon-page"><div class="flickr-breadcrumb">${photoLink('home', 'Community photostream')} <span>›</span> Favorites</div><h2>Your favorites</h2><p class="photo-intro">Photos you have saved on this device.</p>${savedPhotos.length ? photoTiles(savedPhotos) : '<p class="empty-favorites">Nothing saved yet. Open a photo and choose “Add to favorites” to keep it here.</p>'}</article>`;
  }

  const photos = [...uploadedPhotos, ...memberPhotos];
  return `<article class="photo-page photostream-page">
    <header class="photo-community-head"><div><p class="photo-kicker">moonstream · photo sharing</p><h2>Community photostream</h2><p>Backyard astronomy · field photos, eclipse sequences, and images worth comparing.</p></div><button class="upload-button" type="button" data-upload-open>↑ Upload</button></header>
    <nav class="photo-tabs" aria-label="Moonstream">${photoLink('home', 'Photostream', 'aria-current="page"')}${photoLink('sets', 'Sets')}${photoLink('favorites', 'Favorites')}</nav>
    <nav class="photo-tag-nav stream-tag-nav" aria-label="Explore community tags"><strong>Explore tags</strong>
      ${['lunar-eclipse', 'observing', 'telescopes', 'planets', 'comets', 'moon'].map((tag) => tagLink(tag, tagLabels[tag], page)).join('')}
    </nav>
    <div class="stream-heading"><h3>Member observations</h3><span class="moon-result-count" aria-live="polite">${photos.length} photos</span></div>
    ${photoTiles(photos)}
    <section class="stream-references" aria-labelledby="reference-heading">
      <div class="stream-heading"><h3 id="reference-heading">Shared reference images</h3><span class="moon-result-count">${referencePhotos.length} photos</span></div>
      ${photoTiles(referencePhotos)}
    </section>
    <dialog class="upload-dialog"><form method="dialog" class="upload-close"><button type="submit" aria-label="Close upload">×</button></form><form class="upload-form"><h3>Share a photograph</h3><p>Your photo appears in this exhibit for this visit.</p><label>Photo <input type="file" name="photo" accept="image/*" required></label><label>Caption <input name="caption" maxlength="70" placeholder="A note about this moment"></label><p class="upload-feedback" aria-live="polite"></p><button type="submit">Add to photostream</button></form></dialog>
    <p class="archive-note">Moonstream is a reconstructed 2005 astronomy group. Original image credits and sources are on each photo page.</p>
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
      favorite.dataset.i18nPrefix=saved?'♥ ':'♡ ';
      bindMessage(favorite,saved?'photo.favorite.saved':'photo.favorite.add');
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
    content.querySelector('.moon-grid')?.insertAdjacentHTML('afterbegin', photoTile(uploadedPhotos[0]));
    const count = content.querySelector('.moon-result-count');
    if (count) bindMessage(count,'photo.count',{count:memberPhotos.length+uploadedPhotos.length});
  });
}
