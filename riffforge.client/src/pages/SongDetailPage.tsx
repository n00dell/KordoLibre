import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Song } from "../types/models";
import { sampleSongs } from "../data/sampleData";
import ChordLyricLine from "../components/ChordLyricLine";

function SongDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

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

    // Trigger the needle drop animation shortly after component mounts
    useEffect(() => {
        if (!loading && song) {
            const timer = setTimeout(() => setIsPlaying(true), 400);
            return () => clearTimeout(timer);
        }
    }, [loading, song]);

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

    return (
        <div className="song-detail-page turntable-view-container">
            <Link to="/" className="back-link">
                ← Back to Library
            </Link>

            {/* Turntable Deck & Needle Mechanism */}
            <div className={`turntable-deck ${isPlaying ? "playing" : ""}`}>
                <div className="tone-arm" />
                <div className="turntable-record">
                    <div className="vinyl-shine" />
                    <div
                        className="turntable-label"
                        style={{
                            backgroundImage: song.albumArtUrl ? `url(${song.albumArtUrl})` : undefined,
                            backgroundColor: "#ff7a00"
                        }}
                    />
                </div>
            </div>

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
                <div className="chord-sheet-container">
                    {lines.map((line, index) => (
                        <ChordLyricLine key={index} line={line} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default SongDetailPage;