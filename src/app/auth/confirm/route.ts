import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  if (token_hash && type) {
    const supabase = await createServerClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Email confirmed successfully
      return NextResponse.redirect(new URL('/auth/confirmed', requestUrl.origin));
    }

    // Error confirming email
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent('Error al confirmar el email')}`, requestUrl.origin)
    );
  }

  // Missing token or type
  return NextResponse.redirect(
    new URL(`/auth/error?message=${encodeURIComponent('Link de confirmación inválido')}`, requestUrl.origin)
  );
}
