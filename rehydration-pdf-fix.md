# Rehydrations-Kontext: PDF-Export Fix

Dieses Dokument fasst die Analyse und den durchgeführten Fix zusammen,
damit ein anderer Chat-Kontext lückenlos weiterarbeiten kann.

---

## Ausgangsproblem

Der PDF-Export der Growculator/Fertilizer-App zeigt beim Drucken nur eine
**leere weiße Seite** mit Browser-Header (Datum, Seitenname) und
Browser-Footer (localhost-URL). Die Rezeptdaten sind nicht sichtbar.

---

## Architektur des PDF-Exports (Analyse)

### Technischer Ansatz
Kein externes PDF-Tool. Der Export basiert auf `window.print()` mit CSS `@media print`.

### Beteiligte Dateien
- `src/recipe-table/RecipeView.jsx` — Hauptkomponente mit allen relevanten Funktionen
- `src/index.css` — Print-CSS-Regeln

### Funktionsweise
1. `<PrintDocument>` ist **immer** im DOM gerendert, auf dem Bildschirm via `display: none` versteckt.
2. Beim Druck macht `@media print` es sichtbar (`display: block !important; visibility: visible`)
   und versteckt alles andere (`body * { visibility: hidden }`).
3. `PrintDocument` filtert intern: `recipe.groups.filter(g => selectedIds.has(g.id))`

### Datenstruktur
```js
recipe = {
  id: string,
  name: string,
  themeColor: string,
  targets: { [elementSymbol]: number },   // mg/L Zielwerte
  groups: [{
    id: string,
    name: string,
    kind: 'stock' | 'solo' | 'topdress',
    themeColor: string,
    factor: number,      // nur 'stock'
    mlPerL: number,      // nur 'stock'
    volume: number,
    phTarget: number,
    ecTarget: number,
    salts: [{
      id: string,
      mass: number,
      massUnit: 'g' | 'ml',
      contributions: { [elementSymbol]: number }  // mg/L je Element
    }]
  }]
}

printSettings = {
  selectedIds: Set<string>,   // initial: new Set() — LEER!
  colorMode: 'color' | 'bw'
}
```

---

## Root Cause des Bugs

**Race Condition** in `handlePdfPrint` (war in `RecipeView.jsx` ca. Zeile 933).

### Alter Code (buggy)
```js
const handlePdfPrint = ({ selectedIds, orientation, colorMode }) => {
  setPrintSettings({ selectedIds, colorMode });  // async React-State-Update
  setPdfOpen(false);
  // @page-Style injizieren...
  setTimeout(() => {
    window.print();  // feuert nach 80ms — keine Garantie, dass React committed hat
  }, 80);
};
```

`setPrintSettings` ist ein **asynchroner** React-State-Update. Die 80ms-Verzögerung
ist eine Schätzung, keine Garantie. Wenn React den neuen State noch nicht ins DOM
geschrieben hat, wenn `window.print()` feuert, rendert `PrintDocument` noch mit
`printSettings.selectedIds = new Set()` (Initialzustand, leer) → keine Gruppen → leere Seite.

---

## Durchgeführter Fix

**Datei:** `src/recipe-table/RecipeView.jsx`

**Ansatz:** `shouldPrint`-Flag als State + `useEffect` statt `setTimeout`.
`window.print()` wird erst aufgerufen, nachdem React den kompletten State
(inkl. `printSettings`) in den DOM committed hat.

### Neuer Code
```js
// State-Deklaration (nach printSettings):
const [shouldPrint, setShouldPrint] = useState(false);

// useEffect — läuft garantiert NACH dem DOM-Commit:
useEffect(() => {
  if (!shouldPrint) return;
  window.print();
  setShouldPrint(false);
}, [shouldPrint]);

// handlePdfPrint — kein setTimeout mehr:
const handlePdfPrint = ({ selectedIds, orientation, colorMode }) => {
  setPrintSettings({ selectedIds, colorMode });
  setPdfOpen(false);
  const styleId = '__recipe-print-orientation';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
  styleEl.textContent = `@media print { @page { size: A4 ${orientation}; margin: 12mm; } }`;
  setShouldPrint(true);  // löst den useEffect aus, NACHDEM React committed hat
};
```

### Warum das funktioniert
React batcht `setPrintSettings` und `setShouldPrint(true)` in einem einzigen Render-Zyklus.
Der `useEffect([shouldPrint])` läuft erst **nach** dem DOM-Commit dieses Renders — zu diesem
Zeitpunkt hat `PrintDocument` garantiert die korrekten `selectedIds` und rendert alle
gewählten Gruppen. Erst dann wird `window.print()` aufgerufen.

---

## Aktueller Status

- Fix wurde durchgeführt und committed.
- Keine weiteren offenen Punkte zum PDF-Export bekannt.
- Für Folgearbeiten am PDF-Export: die oben genannte Datenstruktur und
  die Datei `src/recipe-table/RecipeView.jsx` (Komponente `PrintDocument` und
  Funktion `handlePdfPrint`) sind die relevanten Einstiegspunkte.
