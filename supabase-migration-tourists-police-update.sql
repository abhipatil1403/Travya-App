-- Allow police to update tourists.verified and tourists.blockchain_tx_hash
-- Run this in Supabase SQL Editor if verified stays false after blockchain verification
--
-- Police users must have user_metadata.role = 'police' in Supabase Auth
-- (set in Dashboard > Authentication > Users > Edit user > User Metadata)

-- Drop existing policy if it exists (avoids duplicate)
DROP POLICY IF EXISTS "police_can_update_tourist_verification" ON tourists;

-- Policy: Users with role 'police' in user_metadata can update tourists
-- (used when police verifies tourist on blockchain)
CREATE POLICY "police_can_update_tourist_verification"
    ON tourists FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'police'
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'police'
    );
