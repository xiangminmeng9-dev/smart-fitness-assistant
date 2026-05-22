from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
import httpx

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册 - 限制每分钟5次
    """
    # Check if user already exists
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
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

class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    用户登录 - 限制每分钟10次
    """
    db_user = db.query(User).filter(User.username == data.username).first()
    if not db_user or not db_user.password_hash or not verify_password(data.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id}


class WeChatLoginRequest(BaseModel):
    code: str


@router.post("/wechat-login", response_model=Token)
@limiter.limit("20/minute")
async def wechat_login(request: Request, data: WeChatLoginRequest, db: Session = Depends(get_db)):
    """
    微信小程序登录 - 用code换取openid并登录/注册
    """
    if not settings.WECHAT_APP_ID or not settings.WECHAT_APP_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="微信登录未配置，请在.env中设置WECHAT_APP_ID和WECHAT_APP_SECRET",
        )

    # Exchange code for openid via WeChat API
    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": settings.WECHAT_APP_ID,
        "secret": settings.WECHAT_APP_SECRET,
        "js_code": data.code,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        wx_data = resp.json()

    if "errcode" in wx_data and wx_data["errcode"] != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"微信登录失败: {wx_data.get('errmsg', '未知错误')}",
        )

    openid = wx_data.get("openid")
    if not openid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无法获取微信openid",
        )

    # Find or create user by openid
    db_user = db.query(User).filter(User.wechat_openid == openid).first()
    if not db_user:
        # Create a new user with WeChat openid
        username = f"wx_{openid[:8]}"
        # Ensure username uniqueness
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            username = f"wx_{openid[:8]}_{datetime.now().strftime('%H%M%S')}"
        db_user = User(username=username, wechat_openid=openid, password_hash="")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id}