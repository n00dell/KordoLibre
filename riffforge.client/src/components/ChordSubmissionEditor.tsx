import { useMemo, useState } from "react";
import ChordLyricLine from "./ChordLyricLine";
import { extractChordNames, lookupChordInfo, isKnownChord } from "../utils/chordLookup";
import { submitVersion } from "../api/submissions";
import type { UserSubmission } from "../types/submissions";
import { Tuning, CapoPos, Difficulty } from "../types/enums";
import StrumPatternEditor from "./StrumPatternEditor";
import { DEFAULT_STRUM_PATTERN } from "../types/strumPresets";
import ChordVariationPicker from "./ChordVariationPicker";
import { extractChordSequence, isChordOnlyLine } from "../utils/chordLyrics";
import ChordSequenceLine from "./ChordSequenceLine";

interface Props {
    songId: number;
    onSubmitted?: (submission: UserSubmission) => void;
    onCancel?: () => void;
}

export default function ChordSubmissionEditor({ songId, onSubmitted, onCancel }: Props) {
    const [text, setText] = useState("");
    const [tuning, setTuning] = useState<string>(Tuning.Standard);
    const [capoPos, setCapoPos] = useState<string>(CapoPos.None);
    const [difficulty, setDifficulty] = useState<string>(Difficulty.Intermediate);
    const [strumPattern, setStrumPattern] = useState<string>(DEFAULT_STRUM_PATTERN);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chordOverrides, setChordOverrides] = useState<Record<string, { fretPositions: string; isBarreChord: boolean }>>({});
    const [pickingChord, setPickingChord] = useState<string | null>(null);

    const chordNames = useMemo(() => extractChordNames(text), [text]);
    const chordFretMap = useMemo(() => {
        const map: Record<string, { fretPositions: string; isBarreChord?: boolean }> = {};
        chordNames.forEach((name) => {
            const override = chordOverrides[name];
            if (override) {
                map[name] = override;
                return;
            }
            const info = lookupChordInfo(name);
            map[name] = { fretPositions: info.frets, isBarreChord: info.isBarreChord };
        });
        return map;
    }, [chordNames, chordOverrides]);
    const unknownChords = chordNames.filter((n) => !isKnownChord(n));

    async function handleSubmit() {
        setError(null);
        if (!text.includes("[")) {
            setError("Add at least one chord in [brackets], e.g. [C]Lyrics here.");
            return;
        }
        setSubmitting(true);
        try {
            const chordShapes = chordNames.map((name) => ({
                name,
                fretPositions: chordFretMap[name]?.fretPositions ?? "",
                isBarreChord: chordFretMap[name]?.isBarreChord ?? false,
            }));
            const result = await submitVersion(songId, { tabData: text, tuning, capoPos, difficulty, strumPattern, chordShapes });
            onSubmitted?.(result);
            setText("");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="chord-submission-editor">
            <p className="rf-block-sub">
                Write your own chords-over-lyrics version. Put a chord in square brackets right
                before the word it's played on — e.g. <code>[C]Here comes the [G]sun</code>.
            </p>

            <textarea
                className="chord-submission-textarea"
                rows={8}
                placeholder="[C]Here comes the [G]sun..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            {unknownChords.length > 0 && (
                <p className="chord-submission-warning">
                    Not sure about the shape for: {unknownChords.join(", ")} — showing a best-guess fingering below.
                </p>
            )}
            {chordNames.length > 0 && (
                <div className="chord-variation-controls" style={{ marginBottom: 12 }}>
                    <p className="rf-block-sub" style={{ marginBottom: 6 }}>
                        Not the shape you meant? Pick a variation for any chord below.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {chordNames.map((name) => (
                            <button
                                key={name}
                                type="button"
                                className="chip chip-outline"
                                onClick={() => setPickingChord(pickingChord === name ? null : name)}
                            >
                                {name} ✎
                            </button>
                        ))}
                    </div>
                    {pickingChord && (
                        <div style={{ marginTop: 10 }}>
                            <ChordVariationPicker
                                chordName={pickingChord}
                                onSelect={(shape) => {
                                    setChordOverrides((prev) => ({ ...prev, [pickingChord]: shape }));
                                    setPickingChord(null);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
            <div className="chord-submission-fields">
                <label>
                    <span>Tuning</span>
                    <select value={tuning} onChange={(e) => setTuning(e.target.value)}>
                        {Object.values(Tuning).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </label>
                <label>
                    <span>Capo</span>
                    <select value={capoPos} onChange={(e) => setCapoPos(e.target.value)}>
                        {Object.values(CapoPos).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </label>
                <label>
                    <span>Difficulty</span>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        {Object.values(Difficulty).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                    <span>Strum pattern</span>
                    <StrumPatternEditor value={strumPattern} onChange={setStrumPattern} />
                </label>
            </div>

            {text.trim() && (
                <div className="chord-submission-preview">
                    <h3>Preview</h3>
                    {text.split("\n").map((line, i) =>
                        isChordOnlyLine(line) ? (
                            <ChordSequenceLine key={i} chords={extractChordSequence(line)} chordFrets={chordFretMap} />
                        ) : (
                            <ChordLyricLine key={i} line={line} chordFrets={chordFretMap} />
                        )
                    )}
                </div>
            )}

            {error && <p className="empty-state" style={{ color: "#f87171" }}>{error}</p>}

            <div className="chord-submission-actions">
                <button type="button" className="auth-submit-btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Version"}
                </button>
                {onCancel && (
                    <button type="button" className="profile-logout-btn" onClick={onCancel}>Cancel</button>
                )}
            </div>
        </div>
    );
}