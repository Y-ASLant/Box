import { BrowserWindow, app, globalShortcut, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { injectControlsScript, customScrollbarCSS, injectBaseStyles, injectNewWindowStyles, injectNewWindowBehaviors } from './controls-injector';
import type { WindowOptions } from '../shared/types';

// 保持窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow: BrowserWindow | null = null;
let controlsWindow: BrowserWindow | null = null;

// 窗口配置接口已移至共享类型文件

// 获取主窗口
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// 获取控制窗口
export function getControlsWindow(): BrowserWindow | null {
  return controlsWindow;
}

// 创建悬浮控制窗口
export function createControlsWindow() {
  if (controlsWindow) {
    controlsWindow.show();
    return;
  }
  
  controlsWindow = new BrowserWindow({
    width: 200,
    height: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // 加载控制按钮HTML
  const controlsPath = path.join(__dirname, '../controls.html');
  
  // 检查文件是否存在
  if (!fs.existsSync(controlsPath)) {
    // 创建controls.html文件
    const controlsHTML = createControlsHTML();
    fs.writeFileSync(controlsPath, controlsHTML);
  }
  
  controlsWindow.loadFile(controlsPath);
  
  // 设置窗口居中
  if (mainWindow) {
    const mainBounds = mainWindow.getBounds();
    const controlsBounds = controlsWindow.getBounds();
    
    controlsWindow.setPosition(
      Math.floor(mainBounds.x + (mainBounds.width - controlsBounds.width) / 2),
      Math.floor(mainBounds.y + (mainBounds.height - controlsBounds.height) / 2)
    );
  }
  
  controlsWindow.on('blur', () => {
    if (controlsWindow) {
      controlsWindow.hide();
    }
  });
  
  controlsWindow.on('closed', () => {
    controlsWindow = null;
  });
}

// 显示或隐藏控制按钮
export function toggleControlsWindow() {
  if (controlsWindow && controlsWindow.isVisible()) {
    controlsWindow.hide();
  } else {
    createControlsWindow();
  }
}

/**
 * 通用窗口事件处理器
 * 抽象重复的窗口事件处理逻辑
 */
function setupCommonWindowEvents(window: BrowserWindow, isMainWindow: boolean = false) {
  // 禁用双击标题栏最大化
  window.webContents.on('before-input-event', (event, input) => {
    // 如果是Alt+F4组合键，阻止默认行为
    if (input.alt && input.key === 'F4') {
      event.preventDefault();
    }
  });

  // 每次DOM准备好时，注入基础样式
  window.webContents.on('dom-ready', () => {
    if (isMainWindow) {
      injectBaseStyles(window);
    } else {
      injectNewWindowStyles(window);
      injectNewWindowBehaviors(window);
    }
  });

  // 监听页面加载失败事件
  window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // 忽略用户中止的错误 (如-3)
    if (errorCode === -3) return;

    console.error(`加载URL失败: ${validatedURL}, 错误: ${errorDescription} (${errorCode})`);

    // 导航到错误页面
    const errorMessage = encodeURIComponent(`无法加载页面: ${errorDescription} (${errorCode})`);
    const isSubWindowParam = isMainWindow ? '' : '&isSubWindow=true';
    const errorPageUrl = process.env.NODE_ENV === 'development'
      ? `http://localhost:5173/#/error?message=${errorMessage}${isSubWindowParam}`
      : `file://${path.join(__dirname, '../dist/index.html').replace(/\\/g, '/')}#/error?message=${errorMessage}${isSubWindowParam}`;

    if (window && !window.isDestroyed()) {
      window.loadURL(errorPageUrl);
    }
  });

  // 为所有网页注入自定义滚动条CSS
  window.webContents.on('did-finish-load', () => {
    if (window && !window.isDestroyed()) {
      window.webContents.insertCSS(customScrollbarCSS).catch(() => {
        // 出错时静默处理，生产环境不显示错误
      });
    }
  });

  // 监听页面导航，为新页面注入CSS
  window.webContents.on('did-navigate', () => {
    if (window && !window.isDestroyed()) {
      window.webContents.insertCSS(customScrollbarCSS).catch(() => {
        // 出错时静默处理，生产环境不显示错误
      });
    }
  });

  // 禁用右键菜单
  window.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });
}

/**
 * 通用窗口配置
 * 抽象重复的窗口配置选项
 */
function getCommonWindowConfig(isMainWindow: boolean = false) {
  const iconPath = path.join(
    process.env.NODE_ENV === 'development' ? __dirname : app.getAppPath(),
    process.env.NODE_ENV === 'development' ? '../assets/index.ico' : './assets/index.ico'
  );

  const baseConfig = {
    title: "AIBox",
    icon: iconPath,
    webPreferences: {
      nodeIntegration: isMainWindow,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      webSecurity: false
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

// 创建控制按钮HTML内容
function createControlsHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Controls</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 8px;
          overflow: hidden;
        }
        .controls {
          display: flex;
          padding: 10px;
          gap: 10px;
          justify-content: center;
        }
        .control-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          position: relative;
        }
        .back-btn { background-color: #4a90e2; }
        .minimize-btn { background-color: #ffbd44; }
        .maximize-btn { background-color: #00ca56; }
        .close-btn { background-color: #ff605c; }
      </style>
    </head>
    <body>
      <div class="controls">
        <button class="control-btn back-btn" id="back"></button>
        <button class="control-btn minimize-btn" id="minimize"></button>
        <button class="control-btn maximize-btn" id="maximize"></button>
        <button class="control-btn close-btn" id="close"></button>
      </div>
      <script>
        const back = document.getElementById('back');
        const minimize = document.getElementById('minimize');
        const maximize = document.getElementById('maximize');
        const close = document.getElementById('close');
        
        if (window.electronAPI) {
          back.addEventListener('click', () => window.electronAPI.returnToLogin());
          minimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
          maximize.addEventListener('click', () => window.electronAPI.maximizeWindow());
          close.addEventListener('click', () => window.electronAPI.closeWindow());
        }
      </script>
    </body>
    </html>
  `;
}

// 加载登录页面
export function loadLoginPage() {
  if (!mainWindow) return;
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // 在生产环境中加载打包后的index.html文件
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html').replace(/\\/g, '/')}`);
  }
}

// 创建主窗口
export function createWindow(options: WindowOptions = {}, hiddenButtons: string[] = []) {
  const { startUrl, fullscreen, alwaysOnTop } = options;

  // 使用通用配置创建主窗口
  const windowConfig = {
    ...getCommonWindowConfig(true),
    fullscreen: fullscreen,
    alwaysOnTop: alwaysOnTop,
    kiosk: false,
  };

  mainWindow = new BrowserWindow(windowConfig);

  // 设置通用窗口事件处理
  setupCommonWindowEvents(mainWindow, true);

  // 设置主窗口特有的事件处理
  setupMainWindowSpecificEvents(hiddenButtons);

  // 设置新窗口处理
  setupNewWindowHandler();

  // 加载应用的入口文件
  loadMainWindowContent(startUrl);

  // 设置全局快捷键和菜单
  setupGlobalShortcuts();

  // 设置空菜单，移除默认菜单
  Menu.setApplicationMenu(null);
}

// 设置主窗口特有的事件处理
function setupMainWindowSpecificEvents(hiddenButtons: string[]) {
  if (!mainWindow) return;

  // 添加标志来跟踪最大化状态，避免递归调用
  let isMaximizing = false;

  mainWindow.on('maximize', () => {
    // 如果正在处理最大化操作，直接返回避免递归
    if (isMaximizing) return;
  });

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    // 确保控制窗口也被关闭
    if (controlsWindow && !controlsWindow.isDestroyed()) {
      controlsWindow.close();
      controlsWindow = null;
    }

    mainWindow = null;
  });
}

// 设置新窗口处理
function setupNewWindowHandler() {
  if (!mainWindow) return;

  // 处理新窗口的打开请求（比如target="_blank"的链接）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // 使用通用配置创建新窗口
    const newWindow = new BrowserWindow(getCommonWindowConfig(false));

    // 确保图标设置正确（有时需要在窗口创建后再次设置）
    try {
      const iconPath = path.join(
        process.env.NODE_ENV === 'development' ? __dirname : app.getAppPath(),
        process.env.NODE_ENV === 'development' ? '../assets/index.ico' : './assets/index.ico'
      );
      newWindow.setIcon(iconPath);
    } catch (e) {
      console.error('设置图标失败:', e);
    }

    // 在新窗口中加载URL
    newWindow.loadURL(url);

    // 设置通用窗口事件处理
    setupCommonWindowEvents(newWindow, false);

    // 设置新窗口特有的事件处理
    setupNewWindowSpecificEvents(newWindow);

    return { action: 'deny' }; // 阻止默认行为，因为我们已经手动处理了
  });
}

// 设置新窗口特有的事件处理
function setupNewWindowSpecificEvents(newWindow: BrowserWindow) {
  // 为新窗口添加Ctrl+Shift+Alt快捷键支持
  newWindow.webContents.on('before-input-event', (event, input) => {
    // 如果按下了Ctrl+Shift+Alt组合键
    if (input.control && input.shift && input.alt) {
      // 如果有控制面板，触发显示/隐藏
      newWindow.webContents.executeJavaScript(`
        if (window.toggleControlPanel) {
          window.toggleControlPanel();
        }
      `).catch(() => {});

      event.preventDefault();
    }
  });

  // 为新窗口添加最大化处理，避免递归调用
  let newWindowMaximizing = false;

  newWindow.on('maximize', () => {
    // 如果正在处理最大化操作，直接返回避免递归
    if (newWindowMaximizing) return;
    // 允许正常的最大化功能
  });

  // 添加关闭事件处理
  newWindow.on('closed', () => {
    // 释放窗口对象
  });
}

// 加载主窗口内容
function loadMainWindowContent(startUrl?: string | null) {
  if (!mainWindow) return;

  if (startUrl) {
    let finalUrl = startUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'http://' + finalUrl;
    }
    mainWindow.loadURL(finalUrl).catch(err => console.error('Failed to load URL:', err));
  } else if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.closeDevTools();
  } else {
    // 在生产环境中加载打包后的index.html文件
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html').replace(/\\/g, '/')}`);
  }
}

// 设置全局快捷键
function setupGlobalShortcuts() {
  // 禁用F12和其他开发者工具快捷键
  globalShortcut.register('F12', () => {
    return false;
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    return false;
  });
  globalShortcut.register('CommandOrControl+Shift+J', () => {
    return false;
  });

  // 禁用Alt+F4关闭窗口
  globalShortcut.register('Alt+F4', () => {
    return false;
  });
}

// 清理窗口资源
export function cleanupWindows() {
  // 确保控制窗口也被关闭
  if (controlsWindow && !controlsWindow.isDestroyed()) {
    controlsWindow.close();
    controlsWindow = null;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
    mainWindow = null;
  }
}
