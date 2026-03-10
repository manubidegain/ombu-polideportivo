import { es } from 'date-fns/locale';
import { format } from 'date-fns';

interface BookingConfirmationData {
  userName: string;
  userEmail: string;
  courtName: string;
  date: string;
  startTime: string;
  duration: number;
  price: number;
}

export function getBookingConfirmationHTML(data: BookingConfirmationData): string {
  const formattedDate = format(new Date(data.date), "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const endTime = calculateEndTime(data.startTime, data.duration);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - Polideportivo Ombú</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1b1b1b; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #dbf228; font-size: 32px; font-weight: bold;">
                ¡RESERVA CONFIRMADA!
              </h1>
            </td>
          </tr>

          <!-- Checkmark Icon -->
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #dbf228; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1b1b1b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333333; text-align: center;">
                Hola <strong>${data.userName}</strong>,
              </p>
              <p style="margin: 10px 0 0; font-size: 16px; color: #666666; text-align: center;">
                Tu reserva ha sido confirmada con éxito.
              </p>
            </td>
          </tr>

          <!-- Reservation Details -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Cancha:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.courtName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Fecha:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${formattedDate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Horario:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.startTime} - ${endTime} (${data.duration} min)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="color: #666666; font-size: 14px;">Precio:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <strong style="color: #dbf228; font-size: 24px;">$${data.price}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Info -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <div style="background-color: #fff9e6; border: 1px solid #dbf228; border-radius: 8px; padding: 16px; text-align: center;">
              </div>
            </td>
          </tr>

          <!-- Location Info -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <h3 style="margin: 0 0 16px; color: #1b1b1b; font-size: 18px; font-weight: bold;">
                📍 Ubicación
              </h3>
              <p style="margin: 0; color: #666666; font-size: 14px;">
                Polideportivo Ombú<br>
                Martín Salaberry 2831<br>
                Durazno, Uruguay
              </p>
              <p style="margin: 16px 0 0;">
                <a href="https://maps.google.com/?q=Martín+Salaberry+2831,+Durazno" style="display: inline-block; padding: 12px 24px; background-color: #1b1b1b; color: #dbf228; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  Ver en Google Maps
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ¿Necesitás cancelar? Podés hacerlo hasta 24 horas antes de tu reserva.
              </p>
              <p style="margin: 16px 0 0; color: #999999; font-size: 12px;">
                Polideportivo Ombú - Durazno, Uruguay<br>
                WhatsApp: <a href="https://wa.me/59895303311" style="color: #dbf228; text-decoration: none;">+598 95 303 311</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

interface MatchAssignmentData {
  playerName: string;
  playerEmail: string;
  tournamentName: string;
  teamName: string;
  opponentName: string;
  date: string;
  time: string;
  courtName: string;
  seriesName?: string;
  matchUrl: string;
}

export function getMatchAssignmentHTML(data: MatchAssignmentData): string {
  const formattedDate = format(new Date(data.date), "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Partido Asignado - ${data.tournamentName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1b1b1b; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #dbf228; font-size: 32px; font-weight: bold;">
                ¡PARTIDO ASIGNADO!
              </h1>
            </td>
          </tr>

          <!-- Trophy Icon -->
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #dbf228; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 48px;">
                🏆
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333333; text-align: center;">
                Hola <strong>${data.playerName}</strong>,
              </p>
              <p style="margin: 10px 0 0; font-size: 16px; color: #666666; text-align: center;">
                Se ha programado un nuevo partido para tu equipo en <strong>${data.tournamentName}</strong>
              </p>
            </td>
          </tr>

          <!-- Match Details -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      ${data.seriesName ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Serie:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.seriesName}</strong>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Tu Equipo:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.teamName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Oponente:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.opponentName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Fecha:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${formattedDate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <span style="color: #666666; font-size: 14px;">Hora:</span>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
                          <strong style="color: #1b1b1b; font-size: 16px;">${data.time}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="color: #666666; font-size: 14px;">Cancha:</span>
                        </td>
                        <td style="padding: 12px 0; text-align: right;">
                          <strong style="color: #dbf228; font-size: 18px;">${data.courtName}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="${data.matchUrl}" style="display: inline-block; padding: 16px 32px; background-color: #dbf228; color: #1b1b1b; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                VER PARTIDO
              </a>
            </td>
          </tr>

          <!-- Important Info -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <div style="background-color: #fff9e6; border: 1px solid #dbf228; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; color: #666666; font-size: 14px; text-align: center;">
                  <strong>Importante:</strong> Recordá llegar con 10 minutos de anticipación.<br>
                  El día del partido podrás cargar el resultado desde Mis Torneos.
                </p>
              </div>
            </td>
          </tr>

          <!-- Location Info -->
          <tr>
            <td style="padding: 0 30px 40px;">
              <h3 style="margin: 0 0 16px; color: #1b1b1b; font-size: 18px; font-weight: bold;">
                📍 Ubicación
              </h3>
              <p style="margin: 0; color: #666666; font-size: 14px;">
                Polideportivo Ombú<br>
                Martín Salaberry 2831<br>
                Durazno, Uruguay
              </p>
              <p style="margin: 16px 0 0;">
                <a href="https://maps.google.com/?q=Martín+Salaberry+2831,+Durazno" style="display: inline-block; padding: 12px 24px; background-color: #1b1b1b; color: #dbf228; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                  Ver en Google Maps
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                ¡Mucha suerte en tu partido!
              </p>
              <p style="margin: 16px 0 0; color: #999999; font-size: 12px;">
                Polideportivo Ombú - Durazno, Uruguay<br>
                WhatsApp: <a href="https://wa.me/59895303311" style="color: #dbf228; text-decoration: none;">+598 95 303 311</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
