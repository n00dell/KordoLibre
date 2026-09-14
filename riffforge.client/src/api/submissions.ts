import type { UserSubmission, SubmitVersionRequest } from "../types/submissions";

export async function fetchUserSubmissions(songId: number): Promise<UserSubmission[]> {
    const res = await fetch(`/api/songs/${songId}/versions/submissions`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function submitVersion(songId: number, req: SubmitVersionRequest): Promise<UserSubmission> {
    const res = await fetch(`/api/songs/${songId}/versions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(req),
    });
    if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `HTTP ${res.status}`);
    }
    return res.json();
}