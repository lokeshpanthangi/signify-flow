-- ═══════════════════════════════════════════════════════════════════════════════
--  SignifyFlow — Add missing columns + RLS for sign_form_responses
-- ═══════════════════════════════════════════════════════════════════════════════
--  Run this in Supabase SQL Editor after migration.sql + add_fields_config.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sign_form_responses' AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE sign_form_responses ADD COLUMN recipient_id TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sign_form_responses' AND column_name = 'field_values'
    ) THEN
        ALTER TABLE sign_form_responses ADD COLUMN field_values JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sign_form_responses' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE sign_form_responses ADD COLUMN ip_address TEXT DEFAULT '';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
--  RLS Policies for the public signing flow
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Allow public INSERT of sign form responses (signing flow)
--    Safety net — the backend uses the service-role key, so RLS is normally
--    bypassed.  This policy ensures things still work if the anon key is used.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sign_form_responses' AND policyname = 'Anyone can submit a response to active forms'
    ) THEN
        CREATE POLICY "Anyone can submit a response to active forms"
            ON sign_form_responses FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Allow public UPDATE of pending responses → completed (for the signing flow)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sign_form_responses' AND policyname = 'Anyone can update pending responses'
    ) THEN
        CREATE POLICY "Anyone can update pending responses"
            ON sign_form_responses FOR UPDATE
            USING (true);
    END IF;
END $$;

-- 3. Allow anyone to SELECT responses (needed for count checks in anon context)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sign_form_responses' AND policyname = 'Anyone can view responses for active forms'
    ) THEN
        CREATE POLICY "Anyone can view responses for active forms"
            ON sign_form_responses FOR SELECT
            USING (true);
    END IF;
END $$;

-- 4. Allow public read of templates linked to active sign forms (for the signing interface)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'templates' AND policyname = 'Public can view templates via active sign forms'
    ) THEN
        CREATE POLICY "Public can view templates via active sign forms"
            ON templates FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM sign_forms
                    WHERE sign_forms.template_id = templates.id
                    AND sign_forms.status = 'active'
                )
            );
    END IF;
END $$;
