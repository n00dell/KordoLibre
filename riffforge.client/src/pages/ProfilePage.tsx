import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchProfile, fetchProfileOptions, updateProfile } from "../api/profile";
import { SKILL_LEVELS } from "../types/profile";
import type { Profile, ProfileOptions } from "../types/profile";
import "../styles/ProfilePage.css";

// ---- Stand-in data for the "Sound Sources" / "Your Shelf" sections ----
// These are UI-only right now — nothing here calls an API. Once real
// Last.fm/Spotify OAuth exists, lastfmConnected/spotifyConnected should
// come from the fetched Profile (or a dedicated /api/connections
// endpoint) instead of local useState, and shelfPlaylists should come
// from whatever import endpoint pulls a user's Spotify playlists.
interface ShelfPlaylist {
    id: number;
    title: string;
    source: string;
    trackCount: number;
}

const sampleShelfPlaylists: ShelfPlaylist[] = [
    { id: 1, title: "Fingerstyle Favorites", source: "Spotify", trackCount: 24 },
    { id: 2, title: "Blues Warmups", source: "Spotify", trackCount: 12 },
    { id: 3, title: "90s Grunge Riffs", source: "Spotify", trackCount: 31 },
    { id: 4, title: "Sunday Acoustic", source: "Spotify", trackCount: 18 },
];

// Knob rotation range, purely visual. profile.dailyPracticeGoalMinutes has
// no hard max on the backend, so we clamp just for how far the dial turns.
const KNOB_MIN = 5;
const KNOB_MAX = 60;

function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [options, setOptions] = useState<ProfileOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // Local-only UI state — see comment above sampleShelfPlaylists.
    const [lastfmConnected, setLastfmConnected] = useState(false);
    const [spotifyConnected, setSpotifyConnected] = useState(true);

    useEffect(() => {
        let cancelled = false;

        Promise.all([fetchProfile(), fetchProfileOptions()])
            .then(([p, o]) => {
                if (cancelled) return;
                setProfile(p);
                setOptions(o);
            })
            .catch((err) => {
                if (!cancelled) setError((err as Error).message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    function toggleGenre(id: number) {
        if (!profile) return;
        const genres = profile.favoriteGenreIds ?? [];
        const has = genres.includes(id);
        setProfile({
            ...profile,
            favoriteGenreIds: has ? genres.filter((g) => g !== id) : [...genres, id],
        });
    }

    function toggleTechnique(id: number) {
        if (!profile) return;
        const techniques = profile.masteredTechniqueIds ?? [];
        const has = techniques.includes(id);
        setProfile({
            ...profile,
            masteredTechniqueIds: has ? techniques.filter((t) => t !== id) : [...techniques, id],
        });
    }

    async function handleSave() {
        if (!profile) return;
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const updated = await updateProfile({
                skillLevel: profile.skillLevel,
                dailyPracticeGoalMinutes: profile.dailyPracticeGoalMinutes,
                favoriteGenreIds: profile.favoriteGenreIds ?? [],
                masteredTechniqueIds: profile.masteredTechniqueIds ?? [],
            });
            setProfile(updated);
            setSaved(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p className="empty-state">Loading profile…</p>;
    if (error) return <p className="empty-state">Couldn't load profile: {error}</p>;
    if (!profile) return <p className="empty-state">No profile found.</p>;

    const favoriteGenreIds = profile.favoriteGenreIds ?? [];
    const masteredTechniqueIds = profile.masteredTechniqueIds ?? [];

    // Derive a display name + initials from the email since Profile has no
    // name field yet. "nathan.drake@gmail.com" -> "Nathan Drake" / "ND".
    const displayName = user?.email
        ? user.email
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Guitarist";
    const initials =
        displayName
            .split(" ")
            .filter(Boolean)
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "RF";

    // user.id is a string (see AuthUser), so we just take a short slice for
    // the pass's serial number rather than trying to coerce it to a number.
    const serial = user?.id ? user.id.slice(0, 8).toUpperCase() : "GUEST";

    const skillIndex = SKILL_LEVELS.indexOf(profile.skillLevel);
    const knobPct = Math.min(
        1,
        Math.max(0, (profile.dailyPracticeGoalMinutes - KNOB_MIN) / (KNOB_MAX - KNOB_MIN))
    );
    const knobDeg = -135 + knobPct * 270;

    return (
        <div className="profile-page">
            <p className="rf-eyebrow">Member area</p>
            <h1>Your Profile</h1>
            <p className="page-subtitle">{user?.email}</p>

            {/* ================= BACKSTAGE PASS ================= */}
            <div className="rf-pass-stage">
                <div className="rf-pass">
                    <div className="rf-pass-clip" />
                    <div className="rf-pass-hole" />
                    <div className="rf-pass-eyebrow-row">
                        <span className="rf-pass-badge">All Access · Guitar</span>
                        <span className="rf-pass-no">№ {serial}</span>
                    </div>
                    <div className="rf-pass-id">
                        <div className="rf-vinyl-avatar">{initials}</div>
                        <div>
                            <p className="rf-pass-name">{displayName}</p>
                            <p className="rf-pass-email">{user?.email}</p>
                            <div className="rf-pass-tags">
                                <span className="rf-pass-tag rf-pass-tag-skill">{profile.skillLevel}</span>
                                <span className="rf-pass-tag">{profile.dailyPracticeGoalMinutes} min/day</span>
                            </div>
                        </div>
                    </div>
                    <div className="rf-barcode" />
                    <div className="rf-barcode-code">RIFFFORGE · {serial} · ALLACCESS</div>
                </div>
            </div>

            {/* ================= PRACTICE RIG ================= */}
            <section className="rf-block">
                <div className="rf-block-head">
                    <h2>Practice Rig</h2>
                    <p className="rf-block-sub">Dial in your goal, track where your skill sits.</p>
                </div>
                <div className="rf-panel rf-rig">
                    <div>
                        <div className="rf-knob-row">
                            <div className="rf-knob-control">
                                <div className="rf-knob" style={{ transform: `rotate(${knobDeg}deg)` }}>
                                    <div className="rf-knob-notch" />
                                </div>
                            </div>
                            <div className="rf-knob-readout">
                                <span className="rf-knob-num">{profile.dailyPracticeGoalMinutes}</span>
                                <span className="rf-knob-label">MIN / DAY GOAL</span>
                            </div>
                        </div>
                        <label className="profile-field rf-goal-input">
                            <span>Daily Practice Goal (minutes)</span>
                            <input
                                type="number"
                                min={1}
                                value={profile.dailyPracticeGoalMinutes || 0}
                                onChange={(e) =>
                                    setProfile({ ...profile, dailyPracticeGoalMinutes: Number(e.target.value) })
                                }
                            />
                        </label>
                    </div>
                    <div>
                        <label className="profile-field">
                            <span>Skill Level</span>
                            <select
                                value={profile.skillLevel || ""}
                                onChange={(e) => setProfile({ ...profile, skillLevel: e.target.value })}
                            >
                                {SKILL_LEVELS.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="rf-meter">
                            {SKILL_LEVELS.map((level, i) => (
                                <div key={level} className={`rf-meter-segment${i <= skillIndex ? " lit" : ""}`} />
                            ))}
                        </div>
                        <div className="rf-meter-labels">
                            <span>{SKILL_LEVELS[0]?.toUpperCase()}</span>
                            <span>{SKILL_LEVELS[SKILL_LEVELS.length - 1]?.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= SOUND SOURCES (UI only, not wired up) ================= */}
            <section className="rf-block">
                <div className="rf-block-head">
                    <h2>Sound Sources</h2>
                    <p className="rf-block-sub">Plug in a source to scrobble sessions or pull in playlists.</p>
                </div>
                <div className="rf-patchbay">
                    <div className="rf-jack-module rf-jack-lastfm">
                        <div className="rf-jack-top">
                            <div className="rf-jack-icon">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6}>
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 3v6M9 6h6" />
                                </svg>
                            </div>
                            <div>
                                <div className="rf-jack-name">Last.fm</div>
                                <div className="rf-jack-sub">Scrobble every practice session</div>
                            </div>
                        </div>
                        <div className="rf-jack-bottom">
                            <button
                                type="button"
                                className={`rf-patch-switch${lastfmConnected ? " on" : ""}`}
                                aria-pressed={lastfmConnected}
                                onClick={() => setLastfmConnected((v) => !v)}
                            >
                                <span className="rf-patch-thumb" />
                            </button>
                            <span className="rf-patch-status">
                                <span className={`rf-status-dot${lastfmConnected ? " on" : ""}`} />
                                {lastfmConnected ? "Connected" : "Tap to connect"}
                            </span>
                        </div>
                    </div>

                    <div className="rf-jack-module rf-jack-spotify">
                        <div className="rf-jack-top">
                            <div className="rf-jack-icon">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6}>
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M7 10c4-1.4 7.5-1 10 .8M7.5 13.2c3-1 6-.7 8.3.8M8 16.2c2.2-.7 4.5-.5 6.3.6" />
                                </svg>
                            </div>
                            <div>
                                <div className="rf-jack-name">Spotify</div>
                                <div className="rf-jack-sub">Import playlists as chord sheets</div>
                            </div>
                        </div>
                        <div className="rf-jack-bottom">
                            <button
                                type="button"
                                className={`rf-patch-switch${spotifyConnected ? " on" : ""}`}
                                aria-pressed={spotifyConnected}
                                onClick={() => setSpotifyConnected((v) => !v)}
                            >
                                <span className="rf-patch-thumb" />
                            </button>
                            <span className="rf-patch-status">
                                <span className={`rf-status-dot${spotifyConnected ? " on" : ""}`} />
                                {spotifyConnected ? "Connected" : "Tap to connect"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= SHELF (UI only, mock data) ================= */}
            {spotifyConnected && (
                <section className="rf-block">
                    <div className="rf-block-head">
                        <h2>Your Shelf</h2>
                        <p className="rf-block-sub">Pulled in from Spotify — add the ones you want to practice.</p>
                    </div>
                    <div className="rf-shelf">
                        {sampleShelfPlaylists.map((p) => (
                            <div key={p.id} className="rf-shelf-item">
                                <div className="rf-tape-art">
                                    <span className="rf-reel l" />
                                    <span className="rf-reel r" />
                                </div>
                                <div className="rf-shelf-title">{p.title}</div>
                                <div className="rf-shelf-source">
                                    {p.source} · {p.trackCount} tracks
                                </div>
                                <button type="button" className="rf-shelf-add">
                                    + Add to Library
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ================= GENRES ================= */}
            {options && options.genres && options.genres.length > 0 && (
                <section className="rf-block">
                    <div className="rf-block-head">
                        <h2>Favorite Genres</h2>
                        <p className="rf-block-sub">Shapes what shows up first in Search.</p>
                    </div>
                    <div className="profile-chip-select">
                        {options.genres.map((g) => (
                            <button
                                type="button"
                                key={g.id}
                                className={`profile-chip${favoriteGenreIds.includes(g.id) ? " active" : ""}`}
                                onClick={() => toggleGenre(g.id)}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* ================= TECHNIQUES ================= */}
            {options && options.techniques && options.techniques.length > 0 && (
                <section className="rf-block">
                    <div className="rf-block-head">
                        <h2>Mastered Techniques</h2>
                        <p className="rf-block-sub">Songs using only these will show a "ready" badge.</p>
                    </div>
                    <div className="profile-chip-select">
                        {options.techniques.map((t) => (
                            <button
                                type="button"
                                key={t.id}
                                className={`profile-chip${masteredTechniqueIds.includes(t.id) ? " active" : ""}`}
                                onClick={() => toggleTechnique(t.id)}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {saved && <p className="profile-saved-msg">Saved.</p>}

            <div className="profile-actions">
                <button type="button" className="auth-submit-btn" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" className="profile-logout-btn" onClick={logout}>
                    Log Out
                </button>
            </div>
        </div>
    );
}

export default ProfilePage;