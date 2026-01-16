# 一键构建脚本 - Windows / Linux / macOS

Write-Host "🚀 Sonnetaw 桌面应用构建工具" -ForegroundColor Cyan
Write-Host ""

# 检查 Rust 是否安装
Write-Host "📋 检查环境..." -ForegroundColor Yellow
$rustInstalled = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $rustInstalled) {
    Write-Host "❌ 未检测到 Rust。请先安装 Rust:" -ForegroundColor Red
    Write-Host "   访问 https://rustup.rs/ 或运行:" -ForegroundColor Yellow
    Write-Host "   winget install --id=Rustlang.Rustup -e" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Rust 已安装" -ForegroundColor Green

# 检查 Node.js
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "❌ 未检测到 Node.js。请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js 已安装" -ForegroundColor Green

Write-Host ""
Write-Host "请选择操作:" -ForegroundColor Cyan
Write-Host "1. 开发模式（带热重载）"
Write-Host "2. 构建生产版本（所有格式）"
Write-Host "3. 仅构建 Windows .exe"
Write-Host "4. 仅构建 Windows .msi"
Write-Host "5. 退出"
Write-Host ""

$choice = Read-Host "请输入选项 (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n🔧 启动开发模式..." -ForegroundColor Yellow
        npm install
        npm run tauri:dev
    }
    "2" {
        Write-Host "`n📦 构建生产版本..." -ForegroundColor Yellow
        npm install
        npm run tauri:build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ 构建成功！" -ForegroundColor Green
            Write-Host "📁 构建产物位于: src-tauri\target\release\bundle\" -ForegroundColor Cyan
            
            # 打开输出目录
            $bundlePath = "src-tauri\target\release\bundle"
            if (Test-Path $bundlePath) {
                explorer $bundlePath
            }
        } else {
            Write-Host "`n❌ 构建失败！" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "`n📦 构建 Windows .exe..." -ForegroundColor Yellow
        npm install
        npm run tauri build -- --bundles exe
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ 构建成功！" -ForegroundColor Green
            explorer "src-tauri\target\release\bundle\nsis"
        }
    }
    "4" {
        Write-Host "`n📦 构建 Windows .msi..." -ForegroundColor Yellow
        npm install
        npm run tauri build -- --bundles msi
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ 构建成功！" -ForegroundColor Green
            explorer "src-tauri\target\release\bundle\msi"
        }
    }
    "5" {
        Write-Host "`n👋 再见！" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "`n❌ 无效选项！" -ForegroundColor Red
        exit 1
    }
}
