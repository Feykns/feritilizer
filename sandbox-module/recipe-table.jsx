// ============================================================
// RECIPE TABLE — Portrait + Landscape, mit ausgerichteten Spalten
// ============================================================

const { useState: useStateT, useRef: useRefT, useEffect: useEffectT, useMemo: useMemoT } = React;

// Spaltenbreiten: 1 globaler Wert pro Spalte, damit Header + Werte exakt übereinander stehen
const TABLE_DIMS = {
  // Mobile-First
  tileW: 44,
  tileH: 44,
  tileSym: 16,
  rowH: 30,
  valueFont: 13,
  // Salzname-Spalte: je nach Modus
  nameW: { kuerzel: 64, formula: 90, name: 116 },
  massW: 72
};

// ============================================================
// Skalierungs-Helfer
// ============================================================
function scaleSaltByMass(salt, newMass) {
  if (newMass <= 0 || (salt.mass || 0) <= 0) return { ...salt, mass: newMass };
  const factor = newMass / salt.mass;
  const newContributions = {};
  Object.entries(salt.contributions || {}).forEach(([sym, val]) => {
    newContributions[sym] = val * factor;
  });
  return { ...salt, mass: newMass, contributions: newContributions };
}

function scaleSaltByContribution(salt, sym, newValue) {
  const oldValue = salt.contributions?.[sym] || 0;
  if (oldValue <= 0 || newValue <= 0) return salt;
  const factor = newValue / oldValue;
  const newContributions = {};
  Object.entries(salt.contributions || {}).forEach(([k, v]) => {
    newContributions[k] = k === sym ? newValue : v * factor;
  });
  return { ...salt, mass: (salt.mass || 0) * factor, contributions: newContributions };
}

// Volumen-Änderung: skaliert alle Salzmengen, Beiträge bleiben (Endlösung-ppm gleich)
function scaleGroupByVolume(group, newVolume) {
  if (!group.volume || newVolume <= 0) return { ...group, volume: newVolume };
  const factor = newVolume / group.volume;
  return {
    ...group,
    volume: newVolume,
    salts: group.salts.map((s) => ({
      ...s,
      mass: (s.mass || 0) * factor
      // contributions bleiben unverändert
    }))
  };
}

// Konzentrationsfaktor-Änderung: skaliert Salzmengen proportional, Beiträge (End-ppm) bleiben
// Formel: final_ppm = (mass × elementPct) / (factor × volume) × K  →  mass ∝ factor
// Also: neue_mass = alte_mass × (neuer_factor / alter_factor)
function scaleGroupByFactor(group, newFactor) {
  if (!group.factor || newFactor <= 0) {
    return { ...group, factor: newFactor, mlPerL: 1000 / newFactor };
  }
  const ratio = newFactor / group.factor;
  return {
    ...group,
    factor: newFactor,
    mlPerL: 1000 / newFactor,
    salts: group.salts.map((s) => ({
      ...s,
      mass: (s.mass || 0) * ratio
      // contributions bleiben unverändert
    }))
  };
}

// ml/L-Änderung: über Faktor-Skalierung umgerechnet
function scaleGroupByMlPerL(group, newMlPerL) {
  if (!group.mlPerL || newMlPerL <= 0) {
    return { ...group, mlPerL: newMlPerL, factor: 1000 / newMlPerL };
  }
  const newFactor = 1000 / newMlPerL;
  return scaleGroupByFactor(group, newFactor);
}

// ============================================================
// VALUE CELL — anklickbare ppm- oder Massen-Zelle, editierbar
// ============================================================
function ValueCell({ value, unit, onCommit, color, width, decimals = 'auto', bold = false, font = TABLE_DIMS.valueFont, emptyChar = '·' }) {
  const [editing, setEditing] = useStateT(false);
  const [draft, setDraft] = useStateT('');
  const inputRef = useRefT(null);

  useEffectT(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const formatValue = (v) => {
    if (v === null || v === undefined || v === 0) return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    // Tabellen-Anzeige immer max 1 Dezimalstelle (PDF-Export bekommt später 2)
    return n.toFixed(1);
  };

  const formatDraft = (v) => {
    if (v === null || v === undefined || v === 0) return '';
    const n = Number(v);
    if (decimals === 'auto') return String(n);
    return n.toFixed(decimals);
  };

  const commit = () => {
    const num = parseFloat(draft.replace(',', '.'));
    if (!isNaN(num) && num >= 0) onCommit(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ width, height: TABLE_DIMS.rowH }} className="flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {if (e.key === 'Enter') commit();if (e.key === 'Escape') setEditing(false);}}
          className="mono text-center bg-neutral-700 rounded outline-none ring-2 ring-emerald-500"
          style={{ width: width - 4, height: TABLE_DIMS.rowH - 4, fontSize: font, padding: '0 2px' }} />
        
      </div>);

  }

  const formatted = formatValue(value);
  const empty = formatted === null;

  return (
    <button
      onClick={() => {setDraft(formatDraft(value));setEditing(true);}}
      style={{
        width, height: TABLE_DIMS.rowH,
        color: !empty && color ? color : empty ? '#404040' : '#fafafa',
        fontSize: font,
        fontFamily: 'JetBrains Mono, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: bold ? 600 : 500
      }}
      className="flex items-center justify-center rounded hover:bg-neutral-700/40 transition-colors">
      
      {empty ? emptyChar :
      <>
          {formatted}
          {unit && !empty && <span className="opacity-60 ml-0.5" style={{ fontSize: font - 3 }}>{unit}</span>}
        </>
      }
    </button>);

}

// ============================================================
// SALT NAME CELL — mit Marquee bei Long-Press
// ============================================================
function SaltNameCell({ salt, mode, lang, useColor, width, onClickPick }) {
  const containerRef = useRefT(null);
  const innerRef = useRefT(null);
  const [marquee, setMarquee] = useStateT(false);
  const longPressTimer = useRefT(null);

  const display = getSaltDisplay(salt, mode, lang);
  const tokens = colorizeSaltDisplay(display, useColor);

  const startMarquee = () => {
    if (!innerRef.current || !containerRef.current) return;
    const inner = innerRef.current;
    const container = containerRef.current;
    if (inner.scrollWidth > container.clientWidth + 2) {
      const shift = -(inner.scrollWidth - container.clientWidth + 12);
      inner.style.setProperty('--marquee-shift', `${shift}px`);
      setMarquee(true);
      setTimeout(() => setMarquee(false), 6000);
    }
  };

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(startMarquee, 350);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) {clearTimeout(longPressTimer.current);longPressTimer.current = null;}
  };

  // In Kürzel/Formel-Modus: gleiche Größe wie Element-Buchstaben in Kacheln
  // In Voll-Name-Modus: kleinere Schrift
  const fontSize = display.mode === 'name' ? 11 : TABLE_DIMS.tileSym;
  const isMono = display.mode !== 'name';

  return (
    <button
      ref={containerRef}
      onClick={onClickPick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ width, height: TABLE_DIMS.rowH }}
      className="overflow-hidden rounded hover:bg-neutral-700/40 transition-colors px-1 flex items-center"
      title={salt.name || salt.nameEN}>
      
      <div
        ref={innerRef}
        className={`whitespace-nowrap font-medium ${marquee ? 'recipe-marquee-run' : ''}`}
        style={{ fontSize, fontFamily: isMono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif' }}>
        
        {tokens.map((tk, i) =>
        <span key={i} style={tk.color ? { color: tk.color } : undefined}>
            {tk.subscript ? <sub style={{ fontSize: '0.75em' }}>{tk.text}</sub> : tk.text}
          </span>
        )}
      </div>
    </button>);

}

// ============================================================
// ELEMENT HEADER TILE — Periodensystem-Stil, klickbar
// ============================================================
function ElementHeaderTile({ sym, width, onClick, useColor = true }) {
  const def = ELEMENT_BY_SYM[sym];
  if (!def) return null;
  return (
    <button
      onClick={onClick}
      style={{
        width: width || TABLE_DIMS.tileW,
        height: TABLE_DIMS.tileH,
        background: useColor ? `linear-gradient(180deg, ${def.color}28 0%, ${def.color}14 100%)` : 'transparent',
        boxShadow: useColor ? `inset 0 0 0 1px ${def.color}55` : 'inset 0 0 0 1px #404040',
        color: useColor ? def.color : '#fafafa'
      }}
      className="flex items-center justify-center rounded transition-transform hover:scale-[1.04] active:scale-95"
      title={`${def.name} — Detail öffnen`}>
      
      <div className="font-bold leading-none" style={{ fontSize: TABLE_DIMS.tileSym }}>{def.sym}</div>
    </button>);

}

// ============================================================
// META PILL — editierbare Gruppen-Metadaten
// ============================================================
function MetaPill({ prefix, suffix, value, onChange, placeholder = '–', decimals = 0 }) {
  const [editing, setEditing] = useStateT(false);
  const [draft, setDraft] = useStateT('');
  const inputRef = useRefT(null);

  useEffectT(() => {
    if (editing && inputRef.current) {inputRef.current.focus();inputRef.current.select();}
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft.replace(',', '.'));
    if (!isNaN(num) && num > 0) onChange(num);
    setEditing(false);
  };

  const displayValue = value !== null && value !== undefined ?
  decimals > 0 ? Number(value).toFixed(decimals).replace(/\.?0+$/, '') : Math.round(value) :
  placeholder;

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {if (e.key === 'Enter') commit();if (e.key === 'Escape') setEditing(false);}}
        className="mono bg-neutral-800 rounded px-1.5 py-0.5 outline-none ring-2 ring-emerald-500 text-[12px] w-14 text-right" />);


  }
  return (
    <button onClick={() => {setDraft(value ? String(value) : '');setEditing(true);}}
    className="mono hover:bg-neutral-800 rounded px-1.5 py-0.5 transition-colors text-[12px] text-neutral-300 whitespace-nowrap">
      {prefix}{displayValue}{suffix && <span className="opacity-60 ml-0.5">{suffix}</span>}
    </button>);

}

// ============================================================
// GROUP HEADER ROW — Name + Faktor + ml/L + L + Checkbox
// ============================================================
function GroupHeaderRow({ group, themeColor, onUpdate, onDelete, onAddSalt, onOpenGroupDetail, selected, onToggleSelect, onConvertKind, renameSignal }) {
  const [editingName, setEditingName] = useStateT(false);
  const [nameDraft, setNameDraft] = useStateT(group.name);
  const [menuOpen, setMenuOpen] = useStateT(false);

  useEffectT(() => {setNameDraft(group.name);}, [group.name]);

  // External rename trigger (from kebab menu)
  useEffectT(() => {
    if (renameSignal > 0) setEditingName(true);
  }, [renameSignal]);

  const commitName = () => {
    onUpdate({ ...group, name: nameDraft });
    setEditingName(false);
  };

  const isStock = group.kind === 'stock';
  const isSolo = group.kind === 'solo';
  const kindLabel = group.kind === 'topdress' ? 'Topdress' : isSolo ? 'Endlösung' : null;

  return (
    <div className="relative flex items-center px-3 py-2 border-b border-neutral-800"
    style={{ background: `linear-gradient(90deg, ${themeColor}15 0%, transparent 60%)` }}>
      {/* Links-bündig: Name + Meta zusammen */}
      <div className="flex-1 flex items-center justify-start gap-2.5 flex-wrap min-w-0">
        {editingName ?
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {if (e.key === 'Enter') commitName();if (e.key === 'Escape') setEditingName(false);}}
          autoFocus
          placeholder="Gruppen-Name"
          className="mono font-bold bg-neutral-800 rounded px-2 py-0.5 outline-none ring-2 ring-emerald-500 w-28 text-center"
          style={{ color: themeColor, fontSize: 20 }} /> :


        <button
          onClick={() => onOpenGroupDetail && onOpenGroupDetail(group.id)}
          className="mono font-bold hover:bg-neutral-800/60 rounded px-1.5 py-0.5"
          style={{ color: group.name ? themeColor : '#525252', fontSize: 20 }}
          title="Gruppen-Details anzeigen">
          
            {group.name || <span className="italic font-normal" style={{ fontSize: 14 }}>+ Name</span>}
          </button>
        }

        {isStock ?
        <div className="flex items-center gap-1.5">
            <MetaPill prefix="×" value={group.factor} onChange={(v) => onUpdate(scaleGroupByFactor(group, v))} />
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.mlPerL} suffix=" ml/L" onChange={(v) => onUpdate(scaleGroupByMlPerL(group, v))} decimals={2} />
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.volume} suffix=" L" onChange={(v) => onUpdate(scaleGroupByVolume(group, v))} decimals={1} />
          </div> :
        isSolo ?
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">Endlösung</span>
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.volume} suffix=" L" onChange={(v) => onUpdate(scaleGroupByVolume(group, v))} decimals={1} />
          </div> :
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">{kindLabel}</span>
        }
      </div>

      {/* + Salz-Hinzufügen Schnellknopf */}
      <button
        onClick={(e) => {e.stopPropagation();onAddSalt();}}
        className="w-7 h-7 rounded hover:bg-emerald-950/40 hover:text-emerald-400 flex items-center justify-center text-neutral-500 flex-shrink-0"
        title="Salz hinzufügen">
        
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Kebab */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {e.stopPropagation();setMenuOpen(!menuOpen);}}
          className="w-7 h-7 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
          
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen &&
        <GroupActionsMenu
          group={group}
          onClose={() => setMenuOpen(false)}
          onRename={() => setEditingName(true)}
          onDelete={onDelete}
          onAddSalt={onAddSalt}
          onConvertKind={onConvertKind} />

        }
      </div>

      {/* Selection-Checkbox — ganz rechts außen, immer sichtbar */}
      {onToggleSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(group.id); }}
          className={`ml-1 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
            selected
              ? 'bg-emerald-500 border-emerald-400 text-white'
              : 'bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/80 hover:border-neutral-500 text-neutral-600'
          }`}
          title={selected ? 'Gruppe abwählen' : 'Gruppe auswählen'}>
          {selected ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : null}
        </button>
      )}
    </div>);

}

// ============================================================
// SALT ROW
// ============================================================
function SaltRow({ salt, elements, useElementColors, saltMode, saltLang, nameWidth, onUpdate, onRemove }) {
  return (
    <div className="flex items-center px-3 hover:bg-neutral-800/30 group">
      {/* Salzname — Klick öffnet KEIN Picker mehr, nur Marquee bei Long-Press */}
      <div className="flex-shrink-0" style={{ marginRight: 4 }}>
        <SaltNameCell salt={salt} mode={saltMode} lang={saltLang} useColor={useElementColors} width={nameWidth} onClickPick={() => {}} />
      </div>
      {/* Werte */}
      <div className="flex flex-1 justify-start gap-px">
        {elements.map((sym) => {
          const v = salt.contributions?.[sym];
          const color = useElementColors ? ELEMENT_BY_SYM[sym]?.color : undefined;
          return (
            <ValueCell
              key={sym}
              value={v}
              width={TABLE_DIMS.tileW}
              onCommit={(newVal) => onUpdate((s) => scaleSaltByContribution(s, sym, newVal))}
              color={color} />);


        })}
      </div>
      {/* Masse */}
      <div className="flex-shrink-0" style={{ marginLeft: 4 }}>
        <ValueCell
          value={salt.mass}
          unit={salt.massUnit || 'g'}
          width={TABLE_DIMS.massW}
          decimals={2}
          onCommit={(newMass) => onUpdate((s) => scaleSaltByMass(s, newMass))}
          bold />
        
      </div>
      {/* Delete-Knopf */}
      <button
        onClick={onRemove}
        className="ml-1 w-6 h-6 rounded text-neutral-700 hover:text-rose-400 hover:bg-rose-950/30 opacity-30 group-hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0"
        title="Salz entfernen">
        
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>);

}

// ============================================================
// GROUP BLOCK — eine Gruppe in der kompakten Ansicht
// ============================================================
function GroupBlock({ group, recipe, themeColor, useElementColors, saltMode, saltLang, onUpdateGroup, onDeleteGroup, onAddSalt, onOpenElement, onPickSalt, onRemoveSalt, onOpenGroupDetail, selected, onToggleSelect, onConvertKind, renameSignal }) {
  const elements = useMemoT(() => elementsInGroup(group), [group]);
  const nameWidth = TABLE_DIMS.nameW[saltMode] || TABLE_DIMS.nameW.kuerzel;

  const updateSalt = (saltId, transform) => {
    const newSalts = group.salts.map((s) => s.id === saltId ? transform(s) : s);
    onUpdateGroup({ ...group, salts: newSalts });
  };

  return (
    <div className={`rounded-xl bg-neutral-900 border overflow-hidden transition-colors ${selected ? 'border-emerald-700/60 ring-1 ring-emerald-700/30' : 'border-neutral-800'}`}>
      <GroupHeaderRow
        group={group}
        themeColor={themeColor}
        onUpdate={onUpdateGroup}
        onDelete={() => onDeleteGroup(group.id)}
        onAddSalt={() => onAddSalt(group.id)}
        onOpenGroupDetail={onOpenGroupDetail}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onConvertKind={onConvertKind}
        renameSignal={renameSignal} />
      

      {/* Element-Subheader: Tiles exakt über den Werten ausgerichtet */}
      {elements.length > 0 &&
      <div className="overflow-x-auto recipe-scroll">
          <div className="flex items-center px-3 py-2 bg-neutral-900/40 min-w-min">
            {/* Spacer für Salzname-Spalte */}
            <div style={{ width: nameWidth, marginRight: 4 }} className="flex-shrink-0 text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
              SALZ
            </div>
            {/* Element-Tiles */}
            <div className="flex flex-1 justify-start gap-px">
              {elements.map((sym) =>
            <ElementHeaderTile
              key={sym}
              sym={sym}
              width={TABLE_DIMS.tileW}
              useColor={useElementColors}
              onClick={() => onOpenElement(sym)} />

            )}
            </div>
            {/* Spacer für Massen-Spalte */}
            <div style={{ width: TABLE_DIMS.massW, marginLeft: 4 }} className="flex-shrink-0 text-[9px] uppercase tracking-wider text-neutral-500 text-right font-semibold">
              MENGE
            </div>
            {/* Spacer für Delete-Button */}
            <div style={{ width: 24, marginLeft: 4 }} className="flex-shrink-0" />
          </div>

          {/* Salz-Zeilen */}
          <div className="divide-y divide-neutral-800/60">
            {group.salts.map((salt) =>
          <SaltRow
            key={salt.id}
            salt={salt}
            elements={elements}
            useElementColors={useElementColors}
            saltMode={saltMode}
            saltLang={saltLang}
            nameWidth={nameWidth}
            onUpdate={(transform) => updateSalt(salt.id, transform)}
            onRemove={() => onRemoveSalt(group.id, salt.id, salt.shortName || salt.name)} />

          )}
          </div>
        </div>
      }

      {/* "Salz hinzufügen" Zeile */}
      <button
        onClick={() => onAddSalt(group.id)}
        className="w-full text-center text-xs text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800/50 py-2 transition-colors flex items-center justify-center gap-1.5 border-t border-neutral-800/60">
        
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Salz hinzufügen
      </button>
    </div>);

}

// ============================================================
// FOOTER — Gesamtbilanz: Element-Header + Erreicht/Ziel/% Zeilen
// ============================================================
function FooterTotals({ recipe, useElementColors, onOpenElement, onTargetChange }) {
  const totals = useMemoT(() => calculateTotals(recipe), [recipe]);
  const targets = recipe.targets || {};
  const elementsToShow = ELEMENT_DEFS.filter((e) => (totals[e.sym] || 0) > 0 || (targets[e.sym] || 0) > 0);
  const labelW = 90;

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="px-3 py-2 bg-gradient-to-r from-emerald-950/30 to-transparent border-b border-neutral-800 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Gesamtbilanz</div>
        <div className="text-[10px] text-neutral-500">{elementsToShow.length} Elemente · {recipe.groups.reduce((s, g) => s + g.salts.length, 0)} Salze</div>
      </div>

      <div className="overflow-x-auto recipe-scroll">
        <div className="min-w-min" style={{ width: 'max-content' }}>
          {/* Element-Header */}
          <div className="flex items-center px-3 py-2 bg-neutral-900/60">
            <div style={{ width: labelW, marginRight: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Element</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) =>
              <ElementHeaderTile key={e.sym} sym={e.sym} width={TABLE_DIMS.tileW} useColor={useElementColors} onClick={() => onOpenElement(e.sym)} />
              )}
            </div>
          </div>

          {/* Erreicht */}
          <div className="flex items-center px-3 py-1 bg-neutral-900/30">
            <div style={{ width: labelW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">Erreicht</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const val = totals[e.sym] || 0;
                const color = useElementColors ? e.color : '#fafafa';
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW, height: TABLE_DIMS.rowH,
                    color, fontSize: TABLE_DIMS.valueFont, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600
                  }} className="flex items-center justify-center">
                    {val > 0 ? val.toFixed(1) : '·'}
                  </div>);

              })}
            </div>
          </div>

          {/* Ziel — Werte in Element-Farben, editierbar */}
          <div className="flex items-center px-3 py-1 bg-neutral-900/20">
            <div style={{ width: labelW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">Ziel</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const t = targets[e.sym];
                return (
                  <ValueCell
                    key={e.sym}
                    value={t}
                    width={TABLE_DIMS.tileW}
                    color={useElementColors ? e.color : undefined}
                    onCommit={(v) => onTargetChange && onTargetChange(e.sym, v)}
                    emptyChar="–" />);


              })}
            </div>
          </div>

          {/* % */}
          <div className="flex items-center px-3 py-1.5">
            <div style={{ width: labelW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">%</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const t = targets[e.sym] || 0;
                const a = totals[e.sym] || 0;
                const pct = t > 0 ? a / t * 100 : null;
                const { bg, fg } = percentColors(pct);
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW - 2, height: TABLE_DIMS.rowH - 4,
                    background: bg, color: fg,
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                    margin: '2px 1px'
                  }} className="flex items-center justify-center rounded">
                    {pct === null ? '–' : `${pct.toFixed(0)}%`}
                  </div>);

              })}
            </div>
          </div>
        </div>
      </div>
    </div>);

}

function percentColors(pct) {
  if (pct === null) return { bg: 'transparent', fg: '#525252' };
  if (pct >= 95 && pct <= 105) return { bg: '#10b98133', fg: '#34d399' };
  if (pct >= 90 && pct <= 110) return { bg: '#facc1533', fg: '#facc15' };
  if (pct >= 85 && pct <= 115) return { bg: '#fb923c33', fg: '#fb923c' };
  return { bg: '#ef444433', fg: '#ef4444' };
}

// ============================================================
// FULL TABLE VIEW (Voll-Tabelle) — alle Salze über alle Spalten,
// aber leere Elementspalten ausgeblendet
// ============================================================
function FullTableView({ recipe, themeColor, useElementColors, saltMode, saltLang, onUpdateRecipe, onOpenElement, onPickSalt, onRemoveSalt, onAddSalt, onAddGroup, onDeleteGroup, onTargetChange, onOpenGroupDetail, selectedGroupIds, onToggleSelect, onConvertKind, renameSignals }) {
  const totals = useMemoT(() => calculateTotals(recipe), [recipe]);

  // Nur Elemente anzeigen, die irgendwo verwendet werden ODER ein Ziel haben
  const elementsUsed = useMemoT(() => {
    return ELEMENT_DEFS.filter((e) => (totals[e.sym] || 0) > 0 || (recipe.targets?.[e.sym] || 0) > 0);
  }, [totals, recipe.targets]);

  const updateGroup = (groupId, updater) => {
    onUpdateRecipe({
      ...recipe,
      groups: recipe.groups.map((g) => g.id === groupId ? updater(g) : g)
    });
  };

  const updateSalt = (groupId, saltId, transform) => {
    updateGroup(groupId, (g) => ({
      ...g,
      salts: g.salts.map((s) => s.id === saltId ? transform(s) : s)
    }));
  };

  const nameW = TABLE_DIMS.nameW[saltMode] || TABLE_DIMS.nameW.kuerzel;
  const massW = TABLE_DIMS.massW;

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-x-auto recipe-scroll">
      <div style={{ width: 'max-content' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center px-3 py-2">
            <div style={{ width: nameW, marginRight: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Salz</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) =>
              <ElementHeaderTile key={e.sym} sym={e.sym} width={TABLE_DIMS.tileW} useColor={useElementColors} onClick={() => onOpenElement(e.sym)} />
              )}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 text-right font-semibold">Menge</div>
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
        </div>

        {/* Gruppen */}
        {recipe.groups.map((group) => {
          const isSel = selectedGroupIds && selectedGroupIds.has(group.id);
          return (
          <div key={group.id} className={`border-b border-neutral-800 ${isSel ? 'bg-emerald-950/10' : ''}`}>
            <GroupHeaderRow
            group={group}
            themeColor={themeColor}
            onUpdate={(g) => updateGroup(group.id, () => g)}
            onDelete={() => onDeleteGroup(group.id)}
            onAddSalt={() => onAddSalt(group.id)}
            onOpenGroupDetail={onOpenGroupDetail}
            selected={isSel}
            onToggleSelect={onToggleSelect}
            onConvertKind={onConvertKind}
            renameSignal={renameSignals ? renameSignals[group.id] || 0 : 0} />
          
            {group.salts.map((salt) =>
          <SaltRow
            key={salt.id}
            salt={salt}
            elements={elementsUsed.map((e) => e.sym)}
            useElementColors={useElementColors}
            saltMode={saltMode}
            saltLang={saltLang}
            nameWidth={nameW}
            onUpdate={(transform) => updateSalt(group.id, salt.id, transform)}
            onRemove={() => onRemoveSalt(group.id, salt.id, salt.shortName || salt.name)} />

          )}
          </div>
          );
        })}

        {/* Footer — einheitliche Beschriftung in Grau */}
        <div className="border-t-2 border-neutral-700 bg-neutral-900/80 py-2">
          {/* Erreicht */}
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">Erreicht</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const v = totals[e.sym] || 0;
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW, height: TABLE_DIMS.rowH,
                    color: useElementColors ? e.color : '#fafafa', fontSize: TABLE_DIMS.valueFont,
                    fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', fontWeight: 600
                  }} className="flex items-center justify-center">
                    {v > 0 ? v.toFixed(1) : '·'}
                  </div>);

              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
          {/* Ziel — Werte in Element-Farben, editierbar */}
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">Ziel</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const t = recipe.targets?.[e.sym];
                return (
                  <ValueCell
                    key={e.sym}
                    value={t}
                    width={TABLE_DIMS.tileW}
                    color={useElementColors ? e.color : undefined}
                    onCommit={(v) => onTargetChange && onTargetChange(e.sym, v)}
                    emptyChar="–" />);


              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
          {/* % */}
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className="flex-shrink-0 text-[11px] uppercase tracking-wider text-neutral-300 font-semibold">%</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const t = recipe.targets?.[e.sym] || 0;
                const a = totals[e.sym] || 0;
                const pct = t > 0 ? a / t * 100 : null;
                const { bg, fg } = percentColors(pct);
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW - 2, height: TABLE_DIMS.rowH - 4,
                    background: bg, color: fg, margin: '2px 1px',
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600
                  }} className="flex items-center justify-center rounded">
                    {pct === null ? '–' : `${pct.toFixed(0)}%`}
                  </div>);

              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
        </div>
      </div>
    </div>);

}

Object.assign(window, {
  GroupBlock, FooterTotals, FullTableView, TABLE_DIMS,
  ValueCell, SaltNameCell, ElementHeaderTile, GroupHeaderRow,
  scaleSaltByMass, scaleSaltByContribution, scaleGroupByVolume,
  scaleGroupByFactor, scaleGroupByMlPerL
});