import { useState, useRef, useEffect } from "react";
import { useTheme, THEME_OPTIONS } from "../context/ThemeContext";

// A small dropdown, built by hand with useState (no library) — a good
// example of a pattern you'll reuse constantly: `isOpen` state toggled by
// a button, plus a useEffect that listens for clicks anywhere else on the
// page to close it again.
function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        // Cleanup: React runs this when the component unmounts, or before the
        // effect re-runs. Without it, every re-render would stack up another
        // listener and eventually slow the page down.
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeLabel = THEME_OPTIONS.find((t) => t.value === theme)?.label;

    return (
        <div className="theme-switcher" ref={rootRef}>
            <button className="theme-switcher-button" onClick={() => setIsOpen((open) => !open)} aria-label="Change theme">
                <span className="theme-swatch" data-swatch={theme} />
                {activeLabel}
            </button>
            {isOpen && (
                <div className="theme-switcher-menu">
                    {THEME_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            className={option.value === theme ? "theme-option active" : "theme-option"}
                            onClick={() => {
                                setTheme(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <span className="theme-swatch" data-swatch={option.value} />
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ThemeSwitcher;