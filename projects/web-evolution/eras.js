export const eras = {
  1993: {
    caption: 'NCSA Mosaic · X Window System',
    hint: '파란 North Ridge Observatory lunar log 링크를 눌러 다른 서버의 관측 기록을 여세요.',
    notes: 'Mosaic은 월드 와이드 웹 프로젝트 문서를 읽고 다른 서버의 기록으로 이동하는 경험을 보여 줍니다. North Ridge Observatory와 관측 기록은 이 전시를 위해 만든 가상 자료입니다.',
    sources: [
      ['CERN · World Wide Web', 'https://info.cern.ch/hypertext/WWW/TheProject.html'],
      ['NCSA · Mosaic', 'https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/'],
      ['CERN · A Little History of the World Wide Web', 'https://www.w3.org/History.html'],
    ],
    base: 'http://info.cern.ch/hypertext/WWW/',
    pages: {
      home: ['World Wide Web', 'TheProject.html'],
      directory: ['What’s out there?', 'DataSources/Top.html'],
      guide: ['How does a link work?', 'WhatIs.html'],
      people: ['People behind the Web', 'People.html'],
      history: ['A short history', 'History.html'],
      memo: ['Lunar observing log · North Ridge Observatory', 'http://observatory.northridge.example/logs/moon/1993-10-23.html'],
    },
  },
  1998: {
    caption: 'Internet Explorer 4 · Windows 98',
    hint: 'Guestbook(방명록)을 눌러 이 홈페이지에 한 줄을 남겨 보세요.',
    notes: 'GeoCities에서는 관심사에 따라 동네를 골라 홈페이지를 만들었습니다. SF를 좋아하는 사람은 Area51에 자리를 잡고, 방명록을 통해 방문자를 만날 수 있었습니다.',
    sources: [
      ['Web Design Museum · GeoCities', 'https://www.webdesignmuseum.org/all-websites/geocities-1998'],
      ['Web Design Museum · Internet Explorer 4', 'https://www.webdesignmuseum.org/software/internet-explorer-4-0-in-1997'],
      ['Restorativland · GeoCities Gallery', 'https://geocities.restorativland.org/'],
      ['Internet Archive · GifCities', 'https://gifcities.org/'],
    ],
    base: 'http://www.geocities.com/Area51/2408/',
    pages: {
      home: ['The Orbit Room', 'index.html'],
      guestbook: ['Guestbook', 'guestbook.html'],
      links: ['Space Links', 'links.html'],
    },
  },
  2001: {
    caption: 'Netscape Navigator 6 · North Ridge Search Desk',
    hint: '검색창에 North Ridge public observing night을 입력하고 검색 결과 두 곳을 열어 보세요.',
    notes: '검색 포털이 웹사이트의 제목과 짧은 요약을 나열하던 시기의 화면을 새로 구성했습니다. North Ridge Search Desk와 2001년 행사 자료는 전시를 위해 만든 가상 사이트입니다.',
    sources: [
      ['Web Design Museum · AltaVista in 2001', 'https://www.webdesignmuseum.org/gallery/altavista-2001'],
      ['Web Design Museum · Netscape 6.0', 'https://www.webdesignmuseum.org/software/netscape-6-0-in-2000'],
      ['Wired · Search in 2001', 'https://www.wired.com/2001/08/relevant-info-on-search-engines'],
    ],
    base: 'http://search.northridge.example/',
    pages: {
      home: ['North Ridge Search Desk', 'index.html'],
      results: ['Search results · North Ridge Search Desk', 'search'],
      bulletin: ['Observing Night bulletin · North Ridge Observatory', 'http://www.northridge.example/observatory/bulletins/2001-10-13.html'],
      club: ['North Ridge Astronomy Club · Public nights', 'http://www.northridgeastro.example/events/2001-calendar.html'],
    },
  },
  2005: {
    caption: 'Firefox 1.5 · Moonstream photo community',
    notes: '2005년 Flickr 사진 커뮤니티를 바탕으로 만든 Moonstream입니다. 세 장의 사진은 실제 2004년 10월 28일 개기월식 사진이며, 상세 화면에서 촬영자와 라이선스를 확인할 수 있습니다.',
    hint: '사진을 열고 lunar eclipse 태그를 누른 뒤 촬영자별 사진을 살펴보세요.',
    sources: [
      ['Flickr · The New New Things (1 Aug 2005)', 'https://blog.flickr.net/en/2005/08/01/the-new-new-things/'],
      ['Mozilla · Firefox 1.5 release notes', 'https://www.mozilla.org/en-US/firefox/releases/1.5.html'],
    ],
    base: 'http://moonstream.example/',
    pages: {
      home: ['Your photostream', '/photos/moonstream/'],
      photo: ['Lunar eclipse at Prishtina Observatory', '/photos/moonstream/legacy-harbor/'],
      roof: ['Blood Moon through a Dobsonian', '/photos/moonstream/legacy-roof/'],
      desert: ['Eclipsed Moon over Paranal', '/photos/moonstream/legacy-desert/'],
      'eclipse-a': ['A copper-red lunar eclipse', '/photos/moonstream/2004-eclipse-a/'],
      'eclipse-b': ['Stages of a lunar eclipse', '/photos/moonstream/2004-eclipse-b/'],
      'eclipse-c': ['Partial eclipse sequence', '/photos/moonstream/2004-eclipse-c/'],
      moon: ['Photos tagged “lunar eclipse”', '/photos/tags/moon/'],
      sets: ['Sets · Lunar eclipses', '/photos/moonstream/sets/lunar-eclipses/'],
      favorites: ['Favorites', '/photos/moonstream/favorites/'],
    },
  },
  2013: {
    caption: 'Chrome 29 · Desktop',
    hint: '포스터의 사진을 옮기고 제목과 행사 정보를 편집한 뒤 PNG로 저장해 보세요.',
    notes: '2010년에 출시된 HTML5 사진 편집기는 Flickr 안에 간단한 자르기·보정 도구를 넣었습니다. 이 장면은 2013년 브라우저에서 이미지를 움직이고 밝기를 조정해 포스터 결과물을 저장하는 과정을 전시용으로 재구성합니다.',
    sources: [
      ['Google · Chrome 29', 'https://chromereleases.googleblog.com/2013/08/stable-channel-update.html'],
      ['Flickr Engineering · Building an HTML5 Photo Editor (2012)', 'https://code.flickr.net/2012/04/18/building-an-html5-photo-editor/'],
    ],
    base: 'https://fieldwork.example/',
    pages: { home: ['Observing Night poster · Fieldwork', 'b/observing-night-poster'] },
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
      <p>This is the maintained entry for the World Wide Web project. Follow its links to learn how documents work, then visit a separate observatory server for a dated lunar record.</p>
      <p>${link(1993, 'memo', 'North Ridge Observatory lunar observing log')} — an example of a research note kept at its own address.</p>
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
        <li><strong>Astronomy</strong> — ${link(1993, 'memo', 'North Ridge Observatory’s dated lunar observing log')} is kept on a separate server.</li>
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
    memo: `
      <h2>Lunar observing log</h2>
      <p><em>North Ridge Observatory · 23 October 1993 · West Terrace</em></p>
      <p>At 21:10 local time the bright Moon cleared the eastern roofline. Thin cloud softened its northern limb for several minutes; Mare Imbrium and the bright rim of Copernicus remained easy to pick out at low power.</p>
      <p><strong>Observer’s note:</strong> keep this entry at the observatory’s own address and link to it from the maintained World Wide Web project page. A reader can follow the link here, then use the browser’s Back command to return to the directory.</p>
      <ul><li>Target: lunar surface near Mare Imbrium.</li><li>Instrument: 90 mm refractor, 40×.</li><li>Conditions: thin cloud, steady intervals; handwritten field sheet filed in the west room.</li></ul>
      <p>This fictional North Ridge record is served from <code>observatory.northridge.example</code>, a different simulated host. Return to the ${link(1993, 'home', 'World Wide Web project entry')} or browse the ${link(1993, 'directory', 'subject directory')}.</p>`,
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
      <div class="orbit-diary"><strong>Alex’s moon diary · November 21, 1998</strong><p>Clouds opened for ten minutes tonight. Through my small telescope I could see a sharp line of shadow along the cratered edge. I used the Moon chart I picked up at North Ridge Observatory, and I’m keeping these notes here so we can compare what we saw.</p></div>
      ${nav}
      <div class="visitor"><span>You are visitor no.</span> <strong>001287</strong></div>
      <p class="orbit-discovery">Seen the Moon tonight? <span>☆</span> Tell me what it looked like in the ${link(1998, 'guestbook', 'guestbook')} or check the ${link(1998, 'links', 'space links')}.</p>
      <p class="orbit-footer">Last updated November 21, 1998 <span aria-hidden="true">★</span> Area51 neighborhood</p>`,
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
        <li><a href="https://www.space.com/" target="_blank" rel="noopener">Space.com</a> — news from the neighborhood</li>
        <li>${link(1998, 'guestbook', 'Know a good site? Tell me in the guestbook!')}</li>
      </ul>
      <p class="orbit-footer">NASA, APOD and Space.com open in your current browser. <span>✦</span> Found a broken link? ${link(1998, 'guestbook', 'sign my guestbook')}.</p>`,
  };
  return `<article class="orbit-page">${pages[page]}</article>`;
}
