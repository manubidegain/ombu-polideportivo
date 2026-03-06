import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlayersManager } from '@/components/reservations/PlayersManager';
import { TeamsManager } from '@/components/reservations/TeamsManager';
import { ShareSettings } from '@/components/reservations/ShareSettings';

interface ReservationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

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

  // If this is a recurring reservation, fetch all reservations in the series
  let seriesReservations = null;
  if (reservation.is_recurring) {
    const parentId = reservation.recurrence_parent_id || reservation.id;
    const { data: series } = await supabase
      .from('reservations')
      .select('id, reservation_date, start_time, status')
      .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
      .order('reservation_date', { ascending: true });

    seriesReservations = series;
  }

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
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-2 font-body text-[14px] text-gray-400 hover:text-white mb-4"
        >
          ← Volver a reservas
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

        {/* User Details */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[24px] text-white">INFORMACIÓN DEL CLIENTE</h2>
            {!reservation.user_id && (
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-[12px] font-body">
                RESERVA MANUAL
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Nombre</p>
              <p className="font-body text-[16px] text-white">
                {reservation.user_id
                  ? (reservation.user_profiles?.full_name || reservation.customer_name || 'Sin nombre')
                  : (reservation.customer_name || 'Sin nombre')}
              </p>
            </div>

            <div>
              <p className="font-body text-[12px] text-gray-400 mb-1">Email</p>
              <p className="font-body text-[16px] text-white">
                {reservation.user_id
                  ? (reservation.user_profiles?.email || reservation.customer_email || 'No especificado')
                  : (reservation.customer_email || 'No especificado')}
              </p>
            </div>

            {((reservation.user_id && reservation.user_profiles?.phone) || (!reservation.user_id && reservation.customer_phone)) && (
              <div>
                <p className="font-body text-[12px] text-gray-400 mb-1">Teléfono</p>
                <p className="font-body text-[16px] text-white">
                  {reservation.user_id ? reservation.user_profiles?.phone : reservation.customer_phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Share Settings */}
        <ShareSettings
          reservationId={id}
          shareToken={reservation.share_token}
          joinApprovalRequired={reservation.join_approval_required}
          isOwner={currentUserId === reservation.user_id}
        />

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

        {/* Recurring Series Details */}
        {reservation.is_recurring && seriesReservations && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[24px] text-white">SERIE RECURRENTE</h2>
              <span className="bg-[#dbf228]/20 text-[#dbf228] px-3 py-1 rounded text-[12px] font-body">
                {seriesReservations.length} RESERVAS EN LA SERIE
              </span>
            </div>

            <div className="space-y-2">
              <p className="font-body text-[14px] text-gray-400">
                Esta reserva es parte de una serie recurrente. A continuación se muestran todas las reservas de la serie:
              </p>

              <div className="mt-4 space-y-2">
                {seriesReservations.map((seriesItem) => {
                  const isCurrent = seriesItem.id === reservation.id;
                  const statusColor =
                    seriesItem.status === 'confirmed'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : seriesItem.status === 'cancelled'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : seriesItem.status === 'pending'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400';

                  return (
                    <Link
                      key={seriesItem.id}
                      href={`/admin/reservations/${seriesItem.id}`}
                      className={`block p-3 rounded-md border transition-colors ${
                        isCurrent
                          ? 'bg-[#dbf228]/20 border-[#dbf228]/50 hover:bg-[#dbf228]/30'
                          : statusColor + ' hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-body text-[14px]">
                            {new Date(seriesItem.reservation_date).toLocaleDateString('es-UY', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="font-body text-[14px]">{seriesItem.start_time}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-body bg-[#dbf228]/30 px-2 py-0.5 rounded">
                              ACTUAL
                            </span>
                          )}
                        </div>
                        <span className="font-body text-[12px] capitalize">
                          {getStatusLabel(seriesItem.status)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
