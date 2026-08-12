import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SongCard from "../components/SongCard";
import type { LastFmTrackSummary, ScrapeRequest, LocalSongMatch, SongSearchResponse } from "../types/lastfm";
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
        return [];
    }
}

function saveRecentSearches(list: RecentSearch[]) {
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {
        // Storage full/blocked — fail silently
    }
}

function SearchPage() {
    const [query, setQuery] = useState("");
    const [localResults, setLocalResults] = useState<LocalSongMatch[]>([]);
    const [externalResults, setExternalResults] = useState<LastFmTrackSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<ScrapeRequest | null>(null);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(loadRecentSearches);
    const navigate = useNavigate();
    const abortRef = useRef<AbortController | null>(null);

    const trimmed = query.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
            // setLocalResults([]);
            // setExternalResults([]);
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

                const data: SongSearchResponse = await res.json();
                setLocalResults(data.localMatches ?? []);
                setExternalResults(data.externalMatches ?? []);
            } catch (err) {
                if ((err as Error).name !== "AbortError") console.error(err);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [trimmed]);

    const showResults = trimmed.length >= 2;

    function rememberSearch(artist: string, name: string, imageUrl: string | undefined, songId: number) {
        setRecentSearches((prev) => {
            const withoutDupe = prev.filter(
                (r) => !(r.artist === artist && r.name === name)
            );
            const next = [
                { artist, name, imageUrl, songId },
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

    function handleSelectLocal(match: LocalSongMatch) {
        rememberSearch(match.artistName, match.name, match.albumArtUrl, match.id);
        navigate(`/song/${match.id}`);
    }

    async function handleSelectExternal(track: LastFmTrackSummary) {
        setImporting({ id: -1, query: `${track.artist} - ${track.name}`, status: "Pending" });

        try {
            const res = await fetch("/api/songsearch/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artist: track.artist, track: track.name }),
            });
            if (res.status === 503) {
                const message = await res.text(); // controller sends the message as the body, not JSON
                throw new AiGenerationUnavailableError(
                    message || "Couldn't generate that version right now — the AI provider is unavailable. Try again shortly."
                );
            }
            if (!res.ok) throw new Error(`Import failed with status ${res.status}`);

            const scrapeRequest: ScrapeRequest = await res.json();
            setImporting(scrapeRequest);

            if (scrapeRequest.status === "Completed" && scrapeRequest.resultSongId) {
                rememberSearch(track.artist, track.name, track.imageUrl, scrapeRequest.resultSongId);
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
                    rememberSearch(track.artist, track.name, track.imageUrl, updated.resultSongId);
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

    function localMatchToSong(match: LocalSongMatch): Song {
        return {
            id: match.id,
            name: match.name,
            primaryArtist: {
                id: -1,
                name: match.artistName,
                imageUrl: match.albumArtUrl
            },
            featuredArtists: [],
            bpm: 0,
            releaseDate: new Date().toISOString(),
            instrumentType: "AcousticGuitar",
            albumArtUrl: match.albumArtUrl,
            genres: [],
            versions: []
        };
    }

    function externalTrackToSong(track: LastFmTrackSummary): Song {
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
            <p className="page-subtitle">Find a song to add to your library — by title, artist, or lyric</p>

            <input
                className="search-input"
                type="text"
                placeholder="Search by song, artist, or lyric..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {!showResults && recentSearches.length > 0 && (
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

            {!loading && showResults && localResults.length === 0 && externalResults.length === 0 && (
                <p className="empty-state">No matches for "{query}".</p>
            )}

            {!loading && showResults && localResults.length > 0 && (
                <>
                    <h2 className="results-section-heading">In your library</h2>
                    <div className="vinyl-grid">
                        {localResults.map((match) => (
                            <SongCard
                                key={`local-${match.id}`}
                                song={localMatchToSong(match)}
                                onClick={() => handleSelectLocal(match)}
                            />
                        ))}
                    </div>
                </>
            )}

            {!loading && showResults && externalResults.length > 0 && (
                <>
                    <h2 className="results-section-heading">Add from Last.fm</h2>
                    <div className="vinyl-grid">
                        {externalResults.map((track) => (
                            <SongCard
                                key={`external-${track.artist}-${track.name}`}
                                song={externalTrackToSong(track)}
                                onClick={() => handleSelectExternal(track)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
class AiGenerationUnavailableError extends Error { }
export default SearchPage;