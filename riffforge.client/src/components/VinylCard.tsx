import type { Song } from "../types/models";
import { getDefaultVersion } from "../types/models";
import { coverGradientFor, labelGradientFor } from "../utils/gradients";

// Before: VinylCard took { title, artist, coverGradient, labelGradient } —
// four separate, disconnected props. Now it takes one `song` prop and figures
// out what it needs from it. This is a common React refactor: when a
// component's props all describe "the same thing", pass the thing, not its parts.
interface VinylCardProps {
    song: Song;
    onClick?: (song: Song) => void; // parent decides what "click" means (navigate, open modal, etc)
}

function VinylCard({ song, onClick }: VinylCardProps) {
    const cover = coverGradientFor(song.id);
    const label = labelGradientFor(song.id);
    const defaultVersion = getDefaultVersion(song);

    return (
        // onClick here just calls whatever function the parent passed in.
        // The card doesn't know or care *what* happens on click — that's the
        // parent's job. This keeps VinylCard reusable in different contexts
        // (library grid, search results, "recently practiced" list, etc).
        <div className="vinyl-card" onClick={() => onClick?.(song)}>
            <div className="album-cover" style={{ background: cover }}>
                <div className="cover-text">{song.name}</div>
            </div>

            <div className="vinyl-disc">
                <div className="center-label" style={{ background: label }}>
                    <span className="center-title">{song.name}</span>
                    <span className="center-artist">{song.primaryArtist.name}</span>
                </div>
            </div>

            {/* Small addition: surface the default version's difficulty right on
          the card, since that's genuinely useful info a player wants before
          clicking in. `defaultVersion` can be undefined (no versions yet),
          so we guard with `&&` — nothing renders if it's missing. */}
            {defaultVersion && (
                <div className={`difficulty-pill difficulty-${defaultVersion.difficulty.toLowerCase()}`}>
                    {defaultVersion.difficulty}
                </div>
            )}
        </div>
    );
}

export default VinylCard;