export interface ProfileOptionItem {
    id: number;
    name: string;
}

export interface ProfileOptions {
    genres: ProfileOptionItem[];
    techniques: ProfileOptionItem[];
}

export interface Profile {
    email: string;
    skillLevel: string;
    dailyPracticeGoalMinutes: number;
    favoriteGenreIds: number[];
    masteredTechniqueIds: number[];
}

export interface UpdateProfileRequest {
    skillLevel: string;
    dailyPracticeGoalMinutes: number;
    favoriteGenreIds: number[];
    masteredTechniqueIds: number[];
}

// Placeholder — replace with your actual Difficulty enum member names
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];