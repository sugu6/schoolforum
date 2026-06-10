import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import VueHook from 'alova/vue'
import log from '@/utils/logger'
import { getAPIBaseURL } from '@/config/server'

let handling401 = false

const REASON_MAP = {
  '登录已过期': 'TOKEN_TIMEOUT',
  '登录凭证无效': 'INVALID_TOKEN',
  '其他设备登录': 'BE_REPLACED',
  '踢下线': 'KICK_OUT',
  '已被冻结': 'TOKEN_FREEZE',
}

const handle401 = (message) => {
  if (handling401) return
  handling401 = true
  let reason = 'expired'
  if (message) {
    for (const [key, value] of Object.entries(REASON_MAP)) {
      if (message.includes(key)) {
        reason = value
        break
      }
    }
  }
  import('@/stores/user').then(({ useUserStore }) => {
    const userStore = useUserStore()
    userStore.clearUser()
    return import('@/router')
  }).then(({ default: router }) => {
    router.push({ path: '/auth', query: { mode: 'login', reason } })
  }).catch(() => {
    handling401 = false
  }).finally(() => {
    handling401 = false
  })
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
      if (json.code === 401) {
        handle401(json.message)
      }
      return json
    },
    onError: (error, method) => {
      log.error(`[API ${method?.type} ✗] ${method?.url}`, error)
      if (error.response?.status === 401) {
        handle401()
      }
      throw error
    },
  },
})

export default alovaInstance
