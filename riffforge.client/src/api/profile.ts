import type { Profile, ProfileOptions, UpdateProfileRequest } from "../types/profile";



export async function fetchProfile(): Promise<Profile> {
    const res = await fetch("/api/profile", { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function fetchProfileOptions(): Promise<ProfileOptions> {
    const res = await fetch("/api/profile/options", { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function updateProfile(req: UpdateProfileRequest): Promise<Profile> {
    const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}