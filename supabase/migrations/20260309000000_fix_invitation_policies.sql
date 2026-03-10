-- Fix RLS policies for tournament_invitations
-- The issue: policies cannot directly query auth.users table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can respond to invitations" ON tournament_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON tournament_invitations;

-- Recreate with correct approach using auth.jwt()
CREATE POLICY "Users can respond to invitations" ON tournament_invitations
  FOR UPDATE USING (
    invitee_email = auth.jwt() ->> 'email'
    OR auth.uid() = inviter_id -- Allow inviter to cancel
  );

-- Admins can manage all invitations
CREATE POLICY "Admins can manage invitations" ON tournament_invitations
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
