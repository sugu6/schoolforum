const isDev = import.meta.env.DEV

// 检测是否从后端域名访问（Nginx 代理模式），此时所有请求走同域
const isSameOrigin = !isDev && window.location.host !== 'suguny.github.io'

const serverURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8085'

// 生产环境兜底：如果在 GitHub Pages 等静态托管上运行且 VITE_SERVER_URL 未注入，使用硬编码的后端地址
const resolvedServerURL = isDev
  ? serverURL
  : (import.meta.env.VITE_SERVER_URL || 'https://schoolforum.sugu6.top')

export const serverConfig = {
  baseURL: resolvedServerURL,
  apiPrefix: '/api',
  avatarPrefix: '/avatars',
}

export const getServerURL = () => {
  if (isDev || isSameOrigin) {
    return ''
  }
  return serverConfig.baseURL
}

export const getAPIBaseURL = () => {
  if (isDev || isSameOrigin) {
    return '/api'
  }
  return `${serverConfig.baseURL}/api`
}

export const getWebSocketURL = (path) => {
  if (isDev || isSameOrigin) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${path}`
  }
  // 跨域时（如 GitHub Pages）使用后端 WebSocket 地址
  const wsBase = serverConfig.baseURL.replace(/^http/, 'ws')
  return `${wsBase}${path}`
}

export const getSSEURL = (path) => {
  if (isDev || isSameOrigin) {
    return path
  }
  return `${serverConfig.baseURL}${path}`
}

export const getImageURL = (path) => {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const baseURL = getServerURL()

  if (path.startsWith('/')) {
    return `${baseURL}${path}`
  }

  return `${baseURL}/${path}`
}

export const getAvatarURL = (avatar) => {
  if (!avatar) return ''

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }

  const baseURL = getServerURL()

  if (avatar.startsWith('/')) {
    return `${baseURL}${avatar}`
  }

  return `${baseURL}${serverConfig.avatarPrefix}/${avatar}`
}
