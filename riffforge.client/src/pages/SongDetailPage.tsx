import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Song } from "../types/models";
import { sampleSongs } from "../data/sampleData";
import { useTheme } from "../context/ThemeContext";
import ChordLyricLine from "../components/ChordLyricLine";
import ChordDiagram from "../components/ChordDiagram";
import TurntablePlayer from "../components/TurntablePlayer";
import TapeDeckPlayer from "../components/TapeDeckPlayer";

function SongDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { theme } = useTheme();
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function loadSong() {
            setLoading(true);
            try {
                const res = await fetch(`/api/songs/${id}`);
                if (res.ok) {
                    const data: Song = await res.json();
                    setSong(data);
                } else {
                    const localMatch = sampleSongs.find((s) => s.id === Number(id));
                    setSong(localMatch || null);
                }
            } catch {
                const localMatch = sampleSongs.find((s) => s.id === Number(id));
                setSong(localMatch || null);
            } finally {
                setLoading(false);
            }
        }

        loadSong();
    }, [id]);

    if (loading) {
        return (
            <div className="song-detail-page">
                <p className="empty-state">Loading turntable…</p>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="song-detail-page">
                <p className="empty-state">Song not found.</p>
                <Link to="/">Back to Library</Link>
            </div>
        );
    }

    const version = song.versions?.[0];
    const rawSheet = version?.tabData || song.lyrics || "No lyrics available for this song.";
    const lines = rawSheet.split("\n");

    const uniqueChords = version?.chords
        ? Array.from(new Map(version.chords.map((c) => [c.name, c])).values())
        : [];

    return (
        <div className="song-detail-page">
            <Link to="/" className="back-link">
                ← Back to Library
            </Link>

            {theme === "cassette" ? <TapeDeckPlayer song={song} /> : <TurntablePlayer song={song} />}

            <div className="song-detail-header fade-in-content" style={{ textAlign: "center" }}>
                <h1>{song.name}</h1>
                <p className="song-subtitle">
                    {song.primaryArtist?.name ?? "Unknown Artist"} · {song.bpm} BPM
                </p>
            </div>

            {version && (
                <div className="version-meta fade-in-content">
                    <span className={`difficulty-pill difficulty-${version.difficulty?.toString().toLowerCase()}`}>
                        {version.difficulty}
                    </span>
                    <span>Tuning: {version.tuning}</span>
                    <span>Capo: {version.capoPos}</span>
                    <span>Strum: {version.strumPattern}</span>
                </div>
            )}

            <section className="chord-sheet-section fade-in-content">
                <h2>Chords &amp; Lyrics</h2>
                <div className="song-body-layout">
                    <div className="chord-sheet-container">
                        {lines.map((line, index) => (
                            <ChordLyricLine key={index} line={line} />
                        ))}
                    </div>

                    {uniqueChords.length > 0 && (
                        <aside className="chord-diagram-rail">
                            {uniqueChords.map((c) => (
                                <ChordDiagram key={c.id} name={c.name} frets={c.fretPositions ?? ""} />
                            ))}
                        </aside>
                    )}
                </div>
            </section>
        </div>
    );
}

export default SongDetailPage;