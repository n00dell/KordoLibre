import ChordTag from "./ChordTag";
import type { ChordFretInfo } from "./ChordLyricLine";

interface Props {
    chords: string[];
    chordFrets: Record<string, ChordFretInfo>;
}

// For lyric-free chord sequences: [Am][F][C][G] with nothing between them.
// ChordLyricLine positions labels above text width, which collapses to zero
// when there's no lyric — this just lays chords out in a row instead.
export default function ChordSequenceLine({ chords, chordFrets }: Props) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.4em", lineHeight: "2.3em", marginBottom: "0.4em" }}>
            {chords.map((name, i) => (
                <ChordTag key={`${name}-${i}`} name={name} fretPositions={chordFrets[name]?.fretPositions ?? ""} />
            ))}
        </div>
    );
}