import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { registrationId, newSeriesId } = await request.json();

    if (!registrationId || !newSeriesId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if team is already in the new series
    const { data: existingInSeries } = await supabase
      .from('tournament_series_teams')
      .select('id')
      .eq('series_id', newSeriesId)
      .eq('registration_id', registrationId)
      .single();

    if (existingInSeries) {
      return NextResponse.json(
        { error: 'El equipo ya está en esta serie' },
        { status: 400 }
      );
    }

    // Check if team is already in another series for this tournament
    const { data: newSeries } = await supabase
      .from('tournament_series')
      .select('tournament_id, category_id')
      .eq('id', newSeriesId)
      .single();

    if (!newSeries) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    const { data: existingSeriesTeam } = await supabase
      .from('tournament_series_teams')
      .select(
        `
        id,
        series_id,
        tournament_series!inner (
          tournament_id,
          category_id,
          name
        )
      `
      )
      .eq('registration_id', registrationId)
      .eq('tournament_series.tournament_id', newSeries.tournament_id)
      .eq('tournament_series.category_id', newSeries.category_id)
      .single();

    // Start transaction-like operations
    // 1. If team is in another series, remove it
    if (existingSeriesTeam) {
      const { error: deleteError } = await supabase
        .from('tournament_series_teams')
        .delete()
        .eq('id', existingSeriesTeam.id);

      if (deleteError) throw deleteError;

      // Delete matches from old series
      const { error: deleteMatchesError } = await supabase
        .from('tournament_matches')
        .delete()
        .eq('series_id', existingSeriesTeam.series_id)
        .or(`team1_id.eq.${registrationId},team2_id.eq.${registrationId}`);

      if (deleteMatchesError) throw deleteMatchesError;
    }

    // 2. Add team to new series
    const { error: insertError } = await supabase
      .from('tournament_series_teams')
      .insert({
        series_id: newSeriesId,
        registration_id: registrationId,
      });

    if (insertError) throw insertError;

    // 3. Regenerate matches for the new series
    // Get all teams in the new series
    const { data: seriesTeams } = await supabase
      .from('tournament_series_teams')
      .select(
        `
        registration_id,
        tournament_registrations (
          id,
          team_name
        )
      `
      )
      .eq('series_id', newSeriesId);

    if (!seriesTeams || seriesTeams.length < 2) {
      return NextResponse.json({
        success: true,
        message: 'Equipo movido, pero no hay suficientes equipos para generar partidos',
      });
    }

    // Delete existing matches for this series
    const { error: deleteAllMatchesError } = await supabase
      .from('tournament_matches')
      .delete()
      .eq('series_id', newSeriesId);

    if (deleteAllMatchesError) throw deleteAllMatchesError;

    // Generate new round-robin matches
    const teams = seriesTeams
      .map((st) => ({
        id: st.tournament_registrations.id,
        team_name: st.tournament_registrations.team_name,
      }))
      .filter((t) => t.team_name);

    const matches = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          tournament_id: newSeries.tournament_id,
          series_id: newSeriesId,
          team1_id: teams[i].id,
          team2_id: teams[j].id,
          status: 'scheduled',
        });
      }
    }

    if (matches.length > 0) {
      const { error: insertMatchesError } = await supabase
        .from('tournament_matches')
        .insert(matches);

      if (insertMatchesError) throw insertMatchesError;
    }

    // If there was an old series, regenerate its matches too
    if (existingSeriesTeam) {
      const { data: oldSeriesTeams } = await supabase
        .from('tournament_series_teams')
        .select(
          `
          registration_id,
          tournament_registrations (
            id,
            team_name
          )
        `
        )
        .eq('series_id', existingSeriesTeam.series_id);

      if (oldSeriesTeams && oldSeriesTeams.length >= 2) {
        const oldTeams = oldSeriesTeams
          .map((st) => ({
            id: st.tournament_registrations.id,
            team_name: st.tournament_registrations.team_name,
          }))
          .filter((t) => t.team_name);

        const oldMatches = [];
        for (let i = 0; i < oldTeams.length; i++) {
          for (let j = i + 1; j < oldTeams.length; j++) {
            oldMatches.push({
              tournament_id: newSeries.tournament_id,
              series_id: existingSeriesTeam.series_id,
              team1_id: oldTeams[i].id,
              team2_id: oldTeams[j].id,
              status: 'scheduled',
            });
          }
        }

        if (oldMatches.length > 0) {
          await supabase.from('tournament_matches').insert(oldMatches);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Serie cambiada exitosamente',
    });
  } catch (error: any) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
