"""
Vercel Serverless entry point.
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app

# Create a wrapper that strips the /api prefix before passing to FastAPI
async def handler(scope, receive, send):
    if scope["type"] == "http":
        path = scope["path"]
        if path.startswith("/api"):
            # Strip the /api prefix
            new_path = path[4:]
            if not new_path:
                new_path = "/"
            scope["path"] = new_path
    return await app(scope, receive, send)

# Use the wrapper as the ASGI application
app = handler
