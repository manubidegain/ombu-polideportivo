import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seriesId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tournamentId, seriesId } = await params;

    const supabase = await createServerClient();

    // Verify series belongs to tournament
    const { data: series, error: seriesError } = await supabase
      .from('tournament_series')
      .select('id')
      .eq('id', seriesId)
      .eq('tournament_id', tournamentId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { error: 'Serie no encontrada en este torneo' },
        { status: 404 }
      );
    }

    // Get teams in series
    const { data: seriesTeams, error: teamsError } = await supabase
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
      .eq('series_id', seriesId);

    if (teamsError) {
      console.error('Error loading teams:', teamsError);
      return NextResponse.json(
        { error: 'Error al cargar equipos' },
        { status: 500 }
      );
    }

    const teams = (seriesTeams || [])
      .filter((st) => st.tournament_registrations?.team_name)
      .map((st) => ({
        id: st.tournament_registrations.id,
        team_name: st.tournament_registrations.team_name,
      }));

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error: any) {
    console.error('Error fetching series teams:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
