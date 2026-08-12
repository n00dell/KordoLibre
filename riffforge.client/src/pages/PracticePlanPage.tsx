import { useState } from "react";
import { Link } from "react-router-dom";
import { sampleSongs } from "../data/sampleData";
import type { PracticeProfile, UserSongProgress } from "../types/models";
import { Difficulty, TechniqueCategory } from "../types/enums";

// Stand-ins for GET /api/profile and GET /api/progress. In a real app these
// would come from useState + useEffect, same pattern as LibraryPage's comment.
const sampleProfile: PracticeProfile = {
    id: 1,
    userId: "user-1",
    skillLevel: Difficulty.Intermediate,
    dailyPracticeGoalMinutes: 20,
    favoriteGenres: [{ id: 1, name: "Britpop" }],
    masteredTechniques: [
        { id: 1, name: "Strumming", difficulty: Difficulty.Beginner, category: TechniqueCategory.Rhythm },
    ],
};

const sampleProgress: UserSongProgress[] = [
    { id: 1, userId: "user-1", songVersionId: 101, isCompleted: false, practiceCount: 4, lastPracticed: "2026-07-18" },
    { id: 2, userId: "user-1", songVersionId: 401, isCompleted: false, practiceCount: 1, lastPracticed: "2026-07-15" },
];

function PracticePlanPage() {
    const [profile] = useState<PracticeProfile>(sampleProfile);
    const [progress] = useState<UserSongProgress[]>(sampleProgress);

    // Join progress rows back to their parent Song, the way a SQL join would —
    // we're just doing it in memory since it's all mock data right now.
    const inProgressSongs = progress
        .map((p) => {
            const song = sampleSongs.find((s) => s.versions.some((v) => v.id === p.songVersionId));
            const version = song?.versions.find((v) => v.id === p.songVersionId);
            return song && version ? { song, version, progress: p } : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null); // drops any nulls, and tells TS the array no longer contains them

    return (
        <div className="practice-page">
            <h1>Practice Plan</h1>

            <div className="goal-card">
                <div>
                    <span className="goal-label">Daily goal</span>
                    <span className="goal-value">{profile.dailyPracticeGoalMinutes} min</span>
                </div>
                <div>
                    <span className="goal-label">Skill level</span>
                    <span className="goal-value">{profile.skillLevel}</span>
                </div>
            </div>

            <h2>Mastered Techniques</h2>
            <div className="chip-row">
                {profile.masteredTechniques.map((t) => (
                    <span key={t.id} className="chip chip-outline">
                        {t.name}
                    </span>
                ))}
            </div>

            <h2>Songs In Progress</h2>
            {inProgressSongs.length === 0 ? (
                <p className="empty-state">
                    Nothing in progress yet. Head to the <Link to="/">Library</Link> to start one.
                </p>
            ) : (
                <ul className="progress-list">
                    {inProgressSongs.map(({ song, version, progress }) => (
                        <li key={progress.id} className="progress-row">
                            <Link to={`/song/${song.id}`} className="progress-song-name">
                                {song.name}
                            </Link>
                            <span className={`difficulty-pill difficulty-${version.difficulty.toLowerCase()}`}>
                                {version.difficulty}
                            </span>
                            <span className="progress-count">Practiced {progress.practiceCount}x</span>
                            {progress.lastPracticed && (
                                <span className="progress-last">Last: {new Date(progress.lastPracticed).toLocaleDateString()}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PracticePlanPage;