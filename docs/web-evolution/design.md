# Work 7 — The Evolution of the Web

달을 관측하는 사람들이 웹에서 기록을 남기고, 서로의 관측을 비교하고, 다음 관측을 준비하는 흐름을 따라간다. 서로 다른 시기의 기록과 행사를 연결하는 노스리지 천문대는 이 작품의 가상 장소다.

## The Observatory Archive

[아티클의 원고 원본](../../projects/web-evolution/index.html)은 브라우저가 직접 읽는 HTML이다. 가상의 노스리지 천문대를 중심으로 관측 일지를 찾고, 같은 월식을 비교하고, 바뀐 관측회 시각을 확인하는 일을 따라간다. 문서의 작성자, 발견 경로, 작업 책임이 시대마다 어떻게 바뀌는지가 글을 이끈다. 실제 역사와 전시용 인물·사례는 본문과 도판에서 구분한다.

| 장 | 본문이 풀어가는 질문 | 화면과 체험 연결 |
| --- | --- | --- |
| 표지와 프롤로그 | 오늘 밤 달을 보러 가려면 어떤 기록이 필요한가 | 겹쳐진 세 브라우저와 연도 눈금, 목차, 좁은 도입 문단. 표지에서 1993년을 열 수 있다. |
| 01 연결 | 다른 컴퓨터에 있는 자료를 어떻게 읽을까 | 세 문서의 관계를 보여 주는 자료 지도. 1989년 제안, 1990년 구현, 1993년 CERN의 공개와 Mosaic 보급을 다룬다. 1993년 도서관 링크를 연결한다. |
| 02 발견과 표현 | 찾을 자료의 주소를 모를 때 어디서 시작할까 | 1997년 9월 16일 개기월식을 소재로 한 가상 일지 하나를 이웃의 웹링과 키워드 검색으로 찾는다. 1998년 홈페이지와 2001년 검색 링크를 각각의 서술에 붙인다. |
| 03 참여와 일상 | 기록을 남기는 사람과 함께 일하는 사람의 역할이 어떻게 달라졌나 | 읽기와 발행·검색은 짧게 되짚고 공유·협업에 도판을 집중한다. 월식 사진 도판은 2004년 사진의 촬영자와 라이선스를 표시한다. 가상의 공동 일정표는 수정한 사람과 시각을 표시한다. 2005년 월식 사진은 대표 항목으로, 2013년 뉴스피드는 본문 링크로 연다. |
| 04 축적 | 공개 기록 일부가 어떻게 사용되고, 언제 현재 웹을 다시 읽을까 | 본문에서 공개 기록과 모델 학습의 역사적 관계를 먼저 읽는다. 도판은 가상의 일지 한 건을 발행 → 수집 → 선별 → 학습까지 추적한 뒤 별도의 현재 예보 조회를 보여 준다. 수집과 선별은 서로 다른 과정이고, 불러온 예보는 답변 문맥에 들어가며 모델 가중치를 바꾸지 않는다. 도판의 항목 수는 예시이며 실제 규모나 비율을 나타내지 않는다. |
| 05 지능과 행동 | 예보와 변경 공지를 본 뒤 누가 포스터를 수정할까 | 검색 결과, 출처가 붙은 답, 승인 대기 중인 수정 제안을 비교한다. 같은 예보와 공지를 사용한다. 2023년 검색 링크와 2026년 관측 계획 항목을 이 장에 배치한다. |
| 에필로그 | 다음 관측자는 어떤 기록을 남길까 | 달을 보러 나가는 장면에서 다시 1993년 문서 체험으로 연결한다. |

짙은 남색, 금색 강조, 청회색 구분선을 사용한다. 한국어 본문은 17~19px와 약 700px 읽기 폭을 기준으로 삼으며, 개념 관계를 한눈에 비교해야 하는 도판은 더 넓게 펼친다. 두 스크롤 장면은 넓고 높은 화면에서만 같은 도판을 일정 영역에 고정한다. 스크롤 위치에서 현재 본문 단계를 계산하고, 링크로 단계를 바로 열 수도 있다. 좁거나 낮은 화면에서는 각 도판이 설명 바로 뒤에 놓인다. 스크립트 초기화 없이도 본문과 도판을 모두 읽을 수 있으며, 모션 설정에 따라 정보가 달라지지 않는다.

표지와 에필로그의 시작 링크는 1993년을 연다. `?era=2005&from=participation`의 `from`은 체험 안에서 시대·페이지·탭을 바꾸어도 유지된다. “아티클로 돌아가기”와 브라우저 뒤로 가기는 읽던 스크롤 위치와 진입 링크의 포커스를 복원한다. 읽기 이력이 없는 주소는 장 앵커로, 장 정보가 없으면 프롤로그로 돌아간다. `?era=1998&page=guestbook` 같은 시점별 주소와 Build Canvas 홈으로 이동하는 H 단축키를 지원한다.

### 최종 편집

1998년 웹링과 2001년 검색 결과는 1997년 9월 16일 월식을 기록한 같은 가상의 노스리지 일지로 연결된다. Chapter 03의 개인 홈페이지 발행 예시도 같은 날짜를 쓰며, 협업 일정표의 가상 편집 이력은 2013년에 놓았다. [NASA 월식 목록](https://eclipse.gsfc.nasa.gov/LEcat5/LE1901-2000.html)의 [보존본](https://github.com/cosinekitty/astronomy/blob/master/generate/eclipse/le1901.html#L616)에서 해당 날짜와 개기월식 표기 `T`를 확인했다. NASA 원본 호스트는 환경에서 직접 열리지 않았다.

2001년 체험 색인의 2001–2010년 NASA 자료는 월식 예측표다. 2005년 Moonstream의 중심 자료는 실제 2004년 촬영 사진이다. 초기 버전의 2014년 이후 사진 세 건은 현재 공유 목록 밖의 이전 주소 및 저장된 즐겨찾기 호환용 자료다.

Chapter 04의 리드에서 사람들이 기록을 남긴 이유와 그중 일부가 학습에 쓰인 과정을 먼저 설명한다. 기술 도판의 예시와 GPT-3 논문의 실제 학습 자료는 구분한다. Astra의 집중 검수를 반영해 가상 일지를 따라가는 앞 네 단계와 현재 예보 조회를 분리하고, 조회 도판은 하나의 관측 시각에 대한 서로 다른 발행본을 비교한다. 반복하던 ID와 캡션을 줄였으며, 필요한 기술 개념은 해당 단계에 남겼다. 읽는 데 약 10분은 본문과 도판을 함께 보는 예상 시간이다. 390px 화면에서 읽기·발행의 중복 도판과 긴 캡션을 정리하면서 두 시퀀스의 세로 길이가 각각 약 27%, 13% 줄었다.

Chromium의 1440×900, 1280×720, 1160×720, 1159×720, 1440×650, 768×1024, 844×390, 390×844, 360×740에서 본문과 도판을 점검했다. 125%·150%·200% 실제 페이지 확대에서도 가로 넘침 없이 직접 지정한 단계가 보였다. 고정 도판과 인라인 도판 사이를 오갈 때는 모드 전환 전 읽던 단계나 장을 기준으로 위치를 복원한다. 1160px 전후를 오가며 이 동작을 확인했다. 1993년 문서부터 2026년 계획 승인까지 일곱 시대를 검증하고, 캘린더의 이벤트·시간대와 승인 뒤 2013년 포스터 필드를 확인했다. 외부 소스 일부는 프록시에서 차단됐으며 실시간 API 대신 전시 시나리오를 검증했다.

### 디자인 참고와 적용

| 참고 | 조사 범위와 적용 |
| --- | --- |
| [Snow Fall](https://www.nytimes.com/projects/2012/snow-fall/) · [MIT Docubase](https://docubase.mit.edu/project/snow-fall/) | 공개 페이지 접속 차단. 요구사항에 명시된 도입부와 넓은 전환 도판의 원리를 기존 브라우저 표지와 본문 밖 자료 지도에 적용했다. |
| [R2D3](https://r2d3.us/visual-intro-to-machine-learning-part-1/) | 공개 페이지 접속 차단. 설명에 따라 필요한 상태를 차례로 보여 준다는 구성 설명을 읽기·발행·공유·협업 장면에 반영했다. |
| [The Historical Cost of Light](https://pudding.cool/2020/12/lighting-cost/) | [원본 저장소](https://github.com/the-pudding/lighting-cost)의 작업 기계와 시대별 시간·루멘 상태를 코드로 확인했다. 이 작품에서는 버튼 조작을 가져오지 않고 같은 질문과 기록을 상태 사이에 유지하는 방법을 적용했다. |
| [Moon](https://ciechanow.ski/moon/) | 공개 페이지 접속 차단. 필요할 때 도식을 직접 살펴보는 원리를 단계 링크와 관측 자료의 절제된 표기에서 활용했다. |
| [Internet Artifacts](https://neal.fun/internet-artifacts/) | 공개 페이지 접속 차단. 전시 자료를 하나의 컬렉션으로 묶는 접근은 목차, 인라인 연결, 맥락 있는 대표 체험 항목으로 구현했다. |
| [Communicating with Interactive Articles](https://distill.pub/2020/communicating-with-interactive-articles/) | [저장소의 공개 산출물](https://github.com/distillpub/post--communicating-with-interactive-articles)을 Chromium에서 열어 문장과 세부 조절 시각 예시를 살펴봤다. Work 7에서는 산문과 도판을 함께 읽을 수 있게 하며 단계 직접 선택을 제공한다. |
| [Easier Scrollytelling with Position Sticky](https://pudding.cool/process/scrollytelling-sticky/) | 공개 글 접속 차단. 글을 연결한 [작성자의 사이드바 예제](https://github.com/russellsamora/scrollama/blob/main/docs/sticky-side/index.html)에서 CSS 고정 범위와 도판 상태를 분리하는 방식을 확인했다. 이 저장소는 브라우저 기능으로 구현한다. |

역사 출처는 아티클 하단에 장별로 기록한다. GPT-3 모델 카드의 학습 자료 목록, Common Crawl의 색인, 1990년 웹 구현과 웹·인터넷의 구분을 설명하는 MDN 원문을 공식 GitHub에서 직접 확인했다. CERN, W3C, NCSA, Google 등 외부 참고 링크는 클라우드 허용 목록으로 인해 직접 열람에 제한이 있었다. 연혁과 서비스 설명은 문서에 기재한 원출처를 가리키며, 접근하지 못한 내용의 실시간 확인은 주장하지 않는다.

구현 전 Astra에 원고 전문과 스토리보드를 전달했다. 1990년 공동 제안 시점과 2004년 Web 2.0 콘퍼런스·2005년 에세이를 구분하고, 월식 자료의 촬영 및 크롭 표기를 강화했다. 네 칸짜리 학습 개요를 한 기록을 추적하는 다섯 단계로 바꾸고, 검색·답변·행동이 같은 공지 변경을 어떻게 다루는지 연결했다. 모바일과 스크립트 비활성화에서 시각 자료와 설명의 순서를 보존한다.

Chromium에서 1440·1280·768·390·360px와 낮은 높이를 확인했다. 두 도판의 양방향 스크롤 및 단계 링크, 새로고침, 동작 줄이기, JavaScript 비활성화 상태를 검증했다. 일곱 시대를 열어 관측 문서, 방명록, 검색, 태그, 피드, 전시용 AI 검색을 확인했다. 2026년 관측 계획을 저장하고 캘린더 파일을 읽었으며, 승인한 날짜·시각·장소가 2013년 포스터로 이어지는 것을 확인했다. 라이브 API가 아닌 전시에 포함된 관측 시나리오를 회귀 검증에 사용했다.

체험 상단 연표의 반투명 강조 표시는 선택한 시대를 따라 움직이고 장면은 부드럽게 전환된다. 동작 줄이기를 켜면 즉시 전환한다. 각 시대의 브라우저 프레임이 화면 대부분을 차지하며, 사이트 원문은 영어로 두고 바깥에 짧은 한국어 안내를 둔다.

## 장면

| 시대 | 웹사이트 | 방문자가 하는 일 |
| --- | --- | --- |
| 1993 · 문서 | Mosaic풍 브라우저의 WWW 프로젝트와 천문 연구 자료 | 주제별 색인에서 관측 일지, 기기·보정 기록, 자료 처리 메모와 목록을 찾아 읽고, 다른 관측소가 발행한 기술 교신을 연다. |
| 1998 · 개인 홈페이지 | IE 4풍 브라우저의 The Orbit Room | 웹마스터가 쓴 HTML 제작 노트와 관측 일지, 웹링을 둘러보고 방명록에 글을 남긴다. |
| 2001 · 키워드 검색 | Netscape 6풍 브라우저에서 초기 Google을 참고해 구성한 웹 검색 | `lunar eclipse` 같은 키워드를 입력하고, 검색 결과가 차례로 뜨면 천문 자료를 하나씩 연다. |
| 2005 · 사진 공유 | Firefox 1.5풍 브라우저의 Moonstream | 아마추어 관측자들의 망원경 세팅과 관측 사진을 둘러보고, `lunar eclipse` 태그를 열어 여러 촬영자가 남긴 2004년 10월 개기월식 사진을 비교하고 즐겨찾기에 저장한다. |
| 2013 · 친구의 뉴스피드 | Chrome 29풍 브라우저의 소셜 네트워크 Pacebook | 친구들의 일상 소식 사이에서 관측 사진을 발견한다. 사진을 크게 열거나 좋아요와 댓글을 남기고, 자신의 글을 올리거나 삭제할 수 있다. |
| 2023 · 생성형 검색 | Google의 Search Generative Experience를 참고한 Orbit Search | 기본 검색어 `제임스 웹 망원경`을 제출하면 요약 뒤에 NASA 이미지와 웹 결과가 나타난다. 다른 천문 주제도 공개 자료를 조회하고, 전시의 관측회 질문은 역사 체험용 행사 공지로 연결한다. |
| 2026 · AI 에이전트 | 최신 브라우저의 천문 모니터와 관측 계획 | 에이전트가 화면을 열면 저장된 관심사별로 공개 출처를 확인한다. 브리핑이 준비되는 동안 한 자리에서 별 모양이 바뀌고 옆에 `Thinking…`이 표시된다. 답변이 한 문구씩 나타나며 다음 작업을 제안한다. 관측 시나리오에서 하루를 넘겨 바뀐 예보와 공지를 확인하고, 계획을 저장하거나 캘린더를 내려받고 포스터 일정 변경안을 승인할 수 있다. |

2001년 검색은 전시용 천문 자료 색인에서 키워드가 일치하는 웹페이지를 찾는다. 결과가 도착해 페이지에 차례로 나타나는 연출은 초기 웹 접속 환경에서의 기다림을 재연한다. 2023년 검색에서는 생성형 검색을 재현한 규칙 기반 요약을 읽고 아래에 나열된 출처를 확인한다. 별도로 열 수 있는 2013년 Fieldwork 편집기에서는 2005년 사진을 사용한다. 마지막 장면에서 포스터 일정 변경을 승인하면 `?era=2013&page=poster`에서 수정 결과를 볼 수 있다.

Moonstream의 포토스트림은 2005년 네게브의 망원경 세팅과 여러 촬영자의 2004년 개기월식 사진을 모은다. 토성, 목성, 헤일–밥 혜성, 달 분화구처럼 관측에 참고할 당시 자료도 함께 볼 수 있다. 원본 사진의 촬영자와 출처를 상세 화면에서 확인할 수 있으며, 커뮤니티와 댓글은 전시용 재구성이다. 공개 태그 탐색은 2005년 Flickr를, 관측 사진과 기관 이미지를 출처와 함께 찾아보는 구성은 Astronomy Picture of the Day의 사진 아카이브를 참고한다. Flickr와 초기 SNS는 비슷한 시기에 성장했다. Work 7은 태그를 따라 관심사를 탐색하는 방식과 친구들의 새 소식이 한 피드에 모이는 방식을 각각 보여 준다. [Flickr의 2005년 태그 탐색](https://blog.flickr.net/en/2005/08/01/the-new-new-things/) · [APOD 사진 아카이브](https://apod.nasa.gov/apod/archivepixFull.html) · [초기 SNS 역사 연구](https://doi.org/10.1111/j.1083-6101.2007.00393.x)

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
