<template>
  <div class="toc-wrapper">
    <div class="toc-header">
      <span class="toc-title">目录</span>
      <span v-if="headings.length > 0" class="toc-count">{{ headings.length }}</span>
    </div>
    <div class="toc-content">
      <ul v-if="headings.length > 0" class="toc-list" role="list">
        <li
          v-for="heading in headings"
          :key="heading.id"
          :class="['toc-item', `toc-level-${heading.level}`, { active: activeId === heading.id }]"
          :title="heading.text"
          role="listitem"
          @click="handleHeadingClick(heading)"
        >
          <span class="toc-indicator"></span>
          <span class="toc-text">{{ heading.text }}</span>
        </li>
      </ul>
      <div v-else class="toc-empty">
        <span>暂无目录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  headings: {
    type: Array,
    default: () => [],
    validator: (value) => value.every((h) => h.id && h.level && h.text),
  },
  offset: {
    type: Number,
    default: 80,
  },
  throttleMs: {
    type: Number,
    default: 100,
  },
})

const activeId = ref('')
const isScrolling = ref(false)
const scrollTimeout = ref(null)

const handleHeadingClick = (heading) => {
  const element = document.getElementById(heading.id)
  if (!element) return

  isScrolling.value = true
  activeId.value = heading.id

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
  const offsetPosition = elementPosition - props.offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })

  // 清除之前的定时器
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  // 滚动动画完成后恢复滚动监听
  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false
  }, 500)
}

const findActiveHeading = () => {
  if (!props.headings.length || isScrolling.value) return

  const scrollPosition = window.pageYOffset + props.offset + 20
  let currentId = ''

  // 从后往前找，找到第一个在视口上方的标题
  for (let i = props.headings.length - 1; i >= 0; i--) {
    const heading = props.headings[i]
    const element = document.getElementById(heading.id)
    if (element) {
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset
      if (elementTop <= scrollPosition) {
        currentId = heading.id
        break
      }
    }
  }

  // 如果没有找到，可能是页面在顶部，选择第一个标题
  if (!currentId && props.headings.length > 0) {
    const firstElement = document.getElementById(props.headings[0].id)
    if (firstElement) {
      const firstTop = firstElement.getBoundingClientRect().top + window.pageYOffset
      if (window.pageYOffset + props.offset >= firstTop) {
        currentId = props.headings[0].id
      }
    }
  }

  if (currentId && currentId !== activeId.value) {
    activeId.value = currentId
  }
}

const throttledScroll = useThrottleFn(findActiveHeading, props.throttleMs)

onMounted(() => {
  window.addEventListener('scroll', throttledScroll, { passive: true })
  nextTick(() => findActiveHeading())
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScroll)
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }
})

watch(
  () => props.headings,
  (newHeadings) => {
    if (newHeadings.length > 0) {
      nextTick(() => findActiveHeading())
    } else {
      activeId.value = ''
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.toc-wrapper {
  background-color: var(--color-bg-2);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  overflow: hidden;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-2);
  background-color: var(--color-fill-1);
}

.toc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.toc-count {
  font-size: 12px;
  color: var(--color-text-3);
  background-color: var(--color-fill-2);
  padding: 2px 8px;
  border-radius: 10px;
}

.toc-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--color-fill-3);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  @media (max-width: 768px) {
    max-height: 200px;
  }
}

.toc-list {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: var(--color-fill-1);

    .toc-text {
      color: rgb(var(--primary-6));
    }

    .toc-indicator {
      background-color: rgb(var(--primary-6));
    }
  }

  &.active {
    background-color: rgba(var(--primary-6), 0.08);

    .toc-text {
      color: rgb(var(--primary-6));
      font-weight: 500;
    }

    .toc-indicator {
      background-color: rgb(var(--primary-6));
      height: 16px;
    }
  }
}

.toc-indicator {
  width: 3px;
  height: 12px;
  background-color: var(--color-fill-3);
  border-radius: 2px;
  margin-right: 12px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.toc-text {
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.toc-level-1 {
  padding-left: 16px;
}
.toc-level-2 {
  padding-left: 28px;
}
.toc-level-3 {
  padding-left: 40px;
}
.toc-level-4 {
  padding-left: 52px;
}
.toc-level-5 {
  padding-left: 64px;
}
.toc-level-6 {
  padding-left: 76px;
}

.toc-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--color-text-3);
  font-size: 13px;
}
</style>
