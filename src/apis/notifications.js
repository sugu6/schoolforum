/**
 * 通知相关 API 接口
 */

import alova from './request'

/** 获取通知列表（不分页） */
export function getNotifications() {
  return alova.Get('/notifications/list')
}

/** 分页获取通知列表 */
export function getNotificationsPage(params) {
  return alova.Get('/notifications/list/page', { params })
}

/** 获取未读通知数量 */
export function getUnreadCount() {
  return alova.Get('/notifications/unread-count')
}

/** 标记单个通知已读 */
export function markAsRead(id) {
  return alova.Put(`/notifications/read/${id}`)
}

/** 标记全部通知已读 */
export function markAllAsRead() {
  return alova.Put('/notifications/read-all')
}

/** 删除通知 */
export function deleteNotification(id) {
  return alova.Delete(`/notifications/delete/${id}`)
}
