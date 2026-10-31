/**
 * Work 06 — editorial story. All 3D transport objects and operational
 * observations are supplied by the original FAB FLOW Native Engine/renderer.
 * A scene introduces a question before naming the technical system.
 */
export const SCENES = [
  { id: 1, chapter: '01 / FOLLOW', eyebrow: 'SCENE 01 — THE QUESTION',
    title: '공장 안에도 교통체증이?', body: '반도체 공장에는 여러 작업 장비가 있고, 그 사이를 운반 차량들이 분주하게 오갑니다. 먼저 한 구역의 움직임을 함께 관찰해 볼까요?', format: 'cinematic' },
  { id: 2, chapter: '01 / FOLLOW', eyebrow: 'SCENE 02 — THE CARRIER',
    title: '무엇을 옮기는 걸까?', body: '반도체 회로를 만드는 얇은 원판이 웨이퍼입니다. 이를 보호하는 전용 상자(FOUP)를 운반 차량(OHT)이 다음 장비로 옮깁니다.', format: 'editorial' },
  { id: 3, chapter: '01 / FOLLOW', eyebrow: 'SCENE 03 — THE TRANSPORT',
    title: '하나의 운송은 어떻게 완성될까?', body: '반도체 회로가 만들어지는 얇은 원판, ‘웨이퍼’는 여러 장비를 거칩니다. 그 이동 과정을 하나씩 따라가 보세요.', format: 'interactive' },
  { id: 4, chapter: '02 / REVEAL', eyebrow: 'SCENE 04 — THE NETWORK',
    title: '지금까지 본 건 공장의 극히 일부였다.', body: '작은 운송 한 건을 따라왔습니다. 그런데 이런 일이 수많은 장비 사이에서 동시에 일어난다면 어떨까요?', format: 'cinematic' },
  { id: 5, chapter: '02 / REVEAL', eyebrow: 'SCENE 05 — THE RAIL',
    title: '차량은 아무 길로나 갈 수 없다.', body: '레일에는 진행 방향이 있고, 장비와 장비를 잇는 연결 지점이 있습니다. 가까워 보여도 돌아가야 하는 이유가 여기 있어요.', format: 'editorial' },
  { id: 6, chapter: '02 / REVEAL', eyebrow: 'SCENE 06 — THE DECISION',
    title: '멀리 있는 장비까지, 어느 길로 갈까?', body: '짧은 운송을 넘어 여러 Bay를 지나는 길을 살펴봅니다. 물류 제어 시스템(MCS)은 방향이 정해진 레일과 여러 후보 경로를 계산해 이동할 길을 선택합니다.', format: 'interactive' },
  { id: 7, chapter: '03 / PRESSURE', eyebrow: 'SCENE 07 — THE CONGESTION',
    title: '잘 돌아가던 공장에 갑자기 일이 몰린다면?', body: '이미 운송 중인 OHT들이 있어요. 차량 수는 그대로인데, 운송 요청만 갑자기 많아지면 어떤 일이 생길까요?', format: 'cinematic' },
  { id: 8, chapter: '03 / PRESSURE', eyebrow: 'SCENE 08 — THE MEASURE',
    title: '왜 운송을 기다리는 일이 늘어날까?', body: '같은 공장에 같은 차량 수. 요청이 들어오는 속도와 실제 처리 속도를 비교하면 이유가 보입니다.', format: 'editorial' },
  { id: 9, chapter: '03 / PRESSURE', eyebrow: 'SCENE 09 — THE EXPERIMENT',
    title: '차량을 더 넣으면 빨라질까?', body: '같은 출발 조건에서 단 한 가지를 바꿔 실제 엔진으로 다시 실험해 봅시다. 결과는 직접 계산되며 항상 더 좋아지지는 않습니다.', format: 'interactive' },
  { id: 10, chapter: '04 / BEHIND', eyebrow: 'SCENE 10 — THE ENGINE',
    title: '화면 뒤에서는 무슨 일이 일어날까?', body: '우리 눈에 보이는 움직임 뒤에서는 0.5초마다 요청, 차량, 레일과 경로의 상태가 계산됩니다.', format: 'editorial' },
  { id: 11, chapter: '04 / BEHIND', eyebrow: 'SCENE 11 — YOUR FAB',
    title: '이제 직접 운영해 볼 차례.', body: '우리가 지켜본 세계는 실제 시뮬레이션 엔진에서 움직이고 있었어요. 다음에는 운송 수요와 차량, 경로 정책을 직접 바꿔 보세요.', format: 'cinematic' },
] as const;

export type Work6SceneId = typeof SCENES[number]['id'];
