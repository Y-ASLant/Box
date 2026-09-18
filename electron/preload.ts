import { contextBridge, ipcRenderer } from 'electron';
import type { BrowserState } from '../shared/types.mts';

contextBridge.exposeInMainWorld('electronAPI', {
  getBrowserState: () => ipcRenderer.invoke('browser:get-state'),
  createTab: (url?: string) => ipcRenderer.invoke('browser:create-tab', url),
  activateTab: (tabId: string) => ipcRenderer.invoke('browser:activate-tab', tabId),
  closeTab: (tabId: string) => ipcRenderer.invoke('browser:close-tab', tabId),
  navigate: (tabId: string, url: string) => ipcRenderer.invoke('browser:navigate', tabId, url),
  goBack: (tabId: string) => ipcRenderer.invoke('browser:go-back', tabId),
  goForward: (tabId: string) => ipcRenderer.invoke('browser:go-forward', tabId),
  reload: (tabId: string) => ipcRenderer.invoke('browser:reload', tabId),
  openNewTabPage: (tabId: string) => ipcRenderer.invoke('browser:new-tab-page', tabId),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getWindowState: () => ipcRenderer.invoke('window:get-state'),
  onWindowMaximizedChanged: (listener: (maximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: boolean) => listener(maximized);
    ipcRenderer.on('window:maximized-changed', handler);
    return () => ipcRenderer.removeListener('window:maximized-changed', handler);
  },
  onBrowserStateChanged: (listener: (state: BrowserState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: BrowserState) => listener(state);
    ipcRenderer.on('browser-state-changed', handler);
    return () => ipcRenderer.removeListener('browser-state-changed', handler);
  },
  onFocusAddress: (listener: () => void) => {
    const handler = () => listener();
    ipcRenderer.on('focus-address', handler);
    return () => ipcRenderer.removeListener('focus-address', handler);
  },
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  getBackgroundPath: () => ipcRenderer.invoke('get-background-path'),
  clearHistoryAndCache: () => ipcRenderer.invoke('clear-history-cache')
});
