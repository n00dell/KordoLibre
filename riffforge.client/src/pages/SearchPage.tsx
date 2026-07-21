import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SongCard from "../components/SongCard";
import type { LastFmTrackSummary, ScrapeRequest } from "../types/lastfm";
import type { Song } from "../types/models";

function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<LastFmTrackSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<ScrapeRequest | null>(null);
    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = query.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
            // setResults([]);
            return;
        }

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
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data: LastFmTrackSummary[] = await res.json();
                setResults(data);
            } catch (err) {
                if ((err as Error).name !== "AbortError") console.error(err);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [trimmed]);

    const visibleResults = trimmed.length < 2 ? [] : results;

    async function handleSelect(track: LastFmTrackSummary) {
        setImporting({ id: -1, query: `${track.artist} - ${track.name}`, status: "Pending" });

        try {
            const res = await fetch("/api/songsearch/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artist: track.artist, track: track.name }),
            });

            if (!res.ok) throw new Error(`Import failed with status ${res.status}`);

            const scrapeRequest: ScrapeRequest = await res.json();
            setImporting(scrapeRequest);

            // If already completed immediately by DB lookup, navigate right away
            if (scrapeRequest.status === "Completed" && scrapeRequest.resultSongId) {
                navigate(`/song/${scrapeRequest.resultSongId}`);
            } else {
                pollStatus(scrapeRequest.id);
            }
        } catch (err) {
            console.error("Import error:", err);
            setImporting({ id: -1, query: `${track.artist} - ${track.name}`, status: "Failed" });
        }
    }

    function pollStatus(id: number) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/songsearch/status/${id}`);
                if (!res.ok) return;

                const updated: ScrapeRequest = await res.json();
                setImporting(updated);

                if (updated.status === "Completed" && updated.resultSongId) {
                    clearInterval(interval);
                    navigate(`/song/${updated.resultSongId}`);
                } else if (updated.status === "Failed") {
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error:", err);
                clearInterval(interval);
            }
        }, 1500);
    }

    function trackToSong(track: LastFmTrackSummary): Song {
        return {
            id: -1, // Temporary ID for preview card
            name: track.name,
            primaryArtist: {
                id: -1,
                name: track.artist,
                imageUrl: track.imageUrl
            },
            featuredArtists: [],
            bpm: 120,
            releaseDate: new Date().toISOString(),
            instrumentType: "AcousticGuitar",
            albumArtUrl: track.imageUrl,
            genres: [],
            versions: []
        };
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
                        ? `Couldn't find song for "${importing.query}".`
                        : `Fetching "${importing.query}"…`}
                </div>
            )}

            {loading && <p className="empty-state">Searching…</p>}

            {!loading && visibleResults.length === 0 && trimmed.length >= 2 && (
                <p className="empty-state">No matches on Last.fm for "{query}".</p>
            )}

            <div className="vinyl-grid">
                {visibleResults.map((track) => (
                    <SongCard
                        key={`${track.artist}-${track.name}`}
                        song={trackToSong(track)}
                        onClick={() => handleSelect(track)}
                    />
                ))}
            </div>
        </div>
    );
}

export default SearchPage;