import type { AuthUser } from "../types/auth";
import type { Profile, ProfileOptions, UpdateProfileRequest } from "../types/profile";


export async function fetchMe(): Promise<AuthUser | null> {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { id: data.id, email: data.email };
}

export async function login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });
    if (res.status === 423) throw new Error("Account locked — too many failed attempts.");
    if (res.status === 401) throw new Error("Invalid email or password.");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function register(email: string, password: string): Promise<AuthUser> {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const errors = await res.json().catch(() => null);
        throw new Error(Array.isArray(errors) ? errors.join(" ") : `HTTP ${res.status}`);
    }
    return res.json();
}

export async function logout(): Promise<void> {
    const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
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