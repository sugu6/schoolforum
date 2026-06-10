const isDev = import.meta.env.DEV

const serverURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8085'

// 生产环境：前端部署在服务器上，始终同域
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
  // 生产环境始终同域
  return ''
}

export const getAPIBaseURL = () => {
  if (isDev) {
    return '/api'
  }
  // 生产环境始终同域
  return '/api'
}

export const getWebSocketURL = (path) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}

export const getSSEURL = (path) => {
  if (isDev) {
    return path
  }
  return path
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
