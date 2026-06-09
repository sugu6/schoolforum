import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useRouteStore } from '@/stores/route'

routes.push(
  { path: '/login', redirect: { path: '/auth', query: { mode: 'login' } } },
  { path: '/register', redirect: { path: '/auth', query: { mode: 'register' } } },
  { path: '/forgot-password', redirect: { path: '/auth', query: { mode: 'forgot' } } },
)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 校园论坛` : '校园论坛'

  const token = localStorage.getItem('token') || sessionStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next({ path: '/auth', query: { mode: 'login', redirect: to.fullPath } })
  } else if (token) {
    // 基本 JWT 过期检查
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4) base64 += '='
        const payload = JSON.parse(atob(base64))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token 已过期，清除并跳转登录
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('userInfo')
          if (to.meta.requiresAuth) {
            next({ path: '/auth', query: { mode: 'login', redirect: to.fullPath } })
            return
          }
        }
      }
    } catch {
      // Token 格式无效，忽略（非 JWT 格式等）
    }
    next()
  } else {
    next()
  }
})

router.afterEach((to) => {
  const routeStore = useRouteStore()
  routeStore.setLastRoute(to.fullPath)
})

export default router
