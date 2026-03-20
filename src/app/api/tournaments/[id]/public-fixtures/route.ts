import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch all matches for the tournament
    const { data: matchesRaw, error } = await supabase
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
        team1:tournament_registrations!tournament_matches_team1_id_fkey (
          id,
          team_name,
          player_names
        ),
        team2:tournament_registrations!tournament_matches_team2_id_fkey (
          id,
          team_name,
          player_names
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

    if (error) throw error;

    // Transform matches
    const matches = (matchesRaw || [])
      .filter(
        (match: any) =>
          match.status &&
          match.team1?.team_name &&
          match.team2?.team_name
      )
      .map((match: any) => ({
        id: match.id,
        scheduled_date: match.scheduled_date,
        scheduled_time: match.scheduled_time,
        status: match.status,
        score_status: match.score_status || 'not_submitted',
        score_submitted_at: match.score_submitted_at,
        score: match.score,
        team1: {
          id: match.team1.id,
          team_name: match.team1.team_name,
          player_names: match.team1.player_names || [],
        },
        team2: {
          id: match.team2.id,
          team_name: match.team2.team_name,
          player_names: match.team2.player_names || [],
        },
        court: match.court?.name || null,
        series: {
          name: match.series?.name || 'Sin Serie',
          phase: match.series?.phase || '',
          category: match.series?.tournament_categories?.name || 'Sin Categoría',
        },
      }));

    return NextResponse.json({ success: true, matches });
  } catch (error: any) {
    console.error('Error fetching public fixtures:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar partidos' },
      { status: 500 }
    );
  }
}
