"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
import os
import sys

# Calculate paths relative to this file's location
_this_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_this_dir)
_backend = os.path.join(_project_root, "backend")

# Add both project root and backend to sys.path
for _p in [_project_root, _backend]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app.main import app
