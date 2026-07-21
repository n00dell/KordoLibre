import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { sampleSongs } from "../data/sampleData";
import { getDefaultVersion } from "../types/models";
import { parseChordSheet } from "../utils/chordLyrics";
import ChordLyricLine from "../components/ChordLyricLine";

function SongDetailPage() {
    // This page is reachable two ways (see App.tsx):
    //   /song/:id                -> show the default version
    //   /song/:id/version/:versionId -> show a specific version
    // Both routes render this same component; versionId just comes back
    // undefined on the first one.
    const { id, versionId: versionIdParam } = useParams<{ id: string; versionId?: string }>();

    const song = sampleSongs.find((s) => s.id === Number(id));

    const [selectedVersionId] = useState<number | undefined>(() => {
        if (versionIdParam) return Number(versionIdParam);
        return song ? getDefaultVersion(song)?.id : undefined;
    });

    if (!song) {
        return (
            <div className="song-detail-page">
                <p className="empty-state">Song not found.</p>
                <Link to="/">Back to Library</Link>
            </div>
        );
    }

    const version = song.versions.find((v) => v.id === selectedVersionId) ?? song.versions[0];
    const chordSheetLines = parseChordSheet(version.tabData ?? "");

    return (
        <div className="song-detail-page">
            <Link to="/" className="back-link">
                ← Back to Library
            </Link>

            <div className="song-detail-header">
                <h1>{song.name}</h1>
                <p className="song-subtitle">
                    {song.primaryArtist.name} · {song.bpm} BPM · {new Date(song.releaseDate).getFullYear()}
                </p>
            </div>

            <div className="version-meta">
                <span className={`difficulty-pill difficulty-${version.difficulty.toLowerCase()}`}>{version.difficulty}</span>
                <span>Tuning: {version.tuning}</span>
                <span>Capo: {version.capoPos}</span>
                <span>Strum: {version.strumPattern}</span>
                <span className="version-rating">★ {version.rating.toFixed(1)} ({version.ratingCount})</span>
            </div>

            {song.versions.length > 1 && (
                <Link to={`/song/${song.id}/versions`} className="see-all-versions-link">
                    See all {song.versions.length} versions of this song →
                </Link>
            )}

            <section className="chord-sheet-section">
                <h2>Chords &amp; Lyrics</h2>
                <div className="chord-sheet">
                    {chordSheetLines.map((tokens, i) => (
                        <ChordLyricLine key={i} tokens={tokens} />
                    ))}
                </div>
            </section>

            <section className="chords-section">
                <h2>Chords Used</h2>
                <div className="chip-row">
                    {version.chords.map((chord) => (
                        <span key={chord.id} className="chip">
                            {chord.name}
                        </span>
                    ))}
                </div>
            </section>

            <section className="techniques-section">
                <h2>Techniques</h2>
                <div className="chip-row">
                    {version.techniques.map((tech) => (
                        <span key={tech.id} className="chip chip-outline" title={tech.description}>
                            {tech.name}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default SongDetailPage;