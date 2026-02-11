-- ═══════════════════════════════════════════════════════════════════════════════
--  SignifyFlow Database Schema — Supabase (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════════
--  Run this SQL in the Supabase SQL Editor to create all tables.
--  Dashboard → SQL Editor → New Query → Paste & Run
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── Enable UUID extension (should already be enabled in Supabase) ───────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ═══════════════════════════════════════════════════════════════════════════════
--  1. PROFILES
--  Linked to Supabase Auth (auth.users). Created on user signup.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    avatar_url  TEXT,
    company     TEXT,
    job_title   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
--  2. TEMPLATES
--  Reusable document templates created by users.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'General',
    content     TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
--  3. DOCUMENTS
--  Documents sent for e-signature.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('signed', 'pending', 'declined')),
    recipient_name  TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    file_url        TEXT,
    content         TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
--  4. SIGN FORMS
--  Shareable forms that allow multiple people to sign a template.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sign_forms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    responses_count INT NOT NULL DEFAULT 0,
    max_responses   INT,
    url             TEXT NOT NULL,
    expiry_date     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_sign_forms_updated_at
    BEFORE UPDATE ON sign_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
--  5. SIGN FORM RESPONSES
--  Individual responses/signatures submitted to a sign form.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sign_form_responses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sign_form_id    UUID NOT NULL REFERENCES sign_forms(id) ON DELETE CASCADE,
    signer_name     TEXT NOT NULL,
    signer_email    TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'expired')),
    signature_data  TEXT,
    ip_address      TEXT,
    signed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-increment responses_count on sign_forms when a response is completed
CREATE OR REPLACE FUNCTION increment_response_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE sign_forms
        SET responses_count = responses_count + 1
        WHERE id = NEW.sign_form_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_completed
    AFTER INSERT OR UPDATE ON sign_form_responses
    FOR EACH ROW
    EXECUTE FUNCTION increment_response_count();


-- ═══════════════════════════════════════════════════════════════════════════════
--  6. SIGNATURE FIELDS
--  Positioned input fields placed on documents (signature, date, text, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS signature_fields (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    field_type  TEXT NOT NULL DEFAULT 'signature' CHECK (field_type IN ('signature', 'initial', 'date', 'text', 'checkbox', 'dropdown')),
    page        INT NOT NULL DEFAULT 1,
    x           REAL NOT NULL,
    y           REAL NOT NULL,
    width       REAL NOT NULL DEFAULT 200,
    height      REAL NOT NULL DEFAULT 50,
    required    BOOLEAN NOT NULL DEFAULT TRUE,
    placeholder TEXT,
    value       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- ═══════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) POLICIES
--  Ensures users can only access their own data.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sign_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sign_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_fields ENABLE ROW LEVEL SECURITY;

-- ─── Profiles Policies ──────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ─── Templates Policies ─────────────────────────────────────────────────────
CREATE POLICY "Users can view their own templates"
    ON templates FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create templates"
    ON templates FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own templates"
    ON templates FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own templates"
    ON templates FOR DELETE
    USING (auth.uid() = owner_id);

-- ─── Documents Policies ─────────────────────────────────────────────────────
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can create documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = sender_id);

-- ─── Sign Forms Policies ────────────────────────────────────────────────────
CREATE POLICY "Users can view their own sign forms"
    ON sign_forms FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create sign forms"
    ON sign_forms FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own sign forms"
    ON sign_forms FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own sign forms"
    ON sign_forms FOR DELETE
    USING (auth.uid() = owner_id);

-- Public can view active sign forms (for public signing URLs)
CREATE POLICY "Anyone can view active sign forms"
    ON sign_forms FOR SELECT
    USING (status = 'active');

-- ─── Sign Form Responses Policies ───────────────────────────────────────────
-- Form owners can view responses
CREATE POLICY "Form owners can view responses"
    ON sign_form_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sign_forms
            WHERE sign_forms.id = sign_form_responses.sign_form_id
            AND sign_forms.owner_id = auth.uid()
        )
    );

-- Anyone can submit a response (public signing)
CREATE POLICY "Anyone can submit a response"
    ON sign_form_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sign_forms
            WHERE sign_forms.id = sign_form_id
            AND sign_forms.status = 'active'
        )
    );

-- ─── Signature Fields Policies ──────────────────────────────────────────────
CREATE POLICY "Document owners can manage signature fields"
    ON signature_fields FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = signature_fields.document_id
            AND documents.sender_id = auth.uid()
        )
    );


-- ═══════════════════════════════════════════════════════════════════════════════
--  INDEXES for performance
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_documents_sender_id ON documents(sender_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_templates_owner_id ON templates(owner_id);
CREATE INDEX idx_sign_forms_owner_id ON sign_forms(owner_id);
CREATE INDEX idx_sign_forms_template_id ON sign_forms(template_id);
CREATE INDEX idx_sign_forms_status ON sign_forms(status);
CREATE INDEX idx_sign_form_responses_form_id ON sign_form_responses(sign_form_id);
CREATE INDEX idx_sign_form_responses_status ON sign_form_responses(status);
CREATE INDEX idx_signature_fields_document_id ON signature_fields(document_id);


-- ═══════════════════════════════════════════════════════════════════════════════
--  AUTO-CREATE PROFILE ON SIGNUP (Trigger on auth.users)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
