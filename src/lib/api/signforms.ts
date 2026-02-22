/**
 * SignForms API Service
 * =====================
 * Connects the frontend to the /signforms backend routes.
 */

import { API_URL, authHeaders, authFetch } from './client';

/* ─── Types ─── */

export interface SignFormData {
    id: string;
    owner_id: string;
    template_id: string;
    name: string;
    description: string | null;
    status: 'active' | 'inactive' | 'completed';
    responses_count: number;
    max_responses: number | null;
    url: string;
    expiry_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface SignFormResponseEntry {
    id: string;
    sign_form_id: string;
    signer_name: string;
    signer_email: string;
    status: 'completed' | 'pending' | 'expired';
    recipient_id: string | null;
    field_values: Record<string, unknown> | null;
    signed_at: string | null;
    created_at: string;
}

export interface SignFormDetailData extends SignFormData {
    responses_list: SignFormResponseEntry[];
}

export interface SignFormListResponse {
    sign_forms: SignFormData[];
    total: number;
}

/* ─── API Calls ─── */

export async function createSignForm(data: {
    template_id: string;
    name: string;
    description?: string;
    max_responses?: number;
    expiry_date?: string;
}): Promise<SignFormData> {
    const res = await authFetch(`${API_URL}/signforms`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to create sign form');
    return json;
}

export async function listSignForms(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<SignFormListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status_filter', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const url = `${API_URL}/signforms${query.toString() ? `?${query}` : ''}`;
    const res = await authFetch(url, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to list sign forms');
    return json;
}

export async function getSignForm(id: string): Promise<SignFormDetailData> {
    const res = await authFetch(`${API_URL}/signforms/${id}`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to get sign form');
    return json;
}

export async function updateSignForm(
    id: string,
    data: {
        name?: string;
        description?: string;
        status?: 'active' | 'inactive' | 'completed';
        max_responses?: number;
        expiry_date?: string;
    },
): Promise<SignFormData> {
    const res = await authFetch(`${API_URL}/signforms/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update sign form');
    return json;
}

export async function deleteSignForm(id: string): Promise<void> {
    const res = await authFetch(`${API_URL}/signforms/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.detail || 'Failed to delete sign form');
    }
}

export async function getPublicSignForm(urlSlug: string): Promise<SignFormData> {
    const res = await fetch(`${API_URL}/signforms/public/${urlSlug}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Sign form not found or inactive');
    return json;
}

/* ─── Public Template Content (for signing interface) ─── */

export interface PublicTemplateData {
    template_name: string;
    content: string;
    fields_config: {
        sendInOrder: boolean;
        recipients: {
            id: string;
            name: string;
            email: string;
            role: string;
            color: string;
            action: 'sign' | 'view' | 'approve';
            notifyVia: string;
        }[];
        fields: {
            id: string;
            type: string;
            label: string;
            recipientId: string;
            x: number;
            y: number;
            width: number;
            height: number;
            required: boolean;
            page: number;
            placeholder?: string;
        }[];
    } | null;
}

export async function getPublicTemplate(urlSlug: string): Promise<PublicTemplateData> {
    const res = await fetch(`${API_URL}/signforms/public/${urlSlug}/template`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Could not load template');
    return json;
}

/* ─── Submit Signing Response (public, no auth) ─── */

export interface SubmitResponsePayload {
    signer_name: string;
    signer_email: string;
    field_values?: Record<string, unknown>;
    recipient_id?: string;
}

export interface SubmitResponseResult {
    id: string;
    sign_form_id: string;
    signer_name: string;
    signer_email: string;
    status: string;
    field_values: Record<string, unknown> | null;
    signed_at: string | null;
    created_at: string;
}

export async function submitSignFormResponse(
    urlSlug: string,
    data: SubmitResponsePayload,
): Promise<SubmitResponseResult> {
    const res = await fetch(`${API_URL}/signforms/public/${urlSlug}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to submit response');
    return json;
}

/* ─── Pending Sign Forms for Current User ─── */

export interface PendingSignFormItem {
    sign_form_id: string;
    sign_form_name: string;
    sign_form_url: string;
    template_name: string;
    template_content: string | null;
    owner_name: string;
    recipient_role: string;
    created_at: string;
}

export interface PendingSignFormsResponse {
    pending: PendingSignFormItem[];
    total: number;
}

export async function getPendingForMe(): Promise<PendingSignFormsResponse> {
    const res = await authFetch(`${API_URL}/signforms/pending-for-me`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to fetch pending sign forms');
    return json;
}
