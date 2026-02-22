-- ═══════════════════════════════════════════════════════════════════════════════
--  Migration: Add 'content' column and 'draft' status to documents table
--  Run this in Supabase SQL Editor after the initial migration.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add content column (stores HTML from the editor)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

-- 2. Drop old check constraint and add new one with 'draft'
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_status_check
    CHECK (status IN ('draft', 'signed', 'pending', 'declined'));

-- 3. Make recipient_name and recipient_email nullable (drafts may not have a recipient yet)
ALTER TABLE documents
  ALTER COLUMN recipient_name DROP NOT NULL,
  ALTER COLUMN recipient_email DROP NOT NULL;

-- 4. Set defaults
ALTER TABLE documents
  ALTER COLUMN recipient_name SET DEFAULT '',
  ALTER COLUMN recipient_email SET DEFAULT '',
  ALTER COLUMN status SET DEFAULT 'draft';
