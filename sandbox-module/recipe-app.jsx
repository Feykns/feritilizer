// ============================================================
// RECIPE APP — Top-Level mit Theme-Color, Rezept-Verwaltung
// ============================================================

const { useState, useEffect, useMemo, useRef } = React;

const STORAGE_KEY = 'growculator-recipe-v1';
const RECIPES_LIBRARY_KEY = 'growculator-recipes-library';
const USE_ELEMENT_COLORS_KEY = 'growculator-element-colors';
const SALT_LANG_KEY = 'growculator-salt-lang';

function App() {
  // Aktuelles Rezept
  const [recipe, setRecipe] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: themeColor fallback
        if (!parsed.themeColor) parsed.themeColor = '#10b981';
        return parsed;
      }
    } catch (e) {}
    return SAMPLE_RECIPE;
  });

  // Rezept-Bibliothek (mehrere gespeicherte Rezepte)
  const [library, setLibrary] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECIPES_LIBRARY_KEY)) || []; } catch (e) { return []; }
  });

  const [view, setView] = useState('table');
  const [viewMode, setViewMode] = useState('compact');
  const [useElementColors, setUseElementColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USE_ELEMENT_COLORS_KEY)) ?? true; } catch (e) { return true; }
  });
  const [saltLang, setSaltLang] = useState(() => {
    try { return localStorage.getItem(SALT_LANG_KEY) || 'en'; } catch (e) { return 'en'; }
  });

  const [openElement, setOpenElement] = useState(null);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [saltPicker, setSaltPicker] = useState(null);
  const [toast, setToast] = useState(null);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [editingRecipeName, setEditingRecipeName] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [recipeNameDraft, setRecipeNameDraft] = useState(recipe.name);
  const [confirmDialog, setConfirmDialog] = useState(null); // {title, message, onConfirm}
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState(() => new Set());
  // Pro Gruppe ein "Rename-Signal" — wird hochgezählt, um den Header in den Edit-Modus zu zwingen
  const [renameSignals, setRenameSignals] = useState({});

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipe)); } catch (e) {}
  }, [recipe]);
  useEffect(() => {
    try { localStorage.setItem(RECIPES_LIBRARY_KEY, JSON.stringify(library)); } catch (e) {}
  }, [library]);
  useEffect(() => {
    try { localStorage.setItem(USE_ELEMENT_COLORS_KEY, JSON.stringify(useElementColors)); } catch (e) {}
  }, [useElementColors]);
  useEffect(() => {
    try { localStorage.setItem(SALT_LANG_KEY, saltLang); } catch (e) {}
  }, [saltLang]);

  useEffect(() => { setRecipeNameDraft(recipe.name); }, [recipe.name]);

  // Auswahl löschen wenn ein anderes Rezept geladen wird
  useEffect(() => { setSelectedGroupIds(new Set()); }, [recipe.id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // ============================================================
  // Operations
  // ============================================================
  const updateGroup = (groupId, updater) => {
    setRecipe(r => ({
      ...r,
      groups: r.groups.map(g => g.id === groupId ? (typeof updater === 'function' ? updater(g) : updater) : g)
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
      groups: [...r.groups, {
        id, name: '', volume: 5, factor: 100, mlPerL: 10, kind: 'stock', salts: []
      }]
    }));
  };

  // Salz aus Gruppe entfernen — bei letztem Salz: Gruppe auto-löschen
  const removeSalt = (groupId, saltId, saltName) => {
    setConfirmDialog({
      title: 'Salz entfernen?',
      message: `Soll "${saltName}" wirklich aus dieser Gruppe gelöscht werden?`,
      onConfirm: () => {
        setRecipe(r => {
          const groups = r.groups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, salts: g.salts.filter(s => s.id !== saltId) };
          }).filter(g => g.salts.length > 0); // leere Gruppen werden automatisch entfernt
          return { ...r, groups };
        });
        showToast('Salz entfernt');
      },
    });
  };

  const addSaltToGroup = (groupId, saltDef) => {
    const id = 's-' + Math.random().toString(36).slice(2, 8);
    const defaultMass = 100;
    const contributions = {};
    Object.entries(saltDef.contributions || {}).forEach(([sym, pct]) => {
      contributions[sym] = pct * defaultMass / 100;
    });
    const newSalt = {
      id,
      shortName: saltDef.shortName,
      formula: saltDef.formula,
      name: saltDef.name,
      nameEN: saltDef.nameEN || saltDef.name,
      mass: defaultMass, massUnit: 'g',
      pricePerKg: saltDef.pricePerKg,
      contributions,
      nh4Fraction: saltDef.nh4Fraction || 0,
    };
    updateGroup(groupId, g => ({ ...g, salts: [...g.salts, newSalt] }));
  };

  const replaceSalt = (groupId, saltId, saltDef) => {
    updateGroup(groupId, g => ({
      ...g,
      salts: g.salts.map(s => {
        if (s.id !== saltId) return s;
        const contributions = {};
        Object.entries(saltDef.contributions || {}).forEach(([sym, pct]) => {
          contributions[sym] = pct * s.mass / 100;
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
      })
    }));
  };

  // ============================================================
  // Selection / Convert / EC-Werte
  // ============================================================
  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };
  const clearSelection = () => setSelectedGroupIds(new Set());

  const convertGroupKind = (groupId, newKind) => {
    setRecipe(r => ({
      ...r,
      groups: r.groups.map(g => {
        if (g.id !== groupId) return g;
        if (newKind === 'solo') {
          // Konzentrat → Endlösung: Endvolumen = altes Stock-Volumen × Faktor
          // ppm-Werte (contributions) und Salzmassen bleiben — die Düngerlösung ist physisch dieselbe
          const oldFactor = g.factor || 1;
          const oldVol = g.volume || 1;
          return {
            ...g,
            kind: 'solo',
            factor: null,
            mlPerL: null,
            volume: oldVol * oldFactor,
          };
        }
        if (newKind === 'stock') {
          // Endlösung → Konzentrat: Default-Faktor 100. Stock-Volumen = Endvolumen / Faktor
          const newFactor = 100;
          const oldVol = g.volume || 1;
          return {
            ...g,
            kind: 'stock',
            factor: newFactor,
            mlPerL: 1000 / newFactor,
            volume: oldVol / newFactor,
          };
        }
        return g;
      })
    }));
    showToast(newKind === 'solo' ? 'Gruppe ist jetzt Endlösung' : 'Gruppe ist jetzt Konzentrat');
  };

  const triggerRename = (groupId) => {
    setRenameSignals(s => ({ ...s, [groupId]: (s[groupId] || 0) + 1 }));
  };

  // EC-Werte: array {id, name, groupIds[], value}
  const ecValues = recipe.measured?.ecValues || [];
  const addEcValue = (name, value) => {
    const groupIds = [...selectedGroupIds];
    const entry = {
      id: 'ec-' + Math.random().toString(36).slice(2, 8),
      name: name || 'EC',
      groupIds,
      value,
    };
    setRecipe(r => ({
      ...r,
      measured: { ...(r.measured || {}), ecValues: [...(r.measured?.ecValues || []), entry] }
    }));
    showToast('EC-Wert hinzugefügt');
  };
  const updateEcValue = (id, patch) => {
    setRecipe(r => ({
      ...r,
      measured: {
        ...(r.measured || {}),
        ecValues: (r.measured?.ecValues || []).map(e => e.id === id ? { ...e, ...patch } : e)
      }
    }));
  };
  const removeEcValue = (id) => {
    setRecipe(r => ({
      ...r,
      measured: {
        ...(r.measured || {}),
        ecValues: (r.measured?.ecValues || []).filter(e => e.id !== id)
      }
    }));
  };

  const handlePickerResult = (result) => {
    if (!saltPicker) return;
    const arr = Array.isArray(result) ? result : [result];
    if (saltPicker.saltId) {
      // Ersetzen-Modus — immer Einzel-Salz
      if (arr[0]) replaceSalt(saltPicker.groupId, saltPicker.saltId, arr[0]);
      setSaltPicker(null);
      showToast('Salz ersetzt');
      return;
    }
    // Hinzufügen — eines oder mehrere
    arr.forEach(s => addSaltToGroup(saltPicker.groupId, s));
    setSaltPicker(null);
    if (arr.length === 1) showToast('Salz hinzugefügt');
    else if (arr.length > 1) showToast(`${arr.length} Salze hinzugefügt`);
  };

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
  // Rezept-Verwaltung
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
      onConfirm: () => {
        setRecipe({
          id: 'r-' + Math.random().toString(36).slice(2, 8),
          name: 'Neues Rezept',
          themeColor: '#10b981',
          notes: '',
          saltMode: 'kuerzel',
          measured: { EC: null, pH: null },
          targets: {},
          groups: [],
        });
        // Auto-switch to compact mode so user sees the add-group button
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

  const deleteCurrentRecipe = () => {
    setConfirmDialog({
      title: 'Rezept löschen?',
      message: `Das Rezept "${recipe.name}" wird endgültig aus der Bibliothek entfernt.`,
      confirmLabel: 'Löschen',
      danger: true,
      onConfirm: () => {
        setLibrary(library.filter(r => r.id !== recipe.id));
        showToast('Rezept gelöscht');
      },
    });
  };

  // ============================================================
  // Rendering
  // ============================================================
  const themeColor = recipe.themeColor || '#10b981';
  const saltMode = recipe.saltMode || 'kuerzel';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-24">
      {/* App Header */}
      <header className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur border-b border-neutral-900">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setView(view === 'table' ? 'calculator' : 'table')}
            className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0"
            title={view === 'table' ? 'Zum Rechner' : 'Zur Tabelle'}
          >
            {view === 'table' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {view === 'table' ? (
              <>
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
                      className="text-lg font-semibold bg-neutral-800 rounded px-2 py-0.5 outline-none ring-2 ring-emerald-500 flex-1 min-w-0"
                      style={{ color: themeColor }}
                    />
                    {/* Farbpicker-Kachel: nur Farbe, kein Icon */}
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setColorPickerOpen(!colorPickerOpen)}
                      className="w-9 h-9 rounded-lg flex-shrink-0 border-2 hover:scale-105 transition-transform"
                      style={{ background: themeColor, borderColor: '#404040' }}
                      title="Themenfarbe wählen"
                    />
                    {colorPickerOpen && (
                      <ColorPickerPopover
                        current={themeColor}
                        onPick={setRecipeColor}
                        onClose={() => setColorPickerOpen(false)}
                      />
                    )}
                  </div>
                ) : (
                  <button onClick={() => setEditingRecipeName(true)}
                          className="text-lg font-semibold truncate hover:bg-neutral-800/50 rounded px-1 -mx-1 block max-w-full text-left"
                          style={{ color: themeColor }}>
                    {recipe.name}
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Growculator</div>
                <div className="text-lg font-semibold">Nährstoffberechnung</div>
              </>
            )}
          </div>

          {view === 'table' && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setKebabOpen(!kebabOpen)}
                className="w-9 h-9 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              {kebabOpen && (
                <KebabMenu
                  onClose={() => setKebabOpen(false)}
                  saltMode={saltMode}
                  setSaltMode={(m) => setRecipe(r => ({ ...r, saltMode: m }))}
                  viewMode={viewMode} setViewMode={setViewMode}
                  useElementColors={useElementColors} setUseElementColors={setUseElementColors}
                  onNewRecipe={() => { setKebabOpen(false); newRecipe(); }}
                  onOpenLibrary={() => { setKebabOpen(false); setLibraryOpen(true); }}
                  onSave={() => { setKebabOpen(false); saveRecipeToLibrary(); }}
                  onExportPDF={() => { setKebabOpen(false); showToast('PDF-Export folgt in Phase 4'); }}
                  onSettings={() => { setKebabOpen(false); setSettingsOpen(true); }}
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
        {view === 'calculator' ? (
          <CalculatorMini onTransfer={() => {
            setView('table');
            showToast('Werte in Tabelle übertragen ✓');
          }} />
        ) : (
          <>
            {/* Statistik-Felder oben (nur Kompakt-Ansicht) */}
            {viewMode === 'compact' && recipe.groups.length > 0 && (
              <RecipeStatsBar recipe={recipe} selectedGroupIds={selectedGroupIds} onClearSelection={clearSelection} themeColor={themeColor} />
            )}

            {/* Tabelle */}
            {viewMode === 'compact' ? (
              <div className="space-y-3">
                {recipe.groups.map(group => (
                  <GroupBlock
                    key={group.id}
                    group={group}
                    recipe={recipe}
                    themeColor={themeColor}
                    useElementColors={useElementColors}
                    saltMode={saltMode}
                    saltLang={saltLang}
                    onUpdateGroup={(g) => updateGroup(group.id, () => g)}
                    onDeleteGroup={deleteGroup}
                    onAddSalt={(gid) => setSaltPicker({ groupId: gid })}
                    onOpenElement={setOpenElement}
                    onPickSalt={(gid, sid) => setSaltPicker({ groupId: gid, saltId: sid })}
                    onRemoveSalt={removeSalt}
                    onOpenGroupDetail={setOpenGroupId}
                    selected={selectedGroupIds.has(group.id)}
                    onToggleSelect={toggleGroupSelection}
                    onConvertKind={convertGroupKind}
                    renameSignal={renameSignals[group.id] || 0}
                  />
                ))}
                {recipe.groups.length === 0 && (
                  <div className="text-center py-10 px-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
                    <div className="text-neutral-400 text-sm mb-1">Noch keine Gruppen in diesem Rezept.</div>
                    <div className="text-neutral-600 text-xs">Lege unten eine neue Gruppe an oder importiere Werte vom Rechner.</div>
                  </div>
                )}
                <button
                  onClick={addGroup}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900/50 text-neutral-500 hover:text-emerald-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Neue Gruppe
                </button>

                {/* Gesamtbilanz */}
                {recipe.groups.length > 0 && (
                  <FooterTotals recipe={recipe} useElementColors={useElementColors} onOpenElement={setOpenElement}
                                onTargetChange={(sym, val) => setRecipe(r => ({ ...r, targets: { ...(r.targets || {}), [sym]: val } }))} />
                )}
              </div>
            ) : (
              <>
                <FullTableView
                  recipe={recipe}
                  themeColor={themeColor}
                  useElementColors={useElementColors}
                  saltMode={saltMode}
                  saltLang={saltLang}
                  onUpdateRecipe={setRecipe}
                  onOpenElement={setOpenElement}
                  onPickSalt={(gid, sid) => setSaltPicker({ groupId: gid, saltId: sid })}
                  onAddSalt={(gid) => setSaltPicker({ groupId: gid })}
                  onRemoveSalt={removeSalt}
                  onDeleteGroup={deleteGroup}
                  onTargetChange={(sym, val) => setRecipe(r => ({ ...r, targets: { ...(r.targets || {}), [sym]: val } }))}
                  onOpenGroupDetail={setOpenGroupId}
                  selectedGroupIds={selectedGroupIds}
                  onToggleSelect={toggleGroupSelection}
                  onConvertKind={convertGroupKind}
                  renameSignals={renameSignals}
                />
                {recipe.groups.length === 0 ? (
                  <div className="mt-3 text-center py-10 px-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
                    <div className="text-neutral-400 text-sm mb-1">Noch keine Gruppen in diesem Rezept.</div>
                    <div className="text-neutral-600 text-xs">Wechsle in die Kompakt-Ansicht oder leg unten eine neue Gruppe an.</div>
                  </div>
                ) : null}
                <button
                  onClick={addGroup}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-900/50 text-neutral-500 hover:text-emerald-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Neue Gruppe
                </button>
              </>
            )}

            {/* Messwerte */}
            {recipe.groups.length > 0 && (
              <MeasuredValues
                recipe={recipe}
                onUpdate={(measured) => setRecipe(r => ({ ...r, measured }))}
                ecValues={ecValues}
                onAddEc={addEcValue}
                onUpdateEc={updateEcValue}
                onRemoveEc={removeEcValue}
                selectedGroupIds={selectedGroupIds}
                groups={recipe.groups}
              />
            )}

            {/* Aktions-Buttons */}
            {recipe.groups.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => setAnalysisOpen(true)}
                        className={`py-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          selectedGroupIds.size > 0
                            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200 hover:bg-emerald-950/60'
                            : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'
                        }`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="20" x2="4" y2="14"/>
                    <line x1="10" y1="20" x2="10" y2="6"/>
                    <line x1="16" y1="20" x2="16" y2="10"/>
                    <line x1="20" y1="20" x2="20" y2="16"/>
                  </svg>
                  Auswertung
                  {selectedGroupIds.size > 0 && (
                    <span className="ml-1 text-[10px] mono px-1.5 py-px rounded bg-emerald-700/40 text-emerald-200">
                      {selectedGroupIds.size}
                    </span>
                  )}
                </button>
                <button onClick={saveRecipeToLibrary}
                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold flex items-center justify-center gap-2 text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Speichern
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom-Nav */}
      <BottomNav view={view} setView={setView} onSettings={() => setSettingsOpen(true)} />

      {/* Popovers */}
      {openElement && (
        <ElementDetailPopover
          element={openElement}
          recipe={recipe}
          useColor={useElementColors}
          onClose={() => setOpenElement(null)}
        />
      )}
      {openGroupId && (
        <GroupDetailPopover
          groupId={openGroupId}
          recipe={recipe}
          useColor={useElementColors}
          onClose={() => setOpenGroupId(null)}
          onOpenElement={(sym) => { setOpenGroupId(null); setOpenElement(sym); }}
        />
      )}
      {analysisOpen && (
        <AnalysisPopover
          recipe={recipe}
          selectedGroupIds={selectedGroupIds}
          useColor={useElementColors}
          onClose={() => setAnalysisOpen(false)}
          onOpenElement={(sym) => { setAnalysisOpen(false); setOpenElement(sym); }}
          onClearSelection={() => clearSelection()}
        />
      )}
      <SaltPickerPopover
        open={!!saltPicker}
        replaceMode={!!saltPicker?.saltId}
        onClose={() => setSaltPicker(null)}
        onPick={handlePickerResult}
      />
      {confirmDialog && (
        <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog(null)} />
      )}
      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          saltLang={saltLang} setSaltLang={setSaltLang}
          useElementColors={useElementColors} setUseElementColors={setUseElementColors}
        />
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

      <Toast message={toast} show={!!toast} />
    </div>
  );
}

// ============================================================
// ColorPickerPopover — Themenfarbe für Rezept
// ============================================================
function ColorPickerPopover({ current, onPick, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (!e.target.closest('[data-color-picker]')) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div data-color-picker
         className="absolute top-full right-0 mt-2 z-40 bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl p-2 grid grid-cols-4 gap-1.5">
      {THEME_COLOR_PALETTE.map(c => (
        <button
          key={c}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(c)}
          className="w-9 h-9 rounded-lg hover:scale-110 transition-transform flex items-center justify-center"
          style={{ background: c, boxShadow: current === c ? `0 0 0 2px white` : 'none' }}
        >
          {current === c && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// RECIPE STATS BAR — 3 getrennte Karten (Kompakt-Ansicht)
// Reagiert dynamisch auf Gruppen-Selektion
// ============================================================
function RecipeStatsBar({ recipe, selectedGroupIds, onClearSelection, themeColor }) {
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

  const selStyle = hasSel ? {
    borderColor: `${themeColor}66`,
    boxShadow: `inset 0 0 0 1px ${themeColor}33`,
  } : { borderColor: '#262626' };

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
        />
        <StatTile
          label="Gruppen"
          value={groups.length}
          unit=""
          sub={`${nSalts} Salze`}
          style={selStyle}
        />
      </div>
      {hasSel && (
        <div className="mt-1.5 flex items-center justify-between px-1">
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: themeColor }}>
            Auswahl · {selectedGroupIds.size} Gruppe{selectedGroupIds.size === 1 ? '' : 'n'}
          </div>
          <button onClick={onClearSelection}
                  className="text-[10px] text-neutral-400 hover:text-emerald-400 underline">
            Auswahl aufheben
          </button>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, unit, sub, accent, style }) {
  return (
    <div className="rounded-xl bg-neutral-900/60 border p-3 transition-colors" style={style}>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">{label}</div>
      <div className="mono text-lg font-semibold leading-tight" style={{ color: accent || '#fafafa' }}>
        {value}
        {unit && <span className="text-xs font-normal text-neutral-500 ml-0.5">{unit}</span>}
      </div>
      {sub && <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

// ============================================================
// MEASURED VALUES — links: benannte EC-Werte mit + & inline-Edit
//                   rechts: pH Ist / pH Soll untereinander
// ============================================================
function MeasuredValues({ recipe, onUpdate, ecValues = [], onAddEc, onUpdateEc, onRemoveEc, selectedGroupIds, groups }) {
  const measured = recipe.measured || {};
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'name' | 'value'
  const [editDraft, setEditDraft] = useState('');
  const [phEditing, setPhEditing] = useState(null); // 'pH' | 'pHTarget'
  const [phDraft, setPhDraft] = useState('');
  const editInputRef = useRef(null);
  const phInputRef = useRef(null);
  const newNameRef = useRef(null);

  useEffect(() => { if (editingId && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingId, editingField]);
  useEffect(() => { if (phEditing && phInputRef.current) { phInputRef.current.focus(); phInputRef.current.select(); } }, [phEditing]);
  useEffect(() => { if (adding && newNameRef.current) newNameRef.current.focus(); }, [adding]);

  const groupNamesFromIds = (ids) => (groups || []).filter(g => ids.includes(g.id)).map(g => g.name || '?').join(' + ');
  const canAddEc = selectedGroupIds && selectedGroupIds.size > 0;

  const startAdd = () => {
    setNewName('');
    setNewValue('');
    setAdding(true);
  };

  const submitAdd = () => {
    const num = parseFloat(String(newValue).replace(',', '.'));
    if (isNaN(num) || num <= 0) { setAdding(false); return; }
    onAddEc && onAddEc(newName.trim() || 'EC', num);
    setNewName('');
    setNewValue('');
    setAdding(false);
  };

  const startEdit = (ec, field) => {
    setEditingId(ec.id);
    setEditingField(field);
    setEditDraft(field === 'name' ? ec.name : String(Math.round(Number(ec.value))));
  };

  const submitEdit = () => {
    const ec = ecValues.find(e => e.id === editingId);
    if (!ec) { setEditingId(null); return; }
    if (editingField === 'name') {
      const v = editDraft.trim();
      if (v) onUpdateEc(editingId, { name: v });
    } else {
      const num = parseFloat(editDraft.replace(',', '.'));
      if (!isNaN(num) && num > 0) onUpdateEc(editingId, { value: num });
    }
    setEditingId(null);
    setEditingField(null);
  };

  const startPhEdit = (key) => {
    setPhEditing(key);
    setPhDraft(measured[key] != null ? String(measured[key]) : '');
  };

  const commitPh = () => {
    const num = parseFloat(phDraft.replace(',', '.'));
    if (!isNaN(num) && num >= 0) onUpdate({ ...measured, [phEditing]: num });
    else if (phDraft === '') onUpdate({ ...measured, [phEditing]: null });
    setPhEditing(null);
  };

  return (
    <div className="mt-4 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="px-3 py-2 bg-gradient-to-r from-neutral-800/40 to-transparent border-b border-neutral-800 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">Messwerte</div>
        <div className="text-[10px] text-neutral-500">EC · pH</div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-neutral-800">
        {/* LINKS: EC-Werte-Liste */}
        <div className="flex flex-col min-h-[110px]">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500">EC<span className="normal-case text-neutral-700 ml-1">mS/cm</span></div>
            <button onClick={() => canAddEc && startAdd()}
                    disabled={!canAddEc || adding}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      canAddEc && !adding
                        ? 'text-emerald-400 hover:bg-emerald-950/40'
                        : 'text-neutral-700 cursor-not-allowed'
                    }`}
                    title={canAddEc ? `EC für (${groupNamesFromIds([...selectedGroupIds])}) hinzufügen` : 'Erst Gruppen markieren'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            {ecValues.length === 0 && !adding && (
              <div className="flex-1 flex items-center justify-center px-3 py-3 text-[11px] text-neutral-600 italic text-center">
                {canAddEc ? 'Tippe + um EC-Wert hinzuzufügen' : 'Gruppen markieren, dann + drücken'}
              </div>
            )}
            {ecValues.map(ec => {
              const names = groupNamesFromIds(ec.groupIds || []);
              const isEditingName = editingId === ec.id && editingField === 'name';
              const isEditingValue = editingId === ec.id && editingField === 'value';
              return (
                <div key={ec.id} className="px-3 py-1.5 flex items-center gap-1.5 border-b border-neutral-800/40 last:border-b-0 group hover:bg-neutral-800/30">
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                    {isEditingName ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onBlur={submitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="bg-neutral-800 rounded px-1.5 py-0.5 outline-none ring-2 ring-emerald-500 text-[12px] w-24" />
                    ) : (
                      <button onClick={() => startEdit(ec, 'name')}
                              className="text-[12px] text-neutral-200 hover:bg-neutral-800/50 rounded px-1 -mx-0.5 truncate max-w-[120px]">
                        {ec.name}
                      </button>
                    )}
                    {names && <span className="text-[9px] mono text-neutral-500 truncate">({names})</span>}
                  </div>
                  {isEditingValue ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      inputMode="decimal"
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      onBlur={submitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') submitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      className="mono w-12 bg-neutral-800 rounded px-1 py-0.5 outline-none ring-2 ring-emerald-500 text-[12px] text-right" />
                  ) : (
                    <button onClick={() => startEdit(ec, 'value')}
                            className="mono text-[12px] font-semibold text-emerald-400 hover:bg-neutral-800/50 rounded px-1">
                      {Math.round(Number(ec.value))}
                    </button>
                  )}
                  <button onClick={() => onRemoveEc(ec.id)}
                          className="w-5 h-5 rounded text-neutral-700 hover:text-rose-400 hover:bg-rose-950/30 opacity-30 group-hover:opacity-100 transition-all flex items-center justify-center flex-shrink-0"
                          title="EC-Wert entfernen">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {adding && (
              <div className="px-3 py-2 border-t border-neutral-800/40 bg-neutral-800/20">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={newNameRef}
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 min-w-0 bg-neutral-800 rounded px-1.5 py-1 text-[12px] outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') setAdding(false); }} />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder=""
                    className="mono w-12 bg-neutral-800 rounded px-1 py-1 text-[12px] text-right outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') setAdding(false); }} />
                  <button onClick={submitAdd}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold">
                    OK
                  </button>
                  <button onClick={() => setAdding(false)}
                          className="w-6 h-6 rounded text-neutral-500 hover:bg-neutral-700 flex items-center justify-center"
                          title="Abbrechen">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1 text-[9px] text-neutral-500">
                  Gilt für: <span className="mono text-neutral-400">({groupNamesFromIds([...selectedGroupIds]) || '?'})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECHTS: pH Ist + pH Soll + pH-Korrektur untereinander */}
        <div className="flex flex-col divide-y divide-neutral-800/60">
          <PhCell label="pH Ist" value={measured.pH} editing={phEditing === 'pH'}
                  onClick={() => startPhEdit('pH')} inputRef={phInputRef}
                  draft={phDraft} setDraft={setPhDraft} commit={commitPh} />
          <PhCell label="pH Soll" value={measured.pHTarget} editing={phEditing === 'pHTarget'}
                  onClick={() => startPhEdit('pHTarget')} inputRef={phInputRef}
                  draft={phDraft} setDraft={setPhDraft} commit={commitPh} />
          <PhAdjustCell
            adjust={measured.phAdjust || {}}
            onChange={(adj) => onUpdate({ ...measured, phAdjust: adj })} />
        </div>
      </div>
    </div>
  );
}

function PhCell({ label, value, editing, onClick, inputRef, draft, setDraft, commit }) {
  return (
    <div className="flex-1 px-3 py-2 hover:bg-neutral-800/30 cursor-pointer flex items-center justify-between gap-2"
         onClick={!editing ? onClick : undefined}>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
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
          className="mono w-20 text-right text-base font-semibold bg-neutral-800 rounded px-1.5 py-0.5 outline-none ring-2 ring-emerald-500" />
      ) : (
        <div className="mono w-24 text-right text-base font-semibold leading-tight">
          {value != null ? Number(value).toFixed(1) : <span className="text-neutral-700 text-xs">tap</span>}
        </div>
      )}
    </div>
  );
}

function PhAdjustCell({ adjust = {}, onChange }) {
  const [editing, setEditing] = useState(null); // 'name' | 'value' | null
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const startEdit = (field) => {
    setDraft((field === 'name' ? adjust.name : adjust.value) || '');
    setEditing(field);
  };
  const commit = () => {
    if (editing === 'name') onChange({ ...adjust, name: draft });
    else if (editing === 'value') onChange({ ...adjust, value: draft });
    setEditing(null);
  };
  const cancel = () => setEditing(null);

  return (
    <div className="flex-1 px-3 py-2 flex items-center gap-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex-shrink-0">pH − / +</div>

      {/* Name (groß, flex-1, linksbündig) — gleiche Schrift wie pH Ist / pH Soll */}
      {editing === 'name' ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          placeholder="Name oder Produktname"
          className="mono flex-1 min-w-0 text-base font-semibold leading-tight bg-neutral-800 rounded px-1 outline-none ring-2 ring-emerald-500 placeholder:text-neutral-700 placeholder:text-xs placeholder:font-normal" />
      ) : (
        <button onClick={() => startEdit('name')}
                className="mono flex-1 min-w-0 text-left text-base font-semibold leading-tight hover:bg-neutral-800/30 rounded px-1 truncate"
                title="Name oder Produktname eintragen">
          {adjust.name
            ? adjust.name
            : <span className="text-neutral-700 text-xs">tap</span>}
        </button>
      )}

      {/* Wert (klein, rechts) — gleiche Schrift wie pH Ist / pH Soll */}
      {editing === 'value' ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          placeholder="z.B. 10 ml"
          className="mono w-24 text-right text-base font-semibold leading-tight bg-neutral-800 rounded px-1 outline-none ring-2 ring-emerald-500 placeholder:text-neutral-700 placeholder:text-xs placeholder:font-normal" />
      ) : (
        <button onClick={() => startEdit('value')}
                className="mono w-24 text-right text-base font-semibold leading-tight hover:bg-neutral-800/30 rounded px-1 truncate flex-shrink-0"
                title="Dosis (z.B. 10 ml / 100 L)">
          {adjust.value
            ? adjust.value
            : <span className="text-neutral-700 text-xs">tap</span>}
        </button>
      )}
    </div>
  );
}

function MeasuredCell_DEPRECATED() { return null; }

// ============================================================
// KEBAB MENU
// ============================================================
function KebabMenu({ onClose, saltMode, setSaltMode, viewMode, setViewMode, useElementColors, setUseElementColors,
                    onNewRecipe, onOpenLibrary, onSave, onExportPDF, onAnalysis, onSettings }) {
  useEffect(() => {
    const handle = (e) => { if (!e.target.closest('[data-kebab]')) onClose(); };
    setTimeout(() => document.addEventListener('click', handle), 0);
    return () => document.removeEventListener('click', handle);
  }, [onClose]);

  return (
    <div data-kebab
         className="absolute top-full right-0 mt-1 z-30 min-w-[260px] bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl py-1">
      {/* Anzeige-Modi */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Salzname-Anzeige</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'kuerzel', label: 'Kürzel' },
            { id: 'formula', label: 'Formel' },
            { id: 'name',    label: 'Voll' },
          ].map(opt => (
            <button key={opt.id}
                    onClick={() => setSaltMode(opt.id)}
                    className={`text-xs px-2 py-1.5 rounded ${saltMode === opt.id ? 'bg-emerald-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2 pb-3 border-b border-neutral-800">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Ansicht</div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { id: 'compact', label: 'Kompakt' },
            { id: 'full',    label: 'Voll-Tabelle' },
          ].map(opt => (
            <button key={opt.id}
                    onClick={() => setViewMode(opt.id)}
                    className={`text-xs px-2 py-1.5 rounded ${viewMode === opt.id ? 'bg-emerald-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <KebabItem icon="✨" label="Neues Rezept" sub="Aktuelles verwerfen" onClick={onNewRecipe} />
      <KebabItem icon="📋" label="Rezept-Bibliothek" sub="Öffnen / verwalten" onClick={onOpenLibrary} />
      <div className="border-t border-neutral-800 my-1" />
      <KebabItem icon="💾" label="Rezept speichern" sub="In Bibliothek ablegen" onClick={onSave} />
      <KebabItem icon="📄" label="Als PDF exportieren" sub="Drucken oder teilen" onClick={onExportPDF} />
    </div>
  );
}

function KebabItem({ icon, label, sub, onClick, danger }) {
  return (
    <button onClick={onClick}
            className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-neutral-800 ${danger ? 'text-rose-400' : ''}`}>
      <span className="w-5 text-center text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{label}</div>
        {sub && <div className="text-[10px] text-neutral-500">{sub}</div>}
      </div>
    </button>
  );
}

// ============================================================
// CONFIRM DIALOG
// ============================================================
function ConfirmDialog({ title, message, onConfirm, onClose, confirmLabel = 'Bestätigen', danger = true }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full max-w-sm bg-neutral-900 rounded-2xl border border-neutral-800 p-5 shadow-2xl">
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-neutral-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium">
            Abbrechen
          </button>
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
// SETTINGS PANEL — simuliert globale App-Einstellungen
// ============================================================
function SettingsPanel({ onClose, saltLang, setSaltLang, useElementColors, setUseElementColors }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] overflow-y-auto recipe-scroll">
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">App-Einstellungen</div>
            <div className="font-semibold">Sprache & Darstellung</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Salznamen-Sprache</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: 'English', sub: 'Potassium Nitrate' },
                { id: 'de', label: 'Deutsch',  sub: 'Kaliumnitrat' },
              ].map(opt => (
                <button key={opt.id}
                        onClick={() => setSaltLang(opt.id)}
                        className={`text-left px-3 py-2.5 rounded-lg ${saltLang === opt.id ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className={`text-[10px] mono ${saltLang === opt.id ? 'text-emerald-100' : 'text-neutral-500'}`}>{opt.sub}</div>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-neutral-600 mt-2 italic">Unabhängig von der App-Sprache. Weitere Sprachen folgen.</div>
          </div>

          <div className="pt-3 border-t border-neutral-800">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Element-Farben</div>
            <button onClick={() => setUseElementColors(!useElementColors)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700">
              <div className="text-left">
                <div className="text-sm">Element-Farben anzeigen</div>
                <div className="text-[10px] text-neutral-500">In Salznamen, Formeln und Tabellen-Werten</div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${useElementColors ? 'bg-emerald-600' : 'bg-neutral-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${useElementColors ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          <div className="pt-3 border-t border-neutral-800 text-[10px] text-neutral-600 italic">
            Hinweis: In der echten App findest du diese Optionen unter Einstellungen → Sprache / Element-Farben.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LIBRARY PANEL — gespeicherte Rezepte verwalten
// ============================================================
function LibraryPanel({ onClose, library, onOpen, onDelete, currentId }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full sm:max-w-md bg-neutral-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-neutral-800 max-h-[85vh] overflow-y-auto recipe-scroll">
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
              Noch keine Rezepte gespeichert.<br/>Speichere ein Rezept aus dem Menü → erscheint hier.
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
              <button onClick={() => onOpen(r)}
                      className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-xs font-medium">
                Öffnen
              </button>
              <button onClick={() => onDelete(r.id)}
                      className="w-8 h-8 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
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
// CALCULATOR MINI
// ============================================================
function CalculatorMini({ onTransfer }) {
  const [calculated, setCalculated] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Lösungstyp</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button className="py-2.5 rounded-lg bg-neutral-800 text-neutral-400 text-sm font-medium">Fertige Lösung</button>
          <button className="py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium">Stockkonzentrat</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase mb-1">Volumen (L)</div>
            <div className="bg-neutral-800 rounded-lg px-3 py-2 text-base mono">5</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase mb-1">Konz.-Faktor</div>
            <div className="bg-neutral-800 rounded-lg px-3 py-2 text-base mono">333</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Berechnungsmodus</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium">Automatisch</button>
          <button className="py-2.5 rounded-lg bg-neutral-800 text-neutral-400 text-sm font-medium">Manuell</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setCalculated(false)} className="py-3 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-sm font-medium">Zurücksetzen</button>
        <button onClick={() => setCalculated(true)} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white">Berechnen</button>
      </div>

      {calculated && (
        <div className="rounded-xl bg-gradient-to-br from-emerald-950/30 to-neutral-900 border border-emerald-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-0.5">Ergebnis berechnet für</div>
              <div className="text-lg font-semibold">Stockkonzentrat AB · 5 L · ×333</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 uppercase">Gesamt</div>
              <div className="mono text-xl font-bold text-emerald-400">2,15 kg</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-neutral-900/60 rounded p-2"><span className="mono text-emerald-400">KN</span> 1173,40 g</div>
            <div className="bg-neutral-900/60 rounded p-2"><span className="mono text-emerald-400">KS</span> 109,19 g</div>
            <div className="bg-neutral-900/60 rounded p-2"><span className="mono text-emerald-400">MgS</span> 870,50 g</div>
          </div>
          <button
            onClick={onTransfer}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            In Rezept-Tabelle übertragen
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Demo-Hinweis</div>
        <p className="text-xs text-neutral-500 mt-1 px-6">
          Vereinfachter Mock-Rechner — in deiner App siehst du hier deine bestehende Rechner-Oberfläche.
          Der „In Rezept-Tabelle übertragen"-Button erscheint im Ergebnisfeld nach Drücken von Berechnen.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
function BottomNav({ view, setView, onSettings }) {
  const items = [
    { id: 'calculator', label: 'Rechner', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg> },
    { id: 'table', label: 'Rezept', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
    { id: 'database', label: 'Datenbank', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg> },
    { id: 'knowledge', label: 'Wissen', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { id: 'settings', label: 'Einstellungen', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-950 border-t border-neutral-900">
      <div className="max-w-3xl mx-auto flex">
        {items.map(item => {
          const active = view === item.id;
          const clickable = ['calculator', 'table', 'settings'].includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings') onSettings();
                else if (clickable) setView(item.id);
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${active ? 'text-emerald-500' : 'text-neutral-600'} ${!clickable ? 'opacity-40' : 'hover:text-neutral-300'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
