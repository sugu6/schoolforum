import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useRefreshStore = defineStore('refresh', () => {
  const refreshFlags = reactive(new Map())

  const markRefreshNeeded = (key) => {
    if (!key) return
    refreshFlags.set(key, {
      timestamp: Date.now(),
      needsRefresh: true,
    })
  }

  const shouldRefresh = (key) => {
    if (!key) return false
    const flag = refreshFlags.get(key)
    return flag?.needsRefresh === true
  }

  const consumeRefresh = (key) => {
    if (!key) return false
    const flag = refreshFlags.get(key)
    if (flag?.needsRefresh === true) {
      refreshFlags.delete(key)
      return true
    }
    return false
  }

  const clearRefreshFlag = (key) => {
    if (key) {
      refreshFlags.delete(key)
    }
  }

  const clearAllFlags = () => {
    refreshFlags.clear()
  }

  return {
    refreshFlags,
    markRefreshNeeded,
    shouldRefresh,
    consumeRefresh,
    clearRefreshFlag,
    clearAllFlags,
  }
})
