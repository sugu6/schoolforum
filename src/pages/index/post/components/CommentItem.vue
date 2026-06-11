<template>
  <a-comment class="comment-item">
    <template #avatar>
      <a-avatar :size="36">
        <img v-if="comment.authorAvatar" :src="getAvatarURL(comment.authorAvatar)" />
        <IconUser v-else />
      </a-avatar>
    </template>
    <template #author>
      <span class="comment-author-name">{{ comment.authorName }}</span>
    </template>
    <template #datetime>
      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
    </template>
    <template #content>
      <p class="comment-text" :class="{ 'deleted-text': comment.deleted }">
        {{ comment.content }}
      </p>
    </template>
    <template #actions>
      <CommentActions
        v-if="!comment.deleted"
        :item="comment"
        @like="$emit('like', comment)"
        @reply="$emit('reply', comment)"
        @delete="$emit('delete', comment)"
      />
    </template>

    <!-- 回复列表 -->
    <div v-if="comment.replies?.length > 0" class="replies-container">
      <ReplyItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :reply="reply"
        :reply-target="replyTarget"
        :replying="replying"
        @like="(reply) => $emit('like-reply', { parent: comment, reply })"
        @reply="(reply) => $emit('reply-to-reply', { parent: comment, target: reply })"
        @delete="(reply) => $emit('delete-reply', { parent: comment, reply })"
        @like-sub-reply="(data) => $emit('like-sub-reply', { ...data, rootComment: comment })"
        @reply-to-sub-reply="
          (data) => $emit('reply-to-sub-reply', { ...data, rootComment: comment })
        "
        @delete-sub-reply="(data) => $emit('delete-sub-reply', { ...data, rootComment: comment })"
        @submit-reply="(data) => $emit('submit-reply-to-reply', { parent: comment, ...data })"
        @submit-reply-to-sub-reply="
          (data) => $emit('submit-reply-to-sub-reply', { parent: comment, ...data })
        "
        @cancel-reply="$emit('cancel-reply')"
      />
    </div>

    <!-- 回复编辑器 -->
    <ReplyEditor
      v-if="replyTarget === comment.id"
      placeholder="写下你的回复..."
      :mention-users="getMentionUsers(comment)"
      :use-mention="true"
      :submitting="replying"
      @submit="(content) => $emit('submit-reply', { target: comment, content })"
      @cancel="$emit('cancel-reply')"
    />
  </a-comment>
</template>

<script setup>
import { formatTimeAgo } from '@/utils/time'
import { IconUser } from '@arco-design/web-vue/es/icon'
import { getAvatarURL } from '@/config/server'
import CommentActions from './CommentActions.vue'
import ReplyItem from './ReplyItem.vue'
import ReplyEditor from './ReplyEditor.vue'

const props = defineProps({
  comment: {
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

defineEmits([
  'like',
  'reply',
  'delete',
  'like-reply',
  'reply-to-reply',
  'delete-reply',
  'like-sub-reply',
  'reply-to-sub-reply',
  'delete-sub-reply',
  'submit-reply',
  'submit-reply-to-reply',
  'submit-reply-to-sub-reply',
  'cancel-reply',
])

const formatTime = formatTimeAgo

const getMentionUsers = (parentComment) => {
  const userSet = new Set()
  const users = []

  const addUser = (name) => {
    if (name && !userSet.has(name)) {
      userSet.add(name)
      users.push({ value: name, label: name })
    }
  }

  addUser(parentComment.authorName)
  if (parentComment.replies?.length > 0) {
    parentComment.replies.forEach((reply) => {
      addUser(reply.authorName)
      if (reply.replies?.length > 0) {
        reply.replies.forEach((subReply) => {
          addUser(subReply.authorName)
        })
      }
    })
  }
  return users
}
</script>

<style lang="scss" scoped>
.comment-item {
  :deep(.arco-comment) {
    border-bottom: 1px solid var(--color-border-1);

    &:last-child {
      border-bottom: none;
    }
  }
}

.replies-container {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid var(--color-border-2);

  @media (max-width: 576px) {
    padding-left: 12px;
  }
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
}

.deleted-text {
  color: var(--color-text-4);
  font-style: italic;
}
</style>
