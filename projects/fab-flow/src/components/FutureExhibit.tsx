import { useEffect, useMemo, useState } from 'react';
import type { Layout, Link, Node } from '../sim/types';

/**
 * A visual essay, NOT an engine simulation, AI result or performance forecast.
 * All road shapes and cross-floor candidates are taken from the real directed
 * Multi Large Layout. The FOUP-only handoff is the planned physical redesign.
 */
type Mode = 'transfer' | 'vision' | 'alternatives';
type SuggestedRoute = { resource: string; links: Link[]; length: number };
type DisplayGraph = { rails: string; lifters: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>; routes: SuggestedRoute[]; routePaths: string[] };
const VIEW_W = 740, VIEW_H = 320;
const project = (node: Node) => ({
  x: (node.floor === 0 ? 28 : 390) + node.x / 6400 * 320,
  y: 44 + node.y / 3600 * 224,
});

function directedPath(layout: Layout, startId: string, endId: string, lifterResource: string): SuggestedRoute | null {
  const outgoing = new Map<string, Link[]>();
  for (const link of layout.links) {
    if (link.kind === 'lifter' && link.resource !== lifterResource) continue;
    const found = outgoing.get(link.from) ?? [];
    found.push(link); outgoing.set(link.from, found);
  }
  const cost = new Map<string, number>([[startId, 0]]), parent = new Map<string, Link>();
  const heap: Array<[number, string]> = [];
  function push(item: [number, string]) {
    heap.push(item); let at = heap.length - 1;
    while (at) { const before = (at - 1) >> 1; if (heap[before][0] <= heap[at][0]) break; [heap[before], heap[at]] = [heap[at], heap[before]]; at = before; }
  }
  function pop(): [number, string] | undefined {
    const top = heap[0], last = heap.pop(); if (!top) return undefined;
    if (heap.length && last) { heap[0] = last; let at = 0;
      while (true) { let child = at * 2 + 1; if (child >= heap.length) break;
        if (child + 1 < heap.length && heap[child + 1][0] < heap[child][0]) child++;
        if (heap[at][0] <= heap[child][0]) break;
        [heap[at], heap[child]] = [heap[child], heap[at]]; at = child;
      }
    }
    return top;
  }
  push([0, startId]);
  while (heap.length) {
    const next = pop()!;
    if (next[0] > (cost.get(next[1]) ?? Infinity) + 1e-7) continue;
    if (next[1] === endId) break;
    for (const link of outgoing.get(next[1]) ?? []) {
      const length = next[0] + Math.max(.01, link.length);
      if (length + 1e-7 >= (cost.get(link.to) ?? Infinity)) continue;
      cost.set(link.to, length); parent.set(link.to, link); push([length, link.to]);
    }
  }
  if (!cost.has(endId)) return null;
  const links: Link[] = [], visited = new Set<string>();
  let cursor = endId;
  while (cursor !== startId && !visited.has(cursor)) {
    visited.add(cursor); const link = parent.get(cursor);
    if (!link) return null;
    links.push(link); cursor = link.from;
  }
  links.reverse();
  if (!links.some(link => link.kind === 'lifter' && link.resource === lifterResource)) return null;
  return { resource: lifterResource, links, length: cost.get(endId)! };
}

function buildGraph(layout: Layout): DisplayGraph {
  const nodes = new Map(layout.nodes.map(node => [node.id, node]));
  const pathSegments = (link: Link) => {
    const from = nodes.get(link.from), to = nodes.get(link.to);
    if (!from || !to) return '';
    if (link.kind === 'lifter') { const a = project(from), b = project(to); return 'M'+a.x.toFixed(1)+' '+a.y.toFixed(1)+'L'+b.x.toFixed(1)+' '+b.y.toFixed(1); }
    const samples = link.path && link.path.length > 1 ? [link.path[0],link.path[Math.floor(link.path.length/2)],link.path[link.path.length-1]] : [from,to];
    return samples.map((point,index) => {
      const pos = project({ ...from, x: point.x, y: point.y });
      return (index === 0 ? 'M' : 'L')+pos.x.toFixed(1)+' '+pos.y.toFixed(1);
    }).join('');
  };
  const rails = layout.links.filter(link => link.kind !== 'lifter').map(pathSegments).join(' ');
  const lifters = (layout.lifters ?? []).flatMap(def => {
    const a = nodes.get(def.landingNodes[0]), b = nodes.get(def.landingNodes[1]);
    if (!a || !b) return [];
    const p = project(a), q = project(b);
    return [{ id:def.id, x1:p.x,y1:p.y,x2:q.x,y2:q.y }];
  });
  const lifterResources = (layout.lifters ?? []).map(def => def.resource);
  // Choose cross-floor endpoints only from the published Native topology.
  // The two routes must both be directed, valid and use different real lifts.
  const lower = layout.lifters?.[0]?.entryWaitNodes[0], upper = layout.lifters?.[3]?.exitWaitNodes[1];
  let routes = lower && upper ? lifterResources.map(resource => directedPath(layout,lower,upper,resource)).filter((item):item is SuggestedRoute => !!item) : [];
  if (routes.length < 2) {
    const first = layout.ports.find(port => nodes.get(port.node)?.floor === 0);
    const second = layout.ports.find(port => nodes.get(port.node)?.floor === 1);
    if (first && second) routes = lifterResources.map(resource => directedPath(layout,first.node,second.node,resource)).filter((item):item is SuggestedRoute => !!item);
  }
  const distinct = routes.filter((route,index,array) => array.findIndex(item=>item.resource===route.resource)===index);
  const selected = distinct.length > 1 ? [distinct[0],distinct[distinct.length-1]] : [];
  const routePaths = selected.map(route => route.links.map(pathSegments).join(' '));
  return { rails,lifters,routes:selected,routePaths };
}

function NetworkMap({ graph, view, split }: { graph:DisplayGraph; view:'vision'|'alternatives'; split:number }) {
  const hasPair = graph.routePaths.length === 2;
  return <svg className="w6-intel-map" viewBox={'0 0 '+VIEW_W+' '+VIEW_H} role="img" aria-label={view==='vision'?'실제 다층 FAB 레일과 네 개의 Lifter를 표현한 연결망':'실제 방향성 레일망에서 서로 다른 Lifter를 통과하는 두 개의 가능한 경로'}>
    <defs>
      <linearGradient id="w6-map-road" x1="0" x2="1"><stop stopColor="#639e86" stopOpacity=".42"/><stop offset="1" stopColor="#87a7a0" stopOpacity=".25"/></linearGradient>
      <clipPath id="w6-clip-a"><rect x="0" y="0" width={VIEW_W*split/100} height={VIEW_H}/></clipPath>
      <clipPath id="w6-clip-b"><rect x={VIEW_W*split/100} y="0" width={VIEW_W*(100-split)/100} height={VIEW_H}/></clipPath>
    </defs>
    <rect x="12" y="28" width="352" height="262" rx="16" fill="#102f2b" fillOpacity=".55" stroke="#7db59d" strokeOpacity=".38"/>
    <rect x="376" y="28" width="352" height="262" rx="16" fill="#102f2b" fillOpacity=".55" stroke="#7db59d" strokeOpacity=".38"/>
    <text x="30" y="22" fill="#d5e8dc" fontSize="14" fontWeight="650">1F · LOWER FAB</text>
    <text x="394" y="22" fill="#d5e8dc" fontSize="14" fontWeight="650">2F · UPPER FAB</text>
    <path d={graph.rails} stroke="url(#w6-map-road)" strokeWidth="1.15" fill="none" strokeLinecap="round"/>
    {graph.lifters.map(lifter => <g key={lifter.id}>
      <path d={'M'+lifter.x1+' '+lifter.y1+'L'+lifter.x2+' '+lifter.y2} stroke="#c1c28c" strokeDasharray="3 9" strokeWidth="1.5" opacity=".5"/>
      <circle cx={lifter.x1} cy={lifter.y1} r="6" fill="#f3c779" stroke="#092924" strokeWidth="2"/>
      <circle cx={lifter.x2} cy={lifter.y2} r="6" fill="#f3c779" stroke="#092924" strokeWidth="2"/>
    </g>)}
    {view==='vision' ? <>
      <g className="w6-intel-flow" fill="none" stroke="#69d3be" strokeLinecap="round" strokeWidth="2.4">
        {graph.lifters.map((lifter,i)=><path key={lifter.id} d={'M'+lifter.x1+' '+lifter.y1+'L'+lifter.x2+' '+lifter.y2} strokeDasharray="3 9" style={{animationDelay:(i*.38)+'s'}}/>)}
      </g>
      {graph.lifters.map((lifter,i)=><g key={lifter.id} className="w6-intel-beacon" style={{animationDelay:(i*.28)+'s'}}>
        <circle cx={lifter.x1} cy={lifter.y1} r="14" fill="none" stroke="#64cfb8" strokeOpacity=".7" strokeWidth="1.8"/>
        <circle cx={lifter.x2} cy={lifter.y2} r="14" fill="none" stroke="#64cfb8" strokeOpacity=".7" strokeWidth="1.8"/>
      </g>)}
      <path className="w6-intel-scan" d="M16 50H724" stroke="#ccf8d7" strokeWidth="2" strokeOpacity=".55"/>
    </> : hasPair ? <>
      <g clipPath="url(#w6-clip-a)"><path d={graph.routePaths[0]} stroke="#65d9c2" strokeWidth="4" fill="none" strokeLinejoin="round" strokeLinecap="round"/></g>
      <g clipPath="url(#w6-clip-b)"><path d={graph.routePaths[1]} stroke="#d1a8eb" strokeWidth="4" fill="none" strokeDasharray="7 5" strokeLinejoin="round" strokeLinecap="round"/></g>
      <line x1={VIEW_W*split/100} x2={VIEW_W*split/100} y1="12" y2="304" stroke="#e1eedd" strokeWidth="2"/>
      <rect x={VIEW_W*split/100-11} y="147" width="22" height="30" rx="6" fill="#e4eee6"/>
      <path d={'M'+(VIEW_W*split/100-4)+' 155V168 M'+(VIEW_W*split/100+4)+' 155V168'} stroke="#256151" strokeWidth="1.5"/>
    </> : <text x="370" y="160" textAnchor="middle" fill="#dce8df" fontSize="14">현재 네트워크에서 두 유효 경로를 찾지 못했습니다.</text>}
  </svg>;
}

function CargoTransfer() {
  const [phase,setPhase] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(()=>setPhase(value=>(value+1)%5),1700);
    return ()=>window.clearInterval(timer);
  },[]);
  const positions = [[166,225],[282,225],[353,91],[435,91],[535,91]];
  const [x,y] = positions[phase];
  const labels = ['1F OHT가 FOUP를 가져옵니다','1F 전용 입구에서 FOUP 인계','OHT 없이 FOUP만 층간 이동','2F 전용 출구로 FOUP 반출','2F OHT가 FOUP를 인수합니다'];
  return <div className="w6-intel-transfer" data-cargo-phase={phase}>
    <div className="w6-intel-transfer-head"><strong>OHT는 각자의 층에 남습니다</strong><span>FOUP-ONLY LIFTER · CONCEPT MODEL</span></div>
    <svg viewBox="0 0 700 315" role="img" aria-label="1층 OHT가 FOUP를 내려놓고 Lifter가 FOUP만 2층으로 이동한 뒤 2층 OHT가 인수하는 개념 애니메이션">
      <rect x="22" y="246" width="657" height="9" rx="4" fill="#5c857b"/>
      <rect x="22" y="112" width="657" height="9" rx="4" fill="#5c857b"/>
      <text x="35" y="104" fontSize="15" fill="#d5ebdb" fontWeight="700">2F · UPPER</text>
      <text x="35" y="238" fontSize="15" fill="#d5ebdb" fontWeight="700">1F · LOWER</text>
      <rect x="318" y="65" width="67" height="180" rx="8" fill="#183e3b" stroke="#a7c7ae" strokeWidth="2"/>
      <path d="M337 73V235M366 73V235" stroke="#446f65" strokeWidth="3"/>
      <rect x="262" y="203" width="55" height="40" rx="6" fill="#29584f" stroke="#7dd7bd" strokeDasharray="5 4"/>
      <rect x="386" y="69" width="63" height="40" rx="6" fill="#29584f" stroke="#c6bde3" strokeDasharray="5 4"/>
      <text x="288" y="195" fontSize="11" textAnchor="middle" fill="#bfe9cd">FOUP IN</text>
      <text x="416" y="62" fontSize="11" textAnchor="middle" fill="#e1cdf4">FOUP OUT</text>
      <g fill="#79c8ae" stroke="#296859" strokeWidth="2">
        <rect x="115" y="220" width="92" height="26" rx="11"/>
        <rect x="490" y="86" width="92" height="26" rx="11"/>
      </g>
      <g fill="#174b40"><rect x="135" y="218" width="52" height="7" rx="2"/><rect x="510" y="84" width="52" height="7" rx="2"/></g>
      <text x="162" y="278" fontSize="13" textAnchor="middle" fill="#d3edda">OHT · 1F</text>
      <text x="536" y="146" fontSize="13" textAnchor="middle" fill="#d3edda">OHT · 2F</text>
      <g className="w6-intel-cargo" style={{ transform:'translate('+(x-20)+'px,'+(y-19)+'px)' }}>
        <rect x="0" y="0" width="40" height="30" rx="5" fill="#f4cc86" stroke="#fff1ca" strokeWidth="2"/>
        <rect x="10" y="-6" width="20" height="7" rx="2" fill="#f4cc86"/>
      </g>
      <text x="352" y="299" textAnchor="middle" fontSize="13" fill="#cee0d7">① 인계 → ② FOUP 승강 → ③ 반출 → ④ 인수</text>
    </svg>
    <div className="w6-intel-transfer-status" aria-live="polite"><span>{String(phase+1).padStart(2,'0')} / 05</span><strong>{labels[phase]}</strong></div>
    <button type="button" className="w6-intel-replay" onClick={()=>setPhase(0)}>처음부터 보기 ↺</button>
  </div>;
}

export default function FutureExhibit({layout,mode}:{layout:Layout;mode:Mode}) {
  const [split,setSplit] = useState(50);
  const [revealed,setRevealed] = useState(false);
  const graph = useMemo(()=>buildGraph(layout),[layout]);
  useEffect(()=>{ if(mode!=='vision'){setRevealed(false);return;} const timer=window.setTimeout(()=>setRevealed(true),2200);return()=>window.clearTimeout(timer);},[mode]);
  if(mode==='transfer')return <div className="w6-intel-exhibit" data-testid="fo-only-concept"><CargoTransfer/></div>;
  return <div className={'w6-intel-exhibit w6-intel-exhibit-'+mode} data-testid={'future-'+mode} data-real-route-count={graph.routes.length}>
    <div className="w6-intel-map-head">
      <span>FLOW INTELLIGENCE / FUTURE CONCEPT</span>
      <strong>{mode==='vision'?'보이지 않던 연결망을 읽다':'하나의 공장 · 두 가지 가능성'}</strong>
    </div>
    <NetworkMap graph={graph} view={mode} split={split}/>
    {mode==='vision' ? <div className="w6-intel-status">
      <span className="w6-intel-pulse"/>
      <strong>{revealed?'네 개의 Lifter를 중심으로 서로 다른 층이 연결됩니다':'운송 경로와 층간 연결을 살펴보는 중…'}</strong>
      <small>실제 레일·Lifter 위치 기반 시각화 · 혼잡 진단 결과가 아닙니다</small>
    </div> : <div className="w6-intel-comparison">
      <div className="w6-intel-comparison-labels"><span>A · {graph.routes[0] ? layout.lifters?.find(x=>x.resource===graph.routes[0].resource)?.id : '기존 경로 후보'}</span><span>B · {graph.routes[1] ? layout.lifters?.find(x=>x.resource===graph.routes[1].resource)?.id : '다른 경로 후보'}</span></div>
      <label htmlFor="w6-future-split">두 경로를 비교할 위치</label>
      <input id="w6-future-split" aria-label="두 대안 경로 비교 슬라이더" type="range" min="0" max="100" value={split} onChange={event=>setSplit(Number(event.target.value))}/>
      <small>{graph.routes.length===2?'실제 방향성 레일망에서 계산한 서로 다른 Lifter 경유 가능 경로 · 소요시간과 성능은 비교하지 않았습니다':'두 개의 합법적 층간 경로를 구성하지 못해 경로를 표시하지 않았습니다.'}</small>
    </div>}
  </div>;
}
