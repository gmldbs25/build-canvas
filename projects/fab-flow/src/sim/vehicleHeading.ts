/**
 * Keep a moving OHT on the same continuous heading branch across angular seams.
 * A Native rail tangent can represent the same direction as -90°, 270° or
 * 630°; the mesh must not visibly make a full revolution on that boundary.
 *
 * This changes only visual heading. It never changes position, selected route,
 * Native movement, link occupancy or FOUP ownership.
 */
export function shortestHeadingDelta(fromDegrees: number, toDegrees: number): number {
  if (!Number.isFinite(fromDegrees) || !Number.isFinite(toDegrees)) return 0;
  // JavaScript remainder preserves the sign of its dividend. Normalize twice
  // so transitions involving unwrapped negative tangents never return -360°.
  return ((toDegrees - fromDegrees + 180) % 360 + 360) % 360 - 180;
}

export function continuousVehicleHeading(previousDegrees: number, desiredDegrees: number): number {
  if (!Number.isFinite(previousDegrees)) return desiredDegrees;
  if (!Number.isFinite(desiredDegrees)) return previousDegrees;
  return previousDegrees + shortestHeadingDelta(previousDegrees, desiredDegrees);
}
