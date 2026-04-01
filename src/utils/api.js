// API调用工具函数

/**
 * 调用千问AI API
 * @param {string} message 当前消息
 * @param {Array} historyMessages 历史消息
 * @returns {Promise<string>} AI回复
 */
export async function callQwenAPI(message, historyMessages = []) {
  // 构建包含历史消息的对话上下文
  const messages = []
  
  // 添加历史消息（最多保留最近10轮对话）
  const recentMessages = historyMessages.slice(-20) // 最多保留20条消息
  
  recentMessages.forEach(msg => {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    })
  })
  
  // 添加当前消息
  messages.push({
    role: 'user',
    content: message
  })

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.output?.text || data.response || data.message || data.choices?.[0]?.message?.content || '收到您的消息，但未获得有效回复。'
    
  } catch (error) {
    console.error('API调用失败:', error)
    throw new Error('网络连接失败，请检查后端服务是否运行在端口3000')
  }
}