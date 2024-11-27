from fastapi import APIRouter, HTTPException, Depends
from .schemas import ModelCreate, ModelResponse, ValidationCreate, ValidationResponse
from ..core.blockchain import blockchain_client
from typing import List

router = APIRouter()

@router.get("/status")
async def get_contract_status():
    """スマートコントラクトとweb3の接続状況を確認"""
    return {
        "contract_initialized": blockchain_client.is_contract_initialized(),
        "web3_connected": blockchain_client.w3.is_connected()
    }

@router.post("/models/", response_model=ModelResponse)
async def create_model(model: ModelCreate):
    """新しいモデルを登録"""
    if not blockchain_client.is_contract_initialized():
        raise HTTPException(
            status_code=503,
            detail="Smart contract not initialized. Please set CONTRACT_ADDRESS in environment variables."
        )
    
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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    """モデル情報を取得"""
    if not blockchain_client.is_contract_initialized():
        raise HTTPException(
            status_code=503,
            detail="Smart contract not initialized. Please set CONTRACT_ADDRESS in environment variables."
        )
    
    try:
        model_info = await blockchain_client.get_model(model_id)
        return ModelResponse(
            model_id=model_id,
            **model_id
        )
    except ValueError as e:
        if "Model not found" in str(e):
            raise HTTPException(status_code=404, detail="Model not found")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    