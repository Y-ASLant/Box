import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 添加自动滚动容器指令
app.directive('scroll-container', {
  mounted(el) {
    el.classList.add('scroll-container')
  }
})

app.use(router).mount('#app')
