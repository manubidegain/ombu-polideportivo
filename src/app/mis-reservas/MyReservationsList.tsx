'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Reservation = Tables<'reservations'> & {
  courts: { name: string; type: string } | null;
};

interface MyReservationsListProps {
  reservations: Reservation[];
}

export function MyReservationsList({ reservations: initialReservations }: MyReservationsListProps) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [canceling, setCanceling] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async (reservation: Reservation) => {
    // Check if within 24 hours
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    const now = new Date();
    const hoursUntil = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
      alert(
        'No se puede cancelar la reserva con menos de 24 horas de anticipación. Por favor contacta al administrador.'
      );
      return;
    }

    if (!confirm('¿Estás seguro que querés cancelar esta reserva?')) {
      return;
    }

    setCanceling(reservation.id);
    const supabase = createClient();

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation.id);

    if (error) {
      console.error('Error canceling reservation:', error);
      alert('Error al cancelar la reserva.');
      setCanceling(null);
      return;
    }

    setReservations(
      reservations.map((r) => (r.id === reservation.id ? { ...r, status: 'cancelled' as const } : r))
    );
    setCanceling(null);
    router.refresh();
  };

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
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const isPast = (reservation: Reservation) => {
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    return reservationDateTime < new Date();
  };

  const canCancel = (reservation: Reservation) => {
    if (reservation.status !== 'confirmed' && reservation.status !== 'pending') return false;
    if (isPast(reservation)) return false;

    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    const now = new Date();
    const hoursUntil = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const upcomingReservations = reservations.filter((r) => !isPast(r) && r.status !== 'cancelled');
  const pastReservations = reservations.filter((r) => isPast(r) || r.status === 'cancelled');

  if (reservations.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No tenés reservas todavía
        </p>
        <Link
          href="/reservas"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          HACER MI PRIMERA RESERVA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Upcoming Reservations */}
      {upcomingReservations.length > 0 && (
        <div>
          <h2 className="font-heading text-[32px] text-white mb-6">PRÓXIMAS RESERVAS</h2>
          <div className="grid gap-6">
            {upcomingReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`bg-white/5 border-2 rounded-lg p-6 ${getStatusColor(reservation.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="font-heading text-[24px] text-white">
                        {reservation.courts?.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full font-body text-[12px] ${getStatusColor(reservation.status)}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-body text-[12px] text-gray-400">Fecha</p>
                        <p className="font-body text-[16px] text-white">
                          {format(new Date(reservation.reservation_date), "EEEE d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="font-body text-[12px] text-gray-400">Horario</p>
                        <p className="font-body text-[16px] text-white">
                          {reservation.start_time} ({reservation.duration_minutes} min)
                        </p>
                      </div>

                      <div>
                        <p className="font-body text-[12px] text-gray-400">Precio</p>
                        <p className="font-body text-[16px] text-white">${reservation.price}</p>
                      </div>

                      <div>
                        <p className="font-body text-[12px] text-gray-400">Tipo de cancha</p>
                        <p className="font-body text-[16px] text-white">{reservation.courts?.type}</p>
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="mb-4">
                        <p className="font-body text-[12px] text-gray-400">Notas</p>
                        <p className="font-body text-[14px] text-white">{reservation.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      href={`/mis-reservas/${reservation.id}`}
                      className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors text-center"
                    >
                      Gestionar
                    </Link>
                    {canCancel(reservation) ? (
                      <button
                        onClick={() => handleCancel(reservation)}
                        disabled={canceling === reservation.id}
                        className="bg-red-500/20 text-red-400 font-body text-[14px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {canceling === reservation.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    ) : (
                      !isPast(reservation) && (
                        <p className="font-body text-[12px] text-gray-400 max-w-[150px] text-right">
                          No se puede cancelar con menos de 24hs
                        </p>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div>
          <h2 className="font-heading text-[32px] text-white mb-6">HISTORIAL</h2>
          <div className="grid gap-4">
            {pastReservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/mis-reservas/${reservation.id}`}
                className="block bg-white/5 border border-white/10 rounded-lg p-4 opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-heading text-[18px] text-white">
                        {reservation.courts?.name}
                      </h3>
                      <p className="font-body text-[14px] text-gray-400">
                        {format(new Date(reservation.reservation_date), "d 'de' MMM", {
                          locale: es,
                        })}{' '}
                        - {reservation.start_time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-body text-[12px] ${getStatusColor(reservation.status)}`}
                  >
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="text-center">
        <Link
          href="/reservas"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-8 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          + NUEVA RESERVA
        </Link>
      </div>
    </div>
  );
}
