import { defineStore } from 'pinia'
import { ref, computed, h } from 'vue'
import { Notification } from '@arco-design/web-vue'
import { IconThumbUp, IconMessage, IconUser, IconNotification } from '@arco-design/web-vue/es/icon'
import {
  getNotifications,
  getNotificationsPage,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/apis/notifications'
import { useRealtimeConnection } from '@/composables/useRealtimeConnection'
import { createSSEConnection } from '@/utils/sseAdapter'
import { getSSEURL } from '@/config/server'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'LIKE':
    case 'FAVORITE':
      return h(IconThumbUp)
    case 'COMMENT':
      return h(IconMessage)
    case 'FOLLOW':
      return h(IconUser)
    default:
      return h(IconNotification)
  }
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const total = ref(0)

  const hasUnread = computed(() => unreadCount.value > 0)

  const showNotificationAlert = (notification) => {
    const icon = getNotificationIcon(notification.type)
    Notification.success({
      title: notification.title || '新通知',
      content: notification.content || '您有一条新消息',
      icon: icon,
      duration: 5000,
      position: 'topRight',
      closable: true,
    })
  }

  const handleSSEMessage = (data) => {
    if (data.type === 'NEW_NOTIFICATION') {
      const newNotification = data.notification || data.data
      if (newNotification) {
        newNotification.isRead = newNotification.isRead === 'READ'
        notifications.value.unshift(newNotification)
        if (!newNotification.isRead) {
          unreadCount.value++
        }
        showNotificationAlert(newNotification)
      }
    } else if (data.type === 'UNREAD_COUNT') {
      unreadCount.value = data.count ?? data.data ?? 0
    } else if (data.type === 'NOTIFICATION_READ') {
      const notificationId = data.notificationId || data.data
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.isRead = true
      }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } else if (data.type === 'NOTIFICATION_DELETED') {
      const notificationId = data.notificationId || data.data
      const index = notifications.value.findIndex((n) => n.id === notificationId)
      if (index > -1) {
        const notification = notifications.value[index]
        if (!notification.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } else if (data.id || data.title) {
      data.isRead = data.isRead === 'READ'
      notifications.value.unshift(data)
      if (!data.isRead) {
        unreadCount.value++
      }
      showNotificationAlert(data)
    }
  }

  const {
    isConnected: sseConnected,
    connect: connectSSE,
    disconnect: disconnectSSE,
  } = useRealtimeConnection({
    createConnection: (callbacks) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const url = getSSEURL('/notifications/subscribe')

      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      return createSSEConnection(url, {
        headers,
        onOpen: callbacks?.onOpen,
        onMessage: callbacks?.onMessage,
        onError: (error) => {
          console.error('SSE 连接错误:', error)
          if (callbacks?.onError) {
            callbacks.onError(error)
          }
        },
        onClose: callbacks?.onClose,
      })
    },
    onMessage: handleSSEMessage,
    onError: (error) => {
      console.error('SSE 连接错误:', error)
    },
    reconnectDelay: 5000,
  })

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount()
      if (res.code === 200) {
        unreadCount.value = res.data?.unreadCount ?? 0
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
    }
  }

  const fetchNotifications = async () => {
    loading.value = true
    try {
      const res = await getNotifications()
      if (res.code === 200) {
        notifications.value = (res.data || []).map((n) => ({
          ...n,
          isRead: n.isRead === 'READ',
        }))
        total.value = notifications.value.length
      }
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchNotificationsPage = async (params = {}) => {
    loading.value = true
    try {
      const res = await getNotificationsPage({ pageNumber: 1, pageSize: 10, ...params })
      if (res.code === 200) {
        notifications.value = (res.data?.records || []).map((n) => ({
          ...n,
          isRead: n.isRead === 'READ',
        }))
        total.value = res.data?.totalRow || 0
        return res
      }
    } catch (error) {
      console.error('获取通知列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const markNotificationAsRead = async (id) => {
    try {
      const res = await markAsRead(id)
      if (res.code === 200) {
        const notification = notifications.value.find((n) => n.id === id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await markAllAsRead()
      if (res.code === 200) {
        notifications.value.forEach((n) => {
          n.isRead = true
        })
        unreadCount.value = 0
      }
    } catch (error) {
      console.error('标记全部已读失败:', error)
    }
  }

  const removeNotification = async (id) => {
    try {
      const res = await deleteNotification(id)
      if (res.code === 200) {
        const index = notifications.value.findIndex((n) => n.id === id)
        if (index > -1) {
          const notification = notifications.value[index]
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
          notifications.value.splice(index, 1)
        }
      }
    } catch (error) {
      console.error('删除通知失败:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    total,
    hasUnread,
    sseConnected,
    fetchUnreadCount,
    fetchNotifications,
    fetchNotificationsPage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    connectSSE,
    disconnectSSE,
  }
})
