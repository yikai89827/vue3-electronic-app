import { app, BrowserWindow, Menu, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import http from 'http'
import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'

const isDev = process.env.NODE_ENV === 'development'

// 确定应用路径
let appPath = app.getAppPath()
console.log('Original app path:', appPath)

// 检查是否在asar包中
if (appPath.includes('app.asar')) {
  // 在asar包中，dist目录应该在asar包内
  console.log('Running from asar package')
  // 对于asar包，app.getAppPath() 会返回asar包的路径，如：C:\path\to\app.asar
  // 我们可以直接使用这个路径，因为Node.js可以直接访问asar包内的文件
} else {
  // 不在asar包中，使用原始路径
  console.log('Running from directory')
}
console.log('Final app path:', appPath)

let mainWindow

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.resolve(appPath, 'dist-electron/preload/preload.cjs')
    },
    icon: path.join(__dirname, '../assets/icon.ico'), // 应用图标
    titleBarStyle: 'default',
    show: false // 先隐藏，等准备好再显示
  })

  // 加载应用
  // 无论开发环境还是生产环境，都使用本地服务器加载文件，确保相对路径正确解析
  try {
    console.log('Starting server...')
    
    const http = require('http')
    const express = require('express')
    const cors = require('cors')
    const axios = require('axios')
    
    // 加载.env文件
    const dotenv = require('dotenv')
    const envResult = dotenv.config()
    if (envResult.error) {
      console.error('Error loading .env file:', envResult.error)
    } else {
      console.log('Loaded .env file successfully')
    }
    
    const expressApp = express()
    
    // 中间件
    expressApp.use(cors())
    expressApp.use(express.json())
    
    // 静态文件目录
    const distPath = path.resolve(appPath, 'dist')
    console.log('Static files directory:', distPath)
    expressApp.use(express.static(distPath))
    
    // 健康检查端点
    expressApp.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'AI Chatbot Proxy Server is running' })
    })
    
    // 代理通义千问API - 支持流式返回
    expressApp.post('/api/chat', async (req, res) => {
      try {
        const { messages, temperature = 0.7 } = req.body
        
        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({ error: 'Messages array is required' })
        }

        const apiKey = process.env.QWEN_API_KEY
        if (!apiKey) {
          return res.status(500).json({ error: 'API key not configured' })
        }

        // 设置响应头为SSE格式
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        // 发送流式请求
        const response = await axios.post(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
          {
            model: 'qwen-turbo',
            input: { messages },
            parameters: { temperature },
            stream: true // 启用流式返回
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            timeout: 60000, // 增加超时时间
            responseType: 'stream' // 响应类型设置为流
          }
        )

        // 处理流式响应
        response.data.on('data', (chunk) => {
          try {
            const chunkStr = chunk.toString()
            // 分割SSE格式的消息
            const lines = chunkStr.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6)
                if (dataStr === '[DONE]') {
                  // 流式结束
                  res.write('data: [DONE]\n\n')
                  res.end()
                  return
                }
                
                try {
                  const data = JSON.parse(dataStr)
                  // 发送数据到前端
                  res.write(`data: ${JSON.stringify(data)}\n\n`)
                } catch (parseError) {
                  console.error('Parse error:', parseError)
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error)
          }
        })

        response.data.on('error', (error) => {
          console.error('Stream error:', error)
          res.status(500).end()
        })

        response.data.on('end', () => {
          res.end()
        })

      } catch (error) {
        console.error('Proxy error:', error.response?.data || error.message)
        
        if (error.response) {
          // 转发API的错误响应
          res.status(error.response.status).json({
            error: 'API request failed',
            details: error.response.data
          })
        } else if (error.request) {
          // 网络错误
          res.status(500).json({
            error: 'Network error',
            message: '无法连接到通义千问API'
          })
        } else {
          // 其他错误
          res.status(500).json({
            error: 'Server error',
            message: error.message
          })
        }
      }
    })
    
    // 创建服务器
    const server = http.createServer(expressApp)
    const port = 3000
    
    // 启动服务器
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${port}`)
      console.log(`Health check: http://localhost:${port}/health`)
      console.log(`Chat endpoint: http://localhost:${port}/api/chat`)
      mainWindow.loadURL(`http://localhost:${port}`)
      
      // 开发环境：打开开发者工具
      if (isDev) {
        mainWindow.webContents.openDevTools()
      }
    })
    
    // 应用退出时关闭服务器
    app.on('quit', () => {
      server.close()
    })
  } catch (error) {
    console.error('Error starting server:', error)
    // 如果服务器启动失败，直接加载本地文件
    const indexHtmlPath = path.resolve(appPath, 'dist/index.html')
    console.log('Loading local file:', indexHtmlPath)
    mainWindow.loadFile(indexHtmlPath)
    
    // 开发环境：打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 创建应用菜单
  createApplicationMenu()

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 处理外部链接（在新窗口中打开）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建对话',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-chat')
            }
          }
        },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '智能客服聊天应用',
              detail: '基于Vue 3 + Electron构建的智能客服系统\n版本: 1.0.0'
            })
          }
        }
      ]
    }
  ]

  // macOS特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: '关于 ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 ' + app.getName() },
        { role: 'hideothers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: '退出 ' + app.getName() }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 应用准备就绪
app.whenReady().then(createWindow)

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS应用激活时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// 阻止导航到外部URL
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:3000' && !isDev) {
      event.preventDefault()
    }
  })
})

// 处理协议（可选：如果需要自定义协议）
app.setAsDefaultProtocolClient('electronic-chat')

// 阻止应用多个实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}