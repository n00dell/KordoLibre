// src/components/AiProviderSettings.tsx
import { useEffect, useState } from "react";
import type { AiProviderPreference, ProviderKeyStatus } from "../types/profile.ts";
import { listProviderKeys, saveProviderKey, deleteProviderKey, testProviderKey } from "../api/aiKeys";

interface Props {
    preferredProvider: AiProviderPreference;
    onPreferredProviderChange: (pref: AiProviderPreference) => void;
}

const PROVIDERS: { key: string; label: AiProviderPreference }[] = [
    { key: "gemini", label: "Gemini" },
    { key: "claude", label: "Claude" },
];

export default function AiProviderSettings({ preferredProvider, onPreferredProviderChange }: Props) {
    const [statuses, setStatuses] = useState<ProviderKeyStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
    const [busyProvider, setBusyProvider] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<Record<string, string>>({});

    useEffect(() => {
        listProviderKeys()
            .then(setStatuses)
            .catch(() => setStatuses([]))
            .finally(() => setLoading(false));
    }, []);

    async function handleSave(providerKey: string) {
        const apiKey = keyInputs[providerKey]?.trim();
        if (!apiKey) return;
        setBusyProvider(providerKey);
        try {
            await saveProviderKey(providerKey, apiKey);
            setKeyInputs((prev) => ({ ...prev, [providerKey]: "" }));
            const updated = await listProviderKeys();
            setStatuses(updated);
            setTestResult((prev) => ({ ...prev, [providerKey]: "" }));
        } catch (err) {
            setTestResult((prev) => ({ ...prev, [providerKey]: err instanceof Error ? err.message : "Save failed." }));
        } finally {
            setBusyProvider(null);
        }
    }

    async function handleDelete(providerKey: string) {
        setBusyProvider(providerKey);
        try {
            await deleteProviderKey(providerKey);
            setStatuses((prev) => prev.map((s) => (s.providerKey === providerKey ? { ...s, configured: false, lastVerified: null } : s)));
        } finally {
            setBusyProvider(null);
        }
    }

    async function handleTest(providerKey: string) {
        setBusyProvider(providerKey);
        setTestResult((prev) => ({ ...prev, [providerKey]: "Testing…" }));
        try {
            const result = await testProviderKey(providerKey);
            setTestResult((prev) => ({ ...prev, [providerKey]: result.success ? "✓ Working" : `✗ ${result.error ?? "Failed"}` }));
            if (result.success) {
                const updated = await listProviderKeys();
                setStatuses(updated);
            }
        } catch {
            setTestResult((prev) => ({ ...prev, [providerKey]: "✗ Test request failed." }));
        } finally {
            setBusyProvider(null);
        }
    }

    if (loading) return <p className="empty-state">Loading AI settings…</p>;

    return (
        <div className="ai-provider-settings">
            <div className="ai-provider-preference">
                <label htmlFor="preferred-provider">Preferred AI provider</label>
                <select
                    id="preferred-provider"
                    value={preferredProvider}
                    onChange={(e) => onPreferredProviderChange(e.target.value as AiProviderPreference)}
                >
                    <option value="Auto">Auto (Gemini, falls back to Claude)</option>
                    <option value="Gemini">Gemini only</option>
                    <option value="Claude">Claude only</option>
                </select>
                <p className="field-hint">
                    Picking a specific provider skips the fallback — if it fails, generation fails
                    (switch back to Auto to let it fail over automatically).
                </p>
            </div>

            {PROVIDERS.map(({ key, label }) => {
                const status = statuses.find((s) => s.providerKey === key);
                return (
                    <div key={key} className="ai-provider-key-row">
                        <div className="ai-provider-key-header">
                            <span>{label}</span>
                            {status?.configured && (
                                <span className="ai-provider-key-badge">
                                    {status.lastVerified ? "Verified" : "Saved (untested)"}
                                </span>
                            )}
                        </div>

                        <div className="ai-provider-key-input-row">
                            <input
                                type="password"
                                placeholder={status?.configured ? "Replace saved key…" : `Your ${label} API key`}
                                value={keyInputs[key] ?? ""}
                                onChange={(e) => setKeyInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                            />
                            <button type="button" disabled={busyProvider === key || !keyInputs[key]} onClick={() => handleSave(key)}>
                                Save
                            </button>
                            {status?.configured && (
                                <>
                                    <button type="button" disabled={busyProvider === key} onClick={() => handleTest(key)}>
                                        Test
                                    </button>
                                    <button type="button" disabled={busyProvider === key} onClick={() => handleDelete(key)}>
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>

                        {testResult[key] && <p className="ai-provider-test-result">{testResult[key]}</p>}
                    </div>
                );
            })}
        </div>
    );
}