"""
SignForms CRUD Operations
=========================
Database operations for sign forms.
"""

import uuid
from typing import Optional, List
from supabase import Client


def _generate_url_slug() -> str:
    """Generate a short unique URL slug for the sign form."""
    return uuid.uuid4().hex[:12]


def create_signform(
    supabase: Client,
    owner_id: str,
    template_id: str,
    name: str,
    description: str = "",
    max_responses: Optional[int] = None,
    expiry_date: Optional[str] = None,
) -> dict:
    """
    Create a new sign form linked to a template.
    Generates a unique URL slug automatically.
    """
    row = {
        "owner_id": owner_id,
        "template_id": template_id,
        "name": name,
        "description": description or "",
        "status": "active",
        "responses_count": 0,
        "url": _generate_url_slug(),
    }

    if max_responses is not None:
        row["max_responses"] = max_responses

    if expiry_date is not None:
        row["expiry_date"] = expiry_date

    response = (
        supabase.table("sign_forms")
        .insert(row)
        .execute()
    )
    return response.data[0] if response.data else None


def get_signform_by_id(supabase: Client, signform_id: str) -> Optional[dict]:
    """
    Get a single sign form by its ID.
    """
    response = (
        supabase.table("sign_forms")
        .select("*")
        .eq("id", signform_id)
        .single()
        .execute()
    )
    return response.data


def get_signform_by_url(supabase: Client, url_slug: str) -> Optional[dict]:
    """
    Get a sign form by its public URL slug (for public access).
    """
    response = (
        supabase.table("sign_forms")
        .select("*")
        .eq("url", url_slug)
        .single()
        .execute()
    )
    return response.data


def get_signforms_by_owner(
    supabase: Client,
    owner_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[dict]:
    """
    List all sign forms belonging to a user.
    Supports optional filtering by status and search by name.
    """
    query = (
        supabase.table("sign_forms")
        .select("*")
        .eq("owner_id", owner_id)
    )

    if status:
        query = query.eq("status", status)

    if search:
        query = query.ilike("name", f"%{search}%")

    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)

    response = query.execute()
    return response.data or []


def count_signforms_by_owner(supabase: Client, owner_id: str) -> int:
    """
    Return the total number of sign forms owned by a user.
    """
    response = (
        supabase.table("sign_forms")
        .select("id", count="exact")
        .eq("owner_id", owner_id)
        .execute()
    )
    return response.count or 0


def update_signform(supabase: Client, signform_id: str, updates: dict) -> Optional[dict]:
    """
    Update a sign form. Only non-None fields in `updates` are applied.
    """
    clean = {k: v for k, v in updates.items() if v is not None}
    if not clean:
        return get_signform_by_id(supabase, signform_id)

    response = (
        supabase.table("sign_forms")
        .update(clean)
        .eq("id", signform_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_signform(supabase: Client, signform_id: str) -> bool:
    """
    Delete a sign form by ID. Returns True if a row was deleted.
    """
    response = (
        supabase.table("sign_forms")
        .delete()
        .eq("id", signform_id)
        .execute()
    )
    return bool(response.data)


# ─── Sign Form Responses ─────────────────────────────────────────────────────

def get_responses_by_signform(
    supabase: Client,
    signform_id: str,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[dict]:
    """
    List all responses for a given sign form.
    """
    query = (
        supabase.table("sign_form_responses")
        .select("*")
        .eq("sign_form_id", signform_id)
    )

    if status:
        query = query.eq("status", status)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    response = query.execute()
    return response.data or []


def count_responses_by_signform(supabase: Client, signform_id: str) -> int:
    """
    Return the total number of responses for a sign form.
    """
    response = (
        supabase.table("sign_form_responses")
        .select("id", count="exact")
        .eq("sign_form_id", signform_id)
        .execute()
    )
    return response.count or 0


def create_response(
    supabase: Client,
    sign_form_id: str,
    signer_name: str,
    signer_email: str,
    recipient_id: str = "",
    field_values: Optional[dict] = None,
    ip_address: str = "",
) -> dict:
    """
    Create a response entry for a sign form (public signing endpoint).
    """
    row = {
        "sign_form_id": sign_form_id,
        "signer_name": signer_name,
        "signer_email": signer_email,
        "status": "pending",
        "recipient_id": recipient_id,
        "field_values": field_values or {},
        "ip_address": ip_address,
    }

    response = (
        supabase.table("sign_form_responses")
        .insert(row)
        .execute()
    )
    return response.data[0] if response.data else None


def update_response(supabase: Client, response_id: str, updates: dict) -> Optional[dict]:
    """
    Update a sign form response (e.g., mark as completed with field values).
    """
    clean = {k: v for k, v in updates.items() if v is not None}
    if not clean:
        return None

    response = (
        supabase.table("sign_form_responses")
        .update(clean)
        .eq("id", response_id)
        .execute()
    )
    return response.data[0] if response.data else None
