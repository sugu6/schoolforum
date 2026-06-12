import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import VueHook from 'alova/vue'
import log from '@/utils/logger'
import { getAPIBaseURL } from '@/config/server'
import { Message } from '@arco-design/web-vue'

let handling401 = false
let expiryTimer = null

/**
 * 是否正在处理 token 过期（供 logout 等场景避免重复提示）
 */
export function isTokenExpiring() {
  return handling401
}

// 单例锁 + 请求队列：防止并发 401 时重复刷新
let isRefreshing = false
let failedQueue = []
let refreshRetryCount = 0
const MAX_REFRESH_RETRIES = 2

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

/**
 * 统一的 token 过期处理：提示 + 清除用户 + 跳转登录
 * 仅在 refresh token 也过期时触发
 */
export function handleTokenExpired() {
  if (handling401) return
  handling401 = true
  clearExpiryTimer()
  isRefreshing = false
  failedQueue = []
  Message.warning('登录已过期，请重新登录')
  import('@/stores/user').then(({ useUserStore }) => {
    const userStore = useUserStore()
    userStore.clearUser()
  }).catch(() => {
    // 清除用户状态失败时忽略
  }).finally(() => {
    setTimeout(() => {
      handling401 = false
    }, 3000)
  })
}

/**
 * 尝试用 refresh token 续期，失败则走退出逻辑
 * Token 通过 httpOnly Cookie 自动携带
 */
async function tryRefreshBeforeExpire() {
  try {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    const refreshed = await userStore.refreshAccessToken()
    if (refreshed) {
      setupExpiryTimer()
    } else {
      handleTokenExpired()
    }
  } catch {
    handleTokenExpired()
  }
}

/**
 * 401 统一处理：尝试 refresh，成功则重试原请求，失败则退出
 * 供 onSuccess 和 onError 共用
 */
async function handle401WithRefresh(method) {
  // 超过重试次数，直接退出
  if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
    handleTokenExpired()
    return { code: 401, data: null }
  }

  // refresh 接口本身 401，说明 refresh token 也过期了
  if (method?.url?.includes('/auth/refresh')) {
    handleTokenExpired()
    return
  }

  // 已在退出流程中，直接返回
  if (handling401) return

  // 已有刷新请求在飞行中，加入队列等待
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then(() => {
      // 刷新成功，重试原请求（Cookie 已自动更新）
      return alovaInstance.request(method)
    }).catch(() => {
      return { code: 401, data: null }
    })
  }

  // 首次 401：尝试刷新
  isRefreshing = true
  refreshRetryCount++

  try {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()
    const refreshed = await userStore.refreshAccessToken()

    if (refreshed) {
      // 刷新成功：重试队列 + 重启定时器 + 重试当前请求
      processQueue(null, true)
      setupExpiryTimer()
      refreshRetryCount = 0
      isRefreshing = false
      // Cookie 已通过 httpOnly 方式自动更新，直接重试
      return alovaInstance.request(method)
    } else {
      // 刷新失败：走退出逻辑
      processQueue(new Error('Refresh failed'))
      isRefreshing = false
      handleTokenExpired()
      return { code: 401, data: null }
    }
  } catch (refreshError) {
    processQueue(refreshError)
    isRefreshing = false
    handleTokenExpired()
    return { code: 401, data: null }
  }
}

/**
 * 设置 token 过期定时器，过期前 30s 自动续期
 * @param {number} [expiresAtOverride] 可选的过期时间戳，不传则从 localStorage 读取
 */
export function setupExpiryTimer(expiresAtOverride) {
  clearExpiryTimer()

  const expiresAt = expiresAtOverride || Number(localStorage.getItem('tokenExpiresAt')) || 0
  if (!expiresAt) return

  const now = Date.now()
  const remaining = expiresAt - now

  if (remaining <= 0) {
    // 已过期，尝试 refresh
    tryRefreshBeforeExpire()
    return
  }

  // 剩余不足 30 秒，立即续期
  if (remaining <= 30000) {
    tryRefreshBeforeExpire()
    return
  }

  // 提前 30 秒续期
  const notifyAt = remaining - 30000
  log.info(`Token 将在 ${Math.round(remaining / 1000)}s 后过期，${Math.round(notifyAt / 1000)}s 后自动续期`)

  expiryTimer = setTimeout(() => {
    tryRefreshBeforeExpire()
  }, notifyAt)
}

/**
 * 清除过期定时器
 */
export function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}

const alovaInstance = createAlova({
  baseURL: getAPIBaseURL(),
  statesHook: VueHook,
  requestAdapter: adapterFetch(),
  timeout: 10000,
  cacheLogger: false,
  cacheFor: null,
  beforeRequest(method) {
    // 确保所有请求都携带 httpOnly Cookie（Sa-Token 认证依赖 Cookie）
    // adapterFetch() 默认不设置 credentials，需要显式指定
    method.config.credentials = 'include'
  },
  responded: {
    onSuccess: async (response, method) => {
      // alova onSuccess 在 HTTP 请求完成时触发（包括 4xx/5xx）
      if (!response.ok) {
        const status = response.status
        log.error(`[API ${method.type} ✗] ${method.url} HTTP ${status}`)
        if (status === 401 && !handling401) {
          return handle401WithRefresh(method)
        }
        throw new Error(`请求失败: HTTP ${status}`)
      }
      const json = await response.json()
      log.info(`[API ${method.type} ✓] ${method.url}`, json)
      // 业务码 401：也尝试 refresh，失败才退出
      if (json.code === 401 && !handling401) {
        return handle401WithRefresh(method)
      }
      return json
    },
    onError: async (error, method) => {
      log.error(`[API ${method?.type} ✗] ${method?.url}`, error)
      if (error.response?.status === 401) {
        return handle401WithRefresh(method)
      }
      // 统一网络错误提示
      const status = error.response?.status
      let userMessage = '网络连接失败，请检查网络'
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        userMessage = '请求超时，请稍后重试'
      } else if (status >= 500) {
        userMessage = '服务器异常，请稍后重试'
      } else if (status === 403) {
        userMessage = '没有操作权限'
      } else if (status === 404) {
        userMessage = '请求的资源不存在'
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        userMessage = '网络连接失败，请检查网络'
      }
      if (!handling401) {
        Message.error(userMessage)
      }
      throw error
    },
  },
})

export default alovaInstance
