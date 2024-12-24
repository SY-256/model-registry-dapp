import json
import logging

from web3 import Web3
from web3.contract import Contract
from eth_typing import Address
from pathlib import Path
from ..config.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class BlockchainClient:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
        self.contract: Contract | None = None
        try:
            self._load_contract()
        except Exception as e:
            logger.warning(f"Contract initialization failed: {e}")
            print(f"Warning: Contract initialization failed: {e}")
            print("Some functionality may be limited untill a contract address is provided.")

    def _load_contract(self) -> None:
        if not settings.CONTRACT_ADDRESS:
            print("Warning: CONTRACT_ADDRESS not set. Contract functionality will be limited.")
            return
        
        try:
            # コントラクトのABIを読み込む
            contract_path = Path("artifacts/contracts/ModelRegistry.sol/ModelRegistry.json")
            if not contract_path.exists():
                print("Warning: Contract artifact not found. Please compile the contract first.")
                return
        
            with open(contract_path) as f:
                contract_json = json.load(f)

            # デバッグ用ログを追加
            logger.info(f"Loading contract at address: {settings.CONTRACT_ADDRESS}")
            
            
            # コントラクトアドレスを正規化
            contract_address = Web3.to_checksum_address(settings.CONTRACT_ADDRESS)
            
            self.contract = self.w3.eth.contract(
                address=contract_address,
                abi=contract_json["abi"]
            )

            logger.info("Contract loaded successfully")
        except Exception as e:
            logger.error(f"Error loading contract: {e}")
            raise

    def _convert_initialized(self, hex_string: str) -> bytes:
        """16進数文字列をbytes32に変換"""
        # 0xプレフィックスを削除し、32バイトに調整
        clean_hex = hex_string.replace('0x', '').rjust(64, '0')
        return bytes.fromhex(clean_hex)
    
    def is_contract_initialized(self) -> bool:
        """コントラクトが初期化されているかどうかを確認"""
        return self.contract is not None
    
    async def get_model(self, model_id: str) -> dict:
        if not self.is_contract_initialized():
            raise ValueError("Contract not initialized")
        
        try:
            # 16進数文字列をbytes32に変換
            model_id_bytes = self._convert_initialized(model_id)
            model = self.contract.functions.getModel(model_id_bytes).call()
            # 基本的なモデルデータを返す（テスト用）
            return {
                "name": model[0],
                "version": model[1],
                "metadata_uri": model[2],
                "owner": model[3],
                "timestamp": model[4],
                "is_active": model[5]
            }
        except Exception as e:
            logger.error(f"Error in get_model: {str(e)}")
            raise

    async def register_model(self, name: str, version: str, metadata_uri: str, private_key: str ) -> dict:
        if not self.contract:
            raise ValueError("Contract not initialized. Please set CONTRACT_ADDRESS in .env")
        
        try:
            logger.info(f"Attempting to register model: {name} v{version}")
            account = self.w3.eth.account.from_key(private_key)

            # モデルIDを生成
            model_id = self.contract.functions.generateModelId(
                name,
                version
            ).call({'from': account.address})
            logger.info(f"Generated model ID: {model_id.hex()}")

            # トランザクションの構築
            tx = self.contract.functions.registerModel(
                name,
                version,
                metadata_uri
            ).build_transaction({
                'from': account.address,
                'gas': 300000,
                'maxFeePerGas': self.w3.eth.gas_price,
                'maxPriorityFeePerGas': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(account.address),
            })

            # トランザクションの署名と送信
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            # イベントからmodel_idを取得
            event = self.contract.events.ModelRegistered().process_receipt(receipt)[0]
            model_id = event['args']['modelId']

            # generatrateModelIdを呼び出してmodel_idを生成
            # model_id = self.contract.functions.generateModelId(name, version).call()

            # トランザクションの完了を待つ
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(f"Transaction confirmed in block {receipt['blockNumber']}")

            return {
                "model_id": model_id.hex(),
                "transaction_hash": receipt['transactionHash'].hex(),
                'block_number': receipt['blockNumber']
            }
        except Exception as e:
            logger.error(f"Error is register_model: {e}")
            raise
    
    async def get_model(self, model_id: str) -> dict:
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        try:
            # 16進数文字列をbyte32に変換
            if model_id.startswith('0x'):
                model_id = model_id[2:]
            model_id_bytes = bytes.fromhex(model_id.zfill(64))
        
            model = self.contract.functions.getModel(model_id_bytes).call()

            return {
                "name": model[0],
                "version": model[1],
                "metadata_uri": model[2],
                "owner": model[3],
                "timestamp": model[4],
                "is_active": model[5]
            }
        except Exception as e:
            logger.error(f"Error in get_model: {e}", exc_info=True)
            raise

    async def get_all_models(self) -> list:
        """すべての登録済みモデルを取得"""
        if not self.is_contract_initialized():
            raise ValueError("Contract not initialized")
        
        try:

            # 登録されているモデルの配列を取得
            registered_models = []

            # ユーザーのモデル一覧を取得
            if self.contract:
                # モデルIDの一覧を取得
                model_count = await self.contract.functions.modelCount().call()
                logger.info(f"Found {model_count} models")

            # 各モデルの情報を取得
            for i in range(model_count):
                model_id = i + 1
                try:
                    model = await self.contract.functions.getModel(model_id).call()
                    registered_models.append({
                        "name": model[0],
                        "version": model[1],
                        "metadata_uri": model[2],
                        "owner": model[3],
                        "timestamp": model[4],
                        "is_active": model[5]
                    })
                except Exception as e:
                    logger.error(f"Error getting model {model_id}: {e}")
                    continue
            return registered_models
        except Exception as e:
            logger.error(f"Error in get_all_models: {e}")
            raise
    
blockchain_client = BlockchainClient()