<template>
  <div class="message-page">
    <div class="message-container">
      <a-card class="message-card" :bordered="false">
        <template #title>
          <div class="card-title">
            <icon-notification />
            <span>消息通知</span>
          </div>
        </template>
        <template #extra>
          <a-button v-if="notificationStore.hasUnread" type="text" size="small" @click="handleMarkAllRead">
            <template #icon><icon-check /></template>
            全部已读
          </a-button>
        </template>

        <a-list :loading="loading" :data="notifications" :bordered="false" class="notification-list">
          <template #item="{ item }">
            <a-list-item class="notification-item" :class="{ unread: !item.isRead }">
              <div class="notification-indicator" v-if="!item.isRead"></div>
              <a-list-item-meta>
                <template #avatar>
                  <a-avatar :size="40" :style="{ backgroundColor: getTypeColor(item.type) }">
                    <icon-check-circle-fill v-if="item.type === 'LIKE' || item.type === 'FAVORITE'" />
                    <icon-message v-else-if="item.type === 'COMMENT'" />
                    <icon-user v-else-if="item.type === 'FOLLOW'" />
                    <icon-notification v-else />
                  </a-avatar>
                </template>
                <template #title>
                  <div class="notification-title">
                    <span class="title-text">{{ item.title }}</span>
                    <a-tag v-if="!item.isRead" size="small" color="arcoblue">新</a-tag>
                    <span v-else class="read-badge">已读</span>
                  </div>
                </template>
                <template #description>
                  <div class="notification-content">{{ item.content }}</div>
                  <div class="notification-meta">
                    <span v-if="item.sender" class="sender">
                      <icon-user />
                      {{ item.sender.username }}
                    </span>
                    <span class="time">
                      <icon-clock-circle />
                      {{ formatTime(item.createdAt) }}
                    </span>
                  </div>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button v-if="!item.isRead" type="primary" size="small" @click="handleMarkRead(item.id)">
                  标为已读
                </a-button>
                <a-button type="text" size="small" status="danger" @click="handleDelete(item.id)">
                  <template #icon><icon-delete /></template>
                </a-button>
              </template>
            </a-list-item>
          </template>
          <template #empty>
            <a-empty description="暂无消息通知">
              <template #image>
                <icon-notification :size="48" />
              </template>
            </a-empty>
          </template>
        </a-list>

        <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
          <a-pagination v-model:current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize"
            show-total @change="handlePageChange" />
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconNotification,
  IconCheckCircleFill,
  IconMessage,
  IconUser,
  IconDelete,
  IconClockCircle,
} from '@arco-design/web-vue/es/icon'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { formatTimeAgo } from '@/utils/time'
import log from '@/utils/logger'

definePage({
  meta: {
    title: '消息通知',
    requiresAuth: true,
  },
})

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const notifications = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const getTypeColor = (type) => {
  const colors = {
    LIKE: 'rgb(var(--success-6))',
    FAVORITE: 'rgb(var(--warning-6))',
    COMMENT: 'rgb(var(--primary-6))',
    FOLLOW: 'rgb(var(--arcoblue-6))',
  }
  return colors[type] || 'rgb(var(--gray-6))'
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    await notificationStore.fetchNotificationsPage({
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    })
    notifications.value = notificationStore.notifications
    pagination.total = notificationStore.total
  } catch (error) {
    log.error('获取通知列表失败:', error)
    Message.error('获取通知列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  pagination.current = page
  fetchNotifications()
}

const handleMarkRead = async (id) => {
  await notificationStore.markNotificationAsRead(id)
  Message.success('已标记为已读')
}

const handleMarkAllRead = async () => {
  Modal.confirm({
    title: '确认操作',
    content: '确定要将所有通知标记为已读吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await notificationStore.markAllNotificationsAsRead()
      Message.success('已全部标记为已读')
      fetchNotifications()
    },
  })
}

const handleDelete = (id) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条通知吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await notificationStore.removeNotification(id)
      Message.success('已删除通知')
      if (notifications.value.length === 0 && pagination.current > 1) {
        pagination.current--
      }
      fetchNotifications()
    },
  })
}

const formatTime = formatTimeAgo

onMounted(() => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  fetchNotifications()
})
</script>

<style lang="scss" scoped>
  .message-page {
    padding: 24px;
    background: var(--color-bg-1);
    min-height: calc(100vh - 64px);
  }

  .message-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .message-card {
    background: var(--color-bg-2);
    border-radius: 12px;

    :deep(.arco-card-header) {
      border-bottom: 1px solid var(--color-border-2);
      padding: 16px 24px;
    }

    :deep(.arco-card-body) {
      padding: 0;
    }
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .notification-list {
    :deep(.arco-list-item) {
      padding: 16px 24px;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;

      &:hover {
        background-color: var(--color-fill-1);
      }
    }
  }

  .notification-item {
    &.unread {
      background-color: rgba(var(--primary-1), 0.5);
      border-left: 3px solid rgb(var(--primary-6));

      &:hover {
        background-color: rgba(var(--primary-1), 0.6);
      }

      .notification-title .title-text {
        font-weight: 600;
        color: var(--color-text-1);
      }

      .notification-content {
        color: var(--color-text-1);
      }
    }
  }

  .notification-indicator {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgb(var(--primary-6));
  }

  .notification-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-1);

    .title-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .read-badge {
      font-size: 11px;
      font-weight: normal;
      color: var(--color-text-3);
      background-color: var(--color-fill-2);
      padding: 1px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
  }

  .notification-content {
    font-size: 14px;
    color: var(--color-text-2);
    line-height: 1.6;
    margin-top: 4px;
  }

  .notification-meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-text-4);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 24px;
    border-top: 1px solid var(--color-border-2);
  }

  @media (max-width: 768px) {
    .message-page {
      padding: 16px;
    }

    .notification-list {
      :deep(.arco-list-item) {
        padding: 12px 16px;
      }
    }
  }
</style>
