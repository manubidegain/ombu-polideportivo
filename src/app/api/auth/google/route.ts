import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/google-calendar';

// Start OAuth flow - redirect user to Google authorization page
export async function GET() {
  try {
    // Verify user is admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL));
    }

    // Check if user is admin via user_metadata
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Generate OAuth URL
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar', // Full calendar access
        'https://www.googleapis.com/auth/userinfo.email', // Get user email
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting OAuth flow:', error);
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 });
  }
}
