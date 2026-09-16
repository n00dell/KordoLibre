// NOTE: rewritten to avoid TypeScript's `enum` keyword.
//
// `enum` generates actual runtime JS (an object gets built behind the
// scenes) — it is NOT "erasable" (can't be deleted at compile time and
// leave valid JS behind). If your project has `erasableSyntaxOnly: true`
// in tsconfig (common when running TS directly via Node's built-in type
// stripping, which just deletes type syntax rather than transforming it),
// `enum` is rejected outright.
//
// The fix is a well-known pattern: a plain `const` object (real runtime
// values, works exactly like Difficulty.Beginner did before) paired with a
// `type` alias of the same name derived from it (for use in type
// positions, like `difficulty: Difficulty`). TypeScript merges the two
// under one name automatically — nothing else in your code has to change.

export const Difficulty = {
    Beginner: "Beginner",
    Intermediate: "Intermediate",
    Advanced: "Advanced",
    Expert: "Expert",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const Tuning = {
    Standard: "Standard",
    DropD: "DropD",
    HalfStepDown: "HalfStepDown",
    OpenG: "OpenG",
    DADGAD: "DADGAD",
    OpenD: "DADF#AD",
    FullStepDown: "DGCFAD",
    DropC: "CGCFAD",
    
} as const;
export type Tuning = (typeof Tuning)[keyof typeof Tuning];

export const CapoPos = {
    None: "None",
    Fret1: "Fret1",
    Fret2: "Fret2",
    Fret3: "Fret3",
    Fret4: "Fret4",
    Fret5: "Fret5",
} as const;
export type CapoPos = (typeof CapoPos)[keyof typeof CapoPos];


export const InstrumentType = {
    AcousticGuitar: "AcousticGuitar",
    ElectricGuitar: "ElectricGuitar",
    Bass: "Bass",
    Ukulele: "Ukulele",
} as const;
export type InstrumentType = (typeof InstrumentType)[keyof typeof InstrumentType];

export const ChordQuality = {
    Major: "Major",
    Minor: "Minor",
    Dominant7: "Dominant7",
    Major7: "Major7",
    Minor7: "Minor7",
    Sus2: "Sus2",
    Sus4: "Sus4",
    Diminished: "Diminished",
    Augmented: "Augmented",
} as const;
export type ChordQuality = (typeof ChordQuality)[keyof typeof ChordQuality];

export const TechniqueCategory = {
    Fretting: "Fretting",
    Picking: "Picking",
    Rhythm: "Rhythm",
} as const;
export type TechniqueCategory = (typeof TechniqueCategory)[keyof typeof TechniqueCategory];

export const NotationType = {
    ChordsOverLyrics: "ChordsOverLyrics",
    TabNotation: "TabNotation",
} as const;
export type NotationType = (typeof NotationType)[keyof typeof NotationType];