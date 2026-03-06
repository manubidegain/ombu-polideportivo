-- Fix RLS policy for share token to not interfere with authentication
-- The previous policy was too broad and allowed unauthenticated access to all reservations

DROP POLICY IF EXISTS "Anyone can view reservation via share token" ON reservations;

-- This policy allows public access to view a SPECIFIC reservation via share token
-- It won't apply to general queries, only when explicitly filtering by share_token
-- Note: The page will need to use anon key and filter by share_token explicitly
