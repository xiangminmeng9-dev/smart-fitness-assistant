from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from app.core.config import settings

# Create database engine based on DB_TYPE
if os.environ.get("POSTGRES_URL"):
    # Vercel Postgres (Neon) - use pg8000 driver for serverless compatibility
    raw_url = os.environ.get("POSTGRES_URL")
    # Replace postgres:// with postgresql+pg8000://
    SQLALCHEMY_DATABASE_URL = raw_url.replace("postgres://", "postgresql+pg8000://").replace("postgresql://", "postgresql+pg8000://")
    # Remove duplicate if already postgresql+pg8000
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql+pg8000+pg8000://", "postgresql+pg8000://")
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=0,
        max_overflow=0,
        echo=settings.APP_ENV == "development"
    )
elif settings.DB_TYPE == "sqlite":
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "fitness.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.APP_ENV == "development"
    )
else:
    SQLALCHEMY_DATABASE_URL = (
        f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=settings.APP_ENV == "development"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()