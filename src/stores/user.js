import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/apis/users'
import { getAvatarURL } from '@/config/server'
import log from '@/utils/logger'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const tokenExpiresAt = ref(0)

  const isLoggedIn = computed(() => !!userInfo.value)
  const userId = computed(() => userInfo.value?.id || null)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => getAvatarURL(userInfo.value?.avatarUrl || userInfo.value?.avatar || ''))
  const isAdmin = computed(() => {
    const role = userInfo.value?.role
    return role === 'SUPER_ADMIN' || role === 'ADMIN'
  })

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  const setTokenExpiresAt = (expiresIn) => {
    if (expiresIn > 0) {
      const expiresAt = Date.now() + expiresIn * 1000
      tokenExpiresAt.value = expiresAt
      localStorage.setItem('tokenExpiresAt', String(expiresAt))
    } else {
      tokenExpiresAt.value = 0
      localStorage.removeItem('tokenExpiresAt')
    }
  }

  const refreshAccessToken = async () => {
    // 使用原生 fetch 而非 alova，避免 refresh 401 时触发 alova 的 handle401WithRefresh 形成循环
    try {
      const { getAPIBaseURL } = await import('@/config/server')
      const baseURL = getAPIBaseURL()
      const response = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 携带 httpOnly Cookie（RefreshToken）
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!response.ok) {
        log.warn(`Token 刷新失败: HTTP ${response.status}`)
        return false
      }
      const res = await response.json()
      if (res.code === 200 && res.data?.expiresIn) {
        setTokenExpiresAt(res.data.expiresIn)
        return true
      }
      return false
    } catch (error) {
      log.warn('Token 刷新异常:', error)
      return false
    }
  }

  const clearUser = () => {
    userInfo.value = null
    tokenExpiresAt.value = 0
    localStorage.removeItem('userInfo')
    localStorage.removeItem('tokenExpiresAt')
  }

  const updateUserInfo = (info) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        userInfo.value = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
      }
    } catch (error) {
      log.error('获取用户信息失败:', error)
    }
  }

  /**
   * 通过后端接口验证当前 Cookie 是否有效
   * 如果有效，同步 userInfo；如果无效，清除用户状态
   */
  const validateSession = async () => {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        setUserInfo(res.data)
        return true
      }
      clearUser()
      return false
    } catch {
      clearUser()
      return false
    }
  }

  const initFromStorage = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch {
        localStorage.removeItem('userInfo')
      }
    }
    const storedExpiresAt = localStorage.getItem('tokenExpiresAt')
    if (storedExpiresAt) {
      tokenExpiresAt.value = Number(storedExpiresAt) || 0
    }
  }

  initFromStorage()

  return {
    userInfo,
    tokenExpiresAt,
    isLoggedIn,
    userId,
    username,
    avatar,
    isAdmin,
    setUserInfo,
    setTokenExpiresAt,
    refreshAccessToken,
    clearUser,
    updateUserInfo,
    fetchUserInfo,
    validateSession,
  }
})
