﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="messages-page">
    <div class="messages-container">
      <div class="conversations-panel">
        <div class="panel-header">
          <h3 class="panel-title">私信</h3>
          <a-badge :count="totalUnread" :max-count="99" :dot="false">
            <icon-message :size="20" :style="{ color: 'var(--color-text-1)' }" />
          </a-badge>
        </div>
        <div class="conversations-list-wrapper">
          <a-scrollbar>
            <a-spin :loading="conversationsLoading" style="width: 100%">
              <div v-if="conversations.length === 0" class="empty-conversations">
                <icon-message :size="48" />
                <p>暂无私信</p>
              </div>
              <div
                v-for="conv in conversations"
                :key="conv.id"
                class="conversation-item"
                :class="{
                  active: currentConversation?.id === conv.id,
                  unread: conv.unreadCount > 0,
                }"
                @click="selectConversation(conv)"
              >
                <a-avatar :size="48" class="conv-avatar">
                  <img v-if="conv.otherAvatarUrl" :src="getAvatarURL(conv.otherAvatarUrl)" alt="avatar" />
                  <icon-user v-else />
                </a-avatar>
                <div class="conv-info">
                  <div class="conv-header">
                    <span class="conv-name">{{ conv.otherUsername }}</span>
                    <span class="conv-time">{{ formatTime(conv.lastMessageAt) }}</span>
                  </div>
                  <div class="conv-last-message">
                    <span class="message-text">{{ conv.lastMessageContent || '暂无消息' }}</span>
                    <a-badge
                      v-if="conv.unreadCount > 0"
                      :count="conv.unreadCount"
                      :max-count="99"
                    />
                  </div>
                </div>
                <a-button
                  type="text"
                  size="small"
                  class="delete-btn"
                  @click.stop="handleDeleteConversation(conv)"
                >
                  <template #icon>
                    <icon-delete />
                  </template>
                </a-button>
              </div>
            </a-spin>
          </a-scrollbar>
        </div>
      </div>

      <div class="chat-panel">
        <template v-if="currentConversation">
          <div class="chat-header">
            <div class="chat-user-info">
              <a-avatar :size="36" class="chat-avatar">
                <img
                  v-if="currentConversation.otherAvatarUrl"
                  :src="getAvatarURL(currentConversation.otherAvatarUrl)"
                  alt="avatar"
                />
                <icon-user v-else />
              </a-avatar>
              <span class="chat-username">{{ currentConversation.otherUsername }}</span>
            </div>
            <a-button type="text" @click="viewUserProfile">
              <template #icon><icon-user /></template>
              查看主页
            </a-button>
          </div>

          <div class="message-list-wrapper">
            <a-scrollbar ref="messageListRef">
              <a-spin :loading="messagesLoading" style="width: 100%">
                <div v-if="messages.length === 0" class="empty-messages">
                  <p>发送第一条消息开始聊天吧~</p>
                </div>
                <div v-else class="messages-wrapper">
                  <div v-if="hasMoreMessages" class="load-more">
                    <a-button type="text" :loading="loadingMore" @click="loadMoreMessages">
                      加载更多
                    </a-button>
                  </div>
                  <template v-for="(msg, index) in messages" :key="msg.id">
                    <div
                      class="message-item"
                      :class="{
                        'self-message': msg.senderId === currentUserId,
                        'first-in-group': isFirstInGroup(index),
                      }"
                    >
                      <a-avatar :size="36" class="msg-avatar">
                        <img v-if="getAvatarUrl(msg)" :src="getAvatarUrl(msg)" alt="avatar" />
                        <icon-user v-else />
                      </a-avatar>
                      <div class="msg-content">
                        <div class="msg-bubble">{{ msg.content }}</div>
                      </div>
                      <div v-if="isLastInGroup(index)" class="msg-time">
                        {{ formatTime(msg.createdAt) }}
                      </div>
                    </div>
                  </template>
                </div>
              </a-spin>
            </a-scrollbar>
          </div>

          <div class="chat-input">
            <a-textarea
              v-model="newMessage"
              placeholder="输入消息..."
              :auto-size="{ minRows: 1, maxRows: 4 }"
              :max-length="500"
              @keydown="handleKeydown"
            />
            <a-button
              type="primary"
              :loading="sending"
              :disabled="!newMessage.trim()"
              @click="handleSend"
            >
              发送
            </a-button>
          </div>
        </template>
        <template v-else>
          <div class="no-conversation">
            <icon-message :size="64" />
            <p>选择一个会话开始聊天</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Message, Modal } from '@arco-design/web-vue'
import { IconMessage, IconUser, IconDelete } from '@arco-design/web-vue/es/icon'
import {
  getConversations,
  getMessageHistory,
  sendMessage as sendPrivateMessage,
  markMessagesAsRead,
  deleteConversation,
} from '@/apis/messages'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { getAvatarURL } from '@/config/server'
import log from '@/utils/logger'

definePage({
  meta: {
    title: '私信',
    requiresAuth: true,
  },
})

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const conversations = ref([])
const conversationsLoading = ref(false)
const currentConversation = ref(null)
const messages = ref([])
const messagesLoading = ref(false)
const newMessage = ref('')
const sending = ref(false)
const totalUnread = ref(0)
const currentPage = ref(1)
const hasMoreMessages = ref(false)
const loadingMore = ref(false)
const messageListRef = ref(null)

const currentUserId = computed(() => userStore.userId)

const TIME_GAP_THRESHOLD = 5 * 60 * 1000

const isSameDay = (t1, t2) => {
  const d1 = new Date(t1)
  const d2 = new Date(t2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const isSameGroup = (msg1, msg2) => {
  if (msg1.senderId !== msg2.senderId) return false
  if (!isSameDay(msg1.createdAt, msg2.createdAt)) return false
  const gap = Math.abs(new Date(msg2.createdAt) - new Date(msg1.createdAt))
  return gap <= TIME_GAP_THRESHOLD
}

const isLastInGroup = (index) => {
  if (index === messages.value.length - 1) return true
  return !isSameGroup(messages.value[index], messages.value[index + 1])
}

const isFirstInGroup = (index) => {
  if (index === 0) return true
  return !isSameGroup(messages.value[index - 1], messages.value[index])
}

const getAvatarUrl = (msg) => {
  if (msg.senderId === currentUserId.value) {
    return userStore.avatar || null
  }
  if (msg.sender?.avatarUrl) {
    return getAvatarURL(msg.sender.avatarUrl)
  }
  if (currentConversation.value?.otherAvatarUrl) {
    return getAvatarURL(currentConversation.value.otherAvatarUrl)
  }
  return null
}

const route = useRoute()

const fetchConversations = async () => {
  conversationsLoading.value = true
  try {
    const res = await getConversations()
    if (res.code === 200) {
      conversations.value = res.data || []
      totalUnread.value = conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

      const urlUserId = route.query.userId
      const urlUsername = route.query.username
      if (urlUserId && urlUsername) {
        const existingConv = conversations.value.find(
          (c) => String(c.otherUserId) === String(urlUserId),
        )
        if (existingConv) {
          selectConversation(existingConv)
        } else {
          const tempConv = {
            id: `temp_${urlUserId}`,
            otherUserId: Number(urlUserId),
            otherUsername: decodeURIComponent(urlUsername),
            otherAvatarUrl: null,
            unreadCount: 0,
            lastMessageContent: '',
            lastMessageAt: null,
          }
          conversations.value.unshift(tempConv)
          currentConversation.value = tempConv
          messages.value = []
        }
      } else if (conversations.value.length > 0 && !currentConversation.value) {
        selectConversation(conversations.value[0])
      }
    }
  } catch (error) {
    log.error('获取会话列表失败:', error)
  } finally {
    conversationsLoading.value = false
  }
}

const selectConversation = async (conv) => {
  currentConversation.value = conv
  currentPage.value = 1
  messages.value = []
  await fetchMessages()
  if (conv.unreadCount > 0) {
    const unreadDecrease = conv.unreadCount
    messageStore.suppressServerUnread()
    await markMessagesAsRead(conv.id)
    conv.unreadCount = 0
    totalUnread.value = conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    messageStore.decrementUnread(unreadDecrease)
  }
}

const fetchMessages = async () => {
  if (!currentConversation.value) return
  messagesLoading.value = true
  try {
    const res = await getMessageHistory(
      currentConversation.value.otherUserId,
      currentPage.value,
      20,
    )
    if (res.code === 200) {
      const newMessages = (res.data?.records || []).reverse()
      if (currentPage.value === 1) {
        messages.value = newMessages
      } else {
        messages.value = [...newMessages, ...messages.value]
      }
      hasMoreMessages.value = (res.data?.records?.length || 0) >= 20
      nextTick(() => {
        scrollToBottom()
      })
    }
  } catch (error) {
    log.error('获取消息记录失败:', error)
  } finally {
    messagesLoading.value = false
  }
}

const loadMoreMessages = async () => {
  if (loadingMore.value || !hasMoreMessages.value) return
  loadingMore.value = true
  currentPage.value++
  try {
    const res = await getMessageHistory(
      currentConversation.value.otherUserId,
      currentPage.value,
      20,
    )
    if (res.code === 200) {
      const newMessages = (res.data?.records || []).reverse()
      messages.value = [...newMessages, ...messages.value]
      hasMoreMessages.value = (res.data?.records?.length || 0) >= 20
    }
  } catch (error) {
    log.error('加载更多消息失败:', error)
  } finally {
    loadingMore.value = false
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = async () => {
  if (!newMessage.value.trim() || !currentConversation.value) return

  sending.value = true
  try {
    const res = await sendPrivateMessage(
      currentConversation.value.otherUserId,
      newMessage.value.trim(),
    )
    if (res.code === 200) {
      messages.value.push(res.data)
      newMessage.value = ''
      const conv = conversations.value.find((c) => c.id === currentConversation.value.id)
      if (conv) {
        conv.lastMessageContent = res.data.content
        conv.lastMessageAt = res.data.createdAt
      }
      nextTick(() => {
        scrollToBottom()
      })
    } else {
      Message.error(res.msg || res.message || '发送失败')
    }
  } catch (error) {
    log.error('发送消息失败:', error)
    Message.error('发送失败')
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  if (messageListRef.value) {
    const container = messageListRef.value.containerRef
    if (container) {
      messageListRef.value.scrollTop(container.scrollHeight)
    }
  }
}

const viewUserProfile = () => {
  if (currentConversation.value) {
    router.push(`/user/${currentConversation.value.otherUserId}`)
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  if (isSameDay(time, now.getTime())) return `${h}:${m}`
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d} ${h}:${m}`
}

const handleDeleteConversation = (conv) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除与 ${conv.otherUsername} 的会话吗？此操作不可恢复。`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await deleteConversation(conv.id)
        if (res.code === 200) {
          conversations.value = conversations.value.filter((c) => c.id !== conv.id)
          if (currentConversation.value?.id === conv.id) {
            currentConversation.value = null
            messages.value = []
          }
          totalUnread.value = conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
          Message.success('会话已删除')
        } else {
          Message.error(res.msg || res.message || '删除失败')
        }
      } catch (error) {
        log.error('删除会话失败:', error)
        Message.error('删除失败')
      }
    },
  })
}

const handleIncomingMessage = (message) => {
  if (!currentConversation.value) return false

  if (message.senderId === currentConversation.value.otherUserId) {
    messages.value.push(message)
    nextTick(() => {
      scrollToBottom()
    })

    const conv = conversations.value.find((c) => c.otherUserId === message.senderId)
    if (conv) {
      conv.lastMessageContent = message.content
      conv.lastMessageAt = message.createdAt
    }

    markMessagesAsRead(currentConversation.value.id)
    messageStore.suppressServerUnread()
    return true
  }
  return false
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  fetchConversations()
  messageStore.addMessageHandler(handleIncomingMessage)
})

onUnmounted(() => {
  messageStore.removeMessageHandler(handleIncomingMessage)
})
</script>

<style lang="scss" scoped>
.messages-page {
  height: calc(100vh - 64px - 88px);
  padding: 16px;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--color-bg-1);
}

.messages-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  background: var(--color-bg-2);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.conversations-panel {
  width: 320px;
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.conversations-list-wrapper {
  flex: 1;
  height: 0;
  overflow: hidden;

  :deep(.arco-scrollbar) {
    height: 100%;
  }

  :deep(.arco-scrollbar-container) {
    height: 100%;
    overflow-y: auto;
  }
}

.empty-conversations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-3);

  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--color-border-1);

  &:hover {
    background: var(--color-fill-2);
  }

  &.active {
    background: rgb(var(--primary-1));
  }

  &.unread {
    .conv-name {
      font-weight: 600;
      color: var(--color-text-1);
    }

    .message-text {
      color: var(--color-text-1);
    }
  }
}

.conv-avatar {
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.conv-name {
  font-size: 15px;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: var(--color-text-4);
  flex-shrink: 0;
}

.conv-last-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  color: rgb(var(--red-6));

  &:hover {
    background: rgba(var(--red-1), 0.3);
  }
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.message-text {
  font-size: 13px;
  color: var(--color-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border-2);
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-username {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.message-list-wrapper {
  flex: 1;
  height: 0;
  overflow: hidden;

  :deep(.arco-scrollbar) {
    height: 100%;
  }

  :deep(.arco-scrollbar-container) {
    height: 100%;
    overflow-y: auto;
  }
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-3);
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 20px;
}

.load-more {
  text-align: center;
  padding: 8px 0;
}

.message-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 4px 12px;

  &.self-message {
    flex-direction: row-reverse;

    .msg-bubble {
      background: rgb(var(--primary-6));
      color: #fff;
    }
  }
}

.msg-avatar {
  flex-shrink: 0;
}

.message-item:not(.first-in-group) {
  margin-top: -4px;

  .msg-bubble {
    border-radius: 12px 12px 12px 4px;
  }
}

.self-message:not(.first-in-group) {
  .msg-bubble {
    border-radius: 12px 12px 4px 12px;
  }
}

.msg-content {
  max-width: 60%;
}

.msg-bubble {
  padding: 10px 14px;
  background: var(--color-fill-2);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  color: var(--color-text-1);
}

.msg-time {
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-4);
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-2);

  :deep(.arco-textarea-wrapper) {
    flex: 1;
    background: var(--color-fill-2);
    border-color: transparent;

    &:hover,
    &:focus-within {
      background: var(--color-bg-1);
      border-color: rgb(var(--primary-6));
    }
  }
}

.no-conversation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-3);

  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .messages-page {
    padding: 0;
    height: calc(100vh - 64px);
  }

  .messages-container {
    height: 100%;
    border-radius: 0;
  }

  .conversations-panel {
    width: 100%;
    position: absolute;
    z-index: 10;
    background: var(--color-bg-2);
    transition: transform 0.3s;

    &.hidden {
      transform: translateX(-100%);
    }
  }

  .chat-panel {
    width: 100%;
  }
}
</style>
