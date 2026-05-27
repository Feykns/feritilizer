// ============================================================
// RECIPE TABLE — Data, constants, helpers
// ============================================================

export const NH4_COLOR = '#9CCC65';

export const ELEMENT_DEFS = [
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

export const ELEMENT_BY_SYM = Object.fromEntries(ELEMENT_DEFS.map(e => [e.sym, e]));

// Map recipe sym (N, P, K…) to app elementColors key (N-NO3, P, K…)
export function appColorKey(sym) {
  if (sym === 'N') return 'N-NO3';
  return sym;
}

// Get element color: override map first, then ELEMENT_DEFS default
export function getElColor(sym, overrideColors) {
  if (overrideColors) {
    const key = appColorKey(sym);
    if (overrideColors[key]) return overrideColors[key];
  }
  return ELEMENT_BY_SYM[sym]?.color;
}

export function getNH4Color(overrideColors) {
  if (overrideColors && overrideColors['N-NH4']) return overrideColors['N-NH4'];
  return NH4_COLOR;
}

export const THEME_COLOR_PALETTE = [
  '#10b981', '#7CB342', '#0ea5e9', '#8b5cf6',
  '#d946ef', '#f43f5e', '#f59e0b', '#14b8a6',
];

// ============================================================
// SHORT NAME MAP
// ============================================================
const SHORT_NAME_MAP = {
  'KNO3': 'KN',
  '5Ca(NO3)2·NH4NO3·10H2O': 'CaN',
  'NH4NO3': 'AmN',
  'NH4Cl': 'AmCl',
  '(NH4)2SO4': 'AmS',
  'Mg(NO3)2·6H2O': 'MgN',
  'K2SO4': 'KS',
  'MgSO4·7H2O': 'MgS',
  'KH2PO4': 'MKP',
  'NH4H2PO4': 'MAP',
  '(NH4)2HPO4': 'DAP',
  'KCl': 'KCl',
  'FeSO4·7H2O': 'FeS',
  'MnSO4·H2O': 'MnS',
  'ZnSO4·7H2O': 'ZnS',
  'CuSO4·5H2O': 'CuS',
  'H3BO3': 'BA',
  'HNO3': 'NA',
  'H2SO4': 'SA',
  'H3PO4': 'PA',
  'Na2MoO4·2H2O': 'MoNa',
  'K2SiO3': 'KSi',
  'CaSO4·2H2O': 'CaS',
  'CaCO3': 'CaC',
  'Ca3(PO4)2': 'PCal',
};

export function getShortName(formula, name) {
  if (formula && SHORT_NAME_MAP[formula]) return SHORT_NAME_MAP[formula];
  const base = formula ? formula.split(/[·*]/)[0].replace(/[0-9()]/g, '').slice(0, 4) : '';
  if (base) return base;
  return name ? name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase() : '?';
}

// ============================================================
// SALT CONVERSION (DEFAULT_SALTS → recipe salt format)
// ============================================================
function combineNComposition(comp) {
  const out = {};
  Object.entries(comp).forEach(([k, v]) => {
    if (!v) return;
    if (k === 'N-NO3' || k === 'N-NH4') return;
    if (k === 'Na') return;
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

export function buildAvailableSalts(appSalts) {
  return appSalts.map(s => ({
    id: s.id,
    shortName: getShortName(s.formula, s.name),
    formula: s.formula,
    name: s.name,
    nameEN: s.name,
    pricePerKg: s.price > 0 ? s.price : undefined,
    contributions: combineNComposition(s.composition),
    nh4Fraction: computeNh4Fraction(s.composition),
    solubility: s.solubility,
    type: s.type || 'salt',
    dosePerL: s.dosePerL ?? null,
    doseUnit: s.doseUnit || null,
  }));
}

// ============================================================
// MISCHREIHENFOLGE (mixing order)
//  Tiers: 0 Silizium · 1 basisch · 2 sauer (Phosphat/Säuren) · 3 Salze
//         (Sulfat/Nitrat) · 4 Sonstiges. Innerhalb eines Tiers: höhere
//  Ionen-Summe (ppm) zuerst. Salz-Tier: ppm zuerst, Gleichstand
//  Sulfat→Misch→Nitrat. Unlösliche Stoffe sind ausgenommen.
// ============================================================
export function isSaltSoluble(salt) {
  if (salt.solubility != null && salt.solubility !== '') return Number(salt.solubility) >= 1;
  const f = salt.formula || '';
  if (/Ca3\(PO4\)2|Ca₃\(PO₄\)₂|CaCO3|CaCO₃|CaSiO|CaSiO₃/.test(f)) return false;
  return true; // unbekannt → als löslich behandeln
}
const saltIsSoluble = isSaltSoluble;
function normFormula(f) {
  return (f || '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, d => '₀₁₂₃₄₅₆₇₈₉'.indexOf(d).toString());
}
function saltMixFlags(salt) {
  const f = normFormula(salt.formula);
  const c = salt.contributions || {};
  const soluble = saltIsSoluble(salt);
  const isAcid = /^H[0-9]*[A-Z]/.test(f);          // HNO3, H2SO4, H3PO4, H3BO3 …
  const isBoricAcid = isAcid && (c.B || 0) > 0;     // Borsäure → Mikronährstoff, nicht pH
  return {
    si:       soluble && (c.Si || 0) > 0,
    base:     soluble && /OH/.test(f),
    phosphate:soluble && /PO4/.test(f),
    sulfate:  soluble && /SO4/.test(f),
    nitrate:  soluble && /NO3/.test(f),
    acid:     soluble && isAcid && !isBoricAcid,
  };
}
function groupMixInfo(group) {
  const flags = (group.salts || []).map(saltMixFlags);
  const any = (k) => flags.some(fl => fl[k]);
  const ppm = (group.salts || []).reduce((sum, s) =>
    sum + Object.values(s.contributions || {}).reduce((a, b) => a + (b || 0), 0), 0);
  let tier, anionClass = 1;
  if (any('si')) tier = 0;
  else if (any('base')) tier = 1;
  else if (any('acid') || any('phosphate')) tier = 2;
  else if (any('sulfate') || any('nitrate')) {
    tier = 3;
    const s = any('sulfate'), n = any('nitrate');
    anionClass = (s && n) ? 1 : s ? 0 : 2; // Sulfat=0, Misch=1, Nitrat=2
  } else tier = 4;
  return { tier, anionClass, ppm };
}
// Salz in eine andere Gruppe übernehmen: ppm-Beiträge zur Endlösung bleiben
// erhalten, die nötige Masse wird für Faktor/Volumen der Zielgruppe neu berechnet.
export function recomputeSaltForGroup(salt, targetGroup) {
  const pcts = salt._pcts || {};
  const isTopdress = targetGroup.kind === 'topdress';
  const isSolo = targetGroup.kind === 'solo';
  const factor = isSolo ? 1 : (targetGroup.factor || 1);
  const volume = targetGroup.volume || 1;
  const refSym = Object.keys(pcts).find(sym => (pcts[sym] || 0) > 0 && (salt.contributions?.[sym] || 0) > 0);
  // Keine Umrechnungsbasis (kein _pcts / keine passenden Beiträge) → Beiträge (ppm)
  // unverändert übernehmen, Masse beibehalten. Verhindert leere Salze beim Verschieben.
  if (!refSym) {
    return { ...salt, _groupFactor: factor, _groupVolume: volume, _groupKind: targetGroup.kind };
  }
  const pct = pcts[refSym];
  const contrib = salt.contributions[refSym];
  const mass = isTopdress ? (contrib * 100 / pct) : (contrib * factor * volume * 100 / (pct * 1000));
  const contributions = {};
  Object.entries(pcts).forEach(([sym, p]) => {
    contributions[sym] = isTopdress ? (p * mass / 100) : computeContribution(mass, p, factor, volume);
  });
  return {
    ...salt, mass, massUnit: salt.massUnit || 'g', contributions,
    _groupFactor: factor, _groupVolume: volume, _groupKind: targetGroup.kind,
  };
}

// Dosieranleitung-Einträge: Konzentrat = 1 Eintrag/Gruppe; Endlösung/Topdress =
// 1 Eintrag je Salz. Reihenfolge:
//   Bucket 0 – Stock-Gruppen + lösliche Solo-Salze (chemische Mischreihenfolge)
//   Bucket 1 – Unlösliche Solo-Salze (z. B. Tricalciumphosphat, CaCO3) — ganz
//              ans Ende der Endlösung, vor Topdress
//   Bucket 2 – Topdress
//   Bucket 3 – Foliar (ganz zuletzt)
//
// Phasen-Ausnahmeregel (innerhalb Bucket 0):
//   Werden phases + combinations übergeben und ist mindestens eine Phase
//   angelegt, dann werden Gruppen primär nach der FRÜHESTEN PHASE, in der
//   sie verwendet werden, sortiert (sekundär: chemische Mischreihenfolge).
//   Effekt: Eine Gruppe, die erst spät zum Einsatz kommt, rutscht in der
//   Tabelle nach rechts — auch wenn sie chemisch eine frühe Priorität hat.
//   So entstehen keine leeren Spalten zwischen den genutzten.
//   Gruppen, die in KEINER Phase verwendet werden, landen am Ende der
//   Stock-Spalten (Phase-Index = Infinity).
//   Ist keine Phase angelegt, gilt rein die chemische Mischreihenfolge.
//
// Innerhalb von Bucket 0 greift `groupMixInfo` auch auf einzelne Solo-Salze:
// jedes lösliche Solo-Salz bekommt seinen eigenen Tier (Si → Base → Phosphat/
// Säure → Sulfat/Nitrat → Sonstiges) und reiht sich entsprechend zwischen den
// Stock-Gruppen ein. Dadurch funktioniert die Mischreihenfolge auch für
// Solo-Salze in einer Endlösung.
export function dosingItemsInOrder(groups, options = {}) {
  const { phases = [], combinations = [] } = options;

  // Mapping comboId → Set<groupId> für schnellen Lookup
  const comboGroupIds = new Map();
  (combinations || []).forEach(c => {
    comboGroupIds.set(c.id, new Set(c.groupIds || []));
  });

  // Für jede Gruppe: Index der frühesten Phase, in der sie verwendet wird.
  // Infinity = nie verwendet → sortiert ans Ende des Buckets.
  // Leere Map, wenn keine Phasen angelegt → Phasen-Logik wird übersprungen.
  const earliestPhaseByGroup = new Map();
  const hasPhases = (phases || []).length > 0;
  if (hasPhases) {
    (groups || []).forEach(g => {
      let earliest = Infinity;
      (phases || []).forEach((phase, idx) => {
        const gids = comboGroupIds.get(phase.ecId);
        if (gids && gids.has(g.id) && idx < earliest) earliest = idx;
      });
      earliestPhaseByGroup.set(g.id, earliest);
    });
  }

  const items = [];
  (groups || []).forEach(g => {
    if (g.kind === 'solo' || g.kind === 'topdress') {
      (g.salts || []).forEach(s => items.push({ key: `${g.id}::${s.id}`, type: 'salt', group: g, salt: s }));
    } else {
      items.push({ key: g.id, type: 'group', group: g });
    }
  });
  const withInfo = items.map((it, i) => {
    const salts = it.type === 'group' ? (it.group.salts || []) : [it.salt];
    const info = groupMixInfo({ salts });
    // Bucket-Zuordnung (siehe Kommentar oben):
    let bucket;
    if (it.group.foliar) bucket = 3;
    else if (it.group.kind === 'topdress') bucket = 2;
    else if (it.type === 'salt' && it.group.kind === 'solo' && !saltIsSoluble(it.salt)) bucket = 1;
    else bucket = 0;
    const earliestPhase = hasPhases
      ? (earliestPhaseByGroup.get(it.group.id) ?? Infinity)
      : 0;
    return { ...it, info, bucket, earliestPhase, _i: i };
  });
  withInfo.sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    // Phasen-Ausnahmeregel (NUR Bucket 0, NUR wenn Phasen existieren):
    // Gruppen, die in einer früheren Phase zum Einsatz kommen, zuerst.
    if (a.bucket === 0 && hasPhases && a.earliestPhase !== b.earliestPhase) {
      return a.earliestPhase - b.earliestPhase;
    }
    if (a.info.tier !== b.info.tier) return a.info.tier - b.info.tier;
    // Innerhalb Tier 3: Sulfat(0) → Misch(1) → Nitrat(2) — BEVOR ppm verglichen wird,
    // damit reine Nitrat-Gruppen immer nach Sulfat-Gruppen kommen, unabhängig von der Menge.
    if (a.info.tier === 3 && a.info.anionClass !== b.info.anionClass) return a.info.anionClass - b.info.anionClass;
    if (b.info.ppm !== a.info.ppm) return b.info.ppm - a.info.ppm;
    return a._i - b._i;
  });
  return withInfo;
}

export function sortGroupsByMixingOrder(groups) {
  return (groups || [])
    .map((g, i) => ({ g, i, info: groupMixInfo(g) }))
    .sort((a, b) => {
      if (a.info.tier !== b.info.tier) return a.info.tier - b.info.tier;
      // Innerhalb Tier 3: Sulfat(0) → Misch(1) → Nitrat(2) zuerst, dann ppm
      if (a.info.tier === 3 && a.info.anionClass !== b.info.anionClass) return a.info.anionClass - b.info.anionClass;
      if (b.info.ppm !== a.info.ppm) return b.info.ppm - a.info.ppm; // höhere Konzentration zuerst
      return a.i - b.i; // stabil
    })
    .map(x => x.g);
}

// ============================================================
// CONTRIBUTION CALCULATION
// final_ppm = (massG × elementPct/100) / (factor × volumeL) × 1000
// For solo groups: use factor=1
// ============================================================
export function computeContribution(massG, elementPct, factor, volumeL) {
  if (!factor || !volumeL) return 0;
  return (massG * elementPct / 100) / (factor * volumeL) * 1000;
}

// ============================================================
// SAMPLE RECIPE
// ============================================================
export const SAMPLE_RECIPE = {
  id: 'r-flo-f10',
  name: 'Flo F10',
  themeColor: '#10b981',
  notes: '11.11% NH₄ — Mid · 0% NH₄ — Late',
  saltMode: 'kuerzel',
  measured: { pH: null, pHTarget: null, phAdjust: {}, ecValues: [] },
  targets: {
    N: 159.1, P: 126.23, K: 481.37, Mg: 64.83, Ca: 168.34, S: 242.72,
    Mn: 4.12, Fe: 3.96, Zn: 0.76, Cu: 0.2, Co: 0.26, Ni: 0.25,
    B: 3.03, Mo: 0.1, Cl: 33.77, Si: 50,
  },
  groups: [
    {
      id: 'g-ksi', name: '', volume: null, factor: null, mlPerL: null, kind: 'solo',
      salts: [
        { id: 's-ksi', shortName: 'KSi', formula: 'K₂SiO₃', name: 'Potassium Silicate Solution', nameEN: 'Potassium Silicate Solution',
          mass: 226, massUnit: 'ml', pricePerKg: 9.00, contributions: { K: 37.59, Si: 52.88 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-pk', name: 'PK', volume: 5, factor: 500, mlPerL: 2, kind: 'stock',
      salts: [
        { id: 's-mkp', shortName: 'MKP', formula: 'KH₂PO₄', name: 'Monopotassium Phosphate', nameEN: 'Monopotassium Phosphate',
          mass: 968.27, massUnit: 'g', pricePerKg: 5.50, contributions: { P: 87.88, K: 109.30 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-ab', name: 'AB', volume: 5, factor: 333, mlPerL: 3, kind: 'stock',
      salts: [
        { id: 's-kn', shortName: 'KN', formula: 'KNO₃', name: 'Potassium Nitrate', nameEN: 'Potassium Nitrate',
          mass: 1173.4, massUnit: 'g', pricePerKg: 4.20, contributions: { N: 96.55, K: 269.08 }, nh4Fraction: 0 },
        { id: 's-ks', shortName: 'KS', formula: 'K₂SO₄', name: 'Potassium Sulfate', nameEN: 'Potassium Sulfate',
          mass: 109.19, massUnit: 'g', pricePerKg: 3.20, contributions: { K: 28.31, S: 12.08 }, nh4Fraction: 0 },
        { id: 's-mgs', shortName: 'MgS', formula: 'MgSO₄·7H₂O', name: 'Magnesium Sulfate Heptahydrate', nameEN: 'Magnesium Sulfate Heptahydrate',
          mass: 870.5, massUnit: 'g', pricePerKg: 1.80, contributions: { Mg: 51.55, S: 68.02 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-xa', name: 'xA', volume: 2, factor: 1333, mlPerL: 0.75, kind: 'stock',
      salts: [
        { id: 's-amn-a', shortName: 'AmN', formula: 'NH₄NO₃', name: 'Ammonium Nitrate', nameEN: 'Ammonium Nitrate',
          mass: 245.95, massUnit: 'g', pricePerKg: 3.00, contributions: { N: 31.82 }, nh4Fraction: 0.5 },
        { id: 's-mgn', shortName: 'MgN', formula: 'Mg(NO₃)₂·6H₂O', name: 'Magnesium Nitrate Hexahydrate', nameEN: 'Magnesium Nitrate Hexahydrate',
          mass: 376.34, massUnit: 'g', pricePerKg: 4.00, contributions: { N: 14.82, Mg: 13.28 }, nh4Fraction: 0 },
        { id: 's-kcl', shortName: 'KCl', formula: 'KCl', name: 'Potassium Chloride', nameEN: 'Potassium Chloride',
          mass: 189.11, massUnit: 'g', pricePerKg: 2.00, contributions: { K: 37.15, Cl: 33.77 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-xn', name: 'xN', volume: 0.1, factor: 10000, mlPerL: 0.1, kind: 'stock',
      salts: [
        { id: 's-amn-n', shortName: 'AmN', formula: 'NH₄NO₃', name: 'Ammonium Nitrate', nameEN: 'Ammonium Nitrate',
          mass: 46.12, massUnit: 'g', pricePerKg: 3.00, contributions: { N: 15.91 }, nh4Fraction: 0.5 }
      ]
    },
    {
      id: 'g-pk2', name: '+K', volume: 2, factor: 1000, mlPerL: 1, kind: 'stock',
      salts: [
        { id: 's-ks2', shortName: 'KS', formula: 'K₂SO₄', name: 'Potassium Sulfate', nameEN: 'Potassium Sulfate',
          mass: 172.12, massUnit: 'g', pricePerKg: 3.20, contributions: { K: 37.15, S: 15.86 }, nh4Fraction: 0 }
      ]
    },
    {
      id: 'g-topdress', name: 'Topdress', volume: null, factor: null, mlPerL: null, kind: 'topdress',
      salts: [
        { id: 's-cas', shortName: 'CaS', formula: 'CaSO₄·2H₂O', name: 'Calcium Sulfate Dihydrate', nameEN: 'Calcium Sulfate Dihydrate',
          mass: 58.89, massUnit: 'g', pricePerKg: 1.50, contributions: { Ca: 168.34, S: 134.78 }, nh4Fraction: 0 },
        { id: 's-pcal', shortName: 'PCal', formula: 'Ca₃(PO₄)₂', name: 'Tricalcium Phosphate', nameEN: 'Tricalcium Phosphate',
          mass: 19.27, massUnit: 'g', pricePerKg: 4.00, contributions: { P: 38.35, Ca: 74.43 }, nh4Fraction: 0 }
      ]
    }
  ],
};

// ============================================================
// PARSER HELPERS
// ============================================================
export function stripCrystalWater(formula) {
  if (!formula) return '';
  return formula.split(/[·*]/)[0].split(/\.\s*\d/)[0].trim();
}

export function stripHydrateSuffix(name) {
  if (!name) return '';
  return name.replace(/[\s-](Mono|Di|Tri|Tetra|Penta|Hexa|Hepta|Octa|Nona|Deca)?hydrat[e]?\b/gi, '').trim();
}

// ============================================================
// COLORIZE FUNCTIONS — all accept optional overrideColors map
// ============================================================
export function colorizeFullName(text, useColor, overrideColors) {
  if (!useColor || !text) return [{ text }];
  const nh4Col = getNH4Color(overrideColors);
  const getC = (sym) => getElColor(sym, overrideColors);
  const patterns = [
    { regex: /\bAmmonium\b/gi,                                 color: nh4Col },
    { regex: /\b(Nitrat|Nitrate)\b/gi,                         color: getC('N') },
    { regex: /\b(Phosphat|Phosphate)\b/gi,                     color: getC('P') },
    { regex: /\b(Sulfat|Sulfate|Sulphate)\b/gi,                color: getC('S') },
    { regex: /\b(Chlorid|Chloride)\b/gi,                       color: getC('Cl') },
    { regex: /\b(Silikat|Silicate)\b/gi,                       color: getC('Si') },
    { regex: /\b(Molybdat|Molybdate)\b/gi,                     color: getC('Mo') },
    { regex: /\b(Borat|Borate|Bors[aä]ure|Boric\s+Acid)\b/gi, color: getC('B') },
    { regex: /\b(Calcium|Kalzium)\b/gi,                        color: getC('Ca') },
    { regex: /\b(Kalium|Potassium)\b/gi,                       color: getC('K') },
    { regex: /\b(Magnesium)\b/gi,                              color: getC('Mg') },
    { regex: /\b(Natrium|Sodium)\b/gi,                         color: '#90A4AE' },
    { regex: /\b(Eisen|Iron|Ferr(?:o|i))\b/gi,                 color: getC('Fe') },
    { regex: /\b(Mangan|Manganese)\b/gi,                       color: getC('Mn') },
    { regex: /\b(Zink|Zinc)\b/gi,                              color: getC('Zn') },
    { regex: /\b(Kupfer|Copper|Cupric)\b/gi,                   color: getC('Cu') },
    { regex: /\b(Kobalt|Cobalt)\b/gi,                          color: getC('Co') },
    { regex: /\b(Nickel)\b/gi,                                 color: getC('Ni') },
    { regex: /\b(Molybd[aä]n|Molybdenum)\b/gi,                 color: getC('Mo') },
    { regex: /\b(Stickstoff|Nitrogen)\b/gi,                    color: getC('N') },
    { regex: /\b(Schwefel|Sulfur|Sulphur)\b/gi,                color: getC('S') },
    { regex: /\b(Phosphor|Phosphorus)\b/gi,                    color: getC('P') },
  ];
  const matches = [];
  patterns.forEach(({ regex, color }) => {
    let m;
    const re = new RegExp(regex.source, regex.flags);
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, color, text: m[0] });
    }
  });
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const accepted = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) { accepted.push(m); lastEnd = m.end; }
  }
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

export function colorizeKuerzel(text, useColor, overrideColors) {
  if (!useColor || !text) return [{ text }];
  const nh4Col = getNH4Color(overrideColors);
  const parts = [];
  let i = 0;
  while (i < text.length) {
    let matched = null;
    if (text.slice(i, i + 2) === 'Am') {
      matched = { len: 2, color: nh4Col };
    }
    if (!matched && text.slice(i, i + 2) === 'Na') {
      matched = { len: 2, color: '#90A4AE' };
    }
    if (!matched && i + 1 < text.length) {
      const two = text.slice(i, i + 2);
      if (ELEMENT_BY_SYM[two]) matched = { len: 2, color: getElColor(two, overrideColors) };
    }
    if (!matched) {
      const ch = text[i];
      if (ELEMENT_BY_SYM[ch]) matched = { len: 1, color: getElColor(ch, overrideColors) };
    }
    if (matched) {
      parts.push({ text: text.slice(i, i + matched.len), color: matched.color });
      i += matched.len;
    } else {
      let j = i + 1;
      while (j < text.length && !/[A-Z]/.test(text[j])) j++;
      parts.push({ text: text.slice(i, j) });
      i = j;
    }
  }
  return parts;
}

export function colorizeFormula(formula, useColor, overrideColors) {
  if (!formula) return [{ text: '' }];
  const cleaned = stripCrystalWater(formula);
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
  if (!useColor) {
    return enriched.map(tk => ({ text: tk.text || tk.sym, subscript: tk.type === 'sub' }));
  }
  const nh4Col = getNH4Color(overrideColors);
  return enriched.map(tk => {
    if (tk.type === 'el') {
      const color = tk.isNH4 ? nh4Col : getElColor(tk.sym, overrideColors);
      return { text: tk.sym, color };
    }
    if (tk.type === 'sub') return { text: tk.text, subscript: true };
    return { text: tk.text };
  });
}

export function getSaltDisplay(salt, mode, lang = 'en') {
  if (mode === 'formula') {
    return { text: stripCrystalWater(salt.formula || salt.shortName || ''), mode: 'formula' };
  }
  if (mode === 'name') {
    const full = lang === 'de' ? (salt.name || salt.nameEN) : (salt.nameEN || salt.name);
    return { text: stripHydrateSuffix(full || ''), mode: 'name' };
  }
  return { text: salt.shortName || salt.formula || salt.name, mode: 'kuerzel' };
}

export function colorizeSaltDisplay(display, useColor, overrideColors) {
  if (display.mode === 'formula') return colorizeFormula(display.text, useColor, overrideColors);
  if (display.mode === 'name')    return colorizeFullName(display.text, useColor, overrideColors);
  return colorizeKuerzel(display.text, useColor, overrideColors);
}

// ============================================================
// CALCULATIONS
// ============================================================
// Gesamtbilanz der Wurzel-Nährlösung. Foliar- und Topdress-Gruppen werden
// ausdrücklich AUSGESCHLOSSEN — sie liefern Nährstoffe separat (Blattspray /
// Bodenauflage) und sollen die Bilanz/Zielerreichung der Tropf-/Reservoir-Lösung
// nicht beeinflussen.
export function calculateTotals(recipe) {
  const totals = {};
  ELEMENT_DEFS.forEach(e => { totals[e.sym] = 0; });
  recipe.groups.forEach(g => {
    if (g.foliar || g.kind === 'topdress') return;
    g.salts.forEach(s => {
      Object.entries(s.contributions || {}).forEach(([sym, val]) => {
        totals[sym] = (totals[sym] || 0) + (val || 0);
      });
    });
  });
  return totals;
}

export function calculateNH4Stats(recipe) {
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

export function elementsInGroup(group) {
  const set = new Set();
  group.salts.forEach(s => {
    Object.entries(s.contributions || {}).forEach(([sym, val]) => {
      if ((val || 0) > 0) set.add(sym);
    });
    // Blank salts (mass=0) expose elements via _pcts
    if (!(s.mass > 0) && s._pcts) {
      Object.keys(s._pcts).forEach(sym => set.add(sym));
    }
  });
  return ELEMENT_DEFS.filter(e => set.has(e.sym)).map(e => e.sym);
}

export function fmtMass(value) {
  if (value === null || value === undefined) return '–';
  const n = Number(value);
  if (isNaN(n)) return '–';
  return n.toFixed(2);
}

export function fmtPpm(value) {
  if (value === null || value === undefined) return '–';
  const n = Number(value);
  if (isNaN(n)) return '–';
  return n < 1 ? n.toFixed(2) : n.toFixed(1);
}
