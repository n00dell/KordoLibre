// components/CassetteCard.tsx
import type { Song } from "../types/models";
import { getDefaultVersion } from "../types/models";
import { tapeColorForGenre } from "../utils/tapeColors";
import "../styles/cassette.css";

interface CassetteCardProps {
    song: Song;
    onClick?: (song: Song) => void;
    /** 0–1 how far through the song the user's practice has gotten.
        Optional — pages without progress data handy (Library, Search) just
        omit it and the cassette renders as freshly unwound. */
    progress?: number;
}

function CassetteCard({ song, onClick, progress }: CassetteCardProps) {
    const primaryGenre = song.genres?.[0]?.name;
    const shellColor = tapeColorForGenre(primaryGenre, song.id);
    const defaultVersion = getDefaultVersion(song);

    // Clamp defensively — bad/missing data here should degrade to "looks
    // like an unplayed tape," never to a broken transform or NaN.
    const wound = Math.min(1, Math.max(0, progress ?? 0));

    return (
        <div
            className="cassette-card"
            style={{ "--shell-color": shellColor } as React.CSSProperties}
            onClick={() => onClick?.(song)}
        >
            {defaultVersion && (
                <div className={`difficulty-pill difficulty-${defaultVersion.difficulty.toLowerCase()}`}>
                    {defaultVersion.difficulty}
                </div>
            )}

            <div className="cassette-window">
                {/* Tape physically moves from the left spool to the right one as
                    it plays — the left hub's "wound tape" disc shrinks while the
                    right one grows, driven by the same `wound` fraction. */}
                <div className="reel-hub">
                    <div className="reel-tape" style={{ transform: `scale(${1 - wound * 0.6})` }} />
                    <div className="reel-spokes" />
                </div>
                <div className="tape-strip" />
                <div className="reel-hub">
                    <div className="reel-tape" style={{ transform: `scale(${0.4 + wound * 0.6})` }} />
                    <div className="reel-spokes" />
                </div>
            </div>

            <div className="cassette-label">
                <div className="label-title">{song.name}</div>
                <div className="label-artist">{song.primaryArtist?.name ?? "Unknown"}</div>
            </div>
        </div>
    );
}

export default CassetteCard;