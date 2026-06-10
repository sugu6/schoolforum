import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import VueHook from 'alova/vue'
import log from '@/utils/logger'
import { getAPIBaseURL } from '@/config/server'

let handling401 = false

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
        handling401 = true
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
      return json
    },
    onError: (error, method) => {
      log.error(`[API ${method?.type} ✗] ${method?.url}`, error)
      if (error.response) {
        switch (error.response.status) {
          case 401: {
            // 防止并发 401 重复处理
            if (!handling401) {
              handling401 = true
              // 延迟导入避免循环依赖
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
            break
          }
        }
      }
      throw error
    },
  },
})

export default alovaInstance
