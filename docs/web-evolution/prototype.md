# Work 7 — The Evolution of the Web

이 프로토타입은 세 장면을 같은 전시 화면에서 비교한다. 시대를 바꾸면 브라우저와 페이지가 함께 바뀐다. ‘페이지’ 보기는 브라우저와 바탕화면을 걷어 내고 현재 장면을 더 넓게 보여 준다. 시대를 오갈 때 문서 위치와 작업 보드 상태를 유지한다.

| 장면 | 관찰할 것 | 해 볼 것 |
| --- | --- | --- |
| 1993 · 초기 웹 | Mosaic의 문서 제목 및 주소 표시줄, 기본 서체, 밑줄 링크 | CERN 프로젝트 페이지를 바탕으로 만든 문서에서 링크를 따라가고 Back과 Forward로 이동한다. |
| 1998 · 개인 홈페이지 | IE 4 시대의 입체 테두리, 파란색 제목 표시줄, 손으로 꾸민 별무늬, 방문자 카운터 | 가상의 GeoCities 홈페이지 ‘The Orbit Room’에서 방명록에 글을 남기고 우주 관련 링크를 살펴본다. |
| 2013 · 웹앱 | Chrome 29 시대의 탭과 주소창, 앱 상단 검색창, 목록과 카드 | 가상의 ‘Fieldwork’ 보드에서 작업 카드를 추가하고 검색한다. 끌어 놓거나 카드 상세의 목록 선택으로 작업 상태를 바꾼다. |

세 화면은 해당 시대의 관습을 바탕으로 새로 제작했다. 브라우저 조작은 전시 안의 문서와 보드에서 동작한다. 방명록과 방문 횟수는 기기의 브라우저에 저장되고, 보드 편집은 현재 방문 동안 유지된다. 토성 픽셀 아트는 이 프로토타입용으로 생성했다.

## 참고 자료

- CERN의 초기 페이지에서 제목과 링크 목록의 구조를, NCSA와 Web Design Museum 자료에서 Mosaic의 외형을 참고했다. [CERN 원본](https://info.cern.ch/hypertext/WWW/TheProject.html) · [NCSA Mosaic](https://www.ncsa.illinois.edu/research/project-highlights/ncsa-mosaic/) · [Mosaic 1.0 화면](https://www.webdesignmuseum.org/software/ncsa-mosaic-1-0-in-1993)
- IE 4의 메뉴와 도구 모음, GeoCities의 동네 구조와 장식 이미지를 참고했다. [IE 4 화면](https://www.webdesignmuseum.org/software/internet-explorer-4-0-in-1997) · [1998년 GeoCities](https://www.webdesignmuseum.org/all-websites/geocities-1998) · [GeoCities Gallery](https://geocities.restorativland.org/) · [Internet Archive GifCities](https://gifcities.org/)
- Chrome 29 릴리스와 초기 Trello의 목록, 카드, 드래그 동작에서 2013년 장면의 구성을 잡았다. [Chrome 29 릴리스](https://chromereleases.googleblog.com/2013/08/stable-channel-update.html) · [2013년 Trello 사용기](https://tidbits.com/2013/08/30/catching-up-with-trello/) · [Trello 연혁](https://trello.com/en/about)

## 정식 작품 방향

링크를 따라가기, 흔적을 남기기, 작업을 옮기기처럼 시대마다 대표 행동 하나를 전면에 둔다. 검색이나 소통 장면이 더해져도 이 구조를 유지한다. 바깥 탐색은 시대를 바꿔도 같은 자리에 두고, 각 시대의 색과 조작은 전시 안에 집중한다. 좁은 화면에서 브라우저 장식이 차지하는 공간을 줄이고, 문서만 보는 보기를 유지한다.

AI 에이전트 장면에서는 이용자가 검색하고 작업을 맡기는 과정을 직접 비교할 수 있다. 에이전트가 어느 문서를 읽고 어떤 동작을 했는지 화면에서 따라갈 수 있도록 설계한다. 현재 프로토타입은 선택한 세 장면으로 범위를 제한하며, 복원 엔진이나 실시간 공동 편집은 포함하지 않는다.
