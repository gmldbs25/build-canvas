'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThreeFacilityScene from './components/ThreeFacilityScene';
import { Engine } from './sim/engine';
import { SCENES } from './work6-scenes';
import { usePressureWorld } from './usePressureWorld';
import { useAmbientIntro } from './useAmbientIntro';
import { buildNativeRouteStudy, type NativeRouteStudy } from './routeStudy';
import { operationalScenario } from './sim/experiments';
import { chooseLocalIntroDemand } from './introScenario';
import { publicationCopy } from './sim/publication';
import {
  TutorialCommandLayer, TUTORIAL_REQUEST_ID, tutorialRequest, tutorialVehicle,
  type TutorialCommand, type TutorialStage,
} from './sim/tutorial';
import type { Scenario, SimulationState } from './sim/types';
import type { CameraCommand } from './components/fabCamera';

const STEP_ORDER: TutorialCommand[] = ['request', 'dispatch', 'empty-travel', 'pickup', 'route', 'loaded-travel', 'dropoff'];

/**
 * Presentation-only explanatory language: the underlying Native transport commands
 * are unchanged. FAB FLOW simulates transport logistics, not wafer fabrication.
 * Each completed command remains visible until the user triggers the next one.
 */
const BEGINNER_STEPS: Record<TutorialCommand, { question: string; explanation: string; button: string }> = {
  request: {
    question: '왜 옮겨야 할까요?',
    explanation: '반도체는 한 장비에서 완성되지 않아요. 다음 장비에서 작업할 수 있도록 웨이퍼를 담은 보호 상자(FOUP)를 보내야 하는 상황을 상상해 볼게요. 먼저 물류 시스템에 이동을 부탁합니다.',
    button: '다음 장비로 보내기',
  },
  dispatch: {
    question: '누가 옮겨 줄까요?',
    explanation: '옮겨 달라는 요청이 접수됐어요. 하지만 아직 담당 차량은 없어요. 천장 레일을 달리는 운반 차량(OHT) 중 한 대를 골라 볼까요?',
    button: '담당 차량 정하기',
  },
  'empty-travel': {
    question: '차량은 어디로 가야 할까요?',
    explanation: '운반 차량 한 대가 배정됐어요. 이렇게 담당 차량을 고르는 일을 배차라고 해요. 아직 FOUP를 싣지 않았으니 빈 차량이 출발 장비로 찾아가야 해요.',
    button: '빈 차량이 가지러 가는 모습 보기',
  },
  pickup: {
    question: '이제 무엇을 실을까요?',
    explanation: '빈 OHT가 출발 장비에 도착했어요. 웨이퍼가 담긴 FOUP는 아직 장비의 물건을 주고받는 자리(Port)에 있어요. 이제 직접 들어 올릴 차례예요.',
    button: 'FOUP 싣는 모습 보기',
  },
  route: {
    question: '어떤 길로 가면 될까요?',
    explanation: 'FOUP를 실었어요. 목적지까지 가는 길은 천장 레일로 연결돼 있어요. 물류 시스템이 지금 가능한 경로를 계산하도록 해볼까요?',
    button: '이동할 길 살펴보기',
  },
  'loaded-travel': {
    question: '이제 다음 장비로 출발!',
    explanation: '운송 경로가 정해졌어요. OHT가 FOUP를 싣고 실제로 계산한 레일 경로를 따라 목적지까지 이동하는 모습을 지켜보세요.',
    button: '운송 따라가기',
  },
  dropoff: {
    question: '도착하면 무엇을 할까요?',
    explanation: '목적지 장비 앞에 도착했어요. FOUP를 다음 장비가 주고받는 자리(Port)에 내려놓으면 이번 운송은 끝나요.',
    button: 'FOUP 내려놓기',
  },
};
const OBSERVED_RESULTS: Record<TutorialCommand, string> = {
  request: '물류 시스템에 “이 FOUP를 다음 장비로 옮겨 주세요”라는 요청이 등록됐어요. 아직 차량은 움직이지 않았어요.',
  dispatch: '여러 OHT 중 한 대가 이번 운송을 맡게 됐어요. 이 결정이 바로 배차예요.',
  'empty-travel': '선택된 OHT가 빈 상태로 출발 장비까지 이동했어요. FOUP는 아직 장비에 있습니다.',
  pickup: '출발 장비에 있던 FOUP가 OHT에 실렸어요. 이제 목적지까지 이동할 준비가 됐습니다.',
  route: '물류 제어 시스템이 실제 레일망에서 목적지로 갈 길을 선택했어요.',
  'loaded-travel': 'FOUP를 실은 OHT가 목적지 장비 앞에 도착했어요. 아직 내려놓는 과정이 남아 있어요.',
  dropoff: 'FOUP를 목적지 장비에 내려놓았어요. 한 건의 물류 운송이 실제 엔진에서 완료됐습니다.',
};


function createWork6Tutorial() {
  // The same native Engine/TutorialCommandLayer used by FAB FLOW, with its Large V6
  // facility to make the scale reveal meaningful. No synthetic OHT path or tween.
  const scenario: Scenario = {
    ...operationalScenario('large'),
    fleet: 9,
    demand: 1,
    duration: 1800,
    demandWindow: 60,
    seed: 1,
    pattern: 'steady',
    distribution: 'balanced' as const,
  };
  // Only the seeded demand is selected; FAB FLOW's own Engine still generates
  // the request and makes every dispatch, routing and movement decision.
  const selection = chooseLocalIntroDemand(new Engine({ ...scenario, seed: 1 }, { analysis: false }).layout, scenario);
  const engine = new Engine({ ...scenario, seed: selection.seed });
  const plannedIngress = engine.getNextDemand();
  if (plannedIngress?.source !== selection.source || plannedIngress?.destination !== selection.destination) {
    throw new Error('Native demand generation changed: local tutorial selection must be revalidated.');
  }
  if (!plannedIngress || plannedIngress.at !== 0) throw new Error('The native tutorial needs an initial demand at time zero.');
  engine.enableTutorialControl();
  return { engine, plannedIngress, selection };
}

function freezeState(engine: Engine): SimulationState {
  return publicationCopy({ version: 1, scenario: engine.scenario, state: engine.state }).state;
}

export default function Work6() {
  const initial = useMemo(() => createWork6Tutorial(), []);
  const engineRef = useRef(initial.engine);
  const plannedIngressRef = useRef(initial.plannedIngress);
  const tutorialRef = useRef(new TutorialCommandLayer());
  const timerRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const [nativeState, setNativeState] = useState<SimulationState>(() => freezeState(initial.engine));
  const [stage, setStage] = useState<TutorialStage>('request');
  const [lastCompleted, setLastCompleted] = useState<TutorialCommand | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [decision, setDecision] = useState<ReturnType<Engine['inspectDecision']>>(undefined);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ sequence: 1, kind: 'opening' });
  const [cameraMoment, setCameraMoment] = useState(0);
  const scene = SCENES[sceneIndex];
  const isPressure = scene.id >= 7 && scene.id <= 9;
  // Scene 07 moves live; Scene 08 awaits the same native 85-second result.
  const pressure = usePressureWorld(scene.id === 7, scene.id === 8);
  const isOpening = scene.id <= 2;
  const ambient = useAmbientIntro(initial.engine.scenario, isOpening);
  const [routeStudy, setRouteStudy] = useState<NativeRouteStudy | null>(null);
  const [routeError, setRouteError] = useState('');
  const [routeChoice, setRouteChoice] = useState<'selected' | 'alternative' | 'both'>('both');
  const activeEngine = isPressure ? pressure.engine : isOpening ? ambient.engine :
    scene.id === 6 && routeStudy ? routeStudy.engine : engineRef.current;
  const activeState = isPressure ? pressure.state : isOpening ? ambient.state :
    scene.id === 6 && routeStudy ? routeStudy.state : nativeState;
  useEffect(() => {
    if (scene.id !== 6 || routeStudy || routeError) return;
    // Compute a real, separate long-range native case once on entry. Scene03
    // keeps its short route and completed FOUP intact.
    let cancelled = false;
    const timer = window.setTimeout(() => {
      try {
        const study = buildNativeRouteStudy();
        if (!cancelled) setRouteStudy(study);
      } catch (cause) {
        if (!cancelled) setRouteError(cause instanceof Error ? cause.message : '경로 사례를 계산할 수 없어요.');
      }
    }, 30);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [scene.id, routeStudy, routeError]);

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
    plannedIngressRef.current = next.plannedIngress;
    tutorialRef.current = new TutorialCommandLayer();
    setStage('request');
    setLastCompleted(null);
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
    // Let people actually watch the hoist lower and raise the FOUP.
    // Engine ticks still represent 0.5 simulated seconds; only playback pacing changes.
    const tickPaceMs = command === 'pickup' || command === 'dropoff' ? 520 : 32;
    setBusy(true);
    setError('');
    const complete = () => {
      const next = layer.finish(engine);
      setLastCompleted(command);
      setStage(next);
      publish();
      setBusy(false);
      timerRef.current = null;
      const req = tutorialRequest(engine), vehicle = tutorialVehicle(engine);
      if (next === 'empty-travel' && vehicle) issueCamera('follow', vehicle.id, req?.id);
      // Keep the same close camera after dropoff; only Scene 04 may reveal the whole Bay.
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
            // The final native pickup/dropoff tick still has 520 ms of visual
            // hoist travel to interpolate. Do not set running=false in the
            // same React batch as the final state publication: that snaps
            // the FOUP straight onto the OHT before the animation completes.
            if (command === 'pickup' || command === 'dropoff') {
              timerRef.current = window.setTimeout(() => {
                if (runId === runIdRef.current) complete();
              }, tickPaceMs);
            } else complete();
          } else {
            timerRef.current = window.setTimeout(tick, tickPaceMs);
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
  const beginner = STEP_ORDER.includes(stage as TutorialCommand) ? BEGINNER_STEPS[stage as TutorialCommand] : null;
  const transportFinished = stage === 'bay' && request?.phase === 'completed';
  const isReveal = scene.id === 4;
  const isDecision = scene.id === 6;
  const shownRoute = routeStudy ? routeChoice === 'alternative' ? routeStudy.alternative : routeStudy.selected : null;
  const isNetwork = scene.id === 5;
  const focusMode = scene.id <= 3;
  const pressureBeatLabel = pressure.beat === 'normal' ? '01 · 평상시 운송' : pressure.beat === 'surge' ? '02 · 요청 급증' : '03 · 결과 관찰';
  // Reuse actual MCS decisions for both empty-vehicle travel and the loaded
  // leg. Do not draw a speculative route before the Engine has selected it.
  const isTransportRouteVisible = scene.id === 3 &&
    (['empty-travel', 'pickup', 'loaded-travel', 'dropoff', 'bay'].includes(stage));
  const candidates = isDecision && routeStudy && shownRoute
    ? routeChoice === 'both'
      ? [{ ...routeStudy.alternative, selected: false }, { ...routeStudy.selected, selected: true }]
      : [{ ...shownRoute, selected: true }]
    : (isNetwork || isTransportRouteVisible) && currentDecision
      ? currentDecision.candidates.filter(candidate => candidate.selected)
      : undefined;

  useEffect(() => {
    const req = tutorialRequest(engineRef.current);
    const owner = tutorialVehicle(engineRef.current);
    const tracked = owner?.id, reqId = req?.id;
    if (scene.id <= 2) {
      // One stable camera view for the entire opening. Native OHTs keep
      // moving underneath it; no new camera commands on request/vehicle changes.
      setCameraCommand(previous => ({
        sequence: previous.sequence + 1, kind: 'tableau', frame: ambient.frame,
      }));
      return;
    }
    if (scene.id === 3) {
      issueCamera(tracked ? 'follow' : 'opening', tracked, reqId);
      return;
    }
    if (scene.id === 6) {
      if (routeStudy) setCameraCommand(previous => ({
        sequence: previous.sequence + 1, kind: 'tableau', frame: routeStudy.frame,
      }));
      else issueCamera('overview');
      return;
    }
    if (scene.id !== 4) {
      setCameraMoment(0);
      issueCamera(scene.id <= 3 ? 'opening' : 'overview', undefined, undefined);
      return;
    }
    // Scene 03's final close-up is the *first frame* of the reveal.
    // One continuous editorial camera move, not three discontinuous jumps.
    setCameraMoment(0);
    setCameraCommand(previous => ({
      sequence: previous.sequence + 1, kind: 'overview', vehicleId: tracked,
      requestId: reqId, transitionMs: 2700,
    }));
    const a = window.setTimeout(() => setCameraMoment(1), 850);
    const b = window.setTimeout(() => setCameraMoment(2), 2000);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [scene.id, issueCamera, routeStudy?.seed]);

  // Keep the original port annotations stable through request/dispatch.
  // Creating the FOUP should change only that model, never reframe the FAB.
  const planned = scene.id === 3 ? plannedIngressRef.current : undefined;

  return <div className="w6-root" data-prototype="true"
    data-intro-source-bay={initial.engine.layout.ports.find(port => port.id === initial.selection.source)?.area}
    data-intro-destination-bay={initial.engine.layout.ports.find(port => port.id === initial.selection.destination)?.area}
    data-intro-selected-seed={initial.selection.seed}
    data-intro-directed-distance={initial.selection.shortestDirectedDistance}
    data-opening-moving={ambient.openingMovingVehicles}
    data-opening-local-moving={ambient.openingLocalVehicles}
    data-scene-count={SCENES.length} data-current-scene={scene.id}
    data-route-study-seed={routeStudy?.seed ?? ''}
    data-route-study-source={routeStudy?.sourceBay ?? ''}
    data-route-study-destination={routeStudy?.destinationBay ?? ''}
    data-route-study-distinct-fraction={routeStudy?.contrast.distinctFraction ?? ''}
    data-route-study-separation={routeStudy?.contrast.maxSeparation ?? ''}
    data-route-study-alternative-kind={routeStudy?.alternativeKind ?? ''}
    data-pressure-beat={scene.id === 7 || scene.id === 8 ? pressure.beat : ''}
    data-pressure-layout={isPressure ? pressure.engine.layout.id : ''}
    data-pressure-demand-changes={isPressure ? pressure.engine.scenario.demandChanges?.length ?? 0 : ''}
    data-pressure-ready={scene.id === 8 ? String(pressure.ready) : ''}
    data-pressure-created={scene.id === 8 && pressure.ready ? pressure.metrics.created : ''}
    data-pressure-completed={scene.id === 8 && pressure.ready ? pressure.metrics.completed : ''}
    data-pressure-unfinished={scene.id === 8 && pressure.ready ? pressure.metrics.unfinished : ''}>
    <header className="w6-header">
      <a className="w6-brand" href="../" aria-label="Build Canvas 홈으로">BUILD<span>_</span>CANVAS</a>
      <span className="w6-workname">WORK 06 <span className="w6-header-divider">/</span> FAB FLOW</span>
      <span className="w6-prototype">INTERACTIVE ENGINE DOCUMENTARY</span>
    </header>
    <main className="w6-stage">
      <div className="w6-viewport" aria-label="Live FAB FLOW 3D world">
        <ThreeFacilityScene
          layout={activeEngine.layout}
          state={activeState}
          floor={0}
          failures={activeEngine.scenario.failures}
          storageCapacity={activeEngine.scenario.storageCapacity}
          running={isPressure ? scene.id === 7 && !pressure.paused : isOpening ? true : busy}
          tickMs={isPressure ? pressure.tickMs : isOpening ? ambient.tickMs : busy && (stage === 'pickup' || stage === 'dropoff') ? 520 : 32}
          selected={isDecision && routeStudy ? 'vehicle:' + routeStudy.vehicleId
            : !isOpening && !isPressure && selectedVehicleId ? 'vehicle:' + selectedVehicleId : undefined}
          trackedVehicle={isDecision && routeStudy ? routeStudy.vehicleId : isOpening || isPressure ? undefined : selectedVehicleId}
          trackedRequest={isOpening || isPressure || isDecision || request?.phase === 'completed' ? undefined : request?.id}
          plannedTutorialIngress={scene.id === 3 ? planned : undefined}
          tutorialStage={scene.id === 3 ? stage : undefined}
          softTokenEntrance={scene.id === 3}
          cameraCommand={cameraCommand}
          cameraLocked={focusMode}
          heatmap={false}
          view={isDecision || isNetwork ? 'network' : 'overview'}
          routeCandidates={candidates}
          onSelect={(kind, id) => { if (kind === 'vehicle') setSelectedVehicleId(id); }}
          onFloorChange={() => {}}
        />
        <div className="w6-scene-label" aria-hidden="true">{scene.eyebrow}</div>
        {focusMode && <div className="w6-focus-note" role="note">{isOpening ? '고정된 시야에서 여러 OHT의 실제 움직임을 관찰해요' : '지금은 한 대의 운송에 집중해요 · 전체 공장은 Scene 04에서'}</div>}
        {(scene.id === 3 || isNetwork || isDecision) && candidates?.length ? <div className="w6-route-note" role="status"><span aria-hidden="true"/> 실제 OHT 이동 경로</div> : null}
        {isReveal && <div className="w6-reveal-note" aria-live="polite">{['01 / 한 대의 OHT','02 / 하나의 Bay','03 / 연결된 FAB 전체'][cameraMoment]}</div>}
        {scene.id === 7 && <div className="w6-pressure-caption" aria-live="off">
          <span className={pressure.beat === 'normal' ? 'is-calm' : 'is-busy'} aria-hidden="true"/>
          {pressureBeatLabel}
        </div>}
      </div>
      <section className={'w6-narrative ' + (isReveal ? 'w6-narrative-reveal' : '') + (scene.id >= 7 && scene.id <= 10 ? ' w6-narrative-data' : '')} aria-label="장면 설명">
        <p className="w6-chapter">{scene.chapter}</p>
        <h1>{scene.title}</h1>
        <p className="w6-description">{scene.body}</p>

        {scene.id === 1 && <div className="w6-inner-controls">
          <p className="w6-context-line">하나의 장비에서 다음 장비로. 필요한 것은 운송의 연결이에요.</p>
          <button type="button" className="w6-primary" onClick={() => setSceneIndex(1)}>무엇을 옮기는지 살펴보기 <span aria-hidden="true">↗</span></button>
        </div>}
        {scene.id === 2 && <div className="w6-inner-controls">
          <div className="w6-terms">
            <p><strong>웨이퍼</strong><span>반도체 회로가 만들어지는 얇은 원판</span></p>
            <p><strong>FOUP</strong><span>웨이퍼를 보호하며 이동하는 전용 용기</span></p>
            <p><strong>OHT</strong><span>FOUP를 옮기는 천장 운반 차량</span></p>
            <p><strong>Port</strong><span>장비와 차량이 FOUP를 주고받는 자리</span></p>
          </div>
          <button type="button" className="w6-primary" onClick={() => setSceneIndex(2)}>직접 한 건을 옮겨보기 <span aria-hidden="true">↗</span></button>
          <p className="w6-microcopy">이 화면은 실제 FAB FLOW의 3D 장비·레일 모델입니다. 공정 가공 자체를 시뮬레이션하지는 않습니다.</p>
        </div>}
        {scene.id === 5 && <div className="w6-inner-controls">
          <p className="w6-context-line">출발지와 목적지의 거리가 가까워도, 일방통행 레일을 거슬러 갈 수는 없어요. 레일이 만나는 곳에서 다른 길로 갈아타야 할 수도 있죠.</p>
          <div className="w6-terms">
            <p><strong>Bay</strong><span>공정 장비가 모여 있는 작업 구역</span></p>
            <p><strong>Rail</strong><span>OHT가 이동하는 정해진 선로</span></p>
            <p><strong>Port</strong><span>FOUP를 건네는 장비 앞 자리</span></p>
          </div>
          {currentDecision?.candidates.some(candidate => candidate.selected)
            ? <p className="w6-microcopy">현재 운송에서 실제로 선택한 레일 경로를 함께 표시했어요.</p>
            : <p className="w6-microcopy">실제 V6 레일망의 방향·교차로를 보여줘요. 경로 강조는 앞 장면에서 운송을 진행한 뒤에 나타납니다.</p>}
        </div>}

        {scene.id === 3 && <div className="w6-inner-controls">
          {lastCompleted && <div className="w6-observed" role="status" aria-live="polite">
            <strong>방금 무슨 일이 일어났나요?</strong>
            <p>{OBSERVED_RESULTS[lastCompleted]}</p>
          </div>}
          {beginner ? <>
            <div className="w6-step">
              <span>운송 과정 {STEP_ORDER.indexOf(stage as TutorialCommand) + 1} / 7</span>
              <b>{beginner.question}</b>
            </div>
            <p className="w6-step-explanation">{beginner.explanation}</p>
          </> : <div className="w6-observed">
            <strong>한 건의 운송이 끝났어요.</strong>
            <p>운송 요청부터 하역까지 끝났어요. 이제 이 작은 이동이 전체 FAB 안에서 얼마나 작은 부분인지 살펴볼까요?</p>
          </div>}
          <div className="w6-action-row">
            <button type="button" className="w6-primary" disabled={busy || (!beginner && !transportFinished)} onClick={() => transportFinished ? nextScene(1) : runNext()}>
              {busy ? '실제 차량 움직임을 계산하고 있어요…' : transportFinished ? '전체 FAB 살펴보기' : beginner?.button ?? '운송 진행 중'} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="w6-secondary" onClick={reset}>처음부터 보기</button>
          </div>
          <details className="w6-native-details">
            <summary>실제 시뮬레이션 정보 보기</summary>
            <p>{nativeState.time.toFixed(1)}초 · {nativeState.tick}번의 엔진 계산 · 요청 상태: {request?.phase ?? '아직 없음'}</p>
          </details>
        </div>}
        {scene.id === 6 && <div className="w6-inner-controls">
          <p className="w6-context-line">앞에서는 옆 Bay로 짧게 옮겼어요. 이번에는 FAB의 대각선 반대편 장비까지 이동합니다. 같은 출발지와 도착지라도 레일을 달리 지나갈 수 있을까요?</p>
          {routeStudy && shownRoute ? <>
            <span className="w6-overline">MCS ROUTE · LARGE FAB / 9 BAY</span>
            <div className="w6-action-row" role="group" aria-label="MCS 경로 비교">
              <button className={routeChoice === 'selected' ? 'w6-primary' : 'w6-secondary'} type="button" onClick={() => setRouteChoice('selected')}>MCS가 선택한 길</button>
              <button className={routeChoice === 'alternative' ? 'w6-primary' : 'w6-secondary'} type="button" onClick={() => setRouteChoice('alternative')}>다른 가능한 길</button>
              <button className={routeChoice === 'both' ? 'w6-primary' : 'w6-secondary'} type="button" onClick={() => setRouteChoice('both')}>두 경로 함께 보기</button>
            </div>
            <div className="w6-decision-row">
              <span>{routeChoice === 'selected' ? 'MCS가 실제 선택한 경로' : routeChoice === 'alternative' ? '같은 목적지로 가는 우회 경로' : '하나의 목적지, 두 가지 경로'}</span>
              <strong>{routeStudy.sourceBay} <em aria-hidden="true">→</em> {routeStudy.destinationBay}</strong>
              <small>출발 Bay → 도착 Bay</small>
            </div>
            <p className="w6-decision-copy">{routeChoice === 'selected'
              ? 'MCS가 선택한 길이에요. 청록색 레일을 따라 FAB 반대편의 목적지까지 어떻게 이어지는지 살펴보세요.'
              : routeChoice === 'alternative'
                ? '같은 출발지와 목적지를 잇는 다른 길이에요. 실제 선택된 경로와 어디에서 갈라지는지 비교해 보세요.'
                : '청록색 실선은 MCS가 선택한 길, 보라색 점선은 우회 가능한 길이에요. 두 경로가 어디서 갈라지고 만나는지 살펴보세요.'}</p>
            <p className="w6-microcopy">실제 FAB FLOW의 방향성 레일망을 이용했어요. {routeStudy.alternativeKind === 'detour'
              ? '우회 경로는 일부 레일을 제외하고 다시 계산한 가정으로, 실제 MCS가 선택한 경로는 아니에요.'
              : '우회 경로도 원본 MCS가 계산한 후보 중 하나예요.'} 경로 비교는 실제 운송을 변경하지 않아요.</p>
          </> : <div className="w6-observed" role="status">
            <strong>{routeError ? '실제 경로 사례를 준비하지 못했어요.' : '여러 Bay를 지나는 경로를 계산하고 있어요.'}</strong>
            <p>{routeError || '실제 엔진에서 운송 요청과 배차를 진행한 뒤 MCS가 선택한 경로를 확인합니다.'}</p>
          </div>}
        </div>}
        {(scene.id === 7 || scene.id === 8) && <div className="w6-inner-controls">
          <p className="w6-overline">NATIVE FAB FLOW · LARGE 9-BAY</p>
          {scene.id === 7 ? <>
            <p className="w6-context-line">{pressure.beat === 'normal'
              ? '공장이 평소처럼 움직이고 있어요. 잠시 뒤 들어오는 운송 요청이 훨씬 많아집니다.'
              : pressure.beat === 'surge'
                ? '운송 요청 간격이 10초에서 1초로 줄었어요. 실제 OHT들이 움직이는 동안 새로운 요청이 얼마나 늘어나는지 보세요.'
                : '이제 관찰 결과를 볼 차례예요. 쌓인 요청이 모두 레일 정체를 뜻하는 건 아니에요.'}</p>
            <div className="w6-story-steps" aria-label="운송 요청 증가 관찰 순서">
              <span className={pressure.beat === 'normal' ? 'current' : 'past'}>01 평상시</span>
              <span className={pressure.beat === 'surge' ? 'current' : pressure.beat === 'normal' ? '' : 'past'}>02 요청 증가</span>
              <span className={pressure.beat === 'observe' || pressure.beat === 'complete' ? 'current' : ''}>03 결과 확인</span>
            </div>
            <div className="w6-pressure-total" aria-label="지금까지 들어온 전체 운송 요청">
              <div><span>지금까지 들어온 운송 요청</span><strong>{pressure.metrics.created}<small>건</small></strong></div>
              <div className="w6-pressure-frequency"><span>새 요청 간격</span><strong>{pressure.beat === 'normal' ? '10초에 1건' : '1초에 1건'}</strong></div>
            </div>
            <p className="w6-pressure-subline">아직 완료되지 않은 요청 <strong>{pressure.metrics.unfinished}건</strong> · 실제 엔진 집계</p>
            <div className="w6-action-row">
              <button type="button" className="w6-secondary" onClick={pressure.reset}>다시 보기</button>
              <button type="button" className="w6-primary" onClick={() => nextScene(1)}>운송 결과 확인하기 <span aria-hidden="true">↗</span></button>
            </div>
            <p className="w6-microcopy">{pressure.beat === 'complete' ? '관찰 완료' : '자동 관찰 진행 중'} · 실제 엔진 0.5초 Tick · {Math.round(pressure.state.time)} 시뮬레이션 초</p>
          </> : pressure.ready ? <>
            <p className="w6-context-line">한꺼번에 몰린 운송 요청 중, 실제로 끝난 운송은 얼마나 될까요?</p>
            <div className="w6-result-heading">
              <span>관찰 구간에 들어온 운송 요청</span>
              <strong>{pressure.metrics.created}<small>건</small></strong>
            </div>
            <div className="w6-result-bar" role="img" aria-label={`완료된 운송 ${pressure.metrics.completed}건, 아직 완료되지 않은 운송 ${pressure.metrics.unfinished}건`}>
              <div className="w6-result-finished" style={{width:(pressure.metrics.created ? pressure.metrics.completed / pressure.metrics.created * 100 : 0)+'%'}}/>
              <div className="w6-result-pending" style={{width:(pressure.metrics.created ? pressure.metrics.unfinished / pressure.metrics.created * 100 : 0)+'%'}}/>
            </div>
            <div className="w6-result-legend">
              <div><span className="w6-result-dot finished"/>완료된 운송 <strong>{pressure.metrics.completed}건</strong></div>
              <div><span className="w6-result-dot pending"/>아직 끝나지 않은 운송 <strong>{pressure.metrics.unfinished}건</strong></div>
            </div>
            <p className="w6-result-takeaway">OHT가 계속 움직여도 모든 운송이 끝난 건 아니에요.</p>
            <p className="w6-microcopy">아직 끝나지 않은 운송에는 이동 중인 요청도 포함돼요. 이 숫자만으로 레일 정체를 단정할 수는 없어요. · 실제 엔진 {Math.round(pressure.state.time)} 시뮬레이션 초 관찰</p>
            <div className="w6-action-row">
              <button type="button" className="w6-secondary" onClick={() => { pressure.reset(); nextScene(-1); }}>운송 증가 다시 보기</button>
              <button type="button" className="w6-primary" onClick={() => nextScene(1)}>운영 조건 바꿔보기 <span aria-hidden="true">↗</span></button>
            </div>
          </> : <div className="w6-observed" role="status" aria-live="polite">
            <strong>같은 운송 결과를 계산하고 있어요.</strong>
            <p>Scene 7을 건너뛰어도 같은 FAB와 요청 조건으로 실제 엔진을 끝까지 진행해 결과를 보여줍니다.</p>
          </div>}
          {pressure.error && <p role="alert" className="w6-error">{pressure.error}</p>}
        </div>}
        {scene.id === 9 && <div className="w6-inner-controls">
          <p className="w6-context-line">동일한 요청 순서·난수 시드·관찰 시간으로 두 번 실행해요. 한 번에 한 조건만 바꿔 차이를 관찰합니다.</p>
          <label className="w6-field">운영에서 바꿀 것
            <select disabled={pressure.comparing} value={pressure.compareMode} onChange={e => pressure.changeMode(e.target.value as 'fleet' | 'policy')}>
              <option value="fleet">OHT 8대 → 13대</option><option value="policy">경로 정책 DBR → CBR</option>
            </select>
          </label>
          <label className="w6-field">운송 요청 수준
            <select disabled={pressure.comparing} value={pressure.compareDemand} onChange={e => pressure.changeDemand(Number(e.target.value) as 8 | 14)}>
              <option value={8}>낮음 · 분당 8건</option><option value={14}>높음 · 분당 14건</option>
            </select>
          </label>
          <button type="button" className="w6-primary" disabled={pressure.comparing} onClick={pressure.compare}>{pressure.comparing ? '실제 엔진으로 비교 중…' : '같은 조건으로 두 번 실행하기'} <span aria-hidden="true">↗</span></button>
          {pressure.comparing && <div role="status" className="w6-microcopy">시뮬레이션 계산 {Math.round(pressure.progress*100)}%</div>}
          {pressure.result && <div className="w6-comparison" role="status">
            <div className="w6-comparison-header"><span>실제 실험 결과 · {pressure.result.duration}초 관찰</span><span>동일 seed {pressure.result.seed}</span></div>
            <table><thead><tr><th>측정</th><th>기준</th><th>변경 후</th></tr></thead>
              <tbody>
                <tr><th>완료 운송</th><td>{pressure.result.baseline.completed}건</td><td>{pressure.result.changed.completed}건</td></tr>
                <tr><th>미완료 요청</th><td>{pressure.result.baseline.unfinished}건</td><td>{pressure.result.changed.unfinished}건</td></tr>
                <tr><th>평균 운송 시간</th><td>{pressure.result.baseline.completed ? pressure.result.baseline.averageTransport.toFixed(1)+'초' : '—'}</td><td>{pressure.result.changed.completed ? pressure.result.changed.averageTransport.toFixed(1)+'초' : '—'}</td></tr>
              </tbody></table>
            <p className="w6-microcopy">바꾼 조건: {pressure.compareMode === 'fleet' ? '차량 5대 추가' : '경로 정책 CBR'} · 수요·시간·시드 동일. 이 한 번의 관찰로 모든 상황을 일반화할 수는 없어요.</p>
          </div>}
          {pressure.error && <p role="alert" className="w6-error">{pressure.error}</p>}
        </div>}
        {scene.id === 10 && <div className="w6-inner-controls">
          <div className="w6-architecture" aria-label="실제 실행 구조">
            <div><small>01 / COMMAND</small><strong>운송 요청·설정</strong><span>관람자의 선택 또는 실제 수요</span></div>
            <div><small>02 / ENGINE</small><strong>0.5초마다 상태 계산</strong><span>배차·경로·레일 점유·차량·FOUP</span></div>
            <div><small>03 / RENDER</small><strong>Three.js 3D 화면</strong><span>계산된 상태를 끊김 없이 표현</span></div>
          </div>
          <details className="w6-native-details"><summary>기술 구현 자세히 보기</summary>
            <p>실제 FAB FLOW의 Engine.step()은 0.5 시뮬레이션 초 단위로 상태를 진행합니다. ThreeFacilityScene은 계산된 차량 위치와 FOUP 상태를 받아 표현합니다. 모델의 결정성과 실제 공장의 정밀한 재현은 다릅니다.</p>
          </details>
        </div>}
        {scene.id === 11 && <div className="w6-inner-controls">
          <p className="w6-context-line">Work6에서 본 물류는 정적인 그림이 아니라 실제로 작동하는 시뮬레이터에서 왔습니다. 이제 직접 공장 크기와 OHT 대수, 운송 요청량을 바꿀 수 있어요.</p>
          <span className="w6-overline">FAB FLOW · 반도체 물류 세상</span>
          <p className="w6-microcopy">원본 FAB FLOW 앱의 공개 접속 주소는 현재 확인되지 않아 잘못된 링크 대신 연결을 보류했습니다.</p>
          <button type="button" className="w6-secondary" onClick={() => setSceneIndex(0)}>처음부터 다시 보기 ↗</button>
        </div>}
        {scene.id === 4 && <div className="w6-inner-controls">
          <p className="w6-microcopy">실제 FAB FLOW Large V6 모델 · 삼성 평택 내부 배치를 재현한 것은 아닙니다.</p>
          <button type="button" className="w6-primary" disabled aria-label="전체 FAB 살펴보기, 완료">전체 FAB 살펴보기 <span aria-hidden="true">↗</span></button>
        </div>}
        {error && <p className="w6-error" role="alert">{error}</p>}
      </section>
    </main>
    <footer className="w6-footer">
      <div className="w6-scene-pager" aria-label="전체 장면 탐색">
        {SCENES.map((part, index) => <button key={part.id} type="button" className={index === sceneIndex ? 'active' : ''} onClick={() => setSceneIndex(index)} aria-label={'Scene '+String(part.id).padStart(2,'0')+': '+part.title} aria-current={index === sceneIndex ? 'step' : undefined}>{String(part.id).padStart(2,'0')}</button>)}
      </div>
      <div className="w6-navigation">
        <button type="button" onClick={() => nextScene(-1)} disabled={sceneIndex === 0} aria-label="이전 장면">←</button>
        <span>{String(sceneIndex+1).padStart(2,'0')} <em>/</em> {String(SCENES.length).padStart(2,'0')}</span>
        <button type="button" onClick={() => nextScene(1)} disabled={sceneIndex === SCENES.length-1} aria-label="다음 장면">→</button>
      </div>
    </footer>
    <div className="w6-prototype-disclaimer">WORK 06 · 11 SCENES · ORIGINAL FAB FLOW NATIVE ENGINE & THREE.JS · EDUCATIONAL MODEL, NOT A REAL FAB DIGITAL TWIN</div>
  </div>;
}
