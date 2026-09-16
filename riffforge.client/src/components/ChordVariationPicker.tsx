import { useEffect, useState } from "react";
import ChordDiagram from "./ChordDiagram";
import { fetchChordShapes, addChordShape } from "../api/chordShapes";
import type { ChordShapeDto } from "../api/chordShapes";
import { lookupChordInfo } from "../utils/chordLookup";

interface Props {
    chordName: string;
    onSelect: (shape: { fretPositions: string; isBarreChord: boolean }) => void;
}

export default function ChordVariationPicker({ chordName, onSelect }: Props) {
    const [shapes, setShapes] = useState<ChordShapeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newFrets, setNewFrets] = useState("");
    const [newBarre, setNewBarre] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchChordShapes(chordName)
            .then((s) => {
                if (cancelled) return;
                // Nothing saved server-side yet — fall back to the built-in shape
                // so there's always at least one to show/select.
                if (s.length === 0) {
                    const fallback = lookupChordInfo(chordName);
                    setShapes([{ id: -1, fretPositions: fallback.frets, isBarreChord: fallback.isBarreChord, upvoteCount: 0, isDefault: true }]);
                } else {
                    setShapes(s);
                }
            })
            .catch(() => setShapes([]))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [chordName]);

    async function handleAddShape() {
        if (!newFrets.trim()) return;
        try {
            const saved = await addChordShape(chordName, newFrets.trim(), newBarre);
            setShapes((prev) => [...prev, saved]);
            onSelect(saved);
            setAdding(false);
            setNewFrets("");
        } catch (err) {
            console.error("Failed to add chord shape:", err);
        }
    }

    if (loading) return <p className="empty-state">Loading variations…</p>;

    return (
        <div className="chord-variation-picker">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {shapes.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => onSelect(s)}
                        title={s.contributorName ? `Added by ${s.contributorName}` : "Standard shape"}
                        style={{
                            background: "none",
                            border: s.isDefault ? "1px solid var(--accent, #f97316)" : "1px solid transparent",
                            borderRadius: 10, padding: 4, cursor: "pointer",
                        }}
                    >
                        <ChordDiagram name={chordName} frets={s.fretPositions} isBarreChord={s.isBarreChord} scale={0.7} />
                    </button>
                ))}
            </div>

            {adding ? (
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        placeholder="e.g. x35543"
                        value={newFrets}
                        maxLength={8}
                        onChange={(e) => setNewFrets(e.target.value)}
                        style={{ width: 100 }}
                    />
                    <label style={{ fontSize: 12 }}>
                        <input type="checkbox" checked={newBarre} onChange={(e) => setNewBarre(e.target.checked)} /> Barre
                    </label>
                    <button type="button" onClick={handleAddShape}>Save</button>
                    <button type="button" onClick={() => setAdding(false)}>Cancel</button>
                </div>
            ) : (
                <button type="button" className="notation-gen-btn" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>
                    + Add a variation
                </button>
            )}
        </div>
    );
}