"""
SignifyFlow Backend Configuration
=================================
Single source of truth for every environment-driven value the backend needs.

HOW IT WORKS
────────────
1.  .env file  →  python-dotenv loads it into os.environ
2.  config.py  →  reads os.environ with HARDCODED FALLBACKS
3.  App code   →  `from config import settings`  (never touches os.getenv)

Every variable has a sensible default so the app boots even without an .env.
"""

import os
from dotenv import load_dotenv

# Load .env file into os.environ (no-op if file is missing)
load_dotenv()


class Settings:
    """All backend-wide configuration lives here."""

    # ── App ───────────────────────────────────────────────────────────────────

    # Display name used in API docs title
    APP_NAME: str = os.getenv("APP_NAME", "SignifyFlow")

    # Semantic version of the backend
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")

    # Enable verbose error output (never True in production!)
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # ── Server ────────────────────────────────────────────────────────────────

    # Network interface uvicorn binds to (0.0.0.0 = all)
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")

    # Port uvicorn listens on
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8081"))

    # Full base URL of this backend (used for generating links)
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8081")

    # ── Frontend / CORS ───────────────────────────────────────────────────────

    # URL of the React frontend (used in CORS allow-origin)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8080")

    # Comma-separated origins allowed by CORS middleware
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:8080,http://localhost:8081,http://localhost:5173,http://localhost:3000",
    ).split(",")

    # ── Supabase ──────────────────────────────────────────────────────────────

    # Project URL – found at Supabase → Settings → API → Project URL
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")

    # Anon (public) key – used for disposable auth clients (login/signup)
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

    # Service-role key – BYPASSES RLS; used for all DB ops from the server
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # ── JWT / Auth ────────────────────────────────────────────────────────────

    # Supabase JWT secret (Settings → API → JWT Secret) – for local token decode
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")

    # Access token lifetime in minutes (Supabase default = 60)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── File Upload ───────────────────────────────────────────────────────────

    # Max upload file size in megabytes
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))

    # Comma-separated allowed file extensions
    ALLOWED_FILE_TYPES: list[str] = os.getenv(
        "ALLOWED_FILE_TYPES", "pdf,doc,docx,txt,png,jpg,jpeg"
    ).split(",")


# Singleton instance – import this everywhere
settings = Settings()
