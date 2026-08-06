// src/components/ChordHoverBar.tsx
import  { useState } from "react";
import ChordDiagram from "./ChordDiagram";

export interface ChordItem {
    name: string;
    fretPositions: string;
    isBarreChord?: boolean;

}

interface Props {
    chords: ChordItem[];
}

export default function ChordHoverBar({ chords }: Props) {
    const [activeChord, setActiveChord] = useState<ChordItem | null>(null);

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "1rem 0", position: "relative" }}>
            {chords.map((chord) => (
                <div
                    key={chord.name}
                    onMouseEnter={() => setActiveChord(chord)}
                    onMouseLeave={() => setActiveChord(null)}
                    style={{ position: "relative", cursor: "pointer" }}
                >
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.18)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--accent, #f97316)",
                            display: "inline-block"
                        }}
                    >
                        {chord.name}
                    </span>

                    {/* Small Hover Popover */}
                    {activeChord?.name === chord.name && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "125%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 100,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
                            }}
                        >
                            <ChordDiagram name={chord.name} frets={chord.fretPositions} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}