import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, Database, Settings, Trash2, Edit2, Plus, AlertTriangle, AlertCircle, Check, X, Globe, Moon, Sun, Save, ChevronRight, ChevronLeft, FlaskConical, BookOpen, Atom, Activity, Droplets, Thermometer, Network, ArrowUpDown, Wind, Leaf } from 'lucide-react';
import RecipeView from './recipe-table/RecipeView.jsx';
import { buildAvailableSalts, SAMPLE_RECIPE, getShortName } from './recipe-table/data.js';

// ============================================================
// ÜBERSETZUNGEN
// ============================================================
const TRANSLATIONS = {
  de: {
    appTitle: 'GrowCulator Nährstoffrechner',
    nav: { calculator: 'Rechner', recipe: 'Rezept', database: 'Datenbank', knowledge: 'Wissen', settings: 'Einstellungen' },
    calc: {
      title: 'Nährstoffberechnung',
      mode: 'Lösungstyp',
      directSolution: 'Fertige Nährlösung',
      stockConcentrate: 'Stockkonzentrat',
      volume: 'Volumen',
      liters: 'Liter',
      concentrationFactor: 'Konzentrationsfaktor',
      times: '×',
      calcMode: 'Berechnungsmodus',
      auto: 'Automatisch',
      manual: 'Manuell',
      targetValues: 'Zielwerte (ppm)',
      element: 'Element',
      target: 'Ziel',
      result: 'Resultat',
      selectSalts: 'Salze auswählen',
      selectSaltsHint: 'Wähle Salze aus deiner Datenbank, die in der Mischung verwendet werden sollen.',
      noSaltsAvailable: 'Keine Salze in der Datenbank. Lege zuerst Salze unter Datenbank an.',
      calculate: 'Berechnen',
      reset: 'Zurücksetzen',
      resultTitle: 'Ergebnis',
      noResult: 'Noch keine Berechnung durchgeführt.',
      salt: 'Salz',
      tank: 'Tank',
      mass: 'Menge (g)',
      cost: 'Kosten',
      totalCost: 'Gesamtkosten',
      dosingHint: 'Dosierung pro Liter Endlösung:',
      mlPerL: 'ml/L',
      warnings: 'Warnungen',
      noWarnings: 'Keine Warnungen.',
      warnSolubility: 'Löslichkeitsgrenze überschritten',
      warnSolubilityNear: 'Nähe der Löslichkeitsgrenze (>80%)',
      warnIncompat: 'Inkompatible Salze im selben Tank',
      warnUnmet: 'Zielwert nicht erreichbar',
      deviation: 'Abweichung',
      saveRecipe: 'Rezept speichern',
      recipeName: 'Rezeptname',
      stockInfo: 'Stockkonzentrat',
      stockFactorInfo: 'Konzentrationsfaktor',
      preparedFor: 'Berechnet für',
      ofSolution: 'Lösung',
      perLiterUse: 'Pro Liter Endlösung:',
      ml: 'mL',
      perTank: 'pro Tank',
    },
    db: {
      title: 'Salz-Datenbank',
      addNew: 'Neues Salz',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      activate: 'Aktivieren',
      noSalts: 'Keine Salze vorhanden.',
      name: 'Name',
      formula: 'Formel',
      kuerzel: 'Kürzel',
      tank: 'Tank',
      purity: 'Reinheit',
      price: 'Preis (€/kg)',
      solubility: 'Löslichkeit',
      solubilityHint: 'in g/L bei 20°C',
      composition: 'Zusammensetzung (% pro Element)',
      hint: 'Werte als Prozent eingeben, bis zu 3 Dezimalstellen.',
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirmDelete: 'Salz wirklich löschen?',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      sortByName: 'Name',
      sortByCation: 'Kation',
      sortByAnion: 'Anion',
      sort: 'Sortieren',
      sortBy: 'Sortieren nach',
      restoreDefaults: 'Standardsalze wiederherstellen',
      saltExists: 'Ein Salz mit diesem Namen existiert bereits.',
      nameRequired: 'Name ist erforderlich.',
      tankPlaceholder: 'z.B. A, B, C',
      fromFormula: 'aus Formel berechnet',
      tabSalts: 'Salze',
      tabProducts: 'Produkte',
      addProduct: 'Neues Produkt',
      noProducts: 'Keine Produkte vorhanden.',
      productExists: 'Ein Produkt mit diesem Namen existiert bereits.',
      confirmDeleteProduct: 'Produkt wirklich löschen?',
      dosePerL: 'Dosierung pro Liter',
      dosePerLHint: 'optional – vom Hersteller empfohlen',
    },
    settings: {
      title: 'Einstellungen',
      language: 'Sprache',
      theme: 'Erscheinungsbild',
      dark: 'Dunkel',
      light: 'Hell',
      auto: 'System',
      data: 'Daten',
      resetAll: 'Alle Daten zurücksetzen',
      confirmReset: 'Wirklich alle Daten zurücksetzen? Dies kann nicht rückgängig gemacht werden.',
      about: 'Über',
      version: 'Version',
      desc: 'Mischrechner für hydroponische Nährlösungen und Stockkonzentrate.',
      accentColor: 'Akzentfarbe',
      elementColors: 'Elementfarben',
      elementColorsOn: 'Elementfarben anzeigen',
      elementColorsHint: 'Symbole und chemische Wortteile werden in elementspezifischen Farben dargestellt.',
      customizeElements: 'Element-Farben anpassen',
      resetElementColors: 'Standard-Farben wiederherstellen',
      pickColor: 'Farbe wählen',
      autoFillFromFormula: 'Aus Formel automatisch berechnen',
      formulaParseError: 'Formel konnte nicht ausgewertet werden.',
    },
    knowledge: {
      title: 'Wissen',
      overview: 'Übersicht',
      phAvailability: 'Element-Verfügbarkeit nach pH',
      phAvailabilityDesc: 'Wie Wurzeln Nährstoffe je nach pH-Wert aufnehmen.',
      vpd: 'VPD-Tabelle',
      vpdDesc: 'Vapor Pressure Deficit nach Temperatur und Luftfeuchtigkeit.',
      runoff: 'Rootzone-Diagnose',
      runoffDesc: 'EC und pH richtig interpretieren — Run-off und Reservoir.',
      compat: 'Salz-Kompatibilität',
      compatDesc: 'Welche Düngesalze sich nicht vertragen.',
      periodic: 'Periodensystem',
      periodicDesc: 'Atomare Eigenschaften aller Elemente.',
      foliarCheat: 'Foliar Cheat Sheet',
      foliarCheatDesc: 'Salze, Dosierungen & Regeln für Blattdüngung.',
      comingSoon: 'Folgt in Kürze',
      back: 'Zurück',
      strongAcid: 'stark sauer',
      mediumAcid: 'mäßig sauer',
      slightAcid: 'leicht sauer',
      neutral: 'neutral',
      slightAlkaline: 'leicht alkalisch',
      mediumAlkaline: 'mäßig alkalisch',
      strongAlkaline: 'stark alkalisch',
      phValue: 'pH-Wert',
      availability: 'Verfügbarkeit',
      medium: 'Kulturmedium',
      modeSoil: 'Erde',
      modeHydro: 'Hydroponik / Kokos',
      source: 'Quelle',
    },
    elements: {
      'N-NO3': 'N (NO₃⁻)',
      'N-NH4': 'N (NH₄⁺)',
      'P': 'P',
      'K': 'K',
      'Mg': 'Mg',
      'Ca': 'Ca',
      'S': 'S',
      'Fe': 'Fe',
      'Mn': 'Mn',
      'Zn': 'Zn',
      'B': 'B',
      'Cu': 'Cu',
      'Mo': 'Mo',
      'Ni': 'Ni',
      'Co': 'Co',
      'Si': 'Si',
      'Cl': 'Cl',
      'Na': 'Na',
    }
  },
  en: {
    appTitle: 'GrowCulator nutrient calculator',
    nav: { calculator: 'Calculator', recipe: 'Recipe', database: 'Database', knowledge: 'Reference', settings: 'Settings' },
    calc: {
      title: 'Nutrient Calculation',
      mode: 'Solution Type',
      directSolution: 'Direct Solution',
      stockConcentrate: 'Stock Concentrate',
      volume: 'Volume',
      liters: 'Liters',
      concentrationFactor: 'Concentration Factor',
      times: '×',
      calcMode: 'Calculation Mode',
      auto: 'Automatic',
      manual: 'Manual',
      targetValues: 'Target Values (ppm)',
      element: 'Element',
      target: 'Target',
      result: 'Result',
      selectSalts: 'Select Salts',
      selectSaltsHint: 'Pick the salts from your database to use in the mixture.',
      noSaltsAvailable: 'No salts in the database. Add salts under Database first.',
      calculate: 'Calculate',
      reset: 'Reset',
      resultTitle: 'Result',
      noResult: 'No calculation yet.',
      salt: 'Salt',
      tank: 'Tank',
      mass: 'Mass (g)',
      cost: 'Cost',
      totalCost: 'Total Cost',
      dosingHint: 'Dosing per liter of final solution:',
      mlPerL: 'ml/L',
      warnings: 'Warnings',
      noWarnings: 'No warnings.',
      warnSolubility: 'Solubility limit exceeded',
      warnSolubilityNear: 'Near solubility limit (>80%)',
      warnIncompat: 'Incompatible salts in same tank',
      warnUnmet: 'Target value not reachable',
      deviation: 'Deviation',
      saveRecipe: 'Save Recipe',
      recipeName: 'Recipe Name',
      stockInfo: 'Stock Concentrate',
      stockFactorInfo: 'Concentration Factor',
      preparedFor: 'Prepared for',
      ofSolution: 'of solution',
      perLiterUse: 'Per liter of final solution:',
      ml: 'mL',
      perTank: 'per tank',
    },
    db: {
      title: 'Salt Database',
      addNew: 'New Salt',
      edit: 'Edit',
      delete: 'Delete',
      activate: 'Activate',
      noSalts: 'No salts available.',
      name: 'Name',
      formula: 'Formula',
      kuerzel: 'Abbrev.',
      tank: 'Tank',
      purity: 'Purity',
      price: 'Price (€/kg)',
      solubility: 'Solubility',
      solubilityHint: 'in g/L at 20°C',
      composition: 'Composition (% per element)',
      hint: 'Enter values as percentages, up to 3 decimal places.',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Really delete this salt?',
      active: 'Active',
      inactive: 'Inactive',
      sortByName: 'Name',
      sortByCation: 'Cation',
      sortByAnion: 'Anion',
      sort: 'Sort',
      sortBy: 'Sort by',
      restoreDefaults: 'Restore default salts',
      saltExists: 'A salt with this name already exists.',
      nameRequired: 'Name is required.',
      tankPlaceholder: 'e.g. A, B, C',
      fromFormula: 'calculated from formula',
      tabSalts: 'Salts',
      tabProducts: 'Products',
      addProduct: 'New Product',
      noProducts: 'No products available.',
      productExists: 'A product with this name already exists.',
      confirmDeleteProduct: 'Really delete this product?',
      dosePerL: 'Dose per liter',
      dosePerLHint: 'optional – manufacturer recommended',
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Appearance',
      dark: 'Dark',
      light: 'Light',
      auto: 'System',
      data: 'Data',
      resetAll: 'Reset all data',
      confirmReset: 'Really reset all data? This cannot be undone.',
      about: 'About',
      version: 'Version',
      desc: 'Mixing calculator for hydroponic nutrient solutions and stock concentrates.',
      accentColor: 'Accent color',
      elementColors: 'Element colors',
      elementColorsOn: 'Show element colors',
      elementColorsHint: 'Symbols and chemical word parts are shown in element-specific colors.',
      customizeElements: 'Customize element colors',
      resetElementColors: 'Restore default colors',
      pickColor: 'Pick a color',
      autoFillFromFormula: 'Auto-fill from formula',
      formulaParseError: 'Could not parse formula.',
    },
    knowledge: {
      title: 'Reference',
      overview: 'Overview',
      phAvailability: 'Nutrient availability by pH',
      phAvailabilityDesc: 'How roots uptake nutrients at different pH levels.',
      vpd: 'VPD chart',
      vpdDesc: 'Vapor Pressure Deficit by temperature and humidity.',
      runoff: 'Rootzone diagnosis',
      runoffDesc: 'Interpret EC and pH correctly — run-off and reservoir.',
      compat: 'Salt compatibility',
      compatDesc: 'Which fertilizer salts cannot be mixed.',
      periodic: 'Periodic table',
      periodicDesc: 'Atomic properties of all elements.',
      foliarCheat: 'Foliar Cheat Sheet',
      foliarCheatDesc: 'Salts, doses & rules for foliar feeding.',
      comingSoon: 'Coming soon',
      back: 'Back',
      strongAcid: 'strong acid',
      mediumAcid: 'medium acid',
      slightAcid: 'slight acid',
      neutral: 'neutral',
      slightAlkaline: 'slight alkaline',
      mediumAlkaline: 'medium alkaline',
      strongAlkaline: 'strong alkaline',
      phValue: 'pH value',
      availability: 'Availability',
      medium: 'Growing medium',
      modeSoil: 'Soil',
      modeHydro: 'Hydroponics / Coco',
      source: 'Source',
    },
    elements: {
      'N-NO3': 'N (NO₃⁻)',
      'N-NH4': 'N (NH₄⁺)',
      'P': 'P',
      'K': 'K',
      'Mg': 'Mg',
      'Ca': 'Ca',
      'S': 'S',
      'Fe': 'Fe',
      'Mn': 'Mn',
      'Zn': 'Zn',
      'B': 'B',
      'Cu': 'Cu',
      'Mo': 'Mo',
      'Ni': 'Ni',
      'Co': 'Co',
      'Si': 'Si',
      'Cl': 'Cl',
      'Na': 'Na',
    }
  }
};

// ============================================================
// ELEMENTE & STANDARDSALZE
// ============================================================
const ELEMENTS = ['N-NO3', 'N-NH4', 'P', 'K', 'Mg', 'Ca', 'S', 'Fe', 'Mn', 'Zn', 'Cu', 'Ni', 'Co', 'B', 'Mo', 'Cl', 'Si', 'Na'];

const emptyComposition = () => ELEMENTS.reduce((acc, e) => ({ ...acc, [e]: 0 }), {});

// ============================================================
// AKZENTFARBEN (8 Optionen)
// ============================================================
const ACCENT_COLORS = {
  emerald: { name: 'Emerald', accent: '#10b981', hover: '#34d399', soft: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7' },
  teal:    { name: 'Teal',    accent: '#14b8a6', hover: '#2dd4bf', soft: 'rgba(20, 184, 166, 0.15)', text: '#5eead4' },
  sky:     { name: 'Sky',     accent: '#0ea5e9', hover: '#38bdf8', soft: 'rgba(14, 165, 233, 0.15)', text: '#7dd3fc' },
  indigo:  { name: 'Indigo',  accent: '#4f46e5', hover: '#6366f1', soft: 'rgba(79, 70, 229, 0.18)',  text: '#a5b4fc' },
  violet:  { name: 'Violet',  accent: '#8b5cf6', hover: '#a78bfa', soft: 'rgba(139, 92, 246, 0.18)', text: '#c4b5fd' },
  magenta: { name: 'Magenta', accent: '#d946ef', hover: '#e879f9', soft: 'rgba(217, 70, 239, 0.18)', text: '#f0abfc' },
  rose:    { name: 'Rose',    accent: '#f43f5e', hover: '#fb7185', soft: 'rgba(244, 63, 94, 0.18)',  text: '#fda4af' },
  amber:   { name: 'Amber',   accent: '#f59e0b', hover: '#fbbf24', soft: 'rgba(245, 158, 11, 0.18)', text: '#fcd34d' },
};

// ============================================================
// ELEMENT-FARBEN (Standard-Schema)
// ============================================================
const ELEMENT_COLORS_DEFAULT = {
  'N-NO3': '#7CB342',  // Blattgrün
  'N-NH4': '#9CCC65',  // Junges Triebgrün
  'P':     '#E91E63',  // Magenta
  'K':     '#7E57C2',  // Violett (KMnO4 violett)
  'Mg':    '#26A69A',  // Smaragd / Chlorophyll
  'Ca':    '#D4E157',  // Limettengrün-Gelb (vom Nutzer gewählt)
  'S':     '#FDD835',  // Schwefelgelb
  'Fe':    '#BF5B3A',  // Rostbraun
  'Mn':    '#FFAB91',  // Pfirsich-Apricot (vom Nutzer gewählt)
  'Zn':    '#B0BEC5',  // Helles Bläulich-Silber
  'Cu':    '#1E88E5',  // Kupfersulfat-Blau
  'Ni':    '#00E5FF',  // Neon-Türkis
  'Co':    '#AD1457',  // Bordeaux / Weinrot
  'B':     '#D7CCC8',  // Helles Beige
  'Mo':    '#6D4C41',  // Dunkles Bronze-Braun
  'Cl':    '#C0CA33',  // Hellgelb-Grün
  'Si':    '#81D4FA',  // Glas-Hellblau
  'Na':    '#90A4AE',  // Mattgrau (Kontaminant)
};

// Wasser-Farbe für Kristallwasser (Hydrat-Anteile in Formeln)
const WATER_COLOR = '#3B82F6'; // Marineblau-Royal

// Kuratierte Farbpalette für Element-Farbauswahl (Nutzer wählt aus dieser Palette)
const ELEMENT_COLOR_PALETTE = [
  // Grüntöne
  '#7CB342', '#9CCC65', '#26A69A', '#10b981', '#14b8a6', '#84cc16', '#D4E157', '#C0CA33',
  // Gelb / Orange
  '#FDD835', '#f59e0b', '#FFAB91', '#FF8A65', '#FFB74D', '#fb923c',
  // Rot / Rosa / Magenta
  '#FF4081', '#E91E63', '#AD1457', '#f43f5e', '#BF5B3A', '#dc2626',
  // Blau / Türkis
  '#1E88E5', '#0ea5e9', '#00E5FF', '#81D4FA', '#3B82F6', '#06b6d4',
  // Violett
  '#7E57C2', '#8b5cf6', '#d946ef', '#a855f7',
  // Neutral / Erdtöne
  '#B0BEC5', '#90A4AE', '#D7CCC8', '#6D4C41', '#78716c', '#525252',
];

// ============================================================
// ATOMMASSEN (für Parser)
// ============================================================
const ATOMIC_MASSES = {
  'H': 1.008, 'He': 4.0026,
  'Li': 6.94, 'Be': 9.0122, 'B': 10.81, 'C': 12.011, 'N': 14.007, 'O': 15.999, 'F': 18.998, 'Ne': 20.18,
  'Na': 22.99, 'Mg': 24.305, 'Al': 26.982, 'Si': 28.085, 'P': 30.974, 'S': 32.06, 'Cl': 35.45, 'Ar': 39.948,
  'K': 39.098, 'Ca': 40.078, 'Sc': 44.956, 'Ti': 47.867, 'V': 50.942, 'Cr': 51.996, 'Mn': 54.938,
  'Fe': 55.845, 'Co': 58.933, 'Ni': 58.693, 'Cu': 63.546, 'Zn': 65.38, 'Ga': 69.723, 'Ge': 72.63,
  'As': 74.922, 'Se': 78.971, 'Br': 79.904, 'Kr': 83.798,
  'Rb': 85.468, 'Sr': 87.62, 'Y': 88.906, 'Zr': 91.224, 'Nb': 92.906, 'Mo': 95.95, 'Tc': 98,
  'Ru': 101.07, 'Rh': 102.91, 'Pd': 106.42, 'Ag': 107.87, 'Cd': 112.41, 'In': 114.82, 'Sn': 118.71,
  'Sb': 121.76, 'Te': 127.6, 'I': 126.9, 'Xe': 131.29,
  'Cs': 132.91, 'Ba': 137.33,
};

// ============================================================
// FORMEL-PARSER
// Versteht: Klammern, Hydrate (·, *, ., Leerzeichen + Zahl + H2O),
//           Indizes direkt nach Element/Klammer
// Normalisiert: Ca(NO3)2.4H2O, Ca(NO3)2*4H2O, Mg(NO3)2 6H2O -> Ca(NO3)2·4H2O
// ============================================================
function normalizeFormulaInput(input) {
  if (!input) return '';
  // Kristallwasser-Separator vereinheitlichen
  let s = input.trim().replace(/\s+/g, ' ');
  // *, . oder Leerzeichen zwischen abgeschlossener Gruppe und Zahl+H2O → ·
  s = s.replace(/[*·]\s*/g, '·');
  s = s.replace(/\.\s*(\d+\s*H\s*2\s*O)/gi, '·$1');
  s = s.replace(/\s(\d+\s*H\s*2\s*O)/gi, '·$1');
  // Entferne Leerzeichen innerhalb von H 2 O
  s = s.replace(/H\s*2\s*O/gi, 'H2O');
  return s;
}

// Parse formula into element counts. Returns null on syntax error.
function parseFormula(formula) {
  if (!formula) return null;
  const s = normalizeFormulaInput(formula);
  const counts = {};
  let i = 0;

  function parseGroup() {
    const result = {};
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') {
        i++;
        const inner = parseGroup();
        if (s[i] !== ')') return null;
        i++;
        const mult = parseNumber();
        Object.keys(inner).forEach(k => { result[k] = (result[k] || 0) + inner[k] * mult; });
      } else if (ch === ')') {
        return result;
      } else if (ch === '·') {
        // Hydrat-Trenner: alles danach wird mit Multiplikator gerechnet
        i++;
        const mult = parseNumber();
        const inner = parseGroup();
        if (!inner) return null;
        Object.keys(inner).forEach(k => { result[k] = (result[k] || 0) + inner[k] * mult; });
      } else if (/[A-Z]/.test(ch)) {
        let sym = ch;
        i++;
        if (i < s.length && /[a-z]/.test(s[i])) {
          sym += s[i];
          i++;
        }
        if (!ATOMIC_MASSES[sym]) return null;
        const n = parseNumber();
        result[sym] = (result[sym] || 0) + n;
      } else if (ch === ' ') {
        i++;
      } else {
        // unbekanntes Zeichen
        return null;
      }
    }
    return result;
  }

  function parseNumber() {
    let num = '';
    while (i < s.length && /[0-9]/.test(s[i])) {
      num += s[i];
      i++;
    }
    return num === '' ? 1 : parseInt(num, 10);
  }

  const result = parseGroup();
  return result;
}

// Berechne Element-Anteile (%) aus Formel
function computeCompositionFromFormula(formula) {
  const atoms = parseFormula(formula);
  if (!atoms) return null;
  let totalMass = 0;
  Object.entries(atoms).forEach(([sym, n]) => {
    totalMass += (ATOMIC_MASSES[sym] || 0) * n;
  });
  if (totalMass === 0) return null;

  const comp = emptyComposition();
  // Mapping: Stickstoff aus Formel ist erstmal "N total" — wir können nicht
  // automatisch unterscheiden, ob NO3 oder NH4. Daher: alles als N-NO3,
  // außer Formel enthält "NH4" (dann splitten wir).
  // Einfacher Heuristik: NH4-Gruppen zählen
  const nh4Pattern = /\(NH4\)|NH4/g;
  let nh4Count = 0;
  const matches = formula.match(nh4Pattern);
  if (matches) {
    // grobe Erkennung — gilt nur wenn unklare Fälle nicht vorkommen
    matches.forEach(m => {
      // wenn NH4 nicht doppelt gezählt wurde durch (NH4)
      nh4Count += 1;
    });
    // korrekter wäre dedupliziertes Parsen, hier reicht das für Schätzung
    nh4Count = (formula.match(/NH4/g) || []).length;
  }

  Object.entries(atoms).forEach(([sym, n]) => {
    const massShare = (ATOMIC_MASSES[sym] * n / totalMass) * 100;
    if (sym === 'N') {
      // N aufteilen anhand der NH4-Gruppen
      const nh4N = Math.min(n, nh4Count);
      const no3N = n - nh4N;
      comp['N-NH4'] = (n > 0 ? nh4N / n : 0) * massShare;
      comp['N-NO3'] = (n > 0 ? no3N / n : 0) * massShare;
    } else if (ELEMENTS.includes(sym)) {
      comp[sym] = massShare;
    }
    // Elemente außerhalb unserer Liste (H, O, C) werden ignoriert,
    // gehen aber in die Gesamtmasse ein -> Prozente sind dann korrekt
  });

  return comp;
}

// ============================================================
// FORMEL-FORMATIERUNG für die Anzeige
// Aus "Ca(NO3)2·4H2O" macht ein Array aus Tokens:
//   [{type:'el', sym:'Ca'}, {type:'open'}, {type:'el', sym:'N'}, {type:'sub', n:3}, ...]
// ============================================================
function tokenizeFormula(formula) {
  if (!formula) return [];
  const s = normalizeFormulaInput(formula);
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[A-Z]/.test(ch)) {
      let sym = ch;
      i++;
      if (i < s.length && /[a-z]/.test(s[i])) {
        sym += s[i];
        i++;
      }
      tokens.push({ type: 'el', sym });
    } else if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9]/.test(s[i])) { num += s[i]; i++; }
      // Prüfe Kontext: vor Element ohne · davor → Multiplikator (Hydrat-Zahl)
      // sonst → tiefgestellter Index
      const prev = tokens[tokens.length - 1];
      const isHydrateMultiplier = prev && prev.type === 'hydrate';
      tokens.push({ type: isHydrateMultiplier ? 'mult' : 'sub', n: parseInt(num, 10) });
    } else if (ch === '(') { tokens.push({ type: 'open' }); i++; }
    else if (ch === ')') { tokens.push({ type: 'close' }); i++; }
    else if (ch === '·') { tokens.push({ type: 'hydrate' }); i++; }
    else { i++; }
  }
  return tokens;
}

// ============================================================
// NAME-EINFÄRBUNG: Erkenne chemische Wortteile im Salznamen
// und ordne sie Elementen zu
// ============================================================
const NAME_PATTERNS = [
  // Längere zuerst, damit z.B. "Ammonium" vor "Ammon" matcht
  // Wasser / Hydrat-Bezeichnungen
  { pattern: /Monohydrate?|Monohydrat|Dihydrate?|Dihydrat|Trihydrate?|Trihydrat|Tetrahydrate?|Tetrahydrat|Pentahydrate?|Pentahydrat|Hexahydrate?|Hexahydrat|Heptahydrate?|Heptahydrat|Octahydrate?|Octahydrat|Nonahydrate?|Nonahydrat|Decahydrate?|Decahydrat|Hydrate?|Hydrat/gi, element: 'WATER' },
  { pattern: /Ammonium|Ammoniumnitrat|Ammonium-/gi, element: 'N-NH4' },
  { pattern: /Nitrate?|Nitrat/gi, element: 'N-NO3' },
  { pattern: /Phosphate?|Phosphat/gi, element: 'P' },
  { pattern: /Sulfate?|Sulfat|Sulphate/gi, element: 'S' },
  { pattern: /Chloride?|Chlorid/gi, element: 'Cl' },
  { pattern: /Silicate?|Silikat/gi, element: 'Si' },
  { pattern: /Molybdate?|Molybdat/gi, element: 'Mo' },
  { pattern: /Borate?|Borat|Boric|Bor(?!ate)/gi, element: 'B' },
  { pattern: /Calcium|Kalzium/gi, element: 'Ca' },
  { pattern: /Potassium|Kalium/gi, element: 'K' },
  { pattern: /Sodium|Natrium/gi, element: 'Na' },
  { pattern: /Magnesium/gi, element: 'Mg' },
  { pattern: /Iron|Eisen|Ferr(o|i)/gi, element: 'Fe' },
  { pattern: /Manganese|Mangan(?!ese)/gi, element: 'Mn' },
  { pattern: /Zinc|Zink/gi, element: 'Zn' },
  { pattern: /Copper|Kupfer|Cupric/gi, element: 'Cu' },
  { pattern: /Nickel/gi, element: 'Ni' },
  { pattern: /Cobalt|Kobalt/gi, element: 'Co' },
];

function highlightSaltName(name) {
  if (!name) return [{ text: '' }];
  // Sammle alle Treffer mit Position
  const matches = [];
  NAME_PATTERNS.forEach(({ pattern, element }) => {
    let m;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(name)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, element, text: m[0] });
    }
  });
  // Bei Überlappung: längeren Match bevorzugen
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted = [];
  let lastEnd = -1;
  matches.forEach(m => {
    if (m.start >= lastEnd) {
      accepted.push(m);
      lastEnd = m.end;
    }
  });
  // Baue Token-Array aus Text + farbigen Teilen
  const result = [];
  let cursor = 0;
  accepted.forEach(m => {
    if (m.start > cursor) result.push({ text: name.slice(cursor, m.start) });
    result.push({ text: name.slice(m.start, m.end), element: m.element });
    cursor = m.end;
  });
  if (cursor < name.length) result.push({ text: name.slice(cursor) });
  return result;
}

const DEFAULT_SALTS = [
  // === TANK A — Nitrate + Salpetersäure ===
  { id: 'def-cano3', kuerzel: 'CaN', name: 'Calcium Nitrate', formula: '5Ca(NO3)2·NH4NO3·10H2O', tank: 'A', purity: 100, price: 3.50, solubility: 1290, active: true, composition: { ...emptyComposition(), 'Ca': 18.580, 'N-NO3': 14.400, 'N-NH4': 1.100 } },
  { id: 'def-kno3', kuerzel: 'KN', name: 'Potassium Nitrate', formula: 'KNO3', tank: 'A', purity: 100, price: 4.20, solubility: 316, active: true, composition: { ...emptyComposition(), 'K': 38.672, 'N-NO3': 13.854 } },
  { id: 'def-mgno3', kuerzel: 'MgN', name: 'Magnesium Nitrate Hexahydrate', formula: 'Mg(NO3)2·6H2O', tank: 'A', purity: 100, price: 4.00, solubility: 1250, active: false, composition: { ...emptyComposition(), 'Mg': 9.479, 'N-NO3': 10.926 } },
  { id: 'def-nh4no3', kuerzel: 'AmN', name: 'Ammonium Nitrate', formula: 'NH4NO3', tank: 'A', purity: 100, price: 3.00, solubility: 1900, active: false, composition: { ...emptyComposition(), 'N-NH4': 17.499, 'N-NO3': 17.499 } },
  { id: 'def-hno3', kuerzel: 'NA', name: 'Nitric Acid 3%', formula: 'HNO3', tank: 'A', purity: 100, price: 6.00, solubility: 9999, active: false, composition: { ...emptyComposition(), 'N-NO3': 0.667 } },

  // === TANK B — Sulfate, Chloride, Phosphate ===
  { id: 'def-k2so4', kuerzel: 'KS', name: 'Potassium Sulfate', formula: 'K2SO4', tank: 'B', purity: 100, price: 3.20, solubility: 120, active: false, composition: { ...emptyComposition(), 'K': 44.875, 'S': 18.399 } },
  { id: 'def-mgso4', kuerzel: 'MgS', name: 'Magnesium Sulfate Heptahydrate', formula: 'MgSO4·7H2O', tank: 'B', purity: 100, price: 1.80, solubility: 710, active: true, composition: { ...emptyComposition(), 'Mg': 9.861, 'S': 13.008 } },
  { id: 'def-mkp', kuerzel: 'MKP', name: 'Monopotassium Phosphate (MKP)', formula: 'KH2PO4', tank: 'B', purity: 100, price: 5.50, solubility: 226, active: true, composition: { ...emptyComposition(), 'K': 28.731, 'P': 22.761 } },
  { id: 'def-map', kuerzel: 'MAP', name: 'Monoammonium Phosphate (MAP)', formula: 'NH4H2PO4', tank: 'B', purity: 100, price: 4.90, solubility: 404, active: false, composition: { ...emptyComposition(), 'N-NH4': 12.177, 'P': 26.928 } },
  { id: 'def-dap', kuerzel: 'DAP', name: 'Diammonium Phosphate (DAP)', formula: '(NH4)2HPO4', tank: 'B', purity: 100, price: 4.50, solubility: 575, active: false, composition: { ...emptyComposition(), 'N-NH4': 21.214, 'P': 23.455 } },
  { id: 'def-nh4cl', kuerzel: 'AmCl', name: 'Ammonium Chloride', formula: 'NH4Cl', tank: 'B', purity: 100, price: 2.20, solubility: 372, active: false, composition: { ...emptyComposition(), 'N-NH4': 26.187, 'Cl': 66.275 } },
  { id: 'def-kcl', kuerzel: 'KCl', name: 'Potassium Chloride', formula: 'KCl', tank: 'B', purity: 100, price: 2.00, solubility: 344, active: false, composition: { ...emptyComposition(), 'K': 52.447, 'Cl': 47.553 } },
  { id: 'def-nh4so4', kuerzel: 'AmS', name: 'Ammonium Sulfate', formula: '(NH4)2SO4', tank: 'B', purity: 100, price: 1.50, solubility: 754, active: false, composition: { ...emptyComposition(), 'N-NH4': 21.201, 'S': 24.263 } },
  { id: 'def-cacl2', kuerzel: 'CaCl', name: 'Calcium Chloride Dihydrate', formula: 'CaCl2·2H2O', tank: 'B', purity: 100, price: 2.50, solubility: 745, active: false, composition: { ...emptyComposition(), 'Ca': 27.262, 'Cl': 48.229 } },

  // === TANK C — Mikronährstoffe ===
  { id: 'def-feso4', kuerzel: 'FeS', name: 'Iron Sulfate Heptahydrate', formula: 'FeSO4·7H2O', tank: 'C', purity: 100, price: 4.50, solubility: 256, active: true, composition: { ...emptyComposition(), 'Fe': 20.088, 'S': 11.532 } },
  { id: 'def-mnso4', kuerzel: 'MnS', name: 'Manganese Sulfate Monohydrate', formula: 'MnSO4·H2O', tank: 'C', purity: 100, price: 4.50, solubility: 700, active: true, composition: { ...emptyComposition(), 'Mn': 32.506, 'S': 18.969 } },
  { id: 'def-znso4', kuerzel: 'ZnS', name: 'Zinc Sulfate Heptahydrate', formula: 'ZnSO4·7H2O', tank: 'C', purity: 100, price: 5.00, solubility: 580, active: true, composition: { ...emptyComposition(), 'Zn': 22.738, 'S': 11.150 } },
  { id: 'def-cuso4', kuerzel: 'CuS', name: 'Copper Sulfate Pentahydrate', formula: 'CuSO4·5H2O', tank: 'C', purity: 100, price: 8.00, solubility: 320, active: true, composition: { ...emptyComposition(), 'Cu': 25.451, 'S': 12.841 } },
  { id: 'def-coso4', kuerzel: 'CoS', name: 'Cobalt Sulfate Heptahydrate', formula: 'CoSO4·7H2O', tank: 'C', purity: 100, price: 30.00, solubility: 600, active: false, composition: { ...emptyComposition(), 'Co': 20.966, 'S': 11.405 } },
  { id: 'def-niso4', kuerzel: 'NiS', name: 'Nickel Sulfate Hexahydrate', formula: 'NiSO4·6H2O', tank: 'C', purity: 100, price: 25.00, solubility: 650, active: false, composition: { ...emptyComposition(), 'Ni': 22.330, 'S': 12.198 } },
  { id: 'def-namoo4', kuerzel: 'MoNa', name: 'Sodium Molybdate Dihydrate', formula: 'Na2MoO4·2H2O', tank: 'C', purity: 100, price: 35.00, solubility: 840, active: true, composition: { ...emptyComposition(), 'Mo': 39.656, 'Na': 19.003 } },
  { id: 'def-h3bo3', kuerzel: 'BA', name: 'Boric Acid', formula: 'H3BO3', tank: 'C', purity: 100, price: 4.00, solubility: 47, active: true, composition: { ...emptyComposition(), 'B': 17.483 } },

  // === Ohne Tank — Feststoffe / Substrat-Korrektoren ===
  { id: 'def-caso4', kuerzel: 'CaS', name: 'Calcium Sulfate Dihydrate (Gypsum)', formula: 'CaSO4·2H2O', tank: '', purity: 100, price: 1.00, solubility: 2.4, active: false, composition: { ...emptyComposition(), 'Ca': 23.279, 'S': 18.622 } },
  { id: 'def-caco3', kuerzel: 'CaC', name: 'Calcium Carbonate (Lime)', formula: 'CaCO3', tank: '', purity: 100, price: 0.50, solubility: 0.014, active: false, composition: { ...emptyComposition(), 'Ca': 40.044 } },
  { id: 'def-tcp', kuerzel: 'PCal', name: 'Tricalcium Phosphate (TCP)', formula: 'Ca3(PO4)2', tank: '', purity: 100, price: 3.00, solubility: 0.02, active: false, composition: { ...emptyComposition(), 'Ca': 38.763, 'P': 19.972 } },
];

// Lookup-Tabellen für die Kürzel-Migration (Default-Salze nach id bzw. Name)
const DEFAULT_SALT_BY_ID = Object.fromEntries(DEFAULT_SALTS.map(s => [s.id, s]));
const DEFAULT_SALT_BY_NAME = Object.fromEntries(DEFAULT_SALTS.map(s => [s.name, s]));

// Salze, die VOR Einführung des Kürzel-Feldes gespeichert wurden, haben kein
// kuerzel. Diese Funktion füllt das Feld bei allen Default-Salzen anhand der
// von uns gewählten Kürzel nach (Abgleich über id, ersatzweise über den Namen).
function migrateSaltKuerzel(salts) {
  if (!Array.isArray(salts)) return salts;
  return salts.map(s => {
    if (s.kuerzel && String(s.kuerzel).trim()) return s; // bereits gesetzt
    const def = DEFAULT_SALT_BY_ID[s.id] || DEFAULT_SALT_BY_NAME[s.name];
    if (def && def.kuerzel) return { ...s, kuerzel: def.kuerzel };
    return s;
  });
}

// Inkompatibilitäten (für Tank-Konflikt-Warnung): Paare aus Salz-Pattern, die nicht zusammenpassen
const INCOMPATIBILITY_RULES = [
  // Calcium + Phosphat -> Calciumphosphat
  { test: (a, b) => hasElement(a, 'Ca') && hasElement(b, 'P') },
  // Calcium + Sulfat (außer Gips selbst) -> Gips
  { test: (a, b) => hasElement(a, 'Ca') && hasElement(b, 'S') && !a.formula.includes('SO4') },
];

function hasElement(salt, el) {
  return (salt.composition[el] || 0) > 0.5;
}

// Kompatibilitäts-Level für zwei Salze (symmetrisch)
// Gibt zurück: { level: 'ok'|'limited'|'bad', reason?: {de, en} }
// Selbe Substanz mit sich selbst = 'ok'
function compatibilityLevel(a, b) {
  if (a.id === b.id) return { level: 'ok' };

  // Schwer lösliche Salze setzen keine Ionen frei → kein Ausfällungsrisiko
  const isInsoluble = (s) => /CaCO3|Ca3\(PO4\)2/.test(s.formula || '');
  if (isInsoluble(a) || isInsoluble(b)) return { level: 'ok' };

  // Gips (CaSO4): schwer löslich, daher nur in Stockkonzentraten problematisch
  const isGypsum = (s) => /CaSO4/.test(s.formula || '');

  const aCa = hasElement(a, 'Ca'), bCa = hasElement(b, 'Ca');
  const aP  = hasElement(a, 'P'),  bP  = hasElement(b, 'P');
  const aS  = hasElement(a, 'S'),  bS  = hasElement(b, 'S');
  const aMg = hasElement(a, 'Mg'), bMg = hasElement(b, 'Mg');
  const aFe = hasElement(a, 'Fe'), bFe = hasElement(b, 'Fe');
  const aMn = hasElement(a, 'Mn'), bMn = hasElement(b, 'Mn');
  const aZn = hasElement(a, 'Zn'), bZn = hasElement(b, 'Zn');
  const aCu = hasElement(a, 'Cu'), bCu = hasElement(b, 'Cu');
  const aCl = hasElement(a, 'Cl'), bCl = hasElement(b, 'Cl');
  const aNH4 = (a.composition['N-NH4'] || 0) > 0.5;
  const bNH4 = (b.composition['N-NH4'] || 0) > 0.5;

  // Calcium + Phosphat -> Ca-Phosphat-Niederschlag (sehr schlecht)
  if ((aCa && bP) || (bCa && aP)) {
    if (isGypsum(a) || isGypsum(b)) {
      return { level: 'limited', reason: {
        de: 'Calciumsulfat (Gips) ist schwer löslich und setzt kaum Calcium frei. In Fertig-Nährlösungen verträglich, in konzentrierten Stocklösungen nicht empfohlen.',
        en: 'Calcium sulfate (gypsum) is sparingly soluble and releases little calcium. Compatible in final nutrient solutions, not recommended in concentrated stock solutions.',
      }};
    }
    return { level: 'bad', reason: {
      de: 'Calcium und Phosphat bilden unlösliches Calciumphosphat.',
      en: 'Calcium and phosphate form insoluble calcium phosphate.',
    }};
  }
  // Calcium + Sulfat -> Gips (außer Gips selbst). Bei sehr niedrigen Konzentrationen tolerierbar.
  if ((aCa && bS && !a.formula.includes('SO4')) || (bCa && aS && !b.formula.includes('SO4'))) {
    if (isGypsum(a) || isGypsum(b)) {
      return { level: 'limited', reason: {
        de: 'Calciumsulfat (Gips) ist schwer löslich und setzt kaum Calcium frei. In Fertig-Nährlösungen verträglich, in konzentrierten Stocklösungen nicht empfohlen.',
        en: 'Calcium sulfate (gypsum) is sparingly soluble and releases little calcium. Compatible in final nutrient solutions, not recommended in concentrated stock solutions.',
      }};
    }
    return { level: 'limited', reason: {
      de: 'Calcium und Sulfat können Gips (Calciumsulfat) ausfällen. Nur in stark verdünnten Lösungen tolerierbar.',
      en: 'Calcium and sulfate can precipitate as gypsum. Tolerable only in highly diluted solutions.',
    }};
  }
  // Magnesium + Phosphat in Stockkonzentrat -> Mg-Phosphat
  if ((aMg && bP) || (bMg && aP)) {
    return { level: 'limited', reason: {
      de: 'Magnesium und Phosphat können in konzentrierten Lösungen Magnesiumphosphat ausfällen.',
      en: 'Magnesium and phosphate can precipitate as magnesium phosphate in concentrated solutions.',
    }};
  }
  // Phosphat + Spurenmetalle (Fe, Mn, Zn, Cu): die Metalle bilden Phosphate
  // Bei chelatierten Metallen weniger problematisch, aber bei hohen Konzentrationen kritisch
  if ((aP && (bFe || bMn || bZn || bCu)) || (bP && (aFe || aMn || aZn || aCu))) {
    return { level: 'limited', reason: {
      de: 'Phosphate können mit Mikronährstoff-Metallen reagieren. Bei chelatierten Mikros meist unkritisch.',
      en: 'Phosphates can react with micronutrient metals. Usually uncritical with chelated micros.',
    }};
  }
  // Ammonium + Calcium nicht problematisch chemisch, aber im selben Tank kann es zu pH-Drift kommen
  // Wir sehen das als 'ok' (Standard-Praxis in Hydroponik)

  return { level: 'ok' };
}

// ============================================================
// BERECHNUNGSLOGIK
// ============================================================

// Non-negative Least Squares über Projected Gradient Descent
// Löst: min ||A*x - b||² unter x >= 0
function solveNNLS(A, b, maxIter = 5000, tol = 1e-9) {
  const m = A.length;
  if (m === 0) return [];
  const n = A[0].length;
  const x = new Array(n).fill(0);

  // AtA und Atb vorberechnen
  const AtA = Array.from({ length: n }, () => new Array(n).fill(0));
  const Atb = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < m; k++) s += A[k][i] * A[k][j];
      AtA[i][j] = s;
    }
    let s = 0;
    for (let k = 0; k < m; k++) s += A[k][i] * b[k];
    Atb[i] = s;
  }

  // Lipschitz-Konstante grob abschätzen (Power Iteration vereinfacht über Frobenius)
  let L = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) L += AtA[i][j] * AtA[i][j];
  L = Math.sqrt(L) || 1;
  const step = 1 / L;

  for (let iter = 0; iter < maxIter; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      let grad = -Atb[i];
      for (let j = 0; j < n; j++) grad += AtA[i][j] * x[j];
      const newVal = Math.max(0, x[i] - step * grad);
      maxDelta = Math.max(maxDelta, Math.abs(newVal - x[i]));
      x[i] = newVal;
    }
    if (maxDelta < tol) break;
  }
  return x;
}

// Berechnung: gegeben Zielwerte (ppm in Endlösung) und ausgewählte Salze,
// finde Salzmengen (g/L Endlösung × Volumen × Faktor)
function calculateMix(targets, salts, volume, concentrationFactor) {
  // Zielwerte: ppm = mg/L = g/m³. Für Endlösung gilt: Ziel-ppm direkt nutzen.
  // Bei Stockkonzentrat: Salzmenge wird so berechnet, dass das Stock × Faktor die Zielwerte ergibt.
  // Stockvolumen × Faktor = entspricht so viel Endlösung. Aber Nutzer gibt Stockvolumen ein.
  // Endlösungs-äquivalent: volume × concentrationFactor

  const equivalentVolume = volume * concentrationFactor; // Liter Endlösung
  // Wir berechnen: salzMasse_g = sum_i (composition_i × purity / 100) ergibt Element_i in g
  // Element_i in mg = composition × purity × salzMasse_g × 10 (wegen %)
  // ppm in Endlösung = Element_mg / Endlösungs-Volumen_L

  // Aktive Elemente: nur jene mit Zielwert > 0
  const activeElems = ELEMENTS.filter(e => (targets[e] || 0) > 0);
  if (activeElems.length === 0 || salts.length === 0) {
    return { masses: [], totalCost: 0, achieved: emptyComposition(), warnings: [] };
  }

  // Matrix A: Zeile pro Element, Spalte pro Salz
  // A[i][j] = mg_element pro g_salz = composition[%] × purity[%] / 100 × 10 = composition × purity / 10
  // Genauer: 1 g Salz × (composition/100) × (purity/100) = g Element ; ×1000 = mg
  // mg/g = composition × purity / 100 / 100 × 1000 = composition × purity / 10
  const A = activeElems.map(e =>
    salts.map(s => (s.composition[e] || 0) * (s.purity || 100) / 10)
  );

  // b: gewünschte mg total pro Element in der Endlösung = ppm × equivalentVolume
  const b = activeElems.map(e => (targets[e] || 0) * equivalentVolume);

  // Lösung x: g Salz total (für die Gesamtmenge Stock bzw. Endlösung)
  const x = solveNNLS(A, b);

  // Erreichte ppm pro Element (in Endlösung):
  const achieved = emptyComposition();
  ELEMENTS.forEach(e => {
    let totalMg = 0;
    salts.forEach((s, j) => {
      totalMg += x[j] * (s.composition[e] || 0) * (s.purity || 100) / 10;
    });
    achieved[e] = totalMg / equivalentVolume;
  });

  // Kosten
  const totalCost = x.reduce((acc, m, j) => acc + (m / 1000) * (salts[j].price || 0), 0);

  return { masses: x, totalCost, achieved };
}

// Automatik: wählt aus aktiven Salzen geeignete aus
function autoSelectSalts(targets, allActiveSalts) {
  return allActiveSalts.filter(s => {
    return ELEMENTS.some(e => (targets[e] || 0) > 0 && (s.composition[e] || 0) > 0);
  });
}

// Warnungen: Löslichkeit & Inkompatibilität
function analyzeWarnings(salts, masses, volume, concentrationFactor, targets, achieved, t) {
  const warnings = [];

  salts.forEach((s, j) => {
    const mass = masses[j];
    if (mass <= 0.0001) return;
    const concentrationGperL = mass / volume; // g/L im Stock bzw. in der Endlösung
    if (s.solubility && s.solubility > 0) {
      if (concentrationGperL > s.solubility) {
        warnings.push({
          level: 'error',
          text: `${s.name}: ${t.calc.warnSolubility} (${concentrationGperL.toFixed(1)} g/L > ${s.solubility} g/L)`
        });
      } else if (concentrationGperL > s.solubility * 0.8) {
        warnings.push({
          level: 'warn',
          text: `${s.name}: ${t.calc.warnSolubilityNear} (${concentrationGperL.toFixed(1)} g/L / ${s.solubility} g/L)`
        });
      }
    }
  });

  // Inkompatibilität: nur Salze, die wirklich Masse > 0 haben
  const usedSalts = salts.filter((_, j) => masses[j] > 0.0001);
  const byTank = {};
  usedSalts.forEach(s => {
    const tk = s.tank || '-';
    if (!byTank[tk]) byTank[tk] = [];
    byTank[tk].push(s);
  });
  Object.entries(byTank).forEach(([tank, group]) => {
    for (let i = 0; i < group.length; i++) {
      for (let k = i + 1; k < group.length; k++) {
        const a = group[i], b = group[k];
        for (const rule of INCOMPATIBILITY_RULES) {
          if (rule.test(a, b) || rule.test(b, a)) {
            warnings.push({
              level: 'error',
              text: `${t.calc.warnIncompat} (${tank}): ${a.name} + ${b.name}`
            });
            break;
          }
        }
      }
    }
  });

  // Zielabweichungen
  ELEMENTS.forEach(e => {
    if ((targets[e] || 0) > 0) {
      const dev = Math.abs((achieved[e] || 0) - targets[e]) / targets[e];
      if (dev > 0.05) {
        warnings.push({
          level: 'warn',
          text: `${t.calc.warnUnmet}: ${t.elements[e]} (${(achieved[e] || 0).toFixed(2)} / ${targets[e]} ppm, ${t.calc.deviation} ${(dev * 100).toFixed(1)}%)`
        });
      }
    }
  });

  return warnings;
}

// ============================================================
// STORAGE (localStorage für die echte App)
// ============================================================
async function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

async function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Save failed', e);
  }
}

// ============================================================
// HOOKS
// ============================================================
function useT(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS.de;
}

// ============================================================
// TRANSFER GROUP DIALOG
// ============================================================
function TransferGroupDialog({ groups = [], onConfirm, onCancel, isDark, accent = ACCENT_COLORS.emerald }) {
  const D = isDark;
  const cardBg = D ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200';
  const textPrimary = D ? 'text-neutral-100' : 'text-neutral-900';
  const textSub = D ? 'text-neutral-500' : 'text-neutral-400';
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-xs rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
        <div className={`px-3 py-2 border-b ${D ? 'border-neutral-800 bg-neutral-800/60' : 'border-neutral-100 bg-neutral-50'}`}>
          <div className={`text-[12px] font-semibold ${textPrimary}`}>Zur Gruppe hinzufügen</div>
        </div>
        <div className="px-3 py-2.5">
          {/* Group-Chips — kompaktes Chip-Layout wie DosingGuide */}
          <div className="flex flex-wrap gap-1.5">
            {groups.map(g => {
              const gc = g.themeColor || g.color || accent.accent;
              return (
                <button
                  key={g.id}
                  onClick={() => onConfirm(g.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors"
                  style={{
                    background: gc + '22',
                    border: `1px solid ${gc}`,
                    color: gc,
                  }}>
                  {g.name || <em className={textSub}>Unbenannt</em>}
                </button>
              );
            })}
            {/* "Neue Gruppe erstellen" als Chip im Stil der Group-Chips, gestrichelt */}
            <button
              onClick={() => onConfirm('__new__')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors"
              style={{
                background: accent.soft,
                border: `1px dashed ${accent.accent}`,
                color: accent.accent,
              }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Neue Gruppe
            </button>
          </div>
        </div>
        <div className={`px-3 py-2 border-t flex justify-end ${D ? 'border-neutral-800' : 'border-neutral-100'}`}>
          <button
            onClick={onCancel}
            className={`px-3 py-1 rounded-lg text-[11px] transition-colors ${D ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HAUPT-APP
// ============================================================
export default function App() {
  const [view, setView] = useState('calculator');
  const [lang, setLang] = useState(() => {
    const sys = (typeof navigator !== 'undefined' ? navigator.language : 'de').slice(0, 2);
    return sys === 'en' ? 'en' : 'de';
  });
  const [theme, setTheme] = useState('dark');
  const [salts, setSalts] = useState(DEFAULT_SALTS);
  const [accentKey, setAccentKey] = useState('emerald');
  const [accentAutoMode, setAccentAutoMode] = useState(null); // null | 'rotation' | 'rgb'
  const [rgbHue, setRgbHue] = useState(160); // start near emerald (green)
  const [elementColorsOn, setElementColorsOn] = useState(true);
  const [elementColors, setElementColors] = useState(ELEMENT_COLORS_DEFAULT);
  const [dbSortMode, setDbSortMode] = useState('name');
  const [saltLang, setSaltLang] = useState('de');
  const [phMode, setPhMode] = useState('soil'); // Default beim Erststart: Erde
  const [rootzoneMode, setRootzoneMode] = useState('runoff'); // Default: Run-off
  const [recipe, setRecipe] = useState(SAMPLE_RECIPE);
  const [recipeLibrary, setRecipeLibrary] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // Calculator state persists across tab switches; calcMode + selectedSaltIds
  // werden zusätzlich in localStorage gespeichert (überstehen App-Neustarts).
  // `result` lebt ebenfalls in calcState, damit das Ergebnisfeld nach Modul-
  // Wechsel erhalten bleibt; bei App-Neustart wird es wieder geleert.
  const [calcState, setCalcState] = useState({
    mode: 'direct',
    volume: 100,
    factor: 100,
    calcMode: 'manual',
    targets: emptyComposition(),
    selectedSaltIds: [],
    result: null,
  });
  // Transfer-to-recipe dialog: holds computed salts waiting for group selection
  const [pendingTransfer, setPendingTransfer] = useState(null); // null | { newGroups, salts: [{id,name,...}] }
  // Flash info for highlighting freshly transferred salts in RecipeView
  const [flashInfo, setFlashInfo] = useState(null); // null | { groupId, saltIds }

  // Chrome-Auto-Hide: Header und BottomNav blenden sich beim Runterscrollen aus
  // und kommen beim Hochscrollen (oder am Seitenanfang) wieder zurück.
  // Bewährtes Pattern aus iOS Safari / Material Design — schafft besonders im
  // Landscape-Mode auf dem Smartphone deutlich mehr Arbeitsfläche.
  const [chromeVisible, setChromeVisible] = useState(true);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const TOP_THRESHOLD = 60;   // <60px scrollY → immer einblenden
    const DELTA_THRESHOLD = 6;  // Mindest-Scrolldistanz, um Toggle auszulösen
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        const delta = y - lastY;
        if (y < TOP_THRESHOLD) {
          setChromeVisible(true);
        } else if (Math.abs(delta) > DELTA_THRESHOLD) {
          setChromeVisible(delta < 0); // Scroll hoch → zeigen, Scroll runter → ausblenden
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Beim Tab-Wechsel Chrome immer wieder einblenden — die neue View startet
  // oben, da soll Header + Nav sicher erreichbar sein.
  useEffect(() => { setChromeVisible(true); }, [view]);

  // Laden beim Start
  useEffect(() => {
    (async () => {
      const savedSalts = await loadFromStorage('hydro:salts', null);
      const savedLang = await loadFromStorage('hydro:lang', null);
      const savedTheme = await loadFromStorage('hydro:theme', null);
      const savedAccent = await loadFromStorage('hydro:accent', null);
      const savedAccentAutoMode = await loadFromStorage('hydro:accentAutoMode', null);
      const savedElemOn = await loadFromStorage('hydro:elemColorsOn', null);
      const savedElemColors = await loadFromStorage('hydro:elemColors', null);
      const savedDbSortMode = await loadFromStorage('hydro:dbSortMode', null);
      const savedSaltLang = await loadFromStorage('hydro:salt-lang', null);
      const savedPhMode = await loadFromStorage('hydro:phMode', null);
      const savedRootzoneMode = await loadFromStorage('hydro:rootzoneMode', null);
      const savedRecipe = await loadFromStorage('hydro:recipe', null);
      const savedRecipeLibrary = await loadFromStorage('hydro:recipe-library', null);
      if (savedSalts) setSalts(migrateSaltKuerzel(savedSalts));
      if (savedLang) setLang(savedLang);
      if (savedTheme) setTheme(savedTheme);
      if (savedAccentAutoMode === 'rotation') {
        // Pick a random accent color on every app launch
        const keys = Object.keys(ACCENT_COLORS);
        setAccentKey(keys[Math.floor(Math.random() * keys.length)]);
        setAccentAutoMode('rotation');
      } else if (savedAccentAutoMode === 'rgb') {
        setAccentAutoMode('rgb');
      } else if (savedAccent && ACCENT_COLORS[savedAccent]) {
        setAccentKey(savedAccent);
      }
      if (savedElemOn !== null) setElementColorsOn(savedElemOn);
      if (savedElemColors) setElementColors({ ...ELEMENT_COLORS_DEFAULT, ...savedElemColors });
      if (savedDbSortMode && ['name', 'cation', 'anion'].includes(savedDbSortMode)) setDbSortMode(savedDbSortMode);
      if (savedSaltLang && ['de', 'en'].includes(savedSaltLang)) setSaltLang(savedSaltLang);
      if (savedPhMode === 'soil' || savedPhMode === 'hydro') setPhMode(savedPhMode);
      if (savedRootzoneMode === 'runoff' || savedRootzoneMode === 'reservoir') setRootzoneMode(savedRootzoneMode);
      if (savedRecipe) setRecipe({ ...SAMPLE_RECIPE, ...savedRecipe, themeColor: savedRecipe.themeColor || '#10b981' });
      if (savedRecipeLibrary) setRecipeLibrary(savedRecipeLibrary);
      // Calculator-Persistenz: nur calcMode + selectedSaltIds (nicht result)
      const savedCalcMode = await loadFromStorage('hydro:calcMode', null);
      const savedCalcSelectedSaltIds = await loadFromStorage('hydro:calcSelectedSaltIds', null);
      if (savedCalcMode === 'auto' || savedCalcMode === 'manual'
          || Array.isArray(savedCalcSelectedSaltIds)) {
        setCalcState(s => ({
          ...s,
          calcMode: (savedCalcMode === 'auto' || savedCalcMode === 'manual') ? savedCalcMode : s.calcMode,
          selectedSaltIds: Array.isArray(savedCalcSelectedSaltIds) ? savedCalcSelectedSaltIds : s.selectedSaltIds,
        }));
      }
      setLoaded(true);
    })();
  }, []);

  // RGB hue animation — ticks at ~30fps, full colour wheel in ~12 seconds
  useEffect(() => {
    if (accentAutoMode !== 'rgb') return;
    const id = setInterval(() => setRgbHue(h => (h + 0.5) % 360), 33);
    return () => clearInterval(id);
  }, [accentAutoMode]);

  // Speichern bei Änderungen
  useEffect(() => { if (loaded) saveToStorage('hydro:salts', salts); }, [salts, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:lang', lang); }, [lang, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:theme', theme); }, [theme, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:accent', accentKey); }, [accentKey, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:accentAutoMode', accentAutoMode); }, [accentAutoMode, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:elemColorsOn', elementColorsOn); }, [elementColorsOn, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:elemColors', elementColors); }, [elementColors, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:dbSortMode', dbSortMode); }, [dbSortMode, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:salt-lang', saltLang); }, [saltLang, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:phMode', phMode); }, [phMode, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:rootzoneMode', rootzoneMode); }, [rootzoneMode, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:recipe', recipe); }, [recipe, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:recipe-library', recipeLibrary); }, [recipeLibrary, loaded]);
  // Nur Subset des Calculator-States persistieren — Ergebnis & Volumen leben nur in Session
  useEffect(() => { if (loaded) saveToStorage('hydro:calcMode', calcState.calcMode); }, [calcState.calcMode, loaded]);
  useEffect(() => { if (loaded) saveToStorage('hydro:calcSelectedSaltIds', calcState.selectedSaltIds); }, [calcState.selectedSaltIds, loaded]);

  const t = useT(lang);
  const isDark = theme === 'dark';
  const accent = accentAutoMode === 'rgb'
    ? { name: 'RGB', accent: `hsl(${rgbHue},70%,55%)`, hover: `hsl(${rgbHue},70%,65%)`, soft: `hsla(${rgbHue},70%,55%,0.15)`, text: `hsl(${rgbHue},70%,75%)` }
    : (ACCENT_COLORS[accentKey] || ACCENT_COLORS.emerald);
  const availableSalts = useMemo(() => buildAvailableSalts(salts), [salts]);

  const bgClass = isDark ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-50 text-neutral-900';

  const handleTransferToRecipe = (result) => {
    const isSolo = result.mode !== 'stock';
    const factor = result.concentrationFactor; // 1 for direct mode
    const volume = result.volume;

    // Group salts by tank (each tank → one recipe group)
    const tankMap = {};
    const tankOrder = [];
    result.salts.forEach((s, idx) => {
      const mass = result.masses[idx];
      if (mass <= 0.0001) return;
      const tank = s.tank || '-';
      if (!tankMap[tank]) { tankMap[tank] = []; tankOrder.push(tank); }

      // Pre-compute ppm contributions — calculator salts nutzen composition (weight%) + purity.
      // Recipe-Format kennt nur N (zusammengefasst), kein Na, und keine Null-Einträge:
      //   - Null-Einträge weggelassen → keine "–" Bindestriche & klickbare leere
      //     Zellen für Elemente, die dieses Salz nicht enthält.
      //   - N-NO3 + N-NH4 → N (sym in ELEMENT_DEFS), nh4Fraction extrahiert.
      //   - Na übersprungen (Recipe-Tabelle führt Na nicht in ELEMENT_DEFS).
      const purity = s.purity ?? 100;
      const comp = s.composition || {};
      const nNo3Pct = (comp['N-NO3'] || 0) * purity / 100;
      const nNh4Pct = (comp['N-NH4'] || 0) * purity / 100;
      const totalN = nNo3Pct + nNh4Pct;
      const contributions = {};
      const _pcts = {};
      Object.entries(comp).forEach(([el, value]) => {
        if (!value || value <= 0) return;
        if (el === 'N-NO3' || el === 'N-NH4' || el === 'Na') return;
        const pct = value * purity / 100;
        _pcts[el] = pct;
        contributions[el] = (mass * pct / 100) / (factor * volume) * 1000;
      });
      if (totalN > 0) {
        _pcts.N = totalN;
        contributions.N = (mass * totalN / 100) / (factor * volume) * 1000;
      }
      const nh4Fraction = totalN > 0 ? (nNh4Pct / totalN) : 0;

      tankMap[tank].push({
        id: 's-' + Math.random().toString(36).slice(2, 8),
        // Fallback-Kette für Kurzname: shortName (gibt's bei Recipe-Salzen) →
        // kuerzel (gibt's bei DB-/Calculator-Salzen) → leer (getSaltDisplay fällt
        // dann auf Formel/Name zurück).
        shortName: s.shortName || s.kuerzel || '',
        formula: s.formula,
        name: s.name,
        nameEN: s.nameEN || s.name,
        mass,
        massUnit: 'g',
        pricePerKg: s.pricePerKg ?? (s.price > 0 ? s.price : undefined),
        contributions,
        nh4Fraction,
        _pcts,
        _groupFactor: factor,
        _groupVolume: volume,
        _groupKind: isSolo ? 'solo' : 'stock',
      });
    });

    const newGroups = tankOrder.map(tank => ({
      id: 'g-' + Math.random().toString(36).slice(2, 8),
      name: isSolo ? '' : (tank === '-' ? 'Konzentrat' : tank),
      volume: isSolo ? null : volume,
      factor: isSolo ? null : factor,
      mlPerL: isSolo ? null : parseFloat((1000 / factor).toFixed(4)),
      kind: isSolo ? 'solo' : 'stock',
      salts: tankMap[tank],
    }));

    // Collect all computed salt rows (flat) so the dialog can offer adding to existing group
    const allSaltRows = tankOrder.flatMap(tank => tankMap[tank]);

    // Show group selection dialog
    setPendingTransfer({ newGroups, allSaltRows, isSolo, volume, factor });
  };

  const confirmTransfer = (targetGroupId) => {
    if (!pendingTransfer) return;
    const { newGroups, allSaltRows } = pendingTransfer;

    if (targetGroupId === '__new__') {
      // Create new group(s) as originally planned
      setRecipe(r => ({ ...r, groups: [...r.groups, ...newGroups] }));
      setView('recipe');
      // Flash salts in the first new group
      const firstGroup = newGroups[0];
      if (firstGroup) {
        const saltIds = firstGroup.salts.map(s => s.id);
        setFlashInfo({ groupId: firstGroup.id, saltIds });
      }
    } else {
      // Add all salts to the existing group
      setRecipe(r => ({
        ...r,
        groups: r.groups.map(g =>
          g.id === targetGroupId
            ? { ...g, salts: [...g.salts, ...allSaltRows] }
            : g
        ),
      }));
      setView('recipe');
      setFlashInfo({ groupId: targetGroupId, saltIds: allSaltRows.map(s => s.id) });
    }
    setPendingTransfer(null);
  };

  const ctx = {
    t, lang, isDark, accent, elementColorsOn, elementColors,
    phMode, setPhMode, rootzoneMode, setRootzoneMode,
  };

  return (
    <div className={`min-h-screen ${bgClass}`} style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>
      <Header ctx={ctx} view={view} visible={chromeVisible} />

      <main className="max-w-[849px] mx-auto px-4 pb-24 pt-4">
        {view === 'calculator' && <CalculatorView ctx={ctx} salts={salts} calcState={calcState} setCalcState={setCalcState} onTransferToRecipe={handleTransferToRecipe} />}
        {view === 'recipe' && (
          <RecipeView
            recipe={recipe}
            setRecipe={setRecipe}
            library={recipeLibrary}
            setLibrary={setRecipeLibrary}
            availableSalts={availableSalts}
            useElementColors={elementColorsOn}
            elementColors={elementColors}
            lang={lang}
            saltLang={saltLang}
            setSaltLang={setSaltLang}
            isDark={isDark}
            accent={accent}
            flashInfo={flashInfo}
            onFlashConsumed={() => setFlashInfo(null)}
          />
        )}
        {view === 'database' && <DatabaseView ctx={ctx} salts={salts} setSalts={setSalts} sortMode={dbSortMode} setSortMode={setDbSortMode} />}
        {view === 'knowledge' && <KnowledgeView ctx={ctx} salts={salts} />}
        {view === 'settings' && (
          <SettingsView
            ctx={ctx}
            setLang={setLang}
            setTheme={setTheme}
            setSalts={setSalts}
            accentKey={accentKey}
            setAccentKey={setAccentKey}
            accentAutoMode={accentAutoMode}
            setAccentAutoMode={setAccentAutoMode}
            setElementColorsOn={setElementColorsOn}
            elementColors={elementColors}
            setElementColors={setElementColors}
            saltLang={saltLang}
            setSaltLang={setSaltLang}
          />
        )}
      </main>

      <BottomNav ctx={ctx} view={view} setView={setView} visible={chromeVisible} />

      {/* Transfer group selection dialog */}
      {pendingTransfer && (
        <TransferGroupDialog
          groups={recipe.groups}
          onConfirm={confirmTransfer}
          onCancel={() => setPendingTransfer(null)}
          isDark={isDark}
          accent={accent}
        />
      )}
    </div>
  );
}

// ============================================================
// HELPER-KOMPONENTEN: Farbige Darstellung
// ============================================================
function ElSymbol({ el, ctx, className = '', style = {} }) {
  const color = ctx.elementColorsOn ? (ctx.elementColors[el] || (ctx.isDark ? '#fff' : '#222')) : undefined;
  return (
    <span className={className} style={{ color, ...style }}>
      {ctx.t.elements[el] || el}
    </span>
  );
}

function SaltName({ name, ctx, className = '' }) {
  if (!ctx.elementColorsOn) {
    return <span className={className}>{name}</span>;
  }
  const tokens = highlightSaltName(name);
  return (
    <span className={className}>
      {tokens.map((tk, i) => {
        let color = undefined;
        if (tk.element === 'WATER') color = WATER_COLOR;
        else if (tk.element) color = ctx.elementColors[tk.element];
        return (
          <span key={i} style={color ? { color } : undefined}>
            {tk.text}
          </span>
        );
      })}
    </span>
  );
}

function FormulaDisplay({ formula, ctx, className = '' }) {
  if (!formula) return null;
  const tokens = tokenizeFormula(formula);
  const symbolToKey = (sym) => {
    if (sym === 'N') return 'N-NO3'; // einheitliche N-Farbe in Formeln
    return ELEMENTS.includes(sym) ? sym : null;
  };

  // Markiere alle Tokens, die nach einem Hydrat-Punkt kommen, als Wasser-Teil
  let inHydrate = false;
  const enriched = tokens.map(tk => {
    if (tk.type === 'hydrate') {
      inHydrate = true;
      return { ...tk, isWater: true };
    }
    return { ...tk, isWater: inHydrate };
  });

  return (
    <span className={className} style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}>
      {enriched.map((tk, i) => {
        const waterColor = ctx.elementColorsOn && tk.isWater ? WATER_COLOR : undefined;
        if (tk.type === 'el') {
          const key = symbolToKey(tk.sym);
          const color = tk.isWater && ctx.elementColorsOn
            ? WATER_COLOR
            : (ctx.elementColorsOn && key ? ctx.elementColors[key] : undefined);
          return <span key={i} style={{ color }}>{tk.sym}</span>;
        }
        if (tk.type === 'sub') return <sub key={i} style={{ color: waterColor }}>{tk.n}</sub>;
        if (tk.type === 'mult') return <span key={i} style={{ color: waterColor }}>{tk.n}</span>;
        if (tk.type === 'open') return <span key={i}>(</span>;
        if (tk.type === 'close') return <span key={i}>)</span>;
        if (tk.type === 'hydrate') return <span key={i} style={{ margin: '0 0.15em', color: waterColor }}>·</span>;
        return null;
      })}
    </span>
  );
}

function Toggle({ checked, onChange, ctx }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
      style={{
        background: checked ? ctx.accent.accent : (ctx.isDark ? '#404040' : '#d4d4d4'),
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  );
}

// ============================================================
// HEADER
// ============================================================
function Header({ ctx, view, visible = true }) {
  const { t, isDark, accent } = ctx;
  const title = view === 'calculator' ? t.calc.title : view === 'recipe' ? t.nav.recipe : view === 'database' ? t.db.title : view === 'knowledge' ? t.knowledge.title : t.settings.title;
  return (
    <header
      className={`sticky top-0 z-20 border-b ${isDark ? 'bg-neutral-900/95 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur transition-transform duration-300 ease-out will-change-transform`}
      style={{ transform: visible ? 'translateY(0)' : 'translateY(-100%)' }}
    >
      <div className="max-w-[849px] mx-auto px-4 py-4 flex items-center gap-3">
        <FlaskConical size={22} style={{ color: accent.accent }} />
        <div>
          <h1 className="text-sm font-medium opacity-70">{t.appTitle}</h1>
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// BOTTOM NAV
// ============================================================
// Inline SVG for recipe table icon (compatible with any lucide-react version)
function RecipeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  );
}

function BottomNav({ ctx, view, setView, visible = true }) {
  const { t, isDark, accent } = ctx;
  const items = [
    { id: 'calculator', icon: <Calculator size={22} />, label: t.nav.calculator },
    { id: 'recipe', icon: <RecipeIcon />, label: t.nav.recipe },
    { id: 'database', icon: <Database size={22} />, label: t.nav.database },
    { id: 'knowledge', icon: <BookOpen size={22} />, label: t.nav.knowledge },
    { id: 'settings', icon: <Settings size={22} />, label: t.nav.settings },
  ];
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-[60] border-t ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'} transition-transform duration-300 ease-out will-change-transform`}
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="max-w-[849px] mx-auto flex">
        {items.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? accent.accent : (isDark ? '#737373' : '#737373') }}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// CALCULATOR VIEW
// ============================================================
function CalculatorView({ ctx, salts, calcState, setCalcState, onTransferToRecipe }) {
  const { t, isDark, accent, lang } = ctx;
  const { mode, volume, factor, calcMode, targets, selectedSaltIds, result } = calcState;
  const setMode = (v) => setCalcState(s => ({ ...s, mode: v }));
  const setVolume = (v) => setCalcState(s => ({ ...s, volume: v }));
  const setFactor = (v) => setCalcState(s => ({ ...s, factor: v }));
  const setCalcMode = (v) => setCalcState(s => ({ ...s, calcMode: v }));
  const setTargets = (fn) => setCalcState(s => ({ ...s, targets: typeof fn === 'function' ? fn(s.targets) : fn }));
  const setSelectedSaltIds = (fn) => setCalcState(s => ({ ...s, selectedSaltIds: typeof fn === 'function' ? fn(s.selectedSaltIds) : fn }));
  // Result lebt in calcState → bleibt beim Modul-Wechsel erhalten, wird bei App-
  // Neustart automatisch geleert (calcState wird nicht komplett persistiert).
  const setResult = (v) => setCalcState(s => ({ ...s, result: typeof v === 'function' ? v(s.result) : v }));
  const [calcSortMode, setCalcSortMode] = useState('name');
  const [calcSortMenuOpen, setCalcSortMenuOpen] = useState(false);
  // Produkte/Salze-Toggle — persistiert in localStorage
  const [calcShowProducts, setCalcShowProducts] = useState(() => {
    try { return localStorage.getItem('hydro:calcShowProducts') === '1'; } catch { return false; }
  });

  const toggleCalcShowProducts = (val) => {
    setCalcShowProducts(val);
    try { localStorage.setItem('hydro:calcShowProducts', val ? '1' : '0'); } catch {}
  };

  const activeSalts = useMemo(() => salts.filter(s => s.active), [salts]);

  const concentrationFactor = mode === 'stock' ? Math.max(1, factor) : 1;
  const effectiveVolume = Math.max(0.001, volume);

  const updateTarget = (el, val) => {
    setTargets(t => ({ ...t, [el]: Math.max(0, parseFloat(val) || 0) }));
  };

  const toggleSelected = (id) => {
    setSelectedSaltIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  const handleCalculate = () => {
    let useSalts;
    if (calcMode === 'auto') {
      useSalts = autoSelectSalts(targets, activeSalts);
    } else {
      useSalts = activeSalts.filter(s => selectedSaltIds.includes(s.id));
    }
    if (useSalts.length === 0) {
      setResult({ empty: true });
      return;
    }
    const { masses, totalCost, achieved } = calculateMix(targets, useSalts, effectiveVolume, concentrationFactor);
    const warnings = analyzeWarnings(useSalts, masses, effectiveVolume, concentrationFactor, targets, achieved, t);
    setResult({
      salts: useSalts,
      masses,
      totalCost,
      achieved,
      warnings,
      volume: effectiveVolume,
      concentrationFactor,
      mode,
    });
  };

  const handleReset = () => {
    setTargets(emptyComposition());
    setSelectedSaltIds([]);
    setResult(null);
  };

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';
  const inputBase = isDark
    ? 'bg-neutral-900 border-neutral-700 text-neutral-100'
    : 'bg-white border-neutral-300 text-neutral-900';
  const inputFocusStyle = (e) => {
    e.target.style.borderColor = accent.accent;
    e.target.style.boxShadow = `0 0 0 3px ${accent.soft}`;
  };
  const inputBlurStyle = (e) => {
    e.target.style.borderColor = '';
    e.target.style.boxShadow = '';
  };

  return (
    <div className="space-y-4">
      {/* Solution Settings */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 opacity-80">{t.calc.mode}</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <SegmentButton active={mode === 'direct'} onClick={() => setMode('direct')} ctx={ctx}>
            {t.calc.directSolution}
          </SegmentButton>
          <SegmentButton active={mode === 'stock'} onClick={() => setMode('stock')} ctx={ctx}>
            {t.calc.stockConcentrate}
          </SegmentButton>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.calc.volume} ({t.calc.liters})</label>
            <input
              type="number"
              inputMode="decimal"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value) || 0)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              className={`w-full rounded-lg border px-3 py-2 text-base outline-none transition-colors ${inputBase}`}
            />
          </div>
          {mode === 'stock' && (
            <div>
              <label className="text-xs opacity-70 block mb-1">{t.calc.concentrationFactor}</label>
              <input
                type="number"
                inputMode="decimal"
                value={factor}
                onChange={e => setFactor(parseFloat(e.target.value) || 1)}
                onFocus={inputFocusStyle}
                onBlur={inputBlurStyle}
                className={`w-full rounded-lg border px-3 py-2 text-base outline-none transition-colors ${inputBase}`}
              />
            </div>
          )}
        </div>
      </section>

      {/* Calc Mode */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 opacity-80">{t.calc.calcMode}</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Manuell links, Automatisch rechts — Manuell ist Default beim Erststart */}
          <SegmentButton active={calcMode === 'manual'} onClick={() => setCalcMode('manual')} ctx={ctx}>
            {t.calc.manual}
          </SegmentButton>
          <SegmentButton active={calcMode === 'auto'} onClick={() => setCalcMode('auto')} ctx={ctx}>
            {t.calc.auto}
          </SegmentButton>
        </div>

        {calcMode === 'manual' && (
          <div className="mt-4">
            {/* Salze / Produkte Toggle */}
            <div className={`flex rounded-lg overflow-hidden border mb-3 text-[11px] font-semibold ${isDark ? 'border-neutral-700' : 'border-neutral-300'}`}>
              <button
                onClick={() => toggleCalcShowProducts(false)}
                className="flex-1 py-1.5 transition-colors"
                style={!calcShowProducts ? { background: accent.accent, color: '#fff' } : { color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                {lang === 'de' ? 'Salze' : 'Salts'}
              </button>
              <button
                onClick={() => toggleCalcShowProducts(true)}
                className="flex-1 py-1.5 transition-colors"
                style={calcShowProducts ? { background: accent.accent, color: '#fff' } : { color: isDark ? '#9ca3af' : '#6b7280' }}
              >
                {lang === 'de' ? 'Produkte' : 'Products'}
              </button>
            </div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-xs opacity-70">{t.calc.selectSaltsHint}</p>
              {!calcShowProducts && <div className="relative flex-shrink-0">
                <button
                  onClick={() => setCalcSortMenuOpen(o => !o)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                    isDark ? 'border-neutral-700 hover:bg-neutral-700/50 text-neutral-300' : 'border-neutral-300 hover:bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <ArrowUpDown size={14} />
                </button>
                {calcSortMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCalcSortMenuOpen(false)} />
                    <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-lg min-w-[130px] overflow-hidden ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                      {[{ key: 'name', label: t.db.sortByName }, { key: 'cation', label: t.db.sortByCation }, { key: 'anion', label: t.db.sortByAnion }].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setCalcSortMode(opt.key); setCalcSortMenuOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'}`}
                        >
                          <span>{opt.label}</span>
                          {calcSortMode === opt.key && <Check size={14} style={{ color: accent.accent }} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>}
            </div>
            {activeSalts.length === 0 ? (
              <p className="text-sm opacity-60 italic">{t.calc.noSaltsAvailable}</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {(() => {
                  // Filtere nach Salze oder Produkte je nach Toggle
                  const displaySalts = activeSalts.filter(s => calcShowProducts ? s.type === 'product' : s.type !== 'product');
                  if (displaySalts.length === 0) {
                    return <p className="text-sm opacity-60 italic px-3 py-2">{calcShowProducts ? (lang === 'de' ? 'Keine Produkte vorhanden.' : 'No products available.') : t.calc.noSaltsAvailable}</p>;
                  }
                  const CALC_MICRO = new Set(['Fe', 'Mn', 'Zn', 'Cu', 'Co', 'Ni', 'B', 'Mo']);
                  const isMicro = (s) => Object.entries(s.composition || {}).some(([k, v]) => CALC_MICRO.has(k) && v > 0.5);
                  const sorted = [...displaySalts].sort((a, b) => {
                    if (calcShowProducts) return a.name.localeCompare(b.name);
                    const aMicro = isMicro(a), bMicro = isMicro(b);
                    if (aMicro !== bMicro) return aMicro ? 1 : -1;
                    if (calcSortMode === 'cation') {
                      const ca = dominantCation(a), cb = dominantCation(b);
                      const nameA = ca ? (CATION_NAMES[ca]?.[lang] || ca) : 'zzz';
                      const nameB = cb ? (CATION_NAMES[cb]?.[lang] || cb) : 'zzz';
                      if (nameA !== nameB) return nameA.localeCompare(nameB);
                    } else if (calcSortMode === 'anion') {
                      const aa = dominantAnion(a), ab = dominantAnion(b);
                      if (aa !== ab) return aa.localeCompare(ab);
                    }
                    return a.name.localeCompare(b.name);
                  });
                  const firstMicroIdx = calcShowProducts ? -1 : sorted.findIndex(s => isMicro(s));
                  const dividerClass = `flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`;
                  const dividerLine = `flex-1 h-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`;
                  return sorted.map((s, idx) => {
                  const checked = selectedSaltIds.includes(s.id);
                  return (
                    <React.Fragment key={s.id}>
                      {idx === 0 && firstMicroIdx > 0 && (
                        <div className={dividerClass}>
                          <div className={dividerLine}/><span>{lang === 'de' ? 'Makronährstoffe' : 'Macronutrients'}</span><div className={dividerLine}/>
                        </div>
                      )}
                      {idx === firstMicroIdx && firstMicroIdx > 0 && (
                        <div className={dividerClass}>
                          <div className={dividerLine}/>
                          <span>{lang === 'de' ? 'Mikronährstoffe' : 'Micronutrients'}</span>
                          <div className={dividerLine}/>
                        </div>
                      )}
                    <label
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        !checked && (isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100')
                      }`}
                      style={checked ? { background: accent.soft } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected(s.id)}
                        style={{ accentColor: accent.accent }}
                      />
                      <span className="flex-1 text-sm">
                        <SaltName name={s.name} ctx={ctx} />
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
                        {s.tank}
                      </span>
                    </label>
                    </React.Fragment>
                  );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Targets */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 opacity-80">{t.calc.targetValues}</h3>
        <div className={`flex items-center px-2 py-1.5 text-[11px] uppercase tracking-wide font-medium opacity-60 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <div className="w-20 flex-shrink-0">{t.calc.element}</div>
          <div className="flex-1 text-right pr-2">{t.calc.target}</div>
          <div className="w-16 text-right">{t.calc.result}</div>
        </div>
        <div>
          {ELEMENTS.map(el => {
            const targetVal = targets[el] || 0;
            const achievedVal = result?.achieved ? (result.achieved[el] || 0) : null;
            const isOff = achievedVal !== null && targetVal > 0 &&
              Math.abs(achievedVal - targetVal) / targetVal > 0.05;
            const isNa = el === 'Na';
            return (
              <div key={el} className="flex items-center gap-2 px-2 py-1">
                <div className="w-20 flex-shrink-0 text-sm font-semibold whitespace-nowrap">
                  <ElSymbol el={el} ctx={ctx} />
                </div>
                <div className="flex-1 flex justify-end pr-2">
                  {isNa ? (
                    <div className="text-xs opacity-50 italic">{lang === 'de' ? 'nur Anzeige' : 'display only'}</div>
                  ) : (
                    <input
                      type="number"
                      inputMode="decimal"
                      value={targets[el] || ''}
                      placeholder="0"
                      onChange={e => updateTarget(el, e.target.value)}
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                      className={`w-24 text-right rounded-md border px-2 py-1.5 text-sm outline-none ${inputBase}`}
                    />
                  )}
                </div>
                <div className={`w-16 text-right text-sm tabular-nums ${
                  achievedVal !== null ? (isOff ? 'text-amber-500' : 'opacity-80') : 'opacity-40'
                }`}>
                  {achievedVal !== null ? achievedVal.toFixed(1) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleReset}
          className={`py-3 rounded-xl border font-medium transition-colors ${
            isDark
              ? 'border-neutral-700 hover:bg-neutral-800'
              : 'border-neutral-300 hover:bg-neutral-100'
          }`}
        >
          {t.calc.reset}
        </button>
        <button
          onClick={handleCalculate}
          className="py-3 rounded-xl text-white font-semibold transition-colors"
          style={{ background: accent.accent }}
          onMouseEnter={e => e.currentTarget.style.background = accent.hover}
          onMouseLeave={e => e.currentTarget.style.background = accent.accent}
        >
          {t.calc.calculate}
        </button>
      </div>

      {/* Result */}
      {result && (
        <ResultCard result={result} ctx={ctx} cardClass={cardClass} onTransferToRecipe={onTransferToRecipe} />
      )}
    </div>
  );
}

// ============================================================
// RESULT CARD
// ============================================================
function ResultCard({ result, ctx, cardClass, onTransferToRecipe }) {
  const { t, isDark, accent } = ctx;
  if (result.empty) {
    return (
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <p className="text-sm opacity-70 italic">{t.calc.noResult}</p>
      </section>
    );
  }

  const usedSalts = result.salts.map((s, idx) => ({ ...s, mass: result.masses[idx] }))
    .filter(s => s.mass > 0.0001)
    .sort((a, b) => {
      if (a.tank !== b.tank) return (a.tank || '').localeCompare(b.tank || '');
      return b.mass - a.mass;
    });

  // Gruppieren nach Tank
  const tanks = {};
  usedSalts.forEach(s => {
    const tk = s.tank || '-';
    if (!tanks[tk]) tanks[tk] = [];
    tanks[tk].push(s);
  });

  const isStock = result.mode === 'stock';
  const mlPerL = isStock ? (1000 / result.concentrationFactor) : null;

  return (
    <section className={`rounded-xl border ${cardClass} p-4 space-y-4`}>
      <header>
        <h3 className="text-base font-semibold">{t.calc.resultTitle}</h3>
        <p className="text-xs opacity-70 mt-1">
          {t.calc.preparedFor} {result.volume} {t.calc.liters}
          {isStock && ` ${t.calc.stockInfo} (${result.concentrationFactor}× ${t.calc.concentrationFactor})`}
        </p>
        {isStock && (
          <p className="text-xs opacity-80 mt-1 font-medium">
            {t.calc.perLiterUse} {mlPerL.toFixed(2)} {t.calc.ml} {t.calc.perTank}
          </p>
        )}
      </header>

      {Object.entries(tanks).map(([tank, group]) => (
        <div key={tank}>
          <h4
            className="text-sm font-semibold mb-2 px-2 py-1 inline-block rounded"
            style={{ background: accent.soft, color: accent.text }}
          >
            {t.calc.tank} {tank}
          </h4>
          <div className="space-y-1">
            {group.map(s => (
              <div key={s.id} className={`flex items-baseline gap-2 px-2 py-1.5 rounded ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    <SaltName name={s.name} ctx={ctx} />
                  </div>
                  <div className="text-xs opacity-60">
                    <FormulaDisplay formula={s.formula} ctx={ctx} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{s.mass.toFixed(2)} g</div>
                  <div className="text-xs opacity-60 tabular-nums">
                    {((s.mass / 1000) * (s.price || 0)).toFixed(2)} €
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={`flex justify-between items-baseline pt-3 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
        <span className="text-sm font-medium">{t.calc.totalCost}</span>
        <span className="text-base font-semibold tabular-nums">{result.totalCost.toFixed(2)} €</span>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className={`pt-3 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'} space-y-1.5`}>
          <h4 className="text-sm font-semibold">{t.calc.warnings}</h4>
          {result.warnings.map((w, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${
              w.level === 'error'
                ? (isDark ? 'bg-red-950/40 text-red-300' : 'bg-red-50 text-red-700')
                : (isDark ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-700')
            }`}>
              {w.level === 'error' ? <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />}
              <span>{w.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Transfer to Recipe */}
      {onTransferToRecipe && (
        <button
          onClick={() => onTransferToRecipe(result)}
          className={`w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors
            ${isDark
              ? 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-950/60 hover:border-emerald-700 text-emerald-400 hover:text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700'
            }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
          </svg>
          → Ins Rezept übertragen
        </button>
      )}
    </section>
  );
}

// ============================================================
// SEGMENT BUTTON
// ============================================================
function SegmentButton({ active, onClick, children, ctx }) {
  const { isDark, accent } = ctx;
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'text-white'
          : isDark ? 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
      style={active ? { background: accent.accent } : undefined}
    >
      {children}
    </button>
  );
}

// ============================================================
// DATABASE VIEW
// ============================================================
// Helper: dominierendes Kation eines Salzes (für Sortierung)
// Liefert sprachunabhängigen Schlüssel und sprachabhängigen Anzeigenamen.
const CATION_NAMES = {
  'Ca':    { de: 'Calcium',    en: 'Calcium' },
  'K':     { de: 'Kalium',     en: 'Potassium' },
  'Mg':    { de: 'Magnesium',  en: 'Magnesium' },
  'N-NH4': { de: 'Ammonium',   en: 'Ammonium' },
  'Na':    { de: 'Natrium',    en: 'Sodium' },
  'Fe':    { de: 'Eisen',      en: 'Iron' },
  'Mn':    { de: 'Mangan',     en: 'Manganese' },
  'Zn':    { de: 'Zink',       en: 'Zinc' },
  'Cu':    { de: 'Kupfer',     en: 'Copper' },
  'Ni':    { de: 'Nickel',     en: 'Nickel' },
  'Co':    { de: 'Cobalt',     en: 'Cobalt' },
};

const CATION_ORDER_KEYS = ['Ca', 'K', 'Mg', 'N-NH4', 'Na', 'Fe', 'Mn', 'Zn', 'Cu', 'Ni', 'Co'];

// Dominierendes Kation: jenes mit dem höchsten Massenanteil aus den Kandidaten.
function dominantCation(salt) {
  let best = null;
  let bestVal = 0;
  for (const k of CATION_ORDER_KEYS) {
    const v = salt.composition?.[k] || 0;
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best; // string oder null
}

// Anion-Erkennung anhand der Summenformel
const ANION_NAMES = {
  'nitrate':   { de: 'Nitrat',    en: 'Nitrate' },
  'phosphate': { de: 'Phosphat',  en: 'Phosphate' },
  'sulfate':   { de: 'Sulfat',    en: 'Sulfate' },
  'chloride':  { de: 'Chlorid',   en: 'Chloride' },
  'silicate':  { de: 'Silikat',   en: 'Silicate' },
  'carbonate': { de: 'Carbonat',  en: 'Carbonate' },
  'hydroxide': { de: 'Hydroxid',  en: 'Hydroxide' },
  'borate':    { de: 'Borat',     en: 'Borate' },
  'molybdate': { de: 'Molybdat',  en: 'Molybdate' },
  'chelate':   { de: 'Chelat',    en: 'Chelate' },
  'other':     { de: 'Sonstige',  en: 'Other' },
};

const ANION_ORDER_KEYS = ['borate', 'carbonate', 'chelate', 'chloride', 'hydroxide', 'molybdate', 'nitrate', 'phosphate', 'silicate', 'sulfate', 'other'];

function dominantAnion(salt) {
  const f = (salt.formula || '').replace(/·.*$/, ''); // ohne Hydratteil
  // Reihenfolge: spezifischere Tests zuerst
  if (/EDTA|DTPA|EDDHA|HBED|chelat/i.test(salt.name) || /EDTA|DTPA|EDDHA/i.test(f)) return 'chelate';
  if (/MoO4/i.test(f) || (salt.composition?.['Mo'] || 0) > 5) return 'molybdate';
  if (/PO4|HPO|H2PO/i.test(f)) return 'phosphate';
  if (/SiO/i.test(f)) return 'silicate';
  if (/SO4/i.test(f)) return 'sulfate';
  if (/NO3/i.test(f)) return 'nitrate';
  if (/CO3/i.test(f)) return 'carbonate';
  if (/BO3|B\(OH\)/i.test(f) || (/H3BO3/i.test(f))) return 'borate';
  if (/OH/i.test(f)) return 'hydroxide';
  // Chlorid nur wenn Cl vorkommt und keine anderen Anionen
  if (/Cl/.test(f) && !/Cl[a-z]/.test(f)) return 'chloride';
  return 'other';
}

function DatabaseView({ ctx, salts, setSalts, sortMode, setSortMode }) {
  const { t, isDark, accent, lang } = ctx;
  const [editing, setEditing] = useState(null); // null | 'new' | salt-object
  const [filter, setFilter] = useState('');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  // Sub-Tab: 'product' (Hauptreiter, Standard) | 'salt'; über Neustart gemerkt
  const [dbTab, setDbTab] = useState(() => {
    try { return localStorage.getItem('hydro:dbTab') === 'salt' ? 'salt' : 'product'; } catch { return 'product'; }
  });
  const selectTab = (tab) => { setDbTab(tab); try { localStorage.setItem('hydro:dbTab', tab); } catch {} };
  const entryType = (s) => (s.type === 'product' ? 'product' : 'salt');
  const isProductTab = dbTab === 'product';

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';
  const inputBase = isDark
    ? 'bg-neutral-900 border-neutral-700 text-neutral-100'
    : 'bg-white border-neutral-300 text-neutral-900';
  const inputFocusStyle = (e) => {
    e.target.style.borderColor = accent.accent;
    e.target.style.boxShadow = `0 0 0 3px ${accent.soft}`;
  };
  const inputBlurStyle = (e) => {
    e.target.style.borderColor = '';
    e.target.style.boxShadow = '';
  };

  const handleToggleActive = (id) => {
    setSalts(salts.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDelete = (id) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      setSalts(salts.filter(s => s.id !== pendingDeleteId));
    }
    setPendingDeleteId(null);
  };

  const handleSave = (saltData) => {
    if (saltData.id && salts.some(s => s.id === saltData.id)) {
      setSalts(salts.map(s => s.id === saltData.id ? saltData : s));
    } else {
      const prefix = saltData.type === 'product' ? 'product' : 'custom';
      const newId = saltData.id || `${prefix}-${Date.now()}`;
      setSalts([...salts, { ...saltData, id: newId }]);
    }
    setEditing(null);
  };

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim();
    const tabList = salts.filter(s => entryType(s) === dbTab);
    let list = !f ? tabList : tabList.filter(s =>
      s.name.toLowerCase().includes(f) || (s.formula || '').toLowerCase().includes(f)
    );

    if (sortMode === 'name') {
      return list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortMode === 'cation') {
      // Sortierung: zuerst nach Kation-Anzeigename (sprachabhängig), dann nach Name
      return list.slice().sort((a, b) => {
        const ca = dominantCation(a);
        const cb = dominantCation(b);
        const nameA = ca ? CATION_NAMES[ca][lang] : 'zzz';
        const nameB = cb ? CATION_NAMES[cb][lang] : 'zzz';
        const cmp = nameA.localeCompare(nameB);
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name);
      });
    }

    if (sortMode === 'anion') {
      return list.slice().sort((a, b) => {
        const aa = dominantAnion(a);
        const ab = dominantAnion(b);
        const nameA = ANION_NAMES[aa][lang];
        const nameB = ANION_NAMES[ab][lang];
        const cmp = nameA.localeCompare(nameB);
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [salts, filter, sortMode, lang, dbTab]);

  // Gruppen-Header berechnen: bei Sortierung nach Kation/Anion einen Header pro Wechsel
  const groupedFiltered = useMemo(() => {
    if (sortMode === 'name') return null;
    const result = [];
    let lastGroup = null;
    filtered.forEach(s => {
      const group = sortMode === 'cation'
        ? (dominantCation(s) ? CATION_NAMES[dominantCation(s)][lang] : (lang === 'de' ? 'Sonstige' : 'Other'))
        : ANION_NAMES[dominantAnion(s)][lang];
      if (group !== lastGroup) {
        result.push({ type: 'header', label: group });
        lastGroup = group;
      }
      result.push({ type: 'salt', salt: s });
    });
    return result;
  }, [filtered, sortMode, lang]);

  if (editing !== null) {
    return (
      <SaltEditor
        ctx={ctx}
        initial={editing === 'new' ? null : editing}
        existing={salts}
        mode={editing === 'new' ? dbTab : entryType(editing)}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-Tabs: Produkte (Hauptreiter) / Salze */}
      <div className={`flex gap-1 p-1 rounded-xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
        {[{ key: 'salt', label: t.db.tabSalts }, { key: 'product', label: t.db.tabProducts }].map(tab => {
          const on = dbTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => selectTab(tab.key)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={on
                ? { background: accent.accent, color: '#fff' }
                : { color: isDark ? '#a3a3a3' : '#525252' }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Suche / Search…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onFocus={inputFocusStyle}
          onBlur={inputBlurStyle}
          className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm outline-none ${inputBase}`}
        />
        <button
          onClick={() => setEditing('new')}
          className="w-10 h-10 flex-shrink-0 rounded-lg text-white flex items-center justify-center"
          style={{ background: accent.accent }}
          aria-label={isProductTab ? t.db.addProduct : t.db.addNew}
          title={isProductTab ? t.db.addProduct : t.db.addNew}
        >
          <Plus size={18} />
        </button>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setSortMenuOpen(o => !o)}
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
              isDark
                ? 'border-neutral-700 hover:bg-neutral-700/50 text-neutral-300'
                : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'
            }`}
            aria-label={t.db.sort}
            title={t.db.sort}
          >
            <ArrowUpDown size={16} />
          </button>
          {sortMenuOpen && (
            <>
              {/* Hintergrund-Klick zum Schließen */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSortMenuOpen(false)}
              />
              {/* Popover */}
              <div
                className={`absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border shadow-lg overflow-hidden ${
                  isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
                }`}
              >
                <div className={`px-3 py-2 text-[10px] uppercase tracking-wide opacity-60 ${
                  isDark ? 'border-b border-neutral-700' : 'border-b border-neutral-200'
                }`}>
                  {t.db.sortBy}
                </div>
                {[
                  { key: 'name', label: t.db.sortByName },
                  { key: 'cation', label: t.db.sortByCation },
                  { key: 'anion', label: t.db.sortByAnion },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortMode(opt.key); setSortMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortMode === opt.key && <Check size={14} style={{ color: accent.accent }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm opacity-60 italic text-center py-8">{isProductTab ? t.db.noProducts : t.db.noSalts}</p>
      ) : (
        <div className="space-y-2">
          {(groupedFiltered || filtered.map(s => ({ type: 'salt', salt: s }))).map((item, idx) => {
            if (item.type === 'header') {
              return (
                <div
                  key={`hdr-${idx}`}
                  className={`text-[11px] font-semibold uppercase tracking-wide px-2 pt-2 pb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}
                >
                  {item.label}
                </div>
              );
            }
            const s = item.salt;
            return (
              <div
                key={s.id}
                className={`rounded-xl border ${cardClass} p-3 flex items-center gap-3`}
              >
                <button
                  onClick={() => handleToggleActive(s.id)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: s.active ? accent.accent : 'transparent',
                    borderColor: s.active ? accent.accent : (isDark ? '#525252' : '#9ca3af'),
                  }}
                  aria-label={s.active ? t.db.active : t.db.inactive}
                >
                  {s.active && <Check size={14} className="text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    <SaltName name={s.name} ctx={ctx} />
                  </div>
                  <div className="text-xs opacity-60 flex gap-2 items-center">
                    <FormulaDisplay formula={s.formula} ctx={ctx} />
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
                      {t.calc.tank} {s.tank}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(s)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-red-950/40' : 'hover:bg-red-50'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* App-internal delete confirmation dialog */}
      {pendingDeleteId && (() => {
        const item = salts.find(s => s.id === pendingDeleteId);
        const isProduct = entryType(item || {}) === 'product';
        const msg = isProduct ? t.db.confirmDeleteProduct : t.db.confirmDelete;
        const name = item?.name || '?';
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setPendingDeleteId(null)}>
            <div onClick={e => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
              <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>{msg}</h3>
              <p className="text-sm text-neutral-400 mb-5 truncate">{name}</p>
              <div className="flex gap-2">
                <button onClick={() => setPendingDeleteId(null)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}>
                  Abbrechen
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold">
                  Löschen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// SALT EDITOR
// ============================================================
function SaltEditor({ ctx, initial, existing, onSave, onCancel, mode = 'salt' }) {
  const { t, isDark, accent } = ctx;
  const isProduct = mode === 'product';
  const [name, setName] = useState(initial?.name || '');
  const [formula, setFormula] = useState(initial?.formula || '');
  const [kuerzel, setKuerzel] = useState(initial?.kuerzel || '');
  const [tank, setTank] = useState(initial?.tank || 'A');
  const [purity, setPurity] = useState(initial?.purity ?? 99);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [solubility, setSolubility] = useState(initial?.solubility ?? 0);
  const [dosePerL, setDosePerL] = useState(initial?.dosePerL ?? '');
  const [doseUnit, setDoseUnit] = useState(initial?.doseUnit || 'ml');
  const [composition, setComposition] = useState(initial?.composition || emptyComposition());
  const [error, setError] = useState('');
  const [formulaError, setFormulaError] = useState('');
  // Wurde aus Formel berechnet? (für Badge-Anzeige)
  const [autoFilled, setAutoFilled] = useState(false);

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';
  const inputBase = isDark
    ? 'bg-neutral-900 border-neutral-700 text-neutral-100'
    : 'bg-white border-neutral-300 text-neutral-900';
  const inputFocusStyle = (e) => {
    e.target.style.borderColor = accent.accent;
    e.target.style.boxShadow = `0 0 0 3px ${accent.soft}`;
  };
  const inputBlurStyle = (e) => {
    e.target.style.borderColor = '';
    e.target.style.boxShadow = '';
  };

  const handleAutoFillFromFormula = () => {
    setFormulaError('');
    const comp = computeCompositionFromFormula(formula);
    if (!comp) {
      setFormulaError(t.settings.formulaParseError);
      return;
    }
    setComposition(comp);
    setAutoFilled(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t.db.nameRequired);
      return;
    }
    if (existing.some(s => s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== initial?.id)) {
      setError(isProduct ? t.db.productExists : t.db.saltExists);
      return;
    }
    const hasComp = Object.values(composition).some(v => (v || 0) > 0);
    onSave({
      id: initial?.id,
      type: isProduct ? 'product' : 'salt',
      name: name.trim(),
      formula: normalizeFormulaInput(formula).trim(),
      kuerzel: kuerzel.trim(),
      tank: tank.trim() || 'A',
      purity: parseFloat(purity) || 100,
      price: parseFloat(price) || 0,
      solubility: parseFloat(solubility) || 0,
      ...(isProduct ? { dosePerL: hasComp ? null : (dosePerL.trim() || null), doseUnit } : {}),
      composition,
      active: initial?.active ?? true,
    });
  };

  const updateComp = (el, val) => {
    setComposition(c => ({ ...c, [el]: Math.max(0, parseFloat(val) || 0) }));
    setAutoFilled(false);
  };

  const hasComposition = Object.values(composition).some(v => (v || 0) > 0);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">
        {isProduct
          ? (initial ? `${t.db.edit} – ${t.db.tabProducts}` : t.db.addProduct)
          : (initial ? `${t.db.edit} – ${t.db.tabSalts}` : t.db.addNew)}
      </h2>
      <section className={`rounded-xl border ${cardClass} p-4 space-y-3`}>
        <div>
          <label className="text-xs opacity-70 block mb-1">{t.db.name}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={inputFocusStyle}
            onBlur={inputBlurStyle}
            className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {!isProduct && (
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.formula}</label>
            <input
              type="text"
              value={formula}
              onChange={e => setFormula(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              placeholder="z.B. Ca(NO3)2.4H2O"
              className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ${inputBase}`}
            />
            {formula && (
              <div className="text-xs mt-1 opacity-70">
                <FormulaDisplay formula={formula} ctx={ctx} />
              </div>
            )}
          </div>
          )}
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.kuerzel}</label>
            <input
              type="text"
              value={kuerzel}
              onChange={e => setKuerzel(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              placeholder="z.B. MgS"
              className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ${inputBase}`}
            />
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.tank}</label>
            <input
              type="text"
              value={tank}
              onChange={e => setTank(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              placeholder={t.db.tankPlaceholder}
              className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
            />
          </div>
          {isProduct && (
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.price}</label>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={e => setPrice(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
            />
          </div>
          )}
        </div>
        {!isProduct && formula && (
          <div>
            <button
              onClick={handleAutoFillFromFormula}
              className={`w-full text-xs py-2 rounded-lg border transition-colors ${
                isDark ? 'border-neutral-700 hover:bg-neutral-700' : 'border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {t.settings.autoFillFromFormula}
            </button>
            {formulaError && (
              <div className="text-xs text-red-500 mt-1">{formulaError}</div>
            )}
          </div>
        )}
        {!isProduct && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.purity} (%)</label>
            <input
              type="number"
              inputMode="decimal"
              value={purity}
              onChange={e => setPurity(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
            />
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.price}</label>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={e => setPrice(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
            />
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.solubility}</label>
            <input
              type="number"
              inputMode="decimal"
              value={solubility}
              onChange={e => setSolubility(e.target.value)}
              onFocus={inputFocusStyle}
              onBlur={inputBlurStyle}
              className={`w-full rounded-lg border px-3 py-2 outline-none ${inputBase}`}
            />
            <p className="text-[10px] opacity-50 mt-1">* {t.db.solubilityHint}</p>
          </div>
        </div>
        )}
        {isProduct && !hasComposition && (
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.db.dosePerL}</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="text"
                value={dosePerL}
                onChange={e => setDosePerL(e.target.value)}
                onFocus={inputFocusStyle}
                onBlur={inputBlurStyle}
                placeholder={doseUnit === 'g' ? 'z.B. 1 oder 3-4' : 'z.B. 1 oder 3-4'}
                className={`flex-1 min-w-0 rounded-lg border px-3 py-2 outline-none ${inputBase}`}
              />
              <div className={`flex rounded-lg border overflow-hidden flex-shrink-0 ${isDark ? 'border-neutral-700' : 'border-neutral-300'}`}>
                {['ml', 'g'].map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setDoseUnit(u)}
                    className="px-3 text-sm font-medium transition-colors"
                    style={doseUnit === u
                      ? { background: accent.accent, color: '#fff' }
                      : { color: isDark ? '#a3a3a3' : '#525252' }}
                  >
                    {u}/L
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] opacity-50 mt-1">* {t.db.dosePerLHint}</p>
          </div>
        )}
      </section>

      <section className={`rounded-xl border ${cardClass} p-4`}>
        <div className="flex items-baseline justify-between mb-1 gap-2">
          <h3 className="text-sm font-semibold">{t.db.composition}</h3>
          {autoFilled && (
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: accent.soft, color: accent.text }}>
              {t.db.fromFormula}
            </span>
          )}
        </div>
        <p className="text-xs opacity-60 mb-3">{t.db.hint}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {ELEMENTS.map(el => (
            <div key={el} className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold flex-shrink-0">
                <ElSymbol el={el} ctx={ctx} />
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                value={composition[el] || ''}
                placeholder="0"
                onChange={e => updateComp(el, e.target.value)}
                onFocus={inputFocusStyle}
                onBlur={inputBlurStyle}
                className={`rounded-md border px-2 py-1.5 text-right text-sm outline-none flex-shrink-0 ${inputBase}`}
                style={{ width: '4.5rem' }}
              />
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-red-950/40 text-red-300' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCancel}
          className={`py-3 rounded-xl border font-medium ${
            isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-300 hover:bg-neutral-100'
          }`}
        >
          {t.db.cancel}
        </button>
        <button
          onClick={handleSubmit}
          className="py-3 rounded-xl text-white font-semibold"
          style={{ background: accent.accent }}
        >
          {t.db.save}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// KNOWLEDGE / REFERENZ-BEREICH
// ============================================================

// pH-Verfügbarkeitsdaten: relative Verfügbarkeit (0..1) auf pH-Skala 4.0–10.0
// Zwei Modi: 'soil' (Truog 1946) und 'hydro' (Sonneveld & Voogt 2009, mit EDTA-Chelaten)
const PH_RANGE = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];
// Anzeigebereich: zentriert um pH 6.0, da dieser für Hydro und Boden zentral ist
const PH_DISPLAY_MIN = 4.0;
const PH_DISPLAY_MAX = 8.0;

// SOIL: orientiert an Truog 1946 (Soil Sci Soc Am Proc 11:305-308)
// und Hartemink & Barrow 2023 (Plant and Soil, kritische Aufarbeitung)
const PH_AVAILABILITY_SOIL = {
  'N-NO3': [0.10, 0.30, 0.65, 0.90, 1.00, 1.00, 1.00, 1.00, 0.95, 0.80, 0.50, 0.25, 0.10],
  'N-NH4': [0.20, 0.45, 0.75, 0.95, 1.00, 1.00, 0.95, 0.80, 0.55, 0.30, 0.15, 0.05, 0.00],
  'P':     [0.20, 0.40, 0.65, 0.85, 1.00, 1.00, 0.95, 0.70, 0.45, 0.25, 0.20, 0.20, 0.20],
  'K':     [0.50, 0.70, 0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.85, 0.65, 0.40],
  'S':     [0.30, 0.50, 0.75, 0.90, 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.80, 0.60, 0.40],
  'Ca':    [0.10, 0.20, 0.40, 0.65, 0.85, 0.95, 1.00, 1.00, 1.00, 0.90, 0.75, 0.55, 0.35],
  'Mg':    [0.10, 0.20, 0.45, 0.70, 0.90, 1.00, 1.00, 1.00, 1.00, 0.90, 0.70, 0.45, 0.25],
  'Fe':    [1.00, 1.00, 1.00, 0.95, 0.75, 0.50, 0.25, 0.10, 0.05, 0.05, 0.05, 0.05, 0.05],
  'Mn':    [1.00, 1.00, 1.00, 0.90, 0.65, 0.40, 0.20, 0.10, 0.05, 0.05, 0.05, 0.05, 0.05],
  'B':     [0.50, 0.70, 0.90, 1.00, 1.00, 1.00, 1.00, 0.85, 0.55, 0.30, 0.20, 0.15, 0.10],
  'Cu':    [0.90, 0.95, 1.00, 1.00, 0.95, 0.80, 0.55, 0.30, 0.15, 0.10, 0.05, 0.05, 0.05],
  'Zn':    [0.90, 0.95, 1.00, 1.00, 0.95, 0.75, 0.45, 0.20, 0.10, 0.05, 0.05, 0.05, 0.05],
  'Mo':    [0.05, 0.10, 0.20, 0.40, 0.65, 0.85, 0.95, 1.00, 1.00, 1.00, 0.95, 0.85, 0.75],
};

// HYDRO: Sonneveld & Voogt 2009 (Plant Nutrition of Greenhouse Crops, Springer),
// Bugbee 2004, Lucena et al. zu EDTA-Chelat-Stabilitäten.
// Annahme: Mikronährstoffe als EDTA-Chelate (Standard in der Hydroponik).
// Hauptunterschiede zum Boden: 
//   - N(NO3) bleibt voll verfügbar (keine Nitrifikations-Abhängigkeit)
//   - Fe-EDTA stabil bis pH 6.5, dann zügiger Abfall
//   - Mn/Zn/Cu als EDTA breiter verfügbar als im Boden
//   - P weniger Probleme bei niedrigem pH (keine Bindung an Fe/Al-Oxide)
const PH_AVAILABILITY_HYDRO = {
  'N-NO3': [0.95, 0.98, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.85, 0.65, 0.45],
  'N-NH4': [0.85, 0.92, 0.98, 1.00, 1.00, 1.00, 0.90, 0.65, 0.35, 0.15, 0.05, 0.02, 0.00],
  'P':     [0.70, 0.85, 0.95, 1.00, 1.00, 1.00, 0.85, 0.60, 0.35, 0.20, 0.15, 0.10, 0.05],
  'K':     [0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.85, 0.70, 0.50],
  'S':     [0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.85, 0.70, 0.55, 0.40],
  'Ca':    [0.70, 0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 0.95, 0.80, 0.55, 0.30, 0.15, 0.05],
  'Mg':    [0.75, 0.90, 0.98, 1.00, 1.00, 1.00, 1.00, 0.95, 0.80, 0.55, 0.30, 0.15, 0.05],
  'Fe':    [1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.70, 0.35, 0.15, 0.08, 0.05, 0.03, 0.02],
  'Mn':    [0.95, 1.00, 1.00, 1.00, 1.00, 1.00, 0.90, 0.70, 0.45, 0.25, 0.15, 0.08, 0.05],
  'B':     [0.65, 0.80, 0.95, 1.00, 1.00, 1.00, 0.95, 0.80, 0.55, 0.35, 0.20, 0.15, 0.10],
  'Cu':    [0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 0.90, 0.65, 0.40, 0.20, 0.10, 0.05, 0.03],
  'Zn':    [0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 0.90, 0.65, 0.40, 0.20, 0.10, 0.05, 0.03],
  'Mo':    [0.10, 0.20, 0.40, 0.65, 0.85, 0.95, 1.00, 1.00, 1.00, 1.00, 0.95, 0.85, 0.75],
};

const PH_SOURCES = {
  soil: 'Truog 1946; Hartemink & Barrow 2023',
  hydro: 'Sonneveld & Voogt 2009; Bugbee 2004; Lucena et al.',
};

// Monoton-kubische Interpolation (Fritsch–Carlson) für glatte Kurven
// ohne Überschwinger. Garantiert: Monotonie wird respektiert.
function monotonicCubic(xs, ys, x) {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  // Index finden
  let i = 0;
  while (i < n - 1 && x > xs[i + 1]) i++;
  // Sekanten-Steigungen
  const h = xs[i + 1] - xs[i];
  const delta = (ys[i + 1] - ys[i]) / h;
  // Tangenten an den Endpunkten (Fritsch-Carlson, vereinfacht)
  const m_i = i === 0 ? delta : ((ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1]));
  const m_i1 = i + 1 === n - 1 ? delta : ((ys[i + 2] - ys[i]) / (xs[i + 2] - xs[i]));
  // Monotonie-Korrektur: wenn delta == 0, dann auch m = 0
  let mi = m_i, mi1 = m_i1;
  if (delta === 0) {
    mi = 0; mi1 = 0;
  } else {
    const alpha = mi / delta;
    const beta = mi1 / delta;
    if (alpha < 0) mi = 0;
    if (beta < 0) mi1 = 0;
    // Begrenzung auf Kreis (Fritsch-Carlson)
    const r = alpha * alpha + beta * beta;
    if (r > 9) {
      const tau = 3 / Math.sqrt(r);
      mi = tau * alpha * delta;
      mi1 = tau * beta * delta;
    }
  }
  // Hermite-Interpolation
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * ys[i] + h10 * h * mi + h01 * ys[i + 1] + h11 * h * mi1;
}

// Diese Elemente werden in der pH-Tabelle angezeigt
const PH_DISPLAY_ELEMENTS = ['N-NO3', 'N-NH4', 'P', 'K', 'S', 'Ca', 'Mg', 'Fe', 'Mn', 'B', 'Cu', 'Zn', 'Mo'];

// pH-Bereichs-Labels für die Skala oben
function getPhRangeLabel(ph, t) {
  if (ph < 5.0) return t.knowledge.strongAcid;
  if (ph < 5.5) return t.knowledge.mediumAcid;
  if (ph < 6.5) return t.knowledge.slightAcid;
  if (ph < 7.5) return t.knowledge.neutral;
  if (ph < 8.0) return t.knowledge.slightAlkaline;
  if (ph < 9.0) return t.knowledge.mediumAlkaline;
  return t.knowledge.strongAlkaline;
}

function KnowledgeView({ ctx, salts }) {
  const { t, isDark, accent } = ctx;
  const [page, setPage] = useState('overview'); // overview | phAvailability | vpd | runoff | compat | periodic

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  if (page === 'phAvailability') {
    return <PhAvailabilityView ctx={ctx} onBack={() => setPage('overview')} />;
  }
  if (page === 'periodic') {
    return <PeriodicTableView ctx={ctx} onBack={() => setPage('overview')} />;
  }
  if (page === 'compat') {
    return <CompatibilityView ctx={ctx} salts={salts} onBack={() => setPage('overview')} />;
  }
  if (page === 'vpd') {
    return <VpdView ctx={ctx} onBack={() => setPage('overview')} />;
  }
  if (page === 'runoff') {
    return <RootzoneView ctx={ctx} onBack={() => setPage('overview')} />;
  }
  if (page === 'foliarCheat') {
    return <FoliarCheatSheetView ctx={ctx} onBack={() => setPage('overview')} />;
  }

  const items = [
    { id: 'phAvailability', icon: Droplets, title: t.knowledge.phAvailability, desc: t.knowledge.phAvailabilityDesc, available: true },
    { id: 'periodic', icon: Atom, title: t.knowledge.periodic, desc: t.knowledge.periodicDesc, available: true },
    { id: 'compat', icon: Network, title: t.knowledge.compat, desc: t.knowledge.compatDesc, available: true },
    { id: 'vpd', icon: Wind, title: t.knowledge.vpd, desc: t.knowledge.vpdDesc, available: true },
    { id: 'runoff', icon: Activity, title: t.knowledge.runoff, desc: t.knowledge.runoffDesc, available: true },
    { id: 'foliarCheat', icon: Leaf, title: t.knowledge.foliarCheat, desc: t.knowledge.foliarCheatDesc, available: true },
  ];

  return (
    <div className="space-y-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => item.available && setPage(item.id)}
            disabled={!item.available}
            className={`w-full rounded-xl border ${cardClass} p-4 text-left transition-colors ${
              item.available ? (isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-50') : 'opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: accent.soft, color: accent.text }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {!item.available && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded opacity-70" style={{ background: isDark ? '#404040' : '#e5e5e5' }}>
                      {t.knowledge.comingSoon}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-60 mt-0.5">{item.desc}</p>
              </div>
              {item.available && <ChevronRight size={18} className="opacity-40 flex-shrink-0" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// pH-VERFÜGBARKEITS-ANSICHT
// ============================================================
function PhAvailabilityView({ ctx, onBack }) {
  const { t, isDark, elementColorsOn, elementColors, accent, phMode, setPhMode } = ctx;
  const [hoveredPh, setHoveredPh] = useState(null);
  const mode = phMode;
  const setMode = setPhMode;

  const dataset = mode === 'soil' ? PH_AVAILABILITY_SOIL : PH_AVAILABILITY_HYDRO;
  const sourceText = PH_SOURCES[mode];

  // Standard-Farbe wenn elementColorsOn aus ist
  const defaultColor = isDark ? '#a3a3a3' : '#525252';

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  // Verfügbarkeit eines Elements bei einem bestimmten pH (monoton-kubisch interpoliert)
  const getAvail = (el, ph) => {
    const data = dataset[el];
    if (!data) return 0;
    const v = monotonicCubic(PH_RANGE, data, ph);
    return Math.max(0, Math.min(1, v));
  };

  // Hochaufgelöste Punkte (alle 0.1 pH) für glatte SVG-Bänder, nur im Anzeigebereich
  const HIGH_RES_PH = useMemo(() => {
    const arr = [];
    for (let p = PH_DISPLAY_MIN; p <= PH_DISPLAY_MAX + 0.001; p += 0.1) {
      arr.push(Math.round(p * 10) / 10);
    }
    return arr;
  }, []);

  // Position für Pointer-Tracking - auf der inneren Band-Spalte (0.1 Auflösung)
  // bandRef wird auf das innere Element gesetzt, das nur die SVG-Spalte umfasst
  const bandColumnRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!bandColumnRef.current) return;
    const rect = bandColumnRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const ph = PH_DISPLAY_MIN + ratio * (PH_DISPLAY_MAX - PH_DISPLAY_MIN);
    setHoveredPh(Math.round(ph * 10) / 10);
  };

  // Position der senkrechten Linie als Prozent der SVG-Spalten-Breite
  const linePercent = hoveredPh !== null
    ? ((hoveredPh - PH_DISPLAY_MIN) / (PH_DISPLAY_MAX - PH_DISPLAY_MIN)) * 100
    : null;

  // Farbverlauf pH-Skala (zentriert um pH 6, der für beide Medien optimal)
  const phGradient = 'linear-gradient(to right, #ef4444 0%, #f97316 15%, #eab308 30%, #84cc16 42%, #22c55e 50%, #14b8a6 60%, #06b6d4 75%, #3b82f6 88%, #8b5cf6 100%)';

  return (
    <div className="space-y-4">
      {/* Header mit Back */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4 space-y-3`}>
        <h2 className="text-base font-semibold">{t.knowledge.phAvailability}</h2>
        <p className="text-xs opacity-60">{t.knowledge.phAvailabilityDesc}</p>
      </section>

      {/* Modus-Toggle */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 opacity-80">{t.knowledge.medium}</h3>
        <div className="grid grid-cols-2 gap-2">
          <SegmentButton active={mode === 'soil'} onClick={() => setMode('soil')} ctx={ctx}>
            {t.knowledge.modeSoil}
          </SegmentButton>
          <SegmentButton active={mode === 'hydro'} onClick={() => setMode('hydro')} ctx={ctx}>
            {t.knowledge.modeHydro}
          </SegmentButton>
        </div>
      </section>

      {/* pH-Skala (gleiche Breite wie die Band-Spalte unten, damit alles synchron ist) */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <div className="text-xs opacity-60 mb-2">{t.knowledge.phValue}</div>
        <div className="flex items-center gap-3">
          {/* Linker Spacer, gleiche Breite wie Element-Symbol-Spalte unten (w-14 = 3.5rem) */}
          <div className="w-14 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 rounded-full mb-1" style={{ background: phGradient }} />
            <div className="flex justify-between text-[10px] opacity-60 px-0.5">
              {[4, 5, 6, 7, 8].map(p => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </div>
          {/* Rechter Spacer, gleiche Breite wie Prozent-Spalte unten (w-10 = 2.5rem) */}
          <div className="w-10 flex-shrink-0" />
        </div>
        {hoveredPh !== null && (
          <div className="mt-2 text-xs text-center">
            <span className="font-semibold tabular-nums">pH {hoveredPh.toFixed(1)}</span>
            <span className="opacity-60"> — {getPhRangeLabel(hoveredPh, t)}</span>
          </div>
        )}
      </section>

      {/* Element-Verfügbarkeit als Bänder */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <div className="text-xs opacity-60 mb-3">{t.knowledge.availability}</div>
        <div className="space-y-2 relative">
          {PH_DISPLAY_ELEMENTS.map((el, rowIdx) => {
            const color = elementColorsOn ? elementColors[el] : defaultColor;
            const maxThickness = 22;
            const minThickness = 1.5;

            // Hochaufgelöste Punkte: 41 Stützstellen (pH 4.0-8.0 in 0.1-Schritten)
            const points = HIGH_RES_PH.map(ph => ({
              x: ((ph - PH_DISPLAY_MIN) / (PH_DISPLAY_MAX - PH_DISPLAY_MIN)) * 100,
              y: Math.max(0, Math.min(1, monotonicCubic(PH_RANGE, dataset[el], ph))),
            }));

            const buildPath = () => {
              const top = points.map(p => {
                const yPos = (1 - p.y) * (maxThickness - minThickness) / 2 + minThickness / 2;
                return `${p.x.toFixed(2)},${yPos.toFixed(2)}`;
              });
              const bottom = points.slice().reverse().map(p => {
                const yPos = maxThickness - ((1 - p.y) * (maxThickness - minThickness) / 2 + minThickness / 2);
                return `${p.x.toFixed(2)},${yPos.toFixed(2)}`;
              });
              return `M ${top.join(' L ')} L ${bottom.join(' L ')} Z`;
            };

            const hoverVal = hoveredPh !== null ? getAvail(el, hoveredPh) : null;

            return (
              <div key={el} className="flex items-center gap-3">
                <div className="w-14 flex-shrink-0 text-sm font-semibold">
                  <ElSymbol el={el} ctx={ctx} />
                </div>
                <div
                  className="flex-1 relative select-none touch-none"
                  ref={rowIdx === 0 ? bandColumnRef : undefined}
                  onMouseMove={handlePointerMove}
                  onMouseDown={handlePointerMove}
                  onTouchStart={handlePointerMove}
                  onTouchMove={handlePointerMove}
                >
                  <svg
                    viewBox={`0 0 100 ${maxThickness}`}
                    preserveAspectRatio="none"
                    className="w-full block"
                    style={{ height: `${maxThickness}px` }}
                  >
                    <path d={buildPath()} fill={color} opacity="0.85" />
                  </svg>
                  {/* Senkrechte Linie nur über dieser Band-Spalte */}
                  {linePercent !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-px pointer-events-none"
                      style={{
                        left: `${linePercent}%`,
                        background: isDark ? '#fafafa' : '#171717',
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                <div className="w-10 text-right text-xs tabular-nums opacity-70">
                  {hoverVal !== null ? `${Math.round(hoverVal * 100)}%` : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hinweis */}
        <p className="text-[10px] opacity-50 mt-3 text-center">
          {ctx.lang === 'de'
            ? 'Tippe und halte auf den Balken, um Werte abzulesen'
            : 'Tap and hold on the bars to read values'}
        </p>
      </section>

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: {sourceText}
      </div>
    </div>
  );
}

// ============================================================
// PERIODENSYSTEM-DATEN
// Quelle: IUPAC Standard-Atomgewichte (2021), Elementdaten WebElements
// Felder: Z=Ordnungszahl, sym, name_de, name_en, mass (Atomgewicht),
//   period, group (1-18, 0=Lanthanide, -1=Actinide),
//   cat (Kategorie), state (s/l/g), eneg (Pauling, oder null),
//   mp (Schmelzpunkt °C), bp (Siedepunkt °C), density (g/cm³),
//   year (Entdeckung), discoverer
// ============================================================
const PT_CATEGORIES = {
  'alkali':         { de: 'Alkalimetall',           en: 'Alkali metal',           color: '#ef4444' },
  'alkaline':       { de: 'Erdalkalimetall',        en: 'Alkaline earth metal',   color: '#f97316' },
  'transition':     { de: 'Übergangsmetall',         en: 'Transition metal',        color: '#eab308' },
  'posttransition': { de: 'Nachübergangsmetall',     en: 'Post-transition metal',   color: '#a3a3a3' },
  'metalloid':      { de: 'Halbmetall',              en: 'Metalloid',               color: '#84cc16' },
  'nonmetal':       { de: 'Nichtmetall',             en: 'Nonmetal',                color: '#22c55e' },
  'halogen':        { de: 'Halogen',                 en: 'Halogen',                 color: '#06b6d4' },
  'noble':          { de: 'Edelgas',                 en: 'Noble gas',               color: '#8b5cf6' },
  'lanthanide':     { de: 'Lanthanoid',              en: 'Lanthanide',              color: '#d946ef' },
  'actinide':       { de: 'Actinoid',                en: 'Actinide',                color: '#f43f5e' },
  'unknown':        { de: 'Unbekannt',               en: 'Unknown',                 color: '#525252' },
};

const PERIODIC_TABLE = [
  // Periode 1
  { z: 1,  sym: 'H',  name_de: 'Wasserstoff',     name_en: 'Hydrogen',      mass: 1.008,   period: 1, group: 1,  cat: 'nonmetal',       state: 'g', eneg: 2.20, mp: -259.16, bp: -252.87, density: 0.0000899, year: 1766, disc: 'Cavendish' },
  { z: 2,  sym: 'He', name_de: 'Helium',          name_en: 'Helium',        mass: 4.0026,  period: 1, group: 18, cat: 'noble',          state: 'g', eneg: null, mp: -272.20, bp: -268.93, density: 0.0001785, year: 1868, disc: 'Janssen, Lockyer' },
  // Periode 2
  { z: 3,  sym: 'Li', name_de: 'Lithium',         name_en: 'Lithium',       mass: 6.94,    period: 2, group: 1,  cat: 'alkali',         state: 's', eneg: 0.98, mp: 180.50,  bp: 1342.0,  density: 0.534,    year: 1817, disc: 'Arfwedson' },
  { z: 4,  sym: 'Be', name_de: 'Beryllium',       name_en: 'Beryllium',     mass: 9.0122,  period: 2, group: 2,  cat: 'alkaline',       state: 's', eneg: 1.57, mp: 1287.0,  bp: 2471.0,  density: 1.848,    year: 1798, disc: 'Vauquelin' },
  { z: 5,  sym: 'B',  name_de: 'Bor',             name_en: 'Boron',         mass: 10.81,   period: 2, group: 13, cat: 'metalloid',      state: 's', eneg: 2.04, mp: 2076.0,  bp: 3927.0,  density: 2.34,     year: 1808, disc: 'Davy, Gay-Lussac' },
  { z: 6,  sym: 'C',  name_de: 'Kohlenstoff',     name_en: 'Carbon',        mass: 12.011,  period: 2, group: 14, cat: 'nonmetal',       state: 's', eneg: 2.55, mp: 3550.0,  bp: 4027.0,  density: 2.267,    year: null, disc: '—' },
  { z: 7,  sym: 'N',  name_de: 'Stickstoff',      name_en: 'Nitrogen',      mass: 14.007,  period: 2, group: 15, cat: 'nonmetal',       state: 'g', eneg: 3.04, mp: -210.10, bp: -195.79, density: 0.001251,  year: 1772, disc: 'Rutherford' },
  { z: 8,  sym: 'O',  name_de: 'Sauerstoff',      name_en: 'Oxygen',        mass: 15.999,  period: 2, group: 16, cat: 'nonmetal',       state: 'g', eneg: 3.44, mp: -218.79, bp: -182.95, density: 0.001429,  year: 1774, disc: 'Priestley, Scheele' },
  { z: 9,  sym: 'F',  name_de: 'Fluor',           name_en: 'Fluorine',      mass: 18.998,  period: 2, group: 17, cat: 'halogen',        state: 'g', eneg: 3.98, mp: -219.62, bp: -188.12, density: 0.001696,  year: 1886, disc: 'Moissan' },
  { z: 10, sym: 'Ne', name_de: 'Neon',            name_en: 'Neon',          mass: 20.180,  period: 2, group: 18, cat: 'noble',          state: 'g', eneg: null, mp: -248.59, bp: -246.08, density: 0.0009002, year: 1898, disc: 'Ramsay, Travers' },
  // Periode 3
  { z: 11, sym: 'Na', name_de: 'Natrium',         name_en: 'Sodium',        mass: 22.990,  period: 3, group: 1,  cat: 'alkali',         state: 's', eneg: 0.93, mp: 97.79,   bp: 882.94,  density: 0.971,    year: 1807, disc: 'Davy' },
  { z: 12, sym: 'Mg', name_de: 'Magnesium',       name_en: 'Magnesium',     mass: 24.305,  period: 3, group: 2,  cat: 'alkaline',       state: 's', eneg: 1.31, mp: 650.0,   bp: 1090.0,  density: 1.738,    year: 1755, disc: 'Black' },
  { z: 13, sym: 'Al', name_de: 'Aluminium',       name_en: 'Aluminium',     mass: 26.982,  period: 3, group: 13, cat: 'posttransition', state: 's', eneg: 1.61, mp: 660.32,  bp: 2519.0,  density: 2.699,    year: 1825, disc: 'Ørsted' },
  { z: 14, sym: 'Si', name_de: 'Silicium',        name_en: 'Silicon',       mass: 28.085,  period: 3, group: 14, cat: 'metalloid',      state: 's', eneg: 1.90, mp: 1414.0,  bp: 3265.0,  density: 2.3296,   year: 1824, disc: 'Berzelius' },
  { z: 15, sym: 'P',  name_de: 'Phosphor',        name_en: 'Phosphorus',    mass: 30.974,  period: 3, group: 15, cat: 'nonmetal',       state: 's', eneg: 2.19, mp: 44.15,   bp: 280.5,   density: 1.82,     year: 1669, disc: 'Brand' },
  { z: 16, sym: 'S',  name_de: 'Schwefel',        name_en: 'Sulfur',        mass: 32.06,   period: 3, group: 16, cat: 'nonmetal',       state: 's', eneg: 2.58, mp: 115.21,  bp: 444.61,  density: 2.067,    year: null, disc: '—' },
  { z: 17, sym: 'Cl', name_de: 'Chlor',           name_en: 'Chlorine',      mass: 35.45,   period: 3, group: 17, cat: 'halogen',        state: 'g', eneg: 3.16, mp: -101.50, bp: -34.04,  density: 0.003214,  year: 1774, disc: 'Scheele' },
  { z: 18, sym: 'Ar', name_de: 'Argon',           name_en: 'Argon',         mass: 39.948,  period: 3, group: 18, cat: 'noble',          state: 'g', eneg: null, mp: -189.34, bp: -185.85, density: 0.001784,  year: 1894, disc: 'Rayleigh, Ramsay' },
  // Periode 4
  { z: 19, sym: 'K',  name_de: 'Kalium',          name_en: 'Potassium',     mass: 39.098,  period: 4, group: 1,  cat: 'alkali',         state: 's', eneg: 0.82, mp: 63.50,   bp: 759.0,   density: 0.862,    year: 1807, disc: 'Davy' },
  { z: 20, sym: 'Ca', name_de: 'Calcium',         name_en: 'Calcium',       mass: 40.078,  period: 4, group: 2,  cat: 'alkaline',       state: 's', eneg: 1.00, mp: 842.0,   bp: 1484.0,  density: 1.54,     year: 1808, disc: 'Davy' },
  { z: 21, sym: 'Sc', name_de: 'Scandium',        name_en: 'Scandium',      mass: 44.956,  period: 4, group: 3,  cat: 'transition',     state: 's', eneg: 1.36, mp: 1541.0,  bp: 2836.0,  density: 2.989,    year: 1879, disc: 'Nilson' },
  { z: 22, sym: 'Ti', name_de: 'Titan',           name_en: 'Titanium',      mass: 47.867,  period: 4, group: 4,  cat: 'transition',     state: 's', eneg: 1.54, mp: 1668.0,  bp: 3287.0,  density: 4.54,     year: 1791, disc: 'Gregor' },
  { z: 23, sym: 'V',  name_de: 'Vanadium',        name_en: 'Vanadium',      mass: 50.942,  period: 4, group: 5,  cat: 'transition',     state: 's', eneg: 1.63, mp: 1910.0,  bp: 3407.0,  density: 6.11,     year: 1801, disc: 'del Río' },
  { z: 24, sym: 'Cr', name_de: 'Chrom',           name_en: 'Chromium',      mass: 51.996,  period: 4, group: 6,  cat: 'transition',     state: 's', eneg: 1.66, mp: 1907.0,  bp: 2671.0,  density: 7.15,     year: 1797, disc: 'Vauquelin' },
  { z: 25, sym: 'Mn', name_de: 'Mangan',          name_en: 'Manganese',     mass: 54.938,  period: 4, group: 7,  cat: 'transition',     state: 's', eneg: 1.55, mp: 1246.0,  bp: 2061.0,  density: 7.44,     year: 1774, disc: 'Gahn' },
  { z: 26, sym: 'Fe', name_de: 'Eisen',           name_en: 'Iron',          mass: 55.845,  period: 4, group: 8,  cat: 'transition',     state: 's', eneg: 1.83, mp: 1538.0,  bp: 2861.0,  density: 7.874,    year: null, disc: '—' },
  { z: 27, sym: 'Co', name_de: 'Cobalt',          name_en: 'Cobalt',        mass: 58.933,  period: 4, group: 9,  cat: 'transition',     state: 's', eneg: 1.88, mp: 1495.0,  bp: 2927.0,  density: 8.86,     year: 1735, disc: 'Brandt' },
  { z: 28, sym: 'Ni', name_de: 'Nickel',          name_en: 'Nickel',        mass: 58.693,  period: 4, group: 10, cat: 'transition',     state: 's', eneg: 1.91, mp: 1455.0,  bp: 2913.0,  density: 8.912,    year: 1751, disc: 'Cronstedt' },
  { z: 29, sym: 'Cu', name_de: 'Kupfer',          name_en: 'Copper',        mass: 63.546,  period: 4, group: 11, cat: 'transition',     state: 's', eneg: 1.90, mp: 1084.62, bp: 2562.0,  density: 8.96,     year: null, disc: '—' },
  { z: 30, sym: 'Zn', name_de: 'Zink',            name_en: 'Zinc',          mass: 65.38,   period: 4, group: 12, cat: 'transition',     state: 's', eneg: 1.65, mp: 419.53,  bp: 907.0,   density: 7.134,    year: null, disc: '—' },
  { z: 31, sym: 'Ga', name_de: 'Gallium',         name_en: 'Gallium',       mass: 69.723,  period: 4, group: 13, cat: 'posttransition', state: 's', eneg: 1.81, mp: 29.76,   bp: 2204.0,  density: 5.907,    year: 1875, disc: 'de Boisbaudran' },
  { z: 32, sym: 'Ge', name_de: 'Germanium',       name_en: 'Germanium',     mass: 72.630,  period: 4, group: 14, cat: 'metalloid',      state: 's', eneg: 2.01, mp: 938.25,  bp: 2833.0,  density: 5.323,    year: 1886, disc: 'Winkler' },
  { z: 33, sym: 'As', name_de: 'Arsen',           name_en: 'Arsenic',       mass: 74.922,  period: 4, group: 15, cat: 'metalloid',      state: 's', eneg: 2.18, mp: 817.0,   bp: 614.0,   density: 5.776,    year: null, disc: '—' },
  { z: 34, sym: 'Se', name_de: 'Selen',           name_en: 'Selenium',      mass: 78.971,  period: 4, group: 16, cat: 'nonmetal',       state: 's', eneg: 2.55, mp: 221.0,   bp: 685.0,   density: 4.809,    year: 1817, disc: 'Berzelius' },
  { z: 35, sym: 'Br', name_de: 'Brom',            name_en: 'Bromine',       mass: 79.904,  period: 4, group: 17, cat: 'halogen',        state: 'l', eneg: 2.96, mp: -7.20,   bp: 58.80,   density: 3.122,    year: 1826, disc: 'Balard' },
  { z: 36, sym: 'Kr', name_de: 'Krypton',         name_en: 'Krypton',       mass: 83.798,  period: 4, group: 18, cat: 'noble',          state: 'g', eneg: 3.00, mp: -157.36, bp: -153.22, density: 0.003733,  year: 1898, disc: 'Ramsay, Travers' },
  // Periode 5
  { z: 37, sym: 'Rb', name_de: 'Rubidium',        name_en: 'Rubidium',      mass: 85.468,  period: 5, group: 1,  cat: 'alkali',         state: 's', eneg: 0.82, mp: 39.30,   bp: 688.0,   density: 1.532,    year: 1861, disc: 'Bunsen, Kirchhoff' },
  { z: 38, sym: 'Sr', name_de: 'Strontium',       name_en: 'Strontium',     mass: 87.62,   period: 5, group: 2,  cat: 'alkaline',       state: 's', eneg: 0.95, mp: 777.0,   bp: 1382.0,  density: 2.64,     year: 1790, disc: 'Crawford' },
  { z: 39, sym: 'Y',  name_de: 'Yttrium',         name_en: 'Yttrium',       mass: 88.906,  period: 5, group: 3,  cat: 'transition',     state: 's', eneg: 1.22, mp: 1526.0,  bp: 3336.0,  density: 4.469,    year: 1794, disc: 'Gadolin' },
  { z: 40, sym: 'Zr', name_de: 'Zirconium',       name_en: 'Zirconium',     mass: 91.224,  period: 5, group: 4,  cat: 'transition',     state: 's', eneg: 1.33, mp: 1855.0,  bp: 4409.0,  density: 6.506,    year: 1789, disc: 'Klaproth' },
  { z: 41, sym: 'Nb', name_de: 'Niob',            name_en: 'Niobium',       mass: 92.906,  period: 5, group: 5,  cat: 'transition',     state: 's', eneg: 1.6,  mp: 2477.0,  bp: 4744.0,  density: 8.57,     year: 1801, disc: 'Hatchett' },
  { z: 42, sym: 'Mo', name_de: 'Molybdän',        name_en: 'Molybdenum',    mass: 95.95,   period: 5, group: 6,  cat: 'transition',     state: 's', eneg: 2.16, mp: 2623.0,  bp: 4639.0,  density: 10.22,    year: 1778, disc: 'Scheele' },
  { z: 43, sym: 'Tc', name_de: 'Technetium',      name_en: 'Technetium',    mass: 98,      period: 5, group: 7,  cat: 'transition',     state: 's', eneg: 1.9,  mp: 2157.0,  bp: 4265.0,  density: 11.5,     year: 1937, disc: 'Perrier, Segrè' },
  { z: 44, sym: 'Ru', name_de: 'Ruthenium',       name_en: 'Ruthenium',     mass: 101.07,  period: 5, group: 8,  cat: 'transition',     state: 's', eneg: 2.2,  mp: 2334.0,  bp: 4150.0,  density: 12.37,    year: 1844, disc: 'Klaus' },
  { z: 45, sym: 'Rh', name_de: 'Rhodium',         name_en: 'Rhodium',       mass: 102.91,  period: 5, group: 9,  cat: 'transition',     state: 's', eneg: 2.28, mp: 1964.0,  bp: 3695.0,  density: 12.41,    year: 1803, disc: 'Wollaston' },
  { z: 46, sym: 'Pd', name_de: 'Palladium',       name_en: 'Palladium',     mass: 106.42,  period: 5, group: 10, cat: 'transition',     state: 's', eneg: 2.20, mp: 1554.9,  bp: 2963.0,  density: 12.02,    year: 1803, disc: 'Wollaston' },
  { z: 47, sym: 'Ag', name_de: 'Silber',          name_en: 'Silver',        mass: 107.87,  period: 5, group: 11, cat: 'transition',     state: 's', eneg: 1.93, mp: 961.78,  bp: 2162.0,  density: 10.501,   year: null, disc: '—' },
  { z: 48, sym: 'Cd', name_de: 'Cadmium',         name_en: 'Cadmium',       mass: 112.41,  period: 5, group: 12, cat: 'transition',     state: 's', eneg: 1.69, mp: 321.07,  bp: 767.0,   density: 8.69,     year: 1817, disc: 'Stromeyer' },
  { z: 49, sym: 'In', name_de: 'Indium',          name_en: 'Indium',        mass: 114.82,  period: 5, group: 13, cat: 'posttransition', state: 's', eneg: 1.78, mp: 156.60,  bp: 2072.0,  density: 7.31,     year: 1863, disc: 'Reich, Richter' },
  { z: 50, sym: 'Sn', name_de: 'Zinn',            name_en: 'Tin',           mass: 118.71,  period: 5, group: 14, cat: 'posttransition', state: 's', eneg: 1.96, mp: 231.93,  bp: 2602.0,  density: 7.287,    year: null, disc: '—' },
  { z: 51, sym: 'Sb', name_de: 'Antimon',         name_en: 'Antimony',      mass: 121.76,  period: 5, group: 15, cat: 'metalloid',      state: 's', eneg: 2.05, mp: 630.63,  bp: 1587.0,  density: 6.685,    year: null, disc: '—' },
  { z: 52, sym: 'Te', name_de: 'Tellur',          name_en: 'Tellurium',     mass: 127.60,  period: 5, group: 16, cat: 'metalloid',      state: 's', eneg: 2.1,  mp: 449.51,  bp: 988.0,   density: 6.232,    year: 1782, disc: 'von Reichenstein' },
  { z: 53, sym: 'I',  name_de: 'Iod',             name_en: 'Iodine',        mass: 126.90,  period: 5, group: 17, cat: 'halogen',        state: 's', eneg: 2.66, mp: 113.70,  bp: 184.30,  density: 4.93,     year: 1811, disc: 'Courtois' },
  { z: 54, sym: 'Xe', name_de: 'Xenon',           name_en: 'Xenon',         mass: 131.29,  period: 5, group: 18, cat: 'noble',          state: 'g', eneg: 2.6,  mp: -111.75, bp: -108.10, density: 0.005887,  year: 1898, disc: 'Ramsay, Travers' },
  // Periode 6
  { z: 55, sym: 'Cs', name_de: 'Cäsium',          name_en: 'Caesium',       mass: 132.91,  period: 6, group: 1,  cat: 'alkali',         state: 's', eneg: 0.79, mp: 28.44,   bp: 671.0,   density: 1.873,    year: 1860, disc: 'Bunsen, Kirchhoff' },
  { z: 56, sym: 'Ba', name_de: 'Barium',          name_en: 'Barium',        mass: 137.33,  period: 6, group: 2,  cat: 'alkaline',       state: 's', eneg: 0.89, mp: 727.0,   bp: 1897.0,  density: 3.594,    year: 1808, disc: 'Davy' },
  { z: 57, sym: 'La', name_de: 'Lanthan',         name_en: 'Lanthanum',     mass: 138.91,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.10, mp: 920.0,   bp: 3464.0,  density: 6.146,    year: 1839, disc: 'Mosander' },
  { z: 58, sym: 'Ce', name_de: 'Cer',             name_en: 'Cerium',        mass: 140.12,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.12, mp: 795.0,   bp: 3443.0,  density: 6.689,    year: 1803, disc: 'Klaproth' },
  { z: 59, sym: 'Pr', name_de: 'Praseodym',       name_en: 'Praseodymium',  mass: 140.91,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.13, mp: 935.0,   bp: 3520.0,  density: 6.640,    year: 1885, disc: 'Auer von Welsbach' },
  { z: 60, sym: 'Nd', name_de: 'Neodym',          name_en: 'Neodymium',     mass: 144.24,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.14, mp: 1024.0,  bp: 3074.0,  density: 7.01,     year: 1885, disc: 'Auer von Welsbach' },
  { z: 61, sym: 'Pm', name_de: 'Promethium',      name_en: 'Promethium',    mass: 145,     period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.13, mp: 1042.0,  bp: 3000.0,  density: 7.264,    year: 1945, disc: 'Marinsky, Glendenin, Coryell' },
  { z: 62, sym: 'Sm', name_de: 'Samarium',        name_en: 'Samarium',      mass: 150.36,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.17, mp: 1072.0,  bp: 1794.0,  density: 7.353,    year: 1879, disc: 'de Boisbaudran' },
  { z: 63, sym: 'Eu', name_de: 'Europium',        name_en: 'Europium',      mass: 151.96,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.20, mp: 822.0,   bp: 1529.0,  density: 5.244,    year: 1901, disc: 'Demarçay' },
  { z: 64, sym: 'Gd', name_de: 'Gadolinium',      name_en: 'Gadolinium',    mass: 157.25,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.20, mp: 1313.0,  bp: 3273.0,  density: 7.901,    year: 1880, disc: 'de Marignac' },
  { z: 65, sym: 'Tb', name_de: 'Terbium',         name_en: 'Terbium',       mass: 158.93,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.10, mp: 1356.0,  bp: 3230.0,  density: 8.219,    year: 1843, disc: 'Mosander' },
  { z: 66, sym: 'Dy', name_de: 'Dysprosium',      name_en: 'Dysprosium',    mass: 162.50,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.22, mp: 1412.0,  bp: 2567.0,  density: 8.551,    year: 1886, disc: 'de Boisbaudran' },
  { z: 67, sym: 'Ho', name_de: 'Holmium',         name_en: 'Holmium',       mass: 164.93,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.23, mp: 1474.0,  bp: 2700.0,  density: 8.795,    year: 1878, disc: 'Cleve' },
  { z: 68, sym: 'Er', name_de: 'Erbium',          name_en: 'Erbium',        mass: 167.26,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.24, mp: 1497.0,  bp: 2868.0,  density: 9.066,    year: 1843, disc: 'Mosander' },
  { z: 69, sym: 'Tm', name_de: 'Thulium',         name_en: 'Thulium',       mass: 168.93,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.25, mp: 1545.0,  bp: 1950.0,  density: 9.321,    year: 1879, disc: 'Cleve' },
  { z: 70, sym: 'Yb', name_de: 'Ytterbium',       name_en: 'Ytterbium',     mass: 173.05,  period: 6, group: 0,  cat: 'lanthanide',     state: 's', eneg: 1.10, mp: 824.0,   bp: 1196.0,  density: 6.570,    year: 1878, disc: 'de Marignac' },
  { z: 71, sym: 'Lu', name_de: 'Lutetium',        name_en: 'Lutetium',      mass: 174.97,  period: 6, group: 3,  cat: 'lanthanide',     state: 's', eneg: 1.27, mp: 1663.0,  bp: 3402.0,  density: 9.841,    year: 1907, disc: 'Urbain' },
  { z: 72, sym: 'Hf', name_de: 'Hafnium',         name_en: 'Hafnium',       mass: 178.49,  period: 6, group: 4,  cat: 'transition',     state: 's', eneg: 1.3,  mp: 2233.0,  bp: 4603.0,  density: 13.31,    year: 1923, disc: 'Coster, de Hevesy' },
  { z: 73, sym: 'Ta', name_de: 'Tantal',          name_en: 'Tantalum',      mass: 180.95,  period: 6, group: 5,  cat: 'transition',     state: 's', eneg: 1.5,  mp: 3017.0,  bp: 5458.0,  density: 16.65,    year: 1802, disc: 'Ekeberg' },
  { z: 74, sym: 'W',  name_de: 'Wolfram',         name_en: 'Tungsten',      mass: 183.84,  period: 6, group: 6,  cat: 'transition',     state: 's', eneg: 2.36, mp: 3422.0,  bp: 5555.0,  density: 19.25,    year: 1783, disc: 'de Elhuyar' },
  { z: 75, sym: 'Re', name_de: 'Rhenium',         name_en: 'Rhenium',       mass: 186.21,  period: 6, group: 7,  cat: 'transition',     state: 's', eneg: 1.9,  mp: 3186.0,  bp: 5596.0,  density: 21.02,    year: 1925, disc: 'Noddack, Tacke, Berg' },
  { z: 76, sym: 'Os', name_de: 'Osmium',          name_en: 'Osmium',        mass: 190.23,  period: 6, group: 8,  cat: 'transition',     state: 's', eneg: 2.2,  mp: 3033.0,  bp: 5012.0,  density: 22.59,    year: 1803, disc: 'Tennant' },
  { z: 77, sym: 'Ir', name_de: 'Iridium',         name_en: 'Iridium',       mass: 192.22,  period: 6, group: 9,  cat: 'transition',     state: 's', eneg: 2.20, mp: 2466.0,  bp: 4428.0,  density: 22.56,    year: 1803, disc: 'Tennant' },
  { z: 78, sym: 'Pt', name_de: 'Platin',          name_en: 'Platinum',      mass: 195.08,  period: 6, group: 10, cat: 'transition',     state: 's', eneg: 2.28, mp: 1768.3,  bp: 3825.0,  density: 21.45,    year: 1735, disc: 'Ulloa' },
  { z: 79, sym: 'Au', name_de: 'Gold',            name_en: 'Gold',          mass: 196.97,  period: 6, group: 11, cat: 'transition',     state: 's', eneg: 2.54, mp: 1064.18, bp: 2856.0,  density: 19.282,   year: null, disc: '—' },
  { z: 80, sym: 'Hg', name_de: 'Quecksilber',     name_en: 'Mercury',       mass: 200.59,  period: 6, group: 12, cat: 'transition',     state: 'l', eneg: 2.00, mp: -38.83,  bp: 356.73,  density: 13.534,   year: null, disc: '—' },
  { z: 81, sym: 'Tl', name_de: 'Thallium',        name_en: 'Thallium',      mass: 204.38,  period: 6, group: 13, cat: 'posttransition', state: 's', eneg: 1.62, mp: 304.0,   bp: 1473.0,  density: 11.85,    year: 1861, disc: 'Crookes' },
  { z: 82, sym: 'Pb', name_de: 'Blei',            name_en: 'Lead',          mass: 207.2,   period: 6, group: 14, cat: 'posttransition', state: 's', eneg: 1.87, mp: 327.46,  bp: 1749.0,  density: 11.342,   year: null, disc: '—' },
  { z: 83, sym: 'Bi', name_de: 'Bismut',          name_en: 'Bismuth',       mass: 208.98,  period: 6, group: 15, cat: 'posttransition', state: 's', eneg: 2.02, mp: 271.40,  bp: 1564.0,  density: 9.807,    year: 1753, disc: 'Geoffroy' },
  { z: 84, sym: 'Po', name_de: 'Polonium',        name_en: 'Polonium',      mass: 209,     period: 6, group: 16, cat: 'metalloid',      state: 's', eneg: 2.0,  mp: 254.0,   bp: 962.0,   density: 9.32,     year: 1898, disc: 'Curie' },
  { z: 85, sym: 'At', name_de: 'Astat',           name_en: 'Astatine',      mass: 210,     period: 6, group: 17, cat: 'halogen',        state: 's', eneg: 2.2,  mp: 302.0,   bp: 337.0,   density: null,     year: 1940, disc: 'Corson, MacKenzie, Segrè' },
  { z: 86, sym: 'Rn', name_de: 'Radon',           name_en: 'Radon',         mass: 222,     period: 6, group: 18, cat: 'noble',          state: 'g', eneg: 2.2,  mp: -71.15,  bp: -61.85,  density: 0.00973,   year: 1900, disc: 'Dorn' },
  // Periode 7
  { z: 87, sym: 'Fr', name_de: 'Francium',        name_en: 'Francium',      mass: 223,     period: 7, group: 1,  cat: 'alkali',         state: 's', eneg: 0.7,  mp: 27.0,    bp: 677.0,   density: 1.87,     year: 1939, disc: 'Perey' },
  { z: 88, sym: 'Ra', name_de: 'Radium',          name_en: 'Radium',        mass: 226,     period: 7, group: 2,  cat: 'alkaline',       state: 's', eneg: 0.9,  mp: 700.0,   bp: 1737.0,  density: 5.5,      year: 1898, disc: 'Curie' },
  { z: 89, sym: 'Ac', name_de: 'Actinium',        name_en: 'Actinium',      mass: 227,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.1,  mp: 1050.0,  bp: 3200.0,  density: 10.07,    year: 1899, disc: 'Debierne' },
  { z: 90, sym: 'Th', name_de: 'Thorium',         name_en: 'Thorium',       mass: 232.04,  period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 1750.0,  bp: 4788.0,  density: 11.72,    year: 1828, disc: 'Berzelius' },
  { z: 91, sym: 'Pa', name_de: 'Protactinium',    name_en: 'Protactinium',  mass: 231.04,  period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.5,  mp: 1572.0,  bp: 4027.0,  density: 15.37,    year: 1913, disc: 'Fajans, Göhring' },
  { z: 92, sym: 'U',  name_de: 'Uran',            name_en: 'Uranium',       mass: 238.03,  period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.38, mp: 1135.0,  bp: 4131.0,  density: 18.95,    year: 1789, disc: 'Klaproth' },
  { z: 93, sym: 'Np', name_de: 'Neptunium',       name_en: 'Neptunium',     mass: 237,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.36, mp: 644.0,   bp: 4000.0,  density: 20.45,    year: 1940, disc: 'McMillan, Abelson' },
  { z: 94, sym: 'Pu', name_de: 'Plutonium',       name_en: 'Plutonium',     mass: 244,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.28, mp: 640.0,   bp: 3228.0,  density: 19.84,    year: 1940, disc: 'Seaborg et al.' },
  { z: 95, sym: 'Am', name_de: 'Americium',       name_en: 'Americium',     mass: 243,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 1176.0,  bp: 2011.0,  density: 13.69,    year: 1944, disc: 'Seaborg et al.' },
  { z: 96, sym: 'Cm', name_de: 'Curium',          name_en: 'Curium',        mass: 247,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 1340.0,  bp: 3110.0,  density: 13.51,    year: 1944, disc: 'Seaborg et al.' },
  { z: 97, sym: 'Bk', name_de: 'Berkelium',       name_en: 'Berkelium',     mass: 247,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 986.0,   bp: 2627.0,  density: 14.78,    year: 1949, disc: 'Thompson et al.' },
  { z: 98, sym: 'Cf', name_de: 'Californium',     name_en: 'Californium',   mass: 251,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 900.0,   bp: 1470.0,  density: 15.1,     year: 1950, disc: 'Thompson et al.' },
  { z: 99, sym: 'Es', name_de: 'Einsteinium',     name_en: 'Einsteinium',   mass: 252,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 860.0,   bp: 996.0,   density: 8.84,     year: 1952, disc: 'Berkeley/Argonne/LANL' },
  { z: 100,sym: 'Fm', name_de: 'Fermium',         name_en: 'Fermium',       mass: 257,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 1527.0,  bp: null,    density: null,     year: 1952, disc: 'Berkeley/Argonne/LANL' },
  { z: 101,sym: 'Md', name_de: 'Mendelevium',     name_en: 'Mendelevium',   mass: 258,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 827.0,   bp: null,    density: null,     year: 1955, disc: 'Berkeley' },
  { z: 102,sym: 'No', name_de: 'Nobelium',        name_en: 'Nobelium',      mass: 259,     period: 7, group: -1, cat: 'actinide',       state: 's', eneg: 1.3,  mp: 827.0,   bp: null,    density: null,     year: 1958, disc: 'Berkeley' },
  { z: 103,sym: 'Lr', name_de: 'Lawrencium',      name_en: 'Lawrencium',    mass: 266,     period: 7, group: 3,  cat: 'actinide',       state: 's', eneg: 1.3,  mp: 1627.0,  bp: null,    density: null,     year: 1961, disc: 'Berkeley' },
  { z: 104,sym: 'Rf', name_de: 'Rutherfordium',   name_en: 'Rutherfordium', mass: 267,     period: 7, group: 4,  cat: 'transition',     state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1964, disc: 'Dubna/Berkeley' },
  { z: 105,sym: 'Db', name_de: 'Dubnium',         name_en: 'Dubnium',       mass: 268,     period: 7, group: 5,  cat: 'transition',     state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1967, disc: 'Dubna/Berkeley' },
  { z: 106,sym: 'Sg', name_de: 'Seaborgium',      name_en: 'Seaborgium',    mass: 269,     period: 7, group: 6,  cat: 'transition',     state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1974, disc: 'Berkeley/Dubna' },
  { z: 107,sym: 'Bh', name_de: 'Bohrium',         name_en: 'Bohrium',       mass: 270,     period: 7, group: 7,  cat: 'transition',     state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1981, disc: 'GSI Darmstadt' },
  { z: 108,sym: 'Hs', name_de: 'Hassium',         name_en: 'Hassium',       mass: 269,     period: 7, group: 8,  cat: 'transition',     state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1984, disc: 'GSI Darmstadt' },
  { z: 109,sym: 'Mt', name_de: 'Meitnerium',      name_en: 'Meitnerium',    mass: 278,     period: 7, group: 9,  cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1982, disc: 'GSI Darmstadt' },
  { z: 110,sym: 'Ds', name_de: 'Darmstadtium',    name_en: 'Darmstadtium',  mass: 281,     period: 7, group: 10, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1994, disc: 'GSI Darmstadt' },
  { z: 111,sym: 'Rg', name_de: 'Roentgenium',     name_en: 'Roentgenium',   mass: 282,     period: 7, group: 11, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1994, disc: 'GSI Darmstadt' },
  { z: 112,sym: 'Cn', name_de: 'Copernicium',     name_en: 'Copernicium',   mass: 285,     period: 7, group: 12, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1996, disc: 'GSI Darmstadt' },
  { z: 113,sym: 'Nh', name_de: 'Nihonium',        name_en: 'Nihonium',      mass: 286,     period: 7, group: 13, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 2004, disc: 'RIKEN' },
  { z: 114,sym: 'Fl', name_de: 'Flerovium',       name_en: 'Flerovium',     mass: 289,     period: 7, group: 14, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 1998, disc: 'Dubna' },
  { z: 115,sym: 'Mc', name_de: 'Moscovium',       name_en: 'Moscovium',     mass: 290,     period: 7, group: 15, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 2003, disc: 'Dubna/LLNL' },
  { z: 116,sym: 'Lv', name_de: 'Livermorium',     name_en: 'Livermorium',   mass: 293,     period: 7, group: 16, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 2000, disc: 'Dubna/LLNL' },
  { z: 117,sym: 'Ts', name_de: 'Tenness',         name_en: 'Tennessine',    mass: 294,     period: 7, group: 17, cat: 'unknown',        state: 's', eneg: null, mp: null,    bp: null,    density: null,     year: 2010, disc: 'Dubna/Oak Ridge' },
  { z: 118,sym: 'Og', name_de: 'Oganesson',       name_en: 'Oganesson',     mass: 294,     period: 7, group: 18, cat: 'noble',          state: 'g', eneg: null, mp: null,    bp: null,    density: null,     year: 2002, disc: 'Dubna/LLNL' },
];

// Element-Lookup nach Symbol
const PT_BY_SYMBOL = PERIODIC_TABLE.reduce((acc, el) => { acc[el.sym] = el; return acc; }, {});

const PLANT_RELEVANT_SET = new Set(['C','H','O','N','P','K','Ca','Mg','S','Fe','Mn','Zn','Cu','B','Mo','Cl','Ni','Co','Si','Se','Na']);

const PT_CELL_OVERRIDES = {
  C: { bg: '#2e2e2e', textColor: '#000000' },
};

const LATIN_NAMES = {
  H: 'Hydrogenium', He: 'Helium', Li: 'Lithium', Be: 'Beryllium',
  B: 'Borum', C: 'Carboneum', N: 'Nitrogenium', O: 'Oxygenium',
  F: 'Fluorum', Ne: 'Neon', Na: 'Natrium', Mg: 'Magnesium',
  Al: 'Aluminium', Si: 'Silicium', P: 'Phosphorus', S: 'Sulfur',
  Cl: 'Chlorum', Ar: 'Argon', K: 'Kalium', Ca: 'Calcium',
  Sc: 'Scandium', Ti: 'Titanium', V: 'Vanadium', Cr: 'Chromium',
  Mn: 'Manganum', Fe: 'Ferrum', Co: 'Cobaltum', Ni: 'Niccolum',
  Cu: 'Cuprum', Zn: 'Zincum', Ga: 'Gallium', Ge: 'Germanium',
  As: 'Arsenicum', Se: 'Selenium', Br: 'Bromum', Kr: 'Krypton',
  Rb: 'Rubidium', Sr: 'Strontium', Y: 'Yttrium', Zr: 'Zirconium',
  Nb: 'Niobium', Mo: 'Molybdaenum', Tc: 'Technetium', Ru: 'Ruthenium',
  Rh: 'Rhodium', Pd: 'Palladium', Ag: 'Argentum', Cd: 'Cadmium',
  In: 'Indium', Sn: 'Stannum', Sb: 'Stibium', Te: 'Tellurium',
  I: 'Iodum', Xe: 'Xenon', Cs: 'Caesium', Ba: 'Barium',
  W: 'Wolframium', Re: 'Rhenium', Os: 'Osmium', Ir: 'Iridium',
  Pt: 'Platinum', Au: 'Aurum', Hg: 'Hydrargyrum', Tl: 'Thallium',
  Pb: 'Plumbum', Bi: 'Bismuthum', Po: 'Polonium',
  Ra: 'Radium', Ac: 'Actinium', Th: 'Thorium', U: 'Uranium',
};

// Mapping: welche Element-Symbole sind in unserer Nährstoff-Element-Liste?
// Plus: Stickstoff "N" wird auf N-NO3 gemappt für die Farbe
const PT_NUTRIENT_COLOR_KEY = (sym) => {
  if (sym === 'N') return 'N-NO3';
  if (['P','K','Mg','Ca','S','Fe','Mn','Zn','Cu','Ni','Co','B','Mo','Cl','Si','Na'].includes(sym)) return sym;
  return null;
};

// ============================================================
// PERIODENSYSTEM-ANSICHT
// ============================================================
function PeriodicTableView({ ctx, onBack }) {
  const { t, isDark, elementColorsOn, elementColors } = ctx;
  const [selected, setSelected] = useState(null);

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  // Erstelle Layout-Grid: 7 Perioden × 18 Spalten + 2 Reihen Lanthanide/Actinide
  const main = PERIODIC_TABLE.filter(el => el.group >= 1 && el.group <= 18);
  const lanth = PERIODIC_TABLE.filter(el => el.cat === 'lanthanide' && el.group === 0);
  const actin = PERIODIC_TABLE.filter(el => el.cat === 'actinide' && el.group === -1);

  const getElColor = (el) => {
    if (elementColorsOn) {
      const key = PT_NUTRIENT_COLOR_KEY(el.sym);
      if (key) return elementColors[key];
    }
    return PT_CATEGORIES[el.cat]?.color || '#525252';
  };

  const cellSize = 36; // px
  const gap = 2;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h2 className="text-base font-semibold">{t.knowledge.periodic}</h2>
        <p className="text-xs opacity-60 mt-1">
          {ctx.lang === 'de'
            ? 'Tippe auf ein Element für Details. Horizontal scrollen, um alle Spalten zu sehen.'
            : 'Tap on an element for details. Scroll horizontally to see all columns.'}
        </p>
      </section>

      {/* Tabelle - horizontal scrollbar */}
      <section className={`rounded-xl border ${cardClass} p-3 overflow-x-auto`}>
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(18, ${cellSize}px)`,
            gridTemplateRows: `repeat(7, ${cellSize}px) ${cellSize / 2}px repeat(2, ${cellSize}px)`,
            gap: `${gap}px`,
            width: `${18 * cellSize + 17 * gap}px`,
          }}
        >
          {/* Haupt-Elemente */}
          {main.map(el => {
            const color = getElColor(el);
            const relevant = PLANT_RELEVANT_SET.has(el.sym);
            const ov = PT_CELL_OVERRIDES[el.sym];
            return (
              <button
                key={el.z}
                onClick={() => setSelected(el)}
                style={{
                  gridColumn: el.group,
                  gridRow: el.period,
                  background: ov ? ov.bg : color,
                  opacity: relevant ? 0.9 : 0.45,
                  color: ov ? ov.textColor : undefined,
                }}
                className={`rounded-md flex flex-col items-center justify-center transition-transform hover:scale-110 hover:z-10 ${ov ? '' : 'text-white'}`}
              >
                <span className="text-[8px] leading-none opacity-80">{el.z}</span>
                <span className="text-sm font-bold leading-none">{el.sym}</span>
              </button>
            );
          })}

          {/* Lanthanide-Marker bei Periode 6, Gruppe 3 */}
          <div
            style={{
              gridColumn: 3,
              gridRow: 6,
              background: PT_CATEGORIES.lanthanide.color,
              opacity: 0.4,
            }}
            className="rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          >
            57-71
          </div>
          {/* Actinide-Marker bei Periode 7, Gruppe 3 */}
          <div
            style={{
              gridColumn: 3,
              gridRow: 7,
              background: PT_CATEGORIES.actinide.color,
              opacity: 0.4,
            }}
            className="rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          >
            89-103
          </div>

          {/* Lanthanide-Reihe (Reihe 9) */}
          {lanth.map((el, idx) => {
            const color = getElColor(el);
            return (
              <button
                key={el.z}
                onClick={() => setSelected(el)}
                style={{
                  gridColumn: idx + 3,
                  gridRow: 9,
                  background: color,
                  opacity: 0.45,
                }}
                className="rounded-md flex flex-col items-center justify-center text-white transition-transform hover:scale-110 hover:z-10"
              >
                <span className="text-[8px] leading-none opacity-80">{el.z}</span>
                <span className="text-sm font-bold leading-none">{el.sym}</span>
              </button>
            );
          })}
          {/* Actinide-Reihe (Reihe 10) */}
          {actin.map((el, idx) => {
            const color = getElColor(el);
            return (
              <button
                key={el.z}
                onClick={() => setSelected(el)}
                style={{
                  gridColumn: idx + 3,
                  gridRow: 10,
                  background: color,
                  opacity: 0.45,
                }}
                className="rounded-md flex flex-col items-center justify-center text-white transition-transform hover:scale-110 hover:z-10"
              >
                <span className="text-[8px] leading-none opacity-80">{el.z}</span>
                <span className="text-sm font-bold leading-none">{el.sym}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Legende */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3">{ctx.lang === 'de' ? 'Legende' : 'Legend'}</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {Object.entries(PT_CATEGORIES).filter(([k]) => k !== 'unknown').map(([key, cat]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ background: cat.color, opacity: 0.9 }}
              />
              <span>{ctx.lang === 'de' ? cat.de : cat.en}</span>
            </div>
          ))}
        </div>
        {elementColorsOn && (
          <p className="text-[10px] opacity-50 mt-3 italic">
            {ctx.lang === 'de'
              ? 'Nährstoff-relevante Elemente werden in deinen Element-Farben angezeigt.'
              : 'Nutrient-relevant elements are shown in your element colors.'}
          </p>
        )}
      </section>

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: IUPAC 2021, WebElements
      </div>

      {/* Element-Detail-Modal */}
      {selected && (
        <ElementDetailModal
          ctx={ctx}
          element={selected}
          color={getElColor(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// PFLANZLICHE FUNKTION: Lookup nach Element-Symbol
// Quellen: Marschner 2012; Taiz & Zeiger 2015; Epstein & Bloom 2005
// ============================================================
const PLANT_INFO = {
  C: {
    de: 'Kohlenstoff ist das strukturelle Grundelement aller organischen Verbindungen in der Pflanze — Kohlenhydrate, Aminosäuren, Lipide, Nukleinsäuren. Wird über CO₂ aus der Luft durch Photosynthese fixiert.',
    en: 'Carbon is the structural backbone of all organic compounds in the plant — carbohydrates, amino acids, lipids, nucleic acids. Fixed from atmospheric CO₂ via photosynthesis.',
  },
  H: {
    de: 'Wasserstoff ist Bestandteil aller organischen Moleküle und wird für die Protonierung von Enzymen und Membrantransporter benötigt. Der pH-Gradient über die Membran (Protonenpumpe) ist zentral für den Nährstofftransport.',
    en: 'Hydrogen is part of all organic molecules and essential for protonation of enzymes and membrane transporters. The proton gradient across membranes (proton pump) drives nutrient transport.',
  },
  O: {
    de: 'Sauerstoff ist Bestandteil der meisten organischen Verbindungen und Elektronenakzeptor in der Zellatmung. Als Oxidationsmittel treibt er den ATP-Metabolismus an.',
    en: 'Oxygen is part of most organic compounds and the terminal electron acceptor in cellular respiration. As an oxidant it drives ATP metabolism.',
  },
  N: {
    de: 'Stickstoff ist Baustein von Aminosäuren, Proteinen, Chlorophyll und Nukleinsäuren (DNA/RNA). Wird als NO₃⁻ (Nitrat) oder NH₄⁺ (Ammonium) aufgenommen. Mangel äußert sich als Chlorose älterer Blätter (da N mobil ist).',
    en: 'Nitrogen is a building block of amino acids, proteins, chlorophyll and nucleic acids (DNA/RNA). Taken up as NO₃⁻ (nitrate) or NH₄⁺ (ammonium). Deficiency shows as chlorosis of older leaves (N is mobile).',
  },
  P: {
    de: 'Phosphor ist zentraler Bestandteil von ATP (Energiespeicher), Phospholipiden (Zellmembran), DNA und RNA. Essentiell für Energiestoffwechsel, Zellteilung und Wurzelentwicklung.',
    en: 'Phosphorus is central to ATP (energy storage), phospholipids (cell membranes), DNA and RNA. Essential for energy metabolism, cell division and root development.',
  },
  K: {
    de: 'Kalium reguliert die Osmose und den Wasserhaushalt, öffnet und schließt die Stomata und aktiviert über 60 Enzyme. Fehlt K, kollabieren die Stomata nicht mehr korrekt — Welke und erhöhter Wasserverlust sind die Folge.',
    en: 'Potassium regulates osmosis and water balance, opens and closes stomata, and activates over 60 enzymes. Without K, stomata fail to close correctly — wilting and increased water loss result.',
  },
  Ca: {
    de: 'Calcium stärkt Zellwände (als Calciumpektat), steuert die Zellteilung als Signalmolekül und ist im Calmodulin-System ein zentraler Botenstoff. Immobil in der Pflanze — Mangel zeigt sich zuerst an Jungtrieben und Früchten (Blütenendfäule bei Tomaten).',
    en: 'Calcium strengthens cell walls (as calcium pectate), controls cell division as a signaling molecule and is a key messenger in the calmodulin system. Immobile in the plant — deficiency appears first in young shoots and fruits (blossom end rot in tomatoes).',
  },
  Mg: {
    de: 'Magnesium ist das Zentralatom des Chlorophyll-Moleküls — die Pflanzenwelt baut auf Mg, wie die Tierwelt auf Eisen. Chlorophyll und Hämoglobin besitzen nahezu identische Ringstrukturen (Porphyrinringe); einziger Unterschied ist das Zentralatom: Mg (Chlorophyll) vs. Fe (Häm). Mg aktiviert außerdem die ATP-Synthase, über 300 Enzymreaktionen und ist mobil in der Pflanze.',
    en: 'Magnesium is the central atom of the chlorophyll molecule — the plant world builds on Mg as the animal world builds on iron. Chlorophyll and haemoglobin share nearly identical ring structures (porphyrin rings); the only difference is the central atom: Mg (chlorophyll) vs. Fe (haem). Mg also activates ATP synthase, over 300 enzyme reactions, and is mobile in the plant.',
  },
  S: {
    de: 'Schwefel ist Baustein der Aminosäuren Cystein und Methionin sowie von Coenzym A, Glutathion (Entgiftung) und Glucosinolaten (Abwehrstoffe). Beteiligt an der Fe-S-Cluster-Bildung für die Elektronenübertragungskette.',
    en: 'Sulfur is a building block of amino acids cysteine and methionine, coenzyme A, glutathione (detoxification) and glucosinolates (defence compounds). Involved in Fe-S cluster formation for the electron transport chain.',
  },
  Fe: {
    de: 'Eisen ist Zentralatom des Häm-Porphyrins (Cytochrome, Hämproteine) und ist essentiell für die Photosynthese-Elektronenkette sowie die Chlorophyllsynthese. Immobil bei hohem pH — Mangel zeigt sich als intervenöse Chlorose der Jungtriebe.',
    en: 'Iron is the central atom of haem porphyrin (cytochromes, haemoproteins) and essential for the photosynthetic electron chain and chlorophyll synthesis. Immobile at high pH — deficiency shows as interveinal chlorosis of young shoots.',
  },
  Mn: {
    de: 'Mangan ist Cofaktor des Mn-Clusters im Photosystem II (Wasserspaltung: 4 Mn-Atome pro Komplex) und aktiviert viele Enzyme im Zitratzyklus. Mangel äußert sich als intervenöse Chlorose bei mittlerem pH.',
    en: 'Manganese is the cofactor of the Mn cluster in photosystem II (water splitting: 4 Mn atoms per complex) and activates many enzymes in the citric acid cycle. Deficiency shows as interveinal chlorosis at mid-range pH.',
  },
  Zn: {
    de: 'Zink ist Cofaktor von über 300 Enzymen (Zink-Finger-Proteinen), beteiligt an Auxin-Biosynthese (Wuchsstoff) und Membranintegrität. Mangel verursacht Stauchung der Internodien und kleine Blätter.',
    en: 'Zinc is a cofactor of over 300 enzymes (zinc-finger proteins), involved in auxin biosynthesis (growth hormone) and membrane integrity. Deficiency causes stunted internodes and small leaves.',
  },
  Cu: {
    de: 'Kupfer ist Zentralatom der Plastocyanin-Proteine (Elektronenübertragung im Photosystem I) und der Kupfer-Zink-Superoxiddismutase (Schutz vor oxidativem Stress). Mangel zeigt sich in Blüten- und Fruchtentwicklungsstörungen.',
    en: 'Copper is the central atom of plastocyanin proteins (electron transfer in photosystem I) and copper-zinc superoxide dismutase (protection from oxidative stress). Deficiency shows in flowering and fruit development disorders.',
  },
  B: {
    de: 'Bor stabilisiert die Zellwand durch Quervernetzung von Rhamnogalacturonan-II-Polysacchariden und ist essentiell für Pollenschlauch-Wachstum und Zuckerexport aus den Blättern. Mangel zeigt sich an Wachstumspunkten (Triebspitzen sterben ab).',
    en: 'Boron stabilises the cell wall by cross-linking rhamnogalacturonan-II polysaccharides and is essential for pollen tube growth and sugar export from leaves. Deficiency shows at growing points (shoot tips die back).',
  },
  Mo: {
    de: 'Molybdän ist Cofaktor der Nitratreduktase (NO₃⁻ → NH₄⁺) und der Nitrogenase (N₂-Fixierung bei Leguminosen). Höchster Bedarf aller Mikronährstoffe in Relation zu anderen Nährstoffen minimal — Mangel selten, aber zeigt sich bei sehr niedrigem pH.',
    en: 'Molybdenum is the cofactor of nitrate reductase (NO₃⁻ → NH₄⁺) and nitrogenase (N₂ fixation in legumes). Highest demand relative to all micronutrients is minimal — deficiency rare, but appears at very low pH.',
  },
  Cl: {
    de: 'Chlor ist am Photosystem II (Wasseroxidation) beteiligt und reguliert den osmotischen Druck in den Vakuolen. Wird häufig unterschätzt — Mangel ist selten, da Chlor weit verbreitet.',
    en: 'Chlorine is involved in photosystem II (water oxidation) and regulates osmotic pressure in vacuoles. Often underestimated — deficiency is rare as chlorine is widely distributed.',
  },
  Ni: {
    de: 'Nickel ist Cofaktor der Urease (Harnstoffabbau → NH₃) und essentiell für den Stickstoffwechsel. Mangel äußert sich in Harnstoffanreicherung und Chlorose der Blattspitzen.',
    en: 'Nickel is the cofactor of urease (urea breakdown → NH₃) and essential for nitrogen metabolism. Deficiency causes urea accumulation and chlorosis of leaf tips.',
  },
  Co: {
    de: 'Kobalt ist für die Leghämoglobin-Synthese in Wurzelknöllchen und damit für die biologische Stickstoff-Fixierung essentiell. Bei konventionellen Kulturpflanzen (ohne Symbiose) sehr gering benötigt.',
    en: 'Cobalt is essential for leghemoglobin synthesis in root nodules and thereby for biological nitrogen fixation. Required in very small amounts in conventional crop plants (without symbiosis).',
  },
  Si: {
    de: 'Silicium (als Si(OH)₄) wird in Zellwände von Epidermiszellen eingelagert und erhöht die mechanische Festigkeit (Abwehr von Pathogenen, Insekten). Stärkt die Stresstoleranz gegen Trockenheit, Salz und Schwermetalle.',
    en: 'Silicon (as Si(OH)₄) is deposited in epidermal cell walls, increasing mechanical strength (defence against pathogens, insects). Enhances stress tolerance against drought, salt and heavy metals.',
  },
  Se: {
    de: 'Selen wird in der Pflanze als Selenocystein in Selenoproteine eingebaut. Kein universell anerkannter Essentialitätsnachweis für höhere Pflanzen, jedoch ist Se für viele Tiere und Menschen essenziell.',
    en: 'Selenium is incorporated into selenoproteins as selenocysteine in the plant. No universally accepted proof of essentiality for higher plants, but Se is essential for many animals and humans.',
  },
  Na: {
    de: 'Natrium ist bei C₄-Pflanzen (Mais, Zuckerrohr) essenziell für den Photosyntheseweg. Bei C₃-Pflanzen kann Na teilweise Kalium ersetzen, gilt aber als Kontaminant bei höheren Konzentrationen.',
    en: 'Sodium is essential in C₄ plants (maize, sugar cane) for the photosynthetic pathway. In C₃ plants Na can partially substitute potassium, but is considered a contaminant at higher concentrations.',
  },
};

// ============================================================
// ELEMENT-DETAIL-MODAL
// ============================================================
function ElementDetailModal({ ctx, element, color, onClose }) {
  const { t, isDark, lang } = ctx;
  const cardBg = isDark ? 'bg-neutral-800' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-700' : 'border-neutral-200';

  const stateLabel = (s) => {
    if (s === 's') return lang === 'de' ? 'fest' : 'solid';
    if (s === 'l') return lang === 'de' ? 'flüssig' : 'liquid';
    if (s === 'g') return lang === 'de' ? 'gasförmig' : 'gas';
    return '—';
  };

  const fmt = (v, suffix = '') => v === null || v === undefined ? '—' : `${v}${suffix}`;
  const fmtMp = (v) => v === null ? '—' : `${v} °C`;
  const fmtDensity = (v) => v === null ? '—' : (v < 0.01 ? `${(v * 1000).toFixed(4)} g/L` : `${v} g/cm³`);

  const cat = PT_CATEGORIES[element.cat];
  const catLabel = cat ? (lang === 'de' ? cat.de : cat.en) : '—';

  const L = {
    atomicNumber: lang === 'de' ? 'Ordnungszahl' : 'Atomic number',
    atomicMass: lang === 'de' ? 'Atommasse' : 'Atomic mass',
    category: lang === 'de' ? 'Kategorie' : 'Category',
    period: lang === 'de' ? 'Periode' : 'Period',
    group: lang === 'de' ? 'Gruppe' : 'Group',
    state: lang === 'de' ? 'Aggregatzustand' : 'State at 20 °C',
    eneg: lang === 'de' ? 'Elektronegativität (Pauling)' : 'Electronegativity (Pauling)',
    mp: lang === 'de' ? 'Schmelzpunkt' : 'Melting point',
    bp: lang === 'de' ? 'Siedepunkt' : 'Boiling point',
    density: lang === 'de' ? 'Dichte' : 'Density',
    discovery: lang === 'de' ? 'Entdeckung' : 'Discovery',
  };

  const rows = [
    { label: L.atomicNumber, value: element.z },
    { label: L.atomicMass, value: `${element.mass} u` },
    { label: L.category, value: catLabel },
    { label: L.period, value: element.period },
    { label: L.group, value: element.group > 0 ? element.group : '—' },
    { label: L.state, value: stateLabel(element.state) },
    { label: L.eneg, value: fmt(element.eneg) },
    { label: L.mp, value: fmtMp(element.mp) },
    { label: L.bp, value: fmtMp(element.bp) },
    { label: L.density, value: fmtDensity(element.density) },
    { label: L.discovery, value: element.year ? `${element.year} — ${element.disc}` : (lang === 'de' ? 'seit Antike bekannt' : 'known since antiquity') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className={`${cardBg} border ${borderColor} rounded-2xl max-w-sm w-full overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header mit Farbblock */}
        <div className="p-5" style={{ background: color }}>
          <div className="flex items-baseline justify-between text-white">
            <div>
              <div className="text-xs opacity-80">{element.z}</div>
              <div className="text-4xl font-bold leading-none">{element.sym}</div>
            </div>
            <button onClick={onClose} className="opacity-80 hover:opacity-100">
              <X size={20} />
            </button>
          </div>
          <div className="text-lg font-medium text-white mt-2">
            {lang === 'de' ? element.name_de : element.name_en}
          </div>
          {LATIN_NAMES[element.sym] && (
            <div className="text-xs text-white/60 mt-0.5 italic">
              {LATIN_NAMES[element.sym]}
            </div>
          )}
        </div>

        {/* Daten-Tabelle */}
        <div className="p-4 space-y-1.5 text-sm">
          {rows.map((r, i) => (
            <div key={i} className={`flex items-baseline justify-between gap-3 py-1 ${i < rows.length - 1 ? (isDark ? 'border-b border-neutral-700/50' : 'border-b border-neutral-100') : ''}`}>
              <span className="opacity-60 text-xs">{r.label}</span>
              <span className="font-medium text-right tabular-nums">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Pflanzliche Funktion */}
        {PLANT_INFO[element.sym] && (
          <div className={`mx-4 mb-4 p-3 rounded-xl text-xs leading-relaxed ${isDark ? 'bg-neutral-700/40' : 'bg-neutral-50'}`}>
            <div className="font-semibold mb-1 opacity-80">
              {lang === 'de' ? 'Funktion in der Pflanze' : 'Role in the plant'}
            </div>
            <div className="opacity-80">{PLANT_INFO[element.sym][lang]}</div>
            <div className="text-[9px] opacity-40 mt-2 italic">
              {lang === 'de' ? 'Quellen: Marschner 2012; Taiz & Zeiger 2015' : 'Sources: Marschner 2012; Taiz & Zeiger 2015'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SALZ-KOMPATIBILITÄTS-ANSICHT
// ============================================================
function CompatibilityView({ ctx, salts, onBack }) {
  const { t, isDark, lang } = ctx;
  const [selected, setSelected] = useState(null); // { a, b, result }

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  // Nur aktive Makro-Salze (Salze ohne Mikronährstoffe), alphabetisch sortiert.
  // Mikro-Elemente (Fe, Mn, Zn, Cu, Ni, Co, B, Mo) werden ausgeschlossen.
  const MICRO_ELEMENTS = ['Fe', 'Mn', 'Zn', 'Cu', 'Ni', 'Co', 'B', 'Mo'];
  const activeSalts = useMemo(
    () => salts
      .filter(s => s.active)
      .filter(s => !MICRO_ELEMENTS.some(el => (s.composition[el] || 0) > 0.5))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [salts]
  );

  // Farben für die drei Stufen
  const levelColor = {
    ok:      { bg: '#22c55e', icon: <Check size={14} className="text-white" strokeWidth={3} />,
               labelDe: 'kompatibel', labelEn: 'compatible' },
    limited: { bg: '#f59e0b', icon: <AlertTriangle size={12} className="text-white" strokeWidth={3} />,
               labelDe: 'eingeschränkt', labelEn: 'limited' },
    bad:     { bg: '#ef4444', icon: <X size={14} className="text-white" strokeWidth={3} />,
               labelDe: 'inkompatibel', labelEn: 'incompatible' },
  };

  const cellSize = 32; // px
  const gap = 2;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h2 className="text-base font-semibold">{t.knowledge.compat}</h2>
        <p className="text-xs opacity-60 mt-1">
          {lang === 'de'
            ? 'Tippe auf eine Zelle, um die Erklärung zu sehen.'
            : 'Tap a cell to see the explanation.'}
        </p>
      </section>

      {/* Legende */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3">{lang === 'de' ? 'Legende' : 'Legend'}</h3>
        <div className="space-y-1.5">
          {(['ok', 'limited', 'bad']).map(lvl => {
            const c = levelColor[lvl];
            return (
              <div key={lvl} className="flex items-center gap-2 text-xs">
                <span
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: c.bg }}
                >
                  {c.icon}
                </span>
                <span>{lang === 'de' ? c.labelDe : c.labelEn}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Matrix */}
      {activeSalts.length < 2 ? (
        <section className={`rounded-xl border ${cardClass} p-6 text-center`}>
          <p className="text-sm opacity-60">
            {lang === 'de'
              ? 'Mindestens zwei aktive Salze in der Datenbank nötig.'
              : 'At least two active salts in the database are required.'}
          </p>
        </section>
      ) : (
        <section className={`rounded-xl border ${cardClass} p-3 overflow-x-auto`}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `auto repeat(${activeSalts.length}, ${cellSize}px)`,
              gap: `${gap}px`,
              alignItems: 'center',
            }}
          >
            {/* Leere Ecke oben links */}
            <div />
            {/* Header-Zeile: vertikale Salznamen oben */}
            {activeSalts.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  height: '110px',
                  width: `${cellSize}px`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    transform: 'rotate(-65deg)',
                    transformOrigin: 'center',
                    whiteSpace: 'nowrap',
                    fontSize: '10px',
                    fontWeight: 500,
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '40px',
                  }}
                  title={s.name}
                >
                  {s.kuerzel || getShortName(s.formula, s.name)}
                </div>
              </div>
            ))}
            {/* Datenzeilen */}
            {activeSalts.map((rowSalt, rowIdx) => (
              <React.Fragment key={rowSalt.id}>
                {/* Erste Spalte: Kürzel */}
                <div
                  className="text-xs font-medium pr-2 text-right truncate"
                  style={{ maxWidth: '100px' }}
                  title={rowSalt.name}
                >
                  {rowSalt.kuerzel || getShortName(rowSalt.formula, rowSalt.name)}
                </div>
                {/* Zellen */}
                {activeSalts.map((colSalt, colIdx) => {
                  // Dreiecksmatrix: untere Hälfte. Diagonale = selbst
                  if (colIdx > rowIdx) {
                    return <div key={colSalt.id} style={{ width: cellSize, height: cellSize }} />;
                  }
                  const result = compatibilityLevel(rowSalt, colSalt);
                  const c = levelColor[result.level];
                  const isSelf = rowIdx === colIdx;
                  return (
                    <button
                      key={colSalt.id}
                      onClick={() => !isSelf && setSelected({ a: rowSalt, b: colSalt, result })}
                      disabled={isSelf}
                      className="rounded flex items-center justify-center transition-transform"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: isSelf ? (isDark ? '#404040' : '#d4d4d4') : c.bg,
                        opacity: isSelf ? 0.5 : 0.9,
                      }}
                    >
                      {!isSelf && c.icon}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: {lang === 'de'
          ? 'Sonneveld & Voogt 2009; FAO Drip Irrigation Management'
          : 'Sonneveld & Voogt 2009; FAO Drip Irrigation Management'}
      </div>

      {/* Detail-Modal */}
      {selected && (
        <CompatibilityDetailModal
          ctx={ctx}
          a={selected.a}
          b={selected.b}
          result={selected.result}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// KOMPATIBILITÄTS-DETAIL-MODAL
// ============================================================
function CompatibilityDetailModal({ ctx, a, b, result, onClose }) {
  const { isDark, lang } = ctx;
  const cardBg = isDark ? 'bg-neutral-800' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-700' : 'border-neutral-200';

  const levelInfo = {
    ok: {
      bg: '#22c55e',
      icon: <Check size={28} className="text-white" strokeWidth={3} />,
      titleDe: 'Kompatibel',
      titleEn: 'Compatible',
      descDe: 'Diese Salze können in derselben Lösung verwendet werden.',
      descEn: 'These salts can be used in the same solution.',
    },
    limited: {
      bg: '#f59e0b',
      icon: <AlertTriangle size={28} className="text-white" strokeWidth={3} />,
      titleDe: 'Eingeschränkt kompatibel',
      titleEn: 'Limited compatibility',
      descDe: 'Möglich, aber Vorsicht bei hohen Konzentrationen.',
      descEn: 'Possible, but caution at high concentrations.',
    },
    bad: {
      bg: '#ef4444',
      icon: <X size={28} className="text-white" strokeWidth={3} />,
      titleDe: 'Nicht kompatibel',
      titleEn: 'Not compatible',
      descDe: 'Diese Salze sollten nicht im selben Tank gemischt werden.',
      descEn: 'These salts should not be mixed in the same tank.',
    },
  };

  const info = levelInfo[result.level];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className={`${cardBg} border ${borderColor} rounded-2xl max-w-sm w-full overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status-Header */}
        <div className="p-5 flex items-center gap-4" style={{ background: info.bg }}>
          <div className="flex-shrink-0">{info.icon}</div>
          <div className="text-white">
            <div className="text-base font-semibold">
              {lang === 'de' ? info.titleDe : info.titleEn}
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {lang === 'de' ? info.descDe : info.descEn}
            </div>
          </div>
          <button onClick={onClose} className="ml-auto text-white opacity-80 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        {/* Beteiligte Salze */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'}`}>
              <div className="text-sm font-medium">
                <SaltName name={a.name} ctx={ctx} />
              </div>
              <div className="text-xs opacity-60 mt-0.5">
                <FormulaDisplay formula={a.formula} ctx={ctx} />
              </div>
            </div>
            <div className="text-center text-xs opacity-50">+</div>
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'}`}>
              <div className="text-sm font-medium">
                <SaltName name={b.name} ctx={ctx} />
              </div>
              <div className="text-xs opacity-60 mt-0.5">
                <FormulaDisplay formula={b.formula} ctx={ctx} />
              </div>
            </div>
          </div>

          {/* Begründung */}
          {result.reason && (
            <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'}`}>
              {lang === 'de' ? result.reason.de : result.reason.en}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VPD-TABELLE (Vapor Pressure Deficit)
// Berechnung: VPD = es(T) · (1 − RH/100)
// es(T) Magnus-Tetens-Formel: es = 0.6108 · exp(17.27·T / (T + 237.3))  in kPa
// Zonen-Definition: nach Bugbee/Utah State University Empfehlungen,
// gängige Hydroponik-Praxis-Literatur (Resh 2013, Bugbee 2004).
// ============================================================
function calcVpd(tempC, humidityPct) {
  const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return es * (1 - humidityPct / 100);
}

function vpdZone(vpd) {
  // 5 Zonen mit Farben (Hex)
  if (vpd < 0.4)  return { key: 'tooWet',  color: '#7c3aed', textColor: 'white' };
  if (vpd < 0.8)  return { key: 'clones',  color: '#3b82f6', textColor: 'white' };
  if (vpd < 1.2)  return { key: 'veg',     color: '#22c55e', textColor: 'white' };
  if (vpd < 1.6)  return { key: 'flower',  color: '#eab308', textColor: 'white' };
  return                  { key: 'tooDry', color: '#ef4444', textColor: 'white' };
}

function VpdView({ ctx, onBack }) {
  const { t, isDark, lang } = ctx;
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  // Achsen
  const temps = [];      // °C, Y-Achse
  for (let T = 16; T <= 34; T += 2) temps.push(T);
  const humidities = []; // %, X-Achse
  for (let RH = 30; RH <= 90; RH += 5) humidities.push(RH);

  const zoneLabels = {
    tooWet:  { de: 'Zu feucht',                  en: 'Too humid' },
    clones:  { de: 'Klone / Sämlinge',           en: 'Clones / seedlings' },
    veg:     { de: 'Vegetative Phase',           en: 'Vegetative stage' },
    flower:  { de: 'Generative / Blütephase',    en: 'Generative / flowering' },
    tooDry:  { de: 'Zu trocken',                 en: 'Too dry' },
  };
  const zoneRanges = {
    tooWet:  '< 0.4 kPa',
    clones:  '0.4 – 0.8 kPa',
    veg:     '0.8 – 1.2 kPa',
    flower:  '1.2 – 1.6 kPa',
    tooDry:  '> 1.6 kPa',
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4 space-y-2`}>
        <h2 className="text-base font-semibold">{t.knowledge.vpd}</h2>
        <p className="text-xs opacity-60">
          {lang === 'de'
            ? 'Vapor Pressure Deficit beschreibt den „Trockenheits-Druck" der Luft auf die Pflanze. Werte in kPa nach Magnus-Tetens-Formel.'
            : 'Vapor Pressure Deficit describes the "drying pressure" of air on the plant. Values in kPa using the Magnus-Tetens formula.'}
        </p>
      </section>

      {/* Tabelle */}
      <section className={`rounded-xl border ${cardClass} p-3 overflow-x-auto`}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto repeat(${humidities.length}, minmax(36px, 1fr))`,
            gap: '2px',
            minWidth: `${humidities.length * 40 + 50}px`,
          }}
        >
          {/* Ecke: Achsen-Beschriftung */}
          <div className="text-[10px] opacity-50 px-1 py-1 flex items-end justify-end text-right leading-tight">
            {lang === 'de' ? '°C \\ %' : '°C \\ %'}
          </div>
          {/* Header: Feuchte */}
          {humidities.map(rh => (
            <div key={rh} className="text-[10px] opacity-60 text-center font-medium py-1">
              {rh}
            </div>
          ))}
          {/* Datenzeilen */}
          {temps.slice().reverse().map(T => (
            <React.Fragment key={T}>
              <div className="text-[10px] opacity-60 font-medium pr-2 py-1 text-right flex items-center justify-end">
                {T}°
              </div>
              {humidities.map(rh => {
                const vpd = calcVpd(T, rh);
                const zone = vpdZone(vpd);
                return (
                  <div
                    key={rh}
                    className="rounded text-[10px] flex items-center justify-center font-medium tabular-nums"
                    style={{
                      background: zone.color,
                      color: zone.textColor,
                      opacity: 0.9,
                      minHeight: '28px',
                    }}
                  >
                    {vpd.toFixed(2)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] opacity-50 mt-3 text-center">
          {lang === 'de'
            ? 'Zeilen = Lufttemperatur (°C), Spalten = relative Luftfeuchte (%)'
            : 'Rows = air temperature (°C), columns = relative humidity (%)'}
        </p>
      </section>

      {/* Legende */}
      <section className={`rounded-xl border ${cardClass} p-4 space-y-2`}>
        <h3 className="text-sm font-semibold mb-2">{lang === 'de' ? 'Zonen' : 'Zones'}</h3>
        {['tooDry', 'flower', 'veg', 'clones', 'tooWet'].map(key => {
          const colors = { tooDry: '#ef4444', flower: '#eab308', veg: '#22c55e', clones: '#3b82f6', tooWet: '#7c3aed' };
          return (
            <div key={key} className="flex items-center gap-3 text-xs">
              <div
                className="w-8 h-8 rounded flex-shrink-0"
                style={{ background: colors[key], opacity: 0.9 }}
              />
              <div className="flex-1">
                <div className="font-medium">{zoneLabels[key][lang]}</div>
                <div className="opacity-60 tabular-nums">{zoneRanges[key]}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Hinweise */}
      <section className={`rounded-xl border ${cardClass} p-4 text-xs space-y-2 opacity-80`}>
        <p>
          <strong>{lang === 'de' ? 'Hinweis:' : 'Note:'}</strong>{' '}
          {lang === 'de'
            ? 'Die Werte gelten für die Lufttemperatur. Die tatsächliche Blatttemperatur ist meist 2–3 °C niedriger durch Transpiration. Profis rechnen den korrigierten "Leaf VPD" — als Faustregel: 2 °C von der Lufttemperatur abziehen, um Blatttemperatur zu schätzen.'
            : 'Values apply to air temperature. Actual leaf temperature is typically 2–3 °C lower due to transpiration. Pros calculate "Leaf VPD" — as a rule of thumb: subtract 2 °C from air temperature to estimate leaf temperature.'}
        </p>
      </section>

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: Magnus-Tetens (Tetens 1930); Zonen nach Bugbee 2004, Resh 2013
      </div>
    </div>
  );
}

// ============================================================
// FOLIAR CHEAT SHEET — Referenzseite, nicht interaktiv
// Salze + typische Dosierungsranges für Blattdüngung sowie Regeln zur
// Anwendung (Zeitpunkt, Luftfeuchte, Surfactant, pH/EC).
// Quellen: Marschner 2012 (Mineral Nutrition of Higher Plants);
// Fernandez et al. 2013 (Foliar Fertilization, IFA); Wójcik 2004;
// Gängige Hydro-/Indoor-Praxis.
// ============================================================
function FoliarCheatSheetView({ ctx, onBack }) {
  const { t, isDark, lang, accent } = ctx;
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';
  const subtle = isDark ? 'text-neutral-400' : 'text-neutral-600';

  // Salz-/Produkt-Liste mit typischen Dosierungs-Ranges für Blattspray.
  // Werte: untere/obere Grenze in g/L bzw. % m/V; jeweils Hinweise.
  const MACRO_SALTS = [
    { name: lang === 'de' ? 'Harnstoff' : 'Urea',           formula: 'CO(NH₂)₂',   element: 'N',     dose: '0.5 – 2 g/L',  note: lang === 'de' ? 'Schnelle N-Aufnahme; nicht mit Ca mischen (Biuret-Risiko bei niedriger Reinheit beachten).' : 'Fast N uptake; do not mix with Ca (watch biuret limits in low-purity sources).' },
    { name: lang === 'de' ? 'Kaliumnitrat' : 'Potassium Nitrate', formula: 'KNO₃', element: 'K + N', dose: '1 – 3 g/L',    note: lang === 'de' ? 'Universell; sehr gut verträglich. Standard für Blattdüngung.' : 'Universal; well tolerated. Standard foliar feed.' },
    { name: lang === 'de' ? 'Kaliumsulfat' : 'Potassium Sulfate', formula: 'K₂SO₄', element: 'K + S', dose: '1 – 3 g/L',    note: lang === 'de' ? 'K-Quelle ohne Nitrat; gut zum Ausbalancieren in der Blüte.' : 'K source without nitrate; useful in bloom phases.' },
    { name: lang === 'de' ? 'Magnesiumsulfat' : 'Magnesium Sulfate', formula: 'MgSO₄·7H₂O', element: 'Mg + S', dose: '5 – 20 g/L (0.5 – 2%)', note: lang === 'de' ? 'Klassiker bei Mg-Mangel; sehr gut blattverträglich.' : 'Classic Mg deficiency fix; very leaf-friendly.' },
    { name: lang === 'de' ? 'Calciumnitrat' : 'Calcium Nitrate', formula: 'Ca(NO₃)₂·4H₂O', element: 'Ca + N', dose: '2 – 10 g/L',    note: lang === 'de' ? 'Niemals mit Phosphat oder Sulfat im selben Spray (Fällung). Eigene Charge.' : 'Never mix with phosphate or sulfate in the same spray (precipitation). Spray separately.' },
    { name: 'MKP',                                              formula: 'KH₂PO₄',     element: 'P + K', dose: '0.5 – 2 g/L',   note: lang === 'de' ? 'Bewährter PK-Booster; nicht mit Ca-Salzen mischen.' : 'Proven PK booster; do not mix with Ca salts.' },
  ];

  const MICRO_SALTS = [
    { name: lang === 'de' ? 'Eisen-Chelat (Fe-EDTA / Fe-DTPA)' : 'Iron Chelate (Fe-EDTA / Fe-DTPA)', formula: 'Fe-EDTA', element: 'Fe', dose: '0.05 – 0.2 g/L', note: lang === 'de' ? 'Bei pH > 6 Fe-EDDHA bevorzugen. Sehr schnelle Wirkung bei Chlorose.' : 'For pH > 6 prefer Fe-EDDHA. Very fast effect on chlorosis.' },
    { name: lang === 'de' ? 'Mangansulfat' : 'Manganese Sulfate', formula: 'MnSO₄·H₂O', element: 'Mn', dose: '0.1 – 0.5 g/L', note: lang === 'de' ? 'Bei interveinaler Chlorose obere Blätter.' : 'For interveinal chlorosis on upper leaves.' },
    { name: lang === 'de' ? 'Zinksulfat' : 'Zinc Sulfate',        formula: 'ZnSO₄·7H₂O', element: 'Zn', dose: '0.1 – 0.3 g/L', note: lang === 'de' ? 'Bei Stauchung/Rosettenwuchs der Spitzen.' : 'For stunted growth / rosette tips.' },
    { name: lang === 'de' ? 'Kupfersulfat' : 'Copper Sulfate',    formula: 'CuSO₄·5H₂O', element: 'Cu', dose: '0.05 – 0.15 g/L', note: lang === 'de' ? 'Vorsicht – sehr enge Toxizitätsgrenze.' : 'Caution – narrow toxicity margin.' },
    { name: lang === 'de' ? 'Borsäure' : 'Boric Acid',            formula: 'H₃BO₃',      element: 'B',  dose: '0.05 – 0.2 g/L', note: lang === 'de' ? 'Niedrig dosieren; B-Toxizität tritt schnell auf.' : 'Use sparingly; B toxicity sets in quickly.' },
    { name: lang === 'de' ? 'Natriummolybdat' : 'Sodium Molybdate', formula: 'Na₂MoO₄·2H₂O', element: 'Mo', dose: '0.01 – 0.05 g/L', note: lang === 'de' ? 'Sehr geringe Mengen — meist im Schoss/Anfang der Blüte.' : 'Very small amounts — typically pre-bloom / early bloom.' },
  ];

  const RULES = lang === 'de' ? [
    { title: 'Timing — vor Dunkelphase', body: 'Auftragen kurz vor Sonnenuntergang oder bevor das Kunstlicht ausgeht. Stomata sind dann offen, die Lösung trocknet nicht sofort weg und kann mehrere Stunden einwirken.' },
    { title: 'Hohe Luftfeuchtigkeit (≥ 60 %)', body: 'Foliar ist eine „feuchte Phase"-Anwendung: bei niedriger Luftfeuchte trocknet die Lösung in Minuten und es findet kaum Aufnahme statt. RH 60–80 % ist optimal.' },
    { title: 'Surfactant / Netzmittel', body: 'Ohne Surfactant perlt die Lösung ab. Bewährt: Aloe-Vera-Gel (~5 ml/L), Yucca-Extrakt, Sojalecithin oder neutrale Seife (sehr sparsam, < 0.5 ml/L). Verbessert Bedeckung und Absorption deutlich.' },
    { title: 'Temperatur 18 – 25 °C', body: 'Nicht in praller Mittagssonne oder über 28 °C sprühen — Verbrennungsgefahr. Kühlere Bedingungen verlängern die Aufnahmefenster.' },
    { title: 'pH 5.5 – 6.5 · EC ≤ 1.5 mS/cm', body: 'Leicht sauer für gute Kutikula-Penetration. Niedriger EC verhindert Blattverbrennung — Foliar ist niemals so konzentriert wie Wurzelfütterung.' },
    { title: 'Blattunterseite mit besprühen', body: 'Stomata sitzen primär unten. Beidseitig sprühen — vor allem für Mikronährstoffe und Hormone entscheidend.' },
    { title: 'Inkompatibilitäten beachten', body: 'Calcium niemals mit Phosphat oder Sulfat im selben Ansatz (Fällung). Cu/Zn nicht mit Phosphat. Im Zweifel zwei Sprays an verschiedenen Tagen.' },
    { title: 'Nicht auf Blüten sprühen', body: 'In der Blütephase nur Blattmasse besprühen — Feuchtigkeit auf Blüten begünstigt Botrytis (Grauschimmel).' },
    { title: 'Ergänzung, kein Ersatz', body: 'Foliar deckt nur einen Bruchteil des Nährstoffbedarfs. Wurzelernährung bleibt Hauptquelle; Foliar ist Korrektur & Boost.' },
  ] : [
    { title: 'Timing — before the dark phase', body: 'Apply shortly before sunset or before lights-off. Stomata are still open, the solution does not dry away instantly and can act for several hours.' },
    { title: 'High humidity (≥ 60%)', body: 'Foliar is a "humid-phase" application: at low RH the spray dries in minutes and little uptake happens. 60–80% RH is optimal.' },
    { title: 'Surfactant / wetting agent', body: 'Without a surfactant the solution beads off. Proven options: aloe-vera gel (~5 ml/L), yucca extract, soy lecithin or neutral soap (very sparingly, < 0.5 ml/L). Dramatically improves coverage and absorption.' },
    { title: 'Temperature 18 – 25 °C', body: 'Never spray in midday sun or above 28 °C — burn risk. Cooler conditions extend the uptake window.' },
    { title: 'pH 5.5 – 6.5 · EC ≤ 1.5 mS/cm', body: 'Slightly acidic for good cuticle penetration. Low EC prevents leaf burn — foliar is never as concentrated as root feeding.' },
    { title: 'Spray the underside too', body: 'Stomata mostly sit on the underside. Spray both sides — crucial for micronutrients and hormones.' },
    { title: 'Watch incompatibilities', body: 'Never combine calcium with phosphate or sulfate in the same tank (precipitation). Cu/Zn not with phosphate. When in doubt, two separate sprays on different days.' },
    { title: 'Do not spray flowers', body: 'In bloom only mist leaf mass — moisture on flowers invites botrytis (grey mould).' },
    { title: 'Supplement, not replacement', body: 'Foliar covers only a fraction of nutrient demand. Root feeding remains the primary source; foliar is correction & boost.' },
  ];

  // Tabelle mit Salz-Dosierungen
  // 4 Spalten: Name | Element-Symbol | Dosis | Hinweis
  // (Formel-Spalte entfernt — Symbol bleibt.)
  const Table = ({ title, rows }) => (
    <section className={`rounded-xl border ${cardClass} p-3 overflow-x-auto`}>
      <h3 className="text-sm font-semibold mb-2 px-1">{title}</h3>
      <div className="min-w-[440px]">
        <div className={`grid items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-wider font-medium opacity-60 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}
          style={{ gridTemplateColumns: '1.6fr 0.6fr 1.1fr 2.5fr' }}>
          <div>{lang === 'de' ? 'Salz / Produkt' : 'Salt / Product'}</div>
          <div>{lang === 'de' ? 'Elem.' : 'Elem.'}</div>
          <div>{lang === 'de' ? 'Dosis' : 'Dose'}</div>
          <div>{lang === 'de' ? 'Hinweis' : 'Note'}</div>
        </div>
        {rows.map((r, i) => (
          <div key={r.name + i}
            className={`grid items-baseline gap-2 px-2 py-2 text-[11px] border-b ${isDark ? 'border-neutral-800/60' : 'border-neutral-200/70'} last:border-b-0`}
            style={{ gridTemplateColumns: '1.6fr 0.6fr 1.1fr 2.5fr' }}>
            <div className="font-medium">{r.name}</div>
            <div className="mono font-semibold" style={{ color: accent.accent }}>{r.element}</div>
            <div className="mono">{r.dose}</div>
            <div className={`text-[10.5px] ${subtle}`}>{r.note}</div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4 space-y-2`}>
        <div className="flex items-center gap-2">
          <Leaf size={18} style={{ color: accent.accent }} />
          <h2 className="text-base font-semibold">{t.knowledge.foliarCheat}</h2>
        </div>
        <p className="text-xs opacity-70 leading-relaxed">
          {lang === 'de'
            ? 'Blattdüngung („Foliar") wirkt schnell, deckt aber nur einen Bruchteil des Bedarfs. Richtig dosiert und im richtigen Zeitfenster appliziert ein hervorragendes Werkzeug gegen Mangelerscheinungen und für gezielte Boosts.'
            : 'Foliar feeding works fast but only covers a fraction of total demand. Dosed correctly and applied in the right window it is an excellent tool against deficiencies and for targeted boosts.'}
        </p>
      </section>

      {/* Anwendungsregeln */}
      <section className={`rounded-xl border ${cardClass} p-4 space-y-3`}>
        <h3 className="text-sm font-semibold">{lang === 'de' ? 'Anwendungsregeln' : 'Application rules'}</h3>
        <div className="space-y-2.5">
          {RULES.map((r, i) => (
            <div key={i} className={`pl-3 border-l-2 ${isDark ? 'border-neutral-700' : 'border-neutral-300'}`}
              style={{ borderLeftColor: accent.accent }}>
              <div className="text-[12px] font-semibold mb-0.5">{r.title}</div>
              <div className={`text-[11px] leading-relaxed ${subtle}`}>{r.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Makronährstoff-Salze */}
      <Table title={lang === 'de' ? 'Makronährstoffe' : 'Macronutrients'} rows={MACRO_SALTS} />

      {/* Mikronährstoff-Salze */}
      <Table title={lang === 'de' ? 'Mikronährstoffe' : 'Micronutrients'} rows={MICRO_SALTS} />

      {/* Sicherheits-Hinweis */}
      <section className={`rounded-xl border ${cardClass} p-4 text-[11px] leading-relaxed opacity-80`}>
        <strong>{lang === 'de' ? 'Wichtig:' : 'Important:'}</strong>{' '}
        {lang === 'de'
          ? 'Vor jedem neuen Mischrezept immer einen Test an wenigen Blättern machen und 24 h beobachten. Verbrennungen / Flecken bedeuten zu hohe EC oder ungünstige Tageszeit.'
          : 'Before any new spray mix, test on a few leaves and observe for 24 h. Burns / spots indicate EC too high or wrong time of day.'}
      </section>

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: Marschner 2012 (Mineral Nutrition of Higher Plants); Fernández et al. 2013 (Foliar Fertilization, IFA); Wójcik 2004
      </div>
    </div>
  );
}

// ============================================================
// ROOTZONE-DIAGNOSE
// Wrapper mit Toggle Run-off / Reservoir.
// Run-off: Wertbasiert mit Eingabefeldern (Erde/Kokos, Topf mit Drainage)
// Reservoir: Trend-Auswahl 3x3x3 (rezirkulierende Hydro-Systeme: DWC, NFT, RDWC)
// Quellen: Sonneveld & Voogt 2009; Resh 2013; Marschner; gängige Hydroponik-Praxis.
// ============================================================
function RootzoneView({ ctx, onBack }) {
  const { t, isDark, lang, rootzoneMode, setRootzoneMode } = ctx;
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-600 hover:text-neutral-900'}`}
      >
        <ChevronLeft size={18} /> {t.knowledge.back}
      </button>

      <section className={`rounded-xl border ${cardClass} p-4 space-y-2`}>
        <h2 className="text-base font-semibold">{t.knowledge.runoff}</h2>
        <p className="text-xs opacity-60">
          {lang === 'de'
            ? 'Wähle, welche Art von System du diagnostizieren möchtest.'
            : 'Choose which type of system you want to diagnose.'}
        </p>
      </section>

      {/* Modus-Toggle */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <div className="grid grid-cols-2 gap-2">
          <SegmentButton active={rootzoneMode === 'runoff'} onClick={() => setRootzoneMode('runoff')} ctx={ctx}>
            {lang === 'de' ? 'Run-off' : 'Run-off'}
          </SegmentButton>
          <SegmentButton active={rootzoneMode === 'reservoir'} onClick={() => setRootzoneMode('reservoir')} ctx={ctx}>
            {lang === 'de' ? 'Reservoir' : 'Reservoir'}
          </SegmentButton>
        </div>
        <p className="text-[11px] opacity-60 mt-2 leading-relaxed">
          {rootzoneMode === 'runoff'
            ? (lang === 'de'
                ? 'Topfkultur mit Drainage (Erde, Kokos). Werte vergleichen von Zufuhr und Run-off.'
                : 'Pot culture with drainage (soil, coco). Compare values from feed and run-off.')
            : (lang === 'de'
                ? 'Rezirkulierende Hydroponik (DWC, NFT, RDWC). Beobachte Trends im Tank.'
                : 'Recirculating hydroponics (DWC, NFT, RDWC). Observe trends in the tank.')}
        </p>
      </section>

      {rootzoneMode === 'runoff' ? <RunoffDiagnose ctx={ctx} /> : <ReservoirDiagnose ctx={ctx} />}

      {/* Quellenangabe */}
      <div className="px-2 text-[10px] opacity-40 text-center italic leading-relaxed">
        {t.knowledge.source}: Sonneveld & Voogt 2009; Resh 2013; Marschner 2012
      </div>
    </div>
  );
}

// ============================================================
// RUN-OFF DIAGNOSE (Erde/Kokos)
// ============================================================
// Stabile Eingabe-Komponente außerhalb der RunoffDiagnose-Funktion definiert,
// damit React sie zwischen Renderings wiederverwendet und der Fokus bzw.
// die Bildschirmtastatur erhalten bleibt.
function NumFieldStable({ label, value, setValue, unit, placeholder, step = '0.01', inputBase }) {
  return (
    <div>
      <label className="text-[11px] opacity-70 font-medium block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${inputBase} pr-12`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] opacity-50 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function RunoffDiagnose({ ctx }) {
  const { isDark, lang, accent } = ctx;
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';
  const inputBase = isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900';

  const [ecIn, _setEcIn] = useState('');
  const [ecOut, _setEcOut] = useState('');
  const [phIn, _setPhIn] = useState('');
  const [phOut, _setPhOut] = useState('');
  const [vol, _setVol] = useState('');
  const [evaluated, setEvaluated] = useState(false);

  // Jede Werte-Änderung verwirft die letzte Auswertung
  const setEcIn = (v) => { _setEcIn(v); setEvaluated(false); };
  const setEcOut = (v) => { _setEcOut(v); setEvaluated(false); };
  const setPhIn = (v) => { _setPhIn(v); setEvaluated(false); };
  const setPhOut = (v) => { _setPhOut(v); setEvaluated(false); };
  const setVol = (v) => { _setVol(v); setEvaluated(false); };

  const parseNum = (s) => {
    const v = parseFloat(String(s).replace(',', '.'));
    return isFinite(v) ? v : null;
  };

  const ec_in = parseNum(ecIn);
  const ec_out = parseNum(ecOut);
  const ph_in = parseNum(phIn);
  const ph_out = parseNum(phOut);
  const volume = parseNum(vol);

  // Mindestens ein Werte-Paar muss vollständig sein, damit der Button aktiv wird
  const canEvaluate =
    (ec_in !== null && ec_out !== null && ec_in > 0) ||
    (ph_in !== null && ph_out !== null) ||
    volume !== null;

  // EC-Diagnose
  const ecDiag = (() => {
    if (ec_in === null || ec_out === null || ec_in <= 0) return null;
    const ratio = ec_out / ec_in;
    if (ratio < 0.8) return {
      level: 'info', ratio,
      title: { de: 'Pflanze nimmt mehr Salze auf', en: 'Plant absorbs more salts' },
      meaning: {
        de: 'Output EC ist deutlich niedriger als Input EC. Die Pflanze zieht Nährstoffe aus dem Substrat schneller, als du nachdüngst.',
        en: 'Output EC is clearly lower than input EC. The plant absorbs nutrients faster than you supply.',
      },
      action: {
        de: 'Düngung leicht erhöhen (z.B. um 15-20 %) oder häufiger gießen.',
        en: 'Slightly increase fertilization (e.g. by 15-20 %) or water more frequently.',
      },
    };
    if (ratio < 1.1) return {
      level: 'ok', ratio,
      title: { de: 'Optimal', en: 'Optimal' },
      meaning: {
        de: 'Aufnahme und Zufuhr sind im Gleichgewicht. Genau so soll es sein.',
        en: 'Uptake and supply are in balance. Exactly as it should be.',
      },
      action: {
        de: 'Weiter so. Werte regelmäßig überprüfen.',
        en: 'Keep it up. Check values regularly.',
      },
    };
    if (ratio < 1.3) return {
      level: 'warn', ratio,
      title: { de: 'Leichte Salzanreicherung', en: 'Slight salt build-up' },
      meaning: {
        de: 'Output EC ist etwas höher als Input EC. Im Substrat sammeln sich langsam Salze an.',
        en: 'Output EC is slightly higher than input EC. Salts are slowly accumulating in the substrate.',
      },
      action: {
        de: 'Run-off-Anteil bei den nächsten Bewässerungen auf 15-20 % erhöhen. Bei korrekter Spülpraxis (mindestens 3× pro Woche) sollte sich der Wert dadurch normalisieren. Bleibt der EC-Anstieg trotz angemessener Spülfrequenz bestehen, ist die Düngerstärke etwas zu hoch — dann um etwa 10 % reduzieren.',
        en: 'Increase run-off share to 15-20 % at the next waterings. With proper flushing practice (at least 3× per week), the value should normalize. If the EC rise persists despite adequate flush frequency, fertilizer strength is slightly too high — reduce by about 10 %.',
      },
    };
    if (ratio < 1.8) return {
      level: 'bad', ratio,
      title: { de: 'Deutliche Salzanreicherung', en: 'Significant salt build-up' },
      meaning: {
        de: 'Output EC ist erheblich höher als Input EC. Risiko für Wurzelstress.',
        en: 'Output EC is significantly higher than input EC. Risk of root stress.',
      },
      action: {
        de: 'Heavy Flush empfohlen. Zwei Methoden:\n\n• Methode A — RO-Wasser-Flush (effizienter): Mit reinem RO-Wasser (Reverse Osmosis) spülen, ohne pH-Anpassung — das Wasser soll seine volle Lösekapazität behalten. Spülen, bis Output EC unter 50-80 % deines Ziel-ECs liegt. Danach mit deiner regulären Nährstofflösung nachgießen, bis Output EC ≈ Input EC. Der pH stellt sich beim Nachgießen automatisch ein.\n\n• Methode B — Verdünnte-Lösung-Flush (einfacher): Mit Nährstofflösung in 50-60 % deiner regulären Konzentration spülen, bis Output EC ≈ Input EC. Verbraucht mehr Wasser und Dünger, aber keine RO-Quelle nötig.',
        en: 'Heavy flush recommended. Two methods:\n\n• Method A — RO-water flush (more efficient): Flush with pure RO water (reverse osmosis), without pH adjustment — the water should keep its full dissolving capacity. Flush until output EC is below 50-80 % of your target EC. Then top up with your regular nutrient solution until output EC ≈ input EC. pH adjusts automatically.\n\n• Method B — Diluted solution flush (simpler): Flush with nutrient solution at 50-60 % of regular concentration until output EC ≈ input EC. Uses more water and fertilizer, but no RO source needed.',
      },
    };
    return {
      level: 'bad', ratio,
      title: { de: 'Starke Salzanreicherung', en: 'Severe salt build-up' },
      meaning: {
        de: 'Output EC ist mehr als 1.8× so hoch wie Input EC. Dringender Handlungsbedarf, sonst Wurzelschäden. Meist eine Salzaltlast, entstanden durch unzureichendes Spülen in den vergangenen Wochen.',
        en: 'Output EC is more than 1.8× input EC. Urgent action needed or root damage will occur. Typically a salt legacy from insufficient flushing in past weeks.',
      },
      action: {
        de: 'Sofort Heavy Flush. Zwei Methoden:\n\n• Methode A — RO-Wasser-Flush (effizienter): Mit reinem RO-Wasser (Reverse Osmosis) spülen, ohne pH-Anpassung — das Wasser soll seine volle Lösekapazität behalten. Spülen, bis Output EC unter 50-80 % deines Ziel-ECs liegt. Danach mit deiner regulären Nährstofflösung nachgießen, bis Output EC ≈ Input EC.\n\n• Methode B — Verdünnte-Lösung-Flush (einfacher): Mit Nährstofflösung in 50-60 % deiner regulären Konzentration spülen, bis Output EC ≈ Input EC.\n\nNach dem Flush: regelmäßig 10-20 % Run-off, mindestens 3× pro Woche oder häufiger, jeweils nach ausreichendem Dryback. So bildet sich keine neue Altlast.',
        en: 'Immediate heavy flush. Two methods:\n\n• Method A — RO-water flush (more efficient): Flush with pure RO water, without pH adjustment. Flush until output EC is below 50-80 % of your target EC. Then top up with your regular nutrient solution until output EC ≈ input EC.\n\n• Method B — Diluted solution flush (simpler): Flush with nutrient solution at 50-60 % of regular concentration until output EC ≈ input EC.\n\nAfter the flush: regular 10-20 % run-off, at least 3× per week or more often, each time after adequate dryback. This prevents a new legacy.',
      },
    };
  })();

  // pH-Diagnose
  const phDiag = (() => {
    if (ph_in === null || ph_out === null) return null;
    const diff = ph_out - ph_in;
    if (diff < -1.0) return {
      level: 'bad', diff,
      title: { de: 'Substrat stark versauert', en: 'Substrate strongly acidified' },
      meaning: {
        de: 'Output pH ist mehr als 1.0 niedriger als Input pH. Häufige Ursachen: zu viel Ammonium-Stickstoff im Dünger, organischer Abbau im Substrat, alte Wurzeln.',
        en: 'Output pH is more than 1.0 lower than input pH. Common causes: too much ammonium-nitrogen, organic decomposition, old roots.',
      },
      action: {
        de: 'Wenig Calciumcarbonat (Dolokalk, Kalk) ins Substrat einarbeiten oder über das Gießwasser zuführen. Stickstoff-Verhältnis prüfen: mehr Nitrat (NO₃⁻), weniger Ammonium (NH₄⁺). Bei starkem Befall: Substratwechsel erwägen.',
        en: 'Add a small amount of calcium carbonate (dolomite, lime) into the substrate or feed water. Check N ratio: more nitrate (NO₃⁻), less ammonium (NH₄⁺). For severe cases: consider substrate change.',
      },
    };
    if (diff < -0.5) return {
      level: 'warn', diff,
      title: { de: 'Substrat versauert leicht', en: 'Substrate slightly acidifying' },
      meaning: {
        de: 'Output pH ist etwas niedriger als Input pH. Beginnender Trend zur Versauerung.',
        en: 'Output pH is slightly lower than input pH. Early acidification trend.',
      },
      action: {
        de: 'Input-pH leicht anheben (um 0.2-0.3). Ammonium-Anteil im Dünger prüfen und ggf. reduzieren.',
        en: 'Slightly raise input pH (by 0.2-0.3). Check ammonium share in fertilizer and reduce if needed.',
      },
    };
    if (diff <= 0.5) return {
      level: 'ok', diff,
      title: { de: 'pH stabil', en: 'pH stable' },
      meaning: {
        de: 'Output pH liegt nahe Input pH. Das Substrat ist gut gepuffert.',
        en: 'Output pH is close to input pH. Substrate is well buffered.',
      },
      action: {
        de: 'Alles gut. Weiter so.',
        en: 'All good. Keep going.',
      },
    };
    if (diff <= 1.0) return {
      level: 'warn', diff,
      title: { de: 'Substrat alkalisiert leicht', en: 'Substrate slightly alkalizing' },
      meaning: {
        de: 'Output pH ist etwas höher als Input pH. Mögliche Ursache: hartes Gießwasser mit viel Calcium oder Bicarbonat.',
        en: 'Output pH is slightly higher than input pH. Possible cause: hard feed water with calcium or bicarbonate.',
      },
      action: {
        de: 'Input-pH leicht senken (um 0.2-0.3). Wasserqualität prüfen — bei sehr hartem Wasser ggf. Osmose-Wasser verwenden.',
        en: 'Slightly lower input pH (by 0.2-0.3). Check water quality — for very hard water consider RO water.',
      },
    };
    return {
      level: 'bad', diff,
      title: { de: 'Substrat stark alkalisch', en: 'Substrate strongly alkaline' },
      meaning: {
        de: 'Output pH ist mehr als 1.0 höher als Input pH. Bei hohem pH werden viele Mikronährstoffe (Fe, Mn, Zn) blockiert — Mangelerscheinungen drohen.',
        en: 'Output pH is more than 1.0 higher than input pH. At high pH many micronutrients (Fe, Mn, Zn) are blocked — deficiency symptoms likely.',
      },
      action: {
        de: 'Heavy Flush mit RO-Wasser (siehe EC-Empfehlung), danach mit pH-korrigierter Nährstofflösung nachgießen. Wasserquelle prüfen, bei hartem Wasser ggf. dauerhaft RO-Wasser verwenden.',
        en: 'Heavy flush with RO water (see EC recommendation), then top up with pH-corrected nutrient solution. Check water source; for hard water consider permanent RO use.',
      },
    };
  })();

  // Absoluter pH-Wert — Spülung & Aluminium-Toxizität
  const absPhDiag = (() => {
    if (ph_out === null) return null;
    if (ph_out < 5.0) return {
      level: 'bad',
      title: { de: 'Aluminium-Toxizität-Risiko', en: 'Aluminum toxicity risk' },
      meaning: {
        de: `Substrat-pH ${ph_out.toFixed(2)} — Unterhalb von 5.0 löst sich Aluminium (Al³⁺) aus dem Substrat. Aluminium ist für Pflanzen giftig: blockiert Phosphat-Aufnahme und Wurzelwachstum. Zusätzlich sind Calcium, Magnesium und Phosphor bei diesem pH kaum verfügbar.`,
        en: `Substrate pH ${ph_out.toFixed(2)} — Below 5.0, aluminum (Al³⁺) dissolves from the substrate. Aluminum is toxic to plants: blocks phosphate uptake and root growth. Calcium, magnesium and phosphorus are also barely available at this pH.`,
      },
      action: {
        de: 'Sofort spülen: Mit pH-korrigiertem Wasser (pH 6.2–6.5) spülen, bis der Output-pH dauerhaft über 5.5 steigt. Danach Nährstofflösung mit korrigiertem pH (5.8–6.3) zuführen. Ursachenanalyse: Ammonium-Anteil im Dünger prüfen und ggf. deutlich reduzieren (weniger NH₄⁺, mehr NO₃⁻). Bei Kunstsubstraten (Steinwolle, Perlite) das Substrat ggf. wechseln.',
        en: 'Flush immediately: Flush with pH-corrected water (pH 6.2–6.5) until output pH consistently rises above 5.5. Then resume nutrient solution with corrected pH (5.8–6.3). Root cause: check ammonium share in fertilizer and reduce significantly (less NH₄⁺, more NO₃⁻). For inert substrates (rockwool, perlite), consider replacing the substrate.',
      },
    };
    if (ph_out < 5.5) return {
      level: 'warn',
      title: { de: 'pH zu niedrig — Spülung empfohlen', en: 'pH too low — flush recommended' },
      meaning: {
        de: `Substrat-pH ${ph_out.toFixed(2)} liegt unter 5.5. Aufnahme von Phosphor, Calcium und Magnesium ist beeinträchtigt. Bei weiterem Abfall droht Aluminium-Toxizität (ab pH 5.0).`,
        en: `Substrate pH ${ph_out.toFixed(2)} is below 5.5. Uptake of phosphorus, calcium and magnesium is impaired. Further drops risk aluminum toxicity (below pH 5.0).`,
      },
      action: {
        de: 'Mit pH-korrigiertem Wasser (pH 6.2–6.5) spülen, bis Output-pH in den optimalen Bereich (5.8–6.3) steigt. Anschließend Input-pH beim nächsten Gießen leicht erhöhen (+0.2–0.3 Einheiten).',
        en: 'Flush with pH-corrected water (pH 6.2–6.5) until output pH rises into the optimal range (5.8–6.3). Then slightly raise input pH at the next watering (+0.2–0.3 units).',
      },
    };
    return null;
  })();

  // Volumen-Diagnose
  const volDiag = (() => {
    if (volume === null) return null;
    if (volume < 10) return {
      level: 'warn',
      title: { de: 'Zu wenig Run-off', en: 'Too little run-off' },
      meaning: {
        de: 'Weniger als 10 % der zugeführten Menge laufen ab. Salze können sich nicht ausspülen.',
        en: 'Less than 10 % of supplied volume drains. Salts cannot flush out.',
      },
      action: {
        de: 'Mehr gießen, bis 10-20 % Run-off entstehen.',
        en: 'Water more until 10-20 % run-off appears.',
      },
    };
    if (volume <= 20) return {
      level: 'ok',
      title: { de: 'Idealbereich', en: 'Ideal range' },
      meaning: {
        de: 'Genug Run-off zum Spülen der Salze, ohne Nährstoffe zu verschwenden.',
        en: 'Enough run-off to flush salts without wasting nutrients.',
      },
      action: {
        de: 'Genau so weitermachen.',
        en: 'Keep it just like this.',
      },
    };
    if (volume <= 30) return {
      level: 'ok',
      title: { de: 'Etwas mehr als nötig', en: 'A bit more than needed' },
      meaning: {
        de: 'Im akzeptablen Bereich, leichte Verschwendung von Düngerlösung.',
        en: 'Within acceptable range, slight waste of nutrient solution.',
      },
      action: {
        de: 'Gießmenge etwas reduzieren.',
        en: 'Slightly reduce watering volume.',
      },
    };
    return {
      level: 'warn',
      title: { de: 'Zu viel Run-off', en: 'Too much run-off' },
      meaning: {
        de: 'Mehr als 30 % laufen ab. Verschwendung von Wasser und Dünger.',
        en: 'More than 30 % drains. Wastes water and fertilizer.',
      },
      action: {
        de: 'Gießmenge deutlich reduzieren.',
        en: 'Significantly reduce watering volume.',
      },
    };
  })();

  // NumField wird über Modul-Komponente NumFieldStable gerendert, um Tastatur-Fokus zu erhalten

  return (
    <div className="space-y-4">
      {/* Eingabe-Block */}
      <section className={`rounded-xl border ${cardClass} p-4 space-y-3`}>
        <h3 className="text-sm font-semibold">{lang === 'de' ? 'Messwerte eingeben' : 'Enter measurements'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumFieldStable inputBase={inputBase} label={lang === 'de' ? 'Input EC' : 'Input EC'} value={ecIn} setValue={setEcIn} unit="mS/cm" placeholder="1.50" />
          <NumFieldStable inputBase={inputBase} label={lang === 'de' ? 'Output EC' : 'Output EC'} value={ecOut} setValue={setEcOut} unit="mS/cm" placeholder="1.80" />
          <NumFieldStable inputBase={inputBase} label={lang === 'de' ? 'Input pH' : 'Input pH'} value={phIn} setValue={setPhIn} unit="" placeholder="6.00" />
          <NumFieldStable inputBase={inputBase} label={lang === 'de' ? 'Output pH' : 'Output pH'} value={phOut} setValue={setPhOut} unit="" placeholder="6.00" />
        </div>
        <NumFieldStable inputBase={inputBase} label={lang === 'de' ? 'Run-off Volumen (optional)' : 'Run-off volume (optional)'} value={vol} setValue={setVol} unit="%" placeholder="15" step="1" />
        <p className="text-[10px] opacity-50 leading-relaxed">
          {lang === 'de'
            ? 'Du musst nicht alle Felder ausfüllen. Für jedes vollständig ausgefüllte Werte-Paar gibt es eine eigene Diagnose.'
            : 'You do not need to fill all fields. For each completed pair of values you get a separate diagnosis.'}
        </p>

        {/* Auswerten-Button */}
        <button
          onClick={() => canEvaluate && setEvaluated(true)}
          disabled={!canEvaluate}
          className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity ${
            canEvaluate ? '' : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ background: accent.accent }}
        >
          {lang === 'de' ? 'Auswerten' : 'Evaluate'}
        </button>
      </section>

      {/* Diagnose-Karten - nur nach Klick auf Auswerten */}
      {evaluated && (
        <>
          {ecDiag && <DiagCard ctx={ctx} kind="EC" diag={ecDiag} extra={`${ecDiag.ratio.toFixed(2)}×`} />}
          {phDiag && <DiagCard ctx={ctx} kind="pH" diag={phDiag} extra={`${phDiag.diff >= 0 ? '+' : ''}${phDiag.diff.toFixed(2)}`} />}
          {absPhDiag && <DiagCard ctx={ctx} kind={lang === 'de' ? 'pH Absolutwert' : 'Absolute pH'} diag={absPhDiag} extra={`pH ${ph_out.toFixed(2)}`} />}
          {volDiag && <DiagCard ctx={ctx} kind={lang === 'de' ? 'Volumen' : 'Volume'} diag={volDiag} extra={`${volume.toFixed(0)}%`} />}
        </>
      )}

      {/* Allgemeine Hinweise */}
      <section className={`rounded-xl border ${cardClass} p-4 text-xs leading-relaxed space-y-3`}>
        <div className="space-y-1.5">
          <p className="font-semibold text-sm">{lang === 'de' ? 'Grundregel bei Topfkultur' : 'Pot culture — basic rule'}</p>
          <p className="opacity-80">
            {lang === 'de'
              ? 'Bei Bewässerung sollten regelmäßig 10-20 % Run-off angewandt werden, mindestens 3× pro Woche oder häufiger. So spülen sich überschüssige Salze laufend aus. Wird das vernachlässigt, entsteht mit der Zeit eine Salzaltlast im Substrat — und dann hilft nur noch ein Heavy Flush.'
              : 'During watering, 10-20 % run-off should be applied regularly, at least 3× per week or more often. This continuously flushes excess salts. If neglected, a salt legacy builds up in the substrate over time — and then only a heavy flush helps.'}
          </p>
        </div>
        <div className="space-y-1.5 pt-1">
          <p className="font-semibold text-sm">{lang === 'de' ? 'Hinweis zum Dryback' : 'Note on dryback'}</p>
          <p className="opacity-80">
            {lang === 'de'
              ? 'Nach jeder Bewässerung muss ein ausreichender Dryback gewährleistet sein, sonst droht ein anaerobes Substratmilieu. Wenn ein angemessener Spülrhythmus nicht möglich ist, weil das Substrat zu lange nass bleibt, ist die Topfgröße vermutlich zu groß für die aktuelle Pflanzengröße — ein kleinerer Topf erlaubt häufigere Spülzyklen bei konstanteren Substratbedingungen.'
              : 'After each watering, adequate dryback must be ensured, otherwise an anaerobic substrate environment may develop. If a proper flushing rhythm is not possible because the substrate stays wet too long, the pot size is probably too large for the current plant size — a smaller pot allows more frequent flushing cycles with more stable substrate conditions.'}
          </p>
        </div>
      </section>
    </div>
  );
}

// Hilfskomponente: einheitliche Diagnose-Karte
function DiagCard({ ctx, kind, diag, extra }) {
  const { isDark, lang } = ctx;
  const colors = {
    info: '#3b82f6',
    ok:   '#22c55e',
    warn: '#eab308',
    bad:  '#ef4444',
  };
  const color = colors[diag.level] || '#525252';
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  return (
    <section className={`rounded-xl border ${cardClass} overflow-hidden`}>
      <div className="flex items-stretch">
        <div className="w-1.5 flex-shrink-0" style={{ background: color }} />
        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide opacity-60 font-medium">{kind}</div>
              <h3 className="text-sm font-semibold">{diag.title[lang]}</h3>
            </div>
            {extra && (
              <span className="text-xs font-mono tabular-nums px-2 py-1 rounded" style={{ background: color + '22', color }}>
                {extra}
              </span>
            )}
          </div>
          <p className="text-xs opacity-80 leading-relaxed whitespace-pre-wrap">{diag.meaning[lang]}</p>
          <div className={`text-xs p-2.5 rounded-lg ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'} leading-relaxed`}>
            <span className="font-semibold opacity-90">{lang === 'de' ? 'Empfehlung: ' : 'Recommendation: '}</span>
            <span className="opacity-90 whitespace-pre-wrap">{diag.action[lang]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// RESERVOIR-DIAGNOSE (rezirkulierende Hydro-Systeme)
// 3x3x3 Trend-Auswahl: Wasserstand, EC, pH je fällt/konstant/steigt
// Daten aus klassischer Reservoir-Trend-Tabelle (DWC/NFT-Praxis)
// ============================================================

// 18 Fälle aus der Tabelle. Schlüssel: water-ec-ph mit f/s/r (falling/static/rising)
// Wasserstand "static" ist meist problematisch (Pflanze trinkt nicht).
// Wasserstand "falling" ist normalerweise gut.
const RESERVOIR_CASES = {
  // water STATIC - Pflanze trinkt nicht
  's-s-s': { level: 'warn', title: { de: 'Pflanze isst und trinkt nicht', en: 'Plant not feeding or drinking' },
    diagnose: { de: 'Alle Werte konstant, Pflanze nimmt nichts auf.', en: 'All values static, plant takes nothing up.' },
    action: { de: 'Messgeräte prüfen. EC leicht senken kann oft die Aufnahme wieder anstoßen.', en: 'Check meters. Slightly lowering EC often gets the plant feeding again.' } },
  's-s-r': { level: 'warn', title: { de: 'pH steigt ohne Aufnahme', en: 'pH rising without uptake' },
    diagnose: { de: 'pH-Puffer im Wasser könnten den pH heben. Pflanze nimmt nichts auf.', en: 'pH buffers in water may be raising pH. Plant takes nothing up.' },
    action: { de: 'EC etwas senken oder Reservoir wechseln.', en: 'Slightly lower EC or change reservoir.' } },
  's-s-f': { level: 'warn', title: { de: 'pH fällt ohne Aufnahme', en: 'pH falling without uptake' },
    diagnose: { de: 'Substrat oder Wasser wurden eventuell bei zu niedrigem pH gespült. Auch zu viel CO₂ im Wasser möglich.', en: 'Substrate or water may have been rinsed at too low pH. Excess CO₂ in water also possible.' },
    action: { de: 'Reservoir wechseln. Luftpumpe und Luftqualität prüfen.', en: 'Change reservoir. Check air pump and air quality.' } },
  's-r-s': { level: 'bad', title: { de: 'Pflanze verliert Nährstoffe zurück', en: 'Plant is leaching nutrients' },
    diagnose: { de: 'EC steigt obwohl Pflanze nicht trinkt. Wurzeln geben Nährstoffe ab — meist Stresszeichen.', en: 'EC rises while plant does not drink. Roots leak nutrients — usually a stress sign.' },
    action: { de: 'EC senken, Wurzeln auf Schäden prüfen. Temperaturen kontrollieren.', en: 'Lower EC, inspect roots for damage. Check temperatures.' } },
  's-r-r': { level: 'bad', title: { de: 'Nährstoff-Rückgabe mit pH-Anstieg', en: 'Nutrient leaching with pH rise' },
    diagnose: { de: 'Ungewöhnlicher Zustand. Pflanze gibt alkalische Ionen ab oder pH-Puffer wirken.', en: 'Unusual state. Plant releases alkaline ions or pH buffers act.' },
    action: { de: 'EC deutlich senken, Reservoir wechseln, Wurzeln prüfen.', en: 'Lower EC significantly, change reservoir, check roots.' } },
  's-r-f': { level: 'bad', title: { de: 'Salzanreicherung + Versauerung', en: 'Salt build-up + acidification' },
    diagnose: { de: 'Wie oben, aber zusätzlich Versauerung — möglich durch CO₂ oder organische Säuren.', en: 'As above plus acidification — possible from CO₂ or organic acids.' },
    action: { de: 'Reservoir wechseln, EC erhöhen falls nötig, Belüftung prüfen.', en: 'Change reservoir, increase EC if needed, check aeration.' } },
  's-f-s': { level: 'warn', title: { de: 'Pflanze isst, trinkt aber nicht', en: 'Plant eating but not drinking' },
    diagnose: { de: 'EC sinkt, Wasserstand konstant. Aufnahme ungleichgewichtig.', en: 'EC falls, water level static. Uptake imbalanced.' },
    action: { de: 'EC senken oder Reservoir auffüllen mit schwächerer Lösung.', en: 'Lower EC or top up reservoir with weaker solution.' } },
  's-f-r': { level: 'warn', title: { de: 'Aufnahme ohne Trinken, pH steigt', en: 'Feeding without drinking, pH rises' },
    diagnose: { de: 'Wie oben, der pH-Anstieg ist relativ unkritisch.', en: 'As above, the pH rise is relatively uncritical.' },
    action: { de: 'EC leicht senken oder Reservoir auffrischen.', en: 'Slightly lower EC or refresh reservoir.' } },
  's-f-f': { level: 'warn', title: { de: 'EC und pH fallen, Wasser konstant', en: 'EC and pH falling, water static' },
    diagnose: { de: 'Aufnahme funktioniert, aber Wasser bleibt — möglicherweise Verdunstung kompensiert.', en: 'Uptake works but water stays — possibly evaporation compensates.' },
    action: { de: 'Reservoir wechseln. EC nach Bedarf anpassen.', en: 'Change reservoir. Adjust EC as needed.' } },
  // water FALLING - Pflanze trinkt (normaler Zustand)
  'f-s-s': { level: 'ok', title: { de: 'Perfekte Bedingungen', en: 'Perfect conditions' },
    diagnose: { de: 'Wasser sinkt, EC und pH bleiben stabil. Idealer Zustand.', en: 'Water dropping, EC and pH stable. Ideal state.' },
    action: { de: 'Nichts ändern, weiter beobachten.', en: 'Change nothing, keep observing.' } },
  'f-s-r': { level: 'ok', title: { de: 'Normaler Alltagszustand', en: 'Normal everyday state' },
    diagnose: { de: 'Häufigster Zustand. pH-Anstieg bei Aufnahme ist normal.', en: 'Most common state. pH rise with uptake is normal.' },
    action: { de: 'Wie gehabt weitermachen, sofern keine Pflanzensymptome.', en: 'Carry on as before unless plant symptoms appear.' } },
  'f-s-f': { level: 'warn', title: { de: 'pH fällt, EC stabil', en: 'pH falling, EC stable' },
    diagnose: { de: 'Aufnahme okay, aber pH sinkt — Reservoir-Wechsel empfehlenswert.', en: 'Uptake okay but pH falls — reservoir change advised.' },
    action: { de: 'Reservoir wechseln. EC senken falls über 1.4, anheben falls unter 1.0.', en: 'Change reservoir. Lower EC if above 1.4, raise if below 1.0.' } },
  'f-r-s': { level: 'warn', title: { de: 'Pflanze trinkt mehr als sie aufnimmt', en: 'Plant drinking more than eating' },
    diagnose: { de: 'Wasserstand sinkt, EC steigt — Wasseraufnahme höher als Nährstoffaufnahme.', en: 'Water drops, EC rises — water uptake exceeds nutrient uptake.' },
    action: { de: 'EC senken (schwächere Lösung anrühren).', en: 'Lower EC (mix weaker solution).' } },
  'f-r-r': { level: 'warn', title: { de: 'Trinkt mehr als isst, pH steigt', en: 'Drinking more than eating, pH rising' },
    diagnose: { de: 'Wie oben, mit normalem pH-Verlauf.', en: 'As above with normal pH trend.' },
    action: { de: 'EC senken.', en: 'Lower EC.' } },
  'f-r-f': { level: 'warn', title: { de: 'Trinkt mehr als isst, pH fällt', en: 'Drinking more than eating, pH falling' },
    diagnose: { de: 'EC steigt, pH fällt — typisch bei zu konzentrierter Lösung.', en: 'EC rises, pH falls — typical for too concentrated solution.' },
    action: { de: 'EC senken und Reservoir wechseln.', en: 'Lower EC and change reservoir.' } },
  'f-f-s': { level: 'ok', title: { de: 'Hungrige Pflanze', en: 'Hungry plant' },
    diagnose: { de: 'EC fällt, Wasser sinkt, pH stabil. Pflanze nimmt Nährstoffe aktiv auf.', en: 'EC falls, water falls, pH stable. Plant actively taking up nutrients.' },
    action: { de: 'EC anheben — gute Bedingungen, mehr Dünger möglich.', en: 'Raise EC — good conditions, more fertilizer possible.' } },
  'f-f-r': { level: 'ok', title: { de: 'Nahezu perfekt', en: 'Almost perfect' },
    diagnose: { de: 'Wie oben, mit pH-Anstieg — sehr typisch.', en: 'As above with pH rising — very typical.' },
    action: { de: 'EC leicht anheben.', en: 'Slightly raise EC.' } },
  'f-f-f': { level: 'warn', title: { de: 'Alles fällt', en: 'Everything falling' },
    diagnose: { de: 'Pflanze isst und trinkt, aber pH sinkt — Reservoir-Wechsel.', en: 'Plant eating and drinking but pH falls — reservoir change.' },
    action: { de: 'Reservoir wechseln, EC bei neuem Reservoir leicht anheben.', en: 'Change reservoir, slightly raise EC for new reservoir.' } },
};

function ReservoirDiagnose({ ctx }) {
  const { isDark, lang } = ctx;
  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  const [water, setWater] = useState('f'); // f=falling (Default, normaler Zustand), s=static
  const [ec, setEc] = useState('s');       // f/s/r
  const [ph, setPh] = useState('s');       // f/s/r

  const key = `${water}-${ec}-${ph}`;
  const result = RESERVOIR_CASES[key];

  const TrendBtn = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'text-white'
          : isDark ? 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
      style={active ? { background: ctx.accent.accent } : {}}
    >
      {children}
    </button>
  );

  const labels = {
    water: { de: 'Wasserstand', en: 'Water level' },
    ec:    { de: 'EC',          en: 'EC' },
    ph:    { de: 'pH',          en: 'pH' },
    falling: { de: 'fällt',     en: 'falling' },
    static:  { de: 'konstant',  en: 'static' },
    rising:  { de: 'steigt',    en: 'rising' },
  };

  return (
    <div className="space-y-4">
      {/* Trend-Auswahl */}
      <section className={`rounded-xl border ${cardClass} p-4 space-y-3`}>
        <h3 className="text-sm font-semibold">{lang === 'de' ? 'Was beobachtest du im Tank?' : 'What do you observe in the tank?'}</h3>

        {/* Wasserstand: nur falling / static (rising macht keinen Sinn) */}
        <div>
          <div className="text-[11px] opacity-70 font-medium mb-1.5">{labels.water[lang]}</div>
          <div className="flex gap-2">
            <TrendBtn active={water === 'f'} onClick={() => setWater('f')}>↓ {labels.falling[lang]}</TrendBtn>
            <TrendBtn active={water === 's'} onClick={() => setWater('s')}>— {labels.static[lang]}</TrendBtn>
          </div>
        </div>

        {/* EC */}
        <div>
          <div className="text-[11px] opacity-70 font-medium mb-1.5">{labels.ec[lang]}</div>
          <div className="flex gap-2">
            <TrendBtn active={ec === 'f'} onClick={() => setEc('f')}>↓ {labels.falling[lang]}</TrendBtn>
            <TrendBtn active={ec === 's'} onClick={() => setEc('s')}>— {labels.static[lang]}</TrendBtn>
            <TrendBtn active={ec === 'r'} onClick={() => setEc('r')}>↑ {labels.rising[lang]}</TrendBtn>
          </div>
        </div>

        {/* pH */}
        <div>
          <div className="text-[11px] opacity-70 font-medium mb-1.5">{labels.ph[lang]}</div>
          <div className="flex gap-2">
            <TrendBtn active={ph === 'f'} onClick={() => setPh('f')}>↓ {labels.falling[lang]}</TrendBtn>
            <TrendBtn active={ph === 's'} onClick={() => setPh('s')}>— {labels.static[lang]}</TrendBtn>
            <TrendBtn active={ph === 'r'} onClick={() => setPh('r')}>↑ {labels.rising[lang]}</TrendBtn>
          </div>
        </div>
      </section>

      {/* Ergebnis */}
      {result && (
        <DiagCard
          ctx={ctx}
          kind={lang === 'de' ? 'Diagnose' : 'Diagnosis'}
          diag={{
            level: result.level,
            title: result.title,
            meaning: result.diagnose,
            action: result.action,
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// COLOR PICKER MODAL für Element-Farben
// ============================================================
function ColorPickerModal({ ctx, element, currentColor, onSelect, onClose }) {
  const { t, isDark } = ctx;
  const cardBg = isDark ? 'bg-neutral-800' : 'bg-white';
  const borderColor = isDark ? 'border-neutral-700' : 'border-neutral-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className={`${cardBg} border ${borderColor} rounded-2xl p-5 max-w-sm w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-2xl font-bold" style={{ color: currentColor }}>
            {t.elements[element] || element}
          </span>
          <span className="text-xs opacity-60">
            {t.settings.pickColor || (ctx.lang === 'de' ? 'Farbe wählen' : 'Pick a color')}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {ELEMENT_COLOR_PALETTE.map((color) => {
            const isSelected = color.toLowerCase() === currentColor.toLowerCase();
            return (
              <button
                key={color}
                onClick={() => onSelect(color)}
                className="relative rounded-lg flex items-center justify-center transition-transform"
                style={{
                  background: color,
                  height: '2.25rem',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                }}
                aria-label={color}
              >
                {isSelected && (
                  <Check size={18} className="text-white drop-shadow" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS VIEW
// ============================================================
function SettingsView({ ctx, setLang, setTheme, setSalts, accentKey, setAccentKey, accentAutoMode, setAccentAutoMode, setElementColorsOn, elementColors, setElementColors, saltLang, setSaltLang }) {
  const { t, lang, isDark, accent, elementColorsOn } = ctx;
  const [editingColors, setEditingColors] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState(null); // element key oder null

  // Cycling preview index for "Farbrotation" button — always animates through system colors
  const accentKeys = Object.keys(ACCENT_COLORS);
  const [rotIdx, setRotIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRotIdx(i => (i + 1) % accentKeys.length), 700);
    return () => clearInterval(id);
  }, [accentKeys.length]);

  const cardClass = isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200';

  const handleReset = () => {
    if (window.confirm(t.settings.confirmReset)) {
      setSalts(DEFAULT_SALTS);
    }
  };

  const handleRestoreDefaults = () => {
    if (window.confirm(t.db.restoreDefaults + '?')) {
      setSalts(currentSalts => {
        const customSalts = currentSalts.filter(s => !s.id.startsWith('def-'));
        return [...DEFAULT_SALTS, ...customSalts];
      });
    }
  };

  const handleResetElementColors = () => {
    if (window.confirm(t.settings.resetElementColors + '?')) {
      setElementColors({ ...ELEMENT_COLORS_DEFAULT });
    }
  };

  const updateElementColor = (el, color) => {
    setElementColors(prev => ({ ...prev, [el]: color }));
  };

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Globe size={16} /> {t.settings.language}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs opacity-60 mb-1">{lang === 'de' ? 'App-Sprache' : 'App language'}</label>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
              }`}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1">{lang === 'de' ? 'Salznamen' : 'Salt names'}</label>
            <select
              value={saltLang}
              onChange={e => setSaltLang(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
              }`}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </section>

      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          {isDark ? <Moon size={16} /> : <Sun size={16} />} {t.settings.theme}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SegmentButton active={isDark} onClick={() => setTheme('dark')} ctx={ctx}>{t.settings.dark}</SegmentButton>
          <SegmentButton active={!isDark} onClick={() => setTheme('light')} ctx={ctx}>{t.settings.light}</SegmentButton>
        </div>
      </section>

      {/* Akzentfarbe */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-3">{t.settings.accentColor}</h3>

        {/* Farb-Kacheln */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACCENT_COLORS).map(([key, c]) => {
            const active = accentAutoMode === null && key === accentKey;
            return (
              <button
                key={key}
                onClick={() => { setAccentAutoMode(null); setAccentKey(key); }}
                className="relative aspect-square rounded-xl flex items-center justify-center transition-transform"
                style={{
                  background: c.accent,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: active ? `0 0 0 3px ${isDark ? '#0a0a0a' : '#fff'}, 0 0 0 5px ${c.accent}` : 'none',
                }}
                aria-label={c.name}
              >
                {active && <Check size={20} className="text-white" />}
              </button>
            );
          })}
        </div>
        <div className="text-xs opacity-60 text-center mt-2">
          {accentAutoMode === 'rotation' ? 'Farbrotation' : accentAutoMode === 'rgb' ? 'RGB Übergang' : ACCENT_COLORS[accentKey].name}
        </div>

        {/* Auto-Modi */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Farbrotation — always cycles through system colors, no CSS transition between them */}
          <button
            onClick={() => setAccentAutoMode(m => m === 'rotation' ? null : 'rotation')}
            className="relative rounded-xl py-2.5 px-3 text-xs font-semibold flex flex-col items-center gap-0.5 overflow-hidden"
            style={{
              background: ACCENT_COLORS[accentKeys[rotIdx]].accent,
              color: '#fff',
              boxShadow: accentAutoMode === 'rotation' ? '0 0 0 2px #fff5, 0 2px 10px #0005' : '0 1px 3px #0003',
              transition: 'box-shadow 0.2s',
            }}
          >
            <span>Farbrotation</span>
            <span className="text-[9px] font-normal opacity-75">je Neustart</span>
            {accentAutoMode === 'rotation' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </button>

          {/* RGB — always shows the animated gradient */}
          <button
            onClick={() => setAccentAutoMode(m => m === 'rgb' ? null : 'rgb')}
            className="relative rounded-xl py-2.5 px-3 text-xs font-semibold flex flex-col items-center gap-0.5 overflow-hidden"
            style={{
              background: 'linear-gradient(90deg,#f43f5e,#f97316,#eab308,#22c55e,#06b6d4,#8b5cf6,#ec4899,#f43f5e)',
              backgroundSize: '200% 100%',
              animation: 'rgbShift 3s linear infinite',
              color: '#fff',
              boxShadow: accentAutoMode === 'rgb' ? '0 0 0 2px #fff5, 0 2px 10px #0005' : '0 1px 3px #0003',
              transition: 'box-shadow 0.2s',
            }}
          >
            <span>RGB</span>
            {accentAutoMode === 'rgb' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </button>
        </div>
      </section>

      {/* Elementfarben */}
      <section className={`rounded-xl border ${cardClass} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">{t.settings.elementColors}</h3>
          <Toggle checked={elementColorsOn} onChange={setElementColorsOn} ctx={ctx} />
        </div>
        <p className="text-xs opacity-60 mb-3">{t.settings.elementColorsHint}</p>

        {elementColorsOn && (
          <>
            <button
              onClick={() => setEditingColors(!editingColors)}
              className={`w-full text-xs py-2 rounded-lg border mb-2 ${
                isDark ? 'border-neutral-700 hover:bg-neutral-700' : 'border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {t.settings.customizeElements} {editingColors ? '▲' : '▼'}
            </button>

            {editingColors && (
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {ELEMENTS.filter(el => el !== 'Na').map(el => (
                    <button
                      key={el}
                      onClick={() => setColorPickerFor(el)}
                      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        <ElSymbol el={el} ctx={ctx} />
                      </span>
                      <span
                        className="rounded-md flex-shrink-0"
                        style={{
                          background: elementColors[el],
                          width: '2.75rem',
                          height: '1.5rem',
                        }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleResetElementColors}
                  className={`w-full mt-2 py-2 rounded-lg text-xs font-medium ${
                    isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {t.settings.resetElementColors}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Farb-Picker Modal */}
      {colorPickerFor && (
        <ColorPickerModal
          ctx={ctx}
          element={colorPickerFor}
          currentColor={elementColors[colorPickerFor]}
          onSelect={(color) => {
            updateElementColor(colorPickerFor, color);
            setColorPickerFor(null);
          }}
          onClose={() => setColorPickerFor(null)}
        />
      )}

      <section className={`rounded-xl border ${cardClass} p-4 space-y-2`}>
        <h3 className="text-sm font-semibold mb-2">{t.settings.data}</h3>
        <button
          onClick={handleRestoreDefaults}
          className={`w-full py-2.5 rounded-lg text-sm font-medium ${
            isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-100 hover:bg-neutral-200'
          }`}
        >
          {t.db.restoreDefaults}
        </button>
        <button
          onClick={handleReset}
          className={`w-full py-2.5 rounded-lg text-sm font-medium text-red-500 ${
            isDark ? 'bg-red-950/30 hover:bg-red-950/50' : 'bg-red-50 hover:bg-red-100'
          }`}
        >
          {t.settings.resetAll}
        </button>
      </section>

      <section className={`rounded-xl border ${cardClass} p-4`}>
        <h3 className="text-sm font-semibold mb-2">{t.settings.about}</h3>
        <p className="text-sm opacity-70 mb-1">{t.settings.desc}</p>
        <p className="text-xs opacity-50">{t.settings.version} 0.9.10</p>
      </section>
    </div>
  );
}
