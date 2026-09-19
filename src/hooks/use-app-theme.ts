import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { ThemeName } from '../../shared/types.mts';

const THEME_NAMES = ['light', 'dark'] as const;

function isThemeName(value: string | null | undefined): value is ThemeName {
  return value != null && THEME_NAMES.includes(value as ThemeName);
}

interface AppThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function getInitialTheme(): ThemeName {
  const savedTheme = localStorage.getItem('theme');
  const theme = isThemeName(savedTheme)
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    let active = true;

    async function loadConfiguredTheme() {
      let configuredTheme: string | null | undefined;
      if (window.electronAPI) {
        try {
          configuredTheme = (await window.electronAPI.getAppConfig()).theme;
        } catch (error) {
          console.warn('无法获取应用配置:', error);
        }
      }

      configuredTheme ??= new URLSearchParams(window.location.search).get('theme');
      if (active && isThemeName(configuredTheme)) setTheme(configuredTheme);
    }

    void loadConfiguredTheme();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  return createElement(
    AppThemeContext.Provider,
    { value: { isDarkMode: theme === 'dark', toggleTheme } },
    children
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme 必须在 AppThemeProvider 内使用');
  return context;
}
