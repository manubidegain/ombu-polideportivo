-- Run this to check your admin user configuration
-- Replace YOUR_EMAIL with your actual admin email

-- 1. Check your user's metadata
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'YOUR_EMAIL';  -- Replace with your email

-- 2. Check current auth user (run this while logged in)
SELECT
  auth.uid() as current_user_id,
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as current_user_role;

-- 3. If your role is stored differently, try these alternatives:
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  user_metadata  -- might be here instead
FROM auth.users
WHERE email = 'YOUR_EMAIL';

-- 4. Check existing storage policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%tournament%';
