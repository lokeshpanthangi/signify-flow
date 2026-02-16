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

# ─── App Initialization ──────────────────────────────────────────────────────
app = FastAPI(
    title="SignifyFlow API",
    description="Backend API for SignifyFlow — the modern e-signature platform",
    version="1.0.0",
)

# ─── CORS Middleware (allow React frontend) ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL(s) here    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(templates.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "SignifyFlow API is running 🚀"}


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "signifyflow-api", "version": "1.0.0"}
