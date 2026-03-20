import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicFixturesClient } from './PublicFixturesClient';
import { getCurrentUser } from '@/lib/auth/utils';

export default async function PublicFixturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const user = await getCurrentUser();

  // Fetch tournament info
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, description, start_date, end_date, status')
    .eq('id', id)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Fetch matches
  const { data: matchesRaw } = await supabase
    .from('tournament_matches')
    .select(
      `
      id,
      scheduled_date,
      scheduled_time,
      status,
      score,
      score_status,
      score_submitted_at,
      team1_id,
      team2_id,
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        id,
        team_name,
        player_names,
        player1_id,
        player2_id
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        id,
        team_name,
        player_names,
        player1_id,
        player2_id
      ),
      court:courts (name),
      series:tournament_series (
        name,
        phase,
        tournament_categories (name)
      )
    `
    )
    .eq('tournament_id', id)
    .order('scheduled_date')
    .order('scheduled_time');

  const matches = (matchesRaw || [])
    .filter(
      (match: any) => match.team1?.team_name && match.team2?.team_name
    )
    .map((match: any) => ({
      id: match.id,
      scheduled_date: match.scheduled_date,
      scheduled_time: match.scheduled_time,
      status: match.status || 'scheduled',
      score_status: match.score_status || 'not_submitted',
      score_submitted_at: match.score_submitted_at,
      score: match.score as
        | {
            sets: Array<{ team1: number; team2: number }>;
            supertiebreak?: { team1: number; team2: number };
          }
        | undefined,
      team1: {
        id: match.team1.id,
        team_name: match.team1.team_name as string,
        player_names: (match.team1.player_names as string[]) || [],
        player1_id: match.team1.player1_id,
        player2_id: match.team1.player2_id,
      },
      team2: {
        id: match.team2.id,
        team_name: match.team2.team_name as string,
        player_names: (match.team2.player_names as string[]) || [],
        player1_id: match.team2.player1_id,
        player2_id: match.team2.player2_id,
      },
      court: match.court?.name || null,
      series: {
        name: match.series?.name || 'Sin Serie',
        phase: match.series?.phase || '',
        category: match.series?.tournament_categories?.name || 'Sin Categoría',
      },
    }));

  // Get user's registrations if logged in
  let userRegistrationIds: string[] = [];
  if (user) {
    const { data: userRegs } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', id)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);
    userRegistrationIds = (userRegs || []).map((r) => r.id);
  }

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4 transition-colors"
          >
            ← Volver al torneo
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-[36px] sm:text-[48px] text-white mb-2">
                PARTIDOS
              </h1>
              <p className="font-body text-[16px] text-gray-400">
                {tournament.name}
              </p>
            </div>
          </div>
        </div>

        {/* Fixtures Client Component */}
        <PublicFixturesClient
          matches={matches}
          tournamentId={id}
          userId={user?.id}
          userRegistrationIds={userRegistrationIds}
        />
      </div>
    </div>
  );
}
