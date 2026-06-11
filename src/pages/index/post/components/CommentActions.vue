<template>
  <div class="comment-actions">
    <span class="action" @click="$emit('like')">
      <IconThumbUpFill v-if="item.isLiked" :style="{ color: 'rgb(var(--primary-6))' }" />
      <IconThumbUp v-else />
      {{ item.likeCount || 0 }}
    </span>
    <span class="action" @click="$emit('reply')">
      <IconMessage />
      回复
    </span>
    <span v-if="showDelete" class="action delete-action" @click="$emit('delete')">
      <IconDelete />
      删除
    </span>
  </div>
</template>

<script setup>
import { IconThumbUp, IconThumbUpFill, IconMessage, IconDelete } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const userStore = useUserStore()

const showDelete = computed(() => {
  return String(props.item.authorId) === String(userStore.userId)
})

defineEmits(['like', 'reply', 'delete'])
</script>

<style lang="scss" scoped>
.comment-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  color: var(--color-text-2);
  line-height: 24px;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;

  &:hover {
    background: var(--color-fill-3);
    color: rgb(var(--primary-6));
  }

  @media (max-width: 576px) {
    padding: 0 6px;
    font-size: 12px;
  }
}

.delete-action {
  &:hover {
    color: rgb(var(--danger-6));
  }
}
</style>
