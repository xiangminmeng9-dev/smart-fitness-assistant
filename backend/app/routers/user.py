from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserProfile
from app.schemas.user import UserProfileCreate, UserProfileUpdate, UserProfileResponse

router = APIRouter()

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户资料
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@router.post("/profile", response_model=UserProfileResponse)
async def create_or_update_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建或更新用户资料
    """
    # Check if profile exists
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if profile:
        # Update existing profile
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
        # Create new profile
        profile = UserProfile(**profile_data.dict(), user_id=current_user.id)
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新用户资料
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile