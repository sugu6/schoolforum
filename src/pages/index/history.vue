<template>
  <div class="browse-history-page">
    <a-card class="history-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <IconHistory class="title-icon" />
          <span>浏览历史</span>
          <span class="history-count" v-if="pagination.total > 0">
            共 {{ pagination.total }} 条记录
          </span>
        </div>
      </template>
      <template #extra>
        <a-button v-if="historyList.length > 0" type="outline" status="danger" size="small" @click="handleClearAll"
          :loading="clearLoading">
          <template #icon>
            <IconDelete />
          </template>
          清空历史
        </a-button>
      </template>

      <a-spin :loading="loading" class="history-loading">
        <div v-if="historyList.length > 0" class="history-list">
          <div v-for="item in historyList" :key="item.id" class="history-item" @click="goToPost(item.id)">
            <div class="item-left">
              <img v-if="item.coverImage || getFirstImage(item.content)" :src="item.coverImage
                ? getCoverImageUrl(item.coverImage)
                : getFirstImage(item.content)
                " class="item-thumb" />
              <div v-else class="item-thumb-placeholder">
                <IconFile class="placeholder-icon" />
              </div>
            </div>
            <div class="item-right">
              <div class="item-header">
                <h4 class="item-title">{{ item.title }}</h4>
                <span class="item-category" v-if="item.categoryName">
                  {{ item.categoryName }}
                </span>
              </div>
              <p class="item-summary">
                {{ item.contentSummary || stripMarkdownContent(item.content, 100) || '暂无摘要' }}
              </p>
              <div class="item-footer">
                <div class="item-meta">
                  <span class="meta-item">
                    <IconUser class="meta-icon" />
                    <span>{{ item.authorName || '匿名用户' }}</span>
                  </span>
                  <span class="meta-item">
                    <IconClockCircle class="meta-icon" />
                    <span>{{ formatTime(item.createdAt) }}</span>
                  </span>
                  <span class="meta-item">
                    <IconEye class="meta-icon" />
                    <span>{{ item.viewCount || 0 }}</span>
                  </span>
                </div>
                <a-button type="text" size="small" class="remove-btn" @click.stop="handleRemove(item)">
                  <template #icon>
                    <IconClose />
                  </template>
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <a-empty v-else-if="!loading" description="暂无浏览历史" class="history-empty">
          <template #image>
            <IconHistory :size="48" style="color: var(--color-text-4)" />
          </template>
          <template #extra>
            <a-button type="primary" @click="router.push('/')">
              去逛逛
            </a-button>
          </template>
        </a-empty>
      </a-spin>

      <div v-if="historyList.length > 0" class="pagination">
        <a-pagination v-model:current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize"
          show-total show-jumper @change="fetchHistoryList" />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconHistory,
  IconDelete,
  IconFile,
  IconUser,
  IconClockCircle,
  IconEye,
  IconClose,
} from '@arco-design/web-vue/es/icon'
import {
  getBrowseHistoryList,
  removeBrowseHistory,
  clearBrowseHistory,
} from '@/apis/browseHistory'
import { stripMarkdown } from '@/utils/markdown'
import { getImageURL } from '@/config/server'
import { formatTimeAgo } from '@/utils/time'
import { useUserStore } from '@/stores/user'

definePage({
  meta: {
    title: '浏览历史',
    requiresAuth: true,
  },
})

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const clearLoading = ref(false)
const historyList = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const fetchHistoryList = async () => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }

  loading.value = true
  try {
    const res = await getBrowseHistoryList({
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    })
    if (res.code === 200) {
      historyList.value = res.data.records || []
      pagination.total = res.data.totalRow || 0
    }
  } catch (error) {
    log.error('获取浏览历史失败:', error)
    Message.error('获取浏览历史失败')
  } finally {
    loading.value = false
  }
}

const handleRemove = (post) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除「${post.title}」的浏览记录吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await removeBrowseHistory(post.id)
        if (res.code === 200) {
          Message.success('已删除')
          fetchHistoryList()
        } else {
          Message.error(res.message || '删除失败')
        }
      } catch (error) {
        Message.error('删除失败')
      }
    },
  })
}

const handleClearAll = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有浏览历史吗？此操作不可恢复。',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger',
    },
    onOk: async () => {
      clearLoading.value = true
      try {
        const res = await clearBrowseHistory()
        if (res.code === 200) {
          Message.success('已清空浏览历史')
          historyList.value = []
          pagination.total = 0
        } else {
          Message.error(res.message || '清空失败')
        }
      } catch (error) {
        Message.error('清空失败')
      } finally {
        clearLoading.value = false
      }
    },
  })
}

const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

const formatTime = formatTimeAgo

const stripMarkdownContent = (content, maxLength = 120) => {
  if (!content) return ''
  return stripMarkdown(content, maxLength)
}

const getCoverImageUrl = (coverImage) => {
  if (!coverImage) return ''
  let imageUrl = coverImage.trim()
  if (imageUrl.startsWith('`') && imageUrl.endsWith('`')) {
    imageUrl = imageUrl.slice(1, -1).trim()
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return getImageURL(imageUrl)
}

const getFirstImage = (content) => {
  if (!content) return ''
  const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  if (match) {
    let url = match[2]
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return getImageURL(url)
    }
    return url
  }
  return ''
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    // Token 在 httpOnly Cookie 中，尝试通过后端验证会话
    userStore.validateSession().then(valid => {
      if (valid) {
        fetchHistoryList()
      } else {
        Message.warning('请先登录')
        router.push('/auth?mode=login')
      }
    })
  } else {
    fetchHistoryList()
  }
})
</script>

<style lang="scss" scoped>
  .browse-history-page {
    padding: 24px;
    background: var(--color-bg-1);
    min-height: calc(100vh - 80px);
  }

  .history-card {
    max-width: 1200px;
    margin: 0 auto;
    border-radius: 12px;

    :deep(.arco-card-header) {
      border-bottom: 1px solid var(--color-border-2);
      padding: 16px 24px;
    }

    :deep(.arco-card-body) {
      padding: 24px;
    }
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);

    .title-icon {
      font-size: 22px;
      color: rgb(var(--primary-6));
    }

    .history-count {
      font-size: 14px;
      font-weight: 400;
      color: var(--color-text-3);
      margin-left: 8px;
    }
  }

  .history-loading {
    width: 100%;
    min-height: 300px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .history-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    align-items: flex-start;

    &:hover {
      background: var(--color-fill-2);
      border-color: rgb(var(--primary-6));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .item-left {
    flex-shrink: 0;
    width: 120px;
    height: 90px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-fill-2);
  }

  .item-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-fill-2) 0%, var(--color-fill-3) 100%);

    .placeholder-icon {
      font-size: 32px;
      color: var(--color-text-4);
    }
  }

  .item-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .item-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .item-category {
    flex-shrink: 0;
    font-size: 12px;
    color: rgb(var(--primary-6));
    background: rgb(var(--primary-1));
    padding: 2px 8px;
    border-radius: 4px;
  }

  .item-summary {
    font-size: 14px;
    color: var(--color-text-3);
    line-height: 1.6;
    margin: 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-4);
  }

  .meta-icon {
    font-size: 14px;
  }

  .remove-btn {
    color: var(--color-text-3);

    &:hover {
      color: rgb(var(--danger-6));
      background: rgb(var(--danger-1));
    }
  }

  .history-empty {
    padding: 60px 0;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);
  }

  @media (max-width: 768px) {
    .browse-history-page {
      padding: 16px;
    }

    .history-item {
      flex-direction: column;
    }

    .item-left {
      width: 100%;
      height: 180px;
    }

    .item-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .remove-btn {
      align-self: flex-end;
    }
  }
</style>
