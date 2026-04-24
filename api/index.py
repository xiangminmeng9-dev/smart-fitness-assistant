"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
import os
import sys

# Add project root and backend to Python path
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _p in [_root, os.path.join(_root, 'backend')]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app.main import app