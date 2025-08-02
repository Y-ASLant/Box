import { contextBridge, ipcRenderer } from 'electron';

// 添加IPC处理程序来获取配置
ipcRenderer.on('config-updated', (_, config) => {
  // 当配置更新时，可以在这里处理
});

// 创建一个标志变量，跟踪DOM是否已经加载完成
let isDOMReady = false;

// 监听来自webContents注入脚本的消息
window.addEventListener('message', (event) => {
  // 只有在DOM加载完成后才处理消息
  if (!isDOMReady) return;
  
  // 我们只处理electron-ipc-control类型的消息
  if (event.data && event.data.type === 'electron-ipc-control') {
    // 根据action调用相应的IPC方法
    switch (event.data.action) {
      case 'return-to-login':
        ipcRenderer.invoke('return-to-login');
        break;
      case 'minimize':
        ipcRenderer.invoke('minimize-window');
        break;
      case 'maximize':
        ipcRenderer.invoke('maximize-window');
        break;
      case 'close':
        ipcRenderer.invoke('close-window');
        break;
      case 'toggle-fullscreen':
        ipcRenderer.invoke('toggle-fullscreen');
        break;
    }
  }
});

// DOM加载完成后再添加事件监听器
window.addEventListener('DOMContentLoaded', () => {
  // 设置DOM已加载标志
  isDOMReady = true;
  
  // 添加双击事件监听器，阻止双击最大化窗口
  document.addEventListener('dblclick', (e) => {
    // 如果双击在顶部区域(前30像素)，阻止默认行为
    if (e.clientY < 30) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  
  // 通知主进程DOM已加载完成，可以安全地注入脚本
  ipcRenderer.invoke('dom-ready');
});

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  navigateToUrl: (url: string) => ipcRenderer.invoke('navigate-to-url', url),
  returnToLogin: () => ipcRenderer.invoke('return-to-login'),
  // 添加窗口控制API
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  // 添加全屏切换API
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  // 添加拖动API
  startDrag: () => ipcRenderer.send('start-drag'),
  // 新增：获取应用配置
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  // 新增：获取背景图片路径
  getBackgroundPath: () => ipcRenderer.invoke('get-background-path'),
  // 新增：清除历史和缓存
  clearHistoryAndCache: () => ipcRenderer.invoke('clear-history-cache')
});
