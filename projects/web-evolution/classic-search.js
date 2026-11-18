const DEFAULT_QUERY = 'North Ridge public observing night';
const eventDate = 'Saturday, October 13, 2001';
const eventTime = '8:00 p.m.';
const eventPlace = 'West Terrace, North Ridge Observatory';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function internalLink(page, label, className = '') {
  return `<a href="?era=2001&amp;page=${page}" data-page="${page}"${className ? ` class="${className}"` : ''}>${label}</a>`;
}

function searchForm(query, searchId = 'classic-search-query') {
  return `<form class="classic-search-form" role="search">
    <label class="sr-only" for="${searchId}">Search North Ridge Search Desk</label>
    <input id="${searchId}" name="query" type="text" value="${escapeHtml(query)}" maxlength="120" autocomplete="off">
    <button type="submit">Search</button>
  </form>`;
}

export function createClassicSearch() {
  let query = DEFAULT_QUERY;
  let currentPage = 'home';

  function markup(page) {
    currentPage = page;
    if (page === 'results') {
      const hasMatch = /north\s+ridge/i.test(query) && /observ|night/i.test(query);
      return `<article class="classic-search-page classic-results">
        <header class="classic-results-header">
          ${internalLink('home', '<span class="classic-logo-small">North Ridge <b>Search Desk</b></span>', 'classic-brand')}
          ${searchForm(query, 'classic-results-query')}
          <span class="classic-results-count">${hasMatch ? '2 results' : '0 results'}</span>
        </header>
        ${hasMatch ? `<section class="classic-result-list" aria-label="Search results">
          <article class="classic-result">
          <span class="classic-result-url">www.northridge.example/observatory/bulletins/</span>
            ${internalLink('bulletin', 'Observing Night Bulletin — North Ridge Observatory')}
            <p>The Observatory Bulletin announces a public program in mid-October. Meet volunteers on the West Terrace; consult the bulletin for the event details.</p>
          </article>
          <article class="classic-result">
            <span class="classic-result-url">www.northridgeastro.example/events/</span>
            ${internalLink('club', 'Public observing nights — North Ridge Astronomy Club')}
            <p>The club’s fall calendar lists a public lunar-viewing night and a telescope setup for members.</p>
          </article>
        </section>` : `<div class="classic-no-results"><strong>No matching pages found.</strong><p>Try “North Ridge public observing night”.</p></div>`}
        <footer class="classic-search-footer">North Ridge Search Desk · archive index updated 12 October 2001</footer>
      </article>`;
    }

    if (page === 'bulletin') {
      return `<article class="classic-search-page classic-document">
        <div class="classic-document-top">North Ridge Observatory <span>Events &amp; Public Programs</span></div>
        <p class="classic-breadcrumb">${internalLink('home', 'North Ridge Search Desk')} / ${internalLink('results', 'Search results')}</p>
        <h2>Observing Night Bulletin</h2>
        <p class="classic-document-date">Published 8 October 2001 · North Ridge Observatory</p>
        <hr>
        <p><strong>${eventDate}</strong></p>
        <p>Public observing begins at <strong>${eventTime}</strong> on the <strong>West Terrace at North Ridge Observatory</strong>.</p>
        <p>Enter at the north gate on Ridge Road. Bring a warm coat; a volunteer will have a telescope trained on the Moon after dusk.</p>
        <p>In case of heavy cloud, the program moves to the indoor lecture room. Call the observatory desk after 6 p.m. for a recorded update.</p>
        <hr>
        <p class="classic-related">Related page: ${internalLink('club', 'North Ridge Astronomy Club calendar')}</p>
        <address>North Ridge Observatory · Ridge Road · Public Information Office</address>
      </article>`;
    }

    if (page === 'club') {
      return `<article class="classic-search-page classic-document">
        <div class="classic-document-top">North Ridge Astronomy Club <span>Members &amp; Community</span></div>
        <p class="classic-breadcrumb">${internalLink('home', 'North Ridge Search Desk')} / ${internalLink('results', 'Search results')}</p>
        <h2>Public Observing Nights</h2>
        <p class="classic-document-date">Club calendar · October 2001</p>
        <hr>
        <table class="classic-event-table"><tbody>
          <tr><th>Date</th><td>${eventDate}</td></tr>
          <tr><th>Time</th><td>${eventTime}</td></tr>
          <tr><th>Place</th><td>${eventPlace}, Ridge Road</td></tr>
          <tr><th>Program</th><td>Moon craters, Saturn and telescope setup for new members</td></tr>
        </tbody></table>
        <p>Visitors are welcome. The club brings a 6-inch reflector and a small refractor for the public viewing line.</p>
        <p>Meet at the north gate ten minutes before the program starts. Cloud updates are posted on the observatory bulletin page.</p>
        <p class="classic-related">${internalLink('bulletin', 'Read the observatory bulletin')}</p>
        <address>North Ridge Astronomy Club · October 2001 Calendar</address>
      </article>`;
    }

    return `<article class="classic-search-page classic-home">
      <div class="classic-home-nav"><span>Web</span><a href="#directory">Directory</a><a href="#help">Help</a><a href="#about">About</a></div>
      <section class="classic-search-center">
        <div class="classic-wordmark" aria-label="North Ridge Search Desk"><span class="classic-spark" aria-hidden="true">✦</span><span>North Ridge</span><b>Search Desk</b></div>
        <p>Find a page on the North Ridge web.</p>
        ${searchForm(query)}
        <p class="classic-home-suggestion">Try: <button type="button" class="classic-example" data-fill-query>North Ridge public observing night</button></p>
      </section>
      <section id="directory" class="classic-directory"><h2>Browse the local index</h2><ul><li>${internalLink('bulletin', 'Observatory bulletin board')}</li><li>${internalLink('club', 'North Ridge Astronomy Club')}</li></ul></section>
      <section id="help" class="classic-secondary"><h2>Search help</h2><p>Enter a few words from the subject or title of a page, then press Search.</p></section>
      <section id="about" class="classic-secondary"><h2>About this index</h2><p>This local archive lists pages published by the observatory and astronomy club.</p></section>
      <footer class="classic-search-footer">North Ridge Search Desk · Local web index · 2001</footer>
    </article>`;
  }

  function init(root, navigate) {
    for (const form of root.querySelectorAll('.classic-search-form')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        query = form.elements.query.value.trim() || DEFAULT_QUERY;
        if (currentPage === 'results') {
          root.innerHTML = markup('results');
          init(root, navigate);
        } else navigate('results');
      });
    }
    root.querySelector('[data-fill-query]')?.addEventListener('click', () => {
      const input = root.querySelector('.classic-home .classic-search-form input[name="query"]');
      if (input) {
        input.value = DEFAULT_QUERY;
        input.focus();
      }
    });
  }

  return { markup, init };
}
