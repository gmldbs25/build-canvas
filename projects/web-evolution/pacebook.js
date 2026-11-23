import { archivedPhotos, people, posts } from './pacebook-posts.js';
import { formatMessage, bindMessage } from './i18n.js';
import { translateText } from './i18n.js';

const storageKey = 'build-canvas:pacebook';
const posterLink = '<a href="?era=2013&amp;page=poster" data-page="poster">Fieldwork poster editor ↗</a>';
const photoCreditsLink = '<a href="./media/pacebook/CREDITS.md" target="_blank" rel="noopener">Photo credits ↗</a>';
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const photoCatalog = new Map([...posts.filter(({ photo }) => photo).map(({ photo }) => [photo[0], photo]), ...archivedPhotos.map((photo) => [photo[0], photo])]);
const filters = { all: 'All updates', photo: 'Photos', mine: 'My posts' };

function html(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function avatar(person, size = '') {
  return `<span class="pace-avatar pace-avatar-${person.color}${size ? ` pace-avatar-${size}` : ''}" aria-hidden="true">${person.initials}</span>`;
}

function profileButton(author) {
  return author === 'you' ? '<strong>You</strong>' : `<button type="button" class="pace-name" data-pace-person="${author}">${people[author].name}</button>`;
}

function loadState() {
  const state = { liked: new Set(), ownPosts: [], comments: new Map() };
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (!value || typeof value !== 'object') return state;
    if (Array.isArray(value.posts)) {
      state.ownPosts = value.posts.filter((post) => post && typeof post.id === 'string' && /^local-[0-9a-f-]{36}$/.test(post.id) &&
        typeof post.text === 'string' && (post.text.trim() || photoCatalog.has(post.photo)) &&
        typeof post.date === 'string' && Number.isFinite(Date.parse(post.date)))
        .slice(0, 24).map((post) => ({ id: post.id, author: 'you', text: post.text.slice(0, 420), date: post.date,
          photo: photoCatalog.get(post.photo), likes: 0, comments: [] }));
    }
    const validPosts = new Set([...posts, ...state.ownPosts].map(({ id }) => id));
    if (Array.isArray(value.liked)) state.liked = new Set(value.liked.filter((id) => validPosts.has(id)));
    if (value.comments && typeof value.comments === 'object') {
      for (const [id, entries] of Object.entries(value.comments)) {
        if (!validPosts.has(id) || !Array.isArray(entries)) continue;
        state.comments.set(id, entries.filter((entry) => entry && typeof entry.id === 'string' && /^local-[0-9a-f-]{36}$/.test(entry.id) &&
          typeof entry.text === 'string' && entry.text.trim())
          .slice(0, 36).map(({ id, text, parent }) => ({ id, text: text.slice(0, 220), parent: typeof parent === 'string' ? parent : '' })));
      }
    }
  } catch { /* Local storage may be blocked. The session still works. */ }
  return state;
}

function persist(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      liked: [...state.liked],
      posts: state.ownPosts.map(({ id, text, date, photo }) => ({ id, text, date, photo: photo?.[0] })),
      comments: Object.fromEntries(state.comments),
    }));
    return true;
  } catch { return false; }
}

function removeOwnPost(state, id) {
  state.ownPosts = state.ownPosts.filter((post) => post.id !== id);
  state.liked.delete(id);
  state.comments.delete(id);
}

function setLike(state, id, liked) {
  if (liked) state.liked.add(id);
  else state.liked.delete(id);
}

function storedPostExists(state, id) {
  return posts.some((post) => post.id === id) || state.ownPosts.some((post) => post.id === id);
}

function commentsFor(post, state) {
  const seeded = post.comments.map(([author, text, replies = []], index) => ({
    id: `seed-${index}`, author, text, replies: replies.map(([author, text]) => ({ author, text })),
  }));
  for (const local of state.comments.get(post.id) || []) {
    const parent = seeded.find(({ id }) => id === local.parent);
    const comment = { ...local, author: 'you', replies: [] };
    if (parent) parent.replies.push(comment);
    else seeded.push(comment);
  }
  return seeded;
}

function threadSize(comments) {
  return comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
}

function commentContent(comment) {
  return `${avatar(people[comment.author], 'small')}<div class="pace-comment-copy">${profileButton(comment.author)}<p${comment.id?.startsWith('local-') ? ' data-no-translate' : ''}>${html(comment.text)}</p></div>`;
}

function discussionMarkup(post, state) {
  const comments = commentsFor(post, state);
  return `<ol class="pace-comment-list">${comments.map((comment) => `<li><div class="pace-comment">${commentContent(comment)}</div>
      <button class="pace-reply" type="button" data-pace-reply="${comment.id}" aria-label="Reply to ${people[comment.author].name}">Reply</button>
      ${comment.replies.length ? `<ol class="pace-thread">${comment.replies.map((reply) => `<li class="pace-comment">${commentContent(reply)}</li>`).join('')}</ol>` : ''}
    </li>`).join('')}</ol>
    <form class="pace-comment-form">
      ${avatar(people.you, 'small')}
      <div><p class="pace-reply-target" hidden><span></span> <button type="button" data-pace-cancel-reply>Cancel</button></p>
      <label class="sr-only" for="pace-comment-${post.id}">Write a comment on ${post.author === 'you' ? 'your' : `${people[post.author].name}’s`} post</label>
      <input type="text" id="pace-comment-${post.id}" name="comment" maxlength="220" placeholder="Write a comment…" required></div>
      <button class="pace-button pace-comment-submit" type="submit">Comment</button>
    </form>`;
}

function postMarkup(post, state, expanded) {
  const person = people[post.author];
  const liked = state.liked.has(post.id);
  const commentCount = threadSize(commentsFor(post, state));
  const picture = post.photo ? `<button class="pace-photo" type="button" data-pace-photo="${post.photo[0]}" aria-label="Enlarge photo shared by ${person.name}">
      <img src="./media/pacebook/${post.photo[0]}.webp" alt="${html(post.photo[1])}" ${post.id === 'ridge-road' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    </button>` : '';
  return `<article class="pace-post" data-pace-post="${post.id}" aria-labelledby="pace-author-${post.id}">
    <header class="pace-post-meta">${avatar(person)}
      <div><h3 id="pace-author-${post.id}">${profileButton(post.author)}</h3>
      <p><time datetime="${html(post.date)}">${post.author === 'you' ? 'Posted on this device' : dateFormat.format(new Date(post.date))}</time>${post.clock ? ` · ${post.clock}` : ''}${post.place ? ` · ${post.place}` : ''}</p></div>
      ${post.author === 'you' ? '<button class="pace-delete-action" type="button" aria-haspopup="dialog" data-pace-delete>Delete</button>' : ''}
    </header>
    ${post.text ? `<p class="pace-post-text" ${post.author === 'you' ? 'data-no-translate' : ''}>${html(post.text)}</p>` : ''}
    ${picture}
    ${post.poster ? `<p class="pace-post-link">${posterLink}</p>` : ''}
    <div class="pace-post-actions">
      <button class="pace-text-button pace-like" type="button" aria-pressed="${liked}" data-pace-like><span aria-hidden="true">${liked ? '♥' : '♡'}</span> Like</button>
      <button class="pace-text-button" type="button" data-pace-comments aria-controls="pace-thread-${post.id}" aria-expanded="${expanded}">Comments <span class="pace-comment-count">${commentCount}</span></button>
      <span class="pace-like-count" data-i18n-message="pace.likes" data-i18n-params='{"count":${post.likes + Number(liked)}}'>${formatMessage('pace.likes',{count:post.likes+Number(liked)})}</span>
    </div>
    <section class="pace-discussion" id="pace-thread-${post.id}" aria-label="Discussion" ${expanded ? '' : 'hidden'}>${expanded ? discussionMarkup(post, state) : ''}</section>
  </article>`;
}

export function createPacebook() {
  const state = loadState();
  const expanded = new Set(['ridge-road', 'first-orion']);
  let filter = 'all';
  let query = '';

  function allPosts() { return [...state.ownPosts, ...posts]; }

  function listMarkup() {
    const match = query.trim().toLowerCase();
    const visible = allPosts().filter((post) =>
      (filter !== 'photo' || post.photo) && (filter !== 'mine' || post.author === 'you') &&
      (!match || `${people[post.author].name} ${post.text} ${translateText(post.text, 'ko')} ${post.photo?.[1] || ''}`.toLowerCase().includes(match)));
    return visible.length ? visible.map((post) => postMarkup(post, state, expanded.has(post.id))).join('')
      : '<p class="pace-empty">No posts match. Try another search or share an update.</p>';
  }

  function markup() {
    const friends = Object.entries(people).filter(([key]) => key !== 'you');
    return `<div class="pacebook" lang="en">
      <header class="pace-bar"><div class="pace-bar-inner">
        <button class="pace-wordmark" type="button" data-pace-filter="all" aria-label="Pacebook home"><span aria-hidden="true">✦</span> Pacebook</button>
        <label class="pace-search"><span class="sr-only">Search posts and people</span><input type="search" value="${html(query)}" placeholder="Search posts and people" data-pace-search></label>
        <button class="pace-account" type="button" data-pace-filter="mine">${avatar(people.you, 'small')} <span>You</span></button>
      </div></header>
      <div class="pace-layout">
        <aside class="pace-left" aria-label="Feed navigation">
          <div class="pace-profile">${avatar(people.you)}<strong>You</strong></div>
          <nav class="pace-side-nav" aria-label="Your feed">
            <button type="button" data-pace-filter="all">News Feed</button>
            <button type="button" data-pace-filter="mine">My posts</button>
            ${posterLink}
          </nav>
          <p class="pace-local">Your posts and reactions are saved in this browser.</p>
        </aside>
        <section class="pace-feed" aria-labelledby="pace-feed-title">
          <header class="pace-feed-head"><h2 id="pace-feed-title">News Feed</h2><div class="pace-filters" aria-label="Filter posts">
            ${Object.entries(filters).map(([key, label]) => `<button class="pace-text-button" type="button" data-pace-filter="${key}" aria-pressed="${filter === key}">${label}</button>`).join('')}
          </div></header>
          <form class="pace-composer">
            <label for="pace-status">Share an update</label>
            <textarea id="pace-status" name="status" rows="2" maxlength="420" placeholder="What’s new?"></textarea>
            <div class="pace-composer-foot">
              <label class="pace-attachment"><span class="sr-only">Attach an exhibit photo</span>
                <select name="photo"><option value="">Attach a photo</option>${[...photoCatalog].map(([key, value]) => `<option value="${key}">${html(value[2] || value[1])}</option>`).join('')}</select>
              </label>
              <button class="pace-button" type="submit">Post</button>
            </div>
            <p class="pace-compose-error" role="status"></p>
          </form>
          <p class="sr-only pace-feedback" role="status"></p>
          <div class="pace-story-list">${listMarkup()}</div>
        </section>
        <aside class="pace-right" aria-label="Friends and photo credits">
          <section class="pace-side-box"><h2>Friends</h2><ul class="pace-friends">${friends.map(([id, friend]) =>
            `<li><button type="button" data-pace-person="${id}">${avatar(friend, 'small')} <span>${friend.name}</span></button></li>`).join('')}</ul></section>
          <p class="pace-credit">Fictional profiles and posts · ${photoCreditsLink}</p>
        </aside>
      </div>
      <dialog class="pace-lightbox" aria-labelledby="pace-lightbox-title">
        <header><h2 id="pace-lightbox-title">Shared photo</h2><button type="button" aria-label="Close photo" data-pace-close>×</button></header>
        <img alt=""><div class="pace-lightbox-credit"><p></p>${photoCreditsLink}</div>
      </dialog>
      <dialog class="pace-delete-dialog" aria-labelledby="pace-delete-title" aria-describedby="pace-delete-description">
        <form method="dialog">
          <h2 id="pace-delete-title">Delete this post?</h2>
          <p id="pace-delete-description">This removes the post and its likes and comments from this browser.</p>
          <div class="pace-delete-dialog-actions">
            <button type="submit" value="cancel" autofocus>Cancel</button>
            <button type="submit" value="delete">Delete post</button>
          </div>
        </form>
      </dialog>
    </div>`;
  }

  function init(root) {
    const list = root.querySelector('.pace-story-list');
    const search = root.querySelector('[data-pace-search]');
    const dialog = root.querySelector('.pace-lightbox');
    const deleteDialog = root.querySelector('.pace-delete-dialog');
    let photoTrigger;
    let deleteTrigger;

    function notify(message) { root.querySelector('.pace-feedback').textContent = message; }

    function renderList() {
      list.innerHTML = listMarkup();
      for (const button of root.querySelectorAll('.pace-filters [data-pace-filter]')) {
        button.setAttribute('aria-pressed', String(button.dataset.paceFilter === filter));
      }
    }

    function setFilter(next, term = '') {
      filter = next;
      query = term;
      search.value = term;
      renderList();
    }

    search.addEventListener('input', () => { query = search.value; renderList(); });

    root.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.paceFilter) {
        setFilter(button.dataset.paceFilter);
        return;
      }
      if (button.dataset.pacePerson) {
        setFilter('all', people[button.dataset.pacePerson].name);
        search.focus();
        return;
      }
      if (button.hasAttribute('data-pace-close')) {
        dialog.close();
        return;
      }
      const card = button.closest('[data-pace-post]');
      if (!card) return;
      const post = allPosts().find(({ id }) => id === card.dataset.pacePost);
      if (button.hasAttribute('data-pace-delete') && post.author === 'you') {
        deleteTrigger = button;
        deleteDialog.returnValue = '';
        deleteDialog.showModal();
      } else if (button.hasAttribute('data-pace-like')) {
        const liked = !state.liked.has(post.id);
        setLike(state, post.id, liked);
        const savedState = loadState();
        if (storedPostExists(savedState, post.id)) {
          setLike(savedState, post.id, liked);
          persist(savedState);
        }
        button.setAttribute('aria-pressed', String(liked));
        button.querySelector('span').textContent = liked ? '♥' : '♡';
        bindMessage(card.querySelector('.pace-like-count'),'pace.likes',{count:post.likes+Number(liked)});
        notify(liked ? 'Post liked.' : 'Like removed.');
      } else if (button.hasAttribute('data-pace-comments')) {
        const discussion = card.querySelector('.pace-discussion');
        const open = discussion.hidden;
        if (open) {
          expanded.add(post.id);
          if (!discussion.firstElementChild) discussion.innerHTML = discussionMarkup(post, state);
        } else expanded.delete(post.id);
        discussion.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
      } else if (button.dataset.pacePhoto) {
        photoTrigger = button;
        const [file, description, title] = post.photo;
        const image = dialog.querySelector('img');
        image.src = `./media/pacebook/${file}.webp`;
        image.alt = description;
        dialog.querySelector('p').textContent = title || description;
        dialog.showModal();
      } else if (button.dataset.paceReply) {
        const target = commentsFor(post, state).find(({ id }) => id === button.dataset.paceReply);
        const form = card.querySelector('.pace-comment-form');
        form.dataset.replyTo = target.id;
        const label = form.querySelector('.pace-reply-target');
        label.hidden = false;
        label.querySelector('span').textContent = `Replying to ${people[target.author].name}`;
        form.elements.comment.focus();
      } else if (button.hasAttribute('data-pace-cancel-reply')) {
        const form = button.closest('form');
        delete form.dataset.replyTo;
        button.closest('.pace-reply-target').hidden = true;
        form.elements.comment.focus();
      }
    });

    root.addEventListener('submit', (event) => {
      const form = event.target;
      if (!form.matches('.pace-composer, .pace-comment-form')) return;
      event.preventDefault();
      if (form.matches('.pace-composer')) {
        const text = form.elements.status.value.trim();
        const photo = photoCatalog.get(form.elements.photo.value);
        const message = form.querySelector('.pace-compose-error');
        if (!text && !photo) {
          message.textContent = 'Write an update or attach a photo before posting.';
          return;
        }
        const savedState = loadState();
        if (Math.max(state.ownPosts.length, savedState.ownPosts.length) >= 24) {
          message.textContent = 'This browser has reached the 24-post exhibit limit.';
          return;
        }
        const post = { id: `local-${crypto.randomUUID()}`, author: 'you', text, photo, date: new Date().toISOString(), likes: 0, comments: [] };
        state.ownPosts.unshift(post);
        savedState.ownPosts.unshift(post);
        persist(savedState);
        form.reset();
        message.textContent = '';
        setFilter('all');
        notify('Update posted on this device.');
        return;
      }
      const text = form.elements.comment.value.trim();
      if (!text) { notify('Write a comment before posting.'); return; }
      const card = form.closest('[data-pace-post]');
      const post = allPosts().find(({ id }) => id === card.dataset.pacePost);
      const stored = state.comments.get(post.id) || [];
      const savedState = loadState();
      const savedComments = savedState.comments.get(post.id) || [];
      if (Math.max(stored.length, savedComments.length) >= 36) { notify('This discussion has reached its local comment limit.'); return; }
      const comment = { id: `local-${crypto.randomUUID()}`, text, parent: form.dataset.replyTo || '' };
      stored.push(comment);
      state.comments.set(post.id, stored);
      if (storedPostExists(savedState, post.id)) {
        savedComments.push(comment);
        savedState.comments.set(post.id, savedComments);
        persist(savedState);
      }
      card.querySelector('.pace-comment-count').textContent = threadSize(commentsFor(post, state));
      card.querySelector('.pace-discussion').innerHTML = discussionMarkup(post, state);
      card.querySelector('.pace-comment-form input').focus();
      notify('Comment posted on this device.');
    });

    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => photoTrigger?.focus());
    deleteDialog.addEventListener('close', () => {
      const trigger = deleteTrigger;
      deleteTrigger = undefined;
      if (!trigger?.isConnected) return;
      if (deleteDialog.returnValue !== 'delete') {
        trigger.focus();
        return;
      }

      const card = trigger.closest('[data-pace-post]');
      const id = card.dataset.pacePost;
      if (!state.ownPosts.some((post) => post.id === id)) return;
      const adjacent = card.nextElementSibling || card.previousElementSibling;
      const focusTarget = adjacent?.querySelector('h3') || root.querySelector('#pace-feed-title');

      removeOwnPost(state, id);
      expanded.delete(id);
      // Preserve unrelated posts and reactions saved by another tab since this feed opened.
      const savedState = loadState();
      removeOwnPost(savedState, id);
      const saved = persist(savedState);
      card.remove();
      if (!list.firstElementChild) renderList();
      focusTarget.tabIndex = -1;
      focusTarget.focus();
      notify(saved ? 'Post deleted.' : 'Post removed for this visit. Browser storage could not be updated.');
    });
  }

  return { markup, init };
}
