import { app, globalShortcut, session, protocol } from 'electron';
import { loadConfigFile, parseAndMergeConfig } from './config';
import { createWindow, cleanupWindows, getMainWindow } from './window-manager';
import { registerIPCHandlers, setSinglePageMode, updateDomReadyHandler, setParsedConfig } from './ipc-handlers';

// 应用初始化
export function initializeApp() {
  // 忽略证书错误
  app.commandLine.appendSwitch('ignore-certificate-errors');
  
  // 当Electron完成初始化并准备创建浏览器窗口时调用此方法
  app.whenReady().then(() => {
    setupProtocols();
    setupSession();
    startApplication();
  });

  // 设置应用事件监听
  setupAppEvents();
}

// 设置自定义协议
function setupProtocols() {
  // 注册自定义协议处理本地文件
  protocol.registerFileProtocol('local-file', (request, callback) => {
    const filePath = request.url.replace('local-file://', '');
    try {
      return callback(decodeURI(filePath));
    } catch (error) {
      console.error('协议处理错误:', error);
      return callback("");
    }
  });
}

// 设置会话配置
function setupSession() {
  // 设置全局会话默认CSS
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: local-file: file: *"]
      }
    });
  });
}

// 启动应用程序
function startApplication() {
  // 首先加载配置文件
  const appConfig = loadConfigFile();

  // 解析命令行参数并合并配置
  const config = parseAndMergeConfig(process.argv, app.isPackaged);
  
  // 设置单页模式
  setSinglePageMode(config.isSinglePageMode);
  
  // 设置解析后的配置（包含主题信息）
  setParsedConfig(config);
  
  // 注册IPC处理程序
  registerIPCHandlers();
  
  // 更新DOM ready处理程序以传递隐藏按钮
  updateDomReadyHandler(config.hiddenButtons);
  
  // 创建主窗口
  createWindow({
    startUrl: config.startUrl,
    fullscreen: config.isFullscreen,
    alwaysOnTop: config.isPinned
  }, config.hiddenButtons);
}

// 设置应用事件监听
function setupAppEvents() {
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
      startApplication();
    }
  });

  // 应用程序将要退出时，注销快捷键
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
