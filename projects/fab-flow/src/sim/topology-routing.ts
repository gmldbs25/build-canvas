import type { Layout, Link } from './types';

export type RouteCandidate = { nodes: string[]; links: string[]; length: number };

/** Bounded real alternatives, preserving intra-bay shortcut diversity as well as corridors. */
export function candidateRoutesV6(layout: Layout, from: string, to: string, max=3, blockedLinkIds: readonly string[]=[]): RouteCandidate[] {
  const bannedNodes = new Set([...layout.ports.map(p=>p.node),...(layout.parkingNodes??[])].filter(n=>n!==from&&n!==to));
  const outgoing=new Map<string,Link[]>();
  for(const edge of layout.links) outgoing.set(edge.from,[...(outgoing.get(edge.from)??[]),edge]);
  const shortest=(blocked:Set<string>) => {
    const costs=new Map([[from,0]]),prev=new Map<string,Link>(),queue=[{node:from,cost:0}];
    while(queue.length) {
      queue.sort((a,b)=>a.cost-b.cost||a.node.localeCompare(b.node));const current=queue.shift()!;
      if(current.cost>(costs.get(current.node)??Infinity))continue;
      if(current.node===to)break;
      for(const edge of outgoing.get(current.node)??[]) {
        if(blocked.has(edge.id)||bannedNodes.has(edge.to))continue;
        const cost=current.cost+edge.length;
        if(cost+1e-8>=(costs.get(edge.to)??Infinity))continue;
        costs.set(edge.to,cost);prev.set(edge.to,edge);queue.push({node:edge.to,cost});
      }
    }
    if(!costs.has(to))return undefined;
    const nodes=[to],links:string[]=[];let at=to;
    while(at!==from){const edge=prev.get(at)!;links.push(edge.id);at=edge.from;nodes.push(at);}
    return {nodes:nodes.reverse(),links:links.reverse(),length:costs.get(to)!};
  };
  const blocked=new Set(blockedLinkIds),first=shortest(blocked);if(!first)return [];
  const candidates=new Map([[first.links.join('|'),first]]);
  for(const id of first.links) {
    const edge=layout.links.find(e=>e.id===id)!;
    if((outgoing.get(edge.from)?.length??0)<2)continue;
    const route=shortest(new Set([...blocked,id]));if(route)candidates.set(route.links.join('|'),route);
  }
  return [...candidates.values()].sort((a,b)=>a.length-b.length||a.links.join('|').localeCompare(b.links.join('|'))).slice(0,Math.max(1,Math.min(3,max)));
}
