import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listCalendarEvents } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const { courtId, startDate, endDate } = await request.json();

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
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process each event
    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime || !event.id) {
        skipped++;
        continue;
      }

      const startDateTime = new Date(event.start.dateTime);
      const endDateTime = new Date(event.end.dateTime);

      // Extract date and time
      const reservationDate = startDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().substring(0, 5); // HH:MM
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

      // Check if reservation already exists with this calendar_event_id
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('id')
        .eq('calendar_event_id', event.id)
        .single();

      if (existingReservation) {
        skipped++;
        continue;
      }

      // Extract customer info from event
      const summary = event.summary || 'Reserva importada';
      const description = event.description || '';

      // Try to extract customer name from summary (format: "CourtName (CustomerName) Duration")
      const nameMatch = summary.match(/\(([^)]+)\)/);
      const customerName = nameMatch ? nameMatch[1] : summary;

      // Try to extract email from attendees
      const customerEmail = event.attendees?.[0]?.email || null;

      try {
        // Create reservation
        const reservationData: any = {
          court_id: court.id,
          reservation_date: reservationDate,
          start_time: startTime,
          duration_minutes: durationMinutes,
          customer_name: customerName,
          status: 'confirmed',
          calendar_event_id: event.id,
          notes: `Importado desde Google Calendar\n\n${description}`,
          price: 0, // Price unknown from calendar
        };

        if (customerEmail) {
          reservationData.customer_email = customerEmail;
        }

        const { error: insertError } = await supabase.from('reservations').insert(reservationData);

        if (insertError) {
          console.error('Error inserting reservation:', insertError);
          errors++;
        } else {
          imported++;
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
        imported,
        skipped,
        errors,
      },
    });
  } catch (error) {
    console.error('Error in calendar import route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
