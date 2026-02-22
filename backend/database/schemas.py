"""
SignifyFlow Database Schemas
============================
Pydantic models that mirror the Supabase (PostgreSQL) table structures.
These schemas define the shape of data for the entire SignifyFlow platform.

Tables:
  1. profiles        — User profiles (linked to Supabase Auth)
  2. templates       — Reusable document templates
  3. documents       — Documents sent for signing
  4. sign_forms      — Shareable signing forms (linked to templates)
  5. sign_form_responses — Individual responses/signatures on sign forms
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, EmailStr


# ═══════════════════════════════════════════════════════════════════════════════
#  ENUMS
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


class ResponseStatus(str, Enum):
    """Status of an individual sign form response."""
    COMPLETED = "completed"
    PENDING = "pending"
    EXPIRED = "expired"


# ═══════════════════════════════════════════════════════════════════════════════
#  1. PROFILES TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class ProfileBase(BaseModel):
    """Base schema for user profiles."""
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full display name")
    email: EmailStr = Field(..., description="User's email address")


class ProfileCreate(ProfileBase):
    """Schema for creating a new profile (id comes from Supabase Auth)."""
    id: UUID = Field(..., description="User ID from Supabase Auth (auth.users.id)")


class ProfileUpdate(BaseModel):
    """Schema for updating a profile — all fields optional."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)


class ProfileResponse(ProfileBase):
    """Schema for profile data returned from the database."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
#  2. DOCUMENTS TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentBase(BaseModel):
    """Base schema for documents."""
    name: str = Field(..., min_length=1, max_length=500, description="Document file name")
    content: str = Field(default="", description="HTML content of the document")
    status: DocumentStatus = Field(default=DocumentStatus.DRAFT, description="Current signing status")
    recipient_name: Optional[str] = Field(default="", max_length=255, description="Name of the recipient")
    recipient_email: Optional[EmailStr] = Field(default=None, description="Email of the recipient")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document."""
    sender_id: UUID = Field(..., description="ID of the user sending the document")


class DocumentUpdate(BaseModel):
    """Schema for updating a document — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    status: Optional[DocumentStatus] = None
    recipient_name: Optional[str] = Field(None, max_length=255)
    recipient_email: Optional[EmailStr] = None


class DocumentResponse(DocumentBase):
    """Schema for document data returned from the database."""
    id: UUID
    sender_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


# ═══════════════════════════════════════════════════════════════════════════════
#  3. TEMPLATES TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class TemplateBase(BaseModel):
    """Base schema for document templates."""
    name: str = Field(..., min_length=1, max_length=500, description="Template name")
    category: str = Field(..., min_length=1, max_length=100, description="Template category (Legal, Business, etc.)")
    content: str = Field(..., description="Template HTML content from the editor")
    fields_config: Optional[dict] = Field(default=None, description="JSON with recipients and placed signature fields")


class TemplateCreate(TemplateBase):
    """Schema for creating a new template."""
    owner_id: UUID = Field(..., description="ID of the user who created the template")


class TemplateUpdate(BaseModel):
    """Schema for updating a template — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    fields_config: Optional[dict] = None


class TemplateResponse(TemplateBase):
    """Schema for template data returned from the database."""
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
#  4. SIGN FORMS TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class SignFormBase(BaseModel):
    """Base schema for sign forms."""
    name: str = Field(..., min_length=1, max_length=500, description="Form name")
    description: Optional[str] = Field(None, max_length=2000, description="Form description")
    template_id: UUID = Field(..., description="ID of the template this form is based on")
    status: SignFormStatus = Field(default=SignFormStatus.ACTIVE, description="Whether the form is accepting responses")
    max_responses: Optional[int] = Field(None, ge=1, description="Maximum number of responses allowed (null = unlimited)")
    expiry_date: Optional[datetime] = Field(None, description="When the form expires (null = never)")


class SignFormCreate(SignFormBase):
    """Schema for creating a new sign form."""
    owner_id: UUID = Field(..., description="ID of the user who created the form")


class SignFormUpdate(BaseModel):
    """Schema for updating a sign form — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[SignFormStatus] = None
    max_responses: Optional[int] = Field(None, ge=1)
    expiry_date: Optional[datetime] = None


class SignFormResponse(SignFormBase):
    """Schema for sign form data returned from the database."""
    id: UUID
    owner_id: UUID
    responses_count: int = Field(default=0, description="Number of responses received")
    url: str = Field(..., description="Public URL for the form")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
#  5. SIGN FORM RESPONSES TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class SignFormResponseEntryBase(BaseModel):
    """Base schema for individual sign form response entries."""
    sign_form_id: UUID = Field(..., description="ID of the sign form this response belongs to")
    signer_name: str = Field(..., min_length=1, max_length=255, description="Name of the person who signed")
    signer_email: EmailStr = Field(..., description="Email of the signer")
    status: ResponseStatus = Field(default=ResponseStatus.PENDING, description="Status of this response")


class SignFormResponseEntryCreate(SignFormResponseEntryBase):
    """Schema for creating a new response entry."""
    pass


class SignFormResponseEntryUpdate(BaseModel):
    """Schema for updating a response — all fields optional."""
    status: Optional[ResponseStatus] = None
    signer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    signer_email: Optional[EmailStr] = None


class SignFormResponseEntryResponse(SignFormResponseEntryBase):
    """Schema for response data returned from the database."""
    id: UUID
    signed_at: Optional[datetime] = Field(None, description="Timestamp when the form was signed")
    created_at: datetime

    class Config:
        from_attributes = True
