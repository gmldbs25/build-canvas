import type { Layout, Link, Point } from './types';
import { pathLength } from './geometry';

function segmentIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(den) < 1e-8) {
    const offset = (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
    if (Math.abs(offset) > 1e-8) return null;
    const length2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (length2 < 1e-12) return null;
    const tc = ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / length2;
    const td = ((d.x - a.x) * (b.x - a.x) + (d.y - a.y) * (b.y - a.y)) / length2;
    const low = Math.max(0, Math.min(tc, td)), high = Math.min(1, Math.max(tc, td));
    if (high < low - 1e-8) return null;
    const t = (low + high) / 2;
    return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  }
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
  if (t < -1e-8 || t > 1 + 1e-8 || u < -1e-8 || u > 1 + 1e-8) return null;
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}
function segmentHitsRect(a: Point, b: Point, rect: { x: number; y: number; width: number; height: number }) {
  let low = 0, high = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - rect.x], [dx, rect.x + rect.width - a.x], [-dy, a.y - rect.y], [dy, rect.y + rect.height - a.y]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
    if (low > high) return false;
  }
  return true;
}

/** Checks graph integrity, directed port access, nonzero geometry and accidental interior crossings. */
type TopologyLayout = Omit<Layout, 'id'>;

export function validateTopology(layout: TopologyLayout): string[] {
  const errors: string[] = [], nodeById = new Map(layout.nodes.map(node => [node.id, node])), linkById = new Map(layout.links.map(link => [link.id, link]));
  if (nodeById.size !== layout.nodes.length) errors.push('duplicate node id');
  if (linkById.size !== layout.links.length) errors.push(`duplicate link ids: ${layout.links.filter((link, i) => layout.links.findIndex(other => other.id === link.id) !== i).map(link => link.id).join(', ')}`);
  const portIds = new Set(layout.ports.map(port => port.id));
  if (portIds.size !== layout.ports.length) errors.push(`duplicate port ids: ${layout.ports.filter((port, i) => layout.ports.findIndex(other => other.id === port.id) !== i).map(port => port.id).join(', ')}`);
  const liftersByResource = new Map<string, Link[]>();
  for (const link of layout.links) {
    const from = nodeById.get(link.from), to = nodeById.get(link.to);
    if (!from || !to) errors.push(`link ${link.id} has missing endpoint`);
    if (from && to && from.floor === to.floor && from.x === to.x && from.y === to.y) errors.push(`link ${link.id} has zero geometric length`);
    if (!(link.length > 0) || !Number.isFinite(link.length)) errors.push(`link ${link.id} has invalid length`);
    if (link.kind === 'lifter' && from && to) {
      if (from.floor === to.floor) errors.push(`lifter ${link.id} does not change floor`);
      if (!link.resource) errors.push(`lifter ${link.id} has no shared resource`);
      if (Math.hypot(from.x - to.x, from.y - to.y) > 1e-6) errors.push(`lifter ${link.id} has mismatched shaft coordinates`);
      if (link.capacity !== 1) errors.push(`lifter ${link.id} must have exclusive capacity 1`);
      if (!link.path || link.path.length < 2 || link.path.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) errors.push(`lifter ${link.id} has invalid transfer path`);
      else if (Math.hypot(link.path[0].x - from.x, link.path[0].y - from.y) > 1e-6 || Math.hypot(link.path.at(-1)!.x - to.x, link.path.at(-1)!.y - to.y) > 1e-6) errors.push(`lifter ${link.id} path endpoint mismatch`);
      if (link.resource) liftersByResource.set(link.resource, [...(liftersByResource.get(link.resource) ?? []), link]);
    } else if (link.kind !== 'lifter' && from && to && from.floor !== to.floor) {
      errors.push(`non-lifter ${link.kind} ${link.id} crosses floors`);
    }
  }
  for (const [resource, links] of liftersByResource) {
    if (links.length !== 2) errors.push(`lifter resource ${resource} must have exactly two directed links`);
    if (links.length === 2 && (links[0].from !== links[1].to || links[0].to !== links[1].from)) errors.push(`lifter resource ${resource} lacks a reverse direction`);
  }
  const adjacency = new Map<string, string[]>();
  for (const link of layout.links) adjacency.set(link.from, [...(adjacency.get(link.from) ?? []), link.to]);
  const reachable = (source: string) => { const seen = new Set([source]), stack = [source]; while (stack.length) for (const next of adjacency.get(stack.pop()!) ?? []) if (!seen.has(next)) { seen.add(next); stack.push(next); } return seen; };
  for (const port of layout.ports) if (!nodeById.has(port.node)) errors.push(`port ${port.id} has missing node`);
  const sources = layout.ports[0] ? reachable(layout.ports[0].node) : new Set<string>();
  for (const port of layout.ports) if (!sources.has(port.node)) errors.push(`port ${port.id} is unreachable from ${layout.ports[0]?.id ?? 'any port'}`);
  const fromPort = new Map<string, Set<string>>();
  for (const port of layout.ports) if (!fromPort.has(port.node)) fromPort.set(port.node, reachable(port.node));
  for (const port of layout.ports) for (const target of layout.ports) if (!fromPort.get(port.node)!.has(target.node)) errors.push(`port ${target.id} is not directed-reachable from ${port.id}`);
  const v4Bounds = layout.topologyVersion === '6' ? new Map(layout.links.map(link => {
    const p=link.path??[];return [link.id,{minX:Math.min(...p.map(p=>p.x)),maxX:Math.max(...p.map(p=>p.x)),minY:Math.min(...p.map(p=>p.y)),maxY:Math.max(...p.map(p=>p.y))}];
  })) : undefined;
  const seenPairs = new Set<string>();
  for (let i = 0; i < layout.links.length; i++) for (let j = i + 1; j < layout.links.length; j++) {
    const a = layout.links[i], b = layout.links[j];
    const aFrom=nodeById.get(a.from),aTo=nodeById.get(a.to),bFrom=nodeById.get(b.from),bTo=nodeById.get(b.to);
    // Planar crossings only have meaning when both links occupy the same floor.
    // Lifter links intentionally connect identical x/y coordinates on different floors.
    if(a.kind==='lifter'||b.kind==='lifter'||!aFrom||!aTo||!bFrom||!bTo||aFrom.floor!==bFrom.floor||aTo.floor!==bTo.floor)continue;
    if(v4Bounds){const aa=v4Bounds.get(a.id)!,bb=v4Bounds.get(b.id)!;
      if(aa.maxX<bb.minX-1e-8||bb.maxX<aa.minX-1e-8||aa.maxY<bb.minY-1e-8||bb.maxY<aa.minY-1e-8)continue;}
    const aEnds = [a.from, a.to].sort().join('|'), bEnds = [b.from, b.to].sort().join('|');
    if (aEnds === bEnds) continue; // Opposing links are the same physical track.
    const pair = [aEnds, bEnds].sort().join('::'); if (seenPairs.has(pair)) continue; seenPairs.add(pair);
    const ap = a.path ?? [], bp = b.path ?? [];
    const commonNodes = [a.from, a.to].filter(id => id === b.from || id === b.to).map(id => nodeById.get(id)!).filter(Boolean);
    for (let ai = 1; ai < ap.length; ai++) for (let bi = 1; bi < bp.length; bi++) {
      const point = segmentIntersection(ap[ai - 1], ap[ai], bp[bi - 1], bp[bi]);
      if (point && !commonNodes.some(node => Math.hypot(node.x - point.x, node.y - point.y) < 1e-6)) errors.push(`links ${a.id} and ${b.id} cross at ${point.x.toFixed(1)},${point.y.toFixed(1)} without a junction`);
    }
  }
  for (const link of layout.links) for (const equipment of layout.facility?.equipment ?? []) {
    const from=nodeById.get(link.from);
    if(!from||equipment.floor!==from.floor)continue;
    if (link.id.includes(equipment.portId)) continue;
    if(v4Bounds){const b=v4Bounds.get(link.id)!;if(b.maxX<equipment.x||b.minX>equipment.x+equipment.width||b.maxY<equipment.y||b.minY>equipment.y+equipment.height)continue;}
    const path = link.path ?? [];
    for (let i = 1; i < path.length; i++) if (segmentHitsRect(path[i - 1], path[i], equipment)) errors.push(`link ${link.id} passes through ${equipment.id}`);
  }
  for (const park of layout.parkingNodes ?? []) if (!nodeById.has(park)) errors.push(`parking node ${park} is missing`);
  return [...new Set(errors)];
}

export function validateTopologyV6(layout: TopologyLayout): string[] {
  const errors=validateTopology(layout);
  const stops=new Set([...layout.ports.map(p=>p.node),...(layout.parkingNodes??[])]);
  const out=new Map<string,Link[]>();for(const l of layout.links)out.set(l.from,[...(out.get(l.from)??[]),l]);
  for(const source of stops){
    const seen=new Set([source]),stack=[source];
    while(stack.length){const at=stack.pop()!;if(at!==source&&stops.has(at))continue;
      for(const l of out.get(at)??[])if(!seen.has(l.to)){seen.add(l.to);stack.push(l.to);}}
    for(const target of stops)if(!seen.has(target))errors.push(`Restricted path missing ${source} -> ${target}`);
  }
  const byNode=new Map(layout.nodes.map(n=>[n.id,n]));
  const diff=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180);
  for(const l of layout.links){const p=l.path??[],a=byNode.get(l.from),b=byNode.get(l.to);
    // A lift has no planar rail curve: its path remains at the shaft footprint
    // while the vehicle changes floor. Its timed transfer is engine behavior.
    if(l.kind==='lifter')continue;
    if(!a||!b||p.length<2)continue;
    const floor=layout.facility?.floorBounds.find(f=>f.floor===a.floor);
    if(floor&&p.some(p=>p.x<floor.x+18||p.x>floor.x+floor.width-18||p.y<floor.y+18||p.y>floor.y+floor.height-18))errors.push(`Rail/body envelope outside floor ${l.id}`);
    if(p.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.tangent)))errors.push(`Nonfinite curve ${l.id}`);
    if(Math.hypot(p[0].x-a.x,p[0].y-a.y)>1e-7||Math.hypot(p.at(-1)!.x-b.x,p.at(-1)!.y-b.y)>1e-7)errors.push(`Curve endpoint mismatch ${l.id}`);
    if(diff(p[0].tangent!,a.heading!)>1e-7||diff(p.at(-1)!.tangent!,b.heading!)>1e-7)errors.push(`Curve heading mismatch ${l.id}`);
    for(let i=1;i<p.length;i++)if(diff(p[i-1].tangent!,p[i].tangent!)>12)errors.push(`Under-sampled bend ${l.id}`);
    if(Math.abs(l.length-pathLength(p)/8)>1e-8)errors.push(`Curve length mismatch ${l.id}`);
  }
  return errors;
}
