<template>
  <a-comment class="reply-item">
    <template #avatar>
      <a-avatar :size="28">
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

    <!-- 子回复列表 -->
    <div v-if="reply.replies?.length > 0" class="sub-replies-container">
      <SubReplyItem
        v-for="subReply in reply.replies"
        :key="subReply.id"
        :reply="subReply"
        :reply-target="replyTarget"
        :replying="replying"
        @like="(subReply) => $emit('like-sub-reply', { parent: reply, subReply })"
        @reply="(subReply) => $emit('reply-to-sub-reply', { parent: reply, target: subReply })"
        @delete="(subReply) => $emit('delete-sub-reply', { parent: reply, subReply })"
        @submit-reply="(data) => $emit('submit-reply-to-sub-reply', { parent: reply, ...data })"
        @cancel-reply="$emit('cancel-reply')"
      />
    </div>

    <!-- 回复编辑器 -->
    <ReplyEditor
      v-if="replyTarget === reply.id"
      placeholder="写下你的回复..."
      :mention-users="getMentionUsers(reply)"
      :use-mention="true"
      :submitting="replying"
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
import SubReplyItem from './SubReplyItem.vue'

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

defineEmits([
  'like',
  'reply',
  'delete',
  'like-sub-reply',
  'reply-to-sub-reply',
  'delete-sub-reply',
  'submit-reply',
  'submit-reply-to-sub-reply',
  'cancel-reply',
])

const formatTime = formatTimeAgo

const getMentionUsers = (parentReply) => {
  const userSet = new Set()
  const users = []

  const addUser = (name) => {
    if (name && !userSet.has(name)) {
      userSet.add(name)
      users.push({ value: name, label: name })
    }
  }

  addUser(parentReply.authorName)
  if (parentReply.replies?.length > 0) {
    parentReply.replies.forEach((subReply) => {
      addUser(subReply.authorName)
    })
  }
  return users
}
</script>

<style lang="scss" scoped>
.reply-item {
  margin-left: -30px;
}

.sub-replies-container {
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--color-border-2);

  @media (max-width: 576px) {
    padding-left: 8px;
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
