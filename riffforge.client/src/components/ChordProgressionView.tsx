import ChordTag from "./ChordTag";
import type { ChordFretInfo } from "./ChordLyricLine";
import { extractChordProgression } from "../utils/chordLyrics";

interface Props {
    tabData: string;
    chordFrets: Record<string, ChordFretInfo>;
}

export default function ChordProgressionView({ tabData, chordFrets }: Props) {
    const sections = extractChordProgression(tabData);

    if (sections.length === 0) {
        return <p className="empty-state">No chord progression available yet.</p>;
    }

    return (
        <div className="chord-progression">
            {sections.map((section, i) => (
                <div key={i} className="chord-progression-row">
                    {section.label && <div className="chord-progression-label">{section.label}</div>}
                    <div className="chord-progression-chords">
                        {section.chords.map((name, j) => (
                            <ChordTag key={`${name}-${j}`} name={name} fretPositions={chordFrets[name]?.fretPositions ?? ""} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}