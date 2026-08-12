// src/components/TabBlock.tsx
import { useState } from "react";

interface Props {
    tabData: string;
}

// Matches lines like "e|--0--3--" or "B|-----1---" so the leading string
// letter can be styled differently from the tab body.
const STRING_LINE = /^([eEbBgGdDaA])(\|.*)/;

export default function TabBlock({ tabData }: Props) {
    const [fontSize, setFontSize] = useState(0.9);
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(tabData);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard access can fail (permissions, insecure context) — fail silently, button just won't confirm.
        }
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 6 }}>
                <button type="button" onClick={() => setFontSize((f) => Math.max(0.6, +(f - 0.1).toFixed(1)))} title="Smaller text">
                    A−
                </button>
                <button type="button" onClick={() => setFontSize((f) => Math.min(1.4, +(f + 0.1).toFixed(1)))} title="Larger text">
                    A+
                </button>
                <button type="button" onClick={handleCopy} title="Copy tab to clipboard">
                    {copied ? "Copied ✓" : "Copy"}
                </button>
            </div>

            <pre
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: `${fontSize}rem`,
                    lineHeight: 1.6,
                    color: "#e5e5e5",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "18px",
                    overflowX: "auto",
                    whiteSpace: "pre"
                }}
            >
                {tabData.split("\n").map((line, i) => {
                    const match = line.match(STRING_LINE);
                    if (!match) return <div key={i}>{line.length ? line : "\u00A0"}</div>;
                    return (
                        <div key={i}>
                            <span style={{ color: "var(--accent, #f97316)", fontWeight: 700 }}>{match[1]}</span>
                            <span>{match[2]}</span>
                        </div>
                    );
                })}
            </pre>
        </div>
    );
}