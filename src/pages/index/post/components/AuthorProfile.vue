﻿<template>
  <a-card class="author-card sidebar-card" :bordered="true" :loading="loading">
    <div v-if="!loading && authorInfo.id" class="author-profile">
      <a-avatar :size="64" class="profile-avatar">
        <img v-if="authorAvatar" :src="authorAvatar" />
        <IconUser v-else />
      </a-avatar>
      <h3 class="profile-name">
        {{ authorInfo.name || authorInfo.username }}
        <IconMan v-if="authorInfo.gender === 'MALE'" class="gender-icon male" />
        <IconWoman v-else-if="authorInfo.gender === 'FEMALE'" class="gender-icon female" />
      </h3>
      <p class="profile-bio">{{ authorInfo.bio || '这个人很懒，什么都没写~' }}</p>

      <div class="author-stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.postCount || 0 }}</span>
          <span class="stat-label">帖子</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.followerCount || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.followingCount || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
      </div>

      <a-button
        v-if="!isCurrentUser"
        :type="isFollowed ? 'secondary' : 'primary'"
        long
        :loading="followLoading"
        @click="handleFollowToggle"
      >
        <IconPlus v-if="!isFollowed" />
        {{ isFollowed ? '已关注' : '关注' }}
      </a-button>
    </div>
  </a-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconMan, IconWoman, IconPlus } from '@arco-design/web-vue/es/icon'
import { getUserInfoById, getUserPosts } from '@/apis/users'
import {
  getFollowingList,
  getFollowersList,
  followUser,
  unfollowUser,
  checkFollowStatus,
} from '@/apis/follows'
import { useUserStore } from '@/stores/user'
import log from '@/utils/logger'
import { getAvatarURL } from '@/config/server'

const router = useRouter()
const props = defineProps({
  authorId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['follow-change'])

const userStore = useUserStore()
const loading = ref(true)
const authorInfo = ref({})
const stats = ref({
  postCount: 0,
  followerCount: 0,
  followingCount: 0,
})
const isFollowed = ref(false)
const followLoading = ref(false)

const isCurrentUser = computed(() => {
  return userStore.userId && String(userStore.userId) === String(props.authorId)
})

const authorAvatar = computed(() => {
  return getAvatarURL(authorInfo.value?.avatarUrl || authorInfo.value?.avatar || '')
})

const fetchAuthorInfo = async () => {
  if (!props.authorId) return

  loading.value = true
  try {
    const [userRes, postsRes, followingRes, followersRes] = await Promise.all([
      getUserInfoById(props.authorId),
      getUserPosts(props.authorId, { pageNumber: 1, pageSize: 1 }),
      getFollowingList(props.authorId, { pageNumber: 1, pageSize: 1 }),
      getFollowersList(props.authorId, { pageNumber: 1, pageSize: 1 }),
    ])

    if (userRes.code === 200 && userRes.data) {
      authorInfo.value = userRes.data
    }

    const postCount =
      postsRes.code === 200 ? postsRes.data?.totalRow || postsRes.data?.total || 0 : 0
    const followingCount =
      followingRes.code === 200 ? followingRes.data?.totalRow || followingRes.data?.total || 0 : 0
    const followerCount =
      followersRes.code === 200 ? followersRes.data?.totalRow || followersRes.data?.total || 0 : 0

    stats.value = {
      postCount,
      followingCount,
      followerCount,
    }

    if (userStore.isLoggedIn && !isCurrentUser.value) {
      const followRes = await checkFollowStatus(props.authorId)
      if (followRes.code === 200) {
        isFollowed.value = followRes.data?.isFollowing === true
      }
    }
  } catch (error) {
    log.error('获取作者信息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFollowToggle = async () => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  if (isCurrentUser.value) return

  followLoading.value = true
  try {
    if (isFollowed.value) {
      const res = await unfollowUser(props.authorId)
      if (res.code === 200) {
        isFollowed.value = false
        stats.value.followerCount = Math.max(0, stats.value.followerCount - 1)
        Message.success('已取消关注')
        emit('follow-change', { isFollowed: false })
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await followUser(props.authorId)
      if (res.code === 200) {
        isFollowed.value = true
        stats.value.followerCount += 1
        Message.success('关注成功')
        emit('follow-change', { isFollowed: true })
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    log.error('关注操作失败:', error)
    Message.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

watch(
  () => props.authorId,
  () => {
    if (props.authorId) {
      fetchAuthorInfo()
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.sidebar-card {
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: var(--color-bg-2);
  border-color: var(--color-border-2);
}

.author-profile {
  text-align: center;
}

.profile-avatar {
  background: rgb(var(--primary-6));
  color: #fff;
  margin-bottom: 12px;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  .gender-icon {
    flex-shrink: 0;
    font-size: 18px;

    &.male {
      color: #1890ff;
    }

    &.female {
      color: #eb2f96;
    }
  }
}

.profile-bio {
  font-size: 13px;
  color: var(--color-text-3);
  line-height: 1.5;
  margin-bottom: 16px;
}

.author-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--color-border-2);
  border-bottom: 1px solid var(--color-border-2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}
</style>
