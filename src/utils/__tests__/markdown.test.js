import { describe, it, expect } from 'vitest'
import { extractHeadingsFromMarkdown } from '@/utils/markdown'

describe('extractHeadingsFromMarkdown', () => {
  it('应提取各级标题', () => {
    const md = `# 一级标题

## 二级标题

### 三级标题

#### 四级标题
`
    const headings = extractHeadingsFromMarkdown(md)
    expect(headings).toHaveLength(4)
    expect(headings[0]).toMatchObject({ level: 1, text: '一级标题' })
    expect(headings[1]).toMatchObject({ level: 2, text: '二级标题' })
    expect(headings[2]).toMatchObject({ level: 3, text: '三级标题' })
    expect(headings[3]).toMatchObject({ level: 4, text: '四级标题' })
  })

  it('空内容应返回空数组', () => {
    expect(extractHeadingsFromMarkdown('')).toEqual([])
    expect(extractHeadingsFromMarkdown(null)).toEqual([])
    expect(extractHeadingsFromMarkdown(undefined)).toEqual([])
  })

  it('应跳过代码块内的标题标记', () => {
    const md = `# 真实标题

\`\`\`
# 不是标题
\`\`\`

## 另一个真实标题
`
    const headings = extractHeadingsFromMarkdown(md)
    expect(headings).toHaveLength(2)
    expect(headings[0].text).toBe('真实标题')
    expect(headings[1].text).toBe('另一个真实标题')
  })

  it('生成的 id 应包含索引和格式化文本', () => {
    const md = `# Hello World`
    const headings = extractHeadingsFromMarkdown(md)
    expect(headings[0].id).toBe('heading-0-hello-world')
  })

  it('非字符串输入应返回空数组', () => {
    expect(extractHeadingsFromMarkdown(123)).toEqual([])
    expect(extractHeadingsFromMarkdown({})).toEqual([])
  })
})
