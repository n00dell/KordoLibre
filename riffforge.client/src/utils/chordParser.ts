export interface ChordSegment {
    chord?: string;
    lyric: string;
}

export function parseChordLine(line: string): ChordSegment[] {
    const segments: ChordSegment[] = [];
    // Updated regex: removed the unnecessary backslash inside [^[]+
    const regex = /(?:\[(.*?)\])?([^[]+)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
        if (match[1] || match[2]) {
            segments.push({
                chord: match[1] || undefined,
                lyric: match[2] || "",
            });
        }
    }

    return segments.length > 0 ? segments : [{ lyric: line }];
}