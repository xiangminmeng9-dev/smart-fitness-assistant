from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, Enum, JSON, Boolean, Date, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    fitness_plans = relationship("FitnessPlan", back_populates="user", cascade="all, delete-orphan")
    model_config = relationship("UserModelConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserModelConfig(Base):
    __tablename__ = "user_model_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    provider_type = Column(String(20), default="claude")
    base_url = Column(String(500), nullable=True)
    api_key = Column(String(500), nullable=True)
    model_name = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="model_config")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    age = Column(Integer)
    gender = Column(String(10), default='male')  # male / female
    height = Column(DECIMAL(5, 2))  # cm
    weight = Column(DECIMAL(5, 2))  # kg
    fitness_goal = Column(Enum('减脂', '增肌', name='fitness_goal_enum'), default='减脂')
    fitness_frequency = Column(Integer, default=3)  # times per week
    target_weight = Column(DECIMAL(5, 2))  # kg
    training_cycle_days = Column(Integer, default=28)
    cycle_start_date = Column(Date)
    selected_muscle_groups = Column(JSON)  # e.g. ["胸","背","肩","有氧","腹部","腿","手臂"]
    location_lat = Column(DECIMAL(10, 8))
    location_lng = Column(DECIMAL(11, 8))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")

class FitnessPlan(Base):
    __tablename__ = "fitness_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_date = Column(Date, nullable=False, index=True)  # 添加索引
    plan_data = Column(JSON, nullable=False)
    completed = Column(Boolean, default=False, index=True)  # 添加索引用于筛选
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="fitness_plans")

    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'plan_date', name='unique_user_plan'),)