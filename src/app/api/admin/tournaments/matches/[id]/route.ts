import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: matchId } = await params;
    const body = await request.json();
    const { score, winnerId, status } = body;

    if (!score || !winnerId || !status) {
      return NextResponse.json(
        { error: 'Se requieren score, winnerId y status' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get the match to extract series_id and team IDs
    const { data: match, error: matchError } = await supabase
      .from('tournament_matches')
      .select('series_id, team1_id, team2_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    // Update the match
    const { error: updateError } = await supabase
      .from('tournament_matches')
      .update({
        score,
        winner_id: winnerId,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('Error updating match:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar partido' },
        { status: 500 }
      );
    }

    // Note: Stats in tournament_series_teams will be recalculated on-the-fly
    // by the standings endpoint using the ranking-calculator library.
    // We don't need to maintain incremental stats here.

    return NextResponse.json({
      success: true,
      matchId,
      winnerId,
    });
  } catch (error: any) {
    console.error('Error updating match result:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
