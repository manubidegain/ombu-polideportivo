import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TournamentsList } from './TournamentsList';

export default async function TorneosAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  if (user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createServerClient();

  // Fetch all tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      tournament_categories (count)
    `
    )
    .order('created_at', { ascending: false });

  // Fetch registration counts
  const tournamentsWithCounts = await Promise.all(
    (tournaments || []).map(async (tournament) => {
      const { count } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id)
        .eq('status', 'confirmed');

      return {
        ...tournament,
        registrations_count: count || 0,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[48px] text-white mb-4">TORNEOS</h1>
            <p className="font-body text-[18px] text-gray-400">
              Gestiona torneos de pádel y fútbol
            </p>
          </div>
          <Link
            href="/admin/torneos/nuevo"
            className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors"
          >
            + NUEVO TORNEO
          </Link>
        </div>

        <TournamentsList tournaments={tournamentsWithCounts || []} />
      </div>
    </div>
  );
}
