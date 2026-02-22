-- ═══════════════════════════════════════════════════════════════════════════════
--  Migration: Add field_values and recipient_id to sign_form_responses
--  Also ensures fields_config JSONB exists on templates
-- ═══════════════════════════════════════════════════════════════════════════════
--  Run in Supabase SQL Editor after the initial migration.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure templates has fields_config column
ALTER TABLE templates
    ADD COLUMN IF NOT EXISTS fields_config JSONB
    DEFAULT '{"sendInOrder":false,"recipients":[],"fields":[]}'::jsonb;

-- 2. Add recipient_id to sign_form_responses (maps to template recipient)
ALTER TABLE sign_form_responses
    ADD COLUMN IF NOT EXISTS recipient_id TEXT;

-- 3. Add field_values JSONB to sign_form_responses (stores signature data, text values, etc.)
ALTER TABLE sign_form_responses
    ADD COLUMN IF NOT EXISTS field_values JSONB
    DEFAULT '{}'::jsonb;

-- 4. Add ip_address for audit trail
ALTER TABLE sign_form_responses
    ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 5. Index for looking up responses by recipient
CREATE INDEX IF NOT EXISTS idx_sign_form_responses_recipient
    ON sign_form_responses(recipient_id);
