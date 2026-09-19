<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import BrowserChrome from './components/BrowserChrome.vue';
import Login from './views/Login.vue';
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
  if (!window.electronAPI) {
    browserState.value = {
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
    return;
  }
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
      <Login @navigate="navigate" />
    </main>
  </div>
</template>
