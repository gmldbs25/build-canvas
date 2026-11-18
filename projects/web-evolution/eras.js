export const eras = {
  1993: {
    caption: 'NCSA Mosaic · X Window System',
    notes: '웹은 연구 문서를 찾고 연결하는 데서 출발했습니다. 1993년 Mosaic은 글과 이미지를 한 화면에 배치해 웹을 읽는 경험을 바꿨습니다.',
    sources: [
      ['CERN · World Wide Web', 'https://info.cern.ch/hypertext/WWW/TheProject.html'],
      ['NCSA · Mosaic', 'https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/'],
    ],
    base: 'http://info.cern.ch/hypertext/WWW/',
    pages: {
      home: ['World Wide Web', 'TheProject.html'],
      directory: ['What’s out there?', 'DataSources/Top.html'],
      guide: ['How does a link work?', 'WhatIs.html'],
      people: ['People behind the Web', 'People.html'],
      history: ['A short history', 'History.html'],
    },
  },
  1998: {
    caption: 'Internet Explorer 4 · Windows 98',
    notes: 'GeoCities에서는 관심사에 따라 동네를 골라 홈페이지를 만들었습니다. SF를 좋아하는 사람은 Area51에 자리를 잡고, 방명록을 통해 방문자를 만날 수 있었습니다.',
    sources: [
      ['Web Design Museum · GeoCities', 'https://www.webdesignmuseum.org/all-websites/geocities-1998'],
      ['Web Design Museum · Internet Explorer 4', 'https://www.webdesignmuseum.org/software/internet-explorer-4-0-in-1997'],
      ['Restorativland · GeoCities Gallery', 'https://geocities.restorativland.org/'],
    ],
    base: 'http://www.geocities.com/Area51/2408/',
    pages: {
      home: ['The Orbit Room', 'index.html'],
      guestbook: ['Guestbook', 'guestbook.html'],
      links: ['Space Links', 'links.html'],
    },
  },
  2013: {
    caption: 'Chrome 29 · Desktop',
    notes: '브라우저 안에서 문서를 읽는 데 그치지 않고, 작업을 정리하고 함께 편집할 수 있게 됐습니다. 초기 Trello처럼 카드를 옮겨 작업의 진행 상태를 바꿔 보세요.',
    sources: [
      ['Google · Chrome 29', 'https://chromereleases.googleblog.com/2013/08/stable-channel-update.html'],
      ['TidBITS · Trello in 2013', 'https://tidbits.com/2013/08/30/catching-up-with-trello/'],
    ],
    base: 'https://fieldwork.example/',
    pages: { home: ['Fieldwork – Launch board', 'b/launch'] },
  },
};

function link(era, page, label = eras[era].pages[page][0]) {
  return `<a href="?era=${era}&amp;page=${page}" data-page="${page}">${label}</a>`;
}

export function mosaicPage(page) {
  const home = link(1993, 'home', 'World Wide Web project');
  const pages = {
    home: `
      <h2>World Wide Web</h2>
      <p>The World Wide Web is a way to publish and read documents across a network.
        A document can point to another by means of a ${link(1993, 'guide', 'hypertext link')}.</p>
      <p>Start here to find information about the project and resources on the Web.</p>
      <dl>
        <dt>${link(1993, 'directory')}</dt><dd>Find information by subject or follow pointers to other servers.</dd>
        <dt>${link(1993, 'guide', 'Hypertext and HTML')}</dt><dd>How documents are linked, with an example of HTML markup.</dd>
        <dt>${link(1993, 'people')}</dt><dd>Researchers and institutions building the early Web.</dd>
        <dt>${link(1993, 'history')}</dt><dd>From a proposal at CERN to a graphical browser.</dd>
      </dl>
      <hr>
      <address>World Wide Web Project, CERN</address>`,
    directory: `
      <h2>What’s out there?</h2>
      <p>Before search engines were commonplace, people kept lists of the servers they knew about.</p>
      <ul>
        <li><strong>High-energy physics</strong> — CERN published notes and software for researchers.</li>
        <li><strong>Astronomy</strong> — observatories shared instruments, data and observing plans.</li>
        <li><strong>Computing</strong> — NCSA published browser documentation and lists of new sites.</li>
      </ul>
      <p>These pointers are examples from the early Web. To see how a pointer is written, read ${link(1993, 'guide')}.</p>
      <p>Return to the ${home}.</p>`,
    guide: `
      <h2>How does a link work?</h2>
      <p>A link is an address attached to a word or phrase. Select the text and the browser asks for the document at that address.</p>
      <pre>&lt;a href="TheProject.html"&gt;World Wide Web project&lt;/a&gt;</pre>
      <p>In a browser, that line becomes a clickable link to the ${home}.</p>
      <p>Next, ${link(1993, 'directory', 'look through the directory')}.</p>`,
    people: `
      <h2>People behind the Web</h2>
      <dl>
        <dt>Tim Berners-Lee</dt><dd>Proposed the Web at CERN and built its first browser and server.</dd>
        <dt>Robert Cailliau</dt><dd>Worked with Berners-Lee at CERN and helped promote the project.</dd>
        <dt>Marc Andreessen and Eric Bina</dt><dd>Developed the first X Window System version of Mosaic at NCSA.</dd>
      </dl>
      <p>Continue to ${link(1993, 'history', 'the timeline')} or return to the ${home}.</p>`,
    history: `
      <h2>A short history</h2>
      <dl>
        <dt>1989</dt><dd>Tim Berners-Lee proposes an information management system at CERN.</dd>
        <dt>1990</dt><dd>The first browser and Web server are running at CERN.</dd>
        <dt>1993</dt><dd>CERN makes Web software freely available. NCSA Mosaic helps bring graphical browsing to a wider audience.</dd>
      </dl>
      <p>Return to the ${home}.</p>`,
  };
  return `<article class="mosaic-page">${pages[page]}</article>`;
}

export function orbitPage(page) {
  const nav = `<nav aria-label="Orbit Room pages">${link(1998, 'home', 'Home')} <b>◆</b> ${link(1998, 'guestbook')} <b>◆</b> ${link(1998, 'links')}</nav>`;
  const pages = {
    home: `
      <h2><small>WELCOME TO</small>The Orbit Room</h2>
      <img class="saturn" src="./media/saturn.webp" alt="Pixel-art Saturn with bright rings and stars" width="156" height="102">
      <p>Hi, I’m Alex. This is my little corner of the universe!<br>Come on in and make yourself at home. :)</p>
      ${nav}
      <div class="visitor"><span>You are visitor no.</span> <strong>001287</strong></div>
      <p class="orbit-footer">Last updated October 17, 1998 <span aria-hidden="true">★</span> Area51 neighborhood</p>`,
    guestbook: `
      <h2><small>THE ORBIT ROOM</small>Guestbook</h2>
      ${nav}
      <form id="guestbook-form" class="guestbook-form">
        <label>Your name<input name="name" required maxlength="40" autocomplete="off"></label>
        <label>Message<textarea name="message" required maxlength="240" rows="2"></textarea></label>
        <button type="submit">Sign Guestbook</button>
      </form>
      <ul id="guestbook-entries" class="guestbook-entries" aria-live="polite"></ul>`,
    links: `
      <h2><small>THE ORBIT ROOM</small>Space Links</h2>
      ${nav}
      <ul class="orbit-links">
        <li><a href="https://www.nasa.gov/" target="_blank" rel="noopener">NASA</a> — mission news and pictures from space</li>
        <li><a href="https://apod.nasa.gov/apod/archivepix.html" target="_blank" rel="noopener">Astronomy Picture of the Day</a> — one picture every day</li>
        <li>${link(1998, 'guestbook', 'Know a good site? Tell me in the guestbook!')}</li>
      </ul>
      <p class="orbit-footer">NASA and APOD open in your current browser.</p>`,
  };
  return `<article class="orbit-page">${pages[page]}</article>`;
}
