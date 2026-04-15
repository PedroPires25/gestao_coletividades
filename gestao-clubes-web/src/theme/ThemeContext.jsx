import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const ThemeContext = createContext(null);

const THEMES = ["theme-normal", "theme-light", "theme-dark"];
const STORAGE_KEY = "gc_theme";

function getInitialTheme() {
    try {
        const userRaw = localStorage.getItem("gc_user");
        if (userRaw) {
            const parsed = JSON.parse(userRaw);
            const temaPreferido = parsed?.user?.temaPreferido;
            if (temaPreferido && THEMES.includes(temaPreferido)) {
                return temaPreferido;
            }
        }
        return "theme-normal";
    } catch {
        return "theme-normal";
    }
}

function applyThemeToBody(theme) {
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        applyThemeToBody(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // ignore
        }
    }, [theme]);

    const resetTheme = useCallback(() => {
        setTheme("theme-normal");
    }, []);

    const applyUserTheme = useCallback((temaPreferido) => {
        if (temaPreferido && THEMES.includes(temaPreferido)) {
            setTheme(temaPreferido);
        } else {
            setTheme("theme-normal");
        }
    }, []);

    const value = useMemo(() => ({ theme, setTheme, resetTheme, applyUserTheme }), [theme, resetTheme, applyUserTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }
    return context;
}