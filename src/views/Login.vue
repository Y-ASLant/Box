<template>
  <div class="login-container" :style="backgroundStyle">
    <div class="login-box">
      <h1>登录</h1>
      <div class="input-group">
        <label for="remote-url">输入IP地址或域名</label>
        <input 
          id="remote-url" 
          v-model="remoteUrl" 
          type="text" 
          placeholder="例如: 192.168.1.1 或 example.com"
          @keyup.enter="connectToRemote"
        />
      </div>
      <button @click="connectToRemote" :disabled="!isValidUrl">连接</button>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div v-if="recentUrls.length > 0" class="recent-urls">
        <h3 @click="clearHistory">
          最近连接
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="clear-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </h3>
        <ul>
          <li v-for="(url, index) in recentUrls" :key="index" @click="connectToSavedUrl(url)">
            <span>{{ url }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const remoteUrl = ref('');
const errorMessage = ref('');
const recentUrls = ref<string[]>([]);
const backgroundImage = ref('');

// 计算背景样式
const backgroundStyle = computed(() => {
  if (backgroundImage.value) {
    return {
      '--bg-image': `url("${backgroundImage.value}")`,
      backgroundImage: `url("${backgroundImage.value}")`
    };
  }
  return {};
});

// 加载最近的URL和背景图片
onMounted(async () => {
  const savedUrls = localStorage.getItem('recentUrls');
  if (savedUrls) {
    recentUrls.value = JSON.parse(savedUrls);
  }
  
  // 如果在Electron环境中，获取背景图片设置
  if (window.electronAPI) {
    try {
      const bgPath = await window.electronAPI.getBackgroundPath();
      if (bgPath) {
        // 直接使用后端返回的URL
        backgroundImage.value = bgPath;
      }
    } catch (error) {
      console.error('获取背景图片设置出错:', error);
    }
  }
});

// 保存URL到最近列表
const saveUrlToRecent = (url: string) => {
  // 如果URL已经在列表中，将其移到顶部
  const urlIndex = recentUrls.value.indexOf(url);
  if (urlIndex > -1) {
    recentUrls.value.splice(urlIndex, 1);
  }
  
  // 添加URL到列表顶部
  recentUrls.value.unshift(url);
  
  // 保持列表不超过3个项目
  if (recentUrls.value.length > 3) {
    recentUrls.value = recentUrls.value.slice(0, 3);
  }
  
  // 保存到本地存储
  localStorage.setItem('recentUrls', JSON.stringify(recentUrls.value));
};

// 简单验证输入的URL
const isValidUrl = computed(() => {
  return remoteUrl.value.trim() !== '';
});

// 使用保存的URL连接
const connectToSavedUrl = (url: string) => {
  remoteUrl.value = url;
  connectToRemote();
};

// 连接到远程URL
const connectToRemote = async () => {
  if (!isValidUrl.value) {
    errorMessage.value = '请输入有效的IP地址或域名';
    return;
  }

  const url = remoteUrl.value.trim();
  
  // 保存到最近访问的URL列表
  saveUrlToRecent(url);

  try {
    errorMessage.value = '';
    
    if (window.electronAPI) {
      // 使用Electron的API导航到URL
      const result = await window.electronAPI.navigateToUrl(url);
      if (!result) {
        const message = '连接失败，请检查URL是否正确或目标设备是否在线。';
        errorMessage.value = message;
        router.push({ name: 'ErrorPage', query: { message } });
      }
    } else {
      // 如果在浏览器环境中运行，直接使用window.location
      let fullUrl = url;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'http://' + fullUrl;
      }
      window.location.href = fullUrl;
    }
  } catch (error) {
    const err = error as Error;
    const message = `连接错误: ${err.message}`;
    errorMessage.value = message;
    console.error('连接错误:', err);
    router.push({ name: 'ErrorPage', query: { message } });
  }
};

// 清除历史记录和缓存
const clearHistory = async () => {
  // 不再进行二次确认，直接清除
  if (window.electronAPI) {
    await window.electronAPI.clearHistoryAndCache();
    // 主进程会处理页面重载，但我们也可以在这里清空以获得即时反馈
    recentUrls.value = [];
    localStorage.removeItem('recentUrls');
  } else {
    // 浏览器环境下的回退
    localStorage.removeItem('recentUrls');
    recentUrls.value = [];
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--bg-secondary);
  background-size: cover !important;
  background-position: center center !important;
  background-repeat: no-repeat !important;
  font-family: Arial, sans-serif;
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* 添加一个伪元素确保背景图片始终显示 */
.login-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image); /* 使用CSS变量 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.8; /* 稍微透明以确保登录框可见 */
  z-index: -1;
}

.login-box {
  background-color: var(--backdrop-blur);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 30px var(--shadow-medium);
  width: 400px;
  max-width: 90%;
  text-align: center;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 30px;
  font-size: 28px;
  transition: color 0.3s ease;
}

.input-group {
  margin-bottom: 24px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 16px;
  transition: color 0.3s ease;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.3s, background-color 0.3s ease, color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: var(--button-primary);
}

button {
  background-color: var(--button-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
}

button:hover {
  background-color: var(--button-primary-hover);
}

button:disabled {
  background-color: var(--button-disabled);
  cursor: not-allowed;
}

.error-message {
  color: var(--error-color);
  margin-top: 16px;
  font-size: 14px;
  transition: color 0.3s ease;
}

.recent-urls {
  margin-top: 30px;
  text-align: left;
  border-top: 1px solid var(--border-light);
  padding-top: 20px;
  transition: border-color 0.3s ease;
}

.recent-urls h3 {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: color 0.3s;
}

.recent-urls h3:hover {
  color: var(--error-color);
}

.recent-urls h3 .clear-icon {
  transition: stroke 0.3s;
  stroke: var(--text-tertiary);
}

.recent-urls h3:hover .clear-icon {
  stroke: var(--error-color);
}

.recent-urls ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.recent-urls li {
  background-color: var(--bg-tertiary);
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s, transform 0.2s, color 0.3s ease;
  font-size: 15px;
  color: var(--text-primary);
}

.recent-urls li:hover {
  background-color: var(--button-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px var(--shadow-light);
}
</style>