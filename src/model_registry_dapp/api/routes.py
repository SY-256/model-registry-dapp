from fastapi import APIRouter, HTTPException, Depends
from .schemas import ModelCreate, ModelResponse, ValidationCreate, ValidationResponse
from ..core.blockchain import blockchain_client
from typing import List

router = APIRouter()

@router.post("/models/", response_model=ModelResponse)
async def create_model(model: ModelCreate):
    try:
        result = await blockchain_client.register_model(
            name=model.name,
            version=model.version,
            metadata_uri=model.metadata_uri,
            private_key=model.private_key
        )

        # モデル情報を取得
        model_info = await blockchain_client.get_model(result["model_id"])

        return ModelResponse(
            model_id=result["model_id"],
            name=model_info["name"],
            version=model_info["version"],
            metadata_uri=model_info["metadata_uri"],
            owner=model_info["owner"],
            timestamp=model_info["timestamp"],
            is_active=model_info["is_active"],
            transaction_hash=result["transaction_hash"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    try:
        model_info = await blockchain_client.get_model(model_id)
        return ModelResponse(
            model_id=model_id,
            **model_id
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    