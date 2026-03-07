import { google } from 'googleapis';
import { createServerClient } from './supabase/server';

// Initialize Google Calendar API client with tenant-specific tokens
export async function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Get active OAuth tokens from database
  const supabase = await createServerClient();
  const { data: token } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('is_active', true)
    .single();

  if (token) {
    auth.setCredentials({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type,
      expiry_date: token.expiry_date,
    });

    // Set up automatic token refresh
    auth.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Update both tokens
        await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: tokens.access_token!,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          })
          .eq('id', token.id);
      } else {
        // Update only access token
        await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: tokens.access_token!,
            expiry_date: tokens.expiry_date,
          })
          .eq('id', token.id);
      }
    });
  }

  return google.calendar({ version: 'v3', auth });
}

// Get OAuth2 client for authorization flow
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

interface CreateEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
  attendees?: string[]; // Array of email addresses
}

export async function createCalendarEvent(params: CreateEventParams) {
  const calendar = await getCalendarClient();

  try {
    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startDateTime,
        timeZone: 'America/Montevideo', // Uruguay timezone
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: 'America/Montevideo',
      },
      attendees: params.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: event,
    });

    return { success: true, eventId: response.data.id, data: response.data };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error };
  }
}

interface UpdateEventParams extends CreateEventParams {
  eventId: string;
}

export async function updateCalendarEvent(params: UpdateEventParams) {
  const calendar = await getCalendarClient();

  try {
    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startDateTime,
        timeZone: 'America/Montevideo',
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: 'America/Montevideo',
      },
      attendees: params.attendees?.map((email) => ({ email })),
    };

    const response = await calendar.events.update({
      calendarId: params.calendarId,
      eventId: params.eventId,
      requestBody: event,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { success: false, error };
  }
}

export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  const calendar = await getCalendarClient();

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error };
  }
}

export async function listCalendars() {
  const calendar = await getCalendarClient();

  try {
    const response = await calendar.calendarList.list();
    return { success: true, calendars: response.data.items };
  } catch (error) {
    console.error('Error listing calendars:', error);
    return { success: false, error };
  }
}

// Helper to format reservation data for calendar event
export function formatReservationForCalendar(reservation: {
  reservation_date: string;
  start_time: string;
  duration_minutes: number;
  courts?: { name: string; type: string } | null;
  customer_name: string | null;
  customer_email: string | null;
  notes: string | null;
}) {
  const startDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
  const endDateTime = new Date(startDateTime.getTime() + reservation.duration_minutes * 60000);

  const courtName = reservation.courts?.name || 'Cancha';
  const courtType = reservation.courts?.type || '';

  const customerName = reservation.customer_name || 'Sin nombre';

  // Format time as HH:MM (e.g., "23:00")
  const timeStr = reservation.start_time.substring(0, 5);

  // Format duration (e.g., "1 hora", "1:30 horas")
  const hours = Math.floor(reservation.duration_minutes / 60);
  const minutes = reservation.duration_minutes % 60;
  let durationStr = '';
  if (hours > 0 && minutes > 0) {
    durationStr = `${hours}:${minutes.toString().padStart(2, '0')} horas`;
  } else if (hours > 0) {
    durationStr = `${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    durationStr = `${minutes} min`;
  }

  return {
    summary: `${courtName} (${customerName}) ${durationStr}`,
    description: `
Cliente: ${customerName}
Email: ${reservation.customer_email || 'Sin email'}
Cancha: ${courtName} ${courtType}
${reservation.notes ? `Notas: ${reservation.notes}` : ''}

Reserva creada desde Polideportivo Ombú
    `.trim(),
    location: `Polideportivo Ombú, Durazno`,
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    attendees: reservation.customer_email ? [reservation.customer_email] : [],
  };
}
