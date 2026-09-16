import { useState } from "react";
import type { UserSubmission } from "../types/submissions";
import ChordLyricLine from "./ChordLyricLine";
import ChordSequenceLine from "./ChordSequenceLine";
import { isChordOnlyLine, extractChordSequence } from "../utils/chordLyrics";
import { extractChordNames, lookupChordInfo } from "../utils/chordLookup";

interface Props {
    submissions: UserSubmission[];
    loading: boolean;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// UserSubmissionDto doesn't send back the specific chord shapes a
// contributor picked at submit time — just tabData. So, same as the
// submission editor's own preview, fall back to the standard shape
// dictionary for anything not already known.
function buildChordFretMap(tabData: string) {
    const map: Record<string, { fretPositions: string; isBarreChord?: boolean }> = {};
    extractChordNames(tabData).forEach((name) => {
        const info = lookupChordInfo(name);
        map[name] = { fretPositions: info.frets, isBarreChord: info.isBarreChord };
    });
    return map;
}

export default function UserSubmissionsPanel({ submissions, loading }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    if (loading) return <p className="empty-state" style={{ padding: "1rem 0" }}>Loading submissions…</p>;

    if (submissions.length === 0) {
        return <p className="empty-state" style={{ padding: "1rem 0" }}>No user submissions yet — be the first to add one.</p>;
    }

    return (
        <div className="user-submissions-list">
            {submissions.map((s) => {
                const isOpen = expandedId === s.id;
                const chordFretMap = isOpen ? buildChordFretMap(s.tabData) : {};

                return (
                    <div key={s.id} className="user-submission-card">
                        <button
                            type="button"
                            onClick={() => setExpandedId(isOpen ? null : s.id)}
                            aria-expanded={isOpen}
                            style={{ all: "unset", display: "block", width: "100%", cursor: "pointer", boxSizing: "border-box" }}
                        >
                            <div className="user-submission-top">
                                <span className={`difficulty-pill difficulty-${s.difficulty.toLowerCase()}`}>{s.difficulty}</span>
                                <span className="user-submission-rating">
                                    {s.ratingCount > 0 ? `★ ${s.rating.toFixed(1)}` : "Not yet rated"}
                                </span>
                                <span style={{ marginLeft: "auto", opacity: 0.6, fontSize: "0.8rem" }}>
                                    {isOpen ? "▲ Hide" : "▼ View"}
                                </span>
                            </div>
                            <div className="user-submission-contributor">by {s.contributorName}</div>
                            <div className="user-submission-meta">
                                <span>{s.tuning}</span>
                                <span>·</span>
                                <span>{s.ratingCount} rating{s.ratingCount === 1 ? "" : "s"}</span>
                                <span>·</span>
                                <span>{formatDate(s.dateScraped)}</span>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="chord-sheet" style={{ marginTop: "12px" }}>
                                {s.tabData.split("\n").map((line, i) =>
                                    isChordOnlyLine(line) ? (
                                        <ChordSequenceLine key={i} chords={extractChordSequence(line)} chordFrets={chordFretMap} />
                                    ) : (
                                        <ChordLyricLine key={i} line={line} chordFrets={chordFretMap} />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}