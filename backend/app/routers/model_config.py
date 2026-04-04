from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserModelConfig
from app.schemas.model_config import (
    ModelConfigResponse, ModelConfigCreate, ModelConfigUpdate,
    ProviderListResponse, ProviderInfo
)
from app.services.ai_providers import AIProviderType, get_ai_provider

router = APIRouter()

PROVIDERS = [
    ProviderInfo(
        type="claude", name="Claude / 中转站", api_format="anthropic",
        default_base_url="https://api.anthropic.com", default_model="claude-opus-4-6"
    ),
    ProviderInfo(
        type="kimi", name="Kimi (Moonshot)", api_format="openai_compatible",
        default_base_url="https://api.moonshot.cn", default_model="moonshot-v1-8k"
    ),
    ProviderInfo(
        type="glm", name="GLM (智谱清言)", api_format="openai_compatible",
        default_base_url="https://open.bigmodel.cn/api/paas", default_model="glm-4"
    ),
    ProviderInfo(
        type="minimax", name="MiniMax", api_format="openai_compatible",
        default_base_url="https://api.minimax.chat", default_model="abab6.5s-chat"
    ),
    ProviderInfo(
        type="deepseek", name="DeepSeek", api_format="openai_compatible",
        default_base_url="https://api.deepseek.com", default_model="deepseek-chat"
    ),
    ProviderInfo(
        type="custom", name="自定义 (OpenAI格式)", api_format="openai_compatible",
        default_base_url="https://api.openai.com", default_model="gpt-4o"
    )
]

def format_response(config: UserModelConfig) -> dict:
    if not config:
        return None
    res = {c.name: getattr(config, c.name) for c in config.__table__.columns if c.name != "api_key"}
    res["api_key_set"] = bool(config.api_key)
    res["api_key_hint"] = config.api_key[-4:] if config.api_key and len(config.api_key) >= 4 else None
    return res

@router.get("/providers", response_model=ProviderListResponse)
def get_providers():
    from app.core.config import settings
    return ProviderListResponse(
        providers=PROVIDERS,
        system_default=settings.AI_PROVIDER
    )

@router.get("/", response_model=ModelConfigResponse)
def get_model_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(UserModelConfig).filter(UserModelConfig.user_id == current_user.id).first()
    if not config:
        from app.core.config import settings
        from datetime import datetime
        # Return a mock default config representation
        return {
            "id": 0, "user_id": current_user.id, "provider_type": settings.AI_PROVIDER,
            "base_url": None, "model_name": None, "api_key_set": False, "api_key_hint": None,
            "created_at": datetime.now(), "updated_at": datetime.now()
        }
    return format_response(config)

@router.post("/", response_model=ModelConfigResponse)
def update_model_config(
    config_in: ModelConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(UserModelConfig).filter(UserModelConfig.user_id == current_user.id).first()
    
    update_data = config_in.dict(exclude_unset=True)
    # If api_key is empty string or pure stars (masked), don't update it
    if "api_key" in update_data:
        key_val = update_data["api_key"]
        if not key_val or key_val.startswith("sk-****"):
            del update_data["api_key"]
            if not key_val and config:  # User explicitly cleared it
                update_data["api_key"] = None

    if config:
        for k, v in update_data.items():
            setattr(config, k, v)
    else:
        config = UserModelConfig(user_id=current_user.id, **update_data)
        db.add(config)
        
    db.commit()
    db.refresh(config)
    return format_response(config)

@router.delete("/")
def delete_model_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(UserModelConfig).filter(UserModelConfig.user_id == current_user.id).first()
    if config:
        db.delete(config)
        db.commit()
    return {"status": "deleted"}

@router.post("/test")
async def test_model_config(config_in: ModelConfigCreate, current_user: User = Depends(get_current_user)):
    try:
        from app.core.config import settings
        
        provider_type = config_in.provider_type
        base_url = config_in.base_url
        api_key = config_in.api_key
        model_name = config_in.model_name
        
        # Look up defaults if not provided
        provider_info = next((p for p in PROVIDERS if p.type == provider_type), PROVIDERS[0])
        
        if not base_url:
            base_url = provider_info.default_base_url
        if not model_name:
            model_name = provider_info.default_model
            
        # If masked key provided, need to fetch from DB
        if api_key and api_key.startswith("sk-****"):
            from app.core.database import SessionLocal
            db = SessionLocal()
            try:
                db_config = db.query(UserModelConfig).filter(UserModelConfig.user_id == current_user.id).first()
                if db_config and db_config.api_key:
                    api_key = db_config.api_key
            finally:
                db.close()
                
        if not api_key:
            api_key = settings.CLAUDE_API_KEY
            if provider_type == settings.AI_PROVIDER and not api_key:
                return {"success": False, "error": "请提供 API Key"}

        provider = get_ai_provider(provider_type, base_url, api_key)
        response = await provider.generate("Respond with a single word: OK", model_name, max_tokens=10)
        
        return {"success": True, "message": response}
    except Exception as e:
        return {"success": False, "error": str(e)}
