<template>
  <a-comment class="reply-editor" :class="{ 'nested-reply-editor': nested }" align="right">
    <template #avatar>
      <a-avatar :size="nested ? 24 : 28">
        <img v-if="userStore.avatar" :src="userStore.avatar" />
        <IconUser v-else />
      </a-avatar>
    </template>
    <template #author>
      <div class="reply-header">
        <span class="comment-author-name">{{ userStore.username || '游客' }}</span>
      </div>
    </template>
    <template #content>
      <div class="reply-input-wrapper">
        <component
          :is="useMention ? 'a-mention' : 'a-input'"
          ref="inputRef"
          v-model="content"
          :data="mentionUsers"
          :placeholder="placeholder"
          allow-clear
          class="reply-input"
          :disabled="!userStore.isLoggedIn"
        />
        <EmojiPicker v-if="userStore.isLoggedIn" @select="insertEmoji" />
      </div>
    </template>
    <template #actions>
      <a-button size="small" @click="$emit('cancel')">取消</a-button>
      <a-button
        type="primary"
        size="small"
        :loading="submitting"
        :disabled="!content.trim()"
        @click="handleSubmit"
      >
        回复
      </a-button>
    </template>
  </a-comment>
</template>

<script setup>
import { ref } from 'vue'
import { IconUser } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import EmojiPicker from '@/components/EmojiPicker.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '写下你的回复...',
  },
  mentionUsers: {
    type: Array,
    default: () => [],
  },
  useMention: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  nested: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const userStore = useUserStore()
const inputRef = ref(null)
const content = ref('')

const insertEmoji = (emoji) => {
  if (!userStore.isLoggedIn) return
  content.value += emoji
}

const handleSubmit = () => {
  if (!content.value.trim()) return
  emit('submit', content.value)
}

defineExpose({
  clear: () => {
    content.value = ''
  },
})
</script>

<style lang="scss" scoped>
.reply-editor {
  margin-top: 8px;
  padding: 16px 20px;
  background: var(--color-fill-2);
  border-radius: 8px;
  margin-left: -40px;
  width: calc(100% + 40px);
  box-sizing: border-box;

  :deep(.arco-comment-content) {
    flex: 1;
    min-width: 0;
  }

  :deep(.arco-input-wrapper) {
    width: 100%;
  }

  @media (max-width: 576px) {
    padding: 12px;
    margin-left: -20px;
    width: calc(100% + 20px);
  }
}

.nested-reply-editor {
  margin-top: 8px;
  padding: 12px 16px;
  background: var(--color-fill-1);
  border-radius: 6px;
  margin-left: -40px;
  width: calc(100% + 40px);
  box-sizing: border-box;

  :deep(.arco-comment-content) {
    flex: 1;
    min-width: 0;
  }

  :deep(.arco-input-wrapper) {
    width: 100%;
  }

  @media (max-width: 576px) {
    padding: 8px;
    margin-left: -20px;
    width: calc(100% + 20px);
  }
}

.reply-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
}

.reply-input-wrapper .reply-input {
  flex: 1;
}

.comment-author-name {
  font-weight: 500;
  color: var(--color-text-1);
}

.reply-header {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
