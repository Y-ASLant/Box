/// <reference types="vite/client" />

import type { BrowserState, RendererConfig, RuntimeSettings, WindowState } from '../shared/types.mts';

declare global {
  interface ElectronAPI {
    getBrowserState: () => Promise<BrowserState | false>;
    createTab: (url?: string) => Promise<BrowserState | false>;
    activateTab: (tabId: string) => Promise<boolean>;
    closeTab: (tabId: string) => Promise<boolean>;
    navigate: (tabId: string, url: string) => Promise<boolean>;
    goBack: (tabId: string) => Promise<boolean>;
    goForward: (tabId: string) => Promise<boolean>;
    reload: (tabId: string) => Promise<boolean>;
    openNewTabPage: (tabId: string) => Promise<boolean>;
    setLocalPageVisible: (visible: boolean) => Promise<boolean>;
    minimizeWindow: () => Promise<boolean>;
    toggleMaximizeWindow: () => Promise<boolean>;
    toggleFullscreenWindow: () => Promise<boolean>;
    closeWindow: () => Promise<boolean>;
    getWindowState: () => Promise<WindowState | false>;
    onWindowStateChanged: (listener: (state: WindowState) => void) => () => void;
    onBrowserStateChanged: (listener: (state: BrowserState) => void) => () => void;
    onFocusAddress: (listener: () => void) => () => void;
    getAppConfig: () => Promise<RendererConfig>;
    applyRuntimeSettings: (settings: RuntimeSettings) => Promise<boolean>;
    getBackgroundPath: () => Promise<string | null>;
    clearHistoryAndCache: () => Promise<boolean>;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
