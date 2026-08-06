// src/components/ChordTag.tsx  — drop-in for hovering an inline chord in a lyric line
import { useState } from "react";
import ChordDiagram from "./ChordDiagram";

interface Props {
    name: string;
    fretPositions: string;
}

export default function ChordTag({ name, fretPositions }: Props) {
    const [hover, setHover] = useState(false);

    return (
        <span
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ position: "relative", cursor: "pointer", fontWeight: 700, color: "var(--accent, #f97316)" }}
        >
            {name}
            {hover && (
                <span
                    style={{
                        position: "absolute",
                        bottom: "125%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 100,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
                    }}
                >
                    <ChordDiagram name={name} frets={fretPositions} />
                </span>
            )}
        </span>
    );
}