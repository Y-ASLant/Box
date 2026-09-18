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
      <div class="hero-mark">B</div>
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
  padding: clamp(56px, 10vh, 110px) 28px 72px;
  overflow: hidden;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 20% 0%, rgba(99, 118, 241, 0.12), transparent 34%),
    radial-gradient(circle at 80% 20%, rgba(53, 174, 210, 0.10), transparent 30%),
    var(--bg-secondary);
}
.new-tab-page.has-background { background-image: var(--new-tab-image); background-size: cover; background-position: center; }
.new-tab-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg-secondary) 84%, transparent);
  backdrop-filter: blur(14px) saturate(110%);
}
.new-tab-content { position: relative; width: min(760px, 100%); margin: 0 auto; text-align: center; }
.hero-mark {
  display: grid;
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  place-items: center;
  border-radius: 20px;
  color: #fff;
  background: linear-gradient(145deg, #3478f6, #6558ef);
  box-shadow: 0 18px 42px rgba(69, 91, 220, 0.28);
  font-size: 28px;
  font-weight: 780;
}
h1 { margin: 0; font-size: clamp(30px, 4vw, 42px); letter-spacing: -0.045em; }
.hero-copy { margin: 12px 0 30px; color: var(--text-secondary); font-size: 15px; }
.launch-form {
  display: flex;
  align-items: center;
  height: 58px;
  gap: 12px;
  padding: 7px 8px 7px 20px;
  border: 1px solid var(--chrome-border);
  border-radius: 18px;
  background: var(--bg-primary);
  box-shadow: 0 14px 40px var(--shadow-light);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.launch-form:focus-within { border-color: #7482ee; box-shadow: 0 16px 44px var(--shadow-light), 0 0 0 4px rgba(99, 115, 230, 0.12); }
.search-mark { flex: 0 0 18px; color: var(--text-tertiary); }
.launch-form input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--text-primary);
  background: transparent;
  font-size: 15px;
}
.launch-form input::placeholder { color: var(--chrome-placeholder); }
.launch-form button {
  height: 42px;
  padding: 0 22px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: #596bdc;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  transition: background 140ms ease, transform 100ms ease;
}
.launch-form button:hover:not(:disabled) { background: #4659cd; }
.launch-form button:active:not(:disabled) { transform: scale(0.97); }
.launch-form button:disabled { opacity: 0.4; cursor: default; }
.error-message { margin: 14px 0 0; color: var(--error-color); font-size: 13px; }
.recent-section { margin-top: 64px; text-align: left; }
.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-heading h2 { margin: 0; font-size: 14px; font-weight: 680; letter-spacing: 0.01em; }
.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  color: var(--text-tertiary);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}
.clear-button:hover { color: var(--error-color); }
.recent-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.recent-item {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 13px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, transform 100ms ease;
}
.recent-item:hover { border-color: var(--chrome-border); background: var(--bg-primary); transform: translateY(-1px); }
.recent-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  color: #5264d2;
  background: rgba(89, 107, 220, 0.12);
  font-weight: 750;
}
.recent-text { min-width: 0; display: grid; gap: 4px; }
.recent-text strong,
.recent-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-text strong { font-size: 13px; font-weight: 650; }
.recent-text small { color: var(--text-tertiary); font-size: 11px; }
@media (max-width: 700px) {
  .new-tab-page { padding-inline: 18px; }
  .recent-grid { grid-template-columns: 1fr; }
}
</style>
