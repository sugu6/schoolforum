<template>
  <a-comment class="sub-reply-item">
    <template #avatar>
      <a-avatar :size="24">
        <img v-if="reply.authorAvatar" :src="getAvatarURL(reply.authorAvatar)" />
        <IconUser v-else />
      </a-avatar>
    </template>
    <template #author>
      <span class="comment-author-name">{{ reply.authorName }}</span>
    </template>
    <template #datetime>
      <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
    </template>
    <template #content>
      <p class="comment-text" :class="{ 'deleted-text': reply.deleted }">
        {{ reply.content }}
      </p>
    </template>
    <template #actions>
      <CommentActions
        v-if="!reply.deleted"
        :item="reply"
        @like="$emit('like', reply)"
        @reply="$emit('reply', reply)"
        @delete="$emit('delete', reply)"
      />
    </template>

    <ReplyEditor
      v-if="replyTarget === reply.id"
      placeholder="写下你的回复..."
      :submitting="replying"
      :nested="true"
      @submit="(content) => $emit('submit-reply', { target: reply, content })"
      @cancel="$emit('cancel-reply')"
    />
  </a-comment>
</template>

<script setup>
import { formatTimeAgo } from '@/utils/time'
import { IconUser } from '@arco-design/web-vue/es/icon'
import { getAvatarURL } from '@/config/server'
import CommentActions from './CommentActions.vue'
import ReplyEditor from './ReplyEditor.vue'

const props = defineProps({
  reply: {
    type: Object,
    required: true,
  },
  replyTarget: {
    type: [String, Number, null],
    default: null,
  },
  replying: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['like', 'reply', 'delete', 'submit-reply', 'cancel-reply'])

const formatTime = formatTimeAgo
</script>

<style lang="scss" scoped>
.sub-reply-item {
  margin-left: -20px;
}

.comment-author-name {
  font-weight: 500;
  color: var(--color-text-1);
}

.comment-time {
  font-size: 12px;
  color: var(--color-text-4);
}

.comment-text {
  font-size: 14px;
  color: var(--color-text-2);
  line-height: 1.6;
  margin: 0;

  @media (max-width: 576px) {
    font-size: 13px;
  }
}

.deleted-text {
  color: var(--color-text-4);
  font-style: italic;
}
</style>
