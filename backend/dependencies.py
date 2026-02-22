"""
Shared Dependencies
===================
Reusable FastAPI dependencies and common schemas used across all route modules.
Import from here instead of duplicating auth helpers or response schemas.
"""

from typing import Optional

from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from supabase_client import get_supabase_client
from crud import auth as auth_crud


# ─── Shared Response Schemas ─────────────────────────────────────────────────

class MessageResponse(BaseModel):
    """Generic success/failure message returned by delete and logout endpoints."""
    message: str


# ─── Auth Dependencies ───────────────────────────────────────────────────────

def extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Extract the JWT from an ``Authorization: Bearer <token>`` header.

    Raises ``401 Unauthorized`` when the header is missing or malformed.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be: Bearer <token>",
        )

    return parts[1]


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency that validates the Authorization header and returns
    the authenticated user's ID.

    Usage in an endpoint::

        @router.get("/things")
        async def list_things(user_id: str = Depends(get_current_user_id)):
            ...
    """
    token = extract_bearer_token(authorization)
    supabase = get_supabase_client()

    try:
        user_response = auth_crud.get_user_by_token(supabase, token)
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return str(user_response.user.id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
