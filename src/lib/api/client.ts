/**
 * Shared API Client
 * =================
 * Single source of truth for auth headers, token retrieval,
 * and the authFetch wrapper used by all API service modules.
 */

import { config } from '@/config';
import { onAuthError } from '@/lib/authEvents';

export const API_URL = config.API_URL;

export function getToken(): string {
    return localStorage.getItem('signify_token') || '';
}

export function authHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
    };
}

/** Wrapper around fetch that auto-triggers logout on 401 */
export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const res = await fetch(input, init);
    if (res.status === 401) {
        onAuthError();
        throw new Error('Session expired. Please log in again.');
    }
    return res;
}
