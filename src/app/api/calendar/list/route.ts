import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listCalendars } from '@/lib/google-calendar';

export async function GET() {
  try {
    // Verify user is authenticated and is admin
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

    // List available calendars
    const result = await listCalendars();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to list calendars', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, calendars: result.calendars });
  } catch (error) {
    console.error('Error listing calendars:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
