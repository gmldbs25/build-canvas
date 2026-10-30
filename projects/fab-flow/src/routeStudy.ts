import { Engine, type DecisionInspection, type RouteCandidate } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { publicationCopy } from './sim/publication';
import type { Layout, Scenario, SimulationState } from './sim/types';

export type NativeRouteStudy = {
  engine: Engine;
  state: SimulationState;
  decision: DecisionInspection;
  selected: RouteCandidate;
  alternative: RouteCandidate;
  seed: number;
  sourceBay: string;
  destinationBay: string;
  vehicleId: string;
  frame: { x: number; z: number; span: number };
};

/** Identical seeded-demand randomizer, NOT a substitute for engine routing. */
function firstRequestSeed(layout: Layout): number[] {
  const ports = layout.ports;
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const choices: Array<{ seed: number; score: number }> = [];
  for (let seed = 1; seed <= 140000; seed++) {
    let state = (seed | 0) || 0x6d2b79f5;
    const random = () => {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
    const at = Math.floor((random() * 0.8 * 60) / 0.5) * 0.5;
    if (at !== 0) continue;
    const source = ports[Math.floor(random() * ports.length)]!;
    const destinations = ports.filter(port => port.id !== source.id);
    const destination = destinations[Math.floor(random() * destinations.length)]!;
    const a = nodes.get(source.node), b = nodes.get(destination.node);
    if (!a || !b || source.kind !== 'tool' || destination.kind !== 'tool' || source.area === destination.area) continue;
    const xDistance = Math.abs(a.x-b.x), yDistance = Math.abs(a.y-b.y);
    // Different parts of the full FAB, far enough for junctions and choices
    // to be legible. Avoid the tiny one-Bay teaching transport from Scene03.
    // Choose a demonstrably longer inter-Bay transport (roughly two
    // columns apart), not another adjacent-Bay delivery as in Scene03.
    if (xDistance < 3300 || xDistance > 5500 || yDistance > 1250) continue;
    const score = Math.abs(xDistance-4200) + yDistance * .4;
    choices.push({seed,score});
    if (choices.length >= 18) break;
  }
  return choices.sort((a,b)=>a.score-b.score).map(item=>item.seed);
}

/**
 * Produce an actual Native Engine MCS decision for a multi-Bay transport.
 * We inspect the selected decision and the native MCS's alternative paths.
 * The educational view freezes the engine at its first loaded leg so the
 * viewer can compare routes without the OHT racing out of frame.
 */
export function buildNativeRouteStudy(): NativeRouteStudy {
  const base: Scenario = {
    ...operationalScenario('large'), fleet: 12, demand: 1,
    duration: 1400, demandWindow: 60, seed: 1,
    pattern: 'steady', distribution: 'balanced', policy: 'DBR',
  };
  const probe = new Engine(base, {analysis:false});
  const seeds = firstRequestSeed(probe.layout);
  for (const seed of seeds) {
    const engine = new Engine({...base,seed}, {analysis:false});
    if (engine.getNextDemand()?.at !== 0) continue;
    for (let tick=0; tick<1350; tick++) {
      engine.step(1);
      const req = engine.state.requests[0];
      if (!req?.vehicle || req.phase === 'completed') break;
      if (req.phase !== 'loaded' && req.phase !== 'dropoff') continue;
      const candidate = engine.inspectDecision(req.vehicle);
      const selected = candidate?.candidates.find(path => path.selected);
      const alternative = candidate?.candidates.find(path =>
        !path.selected && path.links.length >= 8 && path.links.join('|') !== selected?.links.join('|'));
      if (!candidate || !selected || !alternative || selected.links.length < 12 ||
          candidate.to !== engine.layout.ports.find(port=>port.id===req.destination)?.node) continue;
      const points = selected.nodes.map(nodeId=>engine.layout.nodes.find(node=>node.id===nodeId))
        .filter((node): node is Layout['nodes'][number]=>!!node);
      const source = engine.layout.ports.find(port=>port.id===req.source);
      const destination = engine.layout.ports.find(port=>port.id===req.destination);
      if (!points.length || !source || !destination) continue;
      // The complete selected route plus its alternative should fit inside
      // a real Native V6 3D frame with room for the editorial annotation.
      const byId = new Map(engine.layout.nodes.map(node=>[node.id,node]));
      const both = [...selected.nodes,...alternative.nodes].map(id=>byId.get(id)).filter((n):n is Layout['nodes'][number]=>!!n);
      const minX=Math.min(...both.map(n=>n.x)), maxX=Math.max(...both.map(n=>n.x));
      const minZ=Math.min(...both.map(n=>n.y)), maxZ=Math.max(...both.map(n=>n.y));
      return {
        engine,
        state:publicationCopy({version:1,scenario:engine.scenario,state:engine.state}).state,
        decision:candidate, selected, alternative, seed,
        sourceBay:source.area,destinationBay:destination.area,vehicleId:req.vehicle,
        frame:{x:(minX+maxX)/2,z:(minZ+maxZ)/2,span:Math.max(1100,(maxX-minX)*1.55,(maxZ-minZ)*1.75)},
      };
    }
  }
  throw new Error('No native multi-Bay MCS decision with a distinct alternative was found.');
}
