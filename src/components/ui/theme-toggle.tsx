'use client';

import { Palette } from 'lucide-react';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';

const themes: Array<{ value: Theme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'lavender', label: 'Lavender' },
  { value: 'forest', label: 'Forest' },
  { value: 'midnight', label: 'Midnight' },
];

export function ThemeToggle() { const { theme, setTheme } = useTheme(); return <label className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 text-xs text-muted-foreground" title="Choose appearance"><Palette className="size-3.5" /><span className="sr-only">Appearance</span><select aria-label="Appearance" className="max-w-24 bg-transparent text-xs text-foreground outline-none" value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>{themes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
