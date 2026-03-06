-- First, we need to allow NULL user_id in reservations since admin can create reservations without users
ALTER TABLE reservations
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing foreign key constraint to auth.users
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

-- Add a new foreign key constraint to user_profiles instead
-- This allows PostgREST to automatically infer the relationship for joins
ALTER TABLE reservations
ADD CONSTRAINT reservations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE RESTRICT;

-- Update the RLS policy comments for clarity
COMMENT ON POLICY "Users can create own reservations, admins can create any" ON reservations IS
'Allows users to create reservations for themselves, and admins to create reservations for anyone (including without a user_id)';
