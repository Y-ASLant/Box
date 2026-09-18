/// <reference types="vite/client" />

import type { DefineComponent } from 'vue';
import type { RendererConfig } from '../shared/types.mts';

declare module '*.vue' {
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

declare global {
  interface ElectronAPI {
    navigateToUrl: (url: string) => Promise<boolean>;
    returnToLogin: () => Promise<boolean>;
    minimizeWindow: () => Promise<boolean>;
    maximizeWindow: () => Promise<boolean>;
    closeWindow: () => Promise<boolean>;
    toggleFullscreen: () => Promise<boolean>;
    getAppConfig: () => Promise<RendererConfig>;
    getBackgroundPath: () => Promise<string | null>;
    clearHistoryAndCache: () => Promise<boolean>;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
