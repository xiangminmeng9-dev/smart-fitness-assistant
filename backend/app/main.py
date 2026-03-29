from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, user, plan, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    # Migrate: add new columns if they don't exist (SQLite doesn't support IF NOT EXISTS for columns)
    _migrate_db()
    yield
    # Shutdown
    print("Shutting down...")


def _migrate_db():
    """Add new columns to existing tables for backwards compatibility."""
    new_columns = [
        ("user_profiles", "gender", "VARCHAR(10) DEFAULT 'male'"),
        ("user_profiles", "target_weight", "DECIMAL(5,2)"),
        ("user_profiles", "training_cycle_weeks", "INTEGER DEFAULT 4"),
        ("user_profiles", "training_cycle_days", "INTEGER DEFAULT 28"),
        ("user_profiles", "cycle_start_date", "DATE"),
        ("user_profiles", "selected_muscle_groups", "JSON"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"  Added column {table}.{col}")
            except Exception:
                pass  # Column already exists

app = FastAPI(
    title="Smart Fitness Assistant API",
    description="AI-powered personalized fitness plan generator",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Smart Fitness Assistant API", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(plan.router, prefix="/api/plan", tags=["plan"])
app.include_router(system.router, prefix="/api/system", tags=["system"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development"
    )