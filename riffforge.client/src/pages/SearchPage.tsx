import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SongCard from "../components/SongCard";
import type { LastFmTrackSummary, ScrapeRequest } from "../types/lastfm";
import type { Song } from "../types/models";

const RECENT_SEARCHES_KEY = "riffforge:recentSearches";
const MAX_RECENT = 6;

interface RecentSearch {
    artist: string;
    name: string;
    imageUrl?: string;
    songId: number; // resolved song id, so clicking jumps straight there
}

function loadRecentSearches(): RecentSearch[] {
    try {
        const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        // Corrupt or blocked storage — degrade to "no history" rather than crash
        return [];
    }
}

function saveRecentSearches(list: RecentSearch[]) {
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {
        // Storage full/blocked (private browsing, quota) — fail silently,
        // recent searches just won't persist this session
    }
}

function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<LastFmTrackSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<ScrapeRequest | null>(null);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(loadRecentSearches);
    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = query.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
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

    function rememberSearch(track: LastFmTrackSummary, songId: number) {
        setRecentSearches((prev) => {
            // De-dupe by artist+name, most recent first, capped at MAX_RECENT
            const withoutDupe = prev.filter(
                (r) => !(r.artist === track.artist && r.name === track.name)
            );
            const next = [
                { artist: track.artist, name: track.name, imageUrl: track.imageUrl, songId },
                ...withoutDupe,
            ].slice(0, MAX_RECENT);
            saveRecentSearches(next);
            return next;
        });
    }

    function clearRecentSearches() {
        setRecentSearches([]);
        saveRecentSearches([]);
    }

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

            if (scrapeRequest.status === "Completed" && scrapeRequest.resultSongId) {
                rememberSearch(track, scrapeRequest.resultSongId);
                navigate(`/song/${scrapeRequest.resultSongId}`);
            } else {
                pollStatus(scrapeRequest.id, track);
            }
        } catch (err) {
            console.error("Import error:", err);
            setImporting({ id: -1, query: `${track.artist} - ${track.name}`, status: "Failed" });
        }
    }

    function pollStatus(id: number, track: LastFmTrackSummary) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/songsearch/status/${id}`);
                if (!res.ok) return;

                const updated: ScrapeRequest = await res.json();
                setImporting(updated);

                if (updated.status === "Completed" && updated.resultSongId) {
                    clearInterval(interval);
                    rememberSearch(track, updated.resultSongId);
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
            id: -1,
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

            {/* Only show recent searches on the empty/pre-search state —
                once someone's actively typing, live results take over */}
            {trimmed.length < 2 && recentSearches.length > 0 && (
                <div className="recent-searches">
                    <div className="recent-searches-header">
                        <h2>Recent</h2>
                        <button className="recent-clear-btn" onClick={clearRecentSearches}>
                            Clear
                        </button>
                    </div>
                    <div className="recent-searches-chips">
                        {recentSearches.map((r) => (
                            <button
                                key={`${r.artist}-${r.name}`}
                                className="recent-chip"
                                onClick={() => navigate(`/song/${r.songId}`)}
                            >
                                {r.imageUrl && <img src={r.imageUrl} alt="" className="recent-chip-art" />}
                                <span className="recent-chip-text">
                                    <span className="recent-chip-name">{r.name}</span>
                                    <span className="recent-chip-artist">{r.artist}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

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