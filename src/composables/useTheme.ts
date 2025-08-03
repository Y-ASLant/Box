import { ref, watch, onMounted } from 'vue';
import { themes, type ThemeName } from './themes';

// 全局主题状态
const currentTheme = ref<ThemeName>('light');

export function useTheme() {
  // 应用主题到 DOM
  const applyTheme = (themeName: ThemeName) => {
    const theme = themes[themeName];
    if (!theme) return;

    // 设置 data-theme 属性
    document.documentElement.setAttribute('data-theme', themeName);
    
    // 应用 CSS 变量
    Object.entries(theme.cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  // 从 localStorage 加载主题偏好
  const loadThemePreference = () => {
    const saved = localStorage.getItem('theme');
    if (saved && saved in themes) {
      currentTheme.value = saved as ThemeName;
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme.value = prefersDark ? 'dark' : 'light';
    }
  };

  // 保存主题偏好到 localStorage
  const saveThemePreference = (themeName: ThemeName) => {
    localStorage.setItem('theme', themeName);
  };

  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  };

  // 设置特定主题
  const setTheme = (themeName: ThemeName) => {
    if (themeName in themes) {
      currentTheme.value = themeName;
    }
  };

  // 获取当前主题信息
  const getCurrentTheme = () => themes[currentTheme.value];

  // 检查是否为深色主题
  const isDarkMode = () => currentTheme.value === 'dark';

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme);
    saveThemePreference(newTheme);
  }, { immediate: true });

  // 初始化
  onMounted(() => {
    loadThemePreference();
  });

  return {
    currentTheme: readonly(currentTheme),
    toggleTheme,
    setTheme,
    getCurrentTheme,
    isDarkMode,
    loadThemePreference
  };
}

// 导出只读的当前主题状态，供其他组件使用
export const readonly = <T>(ref: { value: T }) => ({
  get value() { return ref.value; }
});
