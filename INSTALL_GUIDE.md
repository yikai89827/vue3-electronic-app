# 智能客服聊天应用 - 安装指南

## 问题解决方案

如果您遇到 "Electron failed to install correctly" 错误，请按照以下步骤解决：

### 方法1: 使用启动脚本（推荐）

1. 双击运行 `start.bat` 文件
2. 脚本会自动检查并安装依赖
3. 如果安装失败，会提供详细的错误信息和解决方案

### 方法2: 手动安装步骤

1. **清理残留文件**（如果之前安装失败）:
   ```bash
   # 在PowerShell中运行
   Remove-Item -Recurse -Force node_modules,package-lock.json -ErrorAction SilentlyContinue
   ```

2. **使用淘宝镜像安装**:
   ```bash
   npm install --registry=https://registry.npmmirror.com
   ```

3. **如果仍然失败，尝试分步安装**:
   ```bash
   # 先安装其他依赖
   npm install electron-builder@23.0.0 --save-dev --registry=https://registry.npmmirror.com
   
   # 再安装Electron
   npm install electron@21.0.0 --save --registry=https://registry.npmmirror.com
   ```

### 方法3: 网络问题解决方案

如果遇到网络连接问题：

1. **检查网络连接**
   - 确保可以访问 npm  registry
   - 尝试使用VPN或代理

2. **使用离线安装**
   - 在有网络的环境下载依赖包
   - 复制到当前项目目录

3. **联系网络管理员**
   - 检查防火墙设置
   - 确保没有网络限制

## 测试应用功能

在安装依赖之前，您可以先测试应用的基本功能：

1. 打开 `test.html` 文件
2. 点击"检查文件完整性"按钮
3. 点击"测试API连接"按钮
4. 点击"打开聊天界面"预览应用

## 应用启动

安装成功后，运行以下命令启动应用：

```bash
npm start
```

或使用开发模式（带开发者工具）：

```bash
npm run dev
```

## 故障排除

### 常见错误及解决方案

1. **EBUSY错误（文件被锁定）**
   ```bash
   # 关闭所有Node.js进程
   Stop-Process -Name node -Force -ErrorAction SilentlyContinue
   # 重新清理并安装
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. **网络超时错误**
   - 增加npm超时时间：`npm install --timeout=600000`
   - 使用国内镜像源
   - 检查代理设置

3. **权限错误**
   - 以管理员身份运行命令行
   - 检查文件权限设置

## 技术支持

如果以上方法都无法解决问题，请提供：

1. 完整的错误日志
2. 操作系统版本信息
3. Node.js和npm版本信息
4. 网络环境描述

## 备选方案

如果Electron安装持续失败，可以考虑：

1. 使用Web版本（修改为浏览器运行）
2. 使用其他桌面应用框架（如Tauri）
3. 使用预构建的Electron应用包