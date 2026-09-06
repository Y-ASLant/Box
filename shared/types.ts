// 共享类型定义文件
// 统一管理项目中使用的所有 TypeScript 接口和类型

/**
 * 应用配置接口
 * 用于配置文件和命令行参数的类型定义
 */
export interface AppConfig {
  /** 启动链接地址 */
  link?: string;
  /** 窗口模式：fullscreen | normal */
  mode?: string;
  /** 窗口置顶设置：top | normal */
  window?: string;
  /** 页面模式：single | multi */
  page?: string;
  /** 隐藏的按钮列表，逗号分隔 */
  hide?: string;
  /** 背景图片路径 */
  bg?: string;
  /** 主题设置：light | dark */
  theme?: string;
  /** 自定义配置（前端扩展字段） */
  customConfig?: string;
  /** 其他动态配置字段 */
  [key: string]: any;
}

/**
 * 窗口配置选项接口
 * 用于创建窗口时的配置参数
 */
export interface WindowOptions {
  /** 启动URL */
  startUrl?: string | null;
  /** 是否全屏 */
  fullscreen?: boolean;
  /** 是否置顶 */
  alwaysOnTop?: boolean;
}

/**
 * 解析后的配置接口
 * 命令行参数和配置文件合并后的最终配置
 */
export interface ParsedConfig {
  /** 启动链接地址 */
  link: string | null;
  /** 窗口模式 */
  mode: string | null;
  /** 主题设置 */
  theme: string | null;
  /** 隐藏的按钮列表（逗号分隔字符串） */
  hide: string | null;
  /** 是否全屏模式 */
  isFullscreen: boolean;
  /** 是否窗口置顶 */
  isPinned: boolean;
  /** 是否单页模式 */
  isSinglePageMode: boolean;
  /** 隐藏的按钮列表（解析后的数组） */
  hiddenButtons: string[];
  /** 背景图片路径 */
  bgPath: string | null;
}

/**
 * 控制按钮配置接口
 * 用于定义控制面板中的按钮
 */
export interface ButtonConfig {
  /** 按钮名称标识 */
  name: string;
  /** 按钮颜色 */
  color: string;
  /** 按钮图标SVG */
  icon: string;
  /** 按钮操作动作 */
  action: string;
  /** 是否全宽显示 */
  fullWidth?: boolean;
}

/**
 * IPC 消息类型
 * 用于主进程和渲染进程之间的通信
 */
export type IPCAction = 
  | 'return-to-login'
  | 'minimize'
  | 'maximize' 
  | 'close'
  | 'toggle-fullscreen'
  | 'navigate-to-url'
  | 'clear-history-cache';

/**
 * 窗口消息事件接口
 * 用于窗口间的消息传递
 */
export interface WindowMessage {
  /** 消息类型 */
  type: 'electron-control' | 'electron-ipc-control' | 'show-control-panel' | 'toggle-control-panel';
  /** 操作动作 */
  action?: IPCAction;
  /** 附加数据 */
  data?: any;
}

/**
 * 错误页面属性接口
 */
export interface ErrorPageProps {
  /** 错误消息 */
  message?: string;
  /** 是否为子窗口 */
  isSubWindow?: boolean;
}
