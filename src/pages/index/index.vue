<template>
  <div class="main">
    <a-card class="announcement-card" v-if="notices.length > 0">
      <div class="announcement-content">
        <div class="banner-left">
          <icon-notification class="banner-icon" />
          <span class="banner-label">公告</span>
        </div>

        <div class="banner-center">
          <a-carousel v-model:active-index="currentNoticeIndex" auto-play indicator-type="dot" show-arrow="hover"
            :auto-play-speed="4000">
            <a-carousel-item v-for="notice in notices" :key="notice.id">
              <div class="notice-item" @click="handleNoticeClick(notice)">
                <a-tag v-if="notice.isTop == 1" color="orangered" size="small">置顶</a-tag>
                <a-tag :color="notice.type === 'important' ? 'red' : 'blue'" size="small">
                  {{ notice.type === 'important' ? '重要' : '通知' }}
                </a-tag>
                <span class="notice-text">{{ notice.content }}</span>
                <icon-right class="notice-arrow" />
              </div>
            </a-carousel-item>
          </a-carousel>
        </div>

        <div class="banner-right">
          <a-button size="small" type="text" @click="showAllNotices">查看全部</a-button>
        </div>
      </div>
    </a-card>

    <a-row :gutter="[20, 0]" align="stretch">
      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="left-sidebar">
          <a-card title="分类" class="sidebar-card" :header-style="{ textAlign: 'center' }">
            <a-menu v-model:selected-keys="selectedKeys" mode="vertical" accordion>
              <template v-if="currentParentCategory">
                <a-menu-item key="all" @click="handleCategorySelect(currentParentCategory.id)">
                  <icon-apps />全部帖子
                </a-menu-item>
                <a-menu-item v-for="child in currentParentCategory.children" :key="String(child.id)"
                  @click="handleSingleChildCategory(child.id)">
                  <icon-folder />{{ child.name }}
                </a-menu-item>
              </template>
              <template v-else>
                <a-menu-item key="all" @click="handleCategorySelect(null)">
                  <icon-apps />全部帖子
                </a-menu-item>
                <a-sub-menu v-for="parent in allCategories" :key="String(parent.id)">
                  <template #title> <icon-folder />{{ parent.name }} </template>
                  <a-menu-item v-for="child in parent.children" :key="String(child.id)"
                    @click="handleSidebarChildCategory(child)">
                    {{ child.name }}
                  </a-menu-item>
                </a-sub-menu>
              </template>
            </a-menu>
          </a-card>
        </div>
      </a-col>

      <a-col :xs="24" :sm="24" :md="24" :lg="16" :xl="14" :xxl="14">
        <div class="post-list-header">
          <a-radio-group type="button" v-model="sortType">
            <a-radio value="latest">最新</a-radio>
            <a-radio value="hot">最热</a-radio>
            <a-radio value="essential">精华</a-radio>
          </a-radio-group>
        </div>

        <div class="post-cards-container" ref="scrollContainer" :class="{ 'is-visible': visible }">
          <PostCard v-for="(post, index) in postList" :key="post.id" :post="post"
            :class="['animate-fade-in-up', `animate-delay-${Math.min(index + 1, 12)}`]" />
          <div v-if="loading" class="loading-more">
            <a-spin />
            <span>加载中...</span>
          </div>
          <div v-if="noMore" class="no-more">没有更多了</div>
        </div>
      </a-col>

      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="right-sidebar">
          <a-card class="sidebar-card checkin-card" :header-style="{ textAlign: 'center' }">
            <template #title>
              <div class="card-title-compact"><icon-check-circle /> 每日签到</div>
            </template>
            <div class="checkin-body">
              <div class="checkin-header">
                <span class="checkin-date">{{ todayDate }}</span>
                <div class="checkin-status">
                  <a-spin v-if="loadingCheckin" :size="14" />
                  <span v-if="loadingCheckin">加载中...</span>
                  <template v-else-if="checkedIn">
                    <icon-check-circle-fill class="checkin-icon checked" />
                    <span>今日已签到</span>
                  </template>
                  <span v-else class="checkin-tip">今天还没有签到哦~</span>
                </div>
              </div>
              <a-button long size="small" type="primary" :loading="checkingIn" :disabled="checkedIn"
                @click="handleCheckin">
                <icon-check-circle />
                {{ checkedIn ? '已签到' : '立即签到' }}
              </a-button>
              <div class="checkin-stats" v-if="isLoggedIn">
                <div class="stat-row">
                  <a-tag color="arcoblue" size="small">Lv.{{ checkinStats.level }}</a-tag>
                  <span class="stat-text">经验 {{ checkinStats.exp }}</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-row">
                  <span class="stat-num">{{ checkinStats.continuousDays }}</span>
                  <span class="stat-label">连续</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-row">
                  <span class="stat-num">{{ checkinStats.points }}</span>
                  <span class="stat-label">积分</span>
                </div>
              </div>
            </div>
          </a-card>

          <a-card class="sidebar-card" :header-style="{ textAlign: 'center' }">
            <template #title>
              <div class="card-title-compact"><icon-fire /> 热门榜</div>
            </template>
            <a-list :bordered="false" size="small">
              <a-list-item v-for="(post, i) in hotPosts.slice(0, 5)" :key="post.id" class="hot-post-item"
                @click="goToPost(post.id)">
                <span class="hot-rank" :class="{ 'rank-top': i < 3 }">{{ i + 1 }}</span>
                <span class="hot-title">{{ post.title }}</span>
                <span class="hot-heat" :class="{
                  'heat-high': post.heat >= 500,
                  'heat-mid': post.heat >= 100 && post.heat < 500,
                }">
                  <icon-fire />{{ formatHeat(post.heat) }}
                </span>
              </a-list-item>
            </a-list>
          </a-card>

          <a-card class="sidebar-card" :header-style="{ textAlign: 'center' }">
            <template #title>
              <div class="card-title-compact"><icon-thunderbolt /> 快捷</div>
            </template>
            <a-space direction="vertical" fill>
              <a-button long size="small" type="primary" @click="handleCreatePost"><icon-edit /> 发布帖子</a-button>
              <a-button long size="small" @click="handleMyFavorites"><icon-star /> 我的收藏</a-button>
              <a-button long size="small" @click="handleBrowseHistory"><icon-history /> 浏览历史</a-button>
            </a-space>
          </a-card>
        </div>
      </a-col>
    </a-row>

    <a-modal v-model:visible="announcementDialogVisible" :title="announcementDetail?.title || '公告详情'" :footer="false"
      :width="600" unmount-on-close>
      <div v-if="loadingDetail" style="text-align: center; padding: 40px 0">
        <a-spin />
      </div>
      <div v-else-if="announcementDetail" class="announcement-detail">
        <div class="announcement-meta">
          <a-tag :color="announcementDetail.type === 'IMPORTANT' ? 'red' : 'blue'" size="small">
            {{ announcementDetail.type === 'IMPORTANT' ? '重要' : '通知' }}
          </a-tag>
          <a-tag v-if="announcementDetail.isTop == 1" color="orangered" size="small">置顶</a-tag>
          <span class="announcement-time">{{
            formatAnnouncementTime(announcementDetail.createdAt)
            }}</span>
        </div>
        <a-divider :margin="12" />
        <div class="markdown-body" v-html="renderedAnnouncementContent"></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import {
  IconApps,
  IconFolder,
  IconEdit,
  IconStar,
  IconHistory,
  IconThunderbolt,
  IconNotification,
  IconCheckCircle,
  IconCheckCircleFill,
  IconFire,
  IconRight,
} from '@arco-design/web-vue/es/icon'
import { getPostList } from '@/apis/posts'
import { getCategoryList } from '@/apis/categories'
import { signDaily, getSignStatus } from '@/apis/checkin'
import { getAnnouncements, getAnnouncementDetail } from '@/apis/announcements'
import { checkFavorite } from '@/apis/favorites'
import { renderMarkdown } from '@/utils/markdown'
import { useUserStore } from '@/stores/user'
import { usePageRefresh } from '@/composables/usePageRefresh'
import { useRouteQuery } from '@vueuse/router'
import { useIntersectionObserver } from '@vueuse/core'
import { Message } from '@arco-design/web-vue'
import PostCard from '@/components/PostCard.vue'

definePage({
  meta: {
    title: '首页',
  },
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
const { checkAndRefresh } = usePageRefresh('/')
const sortType = ref('latest')
const scrollContainer = ref(null)
const visible = ref(false)

useIntersectionObserver(scrollContainer, ([{ isIntersecting }]) => {
  if (isIntersecting) visible.value = true
})
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const allCategories = ref([])
const selectedKeys = ref(['all'])

const todayDate = ref('')
const checkedIn = ref(false)
const loadingCheckin = ref(false)
const checkingIn = ref(false)
const checkinStats = ref({
  continuousDays: 0,
  level: 0,
  exp: 0,
  points: 0,
  signCards: 0,
  expToNextLevel: 100,
  maxContinuousDays: 0,
  monthSignDays: 0,
})

const activeParentCategoryId = useSessionStorage('activeParentCategoryId', null)

const categoryIdFromUrl = useRouteQuery('categoryId')

const currentCategoryId = computed(() => categoryIdFromUrl.value || null)

const getParentCategory = (categoryId) => {
  const id = Number(categoryId)
  if (!id || !allCategories.value.length) return null
  const parent = allCategories.value.find((c) => c.id === id)
  if (parent) return parent
  return allCategories.value.find((c) => c.children?.some((child) => child.id === id)) || null
}

const isParentCategory = (categoryId) => {
  const id = Number(categoryId)
  return id && allCategories.value.some((c) => c.id === id)
}

const currentParentCategory = computed(() => {
  const categoryId = currentCategoryId.value
  if (!categoryId) return null

  if (activeParentCategoryId.value) {
    const parentCategory = allCategories.value.find((c) => c.id === activeParentCategoryId.value)
    const parentOfCurrent = getParentCategory(categoryId)
    if (parentCategory && parentOfCurrent?.id === activeParentCategoryId.value) {
      return parentCategory
    }
  }

  return isParentCategory(categoryId) ? getParentCategory(categoryId) : null
})

const postList = ref([])

const hotPosts = ref([])

const formatHeat = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return String(num)
}

const fetchHotPosts = async () => {
  try {
    const res = await getPostList({ pageNumber: 1, pageSize: 5, sort: 'hot' })
    if (res?.data?.records) {
      hotPosts.value = res.data.records.map((post) => ({
        id: post.id,
        title: post.title,
        heat: post.hotScore || 0,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
      }))
    }
  } catch (error) {
    console.error('获取热门帖子失败:', error)
  }
}

const notices = ref([])

const currentNoticeIndex = ref(0)

const announcementDialogVisible = ref(false)
const announcementDetail = ref(null)
const loadingDetail = ref(false)

const renderedAnnouncementContent = computed(() => {
  if (!announcementDetail.value?.content) return ''
  return renderMarkdown(announcementDetail.value.content)
})

const formatAnnouncementTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const handleNoticeClick = async (notice) => {
  announcementDialogVisible.value = true
  loadingDetail.value = true
  announcementDetail.value = null
  try {
    const res = await getAnnouncementDetail(notice.id)
    announcementDetail.value = res?.data || res
  } catch {
    announcementDetail.value = null
  } finally {
    loadingDetail.value = false
  }
}

const showAllNotices = () => {
  router.push('/announcements')
}

const fetchPostList = async (reset = false) => {
  if (loading.value) return
  if (reset) {
    postList.value = []
    currentPage.value = 1
    noMore.value = false
  } else if (noMore.value) {
    return
  }
  loading.value = true
  try {
    const params = {
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
      sort: sortType.value,
    }
    const catId = route.query.categoryId
    if (catId) {
      params.categoryId = catId
    }
    const res = await getPostList(params)
    if (res && res.data) {
      if (res.data.records && res.data.records.length > 0) {
        const newPosts = [...res.data.records]
        if (isLoggedIn.value) {
          await checkPostsFavoriteStatus(newPosts)
        }
        postList.value = [...postList.value, ...newPosts]
        currentPage.value++
        if (res.data.records.length < pageSize.value) {
          noMore.value = true
        }
      } else {
        noMore.value = true
      }
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    noMore.value = true
  } finally {
    loading.value = false
  }
}

const checkPostsFavoriteStatus = async (posts) => {
  try {
    const favoritePromises = posts.map(async (post) => {
      try {
        const res = await checkFavorite(post.id)
        if (res.code === 200) {
          post.isFavorited = res.data?.isFavorited === true || res.data === true
        }
      } catch (error) {
        console.error(`检查帖子 ${post.id} 收藏状态失败:`, error)
      }
    })
    await Promise.all(favoritePromises)
  } catch (error) {
    console.error('批量检查收藏状态失败:', error)
  }
}

const updateSelectedKeys = () => {
  const catId = route.query.categoryId
  selectedKeys.value = catId && !isParentCategory(catId) ? [String(catId)] : ['all']
}

const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    if (res?.data) {
      allCategories.value = res.data
      updateSelectedKeys()
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleCategorySelect = (categoryId) => {
  if (categoryId === null) {
    activeParentCategoryId.value = null
    router.push({ query: {} })
  } else {
    if (isParentCategory(categoryId)) {
      activeParentCategoryId.value = Number(categoryId)
    }
    router.push({ query: { categoryId: String(categoryId) } })
  }
}

const handleSidebarChildCategory = (child) => {
  activeParentCategoryId.value = null
  router.push({ query: { categoryId: String(child.id) } })
}

const handleSingleChildCategory = (childId) => {
  router.push({ query: { categoryId: String(childId) } })
}

watch(
  categoryIdFromUrl,
  (newVal) => {
    if (newVal && isParentCategory(newVal)) {
      activeParentCategoryId.value = Number(newVal)
    } else if (!newVal) {
      activeParentCategoryId.value = null
    }
    updateSelectedKeys()
    fetchPostList(true)
  },
  { immediate: false },
)

watch(sortType, () => {
  fetchPostList(true)
})

useInfiniteScroll(document.documentElement, () => fetchPostList(false), {
  distance: 100,
  canLoadMore: () => !noMore.value && !loading.value,
})

const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

const handleCreatePost = () => {
  if (!isLoggedIn.value) {
    Message.warning('请先登录后再发布帖子')
    router.push('/auth?mode=login')
    return
  }
  router.push('/create')
}

const handleMyFavorites = () => {
  if (!isLoggedIn.value) {
    Message.warning('请先登录后再查看收藏')
    router.push('/auth?mode=login')
    return
  }
  router.push('/profile?tab=favorites')
}

const handleBrowseHistory = () => {
  if (!isLoggedIn.value) {
    Message.warning('请先登录后再查看浏览历史')
    router.push('/auth?mode=login')
    return
  }
  router.push('/history')
}

const formatDate = (date) => {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const w = weekDays[date.getDay()]
  return `${m}月${d}日 ${w}`
}

const fetchCheckinStatus = async () => {
  todayDate.value = formatDate(new Date())
  if (!isLoggedIn.value) return
  loadingCheckin.value = true
  try {
    const res = await getSignStatus()
    const data = res?.data || res
    if (data) {
      checkedIn.value = data.todaySigned ?? false
      checkinStats.value = {
        continuousDays: data.continuousDays ?? 0,
        level: data.level ?? 0,
        exp: data.exp ?? 0,
        points: data.points ?? 0,
        signCards: data.signCards ?? 0,
        expToNextLevel: data.expToNextLevel ?? 0,
        maxContinuousDays: data.maxContinuousDays ?? 0,
        monthSignDays: data.monthSignDays ?? 0,
      }
    }
  } catch {
    checkedIn.value = false
  } finally {
    loadingCheckin.value = false
  }
}

const fetchNotices = async () => {
  try {
    const res = await getAnnouncements({ pageNumber: 1, pageSize: 10 })
    if (res?.data?.records) {
      notices.value = res.data.records.map((item) => ({
        id: item.id,
        type: item.type === 'IMPORTANT' ? 'important' : 'notice',
        content: item.title,
        isTop: item.isTop,
      }))
    }
  } catch {
    notices.value = []
  }
}

const handleCheckin = async () => {
  if (!isLoggedIn.value) {
    Message.warning('请先登录后再签到')
    router.push('/auth?mode=login')
    return
  }
  if (checkedIn.value || checkingIn.value) return
  checkingIn.value = true
  try {
    const res = await signDaily()
    const data = res?.data || res
    if (data?.success) {
      checkedIn.value = true
      checkinStats.value = {
        continuousDays: data.continuousDays ?? checkinStats.value.continuousDays,
        level: data.currentLevel ?? data.level ?? checkinStats.value.level,
        exp: data.currentExp ?? data.exp ?? checkinStats.value.exp,
        points: data.currentPoints ?? data.points ?? checkinStats.value.points,
        signCards: data.signCards ?? checkinStats.value.signCards,
        expToNextLevel: data.expToNextLevel ?? checkinStats.value.expToNextLevel,
        maxContinuousDays: data.maxContinuousDays ?? checkinStats.value.maxContinuousDays,
        monthSignDays: data.monthSignDays ?? checkinStats.value.monthSignDays,
      }

      const expGained = data.expGained ?? 0
      const pointsGained = data.pointsGained ?? 0
      Message.success(`${data.message || '签到成功'}！+${expGained} 经验 +${pointsGained} 积分`)

      if (data.levelUp) {
        Message.success(`恭喜升级！当前等级 Lv.${data.newLevel ?? checkinStats.value.level}`)
      }
    } else {
      Message.error(data?.message || '签到失败，请稍后再试')
    }
  } catch {
    Message.error('签到失败，请稍后再试')
  } finally {
    checkingIn.value = false
  }
}

const resetCheckinData = () => {
  checkedIn.value = false
  checkinStats.value = {
    continuousDays: 0,
    level: 0,
    exp: 0,
    points: 0,
    signCards: 0,
    expToNextLevel: 100,
    maxContinuousDays: 0,
    monthSignDays: 0,
  }
}

watch(isLoggedIn, (val) => {
  if (val) {
    fetchCheckinStatus()
  } else {
    resetCheckinData()
  }
})

onMounted(() => {
  fetchCategories()
  updateSelectedKeys()
  fetchPostList(true)
  fetchCheckinStatus()
  fetchNotices()
  fetchHotPosts()
})

onActivated(() => {
  checkAndRefresh(async () => {
    await Promise.all([fetchPostList(true), fetchCheckinStatus(), fetchHotPosts()])
  })
})
</script>

<style lang="scss" scoped>
  @use '../../styles/animations.scss' as *;

  .main {
    padding: 24px;
    min-height: 100%;
  }

  .announcement-card {
    margin-bottom: 16px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    :deep(.arco-card-body) {
      padding: 0;
    }
  }

  .announcement-content {
    display: flex;
    align-items: center;
    padding: 12px 20px;
  }

  .banner-left {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-right: 20px;
    border-right: 1px solid var(--color-border);
    margin-right: 20px;

    .banner-icon {
      font-size: 24px;
      color: var(--color-text-2);
      animation: bell-ring 2s ease-in-out infinite;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .banner-label {
      font-size: 15px;
      font-weight: 700;
      white-space: nowrap;
      letter-spacing: 0.5px;
      color: var(--color-text-1);
    }
  }

  .banner-center {
    flex: 1;
    overflow: hidden;

    :deep(.arco-carousel) {
      height: 44px;

      .arco-carousel-indicator {
        bottom: 6px;

        .arco-carousel-indicator-item {
          width: 8px;
          height: 8px;
          background-color: var(--color-fill-3);
          border-radius: 50%;
          transition: all 0.3s ease;

          &.arco-carousel-indicator-item-active {
            background-color: rgb(var(--primary-6));
            transform: scale(1.2);
          }
        }
      }

      .arco-carousel-arrow {
        width: 28px;
        height: 28px;
        background-color: var(--color-fill-2);
        border-radius: 50%;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--color-fill-3);
          transform: scale(1.1);
        }

        .arco-icon {
          color: var(--color-text-2);
          font-size: 16px;
        }
      }
    }

    .notice-item {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 44px;
      padding: 0 12px;
      cursor: pointer;
      border-radius: 8px;

      .notice-text {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notice-arrow {
        font-size: 16px;
        color: var(--color-text-3);
        opacity: 0.7;
      }
    }
  }

  .banner-right {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 20px;
    border-left: 1px solid var(--color-border);
    margin-left: 20px;

    :deep(.arco-btn-text) {
      color: var(--color-text-1);
      font-weight: 600;
      padding: 6px 16px;
      border-radius: 20px;

      &:hover {
        background-color: transparent;
        transform: none;
      }
    }
  }

  @keyframes bell-ring {

    0%,
    100% {
      transform: rotate(0deg);
    }

    10%,
    30% {
      transform: rotate(12deg);
    }

    20%,
    40% {
      transform: rotate(-12deg);
    }

    50% {
      transform: rotate(0deg);
    }
  }

  .sidebar-card {
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .left-sidebar {
    position: sticky;
    top: 80px;
  }

  .right-sidebar {
    position: sticky;
    top: 80px;
    padding-right: 4px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--color-fill-3);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }

  .sidebar-card :deep(.arco-card-header) {
    padding: 12px 16px;
    border-bottom: none;
    justify-content: center;
    text-align: center;
  }

  .sidebar-card :deep(.arco-card-header-title) {
    flex: 1;
    text-align: center;
    display: flex;
    justify-content: center;
  }

  .sidebar-card :deep(.arco-card-body) {
    padding: 12px 16px;
  }

  .card-title-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    width: 100%;
  }

  .post-list-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 12px;
    padding: 12px 16px;
    background-color: var(--color-bg-2);
    border-radius: 8px;
  }

  .post-cards-container {
    :deep(.animate-fade-in-up) {
      opacity: 0;
      animation-play-state: paused;
    }

    &.is-visible :deep(.animate-fade-in-up) {
      opacity: 1;
      animation-play-state: running;
    }
  }

  .checkin-card {
    :deep(.arco-card-body) {
      padding: 16px;
    }

    .checkin-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .checkin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 16px;
    }

    .checkin-date {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-1);
      white-space: nowrap;
    }

    .checkin-status {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      font-size: 12px;
    }

    .checkin-icon {
      font-size: 16px;

      &.checked {
        color: rgb(var(--green-6));
      }
    }

    .checkin-tip {
      color: var(--color-text-3);
      font-size: 12px;
    }

    .checkin-stats {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-top: 6px;
      border-top: 1px solid var(--color-border-2);
      gap: 8px;
    }

    .stat-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      flex: 1;
    }

    .stat-num {
      font-size: 18px;
      font-weight: 700;
      color: rgb(var(--primary-6));
      line-height: 1.2;
    }

    .stat-label {
      font-size: 10px;
      color: var(--color-text-3);
    }

    .stat-text {
      font-size: 11px;
      color: var(--color-text-3);
    }

    .stat-divider {
      width: 1px;
      height: 28px;
      background-color: var(--color-border-2);
    }
  }

  .hot-post-item {
    padding: 8px 0 !important;
    cursor: pointer;

    :deep(.arco-list-item-content) {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    &:hover .hot-title {
      color: rgb(var(--primary-6));
    }
  }

  .hot-rank {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-color: var(--color-fill-3);
    color: var(--color-text-3);
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &.rank-top {
      background-color: rgb(var(--danger-6));
      color: #fff;
    }
  }

  .hot-title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--color-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1;
  }

  .hot-heat {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-3);
    white-space: nowrap;

    &.heat-high {
      color: rgb(var(--danger-6));
    }

    &.heat-mid {
      color: rgb(var(--warning-6));
    }
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: var(--color-text-3);
    font-size: 14px;
  }

  .no-more {
    text-align: center;
    padding: 20px;
    color: var(--color-text-3);
    font-size: 14px;
  }

  @media (max-width: 1200px) {

    .left-sidebar,
    .right-sidebar {
      top: 72px;
    }
  }

  @media (max-width: 992px) {
    .main {
      padding: 16px;
    }
  }

  @media (max-width: 768px) {
    .main {
      padding: 12px;
    }

    .post-list-header {
      padding: 10px 12px;
    }

    .announcement-card {
      border-radius: 10px;

      .announcement-content {
        padding: 0 12px;
      }

      .banner-left {
        padding-right: 12px;
        margin-right: 12px;

        .banner-label {
          display: none;
        }

        .banner-icon {
          font-size: 20px;
        }
      }

      .banner-center {
        :deep(.arco-carousel) {
          height: 40px;

          .notice-item {
            height: 40px;
            padding: 0 8px;

            .notice-text {
              font-size: 13px;
            }
          }
        }
      }

      .banner-right {
        padding-left: 12px;
        margin-left: 12px;

        .arco-btn:not(.arco-btn-icon-only) {
          display: none;
        }
      }
    }
  }

  @media (max-width: 576px) {
    .main {
      padding: 8px;
    }

    .post-list-header {
      padding: 8px 10px;
      margin-bottom: 8px;
    }

    .loading-more,
    .no-more {
      padding: 16px;
      font-size: 12px;
    }
  }
</style>

<style>
  @import '../../styles/theme.css';

  .announcement-detail .markdown-body {
    font-size: 14px;
    line-height: 1.8;
    color: var(--color-text-2);
    word-wrap: break-word;
  }

  .announcement-detail .markdown-body h1,
  .announcement-detail .markdown-body h2,
  .announcement-detail .markdown-body h3,
  .announcement-detail .markdown-body h4,
  .announcement-detail .markdown-body h5,
  .announcement-detail .markdown-body h6 {
    color: var(--color-text-1);
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  .announcement-detail .markdown-body h1 {
    font-size: 22px;
  }

  .announcement-detail .markdown-body h2 {
    font-size: 20px;
  }

  .announcement-detail .markdown-body h3 {
    font-size: 18px;
  }

  .announcement-detail .markdown-body h4 {
    font-size: 16px;
  }

  .announcement-detail .markdown-body p {
    margin-bottom: 12px;
  }

  .announcement-detail .markdown-body a {
    color: rgb(var(--primary-6));
    text-decoration: none;
  }

  .announcement-detail .markdown-body a:hover {
    text-decoration: underline;
  }

  .announcement-detail .markdown-body img {
    max-width: 100%;
    border-radius: 6px;
    margin: 12px 0;
  }

  .announcement-detail .markdown-body code {
    background: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  .announcement-detail .markdown-body pre {
    background: var(--color-fill-2);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 12px 0;
  }

  .announcement-detail .markdown-body pre code {
    background: transparent;
    padding: 0;
  }

  .announcement-detail .markdown-body blockquote {
    border-left: 4px solid rgb(var(--primary-6));
    padding-left: 12px;
    margin: 12px 0;
    color: var(--color-text-3);
  }

  .announcement-detail .markdown-body ul,
  .announcement-detail .markdown-body ol {
    padding-left: 20px;
    margin-bottom: 12px;
  }

  .announcement-detail .markdown-body li {
    margin-bottom: 4px;
  }

  .announcement-detail .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
  }

  .announcement-detail .markdown-body th,
  .announcement-detail .markdown-body td {
    border: 1px solid var(--color-border-2);
    padding: 6px 10px;
    text-align: left;
  }

  .announcement-detail .markdown-body th {
    background: var(--color-fill-2);
    font-weight: 600;
  }

  .announcement-detail .markdown-body hr {
    border: none;
    border-top: 1px solid var(--color-border-2);
    margin: 16px 0;
  }
</style>
