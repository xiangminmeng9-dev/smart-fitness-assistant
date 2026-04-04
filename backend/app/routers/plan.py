from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List, Optional
import copy
from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, FitnessPlan, UserProfile, UserModelConfig
from app.schemas.plan import FitnessPlanCreate, FitnessPlanResponse, FitnessPlanGenerate
from app.services.ai_plan_generator import generate_fitness_plan
from app.services.schedule_generator import get_today_muscle_groups

router = APIRouter()

@router.get("/", response_model=List[FitnessPlanResponse])
async def get_fitness_plans(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=100, description="返回记录数量限制"),
    offset: int = Query(0, ge=0, description="偏移量，用于分页"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户健身计划列表（支持分页）
    """
    query = db.query(FitnessPlan).filter(FitnessPlan.user_id == current_user.id)

    if start_date:
        query = query.filter(FitnessPlan.plan_date >= start_date)
    if end_date:
        query = query.filter(FitnessPlan.plan_date <= end_date)

    query = query.order_by(FitnessPlan.plan_date.desc())
    return query.offset(offset).limit(limit).all()

@router.get("/{plan_date}", response_model=FitnessPlanResponse)
async def get_fitness_plan_by_date(
    plan_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定日期的健身计划
    """
    plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.plan_date == plan_date
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Fitness plan not found for this date")
    return plan

@router.post("/generate", response_model=FitnessPlanResponse)
async def generate_new_fitness_plan(
    plan_data: FitnessPlanGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    生成新的健身计划
    """
    # Check if plan already exists for this date
    existing_plan = db.query(FitnessPlan).filter(
        FitnessPlan.user_id == current_user.id,
        FitnessPlan.plan_date == plan_data.plan_date
    ).first()

    if existing_plan:
        raise HTTPException(
            status_code=400,
            detail="Fitness plan already exists for this date"
        )

    # Get user profile for AI generation
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="User profile required to generate plan")

    # Determine today's muscle groups from schedule
    muscle_groups = get_today_muscle_groups(
        selected_muscle_groups=profile.selected_muscle_groups,
        fitness_frequency=profile.fitness_frequency or 3,
        cycle_start_date=profile.cycle_start_date,
        training_cycle_days=profile.training_cycle_days or 28,
        plan_date=plan_data.plan_date,
    )

    # Generate plan using AI
    plan_content = await generate_fitness_plan(profile, plan_data.plan_date, muscle_groups)

    # Create new plan
    new_plan = FitnessPlan(
        user_id=current_user.id,
        plan_date=plan_data.plan_date,
        plan_data=plan_content,
        completed=False
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.put("/{plan_id}/complete")
async def mark_plan_completed(
    plan_id: int,
    completed: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    标记计划为完成/未完成
    """
    plan = db.query(FitnessPlan).filter(
        FitnessPlan.id == plan_id,
        FitnessPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Fitness plan not found")

    plan.completed = completed
    db.commit()
    return {"message": "Plan updated successfully", "completed": completed}

@router.put("/{plan_id}/exercise-complete", response_model=FitnessPlanResponse)
async def toggle_exercise_complete(
    plan_id: int,
    group_index: int,
    exercise_index: int,
    completed: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    切换单个动作的完成状态
    """
    plan = db.query(FitnessPlan).filter(
        FitnessPlan.id == plan_id,
        FitnessPlan.user_id == current_user.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Fitness plan not found")

    plan_data = copy.deepcopy(plan.plan_data)
    groups = plan_data.get("workout_groups", [])
    if group_index < len(groups):
        exercises = groups[group_index].get("exercises", [])
        if exercise_index < len(exercises):
            exercises[exercise_index]["exercise_completed"] = completed

    # Check if all exercises are completed
    all_done = all(
        ex.get("exercise_completed", False)
        for g in groups
        for ex in g.get("exercises", [])
    )

    plan.plan_data = plan_data
    plan.completed = all_done
    flag_modified(plan, "plan_data")
    db.commit()
    db.refresh(plan)
    return plan