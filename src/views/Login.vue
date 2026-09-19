<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Search, Trash } from '@lucide/vue';
import { normalizeHttpUrl } from '../../shared/url.mts';

const emit = defineEmits<{ navigate: [url: string] }>();
const remoteUrl = ref('');
const errorMessage = ref('');
const recentUrls = ref<string[]>([]);
const backgroundImage = ref('');

const backgroundStyle = computed(() => backgroundImage.value
  ? { '--new-tab-image': `url("${backgroundImage.value}")` }
  : {});

onMounted(async () => {
  const savedUrls = localStorage.getItem('recentUrls');
  if (savedUrls) {
    try {
      const parsedUrls: unknown = JSON.parse(savedUrls);
      if (Array.isArray(parsedUrls) && parsedUrls.every(url => typeof url === 'string')) {
        recentUrls.value = parsedUrls.slice(0, 6);
      }
    } catch {
      localStorage.removeItem('recentUrls');
    }
  }

  if (window.electronAPI) {
    backgroundImage.value = await window.electronAPI.getBackgroundPath() ?? '';
  }
});

const saveUrl = (url: string) => {
  recentUrls.value = [url, ...recentUrls.value.filter(item => item !== url)].slice(0, 6);
  localStorage.setItem('recentUrls', JSON.stringify(recentUrls.value));
};

const openUrl = (value = remoteUrl.value) => {
  const input = value.trim();
  if (!input) {
    errorMessage.value = '请输入网址、IP 地址或域名';
    return;
  }
  try {
    const url = normalizeHttpUrl(input);
    errorMessage.value = '';
    saveUrl(url);
    emit('navigate', url);
  } catch {
    errorMessage.value = '仅支持有效的 HTTP 或 HTTPS 地址';
  }
};

const clearHistory = async () => {
  try {
    if (window.electronAPI && !await window.electronAPI.clearHistoryAndCache()) {
      throw new Error('主进程未能清除浏览数据');
    }
    recentUrls.value = [];
    localStorage.removeItem('recentUrls');
  } catch (error) {
    errorMessage.value = `清除失败：${error instanceof Error ? error.message : String(error)}`;
  }
};

const displayHost = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const hostInitial = (url: string) => displayHost(url).charAt(0).toUpperCase() || 'W';
</script>

<template>
  <section class="new-tab-page" :class="{ 'has-background': backgroundImage }" :style="backgroundStyle">
    <div class="new-tab-backdrop"></div>
    <div class="new-tab-content">
      <h1>从这里开始</h1>
      <p class="hero-copy">打开 Web 应用、内网地址或设备管理页面</p>

      <form class="launch-form" @submit.prevent="openUrl()">
        <Search class="search-mark" :size="18" :stroke-width="1.8" aria-hidden="true" />
        <input
          v-model="remoteUrl"
          type="text"
          autocomplete="off"
          spellcheck="false"
          autofocus
          placeholder="输入网址或 IP 地址"
          aria-label="输入网址或 IP 地址"
        />
        <button type="submit" :disabled="!remoteUrl.trim()">打开</button>
      </form>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <div v-if="recentUrls.length" class="recent-section">
        <div class="section-heading">
          <h2>最近访问</h2>
          <button class="clear-button" type="button" @click="clearHistory">
            <Trash :size="14" :stroke-width="1.8" aria-hidden="true" />
            清除记录
          </button>
        </div>
        <div class="recent-grid">
          <button v-for="url in recentUrls" :key="url" class="recent-item" type="button" @click="openUrl(url)">
            <span class="recent-icon">{{ hostInitial(url) }}</span>
            <span class="recent-text">
              <strong>{{ displayHost(url) }}</strong>
              <small>{{ url }}</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.new-tab-page {
  --new-tab-image: none;
  position: relative;
  min-height: 100%;
  padding: clamp(9rem, 21vh, 12rem) var(--space-8) var(--space-16);
  overflow: hidden;
  color: var(--color-text-primary);
  background:
    radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 34%),
    radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-success) 10%, transparent), transparent 30%),
    var(--color-canvas);
}
.new-tab-page.has-background { background-image: var(--new-tab-image); background-size: cover; background-position: center; }
.new-tab-backdrop {
  position: absolute;
  inset: 0;
  background: var(--color-backdrop);
  backdrop-filter: blur(14px) saturate(110%);
}
.new-tab-content { position: relative; width: min(760px, 100%); margin: 0 auto; text-align: center; }
h1 {
  margin: 0;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.045em;
}
.hero-copy {
  margin: var(--space-3) 0 var(--space-8);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}
.launch-form {
  display: flex;
  align-items: center;
  height: 58px;
  gap: var(--space-3);
  padding: 0.4375rem var(--space-2) 0.4375rem var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  transition:
    border-color var(--duration-normal) var(--ease-standard),
    box-shadow var(--duration-normal) var(--ease-standard);
}
.launch-form:focus-within { border-color: var(--color-accent); box-shadow: var(--shadow-md), var(--shadow-focus); }
.search-mark { flex: 0 0 18px; color: var(--color-text-muted); }
.launch-form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--color-text-primary);
  background: transparent;
  font-size: var(--font-size-lg);
}
.launch-form input::placeholder { color: var(--color-text-placeholder); }
.launch-form button {
  height: 42px;
  padding: 0 var(--space-6);
  border: 0;
  border-radius: var(--radius-lg);
  color: var(--color-on-accent);
  background: var(--color-accent);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    background var(--duration-normal) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.launch-form button:hover:not(:disabled) { background: var(--color-accent-hover); }
.launch-form button:active:not(:disabled) { transform: scale(0.97); }
.launch-form button:disabled { opacity: 0.4; cursor: default; }
.error-message { margin: var(--space-4) 0 0; color: var(--color-danger); font-size: var(--font-size-sm); }
.recent-section { margin-top: var(--space-16); text-align: left; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.section-heading h2 { margin: 0; font-size: var(--font-size-md); font-weight: var(--font-weight-bold); letter-spacing: 0.01em; }
.clear-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 0;
  color: var(--color-text-muted);
  background: transparent;
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.clear-button:hover { color: var(--color-danger); }
.recent-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.recent-item {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  background: var(--color-surface-raised);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-normal) var(--ease-standard),
    background var(--duration-normal) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.recent-item:hover { border-color: var(--color-border); background: var(--color-surface); transform: translateY(-1px); }
.recent-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--color-accent);
  background: var(--color-accent-soft);
  font-weight: var(--font-weight-bold);
}
.recent-text { min-width: 0; display: grid; gap: var(--space-1); }
.recent-text strong,
.recent-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-text strong { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
.recent-text small { color: var(--color-text-muted); font-size: var(--font-size-2xs); }
@media (max-width: 700px) {
  .new-tab-page { padding-inline: var(--space-5); }
  .recent-grid { grid-template-columns: 1fr; }
}
</style>
