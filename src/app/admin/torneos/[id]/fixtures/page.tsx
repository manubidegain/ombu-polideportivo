import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FixtureGenerator } from './FixtureGenerator';
import { MatchesList } from './MatchesList';

export default async function TournamentFixturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/');
  }

  const supabase = await createServerClient();

  // Fetch tournament with categories
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(
      `
      *,
      tournament_categories (
        id,
        name,
        description,
        max_teams,
        min_teams
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Fetch registrations grouped by category
  const categoriesWithTeams = await Promise.all(
    (tournament.tournament_categories || []).map(async (category) => {
      const { data: teams } = await supabase
        .from('tournament_registrations')
        .select('id, team_name, player_names, status')
        .eq('category_id', category.id)
        .eq('status', 'confirmed')
        .order('team_name');

      // Transform teams to match expected type
      const transformedTeams = (teams || [])
        .filter((team) => team.team_name) // Filter out teams without names
        .map((team) => ({
          id: team.id,
          team_name: team.team_name as string,
          player_names: Array.isArray(team.player_names)
            ? (team.player_names as string[])
            : [],
        }));

      return { ...category, teams: transformedTeams };
    })
  );

  // Fetch existing series
  const { data: series } = await supabase
    .from('tournament_series')
    .select(
      `
      *,
      tournament_categories (name),
      tournament_series_teams (
        registration_id,
        tournament_registrations (team_name)
      )
    `
    )
    .eq('tournament_id', id)
    .order('series_number');

  // Fetch existing matches
  const { data: matchesRaw } = await supabase
    .from('tournament_matches')
    .select(
      `
      *,
      team1:tournament_registrations!tournament_matches_team1_id_fkey (
        id,
        team_name
      ),
      team2:tournament_registrations!tournament_matches_team2_id_fkey (
        id,
        team_name
      ),
      court:courts (name),
      series:tournament_series (name, phase)
    `
    )
    .eq('tournament_id', id)
    .order('scheduled_date')
    .order('scheduled_time');

  // Transform matches to match expected type
  const matches = (matchesRaw || [])
    .filter(
      (match) =>
        match.status &&
        match.team1?.team_name &&
        match.team2?.team_name
    )
    .map((match) => ({
      id: match.id,
      scheduled_date: match.scheduled_date,
      scheduled_time: match.scheduled_time,
      status: match.status as string,
      team1: {
        id: match.team1.id,
        team_name: match.team1.team_name as string,
      },
      team2: {
        id: match.team2.id,
        team_name: match.team2.team_name as string,
      },
      court: match.court
        ? {
            name: match.court.name as string,
          }
        : null,
      series: match.series
        ? {
            name: match.series.name as string,
            phase: match.series.phase as string,
          }
        : null,
    }));

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver al torneo
          </Link>
          <h1 className="font-heading text-[48px] text-white mb-2">FIXTURE</h1>
          <p className="font-body text-[16px] text-gray-400">
            Generar series y programar partidos para {tournament.name}
          </p>
        </div>

        {/* Fixture Generator */}
        <div className="mb-8">
          <FixtureGenerator
            tournamentId={id}
            categories={categoriesWithTeams}
            existingSeries={series || []}
          />
        </div>

        {/* Existing Matches */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="font-heading text-[24px] text-white mb-6">
            PARTIDOS GENERADOS ({matches?.length || 0})
          </h2>

          {matches && matches.length > 0 ? (
            <MatchesList matches={matches} />
          ) : (
            <p className="text-center text-gray-400 py-8">
              No se han generado partidos todavía. Usa el generador de fixture arriba para crear series
              y partidos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
