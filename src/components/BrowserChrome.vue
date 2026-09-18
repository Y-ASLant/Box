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
  Minus,
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
const { toggleTheme, isDarkMode } = useTheme();
const activeTab = computed(() => props.state.tabs.find(tab => tab.id === props.state.activeTabId) ?? null);
let removeMaximizedListener: (() => void) | undefined;

onMounted(async () => {
  if (!window.electronAPI) return;
  const windowState = await window.electronAPI.getWindowState();
  if (windowState) isMaximized.value = windowState.maximized;
  removeMaximizedListener = window.electronAPI.onWindowMaximizedChanged(maximized => {
    isMaximized.value = maximized;
  });
});

onBeforeUnmount(() => removeMaximizedListener?.());

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
const closeWindow = () => window.electronAPI?.closeWindow();

defineExpose({ focusAddress });
</script>

<template>
  <header class="browser-chrome">
    <div class="tab-strip" role="tablist" aria-label="标签页">
      <div class="brand-mark" aria-label="Box">B</div>
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
  height: 112px;
  color: var(--chrome-text);
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--chrome-border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
.tab-strip {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 44px;
  padding: 7px 10px 0;
  background: var(--tab-strip-bg);
  -webkit-app-region: drag;
}
.brand-mark {
  display: grid;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  margin: 0 4px 4px 1px;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  background: linear-gradient(145deg, #3478f6, #6558ef);
  font-size: 15px;
  font-weight: 750;
  box-shadow: 0 5px 14px rgba(70, 92, 230, 0.25);
}
.tabs-scroll {
  display: flex;
  min-width: 0;
  max-width: min(900px, calc(100vw - 190px));
  gap: 3px;
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
  height: 36px;
  gap: 9px;
  padding: 0 9px 0 12px;
  border: 0;
  border-radius: 10px 10px 0 0;
  color: var(--chrome-muted);
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: color 140ms ease, background 140ms ease;
}
.browser-tab:hover { background: var(--tab-hover); }
.browser-tab.active { color: var(--chrome-text); background: var(--chrome-bg); }
.tab-favicon {
  flex: 0 0 18px;
  color: #5f6ee8;
}
.tab-loader {
  flex: 0 0 16px;
  color: #5b6ee1;
  animation: spin 800ms linear infinite;
}
.tab-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 520;
}
.tab-close {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
.tab-close:hover { background: var(--control-hover); }
.new-tab-button,
.icon-button {
  display: grid;
  place-items: center;
  border: 0;
  color: var(--chrome-muted);
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  transition: color 140ms ease, background 140ms ease, transform 100ms ease;
}
.new-tab-button {
  width: 32px;
  height: 32px;
  margin: 0 0 2px 2px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
}
.new-tab-button:hover,
.icon-button:hover:not(:disabled) { color: var(--chrome-text); background: var(--control-hover); }
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
  width: 46px;
  height: 43px;
  padding: 0;
  place-items: center;
  border: 0;
  color: var(--chrome-muted);
  background: transparent;
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease;
}
.window-button:hover { color: var(--chrome-text); background: var(--control-hover); }
.close-button:hover { color: #fff; background: #e5484d; }
.navigation-bar {
  display: flex;
  align-items: center;
  height: 68px;
  gap: 12px;
  padding: 10px 14px 14px;
  background: var(--chrome-bg);
}
.navigation-actions { display: flex; gap: 4px; }
.icon-button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}
.icon-button:disabled { opacity: 0.32; cursor: default; }
.theme-button { flex: 0 0 38px; }
.address-form {
  display: flex;
  align-items: center;
  min-width: 160px;
  height: 42px;
  flex: 1;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: var(--address-bg);
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.address-form:focus-within {
  border-color: #6d7df0;
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(93, 111, 226, 0.13);
}
.site-indicator {
  flex: 0 0 15px;
  color: #8b94a5;
}
.site-indicator.secure { color: #2f9565; }
.address-input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--chrome-text);
  background: transparent;
  font: 500 13.5px/1.4 inherit;
}
.address-input::placeholder { color: var(--chrome-placeholder); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
