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

    # Claude API
    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-opus-4-6"

    # Weather API
    WEATHER_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()