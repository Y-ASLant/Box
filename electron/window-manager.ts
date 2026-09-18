import { BrowserWindow, Menu, WebContentsView, app } from 'electron';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { BrowserState, BrowserTabState, WindowOptions } from '../shared/types.mts';
import { isHttpUrl, normalizeHttpUrl } from '../shared/url.mts';

const BROWSER_CHROME_HEIGHT = 113;
const CUSTOM_FRAME_BORDER = 1;
const NEW_TAB_TITLE = '新标签页';

interface ManagedTab {
  id: string;
  title: string;
  url: string | null;
  view: WebContentsView | null;
}

let mainWindow: BrowserWindow | null = null;
let activeTabId: string | null = null;
let nextTabId = 1;
let tabWebSecurity = true;
let singlePageMode = false;
const tabs = new Map<string, ManagedTab>();

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getRendererUrl(hash = ''): string {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173/'
    : pathToFileURL(path.join(__dirname, '../dist/index.html')).toString();
  return `${baseUrl}${hash}`;
}

function getTabState(tab: ManagedTab): BrowserTabState {
  const navigationHistory = tab.view?.webContents.navigationHistory;
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    loading: tab.view?.webContents.isLoading() ?? false,
    canGoBack: navigationHistory?.canGoBack() ?? false,
    canGoForward: navigationHistory?.canGoForward() ?? false
  };
}

export function getBrowserState(): BrowserState {
  return {
    tabs: [...tabs.values()].map(getTabState),
    activeTabId
  };
}

function publishBrowserState() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
  mainWindow.webContents.send('browser-state-changed', getBrowserState());
}

function layoutActiveView() {
  if (!mainWindow || mainWindow.isDestroyed() || !activeTabId) return;
  const tab = tabs.get(activeTabId);
  if (!tab?.view) return;
  const [width, height] = mainWindow.getContentSize();
  tab.view.setBounds({
    x: CUSTOM_FRAME_BORDER,
    y: BROWSER_CHROME_HEIGHT,
    width: Math.max(0, width - CUSTOM_FRAME_BORDER * 2),
    height: Math.max(0, height - BROWSER_CHROME_HEIGHT - CUSTOM_FRAME_BORDER)
  });
}

function showActiveView() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  for (const tab of tabs.values()) {
    if (tab.view) mainWindow.contentView.removeChildView(tab.view);
  }

  const activeTab = activeTabId ? tabs.get(activeTabId) : null;
  if (activeTab?.view) {
    mainWindow.contentView.addChildView(activeTab.view);
    layoutActiveView();
  }
  publishBrowserState();
}

function updateTabFromWebContents(tab: ManagedTab) {
  if (!tab.view || tab.view.webContents.isDestroyed()) return;
  const currentUrl = tab.view.webContents.getURL();
  if (isHttpUrl(currentUrl)) tab.url = currentUrl;
  tab.title = tab.view.webContents.getTitle().trim() || tab.url || NEW_TAB_TITLE;
  publishBrowserState();
}

function createTabView(tab: ManagedTab): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false,
      webSecurity: tabWebSecurity
    }
  });

  view.setBackgroundColor('#ffffff');
  view.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault();
    tab.title = title.trim() || tab.url || NEW_TAB_TITLE;
    publishBrowserState();
  });
  view.webContents.on('did-start-loading', publishBrowserState);
  view.webContents.on('did-stop-loading', () => updateTabFromWebContents(tab));
  view.webContents.on('did-navigate', () => updateTabFromWebContents(tab));
  view.webContents.on('did-navigate-in-page', () => updateTabFromWebContents(tab));
  view.webContents.on('render-process-gone', () => {
    tab.title = '页面无响应';
    publishBrowserState();
  });
  view.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    if (key === 'f12' || ((input.control || input.meta) && input.shift && (key === 'i' || key === 'j'))) {
      event.preventDefault();
      return;
    }
    if (!(input.control || input.meta)) return;
    if (key === 'l') {
      event.preventDefault();
      mainWindow?.webContents.send('focus-address');
    } else if (key === 't') {
      event.preventDefault();
      createBrowserTab(null, true);
    } else if (key === 'w') {
      event.preventDefault();
      closeBrowserTab(tab.id);
    }
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (!isHttpUrl(url)) {
      console.warn(`已阻止非 HTTP(S) 新窗口: ${url}`);
      return { action: 'deny' };
    }
    if (singlePageMode) {
      void navigateBrowserTab(tab.id, url);
    } else {
      createBrowserTab(url, true);
    }
    return { action: 'deny' };
  });

  tab.view = view;
  return view;
}

export function createBrowserTab(url?: string | null, activate = true): BrowserState {
  if (singlePageMode && tabs.size > 0) {
    const existingTab = activeTabId
      ? tabs.get(activeTabId)
      : tabs.values().next().value as ManagedTab | undefined;
    if (existingTab && url) void navigateBrowserTab(existingTab.id, url);
    return getBrowserState();
  }

  const id = `tab-${nextTabId++}`;
  const tab: ManagedTab = { id, title: NEW_TAB_TITLE, url: null, view: null };
  tabs.set(id, tab);
  if (activate || !activeTabId) activeTabId = id;

  if (url) void navigateBrowserTab(id, url);
  else showActiveView();
  return getBrowserState();
}

export async function navigateBrowserTab(tabId: string, input: string): Promise<boolean> {
  const tab = tabs.get(tabId);
  if (!tab) return false;

  let url: string;
  try {
    url = normalizeHttpUrl(input);
  } catch {
    return false;
  }

  tab.url = url;
  tab.title = url;
  const view = tab.view ?? createTabView(tab);
  if (activeTabId === tabId) showActiveView();
  try {
    await view.webContents.loadURL(url);
    return true;
  } catch (error) {
    console.error(`加载 URL 失败: ${url}`, error);
    tab.title = '无法访问此页面';
    publishBrowserState();
    return false;
  }
}

export function activateBrowserTab(tabId: string): boolean {
  if (!tabs.has(tabId)) return false;
  activeTabId = tabId;
  showActiveView();
  return true;
}

export function closeBrowserTab(tabId: string): boolean {
  const tab = tabs.get(tabId);
  if (!tab) return false;
  const tabIds = [...tabs.keys()];
  const closedIndex = tabIds.indexOf(tabId);

  if (tab.view) {
    mainWindow?.contentView.removeChildView(tab.view);
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
  }
  tabs.delete(tabId);

  if (activeTabId === tabId) {
    const remainingIds = [...tabs.keys()];
    activeTabId = remainingIds[Math.min(closedIndex, remainingIds.length - 1)] ?? null;
  }
  if (tabs.size === 0) {
    createBrowserTab(null, true);
    return true;
  }
  showActiveView();
  return true;
}

export function navigateHistory(tabId: string, direction: 'back' | 'forward'): boolean {
  const history = tabs.get(tabId)?.view?.webContents.navigationHistory;
  if (!history) return false;
  if (direction === 'back' && history.canGoBack()) history.goBack();
  else if (direction === 'forward' && history.canGoForward()) history.goForward();
  else return false;
  return true;
}

export function reloadBrowserTab(tabId: string): boolean {
  const contents = tabs.get(tabId)?.view?.webContents;
  if (!contents) return false;
  if (contents.isLoading()) contents.stop();
  else contents.reload();
  return true;
}

export function openNewTabPage(tabId: string): boolean {
  const tab = tabs.get(tabId);
  if (!tab) return false;
  if (tab.view) {
    mainWindow?.contentView.removeChildView(tab.view);
    if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close();
  }
  tab.view = null;
  tab.url = null;
  tab.title = NEW_TAB_TITLE;
  if (activeTabId === tabId) showActiveView();
  return true;
}

export function createWindow(options: WindowOptions = {}) {
  const { startUrl, fullscreen, alwaysOnTop, webSecurity = true, singlePage = false } = options;
  tabWebSecurity = webSecurity;
  singlePageMode = singlePage;

  const iconPath = path.join(
    process.env.NODE_ENV === 'development' ? __dirname : app.getAppPath(),
    process.env.NODE_ENV === 'development' ? '../assets/index.ico' : './assets/index.ico'
  );
  const window = new BrowserWindow({
    title: 'Box',
    icon: iconPath,
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 520,
    fullscreen,
    alwaysOnTop,
    fullscreenable: true,
    resizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7f8fa',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      webSecurity: true
    }
  });

  mainWindow = window;
  window.on('resize', layoutActiveView);
  window.on('maximize', () => window.webContents.send('window:maximized-changed', true));
  window.on('unmaximize', () => window.webContents.send('window:maximized-changed', false));
  window.on('closed', () => {
    mainWindow = null;
    cleanupWindows();
  });
  window.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    if (key === 'f12' || ((input.control || input.meta) && input.shift && (key === 'i' || key === 'j'))) {
      event.preventDefault();
      return;
    }
    if (!(input.control || input.meta)) return;
    if (key === 'l') {
      event.preventDefault();
      window.webContents.send('focus-address');
    } else if (key === 't') {
      event.preventDefault();
      createBrowserTab(null, true);
    } else if (key === 'w' && activeTabId) {
      event.preventDefault();
      closeBrowserTab(activeTabId);
    }
  });
  window.webContents.once('did-finish-load', () => createBrowserTab(startUrl, true));
  void window.loadURL(getRendererUrl()).catch(error => console.error('加载浏览器界面失败:', error));
  Menu.setApplicationMenu(null);
}

export function cleanupWindows() {
  for (const tab of tabs.values()) {
    if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.close();
  }
  tabs.clear();
  activeTabId = null;
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
  mainWindow = null;
}
