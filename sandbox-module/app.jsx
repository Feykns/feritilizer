// Main app — design canvas with 4 visual direction mockups

const { useState } = React;

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="calculator"
        title="Rechner-Bildschirm — 4 visuelle Richtungen"
        subtitle="Vergleiche und sag mir, was funkt. Jeden Mock kannst du per ⤢ groß ansehen."
      >
        <DCArtboard id="ist" label="0 · Ist-Zustand (Referenz)" width={390} height={920}>
          <MockOriginal />
        </DCArtboard>
        <DCArtboard id="lab" label="A · Laborgerät" width={390} height={920}>
          <MockInstrument />
        </DCArtboard>
        <DCArtboard id="editorial" label="B · Editorial" width={390} height={920}>
          <MockEditorial />
        </DCArtboard>
        <DCArtboard id="dataviz" label="C · Datenvisualisiert" width={390} height={920}>
          <MockDataviz />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
