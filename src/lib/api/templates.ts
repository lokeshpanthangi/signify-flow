/**
 * Templates API Service
 * =====================
 * Connects the frontend to the /templates backend routes.
 */

import { API_URL, authHeaders, authFetch } from './client';

/* ─── Types ─── */

export interface FieldsConfigRecipient {
    id: string;
    name: string;
    email: string;
    role: string;
    color: string;
    action: 'sign' | 'view' | 'approve';
    notifyVia: 'email' | 'sms' | 'both';
}

export interface FieldsConfigField {
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
}

export interface FieldsConfig {
    sendInOrder: boolean;
    recipients: FieldsConfigRecipient[];
    fields: FieldsConfigField[];
}

export interface TemplateData {
    id: string;
    owner_id: string;
    name: string;
    category: string;
    content: string;
    fields_config: FieldsConfig | null;
    created_at: string;
    updated_at: string;
}

export interface TemplateListResponse {
    templates: TemplateData[];
    total: number;
}

/* ─── API Calls ─── */

export async function createTemplate(data: {
    name: string;
    category: string;
    content: string;
    fields_config?: FieldsConfig;
}): Promise<TemplateData> {
    const res = await authFetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to create template');
    return json;
}

export async function listTemplates(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<TemplateListResponse> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const url = `${API_URL}/templates${query.toString() ? `?${query}` : ''}`;
    const res = await authFetch(url, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to list templates');
    return json;
}

export async function getTemplate(id: string): Promise<TemplateData> {
    const res = await authFetch(`${API_URL}/templates/${id}`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to get template');
    return json;
}

export async function updateTemplate(
    id: string,
    data: {
        name?: string;
        category?: string;
        content?: string;
        fields_config?: FieldsConfig;
    },
): Promise<TemplateData> {
    const res = await authFetch(`${API_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update template');
    return json;
}

export async function deleteTemplate(id: string): Promise<void> {
    const res = await authFetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.detail || 'Failed to delete template');
    }
}
