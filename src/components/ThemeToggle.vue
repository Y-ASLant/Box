<template>
  <button 
    class="theme-toggle" 
    @click="toggleTheme"
    :aria-label="isDarkMode() ? '切换到浅色模式' : '切换到深色模式'"
  >
    <!-- 太阳图标 (深色模式时显示) -->
    <svg 
      v-if="isDarkMode()" 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
    </svg>
    
    <!-- 月亮图标 (浅色模式时显示) -->
    <svg 
      v-else 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

// 使用主题管理 composable
const { toggleTheme, isDarkMode } = useTheme();
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-primary);
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
  opacity: 0.7;
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle:focus {
  outline: none;
}
</style>
