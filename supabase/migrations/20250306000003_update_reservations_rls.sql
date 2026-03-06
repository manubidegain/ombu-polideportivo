-- Update RLS policies for reservations to allow authenticated users to create reservations

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Only admins can update reservations" ON reservations;
DROP POLICY IF EXISTS "Only admins can delete reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;

-- Create new policies that allow authenticated users to create their own reservations
CREATE POLICY "Authenticated users can create their own reservations" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can view their own reservations, admins can view all" ON reservations
  FOR SELECT USING (
    auth.uid() = user_id OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Users can update their own reservations, admins can update all" ON reservations
  FOR UPDATE USING (
    auth.uid() = user_id OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can delete reservations" ON reservations
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );
