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
    const { dayOfWeek, startTime, endTime, courtId } = body;

    if (dayOfWeek === undefined || !startTime || !endTime || !courtId) {
      return NextResponse.json(
        { error: 'dayOfWeek, startTime, endTime y courtId son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('tournament_time_slots')
      .insert({
        tournament_id: tournamentId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        court_id: courtId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time slot:', error);
      return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 });
    }

    return NextResponse.json({ success: true, timeSlot: data });
  } catch (error) {
    console.error('Error in POST time slots:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');

    if (!slotId) {
      return NextResponse.json({ error: 'slotId es requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { error } = await supabase
      .from('tournament_time_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      console.error('Error deleting time slot:', error);
      return NextResponse.json({ error: 'Error al eliminar horario' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE time slots:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
