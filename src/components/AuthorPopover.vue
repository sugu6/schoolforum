<template>
  <a-popover trigger="hover" position="bottom" :popup-visible="visible"
    @popup-visible-change="$emit('update:visible', $event)" :content-style="{ padding: '0' }"
    :arrow-style="{ display: 'none' }">
    <a-avatar :size="40" class="author-avatar">
      <img v-if="getAvatarURL(avatar)" :src="getAvatarURL(avatar)" />
      <icon-user v-else />
    </a-avatar>
    <template #content>
      <div class="author-popover" @click.stop>
        <div class="popover-header">
          <a-avatar :size="64" class="popover-avatar">
            <img v-if="getAvatarURL(avatar)" :src="getAvatarURL(avatar)" />
            <icon-user v-else />
          </a-avatar>
          <div class="popover-user-info">
            <span class="popover-username">
              {{ authorName }}
              <IconMan v-if="authorGender === 'MALE'" class="gender-icon male" />
              <IconWoman v-else-if="authorGender === 'FEMALE'" class="gender-icon female" />
            </span>
            <span class="popover-bio">{{ authorBio }}</span>
          </div>
        </div>
        <div class="popover-stats">
          <div class="stat-item">
            <span class="stat-value clickable" @click.stop="goToUserPage('posts')">{{
              authorStats.postCount || 0
              }}</span>
            <span class="stat-label">帖子</span>
          </div>
          <div class="stat-item">
            <span class="stat-value clickable" @click.stop="goToUserPage('following')">{{
              authorStats.followingCount || 0
              }}</span>
            <span class="stat-label">关注</span>
          </div>
          <div class="stat-item">
            <span class="stat-value clickable" @click.stop="goToUserPage('followers')">{{
              authorStats.followerCount || 0
              }}</span>
            <span class="stat-label">粉丝</span>
          </div>
        </div>
        <div class="popover-actions" v-if="showActions">
          <a-button :type="isFollowed ? 'secondary' : 'primary'" size="small" :loading="followLoading"
            @click.stop="$emit('follow')">
            {{ isFollowed ? '已关注' : '关注' }}
          </a-button>
          <a-button type="outline" size="small" @click.stop="$emit('private-message')">
            <template #icon><icon-message /></template>
            私信
          </a-button>
        </div>
      </div>
    </template>
  </a-popover>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconUser, IconMan, IconWoman } from '@arco-design/web-vue/es/icon'
import { getAvatarURL } from '@/config/server'
import { getUserInfoById, getUserPosts } from '@/apis/users'
import { getFollowingList, getFollowersList } from '@/apis/follows'
import log from '@/utils/logger'

const props = defineProps({
  authorId: { type: [Number, String], required: true },
  authorName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
  isFollowed: { type: Boolean, default: false },
  followLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'follow', 'private-message', 'author-loaded'])

const router = useRouter()

const authorBio = ref('这个人很懒，什么都没写~')
const authorGender = ref('SECRET')
const authorStats = ref({ postCount: 0, followerCount: 0, followingCount: 0 })
const userInfoLoaded = ref(false)

const toBool = (val) => val === true || val === 'true' || val === 1 || val === '1'

const goToUserPage = (tab = 'posts') => {
  if (!props.authorId) return
  router.push(`/user/${props.authorId}?tab=${tab}`)
}

const fetchAuthorInfo = async () => {
  if (!props.authorId || userInfoLoaded.value) return

  try {
    const [userRes, postsRes, followingRes, followersRes] = await Promise.all([
      getUserInfoById(props.authorId),
      getUserPosts(props.authorId, { pageNumber: 1, pageSize: 1 }),
      getFollowingList(props.authorId, { pageNumber: 1, pageSize: 1 }),
      getFollowersList(props.authorId, { pageNumber: 1, pageSize: 1 }),
    ])

    if (userRes.code === 200 && userRes.data) {
      authorBio.value = userRes.data.bio || '这个人很懒，什么都没写~'
      authorGender.value = userRes.data.gender || 'SECRET'
      emit('author-loaded', userRes.data)
    }

    authorStats.value = {
      postCount: postsRes.code === 200 ? postsRes.data?.totalRow || postsRes.data?.total || 0 : 0,
      followingCount: followingRes.code === 200 ? followingRes.data?.totalRow || followingRes.data?.total || 0 : 0,
      followerCount: followersRes.code === 200 ? followersRes.data?.totalRow || followersRes.data?.total || 0 : 0,
    }

    userInfoLoaded.value = true
  } catch (error) {
    log.error('获取作者信息失败:', error)
  }
}

watch(() => props.visible, (val) => {
  if (val) fetchAuthorInfo()
})
</script>

<style lang="scss" scoped>
.author-avatar {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.author-popover {
  width: 280px;
  padding: 16px;
}

.popover-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.popover-avatar {
  flex-shrink: 0;
  background: rgb(var(--primary-6));
}

.popover-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.popover-username {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;

  .gender-icon {
    flex-shrink: 0;
    font-size: 16px;

    &.male { color: #1890ff; }
    &.female { color: #eb2f96; }
  }
}

.popover-bio {
  font-size: 13px;
  color: var(--color-text-3);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popover-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  border-top: 1px solid var(--color-border-2);
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);

  &.clickable {
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: rgb(var(--primary-6));
    }
  }
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-3);
}

.popover-actions {
  display: flex;
  gap: 8px;

  :deep(.arco-btn) {
    flex: 1;
  }
}
</style>
