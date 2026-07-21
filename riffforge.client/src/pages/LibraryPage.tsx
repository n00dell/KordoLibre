import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SongCard from "../components/SongCard"; // Updated import
import { useTheme } from "../context/ThemeContext"; // Added to dynamically update heading text
import { sampleSongs } from "../data/sampleData";
import type { Song } from "../types/models";

function LibraryPage() {
    const [songs] = useState<Song[]>(sampleSongs);
    const navigate = useNavigate();
    const { theme } = useTheme();

    return (
        <div className="library-page">
            {/* Heading updates based on active theme */}
            <h1>Your {theme === "cassette" ? "Tape" : "Vinyl"} Collection</h1>
            <p className="page-subtitle">
                {songs.length} song{songs.length === 1 ? "" : "s"} ready to play
            </p>

            {songs.length === 0 ? (
                <p className="empty-state">
                    No songs in your library yet. Try adding one from Search.
                </p>
            ) : (
                <div className="vinyl-grid">
                    {/* Swapped <VinylCard> to <SongCard> */}
                    {songs.map((song) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onClick={(s) => navigate(`/song/${s.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LibraryPage;