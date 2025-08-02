<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AppConfig } from '../shared/types';

// 创建响应式配置对象
const appConfig = ref<AppConfig>({});

// 在组件挂载时获取配置
onMounted(async () => {
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body, html {
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
}

.window-content {
  height: 100vh; /* 修改高度为全屏 */
  overflow: auto;
  /* 添加scroll-container类 */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--scrollbar-thumb-color) transparent; /* Firefox */
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
