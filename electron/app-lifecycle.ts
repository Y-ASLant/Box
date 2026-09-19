import { app, session } from 'electron';
import { resolveAppConfig } from './app-config.mts';
import { createWindow, cleanupWindows, getMainWindow } from './window-manager';
import { registerIPCHandlers } from './ipc-handlers';
import type { ResolvedConfig } from '../shared/types.mts';

const RELAXED_CSP = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: *";

// 应用初始化
export function initializeApp() {
  const config = resolveAppConfig(process.argv, app.isPackaged);
  if (config.compatibilityMode === 'permissive') {
    app.commandLine.appendSwitch('ignore-certificate-errors');
  }
  
  // 当Electron完成初始化并准备创建浏览器窗口时调用此方法
  app.whenReady().then(() => {
    setupSession(config);
    startApplication(config);
  }).catch(error => console.error('应用初始化失败:', error));

  // 设置应用事件监听
  setupAppEvents(config);
}

// 设置会话配置
function setupSession(config: ResolvedConfig) {
  if (config.compatibilityMode !== 'permissive') return;

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.fromEntries(
      Object.entries(details.responseHeaders ?? {})
        .filter(([name]) => name.toLowerCase() !== 'content-security-policy')
    );
    callback({
      responseHeaders: {
        ...responseHeaders,
        'Content-Security-Policy': [RELAXED_CSP]
      }
    });
  });
}

// 启动应用程序
function startApplication(config: ResolvedConfig) {
  registerIPCHandlers(config);
  
  // 创建主窗口
  createWindow({
    startUrl: config.url,
    fullscreen: config.fullscreen,
    alwaysOnTop: config.alwaysOnTop,
    webSecurity: config.compatibilityMode === 'standard'
  });
}

// 设置应用事件监听
function setupAppEvents(config: ResolvedConfig) {
  // 所有窗口关闭时退出应用
  app.on('window-all-closed', () => {
    // 清理窗口资源
    cleanupWindows();

    // 在MacOS上，应用和菜单栏通常会保持活动状态，直到用户明确退出
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // macOS 激活事件
  app.on('activate', () => {
    const mainWindow = getMainWindow();
    if (mainWindow === null) {
      // 重新启动应用
      startApplication(config);
    }
  });

}
