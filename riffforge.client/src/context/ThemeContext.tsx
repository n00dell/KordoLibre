import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// All three options are dark — this isn't a light/dark toggle, it's three
// different dark palettes, each with its own accent colors and mood.
export type ThemeName = "sunburst" | "chorus" | "cassette";

export const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
    { value: "sunburst", label: "Sunburst" },
    { value: "chorus", label: "Chorus Pedal" },
    { value: "cassette", label: "Cassette" },
];

interface ThemeContextValue {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

// createContext needs a default value up front, but nothing should ever
// actually read this default — the Provider below always supplies a real
// one. It's just there to satisfy TypeScript.
const ThemeContext = createContext<ThemeContextValue>({
    theme: "sunburst",
    setTheme: () => { },
});

const STORAGE_KEY = "riffforge-theme";

function readInitialTheme(): ThemeName {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "sunburst" || stored === "chorus" || stored === "cassette") {
        return stored;
    }
    return "sunburst";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeName>(readInitialTheme);

    // Runs whenever `theme` changes. Setting a data-attribute on <html> is
    // what lets our CSS pick the right variable set — see the
    // [data-theme="..."] blocks in app.css. We also persist the choice so
    // it's remembered next time the app loads.
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

// A small custom hook so components just call useTheme() instead of
// importing useContext + ThemeContext everywhere individually.
export function useTheme() {
    return useContext(ThemeContext);
}