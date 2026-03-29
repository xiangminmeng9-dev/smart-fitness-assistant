from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册
    """
    # Check if user already exists
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(username=user_data.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token
    access_token = create_access_token(data={"sub": db_user.username})

    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    用户登录
    """
    db_user = db.query(User).filter(User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id}