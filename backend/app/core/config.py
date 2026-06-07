from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Fitness Assistant"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DB_TYPE: str = "sqlite"  # sqlite or mysql
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "fitness_assistant"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI Provider (system default)
    AI_PROVIDER: str = "claude"  # claude, kimi, glm, minimax, deepseek, custom
    CLAUDE_API_KEY: str = ""
    CLAUDE_BASE_URL: str = "https://api.anthropic.com"
    CLAUDE_MODEL: str = "claude-opus-4-6"

    # User-configurable defaults (set via Vercel env vars for serverless)
    # These serve as fallback when DB doesn't persist (e.g. SQLite on serverless)
    DEFAULT_AI_PROVIDER: str = ""  # Override AI_PROVIDER if set
    DEFAULT_AI_BASE_URL: str = ""  # Override base URL if set
    DEFAULT_AI_API_KEY: str = ""   # Override API key if set
    DEFAULT_AI_MODEL: str = ""     # Override model name if set

    # Weather API
    WEATHER_API_KEY: str = ""

    # WeChat Mini Program
    WECHAT_APP_ID: str = ""
    WECHAT_APP_SECRET: str = ""

    # CORS - 支持外网访问时动态配置
    CORS_ORIGINS: List[str] = ["*"]  # 生产环境建议改为具体域名

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()