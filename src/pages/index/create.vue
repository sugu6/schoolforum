<template>
  <div class="create-post-page">
    <a-row :gutter="[20, 0]">
      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="left-placeholder"></div>
      </a-col>

      <a-col :xs="24" :sm="24" :md="24" :lg="16" :xl="14" :xxl="14">
        <a-card class="create-card" :bordered="true">
          <template #title>
            <div class="card-title">
              <IconEdit />
              <span>发布新帖</span>
            </div>
          </template>

          <a-form ref="formRef" :model="postForm" layout="vertical" @submit="handleSubmit">
            <a-form-item
              label="帖子标题"
              field="title"
              :rules="[
                { required: true, message: '请输入帖子标题' },
                { minLength: 5, message: '标题至少5个字符' },
                { maxLength: 100, message: '标题最多100个字符' },
              ]"
            >
              <a-input
                v-model="postForm.title"
                placeholder="请输入帖子标题（5-100字）"
                allow-clear
                :max-length="100"
                show-word-limit
              />
            </a-form-item>

            <a-form-item
              label="帖子内容"
              field="content"
              :rules="[
                { required: true, message: '请输入帖子内容' },
                { minLength: 10, message: '内容至少10个字符' },
              ]"
            >
              <TiptapEditor
                ref="editorRef"
                v-model="postForm.content"
                placeholder="请输入帖子内容..."
                @image-upload="handleImageUpload"
              />
            </a-form-item>

            <a-form-item
              label="选择分类"
              field="categoryId"
              :rules="[{ required: true, message: '请选择分类' }]"
            >
              <a-cascader
                v-model="postForm.categoryId"
                :options="categoryOptions"
                placeholder="请选择分类"
                expand-trigger="hover"
                allow-clear
                @change="handleCategoryChange"
              />
            </a-form-item>

            <a-form-item label="选择标签" field="tagIds">
              <a-select
                v-model="postForm.tagIds"
                :options="tagOptions"
                placeholder="点击选择标签（可选）"
                multiple
                allow-clear
                allow-search
                :loading="tagsLoading"
                :fallback-option="false"
              />
            </a-form-item>

            <a-form-item label="封面图片" field="coverImage">
              <div class="cover-upload-section">
                <a-upload
                  :fileList="coverFileList"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  @change="handleCoverChange"
                >
                  <template #upload-button>
                    <div class="cover-upload-area" v-if="!coverPreview">
                      <div class="upload-placeholder">
                        <IconPlus :size="32" />
                        <span class="upload-text">上传封面图片</span>
                        <span class="upload-hint">支持 JPG、PNG 格式，建议尺寸 800x400</span>
                      </div>
                    </div>
                    <div class="cover-preview" v-else>
                      <img :src="coverPreview" alt="cover" />
                      <div class="cover-mask">
                        <IconDelete @click.stop="removeCover" />
                        <span>删除封面</span>
                      </div>
                    </div>
                  </template>
                </a-upload>
                <div class="cover-tip">
                  <IconInfoCircle />
                  <span>默认文章中第一张图将自动设为封面</span>
                </div>
              </div>
            </a-form-item>

            <a-form-item>
              <a-space>
                <a-button
                  type="primary"
                  html-type="submit"
                  :loading="submitting"
                  :disabled="!isFormValid"
                >
                  <template #icon>
                    <IconSend />
                  </template>
                  发布帖子
                </a-button>
                <a-button @click="handleSaveDraft" :disabled="!postForm.title">
                  <template #icon>
                    <IconSave />
                  </template>
                  保存草稿
                </a-button>
                <a-button @click="handleCancel"> 取消 </a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>

      <a-col :xs="0" :sm="0" :md="0" :lg="4" :xl="5" :xxl="5">
        <div class="right-sidebar">
          <a-card class="tips-card">
            <template #title>
              <div class="sidebar-title">
                <IconBulb />
                发帖指南
              </div>
            </template>
            <div class="tips-list">
              <div class="tip-item">
                <IconCheckCircleFill class="tip-icon success" />
                <span>标题简洁明了，突出主题</span>
              </div>
              <div class="tip-item">
                <IconCheckCircleFill class="tip-icon success" />
                <span>内容详实，图文并茂</span>
              </div>
              <div class="tip-item">
                <IconCheckCircleFill class="tip-icon success" />
                <span>选择正确的分类和标签</span>
              </div>
              <div class="tip-item">
                <IconCheckCircleFill class="tip-icon success" />
                <span>遵守社区规范，文明发言</span>
              </div>
            </div>
          </a-card>

          <a-card class="drafts-card">
            <template #title>
              <div class="sidebar-title">
                <IconFile />
                草稿箱
              </div>
            </template>
            <div class="drafts-list" v-if="drafts.length > 0">
              <div
                v-for="(draft, index) in drafts"
                :key="index"
                class="draft-item"
                @click="loadDraft(draft)"
              >
                <div class="draft-info">
                  <div class="draft-title">{{ draft.title || '无标题' }}</div>
                  <div class="draft-time">{{ formatDraftTime(draft.savedAt) }}</div>
                </div>
                <a-button
                  type="text"
                  size="mini"
                  class="draft-delete"
                  @click.stop="deleteDraft(index)"
                >
                  <template #icon>
                    <IconDelete />
                  </template>
                </a-button>
              </div>
            </div>
            <a-empty v-else description="暂无草稿" :style="{ padding: '20px 0' }" />
          </a-card>
        </div>
      </a-col>
    </a-row>

    <a-modal v-model:visible="previewVisible" title="帖子预览" :footer="false" width="800px">
      <div class="preview-content">
        <h2 class="preview-title">{{ postForm.title || '无标题' }}</h2>
        <div class="preview-meta">
          <a-tag v-if="selectedCategoryName" color="blue">{{ selectedCategoryName }}</a-tag>
          <span class="preview-time">{{ currentTime }}</span>
        </div>
        <div class="preview-body" v-html="previewContent"></div>
        <div v-if="coverPreview" class="preview-cover">
          <img :src="coverPreview" alt="cover" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconEdit,
  IconPlus,
  IconDelete,
  IconInfoCircle,
  IconSend,
  IconSave,
  IconBulb,
  IconCheckCircleFill,
  IconFile,
} from '@arco-design/web-vue/es/icon'
import { createPost, uploadPostImage } from '@/apis/posts'
import { getImageURL } from '@/config/server'
import { getCategoryList } from '@/apis/categories'
import { getTagsByCategory } from '@/apis/tags'
import { useUserStore } from '@/stores/user'
import { renderMarkdown } from '@/utils/markdown'
import TiptapEditor from '@/components/TiptapEditor.vue'

definePage({
  meta: {
    title: '发布帖子',
    requiresAuth: true,
  },
})

const router = useRouter()
const userStore = useUserStore()

const postForm = reactive({
  title: '',
  content: '',
  categoryId: null,
  tagIds: [],
  coverImage: '',
})

const submitting = ref(false)
const categoryOptions = ref([])
const tagOptions = ref([])
const tagsLoading = ref(false)
const coverFileList = ref([])
const coverPreview = ref('')
const previewVisible = ref(false)
const drafts = useLocalStorage('postDrafts', [])
const currentTime = ref('')
const editorRef = ref(null)
const formRef = ref(null)

const selectedCategoryName = computed(() => {
  if (!postForm.categoryId || categoryOptions.value.length === 0) return ''
  const findCategory = (options, id) => {
    for (const opt of options) {
      if (opt.value === id) return opt.label
      if (opt.children) {
        const found = findCategory(opt.children, id)
        if (found) return found
      }
    }
    return ''
  }
  return findCategory(categoryOptions.value, postForm.categoryId)
})

const previewContent = computed(() => {
  if (!postForm.content) return '<p class="empty-content">暂无内容</p>'
  return renderMarkdown(postForm.content)
})

const isFormValid = computed(() => {
  return (
    postForm.title &&
    postForm.title.length >= 5 &&
    postForm.content &&
    postForm.content.length >= 10 &&
    postForm.categoryId
  )
})

const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    if (res.code === 200 && res.data) {
      categoryOptions.value = res.data.map((parent) => ({
        value: parent.id,
        label: parent.name,
        children:
          parent.children?.map((child) => ({
            value: child.id,
            label: child.name,
          })) || [],
      }))
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const handleCategoryChange = async (value) => {
  postForm.tagIds = []
  tagOptions.value = []
  if (value) {
    const categoryId = Array.isArray(value) ? value[value.length - 1] : value
    await fetchTagsByCategory(categoryId)
  }
}

const fetchTagsByCategory = async (categoryId) => {
  tagsLoading.value = true
  try {
    const res = await getTagsByCategory(categoryId)
    if (res.code === 200 && res.data) {
      tagOptions.value = res.data.map((tag) => ({
        value: tag.id,
        label: tag.name,
        postCount: tag.postCount,
      }))
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  } finally {
    tagsLoading.value = false
  }
}

const handleCoverChange = async (fileList, file) => {
  if (!file || !file.file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.file.type)) {
    Message.error('请上传 JPG、PNG、GIF 或 WebP 格式的图片')
    coverFileList.value = []
    return
  }

  if (file.file.size > 5 * 1024 * 1024) {
    Message.error('图片大小不能超过 5MB')
    coverFileList.value = []
    return
  }

  if (coverPreview.value && coverPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value)
  }
  coverPreview.value = URL.createObjectURL(file.file)
  coverFileList.value = [file]

  try {
    const res = await uploadPostImage(file.file)
    if (res.code === 200) {
      postForm.coverImage = res.data.url || res.data
      Message.success('封面上传成功')
    } else {
      Message.error(res.message || '封面上传失败')
      coverPreview.value = ''
      coverFileList.value = []
    }
  } catch (error) {
    console.error('上传封面失败:', error)
    Message.error('封面上传失败')
    coverPreview.value = ''
    coverFileList.value = []
  }
}

const removeCover = () => {
  coverPreview.value = ''
  coverFileList.value = []
  postForm.coverImage = ''
}

const handleImageUpload = async (file) => {
  try {
    const res = await uploadPostImage(file)
    if (res.code === 200) {
      const url = res.data.url || res.data
      editorRef.value?.insertImage(url, file.name)
      Message.success('图片上传成功')
    } else {
      Message.error(res.message || '图片上传失败')
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    Message.error('图片上传失败')
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    Message.warning('请完善帖子信息')
    return
  }

  submitting.value = true
  try {
    const data = {
      title: postForm.title,
      content: postForm.content,
      categoryId: Array.isArray(postForm.categoryId)
        ? postForm.categoryId[postForm.categoryId.length - 1]
        : postForm.categoryId,
      tagIds: postForm.tagIds,
      coverImage: postForm.coverImage,
    }

    const res = await createPost(data)
    if (res.code === 200) {
      Message.success('帖子发布成功')
      clearDraft()
      router.push(`/post/${res.data.id}`)
    } else {
      Message.error(res.message || '帖子发布失败')
    }
  } catch (error) {
    console.error('发布帖子失败:', error)
    Message.error('帖子发布失败')
  } finally {
    submitting.value = false
  }
}

const handleSaveDraft = () => {
  const draft = {
    title: postForm.title,
    content: postForm.content,
    categoryId: postForm.categoryId,
    tagIds: postForm.tagIds,
    coverImage: postForm.coverImage,
    savedAt: new Date().toISOString(),
  }

  drafts.value.unshift(draft)
  if (drafts.value.length > 10) drafts.value.pop()
  Message.success('草稿已保存')
}

const loadDraft = (draft) => {
  Modal.confirm({
    title: '加载草稿',
    content: '加载草稿将覆盖当前内容，是否继续？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      postForm.title = draft.title || ''
      postForm.content = draft.content || ''
      postForm.categoryId = draft.categoryId || null
      postForm.tagIds = draft.tagIds || []
      postForm.coverImage = draft.coverImage || ''
      if (draft.coverImage) {
        coverPreview.value = getImageURL(draft.coverImage)
      }
      if (editorRef.value && draft.content) {
        editorRef.value.setContent(draft.content)
      }
      Message.success('草稿已加载')
    },
  })
}

const clearDraft = () => {
  const currentDraftIndex = drafts.value.findIndex((d) => d.title === postForm.title)
  if (currentDraftIndex > -1) {
    drafts.value.splice(currentDraftIndex, 1)
  }
}

const handleCancel = () => {
  if (postForm.title || postForm.content) {
    Modal.confirm({
      title: '确认离开',
      content: '离开将丢失当前编辑的内容，是否保存为草稿？',
      okText: '保存并离开',
      cancelText: '直接离开',
      onOk: () => {
        handleSaveDraft()
        router.push('/')
      },
      onCancel: () => {
        router.push('/')
      },
    })
  } else {
    router.push('/')
  }
}

const formatDraftTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString('zh-CN')
}

const deleteDraft = (index) => {
  drafts.value.splice(index, 1)
  Message.success('草稿已删除')
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    Message.warning('请先登录')
    router.push('/auth?mode=login')
    return
  }

  fetchCategories()
})

onBeforeUnmount(() => {
  if (coverPreview.value && coverPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value)
  }
})
</script>

<style lang="scss" scoped>
.create-post-page {
  padding: 24px;
  min-height: 100%;
  background-color: var(--color-bg-1);
}

.left-placeholder {
  height: 1px;
}

.create-card {
  border-radius: 12px;
  background-color: var(--color-bg-2);
  border-color: var(--color-border-2);

  :deep(.arco-card-header) {
    border-bottom: 1px solid var(--color-border-2);
    padding: 16px 24px;
  }

  :deep(.arco-card-body) {
    padding: 24px;
  }
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

:deep(.arco-form-item-label) {
  color: var(--color-text-2);
  font-weight: 500;
}

:deep(.arco-input-wrapper),
:deep(.arco-textarea-wrapper),
:deep(.arco-cascader),
:deep(.arco-select-view) {
  background: var(--color-fill-2);
  border-color: transparent;

  &:hover,
  &:focus-within {
    background: var(--color-bg-1);
    border-color: rgb(var(--primary-6));
  }
}

.cover-upload-section {
  width: 100%;
}

.cover-upload-area {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--color-border-2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-fill-1);

  &:hover {
    border-color: rgb(var(--primary-6));
    background: var(--color-fill-2);
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-3);
}

.upload-text {
  font-size: 14px;
  color: var(--color-text-2);
}

.upload-hint {
  font-size: 12px;
  color: var(--color-text-4);
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;

  svg {
    font-size: 24px;
  }

  span {
    font-size: 14px;
  }
}

.cover-preview:hover .cover-mask {
  opacity: 1;
}

.cover-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-4);
}

.right-sidebar {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 4px;

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
}

.tips-card,
.drafts-card {
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--color-bg-2);

  :deep(.arco-card-header) {
    padding: 12px 16px;
    border-bottom: none;
  }

  :deep(.arco-card-body) {
    padding: 0 16px 16px;
  }
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-2);
}

.tip-icon {
  font-size: 16px;

  &.success {
    color: rgb(var(--success-6));
  }
}

.drafts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draft-item {
  padding: 12px;
  border-radius: 6px;
  background: var(--color-fill-2);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: var(--color-fill-3);

    .draft-delete {
      opacity: 1;
    }
  }
}

.draft-info {
  flex: 1;
  overflow: hidden;
}

.draft-title {
  font-size: 14px;
  color: var(--color-text-1);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-time {
  font-size: 12px;
  color: var(--color-text-4);
}

.draft-delete {
  opacity: 0;
  transition: opacity 0.2s;
  color: var(--color-text-3);

  &:hover {
    color: rgb(var(--danger-6));
  }
}

.preview-content {
  padding: 16px;
}

.preview-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 16px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.preview-time {
  font-size: 14px;
  color: var(--color-text-3);
}

.preview-body {
  font-size: 15px;
  color: var(--color-text-2);
  line-height: 1.8;
  margin-bottom: 24px;

  :deep(p) {
    margin-bottom: 12px;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 24px 0 12px;
    color: var(--color-text-1);
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
    margin-bottom: 12px;
  }

  :deep(code) {
    background: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  :deep(pre) {
    background: var(--color-fill-2);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 12px;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 12px 0;
  }

  .empty-content {
    color: var(--color-text-4);
    text-align: center;
    padding: 40px 0;
  }
}

.preview-cover {
  img {
    width: 100%;
    border-radius: 8px;
  }
}

@media (max-width: 1200px) {
  .right-sidebar {
    height: calc(100vh - 180px);
  }
}

@media (max-width: 992px) {
  .create-post-page {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .create-post-page {
    padding: 12px;
  }

  .create-card {
    :deep(.arco-card-body) {
      padding: 16px;
    }
  }

  .cover-upload-area {
    height: 160px;
  }

  .cover-preview {
    height: 160px;
  }
}
</style>
