export interface TabColumn {
    frets: number[]; // length 6, low E (index 0) to high e (index 5), -1 = no note this column
}
export interface TabSection {
    label?: string; // "Intro", "Verse 1", "Chorus"
    columns: TabColumn[];
}
export interface StructuredTab {
    sections: TabSection[];
}