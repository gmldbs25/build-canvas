'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFacilityPreviewScene, createNativeOhtActorAssets, createNativePortFoupAssets, disposeFacilityPreviewScene, disposeNativeOhtActorAssets, disposeNativePortFoupAssets, isSoftwareRendererName, rendererPixelRatio, setFacilityPreviewLod, translateFacilityPreviewScene } from '@/components/ThreeFacilityScene';
import { confirmedMotion } from '@/sim/motion';
import { pathForLink, vehiclePosition } from '@/sim/geometry';
import type { Layout, MultiLifterRuntime, Scenario, SimulationState, Vehicle } from '@/sim/types';
import './multi-large-native-scene.css';

export type MultiLargeView = 'stacked' | '1f' | '2f';
export type MultiLargeActorPose = { id: string; x: number; y: number; z: number; angle: number; floor: number; loaded: boolean; requestId?: string; waiting: number; failed: boolean; transfer?: number; transferFromFloor?: number; transferToFloor?: number };
export type MultiLargeSceneDiagnostic = {
  nativeTick: number; nativeTime: number; view: MultiLargeView; followVehicleId?: string;
  camera: { target: [number, number, number]; span: number; position: [number, number, number] };
  active: number; presented: number; presentedFrames: number; drawCalls: number; geometries: number; textures: number;
  vehicles: MultiLargeActorPose[];
  lifters: Array<{ id: string; resource: string; ownerVehicleId?: string; phase?: MultiLifterRuntime['phase']; queueLength: number; failed: boolean; entryFloor?: number; exitFloor?: number }>;
  foupOwnership: Array<{ requestId: string; owner: 'source' | 'vehicle' | 'stocker'; portId?: string; vehicleId?: string; x: number; y: number; z: number }>;
};

export type MultiLargeFacilitySceneProps = {
  layout: Layout; scenario: Scenario; state: SimulationState; running: boolean; tickMs: number;
  selectedVehicleId?: string; followVehicleId?: string; view: MultiLargeView; introEnabled?: boolean;
  onSelectVehicle?: (vehicleId: string) => void; onFollowChange?: (following: boolean) => void;
  onViewChange?: (view: MultiLargeView, automatic?: boolean) => void; onIntroComplete?: () => void;
  onDiagnostic?: (diagnostic: MultiLargeSceneDiagnostic) => void;
};

const FLOOR_GAP = 4200;
const ACTOR_HEIGHT = 72;
export const MULTI_LARGE_LANDING_MARKER_HEIGHT = 4;
export const MULTI_LARGE_LANDING_MARKER_CENTER_Y = 4;
const palette = { background: 0xe8eee9, shaft: 0x178874, owner: 0x1b9a83, queued: 0xe0a73e, failed: 0xc65349, landing: 0xe5b85d, route: 0xd08b32 };

/** Pose only confirmed native movement. Lift height follows its serialized progress on both boundary ticks. */
export function interpolateMultiLargeVehiclePose(layout: Layout, previous: Vehicle | undefined, current: Vehicle, fraction: number, floorGap = FLOOR_GAP): MultiLargeActorPose | undefined {
  const currentPosition = vehiclePosition(layout, current);
  if (!currentPosition) return undefined;
  const t = Math.max(0, Math.min(1, fraction));
  const previousLink = previous?.link ? layout.links.find(link => link.id === previous.link) : undefined;
  const currentLink = current.link ? layout.links.find(link => link.id === current.link) : undefined;
  const previousLiftIsCurrentArrival = previousLink?.kind === 'lifter' && !currentLink && current.node === previousLink.to && t < 1;
  const liftLink = currentLink?.kind === 'lifter' ? currentLink : previousLiftIsCurrentArrival ? previousLink : undefined;
  if (liftLink) {
    const from = layout.nodes.find(node => node.id === liftLink.from), to = layout.nodes.find(node => node.id === liftLink.to);
    if (!from || !to) return undefined;
    const previousWasSameTransfer = previousLink?.id === liftLink.id;
    const start = previousWasSameTransfer ? previous!.progress : 0;
    const end = currentLink?.id === liftLink.id ? current.progress : 1;
    const progress = start + (end - start) * t;
    return { id: current.id, x: from.x, z: from.y, y: from.floor * floorGap + ACTOR_HEIGHT + (to.floor - from.floor) * floorGap * progress,
      angle: 270, floor: currentPosition.floor, loaded: current.loaded, requestId: current.request, waiting: current.waiting, failed: current.failed,
      transfer: progress, transferFromFloor: from.floor, transferToFloor: to.floor };
  }
  const sample = confirmedMotion(layout, previous, current)(t);
  const oldPosition = previous ? vehiclePosition(layout, previous) : undefined;
  const angle = oldPosition ? sample.angle + 360 * Math.round((oldPosition.angle - sample.angle) / 360) : sample.angle;
  return { id: current.id, x: sample.x, z: sample.y, y: currentPosition.floor * floorGap + ACTOR_HEIGHT,
    angle, floor: currentPosition.floor, loaded: current.loaded, requestId: current.request, waiting: current.waiting, failed: current.failed };
}

type ActorRuntime = {
  assets: ReturnType<typeof createNativeOhtActorAssets>; foupAssets: ReturnType<typeof createNativePortFoupAssets>;
  body: THREE.InstancedMesh; carriers: THREE.InstancedMesh; status: THREE.InstancedMesh;
  selection: THREE.InstancedMesh; sources: THREE.InstancedMesh; stored: THREE.InstancedMesh; statusGeometry: THREE.BufferGeometry;
};
type LifterVisual = { definition: NonNullable<Layout['lifters']>[number]; shaft: THREE.Mesh; lower: THREE.Mesh; upper: THREE.Mesh; label: THREE.Sprite; leader: THREE.Line };
export type MultiLargeLifterAnchor = { id: string; resource: string; x: number; z: number; lowerFloor: number; upperFloor: number; lowerNode: string; upperNode: string };
type Runtime = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.OrthographicCamera; worlds: [ReturnType<typeof buildFacilityPreviewScene>, ReturnType<typeof buildFacilityPreviewScene>]; floorPads: [THREE.Mesh, THREE.Mesh]; lifters: LifterVisual[]; actors: ActorRuntime; route: THREE.LineSegments; routeGeometry: THREE.BufferGeometry; resize: ResizeObserver; frame: number; tweenFrame: number; statsTimer: number; manual: boolean; reducedMotion: boolean; dragging?: { x: number; y: number; moved: boolean; pointerId: number }; pointers: Map<number, { x: number; y: number }>; pinch?: { ids: [number, number]; distance: number; centerX: number; centerY: number; span: number; target: THREE.Vector3 }; multiTouch: boolean; lastTick: number; routeVehicleId?: string; routeView?: MultiLargeView; presentedFrames: number; diagnosticAt: number; worldOffset: THREE.Vector3; span: number; cameraTarget: THREE.Vector3; followFloor?: number; lastFollowFloor?: number; introTimer?: number; selectedTag?: HTMLDivElement | null; disposed: boolean; layout: Layout; view: MultiLargeView; host: HTMLDivElement; previousVehicles: Map<string, Vehicle>; tickAt: number; tickMs: number; running: boolean };

function labelSprite(text: string) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 56;
  const ctx = canvas.getContext('2d')!; ctx.clearRect(0, 0, 128, 56); ctx.fillStyle = '#19382f'; ctx.beginPath(); ctx.roundRect(5, 5, 118, 46, 9); ctx.fill();
  ctx.strokeStyle = '#e1b55c'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#f5f5ed'; ctx.font = '700 30px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 64, 29);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); sprite.scale.set(116, 50, 1);
  return sprite;
}

function matrixAt(pose: MultiLargeActorPose) {
  return new THREE.Matrix4().compose(new THREE.Vector3(pose.x, pose.y, pose.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -pose.angle * Math.PI / 180), new THREE.Vector3(1, 1, 1));
}

export function resolveMultiLargeLifterAnchors(layout: Layout): MultiLargeLifterAnchor[] {
  return (layout.lifters ?? []).map(definition => {
    const lower = layout.nodes.find(node => node.id === definition.landingNodes[0]), upper = layout.nodes.find(node => node.id === definition.landingNodes[1]);
    if (!lower || !upper) throw new Error(`Missing landing node for ${definition.id}.`);
    if (lower.floor === upper.floor || Math.hypot(lower.x - upper.x, lower.y - upper.y) > 1e-6) throw new Error(`${definition.id} does not share an X/Z shaft across floors.`);
    return { id: definition.id, resource: definition.resource, x: lower.x, z: lower.y, lowerFloor: lower.floor, upperFloor: upper.floor, lowerNode: lower.id, upperNode: upper.id };
  });
}

export function deriveMultiLargeFoupOwnership(state: SimulationState): Array<{ requestId: string; owner: 'source' | 'vehicle' | 'stocker' }> {
  const owners = [
    ...state.requests.filter(request => ['pending', 'assigned', 'pickup'].includes(request.phase)).map(request => ({ requestId: request.id, owner: 'source' as const })),
    ...state.vehicles.filter(vehicle => vehicle.loaded && vehicle.request).map(vehicle => ({ requestId: vehicle.request!, owner: 'vehicle' as const })),
    ...state.storedFoups.map(item => ({ requestId: item.requestId, owner: 'stocker' as const })),
  ];
  if (new Set(owners.map(item => item.requestId)).size !== owners.length) throw new Error('A Native FOUP has more than one rendered owner.');
  return owners;
}

export function multiLargeActorVisibleInView(pose: MultiLargeActorPose, vehicleId: string, view: MultiLargeView, followVehicleId?: string, hideUpperForLiftFollow = false): boolean {
  if (hideUpperForLiftFollow && pose.transfer !== undefined && vehicleId === followVehicleId) return true;
  if (hideUpperForLiftFollow) return pose.floor === 0;
  return view === 'stacked' || (view === '1f' && pose.floor === 0) || (view === '2f' && pose.floor === 1);
}

function activeLifterFailure(scenario: Scenario, state: SimulationState, resource: string, layout: Layout) {
  const liftLinks = new Set(layout.links.filter(link => link.kind === 'lifter' && link.resource === resource).map(link => link.id));
  return scenario.failures.some(failure => failure.kind === 'lifter' && (failure.target === resource || liftLinks.has(failure.target)) && failure.start < state.time && failure.start + failure.duration > state.time);
}

export default function MultiLargeFacilityScene(props: MultiLargeFacilitySceneProps) {
  const { layout, scenario, state, running, tickMs, selectedVehicleId, followVehicleId, view, introEnabled = false,
    onSelectVehicle, onFollowChange, onViewChange, onIntroComplete, onDiagnostic } = props;
  const stageRef = useRef<HTMLDivElement>(null), hostRef = useRef<HTMLDivElement>(null), runtimeRef = useRef<Runtime | null>(null);
  const latestRef = useRef({ layout, scenario, state, running, tickMs, selectedVehicleId, followVehicleId, view, onDiagnostic, onViewChange, onIntroComplete, onSelectVehicle, onFollowChange });
  latestRef.current = { layout, scenario, state, running, tickMs, selectedVehicleId, followVehicleId, view, onDiagnostic, onViewChange, onIntroComplete, onSelectVehicle, onFollowChange };
  const stateRef = useRef(state), motionFromRef = useRef(new Map<string, Vehicle>()), tickAtRef = useRef(performance.now());
  const [contextLost, setContextLost] = useState(false), [following, setFollowing] = useState(!!followVehicleId), [fullscreen, setFullscreen] = useState(false), [introVisible, setIntroVisible] = useState(introEnabled);
  const raycasterRef = useRef(new THREE.Raycaster()), pointerRef = useRef(new THREE.Vector2()), manualRef = useRef(false);

  useEffect(() => {
    const previous = stateRef.current;
    if (state.tick !== previous.tick) {
      motionFromRef.current = new Map(previous.vehicles.map(vehicle => [vehicle.id, vehicle]));
      tickAtRef.current = performance.now();
      stateRef.current = state;
    } else stateRef.current = state;
    const runtime = runtimeRef.current;
    if (runtime) { runtime.previousVehicles = motionFromRef.current; runtime.tickAt = tickAtRef.current; }
  }, [state]);

  useEffect(() => {
    setFollowing(!!followVehicleId);
    const runtime = runtimeRef.current;
    if (followVehicleId) { manualRef.current = false; if (runtime) cancelAnimationFrame(runtime.tweenFrame); }
    else if (runtime) runtime.lastFollowFloor = undefined;
  }, [followVehicleId]);

  const runtimeNow = runtimeRef.current;
  if (runtimeNow) { runtimeNow.layout = layout; runtimeNow.running = running; runtimeNow.tickMs = tickMs; runtimeNow.previousVehicles = motionFromRef.current; runtimeNow.tickAt = tickAtRef.current; }

  const changeView = useCallback((next: MultiLargeView, automatic = false) => {
    if (!automatic) manualRef.current = true;
    latestRef.current.onViewChange?.(next, automatic);
  }, []);

  useLayoutEffect(() => {
    const host = hostRef.current; if (!host || layout.id !== 'multi-large' || !layout.lifters?.length) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' }); }
    catch { setContextLost(true); return; }
    const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info') as { UNMASKED_RENDERER_WEBGL: number } | null;
    const gpu = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
    renderer.setPixelRatio(rendererPixelRatio('balanced', window.devicePixelRatio || 1, isSoftwareRendererName(gpu)));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = false; renderer.setClearColor(palette.background);
    renderer.domElement.setAttribute('aria-label', 'Multi Large Native two-floor facility scene'); host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(palette.background);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x839387, 2.0));
    const key = new THREE.DirectionalLight(0xfff5df, 1.7); key.position.set(-4200, 6800, 3600); scene.add(key);
    const camera = new THREE.OrthographicCamera(-500, 500, 500, -500, .1, 30000);
    const worlds: Runtime['worlds'] = [buildFacilityPreviewScene(layout, 0), buildFacilityPreviewScene(layout, 1)];
    worlds[0].root.position.y = 0; translateFacilityPreviewScene(worlds[1], FLOOR_GAP); scene.add(...worlds.map(world => world.root));
    const floorPads = [0, 1].map(floor => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(layout.width, layout.height), new THREE.MeshBasicMaterial({ color: floor ? 0x78a9c8 : 0x87ae94, transparent: true, opacity: .1, side: THREE.DoubleSide }));
      plane.rotation.x = -Math.PI / 2; plane.position.set(layout.width / 2, floor * FLOOR_GAP + 5, layout.height / 2); scene.add(plane); return plane;
    });
    const lifterGroup = new THREE.Group(); lifterGroup.name = 'native-multi-lifters'; scene.add(lifterGroup);
    const anchors = new Map(resolveMultiLargeLifterAnchors(layout).map(anchor => [anchor.resource, anchor]));
    const lifters: LifterVisual[] = layout.lifters.map(definition => {
      const anchor = anchors.get(definition.resource)!;
      const lower = layout.nodes.find(node => node.id === anchor.lowerNode)!, upper = layout.nodes.find(node => node.id === anchor.upperNode)!;
      const shaftMaterial = new THREE.MeshStandardMaterial({ color: palette.shaft, roughness: .3, metalness: .12, transparent: true, opacity: .62, depthWrite: false });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(27, 27, FLOOR_GAP - 114, 16), shaftMaterial);
      shaft.position.set((lower.x + upper.x) / 2, (lower.floor * FLOOR_GAP + upper.floor * FLOOR_GAP) / 2 + 71, (lower.y + upper.y) / 2); shaft.userData.resource = definition.resource; lifterGroup.add(shaft);
      const landingMaterial = new THREE.MeshStandardMaterial({ color: palette.landing, roughness: .42, metalness: .1 });
      const lowerPad = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, MULTI_LARGE_LANDING_MARKER_HEIGHT, 20), landingMaterial); lowerPad.position.set(lower.x, lower.floor * FLOOR_GAP + MULTI_LARGE_LANDING_MARKER_CENTER_Y, lower.y); lifterGroup.add(lowerPad);
      const upperPad = new THREE.Mesh(new THREE.CylinderGeometry(56, 56, MULTI_LARGE_LANDING_MARKER_HEIGHT, 20), landingMaterial.clone()); upperPad.position.set(upper.x, upper.floor * FLOOR_GAP + MULTI_LARGE_LANDING_MARKER_CENTER_Y, upper.y); lifterGroup.add(upperPad);
      const label = labelSprite(definition.id.replace('LIFT-', 'L')); label.position.set(lower.x + 100, lower.floor * FLOOR_GAP + 150, lower.y); lifterGroup.add(label);
      const leaderGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(lower.x, FLOOR_GAP / 2 + 85, lower.y), new THREE.Vector3(lower.x, FLOOR_GAP / 2 + 85, lower.y)]);
      const leader = new THREE.Line(leaderGeometry, new THREE.LineBasicMaterial({ color: 0x8c703b })); leader.userData.lifterLeader = definition.id; lifterGroup.add(leader);
      return { definition, shaft, lower: lowerPad, upper: upperPad, label, leader };
    });
    const assets = createNativeOhtActorAssets(), foupAssets = createNativePortFoupAssets();
    const capacity = Math.min(300, Math.max(1, scenario.fleet));
    const body = new THREE.InstancedMesh(assets.bodyGeometry, assets.bodyMaterial, capacity); body.name = 'native-oht-instances'; body.frustumCulled = false; scene.add(body);
    const carriers = new THREE.InstancedMesh(assets.foupGeometry, assets.foupMaterial, capacity); carriers.name = 'native-loaded-foup-instances'; carriers.frustumCulled = false; scene.add(carriers);
    const statusGeometry = new THREE.OctahedronGeometry(5, 0);
    const status = new THREE.InstancedMesh(statusGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), capacity); status.name = 'native-vehicle-status'; status.frustumCulled = false; scene.add(status);
    const selectionGeometry = new THREE.TorusGeometry(24, 1.5, 8, 32); const selection = new THREE.InstancedMesh(selectionGeometry, new THREE.MeshBasicMaterial({ color: 0x146e5d, toneMapped: false }), 1); selection.name = 'native-selected-oht'; selection.count = 0; scene.add(selection);
    const foupCapacity = Math.max(300, Math.min(14_401, Math.ceil(scenario.duration / Math.max(.5, scenario.demandIntervalSeconds ?? 30)) + 64));
    const sources = new THREE.InstancedMesh(foupAssets.sourceGeometry, foupAssets.sourceMaterial, foupCapacity); sources.name = 'native-source-foups'; sources.frustumCulled = false; scene.add(sources);
    const stored = new THREE.InstancedMesh(foupAssets.storedGeometry, foupAssets.storedMaterial, foupCapacity); stored.name = 'native-stored-foups'; stored.frustumCulled = false; scene.add(stored);
    const routeGeometry = new THREE.BufferGeometry(), route = new THREE.LineSegments(routeGeometry, new THREE.LineBasicMaterial({ color: palette.route, transparent: true, opacity: .9 })); route.name = 'native-selected-route'; route.frustumCulled = false; scene.add(route);
    const cameraTarget = new THREE.Vector3(layout.width / 2, FLOOR_GAP / 2 + 60, layout.height / 2); const worldOffset = new THREE.Vector3(10000, 7000, 10000);
    let runtime!: Runtime;
    const resize = new ResizeObserver(() => {
      const width = host.clientWidth, height = host.clientHeight; if (!width || !height) return;
      renderer.setSize(width, height, false); runtime.view = latestRef.current.view;
      if (latestRef.current.followVehicleId && !manualRef.current) updateVisibility(runtime, runtime.view);
      else runtime.span = fitCameraSpan(runtime, width, height, runtime.view);
      updateCamera(runtime, width, height); draw(runtime);
    });
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    runtime = { renderer, scene, camera, worlds, floorPads: floorPads as unknown as [THREE.Mesh, THREE.Mesh], lifters, actors: { assets, foupAssets, body, carriers, status, selection, sources, stored, statusGeometry }, route, routeGeometry, resize, frame: 0, tweenFrame: 0, statsTimer: 0, manual: false, reducedMotion: reducedMotionQuery.matches, pointers: new Map(), multiTouch: false, lastTick: -1, presentedFrames: 0, diagnosticAt: 0, worldOffset, span: 7000, cameraTarget, selectedTag: host.querySelector<HTMLDivElement>('.ml-native-selected-tag'), disposed: false, layout, view, host, previousVehicles: motionFromRef.current, tickAt: tickAtRef.current, tickMs, running };
    runtimeRef.current = runtime;
    resize.observe(host);
    const lost = (event: Event) => { event.preventDefault(); setContextLost(true); };
    const restored = () => { setContextLost(false); runtime.lastTick = -1; draw(runtime); };
    const onReducedMotionChange = (event: MediaQueryListEvent) => { runtime.reducedMotion = event.matches; };
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);
    renderer.domElement.addEventListener('webglcontextlost', lost); renderer.domElement.addEventListener('webglcontextrestored', restored);
    const width = host.clientWidth || 800, height = host.clientHeight || 600; renderer.setSize(width, height, false); runtime.span = fitCameraSpan(runtime, width, height, view); updateCamera(runtime, width, height); draw(runtime);
    const animate = (now: number) => {
      if (runtime.disposed) return;
      runtime.frame = requestAnimationFrame(animate);
      const propsNow = latestRef.current, currentState = stateRef.current, previous = motionFromRef.current;
      runtime.layout = propsNow.layout; runtime.view = propsNow.view; runtime.running = propsNow.running; runtime.tickMs = propsNow.tickMs; runtime.previousVehicles = motionFromRef.current; runtime.tickAt = tickAtRef.current;
      const fraction = propsNow.running && !runtime.reducedMotion ? Math.min(1, Math.max(0, (now - runtime.tickAt) / Math.max(1, runtime.tickMs))) : 1;
      const followed = propsNow.followVehicleId ? currentState.vehicles.find(vehicle => vehicle.id === propsNow.followVehicleId) : undefined;
      const followedPose = followed && interpolateMultiLargeVehiclePose(propsNow.layout, previous.get(followed.id), followed, fraction);
      const hideUpperForLiftFollow = !manualRef.current && followedPose?.transfer !== undefined;
      const actorView: MultiLargeView = hideUpperForLiftFollow ? '1f' : propsNow.view;
      updateActors(runtime, propsNow.layout, propsNow.scenario, currentState, previous, fraction, actorView, propsNow.selectedVehicleId, propsNow.followVehicleId, hideUpperForLiftFollow);
      updateLifters(runtime, propsNow.layout, propsNow.scenario, currentState, propsNow.view, propsNow.followVehicleId, hideUpperForLiftFollow);
      const routeVehicleId = propsNow.selectedVehicleId ?? propsNow.followVehicleId;
      if (runtime.lastTick !== currentState.tick || runtime.routeVehicleId !== routeVehicleId || runtime.routeView !== actorView) { updateRoute(runtime, propsNow.layout, currentState, routeVehicleId, actorView); runtime.lastTick = currentState.tick; runtime.routeVehicleId = routeVehicleId; runtime.routeView = actorView; }
      if (propsNow.followVehicleId && !manualRef.current) updateFollowCamera(runtime, currentState, propsNow.followVehicleId, propsNow.view, propsNow.onViewChange);
      updateSelectedTag(runtime, currentState, propsNow.selectedVehicleId, fraction, propsNow.view);
      updateLifterLabels(runtime, propsNow.view);
      if (runtime.renderer.info.render.frame === 0 || propsNow.running || now - runtime.diagnosticAt >= 250) draw(runtime);
      if (now - runtime.diagnosticAt >= 500) { runtime.diagnosticAt = now; emitDiagnostic(runtime, propsNow.layout, propsNow.scenario, currentState, propsNow.view, propsNow.followVehicleId, propsNow.onDiagnostic, fraction); }
    };
    runtime.frame = requestAnimationFrame(animate);
    return () => {
      runtime.disposed = true; cancelAnimationFrame(runtime.frame); cancelAnimationFrame(runtime.tweenFrame); clearInterval(runtime.statsTimer); resize.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.domElement.removeEventListener('webglcontextrestored', restored); reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      worlds.forEach(disposeFacilityPreviewScene); scene.remove(...worlds.map(world => world.root));
      disposeNativeOhtActorAssets(assets); disposeNativePortFoupAssets(foupAssets); statusGeometry.dispose(); selectionGeometry.dispose();
      [body, carriers, status, selection, sources, stored].forEach(mesh => { mesh.dispose(); const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; materials.forEach(material => material.dispose()); });
      route.geometry.dispose(); (route.material as THREE.Material).dispose();
      for (const lifter of lifters) { lifter.shaft.geometry.dispose(); (lifter.shaft.material as THREE.Material).dispose(); lifter.lower.geometry.dispose(); (lifter.lower.material as THREE.Material).dispose(); lifter.upper.geometry.dispose(); (lifter.upper.material as THREE.Material).dispose(); lifter.label.material.map?.dispose(); (lifter.label.material as THREE.Material).dispose(); lifter.leader.geometry.dispose(); (lifter.leader.material as THREE.Material).dispose(); }
      floorPads.forEach(plane => { plane.geometry.dispose(); (plane.material as THREE.Material).dispose(); });
      renderer.dispose(); renderer.domElement.remove(); if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
  }, [layout]);

  useEffect(() => {
    const runtime = runtimeRef.current; if (!runtime) return;
    if (followVehicleId && !manualRef.current) { runtime.view = view; updateVisibility(runtime, view); return; }
    const width = hostRef.current?.clientWidth ?? 800, height = hostRef.current?.clientHeight ?? 600;
    const fromTarget = runtime.cameraTarget.clone(), fromOffset = runtime.worldOffset.clone(), fromSpan = runtime.span;
    runtime.view = view; updateVisibility(runtime, view); runtime.span = fitCameraSpan(runtime, width, height, view);
    const toTarget = runtime.cameraTarget.clone(), toOffset = runtime.worldOffset.clone(), toSpan = runtime.span;
    if (fromTarget.distanceToSquared(toTarget) < 1e-6 && Math.abs(fromSpan - toSpan) < 1e-3) { updateCamera(runtime, width, height); draw(runtime); return; }
    cancelAnimationFrame(runtime.tweenFrame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { updateCamera(runtime, width, height); draw(runtime); return; }
    runtime.cameraTarget.copy(fromTarget); runtime.worldOffset.copy(fromOffset); runtime.span = fromSpan; updateCamera(runtime, width, height);
    const start = performance.now(), animate = (now: number) => {
      const raw = Math.min(1, (now - start) / 720), eased = raw * raw * (3 - 2 * raw);
      runtime.cameraTarget.lerpVectors(fromTarget, toTarget, eased); runtime.worldOffset.lerpVectors(fromOffset, toOffset, eased); runtime.span = fromSpan + (toSpan - fromSpan) * eased;
      updateCamera(runtime, width, height); draw(runtime);
      if (raw < 1 && !runtime.disposed) runtime.tweenFrame = requestAnimationFrame(animate);
      else { runtime.cameraTarget.copy(toTarget); runtime.worldOffset.copy(toOffset); runtime.span = toSpan; updateCamera(runtime, width, height); draw(runtime); }
    };
    runtime.tweenFrame = requestAnimationFrame(animate);
  }, [view, layout]);

  useEffect(() => {
    const runtime = runtimeRef.current; if (!runtime || !introEnabled) { setIntroVisible(false); return; }
    let cancelled = false;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 2400 : 4200;
    runtime.introTimer = window.setTimeout(() => {
      if (cancelled || manualRef.current) return;
      setIntroVisible(false); changeView('1f', true); latestRef.current.onIntroComplete?.();
    }, delay);
    return () => { cancelled = true; if (runtime.introTimer) clearTimeout(runtime.introTimer); };
  }, [introEnabled, changeView]);

  useEffect(() => {
    const listener = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', listener); return () => document.removeEventListener('fullscreenchange', listener);
  }, []);

  const stopFollowingForManualInput = () => {
    if (following) { setFollowing(false); latestRef.current.onFollowChange?.(false); }
  };
  const completeIntroForManualInput = () => {
    if (!introVisible) return;
    setIntroVisible(false);
    if (runtimeRef.current?.introTimer) clearTimeout(runtimeRef.current.introTimer);
    latestRef.current.onIntroComplete?.();
  };
  const setManualView = (next: MultiLargeView) => {
    manualRef.current = true; stopFollowingForManualInput(); completeIntroForManualInput();
    if (runtimeRef.current) cancelAnimationFrame(runtimeRef.current.tweenFrame);
    changeView(next);
  };
  const zoom = (factor: number) => { const runtime = runtimeRef.current; if (!runtime) return; manualRef.current = true; stopFollowingForManualInput(); completeIntroForManualInput(); cancelAnimationFrame(runtime.tweenFrame); runtime.span = Math.max(700, Math.min(18_000, runtime.span / factor)); const host = hostRef.current; if (host) updateCamera(runtime, host.clientWidth, host.clientHeight); draw(runtime); };
  const toggleFullscreen = async () => { const stage = stageRef.current; if (!stage) return; if (document.fullscreenElement) await document.exitFullscreen(); else await stage.requestFullscreen(); };
  const toggleFollow = () => { const next = !following; setFollowing(next); manualRef.current = false; if (runtimeRef.current) cancelAnimationFrame(runtimeRef.current.tweenFrame); latestRef.current.onFollowChange?.(next); };

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const runtime = runtimeRef.current; if (!runtime) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    runtime.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (runtime.pointers.size === 1) runtime.dragging = { x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    else {
      runtime.multiTouch = true; runtime.dragging = undefined; manualRef.current = true;
      stopFollowingForManualInput(); completeIntroForManualInput(); cancelAnimationFrame(runtime.tweenFrame);
      const pair = [...runtime.pointers.entries()].slice(0, 2), first = pair[0], second = pair[1];
      if (first && second) runtime.pinch = { ids: [first[0], second[0]], distance: Math.max(1, Math.hypot(first[1].x - second[1].x, first[1].y - second[1].y)), centerX: (first[1].x + second[1].x) / 2, centerY: (first[1].y + second[1].y) / 2, span: runtime.span, target: runtime.cameraTarget.clone() };
    }
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const runtime = runtimeRef.current; if (!runtime) return;
    runtime.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const host = hostRef.current; if (!host) return;
    if (runtime.pinch) {
      const first = runtime.pointers.get(runtime.pinch.ids[0]), second = runtime.pointers.get(runtime.pinch.ids[1]);
      if (!first || !second) return;
      const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)), centerX = (first.x + second.x) / 2, centerY = (first.y + second.y) / 2;
      const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 1), units = runtime.pinch.span / Math.max(1, host.clientHeight);
      runtime.span = Math.max(360, Math.min(18_000, runtime.pinch.span * runtime.pinch.distance / distance));
      runtime.cameraTarget.copy(runtime.pinch.target).addScaledVector(right, -(centerX - runtime.pinch.centerX) * units).addScaledVector(up, (centerY - runtime.pinch.centerY) * units);
      updateCamera(runtime, host.clientWidth, host.clientHeight); draw(runtime); return;
    }
    if (!runtime.dragging || runtime.dragging.pointerId !== event.pointerId) return;
    const dx = event.clientX - runtime.dragging.x, dy = event.clientY - runtime.dragging.y; runtime.dragging = { ...runtime.dragging, x: event.clientX, y: event.clientY, moved: runtime.dragging.moved || Math.abs(dx) + Math.abs(dy) > 3 };
    if (runtime.dragging.moved) { manualRef.current = true; stopFollowingForManualInput(); completeIntroForManualInput(); cancelAnimationFrame(runtime.tweenFrame); }
    const units = runtime.span / Math.max(1, host.clientHeight), right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 1);
    runtime.cameraTarget.addScaledVector(right, -dx * units).addScaledVector(up, dy * units); updateCamera(runtime, host.clientWidth, host.clientHeight); draw(runtime);
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const runtime = runtimeRef.current, host = hostRef.current; if (!runtime || !host) return;
    const wasMultiTouch = runtime.multiTouch, moved = runtime.dragging?.moved;
    runtime.pointers.delete(event.pointerId);
    if (runtime.pinch) {
      const remaining = [...runtime.pointers.entries()];
      if (remaining.length >= 2) {
        const [first, second] = remaining;
        runtime.pinch = { ids: [first[0], second[0]], distance: Math.max(1, Math.hypot(first[1].x - second[1].x, first[1].y - second[1].y)), centerX: (first[1].x + second[1].x) / 2, centerY: (first[1].y + second[1].y) / 2, span: runtime.span, target: runtime.cameraTarget.clone() };
      } else {
        runtime.pinch = undefined;
        runtime.dragging = remaining[0] ? { x: remaining[0][1].x, y: remaining[0][1].y, moved: true, pointerId: remaining[0][0] } : undefined;
      }
    } else runtime.dragging = undefined;
    if (!runtime.pointers.size) runtime.multiTouch = false;
    if (wasMultiTouch || moved) return;
    const rect = host.getBoundingClientRect(); pointerRef.current.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycasterRef.current.setFromCamera(pointerRef.current, runtime.camera);
    const hit = raycasterRef.current.intersectObject(runtime.actors.body, false)[0];
    const id = hit?.instanceId === undefined ? undefined : runtime.actors.body.userData.instanceIds?.[hit.instanceId];
    if (id) { latestRef.current.onSelectVehicle?.(id); manualRef.current = true; stopFollowingForManualInput(); completeIntroForManualInput(); }
  };
  const wheel = (event: React.WheelEvent<HTMLDivElement>) => { event.preventDefault(); zoom(event.deltaY < 0 ? 1.1 : .9); };
  const followedVehicle = followVehicleId && state.vehicles.find(vehicle => vehicle.id === followVehicleId);
  const followedLiftLink = followedVehicle?.link && layout.links.find(link => link.id === followedVehicle.link && link.kind === 'lifter');
  const followedLiftFrom = followedLiftLink && layout.nodes.find(node => node.id === followedLiftLink.from);
  const followedLiftTo = followedLiftLink && layout.nodes.find(node => node.id === followedLiftLink.to);
  const followedLiftId = followedLiftLink && layout.lifters?.find(item => item.resource === followedLiftLink.resource)?.id;

  return <section className="ml-native-scene" ref={stageRef} data-testid="multi-large-native-scene" data-native-tick={state.tick} data-native-time={state.time} data-view={view} data-context-lost={contextLost}>
    <div className="ml-native-toolbar" aria-label="Native 3D camera controls">
      {(['1f', '2f', 'stacked'] as MultiLargeView[]).map(item => <button key={item} type="button" aria-pressed={view === item} onClick={() => setManualView(item)}>{item === 'stacked' ? '전체 보기' : item.toUpperCase()}</button>)}
      <button type="button" aria-pressed={following} disabled={!selectedVehicleId || state.vehicles.find(vehicle => vehicle.id === selectedVehicleId)?.parked} onClick={toggleFollow}>선택 OHT 따라가기</button>
      <button type="button" onClick={() => zoom(1.18)} aria-label="확대">＋</button><button type="button" onClick={() => zoom(.85)} aria-label="축소">−</button>
      <button type="button" onClick={toggleFullscreen}>{fullscreen ? '전체 화면 닫기' : '전체 화면'}</button>
    </div>
    <div ref={hostRef} className="ml-native-canvas" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { const runtime = runtimeRef.current; if (runtime) { runtime.dragging = undefined; runtime.pinch = undefined; runtime.pointers.clear(); runtime.multiTouch = false; } }} onWheel={wheel} onDoubleClick={() => zoom(1)} data-testid="multi-large-native-canvas" aria-label="Multi Large live 3D facility">
      {contextLost && <div className="ml-native-error" role="status">3D graphics context was lost.</div>}
      <div className="ml-native-selected-tag" aria-live="polite" hidden data-testid="multi-native-selected-marker" />
      {introVisible && <div className="ml-native-intro"><b>Two connected floors, one Native fleet.</b><span>Native time is paused while you explore.</span><button type="button" onClick={() => setManualView('1f')}>Skip to 1F</button></div>}
      {following && followedLiftLink && followedLiftFrom && followedLiftTo && followedLiftId && <div role="status" data-testid="multi-native-lift-follow-context" style={{ position: 'absolute', zIndex: 1, top: 12, right: 12, padding: '6px 9px', borderRadius: 4, background: '#1e3027dc', borderRight: '3px solid #e0b45c', color: '#eef6ef', fontSize: 10, letterSpacing: '.04em', pointerEvents: 'none' }}>{followedLiftFrom.floor + 1}F → {followedLiftTo.floor + 1}F · {followedLiftId} lift follow</div>}
      {view !== '2f' && <div className="ml-native-floor-label lower">1F · GROUND</div>}{view !== '1f' && <div className="ml-native-floor-label upper">2F · UPPER</div>}
    </div>
    <div className="ml-native-status" data-testid="multi-large-native-lifters" aria-label="Native lifter status">{layout.lifters?.map(definition => {
      const status = state.multiLifters?.find(item => item.resource === definition.resource);
      const failed = activeLifterFailure(scenario, state, definition.resource, layout);
      const recovered = scenario.failures.some(failure => failure.kind === 'lifter' && (failure.target === definition.resource || layout.links.some(link => link.kind === 'lifter' && link.resource === definition.resource && link.id === failure.target)) && failure.start + failure.duration <= state.time && failure.start + failure.duration > state.time - .5);
      const direction = status?.entryFloor !== undefined && status.exitFloor !== undefined ? `${status.entryFloor + 1}F→${status.exitFloor + 1}F` : '';
      const label = definition.id.replace('LIFT-', 'L');
      const text = failed ? '장애' : recovered ? '복구' : status?.ownerVehicleId ? `이용중 · ${direction} · ${status.phase}` : status?.queuedVehicleIds.length ? `대기 ${status.queuedVehicleIds.length}` : '이용가능';
      return <span key={definition.id} data-resource={definition.resource} data-owner={status?.ownerVehicleId ?? ''} data-phase={status?.phase ?? 'idle'} data-queue={status?.queuedVehicleIds.length ?? 0} data-failed={failed}>{label} · {text}</span>;
    })}</div>
  </section>;
}

function allFitPoints(runtime: Runtime, view: MultiLargeView) {
  const worlds = view === 'stacked' ? runtime.worlds : [runtime.worlds[view === '1f' ? 0 : 1]];
  const points = worlds.flatMap(world => (world.root.userData.fitPoints as THREE.Vector3[]).map(point => point.clone()));
  if (view === 'stacked') for (const lifter of runtime.lifters) {
    points.push(new THREE.Vector3(lifter.shaft.position.x - 60, 70, lifter.shaft.position.z - 60));
    points.push(new THREE.Vector3(lifter.shaft.position.x + 60, FLOOR_GAP + 150, lifter.shaft.position.z + 60));
  }
  return points;
}

function fitCameraSpan(runtime: Runtime, width: number, height: number, view: MultiLargeView) {
  const targetY = view === 'stacked' ? FLOOR_GAP / 2 + 60 : view === '1f' ? 60 : FLOOR_GAP + 60;
  runtime.cameraTarget.set(3200, targetY, 1800); runtime.worldOffset.set(10000, view === 'stacked' ? 7000 : 15100, 10000);
  runtime.camera.position.copy(runtime.cameraTarget).add(runtime.worldOffset); runtime.camera.up.set(0, 1, 0); runtime.camera.lookAt(runtime.cameraTarget); runtime.camera.updateMatrixWorld();
  const points = allFitPoints(runtime, view).map(point => runtime.camera.worldToLocal(point));
  const minX = Math.min(...points.map(point => point.x)), maxX = Math.max(...points.map(point => point.x)), minY = Math.min(...points.map(point => point.y)), maxY = Math.max(...points.map(point => point.y));
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrixWorld, 1);
  runtime.cameraTarget.addScaledVector(right, centerX).addScaledVector(up, centerY);
  runtime.camera.position.copy(runtime.cameraTarget).add(runtime.worldOffset); runtime.camera.lookAt(runtime.cameraTarget); runtime.camera.updateMatrixWorld();
  const aspect = width / Math.max(1, height), extentX = maxX - minX, extentY = maxY - minY;
  return Math.max(extentY, extentX / Math.max(.2, aspect)) * 1.13 || 7000;
}

function latestView(runtime: Runtime): MultiLargeView { return runtime.view; }

function updateCamera(runtime: Runtime, width: number, height: number) {
  const aspect = width / Math.max(1, height), span = runtime.span;
  runtime.worlds.forEach(world => setFacilityPreviewLod(world, span, 1, height));
  runtime.camera.left = -span * aspect / 2; runtime.camera.right = span * aspect / 2; runtime.camera.top = span / 2; runtime.camera.bottom = -span / 2;
  runtime.camera.position.copy(runtime.cameraTarget).add(runtime.worldOffset); runtime.camera.lookAt(runtime.cameraTarget); runtime.camera.near = .1; runtime.camera.far = 30_000; runtime.camera.updateProjectionMatrix(); runtime.camera.updateMatrixWorld();
}

function updateVisibility(runtime: Runtime, view: MultiLargeView, hideUpperForLiftFollow = false) {
  runtime.worlds[0].root.visible = view !== '2f'; runtime.worlds[1].root.visible = view !== '1f' && !hideUpperForLiftFollow;
  runtime.floorPads[0].visible = view !== '2f'; runtime.floorPads[1].visible = view !== '1f' && !hideUpperForLiftFollow;
}

function updateActors(runtime: Runtime, layout: Layout, scenario: Scenario, state: SimulationState, previousVehicles: Map<string, Vehicle>, fraction: number, view: MultiLargeView, selectedId?: string, followId?: string, hideUpperForLiftFollow = false) {
  const { body, carriers, status, selection, sources, stored } = runtime.actors, visibleIds: string[] = [], statusCount = { value: 0 }, carrierOwners: Array<{ requestId: string; owner: 'vehicle'; vehicleId: string }> = [], sourceOwners: Array<{ requestId: string; owner: 'source'; portId: string }> = [], storedOwners: Array<{ requestId: string; owner: 'stocker'; portId: string }> = [];
  const ports = new Map(layout.ports.map(port => [port.id, port])), equipment = new Map((layout.facility?.equipment ?? []).map(item => [item.portId, item]));
  const available = state.vehicles.slice(0, body.instanceMatrix.count);
  let carrierCount = 0;
  for (let i = 0; i < available.length; i++) {
    const vehicle = available[i], pose = interpolateMultiLargeVehiclePose(layout, previousVehicles.get(vehicle.id), vehicle, fraction);
    if (!pose) continue;
    const show = multiLargeActorVisibleInView(pose, vehicle.id, view, followId, hideUpperForLiftFollow);
    if (!show || vehicle.parked) continue;
    const matrix = matrixAt(pose); body.setMatrixAt(visibleIds.length, matrix); body.setColorAt(visibleIds.length, new THREE.Color(vehicle.failed ? 0xd46a5d : vehicle.id === selectedId || vehicle.id === followId ? 0xb8e0c6 : 0xffffff));
    visibleIds.push(vehicle.id);
    if (vehicle.loaded && vehicle.request) {
      carriers.setMatrixAt(carrierCount++, matrix);
      carrierOwners.push({ requestId: vehicle.request, owner: 'vehicle', vehicleId: vehicle.id });
    }
    if (vehicle.failed || vehicle.waiting > 0) {
      const badge = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, 24, 0)); status.setMatrixAt(statusCount.value, badge); status.setColorAt(statusCount.value, new THREE.Color(vehicle.failed ? palette.failed : palette.queued)); statusCount.value++;
    }
    if (vehicle.id === selectedId || vehicle.id === followId) selection.setMatrixAt(0, matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, -15, 0)));
  }
  body.count = visibleIds.length; body.instanceMatrix.needsUpdate = true; body.instanceColor && (body.instanceColor.needsUpdate = true); body.userData.instanceIds = visibleIds;
  carriers.count = carrierCount; carriers.instanceMatrix.needsUpdate = true;
  status.count = statusCount.value; status.instanceMatrix.needsUpdate = true; status.instanceColor && (status.instanceColor.needsUpdate = true);
  const selectedIndex = selectedId || followId ? visibleIds.indexOf(followId ?? selectedId!) : -1;
  selection.count = selectedIndex >= 0 ? 1 : 0;
  if (selectedIndex >= 0) {
    const selectedMatrix = new THREE.Matrix4(); body.getMatrixAt(selectedIndex, selectedMatrix);
    selectedMatrix.multiply(new THREE.Matrix4().makeTranslation(0, -15, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    selection.setMatrixAt(0, selectedMatrix);
  }
  selection.instanceMatrix.needsUpdate = true;
  const sourceSlots = new Map<string, number>(); let sourceCount = 0;
  for (const owner of deriveMultiLargeFoupOwnership(state).filter(item => item.owner === 'source')) {
    const request = state.requests.find(item => item.id === owner.requestId)!;
    const port = ports.get(request.source), node = port && layout.nodes.find(value => value.id === port.node); if (!port || !node || view !== 'stacked' && node.floor !== (view === '1f' ? 0 : 1)) continue;
    const item = equipment.get(port.id), slot = sourceSlots.get(port.id) ?? 0; sourceSlots.set(port.id, slot + 1);
    const x = item?.dock.x ?? node.x, z = item?.dock.y ?? node.y;
    const token = new THREE.Matrix4().makeTranslation(x + slot % 4 * 18, node.floor * FLOOR_GAP, z + Math.floor(slot / 4) * 18);
    sources.setMatrixAt(sourceCount++, token);
    sourceOwners.push({ requestId: request.id, owner: 'source', portId: port.id });
  }
  sources.count = sourceCount; sources.instanceMatrix.needsUpdate = true;
  let storedCount = 0; const storedSlots = new Map<string, number>();
  for (const item of state.storedFoups.slice(0, stored.instanceMatrix.count)) {
    const port = ports.get(item.portId), node = port && layout.nodes.find(value => value.id === port.node); if (!node) continue;
    if (view !== 'stacked' && node.floor !== (view === '1f' ? 0 : 1)) continue;
    const equipmentItem = equipment.get(port.id), x = equipmentItem?.dock.x ?? node.x, z = equipmentItem?.dock.y ?? node.y;
    const slot = storedSlots.get(item.portId) ?? 0; storedSlots.set(item.portId, slot + 1);
    stored.setMatrixAt(storedCount++, new THREE.Matrix4().makeTranslation(x + (slot % 4) * 18, node.floor * FLOOR_GAP, z + Math.floor(slot / 4) * 18));
    storedOwners.push({ requestId: item.requestId, owner: 'stocker', portId: item.portId });
  }
  stored.count = storedCount; stored.instanceMatrix.needsUpdate = true;
  carriers.userData.foupOwners = carrierOwners; sources.userData.foupOwners = sourceOwners; stored.userData.foupOwners = storedOwners;
}

function updateLifters(runtime: Runtime, layout: Layout, scenario: Scenario, state: SimulationState, view: MultiLargeView, followVehicleId?: string, hideUpperForLiftFollow = false) {
  const statuses = new Map((state.multiLifters ?? []).map(item => [item.resource, item]));
  for (const visual of runtime.lifters) {
    const item = statuses.get(visual.definition.resource), failed = activeLifterFailure(scenario, state, visual.definition.resource, layout);
    const material = visual.shaft.material as THREE.MeshStandardMaterial;
    material.color.set(failed ? palette.failed : item?.ownerVehicleId ? palette.owner : item?.queuedVehicleIds.length ? palette.queued : palette.shaft);
    material.opacity = item?.phase === 'transfer' && item.ownerVehicleId === followVehicleId ? .08 : .62;
    visual.shaft.visible = view === 'stacked' || hideUpperForLiftFollow;
    visual.lower.visible = view !== '2f'; visual.upper.visible = view !== '1f' && !hideUpperForLiftFollow;
    visual.label.visible = view === 'stacked' || visual.lower.visible || visual.upper.visible;
    visual.label.userData.status = `${visual.definition.id} ${failed ? 'failed' : item?.phase ?? 'idle'} ${item?.queuedVehicleIds.length ?? 0}`;
  }
  updateVisibility(runtime, view, hideUpperForLiftFollow);
}

function updateLifterLabels(runtime: Runtime, view: MultiLargeView) {
  const { camera, host } = runtime; camera.updateMatrixWorld();
  const baseY = view === 'stacked' ? FLOOR_GAP / 2 + 88 : view === '1f' ? 148 : FLOOR_GAP + 148;
  const callouts = runtime.lifters.map(visual => {
    const point = new THREE.Vector3(visual.shaft.position.x, baseY, visual.shaft.position.z);
    const screenX = point.clone().project(camera).x;
    return { visual, point, screenX };
  }).sort((a, b) => a.screenX - b.screenX);
  const spacing = 58 * 2 / Math.max(1, host.clientWidth), adjusted = callouts.map(item => item.screenX);
  for (let index = 1; index < adjusted.length; index++) adjusted[index] = Math.max(adjusted[index], adjusted[index - 1] + spacing);
  const shift = adjusted.reduce((sum, value) => sum + value, 0) / Math.max(1, adjusted.length) - callouts.reduce((sum, item) => sum + item.screenX, 0) / Math.max(1, callouts.length);
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), pixelsPerUnit = (camera.top - camera.bottom) / Math.max(1, host.clientHeight);
  const tag = runtime.selectedTag, tagCenterX = tag && !tag.hidden ? Number.parseFloat(tag.style.left) : Number.NaN, tagBottomY = tag && !tag.hidden ? Number.parseFloat(tag.style.top) : Number.NaN;
  const tagHalfWidth = tag && !tag.hidden ? Math.max(34, tag.getBoundingClientRect().width / 2) + 8 : 0;
  const tagHeight = tag && !tag.hidden ? Math.max(20, tag.getBoundingClientRect().height) + 8 : 0;
  callouts.forEach((item, index) => {
    let offset = (adjusted[index] - shift - item.screenX) * (camera.right - camera.left) / 2 + 74 * pixelsPerUnit;
    const anchor = item.point.clone();
    if (view === '1f') anchor.y = 148;
    else if (view === '2f') anchor.y = FLOOR_GAP + 148;
    let labelPosition = anchor.clone().addScaledVector(right, offset);
    let screen = labelPosition.clone().project(camera);
    let screenX = (screen.x + 1) * host.clientWidth / 2, screenY = (1 - screen.y) * host.clientHeight / 2;
    const overlapsTag = Number.isFinite(tagCenterX) && Number.isFinite(tagBottomY) && screenX + 28 > tagCenterX - tagHalfWidth && screenX - 28 < tagCenterX + tagHalfWidth && screenY + 14 > tagBottomY - tagHeight && screenY - 14 < tagBottomY + 8;
    if (overlapsTag) {
      const direction = screenX < tagCenterX ? -1 : 1;
      const correction = 28 + tagHalfWidth + 10 - Math.abs(screenX - tagCenterX);
      offset += direction * Math.max(0, correction) * pixelsPerUnit;
      labelPosition = anchor.clone().addScaledVector(right, offset); screen = labelPosition.clone().project(camera);
      screenX = (screen.x + 1) * host.clientWidth / 2; screenY = (1 - screen.y) * host.clientHeight / 2;
    }
    const stillOverlapsTag = Number.isFinite(tagCenterX) && Number.isFinite(tagBottomY) && screenX + 28 > tagCenterX - tagHalfWidth && screenX - 28 < tagCenterX + tagHalfWidth && screenY + 14 > tagBottomY - tagHeight && screenY - 14 < tagBottomY + 8;
    item.visual.label.visible = !stillOverlapsTag; item.visual.leader.visible = !stillOverlapsTag;
    item.visual.label.position.copy(labelPosition);
    item.visual.label.scale.set(56 * pixelsPerUnit, 28 * pixelsPerUnit, 1);
    const positions = item.visual.leader.geometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setXYZ(0, anchor.x, anchor.y, anchor.z); positions.setXYZ(1, labelPosition.x, labelPosition.y, labelPosition.z); positions.needsUpdate = true;
    item.visual.leader.geometry.computeBoundingSphere();
  });
}

export type MultiLargeRouteSegment = { linkId: string; kind: 'rail' | 'lifter'; from: THREE.Vector3; to: THREE.Vector3 };

export function buildMultiLargeRouteSegments(layout: Layout, state: SimulationState, vehicleId: string | undefined, view: MultiLargeView): MultiLargeRouteSegment[] {
  const vehicle = state.vehicles.find(item => item.id === vehicleId), segments: MultiLargeRouteSegment[] = [];
  if (vehicle) {
    const nodes = [vehicle.node, ...vehicle.route];
    for (let index = 0; index < nodes.length - 1; index++) {
      const link = layout.links.find(edge => edge.from === nodes[index] && edge.to === nodes[index + 1]); if (!link) continue;
      const fromFloor = layout.nodes.find(node => node.id === link.from)?.floor ?? 0, toFloor = layout.nodes.find(node => node.id === link.to)?.floor ?? fromFloor;
      if (view !== 'stacked' && (link.kind === 'lifter' || fromFloor !== (view === '1f' ? 0 : 1) || toFloor !== fromFloor)) continue;
      if (link.kind === 'lifter') {
        const from = layout.nodes.find(node => node.id === link.from)!, to = layout.nodes.find(node => node.id === link.to)!;
        segments.push({ linkId: link.id, kind: 'lifter', from: new THREE.Vector3(from.x, from.floor * FLOOR_GAP + ACTOR_HEIGHT, from.y), to: new THREE.Vector3(to.x, to.floor * FLOOR_GAP + ACTOR_HEIGHT, to.y) });
      } else {
        const floor = layout.nodes.find(node => node.id === link.from)?.floor ?? 0;
        const base = floor * FLOOR_GAP + 74;
        const path = pathForLink(layout, link);
        for (let point = 1; point < path.length; point++) segments.push({ linkId: link.id, kind: 'rail', from: new THREE.Vector3(path[point - 1].x, base, path[point - 1].y), to: new THREE.Vector3(path[point].x, base, path[point].y) });
      }
    }
  }
  return segments;
}

function updateRoute(runtime: Runtime, layout: Layout, state: SimulationState, vehicleId: string | undefined, view: MultiLargeView) {
  const points = buildMultiLargeRouteSegments(layout, state, vehicleId, view).flatMap(segment => [segment.from, segment.to]);
  runtime.routeGeometry.dispose(); runtime.routeGeometry = new THREE.BufferGeometry().setFromPoints(points); runtime.route.geometry = runtime.routeGeometry; runtime.route.visible = points.length > 0;
}

function updateSelectedTag(runtime: Runtime, state: SimulationState, selectedId: string | undefined, fraction: number, view: MultiLargeView) {
  const tag = runtime.selectedTag; if (!tag) return;
  const vehicle = state.vehicles.find(item => item.id === selectedId && !item.parked);
  const pose = vehicle && interpolateMultiLargeVehiclePose(runtime.layout, runtime.previousVehicles.get(vehicle.id), vehicle, fraction);
  if (!vehicle || !pose || (view === '1f' && pose.floor !== 0) || (view === '2f' && pose.floor !== 1)) { tag.hidden = true; return; }
  const screen = new THREE.Vector3(pose.x, pose.y + 60, pose.z).project(runtime.camera);
  if (screen.z < -1 || screen.z > 1) { tag.hidden = true; return; }
  tag.hidden = false; tag.textContent = vehicle.id;
  tag.style.left = `${(screen.x + 1) * runtime.host.clientWidth / 2}px`;
  tag.style.top = `${(1 - screen.y) * runtime.host.clientHeight / 2}px`;
}

function updateFollowCamera(runtime: Runtime, state: SimulationState, vehicleId: string, view: MultiLargeView, onViewChange?: (view: MultiLargeView, automatic?: boolean) => void) {
  const vehicle = state.vehicles.find(item => item.id === vehicleId && !item.parked), pose = vehicle && interpolateMultiLargeVehiclePose(runtime.layout, runtime.previousVehicles.get(vehicleId), vehicle, runtime.running && !runtime.reducedMotion ? Math.min(1, (performance.now() - runtime.tickAt) / Math.max(1, runtime.tickMs)) : 1);
  if (!vehicle || !pose) return;
  const targetFloor = pose.transfer !== undefined ? undefined : pose.floor;
  if (pose.transfer !== undefined) {
    runtime.lastFollowFloor = pose.transferToFloor;
    if (view !== 'stacked') onViewChange?.('stacked', true);
  } else {
    const targetView: MultiLargeView = targetFloor === 0 ? '1f' : '2f';
    if (runtime.lastFollowFloor !== undefined && targetFloor === runtime.lastFollowFloor) { onViewChange?.(targetView, true); runtime.lastFollowFloor = undefined; }
    else if (view !== targetView) onViewChange?.(targetView, true);
  }
  runtime.cameraTarget.set(pose.x, pose.y, pose.z);
  const desiredSpan = Math.max(360, Math.min(1100, runtime.host.clientHeight * 1.4));
  const desiredOffset = new THREE.Vector3(1800, 2900, 2100);
  if (runtime.reducedMotion) { runtime.span = desiredSpan; runtime.worldOffset.copy(desiredOffset); }
  else { runtime.span += (desiredSpan - runtime.span) * .11; runtime.worldOffset.lerp(desiredOffset, .11); }
  updateCamera(runtime, runtime.host.clientWidth, runtime.host.clientHeight);
}

function draw(runtime: Runtime) { if (!runtime.disposed) { runtime.renderer.render(runtime.scene, runtime.camera); runtime.presentedFrames++; } }

function emitDiagnostic(runtime: Runtime, layout: Layout, scenario: Scenario, state: SimulationState, view: MultiLargeView, followVehicleId: string | undefined, callback: ((diagnostic: MultiLargeSceneDiagnostic) => void) | undefined, fraction: number) {
  const vehicles: MultiLargeActorPose[] = [];
  const vehicleById = new Map(state.vehicles.map(vehicle => [vehicle.id, vehicle]));
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(), euler = new THREE.Euler();
  for (let index = 0; index < runtime.actors.body.count; index++) {
    const id = runtime.actors.body.userData.instanceIds?.[index], vehicle = id && vehicleById.get(id); if (!id || !vehicle) continue;
    const confirmed = interpolateMultiLargeVehiclePose(layout, runtime.previousVehicles.get(id), vehicle, fraction); if (!confirmed) continue;
    runtime.actors.body.getMatrixAt(index, matrix); matrix.decompose(position, quaternion, scale); euler.setFromQuaternion(quaternion, 'YXZ');
    const angle = ((-euler.y * 180 / Math.PI) % 360 + 360) % 360;
    vehicles.push({ ...confirmed, x: position.x, y: position.y, z: position.z, angle });
  }
  const lifters = layout.lifters!.map(definition => {
    const item = state.multiLifters?.find(value => value.resource === definition.resource);
    return { id: definition.id, resource: definition.resource, ownerVehicleId: item?.ownerVehicleId, phase: item?.phase, queueLength: item?.queuedVehicleIds.length ?? 0, failed: activeLifterFailure(scenario, state, definition.resource, layout), entryFloor: item?.entryFloor, exitFloor: item?.exitFloor };
  });
  const foupOwnership: MultiLargeSceneDiagnostic['foupOwnership'] = [];
  const readTokens = (mesh: THREE.InstancedMesh, owner: 'source' | 'vehicle' | 'stocker') => {
    const entries = mesh.userData.foupOwners as Array<{ requestId: string; owner: 'source' | 'vehicle' | 'stocker'; portId?: string; vehicleId?: string }> | undefined;
    for (let index = 0; index < mesh.count; index++) {
      const entry = entries?.[index]; if (!entry) continue;
      mesh.getMatrixAt(index, matrix); matrix.decompose(position, quaternion, scale);
      foupOwnership.push({ ...entry, owner, x: position.x, y: position.y, z: position.z });
    }
  };
  readTokens(runtime.actors.sources, 'source'); readTokens(runtime.actors.carriers, 'vehicle'); readTokens(runtime.actors.stored, 'stocker');
  const diagnostic: MultiLargeSceneDiagnostic = { nativeTick: state.tick, nativeTime: state.time, view, followVehicleId,
    camera: { target: runtime.cameraTarget.toArray(), span: runtime.span, position: runtime.camera.position.toArray() },
    active: state.vehicles.filter(vehicle => !vehicle.parked).length, presented: runtime.actors.body.count, presentedFrames: runtime.presentedFrames, drawCalls: runtime.renderer.info.render.calls, geometries: runtime.renderer.info.memory.geometries, textures: runtime.renderer.info.memory.textures, vehicles, lifters, foupOwnership };
  runtime.host.dataset.native3dDiagnostic = JSON.stringify(diagnostic);
  callback?.(diagnostic);
}
