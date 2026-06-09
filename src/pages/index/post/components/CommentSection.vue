<template>
  <a-card class="comment-card animate-fade-in-scale" :bordered="true">
    <template #title>
      <div class="comment-header">
        <span>评论区</span>
        <span class="comment-count" ref="countRef">{{ totalComments }} 条评论</span>
      </div>
    </template>

    <CommentInput
      ref="commentInputRef"
      :submitting="submitting"
      @submit="handleSubmitComment"
      @login="$emit('login')"
    />

    <CommentList
      :comments="comments"
      :loading="loadingComments"
      :has-more="hasMoreComments"
      :reply-target="replyTarget"
      :replying="replying"
      @like="handleLikeComment"
      @reply="handleToggleReply"
      @delete="handleDeleteComment"
      @like-reply="handleLikeReply"
      @reply-to-reply="handleToggleReplyToReply"
      @delete-reply="handleDeleteReply"
      @like-sub-reply="handleLikeSubReply"
      @reply-to-sub-reply="handleToggleReplyToSubReply"
      @delete-sub-reply="handleDeleteSubReply"
      @submit-reply="handleSubmitReply"
      @submit-reply-to-reply="handleSubmitReplyToReply"
      @submit-reply-to-sub-reply="handleSubmitReplyToSubReply"
      @cancel-reply="cancelReply"
      @load-more="loadMoreComments"
    />
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  getPostComments,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from '@/apis/comments'
import CommentInput from './CommentInput.vue'
import CommentList from './CommentList.vue'
import log from '@/utils/logger'

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true,
  },
  totalComments: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['comment-change', 'login'])

const commentInputRef = ref(null)
const comments = ref([])
const loadingComments = ref(false)
const hasMoreComments = ref(false)
const commentPage = ref(1)
const replyTarget = ref(null)
const replyContent = ref('')
const submitting = ref(false)
const replying = ref(false)

const localTotalComments = ref(props.totalComments)
watch(() => props.totalComments, (newVal) => {
  localTotalComments.value = newVal
})
const countRef = ref(null)

const fetchComments = async () => {
  loadingComments.value = true
  try {
    const res = await getPostComments(props.postId, {
      page: commentPage.value,
      pageSize: 10,
    })
    if (res.code === 200) {
      const commentList = Array.isArray(res.data) ? res.data : res.data.list || []
      if (commentPage.value === 1) {
        comments.value = commentList
        localTotalComments.value = res.data.total || 0
      } else {
        comments.value.push(...commentList)
      }
      hasMoreComments.value = res.data.hasMore || false
    }
  } catch (error) {
    log.error('获取评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

const loadMoreComments = () => {
  commentPage.value++
  fetchComments()
}

const handleSubmitComment = async (content) => {
  submitting.value = true
  try {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()

    if (!userStore.token) {
      Message.warning('请先登录')
      emit('login')
      return
    }

    const res = await createComment(props.postId, { content })
    if (res.code === 200) {
      Message.success('评论发表成功')
      const newComment = {
        ...res.data,
        authorName: userStore.username || '游客',
        authorAvatar: userStore.avatar || '',
        likes: 0,
        isLiked: false,
        replies: [],
      }
      comments.value.unshift(newComment)
      localTotalComments.value += 1
      commentInputRef.value?.clear()
      emit('comment-change', { type: 'add' })
    } else {
      Message.error(res.message || '评论发表失败')
    }
  } catch (error) {
    log.error('评论请求异常:', error)
    Message.error('评论发表失败')
  } finally {
    submitting.value = false
  }
}

const handleToggleReply = (comment) => {
  if (replyTarget.value === comment.id) {
    replyTarget.value = null
  } else {
    replyTarget.value = comment.id
  }
}

const handleToggleReplyToReply = ({ parent, target }) => {
  if (replyTarget.value === target.id) {
    replyTarget.value = null
  } else {
    replyTarget.value = target.id
  }
}

const handleToggleReplyToSubReply = ({ parent, target }) => {
  if (replyTarget.value === target.id) {
    replyTarget.value = null
  } else {
    replyTarget.value = target.id
  }
}

const cancelReply = () => {
  replyTarget.value = null
}

const handleSubmitReply = async ({ target, content }) => {
  await submitReply(target, content)
}

const handleSubmitReplyToReply = async ({ parent, target, content }) => {
  await submitReply(target, content)
}

const handleSubmitReplyToSubReply = async ({ parent, target, content }) => {
  await submitReply(target, content)
}

const submitReply = async (target, content) => {
  replying.value = true
  try {
    const { useUserStore } = await import('@/stores/user')
    const userStore = useUserStore()

    if (!userStore.token) {
      Message.warning('请先登录')
      emit('login')
      return
    }

    const res = await createComment(props.postId, { content }, target.id)
    if (res.code === 200) {
      Message.success('回复成功')
      cancelReply()
      commentPage.value = 1
      fetchComments()
      localTotalComments.value += 1
      emit('comment-change', { type: 'add' })
    } else {
      Message.error(res.message || '回复失败')
    }
  } catch (error) {
    Message.error('回复失败')
  } finally {
    replying.value = false
  }
}

const handleLikeComment = async (comment) => {
  try {
    let res
    if (comment.isLiked) {
      res = await unlikeComment(comment.id)
    } else {
      res = await likeComment(comment.id)
    }
    if (res.code === 200) {
      comment.isLiked = !comment.isLiked
      comment.likeCount = comment.isLiked
        ? (comment.likeCount || 0) + 1
        : Math.max(0, (comment.likeCount || 1) - 1)
    }
  } catch (error) {
    Message.error('操作失败')
  }
}

const handleLikeReply = async ({ parent, reply }) => {
  try {
    let res
    if (reply.isLiked) {
      res = await unlikeComment(reply.id)
    } else {
      res = await likeComment(reply.id)
    }
    if (res.code === 200) {
      reply.isLiked = !reply.isLiked
      reply.likeCount = reply.isLiked
        ? (reply.likeCount || 0) + 1
        : Math.max(0, (reply.likeCount || 1) - 1)
    }
  } catch (error) {
    Message.error('操作失败')
  }
}

const handleLikeSubReply = async ({ parent, subReply }) => {
  try {
    let res
    if (subReply.isLiked) {
      res = await unlikeComment(subReply.id)
    } else {
      res = await likeComment(subReply.id)
    }
    if (res.code === 200) {
      subReply.isLiked = !subReply.isLiked
      subReply.likeCount = subReply.isLiked
        ? (subReply.likeCount || 0) + 1
        : Math.max(0, (subReply.likeCount || 1) - 1)
    }
  } catch (error) {
    Message.error('操作失败')
  }
}

const handleDeleteComment = async (comment) => {
  try {
    const res = await deleteComment(comment.id)
    if (res.code === 200) {
      Message.success('删除成功')
      if (res.data?.includes('子评论')) {
        comment.deleted = true
        comment.content = '该评论已删除'
      } else {
        comments.value = comments.value.filter((c) => c.id !== comment.id)
      }
      localTotalComments.value = Math.max(0, localTotalComments.value - 1)
      emit('comment-change', { type: 'delete' })
    } else {
      Message.error(res.message || '删除失败')
    }
  } catch (error) {
    Message.error('删除失败')
  }
}

const handleDeleteReply = async ({ parent, reply }) => {
  try {
    const res = await deleteComment(reply.id)
    if (res.code === 200) {
      Message.success('删除成功')
      if (res.data?.includes('子评论')) {
        reply.deleted = true
        reply.content = '该评论已删除'
      } else {
        parent.replies = parent.replies.filter((r) => r.id !== reply.id)
        if (parent.deleted && (!parent.replies?.length || parent.replies.every((r) => r.deleted))) {
          comments.value = comments.value.filter((c) => c.id !== parent.id)
        }
      }
      localTotalComments.value = Math.max(0, localTotalComments.value - 1)
      emit('comment-change', { type: 'delete' })
    } else {
      Message.error(res.message || '删除失败')
    }
  } catch (error) {
    Message.error('删除失败')
  }
}

const handleDeleteSubReply = async ({ rootComment, parent, subReply }) => {
  try {
    const res = await deleteComment(subReply.id)
    if (res.code === 200) {
      Message.success('删除成功')
      if (res.data?.includes('子评论')) {
        subReply.deleted = true
        subReply.content = '该评论已删除'
      } else {
        parent.replies = parent.replies.filter((r) => r.id !== subReply.id)
        if (parent.deleted && (!parent.replies?.length || parent.replies.every((r) => r.deleted))) {
          rootComment.replies = rootComment.replies.filter((r) => r.id !== parent.id)
          if (
            rootComment.deleted &&
            (!rootComment.replies?.length || rootComment.replies.every((r) => r.deleted))
          ) {
            comments.value = comments.value.filter((c) => c.id !== rootComment.id)
          }
        }
      }
      localTotalComments.value = Math.max(0, localTotalComments.value - 1)
      emit('comment-change', { type: 'delete' })
    } else {
      Message.error(res.message || '删除失败')
    }
  } catch (error) {
    Message.error('删除失败')
  }
}

watch(
  () => props.postId,
  () => {
    if (props.postId) {
      commentPage.value = 1
      fetchComments()
    }
  },
  { immediate: true },
)

watch(
  () => localTotalComments.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal && countRef.value) {
      countRef.value.classList.add('bounce')
      setTimeout(() => {
        countRef.value?.classList.remove('bounce')
      }, 300)
    }
  },
)

defineExpose({
  refresh: () => {
    commentPage.value = 1
    fetchComments()
  },
})
</script>

<style lang="scss" scoped>
.comment-card {
  border-radius: 12px;
  background-color: var(--color-bg-2);
  border-color: var(--color-border-2);

  :deep(.arco-card-header) {
    border-bottom: 1px solid var(--color-border-2);
    padding: 16px 24px;
  }

  :deep(.arco-card-body) {
    padding: 24px;
  }
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.comment-count {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-3);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.comment-count.bounce {
  transform: scale(1.3);
}
</style>

<style>
@use '../../../../styles/animations.scss';
</style>
