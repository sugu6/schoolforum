<template>
  <div class="tiptap-editor">
    <div v-if="editor" class="editor-toolbar">
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="粗体"
      >
        <IconBold />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="斜体"
      >
        <IconItalic />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
        title="删除线"
      >
        <IconStrikethrough />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('underline') }"
        @click="editor.chain().focus().toggleUnderline().run()"
        title="下划线"
      >
        <IconUnderline />
      </button>
      <div class="toolbar-btn-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: editor.isActive('highlight') }"
          @click="toggleHighlightPicker"
          title="高亮"
        >
          <IconHighlight />
        </button>
        <div v-if="highlightPickerVisible" ref="highlightPickerRef" class="color-picker">
          <button
            type="button"
            class="color-btn remove-highlight"
            @click="removeHighlight"
            title="移除高亮"
          >
            <IconClose />
          </button>
          <div class="color-divider"></div>
          <button
            v-for="color in highlightColors"
            :key="color"
            type="button"
            class="color-btn"
            :style="{ backgroundColor: color }"
            @click="setHighlightColor(color)"
            :title="color"
          ></button>
        </div>
      </div>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('heading', { level: 1 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        title="标题1"
      >
        H1
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('heading', { level: 2 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="标题2"
      >
        H2
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('heading', { level: 3 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        title="标题3"
      >
        H3
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive({ textAlign: 'left' }) }"
        @click="toggleTextAlign('left')"
        title="左对齐"
      >
        <IconAlignLeft />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive({ textAlign: 'center' }) }"
        @click="toggleTextAlign('center')"
        title="居中对齐"
      >
        <IconAlignCenter />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive({ textAlign: 'right' }) }"
        @click="toggleTextAlign('right')"
        title="右对齐"
      >
        <IconAlignRight />
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
        title="无序列表"
      >
        <IconList />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
        title="有序列表"
      >
        <IconOrderedList />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('taskList') }"
        @click="editor.chain().focus().toggleTaskList().run()"
        title="任务列表"
      >
        <IconCheck />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
        title="引用"
      >
        <IconQuote />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
        title="代码块"
      >
        <IconCode />
      </button>
      <div class="toolbar-divider"></div>
      <button type="button" class="toolbar-btn" @click="addImage" title="插入图片">
        <IconImage />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('table') }"
        @click="insertTable"
        title="插入表格"
      >
        <IconApps />
      </button>
      <button type="button" class="toolbar-btn" @click="showEmojiPicker" title="插入表情">
        <IconFaceSmileFill />
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        class="toolbar-btn"
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        title="撤销"
      >
        <IconUndo />
      </button>
      <button
        type="button"
        class="toolbar-btn"
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        title="重做"
      >
        <IconRedo />
      </button>
    </div>

    <EditorContent :editor="editor" class="editor-content" />

    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageSelect"
    />

    <EmojiPicker
      v-if="emojiPickerVisible"
      ref="emojiPickerRef"
      @select="insertEmoji"
      @click-outside="emojiPickerVisible = false"
    />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { onClickOutside } from '@vueuse/core'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table/table'
import { TableRow } from '@tiptap/extension-table/row'
import { TableCell } from '@tiptap/extension-table/cell'
import { TableHeader } from '@tiptap/extension-table/header'
import Paragraph from '@tiptap/extension-paragraph'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
  IconList,
  IconOrderedList,
  IconQuote,
  IconCode,
  IconImage,
  IconUndo,
  IconRedo,
  IconApps,
  IconFaceSmileFill,
  IconClose,
  IconCheck,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from '@arco-design/web-vue/es/icon'
import EmojiPicker from './EmojiPicker.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '请输入内容...',
  },
})

const emit = defineEmits(['update:modelValue', 'image-upload'])

const imageInputRef = ref(null)
const emojiPickerVisible = ref(false)
const highlightPickerVisible = ref(false)
const highlightPickerRef = ref(null)
const emojiPickerRef = ref(null)

const highlightColors = [
  '#fff3cd',
  '#ffcc00',
  '#ff6b6b',
  '#51cf66',
  '#339af0',
  '#cc5de8',
  '#ff922b',
  '#20c997',
]

const TableBackspace = Extension.create({
  name: 'tableBackspace',

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const editor = this.editor
        const { $from } = editor.state.selection

        if (editor.isActive('table')) {
          const isAtStartOfCell = $from.parentOffset === 0
          if (isAtStartOfCell) {
            return editor.commands.deleteTable()
          }
        }
        return false
      },
    }
  },
})

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      paragraph: false,
      underline: false,
    }),
    Paragraph.configure({
      HTMLAttributes: {
        class: 'paragraph',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'highlight',
      },
    }),
    Underline,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    TableBackspace,
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
  },
  editorProps: {
    attributes: {
      class: 'prose-editor',
    },
  },
})

const addImage = () => {
  imageInputRef.value?.click()
}

const handleImageSelect = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  emit('image-upload', file)
  event.target.value = ''
}

const insertImage = (url, alt = '') => {
  if (!editor.value) return
  editor.value.chain().focus().setImage({ src: url, alt }).run()
}

const insertTable = () => {
  if (!editor.value) return
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

const toggleTextAlign = (align) => {
  if (!editor.value) return
  if (editor.value.isActive({ textAlign: align })) {
    editor.value.chain().focus().unsetTextAlign().run()
  } else {
    editor.value.chain().focus().setTextAlign(align).run()
  }
}

const toggleHighlightPicker = () => {
  highlightPickerVisible.value = !highlightPickerVisible.value
}

const setHighlightColor = (color) => {
  if (!editor.value) return
  editor.value.chain().focus().toggleHighlight({ color }).run()
  highlightPickerVisible.value = false
}

const removeHighlight = () => {
  if (!editor.value) return
  editor.value.chain().focus().unsetHighlight().run()
  highlightPickerVisible.value = false
}

const showEmojiPicker = () => {
  emojiPickerVisible.value = !emojiPickerVisible.value
}

const insertEmoji = (emoji) => {
  if (!editor.value) return
  editor.value.chain().focus().insertContent(emoji).run()
  emojiPickerVisible.value = false
}

const setContent = (content) => {
  if (!editor.value) return
  editor.value.commands.setContent(content)
}

const getContent = () => {
  if (!editor.value) return ''
  return editor.value.getHTML()
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (!editor.value) return
    const currentContent = editor.value.getHTML()
    if (newValue !== currentContent) {
      editor.value.commands.setContent(newValue)
    }
  },
)

onClickOutside(highlightPickerRef, () => {
  highlightPickerVisible.value = false
})

onClickOutside(emojiPickerRef, () => {
  emojiPickerVisible.value = false
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({
  insertImage,
  setContent,
  getContent,
  editor,
})
</script>

<style lang="scss" scoped>
.tiptap-editor {
  width: 100%;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-2);
  position: relative;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border-2);

  @media (max-width: 576px) {
    gap: 2px;
    padding: 6px;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-2);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: var(--color-fill-3);
    color: var(--color-text-1);
  }

  &.active {
    background: rgb(var(--primary-1));
    color: rgb(var(--primary-6));
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 576px) {
    width: 28px;
    height: 28px;
    font-size: 12px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-2);
  margin: 4px 4px;
}

.toolbar-btn-group {
  position: relative;
  display: flex;
  align-items: center;
}

.color-picker {
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-top: 4px;
}

.color-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-2);
  margin: 0 4px;
}

.color-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    border-color: var(--color-text-2);
  }

  &.remove-highlight {
    background: var(--color-fill-2);
    color: var(--color-text-2);

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: var(--color-fill-3);
      color: var(--color-text-1);
    }
  }
}

.editor-content {
  padding: 16px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

:deep(.prose-editor) {
  outline: none;
  min-height: 268px;

  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: var(--color-text-4);
    pointer-events: none;
    height: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-text-1);
    margin: 1em 0 0.5em;
    font-weight: 600;
    line-height: 1.3;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: 2em;
  }

  h2 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1.25em;
  }

  h4 {
    font-size: 1.1em;
  }

  h5 {
    font-size: 1em;
  }

  h6 {
    font-size: 0.9em;
  }

  p {
    margin: 0.5em 0;
    color: var(--color-text-2);
    line-height: 1.8;
  }

  h1[style*='text-align: left'],
  h2[style*='text-align: left'],
  h3[style*='text-align: left'],
  h4[style*='text-align: left'],
  h5[style*='text-align: left'],
  h6[style*='text-align: left'],
  p[style*='text-align: left'] {
    text-align: left;
  }

  h1[style*='text-align: center'],
  h2[style*='text-align: center'],
  h3[style*='text-align: center'],
  h4[style*='text-align: center'],
  h5[style*='text-align: center'],
  h6[style*='text-align: center'],
  p[style*='text-align: center'] {
    text-align: center;
  }

  h1[style*='text-align: right'],
  h2[style*='text-align: right'],
  h3[style*='text-align: right'],
  h4[style*='text-align: right'],
  h5[style*='text-align: right'],
  h6[style*='text-align: right'],
  p[style*='text-align: right'] {
    text-align: right;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
    color: var(--color-text-2);
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  li {
    margin: 0.25em 0;

    p {
      margin: 0;
    }
  }

  blockquote {
    border-left: 4px solid rgb(var(--primary-6));
    padding-left: 1em;
    margin: 1em 0;
    color: var(--color-text-3);
  }

  code {
    background: var(--color-fill-2);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 0.9em;
    color: rgb(var(--danger-6));
  }

  pre {
    background: var(--color-fill-2);
    padding: 1em;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1em 0;

    code {
      background: transparent;
      padding: 0;
      color: var(--color-text-1);
    }
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    overflow: hidden;
    table-layout: fixed;

    td,
    th {
      border: 1px solid var(--color-border-2);
      padding: 8px 12px;
      text-align: left;
      position: relative;
      vertical-align: top;
      min-width: 50px;
    }

    th {
      background: var(--color-fill-2);
      font-weight: 600;
    }

    .selectedCell {
      background: rgba(var(--primary-1), 0.2);
    }

    th.selectedCell {
      background: rgba(var(--primary-1), 0.3);
    }

    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background: rgb(var(--primary-6));
      pointer-events: none;
    }
  }

  .tableWrapper {
    overflow-x: auto;
    margin: 1em 0;
  }

  mark {
    background-color: #fff3cd;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  ul[data-type='taskList'] {
    list-style: none;
    padding-left: 0;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 0.5em 0;

      > label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;
      }

      > div {
        flex: 1 1 auto;
      }

      input[type='checkbox'] {
        cursor: pointer;
        width: 16px;
        height: 16px;
        margin-top: 4px;
        accent-color: rgb(var(--primary-6));
      }

      &[data-checked='true'] > div > p {
        text-decoration: line-through;
        color: var(--color-text-4);
      }
    }
  }
}
</style>
