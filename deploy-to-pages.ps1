# 部署脚本：将构建产物推送到 ShioLilia.github.io 仓库

Write-Host "🚀 开始部署到 GitHub Pages..." -ForegroundColor Cyan

# 1. 构建项目
Write-Host "`n📦 构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    exit 1
}

# 2. 克隆或更新主托管仓库
$pagesRepo = "https://github.com/ShioLilia/ShioLilia.github.io.git"
$tempDir = "temp-pages-repo"

if (Test-Path $tempDir) {
    Write-Host "`n🔄 更新已有的托管库..." -ForegroundColor Yellow
    Set-Location $tempDir
    git pull
    Set-Location ..
} else {
    Write-Host "`n📥 克隆托管库..." -ForegroundColor Yellow
    git clone $pagesRepo $tempDir
}

# 3. 创建目标目录
$targetDir = "$tempDir/src/sonnetaw"
if (Test-Path $targetDir) {
    Write-Host "`n🗑️  清理旧文件..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $targetDir
}
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

# 4. 复制构建产物
Write-Host "`n📋 复制构建文件到 src/sonnetaw/..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "dist/*" $targetDir

# 5. 提交并推送
Set-Location $tempDir
git add .
$commitMsg = "Update sonnetaw - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMsg

Write-Host "`n⬆️  推送到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 部署成功！" -ForegroundColor Green
    Write-Host "🌐 访问地址: https://ShioLilia.github.io/src/sonnetaw/" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 推送失败！" -ForegroundColor Red
}

# 6. 清理
Set-Location ..
Write-Host "`n🧹 清理临时文件..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempDir

Write-Host "`n✨ 完成！" -ForegroundColor Green
