# 📁 项目结构说明

```
sonnetaw/
│
├── 📄 index.html                    # 主 HTML 页面
├── 📄 package.json                  # Node.js 依赖和脚本
├── 📄 tsconfig.json                 # TypeScript 配置
├── 📄 vite.config.ts                # Vite 构建配置（支持 Web 和 Tauri）
├── 📄 .gitignore                    # Git 忽略文件
│
├── 📂 src/                          # 源代码目录
│   ├── main.ts                      # 主入口（自动检测 Web/Desktop 模式）
│   ├── types.ts                     # TypeScript 类型定义
│   ├── dictionary.ts                # 字典服务（发音查询）
│   ├── textProcessor.ts             # 文本处理工具
│   ├── analyzer.ts                  # 十四行诗分析器
│   └── config.ts                    # 配置文件（GitHub URL 等）
│
├── 📂 data/                         # 数据文件（仅在开发仓库）
│   └── cmu-dict-sample.json         # CMU 发音字典（~450KB）
│
├── 📂 public/                       # 静态资源（Tauri 专用）
│   └── data/
│       └── cmu-dict-sample.json     # 桌面应用本地字典副本
│
├── 📂 src-tauri/                    # Tauri 桌面应用配置
│   ├── src/
│   │   └── main.rs                  # Rust 后端入口
│   ├── icons/                       # 应用图标
│   │   └── README.md                # 图标生成说明
│   ├── Cargo.toml                   # Rust 依赖
│   ├── tauri.conf.json              # Tauri 应用配置
│   └── build.rs                     # Rust 构建脚本
│
├── 📂 dist/                         # Web 构建输出（生成）
│   ├── index.html
│   └── assets/
│       ├── main-*.js                # 编译后的 JS (~35KB)
│       └── main-*.css               # 样式文件
│
├── 📂 .github/workflows/            # GitHub Actions
│   └── deploy.yml                   # 自动部署到 GitHub Pages
│
├── 📄 deploy-to-pages.ps1           # 手动部署脚本（Windows）
├── 📄 deploy-to-pages.sh            # 手动部署脚本（Linux/Mac）
├── 📄 build-tauri.ps1               # Tauri 构建向导（Windows）
│
├── 📄 README.md                     # 项目主说明
├── 📄 DEPLOYMENT.md                 # GitHub Pages 部署说明
├── 📄 TAURI_BUILD.md                # Tauri 详细构建指南
├── 📄 QUICKSTART.md                 # 5 分钟快速开始
└── 📄 LICENSE                       # 开源协议

🔄 生成的文件/目录（不提交到 Git）：
├── node_modules/                    # Node.js 依赖
├── dist/                            # Web 构建输出
├── src-tauri/target/                # Tauri 构建输出
│   └── release/bundle/              # 最终可执行文件
│       ├── nsis/                    # Windows 安装程序
│       ├── msi/                     # Windows MSI
│       ├── dmg/                     # macOS 磁盘映像
│       ├── deb/                     # Linux Debian 包
│       └── appimage/                # Linux AppImage
└── temp-pages-repo/                 # 部署时的临时目录
```

## 📊 代码流程

### Web 模式
```
用户访问 ShioLilia.github.io/src/sonnetaw/
    ↓
加载 index.html + main.js (~35KB)
    ↓
检测到非 Tauri 环境
    ↓
从 GitHub raw URL 加载字典 (~450KB)
    ↓
用户输入诗歌 → 分析 → 显示结果
```

### Desktop 模式
```
用户运行 Sonnetaw.exe / .app / .AppImage
    ↓
Tauri 加载本地 HTML/JS
    ↓
检测到 Tauri 环境
    ↓
从本地 public/data/ 加载字典
    ↓
用户输入诗歌 → 分析 → 显示结果（完全离线）
```

## 🎯 关键特性

### 双模式支持
同一套代码，自动适配：
- **Web**: 从 GitHub 动态加载字典（节省托管空间 90%）
- **Desktop**: 从本地加载字典（完全离线）

检测代码在 `src/main.ts`:
```typescript
const isTauri = '__TAURI__' in window;
```

### 空间优化
- 开发仓库 (`sonnetaw`): 完整源代码 + 数据文件
- 托管仓库 (`ShioLilia.github.io`): 仅构建产物 (~50KB)
- 节省 **90%** 托管空间！

## 🔄 工作流

### 开发流程
1. 修改 `src/` 中的代码
2. `npm run dev` 测试 Web 版
3. `npm run tauri:dev` 测试桌面版
4. 提交到 `sonnetaw` 仓库

### 部署 Web 版
```bash
npm run deploy
```
→ 自动构建并推送到 `ShioLilia.github.io/src/sonnetaw/`

### 发布桌面版
```bash
npm run tauri:build
```
→ 生成 Windows/macOS/Linux 安装包
→ 手动上传到 GitHub Releases

## 📝 文件说明

| 文件 | 用途 | 修改频率 |
|------|------|----------|
| `src/main.ts` | 主逻辑 | 经常 |
| `src/analyzer.ts` | 分析算法 | 偶尔 |
| `src/dictionary.ts` | 字典服务 | 很少 |
| `data/cmu-dict-sample.json` | 字典数据 | 扩展时 |
| `src-tauri/tauri.conf.json` | 应用配置 | 版本更新 |
| `vite.config.ts` | 构建配置 | 很少 |

## 🎨 自定义

### 添加新的十四行诗格式
编辑 `src/analyzer.ts` 中的 `SONNET_FORMS`

### 扩展字典
添加单词到 `data/cmu-dict-sample.json`，记得同步到 `public/data/`

### 更换应用图标
参考 `src-tauri/icons/README.md`

### 修改窗口大小
编辑 `src-tauri/tauri.conf.json` 中的 `windows` 配置
