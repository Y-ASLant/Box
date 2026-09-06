import { contextBridge, ipcRenderer } from 'electron';

const CONTROL_CHANNELS = {
  'return-to-login': 'return-to-login',
  minimize: 'minimize-window',
  maximize: 'maximize-window',
  close: 'close-window',
  'toggle-fullscreen': 'toggle-fullscreen'
} as const;

window.addEventListener('message', (event) => {
  if (
    event.source !== window
    || event.data?.type !== 'electron-ipc-control'
    || typeof event.data.action !== 'string'
    || !(event.data.action in CONTROL_CHANNELS)
  ) {
    return;
  }

  const action = event.data.action as keyof typeof CONTROL_CHANNELS;
  ipcRenderer.invoke(CONTROL_CHANNELS[action])
    .catch(error => console.error('执行窗口控制失败:', error));
});

window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('dblclick', (event) => {
    if (event.clientY < 30) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  ipcRenderer.invoke('dom-ready')
    .catch(error => console.error('通知DOM就绪失败:', error));
});

contextBridge.exposeInMainWorld('electronAPI', {
  navigateToUrl: (url: string) => ipcRenderer.invoke('navigate-to-url', url),
  returnToLogin: () => ipcRenderer.invoke('return-to-login'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  getBackgroundPath: () => ipcRenderer.invoke('get-background-path'),
  clearHistoryAndCache: () => ipcRenderer.invoke('clear-history-cache')
});
