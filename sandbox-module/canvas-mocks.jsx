// 4 visuelle Richtungen für den Growculator Rechner-Screen
// Jede Mock = mobile Vorschau 390x920px

// ============================================================
// Shared Beispieldaten (gleicher Zustand für alle 4 Varianten)
// ============================================================
const SAMPLE_TARGETS = [
  { el: 'N-NO₃⁻', symbol: 'N',  ion: 'NO₃⁻', target: 150,  achieved: 150.2, color: '#7CB342' },
  { el: 'N-NH₄⁺', symbol: 'N',  ion: 'NH₄⁺', target: 15,   achieved: 14.9,  color: '#9CCC65' },
  { el: 'P',      symbol: 'P',  ion: '',     target: 50,   achieved: 50.1,  color: '#E91E63' },
  { el: 'K',      symbol: 'K',  ion: '',     target: 200,  achieved: 199.8, color: '#7E57C2' },
  { el: 'Mg',     symbol: 'Mg', ion: '',     target: 50,   achieved: 49.9,  color: '#26A69A' },
  { el: 'Ca',     symbol: 'Ca', ion: '',     target: 160,  achieved: 160.1, color: '#D4E157' },
  { el: 'S',      symbol: 'S',  ion: '',     target: 60,   achieved: 59.8,  color: '#FDD835' },
  { el: 'Fe',     symbol: 'Fe', ion: '',     target: 3.0,  achieved: 3.0,   color: '#BF5B3A' },
  { el: 'Mn',     symbol: 'Mn', ion: '',     target: 0.5,  achieved: 0.5,   color: '#FFAB91' },
  { el: 'Zn',     symbol: 'Zn', ion: '',     target: 0.3,  achieved: 0.3,   color: '#B0BEC5' },
  { el: 'B',      symbol: 'B',  ion: '',     target: 0.4,  achieved: 0.4,   color: '#D7CCC8' },
];

const SAMPLE_RESULT = {
  tanks: {
    A: [
      { name: 'Calcium Nitrate', formula: 'Ca(NO₃)₂', mass: 205.4, cost: 0.72 },
      { name: 'Potassium Nitrate', formula: 'KNO₃', mass: 141.2, cost: 0.59 },
    ],
    B: [
      { name: 'Magnesium Sulfate', formula: 'MgSO₄·7H₂O', mass: 152.1, cost: 0.27 },
      { name: 'Monopotassium Phosphate', formula: 'KH₂PO₄', mass: 21.9, cost: 0.12 },
    ],
    C: [
      { name: 'Iron Sulfate', formula: 'FeSO₄·7H₂O', mass: 14.9, cost: 0.07 },
      { name: 'Manganese Sulfate', formula: 'MnSO₄·H₂O', mass: 1.54, cost: 0.01 },
      { name: 'Zinc Sulfate', formula: 'ZnSO₄·7H₂O', mass: 1.32, cost: 0.01 },
      { name: 'Boric Acid', formula: 'H₃BO₃', mass: 2.29, cost: 0.01 },
    ],
  },
  totalCost: 1.80,
  volume: 10,
  factor: 100,
  mlPerLiter: 10.0,
};

// ============================================================
// Mini-Icons (Inline-SVG)
// ============================================================
const I = {
  flask: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 3h6"/><path d="M10 3v6.5L4 20a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 20l-6-10.5V3"/><path d="M7 16h10"/></svg>,
  calc: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>,
  db: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  book: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

// Shared frame – jeder Mock ist 390x920 (mobile)
const Frame = ({ bg, children, fontFamily }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: bg,
    overflow: 'hidden',
    position: 'relative',
    fontFamily: fontFamily || '"Inter", system-ui, sans-serif',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {children}
  </div>
);

// ============================================================
// MOCK 0 — IST-ZUSTAND (so wie es heute aussieht)
// ============================================================
function MockOriginal() {
  const accent = '#10b981';
  return (
    <Frame bg="#171717">
      {/* Header */}
      <header style={{
        background: 'rgba(23,23,23,0.95)',
        borderBottom: '1px solid #262626',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <I.flask style={{ width: 22, height: 22, color: accent }} />
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Hydro Nährstoffrechner</div>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.1, marginTop: 1 }}>Nährstoffberechnung</div>
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Solution settings */}
        <section style={{ background: '#262626', border: '1px solid #404040', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 10 }}>LÖSUNGSTYP</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
            <button style={{ background: '#404040', color: '#d4d4d4', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>Fertige Lösung</button>
            <button style={{ background: accent, color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>Stockkonzentrat</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Volumen (Liter)</div>
              <div style={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}>10</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Konz.-Faktor</div>
              <div style={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}>100</div>
            </div>
          </div>
        </section>

        {/* Targets */}
        <section style={{ background: '#262626', border: '1px solid #404040', borderRadius: 12, padding: 14, flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 8 }}>ZIELWERTE (ppm)</div>
          <div style={{
            display: 'flex', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
            opacity: 0.6, paddingBottom: 4, marginBottom: 2, borderBottom: '1px solid #404040', fontWeight: 500,
          }}>
            <div style={{ width: 60 }}>Element</div>
            <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>Ziel</div>
            <div style={{ width: 50, textAlign: 'right' }}>Resultat</div>
          </div>
          {SAMPLE_TARGETS.slice(0, 8).map(t => (
            <div key={t.el} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
              <div style={{ width: 60, fontSize: 13, fontWeight: 600, color: t.color }}>
                {t.symbol}{t.ion && <span style={{ fontSize: 10, marginLeft: 2 }}>({t.ion})</span>}
              </div>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>
                <div style={{ display: 'inline-block', background: '#171717', border: '1px solid #404040', borderRadius: 6, padding: '4px 8px', fontSize: 12, minWidth: 60, textAlign: 'right' }}>
                  {t.target}
                </div>
              </div>
              <div style={{ width: 50, textAlign: 'right', fontSize: 12, opacity: 0.4, fontVariantNumeric: 'tabular-nums' }}>—</div>
            </div>
          ))}
        </section>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={{ background: 'transparent', border: '1px solid #404040', color: '#fff', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 500 }}>Zurücksetzen</button>
          <button style={{ background: accent, border: 'none', color: '#fff', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Berechnen</button>
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{ background: '#171717', borderTop: '1px solid #262626', display: 'flex' }}>
        {[
          { I: I.calc, l: 'Rechner', a: true },
          { I: I.db, l: 'Datenbank' },
          { I: I.book, l: 'Wissen' },
          { I: I.settings, l: 'Einstellungen' },
        ].map((item, i) => (
          <button key={i} style={{
            flex: 1, background: 'transparent', border: 'none',
            color: item.a ? accent : '#737373',
            padding: '10px 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 500,
          }}>
            <item.I style={{ width: 22, height: 22 }} />
            <span>{item.l}</span>
          </button>
        ))}
      </nav>
    </Frame>
  );
}

// ============================================================
// MOCK A — LABORGERÄT
// Vibe: Digitaler Multimeter / pH-Meter / Laborschrank-Gerät
// Pitch-schwarz, phosphor-grün, alles mono, LCD-Readouts
// ============================================================
function MockInstrument() {
  const phosphor = '#39ff14';
  const phosphorDim = '#1a8a0a';
  const screen = '#0d1410';
  return (
    <Frame bg="#050807" fontFamily='"JetBrains Mono", monospace'>
      {/* Top bar — serial / unit ID */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${phosphorDim}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 10,
        color: phosphorDim,
        letterSpacing: 1,
      }}>
        <span>GRWC.01 / UNIT 0042</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, background: phosphor, borderRadius: '50%', boxShadow: `0 0 8px ${phosphor}` }} />
          READY
        </span>
      </div>

      {/* Title block */}
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${phosphorDim}` }}>
        <div style={{ fontSize: 9, color: phosphorDim, letterSpacing: 2, marginBottom: 2 }}>::: MODE</div>
        <div style={{ fontSize: 17, color: phosphor, fontWeight: 600, letterSpacing: 0.5, textShadow: `0 0 12px ${phosphor}55` }}>
          NUTRIENT.CALC
        </div>
        <div style={{ fontSize: 10, color: phosphorDim, marginTop: 2 }}>stock · 10.000 L · ×100 conc.</div>
      </div>

      {/* Main readout — big LCD block */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${phosphorDim}`, background: screen }}>
        <div style={{ fontSize: 9, color: phosphorDim, letterSpacing: 2, marginBottom: 8 }}>TOTAL.MASS / TANK</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { tank: 'A', mass: 346.6 },
            { tank: 'B', mass: 174.0 },
            { tank: 'C', mass: 20.05 },
          ].map(({ tank, mass }) => (
            <div key={tank} style={{
              border: `1px solid ${phosphorDim}`,
              borderRadius: 2,
              padding: '8px 10px',
              background: '#000',
            }}>
              <div style={{ fontSize: 9, color: phosphorDim, marginBottom: 2 }}>TANK {tank}</div>
              <div style={{
                fontSize: 22, color: phosphor, fontWeight: 700,
                textShadow: `0 0 10px ${phosphor}88`,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>{mass.toFixed(2).split('.')[0]}<span style={{ fontSize: 14, opacity: 0.7 }}>.{mass.toFixed(2).split('.')[1]}</span></div>
              <div style={{ fontSize: 9, color: phosphorDim, marginTop: 2 }}>GRAM</div>
            </div>
          ))}
        </div>
      </div>

      {/* Element readouts */}
      <div style={{ padding: '12px 16px', flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 9, color: phosphorDim, letterSpacing: 2, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>ELEMENT.PPM</span>
          <span>TGT ··· OBT</span>
        </div>
        {SAMPLE_TARGETS.slice(0, 9).map((t, idx) => {
          const dev = ((t.achieved - t.target) / t.target) * 100;
          const devColor = Math.abs(dev) < 1 ? phosphor : '#ffb800';
          return (
            <div key={t.el} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3px 0',
              borderBottom: idx === 8 ? 'none' : `1px dashed ${phosphorDim}44`,
              fontSize: 12,
            }}>
              <div style={{ width: 56, color: phosphor, fontWeight: 600, letterSpacing: 0.5 }}>
                {t.el.replace('-NO₃⁻', '').replace('-NH₄⁺', '')}{t.el.includes('NO₃') ? '·NO₃' : t.el.includes('NH₄') ? '·NH₄' : ''}
              </div>
              <div style={{ flex: 1, color: phosphorDim, fontVariantNumeric: 'tabular-nums', textAlign: 'right', paddingRight: 8 }}>
                {t.target.toFixed(1).padStart(6)}
              </div>
              <div style={{ width: 18, textAlign: 'center', color: phosphorDim }}>·</div>
              <div style={{ width: 60, color: devColor, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 600, textShadow: `0 0 6px ${devColor}66` }}>
                {t.achieved.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${phosphorDim}`, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
        <button style={{
          background: 'transparent', border: `1px solid ${phosphorDim}`, color: phosphorDim,
          padding: '10px 0', fontFamily: 'inherit', fontSize: 11, letterSpacing: 1,
          borderRadius: 2,
        }}>[ RESET ]</button>
        <button style={{
          background: phosphor, border: 'none', color: '#000',
          padding: '10px 0', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: 2,
          borderRadius: 2, boxShadow: `0 0 16px ${phosphor}55`,
        }}>▶ EXECUTE</button>
      </div>

      {/* Bottom nav — minimal mono */}
      <nav style={{
        background: '#000',
        borderTop: `1px solid ${phosphorDim}`,
        display: 'flex',
        fontSize: 9,
        letterSpacing: 1.5,
      }}>
        {['CALC', 'DB', 'REF', 'CFG'].map((l, i) => (
          <div key={i} style={{
            flex: 1, padding: '12px 0', textAlign: 'center',
            color: i === 0 ? phosphor : phosphorDim,
            borderLeft: i === 0 ? 'none' : `1px solid ${phosphorDim}33`,
            background: i === 0 ? `${phosphor}11` : 'transparent',
          }}>
            {i === 0 && '> '}{l}
          </div>
        ))}
      </nav>
    </Frame>
  );
}

// ============================================================
// MOCK B — EDITORIAL
// Vibe: Wissenschaftliche Publikation / Kindle / Whitepaper
// Helles cremiges Papier, Source Serif Headlines, viel Weißraum
// ============================================================
function MockEditorial() {
  const ink = '#1c1a17';
  const paper = '#f5f1e8';
  const accent = '#2d5f3f'; // tiefes Botanikgrün
  const rule = '#1c1a1720';
  const muted = '#1c1a1799';

  return (
    <Frame bg={paper} fontFamily='"Inter", system-ui, sans-serif'>
      {/* Header — eyebrow + headline + meta line */}
      <div style={{ padding: '18px 24px 14px', color: ink }}>
        <div style={{
          fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
          color: accent, fontWeight: 600, marginBottom: 6,
        }}>
          Growculator · Vol. I
        </div>
        <div style={{
          fontFamily: '"Source Serif 4", Georgia, serif',
          fontSize: 30, lineHeight: 1.05, fontWeight: 500,
          letterSpacing: -0.4,
        }}>
          Nährstoff­berechnung
        </div>
        <div style={{
          fontSize: 12, color: muted, marginTop: 6,
          fontStyle: 'italic',
          fontFamily: '"Source Serif 4", Georgia, serif',
        }}>
          Stockkonzentrat · 10 L · ×100 Konzentrationsfaktor
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${rule}`, margin: '0 24px' }} />

      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 24px', color: ink, display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Section I */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontStyle: 'italic', fontSize: 13, color: accent,
            }}>§ I.</span>
            <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, color: muted }}>
              Lösungstyp
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{
              padding: '12px 14px',
              border: `1px solid ${rule}`,
              fontSize: 13,
              background: 'transparent',
              color: muted,
            }}>Fertige Lösung</div>
            <div style={{
              padding: '12px 14px',
              border: `1.5px solid ${ink}`,
              background: ink,
              color: paper,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              Stockkonzentrat
              <I.check style={{ width: 14, height: 14 }} />
            </div>
          </div>
        </section>

        {/* Section II */}
        <section style={{ flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontStyle: 'italic', fontSize: 13, color: accent,
            }}>§ II.</span>
            <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, color: muted }}>
              Zielwerte
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: muted, fontStyle: 'italic' }}>
              parts per million
            </span>
          </div>
          {SAMPLE_TARGETS.slice(0, 7).map((t, idx) => (
            <div key={t.el} style={{
              display: 'flex',
              alignItems: 'baseline',
              padding: '9px 0',
              borderBottom: idx === 6 ? 'none' : `1px solid ${rule}`,
            }}>
              <span style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 16, fontWeight: 500,
                width: 70,
                color: t.color,
              }}>
                {t.symbol}{t.ion && <sub style={{ fontSize: 9, marginLeft: 1, color: t.color }}>{t.ion}</sub>}
              </span>
              <span style={{
                flex: 1,
                borderBottom: `1px dotted ${rule}`,
                margin: '0 6px',
                height: 1,
                alignSelf: 'flex-end',
                marginBottom: 4,
              }} />
              <span style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: 16, fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: ink,
              }}>{t.target.toFixed(1)}</span>
            </div>
          ))}
        </section>

        {/* Footer action */}
        <div>
          <button style={{
            width: '100%',
            background: ink,
            color: paper,
            border: 'none',
            padding: '14px 0',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 1,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'inherit',
          }}>
            Berechnung starten <I.arrow style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Bottom nav — quiet typography only */}
      <nav style={{
        background: paper,
        borderTop: `1px solid ${rule}`,
        display: 'flex',
        padding: '10px 0 12px',
      }}>
        {[
          { l: 'Rechner', a: true },
          { l: 'Datenbank' },
          { l: 'Wissen' },
          { l: 'System' },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: '"Source Serif 4", Georgia, serif',
            fontSize: 12,
            color: item.a ? accent : muted,
            fontStyle: item.a ? 'normal' : 'italic',
            fontWeight: item.a ? 600 : 400,
            position: 'relative',
          }}>
            {item.l}
            {item.a && <div style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
              width: 16, height: 2, background: accent,
            }} />}
          </div>
        ))}
      </nav>
    </Frame>
  );
}

// ============================================================
// MOCK C — DATENVISUALISIERT
// Vibe: deine Tabellen werden zu echten Visualisierungen
// Mini-Bars pro Element (Ziel vs. erreicht), Tank-Verteilung,
// Kosten-Donut. Selbe Dark-Basis wie das Original.
// ============================================================
function MockDataviz() {
  const bg = '#0f1311';
  const cardBg = '#1a1f1c';
  const border = '#2a312d';
  const accent = '#10b981';
  const muted = '#9ca3a0';

  return (
    <Frame bg={bg}>
      {/* Header */}
      <header style={{
        background: 'rgba(15,19,17,0.95)',
        borderBottom: `1px solid ${border}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <I.flask style={{ width: 20, height: 20, color: accent }} />
          <div>
            <div style={{ fontSize: 10, color: muted }}>Stockkonzentrat · 10 L · ×100</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>Ergebnis</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: muted, letterSpacing: 0.5 }}>GESAMT</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>1,80 €</div>
        </div>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top row: Tank-Verteilung als Donut + Dosierhinweis */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 12 }}>
          {/* Mini Donut: Mass split between tanks */}
          <div style={{ position: 'relative', width: 86, height: 86, margin: 'auto' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={border} strokeWidth="3.5" />
              {/* A: 346.6/540.65 = 64.1% */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7CB342" strokeWidth="3.5" strokeDasharray="64.1 100" strokeDashoffset="0" />
              {/* B: 174/540.65 = 32.2% */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FDD835" strokeWidth="3.5" strokeDasharray="32.2 100" strokeDashoffset="-64.1" />
              {/* C: 3.7% */}
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#BF5B3A" strokeWidth="3.5" strokeDasharray="3.7 100" strokeDashoffset="-96.3" />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>540</div>
              <div style={{ fontSize: 8, color: muted, marginTop: 2 }}>GRAMM</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
            {[
              { tank: 'A', mass: 346.6, color: '#7CB342' },
              { tank: 'B', mass: 174.0, color: '#FDD835' },
              { tank: 'C', mass: 20.1, color: '#BF5B3A' },
            ].map(({ tank, mass, color }) => (
              <div key={tank} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, width: 32 }}>Tank {tank}</span>
                <span style={{ flex: 1, fontSize: 11, color: muted, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{mass.toFixed(1)} g</span>
              </div>
            ))}
            <div style={{
              marginTop: 4, paddingTop: 6, borderTop: `1px solid ${border}`,
              fontSize: 10, color: muted, fontStyle: 'italic',
            }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>10,0 ml/L</span> pro Tank dosieren
            </div>
          </div>
        </div>

        {/* Element bars — die eigentliche Innovation */}
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 12px 8px',
          flex: 1, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>ZIEL vs. ERREICHT</div>
            <div style={{ fontSize: 9, color: muted }}>ppm</div>
          </div>

          {SAMPLE_TARGETS.slice(0, 9).map(t => {
            const pct = (t.achieved / t.target) * 100;
            const isOff = Math.abs(pct - 100) > 5;
            return (
              <div key={t.el} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 2 }}>
                  <div style={{ width: 38, fontSize: 11, fontWeight: 700, color: t.color }}>
                    {t.symbol}{t.ion && <sub style={{ fontSize: 8 }}>{t.ion}</sub>}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 10, color: muted, fontVariantNumeric: 'tabular-nums', marginRight: 6 }}>
                    {t.achieved.toFixed(1)} / {t.target}
                  </div>
                </div>
                <div style={{ position: 'relative', height: 6, background: '#0a0d0b', borderRadius: 3, overflow: 'visible' }}>
                  {/* Target marker line at 100% */}
                  <div style={{
                    position: 'absolute', left: '100%', top: -2, bottom: -2, width: 2,
                    background: '#fff', opacity: 0.3, transform: 'translateX(-1px)',
                    display: 'none', // would be off-canvas at 100%
                  }} />
                  {/* Achieved bar */}
                  <div style={{
                    height: '100%',
                    width: `${Math.min(pct, 100)}%`,
                    background: t.color,
                    borderRadius: 3,
                    boxShadow: `0 0 8px ${t.color}66`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tank composition mini bars — stacked */}
        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: 0.5, marginBottom: 8 }}>SALZ-MISCHUNG</div>
          {['A', 'B', 'C'].map(tk => {
            const items = SAMPLE_RESULT.tanks[tk];
            const total = items.reduce((s, x) => s + x.mass, 0);
            const colors = ['#7CB342', '#7E57C2', '#E91E63', '#26A69A'];
            return (
              <div key={tk} style={{ marginBottom: tk === 'C' ? 0 : 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{tk}</span>
                  <span style={{ color: muted, fontVariantNumeric: 'tabular-nums' }}>{total.toFixed(1)} g · {items.length} Salze</span>
                </div>
                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, background: '#0a0d0b' }}>
                  {items.map((s, i) => (
                    <div key={i} style={{
                      flex: s.mass,
                      background: colors[i % colors.length],
                    }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{ background: bg, borderTop: `1px solid ${border}`, display: 'flex' }}>
        {[
          { I: I.calc, l: 'Rechner', a: true },
          { I: I.db, l: 'Datenbank' },
          { I: I.book, l: 'Wissen' },
          { I: I.settings, l: 'Einstellungen' },
        ].map((item, i) => (
          <button key={i} style={{
            flex: 1, background: 'transparent', border: 'none',
            color: item.a ? accent : '#737373',
            padding: '10px 0', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 500,
          }}>
            <item.I style={{ width: 22, height: 22 }} />
            <span>{item.l}</span>
          </button>
        ))}
      </nav>
    </Frame>
  );
}

// Expose to other scripts
Object.assign(window, { MockOriginal, MockInstrument, MockEditorial, MockDataviz });
