-- ═══════════════════════════════════════════════════════════════════════════════
--  Migration: Add fields_config JSONB column to templates
--  ═══════════════════════════════════════════════════════════════════════════════
--  Run this in Supabase SQL Editor:
--  Dashboard → SQL Editor → New Query → Paste & Run
--
--  This column stores the signature field placements and recipient configuration
--  as structured JSON. Example:
--  {
--    "recipients": [
--      { "id": "1", "name": "Signer 1", "email": "", "role": "Signer", "color": "0" }
--    ],
--    "fields": [
--      { "id": "field_1", "type": "signature", "label": "Signature",
--        "recipientId": "1", "x": 100, "y": 800, "width": 200, "height": 60,
--        "required": true }
--    ]
--  }
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE templates
ADD COLUMN IF NOT EXISTS fields_config JSONB DEFAULT '{"recipients":[],"fields":[]}'::jsonb;
