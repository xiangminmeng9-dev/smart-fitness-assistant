"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# FastAPI routes are already prefixed with /api (e.g. /api/auth, /api/plan)
# Vercel rewrites /api/* to this file, preserving the full path
# So no path stripping is needed
from app.main import app
