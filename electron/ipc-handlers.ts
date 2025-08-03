import { ipcMain, BrowserWindow, app, shell } from 'electron';
import { getMainWindow, toggleControlsWindow, loadLoginPage } from './window-manager';
import { getAppConfig, getBackgroundPath } from './config';
import { injectControlsScript } from './controls-injector';
import type { ParsedConfig } from '../shared/types';

// 全局变量
let isSinglePageMode = false;
let parsedConfig: ParsedConfig | null = null;

// 设置单页模式
export function setSinglePageMode(mode: boolean) {
  isSinglePageMode = mode;
}

// 设置解析后的配置
export function setParsedConfig(config: ParsedConfig) {
  parsedConfig = config;
}

// 注册所有IPC处理程序
export function registerIPCHandlers() {
  // 处理窗口拖动
  ipcMain.on('start-drag', () => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      // 可以通过这个事件通知渲染进程窗口正在被拖动
      mainWindow.webContents.send('window-dragging');
    }
  });

  // 处理显示控制窗口的请求
  ipcMain.on('show-controls', () => {
    toggleControlsWindow();
  });

  // 处理导航到远程URL的请求
  ipcMain.handle('navigate-to-url', (event, remoteUrl: string) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return false;
    
    // 确保URL格式正确
    if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
      remoteUrl = 'http://' + remoteUrl;
    }
    
    // 直接在当前窗口加载URL，错误将由 'did-fail-load' 事件处理
    mainWindow.loadURL(remoteUrl);
    
    return true;
  });

  // 处理返回登录页面的请求
  ipcMain.handle('return-to-login', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    const mainWindow = getMainWindow();
    
    // 如果是主窗口
    if (targetWindow === mainWindow) {
      if (isSinglePageMode) {
        // 在单页模式下，打开主目录
        shell.openPath(app.getPath('home'));
      } else {
        // 否则，导航回登录页面
        loadLoginPage();
      }
      return true;
    } 
    // 如果是其他窗口，则关闭该窗口
    else if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.close();
      return true;
    }
    
    return false;
  });

  // 处理最小化窗口请求
  ipcMain.handle('minimize-window', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
      // 最小化窗口
      targetWindow.minimize();
      return true;
    }
    return false;
  });

  // 处理窗口最大化/恢复请求
  ipcMain.handle('maximize-window', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
      if (targetWindow.isMaximized()) {
        targetWindow.unmaximize();
      } else {
        targetWindow.maximize();
      }
      return true;
    }
    return false;
  });

  // 处理关闭窗口请求
  ipcMain.handle('close-window', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.close();
      return true;
    }
    return false;
  });

  // 处理全屏切换请求
  ipcMain.handle('toggle-fullscreen', (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow && !targetWindow.isDestroyed()) {
      const isFullScreen = targetWindow.isFullScreen();
      targetWindow.setFullScreen(!isFullScreen);
      return !isFullScreen;
    }
    return false;
  });

  // 获取应用配置
  ipcMain.handle('get-app-config', () => {
    // 返回合并后的配置，包含解析后的主题和隐藏信息
    const baseConfig = getAppConfig();
    return {
      ...baseConfig,
      theme: parsedConfig?.theme || baseConfig.theme,
      hide: parsedConfig?.hide || baseConfig.hide
    };
  });

  // 获取背景图片路径
  ipcMain.handle('get-background-path', () => {
    return getBackgroundPath();
  });

  // 处理清除缓存和记录的请求
  ipcMain.handle('clear-history-cache', async () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const ses = mainWindow.webContents.session;
      await ses.clearCache();
      // 清除所有类型的存储数据
      await ses.clearStorageData({
        storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
      });
      // 清除后重新加载登录页面
      loadLoginPage();
      return true;
    }
    return false;
  });

  // 监听来自preload脚本的dom-ready事件
  ipcMain.handle('dom-ready', async (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow) {
      try {
        // DOM已准备好，安全地注入控制脚本
        // 这里需要传递隐藏按钮列表，但由于模块化，我们需要从外部获取
        // 暂时使用空数组，后续在主文件中会正确传递
        injectControlsScript(targetWindow, []);
      } catch (error) {
        console.error('注入控制脚本错误:', error);
      }
    }
    return true;
  });
}

// 更新DOM ready处理程序以接受隐藏按钮参数
export function updateDomReadyHandler(hiddenButtons: string[]) {
  // 重新注册dom-ready处理程序
  ipcMain.removeHandler('dom-ready');
  
  ipcMain.handle('dom-ready', async (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (targetWindow) {
      try {
        // DOM已准备好，安全地注入控制脚本
        injectControlsScript(targetWindow, hiddenButtons);
      } catch (error) {
        console.error('注入控制脚本错误:', error);
      }
    }
    return true;
  });
}
