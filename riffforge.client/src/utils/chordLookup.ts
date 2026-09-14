// utils/chordLookup.ts
export const COMMON_CHORD_FRETS: Record<string, { frets: string; isBarreChord: boolean }> = {
    C: { frets: "x32010", isBarreChord: false },
    G: { frets: "320003", isBarreChord: false },
    Am: { frets: "x02210", isBarreChord: false },
    F: { frets: "133211", isBarreChord: true },
    D: { frets: "xx0232", isBarreChord: false },
    Em: { frets: "022000", isBarreChord: false },
    E: { frets: "022100", isBarreChord: false },
    A: { frets: "x02220", isBarreChord: false },
    Dm: { frets: "xx0231", isBarreChord: false },
    B: { frets: "x24442", isBarreChord: true },
    Bm: { frets: "x24432", isBarreChord: true },
    Cm: { frets: "x35543", isBarreChord: true },
    "C#m": { frets: "x46654", isBarreChord: true },
    "F#m": { frets: "244222", isBarreChord: true },
    "G#m": { frets: "466444", isBarreChord: true },
    Bb: { frets: "x13331", isBarreChord: true },
    Gm: { frets: "355333", isBarreChord: true },
    C7: { frets: "x32310", isBarreChord: false },
    G7: { frets: "320001", isBarreChord: false },
    A7: { frets: "x02020", isBarreChord: false },
    E7: { frets: "020100", isBarreChord: false },
    D7: { frets: "xx0212", isBarreChord: false },
    B7: { frets: "x21202", isBarreChord: false },
    Dmaj7: { frets: "xx0222", isBarreChord: false },
    Gmaj7: { frets: "320002", isBarreChord: false },
    Amaj7: { frets: "x02120", isBarreChord: false },
    Cadd9: { frets: "x32033", isBarreChord: false },
    Db: { frets: "x46664", isBarreChord: true },
    Eb: { frets: "x68886", isBarreChord: true },
    Ab: { frets: "466544", isBarreChord: true },
    Fm: { frets: "133111", isBarreChord: true },
    Bbm: { frets: "x13321", isBarreChord: true },
    Ebm: { frets: "x68876", isBarreChord: true },
    Abm: { frets: "466444", isBarreChord: true },
    Dbm: { frets: "x46654", isBarreChord: true },
    Eb7: { frets: "x68686", isBarreChord: true },
    Bbm7: { frets: "x13121", isBarreChord: true },
    Fm7: { frets: "131111", isBarreChord: true },
    Ab7: { frets: "464544", isBarreChord: true },
};

const ROOT_POSITIONS: Record<string, number> = {
    C: 3, "C#": 4, Db: 4, D: 5, "D#": 6, Eb: 6, E: 7, F: 1, "F#": 2, Gb: 2,
    G: 3, "G#": 4, Ab: 4, A: 0, "A#": 1, Bb: 1, B: 2,
};

function getMovableBarre(name: string): { frets: string; isBarreChord: boolean } {
    const isMinor = name.includes("m") && !name.includes("maj");
    const is7 = name.includes("7");
    const rootMatch = name.match(/^[A-G][b#]?/);
    if (!rootMatch) return { frets: "x00000", isBarreChord: false };

    const root = rootMatch[0];
    const fret = ROOT_POSITIONS[root] ?? 1;

    if (isMinor && is7) return { frets: `x${fret}${fret + 2}${fret}${fret + 1}${fret}`, isBarreChord: true };
    if (isMinor) return { frets: `x${fret}${fret + 2}${fret + 2}${fret + 1}${fret}`, isBarreChord: true };
    if (is7) return { frets: `x${fret}${fret + 2}${fret}${fret + 2}${fret}`, isBarreChord: true };
    return { frets: `x${fret}${fret + 2}${fret + 2}${fret + 2}${fret}`, isBarreChord: true };
}

export function lookupChordInfo(name: string): { frets: string; isBarreChord: boolean } {
    return (
        COMMON_CHORD_FRETS[name] ??
        Object.entries(COMMON_CHORD_FRETS).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] ??
        getMovableBarre(name)
    );
}

// A chord is "known" if it's an exact/case-insensitive dictionary hit —
// anything else is a best-guess movable shape, worth flagging in the editor.
export function isKnownChord(name: string): boolean {
    return !!(
        COMMON_CHORD_FRETS[name] ||
        Object.keys(COMMON_CHORD_FRETS).find((k) => k.toLowerCase() === name.toLowerCase())
    );
}

// Extracts bracketed chord names like "[C]" / "[Dmaj7]" from ChordPro-style text.
export function extractChordNames(text: string): string[] {
    const matches = text.match(/\[([A-G][b#]?[\w#/]*)\]/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/\[|\]/g, ""))));
}