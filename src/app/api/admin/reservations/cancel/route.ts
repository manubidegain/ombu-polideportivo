import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { deleteCalendarEvent } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { reservationId, cancelAll = false } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId es requerido' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Get reservation details including court calendar info
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        courts (
          calendar_id,
          calendar_sync_enabled
        )
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    let idsToCancel = [reservationId];
    let calendarEventsToDelete: Array<{ calendar_id: string; event_id: string }> = [];

    // If cancelAll, get all future reservations in the series
    if (cancelAll && reservation.is_recurring) {
      const parentId = reservation.recurrence_parent_id || reservationId;
      const { data: futureReservations } = await supabase
        .from('reservations')
        .select('id, calendar_event_id')
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
        .gte('reservation_date', new Date().toISOString().split('T')[0]);

      if (futureReservations) {
        idsToCancel = futureReservations.map((r) => r.id);

        // Collect calendar events to delete
        futureReservations.forEach((r) => {
          if (r.calendar_event_id && reservation.courts?.calendar_id) {
            calendarEventsToDelete.push({
              calendar_id: reservation.courts.calendar_id,
              event_id: r.calendar_event_id,
            });
          }
        });
      }
    } else {
      // Single reservation - add to calendar delete list if synced
      if (
        reservation.calendar_event_id &&
        reservation.courts?.calendar_id &&
        reservation.courts?.calendar_sync_enabled
      ) {
        calendarEventsToDelete.push({
          calendar_id: reservation.courts.calendar_id,
          event_id: reservation.calendar_event_id,
        });
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .in('id', idsToCancel);

    if (deleteError) {
      console.error('Error deleting reservations:', deleteError);
      return NextResponse.json({ error: 'Error al cancelar reserva(s)' }, { status: 500 });
    }

    // Delete from Google Calendar (best effort - don't fail if this errors)
    let calendarErrors = 0;
    for (const { calendar_id, event_id } of calendarEventsToDelete) {
      try {
        const result = await deleteCalendarEvent(calendar_id, event_id);
        if (!result.success) {
          console.error(
            `Failed to delete calendar event ${event_id}:`,
            result.error
          );
          calendarErrors++;
        }
      } catch (err) {
        console.error(`Error deleting calendar event ${event_id}:`, err);
        calendarErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      canceledCount: idsToCancel.length,
      calendarErrors: calendarErrors > 0 ? calendarErrors : undefined,
    });
  } catch (error) {
    console.error('Error in cancel reservation route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
