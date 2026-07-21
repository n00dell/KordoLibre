import { parseChordLine } from "../utils/chordParser";

interface ChordLyricLineProps {
    line: string;
}

function ChordLyricLine({ line }: ChordLyricLineProps) {
    if (!line.trim()) {
        return <div className="chord-line-space" />;
    }

    const segments = parseChordLine(line);

    return (
        <div className="chord-lyric-line">
            {segments.map((seg, idx) => (
                <span key={idx} className="chord-segment">
                    <span className="chord-label">{seg.chord || ""}</span>
                    <span className="lyric-label">{seg.lyric}</span>
                </span>
            ))}
        </div>
    );
}

export default ChordLyricLine;