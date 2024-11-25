from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ModelBase(BaseModel):
    name: str
    version: str
    metadata_uri: str

class ModelCreate(ModelBase):
    private_key: str

class ModelResponse(ModelBase):
    model_id: str
    owner: str
    timestamp: int
    is_active: bool
    transaction_hash: Optional[str] = None

class ValidationCreate(BaseModel):
    is_valid: bool
    comments: str
    private_key: str

class ValidationResponse(BaseModel):
    validation: str
    timestamp: datetime
    is_valid: bool
    comments: str