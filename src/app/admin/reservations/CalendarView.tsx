'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type Reservation = Tables<'reservations'> & {
  courts: { name: string } | null;
  user_profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};

type Court = Tables<'courts'>;

interface CalendarViewProps {
  reservations: Reservation[];
  courts: Court[];
}

export function CalendarView({ reservations, courts }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Navigate to previous/next day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format selected date as YYYY-MM-DD
  const selectedDateString = selectedDate.toISOString().split('T')[0];

  // Filter reservations for selected date
  const dayReservations = useMemo(() => {
    return reservations.filter((r) => r.reservation_date === selectedDateString);
  }, [reservations, selectedDateString]);

  // Generate time slots from 6:00 AM to 11:00 PM (every hour)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Group reservations by court
  const reservationsByCourt = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};

    courts.forEach((court) => {
      grouped[court.id] = dayReservations.filter((r) => r.court_id === court.id);
    });

    return grouped;
  }, [courts, dayReservations]);

  // Calculate position and height for reservation blocks
  const getReservationStyle = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const baseMinutes = 6 * 60; // 6:00 AM = 0px
    const pixelsPerMinute = 2; // 1 hour = 120px

    const top = (startMinutes - baseMinutes) * pixelsPerMinute;
    const height = durationMinutes * pixelsPerMinute;

    return { top: `${top}px`, height: `${height}px` };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/80 border-yellow-500',
      confirmed: 'bg-green-500/80 border-green-500',
      cancelled: 'bg-red-500/80 border-red-500',
      completed: 'bg-blue-500/80 border-blue-500',
    };
    return colors[status] || 'bg-gray-500/80 border-gray-500';
  };

  const formatDateHeader = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const totalHours = 18; // 6:00 to 23:00
  const hourHeight = 120; // px
  const totalHeight = totalHours * hourHeight;

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <h2 className="font-heading text-[16px] sm:text-[20px] text-white text-center">
              {formatDateHeader(selectedDate)}
            </h2>
            <input
              type="date"
              value={selectedDateString}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
              className="px-2 sm:px-3 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-[11px] sm:text-[12px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
            />
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 bg-[#dbf228]/20 text-[#dbf228] rounded font-body text-[10px] sm:text-[11px] hover:bg-[#dbf228]/30 transition-colors"
            >
              Hoy
            </button>
          </div>

          <button
            onClick={goToNextDay}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 sm:gap-0">
          <p className="font-body text-[13px] sm:text-[14px] text-gray-400">
            Total de reservas: <span className="text-white font-semibold">{dayReservations.length}</span>
          </p>
          <div className="flex gap-3 sm:gap-4 text-[11px] sm:text-[12px] flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500/80"></div>
              <span className="font-body text-gray-400">Confirmada</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-500/80"></div>
              <span className="font-body text-gray-400">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-500/80"></div>
              <span className="font-body text-gray-400">Cancelada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header with court names */}
            <div className="flex bg-white/5 border-b border-white/10 sticky top-0 z-10">
              <div className="w-20 flex-shrink-0 px-4 py-3 border-r border-white/10">
                <span className="font-heading text-[12px] text-gray-400">HORA</span>
              </div>
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="flex-1 min-w-[200px] px-4 py-3 border-r border-white/10 last:border-r-0"
                >
                  <span className="font-heading text-[14px] text-white">{court.name}</span>
                </div>
              ))}
            </div>

            {/* Timeline Grid */}
            <div className="flex relative">
              {/* Time column */}
              <div className="w-20 flex-shrink-0 border-r border-white/10">
                {timeSlots.map((time, idx) => (
                  <div
                    key={time}
                    className="h-[120px] px-2 py-1 border-b border-white/5 text-right"
                  >
                    <span className="font-body text-[11px] text-gray-400">{time}</span>
                  </div>
                ))}
              </div>

              {/* Court columns */}
              {courts.map((court, courtIdx) => (
                <div
                  key={court.id}
                  className="flex-1 min-w-[200px] border-r border-white/10 last:border-r-0 relative"
                  style={{ height: `${totalHeight}px` }}
                >
                  {/* Hour lines */}
                  {timeSlots.map((time, idx) => (
                    <div
                      key={time}
                      className="absolute w-full h-[120px] border-b border-white/5"
                      style={{ top: `${idx * hourHeight}px` }}
                    />
                  ))}

                  {/* Reservations */}
                  {reservationsByCourt[court.id]?.map((reservation) => {
                    const style = getReservationStyle(reservation.start_time, reservation.duration_minutes);
                    return (
                      <Link
                        key={reservation.id}
                        href={`/admin/reservations/${reservation.id}`}
                        className={`absolute left-1 right-1 rounded border-l-4 px-2 py-1 overflow-hidden hover:opacity-90 transition-opacity ${getStatusColor(reservation.status)}`}
                        style={style}
                      >
                        <div className="text-white">
                          <p className="font-body text-[11px] font-semibold truncate">
                            {reservation.start_time} - {reservation.customer_name || 'Sin nombre'}
                          </p>
                          <p className="font-body text-[10px] opacity-90 truncate">
                            {reservation.duration_minutes} min
                          </p>
                          {reservation.customer_phone && (
                            <p className="font-body text-[10px] opacity-80 truncate">
                              {reservation.customer_phone}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {dayReservations.length === 0 && (
        <div className="text-center py-12">
          <p className="font-body text-[16px] text-gray-400 mb-4">
            No hay reservas para este día
          </p>
          <Link
            href="/admin/reservations/new"
            className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-2 px-6 rounded hover:bg-[#c5db23] transition-colors"
          >
            CREAR RESERVA
          </Link>
        </div>
      )}
    </div>
  );
}
