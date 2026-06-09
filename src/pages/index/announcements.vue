<template>
  <div class="announcements-page">
    <div class="container">
      <header class="page-header">
        <h1 class="title">公告</h1>
        <p class="subtitle">系统公告与重要通知</p>
      </header>

      <div v-if="loading" class="loading-state">
        <a-spin :size="24" />
      </div>

      <div v-else-if="announcements.length === 0" class="empty-state">
        <icon-notification :size="48" />
        <p>暂无公告</p>
      </div>

      <div v-else class="announcements-list">
        <article
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item"
          @click="handleAnnouncementClick(announcement)"
        >
          <div class="item-meta">
            <div class="tags">
              <a-tag v-if="announcement.isTop == 1" color="orangered" size="small">置顶</a-tag>
              <a-tag :color="announcement.type === 'IMPORTANT' ? 'red' : 'blue'" size="small">
                {{ announcement.type === 'IMPORTANT' ? '重要' : '通知' }}
              </a-tag>
            </div>
            <time class="time">{{ formatTime(announcement.createdAt) }}</time>
          </div>

          <h2 class="item-title">{{ announcement.title }}</h2>
        </article>
      </div>

      <div v-if="!loading && hasMore" class="load-more">
        <a-button @click="loadMore" :loading="loadingMore" long> 加载更多 </a-button>
      </div>
    </div>

    <a-modal
      v-model:visible="dialogVisible"
      :title="selectedAnnouncement?.title"
      :footer="false"
      :width="680"
      unmount-on-close
      simple
    >
      <div v-if="loadingDetail" class="detail-loading">
        <a-spin />
      </div>
      <div v-else-if="selectedAnnouncement" class="detail-content">
        <div class="detail-meta">
          <a-tag :color="selectedAnnouncement.type === 'IMPORTANT' ? 'red' : 'blue'" size="small">
            {{ selectedAnnouncement.type === 'IMPORTANT' ? '重要' : '通知' }}
          </a-tag>
          <a-tag v-if="selectedAnnouncement.isTop == 1" color="orangered" size="small">置顶</a-tag>
          <time class="time">{{ formatTime(selectedAnnouncement.createdAt) }}</time>
        </div>
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { IconNotification } from '@arco-design/web-vue/es/icon'
import { getAnnouncements, getAnnouncementDetail } from '@/apis/announcements'
import { renderMarkdown } from '@/utils/markdown'
import log from '@/utils/logger'

definePage({
  meta: {
    title: '全部公告',
  },
})

const loading = ref(true)
const loadingMore = ref(false)
const announcements = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

const dialogVisible = ref(false)
const selectedAnnouncement = ref(null)
const loadingDetail = ref(false)

const renderedContent = computed(() => {
  if (!selectedAnnouncement.value?.content) return ''
  return renderMarkdown(selectedAnnouncement.value.content)
})

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const fetchAnnouncements = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    announcements.value = []
    hasMore.value = true
  }

  try {
    const res = await getAnnouncements({
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
    })

    if (res?.data?.records) {
      const records = res.data.records

      if (reset) {
        announcements.value = records
      } else {
        announcements.value = [...announcements.value, ...records]
      }

      hasMore.value = records.length === pageSize.value
      currentPage.value++
    }
  } catch (error) {
    log.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  loadingMore.value = true
  fetchAnnouncements(false)
}

const handleAnnouncementClick = async (announcement) => {
  dialogVisible.value = true
  loadingDetail.value = true
  selectedAnnouncement.value = null

  try {
    const res = await getAnnouncementDetail(announcement.id)
    selectedAnnouncement.value = res?.data || res
  } catch (error) {
    log.error('获取公告详情失败:', error)
    selectedAnnouncement.value = null
  } finally {
    loadingDetail.value = false
  }
}

onMounted(() => {
  fetchAnnouncements(true)
})
</script>

<style lang="scss" scoped>
.announcements-page {
  min-height: 100%;
  padding: 48px 24px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 40px;

  .title {
    font-size: 28px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-text-3);
    margin: 0;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  color: var(--color-text-3);

  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

.announcements-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.announcement-item {
  background: var(--color-bg-2);
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-fill-1);
  }

  .item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .tags {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .time {
      font-size: 12px;
      color: var(--color-text-3);
    }
  }

  .item-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-1);
    margin: 0;
    line-height: 1.5;
  }
}

.load-more {
  margin-top: 24px;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.detail-content {
  .detail-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;

    .time {
      font-size: 12px;
      color: var(--color-text-3);
      margin-left: auto;
    }
  }
}

@media (max-width: 768px) {
  .announcements-page {
    padding: 32px 16px;
  }

  .page-header {
    margin-bottom: 32px;

    .title {
      font-size: 24px;
    }
  }

  .announcement-item {
    padding: 16px 20px;

    .item-title {
      font-size: 14px;
    }
  }
}
</style>

<style>
@import '../../styles/theme.css';

.detail-content .markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-2);
  word-wrap: break-word;
}

.detail-content .markdown-body h1,
.detail-content .markdown-body h2,
.detail-content .markdown-body h3,
.detail-content .markdown-body h4,
.detail-content .markdown-body h5,
.detail-content .markdown-body h6 {
  color: var(--color-text-1);
  margin: 20px 0 12px;
  font-weight: 600;
  line-height: 1.4;
}

.detail-content .markdown-body h1 {
  font-size: 24px;
}

.detail-content .markdown-body h2 {
  font-size: 22px;
}

.detail-content .markdown-body h3 {
  font-size: 20px;
}

.detail-content .markdown-body h4 {
  font-size: 18px;
}

.detail-content .markdown-body p {
  margin-bottom: 16px;
}

.detail-content .markdown-body a {
  color: rgb(var(--primary-6));
  text-decoration: none;
}

.detail-content .markdown-body a:hover {
  text-decoration: underline;
}

.detail-content .markdown-body img {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.detail-content .markdown-body code {
  background: var(--color-fill-2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.detail-content .markdown-body pre {
  background: var(--color-fill-2);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.detail-content .markdown-body pre code {
  background: transparent;
  padding: 0;
}

.detail-content .markdown-body blockquote {
  border-left: 3px solid rgb(var(--primary-6));
  padding-left: 16px;
  margin: 16px 0;
  color: var(--color-text-3);
}

.detail-content .markdown-body ul,
.detail-content .markdown-body ol {
  padding-left: 24px;
  margin-bottom: 16px;
}

.detail-content .markdown-body li {
  margin-bottom: 8px;
}

.detail-content .markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.detail-content .markdown-body th,
.detail-content .markdown-body td {
  border: 1px solid var(--color-border-2);
  padding: 8px 12px;
  text-align: left;
}

.detail-content .markdown-body th {
  background: var(--color-fill-2);
  font-weight: 600;
}

.detail-content .markdown-body hr {
  border: none;
  border-top: 1px solid var(--color-border-2);
  margin: 20px 0;
}
</style>
