from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="密码")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class TokenData(BaseModel):
    username: Optional[str] = None

# User Profile Schemas
class UserProfileBase(BaseModel):
    age: Optional[int] = Field(None, ge=10, le=100, description="年龄")
    gender: Optional[str] = Field(None, description="性别 (male/female)")
    height: Optional[float] = Field(None, ge=100, le=250, description="身高 (cm)")
    weight: Optional[float] = Field(None, ge=30, le=300, description="体重 (kg)")
    fitness_goal: Optional[str] = Field(None, description="健身目标")
    fitness_frequency: Optional[int] = Field(None, ge=1, le=7, description="每周健身频次")
    target_weight: Optional[float] = Field(None, ge=30, le=300, description="目标体重 (kg)")
    training_cycle_days: Optional[int] = Field(None, ge=7, le=180, description="训练周期 (天)")
    cycle_start_date: Optional[date] = Field(None, description="周期开始日期")
    selected_muscle_groups: Optional[List[str]] = Field(None, description="选择的肌群")
    location_lat: Optional[float] = Field(None, description="纬度")
    location_lng: Optional[float] = Field(None, description="经度")

    @validator('fitness_goal')
    def validate_fitness_goal(cls, v):
        if v and v not in ['减脂', '增肌']:
            raise ValueError('fitness_goal must be either "减脂" or "增肌"')
        return v

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True