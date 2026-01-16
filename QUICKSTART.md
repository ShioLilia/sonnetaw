# 🚀 Tauri 桌面应用快速入门

## ⚡ 5 分钟快速开始

### 第 1 步：安装 Rust（仅首次需要）

**Windows:**
```powershell
# 方法 1: 使用 winget
winget install --id=Rustlang.Rustup -e

# 方法 2: 手动安装
# 访问 https://rustup.rs/ 下载安装程序
```

**macOS / Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装后，**重启终端**使环境变量生效。

### 第 2 步：安装项目依赖

```bash
npm install
```

### 第 3 步：运行应用

**开发模式（推荐先试用）:**
```bash
npm run tauri:dev
```

这会打开一个窗口，你可以立即测试应用。支持热重载，修改代码会自动刷新。

**构建可执行文件:**
```bash
npm run tauri:build
```

构建完成后，在 `src-tauri/target/release/bundle/` 目录下找到可执行文件：
- Windows: `nsis/Sonnetaw_1.0.0_x64-setup.exe`
- macOS: `dmg/Sonnetaw_1.0.0_x64.dmg`
- Linux: `deb/sonnetaw_1.0.0_amd64.deb` 或 `appimage/Sonnetaw_1.0.0_amd64.AppImage`

### 🎮 使用构建向导（Windows）

双击或运行：
```powershell
.\build-tauri.ps1
```

按照提示选择操作即可。

## 📦 构建产物说明

构建完成后会生成：

| 平台 | 文件 | 大小 | 说明 |
|------|------|------|------|
| Windows | `.exe` | ~12 MB | 安装程序（推荐） |
| Windows | `.msi` | ~10 MB | MSI 安装包 |
| macOS | `.dmg` | ~15 MB | 磁盘映像 |
| macOS | `.app` | ~15 MB | 应用包 |
| Linux | `.deb` | ~15 MB | Debian 包 |
| Linux | `.AppImage` | ~20 MB | 便携版（推荐） |

## ✨ 桌面应用的优势

✅ **完全离线** - 无需网络连接  
✅ **更快启动** - 本地加载字典  
✅ **原生体验** - 真正的桌面应用  
✅ **跨平台** - Windows/macOS/Linux 通用代码  
✅ **体积小** - 只有 10-20 MB  

## 🔧 常见问题

### Q: 构建时间很长？
A: 首次构建需要下载和编译依赖，可能需要 5-10 分钟。后续构建会快很多。

### Q: Windows 提示"找不到 Rust"？
A: 安装 Rust 后需要重启终端（或重启电脑）。

### Q: macOS 无法打开应用？
A: 右键点击应用，选择"打开"，或在终端运行：
```bash
xattr -cr /Applications/Sonnetaw.app
```

### Q: Linux 缺少依赖？
A: 运行：
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev
```

## 📚 更多信息

- 详细构建指南: [TAURI_BUILD.md](TAURI_BUILD.md)
- Tauri 官方文档: https://tauri.app/
- 遇到问题？提交 Issue: https://github.com/ShioLilia/sonnetaw/issues
