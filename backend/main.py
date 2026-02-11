"""
SignifyFlow Backend
===================
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── App Initialization ──────────────────────────────────────────────────────
app = FastAPI(
    title="SignifyFlow API",
    description="Backend API for SignifyFlow — the modern e-signature platform",
    version="1.0.0",
)

# ─── CORS Middleware (allow React frontend) ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternate dev port
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "message": "SignifyFlow API is running 🚀"}


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "signifyflow-api", "version": "1.0.0"}
