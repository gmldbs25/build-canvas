import { useEffect, useRef, useState } from 'react';
import { Engine, getKpis } from './native/engine';
import { defaultScenario } from './native/layouts';
import { confirmedMotion } from './native/motion';
import { pathForLink, vehiclePosition } from './native/geometry';
import type { Layout, Vehicle } from './native/types';

/**
 * Genuine native engine, V6 topology and confirmed vehicle movement.
 * Only the renderer is deliberately simplified to 2D Canvas.
 * No videos, GIFs, mock paths or simulated KPI values.
 */
type World = {
  engine: Engine;
  layout: Layout;
  motion: Map<string, ReturnType<typeof confirmedMotion>>;
  lastTick: number;
};

const TICK_MS = 150; // native 0.5-second ticks, ~3.3x wall clock
const FRAME_MS = 17; // smooth interpolation; static world geometry is cached

function newWorld(): World {
  const engine = new Engine({
    ...defaultScenario('small'), fleet: 12, demand: 90, duration: 900,
    demandWindow: 720, distribution: 'hotspot', pattern: 'steady', seed: 47,
  }, {analysis: false});
  // Actual engine ticks position OHTs in an active operating world at first paint.
  engine.step(160);
  return {engine, layout: engine.layout, motion: new Map(), lastTick: performance.now()};
}

type CachedMap = {layer: HTMLCanvasElement; width: number; height: number; dpr: number; layout: Layout};
const mapCache = new WeakMap<HTMLCanvasElement, CachedMap>();
function sceneCamera(layout: Layout, width: number, height: number) {
  // On phone screens show the real first bay at readable scale, not two tiny bays.
  const visibleWidth = width < 600 ? layout.width * .53 : layout.width;
  const scale = Math.min((width - 34) / visibleWidth, (height - 70) / layout.height);
  return {
    scale,
    x: (width - visibleWidth * scale) / 2,
    y: (height - layout.height * scale) / 2,
  };
}

/**
 * Paint the V6 facility only when its dimensions change.
 * The 30–60 FPS motion path must draw OHTs, not every bay, machine and rail again.
 */
function paintMap(ctx: CanvasRenderingContext2D, layout: Layout, width: number, height: number) {
  const {scale, x, y} = sceneCamera(layout, width, height);
  const px = (n: number) => n / scale;
  ctx.fillStyle = '#e6eee7';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#f9fbf6';
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.strokeStyle = '#b8ccc1';
  ctx.lineWidth = px(1);
  ctx.strokeRect(0, 0, layout.width, layout.height);
  for (const area of layout.areas) {
    ctx.fillStyle = '#eaf0e7';
    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.strokeStyle = '#c8d9cd';
    ctx.strokeRect(area.x, area.y, area.width, area.height);
  }
  const equipment = [...(layout.facility?.decorativeEquipment ?? []), ...(layout.facility?.equipment ?? [])];
  for (const eq of equipment) {
    ctx.fillStyle = eq.variant === 'stocker' ? '#8db7a3' : eq.variant === 'wet' ? '#abcfc7' : '#b3cfc1';
    ctx.fillRect(eq.x, eq.y, eq.width, eq.height);
    ctx.strokeStyle = '#8cae9e';
    ctx.lineWidth = px(.6);
    ctx.strokeRect(eq.x, eq.y, eq.width, eq.height);
  }
  // The original engine's V6 curved rail paths, not guessed/animated routes.
  for (const link of layout.links) {
    const points = pathForLink(layout, link);
    if (points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = link.kind === 'bridge' ? '#b79064' : '#397769';
    ctx.lineWidth = px(link.kind === 'bridge' ? 2.1 : 1.65);
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  const nodes = new Map(layout.nodes.map(n => [n.id, n]));
  for (const port of layout.ports) {
    const n = nodes.get(port.node);
    if (!n) continue;
    ctx.beginPath();
    ctx.arc(n.x, n.y, px(2.6), 0, Math.PI * 2);
    ctx.fillStyle = '#d7a151';
    ctx.fill();
  }
  ctx.fillStyle = '#285a48';
  ctx.font = '700 ' + px(width < 520 ? 10 : 12) + 'px ui-monospace,monospace';
  for (let i = 0; i < layout.areas.length; i++) {
    const a = layout.areas[i];
    ctx.fillText('BAY ' + String(i + 1).padStart(2, '0'), a.x + px(12), a.y + px(24));
  }
  ctx.restore();
  ctx.fillStyle = '#d9e8db';
  ctx.fillRect(0, height - 30, width, 30);
  ctx.font = '700 10px ui-monospace,monospace';
  ctx.fillStyle = '#486957';
  ctx.fillText(width < 520 ? 'REAL V6 MAP  /  REAL OHT TICKS' :
    'ACTUAL V6 TOPOLOGY  /  NATIVE ENGINE TICKS  /  LIGHTWEIGHT 2D VIEW', 14, height - 11);
}

function draw(canvas: HTMLCanvasElement, world: World, fraction: number) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (width < 20 || height < 20) return;
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
  let cached = mapCache.get(canvas);
  if (!cached || cached.width !== width || cached.height !== height ||
      cached.dpr !== dpr || cached.layout !== world.layout) {
    const layer = document.createElement('canvas');
    layer.width = pixelWidth;
    layer.height = pixelHeight;
    const bg = layer.getContext('2d', {alpha: false});
    if (!bg) return;
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintMap(bg, world.layout, width, height);
    cached = {layer, width, height, dpr, layout: world.layout};
    mapCache.set(canvas, cached);
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const ctx = canvas.getContext('2d', {alpha: false});
  if (!ctx) return;
  // Reuse the stable rasterized facility. Only verified OHT motion changes per frame.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(cached.layer, 0, 0);
  const {layout, engine} = world;
  const {scale, x, y} = sceneCamera(layout, width, height);
  const px = (n: number) => n / scale;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  for (const vehicle of engine.state.vehicles) {
    if (vehicle.parked || vehicle.failed) continue;
    const position = world.motion.get(vehicle.id)?.(fraction) ?? vehiclePosition(layout, vehicle);
    if (!position || position.floor !== 0) continue;
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate((position.angle ?? 0) * Math.PI / 180);
    const w = px(15), h = px(9);
    ctx.fillStyle = '#fcfff4';
    ctx.fillRect(-w / 2 - px(1.2), -h / 2 - px(1.2), w + px(2.4), h + px(2.4));
    ctx.fillStyle = vehicle.loaded ? '#dc9336' : '#1b9278';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#edf8ec';
    ctx.fillRect(w / 4, -h / 3, px(2), h * .66);
    ctx.restore();
  }
}
export default function NativeFabPreview(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const worldRef=useRef<World|null>(null);
  const playingRef=useRef(true);
  const restartRef=useRef<()=>void>(()=>{});
  const [playing,setPlaying]=useState(true);
  const [stats,setStats]=useState({time:0,moving:0,completed:0});
  const [error,setError]=useState('');
  const [reduced,setReduced]=useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    let destroyed=false,visible=true,raf=0,lastPaint=0,lastStats=0;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');

    const paint=(now:number)=>{
      const w=worldRef.current;if(!w||destroyed)return;
      draw(canvas,w,Math.max(0,Math.min(1,(now-w.lastTick)/TICK_MS)));
    };
    const frame=(now:number)=>{
      raf=0;
      if(destroyed||!visible||document.hidden||!playingRef.current||!worldRef.current)return;
      try{
        let w=worldRef.current;
        if(now-w.lastTick>=TICK_MS){
          if(w.engine.state.time>=w.engine.scenario.duration-.5){
            w=newWorld();worldRef.current=w;
          } else {
            const old=new Map(w.engine.state.vehicles.map(v=>[v.id,{...v}]));
            w.engine.step(1);
            w.motion=new Map(w.engine.state.vehicles.map(v=>[
              v.id,confirmedMotion(w.layout,old.get(v.id) as Vehicle|undefined,v),
            ]));
            w.lastTick=now;
          }
        }
        if(now-lastPaint>=FRAME_MS){paint(now);lastPaint=now;}
        if(now-lastStats>=700){
          const engine=worldRef.current.engine;
          setStats({time:engine.state.time,
            moving:engine.state.vehicles.filter(v=>!v.parked && (v.phase==='empty'||v.phase==='loaded')).length,
            completed:getKpis(engine).completed});
          lastStats=now;
        }
      }catch(e){
        setError(e instanceof Error?e.message:'실시간 엔진 오류');
        playingRef.current=false;setPlaying(false);return;
      }
      raf=requestAnimationFrame(frame);
    };
    const resume=()=>{
      if(raf)cancelAnimationFrame(raf);
      raf=0;
      if(!destroyed&&visible&&!document.hidden&&playingRef.current)
        raf=requestAnimationFrame(frame);
      else paint(performance.now());
    };
    restartRef.current=resume;
    try{
      worldRef.current=newWorld();
      const engine=worldRef.current.engine;
      setStats({time:engine.state.time,
        moving:engine.state.vehicles.filter(v=>!v.parked&&v.phase!=='idle').length,
        completed:getKpis(engine).completed});
      paint(performance.now());
    }catch(e){
      setError(e instanceof Error?e.message:'실시간 엔진 초기화 오류');
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0]?.isIntersecting??false;resume();
    },{threshold:.04});
    observer.observe(canvas);
    const resize=new ResizeObserver(()=>paint(performance.now()));
    resize.observe(canvas);
    document.addEventListener('visibilitychange',resume);
    const syncPreference=()=>{
      setReduced(preference.matches);
      if(preference.matches){playingRef.current=false;setPlaying(false);}
      resume();
    };
    preference.addEventListener('change',syncPreference);
    syncPreference();
    return ()=>{
      destroyed=true;
      if(raf)cancelAnimationFrame(raf);
      restartRef.current=()=>{};
      observer.disconnect();resize.disconnect();
      document.removeEventListener('visibilitychange',resume);
      preference.removeEventListener('change',syncPreference);
    };
  },[]);

  const toggle=()=>{
    if(error)return;
    playingRef.current=!playingRef.current;
    setPlaying(playingRef.current);
    restartRef.current();
  };
  return <div className="native-fab-preview" data-testid="native-fab-preview" data-preview-time={stats.time}>
    {error ? <div className="native-preview-fallback">
      <img src={import.meta.env.BASE_URL+'media/hero-overview.png?v=20261103-2x'}
        alt="FAB FLOW 실제 V6 운영 화면 정지 캡처" />
      <p>미리보기 실행 오류. <a href="https://fabflow-yoon.vercel.app/" target="_blank" rel="noreferrer">실제 게임에서 확인</a></p>
    </div> :
      <canvas ref={canvasRef} role="img"
        aria-label="FAB FLOW 실제 V6 소형 공장의 방향성 레일과 원본 엔진이 계산한 OHT 차량 이동을 표시하는 2D 실시간 시뮬레이션" />}
    <div className="native-preview-tag"><span className="native-preview-dot"/> NATIVE ENGINE <span className="native-preview-slash">/</span> SMALL V6</div>
    <div className="native-preview-controls">
      <div className="native-preview-kpis">
        <span>{Math.floor(stats.time)}s <small>SIM TIME</small></span>
        <span>{stats.moving} <small>MOVING OHT</small></span>
        <span>{stats.completed} <small>COMPLETE</small></span>
      </div>
      <button type="button" disabled={!!error} onClick={toggle}
        aria-label={playing?'실시간 미리보기 일시 정지':'실시간 미리보기 재생'}>
        {playing?'Ⅱ PAUSE':'▶ PLAY'}
      </button>
    </div>
    {reduced&&!playing&&<p className="native-preview-reduced">동작 최소화 설정으로 일시 정지됨 · PLAY로 재생 가능</p>}
  </div>;
}
