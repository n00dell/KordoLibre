// Each interface below mirrors one of your C# model classes.
// A few differences on purpose:
//  - EF-only stuff (jsonb columns, [Index], [ForeignKey] attributes, DateScraped
//    bookkeeping) is left out — the frontend doesn't care how the DB stores it.
//  - `?` after a property name means "optional", same idea as C#'s `string?`.
//  - Navigation properties (Song.Versions, SongVersion.Chords, etc) are kept,
//    since your API will likely return them nested (or you'll fetch them
//    separately later — either way, the shape is useful to have typed now).

import type { Difficulty, Tuning, CapoPos, StrumPattern, InstrumentType, ChordQuality, TechniqueCategory } from "./enums";

export type AiProviderPreference = "Auto" | "Gemini" | "Claude";


export interface Artist {
    id: number;
    name: string;
    bio?: string;
    imageUrl?: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface Chord {
    id: number;
    name: string; // e.g. "Am7", "F#dim"
    root: string;
    quality: ChordQuality;
    isBarreChord: boolean;
    difficulty: Difficulty;
    fretPositions?: string; // e.g. "x02220"
    fingeringPattern?: string;
    tuning: Tuning;
}

export interface Technique {
    id: number;
    name: string; // e.g. "Hammer-on", "Palm Mute"
    description?: string;
    difficulty: Difficulty;
    category: TechniqueCategory;
}

// This is SongVersion.cs — one song can have multiple community-submitted
// versions (different tab, different rating, etc). One of them is IsDefault.
export interface SongVersion {
    id: number;
    songId: number;
    tabData?: string;
    strumPattern: StrumPattern;
    tuning: Tuning;
    capoPos: CapoPos;
    difficulty: Difficulty;
    rating: number; // 0-5
    ratingCount: number;
    isDefault: boolean;
    contributorName?: string;
    sourceUrl?: string;
    sourceName?: string;
    chords: Chord[];
    notationType?: number;
    techniques: Technique[];
}

export interface Song {
    id: number;
    name: string;
    primaryArtist: Artist;
    featuredArtists: Artist[];
    bpm: number;
    releaseDate: string; // dates arrive from the API as ISO strings, not Date objects
    instrumentType: InstrumentType;
    genres: Genre[];
    versions: SongVersion[];
    albumArtUrl?: string;
    lyrics?: string;
    isInLibrary?: boolean;
}

// A couple of small "derived" helpers, same idea as the [NotMapped] properties
// on your C# Song class (FullDisplayName, DefaultVersion). In C# those live on
// the model itself; in React it's more idiomatic to keep them as plain
// functions and call them where needed.
export function getDefaultVersion(song: Song): SongVersion | undefined {
    return song.versions.find((v) => v.isDefault) ?? song.versions[0];
}

export function getFullDisplayName(song: Song): string {
    return `${song.name} - ${song.primaryArtist?.name ?? "Unknown"}`;
}

// Mirrors UserSongProgress.cs — tracks one user's progress on one specific version.
export interface UserSongProgress {
    id: number;
    userId: string;
    songVersionId: number;
    isCompleted: boolean;
    dateCompleted?: string;
    practiceCount: number;
    lastPracticed?: string;
    personalRating?: number;
    notes?: string;
}

// Mirrors UserProfile.cs
export interface PracticeProfile {
    id: number;
    userId: string;
    skillLevel: Difficulty;
    dailyPracticeGoalMinutes: number;
    favoriteGenres: Genre[];
    masteredTechniques: Technique[];
}

