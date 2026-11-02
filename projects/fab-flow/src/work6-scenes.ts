/** Work6 v2: current MCS and tomorrow's decision-support system. */
export const SCENES = [
{ id:1, chapter:'01 / FOLLOW', eyebrow:'SCENE 01 — THE QUESTION', title:'공장 안에도 교통체증이?', body:'반도체 공장에는 여러 작업 장비가 있고, 그 사이를 운반 차량들이 분주하게 오갑니다. 먼저 한 구역의 움직임을 함께 관찰해 볼까요?', format:'cinematic' },
{ id:2, chapter:'01 / FOLLOW', eyebrow:'SCENE 02 — THE CARRIER', title:'무엇을 옮기는 걸까?', body:'반도체 회로를 만드는 얇은 원판이 웨이퍼입니다. 이를 보호하는 전용 상자(FOUP)를 운반 차량(OHT)이 다음 장비로 옮깁니다.', format:'editorial' },
{ id:3, chapter:'01 / FOLLOW', eyebrow:'SCENE 03 — THE TRANSPORT', title:'하나의 운송은 어떻게 완성될까?', body:'반도체 회로가 만들어지는 얇은 원판, ‘웨이퍼’는 여러 장비를 거칩니다. 그 이동 과정을 하나씩 따라가 보세요.', format:'interactive' },
{ id:4, chapter:'02 / REVEAL', eyebrow:'SCENE 04 — THE NETWORK', title:'지금까지 본 건 공장의 극히 일부였다.', body:'작은 운송 한 건을 따라왔습니다. 그런데 이런 일이 수많은 장비 사이에서 동시에 일어난다면 어떨까요?', format:'cinematic' },
{ id:5, chapter:'02 / REVEAL', eyebrow:'SCENE 05 — THE RAIL', title:'차량은 아무 길로나 갈 수 없다.', body:'레일에는 진행 방향이 있고, 장비와 장비를 잇는 연결 지점이 있습니다. 가까워 보여도 돌아가야 하는 이유가 여기 있어요.', format:'editorial' },
{ id:6, chapter:'02 / REVEAL', eyebrow:'SCENE 06 — THE DECISION', title:'멀리 있는 장비까지, 어느 길로 갈까?', body:'짧은 운송을 넘어 여러 Bay를 지나는 길을 살펴봅니다. 물류 제어 시스템(MCS)은 방향이 정해진 레일과 여러 후보 경로를 계산해 이동할 길을 선택합니다.', format:'interactive' },
{ id:7, chapter:'03 / CHALLENGE', eyebrow:'SCENE 07 — THE TRAFFIC', title:'길을 찾았는데, 왜 기다려야 할까?', body:'목적지까지의 길이 있어도 다른 OHT가 이용 중인 레일 앞에서는 기다릴 수 있어요.', format:'cinematic' },
{ id:8, chapter:'03 / CHALLENGE', eyebrow:'SCENE 08 — MULTI LARGE', title:'하나의 FAB에서 동시에 벌어지는 일들.', body:'한 대의 차량을 따라왔다면 이제 전체 공장을 보세요. 수많은 운송을 동시에 관리하는 것이 MCS의 일이에요.', format:'cinematic' },
{ id:9, chapter:'04 / INTELLIGENCE', eyebrow:'SCENE 09 — OBSERVE & DIAGNOSE', title:'미래의 MCS는 무엇을 먼저 알아볼까?', body:'같은 공장, 다른 시선. 눈에 보이는 OHT 움직임 아래에도 레일 점유와 대기 신호가 있습니다.', format:'editorial' },
{ id:10, chapter:'04 / INTELLIGENCE', eyebrow:'SCENE 10 — TEST BEFORE ACTING', title:'하나의 공장, 여러 가지 선택.', body:'하나의 목적지에도 길은 여럿입니다. 운영 방식을 결정하기 전에 가능한 경로들을 살펴볼까요?', format:'interactive' },
{ id:11, chapter:'04 / INTELLIGENCE', eyebrow:'SCENE 11 — YOUR FAB', title:'이제 직접 운영해 볼 차례.', body:'현재의 MCS에서 미래형 운영 지원까지. 실제 FAB FLOW에서 물류 시스템을 경험해 보세요.', format:'cinematic' },
] as const;
export type Work6SceneId = typeof SCENES[number]['id'];
