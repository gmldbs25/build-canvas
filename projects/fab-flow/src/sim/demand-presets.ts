import { operationalScenario } from './experiments';
import type { DemandStage, LayoutId, Policy, Scenario } from './types';

export type PresetLayout = LayoutId;
export const PRESETS: Array<{ id: DemandStage; name: string; short: string; description: string }> = [
  { id: 'relaxed', name: '여유롭게 운영', short: '첫 운송부터 차근차근', description: '1건 / 30초의 고정 수요로 시작합니다. 픽업과 실제 완료를 관찰하세요.' },
  { id: 'active', name: '활발한 운송', short: '더 바쁜 차량과 경쟁', description: '차량이 더 자주 활동하며 대기와 운송 경쟁이 생길 수 있습니다. 무교착이나 높은 완료율을 보장하지 않습니다.' },
  { id: 'congested', name: '혼잡 실험', short: '대기·병목·정책 비교', description: '1건 / 1초의 고정 수요로 대기와 병목을 관찰합니다. 완료와 미완료를 함께 보며 DBR/CBR을 비교하세요.' },
];

/** V3.3 demand intervals are fixed across FAB sizes and fleet counts. */
export const PRESET_INTERVALS: Record<DemandStage, number> = { relaxed: 30, active: 10, congested: 1 };

/** Default fleets, with the fixed intervals retained in the existing export shape. */
export const PRESET_CAPACITY: Record<PresetLayout, { fleet: number; relaxed: number; active: number; congested: number }> = {
  small: { fleet: 8, ...PRESET_INTERVALS },
  medium: { fleet: 18, ...PRESET_INTERVALS },
  large: { fleet: 48, ...PRESET_INTERVALS },
  'multi-large': { fleet: 48, ...PRESET_INTERVALS },
};

export function presetInterval(_layoutId: PresetLayout, _fleet: number, stage: DemandStage): number {
  return PRESET_INTERVALS[stage];
}

export function presetScenario(layoutId: PresetLayout = 'small', stage: DemandStage = 'relaxed', seed = 17, policy: Policy = 'DBR', fleet = PRESET_CAPACITY[layoutId].fleet): Scenario {
  if (layoutId === 'multi-large') throw new Error('Use multiLargeScenario for Native multi-floor experiments.');
  return { ...operationalScenario(layoutId), fleet, seed, policy, demand: 0, demandMode: 'interval', demandIntervalSeconds: presetInterval(layoutId, fleet, stage), demandStage: stage, initialRequests: 2, demandChanges: [], duration: 7200, demandWindow: 5400, pattern: 'steady', distribution: 'balanced', failures: [] };
}

export function activeDemand(scenario: Scenario, at: number): { stage: DemandStage; intervalSeconds: number; paused?: true } {
  const change = [...(scenario.demandChanges ?? [])].reverse().find(change => change.at <= at);
  return {
    stage: change?.stage ?? scenario.demandStage ?? 'relaxed',
    intervalSeconds: change?.intervalSeconds ?? scenario.demandIntervalSeconds ?? 120,
    ...(change?.paused === true ? { paused: true as const } : {}),
  };
}

export function manualDemand(scenario: Scenario, layoutId: LayoutId = scenario.layoutId): Scenario {
  if (layoutId === 'multi-large') throw new Error('Use the Multi Large Native demand controls for this layout.');
  const { demandIntervalSeconds: _interval, demandStage: _stage, initialRequests: _initial, demandChanges: _changes,
    interventions: _events, initialPolicy: _initialPolicy, interventionHistoryComplete: _coverage, ...rest } = scenario;
  const base = operationalScenario(layoutId);
  const duration = Math.min(7200, scenario.duration);
  return { ...base, ...rest, layoutId, layoutVersion: '6', operationalVersion: scenario.operationalVersion, duration, demandWindow: base.operationalVersion ? Math.min(scenario.demandWindow ?? duration, duration) : undefined, failures: layoutId === scenario.layoutId ? scenario.failures : [], ...(scenario.demandMode === 'interval' ? { demandMode: 'per-10-seconds', requestsPer10Seconds: 4 } : {}) };
}
