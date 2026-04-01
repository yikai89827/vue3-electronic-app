const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 应用菜单事件
  onNewChat: (callback) => ipcRenderer.on('new-chat', callback),
  
  // 文件操作（如果需要）
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // 系统信息
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron
})

// 开发环境下的热重载支持
if (process.env.NODE_ENV === 'development') {
  // 监听文件变化，触发热重载
  require('electron').ipcRenderer.on('vite-dev-server-reload', () => {
    window.location.reload()
  })
}