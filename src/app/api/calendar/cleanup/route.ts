import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listCalendarEvents, deleteCalendarEvent } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const { courtId, startDate, endDate, deleteAll = false } = await request.json();

    // Verify user is authenticated and is admin
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Se requiere acceso de administrador' }, { status: 403 });
    }

    // Get court info
    const { data: court } = await supabase
      .from('courts')
      .select('id, name, calendar_id, calendar_sync_enabled')
      .eq('id', courtId)
      .single();

    if (!court) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 });
    }

    if (!court.calendar_id || !court.calendar_sync_enabled) {
      return NextResponse.json(
        { error: 'La cancha no tiene sincronización de calendario habilitada' },
        { status: 400 }
      );
    }

    // Fetch events from Google Calendar
    const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : undefined;

    const result = await listCalendarEvents(court.calendar_id, timeMin, timeMax);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al obtener eventos del calendario', details: result.error },
        { status: 500 }
      );
    }

    const events = result.events;
    let deleted = 0;
    let skipped = 0;
    let errors = 0;

    // Process each event
    for (const event of events) {
      if (!event.id) {
        skipped++;
        continue;
      }

      // If deleteAll is false, only delete events created by our system
      if (!deleteAll) {
        // Check if this event has a matching reservation in our DB
        const { data: reservation } = await supabase
          .from('reservations')
          .select('id')
          .eq('calendar_event_id', event.id)
          .single();

        // Skip events that don't have a matching reservation (external events)
        if (!reservation) {
          skipped++;
          continue;
        }
      }

      try {
        const deleteResult = await deleteCalendarEvent(court.calendar_id, event.id);

        if (deleteResult.success) {
          deleted++;

          // Also delete from our database if it exists
          await supabase
            .from('reservations')
            .delete()
            .eq('calendar_event_id', event.id);
        } else {
          console.error('Error deleting event:', event.id, deleteResult.error);
          errors++;
        }
      } catch (err) {
        console.error('Error processing event:', err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: events.length,
        deleted,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('Error in calendar cleanup route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
