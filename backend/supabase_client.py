"""
Supabase Client Configuration
=============================
Initializes and exports the Supabase client for use across the backend.
Uses the service-role key (bypasses RLS) for server-side operations,
falling back to the anon key if the service-role key is not configured.
"""

from supabase import create_client, Client
from config import settings

# ─── Initialize Supabase Client ──────────────────────────────────────────────
# The backend is a trusted server — it should use the service-role key to
# bypass Row Level Security.  All authorisation checks are done in Python
# (token validation, ownership checks, email matching, etc.).
_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

if not settings.SUPABASE_SERVICE_ROLE_KEY:
    import warnings
    warnings.warn(
        "SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon key. "
        "Some database operations may fail due to Row Level Security policies. "
        "Set SUPABASE_SERVICE_ROLE_KEY in backend/.env to fix this.",
        stacklevel=2,
    )

supabase: Client = create_client(settings.SUPABASE_URL, _key)


def get_supabase_client() -> Client:
    """Returns the initialized Supabase client instance (service-role, bypasses RLS)."""
    return supabase


def get_auth_client() -> Client:
    """
    Create a *disposable* Supabase client for auth operations
    (sign_in, sign_up, sign_out).  These methods mutate the client's
    internal session, which would switch the shared service-role client
    to a user JWT and break RLS bypass for all subsequent DB calls.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
