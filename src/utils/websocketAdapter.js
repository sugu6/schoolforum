import log from '@/utils/logger'

/**
 * WebSocket 连接适配器
 * 封装原生 WebSocket，内置认证流程
 *
 * @param {string} url - WebSocket 端点 URL
 * @param {Object} options - 配置选项
 * @param {string} options.authToken - 认证 token，提供后自动处理认证流程
 * @param {Function} options.onOpen - 认证成功后回调
 * @param {Function} options.onMessage - 业务消息回调（仅认证成功后触发）
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.onClose - 连接关闭回调
 * @param {Function} options.onAuthFailure - 认证失败回调 (reason: string) => void
 * @returns {Object} WebSocket 连接对象
 */
export function createWebSocketConnection(url, options = {}) {
  const { authToken, onOpen, onMessage, onError, onClose, onAuthFailure } = options

  log.debug('WebSocket 连接中:', url)
  const ws = new WebSocket(url)

  // 无 token 时跳过认证，直接标记已认证
  let authed = !authToken

  ws.onopen = () => {
    if (authToken) {
      log.debug('WebSocket 连接建立，发送认证消息')
      ws.send(JSON.stringify({ type: 'auth', token: authToken }))
    } else {
      log.debug('WebSocket 连接成功（无认证）')
      onOpen?.()
    }
  }

  ws.onmessage = (event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch (error) {
      log.error('解析 WebSocket 消息失败:', error)
      onError?.(error)
      return
    }

    // 未认证状态下处理认证响应
    if (!authed) {
      if (data.type === 'auth_success') {
        authed = true
        log.debug('WebSocket 认证成功')
        onOpen?.()
        return
      }

      if (data.type === 'auth_error' || data.type === 'auth_required' || data.type === 'auth_timeout') {
        const reason = data.data?.message || data.type
        log.warn('WebSocket 认证失败:', reason)
        onAuthFailure?.(reason)
        ws.close(4001, 'Auth failed')
        return
      }

      // 认证完成前忽略其他消息
      return
    }

    // 认证成功后处理业务消息
    onMessage?.(data)
  }

  ws.onerror = (error) => {
    log.error('WebSocket 连接错误, readyState:', ws.readyState)
    onError?.(error)
  }

  ws.onclose = (event) => {
    log.warn('WebSocket 关闭: code=', event.code, 'reason=', event.reason || '无')
    if (event.code === 1008 || event.code >= 4000) {
      log.warn('WebSocket 认证失败，可能需要重新登录')
    }
    onClose?.(event)
  }

  return {
    close: () => {
      // 仅在 OPEN 或 CONNECTING 状态下才调用 close，避免浏览器报错
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    },
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    },
  }
}
