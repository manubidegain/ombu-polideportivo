'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Reservation = Tables<'reservations'> & {
  courts: { name: string } | null;
  user_profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};
type Court = Tables<'courts'>;

interface ReservationsListProps {
  initialReservations: Reservation[];
  courts: Court[];
}

export function ReservationsList({ initialReservations, courts }: ReservationsListProps) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [filterCourt, setFilterCourt] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<'all' | 'future' | 'past'>('all');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'manual'>('all');
  const [groupRecurring, setGroupRecurring] = useState<boolean>(true);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [canceling, setCanceling] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async (id: string) => {
    setCanceling(id);
    const supabase = createClient();

    // Check if this is a recurring reservation
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) return;

    let cancelAll = false;

    if (reservation.is_recurring) {
      const parentId = reservation.recurrence_parent_id || id;

      // Count how many reservations are in this series
      const { data: seriesReservations, error: countError } = await supabase
        .from('reservations')
        .select('id, reservation_date, status')
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
        .in('status', ['confirmed', 'pending']);

      if (countError) {
        console.error('Error checking series:', countError);
      }

      const futureReservations = seriesReservations?.filter(
        (r) => new Date(r.reservation_date) >= new Date(reservation.reservation_date)
      ) || [];

      if (futureReservations.length > 1) {
        const message = `Esta reserva es parte de una serie recurrente.\n\n¿Qué deseas cancelar?\n\n- OK: Cancelar solo esta reserva\n- Cancelar: No cancelar nada\n\n(Luego te preguntaremos si quieres cancelar toda la serie)`;

        if (!confirm(message)) {
          setCanceling(null);
          return;
        }

        const cancelSeries = confirm(
          `¿Quieres cancelar TODA la serie recurrente?\n\nSe cancelarán ${futureReservations.length} reserva(s) futuras incluyendo esta.`
        );

        if (cancelSeries) {
          cancelAll = true;
        }
      } else {
        if (!confirm('¿Estás seguro que quieres cancelar esta reserva?')) {
          setCanceling(null);
          return;
        }
      }
    } else {
      if (!confirm('¿Estás seguro que quieres cancelar esta reserva?')) {
        setCanceling(null);
        return;
      }
    }

    if (cancelAll) {
      // Cancel all future reservations in the series
      const parentId = reservation.recurrence_parent_id || id;
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          is_recurring: false,
          recurrence_parent_id: null
        })
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
        .gte('reservation_date', reservation.reservation_date)
        .in('status', ['confirmed', 'pending']);

      if (error) {
        console.error('Error canceling series:', error);
        alert('Error al cancelar la serie de reservas.');
        setCanceling(null);
        return;
      }

      // Refresh the entire list
      router.refresh();
    } else {
      // Cancel only this reservation
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          is_recurring: false,
          recurrence_parent_id: null
        })
        .eq('id', id);

      if (error) {
        console.error('Error canceling reservation:', error);
        alert('Error al cancelar la reserva.');
        setCanceling(null);
        return;
      }

      // Update local state
      setReservations(
        reservations.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r))
      );
    }

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
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      completed: 'bg-blue-500/20 text-blue-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  // Group recurring reservations by parent
  const groupReservations = (reservations: Reservation[]) => {
    if (!groupRecurring) return reservations.map((r) => ({ type: 'single' as const, reservation: r }));

    const grouped: Array<{ type: 'single' | 'series'; reservation: Reservation; seriesData?: { count: number; futureCount: number; lastDate: string } }> = [];
    const processedParents = new Set<string>();

    for (const reservation of reservations) {
      const parentId = reservation.recurrence_parent_id || (reservation.is_recurring ? reservation.id : null);

      if (!parentId) {
        // Not recurring, add as single
        grouped.push({ type: 'single', reservation });
        continue;
      }

      if (processedParents.has(parentId)) {
        // Already processed this series
        continue;
      }

      // Find all reservations in this series
      const seriesReservations = reservations.filter(
        (r) => r.id === parentId || r.recurrence_parent_id === parentId
      );

      const today = new Date().toISOString().split('T')[0];
      const futureReservations = seriesReservations.filter((r) => r.reservation_date >= today);
      const sortedSeries = [...seriesReservations].sort((a, b) =>
        a.reservation_date.localeCompare(b.reservation_date)
      );

      // Use the earliest reservation as the representative
      const representative = sortedSeries[0];
      const lastDate = sortedSeries[sortedSeries.length - 1].reservation_date;

      grouped.push({
        type: 'series',
        reservation: representative,
        seriesData: {
          count: seriesReservations.length,
          futureCount: futureReservations.length,
          lastDate,
        },
      });

      processedParents.add(parentId);
    }

    return grouped;
  };

  const filteredReservations = reservations.filter((reservation) => {
    // Filter by court
    if (filterCourt && reservation.court_id !== filterCourt) return false;

    // Filter by status
    if (filterStatus && reservation.status !== filterStatus) return false;

    // Filter by date (past/future)
    const today = new Date().toISOString().split('T')[0];
    if (filterDate === 'future' && reservation.reservation_date < today) return false;
    if (filterDate === 'past' && reservation.reservation_date >= today) return false;

    // Filter by type (user vs manual)
    if (filterType === 'user' && !reservation.user_id) return false;
    if (filterType === 'manual' && reservation.user_id) return false;

    // Search by name, email, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = reservation.customer_name?.toLowerCase().includes(query);
      const matchesEmail = reservation.customer_email?.toLowerCase().includes(query);
      const matchesPhone = reservation.customer_phone?.toLowerCase().includes(query);
      const matchesProfileName = reservation.user_profiles?.full_name?.toLowerCase().includes(query);
      const matchesProfileEmail = reservation.user_profiles?.email?.toLowerCase().includes(query);
      const matchesProfilePhone = reservation.user_profiles?.phone?.toLowerCase().includes(query);

      if (!matchesName && !matchesEmail && !matchesPhone &&
          !matchesProfileName && !matchesProfileEmail && !matchesProfilePhone) {
        return false;
      }
    }

    return true;
  });

  const groupedReservations = groupReservations(filteredReservations);

  if (reservations.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No hay reservas próximas
        </p>
        <Link
          href="/admin/reservations/new"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          CREAR PRIMERA RESERVA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <label className="block font-body text-[12px] text-gray-400 mb-2">
          Buscar por nombre, email o teléfono
        </label>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
        />
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por cancha
            </label>
            <select
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="">Todas las canchas</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por fecha
            </label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value as 'all' | 'future' | 'past')}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="all">Todas las fechas</option>
              <option value="future">Futuras</option>
              <option value="past">Pasadas</option>
            </select>
          </div>

          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Filtrar por tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'user' | 'manual')}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            >
              <option value="all">Todas</option>
              <option value="user">Usuario</option>
              <option value="manual">Manual (Admin)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count and grouping toggle */}
      <div className="flex items-center justify-between">
        <div className="font-body text-[14px] text-gray-400">
          Mostrando {groupRecurring ? groupedReservations.length : filteredReservations.length} {groupRecurring ? 'entradas' : 'reservas'} de {reservations.length} reservas totales
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={groupRecurring}
            onChange={(e) => setGroupRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-2 border-white/20 bg-white/10 text-[#dbf228] focus:ring-2 focus:ring-[#dbf228] cursor-pointer"
          />
          <span className="font-body text-[12px] text-gray-400">
            Agrupar series recurrentes
          </span>
        </label>
      </div>

      {/* Reservations Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  FECHA
                </th>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  CANCHA
                </th>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  HORARIO
                </th>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  USUARIO
                </th>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  PRECIO
                </th>
                <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                  ESTADO
                </th>
                <th className="px-6 py-4 text-right font-heading text-[14px] text-white">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedReservations.map((item) => {
                const reservation = item.reservation;
                const isSeries = item.type === 'series';
                const seriesInfo = item.type === 'series' ? item.seriesData : undefined;

                return (
                  <tr key={reservation.id} className="border-t border-white/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-[14px] text-white">
                          {new Date(reservation.reservation_date).toLocaleDateString('es-UY')}
                          {isSeries && seriesInfo && (
                            <span className="text-gray-400 text-[12px] ml-1">
                              - {new Date(seriesInfo.lastDate).toLocaleDateString('es-UY')}
                            </span>
                          )}
                        </span>
                        {isSeries && seriesInfo && (
                          <span className="bg-[#dbf228]/20 text-[#dbf228] px-2 py-0.5 rounded text-[10px] font-body">
                            SERIE ({seriesInfo.futureCount > 0 ? `${seriesInfo.futureCount} futuras` : 'finalizada'})
                          </span>
                        )}
                        {!isSeries && reservation.is_recurring && (
                          <span className="bg-[#dbf228]/20 text-[#dbf228] px-2 py-0.5 rounded text-[10px] font-body">
                            RECURRENTE
                          </span>
                        )}
                        {!reservation.user_id && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-body">
                            MANUAL
                          </span>
                        )}
                      </div>
                    </td>
                  <td className="px-6 py-4 font-body text-[14px] text-white">
                    {reservation.courts?.name}
                  </td>
                  <td className="px-6 py-4 font-body text-[14px] text-white">
                    {reservation.start_time} ({reservation.duration_minutes} min)
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-body text-[14px] text-white">
                      {reservation.user_id
                        ? (reservation.user_profiles?.full_name || reservation.customer_name || 'Sin nombre')
                        : (reservation.customer_name || 'Sin nombre')}
                    </div>
                    <div className="font-body text-[12px] text-gray-400">
                      {reservation.user_id
                        ? (reservation.user_profiles?.email || reservation.customer_email)
                        : reservation.customer_email}
                    </div>
                    {((reservation.user_id && reservation.user_profiles?.phone) || (!reservation.user_id && reservation.customer_phone)) && (
                      <div className="font-body text-[12px] text-gray-400">
                        {reservation.user_id ? reservation.user_profiles?.phone : reservation.customer_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-body text-[14px] text-white">
                    ${reservation.price}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full font-body text-[12px] ${getStatusColor(reservation.status)}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/reservations/${reservation.id}`}
                        className="bg-white/10 text-white font-body text-[12px] py-2 px-4 rounded hover:bg-white/20 transition-colors"
                      >
                        Ver
                      </Link>
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          disabled={canceling === reservation.id}
                          className="bg-red-500/20 text-red-400 font-body text-[12px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {canceling === reservation.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
