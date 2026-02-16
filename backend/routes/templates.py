"""
Templates Routes
================
API endpoints for template CRUD: create, list, get, update, delete.
All endpoints require an access_token to identify the owner.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field

from supabase_client import get_supabase_client
from crud import auth as auth_crud
from crud import templates as templates_crud

router = APIRouter(prefix="/templates", tags=["templates"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    category: str = Field("General", min_length=1, max_length=100)
    content: str = Field(..., description="HTML content of the template")
    fields_config: Optional[dict] = Field(None, description="JSON with recipients[] and fields[] for signature placement")


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    fields_config: Optional[dict] = None


class TemplateOut(BaseModel):
    id: str
    owner_id: str
    name: str
    category: str
    content: str
    fields_config: Optional[dict] = None
    created_at: str
    updated_at: str


class TemplateListOut(BaseModel):
    templates: List[TemplateOut]
    total: int


class MessageResponse(BaseModel):
    message: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_current_user_id(authorization: Optional[str]) -> str:
    """
    Extract and validate the user from the Authorization header.
    Expects: "Bearer <access_token>"
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(" ", 1)[1]
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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """Create a new template for the authenticated user."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        template = templates_crud.create_template(
            supabase=supabase,
            owner_id=user_id,
            name=body.name,
            category=body.category,
            content=body.content,
            fields_config=body.fields_config,
        )

        if template is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create template",
            )

        return _to_template_out(template)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create template: {str(e)}",
        )


@router.get("", response_model=TemplateListOut)
async def list_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    authorization: Optional[str] = Header(None),
):
    """List all templates for the authenticated user, with optional filters."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        templates = templates_crud.get_templates_by_owner(
            supabase=supabase,
            owner_id=user_id,
            category=category,
            search=search,
            limit=limit,
            offset=offset,
        )
        total = templates_crud.count_templates_by_owner(supabase, user_id)

        return TemplateListOut(
            templates=[_to_template_out(t) for t in templates],
            total=total,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not list templates: {str(e)}",
        )


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: str,
    authorization: Optional[str] = Header(None),
):
    """Get a single template by ID. Only the owner can access it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        template = templates_crud.get_template_by_id(supabase, template_id)

        if template is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

        # Ownership check
        if template.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this template",
            )

        return _to_template_out(template)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve template: {str(e)}",
        )


@router.patch("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: str,
    body: TemplateUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """Update a template. Only the owner can modify it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        # Verify ownership first
        existing = templates_crud.get_template_by_id(supabase, template_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

        if existing.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this template",
            )

        updated = templates_crud.update_template(
            supabase=supabase,
            template_id=template_id,
            updates=body.model_dump(exclude_none=True),
        )

        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update template",
            )

        return _to_template_out(updated)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update template: {str(e)}",
        )


@router.delete("/{template_id}", response_model=MessageResponse)
async def delete_template(
    template_id: str,
    authorization: Optional[str] = Header(None),
):
    """Delete a template. Only the owner can delete it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        # Verify ownership first
        existing = templates_crud.get_template_by_id(supabase, template_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

        if existing.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this template",
            )

        deleted = templates_crud.delete_template(supabase, template_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete template",
            )

        return MessageResponse(message="Template deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not delete template: {str(e)}",
        )


# ─── Utility ──────────────────────────────────────────────────────────────────

def _to_template_out(data: dict) -> TemplateOut:
    """Convert a raw Supabase row dict to a TemplateOut response."""
    return TemplateOut(
        id=str(data["id"]),
        owner_id=str(data["owner_id"]),
        name=data["name"],
        category=data["category"],
        content=data["content"],
        fields_config=data.get("fields_config"),
        created_at=str(data["created_at"]),
        updated_at=str(data["updated_at"]),
    )
