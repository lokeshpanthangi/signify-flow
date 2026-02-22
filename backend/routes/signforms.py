"""
SignForms Routes
================
API endpoints for sign form CRUD: create, list, get, update, delete,
plus response listing for form owners and public signing endpoints.
All endpoints require an access_token except the public form endpoints.
"""

from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Header, Request, Depends
from pydantic import BaseModel, Field

from supabase_client import get_supabase_client
from crud import auth as auth_crud
from crud import signforms as signforms_crud
from crud import templates as templates_crud
from dependencies import MessageResponse, get_current_user_id

router = APIRouter(prefix="/signforms", tags=["signforms"])


# ─── Request / Response Schemas ───────────────────────────────────────────────

class SignFormCreateRequest(BaseModel):
    template_id: str = Field(..., description="ID of the template to base the form on")
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    max_responses: Optional[int] = Field(None, ge=1)
    expiry_date: Optional[str] = Field(None, description="ISO datetime string")


class SignFormUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field(None, description="active or inactive")
    max_responses: Optional[int] = Field(None, ge=1)
    expiry_date: Optional[str] = None


class ResponseEntryOut(BaseModel):
    id: str
    sign_form_id: str
    signer_name: str
    signer_email: str
    status: str
    recipient_id: Optional[str] = None
    field_values: Optional[dict] = None
    signed_at: Optional[str] = None
    created_at: str


class SignFormOut(BaseModel):
    id: str
    owner_id: str
    template_id: str
    name: str
    description: Optional[str] = None
    status: str
    responses_count: int = 0
    max_responses: Optional[int] = None
    url: str
    expiry_date: Optional[str] = None
    created_at: str
    updated_at: str


class SignFormDetailOut(SignFormOut):
    """Extended output that includes the list of responses."""
    responses_list: List[ResponseEntryOut] = []


class SignFormListOut(BaseModel):
    sign_forms: List[SignFormOut]
    total: int


class SignFormRespondRequest(BaseModel):
    """Public signing submission."""
    signer_name: str = Field(..., min_length=1, max_length=300)
    signer_email: str = Field(..., min_length=1, max_length=300)
    field_values: Optional[dict] = Field(None, description="Map of field_id → value filled in by the signer")
    recipient_id: Optional[str] = Field(None, description="Which recipient slot this signer fulfils")


class SignFormResponseOut(BaseModel):
    id: str
    sign_form_id: str
    signer_name: str
    signer_email: str
    status: str
    field_values: Optional[dict] = None
    signed_at: Optional[str] = None
    created_at: str


class PublicTemplateOut(BaseModel):
    """Template content + fields returned for public signing (no secrets)."""
    template_name: str
    content: str
    fields_config: Optional[dict] = None


def _to_signform_out(data: dict) -> SignFormOut:
    """Convert a raw Supabase row dict to a SignFormOut response."""
    return SignFormOut(
        id=str(data["id"]),
        owner_id=str(data["owner_id"]),
        template_id=str(data["template_id"]),
        name=data["name"],
        description=data.get("description"),
        status=data["status"],
        responses_count=data.get("responses_count", 0),
        max_responses=data.get("max_responses"),
        url=data["url"],
        expiry_date=str(data["expiry_date"]) if data.get("expiry_date") else None,
        created_at=str(data["created_at"]),
        updated_at=str(data["updated_at"]),
    )


def _to_response_out(data: dict) -> ResponseEntryOut:
    """Convert a raw Supabase row dict to a ResponseEntryOut."""
    return ResponseEntryOut(
        id=str(data["id"]),
        sign_form_id=str(data["sign_form_id"]),
        signer_name=data["signer_name"],
        signer_email=data["signer_email"],
        status=data["status"],
        recipient_id=data.get("recipient_id"),
        field_values=data.get("field_values"),
        signed_at=str(data["signed_at"]) if data.get("signed_at") else None,
        created_at=str(data["created_at"]),
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=SignFormOut, status_code=status.HTTP_201_CREATED)
async def create_signform(
    body: SignFormCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    # Verify the template exists and belongs to the user
    try:
        template = templates_crud.get_template_by_id(supabase, body.template_id)
        if template is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )
        if template.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this template",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not verify template: {str(e)}",
        )

    try:
        signform = signforms_crud.create_signform(
            supabase=supabase,
            owner_id=user_id,
            template_id=body.template_id,
            name=body.name,
            description=body.description or "",
            max_responses=body.max_responses,
            expiry_date=body.expiry_date,
        )

        if signform is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create sign form",
            )

        return _to_signform_out(signform)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create sign form: {str(e)}",
        )


@router.get("", response_model=SignFormListOut)
async def list_signforms(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    try:
        signforms = signforms_crud.get_signforms_by_owner(
            supabase=supabase,
            owner_id=user_id,
            status=status_filter,
            search=search,
            limit=limit,
            offset=offset,
        )
        total = signforms_crud.count_signforms_by_owner(supabase, user_id)

        return SignFormListOut(
            sign_forms=[_to_signform_out(sf) for sf in signforms],
            total=total,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not list sign forms: {str(e)}",
        )


# ─── Pending-for-user: sign forms where the user is a recipient ──────────────
#     MUST be defined before /{signform_id} to avoid route conflict.

class PendingSignFormItem(BaseModel):
    """A sign form that is waiting for the current user to sign."""
    sign_form_id: str
    sign_form_name: str
    sign_form_url: str
    template_name: str
    template_content: Optional[str] = None
    owner_name: str
    recipient_role: str
    created_at: str


class PendingSignFormsOut(BaseModel):
    pending: List[PendingSignFormItem]
    total: int


@router.get("/pending-for-me", response_model=PendingSignFormsOut)
async def get_pending_for_me(
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    try:
        # Get user email
        profile = auth_crud.get_profile(supabase, user_id)
        if not profile:
            return PendingSignFormsOut(pending=[], total=0)

        user_email = profile.get("email", "").lower().strip()
        if not user_email:
            return PendingSignFormsOut(pending=[], total=0)

        # Get all active sign forms (with template join)
        result = (
            supabase.table("sign_forms")
            .select("*, templates(name, content, fields_config, owner_id)")
            .eq("status", "active")
            .execute()
        )

        if not result.data:
            return PendingSignFormsOut(pending=[], total=0)

        # Get already-completed response emails for each form
        sign_form_ids = [sf["id"] for sf in result.data]
        completed_responses = (
            supabase.table("sign_form_responses")
            .select("sign_form_id, signer_email")
            .in_("sign_form_id", sign_form_ids)
            .eq("status", "completed")
            .execute()
        )

        # Build a set of (form_id, email) that are already completed
        completed_set = set()
        for resp in (completed_responses.data or []):
            completed_set.add(
                (str(resp["sign_form_id"]), resp["signer_email"].lower().strip())
            )

        pending_items: List[PendingSignFormItem] = []

        for sf in result.data:
            tmpl = sf.get("templates")
            if not tmpl:
                continue

            fields_config = tmpl.get("fields_config")
            if not fields_config:
                continue

            recipients = fields_config.get("recipients", [])
            for r in recipients:
                if r.get("action") == "view":
                    continue
                if r.get("email", "").lower().strip() == user_email:
                    # Check if already completed
                    if (str(sf["id"]), user_email) in completed_set:
                        continue

                    # Fetch owner name
                    owner_id = tmpl.get("owner_id") or sf.get("owner_id")
                    owner_name = "Unknown"
                    if owner_id:
                        try:
                            owner_profile = auth_crud.get_profile(supabase, str(owner_id))
                            if owner_profile:
                                owner_name = owner_profile.get("full_name", "Unknown")
                        except Exception:
                            pass

                    pending_items.append(PendingSignFormItem(
                        sign_form_id=str(sf["id"]),
                        sign_form_name=sf["name"],
                        sign_form_url=sf["url"],
                        template_name=tmpl.get("name", ""),
                        template_content=tmpl.get("content", ""),
                        owner_name=owner_name,
                        recipient_role=r.get("role", "Signer"),
                        created_at=str(sf["created_at"]),
                    ))
                    break  # only add once per sign form

        return PendingSignFormsOut(
            pending=pending_items,
            total=len(pending_items),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not fetch pending sign forms: {str(e)}",
        )


@router.get("/{signform_id}", response_model=SignFormDetailOut)
async def get_signform(
    signform_id: str,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    try:
        signform = signforms_crud.get_signform_by_id(supabase, signform_id)

        if signform is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if signform.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this sign form",
            )

        # Fetch responses for this form
        responses = signforms_crud.get_responses_by_signform(supabase, signform_id)

        out = _to_signform_out(signform)
        return SignFormDetailOut(
            **out.model_dump(),
            responses_list=[_to_response_out(r) for r in responses],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve sign form: {str(e)}",
        )


@router.patch("/{signform_id}", response_model=SignFormOut)
async def update_signform(
    signform_id: str,
    body: SignFormUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    try:
        existing = signforms_crud.get_signform_by_id(supabase, signform_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if existing.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this sign form",
            )

        # Validate status value
        updates = body.model_dump(exclude_none=True)
        if "status" in updates and updates["status"] not in ("active", "inactive", "completed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'active', 'inactive', or 'completed'",
            )

        updated = signforms_crud.update_signform(
            supabase=supabase,
            signform_id=signform_id,
            updates=updates,
        )

        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update sign form",
            )

        return _to_signform_out(updated)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update sign form: {str(e)}",
        )


@router.delete("/{signform_id}", response_model=MessageResponse)
async def delete_signform(
    signform_id: str,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()

    try:
        existing = signforms_crud.get_signform_by_id(supabase, signform_id)

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if existing.get("owner_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this sign form",
            )

        deleted = signforms_crud.delete_signform(supabase, signform_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete sign form",
            )

        return MessageResponse(message="Sign form deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not delete sign form: {str(e)}",
        )


# ─── Public Endpoint: Get form by URL slug ───────────────────────────────────

@router.get("/public/{url_slug}", response_model=SignFormOut)
async def get_public_signform(url_slug: str):
    """
    Get a sign form by its public URL slug.
    No auth required — this is for the public signing page.
    Only returns active forms.
    """
    supabase = get_supabase_client()

    try:
        signform = signforms_crud.get_signform_by_url(supabase, url_slug)

        if signform is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if signform.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This sign form is no longer accepting responses",
            )

        return _to_signform_out(signform)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve sign form: {str(e)}",
        )


# ─── Public Endpoint: Get template content for signing ───────────────────────

@router.get("/public/{url_slug}/template", response_model=PublicTemplateOut)
async def get_public_template(url_slug: str):
    """
    Get the template content + fields_config for a public sign form.
    No auth required — used by the signing interface to render the document.
    Only accessible for active forms.
    """
    supabase = get_supabase_client()

    try:
        signform = signforms_crud.get_signform_by_url(supabase, url_slug)

        if signform is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if signform.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This sign form is no longer accepting responses",
            )

        template = templates_crud.get_template_by_id(supabase, signform["template_id"])
        if template is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found",
            )

        return PublicTemplateOut(
            template_name=template.get("name", ""),
            content=template.get("content", ""),
            fields_config=template.get("fields_config"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve template: {str(e)}",
        )


# ─── Public Endpoint: Submit a signing response ──────────────────────────────

@router.post("/public/{url_slug}/respond", response_model=SignFormResponseOut, status_code=status.HTTP_201_CREATED)
async def submit_response(url_slug: str, body: SignFormRespondRequest, request: Request):
    """
    Submit a signing response to a public sign form.
    No auth required — called from the public signing interface.
    Validates the signer email is one of the template recipients.
    """
    supabase = get_supabase_client()

    try:
        signform = signforms_crud.get_signform_by_url(supabase, url_slug)

        if signform is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sign form not found",
            )

        if signform.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This sign form is no longer accepting responses",
            )

        # Check max_responses cap
        if signform.get("max_responses"):
            count = signforms_crud.count_responses_by_signform(supabase, signform["id"])
            if count >= signform["max_responses"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This sign form has reached its maximum number of responses",
                )

        # ── Duplicate-signing guard ──────────────────────────────────
        existing_responses = (
            supabase.table("sign_form_responses")
            .select("id")
            .eq("sign_form_id", str(signform["id"]))
            .eq("signer_email", body.signer_email.lower().strip())
            .eq("status", "completed")
            .execute()
        )
        if existing_responses.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already signed this document.",
            )

        # Validate signer email against template recipients
        template = templates_crud.get_template_by_id(supabase, signform["template_id"])
        recipient_id = body.recipient_id or ""
        if template and template.get("fields_config"):
            cfg = template["fields_config"]
            recipients = cfg.get("recipients", [])
            signer_emails = [r.get("email", "").lower().strip() for r in recipients if r.get("action") != "view"]
            if signer_emails and body.signer_email.lower().strip() not in signer_emails:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your email is not authorized to sign this document. Please check with the document owner.",
                )
            # Auto-detect recipient_id from email if not provided
            if not recipient_id:
                for r in recipients:
                    if r.get("email", "").lower().strip() == body.signer_email.lower().strip():
                        recipient_id = r.get("id", "")
                        break

        # Get client IP
        ip_address = request.client.host if request.client else ""

        # Create the response as completed (signed)
        response_row = signforms_crud.create_response(
            supabase=supabase,
            sign_form_id=str(signform["id"]),
            signer_name=body.signer_name,
            signer_email=body.signer_email,
            recipient_id=recipient_id,
            field_values=body.field_values,
            ip_address=ip_address,
        )

        if response_row is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save your signature response",
            )

        # Mark the response as completed immediately
        signforms_crud.update_response(
            supabase=supabase,
            response_id=str(response_row["id"]),
            updates={
                "status": "completed",
                "signed_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        # ── Check if ALL signing recipients have now signed ─────────
        # If yes, auto-deactivate the sign form so the creator sees it's done.
        try:
            if template and template.get("fields_config"):
                cfg = template["fields_config"]
                signing_recipients = [
                    r for r in cfg.get("recipients", [])
                    if r.get("action") != "view"
                ]
                signing_emails = {
                    r.get("email", "").lower().strip()
                    for r in signing_recipients
                    if r.get("email")
                }

                if signing_emails:
                    all_completed = (
                        supabase.table("sign_form_responses")
                        .select("signer_email")
                        .eq("sign_form_id", str(signform["id"]))
                        .eq("status", "completed")
                        .execute()
                    )
                    completed_emails = {
                        row["signer_email"].lower().strip()
                        for row in (all_completed.data or [])
                    }

                    if signing_emails.issubset(completed_emails):
                        signforms_crud.update_signform(
                            supabase=supabase,
                            signform_id=str(signform["id"]),
                            updates={"status": "completed"},
                        )
        except Exception:
            pass  # Non-critical; don't fail the response

        return SignFormResponseOut(
            id=str(response_row["id"]),
            sign_form_id=str(response_row["sign_form_id"]),
            signer_name=response_row["signer_name"],
            signer_email=response_row["signer_email"],
            status="completed",
            field_values=response_row.get("field_values"),
            signed_at=str(response_row.get("signed_at")) if response_row.get("signed_at") else None,
            created_at=str(response_row["created_at"]),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not submit response: {str(e)}",
        )
