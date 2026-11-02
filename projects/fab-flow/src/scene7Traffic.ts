import type { Layout, SimulationState } from './sim/types';

/** An authentic, non-service rail wait backed by Native linkQueues and
 * vehicle.waitReason. Selection and camera framing never modify the engine.
 */
export type RailTrafficFocus = {
  vehicleId: string;
  linkId: string;
  waitSeconds: number;
  nearbyActive: number;
  queueLength: number;
  /** Distance in Native world units from the selected camera target to the
   * nearest off-rail OHT pool. No pool should appear in Scene 07. */
  stagingClearance: number;
  frame: { x: number; z: number; span: number };
};

export function findRealRailWait(layout: Layout, state: SimulationState): RailTrafficFocus | undefined {
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const edges = new Map(layout.links.map(link => [link.id, link]));
  const outbound = new Map<string, typeof layout.links>();
  for (const edge of layout.links) {
    const links = outbound.get(edge.from) ?? [];
    links.push(edge); outbound.set(edge.from, links);
  }
  const live = state.vehicles.filter(v => !v.parked && !v.failed && !!v.request);
  const pools = (layout.parkingNodes ?? []).map(id => nodes.get(id)).filter((node):node is NonNullable<typeof node> => !!node);
  // The 3D canvas should show the actual blocked approach, never a nearby
  // staging gate where existing parked OHTs visually materialize on dispatch.
  // A fixed fleet is already enforced by the scenario: fleetChanges absent.
  const MIN_STAGING_CLEARANCE = 680;
  let winner: RailTrafficFocus | undefined, highest = -Infinity;
  for (const v of live) {
    if (v.link || v.waitReason !== 'rail' || v.waiting < 2 || !v.route.length) continue;
    const link = outbound.get(v.node)?.find(e => e.to === v.route[0]);
    const location = nodes.get(v.node), ahead = link && nodes.get(link.to);
    if (!link || !location || !ahead || !edges.has(link.id)) continue;
    const focusX = (location.x + ahead.x) / 2, focusY = (location.y + ahead.y) / 2;
    const stagingClearance = pools.length
      ? Math.min(...pools.map(pool => Math.hypot(focusX - pool.x, focusY - pool.y))) : Infinity;
    if (stagingClearance < MIN_STAGING_CLEARANCE) continue;
    // Never center the documentary on an OHT injection / return spur.
    if (link.id.includes('staging-') || v.node.includes('STAGING')) continue;
    const queue = state.linkQueues?.find(q => q.linkId === link.id);
    // The vehicle must actually be queued for the blocked directed link.
    if (!queue?.vehicleIds.includes(v.id)) continue;
    const nearbyActive = live.filter(other => {
      const at = nodes.get(other.node);
      return at && Math.hypot(location.x - at.x, location.y - at.y) < 820;
    }).length;
    const waitSeconds = v.waiting;
    const score = Math.min(waitSeconds,18) * 1.1 + Math.min(nearbyActive,12) * 3
      + (queue.vehicleIds.length - 1) * 6 + Math.min(stagingClearance - MIN_STAGING_CLEARANCE,400) * .03;
    if (score <= highest) continue;
    highest = score;
    winner = { vehicleId:v.id, linkId:link.id,waitSeconds,nearbyActive,
      queueLength:queue.vehicleIds.length,stagingClearance,
      frame:{x:focusX,z:focusY,span:560} };
  }
  return winner;
}
