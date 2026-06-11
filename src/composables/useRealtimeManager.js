import { ref, watch, onScopeDispose, getCurrentScope } from 'vue'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { useNotificationStore } from '@/stores/notification'
import log from '@/utils/logger'

/**
 * 实时连接管理器
 * 统一管理 WebSocket 和 SSE 连接的生命周期
 * 根据登录状态自动连接/断开所有实时通道
 */
export function useRealtimeManager() {
  const userStore = useUserStore()
  const messageStore = useMessageStore()
  const notificationStore = useNotificationStore()

  const isInitialized = ref(false)

  const connectAll = async () => {
    if (userStore.isLoggedIn) {
      const sessionValid = await userStore.validateSession()
      if (!sessionValid) return
    }
    notificationStore.fetchUnreadCount()
    notificationStore.connectSSE()
    messageStore.fetchUnreadCount()
    messageStore.connectWebSocket()
    log.debug('实时连接已建立')
  }

  const disconnectAll = () => {
    notificationStore.disconnectSSE()
    messageStore.disconnectWebSocket()
    messageStore.clearUnread()
    log.debug('实时连接已断开')
  }

  const init = () => {
    if (isInitialized.value) return
    isInitialized.value = true

    // 监听登录状态变化
    watch(
      () => userStore.isLoggedIn,
      async (isLoggedIn) => {
        if (isLoggedIn) {
          await connectAll()
        } else {
          disconnectAll()
        }
      },
      { immediate: true },
    )
  }

  const destroy = () => {
    disconnectAll()
    isInitialized.value = false
  }

  // 在活跃的 effect scope 中自动清理
  if (getCurrentScope()) {
    onScopeDispose(() => {
      destroy()
    })
  }

  return {
    isInitialized,
    init,
    destroy,
  }
}
