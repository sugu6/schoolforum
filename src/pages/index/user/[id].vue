<template>
  <div class="user-profile-page">
    <div class="profile-container">
      <div class="profile-sidebar">
        <a-card class="user-card" :bordered="true" :loading="userLoading">
          <div class="user-avatar-section">
            <a-avatar :size="100" class="avatar">
              <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="avatar" />
              <IconUser v-else :size="48" />
            </a-avatar>
          </div>
          <div class="user-info">
            <h2 class="username">
              {{ userInfo.username || '用户名' }}
              <IconMan v-if="userInfo.gender === 'MALE'" class="gender-icon male" />
              <IconWoman v-else-if="userInfo.gender === 'FEMALE'" class="gender-icon female" />
            </h2>
            <p class="user-bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</p>
          </div>
          <div class="user-stats">
            <div class="stat-item" :class="{ active: activeStatTab === 'posts' }" @click="handleStatClick('posts')">
              <span class="stat-value">{{ userInfo.postCount || 0 }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item" :class="{ active: activeStatTab === 'following' }"
              @click="handleStatClick('following')">
              <span class="stat-value">{{ userInfo.followingCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item" :class="{ active: activeStatTab === 'followers' }"
              @click="handleStatClick('followers')">
              <span class="stat-value">{{ userInfo.followerCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
          </div>
          <div class="user-actions" v-if="userStore.isLoggedIn && !isCurrentUser">
            <a-button :type="isFollowing ? 'secondary' : 'primary'" long :loading="followLoading" @click="handleFollow">
              {{ isFollowing ? '已关注' : '关注' }}
            </a-button>
          </div>
        </a-card>

        <a-card class="info-card" :bordered="true" title="个人信息">
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">
                <IconCalendar />
                注册时间
              </span>
              <span class="info-value">{{ formatDateTime(userInfo.createdAt) || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <IconUser />
                性别
              </span>
              <span class="info-value">{{ genderText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <IconStar />
                等级
              </span>
              <span class="info-value">Lv.{{ userInfo.level }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <div class="profile-main">
        <a-card class="main-card" :bordered="true">
          <template #title>
            <div class="card-title-center">
              <span>{{ statTitles[activeStatTab] || statTitles['posts'] }}</span>
            </div>
          </template>

          <div v-if="activeStatTab === 'posts'" class="stat-posts-section">
            <a-spin :loading="postsLoading" class="favorites-loading">
              <div v-if="userPosts.length > 0" class="favorites-list">
                <div v-for="item in userPosts" :key="item.id" class="favorite-card" @click="goToPost(item.id)">
                  <div class="card-left">
                    <img v-if="item.coverImage || item.firstImage"
                      :src="item.coverImage ? getCoverImageUrl(item.coverImage) : item.firstImage" class="card-thumb" />
                    <div v-else class="card-thumb-placeholder">
                      <IconFile class="placeholder-icon" />
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="card-header">
                      <h4 class="card-title">{{ item.title }}</h4>
                      <span class="card-category" v-if="item.categoryName">
                        {{ item.categoryName }}
                      </span>
                    </div>
                    <p class="card-summary">
                      {{
                        item.contentSummary || stripMarkdownContent(item.content, 100) || '暂无摘要'
                      }}
                    </p>
                    <div class="card-footer">
                      <div class="card-meta">
                        <span class="meta-item">
                          <IconClockCircle class="meta-icon" />
                          <span>{{ formatTime(item.createdAt) }}</span>
                        </span>
                        <span class="meta-item">
                          <IconEye class="meta-icon" />
                          <span>{{ item.viewCount || 0 }}</span>
                        </span>
                        <span class="meta-item">
                          <IconHeart class="meta-icon" />
                          <span>{{ item.likeCount || 0 }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <a-empty v-else-if="!postsLoading" description="暂无帖子" class="favorites-empty">
                <template #image>
                  <IconFile :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="userPosts.length > 0" class="pagination">
              <a-pagination v-model:current="pagination.current" :total="pagination.total"
                :page-size="pagination.pageSize" show-total show-jumper @change="fetchUserPosts" />
            </div>
          </div>

          <div v-else-if="activeStatTab === 'following'" class="stat-users-section">
            <a-spin :loading="followingLoading" class="favorites-loading">
              <div v-if="followingList.length > 0" class="users-list">
                <div v-for="user in followingList" :key="user.id" class="user-list-item" @click="goToUser(user.id)">
                  <a-avatar :size="48" class="user-list-avatar">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" />
                    <IconUser v-else />
                  </a-avatar>
                  <div class="user-list-info">
                    <div class="user-list-name">
                      <span>{{ user.username }}</span>
                      <IconMan v-if="user.gender === 'MALE'" class="gender-icon male" />
                      <IconWoman v-else-if="user.gender === 'FEMALE'" class="gender-icon female" />
                    </div>
                    <span class="user-list-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</span>
                  </div>
                  <a-button :type="followStatusMap[user.id] ? 'secondary' : 'primary'" size="small"
                    @click.stop="handleFollowToggle(user)">
                    {{ followStatusMap[user.id] ? '已关注' : '关注' }}
                  </a-button>
                </div>
              </div>
              <a-empty v-else-if="!followingLoading" description="暂无关注" class="favorites-empty">
                <template #image>
                  <IconUser :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="followingList.length > 0" class="pagination">
              <a-pagination v-model:current="followingPagination.current" :total="followingPagination.total"
                :page-size="followingPagination.pageSize" show-total show-jumper @change="fetchFollowingList" />
            </div>
          </div>

          <div v-else-if="activeStatTab === 'followers'" class="stat-users-section">
            <a-spin :loading="followersLoading" class="favorites-loading">
              <div v-if="followersList.length > 0" class="users-list">
                <div v-for="user in followersList" :key="user.id" class="user-list-item" @click="goToUser(user.id)">
                  <a-avatar :size="48" class="user-list-avatar">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" />
                    <IconUser v-else />
                  </a-avatar>
                  <div class="user-list-info">
                    <div class="user-list-name">
                      <span>{{ user.username }}</span>
                      <IconMan v-if="user.gender === 'MALE'" class="gender-icon male" />
                      <IconWoman v-else-if="user.gender === 'FEMALE'" class="gender-icon female" />
                    </div>
                    <span class="user-list-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</span>
                  </div>
                </div>
              </div>
              <a-empty v-else-if="!followersLoading" description="暂无粉丝" class="favorites-empty">
                <template #image>
                  <IconUser :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="followersList.length > 0" class="pagination">
              <a-pagination v-model:current="followersPagination.current" :total="followersPagination.total"
                :page-size="followersPagination.pageSize" show-total show-jumper @change="fetchFollowersList" />
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import {
  IconUser,
  IconCalendar,
  IconLocation,
  IconClockCircle,
  IconEye,
  IconHeart,
  IconMessage,
  IconMan,
  IconWoman,
  IconFile,
  IconStar,
} from '@arco-design/web-vue/es/icon'
import { getAvatarURL, getImageURL } from '@/config/server'
import { formatTimeAgo } from '@/utils/time'
import { stripMarkdown } from '@/utils/markdown'
import { getUserInfoById, getUserPosts } from '@/apis/users'
import {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowingList,
  getFollowersList,
} from '@/apis/follows'
import { useUserStore } from '@/stores/user'
import { usePageRefresh } from '@/composables/usePageRefresh'
import log from '@/utils/logger'

definePage({
  meta: {
    title: '用户主页',
  },
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { checkAndRefresh } = usePageRefresh()
const userId = computed(() => route.params.id)

const statTitles = {
  posts: 'TA的帖子',
  following: 'TA的关注',
  followers: 'TA的粉丝',
}

const activeStatTab = ref(route.query.tab || 'posts')

const userInfo = ref({
  id: '',
  username: '',
  avatar: '',
  bio: '',
  postCount: 0,
  followingCount: 0,
  followerCount: 0,
  createdAt: '',
  gender: '',
  level: 1,
  exp: 0,
  points: 0,
  showFollowing: false,
  showFollowers: false,
})

const isFollowing = ref(false)
const followLoading = ref(false)
const userLoading = ref(false)

const userPosts = ref([])
const postsLoading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const followingList = ref([])
const followersList = ref([])
const followingLoading = ref(false)
const followersLoading = ref(false)
const followingPagination = reactive({ current: 1, pageSize: 10, total: 0 })
const followersPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const followStatusMap = reactive({})

const toBool = (val) => val === true || val === 'true' || val === 1 || val === '1'

const isCurrentUser = computed(() => {
  return userStore.userId && String(userStore.userId) === String(userId.value)
})

const genderText = computed(() => {
  const genderMap = {
    MALE: '男',
    FEMALE: '女',
    SECRET: '保密',
  }
  return genderMap[userInfo.value.gender] || '保密'
})

const handleStatClick = (type) => {
  if (type === 'following' && !userInfo.value.showFollowing && !isCurrentUser.value) {
    Message.warning('对方已隐藏关注列表')
    return
  }
  if (type === 'followers' && !userInfo.value.showFollowers && !isCurrentUser.value) {
    Message.warning('对方已隐藏粉丝列表')
    return
  }
  activeStatTab.value = type
  if (type === 'posts') {
    fetchUserPosts()
  } else if (type === 'following') {
    fetchFollowingList()
  } else if (type === 'followers') {
    fetchFollowersList()
  }
}

const fetchUserInfo = async () => {
  if (!userId.value) return

  userLoading.value = true
  try {
    const [userRes, postsRes, followingRes, followersRes] = await Promise.all([
      getUserInfoById(userId.value),
      getUserPosts(userId.value, { pageNumber: 1, pageSize: 1 }),
      getFollowingList(userId.value, { pageNumber: 1, pageSize: 1 }),
      getFollowersList(userId.value, { pageNumber: 1, pageSize: 1 }),
    ])

    if (userRes.code === 200 && userRes.data) {
      const data = userRes.data
      userInfo.value = {
        id: data.id || userId.value,
        username: data.username || '',
        avatar: data.avatarUrl ? getAvatarURL(data.avatarUrl) : '',
        bio: data.bio || '',
        postCount: 0,
        followingCount: 0,
        followerCount: 0,
        createdAt: data.createdAt || '',
        gender: data.gender || 'SECRET',
        level: data.level || 1,
        exp: data.exp || 0,
        points: data.points || 0,
        showFollowing: toBool(data.showFollowing),
        showFollowers: toBool(data.showFollowers),
      }
    }

    userInfo.value.postCount =
      postsRes.code === 200 ? postsRes.data?.totalRow || postsRes.data?.total || 0 : 0
    userInfo.value.followingCount =
      followingRes.code === 200 ? followingRes.data?.totalRow || followingRes.data?.total || 0 : 0
    userInfo.value.followerCount =
      followersRes.code === 200 ? followersRes.data?.totalRow || followersRes.data?.total || 0 : 0

    if (userStore.isLoggedIn && !isCurrentUser.value) {
      const followRes = await checkFollowStatus(userId.value)
      if (followRes.code === 200) {
        isFollowing.value = followRes.data?.isFollowing === true
      }
    }
  } catch (error) {
    log.error('获取用户信息失败:', error)
    Message.error('获取用户信息失败')
  } finally {
    userLoading.value = false
  }
}

const fetchUserPosts = async () => {
  if (!userId.value) return

  postsLoading.value = true
  try {
    const res = await getUserPosts(userId.value, {
      pageNumber: pagination.current,
      pageSize: pagination.pageSize,
    })

    if (res.code === 200 && res.data) {
      userPosts.value = (res.data.records || res.data.list || []).map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content || '',
        contentSummary: post.contentSummary || '',
        coverImage: post.coverImage || '',
        firstImage: getFirstImage(post.content),
        categoryName: post.categoryName || '',
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        createdAt: post.createdAt,
      }))
      pagination.total = res.data.totalRow || res.data.total || 0
    }
  } catch (error) {
    log.error('获取用户帖子失败:', error)
  } finally {
    postsLoading.value = false
  }
}

const fetchFollowingList = async () => {
  if (!userId.value) return

  followingLoading.value = true
  try {
    const res = await getFollowingList(userId.value, {
      pageNumber: followingPagination.current,
      pageSize: followingPagination.pageSize,
    })

    if (res.code === 200 && res.data) {
      followingList.value = (res.data.records || []).map((user) => ({
        ...user,
        avatarUrl: user.avatarUrl ? getAvatarURL(user.avatarUrl) : '',
      }))
      followingPagination.total = res.data.totalRow || 0

      if (userStore.isLoggedIn && followingList.value.length > 0) {
        const checkPromises = followingList.value
          .filter((user) => String(user.id) !== String(userStore.userId))
          .map((user) => {
            return checkFollowStatus(user.id)
              .then((res) => ({
                userId: user.id,
                isFollowing: res.code === 200 && res.data?.isFollowing === true,
              }))
              .catch(() => ({ userId: user.id, isFollowing: false }))
          })

        const results = await Promise.all(checkPromises)
        results.forEach(({ userId, isFollowing }) => {
          followStatusMap[userId] = isFollowing
        })
      }
    }
  } catch (error) {
    log.error('获取关注列表失败:', error)
  } finally {
    followingLoading.value = false
  }
}

const fetchFollowersList = async () => {
  if (!userId.value) return

  followersLoading.value = true
  try {
    const res = await getFollowersList(userId.value, {
      pageNumber: followersPagination.current,
      pageSize: followersPagination.pageSize,
    })

    if (res.code === 200 && res.data) {
      followersList.value = (res.data.records || []).map((user) => ({
        ...user,
        avatarUrl: user.avatarUrl ? getAvatarURL(user.avatarUrl) : '',
      }))
      followersPagination.total = res.data.totalRow || 0
    }
  } catch (error) {
    log.error('获取粉丝列表失败:', error)
  } finally {
    followersLoading.value = false
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
    if (isFollowing.value) {
      const res = await unfollowUser(userId.value)
      if (res.code === 200) {
        isFollowing.value = false
        userInfo.value.followerCount = Math.max(0, userInfo.value.followerCount - 1)
        Message.success('已取消关注')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await followUser(userId.value)
      if (res.code === 200) {
        isFollowing.value = true
        userInfo.value.followerCount += 1
        Message.success('关注成功')
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

const handleFollowToggle = async (user) => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }

  if (String(user.id) === String(userStore.userId)) return

  try {
    if (followStatusMap[user.id]) {
      const res = await unfollowUser(user.id)
      if (res.code === 200) {
        followStatusMap[user.id] = false
        Message.success('已取消关注')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await followUser(user.id)
      if (res.code === 200) {
        followStatusMap[user.id] = true
        Message.success('关注成功')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    log.error('关注操作失败:', error)
    Message.error('操作失败')
  }
}

const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

const goToUser = (id) => {
  router.push(`/user/${id}`)
}

const formatTime = (time) => {
  if (!time) return ''
  return formatTimeAgo(time)
}

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

watch(
  userId,
  async () => {
    if (userId.value) {
      await fetchUserInfo()
      handleStatClick(activeStatTab.value)
    }
  },
  { immediate: true },
)

onActivated(() => {
  if (userId.value) {
    checkAndRefresh(fetchUserInfo)
  }
})
</script>

<style lang="scss" scoped>
  .user-profile-page {
    padding: 24px;
    background: var(--color-bg-1);
    min-height: calc(100vh - 64px);
  }

  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 24px;
  }

  .profile-sidebar {
    width: 280px;
    flex-shrink: 0;
  }

  .user-card {
    background: var(--color-bg-2);
    border-radius: 12px;
    text-align: center;

    :deep(.arco-card-body) {
      padding: 24px;
    }
  }

  .user-avatar-section {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }

  .avatar {
    width: 100px;
    height: 100px;
    background: rgb(var(--primary-6));
    color: #fff;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .user-info {
    margin-bottom: 20px;
  }

  .username {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .gender-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;

      &.male {
        color: #1890ff;
      }

      &.female {
        color: #eb2f96;
      }
    }
  }

  .user-bio {
    font-size: 14px;
    color: var(--color-text-3);
    line-height: 1.5;
  }

  .user-stats {
    display: flex;
    justify-content: space-around;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    &:hover .stat-value {
      color: rgb(var(--primary-6));
    }

    &.active .stat-value {
      color: rgb(var(--primary-6));
    }

    &.active .stat-label {
      color: rgb(var(--primary-6));
    }
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    transition: color 0.2s;
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-3);
    margin-top: 4px;
  }

  .user-actions {
    margin-top: 16px;
  }

  .info-card {
    margin-top: 16px;
    background: var(--color-bg-2);
    border-radius: 12px;

    :deep(.arco-card-header) {
      border-bottom: 1px solid var(--color-border-2);
      padding: 16px 20px;
    }

    :deep(.arco-card-body) {
      padding: 16px 20px;
    }
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-3);
  }

  .info-value {
    font-size: 14px;
    color: var(--color-text-1);
  }

  .profile-main {
    flex: 1;
    min-width: 0;
  }

  .main-card {
    background: var(--color-bg-2);
    border-radius: 12px;

    :deep(.arco-card-header) {
      border-bottom: 1px solid var(--color-border-2);
      padding: 16px 24px;
    }

    :deep(.arco-card-body) {
      padding: 24px;
    }
  }

  .card-title-center {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
    text-align: center;
  }

  .stat-posts-section,
  .stat-users-section {
    min-height: 400px;
  }

  .favorites-loading {
    width: 100%;
    min-height: 300px;
  }

  .favorites-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .favorite-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    align-items: flex-start;
    margin-bottom: 16px;

    &:hover {
      background: var(--color-fill-2);
      border-color: rgb(var(--primary-6));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .card-left {
    flex-shrink: 0;
    width: 120px;
    height: 90px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-fill-2);
  }

  .card-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-thumb-placeholder {
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

  .card-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .card-category {
    flex-shrink: 0;
    font-size: 12px;
    color: rgb(var(--primary-6));
    background: rgb(var(--primary-1));
    padding: 2px 8px;
    border-radius: 4px;
  }

  .card-summary {
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

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .card-meta {
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

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover {
      background: var(--color-fill-2);
      border-color: rgb(var(--primary-6));
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .user-list-avatar {
    flex-shrink: 0;
    background: rgb(var(--primary-6));
    color: #fff;
  }

  .user-list-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-list-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-1);
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

  .user-list-bio {
    font-size: 13px;
    color: var(--color-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .favorites-empty {
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
    .profile-container {
      flex-direction: column;
    }

    .profile-sidebar {
      width: 100%;
    }

    .user-stats {
      flex-wrap: wrap;
      gap: 16px;
    }

    .stat-item {
      flex: 1;
      min-width: 80px;
    }

    .favorite-card {
      flex-direction: column;
    }

    .card-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .user-list-item {
      flex-wrap: wrap;
    }

    .user-list-info {
      flex: 1;
      min-width: calc(100% - 60px);
    }
  }
</style>
