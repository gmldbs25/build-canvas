import type { Layout, MultiLargeLifter, Node, Point } from './types';
import { pathLength } from './geometry';
import { generateDefaultTopologyV6 } from './topology-default-v6';
import { validateTopologyV6 } from './topology-validation';

export type MultiLargeLayout = Omit<Layout, 'id'> & { id: 'multi-large'; multiLargeVersion: '1'; lifters: MultiLargeLifter[] };

const FLOOR_PREFIX = ['F1:', 'F2:'] as const;
// The initial intersection candidates are intentionally moved to isolated V6
// staging pools. Those pools already have directed ingress/egress paths and
// keep a lift queue off the co-directional process spine.
const LIFTER_STAGING_AREAS = ['B05', 'B06', 'B08', 'B09'] as const;
const UNITS_PER_METER = 8;
const BUFFER_CLEARANCE = 48;
const LIFTER_VERTICAL_METERS = 10;

function cloneFloor(source: Layout, floor: 0 | 1): Layout {
  const prefix = FLOOR_PREFIX[floor];
  const nodeId = (id: string) => `${prefix}${id}`;
  const areaId = (id: string) => `${prefix}${id}`;
  const portId = (id: string) => `${prefix}${id}`;
  return {
    ...source,
    name: `Multi Large · Floor ${floor + 1}`,
    description: `Independent V6 Large floor ${floor + 1} topology clone.`,
    floors: 2,
    nodes: source.nodes.map(node => ({ ...node, id: nodeId(node.id), area: areaId(node.area), floor })),
    links: source.links.map(link => ({ ...link, id: nodeId(link.id), from: nodeId(link.from), to: nodeId(link.to), resource: link.resource ? nodeId(link.resource) : undefined, path: link.path?.map(point => ({ ...point })) })),
    ports: source.ports.map(port => ({ ...port, id: portId(port.id), node: nodeId(port.node), area: areaId(port.area), floor })),
    areas: source.areas.map(area => ({ ...area, id: areaId(area.id), floor })),
    parkingNodes: source.parkingNodes?.map(nodeId),
    facility: source.facility && {
      ...source.facility,
      equipment: source.facility.equipment.map(item => ({ ...item, id: nodeId(item.id), portId: portId(item.portId), area: areaId(item.area), floor, dock: { ...item.dock } })),
      decorativeEquipment: source.facility.decorativeEquipment?.map(item => ({ ...item, id: nodeId(item.id), area: areaId(item.area), floor })),
      aisles: source.facility.aisles.map(item => ({ ...item, id: nodeId(item.id), name: `F${floor + 1} · ${item.name}`, floor })),
      floorBounds: [{ ...source.facility.floorBounds[0], floor }],
    },
  };
}

function splitStagingLink(layout: MultiLargeLayout, floor: 0 | 1, area: string, direction: 'ingress' | 'egress', distanceFromLanding: number, resource: string): Node {
  const prefix = FLOOR_PREFIX[floor], id = `${prefix}${area}-staging-${direction}`;
  const linkIndex = layout.links.findIndex(link => link.id === id);
  const original = layout.links[linkIndex];
  if (!original?.path || original.path.length < 3) throw new Error(`Missing sampled staging path ${id}.`);
  const path = original.path;
  const segments = Array.from({ length: path.length - 1 }, (_, i) => Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y));
  let walked = 0, splitAt = direction === 'ingress' ? path.length - 2 : 1;
  if (direction === 'ingress') {
    for (let i = path.length - 2; i >= 1; i--) {
      walked += segments[i];
      if (walked >= distanceFromLanding) { splitAt = i; break; }
    }
  } else {
    for (let i = 0; i < path.length - 1; i++) {
      walked += segments[i];
      if (walked >= distanceFromLanding) { splitAt = i + 1; break; }
    }
  }
  splitAt = Math.max(1, Math.min(path.length - 2, splitAt));
  const sample = path[splitAt];
  const waiting: Node = { id: `${prefix}${area}-LIFT-${direction === 'ingress' ? 'ENTRY' : 'EXIT'}-WAIT`, floor, area: `${prefix}${area}`, x: sample.x, y: sample.y, heading: sample.tangent };
  layout.nodes.push(waiting);
  const firstPath = path.slice(0, splitAt + 1), secondPath = path.slice(splitAt);
  const first = { ...original, id: `${id}-to-wait`, to: waiting.id, resource: direction === 'egress' ? resource : `multi-${id}-approach`, length: pathLength(firstPath) / UNITS_PER_METER, path: firstPath };
  const second = { ...original, id: `${id}-wait-to-end`, from: waiting.id, resource: direction === 'ingress' ? resource : `multi-${id}-egress`, length: pathLength(secondPath) / UNITS_PER_METER, path: secondPath };
  layout.links.splice(linkIndex, 1, first, second);
  return waiting;
}

function addLiftSite(layout: MultiLargeLayout, index: number, area: string): MultiLargeLifter {
  const site = `LIFT-${String(index + 1).padStart(2, '0')}`;
  const resource = `multi-${site}-resource`;
  const landing0 = layout.nodes.find(node => node.id === `${FLOOR_PREFIX[0]}${area}-STAGING-POOL`)!;
  const landing1 = layout.nodes.find(node => node.id === `${FLOOR_PREFIX[1]}${area}-STAGING-POOL`)!;
  if (!landing0 || !landing1) throw new Error(`Missing isolated waiting/staging pool for ${site} (${area}).`);
  splitStagingLink(layout, 0, area, 'ingress', BUFFER_CLEARANCE, resource);
  splitStagingLink(layout, 0, area, 'egress', BUFFER_CLEARANCE, resource);
  splitStagingLink(layout, 1, area, 'ingress', BUFFER_CLEARANCE, resource);
  splitStagingLink(layout, 1, area, 'egress', BUFFER_CLEARANCE, resource);
  for (const [from, to, suffix] of [[landing0, landing1, 'up'], [landing1, landing0, 'down']] as const) {
    const path: Point[] = [{ x: from.x, y: from.y, tangent: from.heading ?? 0 }, { x: to.x, y: to.y, tangent: to.heading ?? 0 }];
    // Link.length is vertical travel distance in meters. The 10-second value
    // below is separate candidate transfer-time metadata for a future engine phase.
    layout.links.push({ id: `${site}-${suffix}`, from: from.id, to: to.id, kind: 'lifter', capacity: 1, resource, length: LIFTER_VERTICAL_METERS, path });
  }
  return {
    id: site, resource,
    landingNodes: [landing0.id, landing1.id],
    entryWaitNodes: [`${FLOOR_PREFIX[0]}${area}-LIFT-ENTRY-WAIT`, `${FLOOR_PREFIX[1]}${area}-LIFT-ENTRY-WAIT`],
    exitWaitNodes: [`${FLOOR_PREFIX[0]}${area}-LIFT-EXIT-WAIT`, `${FLOOR_PREFIX[1]}${area}-LIFT-EXIT-WAIT`],
    location: { x: landing0.x, y: landing0.y },
    transferSeconds: 10,
  };
}

/** Builds an isolated two-floor topology clone; it is not a public/saveable LayoutId yet. */
export function generateMultiLargeTopology(): MultiLargeLayout {
  const source = generateDefaultTopologyV6('large');
  const lower = cloneFloor(source, 0), upper = cloneFloor(source, 1);
  const result: MultiLargeLayout = {
    ...lower,
    id: 'multi-large',
    multiLargeVersion: '1',
    lifters: [],
    name: 'Multi Large · Two Floor Process Campus',
    description: 'Two independently namespaced Large V6 floors connected by four shared-resource lifters.',
    floors: 2,
    nodes: [...lower.nodes, ...upper.nodes],
    links: [...lower.links, ...upper.links],
    ports: [...lower.ports, ...upper.ports],
    areas: [...lower.areas, ...upper.areas],
    parkingNodes: [...(lower.parkingNodes ?? []), ...(upper.parkingNodes ?? [])],
    facility: {
      ...lower.facility!,
      equipment: [...lower.facility!.equipment, ...upper.facility!.equipment],
      decorativeEquipment: [...(lower.facility!.decorativeEquipment ?? []), ...(upper.facility!.decorativeEquipment ?? [])],
      aisles: [...lower.facility!.aisles, ...upper.facility!.aisles],
      floorBounds: [...lower.facility!.floorBounds, ...upper.facility!.floorBounds],
    },
  };
  for (const area of LIFTER_STAGING_AREAS) {
    result.parkingNodes = result.parkingNodes!.filter(id => id !== `F1:${area}-STAGING-POOL` && id !== `F2:${area}-STAGING-POOL`);
  }
  result.lifters = LIFTER_STAGING_AREAS.map((area, index) => addLiftSite(result, index, area));
  const errors = validateTopologyV6(result);
  if (errors.length) throw new Error(`Invalid generated Multi Large topology: ${errors.slice(0, 12).join('; ')}`);
  return result;
}
