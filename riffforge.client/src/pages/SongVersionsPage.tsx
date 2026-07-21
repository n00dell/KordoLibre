import { useParams, Link } from "react-router-dom";
import { sampleSongs } from "../data/sampleData";

// A dedicated page for browsing every community-submitted SongVersion for
// one Song — separate from SongDetailPage, which only ever shows one
// version at a time. This is the "pick which take you want to learn" screen.
function SongVersionsPage() {
    const { id } = useParams<{ id: string }>();
    const song = sampleSongs.find((s) => s.id === Number(id));

    if (!song) {
        return (
            <div className="versions-page">
                <p className="empty-state">Song not found.</p>
                <Link to="/">Back to Library</Link>
            </div>
        );
    }

    // Sort by rating so the most-loved version leads — same "best version"
    // sort your SongVersion.RatingCount comment describes.
    const sortedVersions = [...song.versions].sort((a, b) => b.rating - a.rating);

    return (
        <div className="versions-page">
            <Link to={`/song/${song.id}`} className="back-link">
                ← Back to {song.name}
            </Link>

            <h1>{song.name}</h1>
            <p className="song-subtitle">
                {song.primaryArtist.name} · {sortedVersions.length} version{sortedVersions.length === 1 ? "" : "s"}
            </p>

            <div className="version-card-list">
                {sortedVersions.map((v) => (
                    <Link key={v.id} to={`/song/${song.id}/version/${v.id}`} className="version-card">
                        <div className="version-card-top">
                            <span className={`difficulty-pill difficulty-${v.difficulty.toLowerCase()}`}>{v.difficulty}</span>
                            {v.isDefault && <span className="default-badge">Default</span>}
                            <span className="version-rating">★ {v.rating.toFixed(1)}</span>
                        </div>
                        <div className="version-card-contributor">by {v.contributorName ?? "Unknown contributor"}</div>
                        <div className="version-card-meta">
                            <span>{v.tuning}</span>
                            <span>·</span>
                            <span>Capo {v.capoPos === "None" ? "none" : v.capoPos.replace("Fret", "")}</span>
                            <span>·</span>
                            <span>{v.strumPattern}</span>
                        </div>
                        <div className="version-card-footer">
                            <span>{v.ratingCount} ratings</span>
                            {v.sourceName && <span>Source: {v.sourceName}</span>}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default SongVersionsPage;