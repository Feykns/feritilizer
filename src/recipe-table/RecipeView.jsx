// ============================================================
// RECIPE VIEW — Integration into app as "Rezept" tab
// Props: recipe, setRecipe, library, setLibrary,
//        availableSalts (from buildAvailableSalts(DEFAULT_SALTS)),
//        useElementColors, elementColors, lang
// ============================================================

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FlaskConical } from 'lucide-react';
import {
  SAMPLE_RECIPE, THEME_COLOR_PALETTE,
  computeContribution,
  ELEMENT_DEFS,
  getElColor, getNH4Color,
  getSaltDisplay,
  recomputeSaltForGroup,
  isSaltSoluble,
  elementsInGroup,
} from './data.js';
import {
  GroupBlock, FooterTotals, FullTableView,
  ElementHeaderTile, TABLE_DIMS, SaltNameCell, SaltRow,
} from './RecipeTable.jsx';
import {
  ElementDetailPopover, GroupDetailPopover, AnalysisPopover,
  SaltPickerPopover, GroupActionsMenu, Toast,
} from './Popovers.jsx';
import { DosingGuide, buildDosingGuidePrint } from './DosingGuide.jsx';
import { SortableList, SortableItem, stopDrag, useReorderSensors } from './dnd.jsx';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Capacitor } from '@capacitor/core';
import { Printer } from '@capgo/capacitor-printer';

const SALT_LANG_KEY = 'hydro:salt-lang';

const isSaltDndId = (id) => typeof id === 'string' && id.includes('::');

// Wraps GroupBlock so a whole group can be reordered (drag via the header handle),
// while its salts live in the shared DndContext (cross-group moves possible).
function SortableGroupBlock({ group, ...rest }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 30 : 'auto',
  };
  const groupDnd = {
    setNodeRef,
    style,
    headerHandle: { setRef: setActivatorNodeRef, props: { ...attributes, ...listeners } },
  };
  return <GroupBlock group={group} {...rest} groupDnd={groupDnd} />;
}

// ============================================================
// COLOR PICKER POPOVER
// ============================================================
function ColorPickerPopover({ current, onPick, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (!e.target.closest('[data-color-picker]')) onClose(); };
    const tid = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(tid); document.removeEventListener('mousedown', handle); };
  }, [onClose]);

  return (
    <div data-color-picker
      className="absolute top-full right-0 mt-2 z-40 bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl p-2 grid grid-cols-4 gap-1.5"
    >
      {THEME_COLOR_PALETTE.map(c => (
        <button
          key={c}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(c)}
          className="w-9 h-9 rounded-lg hover:scale-110 transition-transform flex items-center justify-center"
          style={{ background: c, boxShadow: current === c ? '0 0 0 2px white' : 'none' }}
        >
          {current === c && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// RECIPE STATS BAR
// ============================================================
function StatTile({ label, value, unit, sub, accent, style, isDark = true }) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${isDark ? 'bg-neutral-900/60' : 'bg-white'}`} style={style}>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</div>
      <div className="mono text-lg font-semibold leading-tight" style={{ color: accent || (isDark ? '#fafafa' : '#111') }}>
        {value}
        {unit && <span className="text-xs font-normal text-neutral-500 ml-0.5">{unit}</span>}
      </div>
      {sub && <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function RecipeStatsBar({ recipe, selectedGroupIds, onClearSelection, onCreateCombo, themeColor, isDark = true }) {
  const hasSel = selectedGroupIds && selectedGroupIds.size > 0;
  const groups = hasSel
    ? recipe.groups.filter(g => selectedGroupIds.has(g.id))
    : recipe.groups;

  let totalG = 0, totalMl = 0;
  let nh4 = 0, nTotal = 0;
  let nSalts = 0;
  groups.forEach(g => {
    nSalts += g.salts.length;
    g.salts.forEach(s => {
      const m = s.mass || 0;
      if (s.massUnit === 'ml') totalMl += m; else totalG += m;
      const n = s.contributions?.N || 0;
      nTotal += n;
      nh4 += n * (s.nh4Fraction || 0);
    });
  });
  const nh4Pct = nTotal > 0 ? (nh4 / nTotal) * 100 : null;

  const selStyle = hasSel
    ? { borderColor: `${themeColor}66`, boxShadow: `inset 0 0 0 1px ${themeColor}33` }
    : { borderColor: isDark ? '#262626' : '#e5e7eb' };

  return (
    <div className="mb-3">
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="NH₄-Anteil"
          value={nh4Pct === null ? '–' : `${nh4Pct.toFixed(1)}`}
          unit={nh4Pct === null ? '' : '%'}
          sub={nTotal > 0 ? `${nh4.toFixed(1)} / ${nTotal.toFixed(1)} ppm N` : 'kein N'}
          accent={nh4Pct === null ? null : '#9CCC65'}
          style={selStyle}
          isDark={isDark}
        />
        <StatTile
          label="Salzmenge"
          value={
            <span>
              {totalG > 0 ? `${totalG.toFixed(0)}` : '0'}
              <span className="text-xs font-normal text-neutral-500 ml-0.5">g</span>
              {totalMl > 0 && (
                <>
                  <span className="text-neutral-600 mx-1">+</span>
                  {totalMl.toFixed(0)}
                  <span className="text-xs font-normal text-neutral-500 ml-0.5">ml</span>
                </>
              )}
            </span>
          }
          unit=""
          sub={totalMl > 0 ? 'trocken + flüssig' : 'gesamt'}
          style={selStyle}
          isDark={isDark}
        />
        <StatTile
          label="Gruppen"
          value={groups.length}
          unit=""
          sub={`${nSalts} Salze`}
          style={selStyle}
          isDark={isDark}
        />
      </div>
      {hasSel && (
        <div className="mt-1.5 flex items-center justify-between px-1">
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: themeColor }}>
            Auswahl · {selectedGroupIds.size} Gruppe{selectedGroupIds.size === 1 ? '' : 'n'}
          </div>
          <div className="flex items-center gap-3">
            {onCreateCombo && (
              <button onClick={onCreateCombo} className="text-[10px] underline font-medium" style={{ color: themeColor }}>
                Kombination erzeugen
              </button>
            )}
            <button onClick={onClearSelection} className="text-[10px] text-neutral-400 hover:text-emerald-400 underline">
              Auswahl aufheben
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MEASURED VALUES
// ============================================================
function PhCell({ label, value, editing, onClick, inputRef, draft, setDraft, commit, isDark = true }) {
  return (
    <div
      className="flex-1 px-3 py-2 flex items-center justify-between gap-2"
      onClick={!editing ? onClick : undefined}
    >
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex-shrink-0">{label}</div>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') commit(); }}
          placeholder="5.6 – 6.2"
          className={`mono w-24 text-right text-base font-semibold rounded px-1 outline-none ring-2 ring-emerald-500 placeholder:text-neutral-500 placeholder:text-xs placeholder:font-normal ${isDark ? 'bg-neutral-800 placeholder:text-neutral-700' : 'bg-[#fffcf5] border border-neutral-300 text-neutral-900'}`}
        />
      ) : (
        <button
          onClick={onClick}
          className={`mono w-24 text-right text-base font-semibold rounded px-1 flex-shrink-0 ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100'}`}
        >
          {value != null ? Number(value).toFixed(1) : <span className={isDark ? 'text-neutral-700 text-xs' : 'text-neutral-400 text-xs'}>tap</span>}
        </button>
      )}
    </div>
  );
}

function PhAdjustCell({ adjust = {}, onChange, isDark = true }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const startEdit = (field) => { setDraft((field === 'name' ? adjust.name : adjust.value) || ''); setEditing(field); };
  const commit = () => {
    if (editing === 'name') onChange({ ...adjust, name: draft });
    else if (editing === 'value') onChange({ ...adjust, value: draft });
    setEditing(null);
  };

  const fieldCls = isDark
    ? 'bg-neutral-800 placeholder:text-neutral-700'
    : 'bg-[#fffcf5] border border-neutral-300 text-neutral-900 placeholder:text-neutral-400';
  const hoverCls = isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100';
  const emptySpan = <span className={isDark ? 'text-neutral-700 text-xs' : 'text-neutral-400 text-xs'}>tap</span>;

  return (
    <div className="flex-1 px-3 py-2 flex items-center gap-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex-shrink-0">pH − / +</div>
      {editing === 'name' ? (
        <input ref={inputRef} type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }}
          placeholder="Produkt" className={`mono flex-1 min-w-0 text-base font-semibold rounded px-1 outline-none ring-2 ring-emerald-500 placeholder:text-xs placeholder:font-normal ${fieldCls}`} />
      ) : (
        <button onClick={() => startEdit('name')}
          className={`mono flex-1 min-w-0 text-left text-base font-semibold rounded px-1 truncate ${hoverCls}`}>
          {adjust.name || emptySpan}
        </button>
      )}
      {editing === 'value' ? (
        <input ref={inputRef} type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }}
          placeholder="z.B. 10 ml" className={`mono w-24 text-right text-base font-semibold rounded px-1 outline-none ring-2 ring-emerald-500 placeholder:text-xs placeholder:font-normal ${fieldCls}`} />
      ) : (
        <button onClick={() => startEdit('value')}
          className={`mono w-24 text-right text-base font-semibold rounded px-1 flex-shrink-0 ${hoverCls}`}>
          {adjust.value || emptySpan}
        </button>
      )}
    </div>
  );
}

const MeasuredValues = forwardRef(function MeasuredValues({ recipe, onUpdate, ecValues = [], onAddEc, onUpdateEc, onRemoveEc, onReorderEc, selectedGroupIds, groups, isDark = true }, ref) {
  const measured = recipe.measured || {};

  // Unified panel state (replaces separate add + inline-edit states)
  const [panelMode, setPanelMode] = useState(null); // null | 'add' | 'edit'
  const [panelName, setPanelName] = useState('');
  const [panelValue, setPanelValue] = useState('');
  const [panelGroupIds, setPanelGroupIds] = useState([]);
  const [panelEditId, setPanelEditId] = useState(null);
  const [phEditing, setPhEditing] = useState(null);
  const [phDraft, setPhDraft] = useState('');
  const phInputRef = useRef(null);
  const panelNameRef = useRef(null);
  const panelValueRef = useRef(null);

  useEffect(() => {
    if (panelMode && panelNameRef.current) {
      panelNameRef.current.focus();
    }
  }, [panelMode, panelEditId]);
  useEffect(() => { if (phEditing && phInputRef.current) { phInputRef.current.focus(); phInputRef.current.select(); } }, [phEditing]);

  const groupNamesFromIds = (ids) => (groups || []).filter(g => ids.includes(g.id)).map(g => g.name || '?').join(' + ');

  const openAddPanel = (initialGroupIds) => {
    setPanelGroupIds(initialGroupIds || []);
    setPanelName('');
    setPanelValue('');
    setPanelEditId(null);
    setPanelMode('add');
  };

  const openEditPanel = (ec) => {
    setPanelGroupIds(ec.groupIds || []);
    setPanelName(ec.name || '');
    setPanelValue(String(ec.value ?? ''));
    setPanelEditId(ec.id);
    setPanelMode('edit');
  };

  const closePanel = () => { setPanelMode(null); setPanelEditId(null); };

  const togglePanelGroup = (id) => setPanelGroupIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const submitPanel = () => {
    const num = parseFloat(String(panelValue).replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      if (panelValueRef.current) { panelValueRef.current.focus(); panelValueRef.current.select(); }
      return;
    }
    if (panelMode === 'add') {
      onAddEc && onAddEc(panelName.trim() || 'EC', num, panelGroupIds);
    } else if (panelMode === 'edit' && panelEditId) {
      onUpdateEc && onUpdateEc(panelEditId, { name: panelName.trim() || 'EC', value: num, groupIds: panelGroupIds });
    }
    closePanel();
  };

  const commitPh = () => {
    const num = parseFloat(phDraft.replace(',', '.'));
    if (!isNaN(num) && num >= 0) onUpdate({ ...measured, [phEditing]: num });
    else if (phDraft === '') onUpdate({ ...measured, [phEditing]: null });
    setPhEditing(null);
  };

  // Expose openAdd via ref
  useImperativeHandle(ref, () => ({
    openAdd: (groupIds) => openAddPanel(groupIds),
  }));

  const D = isDark;
  const fld = D ? 'bg-neutral-800' : 'bg-[#fffcf5] border border-neutral-300 text-neutral-900';
  const rowHov = D ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100/60';
  const rowBdr = D ? 'border-neutral-800/40' : 'border-neutral-200/70';
  const divBdr = D ? 'divide-neutral-800' : 'divide-neutral-200';
  const cardBg = D ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const hdBg = D ? 'from-neutral-800/40 to-transparent border-neutral-800' : 'from-neutral-100 to-transparent border-neutral-200';

  return (
    <div className={`mt-4 rounded-xl border overflow-hidden ${cardBg}`}>
      <div className={`px-3 py-2 bg-gradient-to-r ${hdBg} border-b flex items-center justify-between`}>
        <div className={`text-[11px] font-semibold uppercase tracking-wider ${D ? 'text-neutral-300' : 'text-neutral-700'}`}>Messwerte</div>
        <div className="text-[10px] text-neutral-500">EC · pH</div>
      </div>
      <div className={`grid grid-cols-2 divide-x ${divBdr}`}>
        <div className="flex flex-col min-h-[110px]">
          <div className="px-3 py-1.5 flex items-center justify-between gap-1">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 leading-tight">
              EC-Werte<span className={`normal-case font-normal tracking-normal text-[9px] ml-1 ${D ? 'text-neutral-700' : 'text-neutral-400'}`}>mS/cm</span>
              <span className={`block normal-case font-normal tracking-normal text-[9px] opacity-60 ${D ? 'text-neutral-700' : 'text-neutral-400'}`}>
                (Kombinationen)
              </span>
            </div>
            <button
              onClick={() => !panelMode && openAddPanel(selectedGroupIds ? [...selectedGroupIds] : [])}
              disabled={!!panelMode}
              className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center transition-colors ${!panelMode ? '' : (D ? 'text-neutral-700' : 'text-neutral-300') + ' cursor-not-allowed'}`}
              style={!panelMode ? { color: 'var(--sys-accent)' } : {}}
              onMouseEnter={!panelMode ? e => { e.currentTarget.style.background = 'var(--sys-soft)'; } : undefined}
              onMouseLeave={!panelMode ? e => { e.currentTarget.style.background = ''; } : undefined}
              title="EC-Wert hinzufügen"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col">
            {ecValues.length === 0 && !panelMode && (
              <div className={`flex-1 flex items-center justify-center px-3 py-3 text-[11px] italic text-center ${D ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Tippe + um EC-Wert hinzuzufügen
              </div>
            )}
            <SortableList ids={ecValues.map(e => e.id)} onReorder={(ids) => onReorderEc && onReorderEc(ids)}>
            {ecValues.map(ec => {
              const names = groupNamesFromIds(ec.groupIds || []);
              const isActiveEdit = panelMode === 'edit' && panelEditId === ec.id;
              return (
                <SortableItem key={ec.id} id={ec.id}
                  className={`px-3 py-1.5 flex items-center gap-1.5 border-b last:border-b-0 group cursor-pointer ${rowBdr} ${rowHov} ${isActiveEdit ? (D ? 'bg-neutral-800/40' : 'bg-neutral-100/80') : ''}`}
                  onClick={() => !isActiveEdit && openEditPanel(ec)}
                >
                  {/* Drag handle */}
                  <div className={`cursor-grab active:cursor-grabbing flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity ${D ? 'text-neutral-700 hover:text-neutral-500' : 'text-neutral-400 hover:text-neutral-600'}`}
                    title="Ziehen zum Sortieren" onClick={e => e.stopPropagation()}>
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                      <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
                      <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                      <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap" {...stopDrag}>
                    <span className={`text-[12px] truncate max-w-[110px] ${D ? 'text-neutral-200' : 'text-neutral-800'}`}>{ec.name}</span>
                    {names && <span className="text-[9px] mono text-neutral-500 truncate">({names})</span>}
                  </div>
                  <span {...stopDrag} className="mono text-[12px] font-semibold flex-shrink-0" style={{ color: 'var(--sys-accent)' }}>
                    {ec.value != null ? Number(ec.value).toFixed(1) : '–'}
                  </span>
                  <button {...stopDrag} onClick={e => { e.stopPropagation(); onRemoveEc(ec.id); }}
                    className={`w-5 h-5 rounded hover:text-rose-400 hover:bg-rose-950/30 opacity-50 hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0 ${D ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </SortableItem>
              );
            })}
            </SortableList>

            {/* Unified add / edit panel */}
            {panelMode && (
              <div className={`px-3 py-2.5 border-t ${rowBdr} ${D ? 'bg-neutral-800/30' : 'bg-neutral-50'}`}>
                <div className="text-[9px] uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--sys-accent)' }}>
                  {panelMode === 'edit' ? 'Kombination bearbeiten' : 'Neue Kombination'}
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <input ref={panelNameRef} type="text" value={panelName} onChange={e => setPanelName(e.target.value)} placeholder="Name"
                    className={`flex-1 min-w-0 rounded px-1.5 py-1 text-[12px] outline-none ${fld}`}
                    onFocus={e => { e.target.style.boxShadow = '0 0 0 2px var(--sys-accent)'; }}
                    onBlur={e => { e.target.style.boxShadow = ''; }}
                    onKeyDown={e => { if (e.key === 'Enter') submitPanel(); if (e.key === 'Escape') closePanel(); }} />
                  <input ref={panelValueRef} type="text" inputMode="decimal" value={panelValue} onChange={e => setPanelValue(e.target.value)} placeholder="Voll-EC"
                    className={`mono w-14 rounded px-1 py-1 text-[12px] text-right outline-none placeholder:text-[10px] ${fld}`}
                    onFocus={e => { e.target.style.boxShadow = '0 0 0 2px var(--sys-accent)'; }}
                    onBlur={e => { e.target.style.boxShadow = ''; }}
                    onKeyDown={e => { if (e.key === 'Enter') submitPanel(); if (e.key === 'Escape') closePanel(); }} />
                </div>
                {(groups || []).length > 0 && (
                  <div className="mb-2">
                    <div className={`text-[9px] uppercase tracking-wider mb-1 ${D ? 'text-neutral-600' : 'text-neutral-500'}`}>Gruppen</div>
                    <div className="flex flex-wrap gap-1">
                      {(groups || []).map(g => {
                        const checked = panelGroupIds.includes(g.id);
                        return (
                          <button key={g.id} onClick={() => togglePanelGroup(g.id)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                            style={{
                              background: checked ? (g.color || '#34d399') + '22' : (D ? '#262626' : '#f3f4f6'),
                              border: `1px solid ${checked ? (g.color || '#34d399') : (D ? '#404040' : '#d1d5db')}`,
                              color: checked ? (g.color || '#34d399') : (D ? '#9ca3af' : '#6b7280'),
                            }}>
                            {checked && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                            {g.name || '?'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={submitPanel}
                    className="px-2.5 py-1 rounded text-white text-[11px] font-semibold transition-colors"
                    style={{ background: 'var(--sys-accent)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--sys-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--sys-accent)'; }}>
                    {panelMode === 'edit' ? 'Speichern' : 'Hinzufügen'}
                  </button>
                  <button onClick={closePanel} className={`w-6 h-6 rounded flex items-center justify-center ${D ? 'text-neutral-500 hover:bg-neutral-700' : 'text-neutral-500 hover:bg-neutral-200'}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={`flex flex-col divide-y ${divBdr}`}>
          <PhCell label="pH Ist" value={measured.pH} editing={phEditing === 'pH'}
            onClick={() => setPhEditing('pH')} inputRef={phInputRef}
            draft={phDraft} setDraft={setPhDraft} commit={commitPh} isDark={isDark} />
          <PhCell label="pH Soll" value={measured.pHTarget} editing={phEditing === 'pHTarget'}
            onClick={() => setPhEditing('pHTarget')} inputRef={phInputRef}
            draft={phDraft} setDraft={setPhDraft} commit={commitPh} isDark={isDark} />
          <PhAdjustCell adjust={measured.phAdjust || {}} onChange={(adj) => onUpdate({ ...measured, phAdjust: adj })} isDark={isDark} />
        </div>
      </div>
    </div>
  );
});

// ============================================================
// PDF EXPORT MODAL
// ============================================================
function PdfModal({ recipe, onClose, onPrint }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(recipe.groups.map(g => g.id)));
  const [orientation, setOrientation] = useState('portrait');
  const [colorMode, setColorMode] = useState('color');

  // Body-Scroll-Lock — verhindert, dass der Hintergrund statt der Modal scrollt.
  // touchAction nicht setzen → Pinch-Zoom bleibt erhalten.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const toggleGroup = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSel = selectedIds.size === recipe.groups.length;

  return (
    // z-[200] liegt sicher über der BottomNav (z-[60]).
    // items-center auch auf Mobile, damit der "Jetzt drucken"-Button nicht
    // hinter der BottomNav verschwindet. 100dvh berücksichtigt die mobile
    // Browser-UI (Adress-/Toolbar), 100vh tut das nicht.
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overscroll-contain" onClick={onClose}
         style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div onClick={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-2xl overflow-y-auto overscroll-contain recipe-scroll"
        style={{ maxHeight: 'min(90dvh, 720px)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            PDF exportieren
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Gruppen</div>
            <button onClick={() => setSelectedIds(allSel ? new Set() : new Set(recipe.groups.map(g => g.id)))}
              className="text-xs text-emerald-400 hover:text-emerald-300">{allSel ? 'Alle abwählen' : 'Alle'}</button>
          </div>
          <div className="space-y-0.5 max-h-44 overflow-y-auto">
            {recipe.groups.map(g => (
              <label key={g.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-neutral-800 cursor-pointer">
                <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleGroup(g.id)} style={{ accentColor: '#10b981' }} />
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.themeColor || recipe.themeColor || '#10b981' }} />
                <span className="text-sm flex-1 truncate">{g.name || 'Gruppe'}</span>
                <span className="text-xs text-neutral-500">{g.salts.length} Salze</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Ausrichtung</div>
          <div className="grid grid-cols-2 gap-2">
            {[['portrait', '↕ Hochformat'], ['landscape', '↔ Querformat']].map(([val, label]) => (
              <button key={val} onClick={() => setOrientation(val)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${orientation === val ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Farbmodus</div>
          <div className="grid grid-cols-2 gap-2">
            {[['color', '🎨 Farbe'], ['bw', '⬛ S&W']].map(([val, label]) => (
              <button key={val} onClick={() => setColorMode(val)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${colorMode === val ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400' : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={selectedIds.size === 0}
          onClick={() => onPrint({ selectedIds, orientation, colorMode })}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Jetzt drucken
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PRINT DOCUMENT — rendered hidden, shown only in @media print
// ============================================================
function PrintDocument({ recipe, selectedIds, colorMode, elementColors, useElementColors, orientation = 'portrait', lang = 'de' }) {
  const groups = recipe.groups.filter(g => selectedIds.has(g.id));
  const isColor = colorMode === 'color' && useElementColors;
  const themeColor = recipe.themeColor || '#10b981';
  const targets = recipe.targets || {};

  // Kumulierte Summen über die gewählten Gruppen
  const cumTotals = {};
  groups.forEach(g => g.salts.forEach(salt => {
    Object.entries(salt.contributions || {}).forEach(([sym, v]) => {
      cumTotals[sym] = (cumTotals[sym] || 0) + (v || 0);
    });
  }));
  const cumMass = groups.reduce(
    (sum, g) => sum + g.salts.reduce((s, salt) => s + (salt.massUnit !== 'ml' ? (salt.mass || 0) : 0), 0), 0
  );

  // Element-Auswahl exakt wie in der App (FooterTotals / FullTableView):
  // alle Elemente mit Beitrag > 0 ODER gesetztem Zielwert — lückenlos, in ELEMENT_DEFS-Reihenfolge.
  const allEls = ELEMENT_DEFS.filter(e => (cumTotals[e.sym] || 0) > 0 || (targets[e.sym] || 0) > 0);
  const hasTargets = allEls.some(e => (targets[e.sym] || 0) > 0);

  // Im Druck immer zwei Nachkommastellen (volle Präzision, kein Platzmangel wie in der App)
  const fmt = (v) => (v > 0 ? v.toFixed(2) : '·');
  const MONO = { fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontVariantNumeric: 'tabular-nums' };

  // --- Spalten- & Box-Maße (feste px → exakte Ausrichtung über alle Zeilen) ---
  const BORDER = 1.5;
  const NAME_W = 64;
  const MASS_W = 58;
  const ROW_H = 26;
  const nEls = allEls.length;

  // Nutzbare Seitenbreite (A4 minus @page-Rand 10 mm + body-Padding 6 mm je Seite = 16 mm).
  // Die Tabelle füllt diese Breite NUR HORIZONTAL aus, indem die Element-Spalten breiter
  // werden. Vertikal (Zeilenhöhe, Kachelgröße) bleibt alles in natürlicher Größe.
  const MM = 96 / 25.4;
  const pageMM = orientation === 'landscape' ? 297 : 210;
  const availW = (pageMM - 2 * 16) * MM;
  const targetBoxW = availW - 6; // kleine Reserve gegen Randbeschnitt
  const elColWFill = nEls > 0
    ? Math.max(32, Math.min(72, Math.floor((targetBoxW - 2 * BORDER - NAME_W - MASS_W) / nEls)))
    : 44;
  // Kachel füllt die Spalte, ist aber auf 48px gedeckelt (im Querformat sonst zu groß).
  const TILE = Math.min(elColWFill - 2, 48);
  // Ist die Kachel gedeckelt, wird die Spalte eng um die Kachel gezogen (nur ~3px Spalt),
  // damit keine zu großen Lücken zwischen den Kacheln entstehen.
  const elColW = Math.min(elColWFill, TILE + 3);
  const TILE_FONT = Math.max(11, Math.min(17, Math.round(TILE * 0.4)));
  const contentW = NAME_W + nEls * elColW + MASS_W;
  const boxW = contentW + 2 * BORDER;

  const labelSalt = lang === 'en' ? 'Salt' : 'Salz';
  const labelAmount = lang === 'en' ? 'Amount' : 'Menge';

  const pageHeaderStyle = {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    borderBottom: '2px solid #e5e7eb', paddingBottom: 12, marginBottom: 18,
  };

  // Element-Kachel — 1:1 wie ElementHeaderTile in der App (Farbverlauf mit hoher Transparenz)
  const ElTile = ({ sym }) => {
    const c = isColor ? getElColor(sym, elementColors) : null;
    return (
      <div style={{
        width: TILE, height: TILE, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: TILE_FONT, fontWeight: 700, lineHeight: 1,
        background: isColor ? `linear-gradient(180deg, ${c}28 0%, ${c}14 100%)` : '#f3f4f6',
        border: `1px solid ${isColor ? c + '55' : '#d1d5db'}`,
        color: isColor ? c : '#111',
      }}>{sym}</div>
    );
  };

  // Eine Wertzeile (Salzname | Element-Werte | Menge) — Maße identisch zur Kopfzeile
  const Row = ({ name, nameColor, values, mass, bg, bold }) => (
    <div style={{ display: 'flex', alignItems: 'center', height: ROW_H, background: bg }}>
      <div style={{
        width: NAME_W, flexShrink: 0, padding: '0 7px',
        fontSize: 11, fontWeight: bold ? 700 : 600, color: nameColor || '#1f2937',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</div>
      {allEls.map(e => {
        const v = values[e.sym] || 0;
        const c = isColor ? getElColor(e.sym, elementColors) : '#1f2937';
        return (
          <div key={e.sym} style={{
            width: elColW, flexShrink: 0, textAlign: 'center',
            fontSize: 9.5, ...MONO,
            fontWeight: v > 0 ? (bold ? 700 : 600) : 400,
            color: v > 0 ? (isColor ? c : '#1f2937') : '#d1d5db',
          }}>{fmt(v)}</div>
        );
      })}
      <div style={{
        width: MASS_W, flexShrink: 0, textAlign: 'right', padding: '0 7px',
        fontSize: 9.5, ...MONO, fontWeight: bold ? 700 : 600, color: '#374151',
      }}>{mass}</div>
    </div>
  );

  // ==========================================================
  // SEITE 2 — AUSWERTUNG (Inhalt 1:1 wie das Auswertungs-Popover,
  // druckoptimiert mit hellem Hintergrund & Inline-Styles)
  // ==========================================================
  // Kennzahlen über die gewählten Gruppen (identisch zum Popover)
  let aTotalG = 0, aTotalMl = 0, aTotalPrice = 0, aAnyPrice = false, aAllPriced = true, aNh4 = 0, aNTotal = 0;
  groups.forEach(g => g.salts.forEach(s => {
    const m = s.mass || 0;
    if (s.massUnit === 'ml') aTotalMl += m; else aTotalG += m;
    if (s.pricePerKg && m > 0) { aAnyPrice = true; aTotalPrice += (s.pricePerKg * m) / 1000; }
    else if (m > 0) { aAllPriced = false; }
    const n = s.contributions?.N || 0;
    aNTotal += n; aNh4 += n * (s.nh4Fraction || 0);
  }));
  const aSaltCount = groups.reduce((s, g) => s + g.salts.length, 0);

  const A_RATIOS = [['N','K'],['P','K'],['Ca','Mg'],['N','Ca'],['K','Ca'],['Fe','Mn'],['K','Mg']];
  const aRatios = A_RATIOS
    .map(([a, b]) => ({ a, b, va: cumTotals[a] || 0, vb: cumTotals[b] || 0 }))
    .filter(r => r.va > 0 && r.vb > 0)
    .map(r => { const mn = Math.min(r.va, r.vb); return { ...r, ratioA: (r.va / mn).toFixed(2), ratioB: (r.vb / mn).toFixed(2) }; });

  const aTargeted = ELEMENT_DEFS.filter(e => (targets[e.sym] || 0) > 0);
  const aScores = aTargeted.map(e => { const t = targets[e.sym]; const a = cumTotals[e.sym] || 0; return Math.max(0, 100 - Math.abs((a / t) * 100 - 100)); });
  const aScore = aScores.length > 0 ? aScores.reduce((a, b) => a + b, 0) / aScores.length : null;

  const A_MACRO = new Set(['N','P','K','Mg','Ca','S','Si','Cl']);
  const aElsPresent = ELEMENT_DEFS.filter(e => (cumTotals[e.sym] || 0) > 0);
  const macroData = aElsPresent.filter(e => A_MACRO.has(e.sym)).map(e => ({ sym: e.sym, color: getElColor(e.sym, elementColors), value: cumTotals[e.sym] }));
  const microData = aElsPresent.filter(e => !A_MACRO.has(e.sym)).map(e => ({ sym: e.sym, color: getElColor(e.sym, elementColors), value: cumTotals[e.sym] }));
  // Balken-Elemente: NUR im Druck Elemente ohne Beitrag ausblenden (keine Kachel ohne Balken)
  const barEls = aElsPresent;
  const barMaxUntargeted = barEls.reduce((mx, e) => ((targets[e.sym] || 0) > 0 ? mx : Math.max(mx, cumTotals[e.sym] || 0)), 0);

  const nColorP = isColor ? getElColor('N', elementColors) : '#6b7280';
  const nh4ColorP = isColor ? getNH4Color(elementColors) : '#9ca3af';
  const GRAYS = ['#374151', '#6b7280', '#9aa1ad', '#4b5563', '#b0b6c0', '#828a96', '#cbd0d8'];

  // --- Druck-Subkomponenten (helle Variante) ---
  const sectionLabel = (txt) => (
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>{txt}</div>
  );

  const StatCardP = ({ label, value, unit, accent }) => (
    <div style={{ flex: '1 1 140px', minWidth: 118, background: '#f5f6f8', border: '1px solid #e9eaee', borderRadius: 10, padding: '8px 11px' }}>
      <div style={{ fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', marginBottom: 3 }}>{label}</div>
      <div style={{ ...MONO, fontSize: 17, fontWeight: 700, color: accent || '#111' }}>
        {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', marginLeft: 3 }}>{unit}</span>}
      </div>
    </div>
  );

  const DonutP = ({ data, label }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    let cum = 0;
    const size = 100;
    return (
      <div style={{ flex: '1 1 268px', minWidth: 230, background: '#f8f9fb', border: '1px solid #e9eaee', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#ebedf0" strokeWidth="4" />
            {sorted.map((d, i) => {
              const pct = (d.value / total) * 100;
              const seg = (
                <circle key={d.sym} cx="18" cy="18" r="15.9155" fill="none"
                  stroke={isColor ? d.color : GRAYS[i % GRAYS.length]} strokeWidth="4"
                  strokeDasharray={`${pct.toFixed(3)} 100`} strokeDashoffset={(-cum).toFixed(3)} strokeLinecap="butt" />
              );
              cum += pct;
              return seg;
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', fontWeight: 600 }}>{label}</div>
            <div style={{ ...MONO, fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1 }}>{total.toFixed(0)}</div>
            <div style={{ fontSize: 7.5, color: '#9ca3af', marginTop: 1 }}>ppm</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {sorted.map((d, i) => {
            const pct = (d.value / total) * 100;
            const sc = isColor ? d.color : GRAYS[i % GRAYS.length];
            return (
              <div key={d.sym} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: sc, flexShrink: 0 }} />
                <div style={{ ...MONO, fontWeight: 700, width: 22, flexShrink: 0, color: isColor ? sc : '#374151' }}>{d.sym}</div>
                <div style={{ flex: 1, ...MONO, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.value.toFixed(d.value < 1 ? 2 : 1)}</div>
                <div style={{ ...MONO, color: '#9ca3af', width: 34, textAlign: 'right' }}>{pct.toFixed(pct < 1 ? 1 : 0)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BarRowP = ({ e }) => {
    const v = cumTotals[e.sym] || 0;
    const target = targets[e.sym] || 0;
    const hasTarget = target > 0;
    const pct = hasTarget ? (v / target) * 100 : null;
    const color = isColor ? getElColor(e.sym, elementColors) : '#6b7280';
    let barWidth, barColor, barOpacity;
    if (hasTarget) { barWidth = Math.min(100, pct); barColor = pct > 100 ? '#ef4444' : color; barOpacity = 1; }
    else { barWidth = barMaxUntargeted > 0 ? (v / barMaxUntargeted) * 100 : 0; barColor = color; barOpacity = 0.45; }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{
          width: 30, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          background: isColor ? `linear-gradient(180deg, ${color}28 0%, ${color}14 100%)` : '#f3f4f6',
          border: `1px solid ${isColor ? color + '55' : '#d1d5db'}`, color: isColor ? color : '#111',
        }}>{e.sym}</div>
        <div style={{ flex: 1, height: 9, borderRadius: 5, overflow: 'hidden', background: '#edeef1' }}>
          <div style={{ height: '100%', borderRadius: 5, width: `${barWidth}%`, background: barColor, opacity: barOpacity }} />
        </div>
        <div style={{ ...MONO, fontSize: 10, fontWeight: 600, width: 46, textAlign: 'right', color: isColor ? color : '#374151' }}>{v.toFixed(1)}</div>
        <div style={{ ...MONO, fontSize: 9, color: '#9ca3af', width: 32, textAlign: 'right' }}>{target > 0 ? target.toFixed(1) : '–'}</div>
        <div style={{ ...MONO, fontSize: 9, fontWeight: 600, width: 32, textAlign: 'right', color: pct === null ? '#9ca3af' : (pct > 110 || pct < 85) ? '#dc2626' : (pct > 105 || pct < 95) ? '#d97706' : '#059669' }}>
          {pct === null ? '–' : `${pct.toFixed(0)}%`}
        </div>
      </div>
    );
  };

  const NSplitP = ({ label, value, total, color, highlight }) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 108, flexShrink: 0, fontSize: 10, color: highlight ? color : '#374151' }}>{label}</div>
        <div style={{ flex: 1, height: 8, borderRadius: 5, overflow: 'hidden', background: '#edeef1' }}>
          <div style={{ height: '100%', borderRadius: 5, width: `${pct}%`, background: color }} />
        </div>
        <div style={{ ...MONO, fontSize: 10, fontWeight: 600, width: 48, textAlign: 'right', color }}>{value.toFixed(1)}</div>
        <div style={{ ...MONO, fontSize: 9, color: '#9ca3af', width: 44, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
      </div>
    );
  };

  // --- Inhaltsblöcke (für Hoch- & Querformat wiederverwendet) ---
  const statCards = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      <StatCardP label="Salze" value={aSaltCount} />
      {aTotalG > 0 && <StatCardP label="Salzmenge" value={aTotalG.toFixed(0)} unit="g" />}
      {aTotalMl > 0 && <StatCardP label="Flüssig" value={aTotalMl.toFixed(0)} unit="ml" />}
      {aAnyPrice && <StatCardP label={aAllPriced ? 'Preis' : 'Preis (teilw.)'} value={aTotalPrice.toFixed(2)} unit="€" accent={isColor ? '#65a30d' : '#111'} />}
      {aScore !== null && <StatCardP label="Zielwert-Score" value={aScore.toFixed(0)} unit="/100" accent={isColor ? (aScore >= 90 ? '#059669' : aScore >= 75 ? '#ca8a04' : '#ea580c') : '#111'} />}
      {aNTotal > 0 && <StatCardP label="NH₄-Anteil" value={((aNh4 / aNTotal) * 100).toFixed(1)} unit="%" accent={isColor ? nh4ColorP : '#111'} />}
    </div>
  );

  const donutsBlock = (macroData.length > 0 || microData.length > 0) ? (
    <div style={{ marginBottom: 14 }}>
      {sectionLabel('Element-Verteilung in ppm')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {macroData.length > 0 && <DonutP data={macroData} label="Makro" />}
        {microData.length > 0 && <DonutP data={microData} label="Mikro" />}
      </div>
    </div>
  ) : null;

  const barsBlock = barEls.length > 0 ? (
    <div style={{ marginBottom: 14 }}>
      {sectionLabel('Zielerreichung pro Element')}
      {barEls.map(e => <BarRowP key={e.sym} e={e} />)}
    </div>
  ) : null;

  const nFormBlock = aNTotal > 0 ? (
    <div style={{ marginBottom: 14, background: '#f8f9fb', border: '1px solid #e9eaee', borderRadius: 10, padding: '10px 12px' }}>
      {sectionLabel('Stickstoff-Form')}
      <NSplitP label="NO₃⁻ (Nitrat)" value={aNTotal - aNh4} total={aNTotal} color={nColorP} />
      <NSplitP label="NH₄⁺ (Ammonium)" value={aNh4} total={aNTotal} color={nh4ColorP} highlight />
    </div>
  ) : null;

  const ratiosBlock = aRatios.length > 0 ? (
    <div style={{ marginBottom: 6 }}>
      {sectionLabel('Verhältnisse')}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {aRatios.map(r => {
          const cA = isColor ? getElColor(r.a, elementColors) : '#374151';
          const cB = isColor ? getElColor(r.b, elementColors) : '#374151';
          return (
            <div key={`${r.a}-${r.b}`} style={{ flex: '1 1 150px', minWidth: 124, background: '#f8f9fb', border: '1px solid #e9eaee', borderRadius: 8, padding: '6px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: cA }}>{r.a}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>:</span>
                <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: cB }}>{r.b}</span>
              </div>
              <div style={{ ...MONO, fontSize: 11, color: '#374151' }}>
                <span style={{ color: cA }}>{r.ratioA}</span>
                <span style={{ color: '#9ca3af' }}> : </span>
                <span style={{ color: cB }}>{r.ratioB}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className="recipe-print-doc" style={{
      background: '#fff', color: '#111',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      padding: 0,
    }}>

      {/* ========================================================
          PAGE 1 — UNIFIED RECIPE TABLE
          (Breite = boxW; die Spaltenbreite füllt die Seite horizontal aus,
           vertikal bleibt alles in natürlicher Größe — kein Transform.)
          ======================================================== */}
      <div style={{ width: boxW }}>
        {/* Recipe title bar */}
        <div style={pageHeaderStyle}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', marginBottom: 4 }}>
              Rezept
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: themeColor, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {recipe.name}
            </div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 5 }}>
              {groups.length} Gruppe{groups.length !== 1 ? 'n' : ''}{' · '}
              {groups.reduce((s, g) => s + g.salts.length, 0)} Salze{' · '}mg/L
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', paddingTop: 2 }}>
            {new Date().toLocaleDateString('de-DE')}
          </div>
        </div>

        {groups.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            Keine Gruppen ausgewählt.
          </p>
        ) : (
          <div style={{ width: boxW }}>
            {/* ---- Globale Element-Kopfzeile (alle Kacheln, lückenlos) ---- */}
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              width: boxW, boxSizing: 'border-box',
              paddingLeft: BORDER, paddingRight: BORDER, marginBottom: 7,
            }}>
              <div style={{
                width: NAME_W, flexShrink: 0, padding: '0 7px',
                fontSize: 9, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{labelSalt}</div>
              {allEls.map(e => (
                <div key={e.sym} style={{ width: elColW, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                  <ElTile sym={e.sym} />
                </div>
              ))}
              <div style={{
                width: MASS_W, flexShrink: 0, padding: '0 7px', textAlign: 'right',
                fontSize: 9, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>{labelAmount}</div>
            </div>

            {/* ---- Gruppen als umrahmte Boxen mit abgerundeten Ecken ---- */}
            {groups.map(group => {
              const gColor = group.themeColor || themeColor;
              const bColor = isColor ? gColor : '#cbd5e1';
              const isStock = group.kind === 'stock';
              const isSolo  = group.kind === 'solo';
              const isTop   = group.kind === 'topdress';
              const kindLabel = isTop ? 'Topdress' : isSolo ? 'Endlösung' : 'Konzentrat';

              return (
                <div key={group.id} style={{
                  width: boxW, boxSizing: 'border-box',
                  border: `${BORDER}px solid ${bColor}`, borderRadius: 9,
                  overflow: 'hidden', marginBottom: 10,
                  breakInside: 'avoid', pageBreakInside: 'avoid',
                }}>
                  {/* Gruppen-Header (zarte Rezept-/Gruppenfarbe) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px',
                    background: isColor ? `${gColor}1A` : '#f5f5f5',
                    borderBottom: `1px solid ${isColor ? gColor + '40' : '#e5e7eb'}`,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: gColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#111' }}>{group.name || 'Gruppe'}</span>
                    {/* kindLabel + Stock-Werte: etwas größer und kontrastreicher gemacht,
                        damit Faktor / ml/L / Volumen im PDF-Ausdruck gut lesbar sind. */}
                    <span style={{ fontSize: 10.5, color: '#525252', fontWeight: 500 }}>{kindLabel}</span>
                    {isStock && <span style={{ ...MONO, fontSize: 10.5, color: '#1f2937', fontWeight: 600 }}>{'×'}{group.factor}{' · '}{group.mlPerL}{' ml/L · '}{group.volume}{' L'}</span>}
                    {isSolo && <span style={{ ...MONO, fontSize: 10.5, color: '#1f2937', fontWeight: 600 }}>{group.volume}{' L'}</span>}
                    {isTop && group.volume && <span style={{ ...MONO, fontSize: 10.5, color: '#1f2937', fontWeight: 600 }}>{group.volume}{' L'}</span>}
                  </div>

                  {/* Salz-Zeilen mit alternierenden Zeilenfarben (Zebra) */}
                  {group.salts.length === 0 ? (
                    <div style={{ padding: '6px 9px', fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>(keine Salze)</div>
                  ) : group.salts.map((salt, si) => (
                    <Row
                      key={salt.id}
                      name={getSaltDisplay(salt, 'kuerzel').text}
                      values={salt.contributions || {}}
                      mass={(salt.mass || 0) > 0 ? salt.mass.toFixed(2) : '–'}
                      bg={si % 2 === 0 ? '#fafafa' : '#ffffff'}
                    />
                  ))}
                </div>
              );
            })}

            {/* ---- Summe + Zielwert: eine kumulierte Box nach der letzten Gruppe ---- */}
            <div style={{
              width: boxW, boxSizing: 'border-box',
              border: '1.5px solid #94a3b8', borderRadius: 9,
              overflow: 'hidden', marginTop: 2,
              breakInside: 'avoid', pageBreakInside: 'avoid',
            }}>
              <Row name="Summe" values={cumTotals} mass={cumMass > 0 ? cumMass.toFixed(2) : '–'} bg="#eef2f6" bold />
              {hasTargets && (
                <div style={{ display: 'flex', alignItems: 'center', height: ROW_H, background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ width: NAME_W, flexShrink: 0, padding: '0 7px', fontSize: 10, fontStyle: 'italic', color: '#9ca3af' }}>Zielwert</div>
                  {allEls.map(e => {
                    const t = targets[e.sym] || 0;
                    const a = cumTotals[e.sym] || 0;
                    const pct = t > 0 ? (a / t) * 100 : null;
                    const tc = !t ? '#d1d5db' : pct > 115 ? '#dc2626' : pct < 85 ? '#d97706' : '#6b7280';
                    return (
                      <div key={e.sym} style={{ width: elColW, flexShrink: 0, textAlign: 'center', fontSize: 9.5, ...MONO, fontWeight: 400, color: tc }}>
                        {t > 0 ? t.toFixed(2) : '·'}
                      </div>
                    );
                  })}
                  <div style={{ width: MASS_W, flexShrink: 0 }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          PAGE 2 — AUSWERTUNG (Inhalt wie Auswertungs-Popover)
          ======================================================== */}
      <div className="print-page-break" style={{ paddingTop: 4 }}>
        <div style={pageHeaderStyle}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9ca3af', marginBottom: 4 }}>Auswertung</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: themeColor, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{recipe.name}</div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 5 }}>
              {groups.length} {groups.length === 1 ? 'Gruppe' : 'Gruppen'}{' · '}{aSaltCount} Salze
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', paddingTop: 2 }}>{new Date().toLocaleDateString('de-DE')}</div>
        </div>

        {groups.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Keine Gruppen vorhanden.</p>
        ) : orientation === 'landscape' ? (
          <div style={{ width: availW }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Links: Stat-Kästchen + Donuts */}
              <div style={{ width: 330, flexShrink: 0 }}>
                {statCards}
                {donutsBlock}
              </div>
              {/* Rechts: Balken + Stickstoff-Form */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {barsBlock}
                {nFormBlock}
              </div>
            </div>
            {/* Verhältnisse über die ganze Breite */}
            {ratiosBlock}
          </div>
        ) : (
          <div style={{ width: availW }}>
            {statCards}
            {donutsBlock}
            {barsBlock}
            {nFormBlock}
            {ratiosBlock}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// KEBAB MENU
// ============================================================
function KebabMenu({ onClose, saltMode, setSaltMode, viewMode, setViewMode, onNewRecipe, onOpenLibrary, onSave, onPdfExport, onDosingGuide }) {
  useEffect(() => {
    const handle = (e) => { if (!e.target.closest('[data-kebab]')) onClose(); };
    const tid = setTimeout(() => document.addEventListener('click', handle), 0);
    return () => { clearTimeout(tid); document.removeEventListener('click', handle); };
  }, [onClose]);

  return (
    <div data-kebab className="absolute top-full right-0 mt-1 z-30 min-w-[260px] bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl py-1">
      <div className="px-3 pt-3 pb-2">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Salzname-Anzeige</div>
        <div className="grid grid-cols-3 gap-1">
          {[{ id: 'kuerzel', label: 'Kürzel' }, { id: 'formula', label: 'Formel' }, { id: 'name', label: 'Voll' }].map(opt => (
            <button key={opt.id} onClick={() => setSaltMode(opt.id)}
              className={`text-xs px-2 py-1.5 rounded ${saltMode === opt.id ? 'bg-emerald-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 pt-2 pb-3 border-b border-neutral-800">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Ansicht</div>
        <div className="grid grid-cols-2 gap-1">
          {[{ id: 'compact', label: 'Kompakt' }, { id: 'full', label: 'Voll-Tabelle' }].map(opt => (
            <button key={opt.id} onClick={() => setViewMode(opt.id)}
              className={`text-xs px-2 py-1.5 rounded ${viewMode === opt.id ? 'bg-emerald-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {[
        { icon: '✨', label: 'Neues Rezept', sub: 'Aktuelles verwerfen', onClick: onNewRecipe },
        { icon: '📋', label: 'Rezept-Bibliothek', sub: 'Öffnen / verwalten', onClick: onOpenLibrary },
      ].map(item => (
        <button key={item.label} onClick={item.onClick}
          className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-neutral-800">
          <span className="w-5 text-center text-base">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm">{item.label}</div>
            {item.sub && <div className="text-[10px] text-neutral-500">{item.sub}</div>}
          </div>
        </button>
      ))}
      <div className="border-t border-neutral-800 my-1" />
      <button onClick={onSave} className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-neutral-800">
        <span className="w-5 text-center text-base">💾</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">Rezept speichern</div>
          <div className="text-[10px] text-neutral-500">In Bibliothek ablegen</div>
        </div>
      </button>
      <div className="border-t border-neutral-800 my-1" />
      <button onClick={onDosingGuide} className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-neutral-800">
        <span className="w-5 text-center text-base">📋</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">Dosieranleitung</div>
          <div className="text-[10px] text-neutral-500">Phasen & Dosiertabelle</div>
        </div>
      </button>
      <div className="border-t border-neutral-800 my-1" />
      <button onClick={onPdfExport} className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-neutral-800">
        <span className="w-5 text-center text-base">🖨</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">PDF exportieren</div>
          <div className="text-[10px] text-neutral-500">Gruppen drucken</div>
        </div>
      </button>
    </div>
  );
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function ConfirmDialog({ title, message, onConfirm, onClose, confirmLabel = 'Bestätigen', danger = true }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-2xl">
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-neutral-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium">Abbrechen</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold ${danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LIBRARY PANEL
// ============================================================
function LibraryPanel({ onClose, library, onOpen, onDelete, currentId }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] overflow-y-auto recipe-scroll">
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Rezept-Bibliothek</div>
            <div className="font-semibold">{library.length} Rezept{library.length === 1 ? '' : 'e'}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          {library.length === 0 ? (
            <div className="text-center py-10 text-sm text-neutral-500 italic">
              Noch keine Rezepte gespeichert.<br/>Speichere ein Rezept über das Menü.
            </div>
          ) : library.map(r => (
            <div key={r.id} className={`p-3 rounded-lg border ${r.id === currentId ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-neutral-800 border-neutral-700'} flex items-center gap-3`}>
              <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: r.themeColor || '#10b981' }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: r.themeColor || '#10b981' }}>{r.name}</div>
                <div className="text-[10px] text-neutral-500">
                  {r.groups.length} Gruppen · {r.groups.reduce((s, g) => s + g.salts.length, 0)} Salze
                  {r.id === currentId && ' · aktiv'}
                </div>
              </div>
              <button onClick={() => onOpen(r)} className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-xs font-medium">Öffnen</button>
              <button onClick={() => onDelete(r.id)} className="w-8 h-8 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RECIPE VIEW — default export
// ============================================================
export default function RecipeView({ recipe, setRecipe, library, setLibrary, availableSalts, useElementColors, elementColors, lang, saltLang: saltLangProp, setSaltLang: setSaltLangProp, isDark = true, accent, flashInfo = null, onFlashConsumed }) {
  const [viewMode, setViewMode] = useState('compact');
  const [saltLangLocal, setSaltLangLocal] = useState(() => {
    try { return localStorage.getItem(SALT_LANG_KEY) || lang || 'de'; } catch { return lang || 'de'; }
  });
  // Use prop if provided (lifted state), else fall back to local state
  const saltLang = saltLangProp !== undefined ? saltLangProp : saltLangLocal;
  const setSaltLang = setSaltLangProp !== undefined ? setSaltLangProp : setSaltLangLocal;
  const [openElement, setOpenElement] = useState(null);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [dosingGuideOpen, setDosingGuideOpen] = useState(false);

  // Undo/Redo — session-only history (max 30 steps)
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isUndoRedo  = useRef(false);
  const prevRecipeRef = useRef(recipe);
  const mountedRef    = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; prevRecipeRef.current = recipe; return; }
    const prev = prevRecipeRef.current;
    prevRecipeRef.current = recipe;
    if (isUndoRedo.current) { isUndoRedo.current = false; return; }
    setUndoStack(s => [...s.slice(-29), prev]);
    setRedoStack([]);
  }, [recipe]); // eslint-disable-line react-hooks/exhaustive-deps

  const undo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, recipe]);
    isUndoRedo.current = true;
    prevRecipeRef.current = prev;
    setRecipe(prev);
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, recipe]);
    isUndoRedo.current = true;
    prevRecipeRef.current = next;
    setRecipe(next);
  };
  const [saltPicker, setSaltPicker] = useState(null);
  const [activeDnd, setActiveDnd] = useState(null);
  const dndSensors = useReorderSensors();
  const [toast, setToast] = useState(null); // { msg: string, type: 'success'|'warning' }
  const [kebabOpen, setKebabOpen] = useState(false);
  const [editingRecipeName, setEditingRecipeName] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [recipeNameDraft, setRecipeNameDraft] = useState(recipe.name);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState(() => new Set());
  const [renameSignals, setRenameSignals] = useState({});
  const [pdfOpen, setPdfOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState({ selectedIds: new Set(), colorMode: 'color', orientation: 'portrait' });
  const [shouldPrint, setShouldPrint] = useState(false);
  const printWindowRef = useRef(null);
  const measuredValuesRef = useRef(null);
  const ecSectionRef = useRef(null);

  const handleCreateCombo = () => {
    if (ecSectionRef.current) {
      ecSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setTimeout(() => {
      measuredValuesRef.current?.openAdd([...selectedGroupIds]);
    }, 350);
  };

  const RECIPE_ZOOM_LEVELS = [1, 0.8, 0.65, 0.5];
  const [recipeZoom, setRecipeZoom] = useState(() => {
    try { return parseFloat(localStorage.getItem('hydro:recipeZoom')) || 1; } catch { return 1; }
  });
  // Full-table mode has a simple 2-state toggle: normal (auto-fit) vs overview (50%)
  const [tableViewOverview, setTableViewOverview] = useState(() => {
    try { return localStorage.getItem('hydro:tableViewOverview') === 'true'; } catch { return false; }
  });
  const cycleRecipeZoom = () => {
    if (viewMode !== 'compact') {
      // Full-table mode: toggle between auto-fit (1) and overview (0.5)
      const next = !tableViewOverview;
      setTableViewOverview(next);
      try { localStorage.setItem('hydro:tableViewOverview', String(next)); } catch {}
    } else {
      // Compact mode: cycle through 4 zoom levels
      const next = RECIPE_ZOOM_LEVELS[(RECIPE_ZOOM_LEVELS.indexOf(recipeZoom) + 1) % RECIPE_ZOOM_LEVELS.length];
      setRecipeZoom(next);
      try { localStorage.setItem('hydro:recipeZoom', String(next)); } catch {}
    }
  };
  // In full-table mode, parent zoom is kept at 1 (FullTableView handles its own zoom via userZoom prop).
  // In compact mode, the whole page is zoomed for the overview feel the user likes.
  const pageZoom = viewMode === 'compact' ? recipeZoom : 1;

  // Flash state for transferred salt rows
  const [localFlashIds, setLocalFlashIds] = useState(new Set());
  useEffect(() => {
    if (!flashInfo) return;
    const { groupId, saltIds } = flashInfo;
    setLocalFlashIds(new Set(saltIds));
    const scrollTid = setTimeout(() => {
      const el = document.getElementById('group-' + groupId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
    const clearTid = setTimeout(() => {
      setLocalFlashIds(new Set());
      onFlashConsumed?.();
    }, 2200);
    return () => { clearTimeout(scrollTid); clearTimeout(clearTid); };
  }, [flashInfo]);

  // Only write to localStorage when using local state (not lifted)
  useEffect(() => {
    if (setSaltLangProp === undefined) {
      try { localStorage.setItem(SALT_LANG_KEY, saltLang); } catch {}
    }
  }, [saltLang, setSaltLangProp]);

  useEffect(() => { setRecipeNameDraft(recipe.name); }, [recipe.name]);
  useEffect(() => { setSelectedGroupIds(new Set()); }, [recipe.id]);

  // Drucken — läuft nach React-Commit, damit PrintDocument die korrekten
  // selectedIds im DOM hat. Zwei Pfade:
  //   • Native (Capacitor: Android/iOS) — Printer-Plugin
  //     (PrintManager / UIPrintInteractionController + AirPrint)
  //   • Web (Browser) — window.open in neuem Tab + window.print()
  useEffect(() => {
    if (!shouldPrint) return;
    const isNative = Capacitor.isNativePlatform();
    const pw = printWindowRef.current;
    printWindowRef.current = null;
    setShouldPrint(false);

    const printDocEl = document.querySelector('.recipe-print-doc');
    const content = printDocEl ? printDocEl.innerHTML : '<p>Kein Inhalt.</p>';
    const { orientation } = printSettings;

    // Build Dosieranleitung pages (always at least placeholder)
    const dosingA = buildDosingGuidePrint({ recipe, mode: 'A', orientation, lang });
    const ecVals = recipe.measured?.ecValues || [];
    const hasDosingContent = ecVals.length > 0;
    const hasAnyNegative = ecVals.some(ec => ec.zielEC != null && ec.value != null && ec.zielEC > ec.value);
    const dosingB = (hasDosingContent && !hasAnyNegative)
      ? buildDosingGuidePrint({ recipe, mode: 'B', orientation, lang })
      : (hasDosingContent ? buildDosingGuidePrint({ recipe, mode: 'B', orientation, lang }) : null);

    const pageBreak = '<div class="print-page-break"></div>';
    const dosingSection = pageBreak + dosingA + (dosingB ? pageBreak + dosingB : '');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${recipe.name} – Rezept</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #fff; color: #111; padding: 6mm;
    }
    @page { size: A4 ${orientation}; margin: 10mm; }
    .print-page-break { break-before: page; page-break-before: always; padding-top: 4px; }
  </style>
</head>
<body>${content}${dosingSection}</body>
</html>`;

    if (isNative) {
      // Native (Android / iOS): Capacitor-Plugin verwendet die System-Druck-APIs.
      // Android: PrintManager → "Als PDF speichern" als virtueller Drucker.
      // iOS: UIPrintInteractionController + AirPrint → über Teilen-Button → "In Dateien sichern".
      Printer.print({
        content: fullHtml,
        name: `${recipe.name || 'Rezept'}.pdf`,
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      }).catch((err) => {
        console.error('Printer.print failed:', err);
        showToast('Druck fehlgeschlagen: ' + (err?.message || 'unbekannter Fehler'), 'warning');
      });
      return;
    }

    // Web (Browser): in neuem Tab öffnen — der Tab wurde bereits im
    // User-Click-Handler geöffnet (verhindert Popup-Blocker).
    if (!pw || pw.closed) return;
    pw.document.write(fullHtml);
    pw.document.close();
    pw.focus();
    setTimeout(() => {
      pw.print();
      pw.close();
    }, 300);
  }, [shouldPrint]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    // Warnungen länger sichtbar (3s) als Erfolgsmeldungen (2.2s)
    setTimeout(() => setToast(null), type === 'warning' ? 3100 : 2200);
  };

  const handlePdfPrint = ({ selectedIds, orientation, colorMode }) => {
    setPrintSettings({ selectedIds, colorMode, orientation });
    setPdfOpen(false);

    // Plattform-Auswahl:
    //   • Capacitor native (Android/iOS) → kein window.open, Printer-Plugin
    //     wird im useEffect nach React-Commit aufgerufen.
    //   • Web/Desktop → window.open SOFORT im User-Click-Kontext (sonst Popup-Blocker).
    if (Capacitor.isNativePlatform()) {
      setShouldPrint(true);
      return;
    }
    const pw = window.open('', '_blank');
    if (!pw) {
      showToast('PDF-Fenster konnte nicht geöffnet werden – Popups erlauben.');
      return;
    }
    printWindowRef.current = pw;
    setShouldPrint(true);
  };

  const themeColor = recipe.themeColor || '#10b981';
  const saltMode = recipe.saltMode || 'kuerzel';

  // ============================================================
  // Group / Salt operations
  // ============================================================
  const updateGroup = (groupId, updater) => {
    setRecipe(r => ({
      ...r,
      groups: r.groups.map(g => g.id === groupId ? (typeof updater === 'function' ? updater(g) : updater) : g),
    }));
  };

  const deleteGroup = (groupId) => {
    const g = recipe.groups.find(x => x.id === groupId);
    setConfirmDialog({
      title: 'Gruppe entfernen?',
      message: `Die Gruppe "${g?.name || 'ohne Namen'}" und alle ${g?.salts.length || 0} Salze darin werden entfernt.`,
      onConfirm: () => {
        setRecipe(r => ({ ...r, groups: r.groups.filter(g => g.id !== groupId) }));
        showToast('Gruppe entfernt');
      },
    });
  };

  const addGroup = () => {
    const id = 'g-' + Math.random().toString(36).slice(2, 8);
    setRecipe(r => ({
      ...r,
      groups: [...r.groups, { id, name: '', volume: 5, factor: 100, mlPerL: 10, kind: 'stock', salts: [] }],
    }));
    // Sofort in den Namens-Editiermodus wechseln
    setRenameSignals(s => ({ ...s, [id]: 1 }));
  };

  const removeSalt = (groupId, saltId, saltName) => {
    setConfirmDialog({
      title: 'Salz entfernen?',
      message: `Soll "${saltName}" wirklich aus dieser Gruppe gelöscht werden?`,
      onConfirm: () => {
        setRecipe(r => ({
          ...r,
          groups: r.groups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, salts: g.salts.filter(s => s.id !== saltId) };
          }).filter(g => g.salts.length > 0),
        }));
        showToast('Salz entfernt');
      },
    });
  };

  // Löslichkeit ↔ Gruppentyp: Konzentrat nur löslich, Topdress nur unlöslich, Endlösung beides
  const saltFitsKind = (salt, kind) => {
    const soluble = isSaltSoluble(salt);
    if (kind === 'stock') return soluble;
    if (kind === 'topdress') return !soluble;
    return true; // solo / Endlösung
  };
  const kindMismatchMsg = (kind) =>
    kind === 'topdress'
      ? 'Topdress nimmt nur unlösliche Stoffe auf.'
      : 'Unlösliche Stoffe gehören nicht ins Konzentrat (setzen sich ab) – nutze Endlösung oder Topdress.';

  const addSaltToGroup = (groupId, saltDef) => {
    const id = 's-' + Math.random().toString(36).slice(2, 8);
    const group = recipe.groups.find(g => g.id === groupId);
    if (group && !saltFitsKind(saltDef, group.kind)) {
      showToast(kindMismatchMsg(group.kind), 'warning');
      return;
    }
    const isSolo = group?.kind === 'solo';
    const factor = isSolo ? 1 : (group?.factor || 1);
    const volume = group?.volume || 1;

    // Salz wird blank hinzugefügt (mass=0, keine Beiträge).
    // _pcts/_groupFactor/_groupVolume/_groupKind werden gespeichert,
    // damit scaleSaltByMass bei erster Masseneingabe die Beiträge korrekt berechnen kann.
    const newSalt = {
      id,
      shortName: saltDef.shortName,
      formula: saltDef.formula,
      name: saltDef.name,
      nameEN: saltDef.nameEN || saltDef.name,
      mass: 0,
      massUnit: 'g',
      pricePerKg: saltDef.pricePerKg,
      contributions: {},
      nh4Fraction: saltDef.nh4Fraction || 0,
      _pcts: saltDef.contributions || {},
      _groupFactor: factor,
      _groupVolume: volume,
      _groupKind: group?.kind || 'stock',
    };
    updateGroup(groupId, g => ({ ...g, salts: [...g.salts, newSalt] }));
  };

  const replaceSalt = (groupId, saltId, saltDef) => {
    const group = recipe.groups.find(g => g.id === groupId);
    const isTopdress = group?.kind === 'topdress';
    const isSolo = group?.kind === 'solo';
    const factor = isSolo ? 1 : (group?.factor || 1);
    const volume = group?.volume || 1;

    updateGroup(groupId, g => ({
      ...g,
      salts: g.salts.map(s => {
        if (s.id !== saltId) return s;
        const contributions = {};
        Object.entries(saltDef.contributions || {}).forEach(([sym, pct]) => {
          if (isTopdress) {
            contributions[sym] = pct * s.mass / 100;
          } else {
            contributions[sym] = computeContribution(s.mass || 100, pct, factor, volume);
          }
        });
        return {
          ...s,
          shortName: saltDef.shortName,
          formula: saltDef.formula,
          name: saltDef.name,
          nameEN: saltDef.nameEN || saltDef.name,
          pricePerKg: saltDef.pricePerKg,
          contributions,
          nh4Fraction: saltDef.nh4Fraction || 0,
        };
      }),
    }));
  };

  // ============================================================
  // Drag & Drop: Gruppen sortieren + Salze gruppenübergreifend verschieben
  // ============================================================
  const reorderGroups = (orderedIds) => {
    setRecipe(r => {
      const map = Object.fromEntries(r.groups.map(g => [g.id, g]));
      return { ...r, groups: orderedIds.map(id => map[id]).filter(Boolean) };
    });
  };

  const moveSalt = (fromGid, toGid, saltId, overSaltId) => {
    setRecipe(r => {
      const fromG = r.groups.find(g => g.id === fromGid);
      const toG = r.groups.find(g => g.id === toGid);
      if (!fromG || !toG) return r;
      const salt = fromG.salts.find(s => s.id === saltId);
      if (!salt) return r;
      if (fromGid === toGid) {
        const ids = fromG.salts.map(s => s.id);
        const from = ids.indexOf(saltId);
        let to = overSaltId ? ids.indexOf(overSaltId) : ids.length - 1;
        if (to < 0) to = ids.length - 1;
        const newSalts = arrayMove(fromG.salts, from, to);
        return { ...r, groups: r.groups.map(g => g.id === fromGid ? { ...g, salts: newSalts } : g) };
      }
      const moved = recomputeSaltForGroup(salt, toG);
      const newFrom = fromG.salts.filter(s => s.id !== saltId);
      const toIds = toG.salts.map(s => s.id);
      let idx = overSaltId ? toIds.indexOf(overSaltId) : toG.salts.length;
      if (idx < 0) idx = toG.salts.length;
      const newTo = [...toG.salts];
      newTo.splice(idx, 0, moved);
      return {
        ...r,
        groups: r.groups.map(g =>
          g.id === fromGid ? { ...g, salts: newFrom }
          : g.id === toGid ? { ...g, salts: newTo }
          : g),
      };
    });
  };

  const findSaltGroup = (saltId) => recipe.groups.find(g => g.salts.some(s => s.id === saltId));

  const handleDndStart = ({ active }) => {
    const id = String(active.id);
    const g = recipe.groups.find(x => x.id === id);
    if (g) { setActiveDnd({ type: 'group', group: g }); return; }
    const fromG = findSaltGroup(id);
    const s = fromG?.salts.find(x => x.id === id);
    setActiveDnd(s ? { type: 'salt', salt: s, group: fromG } : null);
  };
  const handleDndCancel = () => setActiveDnd(null);
  const handleDndEnd = ({ active, over }) => {
    setActiveDnd(null);
    if (!over) return;
    const aId = String(active.id), oId = String(over.id);
    if (aId === oId) return;

    const activeGroup = recipe.groups.find(g => g.id === aId);
    if (activeGroup) {
      // Gruppe verschieben (over kann Gruppe oder Salz sein)
      const ids = recipe.groups.map(g => g.id);
      const overGroup = recipe.groups.find(g => g.id === oId) || findSaltGroup(oId);
      const target = overGroup?.id;
      if (target && ids.includes(target) && aId !== target) {
        reorderGroups(arrayMove(ids, ids.indexOf(aId), ids.indexOf(target)));
      }
      return;
    }

    // Salz verschieben (innerhalb oder zwischen Gruppen)
    const fromG = findSaltGroup(aId);
    if (!fromG) return;
    let toG, overSaltId = null;
    const overGroup = recipe.groups.find(g => g.id === oId);
    if (overGroup) { toG = overGroup; }
    else { toG = findSaltGroup(oId); overSaltId = oId; }
    if (!toG) return;
    if (fromG.id !== toG.id) {
      const salt = fromG.salts.find(s => s.id === aId);
      if (salt && !saltFitsKind(salt, toG.kind)) {
        showToast(kindMismatchMsg(toG.kind), 'warning');
        return;
      }
    }
    moveSalt(fromG.id, toG.id, aId, overSaltId);
  };

  // ============================================================
  // Selection / Kind conversion
  // ============================================================
  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };
  const clearSelection = () => setSelectedGroupIds(new Set());

  const allGroupsSelected = recipe.groups.length > 0 && recipe.groups.every(g => selectedGroupIds.has(g.id));
  const toggleAllGroups = () => {
    if (allGroupsSelected) clearSelection();
    else setSelectedGroupIds(new Set(recipe.groups.map(g => g.id)));
  };

  const convertGroupKind = (groupId, newKind) => {
    setRecipe(r => ({
      ...r,
      groups: r.groups.map(g => {
        if (g.id !== groupId) return g;
        if (newKind === 'solo') {
          return { ...g, kind: 'solo', factor: null, mlPerL: null, volume: (g.volume || 1) * (g.factor || 1) };
        }
        if (newKind === 'stock') {
          const newFactor = 100;
          return { ...g, kind: 'stock', factor: newFactor, mlPerL: 1000 / newFactor, volume: (g.volume || 1) / newFactor, foliar: false };
        }
        if (newKind === 'topdress') {
          // Topdress: Dosierung pro Pflanze, kein Faktor/Volumen, kein Foliar
          return { ...g, kind: 'topdress', factor: null, mlPerL: null, foliar: false };
        }
        return g;
      }),
    }));
    showToast(newKind === 'solo' ? 'Gruppe ist jetzt Endlösung' : newKind === 'topdress' ? 'Gruppe ist jetzt Topdress' : 'Gruppe ist jetzt Konzentrat');
  };

  const toggleGroupFoliar = (groupId) => {
    setRecipe(r => ({
      ...r,
      groups: r.groups.map(g => g.id === groupId ? { ...g, foliar: !g.foliar } : g),
    }));
  };

  const triggerRename = (groupId) => {
    setRenameSignals(s => ({ ...s, [groupId]: (s[groupId] || 0) + 1 }));
  };

  const handleRenameComplete = (groupId) => {
    setRenameSignals(s => { const n = { ...s }; delete n[groupId]; return n; });
  };

  // ============================================================
  // EC values
  // ============================================================
  const ecValues = recipe.measured?.ecValues || [];

  const addEcValue = (name, value, groupIds) => {
    const id = 'ec-' + Math.random().toString(36).slice(2, 8);
    const entry = {
      id,
      name: name || 'EC',
      groupIds: groupIds || [...selectedGroupIds],
      value,
    };
    setRecipe(r => ({
      ...r,
      measured: { ...(r.measured || {}), ecValues: [...(r.measured?.ecValues || []), entry] },
    }));
    showToast('Kombination hinzugefügt');
    return id;
  };

  const reorderEcValues = (orderedIds) => {
    setRecipe(r => {
      const ecMap = Object.fromEntries((r.measured?.ecValues || []).map(e => [e.id, e]));
      const reordered = orderedIds.map(id => ecMap[id]).filter(Boolean);
      return { ...r, measured: { ...(r.measured || {}), ecValues: reordered } };
    });
  };

  const saveGuideSettings = (settings) => {
    setRecipe(r => ({ ...r, dosingGuide: { ...(r.dosingGuide || {}), ...settings } }));
  };

  // ── Dosieranleitung: Phasen (referenzieren Kombinationen / EC-Einträge) ──
  const addPhase = (name, ecId, zielEC = null) => {
    const id = 'ph-' + Math.random().toString(36).slice(2, 8);
    setRecipe(r => ({
      ...r,
      dosingGuide: {
        ...(r.dosingGuide || {}),
        phases: [...(r.dosingGuide?.phases || []), { id, name: name || 'Phase', ecId, zielEC }],
      },
    }));
    return id;
  };

  const updatePhase = (id, patch) => {
    setRecipe(r => ({
      ...r,
      dosingGuide: {
        ...(r.dosingGuide || {}),
        phases: (r.dosingGuide?.phases || []).map(p => p.id === id ? { ...p, ...patch } : p),
      },
    }));
  };

  const removePhase = (id) => {
    setRecipe(r => ({
      ...r,
      dosingGuide: {
        ...(r.dosingGuide || {}),
        phases: (r.dosingGuide?.phases || []).filter(p => p.id !== id),
      },
    }));
  };

  const reorderPhases = (orderedIds) => {
    setRecipe(r => {
      const map = Object.fromEntries((r.dosingGuide?.phases || []).map(p => [p.id, p]));
      return {
        ...r,
        dosingGuide: { ...(r.dosingGuide || {}), phases: orderedIds.map(id => map[id]).filter(Boolean) },
      };
    });
  };

  const updateEcValue = (id, patch) => {
    setRecipe(r => ({
      ...r,
      measured: { ...(r.measured || {}), ecValues: (r.measured?.ecValues || []).map(e => e.id === id ? { ...e, ...patch } : e) },
    }));
  };

  const removeEcValue = (id) => {
    setRecipe(r => ({
      ...r,
      measured: { ...(r.measured || {}), ecValues: (r.measured?.ecValues || []).filter(e => e.id !== id) },
    }));
  };

  // ============================================================
  // Salt picker handler
  // ============================================================
  const handlePickerResult = (result) => {
    if (!saltPicker) return;
    const arr = Array.isArray(result) ? result : [result];
    if (saltPicker.saltId) {
      if (arr[0]) replaceSalt(saltPicker.groupId, saltPicker.saltId, arr[0]);
      setSaltPicker(null);
      showToast('Salz ersetzt');
      return;
    }
    arr.forEach(s => addSaltToGroup(saltPicker.groupId, s));
    setSaltPicker(null);
    if (arr.length === 1) showToast('Salz hinzugefügt');
    else if (arr.length > 1) showToast(`${arr.length} Salze hinzugefügt`);
  };

  // ============================================================
  // Recipe name / color
  // ============================================================
  const commitRecipeName = () => {
    if (recipeNameDraft.trim()) setRecipe(r => ({ ...r, name: recipeNameDraft.trim() }));
    else setRecipeNameDraft(recipe.name);
    setEditingRecipeName(false);
    setColorPickerOpen(false);
  };

  const setRecipeColor = (color) => {
    setRecipe(r => ({ ...r, themeColor: color }));
    setColorPickerOpen(false);
  };

  // ============================================================
  // Library
  // ============================================================
  const saveRecipeToLibrary = () => {
    const exists = library.find(r => r.id === recipe.id);
    if (exists) {
      setLibrary(library.map(r => r.id === recipe.id ? recipe : r));
      showToast('Rezept aktualisiert ✓');
    } else {
      setLibrary([...library, recipe]);
      showToast('Rezept in Bibliothek gespeichert ✓');
    }
  };

  const newRecipe = () => {
    setConfirmDialog({
      title: 'Neues Rezept erstellen?',
      message: 'Das aktuelle Rezept wird verworfen. Vorher speichern?',
      confirmLabel: 'Neu erstellen',
      danger: false,
      onConfirm: () => {
        setRecipe({
          id: 'r-' + Math.random().toString(36).slice(2, 8),
          name: 'Neues Rezept',
          themeColor: '#10b981',
          notes: '',
          saltMode: 'kuerzel',
          measured: { pH: null, pHTarget: null, phAdjust: {}, ecValues: [] },
          targets: {},
          groups: [],
        });
        setViewMode('compact');
        showToast('Neues Rezept erstellt');
      },
    });
  };

  const openRecipe = (r) => {
    setRecipe(r);
    setLibraryOpen(false);
    showToast(`"${r.name}" geöffnet`);
  };

  // ============================================================
  // Render
  // ============================================================
  const D = isDark;

  // CSS variables cascade to all child components — no prop-threading needed for accent
  const accentColor   = accent?.accent || '#10b981';
  const accentSoft    = accent?.soft   || 'rgba(16,185,129,0.15)';
  const accentHover   = accent?.hover  || '#34d399';

  return (
    <div className="pb-2" style={{ '--sys-accent': accentColor, '--sys-soft': accentSoft, '--sys-hover': accentHover, zoom: pageZoom }}>
      {/* Rezept-Zeile (Rezeptname + Undo/Redo/Zoom/Kebab)
          Früher als sticky Top-Header; ist jetzt normaler Seiteninhalt und
          scrollt mit. Der globale App-Header (mit Erlenmeyer-Icon + Modulnamen
          + Auto-Hide-Verhalten) wird darüber von App.jsx gerendert. */}
      <div className="mb-4">
        <div className={`py-2.5 flex items-center gap-2 border-b ${D ? 'border-neutral-800/60' : 'border-neutral-200'}`}>
          {/* Flask icon — matches other module headers */}
          <FlaskConical size={18} className="flex-shrink-0" style={{ color: accent?.accent || themeColor }} />

          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Rezept</div>
            {editingRecipeName ? (
              <div className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={recipeNameDraft}
                  onChange={e => setRecipeNameDraft(e.target.value)}
                  onBlur={() => { setTimeout(() => { if (!colorPickerOpen) commitRecipeName(); }, 100); }}
                  onKeyDown={e => { if (e.key === 'Enter') commitRecipeName(); if (e.key === 'Escape') { setRecipeNameDraft(recipe.name); setEditingRecipeName(false); setColorPickerOpen(false); } }}
                  autoFocus
                  className={`text-lg font-semibold rounded px-2 py-0.5 outline-none ring-2 ring-emerald-500 flex-1 min-w-0 ${D ? 'bg-neutral-800' : 'bg-[#fffcf5] border border-neutral-300'}`}
                  style={{ color: themeColor }}
                />
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setColorPickerOpen(!colorPickerOpen)}
                  className="w-9 h-9 rounded-lg flex-shrink-0 border-2 hover:scale-105 transition-transform"
                  style={{ background: themeColor, borderColor: '#404040' }}
                />
                {colorPickerOpen && (
                  <ColorPickerPopover current={themeColor} onPick={setRecipeColor} onClose={() => setColorPickerOpen(false)} />
                )}
              </div>
            ) : (
              <button
                onClick={() => setEditingRecipeName(true)}
                className={`text-lg font-semibold truncate rounded px-1 -mx-1 block max-w-full text-left ${D ? 'hover:bg-neutral-800/50' : 'hover:bg-neutral-200/60'}`}
                style={{ color: themeColor }}
              >
                {recipe.name}
              </button>
            )}
          </div>

          {/* Undo / Redo / Kebab — tightly grouped, matching GroupHeaderRow button style */}
          <div className="flex items-center flex-shrink-0">
            <button onClick={undo} disabled={undoStack.length === 0}
              title="Rückgängig"
              className={`w-7 h-7 rounded flex items-center justify-center text-neutral-400 disabled:cursor-not-allowed transition-colors ${D ? 'hover:bg-neutral-800 disabled:text-neutral-700' : 'hover:bg-neutral-200 disabled:text-neutral-300'}`}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5"/>
              </svg>
            </button>
            <button onClick={redo} disabled={redoStack.length === 0}
              title="Wiederholen"
              className={`w-7 h-7 rounded flex items-center justify-center text-neutral-400 disabled:cursor-not-allowed transition-colors ${D ? 'hover:bg-neutral-800 disabled:text-neutral-700' : 'hover:bg-neutral-200 disabled:text-neutral-300'}`}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </button>

          {/* Zoom button */}
          {(() => {
            const isZoomed = viewMode === 'compact' ? recipeZoom < 1 : tableViewOverview;
            return (
              <button onClick={cycleRecipeZoom} title="Ansicht verkleinern / zurücksetzen"
                className="w-7 h-7 rounded flex items-center justify-center transition-colors flex-shrink-0"
                style={{
                  color: isZoomed ? accentColor : (D ? '#6b7280' : '#9ca3af'),
                  background: isZoomed ? accentSoft : 'transparent',
                }}>
                {isZoomed ? (
                  <span className="text-[10px] font-bold leading-none">
                    {viewMode === 'compact' ? `${Math.round(recipeZoom * 100)}%` : '50%'}
                  </span>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                    <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
                  </svg>
                )}
              </button>
            );
          })()}

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setKebabOpen(!kebabOpen)}
              className={`w-7 h-7 rounded flex items-center justify-center text-neutral-500 ${D ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {kebabOpen && (
              <KebabMenu
                onClose={() => setKebabOpen(false)}
                saltMode={saltMode}
                setSaltMode={(m) => setRecipe(r => ({ ...r, saltMode: m }))}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onNewRecipe={() => { setKebabOpen(false); newRecipe(); }}
                onOpenLibrary={() => { setKebabOpen(false); setLibraryOpen(true); }}
                onSave={() => { setKebabOpen(false); saveRecipeToLibrary(); }}
                onPdfExport={() => { setKebabOpen(false); setPdfOpen(true); }}
                onDosingGuide={() => { setKebabOpen(false); setDosingGuideOpen(true); }}
              />
            )}
          </div>
          </div>{/* end undo/redo/kebab group */}
        </div>
      </div>

      {/* Stats bar (compact mode) */}
      {viewMode === 'compact' && recipe.groups.length > 0 && (
        <RecipeStatsBar recipe={recipe} selectedGroupIds={selectedGroupIds} onClearSelection={clearSelection} onCreateCombo={handleCreateCombo} themeColor={themeColor} isDark={D} />
      )}

      {/* Alle-auswählen — erscheint ab 2 Gruppen in beiden Ansichten */}
      {recipe.groups.length > 1 && (
        <div className="flex items-center justify-between gap-3 px-1 mb-2">
          <div className="flex items-center gap-3">
            {selectedGroupIds.size > 0 && (
              <div className="text-[10px] mono text-neutral-500">
                {selectedGroupIds.size}/{recipe.groups.length} gewählt
              </div>
            )}
            {selectedGroupIds.size > 0 && (
              <button onClick={handleCreateCombo}
                className="text-[10px] underline font-medium"
                style={{ color: 'var(--sys-accent)' }}>
                Kombination erzeugen
              </button>
            )}
          </div>
          <button
            onClick={toggleAllGroups}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 transition-colors flex-shrink-0"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; }}
          >
            {allGroupsSelected ? 'Alle abwählen' : 'Alle auswählen'}
            <div
              className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
              style={allGroupsSelected
                ? { background: 'var(--sys-accent)', borderColor: 'var(--sys-hover)' }
                : { borderColor: '#525252' }}
            >
              {allGroupsSelected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Table */}
      {viewMode === 'compact' ? (
        <DndContext sensors={dndSensors} collisionDetection={closestCenter}
          onDragStart={handleDndStart} onDragEnd={handleDndEnd} onDragCancel={handleDndCancel}>
        <div className="space-y-3">
          <SortableContext items={recipe.groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          {recipe.groups.map(group => (
            <SortableGroupBlock
              key={group.id}
              group={group}
              recipe={recipe}
              themeColor={themeColor}
              useElementColors={useElementColors}
              elementColors={elementColors}
              saltMode={saltMode}
              saltLang={saltLang}
              onUpdateGroup={(g) => updateGroup(group.id, () => g)}
              onDeleteGroup={deleteGroup}
              onAddSalt={(gid) => setSaltPicker({ groupId: gid })}
              onOpenElement={setOpenElement}
              onRemoveSalt={removeSalt}
              onOpenGroupDetail={setOpenGroupId}
              selected={selectedGroupIds.has(group.id)}
              onToggleSelect={toggleGroupSelection}
              onConvertKind={convertGroupKind}
              onToggleFoliar={toggleGroupFoliar}
              renameSignal={renameSignals[group.id] || 0}
              onRenameComplete={handleRenameComplete}
              GroupActionsMenuComponent={GroupActionsMenu}
              isDark={D}
              flashSaltIds={localFlashIds}
            />
          ))}
          </SortableContext>
          {recipe.groups.length === 0 && (
            <div className={`text-center py-10 px-4 rounded-xl border ${D ? 'bg-neutral-900/40 border-neutral-800/60' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="text-neutral-400 text-sm mb-1">Noch keine Gruppen in diesem Rezept.</div>
              <div className={`text-xs ${D ? 'text-neutral-600' : 'text-neutral-400'}`}>Lege unten eine neue Gruppe an.</div>
            </div>
          )}
          <button
            onClick={addGroup}
            className={`w-full py-3 rounded-xl border-2 border-dashed text-neutral-500 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${D ? 'border-neutral-800' : 'border-neutral-300'}`}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; e.currentTarget.style.borderColor = 'var(--sys-accent)'; e.currentTarget.style.background = 'var(--sys-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Neue Gruppe
          </button>
          {recipe.groups.length > 0 && (
            <FooterTotals
              recipe={recipe}
              useElementColors={useElementColors}
              elementColors={elementColors}
              onOpenElement={setOpenElement}
              onTargetChange={(sym, val) => setRecipe(r => ({ ...r, targets: { ...(r.targets || {}), [sym]: val } }))}
              isDark={D}
            />
          )}
        </div>
        <DragOverlay>
          {activeDnd?.type === 'salt' && activeDnd.salt && activeDnd.group && (
            <div className="rounded-lg bg-neutral-800 border border-neutral-600 shadow-2xl overflow-hidden">
              <SaltRow
                salt={activeDnd.salt}
                elements={elementsInGroup(activeDnd.group)}
                useElementColors={useElementColors}
                elementColors={elementColors}
                saltMode={saltMode}
                saltLang={saltLang}
                nameWidth={TABLE_DIMS.nameW[saltMode] || TABLE_DIMS.nameW.kuerzel}
                onUpdate={() => {}}
                onRemove={() => {}}
                saltOwnElements={new Set([
                  ...Object.keys(activeDnd.salt._pcts || {}),
                  ...Object.entries(activeDnd.salt.contributions || {}).filter(([, v]) => (v || 0) > 0).map(([k]) => k),
                ])}
                isDark={D}
              />
            </div>
          )}
          {activeDnd?.type === 'group' && activeDnd.group && (
            <div className="rounded-xl bg-neutral-800 border shadow-2xl px-3 py-2 text-sm font-medium text-neutral-100"
              style={{ borderColor: themeColor }}>
              {activeDnd.group.name || 'Gruppe'} · {activeDnd.group.salts.length} Salze
            </div>
          )}
        </DragOverlay>
        </DndContext>
      ) : (
        <>
          <FullTableView
            recipe={recipe}
            themeColor={themeColor}
            useElementColors={useElementColors}
            elementColors={elementColors}
            saltMode={saltMode}
            saltLang={saltLang}
            onUpdateRecipe={setRecipe}
            onOpenElement={setOpenElement}
            onAddSalt={(gid) => setSaltPicker({ groupId: gid })}
            onRemoveSalt={removeSalt}
            onDeleteGroup={deleteGroup}
            onTargetChange={(sym, val) => setRecipe(r => ({ ...r, targets: { ...(r.targets || {}), [sym]: val } }))}
            onOpenGroupDetail={setOpenGroupId}
            selectedGroupIds={selectedGroupIds}
            onToggleSelect={toggleGroupSelection}
            onConvertKind={convertGroupKind}
            onToggleFoliar={toggleGroupFoliar}
            renameSignals={renameSignals}
            onRenameComplete={handleRenameComplete}
            GroupActionsMenuComponent={GroupActionsMenu}
            isDark={D}
            userZoom={tableViewOverview ? 0.5 : 1}
          />
          {recipe.groups.length === 0 && (
            <div className={`mt-3 text-center py-10 px-4 rounded-xl border ${D ? 'bg-neutral-900/40 border-neutral-800/60' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="text-neutral-400 text-sm mb-1">Noch keine Gruppen in diesem Rezept.</div>
            </div>
          )}
          <button
            onClick={addGroup}
            className={`mt-3 w-full py-3 rounded-xl border-2 border-dashed text-neutral-500 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${D ? 'border-neutral-800' : 'border-neutral-300'}`}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; e.currentTarget.style.borderColor = 'var(--sys-accent)'; e.currentTarget.style.background = 'var(--sys-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Neue Gruppe
          </button>
        </>
      )}

      {/* Measured values */}
      {recipe.groups.length > 0 && (
        <div ref={ecSectionRef}>
          <MeasuredValues
            ref={measuredValuesRef}
            recipe={recipe}
            onUpdate={(measured) => setRecipe(r => ({ ...r, measured }))}
            ecValues={ecValues}
            onAddEc={addEcValue}
            onUpdateEc={updateEcValue}
            onRemoveEc={removeEcValue}
            onReorderEc={reorderEcValues}
            selectedGroupIds={selectedGroupIds}
            groups={recipe.groups}
            isDark={D}
          />
        </div>
      )}

      {/* Dosieranleitung button — above action buttons */}
      {recipe.groups.length > 0 && (
        <button
          onClick={() => setDosingGuideOpen(true)}
          className={`w-full mt-4 py-3 rounded-xl border text-neutral-500 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${D ? 'border-neutral-800' : 'border-neutral-300'}`}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--sys-accent)'; e.currentTarget.style.borderColor = 'var(--sys-accent)'; e.currentTarget.style.background = 'var(--sys-soft)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          Dosieranleitung
        </button>
      )}

      {/* Action buttons — Auswertung + Speichern */}
      {recipe.groups.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setAnalysisOpen(true)}
            className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              D ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
            }`}
            style={selectedGroupIds.size > 0 ? { background: 'var(--sys-soft)', borderColor: 'var(--sys-accent)', color: 'var(--sys-hover)' } : {}}
            onMouseEnter={selectedGroupIds.size > 0 ? e => { e.currentTarget.style.opacity = '0.85'; } : undefined}
            onMouseLeave={selectedGroupIds.size > 0 ? e => { e.currentTarget.style.opacity = ''; } : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="20" x2="4" y2="14"/><line x1="10" y1="20" x2="10" y2="6"/>
              <line x1="16" y1="20" x2="16" y2="10"/><line x1="20" y1="20" x2="20" y2="16"/>
            </svg>
            Auswertung
            {selectedGroupIds.size > 0 && (
              <span className="ml-1 text-[10px] mono px-1.5 py-px rounded" style={{ background: 'var(--sys-soft)', color: 'var(--sys-hover)' }}>
                {selectedGroupIds.size}
              </span>
            )}
          </button>
          <button
            onClick={saveRecipeToLibrary}
            className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-colors"
            style={{ background: 'var(--sys-accent)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sys-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--sys-accent)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Speichern
          </button>
        </div>
      )}

      {/* Popovers */}
      {openElement && (
        <ElementDetailPopover
          element={openElement}
          recipe={recipe}
          useColor={useElementColors}
          elementColors={elementColors}
          onClose={() => setOpenElement(null)}
          onTargetChange={(sym, val) => setRecipe(r => ({ ...r, targets: { ...(r.targets || {}), [sym]: val } }))}
        />
      )}
      {openGroupId && (
        <GroupDetailPopover
          groupId={openGroupId}
          recipe={recipe}
          useColor={useElementColors}
          elementColors={elementColors}
          onClose={() => setOpenGroupId(null)}
          onOpenElement={(sym) => { setOpenGroupId(null); setOpenElement(sym); }}
        />
      )}
      {analysisOpen && (
        <AnalysisPopover
          recipe={recipe}
          selectedGroupIds={selectedGroupIds}
          useColor={useElementColors}
          elementColors={elementColors}
          onClose={() => setAnalysisOpen(false)}
          onOpenElement={(sym) => { setAnalysisOpen(false); setOpenElement(sym); }}
          onClearSelection={clearSelection}
        />
      )}
      <SaltPickerPopover
        open={!!saltPicker}
        replaceMode={!!saltPicker?.saltId}
        onClose={() => setSaltPicker(null)}
        onPick={handlePickerResult}
        availableSalts={availableSalts}
        useElementColors={useElementColors}
        elementColors={elementColors}
        lang={saltLang}
      />
      {confirmDialog && (
        <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(null)} />
      )}
      {libraryOpen && (
        <LibraryPanel
          onClose={() => setLibraryOpen(false)}
          library={library}
          onOpen={openRecipe}
          onDelete={(id) => setLibrary(library.filter(r => r.id !== id))}
          currentId={recipe.id}
        />
      )}

      <Toast message={toast?.msg} type={toast?.type} show={!!toast} />

      {pdfOpen && (
        <PdfModal
          recipe={recipe}
          onClose={() => setPdfOpen(false)}
          onPrint={handlePdfPrint}
        />
      )}

      {/* Always rendered, hidden on screen, shown on print via @media print */}
      <PrintDocument
        recipe={recipe}
        selectedIds={printSettings.selectedIds}
        colorMode={printSettings.colorMode}
        elementColors={elementColors}
        useElementColors={useElementColors}
        orientation={printSettings.orientation}
        lang={lang}
      />

      {/* Dosieranleitung Overlay */}
      {dosingGuideOpen && (
        <DosingGuide
          recipe={recipe}
          onClose={() => setDosingGuideOpen(false)}
          onAddCombination={addEcValue}
          onUpdateCombination={updateEcValue}
          onRemoveCombination={removeEcValue}
          onAddPhase={addPhase}
          onUpdatePhase={updatePhase}
          onRemovePhase={removePhase}
          onReorderPhases={reorderPhases}
          onSaveGuideSettings={saveGuideSettings}
          isDark={D}
          accent={accent}
          lang={lang}
        />
      )}
    </div>
  );
}
