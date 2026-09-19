import {
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Input,
  InputGroup,
  Spinner,
  Tabs
} from '@chakra-ui/react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Globe,
  House,
  LockKeyhole,
  Maximize,
  Minus,
  Minimize,
  Moon,
  Plus,
  RotateCw,
  Settings,
  Square,
  Sun,
  X
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import type { BrowserState } from '../../shared/types.mts';
import { useAppSettings } from '../hooks/use-app-settings';

export interface BrowserChromeHandle {
  focusAddress: () => void;
}

interface BrowserChromeProps {
  state: BrowserState;
  onCreateTab: () => void | Promise<void>;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNavigate: (url: string) => void | Promise<void>;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onHome: () => void;
  isSettingsOpen: boolean;
  onOpenSettings: () => void;
}

export const BrowserChrome = forwardRef<BrowserChromeHandle, BrowserChromeProps>(function BrowserChrome({
  state,
  onCreateTab,
  onActivateTab,
  onCloseTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onHome,
  isSettingsOpen,
  onOpenSettings
}, ref) {
  const addressInput = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isDarkMode, toggleTheme } = useAppSettings();
  const activeTab = useMemo(
    () => state.tabs.find(tab => tab.id === state.activeTabId) ?? null,
    [state.activeTabId, state.tabs]
  );

  useEffect(() => {
    if (!isEditingAddress) setAddress(activeTab?.url ?? '');
  }, [activeTab?.url, isEditingAddress]);

  useEffect(() => {
    if (!window.electronAPI) return;

    let active = true;
    void window.electronAPI.getWindowState().then(windowState => {
      if (active && windowState) {
        setIsMaximized(windowState.maximized);
        setIsFullscreen(windowState.fullscreen);
      }
    });
    const removeWindowStateListener = window.electronAPI.onWindowStateChanged(windowState => {
      setIsMaximized(windowState.maximized);
      setIsFullscreen(windowState.fullscreen);
    });

    return () => {
      active = false;
      removeWindowStateListener();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    focusAddress() {
      requestAnimationFrame(() => {
        addressInput.current?.focus();
        addressInput.current?.select();
      });
    }
  }), []);

  const submitAddress = (event: FormEvent) => {
    event.preventDefault();
    const value = address.trim();
    if (value) void onNavigate(value);
    addressInput.current?.blur();
  };

  const closeTab = (event: MouseEvent<HTMLButtonElement>, tabId: string) => {
    event.stopPropagation();
    onCloseTab(tabId);
  };

  const siteIndicator = activeTab?.url?.startsWith('https://')
    ? <LockKeyhole size={16} strokeWidth={1.8} aria-hidden />
    : <Globe size={16} strokeWidth={1.8} aria-hidden />;

  return (
    <Box
      as="header"
      position="relative"
      zIndex="docked"
      height="24"
      color="fg"
      bg="bg"
      borderBottomWidth="1px"
      borderColor="border"
    >
      <Flex
        className="window-drag-region"
        align="center"
        gap="1"
        height="11"
        p="1"
        bg="bg.muted"
      >
        <Tabs.Root
          value={state.activeTabId ?? ''}
          variant="enclosed"
          size="sm"
          colorPalette="blue"
          minWidth="0"
          maxWidth="min(56rem, calc(100vw - 15rem))"
          onValueChange={({ value }) => onActivateTab(value)}
        >
          <Tabs.List
            className="window-no-drag-region hidden-scrollbar"
            minWidth="0"
            overflowX="auto"
            scrollbarWidth="none"
          >
            {state.tabs.map(tab => (
              <Box key={tab.id} position="relative" flex="0 0 auto">
                <Tabs.Trigger value={tab.id} width="52" maxWidth="52" pe="9">
                  {tab.loading ? (
                    <Spinner size="xs" colorPalette="blue" />
                  ) : tab.url ? (
                    <Globe size={16} strokeWidth={1.9} aria-hidden />
                  ) : (
                    <Plus size={16} strokeWidth={1.9} aria-hidden />
                  )}
                  <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {tab.title}
                  </Box>
                </Tabs.Trigger>
                <IconButton
                  aria-label="关闭标签页"
                  title="关闭标签页"
                  position="absolute"
                  insetEnd="1"
                  top="50%"
                  zIndex="1"
                  size="2xs"
                  variant="ghost"
                  transform="translateY(-50%)"
                  onClick={event => closeTab(event, tab.id)}
                >
                  <X aria-hidden />
                </IconButton>
              </Box>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <IconButton
          className="window-no-drag-region"
          aria-label="新建标签页"
          title="新建标签页 (Ctrl+T)"
          size="sm"
          variant="ghost"
          colorPalette="blue"
          onClick={() => void onCreateTab()}
        >
          <Plus aria-hidden />
        </IconButton>

        <Box flex="1" alignSelf="stretch" />

        <ButtonGroup
          className="window-no-drag-region"
          variant="ghost"
          size="sm"
          attached
          alignSelf="center"
        >
          <WindowButton
            label={isFullscreen ? '退出全屏' : '进入全屏'}
            title={isFullscreen ? '退出全屏 (F11)' : '全屏 (F11)'}
            onClick={() => void window.electronAPI?.toggleFullscreenWindow()}
          >
            {isFullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
          </WindowButton>
          <WindowButton label="最小化" title="最小化" onClick={() => void window.electronAPI?.minimizeWindow()}>
            <Minus aria-hidden />
          </WindowButton>
          <WindowButton
            label={isMaximized ? '还原' : '最大化'}
            title={isMaximized ? '还原' : '最大化'}
            onClick={() => void window.electronAPI?.toggleMaximizeWindow()}
          >
            {isMaximized ? <Copy aria-hidden /> : <Square aria-hidden />}
          </WindowButton>
          <WindowButton
            label="关闭"
            title="关闭"
            colorPalette="red"
            onClick={() => void window.electronAPI?.closeWindow()}
          >
            <X aria-hidden />
          </WindowButton>
        </ButtonGroup>
      </Flex>

      <Flex align="center" height="13" gap="2" px="1.5" bg="bg">
        <ButtonGroup as="nav" aria-label="网页导航" variant="ghost" size="sm">
          <NavigationButton label="后退" disabled={!activeTab?.canGoBack} onClick={onGoBack}>
            <ArrowLeft aria-hidden />
          </NavigationButton>
          <NavigationButton label="前进" disabled={!activeTab?.canGoForward} onClick={onGoForward}>
            <ArrowRight aria-hidden />
          </NavigationButton>
          <NavigationButton label="刷新或停止" onClick={onReload}>
            {activeTab?.loading ? <X aria-hidden /> : <RotateCw aria-hidden />}
          </NavigationButton>
          <NavigationButton label="新标签页" onClick={onHome}>
            <House aria-hidden />
          </NavigationButton>
        </ButtonGroup>

        <Box as="form" minWidth="40" flex="1" onSubmit={submitAddress}>
          <InputGroup
            width="full"
            startElement={siteIndicator}
            startElementProps={{ color: activeTab?.url?.startsWith('https://') ? 'green.fg' : 'fg.muted' }}
          >
            <Input
              ref={addressInput}
              value={address}
              type="text"
              autoComplete="off"
              spellCheck={false}
              aria-label="地址栏"
              placeholder="输入网址、IP 地址或域名"
              size="md"
              variant="subtle"
              onChange={event => setAddress(event.target.value)}
              onFocus={() => setIsEditingAddress(true)}
              onBlur={() => {
                setIsEditingAddress(false);
                setAddress(activeTab?.url ?? '');
              }}
            />
          </InputGroup>
        </Box>

        <NavigationButton
          label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
          title={isDarkMode ? '浅色模式' : '深色模式'}
          onClick={toggleTheme}
        >
          {isDarkMode ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </NavigationButton>
        <IconButton
          aria-label="打开设置"
          title="设置"
          size="sm"
          variant={isSettingsOpen ? 'subtle' : 'ghost'}
          colorPalette={isSettingsOpen ? 'blue' : 'gray'}
          onClick={onOpenSettings}
        >
          <Settings aria-hidden />
        </IconButton>
      </Flex>
    </Box>
  );
});

interface ControlButtonProps {
  label: string;
  title?: string;
  disabled?: boolean;
  colorPalette?: 'gray' | 'red';
  onClick: () => void;
  children: ReactNode;
}

function NavigationButton({ label, title, disabled, onClick, children }: ControlButtonProps) {
  return (
    <IconButton
      aria-label={label}
      title={title}
      disabled={disabled}
      size="sm"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </IconButton>
  );
}

function WindowButton({ label, title, colorPalette = 'gray', onClick, children }: ControlButtonProps) {
  return (
    <IconButton
      aria-label={label}
      title={title}
      colorPalette={colorPalette}
      size="sm"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </IconButton>
  );
}
