// context/ThemeContext.ts — no components in this file, so Fast Refresh
// never needs to touch it; it can change freely without a full reload.
import { createContext, useContext } from "react";

export type ThemeName = "sunburst" | "chorus" | "cassette";

export const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
    { value: "sunburst", label: "Sunburst" },
    { value: "chorus", label: "Chorus Pedal" },
    { value: "cassette", label: "Cassette" },
];

export const STORAGE_KEY = "riffforge-theme";

export function readInitialTheme(): ThemeName {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "sunburst" || stored === "chorus" || stored === "cassette") {
        return stored;
    }
    return "sunburst";
}

interface ThemeContextValue {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
    theme: "sunburst",
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}