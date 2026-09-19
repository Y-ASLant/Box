import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { PropsWithChildren } from 'react';
import type { AppSettings, ThemeName, ThemePreference } from '../../shared/types.mts';

const SETTINGS_STORAGE_KEY = 'appSettings';
const LEGACY_THEME_STORAGE_KEY = 'theme';
const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  alwaysOnTop: false,
  singlePage: false,
  rememberRecentUrls: true
};

interface StoredSettingsResult {
  settings: AppSettings;
  found: boolean;
}

interface AppSettingsContextValue {
  settings: AppSettings;
  resolvedTheme: ThemeName;
  isDarkMode: boolean;
  updateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
  toggleTheme: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_PREFERENCES.includes(value as ThemePreference);
}

function readStoredSettings(): StoredSettingsResult {
  const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (rawSettings) {
    try {
      const value = JSON.parse(rawSettings) as Record<string, unknown>;
      return {
        found: true,
        settings: {
          theme: isThemePreference(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
          alwaysOnTop: typeof value.alwaysOnTop === 'boolean' ? value.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop,
          singlePage: typeof value.singlePage === 'boolean' ? value.singlePage : DEFAULT_SETTINGS.singlePage,
          rememberRecentUrls: typeof value.rememberRecentUrls === 'boolean'
            ? value.rememberRecentUrls
            : DEFAULT_SETTINGS.rememberRecentUrls
        }
      };
    } catch {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }

  const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return {
    found: false,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: isThemePreference(legacyTheme) ? legacyTheme : DEFAULT_SETTINGS.theme
    }
  };
}

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const initialSettings = useMemo(readStoredSettings, []);
  const [settings, setSettings] = useState(initialSettings.settings);
  const [initialized, setInitialized] = useState(initialSettings.found || !window.electronAPI);
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  ));
  const resolvedTheme = settings.theme === 'system' ? systemTheme : settings.theme;

  useEffect(() => {
    if (initialSettings.found || !window.electronAPI) return;

    let active = true;
    void window.electronAPI.getAppConfig().then(config => {
      if (!active) return;
      setSettings(current => ({
        ...current,
        theme: config.theme ?? 'system',
        alwaysOnTop: config.alwaysOnTop,
        singlePage: config.singlePage
      }));
      setInitialized(true);
    }).catch(error => {
      console.warn('无法读取应用默认设置:', error);
      if (active) setInitialized(true);
    });

    return () => {
      active = false;
    };
  }, [initialSettings.found]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    void window.electronAPI?.applyRuntimeSettings({
      alwaysOnTop: settings.alwaysOnTop,
      singlePage: settings.singlePage
    });
  }, [initialized, settings]);

  const updateSetting = useCallback(<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setSettings(current => ({ ...current, [key]: value }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings(current => ({
      ...current,
      theme: (current.theme === 'system' ? systemTheme : current.theme) === 'dark' ? 'light' : 'dark'
    }));
  }, [systemTheme]);

  return createElement(
    AppSettingsContext.Provider,
    { value: { settings, resolvedTheme, isDarkMode: resolvedTheme === 'dark', updateSetting, toggleTheme } },
    children
  );
}

export function useAppSettings(): AppSettingsContextValue {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings 必须在 AppSettingsProvider 内使用');
  return context;
}
