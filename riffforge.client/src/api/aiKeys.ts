import type { ProviderKeyStatus } from "../types/profile";

const BASE = "/api/profile/ai-keys";

export async function listProviderKeys(): Promise<ProviderKeyStatus[]> {
    const res = await fetch(BASE, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load AI provider status.");
    return res.json();
}

export async function saveProviderKey(providerKey: string, apiKey: string): Promise<void> {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ providerKey, apiKey }),
    });
    if (!res.ok) throw new Error((await res.text()) || "Failed to save API key.");
}

export async function deleteProviderKey(providerKey: string): Promise<void> {
    const res = await fetch(`${BASE}/${providerKey}`, { method: "DELETE", credentials: "include" });
    if (!res.ok && res.status !== 404) throw new Error("Failed to remove API key.");
}

export async function testProviderKey(providerKey: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${BASE}/${providerKey}/test`, { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error("Test request failed.");
    return res.json();
}