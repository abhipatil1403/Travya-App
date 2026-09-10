-- Local Volunteer Registration & Verification System
-- Database Schema for Supabase

-- TABLE: locals
CREATE TABLE IF NOT EXISTS locals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    id_proof_url TEXT,
    availability TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by UUID REFERENCES tourists(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locals_email ON locals(email);
CREATE INDEX IF NOT EXISTS idx_locals_is_verified ON locals(is_verified);
CREATE INDEX IF NOT EXISTS idx_locals_city ON locals(city);
CREATE INDEX IF NOT EXISTS idx_locals_verified_by ON locals(verified_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_locals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locals_updated_at
    BEFORE UPDATE ON locals
    FOR EACH ROW
    EXECUTE FUNCTION update_locals_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE locals ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (register as local)
CREATE POLICY "locals_insert_policy"
    ON locals FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can view verified locals
CREATE POLICY "locals_select_verified"
    ON locals FOR SELECT
    USING (is_verified = true);

-- Policy: Users can view their own local record
CREATE POLICY "locals_select_own"
    ON locals FOR SELECT
    USING (
        email = (SELECT auth.jwt() ->> 'email')
    );

-- Policy: Authenticated users can view all locals (for police dashboard)
-- Frontend access control ensures only police see the verification tab
CREATE POLICY "locals_select_authenticated"
    ON locals FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update locals (for verification)
-- Frontend access control ensures only police can verify
CREATE POLICY "locals_update_authenticated"
    ON locals FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete locals (for rejection)
-- Frontend access control ensures only police can reject
CREATE POLICY "locals_delete_authenticated"
    ON locals FOR DELETE
    USING (auth.uid() IS NOT NULL);
