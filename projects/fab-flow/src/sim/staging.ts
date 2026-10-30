import type { Layout, Scenario } from './types';

/** Separate, pure staging random stream: demand/failure PRNG state is never consumed. */
export function stagingNode(layout: Layout, scenario: Scenario, ordinal: number): string {
  const anchors = [...(layout.parkingNodes ?? [])];
  if (!anchors.length) throw new Error('No off-rail staging anchor.');
  if (layout.id === 'multi-large') {
    const nodes = new Map(layout.nodes.map(node => [node.id, node]));
    const floor = ordinal % 2 === 1 ? 0 : 1;
    const floorAnchors = anchors.filter(id => nodes.get(id)?.floor === floor);
    if (!floorAnchors.length) throw new Error(`No off-rail staging anchor on Multi Large floor ${floor + 1}.`);
    let state = (scenario.seed ^ (floor === 0 ? 0x51a61e3d : 0x2e8cb3c7)) >>> 0;
    for (let i = floorAnchors.length - 1; i > 0; i--) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      const j = (state >>> 0) % (i + 1);
      [floorAnchors[i], floorAnchors[j]] = [floorAnchors[j], floorAnchors[i]];
    }
    return floorAnchors[Math.floor((ordinal - 1) / 2) % floorAnchors.length];
  }
  {
    let state = (scenario.seed ^ 0x51a61e3d) >>> 0;
    for (let i = anchors.length - 1; i > 0; i--) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      const j = (state >>> 0) % (i + 1);
      [anchors[i], anchors[j]] = [anchors[j], anchors[i]];
    }
  }
  return anchors[(ordinal - 1) % anchors.length];
}
