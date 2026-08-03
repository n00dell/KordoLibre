interface ChordDiagramProps {
    name: string;
    frets: string; // e.g. "x02220"
    active?: boolean;
}

function ChordDiagram({ name, frets, active }: ChordDiagramProps) {
    const positions = frets.split("");
    const maxFret = Math.max(...positions.map(f => (f === "x" || f === "0" ? 0 : Number(f))), 4);
    const fretRows = Array.from({ length: maxFret + 1 }, (_, i) => i);
    const rowHeight = 20;
    const svgHeight = 10 + fretRows.length * rowHeight;

    return (
        <div className={`chord-diagram-card ${active ? "active" : ""}`}>
            <div className="chord-diagram-name">{name}</div>
            <svg viewBox={`0 0 120 ${svgHeight}`} width="100%">
                {fretRows.map(i => (
                    <line key={i} x1="10" y1={10 + i * rowHeight} x2="110" y2={10 + i * rowHeight} stroke="var(--border-color)" />
                ))}
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <line key={i} x1={10 + i * 20} y1="10" x2={10 + i * 20} y2={svgHeight - 10} stroke="var(--border-color)" />
                ))}
                {positions.map((f, i) => {
                    const x = 10 + i * 20;
                    if (f === "x") return <text key={i} x={x} y="6" fontSize="9" fill="var(--text-muted)" textAnchor="middle">×</text>;
                    if (f === "0") return <circle key={i} cx={x} cy="4" r="3" fill="none" stroke="var(--text-secondary)" />;
                    const fretNum = Number(f);
                    return <circle key={i} cx={x} cy={10 + (fretNum - 0.5) * rowHeight} r="6" fill="var(--accent)" />;
                })}
            </svg>
        </div>
    );
}

export default ChordDiagram;