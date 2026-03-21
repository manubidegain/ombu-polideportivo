import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const user = await getCurrentUser();

    // Check if user is admin
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Verify match exists and belongs to this tournament
    const { data: match, error: fetchError } = await supabase
      .from('tournament_matches')
      .select('id, tournament_id')
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      );
    }

    if (match.tournament_id !== tournamentId) {
      return NextResponse.json(
        { error: 'El partido no pertenece a este torneo' },
        { status: 400 }
      );
    }

    // Delete the match
    const { error: deleteError } = await supabase
      .from('tournament_matches')
      .delete()
      .eq('id', matchId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar partido' },
      { status: 500 }
    );
  }
}
