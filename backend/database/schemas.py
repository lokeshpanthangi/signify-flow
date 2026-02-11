"""
SignifyFlow Database Schemas
============================
Pydantic models that mirror the Supabase (PostgreSQL) table structures.
These schemas define the shape of data for the entire SignifyFlow platform.

Tables:
  1. profiles        — User profiles (linked to Supabase Auth)
  2. documents       — Documents sent for signing
  3. templates       — Reusable document templates
  4. sign_forms      — Shareable signing forms (linked to templates)
  5. sign_form_responses — Individual responses/signatures on sign forms
  6. signature_fields    — Positioned signature/input fields on documents
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


class FieldType(str, Enum):
    """Type of signature/input field placed on a document."""
    SIGNATURE = "signature"
    INITIAL = "initial"
    DATE = "date"
    TEXT = "text"
    CHECKBOX = "checkbox"
    DROPDOWN = "dropdown"


# ═══════════════════════════════════════════════════════════════════════════════
#  1. PROFILES TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class ProfileBase(BaseModel):
    """Base schema for user profiles."""
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full display name")
    email: EmailStr = Field(..., description="User's email address")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    company: Optional[str] = Field(None, max_length=255, description="User's company/organization")
    job_title: Optional[str] = Field(None, max_length=255, description="User's job title")


class ProfileCreate(ProfileBase):
    """Schema for creating a new profile (id comes from Supabase Auth)."""
    id: UUID = Field(..., description="User ID from Supabase Auth (auth.users.id)")


class ProfileUpdate(BaseModel):
    """Schema for updating a profile — all fields optional."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    company: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=255)


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
    status: DocumentStatus = Field(default=DocumentStatus.PENDING, description="Current signing status")
    recipient_name: str = Field(..., min_length=1, max_length=255, description="Name of the recipient")
    recipient_email: EmailStr = Field(..., description="Email of the recipient")
    file_url: Optional[str] = Field(None, description="URL to the document file in Supabase Storage")
    content: Optional[str] = Field(None, description="Document text content (for template-based docs)")
    notes: Optional[str] = Field(None, description="Optional notes or message for the recipient")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document."""
    sender_id: UUID = Field(..., description="ID of the user sending the document")


class DocumentUpdate(BaseModel):
    """Schema for updating a document — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    status: Optional[DocumentStatus] = None
    recipient_name: Optional[str] = Field(None, min_length=1, max_length=255)
    recipient_email: Optional[EmailStr] = None
    file_url: Optional[str] = None
    content: Optional[str] = None
    notes: Optional[str] = None


class DocumentResponse(DocumentBase):
    """Schema for document data returned from the database."""
    id: UUID
    sender_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
#  3. TEMPLATES TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class TemplateBase(BaseModel):
    """Base schema for document templates."""
    name: str = Field(..., min_length=1, max_length=500, description="Template name")
    category: str = Field(..., min_length=1, max_length=100, description="Template category (Legal, Business, etc.)")
    content: str = Field(..., description="Template content with placeholders like [Party A]")
    description: Optional[str] = Field(None, max_length=1000, description="Brief description of the template")


class TemplateCreate(TemplateBase):
    """Schema for creating a new template."""
    owner_id: UUID = Field(..., description="ID of the user who created the template")


class TemplateUpdate(BaseModel):
    """Schema for updating a template — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)


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
    signature_data: Optional[str] = Field(None, description="JSON string or base64 of the drawn signature")
    ip_address: Optional[str] = Field(None, description="IP address of the signer for audit trail")


class SignFormResponseEntryCreate(SignFormResponseEntryBase):
    """Schema for creating a new response entry."""
    pass


class SignFormResponseEntryUpdate(BaseModel):
    """Schema for updating a response — all fields optional."""
    status: Optional[ResponseStatus] = None
    signer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    signer_email: Optional[EmailStr] = None
    signature_data: Optional[str] = None


class SignFormResponseEntryResponse(SignFormResponseEntryBase):
    """Schema for response data returned from the database."""
    id: UUID
    signed_at: Optional[datetime] = Field(None, description="Timestamp when the form was signed")
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════════
#  6. SIGNATURE FIELDS TABLE
# ═══════════════════════════════════════════════════════════════════════════════

class SignatureFieldBase(BaseModel):
    """Base schema for positioned signature/input fields on documents."""
    document_id: UUID = Field(..., description="Document this field belongs to")
    field_type: FieldType = Field(..., description="Type of field (signature, initial, date, text, etc.)")
    page: int = Field(default=1, ge=1, description="Page number the field appears on")
    x: float = Field(..., ge=0, description="X position (percentage from left)")
    y: float = Field(..., ge=0, description="Y position (percentage from top)")
    width: float = Field(default=200, ge=10, description="Field width in pixels")
    height: float = Field(default=50, ge=10, description="Field height in pixels")
    required: bool = Field(default=True, description="Whether this field is required")
    placeholder: Optional[str] = Field(None, max_length=255, description="Placeholder text for text fields")
    value: Optional[str] = Field(None, description="Filled-in value of the field")


class SignatureFieldCreate(SignatureFieldBase):
    """Schema for creating a new signature field."""
    pass


class SignatureFieldUpdate(BaseModel):
    """Schema for updating a signature field — all fields optional."""
    field_type: Optional[FieldType] = None
    page: Optional[int] = Field(None, ge=1)
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, ge=10)
    height: Optional[float] = Field(None, ge=10)
    required: Optional[bool] = None
    placeholder: Optional[str] = Field(None, max_length=255)
    value: Optional[str] = None


class SignatureFieldResponse(SignatureFieldBase):
    """Schema for signature field data returned from the database."""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
