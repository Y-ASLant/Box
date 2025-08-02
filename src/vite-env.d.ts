/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 定义配置接口
interface AppConfig {
  link?: string;
  mode?: string;
  window?: string;
  page?: string;
  hide?: string;
  bg?: string;
}

// 声明Electron API类型
interface ElectronAPI {
  navigateToUrl: (url: string) => Promise<boolean>;
  returnToLogin: () => Promise<boolean>;
  // 添加窗口控制函数类型
  minimizeWindow: () => Promise<boolean>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<boolean>;
  // 添加全屏切换函数类型
  toggleFullscreen: () => Promise<boolean>;
  // 添加拖动函数类型
  startDrag: () => void;
  // 添加获取应用配置函数类型
  getAppConfig: () => Promise<AppConfig>;
  // 添加获取背景图片路径函数类型
  getBackgroundPath: () => Promise<string | undefined>;
  // 添加清除历史和缓存函数类型
  clearHistoryAndCache: () => Promise<boolean>;
}

interface Window {
  electronAPI: ElectronAPI;
}
