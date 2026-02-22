"""
Documents Routes
================
API endpoints for document CRUD: create, list, get, update, delete.
All endpoints require an access_token to identify the sender/owner.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field

from supabase_client import get_supabase_client
from crud import auth as auth_crud
from crud import documents as documents_crud

router = APIRouter(prefix="/documents", tags=["documents"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class DocumentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    content: str = Field(default="", description="HTML content of the document")
    status: str = Field(default="draft")
    recipient_name: Optional[str] = Field(default="")
    recipient_email: Optional[str] = Field(default="")


class DocumentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    status: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None


class DocumentOut(BaseModel):
    id: str
    sender_id: str
    name: str
    content: str
    status: str
    recipient_name: Optional[str] = ""
    recipient_email: Optional[str] = ""
    created_at: str
    updated_at: str


class DocumentListOut(BaseModel):
    documents: List[DocumentOut]
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

@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(
    body: DocumentCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """Create a new document for the authenticated user."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        document = documents_crud.create_document(
            supabase=supabase,
            sender_id=user_id,
            name=body.name,
            content=body.content,
            status=body.status,
            recipient_name=body.recipient_name or "",
            recipient_email=body.recipient_email or "",
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create document",
            )

        return _to_document_out(document)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create document: {str(e)}",
        )


@router.get("", response_model=DocumentListOut)
async def list_documents(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    authorization: Optional[str] = Header(None),
):
    """List all documents for the authenticated user, with optional filters."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        documents = documents_crud.get_documents_by_sender(
            supabase=supabase,
            sender_id=user_id,
            status=status_filter,
            search=search,
            limit=limit,
            offset=offset,
        )
        total = documents_crud.count_documents_by_sender(supabase, user_id)

        return DocumentListOut(
            documents=[_to_document_out(d) for d in documents],
            total=total,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not list documents: {str(e)}",
        )


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    authorization: Optional[str] = Header(None),
):
    """Get a single document by ID. Only the sender can access it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        document = documents_crud.get_document_by_id(supabase, document_id)

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        if document.get("sender_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this document",
            )

        return _to_document_out(document)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve document: {str(e)}",
        )


@router.patch("/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: str,
    body: DocumentUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """Update a document. Only the sender can modify it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        existing = documents_crud.get_document_by_id(supabase, document_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        if existing.get("sender_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this document",
            )

        updated = documents_crud.update_document(
            supabase=supabase,
            document_id=document_id,
            updates=body.model_dump(exclude_none=True),
        )

        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update document",
            )

        return _to_document_out(updated)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update document: {str(e)}",
        )


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    authorization: Optional[str] = Header(None),
):
    """Delete a document. Only the sender can delete it."""
    user_id = await _get_current_user_id(authorization)
    supabase = get_supabase_client()

    try:
        existing = documents_crud.get_document_by_id(supabase, document_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        if existing.get("sender_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this document",
            )

        deleted = documents_crud.delete_document(supabase, document_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete document",
            )

        return MessageResponse(message="Document deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not delete document: {str(e)}",
        )


# ─── Utility ──────────────────────────────────────────────────────────────────

def _to_document_out(data: dict) -> DocumentOut:
    """Convert a raw Supabase row dict to a DocumentOut response."""
    return DocumentOut(
        id=str(data["id"]),
        sender_id=str(data["sender_id"]),
        name=data["name"],
        content=data.get("content", ""),
        status=data["status"],
        recipient_name=data.get("recipient_name", ""),
        recipient_email=data.get("recipient_email", ""),
        created_at=str(data["created_at"]),
        updated_at=str(data["updated_at"]),
    )
