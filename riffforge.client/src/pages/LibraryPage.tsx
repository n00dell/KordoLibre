import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SongCard from "../components/SongCard";
import { useTheme } from "../context/ThemeContext";
import { fetchLibrarySongs } from "../api/library";
import type { Song } from "../types/models";

function LibraryPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const data = await fetchLibrarySongs();
                if (!cancelled) setSongs(data);
            } catch (err) {
                console.error("Failed to load library:", err);
                if (!cancelled) setSongs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    function handleLibraryChange(songId: number, inLibrary: boolean) {
        // This grid IS "your library" — unstarring here should drop the card
        // immediately rather than leaving a stale entry visible.
        if (!inLibrary) {
            setSongs((prev) => prev.filter((s) => s.id !== songId));
        }
    }

    return (
        <div className="library-page">
            <h1>Your {theme === "cassette" ? "Tape" : "Vinyl"} Collection</h1>
            <p className="page-subtitle">
                {songs.length} song{songs.length === 1 ? "" : "s"} ready to play
            </p>

            {loading ? (
                <p className="empty-state">Loading your collection…</p>
            ) : songs.length === 0 ? (
                <p className="empty-state">
                    No songs in your library yet. Try adding one from Search.
                </p>
            ) : (
                <div className="vinyl-grid">
                    {songs.map((song) => (
                        <SongCard
                            key={song.id}
                            song={{ ...song, isInLibrary: true }}
                            onClick={(s) => navigate(`/song/${s.id}`)}
                            onLibraryChange={handleLibraryChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LibraryPage;