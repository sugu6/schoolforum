/**
 * WebSocket 连接适配器
 * 将 WebSocket 连接适配为 useRealtimeConnection 需要的接口
 *
 * @param {string} url - WebSocket 端点 URL
 * @param {Object} options - 配置选项
 * @param {Function} options.onOpen - 连接打开回调
 * @param {Function} options.onMessage - 消息接收回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.onClose - 连接关闭回调
 * @returns {Object} WebSocket 连接对象
 */
import log from '@/utils/logger'

export function createWebSocketConnection(url, options = {}) {
  const { onOpen, onMessage, onError, onClose } = options

  const ws = new WebSocket(url)

  ws.onopen = () => {
    if (onOpen) {
      onOpen()
    }
  }

  ws.onmessage = (event) => {
    if (onMessage) {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        log.error('解析 WebSocket 消息失败:', error)
        if (onError) {
          onError(error)
        }
      }
    }
  }

  ws.onerror = (error) => {
    if (onError) {
      onError(error)
    }
  }

  ws.onclose = (event) => {
    // 1008 = Policy Violation（通常是认证失败），4000+ = 自定义认证错误码
    if (event.code === 1008 || event.code >= 4000) {
      log.warn('WebSocket 认证失败，可能需要重新登录')
    }
    if (onClose) {
      onClose(event)
    }
  }

  return {
    close: () => ws.close(),
    send: (data) => ws.send(JSON.stringify(data)),
  }
}
