export interface UserSubmission {
    id: number;
    tabData: string;
    tuning: string;
    capoPos: string;
    difficulty: string;
    strumPattern: string;
    rating: number;
    ratingCount: number;
    contributorName: string;
    dateScraped: string;
}
export interface ChordShapeOverride {
    name: string;
    fretPositions: string;
    isBarreChord: boolean;
}
export interface SubmitVersionRequest {
    tabData: string;
    tuning: string;
    capoPos: string;
    difficulty: string;
    strumPattern: string;
    chordShapes?: ChordShapeOverride[];
}