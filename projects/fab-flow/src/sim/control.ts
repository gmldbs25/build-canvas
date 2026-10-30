import type { Layout, Link, Point, Vehicle } from './types';
import { pathForLink, pathLength } from './geometry';

export type MovementBlocker = { vehicleId: string; resource: string };
export type TickProtection = {
  originHeld(vehicle: Vehicle): boolean;
  blockers(link: Link, vehicleId: string): MovementBlocker[];
  nodeBlockers(nodeId: string, vehicleId: string): MovementBlocker[];
  acquire(link: Link, vehicleId: string): void;
  arrive(nodeId: string, vehicleId: string): void;
};

const CLEARANCE = 36;
type StaticGeometry = {
  links: Map<string, Link>;
  nodes: Map<string, Layout['nodes'][number]>;
  section: Map<string, string>;
  paths: Map<string, Point[]>;
  conflictingLinks: Map<string, string[]>;
  nearNodes: Map<string, string[]>;
  nearbyNodes: Map<string,string[]>;
  linksNearNode: Map<string,string[]>;
  incidentLinks: Map<string,string[]>;
  originReleaseProgress: Map<string, number>;
};
const geometryCache = new Map<string, StaticGeometry>();
const geometryByLayout = new WeakMap<Layout, StaticGeometry>();

function sectionKeys(layout: Layout): Map<string, string> {
  const result = new Map<string, string>();
  const byFrom = new Map<string, Link[]>();
  for (const l of layout.links) byFrom.set(l.from, [...(byFrom.get(l.from) ?? []), l]);
  for(const edges of byFrom.values())edges.sort((a,b)=>a.id.localeCompare(b.id));
  for (const link of layout.links) {
    if (link.resource) result.set(link.id, `resource:${link.resource}`);
    else {
      const reverse = byFrom.get(link.to)?.find(candidate => candidate.to === link.from);
      result.set(link.id, reverse ? `pair:${[link.id, reverse.id].sort().join('|')}` : `link:${link.id}`);
    }
  }
  return result;
}

function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/len)) : 0;
  return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}
function orient(a: Point,b: Point,c: Point): number { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
function intersects(a: Point,b: Point,c: Point,d: Point): boolean {
  const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
  const within=(p:Point,q:Point,r:Point)=>r.x>=Math.min(p.x,q.x)-1e-9&&r.x<=Math.max(p.x,q.x)+1e-9&&r.y>=Math.min(p.y,q.y)-1e-9&&r.y<=Math.max(p.y,q.y)+1e-9;
  return (o1===0&&within(a,b,c))||(o2===0&&within(a,b,d))||(o3===0&&within(c,d,a))||(o4===0&&within(c,d,b))||(((o1<0&&o2>0)||(o1>0&&o2<0))&&((o3<0&&o4>0)||(o3>0&&o4<0)));
}
function segmentDistance(a: Point,b: Point,c: Point,d: Point): number {
  if (intersects(a,b,c,d)) return 0;
  return Math.min(pointSegmentDistance(a,c,d),pointSegmentDistance(b,c,d),pointSegmentDistance(c,a,b),pointSegmentDistance(d,a,b));
}
function pathDistance(a: readonly Point[], b: readonly Point[]): number {
  let min = Infinity;
  const aa=a.length===1?[a[0],a[0]]:a,bb=b.length===1?[b[0],b[0]]:b;
  for (let i=1;i<aa.length;i++) for (let j=1;j<bb.length;j++) min=Math.min(min,segmentDistance(aa[i-1],aa[i],bb[j-1],bb[j]));
  return min;
}
function suffix(points: Point[], progress: number): Point[] {
  const total=pathLength(points), target=total*Math.max(0,Math.min(1,progress));
  if (!total) return points;
  const result:Point[]=[]; let covered=0;
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);
    if(covered+length<target){covered+=length;continue;}
    const t=length?(target-covered)/length:1;
    result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},b);
    for(let j=i+1;j<points.length;j++) result.push(points[j]);
    break;
  }
  return result.length?result:[points[points.length-1]];
}

type Bounds = { minX:number;maxX:number;minY:number;maxY:number };
const pathBounds = new WeakMap<readonly Point[], Bounds>();
function bounds(points: readonly Point[]): Bounds {
  let result=pathBounds.get(points);if(result)return result;
  result={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
  for(const p of points){result.minX=Math.min(result.minX,p.x);result.maxX=Math.max(result.maxX,p.x);result.minY=Math.min(result.minY,p.y);result.maxY=Math.max(result.maxY,p.y);}
  pathBounds.set(points,result);return result;
}
/** Conservative V4 broad phase: only skip narrow geometry when the lower bound is already clear. */
function boundedPathDistance(a: readonly Point[], b: readonly Point[]): number {
  const aa=bounds(a),bb=bounds(b);
  const lower=Math.hypot(Math.max(0,aa.minX-bb.maxX,bb.minX-aa.maxX),Math.max(0,aa.minY-bb.maxY,bb.minY-aa.maxY));
  return lower>=CLEARANCE+1e-8?lower:pathDistance(a,b);
}

function buildGeometry(layout: Layout): StaticGeometry {
  const known = geometryByLayout.get(layout); if (known) return known;
  const signature=JSON.stringify([layout.id,layout.nodes.map(n=>[n.id,n.x,n.y,n.floor]),layout.links.map(l=>[l.id,l.from,l.to,l.kind,l.resource,l.path])]);
  const cached=geometryCache.get(signature); if(cached){geometryByLayout.set(layout,cached);return cached;}
  // The new layout avoids repeated linear node scans during cold certification.
  // Historical layouts retain their previous lookup path.
  const indexedNodes=layout.topologyVersion==='6'?new Map(layout.nodes.map(n=>[n.id,n])):undefined;
  const nodeAt=(id:string)=>indexedNodes?indexedNodes.get(id):layout.nodes.find(n=>n.id===id);
  const distance=(layout.topologyVersion==='6')?boundedPathDistance:pathDistance;
  const section=sectionKeys(layout),paths=new Map(layout.links.map(l=>[l.id,pathForLink(layout,l)]));
  const conflicts=new Map<string,string[]>(),nearNodes=new Map<string,string[]>(),nearbyNodes=new Map<string,string[]>(),linksNearNode=new Map<string,string[]>(),incidentLinks=new Map<string,string[]>(),release=new Map<string,number>();
  for(const node of layout.nodes) {
    nearbyNodes.set(node.id,layout.nodes.filter(other=>other.id!==node.id&&other.floor===node.floor&&Math.hypot(other.x-node.x,other.y-node.y)<CLEARANCE).map(other=>other.id));
    incidentLinks.set(node.id,layout.links.filter(link=>link.from===node.id||link.to===node.id).map(link=>link.id));
  }
  for(let i=0;i<layout.links.length;i++) for(let j=i+1;j<layout.links.length;j++) {
    const a=layout.links[i],b=layout.links[j];
    if(section.get(a.id)===section.get(b.id)||a.from===b.from||a.from===b.to||a.to===b.from||a.to===b.to)continue;
    const af=nodeAt(a.from)?.floor,bf=nodeAt(b.from)?.floor;
    if(af!==undefined&&bf!==undefined&&af!==bf)continue;
    if(distance(paths.get(a.id)!,paths.get(b.id)!)<CLEARANCE) {
      conflicts.set(a.id,[...(conflicts.get(a.id)??[]),b.id]); conflicts.set(b.id,[...(conflicts.get(b.id)??[]),a.id]);
    }
  }
  for(const link of layout.links) {
    const points=paths.get(link.id)!;
    nearNodes.set(link.id,layout.nodes.filter(n=>n.id!==link.from&&n.id!==link.to&&nodeAt(link.from)?.floor===n.floor&&distance(points,[{x:n.x,y:n.y},{x:n.x,y:n.y}])<CLEARANCE).map(n=>n.id));
    for(const nodeId of nearNodes.get(link.id)!)linksNearNode.set(nodeId,[...(linksNearNode.get(nodeId)??[]),link.id]);
    const neighbors=layout.links.filter(other=>(other.from===link.from||other.to===link.from)&&section.get(other.id)!==section.get(link.id));
    let progress=0;
    if(neighbors.length) {
      const clearanceAt=(p:number)=>distance(suffix(points,p),[{x:nodeAt(link.from)!.x,y:nodeAt(link.from)!.y}])>=CLEARANCE+1e-8&&neighbors.every(other=>distance(suffix(points,p),paths.get(other.id)!)>=CLEARANCE+1e-8);
      if(!clearanceAt(1)) progress=1;
      else { let lo=0,hi=1; for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(clearanceAt(mid))hi=mid;else lo=mid;} progress=hi; }
    } else {
      const origin=nodeAt(link.from)!;
      const clearanceAt=(p:number)=>distance(suffix(points,p),[{x:origin.x,y:origin.y}])>=CLEARANCE+1e-8;
      if(!clearanceAt(1))progress=1;
      else {let lo=0,hi=1;for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(clearanceAt(mid))hi=mid;else lo=mid;}progress=hi;}
    }
    release.set(link.id,progress);
  }
  const result={links:new Map(layout.links.map(link=>[link.id,link])),nodes:new Map(layout.nodes.map(node=>[node.id,node])),section,paths,conflictingLinks:conflicts,nearNodes,nearbyNodes,linksNearNode,incidentLinks,originReleaseProgress:release};
  geometryCache.set(signature,result);
  if(geometryCache.size>32)geometryCache.delete(geometryCache.keys().next().value!);
  return result;
}

/** Cached static certificates for the immutable rail geometry. */
export function getControlGeometry(layout: Layout): { originReleaseProgress: Map<string,number>; conflictingLinks: Map<string,string[]>; nearNodes: Map<string,string[]>; physicalSections: Map<string,string> } {
  const g=buildGeometry(layout); return {originReleaseProgress:g.originReleaseProgress,conflictingLinks:g.conflictingLinks,nearNodes:g.nearNodes,physicalSections:g.section};
}

export function createTickProtection(layout: Layout, vehicles: Vehicle[], releaseOrigins = true): TickProtection {
  const g=buildGeometry(layout), links=g.links, nodes=g.nodes;
  const stationary=new Map<string,Set<string>>(), linkOwners=new Map<string,Set<string>>(), sectionOwners=new Map<string,Set<string>>(), heldOrigins=new Set<string>();
  const add=(map:Map<string,Set<string>>,key:string,id:string)=>{if(!map.has(key))map.set(key,new Set());map.get(key)!.add(id);};
  const held=(v:Vehicle)=>!!v.link && (!releaseOrigins || v.progress < (g.originReleaseProgress.get(v.link)??0));
  for(const v of vehicles) {
    if(v.parked)continue;
    if(v.link) {
      const l=links.get(v.link); if(!l)continue; add(linkOwners,l.id,v.id); add(sectionOwners,g.section.get(l.id)!,v.id); if(held(v))heldOrigins.add(v.id);
    } else add(stationary,v.node,v.id);
  }
  const blockersForNode=(nodeId:string,requester:string):MovementBlocker[]=>{
    const result:MovementBlocker[]=[]; const n=nodes.get(nodeId); if(!n)return result;
    for(const at of [nodeId,...(g.nearbyNodes.get(nodeId)??[])]) for(const owner of stationary.get(at)??[])if(owner!==requester)result.push({vehicleId:owner,resource:`node:${at}`});
    const candidateIds=new Set([...(g.incidentLinks.get(nodeId)??[]),...(g.linksNearNode.get(nodeId)??[])]);
    for(const linkId of candidateIds) for(const owner of linkOwners.get(linkId)??[]) if(owner!==requester) {
      const l=links.get(linkId)!;
      const incident=l.to===nodeId || (l.from===nodeId&&heldOrigins.has(owner));
      const nearby=!incident&&g.nearNodes.get(linkId)?.includes(nodeId);
      if(incident||nearby)result.push({vehicleId:owner,resource:incident?`node:${l.to===nodeId?l.to:l.from}`:`geometry:${l.id}`});
    }
    return result;
  };
  const dedupe=(items:MovementBlocker[])=>[...new Map(items.map(b=>[`${b.vehicleId}\0${b.resource}`,b])).values()].sort((a,b)=>a.vehicleId.localeCompare(b.vehicleId)||a.resource.localeCompare(b.resource));
  return {
    originHeld:vehicle=>!!vehicle.link&&heldOrigins.has(vehicle.id),
    blockers(link,vehicleId) {
      const result:MovementBlocker[]=[]; const section=g.section.get(link.id)!;
      for(const owner of sectionOwners.get(section)??[])if(owner!==vehicleId)result.push({vehicleId:owner,resource:section});
      for(const linkId of g.conflictingLinks.get(link.id)??[])for(const owner of linkOwners.get(linkId)??[])if(owner!==vehicleId)result.push({vehicleId:owner,resource:`geometry:${linkId}`});
      for(const nodeId of [link.from,link.to]) result.push(...blockersForNode(nodeId,vehicleId));
      // The path is already within clearance of these nodes. Check their direct
      // stationary owners only; expanding each node's own neighborhood would
      // create an unintended 72-unit guard band.
      for(const nodeId of g.nearNodes.get(link.id)??[])for(const owner of stationary.get(nodeId)??[])if(owner!==vehicleId)
        result.push({vehicleId:owner,resource:`node:${nodeId}`});
      return dedupe(result);
    },
    nodeBlockers: blockersForNode,
    acquire(link,vehicleId) { add(linkOwners,link.id,vehicleId); add(sectionOwners,g.section.get(link.id)!,vehicleId); heldOrigins.add(vehicleId); },
    arrive(nodeId,vehicleId) { add(stationary,nodeId,vehicleId); },
  };
}
