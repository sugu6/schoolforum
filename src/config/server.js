const isDev = import.meta.env.DEV

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
  if (isDev) {
    return ''
  }
  return serverConfig.baseURL
}

export const getAPIBaseURL = () => {
  if (isDev) {
    return '/api'
  }
  return serverConfig.baseURL
}

export const getWebSocketURL = (path) => {
  if (isDev) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${path}`
  }
  const wsURL = serverConfig.baseURL.replace(/^http/, 'ws')
  return `${wsURL}${path}`
}

export const getSSEURL = (path) => {
  if (isDev) {
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
