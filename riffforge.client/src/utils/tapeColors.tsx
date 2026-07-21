// utils/tapeColors.ts
// Same idea as gradients.ts: turn a genre into a "consistent" cassette
// shell color. Falls back to the song's own id if it has no genre yet
// (e.g. mid-scrape, before Genre rows are attached).

const GENRE_TAPE_COLORS: Record<string, string> = {
    Rock: "#8a2a2a",
    Pop: "#b5533c",
    Britpop: "#3c5e8a",
    Metal: "#2a2a2a",
    Jazz: "#5e4a8a",
    Folk: "#5e7a3c",
    Blues: "#2a4a6e",
    Punk: "#c8443c",
    Indie: "#3c8a6e",
    HipHop: "#8a6e2a",
    Classical: "#6e5e4a",
};

const FALLBACK_TAPE_COLORS = ["#8a2a2a", "#3c5e8a", "#5e7a3c", "#8a6e2a", "#5e4a8a", "#3c8a6e"];

export function tapeColorForGenre(genreName?: string, fallbackSeed = 0): string {
    if (genreName && GENRE_TAPE_COLORS[genreName]) {
        return GENRE_TAPE_COLORS[genreName];
    }
    return FALLBACK_TAPE_COLORS[fallbackSeed % FALLBACK_TAPE_COLORS.length];
}