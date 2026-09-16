import { STRUM_PRESETS } from "../types/strumPresets";

interface Props {
    value: string;
    onChange: (pattern: string) => void;
}

const SLOT_LABELS = ["1", "&", "2", "&", "3", "&", "4", "&"];
const CYCLE: Record<string, string> = { "-": "D", D: "U", U: "-" };

export default function StrumPatternEditor({ value, onChange }: Props) {
    const slots = value.padEnd(8, "-").slice(0, 8).split("");

    function cycleSlot(i: number) {
        const next = [...slots];
        next[i] = CYCLE[next[i]] ?? "D";
        onChange(next.join(""));
    }

    return (
        <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {slots.map((s, i) => (
                    <button
                        type="button"
                        key={i}
                        onClick={() => cycleSlot(i)}
                        title={`Beat ${SLOT_LABELS[i]} — click to cycle Down / Up / Rest`}
                        style={{
                            width: 30, height: 30, borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: s === "D" ? "var(--accent, #f97316)" : s === "U" ? "#4ade80" : "transparent",
                            color: s === "-" ? "inherit" : "#000",
                            fontWeight: 700, cursor: "pointer",
                        }}
                    >
                        {s === "D" ? "↓" : s === "U" ? "↑" : "·"}
                    </button>
                ))}
            </div>
            <select value="" onChange={(e) => e.target.value && onChange(e.target.value)}>
                <option value="">Start from a preset…</option>
                {STRUM_PRESETS.map((p) => (
                    <option key={p.label} value={p.pattern}>{p.label}</option>
                ))}
            </select>
        </div>
    );
}