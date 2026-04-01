// 本地存储工具函数

const STORAGE_KEY = 'electronicChats'

/**
 * 保存聊天记录到本地存储
 * @param {Array} chats 聊天记录数组
 */
export function saveChatsToStorage(chats) {
  try {
    const data = JSON.stringify(chats, (key, value) => {
      // 处理Date对象，转换为ISO字符串
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })
    localStorage.setItem(STORAGE_KEY, data)
  } catch (error) {
    console.error('保存聊天记录失败:', error)
  }
}

/**
 * 从本地存储加载聊天记录
 * @returns {Array} 聊天记录数组
 */
export function loadChatsFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    
    const chats = JSON.parse(data, (key, value) => {
      // 将ISO字符串转换回Date对象
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }
      return value
    })
    
    return Array.isArray(chats) ? chats : []
    
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    return []
  }
}

/**
 * 清空所有聊天记录
 */
export function clearChatsStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清空聊天记录失败:', error)
  }
}