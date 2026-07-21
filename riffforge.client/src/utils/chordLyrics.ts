// Parses ChordPro-style text: chords written inline in square brackets right
// before the syllable they're played on, e.g.:
//
//   "[G]Here comes the [D]sun"
//
// This is the same convention your SongVersion.TabData field can store as
// plain text — no schema change needed, just a formatting convention for
// what goes inside that string.
//
// A "line" of the song becomes an array of tokens: each token is either
// { chord: "G", text: "Here comes the " } (a chord landing right before
// this run of text) or { chord: null, text: "..." } (plain text with no
// chord change). ChordLyricLine.tsx turns each token into a little stacked
// chord-over-text unit.

export interface ChordToken {
    chord: string | null;
    text: string;
}

export function parseChordLine(line: string): ChordToken[] {
    const tokens: ChordToken[] = [];
    // Split the line at every "[chord]" marker, but keep the markers in the
    // result (that's what the parentheses in the regex do).
    const parts = line.split(/(\[[^\]]+\])/g).filter((p) => p !== "");

    let pendingChord: string | null = null;
    for (const part of parts) {
        const match = part.match(/^\[([^\]]+)\]$/);
        if (match) {
            // Found a chord marker. Hang onto it until we see the text that follows.
            pendingChord = match[1];
        } else {
            tokens.push({ chord: pendingChord, text: part });
            pendingChord = null;
        }
    }
    // A line that ends in a chord marker with nothing after it (rare, but
    // possible mid-song) still gets shown, just with empty text.
    if (pendingChord) {
        tokens.push({ chord: pendingChord, text: "" });
    }
    return tokens;
}

export function parseChordSheet(sheet: string): ChordToken[][] {
    return sheet.split("\n").map(parseChordLine);
}