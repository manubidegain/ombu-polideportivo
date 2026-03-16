import { NextRequest, NextResponse } from 'next/server';

import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
    }

    // Fetch invitation details
    const supabase = await createServerClient();
    const { data: invitation, error } = await supabase
      .from('tournament_invitations')
      .select(
        `
        *,
        tournaments (
          id,
          name,
          start_date,
          sport_type
        ),
        tournament_categories (
          id,
          name
        )
      `
      )
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Create invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/torneos/invitacion/${invitation.id}`;

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'Polideportivo Ombú <info@ombustudio.com>', // Change to your verified domain in production
      to: invitation.invitee_email,
      subject: `Invitación a torneo: ${invitation.tournaments?.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a Torneo</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                      <td style="background-color: #1b1b1b; padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: #dbf228; font-size: 32px; font-weight: bold;">
                          INVITACIÓN A TORNEO
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          ¡Hola! Has sido invitado a participar en un torneo de ${invitation.tournaments?.sport_type === 'padel' ? 'pádel' : 'fútbol'}.
                        </p>

                        <!-- Tournament Details -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; margin: 30px 0; padding: 20px;">
                          <tr>
                            <td>
                              <h2 style="margin: 0 0 20px; font-size: 24px; color: #1b1b1b;">
                                ${invitation.tournaments?.name}
                              </h2>

                              <table width="100%" cellpadding="8" cellspacing="0">
                                <tr>
                                  <td style="font-weight: bold; color: #666; font-size: 14px;">Equipo:</td>
                                  <td style="color: #333; font-size: 14px;">${invitation.team_name}</td>
                                </tr>
                                <tr>
                                  <td style="font-weight: bold; color: #666; font-size: 14px;">Categoría:</td>
                                  <td style="color: #333; font-size: 14px;">${invitation.tournament_categories?.name}</td>
                                </tr>
                                <tr>
                                  <td style="font-weight: bold; color: #666; font-size: 14px;">Compañero:</td>
                                  <td style="color: #333; font-size: 14px;">${invitation.inviter_email}</td>
                                </tr>
                                ${
                                  invitation.tournaments?.start_date
                                    ? `
                                <tr>
                                  <td style="font-weight: bold; color: #666; font-size: 14px;">Fecha de Inicio:</td>
                                  <td style="color: #333; font-size: 14px;">${new Date(invitation.tournaments.start_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                `
                                    : ''
                                }
                              </table>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 30px 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          Para aceptar o rechazar esta invitación, haz clic en el botón:
                        </p>

                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${invitationUrl}" style="display: inline-block; background-color: #dbf228; color: #1b1b1b; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                VER INVITACIÓN
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 20px 0 0; font-size: 14px; color: #999; text-align: center;">
                          O copia este enlace en tu navegador:<br/>
                          <a href="${invitationUrl}" style="color: #1b1b1b; word-break: break-all;">${invitationUrl}</a>
                        </p>

                        <p style="margin: 30px 0 0; font-size: 12px; color: #999; text-align: center;">
                          Esta invitación expira en 7 días.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                          Polideportivo Ombú
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">
                          Este es un correo automático, por favor no respondas.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json({ error: 'Failed to send email', details: emailError }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in send-tournament-invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
