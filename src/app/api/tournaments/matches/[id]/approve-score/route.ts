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

    const { action, reason, editedScore } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
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
        score_submitted_by,
        score_status,
        score,
        series_id,
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

    // Check if score is pending approval
    if (match.score_status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Este partido no tiene un resultado pendiente de aprobación' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = user.user_metadata?.role === 'admin';

    // Check if user is the rival team (not the one who submitted)
    const isTeam1 = match.team1?.player1_id === user.id || match.team1?.player2_id === user.id;
    const isTeam2 = match.team2?.player1_id === user.id || match.team2?.player2_id === user.id;
    const submitterIsTeam1 = match.team1?.player1_id === match.score_submitted_by || match.team1?.player2_id === match.score_submitted_by;
    const submitterIsTeam2 = match.team2?.player1_id === match.score_submitted_by || match.team2?.player2_id === match.score_submitted_by;

    const isRivalTeam =
      (submitterIsTeam1 && isTeam2) || (submitterIsTeam2 && isTeam1);

    if (!isAdmin && !isRivalTeam) {
      return NextResponse.json(
        {
          error:
            'Solo el equipo rival o un administrador pueden aprobar el resultado',
        },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Use edited score if provided, otherwise use existing score
      const finalScore = editedScore || match.score;

      // Calculate winner from score
      const setsWon = finalScore.sets.reduce(
        (acc: any, set: any) => {
          if (set.team1 > set.team2) acc.team1++;
          else if (set.team2 > set.team1) acc.team2++;
          return acc;
        },
        { team1: 0, team2: 0 }
      );

      const winnerId =
        setsWon.team1 > setsWon.team2 ? match.team1_id : match.team2_id;

      // Update match status
      const { error: updateError } = await supabase
        .from('tournament_matches')
        .update({
          status: 'completed',
          score_status: 'approved',
          score_approved_by: user.id,
          score_approved_at: new Date().toISOString(),
          winner_id: winnerId,
          score: finalScore, // Use the final score (edited or original)
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Resultado aprobado correctamente',
      });
    } else {
      // Reject
      const { error: updateError } = await supabase
        .from('tournament_matches')
        .update({
          score: null,
          score_status: 'not_submitted',
          score_submitted_by: null,
          score_submitted_at: null,
          rejection_reason: reason || 'Resultado rechazado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // TODO: Send notification to submitter

      return NextResponse.json({
        success: true,
        message: 'Resultado rechazado',
      });
    }
  } catch (error: any) {
    console.error('Error approving/rejecting score:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la aprobación' },
      { status: 500 }
    );
  }
}
