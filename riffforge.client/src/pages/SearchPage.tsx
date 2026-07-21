import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { LastFmTrackSummary, ScrapeRequest } from "../types/lastfm";

function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<LastFmTrackSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<ScrapeRequest | null>(null);
    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = query.trim(); // derived, not stored — same idea as before

    useEffect(() => {
        if (trimmed.length < 2) {
            // Nothing to set here. The effect just doesn't fire a fetch;
            // `visibleResults` below handles what the user sees.
            return;
        }

        // Debouncing: don't fire a request on every keystroke. setTimeout
        // schedules the fetch 350ms out; the cleanup function below (returned
        // from useEffect) cancels that timer if `query` changes again before
        // it fires. Net effect: only the last keystroke in a burst of typing
        // actually triggers a network call.
        const timer = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/songsearch?query=${encodeURIComponent(trimmed)}`,
                    { signal: controller.signal }
                );
                const data: LastFmTrackSummary[] = await res.json();
                setResults(data); // fine — this is inside an async callback, not the effect body
            } catch (err) {
                if ((err as Error).name !== "AbortError") console.error(err);
            } finally {
                setLoading(false);
            }
        }, 350);

        // This cleanup function runs before the NEXT effect run (i.e. the next
        // keystroke) or on unmount. React calling it automatically is what
        // makes debounce/cancel patterns like this work without a memory leak.
        return () => clearTimeout(timer);
    }, [trimmed]);

    const visibleResults = trimmed.length < 2 ? [] : results;
    async function handleSelect(track: LastFmTrackSummary) {
        setImporting({ id: -1, query: `${track.artist} - ${track.name}`, status: "Pending" });

        const res = await fetch("/api/songsearch/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artist: track.artist, track: track.name }),
        });
        const scrapeRequest: ScrapeRequest = await res.json();
        setImporting(scrapeRequest);
        pollStatus(scrapeRequest.id);
    }

    // Polling: since scraping other sites takes real time, we ask "are you
    // done yet?" every couple seconds instead of holding one request open.
    function pollStatus(id: number) {
        const interval = setInterval(async () => {
            const res = await fetch(`/api/songsearch/status/${id}`);
            const updated: ScrapeRequest = await res.json();
            setImporting(updated);

            if (updated.status === "Completed" && updated.resultSongId) {
                clearInterval(interval);
                navigate(`/song/${updated.resultSongId}`);
            } else if (updated.status === "Failed") {
                clearInterval(interval);
            }
        }, 2000);
    }

    return (
        <div className="search-page">
            <h1>Search Songs</h1>
            <p className="page-subtitle">Find a song to add to your library</p>

            <input
                className="search-input"
                type="text"
                placeholder="Search by song or artist..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {importing && (
                <div className="import-status-banner">
                    {importing.status === "Failed"
                        ? `Couldn't find chords for "${importing.query}".`
                        : `Fetching "${importing.query}"…`}
                </div>
            )}

            {loading && <p className="empty-state">Searching…</p>}

            {!loading && visibleResults.length === 0 && trimmed.length >= 2 && (
                <p className="empty-state">No matches on Last.fm for "{query}".</p>
            )}

            <div className="vinyl-grid">
                {visibleResults.map((track) => (
                    <button
                        key={`${track.artist}-${track.name}`}
                        className="lastfm-result-card"
                        onClick={() => handleSelect(track)}
                    >
                        {track.imageUrl && <img src={track.imageUrl} alt={track.name} />}
                        <div>{track.name}</div>
                        <div className="song-subtitle">{track.artist}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SearchPage;