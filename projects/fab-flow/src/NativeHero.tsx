import { useEffect, useRef, useState } from 'react';
import { Engine } from './native/engine';
import { defaultScenario } from './native/layouts';
import { confirmedMotion } from './native/motion';
import { vehiclePosition } from './native/geometry';
import type { Layout, Point, Vehicle } from './native/types';

const TICK_MS = 150;
const MAX_DPR = 2;
type Coordinate = { x: number; y: number };
type Camera = { project: (x: number, y: number) => Coordinate; width: number; height: number };
type Pose = NonNullable<ReturnType<typeof vehiclePosition>>;
type VehicleTrack = { vehicle: Vehicle; at: (fraction: number) => Pose };
type Status = { time: number; active: number; vehicles: number; delivered: number };

function buildCamera(layout: Layout, width: number, height: number): Camera {
  const world = (x: number, y: number): Coordinate => ({ x: x - y, y: (x + y) * 0.48 });
  const corners: Coordinate[] = [];
  const bounds = layout.facility?.floorBounds ?? [{ floor: 0, x: 0, y: 0, width: layout.width, height: layout.height }];
  for (const b of bounds) {
    corners.push(world(b.x, b.y), world(b.x + b.width, b.y),
      world(b.x + b.width, b.y + b.height), world(b.x, b.y + b.height));
  }
  for (const node of layout.nodes) corners.push(world(node.x, node.y));
  const left = Math.min(...corners.map(p => p.x));
  const right = Math.max(...corners.map(p => p.x));
  const top = Math.min(...corners.map(p => p.y));
  const bottom = Math.max(...corners.map(p => p.y));
  const scale = Math.min(width * 0.91 / Math.max(1, right - left), height * 0.79 / Math.max(1, bottom - top));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  return {
    width, height,
    project(x, y) {
      const p = world(x, y);
      return { x: (p.x - centerX) * scale + width / 2, y: (p.y - centerY) * scale + height * 0.52 };
    },
  };
}

function polygon(ctx: CanvasRenderingContext2D, points: Coordinate[], fill: string, stroke?: string, lineWidth = 1) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}
function rectPoints(camera: Camera, x: number, y: number, width: number, height: number): Coordinate[] {
  return [camera.project(x, y), camera.project(x + width, y),
    camera.project(x + width, y + height), camera.project(x, y + height)];
}
const EQUIPMENT_COLORS: Record<string, string> = {
  etch: '#92bba8', deposition: '#8fc5b8', lithography: '#a6c5b0',
  metrology: '#c3d7ca', wet: '#b5d4cc', buffer: '#c7d6c8', stocker: '#8fac9f',
};
function drawEquipment(ctx: CanvasRenderingContext2D, camera: Camera, equipment: {
  x: number; y: number; width: number; height: number; variant: string;
}) {
  const points = rectPoints(camera, equipment.x, equipment.y, equipment.width, equipment.height);
  const elevation = 6;
  polygon(ctx, [points[1], points[2],
    {x: points[2].x, y: points[2].y + elevation},
    {x: points[1].x, y: points[1].y + elevation}], '#749989');
  polygon(ctx, [points[2], points[3],
    {x: points[3].x, y: points[3].y + elevation},
    {x: points[2].x, y: points[2].y + elevation}], '#84a797');
  polygon(ctx, points, EQUIPMENT_COLORS[equipment.variant] ?? '#a9c7b7', '#709987', 0.7);
  const cx = (points[0].x + points[2].x) / 2;
  const cy = (points[0].y + points[2].y) / 2;
  ctx.fillStyle = 'rgba(244,250,241,.72)';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.3, 0, Math.PI * 2);
  ctx.fill();
}
function renderStatic(ctx: CanvasRenderingContext2D, layout: Layout, camera: Camera) {
  const { width, height } = camera;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#eaf1eb';
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(width * .5, height * .48, width * .08, width * .5, height * .48, width * .74);
  gradient.addColorStop(0, 'rgba(255,255,255,.35)');
  gradient.addColorStop(1, 'rgba(76,117,98,.10)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const b of layout.facility?.floorBounds ?? [{floor: 0, x: 0, y: 0, width: layout.width, height: layout.height}]) {
    const floor = rectPoints(camera, b.x, b.y, b.width, b.height);
    polygon(ctx, floor.map(p => ({x: p.x + 4, y: p.y + 12})), 'rgba(35,64,49,.12)');
    polygon(ctx, floor, '#f4f5ed', '#c4d2c4', 1.1);
  }
  for (const area of layout.areas) {
    if (area.floor !== 0) continue;
    polygon(ctx, rectPoints(camera, area.x, area.y, area.width, area.height),
      'rgba(225,235,224,.38)', 'rgba(139,169,150,.34)', 0.8);
    const label = camera.project(area.x + area.width / 2, area.y + area.height / 2);
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = 'rgba(50,87,70,.37)';
    ctx.textAlign = 'center';
    ctx.fillText(area.name, label.x, label.y);
  }
  const facility = layout.facility;
  if (facility) {
    for (const equipment of facility.decorativeEquipment ?? []) {
      if (equipment.floor === 0) drawEquipment(ctx, camera, equipment);
    }
    for (const equipment of facility.equipment) {
      if (equipment.floor === 0) drawEquipment(ctx, camera, equipment);
    }
  }
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const trace = (link: Layout['links'][number]) => {
    const from = nodes.get(link.from), to = nodes.get(link.to);
    const points: readonly Point[] = link.path?.length ? link.path :
      from && to ? [from, to] : [];
    if (points.length < 2) return false;
    ctx.moveTo(camera.project(points[0].x, points[0].y).x, camera.project(points[0].x, points[0].y).y);
    for (let i = 1; i < points.length; i++) {
      const point = camera.project(points[i].x, points[i].y);
      ctx.lineTo(point.x, point.y);
    }
    return true;
  };
  for (const [stroke, lineWidth] of [['rgba(224,236,221,.98)', 6.4], ['#506b5e', 2.6]] as const) {
    ctx.beginPath();
    for (const link of layout.links) {
      if (link.kind !== 'rail') continue;
      trace(link);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  for (const port of layout.ports) {
    const node = nodes.get(port.node);
    if (!node || node.floor !== 0) continue;
    const point = camera.project(node.x, node.y);
    ctx.fillStyle = '#d8aa63';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOht(ctx: CanvasRenderingContext2D, camera: Camera, vehicle: Vehicle, pose: Pose) {
  if (pose.floor !== 0 || pose.transfer !== undefined) return;
  const spot = camera.project(pose.x, pose.y);
  const radians = (pose.angle ?? 0) * Math.PI / 180;
  const forward = camera.project(pose.x + Math.cos(radians) * 28, pose.y + Math.sin(radians) * 28);
  const rotation = Math.atan2(forward.y - spot.y, forward.x - spot.x);
  const moving = vehicle.phase !== 'idle' && !vehicle.parked;
  const length = moving ? 13 : 9.5;
  const thickness = moving ? 7 : 5.7;
  ctx.save();
  ctx.translate(spot.x, spot.y);
  ctx.rotate(rotation);
  ctx.globalAlpha = vehicle.parked ? 0.5 : 1;
  ctx.fillStyle = 'rgba(29,66,52,.20)';
  ctx.beginPath();
  ctx.ellipse(0, 5, length * .64, thickness * .7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = vehicle.loaded ? '#dc9752' : moving ? '#258e76' : '#9ab6a5';
  ctx.strokeStyle = vehicle.loaded ? '#8b572f' : '#2c6453';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-length/2, -thickness/2, length, thickness, 2.1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = vehicle.loaded ? '#ffe4af' : '#d7f3df';
  ctx.fillRect(length * .08, -thickness * .28, length * .19, thickness * .56);
  ctx.restore();
}

export default function NativeHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const ohtCanvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const [status, setStatus] = useState<Status>({time:0,active:0,vehicles:24,delivered:0});
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = hostRef.current, background = mapCanvasRef.current, foreground = ohtCanvasRef.current;
    if (!host || !background || !foreground) return;
    let engine: Engine;
    try {
      const scenario = {
        ...defaultScenario('medium'),
        fleet: 24, demand: 100, duration: 2400, seed: 47,
        distribution: 'hotspot' as const, pattern: 'steady' as const,
        demandWindow: 1500,
      };
      engine = new Engine(scenario, {analysis:false});
      engine.step(180); // Native deterministic pre-roll, never a fabricated OHT path
    } catch (e) {
      console.error('Native FAB preview initialization failed', e);
      setError(true);
      return;
    }
    const layout = engine.layout;
    let visible = true;
    let disposed = false;
    let frame = 0, tickTime = performance.now();
    let camera: Camera | null = null;
    let lastStats = 0;
    let tracks: VehicleTrack[] = engine.state.vehicles.map(vehicle => ({
      vehicle, at: () => vehiclePosition(layout, vehicle) as Pose,
    }));
    const observer = typeof IntersectionObserver !== 'undefined' ?
      new IntersectionObserver(entries => {
        visible = !!entries[0]?.isIntersecting;
        if (visible) tickTime = performance.now();
      }, {rootMargin:'100px'}) : null;
    observer?.observe(host);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChange = () => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener('change', motionChange);

    const resize = () => {
      if (!background || !foreground) return;
      const rectangle = host.getBoundingClientRect();
      if(rectangle.width < 20 || rectangle.height < 20) return;
      const width = rectangle.width, height = rectangle.height;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      for (const canvas of [background, foreground]) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      camera = buildCamera(layout, width, height);
      const ctx = background.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderStatic(ctx, layout, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const ticker = window.setInterval(() => {
      if(disposed || !playingRef.current || !visible || document.hidden) return;
      try {
        const previous = new Map(engine.state.vehicles.map(vehicle =>
          [vehicle.id, { ...vehicle, route: [...vehicle.route] }] as const));
        engine.step(1);
        tracks = engine.state.vehicles.map(vehicle => {
          const position = vehiclePosition(layout, vehicle);
          try {
            const at = confirmedMotion(layout, previous.get(vehicle.id), vehicle);
            return {vehicle, at};
          } catch {
            return {vehicle, at: () => position as Pose};
          }
        });
        tickTime = performance.now();
        if (tickTime - lastStats > 420) {
          setStatus({
            time: engine.state.time,
            active: engine.state.vehicles.filter(v => v.phase !== 'idle' && !v.parked).length,
            vehicles: engine.state.vehicles.length,
            delivered: engine.state.requests.filter(req => req.phase === 'completed').length,
          });
          lastStats = tickTime;
        }
      } catch (e) {
        console.error('Native FAB preview tick failed', e);
        window.clearInterval(ticker);
        setPlaying(false);
        setError(true);
      }
    }, TICK_MS);

    const paint = () => {
      if (disposed) return;
      if (visible && camera && !document.hidden) {
        const ctx = foreground.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, camera.width, camera.height);
          const fraction = Math.min(1, Math.max(0, (performance.now() - tickTime) / TICK_MS));
          const positions = tracks.map(track => ({
            track,
            pose: track.at(playingRef.current ? fraction : 1),
          })).filter(item => item.pose && Number.isFinite(item.pose.x) && Number.isFinite(item.pose.y));
          positions.sort((a,b) => (a.pose.y + a.pose.x) - (b.pose.y + b.pose.x));
          for (const item of positions) drawOht(ctx, camera, item.track.vehicle, item.pose);
        }
      }
      frame = window.requestAnimationFrame(paint);
    };
    frame = window.requestAnimationFrame(paint);
    return () => {
      disposed = true;
      window.clearInterval(ticker);
      window.cancelAnimationFrame(frame);
      ro.disconnect();
      observer?.disconnect();
      preference.removeEventListener('change', motionChange);
    };
  }, []);

  const time = Math.floor(status.time);
  const timeText = String(Math.floor(time / 60)).padStart(2,'0') + ':' +
    String(time % 60).padStart(2,'0');
  return <div className="native-hero-preview" ref={hostRef}>
    {error ? <img className="native-hero-fallback"
      src={import.meta.env.BASE_URL + 'media/hero-overview.png?v=20261103-2x'}
      alt="실제 FAB FLOW 시뮬레이터의 Medium V6 공장 정지 이미지" /> : <>
      <canvas ref={mapCanvasRef} className="native-hero-map" aria-hidden="true" />
      <canvas ref={ohtCanvasRef} className="native-hero-oht" role="img"
        aria-label="실제 FAB FLOW V6 지도와 물류 엔진을 사용한 실시간 2D 프리뷰. OHT가 레일 위에서 실제 시뮬레이션 상태대로 이동합니다." />
    </>}
    <div className="native-hero-head">
      <span className="native-hero-signal" aria-hidden="true" />
      <strong>FAB FLOW</strong>
      <span>REAL ENGINE / LIGHT VIEW</span>
    </div>
    <div className="native-hero-hud">
      <span>MEDIUM / V6</span>
      <strong>{timeText}</strong>
      <span>OHT {status.vehicles}</span>
      <span>운행 {status.active}</span>
      <span>완료 {status.delivered}</span>
    </div>
    <div className="native-hero-controls">
      <span>{error ? '정적 화면' : '브라우저 실시간 렌더링'}</span>
      {!error && <button type="button" onClick={() => setPlaying(value => !value)}
        aria-label={playing ? '미리보기 일시 정지' : '미리보기 재생'}>
        <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span> {playing ? 'PAUSE' : 'PLAY'}
      </button>}
    </div>
  </div>;
}
