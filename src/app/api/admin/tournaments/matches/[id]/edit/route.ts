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
    const { scheduledDate, scheduledTime, courtId } = body;

    const supabase = await createServerClient();

    // Update the match
    const { error: updateError } = await supabase
      .from('tournament_matches')
      .update({
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        court_id: courtId || null,
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

    return NextResponse.json({
      success: true,
      matchId,
    });
  } catch (error: any) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
