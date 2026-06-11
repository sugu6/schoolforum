<template>
  <a-card class="related-card sidebar-card" :bordered="true" :loading="loading">
    <template #title>
      <div class="card-title">
        <IconFire />
        相关推荐
      </div>
    </template>

    <div v-if="posts.length > 0" class="related-list">
      <div v-for="item in posts" :key="item.id" class="related-item" @click="goToPost(item.id)">
        <h4 class="related-title">{{ item.title }}</h4>
        <div class="related-meta">
          <span>
            <IconEye />
            {{ item.viewCount || 0 }}
          </span>
          <span>
            <IconMessage />
            {{ item.commentCount || 0 }}
          </span>
        </div>
      </div>
    </div>

    <a-empty v-if="!loading && posts.length === 0" description="暂无相关推荐" />
  </a-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconFire, IconEye, IconMessage } from '@arco-design/web-vue/es/icon'
import log from '@/utils/logger'

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()
const loading = ref(true)
const posts = ref([])

const fetchRelatedPosts = async () => {
  if (!posts.value.length) {
    loading.value = true
  }
  try {
    const { getRelatedPosts } = await import('@/apis/posts')
    if (typeof getRelatedPosts === 'function') {
      const res = await getRelatedPosts(props.postId)
      if (res.code === 200) {
        posts.value = res.data || []
      }
    }
  } catch (error) {
    log.error('获取相关推荐失败:', error)
  } finally {
    loading.value = false
  }
}

const goToPost = (id) => {
  if (id == props.postId) return
  router.push(`/post/${id}`)
}

watch(
  () => props.postId,
  () => {
    if (props.postId) {
      fetchRelatedPosts()
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

  .related-card {
    :deep(.arco-card-header) {
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-2);

      @media (max-width: 576px) {
        padding: 12px 16px;
      }
    }

    :deep(.arco-card-body) {
      padding: 16px 20px;

      @media (max-width: 576px) {
        padding: 12px 16px;
      }
    }
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .related-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .related-item {
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: var(--color-fill-2);
    }
  }

  .related-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-1);
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .related-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--color-text-4);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
</style>
