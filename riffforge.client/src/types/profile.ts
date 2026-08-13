//profile.ts
import type { AiProviderPreference } from "./models";
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
    preferredProvider: AiProviderPreference;   // matches ProfileDto.PreferredProvider
    configuredProviders: string[];
}

export interface UpdateProfileRequest {
    skillLevel: string;
    dailyPracticeGoalMinutes: number;
    favoriteGenreIds: number[];
    masteredTechniqueIds: number[];
    preferredProvider: AiProviderPreference;   // matches ProfileDto.PreferredProvider
}
export interface ProviderKeyStatus {
    providerKey: string;      // "gemini" | "claude"
    configured: boolean;
    lastVerified: string | null;
}

// Placeholder — replace with your actual Difficulty enum member names
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];