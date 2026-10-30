import { stagingNode } from './staging';
import { getLayout } from './layouts';
import type { DemandChange, DemandEvent, DemandStage, Failure, FleetChange, FleetMetrics, Kpis, Layout, Link, MultiLargeLifter, MultiLifterRuntime, OperationalTimingKey, Policy, Port, PortOccupancy, Request, Scenario, SimulationState, Snapshot, StoredFoup, Vehicle } from './types';
import { candidateRoutesV6 } from './topology-routing';
import { createTickProtection, getControlGeometry, type MovementBlocker, type TickProtection } from './control';
import { vehiclePosition } from './geometry';
import { publicationCopy } from './publication';
import { collectAnalysisTick, createAnalysisState, makeAnalysisReport, recordIntervention, validateAnalysisState } from './analysis';
import type { AnalysisIntervention, AnalysisReport, AnalysisState, DemandSettings } from './analysisTypes';

export const OPERATIONAL_ENGINE_VERSION = 'fab-flow-engine/2.1';
export const OPERATIONAL_LIVENESS_ENGINE_VERSION = 'fab-flow-engine/2.2';
export const MULTI_LARGE_ENGINE_VERSION = 'fab-flow-engine/2.3';
export type OperationalEngineVersion = typeof OPERATIONAL_ENGINE_VERSION | typeof OPERATIONAL_LIVENESS_ENGINE_VERSION | typeof MULTI_LARGE_ENGINE_VERSION;
export function isOperationalEngineVersion(value: string): value is OperationalEngineVersion {
  return value === OPERATIONAL_ENGINE_VERSION || value === OPERATIONAL_LIVENESS_ENGINE_VERSION || value === MULTI_LARGE_ENGINE_VERSION;
}
function operationalVersionAt(scenario: Scenario, time: number): OperationalEngineVersion {
  if (scenario.operationalVersion === '2.3') return MULTI_LARGE_ENGINE_VERSION;
  return scenario.operationalVersion === '2.2' && scenario.transportRecovery && time >= scenario.transportRecovery.startAt
    ? OPERATIONAL_LIVENESS_ENGINE_VERSION : OPERATIONAL_ENGINE_VERSION;
}
export const TICK_SECONDS = 0.5;
const SPEED_METERS_PER_SECOND = 4;
const SERVICE_SECONDS = 1.5;
const STORAGE_DWELL_SECONDS = 24;
const MAX_EVENTS = 1000;
const MAX_DEMAND_CHANGES = 14_401; // every 0.5-second boundary from 0 through 7200 seconds
const EPSILON = 1e-9;
const DEFAULT_MCS = { distanceWeight: 1, congestionWeight: 2.5, rerouteThreshold: 0.15, recalculationInterval: 5, dispatchPolicy: 'nearest' } as const;
export type RouteCandidate = { nodes: string[]; links: string[]; distance: number; cost: number; selected: boolean };
export type DecisionInspection = { reason: string; assignmentReason: string; from: string; to: string; candidates: RouteCandidate[]; policy: Policy };
export type EngineDiagnostics = { blockedVehicles: number; stalledVehicles: string[]; deadlockedVehicles: string[]; routingMs: number; routingDecisions: number };
export type TutorialEngineAction = 'release-request' | 'dispatch' | 'empty-travel' | 'pickup' | 'loaded-travel' | 'dropoff';
type TutorialEngineStage = 'request' | 'dispatch' | 'empty-travel' | 'pickup' | 'route' | 'loaded-travel' | 'dropoff' | 'complete';

type TickResult = { busy: boolean; waiting: boolean; reason?: string; resources?: string[] };
type HeapEntry = { node: string; cost: number };
type PreviousRouteEdge = { nodeIndex: number; link: Link };

class StableMinHeap {
  private items: HeapEntry[] = [];
  get size(): number { return this.items.length; }
  private compare(a: HeapEntry, b: HeapEntry): number {
    if (a.cost < b.cost - EPSILON) return -1;
    if (a.cost > b.cost + EPSILON) return 1;
    return a.node.localeCompare(b.node);
  }
  push(entry: HeapEntry): void {
    const items = this.items;
    items.push(entry);
    let index = items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(items[index], items[parent]) >= 0) break;
      [items[index], items[parent]] = [items[parent], items[index]];
      index = parent;
    }
  }
  pop(): HeapEntry | undefined {
    const items = this.items;
    if (!items.length) return undefined;
    const first = items[0];
    const last = items.pop()!;
    if (items.length) {
      items[0] = last;
      let index = 0;
      while (true) {
        const left = index * 2 + 1, right = left + 1;
        let smallest = index;
        if (left < items.length && this.compare(items[left], items[smallest]) < 0) smallest = left;
        if (right < items.length && this.compare(items[right], items[smallest]) < 0) smallest = right;
        if (smallest === index) break;
        [items[index], items[smallest]] = [items[smallest], items[index]];
        index = smallest;
      }
    }
    return first;
  }
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function xorshift(seed: number): () => number {
  let state = (seed | 0) || 0x6d2b79f5;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
function stableRound(value: number): number { return Math.round(value * 1e9) / 1e9; }
function fleetAvailableSeconds(scenario: Scenario, time: number): number {
  if (scenario.version !== 2) return scenario.fleet * time;
  return stableRound(scenario.fleet * time + (scenario.fleetChanges ?? []).reduce((sum, change) => sum + change.vehicleIds.length * Math.max(0, time - change.at), 0));
}
function appliedFleetChanges(scenario: Scenario, time: number): FleetChange[] {
  return scenario.version === 2 ? (scenario.fleetChanges ?? []).filter(change => change.at <= time + EPSILON) : [];
}
function expectedFleetIds(scenario: Scenario, time: number): string[] {
  const initial = Array.from({ length: scenario.fleet }, (_, index) => `OHT-${String(index + 1).padStart(3, '0')}`);
  return initial.concat(appliedFleetChanges(scenario, time).flatMap(change => change.vehicleIds));
}
function assertFleetAccounting(scenario: Scenario, state: SimulationState, layout: Layout): void {
  if (scenario.version === 1) {
    assert(state.fleetAccounting === undefined, 'Scenario version 1 cannot contain fleet accounting.');
    return;
  }
  const applied = appliedFleetChanges(scenario, state.time), accounting = state.fleetAccounting;
  const expectedIds = expectedFleetIds(scenario, state.time);
  assert(state.vehicles.length === expectedIds.length && state.vehicles.every((vehicle, index) => vehicle.id === expectedIds[index]), 'Effective fleet vehicle IDs disagree with applied fleet history.');
  if (applied.length === 0) {
    assert(accounting === undefined, 'Fleet accounting cannot exist before the first fleet addition.');
    return;
  }
  assert(!!accounting && accounting.appliedChangeCount === applied.length, 'Applied fleet history cursor is missing or invalid.');
  assert(finite(accounting.observedSince) && accounting.observedSince === applied[0].at, 'Fleet accounting observation boundary is invalid.');
  const baselineLimit = scenario.fleet * accounting.observedSince;
  assert(finite(accounting.baselineBusySeconds) && accounting.baselineBusySeconds >= 0 && accounting.baselineBusySeconds <= state.vehicleBusySeconds + EPSILON && Math.abs(accounting.baselineBusySeconds / TICK_SECONDS - Math.round(accounting.baselineBusySeconds / TICK_SECONDS)) < EPSILON, 'Fleet accounting busy baseline is invalid.');
  assert(finite(accounting.baselineWaitingSeconds) && accounting.baselineWaitingSeconds >= 0 && accounting.baselineWaitingSeconds <= state.vehicleWaitingSeconds + EPSILON && Math.abs(accounting.baselineWaitingSeconds / TICK_SECONDS - Math.round(accounting.baselineWaitingSeconds / TICK_SECONDS)) < EPSILON, 'Fleet accounting waiting baseline is invalid.');
  assert(accounting.baselineBusySeconds + accounting.baselineWaitingSeconds <= baselineLimit + EPSILON, 'Fleet accounting baseline exceeds initial fleet-time before the first addition.');
  assert(Array.isArray(accounting.vehicles) && accounting.vehicles.length === expectedIds.length, 'Fleet accounting vehicle list is missing or incomplete.');
  const introducedAt = new Map<string, number>();
  for (let index = 0; index < scenario.fleet; index++) introducedAt.set(`OHT-${String(index + 1).padStart(3, '0')}`, 0);
  for (const change of applied) for (const id of change.vehicleIds) introducedAt.set(id, change.at);
  const parkingNodes = layout.parkingNodes ?? [];
  let busy = 0, waiting = 0;
  for (let index = 0; index < accounting.vehicles.length; index++) {
    const vehicleTime = accounting.vehicles[index], id = expectedIds[index], born = introducedAt.get(id)!;
    const observedSince = Math.max(applied[0].at, born), elapsed = Math.max(0, state.time - observedSince);
    const vehicle = state.vehicles[index], ordinal = Number(id.slice(4));
    assert(!!vehicleTime && vehicleTime.id === id && vehicleTime.introducedAt === born && vehicleTime.observedSince === observedSince, `Fleet accounting identity or observation boundary is invalid for ${id}.`);
    assert(vehicle && vehicle.parkingSlot === ordinal - 1, `Fleet vehicle ${id} has an invalid absolute parking slot.`);
    if (born === state.time) {
      assert(vehicle.parked === true && vehicle.node === stagingNode(layout, scenario, ordinal) && !vehicle.link && !vehicle.request && vehicle.route.length === 0, `New fleet vehicle ${id} is not at its deterministic off-rail staging anchor.`);
      assert(vehicle.phase === 'idle' && vehicle.progress === 0 && vehicle.serviceRemaining === 0 && vehicle.distance === 0 && vehicle.waiting === 0 && vehicle.loaded === false && vehicle.failed === false && vehicle.parkingPending === false, `New fleet vehicle ${id} has non-initial transport state at its birth boundary.`);
    }
    for (const key of ['availableSeconds', 'busySeconds', 'waitingSeconds'] as const) {
      const value = vehicleTime[key];
      assert(finite(value) && value >= 0 && Math.abs(value / TICK_SECONDS - Math.round(value / TICK_SECONDS)) < EPSILON, `Fleet accounting ${key} is invalid for ${id}.`);
    }
    assert(Math.abs(vehicleTime.availableSeconds - elapsed) < EPSILON && vehicleTime.busySeconds + vehicleTime.waitingSeconds <= vehicleTime.availableSeconds + EPSILON, `Fleet accounting exposure is invalid for ${id}.`);
    busy += vehicleTime.busySeconds;
    waiting += vehicleTime.waitingSeconds;
  }
  assert(Math.abs(busy - (state.vehicleBusySeconds - accounting.baselineBusySeconds)) < EPSILON, 'Per-vehicle busy counters do not match aggregate fleet time.');
  assert(Math.abs(waiting - (state.vehicleWaitingSeconds - accounting.baselineWaitingSeconds)) < EPSILON, 'Per-vehicle waiting counters do not match aggregate fleet time.');
}

export function validateScenario(value: unknown, options: { allowPendingInterventions?: boolean } = {}): Scenario {
  assert(!!value && typeof value === 'object' && !Array.isArray(value), 'Scenario must be an object.');
  const candidate = value as Partial<Scenario>;
  assert(candidate.version === 1 || candidate.version === 2, 'Unsupported scenario version.');
  const hasFleetChanges = Object.prototype.hasOwnProperty.call(value, 'fleetChanges');
  if (candidate.version === 1) assert(!hasFleetChanges, 'Scenario version 1 cannot contain fleetChanges.');
  else assert(hasFleetChanges, 'Scenario version 2 requires fleet changes.');
  const isMultiLarge = candidate.layoutId === 'multi-large';
  if (isMultiLarge) assert(candidate.layoutVersion === 'multi-large-1' && candidate.operationalVersion === '2.3', 'Multi Large requires matching multi-large-1 layout and operational 2.3 markers.');
  else {
    assert(candidate.layoutVersion === '6', '이전 FAB 지도 저장 데이터는 지원하지 않습니다. 원본을 백업한 뒤 새 기본 FAB로 시작하세요.');
    assert(['small', 'medium', 'large'].includes(String(candidate.layoutId)), '지원하지 않는 FAB 크기입니다. 원본을 백업한 뒤 새 기본 FAB로 시작하세요.');
    assert(candidate.operationalVersion === '2.1' || candidate.operationalVersion === '2.2', 'Unsupported operational engine version; preserve the original save before starting a new FAB.');
  }
  assert(candidate.operationalVersion === '2.1' || candidate.operationalVersion === '2.2' || candidate.operationalVersion === '2.3', 'Unsupported operational engine version; preserve the original save before starting a new FAB.');
  assert(finite(candidate.fleet) && Number.isInteger(candidate.fleet) && candidate.fleet >= 1 && candidate.fleet <= 300, 'Fleet must be an integer from 1 to 300.');
  assert(finite(candidate.demand) && Number.isInteger(candidate.demand) && candidate.demand >= 0 && candidate.demand <= 120, 'Demand must be an integer from 0 to 120.');
  const operational = candidate.operationalVersion === '2.1' || candidate.operationalVersion === '2.2' || candidate.operationalVersion === '2.3';
  assert(finite(candidate.duration) && candidate.duration >= TICK_SECONDS && candidate.duration <= (operational ? 7200 : 1800) && Number.isInteger(candidate.duration / TICK_SECONDS), `Duration must be a 0.5 second multiple from 0.5 to ${operational ? 7200 : 1800} seconds.`);
  if (candidate.operationalVersion === '2.2') {
    const recovery = candidate.transportRecovery;
    assert(!!recovery && typeof recovery === 'object' && !Array.isArray(recovery) && recovery.version === '1.0' && finite(recovery.startAt)
      && recovery.startAt >= 0 && recovery.startAt <= candidate.duration && Number.isInteger(recovery.startAt / TICK_SECONDS), 'Invalid transport recovery version or activation boundary.');
  } else assert(candidate.transportRecovery === undefined, 'Transport recovery requires explicit operational semantics 2.2.');
  if (candidate.demandWindow !== undefined) assert(operational && finite(candidate.demandWindow) && candidate.demandWindow >= TICK_SECONDS && candidate.demandWindow <= candidate.duration && candidate.demandWindow <= 7200 && Number.isInteger(candidate.demandWindow / TICK_SECONDS), 'demandWindow is only supported by operational engines 2.1/2.2 and must be a 0.5 second multiple from 0.5 seconds through the observation duration.');
  for (const [key, allowed] of [['movementControl', ['conservative', 'clearance']], ['deadlockPolicy', ['detect', 'prevent-recover']]] as const) {
    const value = candidate[key];
    if (value !== undefined) assert(operational && allowed.includes(value as never), `${key} is only supported by operational engines 2.1/2.2.`);
  }
  assert(finite(candidate.seed) && Number.isInteger(candidate.seed) && Math.abs(candidate.seed) <= 2147483647, 'Seed must be a 32-bit integer.');
  assert(candidate.policy === 'DBR' || candidate.policy === 'CBR', 'Policy must be DBR or CBR.');
  if (candidate.initialPolicy !== undefined) assert(candidate.initialPolicy === 'DBR' || candidate.initialPolicy === 'CBR', 'initialPolicy must be DBR or CBR.');
  if (candidate.interventionHistoryComplete !== undefined) assert(typeof candidate.interventionHistoryComplete === 'boolean', 'interventionHistoryComplete must be a boolean.');
  if (candidate.interventions !== undefined) {
    assert(operational && Array.isArray(candidate.interventions) && candidate.interventions.length <= 2_000, 'Interventions are only supported by operational engines 2.1/2.2 and are limited to 2,000 retained events.');
    let lastAt = -1, lastSequence = 0;
    for (const event of candidate.interventions) {
      assert(!!event && typeof event === 'object' && Number.isInteger(event.sequence) && event.sequence > lastSequence && event.id === `OA-${String(event.sequence).padStart(6, '0')}`, 'Intervention IDs and order must be valid and increasing.');
      assert(finite(event.at) && event.at >= 0 && event.at <= candidate.duration && Number.isInteger(event.at / TICK_SECONDS) && event.at >= lastAt, 'Interventions must be ordered at tick-aligned times within the scenario.');
      if (event.type === 'policy') assert(['DBR', 'CBR'].includes(event.before) && ['DBR', 'CBR'].includes(event.after), 'Invalid policy intervention.');
      else if (event.type === 'demand-pause') assert(typeof event.before === 'boolean' && typeof event.after === 'boolean', 'Invalid demand-pause intervention.');
      else if (event.type === 'demand-rate') {
        for (const settings of [event.before, event.after]) assert(!!settings && finite(settings.intervalSeconds) && settings.intervalSeconds >= TICK_SECONDS && settings.intervalSeconds <= 7200 && ['relaxed', 'active', 'congested'].includes(settings.stage) && typeof settings.paused === 'boolean', 'Invalid demand-rate intervention.');
      } else if (event.type === 'transport-recovery') {
        assert(event.before === null && !!event.after && event.after.version === '1.0' && finite(event.after.startAt)
          && event.after.startAt === event.at + TICK_SECONDS, 'Invalid transport recovery intervention.');
      } else if (event.type === 'fleet-add') {
        assert(Number.isInteger(event.before) && event.before >= 1 && Number.isInteger(event.after) && event.after > event.before && event.after <= 300 && Array.isArray(event.vehicleIds) && event.vehicleIds.length === event.after - event.before && event.vehicleIds.every((id, index) => id === `OHT-${String(event.before + index + 1).padStart(3, '0')}`), 'Invalid fleet-add intervention.');
      } else assert(false, 'Unknown intervention type.');
      lastAt = event.at;
      lastSequence = event.sequence;
    }
    const policyEvents = candidate.interventions.filter(event => event.type === 'policy');
    if (policyEvents.length) {
      assert(candidate.initialPolicy !== undefined, 'Policy intervention history requires initialPolicy.');
      if (candidate.interventionHistoryComplete !== false) assert(candidate.initialPolicy === policyEvents[0].before, 'initialPolicy disagrees with policy intervention history.');
      if (candidate.interventionHistoryComplete !== false) {
        const validPrefixes = new Set<Policy>([candidate.initialPolicy!]);
        for (const event of policyEvents) validPrefixes.add(event.after);
        assert(validPrefixes.has(candidate.policy!), 'Scenario policy disagrees with every policy-history prefix.');
      }
    } else if (candidate.initialPolicy !== undefined && candidate.interventionHistoryComplete !== false) assert(false, 'initialPolicy requires retained policy intervention history.');
  } else assert(candidate.initialPolicy === undefined && candidate.interventionHistoryComplete === undefined, 'Initial policy metadata requires interventions.');
  assert(candidate.pattern === 'steady' || candidate.pattern === 'peak', 'Unknown demand pattern.');
  assert(candidate.distribution === 'balanced' || candidate.distribution === 'hotspot', 'Unknown demand distribution.');
  if (candidate.demandMode !== undefined) assert(candidate.demandMode === 'per-minute' || candidate.demandMode === 'per-10-seconds' || candidate.demandMode === 'interval', 'Unknown demand mode.');
  if (candidate.demandMode === 'per-10-seconds') assert(finite(candidate.requestsPer10Seconds) && Number.isInteger(candidate.requestsPer10Seconds) && candidate.requestsPer10Seconds >= 0 && candidate.requestsPer10Seconds <= 20, 'requestsPer10Seconds must be an integer from 0 to 20 for per-10-seconds demand mode.');
  else assert(candidate.requestsPer10Seconds === undefined, 'requestsPer10Seconds requires per-10-seconds demand mode.');
  if (candidate.demandMode === 'interval') {
    assert(operational, 'Interval demand is only supported by operational engines 2.1/2.2.');
    assert(finite(candidate.demandIntervalSeconds) && candidate.demandIntervalSeconds >= TICK_SECONDS && candidate.demandIntervalSeconds <= 7200 && Number.isInteger(candidate.demandIntervalSeconds / TICK_SECONDS), 'demandIntervalSeconds must be a 0.5 second multiple from 0.5 to 7200 seconds.');
    assert(candidate.initialRequests === undefined || candidate.initialRequests === 2 || candidate.initialRequests === 3, 'initialRequests must be 2 or 3.');
    assert(candidate.demandStage === undefined || ['relaxed', 'active', 'congested'].includes(candidate.demandStage), 'Invalid demand stage.');
    assert(candidate.demandChanges === undefined || Array.isArray(candidate.demandChanges) && candidate.demandChanges.length <= MAX_DEMAND_CHANGES, `demandChanges must contain at most ${MAX_DEMAND_CHANGES} changes.`);
    let previous = -1;
    for (const change of candidate.demandChanges ?? []) {
      assert(!!change && typeof change === 'object' && finite(change.at) && change.at >= 0 && change.at <= candidate.duration && Number.isInteger(change.at / TICK_SECONDS) && change.at > previous, 'Demand changes must have strictly increasing tick-aligned times within the observation duration.');
      assert(finite(change.intervalSeconds) && change.intervalSeconds >= TICK_SECONDS && change.intervalSeconds <= 7200 && Number.isInteger(change.intervalSeconds / TICK_SECONDS), 'Demand change intervals must be tick-aligned from 0.5 to 7200 seconds.');
      assert(['relaxed', 'active', 'congested'].includes(change.stage), 'Invalid demand change stage.');
      assert(change.paused === undefined || typeof change.paused === 'boolean', 'Demand change paused must be a boolean when present.');
      previous = change.at;
    }
  } else {
    assert(candidate.demandIntervalSeconds === undefined && candidate.initialRequests === undefined && candidate.demandStage === undefined && candidate.demandChanges === undefined, 'Interval demand fields require interval demand mode.');
  }
  for (const key of ['bridgeCapacity', 'lifterCapacity', 'storageCapacity'] as const) {
    assert(finite(candidate[key]) && Number.isInteger(candidate[key]) && candidate[key]! >= 1 && candidate[key]! <= 300, `${key} must be an integer from 1 to 300.`);
  }
  if (candidate.mcs !== undefined) {
    const mcs = candidate.mcs;
    assert(!!mcs && typeof mcs === 'object', 'MCS configuration must be an object.');
    assert(finite(mcs.distanceWeight) && mcs.distanceWeight > 0 && mcs.distanceWeight <= 100, 'MCS distanceWeight must be from 0 to 100.');
    assert(finite(mcs.congestionWeight) && mcs.congestionWeight >= 0 && mcs.congestionWeight <= 100, 'MCS congestionWeight must be from 0 to 100.');
    assert(finite(mcs.rerouteThreshold) && mcs.rerouteThreshold >= 0 && mcs.rerouteThreshold <= 1, 'MCS rerouteThreshold must be from 0 to 1.');
    assert(finite(mcs.recalculationInterval) && mcs.recalculationInterval >= TICK_SECONDS && mcs.recalculationInterval <= 60, 'MCS recalculationInterval must be 0.5–60 simulated seconds.');
    assert(mcs.dispatchPolicy === 'nearest' || mcs.dispatchPolicy === 'fifo' || (operational && mcs.dispatchPolicy === 'eta'), 'Unknown MCS dispatch policy.');
    if (mcs.congestionModel !== undefined) assert(operational && (mcs.congestionModel === 'legacy' || mcs.congestionModel === 'delay'), 'congestionModel is only supported by operational engines 2.1/2.2.');
  }
  assert(Array.isArray(candidate.failures) && candidate.failures.length <= 20, 'Failures must be an array with at most 20 events.');
  const scenario = clone(candidate as Scenario);
  const layout = getLayout(scenario.layoutId, scenario.layoutVersion);
  if (scenario.version === 2) {
    assert(Array.isArray(scenario.fleetChanges) && scenario.fleetChanges.length > 0, 'Scenario version 2 requires nonempty fleetChanges.');
    let previousAt = -1, nextVehicleIndex = scenario.fleet + 1;
    const eventIds = new Set<string>();
    for (const change of scenario.fleetChanges) {
      assert(!!change && typeof change === 'object' && typeof change.eventId === 'string' && change.eventId.length > 0 && change.eventId.length <= 100 && !eventIds.has(change.eventId), 'Fleet change event IDs must be unique nonempty strings.');
      eventIds.add(change.eventId);
      assert(finite(change.at) && change.at >= 0 && change.at <= scenario.duration && Number.isInteger(change.at / TICK_SECONDS) && change.at >= previousAt, 'Fleet changes must be ordered by nondecreasing tick-aligned times within the observation duration.');
      assert(Array.isArray(change.vehicleIds) && change.vehicleIds.length > 0, 'Fleet changes must add at least one vehicle.');
      for (const id of change.vehicleIds) {
        assert(id === `OHT-${String(nextVehicleIndex).padStart(3, '0')}`, `Fleet change vehicle IDs must be contiguous and ordered; expected OHT-${String(nextVehicleIndex).padStart(3, '0')}.`);
        nextVehicleIndex++;
      }
      assert(nextVehicleIndex - 1 <= 300, 'Initial fleet plus additions must not exceed 300 vehicles.');
      previousAt = change.at;
    }
  } else assert(scenario.fleetChanges === undefined, 'Scenario version 1 cannot contain fleetChanges.');
  const interventions = scenario.interventions ?? [];
  const recoveryEvents = interventions.filter(event => event.type === 'transport-recovery');
  assert(recoveryEvents.length <= 1, 'Transport recovery can only be activated once.');
  for (const event of recoveryEvents) {
    assert(scenario.operationalVersion === '2.2' && !!scenario.transportRecovery
      && event.after.version === scenario.transportRecovery.version
      && event.after.startAt === scenario.transportRecovery.startAt, 'Recovery intervention disagrees with scenario activation.');
  }

  const policyEvents = interventions.filter((event): event is Extract<AnalysisIntervention, { type: 'policy' }> => event.type === 'policy');
  if (policyEvents.length) {
    for (let index = 1; index < policyEvents.length; index++) assert(policyEvents[index].before === policyEvents[index - 1].after, 'Policy intervention before/after history is discontinuous.');
  }
  const demandEvents = interventions.filter(event => event.type === 'demand-rate' || event.type === 'demand-pause');
  const changesAt = new Map((scenario.demandChanges ?? []).map(change => [change.at, change]));
  const demandEventsAt = new Map<number, typeof demandEvents>();
  for (const event of demandEvents) demandEventsAt.set(event.at, [...(demandEventsAt.get(event.at) ?? []), event]);
  const validatedDemandEventsAt = options.allowPendingInterventions ? new Map<number, typeof demandEvents>() : demandEventsAt;
  for (const [at, events] of validatedDemandEventsAt) {
    const change = changesAt.get(at);
    assert(!!change, 'Demand intervention history has no matching native demand change.');
    const priorChange = [...(scenario.demandChanges ?? [])].reverse().find(item => item.at < at);
    let settings: DemandSettings = { intervalSeconds: priorChange?.intervalSeconds ?? scenario.demandIntervalSeconds ?? 0, stage: priorChange?.stage ?? scenario.demandStage ?? 'relaxed', paused: priorChange?.paused ?? false };
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      if (event.type === 'demand-rate') {
        if (index > 0 || scenario.interventionHistoryComplete !== false) assert(JSON.stringify(event.before) === JSON.stringify(settings), 'Demand-rate before-value disagrees with native demand history.');
        settings = event.after;
      } else {
        if (index > 0 || scenario.interventionHistoryComplete !== false) assert(event.before === settings.paused, 'Demand-pause before-value disagrees with native demand history.');
        settings = { ...settings, paused: event.after };
      }
    }
    const finalEvent = events.at(-1)!;
    const expectedAfter = finalEvent.type === 'demand-rate' ? finalEvent.after : { ...settings, paused: finalEvent.after };
    assert(expectedAfter.intervalSeconds === change.intervalSeconds && expectedAfter.stage === change.stage && expectedAfter.paused === (change.paused ?? false), 'Demand intervention after-value disagrees with native demand schedule.');
  }
  const fleetEvents = interventions.filter((event): event is Extract<AnalysisIntervention, { type: 'fleet-add' }> => event.type === 'fleet-add');
  const fleetChanges = scenario.fleetChanges ?? [];
  let expectedFleet = scenario.fleet;
  for (const change of fleetChanges) {
    const event = fleetEvents.find(item => item.at === change.at && JSON.stringify(item.vehicleIds) === JSON.stringify(change.vehicleIds));
    if (event) {
      assert(event.before === expectedFleet && event.after === expectedFleet + change.vehicleIds.length, 'Fleet intervention counts disagree with native fleet schedule.');
    } else assert(options.allowPendingInterventions || scenario.interventionHistoryComplete === false || !scenario.interventions?.length, 'Native fleet schedule is missing its intervention record.');
    expectedFleet += change.vehicleIds.length;
  }
  for (const event of fleetEvents) assert(fleetChanges.some(change => change.at === event.at && JSON.stringify(change.vehicleIds) === JSON.stringify(event.vehicleIds)), 'Fleet intervention does not match a native fleet change.');
  const linkById = new Map(layout.links.map(link => [link.id, link]));
  for (const failure of scenario.failures) {
    assert(!!failure && typeof failure === 'object', 'Invalid failure event.');
    assert(failure.kind === 'rail' || failure.kind === 'vehicle' || failure.kind === 'lifter', 'Unknown failure kind.');
    assert(typeof failure.target === 'string' && failure.target.length > 0 && failure.target.length <= 100, 'Invalid failure target.');
    assert(finite(failure.start) && failure.start >= 0 && failure.start <= scenario.duration, 'Failure start is outside the scenario.');
    assert(finite(failure.duration) && failure.duration > 0 && failure.duration <= scenario.duration, 'Failure duration is outside supported bounds.');
    if (failure.kind === 'vehicle') {
      assert(/^OHT-\d{3}$/.test(failure.target), `Vehicle target must be an exact OHT id: ${failure.target}`);
      const index = Number(failure.target.slice(4));
      assert(Number.isInteger(index) && index >= 1 && index <= scenario.fleet, `Unknown vehicle failure target: ${failure.target}`);
    }
    if (failure.kind === 'rail') assert(linkById.has(failure.target) && linkById.get(failure.target)!.kind !== 'lifter', `Unknown rail failure target: ${failure.target}`);
    if (failure.kind === 'lifter') assert(layout.links.some(link => link.kind === 'lifter' && (link.id === failure.target || link.resource === failure.target)), `Unknown lifter failure target: ${failure.target}`);
  }
  return scenario;
}

function generateSchedule(scenario: Scenario, layout: Layout, generationWindow = scenario.duration): DemandEvent[] {
  if (scenario.demandMode === 'interval') {
    const random = xorshift(scenario.seed);
    const ports = layout.ports;
    const hotPorts = ports.filter(port => port.area === layout.areas[0]?.id);
    const events: DemandEvent[] = [];
    const append = (at: number): void => {
      let sourcePool = ports;
      if (scenario.distribution === 'hotspot' && hotPorts.length > 1 && random() < 0.7) sourcePool = hotPorts;
      const source = sourcePool[Math.floor(random() * sourcePool.length)];
      let destPool = ports.filter(port => port.id !== source.id);
      if (scenario.distribution === 'hotspot' && hotPorts.some(port => port.id !== source.id) && random() < 0.65) {
        const hotOthers = hotPorts.filter(port => port.id !== source.id);
        if (hotOthers.length) destPool = hotOthers;
      }
      const destination = destPool[Math.floor(random() * destPool.length)];
      events.push({ at, source: source.id, destination: destination.id });
    };
    const initialCount = scenario.initialRequests ?? 2;
    const initialTimes = initialCount === 3 ? [1, 3, 5] : [1, 3];
    let initialChangeIndex = 0, initialPaused = false;
    for (const at of initialTimes) {
      while (initialChangeIndex < (scenario.demandChanges ?? []).length && scenario.demandChanges![initialChangeIndex].at < at) {
        initialPaused = scenario.demandChanges![initialChangeIndex].paused ?? false;
        initialChangeIndex++;
      }
      if (!initialPaused && at < generationWindow) append(at);
    }
    let interval = scenario.demandIntervalSeconds!;
    let paused = false;
    let cursor = initialTimes[initialTimes.length - 1];
    for (const change of scenario.demandChanges ?? []) {
      while (cursor + interval <= change.at + EPSILON && cursor + interval < generationWindow) {
        cursor += interval;
        if (!paused) append(cursor);
      }
      interval = change.intervalSeconds;
      paused = change.paused ?? false;
      // Changes before the fixed initial burst takes place still govern the
      // recurring cadence, but cannot move recurrence into or before that burst.
      cursor = Math.max(change.at, initialTimes[initialTimes.length - 1]);
    }
    while (cursor + interval < generationWindow) {
      cursor += interval;
      if (!paused) append(cursor);
    }
    return events;
  }
  if (scenario.demandMode === 'per-10-seconds') {
    const random = xorshift(scenario.seed);
    const ports = layout.ports;
    const hotPorts = ports.filter(port => port.area === layout.areas[0]?.id);
    const events: Array<DemandEvent & { order: number }> = [];
    let order = 0;
    for (let start = 0; start < generationWindow; start += 10) {
      const bucketDuration = Math.min(10, generationWindow - start);
      // Generation windows and the observation horizon are tick aligned. A
      // partial final window receives its proportional whole-request count.
      const count = Math.floor((scenario.requestsPer10Seconds! * bucketDuration) / 10);
      const tickCount = Math.ceil(bucketDuration / TICK_SECONDS);
      for (let i = 0; i < count; i++) {
        const at = start + Math.floor(random() * tickCount) * TICK_SECONDS;
        let sourcePool = ports;
        if (scenario.distribution === 'hotspot' && hotPorts.length > 1 && random() < 0.7) sourcePool = hotPorts;
        const source = sourcePool[Math.floor(random() * sourcePool.length)];
        let destPool = ports.filter(port => port.id !== source.id);
        if (scenario.distribution === 'hotspot' && hotPorts.some(port => port.id !== source.id) && random() < 0.65) {
          const hotOthers = hotPorts.filter(port => port.id !== source.id);
          if (hotOthers.length) destPool = hotOthers;
        }
        const destination = destPool[Math.floor(random() * destPool.length)];
        events.push({ at, source: source.id, destination: destination.id, order: order++ });
      }
    }
    events.sort((a, b) => a.at - b.at || a.order - b.order);
    return events.map(({ at, source, destination }) => ({ at, source, destination }));
  }
  const count = Math.floor(scenario.demand * generationWindow / 60);
  if (count === 0) return [];
  const random = xorshift(scenario.seed);
  const ports = layout.ports;
  const hotPorts = ports.filter(port => port.area === layout.areas[0]?.id);
  const events: Array<DemandEvent & { order: number }> = [];
  for (let i = 0; i < count; i++) {
    let t: number;
    if (scenario.pattern === 'steady') {
      const base = (i + random() * 0.8) / count;
      t = Math.min(generationWindow, base * generationWindow);
    } else {
      // The peak is centered at 65% of the horizon, with a bounded half-horizon spread.
      const centered = 0.65 + (random() - 0.5) * 0.5;
      t = Math.max(0, Math.min(1, centered)) * generationWindow;
    }
    t = Math.floor(t / TICK_SECONDS) * TICK_SECONDS;
    let sourcePool = ports;
    if (scenario.distribution === 'hotspot' && hotPorts.length > 1 && random() < 0.7) sourcePool = hotPorts;
    const source = sourcePool[Math.floor(random() * sourcePool.length)];
    let destPool = ports.filter(port => port.id !== source.id);
    if (scenario.distribution === 'hotspot' && hotPorts.some(port => port.id !== source.id) && random() < 0.65) {
      const hotOthers = hotPorts.filter(port => port.id !== source.id);
      if (hotOthers.length) destPool = hotOthers;
    }
    const destination = destPool[Math.floor(random() * destPool.length)];
    events.push({ at: t, source: source.id, destination: destination.id, order: i });
  }
  events.sort((a, b) => a.at - b.at || a.order - b.order);
  return events.map(({ at, source, destination }) => ({ at, source, destination }));
}

function generateMultiLargeSchedule(scenario: Scenario, layout: Layout, generationWindow = scenario.duration): DemandEvent[] {
  const events = generateSchedule(scenario, layout, generationWindow);
  const floor0 = layout.ports.filter(port => port.floor === 0), floor1 = layout.ports.filter(port => port.floor === 1);
  if (!floor0.length || !floor1.length) throw new Error('Multi Large demand requires ports on both floors.');
  // A private stream picks which events cross floors and their endpoints. It
  // cannot change timestamps or consume the legacy engine's random stream.
  const random = xorshift(scenario.seed ^ 0x2f3b6d19);
  const crossCount = Math.floor(events.length * 0.4);
  const indices = events.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const cross = new Set(indices.slice(0, crossCount));
  return events.map((event, index) => {
    if (cross.has(index)) {
      const fromFloor = random() < .5 ? floor0 : floor1, toFloor = fromFloor === floor0 ? floor1 : floor0;
      return { ...event, source: fromFloor[Math.floor(random() * fromFloor.length)].id, destination: toFloor[Math.floor(random() * toFloor.length)].id };
    }
    const floor = random() < .5 ? floor0 : floor1;
    const sourceIndex = Math.floor(random() * floor.length), destinationOffset = 1 + Math.floor(random() * (floor.length - 1));
    return { ...event, source: floor[sourceIndex].id, destination: floor[(sourceIndex + destinationOffset) % floor.length].id };
  });
}
function generateScenarioSchedule(scenario: Scenario, layout: Layout, generationWindow = scenario.duration): DemandEvent[] {
  return scenario.operationalVersion === '2.3'
    ? generateMultiLargeSchedule(scenario, layout, generationWindow)
    : generateSchedule(scenario, layout, generationWindow);
}

function initialState(scenario: Scenario, layout: Layout): SimulationState {
  const vehicles: Vehicle[] = Array.from({ length: scenario.fleet }, (_, i) => ({
    id: `OHT-${String(i + 1).padStart(3, '0')}`,
    node: stagingNode(layout, scenario, i + 1),
    progress: 0,
    route: [],
    phase: 'idle',
    serviceRemaining: 0,
    loaded: false,
    waiting: 0,
    failed: false,
    distance: 0,
    parked: true, parkingPending: false, parkingSlot: i,
  }));
  const initialPolicy = scenario.interventionHistoryComplete === false ? scenario.policy : scenario.initialPolicy ?? scenario.policy;
  const multiLifters = scenario.operationalVersion === '2.3' ? (layout.lifters ?? []).map(lifter => ({ resource: lifter.resource, queuedVehicleIds: [], nextQueueSequence: 1, transferTicks: 0, completedTransfers: 0, busyTicks: 0, queueTicks: 0, failureTicks: 0, waitingTicks: 0 })) : undefined;
  return { version: operationalVersionAt(scenario, 0), time: 0, tick: 0, policy: initialPolicy, requests: [], vehicles, demandIndex: 0, reroutes: 0, routingOperations: 0, vehicleBusySeconds: 0, vehicleWaitingSeconds: 0, eventLog: [], storedFoups: [], linkQueues: [], ...(multiLifters ? { multiLifters } : {}), blockedTicks: 0, decisions: {}, operationalCycles: [], preventionCount: 0, recoveryCount: 0 };
}

function assertMultiLifterState(scenario: Scenario, state: SimulationState, layout: Layout): void {
  if (scenario.operationalVersion !== '2.3') {
    assert(state.multiLifters === undefined, 'Single-floor snapshots cannot contain multi-lifter runtime state.');
    return;
  }
  const definitions=layout.lifters??[],runtime=state.multiLifters;
  assert(layout.id==='multi-large'&&layout.multiLargeVersion==='1'&&runtime?.length===definitions.length&&definitions.length===4,'Multi Large snapshot is missing its versioned lifter state.');
  const vehicles=new Map(state.vehicles.map(vehicle=>[vehicle.id,vehicle])),resources=new Set<string>(),owners=new Set<string>(),queued=new Set<string>();
  const clearance=createTickProtection(layout,state.vehicles,(scenario.movementControl??'clearance')==='clearance');
  for(const item of runtime){
    const def=definitions.find(lifter=>lifter.resource===item.resource);
    assert(!!def&&!resources.has(item.resource),`Unknown or duplicate Multi Lifter resource ${item.resource}.`);resources.add(item.resource);
    assert(Array.isArray(item.queuedVehicleIds)&&item.queuedVehicleIds.length<=state.vehicles.length&&new Set(item.queuedVehicleIds).size===item.queuedVehicleIds.length,'Malformed Multi Lifter FIFO queue.');
    assert(Number.isInteger(item.nextQueueSequence)&&item.nextQueueSequence>=1&&Number.isInteger(item.transferTicks)&&item.transferTicks>=0&&item.transferTicks<=20,'Malformed Multi Lifter sequence or transfer tick count.');
    for(const key of ['completedTransfers','busyTicks','queueTicks','failureTicks','waitingTicks'] as const)assert(Number.isInteger(item[key])&&item[key]>=0,`Invalid Multi Lifter counter ${key}.`);
    for(const id of item.queuedVehicleIds){
      assert(vehicles.has(id)&&!queued.has(id),`Unknown or multiply queued Multi Lifter vehicle ${id}.`);queued.add(id);
      const vehicle=vehicles.get(id)!;
      assert(!vehicle.parked&&!vehicle.link&&vehicle.node===def!.entryWaitNodes.find(node=>node===vehicle.node)&&vehicle.route[0]===def!.landingNodes[def!.entryWaitNodes.indexOf(vehicle.node)],`Queued vehicle ${id} is not waiting at its lifter entry.`);
    }
    if(!item.ownerVehicleId){
      assert(!item.phase&&item.transferTicks===0&&item.entryFloor===undefined&&item.exitFloor===undefined&&item.entryLandingNode===undefined&&item.exitLandingNode===undefined&&item.entryWaitNode===undefined&&item.exitWaitNode===undefined&&item.continuationNodes===undefined&&item.verticalTransferCompleted===undefined&&item.ownerQueueSequence===undefined,'Unowned Multi Lifter retains reservation state.');
      continue;
    }
    const id=item.ownerVehicleId,vehicle=vehicles.get(id);
    assert(!!vehicle&&!owners.has(id)&&!queued.has(id),'Multi Lifter owner is missing, duplicated, or also queued.');owners.add(id);
    assert(item.phase==='approach'||item.phase==='transfer'||item.phase==='exit','Multi Lifter owner has no valid lifecycle phase.');
    assert((item.entryFloor===0||item.entryFloor===1)&&(item.exitFloor===0||item.exitFloor===1)&&item.entryWaitNode===def!.entryWaitNodes[item.entryFloor]&&item.exitWaitNode===def!.exitWaitNodes[item.exitFloor]&&item.entryLandingNode===def!.landingNodes[item.entryFloor]&&item.exitLandingNode===def!.landingNodes[item.exitFloor]&&Array.isArray(item.continuationNodes),'Multi Lifter reservation endpoints are invalid.');
    assert(Number.isInteger(item.ownerQueueSequence)&&item.ownerQueueSequence!>0&&item.ownerQueueSequence!<item.nextQueueSequence,'Multi Lifter owner sequence is invalid.');
    if(item.phase==='approach'){
      const link=vehicle.link?layout.links.find(edge=>edge.id===vehicle.link):undefined;
      assert((vehicle.node===item.entryWaitNode&&(!vehicle.link||link?.resource===item.resource&&link.from===item.entryWaitNode&&link.to===item.entryLandingNode))
        ||(!vehicle.link&&vehicle.node===item.entryLandingNode),`Approaching Multi Lifter owner ${id} is not on its entry path.`);
      assert(item.transferTicks===0&&!item.verticalTransferCompleted,'Multi Lifter approach has transfer progress.');
    }
    if(item.phase==='transfer'){
      const link=vehicle.link?layout.links.find(edge=>edge.id===vehicle.link):undefined;
      assert(!!link&&link.kind==='lifter'&&link.resource===item.resource&&link.from===item.entryLandingNode&&link.to===item.exitLandingNode&&Math.abs(vehicle.progress-item.transferTicks/20)<EPSILON,'Multi Lifter transfer state disagrees with its vehicle motion.');
    }
    if(item.phase==='exit'){
      const link=vehicle.link?layout.links.find(edge=>edge.id===vehicle.link):undefined;
      assert(vehicle.node===item.exitLandingNode&&(!vehicle.link||(link?.resource===item.resource&&link.from===item.exitLandingNode&&link.to===item.exitWaitNode)),'Multi Lifter exit state disagrees with its vehicle motion.');
      assert(item.verticalTransferCompleted ? item.transferTicks===20 : item.transferTicks===0&&item.entryFloor===item.exitFloor,'Multi Lifter exit has inconsistent transfer completion.');
    }
    const departure=layout.links.find(link=>link.from===item.exitLandingNode&&link.to===item.exitWaitNode);
    assert(!!departure,`Multi Lifter ${item.resource} has no certified departure link.`);
    const footprintBlockers=[
      ...clearance.nodeBlockers(item.entryLandingNode!,id),
      ...clearance.nodeBlockers(item.exitLandingNode!,id),
      ...clearance.blockers(departure!,id),
    ];
    assert(footprintBlockers.length===0,`Multi Lifter ${item.resource} reserved footprint is occupied by ${[...new Set(footprintBlockers.map(blocker=>blocker.vehicleId))].join(', ')}.`);
  }
  assert(resources.size===4,'Multi Lifter runtime resources are incomplete.');
}

function seedFleetInterventions(scenario: Scenario): Scenario {
  if (scenario.interventions || scenario.version !== 2) return scenario;
  let fleet = scenario.fleet;
  const events: AnalysisIntervention[] = (scenario.fleetChanges ?? []).map((change, index) => {
    const before = fleet;
    fleet += change.vehicleIds.length;
    const sequence = index + 1;
    return { id: `OA-${String(sequence).padStart(6, '0')}`, sequence, at: change.at, type: 'fleet-add' as const, before, after: fleet, vehicleIds: [...change.vehicleIds] };
  });
  if (events.length) scenario.interventions = events;
  return scenario;
}

function policyAtScenarioTime(scenario: Scenario, time: number): Policy {
  if (scenario.interventionHistoryComplete === false) return scenario.policy;
  let policy = scenario.initialPolicy ?? scenario.policy;
  for (const event of scenario.interventions ?? []) if (event.type === 'policy' && event.at <= time + EPSILON) policy = event.after;
  return policy;
}

export type AdmissionDiagnostic = { tick: number; time: number; vehicleId: string; linkId: string; admitted: boolean; blockers: MovementBlocker[]; queueHead?: string; sectionOccupied: boolean; cycleRisk: boolean; failedLink: boolean };

export class Engine {
  private admissionDiagnostics?: Map<string, AdmissionDiagnostic>;

  /** Transient, opt-in facts from the admission gate; never serialized or used by control. */
  setLivenessDiagnosticsEnabled(enabled: boolean): void { this.admissionDiagnostics = enabled ? new Map() : undefined; }

  getLastAdmissionDiagnostics(): AdmissionDiagnostic[] {
    return [...(this.admissionDiagnostics?.values() ?? [])].map(item => ({ ...item, blockers: item.blockers.map(blocker => ({ ...blocker })) }));
  }

  public scenario: Scenario;
  public layout: Layout;
  public state: SimulationState;
  public schedule: DemandEvent[];
  private analysis: AnalysisState;
  private readonly analysisEnabled: boolean;
  private interventionCursor = 0;
  private readonly nodeById: Map<string, Layout['nodes'][number]>;
  private readonly portById: Map<string, Port>;
  private readonly linkById: Map<string, Link>;
  private readonly outgoing: Map<string, Link[]>;
  private readonly incoming: Map<string, Link[]>;
  private readonly routeNodeIndex: Map<string, number>;
  private readonly routeCosts: Float64Array;
  private readonly routeLengths: Float64Array;
  private readonly routeVisited: Uint8Array;
  private readonly routePrevious: Array<PreviousRouteEdge | undefined>;
  private readonly transitNodes = new Set<string>();
  private readonly portNodes = new Set<string>();
  private readonly multiLifterByResource = new Map<string, MultiLargeLifter>();
  private parkingPaths = new Map<string,{node:string;nodes:string[]}>();
  private parkingPathSignature = '';
  private candidatePathCache = new Map<string,RouteCandidate[]>();
  private tickStartTime = 0;
  private tickProtection?: TickProtection;
  private tickEdgeCosts?: Map<string, number>;
  private operationalTickActive = false;
  private routingMs = 0;
  private routingDecisions = 0;
  private tutorialControl = false;
  private tutorialSuppressDispatch = false;
  private tutorialRouteRequest?: string;
  private tutorialStage?: TutorialEngineStage;

  constructor(scenario: Scenario, options: { analysis?: boolean } = {}) {
    this.analysisEnabled = options.analysis !== false;
    this.scenario = validateScenario(seedFleetInterventions(validateScenario(scenario)));
    if (this.scenario.initialPolicy && this.scenario.interventionHistoryComplete !== false) this.scenario.policy = this.scenario.initialPolicy;
    this.layout = clone(getLayout(this.scenario.layoutId, this.scenario.layoutVersion));
    for (const lifter of this.layout.lifters ?? []) this.multiLifterByResource.set(lifter.resource, lifter);
    for (const link of this.layout.links) {
      link.capacity = 1;
    }
    for (const port of this.layout.ports) {
      port.capacity = port.kind === 'stocker' ? this.scenario.storageCapacity : Math.min(port.capacity, this.scenario.storageCapacity);
    }
    this.nodeById = new Map(this.layout.nodes.map(node => [node.id, node]));
    this.portById = new Map(this.layout.ports.map(port => [port.id, port]));
    for(const port of this.layout.ports){this.transitNodes.add(port.node);this.portNodes.add(port.node);}
    for(const node of this.layout.parkingNodes??[])this.transitNodes.add(node);
    this.linkById = new Map(this.layout.links.map(link => [link.id, link]));
    this.outgoing = new Map(this.layout.nodes.map(node => [node.id, []]));
    this.incoming = new Map(this.layout.nodes.map(node => [node.id, []]));
    this.routeNodeIndex = new Map(this.layout.nodes.map((node, index) => [node.id, index]));
    this.routeCosts = new Float64Array(this.layout.nodes.length);
    this.routeLengths = new Float64Array(this.layout.nodes.length);
    this.routeVisited = new Uint8Array(this.layout.nodes.length);
    this.routePrevious = new Array(this.layout.nodes.length);
    for (const link of this.layout.links) { this.outgoing.get(link.from)!.push(link); this.incoming.get(link.to)!.push(link); }
    for (const edges of this.outgoing.values()) edges.sort((a, b) => a.id.localeCompare(b.id));
    for (const edges of this.incoming.values()) edges.sort((a, b) => a.id.localeCompare(b.id));
    this.schedule = generateScenarioSchedule(this.scenario, this.layout, this.scenario.demandWindow ?? this.scenario.duration);
    this.state = initialState(this.scenario, this.layout);
    this.analysis = createAnalysisState(0, this.scenario.interventionHistoryComplete !== false);
    this.refreshParkingPaths();
    this.applyInterventionsThroughCurrentTime();
    this.applyFleetChangesThroughCurrentTime();
    assertInvariants(this);
  }

  setPolicy(policy: Policy): void {
    assert(policy === 'DBR' || policy === 'CBR', 'Policy must be DBR or CBR.');
    const before = this.state.policy;
    if (before === policy) return;
    if (this.scenario.initialPolicy === undefined) this.scenario.initialPolicy = before;
    this.state.policy = policy;
    this.scenario.policy = policy;
    this.tickEdgeCosts = undefined;
    this.recordLiveIntervention({ at: this.state.time, type: 'policy', before, after: policy });
  }

  /** Explicitly branch old saves at the next native boundary; never reinterpret their prefix. */
  enableTransportRecovery(): void {
    if (this.scenario.transportRecovery) return;
    assert(this.state.time + TICK_SECONDS <= this.scenario.duration, 'No future native tick remains for recovery activation.');
    assert((this.scenario.deadlockPolicy ?? 'prevent-recover') === 'prevent-recover', 'Recovery activation requires the prevent-recover control policy.');
    const after = { version: '1.0' as const, startAt: this.state.time + TICK_SECONDS };
    this.scenario = validateScenario({ ...this.scenario, operationalVersion: '2.2', transportRecovery: after });
    this.recordLiveIntervention({ at: this.state.time, type: 'transport-recovery', before: null, after });
  }

  /** Change interval demand from the live clock while retaining all generated request history. */
  setDemandInterval(intervalSeconds: number, stage: DemandStage): void {
    assert(this.scenario.demandMode === 'interval', 'Live interval demand requires interval demand mode on operational engines 2.1/2.2.');
    const before = this.demandSettings();
    this.applyDemandChange({ at: this.state.time, intervalSeconds, stage });
    this.recordLiveIntervention({ at: this.state.time, type: 'demand-rate', before, after: this.demandSettings() });
  }

  /** Pause or resume future interval-demand releases without affecting work already created. */
  setDemandPaused(paused: boolean): void {
    assert(this.scenario.demandMode === 'interval', 'Live interval demand requires interval demand mode on operational engines 2.1/2.2.');
    assert(typeof paused === 'boolean', 'Demand pause state must be a boolean.');
    const current = [...(this.scenario.demandChanges ?? [])].reverse().find(change => change.at <= this.state.time);
    const before = current?.paused ?? false;
    this.applyDemandChange({
      at: this.state.time,
      intervalSeconds: current?.intervalSeconds ?? this.scenario.demandIntervalSeconds!,
      stage: current?.stage ?? this.scenario.demandStage ?? 'relaxed',
      paused,
    });
    this.recordLiveIntervention({ at: this.state.time, type: 'demand-pause', before, after: paused });
  }

  private recordLiveIntervention(event: Parameters<typeof recordIntervention>[1]): void {
    const now = this.state.time;
    const supersededTypes = event.type === 'demand-rate' || event.type === 'demand-pause' ? new Set(['demand-rate', 'demand-pause']) : new Set([event.type]);
    const prior = this.scenario.interventions ?? [];
    const applied = prior.filter(item => item.at <= now + EPSILON);
    const future = prior.filter(item => item.at > now + EPSILON && !supersededTypes.has(item.type));
    this.analysis.events = this.analysis.events.filter(item => item.at <= now + EPSILON);
    this.analysis.nextEventSequence = Math.max(applied.at(-1)?.sequence ?? 0, future.at(-1)?.sequence ?? 0, this.analysis.nextEventSequence - 1) + 1;
    const recorded = recordIntervention(this.analysis, event);
    const history = [...applied, recorded, ...future];
    let nextSequence = recorded.sequence + 1;
    for (let index = applied.length + 1; index < history.length; index++) {
      const item = history[index];
      history[index] = { ...item, id: `OA-${String(nextSequence).padStart(6, '0')}`, sequence: nextSequence++ } as AnalysisIntervention;
    }
    if (history.length > 2_000) {
      const dropped = history.length - 2_000;
      history.splice(0, dropped);
      this.analysis.historyComplete = false;
      this.scenario.interventionHistoryComplete = false;
    }
    this.scenario.interventions = history;
    if (this.scenario.interventionHistoryComplete !== false && !history.some(item => item.type === 'policy')) this.scenario.initialPolicy = undefined;
    this.scenario = validateScenario(this.scenario);
    this.interventionCursor = history.filter(item => item.at <= now + EPSILON).length;
  }

  private applyInterventionsThroughCurrentTime(): void {
    const history = this.scenario.interventions ?? [];
    while (this.interventionCursor < history.length && history[this.interventionCursor].at <= this.state.time + EPSILON) {
      const event = history[this.interventionCursor++];
      if (event.type === 'policy') {
        this.state.policy = event.after;
        this.scenario.policy = event.after;
        this.tickEdgeCosts = undefined;
      }
      if (this.analysisEnabled) {
        this.analysis.events.push(clone(event));
        if (this.analysis.events.length > 2_000) {
          this.analysis.events.shift();
          this.analysis.historyComplete = false;
        }
        this.analysis.nextEventSequence = event.sequence + 1;
      }
    }
  }

  private demandSettings(): DemandSettings {
    const current = [...(this.scenario.demandChanges ?? [])].reverse().find(change => change.at <= this.state.time);
    return {
      intervalSeconds: current?.intervalSeconds ?? this.scenario.demandIntervalSeconds ?? 0,
      stage: current?.stage ?? this.scenario.demandStage ?? 'relaxed',
      paused: current?.paused ?? false,
    };
  }

  private applyDemandChange(change: DemandChange): void {
    const changes: DemandChange[] = (this.scenario.demandChanges ?? []).filter(item => item.at < this.state.time);
    changes.push(change);
    const candidate = validateScenario({ ...this.scenario, demandChanges: changes }, { allowPendingInterventions: true });
    const generated = generateScenarioSchedule(candidate, this.layout, candidate.demandWindow ?? candidate.duration);
    assert(generated.length >= this.state.demandIndex, 'Demand change would remove consumed requests.');
    for (let i = 0; i < this.state.demandIndex; i++) {
      const request = this.state.requests[i], event = generated[i];
      assert(!!event && request.created === event.at && request.source === event.source && request.destination === event.destination, 'Demand change would alter consumed request history.');
    }
    this.scenario = candidate;
    this.schedule = generated;
  }

  /** Add parked OHTs at the current completed tick boundary without changing existing work. */
  addVehicles(count: number): FleetChange {
    assert(Number.isInteger(count) && count > 0, 'Vehicle addition count must be a positive integer.');
    assertInvariants(this);
    const changes = this.scenario.fleetChanges ?? [];
    const appliedCount = this.state.fleetAccounting?.appliedChangeCount ?? 0;
    const retained = changes.slice(0, appliedCount);
    const nextVehicle = this.state.vehicles.length + 1;
    assert(nextVehicle + count - 1 <= 300, 'Initial fleet plus additions must not exceed 300 vehicles.');
    const usedEventIds = new Set(retained.map(change => change.eventId));
    let eventNumber = 1;
    // Imported event IDs are opaque strings. Searching at most 300 small IDs
    // avoids unsafe-integer suffixes making an increment loop stop advancing.
    while (usedEventIds.has(`FLEET-ADD-${String(eventNumber).padStart(4, '0')}`)) eventNumber++;
    const change: FleetChange = {
      eventId: `FLEET-ADD-${String(eventNumber).padStart(4, '0')}`,
      at: this.state.time,
      vehicleIds: Array.from({ length: count }, (_, index) => `OHT-${String(nextVehicle + index).padStart(3, '0')}`),
    };
    const candidateScenario = validateScenario({
      ...this.scenario,
      version: 2,
      fleetChanges: [...retained, change],
      interventions: this.scenario.interventions?.filter(event => event.at <= this.state.time + EPSILON || event.type !== 'fleet-add'),
    }, { allowPendingInterventions: true });
    const candidateState = clone(this.state);
    // Old saves permit a different array order. Feature-bearing snapshots use
    // canonical ID order so the first intervention also matches seeded replay.
    if (this.scenario.version === 1) candidateState.vehicles.sort((a, b) => a.id.localeCompare(b.id));
    this.applyFleetChange(change, candidateState);
    const previousScenario = this.scenario, previousState = this.state;
    try {
      this.scenario = candidateScenario;
      this.state = candidateState;
      assertInvariants(this);
    } catch (error) {
      this.scenario = previousScenario;
      this.state = previousState;
      throw error;
    }
    this.recordLiveIntervention({ at: change.at, type: 'fleet-add', before: candidateState.vehicles.length - count, after: candidateState.vehicles.length, vehicleIds: [...change.vehicleIds] });
    return clone(change);
  }

  getAnalysis(windowSeconds = 300): AnalysisReport {
    const queues = this.state.linkQueues ?? [];
    return makeAnalysisReport(this.analysis, {
      now: this.state.time,
      unfinished: this.state.requests.filter(request => request.phase !== 'completed').length,
      // Passability is an instant observation. Native movement's overlap check
      // describes the preceding tick and must not shift closure boundaries here.
      links: this.layout.links.map(link => ({ id: link.id, closed: this.scenario.failures.some(failure =>
        failure.start <= this.state.time && this.state.time < failure.start + failure.duration &&
        (failure.kind === 'rail' && failure.target === link.id || link.kind === 'lifter' && failure.kind === 'lifter' && (failure.target === link.id || failure.target === link.resource))) })),
      queues,
      vehicles: this.state.vehicles,
    }, windowSeconds);
  }

  getFleetMetrics(): FleetMetrics | null {
    const accounting = this.state.fleetAccounting;
    if (!accounting) return null;
    const availableSeconds = fleetAvailableSeconds(this.scenario, this.state.time);
    const busySeconds = this.state.vehicleBusySeconds, waitingSeconds = this.state.vehicleWaitingSeconds;
    return {
      fleet: this.state.vehicles.length,
      availableSeconds,
      busySeconds,
      waitingSeconds,
      utilization: availableSeconds > 0 ? Math.min(1, busySeconds / availableSeconds) : 0,
      congestion: availableSeconds > 0 ? Math.min(1, waitingSeconds / availableSeconds) : 0,
      observedSince: accounting.observedSince,
      vehicles: accounting.vehicles.map(vehicle => ({
        ...vehicle,
        utilization: vehicle.availableSeconds > 0 ? Math.min(1, vehicle.busySeconds / vehicle.availableSeconds) : 0,
      })),
    };
  }

  private applyFleetChangesThroughCurrentTime(): boolean {
    const changes = this.scenario.fleetChanges;
    if (!changes?.length) return false;
    let applied = this.state.fleetAccounting?.appliedChangeCount ?? 0;
    let changed = false;
    while (applied < changes.length && changes[applied].at <= this.state.time + EPSILON) {
      const change = changes[applied];
      this.applyFleetChange(change);
      applied++;
      changed = true;
    }
    return changed;
  }

  private applyFleetChange(change: FleetChange, state: SimulationState = this.state): void {
    if (!state.fleetAccounting) {
      state.fleetAccounting = {
        appliedChangeCount: 0,
        observedSince: state.time,
        baselineBusySeconds: state.vehicleBusySeconds,
        baselineWaitingSeconds: state.vehicleWaitingSeconds,
        vehicles: state.vehicles.map(vehicle => ({
          id: vehicle.id,
          introducedAt: 0,
          observedSince: state.time,
          availableSeconds: 0,
          busySeconds: 0,
          waitingSeconds: 0,
        })),
      };
    }
    const accounting = state.fleetAccounting;
    for (const id of change.vehicleIds) {
      const ordinal = Number(id.slice(4));
      const parkingNodes = this.layout.parkingNodes ?? [];
      assert(parkingNodes.length > 0, 'V2 layout has no off-rail parking nodes.');
      const vehicle: Vehicle = {
        id,
        node: stagingNode(this.layout, this.scenario, ordinal),
        progress: 0,
        route: [],
        phase: 'idle',
        serviceRemaining: 0,
        loaded: false,
        waiting: 0,
        failed: false,
        distance: 0,
        parked: true,
        parkingPending: false,
        parkingSlot: ordinal - 1,
      };
      state.vehicles.push(vehicle);
      accounting.vehicles.push({
        id,
        introducedAt: state.time,
        observedSince: state.time,
        availableSeconds: 0,
        busySeconds: 0,
        waitingSeconds: 0,
      });
    }
    accounting.appliedChangeCount++;
  }

  private recordFleetTick(busyByVehicle: Map<string, TickResult>): void {
    const accounting = this.state.fleetAccounting;
    if (!accounting) return;
    for (const vehicleTime of accounting.vehicles) {
      const result = busyByVehicle.get(vehicleTime.id);
      assert(!!result, `Fleet accounting is missing tick result for ${vehicleTime.id}.`);
      vehicleTime.availableSeconds = stableRound(vehicleTime.availableSeconds + TICK_SECONDS);
      if (result.busy) vehicleTime.busySeconds = stableRound(vehicleTime.busySeconds + TICK_SECONDS);
      if (result.waiting) vehicleTime.waitingSeconds = stableRound(vehicleTime.waitingSeconds + TICK_SECONDS);
    }
  }

  injectFailure(kind: Failure['kind'], target: string, duration: number): void {
    const next = [...this.scenario.failures, { kind, target, start: this.state.time, duration }];
    assert(next.length <= 20, 'At most 20 failure events are supported.');
    this.scenario = validateScenario({ ...this.scenario, failures: next });
    // Versioned Multi replay derives failure diagnostics from the same timed inputs.
    // Preserve the existing immediate log contract for all single-floor saves.
    if (this.scenario.operationalVersion !== '2.3') this.log(`${kind} failure started: ${target}`);
  }

  getPortOccupancy(portId: string): PortOccupancy {
    const port = this.portById.get(portId);
    assert(!!port, `Unknown port: ${portId}`);
    const stored = this.state.storedFoups.filter(foup => foup.portId === portId);
    const reservedRequests = this.state.requests.filter(request => request.destination === portId && ['assigned', 'pickup', 'loaded', 'dropoff'].includes(request.phase));
    return { portId, stored: stored.length, reserved: reservedRequests.length, capacity: port.capacity, requestIds: [...stored.map(x => x.requestId), ...reservedRequests.map(x => x.id)].sort() };
  }

  /** Read-only preview of the next seeded demand event. */
  getNextDemand(): DemandEvent | undefined {
    const event = this.schedule[this.state.demandIndex];
    return event ? { ...event } : undefined;
  }

  /** Enables transient first-play gates. They are intentionally excluded from snapshots. */
  enableTutorialControl(): void {
    this.tutorialControl = true;
    this.tutorialSuppressDispatch = false;
    this.tutorialRouteRequest = undefined;
    this.tutorialStage = 'request';
  }

  disableTutorialControl(): void {
    this.tutorialControl = false;
    this.tutorialSuppressDispatch = false;
    this.tutorialRouteRequest = undefined;
    this.tutorialStage = undefined;
  }

  /** Execute one real fixed-tick tutorial command without changing the ordinary step path. */
  stepTutorial(action: TutorialEngineAction): void {
    assert(this.tutorialControl, 'Tutorial control is not enabled.');
    assert(this.state.time + TICK_SECONDS <= this.scenario.duration + EPSILON, 'The tutorial scenario has reached its observation limit.');
    const expectedStage: Record<TutorialEngineAction, TutorialEngineStage> = {
      'release-request': 'request', dispatch: 'dispatch', 'empty-travel': 'empty-travel', pickup: 'pickup', 'loaded-travel': 'loaded-travel', dropoff: 'dropoff',
    };
    assert(this.tutorialStage === expectedStage[action], 'This tutorial command is not authorized at the current checkpoint.');
    if (action === 'release-request') {
      assert(this.state.requests.length === 0, 'The tutorial request has already been released.');
      const next = this.getNextDemand();
      assert(!!next && next.at <= this.state.time + TICK_SECONDS + EPSILON, 'The next scheduled tutorial request is not ready yet.');
      this.tutorialSuppressDispatch = true;
    } else if (action === 'dispatch') {
      assert(this.state.requests.length === 1 && this.state.requests[0].phase === 'pending', 'The tutorial request is not waiting for dispatch.');
      this.tutorialSuppressDispatch = false;
    }
    try { this.tickOnce(); }
    finally { this.tutorialSuppressDispatch = false; }
    const request = this.state.requests[0];
    const vehicle = request?.vehicle ? this.state.vehicles.find(item => item.id === request.vehicle) : undefined;
    if (action === 'release-request' && request) this.tutorialStage = 'dispatch';
    else if (action === 'dispatch' && request?.phase === 'assigned') this.tutorialStage = 'empty-travel';
    else if (action === 'empty-travel' && request && vehicle && request.phase === 'assigned' && vehicle.phase === 'empty' && !vehicle.link && vehicle.node === this.portById.get(request.source)!.node) this.tutorialStage = 'pickup';
    else if (action === 'pickup' && request?.phase === 'loaded') this.tutorialStage = 'route';
    else if (action === 'loaded-travel' && request && vehicle && request.phase === 'loaded' && vehicle.loaded && !vehicle.link && vehicle.node === this.portById.get(request.destination)!.node) this.tutorialStage = 'dropoff';
    else if (action === 'dropoff' && request?.phase === 'completed') this.tutorialStage = 'complete';
  }

  /** Plan and record the actual MCS route after FOUP pickup, without advancing simulation time. */
  planTutorialLoadedRoute(requestId: string): DecisionInspection {
    assert(this.tutorialControl, 'Tutorial control is not enabled.');
    const request = this.state.requests.find(item => item.id === requestId);
    const vehicle = request?.vehicle ? this.state.vehicles.find(item => item.id === request.vehicle) : undefined;
    assert(!!request && !!vehicle && request.phase === 'loaded' && vehicle.loaded && vehicle.phase === 'loaded' && !vehicle.link && vehicle.node === this.portById.get(request.source)!.node, 'The tutorial FOUP must be picked up and held at its source before route planning.');
    if (this.tutorialRouteRequest === requestId) {
      const existing = this.inspectDecision(vehicle.id);
      assert(!!existing, 'The tutorial route decision is missing.');
      return existing;
    }
    assert(this.tutorialStage === 'route', 'The tutorial is not waiting for route planning.');
    assert(vehicle.route.length === 0, 'The tutorial route was already planned.');
    const target = this.portById.get(request.destination)!.node;
    const occupancy = this.makeOccupancy();
    const previousTickActive = this.operationalTickActive;
    const previousCosts = this.tickEdgeCosts;
    this.operationalTickActive = false;
    this.tickEdgeCosts = undefined;
    let path: RouteCandidate | undefined;
    try { path = this.v2BestPath(vehicle.node, target, occupancy); }
    finally { this.operationalTickActive = previousTickActive; this.tickEdgeCosts = previousCosts; }
    assert(!!path && path.nodes.length > 0, 'The MCS could not find a legal route to the destination.');
    vehicle.route = [...path.nodes];
    this.recordCurrentDecision(vehicle, target, occupancy, path, 'MCS selected the loaded route after the tutorial route command.');
    this.tutorialRouteRequest = requestId;
    this.tutorialStage = 'loaded-travel';
    const decision = this.inspectDecision(vehicle.id);
    assert(!!decision, 'The MCS route decision could not be inspected.');
    return decision;
  }

  step(ticks = 1): void {
    assert(!this.tutorialControl, 'Use tutorial commands while tutorial control is enabled.');
    assert(Number.isInteger(ticks) && ticks >= 0 && ticks <= 3_600, 'Step count must be an integer from 0 to 3600.');
    for (let i = 0; i < ticks; i++) {
      if (this.state.time + EPSILON >= this.scenario.duration) break;
      this.tickOnce();
    }
  }

  snapshot(): Snapshot {
    return { version: 1, scenario: clone(this.scenario), state: clone(this.state), ...(this.analysisEnabled ? { analysis: publicationCopy(this.analysis) } : {}) };
  }

  /** Next exogenous demand timestamp; undefined means the schedule is exhausted. */
  getNextDemandTime(): number | undefined {
    return this.schedule[this.state.demandIndex]?.at;
  }

  static restore(value: unknown): Engine {
    assert(!!value && typeof value === 'object' && !Array.isArray(value), 'Snapshot must be an object.');
    const snapshot = value as Partial<Snapshot>;
    assert(snapshot.version === 1, 'Unsupported snapshot version.');
    const scenario = validateScenario(snapshot.scenario);
    const savedScenarioPolicy = scenario.policy;
    const engine = new Engine(scenario);
    assert(!!snapshot.state && typeof snapshot.state === 'object', 'Snapshot state is missing.');
    engine.state = clone(snapshot.state as SimulationState);
    assert(engine.state.policy === savedScenarioPolicy && engine.state.policy === policyAtScenarioTime(scenario, engine.state.time), 'Snapshot policy does not match scenario policy (saved history at this native tick).');
    // Diagnostics on a restored state describe its last completed interval.
    // Recreate that interval boundary so failures and persistent waits have
    // the same interpretation before and after restore.
    engine.tickStartTime = Math.max(0, engine.state.time - TICK_SECONDS);
    engine.interventionCursor = (engine.scenario.interventions ?? []).filter(event => event.at <= engine.state.time + EPSILON).length;
    engine.scenario.policy = savedScenarioPolicy;
    const completedCount = engine.state.requests.filter(request => request.phase === 'completed').length;
    engine.analysis = snapshot.analysis === undefined
      ? createAnalysisState(engine.state.time, false, engine.state.requests.length, completedCount)
      : validateAnalysisState(snapshot.analysis, {
        now: engine.state.time,
        requestCount: engine.state.requests.length,
        completedCount,
        linkIds: new Set(engine.layout.links.map(link => link.id)),
        vehicleIds: new Set(engine.state.vehicles.map(vehicle => vehicle.id)),
      });
    if (snapshot.analysis === undefined) {
      engine.analysis.events = (engine.scenario.interventions ?? []).filter(event => event.at <= engine.state.time + EPSILON).map(clone);
      engine.analysis.nextEventSequence = (engine.analysis.events.at(-1)?.sequence ?? 0) + 1;
    } else {
      engine.analysis.historyComplete = engine.analysis.historyComplete && engine.scenario.interventionHistoryComplete !== false;
      const expectedEvents = (engine.scenario.interventions ?? []).filter(event => event.at <= engine.state.time + EPSILON);
      assert(JSON.stringify(engine.analysis.events) === JSON.stringify(expectedEvents.slice(-2_000)), 'Operations analysis interventions disagree with scenario replay history.');
    }
    assert(engine.analysis.lastCreated === engine.state.requests.length && engine.analysis.lastCompleted === completedCount, 'Operations analysis counters do not match native request history.');
    engine.validateRestoredState();
    assertInvariants(engine);
    return engine;
  }

  private validateRestoredState(): void {
    const s = this.state;
    assertMultiLifterState(this.scenario,s,this.layout);
    assert(s.version === operationalVersionAt(this.scenario, s.time), 'Engine-state version disagrees with the configured recovery activation boundary.');
    assert(finite(s.time) && s.time >= 0 && s.time <= this.scenario.duration && Number.isInteger(s.time / TICK_SECONDS), 'Invalid snapshot time.');
    assert(s.tick === Math.round(s.time / TICK_SECONDS), 'Snapshot tick and time disagree.');
    assert(s.policy === 'DBR' || s.policy === 'CBR', 'Invalid snapshot policy.');
    assert(s.policy === this.scenario.policy, 'Snapshot policy does not match scenario policy.');
    assert(Array.isArray(s.requests) && s.requests.length <= this.schedule.length, 'Invalid request collection.');
    assert(Array.isArray(s.vehicles), 'Snapshot fleet vehicles are missing.');
    assertFleetAccounting(this.scenario, s, this.layout);
    if (this.scenario.version === 1) assert(s.vehicles.length === this.scenario.fleet, 'Snapshot fleet size mismatch.');
    assert(Number.isInteger(s.demandIndex) && s.demandIndex >= 0 && s.demandIndex <= this.schedule.length && s.demandIndex === s.requests.length, 'Invalid demand cursor.');
    for (const key of ['reroutes', 'routingOperations', 'vehicleBusySeconds', 'vehicleWaitingSeconds'] as const) assert(finite(s[key]) && s[key] >= 0, `Invalid state counter ${key}.`);
    assert(Array.isArray(s.eventLog) && s.eventLog.length <= MAX_EVENTS, 'Invalid event log.');
    assert(Array.isArray(s.storedFoups) && s.storedFoups.length <= this.schedule.length, 'Invalid stored FOUP collection.');
    assert(s.requests.every(req => !!req && typeof req.id === 'string' && this.portById.has(req.source) && this.portById.has(req.destination) && finite(req.created) && finite(req.waiting)), 'Invalid request record.');
    for (let i = 0; i < s.requests.length; i++) {
      const req = s.requests[i], scheduled = this.schedule[i];
      assert(req.id === `TR-${String(i + 1).padStart(4, '0')}` && req.source === scheduled.source && req.destination === scheduled.destination && req.created === scheduled.at, 'Snapshot request history disagrees with seeded schedule.');
    }
    assert(s.vehicles.every(v => !!v && typeof v.id === 'string' && this.nodeById.has(v.node) && Array.isArray(v.route) && finite(v.progress) && finite(v.serviceRemaining) && finite(v.distance)), 'Invalid vehicle record.');
    {
      assert(Array.isArray(s.linkQueues) && finite(s.blockedTicks), 'V2 movement diagnostics are missing.');
      assert(this.layout.parkingNodes?.length, 'V2 layout has no off-rail parking nodes.');
      assert(s.vehicles.every(v => typeof v.parked === 'boolean' && typeof v.parkingPending==='boolean' && finite(v.parkingSlot)), 'V2 vehicle parking state is missing.');
      assert(!!s.decisions && typeof s.decisions === 'object', 'V2 MCS decisions are missing.');
    }
    {
      assert(Array.isArray(s.operationalCycles) && Number.isInteger(s.preventionCount) && s.preventionCount! >= 0 && Number.isInteger(s.recoveryCount) && s.recoveryCount! >= 0, 'Operational cycle diagnostics are missing.');
      const keys:OperationalTimingKey[]=['dispatchWaiting','emptyTravel','pickupWaiting','pickupService','loadedTravel','railWaiting','dropoffWaiting','dropoffService','failureWaiting'];
      assert(s.requests.every(req=>!!req.timing&&keys.every(key=>finite(req.timing![key])&&req.timing![key]>=0)), 'Operational request timing is missing or invalid.');
      for(const req of s.requests){
        const end=req.completed??s.time,sum=keys.reduce((total,key)=>total+req.timing![key],0);
        assert(Math.abs(sum-(end-req.created))<1e-6,`Operational timing does not conserve request ${req.id}.`);
        for(const key of ['assigned','pickupStarted','picked','dropoffStarted','completed'] as const)if(req[key]!==undefined)assert(finite(req[key])&&req[key]!>=req.created&&req[key]!<=s.time,`Operational timestamp ${key} is invalid.`);
      }
      assert(s.operationalCycles!.every(c=>typeof c.signature==='string'&&finite(c.firstSeen)&&c.firstSeen>=0&&c.firstSeen<=s.time&&Array.isArray(c.vehicles)&&Array.isArray(c.edges)&&new Set(c.vehicles).size===c.vehicles.length&&c.vehicles.every(id=>s.vehicles.some(v=>v.id===id))&&c.edges.every(edge=>c.vehicles.includes(edge.vehicleId)&&this.layout.links.some(link=>link.from===edge.from&&link.to===edge.to)&&Array.isArray(edge.blockers)&&edge.blockers.every(id=>c.vehicles.includes(id))&&Array.isArray(edge.resources)&&edge.resources.every(resource=>typeof resource==='string'))), 'Operational cycle signature is invalid.');
      const serialized=JSON.stringify(s.operationalCycles);this.refreshOperationalCycles();assert(JSON.stringify(s.operationalCycles)===serialized,'Operational cycle metadata does not match the current persistent wait graph.');
    }
    assert(s.storedFoups.every(f => !!f && this.portById.has(f.portId) && typeof f.requestId === 'string' && finite(f.releaseAt) && f.releaseAt >= s.time), 'Invalid stored FOUP record.');
  }

  private tickOnce(): void { this.tickOperational(); }

  private tickOperational(): void {
    const s = this.state, previousTime = s.time, nextTime = stableRound(s.time + TICK_SECONDS);
    this.admissionDiagnostics?.clear();
    this.tickStartTime = previousTime; s.time = nextTime; s.tick++;
    s.version = operationalVersionAt(this.scenario, s.time);
    if (this.scenario.operationalVersion === '2.3') {
      for (const failure of this.scenario.failures) {
        if (failure.start >= previousTime && failure.start < nextTime) this.log(`${failure.kind} failure started: ${failure.target}`);
        const end = failure.start + failure.duration;
        // Native failures apply to any overlap with the completed 0.5s interval.
        // Record event end on the first fully available interval, including nonaligned inputs.
        if (end <= previousTime && end > previousTime - TICK_SECONDS) this.log(`${failure.kind} failure ended: ${failure.target}`);
      }
    }
    this.tickEdgeCosts = undefined;
    this.operationalTickActive = true;
    for (const vehicle of s.vehicles) vehicle.failed = this.failureActive('vehicle', vehicle.id);
    this.releaseStored(); this.releaseDemand();
    this.tickProtection = createTickProtection(this.layout, s.vehicles, (this.scenario.movementControl ?? 'clearance') === 'clearance');
    this.pruneMultiLifterQueues();
    this.updateMultiLifterTelemetry();
    const previous = new Map(s.requests.map(request => [request.id, request.phase]));
    const occupancy = this.makeOccupancy();
    this.tickEdgeCosts = this.congestionModel() === 'delay' ? this.buildOperationalEdgeCosts(occupancy) : undefined;
    const dispatchedThisTick=this.tutorialSuppressDispatch ? new Set<string>() : this.dispatchOperational(occupancy);
    const busyByVehicle = new Map<string, TickResult>();
    const waitedLinkByVehicle = this.analysisEnabled ? new Map<string, string>() : undefined;
    const rememberWaitLink = (vehicle: Vehicle) => {
      if (!waitedLinkByVehicle) return;
      const result = busyByVehicle.get(vehicle.id);
      if (!result?.waiting || result.reason === 'port') return;
      const nextNode = vehicle.route[0];
      const queuedLink = nextNode ? this.outgoing.get(vehicle.node)?.find(link => link.to === nextNode)?.id : undefined;
      const linkId = vehicle.link ?? queuedLink;
      if (linkId) waitedLinkByVehicle.set(vehicle.id, linkId);
    };
    for (const vehicle of [...s.vehicles].sort((a,b)=>a.id.localeCompare(b.id))) {
      if (vehicle.parked) { busyByVehicle.set(vehicle.id,{busy:false,waiting:false}); continue; }
      if(dispatchedThisTick.has(vehicle.id)){busyByVehicle.set(vehicle.id,{busy:false,waiting:false});continue;}
      if (vehicle.link) {
        const link = this.linkById.get(vehicle.link)!;
        if (this.scenario.operationalVersion === '2.3' && link.kind === 'lifter') {
          const lifterState=link.resource?this.multiLifterRuntime(link.resource):undefined;
          if(vehicle.failed||this.failureActiveForLink(link)){busyByVehicle.set(vehicle.id,this.waitVehicle(vehicle));if(this.analysisEnabled)rememberWaitLink(vehicle);continue;}
          assert(!!lifterState&&lifterState.ownerVehicleId===vehicle.id&&lifterState.phase==='transfer',`Vehicle ${vehicle.id} is transferring without its lifter reservation.`);
          lifterState.transferTicks++;
          vehicle.distance=stableRound(vehicle.distance+link.length/20);
          if(lifterState.transferTicks===20){
            vehicle.node=link.to;vehicle.progress=0;vehicle.link=undefined;
            if(vehicle.route[0]===vehicle.node)vehicle.route.shift();
            this.tickProtection!.arrive(link.to,vehicle.id);this.decrementV2Occupancy(link,occupancy);
            lifterState.phase='exit';lifterState.completedTransfers++;lifterState.verticalTransferCompleted=true;
          } else vehicle.progress=stableRound(lifterState.transferTicks/20);
          vehicle.waiting=0;vehicle.waitReason=undefined;vehicle.blockingResources=undefined;
          busyByVehicle.set(vehicle.id,{busy:true,waiting:false});
        } else if (vehicle.failed || this.failureActiveForLink(link)) { busyByVehicle.set(vehicle.id,this.waitVehicle(vehicle)); if (this.analysisEnabled) rememberWaitLink(vehicle); continue; }
        else {
        vehicle.waiting = 0; vehicle.waitReason = undefined; vehicle.blockingResources = undefined;
        const meters=SPEED_METERS_PER_SECOND*TICK_SECONDS,remaining=link.length*(1-vehicle.progress);
        if (meters+EPSILON>=remaining) {
          vehicle.distance=stableRound(vehicle.distance+remaining); vehicle.node=link.to; vehicle.progress=0; vehicle.link=undefined;
          if(vehicle.route[0]===vehicle.node)vehicle.route.shift();
          this.tickProtection!.arrive(link.to,vehicle.id); this.decrementV2Occupancy(link,occupancy);
          if(this.scenario.operationalVersion==='2.3'&&link.resource){const lifterState=this.multiLifterRuntime(link.resource);if(lifterState?.ownerVehicleId===vehicle.id&&link.to===lifterState.exitWaitNode)this.completeMultiLifterOwner(lifterState,vehicle.id);}
          if(!vehicle.request&&vehicle.phase==='idle'&&(this.layout.parkingNodes??[]).includes(vehicle.node)){vehicle.parked=true;vehicle.parkingPending=false;}
          busyByVehicle.set(vehicle.id,{busy:true,waiting:false});
        } else { vehicle.progress=stableRound(vehicle.progress+meters/link.length);vehicle.distance=stableRound(vehicle.distance+meters);busyByVehicle.set(vehicle.id,{busy:true,waiting:false}); }
        }
      } else busyByVehicle.set(vehicle.id,this.handleNodeOperational(vehicle,occupancy));
      if (this.analysisEnabled) rememberWaitLink(vehicle);
    }
    let busy=0,waiting=0;
    for(const result of busyByVehicle.values()){if(result.busy)busy++;if(result.waiting)waiting++;}
    s.vehicleBusySeconds=stableRound(s.vehicleBusySeconds+busy*TICK_SECONDS);s.vehicleWaitingSeconds=stableRound(s.vehicleWaitingSeconds+waiting*TICK_SECONDS);
    this.recordFleetTick(busyByVehicle);
    let newlyCompletedCount = 0, newlyCompletedTransportSeconds = this.analysisEnabled ? [] as number[] : undefined, unfinishedCount = 0;
    for(const request of s.requests){
      if (this.analysisEnabled) {
        if (request.completed === s.time) { newlyCompletedCount++; newlyCompletedTransportSeconds!.push(s.time - request.created); }
        if (request.phase !== 'completed') unfinishedCount++;
      }
      request.waiting=stableRound(request.picked===undefined?Math.max(0,s.time-request.created):request.picked-request.created);
      const vehicle=request.vehicle?s.vehicles.find(v=>v.id===request.vehicle):undefined;
      if(vehicle?.waiting&&request.phase!=='completed')request.movementWaiting=stableRound((request.movementWaiting??0)+TICK_SECONDS);
      if(!request.timing)request.timing={dispatchWaiting:0,emptyTravel:0,pickupWaiting:0,pickupService:0,loadedTravel:0,railWaiting:0,dropoffWaiting:0,dropoffService:0,failureWaiting:0};
      const oldPhase=previous.get(request.id);
      const existing=request.created<nextTime-EPSILON;
      if(existing&&oldPhase&&oldPhase!=='completed'){
        const result=vehicle?busyByVehicle.get(vehicle.id):undefined;
        const failing=!!vehicle&&(vehicle.failed||vehicle.waitReason==='failure'||(vehicle.link?this.failureActiveForLink(this.linkById.get(vehicle.link)!):false));
        const startedService=!!vehicle&&((oldPhase==='assigned'&&vehicle.phase==='pickup')||(oldPhase==='loaded'&&vehicle.phase==='dropoff'));
        const key:OperationalTimingKey = failing?'failureWaiting':oldPhase==='pending'?'dispatchWaiting':oldPhase==='pickup'?'pickupService':oldPhase==='dropoff'?'dropoffService':startedService?(oldPhase==='assigned'?'pickupService':'dropoffService'):result?.waiting?(result.reason==='port'?(oldPhase==='assigned'?'pickupWaiting':oldPhase==='loaded'?'dropoffWaiting':'railWaiting'):'railWaiting'):oldPhase==='assigned'?'emptyTravel':oldPhase==='loaded'?'loadedTravel':'railWaiting';
        request.timing[key]=stableRound(request.timing[key]+TICK_SECONDS);
      }
      if(vehicle?.waiting&&request.phase!=='completed'){request.waitReason=vehicle.waitReason;request.blockingResources=vehicle.blockingResources? [...vehicle.blockingResources]:undefined;}
      else if(request.phase!=='completed'){request.waitReason=undefined;request.blockingResources=undefined;}
      const end=request.completed??s.time;
      const sum=Object.values(request.timing).reduce((a,b)=>a+b,0);
      assert(Math.abs(sum-(end-request.created))<1e-6,`Operational lifecycle timing does not conserve ${request.id}: ${sum} != ${end-request.created}.`);
    }
    this.refreshQueuesV2(); s.blockedTicks=(s.blockedTicks??0)+(waiting?1:0);
    this.refreshOperationalCycles();
    if((this.scenario.deadlockPolicy??'prevent-recover')==='prevent-recover'&&s.tick%20===0)this.recoverOperationalCycle(occupancy);
    this.tickProtection=undefined;this.tickEdgeCosts=undefined;this.operationalTickActive=false;
    const fleetChanged = this.applyFleetChangesThroughCurrentTime();
    this.applyInterventionsThroughCurrentTime();
    if (this.scenario.version === 2) {
      if (fleetChanged) assertInvariants(this);
      else assertFleetAccounting(this.scenario, s, this.layout);
    }
    if (this.analysisEnabled) {
      const occupiedByLink = new Map<string, number>();
      for (const vehicle of s.vehicles) if (vehicle.link) occupiedByLink.set(vehicle.link, (occupiedByLink.get(vehicle.link) ?? 0) + TICK_SECONDS);
      const waitingByLink = new Map<string, { seconds: number; ticks: number }>();
      for (const linkId of waitedLinkByVehicle!.values()) {
        const sample = waitingByLink.get(linkId) ?? { seconds: 0, ticks: 0 };
        sample.seconds = stableRound(sample.seconds + TICK_SECONDS);
        sample.ticks++;
        waitingByLink.set(linkId, sample);
      }
      collectAnalysisTick(this.analysis, {
        time: s.time,
        created: s.requests.length,
        completed: newlyCompletedCount + this.analysis.lastCompleted,
        unfinished: unfinishedCount,
        newlyCompletedTransportSeconds: newlyCompletedTransportSeconds!,
        occupiedByLink,
        waitingByLink,
      });
    }
  }

  private mcs() { return this.scenario.mcs ?? DEFAULT_MCS; }
  private congestionModel() { return this.scenario.mcs?.congestionModel ?? ('delay'); }

  private buildOperationalEdgeCosts(occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): Map<string, number> {
    const costs = new Map<string, number>(), byNode = new Map<string, Vehicle[]>(),remainingBySection=new Map<string,number>(),queueBySection=new Map<string,number>(),geometry=getControlGeometry(this.layout);
    if(this.state.policy==='DBR'){for(const link of this.layout.links)costs.set(link.id,stableRound(this.mcs().distanceWeight*link.length));return costs;}
    for (const vehicle of this.state.vehicles){
      if(!vehicle.parked&&!vehicle.link)byNode.set(vehicle.node,[...(byNode.get(vehicle.node)??[]),vehicle]);
      if(vehicle.link){const occupied=this.linkById.get(vehicle.link)!;const section=this.sectionKey(occupied);remainingBySection.set(section,(remainingBySection.get(section)??0)+occupied.length*(1-vehicle.progress));}
    }
    for(const queue of this.state.linkQueues??[]){const queued=this.linkById.get(queue.linkId);if(queued){const section=this.sectionKey(queued);queueBySection.set(section,(queueBySection.get(section)??0)+queue.vehicleIds.length);}}
    const chainMemo=new Map<string,number>(),chainActive=new Set<string>();
    const chainDelay=(node:string):number=>{
      const memo=chainMemo.get(node);if(memo!==undefined)return memo;if(chainActive.has(node))return 0;
      chainActive.add(node);const owner=byNode.get(node)?.[0];let delay=0;
      if(owner){delay+=owner.serviceRemaining;const next=owner.route[0]&&(this.outgoing.get(owner.node)??[]).find(edge=>edge.to===owner.route[0]);if(next&&!this.failureActiveForLink(next)){const clearance=(this.scenario.movementControl??'clearance')==='clearance'?(geometry.originReleaseProgress.get(next.id)??1):1;const nextSeconds=this.scenario.operationalVersion==='2.3'&&next.kind==='lifter'&&next.resource?this.multiLifterDelayEstimate(next.resource)*clearance:next.length*clearance/SPEED_METERS_PER_SECOND;delay+=TICK_SECONDS+nextSeconds+chainDelay(next.to);}}
      chainActive.delete(node);chainMemo.set(node,delay);return delay;
    };
    for (const link of this.layout.links) {
      const section = this.sectionKey(link);
      const multiLifterResource=this.scenario.operationalVersion==='2.3'&&!!link.resource&&this.multiLifterByResource.has(link.resource);
      let delaySeconds:number;
      if(multiLifterResource&&link.kind==='lifter')delaySeconds=this.multiLifterDelayEstimate(link.resource!)+chainDelay(link.to);
      else if(multiLifterResource)delaySeconds=chainDelay(link.to);
      else delaySeconds=(remainingBySection.get(section)??0)/SPEED_METERS_PER_SECOND+(queueBySection.get(section)??0)*link.length/SPEED_METERS_PER_SECOND+chainDelay(link.to);
      const delayMeters = delaySeconds * SPEED_METERS_PER_SECOND;
      const congestion = this.state.policy === 'CBR' ? this.mcs().congestionWeight * delayMeters : 0;
      costs.set(link.id, stableRound(this.mcs().distanceWeight * link.length + congestion));
    }
    return costs;
  }

  private edgeCost(link: Link, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): number {
    if(true&&this.congestionModel()==='delay'&&this.state.policy==='DBR')return stableRound(this.mcs().distanceWeight*link.length);
    const cached = this.operationalTickActive?this.tickEdgeCosts?.get(link.id):undefined;
    if (cached !== undefined) return cached;
    if (this.congestionModel() === 'delay') {
      if(this.operationalTickActive){this.tickEdgeCosts ??= this.buildOperationalEdgeCosts(occupancy);return this.tickEdgeCosts.get(link.id)??link.length;}
      return this.buildOperationalEdgeCosts(occupancy).get(link.id)??link.length;
    }
    const used = occupancy.resources.get(this.sectionKey(link)) ?? occupancy.links.get(link.id) ?? 0;
    const queue = this.queueLengthFor(link);
    const congestion = this.mcs().congestionWeight * link.length * (2.5 * Math.min(1, used) + 0.75 * Math.min(1, queue));
    return this.mcs().distanceWeight * link.length + (this.state.policy === 'CBR' ? congestion : 0);
  }

  private dispatchOperational(occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): Set<string> {
    const policy=this.mcs().dispatchPolicy;
    const pending=this.state.requests.filter(r=>r.phase==='pending').sort((a,b)=>a.created-b.created||a.id.localeCompare(b.id));
    const loads=new Map(this.layout.ports.map(p=>[p.id,0]));
    for(const f of this.state.storedFoups)loads.set(f.portId,(loads.get(f.portId)??0)+1);
    for(const r of this.state.requests)if(['assigned','pickup','loaded','dropoff'].includes(r.phase))loads.set(r.destination,(loads.get(r.destination)??0)+1);
    const idle=this.state.vehicles.filter(v=>v.phase==='idle'&&!v.failed&&!v.link&&(policy==='eta'||v.parked||v.parkingPending)).sort((a,b)=>a.id.localeCompare(b.id));
    const launches=new Set<string>(),dispatched=new Set<string>(),routesBySource=new Map<string,Map<string,RouteCandidate>>();
    for(const request of pending){
      if(!idle.length)break;
      const destination=this.portById.get(request.destination)!;
      if((loads.get(destination.id)??0)>=destination.capacity)continue;
      const target=this.portById.get(request.source)!.node;
      const available=idle.filter(v=>!launches.has(v.node)&&!this.tickProtection!.nodeBlockers(v.node,v.id).length);
      // No remaining idle vehicle can launch in this tick. Skipping later requests
      // cannot change occupancy, queues, loads or assignment outcomes.
      if(!available.length)break;
      let paths=routesBySource.get(target);if(!paths){paths=this.v2PathsToTarget(target,occupancy);routesBySource.set(target,paths);}
      const ranked=available.map(vehicle=>({vehicle,path:paths!.get(vehicle.node)})).filter(x=>!!x.path).sort((a,b)=>a.path!.cost-b.path!.cost||a.vehicle.id.localeCompare(b.vehicle.id));
      const selected=policy==='fifo'?available.map(v=>ranked.find(x=>x.vehicle===v)).find((x):x is typeof ranked[number]=>!!x):ranked[0];
      if(!selected)continue;
      const v=selected.vehicle;v.parked=false;v.parkingPending=false;v.request=request.id;v.phase='empty';v.route=[...selected.path!.nodes];request.vehicle=v.id;request.phase='assigned';request.assigned=this.state.time;request.movementWaiting??=0;
      this.tickProtection!.arrive(v.node,v.id);launches.add(v.node);loads.set(destination.id,(loads.get(destination.id)??0)+1);idle.splice(idle.indexOf(v),1);
      dispatched.add(v.id);
      this.rememberDecision(v.id,'Assigned oldest pending request to a legal route.',policy==='fifo'?'FIFO request and vehicle order':policy==='eta'?'Estimated arrival and request age':'nearest legal vehicle route',v.node,target,[],this.state.policy);
      this.recordCurrentDecision(v,target,occupancy,selected.path,'Assigned oldest pending request to a legal route.');
    }
    return dispatched;
  }

  private handleNodeOperational(vehicle: Vehicle, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): TickResult {
    if(vehicle.failed)return this.waitVehicle(vehicle);
    const ownedLifter=this.multiLifterOwner(vehicle.id);
    if(ownedLifter?.phase==='approach'&&vehicle.node===ownedLifter.entryLandingNode){
      if(ownedLifter.exitFloor===ownedLifter.entryFloor)ownedLifter.phase='exit';
      vehicle.route=ownedLifter.exitFloor===ownedLifter.entryFloor
        ? [ownedLifter.exitWaitNode!,...(ownedLifter.continuationNodes??[])]
        : [ownedLifter.exitLandingNode!,ownedLifter.exitWaitNode!,...(ownedLifter.continuationNodes??[])];
      if(vehicle.route.length)return this.admitOperational(vehicle,vehicle.route[0],occupancy,'lifter-owner');
    }
    if(ownedLifter?.phase==='exit'&&vehicle.node===ownedLifter.exitLandingNode){
      vehicle.route=[ownedLifter.exitWaitNode!,...(ownedLifter.continuationNodes??[])];
      if(vehicle.route.length)return this.admitOperational(vehicle,vehicle.route[0],occupancy,'lifter-owner');
    }
    const req=vehicle.request?this.state.requests.find(r=>r.id===vehicle.request):undefined;
    if(!req){
      if(vehicle.phase!=='idle')return this.waitVehicle(vehicle);
      if(!vehicle.route.length){const park=this.nearestParking(vehicle.node,occupancy);if(park){vehicle.route=[...park.nodes];vehicle.parkingPending=false;}else{vehicle.parkingPending=true;return this.waitVehicle(vehicle);}}
      if(!vehicle.route.length){if((this.layout.parkingNodes??[]).includes(vehicle.node)){vehicle.parked=true;vehicle.parkingPending=false;vehicle.waiting=0;return {busy:false,waiting:false};}return this.waitVehicle(vehicle);}
      return this.admitOperational(vehicle,vehicle.route[0],occupancy,'parking');
    }
    if(vehicle.serviceRemaining>0){
      vehicle.waiting=0;vehicle.serviceRemaining=stableRound(Math.max(0,vehicle.serviceRemaining-TICK_SECONDS));
      if(vehicle.serviceRemaining<=EPSILON){
        if(vehicle.phase==='pickup'){
          vehicle.loaded=true;vehicle.phase='loaded';req.phase='loaded';req.picked=this.state.time;
          if(!this.tutorialControl){const target=this.portById.get(req.destination)!.node,path=this.v2BestPath(vehicle.node,target,occupancy);vehicle.route=path?.nodes??[];this.recordCurrentDecision(vehicle,target,occupancy,path,'Loaded route selected after pickup service.');}
        } else if(vehicle.phase==='dropoff'){
          req.phase='completed';req.completed=this.state.time;
          const dest=this.portById.get(req.destination)!,dwell=dest.kind==='stocker'?STORAGE_DWELL_SECONDS*2:dest.kind==='buffer'?STORAGE_DWELL_SECONDS/2:STORAGE_DWELL_SECONDS;
          this.state.storedFoups.push({requestId:req.id,portId:req.destination,releaseAt:stableRound(this.state.time+dwell)});
          vehicle.request=undefined;vehicle.phase='idle';vehicle.loaded=false;vehicle.serviceRemaining=0;vehicle.route=[];vehicle.parkingPending=true;this.log(`Transport request ${req.id} completed`);
        }
      }
      return {busy:true,waiting:false};
    }
    if(vehicle.phase==='empty'&&vehicle.node===this.portById.get(req.source)!.node){
      const blockers=this.tickProtection!.nodeBlockers(vehicle.node,vehicle.id);
      if(this.portServiceBusy(req.source,vehicle.id)||blockers.length)return this.waitOperational(vehicle,blockers,'port');
      vehicle.waiting=0;vehicle.phase='pickup';req.phase='pickup';req.pickupStarted=this.tickStartTime;vehicle.serviceRemaining=SERVICE_SECONDS;return {busy:true,waiting:false};
    }
    if(vehicle.phase==='loaded'&&vehicle.node===this.portById.get(req.destination)!.node){
      const blockers=this.tickProtection!.nodeBlockers(vehicle.node,vehicle.id);
      if(this.portServiceBusy(req.destination,vehicle.id)||blockers.length)return this.waitOperational(vehicle,blockers,'port');
      vehicle.waiting=0;vehicle.phase='dropoff';req.phase='dropoff';req.dropoffStarted=this.tickStartTime;vehicle.serviceRemaining=SERVICE_SECONDS;return {busy:true,waiting:false};
    }
    const target=vehicle.phase==='empty'?this.portById.get(req.source)!.node:this.portById.get(req.destination)!.node;
    let chosen:RouteCandidate|undefined;
    if(!vehicle.route.length||vehicle.route.at(-1)!==target){chosen=this.v2BestPath(vehicle.node,target,occupancy);vehicle.route=chosen?.nodes??[];if(chosen)this.recordCurrentDecision(vehicle,target,occupancy,chosen,'Route recomputed at a legal node.');}
    else if(this.isNextLinkFailed(vehicle)||(vehicle.waiting>0&&this.state.tick%Math.max(1,Math.round(this.mcs().recalculationInterval/TICK_SECONDS))===0)){
      const alternatives=this.v2BestPath(vehicle.node,target,occupancy),current=this.routeCost(vehicle.node,vehicle.route,occupancy);
      if(alternatives&&(!Number.isFinite(current)||alternatives.cost<current*(1-this.mcs().rerouteThreshold))){chosen=alternatives;vehicle.route=chosen.nodes;this.state.reroutes++;this.recordCurrentDecision(vehicle,target,occupancy,chosen,'Congestion or blockage justified a node-only reroute.');}
    }
    if(!vehicle.route.length){for(const queue of this.state.linkQueues??[])queue.vehicleIds=queue.vehicleIds.filter(id=>id!==vehicle.id);this.removeFromMultiLifterQueues(vehicle.id);return this.waitVehicle(vehicle);}
    return this.admitOperational(vehicle,vehicle.route[0],occupancy,'request');
  }

  private multiLifterRuntime(resource: string): MultiLifterRuntime | undefined {
    return this.scenario.operationalVersion === '2.3' ? this.state.multiLifters?.find(item => item.resource === resource) : undefined;
  }

  private multiLifterOwner(vehicleId: string): MultiLifterRuntime | undefined {
    return this.scenario.operationalVersion === '2.3' ? this.state.multiLifters?.find(item => item.ownerVehicleId === vehicleId) : undefined;
  }

  private multiLifterFailureActive(resource: string): boolean {
    const lifter = this.multiLifterByResource.get(resource);
    if (!lifter) return false;
    const ids = new Set([resource, ...this.layout.links.filter(link => link.kind === 'lifter' && link.resource === resource).map(link => link.id)]);
    return this.scenario.failures.some(failure => (failure.kind === 'lifter' && ids.has(failure.target))
      && failure.start < this.state.time && failure.start + failure.duration > this.tickStartTime);
  }

  private multiEntryPlan(vehicle: Vehicle, link: Link, lifter: MultiLargeLifter): { entryFloor: 0 | 1; exitFloor: 0 | 1; entryLanding: string; exitLanding: string; exitWait: string; continuation: string[]; exitLink: Link } | undefined {
    const entryFloorIndex = lifter.entryWaitNodes.indexOf(link.from);
    if (entryFloorIndex < 0 || link.to !== lifter.landingNodes[entryFloorIndex]) return undefined;
    const entryFloor = entryFloorIndex as 0 | 1, otherFloor = (1 - entryFloorIndex) as 0 | 1;
    if (vehicle.route[0] !== link.to) return undefined;
    const next = vehicle.route[1];
    let exitFloor: 0 | 1, exitWait: string, continuation: string[];
    if (next === lifter.landingNodes[otherFloor]) {
      exitFloor = otherFloor;
      exitWait = lifter.exitWaitNodes[exitFloor];
      if (vehicle.route[2] !== exitWait) return undefined;
      continuation = vehicle.route.slice(3);
    } else if (next === lifter.exitWaitNodes[entryFloor]) {
      exitFloor = entryFloor;
      exitWait = lifter.exitWaitNodes[exitFloor];
      continuation = vehicle.route.slice(2);
    } else return undefined;
    const exitLanding = lifter.landingNodes[exitFloor];
    const exitLink = this.outgoing.get(exitLanding)?.find(candidate => candidate.to === exitWait);
    if (!exitLink) return undefined;
    return { entryFloor, exitFloor, entryLanding: lifter.landingNodes[entryFloor], exitLanding, exitWait, continuation, exitLink };
  }

  private removeFromMultiLifterQueues(vehicleId: string): void {
    for (const state of this.state.multiLifters ?? []) state.queuedVehicleIds = state.queuedVehicleIds.filter(id => id !== vehicleId);
  }

  private pruneMultiLifterQueues(): void {
    if(this.scenario.operationalVersion!=='2.3')return;
    const vehicles=new Map(this.state.vehicles.map(vehicle=>[vehicle.id,vehicle]));
    for(const state of this.state.multiLifters??[]){
      const def=this.multiLifterByResource.get(state.resource)!;
      state.queuedVehicleIds=state.queuedVehicleIds.filter(id=>{
        const vehicle=vehicles.get(id);
        if(!vehicle||vehicle.parked||vehicle.link||!def.entryWaitNodes.includes(vehicle.node)||!vehicle.route.length)return false;
        const floor=def.entryWaitNodes.indexOf(vehicle.node);
        const nextLink=vehicle.route.length?(this.outgoing.get(vehicle.node)??[]).find(link=>link.to===vehicle.route[0]):undefined;
        return vehicle.route[0]===def.landingNodes[floor]&&nextLink?.resource===state.resource;
      });
    }
  }

  private updateMultiLifterTelemetry(): void {
    if (this.scenario.operationalVersion !== '2.3') return;
    for (const state of this.state.multiLifters ?? []) {
      if (state.queuedVehicleIds.length) state.queueTicks++;
      state.waitingTicks += state.queuedVehicleIds.length;
      if (state.ownerVehicleId) {
        const owner = this.state.vehicles.find(vehicle => vehicle.id === state.ownerVehicleId);
        if (owner && !owner.failed && !this.multiLifterFailureActive(state.resource)) state.busyTicks++;
      }
      if (this.multiLifterFailureActive(state.resource)) state.failureTicks++;
    }
  }

  private multiLifterDelayEstimate(resource:string):number {
    const state=this.multiLifterRuntime(resource),lifter=this.multiLifterByResource.get(resource);
    if(!state||!lifter)return 0;
    let delay=lifter.transferSeconds+new Set(state.queuedVehicleIds).size*lifter.transferSeconds;
    const owner=state.ownerVehicleId?this.state.vehicles.find(vehicle=>vehicle.id===state.ownerVehicleId):undefined;
    if(!owner||!state.phase)return delay;
    const current=owner.link?this.linkById.get(owner.link):undefined;
    const currentRemaining=current?(current.length*(1-owner.progress)/SPEED_METERS_PER_SECOND):0;
    const exitLink=state.exitLandingNode&&state.exitWaitNode?(this.outgoing.get(state.exitLandingNode)??[]).find(link=>link.to===state.exitWaitNode):undefined;
    const exitSeconds=(exitLink?.length??0)/SPEED_METERS_PER_SECOND;
    if(state.phase==='approach')delay+=currentRemaining+(state.entryFloor!==state.exitFloor?lifter.transferSeconds:0)+exitSeconds;
    else if(state.phase==='transfer')delay+=Math.max(0,20-state.transferTicks)*TICK_SECONDS+exitSeconds;
    else delay+=currentRemaining||exitSeconds;
    return delay;
  }

  private completeMultiLifterOwner(state: MultiLifterRuntime, vehicleId: string): void {
    if (state.ownerVehicleId !== vehicleId) return;
    state.ownerVehicleId = undefined;
    state.phase = undefined;
    state.entryFloor = undefined;
    state.exitFloor = undefined;
    state.entryWaitNode = undefined;
    state.exitWaitNode = undefined;
    state.entryLandingNode = undefined;
    state.exitLandingNode = undefined;
    state.continuationNodes = undefined;
    state.verticalTransferCompleted = undefined;
    state.ownerQueueSequence = undefined;
    state.transferTicks = 0;
  }

  private multiAdmissionBlockers(vehicle: Vehicle, link: Link, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): MovementBlocker[] {
    if (this.scenario.operationalVersion !== '2.3' || !link.resource || !this.multiLifterByResource.has(link.resource)) return [];
    const state = this.multiLifterRuntime(link.resource);
    if (!state) return [{ vehicleId: 'lifter-state', resource: `lifter:${link.resource}` }];
    if (link.from === (this.multiLifterByResource.get(link.resource)?.entryWaitNodes.find(node => node === link.from))) {
      if (!state.queuedVehicleIds.includes(vehicle.id)) state.queuedVehicleIds.push(vehicle.id);
      if (state.ownerVehicleId && state.ownerVehicleId !== vehicle.id) return [{ vehicleId: state.ownerVehicleId, resource: `lifter:${link.resource}` }];
      if (state.queuedVehicleIds[0] !== vehicle.id) return [{ vehicleId: state.queuedVehicleIds[0] ?? 'lifter-queue', resource: `lifter-queue:${link.resource}` }];
      if (this.multiLifterFailureActive(link.resource)) return [{ vehicleId: 'failure', resource: `failure:${link.resource}` }];
      const lifter = this.multiLifterByResource.get(link.resource)!;
      const plan = this.multiEntryPlan(vehicle, link, lifter);
      if (!plan || !this.tickProtection) return [{ vehicleId: 'route', resource: `lifter-route:${link.resource}` }];
      const landing0 = lifter.landingNodes[0], landing1 = lifter.landingNodes[1];
      const blockers = [
        ...this.tickProtection.blockers(link, vehicle.id),
        ...this.tickProtection.blockers(plan.exitLink, vehicle.id),
        ...this.tickProtection.nodeBlockers(landing0, vehicle.id),
        ...this.tickProtection.nodeBlockers(landing1, vehicle.id),
        ...this.tickProtection.nodeBlockers(plan.exitWait, vehicle.id),
      ];
      const resourceUse = occupancy.resources.get(`resource:${link.resource}`) ?? 0;
      if (resourceUse > 0) blockers.push({ vehicleId: 'section', resource: `resource:${link.resource}` });
      if (this.failureActiveForLink(plan.exitLink)) blockers.push({ vehicleId: 'failure', resource: `failure:${plan.exitLink.id}` });
      return [...new Map(blockers.map(blocker => [`${blocker.vehicleId}\0${blocker.resource}`, blocker])).values()];
    }
    if (state.ownerVehicleId && state.ownerVehicleId !== vehicle.id) return [{ vehicleId: state.ownerVehicleId, resource: `lifter:${link.resource}` }];
    if (!state.ownerVehicleId) return [{ vehicleId: 'unreserved', resource: `lifter:${link.resource}` }];
    return [];
  }

  private multiReservedFootprintBlockers(vehicle: Vehicle, link: Link): MovementBlocker[] {
    if (this.scenario.operationalVersion !== '2.3') return [];
    const geometry=getControlGeometry(this.layout), result:MovementBlocker[]=[];
    for(const state of this.state.multiLifters??[]){
      if(!state.ownerVehicleId||state.ownerVehicleId===vehicle.id)continue;
      const lifter=this.multiLifterByResource.get(state.resource)!;
      const entry=this.outgoing.get(state.entryWaitNode!)?.find(edge=>edge.to===state.entryLandingNode);
      const exit=this.outgoing.get(state.exitLandingNode!)?.find(edge=>edge.to===state.exitWaitNode);
      const crossing=this.layout.links.filter(edge=>edge.kind==='lifter'&&edge.resource===state.resource);
      const lockedLinks=[entry,exit,...crossing].filter((edge):edge is Link=>!!edge);
      const lockedNodes=[...lifter.landingNodes,state.exitWaitNode].filter((id):id is string=>!!id);
      const lockedNodeSet=new Set(lockedNodes);
      for(const landingId of lifter.landingNodes){
        const landing=this.nodeById.get(landingId)!;
        for(const node of this.layout.nodes)if(node.floor===landing.floor&&node.id!==landingId&&Math.hypot(node.x-landing.x,node.y-landing.y)<36)lockedNodeSet.add(node.id);
      }
      const candidateConflicts=geometry.conflictingLinks.get(link.id)??[];
      const near=geometry.nearNodes.get(link.id)??[];
      if(lockedLinks.some(edge=>edge.id===link.id||candidateConflicts.includes(edge.id))
        ||[...lockedNodeSet].some(node=>link.from===node||link.to===node||near.includes(node))){
        result.push({vehicleId:state.ownerVehicleId,resource:`lifter-footprint:${lifter.id}`});
      }
    }
    return result;
  }

  private reserveMultiLifter(state: MultiLifterRuntime, vehicle: Vehicle, link: Link): void {
    if (state.ownerVehicleId === vehicle.id) return;
    const lifter = this.multiLifterByResource.get(state.resource)!;
    const plan = this.multiEntryPlan(vehicle, link, lifter);
    assert(!!plan, `Multi Lifter ${state.resource} admitted without a valid planned exit.`);
    state.ownerVehicleId = vehicle.id;
    state.phase = 'approach';
    state.entryFloor = plan.entryFloor;
    state.exitFloor = plan.exitFloor;
    state.entryWaitNode = link.from;
    state.exitWaitNode = plan.exitWait;
    state.entryLandingNode = plan.entryLanding;
    state.exitLandingNode = plan.exitLanding;
    state.continuationNodes = [...plan.continuation];
    state.verticalTransferCompleted = false;
    state.ownerQueueSequence = state.nextQueueSequence++;
    state.transferTicks = 0;
    this.removeFromMultiLifterQueues(vehicle.id);
  }

  private admitOperational(vehicle: Vehicle,nextNode:string,occupancy:{links:Map<string,number>;resources:Map<string,number>;queues:Map<string,number>},reason:string):TickResult{
    const link=this.outgoing.get(vehicle.node)?.find(l=>l.to===nextNode);
    if(!link)return this.waitOperational(vehicle,[],`node:${vehicle.node}`);
    const entryWait=!!link.resource&&this.multiLifterByResource.get(link.resource)?.entryWaitNodes.includes(link.from)&&this.multiLifterByResource.get(link.resource)?.landingNodes.includes(link.to);
    if(this.scenario.operationalVersion==='2.3'&&!entryWait)this.removeFromMultiLifterQueues(vehicle.id);
    const multiBlockers=this.multiAdmissionBlockers(vehicle,link,occupancy);
    if(this.failureActiveForLink(link)){
      this.admissionDiagnostics?.set(vehicle.id,{tick:this.state.tick,time:this.state.time,vehicleId:vehicle.id,linkId:link.id,admitted:false,blockers:[],sectionOccupied:false,cycleRisk:false,failedLink:true});
      return this.waitOperational(vehicle,[...multiBlockers,{vehicleId:'failure',resource:`failure:${link.resource??link.id}`}],'failure');
    }
    const queue=(this.state.linkQueues??[]).find(q=>q.linkId===link.id),queueBlocked=!!queue?.vehicleIds.length&&queue.vehicleIds[0]!==vehicle.id;
    const blockers=[...this.tickProtection!.blockers(link,vehicle.id),...multiBlockers,...this.multiReservedFootprintBlockers(vehicle,link)];
    const occupied=(occupancy.resources.get(this.sectionKey(link))??occupancy.links.get(link.id)??0)>=1;
    const wouldCycle=!queueBlocked&&!occupied&&!blockers.length&&this.operationalWouldCreateCycle(vehicle,link,blockers);
    this.admissionDiagnostics?.set(vehicle.id,{tick:this.state.tick,time:this.state.time,vehicleId:vehicle.id,linkId:link.id,admitted:!queueBlocked&&!occupied&&!blockers.length&&!wouldCycle,blockers:blockers.map(blocker=>({...blocker})),queueHead:queueBlocked?queue!.vehicleIds[0]:undefined,sectionOccupied:occupied,cycleRisk:wouldCycle,failedLink:false});
    if(queueBlocked||occupied||blockers.length||wouldCycle){
      if(wouldCycle&&(this.scenario.deadlockPolicy??'prevent-recover')==='prevent-recover')this.state.preventionCount=(this.state.preventionCount??0)+1;
      const all=[...blockers,...(queueBlocked?[{vehicleId:queue!.vehicleIds[0],resource:`queue:${link.id}`}]:[]),...(occupied?[{vehicleId:'section',resource:this.sectionKey(link)}]:[])];
      const portServiceBlocked=blockers.some(b=>{
        const owner=this.state.vehicles.find(v=>v.id===b.vehicleId);
        if(!owner||owner.serviceRemaining<=0||(owner.phase!=='pickup'&&owner.phase!=='dropoff')||owner.node!==link.to)return false;
        const active=owner.request?this.state.requests.find(request=>request.id===owner.request):undefined;
        const portId=owner.phase==='pickup'?active?.source:active?.destination;
        return !!portId&&this.portById.get(portId)?.node===link.to;
      });
      if(wouldCycle)all.push({vehicleId:'cycle',resource:`cycle-risk:${link.to}`});
      return this.waitOperational(vehicle,all,wouldCycle?'cycle-risk':portServiceBlocked?'port':'rail');
    }
    for(const queued of this.state.linkQueues??[])queued.vehicleIds=queued.vehicleIds.filter(id=>id!==vehicle.id);
    if (link.kind === 'lifter' && link.resource) {
      const lifterState=this.multiLifterRuntime(link.resource);
      if(lifterState?.ownerVehicleId===vehicle.id)lifterState.phase='transfer';
    } else if (link.resource && this.multiLifterByResource.has(link.resource)) {
      const lifter=this.multiLifterByResource.get(link.resource)!;
      if (lifter.entryWaitNodes.includes(link.from)) {
        const lifterState=this.multiLifterRuntime(link.resource)!;
        this.reserveMultiLifter(lifterState,vehicle,link);
      }
    } else this.removeFromMultiLifterQueues(vehicle.id);
    vehicle.link=link.id;vehicle.progress=0;vehicle.parked=false;occupancy.links.set(link.id,1);occupancy.resources.set(this.sectionKey(link),1);this.tickProtection!.acquire(link,vehicle.id);vehicle.waiting=0;vehicle.waitReason=undefined;vehicle.blockingResources=undefined;
    return {busy:true,waiting:false};
  }

  private waitOperational(vehicle:Vehicle,blockers:MovementBlocker[]|string[],reason='rail'):TickResult{
    const resources=typeof blockers[0]==='string'?blockers as string[]:(blockers as MovementBlocker[]).map(b=>b.resource);
    const result=this.waitVehicle(vehicle);vehicle.waitReason=reason;vehicle.blockingResources=[...new Set(resources)].sort();
    if (!vehicle.link && !vehicle.parked) {
      const next=vehicle.route.length?(this.outgoing.get(vehicle.node)??[]).find(edge=>edge.to===vehicle.route[0]):undefined;
      const queues=this.state.linkQueues??(this.state.linkQueues=[]);
      for(const queue of queues)if(queue.linkId!==next?.id)queue.vehicleIds=queue.vehicleIds.filter(id=>id!==vehicle.id);
      if(next){
        let queue=queues.find(item=>item.linkId===next.id);
        if(!queue){queue={linkId:next.id,vehicleIds:[]};queues.push(queue);}
        if(!queue.vehicleIds.includes(vehicle.id))queue.vehicleIds.push(vehicle.id);
      }
    }
    return {...result,reason,resources:vehicle.blockingResources};
  }

  private operationalWaitGraph(excludeTimed=true):Map<string,string[]>{
    const graph=new Map<string,string[]>(),guard=createTickProtection(this.layout,this.state.vehicles,(this.scenario.movementControl??'clearance')==='clearance');
    const blockedBy=(link:Link,id:string)=>{const result=guard.blockers(link,id),queue=(this.state.linkQueues??[]).find(q=>q.linkId===link.id);if(queue?.vehicleIds.length&&queue.vehicleIds[0]!==id)result.push({vehicleId:queue.vehicleIds[0],resource:`queue:${link.id}`});return result;};
    for(const v of this.state.vehicles){
      if(v.link||v.failed||(excludeTimed&&v.serviceRemaining>0)||!v.waiting)continue;
      const link=v.route[0]&&(this.outgoing.get(v.node)??[]).find(l=>l.to===v.route[0]);if(!link)continue;
      // A vehicle waiting for an explicitly failed intended edge is not
      // evidence of a live resource dependency and cannot support an SCC.
      if(this.failureActiveForLink(link))continue;
      const ids=blockedBy(link,v.id).map(b=>b.vehicleId).filter(id=>this.state.vehicles.some(other=>other.id===id&&!other.parked&&!other.link&&!other.failed&&(!excludeTimed||other.serviceRemaining===0)));
      if(ids.length)graph.set(v.id,[...new Set(ids)].sort());
    }
    return graph;
  }

  private operationalCyclesNow():string[][]{
    const graph=this.operationalWaitGraph(),index=new Map<string,number>(),low=new Map<string,number>(),stack:string[]=[],onStack=new Set<string>(),result:string[][]=[];let next=0;
    const visit=(id:string)=>{index.set(id,next);low.set(id,next++);stack.push(id);onStack.add(id);for(const to of graph.get(id)??[]){if(!index.has(to)){visit(to);low.set(id,Math.min(low.get(id)!,low.get(to)!));}else if(onStack.has(to))low.set(id,Math.min(low.get(id)!,index.get(to)!));}if(low.get(id)===index.get(id)){const component:string[]=[];let item:string;do{item=stack.pop()!;onStack.delete(item);component.push(item);}while(item!==id);if(component.length>1||(graph.get(id)??[]).includes(id))result.push(component.sort());}};
    for(const id of graph.keys())if(!index.has(id))visit(id);return result.sort((a,b)=>a.join('|').localeCompare(b.join('|')));
  }

  private refreshOperationalCycles():void{
    const cycles=this.operationalCyclesNow(),old=this.state.operationalCycles??[],now=this.state.time,guard=createTickProtection(this.layout,this.state.vehicles,(this.scenario.movementControl??'clearance')==='clearance');
    this.state.operationalCycles=cycles.map(vehicles=>{const members=new Set(vehicles);const edges=vehicles.flatMap(id=>{const v=this.state.vehicles.find(x=>x.id===id)!;const link=v.route[0]&&(this.outgoing.get(v.node)??[]).find(l=>l.to===v.route[0]);if(!link)return[];const actual=guard.blockers(link,id),queue=(this.state.linkQueues??[]).find(q=>q.linkId===link.id);if(queue?.vehicleIds.length&&queue.vehicleIds[0]!==id)actual.push({vehicleId:queue.vehicleIds[0],resource:`queue:${link.id}`});const within=actual.filter(b=>members.has(b.vehicleId));return[{vehicleId:id,from:link.from,to:link.to,blockers:[...new Set(within.map(b=>b.vehicleId))].sort(),resources:[...new Set(within.map(b=>b.resource))].sort()}];});const signature=edges.map(e=>`${e.vehicleId}:${e.from}>${e.to}:${e.blockers.join(',')}:${e.resources.join(',')}`).sort().join('|');const previous=old.find(c=>c.signature===signature);return{signature,firstSeen:previous?.firstSeen??now,vehicles,edges};});
  }

  private operationalWouldCreateCycle(vehicle:Vehicle,link:Link,blockers:MovementBlocker[],intentRoute=vehicle.route):boolean{
    if((this.scenario.deadlockPolicy??'prevent-recover')!=='prevent-recover')return false;
    const projected=this.state.vehicles.map(other=>{
      const copy={...other};
      if(other.link){const occupied=this.linkById.get(other.link)!;copy.node=occupied.to;copy.link=undefined;copy.progress=0;if(copy.route[0]===copy.node)copy.route=copy.route.slice(1);}
      if(other.id===vehicle.id){copy.route=[...intentRoute];copy.node=link.to;copy.link=undefined;copy.progress=0;if(copy.route[0]===link.to)copy.route.shift();copy.waiting=0;}
      return copy;
    });
    const guard=createTickProtection(this.layout,projected,(this.scenario.movementControl??'clearance')==='clearance'),graph=new Map<string,Set<string>>(),eligible=projected.filter(v=>!v.parked&&!v.failed&&v.serviceRemaining<=0),eligibleIds=new Set(eligible.map(v=>v.id));
    const queueHeadByLink=new Map<string,string>();
    for(const queue of this.state.linkQueues??[])if(queue.vehicleIds.length&&!queueHeadByLink.has(queue.linkId))queueHeadByLink.set(queue.linkId,queue.vehicleIds[0]);
    const blockersFor=(edge:Link,id:string)=>{const result=guard.blockers(edge,id),queueHead=queueHeadByLink.get(edge.id);if(queueHead&&queueHead!==id)result.push({vehicleId:queueHead,resource:`queue:${edge.id}`});return result;};
    // Only vertices reachable from the requester can close a cycle through it.
    // Build those exact same adjacency sets lazily instead of querying every
    // unrelated projected vehicle for each candidate admission.
    const byId = new Map(eligible.map(other => [other.id, other]));
    const successors = (id: string): Set<string> => {
      const cached = graph.get(id); if (cached) return cached;
      const result = new Set<string>(); graph.set(id, result);
      const other = byId.get(id);
      const next = other?.route[0], intended = other && next && (this.outgoing.get(other.node) ?? []).find(edge => edge.to === next);
      if (intended) for (const item of blockersFor(intended, id)) {
        if (eligibleIds.has(item.vehicleId) && item.vehicleId !== id) result.add(item.vehicleId);
      }
      return result;
    };
    const target=vehicle.id;
    const visit=(id:string,seen:Set<string>):boolean=>{if(id===target)return true;if(seen.has(id))return false;seen.add(id);for(const next of successors(id))if(visit(next,seen))return true;return false;};
    return [...successors(vehicle.id)].some(id=>visit(id,new Set()));
  }

  private recoverOperationalCycle(occupancy:{links:Map<string,number>;resources:Map<string,number>;queues:Map<string,number>}):void{
    const cycles=(this.state.operationalCycles??[]).filter(c=>this.state.time-c.firstSeen>=10-EPSILON).sort((a,b)=>a.signature.localeCompare(b.signature));
    for(const cycle of cycles){
      for(const id of cycle.vehicles){
        const v=this.state.vehicles.find(x=>x.id===id);if(!v||v.link||v.failed||v.serviceRemaining>0)continue;
        const req=v.request?this.state.requests.find(r=>r.id===v.request):undefined;
        const target=req?this.portById.get(v.loaded?req.destination:req.source)!.node:this.nearestParking(v.node,occupancy)?.node;
        if(!target)continue;
        const candidates=(this.outgoing.get(v.node)??[]).filter(edge=>!this.failureActiveForLink(edge)&&edge.to!==v.node&&(!this.portNodes.has(edge.to)||edge.to===target)).map(edge=>{
          const suffix=this.v2BestPath(edge.to,target,occupancy,false);if(!suffix||suffix.nodes.includes(v.node))return undefined;
          const blockers=this.tickProtection!.blockers(edge,v.id),intent=[edge.to,...suffix.nodes];if(blockers.length||this.operationalWouldCreateCycle(v,edge,blockers,intent))return undefined;
          return{edge,suffix,cost:this.edgeCost(edge,occupancy)+suffix.cost};
        }).filter((x):x is {edge:Link;suffix:RouteCandidate;cost:number}=>!!x).sort((a,b)=>a.cost-b.cost||a.edge.id.localeCompare(b.edge.id));
        const choice=candidates[0];if(!choice)continue;
        const prior=[...v.route];v.route=[choice.edge.to,...choice.suffix.nodes];
        const admitted=this.admitOperational(v,choice.edge.to,occupancy,'recovery');
        if(admitted.waiting||!v.link){v.route=prior;continue;}
        this.state.recoveryCount=(this.state.recoveryCount??0)+1;this.refreshOperationalCycles();return;
      }
    }
    if (this.state.version === OPERATIONAL_LIVENESS_ENGINE_VERSION) this.recoverPreventionCone(occupancy);
  }

  /** A prevention sink can stall an acyclic wait graph. Explore only its real upstream dependencies. */
  private recoverPreventionCone(occupancy: {links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number>}): void {
    const eligible = (vehicle: Vehicle) => !vehicle.parked && !vehicle.link && !vehicle.failed
      && vehicle.serviceRemaining <= 0 && vehicle.waiting >= 10;
    const roots = this.state.vehicles.filter(vehicle => eligible(vehicle) && vehicle.waitReason === 'cycle-risk').map(vehicle => vehicle.id).sort();
    if (!roots.length) return;
    const reverse = new Map<string, Set<string>>();
    for (const [from, blockers] of this.operationalWaitGraph()) for (const blocker of blockers) {
      const upstream = reverse.get(blocker) ?? new Set<string>();
      upstream.add(from); reverse.set(blocker, upstream);
    }
    const cone = new Set(roots), pending = [...roots];
    while (pending.length) for (const upstream of reverse.get(pending.pop()!) ?? []) {
      if (!cone.has(upstream)) { cone.add(upstream); pending.push(upstream); }
    }
    const vehicles = new Map(this.state.vehicles.map(vehicle => [vehicle.id, vehicle]));
    const requests = new Map(this.state.requests.map(request => [request.id, request]));
    for (const id of [...cone].sort()) {
      const vehicle = vehicles.get(id)!;
      if (!eligible(vehicle) || !vehicle.request) continue;
      const request = requests.get(vehicle.request)!;
      const target = this.portById.get(vehicle.loaded ? request.destination : request.source)!.node;
      const choices: Array<{edge: Link; nodes: string[]; cost: number}> = [];
      for (const edge of this.outgoing.get(vehicle.node) ?? []) {
        if (edge.to === vehicle.route[0] || edge.to === vehicle.node || this.failureActiveForLink(edge)
          || (this.transitNodes.has(edge.to) && edge.to !== target)) continue;
        // Cheap physical checks precede path search. All are pure reads; the
        // standard admission gate rechecks them before committing any movement.
        const blockers = this.tickProtection!.blockers(edge, vehicle.id);
        if (blockers.length) continue;
        const queue = this.state.linkQueues?.find(item => item.linkId === edge.id);
        if (queue?.vehicleIds.length && queue.vehicleIds[0] !== vehicle.id) continue;
        if ((occupancy.resources.get(this.sectionKey(edge)) ?? occupancy.links.get(edge.id) ?? 0) >= 1) continue;
        const suffix = this.v2BestPath(edge.to, target, occupancy, false);
        if (!suffix || suffix.nodes.includes(vehicle.node)) continue;
        const nodes = [edge.to, ...suffix.nodes];
        if (this.operationalWouldCreateCycle(vehicle, edge, blockers, nodes)) continue;
        choices.push({edge, nodes, cost: this.edgeCost(edge, occupancy) + suffix.cost});
      }
      choices.sort((a, b) => a.cost - b.cost || a.edge.id.localeCompare(b.edge.id));
      const choice = choices[0];
      if (!choice) continue;
      vehicle.route = choice.nodes;
      const result = this.admitOperational(vehicle, choice.edge.to, occupancy, 'prevention-recovery');
      assert(!result.waiting && vehicle.link === choice.edge.id, 'Preflight and standard recovery admission disagree.');
      this.state.recoveryCount = (this.state.recoveryCount ?? 0) + 1;
      this.refreshOperationalCycles();
      return; // at most one physical admission per existing 10-second recovery invocation
    }
  }

  private refreshQueuesV2(): void {
    for (const q of this.state.linkQueues ?? []) {
      q.vehicleIds = q.vehicleIds.filter(id => {
        const v = this.state.vehicles.find(x => x.id === id); const link = v?.route[0] && this.outgoing.get(v.node)?.find(x => x.to === v.route[0]);
        const retain = !!v && !v.link && !v.parked && !!link && link.id === q.linkId && v.waiting > 0;
        return retain;
      });
    }
    this.state.linkQueues = (this.state.linkQueues ?? []).filter(q => q.vehicleIds.length).sort((a,b)=>a.linkId.localeCompare(b.linkId));
  }

  private v2Paths(from: string, to: string, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }, maximum = 3, record = true): RouteCandidate[] {
    const started = performance.now(); if (record) this.routingDecisions++;
    const mcs = this.mcs(), blocked=this.layout.links.filter(link=>this.failureActiveForLink(link)).map(link=>link.id).sort(),cacheKey=`${from}>${to}|${maximum}|${blocked.join(',')}`;
    let alternatives=this.candidatePathCache.get(cacheKey);
    if(!alternatives){
      alternatives=candidateRoutesV6(this.layout, from, to, maximum, blocked).map(route=>({nodes:route.nodes,links:route.links,distance:route.length,cost:0,selected:false}));
      if(this.candidatePathCache.size>=500)this.candidatePathCache.delete(this.candidatePathCache.keys().next().value!);
      this.candidatePathCache.set(cacheKey,alternatives);
    }
    const found: RouteCandidate[] = alternatives.map(route=>{
      let cost = 0;
      for (const id of route.links) {
        if (record) this.state.routingOperations++;
        const link = this.linkById.get(id)!;
        cost += this.edgeCost(link, occupancy);
      }
      return { nodes: route.nodes.slice(1), links: [...route.links], distance: stableRound(route.distance), cost: stableRound(cost), selected: false };
    }).sort((a,b)=>a.cost-b.cost || a.links.join('|').localeCompare(b.links.join('|')));
    if (found.length) found[0].selected = true;
    if (record) this.routingMs += performance.now() - started; return found;
  }

  private v2BestPath(from: string, to: string, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }, record = true): RouteCandidate | undefined {
    const started = performance.now(); if (record) this.routingDecisions++;
    if (from === to) { if(record)this.routingMs += performance.now()-started; return {nodes:[],links:[],distance:0,cost:0,selected:true}; }
    const costs=this.routeCosts,lengths=this.routeLengths,visited=this.routeVisited,previous=this.routePrevious,fromIndex=this.routeNodeIndex.get(from)!,toIndex=this.routeNodeIndex.get(to)!;
    costs.fill(Infinity); lengths.fill(Infinity); visited.fill(0); previous.fill(undefined); costs[fromIndex]=0; lengths[fromIndex]=0;
    const frontier = new StableMinHeap(); frontier.push({node:from,cost:0});
    while (frontier.size) {
      const entry=frontier.pop()!;const current=entry.node,best=entry.cost;
      const currentIndex=this.routeNodeIndex.get(current)!;
      if(visited[currentIndex]||best>costs[currentIndex]+EPSILON)continue;
      if(current===to)break; visited[currentIndex]=1;
      if(current!==from&&this.isTransitRestricted(current,to))continue;
      for(const link of this.outgoing.get(current)??[]) {
        if(record)this.state.routingOperations++;
        const nextIndex=this.routeNodeIndex.get(link.to)!;
        if(visited[nextIndex]||this.failureActiveForLink(link))continue;
        const edge=this.edgeCost(link,occupancy), next=best+edge, old=costs[nextIndex];
        if(next<old-EPSILON){costs[nextIndex]=next;lengths[nextIndex]=lengths[currentIndex]+link.length;previous[nextIndex]={nodeIndex:currentIndex,link};frontier.push({node:link.to,cost:next});}
      }
      visited[currentIndex]=1;
    }
    if(!Number.isFinite(costs[toIndex])){if(record)this.routingMs+=performance.now()-started;return undefined;}
    const revNodes:string[]=[],revLinks:string[]=[];let cursor=toIndex;
    while(cursor!==fromIndex){revNodes.push(this.layout.nodes[cursor].id);const pred=previous[cursor];if(!pred){if(record)this.routingMs+=performance.now()-started;return undefined;}revLinks.push(pred.link.id);cursor=pred.nodeIndex;}
    const result:RouteCandidate={nodes:revNodes.reverse(),links:revLinks.reverse(),distance:stableRound(lengths[toIndex]),cost:stableRound(costs[toIndex]),selected:true};
    if(record)this.routingMs+=performance.now()-started;return result;
  }

  private v2PathsToTarget(to: string, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): Map<string,RouteCandidate> {
    const started=performance.now();this.routingDecisions++;
    const costs=new Map(this.layout.nodes.map(node=>[node.id,Infinity])),lengths=new Map(this.layout.nodes.map(node=>[node.id,Infinity]));
    const nextLink=new Map<string,Link>(),visited=new Set<string>(),frontier=new StableMinHeap();costs.set(to,0);lengths.set(to,0);frontier.push({node:to,cost:0});
    while(frontier.size){
      const entry=frontier.pop()!;const current=entry.node,best=entry.cost;
      if(visited.has(current)||best>costs.get(current)!+EPSILON)continue;
      if(current!==to&&this.isTransitRestricted(current,to)){visited.add(current);continue;}
      for(const link of this.incoming.get(current)??[]){
        this.state.routingOperations++;
        if(visited.has(link.from)||this.failureActiveForLink(link))continue;
        const edge=this.edgeCost(link,occupancy),next=best+edge;
        if(next<costs.get(link.from)!-EPSILON){costs.set(link.from,next);lengths.set(link.from,lengths.get(current)!+link.length);nextLink.set(link.from,link);frontier.push({node:link.from,cost:next});}
      }
      visited.add(current);
    }
    const result=new Map<string,RouteCandidate>();
    for(const source of this.layout.nodes){if(!Number.isFinite(costs.get(source.id)!))continue;let cursor=source.id;const nodes:string[]=[],links:string[]=[];let guard=0;
      while(cursor!==to&&guard++<=this.layout.nodes.length){const link=nextLink.get(cursor);if(!link)break;nodes.push(link.to);links.push(link.id);cursor=link.to;}
      if(cursor===to)result.set(source.id,{nodes,links,distance:stableRound(lengths.get(source.id)!),cost:stableRound(costs.get(source.id)!),selected:true});
    }
    this.routingMs+=performance.now()-started;return result;
  }

  sectionKey(link: Link): string {
    if (link.resource) return `resource:${link.resource}`;
    const reverse = (this.outgoing.get(link.to) ?? []).find(candidate=>candidate.to===link.from);
    return reverse ? `pair:${[link.id,reverse.id].sort().join('|')}` : `link:${link.id}`;
  }

  private isTransitRestricted(node: string, target: string): boolean {
    return node!==target&&this.transitNodes.has(node);
  }

  private queueLengthFor(link: Link): number {
    const reverse=(this.outgoing.get(link.to)??[]).find(candidate=>candidate.to===link.from);
    const ids=new Set([link.id, ...(reverse?[reverse.id]:[])]);
    return (this.state.linkQueues??[]).filter(q=>ids.has(q.linkId)).reduce((sum,q)=>sum+q.vehicleIds.length,0);
  }

  private recordCurrentDecision(vehicle: Vehicle, to: string, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }, selected: RouteCandidate | undefined, reason: string): void {
    if(!selected)return;
    const candidates=[{...selected,nodes:[...selected.nodes],links:[...selected.links],selected:true}];
    this.rememberDecision(vehicle.id,reason,this.state.decisions?.[vehicle.id]?.assignmentReason??'Existing transport request route',vehicle.node,to,candidates,this.state.policy);
  }

  private routeCost(start: string, nodes: string[], occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): number {
    let total = 0, from = start;
    for (const next of nodes) {
      const link = this.outgoing.get(from)?.find(l=>l.to===next); if (!link) return Number.POSITIVE_INFINITY;
      if(this.failureActiveForLink(link))return Number.POSITIVE_INFINITY;
      total+=this.edgeCost(link,occupancy);from=next;
    }
    return total;
  }

  private isNextLinkFailed(vehicle: Vehicle): boolean {
    const next=vehicle.route[0]&&(this.outgoing.get(vehicle.node)??[]).find(link=>link.to===vehicle.route[0]);
    return !!next&&this.failureActiveForLink(next);
  }

  private nearestParking(from: string, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): { node: string; nodes: string[] } | undefined {
    this.refreshParkingPaths();
    return this.parkingPaths.get(from);
  }

  private refreshParkingPaths(): void {
    const blocked=this.layout.links.filter(link=>this.failureActiveForLink(link)).map(link=>link.id).sort(),signature=blocked.join('|');
    if(signature===this.parkingPathSignature&&this.parkingPaths.size)return;
    this.parkingPathSignature=signature;
    const costs=new Map(this.layout.nodes.map(node=>[node.id,Infinity])),goal=new Map<string,string>(),nextLink=new Map<string,Link>(),visited=new Set<string>();
    for(const node of this.layout.parkingNodes??[]){costs.set(node,0);goal.set(node,node);}
    while(visited.size<this.layout.nodes.length){
      let current:string|undefined,best=Infinity;
      for(const node of this.layout.nodes){const cost=costs.get(node.id)!;if(!visited.has(node.id)&&(cost<best-EPSILON||(Math.abs(cost-best)<=EPSILON&&current!==undefined&&node.id<current))){current=node.id;best=cost;}}
      if(!current||!Number.isFinite(best))break;
      if(this.portNodes.has(current)) {visited.add(current);continue;}
      for(const link of this.incoming.get(current)??[]){if(blocked.includes(link.id)||visited.has(link.from))continue;const next=best+link.length,old=costs.get(link.from)!;
        if(next<old-EPSILON||(Math.abs(next-old)<=EPSILON&&current<(nextLink.get(link.from)?.to??'~'))){costs.set(link.from,next);goal.set(link.from,goal.get(current)??current);nextLink.set(link.from,link);}
      }
      visited.add(current);
    }
    const paths=new Map<string,{node:string;nodes:string[]}>();
    for(const source of this.layout.nodes){const target=goal.get(source.id);if(!target)continue;let cursor=source.id,guard=0;const nodes:string[]=[];
      while(cursor!==target&&guard++<=this.layout.nodes.length){const link=nextLink.get(cursor);if(!link)break;nodes.push(link.to);cursor=link.to;}
      if(cursor===target)paths.set(source.id,{node:target,nodes});
    }
    this.parkingPaths=paths;
  }

  private rememberDecision(vehicleId: string, reason: string, assignmentReason: string, from: string, to: string, candidates: RouteCandidate[], policy: Policy): void {
    const decisions = this.state.decisions ?? (this.state.decisions = {});
    decisions[vehicleId] = { reason, assignmentReason, from, to, candidates: candidates.map(c=>({ ...c, nodes:[...c.nodes], links:[...c.links] })), policy };
  }

  inspectDecision(vehicleId: string): DecisionInspection | undefined {
    if(!true)return this.inspectDecisionCore(vehicleId);
    const active=this.operationalTickActive,cached=this.tickEdgeCosts;
    this.operationalTickActive=true;this.tickEdgeCosts=this.state.policy==='DBR'?undefined:this.buildOperationalEdgeCosts(this.makeOccupancy());
    try{return this.inspectDecisionCore(vehicleId);}finally{this.operationalTickActive=active;this.tickEdgeCosts=cached;}
  }

  private inspectDecisionCore(vehicleId: string): DecisionInspection | undefined {
    const stored = this.state.decisions?.[vehicleId];
    if (stored) {
      const result=clone(stored),occupancy=this.makeOccupancy(),alternatives=this.v2Paths(result.from,result.to,occupancy,3,false);
      const selected=result.candidates.find(candidate=>candidate.selected);
      if(selected){
        selected.distance=selected.links.reduce((sum,id)=>sum+(this.linkById.get(id)?.length??0),0);
        const currentCost=this.routeCost(result.from,selected.nodes,occupancy);selected.cost=Number.isFinite(currentCost)?stableRound(currentCost):1e12;
      }
      const others=alternatives.filter(candidate=>candidate.links.join('|')!==selected?.links.join('|')).slice(0,2);
      result.candidates=[...(selected?[selected]:[]),...others];
      for(const candidate of result.candidates)candidate.selected=candidate.links.join('|')===(selected?.links.join('|')??'');
      result.reason += ' Costs reflect current occupancy; the selected route is the most recent MCS decision.';
      return result;
    }
    const vehicle = this.state.vehicles.find(v=>v.id===vehicleId); if (!vehicle) return undefined;
    const request = vehicle.request ? this.state.requests.find(r=>r.id===vehicle.request) : undefined;
    const to = request ? this.portById.get(vehicle.loaded ? request.destination : request.source)?.node ?? vehicle.node : (this.layout.parkingNodes?.[0] ?? vehicle.node);
    const occupancy = this.makeOccupancy(), candidates = this.v2Paths(vehicle.node,to,occupancy,3,false);
    return { reason: vehicle.parked ? 'Vehicle is parked off-rail.' : vehicle.failed ? 'Vehicle is held by an active failure.' : request ? 'Vehicle follows its assigned request route.' : 'Vehicle has no active assignment.', assignmentReason: 'No current assignment.', from: vehicle.node, to, candidates, policy: this.state.policy };
  }

  getDiagnostics(): EngineDiagnostics {
    {
      const stalledVehicles=this.state.vehicles.filter(vehicle=>vehicle.waiting>=10).map(vehicle=>vehicle.id).sort();
      const blockedVehicles=(this.state.linkQueues??[]).reduce((n,q)=>n+q.vehicleIds.length,0);
      const deadlockedVehicles=[...(this.state.operationalCycles??[]).filter(c=>this.state.time-c.firstSeen>=10-EPSILON).flatMap(c=>c.vehicles)];
      return{blockedVehicles,stalledVehicles,deadlockedVehicles:[...new Set(deadlockedVehicles)].sort(),routingMs:this.routingMs,routingDecisions:this.routingDecisions};
    }
  }

  private releaseStored(): void {
    const now = this.state.time;
    const retained: StoredFoup[] = [];
    for (const foup of this.state.storedFoups) {
      if (foup.releaseAt <= now + EPSILON) this.log(`FOUP ${foup.requestId} released from ${foup.portId}`);
      else retained.push(foup);
    }
    this.state.storedFoups = retained;
  }

  private releaseDemand(): void {
    while (this.state.demandIndex < this.schedule.length && this.schedule[this.state.demandIndex].at <= this.state.time + EPSILON) {
      const event = this.schedule[this.state.demandIndex++];
      const request: Request = { id: `TR-${String(this.state.requests.length + 1).padStart(4, '0')}`, source: event.source, destination: event.destination, created: event.at, phase: 'pending', waiting: 0 };
      this.state.requests.push(request);
      this.log(`Transport request ${request.id} created`);
    }
  }

  private portServiceBusy(portId: string, exceptVehicleId: string): boolean {
    return this.state.vehicles.some(other => {
      if (other.id === exceptVehicleId || !['pickup', 'dropoff'].includes(other.phase) || !other.request) return false;
      const request = this.state.requests.find(item => item.id === other.request);
      if (!request) return false;
      return other.phase === 'pickup' ? request.source === portId : request.destination === portId;
    });
  }

  private waitVehicle(vehicle: Vehicle): TickResult {
    vehicle.waiting = stableRound(vehicle.waiting + TICK_SECONDS);
    return { busy: false, waiting: true };
  }

  private makeOccupancy(): { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> } {
    const links = new Map<string, number>(), resources = new Map<string, number>(), queues = new Map<string, number>();
    for (const vehicle of this.state.vehicles) if (vehicle.link) {
      const link = this.linkById.get(vehicle.link)!;
      links.set(link.id, (links.get(link.id) ?? 0) + 1);
      { const key=this.sectionKey(link); resources.set(key,(resources.get(key)??0)+1); }
    }
    return { links, resources, queues };
  }

  private decrementV2Occupancy(link: Link, occupancy: { links: Map<string, number>; resources: Map<string, number>; queues: Map<string, number> }): void {
    occupancy.links.set(link.id,Math.max(0,(occupancy.links.get(link.id)??0)-1));
    const key=this.sectionKey(link);occupancy.resources.set(key,Math.max(0,(occupancy.resources.get(key)??0)-1));
  }

  private failureActive(kind: Failure['kind'], target: string): boolean {
    return this.scenario.failures.some(f => f.kind === kind && f.target === target && f.start < this.state.time && f.start + f.duration > this.tickStartTime);
  }
  private failureActiveForLink(link: Link): boolean {
    return this.failureActive('rail', link.id)
      || (this.scenario.operationalVersion === '2.3' && !!link.resource && this.multiLifterByResource.has(link.resource) && this.multiLifterFailureActive(link.resource))
      || (link.kind === 'lifter' && (this.failureActive('lifter', link.id) || (!!link.resource && this.failureActive('lifter', link.resource))));
  }

  private log(message: string): void {
    this.state.eventLog.push({ time: this.state.time, message });
    if (this.state.eventLog.length > MAX_EVENTS) this.state.eventLog.splice(0, this.state.eventLog.length - MAX_EVENTS);
  }
}

export function getKpis(engine: Engine): Kpis {
  const state = engine.state;
  const completed = state.requests.filter(request => request.completed !== undefined);
  const unfinished = state.requests.filter(request => request.phase !== 'completed');
  const leadTimes = completed.map(request => request.completed! - request.created).sort((a, b) => a - b);
  const waits = state.requests.map(request => request.picked === undefined ? Math.max(request.waiting, state.time - request.created) : request.picked - request.created);
  const percentile = (p: number) => leadTimes.length ? leadTimes[Math.min(leadTimes.length - 1, Math.ceil(p * leadTimes.length) - 1)] : 0;
  const elapsed = state.time;
  const availableVehicleSeconds = engine.scenario.version === 1 ? engine.scenario.fleet * elapsed : fleetAvailableSeconds(engine.scenario, elapsed);
  const currentBlocked = state.vehicles.filter(vehicle => vehicle.waiting > 0 && (vehicle.phase !== 'idle')).length;
  const queue = unfinished.filter(request => request.phase === 'pending').length + currentBlocked;
  return {
    created: state.requests.length,
    completed: completed.length,
    unfinished: unfinished.length,
    pending: unfinished.filter(request => request.phase === 'pending').length,
    throughput: elapsed > 0 ? completed.length / (elapsed / 60) : 0,
    averageTransport: leadTimes.length ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0,
    p50: percentile(0.5),
    p95: percentile(0.95),
    averageWaiting: waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0,
    ...({ averageMovementWaiting: state.requests.length ? state.requests.reduce((sum,request)=>sum+(request.movementWaiting??0),0)/state.requests.length : 0 }),
    utilization: availableVehicleSeconds > 0 ? Math.min(1, state.vehicleBusySeconds / availableVehicleSeconds) : 0,
    congestion: availableVehicleSeconds > 0 ? Math.min(1, state.vehicleWaitingSeconds / availableVehicleSeconds) : 0,
    queue,
    reroutes: state.reroutes,
    routingOperations: state.routingOperations,
    oldestUnfinished: unfinished.length ? Math.max(...unfinished.map(request => Math.max(0, elapsed - request.created))) : 0,
    elapsed,
  };
}

export function comparePolicies(scenarioInput: Scenario): { DBR: Kpis; CBR: Kpis } {
  const scenario = validateScenario(scenarioInput);
  const DBR = new Engine({ ...clone(scenario), policy: 'DBR' });
  const CBR = new Engine({ ...clone(scenario), policy: 'CBR' });
  const ticks = Math.ceil(scenario.duration / TICK_SECONDS);
  for(let offset=0;offset<ticks;offset+=3_600){const chunk=Math.min(3_600,ticks-offset);DBR.step(chunk);CBR.step(chunk);}
  return { DBR: getKpis(DBR), CBR: getKpis(CBR) };
}

export function assertInvariants(engine: Engine): void {
  const state = engine.state, layout = engine.layout;
  assert(state.version === operationalVersionAt(engine.scenario, state.time), 'Operational state marker disagrees with its activation history.');
  assertMultiLifterState(engine.scenario,state,layout);
  // Keep the same first-match directed-step predicate while checking each
  // route without rescanning the complete layout for every route node.
  const directedSteps = new Map<string, Map<string, Link>>();
  for (const link of layout.links) {
    const outgoing = directedSteps.get(link.from) ?? new Map<string, Link>();
    if (!outgoing.has(link.to)) outgoing.set(link.to, link);
    directedSteps.set(link.from, outgoing);
  }
  const requestById = new Map(state.requests.map(request => [request.id, request]));
  const vehicleById = new Map(state.vehicles.map(vehicle => [vehicle.id, vehicle]));
  assert(requestById.size === state.requests.length, 'Duplicate request ID.');
  if (engine.scenario.version === 1) assert(vehicleById.size === state.vehicles.length && state.vehicles.length === engine.scenario.fleet, 'Duplicate vehicle ID or fleet mismatch.');
  else assert(vehicleById.size === state.vehicles.length, 'Duplicate vehicle ID.');
  assertFleetAccounting(engine.scenario, state, layout);
  for (let ordinal = 1; ordinal <= state.vehicles.length; ordinal++) {
    const vehicle = vehicleById.get(`OHT-${String(ordinal).padStart(3, '0')}`);
    assert(vehicle && vehicle.parkingSlot === ordinal - 1, 'Topology 3 requires stable unique fleet slots.');
  }
  assert(state.demandIndex <= engine.schedule.length, 'Demand cursor exceeds the schedule.');
  for (const request of state.requests) {
    assert(engine.layout.ports.some(port => port.id === request.source) && engine.layout.ports.some(port => port.id === request.destination), `Request ${request.id} has an invalid port.`);
    assert(request.source !== request.destination, `Request ${request.id} has identical endpoints.`);
    assert(request.created >= 0 && request.created <= state.time + EPSILON && request.waiting >= 0, `Request ${request.id} has invalid time accounting.`);
    assert(request.waiting === stableRound(request.picked === undefined ? Math.max(0, state.time - request.created) : request.picked - request.created), `Request ${request.id} waiting time is inconsistent.`);
    assert(['pending', 'assigned', 'pickup', 'loaded', 'dropoff', 'completed'].includes(request.phase), `Request ${request.id} has invalid phase.`);
    if (request.phase === 'pending' || request.phase === 'completed') assert(request.vehicle === undefined || request.phase === 'completed', `Pending request ${request.id} has an assigned vehicle.`);
    if (request.phase === 'completed') assert(request.completed !== undefined && request.picked !== undefined && request.completed >= request.picked && request.completed <= state.time + EPSILON, `Completed request ${request.id} has invalid lifecycle timestamps.`);
    else assert(request.completed === undefined, `Unfinished request ${request.id} has a completion timestamp.`);
    if (request.picked !== undefined) assert(request.picked >= request.created && request.picked <= state.time + EPSILON, `Request ${request.id} has invalid pickup time.`);
    if(isOperationalEngineVersion(engine.state.version)){
      assert(!!request.timing&&Object.values(request.timing).every(value=>finite(value)&&value>=0),`Operational request ${request.id} has invalid timing buckets.`);
      const sum=Object.values(request.timing).reduce((a,b)=>a+b,0),end=request.completed??state.time;
      assert(Math.abs(sum-(end-request.created))<1e-6,`Operational request ${request.id} timing does not conserve age.`);
      if(request.assigned!==undefined)assert(request.assigned>=request.created&&request.vehicle!==undefined,`Operational request ${request.id} has invalid assignment time.`);
      if(request.pickupStarted!==undefined)assert(request.assigned!==undefined&&request.pickupStarted>=request.assigned,`Operational request ${request.id} has invalid pickup-start time.`);
      if(request.picked!==undefined)assert(request.pickupStarted!==undefined&&request.picked>=request.pickupStarted,`Operational request ${request.id} has invalid pickup completion time.`);
      if(request.dropoffStarted!==undefined)assert(request.picked!==undefined&&request.dropoffStarted>=request.picked,`Operational request ${request.id} has invalid dropoff-start time.`);
      if(request.completed!==undefined)assert(request.dropoffStarted!==undefined&&request.completed>=request.dropoffStarted,`Operational request ${request.id} has invalid completion time.`);
    }
  }
  for (const vehicle of state.vehicles) {
    assert(layout.nodes.some(node => node.id === vehicle.node), `Vehicle ${vehicle.id} has invalid node.`);
    assert(['idle', 'empty', 'pickup', 'loaded', 'dropoff'].includes(vehicle.phase), `Vehicle ${vehicle.id} has an invalid phase.`);
    assert(vehicle.progress >= 0 && vehicle.progress < 1 && vehicle.serviceRemaining >= 0 && vehicle.serviceRemaining <= SERVICE_SECONDS && vehicle.waiting >= 0 && vehicle.distance >= 0, `Vehicle ${vehicle.id} has invalid motion state.`);
    assert(vehicle.link !== undefined || vehicle.progress === 0, `Vehicle ${vehicle.id} has progress without a link.`);
    assert(['pickup', 'dropoff'].includes(vehicle.phase) || vehicle.serviceRemaining === 0, `Vehicle ${vehicle.id} has service time outside a service phase.`);
    if (vehicle.link) {
      const link = layout.links.find(item => item.id === vehicle.link);
      assert(!!link && link.from === vehicle.node, `Vehicle ${vehicle.id} is on an invalid link.`);
      assert(vehicle.route[0] === link.to, `Vehicle ${vehicle.id} route disagrees with its in-flight link.`);
    }
    {
      assert(typeof vehicle.parked === 'boolean' && Number.isInteger(vehicle.parkingSlot) && vehicle.parkingSlot! >= 0, `Vehicle ${vehicle.id} has invalid parking representation.`);
      assert(typeof vehicle.parkingPending==='boolean',`Vehicle ${vehicle.id} has invalid idle parking intent.`);
      if (vehicle.parked) assert(!vehicle.link && vehicle.phase === 'idle' && (layout.parkingNodes ?? []).includes(vehicle.node), `Parked vehicle ${vehicle.id} is not at an off-rail parking node.`);
      if (vehicle.parkingPending) assert(!vehicle.parked&&!vehicle.link&&vehicle.phase==='idle'&&!vehicle.request&&!vehicle.route.length,`Vehicle ${vehicle.id} has inconsistent pending-parking state.`);
      if (!vehicle.parked && !vehicle.link && vehicle.phase === 'idle' && vehicle.route.length===0 && !(layout.parkingNodes ?? []).includes(vehicle.node)) assert(vehicle.parkingPending, `Unparked idle vehicle ${vehicle.id} has no return route or pending dispatch state.`);
    }
    let cursor = vehicle.link ? layout.links.find(item => item.id === vehicle.link)!.to : vehicle.node;
    for (const [index, next] of vehicle.route.entries()) {
      if (vehicle.link && index === 0) continue;
      const link = directedSteps.get(cursor)?.get(next);
      assert(!!link, `Vehicle ${vehicle.id} route contains an illegal directed step.`);
      cursor = next;
    }
    if (vehicle.request) {
      const request = requestById.get(vehicle.request);
      assert(!!request && request.vehicle === vehicle.id && request.phase !== 'pending' && request.phase !== 'completed', `Vehicle ${vehicle.id} request assignment is inconsistent.`);
      assert(vehicle.loaded === ['loaded', 'dropoff'].includes(request.phase), `Vehicle ${vehicle.id} load state disagrees with request.`);
      const expectedVehiclePhase = ({ assigned: 'empty', pickup: 'pickup', loaded: 'loaded', dropoff: 'dropoff' } as const)[request.phase as 'assigned' | 'pickup' | 'loaded' | 'dropoff'];
      assert(vehicle.phase === expectedVehiclePhase, `Vehicle ${vehicle.id} phase disagrees with request ${request.id}.`);
      if (isOperationalEngineVersion(engine.state.version) && (request.phase === 'pickup' || request.phase === 'dropoff')) {
        const portId=request.phase==='pickup'?request.source:request.destination;
        const endpoint=engine.layout.ports.find(port=>port.id===portId)!.node;
        const started=request.phase==='pickup'?request.pickupStarted:request.dropoffStarted;
        const phaseTimestampsValid=request.phase==='pickup'
          ? request.pickupStarted!==undefined&&request.picked===undefined&&request.dropoffStarted===undefined&&request.completed===undefined
          : request.picked!==undefined&&request.dropoffStarted!==undefined&&request.completed===undefined;
        assert(!vehicle.link&&vehicle.route.length===0&&vehicle.node===endpoint&&vehicle.serviceRemaining>0&&started!==undefined&&started<=state.time+EPSILON&&phaseTimestampsValid,
          `Operational ${request.phase} service for ${request.id} is not owned at its endpoint.`);
      }
      const target = vehicle.loaded ? engine.layout.ports.find(port => port.id === request.destination)!.node : engine.layout.ports.find(port => port.id === request.source)!.node;
      const routeEnd = vehicle.route.length ? vehicle.route[vehicle.route.length - 1] : (vehicle.link ? engine.layout.links.find(link => link.id === vehicle.link)!.to : vehicle.node);
      assert(routeEnd === target || (vehicle.route.length === 0 && !vehicle.link), `Vehicle ${vehicle.id} route does not lead to its active request endpoint.`);
    } else assert(vehicle.phase === 'idle' && !vehicle.loaded && vehicle.serviceRemaining === 0, `Unassigned vehicle ${vehicle.id} is not idle.`);
  }
  for (const request of state.requests) if (['assigned', 'pickup', 'loaded', 'dropoff'].includes(request.phase)) {
    const vehicle = request.vehicle ? vehicleById.get(request.vehicle) : undefined;
    assert(!!vehicle && vehicle.request === request.id, `Active request ${request.id} has no owning vehicle.`);
  }
  const storedRequestIds = new Set<string>();
  for (const stored of state.storedFoups) {
    assert(requestById.get(stored.requestId)?.phase === 'completed', `Stored FOUP ${stored.requestId} has no completed transport.`);
    assert(!storedRequestIds.has(stored.requestId), `FOUP ${stored.requestId} is stored more than once.`);
    storedRequestIds.add(stored.requestId);
    assert(stored.releaseAt > state.time - EPSILON && engine.layout.ports.some(port => port.id === stored.portId), `Stored FOUP ${stored.requestId} has invalid release state.`);
  }
  for (const port of layout.ports) {
    const servicing = state.vehicles.filter(vehicle => {
      if (!vehicle.request) return false;
      const request = requestById.get(vehicle.request);
      return !!request && (vehicle.phase === 'pickup' ? request.source === port.id : vehicle.phase === 'dropoff' ? request.destination === port.id : false);
    });
    assert(servicing.length <= 1, `Port ${port.id} has overlapping service operations.`);
    const occupancy = engine.getPortOccupancy(port.id);
    assert(occupancy.stored + occupancy.reserved <= occupancy.capacity, `Port ${port.id} exceeds finite storage capacity.`);
  }
  const linkCounts = new Map<string, number>(), resources = new Map<string, number>();
  for (const vehicle of state.vehicles) if (vehicle.link) {
    const link = layout.links.find(item => item.id === vehicle.link)!;
    linkCounts.set(link.id, (linkCounts.get(link.id) ?? 0) + 1);
    if (link.resource) resources.set(link.resource, (resources.get(link.resource) ?? 0) + 1);
  }
  for (const [linkId, count] of linkCounts) {
    const link = layout.links.find(item => item.id === linkId)!;
    assert(count <= 1, `Exclusive section ${linkId} exceeds capacity.`);
  }
  for (const [resource, count] of resources) {
    const link = layout.links.find(item => item.resource === resource)!;
    assert(count <= link.capacity, `Resource ${resource} exceeds capacity.`);
  }
  {
    const stationary = new Map<string, number>(), reservations = new Map<string, number>(), sections = new Map<string, number>(), clearance = new Map<string, number>();
    for (const v of state.vehicles) if (!v.parked) {
      if (v.link) {
        const link=layout.links.find(l=>l.id===v.link)!;const destination=link.to;reservations.set(destination,(reservations.get(destination)??0)+1);
        const key=engine.sectionKey(link);sections.set(key,(sections.get(key)??0)+1);
        for(const node of [link.from,link.to])clearance.set(node,(clearance.get(node)??0)+1);
      }
      else stationary.set(v.node,(stationary.get(v.node)??0)+1);
    }
    for (const [node,count] of stationary) {assert(count <= 1, `V2 node ${node} has co-located live vehicles.`);clearance.set(node,(clearance.get(node)??0)+count);}
    for(const [key,count] of sections)assert(count<=1,`V2 physical section ${key} has opposing or duplicate traffic.`);
    if(isOperationalEngineVersion(engine.state.version)){
      const geometry=getControlGeometry(layout),live=state.vehicles.filter(v=>!v.parked&&v.link),byNode=new Map<string,Vehicle[]>();
      for(const v of state.vehicles)if(!v.parked&&!v.link)byNode.set(v.node,[...(byNode.get(v.node)??[]),v]);
      for(const [node,vehicles]of byNode)assert(vehicles.length<=1,`Operational node ${node} has co-located stationary vehicles.`);
      const endpointOwners=new Map<string,Set<string>>(),own=(node:string,id:string)=>{const ids=endpointOwners.get(node)??new Set<string>();ids.add(id);endpointOwners.set(node,ids);};
      for(const v of state.vehicles)if(!v.parked){
        if(!v.link)own(v.node,v.id);
        else{const link=layout.links.find(l=>l.id===v.link)!;own(link.to,v.id);if((engine.scenario.movementControl??'clearance')==='conservative'||v.progress<(geometry.originReleaseProgress.get(link.id)??0)-EPSILON)own(link.from,v.id);}
      }
      for(const [node,owners]of endpointOwners)assert(owners.size<=1,`Operational endpoint ${node} has conflicting live owners.`);
      for(const v of live){
        const link=layout.links.find(l=>l.id===v.link)!;
        for(const conflict of geometry.conflictingLinks.get(link.id)??[])assert(!live.some(other=>other.id!==v.id&&other.link===conflict),`Operational geometry conflict on ${link.id} and ${conflict}.`);
        for(const node of geometry.nearNodes.get(link.id)??[])assert(!byNode.has(node),`Operational link ${link.id} conflicts with stationary node ${node}.`);
      }
      for(const [node,count]of reservations)assert(count<=1&&!stationary.has(node),`Operational node ${node} has conflicting arrival reservations.`);
      const positioned=state.vehicles.filter(v=>!v.parked).map(v=>({vehicle:v,position:vehiclePosition(layout,v)})).filter((x):x is {vehicle:Vehicle;position:NonNullable<ReturnType<typeof vehiclePosition>>}=>!!x.position);
      for(let i=0;i<positioned.length;i++)for(let j=i+1;j<positioned.length;j++){
        const a=positioned[i],b=positioned[j];if(a.position.floor!==b.position.floor||a.position.transfer!==undefined||b.position.transfer!==undefined)continue;
        assert(Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)>=26-EPSILON,`Operational vehicle bodies overlap: ${a.vehicle.id} and ${b.vehicle.id}.`);
      }
      for(const v of live){
        const link=layout.links.find(l=>l.id===v.link)!;if((engine.scenario.movementControl??'clearance')!=='conservative'&&v.progress>=(geometry.originReleaseProgress.get(link.id)??0)-EPSILON)continue;
        const origin=layout.nodes.find(n=>n.id===link.from)!;
        for(const other of positioned){if(other.vehicle.id===v.id||other.position.floor!==origin.floor||other.position.transfer!==undefined)continue;assert(Math.hypot(other.position.x-origin.x,other.position.y-origin.y)>=36-EPSILON,`Operational held origin ${link.from} is not clear of ${other.vehicle.id}.`);}
      }
    }else{
      for(const [node,count]of clearance)assert(count<=1,`V2 node ${node} has conflicting live vehicle clearance.`);
      for (const [node,count] of reservations) assert(count <= 1 && !stationary.has(node), `V2 node ${node} has conflicting arrival reservations.`);
    }
    for (const q of state.linkQueues ?? []) {
      assert(layout.links.some(l=>l.id===q.linkId) || q.linkId.startsWith('node:'), `V2 queue references unknown section ${q.linkId}.`);
      assert(new Set(q.vehicleIds).size===q.vehicleIds.length && q.vehicleIds.every(id=>vehicleById.has(id)), `V2 queue has invalid vehicle order.`);
    }
  }
}
