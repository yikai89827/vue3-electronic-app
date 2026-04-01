# Electron智能客服聊天应用 - 调试指南

## 🔧 调试方法

### 1. 开发模式调试（推荐）

使用开发模式启动应用，会自动打开开发者工具：

```bash
npm run dev
```

**特点：**
- 自动打开Chrome开发者工具
- 支持实时调试和热重载
- 可以查看控制台日志和网络请求

### 2. 生产模式调试

如果应用在生产模式下出现问题，可以手动打开开发者工具：

**方法1: 快捷键**
- Windows/Linux: `Ctrl + Shift + I`
- macOS: `Cmd + Option + I`

**方法2: 菜单栏**
- 点击菜单栏的"视图" → "切换开发者工具"

### 3. 主进程调试

Electron应用有两个进程需要调试：

#### 渲染进程（前端界面）
- 使用Chrome开发者工具
- 可以调试HTML、CSS、JavaScript
- 查看网络请求和API调用

#### 主进程（Electron核心）
- 使用命令行参数启动调试：

```bash
# 启用主进程调试
npm start -- --inspect

# 或指定端口
npm start -- --inspect=9222
```

然后在Chrome浏览器中打开：`chrome://inspect`

## 🐛 常见问题调试

### 1. API调用问题

**检查网络请求：**
1. 打开开发者工具 → Network标签
2. 发送一条消息
3. 查看`localhost:3001/api/chat`请求
4. 检查请求体、响应状态和内容

**调试代码：**
```javascript
// 在renderer.js中添加调试日志
console.log('发送API请求:', {
    messages: messages,
    timestamp: new Date().toISOString()
});

const response = await fetch('http://localhost:3001/api/chat', {
    // ... 请求配置
});

console.log('API响应状态:', response.status);
console.log('API响应内容:', await response.json());
```

### 2. 界面显示问题

**检查元素样式：**
1. 右键点击问题元素 → 检查
2. 查看Computed样式面板
3. 检查CSS类是否正确应用

**调试Markdown渲染：**
```javascript
// 测试Markdown解析
const testMarkdown = "## 标题\n**粗体** 和 *斜体*\n- 列表项";
console.log('Markdown渲染结果:', this.renderMarkdown(testMarkdown));
```

### 3. 数据存储问题

**检查LocalStorage：**
1. 开发者工具 → Application → Local Storage
2. 查看`electronicChats`键的值
3. 验证数据格式是否正确

**调试存储逻辑：**
```javascript
// 添加存储调试
console.log('保存聊天记录:', Array.from(this.chats.values()));
console.log('加载聊天记录:', localStorage.getItem('electronicChats'));
```

## 📊 性能监控

### 1. 内存使用监控

在开发者工具中：
- Memory标签 → 拍摄堆快照
- Performance标签 → 记录性能

### 2. 网络请求监控

- Network标签 → 查看请求时间和大小
- 关注API响应时间

## 🔍 高级调试技巧

### 1. 远程调试

如果应用在远程服务器运行：

```bash
# 启用远程调试
npm start -- --remote-debugging-port=8315
```

然后在浏览器访问：`http://localhost:8315`

### 2. 日志文件调试

在主进程中添加文件日志：
```javascript
// 在main.js中添加
const fs = require('fs');
const path = require('path');

function logToFile(message) {
    const logPath = path.join(__dirname, 'app.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
}
```

### 3. 崩溃报告

在主进程中添加崩溃处理：
```javascript
// 在main.js中添加
app.on('renderer-process-crashed', (event, webContents, killed) => {
    console.error('渲染进程崩溃:', killed);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获异常:', error);
});
```

## 🛠️ 调试工具推荐

### 1. Chrome开发者工具
- 元素检查、网络监控、性能分析

### 2. VS Code调试器
- 配置launch.json进行断点调试

### 3. Electron DevTools扩展
- React Developer Tools
- Redux DevTools

## 📋 调试检查清单

### 启动问题
- [ ] Node.js版本是否正确
- [ ] 依赖是否完整安装
- [ ] 端口3001是否被占用
- [ ] 后端服务是否运行

### 功能问题
- [ ] API请求是否正常发送
- [ ] 响应格式是否正确解析
- [ ] 界面元素是否正常渲染
- [ ] 数据存储是否正常工作

### 性能问题
- [ ] 内存使用是否合理
- [ ] 网络请求是否高效
- [ ] 界面渲染是否流畅

## 🚨 紧急问题处理

### 应用无法启动
1. 检查控制台错误信息
2. 清理node_modules重新安装
3. 检查端口冲突

### 界面显示异常
1. 检查CSS样式是否正确加载
2. 验证JavaScript代码无语法错误
3. 检查网络资源是否可访问

### 数据丢失
1. 检查LocalStorage是否被清除
2. 验证数据序列化/反序列化
3. 检查存储容量限制

---

通过以上调试方法，您可以快速定位和解决应用中的各种问题。建议在开发过程中保持开发者工具开启，及时发现问题。