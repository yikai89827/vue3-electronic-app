// API调用工具函数

/**
 * 调用千问AI API - 流式返回
 * @param {string} message 当前消息
 * @param {Array} historyMessages 历史消息
 * @param {Function} onChunk 接收流式数据的回调函数
 * @returns {Promise<string>} 完整的AI回复
 */
export async function callQwenAPI(message, historyMessages = [], onChunk) {
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

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // 处理SSE格式的消息
      const lines = buffer.split('\n')
      buffer = lines.pop() // 保留最后不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6)
          
          if (dataStr === '[DONE]') {
            // 流式结束
            return fullResponse
          }

          try {
            const data = JSON.parse(dataStr)
            // 提取AI回复内容
            const chunk = data.output?.text || data.response || data.message || data.choices?.[0]?.message?.content || ''
            
            if (chunk) {
              fullResponse += chunk
              // 调用回调函数，发送实时数据
              if (onChunk) {
                onChunk(chunk, fullResponse)
              }
            }
          } catch (parseError) {
            console.error('Parse error:', parseError)
          }
        }
      }
    }

    return fullResponse || '收到您的消息，但未获得有效回复。'
    
  } catch (error) {
    console.error('API调用失败:', error)
    throw new Error('网络连接失败，请检查后端服务是否运行在端口3000')
  }
}