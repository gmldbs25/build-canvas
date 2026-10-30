import { presetScenario, type PresetLayout } from '@/sim/demand-presets';
import { workloadScenario, type Workload } from '@/sim/experiments';
import type { DemandStage, Policy, Scenario } from '@/sim/types';

/** Product-facing default for a newly created FAB. */
export function newSandboxScenario(
  layoutId: PresetLayout = 'small',
  stage: DemandStage = 'relaxed',
  seed = 17,
  policy: Policy = 'DBR',
  fleet?: number,
): Scenario {
  if (layoutId === 'multi-large') throw new Error('Use multiLargeScenario for Native multi-floor experiments.');
  return { ...presetScenario(layoutId, stage, seed, policy, fleet), layoutVersion: '6', operationalVersion: '2.2', transportRecovery: { version: '1.0', startAt: 0 } };
}

/** Advanced new experiments use the same product map as the beginner setup. */
export function newWorkloadScenario(workload: Workload, seed = 17, policy: Policy = 'DBR'): Scenario {
  return { ...workloadScenario(workload, seed), layoutVersion: '6', policy, operationalVersion: '2.2', transportRecovery: { version: '1.0', startAt: 0 } };
}
