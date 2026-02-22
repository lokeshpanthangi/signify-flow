/**
 * Documents API Service
 * =====================
 * Connects the frontend to the /documents backend routes.
 */

import { API_URL, authHeaders, authFetch } from './client';

/* ─── Types ─── */

export interface DocumentData {
    id: string;
    sender_id: string;
    name: string;
    content: string;
    status: 'draft' | 'signed' | 'pending' | 'declined';
    recipient_name: string;
    recipient_email: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentListResponse {
    documents: DocumentData[];
    total: number;
}

/* ─── API Calls ─── */

export async function createDocument(data: {
    name: string;
    content: string;
    status?: string;
    recipient_name?: string;
    recipient_email?: string;
}): Promise<DocumentData> {
    const res = await authFetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to create document');
    return json;
}

export async function listDocuments(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<DocumentListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status_filter', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const url = `${API_URL}/documents${query.toString() ? `?${query}` : ''}`;
    const res = await authFetch(url, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to list documents');
    return json;
}

export async function getDocument(id: string): Promise<DocumentData> {
    const res = await authFetch(`${API_URL}/documents/${id}`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to get document');
    return json;
}

export async function updateDocument(
    id: string,
    data: {
        name?: string;
        content?: string;
        status?: string;
        recipient_name?: string;
        recipient_email?: string;
    },
): Promise<DocumentData> {
    const res = await authFetch(`${API_URL}/documents/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to update document');
    return json;
}

export async function deleteDocument(id: string): Promise<void> {
    const res = await authFetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.detail || 'Failed to delete document');
    }
}
