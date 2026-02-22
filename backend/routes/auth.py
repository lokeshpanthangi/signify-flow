"""
Auth Routes
===========
API endpoints for user authentication: signup, login, logout, refresh, profile.
"""

from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from typing import Optional

from supabase_client import get_supabase_client, get_auth_client
from crud import auth as auth_crud

router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Request/Response Schemas ─────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    id: str
    email: str
    name: str
    access_token: str
    refresh_token: str
    message: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


class MessageResponse(BaseModel):
    message: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _extract_bearer_token(authorization: Optional[str]) -> str:
    """Extract the token from an 'Authorization: Bearer <token>' header."""
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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Register a new user with email and password.
    """
    auth_client = get_auth_client()
    
    try:
        auth_response = auth_crud.signup_user(
            auth_client=auth_client,
            email=request.email,
            password=request.password,
            full_name=request.name
        )
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Get tokens (may be empty if email confirmation required)
        access_token = ""
        refresh_token = ""
        if auth_response.session:
            access_token = auth_response.session.access_token
            refresh_token = auth_response.session.refresh_token or ""
        
        return AuthResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            name=request.name,
            access_token=access_token,
            refresh_token=refresh_token,
            message="Account created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "User already registered" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {error_msg}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email and password.
    """
    auth_client = get_auth_client()
    
    try:
        auth_response = auth_crud.login_user(
            auth_client=auth_client,
            email=request.email,
            password=request.password
        )
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get full_name from user metadata
        full_name = auth_response.user.user_metadata.get("full_name", request.email)
        
        access_token = ""
        refresh_token = ""
        if auth_response.session:
            access_token = auth_response.session.access_token
            refresh_token = auth_response.session.refresh_token or ""
        
        return AuthResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            name=full_name,
            access_token=access_token,
            refresh_token=refresh_token,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {error_msg}"
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest):
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    Called automatically by the frontend before the access token expires.
    """
    auth_client = get_auth_client()

    try:
        # Set the session on the disposable auth client so it can refresh
        auth_client.auth._refresh_token = request.refresh_token
        response = auth_client.auth.refresh_session(request.refresh_token)

        if response.user is None or response.session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or expired. Please log in again.",
            )

        full_name = response.user.user_metadata.get("full_name", response.user.email)

        return AuthResponse(
            id=response.user.id,
            email=response.user.email,
            name=full_name,
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token or request.refresh_token,
            message="Token refreshed successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Sign out the current user.
    """
    auth_client = get_auth_client()
    
    try:
        auth_crud.logout_user(auth_client)
        return MessageResponse(message="Logged out successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get the current authenticated user's info.
    Reads the JWT from the Authorization: Bearer <token> header.
    """
    access_token = _extract_bearer_token(authorization)
    supabase = get_supabase_client()
    
    try:
        user_response = auth_crud.get_user_by_token(supabase, access_token)
        
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        full_name = user_response.user.user_metadata.get("full_name", user_response.user.email)
        
        return UserResponse(
            id=user_response.user.id,
            email=user_response.user.email,
            name=full_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
