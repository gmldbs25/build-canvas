# Work 7 — The Evolution of the Web

달을 관측하는 사람들이 웹에서 기록을 남기고, 서로의 관측을 비교하고, 다음 관측을 준비하는 흐름을 따라간다. 서로 다른 시기의 기록과 행사를 연결하는 노스리지 천문대는 이 작품의 가상 장소다.

인트로에는 실제 월식 사진과 짧은 소개를 두고, 시작 버튼으로 1993년 웹을 연다. 체험 중에는 상단의 연대 선택에서 일곱 장면을 자유롭게 오간다. 선택한 연도로 반투명 강조 표시가 이동하고 장면이 부드럽게 바뀐다. 동작 줄이기를 켜면 즉시 전환한다. 각 시대의 브라우저 프레임이 화면 대부분을 차지한다. 사이트 원문은 영어로 두고, 브라우저 바깥에는 짧은 한국어 안내와 도움말을 둔다. `?era=1998&page=guestbook`처럼 장면 주소로 직접 들어갈 수 있다.

## 장면

| 시대 | 웹사이트 | 방문자가 하는 일 |
| --- | --- | --- |
| 1993 · 문서 | Mosaic풍 브라우저의 초기 WWW 프로젝트와 천문대 연구 기록 | 파란 링크로 별도 서버의 관측 기록을 열고, 주소가 바뀐 것을 본 뒤 Back으로 돌아온다. |
| 1998 · 개인 홈페이지 | IE 4풍 브라우저의 The Orbit Room | 한 아마추어가 쓴 달 관측 일지를 읽고 방명록에 자기 관측을 남긴다. |
| 2001 · 키워드 검색 | Netscape 6풍 브라우저의 North Ridge Search Desk | `North Ridge public observing night`를 검색하고, 파란 링크를 하나씩 열어 천문대와 지역 동호회 문서에서 날짜와 장소를 알아낸다. |
| 2005 · 사진 커뮤니티 | Firefox 1.5풍 브라우저의 Moonstream | `lunar eclipse` 태그로 2004년 같은 개기월식의 기록을 비교하고 사진을 즐겨찾기에 저장한다. |
| 2013 · 웹앱 | Chrome 29풍 브라우저의 Fieldwork 포스터 편집기 | 달 사진을 자르고 밝기와 문구를 조절해 관측회 포스터를 만든다. 전후 비교를 하고 PNG로 내려받는다. |
| 2023 · 생성형 검색 | Google의 Search Generative Experience를 참고한 Orbit Search | 관측회가 언제 어디서 열리는지 질문한다. 로딩, 순서대로 나타나는 생성형 답변, 일반 검색 결과를 체험하고, 출처를 열어 행사 공지를 확인한다. |
| 2025–26 · AI 에이전트 | 최신 브라우저의 관측소 브리핑 및 계획 | 지역과 관심사에 맞춘 관측, ISS, 우주 연구 소식을 먼저 받는다. 근거를 열고 소식을 골라 관측 계획을 저장하거나 캘린더 파일을 내려받는다. 전시에서 하루를 넘기면 바뀐 예보와 공지가 브리핑에 나타난다. 포스터 일정 변경안을 확인하고 승인할 수 있다. |

2001년 검색과 2023년 검색은 서로 다른 시기의 행사 문서에서 정보를 찾는 동작을 같은 주제로 반복한다. 2013년 편집기에서는 2005년 사진을 사용한다. 마지막 장면에서 포스터 일정 변경을 승인하면 2013년으로 돌아가 수정 결과를 볼 수 있다. 앞 장면을 방문하지 않아도 기본 사진과 포스터로 체험할 수 있다.

브라우저의 뒤로·앞으로, 주소 입력, 새로고침, 확대, 즐겨찾기 및 해당 시대의 탭을 사용할 수 있다. 새로고침은 브라우저 프레임을 유지하고 현재 탭의 페이지 내용만 다시 그린다. 초기에는 잠시 빈 화면을 보여 준 뒤 위에서 아래로 천천히 그려지고, 최신 브라우저에서는 빠르게 갱신된다. 동작 줄이기를 켜면 즉시 다시 그린다.

2013년 탭은 Chrome 29 소스의 기울어진 탭 가장자리와 비스듬한 새 탭 버튼 실루엣을 바탕으로 단순화했다. 2023년 탭은 Chrome 113의 부드러운 이전 탭 형식을, 2025–26년은 Chrome 144의 선택 탭과 비활성 탭 표면 차이를 참고했다. 전시용 브라우저는 이 특징만 빌린 독자적인 형태다.

계정 없이 체험할 수 있다. AI 검색과 에이전트는 전시 자료에 기반해 동작을 재연한다. 시간 경과, 지역 예보, 지역별 통과 시각과 천문대 공지는 장면 속 자료다. 관측 계획과 포스터의 일정은 방문자가 승인했을 때 저장되며, 캘린더는 가져올 수 있는 `.ics` 파일로 제공한다.

## 참고 자료

- [CERN 초기 문서](https://info.cern.ch/hypertext/WWW/TheProject.html) · [NCSA Mosaic](https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/)
- [IE 4 화면](https://www.webdesignmuseum.org/software/internet-explorer-4-0-in-1997) · [GeoCities Gallery](https://geocities.restorativland.org/)
- [Google 검색의 초기 역사](https://www.google.com/search/howsearchworks/our-history/)
- [2005년 Flickr의 태그 탐색](https://blog.flickr.net/en/2005/08/01/the-new-new-things/) · [Firefox 1.5 릴리스 노트](https://website-archive.mozilla.org/www.mozilla.org/firefox_releasenotes/en-us/firefox/releases/1.5) · [NASA의 2004년 10월 개기월식 기록](https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2004Oct28T.pdf)
- [Flickr의 2012년 HTML5 사진 편집기](https://code.flickr.net/2012/04/18/building-an-html5-photo-editor/) · [Chrome 29 릴리스](https://chromereleases.googleblog.com/2013/08/stable-channel-update.html)
- Chromium 소스: [Chrome 29 탭 모양](https://chromium.googlesource.com/chromium/src/+/refs/tags/29.0.1547.57/chrome/browser/ui/views/tabs/tab_strip.cc) · [Chrome 29 새 탭 버튼 자산](https://chromium.googlesource.com/chromium/src/+/refs/tags/29.0.1547.57/chrome/app/theme/default_100_percent/newtab.png) · [Chrome 113 탭 스타일](https://chromium.googlesource.com/chromium/src/+/refs/tags/113.0.5672.63/chrome/browser/ui/views/tabs/tab_style_views.cc) · [Chrome 113 새 탭 버튼](https://chromium.googlesource.com/chromium/src/+/refs/tags/113.0.5672.63/chrome/browser/ui/views/tabs/new_tab_button.cc) · [Chrome 144 탭 스타일](https://chromium.googlesource.com/chromium/src/+/refs/tags/144.0.7559.59/chrome/browser/ui/views/tabs/tab_style_views.cc)
- [Google의 2023년 생성형 검색 실험](https://blog.google/products-and-platforms/products/search/generative-ai-search/)
- [2025년 ChatGPT 에이전트 공개](https://openai.com/index/introducing-chatgpt-agent/) · [2026년 Chrome auto browse](https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/) · [WebMCP 실험](https://developer.chrome.com/blog/ai-webmcp-origin-trial)

월식 사진의 촬영자와 라이선스는 작품 화면과 [사진 출처](../../projects/web-evolution/media/PHOTO-CREDITS.md)에 기록한다. 토성 픽셀 아트와 노스리지 천문대 표지는 전시용 이미지다.
