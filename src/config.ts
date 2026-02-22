/**
 * SignifyFlow Frontend Configuration
 * ===================================
 * Single source of truth for every env-driven value the frontend needs.
 *
 * Vite exposes env vars prefixed with VITE_ via `import.meta.env`.
 * Create a `.env` (or `.env.local`) at the project root:
 *
 *   VITE_API_URL=http://localhost:8081
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Usage:
 *   import { config } from '@/config';
 *   fetch(`${config.API_URL}/templates`);
 */

export const config = {
  // ── Backend API ────────────────────────────────────────────────────────────
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8081',

  // ── Supabase (used by auth context & realtime later) ───────────────────────
  SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL ??
    'https://kdbxpoidpyqevmivzaih.supabase.co',
  SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhwb2lkcHlxZXZtaXZ6YWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE0NjIsImV4cCI6MjA4NjMyNzQ2Mn0.lbq9_gVDm0SAdY7-zUkxj15kS2AFfL9RQeAH_Ah4qPc',

  // ── App Meta ───────────────────────────────────────────────────────────────
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'SignifyFlow',

  // ── Feature Flags ──────────────────────────────────────────────────────────
  ENABLE_AI_FIELD_DETECTION:
    (import.meta.env.VITE_ENABLE_AI_FIELD_DETECTION ?? 'true') === 'true',

  // ── File Upload ────────────────────────────────────────────────────────────
  MAX_UPLOAD_SIZE_MB: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? 25),
  ALLOWED_FILE_TYPES: (
    import.meta.env.VITE_ALLOWED_FILE_TYPES ?? 'pdf,doc,docx,txt,png,jpg,jpeg'
  ).split(','),
} as const;
