// src/components/TabBlock.tsx
import { useState } from "react";
import type { StructuredTab } from "../types/tab";

interface Props {
    tabData: string;
    structuredTab?: StructuredTab | null;
}

// Matches lines like "e|--0--3--" or "B|-----1---" so the leading string
// letter can be styled differently from the tab body.
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

export default function TabBlock({ tabData, structuredTab }: Props) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(tabData);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
    // fail silently
        }
    }

    const hasStructured = !!structuredTab?.sections?.length;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button type="button" className="tab-copy-btn" onClick={handleCopy}>
                    {copied ? "Copied ✓" : "Copy"}
                </button>
            </div>

            {hasStructured ? (
                <div className="tab-grid-wrap">
                    {structuredTab!.sections.map((section, si) => (
                        <div key={si} className="tab-section">
                            {section.label && <div className="tab-section-label">{section.label}</div>}
                            <div
                                className="tab-grid"
                                style={{ gridTemplateColumns: `28px repeat(${section.columns.length}, 22px)` }}
                            >
                                {STRING_LABELS.slice().reverse().map((label, rowFromTop) => {
                                    const stringIndex = 5 - rowFromTop; // top row = high e
                                    return (
                                        <div key={label + rowFromTop} style={{ display: "contents" }}>
                                            <div className="tab-string-label">{label}</div>
                                            {section.columns.map((col, ci) => {
                                                const fret = col.frets[stringIndex];
                                                const measureStart = ci > 0 && ci % 4 === 0;
                                                return (
                                                    <div key={ci} className={`tab-cell${measureStart ? " tab-measure-start" : ""}`}>
                                                        {fret >= 0 ? fret : "—"}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <pre className="tab-ascii-fallback">
                    {tabData.split("\n").map((line, i) => {
                        const match = line.match(/^([eEbBgGdDaA])(\|.*)/);
                        if (!match) return <div key={i}>{line.length ? line : "\u00A0"}</div>;
                        return (
                            <div key={i}>
                                <span className="tab-string-letter">{match[1]}</span>
                                <span>{match[2]}</span>
                            </div>
                        );
                    })}
                </pre>
            )}
        </div>
    );
}