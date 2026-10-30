import { useEffect, useRef, useState } from 'react';
import { Engine } from './sim/engine';
import { publicationCopy } from './sim/publication';
import type { Scenario, SimulationState } from './sim/types';

const freeze = (engine: Engine): SimulationState =>
  publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;

/**
 * A real, independent native journey for the opening observation.
 * Scene 03 retains its separately paused tutorial Engine so that a visitor
 * can always begin a single transport from a fresh known request boundary.
 * The 9-Bay world is identical, only the native engine clock differs.
 */
export function useAmbientIntro(scenario: Scenario, active: boolean) {
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) engineRef.current = new Engine(scenario, { analysis: false });
  const engine = engineRef.current;
  const [state, setState] = useState<SimulationState>(() => freeze(engine));
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (engine.state.time + .5 > scenario.duration) {
        window.clearInterval(timer);
        return;
      }
      engine.step(3);
      setState(freeze(engine));
    }, 220);
    return () => window.clearInterval(timer);
  }, [active, engine, scenario.duration]);
  const activeRequest = state.requests.find(request => request.phase !== 'pending' && request.phase !== 'completed' && request.vehicle);
  const activeVehicle = activeRequest?.vehicle
    ? state.vehicles.find(vehicle => vehicle.id === activeRequest.vehicle && !vehicle.parked)
    : undefined;
  return { engine, state, requestId: activeRequest?.id, vehicleId: activeVehicle?.id };
}
