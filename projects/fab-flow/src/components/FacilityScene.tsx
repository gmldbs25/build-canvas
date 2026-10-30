'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisReport } from '@/sim/analysisTypes';
import { railAnalysisVisual } from '@/components/railAnalysisVisual';
import type { Failure, Layout, SimulationState, Vehicle } from '@/sim/types';
import type { CSSProperties } from 'react';
import type { TutorialStage } from '@/sim/tutorial';
import { pathForLink, pathLength, pointAlongPath, vehiclePosition } from '@/sim/geometry';
import { confirmedMotion } from '@/sim/motion';
import FacilityAsset from '@/components/FacilityAssets';
import { facilityPortIndicators } from '@/components/facilityPortIndicators';
import { cameraLod, clampFrame, fitCamera, followFrame, interpolateFrame, resizeCameraFrame, welcomeCameraFrame, type CameraCommand, type CameraFrame, type CameraLod } from '@/components/fabCamera';

type Props = {
  layout: Layout;
  state: SimulationState;
  floor: number;
  failures: Failure[];
  storageCapacity: number;
  tickMs: number;
  running: boolean;
  selected?: string;
  trackedVehicle?: string;
  trackedRequest?: string;
  plannedTutorialIngress?: { source: string; destination: string };
  tutorialStage?: TutorialStage;
  analysis?: AnalysisReport; analysisMode?: 'current' | 'recent';
  heatmap: boolean;
  view?: 'overview' | 'network' | 'traffic';
  cameraCommand?: CameraCommand;
  onFollowChange?: (following: boolean) => void;
  focusNodes?: string[];
  routeCandidates?: { nodes: string[]; links: string[]; distance: number; cost: number; selected: boolean }[];
  onSelect: (kind: 'vehicle' | 'port' | 'rail', id: string) => void;
  onFloorChange: (floor: number) => void;
};

type Camera = CameraFrame;
const LIGHT = {
  rail: '#778481', railEdge: '#4f5a58', railFace: '#e1e5e2', railHighlight: '#ffffff',
  idle: '#50aeb2', loaded: '#d8a042', fail: '#bc5a52', text: '#4f5a57', muted: '#74817d',
};

function pathD(points: readonly { x: number; y: number }[]) {
  return points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
}

function trackedLabelLeft(worldX: number, frame: CameraFrame, screenUnit: number) {
  const left = worldX - frame.x, right = frame.x + frame.w - worldX;
  return right < screenUnit * 150 && left > right;
}

function getLinkColor(linkId: string, count: number, capacity: number, heatmap: boolean, failed: boolean) {
  if (failed) return LIGHT.fail;
  if (!heatmap) return LIGHT.rail;
  if (count >= capacity) return '#cc8440';
  if (count > 0) return '#559b91';
  return '#80908c';
}

function supportPositions(path: readonly { x: number; y: number }[], occupied: readonly { x: number; y: number }[]) {
  const length = pathLength(path);
  if (length < 100) return [];
  const positions: { x: number; y: number; angle: number }[] = [];
  for (let distance = 80; distance < length - 40; distance += 142) {
    const p = pointAlongPath(path, distance / length);
    if (occupied.some(dock => Math.hypot(dock.x - p.x, dock.y - p.y) < 30)) continue;
    positions.push(p);
  }
  return positions;
}

function TransportMark({ vehicle, position, tracked, hovered, screenUnit, cameraFrame }: { vehicle: Vehicle; position: { x: number; y: number; angle: number }; tracked: boolean; hovered: boolean; screenUnit: number; cameraFrame: CameraFrame }) {
  const body = vehicle.failed ? LIGHT.fail : vehicle.loaded ? LIGHT.loaded : LIGHT.idle;
  const servicing = vehicle.phase === 'pickup' || vehicle.phase === 'dropoff';
  const remaining = Math.max(0, Math.min(1, vehicle.serviceRemaining / 1.5));
  const hoistY = vehicle.phase === 'pickup' ? 8 + remaining * 16 : vehicle.phase === 'dropoff' ? 8 + (1 - remaining) * 16 : 8;
  const labelLeft = trackedLabelLeft(position.x, cameraFrame, screenUnit);
  const backingX = screenUnit * (labelLeft ? -142 : 26), labelX = screenUnit * (labelLeft ? -136 : 32);
  return <g transform={`translate(${position.x.toFixed(4)} ${position.y.toFixed(4)})`} className={`facility-vehicle${tracked ? ' tracked' : ''}${vehicle.failed ? ' failed' : ''}`}>
    <circle className="traffic-locator" r="1" fill={body} stroke={body} strokeWidth="4" vectorEffect="non-scaling-stroke" aria-hidden="true" />
    <path className="traffic-direction" transform={`rotate(${position.angle.toFixed(4)})`} d="M-5 -4L4 0-5 4M4 0H-2" fill="none" stroke={body} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" aria-hidden="true" />
    {tracked && <g className="selected-vehicle-cue" aria-label={`${vehicle.id}, ${vehicle.loaded ? 'FOUP 적재' : '빈 차량'}, 현재 요청 소유 차량`}><ellipse className="vehicle-track-ring" rx={screenUnit * 23} ry={screenUnit * 16} fill="#f4fffb" fillOpacity=".28" stroke="#07574d" strokeWidth="3" vectorEffect="non-scaling-stroke"/><rect className="tracked-label-backing" x={backingX} y={-screenUnit * 16} width={screenUnit * 116} height={screenUnit * 21} rx={screenUnit * 4} fill="#074e45" stroke="#f4fffb" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/><text className="tracked-label" x={labelX} y={-screenUnit * 2} style={{ fontSize: screenUnit * 12 }}>{vehicle.id} · {vehicle.phase === 'pickup' ? '픽업' : vehicle.phase === 'dropoff' ? '하역' : vehicle.loaded ? '적재' : '빈차'}</text></g>}
    <g className="vehicle-chassis" transform={`rotate(${position.angle.toFixed(4)})`}>
      <rect x="-13" y="-7" width="26" height="14" rx="4" fill={vehicle.failed ? '#dcaba2' : '#f6f8ef'} stroke="#5b7166" strokeWidth="1.1" />
      <path d="M-9-3H9M-6 0H6" stroke="#9cac9f" strokeWidth="1" />
      <rect x="-10" y="3" width="20" height="3" rx="1" fill={body} />
      <circle cx="-8" cy="-6" r="1.5" fill="#798b7c"/><circle cx="8" cy="-6" r="1.5" fill="#798b7c"/>
    </g>
    {(vehicle.loaded || vehicle.phase === 'pickup') && <g className="facility-carried-foup" data-service={vehicle.phase}>
      {tracked && <rect className="foup-focus-outline" x="-12" y={hoistY - 4} width="24" height="21" rx="4" fill="#fff8dd" fillOpacity=".16" stroke="#9b570c" strokeWidth="2" vectorEffect="non-scaling-stroke"/>}
      <path d={`M-4 4V${hoistY}M4 4V${hoistY}`} stroke="#62776a" strokeWidth="1.05" />
      <g transform={`translate(0 ${hoistY})`}><path d="M-7 0H7L9 2V13H-9V2Z" fill="#e8b452" stroke="#946d30" strokeWidth="1"/><path d="M-4 2H4V9H-4ZM-4 0V-3H4V0" fill="#f5d18e" stroke="#9d7639" strokeWidth=".65" /></g>
    </g>}
    {servicing && <text x="15" y="24" className="facility-service-label">{vehicle.phase === 'pickup' ? 'FOUP 픽업' : 'FOUP 하역'}</text>}
    {vehicle.failed && <path d="M-4-13L4-21M4-13L-4-21" stroke="#c65043" strokeWidth="2"/>}
    {hovered && !tracked && <text x="15" y="-10" className="facility-vehicle-label">{vehicle.id}{vehicle.failed ? ' · FAILED' : vehicle.waiting > 0 ? ' · WAIT' : ''}</text>}
    {tracked && <g className="tracked-direction-screen" pointerEvents="none"><path className="tracked-direction-chevron-backing" d="M-7 -6L6 0-7 6M6 0H-2" transform={`rotate(${position.angle.toFixed(4)}) scale(${screenUnit})`} fill="none" stroke="#f4fffb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/><path className="tracked-direction-chevron" data-heading={position.angle} d="M-7 -6L6 0-7 6M6 0H-2" transform={`rotate(${position.angle.toFixed(4)}) scale(${screenUnit})`} fill="none" stroke="#064d45" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></g>}
  </g>;
}

type VehiclesProps = Pick<Props, 'layout' | 'state' | 'floor' | 'running' | 'tickMs' | 'trackedVehicle' | 'trackedRequest' | 'selected' | 'onSelect'> & { screenUnit: number; cameraFrame: CameraFrame; hovered: string | null; setHovered: React.Dispatch<React.SetStateAction<string | null>>; onTrackedPose: (position: { x: number; y: number; floor: number; vehicleId: string }) => void };

function VehicleLayer({ layout, state, floor, running, tickMs, trackedVehicle, trackedRequest, selected, onSelect, screenUnit, cameraFrame, hovered, setHovered, onTrackedPose }: VehiclesProps) {
  const layer = useRef<SVGGElement>(null);
  const prior = useRef<{ layout: Layout; state: SimulationState } | null>(null);
  useLayoutEffect(() => {
    const before = prior.current; prior.current = { layout, state };
    const previous = before?.layout === layout && state.tick === before.state.tick + 1 ? new Map(before.state.vehicles.map(v => [v.id, v])) : new Map<string, Vehicle>();
    const animations = state.vehicles.flatMap(vehicle => {
      const pos = vehiclePosition(layout, vehicle);
      if (pos && !vehicle.parked && vehicle.id === trackedVehicle && pos.floor !== floor) onTrackedPose({ ...pos, vehicleId: vehicle.id });
      if (vehicle.parked || !pos || pos.floor !== floor) return [];
      const mark = layer.current?.querySelector<SVGGElement>(`[data-oht-id="${vehicle.id}"] .facility-vehicle`);
      const chassis = mark?.querySelector<SVGGElement>('.vehicle-chassis');
      if (!mark || !chassis) return [];
      const from = previous.get(vehicle.id), motion = confirmedMotion(layout, from, vehicle), start = motion(0);
      const moving = Math.hypot(start.x - pos.x, start.y - pos.y) > .000001;
      const direction = mark.querySelector<SVGPathElement>('.traffic-direction');
      const trackingRing = mark.querySelector<SVGEllipseElement>('.vehicle-track-ring');
      const trackingLabel = mark.querySelector<SVGTextElement>('.tracked-label');
      const trackedChevron = mark.querySelector<SVGPathElement>('.tracked-direction-chevron');
      const trackedChevronBacking = mark.querySelector<SVGPathElement>('.tracked-direction-chevron-backing');
      const labelBacking = mark.querySelector<SVGRectElement>('.tracked-label-backing');
      return [{ mark, chassis, direction, trackingRing, trackingLabel, trackedChevron, trackedChevronBacking, labelBacking, motion, moving, vehicleId: vehicle.id }];
    });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const apply = (fraction: number, settleStationary = false) => { const svg = layer.current?.ownerSVGElement; const view = svg?.viewBox.baseVal; const currentFrame = view ? { x: view.x, y: view.y, w: view.width, h: view.height } : cameraFrame; const currentUnit = currentFrame.w / Math.max(1, svg?.clientWidth ?? currentFrame.w / screenUnit); for (const animation of animations) { if (!animation.moving && fraction < 1 && !settleStationary) continue; const pos = animation.motion(fraction); animation.mark.setAttribute('transform', `translate(${pos.x} ${pos.y})`); animation.chassis.setAttribute('transform', `rotate(${pos.angle})`); animation.direction?.setAttribute('transform', `rotate(${pos.angle})`); animation.trackedChevron?.setAttribute('data-heading', String(pos.angle)); animation.trackedChevron?.setAttribute('transform', `rotate(${pos.angle}) scale(${currentUnit})`); animation.trackedChevronBacking?.setAttribute('transform', `rotate(${pos.angle}) scale(${currentUnit})`); if (animation.vehicleId === trackedVehicle) { const labelLeft = trackedLabelLeft(pos.x, currentFrame, currentUnit); animation.trackingLabel?.setAttribute('x', String(currentUnit * (labelLeft ? -136 : 32))); animation.labelBacking?.setAttribute('x', String(currentUnit * (labelLeft ? -142 : 26))); onTrackedPose({ ...pos, vehicleId: animation.vehicleId }); } } };
    if (!running || reduced || !animations.some(a => a.moving)) { apply(1); return; }
    // A canceled RAF may leave a partial DOM pose while React already remembers
    // the confirmed endpoint. Settle stationary actors before the next animation.
    apply(0, true); const startTime = performance.now(); let frame = 0;
    const animate = (now: number) => { const fraction = Math.min(1, (now - startTime) / tickMs); apply(fraction); if (fraction < 1) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [layout, state, floor, running, tickMs, trackedVehicle, onTrackedPose]);
  const trackedTransport = trackedRequest ? state.requests.find(request => request.id === trackedRequest && request.phase !== 'completed') : undefined;
  const reciprocalOwner = trackedTransport?.vehicle ? state.vehicles.find(candidate => candidate.id === trackedTransport.vehicle && candidate.request === trackedTransport.id && !candidate.parked) : undefined;
  return <g ref={layer} className="facility-vehicles">{state.vehicles.map(vehicle => {
    const position = vehiclePosition(layout, vehicle); if (vehicle.parked || !position || position.floor !== floor) return null;
    const isTracked = trackedRequest ? reciprocalOwner?.id === vehicle.id : trackedVehicle === vehicle.id;
    const selectedVehicle = selected === `vehicle:${vehicle.id}` && (!trackedRequest || isTracked);
    return <g key={vehicle.id} data-oht-id={vehicle.id} data-phase={vehicle.phase} data-link={vehicle.link} data-loaded={vehicle.loaded} data-selectable="true" role="button" tabIndex={0} aria-label={`${vehicle.id}, ${vehicle.phase}${vehicle.loaded ? ', carrying FOUP' : ''}${vehicle.failed ? ', failed' : ''}`} className={`vehicle-mark facility-vehicle-pick${selectedVehicle ? ' selected' : ''}`} onClick={() => onSelect('vehicle', vehicle.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect('vehicle', vehicle.id); } }} onPointerEnter={() => setHovered(vehicle.id)} onPointerLeave={() => setHovered(current => current === vehicle.id ? null : current)}>
      {position.transfer !== undefined && <g className="facility-transfer-meter"><circle cx={position.x} cy={position.y} r="15" fill="#fff" stroke="#7f8986" strokeWidth="1.4"/><text x={position.x + 19} y={position.y + 64} className="facility-service-label">TRANSFER {Math.round(position.transfer * 100)}%</text></g>}
      <TransportMark vehicle={vehicle} position={position} tracked={isTracked || (selectedVehicle && !trackedRequest)} hovered={hovered === vehicle.id || (selectedVehicle && !trackedRequest)} screenUnit={screenUnit} cameraFrame={cameraFrame} />
    </g>;
  })}</g>;
}

export default function FacilityScene({ layout, state, floor, failures, storageCapacity, tickMs, running, selected, trackedVehicle, trackedRequest, plannedTutorialIngress, tutorialStage, analysis, analysisMode, heatmap, view = 'overview', cameraCommand, focusNodes, routeCandidates, onSelect, onFloorChange, onFollowChange }: Props) {
  const selectRef = useRef(onSelect); selectRef.current = onSelect;
  const select = useCallback<Props['onSelect']>((kind, id) => selectRef.current(kind, id), []);
  const bounds = layout.facility?.floorBounds.find(item => item.floor === floor) ?? { floor, x: 0, y: 0, width: layout.width, height: layout.height };
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height });
  const cameraRef = useRef<Camera>(camera);
  const cameraIntentRef = useRef<Camera>(camera);
  const cameraOwnerRef = useRef<'automatic' | 'manual'>('automatic');
  const welcomeCompositionRef = useRef(false);
  const overviewCompositionRef = useRef(false);
  const requestCompositionRef = useRef<CameraCommand | null>(null);
  const commandFrameRef = useRef<(command: CameraCommand) => Camera | null>(() => null);
  const [overviewComposition, setOverviewComposition] = useState(false);
  const followRef = useRef<{ vehicleId: string; requestId?: string } | null>(null);
  const trackedPoseRef = useRef<{ x: number; y: number; floor: number; vehicleId: string } | null>(null);
  const transitionRef = useRef<number | null>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const floorRef = useRef(floor);
  const [lod, setLod] = useState<CameraLod>('overview');
  const [drag, setDrag] = useState<{ x: number; y: number; scale: number } | null>(null);
  const panOriginRef = useRef(camera);
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ startDistance: number; startFrame: Camera; worldAnchor: { x: number; y: number }; startOffset: { x: number; y: number }; rect: { left: number; top: number; width: number; height: number } } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const equipment = useMemo(() => layout.facility?.equipment.filter(item => item.floor === floor) ?? [], [layout.facility, floor]);
  const aisles = useMemo(() => layout.facility?.aisles.filter(item => item.floor === floor) ?? [], [layout.facility, floor]);
  const nodeById = useMemo(() => new Map(layout.nodes.map(node => [node.id, node])), [layout.nodes]);
  const portById = useMemo(() => new Map(layout.ports.map(port => [port.id, port])), [layout.ports]);
  const portIndicators = useMemo(() => facilityPortIndicators(layout.ports, state), [layout.ports, state]);
  const floorLinks = useMemo(() => layout.links.filter(link => {
    const from = nodeById.get(link.from);
    const to = nodeById.get(link.to);
    return link.kind === 'lifter' ? from?.floor === floor || to?.floor === floor : from?.floor === floor && to?.floor === floor;
  }), [layout.links, nodeById, floor]);
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const vehicle of state.vehicles) if (vehicle.link) result[vehicle.link] = (result[vehicle.link] ?? 0) + 1;
    return result;
  }, [state.vehicles]);
  const paths = useMemo(() => new Map(floorLinks.filter(link => link.kind !== 'lifter').map(link => [link.id, pathForLink(layout, link)])), [layout, floorLinks]);
  // Opposing logical bridge links share one actual corridor/resource, drawn once.
  const visibleLinks = useMemo(() => { const seen = new Set<string>(); return floorLinks.filter(link => { if (link.kind === 'lifter') return false; if (!link.resource) return true; if (seen.has(link.resource)) return false; seen.add(link.resource); return true; }); }, [floorLinks]);
  const docks = useMemo(() => equipment.map(item => item.dock), [equipment]);
  const supports = useMemo(() => new Map(floorLinks.filter(link => link.kind !== 'lifter').map(link => [link.id, supportPositions(paths.get(link.id) ?? [], docks)])), [floorLinks, paths, docks]);

  const viewport = () => {
    const rect = stageRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 800, height: rect?.height ?? 500, aspect: (rect?.width ?? 800) / Math.max(1, rect?.height ?? 500) };
  };
  const cancelTransition = () => { if (transitionRef.current !== null) cancelAnimationFrame(transitionRef.current); transitionRef.current = null; };
  const writeFrame = (next: Camera, updateReact = false, allowOutsideBounds = false) => {
    const currentBounds = layout.facility?.floorBounds.find(item => item.floor === floorRef.current) ?? bounds;
    const { width, height, aspect } = viewport();
    const frame = allowOutsideBounds ? { ...next, h: next.w / aspect } : clampFrame(next, currentBounds, aspect);
    cameraRef.current = frame;
    svgRef.current?.setAttribute('viewBox', `${frame.x} ${frame.y} ${frame.w} ${frame.h}`);
    svgRef.current?.setAttribute('data-camera-center-x', String(frame.x + frame.w / 2));
    svgRef.current?.setAttribute('data-camera-center-y', String(frame.y + frame.h / 2));
    svgRef.current?.setAttribute('data-camera-following', String(!!followRef.current && cameraOwnerRef.current === 'automatic'));
    const screenUnit = frame.w / Math.max(1, width);
    stageRef.current?.querySelectorAll<SVGGElement>('.tutorial-port-cue').forEach(cue => {
      const x = Number(cue.dataset.worldX), y = Number(cue.dataset.worldY);
      const outside = x < frame.x || x > frame.x + frame.w || y < frame.y || y > frame.y + frame.h;
      const labelX = outside ? frame.x + screenUnit * (cue.dataset.focusKind === 'source' ? 78 : width - 78) : Math.max(frame.x + screenUnit * 78, Math.min(frame.x + frame.w - screenUnit * 78, x));
      const labelY = outside ? frame.y + screenUnit * 24 : Math.max(frame.y + screenUnit * 24, Math.min(frame.y + frame.h - screenUnit * 24, y - screenUnit * 40));
      cue.querySelector('.tutorial-port-label')?.setAttribute('transform', `translate(${labelX - x} ${labelY - y}) scale(${screenUnit})`);
      cue.querySelector('.tutorial-port-leader')?.setAttribute('d', `M0 0L${labelX - x} ${labelY - y + screenUnit * 15}`);
      cue.querySelector('.tutorial-dock-ring')?.setAttribute('r', String(screenUnit * 20));
    });
    stageRef.current?.querySelectorAll<SVGEllipseElement>('.vehicle-track-ring').forEach(ring => { ring.setAttribute('rx', String(screenUnit * 23)); ring.setAttribute('ry', String(screenUnit * 16)); });
    stageRef.current?.querySelectorAll<SVGGElement>('.facility-vehicle.tracked').forEach(vehicle => {
      const translation = vehicle.getAttribute('transform')?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      const worldX = translation ? Number(translation[1]) : frame.x + frame.w / 2;
      const left = trackedLabelLeft(worldX, frame, screenUnit);
      const backing = vehicle.querySelector<SVGRectElement>('.tracked-label-backing');
      const label = vehicle.querySelector<SVGTextElement>('.tracked-label');
      backing?.setAttribute('x', String(screenUnit * (left ? -142 : 26)));
      backing?.setAttribute('y', String(-screenUnit * 16)); backing?.setAttribute('width', String(screenUnit * 116)); backing?.setAttribute('height', String(screenUnit * 21)); backing?.setAttribute('rx', String(screenUnit * 4));
      if (label) { label.style.fontSize = `${screenUnit * 12}px`; label.setAttribute('x', String(screenUnit * (left ? -136 : 32))); label.setAttribute('y', String(-screenUnit * 2)); }
      const chevron = vehicle.querySelector<SVGPathElement>('.tracked-direction-chevron');
      const angle = Number(chevron?.getAttribute('data-heading') ?? 0);
      chevron?.setAttribute('transform', `rotate(${angle}) scale(${screenUnit})`);
      vehicle.querySelector<SVGPathElement>('.tracked-direction-chevron-backing')?.setAttribute('transform', `rotate(${angle}) scale(${screenUnit})`);
    });
    const nextLod = cameraLod(frame, width, height);
    if (transitionRef.current === null) setLod(current => current === nextLod ? current : nextLod);
    if (updateReact) setCamera(frame);
  };
  const commandFrame = (command: CameraCommand): Camera | null => {
    const requestId = command.requestId ?? (['opening', 'follow', 'request'].includes(command.kind) ? trackedRequest : undefined);
    const request = requestId ? stateRef.current.requests.find(item => item.id === requestId) : undefined;
    const vehicleId = command.vehicleId ?? request?.vehicle ?? trackedVehicle;
    const vehicle = vehicleId ? stateRef.current.vehicles.find(item => item.id === vehicleId) : undefined;
    let position = vehicle ? vehiclePosition(layout, vehicle) : undefined;
    if ((command.kind === 'follow' || command.kind === 'opening') && vehicleId && position) {
      const marks = svgRef.current?.querySelectorAll<SVGGElement>('[data-oht-id]') ?? [];
      const mark = [...marks].find(item => item.getAttribute('data-oht-id') === vehicleId)?.querySelector<SVGGElement>('.facility-vehicle');
      const translated = mark?.getAttribute('transform')?.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      if (translated && position.floor === floorRef.current) position = { ...position, x: Number(translated[1]), y: Number(translated[2]) };
    }
    const sourceId = request?.source ?? (['opening', 'request'].includes(command.kind) ? plannedTutorialIngress?.source : undefined);
    const destinationId = request?.destination ?? (['opening', 'request'].includes(command.kind) ? plannedTutorialIngress?.destination : undefined);
    const source = sourceId ? layout.ports.find(port => port.id === sourceId) : undefined;
    const destination = destinationId ? layout.ports.find(port => port.id === destinationId) : undefined;
    const sourceNode = source ? nodeById.get(source.node) : undefined;
    const destinationNode = destination ? nodeById.get(destination.node) : undefined;
    const liveNode = vehicle ? nodeById.get(vehicle.node) : undefined;
    const { width, height, aspect } = viewport();
    const points: Array<{ x: number; y: number }> = [];
    const addArea = (areaId: string | undefined) => {
      const area = areaId ? layout.areas.find(item => item.id === areaId && item.floor === floorRef.current) : undefined;
      if (area) points.push({ x: area.x, y: area.y }, { x: area.x + area.width, y: area.y + area.height });
    };
    if (command.kind === 'rail' && command.railId) {
      const link = layout.links.find(item => item.id === command.railId);
      if (!link) return null;
      const points = pathForLink(layout, link), mid = pointAlongPath(points, .5);
      const span = Math.max(370, Math.min(950, link.length * 1.7));
      return { x: mid.x - span * aspect / 2, y: mid.y - span / 2, w: span * aspect, h: span };
    }
    if (command.kind === 'welcome') {
      const firstArea = layout.areas.find(area => area.floor === floorRef.current);
      return welcomeCameraFrame(bounds, firstArea, aspect);
    }
    if (command.kind === 'overview') {
      const frame = fitCamera([{ x: bounds.x, y: bounds.y }, { x: bounds.x + bounds.width, y: bounds.y + bounds.height }], width, height, 1.04);
      return frame ?? { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
    }
    if (command.kind === 'opening' && source) {
      const equipment = layout.facility?.equipment.find(item => item.portId === source.id);
      if (equipment) points.push(
        { x: equipment.x, y: equipment.y },
        { x: equipment.x + equipment.width, y: equipment.y + equipment.height },
        { x: equipment.dock.x - 40, y: equipment.dock.y - 24 },
        { x: equipment.dock.x + 40, y: equipment.dock.y + 54 },
      );
      if (sourceNode) {
        points.push(sourceNode);
        const adjacent = layout.links
          .filter(link => link.kind !== 'lifter' && (link.from === source.node || link.to === source.node))
          .map(link => nodeById.get(link.from === source.node ? link.to : link.from))
          .filter((node): node is NonNullable<typeof node> => !!node && node.floor === floorRef.current)
          .sort((a, b) => Math.hypot(a.x - sourceNode.x, a.y - sourceNode.y) - Math.hypot(b.x - sourceNode.x, b.y - sourceNode.y));
        if (adjacent[0]) points.push(adjacent[0]);
      }
    }
    if (command.kind === 'bay') {
      addArea(request?.phase === 'completed' ? destinationNode?.area : liveNode?.area ?? sourceNode?.area ?? destinationNode?.area);
      if (!points.length && position) points.push(position);
    } else if (command.kind === 'connected') {
      const sourceArea = request?.phase === 'completed' ? destinationNode?.area : liveNode?.area ?? sourceNode?.area ?? destinationNode?.area;
      const adjacent = layout.links.map(link => [nodeById.get(link.from), nodeById.get(link.to)] as const)
        .filter(pair => pair[0]?.floor === floorRef.current && pair[1]?.floor === floorRef.current)
        .flatMap(pair => pair[0]?.area === sourceArea && pair[1]?.area !== sourceArea ? [pair[1]?.area] : pair[1]?.area === sourceArea && pair[0]?.area !== sourceArea ? [pair[0]?.area] : [])
        .find(area => !!area);
      addArea(sourceArea); addArea(adjacent);
    } else if (command.kind === 'request' || (command.kind === 'follow' && request?.phase === 'completed')) {
      if (position) points.push(position);
      if (sourceNode) points.push(sourceNode);
      if (destinationNode) points.push(destinationNode);
      if (vehicle && request && request.phase !== 'completed' && vehicle.request === request.id) for (const id of vehicle.route) { const node = nodeById.get(id); if (node?.floor === floorRef.current) points.push(node); }
      if (routeCandidates?.length) for (const candidate of routeCandidates) for (const id of candidate.nodes) { const node = nodeById.get(id); if (node?.floor === floorRef.current) points.push(node); }
    } else {
      if (position) points.push(position);
      if (sourceNode && command.kind !== 'follow') points.push(sourceNode);
    }
    if (!points.length && position) points.push(position);
    const fitted = fitCamera(points, width, height, command.kind === 'opening' ? 1.25 : 1.18);
    if (!fitted) return null;
    let frame = command.kind === 'opening' || command.kind === 'request' ? fitted : clampFrame(fitted, bounds, aspect);
    if (command.kind === 'follow' && position && request?.phase !== 'completed') {
      const w = width < 600 ? Math.max(240, width * 1.1) : cameraLod(cameraRef.current, width, height) === 'close' ? cameraRef.current.w : Math.max(180, width * .65);
      frame = followFrame({ ...cameraRef.current, w }, position, aspect);
    }
    if (command.kind === 'opening') {
      followRef.current = request && vehicle && !vehicle.parked && vehicle.request === request.id && request.phase !== 'completed' ? { vehicleId: vehicle.id, requestId: request.id } : null;
    } else if (command.kind === 'follow') {
      const owner = vehicle?.request ? stateRef.current.requests.find(item => item.id === vehicle.request) : undefined;
      const ownerValid = !!vehicle?.request && !!owner && owner.vehicle === vehicle.id && owner.phase !== 'completed';
      followRef.current = vehicle && !vehicle.parked && ownerValid && (!request || (vehicle.request === request.id && request.phase !== 'completed'))
        ? { vehicleId: vehicle.id, requestId: request?.id ?? owner?.id }
        : null;
    }
    const activeFollow = followRef.current;
    if (activeFollow && activeFollow.vehicleId === vehicleId && position) trackedPoseRef.current = { ...position, vehicleId: activeFollow.vehicleId };
    return frame;
  };
  commandFrameRef.current = commandFrame;
  const transitionTo = (target: Camera, immediate = false, allowOutsideBounds = false) => {
    cancelTransition();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cameraOwnerRef.current = 'automatic';
    cameraIntentRef.current = target;
    if (immediate || reduce) { writeFrame(target, true, allowOutsideBounds); return; }
    const from = cameraRef.current;
    let start: number | undefined;
    const animate = (now: number) => {
      start ??= now;
      const fraction = Math.min(1, (now - start) / 520);
      writeFrame(interpolateFrame(from, target, fraction), false, allowOutsideBounds);
      if (fraction < 1) transitionRef.current = requestAnimationFrame(animate);
      else { transitionRef.current = null; writeFrame(cameraRef.current, true, allowOutsideBounds); }
    };
    transitionRef.current = requestAnimationFrame(animate);
  };
  useEffect(() => {
    if (!cameraCommand) return;
    const command = cameraCommand;
    if (command.kind === 'cancel') {
      cancelTransition();
      welcomeCompositionRef.current = false;
      overviewCompositionRef.current = false; setOverviewComposition(false);
      requestCompositionRef.current = null;
      const frame = cameraRef.current, intent = cameraIntentRef.current;
      cameraIntentRef.current = { ...intent, x: frame.x + frame.w / 2 - intent.w / 2, y: frame.y + frame.h / 2 - intent.h / 2 };
      cameraOwnerRef.current = 'manual'; followRef.current = null; onFollowChange?.(false);
      writeFrame(frame, true, true); return;
    }
    if (command.kind !== 'opening' && command.kind !== 'follow') followRef.current = null;
    welcomeCompositionRef.current = command.kind === 'welcome';
    overviewCompositionRef.current = command.kind === 'overview'; setOverviewComposition(command.kind === 'overview');
    requestCompositionRef.current = command.kind === 'request' ? command : null;
    const target = commandFrame(command);
    if (target) {
      if (command.kind === 'welcome' || command.kind === 'overview' || command.kind === 'request' || command.kind === 'bay' || command.kind === 'connected') onFollowChange?.(false);
      else onFollowChange?.(!!followRef.current);
      const immediate = command.kind === 'welcome' || command.kind === 'opening' || command.kind === 'follow';
      const preserveFit = immediate || command.kind === 'overview' || command.kind === 'request';
      transitionTo(target, immediate, preserveFit);
    }
  }, [cameraCommand?.sequence]);
  useEffect(() => () => cancelTransition(), []);
  useEffect(() => {
    if (floorRef.current === floor) return;
    floorRef.current = floor;
    const { aspect } = viewport();
    const pose = trackedPoseRef.current;
    const follow = followRef.current;
    const followsPose = cameraOwnerRef.current === 'automatic' && follow && pose?.vehicleId === follow.vehicleId && pose.floor === floor;
    const intentFrame = resizeCameraFrame(cameraIntentRef.current, aspect, followsPose ? pose : undefined);
    // A floor switch must keep a manually chosen camera center. Clamping here
    // would silently move a canceled follow camera back into the floor bounds.
    const frame = followsPose ? followFrame(intentFrame, pose, aspect) : intentFrame;
    if (followsPose) cameraIntentRef.current = { ...cameraIntentRef.current, x: pose.x - cameraIntentRef.current.w / 2, y: pose.y - cameraIntentRef.current.h / 2 };
    writeFrame(frame, true, true);
  }, [floor, bounds.x, bounds.y, bounds.width, bounds.height]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    let previousSize = stage.getBoundingClientRect();
    const observer = new ResizeObserver(() => {
      const size = stage.getBoundingClientRect();
      if (Math.abs(size.width - previousSize.width) < .5 && Math.abs(size.height - previousSize.height) < .5) return;
      previousSize = size;
      cancelTransition();
      const { aspect } = viewport();
      const intent = cameraIntentRef.current;
      const pose = trackedPoseRef.current;
      const follow = followRef.current;
      const followsPose = cameraOwnerRef.current === 'automatic' && follow && pose?.vehicleId === follow.vehicleId && pose.floor === floorRef.current;
      if (cameraOwnerRef.current === 'automatic' && requestCompositionRef.current) {
        const composition = commandFrameRef.current(requestCompositionRef.current);
        if (composition) { cameraIntentRef.current = composition; writeFrame(composition, true, true); return; }
        // Informational Experience may have no selected request. Resize its retained camera normally.
      }
      if (cameraOwnerRef.current === 'automatic' && overviewCompositionRef.current) {
        const currentBounds = layout.facility?.floorBounds.find(item => item.floor === floorRef.current) ?? bounds;
        const composition = fitCamera([{ x: currentBounds.x, y: currentBounds.y }, { x: currentBounds.x + currentBounds.width, y: currentBounds.y + currentBounds.height }], size.width, size.height, 1.04);
        if (composition) { cameraIntentRef.current = composition; writeFrame(composition, true, true); }
        return;
      }
      if (cameraOwnerRef.current === 'automatic' && welcomeCompositionRef.current) {
        const currentBounds = layout.facility?.floorBounds.find(item => item.floor === floorRef.current) ?? bounds;
        const area = layout.areas.find(item => item.floor === floorRef.current);
        const composition = welcomeCameraFrame(currentBounds, area, aspect);
        cameraIntentRef.current = composition;
        writeFrame(composition, true, true);
        return;
      }
      const followIntent = followsPose && size.width < 600 ? { ...intent, w: Math.min(intent.w, Math.max(240, size.width * 1.1)), h: 0 } : intent;
      const resized = resizeCameraFrame(followIntent, aspect, followsPose ? pose : undefined);
      const fitted = followsPose ? followFrame(resized, pose, aspect) : resized;
      if (followsPose) cameraIntentRef.current = { ...intent, x: pose.x - intent.w / 2, y: pose.y - intent.h / 2 };
      // Resize/fullscreen changes the displayed span, not the user's center.
      // Keep that center even when it lies outside this floor's geometry.
      writeFrame(fitted, true, true);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [layout]);

  const onTrackedPose = useCallback((position: { x: number; y: number; floor: number; vehicleId: string }) => {
    const follow = followRef.current;
    if (!follow || follow.vehicleId !== position.vehicleId || cameraOwnerRef.current !== 'automatic' || transitionRef.current !== null) return;
    const vehicle = stateRef.current.vehicles.find(item => item.id === follow.vehicleId && !item.parked);
    if (!vehicle) { followRef.current = null; onFollowChange?.(false); return; }
    if (follow.requestId) {
      const request = stateRef.current.requests.find(item => item.id === follow.requestId);
      if (!request || request.phase === 'completed' || request.vehicle !== follow.vehicleId || vehicle.request !== request.id) { followRef.current = null; onFollowChange?.(false); return; }
      onFollowChange?.(true);
    }
    trackedPoseRef.current = position;
    if (position.floor !== floorRef.current) { floorRef.current = position.floor; onFloorChange(position.floor); }
    const { aspect } = viewport();
    const next = followFrame(cameraRef.current, position, aspect);
    if (next.x !== cameraRef.current.x || next.y !== cameraRef.current.y || next.w !== cameraRef.current.w || next.h !== cameraRef.current.h) {
      const intent = cameraIntentRef.current;
      cameraIntentRef.current = { ...intent, x: position.x - intent.w / 2, y: position.y - intent.h / 2 };
      writeFrame(next, false, true);
    }
  }, [layout, onFloorChange, onFollowChange]);

  const takeManualCamera = (keepFollow = false) => {
    cancelTransition();
    welcomeCompositionRef.current = false;
    overviewCompositionRef.current = false; setOverviewComposition(false);
    requestCompositionRef.current = null;
    const frame = cameraRef.current, intent = cameraIntentRef.current;
    cameraIntentRef.current = { ...intent, x: frame.x + frame.w / 2 - intent.w / 2, y: frame.y + frame.h / 2 - intent.h / 2 };
    if (!keepFollow) { cameraOwnerRef.current = 'manual'; followRef.current = null; onFollowChange?.(false); }
    writeFrame(frame, true, true);
  };
  const manualFrame = (next: Camera, updateIntentSpan = false) => {
    writeFrame(next, true);
    const frame = cameraRef.current, intent = cameraIntentRef.current;
    cameraIntentRef.current = updateIntentSpan
      ? frame
      : { ...intent, x: frame.x + frame.w / 2 - intent.w / 2, y: frame.y + frame.h / 2 - intent.h / 2 };
  };
  const zoomAt = (factor: number, cx = cameraRef.current.x + cameraRef.current.w / 2, cy = cameraRef.current.y + cameraRef.current.h / 2) => {
    takeManualCamera(true);
    const current = cameraRef.current;
    const { aspect } = viewport();
    const w = Math.max(80, Math.min(layout.width * 1.8, current.w * factor));
    const h = w / aspect;
    const rx = (cx - current.x) / current.w, ry = (cy - current.y) / current.h;
    manualFrame({ x: cx - rx * w, y: cy - ry * h, w, h }, true);
  };
  const resetCamera = () => { takeManualCamera(); const frame = commandFrame({ sequence: -1, kind: 'overview' }); if (frame) transitionTo(frame, false, true); };
  const startPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPointsRef.current.size >= 2) {
        takeManualCamera(true); setDrag(null); event.currentTarget.setPointerCapture(event.pointerId);
        const [a, b] = [...touchPointsRef.current.values()];
        const rect = event.currentTarget.getBoundingClientRect();
        const current = cameraRef.current;
        const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
        pinchRef.current = { startDistance: Math.hypot(a.x - b.x, a.y - b.y), startFrame: current, worldAnchor: { x: current.x + ((midX - rect.left) / rect.width) * current.w, y: current.y + ((midY - rect.top) / rect.height) * current.h }, startOffset: { x: (midX - rect.left) / rect.width, y: (midY - rect.top) / rect.height }, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } };
        return;
      }
    }
    if ((event.target as Element).closest('[data-selectable]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: event.clientX, y: event.clientY, scale: event.currentTarget.getScreenCTM()?.a ?? 1 }); panOriginRef.current = cameraRef.current;
  };
  const movePan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch' && touchPointsRef.current.has(event.pointerId)) touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchRef.current && touchPointsRef.current.size >= 2) {
      const pinch = pinchRef.current;
      const [a, b] = [...touchPointsRef.current.values()];
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const offsetX = (midX - pinch.rect.left) / pinch.rect.width;
      const offsetY = (midY - pinch.rect.top) / pinch.rect.height;
      const { aspect } = viewport();
      const w = Math.max(80, Math.min(layout.width * 1.8, pinch.startFrame.w * pinch.startDistance / distance));
      const h = w / aspect;
      manualFrame({ x: pinch.worldAnchor.x - offsetX * w, y: pinch.worldAnchor.y - offsetY * h, w, h }, true);
      return;
    }
    if (!drag) return;
    takeManualCamera();
    manualFrame({ ...panOriginRef.current, x: panOriginRef.current.x - (event.clientX - drag.x) / drag.scale, y: panOriginRef.current.y - (event.clientY - drag.y) / drag.scale });
  };
  const endPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') touchPointsRef.current.delete(event.pointerId);
    if (touchPointsRef.current.size < 2) pinchRef.current = null;
    setDrag(null);
  };
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      takeManualCamera(true);
      const matrix = svg.getScreenCTM();
      const point = matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
      const factor = event.deltaY > 0 ? 1.12 : .89;
      const current = cameraRef.current;
      const { aspect } = viewport();
      const w = Math.max(80, Math.min(layout.width * 1.8, current.w * factor));
      const h = w / aspect;
      const cx = point?.x ?? current.x + current.w / 2, cy = point?.y ?? current.y + current.h / 2;
      manualFrame({ x: cx - (cx - current.x) / current.w * w, y: cy - (cy - current.y) / current.h * h, w, h }, true);
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [layout.width, layout.height]);

  const endpointRequest = state.requests.find(request => request.id === (tutorialStage ? 'TR-0001' : trackedRequest));
  const tutorialEndpoints = tutorialStage ? endpointRequest ?? (state.requests.length === 0 ? plannedTutorialIngress : undefined) : undefined;
  const tutorialPorts = tutorialEndpoints ? [
    ...(['request', 'dispatch', 'empty-travel', 'pickup', 'route'].includes(tutorialStage!) ? [{ id: tutorialEndpoints.source, kind: 'source' }] : []),
    ...(['request', 'dispatch', 'loaded-travel', 'dropoff', 'bay'].includes(tutorialStage!) ? [{ id: tutorialEndpoints.destination, kind: 'destination' }] : []),
  ] : [];
  const resourceLinks = useMemo(() => { const map = new Map<string, Layout['links']>(); for (const link of layout.links) if (link.resource) { const list = map.get(link.resource) ?? []; list.push(link); map.set(link.resource, list); } return map; }, [layout]);
  const queueCounts = new Map((state.linkQueues ?? []).map(queue => [queue.linkId, queue.vehicleIds.length]));
  const trafficKey = Object.entries(counts).sort().map(([id,n]) => `${id}:${n}`).join('|');
  const queueKey = [...queueCounts].filter(([,n]) => n).sort().map(([id,n]) => `${id}:${n}`).join('|');
  const failureKey = failures.filter(f => f.start <= state.time && state.time < f.start + f.duration).map(f => `${f.kind}:${f.target}`).join('|');
  const backdrop = useMemo(() => <>      <rect x={bounds.x - layout.width} y={bounds.y - layout.height} width={bounds.width + layout.width * 2} height={bounds.height + layout.height * 2} fill="#e6ebe8" />
      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} rx="7" fill="url(#facilityFloor)" stroke="#c0cac6" strokeWidth="1.4" />
      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="url(#facilitySeams)" opacity=".6" />
      {layout.areas.filter(area => area.floor === floor).map(area => <g key={area.id} className="facility-area">
        <path d={`M${area.x} ${area.y + 10}q0-10 10-10h${area.width - 20}q10 0 10 10v${area.height - 20}q0 10-10 10H${area.x + 10}q-10 0-10-10z`} fill="#f6f8f6" fillOpacity=".48" stroke="#d4dcd8" strokeWidth="1" />
        <text x={area.x + 4} y={area.y - 8} className="facility-area-title" style={{fontSize: layout.width > 4000 ? 40 : 26}}>{area.name.toUpperCase()}</text>
      </g>)}
      {aisles.map(aisle => <g key={aisle.id} className="facility-aisle">
        <rect x={aisle.x} y={aisle.y} width={aisle.width} height={aisle.height} rx="6" fill="#e8eeeb" stroke="#d3dcd8" strokeWidth="1" />
        <path d={`M${aisle.x + 12} ${aisle.y + 8}H${aisle.x + aisle.width - 12} M${aisle.x + 12} ${aisle.y + aisle.height - 8}H${aisle.x + aisle.width - 12}`} stroke="#fff" strokeWidth="1.4" strokeDasharray="2 8" />
        <text x={aisle.x + 17} y={aisle.y + aisle.height / 2 + 3} className="facility-aisle-label">{aisle.name}</text>
      </g>)}
      {/* Recessed machine feet and utility shadows establish depth without changing footprint geometry. */}
      {equipment.map(item => <g key={`shadow-${item.id}`} aria-hidden="true">
        <rect x={item.x + 3} y={item.y + 5} width={item.width - 6} height={item.height - 2} rx="4" fill="#52605b" opacity=".09" />
        <path d={`M${item.x + 8} ${item.y + item.height + 3}h${item.width - 16}`} stroke="#798581" strokeOpacity=".2" strokeWidth="2" />
      </g>)}
</>, [bounds.x, bounds.y, bounds.width, bounds.height, layout, floor, aisles, equipment]);
  const analysisRails = useMemo(() => new Map(analysis?.rails.map(rail => [rail.linkId, rail]) ?? []), [analysis]);
  const railLayer = useMemo(() => visibleLinks.map(link => {
        const points = paths.get(link.id);
        const from = nodeById.get(link.from), to = nodeById.get(link.to);
        if (!points || !from || !to) return null;
        const related = link.resource ? resourceLinks.get(link.resource) ?? [link] : [link];
        const traffic = related.reduce((sum, other) => sum + (counts[other.id] ?? 0), 0);
        const blocked = failures.some(failure => failure.start <= state.time && state.time < failure.start + failure.duration && (related.some(other => failure.target === other.id) || failure.target === link.resource));
        const queued = related.reduce((sum, edge) => sum + (queueCounts.get(edge.id) ?? 0), 0);
        const samples = related.flatMap(item => analysisRails.get(item.id) ?? []);
        const sample = samples[0] && { ...samples[0],
          currentQueue: samples.reduce((sum, item) => sum + item.currentQueue, 0),
          waitingSeconds: samples.reduce((sum, item) => sum + item.waitingSeconds, 0),
          closed: samples.some(item => item.closed),
        };
        const analysisVisual = railAnalysisVisual(sample, analysisMode, analysis?.windowObservedSeconds ?? 0);
        const color = analysis ? blocked ? '#84649e' : analysisVisual.active ? analysisVisual.color : LIGHT.rail : getLinkColor(link.id, queued ? link.capacity : traffic, link.capacity, heatmap, blocked);
        const selectedRail = related.some(other => selected === `rail:${other.id}`);
        const railPath = pathD(points);
        return <g key={link.id} data-link-id={link.id} className={`facility-rail ${link.kind} ${selectedRail ? 'selected' : ''}`} data-selectable="true" role="button" tabIndex={0} aria-label={`${link.kind} guideway ${link.id}, ${related.some(other => other.from === link.to && other.to === link.from) ? 'bidirectional shared corridor' : 'directed link'}, traffic ${traffic} of ${link.capacity}, queue ${queued}`} onClick={() => select('rail', link.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select('rail', link.id); } }} onPointerEnter={() => setHovered(link.id)} onPointerLeave={() => setHovered(current => current === link.id ? null : current)}>
          <path d={railPath} className="facility-rail-shadow" />
          <path d={railPath} className="facility-rail-side" />
          <path d={railPath} className="facility-rail-face" />
          <path d={railPath} className="facility-rail-top" />
          <path d={railPath} className="facility-rail-state" stroke={selectedRail ? '#8a62a1' : color} strokeDasharray={analysis && blocked ? '6 3' : undefined} />
          {(lod === 'close' ? supports.get(link.id) ?? [] : []).map((support, index) => <g key={index} transform={`translate(${support.x.toFixed(4)} ${support.y.toFixed(4)}) rotate(${support.angle.toFixed(4)})`} className="facility-hanger" aria-hidden="true">
            <ellipse cy="7" rx="6" ry="2.2" fill="#4d5956" opacity=".16" />
            <path d="M-3 -1v8h6v-8" fill="#aeb9b6" stroke="#77837f" strokeWidth=".8" />
            <path d="M-7 6h14l3 3h-20z" fill="#c6cecb" stroke="#87928f" strokeWidth=".8" />
            <path d="M0 0v6" stroke="#f8faf9" strokeWidth=".8" />
          </g>)}
          {link.kind === 'bridge' && (() => { const p = pointAlongPath(points, .5); return <g className="facility-bridge-sign" transform={`translate(${p.x} ${p.y - 22})`} aria-hidden="true"><rect x="-32" y="-9" width="64" height="17" rx="3" fill="#edf1ed" stroke="#9ba79e"/><text textAnchor="middle" y="3" fill="#53675a" fontSize="8" fontWeight="650">BRIDGE {traffic}/{link.capacity}</text></g>; })()}
          {(() => { const cue = pointAlongPath(points, .58); return <g className="facility-direction" transform={`translate(${cue.x.toFixed(4)} ${cue.y.toFixed(4)}) rotate(${cue.angle.toFixed(4)})`} aria-hidden="true"><path d={related.length > 1 ? 'M-3 -3.3-8 0-3 3.3M3 -3.3 8 0 3 3.3' : 'M-4 -3.3 1.5 0-4 3.3'} fill="none" stroke="#5a6662" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></g>; })()}
          {(heatmap || hovered === link.id || selectedRail) && <path d={railPath} className="facility-rail-hit" stroke={color} />}
          {link.kind !== 'bridge' && (hovered === link.id || selectedRail) && <g className="facility-rail-tooltip">
            <rect x={pointAlongPath(points, .5).x - 42} y={pointAlongPath(points, .5).y - 34} width="84" height="19" rx="4" />
            <text x={pointAlongPath(points, .5).x} y={pointAlongPath(points, .5).y - 21} textAnchor="middle">{traffic} / {link.capacity} · Q{queued}{blocked ? related.length > 1 ? ' · DIR OUT' : ' · OUT' : ''}</text>
          </g>}
        </g>;
      }), [visibleLinks, paths, nodeById, resourceLinks, supports, trafficKey, queueKey, failureKey, heatmap, analysis, analysisMode, analysisRails, selected, hovered, select, lod]);

  return <><div ref={stageRef} style={{ '--floor-aspect': bounds.width / bounds.height } as CSSProperties} className={`map-stage facility-stage lod-${lod} view-${view}${overviewComposition && cameraCommand?.kind === 'overview' ? ` overview-composition${layout.id === 'small' ? ' small-overview-composition' : ''}` : ''}${tutorialStage ? ' tutorial-scene' : ''}${routeCandidates?.length ? ' route-inspection' : ''}`} data-tutorial-stage={tutorialStage}>
    <svg ref={svgRef} className="fab-map facility-map" data-simulation-time={state.time} data-simulation-tick={state.tick} viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`} role="img" aria-label={`${layout.name} cleanroom transport map, floor ${floor + 1}`} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
      <defs>
        <linearGradient id="facilityFloor" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#fafbf9"/><stop offset="1" stopColor="#edf1ee"/></linearGradient>
        <linearGradient id="facilityMetal" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#f8faf9"/><stop offset=".42" stopColor="#b6c0bd"/><stop offset="1" stopColor="#8d9996"/></linearGradient>
        <pattern id="facilitySeams" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#e0e5e2" strokeWidth=".8"/><circle cx="1" cy="1" r=".9" fill="#d7deda"/></pattern>
        <marker id="facilityDirection" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 8 4 0 8z" fill="#65716e"/></marker>
      </defs>
      {backdrop}
      {/* Beam, side faces, fine top edge, and short steel hangers share the graph's exact sampled path. */}
      {railLayer}
      {/* A dock marker is the real port node; the attached loadport graphic stays on that coordinate. */}
      {layout.facility?.decorativeEquipment?.filter(item=>item.floor===floor).map(item=><g key={item.id} aria-hidden="true" pointerEvents="none"><rect x={item.x} y={item.y} width={item.width} height={item.height} rx="6" fill="#b3ccbb" stroke="#7f9f8c" strokeWidth="2"/><rect x={item.x+item.width*.2} y={item.y+item.height*.2} width={item.width*.6} height={item.height*.3} rx="3" fill="#f3efe0"/></g>)}
      {equipment.map(item => {
        const port = portById.get(item.portId);
        if (!port) return null;
        const indicators = portIndicators.get(port.id);
        const stored = indicators?.stored ?? 0;
        const reserved = indicators?.reserved ?? 0;
        const sourceQueue = indicators?.sourceQueue ?? 0;
        const plannedIngress = plannedTutorialIngress?.source === port.id && sourceQueue === 0;
        const serviceAtPort = indicators?.serviceAtPort ?? false;
        const capacity = Math.max(1, Math.min(port.capacity, storageCapacity));
        const label = `${port.name}${port.kind === 'stocker' ? ` · ${stored}/${capacity}` : ''}`;
        const isSelected = selected === `port:${port.id}`;
        const isRequestEndpoint = endpointRequest?.source === port.id || endpointRequest?.destination === port.id;
        const isHovered = hovered === `port:${port.id}`;
        return <g key={item.id} data-port-id={port.id} data-selectable="true" className={`facility-port${isSelected ? ' selected' : ''}${isRequestEndpoint ? ' request-endpoint' : ''}`} role="button" tabIndex={0} aria-label={`${port.kind} ${port.name}, ${stored} stored, ${reserved} reserved, capacity ${capacity}`} onClick={() => onSelect('port', port.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect('port', port.id); } }} onPointerEnter={() => setHovered(`port:${port.id}`)} onPointerLeave={() => setHovered(current => current === `port:${port.id}` ? null : current)}>
          <FacilityAsset equipment={item} portName={label} stored={stored} reserved={reserved} capacity={capacity} selected={isSelected} showLabel={lod !== 'overview' || isHovered || isSelected} />
          <circle cx={item.dock.x} cy={item.dock.y} r={isSelected ? 8 : 6} className={`facility-dock ${port.kind}`} />
          <circle cx={item.dock.x} cy={item.dock.y} r="2.1" className="facility-dock-core" />
          {stored > 0 && <g className="stored-foup-indicator" aria-label={`${stored} FOUP stored at ${port.name}`} transform={`translate(${item.dock.x + 15} ${item.dock.y + 10})`}><rect x="-9" y="-7" width="38" height="14" rx="4" fill="#e4f0e7" stroke="#678d70" strokeWidth=".8"/><path d="M-5-3h5l1 1v7h-7v-7z" fill="#d9a34e" stroke="#8b6b38" strokeWidth=".5"/><text x="5" y="2.5" fill="#456c50" fontSize="6.2" fontWeight="700">STORED {stored}</text></g>}
          {(sourceQueue > 0 || serviceAtPort) && <g className="source-ingress-badge" aria-label={`출발 요청 대기열 · ${sourceQueue}, 저장 슬롯과 별도`} transform={`translate(${item.dock.x + 12} ${item.dock.y + 15})`}><rect x="0" y="-7" width="42" height="13" rx="4" fill="#eef4ed" stroke="#638d78"/><text x="21" y="2.1" textAnchor="middle" fill="#355e4b" fontSize="6.3" fontWeight="700">인계 대기 {sourceQueue}</text></g>}
          {sourceQueue > 0 && !serviceAtPort && <g className="source-ingress-foup" aria-hidden="true" transform={`translate(${item.dock.x} ${item.dock.y + 24})`}><path className="source-pad-link" d="M0-24V-7M-12 15H12" fill="none" stroke="#607a6e" strokeWidth="1.1"/><rect className="source-pad-deck" x="-14" y="14" width="28" height="4" rx="1" fill="#dce4dc" stroke="#667d70" strokeWidth=".8"/><path d="M-7 0H7L9 2V13H-9V2Z" fill="#e9b451" stroke="#8d6a32" strokeWidth=".9"/><path d="M-4 2H4V9H-4ZM-4 0V-3H4V0" fill="#f6d99f" stroke="#9d7639" strokeWidth=".55"/><text x="0" y="27" textAnchor="middle" fill="#496657" fontSize="5.7">출발 요청 · 슬롯과 별도</text></g>}
          {plannedIngress && <g className="tutorial-planned-ingress" data-tutorial-ingress="planned" aria-label={`Tutorial setup: a FOUP is planned at ${port.name} for ${portById.get(plannedTutorialIngress?.destination ?? '')?.name ?? 'the destination port'}; no transport request exists yet`} transform={`translate(${item.dock.x} ${item.dock.y + 24})`}><path d="M0-24V-7M-12 15H12" fill="none" stroke="#997345" strokeWidth="1.1" strokeDasharray="2 2"/><rect x="-14" y="14" width="28" height="4" rx="1" fill="#e6d9c6" stroke="#a98b5f" strokeDasharray="2 1"/><path d="M-7 0H7L9 2V13H-9V2Z" fill="#f4e8d4" fillOpacity=".62" stroke="#b18b57" strokeWidth="1" strokeDasharray="2 1"/><path d="M-4 2H4V9H-4ZM-4 0V-3H4V0" fill="none" stroke="#b18b57" strokeWidth=".7" strokeDasharray="2 1"/><text x="0" y="27" textAnchor="middle" fill="#765831" fontSize="5.7">미요청 · 준비 예정</text></g>}
          {port.kind === 'stocker' && <g className="facility-capacity" aria-hidden="true">
            {Array.from({ length: capacity <= 5 ? capacity : 0 }, (_, i) => <rect key={i} x={item.dock.x - 12 + i * 5} y={item.dock.y + 10} width="3" height="5" rx=".7" className={i < stored ? 'occupied' : i < stored + reserved ? 'reserved' : ''} />)}
            {capacity > 5 && <g><rect x={item.dock.x - 12} y={item.dock.y + 10} width="24" height="5" rx="1" fill="#edf1e9" stroke="#a9b7a9" strokeWidth=".6"/><rect x={item.dock.x - 12} y={item.dock.y + 10} width={24 * stored / capacity} height="5" fill="#dbae59"/><rect x={item.dock.x - 12 + 24 * stored / capacity} y={item.dock.y + 10} width={24 * reserved / capacity} height="5" fill="#87c5ba"/></g>}
          </g>}
        </g>;
      })}
      {(layout.parkingNodes ?? []).map(id => {
        const node = nodeById.get(id), parked = state.vehicles.filter(vehicle => vehicle.parked && vehicle.node === id);
        if (!node || node.floor !== floor || !parked.length) return null;
        return <g key={id} className="parking-pool" data-parked={parked.length} data-selectable="true" role="button" tabIndex={0} aria-label={`Off-rail parking ${id}, ${parked.length} OHT`} transform={`translate(${node.x} ${node.y})`} onClick={() => onSelect('vehicle', parked[0].id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect('vehicle', parked[0].id); } }}><rect x="-18" y="-12" width="36" height="24" rx="4" fill="#dce9e5" stroke="#799f92"/><text y="4" textAnchor="middle" fill="#426457" fontSize="10" fontWeight="700">P · {parked.length}</text></g>;
      })}
      {!!routeCandidates?.length && <g className="route-candidate-layer" aria-label="MCS 후보 경로" pointerEvents="none">
        {routeCandidates.map((route,index) => ({route,index})).sort((a,b) => Number(a.route.selected)-Number(b.route.selected)).map(({route,index}) => <g key={route.links.join('|')} className={`route-candidate route-${index}`} data-selected={route.selected}>{route.links.map(id => {
          const link = layout.links.find(item => item.id === id);
          if (!link || nodeById.get(link.from)?.floor !== floor) return null;
          return <g key={id}>{tutorialStage && route.selected && <path d={pathD(pathForLink(layout, link))} fill="none" stroke="#fff" strokeWidth="7" vectorEffect="non-scaling-stroke"/>}<path d={pathD(pathForLink(layout, link))} fill="none" stroke={tutorialStage && route.selected ? '#07574d' : ['#188dca', '#bd64cf', '#c2941c'][index % 3]} vectorEffect="non-scaling-stroke" data-link-id={id} strokeWidth={route.selected ? tutorialStage ? 4 : trackedRequest ? 1.8 : 3 : 1.5} strokeOpacity={route.selected ? tutorialStage ? 1 : trackedRequest ? .5 : .9 : trackedRequest ? .27 : .75} strokeDasharray={route.selected ? tutorialStage ? undefined : trackedRequest ? '8 5' : undefined : index === 1 ? '9 5' : '3 5'}/></g>;
        })}</g>)}
      </g>}
      <g className="request-endpoints" aria-label="선택 요청의 출발지와 목적지" pointerEvents="none">
        {(focusNodes ?? []).map((id, index) => { const node = nodeById.get(id); if (!node || node.floor !== floor) return null; const screenUnit = camera.w / Math.max(1, stageRef.current?.clientWidth ?? 1200), dx = (index === 0 ? -1 : 1) * screenUnit * 30, dy = -screenUnit * 28; return <g key={`${id}-${index}`} transform={`translate(${node.x + dx} ${node.y + dy})`}><path d={`M${-dx} ${-dy}L${-dx * .55} ${-dy * .55}`} fill="none" stroke={index === 0 ? '#188dca' : '#c2941c'} strokeWidth="2.3" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/><g transform={`scale(${screenUnit})`}><circle r="17" fill="#fff" stroke={index === 0 ? '#188dca' : '#c2941c'} strokeWidth="3" vectorEffect="non-scaling-stroke"/><text textAnchor="middle" y="4" fill="#344952" fontSize="11" fontWeight="700">{index === 0 ? 'S' : 'D'}</text><text textAnchor="middle" y="-24" fill="#344952" fontSize="13" fontWeight="700">{index === 0 ? '출발' : '목적지'}</text></g></g>; })}
      </g>
      <g className="tutorial-focus-layer" pointerEvents="none">
        {tutorialPorts.map(({ id, kind }) => {
          const port = portById.get(id), node = port ? nodeById.get(port.node) : undefined;
          if (!port || !node || node.floor !== floor) return null;
          const source = kind === 'source', unit = camera.w / Math.max(1, stageRef.current?.clientWidth ?? 1200);
          const status = !endpointRequest ? '요청 예정' : source ? endpointRequest.picked !== undefined ? '픽업 완료' : state.vehicles.some(v => v.request === endpointRequest.id && v.id === endpointRequest.vehicle && v.phase === 'pickup') ? 'FOUP 인계 중' : 'FOUP 준비' : endpointRequest.completed !== undefined ? '인계 완료' : state.vehicles.some(v => v.request === endpointRequest.id && v.id === endpointRequest.vehicle && v.phase === 'dropoff') ? 'FOUP 인계 중' : tutorialStage === 'dropoff' ? '하역 대기' : '도착 Port';
          const color = source ? '#075f70' : '#81500c';
          const outside = node.x < camera.x || node.x > camera.x + camera.w || node.y < camera.y || node.y > camera.y + camera.h;
          const labelX = outside ? camera.x + (source ? unit * 78 : camera.w - unit * 78) : Math.max(camera.x + unit * 78, Math.min(camera.x + camera.w - unit * 78, node.x));
          const labelY = outside ? camera.y + unit * 24 : Math.max(camera.y + unit * 24, Math.min(camera.y + camera.h - unit * 24, node.y - unit * 40));
          return <g key={`${id}-${kind}`} className="tutorial-port-cue" data-port-id={id} data-focus-kind={kind} data-focus-state={status} data-world-x={node.x} data-world-y={node.y} transform={`translate(${node.x} ${node.y})`} aria-label={`${source ? '출발' : '목적지'} Port ${port.name}, ${status}`}>
            <ellipse rx="42" ry="36" cy="12" fill={source ? '#8dd5df' : '#f6d68a'} fillOpacity=".22" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
            <path className="tutorial-port-leader" d={`M0 0L${labelX - node.x} ${labelY - node.y + unit * 15}`} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
            <circle className="tutorial-dock-ring" r={unit * 20} fill="none" stroke="#fff" strokeWidth="5" vectorEffect="non-scaling-stroke"/>
            <g className="tutorial-port-label" transform={`translate(${labelX - node.x} ${labelY - node.y}) scale(${unit})`}>
              <rect x="-76" y="-15" width="152" height="30" rx="6" fill={color} stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
              <text textAnchor="middle" y="5" fill="#fff" fontSize="13" fontWeight="700">{source ? '출발' : '목적지'} · {status}</text>
            </g>
          </g>;
        })}
      </g>
      <VehicleLayer layout={layout} state={state} floor={floor} running={running} tickMs={tickMs} selected={selected} trackedVehicle={trackedVehicle} trackedRequest={trackedRequest} onSelect={onSelect} hovered={hovered} setHovered={setHovered} onTrackedPose={onTrackedPose} screenUnit={camera.w / Math.max(1, stageRef.current?.clientWidth ?? 1200)} cameraFrame={camera} />
      {layout.nodes.filter(node => node.floor === floor).map(node => {
        const held = state.vehicles.filter(v => !v.parked && !v.link && v.node === node.id);
        if (held.length < 2) return null;
        return <g key={`count-${node.id}`} className="facility-node-count" transform={`translate(${node.x + 17} ${node.y - 17})`} role="button" tabIndex={0} data-selectable="true" aria-label={`${held.length} OHT at ${node.id}`} onClick={() => onSelect('vehicle', held[0].id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect('vehicle', held[0].id); } }}><rect x="-8" y="-8" width="20" height="15" rx="4" fill="#f5f7ed" stroke="#99a99c"/><text x="2" y="3" textAnchor="middle" fill="#516858" fontSize="9" fontWeight="700">{held.length}</text></g>;
      })}
      <g className="facility-stamp" aria-hidden="true">
        <text x={bounds.x + 16} y={bounds.y + bounds.height - 15}>{layout.id.toUpperCase()} FAB <tspan>·</tspan> FLOOR {floor + 1}</text>
      </g>
    </svg>
    <div className="map-controls facility-controls facility-desktop-controls" aria-label="지도 확대 조절">
      <button onClick={() => zoomAt(.82)} aria-label="확대">＋</button>
      <button onClick={() => zoomAt(1.22)} aria-label="축소">－</button>
      <button onClick={resetCamera} aria-label="지도 초기화">⌖</button>
    </div>
  </div>
  <div className="facility-mobile-controls" aria-label="지도 확대 조절"><span>지도 확대</span>
    <button onClick={() => zoomAt(.82)} aria-label="확대">＋</button>
    <button onClick={() => zoomAt(1.22)} aria-label="축소">－</button>
    <button onClick={resetCamera} aria-label="지도 초기화">⌖</button>
  </div></>;
}
