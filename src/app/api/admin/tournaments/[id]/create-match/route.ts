import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

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
    const {
      seriesId,
      team1Id,
      team2Id,
      scheduledDate,
      scheduledTime,
      courtId,
    } = body;

    // Validate required fields
    if (!seriesId || !team1Id || !team2Id) {
      return NextResponse.json(
        { error: 'Se requieren seriesId, team1Id y team2Id' },
        { status: 400 }
      );
    }

    if (team1Id === team2Id) {
      return NextResponse.json(
        { error: 'Los equipos deben ser diferentes' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verify series belongs to tournament
    const { data: series, error: seriesError } = await supabase
      .from('tournament_series')
      .select('id, tournament_id')
      .eq('id', seriesId)
      .eq('tournament_id', tournamentId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json(
        { error: 'Serie no encontrada en este torneo' },
        { status: 404 }
      );
    }

    // Check if match already exists between these teams in this series
    const { data: existingMatch } = await supabase
      .from('tournament_matches')
      .select('id')
      .eq('series_id', seriesId)
      .or(`and(team1_id.eq.${team1Id},team2_id.eq.${team2Id}),and(team1_id.eq.${team2Id},team2_id.eq.${team1Id})`)
      .single();

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Ya existe un partido entre estos equipos en esta serie' },
        { status: 400 }
      );
    }

    // Verify both teams are in the series
    const { data: team1InSeries } = await supabase
      .from('tournament_series_teams')
      .select('id')
      .eq('series_id', seriesId)
      .eq('registration_id', team1Id)
      .single();

    const { data: team2InSeries } = await supabase
      .from('tournament_series_teams')
      .select('id')
      .eq('series_id', seriesId)
      .eq('registration_id', team2Id)
      .single();

    if (!team1InSeries || !team2InSeries) {
      return NextResponse.json(
        { error: 'Ambos equipos deben estar en la serie seleccionada' },
        { status: 400 }
      );
    }

    // Create the match
    const { data: newMatch, error: createError } = await supabase
      .from('tournament_matches')
      .insert({
        tournament_id: tournamentId,
        series_id: seriesId,
        team1_id: team1Id,
        team2_id: team2Id,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        court_id: courtId || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating match:', createError);
      return NextResponse.json(
        { error: 'Error al crear el partido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      match: newMatch,
    });
  } catch (error: any) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
