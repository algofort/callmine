'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/** Light/dark switch. Reuses the app-wide theme (toggles `dark` on <html>, persists). */
export default function ThemeToggle({ className = '' }) {
    const { theme, setTheme } = useTheme();
    const dark = theme === 'dark';
    return (
        <button
            type="button"
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:text-neutral-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:text-white ${className}`}
        >
            <Sun className={`absolute h-4.5 w-4.5 transition-all duration-300 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
            <Moon className={`absolute h-4.5 w-4.5 transition-all duration-300 ${dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
        </button>
    );
}
