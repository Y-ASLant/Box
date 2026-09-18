// 共享类型定义文件
// 统一管理项目中使用的所有 TypeScript 接口和类型

export const HIDDEN_CONTROL_NAMES = [
  'control',
  'theme',
  'scroll',
  'mouse',
  'home',
  'minimize',
  'maximize',
  'close',
  'fullscreen'
] as const;

export type HiddenControl = typeof HIDDEN_CONTROL_NAMES[number];
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
  hiddenControls: HiddenControl[];
  backgroundPath: string | null;
  compatibilityMode: CompatibilityMode;
  configPath: string;
}

/** 允许暴露给本地 Vue 页面的最小配置 */
export interface RendererConfig {
  theme: ThemeName | null;
  hiddenControls: HiddenControl[];
}

/** 错误页面属性 */
export interface ErrorPageProps {
  message?: string;
  isSubWindow?: boolean;
}
