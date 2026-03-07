import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { TournamentForm } from './TournamentForm';

export default async function NuevoTorneoPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  if (user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createServerClient();

  // Fetch available courts
  const { data: courts } = await supabase
    .from('courts')
    .select('*')
    .eq('status', 'active')
    .order('name');

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-[48px] text-white mb-4">NUEVO TORNEO</h1>
          <p className="font-body text-[18px] text-gray-400">
            Configura un nuevo torneo de pádel o fútbol
          </p>
        </div>

        <TournamentForm courts={courts || []} />
      </div>
    </div>
  );
}
