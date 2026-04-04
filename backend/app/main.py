from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, user, plan, system, model_config

# 速率限制器
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

# Add a lazy DB init middleware
@app.middleware("http")
async def db_init_middleware(request: Request, call_next):
    if not hasattr(app.state, "db_initialized"):
        try:
            Base.metadata.create_all(bind=engine)
            _migrate_db()
            app.state.db_initialized = True
        except Exception as e:
            print(f"DB Init error: {e}")
    return await call_next(request)


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

# 添加速率限制中间件
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "请求过于频繁，请稍后再试"}
))

# 全局异常处理
import traceback
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_details = traceback.format_exc()
    print(error_details)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "服务器内部错误，请稍后重试",
            "debug": str(exc),
            "traceback": error_details
        }
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
app.include_router(model_config.router, prefix="/api/model-config", tags=["model-config"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development"
    )