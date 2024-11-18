from fastapi import FastAPI, HTTPException, Depends
from web3 import Web3
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# FastAPIアプリケーションの初期化
app = FastAPI(title="Model Registry API")

# Web3の設定
w3 = Web3(Web3.HTTPProvider(os.getenv("WEB3_PROVIDER_URI", "http://127.0.0.1:8545")))

# コントラクタのセットアップ
def get_contract():
    contract_address = os.getenv("CONTRACT_ADDRESS")
    if not contract_address:
        raise HTTPException(status_code=500, detail="Contract address not configured")
    
    with open("artifacts/contracts/ModelRegistry.sol/ModelRegistry.json") as f:
        contract_json = json.load()

    return w3.eth.contract(address=contract_address, abi=contract_json["abi"])

# データモデル
class ModelBase(BaseModel):
    name: str
    version: str
    metadata_uri: str

class ValidationBase(BaseModel):
    is_valid: bool
    comments: str

class ModelResponse(ModelBase):
    model_id: str
    owner: str
    timestamp: datetime
    is_active: bool

class ValidationResponse(BaseModel):
    validator: str
    timestamp: datetime
    is_valid: bool
    comments: str

# APIエンドポイント
@app.post("/models/", response_model=ModelResponse)
async def registor_model(model: ModelBase, private_key: str):
    """新しいモデルを登録する"""
    try:
        contract = get_contract()
        account = w3.eth.account.from_key(private_key)

        # トランザクションの構築と送信
        tx = contract.functions.registerModel(
            model.name,
            model.version,
            model.metadata_uri
        ).build_transaction({
            'from': account.address,
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(account.address),
        })

        # トランザクションの署名と送信
        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # モデルIDの取得とモデル情報の取得
        model_id = receipt['logs'][0]['topics'][1].hex()
        model_data = contract.functions.getModel(model_id).call()

        return ModelResponse(
            model_id=model_id,
            name=model_data[0],
            version=model_data[1],
            metadata_uri=model_data[2],
            owner=model_data[3],
            timestamp=datetime.fromtimestamp(model_data[4]),
            is_active=model_data[5],
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    """モデル情報を取得する"""
    try:
        contract = get_contract()
        model = contract.functions.getModel(model_id).call()

        return ModelResponse(
            model_id=model_id,
            name=model[0],
            version=model[1],
            metadata_uri=model[2],
            owner=model[3],
            timestamp=datetime.fromtimestamp(model[4]),
            is_active=model[5],
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Model not found")
    
@app.post("/models/{model_id}/validation")
async def validate_model(model_id: str, validation: ValidationBase, private_key: str):
    """モデルを検証する"""
    try:
        contract = get_contract()
        account = w3.eth.account.from_key(private_key)

        tx = contract.functions.validationModel(
            model_id,
            validation.is_valid,
            validation.comments
        ).build_transaction({
            'from': account.address,
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(account.address),
        })

        singned_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(singned_tx.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "status": "success",
            "transaction_hash": receipt['transactionHash'].hex(),
            "model_id": model_id 
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.get("/models/{model_id}/validations", response_class=List[ValidationResponse])
async def get_model_validations(model_id: str):
    """モデルの検証履歴を取得する"""
    try:
        contract = get_contract()
        validations = contract.functions.getModelValidations(model_id).call()

        return [
            ValidationResponse(
                validator=v[0],
                timestamp=datetime.fromtimestamp(v[1]),
                is_valid=v[2],
                comments=v[3]
            )
            for v in validations
        ]
    except Exception as e:
        raise HTTPException(status_code=404, detail="Validations not found")