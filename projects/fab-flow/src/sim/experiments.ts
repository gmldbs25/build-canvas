import { defaultScenario } from './layouts';
import type { LayoutId, Scenario, Policy } from './types';

/** Matched experiments hold policy fixed; session switches are not treatments. */
export function policyComparisonScenario(scenario: Scenario, policy: Policy): Scenario {
  const { interventions: _events, initialPolicy: _initial, interventionHistoryComplete: _coverage, ...inputs } = scenario;
  return { ...inputs, policy };
}

export type Workload = 'low' | 'normal' | 'near-saturation' | 'stress';
export const WORKLOADS: Record<Workload, { name: string; fleet: number; demand: number; pattern: Scenario['pattern']; note: string }> = {
  low: { name: '낮은 수요', fleet: 12, demand: 1, pattern: 'steady', note: 'M1: 12대·1건/분에서 빈차·적재 이동이 지연의 대부분을 차지했습니다.' },
  normal: { name: '일반 부하', fleet: 24, demand: 2, pattern: 'steady', note: '장거리 운송을 고려해 24대·2건/분에서 수요와 Drain을 나누어 관찰합니다.' },
  'near-saturation': { name: '포화 접근', fleet: 48, demand: 5, pattern: 'steady', note: '48대·8건/분 실험의 후반 처리량은 약 5.5건/분이었습니다. 5·6건/분 경계를 별도로 관찰합니다.' },
  stress: { name: '극한 부하', fleet: 300, demand: 120, pattern: 'peak', note: 'Peak는 발생 시간대의 실제 요청률이 약 240건/분입니다. 모든 요청의 처리를 보장하지 않습니다.' },
};

/** Standard operating defaults for the single supported FAB. */
export function operationalScenario(layoutId: LayoutId = 'large'): Scenario {
  if (layoutId === 'multi-large') throw new Error('Use multiLargeScenario for Native multi-floor experiments.');
  const base = defaultScenario(layoutId);
  return {
    ...base, operationalVersion: '2.1', fleet: layoutId === 'large' ? 24 : base.fleet,
    demand: 2, duration: 3600, demandWindow: 1800,
  };
}

export function workloadScenario(workload: Workload, seed = 17): Scenario {
  const setting = WORKLOADS[workload];
  return {
    ...operationalScenario('large'), fleet: setting.fleet, demand: setting.demand,
    pattern: setting.pattern, seed, distribution: 'balanced',
    duration: 7200, demandWindow: 3600,
  };
}
