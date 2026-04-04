"""
Vercel Serverless entry point.
This file re-exports the FastAPI app so Vercel can serve it as a serverless function.
All /api/* routes are handled by FastAPI.
"""
import sys
import os

# Add backend directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
