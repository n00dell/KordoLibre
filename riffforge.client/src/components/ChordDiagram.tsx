// src/components/ChordDiagram.tsx
interface Props {
    name: string;
    frets: string; // e.g. "133211" or "x02220", low string (6th/E) to high (1st/e)
    isBarreChord?: boolean; // explicit source of truth; undefined = best-effort guess
    scale?: number;
}

interface ParsedString {
    fret: number | null; // null = muted (x)
}

function parseFrets(frets: string): ParsedString[] {
    return frets.split("").map((c) => {
        if (c.toLowerCase() === "x") return { fret: null };
        return { fret: parseInt(c, 16) }; // hex handles 10th+ fret shorthand if you ever need it
    });
}

// Detects a barre: the lowest fretted note played across 2+ ADJACENT strings.
function detectBarre(strings: ParsedString[], isBarreChord?: boolean) {
    if (isBarreChord === false) return null; // explicit "no" wins, no inference

    const fretted = strings
        .map((s, i) => ({ ...s, stringIndex: i }))
        .filter((s) => s.fret !== null && s.fret > 0) as { fret: number; stringIndex: number }[];

    if (fretted.length < 2) return null;

    const minFret = Math.min(...fretted.map((s) => s.fret));
    const atMinFret = fretted.filter((s) => s.fret === minFret).map((s) => s.stringIndex);

    // Trust an explicit "yes": bar spans from the lowest to highest fretted
    // string, even if only 2 strings literally sit at minFret (fingers can
    // cover ones in between at higher frets).
    if (isBarreChord === true) {
        const allIndices = fretted.map((f) => f.stringIndex);
        return { fret: minFret, fromString: Math.min(...allIndices), toString: Math.max(...allIndices) };
    }

    // No flag available (e.g. inline-parsed chord with no DB record) — best guess only
    if (atMinFret.length < 2) return null;
    const from = Math.min(...atMinFret);
    const to = Math.max(...atMinFret);
    if (to - from < 1) return null;
    return { fret: minFret, fromString: from, toString: to };
}

export default function ChordDiagram({ name, frets, isBarreChord, scale = 1 }: Props) {
    const strings = parseFrets(frets);
    const fretNumbers = strings.map((s) => s.fret).filter((f): f is number => f !== null && f > 0);
    const highestFret = fretNumbers.length ? Math.max(...fretNumbers) : 0;
    const lowestFret = fretNumbers.length ? Math.min(...fretNumbers) : 0;

    // Show 4 fret rows. If the shape lives above fret 4, shift the window
    // and label the starting fret (like "5fr").
    const FRET_ROWS = 4;
    const startFret = highestFret > FRET_ROWS ? lowestFret : 1;

    const barre = detectBarre(strings, isBarreChord);

    const numStrings = strings.length;
    const width = 100 * scale;
    const height = 116 * scale;
    const padTop = 22 * scale;
    const padSide = 13 * scale;
    const dotR = 5 * scale;
    const gridW = width - padSide * 2;
    const gridH = height - padTop - (scale ? 14 : 10);
    const stringGap = gridW / (numStrings - 1);
    const fretGap = gridH / FRET_ROWS;

    const xForString = (i: number) => padSide + i * stringGap;
    const yForFretRow = (row: number) => padTop + row * fretGap; // row 0 = nut/startFret line

    return (
        <div style={{ background: "#0d0d0f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: scale ? "1rem" : "0.8rem", color: "#fff", marginBottom: 4 }}>
                {name}
            </div>

            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Nut (thick line) or fret-position label */}
                {startFret === 1 ? (
                    <rect x={padSide} y={padTop - 3} width={gridW} height={3} fill="#e5e5e5" />
                ) : (
                    <text x={padSide - 8} y={padTop + fretGap * 0.7} fontSize={9} fill="#f97316" textAnchor="end">
                        {startFret}fr
                    </text>
                )}

                {/* Frets (horizontal lines) */}
                {Array.from({ length: FRET_ROWS + 1 }).map((_, row) => (
                    <line
                        key={`fret-${row}`}
                        x1={padSide}
                        y1={yForFretRow(row)}
                        x2={padSide + gridW}
                        y2={yForFretRow(row)}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth={row === 0 && startFret === 1 ? 0 : 1}
                    />
                ))}

                {/* Strings (vertical lines) */}
                {strings.map((_, i) => (
                    <line
                        key={`string-${i}`}
                        x1={xForString(i)}
                        y1={padTop}
                        x2={xForString(i)}
                        y2={padTop + gridH}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1}
                    />
                ))}

                {/* Open / muted markers above the nut */}
                {strings.map((s, i) => {
                    if (s.fret === 0) {
                        return (
                            <circle
                                key={`open-${i}`}
                                cx={xForString(i)}
                                cy={padTop - 9}
                                r={3.5}
                                fill="none"
                                stroke="#4ade80"
                                strokeWidth={1.5}
                            />
                        );
                    }
                    if (s.fret === null) {
                        return (
                            <text key={`mute-${i}`} x={xForString(i)} y={padTop - 5} fontSize={10} fill="#f87171" textAnchor="middle">
                                ×
                            </text>
                        );
                    }
                    return null;
                })}

                {/* Barre bar */}
                {barre && (
                    <rect
                        x={xForString(barre.fromString) - dotR}
                        y={yForFretRow(barre.fret - startFret) + fretGap / 2 - dotR}
                        width={xForString(barre.toString) - xForString(barre.fromString) + dotR * 2}
                        height={dotR * 2}
                        rx={dotR}
                        fill="#f97316"
                    />
                )}

                {/* Fretted note dots (skip ones already covered by the barre) */}
                {strings.map((s, i) => {
                    if (s.fret === null || s.fret === 0) return null;
                    if (barre && s.fret === barre.fret && i >= barre.fromString && i <= barre.toString) return null;

                    const row = s.fret - startFret;
                    if (row < 0 || row >= FRET_ROWS) return null;

                    return (
                        <circle
                            key={`dot-${i}`}
                            cx={xForString(i)}
                            cy={yForFretRow(row) + fretGap / 2}
                            r={dotR}
                            fill="#f97316"
                        />
                    );
                })}
            </svg>
        </div>
    );
}