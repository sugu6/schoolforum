# 海语 (Haiyu)

<p align="center">
  <img src="public/logo.svg" alt="海语 Logo" width="120">
</p>

<p align="center">
  <strong>海纳百言，语通校园</strong>
</p>

<p align="center">
  <a href="#-项目简介">项目简介</a> •
  <a href="#-功能特性">功能特性</a> •
  <a href="#-技术栈">技术栈</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-项目结构">项目结构</a>
</p>

---

## 🔗 项目地址

| 项目 | 地址 |
|------|------|
| 在线站点 | https://schoolforum.sugu6.top |
| 管理后台 | https://schoolforum.sugu6.top/admin/ |
| GitHub | https://github.com/sugu6/schoolforum |
| Gitee | https://gitee.com/y3342113181/schoolforum |

---

## 🌊 项目简介

**海语**是一个现代化的校园论坛社区平台，专为学生打造的开放、自由的交流空间。

我们致力于创造一个如海洋般广阔的交流平台，让每一位学生的声音都能被听见，让思想的浪花在这里自由碰撞。

### 品牌理念

- 🌊 **开放包容** - 像海洋一样接纳多元观点
- 💬 **自由表达** - 鼓励真诚交流与思想碰撞
- 🎓 **青春活力** - 蓝白配色传递年轻气息
- 📚 **专业深度** - 学术氛围与知识分享

---

## ✨ 功能特性

### 核心功能

| 功能模块 | 描述 |
|---------|------|
| 📝 **帖子发布** | 支持富文本编辑器，可插入图片、代码块、表格等 |
| 💬 **评论互动** | 多层评论回复，支持表情、点赞 |
| 🔍 **内容搜索** | 全文检索，支持标签、分类筛选 |
| 🏷️ **标签分类** | 灵活的标签系统，便于内容组织 |
| 👤 **个人主页** | 用户资料展示、发帖历史、关注列表 |
| 🔔 **消息通知** | 实时通知系统，不错过任何互动 |
| 💌 **私信聊天** | 用户间即时通讯 |
| ⭐ **收藏关注** | 收藏喜欢的内容，关注感兴趣的用户 |
| 📜 **浏览历史** | 记录阅读足迹，方便回顾 |
| 📅 **每日签到** | 签到积分系统，增加用户粘性 |

### 用户体验

- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **响应式设计** - 完美适配各种设备
- ⚡ **实时更新** - WebSocket 实时消息推送
- 🎨 **流畅动画** - 精心设计的过渡效果

---

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue.js](https://vuejs.org/) | ^3.5.27 | 渐进式 JavaScript 框架 |
| [Vue Router](https://router.vuejs.org/) | ^5.0.2 | 官方路由管理 |
| [Pinia](https://pinia.vuejs.org/) | ^3.0.4 | 状态管理 + 持久化 |
| [Vite](https://vitejs.dev/) | ^7.3.1 | 下一代前端构建工具 |
| [Arco Design Vue](https://arco.design/vue) | ^2.57.0 | UI 组件库 |
| [Sass](https://sass-lang.com/) | ^1.97.3 | CSS 预处理器 |

### 编辑器与工具

| 技术 | 版本 | 用途 |
|------|------|------|
| [Tiptap](https://tiptap.dev/) | ^3.21.0 | 现代化富文本编辑器 |
| [VueUse](https://vueuse.org/) | ^14.2.1 | Vue 组合式工具库 |
| [Alova](https://alova.js.org/) | ^3.5.1 | 轻量级请求策略库 |
| [Marked](https://marked.js.org/) | ^17.0.5 | Markdown 解析器 |

### 开发环境

- **Node.js**: `^20.19.0 || >=22.12.0`
- **包管理器**: [pnpm](https://pnpm.io/)
- **代码规范**: [Prettier](https://prettier.io/)

---

## 🚀 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- pnpm 包管理器

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/sugu6/schoolforum.git
cd schoolforum
```

2. **安装依赖**

```bash
pnpm install
```

3. **启动开发服务器**

```bash
pnpm dev
```

4. **打开浏览器访问**

```
http://localhost:5173
```

### 常用命令

```bash
# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview

# 代码格式化
pnpm format
```

---

## 📁 项目结构

```
schoolforum/
├── public/                 # 静态资源
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── apis/              # API 接口封装
│   ├── Auth/              # 认证相关页面
│   ├── components/        # 公共组件
│   ├── composables/       # 组合式函数
│   ├── config/            # 配置文件
│   ├── layout/            # 布局组件
│   ├── pages/             # 页面组件
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── styles/            # 全局样式
│   └── utils/             # 工具函数
├── docs/                  # 项目文档
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎨 品牌设计

海语采用蓝白配色方案，象征海洋的广阔与纯净。

### 品牌色彩

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 深蓝 | `#165DFF` | 主色、强调 |
| 浅蓝 | `#0EA5E9` | 渐变、辅助 |
| 纯白 | `#FFFFFF` | 文字、背景 |

### 品牌标语

> **海纳百言，语通校园**

---

## 📝 开发规范

### 推荐的 IDE 配置

- [VS Code](https://code.visualstudio.com/)
- 插件: [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (推荐禁用 Vetur)

### 浏览器开发者工具

- **Chrome/Edge/Brave**: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- **Firefox**: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

<p align="center">
  <strong>海语 - 让每一个声音都能被听见</strong> 🌊💬
</p>

<p align="center">
  Made with ❤️ for campus community
</p>
