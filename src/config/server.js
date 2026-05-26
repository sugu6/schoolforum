const isDev = import.meta.env.DEV

const serverURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8085'

export const serverConfig = {
  baseURL: serverURL,
  apiPrefix: '/api',
  avatarPrefix: '/avatars',
}

export const getServerURL = () => {
  if (isDev) {
    return ''
  }
  // 生产环境兜底：如果 VITE_SERVER_URL 未设置，使用默认生产后端地址
  // 避免图片等静态资源被浏览器解析为当前域名下的相对路径导致 404
  if (!serverConfig.baseURL || serverConfig.baseURL === 'http://localhost:8085') {
    return 'https://schoolforum.sugu6.top:8443'
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
