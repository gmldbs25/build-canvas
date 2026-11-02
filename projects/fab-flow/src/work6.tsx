'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThreeFacilityScene from './components/ThreeFacilityScene';
import { Engine } from './sim/engine';
import { SCENES } from './work6-scenes';
import { usePressureWorld } from './usePressureWorld';
import { useAmbientIntro } from './useAmbientIntro';
import { buildNativeRouteStudy, type NativeRouteStudy } from './routeStudy';
import { chooseNativeGraphExample } from './nativeGraphExample';
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

function createClockEngine(): Engine {
  // Separate genuine native experiment; the tutorial remains command-owned.
  const scenario: Scenario = { ...operationalScenario('large'), fleet: 12, demand: 2,
    duration: 1800, seed: 17, pattern: 'steady' };
  const engine = new Engine(scenario, { analysis: false });
  // Genuine 0.5-second steps: start at an observable active point, not t=0 parking.
  // Both fresh runs replay the exact same 300 native ticks.
  engine.step(300);
  return engine;
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
  const autoTransportRef = useRef(false);
  const clockInitial = useMemo(() => createClockEngine(), []);
  const clockRef = useRef(clockInitial);
  const [clockState, setClockState] = useState<SimulationState>(() => freezeState(clockInitial));
  const [clockPlaying, setClockPlaying] = useState(false);
  const [networkLens, setNetworkLens] = useState(false);
  const [trafficLens, setTrafficLens] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [decision, setDecision] = useState<ReturnType<Engine['inspectDecision']>>(undefined);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ sequence: 1, kind: 'opening' });
  const scene = SCENES[sceneIndex];
  // Shared original Large 3D renderer; independent scenarios are labelled.
  const isPressure = scene.id === 6 || scene.id === 7;
  const pressure = usePressureWorld(isPressure, false, isPressure);
  const congestionVehicleId = pressure.railFocus?.vehicleId;
  const congestionVehicle = pressure.state.vehicles.find(vehicle => vehicle.id === congestionVehicleId);
  const realQueue = pressure.state.linkQueues?.find(queue => queue.vehicleIds.includes(congestionVehicleId ?? ''));
  const waitingVehicles = pressure.state.vehicles.filter(vehicle => !vehicle.parked && vehicle.waitReason === 'rail' && vehicle.waiting > 0).length;
  const activeTransports = pressure.state.vehicles.filter(vehicle => !vehicle.parked && !!vehicle.request).length;
  const railIsBlocked = congestionVehicle?.waitReason === 'rail' && (congestionVehicle.waiting ?? 0) > 0;
  const congestionDecision = congestionVehicleId ? pressure.engine.inspectDecision(congestionVehicleId) : undefined;
  const isOpening = scene.id === 1 || scene.id === 2 || scene.id === 8;
  const ambient = useAmbientIntro(initial.engine.scenario, isOpening);
  const nativeGraphExample = useMemo(() => chooseNativeGraphExample(ambient.engine.layout, 0), [ambient.engine.layout]);
  const [routeStudy, setRouteStudy] = useState<NativeRouteStudy | null>(null);
  const [routeError, setRouteError] = useState('');
  const [routeChoice, setRouteChoice] = useState<'selected' | 'alternative' | 'both'>('both');
  const activeEngine = isPressure ? pressure.engine : isOpening ? ambient.engine :
    scene.id === 4 ? clockRef.current :
    scene.id === 5 && routeStudy ? routeStudy.engine : engineRef.current;
  const activeState = isPressure ? pressure.state : isOpening ? ambient.state :
    scene.id === 4 ? clockState :
    scene.id === 5 && routeStudy ? routeStudy.state : nativeState;
  useEffect(() => {
    if (scene.id !== 5 || routeStudy || routeError) return;
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

  useEffect(() => {
    if (scene.id !== 4 || !clockPlaying) return;
    const timer = window.setInterval(() => {
      try {
        clockRef.current.step(1);
        setClockState(freezeState(clockRef.current));
      } catch (cause) {
        setClockPlaying(false);
        setError(cause instanceof Error ? cause.message : '네이티브 Tick 계산 오류');
      }
    }, 520);
    return () => window.clearInterval(timer);
  }, [scene.id, clockPlaying]);
  const stepClock = () => {
    if (clockPlaying) return;
    try {
      clockRef.current.step(1);
      setClockState(freezeState(clockRef.current));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '네이티브 Tick 계산 오류'); }
  };
  const resetClock = () => {
    setClockPlaying(false);
    const engine = createClockEngine();
    clockRef.current = engine;
    setClockState(freezeState(engine));
    setError('');
  };

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
    autoTransportRef.current = false;
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
      if (autoTransportRef.current && next !== 'bay') {
        timerRef.current = window.setTimeout(() => {
          if (runId === runIdRef.current && autoTransportRef.current) runNext();
        }, 700);
      } else autoTransportRef.current = false;
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

  const showGraphLens = () => {
    setNetworkLens(true);
    if (nativeGraphExample) setCameraCommand(previous => ({ sequence: previous.sequence + 1,
      kind: 'tableau', frame: nativeGraphExample.frame }));
  };
  const showFactoryLens = () => {
    setNetworkLens(false);
    setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind: 'overview', transitionMs: 1100 }));
  };

  const nextScene = useCallback((delta: number) => {
    setSceneIndex(current => Math.max(0, Math.min(SCENES.length - 1, current + delta)));
  }, []);
  useEffect(() => {
    if (scene.id !== 2) setNetworkLens(false);
    if (scene.id !== 3) {
      autoTransportRef.current = false;
      cancelRunning();
    }
    if (scene.id !== 4) setClockPlaying(false);
  }, [scene.id, cancelRunning]);

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
  const isReveal = scene.id === 2;
  const isDecision = scene.id === 5;
  const presentationRoute = routeChoice;
  const shownRoute = routeStudy ? presentationRoute === 'alternative' ? routeStudy.alternative : routeStudy.selected : null;
  const isNetwork = scene.id === 2 && networkLens;
  const focusMode = scene.id === 1 || scene.id === 3;
  const pressureBeatLabel = '혼잡한 Large FAB · 실제 엔진';
  const isTransportRouteVisible = scene.id === 3 &&
    (['empty-travel', 'pickup', 'loaded-travel', 'dropoff', 'bay'].includes(stage));
  const candidates = scene.id === 6 && congestionDecision
    ? congestionDecision.candidates.filter(candidate => candidate.selected)
    : isDecision && routeStudy && shownRoute
      ? presentationRoute === 'both'
        ? [{ ...routeStudy.alternative, selected: false }, { ...routeStudy.selected, selected: true }]
        : [{ ...shownRoute, selected: true }]
      : isTransportRouteVisible && currentDecision
        ? currentDecision.candidates.filter(candidate => candidate.selected)
        : undefined;
  const beat = transportFinished ? 4 : stage === 'request' || stage === 'dispatch' ? 1
    : stage === 'empty-travel' ? 2 : stage === 'dropoff' ? 4 : 3;
  useEffect(() => {
    const req = tutorialRequest(engineRef.current);
    const owner = tutorialVehicle(engineRef.current);
    const tracked = owner?.id, reqId = req?.id;
    if (scene.id === 1) {
      setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind: 'tableau', frame: ambient.frame }));
      return;
    }
    if (scene.id === 2) {
      setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind: 'overview', transitionMs: 1500 }));
      return;
    }
    if (scene.id === 3) {
      issueCamera(tracked ? 'follow' : 'opening', tracked, reqId); return;
    }
    if (scene.id === 5) {
      if (routeStudy) setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind: 'tableau', frame: routeStudy.frame }));
      else issueCamera('overview');
      return;
    }
    if (scene.id === 4) { issueCamera('opening'); return; }
    if (scene.id === 8) {
      // On narrow screens a whole-FAB overview shrinks OHTs to invisible dots.
      // The original FAB FLOW native introductory tableau keeps real vehicles legible.
      setCameraCommand(previous => ({ sequence: previous.sequence + 1, kind: 'tableau', frame: ambient.frame }));
      return;
    }
    issueCamera('overview');
  }, [scene.id, issueCamera, routeStudy?.seed]);


  // The blocked vehicle and approach link were verified by the real Native
  // warm-up. A wider fixed tableau keeps the occupied link and surrounding
  // OHTs visible instead of following a single free-moving vehicle too close.
  useEffect(() => {
    if (scene.id !== 6 || !pressure.prepared || !pressure.railFocus) return;
    setCameraCommand(previous => ({ sequence:previous.sequence + 1,
      kind:'tableau',frame:pressure.railFocus!.frame }));
  }, [scene.id, pressure.prepared, pressure.railFocus?.vehicleId]);
  // The scanner is purely a way to visualize native rail occupancy / queues.
  // Its color is not a computed AI diagnosis or prediction.
  const observedRailView = scene.id === 6 && trafficLens;
  // Keep the original port annotations stable through request/dispatch.
  const planned = scene.id === 3 ? plannedIngressRef.current : undefined;

  return <div className="w6-root" data-prototype="true"
    data-intro-source-bay={initial.engine.layout.ports.find(port => port.id === initial.selection.source)?.area}
    data-intro-destination-bay={initial.engine.layout.ports.find(port => port.id === initial.selection.destination)?.area}
    data-intro-selected-seed={initial.selection.seed}
    data-intro-directed-distance={initial.selection.shortestDirectedDistance}
    data-opening-moving={ambient.openingMovingVehicles}
    data-opening-local-moving={ambient.openingLocalVehicles}
    data-scene-count={SCENES.length} data-current-scene={scene.id}
    data-scene2-network={scene.id === 2 ? (networkLens ? 'network' : 'factory') : ''}
    data-clock-time={scene.id === 4 ? clockState.time : ''}
    data-clock-tick={scene.id === 4 ? clockState.tick : ''}
    data-route-study-seed={routeStudy?.seed ?? ''}
    data-route-study-source={routeStudy?.sourceBay ?? ''}
    data-route-study-destination={routeStudy?.destinationBay ?? ''}
    data-route-study-distinct-fraction={routeStudy?.contrast.distinctFraction ?? ''}
    data-route-study-separation={routeStudy?.contrast.maxSeparation ?? ''}
    data-route-study-alternative-kind={routeStudy?.alternativeKind ?? ''}
    data-pressure-prepared={scene.id === 6 ? String(pressure.prepared) : ''}
    data-pressure-waiting={scene.id === 6 ? waitingVehicles : ''}
    data-pressure-vehicle={scene.id === 6 ? congestionVehicleId ?? '' : ''}
    data-pressure-queue={scene.id === 6 ? realQueue?.linkId ?? pressure.railFocus?.linkId ?? '' : ''}
    data-pressure-start-wait={scene.id === 6 ? pressure.railFocus?.waitSeconds ?? 0 : ''}
    data-pressure-verified={scene.id === 6 ? String(!!pressure.railFocus && pressure.railFocus.waitSeconds >= 3) : ''}
    data-pressure-staging-clearance={scene.id === 6 ? pressure.railFocus?.stagingClearance ?? '' : ''}
    data-pressure-fleet-changes={scene.id === 6 ? pressure.engine.scenario.fleetChanges?.length ?? 0 : ''}
    data-pressure-vehicle-count={scene.id === 6 ? pressure.state.vehicles.length : ''}
    data-pressure-rail-blocked={scene.id === 6 ? String(!!railIsBlocked) : ''}
    data-pressure-active={scene.id === 6 ? activeTransports : ''}
    data-pressure-fleet={scene.id === 6 ? pressure.engine.scenario.fleet : ''}
    data-pressure-demand-interval={scene.id === 6 ? pressure.engine.scenario.demandChanges?.at(-1)?.intervalSeconds ?? pressure.engine.scenario.demandIntervalSeconds ?? '' : ''}
    data-fab-layout={(scene.id >= 4 && scene.id <= 8) ? activeEngine.layout.id : ''}
    data-mcs-lens={scene.id === 6 ? (trafficLens ? 'traffic' : 'normal') : ''}
    data-story-version="behind-the-simulation-v3">
    <header className="w6-header">
      <a className="w6-brand" href="../" aria-label="Build Canvas 홈으로">BUILD<span>_</span>CANVAS</a>
      <span className="w6-workname">WORK 06 <span className="w6-header-divider">/</span> FAB FLOW</span>
      <span className="w6-prototype">BEHIND THE SIMULATION</span>
    </header>
    <main className="w6-stage">
      <div className="w6-viewport" aria-label="Live FAB FLOW 3D world">
        <ThreeFacilityScene
          layout={activeEngine.layout}
          state={activeState}
          floor={0}
          failures={activeEngine.scenario.failures}
          storageCapacity={activeEngine.scenario.storageCapacity}
          running={isPressure ? pressure.prepared : isOpening ? true : scene.id === 4 ? clockPlaying : busy}
          tickMs={isPressure ? pressure.tickMs : isOpening ? ambient.tickMs : scene.id === 4 ? 520 : busy && (stage === 'pickup' || stage === 'dropoff') ? 520 : 32}
          selected={scene.id === 6 && congestionVehicleId ? 'vehicle:' + congestionVehicleId : isDecision && routeStudy ? 'vehicle:' + routeStudy.vehicleId
            : !isOpening && !isPressure && selectedVehicleId ? 'vehicle:' + selectedVehicleId : undefined}
          trackedVehicle={isPressure ? (scene.id === 6 ? congestionVehicleId : undefined) : isDecision && routeStudy ? routeStudy.vehicleId : isOpening ? undefined : selectedVehicleId}
          trackedRequest={isOpening || isPressure || isDecision || scene.id === 4 || request?.phase === 'completed' ? undefined : request?.id}
          plannedTutorialIngress={scene.id === 3 ? planned : undefined}
          tutorialStage={scene.id === 3 ? stage : undefined}
          softTokenEntrance={scene.id === 3}
          cameraCommand={cameraCommand}
          cameraLocked={focusMode}
          heatmap={observedRailView}
          view={observedRailView ? 'traffic' : isDecision || isNetwork ? 'network' : 'overview'}
          networkFocus={isNetwork}
          routeCandidates={candidates}
          onSelect={(kind, id) => { if (kind === 'vehicle') setSelectedVehicleId(id); }}
          onFloorChange={() => {}}
        />
        <div className="w6-scene-label" aria-hidden="true">{scene.eyebrow}</div>
        {isNetwork && <div className="w6-route-note" role="status"><span aria-hidden="true"/> 실제 Node · 방향성 Link · Port를 표시 중</div>}
        {focusMode && <div className="w6-focus-note" role="note">{isOpening ? 'FAB FLOW 엔진에서 계산한 운송을 관찰해요' : '실제 한 건의 운송 상태를 따라가요'}</div>}
        {(scene.id === 3 || isDecision || scene.id === 6) && candidates?.length ? <div className="w6-route-note" role="status"><span aria-hidden="true"/> {scene.id === 5 ? '실제 선택 경로 · 다른 경로는 비교용' : '실제 OHT 이동 경로'}</div> : null}
        {scene.id === 6 && <div className="w6-mcs-lens-note" aria-label="현재 레일 운행 신호">
          <span aria-hidden="true" className={trafficLens ? 'is-scanning' : ''}/>
          {trafficLens ? '실제 레일 점유·대기 신호' : '기본 FAB 화면'}
        </div>}
        {isReveal && <div className="w6-reveal-note" aria-live="polite">{networkLens ? '실제 Port · Link · Node 구조 확대' : '원본 3D FAB · 공장의 모습'}</div>}
        {scene.id === 6 && !pressure.prepared && <div className="w6-pressure-loading" role="status">
          <strong>운영 중인 FAB를 준비하고 있어요.</strong>
          <span>실제 엔진으로 운송이 진행된 상태를 계산하고 있습니다.</span>
        </div>}
        {scene.id === 6 && pressure.prepared && <div className="w6-pressure-caption" aria-live="off">
          <span className="is-busy" aria-hidden="true"/>
          {pressureBeatLabel}
        </div>}
      </div>
      <section className={'w6-narrative ' + (isReveal ? 'w6-narrative-reveal' : '') + (scene.id >= 4 && scene.id <= 8 ? ' w6-narrative-v2' : '')} aria-label="장면 설명">
        <p className="w6-chapter">{scene.chapter}</p>
        <h1>{scene.title}</h1>
        <p className="w6-description">{scene.body}</p>


        {scene.id === 1 && <div className="w6-inner-controls w6-story-controls">
          <p className="w6-context-line">화면 속 움직임은 실제 FAB FLOW 엔진에서 계산됩니다. 작은 차량들이 어떤 규칙을 따라가는지 살펴보세요.</p>
          <button type="button" className="w6-primary" onClick={() => nextScene(1)}>레일의 규칙 살펴보기 ↗</button>
        </div>}
        {scene.id === 2 && <div className="w6-inner-controls w6-story-controls">
          <div className="w6-action-row" role="group" aria-label="공장과 네트워크 보기">
            <button type="button" className={!networkLens ? 'w6-primary' : 'w6-secondary'} aria-pressed={!networkLens} onClick={showFactoryLens}>공장 보기</button>
            <button type="button" className={networkLens ? 'w6-primary' : 'w6-secondary'} aria-pressed={networkLens} onClick={showGraphLens}>길찾기 구조 보기</button>
          </div>
          <p className="w6-microcopy" aria-live="polite">{networkLens
            ? '공장 속 실제 한 구간을 확대했어요. 동그란 지점은 Node, 화살표는 이동 방향이 있는 Link, 호박색 표시는 FOUP를 주고받는 Port입니다.'
            : '먼저 FAB FLOW가 보여주는 장비와 OHT를 살펴보세요. 그래프 보기를 누르면 같은 공장의 실제 Node·Link·Port 구조를 확대해 보여줘요.'}</p>
          {networkLens && <div className="w6-graph-legend" aria-label="실제 FAB 그래프 데이터 설명">
            <div><span className="w6-graph-symbol is-node" aria-hidden="true"/><p><strong>Node</strong><small>차량이 거치는 실제 연결 지점</small></p></div>
            <div><span className="w6-graph-symbol is-link" aria-hidden="true">→</span><p><strong>Link</strong><small>이동 가능한 레일과 그 방향</small></p></div>
            <div><span className="w6-graph-symbol is-port" aria-hidden="true"/><p><strong>Port</strong><small>장비와 FOUP를 주고받는 접점</small></p></div>
          </div>}
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 그래프 모델링</summary>
            <p>장비의 3D 외형은 사람이 이해하기 위한 표현입니다. Native 엔진은 방향성 Node·Link로 경로를 탐색하고 Port를 운송의 시작·도착 접점으로 사용합니다. 가까운 지점이라도 링크가 연결되지 않았거나 방향이 맞지 않으면 직접 이동할 수 없습니다. 표시된 지점과 화살표는 실제 FAB FLOW 레이아웃 데이터에서 읽어왔습니다.</p>
          </details>
        </div>}
        {scene.id === 3 && <div className="w6-inner-controls w6-story-controls">
          <div className="w6-story-steps" aria-label="운송의 네 단계">
            {['요청·배차','빈 차 이동','픽업·적재 운송','하역 완료'].map((label, index) =>
              <span key={label} className={beat === index + 1 ? 'current' : beat > index + 1 ? 'past' : ''}>{index + 1}. {label}</span>)}
          </div>
          {lastCompleted && <div className="w6-observed" role="status"><strong>방금 일어난 변화</strong><p>{OBSERVED_RESULTS[lastCompleted]}</p></div>}
          {beginner ? <p className="w6-step-explanation">{beginner.question} {beginner.explanation}</p>
            : <p className="w6-result-takeaway">요청부터 하역까지, 네이티브 엔진에서 한 건의 운송이 완료됐습니다.</p>}
          <div className="w6-action-row">
            <button type="button" className="w6-primary" disabled={busy || !beginner} onClick={() => { autoTransportRef.current = true; runNext(); }}>
              {busy ? '실제 운송을 관찰하는 중…' : '끝까지 자동 관찰하기'}
            </button>
            <button type="button" className="w6-secondary" disabled={busy || !beginner} onClick={() => { autoTransportRef.current = false; runNext(); }}>한 단계씩</button>
            <button type="button" className="w6-secondary" onClick={reset}>다시 보기</button>
          </div>
          {transportFinished && <button type="button" className="w6-primary" onClick={() => nextScene(1)}>움직임을 만든 시간의 규칙 ↗</button>}
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 운송 상태</summary>
            <p>물류 요청은 담당 차량이 정해지기 전부터 존재합니다. OHT가 빈 상태로 출발 Port를 찾아가 FOUP를 싣고, 목적지 Port에 내려놓습니다. 엔진이 이 실제 소유권과 상태를 관리합니다.</p>
            <p>{nativeState.time.toFixed(1)} 시뮬레이션 초 · {nativeState.tick} Tick · 요청: {request?.phase ?? '아직 없음'}</p>
          </details>
        </div>}
        {scene.id === 4 && <div className="w6-inner-controls w6-story-controls">
          <div className="w6-clock-readout" aria-live="off">
            <div><span>SIMULATION TIME</span><strong>{clockState.time.toFixed(1)} <small>sec</small></strong></div>
            <div><span>ENGINE TICK</span><strong>{clockState.tick}</strong></div>
          </div>
          <p className="w6-microcopy">별도로 시작한 동일 Large FAB의 실제 네이티브 실험입니다. 앞 장면의 운송 상태를 임의로 건너뛰지 않습니다.</p>
          <div className="w6-action-row">
            <button type="button" className="w6-primary" onClick={() => setClockPlaying(current => !current)}>{clockPlaying ? '일시정지' : '재생'}</button>
            <button type="button" className="w6-secondary" disabled={clockPlaying} onClick={stepClock}>0.5초 한 Tick</button>
            <button type="button" className="w6-secondary" onClick={resetClock}>같은 조건으로 다시</button>
          </div>
          <p className="w6-context-line">한 Tick 동안 차량은 조금 움직이거나 그대로일 수도 있어요. 그러나 엔진의 시뮬레이션 시간은 정확히 0.5초 진행합니다.</p>
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 결정적 실행</summary>
            <p>FAB FLOW는 고정된 Tick과 Seed로 실험 입력을 재현합니다. 브라우저 재생 속도와 시뮬레이션 시간은 다르며, 3D 화면 보간은 운송 결과를 새로 결정하지 않습니다.</p>
          </details>
        </div>}
        {scene.id === 5 && <div className="w6-inner-controls w6-story-controls">
          {routeStudy ? <>
            <span className="w6-overline">NATIVE MCS · LARGE 9 BAY</span>
            <div className="w6-action-row" role="group" aria-label="실제 레일 경로 비교">
              <button type="button" className={routeChoice === 'selected' ? 'w6-primary' : 'w6-secondary'} aria-pressed={routeChoice === 'selected'} onClick={() => setRouteChoice('selected')}>선택 경로</button>
              <button type="button" className={routeChoice === 'alternative' ? 'w6-primary' : 'w6-secondary'} aria-pressed={routeChoice === 'alternative'} onClick={() => setRouteChoice('alternative')}>다른 길</button>
              <button type="button" className={routeChoice === 'both' ? 'w6-primary' : 'w6-secondary'} aria-pressed={routeChoice === 'both'} onClick={() => setRouteChoice('both')}>함께 보기</button>
            </div>
            <p className="w6-route-difference">{routeStudy.sourceBay} → {routeStudy.destinationBay} · 실제 방향성 레일망</p>
            <p className="w6-microcopy">{routeStudy.alternativeKind === 'detour'
              ? '다른 길은 일부 링크를 제외하고 다시 계산한 비교용 가정입니다. 실제 MCS가 선택한 길은 아닙니다.'
              : '다른 길도 실제 MCS가 계산한 후보입니다. 실제로 선택된 경로와 구분해 표시합니다.'} 버튼은 실제 운송 상태를 바꾸지 않습니다.</p>
          </> : <p className="w6-context-line" role="status">{routeError || '네이티브 MCS의 실제 경로를 계산하고 있어요.'}</p>}
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · Weighted Dijkstra</summary>
            <p>DBR은 이동 거리를 중심으로 경로를 고릅니다. CBR은 거리와 현재 레일 점유·대기 비용을 함께 평가합니다. 예상 비용은 실제 도착 시간을 보장하지 않습니다.</p>
          </details>
        </div>}
        {scene.id === 6 && <div className="w6-inner-controls w6-story-controls">
          <span className="w6-overline">REAL NATIVE RAIL WAIT · LARGE V6</span>
          <div className="w6-action-row" role="group" aria-label="혼잡 관찰">
            <button type="button" className={!trafficLens ? 'w6-primary' : 'w6-secondary'} aria-pressed={!trafficLens} onClick={() => setTrafficLens(false)}>전체 흐름</button>
            <button type="button" className={trafficLens ? 'w6-primary' : 'w6-secondary'} aria-pressed={trafficLens} onClick={() => setTrafficLens(true)}>대기 구간</button>
          </div>
          <div className="w6-traffic-metrics"><span><strong>{pressure.engine.scenario.fleet}</strong>대 OHT</span>
            <span><strong>{activeTransports}</strong>대 운송 중</span>
            <span><strong>{waitingVehicles}</strong>대 레일 대기</span></div>
          <p className="w6-context-line">{!pressure.prepared
            ? '실제 엔진에서 점유 중인 레일 앞에 대기하는 OHT를 찾고 있어요.'
            : railIsBlocked ? (congestionVehicleId ?? '선택 차량') + ' · 현재 앞쪽 레일 점유로 대기 중'
              : '확인된 대기 차량이 이후 어떻게 움직이는지 관찰하고 있어요.'}</p>
          <p className="w6-microcopy">여기서 보여주는 것은 실제 레일 대기입니다. 대기 상태를 곧바로 Deadlock이라고 부르지는 않습니다.</p>
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 안전한 이동</summary>
            <p>OHT는 레일 구간과 교차로 진입을 독점 예약합니다. 서로 기다리는 순환 의존이 지속되는 Deadlock은 별도로 진단하고 복구를 시도합니다. 개별 차량의 정지와 확인된 교착은 구분해야 합니다.</p>
          </details>
          {pressure.error && <p role="alert" className="w6-error">{pressure.error}</p>}
        </div>}
        {scene.id === 7 && <div className="w6-inner-controls w6-story-controls">
          <span className="w6-overline">MATCHED BENCHMARK · OPERATIONAL 2.1 · SEED 17</span>
          <div className="w6-benchmark" aria-label="검증된 이전 모델 정책 실험">
            <div><span>DBR · 거리 중심</span><strong>131 <small>/ 240 완료</small></strong><p>미완료 109건</p></div>
            <div><span>CBR · 혼잡 고려</span><strong>130 <small>/ 240 완료</small></strong><p>미완료 110건</p></div>
          </div>
          <p className="w6-context-line">OHT 48대, 요청 8건/분, 같은 Seed와 1,800 시뮬레이션 초. 같은 조건에서도 더 복잡한 정책이 항상 유리한 것은 아니었어요. 1건 차이로 일반적인 우열을 판단할 수는 없습니다.</p>
          <p className="w6-microcopy">수치는 FAB FLOW의 검증된 이전 operational 2.1 실험에서 가져왔습니다. 배경의 현재 Large V6 3D는 이 결과의 실시간 Replay가 아닙니다.</p>
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 실험의 조건</summary>
            <p>모델, Seed, 요청 일정, 차량 수, 실패 조건과 관찰 종료 시점을 고정하고 완료 및 미완료를 함께 기록했습니다. 알고리즘 계산 속도와 실제 운송 처리량은 서로 다른 측정 대상입니다.</p>
          </details>
        </div>}
        {scene.id === 8 && <div className="w6-inner-controls w6-story-controls">
          <div className="w6-architecture" aria-label="엔진과 화면의 역할">
            <div><small>01 · ENGINE</small><strong>운송 규칙을 계산한다</strong></div>
            <div><small>02 · STATE</small><strong>현재의 결과를 기록한다</strong></div>
            <div><small>03 · THREE.JS</small><strong>그 결과를 3D로 보여준다</strong></div>
          </div>
          <p className="w6-context-line">실제 공장 전체를 똑같이 구현한 디지털 트윈은 아닙니다. 하지만 복잡한 물류를 관찰하고 질문할 수 있는 모델입니다.</p>
          <details className="w6-native-details w6-deep"><summary>조금 더 깊게 · 엔진과 렌더러</summary>
            <p>엔진은 Request, OHT 위치, 레일 점유, FOUP 소유권을 계산합니다. Three.js는 확인된 Geometry와 상태로 이를 보여주며, LOD·Instancing으로 렌더링 비용을 조절합니다. 화면이 물류 결과를 결정하지는 않습니다.</p>
          </details>
          <a className="w6-primary w6-explore-fabflow" href="https://fabflow-yoon.vercel.app/" target="_blank" rel="noopener noreferrer">FAB FLOW 직접 체험하기 ↗</a>
          <button type="button" className="w6-secondary" onClick={() => setSceneIndex(0)}>처음부터 다시 보기</button>
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
    <div className="w6-prototype-disclaimer">WORK 06 · ORIGINAL FAB FLOW NATIVE 3D · EDUCATIONAL MODEL · NOT AN INDUSTRIAL DIGITAL TWIN</div>
  </div>;
}
