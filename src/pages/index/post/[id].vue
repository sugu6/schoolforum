<template>
  <div class="post-detail-page">
    <a-row :gutter="[20, 0]">
      <!-- 左侧占位 -->
      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="left-sidebar"></div>
      </a-col>

      <!-- 中间主要内容 -->
      <a-col :xs="24" :sm="24" :md="24" :lg="16" :xl="14" :xxl="14">
        <div class="post-main">
          <PostCard v-if="!loading && post" :post="post" mode="detail" @content-rendered="onContentRendered" />
          <a-card v-else class="post-card" :bordered="true" :loading="loading" />

          <CommentSection ref="commentSectionRef" :post-id="postId" :total-comments="totalComments"
            @comment-change="handleCommentChange" @login="handleLogin" />
        </div>
      </a-col>

      <!-- 右侧边栏 -->
      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="post-sidebar">
          <AuthorProfile v-if="post" :author-id="post.authorId" @follow-change="handleFollowChange" />
          <a-affix :offset-top="80">
            <TableOfContents v-if="headings.length > 0" :headings="headings" :offset="80" />
          </a-affix>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onScopeDispose } from 'vue'
import { useRouter } from 'vue-router'
import { useRouteParams } from '@vueuse/router'
import { Message } from '@arco-design/web-vue'
import { useIntervalFn } from '@vueuse/core'
import { getPostDetail } from '@/apis/posts'
import { addBrowseHistory } from '@/apis/browseHistory'
import { extractHeadingsFromDOM } from '@/utils/markdown'
import { usePageRefresh } from '@/composables/usePageRefresh'
import log from '@/utils/logger'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import CommentSection from './components/CommentSection.vue'
import AuthorProfile from './components/AuthorProfile.vue'

const router = useRouter()
const postId = useRouteParams('id')
const { markForRefresh } = usePageRefresh('/')
const userStore = useUserStore()

const loading = ref(true)
const post = ref(null)
const headings = ref([])
const totalComments = ref(0)
const commentSectionRef = ref(null)

const fetchPostDetail = async () => {
  if (!post.value) {
    loading.value = true
  }
  try {
    const res = await getPostDetail(postId.value)
    if (res.code === 200) {
      post.value = res.data
      totalComments.value = post.value?.commentCount || 0
      markForRefresh('/')

      if (userStore.isLoggedIn) {
        try {
          await addBrowseHistory(postId.value)
        } catch (error) {
          log.error('添加浏览历史失败:', error)
        }
      }
    } else {
      Message.error(res.message || '获取帖子详情失败')
      router.push('/')
    }
  } catch (error) {
    log.error('获取帖子详情失败:', error)
    Message.error('获取帖子详情失败')
    router.push('/')
  } finally {
    loading.value = false
  }
}

// 内容渲染完成后的回调
const onContentRendered = () => {
  nextTick(() => {
    const contentRef = document.querySelector('.post-content-detail')
    if (contentRef) {
      headings.value = extractHeadingsFromDOM(contentRef)
    }
  })
}

// 处理评论变化
const handleCommentChange = (data) => {
  if (data.type === 'add') {
    totalComments.value += 1
    if (post.value) {
      post.value.commentCount = (post.value.commentCount || 0) + 1
    }
  } else if (data.type === 'delete') {
    totalComments.value = Math.max(0, totalComments.value - 1)
    if (post.value) {
      post.value.commentCount = Math.max(0, (post.value.commentCount || 1) - 1)
    }
  }
}

// 处理登录跳转
const handleLogin = () => {
  router.push('/auth?mode=login')
}

// 处理关注变化
const handleFollowChange = (data) => {
  // 可以在这里处理关注变化后的逻辑，比如发送通知等
}

// 轮询刷新帖子数据
const fetchPostUpdate = async () => {
  if (!postId.value || !post.value) return
  try {
    const res = await getPostDetail(postId.value, true)
    if (res.code === 200 && res.data) {
      post.value = {
        ...post.value,
        likeCount: res.data.likeCount,
        commentCount: res.data.commentCount,
        viewCount: res.data.viewCount,
        isLiked: res.data.isLiked,
        isFavorited: res.data.isFavorited,
      }
      totalComments.value = res.data.commentCount || 0
    }
  } catch (error) {
    log.error('轮询刷新失败:', error)
  }
}

const { pause: pausePolling, resume: resumePolling } = useIntervalFn(fetchPostUpdate, 30000, {
  immediate: false,
})

// 页面不可见时暂停轮询，可见时恢复
const documentVisibility = useDocumentVisibility()
watch(documentVisibility, (visibility) => {
  if (visibility === 'hidden') {
    pausePolling()
  } else if (visibility === 'visible' && postId.value) {
    resumePolling()
  }
})

// 监听帖子 ID 变化
watch(
  postId,
  (newId, oldId) => {
    if (!newId) {
      pausePolling()
      return
    }
    if (oldId && newId !== oldId) {
      headings.value = []
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    fetchPostDetail()
    resumePolling()
  },
  { immediate: true },
)

onScopeDispose(() => {
  pausePolling()
})
</script>

<style lang="scss" scoped>
  .post-detail-page {
    padding: 24px;
    min-height: 100%;
    background-color: var(--color-bg-1);
  }

  @media (max-width: 992px) {
    .left-sidebar {
      display: none;
    }
  }

  .post-main {
    min-width: 0;
  }

  .post-card {
    border-radius: 12px;
    margin-bottom: 16px;
    background-color: var(--color-bg-2);
    border-color: var(--color-border-2);

    :deep(.arco-card-body) {
      padding: 16px;
    }
  }

  .post-sidebar {
    max-height: calc(100vh - 200px);
    overflow-y: visible;
    padding-right: 4px;
  }

  @media (max-width: 1200px) {
    .post-sidebar {
      max-height: calc(100vh - 180px);
    }
  }

  @media (max-width: 992px) {
    .post-detail-page {
      padding: 16px;
    }
  }

  @media (max-width: 768px) {
    .post-detail-page {
      padding: 12px;
    }

    .post-card {
      :deep(.arco-card-body) {
        padding: 16px;
      }
    }
  }
</style>
