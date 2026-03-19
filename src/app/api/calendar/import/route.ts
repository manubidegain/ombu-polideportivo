import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listCalendarEvents } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const { courtId, startDate, endDate, splitStrategy } = await request.json();

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

    // Setup split strategy if provided
    // splitStrategy: { type: 'alternate' | 'by-time', courtIds: [courtId1, courtId2], timeThreshold?: 'HH:MM' }
    let targetCourtIds = [court.id];
    let splitType = splitStrategy?.type;
    let timeThreshold = splitStrategy?.timeThreshold;

    if (splitStrategy?.courtIds && splitStrategy.courtIds.length > 1) {
      targetCourtIds = splitStrategy.courtIds;
      console.log(`Using split strategy: ${splitType}, courts:`, targetCourtIds);
    }

    // Track which court to use for alternating strategy
    let currentCourtIndex = 0;

    // Group events by datetime for overlap detection
    const eventsByDateTime = new Map<string, any[]>();

    // Process each event
    for (const event of events) {
      console.log('Processing event:', JSON.stringify(event, null, 2));

      if (!event.start?.dateTime || !event.end?.dateTime || !event.id) {
        console.log('Skipping event - missing required fields');
        skipped++;
        continue;
      }

      const startDateTime = new Date(event.start.dateTime);
      const endDateTime = new Date(event.end.dateTime);

      // Extract date and time
      const reservationDate = startDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().substring(0, 5); // HH:MM
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
      const dayOfWeek = startDateTime.getDay();

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

      // Determine which court to use based on split strategy
      let selectedCourtId = court.id;

      if (targetCourtIds.length > 1) {
        const dateTimeKey = `${reservationDate}-${startTime}`;

        // Get or initialize events at this datetime
        if (!eventsByDateTime.has(dateTimeKey)) {
          eventsByDateTime.set(dateTimeKey, []);
        }
        const eventsAtSameTime = eventsByDateTime.get(dateTimeKey)!;

        if (splitType === 'alternate') {
          // Alternate between courts
          selectedCourtId = targetCourtIds[currentCourtIndex % targetCourtIds.length];
          currentCourtIndex++;
        } else if (splitType === 'by-time' && timeThreshold) {
          // Split by time: before threshold -> court 1, after -> court 2
          if (startTime < timeThreshold) {
            selectedCourtId = targetCourtIds[0];
          } else {
            selectedCourtId = targetCourtIds[1];
          }
        } else if (splitType === 'overlap') {
          // Smart overlap detection: if there's already an event at this time, use the other court
          const courtUsageAtTime = new Map<string, number>();
          eventsAtSameTime.forEach((e: any) => {
            const courtId = e._assignedCourtId;
            courtUsageAtTime.set(courtId, (courtUsageAtTime.get(courtId) || 0) + 1);
          });

          // Find the court with fewer events at this time
          selectedCourtId = targetCourtIds.reduce((minCourtId, courtId) => {
            const currentUsage = courtUsageAtTime.get(courtId) || 0;
            const minUsage = courtUsageAtTime.get(minCourtId) || 0;
            return currentUsage < minUsage ? courtId : minCourtId;
          }, targetCourtIds[0]);
        }

        // Track this event for overlap detection
        (event as any)._assignedCourtId = selectedCourtId;
        eventsAtSameTime.push(event);
      }

      console.log(`Event ${event.id} assigned to court ${selectedCourtId}`);

      // Find or create matching timeslot config FOR THE SELECTED COURT
      let timeslotConfigId: string | null = null;

      // Try to find existing timeslot config
      const { data: existingConfig } = await supabase
        .from('timeslot_configs')
        .select('id')
        .eq('court_id', selectedCourtId)
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', startTime)
        .eq('duration_minutes', durationMinutes)
        .eq('is_active', true)
        .single();

      if (existingConfig) {
        timeslotConfigId = existingConfig.id;
      } else {
        // Create new timeslot config for this time slot on the selected court
        const { data: newConfig, error: configError } = await supabase
          .from('timeslot_configs')
          .insert({
            court_id: selectedCourtId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            duration_minutes: durationMinutes,
            requires_lighting: false,
            max_concurrent_bookings: 1,
            is_active: true,
          })
          .select('id')
          .single();

        if (configError) {
          console.error('Error creating timeslot config:', configError);
          errors++;
          continue;
        }

        timeslotConfigId = newConfig.id;
      }

      // Extract customer info from event
      const summary = event.summary || 'Reserva importada';
      const description = event.description || '';

      // Parse Acuity Scheduling format from description
      // Format: "Nombre: XXX\nTeléfono: XXX\nCorreo electrónico: XXX\nPrecio: XXX"
      let customerName = 'Cliente importado';
      let customerEmail = null;
      let customerPhone = null;
      let price = 0;

      // Try to extract from summary first (format: "Name: ... (Location)")
      const summaryNameMatch = summary.match(/^([^:]+):/);
      if (summaryNameMatch) {
        customerName = summaryNameMatch[1].trim();
      }

      // Parse description for Acuity Scheduling data
      if (description) {
        const nameMatch = description.match(/Nombre:\s*(.+)/);
        const emailMatch = description.match(/Correo electrónico:\s*(.+)/);
        const phoneMatch = description.match(/Teléfono:\s*(.+)/);
        const priceMatch = description.match(/Precio:\s*([\d.,]+)/);

        if (nameMatch) customerName = nameMatch[1].trim();
        if (emailMatch) customerEmail = emailMatch[1].trim();
        if (phoneMatch) customerPhone = phoneMatch[1].trim();
        if (priceMatch) {
          // Convert price string like "1.500,00" to number
          const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
          price = parseFloat(priceStr) || 0;
        }
      }

      // Fallback: try to extract email from attendees if not found in description
      if (!customerEmail && event.attendees?.[0]?.email) {
        customerEmail = event.attendees[0].email;
      }

      console.log('Parsed customer data:', { customerName, customerEmail, customerPhone, price });

      try {
        // Create reservation on the selected court
        const reservationData: any = {
          court_id: selectedCourtId,
          timeslot_config_id: timeslotConfigId,
          reservation_date: reservationDate,
          start_time: startTime,
          duration_minutes: durationMinutes,
          customer_name: customerName,
          customer_email: customerEmail || 'sin-email@importado.com', // Required field
          customer_phone: customerPhone || 'N/A', // Required field
          status: 'confirmed',
          calendar_event_id: event.id,
          notes: `Importado desde Google Calendar\n\n${description}`,
          price: price,
        };

        console.log('Inserting reservation:', JSON.stringify(reservationData, null, 2));

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
