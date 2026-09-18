<script setup lang="ts">
import ThemeToggle from './components/ThemeToggle.vue';
import { useTheme } from './composables/useTheme';

const { loadThemePreference } = useTheme();
void loadThemePreference();

const handleDragRegionDoubleClick = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const handleDragRegionMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  if (e.detail === 2) {
    e.stopPropagation();
    e.preventDefault();
  }
};
</script>

<template>
  <div class="window-frame">
    <ThemeToggle />

    <div 
      class="drag-region" 
      @dblclick="handleDragRegionDoubleClick"
      @mousedown="handleDragRegionMouseDown"
    ></div>
    
    <div class="window-content">
      <router-view />
    </div>
  </div>
</template>

<style>
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
  height: 100vh;
  overflow: auto;
  background-color: var(--bg-secondary);
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  transition: background-color 0.3s ease;
}

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
.drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  -webkit-app-region: drag;
  z-index: 999;
  opacity: 0;
  pointer-events: auto;
}
</style>
