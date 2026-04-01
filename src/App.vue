<template>
  <div class="app-container">
    <!-- 左侧聊天列表 -->
    <div class="chat-list">
      <div class="chat-list-header">
        <h2>智能客服</h2>
        <button class="new-chat-btn" @click="createNewChat">+ 新聊天</button>
      </div>
      <div class="chat-list-content">
        <div 
          v-for="chat in chats" 
          :key="chat.id"
          class="chat-item"
          :class="{ active: activeChatId === chat.id }"
          @click="switchChat(chat.id)"
        >
          <div class="chat-item-content">
            <div class="chat-item-title">{{ chat.title || '新聊天' }}</div>
            <div class="chat-item-preview">{{ chat.messages[chat.messages.length - 1]?.content.substring(0, 30) || '无消息' }}</div>
            <div class="chat-item-time">{{ formatTime(chat.updatedAt) }}</div>
          </div>
          <button class="delete-chat-btn" @click.stop="deleteChat(chat.id)">×</button>
        </div>
      </div>
    </div>

    <!-- 右侧聊天内容 -->
    <div class="chat-content">
      <div v-if="activeChat" class="chat-content-container">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <h3>{{ activeChat.title || '新聊天' }}</h3>
        </div>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageList">
          <div 
            v-for="(message, index) in activeChat.messages" 
            :key="index"
            class="message-item"
            :class="{ user: message.role === 'user', assistant: message.role === 'assistant' }"
          >
            <div class="message-avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
            <div class="message-content" v-html="renderMarkdown(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
          <div v-if="isLoading" class="loading-message">
            <div class="loading-spinner"></div>
            <span>AI 正在思考...</span>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <textarea 
            v-model="inputMessage"
            class="message-input"
            placeholder="请输入您的问题..."
            @keydown.enter.exact="sendMessage"
            @keydown.enter.shift="inputMessage += '\n'"
            ref="messageInput"
          ></textarea>
          <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isLoading">
            发送
          </button>
        </div>
      </div>
      <div v-else class="no-chat-selected">
        <div class="no-chat-icon">💬</div>
        <h3>选择或创建一个聊天</h3>
        <p>开始与智能客服对话</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from './stores/chatStore'
import { renderMarkdown } from './utils/markdown'
import { callQwenAPI } from './utils/api'

const chatStore = useChatStore()
const messageList = ref(null)
const messageInput = ref(null)
const inputMessage = ref('')
const isLoading = ref(false)

// 计算属性
const chats = computed(() => chatStore.chats)
const activeChatId = computed(() => chatStore.activeChatId)
const activeChat = computed(() => chatStore.activeChat)

// 监听活跃聊天变化，聚焦输入框
watch(activeChatId, () => {
  nextTick(() => {
    messageInput.value?.focus()
  })
})

// 监听消息变化，滚动到底部
watch(() => activeChat.value?.messages, () => {
  scrollToBottom()
}, { deep: true })

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 创建新聊天
const createNewChat = () => {
  chatStore.createChat()
  inputMessage.value = ''
}

// 切换聊天
const switchChat = (chatId) => {
  chatStore.setActiveChat(chatId)
  inputMessage.value = ''
}

// 删除聊天
const deleteChat = (chatId) => {
  chatStore.deleteChat(chatId)
  inputMessage.value = ''
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // 添加用户消息
  chatStore.addMessage(activeChatId.value, 'user', message)
  inputMessage.value = ''

  try {
    isLoading.value = true
    
    // 为AI回复创建一个临时ID
    const aiMessageId = Date.now()
    // 添加一个空的AI回复，用于实时更新
    chatStore.addMessage(activeChatId.value, 'assistant', '')
    
    // 发送流式请求到后端
    await callQwenAPI(message, activeChat.value.messages, (chunk, fullResponse) => {
      // 更新AI回复内容
      const messages = [...activeChat.value.messages]
      // 找到最后一条AI消息并更新内容
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i].content = fullResponse
          break
        }
      }
      // 更新聊天存储
      chatStore.updateMessages(activeChatId.value, messages)
    })
    
  } catch (error) {
    console.error('发送消息失败:', error)
    chatStore.addMessage(activeChatId.value, 'assistant', `抱歉，发送消息时出现错误。请检查网络连接或稍后再试`)
  } finally {
    isLoading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  })
}

// 初始化聊天记录
chatStore.initChats()

// 组件挂载后，聚焦输入框
setTimeout(() => {
  messageInput.value?.focus()
}, 100)
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
}

/* 聊天列表样式 */
.chat-list {
  width: 300px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.chat-list-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-list-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.new-chat-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.new-chat-btn:hover {
  background: #0069d9;
}

.chat-list-content {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.chat-item:hover {
  background: #f5f5f5;
}

.chat-item.active {
  background: #e3f2fd;
}

.chat-item-content {
  flex: 1;
  min-width: 0;
}

.chat-item-title {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-preview {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-time {
  font-size: 12px;
  color: #999;
}

.delete-chat-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .delete-chat-btn {
  opacity: 1;
}

.delete-chat-btn:hover {
  background: #f0f0f0;
  color: #ff4d4f;
}

/* 聊天内容样式 */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-content-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.chat-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9f9f9;
}

.message-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  margin: 0 12px;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #007bff;
  color: white;
}

.message-content {
  flex: 1;
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-item.user .message-content {
  background: #e3f2fd;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-content {
  background: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  margin: 0 12px;
  align-self: flex-end;
}

/* 输入区域样式 */
.input-area {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  min-height: 48px;
  max-height: 120px;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.send-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  align-self: flex-end;
  min-height: 48px;
}

.send-btn:hover:not(:disabled) {
  background: #0069d9;
}

.send-btn:disabled {
  background: #c0c0c0;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 无聊天选中样式 */
.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  color: #666;
}

.no-chat-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-chat-selected h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
}

/* Markdown 样式 */
.message-content {
  line-height: 1.6;
  color: #333;
}

.message-content h1, .message-content h2, .message-content h3, .message-content h4, .message-content h5, .message-content h6 {
  margin: 24px 0 12px 0;
  font-weight: 700;
  line-height: 1.3;
  color: #2c3e50;
}

.message-content h1 {
  font-size: 24px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
  margin-top: 0;
}

.message-content :deep(h2) {
  font-size: 20px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 6px;
  margin: 20px 0;
}

.message-content :deep(h3) {
  font-size: 18px;
  color: #34495e;
}

.message-content :deep(h4) {
  font-size: 16px;
  color: #34495e;
}

.message-content :deep(h5) {
  font-size: 14px;
  color: #34495e;
}

.message-content :deep(h6) {
  font-size: 12px;
  color: #34495e;
}

.message-content :deep(p) {
  margin-bottom: 16px;
  text-align: justify;
}

/* 第一级列表 */
.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 16px 0 !important;
  padding-left: 40px !important;
  list-style-position: outside !important;
}

.message-content :deep(ul) {
  list-style-type: disc !important;
}

.message-content :deep(ol) {
  list-style-type: decimal !important;
}

.message-content :deep(li) {
  margin-bottom: 8px !important;
  line-height: 1.5 !important;
}

/* 第二级列表 */
.message-content :deep(ul ul),
.message-content :deep(ul ol),
.message-content :deep(ol ul),
.message-content :deep(ol ol) {
  margin: 8px 0 !important;
  padding-left: 60px !important;
}

/* 第三级列表 */
.message-content :deep(ul ul ul),
.message-content :deep(ul ul ol),
.message-content :deep(ul ol ul),
.message-content :deep(ul ol ol),
.message-content :deep(ol ul ul),
.message-content :deep(ol ul ol),
.message-content :deep(ol ol ul),
.message-content :deep(ol ol ol) {
  margin: 8px 0 !important;
  padding-left: 80px !important;
}

.message-content code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: #e74c3c;
}

.message-content pre {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #e0e0e0;
}

.message-content pre code {
  background: none;
  padding: 0;
  color: #333;
  font-size: 13px;
  line-height: 1.4;
}

.message-content blockquote {
  border-left: 4px solid #007bff;
  padding: 12px 16px;
  margin: 16px 0;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 0 4px 4px 0;
}

.message-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  font-size: 14px;
}

.message-content th, .message-content td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
}

.message-content th {
  background: #f5f5f5;
  font-weight: 600;
  color: #2c3e50;
}

.message-content tr:nth-child(even) {
  background-color: #f8f9fa;
}

.message-content a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.message-content a:hover {
  text-decoration: underline;
  color: #0056b3;
}

.message-content img {
  max-width: 100%;
  border-radius: 4px;
  margin: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 强调样式 */
.message-content strong {
  font-weight: 700;
  color: #2c3e50;
}

.message-content em {
  font-style: italic;
  color: #666;
}

/* 分隔线 */
.message-content hr {
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}
</style>