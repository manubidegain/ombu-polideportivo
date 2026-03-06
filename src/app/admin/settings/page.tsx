import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleCalendarSettings } from './GoogleCalendarSettings';

export default async function AdminSettingsPage() {
  const supabase = await createServerClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin via user_metadata
  if (user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  // Get current OAuth token status
  const { data: oauthToken } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('is_active', true)
    .single();

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-[48px] text-white mb-4">CONFIGURACIÓN</h1>
          <p className="font-body text-[18px] text-gray-400">
            Configurá las integraciones y ajustes del sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Google Calendar Integration */}
          <GoogleCalendarSettings oauthToken={oauthToken} />

          {/* Future settings sections can go here */}
        </div>
      </div>
    </div>
  );
}
