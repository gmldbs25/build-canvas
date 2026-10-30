import type { Layout, LayoutId, LayoutVersion, Policy, Scenario, SingleFloorLayoutId } from './types';
import { generateDefaultTopologyV6 } from './topology-default-v6';
import { generateMultiLargeTopology } from './topology-multi-large';

/** Supported FABs. V6 is the only authored single-floor family. */
export const LAYOUT_IDS: readonly SingleFloorLayoutId[] = ['small', 'medium', 'large'];

const defaultLayouts: Partial<Record<LayoutId, Layout>> = {};

export function getLayout(id: LayoutId, version: LayoutVersion = id === 'multi-large' ? 'multi-large-1' : '6'): Layout {
  if (id === 'multi-large') {
    if (version !== 'multi-large-1') throw new Error(`Unsupported layout version: ${String(version)}`);
    return defaultLayouts[id] ??= generateMultiLargeTopology();
  }
  if (!(LAYOUT_IDS as readonly string[]).includes(id)) throw new Error(`Unknown layout: ${String(id)}`);
  if (version !== '6') throw new Error(`Unsupported layout version: ${String(version)}`);
  return defaultLayouts[id] ??= generateDefaultTopologyV6(id);
}

export function defaultScenario(id: LayoutId = 'large'): Scenario {
  if (id === 'multi-large') return multiLargeScenario();
  if (!(LAYOUT_IDS as readonly string[]).includes(id)) throw new Error(`Unknown layout: ${String(id)}`);
  return { version: 1, layoutVersion: '6', operationalVersion: '2.1', layoutId: id,
    fleet: id === 'small' ? 8 : id === 'medium' ? 18 : 48, demand: 40, duration: 300, seed: 17,
    policy: 'DBR', pattern: 'steady', distribution: 'balanced', bridgeCapacity: 1,
    lifterCapacity: 1, storageCapacity: 5, failures: [] };
}

/** Native experiment fixture for checkpoint 2; setup selectors remain single-floor only. */
export function multiLargeScenario(seed = 17, policy: Policy = 'DBR'): Scenario {
  return {
    version: 1, layoutVersion: 'multi-large-1', operationalVersion: '2.3', layoutId: 'multi-large',
    fleet: 48, demand: 0, demandMode: 'interval', demandIntervalSeconds: 30, demandStage: 'relaxed', initialRequests: 2,
    demandChanges: [], demandWindow: 5400, duration: 7200, seed, policy, pattern: 'steady', distribution: 'balanced',
    bridgeCapacity: 1, lifterCapacity: 1, storageCapacity: 5, failures: [], movementControl: 'clearance', deadlockPolicy: 'prevent-recover',
  };
}
