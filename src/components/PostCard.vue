<template>
  <a-card class="post-card" :class="{ 'post-card-detail': isDetailMode }" :hoverable="!isDetailMode"
    @click="handleCardClick">
    <div class="post-header">
      <AuthorPopover
        :author-id="localPost.authorId"
        :author-name="localPost.authorName"
        :avatar="localPost.authorAvatar"
        v-model:visible="popoverVisible"
        :show-actions="userStore.isLoggedIn && !isCurrentUser"
        :is-followed="isFollowed"
        :follow-loading="followLoading"
        @follow="handleFollow"
        @private-message="handlePrivateMessage"
        @author-loaded="onAuthorLoaded"
      />
      <div class="post-meta">
        <span class="author-name">{{ localPost.authorName }}</span>
        <span class="post-time">
          <template v-if="localPost.updatedAt && localPost.updatedAt !== localPost.createdAt">
            更新于 {{ formatTime(localPost.updatedAt) }}
          </template>
          <template v-else> 发布于 {{ formatTime(localPost.createdAt) }} </template>
          <span class="inline-tags" v-if="displayTags && displayTags.length">
            <a-tag v-for="tag in displayTags" :key="tag" color="blue" size="small" class="inline-tag">
              {{ tag }}
            </a-tag>
          </span>
        </span>
      </div>
      <a-tag v-if="isPinned" color="red" size="small" class="pinned-tag">置顶</a-tag>
      <a-tag v-if="isEssential" color="gold" size="small" class="essential-tag">精华</a-tag>
      <a-tag v-if="displayCategoryName" :color="getTagColor(displayParentCategory || displayCategoryName)" size="small" class="category-tag-mobile">
        {{ displayCategoryName }}
      </a-tag>
    </div>

    <div class="post-body">
      <h3 v-if="!isDetailMode" class="post-title" :innerHTML="highlightedTitle"></h3>
      <template v-if="isDetailMode">
        <div ref="contentRef" class="post-content-detail markdown-body" v-html="renderedContent"></div>
      </template>
      <p v-else class="post-content">{{ contentSummary }}</p>
    </div>

    <div v-if="coverImageUrl && !isDetailMode" class="post-images">
      <img :src="coverImageUrl" class="post-image" @click.stop="openImagePreview" />
    </div>

    <div v-if="isDetailMode && localPost.coverImage" class="post-bottom-section">
      <div class="post-images">
        <img :src="coverImageUrl" class="post-image" @click.stop="openImagePreview" />
      </div>
      <div class="post-publish-time">发布于 {{ formatDateTime(localPost.createdAt) }}</div>
    </div>

    <ImagePreview ref="imagePreviewRef" :images="previewImages" />

    <div class="post-footer">
      <PostStats
        :post-id="localPost.id"
        :view-count="localPost.viewCount"
        :comment-count="localPost.commentCount"
        :like-count="localPost.likeCount"
        :favorite-count="localPost.favoriteCount"
        :liked="localPost.isLiked"
        :favorited="localPost.isFavorited"
        @update:like-count="localPost.likeCount = $event"
        @update:favorite-count="localPost.favoriteCount = $event"
        @update:liked="localPost.isLiked = $event"
        @update:favorited="localPost.isFavorited = $event"
      />
    </div>
  </a-card>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getImageURL } from '@/config/server'
import { stripMarkdown, extractImages, renderMarkdownAsync, escapeHtml } from '@/utils/markdown'
import { followUser, unfollowUser } from '@/apis/follows'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import ImagePreview from './ImagePreview.vue'
import AuthorPopover from './AuthorPopover.vue'
import PostStats from './PostStats.vue'
import log from '@/utils/logger'

const props = defineProps({
  post: { type: Object, required: true },
  highlightKeyword: { type: String, default: '' },
  mode: { type: String, default: 'list', validator: (v) => ['list', 'detail'].includes(v) },
})

const emit = defineEmits(['content-rendered'])

const router = useRouter()
const userStore = useUserStore()

const localPost = ref({ ...props.post })
watch(() => props.post, (newPost) => {
  Object.assign(localPost.value, newPost)
}, { deep: true })

const isDetailMode = computed(() => props.mode === 'detail')

const categoryColorMap = { 学习: 'arcoblue', 生活: 'green', 活动: 'orangered', 求职: 'purple', 交易: 'cyan' }
const getTagColor = (category) => categoryColorMap[category] || 'gray'

const popoverVisible = ref(false)
const isFollowed = ref(false)
const followLoading = ref(false)
const authorPrivacy = ref({ showFollowing: true, showFollowers: true })

const contentRef = ref(null)
const renderedContent = ref('')
const markdownImages = ref([])

const isPinned = computed(() => localPost.value.isPinned === 'PINNED' || localPost.value.isPinned === 1)
const isEssential = computed(() => localPost.value.isEssential === 'ESSENTIAL' || localPost.value.isEssential === 1)

const isCurrentUser = computed(() => {
  return userStore.userId && localPost.value.authorId &&
    String(userStore.userId) === String(localPost.value.authorId)
})

const displayTags = computed(() => {
  if (localPost.value.tagNames && localPost.value.tagNames.length) return localPost.value.tagNames
  if (localPost.value.tags) {
    if (Array.isArray(localPost.value.tags)) return localPost.value.tags
    if (typeof localPost.value.tags === 'string' && localPost.value.tags.trim()) {
      return localPost.value.tags.split(',').map((t) => t.trim()).filter(Boolean)
    }
  }
  return []
})

const displayCategoryName = computed(() => localPost.value.categoryName || localPost.value.category || '')
const displayParentCategory = computed(() => localPost.value.parentCategoryName || '')

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const diff = Date.now() - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const contentSummary = computed(() => localPost.value.contentSummary || stripMarkdown(localPost.value.content, 150))

const highlightedTitle = computed(() => {
  if (!props.highlightKeyword || !localPost.value.title) return escapeHtml(localPost.value.title || '')
  const escaped = escapeHtml(localPost.value.title)
  const escapedKeyword = escapeHtml(props.highlightKeyword)
  const regex = new RegExp(`(${escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="highlight">$1</mark>')
})

const coverImageUrl = computed(() => {
  if (localPost.value.coverImage) {
    let imageUrl = localPost.value.coverImage.trim()
    if (imageUrl.startsWith('`') && imageUrl.endsWith('`')) imageUrl = imageUrl.slice(1, -1).trim()
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
    return getImageURL(imageUrl)
  }
  const images = extractImages(localPost.value.content, 1)
  return images.length > 0 ? images[0].url : null
})

const previewImages = computed(() => {
  const images = []
  if (localPost.value.coverImage) images.push(getImageURL(localPost.value.coverImage))
  else if (coverImageUrl.value) images.push(coverImageUrl.value)
  if (markdownImages.value.length > 0) images.push(...markdownImages.value)
  return images
})

const imagePreviewRef = ref(null)
const openImagePreview = () => {
  if (imagePreviewRef.value && previewImages.value.length > 0) imagePreviewRef.value.open(0)
}

const onAuthorLoaded = (userInfo) => {
  const toBool = (val) => val === true || val === 'true' || val === 1 || val === '1'
  authorPrivacy.value = {
    showFollowing: toBool(userInfo.showFollowing),
    showFollowers: toBool(userInfo.showFollowers),
  }
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  if (isCurrentUser.value) return

  followLoading.value = true
  try {
    if (isFollowed.value) {
      const res = await unfollowUser(localPost.value.authorId)
      if (res.code === 200) { isFollowed.value = false; Message.success('已取消关注') }
      else Message.error(res.msg || res.message || '操作失败')
    } else {
      const res = await followUser(localPost.value.authorId)
      if (res.code === 200) { isFollowed.value = true; Message.success('关注成功') }
      else Message.error(res.msg || res.message || '操作失败')
    }
  } catch (error) {
    log.error('关注操作失败:', error)
    Message.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

const handlePrivateMessage = () => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  router.push(`/chat?userId=${localPost.value.authorId}&username=${encodeURIComponent(localPost.value.authorName)}`)
}

const handleCardClick = () => {
  if (!isDetailMode.value) router.push(`/post/${localPost.value.id}`)
}

const setupImagePreview = () => {
  if (!contentRef.value) return

  const existingContainers = contentRef.value.querySelectorAll('.markdown-images')
  existingContainers.forEach(container => container.remove())
  const hiddenImages = contentRef.value.querySelectorAll('img[style*="display: none"]')
  hiddenImages.forEach(img => img.style.display = '')

  const images = contentRef.value.querySelectorAll('img')
  const imgUrls = []

  images.forEach((img) => {
    const src = img.getAttribute('src')
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const fixed = getImageURL(src)
      if (fixed) img.setAttribute('src', fixed)
    }
  })

  images.forEach((img) => {
    const src = img.getAttribute('src')
    if (src) imgUrls.push(src)
  })

  if (images.length > 0) {
    const imagesContainer = document.createElement('div')
    imagesContainer.className = 'post-images markdown-images'
    const coverImageCount = localPost.value.coverImage ? 1 : 0

    images.forEach((img, index) => {
      img.style.display = 'none'
      const newImg = document.createElement('img')
      newImg.src = img.getAttribute('src')
      newImg.className = 'post-image'
      newImg.style.cursor = 'pointer'
      newImg.addEventListener('click', (e) => {
        e.stopPropagation()
        if (imagePreviewRef.value) imagePreviewRef.value.open(coverImageCount + index)
      })
      imagesContainer.appendChild(newImg)
    })

    contentRef.value.appendChild(imagesContainer)
  }

  markdownImages.value = imgUrls
}

watch(() => localPost.value.content, async (newContent) => {
  if (isDetailMode.value && newContent) {
    const title = localPost.value.title
    const contentWithTitle = title ? `# ${title}\n\n${newContent}` : newContent
    renderedContent.value = await renderMarkdownAsync(contentWithTitle)
    await nextTick()
    setupImagePreview()
    emit('content-rendered')
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use '../styles/animations.scss';

.post-card {
  margin-bottom: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  :deep(.arco-card-body) { padding: 16px; }
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name { font-weight: 600; font-size: 14px; color: var(--color-text-1); }

.post-time {
  font-size: 12px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.inline-tag { margin-left: 4px; }

.post-body { margin-bottom: 12px; }

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.post-content {
  font-size: 14px;
  color: var(--color-text-2);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-content-detail {
  font-size: 15px;
  color: var(--color-text-2);
  line-height: 1.8;
  margin: 0;

  :deep(p) { margin-bottom: 16px; }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    color: var(--color-text-1);
    margin: 24px 0 16px;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) { font-size: 28px; }
  :deep(h2) { font-size: 24px; }
  :deep(h3) { font-size: 20px; }
  :deep(h4) { font-size: 18px; }
  :deep(h5) { font-size: 16px; }
  :deep(h6) { font-size: 15px; }

  :deep(a) {
    color: rgb(var(--primary-6));
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  :deep(.markdown-images) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 16px 0;

    .post-image { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; }
  }

  :deep(code) {
    background: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 14px;
  }

  :deep(pre) {
    background: var(--color-fill-2);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;

    code { background: transparent; padding: 0; }
  }

  :deep(blockquote) {
    border-left: 4px solid rgb(var(--primary-6));
    padding-left: 16px;
    margin: 16px 0;
    color: var(--color-text-3);
  }

  :deep(ul), :deep(ol) { padding-left: 24px; margin-bottom: 16px; }
  :deep(li) { margin-bottom: 8px; }

  :deep(table) { width: 100%; border-collapse: collapse; margin: 16px 0; }
  :deep(th), :deep(td) { border: 1px solid var(--color-border-2); padding: 8px 12px; text-align: left; }
  :deep(th) { background: var(--color-fill-2); font-weight: 600; }
  :deep(hr) { border: none; border-top: 1px solid var(--color-border-2); margin: 24px 0; }
}

.post-bottom-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
  min-height: 40px;

  .post-images { flex: 0 0 auto; width: 100%; max-width: 33.333%; grid-template-columns: 1fr; }
}

.post-publish-time {
  font-size: 12px;
  color: var(--color-text-4);
  margin-left: auto;
  padding-bottom: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.post-card-detail {
  cursor: default;
  :deep(.arco-card-body) { padding: 20px; }
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.post-image { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; }

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
}

.highlight {
  background-color: rgb(var(--warning-3));
  color: var(--color-text-1);
  padding: 0 2px;
  border-radius: 2px;
}

@media (max-width: 768px) { .post-images { grid-template-columns: repeat(2, 1fr); } }

@media (max-width: 576px) {
  .post-images { grid-template-columns: 1fr 1fr; gap: 6px; }
  .post-image { border-radius: 6px; }

  .post-header {
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
  }

  .post-meta {
    flex: 1 1 auto;
    min-width: 0;
  }

  .post-time {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .post-time .inline-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .inline-tag {
    margin-left: 0;
    margin-right: 0;
  }

  .pinned-tag, .essential-tag {
    margin-left: auto;
  }

  .category-tag-mobile {
    margin-left: auto;
  }
}
</style>
