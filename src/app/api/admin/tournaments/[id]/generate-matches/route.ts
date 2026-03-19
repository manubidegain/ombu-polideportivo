import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { generateRoundRobinMatches, assignTimeSlots, saveMatches } from '@/lib/tournaments/fixture-generator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const body = await request.json();
    const { categoryId, assignSchedule = true } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Se requiere categoryId' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get tournament details
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, name, start_date, end_date')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    // Get all series for this category
    const { data: series } = await supabase
      .from('tournament_series')
      .select(`
        id,
        name,
        tournament_series_teams (
          registration_id,
          tournament_registrations (
            id,
            team_name
          )
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('category_id', categoryId)
      .eq('phase', 'groups');

    if (!series || series.length === 0) {
      return NextResponse.json(
        { error: 'No hay series creadas para esta categoría' },
        { status: 404 }
      );
    }

    let totalMatches = 0;
    let totalScheduled = 0;
    const seriesResults = [];

    for (const s of series) {
      // Check if series already has matches
      const { data: existingMatches, count: existingCount } = await supabase
        .from('tournament_matches')
        .select('id', { count: 'exact' })
        .eq('series_id', s.id);

      if (existingCount && existingCount > 0) {
        // Series already has matches, skip
        seriesResults.push({
          seriesId: s.id,
          seriesName: s.name,
          skipped: true,
          reason: 'Ya tiene partidos generados',
        });
        continue;
      }

      // Get teams in this series
      const teams = s.tournament_series_teams
        .map((st: any) => ({
          id: st.tournament_registrations.id,
          team_name: st.tournament_registrations.team_name,
        }))
        .filter((t) => t.team_name);

      if (teams.length < 2) {
        seriesResults.push({
          seriesId: s.id,
          seriesName: s.name,
          skipped: true,
          reason: 'Menos de 2 equipos',
        });
        continue;
      }

      // Generate round-robin matches
      let matches = generateRoundRobinMatches(teams, tournamentId, s.id);

      // Assign time slots if requested
      if (assignSchedule && tournament.start_date) {
        matches = await assignTimeSlots(
          matches,
          tournamentId,
          tournament.start_date,
          tournament.end_date || undefined
        );
      }

      // Save matches
      await saveMatches(matches);

      const scheduledCount = matches.filter((m) => m.scheduled_date).length;
      totalMatches += matches.length;
      totalScheduled += scheduledCount;

      seriesResults.push({
        seriesId: s.id,
        seriesName: s.name,
        matchCount: matches.length,
        scheduledMatches: scheduledCount,
      });
    }

    return NextResponse.json({
      success: true,
      totalMatches,
      totalScheduled,
      series: seriesResults,
    });
  } catch (error: any) {
    console.error('Error generating matches:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
