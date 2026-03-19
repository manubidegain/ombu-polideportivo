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
      .eq('registration_id', registrationId);

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

// Add or remove unavailability
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, timeSlotId, action, reason } = body;

    if (!registrationId || !timeSlotId || !action) {
      return NextResponse.json(
        { error: 'registrationId, timeSlotId y action son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    if (action === 'add') {
      // Add unavailability
      const { error } = await supabase.from('tournament_team_unavailability').insert({
        registration_id: registrationId,
        time_slot_id: timeSlotId,
        reason: reason || null,
      });

      if (error) {
        console.error('Error adding unavailability:', error);
        return NextResponse.json({ error: 'Error al agregar restricción' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'remove') {
      // Remove unavailability
      const { error } = await supabase
        .from('tournament_team_unavailability')
        .delete()
        .eq('registration_id', registrationId)
        .eq('time_slot_id', timeSlotId);

      if (error) {
        console.error('Error removing unavailability:', error);
        return NextResponse.json({ error: 'Error al eliminar restricción' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST unavailability:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
