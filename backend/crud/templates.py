"""
Templates CRUD Operations
=========================
Database operations for document templates.
"""

from typing import Optional, List
from supabase import Client


def create_template(supabase: Client, owner_id: str, name: str, category: str, content: str, fields_config: Optional[dict] = None) -> dict:
    """
    Create a new template.
    """
    row = {
        "owner_id": owner_id,
        "name": name,
        "category": category,
        "content": content,
    }
    if fields_config is not None:
        row["fields_config"] = fields_config

    response = (
        supabase.table("templates")
        .insert(row)
        .execute()
    )
    return response.data[0] if response.data else None


def get_template_by_id(supabase: Client, template_id: str) -> Optional[dict]:
    """
    Get a single template by its ID.
    """
    response = (
        supabase.table("templates")
        .select("*")
        .eq("id", template_id)
        .single()
        .execute()
    )
    return response.data


def get_templates_by_owner(
    supabase: Client,
    owner_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[dict]:
    """
    List all templates belonging to a user.
    Supports optional filtering by category and search by name.
    """
    query = (
        supabase.table("templates")
        .select("*")
        .eq("owner_id", owner_id)
    )

    if category:
        query = query.eq("category", category)

    if search:
        query = query.ilike("name", f"%{search}%")

    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)

    response = query.execute()
    return response.data or []


def update_template(supabase: Client, template_id: str, updates: dict) -> Optional[dict]:
    """
    Update a template. Only non-None fields in `updates` are applied.
    """
    # Filter out None values
    clean = {k: v for k, v in updates.items() if v is not None}
    if not clean:
        return get_template_by_id(supabase, template_id)

    response = (
        supabase.table("templates")
        .update(clean)
        .eq("id", template_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_template(supabase: Client, template_id: str) -> bool:
    """
    Delete a template by ID. Returns True if a row was deleted.
    """
    response = (
        supabase.table("templates")
        .delete()
        .eq("id", template_id)
        .execute()
    )
    return bool(response.data)


def count_templates_by_owner(supabase: Client, owner_id: str) -> int:
    """
    Return the total number of templates owned by a user.
    """
    response = (
        supabase.table("templates")
        .select("id", count="exact")
        .eq("owner_id", owner_id)
        .execute()
    )
    return response.count or 0
