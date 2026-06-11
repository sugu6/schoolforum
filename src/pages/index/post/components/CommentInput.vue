<template>
  <div class="comment-input-wrapper">
    <div v-if="userStore.isLoggedIn" class="comment-input-logged-in">
      <div class="comment-input-header">
        <div class="comment-user-info">
          <a-avatar :size="40">
            <img v-if="userStore.avatar" :src="userStore.avatar" />
            <IconUser v-else />
          </a-avatar>
          <span class="comment-username">{{ userStore.username || '游客' }}</span>
        </div>
        <EmojiPicker @select="insertEmoji" />
      </div>

      <div class="comment-input-body">
        <a-textarea
          ref="textareaRef"
          v-model="content"
          placeholder="写下你的评论，支持 Markdown 语法..."
          :auto-size="{ minRows: 4, maxRows: 8 }"
          :max-length="1000"
          show-word-limit
          class="comment-textarea"
        />
      </div>

      <div class="comment-input-footer">
        <div class="comment-tips">
          <IconBulb />
          <span>友善交流，理性发言</span>
        </div>
        <a-button
          type="primary"
          :loading="submitting"
          :disabled="!content.trim()"
          @click="handleSubmit"
          class="submit-btn"
        >
          <template #icon>
            <IconSend />
          </template>
          发表评论
        </a-button>
      </div>
    </div>

    <div v-else class="login-tip" @click="$emit('login')">
      <a-space direction="vertical" :size="12" align="center">
        <IconLock :size="36" style="color: var(--color-text-3)" />
        <div class="tip-content">
          <span class="tip-text">登录后参与讨论</span>
          <span class="tip-subtext">分享你的想法，与大家交流</span>
        </div>
        <a-button type="outline"> 立即登录 </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconUser, IconBulb, IconSend, IconLock } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import EmojiPicker from '@/components/EmojiPicker.vue'

const props = defineProps({
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'login'])

const userStore = useUserStore()
const textareaRef = ref(null)
const content = ref('')

const insertEmoji = (emoji) => {
  if (!userStore.isLoggedIn) return
  content.value += emoji
}

const handleSubmit = () => {
  if (!content.value.trim()) return
  if (!userStore.isLoggedIn) {
    emit('login')
    return
  }
  emit('submit', content.value)
}

defineExpose({
  clear: () => {
    content.value = ''
  },
})
</script>

<style lang="scss" scoped>
.comment-input-wrapper {
  margin-bottom: 24px;
}

.comment-input-logged-in {
  display: flex;
  flex-direction: column;
}

.comment-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-username {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text-1);
}

.comment-input-body {
  margin-bottom: 16px;
}

.comment-textarea {
  :deep(.arco-textarea-wrapper) {
    background: var(--color-fill-1);
    border: 1px solid var(--color-border-2);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--color-border-3);
    }

    &:focus-within {
      border-color: rgb(var(--primary-6));
      box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.1);
    }
  }
}

.comment-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-1);

  @media (max-width: 576px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

.comment-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-3);

  @media (max-width: 576px) {
    justify-content: center;
  }
}

.submit-btn {
  min-width: 100px;

  @media (max-width: 576px) {
    width: 100%;
  }
}

.login-tip {
  text-align: center;
  padding: 32px 20px;
  background: linear-gradient(135deg, var(--color-fill-1) 0%, var(--color-fill-2) 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px dashed var(--color-border-2);

  &:hover {
    border-color: rgb(var(--primary-4));
    background: linear-gradient(135deg, var(--color-fill-2) 0%, var(--color-fill-3) 100%);
  }
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-1);
}

.tip-subtext {
  font-size: 13px;
  color: var(--color-text-3);
}
</style>
