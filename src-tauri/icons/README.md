# 应用图标说明

请在 `src-tauri/icons/` 目录下放置以下图标文件：

- `32x32.png` - 32x32 像素 PNG 图标
- `128x128.png` - 128x128 像素 PNG 图标  
- `128x128@2x.png` - 256x256 像素 PNG 图标（高分辨率）
- `icon.icns` - macOS 应用图标
- `icon.ico` - Windows 应用图标

## 快速生成图标

你可以使用在线工具或命令行工具从单个 PNG 图片生成所有格式：

### 方法 1: 使用在线工具
- https://icon.kitchen/
- 上传一张 1024x1024 的 PNG 图片
- 下载生成的图标包

### 方法 2: 使用 Tauri CLI（需要先有一张 PNG）
```bash
npm install -g @tauri-apps/cli
tauri icon path/to/your-icon.png
```

## 临时方案

如果暂时没有图标，Tauri 会使用默认图标。应用仍可正常构建和运行。
