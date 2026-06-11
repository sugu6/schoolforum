import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'

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

  // 通过 store 判断登录状态（token 在 httpOnly Cookie 中，JS 不可读）
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/auth', query: { mode: 'login', redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach((to) => {
  const routeStore = useRouteStore()
  routeStore.setLastRoute(to.fullPath)
})

export default router
