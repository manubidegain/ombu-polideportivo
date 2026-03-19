import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    const supabase = await createServerClient();

    const { data: timeSlots, error } = await supabase
      .from('tournament_time_slots')
      .select(
        `
        *,
        courts (
          name
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
    }

    return NextResponse.json({ timeSlots });
  } catch (error) {
    console.error('Error in GET time slots:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
