import { marked } from 'marked'
import { getServerURL } from '@/config/server'

marked.setOptions({
  breaks: true,
  gfm: true,
})

const processImagePaths = (content) => {
  if (!content) return ''

  const baseURL = getServerURL()

  // 处理 HTML <img> 标签
  content = content.replace(/<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi, (match, url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return match
    }
    const fullURL = url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`
    return match.replace(url, fullURL)
  })

  // 处理 Markdown ![](url) 格式
  content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return match
    }

    const fullURL = url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`
    return `![${alt}](${fullURL})`
  })

  return content
}

export const renderMarkdown = (content) => {
  if (!content) return ''

  const processedContent = processImagePaths(content)

  try {
    return marked.parse(processedContent)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return escapeHtml(processedContent)
  }
}

export const renderMarkdownAsync = async (content) => {
  if (!content) return ''

  const processedContent = processImagePaths(content)

  try {
    return await marked.parse(processedContent)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return escapeHtml(processedContent)
  }
}

export const renderMarkdownSync = (content) => renderMarkdown(content)

export const stripMarkdown = (content, maxLength = 200) => {
  if (!content) return ''

  let text = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text
}

export const extractImages = (content, maxImages = 3) => {
  if (!content) return []

  const baseURL = getServerURL()
  const images = []
  const seen = new Set()

  const resolveURL = (url) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`
  }

  // HTML <img> 标签
  const htmlRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
  let htmlMatch
  while ((htmlMatch = htmlRegex.exec(content)) !== null) {
    const resolved = resolveURL(htmlMatch[1])
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      images.push({ alt: '', url: resolved })
      if (images.length >= maxImages) return images
    }
  }

  // Markdown ![](url) 格式
  const mdRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let mdMatch
  while ((mdMatch = mdRegex.exec(content)) !== null) {
    const resolved = resolveURL(mdMatch[2])
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved)
      images.push({ alt: mdMatch[1] || '', url: resolved })
      if (images.length >= maxImages) return images
    }
  }

  return images
}

const generateHeadingId = (text, index) => {
  const sanitized = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `heading-${index}-${sanitized || 'untitled'}`
}

export const extractHeadingsFromMarkdown = (content) => {
  if (!content || typeof content !== 'string') return []

  const headings = []
  const lines = content.split('\n')
  let inCodeBlock = false
  let headingIndex = 0

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) continue

    const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = generateHeadingId(text, headingIndex++)

      headings.push({ level, text, id })
    }
  }

  return headings
}

export const extractHeadingsFromDOM = (container) => {
  if (!container || !(container instanceof Element)) return []

  const headings = []
  const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')

  elements.forEach((el, index) => {
    const level = parseInt(el.tagName.charAt(1), 10)
    const text = el.textContent?.trim() || ''

    if (!text) return

    const id = generateHeadingId(text, index)
    el.id = id

    headings.push({ level, text, id })
  })

  return headings
}

const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML.replace(/\n/g, '<br>')
}

export const getMarkdownStyles = () => `
  .markdown-body {
    font-size: 15px;
    line-height: 1.8;
    color: var(--color-text-2);
    word-wrap: break-word;
  }

  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    color: var(--color-text-1);
    margin: 24px 0 16px;
    font-weight: 600;
    line-height: 1.4;
    scroll-margin-top: 80px;
  }

  .markdown-body h1 { font-size: 28px; }
  .markdown-body h2 { font-size: 24px; }
  .markdown-body h3 { font-size: 20px; }
  .markdown-body h4 { font-size: 18px; }
  .markdown-body h5 { font-size: 16px; }
  .markdown-body h6 { font-size: 15px; }

  .markdown-body p {
    margin-bottom: 16px;
  }

  .markdown-body a {
    color: rgb(var(--primary-6));
    text-decoration: none;
  }

  .markdown-body a:hover {
    text-decoration: underline;
  }

  .markdown-body img {
    max-width: 100%;
    border-radius: 8px;
    margin: 16px 0;
  }

  .markdown-body code {
    background: var(--color-fill-2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 14px;
  }

  .markdown-body pre {
    background: var(--color-fill-2);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
  }

  .markdown-body pre code {
    background: transparent;
    padding: 0;
  }

  .markdown-body blockquote {
    border-left: 4px solid rgb(var(--primary-6));
    padding-left: 16px;
    margin: 16px 0;
    color: var(--color-text-3);
  }

  .markdown-body ul,
  .markdown-body ol {
    padding-left: 24px;
    margin-bottom: 16px;
  }

  .markdown-body li {
    margin-bottom: 8px;
  }

  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .markdown-body th,
  .markdown-body td {
    border: 1px solid var(--color-border-2);
    padding: 8px 12px;
    text-align: left;
  }

  .markdown-body th {
    background: var(--color-fill-2);
    font-weight: 600;
  }

  .markdown-body hr {
    border: none;
    border-top: 1px solid var(--color-border-2);
    margin: 24px 0;
  }

  .markdown-body input[type="checkbox"] {
    margin-right: 8px;
  }
`
