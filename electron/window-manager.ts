import { BrowserWindow, app, Menu } from 'electron';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { injectBaseStyles, injectNewWindowStyles, injectNewWindowBehaviors } from './controls-injector';
import type { HiddenControl, WindowOptions } from '../shared/types.mts';
import { isHttpUrl, normalizeHttpUrl } from '../shared/url.mts';

// 保持窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow: BrowserWindow | null = null;
const managedWindows = new Set<BrowserWindow>();
const windowsAllowedToClose = new WeakSet<BrowserWindow>();

// 获取主窗口
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * 通用窗口事件处理器
 * 抽象重复的窗口事件处理逻辑
 */
function setupCommonWindowEvents(window: BrowserWindow, isMainWindow = false, hiddenControls: readonly HiddenControl[] = []) {
  managedWindows.add(window);

  window.on('close', (event) => {
    if (!isMainWindow || windowsAllowedToClose.has(window)) return;
    event.preventDefault();
    window.minimize();
  });

  window.on('closed', () => {
    managedWindows.delete(window);
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  window.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const isDevToolsShortcut = key === 'f12'
      || ((input.control || input.meta) && input.shift && (key === 'i' || key === 'j'));
    if ((input.alt && key === 'f4') || isDevToolsShortcut) {
      event.preventDefault();
    }
  });

  window.webContents.on('dom-ready', () => {
    if (isMainWindow) {
      injectBaseStyles(window, hiddenControls);
    } else {
      injectNewWindowStyles(window, hiddenControls);
      injectNewWindowBehaviors(window);
    }
  });

  window.webContents.on('did-fail-load', (
    _event,
    errorCode,
    errorDescription,
    validatedURL,
    isMainFrame
  ) => {
    if (errorCode === -3 || !isMainFrame || validatedURL.startsWith(getRendererUrl())) return;

    console.error(`加载URL失败: ${validatedURL}, 错误: ${errorDescription} (${errorCode})`);
    const errorMessage = encodeURIComponent(`无法加载页面: ${errorDescription} (${errorCode})`);
    const isSubWindowParam = isMainWindow ? '' : '&isSubWindow=true';

    if (!window.isDestroyed()) {
      window.loadURL(getRendererUrl(`#/error?message=${errorMessage}${isSubWindowParam}`))
        .catch(error => console.error('加载错误页面失败:', error));
    }
  });

  window.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
}

/**
 * 通用窗口配置
 * 抽象重复的窗口配置选项
 */
function getCommonWindowConfig(isMainWindow = false, webSecurity = true) {
  const iconPath = path.join(
    process.env.NODE_ENV === 'development' ? __dirname : app.getAppPath(),
    process.env.NODE_ENV === 'development' ? '../assets/index.ico' : './assets/index.ico'
  );

  const baseConfig = {
    title: 'Box',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      webSecurity
    },
    autoHideMenuBar: true,
    frame: false,
    transparent: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden' as const,
    titleBarOverlay: false,
  };

  if (isMainWindow) {
    return {
      ...baseConfig,
      width: 1680,
      height: 864,
      fullscreenable: true,
      resizable: true,
    };
  } else {
    return {
      ...baseConfig,
      width: 1280,
      height: 720,
    };
  }
}

export function getRendererUrl(hash = ''): string {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173/'
    : pathToFileURL(path.join(__dirname, '../dist/index.html')).toString();
  return `${baseUrl}${hash}`;
}

// 加载本地启动页面
export function loadLaunchPage() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.loadURL(getRendererUrl())
    .catch(error => console.error('加载启动页面失败:', error));
}

// 创建主窗口
export function createWindow(options: WindowOptions = {}, hiddenControls: readonly HiddenControl[] = []) {
  const { startUrl, fullscreen, alwaysOnTop, webSecurity = true, singlePage = false } = options;
  const window = new BrowserWindow({
    ...getCommonWindowConfig(true, webSecurity),
    fullscreen,
    alwaysOnTop,
    kiosk: false,
  });

  mainWindow = window;
  setupCommonWindowEvents(window, true, hiddenControls);
  setupNewWindowHandler(window, hiddenControls, webSecurity, singlePage);

  loadMainWindowContent(startUrl);
  Menu.setApplicationMenu(null);
}

// 设置新窗口处理
function setupNewWindowHandler(
  parentWindow: BrowserWindow,
  hiddenControls: readonly HiddenControl[],
  webSecurity: boolean,
  singlePage: boolean
) {
  parentWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isHttpUrl(url)) {
      console.warn(`已阻止非 HTTP(S) 子窗口: ${url}`);
      return { action: 'deny' };
    }

    if (singlePage) {
      parentWindow.loadURL(url).catch(error => console.error('单页导航失败:', error));
      return { action: 'deny' };
    }

    const newWindow = new BrowserWindow(getCommonWindowConfig(false, webSecurity));
    setupCommonWindowEvents(newWindow, false, hiddenControls);
    setupNewWindowHandler(newWindow, hiddenControls, webSecurity, singlePage);
    newWindow.loadURL(url).catch(error => console.error('加载新窗口失败:', error));
    return { action: 'deny' };
  });
}

// 加载主窗口内容
function loadMainWindowContent(startUrl?: string | null) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const url = startUrl ? normalizeHttpUrl(startUrl) : getRendererUrl();
  mainWindow.loadURL(url).catch(error => console.error('加载页面失败:', error));
  if (!startUrl && process.env.NODE_ENV === 'development') {
    mainWindow.webContents.closeDevTools();
  }
}

export function closeManagedWindow(window: BrowserWindow): boolean {
  if (window.isDestroyed()) return false;
  windowsAllowedToClose.add(window);
  window.close();
  return true;
}

// 清理窗口资源
export function cleanupWindows() {
  for (const window of [...managedWindows]) {
    if (!window.isDestroyed()) {
      window.destroy();
    }
  }
  managedWindows.clear();
  mainWindow = null;
}
