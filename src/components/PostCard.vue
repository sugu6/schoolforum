<template>
  <a-card class="post-card" :class="{ 'post-card-detail': isDetailMode }" :hoverable="!isDetailMode"
    @click="handleCardClick">
    <div class="post-header">
      <a-popover trigger="hover" position="bottom" :popup-visible="popoverVisible"
        @popup-visible-change="handlePopoverChange" :content-style="{ padding: '0' }"
        :arrow-style="{ display: 'none' }">
        <a-avatar :size="isDetailMode ? 40 : 40" class="author-avatar">
          <img v-if="getAvatarURL(post.authorAvatar)" :src="getAvatarURL(post.authorAvatar)" />
          <icon-user v-else />
        </a-avatar>
        <template #content>
          <div class="author-popover" @click.stop>
            <div class="popover-header">
              <a-avatar :size="64" class="popover-avatar">
                <img v-if="getAvatarURL(post.authorAvatar)" :src="getAvatarURL(post.authorAvatar)" />
                <icon-user v-else />
              </a-avatar>
              <div class="popover-user-info">
                <span class="popover-username">
                  {{ post.authorName }}
                  <IconMan v-if="authorGender === 'MALE'" class="gender-icon male" />
                  <IconWoman v-else-if="authorGender === 'FEMALE'" class="gender-icon female" />
                </span>
                <span class="popover-bio">{{ authorBio }}</span>
              </div>
            </div>
            <div class="popover-stats">
              <div class="stat-item">
                <span class="stat-value clickable" @click.stop="goToUserPage('posts')">{{
                  authorStats.postCount || 0
                  }}</span>
                <span class="stat-label">帖子</span>
              </div>
              <div class="stat-item">
                <span class="stat-value clickable" @click.stop="goToUserPage('following')">{{
                  authorStats.followingCount || 0
                  }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item">
                <span class="stat-value clickable" @click.stop="goToUserPage('followers')">{{
                  authorStats.followerCount || 0
                  }}</span>
                <span class="stat-label">粉丝</span>
              </div>
            </div>
            <div class="popover-actions" v-if="userStore.isLoggedIn && !isCurrentUser">
              <a-button :type="isFollowed ? 'secondary' : 'primary'" size="small" :loading="followLoading"
                @click.stop="handleFollow">
                {{ isFollowed ? '已关注' : '关注' }}
              </a-button>
              <a-button type="outline" size="small" @click.stop="handlePrivateMessage">
                <template #icon><icon-message /></template>
                私信
              </a-button>
            </div>
          </div>
        </template>
      </a-popover>
      <div class="post-meta">
        <span class="author-name">{{ post.authorName }}</span>
        <span class="post-time">
          <template v-if="post.updatedAt && post.updatedAt !== post.createdAt">
            更新于 {{ formatTime(post.updatedAt) }}
          </template>
          <template v-else> 发布于 {{ formatTime(post.createdAt) }} </template>
          <a-tag v-if="displayTags && displayTags.length" v-for="tag in displayTags" :key="tag" color="blue"
            size="small" class="inline-tag">
            {{ tag }}
          </a-tag>
        </span>
      </div>
      <a-tag v-if="isPinned" color="red" size="small">置顶</a-tag>
      <a-tag v-if="isEssential" color="gold" size="small">精华</a-tag>
      <a-tag v-if="displayCategoryName" :color="getTagColor(displayParentCategory || displayCategoryName)" size="small">
        {{ displayCategoryName }}
      </a-tag>
    </div>

    <div class="post-body">
      <!-- 只在列表模式显示标题，详情模式标题已包含在 Markdown 内容中 -->
      <h3 v-if="!isDetailMode" class="post-title" :innerHTML="highlightedTitle"></h3>
      <template v-if="isDetailMode">
        <div ref="contentRef" class="post-content-detail markdown-body" v-html="renderedContent"></div>
      </template>
      <template v-else>
        <p class="post-content">{{ contentSummary }}</p>
      </template>
    </div>

    <div v-if="coverImageUrl && !isDetailMode" class="post-images">
      <img :src="coverImageUrl" class="post-image" @click.stop="openImagePreview" />
    </div>

    <div v-if="isDetailMode && post.coverImage" class="post-bottom-section">
      <div class="post-images">
        <img :src="coverImageUrl" class="post-image" @click.stop="openImagePreview" />
      </div>
      <div class="post-publish-time">发布于 {{ formatDateTime(post.createdAt) }}</div>
    </div>

    <ImagePreview ref="imagePreviewRef" :images="previewImages" />

    <div class="post-footer">
      <div class="post-stats">
        <span><icon-eye /> {{ post.viewCount || 0 }}</span>
        <span><icon-message /> {{ post.commentCount || 0 }}</span>
        <span class="like-btn" :class="{ active: postIsLiked, 'animate-heart-pop': likeAnimating }" @click="handleLike">
          <icon-thumb-up-fill v-if="postIsLiked" class="like-icon" />
          <icon-thumb-up v-else class="like-icon" />
          <span class="like-count">{{ post.likeCount || 0 }}</span>
        </span>
        <span class="favorite-btn" :class="{ active: postIsFavorited, 'animate-star-spin': favoriteAnimating }"
          @click="handleFavorite">
          <icon-star-fill v-if="postIsFavorited" class="favorite-icon" />
          <icon-star v-else class="favorite-icon" />
          <span class="favorite-count">{{ post.favoriteCount || 0 }}</span>
        </span>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconEye,
  IconMessage,
  IconThumbUp,
  IconThumbUpFill,
  IconUser,
  IconStar,
  IconStarFill,
  IconMan,
  IconWoman,
} from '@arco-design/web-vue/es/icon'
import { getAvatarURL, getImageURL } from '@/config/server'
import { stripMarkdown, extractImages, renderMarkdownAsync } from '@/utils/markdown'
import { getUserInfoById, getUserPosts } from '@/apis/users'
import { likePost, unlikePost, favoritePost, unfavoritePost } from '@/apis/posts'
import {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowingList,
  getFollowersList,
} from '@/apis/follows'
import { useUserStore } from '@/stores/user'
import { Message } from '@arco-design/web-vue'
import ImagePreview from './ImagePreview.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  highlightKeyword: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: 'list',
    validator: (value) => ['list', 'detail'].includes(value),
  },
})

const emit = defineEmits(['content-rendered'])

const router = useRouter()
const userStore = useUserStore()

const isDetailMode = computed(() => props.mode === 'detail')

const categoryColorMap = {
  学习: 'arcoblue',
  生活: 'green',
  活动: 'orangered',
  求职: 'purple',
  交易: 'cyan',
}

const popoverVisible = ref(false)
const authorBio = ref('这个人很懒，什么都没写~')
const authorGender = ref('SECRET')
const authorStats = ref({
  postCount: 0,
  followerCount: 0,
  followingCount: 0,
})
const toBool = (val) => val === true || val === 'true' || val === 1 || val === '1'

const authorPrivacy = ref({
  showFollowing: true,
  showFollowers: true,
})
const isFollowed = ref(false)
const followLoading = ref(false)
const userInfoLoaded = ref(false)
const isLiked = ref(false)
const likeLoading = ref(false)
const isFavorited = ref(false)
const favoriteLoading = ref(false)
const likeAnimating = ref(false)
const favoriteAnimating = ref(false)

const contentRef = ref(null)
const renderedContent = ref('')
const markdownImages = ref([])

const getTagColor = (category) => {
  return categoryColorMap[category] || 'gray'
}

const isPinned = computed(() => {
  return props.post.isPinned === 'PINNED' || props.post.isPinned === 1
})

const isEssential = computed(() => {
  return props.post.isEssential === 'ESSENTIAL' || props.post.isEssential === 1
})

const isCurrentUser = computed(() => {
  return (
    userStore.userId &&
    props.post.authorId &&
    String(userStore.userId) === String(props.post.authorId)
  )
})

const postIsLiked = computed({
  get: () => {
    if (props.post.isLiked !== undefined) {
      return props.post.isLiked
    }
    return isLiked.value
  },
  set: (val) => {
    isLiked.value = val
  },
})

const postIsFavorited = computed({
  get: () => {
    if (props.post.isFavorited !== undefined) {
      return props.post.isFavorited
    }
    return isFavorited.value
  },
  set: (val) => {
    isFavorited.value = val
  },
})

const displayTags = computed(() => {
  if (props.post.tagNames && props.post.tagNames.length) {
    return props.post.tagNames
  }
  if (props.post.tags) {
    if (Array.isArray(props.post.tags)) {
      return props.post.tags
    }
    if (typeof props.post.tags === 'string' && props.post.tags.trim()) {
      return props.post.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    }
  }
  return []
})

const displayCategoryName = computed(() => {
  return props.post.categoryName || props.post.category || ''
})

const displayParentCategory = computed(() => {
  return props.post.parentCategoryName || ''
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const contentSummary = computed(() => {
  return props.post.contentSummary || stripMarkdown(props.post.content, 150)
})

const highlightedTitle = computed(() => {
  if (!props.highlightKeyword || !props.post.title) return props.post.title
  const regex = new RegExp(
    `(${props.highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  )
  return props.post.title.replace(regex, '<mark class="highlight">$1</mark>')
})

const coverImageUrl = computed(() => {
  if (props.post.coverImage) {
    let imageUrl = props.post.coverImage.trim()
    if (imageUrl.startsWith('`') && imageUrl.endsWith('`')) {
      imageUrl = imageUrl.slice(1, -1).trim()
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    return getImageURL(imageUrl)
  }
  const images = extractImages(props.post.content, 1)
  if (images.length > 0) {
    return images[0].url
  }
  return null
})

const previewImages = computed(() => {
  const images = []
  // 优先使用 coverImage，否则使用从内容提取的封面图
  if (props.post.coverImage) {
    images.push(getImageURL(props.post.coverImage))
  } else if (coverImageUrl.value) {
    images.push(coverImageUrl.value)
  }
  if (markdownImages.value.length > 0) {
    images.push(...markdownImages.value)
  }
  return images
})

const imagePreviewRef = ref(null)

const openImagePreview = () => {
  if (imagePreviewRef.value && previewImages.value.length > 0) {
    imagePreviewRef.value.open(0)
  }
}

const handlePopoverChange = async (visible) => {
  popoverVisible.value = visible
  if (visible && props.post.authorId) {
    await fetchAuthorInfo()
  }
}

const fetchAuthorInfo = async () => {
  if (!props.post.authorId) return
  try {
    if (!userInfoLoaded.value) {
      const [userRes, postsRes, followingRes, followersRes] = await Promise.all([
        getUserInfoById(props.post.authorId),
        getUserPosts(props.post.authorId, { pageNumber: 1, pageSize: 1 }),
        getFollowingList(props.post.authorId, { pageNumber: 1, pageSize: 1 }),
        getFollowersList(props.post.authorId, { pageNumber: 1, pageSize: 1 }),
      ])

      if (userRes.code === 200 && userRes.data) {
        authorBio.value = userRes.data.bio || '这个人很懒，什么都没写~'
        authorGender.value = userRes.data.gender || 'SECRET'

        const newShowFollowing = userRes.data.showFollowing
        const newShowFollowers = userRes.data.showFollowers

        authorPrivacy.value = {
          showFollowing: toBool(newShowFollowing),
          showFollowers: toBool(newShowFollowers),
        }
      }

      const postCount =
        postsRes.code === 200 ? postsRes.data?.totalRow || postsRes.data?.total || 0 : 0
      const followingCount =
        followingRes.code === 200 ? followingRes.data?.totalRow || followingRes.data?.total || 0 : 0
      const followerCount =
        followersRes.code === 200 ? followersRes.data?.totalRow || followersRes.data?.total || 0 : 0

      authorStats.value = {
        postCount,
        followingCount,
        followerCount,
      }

      userInfoLoaded.value = true
    }

    if (userStore.isLoggedIn && !isCurrentUser.value) {
      const followRes = await checkFollowStatus(props.post.authorId)
      if (followRes.code === 200) {
        isFollowed.value = followRes.data?.isFollowing === true
      }
    }
  } catch (error) {
    console.error('获取作者信息失败:', error)
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
      const res = await unfollowUser(props.post.authorId)
      if (res.code === 200) {
        isFollowed.value = false
        authorStats.value.followerCount = Math.max(0, authorStats.value.followerCount - 1)
        Message.success('已取消关注')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await followUser(props.post.authorId)
      if (res.code === 200) {
        isFollowed.value = true
        authorStats.value.followerCount += 1
        Message.success('关注成功')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    console.error('关注操作失败:', error)
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
  router.push(
    `/chat?userId=${props.post.authorId}&username=${encodeURIComponent(props.post.authorName)}`,
  )
}

const goToUserPage = (tab = 'posts') => {
  if (!props.post.authorId) return
  router.push(`/user/${props.post.authorId}?tab=${tab}`)
}

const handleCardClick = () => {
  if (!isDetailMode.value) {
    router.push(`/post/${props.post.id}`)
  }
}

const setupImagePreview = () => {
  if (!contentRef.value) return

  const images = contentRef.value.querySelectorAll('img')
  const imgUrls = []

  // 修正所有未转换的相对图片URL（兜底 processImagePaths 可能遗漏的情况）
  images.forEach((img) => {
    const src = img.getAttribute('src')
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const fixed = getImageURL(src)
      if (fixed) {
        img.setAttribute('src', fixed)
      }
    }
  })

  // 收集所有图片URL
  images.forEach((img) => {
    const src = img.getAttribute('src')
    if (src) {
      imgUrls.push(src)
    }
  })

  // 如果有多张图片，用网格容器包裹
  if (images.length > 1) {
    const imagesContainer = document.createElement('div')
    imagesContainer.className = 'post-images markdown-images'

    // 先隐藏所有原始图片
    images.forEach((img) => {
      img.style.display = 'none'
    })

    // 创建新的图片元素放入容器
    images.forEach((img, index) => {
      const newImg = document.createElement('img')
      newImg.src = img.getAttribute('src')
      newImg.className = 'post-image'
      newImg.style.cursor = 'pointer'
      newImg.addEventListener('click', (e) => {
        e.stopPropagation()
        const coverImageCount = props.post.coverImage ? 1 : 0
        const imageIndex = coverImageCount + index
        if (imagePreviewRef.value) {
          imagePreviewRef.value.open(imageIndex)
        }
      })
      imagesContainer.appendChild(newImg)
    })

    contentRef.value.appendChild(imagesContainer)
  } else if (images.length === 1) {
    // 单张图片也使用 post-images 容器，保持和封面图一致
    const img = images[0]
    const imagesContainer = document.createElement('div')
    imagesContainer.className = 'post-images markdown-images'

    // 隐藏原始图片
    img.style.display = 'none'

    // 创建新的图片元素
    const newImg = document.createElement('img')
    newImg.src = img.getAttribute('src')
    newImg.className = 'post-image'
    newImg.style.cursor = 'pointer'
    newImg.addEventListener('click', (e) => {
      e.stopPropagation()
      const coverImageCount = props.post.coverImage ? 1 : 0
      const imageIndex = coverImageCount
      if (imagePreviewRef.value) {
        imagePreviewRef.value.open(imageIndex)
      }
    })
    imagesContainer.appendChild(newImg)

    contentRef.value.appendChild(imagesContainer)
  }

  markdownImages.value = imgUrls
}

watch(
  () => props.post.content,
  async (newContent) => {
    if (isDetailMode.value && newContent) {
      // 将标题添加到 Markdown 内容开头，以便目录能提取到
      const title = props.post.title
      const contentWithTitle = title ? `# ${title}\n\n${newContent}` : newContent
      renderedContent.value = await renderMarkdownAsync(contentWithTitle)
      await nextTick()
      setupImagePreview()
      emit('content-rendered')
    }
  },
  { immediate: true },
)

const handleLike = async (event) => {
  event.stopPropagation()
  if (likeLoading.value) return

  likeAnimating.value = true
  setTimeout(() => {
    likeAnimating.value = false
  }, 450)

  likeLoading.value = true
  try {
    if (postIsLiked.value) {
      const res = await unlikePost(props.post.id)
      if (res.code === 200) {
        postIsLiked.value = false
        props.post.likeCount = Math.max(0, (props.post.likeCount || 1) - 1)
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await likePost(props.post.id)
      if (res.code === 200) {
        postIsLiked.value = true
        props.post.likeCount = (props.post.likeCount || 0) + 1
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    Message.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

const handleFavorite = async (event) => {
  event.stopPropagation()
  if (favoriteLoading.value) return

  favoriteAnimating.value = true
  setTimeout(() => {
    favoriteAnimating.value = false
  }, 450)

  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }

  favoriteLoading.value = true
  try {
    if (postIsFavorited.value) {
      const res = await unfavoritePost(props.post.id)
      if (res.code === 200) {
        postIsFavorited.value = false
        props.post.favoriteCount = Math.max(0, (props.post.favoriteCount || 1) - 1)
        Message.success('已取消收藏')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await favoritePost(props.post.id)
      if (res.code === 200) {
        postIsFavorited.value = true
        props.post.favoriteCount = (props.post.favoriteCount || 0) + 1
        Message.success('收藏成功')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    Message.error('操作失败')
  } finally {
    favoriteLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
  @use '../styles/animations.scss';

  .post-card {
    margin-bottom: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    :deep(.arco-card-body) {
      padding: 16px;
    }
  }

  .post-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .author-avatar {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }

  .author-popover {
    width: 280px;
    padding: 16px;
  }

  .popover-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .popover-avatar {
    flex-shrink: 0;
    background: rgb(var(--primary-6));
  }

  .popover-user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .popover-username {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;

    .gender-icon {
      flex-shrink: 0;
      font-size: 16px;

      &.male {
        color: #1890ff;
      }

      &.female {
        color: #eb2f96;
      }
    }
  }

  .popover-bio {
    font-size: 13px;
    color: var(--color-text-3);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .popover-stats {
    display: flex;
    justify-content: space-around;
    padding: 12px 0;
    border-top: 1px solid var(--color-border-2);
    border-bottom: 1px solid var(--color-border-2);
    margin-bottom: 12px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);

    &.clickable {
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: rgb(var(--primary-6));
      }
    }
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-3);
  }

  .popover-actions {
    display: flex;
    gap: 8px;

    :deep(.arco-btn) {
      flex: 1;
    }
  }

  .post-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .author-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-1);
  }

  .post-time {
    font-size: 12px;
    color: var(--color-text-3);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inline-tag {
    margin-left: 4px;
  }

  .post-body {
    margin-bottom: 12px;
  }

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

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      color: var(--color-text-1);
      margin: 24px 0 16px;
      font-weight: 600;
      line-height: 1.4;
    }

    :deep(h1) {
      font-size: 28px;
    }

    :deep(h2) {
      font-size: 24px;
    }

    :deep(h3) {
      font-size: 20px;
    }

    :deep(h4) {
      font-size: 18px;
    }

    :deep(h5) {
      font-size: 16px;
    }

    :deep(h6) {
      font-size: 15px;
    }

    :deep(a) {
      color: rgb(var(--primary-6));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(.markdown-images) {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 16px 0;

      .post-image {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 8px;
      }
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

      code {
        background: transparent;
        padding: 0;
      }
    }

    :deep(blockquote) {
      border-left: 4px solid rgb(var(--primary-6));
      padding-left: 16px;
      margin: 16px 0;
      color: var(--color-text-3);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 24px;
      margin-bottom: 16px;
    }

    :deep(li) {
      margin-bottom: 8px;
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid var(--color-border-2);
      padding: 8px 12px;
      text-align: left;
    }

    :deep(th) {
      background: var(--color-fill-2);
      font-weight: 600;
    }

    :deep(hr) {
      border: none;
      border-top: 1px solid var(--color-border-2);
      margin: 24px 0;
    }
  }

  .post-title-detail {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .post-bottom-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 12px;
    min-height: 40px;

    .post-images {
      flex: 0 0 auto;
      width: 100%;
      max-width: 33.333%;
      grid-template-columns: 1fr;
    }
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

    :deep(.arco-card-body) {
      padding: 20px;
    }
  }

  .post-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .post-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 8px;
  }

  .post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
  }

  .post-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--color-text-3);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .like-btn {
      cursor: pointer;
      user-select: none;

      .like-icon {
        transition: color 0.2s ease;
        color: var(--color-text-3);
      }

      &:hover .like-icon {
        color: rgb(var(--primary-6));
      }

      &.active .like-icon {
        color: rgb(var(--primary-6));
      }

      .like-count {
        color: var(--color-text-3);
      }
    }

    .favorite-btn {
      cursor: pointer;
      user-select: none;

      .favorite-icon {
        transition: color 0.2s ease;
        color: var(--color-text-3);
      }

      &:hover .favorite-icon {
        color: rgb(var(--warning-6));
      }

      &.active .favorite-icon {
        color: rgb(var(--warning-6));
      }

      .favorite-count {
        color: var(--color-text-3);
      }
    }
  }

  .highlight {
    background-color: rgb(var(--warning-3));
    color: var(--color-text-1);
    padding: 0 2px;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    .post-images {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 576px) {
    .post-images {
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .post-image {
      border-radius: 6px;
    }
  }
</style>
