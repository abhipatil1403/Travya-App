"""FastAPI application entry point for the isolated TRAVYA technical backend."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router

app = FastAPI(
    title="TRAVYA Technical Backend",
    version="0.1.0",
    description="Technical backend foundation. Risk calculations are not yet implemented.",
)
allowed_origins = [origin.strip() for origin in os.getenv("TRAVYA_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.include_router(v1_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return a minimal liveness response without exposing fabricated metrics."""
    return {"status": "ok", "service": "travya-technical-backend", "phase": "1-3"}
