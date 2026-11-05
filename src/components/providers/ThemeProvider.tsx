'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolved(theme: Theme): 'light' | 'dark' { return theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme; }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem('ai-workspace-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') setThemeState(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { const apply = () => { const value = resolved(theme); document.documentElement.classList.toggle('dark', value === 'dark'); document.documentElement.classList.toggle('light', value === 'light'); }; apply(); if (theme !== 'system') return; const media = window.matchMedia('(prefers-color-scheme: dark)'); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply); }, [theme]);
  const value = useMemo(() => ({ theme, setTheme: (next: Theme) => { window.localStorage.setItem('ai-workspace-theme', next); setThemeState(next); } }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used within ThemeProvider'); return context; }
