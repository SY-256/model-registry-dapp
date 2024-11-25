from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from ..config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの追加
app.include_router(router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
async def health_check():
    return {"status": "ok"}