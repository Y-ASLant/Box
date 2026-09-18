import { BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { getBackgroundUrl } from './app-config.mts';
import {
  activateBrowserTab,
  closeBrowserTab,
  createBrowserTab,
  getBrowserState,
  getMainWindow,
  getRendererUrl,
  navigateBrowserTab,
  navigateHistory,
  openNewTabPage,
  reloadBrowserTab
} from './window-manager';
import type { ResolvedConfig } from '../shared/types.mts';

const HANDLER_CHANNELS = [
  'browser:get-state',
  'browser:create-tab',
  'browser:activate-tab',
  'browser:close-tab',
  'browser:navigate',
  'browser:go-back',
  'browser:go-forward',
  'browser:reload',
  'browser:new-tab-page',
  'window:minimize',
  'window:toggle-maximize',
  'window:close',
  'window:get-state',
  'get-app-config',
  'get-background-path',
  'clear-history-cache'
] as const;

function isLocalRendererSender(event: IpcMainInvokeEvent): boolean {
  try {
    if (!event.senderFrame || event.sender !== getMainWindow()?.webContents) return false;
    const senderUrl = new URL(event.senderFrame.url);
    const rendererUrl = new URL(getRendererUrl());
    return senderUrl.protocol === rendererUrl.protocol
      && senderUrl.host === rendererUrl.host
      && senderUrl.pathname === rendererUrl.pathname;
  } catch {
    return false;
  }
}

function withLocalSender<T>(event: IpcMainInvokeEvent, action: () => T): T | false {
  return isLocalRendererSender(event) ? action() : false;
}

export function registerIPCHandlers(config: ResolvedConfig) {
  for (const channel of HANDLER_CHANNELS) ipcMain.removeHandler(channel);

  ipcMain.handle('browser:get-state', event => withLocalSender(event, getBrowserState));
  ipcMain.handle('browser:create-tab', (event, url: unknown) => withLocalSender(event, () => (
    createBrowserTab(typeof url === 'string' ? url : null, true)
  )));
  ipcMain.handle('browser:activate-tab', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && activateBrowserTab(tabId)
  )));
  ipcMain.handle('browser:close-tab', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && closeBrowserTab(tabId)
  )));
  ipcMain.handle('browser:navigate', (event, tabId: unknown, url: unknown) => {
    if (!isLocalRendererSender(event) || typeof tabId !== 'string' || typeof url !== 'string') return false;
    return navigateBrowserTab(tabId, url);
  });
  ipcMain.handle('browser:go-back', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && navigateHistory(tabId, 'back')
  )));
  ipcMain.handle('browser:go-forward', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && navigateHistory(tabId, 'forward')
  )));
  ipcMain.handle('browser:reload', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && reloadBrowserTab(tabId)
  )));
  ipcMain.handle('browser:new-tab-page', (event, tabId: unknown) => withLocalSender(event, () => (
    typeof tabId === 'string' && openNewTabPage(tabId)
  )));

  ipcMain.handle('window:minimize', event => withLocalSender(event, () => {
    getMainWindow()?.minimize();
    return true;
  }));
  ipcMain.handle('window:toggle-maximize', event => withLocalSender(event, () => {
    const window = getMainWindow();
    if (!window) return false;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
    return window.isMaximized();
  }));
  ipcMain.handle('window:close', event => withLocalSender(event, () => {
    getMainWindow()?.close();
    return true;
  }));
  ipcMain.handle('window:get-state', event => withLocalSender(event, () => ({
    maximized: getMainWindow()?.isMaximized() ?? false
  })));

  ipcMain.handle('get-app-config', event => {
    if (!isLocalRendererSender(event)) return {};
    return { theme: config.theme, hiddenControls: config.hiddenControls };
  });
  ipcMain.handle('get-background-path', event => (
    isLocalRendererSender(event) ? getBackgroundUrl(config.backgroundPath) : null
  ));
  ipcMain.handle('clear-history-cache', async event => {
    if (!isLocalRendererSender(event)) return false;
    const mainWindow = BrowserWindow.fromWebContents(event.sender);
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    await mainWindow.webContents.session.clearCache();
    await mainWindow.webContents.session.clearStorageData({
      storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'serviceworkers', 'cachestorage']
    });
    return true;
  });
}
