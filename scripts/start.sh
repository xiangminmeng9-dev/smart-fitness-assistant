#!/bin/bash
# 一键启动前后端服务

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "正在停止服务..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo "服务已停止"
  exit 0
}

trap cleanup INT TERM

# 启动后端
echo "启动后端服务..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
  echo "创建 Python 虚拟环境..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi

# 杀掉占用 8000 端口的进程
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "后端已启动 (PID: $BACKEND_PID)"

# 启动前端
echo "启动前端服务..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "安装前端依赖..."
  npm install --cache /tmp/.npm-cache
fi

npx vite --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
echo "前端已启动 (PID: $FRONTEND_PID)"

echo ""
echo "================================"
echo "  服务已全部启动"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo "  按 Ctrl+C 停止所有服务"
echo "================================"
echo ""

wait
