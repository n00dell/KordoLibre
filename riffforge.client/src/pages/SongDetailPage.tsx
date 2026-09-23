// src/pages/SongDetailPage.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { Song, SongVersion } from "../types/models";
import { sampleSongs } from "../data/sampleData";
import { useTheme } from "../context/ThemeContext";
import ChordReferencePanel from "../components/ChordReferencePanel";
import type { ChordItem } from "../types/models";
import TurntablePlayer from "../components/TurntablePlayer";
import TapeDeckPlayer from "../components/TapeDeckPlayer";
import TabBlock from "../components/TabBlock";
import  {lookupChordInfo} from "../utils/chordLookup.ts";
import UserSubmissionsPanel from "../components/UserSubmissionsPanel";
import ChordSubmissionEditor from "../components/ChordSubmissionEditor";
import { fetchUserSubmissions } from "../api/submissions";
import type { UserSubmission } from "../types/submissions";
import { fetchLibraryStatus, addToLibrary, removeFromLibrary } from "../api/library";
import ChordProgressionView from "../components/ChordProgressionView.tsx";

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


function SongDetailPage() {
    const { id, versionId } = useParams<{ id: string; versionId?: string }>();
    const { theme } = useTheme();
    const [song, setSong] = useState<Song | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryBusy, setLibraryBusy] = useState(false);
    const [generatingNotation, setGeneratingNotation] = useState(false);
    
// Also create a helper to get the full chord info
    const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const loadSubmissions = useCallback(async (songId: number) => {
        setLoadingSubmissions(true);
        try {
            setUserSubmissions(await fetchUserSubmissions(songId));
        } catch (err) {
            console.error("Failed to load submissions:", err);
        } finally {
            setLoadingSubmissions(false);
        }
    }, []);

    useEffect(() => {
        if (song && song.id >= 0) loadSubmissions(song.id);
    }, [song, loadSubmissions]);
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
    const [notationError, setNotationError] = useState<string | null>(null);
    const structuredTab = useMemo(() => {
        if (!selectedVersion?.structuredTabJson) return null;
        try { return JSON.parse(selectedVersion.structuredTabJson); }
        catch { return null; }
    }, [selectedVersion]);

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
                  } else {
                      setNotationError("Couldn't generate that version right now.");
                  }
               } catch {
                   setNotationError("Couldn't generate that version right now.");
               }
            finally {
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

    const rawSheet = selectedVersion?.tabData ?? "";

    const isTab = selectedVersion
        ? selectedVersion.notationType === "TabNotation" || (selectedVersion.notationType == null && looksLikeTab(rawSheet))
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
                            {v.isDefault ? "Original" : "Alternate"} · {v.notationType === "TabNotation" ? "Tab" : "Chords"} ({v.difficulty})
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
                    {!song.versions?.some((v) => v.notationType === "TabNotation") && (
                        <button className="notation-gen-btn" type="button" onClick={() => requestOtherNotation(1)} disabled={generatingNotation}>
                            {generatingNotation ? "Generating…" : "Generate Tab Version"}
                        </button>
                    )}
                    {!song.versions?.some((v) => v.notationType === "ChordsOverLyrics") && (
                        <button className="notation-gen-btn" type="button" onClick={() => requestOtherNotation(0)} disabled={generatingNotation}>
                            {generatingNotation ? "Generating…" : "Generate Chords Progression Version"}
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
                        <TabBlock tabData={rawSheet} structuredTab={structuredTab} />
                    ) : (
                        <ChordProgressionView tabData={rawSheet} chordFrets={chordFretMap} />
                    )}
                </div>
            </section>
            {song.id >= 0 && (
                <section className="user-submissions-section fade-in-content">
                    <div className="user-submissions-header">
                        <h2>Community Submissions</h2>
                        <button type="button" className="notation-gen-btn" onClick={() => setShowEditor((v) => !v)}>
                            {showEditor ? "Close" : "+ Add your version"}
                        </button>
                    </div>

                    {showEditor && (
                        <ChordSubmissionEditor
                            songId={song.id}
                            onCancel={() => setShowEditor(false)}
                            onSubmitted={(s) => {
                                setUserSubmissions((prev) => [s, ...prev]);
                                setShowEditor(false);
                            }}
                        />
                    )}

                    <UserSubmissionsPanel submissions={userSubmissions} loading={loadingSubmissions} />
                </section>
            )}
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