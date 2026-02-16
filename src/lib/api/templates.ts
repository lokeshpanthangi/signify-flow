/**
 * Templates API Service
 * =====================
 * Connects the frontend to the /templates backend routes.
 */

const API_URL = 'http://localhost:8000';

function getToken(): string {
    return localStorage.getItem('signify_token') || '';
}

function authHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
    };
}

/* ─── Types ─── */

export interface FieldsConfig {
    recipients: {
        id: string;
        name: string;
        email: string;
        role: string;
        color: string;
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
        placeholder?: string;
    }[];
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
    const res = await fetch(`${API_URL}/templates`, {
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
    const res = await fetch(url, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to list templates');
    return json;
}

export async function getTemplate(id: string): Promise<TemplateData> {
    const res = await fetch(`${API_URL}/templates/${id}`, {
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
    const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update template');
    return json;
}

export async function deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.detail || 'Failed to delete template');
    }
}
