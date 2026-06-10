<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-left">
        <div class="brand">
          <div class="logo">
            <SiteLogo :size="48" />
          </div>
          <h1 class="brand-name">海语</h1>
          <Transition name="slogan-fade" mode="out-in">
            <p class="slogan" :key="currentMode">{{ currentSlogan }}</p>
          </Transition>
        </div>
      </div>

      <div class="auth-right">
        <a-alert
          v-if="expiredMessage"
          :closable="true"
          type="warning"
          style="margin-bottom: 16px"
          @close="expiredMessage = ''"
        >
          {{ expiredMessage }}
        </a-alert>
        <Transition :name="transitionName" mode="out-in">
          <LoginForm
            v-if="currentMode === 'login'"
            key="login"
            @go-register="switchMode('register')"
            @go-forgot="switchMode('forgot')"
            @go-home="goHome"
            @login-success="handleLoginSuccess"
          />
          <RegisterForm
            v-else-if="currentMode === 'register'"
            key="register"
            @go-login="switchMode('login')"
            @go-home="goHome"
            @register-success="handleRegisterSuccess"
          />
          <ForgotForm
            v-else-if="currentMode === 'forgot'"
            key="forgot"
            @go-login="switchMode('login')"
            @go-home="goHome"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import SiteLogo from '@/components/SiteLogo.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import ForgotForm from '@/components/auth/ForgotForm.vue'

definePage({
  meta: {
    title: '登录',
  },
})

const router = useRouter()
const route = useRoute()

const modeOrder = { login: 0, register: 1, forgot: 2 }
const modeFromQuery = () => {
  const m = route.query.mode
  return ['login', 'register', 'forgot'].includes(m) ? m : 'login'
}

const currentMode = ref(modeFromQuery())
const transitionName = ref('slide-left')
const expiredMessage = ref('')

const reasonMessages = {
  expired: '登录已过期，请重新登录',
  INVALID_TOKEN: '登录凭证无效，请重新登录',
  TOKEN_TIMEOUT: '登录已过期，请重新登录',
  BE_REPLACED: '账号已在其他设备登录',
  KICK_OUT: '账号已被踢下线',
  TOKEN_FREEZE: '账号已被冻结',
}

if (route.query.reason) {
  expiredMessage.value = reasonMessages[route.query.reason] || '请先登录'
}

const slogans = {
  login: '连接校园，分享精彩',
  register: '加入我们，开启旅程',
  forgot: '别担心，我们帮你找回',
}

const currentSlogan = computed(() => slogans[currentMode.value])

const modeTitles = { login: '登录', register: '注册', forgot: '找回密码' }

watch(currentMode, (mode) => {
  document.title = `${modeTitles[mode]} - 海语`
  router.replace({ query: { ...route.query, mode } })
})

const switchMode = (newMode) => {
  const oldIndex = modeOrder[currentMode.value]
  const newIndex = modeOrder[newMode]
  transitionName.value = newIndex > oldIndex ? 'slide-left' : 'slide-right'
  currentMode.value = newMode
}

const goHome = () => router.push('/')

const handleLoginSuccess = () => {
  const redirect = route.query.redirect || '/'
  // 防止开放重定向：只允许相对路径
  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    router.push(redirect)
  } else {
    router.push('/')
  }
}

const handleRegisterSuccess = () => {
  switchMode('login')
}
</script>

<style lang="scss" scoped>
.auth-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  padding: 20px;
  box-sizing: border-box;
}

.auth-container {
  display: flex;
  width: 100%;
  max-width: 800px;
  min-height: 480px;
  max-height: calc(100vh - 40px);
  background: var(--color-bg-2);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.auth-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  border-right: 1px solid var(--color-border-2);
}

.brand {
  text-align: center;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-name {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
}

.slogan {
  font-size: 14px;
  color: var(--color-text-3);
}

.auth-right {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 32px;
  text-align: center;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.slogan-fade-enter-active,
.slogan-fade-leave-active {
  transition: all 0.3s ease;
}

.slogan-fade-enter-from,
.slogan-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
    max-width: 400px;
  }

  .auth-left {
    padding: 40px 30px 20px;
    border-right: none;
    border-bottom: 1px solid var(--color-border-2);
  }

  .logo {
    width: 60px;
    height: 60px;
  }

  .brand-name {
    font-size: 24px;
  }

  .auth-right {
    padding: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slogan-fade-enter-active,
  .slogan-fade-leave-active {
    transition: none;
  }
}
</style>
