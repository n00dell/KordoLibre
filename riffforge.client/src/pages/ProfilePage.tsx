import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchProfile, fetchProfileOptions, updateProfile } from "../api/profile";
import { SKILL_LEVELS } from "../types/profile";
import type { Profile, ProfileOptions } from "../types/profile";

function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [options, setOptions] = useState<ProfileOptions | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

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

    return (
        <div className="profile-page">
            <h1>Your Profile</h1>
            <p className="page-subtitle">{user?.email}</p>

            <div className="profile-form">
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

                <label className="profile-field">
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

                {options && options.genres && options.genres.length > 0 && (
                    <div className="profile-field">
                        <span>Favorite Genres</span>
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
                    </div>
                )}

                {options && options.techniques && options.techniques.length > 0 && (
                    <div className="profile-field">
                        <span>Mastered Techniques</span>
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
                    </div>
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
        </div>
    );
}

export default ProfilePage;