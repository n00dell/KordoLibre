import { createContext, useContext } from "react";

export type ThemeName = "sunburst" | "chorus" | "cassette" | "vinyl";

export interface ThemeOption {
    value: ThemeName;
    label: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
    { value: "sunburst", label: "Sunburst (Color)" },
    { value: "chorus", label: "Chorus (Color)" },
    { value: "vinyl", label: "Vinyl (Card)" },
    { value: "cassette", label: "Cassette (Card)" },
];

export const STORAGE_KEY = "riffforge-theme";

export function readInitialTheme(): ThemeName {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "sunburst" || stored === "chorus" || stored === "cassette" || stored === "vinyl") {
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
    setTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}