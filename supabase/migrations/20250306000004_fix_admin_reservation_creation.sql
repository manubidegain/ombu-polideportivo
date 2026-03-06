-- Fix RLS policy to allow admins to create reservations with or without a user

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create their own reservations" ON reservations;

-- Create new policy that allows:
-- 1. Users to create reservations where user_id = their own ID
-- 2. Admins to create ANY reservation (with or without user_id)
CREATE POLICY "Users can create own reservations, admins can create any" ON reservations
  FOR INSERT WITH CHECK (
    -- User creating their own reservation
    (auth.uid() = user_id) OR
    -- Admin creating any reservation (can be with or without user_id)
    (COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin')
  );
