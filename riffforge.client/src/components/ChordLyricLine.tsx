import type { ChordToken } from "../utils/chordLyrics";

interface ChordLyricLineProps {
    tokens: ChordToken[];
}

// Renders one line of a song as alternating chunks of plain text and
// "chord units" — a chord name floating above the text it applies to.
// Each chord unit is its own inline-block so the whole line still wraps
// naturally on narrow screens, same as a paragraph of text would.
function ChordLyricLine({ tokens }: ChordLyricLineProps) {
    // A fully blank line (no tokens, or a single empty-text token) still
    // needs to take up vertical space — otherwise verses visually collapse
    // into each other. A non-breaking space keeps the line's height.
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0].text.trim() === "" && !tokens[0].chord)) {
        return <div className="chord-lyric-line">&nbsp;</div>;
    }

    return (
        <div className="chord-lyric-line">
            {tokens.map((token, i) =>
                token.chord ? (
                    <span className="chord-unit" key={i}>
                        <span className="chord-tag">{token.chord}</span>
                        <span className="lyric-text">{token.text || "\u00A0"}</span>
                    </span>
                ) : (
                    <span className="lyric-text" key={i}>
                        {token.text}
                    </span>
                )
            )}
        </div>
    );
}

export default ChordLyricLine;