import { Box, Grid } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrowserState } from '../shared/types.mts';
import { BrowserChrome, type BrowserChromeHandle } from './components/BrowserChrome';
import { NewTabPage } from './views/NewTabPage';
import { SettingsPage } from './views/SettingsPage';

const EMPTY_BROWSER_STATE: BrowserState = { tabs: [], activeTabId: null };
const PREVIEW_BROWSER_STATE: BrowserState = {
  tabs: [{
    id: 'preview-new-tab',
    title: '新标签页',
    url: null,
    loading: false,
    canGoBack: false,
    canGoForward: false
  }],
  activeTabId: 'preview-new-tab'
};

export default function App() {
  const browserChrome = useRef<BrowserChromeHandle>(null);
  const [browserState, setBrowserState] = useState<BrowserState>(EMPTY_BROWSER_STATE);
  const [localPage, setLocalPage] = useState<'browser' | 'settings'>('browser');
  const activeTabId = browserState.activeTabId;

  const showBrowser = useCallback(() => {
    setLocalPage('browser');
    void window.electronAPI?.setLocalPageVisible(false);
  }, []);

  const showSettings = useCallback(() => {
    setLocalPage('settings');
    void window.electronAPI?.setLocalPageVisible(true);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) {
      setBrowserState(PREVIEW_BROWSER_STATE);
      return;
    }

    let active = true;
    const removeStateListener = window.electronAPI.onBrowserStateChanged(setBrowserState);
    const removeFocusListener = window.electronAPI.onFocusAddress(() => {
      showBrowser();
      browserChrome.current?.focusAddress();
    });

    void window.electronAPI.getBrowserState().then(state => {
      if (active && state) setBrowserState(state);
    });

    return () => {
      active = false;
      removeStateListener();
      removeFocusListener();
    };
  }, [showBrowser]);

  const createTab = useCallback(async () => {
    showBrowser();
    await window.electronAPI?.createTab();
    browserChrome.current?.focusAddress();
  }, [showBrowser]);

  const activateTab = useCallback((tabId: string) => {
    showBrowser();
    void window.electronAPI?.activateTab(tabId);
  }, [showBrowser]);

  const closeTab = useCallback((tabId: string) => {
    void window.electronAPI?.closeTab(tabId);
  }, []);

  const goBack = useCallback(() => {
    if (activeTabId) void window.electronAPI?.goBack(activeTabId);
  }, [activeTabId]);

  const goForward = useCallback(() => {
    if (activeTabId) void window.electronAPI?.goForward(activeTabId);
  }, [activeTabId]);

  const reload = useCallback(() => {
    if (activeTabId) void window.electronAPI?.reload(activeTabId);
  }, [activeTabId]);

  const home = useCallback(() => {
    showBrowser();
    if (activeTabId) void window.electronAPI?.openNewTabPage(activeTabId);
  }, [activeTabId, showBrowser]);

  const navigate = useCallback(async (url: string) => {
    if (!activeTabId || !window.electronAPI) {
      window.location.href = url;
      return;
    }
    await window.electronAPI.navigate(activeTabId, url);
  }, [activeTabId]);

  return (
    <Grid
      width="100%"
      height="100%"
      gridTemplateRows="96px minmax(0, 1fr)"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border"
      bg="bg"
    >
      <BrowserChrome
        ref={browserChrome}
        state={browserState}
        onCreateTab={createTab}
        onActivateTab={activateTab}
        onCloseTab={closeTab}
        onNavigate={navigate}
        onGoBack={goBack}
        onGoForward={goForward}
        onReload={reload}
        onHome={home}
        isSettingsOpen={localPage === 'settings'}
        onOpenSettings={showSettings}
      />
      <Box minHeight="0" overflow="auto" bg="bg.subtle" scrollbarColor="border.emphasized transparent">
        {localPage === 'settings'
          ? <SettingsPage onClose={showBrowser} />
          : <NewTabPage onNavigate={navigate} />}
      </Box>
    </Grid>
  );
}
