import { createServerClient } from '@/lib/supabase/server';

/**
 * Get the current authenticated user from server components
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  // Check user metadata for admin role (ONLY from metadata, not email)
  return user.user_metadata?.role === 'admin';
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require admin role - throws redirect if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const adminCheck = await isAdmin();

  if (!adminCheck) {
    throw new Error('Forbidden - Admin access required');
  }

  return user;
}
