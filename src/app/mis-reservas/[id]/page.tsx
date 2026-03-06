import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PlayersManager } from '@/components/reservations/PlayersManager';
import { TeamsManager } from '@/components/reservations/TeamsManager';
import { ShareSettings } from '@/components/reservations/ShareSettings';

interface ReservationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MyReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const currentUserId = user.id;

  const { data: reservation } = await supabase
    .from('reservations')
    .select(
      `
      *,
      courts (name, type),
      user_profiles (full_name, email, phone)
    `
    )
    .eq('id', id)
    .single();

  if (!reservation) {
    notFound();
  }

  // Check if user is owner or invited player
  const isOwner = reservation.user_id === currentUserId;

  const { data: playerInvitation } = await supabase
    .from('reservation_players')
    .select('*')
    .eq('reservation_id', id)
    .eq('user_id', currentUserId)
    .single();

  const isInvited = !!playerInvitation;

  if (!isOwner && !isInvited) {
    // User doesn't have access to this reservation
    redirect('/mis-reservas');
  }

  // Fetch players for this reservation
  const { data: players } = await supabase
    .from('reservation_players')
    .select(
      `
      *,
      user_profiles (full_name, email, phone)
    `
    )
    .eq('reservation_id', id)
    .order('invited_at', { ascending: false });

  // Fetch team configuration
  const { data: teamConfig } = await supabase
    .from('reservation_teams')
    .select('*')
    .eq('reservation_id', id)
    .single();

  // Get confirmed players for team management
  const confirmedPlayers = players?.filter((p) => p.status === 'confirmed') || [];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      completed: 'bg-blue-500/20 text-blue-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/mis-reservas"
            className="inline-flex items-center gap-2 font-body text-[14px] text-gray-400 hover:text-white mb-4"
          >
            ← Volver a mis reservas
          </Link>
          <h1 className="font-heading text-[40px] text-white">DETALLE DE RESERVA</h1>
        </div>

        <div className="space-y-6">
          {/* Status Badge */}
          <div>
            <span
              className={`inline-block px-4 py-2 rounded-full font-body text-[14px] ${getStatusColor(reservation.status)}`}
            >
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          {/* Reservation Details */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
            <h2 className="font-heading text-[24px] text-white">INFORMACIÓN DE LA RESERVA</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Cancha</p>
                <p className="font-body text-[16px] text-white">
                  {reservation.courts?.name}
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Tipo</p>
                <p className="font-body text-[16px] text-white">
                  {reservation.courts?.type}
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Fecha</p>
                <p className="font-body text-[16px] text-white">
                  {new Date(reservation.reservation_date).toLocaleDateString('es-UY', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Horario</p>
                <p className="font-body text-[16px] text-white">
                  {reservation.start_time} ({reservation.duration_minutes} minutos)
                </p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Precio pagado</p>
                <p className="font-body text-[16px] text-white">${reservation.price}</p>
              </div>

              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Fecha de reserva</p>
                <p className="font-body text-[16px] text-white">
                  {new Date(reservation.created_at).toLocaleString('es-UY')}
                </p>
              </div>
            </div>

            {reservation.notes && (
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Notas</p>
                <p className="font-body text-[16px] text-white">{reservation.notes}</p>
              </div>
            )}
          </div>

          {/* Share Settings - Only for owner */}
          {isOwner && (
            <ShareSettings
              reservationId={id}
              shareToken={reservation.share_token}
              joinApprovalRequired={reservation.join_approval_required}
              isOwner={isOwner}
            />
          )}

          {/* Players Manager */}
          <PlayersManager
            reservationId={id}
            reservationOwnerId={reservation.user_id}
            currentUserId={currentUserId}
            initialPlayers={players || []}
          />

          {/* Teams Manager */}
          <TeamsManager
            reservationId={id}
            reservationOwnerId={reservation.user_id}
            currentUserId={currentUserId}
            confirmedPlayers={confirmedPlayers}
            teamConfig={teamConfig}
          />
        </div>
      </div>
    </div>
  );
}
