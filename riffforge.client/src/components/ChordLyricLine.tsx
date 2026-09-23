// src/components/ChordLyricLine.tsx
import { useState } from "react";
import ChordDiagram from "./ChordDiagram";
import { parseChordLine } from "../utils/chordLyrics";

export interface ChordFretInfo {
    fretPositions: string;
    isBarreChord?: boolean;
}

interface Props {
    line: string;
    chordFrets: Record<string, ChordFretInfo>;
}



export default function ChordLyricLine({ line, chordFrets }: Props) {
    const [hovered, setHovered] = useState<string | null>(null);

    if (!line.trim()) {
        return <div style={{ height: "1.4em" }} />;
    }

    const segments = parseChordLine(line);

    return (
        // ChordLyricLine.tsx — key parts changed
        <div className="chord-lyric-line">
            {segments.map((seg, i) => (
                <span key={i} className="chord-unit">
            {seg.chord && (
                <span
                    className="chord-tag"
                    onMouseEnter={() => setHovered(seg.chord)}
                    onMouseLeave={() => setHovered(null)}
                >
                    {seg.chord}
                    {hovered === seg.chord && chordFrets[seg.chord] && (
                        <span style={{ position: "absolute", bottom: "135%", left: 0, zIndex: 200, boxShadow: "0 10px 25px rgba(0,0,0,0.6)" }}>
                            <ChordDiagram name={seg.chord} frets={chordFrets[seg.chord].fretPositions} isBarreChord={chordFrets[seg.chord].isBarreChord} scale={0.85} />
                        </span>
                    )}
                </span>
            )}
                    <span className="lyric-text">{seg.text}</span>
        </span>
            ))}
        </div>
    );
}