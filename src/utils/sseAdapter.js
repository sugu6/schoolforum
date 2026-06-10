/**
 * SSE 连接适配器
 * 将 SSE 连接适配为 useRealtimeConnection 需要的接口
 *
 * @param {string} url - SSE 端点 URL
 * @param {Object} options - 配置选项
 * @param {Object} options.headers - 请求头
 * @param {Function} options.onOpen - 连接打开回调
 * @param {Function} options.onMessage - 消息接收回调
 * @param {Function} options.onError - 错误回调
 * @param {Function} options.onClose - 连接关闭回调
 * @returns {Object} SSE 连接对象
 */
export function createSSEConnection(url, options = {}) {
  const { headers = {}, onOpen, onMessage, onError, onClose } = options

  const controller = new AbortController()
  const { signal } = controller

  const connection = {
    close: () => controller.abort(),
  }

  fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...headers,
    },
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (onOpen) {
        onOpen()
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''
      let currentData = ''

      const dispatchMessage = () => {
        if (currentData && onMessage) {
          try {
            onMessage(JSON.parse(currentData))
          } catch (e) {
            onMessage(currentData)
          }
        }
        currentEvent = ''
        currentData = ''
      }

      const processLine = (line) => {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          currentData = line.slice(5).trim()
        } else if (line === '') {
          dispatchMessage()
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          lines.forEach(processLine)
        }

        if (buffer) {
          processLine(buffer)
        }
        dispatchMessage()
      } catch (error) {
        if (error.name !== 'AbortError') {
          if (onError) {
            onError(error)
          }
        }
      }

      if (onClose) {
        onClose()
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        if (onError) {
          onError(error)
        }
      }
      if (onClose) {
        onClose()
      }
    })

  return connection
}
