#!/bin/bash

# Smart Fitness Assistant 项目初始化脚本

set -e

echo "🚀 开始初始化智能健身助手项目..."

# 检查必要工具
command -v python3 >/dev/null 2>&1 || { echo "❌ 请安装 Python3"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ 请安装 Node.js"; exit 1; }
command -v mysql >/dev/null 2>&1 || { echo "❌ 请安装 MySQL"; exit 1; }

# 后端依赖
echo "📦 安装后端依赖..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# 前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
cd ..

echo "✅ 项目初始化完成！"
echo ""
echo "接下来步骤："
echo "1. 配置数据库：修改 backend/.env 文件中的数据库连接信息"
echo "2. 创建数据库：mysql -u root -p < database/schemas/schema.sql"
echo "3. 启动后端：cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "4. 启动前端：cd frontend && npm run dev"
echo ""
echo "详细说明请参考 README.md"