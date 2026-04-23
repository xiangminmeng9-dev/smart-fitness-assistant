from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import date, datetime

class FitnessPlanBase(BaseModel):
    plan_date: date = Field(..., description="计划日期")
    plan_data: Dict[str, Any] = Field(..., description="计划内容 (JSON)")

class FitnessPlanCreate(FitnessPlanBase):
    pass

class FitnessPlanGenerate(BaseModel):
    plan_date: date = Field(..., description="计划日期")

class FitnessPlanUpdate(BaseModel):
    completed: Optional[bool] = None
    plan_data: Optional[Dict[str, Any]] = None

class FitnessPlanResponse(FitnessPlanBase):
    id: int
    user_id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# AI Plan Structure
class WorkoutExercise(BaseModel):
    name: str
    sets: int
    reps: str
    rest_seconds: int
    weight_suggestion: Optional[str] = None
    calories_burned: int
    notes: Optional[str] = None

class WorkoutGroup(BaseModel):
    muscle_group: str
    exercises: list[WorkoutExercise]

class MealOption(BaseModel):
    name: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    ingredients: Optional[list[str]] = None
    recipe_brief: Optional[str] = None
    platform: Optional[str] = None
    store_suggestion: Optional[str] = None
    restaurant_type: Optional[str] = None

class MealPlan(BaseModel):
    meal_type: str
    time: str
    self_cook: MealOption
    takeout: MealOption
    eat_out: MealOption

class DailyPlan(BaseModel):
    motivation_quote: str
    weather_impact: str
    training_split: str
    split_day: str
    warmup: list[str]
    workout_groups: list[WorkoutGroup]
    cooldown: list[str]
    meal_plan: list[MealPlan]
    total_calories_burned: int
    total_calories_intake: int
    recommendations: list[str]
