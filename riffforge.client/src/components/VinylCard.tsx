// VinylCard.tsx
import type { Song } from "../types/models";
import { getDefaultVersion } from "../types/models";
import { coverGradientFor } from "../utils/gradients";

interface VinylCardProps {
    song: Song;
    onClick?: (song: Song) => void;
}

function VinylCard({ song, onClick }: VinylCardProps) {
    const cover = coverGradientFor(song.id);
    const defaultVersion = getDefaultVersion(song);

    return (
        // The whole clickable unit — stage on top, text below. height: auto
        // (no fixed height here) so it grows to fit both.
        <div className="vinyl-card" onClick={() => onClick?.(song)}>
            {/* Everything absolutely-positioned (disc + sleeve + pill) lives
                inside THIS fixed-size box now, not the outer card. That's
                the actual fix — the details div is a sibling of this stage,
                not a child squeezed inside it. */}
            <div className="vinyl-stage">
                <div
                    className="vinyl-disc"
                    style={{
                        background: song.albumArtUrl ? `url(${song.albumArtUrl}) center/cover` : undefined,
                    }}
                />
                <div
                    className="album-cover"
                    style={{ background: song.albumArtUrl ? `url(${song.albumArtUrl}) center/cover` : cover }}
                />
                {defaultVersion && (
                    <div className={`difficulty-pill difficulty-${defaultVersion.difficulty.toLowerCase()}`}>
                        {defaultVersion.difficulty}
                    </div>
                )}
            </div>

            <div className="vinyl-details">
                <div className="song-name">{song.name}</div>
                <div className="song-artist">{song.primaryArtist.name}</div>
            </div>
        </div>
    );
}

export default VinylCard;