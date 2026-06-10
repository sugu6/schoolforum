import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUnreadMessageCount } from '@/apis/messages'
import { useRealtimeConnection } from '@/composables/useRealtimeConnection'
import { createWebSocketConnection } from '@/utils/websocketAdapter'
import { getWebSocketURL, getAvatarURL } from '@/config/server'
import log from '@/utils/logger'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)
  const messageHandlers = ref([])
  const suppressServerUnreadUntil = ref(0)

  const hasUnread = computed(() => unreadCount.value > 0)

  const showNewMessageNotification = (message) => {
    const senderName = message.sender?.username || message.senderName || '用户'
    const content = message.content || '发来一条新消息'

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${senderName} 发来私信`, {
        body: content,
        icon: getAvatarURL(message.sender?.avatarUrl) || '/favicon.ico',
      })
    }
  }

  const handleWSMessage = (data) => {
    let message = null
    if (data.type === 'private_message') {
      message = data.data
    } else if (data.type === 'NEW_PRIVATE_MESSAGE') {
      message = data.message || data.data
    } else if (data.content || data.senderId) {
      message = data
    }

    if (message) {
      let handled = false
      for (const handler of messageHandlers.value) {
        if (handler(message)) {
          handled = true
          break
        }
      }

      if (!handled) {
        const isRead =
          message.isRead === true || message.isRead === 'true' || message.isRead === 'READ'
        if (!isRead) {
          incrementUnread(1)
          showNewMessageNotification(message)
        }
      }
    } else if (data.type === 'UNREAD_MESSAGE_COUNT' || data.type === 'unread_count_update') {
      if (Date.now() < suppressServerUnreadUntil.value) {
        // 跳过：刚在私信页标记已读，后端推送的旧值可能还未更新
      } else {
        if (data.type === 'unread_count_update') {
          unreadCount.value = data.data?.unreadCount ?? 0
        } else {
          unreadCount.value = data.count ?? data.data ?? 0
        }
      }
    } else if (data.type === 'MESSAGE_READ') {
      const readCount = data.count ?? data.data ?? 1
      decrementUnread(readCount)
    }
  }

  const {
    isConnected: wsConnected,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useRealtimeConnection({
    createConnection: (callbacks) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!token) {
        throw new Error('No token available')
      }

      // 使用 /api/realtime 路径，避免广告拦截器拦截 /ws/ 路径
      // URL 不携带 token，连接后通过 auth 消息发送
      const wsUrl = getWebSocketURL('/api/realtime')
      let authed = false

      return createWebSocketConnection(wsUrl, {
        onOpen: callbacks?.onOpen,
        onMessage: (data) => {
          // 处理认证响应
          if (data.type === 'auth_success') {
            authed = true
            log.debug('WebSocket 认证成功')
            return
          }
          if (data.type === 'auth_error' || data.type === 'auth_required' || data.type === 'auth_timeout') {
            log.warn('WebSocket 认证失败:', data.data?.message)
            // Token 过期，主动提示并跳转登录
            import('@/apis/request').then(({ handleTokenExpired }) => {
              handleTokenExpired()
            })
            return
          }
          // 认证成功后才处理业务消息
          if (authed && callbacks?.onMessage) {
            callbacks.onMessage(data)
          }
        },
        onError: (error) => {
          log.error('WebSocket 连接错误:', error)
          if (callbacks?.onError) {
            callbacks.onError(error)
          }
        },
        onClose: callbacks?.onClose,
        // 连接建立后立即发送 auth 消息
        onConnected: (send) => {
          send({ type: 'auth', token })
        },
      })
    },
    onMessage: handleWSMessage,
    shouldReconnect: (event) => {
      // 认证失败时停止重连
      if (event?.code === 1008 || event?.code === 4001) {
        log.warn('WebSocket 认证失败，停止重连')
        return false
      }
      return true
    },
    onError: (error) => {
      if (error?.message === 'WS_AUTH_FAILED') return
      log.error('WebSocket 连接错误:', error)
    },
    reconnectDelay: 5000,
  })

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadMessageCount()
      if (res.code === 200) {
        unreadCount.value = res.data?.unreadCount || 0
      }
    } catch (error) {
      log.error('获取私信未读数失败:', error)
    }
  }

  const incrementUnread = (count = 1) => {
    unreadCount.value += count
  }

  const decrementUnread = (count = 1) => {
    unreadCount.value = Math.max(0, unreadCount.value - count)
  }

  const clearUnread = () => {
    unreadCount.value = 0
  }

  const suppressServerUnread = (duration = 3000) => {
    suppressServerUnreadUntil.value = Date.now() + duration
  }

  const addMessageHandler = (handler) => {
    messageHandlers.value.push(handler)
  }

  const removeMessageHandler = (handler) => {
    const index = messageHandlers.value.indexOf(handler)
    if (index > -1) {
      messageHandlers.value.splice(index, 1)
    }
  }

  return {
    unreadCount,
    hasUnread,
    wsConnected,
    fetchUnreadCount,
    incrementUnread,
    decrementUnread,
    clearUnread,
    suppressServerUnread,
    addMessageHandler,
    removeMessageHandler,
    connectWebSocket,
    disconnectWebSocket,
  }
})
