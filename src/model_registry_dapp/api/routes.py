import logging

from fastapi import APIRouter, HTTPException, Depends
from .schemas import ModelCreate, ModelResponse, ValidationCreate, ValidationResponse
from ..core.blockchain import blockchain_client
from typing import List

logger = logging.getLogger(__name__)
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
        logger.error(f"Value error in create_model: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create_model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    """モデル情報を取得"""
    try:
        logger.debug(f"Received request for model_id: {model_id}")

        if not blockchain_client.is_contract_initialized():
            logger.warning("Contract not initialized")
            raise HTTPException(
                status_code=503,
                detail="Smart contract not initialized. Please set CONTRACT_ADDRESS in environment variables."
            )
    
        model_info = await blockchain_client.get_model(model_id)
        logger.debug(f"Retrieved model info: {model_info}")

        return ModelResponse(
            model_id=model_id,
            name=model_info["name"],
            version=model_info["version"],
            metadata_uri=model_info["metadata_uri"],
            owner=model_info["owner"],
            timestamp=model_info["timestamp"],
            is_active=model_info["is_active"]
        )
    
    except ValueError as e:
        logger.error(f"Value error in get_model: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_model: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/models/", response_model=List[ModelResponse])
async def get_models():
    """すべての登録済みモデルを取得"""
    try:
        logging.info("Fetching all models")
        if not blockchain_client.is_contract_initialized():
            logger.error("Contract not initialized")
            raise HTTPException(
                status_code=503,
                detail="Smart contract not initialized"
            )
        try:
            models = await blockchain_client.get_all_models()
            logger.info(f"Found {len(models)} models")
            return models
        except ValueError as e:
            logger.error(f"Value error: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_models: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    