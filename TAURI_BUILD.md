# Tauri 桌面应用构建指南

## 🖥️ 支持的平台

- ✅ Windows (.exe, .msi)
- ✅ macOS (.dmg, .app)
- ✅ Linux (.deb, .AppImage)

## 📋 前置要求

### 所有平台通用
- Node.js (v18+)
- Rust (通过 rustup 安装)

### Windows
```powershell
# 安装 Rust
winget install --id=Rustlang.Rustup -e

# 或访问 https://rustup.rs/
```

### macOS
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Xcode Command Line Tools
xcode-select --install
```

### Linux (Ubuntu/Debian)
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装依赖
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式（热重载）
```bash
npm run tauri:dev
```

### 3. 构建生产版本
```bash
# Windows: 生成 .exe 和 .msi
npm run tauri:build

# macOS: 生成 .app 和 .dmg
npm run tauri:build

# Linux: 生成 .deb 和 .AppImage
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/`

## 📦 构建特定格式

```bash
# 仅构建 exe (Windows)
npm run tauri build -- --bundles exe

# 仅构建 msi (Windows)
npm run tauri build -- --bundles msi

# 仅构建 dmg (macOS)
npm run tauri build -- --bundles dmg

# 仅构建 deb (Linux)
npm run tauri build -- --bundles deb

# 仅构建 AppImage (Linux)
npm run tauri build -- --bundles appimage
```

## 🔧 配置说明

### 应用信息
在 `src-tauri/tauri.conf.json` 中配置：
- `productName`: 应用名称
- `version`: 版本号
- `identifier`: 应用唯一标识符

### 窗口设置
- 默认大小: 1200x800
- 最小大小: 800x600
- 居中显示
- 可调整大小

### 离线模式
桌面应用会自动从本地加载字典文件，无需网络连接。

## 📁 项目结构

```
sonnetaw/
├── src/              # 前端代码 (TypeScript/HTML/CSS)
├── public/           # 静态资源（含字典文件）
├── src-tauri/        # Tauri 后端
│   ├── src/          # Rust 代码
│   ├── icons/        # 应用图标
│   ├── Cargo.toml    # Rust 依赖
│   └── tauri.conf.json  # Tauri 配置
└── dist/             # 构建输出
```

## 🎯 发布流程

1. **更新版本号**
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`

2. **测试**
   ```bash
   npm run tauri:dev
   ```

3. **构建**
   ```bash
   npm run tauri:build
   ```

4. **分发**
   - Windows: 分享 `.exe` 或 `.msi` 安装包
   - macOS: 分享 `.dmg` 磁盘映像
   - Linux: 分享 `.deb` 或 `.AppImage`

## ⚠️ 常见问题

### Windows: 缺少 WebView2
Tauri 需要 WebView2。如果用户没有，安装包会自动下载。

### macOS: 应用无法打开（未签名）
```bash
# 允许运行未签名的应用
xattr -cr /path/to/Sonnetaw.app
```

### Linux: 缺少依赖
确保安装了所有必需的系统库（见上面的前置要求）。

## 🔐 代码签名（可选）

### Windows
需要代码签名证书，在 `tauri.conf.json` 中配置。

### macOS
```bash
# 需要 Apple Developer 账户
codesign --sign "Developer ID" Sonnetaw.app
```

## 📊 构建产物大小

- Windows (.exe): ~10-15 MB
- macOS (.app): ~15-20 MB
- Linux (.AppImage): ~20-25 MB

## 🌐 Web vs Desktop

同一套代码支持两种模式：

- **Web**: 从 GitHub 加载字典（节省托管空间）
- **Desktop**: 从本地加载字典（完全离线）

代码会自动检测运行环境并选择合适的加载方式。

## 📚 更多信息

- [Tauri 官方文档](https://tauri.app/)
- [Tauri Discord 社区](https://discord.com/invite/tauri)
