<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { AppConfig } from '../shared/types';

// 创建响应式配置对象
const appConfig = ref<AppConfig>({});

// 夜间模式状态
const isDarkMode = ref(false);

// 从 localStorage 读取夜间模式设置
const loadDarkModePreference = () => {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    isDarkMode.value = JSON.parse(saved);
  } else {
    // 检测系统主题偏好
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};

// 切换夜间模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};

// 监听夜间模式变化，更新 DOM 和保存设置
watch(isDarkMode, (newValue) => {
  document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
  localStorage.setItem('darkMode', JSON.stringify(newValue));
}, { immediate: true });

// 在组件挂载时获取配置
onMounted(async () => {
  // 加载夜间模式偏好
  loadDarkModePreference();
  
  // 检查是否在Electron环境中
  if (window.electronAPI) {
    try {
      // 从主进程获取配置
      const config = await window.electronAPI.getAppConfig();
      appConfig.value = config;
      console.log('应用配置:', config);
    } catch (error) {
      console.error('获取配置出错:', error);
    }
  }
});

// 阻止双击事件导致窗口最大化
const handleDragRegionDoubleClick = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

// 确保拖动区域只处理拖动事件，其他事件透传
const handleDragRegionMouseDown = (e: MouseEvent) => {
  // 只有左键拖动才触发
  if (e.button !== 0) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  // 如果是双击，阻止事件
  if (e.detail === 2) {
    e.stopPropagation();
    e.preventDefault();
  }
};
</script>

<template>
  <div class="window-frame">
    <!-- 主题切换按钮 -->
    <button 
      class="theme-toggle" 
      @click="toggleDarkMode"
    >
      <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
    
    <!-- 添加一个可拖动区域，但阻止双击最大化，并确保点击事件透传 -->
    <div 
      class="drag-region" 
      @dblclick="handleDragRegionDoubleClick"
      @mousedown="handleDragRegionMouseDown"
    ></div>
    
    <div class="window-content scroll-container">
      <router-view />
    </div>
  </div>
</template>

<style>
/* CSS 变量定义 */
:root {
  /* 浅色模式 */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #f9f9f9;
  --text-primary: #333333;
  --text-secondary: #555555;
  --text-tertiary: #999999;
  --border-color: #ddd;
  --border-light: #eee;
  --button-primary: #4a90e2;
  --button-primary-hover: #3a80d2;
  --button-disabled: #cccccc;
  --error-color: #e74c3c;
  --success-color: #27ae60;
  --shadow-light: rgba(0, 0, 0, 0.08);
  --shadow-medium: rgba(0, 0, 0, 0.25);
  --backdrop-blur: rgba(255, 255, 255, 0.95);
  --scrollbar-thumb: #c1c1c1;
  --scrollbar-track: transparent;
}

/* 深色模式 */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3a3a3a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;
  --border-color: #444444;
  --border-light: #333333;
  --button-primary: #5a9ef2;
  --button-primary-hover: #4a8ee2;
  --button-disabled: #555555;
  --error-color: #ff6b6b;
  --success-color: #51cf66;
  --shadow-light: rgba(0, 0, 0, 0.3);
  --shadow-medium: rgba(0, 0, 0, 0.5);
  --backdrop-blur: rgba(26, 26, 26, 0.95);
  --scrollbar-thumb: #555555;
  --scrollbar-track: transparent;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html {
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.window-content {
  height: 100vh; /* 修改高度为全屏 */
  overflow: auto;
  background-color: var(--bg-secondary);
  /* 添加scroll-container类 */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track); /* Firefox */
  transition: background-color 0.3s ease;
}

/* Webkit 滚动条样式 */
.window-content::-webkit-scrollbar {
  width: 8px;
}

.window-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.window-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.window-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 主题切换按钮 */
.theme-toggle {
  position: fixed;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 2px 8px var(--shadow-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.3s ease;
  -webkit-app-region: no-drag;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.theme-toggle:active {
  transform: scale(0.95);
}

/* 可拖动区域，但确保不会挡住内容点击 */
.drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px; /* 减小高度，使其几乎不可见 */
  -webkit-app-region: drag; /* 允许拖动 */
  z-index: 999;
  opacity: 0; /* 完全透明 */
  pointer-events: auto; /* 只捕获拖动事件，其他点击透传 */
}
</style>
