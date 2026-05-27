// ============================================================
// RECIPE POPOVER — Element-Detail + Salzauswahl + Kebab-Menü
// ============================================================

const { useState: useStateR, useEffect: useEffectR, useRef: useRefR } = React;

// ============================================================
// Element-Detail-Popover — zeigt Aufschlüsselung für ein Element
// ============================================================
function ElementDetailPopover({ element, recipe, useColor, onClose }) {
  if (!element) return null;
  const def = ELEMENT_BY_SYM[element];
  const target = recipe.targets?.[element] || 0;

  // Sammle alle Beiträge dieses Elements aus allen Gruppen/Salzen
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
  const pctColor = pct >= 95 && pct <= 105 ? '#10b981' :
                   pct >= 90 && pct <= 110 ? '#facc15' :
                   pct >= 85 && pct <= 115 ? '#fb923c' : '#ef4444';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] overflow-y-auto recipe-scroll">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl"
               style={{ background: `${def.color}22`, color: def.color, boxShadow: `inset 0 0 0 1px ${def.color}55` }}>
            {def.sym}
          </div>
          <div className="flex-1">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Element-Detail</div>
            <div className="text-lg font-semibold">{def.name}</div>
          </div>
          <button onClick={onClose}
                  className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Soll/Ist mit % */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-neutral-800/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Ziel</div>
              <div className="mono text-lg font-semibold">{target.toFixed(target < 1 ? 2 : 1)}</div>
              <div className="text-[10px] text-neutral-500">ppm</div>
            </div>
            <div className="rounded-lg bg-neutral-800/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Erreicht</div>
              <div className="mono text-lg font-semibold" style={{ color: def.color }}>{actual.toFixed(actual < 1 ? 2 : 1)}</div>
              <div className="text-[10px] text-neutral-500">ppm</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: `${pctColor}22`, boxShadow: `inset 0 0 0 1px ${pctColor}55` }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `${pctColor}cc` }}>Zielerreichung</div>
              <div className="mono text-lg font-semibold" style={{ color: pctColor }}>{pct.toFixed(0)}%</div>
              <div className="text-[10px]" style={{ color: `${pctColor}99` }}>{actual > target ? `+${(actual-target).toFixed(1)}` : actual < target ? `${(actual-target).toFixed(1)}` : '±0'} ppm</div>
            </div>
          </div>

          {/* NH₄/NO₃ Aufschlüsselung — nur bei N */}
          {element === 'N' && actual > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={actual - nh4Sum} total={actual} color="#7CB342" />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4Sum} total={actual} color="#9CCC65" highlight />
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
                NH₄-Anteil am Gesamtstickstoff: <span className="font-semibold mono" style={{ color: '#9CCC65' }}>
                  {actual > 0 ? ((nh4Sum/actual)*100).toFixed(2) : '0'}%
                </span>
              </div>
            </div>
          )}

          {/* Verteilung pro Salz */}
          {contributions.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 flex justify-between">
                <span>Verteilung pro Salz</span>
                <span>{contributions.length} Quelle{contributions.length === 1 ? '' : 'n'}</span>
              </div>
              <div className="space-y-2">
                {contributions.map((c, i) => (
                  <ContributionBar key={i} c={c} maxVal={maxVal} color={def.color} totalActual={actual} useColor={useColor} />
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

function ContributionBar({ c, maxVal, color, totalActual, useColor }) {
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

// ============================================================
// Salzauswahl-Popover (Bottom-Sheet)
// ============================================================
const AVAILABLE_SALTS = [
  { shortName: 'KN',  formula: 'KNO₃',          name: 'Kaliumnitrat',                  pricePerKg: 4.20, contributions: { N: 13.85, K: 38.67 }, nh4Fraction: 0 },
  { shortName: 'CaN', formula: '5Ca(NO₃)₂·NH₄NO₃·10H₂O', name: 'Calciumnitrat',         pricePerKg: 3.50, contributions: { Ca: 18.58, N: 15.50 }, nh4Fraction: 0.07 },
  { shortName: 'AmN', formula: 'NH₄NO₃',        name: 'Ammoniumnitrat',                pricePerKg: 3.00, contributions: { N: 35.00 }, nh4Fraction: 0.5 },
  { shortName: 'MgN', formula: 'Mg(NO₃)₂·6H₂O', name: 'Magnesiumnitrat-Hexahydrat',    pricePerKg: 4.00, contributions: { Mg: 9.48, N: 10.93 }, nh4Fraction: 0 },
  { shortName: 'KS',  formula: 'K₂SO₄',         name: 'Kaliumsulfat',                  pricePerKg: 3.20, contributions: { K: 44.88, S: 18.40 }, nh4Fraction: 0 },
  { shortName: 'MgS', formula: 'MgSO₄·7H₂O',    name: 'Magnesiumsulfat-Heptahydrat',   pricePerKg: 1.80, contributions: { Mg: 9.86, S: 13.01 }, nh4Fraction: 0 },
  { shortName: 'MKP', formula: 'KH₂PO₄',        name: 'Monokaliumphosphat',            pricePerKg: 5.50, contributions: { K: 28.73, P: 22.76 }, nh4Fraction: 0 },
  { shortName: 'MAP', formula: 'NH₄H₂PO₄',      name: 'Monoammoniumphosphat',          pricePerKg: 4.90, contributions: { N: 12.18, P: 26.93 }, nh4Fraction: 1.0 },
  { shortName: 'KCl', formula: 'KCl',           name: 'Kaliumchlorid',                 pricePerKg: 2.00, contributions: { K: 52.45, Cl: 47.55 }, nh4Fraction: 0 },
  { shortName: 'FeS', formula: 'FeSO₄·7H₂O',    name: 'Eisensulfat-Heptahydrat',       pricePerKg: 4.50, contributions: { Fe: 20.09, S: 11.53 }, nh4Fraction: 0 },
  { shortName: 'MnS', formula: 'MnSO₄·H₂O',     name: 'Mangansulfat-Monohydrat',       pricePerKg: 4.50, contributions: { Mn: 32.51, S: 18.97 }, nh4Fraction: 0 },
  { shortName: 'ZnS', formula: 'ZnSO₄·7H₂O',    name: 'Zinksulfat-Heptahydrat',        pricePerKg: 5.00, contributions: { Zn: 22.74, S: 11.15 }, nh4Fraction: 0 },
  { shortName: 'CuS', formula: 'CuSO₄·5H₂O',    name: 'Kupfersulfat-Pentahydrat',      pricePerKg: 8.00, contributions: { Cu: 25.45, S: 12.84 }, nh4Fraction: 0 },
  { shortName: 'Bor', formula: 'H₃BO₃',         name: 'Borsäure',                      pricePerKg: 4.00, contributions: { B: 17.48 }, nh4Fraction: 0 },
  { shortName: 'MoNa',formula: 'Na₂MoO₄·2H₂O',  name: 'Natriummolybdat-Dihydrat',      pricePerKg: 35.00, contributions: { Mo: 39.66 }, nh4Fraction: 0 },
  { shortName: 'KSi', formula: 'K₂SiO₃',        name: 'Kaliumsilikat',                 pricePerKg: 9.00, contributions: { K: 17.0, Si: 23.0 }, nh4Fraction: 0 },
];

function SaltPickerPopover({ open, onClose, onPick, replaceMode }) {
  const [search, setSearch] = useStateR('');
  const [selectedKeys, setSelectedKeys] = useStateR(() => new Set());

  // Reset bei jedem Öffnen
  useEffectR(() => {
    if (open) { setSelectedKeys(new Set()); setSearch(''); }
  }, [open]);

  if (!open) return null;

  const filtered = AVAILABLE_SALTS.filter(s =>
    (s.name + ' ' + s.formula + ' ' + s.shortName).toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (sn) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(sn)) next.delete(sn); else next.add(sn);
      return next;
    });
  };

  const pickSingle = (s) => onPick([s]);
  const confirmMulti = () => {
    const list = AVAILABLE_SALTS.filter(s => selectedKeys.has(s.shortName));
    if (list.length > 0) onPick(list);
  };

  const count = selectedKeys.size;
  const title = replaceMode ? 'Salz ersetzen' : 'Salze auswählen';
  const subtitle = replaceMode
    ? 'Eines wählen zum Ersetzen'
    : count > 0
      ? `${count} ausgewählt`
      : 'Eines oder mehrere antippen';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] flex flex-col">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{title}</div>
              <div className="text-[10px] text-neutral-500 truncate">{subtitle}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto recipe-scroll p-2">
          {filtered.map((s) => {
            const isSelected = selectedKeys.has(s.shortName);
            return (
              <button key={s.shortName}
                      onClick={() => replaceMode ? pickSingle(s) : toggle(s.shortName)}
                      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${isSelected ? 'bg-emerald-950/40 ring-1 ring-inset ring-emerald-700/50' : 'hover:bg-neutral-800'}`}>
                {!replaceMode && (
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600'}`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                )}
                <div className="font-mono font-semibold text-sm w-12 text-emerald-400 flex-shrink-0">{s.shortName}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.name}</div>
                  <div className="text-xs text-neutral-500 mono truncate">{s.formula}</div>
                </div>
                <div className="text-[10px] text-neutral-500 text-right flex-shrink-0">
                  {Object.entries(s.contributions).slice(0, 3).map(([sym, v]) => (
                    <div key={sym} className="mono"><span style={{ color: ELEMENT_BY_SYM[sym]?.color }}>{sym}</span> {v.toFixed(1)}%</div>
                  ))}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-sm text-neutral-500 italic text-center py-8">Keine Salze gefunden.</div>
          )}
        </div>
        {/* Bottom Action Bar — nur im Add-Modus */}
        {!replaceMode && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-3 flex gap-2">
            <button onClick={() => setSelectedKeys(new Set())} disabled={count === 0}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${count === 0 ? 'bg-neutral-800/40 text-neutral-700 cursor-not-allowed' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}>
              Leeren
            </button>
            <button onClick={confirmMulti} disabled={count === 0}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${count === 0 ? 'bg-neutral-800/40 text-neutral-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
              {count === 0 ? 'Salze antippen…' : count === 1 ? '1 Salz hinzufügen' : `${count} Salze hinzufügen`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GROUP DETAIL POPOVER — Übersicht über eine Gruppe
// ============================================================
function GroupDetailPopover({ groupId, recipe, useColor, onClose, onOpenElement }) {
  if (!groupId) return null;
  const group = recipe.groups.find(g => g.id === groupId);
  if (!group) return null;

  const themeColor = recipe.themeColor || '#10b981';
  const isStock = group.kind === 'stock';
  const isSolo = group.kind === 'solo';
  const isTopdress = group.kind === 'topdress';
  const kindLabel = isTopdress ? 'Topdress' : isSolo ? 'Endlösung' : 'Konzentrat';

  // Aggregations
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

  // Elements present in this group
  const elementsHere = ELEMENT_DEFS.filter(e => (groupContrib[e.sym] || 0) > 0);

  // Verhältnisse: zeige nur die mit beiden Elementen vorhanden
  const RATIOS = [
    ['N', 'K'], ['P', 'K'], ['Ca', 'Mg'], ['N', 'Ca'], ['K', 'Ca'], ['Fe', 'Mn'],
  ];
  const ratios = RATIOS
    .map(([a, b]) => ({ a, b, va: groupContrib[a] || 0, vb: groupContrib[b] || 0 }))
    .filter(r => r.va > 0 && r.vb > 0)
    .map(r => {
      const min = Math.min(r.va, r.vb);
      return {
        ...r,
        ratioA: (r.va / min).toFixed(2),
        ratioB: (r.vb / min).toFixed(2),
      };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-lg bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[88vh] overflow-y-auto recipe-scroll">
        {/* Sticky Header */}
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
              <div className="mt-1 mono text-[11px] text-neutral-400">
                Endlösung · {group.volume} L
              </div>
            )}
          </div>
          <button onClick={onClose}
                  className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Salze" value={group.salts.length} unit="" />
            {totalG > 0 && <StatCard label="Trocken" value={totalG.toFixed(0)} unit="g" />}
            {totalMl > 0 && <StatCard label="Flüssig" value={totalMl.toFixed(0)} unit="ml" />}
            {anyPrice && (
              <StatCard
                label={allPriced ? 'Preis' : 'Preis (teilw.)'}
                value={totalPrice.toFixed(2)}
                unit="€"
                accent="#a3e635" />
            )}
          </div>

          {/* Element-Beiträge dieser Gruppe gegen Rezept-Ziel */}
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
                  const color = useColor ? e.color : '#fafafa';
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
                      <button onClick={() => onOpenElement && onOpenElement(e.sym)}
                              className="w-9 h-7 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                              style={{
                                background: useColor ? `${e.color}22` : 'transparent',
                                boxShadow: useColor ? `inset 0 0 0 1px ${e.color}55` : 'inset 0 0 0 1px #404040',
                                color: useColor ? e.color : '#fafafa'
                              }}>
                        {e.sym}
                      </button>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#000' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${barWidth}%`,
                          background: barColor,
                          opacity: barOpacity,
                          boxShadow: useColor && hasTarget ? `0 0 6px ${e.color}66` : 'none'
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

          {/* NH4 / NO3 Split */}
          {nTotal > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form (in dieser Gruppe)</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={nTotal - nh4} total={nTotal} color={ELEMENT_BY_SYM.N.color} />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4} total={nTotal} color="#9CCC65" highlight />
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
                NH₄-Anteil: <span className="font-semibold mono" style={{ color: '#9CCC65' }}>
                  {((nh4 / nTotal) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* Verhältnisse */}
          {ratios.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Verhältnisse</div>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map(r => {
                  const cA = useColor ? ELEMENT_BY_SYM[r.a]?.color : '#fafafa';
                  const cB = useColor ? ELEMENT_BY_SYM[r.b]?.color : '#fafafa';
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

          {/* Salze in dieser Gruppe */}
          {group.salts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 flex justify-between">
                <span>Salze in dieser Gruppe</span>
                <span>{group.salts.length}</span>
              </div>
              <div className="space-y-1.5">
                {group.salts.map(s => {
                  const m = s.mass || 0;
                  const massShare = (s.massUnit === 'ml' ? totalMl : totalG);
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
                          const col = useColor ? ELEMENT_BY_SYM[sym]?.color : '#fafafa';
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

// ============================================================
// ELEMENT DONUT — SVG-Ring mit Element-Anteilen + Legende
// ============================================================
function ElementDonut({ data, label, size = 110 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  // Sortieren: größter Anteil zuerst (sieht im Donut besser aus)
  const sorted = [...data].sort((a, b) => b.value - a.value);
  let cumulative = 0;

  return (
    <div className="rounded-lg bg-neutral-800/40 border border-neutral-800 p-3 flex items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0a0a0a" strokeWidth="4" />
          {sorted.map((d, i) => {
            const pct = (d.value / total) * 100;
            const offset = -cumulative;
            const seg = <circle key={d.sym} cx="18" cy="18" r="15.9155" fill="none"
                                stroke={d.color} strokeWidth="4"
                                strokeDasharray={`${pct.toFixed(3)} 100`}
                                strokeDashoffset={offset.toFixed(3)} strokeLinecap="butt" />;
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
      {/* Legende */}
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

// ============================================================
// ANALYSIS POPOVER — Rezept-weite Auswertung (optional Selektion)
// ============================================================
function AnalysisPopover({ recipe, selectedGroupIds, useColor, onClose, onOpenElement, onClearSelection }) {
  const hasSelection = selectedGroupIds && selectedGroupIds.size > 0;
  const groups = hasSelection
    ? recipe.groups.filter(g => selectedGroupIds.has(g.id))
    : recipe.groups;

  // Aggregate
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

  // Verhältnisse
  const RATIOS = [
    ['N', 'K'], ['P', 'K'], ['Ca', 'Mg'], ['N', 'Ca'], ['K', 'Ca'], ['Fe', 'Mn'], ['K', 'Mg'],
  ];
  const ratios = RATIOS
    .map(([a, b]) => ({ a, b, va: totals[a] || 0, vb: totals[b] || 0 }))
    .filter(r => r.va > 0 && r.vb > 0)
    .map(r => {
      const min = Math.min(r.va, r.vb);
      return { ...r, ratioA: (r.va / min).toFixed(2), ratioB: (r.vb / min).toFixed(2) };
    });

  // Score: durchschnittliche Zielerreichung (nur Elemente mit Ziel)
  const targeted = ELEMENT_DEFS.filter(e => (targets[e.sym] || 0) > 0);
  const scores = targeted.map(e => {
    const t = targets[e.sym];
    const a = totals[e.sym] || 0;
    const pct = (a / t) * 100;
    // Score: 100 - |Abweichung|, gedeckelt
    const dev = Math.abs(pct - 100);
    return Math.max(0, 100 - dev);
  });
  const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-2xl bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[90vh] overflow-y-auto recipe-scroll">
        {/* Sticky Header */}
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
          <button onClick={onClose}
                  className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {hasSelection && (
            <button onClick={onClearSelection}
                    className="text-xs text-neutral-400 hover:text-emerald-400 underline">
              Auswahl aufheben und Gesamt-Rezept zeigen
            </button>
          )}

          {/* Top Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Salze" value={groups.reduce((s, g) => s + g.salts.length, 0)} unit="" />
            {totalG > 0 && <StatCard label="Trocken" value={totalG.toFixed(0)} unit="g" />}
            {totalMl > 0 && <StatCard label="Flüssig" value={totalMl.toFixed(0)} unit="ml" />}
            {anyPrice && (
              <StatCard
                label={allPriced ? 'Preis' : 'Preis (teilw.)'}
                value={totalPrice.toFixed(2)}
                unit="€"
                accent="#a3e635" />
            )}
            {overallScore !== null && (
              <StatCard
                label="Zielwert-Score"
                value={overallScore.toFixed(0)}
                unit="/100"
                accent={overallScore >= 90 ? '#34d399' : overallScore >= 75 ? '#facc15' : '#fb923c'} />
            )}
            {nTotal > 0 && (
              <StatCard
                label="NH₄-Anteil"
                value={((nh4 / nTotal) * 100).toFixed(1)}
                unit="%"
                accent="#9CCC65" />
            )}
          </div>

          {/* Element-Verteilung: 2 Donuts (Makro + Mikro) */}
          {elementsHere.length > 0 && (() => {
            const MACRO_SET = new Set(['N','P','K','Mg','Ca','S','Si','Cl']);
            const macroData = elementsHere
              .filter(e => MACRO_SET.has(e.sym) && (totals[e.sym] || 0) > 0)
              .map(e => ({ sym: e.sym, color: useColor ? e.color : '#a3a3a3', value: totals[e.sym] || 0 }));
            const microData = elementsHere
              .filter(e => !MACRO_SET.has(e.sym) && (totals[e.sym] || 0) > 0)
              .map(e => ({ sym: e.sym, color: useColor ? e.color : '#a3a3a3', value: totals[e.sym] || 0 }));
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

          {/* Zielerreichung pro Element */}
          {elementsHere.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Zielerreichung pro Element</div>
              <div className="space-y-1.5">
                {(() => {
                  // Max-IST unter Elementen ohne Ziel — als Fallback-Skala
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
                  const color = useColor ? e.color : '#fafafa';
                  // Mit Ziel: bar = pctOfTarget (capped 100), overflow rot
                  // Ohne Ziel: bar = v / maxUntargeted (proportional), gedimmt
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
                      <button onClick={() => onOpenElement && onOpenElement(e.sym)}
                              className="w-9 h-7 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                              style={{
                                background: useColor ? `${e.color}22` : 'transparent',
                                boxShadow: useColor ? `inset 0 0 0 1px ${e.color}55` : 'inset 0 0 0 1px #404040',
                                color: useColor ? e.color : '#fafafa'
                              }}>
                        {e.sym}
                      </button>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: '#000' }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${barWidth}%`,
                          background: barColor,
                          opacity: barOpacity,
                          boxShadow: useColor && hasTarget ? `0 0 6px ${e.color}66` : 'none'
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

          {/* NH4 Form */}
          {nTotal > 0 && (
            <div className="rounded-lg bg-neutral-800/40 p-3 border border-neutral-800">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">Stickstoff-Form</div>
              <div className="space-y-2">
                <NSplitRow label="NO₃⁻ (Nitrat)" value={nTotal - nh4} total={nTotal} color={ELEMENT_BY_SYM.N.color} />
                <NSplitRow label="NH₄⁺ (Ammonium)" value={nh4} total={nTotal} color="#9CCC65" highlight />
              </div>
            </div>
          )}

          {/* Verhältnisse */}
          {ratios.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Verhältnisse</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ratios.map(r => {
                  const cA = useColor ? ELEMENT_BY_SYM[r.a]?.color : '#fafafa';
                  const cB = useColor ? ELEMENT_BY_SYM[r.b]?.color : '#fafafa';
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
            <div className="text-center py-6 text-sm text-neutral-500 italic">
              Keine Gruppen vorhanden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Group Actions Menu
// ============================================================
function GroupActionsMenu({ group, anchorRef, onClose, onRename, onDelete, onAddSalt, onConvertKind }) {
  useEffectR(() => {
    const handle = (e) => { if (!e.target.closest('[data-group-menu]')) onClose(); };
    setTimeout(() => document.addEventListener('click', handle), 0);
    return () => document.removeEventListener('click', handle);
  }, [onClose]);

  const isStock = group.kind === 'stock';
  const isSolo = group.kind === 'solo';
  const showConvert = isStock || isSolo;

  return (
    <div data-group-menu
         className="absolute top-full right-0 mt-1 z-30 min-w-[200px] bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl py-1">
      <MenuItem icon="➕" label="Salz hinzufügen" onClick={() => { onAddSalt(); onClose(); }} />
      <MenuItem icon="✎" label="Gruppe umbenennen" onClick={() => { onRename(); onClose(); }} />
      {showConvert && (
        <MenuItem
          icon={isStock ? '🥤' : '🧪'}
          label={isStock ? 'Als Endlösung' : 'Als Konzentrat'}
          sub={isStock ? 'Faktor entfernen' : 'Faktor hinzufügen'}
          onClick={() => { onConvertKind && onConvertKind(group.id, isStock ? 'solo' : 'stock'); onClose(); }} />
      )}
      <div className="border-t border-neutral-800 my-1" />
      <MenuItem icon="🗑" label="Gruppe entfernen" danger onClick={() => { onDelete(); onClose(); }} />
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick, danger }) {
  return (
    <button onClick={onClick}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-neutral-800 ${danger ? 'text-rose-400' : ''}`}>
      <span className="w-4 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div>{label}</div>
        {sub && <div className="text-[10px] text-neutral-500">{sub}</div>}
      </div>
    </button>
  );
}

// ============================================================
// Toast — kurze Bestätigung
// ============================================================
function Toast({ message, show }) {
  if (!show) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in"
         style={{ animation: 'fadeInOut 2s ease-out' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {message}
      <style>{`@keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, -10px); } 15% { opacity: 1; transform: translate(-50%, 0); } 85% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -10px); } }`}</style>
    </div>
  );
}

Object.assign(window, { ElementDetailPopover, SaltPickerPopover, GroupActionsMenu, GroupDetailPopover, AnalysisPopover, StatCard, ElementDonut, Toast, AVAILABLE_SALTS });
