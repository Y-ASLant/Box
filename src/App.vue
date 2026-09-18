<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BrowserChrome from './components/BrowserChrome.vue';
import type { BrowserState } from '../shared/types.mts';
import { useTheme } from './composables/useTheme';

const { loadThemePreference } = useTheme();
void loadThemePreference();

const browserChrome = ref<InstanceType<typeof BrowserChrome> | null>(null);
const browserState = ref<BrowserState>({ tabs: [], activeTabId: null });
let removeStateListener: (() => void) | undefined;
let removeFocusListener: (() => void) | undefined;

const activeTabId = computed(() => browserState.value.activeTabId);

onMounted(async () => {
  if (!window.electronAPI) return;
  removeStateListener = window.electronAPI.onBrowserStateChanged(state => {
    browserState.value = state;
  });
  removeFocusListener = window.electronAPI.onFocusAddress(() => browserChrome.value?.focusAddress());
  const state = await window.electronAPI.getBrowserState();
  if (state) browserState.value = state;
});

onBeforeUnmount(() => {
  removeStateListener?.();
  removeFocusListener?.();
});

const createTab = async () => {
  await window.electronAPI?.createTab();
  browserChrome.value?.focusAddress();
};

const activateTab = (tabId: string) => window.electronAPI?.activateTab(tabId);
const closeTab = (tabId: string) => window.electronAPI?.closeTab(tabId);
const goBack = () => activeTabId.value && window.electronAPI?.goBack(activeTabId.value);
const goForward = () => activeTabId.value && window.electronAPI?.goForward(activeTabId.value);
const reload = () => activeTabId.value && window.electronAPI?.reload(activeTabId.value);
const home = () => activeTabId.value && window.electronAPI?.openNewTabPage(activeTabId.value);

const navigate = async (url: string) => {
  if (!activeTabId.value || !window.electronAPI) {
    window.location.href = url;
    return;
  }
  await window.electronAPI.navigate(activeTabId.value, url);
};
</script>

<template>
  <div class="browser-shell">
    <BrowserChrome
      ref="browserChrome"
      :state="browserState"
      @create-tab="createTab"
      @activate-tab="activateTab"
      @close-tab="closeTab"
      @navigate="navigate"
      @go-back="goBack"
      @go-forward="goForward"
      @reload="reload"
      @home="home"
    />
    <main class="browser-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" @navigate="navigate" />
      </router-view>
    </main>
  </div>
</template>

<style>
* { box-sizing: border-box; }
html,
body,
#app,
.browser-shell {
  width: 100%;
  height: 100%;
  margin: 0;
}
body {
  overflow: hidden;
  color: var(--text-primary);
  background: var(--bg-secondary);
  font-family: Inter, "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
}
button,
input { font: inherit; }
button:focus-visible,
input:focus-visible { outline: 2px solid #6d7df0; outline-offset: 2px; }
.browser-shell {
  display: grid;
  grid-template-rows: 112px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--chrome-border);
  background: var(--chrome-bg);
}
.browser-content {
  min-height: 0;
  overflow: auto;
  background: var(--bg-secondary);
}
</style>
