import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VinylCard from "../components/VinylCard";
import { sampleSongs } from "../data/sampleData";

function SearchPage() {
    // "Controlled input" means: the <input>'s value is whatever `query` is,
    // and the ONLY way `query` changes is through setQuery in onChange below.
    // React, not the browser, owns the source of truth for what's typed.
    // This is what lets you do things like filter a list live as someone types.
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const normalizedQuery = query.trim().toLowerCase();

    // No useState needed for this — it's calculated fresh from `songs` and
    // `query` on every render, so it can never drift out of sync with them.
    // (This mirrors what a real search would eventually do server-side, e.g.
    // GET /api/songs?query=... — for now we just filter the sample data.)
    const results = normalizedQuery
        ? sampleSongs.filter(
            (s) =>
                s.name.toLowerCase().includes(normalizedQuery) ||
                s.primaryArtist.name.toLowerCase().includes(normalizedQuery)
        )
        : sampleSongs;

    return (
        <div className="search-page">
            <h1>Search Songs</h1>
            <p className="page-subtitle">Find something to learn next</p>

            <input
                className="search-input"
                type="text"
                placeholder="Search by song or artist..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {results.length === 0 ? (
                <p className="empty-state">No songs match "{query}".</p>
            ) : (
                <div className="vinyl-grid">
                    {results.map((song) => (
                        <VinylCard key={song.id} song={song} onClick={(s) => navigate(`/song/${s.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchPage;