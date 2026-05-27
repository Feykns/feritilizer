// ============================================================
// DOSIERANLEITUNG — Dosing Guide Overlay
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { stopDrag } from './dnd.jsx';
import { dosingItemsInOrder, isSaltSoluble } from './data.js';

// ============================================================
// CONTAINER TYPE MAPPING
// ============================================================
function getContainerConfig(volume, kind) {
  if (kind === 'solo' || kind === 'topdress' || volume == null) {
    return { type: 'bottle', size: 3 }; // large bottle as default for solo
  }
  if (volume >= 7)    return { type: 'canister', size: 3 };
  if (volume >= 4)    return { type: 'canister', size: 2 };
  if (volume >= 2)    return { type: 'canister', size: 1 };
  if (volume >= 0.76) return { type: 'bottle',   size: 3 };
  if (volume >= 0.3)  return { type: 'bottle',   size: 2 };
  if (volume >= 0.1)  return { type: 'bottle',   size: 1 };
  return { type: 'erlenmeyer', size: 1 };
}

// Heights & widths per size (1=small, 2=medium, 3=large)
const ICON_DIMS = {
  canister:   [{ w: 56, h: 78 }, { w: 61, h: 84 }, { w: 66, h: 90 }],
  bottle:     [{ w: 34, h: 78 }, { w: 38, h: 84 }, { w: 42, h: 90 }],
  erlenmeyer: [{ w: 50, h: 70 }],
};

// ============================================================
// SVG ICONS
// ============================================================
function CanisterSVG({ w, h, color, name }) {
  const col = color || '#34d399';
  const fill = col + '22';
  const handleH = Math.round(h * 0.13);
  const handleW = Math.round(w * 0.52);
  const capH = 7; const capW = Math.round(w * 0.22);
  const bodyY = handleH + 2; const bodyH = h - bodyY;
  const bodyW = w - 4;
  const labelX = 8; const labelW = w - 16;
  const labelY = bodyY + Math.round(bodyH * 0.22); const labelH = Math.round(bodyH * 0.38);
  const nameLen = (name || '').length;
  const fs = Math.max(7, Math.min(12, Math.floor(labelW * 1.3 / Math.max(nameLen, 1))));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={(w - handleW) / 2} y={1} width={handleW} height={handleH} rx="4" fill={fill} stroke={col} strokeWidth="1.5"/>
      <rect x={(w - capW) / 2} y={1} width={capW} height={capH} rx="3" fill={col + '55'} stroke={col} strokeWidth="1"/>
      <rect x={2} y={bodyY} width={bodyW} height={bodyH} rx="5" fill={fill} stroke={col} strokeWidth="1.5"/>
      <line x1={6} y1={bodyY + bodyH * 0.32} x2={w - 6} y2={bodyY + bodyH * 0.32} stroke={col + '55'} strokeWidth="0.8"/>
      <line x1={6} y1={bodyY + bodyH * 0.65} x2={w - 6} y2={bodyY + bodyH * 0.65} stroke={col + '55'} strokeWidth="0.8"/>
      <rect x={labelX} y={labelY} width={labelW} height={labelH} rx="3" fill="rgba(0,0,0,0.38)"/>
      <text x={labelX + labelW / 2} y={labelY + labelH / 2} textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize={fs} fontWeight="700" fontFamily="Inter,system-ui,sans-serif" letterSpacing="-0.02em">
        {name || '?'}
      </text>
    </svg>
  );
}

function BottleSVG({ w, h, color, name }) {
  const col = color || '#34d399';
  const fill = col + '22';
  const capH = 7; const capW = Math.round(w * 0.55);
  const neckH = Math.round(h * 0.26); const neckW = Math.round(w * 0.38);
  const bodyY = neckH; const bodyH = h - bodyY;
  const bw = w - 2;
  const labelX = 4; const labelW = w - 8;
  const labelY = bodyY + Math.round(bodyH * 0.18); const labelH = Math.round(bodyH * 0.42);
  const nameLen = (name || '').length;
  const fs = Math.max(6, Math.min(11, Math.floor(labelW * 1.3 / Math.max(nameLen, 1))));
  const nx = (w - neckW) / 2; const cx = (w - capW) / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={cx} y={1} width={capW} height={capH} rx="3" fill={col + '60'} stroke={col} strokeWidth="1"/>
      <rect x={nx} y={capH} width={neckW} height={neckH - capH + 2} rx="2" fill={fill} stroke={col} strokeWidth="1.5"/>
      <path d={`M${nx - 1} ${bodyY} Q${1} ${bodyY + bodyH * 0.25} ${1} ${bodyY + bodyH * 0.45} L1 ${h - 5} Q1 ${h} ${6} ${h} L${w - 6} ${h} Q${w - 1} ${h} ${w - 1} ${h - 5} L${w - 1} ${bodyY + bodyH * 0.45} Q${w - 1} ${bodyY + bodyH * 0.25} ${nx + neckW + 1} ${bodyY} Z`}
        fill={fill} stroke={col} strokeWidth="1.5"/>
      <rect x={labelX} y={labelY} width={labelW} height={labelH} rx="3" fill="rgba(0,0,0,0.38)"/>
      <text x={labelX + labelW / 2} y={labelY + labelH / 2} textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize={fs} fontWeight="700" fontFamily="Inter,system-ui,sans-serif" letterSpacing="-0.02em">
        {name || '?'}
      </text>
    </svg>
  );
}

function ErlenmeyerSVG({ w, h, color, name }) {
  const col = color || '#34d399';
  const fill = col + '22';
  const capH = 7; const capW = Math.round(w * 0.38);
  const neckH = Math.round(h * 0.28); const neckW = Math.round(w * 0.28);
  const nx = (w - neckW) / 2; const cx = (w - capW) / 2;
  const bodyY = neckH;
  const labelX = 8; const labelW = w - 16;
  const labelY = bodyY + Math.round((h - bodyY) * 0.25); const labelH = Math.round((h - bodyY) * 0.42);
  const nameLen = (name || '').length;
  const fs = Math.max(6, Math.min(10, Math.floor(labelW * 1.2 / Math.max(nameLen, 1))));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={cx} y={1} width={capW} height={capH} rx="2" fill={col + '60'} stroke={col} strokeWidth="1"/>
      <rect x={nx} y={capH} width={neckW} height={neckH - capH} rx="1" fill={fill} stroke={col} strokeWidth="1.5"/>
      <path d={`M${nx - 1} ${bodyY} L${2} ${h - 6} Q${2} ${h} ${7} ${h} L${w - 7} ${h} Q${w - 2} ${h} ${w - 2} ${h - 6} L${nx + neckW + 1} ${bodyY} Z`}
        fill={fill} stroke={col} strokeWidth="1.5"/>
      <rect x={labelX} y={labelY} width={labelW} height={labelH} rx="3" fill="rgba(0,0,0,0.38)"/>
      <text x={labelX + labelW / 2} y={labelY + labelH / 2} textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize={fs} fontWeight="700" fontFamily="Inter,system-ui,sans-serif">
        {name || '?'}
      </text>
    </svg>
  );
}

// RO water tank — modern blue tank with a droplet and water waves
const WATER_COLOR = '#38bdf8';
function WaterTankSVG({ w = 42, h = 78, color = WATER_COLOR }) {
  const col = color;
  const fill = col + '1f';
  const capH = 7; const capW = Math.round(w * 0.5);
  const bodyY = capH + 2; const bodyH = h - bodyY; const bodyW = w - 4;
  const cx = (w - capW) / 2;
  const innerW = w - 12;
  const half = innerW / 4;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={cx} y={1} width={capW} height={capH} rx="3" fill={col + '55'} stroke={col} strokeWidth="1"/>
      <rect x={2} y={bodyY} width={bodyW} height={bodyH} rx="6" fill={fill} stroke={col} strokeWidth="1.5"/>
      {/* droplet */}
      <path d={`M${w / 2} ${bodyY + bodyH * 0.16} c -4.5 6 -6.5 8.5 -6.5 11.5 a 6.5 6.5 0 0 0 13 0 c 0 -3 -2 -5.5 -6.5 -11.5 z`}
        fill={col + '33'} stroke={col} strokeWidth="1.3"/>
      {/* water waves */}
      <path d={`M6 ${bodyY + bodyH * 0.56} q ${half} -6 ${half * 2} 0 q ${half} 6 ${half * 2} 0`} stroke={col + '99'} strokeWidth="1.3" fill="none"/>
      <path d={`M6 ${bodyY + bodyH * 0.74} q ${half} -5 ${half * 2} 0 q ${half} 5 ${half * 2} 0`} stroke={col + '66'} strokeWidth="1.1" fill="none"/>
    </svg>
  );
}

// RO water bucket — trapezoidal pail with handle, water surface & droplet.
// (The earlier WaterTankSVG is kept above in case we want to switch back.)
function WaterBucketSVG({ w = 60, h = 84, color = WATER_COLOR }) {
  const col = color;
  const fill = col + '1f';
  const rimY = Math.round(h * 0.40);   // lower rim → shorter body + room for a tall handle
  const rimH = 5;
  const bodyTop = rimY + rimH;
  const bodyBot = h - 2;
  const topInset = 4;
  const botInset = Math.round(w * 0.16);
  const xLT = topInset, xRT = w - topInset;       // body top corners
  const xLB = botInset, xRB = w - botInset;        // body bottom corners
  const hAttachL = topInset + 3, hAttachR = w - topInset - 3;
  const hr = (hAttachR - hAttachL) / 2;            // semicircular handle radius
  const waveW = xRT - xLT - 8;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* handle — tall semicircular arch */}
      <path d={`M${hAttachL} ${rimY} A ${hr} ${hr} 0 0 1 ${hAttachR} ${rimY}`}
        stroke={col} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* rim */}
      <rect x={topInset - 2} y={rimY} width={w - 2 * (topInset - 2)} height={rimH} rx="2.5"
        fill={col + '40'} stroke={col} strokeWidth="1.4"/>
      {/* body trapezoid */}
      <path d={`M${xLT} ${bodyTop} L${xRT} ${bodyTop} L${xRB} ${bodyBot - 4} Q${xRB} ${bodyBot} ${xRB - 5} ${bodyBot} L${xLB + 5} ${bodyBot} Q${xLB} ${bodyBot} ${xLB} ${bodyBot - 4} Z`}
        fill={fill} stroke={col} strokeWidth="1.5"/>
      {/* water surface waves */}
      <path d={`M${xLT + 4} ${bodyTop + 7} q ${waveW / 4} -4 ${waveW / 2} 0 q ${waveW / 4} 4 ${waveW / 2} 0`}
        stroke={col + '99'} strokeWidth="1.3" fill="none"/>
      {/* droplet */}
      <path d={`M${w / 2} ${bodyTop + 13} c -3.5 4.5 -5 6.5 -5 9 a 5 5 0 0 0 10 0 c 0 -2.5 -1.5 -4.5 -5 -9 z`}
        fill={col + '33'} stroke={col} strokeWidth="1.2"/>
    </svg>
  );
}

// Reagenzglas — lösliches Einzel-Salz in einer Endlösung
function TestTubeSVG({ w = 30, h = 80, color = '#34d399' }) {
  const col = color; const fill = col + '22';
  const tubeW = Math.round(w * 0.5);
  const x = (w - tubeW) / 2;
  const top = 5, bot = h - 3, r = tubeW / 2;
  const liqY = top + (h - top) * 0.42;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1={x - 2.5} y1={top} x2={x + tubeW + 2.5} y2={top} stroke={col} strokeWidth="2" strokeLinecap="round"/>
      <path d={`M${x} ${top} L${x} ${bot - r} Q${x} ${bot} ${x + r} ${bot} Q${x + tubeW} ${bot} ${x + tubeW} ${bot - r} L${x + tubeW} ${top}`}
        fill={fill} stroke={col} strokeWidth="1.5"/>
      <path d={`M${x + 0.8} ${liqY} L${x + 0.8} ${bot - r} Q${x + 0.8} ${bot - 0.8} ${x + r} ${bot - 0.8} Q${x + tubeW - 0.8} ${bot - 0.8} ${x + tubeW - 0.8} ${bot - r} L${x + tubeW - 0.8} ${liqY} Z`}
        fill={col + '40'}/>
      <line x1={x + 1} y1={liqY} x2={x + tubeW - 1} y2={liqY} stroke={col + 'aa'} strokeWidth="1"/>
    </svg>
  );
}

// Messlöffel mit Pulverhäufchen — unlösliche Pulver
function SpoonSVG({ w = 54, h = 70, color = '#34d399' }) {
  const col = color; const fill = col + '22';
  const cx = w * 0.42, cy = h * 0.68, rx = w * 0.34, ry = h * 0.13;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stiel */}
      <line x1={cx + rx * 0.7} y1={cy - ry * 0.5} x2={w - 3} y2={8} stroke={col} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Pulverhaufen */}
      <path d={`M${cx - rx * 0.85} ${cy} Q${cx} ${cy - ry * 2.6} ${cx + rx * 0.85} ${cy} Z`} fill={col + '38'} stroke={col} strokeWidth="1.2"/>
      {/* Schale */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={col} strokeWidth="1.5"/>
      <path d={`M${cx - rx} ${cy} Q${cx} ${cy + ry * 2} ${cx + rx} ${cy}`} fill="none" stroke={col} strokeWidth="1.5"/>
      {/* rieselnde Körnchen */}
      <circle cx={cx - rx * 0.25} cy={cy + ry * 2.4} r="1.3" fill={col}/>
      <circle cx={cx + rx * 0.15} cy={cy + ry * 3.4} r="1.1" fill={col + 'cc'}/>
      <circle cx={cx + rx * 0.45} cy={cy + ry * 2.0} r="1.2" fill={col + 'aa'}/>
    </svg>
  );
}

// Fertigprodukt — Platzhalter-Logo (Name steht rechts daneben)
function ProductSVG({ w = 42, h = 80, color = '#34d399' }) {
  const col = color; const fill = col + '22';
  const capW = Math.round(w * 0.42), capH = 8;
  const cx = (w - capW) / 2;
  const bodyY = capH + 2, bodyH = h - bodyY - 2, bw = w - 6, bx = 3;
  const lblX = bx + 4, lblY = bodyY + bodyH * 0.28, lblW = bw - 8, lblH = bodyH * 0.46;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={cx} y={1} width={capW} height={capH} rx="2" fill={col + '55'} stroke={col} strokeWidth="1"/>
      <rect x={bx} y={bodyY} width={bw} height={bodyH} rx="5" fill={fill} stroke={col} strokeWidth="1.5"/>
      {/* Etikett mit Platzhalter-Logo */}
      <rect x={lblX} y={lblY} width={lblW} height={lblH} rx="2.5" fill="rgba(0,0,0,0.30)" stroke={col + '66'} strokeWidth="0.8"/>
      {/* generisches Logo: Berg + Sonne */}
      <circle cx={lblX + lblW * 0.3} cy={lblY + lblH * 0.38} r={lblH * 0.13} fill={col}/>
      <path d={`M${lblX + 3} ${lblY + lblH - 3} L${lblX + lblW * 0.45} ${lblY + lblH * 0.5} L${lblX + lblW * 0.62} ${lblY + lblH - 3} Z`} fill={col + '99'}/>
      <path d={`M${lblX + lblW * 0.5} ${lblY + lblH - 3} L${lblX + lblW * 0.75} ${lblY + lblH * 0.42} L${lblX + lblW - 3} ${lblY + lblH - 3} Z`} fill={col}/>
    </svg>
  );
}

// Sprühflasche — Foliar (Blattspray)
function SprayBottleSVG({ w = 50, h = 80, color = '#34d399' }) {
  const col = color; const fill = col + '22';
  const bodyY = h * 0.42, bodyW = w * 0.5, bx = 4, bodyBot = h - 3;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Körper */}
      <rect x={bx} y={bodyY} width={bodyW} height={bodyBot - bodyY} rx="5" fill={fill} stroke={col} strokeWidth="1.5"/>
      <rect x={bx + 3} y={bodyY + (bodyBot - bodyY) * 0.35} width={bodyW - 6} height={(bodyBot - bodyY) * 0.4} rx="2" fill="rgba(0,0,0,0.28)"/>
      {/* Hals */}
      <rect x={bx + bodyW * 0.28} y={bodyY - 8} width={bodyW * 0.44} height={10} fill={fill} stroke={col} strokeWidth="1.3"/>
      {/* Kopf/Trigger */}
      <path d={`M${bx} ${bodyY - 8} L${bx} ${bodyY - 20} L${bx + bodyW * 0.85} ${bodyY - 20} L${bx + bodyW * 0.85} ${bodyY - 14} L${bx + bodyW + 2} ${bodyY - 14} L${bx + bodyW + 2} ${bodyY - 8} Z`}
        fill={col + '40'} stroke={col} strokeWidth="1.3" strokeLinejoin="round"/>
      {/* Düse */}
      <line x1={bx + bodyW + 2} y1={bodyY - 11} x2={w - 12} y2={bodyY - 11} stroke={col} strokeWidth="1.5"/>
      {/* Sprühnebel */}
      <circle cx={w - 7} cy={bodyY - 16} r="1.1" fill={col}/>
      <circle cx={w - 5} cy={bodyY - 11} r="1.2" fill={col + 'cc'}/>
      <circle cx={w - 7} cy={bodyY - 6} r="1.1" fill={col + 'aa'}/>
    </svg>
  );
}

function ContainerIcon({ group, color, layout = 'column' }) {
  const { kind, volume, factor, name } = group;
  const col = color || group.color || '#34d399';
  const cfg = getContainerConfig(volume, kind);
  const dims = ICON_DIMS[cfg.type][cfg.size - 1];
  const { w, h } = dims;
  const volLabel = volume != null ? `${volume} L` : null;
  // Faktor/Label neben dem Symbol: Konzentrat → ×Faktor, Endlösung → "Endlösung", Topdress → "Topdress"
  // Faktor wird auf ganze Zahlen gerundet — Dezimalstellen sind hier irrelevant
  // (333.3333… → 333) und füllen das Feld sonst mit endlosen Nachkommastellen.
  const sideLabel = kind === 'stock'
    ? (factor ? `×${Math.round(factor)}` : null)
    : kind === 'solo' ? 'Endlösung'
    : kind === 'topdress' ? 'Topdress'
    : null;

  const iconBlock = (
    <div className="relative" style={{ width: w, height: h }}>
      {cfg.type === 'canister'   && <CanisterSVG   w={w} h={h} color={col} name={name || '?'}/>}
      {cfg.type === 'bottle'     && <BottleSVG     w={w} h={h} color={col} name={name || '?'}/>}
      {cfg.type === 'erlenmeyer' && <ErlenmeyerSVG w={w} h={h} color={col} name={name || '?'}/>}
      {/* Gesamtmenge in das Icon, in die freie Fläche unter dem Etikett */}
      {volLabel && (
        <div className="absolute inset-x-0 text-center font-bold pointer-events-none"
          style={{ bottom: Math.round(h * 0.08), fontSize: 9, color: col }}>
          {volLabel}
        </div>
      )}
    </div>
  );

  if (layout === 'row') {
    // Zeilen-Layout (Gruppen als Zeilen, transposed): Label RECHTS vom Symbol,
    // unten bündig — alle Symbole linksbündig in fester Box, damit ihre
    // Symmetrieachsen exakt untereinander liegen.
    const ICON_BOX_W = 66;
    return (
      <div className="flex items-end gap-1.5 select-none">
        <div className="flex justify-center flex-shrink-0" style={{ width: ICON_BOX_W }}>
          {iconBlock}
        </div>
        {sideLabel && (
          <div className="text-[10px] font-bold flex-shrink-0 leading-none pb-1 whitespace-nowrap" style={{ color: col }}>
            {sideLabel}
          </div>
        )}
      </div>
    );
  }

  // Spalten-Layout (default, Gruppen als Spalten): Symbol mittig in der Spalte,
  // Faktor/Label UNTERHALB des Symbols — so bleibt das Symbol optisch zentriert.
  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      {iconBlock}
      {sideLabel && (
        <div className="text-[10px] font-bold leading-none whitespace-nowrap" style={{ color: col }}>
          {sideLabel}
        </div>
      )}
    </div>
  );
}

// Icon + Beschriftung für einen Einzel-Eintrag (Endlösung/Topdress-Salz)
function SaltItemIcon({ salt, group, color, layout = 'column' }) {
  const soluble = isSaltSoluble(salt);
  const isProduct = salt.type === 'product';
  const isFoliar = !!group.foliar;
  const display = salt.shortName || salt.name || '?';
  let Icon;
  if (isFoliar) Icon = <SprayBottleSVG color={color}/>;
  else if (isProduct) Icon = <ProductSVG color={color}/>;
  else if (!soluble) Icon = <SpoonSVG color={color}/>;
  else Icon = <TestTubeSVG color={color}/>;

  if (isProduct) {
    // Produkt: Platzhalter-Logo + voller Name rechts daneben (in beiden Layouts)
    return (
      <div className="flex items-center gap-1.5 select-none justify-center">
        <div className="flex-shrink-0">{Icon}</div>
        <div className="text-[10px] font-semibold leading-tight text-left break-words" style={{ color, maxWidth: 72 }}>
          {salt.name || display}
        </div>
      </div>
    );
  }

  if (layout === 'row') {
    // Zeilen-Layout (transposed): Salzname RECHTS vom Symbol, unten bündig —
    // gleiche Anordnung wie ContainerIcon im Zeilen-Modus.
    return (
      <div className="flex items-end gap-1.5 select-none">
        <div className="flex-shrink-0">{Icon}</div>
        <div className="text-[10px] font-bold leading-none pb-1 whitespace-nowrap" style={{ color }}>
          {display}
        </div>
      </div>
    );
  }

  // Spalten-Layout (default): Salzname UNTER dem Symbol, mittig
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex-shrink-0">{Icon}</div>
      <div className="text-[10px] font-bold" style={{ color }}>{display}</div>
    </div>
  );
}

// ============================================================
// INLINE EC EDITOR
// ============================================================
function EcCell({ value, onChange, accent }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  const commit = () => {
    const t = draft.trim();
    if (t === '') { onChange(null); }
    else {
      const n = parseFloat(t.replace(',', '.'));
      onChange(isNaN(n) ? null : n);
    }
    setEditing(false);
  };

  if (editing) return (
    <input ref={ref} type="text" inputMode="decimal" value={draft}
      onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className="mono w-14 bg-neutral-800 border border-neutral-600 rounded px-1 py-0.5 text-[12px] text-center outline-none"
      style={{ boxShadow: `0 0 0 2px ${accent}66` }}
    />
  );

  return (
    <button onClick={() => { setDraft(value != null ? String(value) : ''); setEditing(true); }}
      className="mono text-[13px] font-semibold rounded px-2 py-0.5 hover:bg-neutral-800/60 transition-colors"
      style={{ color: value != null ? accent : '#4b5563' }}>
      {value != null ? Number(value).toFixed(1) : '–'}
    </button>
  );
}

// ============================================================
// CALCULATIONS
// ============================================================
// Concentration per liter for a group (ml/L for stock, g/L otherwise)
function groupPerL(group) {
  if (group.kind === 'stock') return group.mlPerL || 0;
  const totalMass = (group.salts || []).reduce((s, salt) =>
    s + (salt.massUnit !== 'ml' ? (salt.mass || 0) : 0), 0);
  return totalMass / Math.max(group.volume || 1, 0.001);
}

// Dose for a single group cell.
//   mode 'A' → scaled by ecFactor = zielEC/vollEC (reduced dose into fixed volume)
//   mode 'B' → full dose (Vollwert), water added separately
function calcDose(vollEC, zielEC, group, gesamtmenge, mode) {
  const isAbs = gesamtmenge > 1;
  const V = isAbs ? gesamtmenge : 1;
  const perL = groupPerL(group);
  const unit = group.kind === 'stock' ? (isAbs ? 'ml' : 'ml/L') : (isAbs ? 'g' : 'g/L');
  let ecFactor = 1;
  if (mode === 'A') {
    const vEC = vollEC != null ? Number(vollEC) : null;
    const zEC = zielEC != null ? Number(zielEC) : null;
    ecFactor = (zEC != null && vEC != null && vEC > 0) ? (zEC / vEC) : 1;
  }
  return { val: perL * ecFactor * (isAbs ? V : 1), unit };
}

// Mode B RO-water: dilute the full-strength base (Menge L at vollEC) down to zielEC.
//   final volume = Menge + water;  water = Menge × (vollEC/zielEC − 1)
function calcWater(vollEC, zielEC, gesamtmenge) {
  const vEC = vollEC != null ? Number(vollEC) : null;
  const zEC = zielEC != null ? Number(zielEC) : null;
  if (vEC == null || zEC == null || zEC === 0) return null;
  const ratio = vEC / zEC;
  const V = gesamtmenge > 1 ? gesamtmenge : 1;
  const applicable = ratio > 1;
  return { pct: (ratio - 1) * 100, liters: V * (ratio - 1), applicable };
}

// Dosis für ein einzelnes Salz (Endlösung) bzw. Topdress (pro Pflanze).
function calcSaltDose(salt, group, vollEC, zielEC, gesamtmenge, mode) {
  const unitBase = salt.massUnit === 'ml' ? 'ml' : 'g';
  if (group.kind === 'topdress') {
    return { val: salt.mass || 0, unit: unitBase + '/Pfl.' };
  }
  const isAbs = gesamtmenge > 1;
  const V = isAbs ? gesamtmenge : 1;
  const perL = (salt.mass || 0) / Math.max(group.volume || 1, 0.001);
  let ecFactor = 1;
  if (mode === 'A') {
    const vEC = vollEC != null ? Number(vollEC) : null;
    const zEC = zielEC != null ? Number(zielEC) : null;
    ecFactor = (zEC != null && vEC != null && vEC > 0) ? (zEC / vEC) : 1;
  }
  return { val: perL * ecFactor * (isAbs ? V : 1), unit: isAbs ? unitBase : unitBase + '/L' };
}

function fmtVal(v, dec) {
  if (v == null || isNaN(v)) return '–';
  const d = dec ?? (Math.abs(v) < 10 ? 2 : 1);
  return v.toFixed(d);
}

// ============================================================
// DOSING GUIDE OVERLAY
// ============================================================
const DEFAULT_ACCENT = { accent: '#10b981', hover: '#34d399', soft: 'rgba(16,185,129,0.15)', text: '#6ee7b7' };

export function DosingGuide({
  recipe, onClose,
  onAddCombination, onUpdateCombination, onRemoveCombination,
  onAddPhase, onUpdatePhase, onRemovePhase, onReorderPhases,
  onSaveGuideSettings, isDark = true, accent: accentProp, lang = 'de',
}) {
  const accent = accentProp || DEFAULT_ACCENT;
  const combinations = recipe.measured?.ecValues || [];
  const groups   = recipe.groups || [];
  const guide    = recipe.dosingGuide || {};
  const phases   = guide.phases || [];
  const recipeColor = recipe.themeColor || accent.accent;
  // Dosieranleitung-Einträge in Mischreihenfolge (Konzentrat = Gruppe, Endlösung/
  // Topdress = je Salz). gapBefore markiert Bucket-Wechsel (Abstand vor Topdress/Foliar).
  const orderedItems = React.useMemo(() => {
    // Phasen + Combinations mitgeben → aktiviert die Phasen-Ausnahmeregel:
    // Gruppen, die erst in späten Phasen verwendet werden, rutschen in der
    // Spaltenreihenfolge nach hinten (verhindert lange leere Spalten).
    const items = dosingItemsInOrder(groups, { phases, combinations });
    return items.map((it, idx) => ({ ...it, gapBefore: idx > 0 && it.bucket !== items[idx - 1].bucket }));
  }, [groups, phases, combinations]);

  const combById = React.useMemo(
    () => Object.fromEntries(combinations.map(c => [c.id, c])),
    [combinations]
  );

  const [transposed, setTransposed] = useState(guide.transposed || false);
  const [mode,       setMode]       = useState('A');
  const [showKebab,  setShowKebab]  = useState(false);
  // Tabellen-Zoom — adaptive Stufen je nach Bildschirmgröße:
  //   Mobile (< 640 px):  0.55 (zeigt ~6 Spalten)  ⇄  0.40 (Übersicht)
  //   Desktop (≥ 640 px): 1.00 (Originalgröße)     ⇄  0.75 (passt mehr auf den Schirm)
  // Auf dem Computerbildschirm sind 55 %/40 % viel zu klein — Standard 100 %
  // ist hier sinnvoll, weil die Bildschirmbreite ausreicht und Pinch-/Maus-
  // Zoom zusätzlich verfügbar sind.
  const isMobileViewport = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 639px)').matches
    : false;
  const ZOOM_LEVELS = isMobileViewport ? [0.55, 0.4] : [1, 0.75];
  const ZOOM_DEFAULT = ZOOM_LEVELS[0];
  const [tableZoom, setTableZoom] = useState(() => {
    try {
      const key = isMobileViewport ? 'hydro:dosingGuideZoom' : 'hydro:dosingGuideZoomDesktop';
      const v = parseFloat(localStorage.getItem(key));
      return ZOOM_LEVELS.includes(v) ? v : ZOOM_DEFAULT;
    } catch { return ZOOM_DEFAULT; }
  });
  const cycleTableZoom = () => {
    const next = ZOOM_LEVELS[(ZOOM_LEVELS.indexOf(tableZoom) + 1) % ZOOM_LEVELS.length];
    setTableZoom(next);
    try {
      const key = isMobileViewport ? 'hydro:dosingGuideZoom' : 'hydro:dosingGuideZoomDesktop';
      localStorage.setItem(key, String(next));
    } catch {}
  };
  const [volumeInput, setVolumeInput] = useState(String(guide.volume || ''));
  const [bInfoHidden, setBInfoHidden] = useState(() => {
    try { return localStorage.getItem('hydro:dosingBInfoHidden') === '1'; } catch { return false; }
  });
  const dismissBInfo = () => {
    setBInfoHidden(true);
    try { localStorage.setItem('hydro:dosingBInfoHidden', '1'); } catch {}
  };

  // Add / edit phase form
  const [adding,        setAdding]        = useState(false);
  const [editingPhase,  setEditingPhase]  = useState(null); // phase id being edited via form
  const [phaseNameDraft, setPhaseNameDraft] = useState('');
  const [pickComboId,   setPickComboId]   = useState(null); // existing combo id | 'new'
  const [newComboGroupIds, setNewComboGroupIds] = useState([]);
  const [newComboVollEC,   setNewComboVollEC]   = useState('');
  const [newComboName,     setNewComboName]     = useState('');

  // Quick inline rename of a phase
  const [renameId,    setRenameId]    = useState(null);
  const [renameDraft, setRenameDraft] = useState('');

  const addNameRef = useRef(null);
  const renameRef  = useRef(null);
  const kebabRef   = useRef(null);

  const gesamtmenge = parseFloat(volumeInput.replace(',', '.')) || 1;

  const groupColor = (g) => g.themeColor || recipe.themeColor || accent.accent;

  // One-time migration: old recipes stored each EC entry as a phase (1:1).
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current) return;
    if (!Array.isArray(guide.phases)) {
      migratedRef.current = true;
      const initial = combinations.map(c => ({
        id: 'ph-' + Math.random().toString(36).slice(2, 8),
        name: c.name, ecId: c.id, zielEC: c.zielEC ?? null,
      }));
      onSaveGuideSettings?.({ phases: initial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close kebab on outside click
  useEffect(() => {
    if (!showKebab) return;
    const h = (e) => { if (kebabRef.current && !kebabRef.current.contains(e.target)) setShowKebab(false); };
    const tid = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(tid); document.removeEventListener('mousedown', h); };
  }, [showKebab]);

  useEffect(() => { if (renameId && renameRef.current) { renameRef.current.focus(); renameRef.current.select(); } }, [renameId]);

  const handleTranspose = () => {
    const next = !transposed;
    setTransposed(next);
    onSaveGuideSettings?.({ ...guide, transposed: next });
  };

  const handleVolumeBlur = () => {
    const v = parseFloat(volumeInput.replace(',', '.')) || null;
    onSaveGuideSettings?.({ ...guide, volume: v || null });
  };

  // ── Phase data resolution ──
  const phaseInfo = (phase) => {
    const comb = combById[phase.ecId] || null;
    return {
      comb,
      groupIds: comb?.groupIds || [],
      vollEC: comb?.value ?? null,
      zielEC: phase.zielEC ?? null,
      combName: comb?.name || '—',
    };
  };

  // ── Add / edit phase form ──
  const resetForm = () => {
    setAdding(false); setEditingPhase(null);
    setPhaseNameDraft(''); setPickComboId(null);
    setNewComboGroupIds([]); setNewComboVollEC(''); setNewComboName('');
  };
  const openAdding = () => {
    resetForm();
    setPickComboId(combinations.length > 0 ? combinations[0].id : 'new');
    setAdding(true);
    setTimeout(() => addNameRef.current?.focus(), 50);
  };
  const openEdit = (phase) => {
    resetForm();
    setEditingPhase(phase.id);
    setPhaseNameDraft(phase.name || '');
    setPickComboId(phase.ecId || (combinations[0]?.id ?? 'new'));
    setAdding(true);
    setTimeout(() => addNameRef.current?.focus(), 50);
  };
  const toggleNewGroup = (id) =>
    setNewComboGroupIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const submitForm = () => {
    const pname = phaseNameDraft.trim() || `Phase ${phases.length + 1}`;
    let ecId = pickComboId;
    if (pickComboId === 'new') {
      const autoName = groups.filter(g => newComboGroupIds.includes(g.id)).map(g => g.name || '?').join(' + ') || 'Kombination';
      const comboName = newComboName.trim() || autoName;
      const vEC = newComboVollEC.trim() ? parseFloat(newComboVollEC.replace(',', '.')) : null;
      ecId = onAddCombination(comboName, (vEC == null || isNaN(vEC)) ? null : vEC, newComboGroupIds);
    }
    if (!ecId) return; // nothing selected
    if (editingPhase) onUpdatePhase(editingPhase, { name: pname, ecId });
    else onAddPhase(pname, ecId, null);
    resetForm();
  };

  // ── Quick rename ──
  const startRename = (phase) => { setRenameId(phase.id); setRenameDraft(phase.name || ''); };
  const commitRename = () => {
    if (renameId) { const v = renameDraft.trim(); if (v) onUpdatePhase(renameId, { name: v }); }
    setRenameId(null);
  };

  // ── Layout dimensions ──
  const COL_W    = 120;
  const ROW_H    = 56;
  const HEADER_H = 120;
  const ROW_TH   = 100; // uniform row height in transposed view (independent of icon size)
  const LABEL_W  = 150;
  const EC_W     = 72;
  const WATER_W  = 96;
  // Visuelle Lücke vor einem Bucket-Wechsel (Konzentrat→Topdress→Foliar)
  // — statt einer Trennlinie wird tatsächlicher Leerraum erzeugt.
  const GAP_W    = 22; // Spalten-Ansicht: zusätzliche Spaltenbreite
  const GAP_H    = 14; // Zeilen-Ansicht (transposed): zusätzliche Höhe vor der Bucket-Wechsel-Zeile

  const showWater = mode === 'B';

  // Header-Maxbreite (Navigationsleiste); die Tabelle darf symmetrisch nach links
  // UND rechts über MAX_W hinaus wachsen, bis der Bildschirm voll ist.
  const MAX_W = 849;
  // Zähle Bucket-Wechsel-Spalten für die Tabellen-Mindestbreite
  const gapColCount = orderedItems.filter(it => it.gapBefore).length;
  const tableW = transposed
    ? LABEL_W + phases.length * COL_W
    : LABEL_W + orderedItems.length * COL_W + gapColCount * GAP_W + (showWater ? WATER_W : 0) + EC_W * 2;

  // Header-Inhalt eines Eintrags: Konzentratgruppe → Container; Einzel-Salz → SaltItemIcon
  // layout: 'column' (Spalten-Ansicht, default) oder 'row' (transposed/Zeilen-Ansicht)
  const itemHeaderContent = (item, layout = 'column') =>
    item.type === 'group'
      ? <ContainerIcon group={item.group} color={groupColor(item.group)} layout={layout}/>
      : <SaltItemIcon salt={item.salt} group={item.group} color={groupColor(item.group)} layout={layout}/>;

  // Wertzelle eines Eintrags.
  //  • colGap = visuelle Lücke LINKS der Spalte (Bucket-Wechsel in Spalten-Ansicht)
  //  • rowGap = visuelle Lücke OBEN der Zeile (Bucket-Wechsel in Zeilen-Ansicht)
  const itemCell = (phase, item, key, colGap = false, rowGap = false) => {
    const { groupIds, vollEC, zielEC } = phaseInfo(phase);
    const padL = colGap ? (4 + GAP_W) : 4;
    const padT = (rowGap ? GAP_H : 0) + 4;
    const cellStyle = { paddingLeft: padL, paddingRight: 4, paddingTop: padT, paddingBottom: 4 };
    if (!groupIds.includes(item.group.id)) {
      return (
        <td key={key} className="text-center border-r border-neutral-800/30 text-neutral-700" style={cellStyle}>
          <span className="text-xl leading-none">–</span>
        </td>
      );
    }
    const color = groupColor(item.group);
    const cell = item.type === 'group'
      ? calcDose(vollEC, zielEC, item.group, gesamtmenge, mode)
      : calcSaltDose(item.salt, item.group, vollEC, zielEC, gesamtmenge, mode);
    return (
      <td key={key} className="text-center border-r border-neutral-800/30" style={{ color, ...cellStyle }}>
        <div className="font-mono font-semibold text-[15px]">{fmtVal(cell.val)}</div>
        <div className="text-[11px] font-semibold opacity-75 mt-0.5">{cell.unit}</div>
      </td>
    );
  };

  // RO-water cell content (mode B only)
  const waterCell = (phase, key) => {
    const { vollEC, zielEC } = phaseInfo(phase);
    const w = calcWater(vollEC, zielEC, gesamtmenge);
    if (!w || !w.applicable) {
      return <td key={key} className="text-center border-r border-neutral-800/30 text-neutral-600">–</td>;
    }
    const isAbs = gesamtmenge > 1;
    return (
      <td key={key} className="text-center border-r border-neutral-800/30 px-1 py-1">
        <div className="font-mono font-semibold text-[14px]" style={{ color: WATER_COLOR }}>+{fmtVal(w.pct, 1)}%</div>
        <div className="text-[11px] font-semibold mt-0.5" style={{ color: WATER_COLOR + 'cc' }}>+{fmtVal(w.liters, 2)} {isAbs ? 'L' : 'L/L'}</div>
      </td>
    );
  };

  // ── Non-transposed: columns = groups [+ water], rows = phases ──
  const renderNonTransposed = () => {
    const totalCols = 1 + orderedItems.length + (showWater ? 1 : 0) + 2;
    return (
      <div className="overflow-auto h-full">
        <table className="border-collapse" style={{ minWidth: tableW }}>
          <thead>
            {/* Mischreihenfolge: Pfeil nach rechts über den Gruppenspalten */}
            <tr>
              <th className="sticky left-0 z-20 bg-neutral-900"/>
              <th colSpan={orderedItems.length} className="bg-neutral-900 px-2 pt-1.5">
                <div className="flex items-center gap-2 text-neutral-500">
                  <span className="text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap">Mischreihenfolge</span>
                  <svg width="52" height="9" viewBox="0 0 52 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <line x1="1" y1="4.5" x2="47" y2="4.5"/>
                    <polyline points="43,1.5 50,4.5 43,7.5"/>
                  </svg>
                </div>
              </th>
              {showWater && <th className="bg-neutral-900"/>}
              <th className="bg-neutral-900"/>
              <th className="bg-neutral-900"/>
            </tr>
            <tr>
              <th style={{ width: LABEL_W, minWidth: LABEL_W, height: HEADER_H }}
                className="sticky left-0 z-20 bg-neutral-900 border-b border-r border-neutral-800"/>
              {orderedItems.map(item => {
                // Bucket-Wechsel: zusätzliche Breite + paddingLeft im Inhalt → echte Lücke
                const colW = item.gapBefore ? COL_W + GAP_W : COL_W;
                return (
                  <th key={item.key} style={{ width: colW, height: HEADER_H }}
                    className="border-b border-neutral-800 px-2">
                    <div className="flex flex-col items-center justify-center h-full gap-1 py-2"
                      style={item.gapBefore ? { paddingLeft: GAP_W } : undefined}>
                      {itemHeaderContent(item, 'column')}
                    </div>
                  </th>
                );
              })}
              {showWater && (
                <th className="border-b border-l px-2"
                  style={{ width: WATER_W, height: HEADER_H, borderLeftColor: WATER_COLOR + '55' }}>
                  <div className="flex flex-col items-center justify-center h-full gap-1 py-2">
                    <WaterBucketSVG w={60} h={84}/>
                    <div className="text-[9px] font-semibold" style={{ color: WATER_COLOR }}>RO-Wasser</div>
                  </div>
                </th>
              )}
              <th style={{ width: EC_W }} className="border-b border-l border-neutral-700 bg-neutral-900 text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-center px-1">
                Ziel-EC
              </th>
              <th style={{ width: EC_W }} className="border-b border-l border-neutral-800 bg-neutral-900 text-[9px] uppercase tracking-wider text-neutral-500 font-medium text-center px-1">
                Voll-EC
              </th>
            </tr>
          </thead>
          <tbody>
            {phases.length === 0 && !adding && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center text-neutral-600 text-sm italic">
                  Noch keine Phasen. Tippe oben auf +, um eine Phase hinzuzufügen.
                </td>
              </tr>
            )}
            {phases.map((phase, pi) => {
              const { comb, combName } = phaseInfo(phase);
              // Zebra: jede zweite Zeile minimal heller, passend zum App-Look
              const zebraBg = pi % 2 === 1 ? 'bg-neutral-900/30' : '';
              return (
                <tr key={phase.id}
                  className={`border-b border-neutral-800/40 hover:bg-neutral-800/30 transition-colors group ${zebraBg}`}>

                  {/* Phase label */}
                  <td style={{ height: ROW_H }}
                    className="sticky left-0 z-10 border-r border-neutral-800 bg-neutral-900 px-2">
                    <div className="flex items-center gap-1.5 h-full">
                      <div className="flex-1 min-w-0">
                        {renameId === phase.id ? (
                          <input ref={renameRef} type="text" value={renameDraft} {...stopDrag}
                            onChange={e => setRenameDraft(e.target.value)} onBlur={commitRename}
                            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenameId(null); }}
                            className="w-full bg-neutral-800 rounded px-1.5 py-0.5 text-sm outline-none"
                            style={{ boxShadow: `0 0 0 2px ${accent.accent}` }} />
                        ) : (
                          <button onClick={() => startRename(phase)} {...stopDrag}
                            className="block text-left text-sm font-medium text-neutral-200 truncate hover:text-white max-w-full">
                            {phase.name}
                          </button>
                        )}
                        <div className="text-[9px] text-neutral-500 truncate">{combName}</div>
                      </div>
                      {/* edit / delete — immer sichtbar (mobile: kein hover) */}
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => openEdit(phase)} {...stopDrag} title="Phase bearbeiten"
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button onClick={() => onRemovePhase(phase.id)} {...stopDrag} title="Phase löschen"
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Eintrags-Zellen (Konzentratgruppe / Einzel-Salz) */}
                  {orderedItems.map(item => itemCell(phase, item, item.key, item.gapBefore, false))}

                  {/* RO water (mode B) */}
                  {showWater && waterCell(phase, 'water')}

                  {/* Ziel-EC (per phase) */}
                  <td className="text-center border-l border-neutral-700 px-1 py-1" {...stopDrag}>
                    <EcCell value={phase.zielEC} onChange={val => onUpdatePhase(phase.id, { zielEC: val })} accent="#60a5fa"/>
                  </td>
                  {/* Voll-EC (per combination) */}
                  <td className="text-center border-l border-neutral-800 px-1 py-1" {...stopDrag}>
                    {comb
                      ? <EcCell value={comb.value} onChange={val => onUpdateCombination(comb.id, { value: val })} accent={accent.accent}/>
                      : <span className="text-neutral-600 text-[13px]">–</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {adding && renderAddForm()}
      </div>
    );
  };

  // ── Transposed: rows = groups [+ water], cols = phases ──
  const renderTransposed = () => (
    <div className="overflow-auto h-full">
      <table className="border-collapse" style={{ minWidth: tableW }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-30 bg-neutral-900 border-b border-neutral-800 h-10" style={{ width: 24, minWidth: 24 }}/>
            <th style={{ width: LABEL_W, minWidth: LABEL_W, left: 24 }}
              className="sticky z-20 bg-neutral-900 border-b border-r border-neutral-800 h-10"/>
            {phases.map(phase => {
              const { combName } = phaseInfo(phase);
              return (
                <th key={phase.id} style={{ width: COL_W }}
                  className="border-b border-neutral-800 bg-neutral-900/60 px-2 py-2 text-center group">
                  <div className="flex items-center justify-center gap-1">
                    {renameId === phase.id ? (
                      <input ref={renameRef} type="text" value={renameDraft}
                        onChange={e => setRenameDraft(e.target.value)} onBlur={commitRename}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenameId(null); }}
                        className="w-full bg-neutral-800 rounded px-1.5 py-0.5 text-sm outline-none text-center"
                        style={{ boxShadow: `0 0 0 2px ${accent.accent}` }} />
                    ) : (
                      <button onClick={() => startRename(phase)} className="text-sm font-medium text-neutral-200 truncate hover:text-white">
                        {phase.name}
                      </button>
                    )}
                  </div>
                  <div className="text-[9px] text-neutral-500 truncate mt-0.5">{combName}</div>
                  <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity mt-1">
                    <button onClick={() => openEdit(phase)} title="Phase bearbeiten"
                      className="w-5 h-5 rounded flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button onClick={() => onRemovePhase(phase.id)} title="Phase löschen"
                      className="w-5 h-5 rounded flex items-center justify-center text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Eintrags-Zeilen (Konzentratgruppe / Einzel-Salz) */}
          {orderedItems.map((item, gi) => {
            // Zebra-Streifen für Lesbarkeit; passt zum App-Look
            const zebraBg = gi % 2 === 1 ? 'bg-neutral-900/30' : '';
            // Bucket-Wechsel: extra Höhe oben als echte Lücke (statt Linie)
            const padT = item.gapBefore ? (GAP_H + 4) : 4;
            return (
              <tr key={item.key} className={`border-b border-neutral-800/40 hover:bg-neutral-800/30 transition-colors ${zebraBg}`}>
                {gi === 0 && (
                  <td rowSpan={orderedItems.length}
                    className="sticky left-0 z-10 bg-neutral-900 border-r border-neutral-800 p-0 align-top"
                    style={{ width: 24, minWidth: 24 }}>
                    <div className="flex flex-col items-center pt-3 gap-1.5 text-neutral-500">
                      <div style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }} className="text-[8px] uppercase font-semibold tracking-wider">Mischreihenfolge</div>
                      <svg width="9" height="52" viewBox="0 0 9 52" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <line x1="4.5" y1="1" x2="4.5" y2="47"/>
                        <polyline points="1.5,43 4.5,50 7.5,43"/>
                      </svg>
                    </div>
                  </td>
                )}
                <td className="sticky z-10 bg-neutral-900 border-r border-neutral-800 px-3"
                    style={{ height: ROW_TH, left: 24, paddingTop: padT, paddingBottom: 4 }}>
                  <div className="flex items-end justify-start gap-3 h-full">
                    {itemHeaderContent(item, 'row')}
                  </div>
                </td>
                {phases.map(phase => itemCell(phase, item, phase.id, false, item.gapBefore))}
              </tr>
            );
          })}

          {/* RO water row (mode B) */}
          {showWater && (
            <tr className="border-b border-neutral-800/40" style={{ background: WATER_COLOR + '0d' }}>
              <td className="sticky left-0 z-10 bg-neutral-900 border-r border-neutral-800" style={{ width: 24, minWidth: 24 }}/>
              <td className="sticky z-10 border-r px-3"
                style={{ height: ROW_TH, left: 24, background: '#0f1720', borderRightColor: WATER_COLOR + '40' }}>
                <div className="flex items-center gap-2 h-full">
                  <WaterBucketSVG w={60} h={84}/>
                  <span className="text-[12px] font-semibold" style={{ color: WATER_COLOR }}>RO-Wasser</span>
                </div>
              </td>
              {phases.map(phase => waterCell(phase, phase.id))}
            </tr>
          )}

          {/* Ziel-EC row (per phase) */}
          <tr className="border-t-2 border-neutral-700">
            <td className="sticky left-0 z-10 bg-neutral-900 border-r border-neutral-800" style={{ width: 24, minWidth: 24 }}/>
            <td className="sticky z-10 bg-neutral-900 border-r border-neutral-800 px-3 py-2" style={{ left: 24 }}>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Ziel-EC</span>
            </td>
            {phases.map(phase => (
              <td key={phase.id} className="text-center border-r border-neutral-800/30 px-1 py-2">
                <EcCell value={phase.zielEC} onChange={val => onUpdatePhase(phase.id, { zielEC: val })} accent="#60a5fa"/>
              </td>
            ))}
          </tr>
          {/* Voll-EC row (per combination) */}
          <tr className="border-b border-neutral-800">
            <td className="sticky left-0 z-10 bg-neutral-900 border-r border-neutral-800" style={{ width: 24, minWidth: 24 }}/>
            <td className="sticky z-10 bg-neutral-900 border-r border-neutral-800 px-3 py-2" style={{ left: 24 }}>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Voll-EC</span>
            </td>
            {phases.map(phase => {
              const { comb } = phaseInfo(phase);
              return (
                <td key={phase.id} className="text-center border-r border-neutral-800/30 px-1 py-2">
                  {comb
                    ? <EcCell value={comb.value} onChange={val => onUpdateCombination(comb.id, { value: val })} accent={accent.accent}/>
                    : <span className="text-neutral-600 text-[13px]">–</span>}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      {adding && renderAddForm()}
    </div>
  );

  // ── Add / edit phase form (rendered inline at the bottom of the table) ──
  const renderAddForm = () => (
    <div className="sticky left-0 z-10 px-4 py-3 bg-neutral-900/95 border-t-2 space-y-2.5"
      style={{ borderTopColor: accent.accent + '66' }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent.accent }}>
        {editingPhase ? 'Phase bearbeiten' : `Neue Phase (Zeile ${phases.length + 1})`}
      </div>

      {/* Phase name */}
      <input ref={addNameRef} type="text" value={phaseNameDraft}
        onChange={e => setPhaseNameDraft(e.target.value)}
        placeholder="Phasenname (z. B. Woche 1)"
        className="w-full bg-neutral-800 rounded-lg px-2.5 py-1.5 text-[13px] outline-none transition-shadow"
        onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${accent.accent}`; }}
        onBlur={e => { e.target.style.boxShadow = ''; }}
        onKeyDown={e => { if (e.key === 'Enter' && pickComboId !== 'new') submitForm(); if (e.key === 'Escape') resetForm(); }}
      />

      {/* Combination picker */}
      <div>
        <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-1.5">Kombination wählen</div>
        <div className="flex flex-wrap gap-1.5">
          {combinations.map(c => {
            const on = pickComboId === c.id;
            const names = groups.filter(g => (c.groupIds || []).includes(g.id)).map(g => g.name || '?').join(' + ');
            return (
              <button key={c.id} onClick={() => setPickComboId(c.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                style={{
                  background: on ? accent.soft : '#1f1f1f',
                  border: `1px solid ${on ? accent.accent : '#333'}`,
                  color: on ? accent.text : '#9ca3af',
                }}>
                {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                <span className="font-medium">{c.name}</span>
                {names && <span className="text-neutral-500 mono text-[9px]">({names})</span>}
                {c.value != null && <span className="text-neutral-500 mono text-[9px]">· {Number(c.value).toFixed(1)}</span>}
              </button>
            );
          })}
          <button onClick={() => setPickComboId('new')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
            style={{
              background: pickComboId === 'new' ? accent.soft : '#1f1f1f',
              border: `1px dashed ${pickComboId === 'new' ? accent.accent : '#444'}`,
              color: pickComboId === 'new' ? accent.text : '#9ca3af',
            }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Neue Kombination
          </button>
        </div>
      </div>

      {/* New combination editor */}
      {pickComboId === 'new' && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-2.5 space-y-2">
          <div className="text-[9px] uppercase tracking-wider text-neutral-600">Gruppen verlinken</div>
          <div className="flex flex-wrap gap-1.5">
            {groups.map(g => {
              const on = newComboGroupIds.includes(g.id);
              const gc = groupColor(g);
              return (
                <button key={g.id} onClick={() => toggleNewGroup(g.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors"
                  style={{
                    background: on ? gc + '22' : '#1f1f1f',
                    border: `1px solid ${on ? gc : '#333'}`,
                    color: on ? gc : '#6b7280',
                  }}>
                  {on && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  {g.name || '?'}
                </button>
              );
            })}
            {groups.length === 0 && <span className="text-[11px] text-neutral-600 italic">Keine Gruppen im Rezept.</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 flex-shrink-0">Kombinationsname</span>
            <input type="text" value={newComboName}
              onChange={e => setNewComboName(e.target.value)} placeholder={lang === 'de' ? 'Kombinationsname' : 'combination name'}
              className="flex-1 bg-neutral-800 rounded px-1.5 py-1 text-[12px] outline-none transition-shadow"
              onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${accent.accent}`; }}
              onBlur={e => { e.target.style.boxShadow = ''; }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Voll-EC (optional)</span>
            <input type="text" inputMode="decimal" value={newComboVollEC}
              onChange={e => setNewComboVollEC(e.target.value)} placeholder="Voll-EC"
              className="mono w-16 bg-neutral-800 rounded px-1.5 py-1 text-[12px] text-center outline-none transition-shadow placeholder:text-[10px]"
              onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${accent.accent}`; }}
              onBlur={e => { e.target.style.boxShadow = ''; }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button onClick={submitForm}
          className="px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold transition-colors"
          style={{ background: accent.accent }}
          onMouseEnter={e => { e.currentTarget.style.background = accent.hover; }}
          onMouseLeave={e => { e.currentTarget.style.background = accent.accent; }}>
          {editingPhase ? 'Speichern' : 'Hinzufügen'}
        </button>
        <button onClick={resetForm} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 text-[12px]">
          Abbrechen
        </button>
      </div>
    </div>
  );

  // Body-Scroll-Lock, damit der Hintergrund nicht durchscrollt.
  // WICHTIG: touchAction NICHT setzen — das würde Pinch-to-Zoom (Mobile)
  // und Maus-Scroll-Zoom (Desktop) blockieren. `overflow: hidden` reicht aus,
  // um Body-Scrolling zu verhindern, ohne Browser-native Zoom-Gesten zu
  // beeinträchtigen.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    // Echtes Vollbild-Overlay: inset-0 deckt den gesamten Viewport ab,
    // z-[100] liegt sicher über der BottomNav (z-[60]). Damit gibt es
    // keinen leeren Streifen mehr, wenn die BottomNav durch Auto-Hide
    // ausgeblendet wird, und das Overlay verhält sich konsistent mit
    // anderen Fullscreen-Ansichten der App.
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col overscroll-contain"
         style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
     <div className="flex-shrink-0 w-full flex justify-center px-2 sm:px-4">
      <div className="w-full flex flex-col" style={{ maxWidth: MAX_W }}>

      {/* ── Header ──
          Auf schmalen Screens (< sm = 640px) wird der Header zweizeilig:
          Zeile 1: Close · Titel · Kebab
          Zeile 2: Menge-Input · A/B · Add · Zoom
          So kollidieren die rechten Buttons nicht mehr mit dem Rezept-Titel.
          Auf sm+ bleibt alles wie zuvor in einer Zeile. */}
      <div className="flex-shrink-0 px-3 py-2.5 bg-neutral-900 border-b border-neutral-800">
        {/* Zeile 1: Close + Title + (Tools auf Desktop) + Kebab */}
        <div className="flex items-center gap-2">
          {/* Close */}
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral-800 text-neutral-400 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 leading-tight">Dosieranleitung</div>
            <div className="text-[16px] font-bold truncate leading-tight" style={{ color: recipeColor }}>
              {recipe.name || 'Rezept'}
            </div>
          </div>

          {/* Tools (nur auf sm+ inline) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Menge / [input] L */}
            <div className="flex items-center gap-1 text-[12px] text-neutral-400 flex-shrink-0">
              <span>Menge /</span>
              <input
                type="text" inputMode="decimal" value={volumeInput}
                onChange={e => setVolumeInput(e.target.value)}
                placeholder="1"
                className="mono w-12 bg-neutral-800 rounded px-1.5 py-1 text-neutral-200 outline-none text-center text-[12px] transition-shadow"
                onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${accent.accent}`; }}
                onBlur={e => { e.target.style.boxShadow = ''; handleVolumeBlur(); }}
              />
              <span>L</span>
            </div>

            {/* Mode A / B toggle */}
            <div className="flex rounded-lg overflow-hidden border border-neutral-700 flex-shrink-0">
              <button onClick={() => setMode('A')}
                className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${mode === 'A' ? 'text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
                style={mode === 'A' ? { background: accent.accent } : {}}>
                A
              </button>
              <button onClick={() => setMode('B')}
                className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${mode === 'B' ? 'text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
                style={mode === 'B' ? { background: WATER_COLOR } : {}}>
                B
              </button>
            </div>

            {/* Add phase */}
            <button onClick={openAdding}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ color: accent.accent }}
              onMouseEnter={e => { e.currentTarget.style.background = accent.soft; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            {/* Zoom-Button: 2 Stufen (Standard 55 % → 40 %) */}
            {(() => {
              const isAtSecond = tableZoom !== ZOOM_DEFAULT;
              return (
                <button onClick={cycleTableZoom} title="Tabelle verkleinern / zurücksetzen"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    color: isAtSecond ? accent.accent : '#6b7280',
                    background: isAtSecond ? accent.soft : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isAtSecond) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isAtSecond) e.currentTarget.style.background = 'transparent'; }}>
                  {isAtSecond ? (
                    <span className="text-[10px] font-bold mono leading-none">{Math.round(tableZoom * 100)}%</span>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
                    </svg>
                  )}
                </button>
              );
            })()}
          </div>

          {/* Kebab — immer in Zeile 1 ganz rechts */}
          <div className="relative flex-shrink-0" ref={kebabRef}>
            <button onClick={() => setShowKebab(v => !v)}
              className="w-8 h-8 rounded-lg hover:bg-neutral-800 text-neutral-400 flex items-center justify-center">
              <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor">
                <circle cx="2" cy="2.5" r="1.8"/><circle cx="2" cy="9" r="1.8"/><circle cx="2" cy="15.5" r="1.8"/>
              </svg>
            </button>
            {showKebab && (
              <div className="absolute top-full right-0 mt-1 z-30 min-w-[220px] bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl py-1">
                <button onClick={() => { handleTranspose(); setShowKebab(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-neutral-800 text-sm">
                  <span className="text-base w-5 text-center">⇄</span>
                  <div>
                    <div className="text-neutral-200">{transposed ? 'Phasen als Spalten' : 'Gruppen als Spalten'}</div>
                    <div className="text-[10px] text-neutral-500">Layout transponieren</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zeile 2: Tools (nur auf Mobile, < sm) */}
        <div className="flex sm:hidden items-center gap-2 mt-2 justify-end flex-wrap">
          {/* Menge / [input] L */}
          <div className="flex items-center gap-1 text-[12px] text-neutral-400 flex-shrink-0">
            <span>Menge /</span>
            <input
              type="text" inputMode="decimal" value={volumeInput}
              onChange={e => setVolumeInput(e.target.value)}
              placeholder="1"
              className="mono w-12 bg-neutral-800 rounded px-1.5 py-1 text-neutral-200 outline-none text-center text-[12px] transition-shadow"
              onFocus={e => { e.target.style.boxShadow = `0 0 0 2px ${accent.accent}`; }}
              onBlur={e => { e.target.style.boxShadow = ''; handleVolumeBlur(); }}
            />
            <span>L</span>
          </div>

          {/* Mode A / B toggle */}
          <div className="flex rounded-lg overflow-hidden border border-neutral-700 flex-shrink-0">
            <button onClick={() => setMode('A')}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${mode === 'A' ? 'text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
              style={mode === 'A' ? { background: accent.accent } : {}}>
              A
            </button>
            <button onClick={() => setMode('B')}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${mode === 'B' ? 'text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
              style={mode === 'B' ? { background: WATER_COLOR } : {}}>
              B
            </button>
          </div>

          {/* Add phase */}
          <button onClick={openAdding}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: accent.accent }}
            onMouseEnter={e => { e.currentTarget.style.background = accent.soft; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          {/* Zoom-Button */}
          {(() => {
            const isAtSecond = tableZoom !== ZOOM_DEFAULT;
            return (
              <button onClick={cycleTableZoom} title="Tabelle verkleinern / zurücksetzen"
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  color: isAtSecond ? accent.accent : '#6b7280',
                  background: isAtSecond ? accent.soft : 'transparent',
                }}>
                {isAtSecond ? (
                  <span className="text-[10px] font-bold mono leading-none">{Math.round(tableZoom * 100)}%</span>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                    <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
                  </svg>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Mode B info bar */}
      {mode === 'B' && !bInfoHidden && (
        <div className="flex-shrink-0 px-4 py-1.5 border-b flex items-start gap-2"
          style={{ background: WATER_COLOR + '14', borderBottomColor: WATER_COLOR + '40' }}>
          <svg className="mt-0.5 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={WATER_COLOR} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-[11px] leading-snug flex-1" style={{ color: WATER_COLOR + 'cc' }}>
            <b>Mischmodus B</b> – einfacher abmessen bei niedrigerem Ziel-EC: die volle, gut messbare Dosis mischen und mit einer einmaligen Wassergabe auf den Ziel-EC verdünnen.
            {' '}<span style={{ color: WATER_COLOR }}>Beispiel: Volldosis für 10&nbsp;L bei EC&nbsp;2,0 → 10&nbsp;L Wasser zugeben ergibt 20&nbsp;L mit EC&nbsp;1,0.</span>
          </span>
          <button onClick={dismissBInfo} title="Hinweis ausblenden"
            className="flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors"
            style={{ color: WATER_COLOR }}
            onMouseEnter={e => { e.currentTarget.style.background = WATER_COLOR + '22'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      </div>
     </div>

      {/* Table content — füllt jetzt den verbleibenden Vollbild-Bereich ohne
          Karten-Optik. Kein border, kein border-radius, kein extra background —
          die Tabelle nutzt direkt den dunklen Overlay-Hintergrund.
          Damit wirkt das Overlay als echtes Fullscreen, nicht als Popover.
          tableZoom skaliert für In-App-Zoomstufen; Pinch-/Mausrad-Zoom
          (Browser-nativ) funktioniert zusätzlich. */}
      {/* Tabellen-Container:
          - overflow-auto auf dem äußeren Wrapper für horizontal/vertikal Scroll
          - mx-auto + w-fit auf dem inneren Block:
              * w-fit = Breite folgt dem Tabelleninhalt (nicht 100%)
              * mx-auto zentriert horizontal, wenn der Inhalt schmaler ist als
                der Container → Tabelle expandiert symmetrisch nach beiden Seiten
              * Wenn die Tabelle breiter als der Container ist (z. B. Desktop
                bei 100 % Zoom auf engerem Fenster), greift overflow-auto und
                der Nutzer kann horizontal scrollen */}
      <div className="flex-1 min-h-0 overflow-auto recipe-scroll">
        <div className="mx-auto w-fit flex flex-col min-h-0"
          style={{ zoom: tableZoom }}>
          {transposed ? renderTransposed() : renderNonTransposed()}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PDF PRINT CONTENT (returns HTML string for print window)
// ============================================================
export function buildDosingGuidePrint({ recipe, mode, orientation, lang }) {
  const combinations = recipe.measured?.ecValues || [];
  const groupsRaw = recipe.groups || [];
  const guide    = recipe.dosingGuide || {};
  const phases   = guide.phases || combinations.map(c => ({ id: c.id, name: c.name, ecId: c.id, zielEC: c.zielEC ?? null }));

  // Gruppen in Mischreihenfolge sortieren (inkl. Phasen-Ausnahmeregel).
  // dosingItemsInOrder gibt Items pro Salz für Solo/Topdress zurück — wir
  // reduzieren das auf einzigartige Gruppen, behalten aber die berechnete
  // Reihenfolge (= visuelle Spaltenreihenfolge der DosingGuide).
  const orderedItems = dosingItemsInOrder(groupsRaw, { phases, combinations });
  const seenIds = new Set();
  const groups = [];
  orderedItems.forEach(it => {
    if (!seenIds.has(it.group.id)) {
      seenIds.add(it.group.id);
      groups.push(it.group);
    }
  });
  const gesamtmenge = guide.volume || 1;
  const isAbs    = gesamtmenge > 1;
  const recipeName = recipe.name || 'Rezept';
  const recipeColor = recipe.themeColor || '#10b981';
  const combById = Object.fromEntries(combinations.map(c => [c.id, c]));
  const groupColor = (g) => g.themeColor || recipe.themeColor || '#374151';

  const CELL_W = orientation === 'landscape' ? 90 : 75;
  const LABEL_W = 120;
  const EC_W = 58;
  const ROW_H = 40;
  const showWater = mode === 'B';

  const cellStyle = (bg, bold, color) =>
    `border:1px solid #e5e7eb;padding:5px 8px;text-align:center;vertical-align:middle;` +
    `font-size:12px;${bold ? 'font-weight:700;' : ''}${color ? `color:${color};` : ''}${bg ? `background:${bg};` : ''}`;

  const thStyle = (w, bg) =>
    `width:${w}px;${bg ? `background:${bg};` : ''}border:1px solid #e5e7eb;padding:6px 4px;text-align:center;vertical-align:bottom;font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;`;

  if (phases.length === 0) {
    return `<div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;padding:20px;">
      <h2 style="font-size:18px;font-weight:700;color:${recipeColor};margin:0 0 8px">Dosieranleitung – ${recipeName}</h2>
      <p style="font-size:12px;color:#9ca3af;font-style:italic;">
        Noch keine Phasen definiert.
      </p>
    </div>`;
  }

  const phaseInfo = (phase) => {
    const comb = combById[phase.ecId] || null;
    return { comb, groupIds: comb?.groupIds || [], vollEC: comb?.value ?? null, zielEC: phase.zielEC ?? null, combName: comb?.name || '—' };
  };

  // Anzahl Gruppen-Spalten (für colspan des Mischreihenfolge-Pfeils)
  const groupColCount = groups.length;

  let html = `<div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
    <div style="margin-bottom:12px;">
      <h2 style="font-size:16px;font-weight:700;color:${recipeColor};margin:0 0 2px">
        Dosieranleitung – ${recipeName}
        ${mode === 'B' ? ' (Modus B: Verdünnung)' : ' (Modus A: Dosiermengen)'}
      </h2>
      ${isAbs ? `<div style="font-size:10px;color:#6b7280;">Gesamtmenge: ${gesamtmenge} L</div>` : ''}
    </div>
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <!-- Mischreihenfolge-Pfeil über den Gruppen-Spalten -->
        <tr>
          <th style="border:none;padding:0;"></th>
          <th colspan="${groupColCount}" style="border:none;padding:4px 8px 2px;text-align:left;font-size:9px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              Mischreihenfolge
              <span style="display:inline-block;flex:1;min-width:120px;height:1px;background:#9ca3af;position:relative;vertical-align:middle;"></span>
              <span style="font-size:11px;line-height:1;">▶</span>
            </span>
          </th>
          ${showWater ? '<th style="border:none;"></th>' : ''}
          <th style="border:none;" colspan="2"></th>
        </tr>
        <tr>
          <th style="${thStyle(LABEL_W, '#f9fafb')}text-align:left;">Phase</th>
          ${groups.map(g => `<th style="${thStyle(CELL_W, '#f9fafb')}"><span style="color:${groupColor(g)};font-weight:700;">${g.name||'?'}</span><br/><span style="color:#9ca3af;font-size:9px;">${g.kind==='stock'?`${g.mlPerL||0} ml/L × ${Math.round(g.factor||1)}`:''}</span></th>`).join('')}
          ${showWater ? `<th style="${thStyle(CELL_W, '#eff6ff')}"><span style="color:#0284c7;font-weight:700;">RO-Wasser</span></th>` : ''}
          <th style="${thStyle(EC_W, '#eff6ff')}">Ziel-EC</th>
          <th style="${thStyle(EC_W, '#f0fdf4')}">Voll-EC</th>
        </tr>
      </thead>
      <tbody>`;

  phases.forEach((phase, i) => {
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    const { comb, groupIds, vollEC, zielEC } = phaseInfo(phase);

    html += `<tr style="height:${ROW_H}px;">
      <td style="${cellStyle(rowBg, true)}text-align:left;">${phase.name}</td>`;

    groups.forEach(g => {
      if (!groupIds.includes(g.id)) { html += `<td style="${cellStyle(rowBg)}color:#d1d5db;">–</td>`; return; }
      const cell = calcDose(vollEC, zielEC, g, gesamtmenge, mode);
      html += `<td style="${cellStyle(rowBg, true, groupColor(g))}">${fmtVal(cell.val)}<br/><span style="font-size:9px;font-weight:400;color:#9ca3af;">${cell.unit}</span></td>`;
    });

    if (showWater) {
      const w = calcWater(vollEC, zielEC, gesamtmenge);
      if (!w || !w.applicable) html += `<td style="${cellStyle(rowBg)}color:#d1d5db;">–</td>`;
      else html += `<td style="${cellStyle(rowBg, true, '#0284c7')}">+${fmtVal(w.pct,1)}%<br/><span style="font-size:9px;font-weight:400;">+${fmtVal(w.liters,2)} L</span></td>`;
    }

    html += `<td style="${cellStyle(rowBg, true, '#2563eb')}">${zielEC!=null?Number(zielEC).toFixed(1):'–'}</td>`;
    html += `<td style="${cellStyle(rowBg, true, '#059669')}">${vollEC!=null?Number(vollEC).toFixed(1):'–'}</td>`;
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
}
