import { ref, watch } from 'vue';
import type { ThemeName } from '../../shared/types.mts';

const THEME_NAMES = ['light', 'dark'] as const;

function isThemeName(value: string | null): value is ThemeName {
  return value !== null && THEME_NAMES.includes(value as ThemeName);
}

function getLocalTheme(): ThemeName {
  const savedTheme = localStorage.getItem('theme');
  if (isThemeName(savedTheme)) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const currentTheme = ref<ThemeName>(getLocalTheme());
let loadPromise: Promise<void> | null = null;

function applyTheme(themeName: ThemeName) {
  document.documentElement.setAttribute('data-theme', themeName);
}

async function getConfiguredTheme(): Promise<ThemeName | null> {
  if (window.electronAPI) {
    try {
      const config = await window.electronAPI.getAppConfig();
      if (isThemeName(config.theme)) return config.theme;
    } catch (error) {
      console.warn('无法获取应用配置:', error);
    }
  }

  const theme = new URLSearchParams(window.location.search).get('theme');
  return isThemeName(theme) ? theme : null;
}

function loadThemePreference(): Promise<void> {
  loadPromise ??= getConfiguredTheme().then((theme) => {
    if (theme) {
      currentTheme.value = theme;
    }
  });
  return loadPromise;
}

watch(currentTheme, (theme) => {
  applyTheme(theme);
  localStorage.setItem('theme', theme);
}, { immediate: true });

export function useTheme() {
  return {
    toggleTheme() {
      currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    },
    isDarkMode: () => currentTheme.value === 'dark',
    loadThemePreference
  };
}
