import { useEffect, useRef, useState } from 'react';
import { Engine } from './sim/engine';
import { multiLargeScenario } from './sim/layouts';
import type { SimulationState } from './sim/types';

const BEGIN_AT_TICK = 1174;
const END_AT_TICK = 1295;
const PLAYBACK_MS = 180;
function makeMulti() {
  const scenario = { ...multiLargeScenario(17, 'DBR'), duration: 1800, demandWindow: 600 };
  return new Engine(scenario, { analysis: false });
}

/** The current Native 2F engine moves the *OHT* with FOUP in the lift.
 * Work6 must NOT present that as FOUP-only transport. When conceptOnly=true
 * it uses only the genuine 2F layout at time 0, without running the old
 * vertical vehicle transfer. The independent exhibit is explicitly conceptual.
 */
export function useFutureFab(active: boolean, playing: boolean, conceptOnly = false) {
  const engineRef = useRef<Engine | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);
  const [prepared, setPrepared] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!active || prepared || engineRef.current || error) return;
    let cancelled = false, timer: number;
    const begin = () => {
      if (cancelled) return;
      try {
        const instance = makeMulti();
        engineRef.current = instance;
        if (conceptOnly) {
          setEngine(instance);
          setState(instance.snapshot().state);
          setPrepared(true);
          return;
        }
        const advance = () => {
          if (cancelled) return;
          try {
            const remaining = BEGIN_AT_TICK - instance.state.tick;
            if (remaining > 0) {
              instance.step(Math.min(20, remaining));
              timer = window.setTimeout(advance, 0);
            } else {
              setEngine(instance);
              setState(instance.snapshot().state);
              setPrepared(true);
            }
          } catch (cause) {
            if (!cancelled) setError(cause instanceof Error ? cause.message : '다층 물류 엔진 계산에 실패했어요.');
          }
        };
        timer = window.setTimeout(advance, 0);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '다층 FAB를 준비하지 못했어요.');
      }
    };
    timer = window.setTimeout(begin, 0);
    return () => { cancelled = true; window.clearTimeout(timer); if (!prepared) engineRef.current = null; };
  }, [active, prepared, error, conceptOnly]);

  useEffect(() => {
    if (conceptOnly || !playing || !prepared || !engine || engine.state.tick >= END_AT_TICK) return;
    const timer = window.setInterval(() => {
      if (engine.state.tick >= END_AT_TICK) { window.clearInterval(timer); return; }
      try { engine.step(1); setState(engine.snapshot().state); }
      catch (cause) { window.clearInterval(timer); setError(cause instanceof Error ? cause.message : '다층 운송 중 문제가 발생했어요.'); }
    }, PLAYBACK_MS);
    return () => window.clearInterval(timer);
  }, [playing, prepared, engine, conceptOnly]);
  const selected = state?.vehicles.find(v => v.id === 'OHT-003');
  const lift = selected?.link ? engine?.layout.links.find(l => l.id === selected.link && l.kind === 'lifter') : undefined;
  const completed = state?.requests.filter(v => v.phase === 'completed').length ?? 0;
  return { engine, state, prepared, error, tickMs: PLAYBACK_MS, selected,
    transfer: !!lift, transferred: state ? state.tick >= 1202 : false,
    completed, ended: state ? state.tick >= END_AT_TICK : false };
}
