"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
import os
import sys

# Vercel deploys the entire project, so backend/ is at the repo root level
# The function runs from /var/task, so we need to add backend to sys.path
_backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
if _backend_path not in sys.path:
    sys.path.insert(0, _backend_path)

# Also try common Vercel paths
for _p in ['/var/task/backend', '/var/task']:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app.main import app