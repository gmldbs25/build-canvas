import type { Node, Point } from './types';

/** Authored V4 tangents are degrees in XY; dimensions are educational game units. */
export function cubicRail(from: Node, to: Node, handle?: number, sampling?: { spans: number; chordError: number }): Point[] {
  if (from.heading === undefined || to.heading === undefined) throw new Error('V4 rails require oriented endpoints.');
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if(distance<1e-8)throw new Error('V4 curve endpoints must differ.');
  const direction = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
  const delta = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
  if (delta(direction, from.heading) < 1e-7 && delta(direction, to.heading) < 1e-7) {
    return [{ x: from.x, y: from.y, tangent: from.heading }, { x: to.x, y: to.y, tangent: to.heading }];
  }
  const h = handle ?? Math.min(90, distance * .45);
  const a = from.heading * Math.PI / 180, b = to.heading * Math.PI / 180;
  const c = { x: from.x + Math.cos(a) * h, y: from.y + Math.sin(a) * h };
  const d = { x: to.x - Math.cos(b) * h, y: to.y - Math.sin(b) * h };
  const sample=(t:number):Point => {
    const u=1-t;
    const dx=3*u*u*(c.x-from.x)+6*u*t*(d.x-c.x)+3*t*t*(to.x-d.x);
    const dy=3*u*u*(c.y-from.y)+6*u*t*(d.y-c.y)+3*t*t*(to.y-d.y);
    if(Math.hypot(dx,dy)<1e-8)throw new Error('Degenerate V4 curve tangent.');
    return {x:u*u*u*from.x+3*u*u*t*c.x+3*u*t*t*d.x+t*t*t*to.x,
      y:u*u*u*from.y+3*u*u*t*c.y+3*u*t*t*d.y+t*t*t*to.y,
      tangent:t===0?from.heading:t===1?to.heading:Math.atan2(dy,dx)*180/Math.PI};
  };
  const points:Point[]=[sample(0)];
  // Refine only curved spans. Bounds are game presentation tolerances, not plant standards.
  const append=(start:number,end:number,depth=0) => {
    const a=sample(start),b=sample(end),mid=sample((start+end)/2);
    const chordError=Math.hypot(mid.x-(a.x+b.x)/2,mid.y-(a.y+b.y)/2);
    if(depth<8&&(delta(a.tangent!,b.tangent!)>6||chordError>(sampling?.chordError ?? .12))){
      const m=(start+end)/2;append(start,m,depth+1);append(m,end,depth+1);
    }else points.push(b);
  };
  const spans=sampling?.spans ?? 48;
  for(let i=0;i<spans;i++)append(i/spans,(i+1)/spans);
  return points;
}
