import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { vitePluginForArco } from '@arco-plugins/vite-vue'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const serverTarget = env.VITE_SERVER_URL || 'http://localhost:8085'

  return {
    plugins: [
      VueRouter({
        routesFolder: [
          {
            src: 'src/pages',
            path: '',
          },
        ],
        extendRoute(route) {
          const titleMap = {
            '/': '首页',
            '/profile': '个人中心',
            '//post/[id]': '帖子详情',
            '/login/': '登录',
            '/register/': '注册',
            '/forgot-password/': '找回密码',
            '/callback/': 'GitHub授权',
            '//user/[id]': '用户主页',
          }
          const title = titleMap[route.name] || titleMap[route.path]
          if (title) {
            route.meta = { ...route.meta, title }
          }
          return route
        },
      }),
      vue(),
      vitePluginForArco({ style: 'css' }),
      AutoImport({
        imports: ['vue', VueRouterAutoImports, 'pinia', '@vueuse/core'],
        resolvers: [ArcoResolver()],
      }),
      Components({
        resolvers: [
          ArcoResolver({
            sideEffect: true,
          }),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 8080,
      proxy: {
        '/api': {
          target: serverTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/avatars': {
          target: serverTarget,
          changeOrigin: true,
        },
        '/post-images': {
          target: serverTarget,
          changeOrigin: true,
        },
        '/notifications': {
          target: serverTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: serverTarget.replace(/^http/, 'ws'),
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})
