import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';

// Get unavailability for a registration
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Get unavailability
    const { data: unavailability, error } = await supabase
      .from('tournament_team_unavailability')
      .select('*')
      .eq('registration_id', registrationId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching unavailability:', error);
      return NextResponse.json({ error: 'Error al obtener restricciones' }, { status: 500 });
    }

    return NextResponse.json({ unavailability });
  } catch (error) {
    console.error('Error in GET unavailability:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Delete unavailability
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();

    const { error } = await supabase
      .from('tournament_team_unavailability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting unavailability:', error);
      return NextResponse.json({ error: 'Error al eliminar restricción' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE unavailability:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Add unavailability
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, dayOfWeek, startTime, endTime, reason } = body;

    if (registrationId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'registrationId, dayOfWeek, startTime y endTime son requeridos' },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'dayOfWeek debe estar entre 0 y 6' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Add unavailability
    const { error } = await supabase.from('tournament_team_unavailability').insert({
      registration_id: registrationId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      reason: reason || null,
    });

    if (error) {
      console.error('Error adding unavailability:', error);
      return NextResponse.json({
        error: 'Error al agregar restricción',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST unavailability:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
