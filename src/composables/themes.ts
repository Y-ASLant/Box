// 主题配置文件
export interface ThemeConfig {
  name: string;
  displayName: string;
  cssVars: Record<string, string>;
}

export const themes: Record<string, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: '浅色模式',
    cssVars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f5f5',
      '--bg-tertiary': '#f9f9f9',
      '--text-primary': '#333333',
      '--text-secondary': '#555555',
      '--text-tertiary': '#999999',
      '--border-color': '#ddd',
      '--border-light': '#eee',
      '--button-primary': '#4a90e2',
      '--button-primary-hover': '#3a80d2',
      '--button-disabled': '#cccccc',
      '--error-color': '#e74c3c',
      '--success-color': '#27ae60',
      '--shadow-light': 'rgba(0, 0, 0, 0.08)',
      '--shadow-medium': 'rgba(0, 0, 0, 0.25)',
      '--backdrop-blur': 'rgba(255, 255, 255, 0.95)',
      '--scrollbar-thumb': '#c1c1c1',
      '--scrollbar-track': 'transparent'
    }
  },
  dark: {
    name: 'dark',
    displayName: '深色模式',
    cssVars: {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--bg-tertiary': '#3a3a3a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#cccccc',
      '--text-tertiary': '#999999',
      '--border-color': '#444444',
      '--border-light': '#333333',
      '--button-primary': '#5a9ef2',
      '--button-primary-hover': '#4a8ee2',
      '--button-disabled': '#555555',
      '--error-color': '#ff6b6b',
      '--success-color': '#51cf66',
      '--shadow-light': 'rgba(0, 0, 0, 0.3)',
      '--shadow-medium': 'rgba(0, 0, 0, 0.5)',
      '--backdrop-blur': 'rgba(26, 26, 26, 0.95)',
      '--scrollbar-thumb': '#555555',
      '--scrollbar-track': 'transparent'
    }
  }
};

export type ThemeName = keyof typeof themes;
