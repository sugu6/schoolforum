<template>
  <div class="form-panel">
    <div class="form-header">
      <h2 class="form-title">{{ stepTitle }}</h2>
      <p class="form-subtitle">{{ stepSubtitle }}</p>
    </div>

    <a-steps :current="currentStep" class="steps" type="dot">
      <a-step title="验证邮箱" />
      <a-step title="输入验证码" />
      <a-step title="重置密码" />
    </a-steps>

    <a-form
      v-if="currentStep === 0"
      :model="form"
      @submit="handleSendCode"
      class="auth-form"
      layout="vertical"
    >
      <a-form-item field="email" hide-label :rules="emailRules">
        <a-input v-model="form.email" placeholder="请输入邮箱" size="large" allow-clear>
          <template #prefix>
            <icon-email />
          </template>
        </a-input>
      </a-form-item>

      <a-button type="primary" html-type="submit" size="large" long :loading="loading">
        发送验证码
      </a-button>
    </a-form>

    <a-form
      v-if="currentStep === 1"
      :model="form"
      @submit="handleVerifyCode"
      class="auth-form"
      layout="vertical"
    >
      <a-form-item field="code" hide-label :rules="codeRules">
        <a-input
          v-model="form.code"
          placeholder="请输入6位验证码"
          size="large"
          allow-clear
          maxlength="6"
        >
          <template #prefix>
            <icon-safe />
          </template>
        </a-input>
      </a-form-item>

      <div class="resend-tip" style="margin-bottom: 6px">
        <span class="text-gray">未收到验证码？</span>
        <a-link type="primary" :disabled="countdown > 0" @click="handleResend">
          {{ countdown > 0 ? `${countdown}s后重新发送` : '重新发送' }}
        </a-link>
      </div>

      <a-button type="primary" html-type="submit" size="large" long :loading="loading">
        下一步
      </a-button>
    </a-form>

    <a-form
      v-if="currentStep === 2"
      :model="form"
      @submit="handleResetPassword"
      class="auth-form"
      layout="vertical"
    >
      <a-form-item field="newPassword" hide-label :rules="passwordRules">
        <a-input-password
          v-model="form.newPassword"
          placeholder="请输入新密码"
          size="large"
          allow-clear
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item field="confirmPassword" hide-label :rules="confirmPasswordRules">
        <a-input-password
          v-model="form.confirmPassword"
          placeholder="请确认新密码"
          size="large"
          allow-clear
        >
          <template #prefix>
            <icon-safe />
          </template>
        </a-input-password>
      </a-form-item>

      <a-button type="primary" html-type="submit" size="large" long :loading="loading">
        确认重置
      </a-button>
    </a-form>

    <div class="form-footer">
      <a-link class="footer-sub" @click="$emit('go-home')">返回首页</a-link>
      <a-link class="footer-back" @click="handleBack">返回登录</a-link>
    </div>
  </div>
</template>

<script setup>
import { Message } from '@arco-design/web-vue'
import { getCaptcha, resetPassword, verifyCaptcha } from '@/apis/users'

const emit = defineEmits(['go-login', 'go-home'])

const loading = ref(false)
const currentStep = ref(0)
const countdown = ref(0)

const { pause, resume } = useIntervalFn(
  () => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      pause()
    }
  },
  1000,
  { immediate: false },
)

const startCountdown = () => {
  countdown.value = 60
  resume()
}

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const stepTitle = computed(() => {
  const titles = ['找回密码', '输入验证码', '重置密码']
  return titles[currentStep.value]
})

const stepSubtitle = computed(() => {
  const subtitles = [
    '请输入您的邮箱，我们将发送验证码',
    `验证码已发送至 ${form.email}`,
    '请设置您的新密码',
  ]
  return subtitles[currentStep.value]
})

const emailRules = [
  { required: true, message: '请输入邮箱' },
  { type: 'email', message: '请输入正确的邮箱格式' },
]

const codeRules = [
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
  { required: true, message: '请输入新密码' },
  { minLength: 6, message: '密码长度不能少于6位' },
  { maxLength: 20, message: '密码长度不能超过20位' },
]

const confirmPasswordRules = [
  { required: true, message: '请确认新密码' },
  {
    validator: (value, callback) => {
      if (value !== form.newPassword) {
        callback('两次输入的密码不一致')
      } else {
        callback()
      }
    },
  },
]

const handleSendCode = async ({ errors }) => {
  if (errors) return
  loading.value = true
  try {
    const res = await getCaptcha(form.email, 'resetPassword')
    if (res.code === 200) {
      Message.success('验证码已发送')
      currentStep.value = 1
      startCountdown()
    } else {
      Message.error(res.msg || res.message || '发送验证码失败')
    }
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  loading.value = true
  try {
    const res = await getCaptcha(form.email, 'resetPassword')
    if (res.code === 200) {
      Message.success('验证码已重新发送')
      startCountdown()
    } else {
      Message.error(res.msg || res.message || '发送验证码失败')
    }
  } finally {
    loading.value = false
  }
}

const handleVerifyCode = async ({ errors }) => {
  if (errors) return
  loading.value = true
  try {
    const res = await verifyCaptcha({ email: form.email, code: form.code, type: 'resetPassword' })
    if (res.code === 200) {
      Message.success('验证成功')
      currentStep.value = 2
    } else {
      Message.error(res.msg || res.message || '验证码错误')
    }
  } catch (error) {
    Message.error('验证码验证失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async ({ errors }) => {
  if (errors) return
  loading.value = true
  try {
    const res = await resetPassword({
      email: form.email,
      captcha: form.code,
      newPassword: form.newPassword,
    })
    if (res.code === 200) {
      Message.success('密码重置成功')
      setTimeout(() => {
        emit('go-login')
      }, 1500)
    } else {
      Message.error(res.msg || res.message || '密码重置失败')
    }
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    emit('go-login')
  }
}

onUnmounted(() => {
  pause()
})
</script>

<style lang="scss" scoped>
.form-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.form-subtitle {
  font-size: 14px;
  color: var(--color-text-3);
}

.steps {
  margin: 0 0 16px -60px;
  width: 240px;

  :deep(.arco-steps) {
    justify-content: flex-start;
    gap: 0;
  }

  :deep(.arco-steps-item) {
    flex: 0 0 auto;
    margin-right: 0;
  }

  :deep(.arco-steps-item-title) {
    font-size: 10px;
    white-space: nowrap;
  }

  :deep(.arco-steps-dot) {
    width: 5px;
    height: 5px;
  }

  :deep(.arco-steps-item-active .arco-steps-dot) {
    width: 7px;
    height: 7px;
  }

  :deep(.arco-steps-item-tail) {
    width: 30px;
    min-width: 30px;
    margin: 0 6px 0 -4px;
  }
}

.auth-form {
  :deep(.arco-form-item) {
    margin-bottom: 16px;
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

.resend-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.text-gray {
  color: var(--color-text-3);
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  font-size: 13px;
}

.footer-back {
  color: rgb(var(--primary-6));
  font-size: 13px;
}

.footer-sub {
  color: var(--color-text-3);
  font-size: 13px;
}

:deep(.arco-link) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .steps {
    :deep(.arco-steps-item-title) {
      font-size: 11px;
    }
  }
}
</style>
