#!/bin/bash
# 部署脚本：将构建产物推送到 ShioLilia.github.io 仓库

echo "🚀 开始部署到 GitHub Pages..."

# 1. 构建项目
echo ""
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

# 2. 克隆或更新主托管仓库
PAGES_REPO="https://github.com/ShioLilia/ShioLilia.github.io.git"
TEMP_DIR="temp-pages-repo"

if [ -d "$TEMP_DIR" ]; then
    echo ""
    echo "🔄 更新已有的托管库..."
    cd "$TEMP_DIR"
    git pull
    cd ..
else
    echo ""
    echo "📥 克隆托管库..."
    git clone "$PAGES_REPO" "$TEMP_DIR"
fi

# 3. 创建目标目录
TARGET_DIR="$TEMP_DIR/src/sonnetaw"
if [ -d "$TARGET_DIR" ]; then
    echo ""
    echo "🗑️  清理旧文件..."
    rm -rf "$TARGET_DIR"
fi
mkdir -p "$TARGET_DIR"

# 4. 复制构建产物
echo ""
echo "📋 复制构建文件到 src/sonnetaw/..."
cp -r dist/* "$TARGET_DIR/"

# 5. 提交并推送
cd "$TEMP_DIR"
git add .
COMMIT_MSG="Update sonnetaw - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

echo ""
echo "⬆️  推送到 GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo "🌐 访问地址: https://ShioLilia.github.io/src/sonnetaw/"
else
    echo ""
    echo "❌ 推送失败！"
fi

# 6. 清理
cd ..
echo ""
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

echo ""
echo "✨ 完成！"
