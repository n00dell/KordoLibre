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

const NUM_STRINGS = 6;

// Guards against malformed fret data (wrong length coming from the DB or an
// LLM-generated arrangement). Without this, a 7-character string renders 7
// strings/dots instead of 6 — this was the actual cause of chords like Am/C/Dm
// showing "extra fingers" that don't belong to the real chord shape.
function parseFrets(frets: string): ParsedString[] {
    let clean = frets.trim();

    if (clean.length !== NUM_STRINGS) {
        console.warn(
            `ChordDiagram: expected ${NUM_STRINGS} fret characters, got "${frets}" (${clean.length}). Normalizing.`
        );
        if (clean.length > NUM_STRINGS) {
            clean = clean.slice(0, NUM_STRINGS); // truncate stray extra chars
        } else {
            clean = clean.padEnd(NUM_STRINGS, "x"); // pad missing strings as muted
        }
    }

    return clean.split("").map((c) => {
        if (c.toLowerCase() === "x") return { fret: null };
        const parsed = parseInt(c, 16); // hex handles 10th+ fret shorthand
        return { fret: Number.isNaN(parsed) ? null : parsed };
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

    if (isBarreChord === true) {
        const allIndices = fretted.map((f) => f.stringIndex);
        return { fret: minFret, fromString: Math.min(...allIndices), toString: Math.max(...allIndices) };
    }

    if (atMinFret.length < 2) return null;
    const from = Math.min(...atMinFret);
    const to = Math.max(...atMinFret);
    if (to - from < 1) return null;
    return { fret: minFret, fromString: from, toString: to };
}

// Assigns finger numbers (1 = index ... 4 = pinky) to each fretted string.
// Convention used here: a barre (if present) is always finger 1. Every other
// fretted note is then numbered in ascending order of fret distance from the
// nut (ties broken left-to-right, low string to high string). This mirrors
// how most chord-chart sites label fingerings and stays chord-agnostic
// instead of hardcoding per-chord answers.
function assignFingers(
    strings: ParsedString[],
    barre: { fret: number; fromString: number; toString: number } | null
): Map<number, number> {
    const fingerMap = new Map<number, number>();

    const fretted = strings
        .map((s, i) => ({ fret: s.fret, stringIndex: i }))
        .filter((s): s is { fret: number; stringIndex: number } => s.fret !== null && s.fret > 0);

    if (fretted.length === 0) return fingerMap;

    if (barre) {
        // 1. Assign finger 1 ONLY to strings at the exact barre fret
        fretted.forEach((s) => {
            if (s.stringIndex >= barre.fromString && s.stringIndex <= barre.toString && s.fret === barre.fret) {
                fingerMap.set(s.stringIndex, 1);
            }
        });

        // 2. Assign fingers 2, 3, 4 sequentially to remaining higher fretted notes
        const remaining = fretted
            .filter((s) => !fingerMap.has(s.stringIndex))
            .sort((a, b) => (a.fret !== b.fret ? a.fret - b.fret : a.stringIndex - b.stringIndex));

        let currentFinger = 2;
        remaining.forEach((s) => {
            fingerMap.set(s.stringIndex, Math.min(currentFinger, 4));
            currentFinger++;
        });
    } else {
        // Non-barre chord: sort by fret ascending, capped at finger 4
        const sorted = [...fretted].sort((a, b) =>
            a.fret !== b.fret ? a.fret - b.fret : a.stringIndex - b.stringIndex
        );

        let currentFinger = 1;
        sorted.forEach((s) => {
            fingerMap.set(s.stringIndex, Math.min(currentFinger, 4));
            currentFinger++;
        });
    }

    return fingerMap;
}

export default function ChordDiagram({ name, frets, isBarreChord, scale = 1 }: Props) {
    const strings = parseFrets(frets);
    const fretNumbers = strings.map((s) => s.fret).filter((f): f is number => f !== null && f > 0);
    const highestFret = fretNumbers.length ? Math.max(...fretNumbers) : 0;
    const lowestFret = fretNumbers.length ? Math.min(...fretNumbers) : 0;

    // Grow the fret window to fit shapes wider than 4 frets instead of
    // silently dropping notes that fall outside a fixed window.
    const MIN_ROWS = 4;
    const span = highestFret > 0 ? highestFret - lowestFret + 1 : MIN_ROWS;
    const FRET_ROWS = Math.max(MIN_ROWS, span);
    const startFret = highestFret > MIN_ROWS ? lowestFret : 1;

    const barre = detectBarre(strings, isBarreChord);
    const fingers = assignFingers(strings, barre);

    const numStrings = strings.length;
    const width = 100 * scale;
    const padTop = 22 * scale;
    const padSide = 13 * scale;
    const padBottom = 16 * scale; // room for finger-number row
    const dotR = 5 * scale;
    const gridW = width - padSide * 2;
    const height = padTop + FRET_ROWS * (18 * scale) + padBottom;
    const gridH = height - padTop - padBottom;
    const stringGap = numStrings > 1 ? gridW / (numStrings - 1) : 0;
    const fretGap = gridH / FRET_ROWS;

    const xForString = (i: number) => padSide + i * stringGap;
    const yForFretRow = (row: number) => padTop + row * fretGap; // row 0 = nut/startFret line

    return (
        <div style={{ background: "#0d0d0f", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: scale ? "1rem" : "0.8rem", color: "#fff", marginBottom: 4 }}>
                {name}
            </div>

            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Nut */}
                {startFret === 1 && (
                    <rect x={padSide} y={padTop - 3} width={gridW} height={3} fill="#e5e5e5" />
                )}

                {/* Fret-position label. Anchored at a fixed left edge (x=2) with
                    textAnchor="start" so it can never extend past x=0 and get
                    clipped by the SVG viewBox — that clipping was the cause of
                    labels rendering as a stray "r" instead of e.g. "3fr". */}
                {barre ? (
                    <text
                        x={2}
                        y={yForFretRow(barre.fret - startFret) + fretGap / 2 + 3}
                        fontSize={9}
                        fill="#f97316"
                        textAnchor="start"
                        fontWeight={700}
                    >
                        {barre.fret}fr
                    </text>
                ) : (
                    startFret !== 1 && (
                        <text x={2} y={padTop + fretGap * 0.7} fontSize={9} fill="#f97316" textAnchor="start">
                            {startFret}fr
                        </text>
                    )
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
                            <circle key={`open-${i}`} cx={xForString(i)} cy={padTop - 9} r={3.5} fill="none" stroke="#4ade80" strokeWidth={1.5} />
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
                    if (barre && i >= barre.fromString && i <= barre.toString && s.fret === barre.fret) return null;

                    const row = s.fret - startFret;
                    if (row < 0 || row >= FRET_ROWS) return null;

                    return (
                        <circle key={`dot-${i}`} cx={xForString(i)} cy={yForFretRow(row) + fretGap / 2} r={dotR} fill="#f97316" />
                    );
                })}

                {/* Finger numbers, one per fretted string, sitting just below the grid */}
                {strings.map((s, i) => {
                    if (s.fret === null || s.fret === 0) return null;
                    const finger = fingers.get(i);
                    if (!finger) return null;

                    return (
                        <text
                            key={`finger-${i}`}
                            x={xForString(i)}
                            y={height - 3}
                            fontSize={9 * Math.max(scale, 0.7)}
                            fill="rgba(255,255,255,0.65)"
                            textAnchor="middle"
                            fontWeight={600}
                        >
                            {finger}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}