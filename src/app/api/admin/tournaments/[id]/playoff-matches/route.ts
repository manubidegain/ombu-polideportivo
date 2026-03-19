import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const supabase = await createServerClient();

    // Get playoff series for this tournament/category
    let seriesQuery = supabase
      .from('tournament_series')
      .select('id, phase, name')
      .eq('tournament_id', tournamentId)
      .in('phase', ['playoffs', 'finals']);

    if (categoryId) {
      seriesQuery = seriesQuery.eq('category_id', categoryId);
    }

    const { data: series } = await seriesQuery;

    if (!series || series.length === 0) {
      return NextResponse.json({
        quarterFinals: [],
        semiFinals: [],
        final: null,
      });
    }

    const seriesIds = series.map((s) => s.id);

    // Get all playoff matches
    const { data: matchesRaw } = await supabase
      .from('tournament_matches')
      .select(
        `
        *,
        team1:tournament_registrations!tournament_matches_team1_id_fkey (
          team_name
        ),
        team2:tournament_registrations!tournament_matches_team2_id_fkey (
          team_name
        ),
        series:tournament_series (
          name,
          phase
        )
      `
      )
      .in('series_id', seriesIds);

    const matches = (matchesRaw || []).map((m) => ({
      id: m.id,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      winner_id: m.winner_id,
      score: m.score,
      team1: m.team1,
      team2: m.team2,
      series: m.series,
    }));

    // Organize by series name (which includes the round)
    const quarterFinals = matches.filter((m) => m.series?.name?.includes('Cuartos'));
    const semiFinals = matches.filter((m) => m.series?.name?.includes('Semifinal'));
    const final = matches.find((m) => m.series?.name === 'Final') || null;

    return NextResponse.json({
      quarterFinals,
      semiFinals,
      final,
    });
  } catch (error: any) {
    console.error('Error fetching playoff matches:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
