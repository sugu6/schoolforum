<template>
  <div class="header">
    <!-- 移动端菜单按钮 -->
    <div class="mobile-menu-btn" @click="mobileMenuVisible = true">
      <icon-menu :size="22" />
    </div>

    <!-- 左侧 Logo -->
    <div class="logo" @click="router.push('/')">
      <SiteLogo class="logo-icon" :size="28" />
      <span class="logo-text">海语</span>
    </div>

    <!-- 中间导航菜单 - 桌面端 -->
    <a-menu mode="horizontal" v-model:selected-keys="selectedKeys" class="header-menu">
      <a-menu-item key="home" @click="handleHomeClick"> 首页 </a-menu-item>
      <a-menu-item v-for="category in categories" :key="String(category.id)" @click="handleCategoryClick(category)">
        {{ category.name }}
      </a-menu-item>
    </a-menu>

    <!-- 右侧操作区 -->
    <div class="actions">
      <!-- 桌面端搜索框 -->
      <div class="desktop-search">
        <a-auto-complete v-model="searchQuery" :data="searchSuggestions" placeholder="搜索" allow-clear
          @search="handleSearchInput" @select="handleSuggestionSelect" @keydown.enter="doSearch">
          <template #option="{ data: optionData }">
            <div class="suggestion-item">
              <icon-search :size="14" class="suggestion-icon" />
              <span class="suggestion-text">{{ optionData.label || optionData.value }}</span>
            </div>
          </template>
        </a-auto-complete>
        <a-button type="primary" class="search-btn" @click="doSearch">
          <template #icon><icon-search /></template>
        </a-button>
      </div>

      <!-- 移动端搜索图标 -->
      <a-tooltip content="搜索" position="bottom">
        <div class="mobile-search-icon" @click="handleSearch">
          <icon-search :size="22" />
        </div>
      </a-tooltip>

      <!-- 消息通知 -->
      <a-popover v-model:popup-visible="notificationVisible" trigger="click" position="bottom"
        :content-style="{ padding: '0', width: '360px' }" :arrow-style="{ display: 'none' }">
        <a-tooltip content="系统通知" position="bottom" :unmount-on-close="false">
          <a-badge :count="notificationStore.unreadCount" :max-count="99">
            <div class="message-icon">
              <icon-notification :size="22" />
            </div>
          </a-badge>
        </a-tooltip>
        <template #content>
          <div class="notification-panel panel-slide-down">
            <div class="notification-header">
              <span class="notification-title">系统通知</span>
              <a-button v-if="notificationStore.hasUnread" type="text" size="small" @click="handleMarkAllRead">
                全部已读
              </a-button>
            </div>
            <div class="notification-list">
              <a-spin :loading="notificationStore.loading" style="width: 100%">
                <div v-if="notificationStore.notifications.length === 0" class="notification-empty">
                  <icon-notification :size="40" />
                  <p>暂无通知</p>
                </div>
                <div v-for="(item, index) in displayNotifications" :key="item.id" class="notification-item" :class="{
                  unread: !item.isRead,
                  'animate-fade-in-up': true,
                  ['animate-delay-' + (index + 1)]: true,
                }">
                  <div class="notification-indicator" v-if="!item.isRead"></div>
                  <div class="notification-content" @click="handleNotificationClick(item)">
                    <div class="notification-item-title">
                      <icon-check-circle-fill v-if="item.type === 'LIKE' || item.type === 'FAVORITE'"
                        class="type-icon success" />
                      <icon-message v-else-if="item.type === 'COMMENT'" class="type-icon warning" />
                      <icon-notification v-else class="type-icon info" />
                      <span class="title-text">{{ item.title }}</span>
                      <span v-if="item.isRead" class="read-badge">已读</span>
                    </div>
                    <div class="notification-item-text">{{ item.content }}</div>
                    <div class="notification-item-time">{{ formatTime(item.createdAt) }}</div>
                  </div>
                  <div class="notification-actions">
                    <a-button v-if="!item.isRead" type="primary" size="mini" @click.stop="handleMarkRead(item.id)">
                      标为已读
                    </a-button>
                    <a-button type="text" size="mini" @click.stop="handleDeleteNotification(item.id)">
                      <template #icon><icon-delete /></template>
                    </a-button>
                  </div>
                </div>
                <div v-if="remainingCount > 0" class="notification-more" @click="handleViewAll">
                  <span class="more-dots">•••</span>
                  <span class="more-text">还有 {{ remainingCount }} 条通知</span>
                </div>
              </a-spin>
            </div>
            <div class="notification-footer">
              <a-button type="text" long @click="handleViewAll">查看全部</a-button>
            </div>
          </div>
        </template>
      </a-popover>

      <!-- 私信入口 -->
      <a-tooltip content="私信" position="bottom">
        <a-badge :count="messageStore.unreadCount" :max-count="99">
          <div class="message-icon" @click="handlePrivateMessage">
            <icon-message :size="22" />
          </div>
        </a-badge>
      </a-tooltip>

      <!-- 主题切换 - 桌面端 -->
      <a-tooltip :content="themeStore.isDark ? '切换到浅色模式' : '切换到深色模式'" position="bottom">
        <div class="theme-toggle desktop-only" @click="toggleTheme($event)">
          <icon-moon-fill v-if="themeStore.isDark" :size="22" />
          <icon-sun-fill v-else :size="22" />
        </div>
      </a-tooltip>

      <!-- 未登录状态 -->
      <div v-if="!userStore.isLoggedIn" class="auth-buttons">
        <a-button type="secondary" @click="handleLogin" class="login-btn">登录</a-button>
        <a-button type="primary" @click="handleRegister" class="register-btn">注册</a-button>
      </div>

      <!-- 已登录状态 -->
      <div v-else class="user-info">
        <a-dropdown trigger="hover">
          <a-button type="text" class="user-button">
            <a-avatar :size="32" class="user-avatar">
              <img v-if="userStore.avatar" :src="userStore.avatar" />
              <icon-user v-else />
            </a-avatar>
            <span class="username">{{ userStore.username || '用户' }}</span>
            <icon-down />
          </a-button>
          <template #content>
            <a-doption @click="handlePersonalCenter"> <icon-user /> 个人中心 </a-doption>
            <a-doption @click="handleCheckinCenter"> <icon-check-circle /> 签到中心 </a-doption>
            <a-doption v-if="userStore.isAdmin" @click="handleAdminDashboard">
              <icon-dashboard /> 管理后台
            </a-doption>
            <a-divider style="margin: 6px 0" />
            <a-doption @click="handleLogout"> <icon-poweroff /> 退出登录 </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 移动端抽屉菜单 -->
    <a-drawer v-model:visible="mobileMenuVisible" placement="left" :width="280" :footer="false" :header="false">
      <div class="mobile-drawer">
        <div class="drawer-header">
          <div class="logo">
            <SiteLogo class="logo-icon" :size="24" />
            <span class="logo-text">海语</span>
          </div>
          <icon-close :size="20" @click="mobileMenuVisible = false" class="close-icon" />
        </div>
        <a-menu v-model:selected-keys="selectedKeys" mode="vertical" class="mobile-menu">
          <a-menu-item key="home" @click="handleHomeClick"> 首页 </a-menu-item>
          <a-menu-item v-for="category in categories" :key="String(category.id)" @click="handleCategoryClick(category)">
            {{ category.name }}
          </a-menu-item>
        </a-menu>
        <div class="drawer-footer">
          <div class="theme-toggle" @click="toggleTheme($event)">
            <icon-moon-fill v-if="themeStore.isDark" :size="20" />
            <icon-sun-fill v-else :size="20" />
          </div>
          <span class="theme-label">{{ themeStore.isDark ? '深色模式' : '浅色模式' }}</span>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup>
import router from '@/router'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { useMessageStore } from '@/stores/message'
import { toggleThemeWithAnimation } from '@/utils/themeTransition'
import SiteLogo from '@/components/SiteLogo.vue'
import {
  IconMoonFill,
  IconSunFill,
  IconDown,
  IconUser,
  IconPoweroff,
  IconNotification,
  IconMenu,
  IconClose,
  IconSearch,
  IconDelete,
  IconCheckCircleFill,
  IconMessage,
  IconCheckCircle,
  IconDashboard,
} from '@arco-design/web-vue/es/icon'
import { Message, Notification } from '@arco-design/web-vue'
import { logout } from '@/apis/users.js'
import { getCategoryList } from '@/apis/categories.js'
import { searchSuggest } from '@/apis/search.js'
import { formatTimeAgo } from '@/utils/time'
import log from '@/utils/logger'

const themeStore = useThemeStore()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const messageStore = useMessageStore()
const route = useRoute()

const toggleTheme = (event) => {
  toggleThemeWithAnimation(event, () => {
    themeStore.setTheme(!themeStore.isDark)
  })
}

const mobileMenuVisible = ref(false)
const categories = ref([])
const selectedKeys = ref([])
const notificationVisible = ref(false)

const displayNotifications = computed(() => {
  return notificationStore.notifications.slice(0, 2)
})

const remainingCount = computed(() => {
  return Math.max(0, notificationStore.notifications.length - 2)
})
const searchQuery = ref('')
const searchSuggestions = ref([])

const fetchSuggestionsDebounced = useDebounceFn(async (query) => {
  if (!query || !query.trim()) {
    searchSuggestions.value = []
    return
  }
  try {
    const res = await searchSuggest({ prefix: query.trim(), limit: 8 })
    if (res && res.code === 200 && res.data && Array.isArray(res.data)) {
      searchSuggestions.value = res.data.map((item) => ({
        value: item.keyword,
        label: item.keyword,
      }))
    } else {
      searchSuggestions.value = []
    }
  } catch (error) {
    searchSuggestions.value = []
  }
}, 300)

const handleSearchInput = (value) => {
  fetchSuggestionsDebounced(value)
}

const handleSuggestionSelect = (value) => {
  if (value?.trim()) {
    router.push({ path: '/search', query: { q: value.trim() } })
  }
}

const doSearch = () => {
  const q = searchQuery.value?.trim()
  if (q) {
    router.push({ path: '/search', query: { q } })
  }
}

const isParentCategory = (categoryId) => {
  const id = Number(categoryId)
  return id && categories.value.some((c) => c.id === id)
}

const getParentCategoryId = (categoryId) => {
  const id = Number(categoryId)
  if (!id || !categories.value.length) return null
  const parent = categories.value.find((c) => c.id === id)
  if (parent) return id
  return categories.value.find((c) => c.children?.some((child) => child.id === id))?.id || null
}

const savedActiveParentId = useSessionStorage('activeParentCategoryId', null)

const initSelectedKeys = () => {
  const categoryId = route.query.categoryId

  if (!categoryId) {
    selectedKeys.value = ['home']
    return
  }

  if (isParentCategory(categoryId)) {
    selectedKeys.value = [String(categoryId)]
    return
  }

  const parentId = getParentCategoryId(categoryId)
  selectedKeys.value =
    savedActiveParentId.value && parentId === Number(savedActiveParentId.value) ? [String(parentId)] : ['home']
}

watch(
  () => route.query.categoryId,
  () => {
    initSelectedKeys()
  },
  { immediate: true },
)

const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    if (res && res.data) {
      categories.value = res.data
      initSelectedKeys()
    }
  } catch (error) {
    log.error('获取分类失败:', error)
  }
}

const handleCategoryClick = (category) => {
  selectedKeys.value = [String(category.id)]
  router.push(`/?categoryId=${category.id}`)
}

const handleHomeClick = () => {
  selectedKeys.value = ['home']
  router.push('/')
}

onMounted(() => {
  fetchCategories()
  if (userStore.isLoggedIn) {
    notificationStore.fetchUnreadCount()
    notificationStore.connectSSE()
    messageStore.fetchUnreadCount()
    messageStore.connectWebSocket()
  }
})

const handleLogin = () => router.push('/auth?mode=login')
const handleRegister = () => router.push('/auth?mode=register')
const handlePersonalCenter = () => router.push('/profile?tab=profile')
const handleCheckinCenter = () => router.push('/checkin')
const handleAdminDashboard = () => (window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:8081')
const handleSearch = () => router.push('/search')

watch(
  () => route.path,
  (path) => {
    if (path === '/search' && route.query.q) {
      searchQuery.value = route.query.q
    } else if (path !== '/search') {
      searchQuery.value = ''
    }
  },
  { immediate: true },
)

watch(
  () => route.query.q,
  (newQ) => {
    if (route.path === '/search' && newQ) {
      searchQuery.value = newQ
    }
  },
)

watch(notificationVisible, (visible) => {
  if (visible && userStore.isLoggedIn) {
    notificationStore.fetchNotifications()
  }
})

watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      notificationStore.fetchUnreadCount()
      notificationStore.connectSSE()
      messageStore.fetchUnreadCount()
      messageStore.connectWebSocket()
    } else {
      notificationStore.disconnectSSE()
      messageStore.disconnectWebSocket()
      messageStore.clearUnread()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  notificationStore.disconnectSSE()
  messageStore.disconnectWebSocket()
})

const formatTime = formatTimeAgo

const handleNotificationClick = async (item) => {
  if (!item.isRead) {
    await notificationStore.markNotificationAsRead(item.id)
  }
  notificationVisible.value = false
  if (item.relatedId && item.relatedType) {
    if (item.relatedType === 'POST') {
      router.push(`/post/${item.relatedId}`)
    }
  }
}

const handleMarkRead = async (id) => {
  await notificationStore.markNotificationAsRead(id)
  Message.success('已标记为已读')
}

const handleMarkAllRead = async () => {
  await notificationStore.markAllNotificationsAsRead()
  Message.success('已全部标记为已读')
}

const handleDeleteNotification = async (id) => {
  await notificationStore.removeNotification(id)
  Message.success('已删除通知')
}

const handleViewAll = () => {
  notificationVisible.value = false
  router.push('/notifications')
}

const handlePrivateMessage = () => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录后再使用私信功能')
    router.push('/auth?mode=login')
    return
  }
  router.push('/chat')
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    log.error('退出登录接口错误:', error)
  }
  userStore.clearUser()
  Message.success('已退出登录')
  router.push('/')
}
</script>

<style lang="scss" scoped>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
    height: 64px;
    background-color: var(--color-bg-2);
    border-bottom: 1px solid var(--color-border-2);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-2);

    &:hover {
      background-color: var(--color-fill-2);
      color: rgb(var(--primary-6));
    }

    &:active {
      transform: scale(0.9);
    }
  }

  /* Logo */
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    flex-shrink: 0;

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  /* 导航菜单 */
  .header-menu {
    flex: 1;
    display: flex;
    justify-content: center;
    background: transparent;
    border-bottom: none;

    :deep(.arco-menu-item) {
      padding: 0 20px;
      font-size: 15px;
    }
  }

  /* 右侧操作区 */
  .actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-2);

    &:hover {
      background-color: var(--color-fill-2);
      color: rgb(var(--primary-6));
    }

    &:active {
      transform: scale(0.9);
    }
  }

  .desktop-search {
    display: flex;
    align-items: center;
    width: 280px;
    flex-shrink: 0;

    :deep(.arco-auto-complete) {
      flex: 1;
      min-width: 0;
      width: 100%;
    }

    .search-btn {
      flex-shrink: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    :deep(.arco-auto-complete .arco-input-wrapper) {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;

    .suggestion-icon {
      color: var(--color-text-3);
      flex-shrink: 0;
    }

    .suggestion-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--color-text-1);
      font-size: 13px;
    }
  }

  .mobile-search-icon {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-2);

    &:hover {
      background-color: var(--color-fill-2);
      color: rgb(var(--primary-6));
    }

    &:active {
      transform: scale(0.9);
    }
  }

  .desktop-only {
    display: inline-flex;
  }

  /* 消息通知 */
  .message-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-text-2);

    &:hover {
      background-color: var(--color-fill-2);
      color: rgb(var(--primary-6));
    }

    &:active {
      transform: scale(0.9);
    }
  }

  :deep(.arco-badge-number) {
    margin-right: 6px;
    margin-top: 2px;
  }

  /* 登录注册按钮 */
  .auth-buttons {
    display: flex;
    gap: 12px;

    .login-btn {
      display: block;
    }

    .register-btn {
      display: block;
    }
  }

  /* 用户信息 */
  .user-info {
    .user-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;

      .user-avatar {
        border: 2px solid var(--color-border-2);
      }

      .username {
        color: var(--color-text-1);
        font-size: 14px;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :deep(.arco-icon-down) {
        transition: transform 0.2s ease;
      }
    }

    :deep(.arco-dropdown-open .arco-icon-down) {
      transform: rotate(180deg);
    }
  }

  /* 移动端抽屉 */
  .mobile-drawer {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border-2);

    .logo {
      .logo-text {
        font-size: 18px;
      }
    }

    .close-icon {
      cursor: pointer;
      color: var(--color-text-3);
      transition: color 0.2s;

      &:hover {
        color: rgb(var(--primary-6));
      }
    }
  }

  .mobile-menu {
    flex: 1;
    border: none;

    :deep(.arco-menu-item) {
      font-size: 16px;
      padding: 12px 20px;
    }
  }

  .drawer-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--color-border-2);

    .theme-label {
      font-size: 14px;
      color: var(--color-text-2);
    }
  }

  /* 响应式断点 */
  @media (max-width: 992px) {
    .header {
      padding: 0 24px;
    }

    .header-menu {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .desktop-search {
      display: none;
    }

    .mobile-search-icon {
      display: flex;
    }

    .desktop-only {
      display: none;
    }
  }

  @media (max-width: 576px) {
    .header {
      padding: 0 16px;
    }

    .logo {
      .logo-text {
        font-size: 16px;
      }
    }

    .actions {
      gap: 8px;
    }

    .auth-buttons {
      gap: 8px;

      .login-btn {
        display: none;
      }
    }

    .user-info {
      .user-button {
        padding: 4px;

        .username {
          display: none;
        }

        :deep(.arco-icon-down) {
          display: none;
        }
      }
    }
  }

  /* 通知面板样式 */
  .notification-panel {
    max-height: 400px;
    display: flex;
    flex-direction: column;
    animation: slideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-2);
  }

  .notification-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .notification-list {
    flex: 1;
    overflow-y: auto;
    max-height: 300px;
  }

  .notification-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--color-text-3);

    p {
      margin-top: 12px;
      font-size: 14px;
    }
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-1);
    transition: background-color 0.2s;
    position: relative;

    &:hover {
      background-color: var(--color-fill-1);
    }

    &:last-child {
      border-bottom: none;
    }

    &.unread {
      background-color: rgba(var(--primary-1), 0.5);
      border-left: 3px solid rgb(var(--primary-6));

      .notification-item-title .title-text {
        font-weight: 600;
        color: var(--color-text-1);
      }

      .notification-item-text {
        color: var(--color-text-1);
      }
    }
  }

  .notification-indicator {
    position: absolute;
    left: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgb(var(--primary-6));
  }

  .notification-content {
    flex: 1;
    cursor: pointer;
    min-width: 0;
  }

  .notification-item-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-1);
    margin-bottom: 4px;

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

    .type-icon {
      flex-shrink: 0;

      &.success {
        color: rgb(var(--success-6));
      }

      &.info {
        color: rgb(var(--primary-6));
      }
    }
  }

  .notification-item-text {
    font-size: 13px;
    color: var(--color-text-2);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .notification-item-time {
    font-size: 12px;
    color: var(--color-text-4);
    margin-top: 4px;
  }

  .notification-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
    flex-shrink: 0;
  }

  .notification-footer {
    padding: 8px 0;
    border-top: 1px solid var(--color-border-2);
    text-align: center;
  }

  .notification-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    color: var(--color-text-3);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--color-fill-1);
      color: rgb(var(--primary-6));
    }

    .more-dots {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 2px;
    }

    .more-text {
      font-size: 13px;
    }
  }
</style>
