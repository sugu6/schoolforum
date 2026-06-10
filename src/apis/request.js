import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import VueHook from 'alova/vue'
import log from '@/utils/logger'
import { getAPIBaseURL } from '@/config/server'
import { Message } from '@arco-design/web-vue'

let handling401 = false
let expiryTimer = null

/**
 * 统一的 token 过期处理：提示 + 清除用户 + 跳转登录
 */
export function handleTokenExpired() {
  if (handling401) return
  handling401 = true
  clearExpiryTimer()
  Message.warning('登录已过期，请重新登录')
  import('@/stores/user').then(({ useUserStore }) => {
    const userStore = useUserStore()
    userStore.clearUser()
    return import('@/router')
  }).then(({ default: router }) => {
    router.push('/auth?mode=login')
  }).catch(() => {
    handling401 = false
  }).finally(() => {
    handling401 = false
  })
}

/**
 * 解析 JWT payload 中的 exp 字段
 */
function getTokenExp(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const payload = JSON.parse(atob(base64))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * 设置 token 过期定时器，提前 30 秒提示
 */
export function setupExpiryTimer() {
  clearExpiryTimer()
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token) return

  const exp = getTokenExp(token)
  if (!exp) return

  const now = Date.now()
  const remaining = exp - now

  if (remaining <= 0) {
    // 已过期，立即处理
    handleTokenExpired()
    return
  }

  // 提前 30 秒提示（最少 5 秒后提示）
  const notifyAt = Math.max(remaining - 30000, 5000)
  log.info(`Token 将在 ${Math.round(remaining / 1000)}s 后过期，${Math.round(notifyAt / 1000)}s 后提示`)

  expiryTimer = setTimeout(() => {
    handleTokenExpired()
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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`
    }
  },
  responded: {
    onSuccess: async (response, method) => {
      const json = await response.json()
      log.info(`[API ${method.type} ✓] ${method.url}`, json)
      // 安全网：后端返回 HTTP 200 但业务码 401 时也触发退出
      if (json.code === 401 && !handling401) {
        handleTokenExpired()
      }
      return json
    },
    onError: (error, method) => {
      log.error(`[API ${method?.type} ✗] ${method?.url}`, error)
      if (error.response) {
        switch (error.response.status) {
          case 401: {
            if (!handling401) {
              handleTokenExpired()
            }
            break
          }
        }
      }
      // 非首次 401 时不 throw，避免控制台报错
      if (handling401 && error.response?.status === 401) {
        return { code: 401, data: null }
      }
      throw error
    },
  },
})

export default alovaInstance
