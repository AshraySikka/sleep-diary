// context/ThemeContext.jsx
// -----------------------------------------------------------------------
// Global light / dark theme state.
// - Dark is the default (the app's original look).
// - The choice is saved in localStorage so it survives refreshes and logins.
// - The theme is applied as data-theme="light|dark" on <html>; every colour
//   in the UI is a CSS variable defined in index.css, so one attribute
//   switches the whole app.
// -----------------------------------------------------------------------

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEME_STORAGE_KEY = 'sleep-diary-theme';

const ThemeContext = createContext(null);

function readSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage blocked (private mode etc.) — fall back to the default
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readSavedTheme);

  // Apply the theme to <html> and persist it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore — theme still works for this session
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    // Briefly enable a smooth cross-fade for the switch (see index.css)
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 350);
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
