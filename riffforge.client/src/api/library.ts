import type { Song } from "../types/models";

export async function fetchLibrarySongs(): Promise<Song[]> {
    const res = await fetch("/api/library");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchLibraryStatus(songIds: number[]): Promise<Set<number>> {
    if (songIds.length === 0) return new Set();
    const res = await fetch(`/api/library/status?songIds=${songIds.join(",")}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ids: number[] = await res.json();
    return new Set(ids);
}

export async function addToLibrary(songId: number): Promise<void> {
    const res = await fetch(`/api/library/${songId}`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function removeFromLibrary(songId: number): Promise<void> {
    const res = await fetch(`/api/library/${songId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}