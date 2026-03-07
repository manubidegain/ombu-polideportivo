import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { JoinReservationForm } from './JoinReservationForm';

interface JoinPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function JoinReservationPage({ params }: JoinPageProps) {
  const { token } = await params;
  const supabase = await createServerClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Find reservation by share token
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(
      `
      *,
      courts (name, type),
      user_profiles!reservations_user_id_fkey (full_name, email),
      reservation_players (
        id,
        user_id,
        status,
        invitation_email
      )
    `
    )
    .eq('share_token', token)
    .maybeSingle();

  if (error || !reservation) {
    console.error('Error fetching reservation:', error);
    notFound();
  }

  // Check if reservation is in the past
  const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
  if (reservationDateTime < new Date()) {
    return (
      <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <h1 className="font-heading text-[32px] text-white mb-4">RESERVA FINALIZADA</h1>
          <p className="font-body text-[16px] text-gray-400">
            Esta reserva ya finalizó. No es posible unirse.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is already invited/joined
  const existingPlayer = user
    ? reservation.reservation_players?.find((p) => p.user_id === user.id)
    : null;

  if (existingPlayer) {
    // User is already part of this reservation
    if (existingPlayer.status === 'confirmed') {
      return (
        <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-8 text-center">
            <h1 className="font-heading text-[32px] text-white mb-4">YA ESTÁS DENTRO</h1>
            <p className="font-body text-[16px] text-gray-400 mb-6">
              Ya confirmaste tu asistencia a esta reserva.
            </p>
            <a
              href="/mis-reservas"
              className="inline-block bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors"
            >
              Ir a Mis Reservas
            </a>
          </div>
        </div>
      );
    } else if (existingPlayer.status === 'pending') {
      return (
        <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-8 text-center">
            <h1 className="font-heading text-[32px] text-white mb-4">SOLICITUD PENDIENTE</h1>
            <p className="font-body text-[16px] text-gray-400 mb-6">
              Tu solicitud para unirte está pendiente de aprobación por el organizador.
            </p>
            <a
              href="/mis-reservas"
              className="inline-block bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors"
            >
              Ir a Mis Reservas
            </a>
          </div>
        </div>
      );
    }
  }

  // Get user's email from profile if logged in
  let userEmail = '';
  if (user) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    userEmail = userProfile?.email || '';
  }

  return (
    <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Reservation Details */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h1 className="font-heading text-[32px] text-white mb-6">UNIRSE A RESERVA</h1>

          <div className="space-y-4 mb-6">
            <div>
              <p className="font-body text-[12px] text-gray-400">Cancha</p>
              <p className="font-body text-[18px] text-white">{reservation.courts?.name}</p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Fecha y Hora</p>
              <p className="font-body text-[18px] text-white">
                {new Date(reservation.reservation_date).toLocaleDateString('es-UY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                - {reservation.start_time}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Duración</p>
              <p className="font-body text-[18px] text-white">{reservation.duration_minutes} minutos</p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Organizado por</p>
              <p className="font-body text-[18px] text-white">
                {reservation.user_profiles?.full_name || reservation.customer_name || 'Sin nombre'}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400">Jugadores confirmados</p>
              <p className="font-body text-[18px] text-white">
                {reservation.reservation_players?.filter((p) => p.status === 'confirmed').length || 0}
              </p>
            </div>
          </div>

          {reservation.join_approval_required ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="font-body text-[14px] text-yellow-400">
                <strong>Nota:</strong> El organizador debe aprobar tu solicitud para unirte.
              </p>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="font-body text-[14px] text-green-400">
                <strong>Unión automática:</strong> Serás añadido inmediatamente.
              </p>
            </div>
          )}

          <JoinReservationForm
            reservationId={reservation.id}
            userEmail={userEmail}
            requiresApproval={reservation.join_approval_required || false}
          />
        </div>
      </div>
    </div>
  );
}
