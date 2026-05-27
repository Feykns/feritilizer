// ============================================================
// RECIPE DATA — Elemente, Beispiel-Rezept, Parser, Helfer
// ============================================================

// Spezielle Farbe für Ammonium (NH₄) — anders als Nitrat-N
const NH4_COLOR = '#9CCC65'; // helleres Triebgrün

const ELEMENT_DEFS = [
  { sym: 'N',  name: 'Stickstoff',  nameEN: 'Nitrogen',   color: '#7CB342', ordinal: 7  },
  { sym: 'P',  name: 'Phosphor',    nameEN: 'Phosphorus', color: '#E91E63', ordinal: 15 },
  { sym: 'K',  name: 'Kalium',      nameEN: 'Potassium',  color: '#7E57C2', ordinal: 19 },
  { sym: 'Mg', name: 'Magnesium',   nameEN: 'Magnesium',  color: '#26A69A', ordinal: 12 },
  { sym: 'Ca', name: 'Calcium',     nameEN: 'Calcium',    color: '#D4E157', ordinal: 20 },
  { sym: 'S',  name: 'Schwefel',    nameEN: 'Sulfur',     color: '#FDD835', ordinal: 16 },
  { sym: 'Mn', name: 'Mangan',      nameEN: 'Manganese',  color: '#FFAB91', ordinal: 25 },
  { sym: 'Fe', name: 'Eisen',       nameEN: 'Iron',       color: '#BF5B3A', ordinal: 26 },
  { sym: 'Zn', name: 'Zink',        nameEN: 'Zinc',       color: '#B0BEC5', ordinal: 30 },
  { sym: 'Cu', name: 'Kupfer',      nameEN: 'Copper',     color: '#1E88E5', ordinal: 29 },
  { sym: 'Co', name: 'Cobalt',      nameEN: 'Cobalt',     color: '#AD1457', ordinal: 27 },
  { sym: 'Ni', name: 'Nickel',      nameEN: 'Nickel',     color: '#00E5FF', ordinal: 28 },
  { sym: 'B',  name: 'Bor',         nameEN: 'Boron',      color: '#D7CCC8', ordinal: 5  },
  { sym: 'Mo', name: 'Molybdän',    nameEN: 'Molybdenum', color: '#6D4C41', ordinal: 42 },
  { sym: 'Cl', name: 'Chlor',       nameEN: 'Chlorine',   color: '#C0CA33', ordinal: 17 },
  { sym: 'Si', name: 'Silicium',    nameEN: 'Silicon',    color: '#81D4FA', ordinal: 14 },
];

const ELEMENT_BY_SYM = Object.fromEntries(ELEMENT_DEFS.map(e => [e.sym, e]));

// Themenfarben-Palette für Rezepte
const THEME_COLOR_PALETTE = [
  '#10b981', // emerald (default)
  '#7CB342', // grass
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#d946ef', // magenta
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#14b8a6', // teal
];

// ============================================================
// BEISPIEL-REZEPT (Englische Salznamen als Default)
// ============================================================
const SAMPLE_RECIPE = {
  id: 'r-flo-f10',
  name: 'Flo F10',
  themeColor: '#10b981',
  notes: '11.11% NH₄ — Mid · 0% NH₄ — Late',
  saltMode: 'kuerzel',
  measured: { EC: null, pH: null },
  targets: {
    N: 159.1, P: 126.23, K: 481.37, Mg: 64.83, Ca: 168.34, S: 242.72,
    Mn: 4.12, Fe: 3.96, Zn: 0.76, Cu: 0.2, Co: 0.26, Ni: 0.25,
    B: 3.03, Mo: 0.1, Cl: 33.77, Si: 50,
  },
  groups: [
    {
      id: 'g-ksi', name: '', volume: null, factor: null, mlPerL: null, kind: 'solo',
      salts: [
        { id: 's-ksi', shortName: 'KSi', formula: 'K₂SiO₃', name: 'Kaliumsilikat-Lösung', nameEN: 'Potassium Silicate Solution',
          mass: 226, massUnit: 'ml', pricePerKg: 9.00, contributions: { K: 37.59, Si: 52.88 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-pk', name: 'PK', volume: 5, factor: 500, mlPerL: 2, kind: 'stock',
      salts: [
        { id: 's-mkp', shortName: 'MKP', formula: 'KH₂PO₄', name: 'Monokaliumphosphat', nameEN: 'Monopotassium Phosphate',
          mass: 968.27, massUnit: 'g', pricePerKg: 5.50, contributions: { P: 87.88, K: 109.30 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-ab', name: 'AB', volume: 5, factor: 333, mlPerL: 3, kind: 'stock',
      salts: [
        { id: 's-kn', shortName: 'KN', formula: 'KNO₃', name: 'Kaliumnitrat', nameEN: 'Potassium Nitrate',
          mass: 1173.4, massUnit: 'g', pricePerKg: 4.20, contributions: { N: 96.55, K: 269.08 }, nh4Fraction: 0 },
        { id: 's-ks', shortName: 'KS', formula: 'K₂SO₄', name: 'Kaliumsulfat', nameEN: 'Potassium Sulfate',
          mass: 109.19, massUnit: 'g', pricePerKg: 3.20, contributions: { K: 28.31, S: 12.08 }, nh4Fraction: 0 },
        { id: 's-mgs', shortName: 'MgS', formula: 'MgSO₄·7H₂O', name: 'Magnesiumsulfat-Heptahydrat', nameEN: 'Magnesium Sulfate Heptahydrate',
          mass: 870.5, massUnit: 'g', pricePerKg: 1.80, contributions: { Mg: 51.55, S: 68.02 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-xa', name: 'xA', volume: 2, factor: 1333, mlPerL: 0.75, kind: 'stock',
      salts: [
        { id: 's-amn-a', shortName: 'AmN', formula: 'NH₄NO₃', name: 'Ammoniumnitrat', nameEN: 'Ammonium Nitrate',
          mass: 245.95, massUnit: 'g', pricePerKg: 3.00, contributions: { N: 31.82 }, nh4Fraction: 0.5 },
        { id: 's-mgn', shortName: 'MgN', formula: 'Mg(NO₃)₂·6H₂O', name: 'Magnesiumnitrat-Hexahydrat', nameEN: 'Magnesium Nitrate Hexahydrate',
          mass: 376.34, massUnit: 'g', pricePerKg: 4.00, contributions: { N: 14.82, Mg: 13.28 }, nh4Fraction: 0 },
        { id: 's-kcl', shortName: 'KCl', formula: 'KCl', name: 'Kaliumchlorid', nameEN: 'Potassium Chloride',
          mass: 189.11, massUnit: 'g', pricePerKg: 2.00, contributions: { K: 37.15, Cl: 33.77 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-xn', name: 'xN', volume: 0.1, factor: 10000, mlPerL: 0.1, kind: 'stock',
      salts: [
        { id: 's-amn-n', shortName: 'AmN', formula: 'NH₄NO₃', name: 'Ammoniumnitrat', nameEN: 'Ammonium Nitrate',
          mass: 46.12, massUnit: 'g', pricePerKg: 3.00, contributions: { N: 15.91 }, nh4Fraction: 0.5 }
      ]
    },
    {
      id: 'g-pk2', name: '+K', volume: 2, factor: 1000, mlPerL: 1, kind: 'stock',
      salts: [
        { id: 's-ks2', shortName: 'KS', formula: 'K₂SO₄', name: 'Kaliumsulfat', nameEN: 'Potassium Sulfate',
          mass: 172.12, massUnit: 'g', pricePerKg: 3.20, contributions: { K: 37.15, S: 15.86 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-topdress', name: 'Topdress', volume: null, factor: null, mlPerL: null, kind: 'topdress',
      salts: [
        { id: 's-cas', shortName: 'CaS', formula: 'CaSO₄·2H₂O', name: 'Calciumsulfat-Dihydrat', nameEN: 'Calcium Sulfate Dihydrate',
          mass: 58.89, massUnit: 'g', pricePerKg: 1.50, contributions: { Ca: 168.34, S: 134.78 }, nh4Fraction: 0 },
        { id: 's-pcal', shortName: 'PCal', formula: 'Ca₃(PO₄)₂', name: 'Tricalciumphosphat', nameEN: 'Tricalcium Phosphate',
          mass: 19.27, massUnit: 'g', pricePerKg: 4.00, contributions: { P: 38.35, Ca: 74.43 }, nh4Fraction: 0 }
      ]
    }
  ],
};

// ============================================================
// PARSER HELFER
// ============================================================

// Kristallwasser entfernen: "MgSO₄·7H₂O" → "MgSO₄"
function stripCrystalWater(formula) {
  if (!formula) return '';
  // Schneide am ersten Hydrat-Trenner ab (·, *, .)
  return formula.split(/[·*]/)[0].split(/\.\s*\d/)[0].trim();
}

// Hydrat-Suffix aus Voll-Namen entfernen: "Magnesiumsulfat-Heptahydrat" → "Magnesiumsulfat"
function stripHydrateSuffix(name) {
  if (!name) return '';
  return name.replace(/[\s-](Mono|Di|Tri|Tetra|Penta|Hexa|Hepta|Octa|Nona|Deca)?hydrat[e]?\b/gi, '').trim();
}

// ============================================================
// FÄRBUNG für VOLLE NAMEN (DE + EN, ganze Wörter mit Wortgrenzen)
// ============================================================
const FULL_NAME_PATTERNS = [
  // Längere Begriffe zuerst — sonst greift "Ammonium" vor "Ammoniumnitrat"
  { regex: /\bAmmonium\b/gi,                                color: NH4_COLOR },
  { regex: /\b(Nitrat|Nitrate)\b/gi,                        color: ELEMENT_BY_SYM.N.color },
  { regex: /\b(Phosphat|Phosphate)\b/gi,                    color: ELEMENT_BY_SYM.P.color },
  { regex: /\b(Sulfat|Sulfate|Sulphate)\b/gi,               color: ELEMENT_BY_SYM.S.color },
  { regex: /\b(Chlorid|Chloride)\b/gi,                      color: ELEMENT_BY_SYM.Cl.color },
  { regex: /\b(Silikat|Silicate)\b/gi,                      color: ELEMENT_BY_SYM.Si.color },
  { regex: /\b(Molybdat|Molybdate)\b/gi,                    color: ELEMENT_BY_SYM.Mo.color },
  { regex: /\b(Borat|Borate|Bors[aä]ure|Boric\s+Acid)\b/gi, color: ELEMENT_BY_SYM.B.color },
  { regex: /\b(Calcium|Kalzium)\b/gi,                       color: ELEMENT_BY_SYM.Ca.color },
  { regex: /\b(Kalium|Potassium)\b/gi,                      color: ELEMENT_BY_SYM.K.color },
  { regex: /\b(Magnesium)\b/gi,                             color: ELEMENT_BY_SYM.Mg.color },
  { regex: /\b(Natrium|Sodium)\b/gi,                        color: '#90A4AE' },
  { regex: /\b(Eisen|Iron|Ferr(?:o|i))\b/gi,                color: ELEMENT_BY_SYM.Fe.color },
  { regex: /\b(Mangan|Manganese)\b/gi,                      color: ELEMENT_BY_SYM.Mn.color },
  { regex: /\b(Zink|Zinc)\b/gi,                             color: ELEMENT_BY_SYM.Zn.color },
  { regex: /\b(Kupfer|Copper|Cupric)\b/gi,                  color: ELEMENT_BY_SYM.Cu.color },
  { regex: /\b(Kobalt|Cobalt)\b/gi,                         color: ELEMENT_BY_SYM.Co.color },
  { regex: /\b(Nickel)\b/gi,                                color: ELEMENT_BY_SYM.Ni.color },
  { regex: /\b(Molybd[aä]n|Molybdenum)\b/gi,                color: ELEMENT_BY_SYM.Mo.color },
  { regex: /\b(Stickstoff|Nitrogen)\b/gi,                   color: ELEMENT_BY_SYM.N.color },
  { regex: /\b(Schwefel|Sulfur|Sulphur)\b/gi,               color: ELEMENT_BY_SYM.S.color },
  { regex: /\b(Phosphor|Phosphorus)\b/gi,                   color: ELEMENT_BY_SYM.P.color },
];

function colorizeFullName(text, useColor) {
  if (!useColor || !text) return [{ text }];
  // Sammle alle Treffer
  const matches = [];
  FULL_NAME_PATTERNS.forEach(({ regex, color }) => {
    let m;
    const re = new RegExp(regex.source, regex.flags);
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, color, text: m[0] });
    }
  });
  // Bei Überlappung: längeren Match bevorzugen
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) { accepted.push(m); lastEnd = m.end; }
  }
  // Baue Token-Array
  const result = [];
  let cursor = 0;
  accepted.forEach(m => {
    if (m.start > cursor) result.push({ text: text.slice(cursor, m.start) });
    result.push({ text: text.slice(m.start, m.end), color: m.color });
    cursor = m.end;
  });
  if (cursor < text.length) result.push({ text: text.slice(cursor) });
  return result;
}

// ============================================================
// FÄRBUNG für KÜRZEL — Element-Symbol-Tokenisierung
// Sonderregel: "Am" = Ammonium (NH₄-Farbe)
// ============================================================
function colorizeKuerzel(text, useColor) {
  if (!useColor || !text) return [{ text }];
  const parts = [];
  let i = 0;
  while (i < text.length) {
    let matched = null;

    // Special: "Am" → NH₄
    if (text.slice(i, i + 2) === 'Am') {
      matched = { len: 2, color: NH4_COLOR };
    }

    // Special: "Na" → Natrium (Sodium-Grau, sichtbar aber nicht prominent)
    if (!matched && text.slice(i, i + 2) === 'Na') {
      matched = { len: 2, color: '#90A4AE' };
    }

    // 2-Buchstaben-Symbol (Mg, Ca, Mn, Fe, Zn, Cu, Co, Ni, Cl, Mo, Si)
    if (!matched && i + 1 < text.length) {
      const two = text.slice(i, i + 2);
      const def = ELEMENT_BY_SYM[two];
      if (def) matched = { len: 2, color: def.color };
    }

    // 1-Buchstaben-Symbol (K, N, P, S, B)
    if (!matched) {
      const ch = text[i];
      const def = ELEMENT_BY_SYM[ch];
      if (def) matched = { len: 1, color: def.color };
    }

    if (matched) {
      parts.push({ text: text.slice(i, i + matched.len), color: matched.color });
      i += matched.len;
    } else {
      // Sammle bis nächster Großbuchstabe
      let j = i + 1;
      while (j < text.length && !/[A-Z]/.test(text[j])) j++;
      parts.push({ text: text.slice(i, j) });
      i = j;
    }
  }
  return parts;
}

// ============================================================
// FÄRBUNG für FORMEL (ohne Kristallwasser, mit NH₄-Erkennung)
// ============================================================
function colorizeFormula(formula, useColor) {
  if (!formula) return [{ text: '' }];
  const cleaned = stripCrystalWater(formula);

  // Erst tokenisieren
  const tokens = [];
  let i = 0;
  const s = cleaned;
  while (i < s.length) {
    const ch = s[i];
    if (/[A-Z]/.test(ch)) {
      let sym = ch; i++;
      if (i < s.length && /[a-z]/.test(s[i])) { sym += s[i]; i++; }
      tokens.push({ type: 'el', sym });
    } else if (/[0-9₀-₉]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9₀-₉]/.test(s[i])) { num += s[i]; i++; }
      tokens.push({ type: 'sub', text: num });
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', text: ch }); i++;
    } else {
      tokens.push({ type: 'other', text: ch }); i++;
    }
  }

  // NH₄-Erkennung: N gefolgt von H mit Subscript 4 → NH₄
  const enriched = tokens.map((tk, idx) => {
    if (tk.type === 'el' && tk.sym === 'N') {
      const next = tokens[idx + 1];
      const after = tokens[idx + 2];
      const isNH4 = next?.type === 'el' && next.sym === 'H' &&
                    (after?.type === 'sub' && (after.text === '4' || after.text === '₄'));
      return { ...tk, isNH4 };
    }
    return tk;
  });

  // Färbung
  if (!useColor) {
    return enriched.map(tk => ({ text: tk.text || tk.sym, subscript: tk.type === 'sub' }));
  }
  return enriched.map(tk => {
    if (tk.type === 'el') {
      const def = ELEMENT_BY_SYM[tk.sym];
      const color = tk.isNH4 ? NH4_COLOR : def?.color;
      return { text: tk.sym, color };
    }
    if (tk.type === 'sub') {
      return { text: tk.text, subscript: true };
    }
    return { text: tk.text };
  });
}

// ============================================================
// SALZNAME nach Modus + Sprache anzeigen
// ============================================================
function getSaltDisplay(salt, mode, lang = 'en') {
  if (mode === 'formula') {
    return { text: stripCrystalWater(salt.formula || salt.shortName || ''), mode: 'formula' };
  }
  if (mode === 'name') {
    const full = lang === 'de' ? (salt.name || salt.nameEN) : (salt.nameEN || salt.name);
    return { text: stripHydrateSuffix(full || ''), mode: 'name' };
  }
  return { text: salt.shortName || salt.formula || salt.name, mode: 'kuerzel' };
}

function colorizeSaltDisplay(display, useColor) {
  if (display.mode === 'formula') return colorizeFormula(display.text, useColor);
  if (display.mode === 'name')    return colorizeFullName(display.text, useColor);
  return colorizeKuerzel(display.text, useColor);
}

// ============================================================
// BERECHNUNGEN
// ============================================================
function calculateTotals(recipe) {
  const totals = {};
  ELEMENT_DEFS.forEach(e => { totals[e.sym] = 0; });
  recipe.groups.forEach(g => {
    g.salts.forEach(s => {
      Object.entries(s.contributions || {}).forEach(([sym, val]) => {
        totals[sym] = (totals[sym] || 0) + (val || 0);
      });
    });
  });
  return totals;
}

function calculateNH4Stats(recipe) {
  let nh4 = 0, nTotal = 0;
  recipe.groups.forEach(g => {
    g.salts.forEach(s => {
      const n = s.contributions?.N || 0;
      nTotal += n;
      nh4 += n * (s.nh4Fraction || 0);
    });
  });
  return { nh4, no3: nTotal - nh4, nTotal, nh4Pct: nTotal > 0 ? (nh4 / nTotal) * 100 : 0 };
}

function elementsInGroup(group) {
  const set = new Set();
  group.salts.forEach(s => {
    Object.entries(s.contributions || {}).forEach(([sym, val]) => {
      if ((val || 0) > 0) set.add(sym);
    });
  });
  return ELEMENT_DEFS.filter(e => set.has(e.sym)).map(e => e.sym);
}

// Zahl-Formatierung
function fmtMass(value) {
  if (value === null || value === undefined) return '–';
  const n = Number(value);
  if (isNaN(n)) return '–';
  return n.toFixed(2);
}
function fmtPpm(value, isMicro = false) {
  if (value === null || value === undefined) return '–';
  const n = Number(value);
  if (isNaN(n)) return '–';
  return n < 1 ? n.toFixed(2) : n.toFixed(1);
}

// Export
Object.assign(window, {
  ELEMENT_DEFS, ELEMENT_BY_SYM, SAMPLE_RECIPE, NH4_COLOR, THEME_COLOR_PALETTE,
  calculateTotals, calculateNH4Stats, elementsInGroup,
  getSaltDisplay, colorizeSaltDisplay, colorizeFullName, colorizeKuerzel, colorizeFormula,
  stripCrystalWater, stripHydrateSuffix, fmtMass, fmtPpm,
});
