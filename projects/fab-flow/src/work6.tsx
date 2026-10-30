'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThreeFacilityScene from './components/ThreeFacilityScene';
import { Engine } from './sim/engine';
import { operationalScenario } from './sim/experiments';
import { chooseLocalIntroDemand } from './introScenario';
import { publicationCopy } from './sim/publication';
import {
  TutorialCommandLayer, TUTORIAL_REQUEST_ID, tutorialRequest, tutorialVehicle,
  type TutorialCommand, type TutorialStage,
} from './sim/tutorial';
import type { SimulationState } from './sim/types';
import type { CameraCommand } from './components/fabCamera';

type PrototypeScene = 3 | 4 | 6;
const SCENES: Array<{ id: PrototypeScene; chapter: string; eyebrow: string; title: string; body: string }> = [
  { id: 3, chapter: '01 / FOLLOW', eyebrow: 'SCENE 03 — THE TRANSPORT', title: '하나의 운송은 어떻게 완성될까?', body: '반도체 회로가 만들어지는 얇은 원판, ‘웨이퍼’는 여러 장비를 거칩니다. 그 이동 과정을 하나씩 따라가 보세요.' },
  { id: 4, chapter: '02 / REVEAL', eyebrow: 'SCENE 04 — THE NETWORK', title: '지금까지 본 건 공장의 극히 일부였다.', body: '한 대의 OHT에서 하나의 Bay로, 다시 여러 Bay가 연결된 물류망으로 시야를 확장합니다.' },
  { id: 6, chapter: '02 / REVEAL', eyebrow: 'SCENE 06 — THE DECISION', title: '누가 이 운송을 맡고, 어느 길로 갈까?', body: '어떤 차량이 옮길지, 어느 길로 갈지 누군가 결정해야 합니다. 그 역할을 맡은 시스템을 만나봅니다.' }
];
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
  const scenario = {
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
  return { engine, plannedIngress };
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
  const beginner = STEP_ORDER.includes(stage as TutorialCommand) ? BEGINNER_STEPS[stage as TutorialCommand] : null;
  const isReveal = scene.id === 4;
  const isDecision = scene.id === 6;
  // Reuse actual MCS decisions for both empty-vehicle travel and the loaded
  // leg. Do not draw a speculative route before the Engine has selected it.
  const isTransportRouteVisible = scene.id === 3 &&
    (['empty-travel', 'pickup', 'loaded-travel', 'dropoff', 'bay'].includes(stage));
  const candidates = (isDecision || isTransportRouteVisible) && currentDecision
    ? currentDecision.candidates.filter(candidate => candidate.selected)
    : undefined;

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
    ? { source: plannedIngressRef.current.source, destination: plannedIngressRef.current.destination }
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
          cameraLocked={scene.id === 3}
          heatmap={false}
          view={isDecision ? 'network' : 'overview'}
          routeCandidates={candidates}
          onSelect={(kind, id) => { if (kind === 'vehicle') setSelectedVehicleId(id); }}
          onFloorChange={() => {}}
        />
        <div className="w6-scene-label" aria-hidden="true">{scene.eyebrow}</div>
        {scene.id === 3 && <div className="w6-focus-note" role="note">지금은 가까이서 운송을 관찰해요 · 전체 공장은 다음 장면에서</div>}
        {scene.id === 3 && candidates?.length ? <div className="w6-route-note" role="status"><span aria-hidden="true"/> 실제 OHT 이동 경로</div> : null}
        {isReveal && <div className="w6-reveal-note" aria-live="polite">{['01 / 한 대의 OHT','02 / 하나의 Bay','03 / 연결된 FAB 전체'][cameraMoment]}</div>}
      </div>
      <section className={'w6-narrative ' + (isReveal ? 'w6-narrative-reveal' : '')} aria-label="장면 설명">
        <p className="w6-chapter">{scene.chapter}</p>
        <h1>{scene.title}</h1>
        <p className="w6-description">{scene.body}</p>
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
            <p>이동이 필요하다는 요청부터 차량 선택, FOUP를 싣고 내려놓는 과정까지 실제로 살펴봤습니다.</p>
          </div>}
          <div className="w6-action-row">
            <button type="button" className="w6-primary" disabled={busy || !beginner} onClick={runNext}>
              {busy ? '실제 차량 움직임을 계산하고 있어요…' : beginner?.button ?? '운송 완료'} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="w6-secondary" onClick={reset}>처음부터 보기</button>
          </div>
          <details className="w6-native-details">
            <summary>실제 시뮬레이션 정보 보기</summary>
            <p>{nativeState.time.toFixed(1)}초 · {nativeState.tick}번의 엔진 계산 · 요청 상태: {request?.phase ?? '아직 없음'}</p>
          </details>
        </div>}
        {scene.id === 6 && <div className="w6-inner-controls">
          {currentDecision ? <>
            <span className="w6-overline">LIVE MCS / {currentDecision.policy?.toUpperCase?.() ?? 'ROUTING'}</span>
            <p className="w6-decision-copy">물류 제어 시스템(MCS)이 가능한 길을 비교하고 실제로 선택한 경로를 레일 위에 보여줘요. ({currentDecision.candidates.length}개 후보)</p>
            <div className="w6-decision-row">
              <span>실제로 선택된 이동 거리</span>
              <strong>{currentDecision.candidates.find(item => item.selected)?.distance.toFixed(0) ?? '—'}</strong>
              <small>graph units</small>
            </div>
          </> : <>
            <p className="w6-decision-copy">아직 차량과 이동 경로를 정하지 않았어요. 앞의 운송 장면에서 먼저 실제 차량을 선택하고 움직여 보세요.</p>
            <button type="button" className="w6-primary" onClick={() => setSceneIndex(0)}>한 건의 운송 살펴보기 ↗</button>
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
