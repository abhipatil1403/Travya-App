-- DIAGNOSTIC SCRIPT - Run this first to see what's wrong
-- Copy and run in Supabase SQL Editor

-- Check if policies exist
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- Check if functions exist
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname IN ('get_tourist_id_from_email', 'is_head_of_group', 'is_user_member_of_group');

-- Check current user's tourist ID (if logged in via Supabase)
SELECT 
    auth.jwt() ->> 'email' as current_email,
    (SELECT id FROM tourists WHERE email = auth.jwt() ->> 'email' LIMIT 1) as tourist_id;

-- Test the function manually (replace with your actual group ID)
-- SELECT is_head_of_group('04dd538d-0388-4270-af87-b1482538f6b4');
