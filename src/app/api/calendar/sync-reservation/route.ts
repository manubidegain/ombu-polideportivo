import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  formatReservationForCalendar,
} from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const { reservationId, action } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }

    // Verify user is authenticated
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reservation with court info
    const { data: reservation } = await supabase
      .from('reservations')
      .select(
        `
        *,
        courts (
          name,
          type,
          calendar_id,
          calendar_sync_enabled
        )
      `
      )
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const court = reservation.courts as {
      name: string;
      type: string;
      calendar_id: string | null;
      calendar_sync_enabled: boolean | null;
    } | null;

    if (!court?.calendar_id || !court?.calendar_sync_enabled) {
      return NextResponse.json(
        { error: 'Court does not have calendar sync enabled' },
        { status: 400 }
      );
    }

    const eventData = formatReservationForCalendar(reservation);

    let result;

    if (action === 'delete' && reservation.calendar_event_id) {
      // Delete calendar event
      result = await deleteCalendarEvent(court.calendar_id, reservation.calendar_event_id);

      if (result.success) {
        // Update reservation to remove calendar event ID
        await supabase
          .from('reservations')
          .update({ calendar_event_id: null })
          .eq('id', reservationId);
      }
    } else if (reservation.calendar_event_id) {
      // Update existing calendar event
      result = await updateCalendarEvent({
        calendarId: court.calendar_id,
        eventId: reservation.calendar_event_id,
        ...eventData,
      });
    } else {
      // Create new calendar event
      result = await createCalendarEvent({
        calendarId: court.calendar_id,
        ...eventData,
      });

      if (result.success && result.eventId) {
        // Store calendar event ID in reservation
        await supabase
          .from('reservations')
          .update({ calendar_event_id: result.eventId })
          .eq('id', reservationId);
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to sync with calendar', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error in calendar sync route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
