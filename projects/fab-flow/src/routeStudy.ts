import { Engine, type DecisionInspection, type RouteCandidate } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { publicationCopy } from './sim/publication';
import { candidateRoutesV6 } from './sim/topology-routing';
import type { Layout, Scenario, SimulationState } from './sim/types';

type Contrast = { distinctFraction: number; maxSeparation: number };
export type NativeRouteStudy = {
  engine: Engine;
  state: SimulationState;
  decision: DecisionInspection;
  selected: RouteCandidate;
  alternative: RouteCandidate;
  alternativeKind: 'native' | 'detour';
  contrast: Contrast;
  seed: number;
  sourceBay: string;
  destinationBay: string;
  vehicleId: string;
  frame: { x: number; z: number; span: number };
};

/** The original Engine's seeded-demand randomizer; not a manufactured transport. */
function firstRequestSeed(layout: Layout): number[] {
  const ports = layout.ports, nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const choices: Array<{ seed: number; score: number }> = [];
  for (let seed = 1; seed <= 140000; seed++) {
    let state = (seed | 0) || 0x6d2b79f5;
    const random = () => {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
    if (Math.floor((random() * 0.8 * 60) / 0.5) !== 0) continue;
    const source = ports[Math.floor(random() * ports.length)]!;
    const destinations = ports.filter(port => port.id !== source.id);
    const destination = destinations[Math.floor(random() * destinations.length)]!;
    const a = nodes.get(source.node), b = nodes.get(destination.node);
    if (!a || !b || source.kind !== 'tool' || destination.kind !== 'tool') continue;
    const sourceNo = Number(source.area.match(/^B(\d+)$/)?.[1]);
    const destinationNo = Number(destination.area.match(/^B(\d+)$/)?.[1]);
    if (!Number.isInteger(sourceNo) || !Number.isInteger(destinationNo)) continue;
    // The Large V6 grid is 3 x 3; only opposite corner Bay pairs count.
    const rowDelta = Math.abs(Math.floor((sourceNo - 1) / 3) - Math.floor((destinationNo - 1) / 3));
    const columnDelta = Math.abs((sourceNo - 1) % 3 - (destinationNo - 1) % 3);
    if (rowDelta !== 2 || columnDelta !== 2) continue;
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    if (dx < 3400 || dy < 1700) continue;
    choices.push({ seed, score: Math.abs(dx - 4200) + Math.abs(dy - 2200) * .35 });
    if (choices.length >= 36) break;
  }
  return choices.sort((a, b) => a.score - b.score).map(choice => choice.seed);
}

function contrastBetween(layout: Layout, from: string, selected: RouteCandidate, alternative: RouteCandidate): Contrast {
  const byId = new Map(layout.nodes.map(node => [node.id, node]));
  const lengthById = new Map(layout.links.map(link => [link.id, link.length]));
  const common = new Set(selected.links);
  const shared = alternative.links.reduce((sum, id) => sum + (common.has(id) ? lengthById.get(id) ?? 0 : 0), 0);
  const selectedLength = selected.links.reduce((sum, id) => sum + (lengthById.get(id) ?? 0), 0);
  const alternativeLength = alternative.links.reduce((sum, id) => sum + (lengthById.get(id) ?? 0), 0);
  const distinctFraction = 1 - shared / Math.max(1, Math.min(selectedLength, alternativeLength));
  const selectedPoints = [from, ...selected.nodes].map(id => byId.get(id)).filter((node): node is Layout['nodes'][number] => !!node);
  const alternativePoints = alternative.nodes.map(id => byId.get(id)).filter((node): node is Layout['nodes'][number] => !!node);
  const gapToSegment = (x: number, y: number, a: Layout['nodes'][number], b: Layout['nodes'][number]) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x-a.x)*dx + (y-a.y)*dy) / (dx*dx + dy*dy || 1)));
    return Math.hypot(x-a.x-dx*t, y-a.y-dy*t);
  };
  const maxSeparation = Math.max(0, ...alternativePoints.map(point => Math.min(
    ...selectedPoints.slice(1).map((end, index) => gapToSegment(point.x, point.y, selectedPoints[index]!, end))
  )));
  return { distinctFraction, maxSeparation };
}

function alternativeRoute(layout: Layout, decision: DecisionInspection, selected: RouteCandidate) {
  const discovered: Array<{ route: RouteCandidate; kind: 'native' | 'detour'; contrast: Contrast }> = [];
  const selectedSignature = selected.links.join('|');
  const add = (route: RouteCandidate, kind: 'native' | 'detour') => {
    if (!route.links.length || route.links.join('|') === selectedSignature ||
        route.links[0] === undefined || route.links.at(-1) === undefined) return;
    const contrast = contrastBetween(layout, decision.from, selected, route);
    if (contrast.distinctFraction >= .2 && contrast.maxSeparation >= 360) {
      discovered.push({ route, kind, contrast });
    }
  };
  decision.candidates.filter(route => !route.selected).forEach(route => add(route, 'native'));
  if (!discovered.length) {
    // On a realistic one-way network the two shortest unrestricted paths can
    // differ by only one tiny side-link. Search legal, materially separate
    // detours by temporarily excluding a *route-planning* edge (not changing
    // the actual Engine or its MCS choice). Keep the counterfactual explicit.
    const cuts = [...new Set([.25, .37, .5, .63, .75].map(fraction =>
      selected.links[Math.floor(fraction * (selected.links.length - 1))]!
    ))];
    for (const cut of cuts) {
      for (const candidate of candidateRoutesV6(layout, decision.from, decision.to, 3, [cut])) {
        add({
          nodes: candidate.nodes.slice(1),
          links: [...candidate.links],
          distance: candidate.length,
          cost: candidate.length,
          selected: false,
        }, 'detour');
      }
    }
  }
  return discovered.sort((a, b) =>
    (b.contrast.distinctFraction * 6 + b.contrast.maxSeparation / 1300) -
    (a.contrast.distinctFraction * 6 + a.contrast.maxSeparation / 1300)
  )[0];
}

/** Inspect a real loaded FOUP request across diagonal opposite Large V6 Bays. */
export function buildNativeRouteStudy(): NativeRouteStudy {
  const base: Scenario = {
    ...operationalScenario('large'), fleet: 12, demand: 1,
    duration: 1600, demandWindow: 60, seed: 1,
    pattern: 'steady', distribution: 'balanced', policy: 'DBR',
  };
  const probe = new Engine(base, { analysis: false });
  for (const seed of firstRequestSeed(probe.layout)) {
    const engine = new Engine({ ...base, seed }, { analysis: false });
    if (engine.getNextDemand()?.at !== 0) continue;
    for (let tick = 0; tick < 1800; tick++) {
      engine.step(1);
      const req = engine.state.requests[0];
      if (!req?.vehicle || req.phase === 'completed') break;
      if (req.phase !== 'loaded' && req.phase !== 'dropoff') continue;
      const decision = engine.inspectDecision(req.vehicle);
      const selected = decision?.candidates.find(path => path.selected);
      const source = engine.layout.ports.find(port => port.id === req.source);
      const destination = engine.layout.ports.find(port => port.id === req.destination);
      if (!decision || !selected || selected.links.length < 12 || !source || !destination ||
          decision.from !== source.node || decision.to !== destination.node) continue;
      const alternative = alternativeRoute(engine.layout, decision, selected);
      if (!alternative) break; // Try the next real demand seed, not a fabricated path.
      const byId = new Map(engine.layout.nodes.map(node => [node.id, node]));
      const both = [decision.from, ...selected.nodes, ...alternative.route.nodes]
        .map(id => byId.get(id)).filter((node): node is Layout['nodes'][number] => !!node);
      const minX = Math.min(...both.map(node => node.x)), maxX = Math.max(...both.map(node => node.x));
      const minY = Math.min(...both.map(node => node.y)), maxY = Math.max(...both.map(node => node.y));
      return {
        engine,
        state: publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state,
        decision, selected, alternative: alternative.route,
        alternativeKind: alternative.kind, contrast: alternative.contrast, seed,
        sourceBay: source.area, destinationBay: destination.area, vehicleId: req.vehicle,
        frame: { x: (minX + maxX) / 2, z: (minY + maxY) / 2,
          span: Math.max(1200, (maxX - minX) * 1.5, (maxY - minY) * 1.85) },
      };
    }
  }
  throw new Error('No genuine diagonal transport with two visually different legal routes was found.');
}
