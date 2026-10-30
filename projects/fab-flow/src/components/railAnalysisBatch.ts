import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type RailOverlaySource = { id: string; geometry: THREE.BufferGeometry };
export type RailOverlayBatch = {
  geometry: THREE.BufferGeometry;
  setStyle(id: string, color: THREE.ColorRepresentation, opacity: number): void;
  flushUpdateRanges(): void;
  markRendered(): void;
};

/** Combine per-link tube geometry while retaining a writable color/alpha range per link. */
export function createRailOverlayBatch(sources: RailOverlaySource[]): RailOverlayBatch {
  const ranges = new Map<string, { vertexStart: number; vertexCount: number; indexStart: number; indexCount: number; visible: boolean }>();
  const pieces = sources.map(({ id, geometry }) => {
    const piece = geometry.clone();
    geometry.dispose();
    const position = piece.getAttribute('position');
    const colors = new Float32Array(position.count * 4);
    piece.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    ranges.set(id, { vertexStart: 0, vertexCount: position.count, indexStart: 0, indexCount: piece.index?.count ?? 0, visible: false });
    return piece;
  });
  const geometry = mergeGeometries(pieces, false);
  pieces.forEach(piece => piece.dispose());
  if (!geometry) throw new Error('Rail overlay geometries could not be merged');
  geometry.computeBoundingSphere();
  const attribute = geometry.getAttribute('color') as THREE.BufferAttribute;
  attribute.setUsage(THREE.DynamicDrawUsage);
  const index = geometry.getIndex();
  if (!index) throw new Error('Rail overlay geometries must be indexed');
  index.setUsage(THREE.DynamicDrawUsage);
  const originalIndices = index.array.slice() as typeof index.array;
  let vertexOffset = 0;
  let indexOffset = 0;
  for (const range of ranges.values()) {
    range.vertexStart = vertexOffset;
    range.indexStart = indexOffset;
    vertexOffset += range.vertexCount;
    indexOffset += range.indexCount;
  }
  // The draw range starts empty because every link begins with alpha zero.
  geometry.setDrawRange(0, 0);
  const color = new THREE.Color();
  const styles = new Map<string, { r: number; g: number; b: number; a: number }>();
  for (const id of ranges.keys()) styles.set(id, { r: 0, g: 0, b: 0, a: 0 });
  const pending = new Set<string>();
  let flushNeeded = false;
  let indicesDirty = false;
  return {
    geometry,
    setStyle(id, hex, opacity) {
      const range = ranges.get(id);
      const previous = styles.get(id);
      if (!range || !previous || attribute.itemSize !== 4) return;
      color.set(hex);
      const alpha = Math.max(0, Math.min(1, opacity));
      if (previous && previous.r === color.r && previous.g === color.g && previous.b === color.b && previous.a === alpha) return;
      const wasVisible = previous.a > 0;
      const isVisible = alpha > 0;
      previous.r = color.r; previous.g = color.g; previous.b = color.b; previous.a = alpha;
      for (let vertex = range.vertexStart; vertex < range.vertexStart + range.vertexCount; vertex++) {
        attribute.setXYZW(vertex, color.r, color.g, color.b, alpha);
      }
      if (wasVisible !== isVisible) { range.visible = isVisible; indicesDirty = true; }
      pending.add(id);
      flushNeeded = true;
    },
    flushUpdateRanges() {
      if (indicesDirty) {
        let activeCount = 0;
        for (const range of ranges.values()) {
          if (!range.visible) continue;
          for (let i = 0; i < range.indexCount; i++) index.array[activeCount++] = originalIndices[range.indexStart + i];
        }
        geometry.setDrawRange(0, activeCount);
        index.clearUpdateRanges();
        if (activeCount > 0) index.addUpdateRange(0, activeCount);
        index.needsUpdate = true;
        indicesDirty = false;
      }
      if (!pending.size || !flushNeeded) return;
      // Keep exactly the changes awaiting a visible upload, even when React
      // updates styles repeatedly while the overlay is hidden.
      attribute.clearUpdateRanges();
      const dirty = [...pending].map(id => ranges.get(id)!).sort((a, b) => a.vertexStart - b.vertexStart);
      let start = dirty[0].vertexStart * attribute.itemSize;
      let end = start + dirty[0].vertexCount * attribute.itemSize;
      for (const range of dirty.slice(1)) {
        const nextStart = range.vertexStart * attribute.itemSize, nextEnd = nextStart + range.vertexCount * attribute.itemSize;
        if (nextStart <= end) end = Math.max(end, nextEnd);
        else { attribute.addUpdateRange(start, end - start); start = nextStart; end = nextEnd; }
      }
      attribute.addUpdateRange(start, end - start);
      attribute.needsUpdate = true;
      flushNeeded = false;
    },
    markRendered() { pending.clear(); flushNeeded = false; },
  };
}

export function closedRailCrossPositions(rails: Array<{ points: Array<{ x: number; y: number }>; closed: boolean }>, height = 82, halfSize = 7) {
  const positions: number[] = [];
  for (const rail of rails) {
    if (!rail.closed || rail.points.length === 0) continue;
    const mid = rail.points[Math.floor(rail.points.length / 2)];
    if (!mid) continue;
    positions.push(mid.x - halfSize, height, mid.y - halfSize, mid.x + halfSize, height, mid.y + halfSize,
      mid.x - halfSize, height, mid.y + halfSize, mid.x + halfSize, height, mid.y - halfSize);
  }
  return new Float32Array(positions);
}
