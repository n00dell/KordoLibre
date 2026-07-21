import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VinylCard from "../components/VinylCard";
import { sampleSongs } from "../data/sampleData";
import type { Song } from "../types/models";

function LibraryPage() {
    // useState gives you two things: the current value, and a function to
    // update it. Calling `setSongs(...)` is what tells React "re-render this
    // component, something changed." A plain variable wouldn't do that —
    // React wouldn't know to re-draw the screen.
    //
    // Right now we just seed it with sampleSongs. Later, you'd start with an
    // empty array and fill it in a useEffect that calls your API:
    //
    //   const [songs, setSongs] = useState<Song[]>([]);
    //   useEffect(() => {
    //     fetch("/api/songs")
    //       .then((res) => res.json())
    //       .then((data: Song[]) => setSongs(data));
    //   }, []); // empty array = "run this once, when the page first loads"
    const [songs] = useState<Song[]>(sampleSongs);

    // useNavigate gives you a function to change pages programmatically
    // (as opposed to NavLink, which changes pages when the user clicks it).
    // We use it here so clicking a card takes you to that song's detail page.
    const navigate = useNavigate();

    return (
        <div className="library-page">
            <h1>Your Vinyl Collection</h1>
            <p className="page-subtitle">{songs.length} song{songs.length === 1 ? "" : "s"} ready to play</p>

            {songs.length === 0 ? (
                // Treat "no songs" as its own state, not a blank grid — an empty
                // screen should tell the person what to do next.
                <p className="empty-state">No songs in your library yet. Try adding one from Search.</p>
            ) : (
                <div className="vinyl-grid">
                    {/* .map() turns each Song into a <VinylCard>. The `key` prop is
              required by React whenever you render a list — it's how React
              tracks which item is which across re-renders, so it doesn't
              have to redraw every card when only one changes. Always use a
              stable, unique value (song.id), never the array index. */}
                    {songs.map((song) => (
                        <VinylCard key={song.id} song={song} onClick={(s) => navigate(`/song/${s.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LibraryPage;