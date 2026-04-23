"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
import sys
import os

# Add backend directory to Python path so 'app' module can be found
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))

from app.main import app