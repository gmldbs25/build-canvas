import type { Equipment } from '@/sim/types';

type Props = {
  equipment: Equipment;
  portName: string;
  stored: number;
  reserved: number;
  capacity: number;
  selected: boolean;
  showLabel: boolean;
};

const shell = '#e6eae7';
const shellLight = '#f8faf8';
const metal = '#c3cbc8';
const shadow = '#596460';

function Frontage({ equipment, y, x, width }: { equipment: Equipment; y: number; x: number; width: number }) {
  const north = equipment.facing === 'north';
  const faceY = north ? y : y + equipment.height;
  const dockY = equipment.dock.y;
  const centerX = x + width / 2;
  const span = Math.min(26, width * .24);
  const deckY = north ? faceY - 5 : faceY - 3;
  return <g aria-hidden="true" className="facility-frontage">
    <path d={`M${centerX} ${faceY}L${equipment.dock.x} ${dockY}`} stroke="#aeb9b5" strokeWidth="8" strokeLinecap="round" opacity=".64" />
    <path d={`M${centerX} ${faceY}L${equipment.dock.x} ${dockY}`} stroke="#687571" strokeWidth="1.2" />
    <path d={`M${centerX - span / 2} ${faceY - (north ? 1 : 4)}h${span}v7h-${span}z`} fill="#d5ddda" stroke="#73807b" strokeWidth="1" />
    <path d={`M${centerX - span * .3} ${faceY - (north ? 1 : 4)}v-3h${span * .6}v3`} fill="#f7f9f7" stroke="#85918c" strokeWidth=".8" />
    <rect x={equipment.dock.x - span / 2} y={dockY - 3.5} width={span} height="7" rx="2" fill="#eef2f0" stroke="#64716c" strokeWidth="1.2" />
    <path d={`M${equipment.dock.x - 7} ${dockY}h14m-11-2v4m8-4v4`} stroke="#65726d" strokeWidth=".8" />
    <path d={`M${equipment.dock.x - 3} ${dockY + (north ? -5 : 5)}v${north ? -4 : 4}`} stroke="#727e79" strokeWidth="1" />
  </g>;
}

export default function FacilityAsset({ equipment, portName, stored, reserved, capacity, selected, showLabel }: Props) {
  const { x, y, width: w, height: h, variant } = equipment;
  const compact = w < 60 || h < 45;
  const edge = equipment.facing === 'north' ? y : y + h;
  const facesNorth = equipment.facing === 'north';
  const bodyClass = `facility-equipment facility-${variant}${selected ? ' selected' : ''}`;
  return <g className={bodyClass} data-capacity-mode={variant === 'stocker' ? capacity > 5 ? 'aggregate' : 'discrete' : undefined}>
    <title>{`${portName} · ${variant}`}</title>
    <path d={`M${x + 2} ${y + 5}h${w - 4}v${h - 2}h-${w - 4}z`} fill={shadow} opacity=".13" />
    {variant === 'etch' && <g>
      {(() => {
        const r = Math.min(13.5, w * .105, h * .145);
        const podY = y + h * (facesNorth ? .255 : .745);
        const rearY = y + h * (facesNorth ? .34 : .08);
        const rearH = h * .58;
        const chambers = [.2, .43, .66].map(f => x + w * f);
        return <>
          {/* Process chamber modules project from a separate, recessed service body. */}
          <path d={`M${x + 4} ${rearY + 5}l8 -5h${w * .69}l6 6v${rearH - 10}l-7 5H${x + 4}z`} fill="#b9c4c0" stroke="#808c88" strokeWidth="1.25" />
          <rect x={x + 8} y={rearY + 7} width={w * .68} height={rearH - 14} rx="3" fill={shell} stroke="#899491" strokeWidth="1.2" />
          <rect x={x + 14} y={rearY + 13} width={w * .57} height={Math.max(11, h * .14)} rx="2" fill="#d8dfdc" stroke="#a7b1ad" />
          <path d={`M${x + 19} ${rearY + 18}h${w * .45}m-${w * .45} 5h${w * .45}`} stroke="#7f8b86" strokeWidth="1.1" />
          <rect x={x + w * .73} y={y + 8} width={w * .21} height={h - 16} rx="2" fill="#d7ddda" stroke="#858f8b" />
          <rect x={x + w * .77} y={y + 15} width={w * .12} height={h * .22} rx="1.5" fill="#3d514d" stroke="#788681" />
          <path d={`M${x + w * .8} ${y + 19}h${w * .06}m-${w * .06} 4h${w * .06}`} stroke="#a6b5ae" strokeWidth=".8" />
          {chambers.map((cx, i) => <g key={i}>
            <circle cx={cx} cy={podY} r={r + 4} fill="#aeb9b5" stroke="#707c78" strokeWidth="1.25" />
            <circle cx={cx} cy={podY} r={r} fill="#edf1ef" stroke="#899490" strokeWidth="1.15" />
            <circle cx={cx} cy={podY} r={r * .58} fill="#d9dfdc" stroke="#a4aeaa" strokeWidth=".8" />
            <circle cx={cx} cy={podY} r="2" fill="#65736d" />
            <path d={`M${cx - r * .64} ${podY - r * .74}v${-Math.sign(podY - (rearY + rearH / 2)) * 5}h${r * 1.28}v${Math.sign(podY - (rearY + rearH / 2)) * 5}`} fill="#e5eae7" stroke="#77837f" strokeWidth=".9" />
            <path d={`M${cx - 5} ${podY + r + 4}v${facesNorth ? 4 : -4}`} stroke="#798580" strokeWidth="1.2" />
          </g>)}
          <path d={`M${x + 7} ${edge}h${w * .68}`} stroke="#626f6a" strokeWidth="2.4" />
          <circle cx={x + w * .9} cy={y + h * .83} r="2.6" fill="#6c9b83" stroke="#f3f6f4" strokeWidth=".7" />
        </>;
      })()}
    </g>}
    {variant === 'deposition' && <g>
      {(() => {
        const r = Math.min(10.5, w * .085, h * .15);
        const cy = y + h * (facesNorth ? .26 : .74);
        const manifoldY = y + h * (facesNorth ? .37 : .12);
        const shellY = y + h * .13;
        return <>
          <path d={`M${x + 8} ${shellY + 5}l10 -5h${w - 33}l7 6v${h - 19}l-7 7H${x + 8}z`} fill="#bac4c1" stroke="#84908c" strokeWidth="1.2" />
          <rect x={x + 12} y={shellY + 7} width={w - 30} height={h * .68} rx="3" fill="#e7ece9" stroke="#8b9692" strokeWidth="1.2" />
          <rect x={x + w * .43} y={manifoldY} width={w * .17} height={h * .43} rx="2" fill="#c8d1cd" stroke="#85918d" />
          <path d={`M${x + w * .515} ${manifoldY - 7}v${h * .49}m-5 -${h * .43}h10`} stroke="#6c7974" strokeWidth="1.2" />
          {[.23,.77].map((f, i) => <g key={f}>
            <rect x={x + w * f - r * .8} y={y + h * .33} width={r * 1.6} height={h * .36} rx={r * .8} fill="#c5ceca" stroke="#77837f" strokeWidth="1.1" />
            <ellipse cx={x + w * f} cy={y + h * .33} rx={r * .8} ry={r * .4} fill="#f6f8f6" stroke="#77837f" />
            <ellipse cx={x + w * f} cy={y + h * .69} rx={r * .8} ry={r * .4} fill="#afb9b5" stroke="#77837f" />
            <circle cx={x + w * f} cy={y + h * .5} r="2.1" fill={i ? '#9e8154' : '#6d897d'} />
          </g>)}
          {[.32,.68].map(f => <g key={f}><circle cx={x + w * f} cy={cy} r={r + 4} fill="#b2bdb8" stroke="#717d78" strokeWidth="1.15"/><circle cx={x + w * f} cy={cy} r={r} fill="#eef2ef" stroke="#8a9591"/><path d={`M${x + w * f - 3} ${cy}h6m-3-3v6`} stroke="#78847f" strokeWidth=".8"/></g>)}
          <path d={`M${x + 9} ${edge}h${w - 18}`} stroke="#5e6b66" strokeWidth="2.4" />
          <rect x={x + w * .79} y={y + h * .13} width={w * .11} height={h * .14} rx="2" fill="#40534e" stroke="#78847f" />
          <circle cx={x + w * .84} cy={y + h * .2} r="2" fill="#a7b9ae" />
        </>;
      })()}
    </g>}
    {variant === 'lithography' && <g>
      {/* Large scanner enclosure, isolated optical bay, and an enclosed wafer stage. */}
      <path d={`M${x + 3} ${y + 12}l13 -10h${w - 29}l10 8V${y + h - 12}h-8l-10 8H${x + 3}z`} fill="#aeb9b5" stroke="#737f7b" strokeWidth="1.35" />
      <path d={`M${x + 7} ${y + 14}h${w * .71}v${h - 25}h-${w * .71}z`} fill="#e3e8e5" stroke="#7f8a86" strokeWidth="1.2" />
      <path d={`M${x + 14} ${y + 20}h${w * .58}v${h * .33}h-${w * .58}z`} fill="#f8faf8" stroke="#a6b0ac" />
      <path d={`M${x + 19} ${y + 26}h${w * .5}m-${w * .5} 7h${w * .5}m-${w * .5} 7h${w * .5}`} stroke="#aeb8b4" strokeWidth="1" />
      <rect x={x + w * .2} y={y + h * .57} width={w * .42} height={h * .22} rx="3" fill="#c5ceca" stroke="#7a8681" strokeWidth="1.2" />
      <rect x={x + w * .28} y={y + h * .6} width={w * .25} height={h * .14} rx="2" fill="#f7f9f7" stroke="#87938e" />
      <path d={`M${x + w * .74} ${y + 19}h${w * .19}v${h - 33}h-${w * .19}z`} fill="#d4dbd8" stroke="#7d8984" />
      <rect x={x + w * .77} y={y + h * .27} width={w * .12} height={h * .24} rx="2" fill="#435550" stroke="#6e7b75" />
      <path d={`M${x + w * .79} ${y + h * .32}h${w * .08}m-${w * .08} 5h${w * .08}`} stroke="#a9b7b0" strokeWidth=".9" />
      <rect x={x + 12} y={edge - (facesNorth ? 0 : 8)} width={w - 23} height="7" rx="2" fill="#b4bfbb" stroke="#77837e" />
      <path d={`M${x + 17} ${edge - (facesNorth ? -3 : 5)}h${w - 33}`} stroke="#58655f" strokeWidth="1.5" />
      <circle cx={x + w * .88} cy={y + h * .82} r="3" fill="#718f7d" stroke="#f7f9f7" strokeWidth=".8" />
    </g>}
    {variant === 'wet' && <g>
      {/* Open-top wet bench: a long process deck with separated rinse and bath cells. */}
      <path d={`M${x + 2} ${y + 12}l12 -10h${w - 28}l10 8V${y + h - 10}H${x + 14}l-10 7H${x + 2}z`} fill="#b5c0bc" stroke="#78847f" strokeWidth="1.2" />
      <path d={`M${x + 6} ${y + 15}h${w - 15}v${h - 26}h-${w - 15}z`} fill="#e7ece9" stroke="#8e9995" />
      <path d={`M${x + 10} ${y + 19}h${w - 24}v${h * .48}h-${w - 24}z`} fill="#d2e0db" stroke="#889590" />
      {[0,1,2,3].map(i => {
        const bx = x + 14 + i * ((w - 36) / 4), bw = (w - 41) / 4;
        return <g key={i}>
          <rect x={bx} y={y + 23} width={bw} height={h * .39} rx="3" fill={i === 1 || i === 2 ? '#c4d9d1' : '#dbe3df'} stroke="#85938d" strokeWidth="1" />
          <path d={`M${bx + 4} ${y + 29}h${bw - 8}v${h * .25}h-${bw - 8}z`} fill={i === 1 || i === 2 ? '#dcebe5' : '#edf2ef'} stroke="#a1aea8" />
          <path d={`M${bx + 4} ${y + h * .56}h${bw - 8}`} stroke="#7f8d86" strokeWidth="1.1" />
          <path d={`M${bx + 6} ${y + 18}v-4h${bw - 12}v4`} fill="#f6f8f6" stroke="#a2ada8" strokeWidth=".8" />
        </g>;
      })}
      <path d={`M${x + 12} ${y + h * .72}h${w - 24}m-8 0v${h * .1}m${w - 32} -${h * .1}v${h * .1}`} stroke="#76837d" strokeWidth="1.2" />
      <rect x={x + w * .79} y={y + h * .74} width={w * .12} height={h * .12} rx="2" fill="#40534c" stroke="#74817b" />
      <path d={`M${x + 7} ${edge}h${w - 14}`} stroke="#5e6a65" strokeWidth="2.2" />
    </g>}
    {variant === 'metrology' && <g>
      <path d={`M${x + 5} ${y + 6}l8 -5h${w - 20}l7 5v${h - 11}h-${w - 16}z`} fill="#b8c3c0" stroke="#899491" />
      <rect x={x + 4} y={y + 6} width={w - 9} height={h - 11} rx="3" fill="#e9edeb" stroke="#858f8c" strokeWidth="1.2" />
      <circle cx={x + w * .42} cy={y + h * .48} r={Math.min(w * .23, h * .34)} fill="#c5ceca" stroke="#818d89" strokeWidth="1.5" />
      <circle cx={x + w * .42} cy={y + h * .48} r={Math.min(w * .15, h * .22)} fill="#f7f9f7" stroke="#98a39f" />
      <circle cx={x + w * .42} cy={y + h * .48} r="3" fill="#6f817b" />
      <path d={`M${x + w * .68} ${y + h * .3}h${w * .18}v${h * .37}h-${w * .18}z`} fill="#f8faf8" stroke="#acb6b2"/><path d={`M${x + w * .71} ${y + h * .38}h${w * .12}m-${w * .12} 5h${w * .12}`} stroke="#97a39f"/>
      <path d={`M${x + 9} ${edge}h${w - 18}`} stroke="#616d69" strokeWidth="2" />
    </g>}
    {variant === 'stocker' && <g className="facility-storage-state"><title>{`${stored} stored, ${reserved} reserved, capacity ${capacity}`}</title>
      <path d={`M${x + 3} ${y + 6}l10 -5h${w - 22}l9 6v${h - 11}h-${w - 18}z`} fill="#b5c0bd" stroke="#7f8b88" strokeWidth="1.2" />
      <rect x={x + 5} y={y + 7} width={w - 11} height={h - 14} rx="2" fill="#e6ebe8" stroke="#7f8a87" strokeWidth="1.2" />
      <rect x={x + 11} y={y + 13} width={w - 23} height={h - 34} rx="1" fill="#d6dfdb" stroke="#98a39f" />
      {[1,2,3,4,5].map(i => <path key={i} d={`M${x + 12} ${y + 13 + i * ((h - 36) / 6)}h${w - 25}`} stroke="#8b9894" strokeWidth="1.4" />)}
      {Array.from({ length: capacity <= 5 ? capacity : 0 }, (_, i) => <rect key={i} x={x + 16 + (i % 3) * ((w - 36) / 3)} y={y + 17 + Math.floor(i / 3) * ((h - 43) / 2)} width={Math.max(5, (w - 46) / 4)} height={Math.max(4, (h - 60) / 7)} rx="1" fill={i < stored ? '#dbae59' : i < stored + reserved ? '#87c5ba' : '#edf1ef'} stroke="#75827e" strokeWidth=".65" />)}
      <rect x={x + 11} y={y + h - 18} width={w - 23} height="7" rx="1" fill="#c6cfcc" stroke="#8f9a97" />
      {capacity > 5 && <g aria-hidden="true"><rect x={x + 11} y={y + h - 18} width={(w - 23) * stored / capacity} height="7" fill="#dbae59"/><rect x={x + 11 + (w - 23) * stored / capacity} y={y + h - 18} width={(w - 23) * reserved / capacity} height="7" fill="#87c5ba"/></g>}
      <path d={`M${x + 7} ${edge}h${w - 14}`} stroke="#596561" strokeWidth="2.5" />
    </g>}
    {variant === 'buffer' && <g>
      <path d={`M${x + 2} ${y + 5}l7 -4h${w - 15}l6 5v${h - 8}h-${w - 12}z`} fill="#c0c9c6" stroke="#909b98" />
      <rect x={x + 3} y={y + 5} width={w - 7} height={h - 10} rx="3" fill="#e7ece9" stroke="#929d99" strokeWidth="1.1" />
      {Array.from({ length: Math.min(3, capacity) }, (_, i) => <g key={i}><rect x={x + 9 + i * ((w - 26) / 3)} y={y + 10} width={(w - 29) / 3} height={h - 20} rx="2" fill={i < stored ? '#e2d2ae' : '#d4ddd9'} stroke="#9aa6a2"/><path d={`M${x + 12 + i * ((w - 26) / 3)} ${y + h * .44}h${(w - 35) / 3}`} stroke="#788680" strokeWidth="1"/><rect x={x + 14 + i * ((w - 26) / 3)} y={y + h * .5} width={(w - 40) / 3} height={Math.max(5, h * .22)} rx="1.5" fill={i < stored ? '#dbae59' : i < stored + reserved ? '#87c5ba' : '#f8faf8'} stroke="#929e99"/></g>)}
      <path d={`M${x + 5} ${edge}h${w - 10}`} stroke="#606c68" strokeWidth="2" />
    </g>}
    {!compact && <Frontage equipment={equipment} x={x} y={y} width={w} />}
    <g aria-hidden="true" opacity=".75">
      <circle cx={x + 9} cy={y + h - 4} r="2.2" fill="#74817d"/><circle cx={x + w - 9} cy={y + h - 4} r="2.2" fill="#74817d"/>
      {variant !== 'stocker' && variant !== 'buffer' && <path d={`M${x + 12} ${y + h - 2}v4m${w - 24} -4v4`} stroke="#717d79" strokeWidth="1.1"/>}
    </g>
    {selected && <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="5" fill="none" stroke="#58aaa0" strokeWidth="1.6" strokeDasharray="4 3" />}
    {showLabel && <g className="facility-equipment-label">
      <rect x={x} y={facesNorth ? y + h + 8 : y - 25} width={Math.min(Math.max(w, 92), 184)} height="20" rx="4" />
      <text x={x + 7} y={facesNorth ? y + h + 22 : y - 11}>{portName}</text>
    </g>}
  </g>;
}
