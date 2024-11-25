from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """ブロックチェーンの設定"""
    WEB3_PROVIDER_URI: str = "https://127.0.0.1:8545"
    CONTRACT_ADDRESS: str | None = None
    CHAIN_ID: int = 31337 # HardhatのデフォルトチェーンID

    # API設定
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Model Registry API"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_senstive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
