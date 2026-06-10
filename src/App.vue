<script setup>
import { useUserStore } from './stores/user'
import { setupExpiryTimer } from './apis/request'

const userStore = useUserStore()

onMounted(async () => {
  if (userStore.token && !userStore.userInfo) {
    await userStore.fetchUserInfo()
  }
  // 页面加载时启动 token 过期定时器
  if (userStore.token) {
    setupExpiryTimer()
  }
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
