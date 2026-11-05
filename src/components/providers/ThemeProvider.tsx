'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system' | 'lavender' | 'forest' | 'midnight';
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolved(theme: Theme): Theme { return theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'light') : theme; }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem('ai-workspace-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'lavender' || stored === 'forest' || stored === 'midnight') setThemeState(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { const apply = () => { const value = resolved(theme); for (const name of ['light', 'dark', 'lavender', 'forest', 'midnight']) document.documentElement.classList.toggle(name, value === name); }; apply(); if (theme !== 'system') return; const media = window.matchMedia('(prefers-color-scheme: dark)'); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply); }, [theme]);
  const value = useMemo(() => ({ theme, setTheme: (next: Theme) => { window.localStorage.setItem('ai-workspace-theme', next); setThemeState(next); } }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used within ThemeProvider'); return context; }
