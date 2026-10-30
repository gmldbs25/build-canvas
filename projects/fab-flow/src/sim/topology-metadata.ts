import type { Area, Equipment, Port, SingleFloorLayoutId } from './types';

/** Static descriptors shared by the V6 facility generator; contains no graph geometry. */
export type TopologyMetadata = { areas: Area[]; ports: Port[]; equipment: Equipment[] };

type Preset = { rows: number; columns: number; portsPerBay: number };
const PRESETS: Record<'small' | 'medium' | 'large', Preset> = {
  small: { rows: 1, columns: 2, portsPerBay: 8 },
  medium: { rows: 2, columns: 2, portsPerBay: 10 },
  large: { rows: 3, columns: 3, portsPerBay: 12 },
};
const VARIANTS: Equipment['variant'][] = ['etch', 'deposition', 'lithography', 'metrology', 'wet', 'etch', 'deposition', 'stocker', 'buffer', 'metrology', 'wet', 'etch'];
const LABELS: Record<Equipment['variant'], string> = { etch: 'Etch', deposition: 'Deposition', lithography: 'Lithography', metrology: 'Metrology', wet: 'Wet clean', stocker: 'Stocker', buffer: 'Buffer' };

function dimensions(variant: Equipment['variant']) {
  return {
    width: variant === 'lithography' ? 142 : variant === 'metrology' ? 96 : variant === 'wet' ? 132 : variant === 'buffer' ? 80 : 122,
    height: variant === 'lithography' ? 125 : variant === 'metrology' ? 97 : variant === 'wet' || variant === 'buffer' ? 80 : 109,
  };
}

export function getTopologyMetadata(id: SingleFloorLayoutId): TopologyMetadata {
  const preset = PRESETS[id], areas: Area[] = [], ports: Port[] = [], equipment: Equipment[] = [];
  for (let row = 0; row < preset.rows; row++) for (let column = 0; column < preset.columns; column++) {
    const bayNumber = row * preset.columns + column + 1;
    const area = `B${String(bayNumber).padStart(2, '0')}`;
    areas.push({ id: area, name: `PROCESS BAY ${String(bayNumber).padStart(2, '0')}`, floor: 0, x: 90 + column * 1900, y: 90 + row * 1100, width: 1800, height: 900 });
    for (let index = 0; index < preset.portsPerBay; index++) {
      const number = index + 1, variant = VARIANTS[(bayNumber + index) % VARIANTS.length];
      const kind: Port['kind'] = variant === 'stocker' || variant === 'buffer' ? variant : 'tool';
      const portId = `${area}-P${number}`;
      ports.push({ id: portId, node: `${area}-PORT${number}`, name: `${LABELS[variant]} ${area}.${number}`, kind,
        capacity: kind === 'stocker' ? 8 : kind === 'buffer' ? 4 : 2, area, floor: 0 });
      const { width, height } = dimensions(variant);
      equipment.push({ id: `equipment-${portId}`, portId, floor: 0, area, variant,
        facing: index < preset.portsPerBay / 2 ? 'south' : 'north', dock: { x: 0, y: 0 }, x: -width / 2, y: 0, width, height });
    }
  }
  return { areas, ports, equipment };
}
