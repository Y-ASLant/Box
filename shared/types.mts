// 共享类型定义文件
// 统一管理项目中使用的所有 TypeScript 接口和类型

export type ThemeName = 'light' | 'dark';
export type CompatibilityMode = 'standard' | 'permissive';

/** 窗口创建参数 */
export interface WindowOptions {
  startUrl?: string | null;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  webSecurity?: boolean;
  singlePage?: boolean;
}

/** 配置文件和命令行合并后的唯一运行时配置 */
export interface ResolvedConfig {
  url: string | null;
  fullscreen: boolean;
  alwaysOnTop: boolean;
  singlePage: boolean;
  theme: ThemeName | null;
  backgroundPath: string | null;
  compatibilityMode: CompatibilityMode;
  configPath: string;
}

/** 允许暴露给本地 React 页面的最小配置 */
export interface RendererConfig {
  theme: ThemeName | null;
}

/** 顶部浏览器外壳展示的标签页状态 */
export interface BrowserTabState {
  id: string;
  title: string;
  url: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

/** 主进程向浏览器外壳同步的完整状态 */
export interface BrowserState {
  tabs: BrowserTabState[];
  activeTabId: string | null;
}

/** 自定义标题栏需要同步的窗口状态 */
export interface WindowState {
  maximized: boolean;
  fullscreen: boolean;
}
