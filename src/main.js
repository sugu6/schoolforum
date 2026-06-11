import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ArcoVue from '@arco-design/web-vue'
import App from './App.vue'
import '@arco-design/web-vue/dist/arco.css'
import './styles/animations.scss'
import router from './router'
import { useThemeStore } from './stores/theme'
import log from './utils/logger'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ArcoVue)

// 全局未捕获错误处理，防止白屏
app.config.errorHandler = (err, instance, info) => {
  log.error('Vue 全局错误:', err, info)
}

// 初始化主题
const themeStore = useThemeStore()

app.mount('#app')
