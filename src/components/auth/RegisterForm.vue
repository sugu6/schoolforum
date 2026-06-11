<template>
  <div class="form-panel">
    <h2 class="form-title">创建账号</h2>

    <a-form :model="form" @submit="handleSubmit" class="auth-form" layout="vertical">
      <a-form-item field="username" hide-label :rules="usernameRules">
        <a-input v-model="form.username" placeholder="用户名" size="large" allow-clear>
          <template #prefix>
            <icon-user />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item field="email" hide-label :rules="emailRules">
        <a-input v-model="form.email" placeholder="邮箱" size="large" allow-clear>
          <template #prefix>
            <icon-email />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item field="captcha" hide-label :rules="captchaRules">
        <a-input-search
          v-model="form.captcha"
          placeholder="验证码"
          size="large"
          allow-clear
          :button-text="countdown > 0 ? `${countdown}s` : '发送验证码'"
          :loading="captchaLoading"
          :button-props="{ disabled: countdown > 0 }"
          search-button
          @search="handleSendCaptcha"
        />
      </a-form-item>

      <a-form-item field="password" hide-label :rules="passwordRules">
        <a-input-password v-model="form.password" placeholder="密码" size="large" allow-clear>
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item field="confirmPassword" hide-label :rules="confirmPasswordRules">
        <a-input-password
          v-model="form.confirmPassword"
          placeholder="确认密码"
          size="large"
          allow-clear
        >
          <template #prefix>
            <icon-safe />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item hide-label>
        <a-checkbox v-model="form.agreement">
          我已阅读并同意
          <a-link type="primary">用户协议</a-link>
          和
          <a-link type="primary">隐私政策</a-link>
        </a-checkbox>
      </a-form-item>

      <a-button
        type="primary"
        html-type="submit"
        size="large"
        long
        :loading="loading"
        :disabled="!form.agreement"
      >
        注 册
      </a-button>
    </a-form>

    <div class="form-footer">
      <a-link class="footer-sub" @click="$emit('go-home')">返回首页</a-link>
      <span class="footer-hint"
        >已有账号？<a-link type="primary" @click="$emit('go-login')">立即登录</a-link></span
      >
    </div>
  </div>
</template>

<script setup>
import { register, getCaptcha } from '@/apis/users.js'
import { Message } from '@arco-design/web-vue'

const emit = defineEmits(['go-login', 'go-home', 'register-success'])

const loading = ref(false)
const captchaLoading = ref(false)
const countdown = ref(0)

const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(
  () => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      pauseCountdown()
    }
  },
  1000,
  { immediate: false },
)

const form = reactive({
  username: '',
  email: '',
  captcha: '',
  password: '',
  confirmPassword: '',
  agreement: false,
})

const usernameRules = [
  { required: true, message: '请输入用户名' },
  { minLength: 2, message: '用户名长度不能少于2位' },
  { maxLength: 20, message: '用户名长度不能超过20位' },
  {
    validator: (value, callback) => {
      if (!value) {
        callback()
        return
      }
      const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
      if (usernameRegex.test(value)) {
        callback()
      } else {
        callback('用户名只能包含中文、字母、数字和下划线')
      }
    },
  },
]

const emailRules = [
  { required: true, message: '请输入邮箱' },
  { type: 'email', message: '请输入正确的邮箱格式' },
]

const captchaRules = [
  { required: true, message: '请输入验证码' },
  { len: 6, message: '验证码为6位数字' },
  {
    validator: (value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (/^\d{6}$/.test(value)) {
        callback()
      } else {
        callback('验证码必须为6位数字')
      }
    },
  },
]

const passwordRules = [
  { required: true, message: '请输入密码' },
  { minLength: 6, message: '密码长度不能少于6位' },
  { maxLength: 20, message: '密码长度不能超过20位' },
]

const confirmPasswordRules = [
  { required: true, message: '请确认密码' },
  {
    validator: (value, callback) => {
      if (value !== form.password) {
        callback('两次输入的密码不一致')
      } else {
        callback()
      }
    },
  },
]

const handleSendCaptcha = async () => {
  if (!form.email) {
    Message.warning('请先输入邮箱')
    return
  }
  captchaLoading.value = true
  try {
    const res = await getCaptcha(form.email)
    if (res.code !== 200) {
      Message.error(res.msg || '发送验证码失败')
      return
    }
    Message.success('验证码已发送')
    countdown.value = 60
    resumeCountdown()
  } catch (error) {
    Message.error('发送验证码失败')
  } finally {
    captchaLoading.value = false
  }
}

const handleSubmit = async ({ errors }) => {
  if (errors) return
  if (!form.agreement) {
    Message.warning('请先同意用户协议和隐私政策')
    return
  }
  loading.value = true
  try {
    const res = await register({
      username: form.username,
      email: form.email,
      captcha: form.captcha,
      password: form.password,
    })
    if (res.code !== 200) {
      Message.error(res.msg || '注册失败')
      return
    }
    Message.success('注册成功')
    emit('register-success')
  } catch (error) {
    Message.error(error.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.form-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
  margin-top: -30px;
  text-align: center;

  @media (max-width: 576px) {
    font-size: 20px;
    margin-top: -20px;
  }
}

.auth-form {
  :deep(.arco-form-item) {
    margin-bottom: 12px;
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
