import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from './ui/utils';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'one-ops-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-slate-200 bg-white/70 px-1 py-1 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-800/70',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'inline-flex h-9 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500',
          theme === 'light' && 'bg-sky-100 text-sky-700 dark:bg-slate-700 dark:text-sky-200'
        )}
        aria-label="Switch to light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'inline-flex h-9 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500',
          theme === 'dark' && 'bg-slate-800 text-sky-100 border border-slate-600'
        )}
        aria-label="Switch to dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
};
