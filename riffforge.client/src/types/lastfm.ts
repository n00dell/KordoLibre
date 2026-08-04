export interface LastFmTrackSummary {
    name: string;
    artist: string;
    imageUrl?: string;
    listeners: number;
}

export interface ScrapeRequest {
    id: number;
    query: string;
    status: "Pending" | "InProgress" | "Completed" | "Failed";
    resultSongId?: number;
    errorMessage?: string;
}
export interface LocalSongMatch {
    id: number;
    name: string;
    artistName: string;
    albumArtUrl?: string;
}

export interface SongSearchResponse {
    localMatches: LocalSongMatch[];
    externalMatches: LastFmTrackSummary[];
}