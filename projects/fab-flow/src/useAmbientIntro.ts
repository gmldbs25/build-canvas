import { useEffect, useRef, useState } from 'react';
import { Engine } from './sim/engine';
import { vehiclePosition } from './sim/geometry';
import { publicationCopy } from './sim/publication';
import type { Scenario, SimulationState } from './sim/types';

const FRAME_SPAN = 720;
const TICK_PLAYBACK_MS = 115;
const freeze = (engine: Engine): SimulationState =>
  publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;

export type OpeningTableauFrame = { x: number; z: number; span: number };

/**
 * Scene 01/02 are an *independent, genuine native operating world*.
 *
 * They deliberately show several vehicles passing through one local corridor
 * in a fixed camera shot. We never follow the currently assigned vehicle:
 * that close-up single-OHT exercise belongs to Scene 03.
 *
 * The original FAB FLOW Engine calculates all dispatch/movement/FOUP state.
 * Pre-running native ticks only gives an active opening tableau rather than
 * a screen full of empty, parked OHTs.
 */
function createOpeningWorld(baseScenario: Scenario) {
  const scenario: Scenario = {
    ...baseScenario,
    fleet: 32,
    demand: 15,
    seed: 47,
    distribution: 'hotspot',
    pattern: 'steady',
    demandWindow: 480,
    duration: 1200,
  };
  const engine = new Engine(scenario, { analysis: false });
  engine.step(240); // 120 simulated seconds before first frame
  const moving = engine.state.vehicles
    .filter(v => !v.parked && (v.phase === 'empty' || v.phase === 'loaded'))
    .map(v => ({ vehicle: v, pose: vehiclePosition(engine.layout, v) }))
    .filter((item): item is {vehicle: typeof item.vehicle; pose: NonNullable<typeof item.pose>} =>
      item.pose !== null && item.pose.floor === 0);

  const firstArea = engine.layout.areas.find(area => area.floor === 0)!;
  const nearby = moving.filter(item =>
    item.pose.x >= firstArea.x && item.pose.x <= firstArea.x + firstArea.width &&
    item.pose.y >= firstArea.y && item.pose.y <= firstArea.y + firstArea.height);
  const candidates = nearby.length >= 2 ? nearby : moving;
  let best: OpeningTableauFrame = {
    x: firstArea.x + firstArea.width * .42,
    z: firstArea.y + firstArea.height * .48,
    span: FRAME_SPAN,
  };
  let bestCount = -1;
  for (const item of candidates) {
    const x = item.pose.x, z = item.pose.y;
    const cluster = moving.filter(other =>
      Math.abs(other.pose.x - x) < FRAME_SPAN * .37 &&
      Math.abs(other.pose.y - z) < FRAME_SPAN * .30);
    const score = cluster.length;
    if (score > bestCount) {
      bestCount = score;
      // Observing multiple real OHTs is the point of this opening;
      // a fixed midpoint gives the nearby traffic room to cross the frame.
      best = {
        x: cluster.reduce((sum, other) => sum + other.pose.x, 0) / cluster.length,
        z: cluster.reduce((sum, other) => sum + other.pose.y, 0) / cluster.length,
        span: FRAME_SPAN,
      };
    }
  }
  return { engine, frame: best, openingMovingVehicles: moving.length, openingLocalVehicles: Math.max(0,bestCount) };
}

export function useAmbientIntro(scenario: Scenario, active: boolean) {
  const worldRef = useRef<ReturnType<typeof createOpeningWorld> | null>(null);
  if (!worldRef.current) worldRef.current = createOpeningWorld(scenario);
  const { engine, frame, openingMovingVehicles, openingLocalVehicles } = worldRef.current;
  const [state, setState] = useState<SimulationState>(() => freeze(engine));
  useEffect(() => {
    if (!active || engine.state.time >= engine.scenario.duration) return;
    // One genuine 0.5s tick per display interval. Previously advancing three
    // native ticks at a time forced abrupt jumps on short visible rail spans.
    const timer = window.setInterval(() => {
      if (engine.state.time + .5 > engine.scenario.duration) {
        window.clearInterval(timer); return;
      }
      engine.step();
      setState(freeze(engine));
    }, TICK_PLAYBACK_MS);
    return () => window.clearInterval(timer);
  }, [active, engine]);
  return { engine, state, frame, tickMs: TICK_PLAYBACK_MS, openingMovingVehicles, openingLocalVehicles };
}
