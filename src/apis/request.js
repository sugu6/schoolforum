import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import VueHook from 'alova/vue'
import log from '@/utils/logger'
import { getAPIBaseURL } from '@/config/server'
import { Message } from '@arco-design/web-vue'

let handling401 = false
let hasNotified = false

function clearUserAndRedirect() {
  handling401 = true
  hasNotified = true
  Message.warning('登录已过期，请重新登录')
  import('@/stores/user').then(({ useUserStore }) => {
    const userStore = useUserStore()
    userStore.clearUser()
    return import('@/router')
  }).then(({ default: router }) => {
    router.push('/auth?mode=login')
  }).catch(() => {
    handling401 = false
    hasNotified = false
  }).finally(() => {
    handling401 = false
    hasNotified = false
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
      // 安全网：后端返回 HTTP 200 但业务码 401 时也触发退出
      if (json.code === 401 && !handling401) {
        clearUserAndRedirect()
      }
      return json
    },
    onError: (error, method) => {
      log.error(`[API ${method?.type} ✗] ${method?.url}`, error)
      if (error.response) {
        switch (error.response.status) {
          case 401: {
            if (!handling401) {
              clearUserAndRedirect()
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
