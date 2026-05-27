// ============================================================
// RECIPE TABLE — Portrait + Landscape, mit ausgerichteten Spalten
// ============================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ELEMENT_DEFS, ELEMENT_BY_SYM,
  getElColor, getNH4Color,
  getSaltDisplay, colorizeSaltDisplay,
  calculateTotals, elementsInGroup,
  computeContribution,
} from './data.js';
import { SortableItem, stopDrag } from './dnd.jsx';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Spaltenbreiten: 1 globaler Wert pro Spalte
export const TABLE_DIMS = {
  tileW: 44,
  tileH: 44,
  tileSym: 16,
  rowH: 30,
  valueFont: 13,
  nameW: { kuerzel: 64, formula: 90, name: 116 },
  massW: 60,
};

// ============================================================
// Skalierungs-Helfer
// ============================================================
export function scaleSaltByMass(salt, newMass) {
  if (newMass <= 0) return { ...salt, mass: newMass };

  // Blank salt (mass=0) with stored element percentages → compute contributions from scratch
  if (!(salt.mass > 0) && salt._pcts) {
    const factor = salt._groupFactor || 1;
    const volume = salt._groupVolume || 1;
    const isTopdress = salt._groupKind === 'topdress';
    const contributions = {};
    Object.entries(salt._pcts).forEach(([sym, pct]) => {
      contributions[sym] = isTopdress
        ? pct * newMass / 100
        : computeContribution(newMass, pct, factor, volume);
    });
    return { ...salt, mass: newMass, contributions };
  }

  // Normal proportional scaling
  if ((salt.mass || 0) <= 0) return { ...salt, mass: newMass };
  const ratio = newMass / salt.mass;
  const newContributions = {};
  Object.entries(salt.contributions || {}).forEach(([sym, val]) => {
    newContributions[sym] = val * ratio;
  });
  return { ...salt, mass: newMass, contributions: newContributions };
}

export function scaleSaltByContribution(salt, sym, newValue) {
  // Blank salt: back-calculate mass from entered ppm value
  if (!(salt.mass > 0) && salt._pcts && salt._pcts[sym]) {
    const pct = salt._pcts[sym];
    const factor = salt._groupFactor || 1;
    const volume = salt._groupVolume || 1;
    const isTopdress = salt._groupKind === 'topdress';
    const newMass = isTopdress
      ? (newValue * 100 / pct)
      : (newValue * factor * volume * 100 / (pct * 1000));
    if (newMass <= 0) return salt;
    return scaleSaltByMass(salt, newMass);
  }

  const oldValue = salt.contributions?.[sym] || 0;
  if (oldValue <= 0 || newValue <= 0) return salt;
  const factor = newValue / oldValue;
  const newContributions = {};
  Object.entries(salt.contributions || {}).forEach(([k, v]) => {
    newContributions[k] = k === sym ? newValue : v * factor;
  });
  return { ...salt, mass: (salt.mass || 0) * factor, contributions: newContributions };
}

export function scaleGroupByVolume(group, newVolume) {
  if (!group.volume || newVolume <= 0) return { ...group, volume: newVolume };
  const ratio = newVolume / group.volume;
  return {
    ...group,
    volume: newVolume,
    salts: group.salts.map((s) => {
      // Blank salt: update stored volume for future mass entry
      if (!(s.mass > 0) && s._pcts) return { ...s, _groupVolume: newVolume };
      return { ...s, mass: (s.mass || 0) * ratio };
    }),
  };
}

export function scaleGroupByFactor(group, newFactor) {
  if (!group.factor || newFactor <= 0) {
    return { ...group, factor: newFactor, mlPerL: 1000 / newFactor };
  }
  const ratio = newFactor / group.factor;
  return {
    ...group,
    factor: newFactor,
    mlPerL: 1000 / newFactor,
    salts: group.salts.map((s) => {
      // Blank salt: update stored factor for future mass entry
      if (!(s.mass > 0) && s._pcts) return { ...s, _groupFactor: newFactor };
      return { ...s, mass: (s.mass || 0) * ratio };
    }),
  };
}

export function scaleGroupByMlPerL(group, newMlPerL) {
  if (!group.mlPerL || newMlPerL <= 0) {
    return { ...group, mlPerL: newMlPerL, factor: 1000 / newMlPerL };
  }
  return scaleGroupByFactor(group, 1000 / newMlPerL);
}

// ============================================================
// VALUE CELL
// ============================================================
export function ValueCell({ value, unit, onCommit, color, width, decimals = 'auto', bold = false, font = TABLE_DIMS.valueFont, emptyChar = '·', disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Non-interactive placeholder for elements the salt can't contribute to
  if (disabled) {
    return (
      <div
        style={{
          width, height: TABLE_DIMS.rowH,
          color: '#272727',
          fontSize: font,
          fontFamily: 'JetBrains Mono, monospace',
          fontVariantNumeric: 'tabular-nums',
        }}
        className="flex items-center justify-center"
      >
        {emptyChar}
      </div>
    );
  }

  const formatValue = (v) => {
    if (v === null || v === undefined || v === 0) return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    // Show 2 decimals for values < 10 (every digit matters), 1 decimal otherwise
    return n < 10 ? n.toFixed(2) : n.toFixed(1);
  };

  const formatDraft = (v) => {
    if (v === null || v === undefined || v === 0) return '';
    const n = Number(v);
    // Cap at 2 decimal places in edit mode (avoid floating-point noise like 12.57832...)
    if (decimals === 'auto') return String(parseFloat(n.toFixed(2)));
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
          {...stopDrag}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="mono text-center bg-neutral-700 rounded outline-none ring-2 ring-emerald-500"
          style={{ width: width - 4, height: TABLE_DIMS.rowH - 4, fontSize: font, padding: '0 2px' }}
        />
      </div>
    );
  }

  const formatted = formatValue(value);
  const empty = formatted === null;

  return (
    <button
      {...stopDrag}
      onClick={() => { setDraft(formatDraft(value)); setEditing(true); }}
      style={{
        width, height: TABLE_DIMS.rowH,
        color: !empty && color ? color : empty ? '#888888' : '#fafafa',
        fontSize: font,
        fontFamily: 'JetBrains Mono, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: bold ? 600 : 500,
      }}
      className="flex items-center justify-center rounded hover:bg-neutral-700/40 transition-colors"
    >
      {empty ? emptyChar : (
        <>
          {formatted}
          {unit && !empty && <span className="opacity-60 ml-0.5" style={{ fontSize: font - 3 }}>{unit}</span>}
        </>
      )}
    </button>
  );
}

// ============================================================
// SALT NAME CELL — mit Marquee bei Long-Press
// ============================================================
export function SaltNameCell({ salt, mode, lang, useColor, overrideColors, width, onClickPick }) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [marquee, setMarquee] = useState(false);
  const longPressTimer = useRef(null);

  const display = getSaltDisplay(salt, mode, lang);
  const tokens = colorizeSaltDisplay(display, useColor, overrideColors);

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

  const handlePointerDown = () => { longPressTimer.current = setTimeout(startMarquee, 350); };
  const handlePointerUp = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

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
      title={salt.name || salt.nameEN}
    >
      <div
        ref={innerRef}
        className={`whitespace-nowrap font-medium ${marquee ? 'recipe-marquee-run' : ''}`}
        style={{ fontSize, fontFamily: isMono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif' }}
      >
        {tokens.map((tk, i) => (
          <span key={i} style={tk.color ? { color: tk.color } : undefined}>
            {tk.subscript ? <sub style={{ fontSize: '0.75em' }}>{tk.text}</sub> : tk.text}
          </span>
        ))}
      </div>
    </button>
  );
}

// ============================================================
// ELEMENT HEADER TILE
// ============================================================
export function ElementHeaderTile({ sym, width, onClick, useColor = true, overrideColors }) {
  const def = ELEMENT_BY_SYM[sym];
  if (!def) return null;
  const color = getElColor(sym, overrideColors);
  return (
    <button
      onClick={onClick}
      style={{
        width: width || TABLE_DIMS.tileW,
        height: TABLE_DIMS.tileH,
        background: useColor ? `linear-gradient(180deg, ${color}28 0%, ${color}14 100%)` : 'transparent',
        boxShadow: useColor ? `inset 0 0 0 1px ${color}55` : 'inset 0 0 0 1px #404040',
        color: useColor ? color : '#fafafa',
      }}
      className="flex items-center justify-center rounded transition-transform hover:scale-[1.04] active:scale-95"
      title={`${def.name} — Detail öffnen`}
    >
      <div className="font-bold leading-none" style={{ fontSize: TABLE_DIMS.tileSym }}>{def.sym}</div>
    </button>
  );
}

// ============================================================
// META PILL — editierbare Gruppen-Metadaten
// ============================================================
export function MetaPill({ prefix, suffix, value, onChange, placeholder = '–', decimals = 0 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft.replace(',', '.'));
    if (!isNaN(num) && num > 0) onChange(num);
    setEditing(false);
  };

  const displayValue = value !== null && value !== undefined
    ? decimals > 0 ? Number(value).toFixed(decimals).replace(/\.?0+$/, '') : Math.round(value)
    : placeholder;

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="mono bg-neutral-800 rounded px-1.5 py-0.5 outline-none ring-2 ring-emerald-500 text-[12px] w-14 text-right text-neutral-100"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value ? String(value) : ''); setEditing(true); }}
      className="mono hover:bg-neutral-800/60 rounded px-1.5 py-0.5 transition-colors text-[12px] text-neutral-300 whitespace-nowrap"
    >
      {prefix}{displayValue}{suffix && <span className="opacity-60 ml-0.5">{suffix}</span>}
    </button>
  );
}

// ============================================================
// GROUP HEADER ROW
// ============================================================
export function GroupHeaderRow({ group, themeColor, onUpdate, onDelete, onAddSalt, onOpenGroupDetail, selected, onToggleSelect, onConvertKind, onToggleFoliar, renameSignal, onRenameComplete, GroupActionsMenuComponent, isDark = true, dragHandle }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const kebabBtnRef = useRef(null);

  // Menü beim Scrollen schließen (Portal scrollt nicht mit)
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [menuOpen]);
  // Track last processed signal to prevent re-activation on remount
  const lastSignalRef = React.useRef(renameSignal);

  useEffect(() => { setNameDraft(group.name); }, [group.name]);

  useEffect(() => {
    if (renameSignal > lastSignalRef.current) {
      lastSignalRef.current = renameSignal;
      setEditingName(true);
    }
  }, [renameSignal]);

  const commitName = () => {
    onUpdate({ ...group, name: nameDraft });
    setEditingName(false);
    if (onRenameComplete) onRenameComplete(group.id);
  };

  const isStock = group.kind === 'stock';
  const isSolo = group.kind === 'solo';
  const kindLabel = group.kind === 'topdress' ? 'Topdress' : isSolo ? 'Endlösung' : null;

  const D = isDark;
  return (
    <div
      className={`relative flex items-center px-3 py-2 border-b ${D ? 'border-neutral-800' : 'border-neutral-200'}`}
      style={{ background: `linear-gradient(90deg, ${themeColor}15 0%, transparent 60%)` }}
    >
      {/* Drag handle (Gruppe verschieben) */}
      {dragHandle && (
        <div ref={dragHandle.setRef} {...dragHandle.props} title="Gruppe verschieben"
          className="flex-shrink-0 -ml-1 mr-1.5 cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 opacity-40 hover:opacity-100 transition-opacity touch-none">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/>
            <circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/>
            <circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/>
          </svg>
        </div>
      )}
      {/* Name + pills — flex-1 pushes controls to right */}
      <div className="flex-1 flex items-center gap-2.5 flex-wrap min-w-0">
        {editingName ? (
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            autoFocus
            placeholder="Name"
            className={`mono font-bold rounded px-2 py-0.5 outline-none ring-2 ring-emerald-500 w-28 text-center placeholder:text-sm placeholder:font-normal placeholder:text-neutral-500 placeholder:not-italic ${D ? 'bg-neutral-800' : 'bg-[#fffcf5] border border-neutral-300'}`}
            style={{ color: themeColor, fontSize: 20 }}
          />
        ) : (
          <button
            onClick={() => {
              if (!group.name) setEditingName(true);
              else onOpenGroupDetail && onOpenGroupDetail(group.id);
            }}
            className={`mono font-bold rounded px-1.5 py-0.5 ${D ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-100'}`}
            style={{ color: group.name ? themeColor : '#525252', fontSize: 20 }}
            title={group.name ? 'Gruppen-Details anzeigen' : 'Name eingeben'}
          >
            {group.name || <span className="italic font-normal text-neutral-500" style={{ fontSize: 14 }}>Name eingeben</span>}
          </button>
        )}

        {isStock ? (
          <div className="flex items-center gap-1.5">
            <MetaPill prefix="×" value={group.factor} onChange={(v) => onUpdate(scaleGroupByFactor(group, v))} />
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.mlPerL} suffix=" ml/L" onChange={(v) => onUpdate(scaleGroupByMlPerL(group, v))} decimals={2} />
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.volume} suffix=" L" onChange={(v) => onUpdate(scaleGroupByVolume(group, v))} decimals={1} />
          </div>
        ) : isSolo ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">Endlösung</span>
            <span className="text-neutral-700 text-xs">·</span>
            <MetaPill value={group.volume} suffix=" L" onChange={(v) => onUpdate(scaleGroupByVolume(group, v))} decimals={1} />
            {/* Foliar-Checkbox — passt in Schriftgröße zur MetaPill (text-[12px]),
                deutlich kleiner als die "Markieren"-Checkbox rechts im Header.
                Wenn aktiv: Gruppe wird in der Dosieranleitung zuletzt gemischt und
                fließt NICHT in die Wurzel-Nährlösungs-Bilanz / Zielerreichung ein. */}
            {onToggleFoliar && (
              <>
                <span className="text-neutral-700 text-xs">·</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFoliar(group.id); }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${D ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-100'}`}
                  title={group.foliar ? 'Foliar aktiv – wird zuletzt gemischt; zählt nicht zur Bilanz' : 'Als Foliar (Blattspray) markieren'}
                >
                  <span
                    className="flex items-center justify-center rounded-sm border transition-colors"
                    style={{
                      width: 12, height: 12,
                      borderColor: group.foliar ? themeColor : (D ? '#525252' : '#9ca3af'),
                      background: group.foliar ? themeColor : 'transparent',
                    }}
                  >
                    {group.foliar && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  <span
                    className="mono whitespace-nowrap"
                    style={{
                      fontSize: 12,
                      color: group.foliar ? themeColor : (D ? '#a3a3a3' : '#6b7280'),
                    }}
                  >
                    Foliar
                  </span>
                </button>
              </>
            )}
          </div>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">{kindLabel}</span>
        )}
      </div>

      {/* Controls — right-aligned */}
      <button
        onClick={(e) => { e.stopPropagation(); onAddSalt(); }}
        className="w-7 h-7 rounded flex items-center justify-center text-neutral-500 flex-shrink-0 transition-colors"
        title="Salz hinzufügen"
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; e.currentTarget.style.background = 'var(--sys-soft)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="relative flex-shrink-0" ref={kebabBtnRef}>
        <button
          onClick={(e) => {
            // Kein stopPropagation — damit document-Listener anderer offener Menüs feuern
            // und diese schließen, bevor das neue aufgeht.
            if (!menuOpen) {
              const rect = kebabBtnRef.current?.getBoundingClientRect();
              if (rect) setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
            }
            setMenuOpen(v => !v);
          }}
          className={`w-7 h-7 rounded flex items-center justify-center text-neutral-500 ${D ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {menuOpen && GroupActionsMenuComponent && menuPos && createPortal(
          <GroupActionsMenuComponent
            group={group}
            onClose={() => setMenuOpen(false)}
            onRename={() => setEditingName(true)}
            onDelete={onDelete}
            onAddSalt={onAddSalt}
            onConvertKind={onConvertKind}
            onToggleFoliar={onToggleFoliar}
            fixedPos={menuPos}
          />,
          document.body
        )}
      </div>

      {onToggleSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(group.id); }}
          className={`ml-1 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors border ${
            selected
              ? 'text-white'
              : (D ? 'bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/80 hover:border-neutral-500 text-neutral-600' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 text-neutral-500')
          }`}
          style={selected ? { background: 'var(--sys-accent)', borderColor: 'var(--sys-hover)' } : {}}
          title={selected ? 'Gruppe abwählen' : 'Gruppe auswählen'}
        >
          {selected ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : null}
        </button>
      )}
    </div>
  );
}

// ============================================================
// SALT ROW
// ============================================================
export function SaltRow({ salt, elements, useElementColors, elementColors, saltMode, saltLang, nameWidth, onUpdate, onRemove, saltOwnElements, sortableId, isDark = true, isFlashing = false }) {
  const ownEls = saltOwnElements || null;
  const rowClass = `flex items-center px-3 group ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100/70'}${isFlashing ? ' salt-row-flash' : ''}`;
  const inner = (
    <>
      {/* Drag handle — nur bei ziehbaren Zeilen (sonst kein Spaltenversatz) */}
      {sortableId != null && (
        <div className={`flex-shrink-0 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-100 transition-opacity mr-1 ${isDark ? 'text-neutral-700' : 'text-neutral-400'}`}
          title="Ziehen zum Sortieren" style={{ width: 8 }}>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
            <circle cx="2" cy="2"  r="1"/><circle cx="6" cy="2"  r="1"/>
            <circle cx="2" cy="6"  r="1"/><circle cx="6" cy="6"  r="1"/>
            <circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/>
          </svg>
        </div>
      )}
      <div className="flex-shrink-0" style={{ marginRight: 4 }} {...stopDrag}>
        <SaltNameCell
          salt={salt}
          mode={saltMode}
          lang={saltLang}
          useColor={useElementColors}
          overrideColors={elementColors}
          width={nameWidth}
          onClickPick={() => {}}
        />
      </div>
      <div className="flex flex-1 justify-start gap-px">
        {elements.map((sym) => {
          const v = salt.contributions?.[sym];
          const color = useElementColors ? getElColor(sym, elementColors) : undefined;
          const isOwn = !ownEls || ownEls.has(sym);
          return (
            <ValueCell
              key={sym}
              value={v}
              width={TABLE_DIMS.tileW}
              onCommit={(newVal) => onUpdate((s) => scaleSaltByContribution(s, sym, newVal))}
              color={color}
              emptyChar="–"
              disabled={!isOwn}
            />
          );
        })}
      </div>
      <div className="flex-shrink-0" style={{ marginLeft: 4 }}>
        <ValueCell
          value={salt.mass}
          unit={salt.massUnit || 'g'}
          width={TABLE_DIMS.massW}
          decimals={2}
          onCommit={(newMass) => onUpdate((s) => scaleSaltByMass(s, newMass))}
          bold
          emptyChar="–"
        />
      </div>
      <button
        onClick={onRemove}
        {...stopDrag}
        className={`ml-1 w-6 h-6 rounded hover:text-rose-400 hover:bg-rose-950/30 opacity-30 group-hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0 ${isDark ? 'text-neutral-700' : 'text-neutral-400'}`}
        title="Salz entfernen"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );

  if (sortableId != null) {
    return <SortableItem id={sortableId} className={rowClass}>{inner}</SortableItem>;
  }
  return <div className={rowClass}>{inner}</div>;
}

// ============================================================
// GROUP BLOCK
// ============================================================
export function GroupBlock({ group, recipe, themeColor, useElementColors, elementColors, saltMode, saltLang, onUpdateGroup, onDeleteGroup, onAddSalt, onOpenElement, onRemoveSalt, onOpenGroupDetail, selected, onToggleSelect, onConvertKind, onToggleFoliar, renameSignal, onRenameComplete, GroupActionsMenuComponent, isDark = true, groupDnd, flashSaltIds }) {
  const elements = useMemo(() => elementsInGroup(group), [group]);
  const nameWidth = TABLE_DIMS.nameW[saltMode] || TABLE_DIMS.nameW.kuerzel;

  const updateSalt = (saltId, transform) => {
    const newSalts = group.salts.map((s) => s.id === saltId ? transform(s) : s);
    onUpdateGroup({ ...group, salts: newSalts });
  };

  const D = isDark;
  const selectedStyle = selected
    ? { borderColor: 'var(--sys-accent)', boxShadow: '0 0 0 1px var(--sys-soft)' }
    : { borderColor: D ? '#404040' : '#e5e7eb' };
  return (
    <div
      id={`group-${group.id}`}
      ref={groupDnd?.setNodeRef}
      className={`rounded-xl border overflow-hidden transition-colors ${D ? 'bg-neutral-800' : 'bg-white'}`}
      style={{ ...(groupDnd?.style || {}), ...selectedStyle }}
    >
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
        onToggleFoliar={onToggleFoliar}
        renameSignal={renameSignal}
        onRenameComplete={onRenameComplete}
        GroupActionsMenuComponent={GroupActionsMenuComponent}
        isDark={D}
        dragHandle={groupDnd?.headerHandle}
      />

      {elements.length > 0 && (
        <div className="overflow-x-auto recipe-scroll">
          <div className={`flex items-center px-3 py-2 min-w-min ${D ? 'bg-neutral-900/40' : 'bg-neutral-50'}`}>
            {/* Platzhalter für den Ziehgriff der Salzzeilen (Spalten-Ausrichtung) */}
            <div className="flex-shrink-0 mr-1" style={{ width: 8 }} />
            <div style={{ width: nameWidth, marginRight: 4 }} className="flex-shrink-0 text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
              SALZ
            </div>
            <div className="flex flex-1 justify-start gap-px">
              {elements.map((sym) => (
                <ElementHeaderTile
                  key={sym}
                  sym={sym}
                  width={TABLE_DIMS.tileW}
                  useColor={useElementColors}
                  overrideColors={elementColors}
                  onClick={() => onOpenElement(sym)}
                />
              ))}
            </div>
            <div style={{ width: TABLE_DIMS.massW, marginLeft: 4 }} className="flex-shrink-0" />
            <div style={{ width: 24, marginLeft: 4 }} className="flex-shrink-0" />
          </div>

          <SortableContext items={group.salts.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className={`divide-y ${D ? 'divide-neutral-800/60' : 'divide-neutral-200/80'}`}>
            {group.salts.map((salt) => {
              const saltOwnElements = new Set([
                ...Object.keys(salt._pcts || {}),
                ...Object.entries(salt.contributions || {}).filter(([, v]) => (v || 0) > 0).map(([k]) => k),
              ]);
              return (
                <SaltRow
                  key={salt.id}
                  sortableId={salt.id}
                  salt={salt}
                  elements={elements}
                  useElementColors={useElementColors}
                  elementColors={elementColors}
                  saltMode={saltMode}
                  saltLang={saltLang}
                  nameWidth={nameWidth}
                  onUpdate={(transform) => updateSalt(salt.id, transform)}
                  onRemove={() => onRemoveSalt(group.id, salt.id, salt.shortName || salt.name)}
                  saltOwnElements={saltOwnElements}
                  isDark={D}
                  isFlashing={flashSaltIds?.has(salt.id)}
                />
              );
            })}
          </div>
          </SortableContext>
        </div>
      )}

      <button
        onClick={() => onAddSalt(group.id)}
        className={`w-full text-center text-xs text-neutral-500 py-2 transition-colors flex items-center justify-center gap-1.5 border-t ${D ? 'border-neutral-800/60' : 'border-neutral-200/60'}`}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; e.currentTarget.style.background = D ? 'rgba(0,0,0,0.2)' : '#f9fafb'; }}
        onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Salz hinzufügen
      </button>
    </div>
  );
}

// ============================================================
// FOOTER — Gesamtbilanz
// ============================================================
function percentColors(pct) {
  if (pct === null) return { bg: 'transparent', fg: '#525252' };
  if (pct >= 95 && pct <= 105) return { bg: '#10b98133', fg: '#34d399' };
  if (pct >= 90 && pct <= 110) return { bg: '#facc1533', fg: '#facc15' };
  if (pct >= 85 && pct <= 115) return { bg: '#fb923c33', fg: '#fb923c' };
  return { bg: '#ef444433', fg: '#ef4444' };
}

export function FooterTotals({ recipe, useElementColors, elementColors, onOpenElement, onTargetChange, isDark = true }) {
  const totals = useMemo(() => calculateTotals(recipe), [recipe]);
  const targets = recipe.targets || {};
  const elementsToShow = ELEMENT_DEFS.filter((e) => (totals[e.sym] || 0) > 0 || (targets[e.sym] || 0) > 0);
  const labelW = 68;
  const D = isDark;

  return (
    <div className={`rounded-xl border overflow-hidden ${D ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between ${D ? 'border-neutral-700' : 'border-neutral-200'}`} style={{ background: 'linear-gradient(90deg, var(--sys-soft, rgba(16,185,129,0.15)) 0%, transparent 60%)' }}>
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sys-accent, #10b981)' }}>Gesamtbilanz</div>
        <div className="text-[10px] text-neutral-500">{elementsToShow.length} Elemente · {recipe.groups.reduce((s, g) => s + g.salts.length, 0)} Salze</div>
      </div>

      <div className="overflow-x-auto recipe-scroll">
        <div className="min-w-min" style={{ width: 'max-content' }}>
          <div className={`flex items-center px-3 py-2 ${D ? 'bg-neutral-900/60' : 'bg-neutral-50'}`}>
            <div style={{ width: labelW, marginRight: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Element</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => (
                <ElementHeaderTile key={e.sym} sym={e.sym} width={TABLE_DIMS.tileW} useColor={useElementColors} overrideColors={elementColors} onClick={() => onOpenElement(e.sym)} />
              ))}
            </div>
          </div>

          <div className={`flex items-center px-3 py-1 ${D ? 'bg-neutral-900/30' : 'bg-white'}`}>
            <div style={{ width: labelW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>Erreicht</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const val = totals[e.sym] || 0;
                const color = useElementColors ? getElColor(e.sym, elementColors) : (D ? '#fafafa' : '#1a1a1a');
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW, height: TABLE_DIMS.rowH,
                    color, fontSize: TABLE_DIMS.valueFont, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  }} className="flex items-center justify-center">
                    {val > 0 ? (val < 10 ? val.toFixed(2) : val.toFixed(1)) : '·'}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`flex items-center px-3 py-1 ${D ? 'bg-neutral-900/20' : 'bg-neutral-50/60'}`}>
            <div style={{ width: labelW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>Ziel</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const t = targets[e.sym];
                return (
                  <ValueCell
                    key={e.sym}
                    value={t}
                    width={TABLE_DIMS.tileW}
                    color={useElementColors ? getElColor(e.sym, elementColors) : undefined}
                    onCommit={(v) => onTargetChange && onTargetChange(e.sym, v)}
                    emptyChar="–"
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center px-3 py-1.5">
            <div style={{ width: labelW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>%</div>
            <div className="flex gap-px">
              {elementsToShow.map((e) => {
                const t = targets[e.sym] || 0;
                const a = totals[e.sym] || 0;
                const pct = t > 0 ? (a / t) * 100 : null;
                const { bg, fg } = percentColors(pct);
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW - 2, height: TABLE_DIMS.rowH - 4,
                    background: bg, color: fg, margin: '2px 1px',
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  }} className="flex items-center justify-center rounded">
                    {pct === null ? '–' : `${pct.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FULL TABLE VIEW
// ============================================================
export function FullTableView({ recipe, themeColor, useElementColors, elementColors, saltMode, saltLang, onUpdateRecipe, onOpenElement, onRemoveSalt, onAddSalt, onDeleteGroup, onTargetChange, onOpenGroupDetail, selectedGroupIds, onToggleSelect, onConvertKind, onToggleFoliar, renameSignals, onRenameComplete, GroupActionsMenuComponent, isDark = true, userZoom = 1 }) {
  const totals = useMemo(() => calculateTotals(recipe), [recipe]);
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [tableScale, setTableScale] = useState(1);
  const [tableHeight, setTableHeight] = useState(null);

  const elementsUsed = useMemo(() => {
    return ELEMENT_DEFS.filter((e) => (totals[e.sym] || 0) > 0 || (recipe.targets?.[e.sym] || 0) > 0);
  }, [totals, recipe.targets]);

  // Übersichtsmodus: userZoom < 1 → Auto-Fit auf Containerbreite (fit-to-screen).
  //   Der Tabelleninhalt wird genau so weit skaliert, dass linke und rechte
  //   Kante bündig am Container-Rand stehen — keine zusätzliche Skalierung
  //   mit `userZoom`, der hier nur als Toggle-Flag dient.
  // Standardmodus (userZoom = 1): KEIN Auto-Fit; Tabelle behält Originalgröße
  //   und scrollt horizontal, wenn sie breiter als der Container ist.
  const overviewMode = userZoom < 1;
  useEffect(() => {
    if (!overviewMode) {
      setTableScale(1);
      setTableHeight(null);
      return;
    }
    const measure = () => {
      if (!containerRef.current || !innerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const iw = innerRef.current.scrollWidth; // natural (unscaled) width
      const ih = innerRef.current.scrollHeight; // natural (unscaled) height
      // Fit-to-screen-width: skaliere so, dass die Tabelle EXAKT die
      // Containerbreite füllt. Wenn die Tabelle bereits in den Container
      // passt (iw <= cw), bleibt sie unskaliert.
      const finalScale = (cw > 0 && iw > cw + 2) ? cw / iw : 1;
      if (finalScale < 1) {
        setTableScale(finalScale);
        setTableHeight(Math.ceil(ih * finalScale));
      } else {
        setTableScale(1);
        setTableHeight(null);
      }
    };
    requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recipe, saltMode, userZoom, overviewMode]);

  const updateGroup = (groupId, updater) => {
    onUpdateRecipe({
      ...recipe,
      groups: recipe.groups.map((g) => g.id === groupId ? updater(g) : g),
    });
  };

  const updateSalt = (groupId, saltId, transform) => {
    updateGroup(groupId, (g) => ({
      ...g,
      salts: g.salts.map((s) => s.id === saltId ? transform(s) : s),
    }));
  };

  const nameW = TABLE_DIMS.nameW[saltMode] || TABLE_DIMS.nameW.kuerzel;
  const massW = TABLE_DIMS.massW;
  const D = isDark;

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border ${D ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} recipe-scroll`}
      style={{
        // Standardmodus (userZoom = 1): horizontal scrollbar, Originalgröße.
        // Übersichtsmodus: hidden, Inhalt wird via transform: scale() eingepasst.
        overflow: overviewMode ? 'hidden' : 'auto',
        height: tableHeight !== null ? tableHeight : undefined,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: 'max-content',
          transformOrigin: 'top left',
          transform: tableScale < 1 ? `scale(${tableScale})` : undefined,
          willChange: tableScale < 1 ? 'transform' : undefined,
        }}
      >
        <div className={`sticky top-0 z-10 border-b ${D ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
          <div className="flex items-center px-3 py-2">
            <div style={{ width: nameW, marginRight: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Salz</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => (
                <ElementHeaderTile key={e.sym} sym={e.sym} width={TABLE_DIMS.tileW} useColor={useElementColors} overrideColors={elementColors} onClick={() => onOpenElement(e.sym)} />
              ))}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} className="flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500 text-center font-semibold">Menge</div>
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
        </div>

        {recipe.groups.map((group) => {
          const isSel = selectedGroupIds && selectedGroupIds.has(group.id);
          return (
            <div key={group.id} className={`border-b ${D ? 'border-neutral-800' : 'border-neutral-200'} ${isSel ? 'bg-emerald-950/10' : ''}`}>
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
                onToggleFoliar={onToggleFoliar}
                renameSignal={renameSignals ? renameSignals[group.id] || 0 : 0}
                onRenameComplete={onRenameComplete}
                GroupActionsMenuComponent={GroupActionsMenuComponent}
                isDark={D}
              />
              {group.salts.map((salt) => {
                const saltOwnElements = new Set([
                  ...Object.keys(salt._pcts || {}),
                  ...Object.entries(salt.contributions || {}).filter(([, v]) => (v || 0) > 0).map(([k]) => k),
                ]);
                return (
                  <SaltRow
                    key={salt.id}
                    salt={salt}
                    elements={elementsUsed.map((e) => e.sym)}
                    useElementColors={useElementColors}
                    elementColors={elementColors}
                    saltMode={saltMode}
                    saltLang={saltLang}
                    nameWidth={nameW}
                    onUpdate={(transform) => updateSalt(group.id, salt.id, transform)}
                    onRemove={() => onRemoveSalt(group.id, salt.id, salt.shortName || salt.name)}
                    saltOwnElements={saltOwnElements}
                    isDark={D}
                  />
                );
              })}
            </div>
          );
        })}

        <div className={`border-t-2 py-2 ${D ? 'border-neutral-700 bg-neutral-900/80' : 'border-neutral-300 bg-neutral-50'}`}>
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>Erreicht</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const v = totals[e.sym] || 0;
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW, height: TABLE_DIMS.rowH,
                    color: useElementColors ? getElColor(e.sym, elementColors) : (D ? '#fafafa' : '#1a1a1a'),
                    fontSize: TABLE_DIMS.valueFont,
                    fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  }} className="flex items-center justify-center">
                    {v > 0 ? (v < 10 ? v.toFixed(2) : v.toFixed(1)) : '·'}
                  </div>
                );
              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>Ziel</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const t = recipe.targets?.[e.sym];
                return (
                  <ValueCell
                    key={e.sym}
                    value={t}
                    width={TABLE_DIMS.tileW}
                    color={useElementColors ? getElColor(e.sym, elementColors) : undefined}
                    onCommit={(v) => onTargetChange && onTargetChange(e.sym, v)}
                    emptyChar="–"
                  />
                );
              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
          <div className="flex items-center px-3 py-1">
            <div style={{ width: nameW, marginRight: 4 }} className={`flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold ${D ? 'text-neutral-300' : 'text-neutral-600'}`}>%</div>
            <div className="flex gap-px">
              {elementsUsed.map((e) => {
                const t = recipe.targets?.[e.sym] || 0;
                const a = totals[e.sym] || 0;
                const pct = t > 0 ? (a / t) * 100 : null;
                const { bg, fg } = percentColors(pct);
                return (
                  <div key={e.sym} style={{
                    width: TABLE_DIMS.tileW - 2, height: TABLE_DIMS.rowH - 4,
                    background: bg, color: fg, margin: '2px 1px',
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                  }} className="flex items-center justify-center rounded">
                    {pct === null ? '–' : `${pct.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>
            <div style={{ width: massW, marginLeft: 4 }} />
            <div style={{ width: 24, marginLeft: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

