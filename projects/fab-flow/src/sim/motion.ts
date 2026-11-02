import type { Layout, Point, Vehicle } from './types';
import { continuousPath, pathForLink, pathHeading, pathLength, pointAlongPath, vehiclePosition } from './geometry';
import { continuousVehicleHeading } from './vehicleHeading';

function slicePath(points: Point[], start: number, end: number): Point[] {
  const length = pathLength(points), lower = start * length, upper = end * length;
  const result: Point[] = [pointAlongPath(points, start)];
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (distance > lower && distance < upper) result.push(points[i]);
  }
  result.push(pointAlongPath(points, end));
  return result;
}

/** Interpolate only movement proved by two engine states; never predict another tick. */
export function confirmedMotion(layout: Layout, previous: Vehicle | undefined, current: Vehicle): (fraction: number) => NonNullable<ReturnType<typeof vehiclePosition>> {
  const end = vehiclePosition(layout, current);
  if (!end) throw new Error(`Unknown vehicle node ${current.node}`);
  const old = previous && vehiclePosition(layout, previous);
  if (!previous || !old || old.floor !== end.floor || old.transfer !== undefined || end.transfer !== undefined) return () => end;
  const before = previous.link && layout.links.find(link => link.id === previous.link);
  const after = current.link && layout.links.find(link => link.id === current.link);
  let points: Point[] | undefined;
  if (before && after && before.id === after.id && current.progress >= previous.progress) points = slicePath(pathForLink(layout, before), previous.progress, current.progress);
  else if (before && current.node === before.to) {
    points = slicePath(pathForLink(layout, before), previous.progress, 1);
    if (after && after.from === before.to) points.push(...slicePath(pathForLink(layout, after), 0, current.progress).slice(1));
    else if (after) points = undefined;
  } else if (!before && after && previous.node === after.from) points = slicePath(pathForLink(layout, after), 0, current.progress);
  if (!points || pathLength(points) < 1e-8) return () => end;
  // Cache cumulative geometry for this confirmed movement, once per tick.
  points = continuousPath(points);
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  const vertices = points, total = lengths[lengths.length - 1];
  // Unwrap heading ONCE along the whole confirmed polyline, not independently
  // against the heading at the start of the tick. A U-turn can sweep past
  // 180° inside a single native step: repeatedly applying the shortest
  // delta from old.angle flips +181° to -179° and visually spins the OHT.
  const segmentHeadings: Array<{ start: number; end: number }> = [];
  let previousHeading = old.angle;
  for (let i = 1; i < vertices.length; i++) {
    const a = vertices[i - 1], b = vertices[i];
    const start = continuousVehicleHeading(previousHeading, pathHeading(a, b, 0));
    const finish = continuousVehicleHeading(start, pathHeading(a, b, 1));
    segmentHeadings.push({ start, end: finish });
    previousHeading = finish;
  }
  return fraction => {
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let i = 1; while (i < lengths.length - 1 && lengths[i] < target) i++;
    const a = vertices[i - 1], b = vertices[i], segment = lengths[i] - lengths[i - 1], t = segment ? (target - lengths[i - 1]) / segment : 1;
    const heading = segmentHeadings[i - 1];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
      angle: heading.start + (heading.end - heading.start) * t, floor: end.floor };
  };
}
