import type { Layout, Link, Point, Vehicle } from './types';

export function pathLength(points: readonly Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return length;
}

export function pathHeading(a: Point, b: Point, t: number): number {
  const fallback = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  if (a.tangent === undefined || b.tangent === undefined) return fallback;
  const delta = ((b.tangent - a.tangent + 540) % 360) - 180;
  return a.tangent + delta * t;
}

/** Lift wrapped tangent angles onto one continuous branch along a rail path. */
export function continuousPath(points: readonly Point[]): Point[] {
  let previous: number | undefined;
  return points.map(point => {
    if (point.tangent === undefined) return { ...point };
    let tangent = point.tangent;
    if (previous !== undefined) tangent += 360 * Math.round((previous - tangent) / 360);
    previous = tangent;
    return { ...point, tangent };
  });
}

/** The same polyline is drawn, measured and sampled. No renderer-only curve. */
export function pointAlongPath(points: readonly Point[], progress: number): Point & { angle: number } {
  if (!points.length) throw new Error('A rail path must contain a point.');
  const distance = pathLength(points) * Math.max(0, Math.min(1, progress));
  let remaining = distance;
  let previousTangent = points[0].tangent;
  for (let i = 1; i < points.length; i++) {
    const sourceA = points[i - 1], sourceB = points[i], segment = Math.hypot(sourceB.x - sourceA.x, sourceB.y - sourceA.y);
    if (segment === 0) continue;
    let tangentA = sourceA.tangent, tangentB = sourceB.tangent;
    if (sourceA.tangent !== undefined && sourceB.tangent !== undefined) {
      tangentA = previousTangent === undefined ? sourceA.tangent : sourceA.tangent + 360 * Math.round((previousTangent - sourceA.tangent) / 360);
      tangentB = sourceB.tangent + 360 * Math.round((tangentA - sourceB.tangent) / 360);
      previousTangent = tangentB;
    }
    if (remaining <= segment || i === points.length - 1) {
      const t = Math.min(1, remaining / segment);
      const angle = tangentA !== undefined && tangentB !== undefined
        ? tangentA + (((tangentB - tangentA + 540) % 360) - 180) * t
        : pathHeading(sourceA, sourceB, t);
      return { x: sourceA.x + (sourceB.x - sourceA.x) * t, y: sourceA.y + (sourceB.y - sourceA.y) * t, angle, ...(tangentA !== undefined && tangentB !== undefined ? { tangent: angle } : {}) };
    }
    remaining -= segment;
  }
  return { ...points[points.length - 1], angle: 0 };
}

/** Sample quadratic fillets once; the engine uses their measured polyline length. */
export function roundedPath(points: readonly Point[], radius = 24): Point[] {
  if (points.length < 3) return points.map(p => ({ ...p }));
  const result: Point[] = [{ ...points[0] }];
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1], corner = points[i], after = points[i + 1];
    const incoming = Math.hypot(corner.x - before.x, corner.y - before.y), outgoing = Math.hypot(after.x - corner.x, after.y - corner.y);
    if (!incoming || !outgoing) continue;
    const r = Math.min(radius, incoming / 2, outgoing / 2);
    const start = { x: corner.x + (before.x - corner.x) * r / incoming, y: corner.y + (before.y - corner.y) * r / incoming };
    const end = { x: corner.x + (after.x - corner.x) * r / outgoing, y: corner.y + (after.y - corner.y) * r / outgoing };
    result.push(start);
    for (let step = 1; step <= 12; step++) {
      const t = step / 12, u = 1 - t;
      result.push({ x: u * u * start.x + 2 * u * t * corner.x + t * t * end.x, y: u * u * start.y + 2 * u * t * corner.y + t * t * end.y });
    }
  }
  result.push({ ...points[points.length - 1] });
  return result;
}

export function pathForLink(layout: Layout, link: Link): Point[] {
  if (link.path) return link.path;
  const from = layout.nodes.find(n => n.id === link.from), to = layout.nodes.find(n => n.id === link.to);
  if (!from || !to) throw new Error(`Missing endpoints for ${link.id}`);
  return [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
}

export function vehiclePosition(layout: Layout, vehicle: Vehicle): (Point & { floor: number; angle: number; transfer?: number; transferFromFloor?: number; transferToFloor?: number }) | null {
  const node = layout.nodes.find(n => n.id === vehicle.node);
  if (!node) return null;
  const link = vehicle.link ? layout.links.find(l => l.id === vehicle.link) : undefined;
  if (link?.kind === 'lifter') {
    const destination=layout.nodes.find(n=>n.id===link.to);
    return { x: node.x, y: node.y, floor: node.floor, angle: 270, transfer: vehicle.progress, transferFromFloor: node.floor, transferToFloor: destination?.floor };
  }
  if (link) return { ...pointAlongPath(pathForLink(layout, link), vehicle.progress), floor: node.floor };
  return { x: node.x, y: node.y, floor: node.floor, angle: node.heading ?? 0 };
}
