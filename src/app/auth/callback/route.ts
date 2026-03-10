import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createServerClient();

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            email_notifications: true,
            whatsapp_notifications: false,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

      if (profileError) {
        console.error('Error upserting user profile:', profileError);
      }

      // Redirect to the intended destination
      return NextResponse.redirect(new URL(redirect, requestUrl.origin));
    }

    // Error exchanging code
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent('Error al iniciar sesión con Google')}`,
        requestUrl.origin
      )
    );
  }

  // No code provided
  return NextResponse.redirect(
    new URL(`/auth/error?message=${encodeURIComponent('Código de autenticación no válido')}`, requestUrl.origin)
  );
}
