from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ModelConfigBase(BaseModel):
    provider_type: str = Field("claude", description="AI provider type")
    base_url: Optional[str] = Field(None, description="API base URL (null = use default)")
    api_key: Optional[str] = Field(None, description="API key (null = use system default)")
    model_name: Optional[str] = Field(None, description="Model name (null = use default)")

class ModelConfigCreate(ModelConfigBase):
    pass

class ModelConfigUpdate(ModelConfigBase):
    pass

class ModelConfigResponse(BaseModel):
    id: int
    user_id: int
    provider_type: str
    base_url: Optional[str]
    model_name: Optional[str]
    api_key_set: bool
    api_key_hint: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProviderInfo(BaseModel):
    type: str
    name: str
    api_format: str
    default_base_url: str
    default_model: str

class ProviderListResponse(BaseModel):
    providers: List[ProviderInfo]
    system_default: str
