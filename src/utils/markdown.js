import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 自定义渲染器
const renderer = new marked.Renderer()

// 重写列表渲染方法
renderer.list = function(body, ordered, start) {
  const type = ordered ? 'ol' : 'ul'
  const startatt = (ordered && start !== 1) ? ` start="${start}"` : ''
  return `<${type} class="markdown-list">${body}</${type}>`
}

// 重写列表项渲染方法
renderer.listitem = function(text) {
  return `<li class="markdown-list-item">${text}</li>`
}

// 配置marked
marked.setOptions({
  renderer: renderer,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  breaks: true,
  gfm: true
})

// 渲染Markdown
export const renderMarkdown = (text) => {
  if (!text) return ''
  return marked(text)
}