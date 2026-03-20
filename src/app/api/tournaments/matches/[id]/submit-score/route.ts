import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { score } = await request.json();

    if (!score || !score.sets || score.sets.length === 0) {
      return NextResponse.json(
        { error: 'Resultado inválido' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get match details
    const { data: matchData, error: matchError } = await supabase
      .from('tournament_matches')
      .select(
        `
        id,
        team1_id,
        team2_id,
        tournament_id,
        team1:tournament_registrations!tournament_matches_team1_id_fkey(player1_id, player2_id),
        team2:tournament_registrations!tournament_matches_team2_id_fkey(player1_id, player2_id)
      `
      )
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      );
    }

    const match: any = matchData;

    // Verify user is part of this match
    const isTeam1 = match.team1?.player1_id === user.id || match.team1?.player2_id === user.id;
    const isTeam2 = match.team2?.player1_id === user.id || match.team2?.player2_id === user.id;

    if (!isTeam1 && !isTeam2) {
      return NextResponse.json(
        { error: 'No tenés permiso para cargar el resultado de este partido' },
        { status: 403 }
      );
    }

    // Update match with score
    const { error: updateError } = await supabase
      .from('tournament_matches')
      .update({
        score,
        score_status: 'pending_approval',
        score_submitted_by: user.id,
        score_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) throw updateError;

    // TODO: Send notification to rival team and admins

    return NextResponse.json({
      success: true,
      message: 'Resultado enviado para aprobación',
    });
  } catch (error: any) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar resultado' },
      { status: 500 }
    );
  }
}
