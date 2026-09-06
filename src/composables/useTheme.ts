import { ref, watch } from 'vue';
import { themes, type ThemeName } from './themes';

function getLocalTheme(): ThemeName {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && savedTheme in themes) {
    return savedTheme as ThemeName;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const currentTheme = ref<ThemeName>(getLocalTheme());
let loadPromise: Promise<void> | null = null;

function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName];
  document.documentElement.setAttribute('data-theme', themeName);
  for (const [property, value] of Object.entries(theme.cssVars)) {
    document.documentElement.style.setProperty(property, value);
  }
}

async function getConfiguredTheme(): Promise<ThemeName | null> {
  if (window.electronAPI) {
    try {
      const config = await window.electronAPI.getAppConfig();
      if (config.theme && config.theme in themes) {
        return config.theme as ThemeName;
      }
    } catch (error) {
      console.warn('无法获取应用配置:', error);
    }
  }

  const theme = new URLSearchParams(window.location.search).get('theme');
  return theme && theme in themes ? theme as ThemeName : null;
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
