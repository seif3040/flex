'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() { const { theme, setTheme } = useTheme(); const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'; const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor; return <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`}><Icon className="size-4" /></Button>; }
