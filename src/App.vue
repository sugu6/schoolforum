<script setup>
import { onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { useUserStore } from './stores/user'
import { setupExpiryTimer, clearExpiryTimer, handleTokenExpired } from './apis/request'
import log from '@/utils/logger'

const userStore = useUserStore()

const handleVisibilityChange = async () => {
  if (document.visibilityState !== 'visible' || !userStore.isLoggedIn) return

  // 先验证 Cookie 是否仍有效（可能在其他标签页登出或服务端重启后已失效）
  const sessionValid = await userStore.validateSession()
  if (!sessionValid) {
    clearExpiryTimer()
    return
  }

  const expiresAt = userStore.tokenExpiresAt
  if (!expiresAt) {
    setupExpiryTimer(userStore.tokenExpiresAt)
    return
  }

  const remaining = expiresAt - Date.now()
  // 剩余不足 5 分钟或已过期，主动续期
  if (remaining <= 300000) {
    log.info('Token 即将过期，主动续期')
    const refreshed = await userStore.refreshAccessToken()
    if (refreshed) {
      setupExpiryTimer(userStore.tokenExpiresAt)
    } else {
      handleTokenExpired()
    }
    return
  }

  setupExpiryTimer(userStore.tokenExpiresAt)
}

onMounted(async () => {
  // 应用启动时验证 session：localStorage 有 userInfo 不代表 Cookie 仍有效
  if (userStore.isLoggedIn) {
    const sessionValid = await userStore.validateSession()
    if (sessionValid) {
      setupExpiryTimer(userStore.tokenExpiresAt)
    } else {
      clearExpiryTimer()
    }
  }
  // 监听页面可见性变化，用户返回标签页时重新检查 token
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearExpiryTimer()
})

// 全局错误处理：防止未捕获异常导致白屏
onErrorCaptured((err, instance, info) => {
  log.error('全局捕获到组件错误:', err, info)
  // 返回 false 阻止错误继续向上传播，避免整个应用白屏
  return false
})
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  background-color: var(--color-bg-1);
}
</style>
