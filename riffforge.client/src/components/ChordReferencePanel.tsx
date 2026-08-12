// src/components/ChordReferencePanel.tsx
import ChordDiagram from "./ChordDiagram";
import StrumPatternCard from "./StrumPatternCard";
import type { ChordItem } from "./ChordHoverBar";

interface Props {
    chords: ChordItem[];
    strumPattern: string | number;
    bpm?: number;
}

export default function ChordReferencePanel({ chords, strumPattern, bpm }: Props) {
    return (
        <div
            style={{
                position: "fixed",
                top: "110px",
                right: "24px",
                width: "300px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                zIndex: 20
            }}
        >
            <StrumPatternCard pattern={strumPattern} bpm={bpm} />

            <div
                style={{
                    padding: "16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    overflowY: "auto"
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))",
                        gap: "10px"
                    }}
                >
                    {chords.map((chord) => (
                        <ChordDiagram
                            key={chord.name}
                            name={chord.name}
                            frets={chord.fretPositions}
                            isBarreChord={chord.isBarreChord}
                            scale={0.78}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}