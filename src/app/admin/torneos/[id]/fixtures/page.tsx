import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SmartFixtureGenerator } from './SmartFixtureGenerator';
import { PlayoffGenerator } from './PlayoffGenerator';
import { BracketView } from './BracketView';
import { GenerateMatchesButtonSimple } from './GenerateMatchesButtonSimple';
import { ExportMatchesButton } from './ExportMatchesButton';
import { FixtureTabs } from './FixtureTabs';

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
      score: match.score as
        | {
            sets: Array<{ team1: number; team2: number }>;
            supertiebreak?: { team1: number; team2: number };
          }
        | undefined,
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
            category: match.series.tournament_categories?.name as string,
          }
        : null,
    }));

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/admin/torneos/${id}`}
            className="inline-flex items-center font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver al torneo
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-[32px] sm:text-[48px] text-white mb-2">FIXTURE</h1>
              <p className="font-body text-[14px] sm:text-[16px] text-gray-400">
                Generar series y programar partidos para {tournament.name}
              </p>
            </div>
            {matches && matches.length > 0 && (
              <ExportMatchesButton tournamentId={id} />
            )}
          </div>
        </div>

        {/* Smart Fixture Generator */}
        <div className="mb-8">
          <SmartFixtureGenerator
            tournamentId={id}
            categories={categoriesWithTeams}
          />
        </div>

        {/* Generate Matches Button */}
        {series && series.length > 0 && series.some(s => s.phase === 'groups') && (
          <div className="mb-8">
            <GenerateMatchesButtonSimple
              tournamentId={id}
              categories={(() => {
                const groupSeries = series.filter(s => s.phase === 'groups');
                const categoriesMap = new Map();

                groupSeries.forEach(s => {
                  let categoryName = 'Sin Categoría';
                  if (s.tournament_categories) {
                    if (Array.isArray(s.tournament_categories) && s.tournament_categories.length > 0) {
                      categoryName = s.tournament_categories[0].name;
                    } else if (typeof s.tournament_categories === 'object' && 'name' in s.tournament_categories) {
                      categoryName = (s.tournament_categories as any).name;
                    }
                  }

                  if (s.category_id) {
                    const catId = s.category_id;
                    if (!categoriesMap.has(catId)) {
                      categoriesMap.set(catId, {
                        id: catId,
                        name: categoryName,
                        seriesIds: []
                      });
                    }
                    categoriesMap.get(catId).seriesIds.push(s.id);
                  }
                });

                return Array.from(categoriesMap.values()).map(category => ({
                  id: category.id,
                  name: category.name,
                  hasMatches: Boolean(matchesRaw && matchesRaw.some(m =>
                    m.series_id && category.seriesIds.includes(m.series_id)
                  ))
                }));
              })()}
            />
          </div>
        )}

        {/* Playoff Generator */}
        {series && series.length > 0 && series.some(s => s.phase === 'groups') && (
          <div className="mb-8">
            <PlayoffGenerator
              tournamentId={id}
              categories={tournament.tournament_categories || []}
            />
          </div>
        )}

        {/* Bracket View */}
        {series && series.length > 0 && series.some(s => s.phase === 'playoffs' || s.phase === 'finals') && (
          <div className="mb-8">
            <BracketView tournamentId={id} />
          </div>
        )}

        {/* Matches and Standings Tabs */}
        {series && series.length > 0 && (
          <FixtureTabs
            matches={matches}
            tournamentId={id}
            availableSeries={(series || []).map(s => ({
              id: s.id,
              name: s.name,
              phase: s.phase,
              category_id: s.category_id,
            }))}
            hasGroupSeries={series.some(s => s.phase === 'groups')}
          />
        )}
      </div>
    </div>
  );
}
