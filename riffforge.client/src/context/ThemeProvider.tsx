// context/ThemeProvider.tsx — exports ONLY the component, so Fast Refresh
// can hot-swap it on its own.
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeContext, STORAGE_KEY, readInitialTheme } from "./ThemeContext";
import type { ThemeName } from "./ThemeContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeName>(readInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}