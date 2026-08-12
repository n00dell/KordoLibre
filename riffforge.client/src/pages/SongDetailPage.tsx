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
    B: { frets: "x24442", isBarreChord: true },
    Bm: { frets: "x24432", isBarreChord: true },
    Cm: { frets: "x35543", isBarreChord: true },
    "C#m": { frets: "x46654", isBarreChord: true },
    "F#m": { frets: "244222", isBarreChord: true },
    "G#m": { frets: "466444", isBarreChord: true },
    Bb: { frets: "x13331", isBarreChord: true },
    Gm: { frets: "355333", isBarreChord: true },
    C7: { frets: "x32310", isBarreChord: false },
    G7: { frets: "320001", isBarreChord: false },
    A7: { frets: "x02020", isBarreChord: false },
    E7: { frets: "020100", isBarreChord: false },
    D7: { frets: "xx0212", isBarreChord: false },
    B7: { frets: "x21202", isBarreChord: false },
    Dmaj7: { frets: "xx0222", isBarreChord: false },
    Gmaj7: { frets: "320002", isBarreChord: false },
    Amaj7: { frets: "x02120", isBarreChord: false },
    Cadd9: { frets: "x32033", isBarreChord: false },
    // Flat Major Chords
    Db: { frets: "x46664", isBarreChord: true },
    Eb: { frets: "x68886", isBarreChord: true },
    Ab: { frets: "466544", isBarreChord: true },

    // Minor Chords
    Fm: { frets: "133111", isBarreChord: true },
    Bbm: { frets: "x13321", isBarreChord: true },
    Ebm: { frets: "x68876", isBarreChord: true },
    Abm: { frets: "466444", isBarreChord: true },
    Dbm: { frets: "x46654", isBarreChord: true },

    // Dominant & Minor 7ths
    Eb7: { frets: "x68686", isBarreChord: true },
    Bbm7: { frets: "x13121", isBarreChord: true },
    Fm7: { frets: "131111", isBarreChord: true },
    Ab7: { frets: "464544", isBarreChord: true }
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
const ROOT_POSITIONS: Record<string, number> = {
    C: 3, "C#": 4, Db: 4, D: 5, "D#": 6, Eb: 6, E: 7, F: 1, "F#": 2, Gb: 2, G: 3, "G#": 4, Ab: 4, A: 0, "A#": 1, Bb: 1, B: 2
};

function getMovableBarre(name: string): { frets: string; isBarreChord: boolean } {
    const isMinor = name.includes("m") && !name.includes("maj");
    const is7 = name.includes("7");
    const rootMatch = name.match(/^[A-G][b#]?/);
    if (!rootMatch) return { frets: "x00000", isBarreChord: false };

    const root = rootMatch[0];
    const fret = ROOT_POSITIONS[root] ?? 1;

    // Generate standard 5th-string root barre shape (A/Am style)
    if (isMinor && is7) return { frets: `x${fret}${fret + 2}${fret}${fret + 1}${fret}`, isBarreChord: true };
    if (isMinor) return { frets: `x${fret}${fret + 2}${fret + 2}${fret + 1}${fret}`, isBarreChord: true };
    if (is7) return { frets: `x${fret}${fret + 2}${fret}${fret + 2}${fret}`, isBarreChord: true };

    return { frets: `x${fret}${fret + 2}${fret + 2}${fret + 2}${fret}`, isBarreChord: true };
}

const lookupChordInfo = (name: string): { frets: string; isBarreChord: boolean } =>
    COMMON_CHORD_FRETS[name] ??
    Object.entries(COMMON_CHORD_FRETS).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] ??
    getMovableBarre(name);

function SongDetailPage() {
    const { id, versionId } = useParams<{ id: string; versionId?: string }>();
    const { theme } = useTheme();
    const [song, setSong] = useState<Song | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryBusy, setLibraryBusy] = useState(false);
    const [generatingNotation, setGeneratingNotation] = useState(false);


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

        const chordMap = new Map<string, ChordItem>();
        const tabText = selectedVersion.tabData || "";
        const matches = tabText.match(/\[([A-G][b#]?[\w#/]*)\]/g) || [];
        const extractedNames = Array.from(new Set(matches.map((m) => m.replace(/\[|\]/g, ""))));

        // Combine DB chords and extracted bracketed chords
        const allNames = new Set([
            ...(selectedVersion.chords || []).map((c) => c.name),
            ...extractedNames
        ]);

        allNames.forEach((name) => {
            const dbChord = (selectedVersion.chords || []).find((c) => c.name === name);
            const standardInfo = lookupChordInfo(name);

            // Fallback to standard open shape if DB shape is missing or suspicious (e.g. 7+ chars)
            const frets = standardInfo.frets !== "x00000"
                ? standardInfo.frets
                : (dbChord?.fretPositions || "x00000");

            const isBarre = standardInfo.frets !== "x00000"
                ? standardInfo.isBarreChord
                : (dbChord?.isBarreChord ?? false);

            chordMap.set(name, {
                name,
                fretPositions: frets,
                isBarreChord: isBarre
            });
        });

        return Array.from(chordMap.values());
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
    const [notationError] = useState<string | null>(null);

    async function requestOtherNotation(targetNotationType: 0 | 1) {
              if (!song || generatingNotation) return;
               setGeneratingNotation(true);
               try {
                       const res = await fetch(`/api/songs/${song.id}/versions/generate`, {
 method: "POST",
                               headers: { "Content-Type": "application/json" },
                               body: JSON.stringify({ notationType: targetNotationType })
                       });
                  if (res.ok) {
                           const newVersion: SongVersion = await res.json();
                           setSong((s) => (s ? { ...s, versions: [...(s.versions ?? []), newVersion] } : s));
                           setSelectedVersion(newVersion);
                       }
               } finally {
                       setGeneratingNotation(false);
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

            {selectedVersion && (
                <div className="notation-switch fade-in-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", margin: "0.5rem 0" }}>
                    {!song.versions?.some((v) => v.notationType === 1) && (
                        <button type="button" onClick={() => requestOtherNotation(1)} disabled={generatingNotation}>
                            {generatingNotation ? "Generating…" : "Generate Tab Version"}
                        </button>
                    )}
                    {!song.versions?.some((v) => v.notationType === 0) && (
                        <button type="button" onClick={() => requestOtherNotation(0)} disabled={generatingNotation}>
                            {generatingNotation ? "Generating…" : "Generate Chords-Over-Lyrics Version"}
                        </button>
                    )}
                    {notationError && <p className="empty-state" style={{ color: "#f87171" }}>{notationError}</p>}
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
                <ChordReferencePanel
                    chords={uniqueChords}
                    strumPattern={selectedVersion.strumPattern}
                    bpm={song.bpm}
                />
            )}
        </div>
    );
}

export default SongDetailPage;