import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getOAuth2Client } from '@/lib/google-calendar';
import { google } from 'googleapis';

// Helper to get base URL
function getBaseUrl(request: NextRequest): string {
  // First try environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback to request origin
  return request.nextUrl.origin;
}

// Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const baseUrl = getBaseUrl(request);

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/admin/settings?error=oauth_denied`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/admin/settings?error=no_code`, baseUrl)
      );
    }

    // Verify user is admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', baseUrl));
    }

    // Check if user is admin via user_metadata
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.redirect(
        new URL(`/admin/settings?error=not_admin`, baseUrl)
      );
    }

    // Exchange code for tokens
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(`/admin/settings?error=no_tokens`, baseUrl)
      );
    }

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Deactivate any existing tokens
    await supabase.from('google_oauth_tokens').update({ is_active: false }).eq('is_active', true);

    // Store new tokens in database
    const { error: insertError } = await supabase.from('google_oauth_tokens').insert({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      google_email: userInfo.data.email,
      google_account_id: userInfo.data.id,
      is_active: true,
    });

    if (insertError) {
      console.error('Error storing tokens:', insertError);
      return NextResponse.redirect(
        new URL(`/admin/settings?error=storage_failed`, baseUrl)
      );
    }

    // Success! Redirect to admin settings
    return NextResponse.redirect(
      new URL(`/admin/settings?success=calendar_connected`, baseUrl)
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL(`/admin/settings?error=unknown`, baseUrl)
    );
  }
}
