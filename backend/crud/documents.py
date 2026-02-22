"""
Documents CRUD Operations
=========================
Database operations for user documents.
"""

from typing import Optional, List
from supabase import Client


def create_document(
    supabase: Client,
    sender_id: str,
    name: str,
    content: str = "",
    status: str = "draft",
    recipient_name: str = "",
    recipient_email: str = "",
) -> dict:
    """
    Create a new document.
    """
    row = {
        "sender_id": sender_id,
        "name": name,
        "content": content,
        "status": status,
        "recipient_name": recipient_name or "",
        "recipient_email": recipient_email or "",
    }

    response = (
        supabase.table("documents")
        .insert(row)
        .execute()
    )
    return response.data[0] if response.data else None


def get_document_by_id(supabase: Client, document_id: str) -> Optional[dict]:
    """
    Get a single document by its ID.
    """
    response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .single()
        .execute()
    )
    return response.data


def get_documents_by_sender(
    supabase: Client,
    sender_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[dict]:
    """
    List all documents belonging to a user (as sender).
    Supports optional filtering by status and search by name.
    """
    query = (
        supabase.table("documents")
        .select("*")
        .eq("sender_id", sender_id)
    )

    if status:
        query = query.eq("status", status)

    if search:
        query = query.ilike("name", f"%{search}%")

    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)

    response = query.execute()
    return response.data or []


def count_documents_by_sender(supabase: Client, sender_id: str) -> int:
    """
    Return the total number of documents owned by a user.
    """
    response = (
        supabase.table("documents")
        .select("id", count="exact")
        .eq("sender_id", sender_id)
        .execute()
    )
    return response.count or 0


def update_document(supabase: Client, document_id: str, updates: dict) -> Optional[dict]:
    """
    Update a document. Only non-None fields in `updates` are applied.
    """
    clean = {k: v for k, v in updates.items() if v is not None}
    if not clean:
        return get_document_by_id(supabase, document_id)

    response = (
        supabase.table("documents")
        .update(clean)
        .eq("id", document_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_document(supabase: Client, document_id: str) -> bool:
    """
    Delete a document by ID. Returns True if a row was deleted.
    """
    response = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .execute()
    )
    return bool(response.data)
