import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine, getKpis } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { presetScenario } from './sim/demand-presets';
import { publicationCopy } from './sim/publication';
import type { Policy, Scenario, SimulationState, Snapshot } from './sim/types';

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
export type PressureWindow = {
  created: number;
  completed: number;
  pendingStart: number;
  pendingEnd: number;
};
export type PressureCapacityResult = {
  baseline: PressureWindow;
  surge: PressureWindow;
  observationSeconds: number;
  baselineInterval: number;
  surgeInterval: number;
  fleet: number;
  warmupSeconds: number;
};

function snapshot(engine: Engine): SimulationState {
  return publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;
}

// Warm the *genuine* Large V6 engine long enough to start in an active factory,
// instead of staging a fake fleet entrance. This exact native state is also the
// shared initial condition for the two operational comparisons.
export const PRESSURE_WARMUP_SECONDS = 3000;
export const PRESSURE_BASE_INTERVAL = 20; // three requests per simulated minute; busy without overload
export const PRESSURE_SURGE_INTERVAL = 2; // same 48 OHTs, ten times the normal demand
export const PRESSURE_MEASURE_SECONDS = 1800;
export const PRESSURE_STORY = {
  surgeAt: PRESSURE_WARMUP_SECONDS + 20,
  observeAt: PRESSURE_WARMUP_SECONDS + 130,
} as const;
export const PRESSURE_PLAYBACK_MS = 115;
export type PressureBeat = 'normal' | 'surge' | 'observe';
export function pressureBeat(time: number): PressureBeat {
  return time < PRESSURE_STORY.surgeAt ? 'normal'
    : time < PRESSURE_STORY.observeAt ? 'surge' : 'observe';
}
function pressureScenario(): Scenario {
  return {
    ...presetScenario('large', 'relaxed', 31, 'DBR', 48),
    demandIntervalSeconds: PRESSURE_BASE_INTERVAL,
    duration: 7200, demandWindow: 6300,
  };
}
function counts(engine: Engine) {
  const metrics = getKpis(engine);
  return { created: metrics.created, completed: metrics.completed, pending: metrics.pending };
}
function windowResult(before: ReturnType<typeof counts>, after: ReturnType<typeof counts>): PressureWindow {
  return {
    created: after.created - before.created,
    completed: after.completed - before.completed,
    pendingStart: before.pending,
    pendingEnd: after.pending,
  };
}

export function usePressureWorld(active: boolean, showResults: boolean, prewarm: boolean) {
  const [engine, setEngine] = useState(() => new Engine(pressureScenario(), { analysis: false }));
  const [state, setState] = useState<SimulationState>(() => snapshot(engine));
  const [metrics, setMetrics] = useState<NativeMetrics>(() => getKpis(engine));
  const [prepared, setPrepared] = useState(false);
  const warmSnapshotRef = useRef<Snapshot | null>(null);
  const [capacity, setCapacity] = useState<PressureCapacityResult | null>(null);
  const [capacityBusy, setCapacityBusy] = useState(false);
  const [capacityProgress, setCapacityProgress] = useState(0);
  const [compareMode, setCompareMode] = useState<ComparisonMode>('fleet');
  const [compareDemand, setCompareDemand] = useState<8 | 14>(14);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const epoch = useRef(0);

  // Yield every small native batch. Never publish the empty warm-up world as
  // Scene 07; it would look like vehicles magically entering an empty factory.
  useEffect(() => {
    if (!prewarm || prepared || error) return;
    let cancelled = false, timer: number;
    const prime = () => {
      if (cancelled) return;
      try {
        for (let i = 0; i < 24 && engine.state.time < PRESSURE_WARMUP_SECONDS; i++) engine.step(1);
        if (engine.state.time < PRESSURE_WARMUP_SECONDS) timer = window.setTimeout(prime, 0);
        else {
          warmSnapshotRef.current = engine.snapshot();
          setState(snapshot(engine));
          setMetrics(getKpis(engine));
          setPrepared(true);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '실제 공장 운영 상태를 준비할 수 없어요.');
      }
    };
    timer = window.setTimeout(prime, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [prewarm, prepared, engine, error]);

  // Playback always publishes one genuine 0.5s Engine tick per renderer
  // interpolation. The editorial sequence ends, but the factory keeps moving.
  useEffect(() => {
    if (!active || !prepared || engine.state.time >= engine.scenario.duration) return;
    const timer = window.setInterval(() => {
      try {
        if (engine.state.time >= PRESSURE_STORY.surgeAt && !(engine.scenario.demandChanges?.length))
          engine.setDemandInterval(PRESSURE_SURGE_INTERVAL, 'congested');
        engine.step(1);
        setState(snapshot(engine));
        setMetrics(getKpis(engine));
      } catch (cause) {
        window.clearInterval(timer);
        setError(cause instanceof Error ? cause.message : 'FAB FLOW 운송 중 오류가 발생했어요.');
      }
    }, PRESSURE_PLAYBACK_MS);
    return () => window.clearInterval(timer);
  }, [active, prepared, engine]);

  // Both 30-minute experiments branch from exactly the same warmed Native
  // snapshot, not from the truncated Scene 07 playback. They run with identical
  // layout, fleet, policy and initial state; only interval-demand changes.
  useEffect(() => {
    if (!showResults || !prepared || capacity || error || !warmSnapshotRef.current) return;
    let cancelled = false, timer: number;
    let base: Engine, stressed: Engine;
    try {
      base = Engine.restore(warmSnapshotRef.current);
      stressed = Engine.restore(warmSnapshotRef.current);
      // Identical first 20s on both branches. Demand changes at the same
      // native tick as in the on-screen Scene 07 story.
      base.step(40);
      stressed.step(40);
      const anchor = counts(base);
      stressed.setDemandInterval(PRESSURE_SURGE_INTERVAL, 'congested');
      const totalTicks = PRESSURE_MEASURE_SECONDS * 2;
      let done = 0;
      setCapacityBusy(true);
      const measure = () => {
        if (cancelled) return;
        try {
          const batch = Math.min(18, totalTicks - done);
          base.step(batch);
          stressed.step(batch);
          done += batch;
          if (done < totalTicks) {
            if (done % 180 === 0) setCapacityProgress(done / totalTicks);
            timer = window.setTimeout(measure, 0);
          } else {
            setCapacity({
              baseline: windowResult(anchor, counts(base)),
              surge: windowResult(anchor, counts(stressed)),
              observationSeconds: PRESSURE_MEASURE_SECONDS,
              baselineInterval: PRESSURE_BASE_INTERVAL,
              surgeInterval: PRESSURE_SURGE_INTERVAL,
              fleet: base.scenario.fleet,
              warmupSeconds: PRESSURE_WARMUP_SECONDS,
            });
            setCapacityProgress(1);
            setCapacityBusy(false);
          }
        } catch (cause) {
          if (!cancelled) {
            setCapacityBusy(false);
            setError(cause instanceof Error ? cause.message : '실제 처리량을 비교하지 못했어요.');
          }
        }
      };
      timer = window.setTimeout(measure, 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '동일한 공장 상태를 복원하지 못했어요.');
    }
    return () => { cancelled = true; window.clearTimeout(timer); setCapacityBusy(false); };
  }, [showResults, prepared, capacity, error]);

  useEffect(() => () => { epoch.current += 1; }, []);

  const reset = useCallback(() => {
    try {
      const fresh = warmSnapshotRef.current
        ? Engine.restore(warmSnapshotRef.current)
        : new Engine(pressureScenario(), { analysis: false });
      setEngine(fresh);
      setState(snapshot(fresh));
      setMetrics(getKpis(fresh));
      setPrepared(!!warmSnapshotRef.current);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '동일한 운영 상태를 복원할 수 없어요.');
    }
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


  return {
    engine, state, metrics, prepared, warmupSeconds: PRESSURE_WARMUP_SECONDS,
    warmCompleted: warmSnapshotRef.current?.state.requests.filter(request => request.phase === 'completed').length ?? 0,
    beat: pressureBeat(state.time), tickMs: PRESSURE_PLAYBACK_MS,
    capacity, capacityBusy, capacityProgress,
    reset, error, compareMode, changeMode, compareDemand, changeDemand,
    compare, comparing, progress, result,
  };
}
