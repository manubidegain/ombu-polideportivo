import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { invitationEmail, reservationId, userExists } = await request.json();

    // Verify the request is authenticated
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reservation details
    const { data: reservation } = await supabase
      .from('reservations')
      .select(
        `
        *,
        courts (name, type),
        user_profiles (full_name)
      `
      )
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Get the invitation token
    const { data: invitation } = await supabase
      .from('reservation_players')
      .select('invitation_token, id')
      .eq('reservation_id', reservationId)
      .eq('invitation_email', invitationEmail)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const organizerName = reservation.user_profiles?.full_name || 'Un organizador';
    const courtName = reservation.courts?.name || 'Cancha';
    const courtType = reservation.courts?.type || '';
    const date = new Date(reservation.reservation_date).toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = reservation.start_time;

    // Build the email content
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/mis-reservas/${reservationId}`;

    const emailHtml = userExists
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #1b1b1b;
              color: #dbf228;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #dbf228;
              color: #1b1b1b;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .details {
              background: white;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .details p {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Polideportivo Ombú</h1>
          </div>
          <div class="content">
            <h2>¡Te invitaron a jugar!</h2>
            <p><strong>${organizerName}</strong> te ha invitado a unirte a una reserva:</p>

            <div class="details">
              <p><strong>Cancha:</strong> ${courtName} ${courtType}</p>
              <p><strong>Fecha:</strong> ${date}</p>
              <p><strong>Hora:</strong> ${time}</p>
            </div>

            <p>Ingresá a tu cuenta para aceptar o rechazar la invitación:</p>

            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">Ver Invitación</a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Si no podés hacer clic en el botón, copiá y pegá este enlace en tu navegador:<br>
              <a href="${acceptUrl}">${acceptUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>Este email fue enviado desde Polideportivo Ombú - Durazno</p>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #1b1b1b;
              color: #dbf228;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #dbf228;
              color: #1b1b1b;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
            .details {
              background: white;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .details p {
              margin: 8px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
            .info-box {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Polideportivo Ombú</h1>
          </div>
          <div class="content">
            <h2>¡Te invitaron a jugar!</h2>
            <p><strong>${organizerName}</strong> te ha invitado a unirte a una reserva:</p>

            <div class="details">
              <p><strong>Cancha:</strong> ${courtName} ${courtType}</p>
              <p><strong>Fecha:</strong> ${date}</p>
              <p><strong>Hora:</strong> ${time}</p>
            </div>

            <div class="info-box">
              <p><strong>📝 Necesitás crear una cuenta</strong></p>
              <p>Para aceptar esta invitación, primero tenés que registrarte en Polideportivo Ombú.</p>
            </div>

            <p>Hacé clic en el botón para registrarte y aceptar la invitación:</p>

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Registrarse y Aceptar</a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Si no podés hacer clic en el botón, copiá y pegá este enlace en tu navegador:<br>
              <a href="${loginUrl}">${loginUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>Este email fue enviado desde Polideportivo Ombú - Durazno</p>
          </div>
        </body>
        </html>
      `;

    // Send email using Resend
    // In development, use onboarding@resend.dev
    // In production, use your verified domain
    const fromEmail =
      process.env.NODE_ENV === 'production'
        ? 'Polideportivo Ombú <invitaciones@ombupolideportivo.com>'
        : 'Polideportivo Ombú <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [invitationEmail],
      subject: `Invitación a jugar en ${courtName} - ${date}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Error in send-invitation route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
