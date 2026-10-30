'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThreeFacilityScene from './components/ThreeFacilityScene';
import { Engine } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { publicationCopy } from './sim/publication';
import {
  TutorialCommandLayer, TUTORIAL_REQUEST_ID, TUTORIAL_STEPS, tutorialRequest, tutorialVehicle,
  type TutorialCommand, type TutorialStage,
} from './sim/tutorial';
import type { SimulationState } from './sim/types';
import type { CameraCommand } from './components/fabCamera';

type PrototypeScene = 3 | 4 | 6;
const SCENES: Array<{ id: PrototypeScene; chapter: string; eyebrow: string; title: string; body: string }> = [
  { id: 3, chapter: '01 / FOLLOW', eyebrow: 'SCENE 03 — THE TRANSPORT', title: '하나의 운송은 어떻게 완성될까?', body: '운송을 요청하고, OHT가 FOUP를 인계받아 목적지에 도착하기까지 실제 과정을 따라가 보세요.' },
  { id: 4, chapter: '02 / REVEAL', eyebrow: 'SCENE 04 — THE NETWORK', title: '지금까지 본 건 공장의 극히 일부였다.', body: '한 대의 OHT에서 하나의 Bay로, 다시 여러 Bay가 연결된 물류망으로 시야를 확장합니다.' },
  { id: 6, chapter: '02 / REVEAL', eyebrow: 'SCENE 06 — THE DECISION', title: '누가 이 운송을 맡고, 어느 길로 갈까?', body: '배차와 경로 탐색은 다른 결정입니다. 실제 MCS가 고른 차량과 경로를 확인해 보세요.' }
];
const STEP_ORDER: TutorialCommand[] = ['request', 'dispatch', 'empty-travel', 'pickup', 'route', 'loaded-travel', 'dropoff'];

function createWork6Tutorial() {
  // The same native Engine/TutorialCommandLayer used by FAB FLOW, with its Large V6
  // facility to make the scale reveal meaningful. No synthetic OHT path or tween.
  const engine = new Engine({
    ...operationalScenario('large'),
    fleet: 4,
    demand: 1,
    duration: 1800,
    demandWindow: 60,
    seed: 1,
    pattern: 'steady',
    distribution: 'balanced',
  });
  const plannedIngress = engine.getNextDemand();
  if (!plannedIngress || plannedIngress.at !== 0) throw new Error('The native tutorial needs an initial demand at time zero.');
  engine.enableTutorialControl();
  return { engine, plannedIngress };
}

function freezeState(engine: Engine): SimulationState {
  return publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;
}

export default function Work6() {
  const initial = useMemo(() => createWork6Tutorial(), []);
  const engineRef = useRef(initial.engine);
  const tutorialRef = useRef(new TutorialCommandLayer());
  const timerRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const [nativeState, setNativeState] = useState<SimulationState>(() => freezeState(initial.engine));
  const [stage, setStage] = useState<TutorialStage>('request');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [decision, setDecision] = useState<ReturnType<Engine['inspectDecision']>>(undefined);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ sequence: 1, kind: 'opening' });
  const [cameraMoment, setCameraMoment] = useState(0);
  const scene = SCENES[sceneIndex];

  const publish = useCallback(() => {
    const engine = engineRef.current;
    setNativeState(freezeState(engine));
    const assigned = tutorialVehicle(engine);
    if (assigned) setSelectedVehicleId(assigned.id);
  }, []);

  const issueCamera = useCallback((kind: CameraCommand['kind'], vehicleId?: string, requestId?: string) => {
    setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind, vehicleId, requestId }));
  }, []);

  const cancelRunning = useCallback(() => {
    runIdRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    tutorialRef.current.fail();
    setBusy(false);
  }, []);

  useEffect(() => () => {
    runIdRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const reset = () => {
    cancelRunning();
    const next = createWork6Tutorial();
    engineRef.current = next.engine;
    tutorialRef.current = new TutorialCommandLayer();
    setStage('request');
    setSelectedVehicleId(undefined);
    setDecision(undefined);
    setError('');
    setNativeState(freezeState(next.engine));
    issueCamera('opening');
  };

  const runNext = () => {
    if (busy) return;
    const layer = tutorialRef.current;
    const engine = engineRef.current;
    const command = layer.stage as TutorialCommand;
    if (!STEP_ORDER.includes(command)) return;
    if (!layer.begin(command)) return;
    const runId = ++runIdRef.current;
    setBusy(true);
    setError('');
    const complete = () => {
      const next = layer.finish(engine);
      setStage(next);
      publish();
      setBusy(false);
      timerRef.current = null;
      const req = tutorialRequest(engine), vehicle = tutorialVehicle(engine);
      if (next === 'empty-travel' && vehicle) issueCamera('follow', vehicle.id, req?.id);
      if (next === 'bay') issueCamera('bay', vehicle?.id, req?.id);
    };
    try {
      if (command === 'route') {
        const result = layer.executeRoute(engine);
        setDecision(result);
        complete();
        return;
      }
      const tick = () => {
        if (runId !== runIdRef.current) return;
        try {
          // A genuine FAB FLOW Native tick. The presentation does not alter
          // vehicle pose, route choice, FOUP ownership or request phases.
          layer.step(engine);
          publish();
          if (layer.reached(engine)) {
            complete();
          } else {
            timerRef.current = window.setTimeout(tick, 25);
          }
        } catch (cause) {
          layer.fail();
          setBusy(false);
          setError(cause instanceof Error ? cause.message : 'Native 운송 진행 오류');
        }
      };
      tick();
    } catch (cause) {
      layer.fail();
      setBusy(false);
      setError(cause instanceof Error ? cause.message : 'Native 명령 실행 오류');
    }
  };

  const nextScene = useCallback((delta: number) => {
    setSceneIndex(current => Math.max(0, Math.min(SCENES.length - 1, current + delta)));
  }, []);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return;
      if (event.key.toLowerCase() === 'h') {
        event.preventDefault(); window.location.href = '../'; return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); nextScene(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [nextScene]);

  const request = nativeState.requests.find(item => item.id === TUTORIAL_REQUEST_ID);
  const vehicle = nativeState.vehicles.find(item => item.id === request?.vehicle);
  const currentDecision = decision ?? (vehicle && request?.phase !== 'completed' ? engineRef.current.inspectDecision(vehicle.id) : undefined);
  const isReveal = scene.id === 4;
  const isDecision = scene.id === 6;
  const shouldShowPath = isDecision && !!currentDecision;
  const candidates = shouldShowPath ? currentDecision.candidates : undefined;

  useEffect(() => {
    const req = tutorialRequest(engineRef.current);
    const owner = tutorialVehicle(engineRef.current);
    const tracked = owner?.id, reqId = req?.id;
    if (scene.id === 3) {
      issueCamera(tracked ? 'follow' : 'opening', tracked, reqId);
      return;
    }
    if (scene.id === 6) {
      issueCamera(tracked ? 'follow' : 'overview', tracked, reqId);
      return;
    }
    setCameraMoment(0);
    issueCamera(tracked ? 'follow' : 'opening', tracked, reqId);
    const a = window.setTimeout(() => { setCameraMoment(1); issueCamera('bay', tracked, reqId); }, 1700);
    const b = window.setTimeout(() => { setCameraMoment(2); issueCamera('overview', tracked, reqId); }, 3700);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [scene.id, issueCamera]);

  const planned = tutorialRef.current.stage === 'request' && nativeState.requests.length === 0
    ? { source: initial.plannedIngress.source, destination: initial.plannedIngress.destination }
    : undefined;

  return <div className="w6-root" data-prototype="true">
    <header className="w6-header">
      <a className="w6-brand" href="../" aria-label="Build Canvas 홈으로">BUILD<span>_</span>CANVAS</a>
      <span className="w6-workname">WORK 06 <span className="w6-header-divider">/</span> FAB FLOW</span>
      <span className="w6-prototype">3D INTEGRATION STUDY</span>
    </header>
    <main className="w6-stage">
      <div className="w6-viewport" aria-label="Live FAB FLOW 3D world">
        <ThreeFacilityScene
          layout={engineRef.current.layout}
          state={nativeState}
          floor={0}
          failures={engineRef.current.scenario.failures}
          storageCapacity={engineRef.current.scenario.storageCapacity}
          running={busy}
          tickMs={25}
          selected={selectedVehicleId ? 'vehicle:' + selectedVehicleId : undefined}
          trackedVehicle={selectedVehicleId}
          trackedRequest={request?.id}
          plannedTutorialIngress={planned}
          tutorialStage={scene.id === 3 ? stage : undefined}
          cameraCommand={cameraCommand}
          heatmap={false}
          view={isDecision ? 'network' : 'overview'}
          routeCandidates={candidates}
          onSelect={(kind, id) => { if (kind === 'vehicle') setSelectedVehicleId(id); }}
          onFloorChange={() => {}}
        />
        <div className="w6-scene-label" aria-hidden="true">{scene.eyebrow}</div>
        {isReveal && <div className="w6-reveal-note" aria-live="polite">{['01 / 한 대의 OHT','02 / 하나의 Bay','03 / 연결된 FAB 전체'][cameraMoment]}</div>}
      </div>
      <section className={'w6-narrative ' + (isReveal ? 'w6-narrative-reveal' : '')} aria-label="장면 설명">
        <p className="w6-chapter">{scene.chapter}</p>
        <h1>{scene.title}</h1>
        <p className="w6-description">{scene.body}</p>
        {scene.id === 3 && <div className="w6-inner-controls">
          <div className="w6-step"><span>NATIVE TRANSPORT</span><b>{TUTORIAL_STEPS[stage]?.title ?? stage}</b></div>
          <div className="w6-action-row">
            <button type="button" className="w6-primary" disabled={busy || !STEP_ORDER.includes(stage as TutorialCommand)} onClick={runNext}>
              {busy ? '실제 운송 진행 중…' : (TUTORIAL_STEPS[stage]?.action || '운송 완료')} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="w6-secondary" onClick={reset}>처음부터</button>
          </div>
          <span className="w6-microcopy">{nativeState.time.toFixed(1)} sim s · {nativeState.tick} native ticks · 요청 {request?.phase ?? '준비'}</span>
        </div>}
        {scene.id === 6 && <div className="w6-inner-controls">
          {currentDecision ? <>
            <span className="w6-overline">LIVE MCS / {currentDecision.policy?.toUpperCase?.() ?? 'ROUTING'}</span>
            <p className="w6-decision-copy">실제 엔진이 계산한 경로 후보 {currentDecision.candidates.length}개 중 선택된 경로를 강조합니다.</p>
            <div className="w6-decision-row">
              <span>SELECTED ROUTE</span>
              <strong>{currentDecision.candidates.find(item => item.selected)?.distance.toFixed(0) ?? '—'}</strong>
              <small>graph units</small>
            </div>
          </> : <>
            <p className="w6-decision-copy">현재 운송에서 선택된 차량과 경로를 확인할 수 있도록 먼저 실제 운송을 진행해야 합니다.</p>
            <button type="button" className="w6-primary" onClick={() => setSceneIndex(0)}>운송 장면으로 이동 ↗</button>
          </>}
        </div>}
        {scene.id === 4 && <div className="w6-inner-controls">
          <p className="w6-microcopy">실제 FAB FLOW Large V6 모델 · 삼성 평택 내부 배치를 재현한 것은 아닙니다.</p>
          <button type="button" className="w6-secondary" onClick={() => { setCameraMoment(2); issueCamera('overview', selectedVehicleId, request?.id); }}>전체 FAB 보기 ↗</button>
        </div>}
        {error && <p className="w6-error" role="alert">{error}</p>}
      </section>
    </main>
    <footer className="w6-footer">
      <div className="w6-scene-pager" aria-label="대표 장면 탐색">
        {SCENES.map((part, index) => <button key={part.id} type="button" className={index === sceneIndex ? 'active' : ''} onClick={() => setSceneIndex(index)} aria-current={index === sceneIndex ? 'step' : undefined}>SCENE {String(part.id).padStart(2,'0')}</button>)}
      </div>
      <div className="w6-navigation">
        <button type="button" onClick={() => nextScene(-1)} disabled={sceneIndex === 0} aria-label="이전 장면">←</button>
        <span>{String(sceneIndex+1).padStart(2,'0')} <em>/</em> {String(SCENES.length).padStart(2,'0')}</span>
        <button type="button" onClick={() => nextScene(1)} disabled={sceneIndex === SCENES.length-1} aria-label="다음 장면">→</button>
      </div>
    </footer>
    <div className="w6-prototype-disclaimer">Prototype: 03 · 04 · 06 only. Original FAB FLOW native renderer + Engine. Other scenes are not implemented yet.</div>
  </div>;
}
