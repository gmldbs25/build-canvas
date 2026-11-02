/** Work 06 — Behind the Simulation. One question, one native observation per scene. */
export const SCENES = [
  { id: 1, chapter: '01 / BUILD A WORLD', eyebrow: '01 — THE WORLD', title: '이 작은 공장은 어떻게 움직일까?', body: '화면 속 차량은 정해진 영상을 반복하지 않습니다. 어느 길로 가고 언제 멈출지, 시뮬레이션이 결정합니다.', format: 'cinematic' },
  { id: 2, chapter: '01 / BUILD A WORLD', eyebrow: '02 — THE MODEL', title: '공장 안의 길은 어떻게 코드가 될까?', body: '눈에는 레일이 보이지만, 엔진은 연결 지점과 이동 가능한 방향으로 공장을 이해합니다.', format: 'editorial' },
  { id: 3, chapter: '02 / MAKE IT RUN', eyebrow: '03 — THE TRANSPORT', title: '상자 하나를 옮기는 데도 여러 단계가 필요하다.', body: '요청, 배차, 픽업, 이동, 하역. 하나의 운송은 실제 엔진에서 일어나는 여러 상태 변화의 결과입니다.', format: 'interactive' },
  { id: 4, chapter: '02 / MAKE IT RUN', eyebrow: '04 — THE CLOCK', title: '시뮬레이션의 1초는 어떻게 흐를까?', body: '엔진은 0.5초 단위로 상태를 갱신합니다. 시간을 나누고 초기 조건을 고정하면 같은 실험을 다시 살펴볼 수 있습니다.', format: 'interactive' },
  { id: 5, chapter: '03 / RULES INTERACT', eyebrow: '05 — THE ROUTE', title: '가장 짧은 길이 항상 좋은 길일까?', body: '거리만 보면 가까운 길이 유리합니다. 하지만 다른 차량 때문에 기다린다면 경로를 평가하는 기준도 달라질 수 있습니다.', format: 'interactive' },
  { id: 6, chapter: '03 / RULES INTERACT', eyebrow: '06 — THE TRAFFIC', title: '모두 규칙대로 움직이는데, 왜 멈출까?', body: '차량들은 레일과 교차로를 함께 사용합니다. 다른 차량이 구간을 점유하면 길이 있어도 기다려야 합니다.', format: 'cinematic' },
  { id: 7, chapter: '04 / VERIFY & SHOW', eyebrow: '07 — THE EXPERIMENT', title: '혼잡까지 계산하면 반드시 더 나을까?', body: '더 많은 정보를 사용한다고 언제나 좋은 결과가 나오지는 않습니다. 그래서 같은 조건에서 실행하고 비교해야 합니다.', format: 'editorial' },
  { id: 8, chapter: '04 / VERIFY & SHOW', eyebrow: '08 — BEHIND THE SCENE', title: '움직이는 화면 뒤에는 서로 다른 역할이 있다.', body: '엔진은 무엇이 일어나는지 계산하고, 화면은 그 결과를 보여줍니다. 그 분리가 실험과 검증을 가능하게 합니다.', format: 'cinematic' },
] as const;
export type Work6SceneId = typeof SCENES[number]['id'];
