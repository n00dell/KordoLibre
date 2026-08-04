import { useState } from "react";
import type { Song } from "../types/models";
import { useTheme } from "../context/ThemeContext";
import VinylCard from "./VinylCard";
import CassetteCard from "./CassetteCard";
import { addToLibrary, removeFromLibrary } from "../api/library";

interface SongCardProps {
    song: Song;
    onClick?: (song: Song) => void;
    progress?: number;
    onLibraryChange?: (songId: number, inLibrary: boolean) => void; // so a parent grid can react, e.g. drop the card
}

function SongCard({ song, onClick, progress, onLibraryChange }: SongCardProps) {
    const { theme } = useTheme();
    const [inLibrary, setInLibrary] = useState(!!song.isInLibrary);
    const [busy, setBusy] = useState(false);

    async function handleToggleLibrary(e: React.MouseEvent) {
        e.stopPropagation(); // don't also trigger the card's onClick/navigation
        if (busy || song.id < 0) return; // negative id = unimported Last.fm placeholder, nothing to save yet

        const next = !inLibrary;
        setInLibrary(next); // optimistic
        setBusy(true);
        try {
            if (next) {
                await addToLibrary(song.id);
            } else {
                await removeFromLibrary(song.id);
            }
            onLibraryChange?.(song.id, next);
        } catch (err) {
            console.error("Library toggle failed:", err);
            setInLibrary(!next); // revert on failure
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="song-card-wrapper">
            {song.id >= 0 && (
                <button
                    type="button"
                    className={`library-star-btn${inLibrary ? " active" : ""}`}
                    onClick={handleToggleLibrary}
                    aria-label={inLibrary ? "Remove from library" : "Add to library"}
                    title={inLibrary ? "Remove from library" : "Add to library"}
                    disabled={busy}
                >
                    {inLibrary ? "★" : "☆"}
                </button>
            )}

            {theme === "cassette" ? (
                <CassetteCard song={song} onClick={onClick} progress={progress} />
            ) : (
                <VinylCard song={song} onClick={onClick} />
            )}
        </div>
    );
}

export default SongCard;