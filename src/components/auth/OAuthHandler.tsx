'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Component that handles OAuth codes that arrive at the root URL
 * and redirects them to the proper callback route
 */
export function OAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    // If there's an OAuth code in the URL, redirect to callback
    if (code) {
      const redirect = searchParams.get('redirect') || '/';
      router.replace(`/auth/callback?code=${code}&redirect=${encodeURIComponent(redirect)}`);
    }
  }, [searchParams, router]);

  return null;
}
