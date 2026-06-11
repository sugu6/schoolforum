<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-sidebar">
        <a-card class="user-card" :bordered="true">
          <div class="user-avatar-section">
            <a-upload :fileList="avatarFile ? [avatarFile] : []" :show-file-list="false" :auto-upload="false"
              @change="handleAvatarChange" @progress="handleAvatarProgress" accept="image/*" :limit="1">
              <template #upload-button>
                <div :class="[
                  'avatar-upload-wrapper',
                  { 'avatar-upload-error': avatarFile && avatarFile.status === 'error' },
                ]">
                  <div class="avatar-preview" v-if="avatarFile && avatarFile.url">
                    <img :src="avatarFile.url" alt="avatar" />
                    <div class="avatar-mask">
                      <IconCamera />
                      <span>更换头像</span>
                    </div>
                    <a-progress v-if="avatarFile.status === 'uploading' && avatarFile.percent < 100"
                      :percent="avatarFile.percent" type="circle" size="mini" class="avatar-progress" />
                  </div>
                  <div class="avatar-default" v-else>
                    <a-avatar :size="100" class="avatar">
                      <img v-if="userStore.avatar" :src="userStore.avatar" alt="avatar" />
                      <IconUser v-else :size="48" />
                    </a-avatar>
                    <div class="avatar-mask">
                      <IconCamera />
                      <span>更换头像</span>
                    </div>
                  </div>
                </div>
              </template>
            </a-upload>
          </div>
          <div class="user-info">
            <h2 class="username">
              <span>{{ userStore.username || '用户名' }}</span>
              <IconMan v-if="userInfo.gender === 'MALE'" class="gender-icon male" />
              <IconWoman v-else-if="userInfo.gender === 'FEMALE'" class="gender-icon female" />
            </h2>
            <p class="user-bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</p>
          </div>
          <div class="user-stats">
            <div class="stat-item" :class="{ active: activeStatTab === 'posts' }" @click="handleStatClick('posts')">
              <span class="stat-value">{{ userInfo.postCount || 0 }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item" :class="{ active: activeStatTab === 'following' }"
              @click="handleStatClick('following')">
              <span class="stat-value">{{ userInfo.followingCount || 0 }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item" :class="{ active: activeStatTab === 'followers' }"
              @click="handleStatClick('followers')">
              <span class="stat-value">{{ userInfo.followerCount || 0 }}</span>
              <span class="stat-label">粉丝</span>
            </div>
          </div>
        </a-card>

        <a-menu :selected-keys="[activeMenu]" class="side-menu" @menu-item-click="handleMenuClick">
          <a-menu-item key="profile">
            <IconUser />
            个人资料
          </a-menu-item>
          <a-menu-item key="favorites">
            <IconStar />
            收藏帖子
          </a-menu-item>
          <a-menu-item key="security">
            <IconLock />
            账号安全
          </a-menu-item>
          <a-menu-item key="privacy">
            <IconEye />
            隐私设置
          </a-menu-item>
          <a-menu-item key="binding">
            <IconLink />
            账号绑定
          </a-menu-item>
        </a-menu>
      </div>

      <div class="profile-main">
        <a-card class="main-card" :bordered="true">
          <template #title>
            <div class="card-title-center">
              <span>{{ activeStatTab ? menuTitles[activeStatTab] : menuTitles[activeMenu] }}</span>
            </div>
          </template>

          <div v-if="activeMenu === 'profile'" class="profile-form">
            <a-form :model="profileForm" layout="inline" @submit="handleUpdateProfile">
              <a-row :gutter="[24, 16]" style="width: 100%">
                <a-col :span="12">
                  <a-form-item label="用户名" field="username" :rules="[
                    { minLength: 2, message: '用户名至少2个字符' },
                    { maxLength: 20, message: '用户名最多20个字符' },
                  ]">
                    <a-input v-model="profileForm.username" placeholder="请输入用户名" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="邮箱" field="email" :rules="[{ type: 'email', message: '请输入正确的邮箱格式' }]">
                    <a-input v-model="profileForm.email" placeholder="请输入邮箱" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="年龄" field="age">
                    <a-input-number v-model="profileForm.age" :min="1" :max="120" placeholder="请输入年龄"
                      style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="性别" field="gender">
                    <a-radio-group v-model="profileForm.gender">
                      <a-radio value="SECRET">保密</a-radio>
                      <a-radio value="MALE">男</a-radio>
                      <a-radio value="FEMALE">女</a-radio>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="个人简介" field="bio">
                    <a-textarea v-model="profileForm.bio" placeholder="介绍一下自己吧~" :max-length="200" show-word-limit
                      :auto-size="{ minRows: 3, maxRows: 6 }" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item>
                    <a-space>
                      <a-button type="primary" html-type="submit" :loading="updateLoading">
                        保存修改
                      </a-button>
                      <a-button @click="resetProfileForm">重置</a-button>
                    </a-space>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </div>

          <div v-else-if="activeMenu === 'favorites'" class="favorites-section">
            <a-spin :loading="favoritesLoading" class="favorites-loading">
              <div v-if="favoritePosts.length > 0" class="favorites-list">
                <div v-for="item in favoritePosts" :key="item.id" class="favorite-card" @click="goToPost(item.id)">
                  <!-- 左侧封面/图片 -->
                  <div class="card-left">
                    <img v-if="item.coverImage || getFirstImage(item.content)" :src="item.coverImage
                        ? getCoverImageUrl(item.coverImage)
                        : getFirstImage(item.content)
                      " class="card-thumb" />
                    <div v-else class="card-thumb-placeholder">
                      <IconFile class="placeholder-icon" />
                    </div>
                  </div>
                  <!-- 右侧内容 -->
                  <div class="card-right">
                    <div class="card-header">
                      <h4 class="card-title">{{ item.title }}</h4>
                      <span class="card-category" v-if="item.categoryName">
                        {{ item.categoryName }}
                      </span>
                    </div>
                    <p class="card-summary">
                      {{
                        item.contentSummary || stripMarkdownContent(item.content, 100) || '暂无摘要'
                      }}
                    </p>
                    <div class="card-footer">
                      <div class="card-meta">
                        <span class="meta-item">
                          <IconUser class="meta-icon" />
                          <span>{{ item.authorName || '匿名用户' }}</span>
                        </span>
                        <span class="meta-item">
                          <IconClockCircle class="meta-icon" />
                          <span>{{ formatTime(item.createdAt) }}</span>
                        </span>
                        <span class="meta-item">
                          <IconEye class="meta-icon" />
                          <span>{{ item.viewCount || 0 }}</span>
                        </span>
                      </div>
                      <a-button type="text" size="small" class="unfavorite-btn" @click.stop="handleUnfavorite(item)">
                        <template #icon>
                          <IconStarFill />
                        </template>
                      </a-button>
                    </div>
                  </div>
                </div>
              </div>

              <a-empty v-else-if="!favoritesLoading" description="暂无收藏的帖子" class="favorites-empty">
                <template #image>
                  <IconStar :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>

            <div v-if="favoritePosts.length > 0" class="pagination">
              <a-pagination v-model:current="favoritesPagination.current" :total="favoritesPagination.total"
                :page-size="favoritesPagination.pageSize" show-total show-jumper @change="fetchFavoritePosts" />
            </div>
          </div>

          <div v-else-if="activeMenu === 'security'" class="security-section">
            <a-tabs v-model:active-key="securityActiveTab" type="line" size="large">
              <a-tab-pane key="password" title="修改密码">
                <div class="security-tab-content">
                  <a-form :model="passwordForm" layout="vertical" @submit="handleChangePassword">
                    <a-form-item label="当前密码" field="oldPassword" :rules="[{ required: true, message: '请输入当前密码' }]">
                      <a-input-password v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
                    </a-form-item>
                    <a-form-item label="新密码" field="newPassword" :rules="[
                      { required: true, message: '请输入新密码' },
                      { minLength: 6, message: '密码长度不能少于6位' },
                      { validator: validateNewPassword },
                    ]">
                      <a-input-password v-model="passwordForm.newPassword" placeholder="请输入新密码" />
                    </a-form-item>
                    <a-form-item label="确认新密码" field="confirmPassword" :rules="[
                      { required: true, message: '请确认新密码' },
                      { validator: validateConfirmPassword },
                    ]">
                      <a-input-password v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
                    </a-form-item>
                    <a-form-item label="验证码" field="captcha" :rules="[{ required: true, message: '请输入验证码' }]">
                      <div class="captcha-row">
                        <a-input v-model="passwordForm.captcha" placeholder="请输入验证码" allow-clear />
                        <a-button type="primary" :loading="captchaLoading" :disabled="captchaCountdown > 0"
                          @click="handleSendCaptcha">
                          {{ captchaCountdown > 0 ? `${captchaCountdown}s` : '获取验证码' }}
                        </a-button>
                      </div>
                    </a-form-item>
                    <a-form-item>
                      <a-button type="primary" html-type="submit" :loading="passwordLoading">
                        修改密码
                      </a-button>
                    </a-form-item>
                  </a-form>
                </div>
              </a-tab-pane>
              <a-tab-pane key="delete" title="注销账户">
                <div class="security-tab-content">
                  <!-- 已申请注销状态 -->
                  <div v-if="deletionStatus?.status === 'PENDING'" class="deletion-pending-section">
                    <div class="deletion-warning-banner">
                      <IconExclamationCircle class="warning-icon" />
                      <div class="warning-text">
                        <div class="warning-title">账户注销申请已提交</div>
                        <div class="warning-desc">
                          您的账户将于
                          <span class="highlight-time">{{
                            formatDeletionTime(deletionStatus.scheduledAt)
                            }}</span>
                          被永久注销
                        </div>
                      </div>
                    </div>

                    <div class="countdown-container">
                      <a-countdown :value="new Date(deletionStatus.scheduledAt).getTime()" :now="Date.now()"
                        format="D 天 H 时 m 分 s 秒" :value-style="{
                          fontSize: '42px',
                          fontWeight: 700,
                          lineHeight: '1.2',
                        }" @finish="handleCountdownFinish" />
                      <div class="countdown-label">距离注销还有</div>
                    </div>

                    <div class="deletion-tips">
                      <IconBulb :size="14" />
                      <span>在冷静期内您可以随时撤销注销申请，撤销后账户将恢复正常使用</span>
                    </div>

                    <a-button type="primary" status="success" size="large" @click="handleCancelDeletion"
                      class="cancel-btn">
                      <template #icon>
                        <IconUndo />
                      </template>
                      撤销注销申请
                    </a-button>
                  </div>

                  <!-- 正常注销申请表单 -->
                  <div v-else class="delete-account-section">
                    <div class="delete-account-warning">
                      <div class="warning-icon">
                        <IconExclamationCircle />
                      </div>
                      <div class="warning-content">
                        <h4>注销账户前请仔细阅读以下信息</h4>
                        <ul>
                          <li>账户注销后，您的所有个人数据将被永久删除，无法恢复</li>
                          <li>您发布的帖子、评论等内容将会被匿名化处理或删除</li>
                          <li>您将无法再使用该账户登录系统</li>
                          <li>与该账户相关的所有绑定关系将被解除</li>
                        </ul>
                      </div>
                    </div>
                    <a-form :model="deleteAccountForm" layout="vertical" @submit="handleDeleteAccount">
                      <a-form-item label="注销原因（选填）" field="reason">
                        <a-textarea v-model="deleteAccountForm.reason" placeholder="请简要说明注销原因，帮助我们改进服务..."
                          :auto-size="{ minRows: 3, maxRows: 5 }" :max-length="200" show-word-limit />
                      </a-form-item>
                      <a-form-item>
                        <a-button type="primary" status="danger" html-type="submit" :loading="deleteAccountLoading">
                          确认注销账户
                        </a-button>
                      </a-form-item>
                    </a-form>
                  </div>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>

          <div v-else-if="activeMenu === 'privacy'" class="privacy-section">
            <div class="privacy-item">
              <div class="privacy-item-info">
                <div class="privacy-item-title">关注列表</div>
                <div class="privacy-item-desc">公开后其他用户可查看您的关注列表</div>
              </div>
              <a-switch v-model="privacySettings.showFollowing" :loading="privacyLoading"
                @change="handlePrivacyChange" />
            </div>

            <div class="privacy-item">
              <div class="privacy-item-info">
                <div class="privacy-item-title">粉丝列表</div>
                <div class="privacy-item-desc">公开后其他用户可查看您的粉丝列表</div>
              </div>
              <a-switch v-model="privacySettings.showFollowers" :loading="privacyLoading"
                @change="handlePrivacyChange" />
            </div>
          </div>

          <div v-else-if="activeMenu === 'binding'" class="binding-section">
            <div class="binding-item">
              <div class="binding-info">
                <div class="binding-icon github-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div class="binding-text">
                  <span class="binding-name">GitHub</span>
                  <span class="binding-desc" v-if="bindingStatus.github"> 已绑定 GitHub 账号 </span>
                  <span class="binding-desc" v-else> 绑定后可使用 GitHub 快速登录 </span>
                </div>
              </div>
              <div class="binding-action">
                <a-button v-if="bindingStatus.github" type="outline" status="danger" @click="handleUnbindGithub">
                  解除绑定
                </a-button>
                <a-button v-else type="primary" @click="handleBindGithub" :loading="githubBindLoading">
                  绑定
                </a-button>
              </div>
            </div>
          </div>

          <div v-else-if="activeStatTab === 'posts'" class="stat-posts-section">
            <a-spin :loading="statPostsLoading" class="favorites-loading">
              <div v-if="statPosts.length > 0" class="favorites-list">
                <div v-for="item in statPosts" :key="item.id" class="favorite-card" @click="goToPost(item.id)">
                  <div class="card-left">
                    <img v-if="item.coverImage || getFirstImage(item.content)" :src="item.coverImage
                        ? getCoverImageUrl(item.coverImage)
                        : getFirstImage(item.content)
                      " class="card-thumb" />
                    <div v-else class="card-thumb-placeholder">
                      <IconFile class="placeholder-icon" />
                    </div>
                  </div>
                  <div class="card-right">
                    <div class="card-header">
                      <h4 class="card-title">{{ item.title }}</h4>
                      <span class="card-category" v-if="item.categoryName">
                        {{ item.categoryName }}
                      </span>
                    </div>
                    <p class="card-summary">
                      {{
                        item.contentSummary || stripMarkdownContent(item.content, 100) || '暂无摘要'
                      }}
                    </p>
                    <div class="card-footer">
                      <div class="card-meta">
                        <span class="meta-item">
                          <IconClockCircle class="meta-icon" />
                          <span>{{ formatTime(item.createdAt) }}</span>
                        </span>
                        <span class="meta-item">
                          <IconEye class="meta-icon" />
                          <span>{{ item.viewCount || 0 }}</span>
                        </span>
                        <span class="meta-item">
                          <IconHeart class="meta-icon" />
                          <span>{{ item.likeCount || 0 }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <a-empty v-else-if="!statPostsLoading" description="暂无帖子" class="favorites-empty">
                <template #image>
                  <IconFile :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="statPosts.length > 0" class="pagination">
              <a-pagination v-model:current="statPostsPagination.current" :total="statPostsPagination.total"
                :page-size="statPostsPagination.pageSize" show-total show-jumper @change="fetchStatPosts" />
            </div>
          </div>

          <div v-else-if="activeStatTab === 'following'" class="stat-users-section">
            <a-spin :loading="followingLoading" class="favorites-loading">
              <div v-if="followingList.length > 0" class="users-list">
                <div v-for="user in followingList" :key="user.id" class="user-list-item"
                  @click="router.push(`/user/${user.id}`)">
                  <a-avatar :size="48" class="user-list-avatar">
                    <img v-if="user.avatarUrl" :src="getAvatarURL(user.avatarUrl)" />
                    <IconUser v-else />
                  </a-avatar>
                  <div class="user-list-info">
                    <div class="user-list-name">
                      <span>{{ user.username }}</span>
                      <IconMan v-if="user.gender === 'MALE'" class="gender-icon male" />
                      <IconWoman v-else-if="user.gender === 'FEMALE'" class="gender-icon female" />
                    </div>
                    <span class="user-list-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</span>
                  </div>
                  <a-button :type="followStatusMap[user.id] ? 'secondary' : 'primary'" size="small"
                    @click.stop="handleFollowToggle(user)">
                    {{ followStatusMap[user.id] ? '已关注' : '关注' }}
                  </a-button>
                </div>
              </div>
              <a-empty v-else-if="!followingLoading" description="暂无关注" class="favorites-empty">
                <template #image>
                  <IconUser :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="followingList.length > 0" class="pagination">
              <a-pagination v-model:current="followingPagination.current" :total="followingPagination.total"
                :page-size="followingPagination.pageSize" show-total show-jumper @change="fetchFollowingList" />
            </div>
          </div>

          <div v-else-if="activeStatTab === 'followers'" class="stat-users-section">
            <a-spin :loading="followersLoading" class="favorites-loading">
              <div v-if="followersList.length > 0" class="users-list">
                <div v-for="user in followersList" :key="user.id" class="user-list-item"
                  @click="router.push(`/user/${user.id}`)">
                  <a-avatar :size="48" class="user-list-avatar">
                    <img v-if="user.avatarUrl" :src="getAvatarURL(user.avatarUrl)" />
                    <IconUser v-else />
                  </a-avatar>
                  <div class="user-list-info">
                    <div class="user-list-name">
                      <span>{{ user.username }}</span>
                      <IconMan v-if="user.gender === 'MALE'" class="gender-icon male" />
                      <IconWoman v-else-if="user.gender === 'FEMALE'" class="gender-icon female" />
                    </div>
                    <span class="user-list-bio">{{ user.bio || '这个人很懒，什么都没写~' }}</span>
                  </div>
                  <a-button v-if="String(user.id) !== String(userStore.userId)"
                    :type="followStatusMap[user.id] ? 'secondary' : 'primary'" size="small"
                    @click.stop="handleFollowToggle(user)">
                    {{ followStatusMap[user.id] ? '已关注' : '关注' }}
                  </a-button>
                </div>
              </div>
              <a-empty v-else-if="!followersLoading" description="暂无粉丝" class="favorites-empty">
                <template #image>
                  <IconUser :size="48" style="color: var(--color-text-4)" />
                </template>
              </a-empty>
            </a-spin>
            <div v-if="followersList.length > 0" class="pagination">
              <a-pagination v-model:current="followersPagination.current" :total="followersPagination.total"
                :page-size="followersPagination.pageSize" show-total show-jumper @change="fetchFollowersList" />
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconUser,
  IconCamera,
  IconStar,
  IconStarFill,
  IconHeart,
  IconLock,
  IconLink,
  IconClockCircle,
  IconEye,
  IconFile,
  IconExclamationCircle,
  IconUndo,
  IconBulb,
  IconMan,
  IconWoman,
} from '@arco-design/web-vue/es/icon'
import {
  getFavoritePosts,
  unfavoritePost,
  updateUserInfo,
  updateAvatar,
  changePassword,
  getUserInfo,
  unbindGithub,
  getCaptcha,
  bindGithub,
  updatePrivacy,
  requestAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionStatus,
} from '@/apis/users'
import {
  getFollowingList,
  getFollowersList,
  followUser,
  unfollowUser,
  checkFollowStatus,
} from '@/apis/follows'
import { getMyPosts } from '@/apis/posts'
import { useUserStore } from '@/stores/user'
import { stripMarkdown } from '@/utils/markdown'
import log from '@/utils/logger'
import { getImageURL, getAvatarURL } from '@/config/server'
import { usePageRefresh } from '@/composables/usePageRefresh'
import { formatTimeAgo } from '@/utils/time'

definePage({
  meta: {
    title: '个人中心',
    requiresAuth: true,
  },
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { markForRefresh } = usePageRefresh()

const menuKeyMap = {
  profile: 'profile',
  favorites: 'favorites',
  security: 'security',
  privacy: 'privacy',
  binding: 'binding',
  posts: 'posts',
  following: 'following',
  followers: 'followers',
}

const activeMenu = ref(
  ['posts', 'following', 'followers'].includes(route.query.tab)
    ? ''
    : menuKeyMap[route.query.tab] || 'profile',
)
const activeStatTab = ref(
  ['posts', 'following', 'followers'].includes(route.query.tab) ? route.query.tab : '',
)
const menuTitles = {
  profile: '个人资料',
  favorites: '收藏帖子',
  security: '账号安全',
  privacy: '隐私设置',
  binding: '账号绑定',
  posts: '我的帖子',
  following: '关注列表',
  followers: '粉丝列表',
}

const userInfo = ref({
  postCount: 0,
  followingCount: 0,
  followerCount: 0,
  bio: '',
  gender: '',
})

const profileForm = reactive({
  username: '',
  email: '',
  age: null,
  gender: '',
  bio: '',
})

const updateLoading = ref(false)

const avatarFile = ref(null)

const favoritePosts = ref([])
const favoritesLoading = ref(false)
const favoritesPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  captcha: '',
})
const passwordLoading = ref(false)
const captchaLoading = ref(false)
const captchaCountdown = ref(0)

const securityActiveTab = ref('password')

const deleteAccountForm = reactive({
  reason: '',
})
const deleteAccountLoading = ref(false)

// 账户注销状态
const deletionStatus = ref(null)

const { pause: pauseCaptcha, resume: resumeCaptcha } = useIntervalFn(
  () => {
    if (captchaCountdown.value > 0) {
      captchaCountdown.value--
    } else {
      pauseCaptcha()
    }
  },
  1000,
  { immediate: false },
)

const bindingStatus = reactive({
  github: false,
  githubUsername: '',
})
const githubBindLoading = ref(false)

const toBool = (val) => val === true || val === 'true' || val === 1 || val === '1'

const privacySettings = reactive({
  showFollowing: false,
  showFollowers: false,
})
const privacyLoading = ref(false)

const statPosts = ref([])
const statPostsLoading = ref(false)
const statPostsPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const followingList = ref([])
const followingLoading = ref(false)
const followingPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const followersList = ref([])
const followersLoading = ref(false)
const followersPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const followStatusMap = reactive({})

const handleMenuClick = (key) => {
  activeMenu.value = key
  activeStatTab.value = ''
  router.replace({ query: { ...route.query, tab: key } })
  if (key === 'favorites') {
    fetchFavoritePosts()
  }
}

const handleStatClick = (type) => {
  activeMenu.value = ''
  activeStatTab.value = type
  router.replace({ query: { ...route.query, tab: type } })
  if (type === 'posts') {
    fetchStatPosts()
  } else if (type === 'following') {
    fetchFollowingList()
  } else if (type === 'followers') {
    fetchFollowersList()
  }
}

const fetchStatPosts = async () => {
  statPostsLoading.value = true
  try {
    const res = await getMyPosts({
      pageNumber: statPostsPagination.current,
      pageSize: statPostsPagination.pageSize,
    })
    if (res.code === 200) {
      statPosts.value = res.data.records || []
      statPostsPagination.total = res.data.totalRow || 0
    }
  } catch (error) {
    log.error('获取用户帖子失败:', error)
  } finally {
    statPostsLoading.value = false
  }
}

const fetchFollowingList = async () => {
  if (!userStore.userId) return
  followingLoading.value = true
  try {
    const res = await getFollowingList(userStore.userId, {
      pageNumber: followingPagination.current,
      pageSize: followingPagination.pageSize,
    })
    if (res.code === 200) {
      followingList.value = res.data.records || []
      followingPagination.total = res.data.totalRow || 0
      followingList.value.forEach((user) => {
        if (followStatusMap[user.id] === undefined) {
          followStatusMap[user.id] = true
        }
      })
    }
  } catch (error) {
    log.error('获取关注列表失败:', error)
  } finally {
    followingLoading.value = false
  }
}

const fetchFollowersList = async () => {
  if (!userStore.userId) return
  followersLoading.value = true
  try {
    const res = await getFollowersList(userStore.userId, {
      pageNumber: followersPagination.current,
      pageSize: followersPagination.pageSize,
    })
    if (res.code === 200) {
      followersList.value = res.data.records || []
      followersPagination.total = res.data.totalRow || 0
      for (const user of followersList.value) {
        if (followStatusMap[user.id] === undefined) {
          try {
            const checkRes = await checkFollowStatus(user.id)
            if (checkRes.code === 200) {
              followStatusMap[user.id] = checkRes.data?.isFollowing === true
            }
          } catch {
            followStatusMap[user.id] = false
          }
        }
      }
    }
  } catch (error) {
    log.error('获取粉丝列表失败:', error)
  } finally {
    followersLoading.value = false
  }
}

const handleFollowToggle = async (user) => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }
  const isFollowed = followStatusMap[user.id]
  try {
    if (isFollowed) {
      const res = await unfollowUser(user.id)
      if (res.code === 200) {
        followStatusMap[user.id] = false
        userInfo.value.followingCount = Math.max(0, userInfo.value.followingCount - 1)
        Message.success('已取消关注')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    } else {
      const res = await followUser(user.id)
      if (res.code === 200) {
        followStatusMap[user.id] = true
        userInfo.value.followingCount += 1
        Message.success('关注成功')
      } else {
        Message.error(res.msg || res.message || '操作失败')
      }
    }
  } catch (error) {
    Message.error('操作失败')
  }
}

const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    log.debug('获取用户信息返回:', res)
    if (res.code === 200) {
      const newGender = res.data.gender
      const newShowFollowing = res.data.showFollowing
      const newShowFollowers = res.data.showFollowers

      userInfo.value = {
        postCount: res.data.postCount || 0,
        followingCount: res.data.followingCount || 0,
        followerCount: res.data.followerCount || 0,
        bio: res.data.bio || '',
        gender: newGender || userInfo.value.gender,
      }
      profileForm.username = res.data.username || ''
      profileForm.email = res.data.email || ''
      profileForm.age = res.data.age || null
      profileForm.gender = newGender || profileForm.gender
      profileForm.bio = res.data.bio || ''
      bindingStatus.github = !!res.data.githubId
      bindingStatus.githubUsername = res.data.githubUsername || ''

      if (newShowFollowing !== undefined && newShowFollowing !== null) {
        privacySettings.showFollowing = toBool(newShowFollowing)
      }
      if (newShowFollowers !== undefined && newShowFollowers !== null) {
        privacySettings.showFollowers = toBool(newShowFollowers)
      }

      if (userStore.userId) {
        const [postsRes, followingRes, followersRes] = await Promise.all([
          getMyPosts({ pageNumber: 1, pageSize: 1 }),
          getFollowingList(userStore.userId, { pageNumber: 1, pageSize: 1 }),
          getFollowersList(userStore.userId, { pageNumber: 1, pageSize: 1 }),
        ])
        if (postsRes.code === 200) {
          userInfo.value.postCount = postsRes.data?.totalRow || 0
        }
        if (followingRes.code === 200) {
          userInfo.value.followingCount = followingRes.data?.totalRow || 0
        }
        if (followersRes.code === 200) {
          userInfo.value.followerCount = followersRes.data?.totalRow || 0
        }
      }
    }
  } catch (error) {
    log.error('获取用户信息失败:', error)
  }
}

const fetchFavoritePosts = async () => {
  favoritesLoading.value = true
  try {
    const res = await getFavoritePosts({
      pageNumber: favoritesPagination.current,
      pageSize: favoritesPagination.pageSize,
    })
    if (res.code === 200) {
      favoritePosts.value = res.data.records || []
      favoritesPagination.total = res.data.totalRow || 0
    }
  } catch (error) {
    log.error('获取收藏帖子失败:', error)
  } finally {
    favoritesLoading.value = false
  }
}

const handleUpdateProfile = async () => {
  if (profileForm.username && profileForm.username.length < 2) {
    Message.warning('用户名至少2个字符')
    return
  }
  if (profileForm.username && profileForm.username.length > 20) {
    Message.warning('用户名最多20个字符')
    return
  }
  if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
    Message.warning('请输入正确的邮箱格式')
    return
  }
  if (
    profileForm.age !== null &&
    profileForm.age !== undefined &&
    (profileForm.age < 1 || profileForm.age > 120)
  ) {
    Message.warning('年龄必须在1-120之间')
    return
  }

  updateLoading.value = true
  try {
    const params = {}
    if (profileForm.username) params.username = profileForm.username
    if (profileForm.email) params.email = profileForm.email
    if (profileForm.age !== null && profileForm.age !== undefined) params.age = profileForm.age
    if (profileForm.gender) params.gender = profileForm.gender
    params.bio = profileForm.bio || ''

    log.debug('更新用户信息请求参数:', params)
    const res = await updateUserInfo(params)
    log.debug('更新用户信息响应:', res)

    if (res.code === 200) {
      Message.success('更新成功')
      userStore.updateUserInfo({
        username: profileForm.username,
        bio: profileForm.bio,
      })
      markForRefresh(`/user/${userStore.userId}`)
      fetchUserInfo()
    } else {
      Message.error(res.msg || res.message || '更新失败')
    }
  } catch (error) {
    log.error('更新用户信息错误:', error)
    Message.error('更新失败')
  } finally {
    updateLoading.value = false
  }
}

const resetProfileForm = () => {
  profileForm.username = userStore.username || ''
  profileForm.email = userStore.userInfo?.email || ''
  profileForm.age = userStore.userInfo?.age || null
  profileForm.gender = userStore.userInfo?.gender || ''
  profileForm.bio = userInfo.value.bio || ''
}

const handleAvatarChange = async (_, currentFile) => {
  if (!currentFile || !currentFile.file) return

  // 释放旧的 Blob URL
  if (avatarFile.value?.url?.startsWith('blob:')) {
    URL.revokeObjectURL(avatarFile.value.url)
  }

  avatarFile.value = {
    ...currentFile,
    url: URL.createObjectURL(currentFile.file),
  }

  try {
    const res = await updateAvatar(currentFile.file)
    log.debug('上传头像接口返回:', res)
    if (res.code === 200) {
      Message.success('头像更新成功')
      userStore.updateUserInfo({ avatarUrl: res.data.avatarUrl })
      markForRefresh(`/user/${userStore.userId}`)
      // 上传成功后释放 Blob URL
      if (avatarFile.value?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarFile.value.url)
      }
      avatarFile.value = null
    } else {
      Message.error(res.message || '头像更新失败')
      avatarFile.value = {
        ...avatarFile.value,
        status: 'error',
      }
    }
  } catch (error) {
    log.error('上传头像错误:', error)
    Message.error('头像上传失败')
    avatarFile.value = {
      ...avatarFile.value,
      status: 'error',
    }
  }
}

const handleAvatarProgress = (currentFile) => {
  avatarFile.value = currentFile
}

const handleUnfavorite = (post) => {
  Modal.confirm({
    title: '确认取消收藏',
    content: `确定要取消收藏「${post.title}」吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await unfavoritePost(post.id)
        if (res.code === 200) {
          Message.success('已取消收藏')
          fetchFavoritePosts()
        } else {
          Message.error(res.message || '操作失败')
        }
      } catch (error) {
        Message.error('操作失败')
      }
    },
  })
}

const validateConfirmPassword = (value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback('两次输入的密码不一致')
  } else {
    callback()
  }
}

const validateNewPassword = (value, callback) => {
  if (value && passwordForm.oldPassword && value === passwordForm.oldPassword) {
    callback('新密码不能与当前密码相同')
  } else {
    callback()
  }
}

const handleSendCaptcha = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    Message.warning('请先输入当前密码和新密码')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    Message.warning('新密码长度不能少于6位')
    return
  }
  if (passwordForm.newPassword === passwordForm.oldPassword) {
    Message.warning('新密码不能与当前密码相同')
    return
  }
  captchaLoading.value = true
  try {
    log.debug('发送验证码请求:', { type: 'changePassword' })
    const res = await getCaptcha(null, 'changePassword')
    log.debug('验证码响应:', res)
    if (res.code === 200) {
      Message.success('验证码已发送')
      captchaCountdown.value = 60
      resumeCaptcha()
    } else {
      Message.error(res.msg || res.message || '发送失败')
    }
  } catch (error) {
    log.error('验证码错误:', error)
    Message.error('发送失败')
  } finally {
    captchaLoading.value = false
  }
}

const handleChangePassword = async ({ errors }) => {
  if (errors) return

  if (!passwordForm.oldPassword) {
    Message.warning('请输入当前密码')
    return
  }
  if (!passwordForm.newPassword) {
    Message.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    Message.warning('新密码长度不能少于6位')
    return
  }
  if (passwordForm.newPassword === passwordForm.oldPassword) {
    Message.warning('新密码不能与当前密码相同')
    return
  }
  if (!passwordForm.captcha) {
    Message.warning('请输入验证码')
    return
  }

  passwordLoading.value = true
  try {
    const requestData = {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      captcha: passwordForm.captcha,
    }
    log.debug('修改密码请求参数:', requestData)
    const res = await changePassword(requestData)
    log.debug('修改密码响应:', res)
    if (res.code === 200) {
      Message.success('密码修改成功，请重新登录')
      userStore.clearUser()
      router.push('/auth?mode=login')
    } else {
      Message.error(res.msg || res.message || '密码修改失败')
    }
  } catch (error) {
    log.error('修改密码错误:', error)
    Message.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

const handleDeleteAccount = async ({ errors }) => {
  if (errors) return

  Modal.confirm({
    title: '确认注销账户',
    content: '账户注销后，您的所有个人数据将被永久删除，无法恢复。确定要继续吗？',
    okText: '确认注销',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger',
    },
    onOk: async () => {
      deleteAccountLoading.value = true
      try {
        const reason = deleteAccountForm.reason?.trim() || '用户主动申请注销'
        const res = await requestAccountDeletion(reason)
        if (res.code === 200) {
          Message.success('账户注销申请已提交，7天后将永久注销')
          deletionStatus.value = res.data
          // 登出
          userStore.clearUser()
          router.push('/auth?mode=login')
        } else {
          Message.error(res.message || '提交注销申请失败')
        }
      } catch (error) {
        log.error('注销账户错误:', error)
        Message.error('注销账户失败')
      } finally {
        deleteAccountLoading.value = false
      }
    },
  })
}

// 撤销账户注销
const handleCancelDeletion = async () => {
  Modal.confirm({
    title: '确认撤销注销',
    content: '确定要撤销账户注销申请吗？撤销后账户将恢复正常使用。',
    okText: '确认撤销',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await cancelAccountDeletion()
        if (res.code === 200) {
          Message.success('已撤销账户注销申请')
          deletionStatus.value = null
        } else {
          Message.error(res.message || '撤销失败')
        }
      } catch (error) {
        log.error('撤销注销错误:', error)
        Message.error('撤销注销失败')
      }
    },
  })
}

// 倒计时结束处理
const handleCountdownFinish = () => {
  Message.warning('账户注销时间已到，请重新登录')
  userStore.clearUser()
  router.push('/auth?mode=login')
}

// 获取账户注销状态
const fetchDeletionStatus = async () => {
  try {
    const res = await getAccountDeletionStatus()
    if (res.code === 200 && res.data) {
      deletionStatus.value = res.data
    }
  } catch (error) {
    log.error('获取注销状态失败:', error)
  }
}

// 格式化注销时间
const formatDeletionTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const handleBindGithub = async () => {
  githubBindLoading.value = true
  try {
    const res = await bindGithub()
    if (res.code === 200 && res.data.authUrl) {
      window.location.href = res.data.authUrl
    } else {
      Message.error(res.msg || res.message || '获取授权链接失败')
      githubBindLoading.value = false
    }
  } catch (error) {
    log.error('绑定 GitHub 错误:', error)
    Message.error('获取授权链接失败')
    githubBindLoading.value = false
  }
}

const handleUnbindGithub = () => {
  Modal.confirm({
    title: '确认解除绑定',
    content: '解除绑定后将无法使用 GitHub 快速登录，确定要继续吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await unbindGithub()
        if (res.code === 200) {
          Message.success('已解除绑定')
          bindingStatus.github = false
          bindingStatus.githubUsername = ''
        } else {
          Message.error(res.message || '操作失败')
        }
      } catch (error) {
        Message.error('操作失败')
      }
    },
  })
}

const handlePrivacyChange = async () => {
  privacyLoading.value = true
  try {
    const res = await updatePrivacy({
      showFollowing: privacySettings.showFollowing,
      showFollowers: privacySettings.showFollowers,
    })
    if (res.code === 200) {
      Message.success('设置已保存')
    } else {
      Message.error(res.msg || res.message || '保存失败')
    }
  } catch (error) {
    Message.error('保存失败')
  } finally {
    privacyLoading.value = false
  }
}

const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

const formatTime = formatTimeAgo

// 去除 Markdown 标记获取纯文本摘要
const stripMarkdownContent = (content, maxLength = 120) => {
  if (!content) return ''
  return stripMarkdown(content, maxLength)
}

// 获取封面图 URL
const getCoverImageUrl = (coverImage) => {
  if (!coverImage) return ''
  let imageUrl = coverImage.trim()
  if (imageUrl.startsWith('`') && imageUrl.endsWith('`')) {
    imageUrl = imageUrl.slice(1, -1).trim()
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return getImageURL(imageUrl)
}

// 从内容中提取第一张图片
const getFirstImage = (content) => {
  if (!content) return ''
  const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  if (match) {
    let url = match[2]
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return getImageURL(url)
    }
    return url
  }
  return ''
}

onBeforeUnmount(() => {
  if (avatarFile.value?.url?.startsWith('blob:')) {
    URL.revokeObjectURL(avatarFile.value.url)
  }
})

onMounted(() => {
  const initLoad = () => {
    fetchUserInfo()
    fetchDeletionStatus()
    if (activeMenu.value === 'favorites') {
      fetchFavoritePosts()
    }
    if (activeStatTab.value === 'posts') {
      fetchStatPosts()
    } else if (activeStatTab.value === 'following') {
      fetchFollowingList()
    } else if (activeStatTab.value === 'followers') {
      fetchFollowersList()
    }
  }
  if (!userStore.isLoggedIn) {
    // Token 在 httpOnly Cookie 中，JS 无法读取
    // 尝试通过后端接口验证会话
    userStore.validateSession().then(valid => {
      if (valid) {
        initLoad()
      } else {
        Message.warning('请先登录')
        router.push('/auth?mode=login')
      }
    })
  } else {
    initLoad()
  }
})
</script>

<style lang="scss" scoped>
  .profile-page {
    padding: 24px;
    background: var(--color-bg-1);
  }

  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 24px;
  }

  .profile-sidebar {
    width: 280px;
    flex-shrink: 0;
  }

  .user-card {
    background: var(--color-bg-2);
    border-radius: 12px;
    text-align: center;

    :deep(.arco-card-body) {
      padding: 24px;
    }
  }

  .user-avatar-section {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }

  .avatar-upload-wrapper {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .avatar-upload-error {
    :deep(.arco-avatar) {
      border: 2px solid rgb(var(--danger-6));
    }
  }

  .avatar-preview,
  .avatar-default {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .avatar-default {
    :deep(.arco-avatar) {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
  }

  .avatar-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 50%;

    svg {
      font-size: 24px;
      margin-bottom: 4px;
    }

    span {
      font-size: 12px;
    }
  }

  .avatar-upload-wrapper:hover .avatar-mask {
    opacity: 1;
  }

  .avatar-progress {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  .avatar {
    background: rgb(var(--primary-6));
    color: #fff;
    cursor: pointer;
  }

  .user-info {
    margin-bottom: 20px;
  }

  .username {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .gender-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;

      &.male {
        color: #1890ff;
      }

      &.female {
        color: #eb2f96;
      }
    }
  }

  .user-bio {
    font-size: 14px;
    color: var(--color-text-3);
    line-height: 1.5;
  }

  .user-stats {
    display: flex;
    justify-content: space-around;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    &:hover .stat-value {
      color: rgb(var(--primary-6));
    }
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    transition: color 0.2s;
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-3);
    margin-top: 4px;
  }

  .side-menu {
    margin-top: 16px;
    background: var(--color-bg-2);
    border-radius: 12px;
    border: 1px solid var(--color-border-2);

    :deep(.arco-menu-inner) {
      padding: 8px;
    }

    :deep(.arco-menu-item) {
      border-radius: 8px;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      &.arco-menu-selected {
        background: rgb(var(--primary-1));
      }
    }
  }

  .profile-main {
    flex: 1;
    min-width: 0;
  }

  .main-card {
    background: var(--color-bg-2);
    border-radius: 12px;

    :deep(.arco-card-header) {
      border-bottom: 1px solid var(--color-border-2);
      padding: 16px 24px;
    }

    :deep(.arco-card-body) {
      padding: 24px;
    }
  }

  .card-title-center {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
    text-align: center;
  }

  .profile-form {
    :deep(.arco-form-item) {
      width: 100%;
    }

    :deep(.arco-form-item-label) {
      color: var(--color-text-2);
      flex: none;
      width: 70px;
      text-align: right;
    }

    :deep(.arco-form-item-wrapper) {
      flex: 1;
    }

    :deep(.arco-input-wrapper),
    :deep(.arco-textarea-wrapper),
    :deep(.arco-input-number) {
      background: var(--color-fill-2);
      border-color: transparent;

      &:hover,
      &:focus-within {
        background: var(--color-bg-1);
        border-color: rgb(var(--primary-6));
      }
    }
  }

  .favorites-section {
    min-height: 400px;
  }

  .favorites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border-2);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    font-size: 22px;
    color: rgb(var(--warning-6));
  }

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .post-count {
    font-size: 14px;
    color: var(--color-text-3);
    background: var(--color-fill-2);
    padding: 4px 12px;
    border-radius: 12px;
  }

  .favorites-loading {
    width: 100%;
    min-height: 300px;
  }

  .favorites-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .favorite-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    align-items: flex-start;

    &:hover {
      background: var(--color-fill-2);
      border-color: rgb(var(--primary-6));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .card-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .card-category {
    flex-shrink: 0;
    font-size: 12px;
    color: rgb(var(--primary-6));
    background: rgb(var(--primary-1));
    padding: 2px 8px;
    border-radius: 4px;
  }

  .card-left {
    flex-shrink: 0;
    width: 120px;
    height: 90px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-fill-2);
  }

  .card-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-fill-2) 0%, var(--color-fill-3) 100%);

    .placeholder-icon {
      font-size: 32px;
      color: var(--color-text-4);
    }
  }

  .card-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .card-summary {
    font-size: 14px;
    color: var(--color-text-3);
    line-height: 1.6;
    margin: 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-4);
  }

  .meta-icon {
    font-size: 14px;
  }

  .unfavorite-btn {
    color: rgb(var(--warning-6));

    &:hover {
      background: rgb(var(--warning-1));
    }
  }

  .favorites-empty {
    padding: 60px 0;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-2);
  }

  .security-section {
    width: 100%;

    :deep(.arco-tabs-nav) {
      margin-bottom: 24px;
    }

    :deep(.arco-tabs-nav-tab) {
      width: 100%;
    }

    :deep(.arco-tabs-nav-tab-list) {
      width: 100%;
      display: flex;
    }

    :deep(.arco-tabs-tab) {
      flex: 1;
      text-align: center;
      justify-content: center;
    }

    :deep(.arco-form-item-label) {
      color: var(--color-text-2);
    }

    :deep(.arco-input-password) {
      background: var(--color-fill-2);
      border-color: transparent;

      &:hover,
      &:focus-within {
        background: var(--color-bg-1);
        border-color: rgb(var(--primary-6));
      }
    }

    .captcha-row {
      display: flex;
      gap: 12px;
      width: 100%;

      :deep(.arco-input-wrapper) {
        flex: 1;
      }
    }

    .security-tab-content {
      max-width: 520px;
      margin: 0 auto;
    }

    .delete-account-section {
      .delete-account-warning {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: rgb(var(--danger-1));
        border: 1px solid rgb(var(--danger-3));
        border-radius: 8px;
        margin-bottom: 24px;

        .warning-icon {
          flex-shrink: 0;
          color: rgb(var(--danger-6));
          font-size: 24px;
        }

        .warning-content {
          h4 {
            margin: 0 0 8px 0;
            color: rgb(var(--danger-6));
            font-size: 15px;
          }

          ul {
            margin: 0;
            padding-left: 16px;
            color: var(--color-text-2);
            font-size: 13px;
            line-height: 1.8;
          }
        }
      }
    }

    .deletion-pending-section {
      text-align: center;
      padding: 8px 0;

      .deletion-warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 20px;
        background: linear-gradient(135deg, rgb(var(--warning-1)) 0%, var(--color-fill-1) 100%);
        border: 1px solid rgb(var(--warning-3));
        border-radius: 10px;
        margin-bottom: 32px;
        text-align: left;

        .warning-icon {
          flex-shrink: 0;
          font-size: 24px;
          color: rgb(var(--warning-6));
          margin-top: 2px;
        }

        .warning-text {
          flex: 1;

          .warning-title {
            font-size: 15px;
            font-weight: 600;
            color: rgb(var(--warning-7));
            margin-bottom: 4px;
          }

          .warning-desc {
            font-size: 13px;
            color: var(--color-text-2);
            line-height: 1.6;

            .highlight-time {
              font-weight: 600;
              color: rgb(var(--danger-6));
            }
          }
        }
      }

      .countdown-container {
        margin-bottom: 24px;

        :deep(.arco-countdown) {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .countdown-label {
          font-size: 13px;
          color: var(--color-text-3);
          margin-top: 8px;
        }
      }

      .deletion-tips {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 16px;
        background: var(--color-fill-1);
        border-radius: 8px;
        margin-bottom: 24px;
        font-size: 13px;
        color: var(--color-text-3);
      }

      .cancel-btn {
        min-width: 180px;
      }
    }
  }

  .privacy-section {
    width: 100%;
  }

  .privacy-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px;
    border-radius: 8px;
    background: var(--color-fill-2);
    margin-bottom: 16px;
    transition: background-color 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: var(--color-fill-3);
    }
  }

  .privacy-item-info {
    flex: 1;
    min-width: 0;
  }

  .privacy-item-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-1);
    margin-bottom: 4px;
  }

  .privacy-item-desc {
    font-size: 13px;
    color: var(--color-text-3);
  }

  .binding-section {
    max-width: 500px;
  }

  .binding-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-radius: 8px;
    background: var(--color-fill-2);
    transition: background-color 0.2s;

    &:hover {
      background: var(--color-fill-3);
    }
  }

  .binding-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .binding-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .github-icon {
    background: #24292e;
    color: #fff;
  }

  .binding-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .binding-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-1);
  }

  .binding-desc {
    font-size: 13px;
    color: var(--color-text-3);
  }

  .binding-action {
    flex-shrink: 0;
  }

  .stat-item.active {
    .stat-value {
      color: rgb(var(--primary-6));
    }

    .stat-label {
      color: rgb(var(--primary-6));
    }
  }

  .stat-posts-section {
    min-height: 400px;
  }

  .stat-users-section {
    min-height: 400px;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover {
      background: var(--color-fill-2);
      border-color: rgb(var(--primary-6));
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .user-list-avatar {
    flex-shrink: 0;
    background: rgb(var(--primary-6));
    color: #fff;
  }

  .user-list-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-list-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-1);
    display: flex;
    align-items: center;
    gap: 4px;

    .gender-icon {
      flex-shrink: 0;
      font-size: 16px;

      &.male {
        color: #1890ff;
      }

      &.female {
        color: #eb2f96;
      }
    }
  }

  .user-list-bio {
    font-size: 13px;
    color: var(--color-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .profile-container {
      flex-direction: column;
    }

    .profile-sidebar {
      width: 100%;
    }

    .user-stats {
      flex-wrap: wrap;
      gap: 16px;
    }

    .stat-item {
      flex: 1;
      min-width: 80px;
    }

    .favorite-card {
      flex-direction: column;
      padding: 10px;

      .card-cover {
        width: 100%;
        height: 140px;
        border-radius: 8px;
      }
    }

    .card-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .card-title {
      font-size: 14px;
      white-space: normal;
      -webkit-line-clamp: 2;
    }

    .card-summary {
      font-size: 12px;
      -webkit-line-clamp: 2;
    }

    .card-meta {
      font-size: 11px;
    }

    .unfavorite-btn {
      align-self: flex-end;
    }

    .user-list-item {
      flex-wrap: wrap;
    }

    .user-list-info {
      flex: 1;
      min-width: calc(100% - 60px);
    }

    .profile-form {
      :deep(.arco-form-item) {
        flex-direction: column;
        align-items: flex-start;
      }

      :deep(.arco-form-item-label) {
        text-align: left;
        margin-bottom: 4px;
      }

      :deep(.arco-col-12) {
        flex: 0 0 100%;
        max-width: 100%;
      }

      :deep(.arco-radio-group) {
        display: flex;
        flex-direction: row;
        gap: 16px;
      }
    }
  }
</style>
