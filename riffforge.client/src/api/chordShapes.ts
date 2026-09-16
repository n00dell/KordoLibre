export interface ChordShapeDto {
    id: number;
    fretPositions: string;
    isBarreChord: boolean;
    contributorName?: string;
    upvoteCount: number;
    isDefault: boolean;
}

export async function fetchChordShapes(chordName: string): Promise<ChordShapeDto[]> {
    const res = await fetch(`/api/chords/${encodeURIComponent(chordName)}/shapes`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function addChordShape(chordName: string, fretPositions: string, isBarreChord: boolean): Promise<ChordShapeDto> {
    const res = await fetch(`/api/chords/${encodeURIComponent(chordName)}/shapes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fretPositions, isBarreChord }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}