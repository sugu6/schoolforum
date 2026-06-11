import { ref, onScopeDispose, getCurrentScope } from 'vue'
import log from '@/utils/logger'

/**
 * 实时连接管理 Composable
 * 提供统一的连接管理接口，支持 SSE 和 WebSocket
 *
 * @param {Object} options - 配置选项
 * @param {Function} options.createConnection - 创建连接的函数，接收 (callbacks, helpers)
 *   callbacks: { onOpen, onMessage, onError, onClose }
 *   helpers: { reconnect } - 可直接调用 reconnect 而无需临时变量
 * @param {Function} options.onMessage - 消息处理回调
 * @param {Function} options.onError - 错误处理回调
 * @param {number} options.reconnectDelay - 重连延迟（毫秒），默认 5000
 * @param {number} options.maxReconnectAttempts - 最大重连次数，默认无限
 * @returns {Object} 连接管理对象
 */
export function useRealtimeConnection(options = {}) {
  const {
    createConnection,
    onMessage,
    onError,
    shouldReconnect = () => true,
    reconnectDelay = 5000,
    maxReconnectAttempts = Infinity,
    onReconnectExhausted = null,
  } = options

  const connection = ref(null)
  const isConnected = ref(false)
  let reconnectTimer = null
  let isDisconnecting = false
  const reconnectAttempts = ref(0)

  /**
   * 建立连接
   */
  const connect = () => {
    if (connection.value && isConnected.value) {
      return
    }

    isDisconnecting = false

    try {
      connection.value = createConnection(
        {
          onOpen: () => {
            // 防护：disconnect() 后 onOpen 仍可能触发，此时忽略
            if (!connection.value) return
            isConnected.value = true
            reconnectAttempts.value = 0
            clearReconnectTimer()
          },
          onMessage: (data) => {
            if (!connection.value) return
            if (onMessage) {
              onMessage(data)
            }
          },
          onError: (error) => {
            isConnected.value = false
            if (connection.value && typeof connection.value.close === 'function') {
              connection.value.close()
            }
            connection.value = null
            if (onError) {
              onError(error)
            }
            if (!isDisconnecting) {
              scheduleReconnect()
            }
          },
          onClose: (event) => {
            isConnected.value = false
            connection.value = null
            if (!isDisconnecting && shouldReconnect(event)) {
              scheduleReconnect()
            }
          },
        },
        { reconnect },
      )
    } catch (error) {
      isConnected.value = false
      if (onError) {
        onError(error)
      }
      if (!isDisconnecting) {
        scheduleReconnect()
      }
    }
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    isDisconnecting = true
    clearReconnectTimer()
    reconnectAttempts.value = 0

    if (connection.value) {
      if (typeof connection.value.close === 'function') {
        connection.value.close()
      }
      connection.value = null
    }

    isConnected.value = false
  }

  /**
   * 重新连接
   */
  const reconnect = () => {
    disconnect()
    connect()
  }

  /**
   * 安排重连
   */
  const scheduleReconnect = () => {
    if (reconnectTimer) {
      return
    }

    if (reconnectAttempts.value >= maxReconnectAttempts) {
      log.warn(`已达到最大重连次数 (${maxReconnectAttempts})，停止重连`)
      if (onReconnectExhausted) {
        onReconnectExhausted()
      }
      return
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      reconnectAttempts.value++
      connect()
    }, reconnectDelay)
  }

  /**
   * 清除重连定时器
   */
  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // 在活跃的 effect scope 中自动清理连接
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disconnect()
    })
  }

  return {
    connection,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
  }
}
