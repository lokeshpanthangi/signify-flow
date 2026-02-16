"""
Auth Routes
===========
API endpoints for user authentication: signup, login, logout, profile.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from supabase_client import get_supabase_client
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


class AuthResponse(BaseModel):
    id: str
    email: str
    name: str
    access_token: str
    message: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


class MessageResponse(BaseModel):
    message: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Register a new user with email and password.
    """
    supabase = get_supabase_client()
    
    try:
        auth_response = auth_crud.signup_user(
            supabase=supabase,
            email=request.email,
            password=request.password,
            full_name=request.name
        )
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Get access token (may be empty if email confirmation required)
        access_token = ""
        if auth_response.session:
            access_token = auth_response.session.access_token
        
        return AuthResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            name=request.name,
            access_token=access_token,
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
    supabase = get_supabase_client()
    
    try:
        auth_response = auth_crud.login_user(
            supabase=supabase,
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
        if auth_response.session:
            access_token = auth_response.session.access_token
        
        return AuthResponse(
            id=auth_response.user.id,
            email=auth_response.user.email,
            name=full_name,
            access_token=access_token,
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


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Sign out the current user.
    """
    supabase = get_supabase_client()
    
    try:
        auth_crud.logout_user(supabase)
        return MessageResponse(message="Logged out successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(access_token: str):
    """
    Get the current authenticated user's info.
    Pass access_token as query param.
    """
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
