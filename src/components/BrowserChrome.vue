<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Globe,
  House,
  LoaderCircle,
  LockKeyhole,
  Maximize,
  Minus,
  Minimize,
  Moon,
  Plus,
  RotateCw,
  Square,
  Sun,
  X
} from '@lucide/vue';
import type { BrowserState } from '../../shared/types.mts';
import { useTheme } from '../composables/useTheme';

const props = defineProps<{ state: BrowserState }>();
const emit = defineEmits<{
  createTab: [];
  activateTab: [tabId: string];
  closeTab: [tabId: string];
  navigate: [url: string];
  goBack: [];
  goForward: [];
  reload: [];
  home: [];
}>();

const address = ref('');
const addressInput = ref<HTMLInputElement | null>(null);
const isEditingAddress = ref(false);
const isMaximized = ref(false);
const isFullscreen = ref(false);
const { toggleTheme, isDarkMode } = useTheme();
const activeTab = computed(() => props.state.tabs.find(tab => tab.id === props.state.activeTabId) ?? null);
let removeWindowStateListener: (() => void) | undefined;

onMounted(async () => {
  if (!window.electronAPI) return;
  const windowState = await window.electronAPI.getWindowState();
  if (windowState) {
    isMaximized.value = windowState.maximized;
    isFullscreen.value = windowState.fullscreen;
  }
  removeWindowStateListener = window.electronAPI.onWindowStateChanged(state => {
    isMaximized.value = state.maximized;
    isFullscreen.value = state.fullscreen;
  });
});

onBeforeUnmount(() => removeWindowStateListener?.());

watch(() => activeTab.value?.url, url => {
  if (!isEditingAddress.value) address.value = url ?? '';
}, { immediate: true });

const submitAddress = () => {
  const value = address.value.trim();
  if (value) emit('navigate', value);
  addressInput.value?.blur();
};

const focusAddress = async () => {
  await nextTick();
  addressInput.value?.focus();
  addressInput.value?.select();
};

const handleAddressBlur = () => {
  isEditingAddress.value = false;
  address.value = activeTab.value?.url ?? '';
};

const minimizeWindow = () => window.electronAPI?.minimizeWindow();
const toggleMaximizeWindow = () => window.electronAPI?.toggleMaximizeWindow();
const toggleFullscreenWindow = () => window.electronAPI?.toggleFullscreenWindow();
const closeWindow = () => window.electronAPI?.closeWindow();

defineExpose({ focusAddress });
</script>

<template>
  <header class="browser-chrome">
    <div class="tab-strip" role="tablist" aria-label="标签页">
      <div class="tabs-scroll">
        <div
          v-for="tab in state.tabs"
          :key="tab.id"
          class="browser-tab"
          :class="{ active: tab.id === state.activeTabId }"
          role="tab"
          tabindex="0"
          :aria-selected="tab.id === state.activeTabId"
          @click="emit('activateTab', tab.id)"
          @keydown.enter="emit('activateTab', tab.id)"
        >
          <LoaderCircle v-if="tab.loading" class="tab-loader" :size="16" :stroke-width="1.9" aria-hidden="true" />
          <Globe v-else-if="tab.url" class="tab-favicon" :size="16" :stroke-width="1.9" aria-hidden="true" />
          <Plus v-else class="tab-favicon" :size="16" :stroke-width="1.9" aria-hidden="true" />
          <span class="tab-title">{{ tab.title }}</span>
          <button
            class="tab-close"
            aria-label="关闭标签页"
            @click.stop="emit('closeTab', tab.id)"
          ><X :size="15" :stroke-width="2" aria-hidden="true" /></button>
        </div>
      </div>
      <button class="new-tab-button" aria-label="新建标签页" title="新建标签页 (Ctrl+T)" @click="emit('createTab')">
        <Plus :size="18" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <div class="tab-strip-spacer"></div>
      <div class="window-controls" aria-label="窗口控制">
        <button
          class="window-button fullscreen-button"
          :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
          :title="isFullscreen ? '退出全屏 (F11)' : '全屏 (F11)'"
          @click="toggleFullscreenWindow"
        >
          <Minimize v-if="isFullscreen" :size="15" :stroke-width="1.7" aria-hidden="true" />
          <Maximize v-else :size="15" :stroke-width="1.7" aria-hidden="true" />
        </button>
        <button class="window-button" aria-label="最小化" title="最小化" @click="minimizeWindow">
          <Minus :size="16" :stroke-width="1.7" aria-hidden="true" />
        </button>
        <button
          class="window-button maximize-button"
          :aria-label="isMaximized ? '还原' : '最大化'"
          :title="isMaximized ? '还原' : '最大化'"
          @click="toggleMaximizeWindow"
        >
          <Copy v-if="isMaximized" :size="14" :stroke-width="1.7" aria-hidden="true" />
          <Square v-else :size="14" :stroke-width="1.7" aria-hidden="true" />
        </button>
        <button class="window-button close-button" aria-label="关闭" title="关闭" @click="closeWindow">
          <X :size="17" :stroke-width="1.7" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="navigation-bar">
      <nav class="navigation-actions" aria-label="网页导航">
        <button class="icon-button" :disabled="!activeTab?.canGoBack" aria-label="后退" @click="emit('goBack')">
          <ArrowLeft :size="19" :stroke-width="1.8" aria-hidden="true" />
        </button>
        <button class="icon-button" :disabled="!activeTab?.canGoForward" aria-label="前进" @click="emit('goForward')">
          <ArrowRight :size="19" :stroke-width="1.8" aria-hidden="true" />
        </button>
        <button class="icon-button reload-button" aria-label="刷新或停止" @click="emit('reload')">
          <X v-if="activeTab?.loading" :size="18" :stroke-width="1.8" aria-hidden="true" />
          <RotateCw v-else :size="18" :stroke-width="1.8" aria-hidden="true" />
        </button>
        <button class="icon-button home-button" aria-label="新标签页" @click="emit('home')">
          <House :size="18" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </nav>

      <form class="address-form" @submit.prevent="submitAddress">
        <LockKeyhole
          v-if="activeTab?.url?.startsWith('https://')"
          class="site-indicator secure"
          :size="15"
          :stroke-width="1.8"
          aria-hidden="true"
        />
        <Globe v-else class="site-indicator" :size="15" :stroke-width="1.8" aria-hidden="true" />
        <input
          ref="addressInput"
          v-model="address"
          class="address-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          aria-label="地址栏"
          placeholder="输入网址、IP 地址或域名"
          @focus="isEditingAddress = true"
          @blur="handleAddressBlur"
        />
      </form>

      <button
        class="icon-button theme-button"
        :aria-label="isDarkMode() ? '切换到浅色模式' : '切换到深色模式'"
        :title="isDarkMode() ? '浅色模式' : '深色模式'"
        @click="toggleTheme"
      >
        <Sun v-if="isDarkMode()" :size="18" :stroke-width="1.8" aria-hidden="true" />
        <Moon v-else :size="18" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.browser-chrome {
  position: relative;
  z-index: 10;
  height: var(--shell-chrome-height);
  color: var(--color-text-primary);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-divider);
}
.tab-strip {
  display: flex;
  align-items: flex-end;
  gap: var(--space-1);
  height: var(--shell-titlebar-height);
  padding: 0.4375rem var(--space-3) 0;
  background: var(--color-titlebar);
  -webkit-app-region: drag;
}
.tabs-scroll {
  display: flex;
  min-width: 0;
  max-width: min(56.25rem, calc(100vw - 15rem));
  gap: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-app-region: no-drag;
}
.tabs-scroll::-webkit-scrollbar { display: none; }
.browser-tab {
  display: flex;
  align-items: center;
  min-width: 150px;
  max-width: 230px;
  height: var(--control-height-md);
  gap: var(--space-2);
  padding: 0 var(--space-2) 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: var(--color-text-muted);
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition:
    color var(--duration-normal) var(--ease-standard),
    background var(--duration-normal) var(--ease-standard);
}
.browser-tab:hover { background: var(--color-tab-hover); }
.browser-tab.active { color: var(--color-text-primary); background: var(--color-surface); }
.tab-favicon {
  flex: 0 0 18px;
  color: var(--color-accent);
}
.tab-loader {
  flex: 0 0 16px;
  color: var(--color-accent);
  animation: spin var(--duration-spinner) linear infinite;
}
.tab-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
.tab-close {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.tab-close:hover { background: var(--color-control-hover); }
.new-tab-button,
.icon-button {
  display: grid;
  place-items: center;
  border: 0;
  color: var(--color-text-muted);
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  transition:
    color var(--duration-normal) var(--ease-standard),
    background var(--duration-normal) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.new-tab-button {
  width: 32px;
  height: 32px;
  margin: 0 0 2px 2px;
  border-radius: var(--radius-md);
  -webkit-app-region: no-drag;
}
.new-tab-button:hover,
.icon-button:hover:not(:disabled) { color: var(--color-text-primary); background: var(--color-control-hover); }
.new-tab-button:active,
.icon-button:active:not(:disabled) { transform: scale(0.94); }
.tab-strip-spacer { flex: 1; align-self: stretch; }
.window-controls {
  display: flex;
  align-self: stretch;
  margin: -7px -10px 0 8px;
  -webkit-app-region: no-drag;
}
.window-button {
  display: grid;
  width: var(--shell-window-button-width);
  height: 43px;
  padding: 0;
  place-items: center;
  border: 0;
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background var(--duration-fast) var(--ease-standard);
}
.window-button:hover { color: var(--color-text-primary); background: var(--color-control-hover); }
.close-button:hover { color: var(--color-on-accent); background: var(--color-danger); }
.navigation-bar {
  display: flex;
  align-items: center;
  height: var(--shell-navigation-height);
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  background: var(--color-surface);
}
.navigation-actions { display: flex; gap: var(--space-1); }
.icon-button {
  width: var(--control-height-md);
  height: var(--control-height-md);
  border-radius: var(--radius-md);
}
.icon-button:disabled { opacity: 0.32; cursor: default; }
.theme-button { flex: 0 0 38px; }
.address-form {
  display: flex;
  align-items: center;
  min-width: 160px;
  height: var(--control-height-lg);
  flex: 1;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  transition:
    border-color var(--duration-normal) var(--ease-standard),
    background var(--duration-normal) var(--ease-standard),
    box-shadow var(--duration-normal) var(--ease-standard);
}
.address-form:focus-within {
  border-color: var(--color-accent);
  background: var(--color-surface);
  box-shadow: var(--shadow-focus);
}
.site-indicator {
  flex: 0 0 15px;
  color: var(--color-text-muted);
}
.site-indicator.secure { color: var(--color-success); }
.address-input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--color-text-primary);
  background: transparent;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
}
.address-input::placeholder { color: var(--color-text-placeholder); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
