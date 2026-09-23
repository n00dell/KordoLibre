// src/components/ChordReferencePanel.tsx
import ChordDiagram from "./ChordDiagram";
import StrumPatternCard from "./StrumPatternCard";
import type { ChordItem } from "../types/models.ts";

interface Props {
    chords: ChordItem[];
    strumPattern: string | number;
    bpm?: number;
}

export default function ChordReferencePanel({ chords, strumPattern, bpm }: Props) {
    return (
        // ChordReferencePanel.tsx — drop the fixed positioning
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-muted)" }}>
                Chord Overview
            </h2>
            <StrumPatternCard pattern={strumPattern} bpm={bpm} />
            <div style={{ padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 10 }}>
                    {chords.map((chord) => (
                        <ChordDiagram key={chord.name} name={chord.name} frets={chord.fretPositions} isBarreChord={chord.isBarreChord} scale={0.78} />
                    ))}
                </div>
            </div>
        </div>
    );
}