# 智能客服聊天桌面应用

这是一个基于Electron的Windows桌面应用程序，提供智能客服聊天功能，集成阿里千问API。

## 功能特性

- 💬 智能客服聊天界面
- 🔄 实时消息发送和接收
- 📱 响应式界面设计
- 💾 本地聊天记录存储
- ⌨️ 快捷键支持
- 🎯 与后端API集成

## 安装和运行

### 前提条件

- Node.js (版本 16 或更高)
- npm 或 yarn
- 后端服务运行在 localhost:3000

### 安装步骤

1. 克隆或下载项目到本地
2. 在项目目录中运行以下命令安装依赖：

```bash
npm install
```

如果遇到网络问题，可以使用淘宝镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

3. 启动应用：

```bash
npm start
```

### 开发模式

```bash
npm run dev
```

### 构建Windows应用

```bash
npm run build-win
```

## 后端API集成

应用需要与后端服务配合使用，后端服务应该：

- 运行在端口 3001
- 提供 `/api/chat` POST接口
- 代理请求到阿里千问API

API请求格式：
```json
{
  "message": "用户输入的消息",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

API响应格式：
```json
{
  "response": "AI回复的消息",
  "status": "success"
}
```

## 使用说明

1. **新建聊天**：点击侧边栏的"新建聊天"按钮或使用快捷键 Ctrl+N
2. **发送消息**：在输入框中输入消息，按Enter发送
3. **切换聊天**：点击侧边栏的聊天记录切换不同对话
4. **查看历史**：所有聊天记录会自动保存在本地

## 项目结构

```
electronic-chat-app/
├── main.js          # Electron主进程
├── index.html       # 应用界面
├── renderer.js      # 渲染进程逻辑
├── package.json     # 项目配置
└── assets/          # 资源文件
    └── icon.ico     # 应用图标
```

## 技术栈

- Electron - 桌面应用框架
- HTML/CSS/JavaScript - 前端技术
- LocalStorage - 本地数据存储
- Fetch API - HTTP请求

## 注意事项

- 确保后端服务正常运行在端口3000
- 应用需要网络连接才能调用API
- 聊天记录保存在浏览器本地存储中
- 首次运行可能需要较长时间下载Electron依赖

## 故障排除

### 安装问题

如果安装Electron时遇到问题，可以尝试：

1. 清理node_modules目录重新安装
2. 使用淘宝镜像源
3. 检查网络连接

### 运行问题

如果应用无法启动：

1. 检查Node.js版本是否符合要求
2. 确认所有依赖已正确安装
3. 查看控制台错误信息

## 许可证

MIT License