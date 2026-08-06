// src/components/StrumPatternDisplay.tsx


interface Props {
    pattern: string | number;
}

export default function StrumPatternDisplay({ pattern }: Props) {
    const getArrowSequence = (p: string | number) => {
        const str = String(p).toLowerCase();
        if (str.includes("downdownup") || str.includes("0")) {
            return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
        }
        if (str.includes("down")) {
            return ["↓", " ", "↓", " ", "↓", " ", "↓", " "];
        }
        return ["↓", " ", "↓", "↑", " ", "↑", "↓", "↑"];
    };

    const arrows = getArrowSequence(pattern);
    const beats = ["1", "&", "2", "&", "3", "&", "4", "&"];

    return (
        <div className="strum-pattern-container" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.8, fontWeight: 600 }}>STRUM:</span>
            <div style={{ display: "flex", gap: "6px", fontFamily: "monospace" }}>
                {arrows.map((arrow, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14px" }}>
                        <span style={{ fontSize: "1rem", color: arrow === "↓" ? "var(--accent, #f97316)" : "#4ade80", fontWeight: "bold" }}>
                            {arrow}
                        </span>
                        <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>{beats[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}