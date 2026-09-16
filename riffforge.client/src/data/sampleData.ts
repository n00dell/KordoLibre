// Stand-in data shaped exactly like what your ASP.NET API will eventually
// return from something like GET /api/songs. Keeping the shape identical
// now means swapping this for a real fetch() call later is a non-event —
// nothing that *consumes* this data has to change.
//
// A NOTE ON THE LYRICS: the song titles/artists below are real, but the
// TabData strings are intentionally invented placeholder lines, not the
// actual lyrics to these songs — copyrighted lyrics can't be reproduced,
// even as sample/demo data. When you wire this up to real data, TabData
// should come from a source you're licensed to use. The bracket format
// itself ("[G]some words") is what matters for this demo — swap the words.

import type { Song } from "../types/models";
import { Difficulty, Tuning, CapoPos, InstrumentType, ChordQuality, TechniqueCategory } from "../types/enums";

const strummingTechnique = { id: 1, name: "Strumming", description: "Steady down-up pattern", difficulty: Difficulty.Beginner, category: TechniqueCategory.Rhythm };
const fingerpickingTechnique = { id: 2, name: "Fingerpicking", description: "Travis-style picking pattern", difficulty: Difficulty.Advanced, category: TechniqueCategory.Picking };
const capoTechnique = { id: 5, name: "Capo Placement", description: "Using a capo to change key without new shapes", difficulty: Difficulty.Beginner, category: TechniqueCategory.Fretting };

export const sampleSongs: Song[] = [
    {
        id: 1,
        name: "Wonderwall",
        primaryArtist: { id: 1, name: "Oasis" },
        featuredArtists: [],
        bpm: 87,
        releaseDate: "1995-10-02",
        instrumentType: InstrumentType.AcousticGuitar,
        genres: [{ id: 1, name: "Britpop" }],
        versions: [
            {
                id: 101,
                songId: 1,
                tabData:
                    "[Em7]Placeholder line one for [G]demo purposes only\n" +
                    "[Dsus4]Swap this text for [A7sus4]licensed lyric data\n\n" +
                    "[Em7]Second verse placeholder [G]text goes here\n" +
                    "[Dsus4]Just standing in for [A7sus4]the real thing",
                strumPattern: "D-D-D-U",
                tuning: Tuning.Standard,
                capoPos: CapoPos.Fret2,
                difficulty: Difficulty.Beginner,
                rating: 4.6,
                ratingCount: 812,
                isDefault: true,
                contributorName: "riffmaster99",
                sourceUrl: "https://example.com/wonderwall",
                sourceName: "UltimateGuitar",
                chords: [
                    { id: 1, name: "Em7", root: "E", quality: ChordQuality.Minor7, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "022030", tuning: Tuning.Standard },
                    { id: 2, name: "G", root: "G", quality: ChordQuality.Major, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "320003", tuning: Tuning.Standard },
                ],
                techniques: [strummingTechnique, capoTechnique],
            },
            {
                id: 102,
                songId: 1,
                tabData:
                    "[Em]Slower fingerstyle take, [G]placeholder words\n" +
                    "[D]No capo this [A]time around",
                strumPattern: "D-D-Du",
                tuning: Tuning.Standard,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Intermediate,
                rating: 4.1,
                ratingCount: 203,
                isDefault: false,
                contributorName: "slow_hands_dan",
                sourceUrl: "https://example.com/wonderwall-fingerstyle",
                sourceName: "SongsterrClone",
                chords: [
                    { id: 1, name: "Em7", root: "E", quality: ChordQuality.Minor7, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "022030", tuning: Tuning.Standard },
                ],
                techniques: [fingerpickingTechnique],
            },
        ],
    },
    {
        id: 2,
        name: "Stairway to Heaven",
        primaryArtist: { id: 2, name: "Led Zeppelin" },
        featuredArtists: [],
        bpm: 82,
        releaseDate: "1971-11-08",
        instrumentType: InstrumentType.AcousticGuitar,
        genres: [{ id: 2, name: "Classic Rock" }],
        versions: [
            {
                id: 201,
                songId: 2,
                tabData:
                    "[Am]Sample placeholder [C]opening line here\n" +
                    "[D]Standing in for [F]the real lyric\n\n" +
                    "[Am]Another placeholder [C]line for verse two\n" +
                    "[D]Not the actual [F]song words",
                strumPattern: "D-D-D-U",
                tuning: Tuning.Standard,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Advanced,
                rating: 4.9,
                ratingCount: 2140,
                isDefault: true,
                contributorName: "zep_head",
                sourceUrl: "https://example.com/stairway",
                sourceName: "UltimateGuitar",
                chords: [{ id: 3, name: "Am", root: "A", quality: ChordQuality.Minor, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "x02210", tuning: Tuning.Standard }],
                techniques: [fingerpickingTechnique],
            },
            {
                id: 202,
                songId: 2,
                tabData: "[Am]Simplified beginner [C]placeholder version\n[D]Chords only, [F]no fingerpicking",
                strumPattern: "D-D-D-U",
                tuning: Tuning.Standard,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Beginner,
                rating: 3.9,
                ratingCount: 340,
                isDefault: false,
                contributorName: "easy_riffs",
                sourceUrl: "https://example.com/stairway-easy",
                sourceName: "UltimateGuitar",
                chords: [{ id: 3, name: "Am", root: "A", quality: ChordQuality.Minor, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "x02210", tuning: Tuning.Standard }],
                techniques: [strummingTechnique],
            },
            {
                id: 203,
                songId: 2,
                tabData: "[Am]Drop D placeholder [C]experimental take\n[D]For demo [F]purposes",
                strumPattern: "D-D-D-U",
                tuning: Tuning.DropD,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Expert,
                rating: 4.3,
                ratingCount: 88,
                isDefault: false,
                contributorName: "detuned_dave",
                sourceUrl: "https://example.com/stairway-dropd",
                sourceName: "SongsterrClone",
                chords: [{ id: 3, name: "Am", root: "A", quality: ChordQuality.Minor, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "x02210", tuning: Tuning.DropD }],
                techniques: [fingerpickingTechnique],
            },
        ],
    },
    {
        id: 3,
        name: "Johnny B. Goode",
        primaryArtist: { id: 3, name: "Chuck Berry" },
        featuredArtists: [],
        bpm: 168,
        releaseDate: "1958-03-31",
        instrumentType: InstrumentType.ElectricGuitar,
        genres: [{ id: 3, name: "Rock and Roll" }],
        versions: [
            {
                id: 301,
                songId: 3,
                tabData: "[E]Placeholder rock and roll [A]opening line\n[B7]Just demo text, [E]not the real song",
                strumPattern: "D-D-D-U",
                tuning: Tuning.Standard,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Intermediate,
                rating: 4.5,
                ratingCount: 530,
                isDefault: true,
                contributorName: "duckwalker",
                sourceUrl: "https://example.com/johnnybgoode",
                sourceName: "SongsterrClone",
                chords: [{ id: 4, name: "E", root: "E", quality: ChordQuality.Major, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "022100", tuning: Tuning.Standard }],
                techniques: [{ id: 3, name: "Double Stops", description: "Two-note bluesy licks", difficulty: Difficulty.Intermediate, category: TechniqueCategory.Fretting }],
            },
        ],
    },
    {
        id: 4,
        name: "Blackbird",
        primaryArtist: { id: 4, name: "The Beatles" },
        featuredArtists: [],
        bpm: 96,
        releaseDate: "1968-11-22",
        instrumentType: InstrumentType.AcousticGuitar,
        genres: [{ id: 4, name: "Folk Rock" }],
        versions: [
            {
                id: 401,
                songId: 4,
                tabData: "[G]Placeholder folk-style [Am7]opening line\n[G/B]Demo text standing in, [C]not the real lyric",
                strumPattern: "D-D-D-U",
                tuning: Tuning.Standard,
                capoPos: CapoPos.None,
                difficulty: Difficulty.Advanced,
                rating: 4.8,
                ratingCount: 990,
                isDefault: true,
                contributorName: "mccartney_fan",
                sourceUrl: "https://example.com/blackbird",
                sourceName: "UltimateGuitar",
                chords: [{ id: 5, name: "G", root: "G", quality: ChordQuality.Major, isBarreChord: false, difficulty: Difficulty.Beginner, fretPositions: "320003", tuning: Tuning.Standard }],
                techniques: [fingerpickingTechnique],
            },
        ],
    },
];