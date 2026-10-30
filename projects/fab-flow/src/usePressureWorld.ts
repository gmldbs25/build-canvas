import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine, getKpis } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { publicationCopy } from './sim/publication';
import type { Policy, Scenario, SimulationState } from './sim/types';

export type NativeMetrics = ReturnType<typeof getKpis>;
export type ComparisonMode = 'fleet' | 'policy';
export type ComparisonResult = {
  baseline: NativeMetrics;
  changed: NativeMetrics;
  duration: number;
  seed: number;
  demand: number;
  baselineFleet: number;
  changedFleet: number;
  baselinePolicy: Policy;
  changedPolicy: Policy;
};

function snapshot(engine: Engine): SimulationState {
  return publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;
}

// Isolated 2-Bay native view for the congestion chapter; never a mock counter.
// A limited observation area contrasts with the actual 9-Bay scale reveal.
function pressureScenario(): Scenario {
  return { ...operationalScenario('small'), fleet: 8, demand: 12,
    pattern: 'steady', distribution: 'balanced', seed: 31,
    duration: 360, demandWindow: 300, policy: 'DBR' };
}

// Keep the renderer's transition duration equal to the Native Engine
// publication cadence. Previously each React update skipped three 0.5s
// native ticks, which made OHTs jump before the next interpolation began.
export const PRESSURE_PLAYBACK_MS = 115;

export function usePressureWorld(active: boolean) {
  const [engine, setEngine] = useState(() => new Engine(pressureScenario()));
  const [state, setState] = useState<SimulationState>(() => snapshot(engine));
  const [metrics, setMetrics] = useState<NativeMetrics>(() => getKpis(engine));
  const [paused, setPaused] = useState(false);
  const [compareMode, setCompareMode] = useState<ComparisonMode>('fleet');
  const [compareDemand, setCompareDemand] = useState<8 | 14>(14);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const epoch = useRef(0);

  useEffect(() => {
    if (!active || paused || engine.state.time >= 300) return;
    const interval = window.setInterval(() => {
      try {
        // 1 native 0.5s tick = 1 publication = 1 3D interpolation.
        // The authentic demand, dispatch, congestion and route logic remains.
        engine.step(1);
        setState(snapshot(engine));
        setMetrics(getKpis(engine));
        if (engine.state.time >= 300) window.clearInterval(interval);
      } catch (e) {
        window.clearInterval(interval);
        setError(e instanceof Error ? e.message : '실제 엔진 관찰 중 오류');
      }
    }, PRESSURE_PLAYBACK_MS);
    return () => window.clearInterval(interval);
  }, [active, engine, paused]);

  useEffect(() => () => { epoch.current += 1; }, []);

  const reset = useCallback(() => {
    const next = new Engine(pressureScenario());
    setEngine(next);
    setState(snapshot(next));
    setMetrics(getKpis(next));
    setPaused(false);
    setError('');
  }, []);

  const compare = useCallback(async () => {
    if (comparing) return;
    const id = ++epoch.current;
    setComparing(true); setResult(null); setProgress(0); setError('');
    const common = {
      ...operationalScenario('small'), seed: 53, fleet: 8,
      demand: compareDemand, duration: 240, demandWindow: 180,
      pattern: 'steady' as const, distribution: 'balanced' as const,
      policy: 'DBR' as const,
    };
    const baseline = new Engine(common);
    const changed = new Engine({
      ...common, fleet: compareMode === 'fleet' ? 13 : 8,
      policy: compareMode === 'policy' ? 'CBR' : 'DBR',
    });
    // Identical seeded demand events are essential: this compares operations,
    // not separate random work orders.
    const left = baseline.getNextDemand(), right = changed.getNextDemand();
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      setError('두 실험의 첫 운송 요청이 같지 않아 비교를 중단했어요.');
      setComparing(false);
      return;
    }
    try {
      for (let tick = 0; tick < 480; tick += 12) {
        if (id !== epoch.current) return;
        baseline.step(12); changed.step(12);
        setProgress((tick+12)/480);
        // Yield to the browser for real progress, reduced input blocking and
        // the possibility of navigating away from the study.
        await new Promise<void>(resolve => window.setTimeout(resolve, 0));
      }
      if (id !== epoch.current) return;
      setResult({
        baseline: getKpis(baseline), changed: getKpis(changed),
        duration: 240, seed: common.seed, demand: compareDemand,
        baselineFleet: 8, changedFleet: compareMode === 'fleet' ? 13 : 8,
        baselinePolicy: 'DBR', changedPolicy: compareMode === 'policy' ? 'CBR' : 'DBR',
      });
    } catch (e) {
      if (id === epoch.current) setError(e instanceof Error ? e.message : '비교 실험 오류');
    } finally {
      if (id === epoch.current) setComparing(false);
    }
  }, [comparing, compareDemand, compareMode]);

  const changeMode = useCallback((next: ComparisonMode) => {
    epoch.current++; setComparing(false); setResult(null); setProgress(0); setCompareMode(next);
  }, []);
  const changeDemand = useCallback((next: 8 | 14) => {
    epoch.current++; setComparing(false); setResult(null); setProgress(0); setCompareDemand(next);
  }, []);

  return { engine, state, metrics, tickMs: PRESSURE_PLAYBACK_MS, paused, setPaused, reset, error,
    compareMode, changeMode, compareDemand, changeDemand, compare, comparing, progress, result };
}
