// ============================================================
// RECIPE POPOVERS — Element-Detail + Salzauswahl + Kebab-Menü
// ============================================================

import React, { useState, useEffect } from 'react';
import { ELEMENT_DEFS, ELEMENT_BY_SYM, getElColor, getNH4Color, getSaltDisplay, colorizeSaltDisplay } from './data.js';

// Inline SVG icons für Gruppen-Aktionen
function IconWateringCan() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Körper */}
      <path d="M3 11 L4.5 8 H14 L15.5 20 Q15.5 22 13.5 22 H6 Q4 22 3.5 20 Z"/>
      {/* Henkel oben */}
      <path d="M7 8 Q7 5 10 5 Q13 5 13 8"/>
      {/* Ausgusstülle */}
      <path d="M14.5 13 L21 10"/>
      {/* Brausekopf-Punkte */}
      <circle cx="21.5" cy="9.5" r="0.7" fill="currentColor"/>
      <circle cx="21.5" cy="12" r="0.7" fill="currentColor"/>
      <circle cx="23" cy="10.8" r="0.7" fill="currentColor"/>
    </svg>
  );
}

function IconKanister() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Körper */}
      <rect x="4" y="7" width="16" height="15" rx="2"/>
      {/* Henkel oben */}
      <path d="M9 7 V4.5 Q9 3 12 3 Q15 3 15 4.5 V7"/>
      {/* Ausguss / Verschluss */}
      <rect x="14" y="2.5" width="3.5" height="2.5" rx="0.5"/>
      {/* Rippe / Riffelung */}
      <line x1="4" y1="14.5" x2="20" y2="14.5"/>
    </svg>
  );
}

// ============================================================
// SALT PICKER — Sort helpers
// ============================================================
const PICKER_ANION_ORDER = ['borate', 'carbonate', 'chelate', 'chloride', 'hydroxide', 'molybdate', 'nitrate', 'phosphate', 'silicate', 'sulfate', 'other'];
const PICKER_ANION_LABELS = {
  borate: 'Borat', carbonate: 'Carbonat', chelate: 'Chelat', chloride: 'Chlorid',
  hydroxide: 'Hydroxid', molybdate: 'Molybdat', nitrate: 'Nitrat',
  phosphate: 'Phosphat', silicate: 'Silikat', sulfate: 'Sulfat', other: 'Sonstige',
};

const CATION_NAMES_DE = {
  Ammonium: 'Ammonium', Ca: 'Kalzium', K: 'Kalium', Mg: 'Magnesium',
  Fe: 'Eisen', Mn: 'Mangan', Zn: 'Zink', Cu: 'Kupfer',
  Ni: 'Nickel', Co: 'Kobalt', Na: 'Natrium', Other: 'Sonstige',
};
const CATION_NAMES_EN = {
  Ammonium: 'Ammonium', Ca: 'Calcium', K: 'Potassium', Mg: 'Magnesium',
  Fe: 'Iron', Mn: 'Manganese', Zn: 'Zinc', Cu: 'Copper',
  Ni: 'Nickel', Co: 'Cobalt', Na: 'Sodium', Other: 'Other',
};

function getCationLabel(cation, lang) {
  const map = lang === 'de' ? CATION_NAMES_DE : CATION_NAMES_EN;
  return map[cation] || cation;
}

// Micro elements — these take priority over macro classification
const MICRO_SET = new Set(['Mn', 'Fe', 'Zn', 'Cu', 'Co', 'Ni', 'B', 'Mo']);
const MACRO_SALT_SET = new Set(['N', 'P', 'K', 'Ca', 'Mg', 'S', 'Si', 'Cl']);

function pickerDominantAnion(salt) {
  const f = (salt.formula || '').replace(/·.*$/, '');
  if (/EDTA|DTPA|EDDHA/i.test(f) || /chelat/i.test(salt.name || '')) return 'chelate';
  if (/MoO4/i.test(f) || (salt.contributions?.Mo || 0) > 5) return 'molybdate';
  if (/PO4|HPO|H2PO/i.test(f)) return 'phosphate';
  if (/SiO/i.test(f)) return 'silicate';
  if (/SO4/i.test(f)) return 'sulfate';
  if (/NO3/i.test(f)) return 'nitrate';
  if (/CO3/i.test(f)) return 'carbonate';
  if (/BO3|B\(OH\)|H3BO3/i.test(f)) return 'borate';
  if (/OH/i.test(f)) return 'hydroxide';
  if (/Cl/.test(f) && !/Cl[a-z]/.test(f)) return 'chloride';
  return 'other';
}

function pickerDominantCation(salt) {
  if ((salt.nh4Fraction || 0) >= 0.4 && (salt.contributions?.N || 0) > 3) return 'Ammonium';
  const CATIONS = ['Ca', 'K', 'Mg', 'Fe', 'Mn', 'Zn', 'Cu', 'Ni', 'Co'];
  let best = 'Other', bestVal = 0;
  for (const c of CATIONS) {
    const v = salt.contributions?.[c] || 0;
    if (v > bestVal) { bestVal = v; best = c; }
  }
  return best;
}

// ============================================================
// Internal helpers
// ============================================================

function NSplitRow({ label, value, total, color, highlight }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 text-xs" style={{ color: highlight ? color : '#fafafa' }}>{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#000' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mono text-xs font-semibold w-14 text-right" style={{ color }}>{value.toFixed(1)}</div>
      <div className="mono text-[10px] text-neutral-500 w-12 text-right">{pct.toFixed(1)}%</div>
    </div>
  );
}

function ContributionBar({ c, maxVal, color, totalActual }) {
  const sharePct = totalActual > 0 ? (c.value / totalActual) * 100 : 0;
  const displayName = c.salt.shortName || c.salt.formula;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-mono font-medium truncate">{displayName}</span>
        {c.groupName && (
          <span className="text-[9px] px-1 py-px rounded bg-neutral-800 text-neutral-400 uppercase tracking-wider flex-shrink-0">
            {c.groupName}
          </span>
        )}
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#000' }}>
        <div className="h-full rounded-full" style={{ width: `${sharePct}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
      </div>
      <div className="mono text-xs font-semibold w-14 text-right" style={{ color }}>{c.value.toFixed(1)}</div>
      <div className="mono text-[10px] text-neutral-500 w-10 text-right">{sharePct.toFixed(0)}%</div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div className="rounded-lg bg-neutral-800/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</div>
      <div className="mono text-lg font-semibold" style={{ color: accent || '#fafafa' }}>
        {value}{unit && <span className="text-xs font-normal text-neutral-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function ElementDonut({ data, label, size = 110 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  let cumulative = 0;

  return (
    <div className="rounded-lg bg-neutral-800/40 border border-neutral-800 p-3 flex items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0a0a0a" strokeWidth="4" />
          {sorted.map((d) => {
            const pct = (d.value / total) * 100;
            const offset = -cumulative;
            const seg = (
              <circle key={d.sym} cx="18" cy="18" r="15.9155" fill="none"
                stroke={d.color} strokeWidth="4"
                strokeDasharray={`${pct.toFixed(3)} 100`}
                strokeDashoffset={offset.toFixed(3)} strokeLinecap="butt"
              />
            );
            cumulative += pct;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</div>
          <div className="mono text-base font-bold leading-none">{total.toFixed(0)}</div>
          <div className="text-[8px] text-neutral-500 mt-0.5">ppm</div>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        {sorted.map(d => {
          const pct = (d.value / total) * 100;
          return (
            <div key={d.sym} className="flex items-center gap-2 text-[11px]">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
              <div className="mono font-semibold w-7 flex-shrink-0" style={{ color: d.color }}>{d.sym}</div>
              <div className="flex-1 mono text-neutral-300 truncate">{d.value.toFixed(d.value < 1 ? 2 : 1)}</div>
              <div className="mono text-neutral-500 w-9 text-right">{pct.toFixed(pct < 1 ? 1 : 0)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-neutral-800 ${danger ? 'text-rose-400' : ''}`}
    >
      <span className="w-4 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div>{label}</div>
        {sub && <div className="text-[10px] text-neutral-500">{sub}</div>}
      </div>
    </button>
  );
}

// ============================================================
// EDITABLE TARGET CARD (used in ElementDetailPopover)
// ============================================================
function EditableTargetCard({ target, onTargetChange }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft.replace(',', '.'));
    if (!isNaN(num) && num >= 0 && onTargetChange) onTargetChange(num);
    setEditing(false);
  };

  return (
    <div
      className={`rounded-lg bg-neutral-800/60 p-3 ${onTargetChange ? 'cursor-pointer hover:bg-neutral-700/60 transition-colors' : ''}`}
      onClick={() => { if (!editing && onTargetChange) { setDraft(target > 0 ? String(target) : ''); setEditing(true); } }}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Ziel</div>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          onClick={e => e.stopPropagation()}
          className="mono text-lg font-semibold bg-neutral-700 rounded px-1 w-full outline-none ring-2 ring-emerald-500"
          style={{ color: '#fafafa' }}
        />
      ) : (
        <div className="mono text-lg font-semibold">{target > 0 ? target.toFixed(target < 1 ? 2 : 1) : <span className="text-neutral-600 text-sm">–</span>}</div>
      )}
      <div className="text-[10px] text-neutral-500">ppm{onTargetChange && !editing && ' · tap'}</div>
    </div>
  );
}

// ============================================================
// ELEMENT DETAIL POPOVER
// ============================================================
export function ElementDetailPopover({ element, recipe, useColor, elementColors, onClose, onTargetChange }) {
  if (!element) return null;
  const def = ELEMENT_BY_SYM[element];
  if (!def) return null;
  const target = recipe.targets?.[element] || 0;
  const elColor = useColor ? getElColor(element, elementColors) : '#fafafa';

  const contributions = [];
  let actual = 0;
  let nh4Sum = 0;

  recipe.groups.forEach(g => {
    g.salts.forEach(s => {
      const val = s.contributions?.[element] || 0;
      if (val > 0) {
        contributions.push({
          salt: s,
          groupName: g.name || (g.kind === 'topdress' ? 'Topdress' : 'Endlösung'),
          groupId: g.id,
          value: val,
        });
        actual += val;
        if (element === 'N') nh4Sum += val * (s.nh4Fraction || 0);
      }
    });
  });

  contributions.sort((a, b) => b.value - a.value);
  const maxVal = contributions.length > 0 ? contributions[0].value : 1;
  const pct = target > 0 ? (actual / target) * 100 : 0;
  const pctColor = pct >= 95 && pct <= 105 ? '#10b981'
    : pct >= 90 && pct <= 110 ? '#facc15'
    : pct >= 85 && pct <= 115 ? '#fb923c' : '#ef4444';

  const nh4Color = useColor ? getNH4Color(elementColors) : '#9CCC65';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] overflow-y-auto recipe-scroll">

        <div className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl"
            style={{ background: `${elColor}22`, color: elColor, boxShadow: `inset 0 0 0 1px ${elColor}55` }}>
            {def.sym}
          </div>
          <div className="flex-1">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Element-Detail</div>
            <div className="text-lg font-semibold">{def.name}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <EditableTargetCard target={target} onTargetChange={onTargetChange ? (v) => onTargetChange(element, v) : null} />
            <div className="rounded-lg bg-neutral-800/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Erreicht</div>
              <div className="mono text-lg font-semibold" style={{ color: elColor }}>{actual.toFixed(actual < 1 ? 2 : 1)}</div>
              <div className="text-[10px] text-neutral-500">ppm</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: `${pctColor}22`, boxShadow: `inset 0 0 0 1px ${pctColor}55` }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `${pctColor}cc` }}>Zielerreichung</div>
              <div className="mono text-lg font-semibold" style={{ color: pctColor }}>{pct.toFixed(0)}%</div>
              <div className="text-[10px]" style={{ color: `${pctColor}99` }}>
                {actual > target ? `+${(actual - target).toFixed(1)}` : actual < target ? `${(actual - target).toFixed(1)}` : '±0'} ppm
              </div>
            </div>
          </div>

          {element === 'N' && actual > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={actual - nh4Sum} total={actual} color={elColor} />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4Sum} total={actual} color={nh4Color} highlight />
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
                NH₄-Anteil am Gesamtstickstoff:{' '}
                <span className="font-semibold mono" style={{ color: nh4Color }}>
                  {actual > 0 ? ((nh4Sum / actual) * 100).toFixed(2) : '0'}%
                </span>
              </div>
            </div>
          )}

          {contributions.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 flex justify-between">
                <span>Verteilung pro Salz</span>
                <span>{contributions.length} Quelle{contributions.length === 1 ? '' : 'n'}</span>
              </div>
              <div className="space-y-2">
                {contributions.map((c, i) => (
                  <ContributionBar key={i} c={c} maxVal={maxVal} color={elColor} totalActual={actual} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500 italic py-4 text-center">
              Noch kein Salz trägt {def.name} zur Mischung bei.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SALT PICKER POPOVER — accepts availableSalts as prop
// ============================================================
export function SaltPickerPopover({ open, onClose, onPick, replaceMode, availableSalts, useElementColors, elementColors, lang }) {
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [sortMode, setSortMode] = useState('name'); // 'name' | 'cation' | 'anion'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  // Produkte/Salze-Toggle — persistiert in localStorage
  const [showProducts, setShowProducts] = useState(() => {
    try { return localStorage.getItem('hydro:saltPickerShowProducts') === '1'; } catch { return false; }
  });

  const toggleShowProducts = (val) => {
    setShowProducts(val);
    try { localStorage.setItem('hydro:saltPickerShowProducts', val ? '1' : '0'); } catch {}
  };

  useEffect(() => {
    if (open) { setSelectedKeys(new Set()); setSearch(''); setSortMenuOpen(false); }
  }, [open]);

  if (!open) return null;

  // Trenne Produkte von Salzen
  const allEntries = availableSalts || [];
  const salts = allEntries.filter(s => showProducts ? s.type === 'product' : s.type !== 'product');

  // Filter
  const filtered_base = salts.filter(s =>
    ((s.name || '') + ' ' + (s.formula || '') + ' ' + (s.shortName || '')).toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const filtered = [...filtered_base].sort((a, b) => {
    if (sortMode === 'anion') {
      const aa = PICKER_ANION_ORDER.indexOf(pickerDominantAnion(a));
      const ab = PICKER_ANION_ORDER.indexOf(pickerDominantAnion(b));
      if (aa !== ab) return aa - ab;
    }
    if (sortMode === 'cation') {
      const ca = pickerDominantCation(a), cb = pickerDominantCation(b);
      if (ca !== cb) return ca.localeCompare(cb);
    }
    return a.name.localeCompare(b.name);
  });

  // Macro/micro classification: micro elements have priority
  const isMicroSalt = (s) => Object.keys(s.contributions || {}).some(k => MICRO_SET.has(k));
  const isMacroSalt = (s) => !isMicroSalt(s) && Object.keys(s.contributions || {}).some(k => MACRO_SALT_SET.has(k));

  const macroSalts = filtered.filter(isMacroSalt);
  const microSalts = filtered.filter(s => isMicroSalt(s) || !isMacroSalt(s));

  // Group section headers for cation/anion sort within a section
  const getSectionHeader = (s, i, list) => {
    if (sortMode === 'name') return null;
    const curr = sortMode === 'anion'
      ? PICKER_ANION_LABELS[pickerDominantAnion(s)]
      : getCationLabel(pickerDominantCation(s), lang);
    if (i === 0) return curr;
    const prev = sortMode === 'anion'
      ? PICKER_ANION_LABELS[pickerDominantAnion(list[i - 1])]
      : getCationLabel(pickerDominantCation(list[i - 1]), lang);
    return curr !== prev ? curr : null;
  };

  const toggle = (id) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pickSingle = (s) => onPick([s]);
  const confirmMulti = () => {
    const list = salts.filter(s => selectedKeys.has(s.id));
    if (list.length > 0) onPick(list);
  };
  const selectAll = () => setSelectedKeys(new Set(filtered.map(s => s.id)));
  const allSelected = filtered.length > 0 && filtered.every(s => selectedKeys.has(s.id));

  const count = selectedKeys.size;
  const title = replaceMode ? 'Salz ersetzen' : 'Salze auswählen';
  const subtitle = replaceMode
    ? 'Eines wählen zum Ersetzen'
    : count > 0 ? `${count} ausgewählt` : 'Eines oder mehrere antippen';

  // Render colorized token array
  const renderTokens = (tokens) => tokens.map((tk, i) => (
    <span key={i} style={tk.color ? { color: tk.color } : undefined}>
      {tk.subscript ? <sub style={{ fontSize: '0.75em' }}>{tk.text}</sub> : tk.text}
    </span>
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{title}</div>
              <div className="text-[10px] text-neutral-500 truncate">{subtitle}</div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Sort button — nur für Salze, nicht für Produkte */}
              {!showProducts && <div className="relative">
                <button
                  onClick={() => setSortMenuOpen(o => !o)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                    sortMode !== 'name'
                      ? 'border-emerald-700/50 text-emerald-400 bg-emerald-950/30'
                      : 'border-neutral-700 hover:bg-neutral-700/50 text-neutral-400'
                  }`}
                  title="Sortierung"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l4-4 4 4M7 5v14M21 15l-4 4-4-4m4 4V5"/>
                  </svg>
                </button>
                {sortMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-lg border border-neutral-700 bg-neutral-800 shadow-lg overflow-hidden">
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-700">
                        Sortieren nach
                      </div>
                      {[{ k: 'name', l: 'Name' }, { k: 'cation', l: 'Kation' }, { k: 'anion', l: 'Anion' }].map(opt => (
                        <button
                          key={opt.k}
                          onClick={() => { setSortMode(opt.k); setSortMenuOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-neutral-700/50"
                        >
                          <span>{opt.l}</span>
                          {sortMode === opt.k && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>}
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {/* Salze / Produkte Toggle */}
          <div className="flex mt-2 rounded-lg overflow-hidden border border-neutral-700 text-[11px] font-semibold">
            <button
              onClick={() => toggleShowProducts(false)}
              className="flex-1 py-1.5 transition-colors"
              style={!showProducts ? { background: '#10b981', color: '#fff' } : { color: '#9ca3af' }}
            >
              Salze
            </button>
            <button
              onClick={() => toggleShowProducts(true)}
              className="flex-1 py-1.5 transition-colors"
              style={showProducts ? { background: '#10b981', color: '#fff' } : { color: '#9ca3af' }}
            >
              Produkte
            </button>
          </div>
        </div>

        {/* Salt list */}
        <div className="flex-1 overflow-y-auto recipe-scroll p-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-neutral-500 italic text-center py-8">
              {showProducts ? 'Keine Produkte gefunden.' : 'Keine Salze gefunden.'}
            </div>
          ) : showProducts ? (
            /* ── Produkte: flache Liste, nur Name-Sortierung ── */
            <>
              <div className="px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 border-b border-neutral-800/50 mb-1">
                Produkte
              </div>
              {filtered.map(s => {
                const isSelected = selectedKeys.has(s.id);
                const nameTokens = colorizeSaltDisplay(getSaltDisplay(s, 'name', lang || 'en'), useElementColors, elementColors);
                return (
                  <button key={s.id}
                    onClick={() => replaceMode ? pickSingle(s) : toggle(s.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-emerald-950/40 ring-1 ring-inset ring-emerald-700/50' : 'hover:bg-neutral-800'}`}
                  >
                    {!replaceMode && (
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-sm truncate">{renderTokens(nameTokens)}</div>
                    {s.dosePerL != null && (
                      <div className="text-[11px] mono flex-shrink-0 opacity-60 text-right">
                        {s.dosePerL} {s.doseUnit || 'ml/L'}
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            /* ── Salze: Makro/Mikro-Sektionen ── */
            [
              { key: 'macro', label: 'Makronährstoffe', salts: macroSalts },
              { key: 'micro', label: 'Mikronährstoffe', salts: microSalts },
            ]
              .filter(section => section.salts.length > 0)
              .map(section => (
                <React.Fragment key={section.key}>
                  <div className="px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-neutral-400 border-b border-neutral-800/50 mb-1">
                    {section.label}
                  </div>
                  {section.salts.map((s, i) => {
                    const isSelected = selectedKeys.has(s.id);
                    const subHeader = getSectionHeader(s, i, section.salts);

                    const kuerzelTokens = colorizeSaltDisplay(getSaltDisplay(s, 'kuerzel'), useElementColors, elementColors);
                    const nameTokens = colorizeSaltDisplay(getSaltDisplay(s, 'name', lang || 'en'), useElementColors, elementColors);
                    const formulaTokens = colorizeSaltDisplay(getSaltDisplay(s, 'formula'), useElementColors, elementColors);

                    return (
                      <React.Fragment key={s.id}>
                        {subHeader && (
                          <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                            {subHeader}
                          </div>
                        )}
                        <button
                          onClick={() => replaceMode ? pickSingle(s) : toggle(s.id)}
                          className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-emerald-950/40 ring-1 ring-inset ring-emerald-700/50' : 'hover:bg-neutral-800'}`}
                        >
                          {!replaceMode && (
                            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                          )}
                          {/* Kürzel — colorized */}
                          <div className="font-mono font-semibold text-sm w-12 flex-shrink-0">
                            {renderTokens(kuerzelTokens)}
                          </div>
                          {/* Full name left, formula right-aligned */}
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="text-sm truncate">{renderTokens(nameTokens)}</div>
                            <div className="text-[11px] mono flex-shrink-0 opacity-60 text-right">
                              {renderTokens(formulaTokens)}
                            </div>
                          </div>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))
          )}
        </div>

        {/* Footer */}
        {!replaceMode && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-3 flex gap-2">
            <button
              onClick={() => setSelectedKeys(new Set())}
              disabled={count === 0}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${count === 0 ? 'bg-neutral-800/40 text-neutral-700 cursor-not-allowed' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
            >
              Leeren
            </button>
            <button
              onClick={allSelected ? () => setSelectedKeys(new Set()) : selectAll}
              className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              {allSelected ? 'Keine' : 'Alle'}
            </button>
            <button
              onClick={confirmMulti}
              disabled={count === 0}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${count === 0 ? 'bg-neutral-800/40 text-neutral-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {count === 0 ? 'Salze antippen…' : count === 1 ? '1 Salz hinzufügen' : `${count} Salze hinzufügen`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GROUP DETAIL POPOVER
// ============================================================
export function GroupDetailPopover({ groupId, recipe, useColor, elementColors, onClose, onOpenElement }) {
  if (!groupId) return null;
  const group = recipe.groups.find(g => g.id === groupId);
  if (!group) return null;

  const themeColor = recipe.themeColor || '#10b981';
  const isStock = group.kind === 'stock';
  const isSolo = group.kind === 'solo';
  const isTopdress = group.kind === 'topdress';
  const kindLabel = isTopdress ? 'Topdress' : isSolo ? 'Endlösung' : 'Konzentrat';

  let totalG = 0, totalMl = 0, totalPrice = 0;
  let anyPrice = false, allPriced = true;
  let nh4 = 0, nTotal = 0;
  const groupContrib = {};

  group.salts.forEach(s => {
    Object.entries(s.contributions || {}).forEach(([sym, v]) => {
      groupContrib[sym] = (groupContrib[sym] || 0) + (v || 0);
    });
    const m = s.mass || 0;
    if (s.massUnit === 'ml') totalMl += m; else totalG += m;
    if (s.pricePerKg && m > 0) {
      anyPrice = true;
      totalPrice += (s.pricePerKg * m) / 1000;
    } else if (m > 0) {
      allPriced = false;
    }
    const n = s.contributions?.N || 0;
    nTotal += n;
    nh4 += n * (s.nh4Fraction || 0);
  });

  const elementsHere = ELEMENT_DEFS.filter(e => (groupContrib[e.sym] || 0) > 0);

  const RATIOS = [['N', 'K'], ['P', 'K'], ['Ca', 'Mg'], ['N', 'Ca'], ['K', 'Ca'], ['Fe', 'Mn']];
  const ratios = RATIOS
    .map(([a, b]) => ({ a, b, va: groupContrib[a] || 0, vb: groupContrib[b] || 0 }))
    .filter(r => r.va > 0 && r.vb > 0)
    .map(r => {
      const min = Math.min(r.va, r.vb);
      return { ...r, ratioA: (r.va / min).toFixed(2), ratioB: (r.vb / min).toFixed(2) };
    });

  const nColor = useColor ? getElColor('N', elementColors) : '#fafafa';
  const nh4Color = useColor ? getNH4Color(elementColors) : '#9CCC65';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[88vh] overflow-y-auto recipe-scroll">
        <div className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 p-5 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Gruppe · {kindLabel}</div>
            <div className="mono font-bold truncate" style={{ color: themeColor, fontSize: 24 }}>
              {group.name || <span className="italic font-normal text-neutral-500">ohne Namen</span>}
            </div>
            {isStock && (
              <div className="mt-1 mono text-[11px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
                <span>×{group.factor}</span><span className="text-neutral-700">·</span>
                <span>{group.mlPerL} ml/L</span><span className="text-neutral-700">·</span>
                <span>{group.volume} L Stock</span>
              </div>
            )}
            {isSolo && (
              <div className="mt-1 mono text-[11px] text-neutral-400">Endlösung · {group.volume} L</div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Salze" value={group.salts.length} unit="" />
            {totalG > 0 && <StatCard label="Trocken" value={totalG.toFixed(0)} unit="g" />}
            {totalMl > 0 && <StatCard label="Flüssig" value={totalMl.toFixed(0)} unit="ml" />}
            {anyPrice && (
              <StatCard label={allPriced ? 'Preis' : 'Preis (teilw.)'} value={totalPrice.toFixed(2)} unit="€" accent="#a3e635" />
            )}
          </div>

          {elementsHere.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 flex justify-between">
                <span>Element-Beiträge dieser Gruppe</span>
                <span>vs. Rezept-Ziel</span>
              </div>
              <div className="space-y-1.5">
                {(() => {
                  const maxUntargeted = elementsHere.reduce((mx, e) => {
                    const t = recipe.targets?.[e.sym] || 0;
                    if (t > 0) return mx;
                    return Math.max(mx, groupContrib[e.sym] || 0);
                  }, 0);
                  return elementsHere.map(e => {
                    const v = groupContrib[e.sym] || 0;
                    const target = recipe.targets?.[e.sym] || 0;
                    const hasTarget = target > 0;
                    const pctOfTarget = hasTarget ? (v / target) * 100 : null;
                    const color = useColor ? getElColor(e.sym, elementColors) : '#fafafa';
                    let barWidth, barColor, barOpacity;
                    if (hasTarget) {
                      barWidth = Math.min(100, pctOfTarget);
                      barColor = pctOfTarget > 100 ? '#ef4444' : color;
                      barOpacity = 1;
                    } else {
                      barWidth = maxUntargeted > 0 ? (v / maxUntargeted) * 100 : 0;
                      barColor = color;
                      barOpacity = 0.45;
                    }
                    return (
                      <div key={e.sym} className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenElement && onOpenElement(e.sym)}
                          className="w-9 h-7 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                          style={{
                            background: useColor ? `${color}22` : 'transparent',
                            boxShadow: useColor ? `inset 0 0 0 1px ${color}55` : 'inset 0 0 0 1px #404040',
                            color: useColor ? color : '#fafafa',
                          }}
                        >
                          {e.sym}
                        </button>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#000' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${barWidth}%`, background: barColor, opacity: barOpacity,
                            boxShadow: useColor && hasTarget ? `0 0 6px ${color}66` : 'none',
                          }} />
                        </div>
                        <div className="mono text-xs font-semibold w-16 text-right" style={{ color }}>{v.toFixed(1)}</div>
                        <div className="mono text-[10px] text-neutral-500 w-10 text-right">
                          {pctOfTarget === null ? '–' : `${pctOfTarget.toFixed(0)}%`}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {nTotal > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form (in dieser Gruppe)</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={nTotal - nh4} total={nTotal} color={nColor} />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4} total={nTotal} color={nh4Color} highlight />
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
                NH₄-Anteil: <span className="font-semibold mono" style={{ color: nh4Color }}>
                  {((nh4 / nTotal) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {ratios.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Verhältnisse</div>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map(r => {
                  const cA = useColor ? getElColor(r.a, elementColors) : '#fafafa';
                  const cB = useColor ? getElColor(r.b, elementColors) : '#fafafa';
                  return (
                    <div key={`${r.a}-${r.b}`} className="rounded-lg bg-neutral-800/40 px-3 py-2 border border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="mono text-sm font-bold" style={{ color: cA }}>{r.a}</span>
                        <span className="text-xs text-neutral-500">:</span>
                        <span className="mono text-sm font-bold" style={{ color: cB }}>{r.b}</span>
                      </div>
                      <div className="mono text-xs text-neutral-300">
                        <span style={{ color: cA }}>{r.ratioA}</span>
                        <span className="text-neutral-500"> : </span>
                        <span style={{ color: cB }}>{r.ratioB}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {group.salts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 flex justify-between">
                <span>Salze in dieser Gruppe</span>
                <span>{group.salts.length}</span>
              </div>
              <div className="space-y-1.5">
                {group.salts.map(s => {
                  const m = s.mass || 0;
                  const massShare = s.massUnit === 'ml' ? totalMl : totalG;
                  const massPct = massShare > 0 ? (m / massShare) * 100 : 0;
                  const price = s.pricePerKg ? (s.pricePerKg * m) / 1000 : null;
                  const sortedContribs = Object.entries(s.contributions || {})
                    .filter(([, v]) => (v || 0) > 0)
                    .sort((a, b) => b[1] - a[1]);
                  return (
                    <div key={s.id} className="rounded-lg bg-neutral-800/30 border border-neutral-800/60 p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="mono text-sm font-semibold" style={{ color: themeColor }}>{s.shortName || s.formula}</div>
                        <div className="text-[10px] text-neutral-500 mono truncate flex-1">{s.formula}</div>
                        <div className="mono text-xs font-semibold text-neutral-200 flex-shrink-0">
                          {m.toFixed(2)} <span className="text-neutral-500 text-[10px]">{s.massUnit || 'g'}</span>
                        </div>
                        {price !== null && (
                          <div className="mono text-xs font-semibold flex-shrink-0" style={{ color: '#a3e635' }}>
                            {price.toFixed(2)}€
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sortedContribs.map(([sym, v]) => {
                          const col = useColor ? getElColor(sym, elementColors) : '#fafafa';
                          return (
                            <div key={sym} className="mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-900/80 flex items-center gap-1">
                              <span style={{ color: col, fontWeight: 600 }}>{sym}</span>
                              <span className="text-neutral-300">{v.toFixed(1)}</span>
                            </div>
                          );
                        })}
                        {massShare > 0 && (
                          <div className="mono text-[10px] px-1.5 py-0.5 rounded text-neutral-500 ml-auto">
                            {massPct.toFixed(0)}% Masse
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANALYSIS POPOVER
// ============================================================
export function AnalysisPopover({ recipe, selectedGroupIds, useColor, elementColors, onClose, onOpenElement, onClearSelection }) {
  const hasSelection = selectedGroupIds && selectedGroupIds.size > 0;
  const groups = hasSelection
    ? recipe.groups.filter(g => selectedGroupIds.has(g.id))
    : recipe.groups;

  const totals = {};
  let totalG = 0, totalMl = 0, totalPrice = 0;
  let anyPrice = false, allPriced = true;
  let nh4 = 0, nTotal = 0;

  groups.forEach(g => {
    g.salts.forEach(s => {
      Object.entries(s.contributions || {}).forEach(([sym, v]) => {
        totals[sym] = (totals[sym] || 0) + (v || 0);
      });
      const m = s.mass || 0;
      if (s.massUnit === 'ml') totalMl += m; else totalG += m;
      if (s.pricePerKg && m > 0) {
        anyPrice = true;
        totalPrice += (s.pricePerKg * m) / 1000;
      } else if (m > 0) {
        allPriced = false;
      }
      const n = s.contributions?.N || 0;
      nTotal += n;
      nh4 += n * (s.nh4Fraction || 0);
    });
  });

  const targets = recipe.targets || {};
  const elementsHere = ELEMENT_DEFS.filter(e => (totals[e.sym] || 0) > 0 || (targets[e.sym] || 0) > 0);

  const RATIOS = [['N', 'K'], ['P', 'K'], ['Ca', 'Mg'], ['N', 'Ca'], ['K', 'Ca'], ['Fe', 'Mn'], ['K', 'Mg']];
  const ratios = RATIOS
    .map(([a, b]) => ({ a, b, va: totals[a] || 0, vb: totals[b] || 0 }))
    .filter(r => r.va > 0 && r.vb > 0)
    .map(r => {
      const min = Math.min(r.va, r.vb);
      return { ...r, ratioA: (r.va / min).toFixed(2), ratioB: (r.vb / min).toFixed(2) };
    });

  const targeted = ELEMENT_DEFS.filter(e => (targets[e.sym] || 0) > 0);
  const scores = targeted.map(e => {
    const t = targets[e.sym];
    const a = totals[e.sym] || 0;
    const pct = (a / t) * 100;
    return Math.max(0, 100 - Math.abs(pct - 100));
  });
  const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const nColor = useColor ? getElColor('N', elementColors) : '#7CB342';
  const nh4Color = useColor ? getNH4Color(elementColors) : '#9CCC65';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[90vh] overflow-y-auto recipe-scroll">
        <div className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 p-5 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Auswertung</div>
            <div className="font-semibold text-lg truncate mono" style={{ color: recipe.themeColor || '#10b981' }}>{recipe.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {hasSelection ? (
                <span className="text-emerald-400">
                  {groups.length} ausgewählte Gruppe{groups.length === 1 ? '' : 'n'}: {groups.map(g => g.name || '?').join(' + ')}
                </span>
              ) : (
                <span>Alle {groups.length} Gruppen · gesamtes Rezept</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {hasSelection && (
            <button onClick={onClearSelection} className="text-xs text-neutral-400 hover:text-emerald-400 underline">
              Auswahl aufheben und Gesamt-Rezept zeigen
            </button>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Salze" value={groups.reduce((s, g) => s + g.salts.length, 0)} unit="" />
            {totalG > 0 && <StatCard label="Trocken" value={totalG.toFixed(0)} unit="g" />}
            {totalMl > 0 && <StatCard label="Flüssig" value={totalMl.toFixed(0)} unit="ml" />}
            {anyPrice && (
              <StatCard label={allPriced ? 'Preis' : 'Preis (teilw.)'} value={totalPrice.toFixed(2)} unit="€" accent="#a3e635" />
            )}
            {overallScore !== null && (
              <StatCard
                label="Zielwert-Score"
                value={overallScore.toFixed(0)}
                unit="/100"
                accent={overallScore >= 90 ? '#34d399' : overallScore >= 75 ? '#facc15' : '#fb923c'}
              />
            )}
            {nTotal > 0 && (
              <StatCard label="NH₄-Anteil" value={((nh4 / nTotal) * 100).toFixed(1)} unit="%" accent={nh4Color} />
            )}
          </div>

          {elementsHere.length > 0 && (() => {
            const MACRO_SET = new Set(['N', 'P', 'K', 'Mg', 'Ca', 'S', 'Si', 'Cl']);
            const macroData = elementsHere
              .filter(e => MACRO_SET.has(e.sym) && (totals[e.sym] || 0) > 0)
              .map(e => ({ sym: e.sym, color: useColor ? getElColor(e.sym, elementColors) : '#a3a3a3', value: totals[e.sym] || 0 }));
            const microData = elementsHere
              .filter(e => !MACRO_SET.has(e.sym) && (totals[e.sym] || 0) > 0)
              .map(e => ({ sym: e.sym, color: useColor ? getElColor(e.sym, elementColors) : '#a3a3a3', value: totals[e.sym] || 0 }));
            if (macroData.length === 0 && microData.length === 0) return null;
            return (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Element-Verteilung in ppm</div>
                <div className={`grid ${macroData.length > 0 && microData.length > 0 ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  {macroData.length > 0 && <ElementDonut data={macroData} label="Makro" />}
                  {microData.length > 0 && <ElementDonut data={microData} label="Mikro" />}
                </div>
              </div>
            );
          })()}

          {elementsHere.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Zielerreichung pro Element</div>
              <div className="space-y-1.5">
                {(() => {
                  const maxUntargeted = elementsHere.reduce((mx, e) => {
                    const t = targets[e.sym] || 0;
                    if (t > 0) return mx;
                    return Math.max(mx, totals[e.sym] || 0);
                  }, 0);
                  return elementsHere.map(e => {
                    const v = totals[e.sym] || 0;
                    const target = targets[e.sym] || 0;
                    const hasTarget = target > 0;
                    const pct = hasTarget ? (v / target) * 100 : null;
                    const color = useColor ? getElColor(e.sym, elementColors) : '#fafafa';
                    let barWidth, barColor, barOpacity;
                    if (hasTarget) {
                      barWidth = Math.min(100, pct);
                      barColor = pct > 100 ? '#ef4444' : color;
                      barOpacity = 1;
                    } else {
                      barWidth = maxUntargeted > 0 ? (v / maxUntargeted) * 100 : 0;
                      barColor = color;
                      barOpacity = 0.45;
                    }
                    return (
                      <div key={e.sym} className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenElement && onOpenElement(e.sym)}
                          className="w-9 h-7 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                          style={{
                            background: useColor ? `${color}22` : 'transparent',
                            boxShadow: useColor ? `inset 0 0 0 1px ${color}55` : 'inset 0 0 0 1px #404040',
                            color: useColor ? color : '#fafafa',
                          }}
                        >
                          {e.sym}
                        </button>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: '#000' }}>
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${barWidth}%`, background: barColor, opacity: barOpacity,
                            boxShadow: useColor && hasTarget ? `0 0 6px ${color}66` : 'none',
                          }} />
                        </div>
                        <div className="mono text-xs font-semibold w-16 text-right" style={{ color }}>{v.toFixed(1)}</div>
                        <div className="mono text-[10px] text-neutral-500 w-10 text-right">{target > 0 ? target.toFixed(1) : '–'}</div>
                        <div className="mono text-[10px] font-semibold w-10 text-right"
                          style={{ color: pct === null ? '#525252' : pct > 110 || pct < 85 ? '#ef4444' : pct > 105 || pct < 95 ? '#facc15' : '#34d399' }}>
                          {pct === null ? '–' : `${pct.toFixed(0)}%`}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-neutral-600 pt-1 px-1">
                  <span className="w-9 text-center">Sym</span>
                  <span className="flex-1">Erreicht vs. Ziel · gedimmt = kein Ziel</span>
                  <span className="w-16 text-right">Ist</span>
                  <span className="w-10 text-right">Ziel</span>
                  <span className="w-10 text-right">%</span>
                </div>
              </div>
            </div>
          )}

          {nTotal > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={nTotal - nh4} total={nTotal} color={nColor} />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4} total={nTotal} color={nh4Color} highlight />
              </div>
            </div>
          )}

          {ratios.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Verhältnisse</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ratios.map(r => {
                  const cA = useColor ? getElColor(r.a, elementColors) : '#fafafa';
                  const cB = useColor ? getElColor(r.b, elementColors) : '#fafafa';
                  return (
                    <div key={`${r.a}-${r.b}`} className="rounded-lg bg-neutral-800/40 px-3 py-2 border border-neutral-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="mono text-sm font-bold" style={{ color: cA }}>{r.a}</span>
                        <span className="text-xs text-neutral-500">:</span>
                        <span className="mono text-sm font-bold" style={{ color: cB }}>{r.b}</span>
                      </div>
                      <div className="mono text-xs text-neutral-300">
                        <span style={{ color: cA }}>{r.ratioA}</span>
                        <span className="text-neutral-500"> : </span>
                        <span style={{ color: cB }}>{r.ratioB}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {groups.length === 0 && (
            <div className="text-center py-6 text-sm text-neutral-500 italic">Keine Gruppen vorhanden.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GROUP ACTIONS MENU
// ============================================================
export function GroupActionsMenu({ group, onClose, onRename, onDelete, onAddSalt, onConvertKind, onToggleFoliar, fixedPos }) {
  useEffect(() => {
    const handle = (e) => {
      if (!e.target.closest('[data-group-menu]')) onClose();
    };
    const tid = setTimeout(() => document.addEventListener('click', handle), 0);
    return () => { clearTimeout(tid); document.removeEventListener('click', handle); };
  }, [onClose]);

  const kind = group.kind || 'stock';
  const KINDS = [
    { key: 'stock', icon: '🧪', label: 'Konzentrat' },
    { key: 'solo',  icon: '🥤', label: 'Endlösung' },
    { key: 'topdress', icon: '🥄', label: 'Topdress' },
  ];

  const posStyle = fixedPos
    ? { position: 'fixed', top: fixedPos.top, right: fixedPos.right, zIndex: 200 }
    : {};

  return (
    <div data-group-menu
      className="min-w-[210px] bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl py-1 text-neutral-200"
      style={posStyle}
    >
      <MenuItem icon="➕" label="Salz hinzufügen" onClick={() => { onAddSalt(); onClose(); }} />
      <MenuItem icon="✎" label="Name bearbeiten" onClick={() => { onRename(); onClose(); }} />
      <div className="border-t border-neutral-800 my-1" />
      <div className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-neutral-500">Gruppentyp</div>
      {KINDS.map(k => (
        <MenuItem
          key={k.key}
          icon={kind === k.key ? '✓' : k.icon}
          label={k.label}
          onClick={() => { if (kind !== k.key) onConvertKind && onConvertKind(group.id, k.key); onClose(); }}
        />
      ))}
      {/* Foliar wird jetzt als kleine Checkbox direkt im Header der Endlösungs-Gruppen
          neben der Gesamtmenge umgeschaltet — daher hier nicht mehr im Kebab-Menü. */}
      <div className="border-t border-neutral-800 my-1" />
      <MenuItem icon="🗑" label="Gruppe entfernen" danger onClick={() => { onDelete(); onClose(); }} />
    </div>
  );
}

// ============================================================
// TOAST
// ============================================================
export function Toast({ message, show, type = 'success' }) {
  if (!show) return null;
  const isWarn = type === 'warning';
  // Warning: amber/orange — deutlich anders als die Erfolgs-Variante,
  // damit Block-Hinweise nicht mit einer grünen Bestätigung verwechselt werden.
  const bgClass = isWarn ? 'bg-amber-600' : 'bg-emerald-600';
  // Längere Sichtbarkeit für Warnungen (3s statt 2s), damit Nutzer sie lesen können
  const animation = isWarn ? 'fadeInOutLong 3s ease-out' : 'fadeInOut 2s ease-out';
  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${bgClass} text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium`}
      style={{ animation }}
      role={isWarn ? 'alert' : 'status'}
    >
      {isWarn ? (
        // Warn-Icon: Dreieck mit Ausrufezeichen
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ) : (
        // Success-Icon: Häkchen
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {message}
      <style>{`
        @keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, -10px); } 15% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -10px); } }
        @keyframes fadeInOutLong { 0% { opacity: 0; transform: translate(-50%, -10px); } 8% { opacity: 1; transform: translate(-50%, 0); } 92% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -10px); } }
      `}</style>
    </div>
  );
}
