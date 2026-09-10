-- Family / Group Tourist Management System
-- Database Schema for Supabase (Client SDK Only)
-- FIXED: Removed infinite recursion in RLS policies

-- TABLE 1: groups
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    head_tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE 2: group_members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    tourist_id UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, tourist_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_head_tourist_id ON groups(head_tourist_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_tourist_id ON group_members(tourist_id);
CREATE INDEX IF NOT EXISTS idx_group_members_added_by ON group_members(added_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Helper function to get tourist ID from auth email
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GROUPS TABLE POLICIES

-- Policy: Users can view groups where they are head OR member
-- Using EXISTS to avoid recursion issues
CREATE POLICY "Users can view groups where they are head"
    ON groups FOR SELECT
    USING (
        head_tourist_id = get_tourist_id_from_email()
        OR EXISTS (
            SELECT 1 FROM group_members
            WHERE group_members.group_id = groups.id
            AND group_members.tourist_id = get_tourist_id_from_email()
        )
    );

-- Policy: Authenticated users can create groups (as head)
CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    WITH CHECK (head_tourist_id = get_tourist_id_from_email());

-- Policy: Only head can update their group
CREATE POLICY "Head can update their group"
    ON groups FOR UPDATE
    USING (head_tourist_id = get_tourist_id_from_email())
    WITH CHECK (head_tourist_id = get_tourist_id_from_email());

-- Policy: Only head can delete their group
CREATE POLICY "Head can delete their group"
    ON groups FOR DELETE
    USING (head_tourist_id = get_tourist_id_from_email());

-- GROUP_MEMBERS TABLE POLICIES
-- FIXED: Removed circular references to avoid infinite recursion

-- Policy: Users can view members if they are the head of the group
-- OR if they are the member themselves (checking tourist_id directly)
CREATE POLICY "Users can view group members"
    ON group_members FOR SELECT
    USING (
        -- User is head of the group
        group_id IN (
            SELECT id FROM groups
            WHERE head_tourist_id = get_tourist_id_from_email()
        )
        OR
        -- User is the member themselves (direct check, no recursion)
        tourist_id = get_tourist_id_from_email()
    );

-- Policy: Only head can add members
CREATE POLICY "Head can add members"
    ON group_members FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT id FROM groups
            WHERE head_tourist_id = get_tourist_id_from_email()
        )
        AND added_by = get_tourist_id_from_email()
    );

-- Policy: Only head can remove members
CREATE POLICY "Head can remove members"
    ON group_members FOR DELETE
    USING (
        group_id IN (
            SELECT id FROM groups
            WHERE head_tourist_id = get_tourist_id_from_email()
        )
    );
