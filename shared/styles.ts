// 共享样式定义文件
// 统一管理项目中重复使用的 CSS 样式

/**
 * 自定义滚动条样式
 * 在多个组件中重复使用的滚动条美化样式
 */
export const customScrollbarCSS = `
/* Webkit 浏览器滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* Firefox 浏览器滚动条样式 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

/* 滚动容器悬停效果 */
.scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
}

.scroll-container:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
}
`;

/**
 * 禁用文本选择的样式
 * 用于防止用户选择文本的通用样式
 */
export const disableTextSelectionCSS = `
.disable-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
}

/* 允许在输入框内选择文本 */
.disable-select input, 
.disable-select textarea,
.disable-select [contenteditable="true"] {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
  cursor: text !important;
}

/* 禁用文本高亮 */
.disable-select ::selection {
  background: transparent;
}

.disable-select ::-moz-selection {
  background: transparent;
}
`;

/**
 * 拖动区域样式
 * 用于窗口拖动的通用样式
 */
export const dragRegionCSS = `
.drag-region {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  -webkit-app-region: drag;
  z-index: 999999;
  opacity: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: height 0.3s ease, opacity 0.3s ease;
  pointer-events: auto;
}
`;

/**
 * 新窗口专用样式
 * 包含更严格的文本选择禁用和拖动区域
 */
export const newWindowCSS = `
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
}

/* 禁用所有元素的文本选择 */
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 允许在输入框内选择文本 */
input, textarea, [contenteditable="true"] {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
  cursor: text !important;
}

${dragRegionCSS}

/* 禁用文本高亮 */
::selection {
  background: transparent;
}
::-moz-selection {
  background: transparent;
}
`;

/**
 * 控制面板样式工具类
 */
export const controlPanelCSS = `
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
}
`;

/**
 * 组合所有基础样式
 * 用于主窗口的基础样式注入
 */
export const baseWindowCSS = `
${disableTextSelectionCSS}
${dragRegionCSS}
${customScrollbarCSS}
`;
