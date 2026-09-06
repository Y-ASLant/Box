import { app, BrowserWindow, ipcMain, shell } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { getAppConfig, getBackgroundPath } from './app-config';
import { injectControlsScript } from './controls-injector';
import { getMainWindow, loadLoginPage } from './window-manager';
import type { ParsedConfig } from '../shared/types';
import { normalizeHttpUrl } from '../shared/url';
const HANDLER_CHANNELS = [
  'navigate-to-url',
  'return-to-login',
  'minimize-window',
  'maximize-window',
  'close-window',
  'toggle-fullscreen',
  'get-app-config',
  'get-background-path',
  'clear-history-cache',
  'dom-ready'
] as const;


function getTargetWindow(event: IpcMainInvokeEvent): BrowserWindow | null {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  return targetWindow && !targetWindow.isDestroyed() ? targetWindow : null;
}

export function registerIPCHandlers(config: ParsedConfig) {
  for (const channel of HANDLER_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle('navigate-to-url', (event, remoteUrl: unknown) => {
    const mainWindow = getMainWindow();
    if (
      typeof remoteUrl !== 'string'
      || remoteUrl.trim().length === 0
      || !mainWindow
      || mainWindow.isDestroyed()
      || getTargetWindow(event) !== mainWindow
    ) {
      return false;
    }

    mainWindow.loadURL(normalizeHttpUrl(remoteUrl))
      .catch(error => console.error('加载远程URL失败:', error));
    return true;
  });

  ipcMain.handle('return-to-login', (event) => {
    const targetWindow = getTargetWindow(event);
    const mainWindow = getMainWindow();

    if (targetWindow === mainWindow) {
      if (config.isSinglePageMode) {
        shell.openPath(app.getPath('home'))
          .catch(error => console.error('打开用户目录失败:', error));
      } else {
        loadLoginPage();
      }
      return true;
    }

    if (targetWindow) {
      targetWindow.removeAllListeners('close');
      targetWindow.close();
      return true;
    }
    return false;
  });

  ipcMain.handle('minimize-window', (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    targetWindow.minimize();
    return true;
  });

  ipcMain.handle('maximize-window', (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }
    return true;
  });

  ipcMain.handle('close-window', (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    targetWindow.removeAllListeners('close');
    targetWindow.close();
    return true;
  });

  ipcMain.handle('toggle-fullscreen', (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    const nextFullscreen = !targetWindow.isFullScreen();
    targetWindow.setFullScreen(nextFullscreen);
    return nextFullscreen;
  });

  ipcMain.handle('get-app-config', () => {
    const fileConfig = getAppConfig();
    return {
      ...fileConfig,
      theme: config.theme ?? fileConfig.theme,
      hide: config.hide ?? fileConfig.hide
    };
  });

  ipcMain.handle('get-background-path', () => getBackgroundPath(config.bgPath));

  ipcMain.handle('clear-history-cache', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return false;

    const targetSession = mainWindow.webContents.session;
    await targetSession.clearCache();
    await targetSession.clearStorageData({
      storages: [
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'serviceworkers',
        'cachestorage'
      ],
    });
    loadLoginPage();
    return true;
  });

  ipcMain.handle('dom-ready', async (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    await injectControlsScript(targetWindow, config.hiddenButtons);
    return true;
  });
}
