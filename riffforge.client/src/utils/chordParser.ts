export interface ChordSegment {
    chord?: string;
    lyric: string;
}

export function parseChordLine(line: string): ChordSegment[] {
    const regex = /\[([^\]]+)\]/g;
    const segments: ChordSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ lyric: line.substring(lastIndex, match.index) });
        }
        segments.push({ chord: match[1], lyric: "" });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
        segments.push({ lyric: line.substring(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ lyric: line }];
}