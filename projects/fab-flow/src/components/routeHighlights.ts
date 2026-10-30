import type { Layout } from '@/sim/types';
import { pathForLink } from '@/sim/geometry';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export type RouteCandidate = { nodes: string[]; links: string[]; distance: number; cost: number; selected: boolean };

export type RouteHighlightPath = {
  selected: boolean;
  candidateIndex: number;
  linkIds: string[];
  positions: number[];
};

/** Screen-space line widths and colors keep route cues legible without moving the engine path. */
export const ROUTE_HIGHLIGHT_STYLE = {
  casing: { color: 0x173743, selectedWidth: 5, alternativeWidth: 3 },
  selected: { color: 0x00c7dc, width: 3, dashed: false },
  alternatives: [0x7d94a4, 0x9b87a3, 0xa18b58],
  alternativeWidth: 1.5,
  dashSize: 8,
  gapSize: 5,
} as const;

/**
 * Batch only the adjacent point pairs from each real candidate link. This never
 * bridges gaps between links and leaves path coordinates owned by the layout.
 */
export function buildRouteHighlightPaths(layout: Layout, floor: number, candidates: readonly RouteCandidate[], height: number): RouteHighlightPath[] {
  const floorByNode = new Map(layout.nodes.map(node => [node.id, node.floor]));
  return candidates.map((candidate, candidateIndex) => {
    const positions: number[] = [], linkIds: string[] = [];
    for (const linkId of candidate.links) {
      const link = layout.links.find(item => item.id === linkId);
      if (!link || floorByNode.get(link.from) !== floor || link.kind === 'lifter') continue;
      const points = pathForLink(layout, link);
      if (points.length < 2) continue;
      linkIds.push(link.id);
      for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1]!, current = points[index]!;
        positions.push(previous.x, height, previous.y, current.x, height, current.y);
      }
    }
    return { selected: candidate.selected, candidateIndex, linkIds, positions };
  }).filter(route => route.positions.length > 0)
    .sort((left, right) => Number(left.selected) - Number(right.selected));
}

export function routeHighlightColor(route: Pick<RouteHighlightPath, 'selected' | 'candidateIndex'>) {
  return route.selected ? ROUTE_HIGHLIGHT_STYLE.selected.color : ROUTE_HIGHLIGHT_STYLE.alternatives[route.candidateIndex % ROUTE_HIGHLIGHT_STYLE.alternatives.length]!;
}

export function createRouteHighlightMaterial(route: Pick<RouteHighlightPath, 'selected' | 'candidateIndex'>, casing = false) {
  return new LineMaterial({
    color: casing ? ROUTE_HIGHLIGHT_STYLE.casing.color : routeHighlightColor(route),
    linewidth: casing
      ? route.selected ? ROUTE_HIGHLIGHT_STYLE.casing.selectedWidth : ROUTE_HIGHLIGHT_STYLE.casing.alternativeWidth
      : route.selected ? ROUTE_HIGHLIGHT_STYLE.selected.width : ROUTE_HIGHLIGHT_STYLE.alternativeWidth,
    dashed: !route.selected,
    dashSize: ROUTE_HIGHLIGHT_STYLE.dashSize,
    gapSize: ROUTE_HIGHLIGHT_STYLE.gapSize,
    depthTest: true,
    depthWrite: false,
    // Composite with the analytic overlays, after them. Depth testing still
    // lets the actual opaque OHT/FOUP bodies occlude their route.
    transparent: true,
    toneMapped: false,
  });
}

export function routeHighlightRenderOrders(routeIndex: number) {
  return { casing: routeIndex * 2, core: routeIndex * 2 + 1 };
}
