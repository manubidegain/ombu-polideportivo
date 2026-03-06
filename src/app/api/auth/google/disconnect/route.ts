import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Disconnect Google Calendar by deactivating tokens
export async function POST() {
  try {
    // Verify user is admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin via user_metadata
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Deactivate all tokens
    const { error } = await supabase
      .from('google_oauth_tokens')
      .update({ is_active: false })
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating tokens:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in disconnect route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
