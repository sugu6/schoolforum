<template>
  <div class="callback-page">
    <div class="callback-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-icon">
          <icon-github :size="48" />
        </div>
        <h2 class="loading-title">正在处理 GitHub 授权</h2>
        <p class="loading-desc">请稍候...</p>
      </div>

      <div v-else-if="errorMessage" class="error-state">
        <div class="error-icon">
          <icon-close-circle :size="48" />
        </div>
        <h2 class="error-title">授权失败</h2>
        <p class="error-desc">{{ errorMessage }}</p>
        <a-button type="primary" @click="handleRetry"> 重新登录 </a-button>
      </div>

      <div v-else-if="needConfirmUsername" class="confirm-state">
        <div class="confirm-header">
          <icon-github :size="40" />
          <h2>设置用户名</h2>
          <p>首次使用 GitHub 登录，请设置您的用户名</p>
        </div>

        <a-form
          :model="usernameForm"
          layout="vertical"
          @submit="handleConfirmUsername"
          class="confirm-form"
        >
          <a-form-item
            label="用户名"
            field="username"
            :rules="[
              { required: true, message: '请输入用户名' },
              { minLength: 2, message: '用户名至少2个字符' },
              { maxLength: 20, message: '用户名最多20个字符' },
            ]"
          >
            <a-input
              v-model="usernameForm.username"
              placeholder="请输入用户名"
              allow-clear
              size="large"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="confirmLoading" long size="large">
              确认并登录
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import { useRouteQuery } from '@vueuse/router'
import { githubCallback, confirmUsername } from '@/apis/users'
import { useUserStore } from '@/stores/user'

definePage({
  meta: {
    title: 'GitHub 授权',
  },
})

const router = useRouter()
const userStore = useUserStore()

const code = useRouteQuery('code')
const state = useRouteQuery('state')
const error = useRouteQuery('error')
const errorDescription = useRouteQuery('error_description')

const loading = ref(true)
const errorMessage = ref('')
const needConfirmUsername = ref(false)
const tempKey = ref('')

const usernameForm = reactive({
  username: '',
})
const confirmLoading = ref(false)

const handleAuthSuccess = (data) => {
  const isLogin = !userStore.isLoggedIn
  Message.success(isLogin ? 'GitHub 登录成功' : 'GitHub 绑定成功')
  if (data.token) {
    userStore.setToken(data.token)
  }
  if (data.user) {
    userStore.setUserInfo(data.user)
  } else {
    userStore.fetchUserInfo()
  }
  router.replace(isLogin ? '/' : '/profile')
}

const handleCallback = async () => {
  if (error.value) {
    errorMessage.value = errorDescription.value || 'GitHub 授权失败'
    loading.value = false
    return
  }

  if (!code.value) {
    errorMessage.value = '缺少授权码'
    loading.value = false
    return
  }

  try {
    const res = await githubCallback(code.value, state.value)

    if (res.code === 200) {
      if (res.data.status === 'conflict') {
        needConfirmUsername.value = true
        tempKey.value = res.data.tempKey
        usernameForm.username = res.data.suggestedUsername || ''
        loading.value = false
      } else {
        handleAuthSuccess(res.data)
      }
    } else {
      errorMessage.value = res.msg || res.message || '操作失败'
      loading.value = false
    }
  } catch (err) {
    errorMessage.value = '操作失败，请重试'
    loading.value = false
  }
}

const handleConfirmUsername = async () => {
  if (!usernameForm.username || usernameForm.username.length < 2) {
    Message.warning('用户名至少2个字符')
    return
  }
  if (usernameForm.username.length > 20) {
    Message.warning('用户名最多20个字符')
    return
  }

  confirmLoading.value = true
  try {
    const res = await confirmUsername({
      tempKey: tempKey.value,
      username: usernameForm.username,
    })

    if (res.code === 200) {
      handleAuthSuccess(res.data)
    } else {
      Message.error(res.msg || res.message || '操作失败')
    }
  } catch (err) {
    Message.error('操作失败，请重试')
  } finally {
    confirmLoading.value = false
  }
}

const handleRetry = () => {
  router.replace('/login')
}

onMounted(() => {
  handleCallback()
})
</script>

<style lang="scss" scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  padding: 20px;
}

.callback-container {
  width: 100%;
  max-width: 400px;
}

.loading-state,
.error-state,
.confirm-state {
  background: var(--color-bg-2);
  border-radius: 12px;
  padding: 40px 32px;
  text-align: center;
}

.loading-icon,
.error-icon {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  color: var(--color-text-2);
  animation: pulse 1.5s ease-in-out infinite;
}

.error-icon {
  color: rgb(var(--danger-6));
}

.loading-title,
.error-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.loading-desc,
.error-desc {
  font-size: 14px;
  color: var(--color-text-3);
  margin-bottom: 0;
}

.error-desc {
  margin-bottom: 24px;
}

.confirm-header {
  margin-bottom: 28px;

  :first-child {
    color: var(--color-text-1);
    margin-bottom: 16px;
  }

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-1);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--color-text-3);
    margin-bottom: 0;
  }
}

.confirm-form {
  text-align: left;

  :deep(.arco-form-item) {
    margin-bottom: 20px;
  }

  :deep(.arco-form-item:last-child) {
    margin-bottom: 0;
  }

  :deep(.arco-input-wrapper) {
    background: var(--color-fill-2);
    border-color: transparent;

    &:hover,
    &:focus-within {
      background: var(--color-bg-1);
      border-color: rgb(var(--primary-6));
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
