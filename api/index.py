"""
Vercel Serverless entry point.
Routes all /api/* requests to the FastAPI application.
"""
from app.main import app