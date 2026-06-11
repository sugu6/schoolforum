<template>
  <div class="form-panel">
    <h2 class="form-title">欢迎回来</h2>

    <a-form :model="form" @submit="handleSubmit" class="auth-form" layout="vertical">
      <a-form-item field="account" hide-label :rules="accountRules">
        <a-input v-model="form.account" placeholder="学号 / 邮箱 / 手机号" size="large" allow-clear>
          <template #prefix>
            <icon-user />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item field="password" hide-label :rules="passwordRules">
        <a-input-password v-model="form.password" placeholder="密码" size="large" allow-clear>
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <div class="form-options">
        <a-checkbox v-model="form.remember">记住我</a-checkbox>
        <a-link type="primary" @click="$emit('go-forgot')">忘记密码</a-link>
      </div>

      <a-button type="primary" html-type="submit" size="large" long :loading="loading">
        登 录
      </a-button>
    </a-form>

    <div class="social-login">
      <span class="social-text">其他登录方式</span>
      <div class="social-icons">
        <a-tooltip content="GitHub 登录">
          <span class="social-icon" @click="handleGithubLogin">
            <icon-github :size="18" />
          </span>
        </a-tooltip>
      </div>
    </div>

    <div class="form-footer">
      <a-link class="footer-sub" @click="$emit('go-home')">返回首页</a-link>
      <span class="footer-hint"
        >还没有账号？<a-link type="primary" @click="$emit('go-register')">立即注册</a-link></span
      >
    </div>
  </div>
</template>

<script setup>
import { login } from '@/apis/users.js'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'
import { getAPIBaseURL } from '@/config/server'

const emit = defineEmits(['go-register', 'go-forgot', 'go-home', 'login-success'])

const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  account: '',
  password: '',
  remember: true,
})

const accountRules = [
  { required: true, message: '请输入账号' },
  {
    validator: (value, callback) => {
      if (!value) {
        callback()
        return
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const phoneRegex = /^1[3-9]\d{9}$/
      const studentIdRegex = /^\d{6,20}$/
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{1,19}$/
      if (
        emailRegex.test(value) ||
        phoneRegex.test(value) ||
        studentIdRegex.test(value) ||
        usernameRegex.test(value)
      ) {
        callback()
      } else {
        callback('请输入正确的用户名、学号、邮箱或手机号')
      }
    },
  },
]

const passwordRules = [
  { required: true, message: '请输入密码' },
  { minLength: 6, message: '密码长度不能少于6位' },
]

const handleSubmit = async ({ errors }) => {
  if (errors) return
  loading.value = true
  try {
    const res = await login({
      username: form.account,
      password: form.password,
    })
    if (res.code !== 200) {
      Message.error(res.msg || '登录失败')
      return
    }

    // Token 通过 httpOnly Cookie 自动设置，无需手动存储
    // 只保存 userInfo 和 expiresIn
    if (res.data.user) {
      userStore.setUserInfo(res.data.user)
    }

    if (res.data.expiresIn) {
      userStore.setTokenExpiresAt(res.data.expiresIn)
    }

    // 启动 token 过期定时器
    import('@/apis/request').then(({ setupExpiryTimer }) => {
      setupExpiryTimer()
    })

    Message.success('登录成功')
    emit('login-success')
  } catch (error) {
    Message.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleGithubLogin = () => {
  const baseURL = getAPIBaseURL()
  window.location.href = `${baseURL}/oauth/render/github`
}
</script>

<style lang="scss" scoped>
.form-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 32px;
  text-align: center;

  @media (max-width: 576px) {
    font-size: 20px;
    margin-bottom: 24px;
  }
}

.auth-form {
  :deep(.arco-form-item) {
    margin-bottom: 16px;
  }

  :deep(.arco-form-item:last-of-type) {
    margin-bottom: 0;
  }

  :deep(.arco-input-wrapper),
  :deep(.arco-input-password) {
    background: var(--color-fill-2);
    border-color: transparent;

    &:hover,
    &:focus-within {
      background: var(--color-bg-1);
      border-color: rgb(var(--primary-6));
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
}

.social-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.social-text {
  color: var(--color-text-3);
  font-size: 12px;
}

.social-icons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-fill-2);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-2);

  &:hover {
    background: var(--color-fill-3);
    color: var(--color-text-1);
  }
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  font-size: 13px;
  color: var(--color-text-3);
}

.footer-hint {
  color: var(--color-text-3);
}

.footer-sub {
  color: var(--color-text-3);
  font-size: 13px;
}
</style>
