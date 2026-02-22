"""
SignifyFlow Backend
===================
FastAPI application entry point.
"""

import sys
import os

# Ensure backend package is importable from anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth
from routes import templates
from routes import documents
from routes import signforms
from config import settings

# ─── App Initialization ──────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME + " API",
    description="Backend API for SignifyFlow — the modern e-signature platform",
    version=settings.APP_VERSION,
)

# ─── CORS Middleware (allow React frontend) ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(documents.router)
app.include_router(signforms.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "SignifyFlow API is running 🚀"}


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "signifyflow-api", "version": settings.APP_VERSION}
