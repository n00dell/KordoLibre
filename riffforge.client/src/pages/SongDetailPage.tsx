// src/pages/SongDetailPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import type { Song, SongVersion } from "../types/models";
import { sampleSongs } from "../data/sampleData";
import { useTheme } from "../context/ThemeContext";
import ChordReferencePanel from "../components/ChordReferencePanel";
import type { ChordItem } from "../components/ChordHoverBar";
import ChordLyricLine from "../components/ChordLyricLine";
import TurntablePlayer from "../components/TurntablePlayer";
import TapeDeckPlayer from "../components/TapeDeckPlayer";
import TabBlock from "../components/TabBlock";
import { fetchLibraryStatus, addToLibrary, removeFromLibrary } from "../api/library";

// Expanded chord fret lookup map to prevent 000000 diagram fallbacks
const COMMON_CHORD_FRETS: Record<string, { frets: string; isBarreChord: boolean }> = {
    C: { frets: "x32010", isBarreChord: false },
    G: { frets: "320003", isBarreChord: false },
    Am: { frets: "x02210", isBarreChord: false },
    F: { frets: "133211", isBarreChord: true },
    D: { frets: "xx0232", isBarreChord: false },
    Em: { frets: "022000", isBarreChord: false },
    E: { frets: "022100", isBarreChord: false },
    A: { frets: "x02220", isBarreChord: false },
    Dm: { frets: "xx0231", isBarreChord: false },
    Bm: { frets: "x24432", isBarreChord: true },
    C7: { frets: "x32310", isBarreChord: false },
    G7: { frets: "320001", isBarreChord: false },
    Dmaj7: { frets: "xx0222", isBarreChord: false },
    Gmaj7: { frets: "320002", isBarreChord: false },
    Fm7: { frets: "131111", isBarreChord: true },
    "F#m7": { frets: "242222", isBarreChord: true },
    Em7: { frets: "022030", isBarreChord: false },
    Bm7: { frets: "x24232", isBarreChord: true },
    Amaj7: { frets: "x02120", isBarreChord: false },
    Cadd9: { frets: "x32033", isBarreChord: false },
    Bb: { frets: "x13331", isBarreChord: true },
    Gm: { frets: "355333", isBarreChord: true }
};

// Helper to detect if the content looks like tablature
const looksLikeTab = (text: string): boolean => {
    // Check if the text contains common tab indicators
    const lines = text.split('\n');
    // Look for lines that start with guitar string indicators
    const hasTabLines = lines.some(line =>
        /^[eBGDAd]/.test(line.trim()) ||
        /^[-]{4,}/.test(line.trim()) ||
        /^[|]/.test(line.trim())
    );
    return hasTabLines;
};

// Also create a helper to get the full chord info
const lookupChordInfo = (name: string): { frets: string; isBarreChord: boolean } =>
    COMMON_CHORD_FRETS[name] ??
    Object.entries(COMMON_CHORD_FRETS).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] ??
    { frets: "x00000", isBarreChord: false };

function SongDetailPage() {
    const { id, versionId } = useParams<{ id: string; versionId?: string }>();
    const { theme } = useTheme();
    const [song, setSong] = useState<Song | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryBusy, setLibraryBusy] = useState(false);

    useEffect(() => {
        if (!id) return;

        async function loadSong() {
            setLoading(true);
            try {
                const res = await fetch(`/api/songs/${id}`);
                if (res.ok) {
                    const data: Song = await res.json();
                    setSong(data);
                    selectInitialVersion(data);
                } else {
                    const localMatch = sampleSongs.find((s) => s.id === Number(id));
                    setSong(localMatch || null);
                    if (localMatch) selectInitialVersion(localMatch);
                }
            } catch {
                const localMatch = sampleSongs.find((s) => s.id === Number(id));
                setSong(localMatch || null);
                if (localMatch) selectInitialVersion(localMatch);
            } finally {
                setLoading(false);
            }
        }

        function selectInitialVersion(songData: Song) {
            if (!songData.versions?.length) return;
            if (versionId) {
                const v = songData.versions.find((v) => v.id === Number(versionId));
                setSelectedVersion(v || songData.versions[0]);
            } else {
                const defaultVer = songData.versions.find((v) => v.isDefault) || songData.versions[0];
                setSelectedVersion(defaultVer);
            }
        }

        loadSong();
    }, [id, versionId]);

    useEffect(() => {
        if (!song || song.id < 0) return;

        let cancelled = false;
        fetchLibraryStatus([song.id])
            .then((saved) => {
                if (!cancelled) setInLibrary(saved.has(song.id));
            })
            .catch((err) => console.error("Failed to load library status:", err));

        return () => { cancelled = true; };
    }, [song]);

    // Extract inline bracketed chords like [C] or [Dmaj7] from raw tabData
    const uniqueChords = useMemo<ChordItem[]>(() => {
        if (!selectedVersion) return [];

        // 1. Relational database chords
        if (selectedVersion.chords && selectedVersion.chords.length > 0) {
            const mapped = selectedVersion.chords.map((c) => ({
                name: c.name,
                fretPositions: c.fretPositions || COMMON_CHORD_FRETS[c.name]?.frets || "x00000",
                isBarreChord: c.isBarreChord ?? COMMON_CHORD_FRETS[c.name]?.isBarreChord ?? false
            }));
            return Array.from(new Map(mapped.map((c) => [c.name, c])).values());
        }

        // 2. Parse inline Gemini bracket chords e.g., [Dmaj7]
        const tabText = selectedVersion.tabData || "";
        const matches = tabText.match(/\[([A-G][b#]?[\w#/]*)\]/g) || [];
        const rawNames = Array.from(new Set(matches.map((m) => m.replace(/\[|\]/g, ""))));
        return rawNames.map((name) => {
            const info = lookupChordInfo(name);
            return {
                name,
                fretPositions: info.frets,
                isBarreChord: info.isBarreChord
            };
        });
    }, [selectedVersion]);
    const chordFretMap = useMemo(() => {
        const map: Record<string, { fretPositions: string; isBarreChord?: boolean }> = {};
        uniqueChords.forEach((c) => {
            map[c.name] = { fretPositions: c.fretPositions, isBarreChord: c.isBarreChord };
        });
        return map;
    }, [uniqueChords]);
    async function handleToggleLibrary() {
        if (!song || song.id < 0 || libraryBusy) return;
        const next = !inLibrary;
        setInLibrary(next);
        setLibraryBusy(true);
        try {
            if (next) await addToLibrary(song.id);
            else await removeFromLibrary(song.id);
        } catch {
            setInLibrary(!next);
        } finally {
            setLibraryBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="song-detail-page">
                <p className="empty-state">Loading arrangement…</p>
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

    const rawSheet = selectedVersion?.tabData || song.lyrics || "No chords available.";
    const lines = rawSheet.split("\n");
    const isTab = selectedVersion
        ? selectedVersion.notationType === 1 || (selectedVersion.notationType == null && looksLikeTab(rawSheet))
        : false;

    return (
        <div className="song-detail-page">
            <Link to="/" className="back-link">
                ← Back to Library
            </Link>

            {theme === "cassette" ? <TapeDeckPlayer song={song} /> : <TurntablePlayer song={song} />}

            <div className="song-detail-header fade-in-content" style={{ textAlign: "center" }}>
                <h1>{song.name}</h1>
                <p className="song-subtitle">
                    {song.primaryArtist?.name ?? "Unknown Artist"} · {song.bpm} BPM
                </p>

                {song.id >= 0 && (
                    <button
                        type="button"
                        className={`add-to-library-btn${inLibrary ? " active" : ""}`}
                        onClick={handleToggleLibrary}
                        disabled={libraryBusy}
                    >
                        {inLibrary ? "★ In Your Library" : "☆ Add to Library"}
                    </button>
                )}
            </div>

            {/* Version Switcher Tabs */}
            {song.versions && song.versions.length > 1 && (
                <div className="version-tabs fade-in-content" style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "1rem 0" }}>
                    {song.versions.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            className={`version-tab-btn ${selectedVersion?.id === v.id ? "active" : ""}`}
                            onClick={() => setSelectedVersion(v)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                border: "1px solid var(--accent)",
                                background: selectedVersion?.id === v.id ? "var(--accent)" : "transparent",
                                color: selectedVersion?.id === v.id ? "#fff" : "var(--text-primary)",
                                cursor: "pointer"
                            }}
                        >
                            {v.isDefault ? "Target Version (Original)" : "Alternate Version"} ({v.difficulty})
                        </button>
                    ))}
                </div>
            )}

            {/* Version Metadata (strum pattern moved to the side panel) */}
            {selectedVersion && (
                <div className="version-meta fade-in-content" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "15px", margin: "1rem 0" }}>
                    <span className={`difficulty-pill difficulty-${selectedVersion.difficulty?.toString().toLowerCase()}`}>
                        {selectedVersion.difficulty}
                    </span>
                    <span>Tuning: {selectedVersion.tuning}</span>
                    <span>Capo: {selectedVersion.capoPos}</span>
                    {selectedVersion.sourceName && <span>Source: {selectedVersion.sourceName}</span>}
                </div>
            )}

            {/* Inline Hover Chord Bar */}
            

            {/* Lyrics & Chords Container */}
            <section className="chord-sheet-section fade-in-content">
                <h2>Chords &amp; Lyrics</h2>
                <div className="chord-sheet-container" style={{ maxWidth: "800px" }}>
                    {isTab ? (
                        <TabBlock tabData={rawSheet} />
                    ) : (
                        lines.map((line, index) => (
                            <ChordLyricLine key={index} line={line} chordFrets={chordFretMap} />
                        ))
                    )}
                </div>
            </section>

            {selectedVersion && uniqueChords.length > 0 && (
                <ChordReferencePanel chords={uniqueChords} strumPattern={selectedVersion.strumPattern} />
            )}
        </div>
    );
}

export default SongDetailPage;