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

    // 3. Delete matches involving this team in the new series
    // This ensures no duplicate matches exist, but doesn't regenerate all matches
    const { error: deleteNewSeriesMatchesError } = await supabase
      .from('tournament_matches')
      .delete()
      .eq('series_id', newSeriesId)
      .or(`team1_id.eq.${registrationId},team2_id.eq.${registrationId}`);

    if (deleteNewSeriesMatchesError) throw deleteNewSeriesMatchesError;

    return NextResponse.json({
      success: true,
      message: 'Equipo movido exitosamente. Usá el botón "GENERAR PARTIDOS" para crear los partidos de las series.',
    });
  } catch (error: any) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
