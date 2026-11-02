import type { Layout, Link, Node, Port } from './sim/types';
import { pathForLink, pointAlongPath } from './sim/geometry';

/**
 * Pick one *real* Port → directed Link → Node relationship in the native map.
 * It anchors the editorial close-up, never creates a synthetic rail/route,
 * and never changes the simulation state or a vehicle's selected path.
 */
export type NativeGraphExample = {
  portId: string;
  portNodeId: string;
  nodeId: string;
  linkId: string;
  frame: { x: number; z: number; span: number };
};

export function chooseNativeGraphExample(layout: Layout, floor: number): NativeGraphExample | null {
  const nodeMap = new Map<string, Node>(layout.nodes.map(node => [node.id, node]));
  const bounds = layout.facility?.floorBounds.find(item => item.floor === floor);
  const centerX = bounds ? bounds.x + bounds.width * .53 : layout.width * .53;
  const centerY = bounds ? bounds.y + bounds.height * .48 : layout.height * .48;
  const eligible: Array<{ port: Port; portNode: Node; other: Node; link: Link; score: number }> = [];

  for (const port of layout.ports) {
    const portNode = nodeMap.get(port.node);
    if (!portNode || portNode.floor !== floor) continue;
    for (const link of layout.links) {
      if (link.kind === 'lifter' || (link.from !== port.node && link.to !== port.node)) continue;
      const other = nodeMap.get(link.from === port.node ? link.to : link.from);
      if (!other || other.floor !== floor || other.id === port.node) continue;
      const score = Math.hypot(portNode.x - centerX, portNode.y - centerY)
        + (link.to === port.node ? 0 : 70) // prefer the actual approach direction into a Port
        + (link.length < 12 ? 100 : 0);
      eligible.push({ port, portNode, other, link, score });
    }
  }
  eligible.sort((a, b) => a.score - b.score || a.port.id.localeCompare(b.port.id) || a.link.id.localeCompare(b.link.id));
  const chosen = eligible[0];
  if (!chosen) return null;
  const center = pointAlongPath(pathForLink(layout, chosen.link), .5);
  return {
    portId: chosen.port.id,
    portNodeId: chosen.portNode.id,
    nodeId: chosen.other.id,
    linkId: chosen.link.id,
    frame: {
      x: (chosen.portNode.x + chosen.other.x + center.x) / 3,
      z: (chosen.portNode.y + chosen.other.y + center.y) / 3,
      span: 440,
    },
  };
}
