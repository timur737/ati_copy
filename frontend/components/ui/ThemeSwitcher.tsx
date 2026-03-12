'use client';

import { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useUIStore();

  // Apply/remove .dark class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="btn-ghost p-2 rounded-lg"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-brand-600" />
      )}
    </button>
  );
}
