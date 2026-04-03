'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded border border-terminal-border hover:bg-terminal-hover transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-terminal-accent" suppressHydrationWarning />
      ) : (
        <Moon className="w-4 h-4 text-terminal-accent" suppressHydrationWarning />
      )}
    </button>
  );
}
