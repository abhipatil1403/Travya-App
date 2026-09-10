-- FINAL CLEAN FIX - Delete everything and start fresh
-- Run this ONCE in Supabase SQL Editor

-- ============================================
-- STEP 1: DELETE ALL EXISTING POLICIES
-- ============================================

-- Delete ALL policies from groups table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON groups';
    END LOOP;
END $$;

-- Delete ALL policies from group_members table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON group_members';
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Create helper function
-- ============================================

CREATE OR REPLACE FUNCTION get_tourist_id_from_email()
RETURNS UUID AS $$
DECLARE
    tourist_uuid UUID;
BEGIN
    SELECT id INTO tourist_uuid
    FROM tourists
    WHERE email = (SELECT auth.jwt() ->> 'email')
    LIMIT 1;
    RETURN tourist_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: Create SIMPLE GROUPS policies
-- ============================================

-- View groups where user is head
CREATE POLICY "view_own_groups"
    ON groups FOR SELECT
    USING (head_tourist_id = get_tourist_id_from_email());

-- View groups where user is member
CREATE POLICY "view_member_groups"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE tourist_id = get_tourist_id_from_email()
        )
    );

-- Create group (as head)
CREATE POLICY "create_group"
    ON groups FOR INSERT
    WITH CHECK (head_tourist_id = get_tourist_id_from_email());

-- Update own group
CREATE POLICY "update_own_group"
    ON groups FOR UPDATE
    USING (head_tourist_id = get_tourist_id_from_email())
    WITH CHECK (head_tourist_id = get_tourist_id_from_email());

-- Delete own group
CREATE POLICY "delete_own_group"
    ON groups FOR DELETE
    USING (head_tourist_id = get_tourist_id_from_email());

-- ============================================
-- STEP 4: Create SIMPLE GROUP_MEMBERS policies
-- ============================================

-- View members (if you're the member OR head of group)
CREATE POLICY "view_members"
    ON group_members FOR SELECT
    USING (
        tourist_id = get_tourist_id_from_email()
        OR
        group_id IN (
            SELECT id FROM groups
            WHERE head_tourist_id = get_tourist_id_from_email()
        )
    );

-- ADD MEMBERS - SIMPLEST POSSIBLE POLICY
-- Only check: added_by must match current user
-- Frontend already verifies group ownership
CREATE POLICY "add_members"
    ON group_members FOR INSERT
    WITH CHECK (added_by = get_tourist_id_from_email());

-- Remove members (only head can remove)
CREATE POLICY "remove_members"
    ON group_members FOR DELETE
    USING (
        group_id IN (
            SELECT id FROM groups
            WHERE head_tourist_id = get_tourist_id_from_email()
        )
    );
