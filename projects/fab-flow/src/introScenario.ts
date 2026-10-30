import type { Layout, Scenario } from './sim/types';

/**
 * Choose a LOCAL teaching example from the native seeded-demand space.
 *
 * The selector never changes a request, vehicle position or path: its only
 * output is a seed. Engine.generateSchedule() creates the actual request and
 * the native MCS calculates the real directed route afterwards.
 *
 * This selector mirrors just the first three random draws of the supported
 * steady/balanced, one-request scenario (FAB FLOW Engine 2.1). If that
 * algorithm changes, the runtime verifies the actual seeded demand matches.
 */
function seededRandom(seed: number): () => number {
  let state = (seed | 0) || 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export type LocalIntroChoice = {
  seed: number;
  source: string;
  destination: string;
  // Graph-based estimate used ONLY to pick a seed; not the engine's route.
  shortestDirectedDistance: number;
};

function directedDistance(layout: Layout, from: string, to: string): number {
  if (from === to) return 0;
  const edges = new Map<string, Array<{ node: string; length: number }>>();
  for (const link of layout.links) {
    const list = edges.get(link.from) ?? [];
    list.push({ node: link.to, length: link.length });
    edges.set(link.from, list);
  }
  const best = new Map<string, number>([[from, 0]]);
  const open: Array<{ id: string; cost: number }> = [{ id: from, cost: 0 }];
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const item = open.shift()!;
    if (item.cost !== best.get(item.id)) continue;
    if (item.id === to) return item.cost;
    for (const edge of edges.get(item.id) ?? []) {
      const cost = item.cost + edge.length;
      if (cost < (best.get(edge.node) ?? Infinity)) {
        best.set(edge.node, cost);
        open.push({ id: edge.node, cost });
      }
    }
  }
  return Infinity;
}

export function chooseLocalIntroDemand(layout: Layout, scenario: Pick<Scenario, 'demand' | 'demandWindow' | 'distribution' | 'pattern'>): LocalIntroChoice {
  if (scenario.pattern !== 'steady' || scenario.distribution !== 'balanced' || scenario.demand !== 1 || scenario.demandWindow !== 60) {
    throw new Error('Local scene selector assumes the pinned single-request native schedule.');
  }
  const ports = layout.ports;
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  let best: LocalIntroChoice | undefined;
  let bestScore = Infinity;
  // Native V6 rails are one-way. A physically close port on the reverse lane
  // may require a big loop: compare directed network distance with straight
  // distance as well as checking that both tools are in the same Bay.
  //
  // This searches only the seeded Engine's legal input space; no path, request,
  // edge or native movement rule is changed for the teaching presentation.
  for (let seed = 1; seed <= 16000; seed++) {
    const random = seededRandom(seed);
    const at = Math.floor((random() * 0.8 * 60) / 0.5) * 0.5;
    if (at !== 0) continue;
    const source = ports[Math.floor(random() * ports.length)]!;
    const destinations = ports.filter(port => port.id !== source.id);
    const destination = destinations[Math.floor(random() * destinations.length)]!;
    if (source.kind !== 'tool' || destination.kind !== 'tool' || source.area !== destination.area) continue;
    const a = nodes.get(source.node), b = nodes.get(destination.node);
    if (!a || !b) continue;
    const direct = Math.hypot(a.x - b.x, a.y - b.y);
    if (direct < 180 || direct > 740) continue;
    const directed = directedDistance(layout, source.node, destination.node);
    if (!Number.isFinite(directed) || directed < 150) continue;
    const detour = directed / Math.max(1, direct);
    if (directed > 1350 || detour > 3.2) continue;
    const candidate = { seed, source: source.id, destination: destination.id, shortestDirectedDistance: directed };
    // The lowest score favors a clearly visible local trip that does not wrap
    // the bay for no apparent reason. Directed geometry remains the authority.
    const score = directed + Math.max(0, detour - 1.3) * 800 + Math.max(0, direct - 500) * 0.8;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
    // A short, near-direct route is an excellent beginner demonstration.
    if (directed >= 210 && directed <= 580 && detour <= 1.4) return candidate;
  }
  if (!best) {
    throw new Error('Could not locate a valid local Native Engine transport without a major directed-rail detour.');
  }
  return best;
}
