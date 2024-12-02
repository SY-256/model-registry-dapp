import pytest
import unittest.mock as mock
from fastapi.testclient import TestClient
from model_registry_dapp.api.main import app
from model_registry_dapp.core.blockchain import BlockchainClient
from unittest.mock import AsyncMock, Mock

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_blockchain_client(monkeypatch):
    # BlockchainClientのモックインスタンスを作成
    mock_client = Mock()

    # Web3オブジェクトのモックを作成
    mock_w3 = mock.Mock()
    mock_w3.is_connected.return_value = True
    mock_client.w3 = mock_w3

    # コントラクト初期化状態のモック
    mock_client.is_contract_initialized.return_value = True

    async def mock_get_model(*args, **kwargs):
        return {
            "name": "TestModel",
            "version": "1.0.0",
            "metadata_uri": "ipfs://test",
            "owner": "0x1234567890123456789012345678901234567890",
            "timestamp": 1637000000,
            "is_active": True
        }
    
    # get_modelの戻り値を設定
    # mock_get_model = AsyncMock()
    # # サンプルモデルデータ
    # mock_get_model.return_value = {
    #     "name": "TestModel",
    #     "version": "1.0.0",
    #     "metadata_uri": "ipfs://test",
    #     "owner": "0x1234567890123456789012345678901234567890",
    #     "timestamp": 1637000000,
    #     "is_active": True
    # }

    mock_client.get_model = mock_get_model

    async def mock_register_model(*args, **kwargs):
        return {
            "model_id": "0x1234567890123456789012345678901234567890123456789012345678901234",
            "transaction_hash": "0x9876543210987654321098765432109876543210987654321098765432109876",
            "block_number": 1
        }
    
    mock_client.register_model = mock_register_model

    # # AsyncMockを使用して非同期メソッドをモック
    # mock_client.register_model = AsyncMock(return_value={
    #     "model_id": "0x1234567890123456789012345678901234567890123456789012345678901234",
    #     "transaction_hash": "0x9876543210987654321098765432109876543210987654321098765432109876",
    #     "block_number": 1
    # })

    # mock_client.get_model = AsyncMock(return_value=sample_model)

    # グローバルなblockchain_clientをモックで置き換え
    monkeypatch.setattr("model_registry_dapp.api.routes.blockchain_client", mock_client)

    return mock_client