// src/components/StrumPatternCard.tsx
import { useState } from "react";
import StrumPatternDisplay from "./StrumPatternDisplay";

interface Props {
    pattern: string | number;
}

export default function StrumPatternCard({ pattern }: Props) {
    const [playing, setPlaying] = useState(false);

    return (
        <div
            style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12
            }}
        >
            <StrumPatternDisplay pattern={pattern} />
            <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                title="Playback coming soon"
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid var(--accent, #f97316)",
                    background: playing ? "var(--accent, #f97316)" : "transparent",
                    color: playing ? "#000" : "var(--accent, #f97316)",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem"
                }}
            >
                {playing ? "❚❚" : "▶"}
            </button>
        </div>
    );
}