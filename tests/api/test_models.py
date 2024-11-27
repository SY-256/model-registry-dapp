import pytest
from fastapi.testclient import TestClient
from model_registry_dapp.api.schemas import ModelCreate

def test_get_contract_status(client, mock_blockchain_client):
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    assert response.json() == {
        "contract_initialized": True,
        "web3_connected": True
    }

def test_create_model_success(client, mock_blockchain_client):
    model_data = {
        "name": "TestModel",
        "version": "1.0.0",
        "metadata_uri": "ipfs://test",
        "private_key": "0x1234567890123456789012345678901234567890123456789012345678901234"
    }

    response = client.post("/api/v1/models/", json=model_data)
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == model_data["name"]
    assert data["version"] == model_data["version"]
    assert data["metadata_uri"] == model_data["metadata_uri"]
    assert "model_id" in data
    assert "transaction_hash" in data

def test_get_model_success(client, mock_blockchain_client):
    model_id = "0x1234567890123456789012345678901234567890123456789012345678901234"
    response = client.get(f"/api/v1/models/{model_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "TestModel"
    assert data["version"] == "1.0.0"
    assert data["metadata_uri"] == "ipfs://test"
    assert data["is_active"] == True

# def test_create_model_invalid_data(client, mock_blockchain_client):
#     # 必要なフィールドが欠けているデータ
#     invalid_data = {
#         "name": "TestModel",
#         # versionが欠けている
#         "metadata_uri": "ipfs://test",
#         "private_key": "0x1234"
#     }

#     response = client.post("/api/v1/models", json=invalid_data)
#     assert response.status_code == 422 # バリデーションエラー

def test_get_nonexistent_model(client, mock_blockchain_client):
    # モックの振る舞いを変更して、存在しないモデルをシュミレート
    async def mock_get_model_error(*args, **kwargs):
        raise ValueError("Model not found")
   
    mock_blockchain_client.get_model = mock_get_model_error

    model_id = "0x1234"
    response = client.get(f"/api/v1/models/{model_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Model not found"

def test_contract_not_initialized(client, mock_blockchain_client):
    # コントラクト未初期化状態をモック
    mock_blockchain_client.is_contract_initialized.return_value = False

    response = client.post("/api/v1/models", json={
        "name": "TestModel",
        "version": "1.0.0",
        "metadata_uri": "ipfs://test",
        "private_key": "0x1234"
    })

    assert response.status_code == 503
    assert "Smart contract not initialized" in response.json()["detail"]
