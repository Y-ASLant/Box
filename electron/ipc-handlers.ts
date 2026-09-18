import { app, BrowserWindow, ipcMain, shell } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { getAppConfig, getBackgroundPath } from './app-config';
import { injectControlsScript } from './controls-injector';
import { closeManagedWindow, getMainWindow, getRendererUrl, loadLoginPage } from './window-manager';
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

function isLocalRendererSender(event: IpcMainInvokeEvent): boolean {
  try {
    if (!event.senderFrame) return false;
    const senderUrl = new URL(event.senderFrame.url);
    const rendererUrl = new URL(getRendererUrl());
    return senderUrl.protocol === rendererUrl.protocol
      && senderUrl.host === rendererUrl.host
      && senderUrl.pathname === rendererUrl.pathname;
  } catch {
    return false;
  }
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
      || !isLocalRendererSender(event)
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
      return closeManagedWindow(targetWindow);
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
    return closeManagedWindow(targetWindow);
  });

  ipcMain.handle('toggle-fullscreen', (event) => {
    const targetWindow = getTargetWindow(event);
    if (!targetWindow) return false;
    const nextFullscreen = !targetWindow.isFullScreen();
    targetWindow.setFullScreen(nextFullscreen);
    return nextFullscreen;
  });

  ipcMain.handle('get-app-config', (event) => {
    if (!isLocalRendererSender(event)) return {};
    const fileConfig = getAppConfig();
    return {
      ...fileConfig,
      theme: config.theme ?? undefined,
      hide: config.hide ?? undefined
    };
  });

  ipcMain.handle('get-background-path', (event) => {
    if (!isLocalRendererSender(event)) return null;
    return getBackgroundPath(config.bgPath);
  });

  ipcMain.handle('clear-history-cache', async (event) => {
    if (!isLocalRendererSender(event)) return false;
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
