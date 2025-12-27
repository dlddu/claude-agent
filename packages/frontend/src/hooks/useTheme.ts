/**
 * Theme Hook
 * @spec UI-004
 */

'use client';

import { useTheme as useNextTheme } from 'next-themes';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * useTheme hook wrapper
 */
export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  const currentTheme = (resolvedTheme || 'light') as 'light' | 'dark';

  const toggleTheme = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme: theme as Theme | undefined,
    setTheme: (t: Theme) => setTheme(t),
    systemTheme: systemTheme as 'light' | 'dark' | undefined,
    resolvedTheme: currentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
  };
}
