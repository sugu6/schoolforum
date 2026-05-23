<template>
  <div class="search-page">
    <div class="search-hero" v-if="hasSearched">
      <div class="search-header">
        <a-radio-group v-model="searchType" type="button" size="medium" @change="handleTypeChange">
          <a-radio value="all">
            <icon-apps />
            <span class="tab-label">综合</span>
          </a-radio>
          <a-radio value="posts">
            <icon-file />
            <span class="tab-label">帖子</span>
            <span class="tab-count" v-if="postsResult.totalHits">{{ postsResult.totalHits }}</span>
          </a-radio>
          <a-radio value="users">
            <icon-user />
            <span class="tab-label">用户</span>
            <span class="tab-count" v-if="usersResult.totalHits">{{ usersResult.totalHits }}</span>
          </a-radio>
        </a-radio-group>
      </div>
    </div>

    <div class="search-content">
      <div v-if="!hasSearched" class="search-welcome">
        <div class="welcome-icon">
          <icon-search :size="56" />
        </div>
        <h2 class="welcome-title">探索校园论坛</h2>
        <p class="welcome-desc">在上方搜索框输入关键词，发现你感兴趣的内容</p>
        <div class="welcome-suggestions">
          <span class="suggest-label">大家都在搜：</span>
          <a-tag
            v-for="term in hotSearchTerms"
            :key="term"
            class="suggest-tag"
            checkable
            @click="handleSuggestionClick(term)"
          >
            {{ term }}
          </a-tag>
        </div>
      </div>

      <template v-else>
        <div class="result-stats" v-if="totalResults > 0">
          <span class="stats-text">
            找到 <strong>{{ totalResults }}</strong> 条结果
            <template v-if="processingTime"> · 用时 {{ processingTime }}ms</template>
          </span>
          <span class="stats-query">"{{ searchQuery }}"</span>
        </div>

        <div v-if="searchType === 'all' || searchType === 'posts'" class="section-block">
          <template v-if="loading">
            <div class="skeleton-list">
              <div v-for="n in 3" :key="n" class="skeleton-card">
                <a-skeleton animation>
                  <a-skeleton-line :rows="3" />
                </a-skeleton>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-if="postsResult.hits && postsResult.hits.length > 0" class="card-list">
              <PostCard
                v-for="(post, index) in postsResult.hits"
                :key="post.id"
                :post="post"
                :highlight-keyword="searchQuery"
                :class="['animate-fade-in-up', `animate-delay-${Math.min(index + 1, 12)}`]"
              />
              <div
                v-if="searchType === 'posts' && postsResult.totalPages > 1"
                class="pagination-wrap"
              >
                <a-pagination
                  v-model:current="currentPage"
                  :total="postsResult.totalHits"
                  :page-size="pageSize"
                  show-total
                  size="large"
                  @change="handlePageChange"
                />
              </div>
            </div>
            <div v-else-if="searchType === 'posts'" class="empty-result animate-fade-in-up">
              <icon-file :size="48" class="empty-icon" />
              <p class="empty-title">未找到相关帖子</p>
              <p class="empty-hint">换个关键词试试，或者浏览分类吧</p>
              <a-button type="primary" @click="router.push('/')">返回首页</a-button>
            </div>
          </template>
        </div>

        <div v-if="searchType === 'all' || searchType === 'users'" class="section-block">
          <template v-if="loading">
            <div class="skeleton-grid">
              <div v-for="n in 4" :key="n" class="skeleton-user">
                <a-skeleton animation>
                  <a-skeleton-shape shape="circle" size="small" />
                  <a-skeleton-line :rows="1" />
                </a-skeleton>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-if="usersResult.hits && usersResult.hits.length > 0" class="user-grid">
              <a-card
                v-for="user in usersResult.hits"
                :key="user.id"
                class="user-card animate-fade-in-up"
                hoverable
                @click="goToProfile(user.id)"
              >
                <div class="user-card-inner">
                  <a-avatar :size="52" class="user-avatar-img">
                    <img v-if="user.avatarUrl" :src="getAvatarURL(user.avatarUrl)" />
                    <icon-user v-else />
                  </a-avatar>
                  <div class="user-meta">
                    <span
                      class="user-name"
                      v-html="highlightText(user.username, searchQuery)"
                    ></span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                  <icon-right class="user-arrow" />
                </div>
              </a-card>
              <div
                v-if="searchType === 'users' && usersResult.totalPages > 1"
                class="pagination-wrap"
              >
                <a-pagination
                  v-model:current="currentPage"
                  :total="usersResult.totalHits"
                  :page-size="pageSize"
                  show-total
                  size="large"
                  @change="handlePageChange"
                />
              </div>
            </div>
            <div v-else-if="searchType === 'users'" class="empty-result animate-fade-in-up">
              <icon-user :size="48" class="empty-icon" />
              <p class="empty-title">未找到相关用户</p>
              <p class="empty-hint">试试搜索用户名或邮箱</p>
            </div>
          </template>
        </div>

        <div
          v-if="!loading && totalResults === 0 && searchType === 'all'"
          class="empty-result animate-fade-in-up"
        >
          <icon-search :size="48" class="empty-icon" />
          <p class="empty-title">没有找到相关内容</p>
          <p class="empty-hint">建议：检查拼写、使用更常见的关键词、或减少筛选条件</p>
          <div class="empty-actions">
            <a-button type="primary" @click="router.push('/')">返回首页</a-button>
            <a-button @click="handleClearSearch">清除搜索</a-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { IconSearch, IconUser, IconApps, IconFile, IconRight } from '@arco-design/web-vue/es/icon'
import { searchAll } from '@/apis/search'
import PostCard from '@/components/PostCard.vue'
import { getAvatarURL } from '@/config/server'

definePage({
  meta: {
    title: '搜索',
  },
})

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const searchType = ref('all')
const loading = ref(false)
const hasSearched = ref(false)
const pageSize = ref(10)
const currentPage = ref(1)
const processingTime = ref(0)

const hotSearchTerms = ['校园活动', '选课攻略', '考研经验', '二手交易', '实习招聘', '食堂推荐']

const postsResult = ref({
  query: '',
  totalHits: 0,
  hitsPerPage: 10,
  page: 1,
  totalPages: 0,
  hits: [],
})

const usersResult = ref({
  query: '',
  totalHits: 0,
  hitsPerPage: 10,
  page: 1,
  totalPages: 0,
  hits: [],
})

const totalResults = computed(() => {
  const postsTotal = postsResult.value.totalHits || 0
  const usersTotal = usersResult.value.totalHits || 0
  if (searchType.value === 'posts') return postsTotal
  if (searchType.value === 'users') return usersTotal
  return postsTotal + usersTotal
})

const highlightText = (text, query) => {
  if (!text || !query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

const doSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) return

  loading.value = true
  hasSearched.value = true

  try {
    const res = await searchAll({
      query: q,
      page: currentPage.value,
      size: pageSize.value,
    })
    if (res && res.code === 200 && res.data) {
      postsResult.value = res.data.posts || { hits: [], totalHits: 0, totalPages: 0 }
      usersResult.value = res.data.users || { hits: [], totalHits: 0, totalPages: 0 }
      processingTime.value =
        res.data.posts?.processingTimeMs || res.data.users?.processingTimeMs || 0
    }

    router.replace({ query: { q, type: searchType.value } })
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSuggestionClick = (term) => {
  router.push({ path: '/search', query: { q: term } })
}

const handleClearSearch = () => {
  searchQuery.value = ''
  hasSearched.value = false
  postsResult.value = { query: '', totalHits: 0, hitsPerPage: 10, page: 1, totalPages: 0, hits: [] }
  usersResult.value = { query: '', totalHits: 0, hitsPerPage: 10, page: 1, totalPages: 0, hits: [] }
  processingTime.value = 0
  router.replace({ path: '/search' })
}

const handleTypeChange = () => {
  if (searchQuery.value.trim()) {
    currentPage.value = 1
    doSearch()
  }
}

const handlePageChange = () => {
  doSearch()
}

const goToProfile = (userId) => {
  router.push(`/user/${userId}`)
}

const syncFromRoute = () => {
  const queryParam = route.query.q
  const typeParam = route.query.type

  if (queryParam) {
    searchQuery.value = queryParam
  }
  if (typeParam && ['all', 'posts', 'users'].includes(typeParam)) {
    searchType.value = typeParam
  }
}

onMounted(() => {
  syncFromRoute()
  if (searchQuery.value.trim()) {
    doSearch()
  }
})

watch(
  () => route.query.q,
  (newQ) => {
    if (newQ && newQ !== searchQuery.value) {
      searchQuery.value = newQ
      currentPage.value = 1
      doSearch()
    }
  },
)
</script>

<style lang="scss" scoped>
@use '../../styles/animations.scss' as *;

.search-page {
  min-height: calc(100vh - 64px);
  background: var(--color-bg-1);
}

.search-hero {
  padding: 28px 24px 20px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
}

.search-header {
  display: flex;
  justify-content: center;

  :deep(.arco-radio-group-button) {
    border-radius: 10px;
    overflow: hidden;
  }

  :deep(.arco-radio-button) {
    padding: 8px 20px;
    font-weight: 500;
    transition: all 0.2s ease;

    .tab-label {
      margin-left: 6px;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      margin-left: 6px;
      padding: 0 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      background: var(--color-fill-2);
      color: var(--color-text-3);
      transition: all 0.2s ease;
    }

    &.arco-radio-checked .tab-count {
      background: rgba(var(--primary-6), 0.15);
      color: rgb(var(--primary-6));
    }
  }
}

.search-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.search-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 20px 80px;
  text-align: center;
}

.welcome-icon {
  width: 104px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(var(--primary-6), 0.06), rgba(var(--primary-6), 0.16));
  color: rgb(var(--primary-6));
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
}

.welcome-desc {
  font-size: 15px;
  color: var(--color-text-3);
  margin: 0 0 32px 0;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 520px;
}

.suggest-label {
  font-size: 13px;
  color: var(--color-text-4);
  margin-right: 4px;
}

.suggest-tag {
  cursor: pointer;
  border-radius: 20px;
  font-size: 13px;
  padding: 4px 14px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(var(--primary-6), 0.18);
  }
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 14px 20px;
  background: var(--color-fill-1);
  border-radius: 12px;
  animation: fadeInUp 0.35s ease both;
}

.stats-text {
  font-size: 14px;
  color: var(--color-text-2);

  strong {
    color: rgb(var(--primary-6));
    font-weight: 700;
    font-size: 16px;
  }
}

.stats-query {
  font-size: 13px;
  color: var(--color-text-4);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-block {
  margin-bottom: 32px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-card {
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 12px;
  border: 1px solid var(--color-border-2);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.skeleton-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 12px;
  border: 1px solid var(--color-border-2);

  :deep(.arco-skeleton-shape-circle) {
    min-height: 44px;
    min-width: 44px;
  }

  :deep(.arco-skeleton-line) {
    flex: 1;
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-2);
}

.user-card {
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: rgb(var(--primary-4));
  }

  &:active {
    transform: translateY(0);
    transition: all 0.1s ease;
  }

  :deep(.arco-card-body) {
    padding: 18px 20px;
  }
}

.user-card-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar-img {
  flex-shrink: 0;
  border: 2px solid var(--color-border-2);
}

.user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: var(--color-text-4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  flex-shrink: 0;
  color: var(--color-text-4);
  font-size: 14px;
  transition: transform 0.2s ease;

  .user-card:hover & {
    transform: translateX(4px);
    color: rgb(var(--primary-6));
  }
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 20px;
  text-align: center;
  animation: fadeInUp 0.4s ease both;
}

.empty-icon {
  color: var(--color-text-4);
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-2);
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-4);
  margin: 0 0 24px 0;
  max-width: 360px;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

.highlight {
  background: rgba(var(--primary-6), 0.15);
  color: rgb(var(--primary-6));
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .search-hero {
    padding: 20px 16px 16px;
  }

  .search-content {
    padding: 24px 16px 48px;
  }

  .search-welcome {
    padding: 40px 16px 60px;
  }

  .welcome-title {
    font-size: 20px;
  }

  .user-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .result-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

@media (max-width: 576px) {
  .search-hero {
    padding: 16px 12px 14px;

    :deep(.arco-radio-button) {
      padding: 6px 14px;
      font-size: 13px;
    }
  }

  .search-content {
    padding: 20px 12px 40px;
  }

  .welcome-icon {
    width: 80px;
    height: 80px;
    border-radius: 22px;
  }
}
</style>
