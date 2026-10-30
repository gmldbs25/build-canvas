import { Engine } from './engine';
import { operationalScenario } from './experiments';
import type { DecisionInspection, TutorialEngineAction } from './engine';
import type { DemandEvent, Request, Vehicle } from './types';

export const TUTORIAL_REQUEST_ID = 'TR-0001';
export const TUTORIAL_SEED = 1;
export const TUTORIAL_DURATION = 1800;
export const TUTORIAL_DEMAND_WINDOW = 60;

export type TutorialStage = 'request' | 'dispatch' | 'empty-travel' | 'pickup' | 'route' | 'loaded-travel' | 'dropoff' | 'bay' | 'connected' | 'whole' | 'sandbox';
export type TutorialCommand = Exclude<TutorialStage, 'bay' | 'connected' | 'whole' | 'sandbox'>;

export const TUTORIAL_STEPS: Record<TutorialStage, { title: string; body: string; action: string }> = {
  request: { title: 'FOUP 운송 요청', body: '미리 준비된 한 건의 운송입니다. 출발과 도착 Port를 확인한 뒤 요청을 만드세요.', action: '운송 요청하기' },
  dispatch: { title: 'OHT 배차', body: 'MCS가 실제로 운행 가능한 OHT를 고릅니다.', action: 'OHT 배차하기' },
  'empty-travel': { title: '빈 OHT가 출발 Port로 이동', body: '배정된 차량을 따라가세요. 도착하면 FOUP은 Port에 그대로 기다립니다.', action: 'FOUP 가지러 출발하기' },
  pickup: { title: 'FOUP 픽업', body: '도착한 OHT가 실제 Port 서비스를 마치고 FOUP을 싣습니다.', action: 'FOUP 픽업하기' },
  route: { title: 'MCS가 목적지 경로 결정', body: '현재 조건에서 MCS 정책이 고른 경로를 확인합니다.', action: '이동 경로 찾기' },
  'loaded-travel': { title: '적재 운송', body: 'OHT가 실제 선택된 경로를 따라 FOUP을 목적지로 운반합니다.', action: '목적지로 출발하기' },
  dropoff: { title: '도착 및 하역', body: '목적지 Port에서 실제 하역 서비스를 마치면 운송이 완료됩니다.', action: 'FOUP 내려놓기' },
  bay: { title: '현재 Bay 살펴보기', body: '운송은 완료됐고 같은 FAB 안에서 시야만 현재 공정 Bay로 옮깁니다.', action: 'Bay 보기' },
  connected: { title: '연결된 Bay', body: '연결 Rail을 따라 여러 Bay가 어떻게 이어지는지 살펴보세요.', action: '연결 구간 보기' },
  whole: { title: 'FAB 전체와 MCS', body: '전체 네트워크와 준비된 차량을 살펴보세요. 실제 수요가 여러 개로 늘어나면 MCS의 배차와 경로 판단이 중요해집니다.', action: 'Sandbox 열기' },
  sandbox: { title: 'Sandbox 실험실', body: '첫 운송은 완료됐습니다. 이 짧은 체험 시나리오는 여기서 끝나며, Sandbox에서 운영 부하를 설정해 실험을 시작할 수 있습니다.', action: 'Sandbox 열기' },
};

const NEXT_STAGE: Partial<Record<TutorialCommand, TutorialStage>> = {
  request: 'dispatch', dispatch: 'empty-travel', 'empty-travel': 'pickup', pickup: 'route', route: 'loaded-travel', 'loaded-travel': 'dropoff', dropoff: 'bay',
};

function findRequest(engine: Engine): Request | undefined { return engine.state.requests.find(request => request.id === TUTORIAL_REQUEST_ID); }
function findVehicle(engine: Engine, request?: Request): Vehicle | undefined { return request?.vehicle ? engine.state.vehicles.find(vehicle => vehicle.id === request.vehicle && vehicle.request === request.id) : undefined; }

export function createTutorialWorld() {
  const engine = new Engine({
    ...operationalScenario('small'),
    fleet: 4,
    demand: 1,
    duration: TUTORIAL_DURATION,
    demandWindow: TUTORIAL_DEMAND_WINDOW,
    seed: TUTORIAL_SEED,
    pattern: 'steady',
    distribution: 'balanced',
  });
  const plannedIngress = engine.getNextDemand();
  if (!plannedIngress || plannedIngress.at !== 0) throw new Error('The tutorial schedule must start with one seeded request at time zero.');
  engine.enableTutorialControl();
  return { engine, plannedIngress };
}

/** Synchronous action lock and real-state boundary checks for the first-play command flow. */
export class TutorialCommandLayer {
  stage: TutorialStage = 'request';
  busy = false;
  private activeCommand?: TutorialCommand;

  begin(command: TutorialCommand): boolean {
    if (this.busy || this.stage !== command) return false;
    this.busy = true;
    this.activeCommand = command;
    return true;
  }

  step(engine: Engine): void {
    const command = this.activeCommand;
    if (!command || !this.busy) throw new Error('No tutorial command is active.');
    if (command === 'route') throw new Error('Route planning is a no-clock tutorial command.');
    const engineAction: TutorialEngineAction = command === 'request' ? 'release-request' : command;
    engine.stepTutorial(engineAction);
  }

  reached(engine: Engine): boolean {
    const request = findRequest(engine), vehicle = findVehicle(engine, request), command = this.activeCommand;
    if (!command) return false;
    if (command === 'request') return !!request && request.phase === 'pending';
    if (command === 'dispatch') return !!request?.vehicle && request.phase === 'assigned' && !!vehicle;
    if (command === 'empty-travel') return !!request && !!vehicle && request.phase === 'assigned' && vehicle.phase === 'empty' && !vehicle.link && vehicle.node === engine.layout.ports.find(port => port.id === request.source)?.node;
    if (command === 'pickup') return !!request && request.phase === 'loaded' && request.picked !== undefined && !!vehicle?.loaded;
    if (command === 'route') return !!vehicle?.route.length && !!engine.inspectDecision(vehicle.id)?.candidates.some(candidate => candidate.selected);
    if (command === 'loaded-travel') return !!request && request.phase === 'loaded' && !!vehicle?.loaded && !vehicle.link && vehicle.node === engine.layout.ports.find(port => port.id === request.destination)?.node;
    return request?.phase === 'completed' && request.completed !== undefined && engine.state.storedFoups.some(foup => foup.requestId === request.id && foup.portId === request.destination);
  }

  executeRoute(engine: Engine): DecisionInspection {
    if (!this.busy || this.activeCommand !== 'route') throw new Error('Route planning is not the active tutorial command.');
    const request = findRequest(engine);
    if (!request) throw new Error('The tutorial request is missing.');
    const decision = engine.planTutorialLoadedRoute(request.id);
    if (!this.reached(engine)) throw new Error('The MCS route was not recorded by the Engine.');
    return decision;
  }

  finish(engine: Engine): TutorialStage {
    const command = this.activeCommand;
    if (!command || !this.busy || !this.reached(engine)) throw new Error('The Engine has not reached the tutorial command boundary.');
    this.busy = false;
    this.activeCommand = undefined;
    const next = NEXT_STAGE[command]!;
    this.stage = next;
    if (command === 'dropoff') engine.disableTutorialControl();
    return next;
  }

  fail(): void {
    this.busy = false;
    this.activeCommand = undefined;
  }

  advanceExploration(): TutorialStage {
    if (this.busy) throw new Error('Wait for the current command to finish.');
    if (this.stage === 'bay') this.stage = 'connected';
    else if (this.stage === 'connected') this.stage = 'whole';
    else if (this.stage === 'whole') this.stage = 'sandbox';
    else throw new Error('The FAB exploration is not ready yet.');
    return this.stage;
  }

  skip(engine: Engine): void {
    if (this.busy) throw new Error('Wait for the active tutorial command to reach a safe boundary.');
    engine.disableTutorialControl();
    this.stage = 'sandbox';
  }
}

export function tutorialRequest(engine: Engine): Request | undefined { return findRequest(engine); }
export function tutorialVehicle(engine: Engine): Vehicle | undefined { return findVehicle(engine, findRequest(engine)); }
