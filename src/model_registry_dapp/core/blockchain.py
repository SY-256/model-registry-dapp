import json

from web3 import Web3
from web3.contract import Contract
from eth_typing import Address
from pathlib import Path
from ..config.settings import get_settings

settings = get_settings()

class BlockchainClient:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
        self.contract: Contract | None = None
        try:
            self._load_contract()
        except Exception as e:
            print(f"Warning: Contract initialization failed: {e}")
            print("Some functionality may be limited untill a contract address is provided.")

    def _load_contract(self) -> None:
        if not settings.CONTRACT_ADDRESS:
            print("Warning: CONTRACT_ADDRESS not set. Contract functionality will be limited.")
            return
        
        # コントラクトのABIを読み込む
        contract_path = Path("artifacts/contracts/ModelRegistry.sol/ModelRegistry.json")
        if not contract_path.exists():
            print("Warning: Contract artifact not found. Please compile the contract first.")
            return
        
        with open(contract_path) as f:
            contract_json = json.load(f)

        self.contract = self.w3.eth.contract(
            address=settings.CONTRACT_ADDRESS,
            abi=contract_json["abi"]
        )
    
    def is_contract_initialized(self) -> bool:
        """コントラクトが初期化されているかどうかを確認"""
        return self.contract is not None

    async def register_model(self, name: str, version: str, metadata_uri: str, private_key: str ) -> dict:
        if not self.contract:
            raise ValueError("Contract not initialized. Please set CONTRACT_ADDRESS in .env")
        
        account = self.w3.eth.account.from_key(private_key)

        # トランザクションの構築
        tx = self.contract.functions.registerModel(
            name,
            version,
            metadata_uri
        ).build_transaction({
            'from': account.address,
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_trabsaction_count(account.address),
        })

        # トランザクションの署名と送信
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        # イベントおからmodel_idを取得
        model_id = receipt['logs'][0]['topics'][1].hex()

        return {
            "model_id": model_id,
            "transaction_hash": receipt['transactionHash'].hex(),
            'block_number': receipt['blockNumber']
        }
    
    async def get_model(self, model_id: str) -> dict:
        if not self.contract:
            raise ValueError("Contract not initialized")
        
        model = self.contract.functions.getModel(model_id).call()

        return {
            "name": model[0],
            "version": model[1],
            "metadata_url": model[2],
            "owner": model[3],
            "timestamp": model[4],
            "is_active": model[5]
        }
    
blockchain_client = BlockchainClient()