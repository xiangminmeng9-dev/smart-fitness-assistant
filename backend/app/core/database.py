from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from app.core.config import settings

# Create database engine based on DB_TYPE
if settings.DB_TYPE == "sqlite":
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