import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { rankGroupTeams, type MatchResult } from '@/lib/tournaments/ranking-calculator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: tournamentId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const supabase = await createServerClient();

    // Build query based on filters
    let query = supabase
      .from('tournament_series')
      .select(
        `
        id,
        name,
        phase,
        tournament_categories (name),
        tournament_series_teams (
          registration_id,
          tournament_registrations (
            id,
            team_name
          )
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('phase', 'groups');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: groupSeries, error: seriesError } = await query;

    if (seriesError || !groupSeries) {
      return NextResponse.json({ error: 'Error al obtener series' }, { status: 500 });
    }

    // Get all matches for these groups
    const seriesIds = groupSeries.map((s) => s.id);

    if (seriesIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .in('series_id', seriesIds);

    if (!matches) {
      return NextResponse.json({ error: 'Error al obtener partidos' }, { status: 500 });
    }

    // Calculate standings for each group
    const groupStandings = [];

    for (const series of groupSeries) {
      const teams = series.tournament_series_teams.map((st: any) => ({
        id: st.registration_id,
        name: st.tournament_registrations.team_name || 'Sin nombre',
      }));

      const groupMatches: MatchResult[] = matches
        .filter((m) => m.series_id === series.id)
        .map((m) => ({
          id: m.id,
          team1Id: m.team1_id,
          team2Id: m.team2_id,
          winnerId: m.winner_id,
          score: m.score as MatchResult['score'],
        }));

      const standings = rankGroupTeams(teams, series.id, series.name, groupMatches);

      // Calculate completion percentage
      const totalMatches = (teams.length * (teams.length - 1)) / 2;
      const completedMatches = groupMatches.filter((m) => m.winnerId).length;
      const completionPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

      groupStandings.push({
        seriesId: series.id,
        groupName: series.name,
        categoryName: series.tournament_categories?.name || 'Sin Categoría',
        phase: series.phase,
        standings: standings.map((s) => ({
          position: s.groupRank,
          teamId: s.teamId,
          teamName: s.teamName,
          matchesPlayed: s.matchesPlayed,
          matchesWon: s.matchesWon,
          matchesLost: s.matchesLost,
          setsWon: s.setsWon,
          setsLost: s.setsLost,
          gamesWon: s.gamesWon,
          gamesLost: s.gamesLost,
        })),
        totalMatches,
        completedMatches,
        completionPercentage: Math.round(completionPercentage),
        isComplete: completedMatches === totalMatches,
      });
    }

    return NextResponse.json({ groups: groupStandings });
  } catch (error: any) {
    console.error('Error calculating standings:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
