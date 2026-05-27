# Growculator — Integration der Rezept-Tabelle

> Ziel: Das in der Sandbox entwickelte **Rezept-Tabelle-Modul** in die bestehende App integrieren. Der Nutzer hat den **gesamten Projektordner dupliziert** — Claude Code arbeitet in dieser Kopie. Der Original-Ordner bleibt unangetastet.

---

## 0. Voraussetzungen (was vor Claude Code passieren muss)

Im **duplizierten** Projektordner soll folgende Struktur existieren:

```
<projekt-kopie>/
├── src/                ← wird modifiziert
├── sandbox-module/     ← Anleitung + Sandbox-Files entpackt
│   ├── INTEGRATION.md  ← diese Datei
│   ├── Rezept-Tabelle.html
│   ├── recipe-data.jsx
│   ├── recipe-popover.jsx
│   ├── recipe-table.jsx
│   └── recipe-app.jsx
├── package.json
├── vite.config.js
└── … (alle übrigen Projektdateien)
```

Der **Original-Projektordner** ist eine separate Kopie an anderer Stelle und wird NICHT angefasst — das ist die Sicherheit für den Nutzer.

**Schritte für den Nutzer (Mensch) VOR Start von Claude Code:**

1. ZIP der Sandbox entpacken nach `<projekt-kopie>/sandbox-module/`
2. Claude Code Zugriff auf `<projekt-kopie>/` geben (das Wurzelverzeichnis der Kopie).
3. Den Prompt aus `CLAUDE_CODE_PROMPT.md` kopieren und an Claude Code übergeben.

---

## 1. Was das Modul tut

Die **Rezept-Tabelle** ist ein neuer Bereich, der zusätzlich zu Rechner/Datenbank/Wissen/Einstellungen existiert. Sie erlaubt:

- Anlegen, Speichern und Verwalten **mehrerer Rezepte** (Bibliothek)
- Jedes Rezept enthält **mehrere Gruppen** (Konzentrate, Endlösungen oder Topdress)
- Jede Gruppe enthält **mehrere Salze** mit Massen + Beiträgen (ppm pro Element)
- Tabellen-Editor (Kompakt + Voll-Tabelle), Element-Popover, Gruppen-Popover, Auswertungs-Popover
- Messwerte: pH Ist / pH Soll / pH-Korrektur (Name + Wert) sowie benannte EC-Werte für markierte Gruppen-Kombinationen
- Bilanz pro Element (Erreicht / Ziel / %), Donut-Charts, Verhältnisse
- Themenfarbe pro Rezept

Das Modul existiert **in der Sandbox als reines UI**, die Berechnungen sind Stubs. **Beim Integrieren in `src/` müssen die Stubs durch die echte Berechnungslogik der bestehenden App ersetzt werden.**

---

## 2. Bestehende App — relevante Bestandteile in `src/App.jsx`

| Bereich | Zeilen ca. | Was |
|---|---|---|
| `ELEMENT_COLORS_DEFAULT` | 344 | Element-Farben-Map. `N-NO3` und `N-NH4` getrennt. |
| `DEFAULT_SALTS` | 622 | Salz-Datenbank mit `composition`-Map, `price`, `tank`, `purity`, `solubility`. |
| `emptyComposition()` | (vor 622) | Liefert `{Ca:0, 'N-NO3':0, 'N-NH4':0, ...}` |
| `loadFromStorage` / `saveToStorage` | 889 | localStorage Wrapper |
| Storage-Keys | 949 | `hydro:salts`, `hydro:lang`, `hydro:theme`, `hydro:accent`, `hydro:elemColorsOn`, `hydro:elemColors`, `hydro:phMode`, `hydro:rootzoneMode` |
| `App` (Top-Level) | 920 | Hauptkomponente, Bottom-Nav, View-Switch |

**Bottom-Nav-Tabs** (heute): Rechner · Datenbank · Wissen · Einstellungen. → **NEU: Rezept** zwischen Rechner und Datenbank.

---

## 3. Datenmodell der Sandbox

### 3.1 Rezept

```js
{
  id: 'r-xxx',
  name: 'Flo F10',
  themeColor: '#10b981',          // freie Farbe pro Rezept
  saltMode: 'kuerzel' | 'formula' | 'name',   // Anzeige-Modus für Salznamen
  notes: '',                       // optional
  measured: {
    pH: 5.8,                       // pH Ist
    pHTarget: 5.6,                 // pH Soll
    phAdjust: { name: 'pH−', value: '10 ml/100 L' }, // freier Name + Freitext-Wert
    ecValues: [
      { id: 'ec-xxx', name: 'Wachstum', groupIds: ['g-1','g-2'], value: 1.8 }
    ]
  },
  targets: { N: 159.1, P: 126.23, K: 481.37, /* ... */ },  // ppm
  groups: [Group, Group, ...]
}
```

### 3.2 Group

```js
{
  id: 'g-xxx',
  name: 'AB',
  kind: 'stock' | 'solo' | 'topdress',  // Konzentrat | Endlösung | Topdress
  volume: 5,                            // Liter
  factor: 333,                          // Konzentrationsfaktor (nur bei kind=stock)
  mlPerL: 3,                            // = 1000 / factor (nur bei kind=stock)
  salts: [Salt, Salt, ...]
}
```

- Bei `kind === 'solo'`: `factor = null`, `mlPerL = null`, nur `volume` (= Endvolumen).
- Bei `kind === 'topdress'`: `factor = null`, `mlPerL = null`, `volume = null`.

### 3.3 Salt

```js
{
  id: 's-xxx',
  shortName: 'KN',                     // z.B. "KN", "MgS", "MoNa"
  formula: 'KNO₃',                     // Unicode-Subscripts
  name: 'Kaliumnitrat',                // DE
  nameEN: 'Potassium Nitrate',         // EN
  mass: 1173.4,                        // g oder ml
  massUnit: 'g' | 'ml',
  pricePerKg: 4.20,                    // optional; € pro kg (bei ml-Salzen: € pro L)
  contributions: { N: 96.55, K: 269.08 }, // ppm in der Endlösung
  nh4Fraction: 0                       // 0..1 — Anteil von N, der NH4 ist
}
```

---

## 4. Mapping Sandbox-Salz ↔ Real-Salz

**Sandbox `AVAILABLE_SALTS`** (in `sandbox-module/recipe-popover.jsx`) — bitte komplett **ersetzen** durch eine Map über `DEFAULT_SALTS` (aus `src/App.jsx`) plus User-eigene Salze (`hydro:salts`).

Mapping pro Salz:

```js
// real DEFAULT_SALTS entry:
{ id, name, formula, tank, purity, price, solubility, composition: {Ca:0, 'N-NO3':14.4, 'N-NH4':1.1, K:0, ...} }

// → in das Sandbox-Schema:
{
  id: realSalt.id,
  shortName: deriveShortName(realSalt),    // siehe unten
  formula: realSalt.formula,
  name: localizeName(realSalt, lang === 'de'),
  nameEN: realSalt.name,                   // bereits englisch
  pricePerKg: realSalt.price > 0 ? realSalt.price : undefined,
  contributions: combineNComposition(realSalt.composition),
  nh4Fraction: computeNh4Fraction(realSalt.composition),
}
```

### 4.1 Kombiniere N-NO3 + N-NH4 zu N

```js
function combineNComposition(comp) {
  const out = {};
  Object.entries(comp).forEach(([k, v]) => {
    if (!v) return;
    if (k === 'N-NO3' || k === 'N-NH4') return; // gesondert
    if (k === 'Na') return; // Natrium ist in der Sandbox-Element-Liste nicht drin (oder optional ergänzen)
    out[k] = (out[k] || 0) + v;
  });
  const n = (comp['N-NO3'] || 0) + (comp['N-NH4'] || 0);
  if (n > 0) out.N = n;
  return out;
}

function computeNh4Fraction(comp) {
  const n = (comp['N-NO3'] || 0) + (comp['N-NH4'] || 0);
  return n > 0 ? (comp['N-NH4'] || 0) / n : 0;
}
```

### 4.2 Kurzname (`shortName`) ableiten

Es gibt keinen `shortName`-Feld in `DEFAULT_SALTS`. Strategie:

- Wenn `formula` ein erkennbares Kation+Anion-Schema hat → ableiten (z.B. `KNO3` → `KN`, `K2SO4` → `KS`, `MgSO4·7H2O` → `MgS`, `KH2PO4` → `MKP`, `NH4H2PO4` → `MAP`, `NH4NO3` → `AmN`, `KCl` → `KCl`, `Na2MoO4·2H2O` → `MoNa`)
- Fallback: ersten 3 Großbuchstaben aus `name`

**Hardcodierte Mappings (aus `recipe-popover.jsx` der Sandbox übernehmen):**

| Formel | shortName |
|---|---|
| `KNO3` | KN |
| `5Ca(NO3)2·NH4NO3·10H2O` | CaN |
| `NH4NO3` | AmN |
| `Mg(NO3)2·6H2O` | MgN |
| `K2SO4` | KS |
| `MgSO4·7H2O` | MgS |
| `KH2PO4` | MKP |
| `NH4H2PO4` | MAP |
| `(NH4)2HPO4` | DAP |
| `KCl` | KCl |
| `FeSO4·7H2O` | FeS |
| `MnSO4·H2O` | MnS |
| `ZnSO4·7H2O` | ZnS |
| `CuSO4·5H2O` | CuS |
| `H3BO3` | Bor |
| `Na2MoO4·2H2O` | MoNa |
| `K2SiO3` | KSi |
| `CaSO4·2H2O` | CaS |
| `Ca3(PO4)2` | PCal |

Empfehlung: eigene Map-Funktion `getShortName(formula, name)` mit dieser Tabelle + Fallback-Heuristik.

### 4.3 Element-Farben

Die Sandbox hat in `recipe-data.jsx` eine eigene `ELEMENT_DEFS`-Konstante mit hardkodierten Farben. **Ersetzen** durch die echten Farben aus dem App-State `elementColors`:

- App-State: `elementColors['N-NO3']`, `elementColors['N-NH4']`, `elementColors.K`, …
- Für das **N-Element** in der Sandbox (kombiniert): Farbe = `elementColors['N-NO3']`
- Für **NH₄-Spezialfarbe** (Sandbox-Konstante `NH4_COLOR`): Farbe = `elementColors['N-NH4']`
- Element-Farben aus/an: respektiere `elementColorsOn`-Flag aus App-Settings.

`recipe-data.jsx` exportiert `ELEMENT_DEFS` und `ELEMENT_BY_SYM` als Modul-Konstanten — diese müssen zu einer **Function** werden, die `(elementColors, elementColorsOn)` als Argument bekommt, ODER beide Werte via React Context zugänglich machen.

---

## 5. Berechnungen — Stub durch echten Solver ersetzen

### 5.1 Hinzufügen eines Salzes zu einer Gruppe

Sandbox (`recipe-app.jsx`, `addSaltToGroup`):

```js
const defaultMass = 100;
contributions[sym] = pct * defaultMass / 100;  // ← ignoriert factor + volume!
```

Das ist **falsch** für die echte Logik. Ersetzen durch:

```js
// final_ppm = (mass × elementPct/100) / (factor × volume_L) × K  (K=1000 für g/L → ppm)
function computeContribution(massG, elementPct, factor, volumeL) {
  if (!factor || !volumeL) return 0;
  return (massG * elementPct / 100) / (factor * volumeL) * 1000;
}
```

Bei `kind === 'solo'` ist `factor === null`, dann **mathematisch `factor = 1`** verwenden (Endlösung).
Bei `kind === 'topdress'`: Beiträge ergeben sich nicht aus Volumen — hier bleibt die Sandbox-Logik (Stub) gültig, oder andere Berechnung je nach App-Spezifikation.

### 5.2 Skalierung beim Editieren

Diese Logik (in `recipe-table.jsx`) ist **mathematisch korrekt** und kann übernommen werden:

- **Masse ändern** → `contributions` skalieren proportional
- **Einzelnen ppm-Wert ändern** → alle ppm und Masse mitskalieren
- **Volumen ändern** → Salzmengen skalieren `mass × (newVol/oldVol)`, ppm bleiben
- **Faktor ändern** → Salzmengen skalieren `mass × (newFactor/oldFactor)`, ppm bleiben

**Wichtig:** das ist eine **UX-Entscheidung**, nicht nur Mathe. Die Implementierung muss in `src/` erhalten bleiben.

### 5.3 Solver-Integration (optional, Phase 2)

Die bestehende App hat einen **NNLS-Solver**. Wenn der User mehrere Salze in einer Gruppe definiert hat und eine **„Automatik"** wünscht (z.B. Knopf „Massen auto-berechnen aus Zielwerten"), würde der echte Solver greifen. Aber: **das ist NICHT Teil dieser Integration**. Erst mal nur Daten-Editor; Solver-Integration kann später erfolgen.

---

## 6. localStorage — Keys umbenennen

**Sandbox-Keys** (in `recipe-app.jsx`):

| Sandbox | Real (im neuen `src/`) |
|---|---|
| `growculator-recipe-v1` | `hydro:recipe-current` |
| `growculator-recipes-library` | `hydro:recipes-library` |
| `growculator-element-colors` | bereits da: `hydro:elemColorsOn` |
| `growculator-salt-lang` | bereits da: `hydro:lang` (App-Sprache) — kein extra Key |

Element-Farben und Salznamen-Sprache aus den **bestehenden** App-Settings ziehen. Die `SettingsPanel`-Komponente der Sandbox (`recipe-app.jsx`) kann **komplett entfernt** werden — die App hat ihren eigenen Settings-Tab.

---

## 7. Was IST übernehmbar (Sandbox → src/)

| Sandbox-Datei | Ziel in src/ | Strategie |
|---|---|---|
| `recipe-data.jsx` | `src/recipe-table/data.js` | Element-Defs als Funktion (siehe 4.3); Parser-Funktionen wie sind (`colorizeKuerzel`, `colorizeFormula`, `colorizeFullName`, `stripCrystalWater`, `stripHydrateSuffix`); Berechnungs-Helfer (`calculateTotals`, `calculateNH4Stats`, `elementsInGroup`, `fmtMass`, `fmtPpm`). |
| `recipe-table.jsx` | `src/recipe-table/RecipeTable.jsx` | Komponenten 1:1 übernehmen (`GroupBlock`, `FullTableView`, `FooterTotals`, `GroupHeaderRow`, `SaltRow`, `SaltNameCell`, `ValueCell`, `MetaPill`, `ElementHeaderTile`) + Skalierungs-Funktionen. |
| `recipe-popover.jsx` | `src/recipe-table/Popovers.jsx` | Element-Detail-Popover, Gruppen-Detail-Popover, Auswertungs-Popover, Donut, Salzauswahl-Popover, Gruppen-Kebab-Menü, Confirm-Dialog, Toast. **Salzauswahl muss die echte `DEFAULT_SALTS` nutzen statt der Sandbox-Stub-Liste `AVAILABLE_SALTS`.** |
| `recipe-app.jsx` | `src/recipe-table/RecipeView.jsx` (default export) | Top-Level-Logik (State, Handlers, Layout). Bottom-Nav + Kebab + Library + Stats-Bar + Messwerte + Auswertung. **`CalculatorMini` raus** (in der echten App existiert der Rechner schon als separater View — der „← zum Rechner"-Pfeil im Header soll auf den App-Reiter `view = 'calculator'` switchen). **`BottomNav` raus** (App hat eigene Bottom-Nav). **`SettingsPanel` raus** (App hat eigenen Settings-Tab). |

---

## 8. UI-Anpassungen

- **Kein eigenes Bottom-Nav, kein eigenes Settings-Panel** — werden durch die App bereitgestellt
- **„← Zum Rechner"-Pfeil im Header** der Sandbox-App schaltet in der echten App auf den `calculator`-View
- **Theme** der echten App: dark/light Toggle. Die Sandbox war **immer dark**. Beim Integrieren muss die Rezept-View beide Themes unterstützen — Tailwind-Klassen `bg-neutral-950`, `text-neutral-100`, `border-neutral-800` etc. mit `dark:`-Präfixen versehen, oder ein dunkles/helles Farbthema via CSS-Custom-Property.
- **Akzentfarbe** der App (`accentKey`): wo die Sandbox hartkodiert `emerald-*` verwendet (Save-Button, EC-Werte, Highlights), durch die globale Akzentfarbe ersetzen. **Ausnahme**: der „Speichern"-Button bleibt explizit emerald (vom Nutzer so gewünscht — siehe Punkt 5 Design-Entscheidungen unten).
- **Element-Farben aus / an**: aus Settings `elementColorsOn`. Sandbox-Default: an.
- **Salznamen-Sprache**: aus Settings `lang`. Sandbox hatte separates Setting, das fällt weg.

---

## 9. Design-Entscheidungen (aus dem Sandbox-Prozess, bitte respektieren)

1. **Gruppenname-Klick** öffnet das **Gruppen-Detail-Popover** (nicht Umbenennen). Umbenennen geht über das Gruppen-Kebab-Menü.
2. **Plus-Knopf** im Gruppen-Header (klein, neben Kebab) öffnet die Salzauswahl. Plus große „Salz hinzufügen"-Zeile am Ende jeder Gruppe (Kompakt-Ansicht).
3. **Multi-Select** in der Salzauswahl: Checkboxen pro Salz, Bottom-Bar mit Anzahl. Single-Tap-Modus aktiv beim Ersetzen.
4. **Themenfarbe pro Rezept** färbt Rezeptname und Gruppennamen. Niemals die Akzentfarbe der App ersetzen — der Speichern-Button bleibt **emerald**.
5. **Tabelle Dezimalstellen**: 1 (Anzeige), 2 (Eingabe), 2 (PDF-Export später).
6. **EC-Werte in mS/cm**: ohne Dezimalstellen anzeigen (`Math.round`).
7. **Element-Balken**: laufen bis 100% (Anteil am Gesamtwert). Rest schwarz. Wenn kein Ziel gesetzt: 100% gedimmt (45% opacity).
8. **Verhältnisse**: nur die diagnostisch relevanten Pairs (N:K, P:K, Ca:Mg, N:Ca, K:Ca, Fe:Mn, K:Mg).
9. **Donut** in Auswertung: Makro + Mikro getrennt.
10. **Selektion**-Checkbox pro Gruppe: rechts außen, immer sichtbar, anthrazit/transparent inaktiv, emerald gefüllt aktiv.
11. **Statistik-Bar oben** (Kompakt-Ansicht): NH₄-Anteil · Salzmenge (g+ml getrennt) · Gruppen. Reagiert auf Selektion.
12. **„Quick-EC"** (single EC value) wurde **entfernt**. Nur noch benannte EC-Werte mit Gruppen-Bezug.
13. **pH-Korrektur-Zeile** (pH−/+) speichert `{name, value}` als Freitext — Wert mit Einheit vom User getippt.
14. **Konzentrat ↔ Endlösung** Toggle im Gruppen-Kebab. Umschaltung erhält ppm (Salzmassen werden umgerechnet).
15. **„Neue Gruppe"-Button** sowohl in Kompakt- als auch in Voll-Tabelle-Ansicht, gestrichelter Rahmen, hover = Akzent.

---

## 10. Test-Checkliste nach Integration

- [ ] `npm run dev` startet ohne Fehler
- [ ] Bottom-Nav zeigt neuen „Rezept"-Tab
- [ ] Wechsel zu „Rezept"-Tab zeigt das Beispiel-Rezept (aus `recipe-data.jsx` als SAMPLE_RECIPE)
- [ ] Bestehende Tabs (Rechner, Datenbank, Wissen, Einstellungen) funktionieren unverändert
- [ ] Salz hinzufügen im Rezept-Tab verwendet die echte `DEFAULT_SALTS`-Liste
- [ ] Hinzugefügtes Salz hat korrekte `contributions` (mit Faktor + Volumen verrechnet)
- [ ] Element-Farben werden aus App-Settings gezogen (an/aus respektiert)
- [ ] Theme-Toggle (dark/light) wirkt sich auf den Rezept-Tab aus
- [ ] localStorage-Migration: falls noch alte `growculator-*`-Keys vorhanden, einmalig in `hydro:*` migrieren (oder ignorieren — neue Nutzer haben sowieso noch nichts)
- [ ] Sprache-Toggle DE/EN wechselt die Salznamen-Anzeige im Voll-Namen-Modus
- [ ] Sandbox-`SettingsPanel`, `BottomNav`, `CalculatorMini` sind entfernt
- [ ] `npm run build` läuft fehlerfrei
- [ ] APK-Build (falls Capacitor-Build getestet wird): keine neuen Warnungen

---

## 11. Konkrete Einstiegspunkte in `src/App.jsx`

Diese Stellen muss Claude Code in **`src/App.jsx` (der duplizierten Projekt-Kopie)** modifizieren:

- **Zeile ~920** (`export default function App`): neuen State `view` enthält jetzt eine Option mehr (`'recipe'`). Top-Level-Component-Importe entsprechend.
- **Zeile ~947** (`useEffect` Laden): zusätzlich `hydro:recipe-current` und `hydro:recipes-library` laden.
- **Zeile ~960** (`useEffect` Speichern): Persist-Effects für `recipe` und `library` analog ergänzen.
- **Bottom-Nav-Komponente** (im JSX): einen Eintrag `{ id: 'recipe', label: t('recipe'), icon: ... }` zwischen Calculator und Database einfügen.
- **View-Switch im Body**: `{view === 'recipe' && <RecipeView ... />}` ergänzen, oder bei Verwendung eines `Tabs`-Patterns analog einbinden.
- **TRANSLATIONS** (Zeile ~48 und ~203): `recipe: 'Rezept'` (DE) und `recipe: 'Recipe'` (EN) hinzufügen.

---

## 12. Bekannte Stolperfallen

1. **Reine Sandbox-Komponenten exportieren via `Object.assign(window, …)`**. In Vite-Module ersetzen durch reguläre `export`/`import`.
2. **CDN-Tailwind in der Sandbox**, lokales Tailwind in der App. Klassen sollten 1:1 funktionieren, aber JIT-Compiler in `tailwind.config.js` muss alle verwendeten Klassen sehen — falls Klassen mit dynamischen Strings (`bg-emerald-950/40` etc.) gebaut werden, in `safelist` aufnehmen.
3. **Inter-Font + JetBrains Mono**: in der echten App über Vite-Asset-Pipeline geladen, nicht über Google-Fonts-Link. Klasse `.mono` muss in `src/` definiert sein (analog zur Sandbox: `font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;`).
4. **`MetaPill`-Eingabefelder** in `recipe-table.jsx` rufen `scaleGroupByFactor` / `scaleGroupByMlPerL` / `scaleGroupByVolume` aus dem gleichen Modul auf — bei Modul-Split sicherstellen, dass die Helfer importiert werden.

---

## 13. Was die Sandbox **NICHT** abdeckt (Phasen 2-5, später)

- Drag & Drop für Salz-Zeilen zwischen Gruppen
- pH-Verlauf/Diary
- PDF-Export
- Dosieranleitungs-Tabelle (Stretch/Mid/Late mit Crop-Steering)
- Fertige Düngerprodukte als zweite Datenbank-Rubrik
- Phone-Tilt-Detect für automatisches Kompakt/Voll-Toggle

Diese Punkte stehen im Backlog (siehe `GROWCULATOR_REHYDRATION.md` Phase 2-5) und sind **nicht Teil dieser Integration**.

---
