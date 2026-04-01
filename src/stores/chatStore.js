import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [],
    activeChatId: null
  }),
  getters: {
    activeChat: (state) => {
      return state.chats.find(chat => chat.id === state.activeChatId)
    }
  },
  actions: {
    // 初始化聊天记录
    initChats() {
      const savedChats = localStorage.getItem('chats')
      if (savedChats) {
        try {
          this.chats = JSON.parse(savedChats)
          if (this.chats.length > 0) {
            this.activeChatId = this.chats[0].id
          }
        } catch (error) {
          console.error('加载聊天记录失败:', error)
          this.createChat()
        }
      } else {
        this.createChat()
      }
    },
    
    // 保存聊天记录到本地存储
    saveChats() {
      localStorage.setItem('chats', JSON.stringify(this.chats))
    },
    
    // 创建新聊天
    createChat() {
      const newChat = {
        id: uuidv4(),
        title: null,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      this.chats.unshift(newChat)
      this.activeChatId = newChat.id
      this.saveChats()
      return newChat.id
    },
    
    // 设置活跃聊天
    setActiveChat(chatId) {
      this.activeChatId = chatId
    },
    
    // 添加消息
    addMessage(chatId, role, content) {
      const chat = this.chats.find(chat => chat.id === chatId)
      if (chat) {
        chat.messages.push({
          role,
          content,
          timestamp: new Date().toISOString()
        })
        
        // 如果是用户消息且聊天标题为空，设置标题为消息内容的前20个字符
        if (role === 'user' && !chat.title) {
          chat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '')
        }
        
        chat.updatedAt = new Date().toISOString()
        this.saveChats()
      }
    },
    
    // 删除聊天
    deleteChat(chatId) {
      const index = this.chats.findIndex(chat => chat.id === chatId)
      if (index !== -1) {
        this.chats.splice(index, 1)
        
        // 如果删除的是活跃聊天，设置新的活跃聊天
        if (this.activeChatId === chatId) {
          this.activeChatId = this.chats.length > 0 ? this.chats[0].id : null
        }
        
        this.saveChats()
      }
    }
  }
})