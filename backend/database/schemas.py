"""
SignifyFlow Database Schemas
============================
Shared enums and Pydantic base models that mirror the Supabase table structures.

Route-specific request/response schemas live in each ``routes/*.py`` module.
Only **shared** types that are referenced from multiple places belong here.

Tables:
  1. profiles             — User profiles (linked to Supabase Auth)
  2. documents            — Documents sent for signing
  3. templates            — Reusable document templates
  4. sign_forms           — Shareable signing forms (linked to templates)
  5. sign_form_responses  — Individual responses/signatures on sign forms
"""

from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
#  ENUMS  –  importable from anywhere:  from database.schemas import ...
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentStatus(str, Enum):
    """Status of a document in the signing workflow."""
    DRAFT = "draft"
    SIGNED = "signed"
    PENDING = "pending"
    DECLINED = "declined"


class SignFormStatus(str, Enum):
    """Whether a sign form is currently accepting responses."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    COMPLETED = "completed"


class ResponseStatus(str, Enum):
    """Status of an individual sign form response."""
    COMPLETED = "completed"
    PENDING = "pending"
    EXPIRED = "expired"
