# Work 7 — The Evolution of the Web

달을 관측하는 사람들이 웹에서 기록을 남기고, 서로의 관측을 비교하고, 다음 관측을 준비하는 흐름을 따라간다. 서로 다른 시기의 기록과 행사를 연결하는 노스리지 천문대는 이 작품의 가상 장소다.

인트로에는 짧은 소개와 Mosaic, Internet Explorer, 최신 브라우저의 작은 화면을 겹쳐 배치한다. 시작 버튼으로 1993년 웹을 연다. 체험 중에는 상단의 연대 선택에서 일곱 장면을 자유롭게 오간다. 선택한 연도로 반투명 강조 표시가 이동하고 장면이 부드럽게 바뀐다. 동작 줄이기를 켜면 즉시 전환한다. 각 시대의 브라우저 프레임이 화면 대부분을 차지한다. 사이트 원문은 영어로 두고, 브라우저 바깥에는 짧은 한국어 안내를 둔다. `?era=1998&page=guestbook`처럼 장면 주소로 직접 들어갈 수 있다.

인트로의 시작 버튼과 체험 화면의 연대 선택에 은은한 반투명 효과를 적용한다. 체험 화면 전체에 같은 단색 바탕을 쓰고, 상단의 연대 선택 아래에 시대별 브라우저를 배치한다. 연대 선택과 강조 표시는 직선 변이 보이는 둥근 직사각형으로 만들고, 어두운 바탕과 밝은 글자로 작은 화면에서도 연도를 읽기 쉽게 한다. [Apple Human Interface Guidelines · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

## 장면

| 시대 | 웹사이트 | 방문자가 하는 일 |
| --- | --- | --- |
| 1993 · 문서 | Mosaic풍 브라우저의 WWW 프로젝트와 천문 연구 자료 | 주제별 색인에서 관측 일지, 기기·보정 기록, 자료 처리 메모와 목록을 찾아 읽고, 다른 관측소가 발행한 기술 교신을 연다. |
| 1998 · 개인 홈페이지 | IE 4풍 브라우저의 The Orbit Room | 웹마스터가 쓴 HTML 제작 노트와 관측 일지, 웹링을 둘러보고 방명록에 글을 남긴다. |
| 2001 · 키워드 검색 | Netscape 6풍 브라우저에서 초기 Google을 참고해 구성한 웹 검색 | `lunar eclipse` 같은 키워드를 입력하고, 검색 결과가 차례로 뜨면 천문 자료를 하나씩 연다. |
| 2005 · 태그 탐색 | Firefox 1.5풍 브라우저의 Moonstream | `lunar eclipse` 태그를 열어 여러 촬영자가 남긴 2004년 10월 개기월식 사진을 비교하고 즐겨찾기에 저장한다. |
| 2013 · 친구의 뉴스피드 | Chrome 29풍 브라우저의 소셜 네트워크 Pacebook | 친구들의 일상 소식 사이에서 관측 사진을 발견한다. 사진을 크게 열거나 좋아요와 댓글을 남기고, 자신의 글을 올리거나 삭제할 수 있다. |
| 2023 · 생성형 검색 | Google의 Search Generative Experience를 참고한 Orbit Search | 기본 검색어 `제임스 웹 망원경`을 제출하면 요약 뒤에 NASA 이미지와 웹 결과가 나타난다. 다른 천문 주제도 공개 자료를 조회하고, 전시의 관측회 질문은 역사 체험용 행사 공지로 연결한다. |
| 2026 · AI 에이전트 | 최신 브라우저의 천문 모니터와 관측 계획 | 에이전트가 화면을 열면 저장된 관심사별로 공개 출처를 확인한다. 브리핑이 준비되는 동안 한 자리에서 별 모양이 바뀌고 옆에 `Thinking…`이 표시된다. 답변이 한 문구씩 나타나며 다음 작업을 제안한다. 관측 시나리오에서 하루를 넘겨 바뀐 예보와 공지를 확인하고, 계획을 저장하거나 캘린더를 내려받고 포스터 일정 변경안을 승인할 수 있다. |

2001년 검색은 전시용 천문 자료 색인에서 키워드가 일치하는 웹페이지를 찾는다. 결과가 도착해 페이지에 차례로 나타나는 연출은 초기 웹 접속 환경에서의 기다림을 재연한다. 2023년 검색에서는 생성형 답변을 읽고 아래에 나열된 출처를 확인한다. 별도로 열 수 있는 2013년 Fieldwork 편집기에서는 2005년 사진을 사용한다. 마지막 장면에서 포스터 일정 변경을 승인하면 `?era=2013&page=poster`에서 수정 결과를 볼 수 있다.

Moonstream은 사용자가 붙인 공개 태그가 서로 다른 사람의 사진을 한곳에 모으는 방식을 보여 준다. Flickr와 초기 SNS는 비슷한 시기에 성장했다. Work 7은 태그를 따라 관심사를 탐색하는 방식과 친구들의 새 소식이 한 피드에 모이는 방식을 각각 보여 준다. [Flickr의 2005년 태그 탐색](https://blog.flickr.net/en/2005/08/01/the-new-new-things/) · [초기 SNS 역사 연구](https://doi.org/10.1111/j.1083-6101.2007.00393.x)

2013년 페이스북은 친구들이 공유하는 이야기에 더 큰 사진을 배치하고 사진 등 특정 유형으로 피드를 볼 수 있게 했다. 그해 말 월간 활성 이용자는 12억 3천만 명이었다. 2013년 페르세우스자리 유성우 사진을 페이스북에 공유한 EarthSky 독자 사례는 당시에도 이와 같은 교류가 있었음을 보여 준다. Pacebook은 시대의 피드 구조와 상호작용을 바탕으로 만든 가상 소셜 네트워크다. 게시물은 가상의 개인 이야기이며, 역사 사진은 출처를 표시한다. 방문자가 남긴 활동은 브라우저에 저장한다. [Facebook의 2013년 News Feed 발표](https://about.fb.com/news/2013/03/a-new-look-for-news-feed/) · [Facebook 2013년 실적](https://about.fb.com/news/2014/01/facebook-reports-fourth-quarter-and-full-year-2013-results/) · [EarthSky 독자의 유성우 사진](https://earthsky.org/22minute/perseid-meteor-flying-over-texas/)

브라우저의 뒤로·앞으로, 주소 입력, 새로고침, 확대, 즐겨찾기 및 해당 시대의 탭을 사용할 수 있다. 새로고침은 브라우저 프레임을 유지하고 현재 탭의 페이지 내용만 다시 그린다. 초기에는 잠시 빈 화면을 보여 준 뒤 위에서 아래로 천천히 그려지고, 최신 브라우저에서는 빠르게 갱신된다. 동작 줄이기를 켜면 즉시 다시 그린다.

2013년 탭은 Chrome 29 소스의 기울어진 탭 가장자리와 비스듬한 새 탭 버튼 실루엣을 바탕으로 단순화했다. 2023년 탭은 Chrome 113의 부드러운 이전 탭 형식을, 2026년은 Chrome 144의 선택 탭과 비활성 탭 표면 차이를 참고했다. 전시용 브라우저는 이 특징만 빌린 독자적인 형태다.

계정 없이 체험할 수 있다. 2023년 AI 검색은 제출한 천문 주제를 공개 검색 API에 조회하고, 돌아온 자료를 바탕으로 규칙에 따라 요약 문구를 구성한다. 에이전트의 천문 모니터는 브라우저의 현재 시각을 표시하고, 화면을 열면 저장된 관심사별로 NASA 기사와 대표 지역의 기상 모델 데이터를 가져온다. 브리핑은 확인한 문서 제목, 기상 모델 값, 처리 결과를 사용해 구성하며, 새 자료 확인과 관측 시나리오 열기를 제안한다. 각 출처의 게시 또는 예측 시각과 조회 시각이 표시되고, 화면을 열어 둔 동안 새 자료를 주기적으로 확인한다. [NASA 공개 API](https://api.nasa.gov/) · [Spaceflight News API](https://www.spaceflightnewsapi.net/) · [Open-Meteo](https://open-meteo.com/)

별도의 관측 시나리오는 전시용 지역 예보, ISS 통과 시각, 천문대 공지와 날짜를 사용한다. 관측 계획과 포스터의 일정은 방문자가 승인했을 때 저장되며, 캘린더는 가져올 수 있는 `.ics` 파일로 제공한다.

## 참고 자료

- [CERN 초기 문서](https://info.cern.ch/hypertext/WWW/TheProject.html) · [NCSA Mosaic](https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/)
- [IE 4 화면](https://www.webdesignmuseum.org/software/internet-explorer-4-0-in-1997) · [GeoCities Gallery](https://geocities.restorativland.org/) · [The Web as History의 GeoCities 연구](https://pure.au.dk/ws/files/111004966/The_Web_as_History.pdf) · [APOD의 1997년 기념 페이지](https://apod.nasa.gov/apod/ap970616.html)
- [Google 검색의 초기 역사](https://www.google.com/search/howsearchworks/our-history/) · [2000년 Yahoo의 Google 검색 채택 발표](https://googlepress.blogspot.com/2000/06/yahoo-selects-google-as-its-default.html) · [NASA 월식 목록 2001–2010](https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2001.html)
- [2005년 Flickr의 태그 탐색](https://blog.flickr.net/en/2005/08/01/the-new-new-things/) · [Firefox 1.5 릴리스 노트](https://website-archive.mozilla.org/www.mozilla.org/firefox_releasenotes/en-us/firefox/releases/1.5) · [NASA의 2004년 10월 개기월식 기록](https://eclipse.gsfc.nasa.gov/LEplot/LEplot2001/LE2004Oct28T.pdf)
- [Flickr의 2012년 HTML5 사진 편집기](https://code.flickr.net/2012/04/18/building-an-html5-photo-editor/) · [Chrome 29 릴리스](https://chromereleases.googleblog.com/2013/08/stable-channel-update.html)
- Chromium 소스: [Chrome 29 탭 모양](https://chromium.googlesource.com/chromium/src/+/refs/tags/29.0.1547.57/chrome/browser/ui/views/tabs/tab_strip.cc) · [Chrome 29 새 탭 버튼 자산](https://chromium.googlesource.com/chromium/src/+/refs/tags/29.0.1547.57/chrome/app/theme/default_100_percent/newtab.png) · [Chrome 113 탭 스타일](https://chromium.googlesource.com/chromium/src/+/refs/tags/113.0.5672.63/chrome/browser/ui/views/tabs/tab_style_views.cc) · [Chrome 113 새 탭 버튼](https://chromium.googlesource.com/chromium/src/+/refs/tags/113.0.5672.63/chrome/browser/ui/views/tabs/new_tab_button.cc) · [Chrome 144 탭 스타일](https://chromium.googlesource.com/chromium/src/+/refs/tags/144.0.7559.59/chrome/browser/ui/views/tabs/tab_style_views.cc)
- [Google의 2023년 생성형 검색 실험](https://blog.google/products-and-platforms/products/search/generative-ai-search/)
- [2025년 ChatGPT 에이전트 공개](https://openai.com/index/introducing-chatgpt-agent/) · [2026년 Chrome auto browse](https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/) · [WebMCP 실험](https://developer.chrome.com/blog/ai-webmcp-origin-trial)
- [Anthropic의 Claude Design 데모에 나온 한 자리 상태 표시](https://www.youtube.com/watch?v=t_LBECIQQqs&t=42s)

월식과 Pacebook 사진의 촬영자 및 라이선스는 작품 화면과 출처 목록에 기록한다. 토성 픽셀 아트와 노스리지 천문대 표지는 전시용 이미지다. [월식 사진 출처](../../projects/web-evolution/media/PHOTO-CREDITS.md) · [Pacebook 사진 출처](../../projects/web-evolution/media/pacebook/CREDITS.md)
