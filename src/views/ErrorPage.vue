<template>
  <div class="error-page">
    <div class="error-content">
      <p>{{ message || '访问错误，网络连接错误或访问服务器不在线' }}</p>
      <button @click="handleAction">{{ isSubWindow ? '关闭窗口' : '返回主页' }}</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import type { ErrorPageProps } from '../../shared/types';

const props = defineProps<ErrorPageProps>();

const router = useRouter();

const handleAction = () => {
  if (props.isSubWindow) {
    // 如果是子窗口，直接关闭
    window.close();
  } else {
    // 如果是主窗口，返回主页
    router.push('/');
  }
};
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.error-content {
  padding: 40px;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

p {
  font-size: 18px;
  color: #333;
  margin: 0 0 25px 0;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}
</style>