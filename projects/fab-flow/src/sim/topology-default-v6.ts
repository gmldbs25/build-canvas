import type { DecorativeEquipment, Layout, Link, Node, Point, SingleFloorLayoutId } from './types';
import { cubicRail } from './curve-geometry';
import { pathLength } from './geometry';
import { getTopologyMetadata } from './topology-metadata';
import { validateTopologyV6 } from './topology-validation';

type DefaultFacility = NonNullable<Layout['facility']> & { decorativeEquipment: DecorativeEquipment[] };
type DefaultLayout = Omit<Layout, 'id' | 'topologyVersion' | 'facility'> & { id: SingleFloorLayoutId; topologyVersion: '6'; facility: DefaultFacility };
type Preset = { rows: number; columns: number; portsPerBay: number; bayWidth: number; pitchX: number; localWest: number; localEast: number; mainWest: number; mainEast: number; portStart: number; portPitch: number; sidingMargin: number; originX: number; rowPitch: number; width: number; height: number };
type Bay = { area: string; x: number; y: number; north: Node[]; south: Node[]; forward: Node[]; returning: Node[]; nWest: Node; nEast: Node; sWest: Node; sEast: Node; fWest: Node; fEast: Node; rWest: Node; rEast: Node; row: number; column: number };

const UNIT_METERS = 8;
const MARGIN = 36;
const LANE = { north: 320, forward: 540, returning: 660, south: 880 };
const PRESETS: Record<'small' | 'medium' | 'large', Preset> = {
  small: { rows: 1, columns: 2, portsPerBay: 8, bayWidth: 1800, pitchX: 1900, localWest: 320, localEast: 1480, mainWest: 200, mainEast: 1640, portStart: 540, portPitch: 260, sidingMargin: 38, originX: 90, rowPitch: 1100, width: 3800, height: 1350 },
  medium: { rows: 2, columns: 2, portsPerBay: 10, bayWidth: 1900, pitchX: 2000, localWest: 320, localEast: 1560, mainWest: 200, mainEast: 1720, portStart: 540, portPitch: 210, sidingMargin: 14, originX: 90, rowPitch: 1100, width: 4100, height: 2500 },
  large: { rows: 3, columns: 3, portsPerBay: 12, bayWidth: 2000, pitchX: 2100, localWest: 320, localEast: 1660, mainWest: 200, mainEast: 1820, portStart: 540, portPitch: 194, sidingMargin: 10, originX: 90, rowPitch: 1100, width: 6400, height: 3600 },
};
const VARIANTS: DecorativeEquipment['variant'][] = ['etch', 'deposition', 'lithography', 'metrology', 'wet', 'buffer', 'stocker', 'etch', 'deposition', 'wet'];
// These otherwise-clear pads were not part of the frozen V5 equipment pack.
// Reserve them so V6 keeps the same equipment inventory and visual density.
const RESERVED_V5_DECORATIVE_PADS: Partial<Record<SingleFloorLayoutId, ReadonlySet<string>>> = {
  medium: new Set(['decor-B01-side-6', 'decor-B02-side-6', 'decor-B03-03-01', 'decor-B03-side-4', 'decor-B04-03-11']),
  large: new Set(['decor-B03-03-12', 'decor-B03-06-12', 'decor-B04-03-01', 'decor-B05-01-12', 'decor-B05-06-12', 'decor-B07-01-12', 'decor-B07-03-01']),
};

function node(layout: DefaultLayout, id: string, area: string, x: number, y: number, heading: number): Node {
  const result: Node = { id, area, floor: 0, x, y, heading };
  layout.nodes.push(result);
  return result;
}

function laneNode(layout: DefaultLayout, nodes: Node[], id: string, area: string, x: number, y: number, heading: number) {
  return nodes.find(item => Math.abs(item.x - x) < 1e-7 && Math.abs(item.y - y) < 1e-7) ?? node(layout, id, area, x, y, heading);
}

function link(layout: DefaultLayout, id: string, from: Node, to: Node, kind: Link['kind'] = 'rail', handle?: number) {
  const path = cubicRail(from, to, handle, { spans: 8, chordError: .35 });
  layout.links.push({ id, from: from.id, to: to.id, kind, capacity: 1, resource: `v6-${id}`, length: pathLength(path) / UNIT_METERS, path });
}

function linkEllipseQuarter(layout: DefaultLayout, id: string, from: Node, to: Node, horizontalRadius: number, verticalRadius: number, kind: Link['kind'] = 'rail') {
  const k = .5522847498307936;
  const a = from.heading! * Math.PI / 180, b = to.heading! * Math.PI / 180;
  const h1 = Math.abs(Math.cos(a)) > .5 ? horizontalRadius * k : verticalRadius * k;
  const h2 = Math.abs(Math.cos(b)) > .5 ? horizontalRadius * k : verticalRadius * k;
  const c1 = { x: from.x + Math.cos(a) * h1, y: from.y + Math.sin(a) * h1 };
  const c2 = { x: to.x - Math.cos(b) * h2, y: to.y - Math.sin(b) * h2 };
  const path = Array.from({ length: 33 }, (_, i) => {
    const t = i / 32, u = 1 - t;
    const x = u ** 3 * from.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * to.x;
    const y = u ** 3 * from.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * to.y;
    const dx = 3 * u ** 2 * (c1.x - from.x) + 6 * u * t * (c2.x - c1.x) + 3 * t ** 2 * (to.x - c2.x);
    const dy = 3 * u ** 2 * (c1.y - from.y) + 6 * u * t * (c2.y - c1.y) + 3 * t ** 2 * (to.y - c2.y);
    return { x, y, tangent: i === 0 ? from.heading : i === 32 ? to.heading : Math.atan2(dy, dx) * 180 / Math.PI };
  });
  layout.links.push({ id, from: from.id, to: to.id, kind, capacity: 1, resource: `v6-${id}`, length: pathLength(path) / UNIT_METERS, path });
}

function linkInBlocks(layout: DefaultLayout, id: string, from: Node, to: Node, kind: Link['kind'], handle?: number) {
  const count = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 560);
  let previous = from;
  for (let part = 1; part <= count; part++) {
    const next = part === count ? to : node(layout, `${id}-block-${part}`, from.area,
      from.x + (to.x - from.x) * part / count, from.y + (to.y - from.y) * part / count, from.heading!);
    link(layout, `${id}-section-${part}`, previous, next, kind, handle);
    previous = next;
  }
}

function connectLane(layout: DefaultLayout, id: string, nodes: Node[], forward: boolean) {
  const ordered = [...nodes].sort((a, b) => forward ? a.x - b.x : b.x - a.x);
  for (let i = 1; i < ordered.length; i++) {
    const from = ordered[i - 1], to = ordered[i];
    const distance = Math.abs(to.x - from.x), count = Math.ceil(distance / 560);
    let previous = from;
    for (let part = 1; part <= count; part++) {
      const next = part === count ? to : node(layout, `${id}-block-${i}-${part}`, from.area,
        from.x + (to.x - from.x) * part / count, from.y, forward ? 0 : 180);
      link(layout, `${id}-section-${i}-${part}`, previous, next);
      previous = next;
    }
  }
}

/** Give campus reversals two visible quarter-turns and a straight outer leg. */
function roundedCapsule(layout: DefaultLayout, prefix: string, from: Node, to: Node, side: 'east' | 'west', radiusX: number, radiusY: number, kind: Link['kind'] = 'rail') {
  const directionY = to.y > from.y ? 1 : -1, verticalHeading = directionY > 0 ? 90 : 270;
  const outerX = from.x + (side === 'east' ? radiusX : -radiusX);
  const first = node(layout, `${prefix}-corner-start`, from.area, outerX, from.y + directionY * radiusY, verticalHeading);
  const last = node(layout, `${prefix}-corner-end`, from.area, outerX, to.y - directionY * radiusY, verticalHeading);
  linkEllipseQuarter(layout, `${prefix}-corner-in`, from, first, radiusX, radiusY, kind);
  link(layout, `${prefix}-straight`, first, last, kind);
  linkEllipseQuarter(layout, `${prefix}-corner-out`, last, to, radiusX, radiusY, kind);
}

function roundedProcessTerminal(layout: DefaultLayout, prefix: string, north: Node, south: Node, side: 'east' | 'west') {
  roundedCapsule(layout, prefix, side === 'east' ? north : south, side === 'east' ? south : north, side, 280, 100);
}

function segmentHitsRect(a: Point, b: Point, rect: { x: number; y: number; width: number; height: number }) {
  let low = 0, high = 1, dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - rect.x], [dx, rect.x + rect.width - a.x], [-dy, a.y - rect.y], [dy, rect.y + rect.height - a.y]] as const) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
    if (low > high) return false;
  }
  return true;
}

function placeDecorativeEquipment(layout: DefaultLayout, area: string, areaX: number, areaY: number, module: number) {
  const rows = [16, 357, 443, 697, 783, 1120];
  const bayWidth = layout.areas.find(item => item.id === area)!.width;
  const columns = Math.floor((bayWidth - 100) / 154);
  const floor = layout.facility!.floorBounds.find(item => item.floor === 0)!;
  // Keep the original equipment pads reserved when tools move toward the revised dock.
  const functional = layout.facility!.equipment.flatMap(item => [item, { ...item, y: item.y + (item.facing === 'south' ? -30 : 30) }]);
  const paths = layout.links.map(item => item.path ?? []);
  let accepted = 0;
  for (let row = 0; row < rows.length; row++) for (let col = 0; col < columns; col++) {
    const variant = VARIANTS[(row * columns + col + module * 3) % VARIANTS.length];
    const width = variant === 'lithography' ? 112 : variant === 'stocker' ? 104 : variant === 'wet' ? 98 : variant === 'deposition' ? 92 : 82;
    const height = variant === 'lithography' || variant === 'stocker' || variant === 'wet' ? 50 : 46;
    const candidate = { id: `decor-${area}-${String(row + 1).padStart(2, '0')}-${String(col + 1).padStart(2, '0')}`, floor: 0, area,
      x: areaX + 98 + module * 8 + col * 154, y: areaY + rows[row], width, height, variant } satisfies DecorativeEquipment;
    if (RESERVED_V5_DECORATIVE_PADS[layout.id]?.has(candidate.id)) continue;
    const clearance = { ...candidate, x: candidate.x - MARGIN, y: candidate.y - MARGIN, width: candidate.width + 2 * MARGIN, height: candidate.height + 2 * MARGIN };
    if (candidate.x < floor.x + 18 || candidate.y < floor.y + 18 || candidate.x + candidate.width > floor.x + floor.width - 18 || candidate.y + candidate.height > floor.y + floor.height - 18) continue;
    if (functional.some(item => clearance.x < item.x + item.width && clearance.x + clearance.width > item.x && clearance.y < item.y + item.height && clearance.y + clearance.height > item.y)) continue;
    if (paths.some(path => path.slice(1).some((point, index) => segmentHitsRect(path[index], point, clearance)))) continue;
    if (layout.facility!.decorativeEquipment.some(item => clearance.x < item.x + item.width && clearance.x + clearance.width > item.x && clearance.y < item.y + item.height && clearance.y + clearance.height > item.y)) continue;
    layout.facility!.decorativeEquipment.push(candidate);
    accepted++;
  }
  const sidePads = [
    [1500, 100], [1640, 100], [1500, 200], [1640, 200],
    [1500, 1000], [1640, 1000], [1500, 1100], [1640, 1100],
  ] as const;
  for (let index = 0; index < sidePads.length; index++) {
    const [offsetX, offsetY] = sidePads[index], variant = VARIANTS[(index + 4 + module * 3) % VARIANTS.length];
    const width = variant === 'lithography' ? 112 : variant === 'stocker' ? 104 : variant === 'wet' ? 98 : variant === 'deposition' ? 92 : 82;
    const height = variant === 'lithography' || variant === 'stocker' || variant === 'wet' ? 50 : 46;
    const candidate = { id: `decor-${area}-side-${index + 1}`, floor: 0, area, x: areaX + offsetX + module * 8, y: areaY + offsetY, width, height, variant } satisfies DecorativeEquipment;
    if (RESERVED_V5_DECORATIVE_PADS[layout.id]?.has(candidate.id)) continue;
    const clearance = { ...candidate, x: candidate.x - MARGIN, y: candidate.y - MARGIN, width: candidate.width + 2 * MARGIN, height: candidate.height + 2 * MARGIN };
    if (candidate.x < floor.x + 18 || candidate.y < floor.y + 18 || candidate.x + candidate.width > floor.x + floor.width - 18 || candidate.y + candidate.height > floor.y + floor.height - 18) continue;
    if (functional.some(item => clearance.x < item.x + item.width && clearance.x + clearance.width > item.x && clearance.y < item.y + item.height && clearance.y + clearance.height > item.y)) continue;
    if (paths.some(path => path.slice(1).some((point, pointIndex) => segmentHitsRect(path[pointIndex], point, clearance)))) continue;
    if (layout.facility!.decorativeEquipment.some(item => clearance.x < item.x + item.width && clearance.x + clearance.width > item.x && clearance.y < item.y + item.height && clearance.y + clearance.height > item.y)) continue;
    layout.facility!.decorativeEquipment.push(candidate);
    accepted++;
  }
  if (accepted < 24) throw new Error(`Default FAB ${area} decorative pack is sparse (${accepted}); reserve more clear equipment pads.`);
}

export function validateDefaultTopology(layout: DefaultLayout): string[] {
  // Shared oriented-curve checks; topology 6 enables the same conservative spatial broad phase.
  const errors = validateTopologyV6(layout);
  const decorative = layout.facility!.decorativeEquipment;
  const equipment = [...layout.facility!.equipment, ...decorative];
  for (const item of decorative) {
    const floor = layout.facility!.floorBounds.find(bound => bound.floor === item.floor);
    if (floor && (item.x < floor.x + 18 || item.y < floor.y + 18 || item.x + item.width > floor.x + floor.width - 18 || item.y + item.height > floor.y + floor.height - 18)) {
      errors.push(`decorative equipment ${item.id} outside floor body envelope`);
    }
  }
  for (const rail of layout.links) for (const item of decorative) {
    const clearance = { x: item.x - MARGIN, y: item.y - MARGIN, width: item.width + 2 * MARGIN, height: item.height + 2 * MARGIN };
    const points = rail.path ?? [];
    if (points.slice(1).some((point, index) => segmentHitsRect(points[index], point, clearance))) errors.push(`decorative equipment ${item.id} too close to rail ${rail.id}`);
  }
  for (let i = 0; i < equipment.length; i++) for (let j = i + 1; j < equipment.length; j++) {
    const a = equipment[i], b = equipment[j];
    if (a.x - MARGIN < b.x + b.width && a.x + a.width + MARGIN > b.x && a.y - MARGIN < b.y + b.height && a.y + a.height + MARGIN > b.y) errors.push(`equipment clearance overlap ${a.id} / ${b.id}`);
  }
  return [...new Set(errors)];
}

/** Co-directional V6 rounded-rail FAB family. */
export function generateDefaultTopologyV6(id: SingleFloorLayoutId): DefaultLayout {
  const preset = PRESETS[id], source = getTopologyMetadata(id);
  const areaOriginY = 90;
  const layout: DefaultLayout = {
    id,
    name: id === 'small' ? 'Pilot Cleanroom' : id === 'medium' ? 'Twin Process Halls' : 'Process Campus',
    description: 'Co-directional process access and paired central corridors with bounded equipment detail.',
    floors: 1,
    width: preset.width,
    height: preset.height,
    nodes: [], links: [],
    ports: source.ports.map(port => ({ ...port })),
    areas: source.areas.map((area, index) => ({ ...area,
      x: preset.originX + index % preset.columns * preset.pitchX,
      y: areaOriginY + Math.floor(index / preset.columns) * preset.rowPitch,
      width: preset.bayWidth, height: 1140 })),
    parkingNodes: [],
    facility: {
      version: '1.1', unitsPerMeter: 8, equipment: [],
      aisles: [],
      floorBounds: [{ floor: 0, x: 24, y: 24, width: preset.width - 48, height: preset.height - 48 }],
      decorativeEquipment: [],
    },
    topologyVersion: '6',
  };
  const bays: Bay[] = [];

  for (const [areaIndex, area] of layout.areas.entries()) {
    const x = area.x, y = area.y, areaId = area.id;
    const row = Math.floor(areaIndex / preset.columns), column = areaIndex % preset.columns, module = (row + column) % 3;
    const zone = ['ETCH / DEPOSITION', 'LITHOGRAPHY / METROLOGY', 'WET / FINISH'][module];
    layout.facility!.aisles.push(
      { id: `${areaId}-north-service`, name: `${zone} · NORTH SERVICE AISLE`, floor: 0, x: x + 170, y: y + 270, width: preset.bayWidth - 340, height: 100 },
      { id: `${areaId}-spine`, name: 'PAIRED CENTRAL TRANSPORT SPINE', floor: 0, x: x + 120, y: y + 500, width: preset.bayWidth - 240, height: 200 },
      { id: `${areaId}-south-service`, name: `${zone} · SOUTH SERVICE AISLE`, floor: 0, x: x + 170, y: y + 830, width: preset.bayWidth - 340, height: 100 },
    );
    const nWest = node(layout, `${areaId}-NORTH-W`, areaId, x + preset.localWest, y + LANE.north, 0);
    const nEast = node(layout, `${areaId}-NORTH-E`, areaId, x + preset.localEast, y + LANE.north, 0);
    const fWest = node(layout, `${areaId}-SPINE-W-FWD`, areaId, x + preset.mainWest, y + LANE.forward, 0);
    const fEast = node(layout, `${areaId}-SPINE-E-FWD`, areaId, x + preset.mainEast, y + LANE.forward, 0);
    const rWest = node(layout, `${areaId}-SPINE-W-RET`, areaId, x + preset.mainWest, y + LANE.returning, 180);
    const rEast = node(layout, `${areaId}-SPINE-E-RET`, areaId, x + preset.mainEast, y + LANE.returning, 180);
    const sWest = node(layout, `${areaId}-SOUTH-W`, areaId, x + preset.localWest, y + LANE.south, 180);
    const sEast = node(layout, `${areaId}-SOUTH-E`, areaId, x + preset.localEast, y + LANE.south, 180);
    const north: Node[] = [nWest, nEast], south: Node[] = [sWest, sEast];
    for (const port of layout.ports.filter(item => item.area === areaId)) {
      const number = Number(port.id.split('-P').at(-1));
      const bank = preset.portsPerBay / 2;
      const upper = number <= bank, index = (number - 1) % bank;
      const center = x + preset.portStart + index * preset.portPitch;
      const sourceEquipment = source.equipment.find(item => item.portId === port.id)!;
      const width = sourceEquipment.width, height = sourceEquipment.height;
      const dir = upper ? 1 : -1, laneY = y + (upper ? LANE.north : LANE.south), dockY = y + (upper ? 280 : 920);
      const inX = center - dir * (width / 2 + preset.sidingMargin), outX = center + dir * (width / 2 + preset.sidingMargin);
      const entry = node(layout, `${areaId}-T${number}-IN`, areaId, inX, laneY, upper ? 0 : 180);
      const exit = node(layout, `${areaId}-T${number}-OUT`, areaId, outX, laneY, upper ? 0 : 180);
      const dock = node(layout, port.node, areaId, center, dockY, upper ? 0 : 180);
      (upper ? north : south).push(entry, exit);
      link(layout, `${areaId}-port-approach-${number}`, entry, dock);
      link(layout, `${areaId}-port-depart-${number}`, dock, exit);
      const equipment = { ...sourceEquipment, floor: 0, area: areaId, facing: upper ? 'south' as const : 'north' as const,
        dock: { x: center, y: dockY }, x: center - width / 2, y: upper ? y + 82 : y + 950, width, height };
      layout.facility!.equipment.push(equipment);
      layout.ports[layout.ports.findIndex(item => item.id === port.id)] = { ...port, node: dock.id };
    }

    // Landing nodes flank the first and last port sidings. Two transfers in
    // each direction keep most trips off the campus terminal return.
    const upperEntries = north.filter(item => item.id.includes('-T') && item.id.endsWith('-IN')).sort((a, b) => a.x - b.x);
    const upperExits = north.filter(item => item.id.includes('-T') && item.id.endsWith('-OUT')).sort((a, b) => a.x - b.x);
    const lowerEntries = south.filter(item => item.id.includes('-T') && item.id.endsWith('-IN')).sort((a, b) => b.x - a.x);
    const lowerExits = south.filter(item => item.id.includes('-T') && item.id.endsWith('-OUT')).sort((a, b) => b.x - a.x);
    const northMergeA = laneNode(layout, north, `${areaId}-XFER-N-FWD`, areaId, x + preset.localWest + 60, y + LANE.north, 0);
    const northMergeB = laneNode(layout, north, `${areaId}-XFER-N-LAST`, areaId, upperEntries.at(-1)!.x - 36, y + LANE.north, 0);
    const northLeaveA = laneNode(layout, north, `${areaId}-XFER-N-OUT-FIRST`, areaId, upperExits[0].x + 101, y + LANE.north, 0);
    const northLeaveB = laneNode(layout, north, `${areaId}-XFER-N-OUT-LAST`, areaId, upperExits.at(-1)!.x + 36, y + LANE.north, 0);
    const fInA = laneNode(layout, [fWest, fEast], `${areaId}-XFER-FWD-IN-A`, areaId, northMergeA.x - 180, y + LANE.forward, 0);
    const fInB = laneNode(layout, [fWest, fEast], `${areaId}-XFER-FWD-IN-B`, areaId, northMergeB.x - 180, y + LANE.forward, 0);
    const fOutA = laneNode(layout, [fWest, fEast], `${areaId}-XFER-FWD-OUT-A`, areaId, northLeaveA.x + 180, y + LANE.forward, 0);
    const fOutB = laneNode(layout, [fWest, fEast], `${areaId}-XFER-FWD-OUT-B`, areaId, northLeaveB.x + 180, y + LANE.forward, 0);
    north.push(northMergeA, northMergeB, northLeaveA, northLeaveB);
    const forward: Node[] = [fWest, fEast, fInA, fInB, fOutA, fOutB];
    link(layout, `${areaId}-spine-forward-to-north-first`, fWest, northMergeA);
    link(layout, `${areaId}-spine-forward-to-north-last-entry`, fInB, northMergeB);
    link(layout, `${areaId}-north-first-to-spine-forward`, northLeaveA, fOutA);
    link(layout, `${areaId}-north-last-to-spine-forward`, northLeaveB, fOutB);

    const southFromRA = laneNode(layout, south, `${areaId}-XFER-S-RET-EAST`, areaId, lowerEntries[0].x + 36, y + LANE.south, 180);
    const southFromRB = laneNode(layout, south, `${areaId}-XFER-S-RET-MID`, areaId, lowerExits[2].x - 36, y + LANE.south, 180);
    const southToRA = preset.sidingMargin === 38 ? laneNode(layout, south, `${areaId}-XFER-S-TO-RET-MID`, areaId, lowerEntries[1].x - 84, y + LANE.south, 180) : lowerEntries[1];
    const southToRB = laneNode(layout, south, `${areaId}-XFER-S-TO-RET-WEST`, areaId, lowerExits.at(-1)!.x - 56, y + LANE.south, 180);
    const rInA = laneNode(layout, [rWest, rEast], `${areaId}-XFER-RET-IN-A`, areaId, southToRA.x - 180, y + LANE.returning, 180);
    const rInB = laneNode(layout, [rWest, rEast], `${areaId}-XFER-RET-IN-B`, areaId, Math.max(x + preset.mainWest + MARGIN, southToRB.x - 180), y + LANE.returning, 180);
    const rOutA = laneNode(layout, [rWest, rEast], `${areaId}-XFER-RET-OUT-A`, areaId, southFromRB.x + 180, y + LANE.returning, 180);
    const rOutB = laneNode(layout, [rWest, rEast], `${areaId}-XFER-RET-OUT-B`, areaId, southFromRA.x + 180, y + LANE.returning, 180);
    south.push(southFromRA, southFromRB, southToRA, southToRB);
    const returning: Node[] = [rWest, rEast, rInA, rInB, rOutA, rOutB];
    link(layout, `${areaId}-spine-return-east-to-south`, rEast, southFromRA);
    link(layout, `${areaId}-spine-return-mid-to-south`, rOutA, southFromRB);
    link(layout, `${areaId}-south-mid-to-spine-return`, southToRA, rInA);
    link(layout, `${areaId}-south-west-to-spine-return`, southToRB, rWest);

    // One interior transfer station per hall, supplementing the terminal returns.
    if (id !== 'small' && column === Math.floor(preset.columns / 2)) {
      const center=x+(preset.mainWest+preset.mainEast)/2;
      const fTurn=laneNode(layout,forward,`${areaId}-CROSS-FWD-E`,areaId,center-100,y+LANE.forward,0);
      const rReceive=laneNode(layout,returning,`${areaId}-CROSS-RET-E`,areaId,center-100,y+LANE.returning,180);
      const rTurn=laneNode(layout,returning,`${areaId}-CROSS-RET-W`,areaId,center+100,y+LANE.returning,180);
      const fReceive=laneNode(layout,forward,`${areaId}-CROSS-FWD-W`,areaId,center+100,y+LANE.forward,0);
      forward.push(fTurn,fReceive);returning.push(rTurn,rReceive);
      link(layout,`${areaId}-cross-spine-east-turn`,fTurn,rReceive,'rail',80);
      link(layout,`${areaId}-cross-spine-west-turn`,rTurn,fReceive,'rail',80);
    }

    // Broad reversals occur only at the two campus termini.
    const pool = node(layout, `${areaId}-STAGING-POOL`, areaId, x + 110, y + 600, 270);
    link(layout, `${areaId}-staging-ingress`, rWest, pool, 'rail', 58);
    link(layout, `${areaId}-staging-egress`, pool, fWest, 'rail', 58);
    layout.parkingNodes!.push(pool.id);
    bays.push({ area: areaId, x, y, north: [...new Set(north)], south: [...new Set(south)], forward: [...new Set(forward)], returning: [...new Set(returning)], nWest, nEast, sWest, sEast, fWest, fEast, rWest, rEast, row, column });
  }

  const bayAt = (row: number, column: number) => bays.find(bay => bay.row === row && bay.column === column)!;
  for (const bay of bays) {
    connectLane(layout, `${bay.area}-process-north-east`, bay.north, true);
    connectLane(layout, `${bay.area}-process-south-west`, bay.south, false);
    connectLane(layout, `${bay.area}-central-forward-east`, bay.forward, true);
    connectLane(layout, `${bay.area}-central-return-west`, bay.returning, false);
  }
  for (let row = 0; row < preset.rows; row++) {
    for (let column = 0; column < preset.columns - 1; column++) {
      const left = bayAt(row, column), right = bayAt(row, column + 1), prefix = `corridor-r${row + 1}-c${column + 1}`;
      linkInBlocks(layout, `${prefix}-process-north`, left.nEast, right.nWest, 'bridge');
      linkInBlocks(layout, `${prefix}-spine-forward`, left.fEast, right.fWest, 'bridge');
      linkInBlocks(layout, `${prefix}-spine-return`, right.rWest, left.rEast, 'bridge');
      linkInBlocks(layout, `${prefix}-process-south`, right.sWest, left.sEast, 'bridge');
    }
    const west = bayAt(row, 0), east = bayAt(row, preset.columns - 1), rowPrefix = `campus-r${row + 1}`;
    link(layout, `${rowPrefix}-turn-east-forward-to-return`, east.fEast, east.rEast, 'rail', 80);
    link(layout, `${rowPrefix}-turn-west-return-to-forward`, west.rWest, west.fWest, 'rail', 80);
    roundedProcessTerminal(layout, `${rowPrefix}-return-east`, east.nEast, east.sEast, 'east');
    roundedProcessTerminal(layout, `${rowPrefix}-return-west`, west.nWest, west.sWest, 'west');
  }
  for (let row = 0; row < preset.rows - 1; row++) {
    // Each column has a direct opposite-direction process transfer with a
    // rounded outer lead and a long straight bridge leg.
    for (let column = 0; column < preset.columns; column++) {
      const upper = bayAt(row, column), lower = bayAt(row + 1, column), prefix = `corridor-row-${row + 1}-c${column + 1}`;
      roundedCapsule(layout, `${prefix}-west-down`, upper.sWest, lower.nWest, 'west', 270, 100, 'bridge');
      roundedCapsule(layout, `${prefix}-east-up`, lower.nEast, upper.sEast, 'east', 270, 100, 'bridge');
    }
  }

  for (const bay of bays) placeDecorativeEquipment(layout, bay.area, bay.x, bay.y, (bay.row + bay.column) % 3);
  const errors = validateDefaultTopology(layout);
  if (errors.length) throw new Error(`Invalid generated default FAB: ${errors.slice(0, 12).join('; ')}`);
  return layout;
}
