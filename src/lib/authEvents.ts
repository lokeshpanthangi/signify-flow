/**
 * Auth Events
 * ===========
 * Global auth event bus so non-React code (API services)
 * can trigger a logout when a 401 is received.
 *
 * Usage in API services:
 *   import { onAuthError } from '@/lib/authEvents';
 *   if (res.status === 401) onAuthError();
 *
 * The AuthContext registers itself as the handler on mount.
 */

let _handler: (() => void) | null = null;

/** Called by AuthProvider to register the logout callback */
export function registerAuthErrorHandler(handler: () => void) {
  _handler = handler;
}

/** Called by AuthProvider to unregister on unmount */
export function unregisterAuthErrorHandler() {
  _handler = null;
}

/** Call this from any API service when a 401 is received */
export function onAuthError() {
  _handler?.();
}
