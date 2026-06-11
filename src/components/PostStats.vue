<template>
  <div class="post-stats">
    <span><icon-eye /> {{ viewCount || 0 }}</span>
    <span><icon-message /> {{ commentCount || 0 }}</span>
    <span class="like-btn" :class="{ active: isLiked, 'animate-heart-pop': likeAnimating }" @click="handleLike">
      <icon-thumb-up-fill v-if="isLiked" class="like-icon" />
      <icon-thumb-up v-else class="like-icon" />
      <span class="like-count">{{ localLikeCount }}</span>
    </span>
    <span class="favorite-btn" :class="{ active: isFavorited, 'animate-star-spin': favoriteAnimating }"
      @click="handleFavorite">
      <icon-star-fill v-if="isFavorited" class="favorite-icon" />
      <icon-star v-else class="favorite-icon" />
      <span class="favorite-count">{{ localFavoriteCount }}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconEye, IconMessage, IconThumbUp, IconThumbUpFill, IconStar, IconStarFill } from '@arco-design/web-vue/es/icon'
import { likePost, unlikePost, favoritePost, unfavoritePost } from '@/apis/posts'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import log from '@/utils/logger'

const props = defineProps({
  postId: { type: [Number, String], required: true },
  viewCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  favoriteCount: { type: Number, default: 0 },
  liked: { type: Boolean, default: false },
  favorited: { type: Boolean, default: false },
})

const emit = defineEmits(['update:likeCount', 'update:favoriteCount', 'update:liked', 'update:favorited'])

const router = useRouter()
const userStore = useUserStore()

const likeLoading = ref(false)
const favoriteLoading = ref(false)
const likeAnimating = ref(false)
const favoriteAnimating = ref(false)
const localLikeCount = ref(props.likeCount)
const localFavoriteCount = ref(props.favoriteCount)
const localLiked = ref(props.liked)
const localFavorited = ref(props.favorited)

const showApiError = (res) => Message.error(res.msg || res.message || '操作失败')

const isLiked = computed({
  get: () => localLiked.value,
  set: (val) => {
    localLiked.value = val
    emit('update:liked', val)
  },
})

const isFavorited = computed({
  get: () => localFavorited.value,
  set: (val) => {
    localFavorited.value = val
    emit('update:favorited', val)
  },
})

const handleLike = async (event) => {
  event.stopPropagation()
  if (likeLoading.value) return

  likeAnimating.value = true
  setTimeout(() => { likeAnimating.value = false }, 450)

  likeLoading.value = true
  try {
    if (isLiked.value) {
      const res = await unlikePost(props.postId)
      if (res.code === 200) {
        isLiked.value = false
        localLikeCount.value = Math.max(0, (localLikeCount.value || 1) - 1)
      } else {
        return showApiError(res)
      }
    } else {
      const res = await likePost(props.postId)
      if (res.code === 200) {
        isLiked.value = true
        localLikeCount.value = (localLikeCount.value || 0) + 1
      } else {
        return showApiError(res)
      }
    }
    emit('update:likeCount', localLikeCount.value)
  } catch (error) {
    log.error('点赞操作失败:', error)
    showApiError({ message: '操作失败' })
  } finally {
    likeLoading.value = false
  }
}

const handleFavorite = async (event) => {
  event.stopPropagation()
  if (favoriteLoading.value) return

  favoriteAnimating.value = true
  setTimeout(() => { favoriteAnimating.value = false }, 450)

  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }

  favoriteLoading.value = true
  try {
    if (isFavorited.value) {
      const res = await unfavoritePost(props.postId)
      if (res.code === 200) {
        isFavorited.value = false
        localFavoriteCount.value = Math.max(0, (localFavoriteCount.value || 1) - 1)
        Message.success('已取消收藏')
      } else {
        return showApiError(res)
      }
    } else {
      const res = await favoritePost(props.postId)
      if (res.code === 200) {
        isFavorited.value = true
        localFavoriteCount.value = (localFavoriteCount.value || 0) + 1
        Message.success('收藏成功')
      } else {
        return showApiError(res)
      }
    }
    emit('update:favoriteCount', localFavoriteCount.value)
  } catch (error) {
    log.error('收藏操作失败:', error)
    showApiError({ message: '操作失败' })
  } finally {
    favoriteLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/animations.scss';

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

  @media (max-width: 576px) {
    gap: 12px;
    font-size: 12px;
  }

  .like-btn {
    cursor: pointer;
    user-select: none;

    .like-icon {
      transition: color 0.2s ease;
      color: var(--color-text-3);
    }

    &:hover .like-icon { color: rgb(var(--primary-6)); }
    &.active .like-icon { color: rgb(var(--primary-6)); }

    .like-count { color: var(--color-text-3); }
  }

  .favorite-btn {
    cursor: pointer;
    user-select: none;

    .favorite-icon {
      transition: color 0.2s ease;
      color: var(--color-text-3);
    }

    &:hover .favorite-icon { color: rgb(var(--warning-6)); }
    &.active .favorite-icon { color: rgb(var(--warning-6)); }

    .favorite-count { color: var(--color-text-3); }
  }
}
</style>
